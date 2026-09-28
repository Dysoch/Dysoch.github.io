/**
 * The newest entry in src/content/changelog.json is the single source of the version number.
 * Runs before dev/build/test (npm pre-scripts) and copies it into package.json and package-lock.json,
 * so bumping the version only ever means adding a changelog entry. The in-game version (APP_VERSION)
 * reads the changelog directly.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const changelog = JSON.parse(fs.readFileSync(path.join(root, 'src/content/changelog.json'), 'utf8'))
const version = changelog[0]?.version
if (!version) throw new Error('changelog.json has no entries to take the version from')

function update(file, apply) {
  const full = path.join(root, file)
  if (!fs.existsSync(full)) return
  const raw = fs.readFileSync(full, 'utf8')
  const data = JSON.parse(raw)
  if (!apply(data)) return
  const eol = raw.includes('\r\n') ? '\r\n' : '\n'
  fs.writeFileSync(full, JSON.stringify(data, null, 2).replace(/\n/g, eol) + eol)
  console.log(`[sync-version] ${file} -> ${version}`)
}

update('package.json', (pkg) => {
  if (pkg.version === version) return false
  pkg.version = version
  return true
})
update('package-lock.json', (lock) => {
  if (lock.version === version && lock.packages?.['']?.version === version) return false
  lock.version = version
  if (lock.packages?.['']) lock.packages[''].version = version
  return true
})
