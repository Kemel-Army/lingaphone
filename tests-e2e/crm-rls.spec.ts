import { test, expect } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * RLS-изоляция новых сущностей ТЗ (CRM / финансы / кабинет родителя) + регрессия
 * бесконечной рекурсии родительских политик (Homework ↔ HomeworkSubmission).
 *
 * Создаёт живых акторов (родитель + ребёнок-ученик) через service role, затем
 * проверяет доступ РЕАЛЬНЫМИ JWT (RLS — предмет теста):
 *   - родитель видит платежи/абонементы своего ребёнка, НЕ видит лидов
 *   - родитель может читать Homework без 500 (рекурсия пофикшена)
 *   - ученик НЕ видит финансы и лидов
 *   - админ видит лидов
 * Всё создаётся и удаляется внутри теста (hermetic).
 */

function loadEnv() {
  const file = ['.env.lingaphone', '.env'].map(f => resolve(process.cwd(), f)).find(p => existsSync(p))
  if (!file) throw new Error('no .env(.lingaphone) found')
  const raw = readFileSync(file, 'utf8')
  const get = (k: string) => raw.split('\n').find(l => l.startsWith(`${k}=`))?.slice(k.length + 1).trim().replace(/^"|"$/g, '') ?? ''
  return { URL: get('SUPABASE_URL'), ANON: get('SUPABASE_KEY'), SVC: get('SUPABASE_SERVICE_KEY') }
}
const { URL: SUPA, ANON, SVC } = loadEnv()
const TS = String(Date.now()).slice(-9)
const PW = 'E2eRls!2345'
const PARENT_EMAIL = `e2e_rls_parent_${TS}@linga.kz`
const CHILD_EMAIL = `e2e_rls_child_${TS}@linga.kz`

function rest(token: string, apiKey: string = ANON) {
  return async (path: string, init: RequestInit = {}) => {
    const r = await fetch(`${SUPA}/rest/v1/${path}`, {
      ...init,
      headers: { 'apikey': apiKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }
    })
    const text = await r.text()
    return { status: r.status, body: text ? JSON.parse(text) : null }
  }
}
const svc = rest(SVC, SVC)

async function gotrueToken(email: string, password: string): Promise<string> {
  const r = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const j = await r.json()
  if (!j.access_token) throw new Error(`login failed ${email}: ${JSON.stringify(j)}`)
  return j.access_token
}
async function createAuthUser(email: string, meta: object): Promise<string> {
  const r = await fetch(`${SUPA}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PW, email_confirm: true, user_metadata: meta })
  })
  const j = await r.json()
  if (!j.id) throw new Error(`createUser failed ${email}: ${JSON.stringify(j)}`)
  return j.id
}
async function insert(table: string, row: object): Promise<Record<string, string>> {
  const { status, body } = await svc(table, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) })
  if (status >= 300) throw new Error(`insert ${table} ${status}: ${JSON.stringify(body)}`)
  return body[0] as Record<string, string>
}

const ids: { parentAuth?: string, childAuth?: string, parentUser?: string, childUser?: string, parentRow?: string, studentRow?: string, leadId?: string } = {}

test.describe.configure({ mode: 'serial' })

test.describe('RLS · CRM/финансы/родитель', () => {
  test.beforeAll(async () => {
    // Actors
    ids.parentAuth = await createAuthUser(PARENT_EMAIL, { name: 'RLS', surname: 'Parent', role: 'PARENT' })
    ids.childAuth = await createAuthUser(CHILD_EMAIL, { name: 'RLS', surname: 'Child', role: 'STUDENT' })

    const pUser = await insert('User', { authId: ids.parentAuth, email: PARENT_EMAIL, name: 'RLS', surname: 'Parent', role: 'PARENT' })
    const cUser = await insert('User', { authId: ids.childAuth, email: CHILD_EMAIL, name: 'RLS', surname: 'Child', role: 'STUDENT' })
    ids.parentUser = pUser.id
    ids.childUser = cUser.id

    const parent = await insert('Parent', { userId: ids.parentUser })
    const student = await insert('Student', { userId: ids.childUser, level: 'A1' })
    ids.parentRow = parent.id
    ids.studentRow = student.id

    await insert('ParentToStudent', { parentId: ids.parentRow, studentId: ids.studentRow })
    await insert('Payment', { studentId: ids.studentRow, amount: 12345 })
    await insert('Subscription', { studentId: ids.studentRow, plan: 'RLS Test', price: 40000 })
    const lead = await insert('Lead', { fullName: `RLS Lead ${TS}` })
    ids.leadId = lead.id
  })

  test.afterAll(async () => {
    if (ids.studentRow) {
      await svc(`Payment?studentId=eq.${ids.studentRow}`, { method: 'DELETE' })
      await svc(`Subscription?studentId=eq.${ids.studentRow}`, { method: 'DELETE' })
      await svc(`ParentToStudent?studentId=eq.${ids.studentRow}`, { method: 'DELETE' })
      await svc(`Student?id=eq.${ids.studentRow}`, { method: 'DELETE' })
    }
    if (ids.parentRow) await svc(`Parent?id=eq.${ids.parentRow}`, { method: 'DELETE' })
    if (ids.leadId) await svc(`Lead?id=eq.${ids.leadId}`, { method: 'DELETE' })
    await svc(`User?email=in.(${PARENT_EMAIL},${CHILD_EMAIL})`, { method: 'DELETE' })
    for (const aid of [ids.parentAuth, ids.childAuth].filter(Boolean)) {
      await fetch(`${SUPA}/auth/v1/admin/users/${aid}`, { method: 'DELETE', headers: { apikey: SVC, Authorization: `Bearer ${SVC}` } })
    }
  })

  test('родитель видит платёж и абонемент своего ребёнка', async () => {
    const p = rest(await gotrueToken(PARENT_EMAIL, PW))
    const pay = await p(`Payment?studentId=eq.${ids.studentRow}&select=id,amount`)
    expect(pay.status).toBe(200)
    expect(pay.body.length).toBe(1)
    const sub = await p(`Subscription?studentId=eq.${ids.studentRow}&select=id`)
    expect(sub.body.length).toBe(1)
  })

  test('родитель НЕ видит лидов', async () => {
    const p = rest(await gotrueToken(PARENT_EMAIL, PW))
    const lead = await p(`Lead?id=eq.${ids.leadId}&select=id`)
    expect(lead.status).toBe(200)
    expect(lead.body.length).toBe(0)
  })

  test('родитель читает Homework без рекурсии (регрессия 500)', async () => {
    const p = rest(await gotrueToken(PARENT_EMAIL, PW))
    const hw = await p('Homework?select=id&limit=1')
    expect(hw.status).toBe(200) // не 500 infinite recursion
    const grp = await p('Group?select=id&limit=1')
    expect(grp.status).toBe(200)
    const lsn = await p('Lesson?select=id&limit=1')
    expect(lsn.status).toBe(200)
  })

  test('ученик НЕ видит финансы и лидов', async () => {
    const s = rest(await gotrueToken(CHILD_EMAIL, PW))
    const pay = await s(`Payment?studentId=eq.${ids.studentRow}&select=id`)
    expect(pay.body.length).toBe(0)
    const lead = await s(`Lead?id=eq.${ids.leadId}&select=id`)
    expect(lead.body.length).toBe(0)
  })

  test('админ видит лид', async () => {
    const a = rest(await gotrueToken('admin@linga.kz', 'password123'))
    const lead = await a(`Lead?id=eq.${ids.leadId}&select=id`)
    expect(lead.status).toBe(200)
    expect(lead.body.length).toBe(1)
  })
})
