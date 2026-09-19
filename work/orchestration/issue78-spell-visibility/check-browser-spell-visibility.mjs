import assert from 'node:assert/strict'
import { mkdirSync, openSync, renameSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import native from '../../../app/original-hud.json' with { type: 'json' }
import { openGame } from '../../../scripts/browser-game.mjs'

const projectRoot = process.cwd(),
  requireFromProject = createRequire(resolve(projectRoot, 'package.json')),
  { chromium } = requireFromProject('@playwright/test'),
  output = process.env.PND_QUEUE_OUTPUT ?? '/private/tmp',
  port = 4321,
  host = '127.0.0.1',
  question = native.rects['1056']
assert.ok(question)
mkdirSync(output, { recursive: true })
let server

async function startServer() {
  if (process.env.POPULOUS_URL) return
  const log = openSync(resolve(output, 'server.log'), 'a')
  server = spawn(
    resolve(projectRoot, 'node_modules/.bin/vinext'),
    ['dev', '--hostname', host, '--port', String(port)],
    {
      cwd: projectRoot,
      detached: true,
      stdio: ['ignore', log, log],
      env: { ...process.env, WRANGLER_LOG_PATH: resolve(output, 'wrangler.log') },
    }
  )
  process.env.POPULOUS_URL = `http://${host}:${port}`
  const readiness = []
  for (let attempt = 0; attempt < 200; attempt++) {
    if (server.exitCode !== null) throw new Error(`dev server exited with ${server.exitCode}`)
    try {
      const response = await fetch(process.env.POPULOUS_URL, {
        signal: AbortSignal.timeout(1000),
      })
      readiness.push({ attempt, status: response.status, ok: response.ok })
      if (response.ok) {
        writeFileSync(resolve(output, 'readiness.json'), JSON.stringify(readiness, null, 2) + '\n')
        return
      }
    } catch (error) {
      readiness.push({ attempt, error: String(error) })
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  writeFileSync(resolve(output, 'readiness.json'), JSON.stringify(readiness, null, 2) + '\n')
  throw new Error('dev server readiness timed out')
}

async function waitForServerExit(timeoutMs) {
  if (!server || server.exitCode !== null || server.signalCode !== null) return true
  return await new Promise(resolve => {
    let timeout
    const onExit = () => finish(true)
    const finish = exited => {
      if (timeout) clearTimeout(timeout)
      server.off('exit', onExit)
      resolve(exited)
    }
    server.once('exit', onExit)
    if (server.exitCode !== null || server.signalCode !== null) return finish(true)
    timeout = setTimeout(
      () => finish(server.exitCode !== null || server.signalCode !== null),
      timeoutMs
    )
  })
}

async function stopServer() {
  if (!server) return
  try {
    process.kill(-server.pid, 'SIGTERM')
  } catch {}
  if (await waitForServerExit(5000)) return
  try {
    process.kill(-server.pid, 'SIGKILL')
  } catch {}
  if (!(await waitForServerExit(5000))) throw new Error('dev server did not exit after SIGKILL')
}

function cleanupReceipt() {
  if (!process.env.PND_QUEUE_CLEANUP) return
  const receipt = {
      jobId: process.env.PND_QUEUE_JOB_ID,
      resourcesReleased: true,
      releasedAt: new Date().toISOString(),
      processes: server ? [{ pid: server.pid, group: true }] : [],
    },
    temporary = `${process.env.PND_QUEUE_CLEANUP}.tmp`
  writeFileSync(temporary, JSON.stringify(receipt, null, 2) + '\n')
  renameSync(temporary, process.env.PND_QUEUE_CLEANUP)
}

async function openMission(browser, mission) {
  const opened = await openGame(browser, mission)
  await opened.page.evaluate(() => {
    const scene = window.testScene
    scene.world.paused = true
    scene.world.speed = 0
    cancelAnimationFrame(scene.frame)
  })
  return opened
}

async function state(page) {
  return page.evaluate(async () => {
    const w = window.testScene.world,
      { SPELLS } = await import('/app/world-rules.ts'),
      { spellHudVisibility, spellHudRoster } = await import('/app/spell-visibility.ts'),
      { spellOrder } = await import('/app/spell-button.ts'),
      all = SPELLS.map(spell => ({
        id: spell.id,
        name: spell.name,
        model: spell.model,
        visibility: spellHudVisibility(w, spell),
        shots: w.shots[spell.id],
      })),
      roster = spellHudRoster(w)
        .toSorted((a, b) => spellOrder.indexOf(a.spell.model) - spellOrder.indexOf(b.spell.model))
        .map(({ spell, visibility }) => ({
          id: spell.id,
          name: spell.name,
          model: spell.model,
          visibility,
          shots: w.shots[spell.id],
        }))
    return {
      level: w.outcome.level,
      all,
      roster,
      resources: {
        shots: structuredClone(w.shots),
        giftCounts: structuredClone(w.giftCounts),
        spells: structuredClone(w.manaWorld.spells),
        mana: w.mana,
        manaTribes: w.manaTribes.map(tribe => ({
          mana: tribe.mana,
          pending: tribe.pending,
          spellProgress: [...tribe.spellProgress],
        })),
        randomState: w.randomState,
        cosmeticRandom: structuredClone(w.cosmeticRandom),
        turn: w.turn,
      },
      mode: w.mode,
    }
  })
}

async function validateMission(page, mission, report) {
  const before = await state(page)
  assert.equal(before.level, mission)
  assert.ok(before.roster.some(entry => entry.visibility === 'undiscovered'))
  assert.ok(before.roster.some(entry => entry.visibility === 'visible'))
  if (mission === 1) assert.ok(before.roster.some(entry => entry.visibility === 'visible-disabled'))

  const cards = page.locator('.spell-list .spell-card')
  assert.equal(await cards.count(), before.roster.length)
  const renderedSpriteRects = card =>
      card.locator('i.hud-sprite').evaluateAll(nodes =>
        nodes.map(node => {
          const [rawX, rawY] = node.style.backgroundPosition.split(/\s+/),
            x = -Number.parseFloat(rawX),
            y = -Number.parseFloat(rawY),
            w = Number.parseFloat(node.style.width),
            h = Number.parseFloat(node.style.height)
          if (![x, y, w, h].every(Number.isFinite))
            throw new Error(`Unparseable HUD sprite rectangle: ${node.getAttribute('style')}`)
          return { x, y, w, h }
        })
      ),
    isQuestionRect = rect =>
      rect.x === question.x &&
      rect.y === question.y &&
      rect.w === question.w &&
      rect.h === question.h
  let visibleClicked = false
  for (let index = 0; index < before.roster.length; index++) {
    const expected = before.roster[index],
      card = cards.nth(index),
      label = await card.getAttribute('aria-label'),
      ariaDisabled = await card.getAttribute('aria-disabled'),
      spriteRects = await renderedSpriteRects(card)
    if (expected.visibility === 'undiscovered') {
      assert.equal(label, 'Undiscovered spell')
      assert.equal(ariaDisabled, 'true')
      assert.equal(spriteRects.filter(isQuestionRect).length, 1)
      const mode = await page.evaluate(() => window.testScene.world.mode),
        box = await card.boundingBox()
      assert.ok(box && box.width > 0 && box.height > 0)
      await card.hover()
      assert.equal(await page.evaluate(() => window.testScene.world.mode), mode)
      assert.equal((await renderedSpriteRects(card)).filter(isQuestionRect).length, 1)
    } else {
      assert.equal(label, `${expected.name}, ${expected.shots} shots`)
      assert.equal(spriteRects.some(isQuestionRect), false)
      if (expected.visibility === 'visible-disabled') {
        assert.equal(ariaDisabled, 'true')
        const mode = await page.evaluate(() => window.testScene.world.mode),
          box = await card.boundingBox()
        assert.ok(box && box.width > 0 && box.height > 0)
        await card.hover()
        assert.equal(await page.evaluate(() => window.testScene.world.mode), mode)
      } else {
        assert.equal(ariaDisabled, 'false')
        if (!visibleClicked) {
          await card.click()
          assert.equal(await page.evaluate(() => window.testScene.world.mode), expected.id)
          await card.click()
          assert.equal(await page.evaluate(() => window.testScene.world.mode), null)
          visibleClicked = true
        }
      }
    }
  }
  for (const hidden of before.all.filter(entry => entry.visibility === 'hidden'))
    assert.equal(
      await page.getByRole('button', { name: new RegExp(`^${hidden.name}, \\d+ shots$`) }).count(),
      0
    )

  const after = await state(page)
  assert.deepEqual(after.resources, before.resources)
  assert.equal(after.mode, null)
  report.missions.push({
    mission,
    states: before.all.reduce((counts, entry) => {
      counts[entry.visibility] = (counts[entry.visibility] ?? 0) + 1
      return counts
    }, {}),
    roster: before.roster,
  })
}

const report = {
  startedAt: new Date().toISOString(),
  job: process.env.PND_QUEUE_JOB_ID,
  missions: [],
  errors: [],
}
let browser
try {
  assert.ok(
    process.env.PND_QUEUE_JOB_ID && process.env.PND_QUEUE_DEADLINE,
    'Use the canonical queue'
  )
  await startServer()
  browser = await chromium.launch({ headless: true })
  for (const mission of [1, 16]) {
    const { page, errors } = await openMission(browser, mission)
    await validateMission(page, mission, report)
    report.errors.push(...errors)
    await page.context().close()
  }
  assert.deepEqual(report.errors, [])
  report.status = 'PASS_NATIVE_SPELL_HUD_VISIBILITY'
} catch (error) {
  report.status = 'FAILED_NATIVE_SPELL_HUD_VISIBILITY'
  report.error = error.stack ?? String(error)
  process.exitCode = 1
} finally {
  if (browser) await browser.close()
  await stopServer()
  cleanupReceipt()
  report.finishedAt = new Date().toISOString()
  writeFileSync(resolve(output, 'evidence.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
}
