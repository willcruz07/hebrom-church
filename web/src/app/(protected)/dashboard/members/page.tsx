'use client'

import { PermissionGuard } from '@/components/PermissionGuard'
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Shield,
  AlertCircle,
  CheckCircle2,
  Filter,
  Eye,
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { getUsers, approveUser } from '@/services/firebase/users'
import { AppUser, UserRole } from '@/types'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateMemberModal } from './components/CreateMemberModal'
import { EditMemberModal } from './components/EditMemberModal'
import { formatDate } from '@/lib/utils'

const roleLabels: Record<UserRole, string> = {
  pastor: 'Pastor',
  secretary: 'Secretária',
  member: 'Membro',
  pending_member: 'Pendente',
  visitor: 'Visitante',
}

const roleColors: Record<UserRole, string> = {
  pastor: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
  secretary: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  member: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
  pending_member: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
  visitor: 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 dark:text-slate-400',
}

export default function MembersPage() {
  const [members, setMembers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<AppUser | null>(null)

  const fetchMembers = async () => {
    try {
      const data = await getUsers()
      setMembers(data)
    } catch (error) {
      toast.error('Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase())

      const matchesRole = roleFilter === 'all' || member.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [members, search, roleFilter])

  const pendingMembers = useMemo(
    () => members.filter((m) => m.role === 'pending_member'),
    [members],
  )

  const handleApprove = async (uid: string) => {
    try {
      await approveUser(uid)
      toast.success('Usuário aprovado com sucesso!')
      fetchMembers()
    } catch (error) {
      toast.error('Erro ao aprovar usuário')
    }
  }

  return (
    <PermissionGuard permission="canManageUsers">
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Membros
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Gerenciamento da comunidade Hebrom.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            Adicionar Novo
          </button>
        </header>

        {pendingMembers.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-4 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-400">
                  Solicitações Pendentes
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-500/80">
                  Existem {pendingMembers.length} usuários aguardando aprovação para acessar o
                  sistema.
                </p>
              </div>
            </div>
            <button
              onClick={() => setRoleFilter('pending_member')}
              className="hidden md:block rounded-lg bg-white px-4 py-2 text-sm font-medium text-amber-700 shadow-sm border border-amber-200 hover:bg-amber-50 transition-colors"
            >
              Ver Solicitações
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            {(['all', 'pastor', 'secretary', 'member', 'pending_member'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  roleFilter === role
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {role === 'all' ? 'Todos' : roleLabels[role as UserRole]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Membro
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Cargo
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-10 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Nenhum membro encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr
                      key={member.uid}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-slate-800 dark:text-slate-400 font-bold overflow-hidden">
                            {member.profile.avatar_url ? (
                              <img
                                src={member.profile.avatar_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              member.profile.full_name[0]
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {member.profile.full_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${roleColors[member.role]}`}
                        >
                          <Shield className="h-3 w-3" />
                          {roleLabels[member.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(member.created_at)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white outline-none">
                            <MoreHorizontal className="h-5 w-5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl border-slate-200 dark:border-slate-800"
                          >
                            <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider px-3 py-2">
                              Opções
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => setEditingMember(member)}
                              className="gap-2 px-3 py-2.5 cursor-pointer rounded-lg"
                            >
                              <Users className="h-4 w-4" /> Editar Membro
                            </DropdownMenuItem>

                            {member.role === 'pending_member' && (
                              <>
                                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                                <DropdownMenuItem
                                  onClick={() => handleApprove(member.uid)}
                                  className="gap-2 px-3 py-2.5 cursor-pointer text-emerald-600 dark:text-emerald-400 hover:!bg-emerald-50 dark:hover:!bg-emerald-900/20 rounded-lg"
                                >
                                  <CheckCircle2 className="h-4 w-4" /> Aprovar Membro
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateMemberModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchMembers}
      />

      {editingMember && (
        <EditMemberModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          member={editingMember}
          onSuccess={fetchMembers}
        />
      )}
    </PermissionGuard>
  )
}
