import { supabase } from '@/lib/supabase';
import { isDevUser } from '@/lib/devAuth';
import { getWeekEntries } from './diaryService';
import { getActiveSeed } from './seedService';

export async function generateWeeklyReport(userId: string): Promise<string> {
  const [entries, seed] = await Promise.all([
    getWeekEntries(userId),
    getActiveSeed(userId),
  ]);

  if (entries.length === 0) {
    return 'Registre pelo menos 1 dia no diÃ¡rio para gerar seu relatÃ³rio semanal.';
  }

  const emotionCount: Record<string, number> = {};
  entries.forEach(e => {
    emotionCount[e.emotion_primary] = (emotionCount[e.emotion_primary] || 0) + 1;
  });
  const dominant = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0];

  const roots = seed?.roots || [];
  const rootsText = roots.map(r => `${r.name}: ${r.completed_count} vezes`).join(', ');

  const report = `RELATÃ“RIO DA SEMANA

ðŸ“Š ${entries.length} dias registrados

ðŸ˜¶ EmoÃ§Ã£o dominante: ${dominant?.[0] || 'variada'} (${dominant?.[1] || 0}x)

ðŸŒ± Semente: ${seed?.name || 'nenhuma ativa'}
${rootsText ? `ðŸŒ¿ RaÃ­zes: ${rootsText}` : ''}

${entries.length >= 5
    ? 'âœ¦ Semana consistente. VocÃª regou sua mente todos os dias.'
    : entries.length >= 3
      ? 'âœ¦ Boa semana. Continue construindo o hÃ¡bito.'
      : 'âœ¦ Semana desafiadora. AmanhÃ£ Ã© uma nova oportunidade.'}`.trim();

  const weekStart = entries[0]?.entry_date;
  const weekEnd = entries[entries.length - 1]?.entry_date;

  if (!isDevUser(userId)) {
    await supabase.from('ai_reports').insert({
      user_id: userId,
      week_start: weekStart,
      week_end: weekEnd,
      pattern_analysis: report,
      dominant_emotion: dominant?.[0],
      generated_at: new Date().toISOString(),
    });
  }

  return report;
}

