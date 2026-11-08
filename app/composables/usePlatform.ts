import { computed } from 'vue'
import { useRoute } from '#app'

export function usePlatform() {
  const route = useRoute()
  const path = computed(() => route.path.replace(/^\/tg(?=\/|$)/, '') || '/')
  const isTg = computed(() => route.path === '/tg' || route.path.startsWith('/tg/'))
  const isHost = computed(() => path.value.startsWith('/host'))
  const link = (value: string) => isTg.value ? `/tg${value === '/' ? '' : value}` : value
  return { path, isTg, isHost, link }
}
