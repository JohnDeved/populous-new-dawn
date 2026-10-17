#!/usr/bin/env node
// Narrow CPU comparison: one RenderView substitution, shared unchanged dependencies.
// Run serially: node scripts/bench-terrain-picking-triangles.mjs --base SHA --output work/new.json
// Query timing excludes setup, camera/wave updates, result checks and digests. No browser/FPS claim.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { arch, cpus, platform, release } from 'node:os'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const SELF = fileURLToPath(import.meta.url), ROOT = resolve(dirname(SELF), '..')
const APP = pathToFileURL(`${resolve(ROOT, 'app')}${sep}`).href
const RENDER = 'app/render-view.ts'
const MODES = ['pointer', 'camera', 'stationary', 'native-pointer', 'native-camera', 'native-warm-cache']
const WORKLOAD = { mission: 2, width: 1440, height: 1000, warmup: 80, queries: 240, pairs: 6 }
const COMPILER = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
const git = (...args) => execFileSync('git', args, { cwd: ROOT, maxBuffer: 32 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const text = value => `${JSON.stringify(value, null, 2)}\n`
const read = path => readFileSync(resolve(ROOT, path))
const blobFormat = git('rev-parse', '--show-object-format').toString().trim()
const blob = bytes => createHash(blobFormat).update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
const controls = [relative(ROOT, SELF), 'package.json', 'package-lock.json', 'tsconfig.json',
  relative(ROOT, fileURLToPath(import.meta.resolve('typescript'))), 'public/original/waves.bin']
if (existsSync(resolve(ROOT, 'node_modules/.package-lock.json'))) controls.push('node_modules/.package-lock.json')
function stats(samples) {
  assert.ok(samples.length && samples.every(value => Number.isFinite(value) && value >= 0))
  const sorted = [...samples].sort((a, b) => a - b), middle = sorted.length >> 1
  return { n: sorted.length, p50: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    p95: sorted[Math.ceil(sorted.length * .95) - 1], p99: sorted[Math.ceil(sorted.length * .99) - 1],
    max: sorted.at(-1), total: samples.reduce((sum, value) => sum + value, 0) }
}
function runtime() {
  return { node: process.version, versions: process.versions, executable: process.execPath,
    executableSha256: sha(readFileSync(process.execPath)), execArgv: process.execArgv,
    os: { platform: platform(), release: release(), arch: arch() },
    cpu: cpus()[0]?.model, logicalCpus: cpus().length,
    environment: Object.fromEntries(['NODE_OPTIONS', 'NODE_PATH', 'NODE_COMPILE_CACHE', 'NODE_V8_COVERAGE', 'TZ', 'LANG', 'LC_ALL']
      .map(key => [key, process.env[key] ?? ''])) }
}
for (const name of ['NODE_OPTIONS', 'NODE_PATH', 'NODE_COMPILE_CACHE', 'NODE_V8_COVERAGE'])
  assert.ok(!process.env[name], `${name} must be empty for this comparison`)
assert.equal(process.execArgv.length, 0, 'Run directly with Node, without profiling or loader flags')

async function worker(variant, mode, base) {
  assert.ok(['baseline', 'candidate'].includes(variant) && MODES.includes(mode))
  const nativeEdges = mode.startsWith('native-'), waterUpdates = mode !== 'native-warm-cache'
  const movingPointer = mode === 'pointer' || mode === 'native-pointer'
  const movingCamera = mode === 'camera' || mode === 'native-camera'
  const source = variant === 'baseline' ? git('show', `${base}:${RENDER}`) : read(RENDER)
  const inputs = new Map(), record = (path, bytes, compiled) => inputs.set(path, {
    path, sha256: sha(bytes), gitBlob: blob(bytes), ...(compiled === undefined ? {} : { compiledSha256: sha(compiled) }),
  })
  for (const path of controls) record(path, read(path))
  // Both processes import the same module URL. Substitution at load time keeps all
  // relative imports in app/ and applies the same compiler to both RenderViews.
  registerHooks({
    resolve(specifier, context, next) {
      if (specifier.startsWith('.') && context.parentURL?.startsWith(APP)) {
        const url = new URL(specifier, context.parentURL)
        if (!/\.[a-z]+$/i.test(url.pathname) && existsSync(fileURLToPath(url) + '.ts'))
          return next(url.href + '.ts', context)
      }
      return next(specifier, context)
    },
    load(url, context, next) {
      if (!url.startsWith('file:')) return next(url, context)
      const path = relative(ROOT, fileURLToPath(url)), bytes = path === RENDER ? source : readFileSync(new URL(url))
      if (url.startsWith(APP) && /\.(ts|json)$/.test(url)) {
        const compiled = url.endsWith('.json') ? `export default ${bytes}`
          : ts.transpileModule(bytes.toString(), { compilerOptions: COMPILER }).outputText
        record(path, bytes, compiled)
        return { format: 'module', source: compiled, shortCircuit: true }
      }
      record(path, bytes)
      return next(url, context)
    },
  })
  const THREE = await import('three')
  const [{ RenderView }, { createWorld }, terrain] = await Promise.all([
    import(new URL('render-view.ts', APP)), import(new URL('model.ts', APP)), import(new URL('scene-terrain-runtime.ts', APP)),
  ])
  const world = createWorld(WORKLOAD.mission), view = new RenderView()
  const mesh = new THREE.InstancedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial(), 9)
  Object.assign(mesh.userData, { painterGround: true, terrainGrid: true, nativeRelative: true })
  const scene = { world, terrain: mesh, view, decorations: new THREE.Group(), updateView() {},
    waves: new Uint8Array(read('public/original/waves.bin')) }
  scene.landIndex = (x, z) => terrain.landIndex(scene, x, z)
  terrain.rebuildTerrain(scene)
  terrain.updateWater(scene)
  const camera = new THREE.Camera(), mouse = new THREE.Vector2(), objects = [mesh]
  const samples = [], digest = createHash('sha256'), counts = [], submissions = []
  const rssBefore = process.memoryUsage().rss
  for (let step = 0; step < WORKLOAD.warmup + WORKLOAD.queries; step++) {
    const phase = step / WORKLOAD.queries * Math.PI * 2
    mouse.set(movingPointer ? .65 * Math.sin(phase) : .1, movingPointer ? .5 * Math.cos(phase) : .1)
    const pose = { x: movingCamera ? 3 * Math.sin(phase) : 0, z: movingCamera ? 3 * Math.cos(phase) : 0 }
    view.update(WORKLOAD.width, WORKLOAD.height, pose, movingCamera ? phase * .07 : 0, 0, false)
    if (waterUpdates) {
      world.turn = step
      terrain.updateWater(scene)
    }
    // Native-edge queries consume the index/copy submission prepared by the
    // renderer. Default-edge queries perform this preparation themselves.
    if (nativeEdges) view.updateTerrainVisibility(mesh)
    const start = performance.now()
    const hits = view.pickCandidates(mouse, objects, camera, nativeEdges)
    const elapsed = performance.now() - start
    if (step >= WORKLOAD.warmup) {
      samples.push(elapsed); counts.push(hits.length)
      const submission = { indexedVertices: mesh.geometry.index?.count,
        drawnVertices: mesh.geometry.drawRange.count, copies: mesh.count }
      assert.ok(submission.indexedVertices > 0 && submission.drawnVertices > 0 && submission.copies > 0,
        'queries must consume live indexed terrain submission')
      submissions.push(submission)
    }
    // Preserve ordered identities and IEEE-754 values, including signed zero.
    // Mesh identity is normalized to its sole workload slot across fresh processes.
    const bytes = Buffer.allocUnsafe(16 + hits.length * 48)
    bytes.writeDoubleLE(step, 0); bytes.writeDoubleLE(hits.length, 8)
    hits.forEach((hit, index) => {
      assert.equal(hit.object, mesh)
      const values = [0, hit.point.x, hit.point.z, hit.depth, hit.triangle, hit.instance]
      assert.ok(values.every(Number.isFinite), 'nonfinite terrain result')
      values.forEach((value, field) => bytes.writeDoubleLE(value, 16 + index * 48 + field * 8))
    })
    digest.update(bytes)
  }
  // Verify the dedicated warm-cache route outside the timed samples. No screen
  // wrapper is present during measurement, and every measured input was static.
  let warmCacheProjectionCalls
  if (!waterUpdates) {
    warmCacheProjectionCalls = 0
    const screen = view.screen
    view.screen = function (...args) { warmCacheProjectionCalls++; return screen.apply(this, args) }
    view.pickCandidates(mouse, objects, camera, nativeEdges)
    view.screen = screen
    assert.equal(warmCacheProjectionCalls, 0, 'warm-cache workload must reuse projected vertices')
  }
  const memory = { rssBefore, rssAfter: process.memoryUsage().rss, peakRss: process.resourceUsage().maxRSS * 1024,
    scope: 'Whole child process in bytes, including compiler, modules and setup; not isolated allocation counts.' }
  view.dispose(); mesh.geometry.dispose(); mesh.material.dispose()
  assert.ok(counts.some(Boolean), `${mode}: workload must produce real terrain hits`)
  const files = [...inputs.values()].sort((a, b) => a.path.localeCompare(b.path))
  for (const input of files) {
    const bytes = input.path === RENDER && variant === 'baseline' ? source : read(input.path)
    assert.equal(sha(bytes), input.sha256, `input changed during child: ${input.path}`)
  }
  return { variant, mode, runtime: runtime(), workload: { ...WORKLOAD, nativeEdges, waterUpdates,
    units: world.units.length, buildings: world.buildings.length }, warmCacheProjectionCalls,
    inputs: files, sourceSha256: sha(JSON.stringify(files)), samples, stats: stats(samples), memory,
    hitCounts: counts, submissions, hitQueries: counts.filter(Boolean).length, orderedHitSha256: digest.digest('hex') }
}

if (process.argv[2] === '--worker') {
  assert.equal(process.argv.length, 6)
  console.log(JSON.stringify(await worker(...process.argv.slice(3))))
} else {
  assert.equal(process.argv.length, 6, 'Usage: --base SHA --output work/new-result.json')
  const options = new Map()
  for (let index = 2; index < process.argv.length; index += 2) {
    const key = process.argv[index]
    assert.ok(['--base', '--output'].includes(key) && !options.has(key), `invalid option: ${key}`)
    options.set(key, process.argv[index + 1])
  }
  assert.ok(/^[0-9a-f]{7,64}$/i.test(options.get('--base')), '--base must be a commit SHA')
  const base = git('rev-parse', '--verify', `${options.get('--base')}^{commit}`).toString().trim()
  const output = resolve(ROOT, options.get('--output')), path = relative(ROOT, output)
  assert.ok(path && !path.startsWith(`..${sep}`) && path !== '..' && path.endsWith('.json'), 'output must be a new ignored JSON file inside this worktree')
  assert.equal(spawnSync('git', ['check-ignore', '--quiet', '--no-index', '--', path], { cwd: ROOT }).status, 0, 'output must be ignored')
  const report = { version: 1, status: 'running', started: new Date().toISOString(), base,
    head: git('rev-parse', 'HEAD').toString().trim(), harnessSha256: sha(readFileSync(SELF)),
    render: { baselineBlob: git('rev-parse', `${base}:${RENDER}`).toString().trim(), candidateBlob: blob(read(RENDER)) },
    runtime: runtime(), compiler: COMPILER, workload: WORKLOAD,
    scope: 'CPU-only default/native-edge terrain candidate queries. Shipped Mission 2 terrain; changing waves except the dedicated native warm-cache workload. No simulation advancement, painter submission, browser, GPU or hardware-FPS evidence.',
    digestScope: 'Ordered candidates for all warmup and measured queries; object slot, exact Float64 coordinates/depth, triangle and instance.',
    rounds: [], summary: {} }
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, text(report), { flag: 'wx' })
  const save = () => writeFileSync(output, text(report))
  try {
    let referenceInputs
    for (const mode of MODES) {
      for (let pair = 0; pair < WORKLOAD.pairs; pair++) {
        const round = { mode, pair, order: pair % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate'], runs: {} }
        report.rounds.push(round)
        for (const variant of round.order) {
          const command = [SELF, '--worker', variant, mode, base]
          const child = spawnSync(process.execPath, command, { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
          const run = round.runs[variant] = { command: [process.execPath, ...command], exitCode: child.status, signal: child.signal,
            stdoutSha256: sha(child.stdout ?? ''), stderr: child.stderr, ...(child.status === 0 ? {} : { stdout: child.stdout }) }
          save()
          assert.equal(child.status, 0, child.error?.message || child.stderr || 'child failed')
          try { run.result = JSON.parse(child.stdout) } catch (error) { run.stdout = child.stdout; throw error }
          const result = run.result
          save()
          assert.deepEqual(result.runtime, report.runtime, 'runtime changed between processes')
          assert.equal(result.inputs.find(input => input.path === RENDER)?.gitBlob, report.render[`${variant}Blob`])
          const common = result.inputs.filter(input => input.path !== RENDER)
          if (!referenceInputs) {
            referenceInputs = common
            const paths = common.map(input => input.path).filter(path => path.startsWith('app/') || ['package.json', 'package-lock.json', 'tsconfig.json', 'public/original/waves.bin'].includes(path))
            const entries = git('ls-tree', '-rz', base, '--', ...paths).toString().split('\0').filter(Boolean)
            const expected = new Map(entries.map(entry => { const [meta, path] = entry.split('\t'); return [path, meta.split(' ')[2]] }))
            for (const input of common.filter(input => paths.includes(input.path)))
              assert.equal(input.gitBlob, expected.get(input.path), `dependency differs from base: ${input.path}`)
          } else assert.deepEqual(common, referenceInputs, 'consumed dependencies changed between runs')
        }
        const a = round.runs.baseline.result, b = round.runs.candidate.result
        assert.deepEqual(b.workload, a.workload)
        assert.equal(b.orderedHitSha256, a.orderedHitSha256, `${mode} pair ${pair}: ordered hits differ`)
        assert.deepEqual(b.hitCounts, a.hitCounts)
        assert.deepEqual(b.submissions, a.submissions, `${mode} pair ${pair}: terrain submission differs`)
        round.totalReductionPercent = (1 - b.stats.total / a.stats.total) * 100
        console.log(JSON.stringify({ mode, pair, baseline: a.stats, candidate: b.stats, totalReductionPercent: round.totalReductionPercent }))
        save()
      }
      const rounds = report.rounds.filter(round => round.mode === mode)
      const baseline = stats(rounds.flatMap(round => round.runs.baseline.result.samples))
      const candidate = stats(rounds.flatMap(round => round.runs.candidate.result.samples))
      report.summary[mode] = { baseline, candidate, totalReductionPercent: (1 - candidate.total / baseline.total) * 100,
        pairWins: rounds.filter(round => round.totalReductionPercent > 0).length, pairs: rounds.length,
        pairedReductionsPercent: rounds.map(round => round.totalReductionPercent) }
    }
    assert.equal(git('rev-parse', 'HEAD').toString().trim(), report.head, 'HEAD changed during comparison')
    assert.equal(sha(readFileSync(SELF)), report.harnessSha256, 'harness changed during comparison')
    assert.equal(blob(read(RENDER)), report.render.candidateBlob, 'candidate changed during comparison')
    for (const input of referenceInputs) assert.equal(sha(read(input.path)), input.sha256, `input changed: ${input.path}`)
    report.status = 'passed'
  } catch (error) {
    report.status = 'failed'; report.error = error.stack ?? String(error)
    throw error
  } finally {
    report.finished = new Date().toISOString(); save()
  }
  console.log(text({ output, status: report.status, summary: report.summary }))
}
