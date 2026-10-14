# Bíblia — marcadores de trecho e anotações — design

**Data:** 2026-10-14
**Status:** aguardando revisão
**Módulo:** evolução da Bíblia (spec base: `2026-10-14-biblia-design.md`)

## Objetivo

Transformar o marcador da Bíblia em ferramenta de estudo: durante a pregação, o membro seleciona o trecho que o pastor está lendo, marca e escreve uma nota sobre o que ouviu. Depois, encontra tudo organizado por livro na tela principal da Bíblia.

**Sucesso:** durante o culto, o membro seleciona Levítico 27:1-8 e salva um marcador com nota em poucos toques, sem perder o ponto da leitura. Depois, na tela principal, abre o card "Levítico", relê a nota e volta ao texto completo com um toque.

## Decisões tomadas

- Marcadores e notas são **pessoais e privados**: só o próprio usuário lê e grava. Nada é compartilhado com pastor, secretaria ou outros membros.
- Um marcador cobre **um trecho de um único capítulo**. Os versículos podem não ser seguidos (ex.: 1-3, 7).
- A nota é **opcional** e pertence ao marcador. **Remover o marcador apaga a nota.**
- Um versículo pertence a **no máximo um** marcador.
- A seleção funciona no modelo "tocar seleciona + barra flutuante confirma" (sem segurar, sem blur durante a seleção).
- O armazenamento continua em `bible_bookmarks/{uid}`, um documento por usuário (1 leitura para carregar tudo). Avaliamos subcollection por marcador e descartamos: custaria uma leitura por marcador a cada abertura da Bíblia.

## Fora do escopo

- Marcador que cruza capítulos.
- Cores diferentes por marcador.
- Segurar o versículo (long press) como gesto.
- Editar ou remover marcadores pelo modal da tela principal (a edição fica no leitor).
- Busca dentro das notas e exportação de notas.

## Dados

Documento `bible_bookmarks/{uid}`:

```ts
{
  items: BibleBookmark[]
  updated_at: Timestamp // serverTimestamp()
}

interface BibleBookmark {
  id: string            // gerado no cliente (crypto.randomUUID())
  bookId: string        // 'LEV'
  chapter: number       // 27
  verses: number[]      // ordenado crescente, sem repetição, mínimo 1 item
  note?: string         // opcional, trim, 1–2.000 caracteres; ausente = sem nota
  created_at: Timestamp // Timestamp.now() (dentro de array; serverTimestamp não resolve)
  updated_at?: Timestamp // Timestamp.now() ao editar a nota ou fundir
}
```

### Compatibilidade com o formato atual

Itens antigos `{ ref: 'LEV.27.1', created_at }` são convertidos na leitura (`normalizeBookmarks`) para `{ id: ref, bookId, chapter, verses: [verse], created_at }`. Itens inválidos (ref que não existe mais no catálogo, `verses` vazio) são descartados. A próxima gravação persiste tudo no formato novo. Sem script de migração.

### Limites

- **200 marcadores** por usuário (`MAX_BIBLE_BOOKMARKS`, já existente).
- **2.000 caracteres** por nota (`MAX_BOOKMARK_NOTE_LENGTH`).
- Pior caso ≈ 400 KB, abaixo do limite de 1 MB do documento.
- **Mudança de comportamento:** hoje, passar de 200 descarta o marcador mais antigo. Agora, criar o 201º é **bloqueado** com a mensagem *"Limite de 200 marcadores atingido. Remova algum para continuar."* (descartar em silêncio apagaria notas). Fundir marcadores existentes nunca é bloqueado, porque não aumenta o total.

### Fusão

Ao salvar uma seleção, todos os marcadores do mesmo livro/capítulo que tenham pelo menos um versículo em comum com a seleção são fundidos num só:

- `verses` = união da seleção com os versículos dos marcadores atingidos, ordenada.
- `note` = notas existentes dos marcadores atingidos (ordenadas pelo primeiro versículo), seguidas da nota nova se houver, separadas por uma linha em branco. Se o resultado passar de 2.000 caracteres, a gravação é recusada com a mensagem *"A nota unida passaria de 2.000 caracteres. Encurte a anotação antes de unir."*
- `id` e `created_at` = os do marcador atingido mais antigo; `updated_at` = agora.
- Sem marcador atingido, cria um marcador novo.

### Privacidade — regra do Firestore

As regras não estão versionadas neste repositório (ver `AGENTS.md`). A regra abaixo precisa ser aplicada no console (ou versionada) para que a privacidade seja garantida no servidor, e não só no app:

```
match /bible_bookmarks/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

## Leitor (`ChapterReader`)

### Estados do versículo

| Estado | Visual |
|---|---|
| Normal | como hoje |
| Selecionado | fundo âmbar + barra âmbar à esquerda |
| Marcado | sublinhado âmbar pontilhado discreto em cada versículo do trecho |
| Fim do trecho marcado | ícone ao final do **último** versículo: 🔖 (`Bookmark`) sem nota, 📝 (`NotebookPen`) com nota |

Um versículo pode estar marcado e selecionado ao mesmo tempo (vale o visual de selecionado, mantendo o sublinhado).

### Seleção

1. Tocar num versículo **sem seleção ativa**:
   - versículo marcado → abre o **sheet do marcador** (abaixo);
   - versículo não marcado → seleciona o versículo.
2. Tocar num versículo **com seleção ativa** → alterna aquele versículo na seleção (marcado ou não).
3. Com 1+ selecionado, aparece a **barra flutuante** (`SelectionBar`): referência da seleção ("Levítico 27:1-3, 7"), **✕** limpa, **✓** abre o sheet de ações. No mobile ela fica acima da `MobileBottomNav` e respeita `safe-area-inset-bottom`. Sem overlay e sem blur: o texto continua rolável.
4. Trocar de capítulo limpa a seleção.

### Sheet de ações — seleção nova (`VerseActionsSheet`)

`Dialog` com `variant="sheet"`.

- Título: referência. Descrição: texto do trecho (serif itálico, limitado a 3 linhas).
- Ações: **Marcar**, **Adicionar nota**, **Copiar**, **Compartilhar**.
- "Adicionar nota" abre o `NoteEditor` no próprio sheet; **Salvar** cria (ou funde) o marcador já com a nota.
- Se a seleção atinge marcadores existentes: aviso *"Inclui {ref}, que já está marcado. Os trechos serão unidos."*, com as notas existentes exibidas abaixo.
- Copiar/Compartilhar: `buildQuote` gera `"¹ texto ² texto…"\n— Levítico 27:1-2` (um versículo só mantém o formato atual, sem número).
- Marcar, Salvar, Copiar e Compartilhar fecham o sheet e limpam a seleção. Fechar o sheet sem agir mantém a seleção.
- Ações de marcar ficam desabilitadas sem usuário logado (como hoje).

### Sheet do marcador — trecho existente (`BookmarkSheet`)

`Dialog` com `variant="sheet"`.

- Título: referência do trecho. Descrição: texto do trecho.
- Nota em bloco âmbar claro (`bg-amber-50 dark:bg-amber-900/15`, preserva quebras de linha), ou "Sem anotação".
- Ações: **Editar nota** / **Adicionar nota** (abre o `NoteEditor` com o texto atual), **Copiar**, **Compartilhar**, **Remover marcador** (ghost vermelho).
- Remover com nota → confirmação via `useMessages().onShowMessage` (*"A anotação deste trecho também será apagada."*). Sem nota → remove direto.
- Salvar a nota vazia (ou só com espaços) remove a nota e mantém o marcador.

### `NoteEditor`

`Textarea` com contador `n/2000`, `maxLength={2000}`, contador vermelho a partir de 1.900. Botões no padrão do app: **Salvar** (âmbar) seguido de **Cancelar** (ghost).

### Destaque vindo de link

`?v=` passa a aceitar trecho: `?v=3` (atual) e `?v=1-3,7`. O leitor rola até o primeiro versículo e destaca todos por ~2,5 s. `verseHref` ganha uma variante para marcador (`bookmarkHref(bookmark)`).

## Tela principal (`/dashboard/bible`)

`BookmarksStrip` é removido e substituído por `BookmarksByBook`, na mesma posição (depois de `ContinueReading`).

### Cards por livro

- Seção "Meus marcadores", oculta se não houver marcadores. Mensagem de erro atual mantida se o carregamento falhar.
- Grade: 2 colunas no mobile, 3 no `md`, 4 no `lg`. Estilo âmbar atual dos cards.
- Card: ícone + nome do livro, "N marcador(es)", "N com nota" (omitido se 0), última atividade relativa (`dayjs().fromNow()`).
- Ordem: última atividade (maior entre `created_at` e `updated_at` dos marcadores do livro), mais recente primeiro.

### Modal do livro (`BookBookmarksModal`)

`Dialog` com `variant="sheet"`.

- Título: nome do livro. Descrição: "N marcadores".
- Lista em ordem canônica (capítulo, depois primeiro versículo). Cada item:
  - referência em negrito ("Levítico 27:1-3, 7");
  - texto do trecho em serif itálico, `line-clamp-3`;
  - nota em bloco âmbar claro abaixo, se houver (`line-clamp` não aplicado: a nota aparece inteira).
- Tocar no item → `router.push(bookmarkHref(bookmark))` e fecha o modal.
- Texto carregado com `getBook(slug)` (cache do app; nenhuma leitura do Firestore). Enquanto carrega, "…" no lugar do texto.

## Código

### `src/lib/bible/bookmarks.ts` (novo, puro, sem Firebase/React)

| Função | Responsabilidade |
|---|---|
| `normalizeBookmarks(raw: unknown[]): BibleBookmark[]` | converte formato antigo, descarta inválidos |
| `formatVerses(verses: number[]): string` | `[1,2,3,7]` → `"1-3, 7"` |
| `formatBookmarkRef(b): string` | `"Levítico 27:1-3, 7"` |
| `parseVerseParam(v: string): number[]` | `"1-3,7"` → `[1,2,3,7]`; inválido → `[]` |
| `findBookmarkForVerse(items, bookId, chapter, verse)` | marcador que contém o versículo, ou `null` |
| `mergeSelection(items, sel, note?, now)` | cria ou funde (regras da seção Fusão); devolve `{ items }` ou `{ error: 'limit' \| 'note-too-long' }` |
| `setNote(items, id, note, now)` | edita a nota (vazia/espaços → remove a nota) |
| `removeBookmark(items, id)` | remove o marcador |
| `groupByBook(items)` | cards: `{ bookId, count, withNote, lastActivity, bookmarks }`, ordenados por atividade |
| `buildQuote(verses, texts, label)` | texto para copiar/compartilhar |

`now` é parâmetro (não `Timestamp.now()` dentro), para os testes não dependerem do relógio nem do Firebase.

### `src/services/firebase/bible.ts`

Mantém `updateBookmarks` (transação) e `getBookmarks` (agora via `normalizeBookmarks`). Troca `addBookmark`/`removeBookmark(ref)` por `saveSelection`, `updateNote` e `removeBookmark(id)`, todas delegando às funções puras. Erros de regra (`limit`, `note-too-long`) são lançados como erro tipado para a store traduzir em toast.

### `src/store/useBibleBookmarks.ts`

Mantém `load` (uma vez por usuário). Troca `toggle` por `saveSelection`, `updateNote` e `remove`, com atualização otimista e rollback + toast em caso de falha (padrão atual).

### `src/types/index.ts`

`BibleBookmark` passa ao formato novo.

### Componentes (`src/app/(protected)/dashboard/bible/components/`)

| Arquivo | Situação |
|---|---|
| `ChapterReader.tsx` | alterado: seleção, estados visuais, `?v=` com trecho; o sheet atual sai do arquivo |
| `SelectionBar.tsx` | novo |
| `VerseActionsSheet.tsx` | novo |
| `BookmarkSheet.tsx` | novo |
| `NoteEditor.tsx` | novo |
| `BookmarksByBook.tsx` | novo (substitui `BookmarksStrip.tsx`) |
| `BookBookmarksModal.tsx` | novo |
| `BookmarksStrip.tsx` | removido |

`[book]/[chapter]/page.tsx` passa a entregar `focusVerses: number[]` (via `parseVerseParam`) ao `ChapterReader`.

## Erros e casos de borda

- **Falha de gravação / sem internet:** rollback do estado + toast. O texto da nota em edição permanece no `NoteEditor` para tentar de novo.
- **Limite de 200:** criação bloqueada com toast; fusões continuam permitidas.
- **Nota unida > 2.000:** gravação recusada com toast (seção Fusão).
- **Nota vazia ou só espaços:** tratada como sem nota.
- **Livro sem cache e sem internet** no modal da tela principal: itens mostram referência e nota; o texto fica "Texto indisponível offline".
- **Item corrompido no documento:** descartado por `normalizeBookmarks`, sem quebrar a tela.

## Testes

`src/lib/bible/bookmarks.test.ts`, rodado por `npm run test:bible` (`node --test`):

- `normalizeBookmarks`: item antigo convertido; item novo preservado; ref inválida e `verses` vazio descartados.
- `formatVerses`: `[7]`, `[1,2,3]`, `[1,2,3,7]`, `[1,3,5]`.
- `parseVerseParam`: `"3"`, `"1-3,7"`, entradas inválidas.
- `mergeSelection`: criação; fusão com um e com dois marcadores (versículos e notas unidos, `id`/`created_at` do mais antigo); bloqueio no 201º; fusão permitida com 200; nota unida acima do limite recusada.
- `setNote`: editar, limpar com espaços.
- `groupByBook`: contagens, `withNote`, ordem por atividade.
- `findBookmarkForVerse`: dentro, fora e em outro capítulo.

UI verificada com `npx tsc --noEmit` e `npm run lint`; teste manual no aparelho pelo usuário.
