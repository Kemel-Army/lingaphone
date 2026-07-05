<script setup lang="ts">
/**
 * /student/shop — Магазин: трата кристаллов на бусты, рамки аватара,
 * темы профиля и титулы. Покупка списывает кристаллы атомарно на сервере;
 * косметика (рамки/титулы/темы) надевается через equip-item.
 */
import { useStudent } from '~/entities/student'
import { useGameProfile, useMyCosmetics } from '~/entities/game-profile'
import type { ShopItem, StudentInventory } from '~/entities/game-profile'
import { ShopCategory } from '~/shared/types/common'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Магазин — Lingaphone' })

const toast = useAppToast()
const { burst: confettiBurst } = useConfetti()
const { studentId } = useStudent()
const {
  fetchGameProfile,
  fetchShopItems,
  fetchInventory,
  equipItem
} = useGameProfile()
const { refresh: refreshCosmetics } = useMyCosmetics()

/** Emoji-персонаж для товаров категории AVATAR (лежит в effect.emoji). */
const itemEmoji = (item: ShopItem): string | null => {
  if (item.category !== 'AVATAR') return null
  const e = (item.effect as Record<string, unknown> | null)?.emoji
  return typeof e === 'string' ? e : null
}
const itemEmojiBg = (item: ShopItem): string | null => {
  const bg = (item.effect as Record<string, unknown> | null)?.bg
  return typeof bg === 'string' ? bg : null
}

const { data: gameProfile, refresh: refreshProfile } = useAsyncData(
  'shop-profile',
  () => studentId.value ? fetchGameProfile(studentId.value) : Promise.resolve(null),
  { watch: [studentId], server: false }
)

const { data: shopItems } = useAsyncData('shop-items', fetchShopItems, { server: false })

const { data: inventory, refresh: refreshInventory } = useAsyncData(
  'shop-inventory',
  () => studentId.value ? fetchInventory(studentId.value) : Promise.resolve([]),
  { watch: [studentId], server: false }
)

const xp = computed(() => gameProfile.value?.xp ?? 0)
const gems = computed(() => gameProfile.value?.gems ?? 0)
const level = computed(() => gameProfile.value?.level ?? 1)

const ownedMap = computed(() => {
  const map = new Map<string, number>()
  for (const inv of (inventory.value ?? [])) {
    map.set(inv.shopItemId, inv.quantity)
  }
  return map
})

type Tab = 'ALL' | ShopCategory
const activeTab = ref<Tab>('ALL')

const tabItems = computed(() => {
  const counts: Record<string, number> = {}
  for (const item of (shopItems.value ?? [])) {
    counts[item.category] = (counts[item.category] ?? 0) + 1
  }
  return [
    { value: 'ALL' as Tab, label: 'Все', icon: 'i-lucide-grid-3x3', count: shopItems.value?.length ?? 0 },
    { value: ShopCategory.AVATAR, label: 'Аватары', icon: 'i-lucide-smile', count: counts.AVATAR ?? 0 },
    { value: ShopCategory.POWER_UP, label: 'Бусты', icon: 'i-lucide-zap', count: counts.POWER_UP ?? 0 },
    { value: ShopCategory.AVATAR_FRAME, label: 'Рамки', icon: 'i-lucide-hexagon', count: counts.AVATAR_FRAME ?? 0 },
    { value: ShopCategory.PROFILE_THEME, label: 'Темы', icon: 'i-lucide-palette', count: counts.PROFILE_THEME ?? 0 },
    { value: ShopCategory.TITLE, label: 'Титулы', icon: 'i-lucide-badge', count: counts.TITLE ?? 0 }
  ]
})

const filteredShopItems = computed(() => {
  if (!shopItems.value) return []
  if (activeTab.value === 'ALL') return shopItems.value
  return shopItems.value.filter(i => i.category === activeTab.value)
})

type ItemStatus = 'owned' | 'locked' | 'expensive' | 'available'
const itemStatus = (item: ShopItem): ItemStatus => {
  const owned = ownedMap.value.get(item.id) ?? 0
  if (owned >= item.maxOwnable) return 'owned'
  if (level.value < item.requiredLevel) return 'locked'
  if (gems.value < item.price) return 'expensive'
  return 'available'
}

// Категории, которые можно надеть (косметика). POWER_UP тратится при действии.
const EQUIPPABLE = new Set<string>(['AVATAR', 'AVATAR_FRAME', 'TITLE', 'PROFILE_THEME'])

const isEquipped = (item: ShopItem): boolean => {
  const p = gameProfile.value
  if (!p) return false
  if (item.category === 'AVATAR') return p.activeAvatarId === item.id
  if (item.category === 'AVATAR_FRAME') return p.activeFrameId === item.id
  if (item.category === 'TITLE') return p.activeTitleId === item.id
  if (item.category === 'PROFILE_THEME') {
    const themeName = (item.effect as Record<string, unknown> | null)?.name
    return typeof themeName === 'string' && themeName !== '' && p.visualMode === themeName
  }
  return false
}

const purchasing = ref<string | null>(null)
const purchaseItem = async (item: ShopItem) => {
  if (!studentId.value || purchasing.value) return
  if (itemStatus(item) !== 'available') return
  purchasing.value = item.id
  try {
    await $fetch('/api/gamification/shop-purchase', {
      method: 'POST',
      body: { shopItemId: item.id }
    })
    await Promise.all([refreshProfile(), refreshInventory(), refreshCosmetics()])
    toast.success('Куплено!', `«${item.name}» теперь твоё`)
    confettiBurst()
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message
    toast.error('Ошибка покупки', msg || 'Попробуй ещё раз')
  } finally {
    purchasing.value = null
  }
}

const equipping = ref<string | null>(null)
const toggleEquip = async (item: ShopItem) => {
  if (!studentId.value || equipping.value) return
  if (!EQUIPPABLE.has(item.category)) return
  const category = item.category as 'AVATAR' | 'AVATAR_FRAME' | 'TITLE' | 'PROFILE_THEME'
  const equipped = isEquipped(item)
  equipping.value = item.id
  try {
    await equipItem(studentId.value, category, equipped ? null : item.id)
    await Promise.all([refreshProfile(), refreshCosmetics()])
    toast.success(equipped ? 'Снято' : 'Активировано', item.name)
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message
    toast.error('Не получилось', msg || 'Попробуй ещё раз')
  } finally {
    equipping.value = null
  }
}

const ownedItems = computed(() =>
  (inventory.value ?? [])
    .map((inv: StudentInventory) => {
      const item = (shopItems.value ?? []).find(s => s.id === inv.shopItemId)
      return item ? { ...item, quantity: inv.quantity } : null
    })
    .filter((i): i is ShopItem & { quantity: number } => i !== null)
)

const CATEGORY_ICON: Record<string, string> = {
  POWER_UP: 'i-lucide-zap',
  AVATAR_FRAME: 'i-lucide-hexagon',
  PROFILE_THEME: 'i-lucide-palette',
  TITLE: 'i-lucide-badge'
}
</script>

<template>
  <div class="relative">
    <!-- Decorative background -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div class="absolute -top-32 -right-32 size-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div class="absolute -top-20 -left-20 size-72 rounded-full bg-sky-300/20 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <!-- Hero header -->
      <header class="space-y-2">
        <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          🛍️ Магазин
        </p>
        <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
          Что купим сегодня?
        </h1>
        <p class="text-sm text-muted">
          Трать кристаллы на бусты, рамки аватара, темы профиля и титулы
        </p>
      </header>

      <!-- Balance tiles -->
      <section class="grid grid-cols-3 gap-3">
        <div class="rounded-2xl ring-1 ring-emerald-200/60 dark:ring-emerald-700/30 bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20 p-5 text-center">
          <UIcon
            name="i-lucide-gem"
            class="size-7 mx-auto text-emerald-600 dark:text-emerald-400"
          />
          <p class="mt-2 text-2xl sm:text-3xl font-black tabular-nums text-emerald-700 dark:text-emerald-300">
            {{ gems }}
          </p>
          <p class="text-xs font-bold uppercase tracking-wider text-emerald-700/70 dark:text-emerald-300/70">
            Кристаллы
          </p>
        </div>
        <div class="rounded-2xl ring-1 ring-amber-200/60 dark:ring-amber-700/30 bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 p-5 text-center">
          <UIcon
            name="i-lucide-shield"
            class="size-7 mx-auto text-amber-600 dark:text-amber-400"
          />
          <p class="mt-2 text-2xl sm:text-3xl font-black tabular-nums text-amber-700 dark:text-amber-300">
            {{ level }}
          </p>
          <p class="text-xs font-bold uppercase tracking-wider text-amber-700/70 dark:text-amber-300/70">
            Уровень
          </p>
        </div>
        <div class="rounded-2xl ring-1 ring-sky-200/60 dark:ring-sky-700/30 bg-linear-to-br from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/20 p-5 text-center">
          <UIcon
            name="i-lucide-zap"
            class="size-7 mx-auto text-sky-600 dark:text-sky-400"
          />
          <p class="mt-2 text-2xl sm:text-3xl font-black tabular-nums text-sky-700 dark:text-sky-300">
            {{ xp }}
          </p>
          <p class="text-xs font-bold uppercase tracking-wider text-sky-700/70 dark:text-sky-300/70">
            XP
          </p>
        </div>
      </section>

      <!-- Category tabs -->
      <section class="flex flex-wrap gap-2">
        <button
          v-for="tab in tabItems"
          :key="tab.value"
          type="button"
          class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-1 transition-all"
          :class="activeTab === tab.value
            ? 'bg-emerald-600 text-white ring-emerald-600 shadow-md'
            : 'bg-default text-muted ring-default hover:ring-emerald-300 hover:text-emerald-600'"
          @click="activeTab = tab.value"
        >
          <UIcon
            :name="tab.icon"
            class="size-4"
          />
          <span>{{ tab.label }}</span>
          <span
            class="tabular-nums text-xs opacity-70"
          >{{ tab.count }}</span>
        </button>
      </section>

      <!-- Shop grid -->
      <section
        v-if="filteredShopItems.length"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <article
          v-for="item in filteredShopItems"
          :key="item.id"
          class="group relative flex flex-col gap-3 rounded-3xl border p-5 transition-all"
          :class="{
            'border-emerald-200 dark:border-emerald-800/50 bg-default hover:-translate-y-1 hover:shadow-lg hover:border-emerald-400': itemStatus(item) === 'available',
            'border-amber-300 dark:border-amber-700/50 bg-linear-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900': itemStatus(item) === 'owned',
            'border-default bg-default opacity-70': itemStatus(item) === 'locked',
            'border-dashed border-red-200 dark:border-red-800/50 bg-default': itemStatus(item) === 'expensive'
          }"
        >
          <!-- head -->
          <div class="flex items-start justify-between gap-3">
            <div
              class="size-12 shrink-0 rounded-2xl flex items-center justify-center"
              :class="itemEmoji(item) ? '' : 'bg-linear-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/30'"
              :style="itemEmoji(item) ? { backgroundColor: itemEmojiBg(item) ?? 'var(--ui-bg-elevated)' } : undefined"
            >
              <span
                v-if="itemEmoji(item)"
                class="text-3xl leading-none select-none"
              >{{ itemEmoji(item) }}</span>
              <UIcon
                v-else
                :name="item.icon"
                class="size-7 text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black whitespace-nowrap"
              :class="{
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300': itemStatus(item) === 'available',
                'bg-amber-500 text-white': itemStatus(item) === 'owned',
                'bg-elevated text-muted': itemStatus(item) === 'locked',
                'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400': itemStatus(item) === 'expensive'
              }"
            >
              <template v-if="itemStatus(item) === 'owned'">
                <UIcon
                  name="i-lucide-check"
                  class="size-3.5"
                /> Куплено
              </template>
              <template v-else-if="itemStatus(item) === 'locked'">
                <UIcon
                  name="i-lucide-lock"
                  class="size-3.5"
                /> Ур. {{ item.requiredLevel }}
              </template>
              <template v-else>
                <UIcon
                  name="i-lucide-gem"
                  class="size-3.5"
                /> {{ item.price }}
              </template>
            </div>
          </div>

          <!-- body -->
          <div class="flex-1 min-w-0">
            <h3 class="font-black text-base">
              {{ item.name }}
            </h3>
            <p
              v-if="item.description"
              class="mt-0.5 text-sm text-muted leading-snug"
            >
              {{ item.description }}
            </p>
            <p
              v-if="item.isLimited"
              class="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400"
            >
              <UIcon
                name="i-lucide-clock"
                class="size-3"
              />
              Ограниченное предложение
            </p>
          </div>

          <!-- cta -->
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60"
            :class="itemStatus(item) === 'owned' && EQUIPPABLE.has(item.category)
              ? (isEquipped(item)
                ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-900/30 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200')
              : itemStatus(item) === 'available'
                ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700 hover:shadow-lg'
                : 'bg-elevated text-muted'"
            :disabled="
              (itemStatus(item) === 'owned' && !EQUIPPABLE.has(item.category))
                || itemStatus(item) === 'locked'
                || itemStatus(item) === 'expensive'
                || purchasing === item.id
                || equipping === item.id
            "
            @click="itemStatus(item) === 'owned' && EQUIPPABLE.has(item.category)
              ? toggleEquip(item)
              : purchaseItem(item)"
          >
            <UIcon
              v-if="purchasing === item.id || equipping === item.id"
              name="i-lucide-loader-2"
              class="size-4 animate-spin"
            />
            <template v-else-if="itemStatus(item) === 'owned' && EQUIPPABLE.has(item.category)">
              <UIcon
                :name="isEquipped(item) ? 'i-lucide-check-circle-2' : 'i-lucide-sparkles'"
                class="size-4"
              />
              <span>{{ isEquipped(item) ? 'Активно — снять' : 'Надеть' }}</span>
            </template>
            <span v-else-if="itemStatus(item) === 'owned'">Получено</span>
            <span v-else-if="itemStatus(item) === 'locked'">Скоро откроется</span>
            <span v-else-if="itemStatus(item) === 'expensive'">Не хватает 💎</span>
            <template v-else>
              <UIcon
                name="i-lucide-shopping-cart"
                class="size-4"
              />
              <span>Купить</span>
            </template>
          </button>
        </article>
      </section>

      <div
        v-else-if="shopItems"
        class="rounded-3xl border border-dashed border-default p-10 text-center"
      >
        <UIcon
          name="i-lucide-package-open"
          class="size-10 mx-auto text-dimmed"
        />
        <p class="mt-3 font-bold">
          В этой категории пока пусто
        </p>
        <p class="text-sm text-muted">
          Мы постоянно добавляем новые штуки — загляни позже
        </p>
      </div>

      <!-- Inventory -->
      <section v-if="ownedItems.length">
        <div class="flex items-center gap-2 mb-4">
          <UIcon
            name="i-lucide-package"
            class="size-5 text-amber-500"
          />
          <h2 class="text-xl font-bold">
            Мой инвентарь
          </h2>
          <span class="text-sm text-muted">— {{ ownedItems.length }} {{ ownedItems.length === 1 ? 'предмет' : 'предметов' }}, твоё навсегда</span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="inv in ownedItems"
            :key="inv.id"
            class="flex items-center gap-3 rounded-2xl border p-3 transition-all"
            :class="isEquipped(inv)
              ? 'border-emerald-400 ring-1 ring-emerald-400/50 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-amber-200 dark:border-amber-800/40 bg-linear-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900'"
          >
            <div
              class="size-10 shrink-0 rounded-xl ring-1 ring-amber-200 dark:ring-amber-800/40 flex items-center justify-center"
              :class="itemEmoji(inv) ? '' : 'bg-default'"
              :style="itemEmoji(inv) ? { backgroundColor: itemEmojiBg(inv) ?? 'var(--ui-bg-elevated)' } : undefined"
            >
              <span
                v-if="itemEmoji(inv)"
                class="text-xl leading-none select-none"
              >{{ itemEmoji(inv) }}</span>
              <UIcon
                v-else
                :name="inv.icon || CATEGORY_ICON[inv.category] || 'i-lucide-package'"
                class="size-5 text-amber-600 dark:text-amber-400"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold truncate">
                {{ inv.name }}
              </p>
              <p class="text-xs text-muted">
                {{ isEquipped(inv) ? 'активно' : `×${inv.quantity}` }}
              </p>
            </div>
            <button
              v-if="EQUIPPABLE.has(inv.category)"
              type="button"
              class="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-all disabled:opacity-60"
              :class="isEquipped(inv)
                ? 'text-emerald-600 ring-emerald-300 dark:text-emerald-400'
                : 'text-amber-700 ring-amber-300 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30'"
              :disabled="equipping === inv.id"
              @click="toggleEquip(inv)"
            >
              <UIcon
                v-if="equipping === inv.id"
                name="i-lucide-loader-2"
                class="size-3.5 animate-spin"
              />
              <template v-else>
                <UIcon
                  :name="isEquipped(inv) ? 'i-lucide-x' : 'i-lucide-sparkles'"
                  class="size-3.5"
                />
                <span>{{ isEquipped(inv) ? 'Снять' : 'Надеть' }}</span>
              </template>
            </button>
          </div>
        </div>
      </section>

      <!-- How to earn -->
      <section class="rounded-3xl border border-default bg-default p-6">
        <div class="flex items-center gap-2 mb-4">
          <UIcon
            name="i-lucide-info"
            class="size-5 text-primary"
          />
          <h2 class="font-bold text-lg">
            Как заработать кристаллы
          </h2>
        </div>
        <ul class="grid gap-2 text-sm sm:grid-cols-2">
          <li class="flex items-start gap-2">
            <UIcon
              name="i-lucide-sparkles"
              class="size-4 text-emerald-500 mt-0.5 shrink-0"
            />
            <span>За закрытие пробела по теме (≥80%)</span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon
              name="i-lucide-flame"
              class="size-4 text-orange-500 mt-0.5 shrink-0"
            />
            <span>За серию 7/30/100 дней</span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon
              name="i-lucide-trophy"
              class="size-4 text-amber-500 mt-0.5 shrink-0"
            />
            <span>За идеальный тест (100%)</span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon
              name="i-lucide-award"
              class="size-4 text-sky-500 mt-0.5 shrink-0"
            />
            <span>За достижения и новые уровни</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
