import { Bot, InlineKeyboard } from 'grammy'
import { miniAppUrl } from './config.mjs'
import { brandName } from '../shared/brand.ts'

export function createMestoBot(token, appUrl) {
  const url = miniAppUrl(appUrl)
  const bot = new Bot(token)
  bot.command('start', async ctx => {
    if (ctx.chat.type !== 'private') return ctx.reply('Откройте личный чат с ботом и отправьте /start, чтобы запустить приложение.')
    const keyboard = new InlineKeyboard().webApp(`Открыть ${brandName}`, url)
    await ctx.reply(`Привет! Это ${brandName} — ваше жильё на юге. Это демонстрационный сервис: бронирования и оплата ненастоящие.`, { reply_markup: keyboard })
  })
  bot.command('help', ctx => ctx.reply('Откройте Mini App командой /start. Поиск, бронирование и кабинет хозяина доступны в приложении.'))
  bot.catch(error => console.error('Telegram bot update failed', { updateId: error.ctx.update.update_id }))
  return bot
}
