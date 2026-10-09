# Navegação fluida

## Status (2026-10-09)
Implementado: prefetch de todas as rotas autenticadas no `(protected)/layout.tsx` após o login; boot paralelo + cache do `AppUser` em `localStorage` (`useAuth.ts`, só usado em rota protegida); `persistentLocalCache` com multi-tab (`config.ts`); `useMembersStore` com `onSnapshot` vivo na sessão + detalhe do membro abrindo da store. `getUserById` passou a propagar erro em vez de devolver `null` (com cache persistente, `null` offline faria o `loadAppUser` recriar o usuário com defaults).

## Contexto / objetivo
Trocar de tela no app deve parecer instantâneo, como num app nativo. Hoje toda navegação (inclusive para telas que não buscam nada no Firestore, como o Perfil) exibe a `LoadingScreen` por tempo perceptível. A `LoadingScreen` **continua existindo e com o mesmo visual** — o objetivo é que ela apareça só por um instante (ou nem apareça) quando a rota/dado já estiver disponível no aparelho.

## Estado atual no código

### Navegação entre rotas
- `src/app/loading.tsx` (raiz) renderiza `LoadingScreen` em tela cheia (`fixed inset-0 z-[9999]`) — é o fallback de Suspense de toda troca de rota.
- O menu (`Sidebar.tsx`, `MobileBottomNav.tsx`) navega via `useNavigation().navigateTo` → `router.push`. Não há `<Link>` nem `router.prefetch`, então **nenhuma rota é pré-carregada**: cada toque espera a ida e volta ao servidor (payload RSC) e a `LoadingScreen` fica visível o tempo todo.
- `dashboard/profile/page.tsx` lê só o `currentUser` do Zustand — a demora nessa tela é 100% de navegação, não de dado.
- Em `npm run dev` cada rota é compilada na primeira visita, o que infla bastante o tempo. Medições de desempenho devem ser feitas em `npm run build && npm start`.

### Boot do app
Em `useAuth.checkAuth()` (`src/store/useAuth.ts`), o `onAuthStateChanged` faz três etapas de rede **em série** antes de liberar a tela (`loading.checkAuth = false`):
1. Firebase Auth restaura a sessão.
2. `loadAppUser` → `getUserById` (Firestore).
3. `setSessionCookie` → `POST /api/auth/session`.

O `AuthSession` mostra a `LoadingScreen` até as três terminarem.

### Telas com dados
- `members/page.tsx`: `getUsers()` a cada montagem, sem cache.
- `members/[uid]/page.tsx`: `getUserById(uid)` a cada montagem, mesmo quando o membro já veio na lista.
- `useNewUsersStore`: busca as contagens uma única vez (apesar do nome `startMonitoring`, não é polling nem listener).
- `src/services/firebase/config.ts` usa `getFirestore(app)` — sem `persistentLocalCache`.

## Design alvo

### 1. Pré-carregamento de rotas
- Itens do menu (sidebar e bottom nav) usam `<Link>` do Next ou disparam `router.prefetch(href)` para todas as rotas do menu assim que o usuário está autenticado.
- Links para detalhe (ex: card de membro → `/dashboard/members/[uid]`) fazem prefetch ao entrar na viewport / ao toque (`onPointerDown`).
- Resultado esperado: ao tocar, o payload da rota já está no cliente e a troca é imediata; a `LoadingScreen` só aparece em conexão lenta ou rota nunca visitada.
- Ler `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md` e o guia de prefetching antes de implementar (Next 16 — APIs podem diferir).

### 2. Boot paralelo + cache do usuário
- `setSessionCookie` roda em paralelo com `loadAppUser` (`Promise.all`), em vez de esperar o `getUserById` terminar. O cookie continua precisando estar gravado antes de liberar o dashboard (requisito do `proxy.ts` no iOS — ver comentário em `setSessionCookie`).
- O último `AppUser` é guardado localmente (ex: `localStorage`, por `uid`). Se a sessão do Firebase Auth for restaurada e houver cache do mesmo `uid`, o app libera a tela com o cache e atualiza `currentUser` em segundo plano quando o Firestore responder.
- O cache local nunca é fonte de autorização: o `role` do cache só serve para renderizar a UI até o dado real chegar (a autorização real é server-side — ver `AGENTS.md`, riscos conhecidos). Logout limpa o cache.

### 3. Dados: mostrar o que já existe, atualizar por trás (stale-while-revalidate)
- Regra geral: se há dado em memória/cache, renderiza na hora e atualiza em segundo plano; o esqueleto/spinner só aparece quando **não há nada** para mostrar.
- Lista de membros: store Zustand (`useMembersStore`) com `onSnapshot` na coleção `users`, criado ao entrar na seção de membros e mantido vivo entre navegações (seguindo o ciclo de vida definido em `firestore-arquitetura-dados.md`). Só para quem tem `canManageUsers`.
- Detalhe do membro: abre instantaneamente com o `AppUser` já presente na store da lista (preenche o formulário na hora); `getUserById` só é chamado se o membro não estiver na store (ex: acesso direto pela URL).
- Ativar `persistentLocalCache` (IndexedDB) no `initializeFirestore`, para que leituras repetidas em sessões seguintes respondam do disco.

### Relação com `firestore-arquitetura-dados.md`
Esta spec cuida da **experiência** (quando mostrar o quê); aquela cuida do **custo** (quando usar listener vs. fetch, janelas de tempo, paginação). Os critérios de custo de lá continuam valendo — `onSnapshot` não é para todas as telas, só onde o dado é revisitado com frequência. Prefetch de rota e boot paralelo não geram leitura extra no Firestore.

## Ordem sugerida de implementação
1. Prefetch das rotas do menu (maior ganho percebido, sem custo de leitura).
2. Boot paralelo (`Promise.all` do cookie + usuário).
3. Cache local do `AppUser` no boot.
4. `persistentLocalCache` do Firestore.
5. `useMembersStore` com `onSnapshot` + detalhe lendo da store.

## Decisões em aberto
- Prefetch de todas as rotas do menu logo após o login, ou só ao entrar na viewport/hover? (Mobile não tem hover; bottom nav está sempre visível.)
- `persistentLocalCache` com `persistentMultipleTabManager` ou single-tab? (PWA costuma ter uma aba só.)
- Por quanto tempo o cache local do `AppUser` é aceitável sem revalidação (ex: só usar se tiver menos de X dias)?
- A store de membros desliga o listener ao sair da seção de membros ou fica viva durante toda a sessão?

## Não-escopo
- Mudar o visual da `LoadingScreen`.
- Migrar mural, agenda, oração etc. para stores com listener — isso segue `firestore-arquitetura-dados.md`, módulo a módulo, quando pedido.
- Esta spec é design-alvo; não implica implementar nada até o usuário pedir.
