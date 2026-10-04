import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { bindGame } from './browser-game.mjs'
import hud from '../app/original-hud.json' with { type: 'json' }
import tasks from '../app/original-follower-tasks.json' with { type: 'json' }

const columns = ['Followers', 'Braves', 'Warriors', 'Firewarriors', 'Preachers', 'Spies']
const rows = ['Currently selected', 'Idle', 'Housed', 'Busy']
const button = (page, row, column) => page.getByRole('button', { name: `${rows[row]} ${columns[column]}`, exact: true })
const selection = page => page.evaluate(() => [...window.testSceneRef.current.world.selected])
const freeze = page => page.evaluate(() => {
  window.testStore.change(world => { world.speed = 0 })
  cancelAnimationFrame(window.testSceneRef.current.frame)
  window.testScene = window.testSceneRef.current
})
const snapshot = page => page.locator('.follower-tasks button').evaluateAll(buttons => buttons.map(button => ({
  label: button.getAttribute('aria-label'), disabled: button.disabled,
  count: Number(button.querySelector('.follower-number').getAttribute('aria-label')),
})))

// Pixel check is against original source atlas/frame pixels at the regular logical
// grid. It does not claim legacy fixed-point rounding or full Windows painter order.
async function checkPixels(page, output, row, column, pressed = false) {
  const control = button(page, row, column), name = `task-${row}-${column}-${pressed ? 'pressed' : 'normal'}`
  if (pressed) await control.hover()
  else await page.mouse.move(900, 400)
  const bytes = await control.screenshot({ path: resolve(output, `${name}.png`) })
  const state = await control.evaluate(button => ({ disabled: button.disabled,
    glyphs: [...button.querySelectorAll('.follower-number .hud-sprite')].map(n => n.style.backgroundPosition),
    glyphX: parseInt(button.querySelector('.follower-number').style.left, 10) }))
  const result = await page.evaluate(async ({ bytes, row, column, pressed, state, hud, tasks }) => {
    const load = async source => createImageBitmap(source instanceof Blob ? source : await (await fetch(source)).blob())
    const [actual, panel, frame, atlas, font] = await Promise.all([
      load(new Blob([new Uint8Array(bytes)], { type: 'image/png' })), load('/original/follower-task-panel.png'),
      load(`/original/follower-task-${pressed ? 'pressed' : 'normal'}.png`), load('/original/follower-tasks.png'), load('/original/hud.png'),
    ])
    const reference = document.createElement('canvas'); reference.width = 15; reference.height = 34
    const ctx = reference.getContext('2d'); ctx.imageSmoothingEnabled = false
    ctx.drawImage(panel, column * 16, 6 + row * 41, 15, 34, 0, 0, 15, 34)
    ctx.globalAlpha = state.disabled ? 85 / 255 : 1; ctx.drawImage(frame, 0, 0); ctx.globalAlpha = 1
    const id = column === 0 ? 639 + row * 2 + Number(pressed) : 1084 + row,
      icon = tasks.rects[id]
    ctx.drawImage(atlas, icon.x, icon.y, icon.w, icon.h, 7 - Math.trunc(icon.w / 2), 17 - Math.trunc((icon.h + 8) / 2), icon.w, icon.h)
    let left = state.glyphX
    for (const position of state.glyphs) {
      const [x,y] = position.match(/-?\d+/g).map(Number).map(Math.abs)
      const rect = Object.entries(hud.rects).find(([id,r]) => id.startsWith('f00t') && r.x === x && r.y === y)?.[1]
      if (!rect) throw Error(`Unknown glyph ${position}`)
      ctx.drawImage(font, rect.x, rect.y, rect.w, rect.h, left, 24, rect.w, rect.h); left += rect.w
    }
    const canvas = document.createElement('canvas'); canvas.width = actual.width; canvas.height = actual.height
    const out = canvas.getContext('2d'); out.imageSmoothingEnabled = false
    out.drawImage(actual,0,0); const got = out.getImageData(0,0,actual.width,actual.height).data
    out.clearRect(0,0,actual.width,actual.height); out.drawImage(reference,0,0,actual.width,actual.height)
    const expected = out.getImageData(0,0,actual.width,actual.height).data
    let mismatches = 0, maxError = 0
    for (let i=0;i<got.length;i++) { const error = Math.abs(got[i]-expected[i]); maxError=Math.max(maxError,error); if(error>1)mismatches++ }
    for (const image of [actual,panel,frame,atlas,font]) image.close()
    return { width: canvas.width, height: canvas.height, mismatches, maxError }
  }, { bytes: [...bytes], row, column, pressed, state, hud, tasks })
  assert.equal(result.mismatches, 0, `${name}: ${JSON.stringify(result)}`)
  return { name, ...result }
}

// Run with the reviewed sandboxed local-render harness. Mission1 is the real
// opening/UI path; later injected classes are explicitly supporting fixtures.
export default async function followerTasks({ page, output, openMission, receipt }) {
  await openMission(1)
  await freeze(page)
  await page.getByTitle('followers', { exact: true }).click()
  await page.mouse.move(900, 400)
  await page.locator('.native-hud').screenshot({ path: resolve(output, 'followers-mission1.png') })
  const state = await page.evaluate(() => {
    const scene = window.testSceneRef.current, gl = scene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    return { turn: scene.world.turn, renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) }
  })
  assert.equal(await page.locator('.follower-tasks button').count(), 24)
  const opening = await snapshot(page)
  assert.deepEqual(opening.map(c => c.label), rows.flatMap(row => columns.map(column => `${row} ${column}`)))
  assert.equal(await page.locator('.tribe-classes button').count(), 6, 'persistent strip stays separate')
  assert.ok(opening[7].count > 0, 'ordinary Mission1 reaches native resting before capture')
  assert.equal(opening[8].disabled, true)
  assert.equal(await button(page, 1, 2).locator('.follower-task-icon').count(), 1)
  assert.equal(await button(page, 1, 2).locator('.follower-number .hud-sprite').count(), 0)
  const pixels = []
  for (const row of [0,1,2,3]) for (const column of [0,1,2]) pixels.push(await checkPixels(page, output, row, column))
  pixels.push(await checkPixels(page, output, 1, 0, true))
  pixels.push(await checkPixels(page, output, 1, 1, true))

  // Actual native-backed idle followers selected by shipped controls.
  await button(page, 1, 1).click()
  assert.equal((await selection(page)).length, 1)
  await button(page, 1, 1).click({ modifiers: ['Control'] })
  assert.equal((await selection(page)).length, Math.min(6, opening[7].count))
  const selected = await selection(page)
  await button(page, 0, 1).click({ modifiers: ['Control'] })
  assert.deepEqual(await selection(page), selected, 'Selected Ctrl does not deselect five')
  await button(page, 0, 1).click()
  assert.equal((await selection(page)).length, selected.length - 1)
  await button(page, 0, 1).click({ modifiers: ['Shift'] })
  assert.deepEqual(await selection(page), [])
  await button(page, 1, 1).click({ modifiers: ['Shift','Control'] })
  assert.equal((await selection(page)).length, opening[7].count, 'Shift wins over Ctrl')
  await button(page, 0, 1).click({ modifiers: ['Shift'] })

  // Focus memory is separate by task and from the persistent class strip.
  await button(page, 1, 1).click({ button: 'right' })
  const firstFocus = await page.evaluate(() => window.testSceneRef.current.hudTaskFocus[14])
  await button(page, 1, 1).click({ button: 'right' })
  const nextFocus = await page.evaluate(() => window.testSceneRef.current.hudTaskFocus[14])
  assert.ok(firstFocus && nextFocus && firstFocus !== nextFocus)
  assert.equal(await page.evaluate(id => window.testSceneRef.current.objectPanels.panels.has(id), nextFocus), true)
  await page.getByRole('button', { name: 'Select brave', exact: true }).click({ button: 'right' })
  assert.equal(await page.evaluate(() => window.testSceneRef.current.hudTaskFocus[14]), nextFocus)
  for (const tab of ['spells','buildings','followers','spells','followers']) await page.getByTitle(tab, { exact: true }).click()
  assert.equal(await page.locator('.follower-tasks button').count(), 24)
  assert.equal(await page.evaluate(() => window.testSceneRef.current.hudTaskFocus[14]), nextFocus)

  // A newer targeting mode survives focus, then task selection cancels it.
  await page.getByTitle('spells', { exact: true }).click()
  await page.getByRole('button', { name: /^Blast,/ }).click()
  assert.equal(await page.evaluate(() => window.testSceneRef.current.world.mode), 'blast')
  await page.getByTitle('followers', { exact: true }).click()
  await button(page, 1, 1).click({ button: 'right' })
  assert.equal(await page.evaluate(() => window.testSceneRef.current.world.mode), 'blast')
  await button(page, 1, 1).click()
  assert.equal(await page.evaluate(() => window.testSceneRef.current.world.mode), null)
  await button(page, 0, 1).click({ modifiers: ['Shift'] })

  // Disrupted Ctrl release cannot select through a replaced tab or cancelled press.
  const target = await button(page, 1, 1).boundingBox()
  await page.keyboard.down('Control'); await page.mouse.move(target.x+target.width/2,target.y+target.height/2); await page.mouse.down()
  await page.getByTitle('spells', { exact: true }).evaluate(button => button.click())
  await page.mouse.up(); await page.keyboard.up('Control')
  assert.deepEqual(await selection(page), [])
  assert.equal(await page.getByTitle('spells', { exact: true }).getAttribute('aria-pressed'), 'true')
  await page.getByTitle('followers', { exact: true }).click()
  await page.keyboard.down('Control'); await button(page, 1, 1).hover(); await page.mouse.down()
  await button(page, 1, 1).dispatchEvent('pointercancel')
  await page.mouse.up(); await page.keyboard.up('Control')
  assert.deepEqual(await selection(page), [])

  // G is an ordinary shipped command whose task classification is native-grounded.
  await button(page, 1, 1).click({ modifiers: ['Shift'] })
  await page.keyboard.press('g')
  assert.equal((await snapshot(page))[19].count, opening[7].count)
  const guarded = await snapshot(page), savedSelection = await selection(page)
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(() => window.testStore.hasCheckpoint())
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  await button(page, 0, 1).click({ modifiers: ['Shift'] })
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => window.testSceneRef.current?.world === window.testStore.getWorld())
  await freeze(page)
  await page.getByTitle('followers', { exact: true }).click()
  assert.deepEqual(await selection(page), savedSelection)
  assert.deepEqual(await snapshot(page), guarded)
  assert.ok(await page.evaluate(() => window.testSceneRef.current.hudTaskFocus.every(value => value === 0)), 'scene-local focus memory resets after world replacement')

  // Supporting fixture: native class disappearance/return and housed/tower categories.
  const fixture = await page.evaluate(async () => {
    const scene=window.testSceneRef.current, world=scene.world,
      { addUnit, addBuilding } = await import('/app/model.ts'),
      { createLivePerson } = await import('/app/live-people.ts'),
      shaman=world.units.find(u=>u.team==='blue'&&u.kind==='shaman'),
      warrior=addUnit(world,'blue','warrior',{x:shaman.x+2,z:shaman.z}),
      hut=addBuilding(world,'blue','hut',{x:shaman.x+12,z:shaman.z},true),
      housed=addUnit(world,'blue','brave',{x:shaman.x+12,z:shaman.z})
    warrior.native=createLivePerson(world,warrior);warrior.native.state=19
    housed.inside=hut.id;housed.work=hut.id
    scene.onChange();return {warrior:warrior.id,housed:housed.id,hut:hut.id}
  })
  assert.equal(await button(page, 1, 2).isEnabled(), true)
  assert.equal((await snapshot(page))[8].count, 1)
  assert.equal((await snapshot(page))[14].count, 0, 'a zero task count does not disable a globally existing class')
  assert.equal(await button(page, 2, 2).isEnabled(), true)
  assert.ok((await snapshot(page))[13].count > 0)
  await page.evaluate(({warrior,hut})=>{const s=window.testSceneRef.current;s.world.units.find(u=>u.id===warrior).hp=0;s.world.buildings.find(b=>b.id===hut).kind='tower';s.onChange()},fixture)
  assert.equal(await button(page, 1, 2).isDisabled(), true)
  assert.equal((await snapshot(page))[13].count, 0)

  const layouts=[]
  for (const viewport of [{width:1280,height:720},{width:1920,height:1080},{width:3440,height:1440}]) {
    await page.setViewportSize(viewport)
    for (const size of ['auto','1','2','4']) {
      await page.getByRole('button',{name:'Menu',exact:true}).click()
      await page.getByRole('combobox',{name:'HUD size',exact:true}).selectOption(size)
      await page.getByRole('button',{name:'Close menu',exact:true}).click()
      const rects=await page.locator('.follower-tasks button').evaluateAll(buttons=>buttons.map(b=>{const r=b.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}}))
      for(const r of rects){assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=viewport.width&&r.y+r.h<=viewport.height);assert.ok(Math.abs(r.w/r.h-15/34)<0.001)}
      assert.equal(rects.length,24);layouts.push({viewport,size,first:rects[0],last:rects.at(-1)})
    }
  }
  assert.deepEqual(receipt.errors, [])
  return { ...state, opening, guarded, pixels, layouts, fixtureLimits:'Injected class/occupancy fixture checks presentation/adapters only; opening/selection/focus/G/checkpoint use real Mission1 followers.' }
}
