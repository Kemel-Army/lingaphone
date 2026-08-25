// Temp-password + auto-login generation for self-serve family registration.
// Mirrors the exclusion set used by the bulk teacher account script (drop
// visually-confusable characters: 0/O, 1/l/I).

const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

export function generateTempPassword(length = 10): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)]
  }
  return out
}

const TRANSLIT_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  ә: 'a', ғ: 'g', қ: 'k', ң: 'n', ө: 'o', ұ: 'u', ү: 'u', һ: 'h', і: 'i'
}

export function transliterate(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map(ch => TRANSLIT_MAP[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]/g, '')
}

/** Builds a login email for an auto-provisioned student account. */
export function studentLoginEmail(name: string, surname: string): string {
  const base = `${transliterate(surname)}.${transliterate(name)}`.replace(/^\.+|\.+$/g, '') || 'student'
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${base}${suffix}@student.lingaphone.kz`
}
