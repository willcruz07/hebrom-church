'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Calendar as CalendarIcon,
  BookOpen,
  Quote,
  Filter,
  Trash2,
  Sparkles,
  Share2,
  History,
  CalendarClock,
  ChevronDown,
} from 'lucide-react'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { toast } from 'sonner'
import dayjs from '@/lib/dayjs'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SelectField } from '@/components/ui/select-field'
import { Textarea } from '@/components/ui/textarea'

import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/store/useAuth'
import {
  createDailyWord,
  getDailyWord,
  getPublishedDailyWords,
  getScheduledDailyWords,
  deleteDailyWord,
  isDailyWordDateTaken,
  type DailyWordCursor,
} from '@/services/firebase/daily-word'
import { DailyWord } from '@/types'
import { BIBLE_SEED_DATA } from '@/lib/bible-seed'
import { DAILY_WORD_THEMES, getDailyWordTheme } from '@/lib/daily-word-themes'
import { cn } from '@/lib/utils'

type Tab = 'today' | 'history' | 'themes' | 'scheduled'
type SeedVerse = (typeof BIBLE_SEED_DATA)[number]

const PAGE_SIZE = 10
const THEME_OPTIONS = DAILY_WORD_THEMES.map((t) => ({ value: t.id, label: `${t.icon} ${t.label}` }))

const emptyForm = () => ({
  content: '',
  reference: '',
  theme: 'Fe',
  publish_date: dayjs().format('YYYY-MM-DD'),
})

/** "Hoje", "Ontem", "Amanhã" ou "seg, 06 de out". */
function formatWordDate(date: string) {
  const d = dayjs(date)
  const today = dayjs().startOf('day')
  const diff = d.diff(today, 'day')
  if (diff === 0) return 'Hoje'
  if (diff === -1) return 'Ontem'
  if (diff === 1) return 'Amanhã'
  return d.format(d.year() === today.year() ? 'ddd, DD [de] MMM' : 'DD [de] MMM [de] YYYY')
}

function pickRandomVerse(themeId: string): SeedVerse | null {
  const verses = BIBLE_SEED_DATA.filter((v) => v.theme === themeId)
  return verses.length ? verses[Math.floor(Math.random() * verses.length)] : null
}

async function shareWord(word: Pick<DailyWord, 'content' | 'reference'>) {
  const text = `📖 Palavra do Dia\n\n"${word.content}"${word.reference ? `\n— ${word.reference}` : ''}`
  try {
    if (navigator.share) {
      await navigator.share({ text })
    } else {
      await navigator.clipboard.writeText(text)
      toast.success('Palavra copiada!')
    }
  } catch {
    // Usuário cancelou o compartilhamento
  }
}

export default function DailyWordPage() {
  const { currentUser } = useAuth()
  const { isPastor, isSecretary } = usePermissions()
  const canManage = isPastor || isSecretary

  const [tab, setTab] = useState<Tab>('today')

  const [todayWord, setTodayWord] = useState<DailyWord | null>(null)
  const [loadingToday, setLoadingToday] = useState(true)

  const [history, setHistory] = useState<DailyWord[]>([])
  const [historyCursor, setHistoryCursor] = useState<DailyWordCursor>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [scheduled, setScheduled] = useState<DailyWord[] | null>(null)

  const [selectedTheme, setSelectedTheme] = useState('')
  const [selectedVerse, setSelectedVerse] = useState<SeedVerse | null>(null)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newWord, setNewWord] = useState(emptyForm)

  const loadToday = useCallback(async () => {
    setLoadingToday(true)
    try {
      setTodayWord(await getDailyWord(dayjs().format('YYYY-MM-DD')))
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar a palavra de hoje')
    } finally {
      setLoadingToday(false)
    }
  }, [])

  const loadHistory = useCallback(async (cursor: DailyWordCursor = null) => {
    setLoadingHistory(true)
    try {
      const page = await getPublishedDailyWords(PAGE_SIZE, cursor)
      setHistory((prev) => (cursor ? [...prev, ...page.words] : page.words))
      setHistoryCursor(page.cursor)
      setHistoryLoaded(true)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar palavras anteriores')
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  const loadScheduled = useCallback(async () => {
    try {
      setScheduled(await getScheduledDailyWords())
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar palavras agendadas')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadToday()
  }, [loadToday])

  // As listas só são buscadas quando a aba é aberta pela primeira vez
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab === 'history' && !historyLoaded) loadHistory()
    if (tab === 'scheduled' && scheduled === null) loadScheduled()
  }, [tab, historyLoaded, scheduled, loadHistory, loadScheduled])

  const refreshAll = () => {
    loadToday()
    if (historyLoaded) loadHistory()
    if (scheduled !== null) loadScheduled()
  }

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
    setSelectedVerse(pickRandomVerse(themeId))
  }

  const handleCreate = async () => {
    if (!newWord.content.trim() || !currentUser) return

    if (newWord.publish_date < dayjs().format('YYYY-MM-DD')) {
      toast.error('A data de publicação não pode estar no passado.')
      return
    }

    setIsSubmitting(true)
    try {
      if (await isDailyWordDateTaken(newWord.publish_date)) {
        toast.error(
          `Já existe uma palavra para ${dayjs(newWord.publish_date).format('DD/MM')}. Exclua a atual antes de lançar outra.`,
        )
        return
      }

      await createDailyWord({
        content: newWord.content.trim(),
        reference: newWord.reference.trim(),
        theme: newWord.theme,
        publish_date: newWord.publish_date,
        author_uid: currentUser.uid,
        author_name: currentUser.profile.full_name,
      })

      const isToday = newWord.publish_date === dayjs().format('YYYY-MM-DD')
      toast.success(
        isToday
          ? 'Palavra lançada! Todos foram notificados.'
          : `Palavra agendada para ${dayjs(newWord.publish_date).format('DD/MM')}. A notificação sai no dia, às 07:00.`,
      )
      setIsDialogOpen(false)
      setNewWord(emptyForm())
      refreshAll()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao lançar palavra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (word: DailyWord) => {
    if (!confirm(`Excluir a palavra de ${dayjs(word.publish_date).format('DD/MM')}?`)) return
    try {
      await deleteDailyWord(word.id)
      toast.success('Palavra excluída')
      refreshAll()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao excluir')
    }
  }

  const renderWordItem = (word: DailyWord, variant: 'history' | 'scheduled') => {
    const theme = getDailyWordTheme(word.theme)
    const isExpanded = expandedId === word.id

    return (
      <li
        key={word.id}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                variant === 'scheduled'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              )}
            >
              {formatWordDate(word.publish_date)}
            </span>
            <span className="truncate text-xs text-slate-500">
              {theme.icon} {theme.label}
            </span>
          </div>
          <div className="flex shrink-0 items-center">
            {variant === 'history' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400"
                onClick={() => shareWord(word)}
                aria-label="Compartilhar"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-600"
                onClick={() => handleDelete(word)}
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpandedId(isExpanded ? null : word.id)}
          className="mt-3 block w-full text-left"
        >
          <p
            className={cn(
              'font-serif text-base italic leading-relaxed text-slate-800 dark:text-slate-100',
              !isExpanded && 'line-clamp-3',
            )}
          >
            “{word.content}”
          </p>
          {word.reference && (
            <p className="mt-2 text-sm font-bold text-amber-600 dark:text-amber-400">
              — {word.reference}
            </p>
          )}
        </button>

        <p className="mt-2 text-[11px] text-slate-400">Por {word.author_name}</p>
      </li>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-amber-600" />
            Palavra do Dia
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
            Alimente sua fé diariamente com versículos e meditações.
          </p>
        </div>

        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 rounded-xl shadow-lg shadow-amber-500/20">
                <Plus className="mr-2 h-4 w-4" /> Lançar Palavra
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
              <DialogHeader>
                <DialogTitle>Nova Palavra do Dia</DialogTitle>
                <DialogDescription>
                  Para hoje, todos são notificados na hora. Para outra data, a notificação sai
                  no dia, às 07:00.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Data de Publicação</Label>
                  <Input
                    type="date"
                    min={dayjs().format('YYYY-MM-DD')}
                    value={newWord.publish_date}
                    onChange={(e) => setNewWord({ ...newWord, publish_date: e.target.value })}
                  />
                </div>
                <SelectField
                  label="Tema"
                  options={THEME_OPTIONS}
                  value={newWord.theme}
                  onValueChange={(v) => setNewWord({ ...newWord, theme: v })}
                  className="grid gap-2 space-y-0"
                />
                <div className="grid gap-2">
                  <Label>Palavra / Versículo</Label>
                  <Textarea
                    placeholder="Digite a mensagem aqui..."
                    className="min-h-[120px]"
                    value={newWord.content}
                    onChange={(e) => setNewWord({ ...newWord, content: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Referência (Opcional)</Label>
                  <Input
                    placeholder="Ex: João 3:16"
                    value={newWord.reference}
                    onChange={(e) => setNewWord({ ...newWord, reference: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isSubmitting || !newWord.content.trim()}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isSubmitting ? <HebromSpinner size="sm" className="brightness-200" /> : 'Lançar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full">
        <TabsList
          className={cn(
            'grid w-full rounded-xl bg-slate-100 dark:bg-slate-800 p-1 md:w-[480px]',
            canManage ? 'grid-cols-4' : 'grid-cols-3',
          )}
        >
          <TabsTrigger value="today" className="rounded-lg text-xs">
            Hoje
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-xs">
            Anteriores
          </TabsTrigger>
          <TabsTrigger value="themes" className="rounded-lg text-xs">
            Temas
          </TabsTrigger>
          {canManage && (
            <TabsTrigger value="scheduled" className="rounded-lg text-xs">
              Agendadas
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="today" className="mt-6 space-y-6">
          {loadingToday ? (
            <div className="flex justify-center py-20">
              <HebromSpinner size="lg" />
            </div>
          ) : todayWord ? (
            <Card className="relative overflow-hidden border-none shadow-2xl dark:bg-slate-900 bg-white">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Quote className="h-32 w-32 rotate-180" />
              </div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-purple-600 to-pink-600" />

              <CardHeader className="pt-12 pb-6 px-6 md:px-8 text-center">
                <div className="mx-auto mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-widest">
                  <Sparkles className="h-3 w-3" />
                  {getDailyWordTheme(todayWord.theme).icon} {getDailyWordTheme(todayWord.theme).label}
                </div>
                <CardTitle className="text-xl md:text-4xl font-serif italic leading-relaxed text-slate-800 dark:text-white">
                  {todayWord.content}
                </CardTitle>
                {todayWord.reference && (
                  <p className="mt-6 text-base md:text-xl font-bold text-amber-600 dark:text-amber-400">
                    — {todayWord.reference}
                  </p>
                )}
              </CardHeader>

              <CardFooter className="bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 px-6 md:px-8 py-4 flex flex-wrap justify-between items-center gap-3">
                <div className="flex flex-col text-sm text-slate-500">
                  <span className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dayjs(todayWord.publish_date).format('DD [de] MMMM, YYYY')}
                  </span>
                  <span className="text-xs text-slate-400">Por {todayWord.author_name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareWord(todayWord)}
                  className="rounded-full border-amber-200 text-amber-600 hover:bg-amber-50"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-dashed border-2 py-16 text-center">
              <CardContent className="space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center dark:bg-slate-800">
                  <BookOpen className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold">
                    Nenhuma palavra lançada para hoje
                  </h3>
                  <p className="text-slate-500">Aguarde a atualização do pastor ou secretaria.</p>
                </div>
                <Button variant="outline" className="rounded-full" onClick={() => setTab('history')}>
                  <History className="mr-2 h-4 w-4" />
                  Ver palavras anteriores
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {!historyLoaded ? (
            <div className="flex justify-center py-20">
              <HebromSpinner size="lg" />
            </div>
          ) : history.length === 0 ? (
            <p className="py-16 text-center text-slate-500">Nenhuma palavra publicada ainda.</p>
          ) : (
            <div className="space-y-4">
              <ul className="space-y-3">{history.map((w) => renderWordItem(w, 'history'))}</ul>
              {historyCursor && (
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  disabled={loadingHistory}
                  onClick={() => loadHistory(historyCursor)}
                >
                  {loadingHistory ? (
                    <HebromSpinner size="sm" />
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Carregar mais
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="themes" className="mt-6 space-y-8">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {DAILY_WORD_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 gap-1.5',
                  selectedTheme === theme.id
                    ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-500/25 scale-105'
                    : 'bg-white border-slate-200 hover:border-amber-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400',
                )}
              >
                <span className="text-2xl">{theme.icon}</span>
                <span className="text-[11px] font-bold uppercase tracking-tighter">{theme.label}</span>
              </button>
            ))}
          </div>

          {selectedTheme && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base md:text-xl font-bold flex items-center gap-2">
                  <Filter className="h-5 w-5 text-amber-600" />
                  Versículo sobre {getDailyWordTheme(selectedTheme).label}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleThemeSelect(selectedTheme)}
                  className="rounded-full border-amber-200 text-amber-600 hover:bg-amber-50"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Sortear outro
                </Button>
              </div>

              {selectedVerse ? (
                <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-amber-600 to-purple-700 text-white">
                  <div className="absolute top-0 right-0 p-6 opacity-20">
                    <Quote className="h-24 w-24 rotate-180" />
                  </div>
                  <CardHeader className="pt-10 pb-6 px-6 md:px-8 text-center">
                    <CardTitle className="text-lg md:text-3xl font-serif italic leading-relaxed">
                      {selectedVerse.descricao}
                    </CardTitle>
                    <p className="mt-6 text-sm md:text-xl font-bold text-amber-100">
                      — {selectedVerse.referencia}
                    </p>
                  </CardHeader>
                  <CardFooter className="bg-black/10 px-8 py-4 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        shareWord({ content: selectedVerse.descricao, reference: selectedVerse.referencia })
                      }
                      className="rounded-full text-amber-50 hover:bg-white/10 hover:text-white"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartilhar
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <p className="text-center py-10 text-slate-500">
                  Nenhum versículo encontrado para este tema.
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {canManage && (
          <TabsContent value="scheduled" className="mt-6">
            {scheduled === null ? (
              <div className="flex justify-center py-20">
                <HebromSpinner size="lg" />
              </div>
            ) : scheduled.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <CalendarClock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                Nenhuma palavra agendada para os próximos dias.
              </div>
            ) : (
              <ul className="space-y-3">{scheduled.map((w) => renderWordItem(w, 'scheduled'))}</ul>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
