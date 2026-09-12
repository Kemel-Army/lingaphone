/**
 * GET /api/admin/motivation?month=YYYY-MM[&groupId=…]   (ADMIN | DIRECTOR | TEACHER)
 *
 * Сводная «мотивашки» за месяц — аналог листа «Сводная таблица <месяц>».
 * Считает на лету (ничего не пишет): средний балл, медаль, бонус.
 * Запись в MonthlyMedal делает /api/admin/motivation/recompute.
 *
 * Преподаватель видит только свои группы; админ и директор — всю школу.
 */
import { buildMonthlySummary } from '../../../utils/motivationQuery'
import { resolveTeacherScope, assertGroupInScope } from '../../../utils/teacherScope'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN', 'DIRECTOR', 'TEACHER'])
  const supabase = useServerSupabase(event)

  const query = getQuery(event)
  const month = (query.month as string | undefined) ?? ''
  const groupId = (query.groupId as string | undefined) || null

  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw createError({ statusCode: 400, message: 'month должен быть в формате YYYY-MM' })
  }

  // Без этой проверки преподаватель без `groupId` получил бы бонусы всей
  // школы, а с чужим `groupId` — чужой класс.
  const scope = await resolveTeacherScope(supabase, (user.sub as string | undefined) ?? user.id)
  if (groupId) assertGroupInScope(scope, groupId)

  return await buildMonthlySummary(supabase, month, groupId, scope.groupIds)
})
