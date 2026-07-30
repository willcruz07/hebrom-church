# Hebrom Sys — monorepo

Duas pastas independentes, cada uma com seu próprio `package.json`/deploy:

- **`web/`** — o app Next.js (frontend + rotas de API do usuário). Deploy na Vercel. Veja `web/AGENTS.md` para convenções específicas.
- **`backend/`** — Cloud Functions do Firebase (jobs agendados, triggers de Firestore/Storage). Deploy via `firebase deploy --only functions` (rodado de dentro de `backend/`, ou da raiz — `firebase.json` na raiz aponta `functions.source` para `backend`).

Projeto Firebase: `hebrom-sys` (ver `.firebaserc`).

## Quando usar qual
- Precisa responder a uma requisição de usuário (UI, formulário, ação do dashboard) → `web/src/app/api/**`.
- Precisa rodar sozinho (agendado) ou reagir a um evento do Firestore/Storage sem nenhum usuário envolvido → `backend/src/**`.
