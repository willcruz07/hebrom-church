# Arquitetura de dados / Firestore

## Contexto / objetivo
O Firestore cobra por leitura de documento. O objetivo é minimizar leituras redundantes usando listeners em tempo real (`onSnapshot`) com cache local, janelas de tempo para não carregar histórico desnecessário, e paginação para listas grandes — sem sacrificar a sensação de "tempo real" onde ela importa (mural, agenda, contadores do dashboard).

## Estado atual no código
- As services em `src/services/firebase/*` (agenda.ts, groups.ts, mural.ts, prayer.ts, users.ts, daily-word.ts) — a confirmar caso a caso se já usam `onSnapshot` ou fazem `getDocs()` a cada chamada (revisar no momento da implementação; não assumir).
- Estado global fica em `src/store/**` (Zustand): `useAuth.ts`, `useMenuState.ts`, `useNewUsersStore.ts` (este último já faz polling via `startMonitoring`).
- `persistentLocalCache` (IndexedDB) já está ativo em `src/services/firebase/config.ts`. Paginação por cursor existe no mural (ver "Implementado" abaixo).

## Design alvo

### Listener em tempo real vs. fetch pontual
Critério: dado que muda com frequência e é visto por muita gente → `onSnapshot`. Dado estático ou específico de um usuário → fetch pontual + refresh manual.
- **Tempo real (`onSnapshot`)**: mural (dentro da janela de tempo ativa), agenda, contadores do dashboard (ex: pendentes/visitantes).
- **Fetch pontual**: perfil público de um membro específico (busca de membros), histórico antigo do mural (fora da janela ativa).

### Ciclo de vida do listener
O listener deve ser criado uma vez (ex: ao entrar na seção/logar) e viver no Zustand, não atrelado ao ciclo de montagem/desmontagem do componente de página — assim, navegar entre rotas não recria a assinatura nem gera novas leituras desnecessárias.

### Janela de tempo + paginação
Para coleções que crescem (mural), o listener cobre só uma janela recente (ex: mês atual, via `where('created_at', '>=', inícioDoMês)`), evitando carregar histórico completo. Dados mais antigos são acessados via paginação por cursor (`startAfter`) com `getDocs()` único — sem listener, já que dado antigo não muda.

### Cache local
Considerar `persistentLocalCache` (Firebase SDK v12) para cache em IndexedDB, reduzindo leituras em sessões recorrentes (o app é usado majoritariamente em mobile).

## Implementado (2026-10-24)

### Mural — âncora + paginação (`src/store/useMuralStore.ts`)
- Ao abrir: `getLatestPosts()` busca os 15 mais recentes (`MURAL_PAGE_SIZE`); o `created_at` do 15º vira a **âncora**.
- Tempo real: `subscribeToPostsSince(âncora)` — `where('created_at', '>=', âncora)`. A janela só cresce (post novo não empurra nenhum para fora), por isso âncora em vez de `limit(15)` no listener. Com menos de 15 posts no total, o listener cobre a coleção toda e não há paginação.
- Histórico: `getPostsBefore(cursor)` com `startAfter`, 15 por página, busca única sem listener — rolagem infinita via `IntersectionObserver` na página. Página incompleta = fim do mural.
- Posts antigos (sem listener): curtida e exclusão atualizam o store localmente (`updatePost`/`removePost`); o modal de comentários (`subscribeToPost`) repassa o post atualizado ao store. Outros usuários só veem a mudança num post antigo ao reabrir o mural (decisão aceita: post antigo quase não recebe interação).
- Empate de `created_at` na âncora pode trazer o mesmo post nas duas listas — `mergeFeed` (`src/lib/mural/feed.ts`, testado em `npm run test:mural`) mantém a versão ao vivo.
- Store vivo durante a sessão; grupos (`getGroups`) buscados uma vez por sessão no mesmo store.
- Filtros (geral/grupos), validade (`isPostActive`) e aniversário fixado (`sortMuralPosts`) continuam no cliente, sobre o que já foi carregado.

### Dashboard
- Membros: `useMembersStore` (listener da sessão) em vez de `getDocs` da coleção `users`.
- Posts: `getPostsSince(início do mês passado)` — os contadores só comparam o mês atual com o anterior.

## Decisões em aberto
- Qual o tamanho exato da janela de tempo por coleção (mural = mês atual foi o exemplo dado; agenda pode ter janela diferente, ex: próximos 3 meses)?
- Quantos listeners simultâneos são aceitáveis (mural + agenda + grupos + contadores ao mesmo tempo) antes de precisar de uma estratégia de "detach" quando a seção não está em uso?
- Tamanho de página para a paginação por cursor (não definido).

## Não-escopo
Esta spec não implica migrar as services existentes para `onSnapshot`, configurar `persistentLocalCache`, ou implementar paginação agora — é a referência de arquitetura para quando o usuário pedir a implementação, módulo a módulo.
