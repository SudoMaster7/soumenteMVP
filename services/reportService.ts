import { supabase } from '@/lib/supabase';
import { getWeekEntries } from './diaryService';
import { getActiveSeed } from './seedService';

export async function generateWeeklyReport(userId: string): Promise<string> {
  const [entries, seed] = await Promise.all([
    getWeekEntries(userId),
    getActiveSeed(userId),
  ]);

  if (entries.length === 0) {
    return 'Registre pelo menos 1 dia no diário para gerar seu relatório semanal.';
  }

  const emotionCount: Record<string, number> = {};
  entries.forEach(e => {
    emotionCount[e.emotion_primary] = (emotionCount[e.emotion_primary] || 0) + 1;
  });
  const dominant = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0];

  const roots = seed?.roots || [];
  const rootsText = roots.map(r => `${r.name}: ${r.completed_count} vezes`).join(', ');

  const report = `RELATÓRIO DA SEMANA

📊 ${entries.length} dias registrados

😶 Emoção dominante: ${dominant?.[0] || 'variada'} (${dominant?.[1] || 0}x)

🌱 Semente: ${seed?.name || 'nenhuma ativa'}
${rootsText ? `🌿 Raízes: ${rootsText}` : ''}

${entries.length >= 5
    ? '✦ Semana consistente. Você regou sua mente todos os dias.'
    : entries.length >= 3
      ? '✦ Boa semana. Continue construindo o hábito.'
      : '✦ Semana desafiadora. Amanhã é uma nova oportunidade.'}`.trim();

  const weekStart = entries[0]?.entry_date;
  const weekEnd = entries[entries.length - 1]?.entry_date;

  await supabase.from('ai_reports').insert({
    user_id: userId,
    week_start: weekStart,
    week_end: weekEnd,
    pattern_analysis: report,
    dominant_emotion: dominant?.[0],
    generated_at: new Date().toISOString(),
  });

  return report;
}
