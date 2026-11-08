let apiV3Promise: Promise<any> | undefined
let apiV2Promise: Promise<any> | undefined

export function resetYandexMapLoaders() {
  apiV3Promise = undefined
  apiV2Promise = undefined
}

export function loadYandexApiV3(key: string) {
  if (apiV3Promise) return apiV3Promise
  apiV3Promise = new Promise((resolve, reject) => {
    let script: HTMLScriptElement | undefined
    let timeout: number | undefined
    let stage = 'script'
    const fail = () => { if (script) script.remove(); reject(new Error(`Yandex Maps ${stage} unavailable`)) }
    const initialize = async () => {
      try {
        const api = (window as any).ymaps3
        if (!api) throw new Error('API not loaded')
        stage = 'initialization'
        await api.ready
        stage = 'packages'
        api.import.registerCdn('https://cdn.jsdelivr.net/npm/{package}', [
          '@yandex/ymaps3-clusterer@0.0',
        ])
        const cluster = await api.import('@yandex/ymaps3-clusterer')
        window.clearTimeout(timeout)
        resolve({ api, cluster })
      } catch { window.clearTimeout(timeout); fail() }
    }
    timeout = window.setTimeout(fail, 12000)
    if ((window as any).ymaps3) { initialize(); return }
    script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(key)}&lang=ru_RU`
    script.async = true
    script.onload = () => { void initialize() }
    script.onerror = () => { window.clearTimeout(timeout); fail() }
    document.head.appendChild(script)
  }).catch(error => { apiV3Promise = undefined; throw error })
  return apiV3Promise
}

export function loadYandexApiV2(key: string) {
  if (apiV2Promise) return apiV2Promise
  apiV2Promise = new Promise((resolve, reject) => {
    const ymaps = (window as any).ymaps
    if (ymaps) { ymaps.ready(() => resolve(ymaps)); return }
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(key)}&lang=ru_RU`
    script.async = true
    const timeout = window.setTimeout(() => reject(new Error('Yandex Maps 2.1 unavailable')), 12000)
    script.onload = () => (window as any).ymaps
      ? (window as any).ymaps.ready(() => { window.clearTimeout(timeout); resolve((window as any).ymaps) })
      : (window.clearTimeout(timeout), reject(new Error('Yandex Maps 2.1 unavailable')))
    script.onerror = () => { window.clearTimeout(timeout); reject(new Error('Yandex Maps 2.1 unavailable')) }
    document.head.appendChild(script)
  }).catch(error => { apiV2Promise = undefined; throw error })
  return apiV2Promise
}
