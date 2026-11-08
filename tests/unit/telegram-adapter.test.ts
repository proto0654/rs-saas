import { describe, it, expect, vi } from 'vitest'
import { telegramAdapter, type TelegramWebApp } from '../../app/utils/telegram'

function setup() {
  const listeners = new Map<string, () => void>()
  const app: TelegramWebApp = {
    initData: 'demo', viewportStableHeight: 700,
    safeAreaInset: { top: 20, bottom: 30 }, contentSafeAreaInset: { top: 40, bottom: 10 },
    ready: vi.fn(), expand: vi.fn(), isVersionAtLeast: () => true,
    onEvent: vi.fn((name, callback) => { listeners.set(name, callback) }),
    offEvent: vi.fn((name) => { listeners.delete(name) }),
    BackButton: { show: vi.fn(), hide: vi.fn(), onClick: vi.fn(), offClick: vi.fn() },
  }
  const style = { setProperty: vi.fn(), removeProperty: vi.fn(() => '') }
  const back = vi.fn()
  return { app, style, back, listeners, adapter: telegramAdapter(() => app, back, style) }
}
describe('Telegram platform lifecycle', () => {
  it('subscribes once, synchronizes viewport changes and cleans up', () => {
    const { app, style, back, listeners, adapter } = setup()
    adapter.sync('/tg'); adapter.sync('/tg/stays/p1')
    expect(app.BackButton!.onClick).toHaveBeenCalledExactlyOnceWith(back)
    expect(app.BackButton!.show).toHaveBeenCalledOnce()
    expect(style.setProperty).toHaveBeenCalledWith('--telegram-viewport-height', '700px')
    expect(style.setProperty).toHaveBeenCalledWith('--telegram-safe-top', '40px')
    expect(style.setProperty).toHaveBeenCalledWith('--telegram-safe-bottom', '30px')
    app.viewportStableHeight = 500
    listeners.get('viewportChanged')!()
    expect(style.setProperty).toHaveBeenLastCalledWith('--telegram-safe-bottom', '30px')
    expect(style.setProperty).toHaveBeenCalledWith('--telegram-viewport-height', '500px')
    adapter.dispose()
    expect(listeners.size).toBe(0)
    expect(app.BackButton!.offClick).toHaveBeenCalledWith(back)
    expect(style.removeProperty).toHaveBeenCalledWith('--telegram-viewport-height')
  })
  it('disconnects in web mode and supports a browser without the SDK', () => {
    const { app, adapter, listeners } = setup()
    adapter.sync('/tg/stays/p1'); adapter.sync('/search')
    expect(listeners.size).toBe(0)
    expect(app.BackButton!.hide).toHaveBeenCalled()
    const empty = telegramAdapter(() => undefined, vi.fn(), { setProperty: vi.fn(), removeProperty: vi.fn(() => '') })
    expect(() => { empty.sync('/tg'); empty.dispose() }).not.toThrow()
  })
})
