<script setup>
import { bookingStatusLabels as labels } from '../utils/booking-labels'
const props = defineProps({ booking: { type: Object, required: true }, guest: { type: String, default: 'Гость' }, selected: { type: Boolean, default: false } })
const { link } = usePlatform()
const emit = defineEmits(['transition'])
const date = value => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
const amount = value => new Intl.NumberFormat('ru-RU').format(value)
</script>
<template>
  <article class="host-booking" :class="{ selected }" :data-booking-id="booking.id"><div><span class="badge-status">{{ labels[booking.status] }}</span><small v-if="booking.source === 'manual'" class="muted"> · Добавлена хозяином</small><p>{{ guest }} · {{ booking.guests }} гост.</p><p>{{ date(booking.checkIn) }} — {{ date(booking.checkOut) }} · {{ amount(booking.total) }} ₽</p></div><div class="actions"><NuxtLink class="btn outline" :to="{ path: link('/host/calendar'), query: { booking: booking.id } }">В календаре</NuxtLink><button v-if="booking.status === 'pending_host'" class="btn primary" @click="emit('transition', booking, 'confirmed')">Подтвердить</button><button v-if="booking.status === 'paid'" class="btn primary" @click="emit('transition', booking, 'checked_in')">Заселить</button><button v-if="booking.status === 'checked_in'" class="btn outline" @click="emit('transition', booking, 'completed')">Завершить</button><button v-if="['pending_host','confirmed','paid'].includes(booking.status)" class="btn outline" @click="emit('transition', booking, 'cancelled')">Отменить</button></div></article>
</template>
<style scoped>
.host-booking{padding:14px;background:var(--surface-raised);border:1px solid var(--border-main);border-radius:12px;margin:8px 0}.host-booking.selected{border-color:var(--accent-text)}.host-booking p{font-size:13px;color:var(--text-muted);margin-top:6px}.host-booking .actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.host-booking .btn{min-height:44px;padding:0 14px;font-size:13px}
</style>
