import seed from '../../demo/seed.json'

export const demoSchemaVersion = seed.schemaVersion
export const demoCatalogVersion = 2
const premiumIds = new Set(['p61', 'p62', 'p63'])
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

function changeVersion(value: unknown, from: number, to: number): unknown {
  if (!record(value) || !record(value.db) || value.db.schemaVersion !== from) return value
  const result = structuredClone(value)
  const database = result.db as Record<string, unknown>
  database.schemaVersion = to
  return result
}

export function upgradeDemoState(value: unknown): unknown {
  let upgraded = changeVersion(value, 1, demoSchemaVersion)
  if (!record(upgraded) || !record(upgraded.db) || upgraded.db.schemaVersion !== demoSchemaVersion) return upgraded
  if (isLegacyDefaultSearch(upgraded.db.defaultSearch)) {
    const result = structuredClone(upgraded)
    const database = result.db as Record<string, unknown>
    if (isLegacyDefaultSearch(result.filters)) result.filters = structuredClone(seed.defaultSearch)
    database.defaultSearch = structuredClone(seed.defaultSearch)
    upgraded = result
  }
  return updateExamplePhotos(addPremiumExamples(upgraded))
}

function addPremiumExamples(value: unknown): unknown {
  if (!record(value) || !record(value.db) || value.catalogVersion != null) return value
  const db = value.db
  if (!Array.isArray(db.properties) || !Array.isArray(db.units) || !Array.isArray(db.users)) return value
  if (!db.users.some(user => record(user) && user.id === 'host2' && user.role === 'host')) return value
  const propertyIds = new Set(db.properties.filter(record).map(property => property.id))
  const unitIds = new Set(db.units.filter(record).map(unit => unit.id))
  const additions = seed.properties.filter(property => premiumIds.has(property.id) && !propertyIds.has(property.id))
    .filter(property => seed.units.filter(unit => unit.propertyId === property.id).every(unit => !unitIds.has(unit.id)))
  const result = structuredClone(value)
  const resultDb = result.db as { properties: unknown[]; units: unknown[] }
  resultDb.properties.push(...structuredClone(additions))
  const addedIds = new Set(additions.map(property => property.id))
  resultDb.units.push(...structuredClone(seed.units.filter(unit => addedIds.has(unit.propertyId))))
  result.catalogVersion = 1
  return result
}

function previousExampleImage(id: string): string | null {
  const n = Number(id.slice(1))
  if (!/^p\d+$/.test(id)) return null
  if (n >= 6 && n <= 8) return `/demo/photo-p${n}.png`
  if (n === 9 || n === 21) return '/demo/ordinary-apartment-1.png'
  if (n >= 10 && n <= 44) return '/demo/ordinary-apartment-2.png'
  if (n >= 45 && n <= 52) return '/demo/photo-p4.png'
  if (n >= 53 && n <= 60) return '/demo/photo-p2.png'
  return null
}

function updateExamplePhotos(value: unknown): unknown {
  if (!record(value) || !record(value.db) || value.catalogVersion !== 1 || !Array.isArray(value.db.properties)) return value
  const examples = new Map(seed.properties.map(property => [property.id, property]))
  const result = structuredClone(value)
  const db = result.db as { properties: unknown[] }
  for (const property of db.properties) {
    if (!record(property) || typeof property.id !== 'string') continue
    const example = examples.get(property.id)
    const previousImage = previousExampleImage(property.id)
    if (!example || !previousImage || property.ownerId !== example.ownerId || property.type !== example.type || property.city !== example.city) continue
    if (!Array.isArray(property.images) || property.images.length !== 1 || property.images[0] !== previousImage) continue
    property.images = structuredClone(example.images)
  }
  result.catalogVersion = demoCatalogVersion
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
