import { telegramAdapter } from '../utils/telegram'

export default defineNuxtPlugin(nuxtApp => {
  const router = useRouter()
  const adapter = telegramAdapter(() => window.Telegram?.WebApp, () => router.back(), document.documentElement.style)
  const sync = () => adapter.sync(router.currentRoute.value.path)
  const removeRouteListener = router.afterEach(sync)
  window.addEventListener('load', sync, { once: true })
  window.addEventListener('telegram-web-app-ready', sync)
  sync()
  nuxtApp.vueApp.onUnmount(() => {
    removeRouteListener()
    window.removeEventListener('load', sync)
    window.removeEventListener('telegram-web-app-ready', sync)
    adapter.dispose()
  })
})
