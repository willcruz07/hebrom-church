---
name: mural-grupos
description: Use antes de mexer no mural (feed geral ou por grupo), em groups.ts/mural.ts, ou em qualquer lógica de moderação de grupo no Hebrom Sys.
---

# Mural e grupos — Hebrom Sys

1. O mural tem (no design alvo) **duas visões**: geral (todos veem, membro só curte/comenta) e por grupo/ministério (fórum, só quem participa, pode postar). Hoje o código (`src/services/firebase/mural.ts`) ainda trata como feed único — não assuma que a separação já existe, confira.
2. Dentro do feed de grupo, qualquer participante pode postar — é diferente da regra do feed geral.
3. **Líder de grupo modera só o próprio grupo** (edita/remove post e comentário daquele grupo), sem nenhum poder fora dele. Ver skill `roles-permissoes` para o que diferencia líder de grupo dos papéis globais.
4. Quem exatamente posta no feed geral (só `pastor`, ou `secretary` também) ainda não está fechado — não assuma, veja "Decisões em aberto" em `specs/mural-grupos.md`.
5. Design completo: `specs/mural-grupos.md`.
