// Explicit public-UI setup for checks that start an arbitrary mission.
// Campaign progression acceptance must use Select Mission + Start instead.
export async function showAllMissions(page) {
  const startup = page.getByRole('dialog', { name: 'Start game', exact: true })
  await startup.waitFor({ state: 'visible' })
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
