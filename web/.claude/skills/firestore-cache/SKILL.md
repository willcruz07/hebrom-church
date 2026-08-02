---
name: firestore-cache
description: Use antes de adicionar uma leitura nova do Firestore (getDocs/onSnapshot), uma lista grande sem paginação, ou qualquer busca repetida de dados no Hebrom Sys — o Firestore cobra por leitura de documento, então o padrão do projeto prioriza onSnapshot + cache local sobre fetch repetido.
---

# Arquitetura de dados / Firestore — Hebrom Sys

1. Prefira `onSnapshot` a `getDocs()` repetido para dados vistos por muita gente e que mudam com frequência (mural, agenda, contadores do dashboard). Um listener só cobra 1 leitura por doc na carga inicial + 1 por doc que mudar depois — muito mais barato que refetch a cada navegação.
2. O listener deve viver no Zustand (fora do ciclo de vida do componente de página), não ser recriado a cada mount/navegação de rota.
3. Para coleções que crescem (mural), filtre por janela de tempo (ex: mês atual) em vez de carregar histórico completo — histórico antigo vira paginação por cursor (`startAfter`) com `getDocs()` único, sem listener.
4. Para perfil de outro membro específico ou dado que não muda com frequência, fetch pontual + refresh manual é suficiente — não precisa de listener.
5. Antes de adicionar uma lista sem paginação, confirme se o volume de dados justifica isso — listas grandes devem paginar.
6. Design completo e critérios de decisão (o que vira listener vs. fetch pontual): `specs/firestore-arquitetura-dados.md`.
