'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User, MapPin, FileText, Heart, Baby, Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SelectField } from '@/components/ui/select-field'
import { HebromSpinner } from '@/components/ui/HebromSpinner'
import { BLOOD_TYPE_OPTIONS, GENDER_OPTIONS, MARITAL_STATUS_OPTIONS } from '@/lib/member-options'
import { maskPhone, maskCPF, maskRG, maskCEP } from '@/lib/utils'
import { updateUserProfile } from '@/services/firebase/users'
import { useAuth } from '@/store/useAuth'
import type { AppUser } from '@/types'

// Mesmos campos da ficha de membro (dashboard/members/[uid]), menos a aba Igreja:
// permissão, cargos, batismo e comunhão continuam só com a secretaria/pastor.
// Tudo aqui é gravado dentro de `profile.*` do próprio usuário.
const myDataSchema = z.object({
  // Pessoal
  full_name: z.string().min(3, 'Nome muito curto'),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['M', 'F', 'O']).optional(),
  naturalness: z.string().optional(),

  // Família
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed', 'separated']).optional(),
  spouse_name: z.string().optional(),
  children_count: z.coerce.number().min(0).optional(),
  father_name: z.string().optional(),
  mother_name: z.string().optional(),

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

  // Saúde/Emergência
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  blood_type: z.string().optional(),
})

type MyDataFormData = z.infer<typeof myDataSchema>

type MyDataTab = 'personal' | 'family' | 'address' | 'docs' | 'health'

const TAB_LABELS: Record<MyDataTab, string> = {
  personal: 'Informações',
  family: 'Família',
  address: 'Endereço',
  docs: 'Documentos',
  health: 'Saúde',
}

// Onde cada campo está na tela — usado para apontar a aba certa quando a validação falha
const FIELD_LOCATION: Record<keyof MyDataFormData, { tab: MyDataTab; label: string }> = {
  full_name: { tab: 'personal', label: 'Nome Completo' },
  phone: { tab: 'personal', label: 'Telefone' },
  birth_date: { tab: 'personal', label: 'Data de Nascimento' },
  naturalness: { tab: 'personal', label: 'Naturalidade' },
  gender: { tab: 'personal', label: 'Sexo' },
  father_name: { tab: 'family', label: 'Nome do Pai' },
  mother_name: { tab: 'family', label: 'Nome da Mãe' },
  marital_status: { tab: 'family', label: 'Estado Civil' },
  children_count: { tab: 'family', label: 'Quantidade de Filhos' },
  spouse_name: { tab: 'family', label: 'Nome do Cônjuge' },
  zip_code: { tab: 'address', label: 'CEP' },
  address: { tab: 'address', label: 'Logradouro / Rua' },
  address_number: { tab: 'address', label: 'Número' },
  address_complement: { tab: 'address', label: 'Complemento' },
  neighborhood: { tab: 'address', label: 'Bairro' },
  city: { tab: 'address', label: 'Cidade' },
  state: { tab: 'address', label: 'Estado (UF)' },
  cpf: { tab: 'docs', label: 'CPF' },
  rg: { tab: 'docs', label: 'RG' },
  profession: { tab: 'docs', label: 'Profissão' },
  blood_type: { tab: 'health', label: 'Tipo Sanguíneo' },
  emergency_contact_name: { tab: 'health', label: 'Nome do Contato de Emergência' },
  emergency_contact_phone: { tab: 'health', label: 'Telefone de Emergência' },
}

function toFormValues(user: AppUser): MyDataFormData {
  const p = user.profile
  return {
    full_name: p.full_name || '',
    phone: maskPhone(p.phone || ''),
    birth_date: p.birth_date || '',
    gender: p.gender,
    naturalness: p.naturalness || '',
    marital_status: p.marital_status,
    spouse_name: p.spouse_name || '',
    children_count: p.children_count || 0,
    father_name: p.father_name || '',
    mother_name: p.mother_name || '',
    profession: p.profession || '',
    rg: maskRG(p.rg || ''),
    cpf: p.cpf || '',
    address: p.address || '',
    address_number: p.address_number || '',
    address_complement: p.address_complement || '',
    neighborhood: p.neighborhood || '',
    city: p.city || '',
    state: p.state || '',
    zip_code: p.zip_code || '',
    emergency_contact_name: p.emergency_contact_name || '',
    emergency_contact_phone: p.emergency_contact_phone || '',
    blood_type: p.blood_type || '',
  }
}

const TRIGGER_CLASS =
  'rounded-lg px-3 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 whitespace-nowrap shrink-0'

interface MyDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MyDataModal({ open, onOpenChange }: MyDataModalProps) {
  const { currentUser } = useAuth()
  const [saving, setSaving] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent variant="sheet" className="flex h-[min(760px,90dvh)] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base md:text-2xl font-black uppercase tracking-tight">
            Meus Dados
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm font-medium">
            Mantenha sua ficha atualizada para a secretaria da igreja.
          </DialogDescription>
        </DialogHeader>

        {/* O conteúdo do Dialog só monta aberto: cada abertura recomeça da ficha salva */}
        {currentUser && (
          <MyDataLoader
            uid={currentUser.uid}
            saving={saving}
            setSaving={setSaving}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface MyDataLoaderProps {
  uid: string
  saving: boolean
  setSaving: (saving: boolean) => void
  onClose: () => void
}

// Igual à ficha de membro (getUserById pelo uid da rota), mas com o uid de quem está logado:
// o currentUser pode ser o cache do boot, então a ficha é relida do Firestore a cada abertura.
function MyDataLoader({ uid, onClose, ...formProps }: MyDataLoaderProps) {
  const refreshCurrentUser = useAuth((s) => s.refreshCurrentUser)
  const [user, setUser] = useState<AppUser | null>(null)

  useEffect(() => {
    let cancelled = false
    refreshCurrentUser()
      .then((userData) => {
        if (cancelled) return
        if (!userData) throw new Error('Cadastro não encontrado')
        setUser(userData)
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Erro ao carregar seus dados', { description: 'Tente novamente mais tarde.' })
        onClose()
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <HebromSpinner size="lg" />
      </div>
    )
  }

  return <MyDataForm user={user} onClose={onClose} {...formProps} />
}

interface MyDataFormProps {
  user: AppUser
  saving: boolean
  setSaving: (saving: boolean) => void
  onClose: () => void
}

function MyDataForm({ user, saving, setSaving, onClose }: MyDataFormProps) {
  const refreshCurrentUser = useAuth((s) => s.refreshCurrentUser)
  const [activeTab, setActiveTab] = useState<MyDataTab>('personal')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MyDataFormData>({
    resolver: zodResolver(myDataSchema) as any,
    defaultValues: toFormValues(user),
  })

  const onSubmit = async (data: MyDataFormData) => {
    setSaving(true)
    try {
      // Campos vazios ficam fora do update para não gravar `undefined` no Firestore
      const profileFields = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
      ) as Partial<AppUser['profile']>
      await updateUserProfile(user.uid, profileFields)
      await refreshCurrentUser()
      toast.success('Dados atualizados com sucesso!')
      onClose()
    } catch (error) {
      toast.error('Erro ao salvar alterações', {
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
      })
    } finally {
      setSaving(false)
    }
  }

  // Leva o usuário para a primeira aba com problema e diz quais campos revisar.
  const onInvalid = (fieldErrors: typeof errors) => {
    const invalidFields = (Object.keys(fieldErrors) as (keyof MyDataFormData)[])
      .map((field) => FIELD_LOCATION[field])
      .filter(Boolean)

    if (invalidFields.length === 0) {
      toast.error('Não foi possível salvar', { description: 'Verifique os campos do formulário.' })
      return
    }

    const firstTab = invalidFields[0].tab
    const labels = invalidFields.filter((f) => f.tab === firstTab).map((f) => f.label)
    const otherTabs = [...new Set(invalidFields.map((f) => f.tab))].filter((t) => t !== firstTab)

    setActiveTab(firstTab)
    toast.error(`Verifique a aba ${TAB_LABELS[firstTab]}`, {
      description:
        `${labels.length > 1 ? 'Campos' : 'Campo'} com problema: ${labels.join(', ')}.` +
        (otherTabs.length
          ? ` Também há pendências em: ${otherTabs.map((t) => TAB_LABELS[t]).join(', ')}.`
          : ''),
    })
  }

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as MyDataTab)}
        className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
      >
        <div className="relative w-full shrink-0 overflow-x-auto">
          <TabsList className="no-scrollbar inline-flex h-11 w-max min-w-full items-center justify-start rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <TabsTrigger value="personal" className={TRIGGER_CLASS}>
              <User className="mr-1.5 h-3.5 w-3.5" /> Informações
            </TabsTrigger>
            <TabsTrigger value="family" className={TRIGGER_CLASS}>
              <Baby className="mr-1.5 h-3.5 w-3.5" /> Família
            </TabsTrigger>
            <TabsTrigger value="address" className={TRIGGER_CLASS}>
              <MapPin className="mr-1.5 h-3.5 w-3.5" /> Endereço
            </TabsTrigger>
            <TabsTrigger value="docs" className={TRIGGER_CLASS}>
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Documentos
            </TabsTrigger>
            <TabsTrigger value="health" className={TRIGGER_CLASS}>
              <Heart className="mr-1.5 h-3.5 w-3.5" /> Saúde
            </TabsTrigger>
          </TabsList>
        </div>

        <form
          id="my-data-form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pt-4 pb-1"
        >
          <TabsContent value="personal" className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome Completo</Label>
              <Input
                {...register('full_name')}
                placeholder="Nome completo"
                className="h-11 rounded-xl"
              />
              {errors.full_name && (
                <p className="text-xs text-red-500">{errors.full_name.message}</p>
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
              defaultValue={watch('gender')}
              triggerClassName="h-11 rounded-xl"
            />
          </TabsContent>

          <TabsContent value="family" className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do Pai</Label>
              <Input
                {...register('father_name')}
                placeholder="Nome do pai"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome da Mãe</Label>
              <Input
                {...register('mother_name')}
                placeholder="Nome da mãe"
                className="h-11 rounded-xl"
              />
            </div>
            <SelectField
              label="Estado Civil"
              options={MARITAL_STATUS_OPTIONS}
              onValueChange={(v) => setValue('marital_status', v)}
              defaultValue={watch('marital_status')}
              triggerClassName="h-11 rounded-xl"
            />
            <div className="space-y-2">
              <Label>Quantidade de Filhos</Label>
              <Input
                type="number"
                numeric
                {...register('children_count')}
                className="h-11 rounded-xl"
              />
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
          </TabsContent>

          <TabsContent value="address" className="grid gap-5 md:grid-cols-2">
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
            <div className="space-y-2">
              <Label>Logradouro / Rua</Label>
              <Input
                {...register('address')}
                placeholder="Rua, Avenida..."
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input {...register('address_number')} placeholder="Nº" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input
                {...register('address_complement')}
                placeholder="Apto, Bloco, Casa..."
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                {...register('neighborhood')}
                placeholder="Bairro"
                className="h-11 rounded-xl"
              />
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
                className="h-11 rounded-xl uppercase"
              />
            </div>
          </TabsContent>

          <TabsContent value="docs" className="grid gap-5 md:grid-cols-2">
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
              <Input
                {...register('rg')}
                onChange={(e) => setValue('rg', maskRG(e.target.value))}
                placeholder="00.000.000-0"
                className="h-11 rounded-xl uppercase"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Profissão</Label>
              <Input
                {...register('profession')}
                placeholder="Ex: Engenheiro, Professor, Autônomo"
                className="h-11 rounded-xl"
              />
            </div>
          </TabsContent>

          <TabsContent value="health" className="grid gap-5 md:grid-cols-2">
            <SelectField
              label="Tipo Sanguíneo"
              options={BLOOD_TYPE_OPTIONS}
              onValueChange={(v) => setValue('blood_type', v)}
              defaultValue={watch('blood_type') || undefined}
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
          </TabsContent>
        </form>
      </Tabs>

      <DialogFooter className="shrink-0">
        <Button
          type="submit"
          form="my-data-form"
          disabled={saving}
          className="h-11 rounded-xl bg-amber-600 font-bold hover:bg-amber-700"
        >
          {saving ? (
            <HebromSpinner size="sm" className="mr-2 brightness-200" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Dados
        </Button>
        <Button type="button" variant="ghost" disabled={saving} onClick={onClose}>
          Cancelar
        </Button>
      </DialogFooter>
    </>
  )
}
