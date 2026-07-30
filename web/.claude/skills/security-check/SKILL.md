---
name: security-check
description: Use before adding or changing any API route (src/app/api/**), Firestore write in src/services/firebase/**, or permission logic (usePermissions/PermissionGuard) in the Hebrom Sys project — verifies auth/authorization is enforced server-side, not just in the UI.
---

# Security check — Hebrom Sys

Checklist a percorrer antes de adicionar ou alterar qualquer rota de API, escrita no Firestore ou lógica de permissão neste projeto.

1. **Toda rota em `src/app/api/**/route.ts` que faz algo privilegiado precisa verificar identidade antes de agir.** Hoje nenhuma rota faz isso — `api/admin/users/route.ts` e `api/notifications/new-post/route.ts` são exemplos vivos do problema (aceitam qualquer requisição não autenticada). Novo código não deve repetir o padrão: leia e valide a sessão (idealmente via `adminAuth.verifySessionCookie`/`verifyIdToken`) antes de qualquer leitura/escrita privilegiada.

2. **Nunca confie em campos de privilégio vindos do corpo da requisição** (`role`, `uid` de outro usuário, `sub_groups`, etc.). Sempre derive o `role`/identidade do usuário autenticado a partir da sessão verificada no servidor, não do payload enviado pelo client.

3. **Funções em `src/services/firebase/*` que mutam dados de outro usuário** (aprovar, deletar, mudar `role`) só são seguras na medida das regras do Firestore. Como não há `firestore.rules`/`storage.rules` versionados neste repositório, trate essas funções como desprotegidas até confirmar as regras diretamente no console do Firebase — não assuma que existe uma barreira server-side só porque a função parece "administrativa".

4. **`PermissionGuard` (`src/components/PermissionGuard.tsx`) e `usePermissions` (`src/hooks/usePermissions.ts`) só escondem UI.** Eles rodam inteiramente no client e nunca são proteção suficiente sozinhos — qualquer chamada direta à API ou ao Firestore que dependa só desses componentes para segurança está desprotegida.

5. Para o estado atual detalhado dos gaps conhecidos, veja a seção "Riscos de segurança conhecidos" em `AGENTS.md`.
