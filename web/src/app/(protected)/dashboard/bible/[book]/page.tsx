import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { PageTitle } from '@/components/ui/page-title'
import { ROUTES } from '@/paths'
import { chapterHref, findBookBySlug } from '@/lib/bible/catalog'
import { BibleCredit } from '../components/BibleCredit'

export default async function BibleBookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params
  const book = findBookBySlug(slug)
  if (!book) notFound()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href={ROUTES.AUTHENTICATED.BIBLE}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-amber-700 dark:hover:text-amber-400"
      >
        <ChevronLeft className="h-4 w-4" />
        Livros
      </Link>
      <PageTitle
        title={<span className="font-serif">{book.name}</span>}
        description={`${book.verses.length} ${book.verses.length === 1 ? 'capítulo' : 'capítulos'} · ${
          book.testament === 'VT' ? 'Velho' : 'Novo'
        } Testamento`}
      />
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
        {book.verses.map((count, i) => (
          <Link
            key={i}
            href={chapterHref(book.slug, i + 1)}
            title={`${count} versículos`}
            className="flex aspect-square items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-700 shadow-sm transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-amber-900/20 dark:hover:text-amber-400"
          >
            {i + 1}
          </Link>
        ))}
      </div>
      <BibleCredit />
    </div>
  )
}
