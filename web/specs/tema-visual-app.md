# Tema visual do app (cores base)

## Contexto / objetivo
As cores por atribuição/ministério (`specs/ministerios-carteirinha.md`) resolvem o tema da carteirinha. Esta spec cobre a camada abaixo disso: as **cores base do app inteiro** — botão primário, fundo, texto, cards, bordas, estados — usadas em toda tela fora da carteirinha (mural, agenda, membros, etc.). Objetivo é substituir o azul genérico de shadcn/ui por uma identidade coerente com a linguagem visual já definida nas specs de ministério (grafite sóbrio + dourado de liderança), sem quebrar nenhum componente shadcn existente (as variáveis mantêm os mesmos nomes).

## Estado atual no código
- `src/app/globals.css` já tem o sistema de tema completo implementado e ativo: variáveis HSL em `:root` (light) e `.dark` (dark), consumidas via `@theme` do Tailwind v4 (`--color-primary: hsl(var(--primary))` etc.) — é o preset padrão gerado pelo shadcn/ui (`primary` azul `217.2 91.2% 59.8%`, neutros cinza-azulados frios).
- `ThemeProvider` (`src/app/layout.tsx:54`, `next-themes`) já alterna `.dark` no `<html>`, `defaultTheme="dark"`, `enableSystem` — os dois modos já funcionam, só as cores é que são o preset genérico.
- Nenhum componente usa cor hardcoded para essas variáveis de base — todo o app usa as classes Tailwind (`bg-primary`, `text-foreground`, `border-border` etc.), então trocar os valores em `globals.css` já propaga para o app inteiro sem tocar em outros arquivos.

## Design alvo

### Direção
- **Neutro escuro reaproveitado do Pastor**: o grafite quase-preto `#14141A` (já usado como fundo do card "Pastor(a)" em `ministerios-carteirinha.md`) vira o **fundo dark mode do app inteiro** — em vez do cinza-azulado frio padrão do shadcn. Dá coerência: a tela do app e a atribuição mais "sóbria" da igreja compartilham o mesmo tom.
- **Primário em índigo/violeta**: reaproveita a família de Intercessão/Louvor (já mapeada) como cor de marca do app (botões, links, foco) — tom reverente, e distinto o bastante das cores de atribuição pra não ser confundido com "isso é da Intercessão".
- **Accent em dourado**: mesmo dourado da liderança (`#D4AF37` light / `#E8C55A` dark) vira o accent de destaque do app inteiro (badges, callouts, estados de destaque) — reforça a mesma "moeda visual" de liderança/importância em qualquer tela, não só na carteirinha.
- **Fundo/texto com leve calor (ivory/cream)** em vez do cinza-azulado frio do shadcn — mais alinhado ao tom "acolhedor de igreja" do que um SaaS genérico.
- **Destructive (vermelho de erro/exclusão) não muda** — é cor semântica de sistema, mexer nela quebraria a leitura universal de "perigo".
- **Chart-1 a chart-5** passam a usar 5 hues já existentes na paleta de ministérios (Dança/Mídia/Música/Missão/Cantina), pra qualquer gráfico futuro (ex. dashboard de mural/agenda) soar coerente com o resto do app.

### Variáveis propostas (`src/app/globals.css`)
Mesmo formato `H S% L%` já usado no arquivo — troca direta dos valores dentro de `:root` e `.dark`, sem mudar nome de variável nem `@theme`:

```css
:root {
  --background: 44 40% 97%;        /* ivory quase-branco, em vez do cinza-azulado frio */
  --foreground: 240 13% 9%;        /* grafite do Pastor, como tinta escura */
  --card: 0 0% 100%;               /* branco puro, destaca sobre o ivory */
  --card-foreground: 240 13% 9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 13% 9%;
  --primary: 243 75% 59%;          /* índigo/violeta — família Intercessão/Louvor */
  --primary-foreground: 40 43% 93%; /* cream, não branco puro */
  --secondary: 40 20% 94%;         /* cinza-cream suave */
  --secondary-foreground: 240 13% 9%;
  --muted: 40 15% 92%;
  --muted-foreground: 240 6% 40%;
  --accent: 46 65% 52%;            /* dourado de liderança */
  --accent-foreground: 240 13% 9%; /* texto escuro sobre dourado, sempre */
  --destructive: 0 84.2% 60.2%;    /* mantém o padrão shadcn — cor semântica */
  --destructive-foreground: 210 40% 98%;
  --border: 40 20% 88%;
  --input: 40 20% 88%;
  --ring: 243 75% 59%;             /* mesma cor do primary */
  --chart-1: 333 71% 51%;          /* Dança (pink-600) */
  --chart-2: 200 98% 39%;          /* Mídia (sky-600) */
  --chart-3: 262 83% 58%;          /* Música (violet-600) */
  --chart-4: 175 84% 32%;          /* Missão (teal-600) */
  --chart-5: 347 77% 50%;          /* Cantina (rose-600) */
  --radius: 0.5rem;                /* mantém */
}

.dark {
  --background: 240 13% 9%;        /* grafite do Pastor — mesmo tom, mode dark do app inteiro */
  --foreground: 40 43% 93%;        /* cream, não branco frio */
  --card: 240 11% 14%;             /* levemente mais claro que o fundo, pra elevação */
  --card-foreground: 40 43% 93%;
  --popover: 240 11% 14%;
  --popover-foreground: 40 43% 93%;
  --primary: 239 83% 67%;          /* índigo mais claro, pra "pop" no fundo escuro */
  --primary-foreground: 240 13% 9%;
  --secondary: 240 10% 20%;
  --secondary-foreground: 40 43% 93%;
  --muted: 240 8% 18%;
  --muted-foreground: 40 10% 65%;
  --accent: 45 76% 63%;            /* dourado mais claro (mesma regra da carteirinha) */
  --accent-foreground: 240 13% 9%;
  --destructive: 0 62.8% 30.6%;    /* mantém o padrão shadcn */
  --destructive-foreground: 210 40% 98%;
  --border: 240 10% 22%;
  --input: 240 10% 22%;
  --ring: 239 83% 67%;
  --chart-1: 333 71% 61%;          /* mesmas famílias, um degrau mais claro pro dark */
  --chart-2: 200 98% 49%;
  --chart-3: 262 83% 68%;
  --chart-4: 175 84% 42%;
  --chart-5: 347 77% 60%;
}
```

## Status
**Descartado.** Foi implementado em `src/app/globals.css` e depois **revertido** a pedido do usuário — decisão explícita de não trocar a paleta principal do sistema com base nas cores de atribuição/ministério. A mudança de cor fica só na carteirinha (`specs/ministerios-carteirinha.md`), sem propagar pro app inteiro. `globals.css` está de volta ao preset padrão do shadcn/ui.

Este arquivo fica só como registro da direção considerada e por que foi descartada, caso o assunto volte no futuro.

## Não-escopo
Esta spec não se aplica mais a `globals.css`. Os campos de atribuição/ministério e o theming da carteirinha por atribuição continuam sendo o design alvo real — ver `specs/ministerios-carteirinha.md`.
