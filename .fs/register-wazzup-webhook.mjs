import { readFileSync } from 'node:fs'

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

const key = env.WAZZUP_API_KEY
const secret = env.WAZZUP_WEBHOOK_SECRET
if (!key || !secret) {
  console.error('WAZZUP_API_KEY or WAZZUP_WEBHOOK_SECRET missing in .env.lingaphone')
  process.exit(1)
}

const webhooksUri = `https://lingaphone-two.vercel.app/api/wazzup/webhook?token=${secret}`

const res = await fetch('https://api.wazzup24.com/v3/webhooks', {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    webhooksUri,
    subscriptions: { messagesAndStatuses: true, contactsAndDealsCreation: false }
  })
})

const text = await res.text()
console.log('status:', res.status)
console.log(text)
