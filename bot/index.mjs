import { createMestoBot } from './create-bot.mjs'
import { assertPollingIsSafe } from './config.mjs'

const token = process.env.BOT_TOKEN
const appUrl = process.env.MINI_APP_URL
if (!token || !appUrl) throw new Error('Set BOT_TOKEN and MINI_APP_URL before starting the bot')
const bot = createMestoBot(token, appUrl)
const webhook = await bot.api.getWebhookInfo()
assertPollingIsSafe(webhook)
await bot.start()
