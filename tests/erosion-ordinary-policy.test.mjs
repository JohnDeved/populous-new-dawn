import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { serverIdentity, packageCodeIdentity, validatePlan, limits, sha256, evidenceBytes } from '../qa/erosion-ordinary/source-policy.mjs'
import { pollWithPreservation } from '../qa/erosion-ordinary/stop.mjs'

test('the actual harness Vite launcher must resolve inside the pinned package closure', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'erosion-launcher-'))
  try {
    for (const file of ['package-lock.json', 'node_modules/.package-lock.json', 'scripts/local-render/harness.mjs',
      'scripts/local-render/owned-profile.mjs', 'scripts/local-render/checkpoint-observer.mjs', 'scripts/local-render/vite.config.mjs']) {
      mkdirSync(resolve(root, file, '..'), { recursive: true }); writeFileSync(resolve(root, file), '{}')
    }
    mkdirSync(resolve(root, 'node_modules/.bin')); writeFileSync(resolve(root, 'other-vite.mjs'), 'different transform')
    symlinkSync(resolve(root, 'other-vite.mjs'), resolve(root, 'node_modules/.bin/vite'))
    assert.throws(() => serverIdentity(root), /Vite launcher/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('immutable compiler identity includes nested executable chunks and declared dependencies', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'erosion-packages-'))
  try {
    const a = resolve(root, 'node_modules/a'), b = resolve(root, 'node_modules/b')
    mkdirSync(resolve(a, 'dist'), { recursive: true }); mkdirSync(b, { recursive: true })
    writeFileSync(resolve(a, 'package.json'), JSON.stringify({ name: 'a', version: '1', dependencies: { b: '1' } }))
    writeFileSync(resolve(b, 'package.json'), JSON.stringify({ name: 'b', version: '1' }))
    writeFileSync(resolve(a, 'dist/chunk.js'), 'transform before'); writeFileSync(resolve(b, 'index.cjs'), 'dependency')
    const before = packageCodeIdentity([a])
    assert.equal(Object.keys(before).length, 2)
    writeFileSync(resolve(a, 'dist/chunk.js'), 'transform after')
    const after = packageCodeIdentity([a])
    assert.notEqual(after[a].files['dist/chunk.js'], before[a].files['dist/chunk.js'])
    assert.deepEqual(after[b], before[b])
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('polling rejects stop or timeout arriving during an awaited ready predicate', async () => {
  let time = 0
  await assert.rejects(pollWithPreservation(async () => { time = 121; return true }, {
    now: () => time, checkStop: async () => {}, timeout: 120, label: 'test',
  }), /Timed out/)
  let stopped = false
  await assert.rejects(pollWithPreservation(async () => { stopped = true; return true }, {
    checkStop: async () => { if (stopped) throw Error('stop') }, timeout: 120, label: 'test',
  }), /stop/)
})

test('external launch plan rejects wrong source, compiler, dirty source, bounds and reused path shape', () => {
  const root = '/synthetic/root', source = { commit: 'a'.repeat(40), fingerprint: 'b'.repeat(64), status: '', untracked: [] }, server = { synthetic: true }
  const plan = { kind: 'erosion-ordinary-capture-launch-plan', purpose: 'capture', operationalGrantReceived: true, sourceHead: source.commit,
    sourceFingerprint: source.fingerprint, root, applicationTree: '84d4a529d361106feb3f760917a71b247e1c0c25',
    serverIdentitySha256: sha256(JSON.stringify(server)), origin: 'http://127.0.0.1:4188', profilePath: `${root}/work/local-render-profiles/new`,
    output: `${root}/work/orchestration/erosion-ordinary/new`, limits, restoreTested: false,
    bounds: { scenarioWallMs: 900000, harnessMs: 960000, outerMs: 1020000, outerKillAfterMs: 20000 } }
  validatePlan(plan, source, server, root)
  const smoke = { ...plan, purpose: 'startup-smoke', bounds: { scenarioWallMs: 120000, harnessMs: 150000, outerMs: 180000, outerKillAfterMs: 20000 } }
  validatePlan(smoke, source, server, root)
  assert.throws(() => validatePlan({ ...smoke, bounds: plan.bounds }, source, server, root))
  assert.throws(() => validatePlan({ ...plan, purpose: undefined }, source, server, root))
  for (const patch of [{ operationalGrantReceived: false }, { sourceHead: 'c'.repeat(40) }, { serverIdentitySha256: 'c'.repeat(64) },
    { profilePath: '/old/profile' }, { limits: { ...limits, wallMs: Infinity } }, { restoreTested: true }])
    assert.throws(() => validatePlan({ ...plan, ...patch }, source, server, root))
  assert.throws(() => validatePlan(plan, { ...source, status: 'dirty' }, server, root))
})

test('all 64 captured calls with worst-case signed heights fit the 32MiB replay input bound', () => {
  const state = { center: { x: 65535, y: 65535, h: -32768 }, remaining: 64, randomState: 4294967295, heights: Array(16384).fill(-32768) }
  const capture = { steps: Array.from({ length: 64 }, (_, i) => ({ turn: i, visit: { ordinal: i + 1, before: state, after: state,
    alive: true, completed: true, copyMilliseconds: 0.1, notifications: [{ kind: 'sound', completed: true }, { kind: 'terrain', cell: 65535, completed: true }] } })) }
  const bytes = evidenceBytes(capture)
  assert.ok(Buffer.byteLength(bytes) < 32 * 1024 * 1024, 'actual export exceeds strict replay admission size')
  assert.deepEqual(JSON.parse(bytes).steps[0].visit.before.heights, state.heights)
})
