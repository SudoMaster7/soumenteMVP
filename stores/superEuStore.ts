import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_HABITS, DEFAULT_PURCHASES, DEFAULT_FINANCE,
} from '@/constants/supereu';
import type {
  SEHabit, SEPurchase, SEFinanceEntry, SEDiaryEntry, OraclePhrase,
} from '@/types/supereu';

const STORE_KEY = 'super-eu-store';
const DEFAULT_PAID_AI_ENABLED = process.env.EXPO_PUBLIC_USE_MOCK_AI === 'false';

interface SuperEuState {
  habits: SEHabit[];
  purchases: SEPurchase[];
  finance: SEFinanceEntry[];
  diary: SEDiaryEntry[];
  oracle: OraclePhrase | null;
  oracleDateKey: string; // YYYY-MM-DD
  paidAiEnabled: boolean;

  // Habits
  toggleHabitDay: (habitId: string, dayIndex: number) => void;
  addHabit: (habit: SEHabit) => void;
  updateHabit: (habitId: string, patch: Partial<Pick<SEHabit, 'icon' | 'name' | 'category' | 'time'>>) => void;
  deleteHabit: (habitId: string) => void;

  // Purchases
  togglePurchase: (purchaseId: string) => void;
  addPurchase: (purchase: SEPurchase) => void;
  updatePurchase: (purchaseId: string, patch: Partial<SEPurchase>) => void;
  deletePurchase: (purchaseId: string) => void;

  // Finance
  addFinanceEntry: (entry: SEFinanceEntry) => void;
  updateFinanceEntry: (entryId: string, patch: Partial<SEFinanceEntry>) => void;
  deleteFinanceEntry: (entryId: string) => void;

  // Diary
  addDiaryEntry: (entry: SEDiaryEntry) => void;
  updateDiaryEntry: (entryId: string, patch: Partial<SEDiaryEntry>) => void;
  updateDiaryReflection: (entryId: string, reflection: string) => void;
  deleteDiaryEntry: (entryId: string) => void;

  // Oracle
  setOracle: (oracle: OraclePhrase, dateKey: string) => void;

  // Preferences
  setPaidAiEnabled: (enabled: boolean) => void;
  togglePaidAi: () => void;
}

type SuperEuSnapshot = Pick<
  SuperEuState,
  'habits' | 'purchases' | 'finance' | 'diary' | 'oracle' | 'oracleDateKey' | 'paidAiEnabled'
>;

const createSnapshot = (state: SuperEuState): SuperEuSnapshot => ({
  habits: state.habits,
  purchases: state.purchases,
  finance: state.finance,
  diary: state.diary,
  oracle: state.oracle,
  oracleDateKey: state.oracleDateKey,
  paidAiEnabled: state.paidAiEnabled,
});

const saveSnapshot = async (state: SuperEuState) => {
  try {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(createSnapshot(state)));
  } catch (error) {
    console.warn('Failed to persist Super Eu store', error);
  }
};

export const useSuperEuStore = create<SuperEuState>((set, get) => {
  const setAndPersist: typeof set = (partial, replace) => {
    set(partial as Parameters<typeof set>[0], replace as Parameters<typeof set>[1]);
    void saveSnapshot(get());
  };

  return {
    habits: DEFAULT_HABITS,
    purchases: DEFAULT_PURCHASES,
    finance: DEFAULT_FINANCE,
    diary: [],
    oracle: null,
    oracleDateKey: '',
    paidAiEnabled: DEFAULT_PAID_AI_ENABLED,

    toggleHabitDay: (habitId, dayIndex) =>
      setAndPersist((s) => ({
        habits: s.habits.map((h) => {
          if (h.id !== habitId) return h;
          const days = [...h.days];
          days[dayIndex] = !days[dayIndex];
          const streak = days.filter(Boolean).length;
          return { ...h, days, streak };
        }),
      })),

    addHabit: (habit) => setAndPersist((s) => ({ habits: [...s.habits, habit] })),
    updateHabit: (habitId, patch) =>
      setAndPersist((s) => ({
        habits: s.habits.map((h) => (h.id === habitId ? { ...h, ...patch } : h)),
      })),
    deleteHabit: (habitId) =>
      setAndPersist((s) => ({ habits: s.habits.filter((h) => h.id !== habitId) })),

    togglePurchase: (purchaseId) =>
      setAndPersist((s) => ({
        purchases: s.purchases.map((p) =>
          p.id === purchaseId ? { ...p, done: !p.done } : p
        ),
      })),
    addPurchase: (purchase) =>
      setAndPersist((s) => ({ purchases: [...s.purchases, purchase] })),
    updatePurchase: (purchaseId, patch) =>
      setAndPersist((s) => ({
        purchases: s.purchases.map((p) => (p.id === purchaseId ? { ...p, ...patch } : p)),
      })),
    deletePurchase: (purchaseId) =>
      setAndPersist((s) => ({ purchases: s.purchases.filter((p) => p.id !== purchaseId) })),

    addFinanceEntry: (entry) =>
      setAndPersist((s) => ({ finance: [entry, ...s.finance] })),
    updateFinanceEntry: (entryId, patch) =>
      setAndPersist((s) => ({
        finance: s.finance.map((e) => (e.id === entryId ? { ...e, ...patch } : e)),
      })),
    deleteFinanceEntry: (entryId) =>
      setAndPersist((s) => ({ finance: s.finance.filter((e) => e.id !== entryId) })),

    addDiaryEntry: (entry) =>
      setAndPersist((s) => ({ diary: [entry, ...s.diary] })),
    updateDiaryEntry: (entryId, patch) =>
      setAndPersist((s) => ({
        diary: s.diary.map((e) => (e.id === entryId ? { ...e, ...patch } : e)),
      })),
    updateDiaryReflection: (entryId, reflection) =>
      setAndPersist((s) => ({
        diary: s.diary.map((e) =>
          e.id === entryId ? { ...e, aiReflection: reflection } : e
        ),
      })),
    deleteDiaryEntry: (entryId) =>
      setAndPersist((s) => ({ diary: s.diary.filter((e) => e.id !== entryId) })),

    setOracle: (oracle, dateKey) => setAndPersist({ oracle, oracleDateKey: dateKey }),

    setPaidAiEnabled: (enabled) => setAndPersist({ paidAiEnabled: enabled }),
    togglePaidAi: () => setAndPersist((s) => ({ paidAiEnabled: !s.paidAiEnabled })),
  };
});

const hydrateSuperEuStore = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (!raw) return;

    const snapshot = JSON.parse(raw) as Partial<SuperEuSnapshot>;
    useSuperEuStore.setState({
      habits: (snapshot.habits ?? DEFAULT_HABITS).map((h) => ({ ...h, category: h.category ?? 'manha' })),
      purchases: snapshot.purchases ?? DEFAULT_PURCHASES,
      finance: snapshot.finance ?? DEFAULT_FINANCE,
      diary: snapshot.diary ?? [],
      oracle: snapshot.oracle ?? null,
      oracleDateKey: snapshot.oracleDateKey ?? '',
      paidAiEnabled: snapshot.paidAiEnabled ?? DEFAULT_PAID_AI_ENABLED,
    });
  } catch (error) {
    console.warn('Failed to hydrate Super Eu store', error);
  }
};

void hydrateSuperEuStore();
