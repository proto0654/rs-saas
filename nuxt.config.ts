import tailwindcss from '@tailwindcss/vite'
import { brandName } from './shared/brand'
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  runtimeConfig: { public: { yandexMapsKey: '' } },
  modules: ['@pinia/nuxt'], css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  app: { head: { htmlAttrs: { lang: 'ru', 'data-theme': 'mesto' }, title: `${brandName} — жильё на юге` } },
  routeRules: { '/host': { ssr: false }, '/host/**': { ssr: false }, '/checkout/**': { ssr: false }, '/bookings': { ssr: false }, '/favorites': { ssr: false }, '/profile': { ssr: false }, '/tg': { ssr: false }, '/tg/**': { ssr: false } },
})
