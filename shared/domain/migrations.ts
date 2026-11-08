import seed from '../../demo/seed.json'

export const demoSchemaVersion = seed.schemaVersion
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

function changeVersion(value: unknown, from: number, to: number): unknown {
  if (!record(value) || !record(value.db) || value.db.schemaVersion !== from) return value
  const result = structuredClone(value)
  const database = result.db as Record<string, unknown>
  database.schemaVersion = to
  return result
}

export function upgradeDemoState(value: unknown): unknown {
  const upgraded = changeVersion(value, 1, demoSchemaVersion)
  if (!record(upgraded) || !record(upgraded.db) || !isLegacyDefaultSearch(upgraded.db.defaultSearch)) return upgraded
  const result = structuredClone(upgraded)
  const database = result.db as Record<string, unknown>
  if (isLegacyDefaultSearch(result.filters)) result.filters = structuredClone(seed.defaultSearch)
  database.defaultSearch = structuredClone(seed.defaultSearch)
  return result
}

function isLegacyDefaultSearch(value: unknown): boolean {
  if (!record(value)) return false
  const allowedKeys = ['checkIn', 'checkOut', 'guests', 'maxPrice', 'city', 'amenities', 'rentalMode', 'region', 'type', 'videoVerified']
  return Object.keys(value).every(key => allowedKeys.includes(key))
    && value.checkIn === '2027-06-12' && value.checkOut === '2027-06-16'
    && value.guests === 2 && value.maxPrice === 6000 && value.city === null
    && (value.rentalMode == null || value.rentalMode === 'short_term')
    && (value.region == null || value.region === '') && (value.type == null || value.type === '')
    && (value.videoVerified == null || value.videoVerified === false)
    && Array.isArray(value.amenities) && value.amenities.length === 1 && value.amenities[0] === 'sea_view'
}

export function rollbackDemoState(value: unknown): unknown {
  if (record(value) && record(value.db) && Array.isArray(value.db.units) && value.db.units.some(unit => record(unit) && unit.baseMonthly != null)) throw new Error('Restore the v1 backup to roll back monthly rental data')
  return changeVersion(value, demoSchemaVersion, 1)
}
