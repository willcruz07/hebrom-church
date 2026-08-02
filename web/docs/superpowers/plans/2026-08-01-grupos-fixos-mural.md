# Grupos Fixos por Atribuição + Redesenho do Mural — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ligar a atribuição ministerial (`atribuicao_principal`/`atribuicoes_secundarias`) a grupos reais do mural (`ChurchGroup`), removendo a seleção manual de grupo nas telas de membro, e redesenhar o filtro do mural e o "alcance" de posts para multi-seleção via um componente reutilizável, mais adequado a mobile.

**Architecture:** 20 `ChurchGroup` fixos (um por `MinistryAttribution`, ID = slug determinístico do nome) substituem a necessidade de seleção manual de grupo — `sub_groups` do usuário é derivado automaticamente da atribuição escolhida. Um componente `ChipMultiSelect` (grid de chips dentro de um `Sheet` bottom) padroniza toda seleção múltipla do app (extras de atribuição, alcance de post, filtro do mural), substituindo checkboxes/selects nativos por alvos de toque grandes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Firebase JS SDK v12 (client), react-hook-form + zod, shadcn/ui (`Sheet`, `Select`, `Switch`).

## Global Constraints

- Não existe suíte de testes automatizados neste projeto (`AGENTS.md`: comandos são só `npm run dev`/`build`/`lint`, `npx tsc --noEmit`). O "ciclo de teste" de cada task abaixo é: `npx tsc --noEmit` (0 erros) + `npm run lint` (sem novos erros; warnings pré-existentes ~388 são aceitáveis).
- Não rodar `npm run dev` / abrir navegador automaticamente durante a implementação — verificar só estaticamente (tipo/lint); o usuário testa visualmente depois de cada task.
- Não commitar automaticamente — cada task termina com `git add` dos arquivos tocados e um resumo do diff; commit real só quando o usuário pedir explicitamente (convenção deste projeto).
- Autorização continua 100% client-side (risco conhecido documentado em `AGENTS.md`/skill `security-check`) — não introduzir `firestore.rules` nem verificação server-side nesta feature; seguir o padrão já existente (client Firestore SDK + `PermissionGuard`/`usePermissions`).
- Estilo visual: reaproveitar as classes já usadas no app (âmbar como cor de destaque `amber-600`, `rounded-xl`, `dark:` variants) — não introduzir nova paleta.
- Alvo de toque mínimo 44px (`min-h-11`) em qualquer elemento clicável novo, por causa do foco em mobile do projeto.
- Specs de referência: `specs/mural-grupos.md` (spec principal desta implementação), `specs/ministerios-carteirinha.md`, `specs/roles-permissoes.md`.

---

### Task 1: Tipos + slug determinístico + resolver de grupos por atribuição

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/ministry-attributions.ts`

**Interfaces:**
- Produces: `ChurchGroup.is_fixed?: boolean`, `AppUser.can_post_mural?: boolean`, `slugifyAttribution(value: string): string`, `FIXED_GROUP_SEEDS: { id: string; name: MinistryAttribution }[]`, `resolveAttributionGroupIds(principal?: MinistryAttribution, secundarias?: MinistryAttribution[]): string[]`.

- [ ] **Step 1: Adicionar campos novos aos tipos**

Em `src/types/index.ts`, dentro de `AppUser` (logo abaixo de `atribuicoes_secundarias?: MinistryAttribution[];`):

```ts
  // Permissão independente da atribuição — ver specs/mural-grupos.md
  can_post_mural?: boolean;
```

E em `ChurchGroup` (adicionar campo, mantendo os existentes):

```ts
export interface ChurchGroup {
  id: string;
  name: string;
  description?: string;
  leader_uid?: string;
  is_fixed?: boolean;
  created_at: Timestamp;
  updated_at?: Timestamp;
}
```

- [ ] **Step 2: Adicionar slug + seeds + resolver em `ministry-attributions.ts`**

No fim de `src/lib/ministry-attributions.ts`, adicionar:

```ts
export function slugifyAttribution(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const FIXED_GROUP_SEEDS: { id: string; name: MinistryAttribution }[] =
  MINISTRY_ATTRIBUTIONS.map((name) => ({ id: slugifyAttribution(name), name }))

export function resolveAttributionGroupIds(
  principal?: MinistryAttribution,
  secundarias: MinistryAttribution[] = [],
): string[] {
  const all = [principal, ...secundarias].filter(
    (a): a is MinistryAttribution => Boolean(a),
  )
  return Array.from(new Set(all.map(slugifyAttribution)))
}
```

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem saída (0 erros) — `AppUser`/`ChurchGroup` ainda não são consumidos com os campos novos em lugar nenhum, então não deve quebrar nada existente.

Run: `npm run lint`
Expected: `0 errors`, mesma contagem de warnings de antes (~388).

- [ ] **Step 4: Stage**

```bash
git add src/types/index.ts src/lib/ministry-attributions.ts
```

---

### Task 2: Proteção de grupos fixos + seed em `groups.ts` e na tela de Grupos

**Files:**
- Modify: `src/services/firebase/groups.ts`
- Modify: `src/app/(protected)/dashboard/groups/page.tsx`

**Interfaces:**
- Consumes: `FIXED_GROUP_SEEDS`, `slugifyAttribution` (Task 1).
- Produces: `seedFixedGroups(): Promise<number>` (retorna quantos grupos novos foram criados), `deleteGroup` agora lança `Error` com mensagem explicando o bloqueio.

- [ ] **Step 1: Atualizar imports e `deleteGroup` em `groups.ts`**

Substituir o bloco de imports do topo do arquivo:

```ts
import { ChurchGroup } from '@/types';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from './config';
import { FIXED_GROUP_SEEDS } from '@/lib/ministry-attributions';
```

Substituir a função `deleteGroup` existente por:

```ts
export const deleteGroup = async (id: string): Promise<void> => {
  const groupRef = doc(db, 'groups', id);
  const groupSnap = await getDoc(groupRef);

  if (groupSnap.exists() && groupSnap.data().is_fixed) {
    throw new Error('Este é um grupo fixo do sistema e não pode ser excluído.');
  }

  const usersRef = collection(db, 'users');
  const membersQuery = query(usersRef, where('sub_groups', 'array-contains', id));
  const membersSnap = await getCountFromServer(membersQuery);

  if (membersSnap.data().count > 0) {
    throw new Error('Não é possível excluir: existem membros vinculados a este grupo.');
  }

  try {
    await deleteDoc(groupRef);
  } catch (error) {
    console.error('Erro ao excluir grupo:', error);
    throw new Error('Erro ao excluir grupo.');
  }
};
```

- [ ] **Step 2: Adicionar `seedFixedGroups` no fim de `groups.ts`**

```ts
export const seedFixedGroups = async (): Promise<number> => {
  const existing = await getGroups();
  const existingIds = new Set(existing.map((g) => g.id));
  let created = 0;

  for (const { id, name } of FIXED_GROUP_SEEDS) {
    if (existingIds.has(id)) continue;

    await setDoc(doc(db, 'groups', id), {
      name,
      description: '',
      is_fixed: true,
      created_at: serverTimestamp(),
    });
    created++;
  }

  return created;
};
```

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: 0 erros.

Run: `npm run lint`
Expected: `0 errors`; se aparecer warning de import não usado, é sinal de erro na Step 1 (revisar).

- [ ] **Step 4: Botão "Semear grupos padrão" e mensagem de erro real no `handleDelete`, em `groups/page.tsx`**

Adicionar import: `import { getGroups, deleteGroup, seedFixedGroups } from '@/services/firebase/groups'` (substitui a linha de import existente) e `import { Sparkles } from 'lucide-react'` (adicionar ao import existente de `lucide-react`).

Adicionar estado logo após `const [search, setSearch] = useState('')`:

```tsx
  const [isSeeding, setIsSeeding] = useState(false)
```

Substituir `handleDelete` por:

```tsx
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo?')) return

    try {
      await deleteGroup(id)
      toast.success('Grupo excluído com sucesso!')
      fetchGroups(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir grupo')
    }
  }

  const handleSeedFixedGroups = async () => {
    setIsSeeding(true)
    try {
      const created = await seedFixedGroups()
      toast.success(
        created > 0
          ? `${created} grupo(s) padrão criado(s)!`
          : 'Grupos padrão já estavam todos cadastrados.',
      )
      fetchGroups(true)
    } catch (error) {
      toast.error('Erro ao semear grupos padrão')
    } finally {
      setIsSeeding(false)
    }
  }
```

No header, ao lado do botão "Adicionar Novo Grupo" existente, adicionar (mesmo `<div>` ou um `flex gap-2` envolvendo os dois botões):

```tsx
          <button
            onClick={handleSeedFixedGroups}
            disabled={isSeeding}
            className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-700 transition-all hover:bg-amber-100 active:scale-95 disabled:opacity-50 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-400"
          >
            <Sparkles className="h-4 w-4" />
            {isSeeding ? 'Criando...' : 'Semear Grupos Padrão'}
          </button>
```

- [ ] **Step 5: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: 0 erros.

Run: `npm run lint`
Expected: `0 errors`.

- [ ] **Step 6: Stage**

```bash
git add src/services/firebase/groups.ts "src/app/(protected)/dashboard/groups/page.tsx"
```

**Nota para quem executar esta task**: rodar o botão "Semear Grupos Padrão" de fato (clicar no app) grava 20 documentos reais no Firestore do projeto — isso é uma ação real fora do controle desta implementação (não é `npm run dev`, é uma escrita de dados). Avisar o usuário antes de clicar, ou deixar para ele clicar quando for testar.

---

### Task 3: Componente `ChipMultiSelect` reutilizável

**Files:**
- Create: `src/components/ui/chip-multi-select.tsx`

**Interfaces:**
- Consumes: `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetTrigger` (`@/components/ui/sheet`), `cn` (`@/lib/utils`).
- Produces: `ChipMultiSelectOption { id: string; label: string }`, `ChipMultiSelect(props: { options: ChipMultiSelectOption[]; selected: string[]; onChange: (next: string[]) => void; triggerLabel: string; title: string; emptyMessage?: string }): JSX.Element`.

- [ ] **Step 1: Criar o componente**

```tsx
'use client'

import { CheckCircle2, ChevronDown } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export interface ChipMultiSelectOption {
  id: string
  label: string
}

interface ChipMultiSelectProps {
  options: ChipMultiSelectOption[]
  selected: string[]
  onChange: (next: string[]) => void
  triggerLabel: string
  title: string
  emptyMessage?: string
}

export function ChipMultiSelect({
  options,
  selected,
  onChange,
  triggerLabel,
  title,
  emptyMessage = 'Nenhuma opção disponível.',
}: ChipMultiSelectProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <span className="truncate">
            {triggerLabel}
            {selected.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                {selected.length}
              </span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto px-4 pb-6 sm:grid-cols-3">
          {options.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-slate-500">
              {emptyMessage}
            </p>
          )}
          {options.map((option) => {
            const isSelected = selected.includes(option.id)
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all',
                  isSelected
                    ? 'border-amber-600 bg-amber-600 text-white shadow-md shadow-amber-200 dark:shadow-none'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
                )}
              >
                <div
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                    isSelected
                      ? 'border-white/40 bg-white/20'
                      : 'border-slate-300 dark:border-slate-700',
                  )}
                >
                  {isSelected && <CheckCircle2 className="h-3 w-3" />}
                </div>
                <span className="truncate">{option.label}</span>
              </button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: 0 erros.

Run: `npm run lint`
Expected: `0 errors`.

- [ ] **Step 3: Stage**

```bash
git add src/components/ui/chip-multi-select.tsx
```

---

### Task 4: Telas de membro — remover seção manual de grupos, usar `ChipMultiSelect` nas extras, sincronizar `sub_groups`

**Files:**
- Modify: `src/app/(protected)/dashboard/members/[uid]/page.tsx`
- Modify: `src/app/(protected)/dashboard/members/new/page.tsx`
- Modify: `src/app/api/admin/users/route.ts`

**Interfaces:**
- Consumes: `resolveAttributionGroupIds` (Task 1), `ChipMultiSelect`/`ChipMultiSelectOption` (Task 3), `MINISTRY_ATTRIBUTIONS` (já existente).

- [ ] **Step 1: `members/[uid]/page.tsx` — remover `sub_groups` do form e da UI manual**

Remover a linha `sub_groups: z.array(z.string()),` do `memberSchema` (o campo deixa de ser editado no form; continua existindo em `AppUser`, só não é mais input manual).

Remover o import `getGroups` (`import { getGroups } from '@/services/firebase/groups'`) e o estado `groups`/`setGroups`, já que não são mais necessários nesta tela. Adicionar import:

```ts
import { resolveAttributionGroupIds, MINISTRY_ATTRIBUTIONS } from '@/lib/ministry-attributions'
import { ChipMultiSelect } from '@/components/ui/chip-multi-select'
```

No `useEffect` de `loadData`, remover `getGroups()` do `Promise.all` (fica só `getUserById(uid)`) e remover `setGroups(groupsData)`. Remover `sub_groups: userData.sub_groups || [],` do objeto passado a `reset(...)`.

Remover a função `toggleGroup` (não é mais usada) e a função `toggleSecondaryAttribution` (será substituída pelo `ChipMultiSelect`, que já expõe `onChange`).

Atualizar `onSubmit`:

```ts
  const onSubmit = async (data: MemberFormData) => {
    setSaving(true)
    try {
      // Split data for profile and user document
      const { role, atribuicao_principal, atribuicoes_secundarias, ...profileFields } = data

      await updateUserProfile(uid, profileFields)

      const sub_groups = resolveAttributionGroupIds(atribuicao_principal, atribuicoes_secundarias)

      const userRef = doc(db, 'users', uid)
      await updateDoc(userRef, {
        role,
        sub_groups,
        atribuicao_principal: atribuicao_principal ?? null,
        atribuicoes_secundarias,
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
```

- [ ] **Step 2: Substituir a seção "Ministérios e Grupos" + o grid de "extras" pelo `ChipMultiSelect`**

Remover por completo o bloco JSX da seção "Ministérios e Grupos" (o `<div className="space-y-4 pt-4 border-t ...">` que itera `groups.map(...)`).

Substituir o bloco JSX da seção "Ministérios e grupos que participa (extras)" (adicionado numa etapa anterior, que itera `MINISTRY_ATTRIBUTIONS.filter(...).map(...)`) por:

```tsx
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
```

(`selectedAttribution`/`selectedSecondaryAttributions` já existem via `watch(...)` de uma etapa anterior — mantidos como estão.)

- [ ] **Step 3: `members/new/page.tsx` — mesma limpeza (sem calcular `sub_groups` no client)**

Remover a linha `sub_groups: z.array(z.string()),` do `memberSchema`.

Remover o import `getGroups` (`import { getGroups } from '@/services/firebase/groups'`), o estado `groups`/`setGroups`, o `useEffect(() => { getGroups().then(setGroups) }, [])`, `sub_groups: []` de `defaultValues`, e as funções `toggleGroup`/`toggleSecondaryAttribution`. Adicionar import:

```ts
import { MINISTRY_ATTRIBUTIONS } from '@/lib/ministry-attributions'
import { ChipMultiSelect } from '@/components/ui/chip-multi-select'
```

(Não importar `resolveAttributionGroupIds` aqui — o cálculo de `sub_groups` acontece só na API route, Step 4, para não duplicar a lógica em dois lugares.)

Remover o bloco JSX da seção "Ministérios e Grupos" (o `<div className="space-y-4 pt-4 border-t ...">` que itera `groups.map(...)`).

Substituir o bloco JSX da seção "Ministérios e grupos que participa (extras)" por:

```tsx
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
```

(`selectedAttribution`/`selectedSecondaryAttributions` já existem via `watch(...)` de uma etapa anterior.)

- [ ] **Step 4: `api/admin/users/route.ts` — calcular `sub_groups` a partir da atribuição**

Adicionar import: `import { resolveAttributionGroupIds } from '@/services/firebase/../lib/ministry-attributions'` — **atenção**: usar o path alias correto, `import { resolveAttributionGroupIds } from '@/lib/ministry-attributions';` (rota de API roda no server, o alias `@/` funciona normalmente em rotas Next.js).

Ajustar a desestruturação do body (já modificada numa etapa anterior) e o `userData`:

```ts
    const {
      email,
      password,
      role,
      atribuicao_principal,
      atribuicoes_secundarias,
      ...profileData
    } = await request.json();

    const sub_groups = resolveAttributionGroupIds(atribuicao_principal, atribuicoes_secundarias);

    // 1. Criar usuário no Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: profileData.full_name,
    });

    // 2. Criar documento do usuário no Firestore
    const userData = {
      email,
      role: role || 'member',
      sub_groups,
      atribuicao_principal: atribuicao_principal || null,
      atribuicoes_secundarias: atribuicoes_secundarias || [],
      profile: {
        ...profileData,
        avatar_url: profileData.avatar_url || null,
        is_profile_public: profileData.is_profile_public ?? true,
      },
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };
```

(Remove o antigo `sub_groups: sub_groups || [],` que vinha direto do body — agora é sempre derivado.)

- [ ] **Step 5: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: 0 erros.

Run: `npm run lint`
Expected: `0 errors`. Se aparecer `'getGroups' is defined but never used` ou similar, revisar se todos os imports/estados órfãos foram removidos nas Steps 1 e 3.

- [ ] **Step 6: Stage**

```bash
git add "src/app/(protected)/dashboard/members/[uid]/page.tsx" "src/app/(protected)/dashboard/members/new/page.tsx" "src/app/api/admin/users/route.ts"
```

---

### Task 5: Permissão `can_post_mural`

**Files:**
- Modify: `src/hooks/usePermissions.ts`
- Modify: `src/app/(protected)/dashboard/members/[uid]/page.tsx`
- Modify: `src/app/(protected)/dashboard/members/new/page.tsx`
- Modify: `src/app/api/admin/users/route.ts`

**Interfaces:**
- Consumes: `Switch` (`@/components/ui/switch`).
- Produces: `usePermissions().permissions.canPostTargetedFeed` agora também `true` quando `currentUser?.can_post_mural`.

- [ ] **Step 1: `usePermissions.ts`**

Substituir:

```ts
  const canManageUsers = isSecretary || isPastor;
  const canManageAgenda = isSecretary || isPastor;
  const canPostTargetedFeed = isSecretary || isPastor;
  const canViewMetrics = isSecretary || isPastor;
```

por:

```ts
  const canManageUsers = isSecretary || isPastor;
  const canManageAgenda = isSecretary || isPastor;
  const canPostTargetedFeed = isSecretary || isPastor || Boolean(currentUser?.can_post_mural);
  const canViewMetrics = isSecretary || isPastor;
```

- [ ] **Step 2: `members/[uid]/page.tsx` — `Switch` na aba Igreja**

Adicionar import: `import { Switch } from '@/components/ui/switch'`.

Adicionar `can_post_mural: z.boolean()` ao `memberSchema` e `can_post_mural: userData.can_post_mural ?? false` ao objeto de `reset(...)`.

No `onSubmit`, incluir `can_post_mural` no `updateDoc`:

```ts
      await updateDoc(userRef, {
        role,
        sub_groups,
        atribuicao_principal: atribuicao_principal ?? null,
        atribuicoes_secundarias,
        can_post_mural: role === 'secretary' || role === 'pastor' ? true : (data.can_post_mural ?? false),
        updated_at: Timestamp.now(),
      })
```

(ajustar a desestruturação de `data` no início de `onSubmit` para também extrair `can_post_mural` do `profileFields`, já que não é campo de `profile`.)

Na aba "Igreja", logo abaixo do grid com "Cargo principal"/"Permissão do Sistema"/datas, adicionar:

```tsx
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div>
                    <Label className="text-sm font-semibold">Pode postar/gerenciar no mural</Label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Já é automático para Secretaria/Pastor. Ative aqui para dar esse acesso a um membro específico.
                    </p>
                  </div>
                  <Switch
                    checked={watch('role') === 'secretary' || watch('role') === 'pastor' || watch('can_post_mural')}
                    disabled={watch('role') === 'secretary' || watch('role') === 'pastor'}
                    onCheckedChange={(checked) => setValue('can_post_mural', checked)}
                  />
                </div>
```

- [ ] **Step 3: `members/new/page.tsx` — mesmo `Switch`**

Adicionar import: `import { Switch } from '@/components/ui/switch'`.

Adicionar `can_post_mural: z.boolean()` ao `memberSchema` e `can_post_mural: false` a `defaultValues`.

Na aba "Igreja", logo abaixo do grid com "Cargo principal"/"Permissão do Sistema"/datas, adicionar:

```tsx
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
                      watch('role') === 'secretary' ||
                      watch('role') === 'pastor' ||
                      watch('can_post_mural')
                    }
                    disabled={watch('role') === 'secretary' || watch('role') === 'pastor'}
                    onCheckedChange={(checked) => setValue('can_post_mural', checked)}
                  />
                </div>
```

(`data.can_post_mural` já vai junto no `POST /api/admin/users` porque essa página envia o objeto `data` inteiro — não precisa desestruturar nada extra aqui, diferente de `members/[uid]/page.tsx`.)

- [ ] **Step 4: `api/admin/users/route.ts` — aceitar `can_post_mural`**

Adicionar `can_post_mural` à desestruturação do body (junto de `atribuicao_principal`/`atribuicoes_secundarias`) e ao `userData`:

```ts
      can_post_mural: role === 'secretary' || role === 'pastor' ? true : Boolean(can_post_mural),
```

- [ ] **Step 5: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: 0 erros.

Run: `npm run lint`
Expected: `0 errors`.

- [ ] **Step 6: Stage**

```bash
git add src/hooks/usePermissions.ts "src/app/(protected)/dashboard/members/[uid]/page.tsx" "src/app/(protected)/dashboard/members/new/page.tsx" "src/app/api/admin/users/route.ts"
```

---

### Task 6: `CreatePostModal.tsx` — Alcance multi-grupo

**Files:**
- Modify: `src/app/(protected)/dashboard/mural/components/CreatePostModal.tsx`

**Interfaces:**
- Consumes: `ChipMultiSelect`/`ChipMultiSelectOption` (Task 3), `getGroups` (já existente).

- [ ] **Step 1: Trocar `type`/`target_group` por `target_groups: string[]` no schema**

Substituir:

```ts
const postSchema = z
  .object({
    title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres'),
    content: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres'),
    type: z.enum(['Geral', 'Grupo']),
    target_group: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.type === 'Grupo' && !data.target_group) {
        return false
      }
      return true
    },
    {
      message: 'Selecione um grupo para este aviso',
      path: ['target_group'],
    },
  )
```

por:

```ts
const postSchema = z.object({
  title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres'),
  content: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres'),
  target_groups: z.array(z.string()),
})
```

- [ ] **Step 2: Ajustar `useForm`, `useEffect` e `onSubmit`**

Substituir:

```ts
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      type: 'Geral',
      target_group: '',
    },
  })

  const postType = watch('type')
```

por:

```ts
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      target_groups: [],
    },
  })

  const selectedGroups = watch('target_groups')
```

Em `onSubmit`, substituir `target_groups: data.type === 'Grupo' && data.target_group ? [data.target_group] : [],` por `target_groups: data.target_groups,`.

- [ ] **Step 3: Substituir o bloco "Type & Group Selection" pelo `ChipMultiSelect`**

Substituir todo o `<div className="grid gap-4 sm:grid-cols-2">...</div>` (o bloco com "Tipo de Alcance" e "Vínculo de Grupo") por:

```tsx
              {/* Alcance */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-500" />
                  Alcance (Grupos)
                </label>
                <ChipMultiSelect
                  title="Alcance do Aviso"
                  triggerLabel="Geral (todos) + grupos"
                  emptyMessage="Nenhum grupo cadastrado nas configurações."
                  options={groups.map((group) => ({ id: group.name, label: group.name }))}
                  selected={selectedGroups || []}
                  onChange={(next) =>
                    setValue('target_groups', next as PostFormValues['target_groups'])
                  }
                />
                <p className="text-[10px] text-slate-500">
                  Nenhum grupo selecionado = aviso Geral (visível a todos).
                </p>
              </div>
```

Adicionar import: `import { ChipMultiSelect } from '@/components/ui/chip-multi-select'`.

(Mantém `target_groups` armazenando o **nome** do grupo, igual ao comportamento atual do código — `mural/page.tsx` já compara `target_groups` com `sub_groups` por nome/id misturado hoje; ver Task 7 para a consistência final do filtro.)

- [ ] **Step 4: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: 0 erros.

Run: `npm run lint`
Expected: `0 errors`.

- [ ] **Step 5: Stage**

```bash
git add "src/app/(protected)/dashboard/mural/components/CreatePostModal.tsx"
```

---

### Task 7: `mural/page.tsx` — filtro em `ChipMultiSelect` (Geral + grupos do usuário)

**Files:**
- Modify: `src/app/(protected)/dashboard/mural/page.tsx`

**Interfaces:**
- Consumes: `ChipMultiSelect`/`ChipMultiSelectOption` (Task 3), `getGroups` (`@/services/firebase/groups`).

- [ ] **Step 1: Buscar os grupos do usuário e trocar o estado de filtro**

Adicionar imports: `import { getGroups } from '@/services/firebase/groups'`, `import { ChipMultiSelect } from '@/components/ui/chip-multi-select'`, `import { ChurchGroup } from '@/types'`.

Substituir `const [filter, setFilter] = useState<'all' | 'general' | 'groups'>('all')` por:

```ts
  const [myGroups, setMyGroups] = useState<ChurchGroup[]>([])
  const [activeFilters, setActiveFilters] = useState<string[]>([])
```

Adicionar um `useEffect` para carregar os grupos do usuário (roda quando `currentUser` estiver disponível):

```ts
  useEffect(() => {
    if (!currentUser?.sub_groups?.length) {
      setMyGroups([])
      return
    }
    getGroups().then((all) =>
      setMyGroups(all.filter((g) => currentUser.sub_groups.includes(g.id))),
    )
  }, [currentUser?.sub_groups])
```

- [ ] **Step 2: Ajustar a lógica de filtragem**

Substituir o bloco `filteredPosts`:

```ts
  const filteredPosts = posts.filter((post) => {
    const isGeral = post.target_groups.length === 0
    const isFromMyGroup =
      currentUser &&
      post.target_groups.some((groupName) => myGroups.some((g) => g.name === groupName))

    if (activeFilters.length === 0) {
      // Default: geral + grupos que participa
      return isGeral || isFromMyGroup || post.author.uid === currentUser?.uid
    }

    const wantsGeneral = activeFilters.includes('__general__')
    const wantsGroupNames = activeFilters
      .filter((f) => f !== '__general__')
      .map((id) => myGroups.find((g) => g.id === id)?.name)
      .filter((name): name is string => Boolean(name))

    return (
      (wantsGeneral && isGeral) ||
      post.target_groups.some((groupName) => wantsGroupNames.includes(groupName))
    )
  })
```

- [ ] **Step 3: Trocar as 3 abas pelo botão de filtro + rótulo do filtro ativo**

Substituir todo o bloco `<div className="flex items-center gap-4 border-b ...">...</div>` (as 3 abas Todos/Geral/Meus Grupos) por:

```tsx
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
        <ChipMultiSelect
          title="Filtrar Feed"
          triggerLabel="Filtrar"
          options={[
            { id: '__general__', label: 'Geral' },
            ...myGroups.map((g) => ({ id: g.id, label: g.name })),
          ]}
          selected={activeFilters}
          onChange={setActiveFilters}
        />
        <p className="text-xs font-medium text-slate-500">
          {activeFilters.length === 0
            ? 'Mostrando: Geral + grupos que você participa'
            : `Filtro ativo: ${activeFilters
                .map((id) =>
                  id === '__general__' ? 'Geral' : myGroups.find((g) => g.id === id)?.name,
                )
                .filter(Boolean)
                .join(', ')}`}
        </p>
      </div>
```

Remover o uso de `permissions.canViewGroupFeed` que só controlava a aba "Meus Grupos" (não é mais necessário aqui — o `ChipMultiSelect` já lista só os grupos que o usuário participa, vazio se `myGroups` for vazio).

- [ ] **Step 4: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: 0 erros.

Run: `npm run lint`
Expected: `0 errors`.

- [ ] **Step 5: Stage**

```bash
git add "src/app/(protected)/dashboard/mural/page.tsx"
```

---

## Self-Review Notes (preenchido ao escrever o plano)

- **Cobertura da spec**: grupos fixos + slug (Task 1-2), proteção contra exclusão (Task 2), `ChipMultiSelect` reutilizável (Task 3, usado em 4 lugares: Tasks 4, 6, 7), sincronização `sub_groups` (Task 4), `can_post_mural` (Task 5), Alcance multi-grupo (Task 6), filtro do mural (Task 7). Todos os itens de "Design alvo" de `specs/mural-grupos.md` têm task correspondente.
- **Consistência de tipos**: `resolveAttributionGroupIds`, `ChipMultiSelectOption`, `seedFixedGroups` usam a mesma assinatura em todo lugar onde são chamados (conferido Task 1 → Task 2/4/6/7).
- **Fora de escopo (deliberado, ver spec)**: moderação "líder de grupo modera só o próprio grupo" (`ChurchGroup.leader_uid` continua sem uso), `firestore.rules`.
