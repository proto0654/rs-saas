import { describe, expect, it } from 'vitest'
import { assertPollingIsSafe, miniAppUrl } from '../../bot/config.mjs'
describe('Telegram bot configuration', () => {
  it('uses the Mini App path for a bare HTTPS origin', () => {
    expect(miniAppUrl('https://example.com')).toBe('https://example.com/tg')
    expect(miniAppUrl('https://example.com/custom')).toBe('https://example.com/custom')
    expect(() => miniAppUrl('http://example.com')).toThrow()
    expect(() => miniAppUrl('not a url')).toThrow()
  })
  it('never starts polling when another webhook is configured', () => {
    expect(() => assertPollingIsSafe({ url: 'https://example.com/hook' })).toThrow()
    expect(() => assertPollingIsSafe({ url: '' })).not.toThrow()
  })
})
