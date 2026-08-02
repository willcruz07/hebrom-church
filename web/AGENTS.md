<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Hebrom Sys

## Stack
Next.js 16 (App Router, convenção `proxy.ts` no lugar de `middleware.ts`), React 19, TypeScript strict, Tailwind v4, Firebase JS SDK v12 (client) + firebase-admin v13 (server), Zustand.

## Comandos
- `npm run dev` / `npm run build` / `npm run lint`
- `npx tsc --noEmit` para checagem de tipos

## Convenção de datas
Todo `created_at`/`updated_at` do domínio é sempre `Timestamp` do Firestore — nunca `number`/`Date.now()`. Use `serverTimestamp()` em documentos normais. Dentro de arrays (`arrayUnion`, ex. comentários de post) use `Timestamp.now()`, porque `serverTimestamp()` não resolve dentro de arrays.

## Camada de serviços
Tudo em `src/services/firebase/*`, um arquivo por domínio (`agenda.ts`, `groups.ts`, `mural.ts`, `prayer.ts`, `users.ts`, `daily-word.ts`). Helpers compartilhados — reaproveite em vez de duplicar:
- `uploadFile()` em `storage.ts` — upload + `getDownloadURL`
- `notifyNewPost()` em `notify.ts` — disparo de push notification
- `buildDefaultAppUser()` em `store/useAuth.ts` — criação do `AppUser` padrão no primeiro login

## Riscos de segurança conhecidos (não resolvidos)
- `POST /api/admin/users` e `POST /api/notifications/new-post` não verificam autenticação/autorização.
- O cookie de sessão (`hebromsys_user_sessions`) nunca é validado no servidor (sem `verifyIdToken`/`verifySessionCookie`).
- Não há `firestore.rules`/`storage.rules` versionados neste repositório.
- Toda autorização (`usePermissions`, `PermissionGuard`) é client-side.

**Regra**: não crie uma rota em `src/app/api/**` que faça leitura/escrita privilegiada sem antes verificar a sessão no servidor e o `role` do usuário no Firestore. Nunca confie em `role` (ou qualquer campo de privilégio) vindo do corpo da requisição. Veja o skill `security-check` antes de mexer em rotas de API, regras de permissão ou funções de `services/firebase` que escrevem dados de outro usuário.

## Jobs agendados e triggers de backend
Ficam em `../backend` (Cloud Functions), não em `src/app/api/**`. Este repositório (`web`) é a subpasta do monorepo em `D:\Code\hebrom-sys`; `backend/` é sibling dela. Cloud Functions usa credenciais padrão do projeto (sem precisar de `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`) e suporta triggers reativos do Firestore/Storage, que o Next.js/Vercel não conseguem oferecer. Exemplo: `backend/src/birthdays.ts` roda todo dia às 08:00 (America/Sao_Paulo), cria o aviso de aniversariantes do dia no mural e dispara a notificação. Deploy via `cd backend && npm run deploy` (usa `firebase-tools`).

## Módulos de domínio
O ecossistema do Hebrom Sys cobre membresia, secretaria e pastoral de uma igreja. Cada módulo abaixo tem uma spec de design-alvo em `specs/` e um skill de guardrail correspondente em `.claude/skills/` — leia a spec antes de mexer no módulo, o skill carrega sozinho quando a tarefa bate com a descrição dele.

| Módulo | O que cobre | Spec | Skill |
|---|---|---|---|
| Papéis e permissões | 4 níveis de acesso (visitante/membro/secretaria/admin-pastor) + líder de grupo como moderador por ministério | `specs/roles-permissoes.md` | `roles-permissoes` |
| Ministérios e carteirinha | ~15 ministérios, atribuição primária/secundária por usuário, tema visual da carteirinha | `specs/ministerios-carteirinha.md` | `ministerios-carteirinha` |
| Mural e grupos | Feed geral vs. feed por grupo (fórum), moderação do líder de grupo | `specs/mural-grupos.md` | `mural-grupos` |
| Arquitetura de dados / Firestore | Estratégia de `onSnapshot`, cache local, janelas de tempo, paginação — para minimizar custo de leitura | `specs/firestore-arquitetura-dados.md` | `firestore-cache` |

**Importante**: as specs descrevem o **design-alvo** (muitas dessas features ainda não existem no código hoje). Elas são referência para conversas futuras, não uma ordem para implementar ou refatorar nada agora — só mexa em código a partir delas quando o usuário pedir explicitamente.

## Não fazer
- Não commitar `.env*` ou o JSON de credenciais do Firebase Admin (já cobertos pelo `.gitignore`).
- Não usar `git push --force`.
