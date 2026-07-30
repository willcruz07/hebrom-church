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
  Trash2,
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getUsers, approveUser, deleteUser } from '@/services/firebase/users'
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
import { cn, formatDate } from '@/lib/utils'
import { DataTable, Column } from '@/components/DataTable'
import { UserAvatar } from '@/components/ui/UserAvatar'

const roleLabels: Record<UserRole, string> = {
  pastor: 'Pastor',
  secretary: 'Secretária',
  member: 'Membro',
  pending_member: 'Pendente',
  visitor: 'Visitante',
}

const roleColors: Record<UserRole, string> = {
  pastor: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
  secretary: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
  member: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
  pending_member: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
  visitor: 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 dark:text-slate-400',
}

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const fetchMembers = async () => {
    try {
      const data = await getUsers()
      console.log(data, 'DATA MEMBRE')
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

  const handleDeleteMember = async (uid: string) => {
    if (!confirm('Tem certeza que deseja excluir este membro? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      await deleteUser(uid)
      toast.success('Membro excluído com sucesso!')
      fetchMembers()
    } catch (error) {
      toast.error('Erro ao excluir membro')
    }
  }

  const columns: Column<AppUser>[] = [
    {
      header: 'Membro',
      meta: { isTitle: true, isAvatar: true },
      cell: (member) => (
        <div className="flex items-center gap-3">
          <UserAvatar
            src={member.profile.avatar_url}
            name={member.profile.full_name}
            size={40}
            className="rounded-xl border border-slate-200 dark:border-slate-700"
            textClassName="text-sm"
          />
          <div className="flex flex-col min-w-0">
            <span className="truncate font-bold text-slate-900 dark:text-white">
              {member.profile.full_name}
            </span>
            <span className="truncate text-[10px] text-slate-500 dark:text-slate-400">
              {member.role === 'visitor' ? 'Visitante' : member.profile.church_position || 'Membro'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'E-mail',
      cell: (member) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">{member.email}</span>
      ),
      meta: { hideOnMobile: true },
    },
    {
      header: 'Cargo',
      meta: { isSubtitle: true },
      cell: (member) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${roleColors[member.role]}`}
        >
          <Shield className="h-3 w-3" />
          {roleLabels[member.role]}
        </span>
      ),
    },
    {
      header: 'Cadastro',
      cell: (member) => formatDate(member.created_at),
    },
  ]

  const getActions = (member: AppUser) => {
    const actions = [
      {
        label: 'Ver Perfil',
        icon: <Eye className="h-4 w-4" />,
        onClick: (m: AppUser) => router.push(`/dashboard/members/${m.uid}`),
      },
      {
        label: 'Excluir Membro',
        icon: <Trash2 className="h-4 w-4" />,
        onClick: (m: AppUser) => handleDeleteMember(m.uid),
        variant: 'destructive' as const,
      },
    ]

    if (member.role === 'pending_member') {
      actions.push({
        label: 'Aprovar Membro',
        icon: <CheckCircle2 className="h-4 w-4" />,
        onClick: (m: AppUser) => handleApprove(m.uid),
      })
    }

    return actions
  }

  return (
    <PermissionGuard permission="canManageUsers">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Membros
            </h1>
            <p className="text-[9px] md:text-sm font-medium text-slate-500 dark:text-slate-400">
              Gerencie os membros, líderes e visitantes da sua igreja.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-700 active:scale-95 md:w-auto"
          >
            <UserPlus className="h-4 w-4" />
            Adicionar Novo
          </button>
        </div>

        {(pendingMembers.length > 0 || members.filter((m) => m.role === 'visitor').length > 0) && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl bg-amber-50 p-4 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-400 text-sm md:text-base">
                  Novos Usuários
                </p>
                <p className="text-xs md:text-sm text-amber-700 dark:text-amber-500/80">
                  {pendingMembers.length > 0 && `${pendingMembers.length} aguardando aprovação`}
                  {pendingMembers.length > 0 &&
                    members.filter((m) => m.role === 'visitor').length > 0 &&
                    ' e '}
                  {members.filter((m) => m.role === 'visitor').length > 0 &&
                    `${members.filter((m) => m.role === 'visitor').length} novos visitantes`}
                  .
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              {pendingMembers.length > 0 && (
                <button
                  onClick={() => setRoleFilter('pending_member')}
                  className="flex-1 md:flex-none rounded-lg bg-white px-4 py-2 text-sm font-medium text-amber-700 shadow-sm border border-amber-200 hover:bg-amber-50 transition-colors text-center"
                >
                  Ver Pendentes
                </button>
              )}
              {members.filter((m) => m.role === 'visitor').length > 0 && (
                <button
                  onClick={() => setRoleFilter('visitor')}
                  className="flex-1 md:flex-none rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 transition-colors text-center"
                >
                  Ver Visitantes
                </button>
              )}
            </div>
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
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-amber-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          <div className="w-full md:w-auto overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
            <div className="flex items-center gap-2 min-w-max">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Filter className="h-4 w-4" />
              </div>
              {(['all', 'pastor', 'secretary', 'member', 'pending_member', 'visitor'] as const).map(
                (role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                      roleFilter === role
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20 dark:shadow-none'
                        : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {role === 'all' ? 'Todos' : roleLabels[role as UserRole]}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredMembers}
          isLoading={loading}
          emptyMessage="Nenhum membro encontrado."
          actions={getActions}
          onRowClick={(member) => router.push(`/dashboard/members/${member.uid}`)}
          renderMobileCard={(member) => (
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <UserAvatar
                      src={member.profile.avatar_url}
                      name={member.profile.full_name}
                      size={48}
                      className="rounded-2xl border-2 border-white dark:border-slate-700 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800"
                      textClassName="text-lg"
                    />
                    {(member.role === 'pending_member' || member.role === 'visitor') && (
                      <div
                        className={cn(
                          'absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900',
                          member.role === 'pending_member'
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-blue-500',
                        )}
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm leading-tight">
                      {member.profile.full_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${roleColors[member.role]}`}
                      >
                        {roleLabels[member.role]}
                      </span>
                      {member.profile.church_position && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {member.profile.church_position}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 border border-slate-200/50 dark:border-slate-700/50 active:scale-90 transition-all">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-52 rounded-2xl p-2 shadow-2xl border-slate-200 dark:border-slate-800"
                    >
                      <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Gerenciar
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="my-1 opacity-50" />
                      {getActions(member).map((action, idx) => (
                        <DropdownMenuItem
                          key={idx}
                          onClick={() => action.onClick(member)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                            action.variant === 'destructive'
                              ? 'text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20'
                              : 'text-slate-700 dark:text-slate-300 focus:bg-slate-50 dark:focus:bg-slate-800'
                          }`}
                        >
                          <span className="shrink-0 opacity-70">{action.icon}</span>
                          <span className="font-bold text-xs">{action.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}
        />
      </div>

      <CreateMemberModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchMembers}
      />
    </PermissionGuard>
  )
}
