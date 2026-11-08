type Location = { location: { lat: number; lon: number } }

const TILE = 256
const EMPTY_CENTER = { lat: 45, lon: 39 }

function project({ lat, lon }: Location['location']): [number, number] {
  const sine = Math.sin(Math.max(-85, Math.min(85, lat)) * Math.PI / 180)
  return [(lon + 180) / 360, .5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)]
}

/** Geographic envelope of listings, or `null` when the set is empty. */
export function mapBounds(properties: Location[]) {
  if (!properties.length) return null
  const lats = properties.map(item => item.location.lat)
  const lons = properties.map(item => item.location.lon)
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
  }
}

/** API 3.0 `location` that frames every listing (pair with map `margin`). */
export function mapLocation(properties: Location[]) {
  const bounds = mapBounds(properties)
  if (!bounds) return { center: [EMPTY_CENTER.lon, EMPTY_CENTER.lat] as [number, number], zoom: 5 }
  const { minLat, maxLat, minLon, maxLon } = bounds
  if (minLon === maxLon && minLat === maxLat) return { center: [minLon, minLat] as [number, number], zoom: 11 }
  return { bounds: [[minLon, minLat], [maxLon, maxLat]] as [[number, number], [number, number]] }
}

// Web Mercator camera for the keyless widget / API 2.1, including space covered by UI.
export function mapViewport(properties: Location[], width: number, height: number, padding: number[]) {
  const points = (properties.length ? properties : [{ location: EMPTY_CENTER }]).map(item => project(item.location))
  const xs = points.map(point => point[0]), ys = points.map(point => point[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const [top = 0, right = 0, bottom = 0, left = 0] = padding
  const availableWidth = Math.max(80, width - left - right)
  const availableHeight = Math.max(80, height - top - bottom)
  const horizontalScale = availableWidth / (TILE * Math.max(maxX - minX, .00001))
  const verticalScale = availableHeight / (TILE * Math.max(maxY - minY, .00001))
  const zoom = Math.max(2, Math.min(11, Math.floor(Math.log2(Math.min(horizontalScale, verticalScale)))))
  const worldSize = TILE * 2 ** zoom
  const x = (minX + maxX) / 2 - (left - right) / (2 * worldSize)
  const y = (minY + maxY) / 2 - (top - bottom) / (2 * worldSize)
  return { lon: x * 360 - 180, lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180 / Math.PI, zoom }
}

/** Zoom where `target` is past the cluster grid from every mate (cell-alignment buffer included). */
export function unclusterZoom(target: Location['location'], mates: Location['location'][], gridSize = 128, maxZoom = 21) {
  const [tx, ty] = project(target)
  let needed = 0
  for (const mate of mates) {
    const [mx, my] = project(mate)
    const dist = Math.hypot(mx - tx, my - ty)
    if (dist < 1e-12) {
      needed = maxZoom
      continue
    }
    // pixels ≈ dist * 256 * 2^z; require > 2 * gridSize so neighbors leave one grid cell.
    needed = Math.max(needed, Math.log2((gridSize * 2) / (TILE * dist)))
  }
  return Math.min(maxZoom, Math.max(0, Math.ceil(needed)))
}
