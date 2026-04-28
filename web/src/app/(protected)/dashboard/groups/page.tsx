'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Users, Trash2, Loader2, AlertCircle, Search, Edit } from 'lucide-react'
import { getGroups, deleteGroup } from '@/services/firebase/groups'
import { ChurchGroup } from '@/types'
import { toast } from 'sonner'
import { PermissionGuard } from '@/components/PermissionGuard'
import { CreateGroupModal } from './components/CreateGroupModal'
import { EditGroupModal } from './components/EditGroupModal'
import { formatDate } from '@/lib/utils'

export default function GroupsPage() {
  const [groups, setGroups] = useState<ChurchGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<ChurchGroup | null>(null)
  const [search, setSearch] = useState('')

  const fetchGroups = async (isRefresh = false) => {
    if (isRefresh) setIsLoading(true)
    try {
      const data = await getGroups()
      setGroups(data)
    } catch (error) {
      toast.error('Erro ao carregar grupos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGroups()
  }, [])

  const filteredGroups = useMemo(() => {
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(search.toLowerCase()) ||
        group.description?.toLowerCase().includes(search.toLowerCase()),
    )
  }, [groups, search])

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo?')) return

    try {
      await deleteGroup(id)
      toast.success('Grupo excluído com sucesso!')
      fetchGroups(true)
    } catch (error) {
      toast.error('Erro ao excluir grupo')
    }
  }

  return (
    <PermissionGuard permission="canManageUsers">
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Grupos & Ministérios
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Gerencie os departamentos e grupos oficiais da igreja.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Adicionar Novo Grupo
          </button>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Nome do Grupo
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Descrição
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Cadastro
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-10 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-60 bg-slate-100 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                        <p>Nenhum grupo encontrado.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((group) => (
                    <tr
                      key={group.id}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold">
                            {group.name[0]}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {group.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                          {group.description || 'Sem descrição'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(group.created_at)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedGroup(group)
                              setIsEditModalOpen(true)
                            }}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(group.id)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchGroups(true)}
      />

      {selectedGroup && (
        <EditGroupModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedGroup(null)
          }}
          onSuccess={() => fetchGroups(true)}
          group={selectedGroup}
        />
      )}
    </PermissionGuard>
  )
}
