'use client'

import { useMessages } from '@/hooks/useMessages'
import { useState, useEffect, useMemo, useRef } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/store/useAuth'
import { MessageSquare, Bell, ScrollText, Heart, MoreHorizontal, Trash2 } from 'lucide-react'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreatePostModal } from './components/CreatePostModal'
import { PostComments } from './components/PostComments'
import { DailyWordHighlight } from './components/DailyWordHighlight'
import { deletePost, toggleLike } from '@/services/firebase/mural'
import { useMuralStore } from '@/store/useMuralStore'
import { mergeFeed } from '@/lib/mural/feed'
import { FeedPost } from '@/types'
import dayjs from '@/lib/dayjs'
import { toJsDate, cn } from '@/lib/utils'
import { isPostActive, sortMuralPosts } from '@/lib/mural-visibility'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { ChipMultiSelect } from '@/components/ui/chip-multi-select'
import { PageTitle } from '@/components/ui/page-title'

const GENERAL_FILTER_ID = '__general__'

export default function MuralPage() {
  const { confirm: confirmAction } = useMessages()
  const { permissions } = usePermissions()
  const { currentUser } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const [selectedPostForComments, setSelectedPostForComments] = useState<FeedPost | null>(null)

  const live = useMuralStore((s) => s.live)
  const older = useMuralStore((s) => s.older)
  const status = useMuralStore((s) => s.status)
  const hasMore = useMuralStore((s) => s.hasMore)
  const loadingMore = useMuralStore((s) => s.loadingMore)
  const loadMoreFailed = useMuralStore((s) => s.loadMoreFailed)
  const allGroups = useMuralStore((s) => s.groups)
  const { start, loadMore, updatePost, removePost } = useMuralStore.getState()

  useEffect(() => {
    start()
  }, [start])

  const posts = useMemo(() => mergeFeed(live, older), [live, older])
  const isLoading = status === 'idle' || status === 'loading'

  const subGroups = currentUser?.sub_groups
  const myGroups = useMemo(
    () => (subGroups?.length ? allGroups.filter((g) => subGroups.includes(g.id)) : []),
    [allGroups, subGroups],
  )

  // Rolagem infinita: o marcador no fim da lista pede a próxima página ao se aproximar da
  // tela. O observer é recriado a cada página carregada — se o marcador continuar visível
  // (ex: o filtro escondeu quase tudo), a observação inicial já pede mais uma.
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || loadMoreFailed) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMoreFailed, older.length, status, loadMore])

  const filteredPosts = sortMuralPosts(posts.filter((post) => isPostActive(post))).filter(
    (post) => {
      const isGeral = post.target_groups.length === 0
      const isFromMyGroup = myGroups.some((g) => post.target_groups.includes(g.name))

      if (activeFilters.length === 0) {
        // Default: geral + grupos que participa
        return isGeral || isFromMyGroup || post.author.uid === currentUser?.uid
      }

      const wantsGeneral = activeFilters.includes(GENERAL_FILTER_ID)
      const wantsGroupNames = activeFilters
        .filter((f) => f !== GENERAL_FILTER_ID)
        .map((id) => myGroups.find((g) => g.id === id)?.name)
        .filter((name): name is string => Boolean(name))

      return (
        (wantsGeneral && isGeral) ||
        post.target_groups.some((groupName) => wantsGroupNames.includes(groupName))
      )
    },
  )

  const handleDeletePost = async (postId: string) => {
    if (
      !(await confirmAction({
        title: 'Excluir aviso',
        description: 'Deseja excluir este aviso do mural?',
        confirmText: 'Excluir',
        destructive: true,
      }))
    )
      return

    try {
      await deletePost(postId)
      removePost(postId)
      toast.success('Aviso excluído com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir aviso')
    }
  }

  const handleToggleLike = async (postId: string, likes: string[] = []) => {
    if (!currentUser) return
    const uid = currentUser.uid
    const isLiked = likes.includes(uid)
    const setLiked = (liked: boolean) =>
      updatePost(postId, (p) => ({
        ...p,
        likes: liked
          ? [...(p.likes ?? []).filter((l) => l !== uid), uid]
          : (p.likes ?? []).filter((l) => l !== uid),
      }))

    // Otimista: as páginas antigas não têm listener, então a tela não esperaria o servidor
    setLiked(!isLiked)
    try {
      await toggleLike(postId, uid, isLiked)
    } catch (error) {
      setLiked(isLiked)
      toast.error('Erro ao processar curtida')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex items-center justify-between">
        <PageTitle
          title="Feed da Igreja"
          description="Fique por dentro de tudo que acontece na Hebrom."
          descriptionClassName="max-w-2/3"
        />
        {permissions.canPostTargetedFeed && (
          <>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-36 flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-700 active:scale-95"
            >
              <ScrollText className="h-6 w-6" />
              Novo Aviso
            </button>

            <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
          </>
        )}
      </header>

      <DailyWordHighlight />

      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
        <ChipMultiSelect
          title="Filtrar Feed"
          triggerLabel="Filtrar"
          options={[
            { id: GENERAL_FILTER_ID, label: 'Geral' },
            ...myGroups.map((g) => ({ id: g.id, label: g.name })),
          ]}
          selected={activeFilters}
          onChange={setActiveFilters}
        />
        <p className="text-xs font-medium text-slate-500">
          {activeFilters.length === 0
            ? 'Mostrando: Geral + grupos que você participa'
            : `Filtro ativo: ${activeFilters
                .map((id) =>
                  id === GENERAL_FILTER_ID ? 'Geral' : myGroups.find((g) => g.id === id)?.name,
                )
                .filter(Boolean)
                .join(', ')}`}
        </p>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <HebromSpinner size="lg" className="mb-4" />
            <p className="text-sm font-medium">Carregando avisos...</p>
          </div>
        ) : status === 'error' && posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
            <Bell className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <p className="mt-4 text-slate-500">Não foi possível carregar o mural.</p>
            <button
              onClick={start}
              className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Tentar novamente
            </button>
          </div>
        ) : filteredPosts.length > 0 || hasMore ? (
          filteredPosts.map((post) => (
            <article
              key={post.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    src={post.author.uid === 'system' ? '/logo.png' : post.author.avatar_url}
                    name={post.author.name}
                    size={48}
                    className={cn('rounded-2xl', post.author.uid === 'system' && 'bg-black')}
                    imageClassName={post.author.uid === 'system' ? 'scale-[1.4]' : undefined}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {post.author.name}
                      </h3>
                      {post.target_groups.length > 0 && (
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">
                          {post.target_groups[0]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {dayjs(toJsDate(post.created_at)).fromNow()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                      post.target_groups.length === 0
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}
                  >
                    {post.target_groups.length === 0 ? 'Geral' : 'Grupo'}
                  </span>

                  {(permissions.canPostTargetedFeed || post.author.uid === currentUser?.uid) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white outline-none transition-all">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-xl border-slate-200 dark:border-slate-800"
                      >
                        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider px-3 py-2">
                          Opções do Post
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleDeletePost(post.id)}
                          className="gap-2 px-3 py-2.5 cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-900/20 dark:focus:text-red-400 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" /> Excluir Aviso
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {post.media_url && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                  <img
                    src={post.media_url}
                    alt={post.title}
                    className="aspect-video w-full object-cover"
                  />
                </div>
              )}

              <div className="mt-4 space-y-2">
                <h4 className="text-sm md:text-lg font-bold text-slate-800 dark:text-slate-100">
                  {post.title}
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-6 border-t border-slate-50 pt-4 dark:border-slate-800/50">
                <button
                  onClick={() => handleToggleLike(post.id, post.likes)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    currentUser && post.likes?.includes(currentUser.uid)
                      ? 'text-rose-500'
                      : 'text-slate-500 hover:text-rose-500'
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      currentUser && post.likes?.includes(currentUser.uid) ? 'fill-current' : ''
                    }`}
                  />
                  <span>{post.likes?.length || 0}</span>
                </button>
                <button
                  onClick={() => setSelectedPostForComments(post)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-amber-500"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.comments?.length || 0}</span>
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
            <Bell className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <p className="mt-4 text-slate-500">Nenhum aviso encontrado para seu perfil.</p>
          </div>
        )}

        {!isLoading && (hasMore || filteredPosts.length > 0) && (
          <div ref={sentinelRef} className="flex justify-center py-4">
            {loadMoreFailed ? (
              <button
                onClick={loadMore}
                className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
              >
                Erro ao carregar. Tentar novamente
              </button>
            ) : hasMore ? (
              <HebromSpinner size="sm" className={cn(!loadingMore && 'opacity-0')} />
            ) : (
              <p className="text-xs font-medium text-slate-400">Você chegou ao fim do mural</p>
            )}
          </div>
        )}
      </div>

      {selectedPostForComments && (
        <PostComments
          post={selectedPostForComments}
          isOpen={!!selectedPostForComments}
          onClose={() => setSelectedPostForComments(null)}
        />
      )}
    </div>
  )
}
