import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { isDevUser } from '@/lib/devAuth';
import type { Seed, Root, RootCompletion } from '@/types';

const LOCAL_SEEDS_KEY = 'soumente-dev-seeds';
const LOCAL_COMPLETIONS_KEY = 'soumente-dev-root-completions';

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readLocalSeeds(): Promise<Seed[]> {
  const raw = await AsyncStorage.getItem(LOCAL_SEEDS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeLocalSeeds(seeds: Seed[]) {
  await AsyncStorage.setItem(LOCAL_SEEDS_KEY, JSON.stringify(seeds));
}

async function readLocalCompletions(): Promise<RootCompletion[]> {
  const raw = await AsyncStorage.getItem(LOCAL_COMPLETIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeLocalCompletions(completions: RootCompletion[]) {
  await AsyncStorage.setItem(LOCAL_COMPLETIONS_KEY, JSON.stringify(completions));
}

function defaultRoots(seedId: string, userId: string): Root[] {
  const now = new Date().toISOString();
  return [
    {
      id: newId('root'),
      seed_id: seedId,
      user_id: userId,
      name: 'Reflexao diaria',
      description: 'Reserve 5 minutos para pensar no seu progresso',
      type: 'daily',
      frequency: 1,
      strength: 0,
      completed_count: 0,
      created_at: now,
    },
    {
      id: newId('root'),
      seed_id: seedId,
      user_id: userId,
      name: 'Acao concreta',
      description: 'Faca pelo menos uma coisa que te aproxime do objetivo',
      type: 'daily',
      frequency: 1,
      strength: 0,
      completed_count: 0,
      created_at: now,
    },
    {
      id: newId('root'),
      seed_id: seedId,
      user_id: userId,
      name: 'Revisao semanal',
      description: 'Avalie o que funcionou e o que precisa mudar',
      type: 'weekly',
      frequency: 1,
      strength: 0,
      completed_count: 0,
      created_at: now,
    },
  ];
}

function updateLocalSeedStatus(seed: Seed): Seed {
  const roots = seed.roots || [];
  if (roots.length === 0) return seed;

  const avg = roots.reduce((acc, root) => acc + (root.strength || 0), 0) / roots.length;
  let status: Seed['status'] = 'planted';
  if (avg >= 30) status = 'growing';
  if (avg >= 70) status = 'fruiting';
  return { ...seed, status };
}

export async function getActiveSeed(userId: string): Promise<Seed | null> {
  if (isDevUser(userId)) {
    const seeds = await readLocalSeeds();
    return seeds
      .filter(seed => seed.user_id === userId && seed.status !== 'harvested')
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
  }

  const { data, error } = await supabase
    .from('seeds')
    .select('*, roots(*), fruits(*)')
    .eq('user_id', userId)
    .neq('status', 'harvested')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSeeds(userId: string): Promise<Seed[]> {
  if (isDevUser(userId)) {
    const seeds = await readLocalSeeds();
    return seeds
      .filter(seed => seed.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const { data, error } = await supabase
    .from('seeds')
    .select('*, roots(*), fruits(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createSeed(userId: string, seed: Partial<Seed>): Promise<Seed> {
  if (isDevUser(userId)) {
    const now = new Date().toISOString();
    const localSeed: Seed = {
      id: newId('seed'),
      user_id: userId,
      name: seed.name || 'Nova semente',
      type: seed.type || 'custom',
      why: seed.why,
      for_whom: seed.for_whom,
      deadline: seed.deadline,
      status: 'seed',
      created_at: now,
      roots: [],
      fruits: [],
    };
    const seeds = await readLocalSeeds();
    await writeLocalSeeds([localSeed, ...seeds]);
    return localSeed;
  }

  const { data, error } = await supabase
    .from('seeds')
    .insert({ ...seed, user_id: userId, status: 'seed' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSeedById(seedId: string, userId: string): Promise<Seed | null> {
  if (isDevUser(userId)) {
    const seeds = await readLocalSeeds();
    return seeds.find(seed => seed.id === seedId && seed.user_id === userId) ?? null;
  }

  const { data, error } = await supabase
    .from('seeds')
    .select('*, roots(*), fruits(*)')
    .eq('id', seedId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateSeed(
  seedId: string,
  userId: string,
  seed: Partial<Pick<Seed, 'name' | 'type' | 'why' | 'for_whom' | 'deadline'>>
): Promise<Seed> {
  if (isDevUser(userId)) {
    const seeds = await readLocalSeeds();
    let updated: Seed | null = null;
    const next = seeds.map(current => {
      if (current.id !== seedId || current.user_id !== userId) return current;
      updated = { ...current, ...seed };
      return updated;
    });
    await writeLocalSeeds(next);
    if (!updated) throw new Error('Seed not found');
    return updated;
  }

  const { data, error } = await supabase
    .from('seeds')
    .update(seed)
    .eq('id', seedId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSeed(seedId: string, userId: string): Promise<void> {
  if (isDevUser(userId)) {
    const seeds = await readLocalSeeds();
    const seed = seeds.find(current => current.id === seedId && current.user_id === userId);
    const rootIds = seed?.roots?.map(root => root.id) ?? [];
    await writeLocalSeeds(seeds.filter(seed => seed.id !== seedId || seed.user_id !== userId));
    const completions = await readLocalCompletions();
    await writeLocalCompletions(completions.filter(completion => !rootIds.includes(completion.root_id)));
    return;
  }

  const { data: roots, error: rootsSelectError } = await supabase
    .from('roots')
    .select('id')
    .eq('seed_id', seedId)
    .eq('user_id', userId);

  if (rootsSelectError) throw rootsSelectError;

  const rootIds = roots?.map(root => root.id) || [];

  if (rootIds.length > 0) {
    const { error: completionsError } = await supabase
      .from('root_completions')
      .delete()
      .in('root_id', rootIds)
      .eq('user_id', userId);

    if (completionsError) throw completionsError;
  }

  const { error: diaryError } = await supabase
    .from('diary_entries')
    .update({ seed_id: null })
    .eq('seed_id', seedId)
    .eq('user_id', userId);

  if (diaryError) throw diaryError;

  const { error: rootsError } = await supabase
    .from('roots')
    .delete()
    .eq('seed_id', seedId)
    .eq('user_id', userId);

  if (rootsError) throw rootsError;

  const { error: fruitsError } = await supabase
    .from('fruits')
    .delete()
    .eq('seed_id', seedId)
    .eq('user_id', userId);

  if (fruitsError) throw fruitsError;

  const { error: seedError } = await supabase
    .from('seeds')
    .delete()
    .eq('id', seedId)
    .eq('user_id', userId);

  if (seedError) throw seedError;
}

export async function plantSeed(
  seedId: string,
  userId: string,
  answers: string[]
): Promise<void> {
  if (isDevUser(userId)) {
    const seeds = await readLocalSeeds();
    const next = seeds.map(seed => {
      if (seed.id !== seedId || seed.user_id !== userId) return seed;
      return {
        ...seed,
        status: 'planted' as const,
        planted_at: new Date().toISOString(),
        ai_questions: answers,
        roots: seed.roots?.length ? seed.roots : defaultRoots(seedId, userId),
      };
    });
    await writeLocalSeeds(next);
    return;
  }

  const { error: seedError } = await supabase
    .from('seeds')
    .update({
      status: 'planted',
      planted_at: new Date().toISOString(),
      ai_questions: answers,
    })
    .eq('id', seedId)
    .eq('user_id', userId);

  if (seedError) throw seedError;

  const roots = [
    {
      name: 'Reflexao diaria',
      description: 'Reserve 5 minutos para pensar no seu progresso',
      type: 'daily',
      frequency: 1,
    },
    {
      name: 'Acao concreta',
      description: 'Faca pelo menos uma coisa que te aproxime do objetivo',
      type: 'daily',
      frequency: 1,
    },
    {
      name: 'Revisao semanal',
      description: 'Avalie o que funcionou e o que precisa mudar',
      type: 'weekly',
      frequency: 1,
    },
  ];

  const { error: rootsError } = await supabase.from('roots').insert(
    roots.map(r => ({ ...r, seed_id: seedId, user_id: userId }))
  );

  if (rootsError) throw rootsError;
}

export async function plantSeedManual(
  userId: string,
  name: string,
  type: string,
  why: string
): Promise<void> {
  if (isDevUser(userId)) {
    const seed = await createSeed(userId, { name, type: type as Seed['type'], why });
    await plantSeed(seed.id, userId, []);
    return;
  }

  const { data: seed, error: seedError } = await supabase
    .from('seeds')
    .insert({
      user_id: userId,
      name,
      type,
      why,
      status: 'planted',
      planted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (seedError) throw seedError;

  const roots = [
    {
      name: 'Reflexao diaria',
      description: 'Reserve 5 minutos para pensar no seu progresso',
      type: 'daily',
      frequency: 1,
    },
    {
      name: 'Acao concreta',
      description: 'Faca pelo menos uma coisa que te aproxime do objetivo',
      type: 'daily',
      frequency: 1,
    },
    {
      name: 'Revisao semanal',
      description: 'Avalie o que funcionou e o que precisa mudar',
      type: 'weekly',
      frequency: 1,
    },
  ];

  await supabase.from('roots').insert(
    roots.map(r => ({ ...r, seed_id: seed.id, user_id: userId }))
  );
}

export async function waterRoot(
  rootId: string,
  userId: string,
  note?: string
): Promise<void> {
  if (isDevUser(userId)) {
    const now = new Date().toISOString();
    const completion: RootCompletion = {
      id: newId('completion'),
      root_id: rootId,
      user_id: userId,
      note,
      completed_at: now,
    };
    const completions = await readLocalCompletions();
    await writeLocalCompletions([completion, ...completions]);

    const seeds = await readLocalSeeds();
    const next = seeds.map(seed => {
      const roots = seed.roots || [];
      if (!roots.some(root => root.id === rootId)) return seed;

      const updatedRoots = roots.map(root => {
        if (root.id !== rootId) return root;
        return {
          ...root,
          strength: Math.min((root.strength || 0) + 10, 100),
          completed_count: (root.completed_count || 0) + 1,
          last_completed_at: now,
        };
      });

      return updateLocalSeedStatus({ ...seed, roots: updatedRoots });
    });
    await writeLocalSeeds(next);
    return;
  }

  await supabase
    .from('root_completions')
    .insert({ root_id: rootId, user_id: userId, note });

  const { data: root } = await supabase
    .from('roots')
    .select('strength, completed_count, seed_id')
    .eq('id', rootId)
    .single();

  const newStrength = Math.min((root?.strength || 0) + 10, 100);
  const newCount = (root?.completed_count || 0) + 1;

  await supabase
    .from('roots')
    .update({
      strength: newStrength,
      completed_count: newCount,
      last_completed_at: new Date().toISOString(),
    })
    .eq('id', rootId);

  await updateSeedStatus(root?.seed_id);
}

async function updateSeedStatus(seedId: string): Promise<void> {
  if (!seedId) return;

  const { data: roots } = await supabase
    .from('roots')
    .select('strength')
    .eq('seed_id', seedId);

  if (!roots || roots.length === 0) return;

  const avg = roots.reduce((acc, r) => acc + r.strength, 0) / roots.length;

  let status = 'planted';
  if (avg >= 30) status = 'growing';
  if (avg >= 70) status = 'fruiting';

  await supabase.from('seeds').update({ status }).eq('id', seedId);
}

export async function wasWateredToday(rootId: string, userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  if (isDevUser(userId)) {
    const completions = await readLocalCompletions();
    return completions.some(completion =>
      completion.root_id === rootId &&
      completion.user_id === userId &&
      completion.completed_at.startsWith(today)
    );
  }

  const { data } = await supabase
    .from('root_completions')
    .select('id')
    .eq('root_id', rootId)
    .eq('user_id', userId)
    .gte('completed_at', `${today}T00:00:00`)
    .limit(1);
  return (data?.length || 0) > 0;
}
