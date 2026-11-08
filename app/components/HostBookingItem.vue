<script setup>
import { bookingStatusLabels as labels } from '../utils/booking-labels'
const props = defineProps({ booking: { type: Object, required: true }, guest: { type: String, default: 'Гость' } })
const emit = defineEmits(['transition'])
const date = value => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
const amount = value => new Intl.NumberFormat('ru-RU').format(value)
</script>
<template>
  <article class="host-booking"><div><span class="badge-status">{{ labels[booking.status] }}</span><small v-if="booking.source === 'manual'" class="muted"> · Добавлена хозяином</small><p>{{ guest }} · {{ booking.guests }} гост.</p><p>{{ date(booking.checkIn) }} — {{ date(booking.checkOut) }} · {{ amount(booking.total) }} ₽</p></div><div class="actions"><button v-if="booking.status === 'pending_host'" class="btn primary" @click="emit('transition', booking, 'confirmed')">Подтвердить</button><button v-if="booking.status === 'paid'" class="btn primary" @click="emit('transition', booking, 'checked_in')">Заселить</button><button v-if="booking.status === 'checked_in'" class="btn outline" @click="emit('transition', booking, 'completed')">Завершить</button><button v-if="['pending_host','confirmed','paid'].includes(booking.status)" class="btn outline" @click="emit('transition', booking, 'cancelled')">Отменить</button></div></article>
</template>
<style scoped>
.host-booking{padding:14px;background:#202a23;border:1px solid #39443a;border-radius:12px;margin:8px 0}.host-booking p{font-size:13px;color:#bec8bc;margin-top:6px}.host-booking .actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.host-booking .btn{min-height:44px;padding:0 14px;font-size:13px}
</style>
