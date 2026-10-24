# Área Kids — entrega 2: a sala — design

**Data:** 2026-10-14
**Status:** aguardando revisão
**Módulo:** Área Kids. Entrega **2 de 3**. Depende da entrega 1 (`2026-10-14-kids-cadastro-design.md`: `kids_children`, anamnese, `src/lib/kids/*`, `KidDetailModal`).

## Objetivo

No culto, a equipe Kids abre a Área Kids, marca quem está servindo e registra a entrada e a saída de cada criança lendo o QR do responsável no celular. Todos os membros veem se a Área Kids está aberta e quem está servindo; cada pai acompanha, em tempo real, se o filho está na sala.

**Sucesso:** a tia abre a Área Kids, toca "Entrada", lê o QR do pai, marca os dois filhos (salas sugeridas pela idade) e confirma em menos de 10 segundos. O pai vê no celular "Na sala Kids desde 18:05 · deixado por você". Na saída, a tia lê o QR da mãe e as duas crianças saem da lista. Uma família visitante cria a conta na hora e a criança entra com cadastro rápido.

## Decisões tomadas

- Sessão **sem nome**: "Abrir Área Kids" / "Encerrar", com quem e quando. Uma sessão aberta por vez.
- **"Estou servindo"**: quem abre entra na lista; as outras tias marcam. **Só quem está servindo** registra entradas e saídas.
- **Toda criança está ligada a pelo menos um adulto com conta.** Adulto sem conta cria **conta de visitante na hora**.
- Entrada pelo **QR do responsável**; "deixado por" vem do dono do QR (editável). Saída **pelo QR** de quem busca **ou manual** (responsável cadastrado ou "Outra pessoa" com nome digitado).
- **Cadastro rápido de visitante** dentro da Entrada, ligado ao adulto escaneado; a criança **fica cadastrada** (`is_visitor: true`).
- O **pai vê o status de cada filho** em tempo real.
- QR com **código aleatório conferido no Firestore** (`HKIDS1:{uid}:{token}`), trocável. Sem rota de servidor.
- Bibliotecas novas: **`qrcode.react`** (exibir) e **`qr-scanner`** (ler; funciona no Safari/iOS e PWA). `BarcodeDetector` descartado (inexistente no iOS).
- Salas fixas da entrega 1: Berçário 0–2, Kids 3–7, Juniores 8–12.

## Fora do escopo (entrega 3 ou depois)

- Notificação ao responsável, diário (lanche/atividades), histórico e relatórios.
- QR assinado no servidor (depende de rota com verificação de sessão).
- Unir cadastros duplicados de visitante.
- Pessoas autorizadas a buscar sem conta (fora o registro manual "Outra pessoa").
- Escala de serviço montada pelo líder.

## Dados

### `kids_qr/{uid}`

```ts
{ token: string /* 24 chars base64url */, updated_at: Timestamp }
```

Criado na primeira abertura de "Meu QR"; "Gerar novo QR" troca o `token`. Conteúdo do QR: `HKIDS1:{uid}:{token}`.

### `kids_meta/current`

```ts
{ session_id: string | null }
```

Ponteiro da sessão aberta. Abrir e encerrar acontecem em transação sobre este documento (duas tias abrindo ao mesmo tempo → uma sessão só; a segunda entra nela).

### `kids_sessions/{sessionId}` (status público)

```ts
{
  status: 'open' | 'closed'
  opened_at: Timestamp; opened_by: Person
  closed_at?: Timestamp; closed_by?: Person
  staff: StaffMember[]        // { uid, name, avatar_url | null } — tias servindo
  staff_uids: string[]        // espelho de staff, para a regra
}
type Person = { uid: string; name: string }
```

### `kids_sessions/{sessionId}/attendance/{childId}` (restrito)

Id do documento = id da criança: no máximo uma passagem ativa por criança por sessão, garantida por transação.

```ts
{
  child_id: string; child_name: string; child_photo_url?: string; birth_date: string
  room: 'bercario' | 'kids' | 'juniores' | 'outside'
  guardian_uids: string[]     // cópia no momento da entrada (leitura do pai)
  is_visitor: boolean
  status: 'in' | 'out' | 'no_checkout'
  dropped_by: Person
  checked_in_at: Timestamp; checked_in_by: Person; checkin_via: 'qr' | 'manual'
  checked_out_at?: Timestamp; checked_out_by?: Person; checkout_via?: 'qr' | 'manual'
  picked_by?: { uid?: string; name: string }   // uid ausente = "Outra pessoa"
  previous_passes?: PreviousPass[]  // saiu e voltou no mesmo culto
}
type PreviousPass = {
  room: string; dropped_by: Person; checked_in_at: Timestamp
  checked_out_at: Timestamp | null; picked_by: { uid?: string; name: string } | null
}
```

Sem chaves `undefined` (o Firestore recusa). `previous_passes` usa `Timestamp.now()` (dentro de array).

### `kids_children` (mudança na entrega 1)

- A equipe Kids pode **criar** crianças com `is_visitor: true` e `guardian_uids` com pelo menos 1 uid (o app só oferece isso dentro da Entrada, para quem está servindo; a regra não exige o serviço porque `kids_children` não pertence a uma sessão).
- `is_visitor` não é alterado ao editar pelo perfil (fica como marca de "cadastro rápido").

## Privacidade — regras (console)

Reaproveita `isKidsTeam()` e `isStaffRole()` da entrega 1.

```
function session(id) { return get(/databases/$(database)/documents/kids_sessions/$(id)).data; }
function isServing(id) { return request.auth.uid in session(id).staff_uids && session(id).status == 'open'; }

match /kids_qr/{uid} {
  allow read: if request.auth != null && (request.auth.uid == uid || isKidsTeam());
  allow write: if request.auth != null && request.auth.uid == uid;
}
match /kids_meta/current {
  allow read: if request.auth != null;
  allow write: if request.auth != null && isKidsTeam();
}
match /kids_sessions/{sessionId} {
  allow read: if request.auth != null;
  allow create, update: if request.auth != null && isKidsTeam();
  match /attendance/{childId} {
    allow read: if request.auth != null && (isKidsTeam() || isStaffRole()
      || request.auth.uid in resource.data.guardian_uids);
    allow create, update: if request.auth != null && isKidsTeam() && isServing(sessionId);
  }
}
// em kids_children (acrescentar ao create da entrega 1):
//   || (isKidsTeam() && request.resource.data.is_visitor == true
//       && request.resource.data.guardian_uids.size() >= 1)
```

Encerrar a sessão atualiza as passagens `in` antes de marcar `status: 'closed'` (a regra de `attendance` exige sessão aberta).

## Telas

### Menu

- Sidebar: item **"Kids"** (`Baby`), rota `/dashboard/kids` (`ROUTES.AUTHENTICATED.KIDS`), para todos os papéis.
- Barra inferior do **visitante** (que não tem o menu ☰): acrescenta "Kids" (fica `mural, dailyWord, kids, agenda, settings`).

### `/dashboard/kids` — todos

1. **Status** em tempo real: 🟢 "Aberta desde 18:02" + fotos/nomes das tias servindo, ou ⚪ "Fechada no momento". Sessão aberta há mais de 12 h aparece como "Fechada" para quem não é da equipe.
2. **Abas "Meu QR | Sala"** só para a equipe Kids; para os demais, só o conteúdo abaixo.
3. **Meu QR**: QR grande em cartão branco (alto contraste), nome do usuário, "Mostre este código para a equipe da Área Kids", botão secundário **"Gerar novo QR"** com confirmação *"O QR atual deixará de funcionar."*
4. **Meus filhos** (tempo real): foto, nome e etiqueta — 🟢 "Na sala Kids desde 18:05 · deixado por você"/"por Maria", ✅ "Retirado às 20:10 por Maria", ou "Fora da sala". Link "Editar cadastros" → perfil.
5. Sem filhos: "Cadastre seus filhos no perfil para agilizar a entrada" (botão para o perfil); para visitante, também "Se for a primeira vez, a equipe pode cadastrar a criança na hora."

### Aba Sala — equipe Kids

- **Fechada**: botão âmbar grande **"Abrir Área Kids"** (quem abre entra servindo).
- **Aberta há mais de 12 h**: aviso *"A Área Kids está aberta desde {dia} {hora}. Encerrar?"* com o botão Encerrar.
- **Aberta**: "Aberta desde 18:02", contagem por sala ("Berçário 4 · Kids 12 · Juniores 6"), **"Estou servindo"/"Sair do serviço"**, **"Encerrar"** (ghost vermelho, confirmação: *"{n} crianças ainda estão na sala e ficarão como saída não registrada."*; sem crianças: *"Encerrar a Área Kids?"*).
- Quem não está servindo: lista em leitura, aviso *"Toque em Estou servindo para registrar entradas e saídas."*, Entrada/Saída desabilitados.
- Botões grandes **Entrada** e **Saída**; botão pequeno **"QR para criar conta"** (QR com a URL de login do app).
- **Lista**: chips Todas · Berçário · Kids · Juniores; card com foto, nome, **alertas por extenso em vermelho** ("Alergia alimentar: amendoim"), "Entrou 18:05 · deixado por João". Toque → `KidDetailModal` (entrega 1) com **"Registrar saída"** e **chips de sala** (trocar sala). Seção recolhida **"Já saíram (n)"** com hora e quem buscou.

### Entrada (sheet)

1. Câmera (`qr-scanner`). QR lido → confere `kids_qr/{uid}` → mostra o adulto (foto, nome).
2. Crianças do adulto (do `useKidsStore`, `guardian_uids` contém o uid): seletor + chips de sala (sugerida marcada). Já na sala: desabilitada, "Já está na sala".
3. **"Deixado por"**: o adulto escaneado (padrão) ou outro responsável das crianças marcadas.
4. **"+ Criança sem cadastro"** (abaixo).
5. **"Registrar entrada (n)"**.
- **"Buscar pelo nome"** (sem câmera): busca no cadastro → escolhe "deixado por" entre os responsáveis da criança → registra com `checkin_via: 'manual'`.

### Criança sem cadastro (dentro da Entrada)

Formulário curto: **nome** e **data de nascimento** (obrigatórios; mostra a sala sugerida), chips só de **alertas** (`food_allergy` com "qual?", `asthma`, `epilepsy`, `diabetes`, `drug_allergy` com "qual?") e `no_church_snack`, **observação** opcional. Sem foto e sem autorização de imagem. Salvar cria `kids_children` (`is_visitor: true`, `guardian_uids: [adulto]`, `created_by: tia`) e a criança aparece marcada na lista da entrada.

No perfil do adulto, a criança aparece com a etiqueta *"Cadastro rápido da equipe Kids — complete o prontuário"*. Em Membros → Kids, etiqueta **"Visitante"** e chip de filtro **"Visitantes"**.

### Saída

- **Pelo QR**: lê o QR de quem busca → crianças dele com status `in`, já marcadas → confirma. Nenhuma: *"Nenhuma criança deste responsável está na sala."*
- **Manual**: card → "Registrar saída" → "Quem buscou": um dos responsáveis ou **"Outra pessoa"** (nome obrigatório; aviso *"Confirme a identidade de quem está buscando."*).

## Erros e casos de borda

| Situação | Comportamento |
|---|---|
| QR de fora do app | *"QR não reconhecido."* (câmera continua) |
| Token diferente do salvo | *"Este QR foi substituído. Peça para a pessoa abrir o QR atual no app."* |
| `kids_qr/{uid}` inexistente | mesma mensagem de QR substituído |
| Adulto sem crianças | só "+ Criança sem cadastro" |
| Criança já na sala | desabilitada, "Já está na sala" |
| Duas tias registrando a mesma criança | transação no doc `attendance/{childId}`; a segunda vê *"{nome} já foi registrado por {tia} às {hora}."* |
| Saiu e voltou no mesmo culto | a passagem volta para `in`; a anterior vai para `previous_passes` |
| Sessão encerrada por outra tia durante o registro | *"A Área Kids foi encerrada."* |
| Tia não servindo | botões desabilitados; a regra recusa gravações |
| Câmera negada/indisponível | instruções para liberar + atalho "Buscar pelo nome" |
| Sem internet | *"Sem conexão. Tente de novo."*; o sheet mantém a seleção |
| Sessão aberta há mais de 12 h | membros veem "Fechada"; equipe vê o aviso para encerrar |
| Cadastro removido com a criança na sala | a passagem mantém nome/foto copiados |

## Código

### `src/lib/kids/` (puro, testado)

| Arquivo / função | Responsabilidade |
|---|---|
| `qr.ts` — `buildQrPayload(uid, token)`, `parseQrPayload(text)`, `newToken(bytes)` | formato do QR; `parse` devolve `{ uid, token }` ou `null`; `newToken` recebe os bytes aleatórios (testável) |
| `session.ts` — `SESSION_STALE_MS`, `isSessionStale(openedAtMs, nowMs)`, `roomCounts(passes)`, `passLabel(pass, viewerUid, formatTime)`, `passesToClose(passes)` | regras da sessão e textos de status |
| `checkin.ts` — `checkInCandidates(children, passes, adultUid)`, `droppedByOptions(children, guardianNames)`, `buildCheckIn(input)`, `buildReentry(existing, input, nowStamp)`, `buildCheckOut(input)` | montagem das passagens sem `undefined` |
| `health.ts` — `QUICK_HEALTH_ITEM_IDS` | itens do cadastro rápido |

### Demais arquivos

| Arquivo | Situação |
|---|---|
| `src/paths.ts` | `ROUTES.AUTHENTICATED.KIDS = '/dashboard/kids'` |
| `src/types/index.ts` | `KidSession`, `KidPass` (com `Timestamp`) |
| `src/services/firebase/kids-room.ts` | QR (`getOrCreateQrToken`, `regenerateQrToken`, `resolveQr`), sessão (`subscribeToOpenSession`, `openSession`, `closeSession`, `setServing`), passagens (`subscribeToSessionPasses`, `subscribeToMyChildrenPasses`, `checkIn`, `checkOut`, `changeRoom`), `createVisitorChild` |
| `src/store/useKidsSession.ts` | sessão aberta (listener único, vivo na sessão do app) |
| `src/app/(protected)/dashboard/kids/page.tsx` | tela do módulo (status, abas) |
| `.../kids/components/MyQrCard.tsx`, `MyChildrenStatus.tsx` | lado do membro |
| `.../kids/components/RoomPanel.tsx`, `PassCard.tsx`, `CheckInSheet.tsx`, `CheckOutSheet.tsx`, `QuickChildForm.tsx`, `QrScannerView.tsx`, `SignupQrDialog.tsx` | lado da equipe |
| `src/components/kids/KidDetailModal.tsx` | aceita ações extras (registrar saída, trocar sala) |
| `src/components/Sidebar.tsx`, `src/components/mobile/MobileBottomNav.tsx` | item Kids |
| `src/app/(protected)/dashboard/members/kids/page.tsx`, `src/components/kids/KidCard.tsx` | etiqueta/filtro Visitante |
| `src/app/(protected)/dashboard/profile/components/MyChildrenSection.tsx` | etiqueta de cadastro rápido |
| `package.json` | `qrcode.react`, `qr-scanner` |

## Testes

`npm run test:kids`:

- `qr`: ida e volta; `parseQrPayload` com prefixo errado, campos vazios, `:` extras, texto qualquer; `newToken` com bytes fixos gera 24 chars base64url.
- `session`: `isSessionStale` na fronteira de 12 h; `roomCounts`; `passLabel` (na sala/deixado por você/por outro, retirado, fora da sala, `no_checkout`); `passesToClose` só pega `in`.
- `checkin`: candidatos do adulto com "já na sala"; opções de "deixado por" sem repetição; `buildCheckIn`/`buildCheckOut` sem `undefined` (com e sem foto, "Outra pessoa" sem uid); `buildReentry` move a passagem anterior para `previous_passes`.

UI verificada com `npx tsc --noEmit` e `npm run lint`; câmera e leitura de QR testadas pelo usuário no aparelho.
