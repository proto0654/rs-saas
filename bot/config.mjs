export function miniAppUrl(value) {
  let url
  try { url = new URL(value) } catch { throw new Error('MINI_APP_URL must be an absolute HTTPS URL') }
  if (url.protocol !== 'https:') throw new Error('MINI_APP_URL must use HTTPS')
  if (url.pathname === '/') url.pathname = '/tg'
  return url.toString()
}
export function assertPollingIsSafe(webhook) {
  if (webhook.url) throw new Error('This bot already has a webhook. Use a dedicated bot token for local polling.')
}
