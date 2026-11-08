import type { Database, DemoState, SearchFilters } from '../types/demo'
import { day, nights } from './booking'
import { demoSchemaVersion } from './migrations'

type Row = Record<string, unknown>
const record = (v: unknown): v is Row => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === 'string')
const amount = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0
const positive = (v: unknown): v is number => amount(v) && v > 0
const date = (v: unknown) => { try { return typeof v === 'string' && Number.isFinite(day(v)) } catch { return false } }
const range = (a: unknown, b: unknown) => { try { return typeof a === 'string' && typeof b === 'string' && nights(a,b) > 0 } catch { return false } }
const oneOf = (value: unknown, options: string[]) => typeof value === 'string' && options.includes(value)
const rows = (value: unknown, check: (v: Row) => boolean): value is Row[] => Array.isArray(value) && value.every(v => record(v) && text(v.id) && check(v)) && new Set(value.map(v => v.id)).size === value.length

export function validFilters(value: unknown): value is SearchFilters {
  if (!record(value) || !range(value.checkIn,value.checkOut) || !positive(value.guests)) return false
  if (value.rentalMode === 'long_term' && nights(String(value.checkIn),String(value.checkOut)) < 30) return false
  return (value.region == null || oneOf(value.region,['crimea','krasnodar','south'])) && (value.rentalMode == null || oneOf(value.rentalMode,['short_term','long_term'])) && (value.maxPrice == null || amount(value.maxPrice)) && (value.city == null || typeof value.city === 'string') && (value.amenities == null || strings(value.amenities)) && (value.type == null || oneOf(value.type,['','apartment','hotel','hostel','house'])) && (value.videoVerified == null || typeof value.videoVerified === 'boolean')
}
export function validDatabase(value: unknown): value is Database {
  if (!record(value) || value.schemaVersion !== demoSchemaVersion || !date(value.demoToday) || value.timezone !== 'Europe/Moscow' || !validFilters(value.defaultSearch)) return false
  if (!rows(value.users,v => text(v.name) && oneOf(v.role,['host','guest']))) return false
  const hosts = new Set(value.users.filter(v => v.role === 'host').map(v => v.id))
  const guests = new Set(value.users.filter(v => v.role === 'guest').map(v => v.id))
  if (!rows(value.properties,v => hosts.has(v.ownerId) && text(v.title) && text(v.city) && text(v.description) && (v.region == null || oneOf(v.region,['crimea','krasnodar','south'])) && (v.rentalMode == null || oneOf(v.rentalMode,['short_term','long_term'])) && oneOf(v.type,['apartment','hotel','hostel','house']) && oneOf(v.status,['draft','published']) && strings(v.amenities) && strings(v.images) && typeof v.videoVerified === 'boolean' && typeof v.rating === 'number' && Number.isFinite(v.rating) && amount(v.reviewCount) && record(v.location) && typeof v.location.lat === 'number' && Math.abs(v.location.lat) <= 90 && typeof v.location.lon === 'number' && Math.abs(v.location.lon) <= 180)) return false
  const properties = new Map(value.properties.map(v => [v.id,v]))
  if (!rows(value.units,v => properties.has(v.propertyId) && text(v.label) && oneOf(v.kind,['entire','room','bed']) && positive(v.capacity) && (v.baseMonthly == null ? positive(v.baseNightly) : v.baseNightly === 0 && positive(v.baseMonthly)) && amount(v.cleaningFee) && (v.image == null || text(v.image)))) return false
  if (value.units.some(unit => (properties.get(unit.propertyId)?.rentalMode === 'long_term') !== (unit.baseMonthly != null))) return false
  const units = new Map(value.units.map(v => [v.id,v]))
  if (!rows(value.bookings,v => units.has(v.unitId) && guests.has(v.guestId) && positive(v.guests) && range(v.checkIn,v.checkOut) && oneOf(v.status,['pending_host','confirmed','paid','checked_in','completed','cancelled']) && amount(v.nightlySnapshot) && (v.monthlySnapshot == null || positive(v.monthlySnapshot)) && amount(v.cleaningSnapshot) && amount(v.total))) return false
  return rows(value.blocks,v => units.has(v.unitId) && range(v.start,v.end) && text(v.reason))
}
export function validDemoState(value: unknown): value is DemoState {
  if (!record(value) || !validDatabase(value.db) || !strings(value.favorites) || !validFilters(value.filters) || !oneOf(value.role,['guest','host'])) return false
  const ids = new Set(value.db.properties.map(p => p.id))
  if (!value.favorites.every(id => ids.has(id))) return false
  if (value.personalBot != null && (!record(value.personalBot) || !text(value.personalBot.name) || !text(value.personalBot.token) || !value.personalBot.token.startsWith('demo_') || typeof value.personalBot.active !== 'boolean')) return false
  return value.audit == null || rows(value.audit,v => text(v.message) && typeof v.at === 'string' && Number.isFinite(Date.parse(v.at)))
}
