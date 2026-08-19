import type { AppData } from './schema'
import { SCHEMA_VERSION, emptyAppData, isReadableAppData, upgradeStoredProfile } from './schema'

const STORAGE_KEY = 'ee-crs-data'

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyAppData()
    const parsed: unknown = JSON.parse(raw)
    if (isReadableAppData(parsed)) {
      return {
        schemaVersion: SCHEMA_VERSION,
        profiles: parsed.profiles.map(upgradeStoredProfile),
      }
    }
    return emptyAppData()
  } catch {
    return emptyAppData()
  }
}

export function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
