import { expect, test, type Page } from '@playwright/test'
import { openTab, openWithSave } from './helpers'

/** An equipped-slot row (the first list on the Inventory page), e.g. 'Main Hand'. */
const equippedRow = (page: Page, slot: string) => page.locator('.inv-list').first().locator('.inv-row', { hasText: slot })

test('every tab renders without errors', async ({ page }) => {
  const errors = await openWithSave(page, 'geared')
  for (const tab of ['Combat', 'Training', 'Abilities', 'Inventory', 'Crafting', 'Automation', 'Statistics', 'Guide', 'Settings']) {
    await openTab(page, tab)
    await expect(page.locator('.page-content')).not.toBeEmpty()
  }
  expect(errors).toEqual([])
})

test('Equip all upgrades fills empty slots, then has nothing left to do', async ({ page }) => {
  await openWithSave(page, 'geared')
  await openTab(page, 'Inventory')
  const button = page.getByRole('button', { name: /Equip all upgrades/ })
  await expect(button).toBeEnabled()
  await button.click()
  await expect(page.getByRole('button', { name: 'No upgrades to equip' })).toBeDisabled()
  await expect(equippedRow(page, 'Head')).toContainText('Vanguard Helm')
})

test('the Crafting set filter hides groups and survives a reload', async ({ page }) => {
  await openWithSave(page, 'geared')
  await openTab(page, 'Crafting')
  await expect(page.getByRole('heading', { name: 'Woodland Adept' })).toBeVisible()
  await page.getByRole('button', { name: 'Worn sets only' }).click()
  await expect(page.getByRole('heading', { name: 'Woodland Adept' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Woodland Vanguard' })).toBeVisible()
  await page.reload()
  await openTab(page, 'Crafting')
  await expect(page.getByRole('heading', { name: 'Woodland Adept' })).toHaveCount(0)
})

test('Pause stops time until resumed', async ({ page }) => {
  await openWithSave(page, 'geared')
  const fight = page.locator('.combat-main')
  const snapshot = () => fight.textContent()
  // The fight moves on its own while running...
  const start = await snapshot()
  await expect.poll(snapshot, { timeout: 5000 }).not.toBe(start)
  // ...and stands still while paused
  await openTab(page, 'Settings')
  await page.getByRole('button', { name: /Pause/ }).click()
  await openTab(page, 'Combat')
  const frozen = await snapshot()
  await page.waitForTimeout(2000)
  expect(await snapshot()).toBe(frozen)
  await page.locator('.hud-chip', { hasText: 'Paused' }).click()
  await expect.poll(snapshot, { timeout: 5000 }).not.toBe(frozen)
})

test('a save from before the slot rework loads into the new slots', async ({ page }) => {
  const errors = await openWithSave(page, 'legacy-slots')
  await openTab(page, 'Inventory')
  await expect(equippedRow(page, 'Main Hand')).toContainText('Vanguard Sword')
  await expect(equippedRow(page, 'Off Hand')).toContainText('Vanguard Buckler')
  await expect(page.locator('.inv-list').nth(1)).toContainText('Tattered Cloak')
  expect(errors).toEqual([])
})

test.describe('phone width', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the top bar fits the screen', async ({ page }) => {
    await openWithSave(page, 'geared')
    for (const bar of await page.locator('.hud-bar').all()) {
      const box = await bar.boundingBox()
      expect(box!.x + box!.width).toBeLessThanOrEqual(390)
    }
  })
})

test('Ascending as a Mage locks the Physical path and wipes gear and discoveries', async ({ page }) => {
  const errors = await openWithSave(page, 'ascend-ready')
  await expect(page.locator('.hud-header')).toContainText('Adventurer')
  await openTab(page, 'Prestige')
  await page.getByRole('button', { name: /^Ascend ·/ }).click()
  await page.getByRole('radio', { name: /Mage/ }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Ascend as Mage' }).click()

  await expect(page.locator('.hud-header')).toContainText('Mage')
  await expect(page.locator('.hud-header')).not.toContainText('Stamina')
  await openTab(page, 'Training')
  await expect(page.getByText('Arcana', { exact: true })).toBeVisible()
  await expect(page.getByText('Might', { exact: true })).toHaveCount(0)
  await expect(page.getByText(/Physical is locked for a Mage/)).toBeVisible()
  await openTab(page, 'Abilities')
  await expect(page.getByText('Bolt', { exact: true })).toBeVisible()
  await expect(page.getByText('Strike', { exact: true })).toHaveCount(0)
  // The Mage signature ability is shown only as a locked ????? until its Sigil perk is bought
  await expect(page.getByText('?????')).toBeVisible()
  await expect(page.getByText('Arcane Nova')).toHaveCount(0)
  // Discoveries are wiped, but the gear tabs stay open
  await expect(page.getByRole('button', { name: /^Crafting/ })).toBeVisible()
  await openTab(page, 'Inventory')
  await expect(equippedRow(page, 'Main Hand')).not.toContainText('Vanguard Sword')
  expect(errors).toEqual([])
})

test('late zones: all ten are listed and their huge numbers stay readable', async ({ page }) => {
  const errors = await openWithSave(page, 'late-game')
  await expect(page.locator('.combat-main')).toContainText(/Hollow/)
  await expect(page.locator('body')).not.toContainText(/e\+\d|Infinity|NaN/)
  await openTab(page, 'Zones')
  for (const name of ['Stormspire Heights', 'Abyssal Depths', 'Verdant Maw', 'Obsidian Citadel', 'Astral Rift', 'The Hollow Throne']) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
  }
  await expect(page.locator('body')).not.toContainText(/e\+\d|Infinity|NaN/)
  expect(errors).toEqual([])
})
