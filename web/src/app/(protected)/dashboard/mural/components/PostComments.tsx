'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FeedPost } from '@/types'
import { useAuth } from '@/store/useAuth'
import { addComment } from '@/services/firebase/mural'
import { toast } from 'sonner'
import dayjs from '@/lib/dayjs'
import { Send } from 'lucide-react'

interface PostCommentsProps {
  post: FeedPost
  isOpen: boolean
  onClose: () => void
}

export function PostComments({ post, isOpen, onClose }: PostCommentsProps) {
  const { currentUser } = useAuth()
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sortedComments = [...(post.comments || [])].sort((a, b) => b.created_at - a.created_at)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !newComment.trim()) return

    setIsSubmitting(true)
    try {
      await addComment(post.id, {
        author: {
          uid: currentUser.uid,
          name: currentUser.profile.full_name,
          avatar_url: currentUser.profile.avatar_url || '',
        },
        content: newComment.trim(),
      })
      setNewComment('')
      toast.success('Comentário enviado!')
    } catch (error) {
      toast.error('Erro ao enviar comentário')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[85vh] p-0 rounded-3xl overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold">Comentários</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {sortedComments.length > 0 ? (
            sortedComments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-100 dark:border-slate-800">
                  {comment.author.avatar_url ? (
                    <img
                      src={comment.author.avatar_url}
                      alt={comment.author.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-amber-500/10 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 font-bold text-xs">
                      {comment.author.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {comment.author.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {dayjs(comment.created_at).fromNow()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl rounded-tl-none">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <p className="text-sm">Nenhum comentário ainda. Seja o primeiro!</p>
            </div>
          )}
        </div>

        <div className="p-6 pt-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              className="min-h-[44px] max-h-[120px] rounded-2xl bg-slate-50 border-none focus-visible:ring-amber-500 pr-12 dark:bg-slate-800 resize-none py-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isSubmitting || !newComment.trim()}
              className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
