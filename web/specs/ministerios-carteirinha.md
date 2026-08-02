# Ministérios e carteirinha

## Contexto / objetivo
Cada membro pode pertencer a um ou mais ministérios da igreja, com uma atribuição principal e uma ou mais atribuições secundárias. Essa atribuição é exibida na carteirinha digital do membro, com um tema visual (cor/background) que muda conforme o ministério principal. Esta spec documenta a lista de atribuições/papéis e o modelo de design alvo.

## Estado atual no código
- **Implementado**: `AppUser` (`src/types/index.ts`) tem `atribuicao_principal?: MinistryAttribution` e `atribuicoes_secundarias?: MinistryAttribution[]` (root do documento, não dentro de `profile`). Lista + tema de cor em `src/lib/ministry-attributions.ts` (`MINISTRY_ATTRIBUTIONS`, `MINISTRY_ATTRIBUTION_THEME`, `MINISTRY_LEADER_ACCENT`).
- **Edição fica em duas telas** (não em `EditMemberModal.tsx`, que é só o modal rápido da listagem e não teve esse campo adicionado):
  - `(protected)/dashboard/members/[uid]/page.tsx`, aba "Igreja": campo **"Cargo principal"** (`Select` da lista de 20 itens) — substituiu o antigo `Input` de texto livre "Cargo Eclesiástico"/`profile.church_position` (removido do tipo `AppUser`, campo não existe mais). Logo depois de "Ministérios e Grupos" (checkboxes de `ChurchGroup`/`sub_groups`, inalterado), tem uma seção adendo **"Ministérios e grupos que participa (extras)"** — multi-select da mesma lista de 20 itens, ligado a `atribuicoes_secundarias`, excluindo o item já escolhido como principal.
  - `(protected)/dashboard/members/new/page.tsx` (criação de membro): mesmo padrão (Select "Cargo principal" + seção "extras"). Envia via `POST /api/admin/users`, que agora desestrutura `atribuicao_principal`/`atribuicoes_secundarias` do body e grava no root do documento (mesmo tratamento de `role`/`sub_groups`).
  - Só acessível por quem chega nessas telas (`PermissionGuard permission="canManageUsers"`, `secretary`/`pastor`) — grava via `updateDoc`/Admin SDK, mesmo padrão de proteção só client-side já documentado como risco conhecido em `AGENTS.md`.
- A carteirinha (`(protected)/dashboard/id-card/page.tsx`) tem fundo **fixo escuro** (`#080d17`, não muda com o tema light/dark do app) e um design premium já elaborado (avatar, badge de cargo em âmbar, grid de dados). A pedido do usuário, a integração da atribuição ficou **pequena**: um badge/chip translúcido com a cor da `atribuicao_principal`, logo abaixo do badge de cargo — não um recoloring do card inteiro. Usa a variante "dark" da paleta (o card nunca é light), com pontinho dourado (`MINISTRY_LEADER_ACCENT`) para atribuições "Líder X".
- `ChurchGroup`/`sub_groups` continuam representando participação em grupo/feed (mural por grupo) — **por enquanto** convivem lado a lado com a lista de atribuições na aba Igreja (ver acima). **Pendente de implementação** (ver `specs/mural-grupos.md`, seção "Grupos fixos por atribuição ministerial"): os 20 itens desta lista viram 20 `ChurchGroup` reais, e `sub_groups` passa a ser sincronizado automaticamente a partir de `atribuicao_principal`/`atribuicoes_secundarias` — quando isso for implementado, a seção manual "Ministérios e Grupos" (checkboxes) é removida das telas de membro.
- O app já é dark-mode-aware globalmente via `next-themes` (`ThemeProvider` em `src/app/layout.tsx:54`) — mas isso **não** afeta a carteirinha, que ignora o tema do app e é sempre escura (ver acima).

### Não implementado (ficou fora do "pequena alteração" pedido na carteirinha)
- Chips de `atribuicoes_secundarias` **na carteirinha** (a captura via UI já existe nas telas de membro; só falta renderizar no card — regra de derivação por opacidade já documentada abaixo).
- Qualquer variante **light** do badge da carteirinha (a carteirinha não tem modo light).
- A borda coral de exceção do `Líder Kids` descrita na regra de chips — o badge implementado na carteirinha trata todos os itens de forma uniforme (cor cheia + opacidade + pontinho dourado se líder).

## Design alvo

### Lista de atribuições/papéis
Lista única (flat) de 20 opções, definida pelo usuário. Mistura de propósito ministério/grupo, ofício eclesiástico e liderança — modelada como uma lista só (não separada em campos distintos) porque cada "Líder X" é tratado como um valor independente na mesma lista, não como um flag sobre o item base:

Ministério de Dança, Ministério Kids e Juniores, Obreiro, Evangelista (a), Presbítero (a), Mídia, Diácono (a), Cantina, Músico, Ministério de Louvor, Intercessão, Missionário (a), Pastor (a), Líder Intercessão, Líder Cantina, Líder Músico, Líder Mídia, Líder Kids, Líder Obreiro, Líder Louvor.

### Atribuição principal/secundárias
Cada usuário tem:
- **`principal`**: valor único (um item da lista acima) — define o tema visual da carteirinha, sempre priorizado na exibição.
- **`secundárias`**: lista (array) de zero ou mais itens da mesma lista, **sem limite de quantidade** — cobre o caso de um membro com várias funções (ex: Pastor como principal, com Líder Louvor e Músico como secundárias).

Só secretaria/admin-pastor edita essas atribuições (ver `specs/roles-permissoes.md`).

### Carteirinha — tema visual por atribuição principal
A atribuição **principal** determina o tema visual (cor de fundo/destaque) da carteirinha, com uma variante para o app em **light mode** e outra para **dark mode** (o app já alterna globalmente via `next-themes`, ver "Estado atual no código"). Padrão adotado:
- Cada família de atribuição tem uma cor-base (hue), com a variante "membro" e a variante "**Líder X**" na mesma família, num tom mais profundo/saturado.
- Todo item **Líder X** ganha, além do tom mais escuro, um acento dourado (borda fina, selo ou ícone) — sinaliza liderança à primeira vista, independente da família. Exceção: `Líder Kids`, que não escurece (quebraria o tom lúdico da família), mantém o pastel e usa só o acento dourado + uma borda coral de reforço.
- Texto sempre em alto contraste: branco/creme sobre fundos escuros ou saturados; grafite escuro sobre fundos pastel — regra igual nos dois modos.
- Hex são a direção inicial — podem ser ajustados para bater com os tokens Tailwind do projeto no momento da implementação.

**Regra de adaptação para dark mode** (fundo do app em dark mode é quase-preto, tipo `zinc-950`):
- Famílias de tom "membro" já vibrante (nível ~600/700 no light) sobem um degrau de luminosidade no dark (ex: 600→500, 700→600) para não ficarem "sujas"/apagadas contra o fundo escuro do app.
- Famílias de tom já muito escuro/sóbrio no light (Pastor, Presbítero, e todos os `Líder X`, nível ~800/900) também sobem um degrau (ex: 900→700/800) e ganham uma **borda sutil `rgba(255,255,255,.12)`** — sem isso, o cartão se confunde com o fundo do app (sombra não funciona bem em fundo escuro).
- `Kids` e `Líder Kids` seguem pasteis nos dois modos (leve dessaturação no dark: `#FFDD85` em vez de `#FFE59E`) — pastel "flutuando" sobre fundo escuro já funciona bem visualmente, não precisa escurecer.
- Acento dourado dos líderes fica mais claro no dark (`#E8C55A` em vez de `#D4AF37`) para manter contraste contra fundos já mais claros no dark mode.

| # | Atribuição | Família | Fundo light | Texto light | Fundo dark | Texto dark | Observação |
|---|---|---|---|---|---|---|---|
| 1 | Ministério de Dança | Dança | `#DB2777` (pink-600) | `#FFFFFF` | `#EC4899` (pink-500) | `#FAFAFA` | Expressivo/movimento |
| 2 | Ministério Kids e Juniores | Kids | `#FFE59E` (amarelo pastel) | `#2B2E4A` | `#FFDD85` | `#2B2E4A` | Lúdico, "tipo bebê" |
| 3 | Obreiro | Serviço | `#B45309` (âmbar-700) | `#FFF7ED` | `#D97706` (âmbar-600) | `#FFF7ED` | |
| 4 | Evangelista (a) | Missão | `#16A34A` (verde-600) | `#FFFFFF` | `#22C55E` (verde-500) | `#FAFAFA` | Crescimento/"ide" |
| 5 | Presbítero (a) | Pastoral | `#2B2438` (ameixa escura) | `#F5F0E6` | `#4C3A66` | `#F5F0E6` | Sóbrio, distinto do Pastor; + borda sutil no dark |
| 6 | Mídia | Mídia | `#0284C7` (azul-600) | `#FFFFFF` | `#0EA5E9` (azul-500) | `#FAFAFA` | Tech/comunicação |
| 7 | Diácono (a) | Serviço | `#C2410C` (terracota) | `#FFF7ED` | `#EA580C` (laranja-600) | `#FFF7ED` | Tom irmão do Obreiro |
| 8 | Cantina | Cantina | `#E11D48` (rosa-vermelho-600) | `#FFFFFF` | `#F43F5E` (rosa-vermelho-500) | `#FAFAFA` | Hospitalidade |
| 9 | Músico | Música | `#9333EA` (roxo-600) | `#FFFFFF` | `#A855F7` (roxo-500) | `#FAFAFA` | |
| 10 | Ministério de Louvor | Música | `#7C3AED` (violeta-600) | `#FFFFFF` | `#8B5CF6` (violeta-500) | `#FAFAFA` | Tom irmão do Músico |
| 11 | Intercessão | Intercessão | `#4338CA` (índigo-700) | `#FFFFFF` | `#4F46E5` (índigo-600) | `#FAFAFA` | Espiritual/oração |
| 12 | Missionário (a) | Missão | `#0D9488` (teal-600) | `#FFFFFF` | `#14B8A6` (teal-500) | `#FAFAFA` | Tom irmão do Evangelista |
| 13 | Pastor (a) | Pastoral | `#14141A` (grafite quase-preto) | `#F5F0E6` | `#2A2A33` | `#F5F0E6` | + acento dourado (`#C9A227` light / `#E8C55A` dark); + borda sutil no dark |
| 14 | Líder Intercessão | Intercessão | `#1E1B4B` (índigo profundo) | `#FFFFFF` | `#312C85` (índigo-800) | `#FAFAFA` | + acento dourado; + borda sutil no dark |
| 15 | Líder Cantina | Cantina | `#881337` (rosa-vermelho profundo) | `#FFFFFF` | `#BE123C` (rosa-vermelho-700) | `#FAFAFA` | + acento dourado; + borda sutil no dark |
| 16 | Líder Músico | Música | `#6B21A8` (roxo profundo) | `#FFFFFF` | `#7E22CE` (roxo-700) | `#FAFAFA` | + acento dourado; + borda sutil no dark |
| 17 | Líder Mídia | Mídia | `#0C4A6E` (azul profundo) | `#FFFFFF` | `#0369A1` (azul-700) | `#FAFAFA` | + acento dourado; + borda sutil no dark |
| 18 | Líder Kids | Kids | `#FFE59E` (igual ao Kids) | `#2B2E4A` | `#FFDD85` (igual ao Kids dark) | `#2B2E4A` | Exceção: não escurece; borda coral `#FF7A59` + acento dourado nos dois modos |
| 19 | Líder Obreiro | Serviço | `#78350F` (âmbar profundo) | `#FFF7ED` | `#92400E` (âmbar-700) | `#FFF7ED` | + acento dourado; + borda sutil no dark |
| 20 | Líder Louvor | Música | `#5B21B6` (violeta profundo) | `#FFFFFF` | `#6D28D9` (violeta-700) | `#FAFAFA` | + acento dourado; + borda sutil no dark |

### Carteirinha — tema visual das atribuições secundárias
A carteirinha só tem uma cor de fundo dominante (a da atribuição **principal**) — como `secundárias` não tem limite de quantidade, elas **não** ganham cada uma seu próprio card colorido (isso poluiria o layout); em vez disso aparecem como **chips/badges pequenos** abaixo do bloco principal, um por atribuição secundária, reaproveitando a mesma cor já mapeada na tabela acima — sem precisar de uma tabela nova de hex.

Regra de derivação do chip a partir da cor do item na tabela principal:
- **Fundo do chip**: a mesma cor hex do item, mas em **baixa opacidade** — `15%` no light mode, `20%` no dark mode (dark precisa de mais opacidade pra não sumir contra o fundo quase-preto do app). Em Tailwind v4 isso é só o modificador de opacidade sobre a cor arbitrária, ex. `bg-[#0284C7]/15` (light) e `bg-[#0EA5E9]/20` (dark) para um chip de Mídia.
- **Texto/borda do chip**: a cor hex cheia do item (a mesma da tabela, light ou dark conforme o tema ativo) — o chip fica "outline colorido" em vez de "bloco sólido colorido", pra não competir com o fundo da atribuição principal.
- **Líder X como secundária**: mesma regra, mais um pontinho dourado (`#D4AF37` light / `#E8C55A` dark) antes do texto do chip — reaproveita o acento já definido, sem virar um card escuro à parte.
- **Exceção Kids/Líder Kids**: como já é pastel e claro, o chip usa o fundo pastel **cheio** (não a versão em 15%/20% opacidade, que ficaria ilegível) — mesmo hex da tabela (`#FFE59E` light / `#FFDD85` dark), texto grafite `#2B2E4A`.
- **Exemplo composto**: usuário com `principal = Pastor (a)` e `secundárias = [Líder Louvor, Músico]` → card de fundo grafite (`#14141A`/`#2A2A33`) + dois chips abaixo: um chip violeta-profundo com ponto dourado (Líder Louvor) e um chip roxo-600 sem ponto (Músico).
- **Overflow**: se houver mais chips do que cabe numa linha (sugestão inicial: até 3 visíveis na carteirinha compacta, todos visíveis na tela de perfil completo), os excedentes colapsam num chip neutro `+N` — número exato de chips visíveis e o comportamento de expandir ficam como detalhe de implementação (ver "Decisões em aberto").

## Decisões em aberto
- ~~Nome melhor para "categoria primária/secundária"~~ — resolvido: `principal` (singular) e `secundárias` (array, sem limite). Ainda em aberto só o nome exato do campo em `AppUser` (ex: `atribuicao_principal`/`atribuicoes_secundarias` vs. `ministerio_principal`/`ministerios_secundarios`) — decidir na implementação.
- ~~Paleta de cor exata por ministério/família de ministério~~ — resolvido: tabela completa com os 20 itens na seção "Carteirinha — tema visual por atribuição principal" acima. Hex são a direção inicial, ajustar contra os tokens Tailwind do projeto na implementação.
- ~~Um usuário pode ter mais de 2 atribuições no futuro, ou o limite de 2 é definitivo?~~ — resolvido: sem limite de secundárias, só a principal é única.
- Onde este dado fica: campo direto em `AppUser` (ex: `atribuicao_principal: string; atribuicoes_secundarias: string[]`) vs. relação com `ChurchGroup` — decidir no momento da implementação.
- Número exato de chips de atribuição secundária visíveis antes do "+N" na carteirinha compacta — sugestão inicial de 3 na seção acima, não confirmado pelo usuário.

## Não-escopo
Esta spec não implica adicionar os campos em `AppUser`, criar o theming da carteirinha, ou definir paleta de cores agora — é referência de design para quando o usuário pedir a implementação.
