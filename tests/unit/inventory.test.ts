import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDemoStore } from '../../app/stores/demo.js'

beforeEach(() => {
  const values = new Map()
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) })
  setActivePinia(createPinia())
})
describe('owner inventory', () => {
  it('creates monthly inventory and preserves its booking rate across price edits and reload', () => {
    const store=useDemoStore();store.restore()
    const id=store.addProperty({title:'Квартира на месяц',city:'Краснодар',region:'krasnodar',type:'apartment',rentalMode:'long_term',description:'Демонстрационный объект'})
    const property=store.data!.db.properties.find(p=>p.id===id)!
    const unit=store.data!.db.units.find(u=>u.propertyId===id)!
    store.saveProperty({...property,status:'published'})
    store.book({id:'monthly-local',unitId:unit.id,guestId:'guest1',guests:2,checkIn:'2027-06-12',checkOut:'2027-07-12'})
    store.saveUnit({...unit,baseMonthly:40000})
    setActivePinia(createPinia());const restored=useDemoStore();restored.restore()
    expect(restored.restoreWarning).toBe(false)
    expect(restored.data!.db.bookings.find(b=>b.id==='monthly-local')).toMatchObject({monthlySnapshot:35000,nightlySnapshot:0,total:35000})
    expect(restored.data!.db.units.find(u=>u.id===unit.id)!.baseMonthly).toBe(40000)
  })
  it('keeps historical booking snapshots valid when capacity and future prices change', () => {
    const store = useDemoStore(); store.restore()
    store.book({ id: 'history', unitId: 'p1-whole', guestId: 'guest1', guests: 4, checkIn: '2027-06-12', checkOut: '2027-06-16' })
    store.transition('history', 'confirmed', 'host')
    store.transition('history', 'paid', 'guest')
    store.transition('history', 'checked_in', 'host')
    store.transition('history', 'completed', 'host')
    const unit = store.data!.db.units.find(u => u.id === 'p1-whole')!
    store.saveUnit({ ...unit, capacity: 2, baseNightly: 5000 })
    setActivePinia(createPinia())
    const restored = useDemoStore(); restored.restore()
    expect(restored.restoreWarning).toBe(false)
    expect(restored.data!.db.bookings.find(b => b.id === 'history')).toMatchObject({ status: 'completed', guests: 4, nightlySnapshot: 4200, total: 16800 })
    expect(restored.data!.db.units.find(u => u.id === 'p1-whole')).toMatchObject({ capacity: 2, baseNightly: 5000 })
  })
  it('protects active guest capacity and treats a hostel bed as a single place', () => {
    const store = useDemoStore(); store.restore()
    store.book({ id: 'active', unitId: 'p1-whole', guestId: 'guest1', guests: 3, checkIn: '2027-06-12', checkOut: '2027-06-16' })
    const unit = store.data!.db.units.find(u => u.id === 'p1-whole')!
    expect(() => store.saveUnit({ ...unit, capacity: 2 })).toThrow('действующей брони')
    const id = store.addProperty({ title: 'Хостел', city: 'Ялта', description: 'Описание', type: 'hostel' })
    const bed = { id: 'new-bed', propertyId: id, label: 'Место 1', kind: 'bed', capacity: 2, baseNightly: 1000, cleaningFee: 0 }
    expect(() => store.saveUnit(bed)).toThrow('одного гостя')
    expect(() => store.saveUnit({ ...bed, capacity: 1 })).not.toThrow()
  })
  it('creates a draft apartment with a single unit and validates publication', () => {
    const store = useDemoStore(); store.restore()
    expect(() => store.addProperty({ title: '', city: 'Ялта', description: 'Описание', type: 'apartment' })).toThrow()
    const id = store.addProperty({ title: 'Новый объект', city: 'Ялта', description: 'Описание', type: 'apartment' })
    const property = store.data.db.properties.find(p => p.id === id)
    expect(property.status).toBe('draft')
    expect(store.data.db.units.filter(u => u.propertyId === id)).toHaveLength(1)
    store.saveProperty({ ...property, status: 'published' })
    expect(property.status).toBe('published')
    expect(() => store.saveUnit({ id: 'extra', propertyId: id, label: 'Extra', capacity: 1, baseNightly: 1000, cleaningFee: 0 })).toThrow()
  })
  it('requires a real unit before publishing a hotel', () => {
    const store = useDemoStore(); store.restore()
    const id = store.addProperty({ title: 'Отель', city: 'Ялта', description: 'Описание', type: 'hotel' })
    const property = store.data.db.properties.find(p => p.id === id)
    expect(() => store.saveProperty({ ...property, status: 'published' })).toThrow()
    store.saveUnit({ id: 'room', propertyId: id, label: '101', kind: 'room', capacity: 2, baseNightly: 2000, cleaningFee: 0 })
    expect(() => store.saveProperty({ ...property, status: 'published' })).not.toThrow()
  })
})
