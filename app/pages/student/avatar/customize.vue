<script setup lang="ts">
import {
  AvatarCharacter, useAvatar,
  AVATAR_ITEMS, AVATAR_SLOTS, AVATAR_COLORS, FREE_ITEM_IDS,
  type AvatarConfig, type AvatarSlot, type AvatarItem
} from '~/entities/avatar'
import { useLingaCoins } from '~/entities/linga-coin'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { fetchState, saveConfig, buyItem } = useAvatar()
const { fetchMyWallet } = useLingaCoins()

const { data } = await useAsyncData('avatar-customize', async () => {
  const [state, wallet] = await Promise.all([fetchState(), fetchMyWallet()])
  return { state, balance: wallet.balance }
})

const studentId = computed(() => data.value?.state.studentId ?? null)
const config = reactive<AvatarConfig>({ ...(data.value?.state.config ?? { hat: 'hat-none', glasses: 'glasses-none', top: 'top-default', shoes: 'shoes-default', color: AVATAR_COLORS[0]! }) })
const ownedIds = ref<string[]>([...(data.value?.state.ownedStored ?? [])])
const balance = ref<number>(data.value?.balance ?? 0)

const ownedAll = computed(() => new Set([...FREE_ITEM_IDS, ...ownedIds.value]))
const isOwned = (id: string) => ownedAll.value.has(id)

const activeSlot = ref<AvatarSlot>('hat')
const slotItems = computed<AvatarItem[]>(() => AVATAR_ITEMS.filter(i => i.slot === activeSlot.value))
const busy = ref<string | null>(null)

const persist = async () => {
  if (!studentId.value) return
  try {
    await saveConfig(studentId.value, { ...config })
  } catch (e: unknown) {
    toast.add({ title: 'Не сохранилось', description: (e as { message?: string })?.message ?? '', color: 'error', icon: 'i-lucide-x' })
  }
}

const equip = async (item: AvatarItem) => {
  config[item.slot] = item.id
  await persist()
}

const setColor = async (c: string) => {
  config.color = c
  await persist()
}

const buy = async (item: AvatarItem) => {
  if (balance.value < item.price) {
    toast.add({ title: 'Недостаточно Linga Coins', color: 'warning', icon: 'i-lucide-coins' })
    return
  }
  busy.value = item.id
  try {
    const res = await buyItem(item.id)
    ownedIds.value = res.owned
    balance.value = res.balance
    toast.add({ title: `Куплено: ${item.name}`, color: 'success', icon: 'i-lucide-check' })
    await equip(item)
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка покупки', description: (e as { data?: { message?: string } })?.data?.message ?? '', color: 'error', icon: 'i-lucide-x' })
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-2">
        <UButton
          to="/student/avatar"
          icon="i-lucide-arrow-left"
          variant="ghost"
          color="neutral"
          size="sm"
        />
        <h1 class="text-xl font-bold">
          Кастомизация
        </h1>
      </div>
      <UBadge
        color="warning"
        variant="subtle"
        size="lg"
      >
        <UIcon
          name="i-lucide-coins"
          class="size-4 mr-1"
        />
        {{ balance.toLocaleString('ru-RU') }}
      </UBadge>
    </div>

    <div class="grid md:grid-cols-[220px_1fr] gap-5">
      <!-- Preview -->
      <div class="rounded-2xl bg-linear-to-b from-sky-100 to-emerald-100 dark:from-slate-800 dark:to-slate-900 p-4">
        <div class="w-full aspect-3/4 max-w-44 mx-auto">
          <AvatarCharacter :config="config" />
        </div>
        <!-- Color picker -->
        <div class="flex flex-wrap justify-center gap-2 mt-3">
          <button
            v-for="c in AVATAR_COLORS"
            :key="c"
            class="size-6 rounded-full border-2 transition-transform hover:scale-110"
            :style="{ background: c }"
            :class="config.color === c ? 'border-default ring-2 ring-primary' : 'border-white/50'"
            @click="setColor(c)"
          />
        </div>
      </div>

      <!-- Catalog -->
      <div>
        <div class="flex items-center gap-1 flex-wrap mb-3">
          <UButton
            v-for="s in AVATAR_SLOTS"
            :key="s.slot"
            :icon="s.icon"
            size="sm"
            :variant="activeSlot === s.slot ? 'solid' : 'ghost'"
            :color="activeSlot === s.slot ? 'primary' : 'neutral'"
            @click="activeSlot = s.slot"
          >
            {{ s.label }}
          </UButton>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            v-for="item in slotItems"
            :key="item.id"
            class="rounded-xl border p-3 flex flex-col items-center gap-2 transition-all"
            :class="config[item.slot] === item.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-subtle'"
          >
            <div class="w-20 h-24">
              <AvatarCharacter :config="{ ...config, [item.slot]: item.id }" />
            </div>
            <p class="text-xs font-medium text-center">
              {{ item.name }}
            </p>

            <UButton
              v-if="config[item.slot] === item.id"
              size="xs"
              color="primary"
              variant="soft"
              block
              disabled
            >
              Надето
            </UButton>
            <UButton
              v-else-if="isOwned(item.id)"
              size="xs"
              variant="soft"
              block
              @click="equip(item)"
            >
              Надеть
            </UButton>
            <UButton
              v-else
              size="xs"
              color="warning"
              block
              :loading="busy === item.id"
              @click="buy(item)"
            >
              <UIcon
                name="i-lucide-coins"
                class="size-3"
              />
              {{ item.price }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
