import { defineStore } from 'pinia'
import seed from '../../demo/seed.json'
import { available, createBooking, nights, quote, day, blockingStatuses } from '#shared/domain/booking'

import { validDemoState, validFilters } from '#shared/domain/validation'
import { demoCatalogVersion, upgradeDemoState } from '#shared/domain/migrations'

const KEY = 'rs-saas-demo'
const LEGACY_BACKUP_KEY = `${KEY}:v1-backup`
const DEFAULTS_BACKUP_KEY = `${KEY}:defaults-backup`
const CATALOG_BACKUP_KEY = `${KEY}:catalog-backup`
const fresh = () => ({ catalogVersion: demoCatalogVersion, db: structuredClone(seed), favorites: [...seed.favorites], filters: structuredClone(seed.defaultSearch), role: 'guest', personalBot: null, audit: [] })
export const useDemoStore = defineStore('demo', {
  state: () => ({ ready: false, data: /** @type {import('../../shared/types/demo').DemoState | null} */ (null), storageWarning: false, restoreWarning: false, scenario: 'normal', selectedPropertyId: /** @type {string | null} */ (null), mapMode: true }),
  actions: {
    restore() {
      let data = fresh()
      try {
        const raw = localStorage.getItem(KEY)
        if (raw) {
          const previous = JSON.parse(raw)
          const saved = upgradeDemoState(previous)
          if (validDemoState(saved)) {
            data = { ...saved, personalBot: saved.personalBot ?? null, audit: saved.audit ?? [] }
            if (previous?.db?.schemaVersion === 1 && !localStorage.getItem(LEGACY_BACKUP_KEY)) localStorage.setItem(LEGACY_BACKUP_KEY, raw)
            if (saved?.catalogVersion === demoCatalogVersion && previous?.catalogVersion == null && !localStorage.getItem(CATALOG_BACKUP_KEY)) localStorage.setItem(CATALOG_BACKUP_KEY, raw)
            if (JSON.stringify(saved.db.defaultSearch) !== JSON.stringify(previous.db.defaultSearch) && previous?.db?.schemaVersion !== 1 && !localStorage.getItem(DEFAULTS_BACKUP_KEY)) localStorage.setItem(DEFAULTS_BACKUP_KEY, raw)
          } else this.restoreWarning = true
        }
      } catch (error) { if (error instanceof SyntaxError) this.restoreWarning = true; else this.storageWarning = true }
      this.data = data; this.ready = true
    },
    record(message) { if (!Array.isArray(this.data.audit)) this.data.audit = []; this.data.audit.unshift({ id: crypto.randomUUID(), message, at: new Date().toISOString() }) },
    save() {
      if (!this.ready) return
      try { localStorage.setItem(KEY, JSON.stringify(this.data)) } catch { this.storageWarning = true }
    },
    reset() { this.data = fresh(); this.restoreWarning = false; this.storageWarning = false; this.scenario = 'normal'; this.selectedPropertyId = null; this.mapMode = true; try { localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_BACKUP_KEY); localStorage.removeItem(DEFAULTS_BACKUP_KEY); localStorage.removeItem(CATALOG_BACKUP_KEY) } catch { this.storageWarning = true } },
    toggleFavorite(id) { const list = this.data.favorites; this.data.favorites = list.includes(id) ? list.filter(x => x !== id) : [...list, id]; this.save() },
    setFilters(filters) { if (!validFilters(filters)) throw new Error('Проверьте параметры поиска'); this.data.filters = structuredClone(JSON.parse(JSON.stringify(filters))); this.save() },
    setClock(value) { day(value); this.data.db.demoToday = value; this.save() },
    setRole(role) { this.data.role = role; this.save() },
    createBot() { this.data.personalBot = { name: 'Мой бот · демо', token: `demo_${crypto.randomUUID()}`, active: true }; this.record('Создан или перевыпущен демо-токен бота'); this.save() },
    toggleBot() { if (this.data.personalBot) { this.data.personalBot.active = !this.data.personalBot.active; this.record(this.data.personalBot.active ? 'Демо-бот включён' : 'Демо-бот остановлен'); this.save() } },
    book(input) { this.data.db = createBooking(this.data.db, input); this.record('Создана демо-заявка на бронирование'); this.save() },
    addManualBooking(input) {
      const unit = this.data.db.units.find(x => x.id === input.unitId)
      const property = unit && this.data.db.properties.find(x => x.id === unit.propertyId)
      if (property?.ownerId !== 'host1' || !Number.isInteger(Number(input.guests)) || Number(input.guests) < 1 || Number(input.guests) > unit.capacity) throw new Error('Проверьте вариант и число гостей')
      if (!available(this.data.db, unit.id, input.checkIn, input.checkOut)) throw new Error('Даты пересекаются с бронью или блокировкой')
      const total = quote(unit, input.checkIn, input.checkOut)
      this.data.db.bookings.push({ id: crypto.randomUUID(), unitId: unit.id, guestId: 'guest1', guests: Number(input.guests), checkIn: input.checkIn, checkOut: input.checkOut, status: 'confirmed', nightlySnapshot: total.nightly, cleaningSnapshot: total.cleaningFee, total: total.total, ...(total.monthly == null ? {} : { monthlySnapshot: total.monthly }), source: 'manual' })
      this.record(`Добавлено бронирование вручную: ${property.title} · ${unit.label}`); this.save()
    },
    transition(id, status, role) {
      const b = this.data.db.bookings.find(x => x.id === id)
      const unit = b && this.data.db.units.find(x => x.id === b.unitId)
      const property = unit && this.data.db.properties.find(x => x.id === unit.propertyId)
      const allowed = role === 'host' && property?.ownerId === 'host1' ? { pending_host: ['confirmed', 'cancelled'], confirmed: ['cancelled'], paid: ['checked_in', 'cancelled'], checked_in: ['completed'] } : role === 'guest' && b?.guestId === 'guest1' ? { pending_host: ['cancelled'], confirmed: ['paid', 'cancelled'], paid: ['cancelled'] } : {}
      if (!b || !allowed[b.status]?.includes(status)) throw new Error('Недопустимое изменение статуса')
      b.status = status; this.record(`Изменён статус бронирования ${b.id}: ${status}`); this.save()
    },
    block(unitId, start, end) {
      const unit = this.data.db.units.find(x => x.id === unitId)
      const property = unit && this.data.db.properties.find(x => x.id === unit.propertyId)
      if (property?.ownerId !== 'host1') throw new Error('Объект не найден')
      nights(start, end)
      if (!available(this.data.db, unitId, start, end)) throw new Error('Даты пересекаются с бронью или блокировкой')
      this.data.db.blocks.push({ id: crypto.randomUUID(), unitId, start, end, reason: 'manual' }); this.record(`Заблокированы даты ${start} — ${end} для ${unit.label}`); this.save()
    },
    saveProperty(property) {
      const current = this.data.db.properties.find(x => x.id === property.id)
      if (!current || current.ownerId !== 'host1') throw new Error('Объект не найден')
      if (!property.title?.trim() || !property.city?.trim() || !property.description?.trim()) throw new Error('Заполните название, город и описание')
      if (property.status === 'published' && !this.data.db.units.some(x => x.propertyId === property.id)) throw new Error('Добавьте хотя бы одну единицу размещения')
      Object.assign(current, property); this.record(`Изменён объект: ${current.title}`); this.save()
    },
    addProperty(input) {
      if (!input.title.trim() || !input.city.trim() || !input.description.trim()) throw new Error('Заполните название, город и описание')
      const rentalMode = input.rentalMode || 'short_term'
      if (!['short_term','long_term'].includes(rentalMode) || !['apartment','hotel','hostel','house'].includes(input.type)) throw new Error('Проверьте тип аренды и жилья')
      const id = crypto.randomUUID()
      this.data.db.properties.push({ id, ownerId: 'host1', title: input.title.trim(), city: input.city.trim(), description: input.description.trim(), type: input.type, rentalMode, region: input.region || 'crimea', status: 'draft', location: { lat: 44.5, lon: 34.18 }, amenities: [], videoVerified: false, rating: 0, reviewCount: 0, images: [] })
      if (input.type === 'apartment') this.data.db.units.push({ id: crypto.randomUUID(), propertyId: id, label: 'Целиком', kind: 'entire', capacity: 2, baseNightly: rentalMode === 'long_term' ? 0 : 1000, ...(rentalMode === 'long_term' ? { baseMonthly: 35000 } : {}), cleaningFee: 0 })
      this.record(`Создан объект: ${input.title.trim()}`); this.save(); return id
    },
    saveUnit(unit) {
      const property = this.data.db.properties.find(x => x.id === unit.propertyId && x.ownerId === 'host1')
      if (!property || !unit.label.trim() || !Number.isInteger(Number(unit.capacity)) || Number(unit.capacity) < 1 || !(property.rentalMode === 'long_term' ? Number.isSafeInteger(Number(unit.baseMonthly)) && Number(unit.baseMonthly) > 0 : Number.isSafeInteger(Number(unit.baseNightly)) && Number(unit.baseNightly) > 0) || !Number.isInteger(Number(unit.cleaningFee)) || Number(unit.cleaningFee) < 0) throw new Error('Проверьте данные единицы размещения')
      const existing = this.data.db.units.find(x => x.id === unit.id)
      if (existing && existing.propertyId !== property.id) throw new Error('Единица принадлежит другому объекту')
      if (property.type === 'hostel' && Number(unit.capacity) !== 1) throw new Error('Одно койко-место рассчитано на одного гостя')
      if (this.data.db.bookings.some(booking => booking.unitId === unit.id && blockingStatuses.has(booking.status) && booking.guests > Number(unit.capacity))) throw new Error('Вместимость меньше числа гостей в действующей брони')
      if (!existing && property.type === 'apartment' && this.data.db.units.some(x => x.propertyId === property.id)) throw new Error('У квартиры может быть только одна единица')
      const value = { ...unit, capacity: Number(unit.capacity), baseNightly: property.rentalMode === 'long_term' ? 0 : Number(unit.baseNightly), ...(property.rentalMode === 'long_term' ? { baseMonthly: Number(unit.baseMonthly) } : {}), cleaningFee: Number(unit.cleaningFee) }
      if (property.rentalMode !== 'long_term') delete value.baseMonthly
      if (existing) Object.assign(existing, value); else this.data.db.units.push(value)
      this.record(`Сохранена единица размещения: ${value.label}`); this.save()
    },
  },
})
