/**
 * Run SQL against the linked Supabase project via the Management API.
 *
 *   node scripts/supabase-sql.mjs "select 1"
 *   node scripts/supabase-sql.mjs --file supabase/migrations/xxx.sql
 *
 * Reads SUPABASE_ACCESS_TOKEN from .env.lingaphone. Requires a personal access
 * token (sbp_…) from https://supabase.com/dashboard/account/tokens.
 */
import { readFileSync } from 'node:fs'

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? 'owiaccgxbejsgtyhhtrd'

const env = Object.fromEntries(
  readFileSync('.env.lingaphone', 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')]
    })
)

const token = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('SUPABASE_ACCESS_TOKEN is not set')
  process.exit(1)
}

const args = process.argv.slice(2)
const query = args[0] === '--file' ? readFileSync(args[1], 'utf8') : args.join(' ')
if (!query.trim()) {
  console.error('usage: node scripts/supabase-sql.mjs "<sql>" | --file <path>')
  process.exit(1)
}

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  }
)

const text = await res.text()
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${text}`)
  process.exit(1)
}

try {
  console.log(JSON.stringify(JSON.parse(text), null, 2))
} catch {
  console.log(text)
}
