export { default as AvatarCharacter } from './ui/AvatarCharacter.vue'
export { useAvatar } from './composables/useAvatar'
export type { AvatarState } from './composables/useAvatar'
export {
  AVATAR_ITEMS,
  AVATAR_ITEM_MAP,
  AVATAR_SLOTS,
  AVATAR_COLORS,
  FREE_ITEM_IDS,
  DEFAULT_CONFIG,
  EMOTES,
  itemPrice,
  normalizeConfig,
  ownedSet
} from '~/shared/lib/avatarCatalog'
export type { AvatarConfig, AvatarSlot, AvatarItem, AvatarEmotion } from '~/shared/lib/avatarCatalog'
