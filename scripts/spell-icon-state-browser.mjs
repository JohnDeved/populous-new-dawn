import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { readSpellHudSprite, sha256 } from './spell-hud-checker-contract.mjs'
import { assertSpellIconInventory, spellIconStateNames, spellIconPartition } from './spell-icon-state-evidence.mjs'
import { assertOriginalSpellIconPixels, readOriginalSpellIconPixels } from './spell-icon-pixel-evidence.mjs'
import fixture from '../tests/fixtures/spell-icon-states.json' with { type: 'json' }
import originalPixelFixture from '../tests/fixtures/spell-icon-pixels.json' with { type: 'json' }
import hud from '../app/original-hud.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import { SPELLS } from '../app/world-rules.ts'

export const spellIconLimits = [
  'Injected presentation matrix through the shipped Home; no campaign acquisition or native execution proof.',
  'Rendered sprites match independent canvas crops; all 61 served crop RGBA hashes match the canonical-original decoded fixture.',
  'Disabled cases preserve existing alternate-mode flag-32 policy, whose complete native behavior remains unresolved.',
  'Mode-2 charging uses synthetic permission bit 256; normal campaign mode-2 charging is not claimed.',
  'Authored Mission 1 and 16 discovery are checked separately; no hardware performance claim.',
]

// Shared by local CLI and the existing hosted Tutorial runner. The caller owns
// browser/source receipts and context cleanup, including failed startup.
export async function runSpellIconMatrix({ browser, observedBrowser, open, url, output, report, save, episode = 'full' }) {
  assert.deepEqual(fixture.states.map(s => s.name), spellIconStateNames)
  const partition = spellIconPartition(episode)
  report.episode = episode
  report.expectedStateNames = partition.states
  report.authoredMissions = partition.missions
  report.browser = browser.version()
  const first = await open(observedBrowser, partition.missions[0] ?? 16)
  let page = first.page
  page.setDefaultTimeout(15000)
  await page.evaluate(() => {
    const s = window.testScene
    s.world.speed = 0
    cancelAnimationFrame(s.frame)
  })
  report.renderer = await page.evaluate(() => {
    const gl = window.testScene.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
  })
  report.viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio }))
  const served = await page.request.get(new URL('/original/hud.png', url).href)
  assert.equal(served.status(), 200)
  report.atlasSHA256 = sha256(await served.body())
  assert.equal(report.atlasSHA256, sha256(readFileSync(new URL('../public/original/hud.png', import.meta.url))))
  report.originalPixels = await page.evaluate(readOriginalSpellIconPixels, originalPixelFixture.frames.map(frame => ({ ...frame, rect: hud.rects[frame.id] })))
  assertOriginalSpellIconPixels(report.originalPixels, originalPixelFixture)
  save()

  async function capture(card, icon, state, spell, frame) {
    const rect = hud.rects[icon], geometry = await card.evaluate(readSpellHudSprite, { id: icon, rect })
    assert.equal(geometry.text, '')
    assert.ok(geometry.image.endsWith('/original/hud.png")'))
    assert.ok(geometry.border.endsWith(`/hud-${frame}.png")`), geometry.border)
    assert.equal(geometry.logicalWidth, rect.w)
    assert.equal(geometry.logicalHeight, rect.h)
    const scale = geometry.buttonBox.width / 31
    const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.02, `${actual} != ${expected}`)
    near(geometry.buttonBox.height, 43 * scale)
    near(geometry.box.x - geometry.buttonBox.x, (15 - Math.trunc(rect.w / 2)) * scale)
    near(geometry.box.y - geometry.buttonBox.y, (21 - Math.trunc(rect.h / 2)) * scale)
    near(geometry.box.width, rect.w * scale)
    near(geometry.box.height, rect.h * scale)
    const sprite = card.locator('.hud-sprite').last(), name = `${spell}-${state}`
    const actual = await sprite.screenshot({ path: join(output, `spell-icon-${name}.png`) })
    // Replace only the observed icon, at the same location/background/scale.
    // The reference draws the retained descriptor's crop without CSS atlas positioning.
    await sprite.evaluate(async (element, rect) => {
      const image = new Image()
      image.src = '/original/hud.png'
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = rect.w; canvas.height = rect.h
      canvas.style.cssText = `display:inline-block;vertical-align:top;image-rendering:pixelated;width:${rect.w}px;height:${rect.h}px`
      canvas.dataset.spellReference = ''
      canvas.getContext('2d').drawImage(image, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h)
      window.spellIconElement = element
      element.replaceWith(canvas)
    }, rect)
    let expected
    try { expected = await card.locator('[data-spell-reference]').screenshot() }
    finally { await page.evaluate(() => document.querySelector('[data-spell-reference]').replaceWith(window.spellIconElement)) }
    writeFileSync(join(output, `spell-icon-${name}-reference.png`), expected)
    assert.deepEqual(actual, expected, `Rendered atlas crop ${name}`)
    report.states.push({ spell, state, ...geometry, scale, screenshotSHA256: sha256(actual), referenceSHA256: sha256(expected) })
    save()
  }

  // Authored discovery uses actual mission-load ownership/reward masks.
  for (const mission of partition.missions) {
    if (mission === 16) {
      await page.context().close()
      const later = await open(observedBrowser, mission)
      page = later.page
      page.setDefaultTimeout(15000)
    }
    await page.mouse.move(500, 900)
    await page.evaluate(() => {
      const s = window.testScene
      s.world.speed = 0
      cancelAnimationFrame(s.frame)
    })
    const questions = page.getByRole('button', { name: 'Undiscovered spell', exact: true })
    assert.equal(await questions.count(), 2, `Mission ${mission} authored undiscovered controls`)
    for (let i = 0; i < 2; i++) {
      const card = questions.nth(i)
      assert.equal(await card.getAttribute('aria-disabled'), 'true')
      await card.hover({ force: true })
      await card.click({ force: true })
      await page.mouse.move(500, 900)
      assert.equal(await page.evaluate(() => window.testStore.getWorld().mode), null)
      assert.equal(await card.locator('.hud-sprite').count(), 1)
      assert.equal(await card.locator('.native-charge').count(), 0)
      await capture(card, 1056, `undiscovered-m${mission}-${i}`, 'authored', 'button')
    }
  }

  for (const spell of SPELLS) for (const state of fixture.states.filter(state => partition.states.includes(state.name))) {
    await page.mouse.move(500, 900)
    await page.evaluate(() => document.activeElement?.blur())
    await page.evaluate(({ spell, state, progress }) => {
      window.testStore.change(w => {
        const player = w.manaWorld.playerTribe, tribe = w.manaTribes[player]
        tribe.spellOwner = player
        w.manaWorld.gameFlags = state.disabled ? 32 : 256
        w.manaWorld.spells[player].available = state.permanent ? 1 << spell.model : 0
        w.manaWorld.spells[player].disabled = state.charging ? 0 : 1 << (spell.model - 1)
        w.shots[spell.id] = state.stock
        w.giftCounts[spell.id] = state.gifts ?? 0
        tribe.spellProgress[spell.model] = progress
        w.mode = null
      })
    }, { spell, state, progress: Math.floor(rules.spellCharging[spell.model].cost / 2) })
    const card = page.getByRole('button', { name: `${spell.name}, ${state.stock} shots`, exact: true })
    await card.waitFor({ state: 'visible' })
    if (state.selected) { await card.click(); await page.mouse.move(500, 900) }
    if (state.hovered) await card.hover()
    assert.equal(await card.getAttribute('aria-disabled'), String(!!state.disabled))
    assert.equal(await card.getAttribute('aria-pressed'), String(!!state.selected))
    if (state.disabled) {
      await card.click({ force: true })
      await page.mouse.move(500, 900)
      assert.equal(await page.evaluate(() => window.testStore.getWorld().mode), null)
    }
    const charging = !!state.charging && rules.spellCharging[spell.model].mode !== 2
    assert.equal(await card.locator('.native-charge').count(), Number(charging))
    if (charging) assert.equal(await card.locator('.native-charge > i').last().evaluate(el => parseFloat(el.style.width)), 12)
    assert.equal(await card.locator('.hud-sprite').count(), rules.spellCharging[spell.model].normalLimit + 1)
    await capture(card, fixture.icons[spell.model][state.icon], state.name, spell.id, state.frame)
  }
  assertSpellIconInventory(report.states, SPELLS, episode)
}
