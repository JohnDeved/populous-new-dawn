import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import fixture from '../tests/fixtures/person-panel.json' with { type: 'json' }

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const cdp = await page.context().newCDPSession(page)
  const views = []
  for (const [width, height, deviceScaleFactor] of [[1440,1000,1],[3440,1440,1],[1920,1080,2]]) {
    await page.setViewportSize({ width, height })
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor, mobile: false })
    const id = await page.evaluate(async () => {
      const s = window.testScene, w = s.world, m = await import('/app/model.ts')
      w.speed = 0; w.paused = false; w.selected = []; w.units = []; w.buildings = []; w.shrines = []; w.trees = []
      w.terrain.fill(3); w.terrainVersion++; w.manaWorld.gameFlags = 32
      s.personPanels.dispose()
      const u = m.addUnit(w, 'blue', 'brave', { x: 0, z: 8 })
      u.hp /= 2
      s.focus(u); s.onChange()
      return u.id
    })
    await page.waitForFunction(id => !!window.testScene.unitMeshes.get(id)?.userData.bounds, id)
    const p = await page.evaluate(id => {
      const s = window.testScene, r = s.container.getBoundingClientRect(), p = s.unitScreen(id), b = s.unitMeshes.get(id).userData.bounds
      return { x: r.left + (p.x + 1) * r.width / 2 + (b.left + b.right) / 2, y: r.top + (1 - p.y) * r.height / 2 + (b.top + b.bottom) / 2 }
    }, id)
    for (const modifier of ['Shift', 'Control', 'Alt']) {
      await page.keyboard.down(modifier)
      await page.mouse.click(p.x, p.y, { button: 'right' })
      await page.keyboard.up(modifier)
      assert.equal(await page.evaluate(() => window.testScene.personPanels.panels.size), 0, modifier)
    }
    await page.mouse.click(p.x, p.y, { button: 'right' })
    const panel = page.locator('.person-panel:not([hidden])')
    await panel.waitFor({ state: 'visible' })
    assert.match(await panel.getAttribute('aria-label'), /brave: 500 of 1000 health; 0 orders/)
    assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [])
    assert.ok(await page.evaluate(() => !window.testScene.world.units[0].native), 'inspection must not allocate a movement owner')
    const geometry = await panel.evaluate(c => {
      const r = c.getBoundingClientRect()
      return { native: [c.firstElementChild.width, c.firstElementChild.height], actual: [r.width, r.height], left: r.left, top: r.top }
    })
    assert.ok(Math.abs(geometry.actual[0] / geometry.native[0] - geometry.actual[1] / geometry.native[1]) < 0.001)
    assert.ok(geometry.left >= 0 && geometry.top >= 0)
    await page.mouse.click(p.x, p.y)
    assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [id])
    await page.mouse.click(p.x, p.y, { button: 'right' })
    assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [], 'selected-group right-click must still deselect')
    await page.evaluate(async id => {
      const s = window.testScene, m = await import('/app/model.ts')
      m.setSelection(s.world, [id]); m.command(s.world, { x: 20, z: 8 }); m.cancelInteraction(s.world)
    }, id)
    await page.mouse.click(p.x, p.y, { button: 'right' })
    await page.waitForFunction(() => document.querySelector('.person-panel')?.getAttribute('aria-label')?.endsWith('1 orders'))
    if (width === 1440) await page.screenshot({path:'/private/tmp/populous-person-panel.png'})
    const painting = await panel.locator('canvas').evaluate(async c => {
      const ctx = c.getContext('2d'), draw = ctx.drawImage
      let paints = 0
      ctx.drawImage = function(...a) { paints++; return draw.apply(this, a) }
      const atlas = new Image(); atlas.src = '/original/hud.png'; await atlas.decode()
      for (let i = 0; i < 10; i++) window.testScene.personPanels.update(atlas)
      const cached = paints
      for (let i = 0; i < 10; i++) {
        for (const p of window.testScene.personPanels.panels.values()) p.key = ''
        window.testScene.personPanels.update(atlas)
      }
      ctx.drawImage = draw
      return {cached, uncached: paints-cached}
    })
    assert.deepEqual(painting, {cached:0, uncached:30})
    const orders = await page.evaluate(async id => {
      const s = window.testScene, w = s.world, m = await import('/app/model.ts'), u = w.units.find(u => u.id === id), p = u.native
      const origin = m.nativePosition(w, u)
      w.buildingOrders.records.splice(0, 10, ...Array.from({length:10}, (_, i) => ({model:3,flags:0,references:1,object:0,a:(origin.x+i*256)&65535,b:origin.y&65535})))
      p.commands = [1,2,3,4,5,6,7,8]; p.commandCursor = 3; p.immediateCommand = 0
      s.personPanels.open(id,true)
      window.orderFocusCalls = []
      const focus = s.focus.bind(s)
      s.focus = (...args) => { window.orderFocusCalls.push(args); return focus(...args) }
      return {expected:m.browserPosition(w.buildingOrders.records[4] && {x:w.buildingOrders.records[4].a,y:w.buildingOrders.records[4].b}), queue:JSON.stringify([p.commands,p.commandCursor,p.immediateCommand,w.buildingOrders.records,w.selected])}
    }, id)
    const button = panel.locator('button:not([hidden])').first()
    await page.waitForFunction(() => document.querySelector('.person-panel button:not([hidden])')?.dataset.order === '4')
    await button.hover()
    await page.waitForTimeout(1300)
    assert.equal(await panel.count(), 1, 'hover holds the panel past its ordinary lifetime')
    await button.click()
    assert.equal(await page.evaluate(() => window.orderFocusCalls.length), 0, 'native pointer-left does not focus or issue an order')
    await button.click({button:'right'})
    assert.deepEqual(await page.evaluate(() => window.orderFocusCalls.at(-1)[0]), orders.expected)
    assert.equal(await page.evaluate(() => window.testScene.pointerButtons), 0, 'panel right-click must not latch world camera input')
    await page.evaluate(id => {
      const s=window.testScene;s.focus(s.world.units.find(u=>u.id===id));s.personPanels.open(id,true);window.orderFocusCalls=[]
    }, id)
    await button.focus()
    await page.mouse.move(width-50,40)
    await page.waitForTimeout(1300)
    assert.equal(await panel.count(), 1, 'keyboard focus holds the panel')
    await page.keyboard.press('Enter')
    assert.deepEqual(await page.evaluate(() => window.orderFocusCalls.at(-1)[0]), orders.expected)
    assert.equal(await page.evaluate(() => window.testScene.world.paused), false)
    assert.equal(await page.evaluate(id => {
      const w=window.testScene.world,p=w.units.find(u=>u.id===id).native
      return JSON.stringify([p.commands,p.commandCursor,p.immediateCommand,w.buildingOrders.records,w.selected])
    }, id), orders.queue, 'inspection preserves the exact live queue and selection')
    const objectPoint = await page.evaluate(async id => {
      const s=window.testScene,w=s.world,u=w.units.find(u=>u.id===id),p=u.native
      w.buildingOrders.records[9] = {model:14,flags:0,references:1,object:0,a:id,b:0}
      p.immediateCommand=9;s.focus(u);s.personPanels.open(id,true);window.orderFocusCalls=[]
      return {x:u.x,z:u.z}
    },id)
    await page.waitForFunction(() => document.querySelector('.person-panel button:not([hidden])')?.dataset.order === '9')
    await button.click({button:'right'})
    assert.deepEqual(await page.evaluate(() => window.orderFocusCalls.at(-1)[0]),objectPoint,'immediate object order focuses the real person')
    assert.equal(await page.evaluate(id=>window.testScene.personPanels.panels.get(id).phase,id),1,'owned target inspection opens immediately')
    await page.evaluate(id => {
      const s=window.testScene,w=s.world,p=w.units.find(u=>u.id===id).native
      window.orderFocusCalls=[];w.inputMask=1;s.personPanels.focusOrder(id,9);w.inputMask=0
      s.overviewActive=true;s.personPanels.focusOrder(id,9);s.overviewActive=false
      p.immediateCommand=0;p.commands.fill(0);s.personPanels.focusOrder(id,4)
    },id)
    assert.equal(await page.evaluate(() => window.orderFocusCalls.length),0,'stale button cannot focus an order no longer owned by the person')
    await page.waitForFunction(() => !document.querySelector('.person-panel button:not([hidden])'))
    await page.evaluate(id => {
      const s=window.testScene;s.focus(s.world.units.find(u=>u.id===id));s.personPanels.open(id,true)
      document.activeElement?.blur()
    },id)
    await page.evaluate(() => { window.testScene.world.paused = true })
    await page.mouse.move(width - 50, 40)
    await page.waitForTimeout(1200)
    assert.equal(await panel.count(), 1, 'paused presentation retains panel lifetime')
    await page.evaluate(() => { window.testScene.world.paused = false })
    await page.waitForFunction(() => !document.querySelector('.person-panel'))
    views.push({ width, height, deviceScaleFactor, geometry, painting })
  }
  const frames = await page.evaluate(async cases => {
    const { personPanel } = await import('/app/person-panel.ts'), { paintPanel } = await import('/app/training-panel.ts')
    const atlas = new Image(); atlas.src = '/original/hud.png'; await atlas.decode()
    return cases.map(state => {
      const c = document.createElement('canvas'); paintPanel(c, atlas, personPanel(state.health, state.maximum, state.icons))
      return { state, png: c.toDataURL().split(',')[1] }
    })
  }, fixture.panels)
  writeFileSync('/private/tmp/populous-person-panel-pixels.json', JSON.stringify(frames))
  assert.deepEqual(errors, [])
  writeFileSync('/private/tmp/populous-person-panel-browser.json', JSON.stringify({ views, pixelStates: frames.length }, null, 2))
  const { page: original, errors: originalErrors } = await openGame(browser)
  const shaman = await original.evaluate(async () => {
    const s = window.testScene, { cancelInteraction } = await import('/app/model.ts')
    s.world.speed = 0; cancelInteraction(s.world)
    const u = s.world.units.find(u => u.kind === 'shaman' && u.team === 'blue')
    s.focus(u); s.onChange(); return u.id
  })
  await original.waitForFunction(id => !!window.testScene.unitMeshes.get(id)?.userData.bounds, shaman)
  const location = await original.evaluate(id => {
    const s = window.testScene, r = s.container.getBoundingClientRect(), p = s.unitScreen(id), b = s.unitMeshes.get(id).userData.bounds
    return { x: r.left + (p.x + 1) * r.width / 2 + (b.left + b.right) / 2, y: r.top + (1 - p.y) * r.height / 2 + (b.top + b.bottom) / 2 }
  }, shaman)
  await original.mouse.click(location.x, location.y, { button: 'right' })
  await original.locator('.person-panel:not([hidden])').waitFor({state:'visible'})
  await original.screenshot({path:'/private/tmp/populous-person-panel-first-level.png'})
  assert.deepEqual(originalErrors, [])
  console.log('PASS: native person-panel right-click inspection, group deselection, actual movement order, displayed-order right-click/keyboard focus, exact queue preservation, stale/modal guards, health, pause/expiry and desktop/ultrawide/2x DPI')
} finally { await browser.close() }
