import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fmtBRL } from '@/constants/supereu';
import { useTheme } from '@/lib/theme';
import { useSuperEuStore } from '@/stores/superEuStore';
import type { SEFinanceEntry } from '@/types/supereu';

const parseMoney = (value: string) => Number(value.replace(',', '.')) || 0;

export default function FinancasModule() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { finance, addFinanceEntry, updateFinanceEntry, deleteFinanceEntry } = useSuperEuStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: 'income' as 'income' | 'expense', source: '', amount: '', note: '' });

  const totals = useMemo(() => {
    const income = finance.filter((entry) => entry.type === 'income').reduce((total, entry) => total + Math.abs(entry.amount), 0);
    const expense = finance.filter((entry) => entry.type === 'expense').reduce((total, entry) => total + Math.abs(entry.amount), 0);
    return { income, expense, balance: income - expense };
  }, [finance]);

  function resetForm() {
    setForm({ type: 'income', source: '', amount: '', note: '' });
    setEditingEntryId(null);
  }

  function openAdd() {
    resetForm();
    setShowAdd(true);
  }

  function openEdit(entry: SEFinanceEntry) {
    setForm({
      type: entry.type,
      source: entry.source,
      amount: String(Math.abs(entry.amount)),
      note: entry.note,
    });
    setEditingEntryId(entry.id);
    setShowAdd(true);
  }

  function handleSave() {
    if (!form.source.trim() || !form.amount.trim()) return;
    const amount = parseMoney(form.amount);
    const signedAmount = form.type === 'income' ? amount : -amount;
    if (editingEntryId) {
      updateFinanceEntry(editingEntryId, {
        type: form.type,
        source: form.source.trim(),
        amount: signedAmount,
        note: form.note.trim(),
      });
      resetForm();
      setShowAdd(false);
      return;
    }
    const entry: SEFinanceEntry = {
      id: Date.now().toString(),
      type: form.type,
      source: form.source.trim(),
      amount: signedAmount,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      note: form.note.trim(),
    };
    addFinanceEntry(entry);
    resetForm();
    setShowAdd(false);
  }

  const positive = totals.balance >= 0;

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={styles.balanceHeader}>
          <View style={[styles.balanceIcon, { backgroundColor: positive ? colors.successSoft : colors.dangerSoft }]}> 
            <Ionicons name={positive ? 'trending-up-outline' : 'trending-down-outline'} size={23} color={positive ? colors.success : colors.danger} />
          </View>
          <View style={styles.balanceTextWrap}>
            <Text style={[styles.balanceLabel, { color: colors.muted }]}>Saldo disponivel</Text>
            <Text style={[styles.balanceValue, { color: positive ? colors.success : colors.danger }]}>{fmtBRL(totals.balance)}</Text>
          </View>
        </View>
        <Text style={[styles.balanceSub, { color: colors.muted }]}> 
          {positive ? 'Fluxo positivo. Continue protegendo sua margem.' : 'Fluxo negativo. Revise saidas antes de assumir novos custos.'}
        </Text>
      </View>

      <View style={styles.flowRow}>
        <FlowCard label="Entradas" value={fmtBRL(totals.income)} icon="arrow-down-circle-outline" tone="success" />
        <FlowCard label="Saidas" value={fmtBRL(totals.expense)} icon="arrow-up-circle-outline" tone="danger" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Lancamentos</Text>
        <Text style={[styles.sectionCount, { color: colors.muted }]}>{finance.length} registros</Text>
      </View>

      {finance.map((entry) => {
        const isIncome = entry.type === 'income';
        return (
          <View key={entry.id} style={[styles.entryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={[styles.entryIcon, { backgroundColor: isIncome ? colors.successSoft : colors.dangerSoft }]}> 
              <Ionicons name={isIncome ? 'arrow-down-outline' : 'arrow-up-outline'} size={16} color={isIncome ? colors.success : colors.danger} />
            </View>
            <View style={styles.entryInfo}>
              <Text style={[styles.entrySource, { color: colors.text }]}>{entry.source}</Text>
              {entry.note ? <Text style={[styles.entryNote, { color: colors.muted }]}>{entry.note}</Text> : null}
              <Text style={[styles.entryDate, { color: colors.subtle }]}>{entry.date}</Text>
            </View>
            <View style={styles.entryRight}>
              <Text style={[styles.entryAmount, { color: isIncome ? colors.success : colors.danger }]}> 
                {isIncome ? '+' : '-'}{fmtBRL(entry.amount)}
              </Text>
              <View style={styles.entryActionRow}>
                <TouchableOpacity
                  style={[styles.entryActionButton, { backgroundColor: colors.primarySoft }]}
                  onPress={() => openEdit(entry)}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar lancamento ${entry.source}`}
                >
                  <Ionicons name="create-outline" size={15} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.entryActionButton, { backgroundColor: colors.dangerSoft }]}
                  onPress={() => deleteFinanceEntry(entry.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Excluir lancamento ${entry.source}`}
                >
                  <Ionicons name="trash-outline" size={15} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}

      {finance.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Ionicons name="receipt-outline" size={26} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sem lancamentos</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Registre uma entrada ou saida para enxergar o fluxo.</Text>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={openAdd}>
        <Ionicons name="add-circle-outline" size={18} color={colors.primaryText} />
        <Text style={[styles.addButtonText, { color: colors.primaryText }]}>Registrar fluxo</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => { resetForm(); setShowAdd(false); }}>
        <Pressable style={styles.overlay} onPress={() => { resetForm(); setShowAdd(false); }} />
        <View style={[styles.sheet, { backgroundColor: colors.surfaceElevated }]}> 
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{editingEntryId ? 'Editar lancamento' : 'Novo lancamento'}</Text>
            <TouchableOpacity onPress={() => { resetForm(); setShowAdd(false); }} style={[styles.closeButton, { backgroundColor: colors.backgroundAlt }]}> 
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.typeSegment, { backgroundColor: colors.backgroundAlt }]}> 
            <TouchableOpacity
              style={[styles.typeButton, form.type === 'income' && { backgroundColor: colors.success }]}
              onPress={() => setForm((current) => ({ ...current, type: 'income' }))}
            >
              <Ionicons name="arrow-down-outline" size={15} color={form.type === 'income' ? colors.primaryText : colors.muted} />
              <Text style={[styles.typeButtonText, { color: form.type === 'income' ? colors.primaryText : colors.muted }]}>Entrada</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, form.type === 'expense' && { backgroundColor: colors.danger }]}
              onPress={() => setForm((current) => ({ ...current, type: 'expense' }))}
            >
              <Ionicons name="arrow-up-outline" size={15} color={form.type === 'expense' ? colors.primaryText : colors.muted} />
              <Text style={[styles.typeButtonText, { color: form.type === 'expense' ? colors.primaryText : colors.muted }]}>Saida</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="Fonte ou destino" placeholderTextColor={colors.subtle} value={form.source} onChangeText={(source) => setForm((current) => ({ ...current, source }))} />
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="Valor em R$" placeholderTextColor={colors.subtle} keyboardType="decimal-pad" value={form.amount} onChangeText={(amount) => setForm((current) => ({ ...current, amount }))} />
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="Observacao opcional" placeholderTextColor={colors.subtle} value={form.note} onChangeText={(note) => setForm((current) => ({ ...current, note }))} />
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={[styles.submitButtonText, { color: colors.primaryText }]}>{editingEntryId ? 'Salvar alteracoes' : 'Salvar lancamento'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );

  function FlowCard({ label, value, icon, tone }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; tone: 'success' | 'danger' }) {
    const color = tone === 'success' ? colors.success : colors.danger;
    const soft = tone === 'success' ? colors.successSoft : colors.dangerSoft;
    return (
      <View style={[styles.flowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={[styles.flowIcon, { backgroundColor: soft }]}> 
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.flowLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.flowValue, { color }]}>{value}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  balanceCard: { borderRadius: 10, padding: 17, borderWidth: 1, marginBottom: 12 },
  balanceHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  balanceIcon: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  balanceTextWrap: { flex: 1 },
  balanceLabel: { fontSize: 12, fontWeight: '800', marginBottom: 4 },
  balanceValue: { fontSize: 30, fontWeight: '900' },
  balanceSub: { fontSize: 13, lineHeight: 19 },
  flowRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  flowCard: { flex: 1, borderRadius: 10, padding: 13, borderWidth: 1, minHeight: 112 },
  flowIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  flowLabel: { fontSize: 12, fontWeight: '800', marginBottom: 5 },
  flowValue: { fontSize: 17, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '900' },
  sectionCount: { fontSize: 12, fontWeight: '700' },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 10, padding: 13, borderWidth: 1, marginBottom: 9 },
  entryIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  entryInfo: { flex: 1 },
  entrySource: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  entryNote: { fontSize: 12, lineHeight: 17 },
  entryDate: { fontSize: 11, marginTop: 3, fontWeight: '700' },
  entryRight: { alignItems: 'flex-end', gap: 7 },
  entryAmount: { fontSize: 14, fontWeight: '900' },
  entryActionRow: { flexDirection: 'row', gap: 6 },
  entryActionButton: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { borderRadius: 10, borderWidth: 1, padding: 18, alignItems: 'center', gap: 7, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '900' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  addButton: { borderRadius: 10, padding: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  addButtonText: { fontSize: 14, fontWeight: '900' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, paddingBottom: 32 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '900' },
  closeButton: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  typeSegment: { flexDirection: 'row', gap: 8, borderRadius: 10, padding: 5, marginBottom: 12 },
  typeButton: { flex: 1, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  typeButtonText: { fontSize: 13, fontWeight: '900' },
  input: { borderRadius: 10, borderWidth: 1, padding: 14, fontSize: 15, marginBottom: 12 },
  submitButton: { borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 2 },
  submitButtonText: { fontSize: 14, fontWeight: '900' },
});
