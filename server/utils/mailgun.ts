import Mailgun from 'mailgun.js'
import FormData from 'form-data'

const mailgun = new Mailgun(FormData)

type EmailTemplate = 'welcome' | 'early-warning' | 'homework-due' | 'payment-receipt' | 'parent-child-invite' | 'parent-weekly-summary' | 'generic'

interface TemplateVars {
  userName?: string
  homeworkTitle?: string
  dueDate?: string
  amount?: string
  warningMessage?: string
  [key: string]: string | undefined
}

const TEMPLATES: Record<EmailTemplate, { subject: (v: TemplateVars) => string, html: (v: TemplateVars) => string }> = {
  'welcome': {
    subject: () => 'Добро пожаловать в FEMO!',
    html: v => wrapHtmlLayout(`
      <h2>Добро пожаловать, ${esc(v.userName ?? 'Ученик')}!</h2>
      <p>Вы успешно зарегистрировались на платформе FEMO.</p>
      <p>Начните с прохождения диагностики, чтобы мы подобрали для вас оптимальную программу обучения.</p>
      <a href="${esc(getAppUrl())}/diagnostics" style="display:inline-block;padding:12px 24px;background:#16A34A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Пройти диагностику</a>
    `)
  },
  'early-warning': {
    subject: () => 'Внимание: снижение успеваемости',
    html: v => wrapHtmlLayout(`
      <h2>Предупреждение</h2>
      <p>${esc(v.userName ?? '')}, мы заметили изменения в вашей активности:</p>
      <div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:12px 16px;border-radius:4px;margin:16px 0">
        ${esc(v.warningMessage ?? 'Обратите внимание на свою активность на платформе.')}
      </div>
      <p>Не забрасывайте обучение — регулярность важнее интенсивности!</p>
    `)
  },
  'homework-due': {
    subject: v => `Напоминание: ДЗ "${v.homeworkTitle ?? ''}" скоро истекает`,
    html: v => wrapHtmlLayout(`
      <h2>Домашнее задание</h2>
      <p>${esc(v.userName ?? '')}, не забудьте сдать ДЗ:</p>
      <p><strong>${esc(v.homeworkTitle ?? '')}</strong></p>
      <p>Срок сдачи: <strong>${esc(v.dueDate ?? '')}</strong></p>
      <a href="${esc(getAppUrl())}/student/tasks?tab=homework" style="display:inline-block;padding:12px 24px;background:#16A34A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Перейти к ДЗ</a>
    `)
  },
  'payment-receipt': {
    subject: () => 'Оплата подтверждена — FEMO',
    html: v => wrapHtmlLayout(`
      <h2>Оплата подтверждена</h2>
      <p>${esc(v.userName ?? '')}, ваша оплата прошла успешно.</p>
      <div style="background:#F0FDF4;border:1px solid #16A34A;border-radius:8px;padding:16px;margin:16px 0">
        <p style="font-size:24px;font-weight:700;color:#16A34A;margin:0">${esc(v.amount ?? '')}</p>
      </div>
      <a href="${esc(getAppUrl())}/student" style="display:inline-block;padding:12px 24px;background:#16A34A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Перейти к обучению</a>
    `)
  },
  'parent-child-invite': {
    subject: v => `${v.userName ?? 'Ваш родитель'} приглашает вас на FEMO`,
    html: v => wrapHtmlLayout(`
      <h2>Приглашение от ${esc(v.userName ?? 'родителя')}</h2>
      <p>${esc(v.userName ?? 'Ваш родитель')} зарегистрировался на образовательной платформе FEMO и хочет добавить вас как своего ребёнка для отслеживания прогресса.</p>
      <p>Зарегистрируйтесь по ссылке ниже — после подтверждения email мы автоматически свяжем ваш аккаунт с родительским.</p>
      <a href="${esc(v.inviteUrl ?? getAppUrl())}" style="display:inline-block;padding:12px 24px;background:#16A34A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Зарегистрироваться</a>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8">Если вы не ждали этого приглашения — просто проигнорируйте письмо.</p>
    `)
  },
  'parent-weekly-summary': {
    subject: v => `Сводка за неделю — ${v.userName ?? 'ваш ребёнок'}`,
    html: v => wrapHtmlLayout(`
      <h2>Сводка за неделю</h2>
      <p>Здравствуйте! Вот короткий отчёт о ${esc(v.userName ?? 'вашем ребёнке')} за прошедшую неделю на FEMO.</p>
      <div style="background:#F0FDF4;border-left:4px solid #16A34A;padding:16px 20px;border-radius:6px;margin:16px 0;line-height:1.6">
        ${esc(v.warningMessage ?? '').replace(/\n/g, '<br/>')}
      </div>
      <a href="${esc(getAppUrl())}/parent" style="display:inline-block;padding:12px 24px;background:#16A34A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Открыть кабинет родителя</a>
    `)
  },
  'generic': {
    subject: v => v.userName ? `${v.userName}, у вас новое уведомление` : 'Уведомление от FEMO',
    html: v => wrapHtmlLayout(`
      <h2>${esc(v.userName ?? 'Уведомление')}</h2>
      <p>${esc(v.warningMessage ?? '')}</p>
    `)
  }
}

function getAppUrl(): string {
  return process.env.APP_URL ?? 'https://femo.kz'
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function wrapHtmlLayout(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
  <div style="background:#16A34A;padding:24px;text-align:center">
    <span style="color:#fff;font-size:20px;font-weight:700">FEMO</span>
  </div>
  <div style="padding:32px 24px">${content}</div>
  <div style="padding:16px 24px;background:#f8fafc;text-align:center;font-size:12px;color:#94a3b8">
    © ${new Date().getFullYear()} FEMO. Все права защищены.
  </div>
</div></body></html>`
}

function getMailgunClient() {
  const config = useRuntimeConfig()
  const apiKey = config.mailgunApiKey as string
  const domain = config.mailgunDomain as string

  if (!apiKey || !domain) return null

  const client = mailgun.client({ username: 'api', key: apiKey })
  return { client, domain }
}

/**
 * Send a templated email.
 */
export async function sendTemplatedEmail(
  to: string | string[],
  template: EmailTemplate,
  vars: TemplateVars = {}
): Promise<boolean> {
  const mg = getMailgunClient()
  if (!mg) {
    console.warn('[Mailgun] Not configured, skipping email')
    return false
  }

  const tmpl = TEMPLATES[template]
  const recipients = Array.isArray(to) ? to : [to]

  try {
    await mg.client.messages.create(mg.domain, {
      from: `FEMO <noreply@${mg.domain}>`,
      to: recipients,
      subject: tmpl.subject(vars),
      html: tmpl.html(vars)
    })
    return true
  } catch (err) {
    captureError(err, { template, to: recipients.join(',') })
    return false
  }
}

/**
 * Send bulk emails with retry (max 3 attempts per batch).
 */
export async function sendBulkEmail(
  emails: string[],
  subject: string,
  text: string,
  html?: string
): Promise<{ sent: number, failed: number }> {
  const mg = getMailgunClient()
  if (!mg) {
    console.warn('[Mailgun] Not configured, skipping bulk email')
    return { sent: 0, failed: emails.length }
  }

  const batchSize = 50
  let sent = 0
  let failed = 0
  const maxRetries = 3

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await mg.client.messages.create(mg.domain, {
          from: `FEMO <noreply@${mg.domain}>`,
          to: batch,
          subject,
          text,
          html: html ?? `<p>${esc(text)}</p>`
        })
        sent += batch.length
        break
      } catch (err) {
        if (attempt === maxRetries) {
          captureError(err, { batch: batch.join(','), attempt })
          failed += batch.length
        } else {
          // Exponential backoff
          await new Promise(r => setTimeout(r, 1000 * attempt))
        }
      }
    }
  }

  return { sent, failed }
}
