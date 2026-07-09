// Каталог предметов аватара (ТЗ разд. 5). Рендер — SVG в AvatarCharacter.vue
// по id предмета. Цена — в Linga Coins. Предметы с price=0 бесплатны и
// всегда «в наличии».

export type AvatarSlot = 'hat' | 'glasses' | 'top' | 'shoes'

export interface AvatarItem {
  id: string
  slot: AvatarSlot
  name: string
  price: number
}

export interface AvatarConfig {
  hat: string
  glasses: string
  top: string
  shoes: string
  color: string
}

export const AVATAR_SLOTS: { slot: AvatarSlot, label: string, icon: string }[] = [
  { slot: 'hat', label: 'Головной убор', icon: 'i-lucide-crown' },
  { slot: 'glasses', label: 'Очки', icon: 'i-lucide-glasses' },
  { slot: 'top', label: 'Одежда', icon: 'i-lucide-shirt' },
  { slot: 'shoes', label: 'Обувь', icon: 'i-lucide-footprints' }
]

export const AVATAR_ITEMS: AvatarItem[] = [
  { id: 'hat-none', slot: 'hat', name: 'Без шапки', price: 0 },
  { id: 'hat-cap', slot: 'hat', name: 'Кепка', price: 150 },
  { id: 'hat-beanie', slot: 'hat', name: 'Шапка', price: 200 },
  { id: 'hat-wizard', slot: 'hat', name: 'Колпак мага', price: 800 },
  { id: 'hat-crown', slot: 'hat', name: 'Корона', price: 1500 },

  { id: 'glasses-none', slot: 'glasses', name: 'Без очков', price: 0 },
  { id: 'glasses-round', slot: 'glasses', name: 'Круглые', price: 120 },
  { id: 'glasses-sun', slot: 'glasses', name: 'Солнечные', price: 300 },
  { id: 'glasses-star', slot: 'glasses', name: 'Звёздные', price: 500 },

  { id: 'top-default', slot: 'top', name: 'Футболка', price: 0 },
  { id: 'top-stripes', slot: 'top', name: 'Тельняшка', price: 200 },
  { id: 'top-hoodie', slot: 'top', name: 'Худи', price: 350 },
  { id: 'top-suit', slot: 'top', name: 'Костюм', price: 900 },

  { id: 'shoes-default', slot: 'shoes', name: 'Кроссовки', price: 0 },
  { id: 'shoes-boots', slot: 'shoes', name: 'Ботинки', price: 200 },
  { id: 'shoes-neon', slot: 'shoes', name: 'Неоновые', price: 450 }
]

export const AVATAR_ITEM_MAP: Record<string, AvatarItem>
  = Object.fromEntries(AVATAR_ITEMS.map(i => [i.id, i]))

/** Бесплатные предметы — всегда доступны без покупки. */
export const FREE_ITEM_IDS: string[] = AVATAR_ITEMS.filter(i => i.price === 0).map(i => i.id)

export const AVATAR_COLORS: string[] = [
  '#fbbf24', '#f472b6', '#60a5fa', '#34d399', '#a78bfa', '#fb923c', '#f87171', '#22d3ee'
]

export const DEFAULT_CONFIG: AvatarConfig = {
  hat: 'hat-none',
  glasses: 'glasses-none',
  top: 'top-default',
  shoes: 'shoes-default',
  color: AVATAR_COLORS[0]!
}

export const EMOTES: { id: string, label: string, icon: string }[] = [
  { id: 'wave', label: 'Привет', icon: 'i-lucide-hand' },
  { id: 'jump', label: 'Прыжок', icon: 'i-lucide-chevrons-up' },
  { id: 'dance', label: 'Танец', icon: 'i-lucide-music' },
  { id: 'spin', label: 'Кружиться', icon: 'i-lucide-rotate-cw' }
]

export type AvatarEmotion = 'neutral' | 'joy' | 'surprise' | 'fear' | 'laughter' | 'annoyance'

export const itemPrice = (id: string): number => AVATAR_ITEM_MAP[id]?.price ?? 0

/** Привести произвольный jsonb к валидному конфигу. */
export const normalizeConfig = (raw: unknown): AvatarConfig => {
  const r = (raw ?? {}) as Partial<AvatarConfig>
  const pick = (val: string | undefined, slot: AvatarSlot, fallback: string) =>
    val && AVATAR_ITEM_MAP[val]?.slot === slot ? val : fallback
  return {
    hat: pick(r.hat, 'hat', DEFAULT_CONFIG.hat),
    glasses: pick(r.glasses, 'glasses', DEFAULT_CONFIG.glasses),
    top: pick(r.top, 'top', DEFAULT_CONFIG.top),
    shoes: pick(r.shoes, 'shoes', DEFAULT_CONFIG.shoes),
    color: typeof r.color === 'string' && AVATAR_COLORS.includes(r.color) ? r.color : DEFAULT_CONFIG.color
  }
}

/** Полный список доступных предметов ученику = бесплатные + купленные. */
export const ownedSet = (stored: string[] | null | undefined): Set<string> =>
  new Set([...FREE_ITEM_IDS, ...(stored ?? [])])
