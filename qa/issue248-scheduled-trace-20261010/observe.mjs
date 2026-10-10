import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { registerHooks } from 'node:module'
import { mock } from 'node:test'
import { serialize } from 'node:v8'
import { pathToFileURL, fileURLToPath } from 'node:url'

// One authored world, no scenario edits, no restore, no search over seeds.
const root = '/workspace/scratch/69fd8163d94e/issue248-scheduled-trace-20261010'
const output = '/workspace/scratch/69fd8163d94e/issue248-scheduled-trace-packet-20261010/phase3-capture-run'
const base = '4754e12d3590bde18656416514871b033de164be'
const qaPrefix = 'qa/issue248-scheduled-trace-20261010/'
const limits = { worlds: 1, turns: 22064, wallMilliseconds: 180000, phase3Completions: 1 }
const byteLimits = { jsonl: 32 * 1024 * 1024, world: 16 * 1024 * 1024, summary: 1024 * 1024 }
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
const url = path => pathToFileURL(`${root}/${path}`).href
const productionPaths = git('ls-files', 'app').split('\n')
const productionHashes = () => Object.fromEntries(productionPaths.map(path =>
  [path, hash(readFileSync(`${root}/${path}`))]))
const sources = ['app/computer.ts', 'app/computer-runtime.ts', 'app/computer-defense.ts',
  'app/campaign-command-runtime.ts', 'app/campaign-runtime.ts', 'app/world-turn.ts',
  'app/live-people.ts', 'app/live-movement.ts', 'app/object-cells.ts',
  'app/level-six.ts', 'app/original-script-six.json', 'tests/mission6.test.mjs']
const initial = { base, head: git('rev-parse', 'HEAD'), appTree: git('rev-parse', 'HEAD:app'),
  status: git('status', '--short'), production: productionHashes(),
  sources: Object.fromEntries(sources.map(path => [path, hash(readFileSync(`${root}/${path}`))])) }
git('merge-base', '--is-ancestor', base, 'HEAD')
const changedFromBase = git('diff', '--name-only', base, 'HEAD').split('\n').filter(Boolean)
assert.ok(changedFromBase.every(path => path.startsWith(qaPrefix)), 'Only the reviewed QA packet may differ from main')
assert.equal(git('diff', '--name-only', base, '--', 'app'), '')
assert.equal(initial.status, '')
assert.equal(fileURLToPath(import.meta.url), `${root}/${qaPrefix}observe.mjs`)
initial.qaFiles = Object.fromEntries(['observe.mjs', 'proposal.md', 'purity.test.mjs', 'project-phase3.mjs'].map(name => {
  const path = `${qaPrefix}${name}`, bytes = readFileSync(`${root}/${path}`)
  assert.equal(hash(bytes), hash(execFileSync('git', ['-C', root, 'show', `HEAD:${path}`])),
    `Executed QA bytes must match the pushed source commit: ${name}`)
  return [path, hash(bytes)]
}))
const runtimeText = readFileSync(`${root}/app/computer-runtime.ts`, 'utf8')
assert.equal(runtimeText.split('export function stepComputerTasks(').length, 2)
assert.ok(runtimeText.includes('actions = stepAttackTask(w.ai, index, {'))
assert.ok(runtimeText.includes('changeLivePersonState(w, u, 14)'))
if (process.argv.includes('--verify-source-only')) {
  console.log(JSON.stringify({ kind: 'source-only', ...initial, limits }, null, 2))
  process.exit(0)
}
assert.ok(process.execArgv.includes('--experimental-test-module-mocks'))
assert.ok(!existsSync(`${output}.jsonl`), 'Never overwrite a previous attempt')
const started = performance.now()
const events = []
let writtenBytes = 0, captureBytes = 0
const emit = event => {
  const row = { sequence: events.length, ...event }
  const line = JSON.stringify(row) + '\n'
  assert.ok(writtenBytes + captureBytes + Buffer.byteLength(line) <= byteLimits.jsonl, 'JSONL byte bound')
  events.push(row)
  appendFileSync(`${output}.jsonl`, line)
  writtenBytes += Buffer.byteLength(line)
}
emit({ kind: 'start', initial, limits, byteLimits, node: process.version, seed: 'createWorld(6) default' })

// Visibility and a pass-through wrapper: all original function bodies stay intact.
// Capture immediately after the actual complete selection action batch.
const callbackKey = Symbol.for('issue248.phase3.afterTasks')
assert.equal(globalThis[callbackKey], undefined)
const suffix = `
export function stepComputerTasks(w, tribe) {
  const result = issue248OriginalStepComputerTasks(w, tribe);
  globalThis[Symbol.for('issue248.phase3.afterTasks')]?.(w, tribe);
  return result;
}
`
const evaluatedRuntime = runtimeText.replace('export function stepComputerTasks(',
  'function issue248OriginalStepComputerTasks(') + suffix
registerHooks({
  load(specifier, context, nextLoad) {
    const loaded = nextLoad(specifier, context)
    if (specifier !== url('app/computer-runtime.ts')) return loaded
    assert.equal(typeof loaded.source === 'string' ? loaded.source : Buffer.from(loaded.source).toString(), runtimeText)
    emit({ kind: 'runtime-observation-wrapper', original: hash(runtimeText),
      evaluated: hash(evaluatedRuntime), suffix,
      declarationRename: ['export function stepComputerTasks(', 'function issue248OriginalStepComputerTasks('] })
    return { ...loaded, source: evaluatedRuntime }
  },
})

const actualComputer = await import(url('app/computer.ts'))
let world, pending = [], allocation = null, completion = null, visits = 0
let stopReason = null, failure = null
// The controlled purity regression extracts this bounded helper block only.
function assertNeutral(scope, beforeBytes, afterBytes) {
  assert.ok(beforeBytes.length <= byteLimits.world && afterBytes.length <= byteLimits.world,
    'Serialized world byte bound')
  if (!beforeBytes.equals(afterBytes)) {
    writeFileSync(`${output}.guard-before.bin`, beforeBytes, { flag: 'wx' })
    writeFileSync(`${output}.guard-after.bin`, afterBytes, { flag: 'wx' })
    emit({ kind: 'observer-rejection', scope, before: hash(beforeBytes), after: hash(afterBytes),
      beforeBytes: beforeBytes.length, afterBytes: afterBytes.length,
      diagnostics: ['guard-before.bin', 'guard-after.bin'] })
  }
  assert.equal(hash(afterBytes), hash(beforeBytes), `${scope} changed during observation`)
}
function phase3Outcome(before, after) {
  if (before.phase !== 3) return null
  if (after.phase === 4 && after.selected > 0 && (after.flags & 1)) return 'completed-positive'
  if (!(after.flags & 1)) return 'retired-without-admission'
  return after.phase === 3 ? null : 'unexpected-phase-exit'
}
function snapshot(index, capture = false) {
  const liveBefore = serialize(world)
  assert.ok(liveBefore.length <= byteLimits.world, 'Serialized world byte bound')
  let result
  try {
    const task = world.campaignAIs[2].tasks[index]
    result = { turn: world.turn, index, task: structuredClone(task),
      randomState: world.randomState, cosmeticRandom: world.cosmeticRandom.randomState,
      queue: { cursor: world.campaignAIs[2].cursor, flags: world.campaignAIs[2].flags,
        selectionOwner: world.campaignAIs[2].selectionOwner } }
  } catch (error) {
    emit({ kind: 'observer-helper-error', name: error.name, message: error.message, stack: error.stack })
    throw error
  } finally {
    assertNeutral('live world', liveBefore, serialize(world))
  }
  if (capture) {
    assert.equal(captureBytes, 0, 'Only the decisive completion world is captured')
    assert.ok(writtenBytes + liveBefore.length <= byteLimits.jsonl, 'Combined capture/JSONL byte bound')
    const path = `${output}.completion.bin`
    writeFileSync(path, liveBefore, { flag: 'wx' })
    captureBytes = liveBefore.length
    result.capture = { path, sha256: hash(liveBefore), bytes: liveBefore.length,
      boundary: 'after the complete real phase3 action batch, before later gameplay' }
  }
  return result
}
const computerMock = mock.module(url('app/computer.ts'), { cache: true, namedExports: {
  ...actualComputer,
  requestAttack(ai, ...args) {
    const before = ai.tasks.map(task => !!(task.flags & 1))
    const result = actualComputer.requestAttack(ai, ...args)
    if (world && ai === world.campaignAIs[2]) {
      const index = ai.tasks.findIndex((task, i) => !before[i] && task.flags & 1 && task.type === 20)
      if (index >= 0) {
        assert.equal(allocation, null, 'Bounded to first Chumara allocation')
        allocation = { turn: world.turn, index, args: structuredClone(args), task: structuredClone(ai.tasks[index]) }
        emit({ kind: 'allocation', ...allocation })
      }
    }
    return result
  },
  stepAttackTask(ai, index, input) {
    if (!world || ai !== world.campaignAIs[2] || index !== allocation?.index ||
      ai.tasks[index].phase !== 3) return actualComputer.stepAttackTask(ai, index, input)
    const beforeController = snapshot(index), calls = [], observedInput = { ...input }
    for (const name of ['select', 'selectShaman']) {
      if (!input[name]) continue
      observedInput[name] = (...args) => {
        const result = input[name](...args)
        // Production has consumed the callback, but its returned select actions have not run.
        calls.push({ name, args: structuredClone(args), result: structuredClone(result),
          afterCallback: snapshot(index) })
        return result
      }
    }
    const actions = actualComputer.stepAttackTask(ai, index, observedInput)
    const afterController = snapshot(index)
    pending.push({ kind: 'phase3-visit', beforeController, calls,
      actions: structuredClone(actions), afterController,
      outcome: phase3Outcome(beforeController.task, afterController.task) })
    return actions
  },
} })

try {
  globalThis[callbackKey] = (w, tribe) => {
    if (w !== world || tribe !== 2) return
    for (const event of pending) {
      assert.equal(event.afterDispatch, undefined, 'Exactly one dispatcher completion per visit')
      event.afterDispatch = snapshot(event.beforeController.index, event.outcome === 'completed-positive')
      assert.equal(event.afterDispatch.turn, event.beforeController.turn)
      emit(event)
      visits++
      if (event.outcome) {
        completion = event
        stopReason = event.outcome
      }
    }
    pending = []
  }
  await import(url('app/computer-runtime.ts'))
  const { createWorld, tick } = await import(url('app/model.ts'))
  world = createWorld(6)
  emit({ kind: 'world', turn: world.turn, randomState: world.randomState,
    units: world.units.length, buildings: world.buildings.length,
    activeTribes: world.manaTribes.map(tribe => tribe.active),
    mutations: [], checkpoints: 0 })
  while (world.turn < limits.turns && !stopReason) {
    if (performance.now() - started >= limits.wallMilliseconds) { stopReason = 'wall-bound'; break }
    tick(world, 1 / 12)
    assert.equal(pending.length, 0, 'Every intercepted controller visit must finish its dispatcher')
    if (world.turn % 2048 === 0) emit({ kind: 'progress', turn: world.turn,
      elapsedMilliseconds: Math.round(performance.now() - started),
      activeAttacks: world.campaignAIs[2].tasks.filter(t => t.flags & 1 && t.type === 20).map(t =>
        ({ phase: t.phase, members: [...t.members] })) })
  }
  stopReason ??= 'turn-bound'
} catch (error) {
  failure = { name: error.name, message: error.message, stack: error.stack }
  stopReason = 'exception'
} finally {
  const unchanged = JSON.stringify(productionHashes()) === JSON.stringify(initial.production)
  const trackedDiff = git('diff', '--name-only', base, '--', 'app')
  const result = { kind: 'result', stopReason, failure, turn: world?.turn ?? null,
    elapsedMilliseconds: Math.round(performance.now() - started), allocation: !!allocation,
    completedPositive: completion?.outcome === 'completed-positive', phase3Visits: visits,
    completionTurn: completion?.afterDispatch.turn ?? null, productionUnchanged: unchanged,
    terminal: world ? { turn: world.turn, randomState: world.randomState,
      cosmeticRandom: world.cosmeticRandom.randomState,
      chumaraAI: structuredClone(world.campaignAIs[2]),
      activeTribes: world.manaTribes.map(tribe => tribe.active),
      livingCounts: Object.fromEntries(['blue', 'yellow', 'green', 'wild'].map(team =>
        [team, world.units.filter(unit => unit.team === team && unit.hp > 0).length])) } : null,
    trackedDiff, status: git('status', '--short'),
    claim: 'Port-only raw phase3 completion capture; full cohort requires separate hash-verified offline projection; no native parity proved' }
  emit(result)
  const summary = JSON.stringify(result, null, 2) + '\n'
  assert.ok(Buffer.byteLength(summary) <= byteLimits.summary, 'Summary byte bound')
  writeFileSync(`${output}.summary.json`, summary, { flag: 'wx' })
  delete globalThis[callbackKey]
  computerMock.restore()
  console.log(summary)
  if (failure || !unchanged || trackedDiff) process.exitCode = 1
  else if (completion?.outcome !== 'completed-positive') process.exitCode = 2
}
