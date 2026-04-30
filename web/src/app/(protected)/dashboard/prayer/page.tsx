'use client'

import { useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/store/useAuth'
import {
  Heart,
  Plus,
  Search,
  MessageCircle,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  CalendarIcon,
  Archive,
  ArchiveRestore,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PrayerRequest } from '@/types'

// Mock data atualizado com a nova interface
const mockPrayers: PrayerRequest[] = [
  {
    id: '1',
    author_uid: 'user1',
    author_name: 'João Silva',
    request_text: 'Pela saúde da minha família e por emprego.',
    is_confidential: false,
    status: 'praying',
    is_archived: false,
    created_at: Date.now() - 1000 * 60 * 60 * 2, // 2h atrás
    updated_at: Date.now() - 1000 * 60 * 60 * 1,
    viewed_by_pastor: {
      uid: 'pastor1',
      name: 'Pastor André',
    },
    pastor_response: 'Estamos em oração por você, João! Deus proverá.',
  },
  {
    id: '2',
    author_uid: 'user2',
    author_name: 'Maria Oliveira',
    request_text: 'Pedido confidencial de intercessão por um problema familiar.',
    is_confidential: true,
    status: 'pending',
    is_archived: false,
    created_at: Date.now() - 1000 * 60 * 60 * 24, // 1 dia atrás
    updated_at: Date.now() - 1000 * 60 * 60 * 24,
  },
]

export default function PrayerPage() {
  const { permissions, isPastor, isSecretary } = usePermissions()
  const { currentUser } = useAuth()
  const [prayers, setPrayers] = useState<PrayerRequest[]>(mockPrayers)
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)
  const [isViewRequestOpen, setIsViewRequestOpen] = useState(false)
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerRequest | null>(null)
  const [newRequestText, setNewRequestText] = useState('')
  const [isConfidential, setIsConfidential] = useState(false)
  const [pastorResponse, setPastorResponse] = useState('')
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPrayers = prayers.filter((p) => {
    // Filtro de Arquivados vs Ativos
    const matchesTab = viewTab === 'active' ? !p.is_archived : p.is_archived
    if (!matchesTab) return false

    // Busca por texto ou autor
    const matchesSearch =
      p.request_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.author_name.toLowerCase().includes(searchTerm.toLowerCase())

    // Filtro de data
    let matchesDate = true
    if (dateFilter) {
      const prayerDate = new Date(p.created_at)
      matchesDate = prayerDate.toDateString() === dateFilter.toDateString()
    }

    // Regra de visibilidade
    const isOwner = p.author_uid === currentUser?.uid
    const canSeeConfidential = isPastor || isSecretary

    if (p.is_confidential && !isOwner && !canSeeConfidential) return false

    return matchesSearch && matchesDate
  })

  const handleCreateRequest = () => {
    if (!newRequestText.trim()) return

    const newRequest: PrayerRequest = {
      id: Math.random().toString(36).substr(2, 9),
      author_uid: currentUser?.uid || 'guest',
      author_name: currentUser?.profile.full_name || 'Visitante',
      request_text: newRequestText,
      is_confidential: isConfidential,
      status: 'pending',
      is_archived: false,
      created_at: Date.now(),
      updated_at: Date.now(),
    }

    setPrayers([newRequest, ...prayers])
    setNewRequestText('')
    setIsConfidential(false)
    setIsNewRequestOpen(false)
  }

  const handleOpenRequest = (prayer: PrayerRequest) => {
    setSelectedPrayer(prayer)
    setIsViewRequestOpen(true)
    setPastorResponse(prayer.pastor_response || '')

    // Se for pastor e o pedido estiver pendente, marca como visualizado
    if (isPastor && prayer.status === 'pending') {
      const updatedPrayers = prayers.map((p) =>
        p.id === prayer.id
          ? {
              ...p,
              status: 'viewed' as const,
              viewed_by_pastor: {
                uid: currentUser?.uid || '',
                name: currentUser?.profile.full_name || 'Pastor',
              },
            }
          : p,
      )
      setPrayers(updatedPrayers)
    }
  }

  const handlePastorResponse = () => {
    if (!selectedPrayer || !isPastor) return

    const updatedPrayers = prayers.map((p) =>
      p.id === selectedPrayer.id
        ? { ...p, pastor_response: pastorResponse, status: 'praying' as const }
        : p,
    )
    setPrayers(updatedPrayers)
    setIsViewRequestOpen(false)
  }

  const handleDeleteRequest = (id: string) => {
    setPrayers(prayers.filter((p) => p.id !== id))
  }

  const handleToggleArchive = (id: string) => {
    setPrayers(prayers.map((p) => (p.id === id ? { ...p, is_archived: !p.is_archived } : p)))
  }

  const getStatusBadge = (status: PrayerRequest['status'], viewedBy?: any) => {
    switch (status) {
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400"
          >
            <Clock className="h-3 w-3" />
            PENDENTE
          </Badge>
        )
      case 'viewed':
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400"
          >
            <Eye className="h-3 w-3" />
            VISUALIZADO {viewedBy && `POR ${viewedBy.name.toUpperCase()}`}
          </Badge>
        )
      case 'praying':
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400"
          >
            <Heart className="h-3 w-3 fill-emerald-500 text-emerald-500" />
            INTERCEDENDO
          </Badge>
        )
      case 'answered':
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/30 dark:bg-purple-900/20 dark:text-purple-400"
          >
            <CheckCircle2 className="h-3 w-3" />
            ATENDIDO
          </Badge>
        )
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pedidos de Oração
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Compartilhe suas necessidades e interceda pelos irmãos.
          </p>
        </div>

        <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/25">
              <Plus className="mr-2 h-4 w-4" />
              Pedir Oração
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Novo Pedido de Oração</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Qual o seu pedido?</Label>
                <textarea
                  value={newRequestText}
                  onChange={(e) => setNewRequestText(e.target.value)}
                  className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-rose-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  placeholder="Escreva aqui o motivo da sua oração..."
                />
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <input
                  type="checkbox"
                  id="confidential"
                  checked={isConfidential}
                  onChange={(e) => setIsConfidential(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <Label htmlFor="confidential" className="cursor-pointer">
                  <span className="font-bold">Tornar confidencial</span>
                  <p className="text-xs text-slate-500">
                    Visível apenas para os pastores da igreja.
                  </p>
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRequest} className="bg-rose-600 hover:bg-rose-700">
                Enviar Pedido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Tabs
          value={viewTab}
          onValueChange={(v) => setViewTab(v as any)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-2 sm:w-[200px]">
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="archived">Arquivados</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou pedido..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`gap-2 ${dateFilter ? 'border-amber-500 text-amber-600' : ''}`}
              >
                <CalendarIcon className="h-4 w-4" />
                {dateFilter
                  ? format(dateFilter, "dd 'de' MMM", { locale: ptBR })
                  : 'Filtrar por Data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus />
              {dateFilter && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-[10px] font-bold uppercase tracking-wider"
                    onClick={() => setDateFilter(undefined)}
                  >
                    Limpar Filtro
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPrayers.map((prayer) => (
          <div
            key={prayer.id}
            onClick={() => handleOpenRequest(prayer)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-rose-500/50 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {prayer.is_confidential &&
                      !(isPastor || isSecretary || prayer.author_uid === currentUser?.uid)
                        ? 'Pedido Confidencial'
                        : prayer.author_name}
                    </h3>
                    {prayer.is_confidential && (
                      <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter">
                        Confidencial
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(prayer.created_at).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(prayer.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(prayer.status, prayer.viewed_by_pastor)}

                {(prayer.author_uid === currentUser?.uid || isPastor) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Edit2 className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleArchive(prayer.id)
                        }}
                      >
                        {prayer.is_archived ? (
                          <>
                            <ArchiveRestore className="mr-2 h-4 w-4 text-amber-500" />
                            <span>Desarquivar</span>
                          </>
                        ) : (
                          <>
                            <Archive className="mr-2 h-4 w-4 text-amber-500" />
                            <span>Arquivar</span>
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRequest(prayer.id)
                        }}
                        className="gap-2 text-rose-600 focus:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <p className="mt-4 text-slate-600 dark:text-slate-300 line-clamp-2 italic">
              "
              {prayer.is_confidential &&
              !(isPastor || isSecretary || prayer.author_uid === currentUser?.uid)
                ? 'Este pedido é confidencial e visível apenas para a liderança.'
                : prayer.request_text}
              "
            </p>

            {prayer.pastor_response && (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50/50 p-3 dark:bg-amber-900/10">
                <MessageCircle className="mt-0.5 h-4 w-4 text-amber-500" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    Resposta do Pastor:
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {prayer.pastor_response}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredPrayers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Heart className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Nenhum pedido encontrado
            </h3>
            <p className="text-slate-500">Seja o primeiro a pedir oração hoje!</p>
          </div>
        )}
      </div>

      {/* Detalhes do Pedido e Resposta Pastoral */}
      <Dialog open={isViewRequestOpen} onOpenChange={setIsViewRequestOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedPrayer && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white">
                    <Heart className="h-5 w-5" />
                  </div>
                  <DialogTitle className="text-xl font-bold">
                    Pedido de {selectedPrayer.author_name}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
                  <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">
                    O Pedido:
                  </p>
                  <p className="text-slate-700 dark:text-slate-200 italic leading-relaxed">
                    "{selectedPrayer.request_text}"
                  </p>
                  <p className="mt-4 text-[10px] text-slate-400">
                    Enviado em {new Date(selectedPrayer.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>

                {isPastor ? (
                  <div className="space-y-3">
                    <Label className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Responder como Pastor
                    </Label>
                    <textarea
                      value={pastorResponse}
                      onChange={(e) => setPastorResponse(e.target.value)}
                      className="min-h-[100px] w-full rounded-xl border border-amber-100 bg-amber-50/30 p-3 text-sm focus:border-amber-500 focus:outline-none dark:border-amber-900/30 dark:bg-amber-900/10"
                      placeholder="Deixe uma palavra de conforto ou confirmação de oração..."
                    />
                  </div>
                ) : selectedPrayer.pastor_response ? (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/20">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Resposta Pastoral ({selectedPrayer.viewed_by_pastor?.name})
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {selectedPrayer.pastor_response}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-amber-50 p-4 text-center dark:bg-amber-900/10">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      Aguardando uma palavra pastoral...
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsViewRequestOpen(false)}>
                  Fechar
                </Button>
                {isPastor && (
                  <Button
                    onClick={handlePastorResponse}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Enviar Resposta
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
