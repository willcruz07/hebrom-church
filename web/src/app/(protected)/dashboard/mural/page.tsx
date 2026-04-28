'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/store/useAuth'
import { MessageSquare, Bell, Filter, Plus, Heart, Loader2 } from 'lucide-react'
import { CreatePostModal } from './components/CreatePostModal'
import { getPosts } from '@/services/firebase/mural'
import { FeedPost } from '@/types'
import { Timestamp } from 'firebase/firestore'
import dayjs from '@/lib/dayjs'
import { toast } from 'sonner'

export default function MuralPage() {
  const { permissions } = usePermissions()
  const { currentUser } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'general' | 'groups'>('all')

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsLoading(true)
    try {
      const data = await getPosts()
      setPosts(data)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar posts'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const filteredPosts = posts.filter((post) => {
    const isGeral = post.target_groups.length === 0
    const isFromMyGroup =
      currentUser &&
      post.target_groups.some((group) => (currentUser.sub_groups || []).includes(group))

    if (filter === 'general') return isGeral
    if (filter === 'groups') return isFromMyGroup

    // Default 'all' logic
    if (permissions.canViewGroupFeed) {
      return isGeral || isFromMyGroup || post.author.uid === currentUser?.uid
    }
    return isGeral
  })

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Feed da Igreja
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Fique por dentro de tudo que acontece na Hebrom.
          </p>
        </div>
        {permissions.canPostTargetedFeed && (
          <>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Novo Aviso
            </button>

            <CreatePostModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSuccess={() => fetchPosts(true)}
            />
          </>
        )}
      </header>

      <div className="flex items-center gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Filter className="h-4 w-4" />
          Todos
        </button>
        <button
          onClick={() => setFilter('general')}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === 'general'
              ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          Geral
        </button>
        {permissions.canViewGroupFeed && (
          <button
            onClick={() => setFilter('groups')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'groups'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            Meus Grupos
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm font-medium">Carregando avisos...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <article
              key={post.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {post.author.avatar_url ? (
                    <img
                      src={post.author.avatar_url}
                      alt={post.author.name}
                      className="h-12 w-12 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold text-lg">
                      {post.author.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {post.author.name}
                      </h3>
                      {post.target_groups.length > 0 && (
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                          {post.target_groups[0]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {dayjs(
                        typeof post.created_at === 'number'
                          ? post.created_at
                          : post.created_at.toMillis(),
                      ).fromNow()}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                    post.target_groups.length === 0
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  {post.target_groups.length === 0 ? 'Geral' : 'Grupo'}
                </span>
              </div>

              {post.media_url && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                  <img
                    src={post.media_url}
                    alt={post.title}
                    className="w-full object-cover max-h-72"
                  />
                </div>
              )}

              <div className="mt-4 space-y-2">
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {post.title}
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-6 border-t border-slate-50 pt-4 dark:border-slate-800/50">
                <button className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-rose-500">
                  <Heart className="h-4 w-4" />
                  <span>0</span>
                </button>
                <button className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-500">
                  <MessageSquare className="h-4 w-4" />
                  <span>0</span>
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
      </div>
    </div>
  )
}
