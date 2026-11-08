type Loc = { lat: number; lon: number }
type BrowseItem = { id: string; location: Loc }

const EARTH_KM = 6371

/** Great-circle distance in kilometres between two WGS84 points. */
export function haversineKm(a: Loc, b: Loc) {
  const toRad = (deg: number) => deg * Math.PI / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const chord = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(chord)))
}

/**
 * Filtered listings ordered for map-card / stay prev-next browsing:
 * origin first, then ascending distance, stable `id` tie-break.
 */
export function browseOrder<T extends BrowseItem>(results: T[], originId: string): T[] {
  const origin = results.find(item => item.id === originId)
  if (!origin) return [...results]
  return [...results].sort((a, b) => {
    if (a.id === originId) return -1
    if (b.id === originId) return 1
    const delta = haversineKm(origin.location, a.location) - haversineKm(origin.location, b.location)
    return delta || a.id.localeCompare(b.id)
  })
}
