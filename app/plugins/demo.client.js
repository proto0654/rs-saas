export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => useDemoStore().restore())
})
