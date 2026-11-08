import { describe, expect, it } from 'vitest'
import seed from '../../demo/seed.json'
import { validDatabase, validDemoState } from '../../shared/domain/validation'
import { createPinia, setActivePinia } from 'pinia'
import { useDemoStore } from '../../app/stores/demo.js'
import { vi } from 'vitest'

describe('saved demo validation', () => {
  it('accepts the seed and rejects broken references, invalid dates and duplicate IDs', () => {
    expect(validDatabase(seed)).toBe(true)
    const orphan = structuredClone(seed); orphan.units[0].propertyId = 'missing'
    expect(validDatabase(orphan)).toBe(false)
    const invalidDate = structuredClone(seed); invalidDate.bookings[0].checkOut = '2027-02-30'
    expect(validDatabase(invalidDate)).toBe(false)
    const duplicate = structuredClone(seed); duplicate.units.push(duplicate.units[0])
    expect(validDatabase(duplicate)).toBe(false)
    const invalidImage = structuredClone(seed); (invalidImage.units[0] as { image?: unknown }).image = 123
    expect(validDatabase(invalidImage)).toBe(false)
  })
  it('restores a safe seed when persisted data is malformed without overwriting it', () => {
    const saved = { db: seed, favorites: [], filters: { ...seed.defaultSearch, guests: 0 }, role: 'guest' }
    expect(validDemoState(saved)).toBe(false)
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(saved), setItem })
    setActivePinia(createPinia())
    const store = useDemoStore(); store.restore()
    expect(store.ready).toBe(true)
    expect(store.restoreWarning).toBe(true)
    expect(store.data.filters.guests).toBe(2)
    expect(setItem).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
