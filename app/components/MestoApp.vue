<script setup>
import seed from '../../demo/seed.json'
import { brandName, serviceArea } from '#shared/brand'
import { locations, regionLabels, propertyRegion } from '#shared/locations'
import { available, quote, search, nights, day } from '#shared/domain/booking'
import { addDays } from '#shared/domain/dates'
import { bookingStatusLabels as statuses } from '../utils/booking-labels'

const route = useRoute()
const router = useRouter()
const store = useDemoStore()
// Restore private demo data only after this async screen has hydrated.
const screenMounted = ref(false)
onMounted(() => { screenMounted.value = true })
const demoReady = computed(() => screenMounted.value && store.ready)
const { path, isTg, isHost, link } = usePlatform()
const cities = Object.fromEntries(locations.map(location => [location.slug, location.city]))
const labels = { apartment: 'Квартира', hotel: 'Мини-отель', hostel: 'Хостел', house: 'Дом' }
const isSearch = computed(() => ['/', '/search'].includes(path.value) || path.value.startsWith('/locations/'))
const id = computed(() => path.value.split('/').filter(Boolean).at(-1))
const validRoute = computed(() => ['/', '/search'].includes(path.value) || /^\/locations\/[^/]+$/.test(path.value) || /^\/(stays|checkout)\/[^/]+$/.test(path.value) || ['/bookings','/favorites','/profile','/host','/host/properties','/host/calendar','/host/bookings','/host/bot','/host/audit'].includes(path.value) || /^\/host\/properties\/[^/]+$/.test(path.value))
if (!validRoute.value || (path.value.startsWith('/locations/') && !cities[id.value])) throw createError({ statusCode: 404, statusMessage: 'Страница не найдена' })
const initialFilters = () => {
  const f = { ...structuredClone(seed.defaultSearch), amenities: [...seed.defaultSearch.amenities] }
  const q = route.query
  if (q.rentalMode === 'long_term' || path.value.startsWith('/stays/') && seed.properties.find(p => p.id === id.value)?.rentalMode === 'long_term') f.rentalMode = 'long_term'
  const broadEntry = f.rentalMode === 'long_term' || path.value.startsWith('/locations/')
  if (broadEntry && !('maxPrice' in q)) f.maxPrice = null
  if (broadEntry && !('amenities' in q)) f.amenities = []
  if ('region' in q) f.region = Object.hasOwn(regionLabels, String(q.region)) ? String(q.region) : null
  if (typeof q.checkIn === 'string') f.checkIn = q.checkIn
  if (typeof q.checkOut === 'string') f.checkOut = q.checkOut
  if (q.guests && Number(q.guests) > 0) f.guests = Number(q.guests)
  if ('maxPrice' in q) f.maxPrice = q.maxPrice === '' ? null : Number(q.maxPrice)
  if ('city' in q) f.city = String(q.city || '') || null
  if ('amenities' in q) f.amenities = String(q.amenities || '').split(',').filter(Boolean)
  if ('type' in q) f.type = Object.hasOwn(labels, String(q.type)) ? String(q.type) : ''
  if ('videoVerified' in q) f.videoVerified = q.videoVerified === '1'
  if (path.value.startsWith('/locations/')) f.city = cities[id.value]
  try { if (f.rentalMode === 'long_term' && !q.checkOut) f.checkOut = addDays(f.checkIn, 30); search(seed, f); return f } catch { return structuredClone(seed.defaultSearch) }
}
const filters = ref(initialFilters())
const db = computed(() => demoReady.value ? store.data.db : seed)
const { data: publicData } = await useAsyncData(`public:${route.fullPath}`, () => {
  if (isSearch.value) return { results: search(seed, initialFilters()) }
  if (path.value.startsWith('/stays/')) {
    const p = seed.properties.find(x => x.id === id.value && x.status === 'published')
    return { property: p || null, units: p ? seed.units.filter(x => x.propertyId === p.id) : [] }
  }
  return {}
})
if (path.value.startsWith('/stays/') && !publicData.value?.property && !demoReady.value) throw createError({ statusCode: 404, statusMessage: 'Объект не найден' })
const property = computed(() => db.value.properties.find(x => x.id === id.value && (isHost.value ? x.ownerId === 'host1' : x.status === 'published')))
const currentUnit = computed(() => db.value.units.find(x => x.id === id.value))
const unitProperty = computed(() => currentUnit.value && db.value.properties.find(x => x.id === currentUnit.value.propertyId))
watch([() => route.path, () => demoReady.value], () => {
  if (!validRoute.value || (path.value.startsWith('/locations/') && !cities[id.value])) { showError({ statusCode: 404, message: 'Страница не найдена' }); return }
  if (!demoReady.value) return
  const invalidProperty = (path.value.startsWith('/stays/') || /^\/host\/properties\/[^/]+$/.test(path.value)) && !property.value
  const invalidUnit = path.value.startsWith('/checkout/') && (!currentUnit.value || unitProperty.value?.status !== 'published')
  if (invalidProperty || invalidUnit) showError({ statusCode: 404, message: 'Объект не найден' })
}, { immediate: true })
const results = computed(() => { try { return search(db.value, filters.value) } catch { return [] } })
const error = ref('')
const mapMode = toRef(store, 'mapMode')
const selected = toRef(store, 'selectedPropertyId')
const searchPanel = ref('')
const draft = ref(null)
const searchPanelElement = ref(null)
const resultHeading = ref(null)
const priceField = ref(null)
const invalidField = ref('')
const showFilters = computed(() => searchPanel.value === 'filters')
const showDates = computed(() => searchPanel.value === 'dates')
const previousDates = useState('guest-previous-dates', () => null)
const modeFilters = useState('guest-mode-filters', () => ({}))
const amenityLabels = { sea_view: 'Вид на море', terrace: 'Терраса', kitchen: 'Кухня', parking: 'Парковка', air_conditioning: 'Кондиционер', washer: 'Стиральная машина', wifi: 'Wi-Fi' }
const destinationLabel = computed(() => filters.value.city || regionLabels[filters.value.region] || 'Куда едем?')
const amenityOptions = computed(() => {
  const properties = db.value.properties.filter(p => p.status === 'published' && (p.rentalMode || 'short_term') === filters.value.rentalMode)
  return Object.entries(amenityLabels).filter(([key]) => draft.value?.amenities?.includes(key) || properties.some(p => p.amenities.includes(key)) && !properties.every(p => p.amenities.includes(key)))
})
const draftCount = computed(() => { try { return search(db.value, normalizeFilters(draft.value || filters.value)).length } catch { return null } })
const resultActionLabel = computed(() => {
  if (draftCount.value === null) return 'Применить'
  const noun = { one: 'вариант', few: 'варианта', many: 'вариантов', other: 'варианта' }[new Intl.PluralRules('ru').select(draftCount.value)]
  return `Показать ${draftCount.value} ${noun}`
})
const activeTags = computed(() => [
  ...(filters.value.maxPrice == null ? [] : [{ key: 'maxPrice', label: `До ${format(filters.value.maxPrice)} ₽/${filters.value.rentalMode === 'long_term' ? 'мес' : 'ночь'}` }]),
  ...(filters.value.type ? [{ key: 'type', label: labels[filters.value.type] }] : []),
  ...(filters.value.amenities || []).map(key => ({ key, label: amenityLabels[key] || key })),
  ...(filters.value.videoVerified ? [{ key: 'videoVerified', label: 'Видео проверено' }] : [])
])
const selectedUnit = ref(null)
const hostTab = ref('units')
const hostType = ref('all')
const calendarStart = ref(seed.demoToday)
const linkedBookingId = computed(() => typeof route.query.booking === 'string' ? route.query.booking : '')
watch([linkedBookingId, db, path], () => {
  if (path.value !== '/host/calendar' || !linkedBookingId.value) return
  const booking = db.value.bookings.find(item => item.id === linkedBookingId.value)
  const unit = booking && db.value.units.find(item => item.id === booking.unitId)
  if (unit && db.value.properties.some(item => item.id === unit.propertyId && item.ownerId === 'host1')) calendarStart.value = booking.checkIn
}, { immediate: true })
const clockDate = ref(seed.demoToday)
const hostDay = ref(seed.demoToday)
const photoIndex = ref(0)
watch(() => db.value.demoToday, value => { clockDate.value = value; calendarStart.value = value; hostDay.value = value }, { immediate: true })
const isNow = computed(() => filters.value.rentalMode !== 'long_term' && filters.value.checkIn === db.value.demoToday && filters.value.checkOut === addDays(db.value.demoToday, 1))
function setClock() { try { store.setClock(clockDate.value); error.value = '' } catch { error.value = 'Укажите корректную демо-дату' } }
const scenario = toRef(store, 'scenario')
function simulateLoading() { scenario.value = 'loading'; setTimeout(() => { scenario.value = 'normal' }, 1500) }
const nextDay = value => addDays(value, 1)
const clone = value => structuredClone(JSON.parse(JSON.stringify(value)))
const uuid = () => crypto.randomUUID()
const showNew = ref(false)
const showManualBooking = ref(false)
const manualBooking = reactive({ unitId: '', checkIn: '2027-06-12', checkOut: '2027-06-16', guests: 1 })
const editor = ref(null)
const unitEditor = ref(null)
const blockUnit = ref('')
const blockStart = ref('2027-06-12')
const blockEnd = ref('2027-06-13')
const blockPanel = ref(null)
function selectFreeDate(unitId, day) { blockUnit.value = unitId; blockStart.value = day; blockEnd.value = nextDay(day); blockPanel.value?.scrollIntoView({ block: 'center' }) }
const newProperty = reactive({ title: '', city: '', description: '', type: 'apartment', rentalMode: 'short_term', region: 'crimea' })
const sourceFilters = computed(() => demoReady.value && store.data.filters ? store.data.filters : seed.defaultSearch)
watch([() => demoReady.value, sourceFilters], ([ready]) => {
  if (!ready || Object.keys(route.query).length || path.value.startsWith('/locations/')) return
  const restored = normalizeFilters(sourceFilters.value)
  const target = path.value.startsWith('/stays/') && db.value.properties.find(property => property.id === id.value)
  if (target?.rentalMode === 'long_term') {
    if (restored.rentalMode !== 'long_term') { restored.maxPrice = null; restored.amenities = [] }
    restored.rentalMode = 'long_term'
    if (nights(restored.checkIn,restored.checkOut) < 30) restored.checkOut = addDays(restored.checkIn,30)
  }
  filters.value = restored
}, { immediate: true })
watch(results, value => { if (selected.value && !value.some(x => x.id === selected.value)) selected.value = null }, { immediate: true })
function selectMapProperty(id) { selected.value = id; if (id) mapMode.value = true }
watch(() => route.fullPath, () => { error.value = ''; selectedUnit.value = null; photoIndex.value = 0; if (isSearch.value && Object.keys(route.query).length) filters.value = initialFilters() })
const chosen = computed(() => results.value.find(x => x.id === selected.value))
const units = computed(() => property.value ? db.value.units.filter(x => x.propertyId === property.value.id) : [])
const availableUnits = computed(() => units.value.filter(u => { try { return u.capacity >= filters.value.guests && (filters.value.maxPrice == null || unitRate(u) <= filters.value.maxPrice) && available(db.value, u.id, filters.value.checkIn, filters.value.checkOut) && quote(u, filters.value.checkIn, filters.value.checkOut) } catch { return false } }))
const activeCount = computed(() => activeTags.value.length)
const unitRate = unit => unit.baseMonthly ?? unit.baseNightly
const periodLabel = property => property?.rentalMode === 'long_term' ? 'месяц' : 'ночь'
const format = n => new Intl.NumberFormat('ru-RU').format(n || 0)
const date = s => { const [y,m,d] = s.split('-').map(Number); return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d))) }
const dateRange = computed(() => { try { return `${date(filters.value.checkIn)} — ${date(filters.value.checkOut)}` } catch { return 'Выберите даты' } })
const money = unit => { try { return quote(unit, filters.value.checkIn, filters.value.checkOut) } catch { return null } }
const photo = p => p?.images?.[0] || '/demo/p1.svg'
const galleryImages = computed(() => {
  const images = property.value?.images || []
  const example = seed.properties.find(p => p.id === property.value?.id)
  if (['p1','p2'].includes(property.value?.id) && images.length === 1 && images[0] === example?.images[0]) return example.images
  return images.length ? images : ['/demo/p1.svg']
})
function movePhoto(step) { photoIndex.value = (photoIndex.value + step + galleryImages.value.length) % galleryImages.value.length }
const unitImage = unit => unit.image || seed.units.find(example => example.id === unit.id && example.propertyId === unit.propertyId)?.image
function unitAvailability(unit) {
  const day = hostDay.value || db.value.demoToday
  const block = db.value.blocks.find(b => b.unitId === unit.id && b.start <= day && day < b.end)
  if (block) return { label: block.reason.trim().toLocaleLowerCase('ru') === 'ремонт' ? 'Закрыт на ремонт' : 'Закрыт', kind: 'blocked' }
  const booking = db.value.bookings.find(b => b.unitId === unit.id && ['pending_host','confirmed','paid','checked_in'].includes(b.status) && b.checkIn <= day && day < b.checkOut)
  if (!booking) return { label: 'Свободен', kind: 'free' }
  if (booking.status === 'pending_host') return { label: statuses.pending_host, kind: 'booked' }
  if (booking.checkIn === day) return { label: 'Заезд сегодня', kind: 'booked' }
  return { label: `Занят до ${date(booking.checkOut)}`, kind: 'booked' }
}
const query = () => ({ rentalMode: filters.value.rentalMode || 'short_term', region: filters.value.region || '', checkIn: filters.value.checkIn, checkOut: filters.value.checkOut, guests: String(filters.value.guests), maxPrice: filters.value.maxPrice == null ? '' : String(filters.value.maxPrice), city: filters.value.city || '', amenities: (filters.value.amenities || []).join(','), type: filters.value.type || '', videoVerified: filters.value.videoVerified ? '1' : '0' })
function normalizeFilters(value) {
  return { ...clone(value), rentalMode: value.rentalMode || 'short_term', amenities: [...(value.amenities || [])], region: value.region || null, city: value.city || null, type: value.type || '', maxPrice: value.maxPrice === '' || value.maxPrice == null ? null : value.maxPrice }
}
function revealElement(element, focus = false) {
  if (!element || typeof window === 'undefined') return
  const bounds = element.getBoundingClientRect()
  if (bounds.top < 0 || bounds.bottom > window.innerHeight - 90) element.scrollIntoView?.({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  if (focus) element.focus({ preventScroll: true })
}
async function openSearchPanel(panel, focusPrice = false) {
  if (searchPanel.value === panel && !focusPrice) { closeSearchPanel(); return }
  if (searchPanel.value !== panel) draft.value = normalizeFilters(filters.value)
  error.value = ''; invalidField.value = ''; searchPanel.value = panel
  await nextTick()
  revealElement(searchPanelElement.value)
  if (focusPrice) priceField.value?.focus({ preventScroll: true })
}
function closeSearchPanel() {
  const panel = searchPanel.value
  searchPanel.value = ''; draft.value = null; error.value = ''; invalidField.value = ''
  if (typeof document !== 'undefined') document.querySelector(`[data-search-panel="${panel}"]`)?.focus({ preventScroll: true })
}
function validateSearch(value) {
  invalidField.value = 'checkIn'
  day(value.checkIn)
  invalidField.value = 'checkOut'
  const count = nights(value.checkIn, value.checkOut)
  if (value.rentalMode === 'long_term' && count < 30) throw new Error('Minimum 30 nights')
  invalidField.value = 'guests'
  if (!Number.isInteger(value.guests) || value.guests < 1 || value.guests > 20) throw new Error('Invalid guests')
  invalidField.value = 'maxPrice'
  search(db.value, value)
  invalidField.value = ''
}
async function commitFilters(value, reveal = true) {
  if (!demoReady.value) return false
  const proposed = normalizeFilters(value)
  try { validateSearch(proposed) } catch {
    error.value = { checkIn: 'Укажите корректную дату заезда', checkOut: proposed.rentalMode === 'long_term' ? 'Выберите выезд не раньше чем через 30 ночей после заезда' : 'Выезд должен быть позже заезда', guests: 'Укажите от 1 до 20 гостей', maxPrice: 'Укажите целую неотрицательную цену или оставьте поле пустым' }[invalidField.value]
    await nextTick()
    const field = searchPanelElement.value?.querySelector(`[name="${invalidField.value}"]`)
    revealElement(field, true)
    return false
  }
  store.setFilters(proposed)
  filters.value = proposed
  closeSearchPanel()
  await router.replace({ path: path.value.startsWith('/stays/') ? route.path : link('/search'), query: query() })
  await nextTick()
  if (reveal) revealElement(isSearch.value ? resultHeading.value : document.getElementById('booking-options'), true)
  return true
}
function applyFilters() { return commitFilters(draft.value || filters.value) }
function changeRentalMode(mode) {
  if (mode === filters.value.rentalMode) return
  modeFilters.value[filters.value.rentalMode] = normalizeFilters(filters.value)
  const saved = modeFilters.value[mode]
  const next = saved ? { ...saved, region: filters.value.region, city: filters.value.city, guests: filters.value.guests } : { ...normalizeFilters(filters.value), rentalMode: mode, maxPrice: null, checkOut: addDays(filters.value.checkIn, mode === 'long_term' ? 30 : 4), amenities: (filters.value.amenities || []).filter(key => db.value.properties.some(p => (p.rentalMode || 'short_term') === mode && p.amenities.includes(key))) }
  previousDates.value = null
  return commitFilters(next, false)
}
function withoutRestrictions(value) { return { ...normalizeFilters(value), maxPrice: null, amenities: [], type: '', videoVerified: false } }
function clearFilters() { return commitFilters(withoutRestrictions(filters.value)) }
function resetDraft() { draft.value = withoutRestrictions(draft.value); error.value = ''; invalidField.value = '' }
function removeTag(key) {
  const next = normalizeFilters(filters.value)
  if (key === 'maxPrice') next.maxPrice = null
  else if (key === 'type') next.type = ''
  else if (key === 'videoVerified') next.videoVerified = false
  else next.amenities = next.amenities.filter(amenity => amenity !== key)
  return commitFilters(next, false)
}
function toggleQuickAmenity(key) {
  const next = normalizeFilters(filters.value)
  next.amenities = next.amenities.includes(key) ? next.amenities.filter(amenity => amenity !== key) : [...next.amenities, key]
  return commitFilters(next, false)
}
function now() {
  if (filters.value.rentalMode === 'long_term') return
  const next = normalizeFilters(filters.value)
  if (isNow.value) Object.assign(next, previousDates.value || { checkIn: seed.defaultSearch.checkIn, checkOut: seed.defaultSearch.checkOut })
  else { previousDates.value = { checkIn: next.checkIn, checkOut: next.checkOut }; next.checkIn = db.value.demoToday; next.checkOut = addDays(db.value.demoToday, 1) }
  return commitFilters(next, false)
}
function cycleResult(step) { const index = results.value.findIndex(item => item.id === selected.value); selected.value = results.value[(index + step + results.value.length) % results.value.length]?.id || null }
function goStay(p) { router.push({ path: link(`/stays/${p.id}`), query: query() }) }
function goCheckout(u) { store.setFilters(filters.value); router.push(link(`/checkout/${u.id}`)) }
function book() {
  try { store.book({ id: crypto.randomUUID(), unitId: currentUnit.value.id, guestId: 'guest1', guests: filters.value.guests, checkIn: filters.value.checkIn, checkOut: filters.value.checkOut }); router.push(link('/bookings')) } catch (e) { error.value = e.message === 'Unavailable' ? 'Эти даты уже заняты. Выберите другие даты.' : 'Проверьте параметры бронирования.' }
}
const actionError = error => error.message === 'Minimum 30 nights' ? 'Долгосрочная аренда доступна от 30 ночей' : ['Invalid date','Invalid range'].includes(error.message) ? 'Проверьте даты: выезд должен быть позже заезда' : error.message
function addManualBooking() { try { store.addManualBooking(manualBooking); showManualBooking.value = false; error.value = '' } catch (e) { error.value = actionError(e) } }
function transition(b, status, role) { try { store.transition(b.id, status, role); error.value = '' } catch (e) { error.value = e.message } }
function saveProperty() { try { store.saveProperty(editor.value); editor.value = null; error.value = '' } catch (e) { error.value = e.message } }
function createProperty() { try { const result = store.addProperty(newProperty); showNew.value = false; router.push(link(`/host/properties/${result}`)) } catch (e) { error.value = e.message } }
function saveUnit() { try { store.saveUnit(unitEditor.value); unitEditor.value = null; error.value = '' } catch (e) { error.value = e.message } }
function addBlock() { try { store.block(blockUnit.value, blockStart.value, blockEnd.value); error.value = ''; blockUnit.value = '' } catch (e) { error.value = actionError(e) } }
const ownProperties = computed(() => db.value.properties.filter(p => p.ownerId === 'host1' && (hostType.value === 'all' || p.type === hostType.value)))
function hostSummary(property) {
  const propertyUnits = db.value.units.filter(unit => unit.propertyId === property.id)
  const unitIds = new Set(propertyUnits.map(unit => unit.id))
  const bookings = db.value.bookings.filter(booking => unitIds.has(booking.unitId) && ['pending_host','confirmed','paid','checked_in'].includes(booking.status))
  if (property.type === 'hotel' || property.type === 'hostel') {
    const occupied = new Set(bookings.filter(booking => booking.checkIn <= db.value.demoToday && db.value.demoToday < booking.checkOut).map(booking => booking.unitId)).size
    return `${propertyUnits.length} ед. размещения · ${occupied} занято сегодня`
  }
  const next = bookings.filter(booking => booking.checkIn >= db.value.demoToday).map(booking => booking.checkIn).sort()[0]
  return next ? `Ближайший заезд · ${date(next)}` : `${propertyUnits.length} ед. размещения`
}
const userBookings = computed(() => db.value.bookings.filter(b => b.guestId === 'guest1').slice().sort((a,b) => Number(['cancelled','completed'].includes(a.status)) - Number(['cancelled','completed'].includes(b.status)) || a.checkIn.localeCompare(b.checkIn)))
const bookingInfo = b => { const unit = db.value.units.find(x => x.id === b.unitId); return { unit, property: db.value.properties.find(p => p.id === unit?.propertyId) } }
const favorites = computed(() => db.value.properties.filter(p => p.status === 'published' && store.data?.favorites.includes(p.id)))
const isFavorite = p => demoReady.value && store.data?.favorites.includes(p.id)
const name = computed(() => property.value?.title || 'Жильё на юге')
useSeoMeta({ title: () => `${name.value} · ${brandName}`, description: () => property.value?.description || `Аренда жилья: ${serviceArea}` })
useHead(() => ({ link: [{ rel: 'canonical', href: route.path }] }))
useHead(() => isTg.value ? { script: [{ src: 'https://telegram.org/js/telegram-web-app.js', onload: () => window.dispatchEvent(new Event('telegram-web-app-ready')) }] } : {})
const modalOpen = computed(() => !!editor.value || !!unitEditor.value || showNew.value || showManualBooking.value)
const sheetTitle = computed(() => editor.value ? 'Редактировать объект' : unitEditor.value ? 'Единица размещения' : showManualBooking.value ? 'Добавить бронь' : 'Новый объект')
function closeSheet() { editor.value = null; unitEditor.value = null; showNew.value = false; showManualBooking.value = false }
</script>

<template>
<div class="screen-content">
  <div v-if="demoReady && store.restoreWarning" class="notice">Сохранённые демо-данные повреждены или устарели. Восстановлены исходные примеры.</div><div v-if="demoReady && store.storageWarning" class="notice">Не удалось сохранить данные браузера: изменения доступны только до перезагрузки.</div>
  <SearchMapLayout v-if="isSearch" :expanded="!mapMode || !!searchPanel" @update:expanded="value => { mapMode = !value; if (!value) closeSearchPanel() }">
    <div class="search-heading"><div><div class="eyebrow">{{ serviceArea }} · ДЕМО</div><h1>Найдите своё <em>место</em></h1><p>Квартиры, дома и комнаты для поездок и жизни</p></div><div class="heading-note">Ваша следующая<br>история начинается здесь <span>↗</span></div></div>
    <div class="rental-tabs"><button :class="{active: filters.rentalMode !== 'long_term'}" @click="changeRentalMode('short_term')">Посуточно</button><button :class="{active: filters.rentalMode === 'long_term'}" @click="changeRentalMode('long_term')">Долгосрок · от 30 ночей</button></div>
    <div class="search-controls">
      <button class="search-trigger destination-trigger" data-search-panel="destination" :aria-expanded="searchPanel === 'destination'" aria-controls="search-editor" @click="openSearchPanel('destination')"><span>⌖</span><span><small>НАПРАВЛЕНИЕ</small><b>{{ destinationLabel }}</b></span><span class="arrow disclosure-chevron" aria-hidden="true"></span></button>
      <button class="search-trigger" data-search-panel="dates" :aria-expanded="showDates" aria-controls="search-editor" @click="openSearchPanel('dates')"><span>▦</span><span><small>ДАТЫ И ГОСТИ</small><b>{{ dateRange }} · {{ filters.guests }} гост.</b></span><span class="arrow disclosure-chevron" aria-hidden="true"></span></button>
      <div class="quick-filters">
        <button class="chip" :class="{selected: filters.maxPrice != null}" @click="openSearchPanel('filters', true)">{{ filters.maxPrice != null ? `До ${format(filters.maxPrice)} ₽${filters.rentalMode === 'long_term' ? '/мес' : '/ночь'}` : 'Цена' }}</button>
        <button v-if="filters.rentalMode !== 'long_term'" class="chip" :class="{selected: filters.amenities?.includes('sea_view')}" :aria-pressed="!!filters.amenities?.includes('sea_view')" @click="toggleQuickAmenity('sea_view')">Вид на море</button>
        <button v-if="filters.rentalMode !== 'long_term'" class="chip" :class="{selected: isNow}" :aria-pressed="isNow" @click="now">Заезд сегодня</button>
      </div>
      <div class="filter-toggles">
        <button class="btn outline all-filters" data-search-panel="filters" :aria-expanded="showFilters" aria-controls="search-editor" @click="openSearchPanel('filters')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>Все фильтры <span v-if="activeCount">· {{ activeCount }}</span></button>
        <button v-if="activeCount" class="filter-reset" type="button" aria-label="Сбросить фильтры" @click="clearFilters"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>
    </div>
    <section v-if="searchPanel && draft" id="search-editor" ref="searchPanelElement" class="filter-panel" :aria-label="showDates ? 'Даты и гости' : showFilters ? 'Все фильтры' : 'Направление'" @keydown.esc.stop.prevent="closeSearchPanel">
      <div class="filter-panel-heading"><h2>{{ showDates ? 'Даты и гости' : showFilters ? 'Все фильтры' : 'Направление' }}</h2><button class="close" aria-label="Закрыть без применения" @click="closeSearchPanel">×</button></div>
      <div v-if="searchPanel === 'destination'" class="filter-fields destination-fields"><label>Регион<select v-model="draft.region" @change="draft.city = null"><option :value="null">Все регионы</option><option v-for="(label,key) in regionLabels" :key="key" :value="key">{{ label }}</option></select></label><label>Город<select v-model="draft.city"><option :value="null">Все города</option><option v-for="location in locations.filter(location => !draft.region || location.region === draft.region)" :key="location.slug" :value="location.city">{{ location.city }}</option></select></label></div>
      <SearchDateFields v-else-if="showDates" v-model="draft" :invalid-field="invalidField" />
      <div v-else class="filter-fields">
        <label>{{ filters.rentalMode === 'long_term' ? 'Цена за месяц, до ₽' : 'Цена за ночь, до ₽' }}<input ref="priceField" v-model.number="draft.maxPrice" name="maxPrice" type="number" min="0" placeholder="Без ограничений" :aria-invalid="invalidField === 'maxPrice'" :aria-describedby="invalidField === 'maxPrice' ? 'search-error' : undefined"></label>
        <label>Тип жилья<select v-model="draft.type"><option value="">Любой</option><option v-for="(label,key) in labels" :key="key" :value="key">{{ label }}</option></select></label>
        <fieldset class="amenity-options"><legend>Удобства</legend><div class="check-list"><label v-for="[key,label] in amenityOptions" :key="key"><input v-model="draft.amenities" type="checkbox" :value="key"> {{ label }}</label></div><p v-if="!amenityOptions.length" class="muted">Базовые удобства есть во всех объектах этого режима аренды.</p></fieldset>
        <fieldset class="verification-option"><legend>Дополнительно</legend><label><input v-model="draft.videoVerified" type="checkbox"> Видео проверено</label><p class="muted">В демо — отметка в примерах объявлений, без реальной проверки.</p></fieldset>
      </div>
      <div v-if="error" id="search-error" class="error" role="alert">{{ error }}</div>
      <div class="filter-actions"><button v-if="showFilters" class="btn outline" @click="resetDraft">Сбросить</button><button class="btn primary" :disabled="!demoReady" @click="applyFilters()">{{ resultActionLabel }}</button></div>
    </section>
    <div v-if="activeTags.length" class="active-filters" aria-label="Применённые фильтры"><button v-for="tag in activeTags" :key="tag.key" class="chip" :aria-label="`Убрать фильтр: ${tag.label}`" @click="removeTag(tag.key)">{{ tag.label }} <span aria-hidden="true">×</span></button><button class="back" @click="clearFilters">Сбросить ограничения</button></div>
    <div v-if="demoReady && filters.rentalMode === 'long_term' && !db.properties.some(p => p.rentalMode === 'long_term' && p.status === 'published')" class="notice">В сохранённом демо пока нет объектов долгосрочной аренды. Чтобы загрузить новые примеры, откройте <NuxtLink :to="link('/profile')">профиль и сбросьте демо</NuxtLink>. Текущие изменения демо будут удалены.</div>
    <div ref="resultHeading" class="results-heading" tabindex="-1"><div><span class="eyebrow">ПОДБОРКА ДЛЯ ВАС</span><h2>Жильё для вас <span>{{ results.length }}</span></h2></div><div class="view-switch"><button :class="{active: mapMode}" @click="mapMode = true">⌖ Карта</button><button :class="{active: !mapMode}" @click="mapMode = false">☰ Список</button></div></div>
    <div v-if="scenario === 'loading'" class="empty">Загружаем варианты…</div><div v-else-if="scenario === 'error'" class="empty"><b>Не удалось загрузить варианты</b><p>Это демонстрация ошибки соединения.</p><button class="btn primary" @click="scenario = 'normal'">Попробовать ещё раз</button></div><div v-else id="search-results" class="results-layout"><div class="result-list" v-show="!mapMode"><div v-if="!results.length" class="empty"><b>Ничего не нашлось</b><p>Попробуйте изменить даты или фильтры</p><button class="btn outline" @click="clearFilters">Сбросить фильтры</button></div><article v-for="p in results" :key="p.id" class="property-card" role="link" tabindex="0" :aria-label="p.title" @click="goStay(p)" @keydown.enter.self="goStay(p)" @keydown.space.self.prevent="goStay(p)"><div class="card-image"><img :src="photo(p)" :alt="p.title"><span class="image-tag">{{ labels[p.type] }}</span><button class="heart" :disabled="!demoReady" :aria-label="isFavorite(p) ? 'Убрать из избранного' : 'В избранное'" @click.stop="store.toggleFavorite(p.id)">{{ isFavorite(p) ? '♥' : '♡' }}</button></div><div class="card-content"><div class="card-top"><span class="eyebrow">{{ p.city }} · {{ regionLabels[propertyRegion(p)] || 'Юг России' }}</span><span>★ {{ p.rating }}</span></div><h3>{{ p.title }}</h3><p>{{ p.description }}</p><div v-if="p.videoVerified" class="verified">▣ Видео проверено</div><div class="card-bottom"><span><b>{{ format(p.priceFrom) }} ₽</b> / {{ periodLabel(p) }}</span><span class="circle">↗</span></div></div></article></div></div>
    <template #map="{ padding, interactive }"><div class="map"><ClientOnly><YandexMap :properties="results" :selected="selected" :padding="padding" :interactive="interactive" @select="selectMapProperty" /><template #fallback><div class="map-loading">Загружаем карту…</div></template></ClientOnly><div v-if="!results.length && interactive" class="map-empty"><b>Ничего не нашлось</b><span>Измените даты или фильтры</span><button class="btn primary" @click="clearFilters">Сбросить фильтры</button></div><article v-if="chosen && interactive" class="map-card" role="link" tabindex="0" :aria-label="chosen.title" @click="goStay(chosen)" @keydown.enter.self="goStay(chosen)" @keydown.space.self.prevent="goStay(chosen)"><img :src="photo(chosen)" :alt="chosen.title"><div><strong>{{ chosen.title }}</strong><small>{{ chosen.city }} · {{ labels[chosen.type] }}</small><span>★ {{ chosen.rating }} <i v-if="chosen.videoVerified"> · Видео проверено</i></span><b>{{ format(chosen.priceFrom) }} ₽ <small>/ {{ periodLabel(chosen) }}</small></b></div><div class="map-actions"><button class="map-card-close" aria-label="Закрыть карточку объекта" @click.stop="selectMapProperty(null)">×</button><div v-if="results.length > 1" class="map-cycle"><button aria-label="Предыдущий объект" @click.stop="cycleResult(-1)">‹</button><button aria-label="Следующий объект" @click.stop="cycleResult(1)">›</button></div><span v-else class="circle">→</span></div></article></div></template>
  </SearchMapLayout>
  <main v-else-if="path.startsWith('/stays/')" class="detail-page"><template v-if="property"><button class="back" aria-label="Назад к поиску" @click="router.back()">← Назад к поиску</button><div class="detail-grid"><div><div class="detail-photo"><img :src="galleryImages[photoIndex]" :alt="`${property.title} · фото ${photoIndex + 1}`"><template v-if="galleryImages.length > 1"><button class="gallery-prev" aria-label="Предыдущее фото" @click="movePhoto(-1)">‹</button><button class="gallery-next" aria-label="Следующее фото" @click="movePhoto(1)">›</button><span class="gallery-count">{{ photoIndex + 1 }} / {{ galleryImages.length }}</span></template><button class="heart" :disabled="!demoReady" @click="store.toggleFavorite(property.id)" aria-label="Избранное">{{ isFavorite(property) ? '♥' : '♡' }}</button><span class="image-tag">Демонстрационное изображение</span></div><div class="detail-copy"><div class="eyebrow">{{ property.city }} · {{ labels[property.type] }}</div><h1>{{ property.title }}</h1><div class="meta"><span v-if="property.videoVerified" class="verified">▣ Видео проверено</span><span>★ {{ property.rating }} · {{ property.reviewCount }} отзывов</span></div><div class="features"><span v-for="a in property.amenities" :key="a">{{ {sea_view:'⌁ Вид на море',terrace:'☼ Терраса',wifi:'⌁ Wi-Fi',parking:'▣ Парковка',kitchen:'Кухня',washer:'Стиральная машина',air_conditioning:'Кондиционер'}[a] || a }}</span></div><h2>Об этом месте</h2><p>{{ property.description }}</p><p class="muted">Все сведения и отзывы в демо вымышлены.</p></div></div><aside id="booking-options" class="booking-panel"><div class="eyebrow">ВАШЕ ПУТЕШЕСТВИЕ</div><h2>Выберите жильё</h2><button class="search-trigger full" data-search-panel="dates" :aria-expanded="showDates" aria-controls="stay-date-editor" @click="openSearchPanel('dates')">▦ &nbsp; {{ dateRange }} · {{ filters.guests }} гост. <span class="arrow disclosure-chevron" aria-hidden="true"></span></button><section v-if="showDates && draft" id="stay-date-editor" ref="searchPanelElement" class="filter-panel" aria-label="Даты и гости" @keydown.esc.stop.prevent="closeSearchPanel"><SearchDateFields v-model="draft" :invalid-field="invalidField" /><div v-if="error" id="search-error" class="error" role="alert">{{ error }}</div><div class="filter-actions"><button class="btn outline" @click="closeSearchPanel">Отмена</button><button class="btn primary" @click="applyFilters()">Применить</button></div></section><p class="muted">Доступные варианты на выбранные даты</p><p v-if="property.rentalMode === 'long_term'" class="muted">От 30 ночей. Месяц — 30 дней; неполный месяц рассчитывается пропорционально.</p><div v-if="!availableUnits.length" class="empty compact">На эти даты нет подходящих вариантов.</div><button v-for="u in availableUnits" :key="u.id" class="unit-row" :class="{chosen: selectedUnit === u.id}" :aria-pressed="selectedUnit === u.id" @click="selectedUnit = u.id"><span><b>{{ u.label }}</b><small>До {{ u.capacity }} гостей</small></span><span><b>{{ format(unitRate(u)) }} ₽</b><small>за {{ periodLabel(property) }}</small></span></button><div v-if="selectedUnit && money(units.find(x => x.id === selectedUnit))" class="total"><span>Итого</span><b>{{ format(money(units.find(x => x.id === selectedUnit)).total) }} ₽</b></div><button class="btn primary full" :disabled="!selectedUnit || !demoReady" @click="goCheckout(units.find(x => x.id === selectedUnit))">Забронировать →</button><small class="muted">Пока ничего не оплачивается</small></aside></div><div class="mobile-book-bar"><span><b>от {{ format(Math.min(...(availableUnits.length ? availableUnits : units).map(unitRate))) }} ₽</b><small>за {{ periodLabel(property) }}</small></span><a href="#booking-options" class="btn primary">Выбрать жильё ↓</a></div></template><div v-else class="empty">Объект не найден</div></main>
  <main v-else-if="!demoReady" class="page-container"><div class="skeleton-block"></div><p>Загружаем ваши данные…</p></main>
  <main v-else-if="path.startsWith('/checkout/')" class="page-container narrow"><template v-if="currentUnit && unitProperty?.status === 'published'"><NuxtLink :to="link(`/stays/${unitProperty.id}`)" class="back">← К объекту</NuxtLink><div class="eyebrow">ПОЧТИ ГОТОВО</div><h1>Ваша поездка</h1><div class="panel"><div class="summary-property"><img :src="photo(unitProperty)" :alt="unitProperty.title"><div><h3>{{ unitProperty.title }}</h3><p>{{ unitProperty.city }} · {{ currentUnit.label }}</p></div></div><div class="line"><span>Даты</span><b>{{ dateRange }}</b></div><div class="line"><span>Гости</span><b>{{ filters.guests }}</b></div><div v-if="money(currentUnit)" class="line"><span v-if="currentUnit.baseMonthly != null">{{ format(currentUnit.baseMonthly) }} ₽/мес × {{ money(currentUnit).nights }}/30</span><span v-else>{{ format(currentUnit.baseNightly) }} ₽ × {{ money(currentUnit).nights }} ноч.</span><b>{{ format(money(currentUnit).total - currentUnit.cleaningFee) }} ₽</b></div><p v-if="currentUnit.baseMonthly != null" class="muted">Минимум 30 ночей. Цена за месяц из 30 дней; итог округлён до целого рубля.</p><div class="line"><span>Уборка</span><b>{{ format(currentUnit.cleaningFee) }} ₽</b></div><div class="line total"><span>Итого</span><b>{{ format(money(currentUnit)?.total) }} ₽</b></div><div v-if="error" class="error" role="alert">{{ error }}</div><button class="btn primary full" @click="book">Отправить демо-заявку</button><p class="muted">Демо-бронирование. Реальные платежи и уведомления не выполняются.</p></div></template><div v-else class="empty">Вариант размещения не найден.</div></main>
  <main v-else-if="path === '/bookings' || path === '/host/bookings'" class="page-container narrow"><div class="eyebrow">{{ isHost ? 'КАБИНЕТ ХОЗЯИНА' : 'ВАШИ ПУТЕШЕСТВИЯ' }}</div><h1>Бронирования</h1><p class="muted">{{ isHost ? 'Управляйте заявками гостей' : 'Все ваши поездки в одном месте' }}</p><button v-if="isHost" class="btn primary manual-button" @click="showManualBooking = true">＋ Добавить бронь вручную</button><div v-if="error" class="error" role="alert">{{ error }}</div><HostInventoryNav v-if="isHost" /><HostBookings v-if="isHost" :db="db" :booking-id="linkedBookingId" @transition="(booking, status) => transition(booking, status, 'host')" /><div v-if="!isHost && !userBookings.length" class="empty">Пока нет бронирований. <NuxtLink :to="link('/search')">Найти жильё →</NuxtLink></div><template v-if="!isHost"><article v-for="b in userBookings" :key="b.id" class="booking-card"><div class="summary-property"><img :src="photo(bookingInfo(b).property)" alt=""><div><div class="badge-status">{{ statuses[b.status] }}</div><small v-if="b.source === 'manual'" class="muted"> · Добавлена хозяином</small><h3>{{ bookingInfo(b).property?.title }}</h3><p>{{ bookingInfo(b).unit?.label }} · {{ date(b.checkIn) }} — {{ date(b.checkOut) }}</p><b>{{ format(b.total) }} ₽</b></div></div><div class="actions"><button v-if="b.status === 'confirmed'" class="btn primary" @click="transition(b,'paid','guest')">Симулировать оплату</button><button v-if="['pending_host','confirmed','paid'].includes(b.status)" class="btn outline" @click="transition(b,'cancelled','guest')">Отменить</button></div></article></template></main>
  <main v-else-if="path === '/favorites'" class="page-container"><div class="eyebrow">ВАША КОЛЛЕКЦИЯ</div><h1>Избранное</h1><div v-if="!favorites.length" class="empty">Здесь пока пусто. Сохраняйте понравившиеся места ♡<p><NuxtLink :to="link('/search')">Найти жильё →</NuxtLink></p></div><div class="favorites-grid"><article v-for="p in favorites" :key="p.id" class="property-card" role="link" tabindex="0" :aria-label="p.title" @click="goStay(p)" @keydown.enter.self="goStay(p)" @keydown.space.self.prevent="goStay(p)"><div class="card-image"><img :src="photo(p)" :alt="p.title"><button class="heart" aria-label="Убрать из избранного" @click.stop="store.toggleFavorite(p.id)">♥</button></div><div class="card-content"><span class="eyebrow">{{ p.city }}</span><h3>{{ p.title }}</h3><p>{{ labels[p.type] }}</p></div></article></div></main>
  <main v-else-if="path === '/profile'" class="page-container narrow"><div class="eyebrow">ВАШ ПРОФИЛЬ</div><h1>Здравствуйте!</h1><div class="panel"><h3>Демо-гость</h3><p>Данные сохраняются только в этом браузере.</p><NuxtLink class="btn outline" :to="link('/host/properties')">Перейти в кабинет хозяина ↗</NuxtLink><hr><p>Демо-дата: {{ date(db.demoToday) }} {{ db.demoToday.slice(0,4) }} · Москва</p><label class="calendar-date">Дата в демо<input v-model="clockDate" type="date"></label><button class="btn outline" @click="setClock">Применить демо-дату</button><div v-if="error" class="error" role="alert">{{ error }}</div><div class="actions demo-actions"><button class="btn outline" @click="simulateLoading(); router.push(link('/search'))">Показать загрузку</button><button class="btn outline" @click="scenario = 'error'; router.push(link('/search'))">Показать ошибку</button></div><button class="btn outline" @click="store.reset(); filters = initialFilters()">Сбросить демо</button><p class="muted">Восстановит {{ seed.properties.length }} объектов, {{ seed.bookings.length }} примеров броней и избранное. Текущие изменения демо будут удалены.</p></div></main>
  <main v-else-if="isHost" class="page-container"><div class="host-head"><div><div class="eyebrow">КАБИНЕТ ХОЗЯИНА · ДЕМО</div><h1>{{ path === '/host/calendar' ? 'Календарь' : path === '/host/bot' ? 'Мой бот' : path === '/host/audit' ? 'Журнал действий' : property ? property.title : 'Мои объекты' }}</h1><p class="muted">{{ property ? `${property.city} · ${labels[property.type]}` : 'Ваши объекты, бронирования и личный бот — в одном месте' }}</p></div><button v-if="!property && !['/host/calendar','/host/bot','/host/audit'].includes(path)" class="btn primary" @click="showNew = true">＋ Добавить объект</button></div><nav class="host-nav"><NuxtLink :to="link('/host/properties')">Объекты</NuxtLink><NuxtLink :to="link('/host/calendar')">Календарь</NuxtLink><NuxtLink :to="link('/host/bookings')">Брони</NuxtLink><NuxtLink :to="link('/host/bot')">Мой бот</NuxtLink><NuxtLink :to="link('/host/audit')">Журнал</NuxtLink><NuxtLink :to="link('/profile')">Профиль</NuxtLink></nav><div v-if="error" class="error" role="alert">{{ error }}</div>
    <template v-if="path === '/host/audit'"><div class="panel"><h2>История изменений</h2><p class="muted">Демо-журнал хранится в этом браузере и очищается при сбросе.</p><div v-if="!store.data.audit?.length" class="empty compact">Пока нет действий</div><div v-for="event in store.data.audit" :key="event.id" class="line"><span>{{ event.message }}</span><small class="muted">{{ new Date(event.at).toLocaleString('ru-RU') }}</small></div></div></template>
    <template v-else-if="path === '/host/bot'"><BotPanel :bot="store.data.personalBot" @create="store.createBot()" @toggle="store.toggleBot()" /></template>
    <template v-else-if="path === '/host/calendar'"><HostInventoryNav /><HostCalendar :bookings-path="link('/host/bookings')" :booking-id="linkedBookingId" :db="db" :units="db.units.filter(x => ownProperties.some(p => p.id === x.propertyId))" v-model:start="calendarStart" @block-select="selectFreeDate" /><div ref="blockPanel" class="panel"><h2>Блокировка дат</h2><p class="muted">Бронирования и ремонт учитываются при проверке доступности.</p><div class="form-grid"><label>Единица<select v-model="blockUnit"><option value="">Выберите вариант</option><option v-for="u in db.units.filter(x => ownProperties.some(p => p.id === x.propertyId))" :key="u.id" :value="u.id">{{ db.properties.find(p => p.id === u.propertyId)?.title }} · {{ u.label }}</option></select></label><label>С<input v-model="blockStart" type="date"></label><label>До<input v-model="blockEnd" type="date"></label></div><button class="btn primary" @click="addBlock">Заблокировать даты</button></div><div class="panel"><h2>Занятость на {{ date(db.demoToday) }}</h2><div v-for="u in db.units.filter(x => ownProperties.some(p => p.id === x.propertyId))" :key="u.id" class="line"><span>{{ db.properties.find(p => p.id === u.propertyId)?.title }} · {{ u.label }}</span><span class="badge-status">{{ available(db,u.id,db.demoToday,nextDay(db.demoToday)) ? 'Свободен' : 'Занят / закрыт' }}</span></div></div></template>
    <template v-else-if="property"><div class="host-detail-image"><img :src="photo(property)" :alt="property.title"><span class="badge-status">{{ property.status === 'published' ? 'Опубликован' : 'Черновик' }}</span></div><div class="tabs"><button v-if="property.type !== 'apartment'" :class="{active:hostTab === 'units'}" @click="hostTab = 'units'">Номера</button><button :class="{active:hostTab === 'calendar'}" @click="hostTab = 'calendar'">Календарь</button><button :class="{active:hostTab === 'settings'}" @click="hostTab = 'settings'">Настройки</button></div><div v-if="hostTab === 'settings' || (property.type === 'apartment' && hostTab === 'units')" class="panel"><h2>Настройки объекта</h2><button class="btn outline" @click="editor = clone(property)">Редактировать объект</button><div v-for="u in units" :key="u.id" class="unit-row"><span><b>{{ u.label }}</b><small>{{ format(unitRate(u)) }} ₽ / {{ periodLabel(property) }} · до {{ u.capacity }} гостей</small></span><button class="btn outline" @click="unitEditor = clone(u)">Изменить</button></div><button class="btn primary" @click="editor = {...JSON.parse(JSON.stringify(property)), status: property.status === 'published' ? 'draft' : 'published'}; saveProperty()">{{ property.status === 'published' ? 'Снять с публикации' : 'Опубликовать' }}</button></div><template v-else-if="hostTab === 'calendar'"><HostCalendar :bookings-path="link('/host/bookings')" :db="db" :units="units" v-model:start="calendarStart" @block-select="selectFreeDate" /><div ref="blockPanel" class="panel"><h2>Блокировка дат</h2><div class="form-grid"><label>Единица<select v-model="blockUnit"><option value="">Выберите вариант</option><option v-for="u in units" :key="u.id" :value="u.id">{{ u.label }}</option></select></label><label>С<input v-model="blockStart" type="date"></label><label>До<input v-model="blockEnd" type="date"></label></div><button class="btn primary" @click="addBlock">Заблокировать</button></div></template><div v-else class="panel host-units"><h2>Номера и места</h2><label class="host-day">Дата просмотра<input v-model="hostDay" type="date"></label><div v-for="u in units" :key="u.id" class="host-unit-row"><img v-if="unitImage(u)" class="host-unit-photo" :src="unitImage(u)" alt="Демонстрационное фото номера"><span class="host-unit-copy"><b>{{ u.label }}</b><small>{{ u.capacity }} гост. · {{ format(unitRate(u)) }} ₽ / {{ periodLabel(property) }}</small></span><span class="host-unit-status" :class="unitAvailability(u).kind">{{ unitAvailability(u).label }}</span><button class="host-unit-edit" :aria-label="`Изменить ${u.label}`" @click="unitEditor = clone(u)">›</button></div><button class="btn outline full" @click="unitEditor = { id: uuid(), propertyId: property.id, label: '', kind: property.type === 'hostel' ? 'bed' : 'room', capacity: 1, baseNightly: property.rentalMode === 'long_term' ? 0 : 1000, ...(property.rentalMode === 'long_term' ? {baseMonthly: 35000} : {}), cleaningFee: 0 }">＋ Добавить номер или место</button></div></template>
    <template v-else><div class="chips"><button v-for="t in ['all','apartment','hotel','hostel']" :key="t" class="chip" :class="{selected:hostType === t}" @click="hostType = t">{{ t === 'all' ? 'Все' : labels[t] }}</button></div><div class="host-cards"><NuxtLink v-for="p in ownProperties" :key="p.id" :to="link(`/host/properties/${p.id}`)" class="host-card"><img :src="photo(p)" :alt="p.title"><div><span class="badge-status" :class="{draft: p.status === 'draft'}">{{ p.status === 'published' ? 'Опубликован' : 'Черновик' }}</span><h3>{{ p.title }}</h3><p>{{ labels[p.type] }} · {{ p.city }}</p><small>{{ hostSummary(p) }}</small><span v-if="p.status === 'draft'" class="host-continue">Продолжить →</span></div><span class="circle">↗</span></NuxtLink></div></template>
  </main>
  <UiSheet :open="modalOpen" :title="sheetTitle" @close="closeSheet"><div v-if="error" class="error" role="alert">{{ error }}</div>
    <template v-if="editor"><div class="form-stack"><label>Название<input v-model="editor.title"></label><label>Город<input v-model="editor.city"></label><label>Описание<textarea v-model="editor.description"></textarea></label></div><button class="btn primary full" @click="saveProperty">Сохранить</button></template>
    <template v-else-if="unitEditor"><div class="form-stack"><label>Название<input v-model="unitEditor.label"></label><label>Вместимость<input v-model.number="unitEditor.capacity" type="number" min="1"></label><label v-if="unitEditor.baseMonthly != null">Цена за месяц<input v-model.number="unitEditor.baseMonthly" type="number" min="1"></label><label v-else>Цена за ночь<input v-model.number="unitEditor.baseNightly" type="number" min="1"></label><label>Уборка<input v-model.number="unitEditor.cleaningFee" type="number" min="0"></label></div><button class="btn primary full" @click="saveUnit">Сохранить</button></template>
    <template v-else-if="showManualBooking"><div class="form-stack"><label>Единица<select v-model="manualBooking.unitId"><option value="">Выберите вариант</option><option v-for="u in db.units.filter(x => db.properties.some(p => p.id === x.propertyId && p.ownerId === 'host1'))" :key="u.id" :value="u.id">{{ db.properties.find(p => p.id === u.propertyId)?.title }} · {{ u.label }}</option></select></label><label>Заезд<input v-model="manualBooking.checkIn" type="date"></label><label>Выезд<input v-model="manualBooking.checkOut" type="date"></label><label>Гости<input v-model.number="manualBooking.guests" type="number" min="1"></label></div><p class="muted">Демо-бронь появится в общей шахматке.</p><button class="btn primary full" @click="addManualBooking">Добавить бронь</button></template>
    <template v-else><div class="form-stack"><label>Название<input v-model="newProperty.title"></label><label>Город<input v-model="newProperty.city"></label><label>Регион<select v-model="newProperty.region"><option v-for="(label,key) in regionLabels" :key="key" :value="key">{{ label }}</option></select></label><label>Аренда<select v-model="newProperty.rentalMode"><option value="short_term">Посуточно</option><option value="long_term">Долгосрок · от 30 ночей</option></select></label><label>Тип<select v-model="newProperty.type"><option value="apartment">Квартира</option><option value="hotel">Мини-отель</option><option value="hostel">Хостел</option></select></label><label>Описание<textarea v-model="newProperty.description"></textarea></label></div><button class="btn primary full" @click="createProperty">Создать черновик</button></template>
  </UiSheet>
</div>
</template>

<style scoped>
/* Layout and map chrome styles live in SearchMapLayout and main.css. */
</style>
