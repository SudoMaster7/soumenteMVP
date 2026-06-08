import { supabase } from '@/lib/supabase';
import type { Seed, Root } from '@/types';

export async function getActiveSeed(userId: string): Promise<Seed | null> {
  const { data } = await supabase
    .from('seeds')
    .select('*, roots(*), fruits(*)')
    .eq('user_id', userId)
    .neq('status', 'harvested')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function createSeed(userId: string, seed: Partial<Seed>): Promise<Seed> {
  const { data, error } = await supabase
    .from('seeds')
    .insert({ ...seed, user_id: userId, status: 'seed' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function plantSeedManual(
  userId: string,
  name: string,
  type: string,
  why: string
): Promise<void> {
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
      name: 'Reflexão diária',
      description: 'Reserve 5 minutos para pensar no seu progresso',
      type: 'daily',
      frequency: 1,
    },
    {
      name: 'Ação concreta',
      description: 'Faça pelo menos uma coisa que te aproxime do objetivo',
      type: 'daily',
      frequency: 1,
    },
    {
      name: 'Revisão semanal',
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
  const { data } = await supabase
    .from('root_completions')
    .select('id')
    .eq('root_id', rootId)
    .eq('user_id', userId)
    .gte('completed_at', `${today}T00:00:00`)
    .limit(1);
  return (data?.length || 0) > 0;
}
