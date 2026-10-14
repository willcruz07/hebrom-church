import { notFound } from 'next/navigation'
import { parseVerseParam } from '@/lib/bible/bookmarks'
import { findBookBySlug, isValidChapter, isValidVerse } from '@/lib/bible/catalog'
import { ChapterReader } from '../../components/ChapterReader'

export default async function BibleChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ book: string; chapter: string }>
  searchParams: Promise<{ v?: string }>
}) {
  const { book: slug, chapter: rawChapter } = await params
  const { v } = await searchParams
  const book = findBookBySlug(slug)
  const chapter = Number(rawChapter)
  if (!book || !/^\d+$/.test(rawChapter) || !isValidChapter(book, chapter)) notFound()

  // ?v=3 (versículo) ou ?v=1-3,7 (trecho de marcador)
  const focusVerses = parseVerseParam(v).filter((verse) => isValidVerse(book, chapter, verse))
  return <ChapterReader slug={book.slug} chapter={chapter} focusVerses={focusVerses} />
}
