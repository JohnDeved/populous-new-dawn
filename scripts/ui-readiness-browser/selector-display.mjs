import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export class DiagnosticTimeoutError extends Error {
  constructor(message) {
    super(message)
    this.name = 'DiagnosticTimeoutError'
  }
}

// Composition contract for scripts/ui-readiness-browser/run.mjs:
// Its default scenario receives { page, context, output, url, servingDescription }.
// An independently reviewed wrapper must call the named export below with
// browser: context.browser(), url, output, and explicit sourceCommit,
// expectExpanded (false=baseline, true=candidate), and one allowed spec.
// Do not infer those values from servingDescription or silently default them.
// Each invocation owns one fresh context; wrapper/runner context stays owned by
// the runner. Run the four specs as separate admitted cases, not one 320s case.
// Parent owns before/after composition and its finite aggregate budget.

// Imported by the parent's already-authorized hosted browser runner. Never launches
// a browser/server, regenerates assets, seeds storage, or injects game state.
export async function checkSelectorDisplays({
  browser,
  url,
  output,
  sourceCommit,
  expectExpanded,
  spec,
}) {
  assert.match(sourceCommit ?? '', /^[0-9a-f]{40}$/, 'Runner must supply exact source commit')
  assert.equal(typeof expectExpanded, 'boolean', 'Explicit baseline/candidate mode required')
  const allowed = [
    { width: 1024, height: 768, dpr: 1 },
    { width: 1920, height: 1080, dpr: 1 },
    { width: 2560, height: 1267, dpr: 1 },
    { width: 1920, height: 1080, dpr: 2 },
  ]
  assert.ok(
    allowed.some(
      item => item.width === spec?.width && item.height === spec?.height && item.dpr === spec?.dpr
    ),
    'Select exactly one admitted viewport/DPR case'
  )
  await mkdir(output, { recursive: true })
  // One case normally needs ~13s of scene time. 80s includes navigation,
  // captures and resize checks, plus5s cleanup, below the runner90s case cap.
  const capMs = 80000,
    cleanupMs = 5000
  const report = {
    sourceCommit,
    url,
    expectExpanded,
    status: 'running',
    capMs,
    cleanupMs,
    screenshotScope:
      'Layout-only captures, not animation-phase pixel equivalence; Start hover does not launch gameplay.',
    started: new Date().toISOString(),
    cases: [],
  }
  const path = resolve(output, 'selector-display-report.json')
  let writes = Promise.resolve()
  const persist = () => {
    const snapshot = JSON.stringify(report, null, 2)
    writes = writes.then(() => writeFile(path, snapshot))
    return writes
  }
  await persist()
  const owned = new Set(),
    closing = new Map()
  let pendingCreations = 0
  let expired = false
  const timeoutError = new DiagnosticTimeoutError(`Selector display diagnostic exceeded ${capMs}ms`)
  let rejectDeadline
  const deadline = new Promise((_, reject) => {
    rejectDeadline = reject
  })
  const timer = setTimeout(() => {
    expired = true
    rejectDeadline(timeoutError)
    for (const context of owned) void close(context).catch(() => {})
  }, capMs)
  const step = async action => {
    if (expired) throw timeoutError
    const value = await Promise.race([
      Promise.resolve().then(() => {
        if (expired) throw timeoutError
        return action()
      }),
      deadline,
    ])
    if (expired) throw timeoutError
    return value
  }
  const close = context => {
    if (closing.has(context)) return closing.get(context)
    const pending = (async () => {
      let timer
      try {
        await Promise.race([
          context.close(),
          new Promise((_, reject) => {
            timer = setTimeout(
              () => reject(new Error('Owned context cleanup exceeded 5000ms')),
              cleanupMs
            )
          }),
        ])
        owned.delete(context)
      } finally {
        clearTimeout(timer)
      }
    })()
    closing.set(context, pending)
    return pending
  }
  const run = async () => {
    const cases = [spec]
    const near = (actual, expected, label) =>
      assert.ok(Math.abs(actual - expected) < 0.15, `${label}: ${actual} != ${expected}`)
    for (const spec of cases) {
      const key = `${spec.width}x${spec.height}-dpr${spec.dpr}`
      const result = { ...spec, phases: [], status: 'running' }
      report.cases.push(result)
      const phase = async name => {
        result.phases.push({ name, at: new Date().toISOString() })
        await persist()
      }
      await phase('case-started')
      const context = await step(() => {
        pendingCreations++
        return browser
          .newContext({
            viewport: { width: spec.width, height: spec.height },
            deviceScaleFactor: spec.dpr,
          })
          .then(async created => {
            owned.add(created)
            if (expired) {
              await close(created)
              throw timeoutError
            }
            return created
          })
          .finally(() => {
            pendingCreations--
          })
      })
      try {
        const page = await step(() => context.newPage())
        page.setDefaultTimeout(15000)
        page.setDefaultNavigationTimeout(30000)
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        await phase('navigate')
        await step(() => page.goto(url, { waitUntil: 'domcontentloaded' }))
        const menu = page.getByRole('dialog', { name: 'Main menu', exact: true })
        await step(() => menu.getByRole('button', { name: 'New Game', exact: true }).click())
        const recommendation = page.locator('[data-original-tutorial-recommendation]')
        const dialog = page.getByRole('dialog', { name: 'Start game', exact: true })
        await step(() => recommendation.or(dialog).first().waitFor({ state: 'visible' }))
        if (await step(() => recommendation.isVisible()))
          await step(() => recommendation.getByRole('button', { name: 'No', exact: true }).click())
        await step(() => dialog.waitFor({ state: 'visible' }))
        await phase('selector-visible')
        await step(() =>
          page.waitForFunction(
            () => {
              const c = document.querySelector('[data-world-scene]')
              return c?.dataset.ready === 'true' && Number(c.dataset.elapsed) >= 13
            },
            null,
            { timeout: 25000 }
          )
        )
        await step(() =>
          page.waitForFunction(() =>
            [...document.querySelectorAll('[aria-label="Campaign status panel"] img')].every(
              i => i.complete && i.naturalWidth > 0
            )
          )
        )
        await phase('scene-settled')
        const inspect = async () =>
          step(() =>
            page.evaluate(() => {
              const c = document.querySelector('[data-world-scene]')
              const panel = document.querySelector('[aria-label="Campaign status panel"]')
              const title = document.querySelector('[aria-label="World selection"] h3 img')
              const rect = element => element.getBoundingClientRect().toJSON()
              return {
                dpr: devicePixelRatio,
                viewport: { width: innerWidth, height: innerHeight },
                canvas: rect(c),
                backing: { width: c.width, height: c.height },
                panel: rect(panel),
                title: rect(title),
                overflow: document.documentElement.scrollWidth > innerWidth,
                selected: c.dataset.selectedBody,
                progression: c.dataset.progressionBody,
                elapsed: c.dataset.elapsed,
              }
            })
          )
        const geometry = await inspect()
        result.geometry = geometry
        const validate = (g, width, height) => {
          const scale = Math.min(width / 640, height / 480)
          near(g.canvas.width, expectExpanded ? width : 640 * scale, 'canvas width')
          near(g.canvas.height, 480 * scale, 'canvas height')
          near(g.canvas.x, expectExpanded ? 0 : (width - 640 * scale) / 2, 'canvas left')
          near(g.panel.width, 638 * scale, 'panel width')
          near(g.panel.height, 61 * scale, 'panel height')
          near(g.panel.x, (width - 638 * scale) / 2, 'panel left')
          near(g.panel.y, height - 61 * scale, 'panel top')
          near(g.title.width, 200 * scale, 'Mission 1 title width')
          near(g.title.height, 19 * scale, 'title height')
          assert.equal(g.dpr, spec.dpr, 'actual devicePixelRatio')
          const backingScale = Math.min(spec.dpr, 4096 / Math.max(g.canvas.width, g.canvas.height))
          assert.equal(
            g.backing.width,
            Math.max(1, Math.round(g.canvas.width * backingScale)),
            'backing width'
          )
          assert.equal(
            g.backing.height,
            Math.max(1, Math.round(g.canvas.height * backingScale)),
            'backing height'
          )
          assert.ok(g.backing.width <= 4096 && g.backing.height <= 4096)
          assert.equal(g.overflow, false)
        }
        validate(geometry, spec.width, spec.height)
        await step(() => page.screenshot({ path: resolve(output, `${key}-settled.png`) }))
        const one = page.getByRole('button', { name: 'Panel Mission 1', exact: true })
        const two = page.getByRole('button', { name: 'Panel Mission 2', exact: true })
        await step(() => one.hover())
        await step(() => page.locator('[data-native-tooltip="979"]').waitFor({ state: 'visible' }))
        await step(() => page.screenshot({ path: resolve(output, `${key}-tooltip.png`) }))
        const start = page.getByRole('button', { name: 'Start Mission 1', exact: true })
        await step(() => start.hover())
        assert.equal(
          await step(() => start.locator('img').evaluate(i => getComputedStyle(i).opacity)),
          '1'
        )
        await step(() => page.screenshot({ path: resolve(output, `${key}-start-hover.png`) }))
        await step(() => two.click())
        assert.equal(
          await step(() =>
            page.getByRole('button', { name: 'Start Mission 2', exact: true }).isDisabled()
          ),
          true
        )
        await step(() => page.keyboard.press('ArrowRight'))
        await step(() => start.waitFor({ state: 'visible' }))
        assert.equal(await step(() => one.getAttribute('aria-pressed')), 'true')
        assert.equal(await step(() => start.isEnabled()), true)
        await phase('selection-and-tooltip-passed')
        for (const viewport of [
          { width: 1024, height: 768 },
          { width: 2560, height: 1267 },
          { width: 1024, height: 768 },
        ]) {
          await step(() => page.setViewportSize(viewport))
          await step(() =>
            page.waitForFunction(
              ({ width, height, expanded, dpr }) => {
                const canvas = document.querySelector('[data-world-scene]')
                const panel = document.querySelector('[aria-label="Campaign status panel"]')
                const title = document.querySelector('[aria-label="World selection"] h3 img')
                if (!canvas || !panel || !title) return false
                const c = canvas.getBoundingClientRect(),
                  p = panel.getBoundingClientRect(),
                  t = title.getBoundingClientRect()
                const s = Math.min(width / 640, height / 480)
                const backing = Math.min(dpr, 4096 / Math.max(c.width, c.height))
                const near = (a, b) => Math.abs(a - b) < 0.15
                return (
                  innerWidth === width &&
                  innerHeight === height &&
                  devicePixelRatio === dpr &&
                  near(c.width, expanded ? width : 640 * s) &&
                  near(c.height, 480 * s) &&
                  near(c.x, expanded ? 0 : (width - 640 * s) / 2) &&
                  near(p.width, 638 * s) &&
                  near(p.height, 61 * s) &&
                  near(p.x, (width - 638 * s) / 2) &&
                  near(p.y, height - 61 * s) &&
                  near(t.width, 200 * s) &&
                  near(t.height, 19 * s) &&
                  canvas.width === Math.max(1, Math.round(c.width * backing)) &&
                  canvas.height === Math.max(1, Math.round(c.height * backing))
                )
              },
              { ...viewport, expanded: expectExpanded, dpr: spec.dpr },
              { timeout: 10000 }
            )
          )
          const resized = await inspect()
          validate(resized, viewport.width, viewport.height)
          ;(result.resizes ??= []).push(resized)
        }
        await phase('resize-roundtrip-passed')
        await step(() => page.keyboard.press('Escape'))
        await step(() => menu.waitFor({ state: 'visible' }))
        assert.equal(await step(() => page.locator('[data-world-scene]').count()), 0)
        assert.deepEqual(errors, [])
        result.status = 'passed'
      } catch (error) {
        result.status = expired ? 'timed-out' : 'failed'
        result.error = String(error.stack || error)
        throw error
      } finally {
        await close(context)
        await phase('context-closed')
      }
    }
  }
  try {
    await Promise.race([run(), deadline])
    if (expired) throw timeoutError
    report.status = 'passed'
  } catch (error) {
    report.status = expired ? 'timed-out' : 'failed'
    report.error = String((expired ? timeoutError : error).stack || error)
    throw expired ? timeoutError : error
  } finally {
    clearTimeout(timer)
    const cleanup = await Promise.allSettled([...owned].map(close))
    report.cleanup = {
      remainingContexts: owned.size,
      pendingCreations,
      errors: cleanup.filter(r => r.status === 'rejected').map(r => String(r.reason)),
    }
    if (owned.size && report.status === 'passed') report.status = 'failed'
    for (const result of report.cases)
      if (result.status === 'running')
        result.status = report.status === 'timed-out' ? 'timed-out' : 'failed'
    report.finished = new Date().toISOString()
    await persist()
  }
  if (report.status !== 'passed') throw new Error('Selector diagnostic context cleanup failed')
  return report
}
