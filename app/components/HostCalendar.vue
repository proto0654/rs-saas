<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { calendarPeriod, shiftCalendarPeriod } from '#shared/domain/dates'
import { blockingStatuses, nights } from '#shared/domain/booking'
import { bookingStatusLabels as statuses } from '../utils/booking-labels'

const props = defineProps({ db: { type: Object, required: true }, units: { type: Array, required: true }, start: { type: String, required: true }, bookingId: { type: String, default: '' }, bookingsPath: { type: String, default: '/host/bookings' } })
const emit = defineEmits(['update:start', 'block-select'])
const selectedId = ref(null)
const expandedGroups = ref(new Set())
const periodMode = ref('week')
const days = computed(() => calendarPeriod(props.start, props.db.demoToday, periodMode.value))
const scrollContainer = ref(null)
watch([days, () => props.start], async () => {
  await nextTick()
  const container = scrollContainer.value
  if (!container) return
  const headers = Array.from(container.querySelectorAll('[data-calendar-day]'))
  const target = headers.find(header => header.dataset.calendarDay === props.start) || headers[0]
  const label = container.querySelector('th:first-child')
  if (!target || !label) return
  const offset = target.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft
  container.scrollLeft = Math.max(0, offset - label.getBoundingClientRect().width - 48)
}, { immediate: true })
const selected = computed(() => props.db.bookings.find(b => b.id === selectedId.value && props.units.some(unit => unit.id === b.unitId)))
watch([() => props.bookingId, () => props.db, () => props.units], () => {
  const booking = props.db.bookings.find(b => b.id === props.bookingId && props.units.some(unit => unit.id === b.unitId))
  if (!booking) return
  selectedId.value = booking.id
  const unit = props.units.find(item => item.id === booking.unitId)
  expandedGroups.value = new Set([...expandedGroups.value, unit.propertyId])
}, { immediate: true })
const properties = computed(() => new Map(props.db.properties.map(p => [p.id, p])))
const guests = computed(() => new Map(props.db.users.map(u => [u.id, u.name])))
const formatDate = value => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
const formatWeekday = value => new Intl.DateTimeFormat('ru-RU', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
const periodLabel = computed(() => periodMode.value === 'month'
  ? new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${days.value[0]}T00:00:00Z`))
  : `${formatDate(days.value[0])} — ${formatDate(days.value.at(-1))} ${days.value.at(-1).slice(0,4)}`)
const formatMoney = value => new Intl.NumberFormat('ru-RU').format(value)
const selectedUnit = computed(() => selected.value && props.units.find(unit => unit.id === selected.value.unitId))
const selectedProperty = computed(() => selectedUnit.value && properties.value.get(selectedUnit.value.propertyId))
const rows = computed(() => props.units.map(unit => {
  const entries = [
    ...props.db.bookings.filter(b => b.unitId === unit.id && blockingStatuses.has(b.status)).map(booking => ({ type: 'booking', id: booking.id, start: booking.checkIn, end: booking.checkOut, booking })),
    ...props.db.blocks.filter(b => b.unitId === unit.id).map(block => ({ type: 'blocked', id: block.id, start: block.start, end: block.end }))
  ]
  const segments = []
  for (const day of days.value) {
    const entry = entries.find(item => item.start <= day && day < item.end)
    const last = segments.at(-1)
    if (entry && last?.id === entry.id && last.type === entry.type) last.span++
    else segments.push(entry ? { ...entry, day, span: 1 } : { type: 'free', day, span: 1 })
  }
  return { unit, property: properties.value.get(unit.propertyId), entries, segments }
}))
const groups = computed(() => {
  const byProperty = new Map()
  for (const row of rows.value) {
    if (!byProperty.has(row.unit.propertyId)) byProperty.set(row.unit.propertyId, { property: row.property, rows: [] })
    byProperty.get(row.unit.propertyId).rows.push(row)
  }
  return Array.from(byProperty.values(), group => {
    const summary = days.value.map(day => {
      const entries = group.rows.map(row => row.entries.find(entry => entry.start <= day && day < entry.end)).filter(Boolean)
      const booked = entries.filter(entry => entry.type === 'booking').length
      const blocked = entries.filter(entry => entry.type === 'blocked').length
      return { day, booked, blocked, available: group.rows.length - booked - blocked, unavailable: booked + blocked }
    })
    return { ...group, expandable: group.rows.length > 1 || ['hotel', 'hostel'].includes(group.property?.type), summary, current: summary.find(item => item.day === props.start) || summary[0] }
  })
})
function toggleGroup(id) {
  const next = new Set(expandedGroups.value)
  if (next.has(id)) { next.delete(id); if (selectedUnit.value?.propertyId === id) selectedId.value = null }
  else next.add(id)
  expandedGroups.value = next
}
function moveWindow(direction) { emit('update:start', shiftCalendarPeriod(props.start, props.db.demoToday, periodMode.value, direction)) }
</script>

<template>
  <section class="calendar-workspace">
    <div class="calendar-main">
      <div class="calendar-toolbar">
        <div><div class="eyebrow">ВАШИ ОБЪЕКТЫ</div><h2>Шахматка занятости</h2><p class="muted">Раскройте объект для просмотра номеров. Сводка по дням: занято или закрыто / всего.</p></div>
        <div class="calendar-controls"><div class="calendar-modes" aria-label="Период календаря"><button :class="{active: periodMode === 'week'}" :aria-pressed="periodMode === 'week'" @click="periodMode = 'week'">Неделя</button><button :class="{active: periodMode === 'month'}" :aria-pressed="periodMode === 'month'" @click="periodMode = 'month'">Месяц</button></div><div class="calendar-period"><button :aria-label="periodMode === 'week' ? 'Предыдущая неделя' : 'Предыдущий месяц'" @click="moveWindow(-1)">‹</button><label>Дата<input type="date" :value="start" @input="emit('update:start', $event.target.value)"></label><button :aria-label="periodMode === 'week' ? 'Следующая неделя' : 'Следующий месяц'" @click="moveWindow(1)">›</button></div></div>
      </div>
      <p class="calendar-period-label">{{ periodLabel }}</p>
      <div ref="scrollContainer" class="calendar-scroll" tabindex="0" aria-label="Шахматка занятости, прокрутите по горизонтали">
        <table class="calendar-grid calendar-timeline" :style="{ minWidth: `${170 + days.length * 48}px` }"><thead><tr><th>Объект / номер</th><th v-for="day in days" :key="day" :data-calendar-day="day" :class="{ 'current-day': day === start }" :aria-current="day === start ? 'date' : undefined">{{ day.slice(8) }}<small>{{ formatWeekday(day) }}</small></th></tr></thead>
          <tbody v-for="group in groups" :key="group.property?.id">
            <tr v-if="group.expandable" class="calendar-group"><th><button class="calendar-group-toggle" :aria-expanded="expandedGroups.has(group.property.id)" @click="toggleGroup(group.property.id)"><span>{{ group.property.title }}<small>{{ group.rows.length }} ед. · {{ formatDate(group.current.day) }}</small><small>Свободно {{ group.current.available }} · занято {{ group.current.booked }} · закрыто {{ group.current.blocked }}</small></span><span class="disclosure-chevron" aria-hidden="true"></span></button></th><td v-for="summary in group.summary" :key="summary.day" class="calendar-group-day" :title="`${formatDate(summary.day)}: ${summary.booked} занято, ${summary.blocked} закрыто, ${summary.available} свободно`" :aria-label="`${group.property.title}, ${formatDate(summary.day)}: ${summary.booked} занято, ${summary.blocked} закрыто, ${summary.available} свободно`"><span>{{ summary.unavailable }}/{{ group.rows.length }}</span></td></tr>
            <tr v-for="row in (!group.expandable || expandedGroups.has(group.property.id) ? group.rows : [])" :key="row.unit.id"><th><template v-if="group.expandable"><span>{{ row.unit.label }}</span><small>{{ row.unit.kind === 'bed' ? 'Место' : row.unit.kind === 'room' ? 'Номер' : 'Размещение' }}</small></template><template v-else><span>{{ row.property?.title }}</span><small>{{ row.unit.label }}</small></template></th><td v-for="segment in row.segments" :key="segment.day" :colspan="segment.span" :class="`timeline-${segment.type}`">
            <button v-if="segment.type === 'booking'" class="timeline-booking" :class="{ selected: selectedId === segment.id }" :aria-label="`${row.property?.title}, ${row.unit.label}: ${guests.get(segment.booking.guestId) || 'Гость'}, ${formatDate(segment.start)} — ${formatDate(segment.end)}, ${statuses[segment.booking.status]}`" @click="selectedId = segment.id"><span>{{ guests.get(segment.booking.guestId) || 'Гость' }} · {{ segment.booking.guests }} гост.</span></button>
            <span v-else-if="segment.type === 'blocked'" class="timeline-block" :title="`Закрыто: ${formatDate(segment.start)} — ${formatDate(segment.end)}`">Закрыто</span>
            <button v-else class="timeline-free" :aria-label="`${row.property?.title}, ${row.unit.label}, ${formatDate(segment.day)}: свободно, выбрать для блокировки`" @click="selectedId = null; emit('block-select', row.unit.id, segment.day)">·</button>
          </td></tr></tbody>
        </table>
      </div>
      <div class="calendar-legend"><span>■ Бронирование</span><span>▨ Закрыто</span><span>· Свободно</span><span>2/8 — занято или закрыто / всего</span></div>
    </div>
    <aside class="calendar-detail" :class="{ empty: !selected || !selectedUnit || !selectedProperty }" aria-live="polite">
      <div class="eyebrow">ДЕТАЛИ</div><h2>Бронирование</h2>
      <template v-if="selected && selectedUnit && selectedProperty">
        <button class="detail-close" aria-label="Закрыть сведения о бронировании" @click="selectedId = null">×</button>
        <span class="calendar-status">{{ statuses[selected.status] }}</span>
        <dl><div><dt>Объект</dt><dd>{{ selectedProperty.title }} · {{ selectedUnit.label }}</dd></div><div><dt>Гость</dt><dd>{{ guests.get(selected.guestId) || 'Гость' }} · {{ selected.guests }} гост.</dd></div><div><dt>Даты</dt><dd>{{ formatDate(selected.checkIn) }} — {{ formatDate(selected.checkOut) }} ({{ nights(selected.checkIn, selected.checkOut) }} ноч.)</dd></div><div><dt>Сумма</dt><dd>{{ formatMoney(selected.total) }} ₽</dd></div></dl>
        <p v-if="!blockingStatuses.has(selected.status)" class="muted">Эта бронь не занимает даты в календаре.</p>
        <NuxtLink class="calendar-booking-link" :to="{ path: bookingsPath, query: { booking: selected.id } }">Открыть бронь →</NuxtLink>
      </template>
      <p v-else class="muted">Нажмите на бронирование в шахматке, чтобы увидеть подробности.</p>
    </aside>
  </section>
</template>

<style scoped>
.calendar-workspace{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:16px;margin-top:24px}.calendar-main,.calendar-detail{min-width:0;background:var(--surface-card);border:1px solid var(--border-main);border-radius:20px;padding:22px}.calendar-toolbar{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:16px}.calendar-toolbar h2,.calendar-detail h2{margin:8px 0}.calendar-toolbar p,.calendar-detail p{font-size:13px}.calendar-period{display:flex;align-items:end;gap:4px;flex:none}.calendar-period label{font-size:11px}.calendar-period input{width:150px;min-height:44px}.calendar-period button{width:44px;height:44px;border:1px solid var(--border-main);background:var(--surface-raised);color:var(--text-main);border-radius:10px;font-size:24px}.calendar-timeline{border-collapse:separate;border-spacing:0;table-layout:fixed;min-width:842px;width:100%;font-size:12px}.calendar-timeline th,.calendar-timeline td{border-right:1px solid var(--border-main);border-bottom:1px solid var(--border-main);text-align:center;padding:0;height:46px}.calendar-timeline th:first-child{position:sticky;left:0;z-index:2;background:var(--surface-raised);text-align:left;padding:8px 12px;width:170px;overflow-wrap:anywhere}.calendar-timeline th small{display:block;color:var(--text-muted);font-weight:400}.calendar-grid.calendar-timeline td button{font-size:12px;width:100%;height:44px;border:0;color:var(--text-main);text-align:left;padding:0 7px}.timeline-booking{background:#405846;color:#fff;border-radius:6px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.timeline-booking span{display:block;overflow:hidden;text-overflow:ellipsis}.calendar-grid.calendar-timeline td button.timeline-booking.selected{background:#d0f35b;color:#10170c}.timeline-block{display:flex;height:44px;align-items:center;justify-content:center;overflow:hidden;color:#c2cac2;background:repeating-linear-gradient(135deg,#404946 0 4px,#28312c 4px 8px);font-size:11px}.calendar-timeline td .timeline-free{background:#202c23;color:#8da38d;text-align:center;font-size:18px}.calendar-detail{align-self:start;position:relative}.detail-close{position:absolute;right:10px;top:10px;width:44px;height:44px;border:0;border-radius:50%;background:transparent;color:var(--text-main);font-size:24px}.detail-close:hover{background:var(--surface-control)}.calendar-detail h2{font-size:21px}.calendar-status{display:inline-block;margin:12px 0;color:var(--accent-text);border:1px solid #657b3f;border-radius:20px;padding:6px 10px;font-size:12px}.calendar-booking-link{display:inline-block;margin-top:16px;color:var(--accent-text);font-weight:700;font-size:13px}.calendar-detail dl{margin:0}.calendar-detail dl div{display:grid;gap:5px;border-bottom:1px solid var(--border-main);padding:12px 0;font-size:13px}.calendar-detail dt{color:var(--text-muted)}.calendar-detail dd{margin:0;overflow-wrap:anywhere}.calendar-legend{display:flex;gap:18px;margin-top:14px;color:var(--text-muted);font-size:12px}@media(max-width:1000px){.calendar-workspace{grid-template-columns:1fr}.calendar-detail.empty{display:none}.calendar-detail:not(.empty){position:fixed;left:12px;right:12px;bottom:calc(82px + env(safe-area-inset-bottom));z-index:15;max-height:45vh;overflow:auto;box-shadow:0 12px 40px #0009}}@media(max-width:1000px){.calendar-detail:not(.empty) dl div{grid-template-columns:64px 1fr;align-items:start;gap:8px;padding:8px 0}.calendar-detail:not(.empty) .calendar-status{margin:6px 0}}@media(max-width:800px){.calendar-main,.calendar-detail{padding:14px}.calendar-toolbar{display:block}.calendar-period{margin-top:12px}.calendar-timeline{min-width:812px}.calendar-timeline th:first-child{width:140px;padding:8px}.calendar-legend{gap:10px;flex-wrap:wrap}}

.calendar-controls{display:flex;flex-direction:column;align-items:flex-end;gap:8px}.calendar-modes{display:flex;gap:4px;background:var(--surface-input);border:1px solid var(--border-main);border-radius:11px;padding:3px}.calendar-modes button{border:0;border-radius:8px;background:transparent;color:var(--text-muted);padding:0 15px;min-height:38px;font-size:12px;font-weight:700}.calendar-modes button.active{background:#d0f35b;color:#10170c}.calendar-period-label{margin:0 0 10px;color:var(--text-main);font-size:14px;font-weight:700}.calendar-timeline th.current-day{background:#33483a;color:var(--accent-text)}.calendar-timeline th.current-day small{color:var(--accent-text)}@media(max-width:800px){.calendar-controls{align-items:flex-start;margin-top:12px}.calendar-period{margin-top:0}}

.calendar-timeline tr.calendar-group th:first-child{background:#293b30;padding:0}.calendar-group-toggle{width:100%;min-height:48px;border:0;background:transparent;color:var(--text-main);display:flex;justify-content:space-between;align-items:center;gap:6px;padding:6px 10px;text-align:left;font-weight:700}.calendar-group-toggle>span:first-child{min-width:0}.calendar-group-toggle[aria-expanded="true"] .disclosure-chevron{transform:rotate(180deg)}.calendar-group-toggle small{font-size:10px}.calendar-group-day{background:#293b30;color:var(--accent-text);font-weight:700;font-size:11px}.calendar-group-day span{white-space:nowrap}
:global([data-theme="mesto-light"]) .calendar-timeline tr.calendar-group th:first-child,:global([data-theme="mesto-light"]) .calendar-group-day{background:#e3ecdc}
:global([data-theme="mesto-light"]) .calendar-timeline th.current-day{background:#e3ecdc}
.calendar-grid.calendar-timeline td button.timeline-booking{color:#fff}
.calendar-grid.calendar-timeline td button.timeline-booking.selected{color:#10170c}
</style>
