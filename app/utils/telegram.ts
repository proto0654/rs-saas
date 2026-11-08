interface Insets { top?: number; bottom?: number }
export interface TelegramWebApp {
  initData?: string
  viewportStableHeight?: number
  safeAreaInset?: Insets
  contentSafeAreaInset?: Insets
  isVersionAtLeast?: (version: string) => boolean
  ready(): void
  expand(): void
  onEvent?: (name: string, callback: () => void) => void
  offEvent?: (name: string, callback: () => void) => void
  BackButton?: { show(): void; hide(): void; onClick(callback: () => void): void; offClick(callback: () => void): void }
}
const events = ['viewportChanged', 'safeAreaChanged', 'contentSafeAreaChanged']
const variables = ['--telegram-viewport-height', '--telegram-safe-top', '--telegram-safe-bottom'] as const
const inset = (value?: number) => Number.isFinite(value) && Number(value) > 0 ? Number(value) : 0

export function telegramAdapter(getApp: () => TelegramWebApp | undefined, back: () => void, style: Pick<CSSStyleDeclaration, 'setProperty' | 'removeProperty'>) {
  let app: TelegramWebApp | undefined
  let disposed = false
  const clearStyles = () => variables.forEach(name => style.removeProperty(name))
  const updateViewport = () => {
    if (!app) return
    const height = inset(app.viewportStableHeight)
    if (height) style.setProperty(variables[0], `${height}px`)
    style.setProperty(variables[1], `${Math.max(inset(app.safeAreaInset?.top), inset(app.contentSafeAreaInset?.top))}px`)
    style.setProperty(variables[2], `${Math.max(inset(app.safeAreaInset?.bottom), inset(app.contentSafeAreaInset?.bottom))}px`)
  }
  const disconnect = () => {
    app?.BackButton?.offClick(back)
    events.forEach(name => app?.offEvent?.(name, updateViewport))
    app?.BackButton?.hide()
    app = undefined
    clearStyles()
  }
  function sync(path: string) {
    if (disposed) return
    const next = getApp()
    if (!next?.initData || !next.isVersionAtLeast?.('6.1') || !(path === '/tg' || path.startsWith('/tg/'))) { if (app) disconnect(); return }
    if (app !== next) {
      disconnect()
      app = next
      app.ready()
      app.expand()
      app.BackButton?.onClick(back)
      events.forEach(name => app?.onEvent?.(name, updateViewport))
    }
    if (path === '/tg') app.BackButton?.hide()
    else app.BackButton?.show()
    updateViewport()
  }
  return { sync, dispose() { disconnect(); disposed = true } }
}
