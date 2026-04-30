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
  Users,
  CheckCircle2,
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
import { AppUser, ChurchGroup } from '@/types'
import { getUserById, updateUserProfile, deleteUser } from '@/services/firebase/users'
import { getGroups } from '@/services/firebase/groups'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import { maskPhone, maskCPF, maskCEP, cn } from '@/lib/utils'

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
  sub_groups: z.array(z.string()),

  // Saúde/Emergência
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  blood_type: z.string().optional(),
  church_position: z.string().optional(),
})

type MemberFormData = z.infer<typeof memberSchema>

export default function MemberEditPage() {
  const { uid } = useParams() as { uid: string }
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [member, setMember] = useState<AppUser | null>(null)
  const [groups, setGroups] = useState<ChurchGroup[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema) as any,
    defaultValues: {
      sub_groups: [],
    },
  })

  const selectedGroups = watch('sub_groups')

  useEffect(() => {
    async function loadData() {
      try {
        const [userData, groupsData] = await Promise.all([getUserById(uid), getGroups()])

        if (!userData) {
          toast.error('Membro não encontrado')
          router.push('/dashboard/members')
          return
        }

        setMember(userData)
        setGroups(groupsData)

        // Populate form
        reset({
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
          sub_groups: userData.sub_groups || [],
          emergency_contact_name: userData.profile.emergency_contact_name || '',
          emergency_contact_phone: userData.profile.emergency_contact_phone || '',
          blood_type: userData.profile.blood_type || '',
          church_position: userData.profile.church_position || '',
        })
      } catch (error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [uid, reset, router])

  const onSubmit = async (data: MemberFormData) => {
    setSaving(true)
    try {
      // Split data for profile and user document
      const { role, sub_groups, ...profileFields } = data

      await updateUserProfile(uid, profileFields)

      const userRef = doc(db, 'users', uid)
      await updateDoc(userRef, {
        role,
        sub_groups,
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

  const toggleGroup = (groupId: string) => {
    const current = selectedGroups || []
    if (current.includes(groupId)) {
      setValue(
        'sub_groups',
        current.filter((id) => id !== groupId),
      )
    } else {
      setValue('sub_groups', [...current, groupId])
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
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Perfil do Membro</h1>
            <p className="text-sm text-slate-500">
              Gerencie todas as informações detalhadas de {member?.profile.full_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-red-600 border-red-100 hover:bg-red-50"
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
            Excluir
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            onClick={handleSubmit(onSubmit)}
            disabled={saving}
          >
            {saving ? (
              <HebromSpinner size="sm" className="mr-2 brightness-200" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </header>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-8">
          <TabsTrigger
            value="personal"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950"
          >
            <User className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Pessoal</span>
          </TabsTrigger>
          <TabsTrigger
            value="family"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950"
          >
            <Baby className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Família</span>
          </TabsTrigger>
          <TabsTrigger
            value="address"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950"
          >
            <MapPin className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Endereço</span>
          </TabsTrigger>
          <TabsTrigger
            value="docs"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950"
          >
            <FileText className="mr-2 h-4 w-4" />{' '}
            <span className="hidden sm:inline">Documentos</span>
          </TabsTrigger>
          <TabsTrigger
            value="church"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950"
          >
            <Cross className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Igreja</span>
          </TabsTrigger>
          <TabsTrigger
            value="health"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950"
          >
            <Heart className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Saúde</span>
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TabsContent value="personal">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="h-2 bg-amber-600 w-full" />
              <CardHeader>
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
                <CardDescription>Dados essenciais de identificação e contato.</CardDescription>
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
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <Select
                    onValueChange={(v) => setValue('gender', v as any)}
                    defaultValue={watch('gender')}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="O">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="family">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="h-2 bg-pink-500 w-full" />
              <CardHeader>
                <CardTitle className="text-lg">Estrutura Familiar</CardTitle>
                <CardDescription>Informações sobre pais, cônjuge e dependentes.</CardDescription>
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
                <div className="space-y-2">
                  <Label>Estado Civil</Label>
                  <Select
                    onValueChange={(v) => setValue('marital_status', v as any)}
                    defaultValue={watch('marital_status')}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Solteiro(a)</SelectItem>
                      <SelectItem value="married">Casado(a)</SelectItem>
                      <SelectItem value="divorced">Divorciado(a)</SelectItem>
                      <SelectItem value="widowed">Viúvo(a)</SelectItem>
                      <SelectItem value="separated">Separado(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantidade de Filhos</Label>
                  <Input type="number" {...register('children_count')} className="h-11" />
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
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="h-2 bg-amber-500 w-full" />
              <CardHeader>
                <CardTitle className="text-lg">Endereço Residencial</CardTitle>
                <CardDescription>Localização atual do membro.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    {...register('zip_code')}
                    onChange={(e) => setValue('zip_code', maskCEP(e.target.value))}
                    placeholder="00000-000"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Logradouro / Rua</Label>
                  <Input {...register('address')} placeholder="Rua, Avenida..." className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input {...register('address_number')} placeholder="Nº" className="h-11" />
                </div>
                <div className="space-y-2 md:col-span-2">
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
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="h-2 bg-emerald-500 w-full" />
              <CardHeader>
                <CardTitle className="text-lg">Documentação e Carreira</CardTitle>
                <CardDescription>Documentos oficiais e informações profissionais.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    {...register('cpf')}
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
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="h-2 bg-purple-600 w-full" />
              <CardHeader>
                <CardTitle className="text-lg">Vida Eclesiástica</CardTitle>
                <CardDescription>Histórico ministerial e participação em grupos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Cargo Eclesiástico</Label>
                    <Input
                      {...register('church_position')}
                      placeholder="Ex: Diácono, Presbítero, Obreiro"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissão do Sistema</Label>
                    <Select
                      onValueChange={(v) => setValue('role', v as any)}
                      defaultValue={member?.role}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Membro</SelectItem>
                        <SelectItem value="secretary">Secretária</SelectItem>
                        <SelectItem value="pastor">Pastor</SelectItem>
                        <SelectItem value="visitor">Visitante</SelectItem>
                        <SelectItem value="pending_member">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Batismo</Label>
                    <Input type="date" {...register('baptism_date')} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Comunhão</Label>
                    <Input type="date" {...register('communion_date')} className="h-11" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Ministérios e Grupos</Label>
                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                      {selectedGroups?.length || 0} selecionados
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-semibold transition-all border text-left',
                          selectedGroups?.includes(group.id)
                            ? 'bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-200 dark:shadow-none'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400',
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                            selectedGroups?.includes(group.id)
                              ? 'bg-white/20 border-white/40'
                              : 'border-slate-300 dark:border-slate-700',
                          )}
                        >
                          {selectedGroups?.includes(group.id) && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                        </div>
                        <span className="truncate">{group.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="h-2 bg-red-500 w-full" />
              <CardHeader>
                <CardTitle className="text-lg">Saúde e Emergência</CardTitle>
                <CardDescription>Informações cruciais para segurança do membro.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo Sanguíneo</Label>
                  <Select
                    onValueChange={(v) => setValue('blood_type', v)}
                    defaultValue={watch('blood_type')}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                    onChange={(e) => setValue('emergency_contact_phone', maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  )
}
