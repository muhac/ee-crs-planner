import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { ShareEnvelope, StoredProfile } from './schema'
import { SCHEMA_VERSION, isShareEnvelope } from './schema'

export const SHARE_HASH_PREFIX = '#share='

export function makeEnvelope(profile: StoredProfile): ShareEnvelope {
  return { app: 'ee-crs', schemaVersion: SCHEMA_VERSION, profile }
}

export function encodeShare(profile: StoredProfile): string {
  return compressToEncodedURIComponent(JSON.stringify(makeEnvelope(profile)))
}

export function decodeShare(encoded: string): StoredProfile | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const parsed: unknown = JSON.parse(json)
    return isShareEnvelope(parsed) ? parsed.profile : null
  } catch {
    return null
  }
}

export function buildShareUrl(profile: StoredProfile): string {
  const base = `${location.origin}${location.pathname}`
  return `${base}${SHARE_HASH_PREFIX}${encodeShare(profile)}`
}

/** Extract a shared profile from a URL hash, if present and valid. */
export function parseShareHash(hash: string): StoredProfile | null {
  if (!hash.startsWith(SHARE_HASH_PREFIX)) return null
  return decodeShare(hash.slice(SHARE_HASH_PREFIX.length))
}
