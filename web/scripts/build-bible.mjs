// Gera a Bíblia (João Ferreira de Almeida, domínio público) em JSON estático a partir
// do USFX do repositório seven1m/open-bibles.
// Uso (de dentro de web/): node scripts/build-bible.mjs <por-almeida.usfx.xml>
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// [código USFX, slug, nome, abreviações (minúsculas, sem acento, sem espaço)]
const BOOKS = [
  ['GEN', 'genesis', 'Gênesis', ['gn', 'gen']],
  ['EXO', 'exodo', 'Êxodo', ['ex', 'exo']],
  ['LEV', 'levitico', 'Levítico', ['lv', 'lev']],
  ['NUM', 'numeros', 'Números', ['nm', 'num']],
  ['DEU', 'deuteronomio', 'Deuteronômio', ['dt', 'deut']],
  ['JOS', 'josue', 'Josué', ['js', 'jos']],
  ['JDG', 'juizes', 'Juízes', ['jz', 'jui']],
  ['RUT', 'rute', 'Rute', ['rt']],
  ['1SA', '1-samuel', '1 Samuel', ['1sm', '1sam']],
  ['2SA', '2-samuel', '2 Samuel', ['2sm', '2sam']],
  ['1KI', '1-reis', '1 Reis', ['1rs']],
  ['2KI', '2-reis', '2 Reis', ['2rs']],
  ['1CH', '1-cronicas', '1 Crônicas', ['1cr', '1cro']],
  ['2CH', '2-cronicas', '2 Crônicas', ['2cr', '2cro']],
  ['EZR', 'esdras', 'Esdras', ['ed', 'esd']],
  ['NEH', 'neemias', 'Neemias', ['ne', 'nee']],
  ['EST', 'ester', 'Ester', ['et', 'est']],
  ['JOB', 'jo', 'Jó', ['job']],
  ['PSA', 'salmos', 'Salmos', ['sl', 'sal', 'salmo']],
  ['PRO', 'proverbios', 'Provérbios', ['pv', 'pr', 'prov']],
  ['ECC', 'eclesiastes', 'Eclesiastes', ['ec', 'ecl']],
  ['SNG', 'canticos', 'Cânticos', ['ct', 'cant']],
  ['ISA', 'isaias', 'Isaías', ['is', 'isa']],
  ['JER', 'jeremias', 'Jeremias', ['jr', 'jer']],
  ['LAM', 'lamentacoes', 'Lamentações', ['lm', 'lam']],
  ['EZK', 'ezequiel', 'Ezequiel', ['ez', 'eze']],
  ['DAN', 'daniel', 'Daniel', ['dn', 'dan']],
  ['HOS', 'oseias', 'Oseias', ['os']],
  ['JOL', 'joel', 'Joel', ['jl']],
  ['AMO', 'amos', 'Amós', ['am']],
  ['OBA', 'obadias', 'Obadias', ['ob', 'obd']],
  ['JON', 'jonas', 'Jonas', ['jn']],
  ['MIC', 'miqueias', 'Miqueias', ['mq']],
  ['NAM', 'naum', 'Naum', ['na']],
  ['HAB', 'habacuque', 'Habacuque', ['hc', 'hab']],
  ['ZEP', 'sofonias', 'Sofonias', ['sf', 'sof']],
  ['HAG', 'ageu', 'Ageu', ['ag']],
  ['ZEC', 'zacarias', 'Zacarias', ['zc', 'zac']],
  ['MAL', 'malaquias', 'Malaquias', ['ml', 'mal']],
  ['MAT', 'mateus', 'Mateus', ['mt', 'mat']],
  ['MRK', 'marcos', 'Marcos', ['mc', 'mar']],
  ['LUK', 'lucas', 'Lucas', ['lc', 'luc']],
  ['JHN', 'joao', 'João', ['jo', 'joa']],
  ['ACT', 'atos', 'Atos', ['at']],
  ['ROM', 'romanos', 'Romanos', ['rm', 'rom']],
  ['1CO', '1-corintios', '1 Coríntios', ['1co', '1cor']],
  ['2CO', '2-corintios', '2 Coríntios', ['2co', '2cor']],
  ['GAL', 'galatas', 'Gálatas', ['gl', 'gal']],
  ['EPH', 'efesios', 'Efésios', ['ef', 'efe']],
  ['PHP', 'filipenses', 'Filipenses', ['fp', 'fil']],
  ['COL', 'colossenses', 'Colossenses', ['cl', 'col']],
  ['1TH', '1-tessalonicenses', '1 Tessalonicenses', ['1ts', '1tes']],
  ['2TH', '2-tessalonicenses', '2 Tessalonicenses', ['2ts', '2tes']],
  ['1TI', '1-timoteo', '1 Timóteo', ['1tm', '1tim']],
  ['2TI', '2-timoteo', '2 Timóteo', ['2tm', '2tim']],
  ['TIT', 'tito', 'Tito', ['tt']],
  ['PHM', 'filemom', 'Filemom', ['fm', 'flm']],
  ['HEB', 'hebreus', 'Hebreus', ['hb', 'heb']],
  ['JAS', 'tiago', 'Tiago', ['tg', 'tia']],
  ['1PE', '1-pedro', '1 Pedro', ['1pe', '1pd']],
  ['2PE', '2-pedro', '2 Pedro', ['2pe', '2pd']],
  ['1JN', '1-joao', '1 João', ['1jo']],
  ['2JN', '2-joao', '2 João', ['2jo']],
  ['3JN', '3-joao', '3 João', ['3jo']],
  ['JUD', 'judas', 'Judas', ['jd', 'jud']],
  ['REV', 'apocalipse', 'Apocalipse', ['ap', 'apc', 'apoc']],
]

const EXPECTED = { books: 66, chapters: 1189, verses: 31098 }
const OUT_JSON = 'public/bible/almeida'
const OUT_TS = 'src/lib/bible/books.generated.ts'

const fail = (message) => {
  console.error(`✖ ${message}`)
  process.exit(1)
}

const source = process.argv[2]
if (!source) fail('Uso: node scripts/build-bible.mjs <por-almeida.usfx.xml>')

const abbrevs = BOOKS.flatMap(([, , , a]) => a)
if (new Set(abbrevs).size !== abbrevs.length) fail('Abreviação repetida na tabela BOOKS')

const xml = readFileSync(source, 'utf8')
const parsed = new Map()

for (const block of xml.split('<book id="').slice(1)) {
  const id = block.slice(0, block.indexOf('"'))
  const chapters = block
    .split('<c id="')
    .slice(1)
    .map((chunk, ci) => {
      const number = Number(chunk.slice(0, chunk.indexOf('"')))
      if (number !== ci + 1) fail(`${id}: capítulo ${number} fora de ordem`)
      return [...chunk.matchAll(/<v id="(\d+)"\/>([\s\S]*?)<ve\/>/g)].map((m, vi) => {
        if (Number(m[1]) !== vi + 1) fail(`${id} ${number}: versículo ${m[1]} fora de ordem`)
        const text = m[2].replace(/\s+/g, ' ').trim().normalize('NFC')
        if (!text) fail(`${id} ${number}:${m[1]} vazio`)
        if (/[<>&]/.test(text)) fail(`${id} ${number}:${m[1]} tem marcação no texto`)
        return text
      })
    })
  parsed.set(id, chapters)
}

for (const [id] of BOOKS) if (!parsed.has(id)) fail(`Livro ${id} não encontrado no USFX`)
if (parsed.size !== EXPECTED.books) fail(`Esperava ${EXPECTED.books} livros, veio ${parsed.size}`)

const chapterTotal = [...parsed.values()].reduce((s, c) => s + c.length, 0)
const verseTotal = [...parsed.values()].flat().reduce((s, v) => s + v.length, 0)
if (chapterTotal !== EXPECTED.chapters) fail(`Esperava ${EXPECTED.chapters} capítulos, veio ${chapterTotal}`)
if (verseTotal !== EXPECTED.verses) fail(`Esperava ${EXPECTED.verses} versículos, veio ${verseTotal}`)

rmSync(OUT_JSON, { recursive: true, force: true })
mkdirSync(OUT_JSON, { recursive: true })
for (const [id, slug, name] of BOOKS) {
  const book = { id, slug, name, chapters: parsed.get(id) }
  writeFileSync(join(OUT_JSON, `${slug}.json`), JSON.stringify(book))
}

const meta = BOOKS.map(([id, slug, name, a], i) => ({
  id,
  slug,
  name,
  testament: i < 39 ? 'VT' : 'NT',
  abbrevs: a,
  verses: parsed.get(id).map((c) => c.length),
}))
writeFileSync(
  OUT_TS,
  `// Gerado por scripts/build-bible.mjs — não editar à mão.\n` +
    `import type { BibleBookMeta } from './types.ts'\n\n` +
    `export const BIBLE_BOOKS: BibleBookMeta[] = [\n` +
    meta.map((m) => `  ${JSON.stringify(m)},`).join('\n') +
    `\n]\n`,
)

console.log(`✔ ${parsed.size} livros, ${chapterTotal} capítulos, ${verseTotal} versículos`)
