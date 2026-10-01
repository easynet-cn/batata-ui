/**
 * Compute the next MCP version string, following Nacos' increment rules:
 * - `X.Y.Z` -> patch + 1 (`X.Y.(Z+1)`)
 * - `vN`    -> `v(N+1)`
 * - other   -> `${version}-next`
 *
 * Ported from nacos/console-ui-next.
 */
export function nextMcpVersion(version: string): string {
  const semVer = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (semVer) {
    return `${semVer[1]}.${semVer[2]}.${Number(semVer[3]) + 1}`
  }
  const numeric = /^v(\d+)$/.exec(version)
  if (numeric) {
    return `v${Number(numeric[1]) + 1}`
  }
  return version ? `${version}-next` : ''
}
