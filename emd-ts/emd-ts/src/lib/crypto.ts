// SHA-256 hashing helpers built on the browser's native Web Crypto API.
// Used for record integrity hashing and blockchain block hashing.

export async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function shortHash(hash: string, len = 16): string {
  if (!hash) return '';
  return `${hash.slice(0, len)}...`;
}

export function canonicalize(obj: Record<string, unknown>): string {
  // Deterministic JSON stringify (sorted keys) so hashes are reproducible.
  const sortedKeys = Object.keys(obj).sort();
  const sorted: Record<string, unknown> = {};
  for (const k of sortedKeys) sorted[k] = obj[k];
  return JSON.stringify(sorted);
}

export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const time = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${time}${rand}`;
}
