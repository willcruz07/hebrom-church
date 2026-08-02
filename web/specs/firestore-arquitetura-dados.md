# Arquitetura de dados / Firestore

## Contexto / objetivo
O Firestore cobra por leitura de documento. O objetivo é minimizar leituras redundantes usando listeners em tempo real (`onSnapshot`) com cache local, janelas de tempo para não carregar histórico desnecessário, e paginação para listas grandes — sem sacrificar a sensação de "tempo real" onde ela importa (mural, agenda, contadores do dashboard).

## Estado atual no código
- As services em `src/services/firebase/*` (agenda.ts, groups.ts, mural.ts, prayer.ts, users.ts, daily-word.ts) — a confirmar caso a caso se já usam `onSnapshot` ou fazem `getDocs()` a cada chamada (revisar no momento da implementação; não assumir).
- Estado global fica em `src/store/**` (Zustand): `useAuth.ts`, `useMenuState.ts`, `useNewUsersStore.ts` (este último já faz polling via `startMonitoring`).
- Não há hoje uso documentado de `persistentLocalCache` do SDK v12 nem estratégia formal de paginação por cursor.

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

## Decisões em aberto
- Qual o tamanho exato da janela de tempo por coleção (mural = mês atual foi o exemplo dado; agenda pode ter janela diferente, ex: próximos 3 meses)?
- Quantos listeners simultâneos são aceitáveis (mural + agenda + grupos + contadores ao mesmo tempo) antes de precisar de uma estratégia de "detach" quando a seção não está em uso?
- Tamanho de página para a paginação por cursor (não definido).

## Não-escopo
Esta spec não implica migrar as services existentes para `onSnapshot`, configurar `persistentLocalCache`, ou implementar paginação agora — é a referência de arquitetura para quando o usuário pedir a implementação, módulo a módulo.
