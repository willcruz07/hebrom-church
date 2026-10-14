import { notFound } from 'next/navigation'
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

  const verse = Number(v)
  return (
    <ChapterReader
      slug={book.slug}
      chapter={chapter}
      focusVerse={isValidVerse(book, chapter, verse) ? verse : undefined}
    />
  )
}
