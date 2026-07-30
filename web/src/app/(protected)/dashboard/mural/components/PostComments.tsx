'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageSquare } from 'lucide-react'
import { FeedPost } from '@/types'
import { useAuth } from '@/store/useAuth'
import { addComment, subscribeToPost } from '@/services/firebase/mural'
import { toast } from 'sonner'
import dayjs from '@/lib/dayjs'
import { toJsDate } from '@/lib/utils'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface PostCommentsProps {
  post: FeedPost
  isOpen: boolean
  onClose: () => void
}

export function PostComments({ post: initialPost, isOpen, onClose }: PostCommentsProps) {
  const { currentUser } = useAuth()
  const [post, setPost] = useState<FeedPost>(initialPost)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Snapshot em tempo real para os comentários do post
  useEffect(() => {
    if (isOpen && initialPost.id) {
      const unsubscribe = subscribeToPost(initialPost.id, (updatedPost) => {
        setPost(updatedPost)
      })
      return () => unsubscribe()
    }
  }, [isOpen, initialPost.id])

  const sortedComments = [...(post.comments || [])].sort(
    (a, b) => toJsDate(b.created_at).getTime() - toJsDate(a.created_at).getTime(),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !newComment.trim()) return

    setIsSubmitting(true)
    try {
      await addComment(post.id, {
        author: {
          uid: currentUser.uid,
          name: currentUser.profile.full_name || currentUser.email,
          avatar_url: currentUser.profile.avatar_url || '',
        },
        content: newComment.trim(),
      })
      setNewComment('')
      // Scroll para o topo (onde o novo comentário aparece)
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      toast.error('Erro ao enviar comentário')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content (Bottom Sheet no mobile) */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative flex h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-t-[32px] bg-white shadow-2xl dark:bg-slate-900 sm:h-[70vh] sm:rounded-[32px] border border-slate-200 dark:border-slate-800"
          >
            {/* Handle bar for visual sheet indicator */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Comentários
                </h2>
                <span className="sr-only">
                  Lista de interações e comentários deste aviso.
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Input at the Top (Instagram style) */}
            <div className="border-b border-slate-50 p-4 bg-slate-50/50 dark:bg-slate-800/30 dark:border-slate-800/50">
              <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
                <UserAvatar
                  src={currentUser?.profile.avatar_url}
                  name={currentUser?.profile.full_name || currentUser?.email}
                  size={40}
                  className="border border-slate-200 dark:border-slate-700"
                  textClassName="text-xs"
                />
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="w-full rounded-2xl border-none bg-white py-2.5 pl-4 pr-12 text-sm shadow-sm focus:ring-2 focus:ring-amber-500/20 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-amber-600 transition-all hover:bg-amber-50 disabled:opacity-30 dark:hover:bg-amber-900/20"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Comments List */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-hide"
            >
              {sortedComments.length > 0 ? (
                sortedComments.map((comment) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={comment.id}
                    className="flex gap-3"
                  >
                    <UserAvatar
                      src={comment.author.avatar_url}
                      name={comment.author.name}
                      size={36}
                      className="border border-slate-100 dark:border-slate-800 shadow-sm"
                      textClassName="text-sm"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {comment.author.name}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          • {dayjs(toJsDate(comment.created_at)).fromNow()}
                        </span>
                      </div>
                      <div className="relative rounded-2xl rounded-tl-none bg-slate-50 p-3 text-sm text-slate-600 shadow-sm dark:bg-slate-800/50 dark:text-slate-300">
                        {comment.content}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <div className="mb-3 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                    <MessageSquare className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="text-sm font-medium">Nenhum comentário ainda.</p>
                  <p className="text-xs">Seja o primeiro a interagir!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
