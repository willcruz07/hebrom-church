'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  ChevronLeft,
  Save,
  User,
  FileText,
  MapPin,
  Users as UsersIcon,
  Heart,
  CheckCircle2,
  Baby,
  Cross,
  Mail,
  Lock,
} from 'lucide-react'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getGroups } from '@/services/firebase/groups'
import { ChurchGroup } from '@/types'
import { cn, maskPhone, maskCPF, maskCEP } from '@/lib/utils'

const memberSchema = z.object({
  // Auth
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),

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
  church_position: z.string().optional(),

  // Saúde/Emergência
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  blood_type: z.string().optional(),
})

type MemberFormData = z.infer<typeof memberSchema>

export default function MemberCreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<ChurchGroup[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema) as any,
    defaultValues: {
      role: 'member',
      gender: 'M',
      marital_status: 'single',
      sub_groups: [],
      children_count: 0,
    },
  })

  const selectedGroups = watch('sub_groups')

  useEffect(() => {
    getGroups().then(setGroups)
  }, [])

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

  const onSubmit = async (data: MemberFormData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Membro cadastrado com sucesso!')
      router.push('/dashboard/members')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar membro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <header className="mb-8 space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-sm md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Novo Membro
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Cadastre um novo membro com todas as informações necessárias.
            </p>
          </div>
          <div className="hidden sm:flex gap-3">
            <Button variant="outline" onClick={() => router.back()} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 rounded-xl shadow-lg shadow-amber-500/25"
            >
              {loading ? (
                <HebromSpinner size="sm" className="mr-2 brightness-200" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Cadastrar Membro
            </Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue="auth" className="w-full">
        <div className="w-full overflow-x-auto no-scrollbar mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="flex w-max min-w-full md:grid md:w-full md:grid-cols-7 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <TabsTrigger
              value="auth"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap"
            >
              <Lock className="mr-2 h-4 w-4" /> <span className="text-xs font-bold">Acesso</span>
            </TabsTrigger>
            <TabsTrigger
              value="personal"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap"
            >
              <User className="mr-2 h-4 w-4" /> <span className="text-xs font-bold">Pessoal</span>
            </TabsTrigger>
            <TabsTrigger
              value="family"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap"
            >
              <Baby className="mr-2 h-4 w-4" /> <span className="text-xs font-bold">Família</span>
            </TabsTrigger>
            <TabsTrigger
              value="address"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap"
            >
              <MapPin className="mr-2 h-4 w-4" /> <span className="text-xs font-bold">Endereço</span>
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap"
            >
              <FileText className="mr-2 h-4 w-4" /> <span className="text-xs font-bold">Docs</span>
            </TabsTrigger>
            <TabsTrigger
              value="church"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap"
            >
              <Cross className="mr-2 h-4 w-4" /> <span className="text-xs font-bold">Igreja</span>
            </TabsTrigger>
            <TabsTrigger
              value="health"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap"
            >
              <Heart className="mr-2 h-4 w-4" /> <span className="text-xs font-bold">Saúde</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TabsContent value="auth">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
              <div className="h-2 bg-slate-900 w-full" />
              <CardHeader className="py-4">
                <CardTitle className="text-sm md:text-lg font-black tracking-tight">Credenciais de Acesso</CardTitle>
                <CardDescription className="text-[10px]">Dados para o membro acessar o sistema.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="email@exemplo.com"
                      className="pl-10 h-11 rounded-xl"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Senha Provisória</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      {...register('password')}
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10 h-11 rounded-xl"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personal">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
              <div className="h-2 bg-amber-600 w-full" />
              <CardHeader className="py-4">
                <CardTitle className="text-sm md:text-lg font-black tracking-tight">Informações Básicas</CardTitle>
                <CardDescription className="text-[10px]">Dados essenciais de identificação e contato.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome Completo</Label>
                  <Input {...register('full_name')} placeholder="Nome completo" className="h-11 rounded-xl" />
                  {errors.full_name && (
                    <p className="text-xs text-red-500 font-medium">{errors.full_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Telefone</Label>
                  <Input
                    {...register('phone')}
                    onChange={(e) => setValue('phone', maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Data de Nascimento</Label>
                  <Input type="date" {...register('birth_date')} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Naturalidade</Label>
                  <Input
                    {...register('naturalness')}
                    placeholder="Ex: São Paulo - SP"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sexo</Label>
                  <Select onValueChange={(v) => setValue('gender', v as any)} defaultValue="M">
                    <SelectTrigger className="h-11 rounded-xl">
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
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
              <div className="h-2 bg-pink-500 w-full" />
              <CardHeader className="py-4">
                <CardTitle className="text-sm md:text-lg font-black tracking-tight">Estrutura Familiar</CardTitle>
                <CardDescription className="text-[10px]">Informações sobre pais, cônjuge e dependentes.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome do Pai</Label>
                  <Input {...register('father_name')} placeholder="Nome do pai" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome da Mãe</Label>
                  <Input {...register('mother_name')} placeholder="Nome da mãe" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Estado Civil</Label>
                  <Select
                    onValueChange={(v) => setValue('marital_status', v as any)}
                    defaultValue="single"
                  >
                    <SelectTrigger className="h-11 rounded-xl">
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
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Quantidade de Filhos</Label>
                  <Input type="number" {...register('children_count')} className="h-11 rounded-xl" />
                </div>
                {watch('marital_status') === 'married' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome do Cônjuge</Label>
                    <Input
                      {...register('spouse_name')}
                      placeholder="Nome do cônjuge"
                      className="h-11 rounded-xl"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
              <div className="h-2 bg-blue-500 w-full" />
              <CardHeader className="py-4">
                <CardTitle className="text-sm md:text-lg font-black tracking-tight">Endereço Residencial</CardTitle>
                <CardDescription className="text-[10px]">Localização atual do membro.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">CEP</Label>
                  <Input
                    {...register('zip_code')}
                    onChange={(e) => setValue('zip_code', maskCEP(e.target.value))}
                    placeholder="00000-000"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Logradouro / Rua</Label>
                  <Input {...register('address')} placeholder="Rua, Avenida..." className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Número</Label>
                  <Input {...register('address_number')} placeholder="Nº" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Complemento</Label>
                  <Input
                    {...register('address_complement')}
                    placeholder="Apto, Bloco, Casa..."
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bairro</Label>
                  <Input {...register('neighborhood')} placeholder="Bairro" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cidade</Label>
                  <Input {...register('city')} placeholder="Cidade" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Estado (UF)</Label>
                  <Input
                    {...register('state')}
                    maxLength={2}
                    placeholder="EX: SP"
                    className="uppercase h-11 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
              <div className="h-2 bg-emerald-500 w-full" />
              <CardHeader className="py-4">
                <CardTitle className="text-sm md:text-lg font-black tracking-tight">Documentação e Carreira</CardTitle>
                <CardDescription className="text-[10px]">Documentos oficiais e informações profissionais.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">CPF</Label>
                  <Input
                    {...register('cpf')}
                    onChange={(e) => setValue('cpf', maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">RG</Label>
                  <Input {...register('rg')} placeholder="00.000.000-0" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Profissão</Label>
                  <Input
                    {...register('profession')}
                    placeholder="Ex: Engenheiro, Professor, Autônomo"
                    className="h-11 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="church">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
              <div className="h-2 bg-purple-600 w-full" />
              <CardHeader className="py-4">
                <CardTitle className="text-sm md:text-lg font-black tracking-tight">Vida Eclesiástica</CardTitle>
                <CardDescription className="text-[10px]">Histórico ministerial e participação em grupos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cargo Eclesiástico</Label>
                    <Input
                      {...register('church_position')}
                      placeholder="Ex: Diácono, Presbítero, Obreiro"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Permissão do Sistema</Label>
                    <Select onValueChange={(v) => setValue('role', v as any)} defaultValue="member">
                      <SelectTrigger className="h-11 rounded-xl">
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
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Data de Batismo</Label>
                    <Input type="date" {...register('baptism_date')} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Data de Comunhão</Label>
                    <Input type="date" {...register('communion_date')} className="h-11 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-black tracking-tight">Ministérios e Grupos</Label>
                    <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
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
                          'flex items-center gap-2 px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border text-left',
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
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
              <div className="h-2 bg-red-500 w-full" />
              <CardHeader className="py-4">
                <CardTitle className="text-sm md:text-lg font-black tracking-tight">Saúde e Emergência</CardTitle>
                <CardDescription className="text-[10px]">Informações cruciais para segurança do membro.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tipo Sanguíneo</Label>
                  <Select onValueChange={(v) => setValue('blood_type', v)} defaultValue="O+">
                    <SelectTrigger className="h-11 rounded-xl">
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
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome do Contato de Emergência</Label>
                  <Input
                    {...register('emergency_contact_name')}
                    placeholder="Ex: Maria (Esposa)"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Telefone de Emergência</Label>
                  <Input
                    {...register('emergency_contact_phone')}
                    onChange={(e) => setValue('emergency_contact_phone', maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="h-11 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mobile Action Buttons (Stacked) */}
          <div className="flex flex-col gap-3 pt-4 md:hidden">
            <Button
              type="submit"
              disabled={loading}
              className="h-14 w-full bg-amber-600 hover:bg-amber-700 rounded-2xl shadow-xl shadow-amber-500/20 text-base font-black tracking-tight"
            >
              {loading ? (
                <HebromSpinner size="sm" className="mr-2 brightness-200" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              Cadastrar Membro
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-12 w-full rounded-2xl text-slate-500 font-bold border-slate-200 dark:border-slate-800"
            >
              Cancelar e Sair
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}
