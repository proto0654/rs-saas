<script setup>
definePageMeta({ layout: false })
// The header is outside the intro fade; mark the cover before the shell renders.
useState('home-intro-covers-chrome', () => true).value = true
</script>

<template>
  <AppShell>
    <HomeIntro><MestoApp /></HomeIntro>
  </AppShell>
</template>
