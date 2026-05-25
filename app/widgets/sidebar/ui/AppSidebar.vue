<script setup lang="ts">
import { useCurrentUser, UserAvatar } from '~/entities/user'
import { useAuthActions } from '~/features/auth'
import { SIDEBAR_BY_ROLE, ROLE_LABELS } from '~/shared/types/common'
import type { SidebarItem, UserRole } from '~/shared/types/common'

const { currentUser, fullName, role, homeRoute, avatarUrl } = useCurrentUser()
const { logout } = useAuthActions()
const route = useRoute()

const sidebarItems = computed<SidebarItem[]>(() => {
  if (!role.value) return []
  return SIDEBAR_BY_ROLE[role.value as UserRole] ?? []
})

const isActiveItem = (item: SidebarItem) => {
  if (!item.to) return false
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

const navItems = computed(() =>
  sidebarItems.value.map(item => ({
    label: item.label,
    icon: item.icon,
    to: item.to,
    active: isActiveItem(item)
  }))
)

const roleLabel = computed(() => {
  if (!role.value) return ''
  return ROLE_LABELS[role.value as UserRole] ?? role.value
})
</script>

<template>
  <UDashboardSidebar>
    <template #header>
      <NuxtLink
        :to="homeRoute"
        class="flex items-center gap-2.5 px-1"
      >
        <span class="text-lg font-bold">Lingaphone</span>
        <UBadge
          :label="roleLabel"
          color="primary"
          variant="subtle"
          size="xs"
        />
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="navItems"
      orientation="vertical"
    />

    <template #footer>
      <UDropdownMenu
        v-if="currentUser"
        :items="[
          [{ label: 'Выйти', icon: 'i-lucide-log-out', onSelect: logout }]
        ]"
        :content="{ side: 'right', align: 'end' }"
      >
        <button class="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-elevated">
          <UserAvatar
            :src="avatarUrl"
            :name="currentUser.name"
            :surname="currentUser.surname"
            size="sm"
          />
          <div class="min-w-0 flex-1 text-left">
            <p class="truncate text-sm font-medium">
              {{ fullName }}
            </p>
            <p class="truncate text-xs text-muted">
              {{ currentUser.email }}
            </p>
          </div>
          <UIcon
            name="i-lucide-chevrons-up-down"
            class="size-4 shrink-0 text-muted"
          />
        </button>
      </UDropdownMenu>
    </template>
  </UDashboardSidebar>
</template>
