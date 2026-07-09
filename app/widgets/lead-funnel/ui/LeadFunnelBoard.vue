<script setup lang="ts">
import {
  LEAD_STAGES,
  LEAD_SOURCE_MAP,
  type LeadWithRelations,
  type LeadStage
} from '~/entities/lead'

const props = defineProps<{
  leads: LeadWithRelations[]
}>()

const emit = defineEmits<{
  (e: 'move', payload: { lead: LeadWithRelations, toStage: LeadStage }): void
  (e: 'open', lead: LeadWithRelations): void
}>()

// Native HTML5 drag-and-drop state (no external lib).
const draggingId = ref<string | null>(null)
const dragOverStage = ref<LeadStage | null>(null)

const byStage = computed<Record<LeadStage, LeadWithRelations[]>>(() => {
  const map = Object.fromEntries(LEAD_STAGES.map(s => [s.value, [] as LeadWithRelations[]])) as Record<LeadStage, LeadWithRelations[]>
  for (const lead of props.leads) {
    (map[lead.stage] ??= []).push(lead)
  }
  return map
})

const stageSum = (stage: LeadStage): number =>
  byStage.value[stage].reduce((s, l) => s + (l.amount ? Number(l.amount) : 0), 0)

const onDragStart = (lead: LeadWithRelations, ev: DragEvent) => {
  draggingId.value = lead.id
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move'
    ev.dataTransfer.setData('text/plain', lead.id)
  }
}

const onDragEnd = () => {
  draggingId.value = null
  dragOverStage.value = null
}

const onDrop = (stage: LeadStage) => {
  const id = draggingId.value
  dragOverStage.value = null
  draggingId.value = null
  if (!id) return
  const lead = props.leads.find(l => l.id === id)
  if (!lead || lead.stage === stage) return
  emit('move', { lead, toStage: stage })
}

const initials = (l: LeadWithRelations): string => {
  const r = l.responsible
  if (!r) return ''
  return `${r.name?.[0] ?? ''}${r.surname?.[0] ?? ''}`.toUpperCase()
}

const money = (n: number) => `${n.toLocaleString('ru-RU')} ₸`
</script>

<template>
  <div class="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
    <div
      v-for="stage in LEAD_STAGES"
      :key="stage.value"
      class="shrink-0 w-72 rounded-xl border border-subtle bg-muted/20 flex flex-col transition-colors"
      :class="dragOverStage === stage.value ? 'ring-2 ring-primary bg-primary/5' : ''"
      @dragover.prevent="dragOverStage = stage.value"
      @dragleave="dragOverStage === stage.value && (dragOverStage = null)"
      @drop.prevent="onDrop(stage.value)"
    >
      <!-- Column header -->
      <div class="flex items-center gap-2 px-3 py-2.5 border-b border-subtle sticky top-0">
        <UIcon
          :name="stage.icon"
          class="size-4 shrink-0"
        />
        <span class="text-sm font-semibold truncate flex-1">{{ stage.label }}</span>
        <UBadge
          :color="stage.color"
          variant="subtle"
          size="sm"
        >
          {{ byStage[stage.value].length }}
        </UBadge>
      </div>

      <div
        v-if="stageSum(stage.value) > 0"
        class="px-3 pt-2 text-xs font-medium text-muted"
      >
        {{ money(stageSum(stage.value)) }}
      </div>

      <!-- Cards -->
      <div class="flex-1 p-2 space-y-2 min-h-24 overflow-y-auto max-h-[calc(100vh-18rem)]">
        <div
          v-for="lead in byStage[stage.value]"
          :key="lead.id"
          draggable="true"
          class="rounded-lg border border-subtle bg-default p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-sm transition-all"
          :class="draggingId === lead.id ? 'opacity-40' : ''"
          @dragstart="onDragStart(lead, $event)"
          @dragend="onDragEnd"
          @click="emit('open', lead)"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="font-semibold text-sm leading-tight">
              {{ lead.fullName }}
            </p>
            <UIcon
              :name="LEAD_SOURCE_MAP[lead.source].icon"
              class="size-3.5 shrink-0 text-muted mt-0.5"
              :title="LEAD_SOURCE_MAP[lead.source].label"
            />
          </div>

          <p
            v-if="lead.phone"
            class="text-xs text-muted mt-1 flex items-center gap-1"
          >
            <UIcon
              name="i-lucide-phone"
              class="size-3"
            />
            {{ lead.phone }}
          </p>

          <div class="flex items-center justify-between gap-2 mt-2">
            <span
              v-if="lead.amount"
              class="text-xs font-semibold text-primary"
            >{{ money(Number(lead.amount)) }}</span>
            <span v-else />
            <UBadge
              v-if="lead.responsible"
              color="neutral"
              variant="subtle"
              size="sm"
              :title="`${lead.responsible.name} ${lead.responsible.surname}`"
            >
              {{ initials(lead) }}
            </UBadge>
          </div>
        </div>

        <p
          v-if="byStage[stage.value].length === 0"
          class="text-xs text-muted text-center py-6 select-none"
        >
          Перетащите сюда
        </p>
      </div>
    </div>
  </div>
</template>
