import type { AppData } from './schema'
import { SCHEMA_VERSION, emptyAppData } from './schema'

const STORAGE_KEY = 'ee-crs-data'

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyAppData()
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as AppData).schemaVersion === SCHEMA_VERSION &&
      Array.isArray((parsed as AppData).profiles)
    ) {
      return parsed as AppData
    }
    return emptyAppData()
  } catch {
    return emptyAppData()
  }
}

export function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
