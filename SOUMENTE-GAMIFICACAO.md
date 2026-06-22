# SouMente: gamificacao, conquistas e niveis

Este documento define os gatilhos numericos para conquistas e a formula de pontuacao dos Niveis de Consciencia.

O objetivo e transformar progresso invisivel em reconhecimento claro, sem criar uma gamificacao vazia. A regra principal e: o sistema deve celebrar continuidade, retorno e cultivo real.

## Principios

- Conquistas reconhecem identidade, nao apenas pontos.
- Niveis nunca diminuem depois de desbloqueados.
- O usuario nao deve ver uma lista enorme de conquistas bloqueadas.
- O sistema pode mostrar a proxima conquista provavel, mas nao precisa mostrar todas.
- Toda pontuacao deve ser derivada de dados ja existentes no produto.

## Dados usados

| Dado | Origem tecnica | Descricao |
|---|---|---|
| `diaryEntries` | `getDiaryHistory` | Total de registros emocionais do usuario |
| `streak` | `getStreak` | Sequencia atual de dias com registro |
| `seeds` | `getSeeds` | Total de sementes criadas |
| `activeSeeds` | `getSeeds` | Sementes nao colhidas ou nao deletadas |
| `roots` | `seed.roots` | Raizes ligadas as sementes |
| `strongRoots` | `root.strength >= 80` | Raizes consideradas fortes |
| `legendaryRoots` | `root.strength >= 100` | Raizes completamente fortalecidas |
| `completedRoots` | soma de `root.completed_count` | Total de regas registradas |
| `weeklyReportsRead` | futuro evento ou tabela | Quantidade de relatorios semanais abertos |
| `oldestSeedDays` | `seed.created_at` | Dias desde a primeira semente |

## Pontuacao de consciencia

A pontuacao de consciencia e uma soma ponderada. Ela serve para calcular progresso visual dentro do nivel atual.

```text
consciousnessScore =
  min(diaryEntries, 120) * 2
  + min(streak, 60) * 6
  + seeds * 25
  + activeSeeds * 15
  + strongRoots * 35
  + legendaryRoots * 50
  + completedRoots * 4
  + weeklyReportsRead * 20
```

### Limites de protecao

- `diaryEntries` conta no maximo 120 registros.
- `streak` conta no maximo 60 dias.
- `completedRoots` pode crescer indefinidamente, mas recomenda-se revisar se passar de 500.
- O nivel desbloqueado deve ser salvo no perfil ou storage para nunca regredir.

## Niveis de Consciencia

| Nivel | Nome | Pontuacao minima | Gatilho obrigatorio | Progresso ate o proximo |
|---|---:|---:|---|---|
| 1 | Semente | 0 | Criar conta ou entrar no modo dev | 0 a 120 pontos |
| 2 | Broto | 120 | `streak >= 7` ou `diaryEntries >= 10` | 120 a 300 pontos |
| 3 | Raiz Forte | 300 | `strongRoots >= 1` | 300 a 650 pontos |
| 4 | Arvore Jovem | 650 | `oldestSeedDays >= 30` e `seeds >= 2` | 650 a 1200 pontos |
| 5 | Arvore Madura | 1200 | `oldestSeedDays >= 90` e `diaryEntries >= 50` | 1200 a 2200 pontos |
| 6 | Floresta | 2200 | `oldestSeedDays >= 180` e `strongRoots >= 5` | 2200 a 4000 pontos |
| 7 | Guardiao da Floresta | 4000 | `oldestSeedDays >= 365` e `streak >= 30` | nivel maximo |

### Formula de progresso visual

```text
levelProgress =
  ((consciousnessScore - currentLevelMinScore)
  / (nextLevelMinScore - currentLevelMinScore)) * 100
```

Aplicar `clamp(0, 100)` no resultado.

Para o nivel 7, `levelProgress = 100`.

## Conquistas v1

| ID | Nome | Gatilho numerico exato | Mensagem | Categoria |
|---|---|---|---|---|
| `first-sprout` | Primeiro Broto | `seeds >= 1` | Voce plantou sua primeira intencao no mundo. | Sementes |
| `first-root` | Primeira Raiz | `roots >= 1` | Toda semente precisa de sustentacao. Voce criou a primeira. | Raizes |
| `first-water` | Primeira Rega | `completedRoots >= 1` | Um pequeno gesto ja moveu o jardim. | Raizes |
| `seven-days` | Sete Dias de Cultivo | `streak >= 7` | Uma semana inteira. O solo esta fertil. | Diario |
| `deep-root` | Raiz Profunda | `legendaryRoots >= 1` | Essa raiz agora sustenta algo real. | Raizes |
| `three-seeds` | Jardim Iniciado | `seeds >= 3` | Voce comecou a cultivar mais de uma frente da vida. | Sementes |
| `thirty-entries` | Espelho Constante | `diaryEntries >= 30` | Trinta sinais internos registrados. Seu mapa esta ficando mais nitido. | Diario |
| `faithful-mirror` | Espelho Fiel | `diaryEntries >= 50` | Voce tem uma escuta interior refinada. | Diario |
| `consistent-gardener` | Cultivador Consistente | `completedRoots >= 30` | Trinta regas. A repeticao virou materia. | Consistencia |
| `garden-guardian` | Guardiao do Jardim | `activeSeeds >= 1` e `oldestSeedDays >= 90` | Voce nao abandonou sua semente. Isso e raro. | Retencao |
| `pattern-cultivator` | Cultivador de Padroes | `activeDaysLast30 >= 18` | Seu jardim ja tem memoria. | Padroes |
| `weekly-reader` | Leitor da Semana | `weeklyReportsRead >= 1` | Voce parou para ler o proprio caminho. | Relatorio |
| `monthly-reader` | Quatro Semanas de Espelho | `weeklyReportsRead >= 4` | Um mes inteiro olhando para os proprios sinais. | Relatorio |
| `forest-standing` | Floresta em Pe | `level >= 6` | Voce construiu algo que poucos constroem. | Nivel |

## Conquistas futuras

| ID | Nome | Gatilho numerico exato | Observacao |
|---|---|---|---|
| `shared-week` | Semana Compartilhada | `sharedCards >= 1` | Depende do Cartao Compartilhavel |
| `memory-opened` | Memoria Revisitada | `journeyMemoriesOpened >= 1` | Depende de Memorias da Jornada |
| `timeline-reader` | Leitor da Jornada | `timelineEventsOpened >= 10` | Depende da Linha do Tempo |
| `guide-stage` | Guia Interior | `level >= 5` e `mentorMessages >= 30` | Depende de metricas do Mentor |

## Regra para desbloqueio

1. Calcular estatisticas do usuario.
2. Avaliar todas as conquistas.
3. Comparar com conquistas ja salvas.
4. Salvar apenas novas conquistas desbloqueadas.
5. Mostrar no maximo uma conquista nova por sessao.

## Proxima conquista

A proxima conquista deve ser escolhida pela menor distancia numerica ate o gatilho.

Exemplo:

```text
distance(first-sprout) = max(0, 1 - seeds)
distance(seven-days) = max(0, 7 - streak)
distance(faithful-mirror) = max(0, 50 - diaryEntries)
```

Quando houver empate, priorizar:

1. Diario;
2. Raizes;
3. Sementes;
4. Relatorio;
5. Padroes;
6. Nivel.

## Implementacao recomendada

Criar ou evoluir `services/growthService.ts` para expor:

```ts
type GrowthStats = {
  diaryEntries: number;
  streak: number;
  seeds: number;
  activeSeeds: number;
  roots: number;
  strongRoots: number;
  legendaryRoots: number;
  completedRoots: number;
  weeklyReportsRead: number;
  oldestSeedDays: number;
  activeDaysLast30: number;
};

type GrowthProfile = {
  score: number;
  level: ConsciousnessLevel;
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  nextAchievement: Achievement | null;
  stats: GrowthStats;
};
```

## Onde exibir

| Area | Exibicao |
|---|---|
| Home | Nivel atual, progresso e proxima conquista |
| Jardim | XP da semente, estagio visual e raizes fortes |
| Relatorio Semanal | Nivel, progresso e conquistas desbloqueadas |
| Perfil | Historico de conquistas e configuracoes |
| Mapa de Padroes | Conquista `Cultivador de Padroes` quando desbloquear leitura confiavel |

## Criterios de pronto

- Niveis calculam de forma deterministica.
- Usuario nao perde nivel ao reduzir atividade.
- Conquistas novas aparecem uma por vez.
- Proxima conquista e acionavel.
- A formula usa apenas dados disponiveis no app.
- O sistema funciona em modo dev/mock sem depender de Supabase.
