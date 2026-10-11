export const noteColors = ['#FEF3C7', '#FDE68A', '#FFD6A5', '#FBCFE8', '#E0BBE4', '#B5EAD7', '#C7CEEA', '#E5E7EB']

// Cor salva na nota; notas antigas usam a posição como antes.
export function noteColor(note, index = 0) {
  const i = Number.isInteger(note?.color) ? note.color : Math.max(0, index)
  return noteColors[i % noteColors.length]
}
