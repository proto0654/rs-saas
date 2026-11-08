<script setup>
import { computed } from 'vue'
import { blockingStatuses } from '#shared/domain/booking'

const props = defineProps({ db: { type: Object, required: true } })
const emit = defineEmits(['transition'])
const guests = computed(() => new Map(props.db.users.map(user => [user.id, user.name])))
const groups = computed(() => {
  const unitsByProperty = new Map()
  const bookingsByUnit = new Map()
  for (const unit of props.db.units) {
    if (!unitsByProperty.has(unit.propertyId)) unitsByProperty.set(unit.propertyId, [])
    unitsByProperty.get(unit.propertyId).push(unit)
  }
  for (const booking of props.db.bookings) {
    if (!bookingsByUnit.has(booking.unitId)) bookingsByUnit.set(booking.unitId, [])
    bookingsByUnit.get(booking.unitId).push(booking)
  }
  return props.db.properties.filter(property => property.ownerId === 'host1').map(property => {
    const units = (unitsByProperty.get(property.id) || []).map(unit => {
      const bookings = (bookingsByUnit.get(unit.id) || []).slice().sort((a,b) => Number(!blockingStatuses.has(a.status)) - Number(!blockingStatuses.has(b.status)) || a.checkIn.localeCompare(b.checkIn))
      return { unit, bookings, active: bookings.filter(booking => blockingStatuses.has(booking.status)).length }
    })
    const bookings = units.flatMap(item => item.bookings)
    return { property, units, count: bookings.length, active: bookings.filter(booking => blockingStatuses.has(booking.status)).length, pending: bookings.filter(booking => booking.status === 'pending_host').length, expandable: units.length > 1 || ['hotel','hostel'].includes(property.type) }
  })
})
</script>

<template>
  <div class="host-booking-groups">
    <p v-if="!groups.length" class="empty">Пока нет объектов.</p>
    <details v-for="group in groups" :key="group.property.id" class="booking-group">
      <summary class="booking-group-summary"><img v-if="group.property.images?.length" :src="group.property.images[0]" alt=""><span class="booking-group-copy"><b>{{ group.property.title }}</b><small>{{ group.property.city }} · {{ group.units.length }} ед. размещения</small><small>Активные: {{ group.active }} · Ожидают: {{ group.pending }} · Всего: {{ group.count }}</small></span><span class="booking-chevron" aria-hidden="true">⌄</span></summary>
      <div class="booking-group-body">
        <p v-if="!group.units.length" class="muted">В объекте пока нет номеров или мест.</p>
        <template v-for="item in group.units" :key="item.unit.id">
          <details v-if="group.expandable" class="booking-unit"><summary><span><b>{{ item.unit.label }}</b><small>Активные: {{ item.active }} · Всего: {{ item.bookings.length }}</small></span><span class="booking-chevron" aria-hidden="true">⌄</span></summary>
            <div class="booking-unit-body"><p v-if="!item.bookings.length" class="muted">Для этого варианта пока нет бронирований.</p><HostBookingItem v-for="booking in item.bookings" :key="booking.id" :booking="booking" :guest="guests.get(booking.guestId) || 'Гость'" @transition="(entry, status) => emit('transition', entry, status)" /></div>
          </details>
          <div v-else class="booking-unit-body"><p v-if="!item.bookings.length" class="muted">Для этого объекта пока нет бронирований.</p><HostBookingItem v-for="booking in item.bookings" :key="booking.id" :booking="booking" :guest="guests.get(booking.guestId) || 'Гость'" @transition="(entry, status) => emit('transition', entry, status)" /></div>
        </template>
      </div>
    </details>
  </div>
</template>

<style scoped>
.host-booking-groups{display:grid;gap:12px;margin-top:22px}.booking-group{background:#18201c;border:1px solid #344037;border-radius:16px;overflow:hidden}.booking-group summary{cursor:pointer;list-style:none}.booking-group summary::-webkit-details-marker{display:none}.booking-group-summary{display:flex;gap:14px;align-items:center;padding:14px;min-height:90px}.booking-group-summary img{width:72px;height:68px;object-fit:cover;border-radius:10px;flex:none}.booking-group-copy{flex:1;min-width:0}.booking-group-copy b,.booking-group-copy small{display:block;overflow-wrap:anywhere}.booking-group-copy small{color:#a8b1a4;font-size:12px;margin-top:5px}.booking-chevron{color:#d0f35b;font-size:22px;flex:none}.booking-group[open]>.booking-group-summary .booking-chevron,.booking-unit[open]>summary .booking-chevron{transform:rotate(180deg)}.booking-group-body{padding:0 14px 14px}.booking-unit{border-top:1px solid #39443a}.booking-unit>summary{min-height:52px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 2px}.booking-unit>summary small{display:block;color:#a8b1a4;margin-top:3px}.booking-unit-body>.muted,.booking-group-body>.muted{padding:12px 0;font-size:13px}@media(max-width:500px){.booking-group-summary{gap:10px;padding:12px}.booking-group-summary img{width:58px;height:58px}.booking-group-copy small{font-size:11px}.booking-group-body{padding:0 12px 12px}}
</style>
