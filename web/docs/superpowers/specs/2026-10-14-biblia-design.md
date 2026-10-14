# Bíblia no app — design

**Data:** 2026-10-14
**Status:** aguardando revisão
**Módulo:** 1 de 3 da seção Palavra (Palavra do Dia → **Bíblia** → Devocional)

## Objetivo

Permitir que o membro leia a Bíblia inteira dentro do app, de forma clara e contínua, e marque onde parou. É a base dos módulos seguintes: os devocionais vão apontar para trechos dela e a gamificação vai contar leitura.

**Sucesso:** o usuário encontra um livro/versículo em poucos toques, lê capítulo após capítulo sem voltar ao menu, e ao reabrir a Bíblia vê seus marcadores e retoma a leitura.

## Fora do escopo

- Marcações coloridas, anotações e favoritos (o marcador cobre a necessidade atual).
- Devocionais e gamificação (módulos 2 e 3, cada um com spec própria).
- Abrir o app inteiro sem internet: o `sw.js` ignora navegação de propósito (redirect no Safari). O offline aqui é do **texto bíblico** com o app aberto.
- Mais de uma tradução.

## Fonte do texto

- `por-almeida.usfx.xml` do repositório [seven1m/open-bibles](https://github.com/seven1m/open-bibles), listado como "João Ferreira de Almeida — Public Domain".
- É uma Almeida de linguagem levemente atualizada (segue a Revista e Corrigida na maioria dos versículos; ex.: Jr 29:11 difere). **Pendência:** o pastor aprova o estilo do texto antes de ir para produção.
- Contagem validada: 66 livros, 1.189 capítulos, 31.098 versículos (diferenças de ±1–2 versículos em 10 livros são da versificação em português, não texto faltando).
- Crédito exibido no rodapé da Bíblia: *"Texto bíblico: João Ferreira de Almeida — domínio público."*
- O `public/bible.md` atual (edição SUD, © Intellectual Reserve, com notas mórmons) é **removido**.

## Navegação: seção Palavra

Componente compartilhado `PalavraTabs` no topo das páginas da seção, com abas que são links de rota:

| Aba | Rota | Status |
|---|---|---|
| Palavra do Dia | `/dashboard/daily-word` | existente |
| Bíblia | `/dashboard/bible` | **novo** |
| Devocional | — | só aparece quando o módulo 2 existir |

- `paths.ts`: novo `ROUTES.AUTHENTICATED.BIBLE = '/dashboard/bible'`.
- `Sidebar.tsx`: novo item "Bíblia".
- `MobileBottomNav.tsx`: o item "Palavra" continua apontando para a Palavra do Dia, mas fica ativo também em `/dashboard/bible*`.

## Telas

### 1. Início da Bíblia — `/dashboard/bible`

1. **Barra de pesquisa** (topo).
   - Texto que parece referência (`jo 3:16`, `João 3`, `1co 13`, `sl 23:1`) → abre o capítulo rolado até o versículo. Parser tolera acentos, maiúsculas, abreviações comuns e espaço/sem espaço no número do livro.
   - Qualquer outro texto (mín. 3 letras) → busca por palavra no texto, sem acento/maiúsculas, mostrando até 50 resultados (referência + trecho com o termo destacado). Toque abre o versículo.
   - Se nem todos os livros estiverem baixados, a busca baixa o que falta e mostra "Preparando a Bíblia… x/66".
2. **Meus marcadores** — cards horizontais, mais recente primeiro (`📑 João 3:16 · ontem` + começo do versículo). Toque abre o versículo. Some se não houver nenhum.
3. **Livros** — cards grandes em grade, separados em Velho Testamento (39) e Novo Testamento (27), com o número de capítulos.

### 2. Livro — `/dashboard/bible/[livro]`

Título do livro + grade de cards com os números dos capítulos.

### 3. Capítulo — `/dashboard/bible/[livro]/[capitulo]`

- Cabeçalho: "João 3", voltar para o livro, controle de tamanho de fonte (A− / A+, 4 tamanhos).
- Texto em fonte serifada, um bloco por versículo com o número pequeno em âmbar. Query `?v=16` rola até o versículo e o destaca brevemente.
- **Toque num versículo** → ações: **Adicionar marcador** (ou **Remover marcador** se já marcado), **Copiar**, **Compartilhar**. Versículo marcado mostra o ícone 📑.
- **Rodapé do capítulo:** botão grande "Próximo: João 4 →" e um menor "← João 2". No último capítulo de um livro, "Próximo" vai ao capítulo 1 do livro seguinte; em Apocalipse 22 o botão some. Em Gênesis 1 o "anterior" some.
- Crédito do texto bíblico.

Slugs de livro em português sem acento (`genesis`, `joao`, `1-corintios`). Livro ou capítulo inexistente → `notFound()`.

## Dados do texto

### Geração (script, roda uma vez e o resultado é commitado)

`web/scripts/build-bible.mjs` lê o USFX (baixado para fora de `public/`) e gera:

- `public/bible/almeida/index.json` — lista dos 66 livros: `{ id: "JHN", slug: "joao", name: "João", abbrevs: ["jo", "joa"], testament: "NT", chapters: 21 }`.
- `public/bible/almeida/{slug}.json` — um arquivo por livro: `{ id, slug, name, chapters: string[][] }` (`chapters[2][15]` = João 3:16).

O script falha se a contagem não bater (66 / 1.189 / 31.098) ou se algum versículo vier vazio.

### Carregamento offline-first — `src/lib/bible/`

- `getBookIndex()` / `getBook(slug)`: busca primeiro no Cache Storage `bible-almeida-v1`; se não tiver, faz `fetch` e grava. Mantém em memória durante a sessão.
- `prefetchBible()`: depois do primeiro livro aberto, em `requestIdleCallback`, baixa os demais livros um a um para o cache. Sem internet, para silenciosamente e tenta de novo na próxima visita.
- `sw.js` passa a **ignorar `/bible/`** (o módulo gerencia o próprio cache; evita duplicar ~4 MB no cache geral). Bump do `CACHE_NAME`.
- Trocar o texto no futuro = novo nome de cache (`-v2`) e apagar o antigo.

Nenhuma leitura do Firestore para o texto.

## Marcadores

### Modelo

Um documento por usuário, fora do doc `users` (para não pesar nas listas de membros):

```
bible_bookmarks/{uid}
  items: Array<{ ref: "JHN.3.16", created_at: Timestamp }>
  updated_at: Timestamp
```

- `ref` = `{id do livro}.{capítulo}.{versículo}` — endereço estável, reaproveitável pelos módulos futuros.
- `created_at` dentro do array usa `Timestamp.now()` (convenção do projeto: `serverTimestamp()` não resolve em arrays); `updated_at` usa `serverTimestamp()`.
- Limite de 200 marcadores; ao passar disso o mais antigo sai.

### Serviço — `src/services/firebase/bible.ts`

- `getBookmarks(uid)` — 1 leitura.
- `addBookmark(uid, ref)` / `removeBookmark(uid, ref)` — leitura + escrita do doc (transação), sem duplicar `ref`.

Estado no cliente (hook `useBibleBookmarks`): carregado uma vez ao entrar na Bíblia e mantido em memória; atualização otimista ao marcar/desmarcar, com rollback e `toast.error` se falhar.

### Segurança

Só o dono lê e escreve o próprio documento. Como `firestore.rules` não é versionado neste repositório, a regra abaixo precisa ser aplicada no console:

```
match /bible_bookmarks/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

## Preferências locais

`localStorage` (em try/catch, com fallback): tamanho da fonte e último capítulo aberto. Só conveniência do aparelho; nada crítico depende disso.

## Visual

Segue o padrão do app: âmbar como cor de ação/destaque, `PageTitle`, cards arredondados, dark mode, modais/sheets base (já com `backdrop-blur`). Layout mobile-first; leitura com largura máxima confortável (~65 caracteres) no desktop.

## Erros e estados

- Livro ainda não baixado e sem internet → mensagem "Sem conexão. Este livro ainda não foi baixado." com botão de tentar de novo.
- Falha ao carregar marcadores → a Bíblia funciona normalmente, a seção de marcadores mostra aviso discreto.
- Carregamento → `HebromSpinner`, como no resto do app.

## Verificação

- O script de geração valida as contagens (é o teste do conteúdo).
- Testes unitários do parser de referência (`jo 3:16`, `1co13`, `Sl 23`, `joão 3:16-18` → início do trecho, entradas inválidas), da busca (sem acento/maiúsculas) e do cálculo de próximo/anterior (fim de livro, Gênesis 1, Apocalipse 22). O `web` não tem test runner: os testes usam o runner nativo do Node 24 (`node --test`, que executa `.ts` direto), sem dependência nova — por isso esses módulos de `src/lib/bible/` são funções puras, com imports relativos e sem acesso a rede/DOM. Novo script `npm run test:bible`.
- `npx tsc --noEmit` e `npm run lint`.
- O usuário testa no app (não rodamos o app por conta própria).

## Arquivos

**Novos:** `scripts/build-bible.mjs`, `public/bible/almeida/*.json`, `src/lib/bible/*` (catálogo, carregamento/cache, parser de referência, busca, navegação), `src/lib/share.ts`, `src/services/firebase/bible.ts`, `src/store/useBibleBookmarks.ts`, `src/components/palavra/PalavraTabs.tsx`, `src/app/(protected)/dashboard/bible/` (layout com as abas, 3 páginas + componentes, incluindo o card "Continuar de onde parou", que usa o último capítulo salvo).

**Alterados:** `paths.ts`, `Sidebar.tsx`, `MobileBottomNav.tsx`, `daily-word/page.tsx` (recebe `PalavraTabs`), `public/sw.js`, `src/types/index.ts`.

**Removido:** `public/bible.md`.
