import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createGameStore } from '../app/game-store.ts'
import { applySpellTestCheat, spellTestShortcut } from '../app/spell-test-cheats.ts'
import { SPELLS } from '../app/world-rules.ts'
import { spellHudVisibility, spellHudCanCharge } from '../app/spell-visibility.ts'
import { cast, spellTargetError } from '../app/live-command.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import { pageEffect, pageNode, pageSource, evaluatePage } from './support/follower-nearby-page.mjs'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'

function readyStore() {
  const store = createGameStore(), world = store.getWorld()
  world.inputMask = 0
  return { store, world }
}

test('no cheats or resource changes until an explicit grant', () => {
  const { store, world } = readyStore(), before = structuredClone(world)
  assert.equal(store.hasUsedCheats(), false)
  store.update()
  assert.deepEqual(world, before)
})

test('unlock and refill synchronizes only supported stock and preserves live cast ownership', () => {
  const { store, world } = readyStore()
  const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  shaman.casting = { spell: 'blast', point: { x: shaman.x, z: shaman.z }, remaining: 0.25 }
  world.castingTribes[0].cooldown = 9
  world.manaWorld.spells[0].stocks[3] = 0xa1
  world.giftCounts.lightning = 7
  const before = structuredClone(world)
  assert.equal(store.applySpellTestCheat('unlock'), true)
  assert.equal(store.hasUsedCheats(), true)
  const expected = structuredClone(before)
  for (const spell of SPELLS) {
    expected.manaWorld.spells[0].available |= 1 << spell.model
    const count = Math.max(expected.shots[spell.id] & 15, rules.spellCharging[spell.model].normalLimit)
    expected.shots[spell.id] = count
    expected.manaWorld.spells[0].stocks[spell.model] = (expected.manaWorld.spells[0].stocks[spell.model] & 240) | count
    assert.equal(spellHudVisibility(world, spell), 'visible')
  }
  assert.deepEqual(world, expected, 'no world mutation beyond explicit stock/availability grants')
  assert.equal(world.manaWorld.spells[0].stocks[1], before.manaWorld.spells[0].stocks[1], 'unsupported native model is untouched')
  assert.equal(spellHudCanCharge(world, SPELLS.find(s => s.id === 'teleport')), false, 'gift-only charging rules remain unchanged')
})

test('refill respects locked spells and native limits without reducing existing gifts or progress', () => {
  const { world } = readyStore(), available = world.manaWorld.spells[0].available
  world.shots.lightning = 9
  world.manaTribes[0].spellProgress[2] = 4321
  const flags = world.manaWorld.spells[0].disabled = 0x101
  applySpellTestCheat(world, 'refill')
  assert.equal(world.shots.lightning, 9)
  assert.equal(world.shots.teleport, 0)
  assert.equal(world.manaWorld.spells[0].available, available)
  assert.equal(world.manaWorld.spells[0].disabled, flags)
  assert.equal(world.manaTribes[0].spellProgress[2], 4321)
  const refilled = structuredClone(world)
  applySpellTestCheat(world, 'refill')
  assert.deepEqual(world, refilled, 'repeated refills are bounded/idempotent')
})

test('mana is an explicit bounded incoming grant, not a cost or charging-rate override', () => {
  const { world } = readyStore(), before = structuredClone(world)
  applySpellTestCheat(world, 'mana')
  before.manaTribes[0].available = 1_000_000
  assert.deepEqual(world, before)
  world.manaTribes[0].available = 2_000_000
  applySpellTestCheat(world, 'mana')
  assert.equal(world.manaTribes[0].available, 2_000_000, 'never removes existing mana')
})

test('locked mission/result gates reject grants without tainting or changing world', () => {
  for (const setGate of [w => { w.inputMask = 1 }, w => { w.status = 'won' }, w => { w.manaWorld.gameFlags |= 32 }]) {
    const { store, world } = readyStore()
    setGate(world)
    const before = structuredClone(world)
    for (const action of ['unlock', 'refill', 'mana']) assert.equal(store.applySpellTestCheat(action), false)
    assert.equal(store.hasUsedCheats(), false)
    assert.deepEqual(world, before)
  }
})

test('cheats preserve ordinary range, busy-cast admission, charge spending and projectile windup', () => {
  const { store, world } = readyStore()
  store.applySpellTestCheat('unlock')
  const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    target = { x: shaman.x, z: shaman.z }
  world.paused = false
  shaman.casting = { spell: 'blast', point: target, remaining: 0.25 }
  const before = world.shots.lightning
  assert.equal(spellTargetError(world, 'lightning', target)?.code, -1)
  assert.equal(cast(world, 'lightning', target), false)
  assert.equal(world.shots.lightning, before)
  shaman.casting = null
  world.castingTribes[0].cooldown = 8
  assert.equal(cast(world, 'lightning', target), false)
  world.castingTribes[0].cooldown = 0
  assert.equal(spellTargetError(world, 'lightning', { x: shaman.x + 80, z: shaman.z })?.code, -2)
  assert.equal(cast(world, 'lightning', { x: shaman.x + 80, z: shaman.z }), false)
  assert.equal(cast(world, 'lightning', target), true)
  assert.equal(world.shots.lightning, before - 1)
  assert.equal(world.projectiles.at(-1).phase, 'windup')
  assert.equal(world.projectiles.at(-1).remaining, 6)
  assert.equal(world.castingTribes[0].cooldown, 12)
  const active = structuredClone(world.projectiles), casting = structuredClone(shaman.casting)
  store.applySpellTestCheat('refill')
  assert.deepEqual(world.projectiles, active)
  assert.deepEqual(shaman.casting, casting)
  assert.equal(world.castingTribes[0].cooldown, 12)
})

test('cheat sessions cannot overwrite checkpoints or record campaign completion; world replacement resets them', async () => {
  const { store, world } = readyStore(), normal = structuredClone(world)
  await store.saveCheckpoint()
  store.applySpellTestCheat('unlock')
  world.outcome.completedLevel = 0
  store.update()
  assert.deepEqual(store.getCompletedMissions(), [])
  await assert.rejects(store.saveCheckpoint(), /Testing cheats are active/)
  assert.equal(store.hasCheckpoint(), true)
  assert.equal(store.loadCheckpoint(), true)
  assert.equal(store.hasUsedCheats(), false)
  assert.deepEqual(store.getWorld().shots, normal.shots)
  assert.deepEqual(store.getWorld().manaWorld.spells, normal.manaWorld.spells)
  for (const replace of [() => store.restart(), () => store.startMission(2)]) {
    store.getWorld().inputMask = 0
    store.applySpellTestCheat('unlock')
    replace()
    assert.equal(store.hasUsedCheats(), false)
    assert.equal(store.getWorld().shots.teleport, 0)
  }
  store.getWorld().outcome.completedLevel = 1
  store.update()
  assert.deepEqual(store.getCompletedMissions(), [2], 'ordinary progress still records after a fresh mission')
})

test('F9 guards repeats, modifiers, editors and other dialogs while allowing own-menu close', () => {
  const event = { key: 'F9', target: { closest: () => null } }
  assert.equal(spellTestShortcut(event, false), true)
  for (const modifier of ['repeat', 'ctrlKey', 'altKey', 'metaKey', 'shiftKey'])
    assert.equal(spellTestShortcut({ ...event, [modifier]: true }, false), false)
  assert.equal(spellTestShortcut({ ...event, key: 'F8' }, false), false)
  const dialog = { ...event, target: { closest: selector => selector.split(',').includes('dialog') } }
  assert.equal(spellTestShortcut(dialog, false), false)
  assert.equal(spellTestShortcut(dialog, true), true)
  assert.equal(spellTestShortcut({ ...event, target: { closest: () => true } }, true), false)
})

test('actual Home F9 owner toggles once without mutating world and respects startup/menu gates', () => {
  let handler, opened = false, cancelled = 0
  const window = { addEventListener: (type, callback) => { handler = callback }, removeEventListener: (type, callback) => assert.equal(callback, handler) },
    world = { status: 'playing' }, before = structuredClone(world)
  for (const [ready, menu, selectorOpen, startup] of [[true, false, false, 'playing'], [false, false, false, 'playing'], [true, true, false, 'playing'], [true, false, true, 'playing'], [true, false, false, 'choice']]) {
    opened = false
    const cleanup = pageEffect("globalThis.addEventListener('keydown', toggle, true)", {
      globalThis: window, ready, menu, selectorOpen, startup, world, cheatsOpen: false, spellTestShortcut,
      cancelNearbyInput: () => cancelled++, setCheatsOpen: action => { opened = action(opened) },
    })()
    const event = { key: 'F9', target: { closest: () => null }, preventDefault() {}, stopImmediatePropagation() {} }
    handler(event)
    assert.equal(opened, ready && !menu && !selectorOpen && startup === 'playing')
    handler({ ...event, repeat: true })
    assert.equal(opened, ready && !menu && !selectorOpen && startup === 'playing')
    cleanup()
  }
  assert.equal(cancelled, 1)
  assert.deepEqual(world, before)
})

test('actual Home selection only sets ordinary mode and closes the menu; it cannot cast', () => {
  const element = pageNode(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(pageSource) === 'SpellTestMenu'),
    callback = element.attributes.properties.find(a => a.name?.getText(pageSource) === 'onSelect').initializer.expression
  const world = { mode: null }, calls = []
  evaluatePage(callback.getText(pageSource), {
    store: { change: action => action(world) }, setTab: tab => calls.push(tab), setCheatsOpen: state => calls.push(state),
  })('teleport')
  assert.equal(world.mode, 'teleport')
  assert.deepEqual(calls, ['spells', false])
})

test('actual runner invokes F9 once after held Escape, never inside the tutorial aggregate', async () => {
  const run = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8'),
    workflow = readFileSync(new URL('../.github/workflows/tutorial-browser.yml', import.meta.url), 'utf8'),
    source = ts.createSourceFile('run.mjs', run, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS),
    statements = source.statements.find(ts.isTryStatement).tryBlock.statements,
    start = statements.findIndex(node => ts.isIfStatement(node) &&
      node.expression.getText(source) === "selectedScenario === 'snapshot-protocol'" &&
      ts.isBlock(node.thenStatement)),
    routing = []
  assert.ok(start >= 0)
  for (let index = start; ts.isIfStatement(statements[index]); index++) routing.push(statements[index].getText(source))
  assert.equal((run.match(/receipt\.spellTestMenu =/g) ?? []).length, 1)
  assert.match(workflow, /scenario: frontend-held-escape/)
  assert.match(workflow, /node scripts\/tutorial-browser\/run\.mjs/)
  const scenarios = ['snapshotScenario', 'frontendEscapeScenario', 'spellTestScenario', 'spellConversionScenario', 'gameplayScenario',
    'meleeScenario', 'm2Scenario', 'pauseRecoveryScenario', 'scenario', 'selectorScenario', 'sceneryScenario',
    'spellProjectionScenario', 'buildingIdentityScenario', 'spellIconScenario']
  for (const selectedScenario of ['frontend-held-escape', 'tutorial']) {
    const calls = [], receipt = { browserCapMs: browserCapMs(selectedScenario) }, page = { goto: async () => calls.push('goto') },
      context = { close: async () => calls.push('closeFrontendContext') },
      browser = {}, bindings = {
        selectedScenario, receipt, page, context, browser, url: 'test-url', root: 'test-root',
        out: 'test-output', dist: 'test-dist', m2Fixture: {},
        browserStartedMs: 1000, performance: { now: () => 1250 },
        ...Object.fromEntries(scenarios.map(name => [name, name])),
        pathToFileURL: value => ({ href: value }),
        closeCompletedPrimaryTutorial: async input => {
          assert.equal(selectedScenario, 'tutorial')
          assert.equal(input.browser, browser); assert.equal(input.context, context); assert.equal(input.page, page)
          assert.equal(input.result, receipt.result); assert.equal(input.errors, receipt.errors)
          calls.push('retirePrimaryTutorial')
          await input.context.close()
          input.persist({ status: 'passed', contextClosed: true })
        },
        resolve: (...parts) => parts.join('/'),
        writeFileSync: (path, data) => {
          assert.equal(path, 'test-output/primary-tutorial-context.json')
          assert.deepEqual(JSON.parse(data), { status: 'passed', contextClosed: true })
          calls.push('persistPrimaryTutorial')
        },
        save: () => calls.push('saveReceipt'),
        importScenario: async name => ({ default: async input => {
          calls.push(name)
          assert.equal(input.output, 'test-output')
          if (name === 'spellTestScenario' || name === 'spellConversionScenario') assert.deepEqual(input, { browser, url: 'test-url', output: 'test-output' })
          if (name === 'spellIconScenario') assert.deepEqual(input,
            { browser, url: 'test-url', output: 'test-output', root: 'test-root', episode: selectedScenario })
          return { completed: name }
        } }),
      }
    await new Function(...Object.keys(bindings),
      `return (async () => { ${routing.join('\n').replaceAll('import(', 'importScenario(')} })()`)(...Object.values(bindings))
    if (selectedScenario === 'frontend-held-escape') {
      assert.deepEqual(calls, ['frontendEscapeScenario', 'closeFrontendContext', 'spellTestScenario', 'spellConversionScenario',
        'saveReceipt', 'spellIconScenario'])
      assert.deepEqual(receipt, { browserCapMs: browserCapMs(selectedScenario), frontendHeldEscape: { completed: 'frontendEscapeScenario' },
        spellTestMenu: { completed: 'spellTestScenario' }, spellConversion: { completed: 'spellConversionScenario' },
        spellIconBudgetBefore: { elapsedMs: 250, remainingMs: browserCapMs(selectedScenario) - 250 },
        spellIconStates: { completed: 'spellIconScenario' } })
    } else {
      assert.deepEqual(calls, ['goto', 'scenario', 'retirePrimaryTutorial', 'closeFrontendContext', 'persistPrimaryTutorial', 'saveReceipt', 'selectorScenario', 'sceneryScenario', 'm2Scenario',
        'spellProjectionScenario', 'buildingIdentityScenario', 'saveReceipt', 'spellIconScenario'])
      assert.equal('spellTestMenu' in receipt, false)
      assert.equal('spellConversion' in receipt, false)
      assert.deepEqual(receipt.spellIconBudgetBefore, { elapsedMs: 250, remainingMs: browserCapMs(selectedScenario) - 250 })
      assert.deepEqual(receipt.spellIconStates, { completed: 'spellIconScenario' })
    }
  }
})

test('actual testing dialog suspends only the scene, owns focus/Escape/F8 and never mutates the world on open', () => {
  const source = ts.createSourceFile('spell-test-menu.tsx', readFileSync(new URL('../app/spell-test-menu.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
    component = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name.text === 'SpellTestMenu')
  let activeWorld = { paused: false }, setup, closed = 0, f8 = 0, focus = '', suspended = false
  const world = activeWorld, before = structuredClone(world), modal = {
    showModal() { this.open = true }, close() { this.open = false },
    querySelector() { return { focus() { focus = 'close' } } },
  }
  class Element { isConnected = true; focus() { focus = 'previous' } }
  const scene = { setModalSuspended(value) { suspended = value }, togglePerformance() { f8++ } },
    store = { getWorld: () => activeWorld, hasUsedCheats: () => false },
    render = evaluatePage(component.getText(source).replace(/^export /, ''), {
      useEffect: callback => { setup = callback }, useRef: () => ({ current: modal }),
      useState: () => ['', () => {}], document: { activeElement: new Element() }, HTMLElement: Element,
      SPELLS: [], styles: {}, CHEAT_SAVE_NOTICE: 'Testing',
    }),
    view = render({ store, sceneRef: { current: scene }, onClose: () => { closed++ }, onSelect() {} }), cleanup = setup()
  assert.equal(suspended, true)
  assert.equal(modal.open, true)
  assert.equal(focus, 'close')
  assert.deepEqual(world, before)
  const key = (name, repeat = false) => {
    let prevented = false, stopped = false
    view.props.onKeyDown({ key: name, repeat, preventDefault() { prevented = true }, stopPropagation() { stopped = true } })
    return { prevented, stopped }
  }
  assert.deepEqual(key('F8'), { prevented: true, stopped: true })
  key('F8', true)
  assert.equal(f8, 1)
  key('Escape', true)
  assert.equal(closed, 0)
  key('Escape')
  assert.equal(closed, 1)
  assert.equal(key('Enter', true).prevented, true)
  cleanup()
  assert.equal(suspended, false)
  assert.equal(modal.open, false)
  assert.equal(focus, 'previous')
  assert.deepEqual(world, before)
  const cleanupObsolete = setup()
  activeWorld = { paused: true }
  cleanupObsolete()
  assert.equal(suspended, true, 'obsolete scene is left suspended for disposal')
  assert.deepEqual(activeWorld, { paused: true })
})
