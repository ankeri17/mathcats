// ────────────────────────────────────────────────────────────────────────────
// Entitlement stub. App boot gates on this so a real license check can slot in
// later without touching game logic. For Phase 0–1 it always returns true.
// ────────────────────────────────────────────────────────────────────────────

export function checkEntitlement(): boolean {
  return true;
}
