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
  return changeVersion(value, 1, demoSchemaVersion)
}

export function rollbackDemoState(value: unknown): unknown {
  if (record(value) && record(value.db) && Array.isArray(value.db.units) && value.db.units.some(unit => record(unit) && unit.baseMonthly != null)) throw new Error('Restore the v1 backup to roll back monthly rental data')
  return changeVersion(value, demoSchemaVersion, 1)
}
