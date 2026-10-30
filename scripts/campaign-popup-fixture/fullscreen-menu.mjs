import assert from 'node:assert/strict'
import { createAudioOptionsBudget } from '../browser-options-audio.mjs'

// This reuses only the reviewed per-await input budget, not any audio path.
// The isolated fixture supplies the Fullscreen API; activation still must flow
// through the shipped Query button, Home menu ownership and FullscreenControl.
export function popupFullscreenOwnership() {
  const state = window.homePopupFixture.read()
  return {
    ...state,
    popups: [...document.querySelectorAll('.campaign-messages details')]
      .map(node => ({ serial: node.getAttribute('data-message-serial'), open: node.open })),
    dialogs: [...document.querySelectorAll('dialog[open]')].map(node => node.getAttribute('aria-label')),
    focusOwner: document.activeElement?.closest('dialog[open]')?.getAttribute('aria-label') ?? null,
    fullscreen: window.fullscreenFixture.read(),
    controlOwners: [...document.querySelectorAll('[data-fullscreen-control]')]
      .map(node => node.parentElement?.matches('dialog[open]') ? node.parentElement.getAttribute('aria-label') : null),
  }
}

export function assertPopupMenuRetention(before, after, { menu, active }) {
  assert.equal(after.sameWorld, true, 'The fixture scene retains its original world')
  assert.deepEqual(after.world, { ...before.world, paused: menu ? true : before.world.paused },
    'Menu owns only its temporary pause; Continue restores the exact prior world')
  assert.deepEqual(after.popups, before.popups, 'Menu transitions cannot replace, close or acknowledge the retained popup')
  assert.equal(after.acknowledgments, before.acknowledgments)
  assert.deepEqual(after.calls, before.calls, 'Fullscreen/menu actions cannot leak into gameplay')
  assert.deepEqual(after.keys, before.keys)
  assert.equal(after.cheatsOpen, before.cheatsOpen)
  assert.equal(after.menu, menu)
  assert.equal(after.modalSuspended, menu)
  assert.deepEqual(after.dialogs, menu ? ['Game menu'] : [])
  assert.deepEqual(after.controlOwners, menu ? ['Game menu'] : [])
  assert.equal(after.focusOwner, menu ? 'Game menu' : null)
  assert.equal(after.fullscreen.active, active)
  assert.equal(after.fullscreen.requests, before.fullscreen.requests + Number(active))
  assert.equal(after.fullscreen.exits, before.fullscreen.exits)
}

export async function activatePopupFullscreenFromMenu(page, {
  timeout = 10000, deadlineAt, signal, now = Date.now, trace = {},
} = {}) {
  const budget = createAudioOptionsBudget({ timeout, signal, now,
    deadlineAt: Math.min(deadlineAt ?? Infinity, now() + timeout) })
  const read = name => budget.step(async () => {
    // Retain actual observations even if their completion crosses the deadline.
    trace[name] = await page.evaluate(popupFullscreenOwnership)
    return trace[name]
  })
  const before = await read('before')
  assert.equal(before.sameWorld, true)
  assert.equal(typeof before.world.paused, 'boolean')
  assert.ok(before.popups.some(popup => popup.open), 'The prepared popup must still own gameplay input')
  assert.equal(before.fullscreen.active, false)
  assertPopupMenuRetention(before, before, { menu: false, active: false })
  const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
  await budget.step(timeout => page.getByRole('button', { name: 'Menu', exact: true }).click({ timeout }))
  await budget.step(timeout => menu.waitFor({ state: 'visible', timeout }))
  const activate = menu.getByRole('button', { name: 'Fullscreen', exact: true })
  await budget.step(timeout => activate.waitFor({ state: 'visible', timeout }))
  assertPopupMenuRetention(before, await read('menuOpened'), { menu: true, active: false })
  await budget.step(timeout => activate.click({ timeout }))
  await budget.step(timeout => menu.locator('button[aria-label="Exit fullscreen"][aria-disabled="false"]')
    .waitFor({ state: 'visible', timeout }))
  assertPopupMenuRetention(before, await read('activeInMenu'), { menu: true, active: true })
  await budget.step(timeout => menu.getByRole('button', { name: 'Continue Game', exact: true }).click({ timeout }))
  await budget.step(timeout => menu.waitFor({ state: 'hidden', timeout }))
  await budget.step(timeout => page.locator('[data-fullscreen-control]').waitFor({ state: 'detached', timeout }))
  assertPopupMenuRetention(before, await read('afterContinue'), { menu: false, active: true })
  budget.check()
  return trace
}
