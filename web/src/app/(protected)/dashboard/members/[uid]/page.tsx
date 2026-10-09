'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  FileText,
  Shield,
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  Heart,
  Baby,
  UserCheck,
  Flag,
  Cross,
} from 'lucide-react'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { AppUser } from '@/types'
import { getUserById, updateUserProfile, deleteUser } from '@/services/firebase/users'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import { maskPhone, maskCPF, maskCEP, cn } from '@/lib/utils'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { MINISTRY_ATTRIBUTIONS, resolveAttributionGroupIds } from '@/lib/ministry-attributions'
import { ChipMultiSelect } from '@/components/ui/chip-multi-select'
import { SelectField } from '@/components/ui/select-field'
import {
  BLOOD_TYPE_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  ROLE_OPTIONS,
} from '@/lib/member-options'
import { Switch } from '@/components/ui/switch'
import { useMembersStore } from '@/store/useMembersStore'

const memberSchema = z.object({
  // Pessoal
  full_name: z.string().min(3, 'Nome muito curto'),
  role: z.enum(['member', 'secretary', 'pastor', 'visitor', 'pending_member']),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['M', 'F', 'O']).optional(),
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed', 'separated']).optional(),
  spouse_name: z.string().optional(),
  children_count: z.coerce.number().min(0).optional(),
  father_name: z.string().optional(),
  mother_name: z.string().optional(),
  naturalness: z.string().optional(),

  // Documentação
  profession: z.string().optional(),
  rg: z.string().optional(),
  cpf: z.string().optional(),

  // Endereço
  address: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),

  // Eclesiástico
  communion_date: z.string().optional(),
  baptism_date: z.string().optional(),
  atribuicao_principal: z.enum(MINISTRY_ATTRIBUTIONS).optional(),
  atribuicoes_secundarias: z.array(z.enum(MINISTRY_ATTRIBUTIONS)),
  can_post_mural: z.boolean(),

  // Saúde/Emergência
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  blood_type: z.string().optional(),
})

type MemberFormData = z.infer<typeof memberSchema>

function toFormValues(userData: AppUser): MemberFormData {
  return {
    full_name: userData.profile.full_name,
    role: userData.role,
    phone: userData.profile.phone || '',
    birth_date: userData.profile.birth_date || '',
    gender: userData.profile.gender || 'M',
    marital_status: userData.profile.marital_status || 'single',
    spouse_name: userData.profile.spouse_name || '',
    children_count: userData.profile.children_count || 0,
    father_name: userData.profile.father_name || '',
    mother_name: userData.profile.mother_name || '',
    naturalness: userData.profile.naturalness || '',
    profession: userData.profile.profession || '',
    rg: userData.profile.rg || '',
    cpf: userData.profile.cpf || '',
    address: userData.profile.address || '',
    address_number: userData.profile.address_number || '',
    address_complement: userData.profile.address_complement || '',
    neighborhood: userData.profile.neighborhood || '',
    city: userData.profile.city || '',
    state: userData.profile.state || '',
    zip_code: userData.profile.zip_code || '',
    communion_date: userData.profile.communion_date || '',
    baptism_date: userData.profile.baptism_date || '',
    atribuicao_principal: userData.atribuicao_principal,
    atribuicoes_secundarias: userData.atribuicoes_secundarias || [],
    can_post_mural: userData.can_post_mural ?? false,
    emergency_contact_name: userData.profile.emergency_contact_name || '',
    emergency_contact_phone: userData.profile.emergency_contact_phone || '',
    blood_type: userData.profile.blood_type || '',
  }
}

export default function MemberEditPage() {
  const { uid } = useParams() as { uid: string }
  const router = useRouter()
  // Vindo da lista, o membro já está no useMembersStore: abre na hora, sem buscar de novo.
  // Lido só na montagem — atualizações do listener não sobrescrevem o formulário em edição.
  const [cachedMember] = useState(() => useMembersStore.getState().getMember(uid))
  const [loading, setLoading] = useState(!cachedMember)
  const [saving, setSaving] = useState(false)
  const [member, setMember] = useState<AppUser | null>(cachedMember ?? null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema) as any,
    defaultValues: cachedMember
      ? toFormValues(cachedMember)
      : {
          atribuicoes_secundarias: [],
          can_post_mural: false,
        },
  })

  const selectedAttribution = watch('atribuicao_principal')
  const selectedSecondaryAttributions = watch('atribuicoes_secundarias')
  const selectedRole = watch('role')

  useEffect(() => {
    if (cachedMember) return

    async function loadData() {
      try {
        const userData = await getUserById(uid)

        if (!userData) {
          toast.error('Membro não encontrado')
          router.push('/dashboard/members')
          return
        }

        setMember(userData)

        // Populate form
        reset(toFormValues(userData))
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [uid, cachedMember, reset, router])

  const onSubmit = async (data: MemberFormData) => {
    setSaving(true)
    try {
      // Split data for profile and user document
      const {
        role,
        atribuicao_principal,
        atribuicoes_secundarias,
        can_post_mural,
        ...profileFields
      } = data

      await updateUserProfile(uid, profileFields)

      const sub_groups = resolveAttributionGroupIds(atribuicao_principal, atribuicoes_secundarias)

      const userRef = doc(db, 'users', uid)
      await updateDoc(userRef, {
        role,
        sub_groups,
        atribuicao_principal: atribuicao_principal ?? null,
        atribuicoes_secundarias,
        can_post_mural: role === 'secretary' || role === 'pastor' ? true : can_post_mural,
        updated_at: Timestamp.now(),
      })

      toast.success('Perfil atualizado com sucesso!')
      router.refresh()
    } catch (error) {
      toast.error('Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <HebromSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full h-8 w-8 md:h-10 md:w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">
              Detalhes do Membro
            </h1>
            <p className="text-[10px] md:text-xs font-medium text-slate-500">
              Gerencie as informações de{' '}
              <span className="text-amber-600 dark:text-amber-400">
                {member?.profile.full_name}
              </span>
            </p>
          </div>
        </div>

        {/* Profile Overview Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-4 md:p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          {/* <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none">
            <User className="h-24 w-24 md:h-32 md:w-32" />
          </div> */}

          <div className="flex items-center gap-4 md:gap-6 relative z-10">
            <div className="flex shrink-0 flex-col items-center gap-2">
              <UserAvatar
                src={member?.profile.avatar_url}
                name={member?.profile.full_name}
                className="h-16 w-16 md:h-24 md:w-24 rounded-3xl border-4 border-white dark:border-slate-800 shadow-xl ring-1 ring-slate-100 dark:ring-slate-700"
                textClassName="text-2xl md:text-3xl"
              />
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap',
                  member?.role === 'pastor'
                    ? 'bg-purple-100 text-purple-700'
                    : member?.role === 'secretary'
                      ? 'bg-blue-100 text-blue-700'
                      : member?.role === 'visitor'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-emerald-100 text-emerald-700',
                )}
              >
                {member?.role && member.role.replace('_', ' ')}
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <h2 className="text-fluid-title font-black text-slate-900 dark:text-white break-words">
                {member?.profile.full_name}
              </h2>
              <div className="flex flex-col gap-1 text-xs md:text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Briefcase className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span className="truncate">{member?.atribuicao_principal || 'Membro'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  {member?.profile.phone || 'Sem telefone'}
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-col gap-2 min-w-[160px]">
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700 rounded-xl font-bold"
                onClick={handleSubmit(onSubmit)}
                disabled={saving}
              >
                {saving ? (
                  <HebromSpinner size="sm" className="mr-2" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 hover:bg-red-50 rounded-xl font-bold"
                onClick={async () => {
                  if (confirm('Excluir permanentemente este membro?')) {
                    try {
                      await deleteUser(uid)
                      toast.success('Membro excluído')
                      router.push('/dashboard/members')
                    } catch (error) {
                      toast.error('Erro ao excluir')
                    }
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue="personal" className="w-full">
        <div className="relative w-full overflow-x-auto mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="overflow-x-auto no-scrollbar inline-flex h-11 w-max min-w-full items-center justify-start rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <TabsTrigger
              value="personal"
              className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap shrink-0"
            >
              <User className="mr-2 h-3.5 w-3.5" /> Informações
            </TabsTrigger>
            <TabsTrigger
              value="family"
              className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap shrink-0"
            >
              <Baby className="mr-2 h-3.5 w-3.5" /> Família
            </TabsTrigger>
            <TabsTrigger
              value="address"
              className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap shrink-0"
            >
              <MapPin className="mr-2 h-3.5 w-3.5" /> Endereço
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap shrink-0"
            >
              <FileText className="mr-2 h-3.5 w-3.5" /> Documentos
            </TabsTrigger>
            <TabsTrigger
              value="church"
              className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap shrink-0"
            >
              <Cross className="mr-2 h-3.5 w-3.5" /> Igreja
            </TabsTrigger>
            <TabsTrigger
              value="health"
              className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap shrink-0"
            >
              <Heart className="mr-2 h-3.5 w-3.5" /> Saúde
            </TabsTrigger>
          </TabsList>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TabsContent value="personal">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
              <div className="h-1.5 bg-amber-600 w-full" />
              <CardHeader>
                <CardTitle className="text-xl md:text-base font-black">
                  Informações Básicas
                </CardTitle>
                <CardDescription className="text-sm">
                  Dados essenciais de identificação e contato.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input {...register('full_name')} placeholder="Nome completo" className="h-11" />
                  {errors.full_name && (
                    <p className="text-xs text-red-500">{errors.full_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    value={member?.email}
                    disabled
                    className="h-11 bg-slate-50 dark:bg-slate-900 border-dashed"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    {...register('phone')}
                    numeric
                    onChange={(e) => setValue('phone', maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input type="date" {...register('birth_date')} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Naturalidade</Label>
                  <Input
                    {...register('naturalness')}
                    placeholder="Ex: São Paulo - SP"
                    className="h-11"
                  />
                </div>
                <SelectField
                  label="Sexo"
                  options={GENDER_OPTIONS}
                  onValueChange={(v) => setValue('gender', v)}
                  defaultValue={watch('gender')}
                  triggerClassName="h-11"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="family">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
              <div className="h-1.5 bg-amber-600 w-full" />
              <CardHeader>
                <CardTitle className="text-xl md:text-base font-black">
                  Família e Relacionamento
                </CardTitle>
                <CardDescription className="text-sm">
                  Informações sobre cônjuge e filhos.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome do Pai</Label>
                  <Input {...register('father_name')} placeholder="Nome do pai" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Nome da Mãe</Label>
                  <Input {...register('mother_name')} placeholder="Nome da mãe" className="h-11" />
                </div>
                <SelectField
                  label="Estado Civil"
                  options={MARITAL_STATUS_OPTIONS}
                  onValueChange={(v) => setValue('marital_status', v)}
                  defaultValue={watch('marital_status')}
                  triggerClassName="h-11"
                />
                <div className="space-y-2">
                  <Label>Quantidade de Filhos</Label>
                  <Input type="number" numeric {...register('children_count')} className="h-11" />
                </div>
                {watch('marital_status') === 'married' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome do Cônjuge</Label>
                    <Input
                      {...register('spouse_name')}
                      placeholder="Nome do cônjuge"
                      className="h-11"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
              <div className="h-1.5 bg-amber-600 w-full" />
              <CardHeader>
                <CardTitle className="text-xl md:text-base font-black">
                  Endereço Residencial
                </CardTitle>
                <CardDescription className="text-sm">
                  Onde o membro reside atualmente.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    {...register('zip_code')}
                    numeric
                    onChange={(e) => setValue('zip_code', maskCEP(e.target.value))}
                    placeholder="00000-000"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logradouro / Rua</Label>
                  <Input {...register('address')} placeholder="Rua, Avenida..." className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input {...register('address_number')} placeholder="Nº" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    {...register('address_complement')}
                    placeholder="Apto, Bloco, Casa..."
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input {...register('neighborhood')} placeholder="Bairro" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input {...register('city')} placeholder="Cidade" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Estado (UF)</Label>
                  <Input
                    {...register('state')}
                    maxLength={2}
                    placeholder="EX: SP"
                    className="uppercase h-11"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
              <div className="h-1.5 bg-amber-600 w-full" />
              <CardHeader>
                <CardTitle className="text-xl md:text-base font-black">Documentação</CardTitle>
                <CardDescription className="text-sm">
                  Documentos de identificação oficial.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    {...register('cpf')}
                    numeric
                    onChange={(e) => setValue('cpf', maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RG</Label>
                  <Input {...register('rg')} placeholder="00.000.000-0" className="h-11" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Profissão</Label>
                  <Input
                    {...register('profession')}
                    placeholder="Ex: Engenheiro, Professor, Autônomo"
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="church">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
              <div className="h-1.5 bg-amber-600 w-full" />
              <CardHeader>
                <CardTitle className="text-xl md:text-base font-black">Vida Eclesiástica</CardTitle>
                <CardDescription className="text-sm">
                  Histórico ministerial e grupos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Cargo principal</Label>
                    <Select
                      onValueChange={(v) =>
                        setValue(
                          'atribuicao_principal',
                          v as MemberFormData['atribuicao_principal'],
                        )
                      }
                      defaultValue={member?.atribuicao_principal}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                      <SelectContent>
                        {MINISTRY_ATTRIBUTIONS.map((attribution) => (
                          <SelectItem key={attribution} value={attribution}>
                            {attribution}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <SelectField
                    label="Permissão do Sistema"
                    options={ROLE_OPTIONS}
                    onValueChange={(v) => setValue('role', v)}
                    defaultValue={member?.role}
                    triggerClassName="h-11"
                  />
                  <div className="space-y-2">
                    <Label>Data de Batismo</Label>
                    <Input type="date" {...register('baptism_date')} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Comunhão</Label>
                    <Input type="date" {...register('communion_date')} className="h-11" />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Label className="text-sm font-semibold">Atribuições extras</Label>
                  <ChipMultiSelect
                    title="Atribuições extras"
                    triggerLabel="Selecionar atribuições extras"
                    options={MINISTRY_ATTRIBUTIONS.filter((a) => a !== selectedAttribution).map(
                      (a) => ({ id: a, label: a }),
                    )}
                    selected={selectedSecondaryAttributions || []}
                    onChange={(next) =>
                      setValue(
                        'atribuicoes_secundarias',
                        next as MemberFormData['atribuicoes_secundarias'],
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div>
                    <Label className="text-sm font-semibold">Pode postar/gerenciar no mural</Label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Já é automático para Secretaria/Pastor. Ative aqui para dar esse acesso a um
                      membro específico.
                    </p>
                  </div>
                  <Switch
                    checked={
                      selectedRole === 'secretary' ||
                      selectedRole === 'pastor' ||
                      watch('can_post_mural')
                    }
                    disabled={selectedRole === 'secretary' || selectedRole === 'pastor'}
                    onCheckedChange={(checked) => setValue('can_post_mural', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
              <div className="h-1.5 bg-amber-600 w-full" />
              <CardHeader>
                <CardTitle className="text-xl md:text-base font-black">Saúde e Cuidados</CardTitle>
                <CardDescription className="text-sm">
                  Informações importantes para casos de emergência.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <SelectField
                  label="Tipo Sanguíneo"
                  options={BLOOD_TYPE_OPTIONS}
                  onValueChange={(v) => setValue('blood_type', v)}
                  defaultValue={watch('blood_type')}
                  triggerClassName="h-11"
                />
                <div className="space-y-2">
                  <Label>Nome do Contato de Emergência</Label>
                  <Input
                    {...register('emergency_contact_name')}
                    placeholder="Ex: Maria (Esposa)"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone de Emergência</Label>
                  <Input
                    {...register('emergency_contact_phone')}
                    numeric
                    onChange={(e) => setValue('emergency_contact_phone', maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>

        {/* Mobile Actions */}
        <div className=" flex flex-col gap-4 md:hidden">
          <Button
            className="w-full bg-amber-600 hover:bg-amber-700 h-12 rounded-xl text-base font-black shadow-lg shadow-amber-500/25 dark:shadow-none"
            onClick={handleSubmit(onSubmit)}
            disabled={saving}
          >
            {saving ? (
              <HebromSpinner size="sm" className="mr-2 brightness-200" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            Salvar Alterações
          </Button>

          <Button
            variant="outline"
            className="w-full bg-red-700 text-red-100  hover:bg-red-50 h-12 rounded-xl text-sm font-bold"
            onClick={async () => {
              if (confirm('Deseja realmente excluir este membro?')) {
                try {
                  await deleteUser(uid)
                  toast.success('Membro excluído')
                  router.push('/dashboard/members')
                } catch (error) {
                  toast.error('Erro ao excluir')
                }
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Membro
          </Button>
        </div>
      </Tabs>
    </div>
  )
}
