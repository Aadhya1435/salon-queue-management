// After a new deploy, a page that was already open still knows the OLD screen
// file names (e.g. StaffHub-he8AVsW7.js), and those files no longer exist.
// Reloading once picks up the new version. A session flag stops reload loops.

const KEY = 'roselle:update-reload'

/** Reloads the page once per session to load the newest version. Returns false if it already tried. */
export function reloadForNewVersion(): boolean {
  try {
    if (sessionStorage.getItem(KEY)) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

/** Call once a screen loaded fine, so a later deploy can reload again. */
export function clearUpdateReloadFlag() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

/** True for "this screen's file is gone" errors, in Chrome, Safari and Firefox wording. */
export function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(message)
}
