'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Search, Edit } from 'lucide-react'

import { getGroups, deleteGroup } from '@/services/firebase/groups'
import { ChurchGroup } from '@/types'
import { toast } from 'sonner'
import { PermissionGuard } from '@/components/PermissionGuard'
import { CreateGroupModal } from './components/CreateGroupModal'
import { EditGroupModal } from './components/EditGroupModal'
import { formatDate } from '@/lib/utils'
import { DataTable, Column } from '@/components/DataTable'

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

  const columns: Column<ChurchGroup>[] = [
    {
      header: 'Nome do Grupo',
      meta: { isTitle: true, isAvatar: true },
      cell: (group) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 font-bold">
            {group.name[0]}
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">{group.name}</span>
        </div>
      ),
    },
    {
      header: 'Descrição',
      meta: { isSubtitle: true },
      cell: (group) => (
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 max-w-md">
          {group.description || 'Sem descrição'}
        </p>
      ),
    },
    {
      header: 'Cadastro',
      cell: (group) => formatDate(group.created_at),
    },
  ]

  const getActions = (group: ChurchGroup) => [
    {
      label: 'Editar Grupo',
      icon: <Edit className="h-4 w-4" />,
      onClick: (g: ChurchGroup) => {
        setSelectedGroup(g)
        setIsEditModalOpen(true)
      },
    },
    {
      label: 'Excluir Grupo',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (g: ChurchGroup) => handleDelete(g.id),
      variant: 'destructive' as const,
    },
  ]

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
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-700 active:scale-95"
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
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-amber-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredGroups}
          isLoading={isLoading}
          emptyMessage="Nenhum grupo encontrado."
          actions={getActions}
          onRowClick={(group) => {
            setSelectedGroup(group)
            setIsEditModalOpen(true)
          }}
        />
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
