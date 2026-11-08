import { describe, expect, it } from 'vitest'
import { browseOrder, haversineKm } from '../../app/utils/browse-order'

const origin = { id: 'a', location: { lat: 44.5, lon: 34.2 } }
const near = { id: 'b', location: { lat: 44.51, lon: 34.21 } }
const far = { id: 'c', location: { lat: 45, lon: 35 } }
const twinNear = { id: 'd', location: { lat: 44.51, lon: 34.21 } }

describe('browseOrder', () => {
  it('puts the origin first and sorts the rest by distance', () => {
    const ordered = browseOrder([far, origin, near], 'a')
    expect(ordered.map(item => item.id)).toEqual(['a', 'b', 'c'])
    expect(haversineKm(origin.location, near.location)).toBeLessThan(haversineKm(origin.location, far.location))
  })

  it('breaks equal distances by id and returns a copy when origin is missing', () => {
    const ordered = browseOrder([twinNear, near, origin], 'a')
    expect(ordered.map(item => item.id)).toEqual(['a', 'b', 'd'])
    const input = [far, near]
    const missing = browseOrder(input, 'missing')
    expect(missing.map(item => item.id)).toEqual(['c', 'b'])
    expect(missing).not.toBe(input)
  })
})
