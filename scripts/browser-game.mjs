import { openCampaignFromMainMenu, waitForStartupMenu } from './browser-new-game.mjs'
// Explicit public-UI setup for checks that start an arbitrary mission.
// Campaign progression acceptance uses native panel selection + Start instead.
export async function showSelectorControls(page) {
  const controls = page.getByRole('button', { name: 'Browser controls', exact: true })
  if (await controls.getAttribute('aria-expanded') !== 'true') await controls.click()
}

export async function showAllMissions(page) {
  await waitForStartupMenu(page, { allowSelector: true })
  const mainMenu = page.getByRole('dialog', { name: 'Main menu', exact: true })
  if (await mainMenu.isVisible()) await openCampaignFromMainMenu(page)
  const startup = page.getByRole('dialog', { name: 'Start game', exact: true })
  await startup.waitFor({ state: 'visible' })
  await showSelectorControls(page)
  const allMissions = startup.getByRole('button', { name: 'All missions', exact: true })
  if (await allMissions.getAttribute('aria-pressed') !== 'true') await allMissions.click()
}

export async function bindGame(page) {
  await page.waitForSelector('.world-viewport canvas')
  await page.waitForFunction(
    () => !document.querySelector('[data-vinext-dev-error-overlay]')?.shadowRoot?.textContent?.trim()
  )
  await page.waitForFunction(() => {
    const main = document.querySelector('main')
    const scenes = [], stores = []
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return) {
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        if (hook.memoizedState?.current?.unitMeshes) scenes.push(hook.memoizedState)
        if (hook.memoizedState?.getWorld) stores.push(hook.memoizedState)
      }
    }
    for (const store of stores) {
      const scene = scenes.find(ref => ref.current?.world === store.getWorld())
      if (
        !scene?.current?.renderer?.domElement?.isConnected ||
        document.querySelector('.loading-world')
      )
        continue
      window.testSceneRef = scene
      window.testScene = scene.current
      window.testStore = store
      return true
    }
    return false
  })
}

// Reload destroys installed observation aliases. Bind the current document for
// every read and import the pure observer locally; no mission-specific global
// function or captured pre-replacement world survives between observations.
export async function readShamanReadiness(page) {
  await bindGame(page)
  return page.evaluate(async () => {
    const { campaignShamanReadiness } = await import('/scripts/campaign-start-readiness.mjs')
    const scene = window.testSceneRef?.current, store = window.testStore
    if (
      !scene?.renderer?.domElement?.isConnected ||
      scene.world !== store?.getWorld() ||
      document.querySelector('.loading-world')
    ) return { ready: false, reason: 'Scene/store changed during readiness observation' }
    return { ...campaignShamanReadiness(scene.world), level: scene.world.outcome.level }
  })
}

// Await each asynchronous module/observation read outside Playwright polling.
// Passing an async readiness predicate to waitForFunction can accept its Promise
// as truthy before the actual native selection gate has cleared.
export async function waitForShamanReadiness(page, { timeout = 30000, polling = 100 } = {}) {
  if (!Number.isFinite(timeout) || timeout <= 0 || !Number.isFinite(polling) || polling <= 0)
    throw new RangeError('Invalid readiness wait timeout or polling interval')
  const deadline = performance.now() + timeout
  let before, samples = 0
  for (;;) {
    const after = await readShamanReadiness(page)
    before ??= after
    samples++
    const remaining = deadline - performance.now()
    if (remaining <= 0)
      throw new Error(`Shaman readiness timed out after ${samples} samples: ${JSON.stringify(after)}`)
    if (after.ready === true) return { before, after, samples }
    await page.waitForTimeout(Math.min(polling, remaining))
  }
}

// Shared setup for desktop checks; keep test access out of the shipped game API.
// Exclusive Shaman selection through ordinary input. H is the native
// reincarnation-site camera key (action 0x96), so it no longer selects. Escape
// cancels an armed mode, then the selection; the primary Shaman portrait click
// then adds the live Shaman to the empty selection. Fails visibly otherwise.
export async function selectShamanByPortrait(page) {
  const read = () => page.evaluate(() => {
    const w = globalThis.testStore?.getWorld() ?? globalThis.testScene.world,
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
    return { mode: w.mode, selected: [...w.selected], shaman: shaman?.id ?? null,
      status: w.status, inputMask: w.inputMask, paused: w.paused,
      openMessages: document.querySelectorAll('.campaign-messages details[open]').length,
      active: document.activeElement?.tagName ?? null }
  })
  const exact = state => state.selected.length === 1 && state.selected[0] === state.shaman
  // An open campaign message owns gameplay shortcuts; collapse it publicly first.
  await collapseCampaignMessages(page)
  let state = await read()
  if (state.openMessages) throw Error(`Campaign messages still own the keyboard: ${JSON.stringify(state)}`)
  if (state.shaman === null) throw Error('No live Blue Shaman to select')
  for (let attempt = 0; attempt < 2 && (state.mode || (state.selected.length && !exact(state))); attempt++) {
    await page.keyboard.press('Escape')
    state = await read()
  }
  if (state.mode || (state.selected.length && !exact(state)))
    throw Error(`Escape did not clear the interaction: ${JSON.stringify(state)}`)
  if (await page.locator('dialog[data-original-pause-menu][open]').count())
    throw Error('Escape opened the pause menu instead of clearing the selection')
  if (!exact(state)) await page.getByRole('button', { name: 'Select shaman', exact: true }).click()
  await page.waitForFunction(() => {
    const w = globalThis.testStore?.getWorld() ?? globalThis.testScene.world,
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
    return w.selected.length === 1 && w.selected[0] === shaman?.id
  }, undefined, { timeout: 10000 })
}

export async function openGame(browser, mission = 1) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', { waitUntil: 'networkidle' })
  // Direct-access setup is explicit; campaign selector checks exercise its gating separately.
  await showAllMissions(page)
  await page.getByRole('button', { name: `Mission ${mission}`, exact: true }).focus()
  await page.keyboard.press('Enter')
  await bindGame(page)
  await page.waitForFunction(() => window.testScene.world.flyby.flags & 1 || !window.testScene.world.inputMask)
  await page.evaluate(() => document.querySelector('.skip-introduction')?.click())
  await page.waitForFunction(() => !window.testScene.world.inputMask)
  await page.waitForFunction(() => window.testSceneRef.current?.world === window.testStore.getWorld())
  await page.evaluate(() => { window.testScene = window.testSceneRef.current })
  return { page, errors }
}

// The original number row recalls follower groups (#1005), so checks arm spells
// through the actual HUD spell card. DOM activation keeps the pointer in place.
// Returns false when the mission roster has no card for that spell.
export async function chooseSpell(page, name) {
  await page.evaluate(() => {
    const tab = document.querySelector('button[title="spells"]')
    if (tab?.getAttribute('aria-pressed') !== 'true') tab?.click()
  })
  await page.waitForFunction(
    () => document.querySelector('button[title="spells"]')?.getAttribute('aria-pressed') === 'true'
  )
  return page.evaluate(name => {
    const card = [...document.querySelectorAll('.spell-card')].find(card =>
      card.getAttribute('aria-label')?.startsWith(`${name}, `)
    )
    card?.click()
    return !!card
  }, name)
}

export async function effectPixels(page, ids) {
  return page.evaluate(ids => {
    const scene = window.testScene, groups = ids.map(id => scene.fxMeshes.get(id))
    const renderer = scene.renderer, gl = renderer.getContext()
    const length = gl.drawingBufferWidth * gl.drawingBufferHeight * 4
    const before = new Uint8Array(length), after = new Uint8Array(length)
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, before)
    groups.forEach(g => { g.visible = false })
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, after)
    groups.forEach(g => { g.visible = true })
    let pixels = 0
    for (let i = 0; i < length; i += 4) {
      if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2]) pixels++
    }
    return pixels
  }, ids)
}

// Rendering/input regressions wait for the real view sequence; the transition
// check separately inspects each intermediate frame and original timing.
export async function settleView(page) {
  await page.evaluate(() => {
    const scene = window.testScene
    for (let i = 0; scene.overviewStage && i < 64; i++) scene.updateCameraMotion(1 / 24)
    if (scene.overviewStage) throw new Error('Overview transition did not finish')
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
  })
}

// Retained pre-modernization backdrop for pixel and paired frame-cost comparisons.
export const originalSkyShaders = {
  vertexShader: `uniform float height; varying vec2 skyUV;
    void main(){skyUV=uv;gl_Position=vec4(position.x,1.-(1.-position.y)*height,1.,1.);}`,
  fragmentShader: 'uniform sampler2D map; varying vec2 skyUV; void main(){gl_FragColor=texture2D(map,skyUV);}',
}

// An open campaign message owns gameplay keyboard shortcuts (app/page.tsx key
// handler; as in the original only an Enter press passes, and it closes the
// message), and missions such as 1 and 13 open their first message at start.
// Checks that press gameplay keys collapse every open message through its public
// summary first. Never dismisses a message or edits World data; fails if any stays open.
export async function collapseCampaignMessages(page) {
  const open = page.locator('.campaign-messages details[open] > summary[aria-label="Read campaign message"]')
  // Collapsing re-indexes the open set, so always close the first remaining message.
  for (let count = await open.count(), limit = 32; count && limit; count = await open.count(), limit--)
    await open.first().click()
  await page.waitForFunction(() => !document.querySelector('.campaign-messages details[open]'))
}

// Ordinary hover inspection of retained building panels (Huts, training Huts) only
// runs with no armed mode and an empty selection. Clear both through the shipped
// Escape binding (mode first, then selection); fails if the pause menu opens instead.
export async function clearSelectionWithEscape(page) {
  await collapseCampaignMessages(page)
  const busy = () => page.evaluate(() => {
    const w = window.testStore.getWorld()
    return !!w.mode || w.selected.length > 0
  })
  for (let attempt = 0; attempt < 2 && await busy(); attempt++) await page.keyboard.press('Escape')
  if (await page.locator('dialog[data-original-pause-menu][open]').count())
    throw new Error('Escape opened the pause menu instead of clearing the selection')
  await page.waitForFunction(() => {
    const w = window.testStore.getWorld()
    return !w.mode && w.selected.length === 0
  })
}
