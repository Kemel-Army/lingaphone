<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const supabase = useTypedSupabaseClient()

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestRow {
  id: string
  title: string
  createdAt: string
  avgScore: number
  totalAttempts: number
  failedStudents: { name: string, surname: string, score: number }[]
  missedStudents: { name: string, surname: string }[]
}

interface GroupPerf {
  id: string
  name: string
  level: string
  teacherName: string
  avgPct: number
  testCount: number
  tests: TestRow[]
  expanded: boolean
}

// ─── Fetch data ───────────────────────────────────────────────────────────────

const { data: groups, pending } = await useAsyncData('admin-testing', async () => {
  // 1. Fetch all groups with teacher
  const { data: rawGroups, error: groupErr } = await supabase
    .from('Group')
    .select('id, name, level, Teacher!teacherId ( User!userId ( name, surname ) )')
    .order('name') as unknown as {
    data: {
      id: string
      name: string
      level: string
      Teacher: { User: { name: string, surname: string } | null } | null
    }[] | null
    error: unknown
  }

  if (groupErr || !rawGroups?.length) return []

  // 2. Fetch tests with submissions per group
  const groupPerfs: GroupPerf[] = []

  for (const g of rawGroups) {
    const teacher = Array.isArray(g.Teacher) ? g.Teacher[0] : g.Teacher
    const tUser = teacher ? (Array.isArray(teacher.User) ? teacher.User[0] : teacher.User) : null
    const teacherName = tUser ? `${tUser.name} ${tUser.surname}`.trim() : '—'

    // Fetch group members
    const { data: memberRows } = await supabase
      .from('GroupMember')
      .select('studentId, Student!studentId ( User!userId ( name, surname ) )')
      .eq('groupId', g.id) as unknown as {
      data: {
        studentId: string
        Student: { User: { name: string, surname: string } | null } | null
      }[] | null
    }

    const memberMap: Record<string, { name: string, surname: string }> = {}
    for (const m of memberRows ?? []) {
      const student = Array.isArray(m.Student) ? m.Student[0] : m.Student
      const u = student ? (Array.isArray(student.User) ? student.User[0] : student.User) : null
      if (u) memberMap[m.studentId] = { name: u.name, surname: u.surname }
    }
    const memberIds = Object.keys(memberMap)

    // Fetch homework/test submissions with grades for this group's students
    // Using HomeworkSubmission as proxy for graded work
    const { data: submissions } = await supabase
      .from('HomeworkSubmission')
      .select('studentId, grade, Homework!homeworkId ( id, title, createdAt, groupId )')
      .in('studentId', memberIds.length > 0 ? memberIds : ['none'])
      .not('grade', 'is', null) as unknown as {
      data: {
        studentId: string
        grade: number
        Homework: { id: string, title: string, createdAt: string, groupId: string | null } | null
      }[] | null
    }

    // Group submissions by homework (test proxy)
    const hwMap: Record<string, {
      id: string
      title: string
      createdAt: string
      submissions: { studentId: string, grade: number }[]
    }> = {}

    for (const sub of submissions ?? []) {
      const hw = Array.isArray(sub.Homework) ? sub.Homework[0] : sub.Homework
      if (!hw) continue
      if (!hwMap[hw.id]) {
        hwMap[hw.id] = { id: hw.id, title: hw.title, createdAt: hw.createdAt, submissions: [] }
      }
      hwMap[hw.id]!.submissions.push({ studentId: sub.studentId, grade: sub.grade })
    }

    const tests: TestRow[] = Object.values(hwMap).map((hw) => {
      const scores = hw.submissions.map(s => s.grade)
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      const submittedIds = new Set(hw.submissions.map(s => s.studentId))

      const failedStudents = hw.submissions
        .filter(s => s.grade < 65)
        .map(s => ({ ...memberMap[s.studentId] ?? { name: '?', surname: '?' }, score: s.grade }))

      const missedStudents = memberIds
        .filter(id => !submittedIds.has(id))
        .map(id => memberMap[id] ?? { name: '?', surname: '?' })

      return {
        id: hw.id,
        title: hw.title,
        createdAt: hw.createdAt,
        avgScore,
        totalAttempts: scores.length,
        failedStudents,
        missedStudents
      }
    })

    const avgPct = tests.length > 0
      ? Math.round(tests.reduce((s, t) => s + t.avgScore, 0) / tests.length)
      : 0

    groupPerfs.push({
      id: g.id,
      name: g.name,
      level: g.level,
      teacherName,
      avgPct,
      testCount: tests.length,
      tests,
      expanded: false
    })
  }

  return groupPerfs
})

// ─── Filters ──────────────────────────────────────────────────────────────────

const filterLevel = ref<string | null>(null)
const filterTeacher = ref<string | null>(null)

const levelOptions = [
  { label: 'Все уровни', value: null },
  ...['A1', 'A2', 'S1', 'S2', 'B2', 'F1', 'F2', 'F3', 'F4'].map(l => ({ label: l, value: l }))
]

const teacherOptions = computed(() => {
  const names = [...new Set((groups.value ?? []).map(g => g.teacherName))].filter(n => n !== '—')
  return [{ label: 'Все учителя', value: null }, ...names.map(n => ({ label: n, value: n }))]
})

const filtered = computed(() => {
  let list = groups.value ?? []
  if (filterLevel.value) list = list.filter(g => g.level === filterLevel.value)
  if (filterTeacher.value) list = list.filter(g => g.teacherName === filterTeacher.value)
  return list
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BadgeColor = 'info' | 'warning' | 'success' | 'error' | 'neutral'

const perfColor = (pct: number): string => {
  if (pct >= 85) return 'text-green-600 dark:text-green-400'
  if (pct >= 65) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

const perfBg = (pct: number): string => {
  if (pct >= 85) return 'bg-green-500'
  if (pct >= 65) return 'bg-amber-500'
  return 'bg-red-500'
}

const levelColor = (level: string): BadgeColor => {
  const map: Record<string, BadgeColor> = {
    A1: 'info', A2: 'info', S1: 'warning', S2: 'warning',
    B2: 'success', F1: 'error', F2: 'error', F3: 'error', F4: 'error'
  }
  return map[level] ?? 'neutral'
}

const toggleExpand = (g: GroupPerf) => {
  g.expanded = !g.expanded
}

const summary = computed(() => {
  const list = filtered.value
  if (!list.length) return null
  const withTests = list.filter(g => g.testCount > 0)
  const avg = withTests.length
    ? Math.round(withTests.reduce((s, g) => s + g.avgPct, 0) / withTests.length)
    : 0
  return {
    total: list.length,
    green: list.filter(g => g.avgPct >= 85).length,
    amber: list.filter(g => g.avgPct >= 65 && g.avgPct < 85).length,
    red: list.filter(g => g.avgPct < 65 && g.testCount > 0).length,
    avg
  }
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold">
        Тестирование
      </h1>
      <p class="text-sm text-muted mt-0.5">
        Аналитика успеваемости по группам на основе оценённых работ
      </p>
    </div>

    <!-- Summary cards -->
    <div
      v-if="summary"
      class="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      <UCard>
        <div class="text-center">
          <p class="text-3xl font-black tabular-nums">
            {{ summary.avg }}%
          </p>
          <p class="text-xs text-muted mt-1">
            Средний балл по школе
          </p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-3xl font-black tabular-nums text-green-500">
            {{ summary.green }}
          </p>
          <p class="text-xs text-muted mt-1">
            Групп 85%+ (отлично)
          </p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-3xl font-black tabular-nums text-amber-500">
            {{ summary.amber }}
          </p>
          <p class="text-xs text-muted mt-1">
            Групп 65–84% (внимание)
          </p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-3xl font-black tabular-nums text-red-500">
            {{ summary.red }}
          </p>
          <p class="text-xs text-muted mt-1">
            Групп &lt;65% (критично)
          </p>
        </div>
      </UCard>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3 flex-wrap">
      <USelect
        v-model="filterLevel"
        :items="levelOptions"
        class="w-36"
      />
      <USelect
        v-model="filterTeacher"
        :items="teacherOptions"
        class="w-52"
      />
    </div>

    <!-- Loading -->
    <div
      v-if="pending"
      class="flex justify-center py-20"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <!-- Groups table -->
    <UCard
      v-else
      :ui="{ body: 'p-0' }"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-subtle bg-muted/10">
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Группа
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Учитель
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              Тестов
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide w-48">
              Средний балл
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          <template
            v-for="g in filtered"
            :key="g.id"
          >
            <!-- Group row -->
            <tr
              class="border-b border-subtle hover:bg-muted/10 transition-colors cursor-pointer"
              @click="toggleExpand(g)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="font-semibold">{{ g.name }}</span>
                  <UBadge
                    :color="levelColor(g.level)"
                    variant="subtle"
                    size="xs"
                  >
                    {{ g.level }}
                  </UBadge>
                </div>
              </td>
              <td class="px-4 py-3 text-muted">
                {{ g.teacherName }}
              </td>
              <td class="px-4 py-3 text-center font-semibold">
                {{ g.testCount }}
              </td>
              <td class="px-4 py-3">
                <div
                  v-if="g.testCount > 0"
                  class="flex items-center gap-2"
                >
                  <span
                    class="font-bold tabular-nums text-base w-12"
                    :class="perfColor(g.avgPct)"
                  >{{ g.avgPct }}%</span>
                  <div class="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="perfBg(g.avgPct)"
                      :style="{ width: `${g.avgPct}%` }"
                    />
                  </div>
                </div>
                <span
                  v-else
                  class="text-muted text-xs"
                >Нет данных</span>
              </td>
              <td class="px-4 py-3">
                <UIcon
                  :name="g.expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="size-4 text-muted"
                />
              </td>
            </tr>

            <!-- Expanded: test breakdown -->
            <tr
              v-if="g.expanded && g.tests.length"
              class="border-b border-subtle bg-muted/5"
            >
              <td
                colspan="5"
                class="px-6 py-4"
              >
                <p class="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                  Работы группы
                </p>
                <div class="space-y-3">
                  <div
                    v-for="test in g.tests"
                    :key="test.id"
                    class="bg-background rounded-lg border border-subtle p-3"
                  >
                    <div class="flex items-center justify-between gap-4 flex-wrap mb-2">
                      <div>
                        <p class="font-semibold text-sm">
                          {{ test.title }}
                        </p>
                        <p class="text-xs text-muted">
                          {{ new Date(test.createdAt).toLocaleDateString('ru-RU') }}
                          · {{ test.totalAttempts }} сдач
                        </p>
                      </div>
                      <span
                        class="font-bold text-lg tabular-nums"
                        :class="perfColor(test.avgScore)"
                      >{{ test.avgScore }}%</span>
                    </div>

                    <!-- Failed students -->
                    <div
                      v-if="test.failedStudents.length"
                      class="mt-2"
                    >
                      <p class="text-xs text-muted mb-1">
                        Провалили (&lt;65%):
                      </p>
                      <div class="flex flex-wrap gap-1.5">
                        <UBadge
                          v-for="s in test.failedStudents"
                          :key="`${s.surname}${s.name}`"
                          color="error"
                          variant="subtle"
                          size="xs"
                        >
                          {{ s.surname }} {{ s.name }} — {{ s.score }}%
                        </UBadge>
                      </div>
                    </div>

                    <!-- Missed students -->
                    <div
                      v-if="test.missedStudents.length"
                      class="mt-2"
                    >
                      <p class="text-xs text-muted mb-1">
                        Не сдали:
                      </p>
                      <div class="flex flex-wrap gap-1.5">
                        <UBadge
                          v-for="s in test.missedStudents"
                          :key="`${s.surname}${s.name}`"
                          color="neutral"
                          variant="subtle"
                          size="xs"
                        >
                          {{ s.surname }} {{ s.name }}
                        </UBadge>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Expanded but no tests -->
            <tr
              v-else-if="g.expanded && !g.tests.length"
              class="border-b border-subtle bg-muted/5"
            >
              <td
                colspan="5"
                class="px-6 py-6 text-center text-muted text-sm"
              >
                По этой группе нет оценённых работ
              </td>
            </tr>
          </template>

          <tr v-if="!filtered.length && !pending">
            <td
              colspan="5"
              class="px-4 py-12 text-center text-muted"
            >
              Группы не найдены
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>

    <!-- Legend -->
    <div class="flex items-center gap-6 text-xs text-muted">
      <div class="flex items-center gap-1.5">
        <div class="size-2.5 rounded-full bg-green-500" />
        <span>85–100% — Отлично</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="size-2.5 rounded-full bg-amber-500" />
        <span>65–84% — Требует внимания</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="size-2.5 rounded-full bg-red-500" />
        <span>0–64% — Критический уровень</span>
      </div>
    </div>
  </div>
</template>
