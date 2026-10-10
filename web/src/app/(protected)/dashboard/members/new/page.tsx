'use client'

import { useState } from 'react'
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
  Heart,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { maskPhone, maskCPF, maskCEP } from '@/lib/utils'
import { MINISTRY_ATTRIBUTIONS } from '@/lib/ministry-attributions'
import { ChipMultiSelect } from '@/components/ui/chip-multi-select'
import { SectionCard } from '@/components/ui/section-card'
import { SelectField } from '@/components/ui/select-field'
import {
  BLOOD_TYPE_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  ROLE_OPTIONS,
} from '@/lib/member-options'
import { Switch } from '@/components/ui/switch'
import { PageTitle } from '@/components/ui/page-title'

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
  atribuicao_principal: z.enum(MINISTRY_ATTRIBUTIONS).optional(),
  atribuicoes_secundarias: z.array(z.enum(MINISTRY_ATTRIBUTIONS)),
  can_post_mural: z.boolean(),

  // Saúde/Emergência
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  blood_type: z.string().optional(),
})

type MemberFormData = z.infer<typeof memberSchema>

export default function MemberCreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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
      atribuicoes_secundarias: [],
      can_post_mural: false,
      children_count: 0,
    },
  })

  const selectedAttribution = watch('atribuicao_principal')
  const selectedSecondaryAttributions = watch('atribuicoes_secundarias')
  const selectedRole = watch('role')

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
          <PageTitle
            title="Novo Membro"
            description="Cadastre um novo membro com todas as informações necessárias."
          />
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
            <SectionCard
              title="Credenciais de Acesso"
              description="Dados para o membro acessar o sistema."
              contentClassName="grid gap-6 md:grid-cols-2"
            >
              <div className="space-y-2">
                <Label>E-mail</Label>
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
                <Label>Senha Provisória</Label>
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
            </SectionCard>
          </TabsContent>

          <TabsContent value="personal">
            <SectionCard
              title="Informações Básicas"
              description="Dados essenciais de identificação e contato."
              contentClassName="grid gap-6 md:grid-cols-2"
            >
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input {...register('full_name')} placeholder="Nome completo" className="h-11 rounded-xl" />
                {errors.full_name && (
                  <p className="text-xs text-red-500 font-medium">{errors.full_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  {...register('phone')}
                  numeric
                  onChange={(e) => setValue('phone', maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input type="date" {...register('birth_date')} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Naturalidade</Label>
                <Input
                  {...register('naturalness')}
                  placeholder="Ex: São Paulo - SP"
                  className="h-11 rounded-xl"
                />
              </div>
              <SelectField
                label="Sexo"
                                options={GENDER_OPTIONS}
                onValueChange={(v) => setValue('gender', v)}
                defaultValue="M"
                triggerClassName="h-11 rounded-xl"
              />
            </SectionCard>
          </TabsContent>

          <TabsContent value="family">
            <SectionCard
              title="Estrutura Familiar"
              description="Informações sobre pais, cônjuge e dependentes."
              contentClassName="grid gap-6 md:grid-cols-2"
            >
              <div className="space-y-2">
                <Label>Nome do Pai</Label>
                <Input {...register('father_name')} placeholder="Nome do pai" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Nome da Mãe</Label>
                <Input {...register('mother_name')} placeholder="Nome da mãe" className="h-11 rounded-xl" />
              </div>
              <SelectField
                label="Estado Civil"
                                options={MARITAL_STATUS_OPTIONS}
                onValueChange={(v) => setValue('marital_status', v)}
                defaultValue="single"
                triggerClassName="h-11 rounded-xl"
              />
              <div className="space-y-2">
                <Label>Quantidade de Filhos</Label>
                <Input type="number" numeric {...register('children_count')} className="h-11 rounded-xl" />
              </div>
              {watch('marital_status') === 'married' && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome do Cônjuge</Label>
                  <Input
                    {...register('spouse_name')}
                    placeholder="Nome do cônjuge"
                    className="h-11 rounded-xl"
                  />
                </div>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="address">
            <SectionCard
              title="Endereço Residencial"
              description="Localização atual do membro."
              contentClassName="grid gap-6 md:grid-cols-3"
            >
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  {...register('zip_code')}
                  numeric
                  onChange={(e) => setValue('zip_code', maskCEP(e.target.value))}
                  placeholder="00000-000"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Logradouro / Rua</Label>
                <Input {...register('address')} placeholder="Rua, Avenida..." className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input {...register('address_number')} placeholder="Nº" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Complemento</Label>
                <Input
                  {...register('address_complement')}
                  placeholder="Apto, Bloco, Casa..."
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input {...register('neighborhood')} placeholder="Bairro" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input {...register('city')} placeholder="Cidade" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Estado (UF)</Label>
                <Input
                  {...register('state')}
                  maxLength={2}
                  placeholder="EX: SP"
                  className="uppercase h-11 rounded-xl"
                />
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="docs">
            <SectionCard
              title="Documentação e Carreira"
              description="Documentos oficiais e informações profissionais."
              contentClassName="grid gap-6 md:grid-cols-2"
            >
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  {...register('cpf')}
                  numeric
                  onChange={(e) => setValue('cpf', maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>RG</Label>
                <Input {...register('rg')} placeholder="00.000.000-0" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Profissão</Label>
                <Input
                  {...register('profession')}
                  placeholder="Ex: Engenheiro, Professor, Autônomo"
                  className="h-11 rounded-xl"
                />
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="church">
            <SectionCard
              title="Vida Eclesiástica"
              description="Histórico ministerial e participação em grupos."
              contentClassName="space-y-8"
            >
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Cargo principal</Label>
                  <Select
                    onValueChange={(v) =>
                      setValue('atribuicao_principal', v as MemberFormData['atribuicao_principal'])
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl">
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
                  defaultValue="member"
                  triggerClassName="h-11 rounded-xl"
                />
                <div className="space-y-2">
                  <Label>Data de Batismo</Label>
                  <Input type="date" {...register('baptism_date')} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Data de Comunhão</Label>
                  <Input type="date" {...register('communion_date')} className="h-11 rounded-xl" />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Label className="text-sm font-black tracking-tight">Atribuições extras</Label>
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
                  <Label className="text-sm font-black tracking-tight">
                    Pode postar/gerenciar no mural
                  </Label>
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
            </SectionCard>
          </TabsContent>

          <TabsContent value="health">
            <SectionCard
              title="Saúde e Emergência"
              description="Informações cruciais para segurança do membro."
              contentClassName="grid gap-6 md:grid-cols-2"
            >
              <SelectField
                label="Tipo Sanguíneo"
                                options={BLOOD_TYPE_OPTIONS}
                onValueChange={(v) => setValue('blood_type', v)}
                defaultValue="O+"
                triggerClassName="h-11 rounded-xl"
              />
              <div className="space-y-2">
                <Label>Nome do Contato de Emergência</Label>
                <Input
                  {...register('emergency_contact_name')}
                  placeholder="Ex: Maria (Esposa)"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone de Emergência</Label>
                <Input
                  {...register('emergency_contact_phone')}
                  numeric
                  onChange={(e) => setValue('emergency_contact_phone', maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="h-11 rounded-xl"
                />
              </div>
            </SectionCard>
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
