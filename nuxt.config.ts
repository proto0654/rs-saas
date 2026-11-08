import tailwindcss from '@tailwindcss/vite'
import { brandName } from './shared/brand'
import seed from './demo/seed.json'
import { locations } from './shared/locations'
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  runtimeConfig: { public: { yandexMapsKey: '' } },
  nitro: { prerender: { routes: ['/search', ...seed.properties.filter(property => property.status === 'published').map(property => `/stays/${property.id}`), ...locations.map(location => `/locations/${location.slug}`)] } },
  modules: ['@pinia/nuxt'], css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  app: { head: { htmlAttrs: { lang: 'ru', 'data-theme': 'mesto' }, title: `${brandName} — жильё на юге` } },
  routeRules: { '/host': { ssr: false }, '/host/**': { ssr: false }, '/checkout/**': { ssr: false }, '/bookings': { ssr: false }, '/favorites': { ssr: false }, '/profile': { ssr: false }, '/tg': { ssr: false }, '/tg/**': { ssr: false } },
})
