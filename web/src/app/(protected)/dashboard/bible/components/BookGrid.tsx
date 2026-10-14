import Link from 'next/link'
import { bookHref, booksOf } from '@/lib/bible/catalog'
import type { Testament } from '@/lib/bible/types'

export function BookGrid({ testament, title }: { testament: Testament; title: string }) {
  const books = booksOf(testament)

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
        {title} <span className="font-normal normal-case tracking-normal">· {books.length} livros</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {books.map((book) => (
          <Link
            key={book.slug}
            href={bookHref(book.slug)}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="block font-serif text-lg font-bold text-slate-800 group-hover:text-amber-700 dark:text-slate-100 dark:group-hover:text-amber-400">
              {book.name}
            </span>
            <span className="text-xs text-slate-500">
              {book.verses.length} {book.verses.length === 1 ? 'capítulo' : 'capítulos'}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
