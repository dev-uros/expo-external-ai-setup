/**
 * Whether `installed` is older than `minimum`. Versions are dot-separated numbers (`1.10.0`), compared
 * part by part, so 1.10 is newer than 1.9; a missing part counts as 0 (`1.2` = `1.2.0`).
 *
 * Anything that is not such a version — on either side — answers `false`: a typo in the server's
 * settings must not lock every user out of the app.
 */
export function isOlderThan(installed: string | null, minimum: string | null): boolean {
  const have = parse(installed);
  const need = parse(minimum);
  if (!have || !need) return false;

  for (let i = 0; i < Math.max(have.length, need.length); i++) {
    const a = have[i] ?? 0;
    const b = need[i] ?? 0;
    if (a !== b) return a < b;
  }
  return false;
}

function parse(version: string | null): number[] | null {
  if (!version || !/^\d+(\.\d+)*$/.test(version.trim())) return null;
  return version.trim().split('.').map(Number);
}
