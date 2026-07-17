import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_TEMPLATES } from '@/constants/treino';
import type { TreinoExercise, TreinoTemplate, TreinoSession } from '@/types/treino';

const normalizeExercise = (exercise: TreinoExercise): TreinoExercise => ({
  ...exercise,
  difficulty: exercise.difficulty ?? 'medio',
});

const normalizeTemplate = (template: TreinoTemplate): TreinoTemplate => ({
  ...template,
  exercises: template.exercises.map(normalizeExercise),
});

const normalizeSession = (session: TreinoSession): TreinoSession => ({
  ...session,
  exercises: session.exercises.map(normalizeExercise),
});

const STORE_KEY = 'treino-store';

interface TreinoState {
  templates: TreinoTemplate[];
  sessions: TreinoSession[];

  addTemplate: (template: TreinoTemplate) => void;
  updateTemplate: (templateId: string, patch: Partial<TreinoTemplate>) => void;
  deleteTemplate: (templateId: string) => void;

  addSession: (session: TreinoSession) => void;
  updateSession: (sessionId: string, patch: Partial<TreinoSession>) => void;
  deleteSession: (sessionId: string) => void;
}

type TreinoSnapshot = Pick<TreinoState, 'templates' | 'sessions'>;

const createSnapshot = (state: TreinoState): TreinoSnapshot => ({
  templates: state.templates,
  sessions: state.sessions,
});

const saveSnapshot = async (state: TreinoState) => {
  try {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(createSnapshot(state)));
  } catch (error) {
    console.warn('Failed to persist Treino store', error);
  }
};

export const useTreinoStore = create<TreinoState>((set, get) => {
  const setAndPersist: typeof set = (partial, replace) => {
    set(partial as Parameters<typeof set>[0], replace as Parameters<typeof set>[1]);
    void saveSnapshot(get());
  };

  return {
    templates: DEFAULT_TEMPLATES,
    sessions: [],

    addTemplate: (template) => setAndPersist((s) => ({ templates: [...s.templates, template] })),
    updateTemplate: (templateId, patch) =>
      setAndPersist((s) => ({
        templates: s.templates.map((t) => (t.id === templateId ? { ...t, ...patch } : t)),
      })),
    deleteTemplate: (templateId) =>
      setAndPersist((s) => ({ templates: s.templates.filter((t) => t.id !== templateId) })),

    addSession: (session) => setAndPersist((s) => ({ sessions: [session, ...s.sessions] })),
    updateSession: (sessionId, patch) =>
      setAndPersist((s) => ({
        sessions: s.sessions.map((sess) => (sess.id === sessionId ? { ...sess, ...patch } : sess)),
      })),
    deleteSession: (sessionId) =>
      setAndPersist((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== sessionId) })),
  };
});

const hydrateTreinoStore = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (!raw) return;

    const snapshot = JSON.parse(raw) as Partial<TreinoSnapshot>;
    useTreinoStore.setState({
      templates: (snapshot.templates ?? DEFAULT_TEMPLATES).map(normalizeTemplate),
      sessions: (snapshot.sessions ?? []).map(normalizeSession),
    });
  } catch (error) {
    console.warn('Failed to hydrate Treino store', error);
  }
};

void hydrateTreinoStore();
