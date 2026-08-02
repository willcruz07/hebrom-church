---
name: roles-permissoes
description: Use antes de mexer em usePermissions, PermissionGuard, checagem de role, ou qualquer lógica de moderação de líder de grupo no Hebrom Sys — garante que a mudança respeita a matriz de papéis do projeto.
---

# Papéis e permissões — Hebrom Sys

1. Os 4 papéis globais são `visitor | pending_member | member | secretary | pastor` (`src/types/index.ts`). Não invente um papel novo sem checar `specs/roles-permissoes.md` primeiro.
2. **Líder de grupo não é um papel global** — é uma atribuição adicional por ministério/grupo, ortogonal ao papel global (um `member` pode liderar um grupo). Não confunda com `secretary`/`pastor`.
3. Dado ministerial (atribuição de ministério, papel de líder) só é editável por `secretary`/`pastor`. O próprio usuário só edita dados pessoais (nome, telefone, endereço, nascimento, bio).
4. Membro comum não posta no mural geral (só curte/comenta) — só interage livremente dentro do feed do(s) grupo(s) que participa.
5. Qualquer checagem de permissão nova precisa ser client-side **e** validada no servidor — este projeto tem gaps conhecidos de autorização só-client (veja o skill `security-check` antes de mexer em rota de API ou função que escreve dado de outro usuário).
6. Para o design completo (matriz role × módulo × ação), veja `specs/roles-permissoes.md`. Pontos ainda não decididos (ex: quem posta no geral, modelo de dado do líder de grupo) estão na seção "Decisões em aberto" daquela spec — não assuma uma resposta, pergunte ao usuário.
