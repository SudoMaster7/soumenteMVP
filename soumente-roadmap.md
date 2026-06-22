# SouMente — Roadmap de Evolução Estratégica

> *"Toda floresta começou com uma única semente."*

---

## Visão do Produto

O SouMente é uma plataforma de autoconhecimento, continuidade e evolução pessoal construída sobre a metáfora do cultivo. Em vez de tratar objetivos como tarefas frias, o sistema os apresenta como organismos vivos que precisam de atenção, cuidado e tempo para crescer.

O app já entrega uma base sólida:

- Diário Emocional com sequência de dias
- Sementes de Objetivos com metáfora viva
- Jardim de Evolução com visualização de progresso
- Raízes de Consistência como hábitos vinculados
- Reflexões e Relatórios semanais

Este roadmap define as próximas camadas de evolução — módulos que transformam o SouMente de um app de acompanhamento em um **sistema operacional de crescimento pessoal**.

---

## Princípios de Desenvolvimento

Antes de implementar qualquer módulo novo, três princípios devem guiar as decisões:

**Coerência com a metáfora.** Cada nova funcionalidade deve fazer sentido dentro do vocabulário do jardim. Se uma feature não couber naturalmente na linguagem de sementes, raízes e cultivo, é sinal de que precisa ser repensada ou de que o vocabulário precisa expandir conscientemente.

**Dados que viram significado.** O usuário não deve sentir que está "inserindo dados". Ele deve sentir que está regando algo. Toda coleta de informação precisa ter retorno claro e emocional.

**Retenção através de profundidade.** O risco de qualquer app de bem-estar é o abandono no mês dois. O antídoto é criar camadas de significado que só aparecem com o tempo — memórias, padrões, identidade acumulada.

---

## Módulos Prioritários

### Módulo 1 — Super Eu

**Conceito**

O Super Eu é a inteligência personalizada do sistema. Não é um chatbot genérico — é uma voz construída a partir dos próprios registros, emoções e comportamentos do usuário ao longo do tempo.

O diferencial está na **progressão da personalização**: nos primeiros dias, o Super Eu faz perguntas abertas. Com o passar das semanas, ele começa a conectar pontos, identificar padrões e gerar orientações que só fazem sentido para aquele usuário específico.

**Três camadas de inteligência**

| Camada | Quando ativa | O que faz |
|---|---|---|
| Espelho | Dias 1–14 | Reflete o que o usuário registrou sem interpretar |
| Observador | Dias 15–45 | Começa a identificar padrões e recorrências |
| Guia | Dia 45+ | Gera orientações personalizadas com base no histórico |

**Exemplos de saída por camada**

*Espelho (semana 1):*
> "Hoje você registrou entusiasmo. O que estava acontecendo que gerou essa sensação?"

*Observador (semana 4):*
> "Nos últimos 18 dias, você registrou motivação com mais frequência às segundas e terças. O que é diferente nesses dias?"

*Guia (mês 3):*
> "Sua semente Saúde está sem atenção há 9 dias. Da última vez que isso aconteceu, você registrou frustração na semana seguinte. O que faz sentido fazer hoje?"

**Considerações técnicas**

O Super Eu deve ser alimentado por um contexto gerado dinamicamente a cada consulta, composto por: emoções recentes (últimos 14 dias), raízes mais e menos regadas, sementes ativas e paradas, reflexões marcadas como importantes pelo usuário.

O prompt enviado à API deve ser estruturado para gerar respostas curtas (máximo 3 frases), no tom de um mentor próximo — nunca de um coach genérico.

---

### Módulo 2 — Sistema de Níveis de Consciência

**Conceito**

Uma progressão simbólica global que representa a evolução do usuário dentro do sistema — não apenas dentro de uma semente, mas como cultivador.

**Os sete níveis**

| Nível | Nome | Critério de entrada |
|---|---|---|
| 1 | Semente | Cadastro e primeira entrada no diário |
| 2 | Broto | 7 dias consecutivos de registro |
| 3 | Raiz Forte | Primeira raiz com 80%+ de consistência em 21 dias |
| 4 | Árvore Jovem | 30 dias ativos + mínimo 2 sementes cultivadas |
| 5 | Árvore Madura | 3 meses de uso + relatório semanal lido por 8 semanas |
| 6 | Floresta | 6 meses + 5 sementes com raízes fortes |
| 7 | Guardião da Floresta | 1 ano de uso consistente |

**Importante:** o nível não deve cair. Uma vez conquistado, ele representa uma identidade construída. O sistema pode indicar que a pessoa "está em pausa", mas não rebaixa o nível — isso preserva o vínculo emocional com a conquista.

**Expressão visual**

Cada nível tem um estado visual distinto do jardim do usuário: o jardim literalmente muda de aparência conforme evolui — de um vaso com terra, passando por um broto, até uma floresta densa. Essa mudança visual é o principal mecanismo de retenção deste módulo.

---

### Módulo 3 — Relatório Semanal Inteligente

**Conceito**

Um espelho narrativo da semana — não um dashboard frio, mas uma leitura que o usuário sente vontade de abrir toda segunda-feira.

**Estrutura do relatório**

**1. Estado Emocional da Semana**
- Emoção predominante (com contexto: "apareceu 5 vezes, geralmente à noite")
- Emoção ausente (o que não foi registrado)
- Variação em relação à semana anterior

**2. Cultivo da Semana**
- Semente mais cultivada (com número de raízes regadas)
- Semente negligenciada (com dias de ausência)
- Raiz com maior consistência
- Raiz em risco (menos de 30% de presença na semana)

**3. Insight do Super Eu**
Uma observação gerada por IA com base nos dados da semana — personalizada, com no máximo 4 frases.

**4. Intenção para a Próxima Semana**
O usuário define uma palavra ou frase de intenção. Essa intenção aparece na Home da semana seguinte e é resgatada no próximo relatório.

**Exemplo de relatório completo**

> **Sua semana em uma frase:** Uma semana de movimento interno — você processou mais do que agiu, e isso também é cultivo.
>
> **Emoção predominante:** Reflexão (6 registros) — apareceu especialmente no final do dia.
> **Emoção ausente:** Gratidão não apareceu nenhuma vez esta semana.
>
> **Semente mais cultivada:** Carreira — 14 raízes regadas.
> **Semente negligenciada:** Saúde — sem atenção há 8 dias.
>
> **Super Eu observou:** Quando você regou sua semente de saúde nos últimos meses, seu humor nos dias seguintes melhorou consistentemente. Essa correlação vale atenção.
>
> **Sua intenção para esta semana:** _______________

---

### Módulo 4 — Mapa de Padrões

**Conceito**

Visualização das correlações entre emoções, ações e resultados. O módulo que transforma o SouMente em um sistema que genuinamente *compreende* o usuário.

**Categorias de padrões detectados**

*Emoção → Ação*
> "Nos dias em que você registrou gratidão, você regou 47% mais raízes."

*Tempo → Consistência*
> "Você tem 3× mais chances de regar suas raízes quando registra emoção antes das 10h."

*Ausência → Risco*
> "Você tende a perder sequência após 3 dias sem registrar emoção. Isso aconteceu 4 vezes nos últimos 3 meses."

*Semente → Semente*
> "Sua semente Financeira e sua semente Carreira evoluem juntas. Quando uma avança, a outra costuma acompanhar."

**Requisito de dados mínimos**

O Mapa de Padrões só deve ser exibido após 30 dias de uso com pelo menos 60% de presença — antes disso, o sistema exibe uma mensagem sobre o que está sendo cultivado para revelar.

**Apresentação**

Os padrões não devem aparecer como um relatório técnico. Devem aparecer como *descobertas* — no tom de quem está revelando algo sobre o usuário que ele ainda não sabia. Curtos, impactantes, um de cada vez.

---

### Módulo 5 — Memórias da Jornada

**Conceito**

O sistema resgata automaticamente momentos do passado, criando continuidade emocional e profundidade narrativa.

**Tipos de memória**

| Tipo | Trigger | Exemplo |
|---|---|---|
| Aniversário de Semente | Data de criação | "Há exatamente 90 dias você plantou sua semente SouMente" |
| Eco Emocional | Mesma emoção registrada em datas próximas em anos/meses diferentes | "Há 6 meses você também registrou exatamente isso" |
| Progresso Visível | Marco de raiz | "Quando você plantou essa semente, ela não tinha nenhuma raiz. Hoje tem 23." |
| Intenção Cumprida | Reflexão antiga cruzada com progresso atual | "Em março você escreveu que queria construir algo. Olha o que você cultivou desde então." |

**Apresentação**

As memórias aparecem como cartões suaves na Home — nunca interrompendo o fluxo, sempre opcionais para expandir. O tom é de descoberta, não de cobrança.

---

### Módulo 6 — Linha do Tempo da Jornada

**Conceito**

Uma narrativa visual e cronológica da evolução do usuário — o registro vivo de quem essa pessoa está se tornando.

**Eventos registrados automaticamente**

- Criação e primeiro cultivo de cada semente
- Mudanças de nível de consciência
- Marcos de consistência (7, 21, 30, 90 dias)
- Primeiras conquistas
- Semanas marcadas como significativas pelo usuário
- Insights do Super Eu marcados como importantes

**Formato**

A linha do tempo não deve ser um log técnico. Deve funcionar como um diário visual — com a emoção predominante daquele período, o nível em que o usuário estava, e uma frase representativa (escrita pelo usuário ou gerada pelo Super Eu se o usuário não escreveu nada naquele dia).

**Interação**

O usuário pode tocar em qualquer ponto da linha do tempo para ler o contexto daquele momento — como abrir uma página de um diário antigo.

---

### Módulo 7 — Sistema de Conquistas

**Conceito**

Recompensar comportamentos positivos de forma que reforce a identidade do cultivador, não apenas a gamificação por pontos.

**Princípio de design:** conquistas não devem parecer notificações de jogo. Devem parecer reconhecimentos genuínos — como se o jardim estivesse celebrando o cultivador.

**Conquistas planejadas**

| Conquista | Gatilho | Mensagem de desbloqueio |
|---|---|---|
| Primeiro Broto | Criar a primeira semente | "Você plantou sua primeira intenção no mundo." |
| Sete Dias de Cultivo | 7 dias consecutivos no diário | "Uma semana inteira. O solo está fértil." |
| Raiz Profunda | Uma raiz com 100% em 21 dias | "Essa raiz agora sustenta algo real." |
| Guardião do Jardim | Todas as sementes ativas por 90 dias | "Você não abandonou nenhuma semente. Isso é raro." |
| Espelho Fiel | Registrar 50 emoções diferentes ao longo do uso | "Você tem uma escuta interior refinada." |
| Cultivador de Padrões | Mapa de Padrões desbloqueado | "Seu jardim já tem memória." |
| Floresta em Pé | Nível 6 atingido | "Você construiu algo que poucos constroem." |

**Nota de implementação:** conquistas não desbloqueadas não devem aparecer como "bloqueadas com cadeado". Elas não existem até serem conquistadas — isso evita a sensação de gamificação vazia e mantém cada conquista como uma surpresa genuína.

---

### Módulo 8 — Cartão Compartilhável da Semana

**Conceito**

Crescimento orgânico através de compartilhamento natural — não como uma estratégia de marketing, mas como extensão da identidade que o usuário está construindo.

**O que o cartão mostra**

- Nível atual com ícone do jardim
- Sequência de dias ativos
- Emoção predominante da semana
- Semente principal
- Crescimento percentual semanal
- Frase do Super Eu da semana (se o usuário quiser incluir)

**Formato técnico**

O cartão é gerado como imagem (canvas/PNG) dentro do próprio app — sem depender de serviços externos. O design deve ser limpo e legível fora de contexto: alguém que nunca usou o SouMente deve entender o conceito em 3 segundos ao ver o cartão no feed.

**Variações de cartão por nível:** o visual do cartão evolui com o nível do usuário — um Broto compartilha um cartão diferente de um Guardião da Floresta.

---

## Módulo Transversal — Finanças Integradas

**Problema atual:** o "fluxo financeiro" aparece na Home sem ter uma área documentada. Isso cria incoerência.

**Decisão de escopo recomendada**

O SouMente não deve tentar ser um app financeiro. Mas pode ser um app de *consciência financeira* — alinhado com a metáfora do cultivo.

**Abordagem proposta:** "Semente Financeira com raízes específicas"

Em vez de um módulo de finanças separado, a dimensão financeira vive dentro do sistema de sementes:

- O usuário cria uma **Semente Financeira** (como qualquer outra semente)
- As raízes dessa semente são hábitos financeiros: "Registrar gastos", "Poupar X por semana", "Revisar orçamento"
- A Home mostra apenas um indicador visual simples: se a semente financeira está sendo cultivada ou negligenciada
- O Diário pode incluir uma dimensão de "energia financeira" (leve, não obrigatória)

Isso mantém coerência com a metáfora sem transformar o SouMente em um concorrente do Mobills.

---

## Roadmap de Implementação

### Fase 1 — Fundação Inteligente *(0–3 meses)*

Objetivo: tornar o que já existe mais inteligente antes de adicionar mais features.

- [x] Super Eu (camada Espelho + Observador) — base ativa com Oráculo, Mentor e leitura de contexto local
- [x] Relatório Semanal Inteligente (estrutura completa) — inclui consistência, padrão, vitória, próximo passo, nível e intenção semanal
- [x] Conquistas básicas (5 primeiras) — calculadas a partir de diário, sementes e raízes
- [ ] Resolução da questão financeira (semente financeira nativa)

### Fase 2 — Profundidade e Retenção *(3–6 meses)*

Objetivo: criar as camadas que fazem o usuário ficar no mês 3 e no mês 6.

- [ ] Memórias da Jornada
- [ ] Sistema de Níveis de Consciência (visual completo do jardim)
- [x] Mapa de Padrões (primeira versão local com sinais iniciais, presença e descobertas por emoção/semente/raiz)
- [ ] Super Eu (camada Guia)

### Fase 3 — Identidade e Crescimento *(6–12 meses)*

Objetivo: transformar usuários ativos em embaixadores e criar senso de legado.

- [ ] Linha do Tempo da Jornada
- [ ] Cartão Compartilhável da Semana
- [ ] Conquistas avançadas
- [ ] Exportação da jornada (PDF/imagem anual)

---

## Métricas de Sucesso por Módulo

| Módulo | Métrica principal | Meta de referência |
|---|---|---|
| Super Eu | Taxa de abertura da mensagem diária | > 60% |
| Níveis | Usuários que atingem Broto | > 40% dos cadastrados |
| Relatório Semanal | Leitura completa | > 50% dos ativos |
| Mapa de Padrões | Retenção no mês 2 | > 35% |
| Memórias | Sessões iniciadas por memória | > 20% |
| Conquistas | Compartilhamento orgânico | > 10% dos conquistados |
| Cartão | Conversão de visualização | > 5% por cartão compartilhado |

---

## Missão

Ajudar pessoas a perceberem que grandes transformações não surgem de mudanças radicais.

Elas surgem do cultivo diário das pequenas sementes que cada um carrega dentro de si.

O SouMente é o lugar onde esse cultivo se torna visível.

🌱

---

*Documento de roadmap — versão 1.0*
*SouMente · soumente.com*
