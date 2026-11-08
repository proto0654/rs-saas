import { describe, expect, it } from 'vitest'
import { mapViewport, unclusterZoom } from '../../app/utils/map-viewport'

const property = { location: { lat: 44.5, lon: 34.2 } }
describe('map camera with overlay panels', () => {
  it('reserves the desktop sidebar and the mobile bottom panel', () => {
    const centered = mapViewport([property], 1400, 900, [0, 0, 0, 0])
    const desktop = mapViewport([property], 1400, 900, [100, 24, 48, 500])
    const mobile = mapViewport([property], 390, 844, [80, 16, 360, 16])
    expect(centered.lon).toBeCloseTo(property.location.lon)
    expect(centered.lat).toBeCloseTo(property.location.lat)
    expect(desktop.lon).toBeLessThan(property.location.lon)
    expect(mobile.lat).toBeLessThan(property.location.lat)
  })
  it('zooms out to fit distant results and handles an empty search', () => {
    const broad = mapViewport([property, { location: { lat: 48.7, lon: 44.5 } }], 390, 844, [88, 16, 360, 16])
    expect(broad.zoom).toBeLessThan(8)
    const empty = mapViewport([], 390, 844, [88, 16, 360, 16])
    expect(Number.isFinite(empty.lon) && Number.isFinite(empty.lat)).toBe(true)
  })
  it('raises zoom until nearby mates leave the cluster grid', () => {
    const nearby = unclusterZoom(property.location, [{ lat: 44.5005, lon: 34.2005 }])
    const distant = unclusterZoom(property.location, [{ lat: 45, lon: 35 }])
    const twin = unclusterZoom(property.location, [property.location])
    expect(nearby).toBeGreaterThan(distant)
    expect(nearby).toBeGreaterThan(15)
    expect(distant).toBeLessThan(12)
    expect(twin).toBe(21)
  })
})
