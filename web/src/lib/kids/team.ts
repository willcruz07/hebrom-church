/** Atribuições que dão acesso à Sala da Área Kids. */
export const KIDS_TEAM_ATTRIBUTIONS: readonly string[] = ['Ministério Kids e Juniores', 'Líder Kids']

export function isKidsTeamMember(
  user:
    | { atribuicao_principal?: string | null; atribuicoes_secundarias?: readonly string[] | null }
    | null
    | undefined,
): boolean {
  if (!user) return false
  if (user.atribuicao_principal && KIDS_TEAM_ATTRIBUTIONS.includes(user.atribuicao_principal)) return true
  return (user.atribuicoes_secundarias ?? []).some((a) => KIDS_TEAM_ATTRIBUTIONS.includes(a))
}
