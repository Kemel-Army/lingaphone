<script setup lang="ts">
import { AppSidebar } from '~/widgets/sidebar'
import { AppNavbar } from '~/widgets/navbar'
</script>

<template>
  <UApp>
    <UDashboardGroup class="app-shell">
      <AppSidebar />
      <UDashboardPanel>
        <template #header>
          <AppNavbar />
        </template>
        <template #body>
          <slot />
        </template>
      </UDashboardPanel>
    </UDashboardGroup>
  </UApp>
</template>
