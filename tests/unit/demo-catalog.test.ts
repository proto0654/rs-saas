import { describe, expect, it } from 'vitest'
import seed from '../../demo/seed.json'
import type { Database, Unit } from '../../shared/types/demo'
import { search, available, quote, createBooking, overlaps, blockingStatuses } from '../../shared/domain/booking'
import { validDatabase, validDemoState } from '../../shared/domain/validation'
import { upgradeDemoState, rollbackDemoState } from '../../shared/domain/migrations'

const db = seed as Database
describe('presentation catalog', () => {
  it('covers the regions, property types and all guest booking states without changing the reference search', () => {
    expect(validDatabase(db)).toBe(true)
    expect(db.properties).toHaveLength(60)
    expect(db.units).toHaveLength(112)
    expect(db.defaultSearch.maxPrice).toBeNull()
    expect(db.defaultSearch.amenities).toEqual([])
    expect(search(db,db.defaultSearch).length).toBeGreaterThan(20)
    expect(new Set(db.properties.map(p => p.city)).size).toBe(27)
    expect(new Set(db.properties.map(p => p.region))).toEqual(new Set(['crimea','krasnodar','south']))
    expect(new Set(db.bookings.filter(b => b.guestId === 'guest1').map(b => b.status))).toEqual(new Set(['pending_host','confirmed','paid','checked_in','completed','cancelled']))
    expect(search(db,{...db.defaultSearch,maxPrice:6000,amenities:['sea_view']}).map(p => p.id)).toEqual(['p1'])
    expect(available(db,'p2-102','2027-06-12','2027-06-16')).toBe(true)
    expect(search(db,{checkIn:'2027-06-12',checkOut:'2027-06-16',guests:1,type:'hostel'}).length).toBeGreaterThan(5)
    expect(search(db,{checkIn:'2027-06-12',checkOut:'2027-06-16',guests:2,region:'krasnodar'}).every(p => p.region === 'krasnodar')).toBe(true)
    expect(search(db,{checkIn:'2027-06-12',checkOut:'2027-06-16',guests:2,city:'Краснодар'}).some(p=>p.type==='apartment')).toBe(true)
    expect(search(db,{checkIn:'2027-06-12',checkOut:'2027-07-12',guests:2,city:'Краснодар',rentalMode:'long_term'}).length).toBeGreaterThan(0)
  })
  it('contains no overlapping blocking bookings or bookings over maintenance', () => {
    for (const unit of db.units) {
      const bookings=db.bookings.filter(b => b.unitId===unit.id && blockingStatuses.has(b.status)).sort((a,b)=>a.checkIn.localeCompare(b.checkIn))
      for(let i=1;i<bookings.length;i++) expect(overlaps(bookings[i-1]!.checkIn,bookings[i-1]!.checkOut,bookings[i]!.checkIn,bookings[i]!.checkOut)).toBe(false)
      for(const booking of bookings) for(const block of db.blocks.filter(b=>b.unitId===unit.id)) expect(overlaps(booking.checkIn,booking.checkOut,block.start,block.end)).toBe(false)
    }
  })
})

describe('monthly rental pricing', () => {
  const unit: Unit={id:'monthly',propertyId:'monthly-property',label:'Квартира',kind:'entire',capacity:2,baseNightly:0,baseMonthly:32000,cleaningFee:500}
  it('requires 30 nights and prorates by 30-day months before rounding to rubles', () => {
    expect(()=>quote(unit,'2027-06-12','2027-07-11')).toThrow('Minimum 30 nights')
    expect(quote(unit,'2027-06-12','2027-07-12')).toMatchObject({nights:30,monthly:32000,total:32500})
    expect(quote(unit,'2027-06-12','2027-07-13').total).toBe(33567)
    expect(quote(unit,'2027-06-12','2027-08-11').total).toBe(64500)
  })
  it('searches by monthly budget and preserves a monthly snapshot on booking', () => {
    const filters={checkIn:'2027-06-12',checkOut:'2027-07-12',guests:2,rentalMode:'long_term' as const,maxPrice:40000}
    const results=search(db,filters)
    expect(results.length).toBeGreaterThan(5)
    expect(results.every(p=>p.rentalMode==='long_term' && p.priceFrom<=40000)).toBe(true)
    const id=results[0]!.availableUnitIds[0]!
    const next=createBooking(db,{id:'monthly-booking',unitId:id,guestId:'guest1',guests:2,checkIn:filters.checkIn,checkOut:filters.checkOut})
    expect(next.bookings.at(-1)!.monthlySnapshot).toBe(db.units.find(u=>u.id===id)!.baseMonthly)
    expect(next.bookings.at(-1)!.total).toBe(results[0]!.priceFrom)
    expect(()=>search(db,{...filters,checkOut:'2027-06-16'})).toThrow('Minimum 30 nights')
  })
})

describe('demo v1 upgrade', () => {
  it('preserves saved edits, favorites and bookings and supports rollback', () => {
    const previous={db:{...structuredClone(seed),schemaVersion:1},favorites:['p2'],filters:seed.defaultSearch,role:'guest',personalBot:null,audit:[]}
    previous.db.properties[0]!.title='Моё название'
    previous.db.properties=previous.db.properties.slice(0,8)
    previous.db.units=previous.db.units.slice(0,20)
    previous.db.bookings=previous.db.bookings.slice(0,9)
    const upgraded=upgradeDemoState(previous)
    expect(validDemoState(upgraded)).toBe(true)
    expect(previous.db.schemaVersion).toBe(1)
    expect(rollbackDemoState(upgraded)).toEqual(previous)
    expect(()=>rollbackDemoState({db:seed})).toThrow('v1 backup')
  })
})
