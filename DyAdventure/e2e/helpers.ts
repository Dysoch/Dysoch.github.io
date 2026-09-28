import fs from 'node:fs'
import path from 'node:path'
import { expect, type Page } from '@playwright/test'

/** Loads the app with a generated save (see make-fixtures.ts) and collects page errors. */
export async function openWithSave(page: Page, fixture: string): Promise<string[]> {
  const save = fs.readFileSync(path.join(import.meta.dirname, '.fixtures', `${fixture}.json`), 'utf8')
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  // Seed once per tab, so a reload keeps whatever the game saved since
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem('e2e-seeded')) {
      localStorage.setItem('DyAdventure', s)
      sessionStorage.setItem('e2e-seeded', '1')
    }
  }, save)
  await page.goto('')
  await expect(page.locator('.hud-header')).toBeVisible()
  return errors
}

export async function openTab(page: Page, name: string) {
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).first().click()
}
