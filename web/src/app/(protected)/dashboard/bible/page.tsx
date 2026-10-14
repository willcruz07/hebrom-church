import { Book } from 'lucide-react'
import { PageTitle } from '@/components/ui/page-title'
import { BibleCredit } from './components/BibleCredit'
import { BibleSearch } from './components/BibleSearch'
import { BookGrid } from './components/BookGrid'
import { BookmarksStrip } from './components/BookmarksStrip'
import { ContinueReading } from './components/ContinueReading'

export default function BiblePage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageTitle
        title="Bíblia"
        icon={<Book className="h-6 w-6 shrink-0 text-amber-600 md:h-8 md:w-8" />}
        description="Leia a Palavra livro por livro, capítulo por capítulo."
      />
      <BibleSearch />
      <ContinueReading />
      <BookmarksStrip />
      <BookGrid testament="VT" title="Velho Testamento" />
      <BookGrid testament="NT" title="Novo Testamento" />
      <BibleCredit />
    </div>
  )
}
