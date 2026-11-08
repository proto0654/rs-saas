import { describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import seed from '../../demo/seed.json'
import { useDemoStore } from '../../app/stores/demo.js'

describe('legacy state storage backup', () => {
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
