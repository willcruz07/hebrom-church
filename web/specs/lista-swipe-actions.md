# Ações por swipe em listas (mobile)

## Status (2026-10-09)
Implementado na lista de membros: `SwipeableRow` (`src/components/ui/`), modo opt-in no `DataTable` via `mobileActions` + `getRowKey`, pressão longa abre bottom sheet com as mesmas ações, exclusão confirmada via `useMessages`. Swipe com Excluir e (pendentes) Aprovar; "Ver perfil" ficou só no toque do card. Dica animada de primeira visita não foi implementada.

## Contexto / objetivo
No mobile, listas devem seguir o padrão de apps como Gmail e Outlook: deslizar o card da direita para a esquerda revela botões de ação atrás dele. Hoje as ações ficam num menu "…" (dropdown/tooltip), que é um padrão de desktop.

## Estado atual no código
- `src/components/DataTable.tsx`: no desktop, renderiza tabela com dropdown "…" por linha (`actions`); no mobile, usa `renderMobileCard` quando fornecido.
- `dashboard/members/page.tsx`: o `renderMobileCard` tem seu próprio `DropdownMenu` com "Ver Perfil", "Excluir Membro" e (para `pending_member`) "Aprovar Membro". Tocar no card já abre o perfil (`onRowClick`).
- A exclusão usa `confirm()` nativo do navegador.
- Outras telas com `DataTable`/`DropdownMenu` que podem adotar o padrão depois: `mural/page.tsx`, `prayer/page.tsx`.
- `framer-motion` (v12) já é dependência — não precisa de biblioteca nova para o gesto.
- Existe diálogo de confirmação do app: `useMessages` (`type: 'QUESTION'`, `onConfirm`) + `app-message-dialog.tsx`.

## Design alvo

### Componente
- `SwipeableRow` genérico em `src/components/ui/`, usado pelo caminho mobile do `DataTable` (ou diretamente no `renderMobileCard`). Recebe o conteúdo do card e a lista de ações (`DataAction<T>` já existente: `label`, `icon`, `onClick`, `variant`).
- Implementado com `motion.div` + `drag="x"`, `dragConstraints` limitando ao lado esquerdo, `dragElastic` baixo e snap: se arrastado além de ~40% da largura das ações, fica aberto; senão volta.
- Desktop (`lg`+) continua com o dropdown "…" atual — sem mudança.

### Comportamento
- Swipe só da direita para a esquerda (não conflita com o gesto "voltar" do iOS, que é na borda esquerda).
- Apenas uma linha aberta por vez: abrir outra fecha a anterior (estado do "id aberto" no `DataTable`/lista).
- Rolar a lista, tocar fora ou tocar no card aberto fecha a linha.
- Tocar no card fechado mantém o comportamento atual (`onRowClick` → abre o perfil).
- O drag não pode disparar o `onRowClick` (distinguir tap de drag).
- Botões revelados têm largura fixa (~72–80px cada), ícone + rótulo curto; ação destrutiva em vermelho, positiva (aprovar) em verde/âmbar.

### Ações destrutivas
- Sem "swipe completo exclui direto". Deslizar só **revela** o botão Excluir; tocar nele abre a confirmação via `useMessages` (`type: 'QUESTION'`), substituindo o `confirm()` nativo.
- Após confirmar, o card sai com animação (colapso de altura) e aparece o toast de sucesso.

### Lista de membros (primeiro caso)
- Ações atrás do card: **Excluir** e, se `pending_member`, **Aprovar**.
- "Ver perfil" sai do swipe, porque tocar no card já faz isso (ver decisão em aberto).
- O botão "…" do card mobile é removido ou substituído pela alternativa acessível abaixo.

### Descoberta e acessibilidade
- Alternativa ao gesto: pressão longa (long-press) no card abre as mesmas ações num bottom sheet (`sheet.tsx`), e/ou um botão visível só para leitor de tela (`sr-only`) com o menu de ações.
- Opcional: na primeira visita, uma "dica" animada (o primeiro card desliza alguns pixels e volta), guardada em `localStorage` para mostrar só uma vez.
- Respeitar `prefers-reduced-motion` (sem animação de dica, snap sem mola).

### Permissões
O swipe só mostra ações que o usuário pode executar — as mesmas regras que hoje decidem o conteúdo de `getActions`. Não muda nada na autorização (que continua precisando de verificação server-side — ver `AGENTS.md`).

## Decisões em aberto
- Manter "Ver perfil" também no swipe (redundante com o toque no card) ou só Excluir/Aprovar? Recomendação: só Excluir/Aprovar.
- Alternativa ao gesto: long-press com bottom sheet, manter um "…" discreto, ou ambos?
- Swipe da esquerda para a direita para alguma ação rápida (ex: Aprovar), como no Gmail? Recomendação: não por enquanto — um sentido só é mais simples de aprender.
- Quais outras listas adotam o padrão depois de membros (oração, mural, agenda)?

## Não-escopo
- Mudar o layout desktop / tabela.
- Mudar a lógica de exclusão/aprovação em `services/firebase/users.ts`.
- Esta spec é design-alvo; não implica implementar nada até o usuário pedir.
