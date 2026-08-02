# Papéis e permissões

## Contexto / objetivo
O Hebrom Sys tem 4 níveis de acesso globais e uma camada adicional de moderação por grupo/ministério (líder de grupo). Esta spec descreve a matriz de permissões completa conforme descrita pelo usuário, para servir de referência ao implementar ou revisar qualquer lógica de autorização.

## Estado atual no código
- `UserRole` em `src/types/index.ts`: `visitor | pending_member | member | secretary | pastor`. O código já distingue `pending_member` (aguardando aprovação — telas `(protected)/pendente` e `(protected)/visitante`) do `member` efetivo.
- Autorização é 100% client-side: `usePermissions` (`src/hooks/usePermissions.ts`) e `PermissionGuard` (`src/components/PermissionGuard.tsx`). Nenhuma rota de API ou regra do Firestore valida `role` no servidor — ver riscos de segurança em `AGENTS.md` e o skill `security-check`.
- Não existe hoje o conceito de "líder de grupo" como papel — `ChurchGroup` (`src/services/firebase/groups.ts`, `src/types/index.ts`) não tem campo de moderador/líder.

## Design alvo

### Papéis globais
| Papel | Mural (aba geral) | Agenda | Pedidos de oração | Grupos/ministérios | Membros | Palavra do dia |
|---|---|---|---|---|---|---|
| **Visitante** | Visualiza | Visualiza | — | — | — | Visualiza |
| **Membro** | Visualiza + curte + comenta (não posta) | Visualiza | Solicita | Participa dos que faz parte, interage no feed do grupo | Busca perfil básico de outros membros | Visualiza |
| **Secretaria** | Igual a membro | Visualiza | Visualiza (a definir se responde — ver "Decisões em aberto") | Aprova/valida membros, edita dados básicos de cadastro | Edita dados básicos de qualquer membro | Visualiza |
| **Admin/Pastor** | Tudo do acima + posta no geral (a confirmar) | Cria/edita | Visualiza e responde | Gerencia tudo | Gerencia tudo | Cadastra/edita |

Regra geral: dado **ministerial** (atribuição de ministério, papel de líder) só é editável por secretaria ou admin/pastor — o próprio usuário só edita dados pessoais (nome, telefone, endereço, data de nascimento, bio).

### Líder de grupo (papel adicional, não substitui o papel global)
Qualquer `member` (ou papel superior) pode acumular a função de **líder** de um ministério/grupo específico (ex: líder de louvor, líder de mídia, líder kids). Isso é ortogonal ao papel global — um `member` pode ser líder do seu grupo sem ser secretaria/pastor. O líder de grupo pode:
- Moderar posts dentro do feed do próprio grupo (editar/remover posts e comentários do grupo).
- Gerenciar quem participa do grupo (a confirmar — ver "Decisões em aberto").

Não tem nenhum efeito fora do grupo que lidera.

## Decisões em aberto
- Secretaria "responde" pedidos de oração ou só visualiza/encaminha para pastoral? O usuário disse que a resposta a pedidos é atribuição do admin/pastor; não ficou claro se secretaria tem visão de status intermediário.
- Admin/pastor posta no mural geral? O usuário não confirmou explicitamente — hoje a regra clara é "membro não posta no geral", mas não ficou definido quem posta lá (só sistema/admin?). **Pista parcial**: `specs/mural-grupos.md` define um flag novo `AppUser.can_post_mural` (pendente de implementação) — automático para `secretary`/`pastor`, mas extensível a qualquer `member` manualmente. Isso resolve o mecanismo ("como dar esse poder a alguém"), mas não a política ("quem deveria ter por padrão além de secretaria/pastor").
- Como o "líder de grupo" é atribuído/revogado — é um campo por grupo (`ChurchGroup.leaderId` / lista de líderes) ou um array de grupos liderados no `AppUser`? Precisa decidir o modelo de dado quando for implementar. **Pista parcial**: `specs/ministerios-carteirinha.md` já modela "Líder X" como valor dentro da mesma lista flat de atribuições (`principal`/`secundárias`) do `AppUser`, não como campo em `ChurchGroup` — mas a revogação/consulta reversa (quem é líder de qual grupo) ainda não está definida.
- Líder de grupo pode aprovar/remover participantes do próprio grupo, ou isso continua exclusivo da secretaria?

## Não-escopo
Esta spec não implica implementar `firestore.rules`, verificação server-side, ou o modelo de dado de líder de grupo agora — é referência de design. A correção dos gaps de segurança (autorização só client-side) continua coberta separadamente pelo skill `security-check` e pelos riscos documentados em `AGENTS.md`.
