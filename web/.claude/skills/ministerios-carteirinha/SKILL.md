---
name: ministerios-carteirinha
description: Use antes de mexer em campos de ministério do AppUser, no componente/página de carteirinha (id-card), ou em qualquer theming visual por ministério no Hebrom Sys.
---

# Ministérios e carteirinha — Hebrom Sys

1. `AppUser` (`src/types/index.ts`) hoje **não tem** campo de ministério/atribuição — não assuma que existe, confira antes de codar.
2. Cada usuário pode ter até 2 atribuições ministeriais: **principal** e **secundária** — só a principal define o tema visual da carteirinha.
3. Só `secretary`/`pastor` edita atribuição ministerial de qualquer usuário (ver skill `roles-permissoes`).
4. Theming da carteirinha é por **família de ministério**, não por lista exaustiva de estilos: pastor/pastoral = tema escuro/sóbrio, kids/juniores = tons pastel, música/louvor = tema com identidade musical. A paleta exata de cada ministério ainda não está definida — não invente valores hex definitivos sem confirmar com o usuário.
5. Nomenclatura de "atribuição primária/secundária" é provisória — o usuário pediu para pensarmos em um nome melhor. Não trate esse nome como final.
6. Design completo, lista dos ~15 ministérios e pontos em aberto: `specs/ministerios-carteirinha.md`.
