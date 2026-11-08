import { describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import seed from '../../demo/seed.json'
import { useDemoStore } from '../../app/stores/demo.js'

describe('legacy state storage backup', () => {
  it.each([false, true])('removes only the historical search preset (customized: %s)', customized => {
    const db = structuredClone(seed)
    const legacy = { ...seed.defaultSearch, maxPrice: 6000, amenities: ['sea_view'] }
    db.defaultSearch = legacy as typeof seed.defaultSearch
    const filters = customized ? { ...legacy, city: 'Ялта', maxPrice: 8000 } : { ...legacy, region: null, type: '', videoVerified: false }
    const raw = JSON.stringify({ db, favorites: ['p2'], filters, role: 'guest', personalBot: null, audit: [] })
    const values = new Map([['rs-saas-demo', raw], ['other-app', 'keep']])
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) })
    try {
      setActivePinia(createPinia()); const store = useDemoStore(); store.restore()
      expect(store.restoreWarning).toBe(false)
      expect(store.data!.filters).toEqual(customized ? filters : seed.defaultSearch)
      expect(store.data!.db.defaultSearch).toEqual(seed.defaultSearch)
      expect(store.data!.db.bookings).toEqual(db.bookings)
      expect(values.get('rs-saas-demo')).toBe(raw)
      expect(values.get('rs-saas-demo:defaults-backup')).toBe(raw)
      store.toggleFavorite('p1')
      expect(values.get('rs-saas-demo:defaults-backup')).toBe(raw)
      store.restore()
      expect(store.data!.filters).toEqual(customized ? filters : seed.defaultSearch)
      store.reset()
      expect(values.has('rs-saas-demo:defaults-backup')).toBe(false)
      expect(values.get('other-app')).toBe('keep')
    } finally { vi.unstubAllGlobals() }
  })
  it('adds premium examples once without overwriting edits or conflicting IDs', () => {
    const db = structuredClone(seed)
    db.properties = db.properties.filter(p => !['p61','p62','p63'].includes(p.id))
    db.units = db.units.filter(u => !['p61','p62','p63'].includes(u.propertyId))
    db.properties[0]!.title = 'Edited listing'
    db.units[0]!.id = 'p62-1'
    for (const booking of db.bookings) if (booking.unitId === 'p1-whole') booking.unitId = 'p62-1'
    const raw = JSON.stringify({ db, favorites: ['p2'], filters: seed.defaultSearch, role: 'guest', personalBot: null, audit: [] })
    const values = new Map([['rs-saas-demo', raw]])
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) })
    try {
      setActivePinia(createPinia()); const store = useDemoStore(); store.restore()
      expect(store.restoreWarning).toBe(false)
      expect(store.data!.db.properties[0]!.title).toBe('Edited listing')
      expect(store.data!.db.properties.filter(p => p.premium).map(p => p.id)).toEqual(['p61','p63'])
      expect(store.data!.db.bookings).toEqual(db.bookings)
      expect(values.get('rs-saas-demo:catalog-backup')).toBe(raw)
      expect(values.get('rs-saas-demo')).toBe(raw)
      store.toggleFavorite('p1')
      store.restore()
      expect(store.data!.db.properties.filter(p => p.premium)).toHaveLength(2)
      store.data!.db.properties = store.data!.db.properties.filter(p => p.id !== 'p61')
      store.data!.db.units = store.data!.db.units.filter(u => u.propertyId !== 'p61')
      store.toggleFavorite('p1'); store.restore()
      expect(store.data!.db.properties.some(p => p.id === 'p61')).toBe(false)
      expect(values.get('rs-saas-demo:catalog-backup')).toBe(raw)
      store.reset()
      expect(values.has('rs-saas-demo:catalog-backup')).toBe(false)
    } finally { vi.unstubAllGlobals() }
  })
  it('backs up v1 before a later save and clears only project keys on reset', () => {
    const db={...structuredClone(seed),schemaVersion:1,properties:seed.properties.slice(0,8),units:seed.units.slice(0,20),bookings:seed.bookings.slice(0,9)}
    const raw=JSON.stringify({db,favorites:['p2'],filters:seed.defaultSearch,role:'guest',personalBot:null,audit:[]})
    const values=new Map([['rs-saas-demo',raw],['other-app','keep']])
    vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)})
    setActivePinia(createPinia());const store=useDemoStore();store.restore()
    expect(store.restoreWarning).toBe(false)
    expect(values.get('rs-saas-demo')).toBe(raw)
    expect(values.get('rs-saas-demo:v1-backup')).toBe(raw)
    store.toggleFavorite('p1')
    expect(JSON.parse(values.get('rs-saas-demo')!).db.schemaVersion).toBe(2)
    expect(values.get('rs-saas-demo:v1-backup')).toBe(raw)
    store.reset()
    expect(values.has('rs-saas-demo')).toBe(false)
    expect(values.has('rs-saas-demo:v1-backup')).toBe(false)
    expect(values.get('other-app')).toBe('keep')
    vi.unstubAllGlobals()
  })
})
