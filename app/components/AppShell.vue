<script setup>
import { brandName } from '#shared/brand'
const { isHost, isTg, link } = usePlatform()
</script>
<template>
<div class="app-shell" :class="{ 'host-shell': isHost }">
  <header class="topbar"><NuxtLink :to="link('/')" class="logo">{{ brandName }}<span>.</span></NuxtLink><div class="desktop-links"><NuxtLink :to="link('/search')">Найти жильё</NuxtLink><NuxtLink :to="link('/favorites')">Избранное</NuxtLink><NuxtLink :to="link('/bookings')">Брони</NuxtLink></div><div class="context-switch"><NuxtLink :class="{current: !isHost}" :to="link('/search')">Гость</NuxtLink><NuxtLink :class="{current: isHost}" :to="link('/host/properties')">Хозяин</NuxtLink><NuxtLink :class="{current: isTg}" :to="isTg ? '/search' : '/tg'">{{ isTg ? 'Web ↗' : 'TG ↗' }}</NuxtLink></div></header>
  <div v-if="isHost" class="host-layout"><aside class="host-sidebar" aria-label="Навигация хозяина"><NuxtLink :to="link('/host/calendar')">▦ <span>Календарь</span></NuxtLink><NuxtLink :to="link('/host/properties')">⌂ <span>Объекты</span></NuxtLink><NuxtLink :to="link('/host/bookings')">▤ <span>Бронирования</span></NuxtLink><NuxtLink :to="link('/host/bot')">◉ <span>Мой бот</span></NuxtLink><NuxtLink :to="link('/host/audit')">☷ <span>Журнал</span></NuxtLink><NuxtLink :to="link('/profile')">♙ <span>Профиль</span></NuxtLink></aside><div class="host-layout-content"><slot /></div></div>
  <slot v-else />
  <nav class="bottom-nav"><NuxtLink :to="isHost ? link('/host/properties') : link('/search')"><span>⌕</span>{{ isHost ? 'Объекты' : 'Поиск' }}</NuxtLink><NuxtLink :to="isHost ? link('/host/calendar') : link('/favorites')"><span>{{ isHost ? '▦' : '♡' }}</span>{{ isHost ? 'Календарь' : 'Избранное' }}</NuxtLink><NuxtLink :to="isHost ? link('/host/bookings') : link('/bookings')"><span>▤</span>Брони</NuxtLink><NuxtLink :to="link('/profile')"><span>♙</span>Профиль</NuxtLink></nav>
</div>
</template>
