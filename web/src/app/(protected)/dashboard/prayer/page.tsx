'use client'

import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/store/useAuth'
import { prayerService } from '@/services/firebase/prayer'
import {
  Heart,
  Plus,
  Search,
  MessageCircle,
  MoreVertical,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  CalendarIcon,
  Archive,
  ArchiveRestore,
  Loader2,
  Lock,
  Send,
  HandHeart,
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
import { UserAvatar } from '@/components/ui/UserAvatar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import dayjs from '@/lib/dayjs'
import { PrayerComment, PrayerRequest } from '@/types'
import { cn, toJsDate } from '@/lib/utils'

export default function PrayerPage() {
  const { isPastor, permissions } = usePermissions()
  const { currentUser } = useAuth()
  const uid = currentUser?.uid ?? ''
  const canInteract = permissions.canRequestPrayer

  const [prayers, setPrayers] = useState<PrayerRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)
  const [selectedPrayerId, setSelectedPrayerId] = useState<string | null>(null)
  const [newRequestText, setNewRequestText] = useState('')
  const [isConfidential, setIsConfidential] = useState(false)
  const [pastorResponse, setPastorResponse] = useState('')
  const [commentText, setCommentText] = useState('')
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!uid) return
    const unsubscribe = prayerService.subscribeToPrayers({ uid, isPastor }, (data) => {
      setPrayers(data)
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [uid, isPastor])

  // Sempre a versão mais recente do listener (comentários e "estou orando" atualizam ao vivo)
  const selectedPrayer = prayers.find((p) => p.id === selectedPrayerId) ?? null

  const filteredPrayers = prayers.filter((p) => {
    const matchesTab = viewTab === 'active' ? !p.is_archived : p.is_archived
    if (!matchesTab) return false

    const term = searchTerm.toLowerCase()
    const matchesSearch =
      p.request_text.toLowerCase().includes(term) || p.author_name.toLowerCase().includes(term)

    const matchesDate =
      !dateFilter || toJsDate(p.created_at).toDateString() === dateFilter.toDateString()

    return matchesSearch && matchesDate
  })

  const isOwner = (p: PrayerRequest) => p.author_uid === uid
  const canManage = (p: PrayerRequest) => isOwner(p) || isPastor

  const handleCreateRequest = async () => {
    if (!newRequestText.trim() || !currentUser) return

    try {
      await prayerService.createRequest({
        author_uid: currentUser.uid,
        author_name: currentUser.profile.full_name || currentUser.email,
        request_text: newRequestText.trim(),
        is_confidential: isConfidential,
        status: 'pending',
        is_archived: false,
      })
      toast.success(isConfidential ? 'Pedido enviado aos pastores.' : 'Pedido compartilhado!')
      setNewRequestText('')
      setIsConfidential(false)
      setIsNewRequestOpen(false)
    } catch (error) {
      console.error('Failed to create request:', error)
      toast.error('Não foi possível enviar o pedido.')
    }
  }

  const handleOpenRequest = async (prayer: PrayerRequest) => {
    setSelectedPrayerId(prayer.id)
    setPastorResponse(prayer.pastor_response || '')
    setCommentText('')

    // Se for pastor e o pedido estiver pendente, marca como visualizado
    if (isPastor && prayer.status === 'pending') {
      try {
        await prayerService.updateRequest(prayer.id, {
          status: 'viewed',
          viewed_by_pastor: { uid, name: currentUser?.profile.full_name || 'Pastor' },
        })
      } catch (error) {
        console.error('Failed to mark as viewed:', error)
      }
    }
  }

  const handlePastorResponse = async () => {
    if (!selectedPrayer || !isPastor || !pastorResponse.trim()) return

    try {
      await prayerService.updateRequest(selectedPrayer.id, {
        pastor_response: pastorResponse.trim(),
        responded_by: { uid, name: currentUser?.profile.full_name || 'Pastor' },
        ...(selectedPrayer.status === 'answered' ? {} : { status: 'praying' as const }),
      })
      toast.success('Resposta enviada.')
      setSelectedPrayerId(null)
    } catch (error) {
      console.error('Failed to respond:', error)
      toast.error('Não foi possível enviar a resposta.')
    }
  }

  const handleMarkAnswered = async (prayer: PrayerRequest) => {
    try {
      await prayerService.updateRequest(prayer.id, { status: 'answered' })
      toast.success('Glória a Deus! Pedido marcado como atendido. 🙌')
    } catch (error) {
      console.error('Failed to mark answered:', error)
      toast.error('Não foi possível atualizar o pedido.')
    }
  }

  const handleTogglePraying = async (prayer: PrayerRequest) => {
    if (!uid) return
    const isPraying = prayer.praying_uids?.includes(uid) ?? false
    try {
      await prayerService.togglePraying(prayer.id, uid, isPraying)
    } catch (error) {
      console.error('Failed to toggle praying:', error)
      toast.error('Não foi possível registrar sua oração.')
    }
  }

  const handleAddComment = async () => {
    if (!selectedPrayer || !currentUser || !commentText.trim()) return
    setIsSendingComment(true)
    try {
      await prayerService.addComment(selectedPrayer.id, {
        author_uid: currentUser.uid,
        author_name: currentUser.profile.full_name || currentUser.email,
        author_avatar_url: currentUser.profile.avatar_url || '',
        text: commentText.trim(),
      })
      setCommentText('')
    } catch (error) {
      console.error('Failed to comment:', error)
      toast.error('Não foi possível enviar o comentário.')
    } finally {
      setIsSendingComment(false)
    }
  }

  const handleRemoveComment = async (comment: PrayerComment) => {
    if (!selectedPrayer || !confirm('Remover este comentário?')) return
    try {
      await prayerService.removeComment(selectedPrayer.id, comment)
    } catch (error) {
      console.error('Failed to remove comment:', error)
      toast.error('Não foi possível remover o comentário.')
    }
  }

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('Excluir este pedido de oração? Essa ação não pode ser desfeita.')) return
    try {
      await prayerService.deleteRequest(id)
      toast.success('Pedido excluído.')
    } catch (error) {
      console.error('Failed to delete request:', error)
      toast.error('Não foi possível excluir o pedido.')
    }
  }

  const handleToggleArchive = async (id: string, currentStatus: boolean) => {
    try {
      await prayerService.updateRequest(id, { is_archived: !currentStatus })
    } catch (error) {
      console.error('Failed to toggle archive:', error)
      toast.error('Não foi possível arquivar o pedido.')
    }
  }

  const getStatusBadge = (status: PrayerRequest['status']) => {
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
            VISTO PELO PASTOR
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

  const renderPrayingButton = (prayer: PrayerRequest, size: 'sm' | 'lg' = 'sm') => {
    const count = prayer.praying_uids?.length ?? 0
    const isPraying = prayer.praying_uids?.includes(uid) ?? false
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handleTogglePraying(prayer)
        }}
        disabled={!canInteract}
        className={cn(
          'flex items-center gap-1.5 rounded-full border font-semibold transition-colors disabled:cursor-default',
          size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm',
          isPraying
            ? 'border-rose-500 bg-rose-500 text-white'
            : 'border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300',
        )}
        aria-pressed={isPraying}
      >
        <HandHeart className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        {isPraying ? 'Orando' : 'Estou orando'}
        {count > 0 && <span className="opacity-80">· {count}</span>}
      </button>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pedidos de Oração
          </h1>
          <p className="max-w-2/3 text-sm md:text-base text-slate-500 dark:text-slate-400">
            Compartilhe suas necessidades e interceda pelos irmãos.
          </p>
        </div>

        {canInteract && (
          <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/25">
                <Plus className="mr-2 h-4 w-4" />
                Pedir Oração
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-base md:text-xl font-bold">
                  Novo Pedido de Oração
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Qual o seu pedido?</Label>
                  <textarea
                    value={newRequestText}
                    onChange={(e) => setNewRequestText(e.target.value)}
                    className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-base md:text-sm focus:border-rose-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    placeholder="Escreva aqui o motivo da sua oração..."
                  />
                </div>
                <label
                  htmlFor="confidential"
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <input
                    type="checkbox"
                    id="confidential"
                    checked={isConfidential}
                    onChange={(e) => setIsConfidential(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-bold">
                      <Lock className="h-3.5 w-3.5" /> Tornar confidencial
                    </span>
                    <span className="block text-xs text-slate-500">
                      Só você e os pastores verão este pedido. Ele não aparece para os outros
                      membros e não recebe comentários.
                    </span>
                  </span>
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateRequest}
                  disabled={!newRequestText.trim()}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  Enviar Pedido
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Tabs
          value={viewTab}
          onValueChange={(v) => setViewTab(v as 'active' | 'archived')}
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`gap-2 ${dateFilter ? 'border-amber-500 text-amber-600' : ''}`}
            >
              <CalendarIcon className="h-4 w-4" />
              {dateFilter ? format(dateFilter, "dd 'de' MMM", { locale: ptBR }) : 'Filtrar por Data'}
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

      <div className="grid gap-4">
        {filteredPrayers.map((prayer) => (
          <div
            key={prayer.id}
            onClick={() => handleOpenRequest(prayer)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-rose-500/50 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  {prayer.is_confidential ? <Lock className="h-5 w-5" /> : <Heart className="h-6 w-6" />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{prayer.author_name}</h3>
                    {prayer.is_confidential && (
                      <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter">
                        Confidencial
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {dayjs(toJsDate(prayer.created_at)).format('DD/MM/YYYY [às] HH:mm')}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden sm:block">{getStatusBadge(prayer.status)}</span>

                {canManage(prayer) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      {prayer.status !== 'answered' && (
                        <DropdownMenuItem onClick={() => handleMarkAnswered(prayer)}>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-purple-500" />
                          Marcar como atendido
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleToggleArchive(prayer.id, prayer.is_archived)}
                      >
                        {prayer.is_archived ? (
                          <>
                            <ArchiveRestore className="mr-2 h-4 w-4 text-amber-500" />
                            Desarquivar
                          </>
                        ) : (
                          <>
                            <Archive className="mr-2 h-4 w-4 text-amber-500" />
                            Arquivar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteRequest(prayer.id)}
                        className="text-rose-600 focus:text-rose-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <p className="mt-4 text-slate-600 dark:text-slate-300 line-clamp-3 italic">
              {prayer.request_text}
            </p>

            {prayer.pastor_response && (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50/50 p-3 dark:bg-amber-900/10">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    Resposta do Pastor{prayer.responded_by ? ` (${prayer.responded_by.name})` : ''}:
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {prayer.pastor_response}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="sm:hidden">{getStatusBadge(prayer.status)}</span>
              {!prayer.is_confidential && (
                <>
                  {renderPrayingButton(prayer)}
                  <span className="flex items-center gap-1.5 px-2 text-xs font-medium text-slate-500">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {prayer.comments?.length ?? 0}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredPrayers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Heart className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="mt-4 text-sm md:text-lg font-bold text-slate-900 dark:text-white">
              Nenhum pedido encontrado
            </h3>
            <p className="text-slate-500">Seja o primeiro a pedir oração hoje!</p>
          </div>
        )}
      </div>

      {/* Detalhes do Pedido, intercessão e Resposta Pastoral */}
      <Dialog open={!!selectedPrayer} onOpenChange={(open) => !open && setSelectedPrayerId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          {selectedPrayer && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
                    {selectedPrayer.is_confidential ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <Heart className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <DialogTitle className="text-base md:text-xl font-bold">
                      Pedido de {selectedPrayer.author_name}
                    </DialogTitle>
                    <div className="mt-1">{getStatusBadge(selectedPrayer.status)}</div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-2">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
                  <p className="text-slate-700 dark:text-slate-200 italic leading-relaxed whitespace-pre-line">
                    {selectedPrayer.request_text}
                  </p>
                  <p className="mt-4 text-[10px] text-slate-400">
                    Enviado em{' '}
                    {dayjs(toJsDate(selectedPrayer.created_at)).format('DD/MM/YYYY [às] HH:mm')}
                  </p>
                </div>

                {selectedPrayer.is_confidential && (
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Lock className="h-3.5 w-3.5" />
                    Pedido confidencial: visível só para o autor e os pastores.
                  </p>
                )}

                {isPastor ? (
                  <div className="space-y-3">
                    <Label className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Responder como Pastor
                    </Label>
                    <textarea
                      value={pastorResponse}
                      onChange={(e) => setPastorResponse(e.target.value)}
                      className="min-h-[100px] w-full rounded-xl border border-amber-100 bg-amber-50/30 p-3 text-base md:text-sm focus:border-amber-500 focus:outline-none dark:border-amber-900/30 dark:bg-amber-900/10"
                      placeholder="Deixe uma palavra de conforto ou confirmação de oração..."
                    />
                  </div>
                ) : selectedPrayer.pastor_response ? (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/20">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Resposta Pastoral
                      {selectedPrayer.responded_by ? ` (${selectedPrayer.responded_by.name})` : ''}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">
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

                {!selectedPrayer.is_confidential && (
                  <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Intercessão
                      </h4>
                      {renderPrayingButton(selectedPrayer, 'lg')}
                    </div>

                    <ul className="space-y-3">
                      {(selectedPrayer.comments ?? []).map((comment) => (
                        <li key={comment.id} className="flex items-start gap-3">
                          <UserAvatar
                            src={comment.author_avatar_url}
                            name={comment.author_name}
                            size={32}
                          />
                          <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                {comment.author_name}
                              </p>
                              <span className="shrink-0 text-[10px] text-slate-400">
                                {dayjs(toJsDate(comment.created_at)).fromNow()}
                              </span>
                            </div>
                            <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">
                              {comment.text}
                            </p>
                          </div>
                          {(comment.author_uid === uid || isPastor) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveComment(comment)}
                              className="mt-1 rounded-full p-1 text-slate-300 hover:text-rose-500"
                              aria-label="Remover comentário"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </li>
                      ))}
                      {(selectedPrayer.comments ?? []).length === 0 && (
                        <li className="text-center text-xs text-slate-400">
                          Nenhuma mensagem ainda. Deixe uma palavra de apoio.
                        </li>
                      )}
                    </ul>

                    {canInteract && (
                      <div className="flex items-end gap-2">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          rows={2}
                          maxLength={500}
                          placeholder="Escreva uma palavra de apoio..."
                          className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-white p-3 text-base md:text-sm focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                        />
                        <Button
                          size="icon"
                          onClick={handleAddComment}
                          disabled={!commentText.trim() || isSendingComment}
                          className="h-11 w-11 shrink-0 rounded-xl bg-rose-600 hover:bg-rose-700"
                          aria-label="Enviar comentário"
                        >
                          {isSendingComment ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {canManage(selectedPrayer) && selectedPrayer.status !== 'answered' && (
                  <Button
                    variant="outline"
                    onClick={() => handleMarkAnswered(selectedPrayer)}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marcar como atendido
                  </Button>
                )}
                {isPastor && (
                  <Button
                    onClick={handlePastorResponse}
                    disabled={!pastorResponse.trim()}
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
