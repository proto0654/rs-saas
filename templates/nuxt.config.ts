import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  app: { head: { htmlAttrs: { lang: 'ru', 'data-theme': 'mesto' } } },
  routeRules: {
    '/host': { ssr: false },
    '/host/**': { ssr: false },
    '/checkout/**': { ssr: false },
    '/bookings': { ssr: false },
    '/favorites': { ssr: false },
    '/profile': { ssr: false },
    '/tg': { ssr: false },
    '/tg/**': { ssr: false },
  },
})
