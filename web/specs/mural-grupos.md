# Mural e grupos

## Contexto / objetivo
O mural (feed social) tem duas visões: uma geral, vista por todos, e uma por grupo/ministério, restrita a quem participa e com dinâmica de fórum. Esta spec descreve a matriz de interação e a moderação de grupo.

## Estado atual no código
- `mural.ts` (`src/services/firebase/mural.ts`) já implementa CRUD de `FeedPost`, curtidas e comentários (`PostComment`), mas **sem separação entre feed geral e feed por grupo** — hoje é um feed único.
- `groups.ts` (`src/services/firebase/groups.ts`) faz CRUD de `ChurchGroup`, mas não tem relação com posts do mural nem conceito de moderador, nem proteção contra exclusão.
- `(protected)/dashboard/mural/page.tsx`: filtro atual é 3 abas (Todos/Geral/Meus Grupos), calculado sobre `currentUser.sub_groups`. `CreatePostModal.tsx` só permite escolher **um** grupo por post (`target_group` string), embora `FeedPost.target_groups` já seja array.
- `usePermissions.canPostTargetedFeed` hoje é `isSecretary || isPastor` — fixo por `role`, sem override por usuário.
- `ChurchGroup` está vazio — nenhum dos 20 itens de `MinistryAttribution` (`specs/ministerios-carteirinha.md`) tem grupo correspondente ainda.
- `Sheet` (`src/components/ui/sheet.tsx`) e `Checkbox` (`src/components/ui/checkbox.tsx`) existem como primitivas shadcn mas não são usados em nenhuma tela ainda.

## Design alvo

### Aba geral
Visível a todos os papéis (inclusive visitante, que só visualiza). Membros podem curtir e comentar, mas **não podem criar post** no geral — só secretaria/admin-pastor (ver "Decisões em aberto" em `specs/roles-permissoes.md` sobre quem exatamente posta ali).

### Aba de grupo (fórum)
Cada usuário só vê as abas de grupo dos ministérios dos quais participa. Dentro do grupo, o comportamento é de fórum: qualquer membro do grupo pode criar post/tirar dúvida, não só visualizar. Serve como canal interno do ministério (ex: músicos tirando dúvida entre si).

### Moderação por líder de grupo
O líder de um grupo/ministério (ver `specs/roles-permissoes.md`) modera os posts e comentários **do próprio grupo**: pode editar/remover conteúdo indevido, sem ter esse poder fora do grupo que lidera. Exemplo dado pelo usuário: o ministério de música tem "músico" (membro comum do grupo) e "líder de música" (moderador daquele grupo específico).

**Importante**: essa moderação por líder de grupo continua **não implementada** e é conceito **separado** de `can_post_mural` (ver abaixo) — não confundir os dois. `can_post_mural` é uma permissão global de "pode criar/gerenciar post no mural"; "líder de grupo modera só o próprio grupo" é escopada por grupo e fica para uma etapa futura.

### Grupos fixos por atribuição ministerial
Os 20 itens de `MinistryAttribution` (`specs/ministerios-carteirinha.md`) passam a ser também 20 `ChurchGroup` reais e **distintos** — cada atribuição tem seu próprio grupo/feed, sem fusão por família (ex: "Líder Louvor" e "Ministério de Louvor" são grupos separados; só "se juntam" se um post marcar os dois no alcance na hora de criar).

- **ID determinístico**: cada grupo fixo usa como ID do documento o slug do nome da atribuição (ex: `lider-louvor`, `ministerio-de-danca`), em vez de ID aleatório do Firestore — permite resolver atribuição → grupo direto (`doc(db, 'groups', slug)`), sem precisar buscar por `name`.
- **Campo novo** `ChurchGroup.is_fixed: boolean` — `true` nos 20 semeados.
- **Semeadura automática, não manual**: `seedFixedGroups()` roda sozinho (idempotente — só cria o que falta) ao abrir a tela de Grupos, sem botão nem ação manual do usuário.
- **Criação/edição de grupo removida da UI e do código**: `createGroup`/`updateGroup` e os componentes `CreateGroupModal`/`EditGroupModal` foram excluídos — não têm mais nenhuma utilidade real, já que `MinistryAttribution` é uma lista fechada de 20 itens definida no código (`src/lib/ministry-attributions.ts`), sem forma de um grupo "customizado" ganhar membro (ver histórico da decisão: tornar isso dinâmico exigiria resolver tema/cor por atribuição nova e abrir mão da segurança de tipo do union de 20 strings — feature maior, não desenhada). Se um dia precisar de uma 21ª atribuição, o caminho é adicionar no código (`MINISTRY_ATTRIBUTIONS` + cor em `MINISTRY_ATTRIBUTION_THEME`), não via admin em runtime.
- `groups/page.tsx` agora é **só visualização** dos grupos fixos + exclusão de grupos não-fixos legados (criados antes dessa decisão, se existirem) sem membros vinculados — sem criar/editar nada.
- **Proteção dos grupos fixos**: `deleteGroup(id)` bloqueia sempre que `is_fixed` for `true`. Na UI, grupo fixo mostra selo "Fixo" e não tem menu de ações. Para grupos não-fixos remanescentes, exclusão só é permitida se nenhum usuário tiver esse ID em `sub_groups` no momento.

### Sincronização atribuição → `sub_groups`
Ao salvar `atribuicao_principal`/`atribuicoes_secundarias` de um membro (`members/[uid]`, `members/new` — ver `specs/ministerios-carteirinha.md`), o sistema resolve cada atribuição escolhida para o ID do grupo fixo correspondente e sincroniza `AppUser.sub_groups` automaticamente (adiciona os que faltam, remove os que não estão mais entre principal/extras). A secretaria não marca grupo manualmente à parte — isso substitui de vez a antiga seção "Ministérios e Grupos" (checkboxes manuais) nas telas de membro, que é removida.

### Alcance do post e filtro do mural (redesenho de UI)
- **Criar post** (`CreatePostModal.tsx`): troca "Tipo de Alcance" (Geral OU Grupo) + select de um grupo só por um único seletor **"Alcance (Grupos)"**, multi-seleção — "Geral (todos)" + os grupos existentes (`FeedPost.target_groups` já é array, só a UI mudava).
- **Filtro do mural** (`mural/page.tsx`): troca as 3 abas (Todos/Geral/Meus Grupos) por um botão de filtro que abre a mesma UI de multi-seleção — checkbox "Geral" + um item por grupo que o usuário participa (`sub_groups`). Default (nada filtrado) = geral + posts dos grupos que participa (igual à aba "Todos" hoje). Quando um filtro está ativo, mostra qual está selecionado no topo da tela.
- **Componente**: ambos os seletores (Alcance do post e filtro do mural) usam um `ChipMultiSelect` novo e genérico (`{id, label}[]`, seleção múltipla, chip inteiro é a área de toque — não checkbox pequeno) dentro de um `Sheet` (`side="bottom"`, componente shadcn já existente mas não usado ainda). Esse mesmo `ChipMultiSelect` também substitui o grid de chips hoje duplicado em `members/[uid]`/`members/new` para "Extras" — um componente único reaproveitado em 4 lugares, em vez de JSX repetido.

### Permissão `can_post_mural`
Campo novo `AppUser.can_post_mural: boolean` — independente da atribuição ministerial:
- Automaticamente `true` quando `role` é `secretary` ou `pastor` (mantém o comportamento atual). Na tela de membro, aparece como um `Switch` (não checkbox) pré-marcado e travado nesse caso.
- Editável manualmente para qualquer `member` — dá acesso ao botão "Novo Aviso" e à moderação (editar/excluir post), do mesmo jeito que já funciona hoje para secretaria/pastor.
- `usePermissions.canPostTargetedFeed` passa a checar `isSecretary || isPastor || currentUser?.can_post_mural`.
- Só secretaria/admin-pastor edita esse flag em outro membro (mesma regra geral de dado administrativo — ver `specs/roles-permissoes.md`).

## Decisões em aberto
- Quem exatamente pode postar na aba geral: hoje é `secretary`/`pastor` por padrão via `can_post_mural`, extensível a qualquer membro manualmente — resolvido no mecanismo, mas a política de "quem deveria ganhar isso por padrão" fica a critério de quem administra.
- O líder de grupo pode remover participantes do grupo, ou só moderar conteúdo (posts/comentários)? Ainda não implementado (ver nota acima — separado de `can_post_mural`).
- Um post de grupo pode ser promovido/replicado para o geral (ex: aviso importante de um ministério visível a todos), ou os feeds são estritamente isolados?
- Nome exato do slug determinístico dos grupos fixos (ex: acentos/maiúsculas no slug) — decidir na implementação, seguindo convenção comum de slug (minúsculo, sem acento, hífen).
- ~~Grupo customizado sem membro~~ — resolvido: criação/edição de grupo removida da UI e do código (ver acima). Sem forma de vincular membro a um grupo além dos 20 fixos, a funcionalidade não tinha utilidade real — decisão do usuário foi remover em vez de reconstruir o vínculo.

## Não-escopo
Esta spec não implica implementar `firestore.rules`/validação server-side agora — a proteção de grupos fixos (`is_fixed`) e a moderação por `can_post_mural` continuam sendo só client-side, mesmo risco já documentado em `AGENTS.md` e coberto pelo skill `security-check`.
