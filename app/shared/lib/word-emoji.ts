/**
 * Maps a vocabulary word → a matching emoji, so word-list exercises can show a
 * friendly picture next to each word (kid-clear, no external image assets).
 * Returns '' when unknown. Auto-imported (shared/lib).
 */
const EMOJI: Record<string, string> = {
  // seed vocabulary (a/an, A/An sort)
  'flag': '🚩', 'dog': '🐶', 'elephant': '🐘', 'umbrella': '☂️', 'clown': '🤡',
  'butterfly': '🦋', 'ice cream': '🍦', 'orange': '🍊', 'apple': '🍎', 'football': '⚽',
  'notebook': '📔', 'atlas': '🗺️', 'pencil': '✏️', 'book': '📖', 'eraser': '🧽', 'pen': '🖊️',
  // animals
  'cat': '🐱', 'bird': '🐦', 'fish': '🐟', 'rabbit': '🐰', 'lion': '🦁', 'tiger': '🐯',
  'bear': '🐻', 'monkey': '🐵', 'horse': '🐴', 'cow': '🐮', 'pig': '🐷', 'sheep': '🐑',
  'duck': '🦆', 'frog': '🐸', 'snake': '🐍', 'bee': '🐝', 'spider': '🕷️', 'chicken': '🐔',
  'penguin': '🐧', 'owl': '🦉', 'fox': '🦊', 'mouse': '🐭', 'panda': '🐼', 'dolphin': '🐬',
  // objects / school
  'ruler': '📏', 'bag': '🎒', 'backpack': '🎒', 'crayon': '🖍️', 'scissors': '✂️', 'glue': '🧴',
  'clock': '🕐', 'phone': '📱', 'computer': '💻', 'chair': '🪑', 'door': '🚪', 'window': '🪟',
  'key': '🔑', 'map': '🗺️', 'camera': '📷', 'guitar': '🎸', 'drum': '🥁', 'robot': '🤖',
  'crown': '👑', 'hat': '🎩', 'shoe': '👟', 'shirt': '👕', 'ball': '⚽', 'balloon': '🎈',
  'gift': '🎁', 'box': '📦', 'lamp': '💡', 'bell': '🔔', 'clock ': '⏰',
  // vehicles
  'car': '🚗', 'bus': '🚌', 'train': '🚆', 'plane': '✈️', 'airplane': '✈️', 'bike': '🚲',
  'bicycle': '🚲', 'boat': '⛵', 'ship': '🚢', 'rocket': '🚀', 'truck': '🚚',
  // food
  'banana': '🍌', 'egg': '🥚', 'milk': '🥛', 'bread': '🍞', 'cake': '🍰', 'water': '💧',
  'pizza': '🍕', 'cheese': '🧀', 'grapes': '🍇', 'lemon': '🍋', 'carrot': '🥕', 'cookie': '🍪',
  // people
  'boy': '👦', 'girl': '👧', 'man': '👨', 'woman': '👩', 'baby': '👶', 'teacher': '🧑‍🏫',
  // nature
  'star': '⭐', 'sun': '☀️', 'moon': '🌙', 'tree': '🌳', 'flower': '🌸', 'house': '🏠',
  'school': '🏫', 'heart': '❤️', 'fire': '🔥', 'rainbow': '🌈', 'snow': '❄️', 'cloud': '☁️'
}

export const wordEmoji = (raw?: string): string => {
  if (!raw) return ''
  const w = raw.toLowerCase().trim().replace(/^(a|an|the)\s+/, '')
  if (EMOJI[w]) return EMOJI[w]
  const singular = w.endsWith('s') ? EMOJI[w.slice(0, -1)] : undefined // plural fallback
  if (singular) return singular
  return ''
}
