# Área Kids — entrega 1: cadastro de crianças — design

**Data:** 2026-10-14
**Status:** aguardando revisão
**Módulo:** Área Kids (novo). Esta é a **entrega 1 de 3**:

1. **Cadastro** (esta spec): cadastro oficial das crianças, prontuário (anamnese), responsáveis, visão da secretaria/pastor.
2. **Sala** (spec futura): módulo Kids no menu, status aberta/fechada, tias servindo, QR do responsável, entrada/saída, sala por idade, cadastro rápido de visitante.
3. **Depois:** chamar o responsável (notificação), diário (lanche/atividades), relatórios.

## Objetivo

Os pais cadastram, com calma e pelo próprio app, as crianças sob sua responsabilidade e o prontuário de cada uma (alergias, restrições alimentares, saúde, cuidados). A secretaria e o pastor passam a ter o registro oficial das crianças da Hebrom, com contagem por faixa de idade e acesso rápido ao telefone dos responsáveis.

**Sucesso:** um pai cadastra o filho com foto, data de nascimento e alergia a amendoim em menos de 2 minutos e vincula a mãe pelo e-mail dela. A mãe vê a criança no próprio perfil. A secretaria abre Membros → Kids, filtra "Com alertas", encontra a criança e liga para o pai com um toque.

## Decisões tomadas

- Crianças **não têm login**: são registros mantidos pelos responsáveis.
- Coleção própria `kids_children` (cadastro oficial da igreja), separada de `users`.
- Uma criança pode ter **de 1 a 4 responsáveis com conta** (`guardian_uids`); todos editam. O vínculo é feito pelo **e-mail da conta** do outro responsável (1 leitura), não por lista de membros.
- Anamnese em **chips fixos no código** (como as atribuições), alguns com campo "qual?". Marcar um chip significa sempre uma restrição/condição.
- Salas fixas no código: **Berçário 0–2, Kids 3–7, Juniores 8–12**. A sala é só sugerida (exibida) nesta entrega; a escolha acontece na entrada (entrega 2).
- Visibilidade por papel (tabela em "Privacidade").
- A seção aparece no perfil para **qualquer usuário logado**, inclusive visitantes.

## Fora do escopo (desta entrega)

- Módulo Kids no menu, QR, sala, entrada/saída, tias servindo, cadastro rápido de visitante (entrega 2).
- Notificação ao responsável, diário, relatórios (entrega 3).
- Pessoas autorizadas a buscar sem conta no app.
- Secretaria/pastor editando o cadastro de uma criança.
- Avisar os outros responsáveis quando uma criança é removida.
- Salas e itens de anamnese configuráveis pelo app.

## Dados

Documento `kids_children/{childId}` (id gerado pelo Firestore):

```ts
interface KidChild {
  id: string
  name: string               // trim, 1–80 caracteres
  birth_date: string         // 'YYYY-MM-DD'
  photo_url?: string         // Storage: kids/{childId}.jpg
  guardian_uids: string[]    // 1–4, sem repetição
  health: KidHealth          // só itens marcados (ver abaixo)
  photo_consent: boolean
  notes?: string             // trim, até 1.000 caracteres; ausente = sem observação
  is_visitor: boolean        // sempre false nesta entrega (o cadastro rápido da entrega 2 grava true)
  created_by: string         // uid
  created_at: Timestamp      // serverTimestamp()
  updated_at?: Timestamp     // serverTimestamp() ao editar
}

/** Chave = id do item da anamnese. `true` para itens simples; texto para itens com "qual?". */
type KidHealth = Partial<Record<KidHealthItemId, true | string>>
```

O Firestore recusa `undefined`: item desmarcado **não tem chave** em `health`; `notes`/`photo_url` vazios **não têm chave**; `updated_at` ausente até a primeira edição.

### Anamnese (fixa em `src/lib/kids/health.ts`)

| Grupo | id | Rótulo | Alerta | "Qual?" |
|---|---|---|---|---|
| Alimentação | `food_allergy` | Alergia alimentar | ⚠️ | sim |
| Alimentação | `lactose` | Intolerância à lactose | | |
| Alimentação | `gluten` | Intolerância ao glúten | | |
| Alimentação | `no_sugar` | Não pode açúcar | | |
| Alimentação | `vegetarian` | Vegetariana | | |
| Alimentação | `no_church_snack` | Não pode comer o lanche da igreja | | |
| Saúde | `asthma` | Asma/bronquite | ⚠️ | |
| Saúde | `epilepsy` | Epilepsia/convulsão | ⚠️ | |
| Saúde | `diabetes` | Diabetes | ⚠️ | |
| Saúde | `drug_allergy` | Alergia a medicamento | ⚠️ | sim |
| Saúde | `continuous_medication` | Medicação contínua | | sim |
| Saúde | `insect_allergy` | Alergia a picada de inseto | | |
| Cuidados | `autism` | TEA (autismo) | | |
| Cuidados | `adhd` | TDAH | | |
| Cuidados | `special_needs` | Necessidade especial/mobilidade | | |
| Cuidados | `diapers` | Usa fralda | | |
| Cuidados | `bathroom_help` | Precisa de ajuda no banheiro | | |
| Cuidados | `separation_anxiety` | Fica ansiosa longe dos pais | | |

"Pode ser fotografada (redes da igreja)" fica no grupo **Autorizações** da UI, mas é gravado em `photo_consent` (booleano explícito, não um item de `health`). O texto de "qual?" tem até 120 caracteres.

### Salas (fixas em `src/lib/kids/rooms.ts`)

| id | Rótulo | Idade (anos completos) |
|---|---|---|
| `bercario` | Berçário | 0–2 |
| `kids` | Kids | 3–7 |
| `juniores` | Juniores | 8–12 |
| — | Fora das faixas | 13+ |

### Limites

- Nome: 1–80 caracteres. Observações: até 1.000. "Qual?": 1–120.
- Responsáveis: 1–4.
- Data de nascimento: não pode ser futura nem ter mais de 18 anos.

## Privacidade — regras do Firestore e do Storage

As regras não estão versionadas neste repositório (ver `AGENTS.md`). Precisam ser aplicadas no console para a privacidade valer no servidor. "Equipe Kids" = usuário com `Ministério Kids e Juniores` ou `Líder Kids` em `atribuicao_principal` ou `atribuicoes_secundarias`.

| Quem | Lê | Cria/edita | Remove |
|---|---|---|---|
| Responsável (uid em `guardian_uids`) | as próprias crianças | sim (ao criar, precisa estar em `guardian_uids` e ser `created_by`) | sim |
| Equipe Kids | todas | não | não |
| Secretaria e pastor | todas | não | não |
| Outros | nada | não | não |

```
function userDoc() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
function isStaffRole() { return userDoc().role in ['secretary', 'pastor']; }
function isKidsTeam() {
  let kids = ['Ministério Kids e Juniores', 'Líder Kids'];
  return userDoc().get('atribuicao_principal', '') in kids
    || userDoc().get('atribuicoes_secundarias', []).hasAny(kids);
}

match /kids_children/{childId} {
  allow read: if request.auth != null && (
    request.auth.uid in resource.data.guardian_uids || isKidsTeam() || isStaffRole());
  allow create: if request.auth != null
    && request.auth.uid in request.resource.data.guardian_uids
    && request.resource.data.created_by == request.auth.uid
    && request.resource.data.guardian_uids.size() >= 1
    && request.resource.data.guardian_uids.size() <= 4;
  allow update: if request.auth != null
    && request.auth.uid in resource.data.guardian_uids
    && request.resource.data.guardian_uids.size() >= 1
    && request.resource.data.guardian_uids.size() <= 4
    && request.resource.data.created_by == resource.data.created_by;
  allow delete: if request.auth != null && request.auth.uid in resource.data.guardian_uids;
}
```

Storage `kids/{childId}.jpg`: leitura para usuários autenticados (a URL só circula entre quem lê o documento); escrita para usuários autenticados com limite de 2 MB e `image/*`. (Validar o responsável no Storage exigiria ler o Firestore; o risco aceito é alguém autenticado sobrescrever uma foto conhecendo o id.)

A consulta "Meus filhos" precisa filtrar por `guardian_uids array-contains uid` para a regra de leitura passar. Busca por e-mail em `users` usa `where('email', '==', email)` e depende de a regra de `users` permitir leitura a usuários autenticados (as regras não estão no repositório; conferir no console antes de liberar).

## Perfil — "Crianças sob minha responsabilidade"

Em `/dashboard/profile`, novo bloco logo abaixo de **Dados Ministeriais**, mesmo estilo de card (ícone `Baby`, âmbar).

- Card por criança: foto redonda (ou inicial), nome, idade ("8 meses", "4 anos"), sala sugerida e selo vermelho "⚠️ N alertas" se houver itens de alerta.
- Card tracejado "+ Adicionar criança" no fim. Sem crianças: só ele e a frase "A equipe Kids usa estas informações para cuidar do seu filho durante o culto."
- Carregamento: uma consulta `guardian_uids array-contains uid` ao abrir o perfil (store com cache por sessão; ver `firestore-cache`).

### Modal da criança (`KidFormModal`)

`Dialog` com `variant="sheet"`; botões no padrão (ação principal âmbar primeiro, Cancelar ghost).

1. **Foto**: tocar escolhe imagem → `ImageCropper` (quadrado) → envio por `uploadFile('kids/{childId}.jpg', blob)`.
2. **Nome** e **data de nascimento** (`Input type="date"`). Abaixo, texto: "4 anos · sala Kids".
3. **Anamnese** em chips agrupados (Alimentação, Saúde, Cuidados, Autorizações). Item com "qual?" abre campo curto obrigatório ao ser marcado. Item de alerta tem pontinho vermelho no chip.
4. **Observações**: `Textarea` com contador `n/1000`.
5. **Responsáveis**: o usuário (fixo no topo) e os demais (foto + nome). "+ Adicionar responsável" abre campo de e-mail → busca a conta → mostra "Maria Souza — confirmar?" → adiciona. Remover outro responsável: botão "×" no item. O usuário não pode se remover se for o único.
6. **Rodapé**: **Salvar** e **Cancelar**. Na edição, **Remover criança** (ghost vermelho) com confirmação via `useMessages().confirm({ destructive: true })`: *"O cadastro e o prontuário de {nome} serão apagados."*

Criar: grava o documento (id novo), depois envia a foto e grava `photo_url`. Editar: grava os campos alterados com `updated_at`. Remover: apaga o documento e a foto (falha ao apagar a foto não bloqueia).

## Painel — secretaria e pastor

### Membros → aba Kids (`/dashboard/members`)

- Seletor **Membros | Kids** no topo (estilo das abas âmbar do `PalavraTabs`). "Membros" fica como hoje.
- **Kids**: busca por nome da criança ou do responsável; chips **Todas · Berçário · Kids · Juniores · Com alertas**.
- Card: foto, nome, idade, sala, selo de alertas, "Responsáveis: João e Maria Souza".
- Tocar abre a **ficha em modo leitura** (`KidDetailModal`, sheet): foto, dados, alertas em vermelho no topo, anamnese completa, observações, consentimento de foto e responsáveis. Cada responsável mostra link para o perfil de membro e telefone com botões **Ligar** (`tel:`) e **WhatsApp** (`https://wa.me/55…`). Responsável sem conta encontrada: "Responsável removido".
- Visível só para secretaria e pastor (quem já acessa Membros).

### Dashboard (`/dashboard`)

- Novo `StatCard` **"Crianças cadastradas"** ao lado de "Total de Membros": total e linha "12 berçário · 30 kids · 18 juniores". Tocar leva a Membros → Kids.
- Visível para quem já vê os números do dashboard (`canViewDashboardOverview`).

### Dados do painel

`useKidsStore`: listener único de `kids_children` (`onSnapshot`), ligado na primeira abertura da aba Kids ou do Dashboard, vivo durante a sessão (mesmo padrão do `useMembersStore`). Nomes e telefones dos responsáveis vêm do `useMembersStore`.

## Código

### `src/lib/kids/` (novo, puro, sem Firebase/React; imports relativos `.ts`)

| Arquivo / função | Responsabilidade |
|---|---|
| `health.ts` — `HEALTH_ITEMS`, `HEALTH_GROUPS`, `KidHealthItemId` | catálogo da anamnese |
| `health.ts` — `alertsOf(health)` | itens de alerta marcados, na ordem do catálogo |
| `health.ts` — `cleanHealth(form)` | remove desmarcados e textos vazios; apara textos; sem `undefined` |
| `rooms.ts` — `ROOMS`, `suggestRoom(birthDate, today)` | sala pela idade, ou `null` (fora das faixas) |
| `age.ts` — `ageOf(birthDate, today)` | `{ years, months }` |
| `age.ts` — `formatAge(birthDate, today)` | "8 meses", "1 ano", "4 anos" |
| `validate.ts` — `validateChild(form, today)` | erros por campo: nome, data, "qual?" vazio, responsáveis |
| `stats.ts` — `countByRoom(children, today)` | `{ bercario, kids, juniores, outside, total }` |

`today` é parâmetro (string `YYYY-MM-DD`), para os testes não dependerem do relógio.

### Demais arquivos

| Arquivo | Situação |
|---|---|
| `src/types/index.ts` | `KidChild` (com `Timestamp`) |
| `src/services/firebase/kids.ts` | `getMyChildren(uid)`, `subscribeToChildren(cb, onError)`, `createChild`, `updateChild`, `deleteChild`, `findUserByEmail(email)` |
| `src/store/useMyChildren.ts` | crianças do usuário (carrega uma vez por uid) |
| `src/store/useKidsStore.ts` | listener do painel |
| `src/app/(protected)/dashboard/profile/components/MyChildrenSection.tsx` | seção do perfil |
| `src/components/kids/KidFormModal.tsx` | modal de cadastro/edição |
| `src/components/kids/KidDetailModal.tsx` | ficha em leitura |
| `src/components/kids/KidAvatar.tsx` | foto ou inicial |
| `src/app/(protected)/dashboard/members/components/KidsTab.tsx` | aba Kids |
| `src/app/(protected)/dashboard/members/page.tsx` | seletor Membros/Kids |
| `src/app/(protected)/dashboard/page.tsx` | `StatCard` de crianças |
| `package.json` | script `test:kids` |

## Erros e casos de borda

| Situação | Comportamento |
|---|---|
| E-mail não encontrado | "Nenhuma conta com este e-mail. Peça para a pessoa criar a conta no app primeiro." |
| E-mail próprio ou já vinculado | "Esta pessoa já é responsável." |
| 4 responsáveis | botão desabilitado: "Máximo de 4 responsáveis." |
| Único responsável tentando se remover | opção escondida |
| Data futura ou > 18 anos | "Data de nascimento inválida." |
| 13–17 anos | aceita; sala "Fora das faixas" |
| "Qual?" vazio com item marcado | salvar bloqueado; campo em vermelho: "Informe qual." |
| Falha de rede ao salvar | toast "Não foi possível salvar. Verifique sua conexão."; modal mantém o que foi digitado |
| Falha no envio da foto | criança salva sem foto; toast "Foto não enviada, tente de novo." |
| Responsável excluído | uid órfão; ficha mostra "Responsável removido" |
| Documento corrompido (campos faltando) | descartado na leitura sem quebrar a tela |

## Testes

`src/lib/kids/*.test.ts`, rodados por `npm run test:kids` (`node --test`):

- `ageOf`/`formatAge`: recém-nascido, 8 meses, 1 ano, 4 anos, véspera e dia do aniversário, 29/02.
- `suggestRoom`: 0, 2, 3, 7, 8, 12, 13 anos; fronteiras no dia do aniversário.
- `alertsOf`: só itens de alerta, na ordem do catálogo; vazio sem alertas.
- `cleanHealth`: remove desmarcados, textos vazios/só espaços; apara; nenhum valor `undefined`.
- `validateChild`: nome vazio/longo, data futura, > 18 anos, "qual?" vazio, 0 e 5 responsáveis, notas > 1.000.
- `countByRoom`: contagem por sala e total.

UI verificada com `npx tsc --noEmit` e `npm run lint`; teste manual no aparelho pelo usuário.
