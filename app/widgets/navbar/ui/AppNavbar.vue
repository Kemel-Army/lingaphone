<script setup lang="ts">
import { useCurrentUser, UserAvatar } from '~/entities/user'
import { useNotifications, NotificationItem } from '~/entities/notification'
import type { AppNotification } from '~/entities/notification'
import { useAuthActions } from '~/features/auth'

const { currentUser, fullName, role, avatarUrl, internalId } = useCurrentUser()
const { logout } = useAuthActions()
const { locale, setLocale } = useI18n()

const toggleLocale = () => {
  setLocale(locale.value === 'ru' ? 'kz' : 'ru')
}

const { fetchNotifications, unreadCount: fetchUnreadCount, markAsRead, markAllAsRead } = useNotifications()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
function toggleDark() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const notificationsOpen = ref(false)
const notifications = ref<AppNotification[]>([])
const unreadCount = ref(0)
const notifLoading = ref(false)

const loadNotifications = async () => {
  if (!internalId.value) return
  notifLoading.value = true
  try {
    const [notifs, count] = await Promise.all([
      fetchNotifications(internalId.value, 10),
      fetchUnreadCount(internalId.value)
    ])
    notifications.value = notifs
    unreadCount.value = count
  } catch {
    // silent
  } finally {
    notifLoading.value = false
  }
}

const handleNotificationClick = async (id: string) => {
  await markAsRead(id)
  const notif = notifications.value.find(n => n.id === id)
  if (notif) notif.isRead = true
  unreadCount.value = Math.max(0, unreadCount.value - 1)
}

const handleMarkAllRead = async () => {
  if (!internalId.value) return
  await markAllAsRead(internalId.value)
  notifications.value.forEach(n => n.isRead = true)
  unreadCount.value = 0
}

// Realtime subscription for instant updates
const supabaseClient = useSupabaseClient<import('~/shared/types/database.types').Database>()
let realtimeChannel: ReturnType<typeof supabaseClient.channel> | null = null

const subscribeRealtime = (userId: string) => {
  if (realtimeChannel) supabaseClient.removeChannel(realtimeChannel)
  realtimeChannel = supabaseClient
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'Notification', filter: `userId=eq.${userId}` },
      (payload: { new: AppNotification }) => {
        unreadCount.value++
        if (notificationsOpen.value && payload.new) {
          notifications.value.unshift(payload.new)
        }
      }
    )
    .subscribe()
}

watch(internalId, (id) => {
  if (id) {
    fetchUnreadCount(id).then(c => unreadCount.value = c).catch(() => { })
    subscribeRealtime(id)
  }
}, { immediate: true })

onUnmounted(() => {
  if (realtimeChannel) supabaseClient.removeChannel(realtimeChannel)
})

watch(notificationsOpen, (open) => {
  if (open) loadNotifications()
})

const userMenuItems = computed(() => [
  [{ label: fullName.value, slot: 'account', disabled: true }],
  [{
    label: 'Настройки',
    icon: 'i-lucide-settings',
    to: role.value ? `/${role.value.toLowerCase()}/settings` : '/settings'
  }],
  [{ label: 'Выйти', icon: 'i-lucide-log-out', onSelect: logout }]
])
</script>

<template>
  <UDashboardNavbar>
    <template #left>
      <UDashboardSidebarCollapse />
    </template>

    <template #right>
      <UPopover v-model:open="notificationsOpen">
        <button
          type="button"
          class="relative p-2 rounded-md hover:bg-elevated transition-colors"
          aria-label="Notifications"
        >
          <UIcon
            name="i-lucide-bell"
            class="size-4.5"
          />
          <span
            v-if="unreadCount > 0"
            class="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </button>

        <template #content>
          <div class="w-80">
            <div class="flex items-center justify-between border-b border-default px-4 py-3">
              <p class="text-sm font-semibold">
                Уведомления
              </p>
              <UButton
                v-if="unreadCount > 0"
                label="Прочитать все"
                variant="ghost"
                size="xs"
                @click="handleMarkAllRead"
              />
            </div>

            <div class="max-h-80 overflow-y-auto">
              <div
                v-if="notifLoading"
                class="flex justify-center py-8"
              >
                <UIcon
                  name="i-lucide-loader"
                  class="size-5 animate-spin text-dimmed"
                />
              </div>

              <template v-else-if="notifications.length">
                <NotificationItem
                  v-for="notif in notifications"
                  :key="notif.id"
                  :notification="notif"
                  @click="handleNotificationClick"
                />
              </template>

              <div
                v-else
                class="py-8 text-center"
              >
                <UIcon
                  name="i-lucide-bell-off"
                  class="mx-auto mb-2 size-8 text-dimmed"
                />
                <p class="text-sm text-muted">
                  Нет уведомлений
                </p>
              </div>
            </div>
          </div>
        </template>
      </UPopover>

      <UButton
        :label="locale === 'ru' ? 'KZ' : 'RU'"
        color="neutral"
        variant="ghost"
        size="sm"
        class="font-semibold"
        @click="toggleLocale"
      />

      <UButton
        :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
        color="neutral"
        variant="ghost"
        aria-label="Theme"
        @click="toggleDark"
      />

      <UDropdownMenu
        v-if="currentUser"
        :items="userMenuItems"
      >
        <UButton
          color="neutral"
          variant="ghost"
          class="p-0.5"
        >
          <UserAvatar
            :src="avatarUrl"
            :name="currentUser.name"
            :surname="currentUser.surname"
            size="xs"
          />
        </UButton>
      </UDropdownMenu>
    </template>
  </UDashboardNavbar>
</template>
