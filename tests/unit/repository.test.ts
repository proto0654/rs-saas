import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDemoStore } from '../../app/stores/demo.js'
import seed from '../../demo/seed.json'

let storage: Map<string, string>
beforeEach(() => {
  storage = new Map()
  vi.stubGlobal('localStorage', { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) })
  setActivePinia(createPinia())
})
describe('demo repository', () => {
  it('restores changes without touching other storage and resets the namespace', () => {
    storage.set('other', 'keep')
    const store = useDemoStore(); store.restore(); store.toggleFavorite('p2')
    setActivePinia(createPinia()); const restored = useDemoStore(); restored.restore()
    expect(restored.data.favorites).toEqual([...seed.favorites, 'p2']); restored.reset()
    expect(restored.data.favorites).toEqual(seed.favorites); expect(storage.get('other')).toBe('keep')
  })
  it('prevents conflicting bookings and releases dates on cancellation', () => {
    const store = useDemoStore(); store.restore()
    const input = { id: 'new', unitId: 'p1-whole', guestId: 'guest1', guests: 2, checkIn: '2027-06-12', checkOut: '2027-06-16' }
    store.book(input)
    expect(() => store.book({ ...input, id: 'duplicate' })).toThrow('Unavailable')
    store.transition('new', 'cancelled', 'guest')
    expect(() => store.book({ ...input, id: 'after-cancel' })).not.toThrow()
  })
  it('enforces booking transitions and ownership', () => {
    const store = useDemoStore(); store.restore()
    store.book({ id: 'new', unitId: 'p1-whole', guestId: 'guest1', guests: 2, checkIn: '2027-06-12', checkOut: '2027-06-16' })
    expect(() => store.transition('new', 'paid', 'guest')).toThrow()
    store.transition('new', 'confirmed', 'host'); store.transition('new', 'paid', 'guest')
    expect(store.data.db.bookings.find(b => b.id === 'new').status).toBe('paid')
    expect(() => store.transition('b8', 'cancelled', 'host')).toThrow()
  })
  it('rejects blocking a booking or repair', () => {
    const store = useDemoStore(); store.restore()
    expect(() => store.block('p2-101', '2027-06-12', '2027-06-13')).toThrow()
    expect(() => store.block('p2-202', '2027-06-12', '2027-06-13')).toThrow()
    expect(() => store.block('p2-102', '2027-06-12', '2027-06-13')).not.toThrow()
    expect(() => store.block('p2-102', '2027-06-12', '2027-06-13')).toThrow()
  })
  it('lets the owner add a direct booking and rejects conflicting dates', () => {
    const store = useDemoStore(); store.restore()
    const input = { unitId: 'p2-102', checkIn: '2027-06-12', checkOut: '2027-06-16', guests: 2 }
    store.addManualBooking(input)
    expect(store.data.db.bookings.at(-1)).toMatchObject({ status: 'confirmed', source: 'manual', total: 15200 })
    expect(() => store.addManualBooking(input)).toThrow()
    expect(() => store.addManualBooking({ ...input, unitId: 'p7-whole' })).toThrow()
  })
  it('keeps personal bot simulation and audit history across reload', () => {
    const store = useDemoStore(); store.restore(); store.createBot(); const token = store.data.personalBot.token; store.toggleBot()
    setActivePinia(createPinia()); const restored = useDemoStore(); restored.restore()
    expect(restored.data.personalBot).toMatchObject({ token, active: false }); expect(restored.data.audit).toHaveLength(2)
  })
})
