import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isKidsTeamMember } from './team.ts'

test('equipe Kids pela atribuição principal ou secundária', () => {
  assert.equal(isKidsTeamMember({ atribuicao_principal: 'Ministério Kids e Juniores' }), true)
  assert.equal(isKidsTeamMember({ atribuicao_principal: 'Músico', atribuicoes_secundarias: ['Líder Kids'] }), true)
  assert.equal(isKidsTeamMember({ atribuicao_principal: 'Músico', atribuicoes_secundarias: ['Mídia'] }), false)
  assert.equal(isKidsTeamMember({}), false)
  assert.equal(isKidsTeamMember({ atribuicao_principal: null, atribuicoes_secundarias: null }), false)
  assert.equal(isKidsTeamMember(null), false)
})
