'use client'

import { useState, useEffect } from 'react'
import {
  Heart,
  Search,
  Plus,
  Calendar as CalendarIcon,
  BookOpen,
  Quote,
  Filter,
  Trash2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { toast } from 'sonner'
import dayjs from 'dayjs'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/store/useAuth'
import {
  createDailyWord,
  getDailyWord,
  getDailyWords,
  deleteDailyWord,
} from '@/services/firebase/daily-word'
import { DailyWord } from '@/types'
import { BIBLE_SEED_DATA } from '@/lib/bible-seed'
import { cn } from '@/lib/utils'

const THEMES = [
  { id: 'Fe', label: 'Fé', icon: '🙏' },
  { id: 'Esperanca', label: 'Esperança', icon: '⚓' },
  { id: 'Amor', label: 'Amor', icon: '❤️' },
  { id: 'Motivacao', label: 'Motivação', icon: '🚀' },
  { id: 'Gratidao', label: 'Gratidão', icon: '🙌' },
  { id: 'Sabedoria', label: 'Sabedoria', icon: '💡' },
  { id: 'Paz', label: 'Paz', icon: '🕊️' },
  { id: 'Coragem', label: 'Coragem', icon: '🛡️' },
  { id: 'Cura', label: 'Cura', icon: '🏥' },
  { id: 'Familia', label: 'Família', icon: '👨‍👩‍👧‍👦' },
  { id: 'Prosperidade', label: 'Prosperidade', icon: '💰' },
  { id: 'Perdao', label: 'Perdão', icon: '🤝' },
  { id: 'Perseveranca', label: 'Perseverança', icon: '🏃' },
  { id: 'Oracao', label: 'Oração', icon: '🛐' },
  { id: 'Louvor', label: 'Louvor', icon: '🎵' },
  { id: 'Santidade', label: 'Santidade', icon: '✨' },
  { id: 'Humildade', label: 'Humildade', icon: '🙇' },
  { id: 'Disciplina', label: 'Disciplina', icon: '⚖️' },
]

export default function DailyWordPage() {
  const { currentUser } = useAuth()
  const { isPastor, isSecretary } = usePermissions()
  const canManage = isPastor || isSecretary

  const [todayWord, setTodayWord] = useState<DailyWord | null>(null)
  const [selectedVerse, setSelectedVerse] = useState<any | null>(null)
  const [allWords, setAllWords] = useState<DailyWord[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state
  const [newWord, setNewWord] = useState({
    content: '',
    reference: '',
    theme: 'Fe',
    publish_date: dayjs().format('YYYY-MM-DD'),
  })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const today = dayjs().format('YYYY-MM-DD')
      const word = await getDailyWord(today)
      setTodayWord(word)

      if (canManage) {
        const history = await getDailyWords(20)
        setAllWords(history)
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
    setLoading(true)

    // Simulate a small loading for better UX
    setTimeout(() => {
      const filtered = BIBLE_SEED_DATA.filter((v) => v.theme === themeId)
      if (filtered.length > 0) {
        const randomIndex = Math.floor(Math.random() * filtered.length)
        setSelectedVerse(filtered[randomIndex])
      } else {
        setSelectedVerse(null)
      }
      setLoading(false)
    }, 400)
  }

  const handleCreate = async () => {
    if (!newWord.content || !currentUser) return

    setIsSubmitting(true)
    try {
      await createDailyWord({
        content: newWord.content,
        reference: newWord.reference,
        theme: newWord.theme,
        publish_date: newWord.publish_date,
        author_uid: currentUser.uid,
        author_name: currentUser.profile.full_name,
      })
      toast.success('Palavra lançada com sucesso!')
      setIsDialogOpen(false)
      setNewWord({
        content: '',
        reference: '',
        theme: 'Fe',
        publish_date: dayjs().format('YYYY-MM-DD'),
      })
      loadData()
    } catch (error) {
      toast.error('Erro ao lançar palavra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta palavra?')) return
    try {
      await deleteDailyWord(id)
      toast.success('Excluído com sucesso')
      loadData()
    } catch (error) {
      toast.error('Erro ao excluir')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-amber-600" />
            Palavra do Dia
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
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
                  Preencha os dados abaixo para lançar uma nova palavra ou versículo.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Data de Publicação</Label>
                  <Input
                    type="date"
                    value={newWord.publish_date}
                    onChange={(e) => setNewWord({ ...newWord, publish_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tema</Label>
                  <Select
                    value={newWord.theme}
                    onValueChange={(v) => setNewWord({ ...newWord, theme: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tema" />
                    </SelectTrigger>
                    <SelectContent>
                      {THEMES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isSubmitting ? <HebromSpinner size="sm" className="brightness-200" /> : 'Lançar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[300px] rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <TabsTrigger value="today" className="rounded-lg">
            Hoje
          </TabsTrigger>
          <TabsTrigger value="themes" className="rounded-lg">
            Temas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-8 space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <HebromSpinner size="lg" />
            </div>
          ) : todayWord ? (
            <Card className="relative overflow-hidden border-none shadow-2xl dark:bg-slate-900 bg-white">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Quote className="h-32 w-32 rotate-180" />
              </div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-purple-600 to-pink-600" />

              <CardHeader className="pt-12 pb-6 px-8 text-center">
                <div className="mx-auto mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-widest">
                  <Sparkles className="h-3 w-3" />
                  Palavra de Hoje
                </div>
                <CardTitle className="text-2xl md:text-4xl font-serif italic leading-relaxed text-slate-800 dark:text-white">
                  {todayWord.content}
                </CardTitle>
                {todayWord.reference && (
                  <p className="mt-6 text-xl font-bold text-amber-600 dark:text-amber-400">
                    — {todayWord.reference}
                  </p>
                )}
              </CardHeader>

              <CardFooter className="bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CalendarIcon className="h-4 w-4" />
                  {dayjs(todayWord.publish_date).format('DD [de] MMMM, YYYY')}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    Por {todayWord.author_name}
                  </span>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-dashed border-2 py-20 text-center">
              <CardContent className="space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center dark:bg-slate-800">
                  <BookOpen className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Nenhuma palavra lançada para hoje</h3>
                  <p className="text-slate-500">Aguarde a atualização do pastor ou secretaria.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="themes" className="mt-8 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 gap-2',
                  selectedTheme === theme.id
                    ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-500/25 scale-105'
                    : 'bg-white border-slate-200 hover:border-amber-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400',
                )}
              >
                <span className="text-2xl">{theme.icon}</span>
                <span className="text-xs font-bold uppercase tracking-tighter">{theme.label}</span>
              </button>
            ))}
          </div>

          {selectedTheme && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Filter className="h-5 w-5 text-amber-600" />
                  Versículo sobre {THEMES.find((t) => t.id === selectedTheme)?.label}
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

              {loading ? (
                <div className="flex justify-center py-20">
                  <HebromSpinner size="lg" />
                </div>
              ) : selectedVerse ? (
                <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-amber-600 to-purple-700 text-white">
                  <div className="absolute top-0 right-0 p-6 opacity-20">
                    <Quote className="h-24 w-24 rotate-180" />
                  </div>
                  <CardHeader className="pt-10 pb-6 px-8 text-center">
                    <CardTitle className="text-xl md:text-3xl font-serif italic leading-relaxed">
                      {selectedVerse.descricao}
                    </CardTitle>
                    <p className="mt-6 text-xl font-bold text-amber-100">
                      — {selectedVerse.referencia}
                    </p>
                  </CardHeader>
                  <CardFooter className="bg-black/10 px-8 py-4 flex justify-center">
                    <p className="text-sm font-medium text-amber-50">
                      Palavra de vida para o seu coração
                    </p>
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
      </Tabs>
    </div>
  )
}
