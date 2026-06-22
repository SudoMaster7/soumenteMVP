# Soumente

Soumente e um MVP de aplicativo de autoconhecimento e evolucao pessoal construido com Expo, React Native, Expo Router e Supabase.

A proposta do produto e simples: ajudar a pessoa a registrar como esta se sentindo, cultivar um objetivo principal como uma semente e acompanhar o progresso diario por meio de raizes, diario emocional e relatorios.

## Status do MVP

O projeto ja conta com:

- Autenticacao com Supabase: cadastro, login, logout e recuperacao de senha.
- Navegacao com Expo Router e abas principais.
- Criacao, plantio, edicao e exclusao de sementes.
- Jardim com semente ativa, raizes e progresso.
- Registro diario de emocao, texto opcional e dimensao do dia.
- Historico de registros do diario.
- Streak de dias registrados.
- Relatorio semanal basico.
- Perfil do usuario.
- Configuracao de build web para Vercel.

## Stack

- Expo SDK 54
- React 19
- React Native 0.81
- Expo Router
- Supabase Auth e Postgres
- Zustand
- React Hook Form
- Expo Notifications
- TypeScript

## Estrutura

```txt
app/
  (auth)/        Telas de autenticacao
  (tabs)/        Home, Jardim, Diario e Perfil
  seed/          Criacao, edicao, perguntas e confirmacao de plantio
  report/        Relatorio semanal

components/
  diary/         Componentes do diario emocional
  seed/          Componentes da semente e raizes

constants/       Cores, emocoes e opcoes do produto
hooks/           Hooks de diario, seed e auth
lib/             Cliente Supabase e notificacoes
services/        Regras de acesso ao Supabase
stores/          Estado global com Zustand
types/           Tipos TypeScript do dominio
supabase/        SQLs auxiliares para banco
```

## Requisitos

- Node.js compativel com Expo SDK 54
- npm
- Conta e projeto no Supabase
- Expo CLI via `npx expo`

## Instalacao

```bash
npm install
```

Crie um arquivo `.env` na raiz usando `.env.exemple` como base:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
EXPO_PUBLIC_ANTHROPIC_KEY=cole_aqui_depois
EXPO_PUBLIC_QWEN_API_KEY=cole_aqui_depois
EXPO_PUBLIC_QWEN_API_URL=https://openrouter.ai/api/v1/chat/completions
EXPO_PUBLIC_QWEN_MODEL=qwen/qwen3-14b:free
```

As variaveis com prefixo `EXPO_PUBLIC_` ficam disponiveis no bundle do app. Nao coloque chaves secretas privadas nelas.
Para o MVP pessoal, o Mentor tenta usar Qwen por uma API compativel com OpenAI/OpenRouter. Para producao, mova essa chamada para uma funcao serverless ou Edge Function para nao expor a chave.

## Supabase

O app espera que exista uma tabela `profiles` relacionada aos usuarios do Supabase Auth. As tabelas `seeds`, `diary_entries`, `roots`, `fruits` e outras usam `user_id` referenciando `profiles.id`.

Se aparecer erro parecido com:

```txt
insert or update on table "seeds" violates foreign key constraint "seeds_user_id_fkey"
Key is not present in table "profiles".
```

rode no SQL Editor do Supabase:

```txt
supabase/fix_profiles_fk.sql
```

Esse script cria perfis faltantes para usuarios existentes, instala um trigger para novos usuarios e adiciona policies basicas de RLS para `profiles`.

## Rodando localmente

```bash
npm run start
```

Ou por plataforma:

```bash
npm run android
npm run ios
npm run web
```

No Windows, se o PowerShell bloquear `npx`, use os shims `.cmd`, por exemplo:

```bash
npx.cmd tsc --noEmit
```

## Scripts

```bash
npm run start    # inicia o Expo
npm run android  # abre no Android
npm run ios      # abre no iOS
npm run web      # abre no navegador
npm run build    # exporta web para dist/
```

## Build web e Vercel

O projeto esta configurado para Vercel com:

- `vercel.json`
- script `npm run build`
- saida em `dist/`

Na Vercel, configure as mesmas variaveis:

```env
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_ANTHROPIC_KEY
EXPO_PUBLIC_QWEN_API_KEY
EXPO_PUBLIC_QWEN_API_URL
EXPO_PUBLIC_QWEN_MODEL
```

Depois use:

```bash
npm run build
```

## Fluxos principais

### Semente

1. Usuario cria uma semente com nome, tipo, motivo e publico opcional.
2. Responde perguntas de aprofundamento.
3. A semente e plantada.
4. O Jardim mostra raizes e progresso.
5. O usuario pode editar ou excluir a semente ativa.

### Diario

1. Usuario seleciona uma emocao.
2. Escreve um texto opcional.
3. Escolhe a dimensao do dia.
4. O app salva um registro por dia.
5. Home e historico refletem o registro.

### Jardim

1. Exibe a semente ativa.
2. Mostra forca media das raizes.
3. Permite regar raizes.
4. Atualiza o status da semente conforme o progresso.

## Verificacoes antes do push

```bash
npx.cmd tsc --noEmit
npm run build
```

Tambem valide manualmente:

- Cadastro e login.
- Criacao de perfil no Supabase.
- Criacao de semente.
- Registro de diario.
- Edicao e exclusao de semente.
- Build web na Vercel.

## Observacoes

- O app usa Supabase com RLS. Se alguma acao retornar `403`, revise as policies da tabela correspondente.
- Se inserts em `seeds` ou `diary_entries` retornarem `23503`, rode `supabase/fix_profiles_fk.sql`.
- O arquivo `.env` local nao deve ser commitado.
- A IA real ainda esta preparada como variavel, mas o MVP pode seguir com mensagens condicionais/localizadas ate haver usuarios pagantes.

## Objetivo do MVP

Validar com beta testers se as pessoas usam o app com frequencia e sentem progresso real ao combinar diario emocional, metas simbolicas em forma de sementes e pequenas acoes diarias.
