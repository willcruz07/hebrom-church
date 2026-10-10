export const DAILY_WORD_THEMES = [
  { id: 'Fe', label: 'Fé', icon: '🙏' },
  { id: 'Esperanca', label: 'Esperança', icon: '⚓' },
  { id: 'Amor', label: 'Amor', icon: '❤️' },
  { id: 'Motivacao', label: 'Motivação', icon: '🚀' },
  { id: 'Gratidao', label: 'Gratidão', icon: '🙌' },
  { id: 'Sabedoria', label: 'Sabedoria', icon: '💡' },
  { id: 'Paz', label: 'Paz', icon: '🕊️' },
  { id: 'Coragem', label: 'Coragem', icon: '🛡️' },
  { id: 'Cura', label: 'Cura', icon: '🏥' },
  { id: 'Familia', label: 'Família', icon: '👨‍👩‍👧‍👦' },
  { id: 'Prosperidade', label: 'Prosperidade', icon: '💰' },
  { id: 'Perdao', label: 'Perdão', icon: '🤝' },
  { id: 'Perseveranca', label: 'Perseverança', icon: '🏃' },
  { id: 'Oracao', label: 'Oração', icon: '🛐' },
  { id: 'Louvor', label: 'Louvor', icon: '🎵' },
  { id: 'Santidade', label: 'Santidade', icon: '✨' },
  { id: 'Humildade', label: 'Humildade', icon: '🙇' },
  { id: 'Disciplina', label: 'Disciplina', icon: '⚖️' },
]

export function getDailyWordTheme(id: string) {
  return DAILY_WORD_THEMES.find((t) => t.id === id) ?? { id, label: id, icon: '📖' }
}
