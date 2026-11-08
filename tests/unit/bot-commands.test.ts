import { describe, it, expect } from 'vitest'
import { createMestoBot } from '../../bot/create-bot.mjs'

type Reply = { text: string; reply_markup?: { inline_keyboard: { web_app: { url: string } }[][] } }
async function command(text: string, type: 'private' | 'group' = 'private') {
  const bot = createMestoBot('123:demo', 'https://example.com')
  bot.botInfo = { id: 123, is_bot: true, first_name: 'Demo', username: 'mesto_demo_bot', can_join_groups: true, can_read_all_group_messages: false, supports_inline_queries: false, can_connect_to_business: false, has_main_web_app: true }
  const calls: { method: string; payload: Reply }[] = []
  bot.api.config.use(async (_previous, method, payload) => {
    calls.push({ method, payload: payload as unknown as Reply })
    return { ok: true, result: { message_id: 1, date: 0, chat: { id: 10, type: 'private' }, text: 'reply' } } as never
  })
  await bot.handleUpdate({ update_id: 1, message: { message_id: 1, date: 0, from: { id: 10, is_bot: false, first_name: 'Demo' }, chat: { id: 10, type, title: 'Demo' }, text, entities: [{ type: 'bot_command', offset: 0, length: text.length }] } })
  return calls
}
describe('grammY command handling with intercepted API calls', () => {
  it('responds to start with a Mini App button', async () => {
    const calls = await command('/start')
    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe('sendMessage')
    expect(calls[0].payload.reply_markup!.inline_keyboard[0][0].web_app.url).toBe('https://example.com/tg')
    expect(calls[0].payload.text).toContain('демонстрационный')
    expect(calls[0].payload.text).toContain('Локаль')
  })
  it('provides help and a group-chat fallback', async () => {
    expect((await command('/help'))[0].payload.text).toContain('/start')
    const group = (await command('/start', 'group'))[0].payload
    expect(group.text).toContain('личный чат')
    expect(group.reply_markup).toBeUndefined()
  })
})
