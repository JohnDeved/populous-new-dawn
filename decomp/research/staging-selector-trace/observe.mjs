import assert from 'node:assert/strict'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'

export const output = 'work/orchestration/staging-selector-trace-01-20261007'
const runtime = new URL('../../../app/computer-runtime.ts', import.meta.url).href
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const original = readFileSync(fileURLToPath(runtime), 'utf8')
const replaceOnce = (source, old, replacement) => {
  assert.equal(source.split(old).length, 2, `unique source anchor: ${old}`)
  return source.replace(old, replacement)
}
const call = event => `globalThis[Symbol.for('pnd.staging.trace')]('${event}', w, index)`
let instrumented = replaceOnce(original,
  '    if (task.type === 20) {\n',
  `    if (task.type === 20) {\n      ${call('raid-before')}\n`)
const baseWrite = '      w.ai.constructionBase = ((outside.x >>> 8) & 254) | (outside.y & 0xfe00)'
instrumented = replaceOnce(instrumented, baseWrite,
  `      ${call('base-before')}\n${baseWrite}\n      ${call('base-after')}`)
const start = instrumented.indexOf('    if (task.type === 20) {\n')
const end = instrumented.indexOf('    if (task.type !== 6)', start)
assert.ok(start > 0 && end > start)
let branch = instrumented.slice(start, end)
branch = replaceOnce(branch, '      for (const action of actions) {\n',
  "      globalThis[Symbol.for('pnd.staging.trace')]('raid-actions', w, index, staging, actions, { shamanId: shaman?.id, shamanPosition })\n      for (const action of actions) {\n")
assert.ok(branch.endsWith('      return\n    }\n'))
branch = branch.slice(0, -'      return\n    }\n'.length) + `      ${call('raid-after')}\n      return\n    }\n`
instrumented = instrumented.slice(0, start) + branch + instrumented.slice(end)
export const transformedSha256 = sha(instrumented)
export const originalSha256 = sha(original)
export const transformedSource = instrumented

const field = (object, key) => ({ present: Object.hasOwn(object, key), type: typeof object[key], value: structuredClone(object[key]) })
// Coordinate conversion only: calling nativePosition here would synchronize terrain.
const cell = point => (((Math.round((point.x + 8) * 256) & 65535) >>> 8) & 254) |
  ((Math.round((-point.z - 8) * 256) & 65535) & 0xfe00)
const person = (w, u) => {
  const registered = w.objectCells.objects.get(u.id)
  const slots = { native: u.native, fight: u.fight?.motion, flight: u.flight,
    entry: u.entry?.person, builder: u.builder?.person }
  const p = registered
  return { id: u.id, kind: u.kind, team: u.team, hp: u.hp, x: u.x, z: u.z, nativeFlags7f: field(u, 'nativeFlags7f'),
    registered: !!p, slots: Object.fromEntries(Object.entries(slots).map(([key, value]) => [key, !!value && value === p])),
    person: p ? Object.fromEntries(['id','class','model','tribe','state','substate','animationMode',
      'commandPhase','flags2','flags3','flags4','computerAssignment','nativeFlags7f','x','y','life','speed',
      'commands','commandCursor','immediateCommand'].map(key => [key, field(p, key)])) : null,
    records: p ? [...new Set([p.immediateCommand, ...(p.commands ?? [])].filter(Number.isInteger))]
      .filter(id => id > 0).map(id => ({ id, record: structuredClone(w.buildingOrders.records[id]) })) : [] }
}
export function snapshot(w, index = null) {
  const ai = w.ai, tribe = w.activeCampaignTribe
  const shamans = w.units.filter(u => u.kind === 'shaman').map(u => ({ ...person(w, u), cell: cell(u) }))
  const task = index === null ? null : ai.tasks[index]
  return { turn: w.turn, status: w.status, tribe, aiIsCampaignOwner: ai === w.campaignAIs[tribe],
    aiFlags: ai.flags, constructionBase: field(ai, 'constructionBase'), defencePosition: field(ai, 'defencePosition'),
    attributes: [...ai.attributes], randomState: w.randomState, cosmeticRandomState: w.cosmeticRandom.randomState,
    killCredits: structuredClone(w.killCredits), selected: [...w.selected], shamans,
    index, task: task ? structuredClone(task) : null,
    members: task ? task.members.map(id => { const u = w.units.find(u => u.id === id); return u ? person(w, u) : { id, missing: true } }) : [],
    towers: w.buildings.filter(b => b.kind === 'tower').map(b => ({ id: b.id, team: b.team, hp: b.hp, progress: b.progress,
      x: b.x, z: b.z, angle: b.angle, plan: b.plan })),
    pool: { cursor: w.buildingOrders.cursor, active: w.buildingOrders.active } }
}

let bytes = 0, rows = 0, calls = 0, baseWrites = 0, complete = null
const before = new Map(), signatures = new Map()
const emit = row => {
  const text = JSON.stringify(row) + '\n'
  bytes += Buffer.byteLength(text); rows++
  assert.ok(bytes <= 8 * 1024 * 1024 && rows <= 2000, 'passive output cap')
  appendFileSync(`${output}/trace.jsonl`, text)
}
export function initialize(w, authored) {
  assert.equal(w.outcome.level, 2)
  emit({ kind: 'initialization-endpoint', authoredShamans: authored, snapshot: snapshot(w) })
}
export function install() {
  assert.equal(globalThis[Symbol.for('pnd.staging.trace')], undefined)
  globalThis[Symbol.for('pnd.staging.trace')] = (kind, w, index, staging, actions, selectedShaman) => {
    if (kind === 'raid-before') {
      calls++
      before.set(w.ai.tasks[index], snapshot(w, index))
      return
    }
    const current = snapshot(w, index)
    if (kind.startsWith('base-')) {
      if (kind === 'base-after') baseWrites++
      emit({ kind, snapshot: current })
      return
    }
    const prior = before.get(w.ai.tasks[index])
    assert.ok(prior, 'actual preceding type20 entry')
    if (kind === 'raid-actions') {
      const signature = JSON.stringify([prior.task.phase, current.task.phase, staging, actions, current.constructionBase])
      if (signatures.get(w.ai.tasks[index]) !== signature || actions.length) {
        signatures.set(w.ai.tasks[index], signature)
        emit({ kind, staging, selectedShaman: structuredClone(selectedShaman), actions: structuredClone(actions), before: prior, after: current,
          establishedBaseDiffers: current.constructionBase.type === 'number' ? current.constructionBase.value !== staging : null })
      }
      if (!complete && prior.task.phase === 5 && actions.some(a => a.kind === 'move' && a.target === staging)) {
        complete = { pending: true, staging, index, turn: w.turn, tribe: current.tribe,
          constructionBase: current.constructionBase, baseWrites, establishedBaseDiffers:
            current.constructionBase.type === 'number' ? current.constructionBase.value !== staging : null }
      }
    } else if (complete?.pending && complete.index === index && complete.turn === w.turn && complete.tribe === current.tribe) {
      emit({ kind, snapshot: current })
      complete.pending = false
    }
  }
  return registerHooks({ load(url, context, next) {
    const result = next(url, context)
    if (url !== runtime) return result
    assert.equal(sha(result.source), originalSha256)
    return { ...result, source: instrumented }
  } })
}
export const completed = () => complete !== null && !complete.pending
export function finish(w, error, tickCalls) {
  if (w) emit({ kind: 'final-post-tick', snapshot: snapshot(w, complete?.index ?? null) })
  const result = { kind: 'owned-app Mission2 staging trace; source-instrumented passive observation',
    status: error ? 'failed-or-bound' : completed() ? 'observed-first-staging' : 'unreached',
    error: error ? { name: error.name, message: error.message, stack: error.stack } : null,
    tickCalls, cap: 12000, baseWrites, raidVisits: calls, rows, bytes, firstStaging: complete,
    originalSha256, transformedSha256,
    limits: ['No original/native execution or ordinary browser claim', 'Later return branches and attack/combat assertions unrun',
      'A missing established base at first staging remains an unmet prerequisite; no scenario extension'] }
  writeFileSync(`${output}/result.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  return result
}
