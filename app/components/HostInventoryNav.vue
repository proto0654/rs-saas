<script setup>
const { path, link } = usePlatform()
</script>
<template>
  <nav class="inventory-nav" aria-label="Бронирования и календарь">
    <NuxtLink :to="link('/host/calendar')" :aria-current="path === '/host/calendar' ? 'page' : undefined">Календарь</NuxtLink>
    <NuxtLink :to="link('/host/bookings')" :aria-current="path === '/host/bookings' ? 'page' : undefined">Брони</NuxtLink>
  </nav>
</template>
<style scoped>
.inventory-nav{display:flex;gap:6px;margin-top:18px}.inventory-nav a{padding:10px 16px;border:1px solid var(--border-main);border-radius:10px;color:var(--text-muted);font-size:13px;font-weight:700;text-decoration:none}.inventory-nav a[aria-current="page"]{background:#d0f35b;border-color:var(--accent-text);color:#10170c}
</style>
