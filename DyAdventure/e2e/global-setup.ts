import { execSync } from 'node:child_process'

/** Builds the test saves from the real game logic (via tsx, which handles the content JSON imports). */
export default function globalSetup() {
  execSync('npx tsx e2e/make-fixtures.ts', { stdio: 'inherit' })
}
