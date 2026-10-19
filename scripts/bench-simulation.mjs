#!/usr/bin/env node
// Complete-engine measurements. Run --help; reports are always fresh, ignored work/ files.
// No historical modules are spliced into the candidate, and no timing is a hardware-FPS claim.
import assert from 'node:assert/strict'
import { spawnSync, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync,
  readdirSync, realpathSync, renameSync, writeFileSync,
} from 'node:fs'
import { arch, cpus, platform, release } from 'node:os'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SELF = fileURLToPath(import.meta.url)
const ROOT = resolve(dirname(SELF), '..')
const VERSION = 1
const DEFAULT_TURNS = { mission18: 3600, mission6: 1200, march: 240, combat: 240, attack: 600, blocked: 600, dismantle: 600, bridge: 96, armageddon: 192, erosion: 64 }
const DEFAULT_SCENARIOS = 'mission18,mission6,march,combat,blocked,dismantle'
const TERRAIN_MISSIONS = { bridge: 2, armageddon: 18, erosion: 3 }
const TERRAIN_LIFECYCLES = { bridge: 62, armageddon: 128, erosion: 64 }
const TERRAIN_SCOPES = {
  bridge: 'Bridge retains authored Mission 2 actors, terrain and AI. Its untimed prelude advances the opening and ordinary Shaman worship until the original head creates bridge.turn=1. The measured window includes all 62 terrain visits and cleanup; no actors, terrain or spell resources are supplied.',
  armageddon: 'Armageddon retains authored Mission 18 initialization and uses one supplied Armageddon shot through public cast and normal projectile processing. Its untimed prelude ends at actual effect allocation, with terrainRemaining=128. The 192-turn default includes all 128 phase-0 turns (64 terrain reshapes) and 64 staging turns. Production Armageddon rebuilds its roster and suspends ordinary movement during deformation.',
  erosion: 'Erosion retains authored Mission 3 actors, terrain and AI. Its untimed prelude completes the opening and original Shaman travel and worship, stopping one turn before natural activation. The 64-turn default includes activation, all 63 live work visits and terminal retirement. No actors, resources or effect internals are supplied. Native height changes can leave the sampled compatibility surface and walk masks unchanged; their actual hashes, change counts and version increments are reported.',
}
const sha256 = value => createHash('sha256').update(value).digest('hex')
const readJson = path => JSON.parse(readFileSync(path, 'utf8'))
const json = value => `${JSON.stringify(value, null, 2)}\n`

// Hash the complete own-data graph, not JSON's incomplete Map/Set view. Reference
// numbers preserve aliases and cycles; Map/Set order, sparse arrays, -0, visible
// view bytes and shared backing buffers remain observable. Object keys are sorted
// so insertion history of otherwise equal records does not change the digest.
// Unreachable bytes outside typed views are not state. Unsupported data fails closed.
export function stateDigest(root) {
  const hash = createHash('sha256'), seen = new Map(), buffers = new Map()
  const token = value => {
    const bytes = Buffer.from(String(value))
    hash.update(`${bytes.length}:`); hash.update(bytes)
  }
  const properties = (value, omit = () => false) => {
    const keys = Reflect.ownKeys(value).filter(key => !omit(key))
    assert.ok(keys.every(key => typeof key === 'string'), 'symbol properties are not supported world data')
    if (!Array.isArray(value)) keys.sort()
    token(keys.length)
    for (const key of keys) {
      assert.equal(typeof key, 'string', 'symbol properties are not supported world data')
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      assert.ok('value' in descriptor, `accessor world property: ${key}`)
      token(key)
      token(`${+descriptor.enumerable}${+descriptor.configurable}${+descriptor.writable}`)
      visit(descriptor.value)
    }
  }
  const visit = value => {
    if (value === null) { token('null'); return }
    const type = typeof value
    token(type)
    if (type !== 'object') {
      assert.ok(['undefined', 'boolean', 'number', 'string', 'bigint'].includes(type), `unsupported world value: ${type}`)
      token(type === 'number' && Object.is(value, -0) ? '-0' : String(value))
      return
    }
    if (seen.has(value)) { token('reference'); token(seen.get(value)); return }
    token('definition'); token(seen.size); seen.set(value, seen.size)
    if (value instanceof Map) {
      assert.equal(Object.getPrototypeOf(value), Map.prototype)
      token('Map'); token(value.size)
      for (const [key, entry] of value) { visit(key); visit(entry) }
      properties(value)
    } else if (value instanceof Set) {
      assert.equal(Object.getPrototypeOf(value), Set.prototype)
      token('Set'); token(value.size)
      for (const entry of value) visit(entry)
      properties(value)
    } else if (ArrayBuffer.isView(value)) {
      const views = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array, DataView]
      assert.ok(views.some(type => Object.getPrototypeOf(value) === type.prototype), 'unsupported view prototype')
      token(value.constructor.name); token(value.byteOffset); token(value.byteLength)
      assert.equal(Object.getPrototypeOf(value.buffer), ArrayBuffer.prototype, 'shared/custom buffers are unsupported')
      assert.equal(Reflect.ownKeys(value.buffer).length, 0, 'custom buffer properties are unsupported')
      if (!buffers.has(value.buffer)) buffers.set(value.buffer, buffers.size)
      token(buffers.get(value.buffer))
      hash.update(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
      properties(value, key => typeof key === 'string' && /^(0|[1-9][0-9]*)$/.test(key) && Number(key) < value.length)
    } else if (value instanceof ArrayBuffer) {
      assert.equal(Object.getPrototypeOf(value), ArrayBuffer.prototype)
      if (!buffers.has(value)) buffers.set(value, buffers.size)
      token('ArrayBuffer'); token(buffers.get(value)); token(value.byteLength); hash.update(new Uint8Array(value)); properties(value)
    } else {
      const prototype = Object.getPrototypeOf(value)
      assert.ok(prototype === Object.prototype || prototype === null || (Array.isArray(value) && prototype === Array.prototype), 'unsupported world prototype')
      token(Array.isArray(value) ? 'Array' : prototype === null ? 'null-prototype' : 'Object')
      properties(value)
    }
  }
  visit(root)
  return hash.digest('hex')
}

export function summarize(values) {
  assert.ok(values.length && values.every(value => Number.isFinite(value) && value >= 0), 'invalid timing samples')
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2)
  return {
    count: values.length,
    median: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    p95: sorted[Math.ceil(sorted.length * .95) - 1],
    p99: sorted[Math.ceil(sorted.length * .99) - 1],
    min: sorted[0], max: sorted.at(-1),
  }
}

export function pairedOrder(index) {
  return index % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']
}

function integer(value, name, minimum, maximum) {
  assert.ok(/^[0-9]+$/.test(String(value)), `${name} must be an integer`)
  const number = Number(value)
  assert.ok(Number.isSafeInteger(number) && number >= minimum && number <= maximum, `${name} must be ${minimum}..${maximum}`)
  return number
}

export function workloadOptions(options) {
  const names = (options.scenarios ?? DEFAULT_SCENARIOS).split(',')
  assert.equal(new Set(names).size, names.length, 'duplicate scenarios')
  assert.ok(names.length && names.every(name => Object.hasOwn(DEFAULT_TURNS, name)), 'unknown scenario')
  const overrides = new Map()
  if (options.turns !== undefined) {
    if (/^[0-9]+$/.test(options.turns)) for (const name of names) overrides.set(name, integer(options.turns, 'turns', 1, 100000))
    else for (const assignment of options.turns.split(',')) {
      const [name, value, extra] = assignment.split('=')
      assert.ok(names.includes(name) && !overrides.has(name) && extra === undefined, `invalid turn override: ${assignment}`)
      overrides.set(name, integer(value, 'turns', 1, 100000))
    }
  }
  const people = integer(options.people ?? 200, 'people', 1, 400)
  const seed = options.seed === undefined ? null : integer(options.seed, 'seed', 0, 0xffffffff)
  return {
    version: VERSION,
    clockHz: 60,
    scenarios: names.map(name => ({ name, turns: overrides.get(name) ?? DEFAULT_TURNS[name], people: name.startsWith('mission') || Object.hasOwn(TERRAIN_SCOPES, name) ? null : people, seed })),
    scope: ['Natural missions retain authored initialization and AI. Synthetic stress uses an empty World state, flat test terrain, production entities/orders and complete turns, with campaign AI disabled. Default natural RNG is unmodified; --seed explicitly overrides both streams after world creation. Blocked terrain opens before turn 121.', ...names.filter(name => Object.hasOwn(TERRAIN_SCOPES, name)).map(name => TERRAIN_SCOPES[name])].join(' '),
  }
}

function git(tree, ...args) {
  return execFileSync('git', args, { cwd: tree, maxBuffer: 64 * 1024 * 1024 })
}

export function sourceFingerprint(input) {
  const tree = realpathSync(resolve(input))
  assert.equal(realpathSync(git(tree, 'rev-parse', '--show-toplevel').toString().trim()), tree, 'tree must be a Git worktree root')
  const files = []
  const scan = path => {
    const absolute = resolve(tree, path), info = lstatSync(absolute)
    assert.ok(!info.isSymbolicLink(), `source symlink is outside the benchmark input contract: ${path}`)
    if (info.isDirectory()) for (const name of readdirSync(absolute).sort()) scan(`${path}/${name}`)
    else { assert.ok(info.isFile(), `unsupported source input: ${path}`); files.push([path, sha256(readFileSync(absolute))]) }
  }
  scan('app')
  for (const path of ['package.json', 'package-lock.json', 'tsconfig.json']) if (existsSync(resolve(tree, path))) scan(path)
  return {
    tree,
    head: git(tree, 'rev-parse', 'HEAD').toString().trim(),
    trackedDiffSha256: sha256(git(tree, 'diff', 'HEAD', '--binary')),
    engineSha256: sha256(JSON.stringify(files)),
    files,
    scope: 'Every file under app/, including untracked inputs, plus package/lock/TypeScript configuration. Engine imports are local; npm packages are not part of these Node workloads.',
  }
}

function runtimeFingerprint() {
  const executable = realpathSync(process.execPath)
  return {
    executable, executableSha256: sha256(readFileSync(executable)),
    node: process.version, versions: process.versions, execArgv: process.execArgv,
    os: { platform: platform(), release: release(), arch: arch() },
    cpu: cpus()[0]?.model ?? 'unknown', logicalCpus: cpus().length,
    environment: Object.fromEntries(['NODE_OPTIONS', 'NODE_PATH', 'NODE_COMPILE_CACHE', 'NODE_V8_COVERAGE', 'TZ', 'LANG', 'LC_ALL'].map(key => [key, process.env[key] ?? ''])),
  }
}

function assertRuntime(mode) {
  for (const name of ['NODE_OPTIONS', 'NODE_COMPILE_CACHE', 'NODE_V8_COVERAGE'])
    assert.ok(!process.env[name], `${name} must be empty for attributable benchmark inputs`)
  assert.ok(!process.execArgv.some(arg => /^(--(import|loader|experimental-loader|require)(=|$)|-r$)/.test(arg)), 'custom loaders are outside the source fingerprint')
  if (mode === 'compare') assert.ok(!process.execArgv.some(arg => /prof|inspect|trace|coverage/.test(arg)), 'run profilers in sample mode, separately from comparative measurements')
}

async function loadEngine(tree) {
  const load = path => import(pathToFileURL(resolve(tree, 'app', path)).href)
  const [model, state, clock, building] = await Promise.all([load('model.ts'), load('world-state.ts'), load('game-clock.ts'), load('live-building-entry.ts')])
  return { ...model, createWorldState: state.createWorldState, advanceGame: clock.advanceGame, dismantleBuilding: building.dismantleBuilding }
}

function terrainSignatures(world) {
  const masks = createHash('sha256')
  for (const mask of world.land.walkMasks) masks.update(mask)
  return { heights: sha256(world.land.heights), walkMasks: masks.digest('hex'), surface: sha256(new Float64Array(world.terrain)) }
}

function preludeUntil(engine, setup, driver, ready, limit, label, observeTurn = () => {}) {
  for (let index = 0; !ready() && index < limit; index++) {
    const previous = setup.world.turn
    advance(engine, setup, driver)
    assert.equal(setup.world.turn, previous + 1, `${label}: prelude must execute an ordinary turn`)
    observeTurn()
  }
  assert.ok(ready(), `${label}: prelude did not finish within ${limit} turns`)
}

function prepareErosionScenario(engine, setup, spec, driver) {
  const world = setup.world, createdTurn = world.turn
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  const head = world.shrines.find(shrine => shrine.id === 101 && shrine.kind === 'erosionEffect')
  assert.ok(shaman && head, 'erosion: original Mission 3 Shaman and head are required')
  assert.deepEqual({ x: shaman.x, z: shaman.z }, { x: 35, z: 81 })
  assert.deepEqual({ x: head.x, z: head.z }, { x: -7, z: 115 })
  assert.deepEqual([head.required, head.target, head.remaining, head.uses, head.forced], [1, 40, 1, 0, false])
  assert.equal(head.effectTargets.length, 1, 'erosion: one authored controller is required')
  const position = { x: shaman.x, z: shaman.z }
  let pathSearches = 0, pathObserved = false
  const observePath = () => {
    assert.equal(world.units.find(unit => unit.id === shaman.id), shaman, 'erosion: original Shaman identity must survive the prelude')
    assert.ok(shaman.hp > 0, 'erosion: original Shaman must survive ordinary worship')
    assert.equal(head.uses, 0, 'erosion: natural activation must remain inside the measured window')
    assert.equal(world.effects.some(effect => effect.erosion), false, 'erosion: unexpected prelude effect')
    pathSearches += world.pathfinding.state.searches // Native counters reset at each turn.
    if (shaman.path.length || shaman.native?.speed > 0) pathObserved = true
  }
  const openingFinished = () => world.levelStart.every(site =>
    site.phase === 4 && !site.wave && !site.carriers.length &&
    site.stoneTurns.every(turn => turn === null || world.turn - turn >= 20))
  preludeUntil(engine, setup, driver, openingFinished, 256, 'erosion opening', observePath)
  engine.select(world, 'shaman')
  assert.deepEqual(world.selected, [shaman.id])
  const searchesBeforeOrder = world.pathfinding.state.searches, orderTurn = world.turn
  assert.equal(engine.command(world, head), true, 'erosion: ordinary worship order must be accepted')
  pathSearches += (world.pathfinding.state.searches - searchesBeforeOrder) >>> 0
  if (shaman.path.length || shaman.native?.speed > 0) pathObserved = true
  // Observe the real penultimate work value; do not force activation or move actors.
  const ready = () => !((world.turn + 1) & 3) && !head.reset && head.enabled &&
    head.followers >= head.required && head.work === (head.target - 1) * head.required ** 2
  preludeUntil(engine, setup, driver, ready, 2400 - (world.turn - createdTurn), 'erosion travel and worship', observePath)
  assert.equal(head.uses, 0)
  assert.equal(head.forced, false)
  assert.equal(world.effects.some(effect => effect.erosion), false)
  const moved = Math.hypot(shaman.x - position.x, shaman.z - position.z) > .01
  assert.ok(pathObserved && pathSearches > 0 && moved, 'erosion: original Shaman must travel through ordinary pathfinding')
  setup.terrain = {
    name: spec.name, effect: null, head, previous: terrainSignatures(world), before: null,
    prelude: {
      mission: 3, turns: world.turn - createdTurn, orderTurn, source: TERRAIN_SCOPES.erosion,
      suppliedShots: [], shamanId: shaman.id, shamanPathObserved: pathObserved, shamanMoved: moved, pathSearches,
      headId: head.id, headUsesBeforeActivation: head.uses, workBeforeActivation: head.work,
      followersBeforeActivation: head.followers, effectTarget: { ...head.effectTargets[0] },
    },
  }
}

function prepareTerrainScenario(engine, setup, spec, driver) {
  const world = setup.world, createdTurn = world.turn
  const openingFinished = () => world.levelStart.every(site =>
    site.phase === 4 && !site.wave && !site.carriers.length &&
    site.stoneTurns.every(turn => turn === null || world.turn - turn >= 20))
  preludeUntil(engine, setup, driver, openingFinished, 256, `${spec.name} opening`)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  assert.ok(shaman && shaman.hp > 0, `${spec.name}: authored Shaman must be alive`)
  const position = { x: shaman.x, z: shaman.z }
  let effect, head = null, pathObserved = false, pathSearches = 0
  if (spec.name === 'bridge') {
    preludeUntil(engine, setup, driver, () => world.turn >= 122, 122, 'bridge opening wait')
    head = world.shrines.find(shrine => shrine.kind === 'bridgeEffect')
    assert.ok(head && head.uses === 0, 'bridge: original unused head is required')
    engine.select(world, 'shaman')
    const searchesBeforeOrder = world.pathfinding.state.searches
    assert.equal(engine.command(world, head), true, 'bridge: ordinary worship order must be accepted')
    pathSearches = (world.pathfinding.state.searches - searchesBeforeOrder) >>> 0
    pathObserved = shaman.path.length > 0 || shaman.native?.speed > 0
    const observePath = () => {
      if (shaman.path.length || shaman.native?.speed > 0) pathObserved = true
      pathSearches += world.pathfinding.state.searches // Native counters reset at each turn.
    }
    preludeUntil(engine, setup, driver, () => {
      effect = world.effects.find(item => item.bridge)
      return !!effect
    }, 1000, 'bridge worship', observePath)
    assert.equal(head.uses, 1, 'bridge: ordinary worship must activate the head exactly once')
    assert.equal(effect.bridge.turn, 1, 'bridge: prelude must stop at the authored initialization visit')
    assert.equal(world.stats.bridges, 1, 'bridge: exactly one authored bridge must be allocated')
    assert.ok(pathObserved && Math.hypot(shaman.x - position.x, shaman.z - position.z) > .01, 'bridge: original Shaman must travel through ordinary pathfinding')
  } else {
    world.shots.armageddon = 1
    engine.select(world, 'shaman')
    assert.equal(engine.cast(world, 'armageddon', { x: shaman.x + 1, z: shaman.z }), true, 'armageddon: public cast must accept the supplied shot')
    preludeUntil(engine, setup, driver, () => {
      effect = world.effects.find(item => item.armageddon)
      return !!effect
    }, 180, 'armageddon projectile')
    assert.equal(world.shots.armageddon, 0, 'armageddon: the cast must consume its supplied shot')
    assert.equal(effect.armageddon.phase, 0)
    assert.equal(effect.armageddon.terrainRemaining, 128, 'armageddon: no deformation visit may occur in the prelude')
  }
  const signatures = terrainSignatures(world)
  const arenaCenter = effect.armageddon ? engine.nativePosition(world, effect) : null
  setup.terrain = {
    name: spec.name, effect, head, previous: signatures, before: null,
    arenaCenterIndex: arenaCenter ? ((arenaCenter.y & 65535) >>> 9) * 128 + ((arenaCenter.x & 65535) >>> 9) : null,
    prelude: {
      mission: TERRAIN_MISSIONS[spec.name],
      turns: world.turn - createdTurn,
      source: TERRAIN_SCOPES[spec.name],
      suppliedShots: spec.name === 'armageddon' ? [{ spell: 'armageddon', count: 1 }] : [],
      shamanId: shaman.id, shamanPathObserved: pathObserved,
      shamanMoved: Math.hypot(shaman.x - position.x, shaman.z - position.z) > .01,
      pathSearches,
    },
  }
}

function fixture(engine, spec, driver = 'tick') {
  const natural = spec.name.startsWith('mission')
  const terrain = Object.hasOwn(TERRAIN_SCOPES, spec.name)
  const world = natural || terrain ? engine.createWorld(terrain ? TERRAIN_MISSIONS[spec.name] : Number(spec.name.slice(7))) : engine.createWorldState(1)
  if (spec.seed !== null) { world.randomState = spec.seed; world.cosmeticRandom.randomState = spec.seed }
  const clock = { animationTime: 0, animationFrame: 0 }
  const setup = { world, clock, target: null, actors: [], positions: new Map(), startTurn: world.turn }
  if (terrain) {
    if (spec.name === 'erosion') prepareErosionScenario(engine, setup, spec, driver)
    else prepareTerrainScenario(engine, setup, spec, driver)
    for (const unit of world.units) {
      setup.actors.push(unit.id)
      setup.positions.set(unit.id, { x: unit.x, z: unit.z })
    }
    setup.startTurn = world.turn
    return setup
  }
  if (natural) return setup
  world.manaWorld.gameFlags = 96
  world.terrain.fill(spec.name === 'blocked' ? 0 : 3)
  if (spec.name === 'blocked') for (let z = -9; z <= 9; z++) for (let x = -29; x <= 29; x++)
    if (x <= -10 || x >= 10) world.terrain[(z + 48) * engine.GRID + x + 48] = 3
  world.terrainVersion++
  const orders = []
  for (let i = 0; i < spec.people; i++) {
    const point = spec.name === 'march' ? { x: -35 + (i % 20) * .25, z: 4 + Math.floor(i / 20) * .25 }
      : spec.name === 'combat' ? { x: -30 + (i % 20) * 3, z: -15 + Math.floor(i / 20) * 3 }
        : spec.name === 'blocked' ? { x: -20 + (i % 20) / 5, z: Math.floor(i / 20) / 5 }
          : { x: (i % 20) / 5, z: 20 + Math.floor(i / 20) / 5 }
    const unit = engine.addUnit(world, 'blue', ['march', 'dismantle'].includes(spec.name) ? 'brave' : 'warrior', point)
    setup.actors.push(unit.id); setup.positions.set(unit.id, point)
    if (spec.name === 'combat') engine.addUnit(world, 'red', 'warrior', { x: point.x + .7, z: point.z })
  }
  world.selected = [...setup.actors]
  if (spec.name === 'march' || spec.name === 'combat') orders.push([{ x: 35, z: spec.name === 'march' ? 4 : 0 }])
  else {
    setup.target = engine.addBuilding(world, spec.name === 'dismantle' ? 'blue' : 'red', 'hut', { x: spec.name === 'blocked' ? 20 : 0, z: 0 }, true)
    if (spec.name === 'dismantle') {
      engine.dismantleBuilding(world, setup.target)
      orders.push([{ x: 0, z: 12 }, { ctrlKey: true }])
    }
    orders.push([setup.target, { ctrlKey: true }], [spec.name === 'blocked' ? { x: 20, z: 6 } : { x: 16, z: 12 }])
  }
  for (const args of orders) assert.equal(engine.command(world, ...args), true, `${spec.name}: ordinary command was rejected`)
  assert.equal(world.selected.length, spec.people, 'selected army size')
  return setup
}

function beforeTurn(setup, spec, index) {
  if (setup.terrain) {
    const { effect } = setup.terrain
    setup.terrain.before = {
      active: !!effect && setup.world.effects.includes(effect),
      bridgeTurn: effect?.bridge?.turn,
      phase: effect?.armageddon?.phase,
      remaining: effect?.armageddon?.terrainRemaining,
      erosionRemaining: effect?.erosion?.remaining,
      terrainVersion: setup.world.terrainVersion,
      landVersion: setup.world.landVersion,
    }
  }
  if (spec.name !== 'blocked' || index !== 120) return
  assert.ok(setup.world.units.some(unit => unit.native?.state === 33), 'blocked workload must reach route recovery before terrain opens')
  setup.world.terrain.fill(3); setup.world.terrainVersion++
}

function advance(engine, setup, driver) {
  if (driver === 'tick') engine.tick(setup.world, 1 / 12)
  else for (let frame = 0; frame < 5; frame++) engine.advanceGame(setup.world, setup.clock, 1 / 60)
}

function witness(setup) {
  const result = {
    initialUnits: setup.world.units.length, minimumUnits: setup.world.units.length, maximumUnits: setup.world.units.length,
    personSnapshots: 0, movingSnapshots: 0, fightingSnapshots: 0, blockedSnapshots: 0,
    observation: 'Counts sum post-turn population and flags, not actual simulation dispatches.',
    peakFights: 0, peakFormations: 0, pathAttempts: 0, peakBuildings: setup.world.buildings.length,
    initialHitPoints: setup.world.units.reduce((sum, unit) => sum + unit.hp, 0), minimumHitPoints: Infinity,
  }
  if (setup.terrain) result.terrain = {
    prelude: setup.terrain.prelude,
    initialHeightSha256: setup.terrain.previous.heights,
    initialWalkMaskSha256: setup.terrain.previous.walkMasks,
    initialSurfaceSha256: setup.terrain.previous.surface,
    surfaceSampleCount: setup.world.terrain.length,
    initialTerrainVersion: setup.world.terrainVersion, initialLandVersion: setup.world.landVersion,
    heightChangedTurns: 0, walkMaskChangedTurns: 0, surfaceChangedTurns: 0,
    terrainVersionChangedTurns: 0, landVersionChangedTurns: 0,
    terrainVersionIncrements: 0, landVersionIncrements: 0,
    bridgeTerrainVisits: 0, armageddonPhase0Visits: 0, armageddonDeformationVisits: 0,
    erosionActivations: 0, erosionWorkVisits: 0, erosionRetirementVisits: 0,
    erosionActivationAge: null, erosionInitialRemaining: null, erosionRemaining: [],
    maximumStagedParticipants: 0,
    observation: 'Post-turn hashes cover native height and walk-mask bytes and every compatibility-grid value serialized as Float64 bytes. Height changes can leave walk masks and sampled surface values unchanged. Version increments report actual world state; they and controller progress are not instrumented kernel-call counts. Full production terrain processing and surface resampling stay inside timed ticks; these hashes, copied sample values and counters are outside them.',
  }
  return result
}

function observe(setup, result) {
  const world = setup.world
  result.minimumUnits = Math.min(result.minimumUnits, world.units.length)
  result.maximumUnits = Math.max(result.maximumUnits, world.units.length)
  result.personSnapshots += world.units.length
  result.peakFights = Math.max(result.peakFights, world.fights.length)
  result.peakFormations = Math.max(result.peakFormations, world.marching.length)
  result.peakBuildings = Math.max(result.peakBuildings, world.buildings.length)
  result.pathAttempts += world.pathfinding.solver.attempts
  let hitPoints = 0
  for (const unit of world.units) {
    hitPoints += unit.hp
    if (unit.path.length || unit.flight || unit.fight || unit.native?.speed > 0) result.movingSnapshots++
    if (unit.fight) result.fightingSnapshots++
    if (unit.native?.state === 33) result.blockedSnapshots++
  }
  result.minimumHitPoints = Math.min(result.minimumHitPoints, hitPoints)
  if (setup.terrain) {
    const terrain = setup.terrain, activity = result.terrain, { before } = terrain
    let { effect } = terrain
    const signatures = terrainSignatures(world)
    if (signatures.heights !== terrain.previous.heights) activity.heightChangedTurns++
    if (signatures.walkMasks !== terrain.previous.walkMasks) activity.walkMaskChangedTurns++
    if (signatures.surface !== terrain.previous.surface) activity.surfaceChangedTurns++
    assert.equal(world.terrain.length, activity.surfaceSampleCount, 'surface sample count must stay fixed')
    for (const version of ['terrainVersion', 'landVersion']) {
      const increment = world[version] - before[version]
      integer(increment, `${terrain.name} ${version} increment`, 0, Number.MAX_SAFE_INTEGER)
      if (increment) activity[`${version}ChangedTurns`]++
      activity[`${version}Increments`] += increment
    }
    terrain.previous = signatures
    if (terrain.name === 'erosion') {
      const live = world.effects.filter(item => item.erosion)
      if (!effect) {
        assert.equal(world.turn, setup.startTurn + 1, 'erosion: activation must occur in the first measured turn')
        assert.equal(live.length, 1, 'erosion: the head must create exactly its one authored effect')
        effect = terrain.effect = live[0]
        assert.equal(terrain.head.uses, 1)
        assert.equal(terrain.head.remaining, 0)
        assert.equal(terrain.head.active, false)
        assert.equal(effect.age, 0, 'erosion: activation owns an immediate work visit')
        assert.equal(effect.erosion.remaining, 63)
        activity.erosionActivations++
        activity.erosionWorkVisits++
        activity.erosionActivationAge = effect.age
        activity.erosionInitialRemaining = effect.erosion.remaining
      } else if (before.active) {
        assert.equal(effect.erosion.remaining, before.erosionRemaining - 1, 'erosion: each scheduled visit must advance once')
        if (before.erosionRemaining > 1) activity.erosionWorkVisits++
        else activity.erosionRetirementVisits++
      }
      if (before.active || activity.erosionRemaining.length === 0) activity.erosionRemaining.push(effect.erosion.remaining)
      assert.equal(live.length, effect.erosion.remaining > 0 ? 1 : 0, 'erosion: exactly the original live controller may remain')
      if (live.length) assert.equal(live[0], effect, 'erosion: controller identity must survive')
    }
    if (before.active && effect.bridge) {
      assert.equal(effect.bridge.turn, before.bridgeTurn + 1, 'bridge: every scheduled effect visit must advance exactly once')
      if (before.bridgeTurn >= 1 && before.bridgeTurn < 63) activity.bridgeTerrainVisits++
    }
    if (before.active && before.phase === 0) {
      assert.equal(effect.armageddon.terrainRemaining, before.remaining - 1, 'armageddon: every phase-0 visit must advance exactly once')
      activity.armageddonPhase0Visits++
      if (before.remaining >= 1 && before.remaining <= 64) activity.armageddonDeformationVisits++
    }
    if (effect.armageddon) activity.maximumStagedParticipants = Math.max(activity.maximumStagedParticipants, effect.armageddon.staged.reduce((sum, count) => sum + count, 0))
  }
}

export function validateTerrainWitness(spec, result, turns) {
  if (!Object.hasOwn(TERRAIN_SCOPES, spec.name)) return
  const activity = result?.terrain
  assert.ok(activity, `${spec.name}: missing terrain activity witness`)
  const validateCount = (value, label, minimum, maximum) => {
    assert.equal(typeof value, 'number', `${label}: numeric witness required`)
    return integer(value, label, minimum, maximum)
  }
  for (const [label, count] of [['Height', 'heightChangedTurns'], ['WalkMask', 'walkMaskChangedTurns'], ['Surface', 'surfaceChangedTurns']]) {
    for (const prefix of ['initial', 'final'])
      assert.ok(/^[0-9a-f]{64}$/.test(activity[`${prefix}${label}Sha256`]), `${spec.name}: invalid terrain or surface digest`)
    validateCount(activity[count], `${spec.name} ${count}`, 0, turns)
    if (!activity[count])
      assert.equal(activity[`final${label}Sha256`], activity[`initial${label}Sha256`], `${spec.name}: unchanged ${label} values must retain their digest`)
  }
  validateCount(activity.surfaceSampleCount, `${spec.name} surface samples`, 1, Number.MAX_SAFE_INTEGER)
  assert.equal(activity.surfaceValuesUnchanged, activity.surfaceChangedTurns === 0, `${spec.name}: unchanged-surface disclosure must match observed values`)
  for (const [key, label] of [['terrainVersion', 'TerrainVersion'], ['landVersion', 'LandVersion']]) {
    for (const prefix of ['initial', 'final']) validateCount(activity[`${prefix}${label}`], `${spec.name} ${prefix}${label}`, 0, Number.MAX_SAFE_INTEGER)
    const increments = activity[`${key}Increments`], changedTurns = activity[`${key}ChangedTurns`]
    validateCount(increments, `${spec.name} ${key} increments`, 0, Number.MAX_SAFE_INTEGER)
    validateCount(changedTurns, `${spec.name} ${key} changed turns`, 0, turns)
    assert.ok(increments >= changedTurns && (!!increments === !!changedTurns), `${spec.name}: version increments must agree with changed turns`)
    assert.equal(activity[`final${label}`], activity[`initial${label}`] + increments, `${spec.name}: version increment total must match its endpoints`)
  }
  if (spec.name === 'bridge' || spec.name === 'erosion') {
    assert.equal(activity.prelude.shamanPathObserved, true, `${spec.name}: prelude must include real Shaman pathfinding`)
    assert.equal(activity.prelude.shamanMoved, true, `${spec.name}: original Shaman must actually travel`)
    validateCount(activity.prelude.pathSearches, `${spec.name} prelude path searches`, 1, Number.MAX_SAFE_INTEGER)
  }
  if (spec.name === 'bridge') {
    assert.equal(activity.bridgeTerrainVisits, Math.min(turns, 62), 'bridge: incomplete terrain lifecycle')
    assert.equal(activity.headUses, 1, 'bridge: original head must activate exactly once')
    assert.equal(activity.bridges, 1, 'bridge: exactly one bridge must be allocated')
    if (turns >= 62) {
      assert.equal(activity.finalBridgeTurn, 63)
      assert.equal(activity.effectRetired, true, 'bridge: completed effect must retire')
    }
  } else if (spec.name === 'armageddon') {
    assert.equal(activity.armageddonPhase0Visits, Math.min(turns, 128), 'armageddon: incomplete phase-0 lifecycle')
    assert.equal(activity.armageddonDeformationVisits, Math.max(0, Math.min(turns - 64, 64)), 'armageddon: incomplete deformation lifecycle')
    validateCount(activity.finalArmageddonPhase, 'armageddon phase', 0, 2)
    validateCount(activity.maximumStagedParticipants, 'armageddon staged participants', 0, Number.MAX_SAFE_INTEGER)
    assert.equal(activity.finalTerrainRemaining, Math.max(128 - turns, 0))
    if (turns < 128) assert.equal(activity.finalArmageddonPhase, 0)
    if (turns >= 128) {
      assert.ok(activity.finalArmageddonPhase >= 1 && activity.maximumStagedParticipants > 0, 'armageddon: terrain completion must stage the real roster')
      assert.equal(activity.arenaCenterHeight, 50)
    }
  } else {
    assert.equal(activity.erosionActivations, 1, 'erosion: exactly one natural activation is required')
    assert.equal(activity.erosionActivationAge, 0)
    assert.equal(activity.erosionInitialRemaining, 63)
    assert.equal(activity.erosionWorkVisits, Math.min(turns, 63), 'erosion: incomplete work lifecycle')
    assert.equal(activity.erosionRetirementVisits, turns >= 64 ? 1 : 0, 'erosion: incorrect retirement lifecycle')
    assert.deepEqual(activity.erosionRemaining, Array.from({ length: Math.min(turns, 64) }, (_, index) => 63 - index), 'erosion: controller sequence must include every visit')
    assert.equal(activity.finalErosionRemaining, Math.max(64 - turns, 0))
    assert.equal(activity.remainingErosionEffects, turns >= 64 ? 0 : 1)
    assert.equal(activity.effectRetired, turns >= 64)
    assert.equal(activity.headUses, 1, 'erosion: the original one-use reward must not replay')
    assert.equal(activity.headRemaining, 0)
    assert.equal(activity.prelude.mission, 3)
    assert.equal(activity.prelude.headId, 101)
    assert.equal(activity.prelude.headUsesBeforeActivation, 0)
    assert.equal(activity.prelude.workBeforeActivation, 39)
    validateCount(activity.prelude.followersBeforeActivation, 'erosion worship followers', 1, Number.MAX_SAFE_INTEGER)
    assert.deepEqual(activity.prelude.suppliedShots, [])
    validateCount(activity.prelude.turns, 'erosion prelude turns', 1, 2400)
  }
  if (turns >= TERRAIN_LIFECYCLES[spec.name]) {
    assert.ok(activity.heightChangedTurns > 0, `${spec.name}: real terrain heights must change`)
    if (spec.name === 'erosion') assert.ok(activity.terrainVersionIncrements > 0, 'erosion: native deformation must reach production terrain refresh')
  }
}

function finishWitness(setup, spec, result, turns) {
  const world = setup.world
  assert.equal(world.turn, setup.startTurn + turns, 'workload must execute every requested turn')
  const moved = world.units.filter(unit => {
    const initial = setup.positions.get(unit.id)
    return initial && Math.hypot(unit.x - initial.x, unit.z - initial.z) > .01
  }).length
  Object.assign(result, {
    finalUnits: world.units.length, finalBuildings: world.buildings.length, finalStatus: world.status,
    finalTurn: world.turn, movedActors: moved, selected: world.selected.length,
    orders: world.buildingOrders.active, rng: world.randomState, cosmeticRng: world.cosmeticRandom.randomState,
    targetHp: setup.target?.hp ?? null, dismantled: setup.target?.dismantled ?? false,
    tribes: Object.fromEntries(['blue', 'red', 'yellow', 'green', 'wild'].map(team => [team, world.units.filter(unit => unit.team === team).length])),
  })
  if (spec.name === 'march' && turns >= 12) assert.ok(result.movingSnapshots > 0 && moved > 0, 'march workload must actually move')
  if (spec.name === 'combat' && turns >= 24) assert.ok(result.peakFights > 0, 'combat workload must actually fight')
  if (spec.name === 'combat' && turns >= 120) assert.ok(result.minimumHitPoints < result.initialHitPoints, 'combat workload must deal damage')
  if (spec.name === 'blocked' && turns >= 120) assert.ok(result.blockedSnapshots > 0, 'blocked workload must exercise recovery')
  if (['attack', 'blocked', 'dismantle'].includes(spec.name) && turns >= 600) assert.equal(setup.target.hp, 0, 'queued workload must finish the building task')
  if (spec.name === 'dismantle' && turns >= 600) assert.equal(setup.target.dismantled, true)
  if (setup.terrain) {
    const { effect, head, previous } = setup.terrain
    Object.assign(result.terrain, {
      finalHeightSha256: previous.heights, finalWalkMaskSha256: previous.walkMasks, finalSurfaceSha256: previous.surface,
      finalTerrainVersion: world.terrainVersion, finalLandVersion: world.landVersion,
      surfaceValuesUnchanged: result.terrain.surfaceChangedTurns === 0,
      effectRetired: !world.effects.includes(effect),
    })
    if (effect.bridge) Object.assign(result.terrain, { finalBridgeTurn: effect.bridge.turn, headUses: head.uses, bridges: world.stats.bridges })
    else if (effect.armageddon) {
      Object.assign(result.terrain, {
        finalArmageddonPhase: effect.armageddon.phase, finalTerrainRemaining: effect.armageddon.terrainRemaining,
        arenaCenterHeight: world.land.heights[setup.terrain.arenaCenterIndex],
        participants: effect.armageddon.participants.map(ids => ids.length), staged: [...effect.armageddon.staged],
      })
    } else Object.assign(result.terrain, { finalErosionRemaining: effect.erosion.remaining, remainingErosionEffects: world.effects.filter(item => item.erosion).length, headUses: head.uses, headRemaining: head.remaining })
    validateTerrainWitness(spec, result, turns)
  }
  return result
}

function run(engine, spec, { driver = 'tick', timed = true, turns = spec.turns } = {}) {
  const setup = fixture(engine, spec, driver), activity = witness(setup), samples = new Float64Array(turns)
  const memoryBefore = process.memoryUsage(), cpuBefore = process.cpuUsage(), start = performance.now()
  for (let index = 0; index < turns; index++) {
    beforeTurn(setup, spec, index)
    if (timed) {
      const begin = performance.now(); advance(engine, setup, driver); samples[index] = performance.now() - begin
    } else advance(engine, setup, driver)
    observe(setup, activity)
  }
  const loopMs = performance.now() - start, cpu = process.cpuUsage(cpuBefore), memoryAfter = process.memoryUsage()
  const result = {
    witness: finishWitness(setup, spec, activity, turns),
    rawTurnMs: timed ? [...samples] : [],
    engineMs: timed ? samples.reduce((sum, value) => sum + value, 0) : null,
    loopMs, processCpuMsIncludingWitnesses: { user: cpu.user / 1000, system: cpu.system / 1000 },
    memoryBefore, memoryAfter, processLifetimeMaximumRssKiB: process.resourceUsage().maxRSS,
  }
  if (timed) result.turnMs = summarize(result.rawTurnMs)
  return { setup, result }
}

function verifyWorlds(left, right, label) {
  const before = stateDigest({ world: left.world, clock: left.clock })
  const after = stateDigest({ world: right.world, clock: right.clock })
  if (before !== after) {
    // Structural diagnostics supplement the stricter insertion-order/alias hash.
    assert.deepEqual(right.world, left.world, `${label}: complete world differs`)
    assert.fail(`${label}: graph aliases, insertion order, property descriptors or clock differ (${before} != ${after})`)
  }
  return before
}

async function verify(report, options) {
  const engines = [await loadEngine(report.sources.baseline.tree), await loadEngine(report.sources.candidate.tree)]
  report.verification = { every: integer(options['verify-every'] ?? 120, 'verify-every', 1, 100000), clockTurns: integer(options['clock-turns'] ?? 240, 'clock-turns', 1, 100000), valuesEveryTurn: true }
  report.results = []
  for (const spec of report.workload.scenarios) for (const driver of ['tick', 'clock']) {
    const turns = driver === 'tick' ? spec.turns : Math.min(spec.turns, report.verification.clockTurns)
    const setups = engines.map(engine => fixture(engine, spec, driver)), activities = setups.map(witness)
    const checkpoints = [{ turn: 0, sha256: verifyWorlds(...setups, `${spec.name}/${driver}/initial`) }]
    for (let index = 0; index < turns; index++) {
      for (let side = 0; side < 2; side++) { beforeTurn(setups[side], spec, index); advance(engines[side], setups[side], driver); observe(setups[side], activities[side]) }
      assert.deepEqual(setups[1].world, setups[0].world, `${spec.name}/${driver}/${index + 1}: complete world values`)
      assert.deepEqual(setups[1].clock, setups[0].clock, `${spec.name}/${driver}/${index + 1}: clock values`)
      if ((index + 1) % report.verification.every === 0 || index + 1 === turns)
        checkpoints.push({ turn: index + 1, sha256: verifyWorlds(...setups, `${spec.name}/${driver}/${index + 1}`) })
    }
    const witnesses = setups.map((setup, index) => finishWitness(setup, spec, activities[index], turns))
    assert.deepEqual(witnesses[1], witnesses[0], 'all observed workload activity must agree')
    report.results.push({ scenario: spec.name, driver, turns, checkpoints, witness: witnesses[0] })
    console.error(`Verified ${spec.name}: ${turns} ${driver} turns, ${checkpoints.length} complete graph checkpoints`)
  }
  report.claim = 'Baseline and candidate world/clock values agree after every measured-window turn. Listed complete graph checkpoints additionally compare Map/Set order, property descriptors, aliases and cycles. Both direct ticks and the production 60-Hz game clock are checked separately; this does not assert tick and advanceGame produce identical states. Terrain-scenario preludes run independently with each selected driver; their final setup graphs are compared, while intermediate prelude states are outside the per-turn proof.'
}

async function sample(report) {
  const engine = await loadEngine(report.source.tree)
  report.samples = []
  for (const spec of report.workload.scenarios) {
    for (let repeat = 0; repeat < report.policy.warmups; repeat++)
      run(engine, spec, { timed: false, turns: Math.min(spec.turns, report.policy.warmupTurns) })
    const { setup, result } = run(engine, spec)
    result.finalStateSha256 = stateDigest({ world: setup.world, clock: setup.clock })
    result.scenario = spec.name
    report.samples.push(result)
    console.error(`Sampled ${spec.name}: ${result.engineMs.toFixed(3)} ms for ${spec.turns} complete turns`)
  }
  report.claim = 'A single-source diagnostic sample, not a before/after comparison. Engine time sums direct tick calls only. Setup, warmup, hashing, witnesses and scripted between-turn terrain edits are excluded. Complete production terrain processing and surface resampling inside ticks are included. Process CPU/loop time include loop bookkeeping and witnesses. Heap changes are net retained usage, not allocated bytes. No renderer, GPU or hardware-FPS claim.'
}

function withinWork(path) {
  const absolute = resolve(path), work = resolve(ROOT, 'work'), local = relative(work, absolute)
  assert.ok(local && !local.startsWith(`..${sep}`) && local !== '..' && !isAbsolute(local), 'output must be below this checkout\'s work/')
  mkdirSync(dirname(absolute), { recursive: true })
  const actual = relative(realpathSync(ROOT), realpathSync(dirname(absolute)))
  assert.ok(actual === 'work' || actual.startsWith(`work${sep}`), 'output parent escaped work/ through a symlink')
  assert.equal(git(ROOT, 'ls-files', '--', relative(ROOT, absolute)).toString().trim(), '', 'report path is tracked')
  git(ROOT, 'check-ignore', '-q', '--', relative(ROOT, absolute))
  return absolute
}

function writeNew(path, value) { writeFileSync(path, json(value), { flag: 'wx' }) }

function updateReport(path, report) {
  const temporary = `${path}.updating`
  writeNew(temporary, report); renameSync(temporary, path)
}

function sameSources(report) {
  const entries = report.sources ? Object.entries(report.sources) : [['sample', report.source]]
  for (const [side, expected] of entries) assert.deepEqual(sourceFingerprint(expected.tree), expected, `${side}: source drift invalidates this run`)
  assert.equal(sha256(readFileSync(SELF)), report.harnessSha256, 'harness changed during the run')
}

async function worker(requestPath) {
  const request = readJson(requestPath), output = withinWork(request.output)
  assert.equal(request.version, VERSION)
  assert.equal(request.harnessSha256, sha256(readFileSync(SELF)), 'worker harness differs')
  assert.deepEqual(sourceFingerprint(request.source.tree), request.source, 'worker source changed before launch')
  assert.deepEqual(runtimeFingerprint(), request.runtime, 'worker runtime differs')
  const report = { source: request.source, harnessSha256: request.harnessSha256, workload: request.workload, policy: request.policy }
  await sample(report, {})
  sameSources(report)
  writeNew(output, { version: VERSION, status: 'passed', source: report.source, runtime: request.runtime, harnessSha256: request.harnessSha256, workload: request.workload, samples: report.samples })
}

export function validateVerification(proof, report) {
  assert.equal(proof.mode, 'verify', 'comparison requires a verification report')
  assert.equal(proof.status, 'passed', 'verification did not pass')
  assert.equal(proof.verification?.valuesEveryTurn, true, 'verification must compare world values after every turn')
  for (const key of ['version', 'harnessSha256', 'sources', 'runtime', 'workload']) assert.deepEqual(proof[key], report[key], `verification ${key} mismatch`)
  assert.equal(proof.results.length, report.workload.scenarios.length * 2, 'unexpected verification results')
  integer(proof.verification.clockTurns, 'verified clock turns', 1, 100000)
  for (const spec of report.workload.scenarios) {
    const rows = proof.results.filter(row => row.scenario === spec.name)
    assert.equal(rows.length, 2, `missing or duplicated verification: ${spec.name}`)
    for (const driver of ['tick', 'clock']) {
      const row = rows.find(value => value.driver === driver)
      assert.ok(row && row.checkpoints.length >= 2, `missing ${driver} verification: ${spec.name}`)
      const turns = driver === 'tick' ? spec.turns : Math.min(spec.turns, proof.verification.clockTurns)
      assert.equal(row.turns, turns)
      assert.equal(row.checkpoints[0].turn, 0, 'missing initial state comparison')
      row.checkpoints.forEach((checkpoint, index) => {
        assert.ok(/^[0-9a-f]{64}$/.test(checkpoint.sha256), 'invalid state digest')
        if (index) assert.ok(Number.isInteger(checkpoint.turn) && checkpoint.turn > row.checkpoints[index - 1].turn, 'unordered verification checkpoints')
      })
      assert.equal(row.checkpoints.at(-1).turn, turns)
      if (Object.hasOwn(TERRAIN_SCOPES, spec.name)) {
        assert.ok(turns >= TERRAIN_LIFECYCLES[spec.name], `${spec.name}: comparison requires its complete deformation lifecycle in both drivers`)
        validateTerrainWitness(spec, row.witness, turns)
      }
    }
  }
}

function pairedSummary(pairs) {
  const baseline = pairs.map(pair => pair.baseline.engineMs), candidate = pairs.map(pair => pair.candidate.engineMs)
  const reductions = baseline.map((before, index) => 100 * (1 - candidate[index] / before))
  assert.ok(baseline.every(value => value > 0), 'zero baseline timing')
  // Deterministic paired bootstrap; independent replicates are processes, not turns.
  let seed = 0x706e64
  const med = values => { const sorted = [...values].sort((a, b) => a - b), i = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[i] : (sorted[i - 1] + sorted[i]) / 2 }
  const estimates = Array.from({ length: 10000 }, () => med(Array.from({ length: pairs.length }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return reductions[Math.floor(seed / 0x100000000 * reductions.length)]
  }))).sort((a, b) => a - b)
  const before = summarize(baseline), after = summarize(candidate)
  return {
    baselineMs: before, candidateMs: after,
    medianRuntimeReductionPercent: 100 * (1 - after.median / before.median), speedup: before.median / after.median,
    pairedRuntimeReductionPercent: reductions, pairedMedianReductionPercent: med(reductions),
    pairedMedianReduction95PercentileBootstrapInterval: [estimates[250], estimates[9749]],
    bootstrap: '10,000 deterministic resamples of whole A/B pairs; descriptive small-sample interval, not cross-machine certainty.',
  }
}

async function compare(report, options, artifacts, output) {
  assert.ok(options.verification, '--verification is required; run verify first')
  const verificationPath = resolve(options.verification), verificationBytes = readFileSync(verificationPath)
  const proof = JSON.parse(verificationBytes)
  validateVerification(proof, report)
  report.verification = { path: verificationPath, sha256: sha256(verificationBytes) }
  const pairs = integer(options.pairs ?? 8, 'pairs', 2, 100)
  assert.equal(pairs % 2, 0, 'use an even number of pairs for balanced AB/BA order')
  const timeout = integer(options['timeout-ms'] ?? 600000, 'timeout-ms', 1000, 3600000)
  report.pairs = []; report.order = []
  for (const spec of report.workload.scenarios) for (let index = 0; index < pairs; index++) {
    const pair = { scenario: spec.name, pair: index }
    for (const side of pairedOrder(index)) {
      sameSources(report)
      const label = `${spec.name}-${String(index).padStart(2, '0')}-${side}`
      const requestPath = resolve(artifacts, `${label}.request.json`), resultPath = resolve(artifacts, `${label}.result.json`)
      const request = { version: VERSION, source: report.sources[side], runtime: report.runtime, harnessSha256: report.harnessSha256, workload: { ...report.workload, scenarios: [spec] }, policy: report.policy, output: resultPath }
      writeNew(requestPath, request)
      const stdout = resolve(artifacts, `${label}.stdout.log`), stderr = resolve(artifacts, `${label}.stderr.log`)
      const out = openSync(stdout, 'wx'), err = openSync(stderr, 'wx')
      let child
      const command = [process.execPath, ...process.execArgv, SELF, '--worker', requestPath]
      try { child = spawnSync(command[0], command.slice(1), { cwd: ROOT, env: process.env, stdio: ['ignore', out, err], timeout }) }
      finally { closeSync(out); closeSync(err) }
      report.order.push({ scenario: spec.name, pair: index, side, command, exitCode: child.status, signal: child.signal, stdout, stderr, stdoutSha256: sha256(readFileSync(stdout)), stderrSha256: sha256(readFileSync(stderr)) })
      updateReport(output, report)
      assert.ok(child.status === 0 && !child.error && !child.signal, `${label}: child failed; inspect ${stderr}`)
      const result = readJson(resultPath)
      assert.equal(result.status, 'passed'); assert.equal(result.samples.length, 1)
      for (const [key, value] of Object.entries({ source: request.source, runtime: request.runtime, harnessSha256: request.harnessSha256, workload: request.workload }))
        assert.deepEqual(result[key], value, `${label}: child ${key} mismatch`)
      const sample = result.samples[0], expected = proof.results.find(row => row.scenario === spec.name && row.driver === 'tick')
      assert.equal(sample.rawTurnMs.length, spec.turns)
      assert.equal(sample.finalStateSha256, expected.checkpoints.at(-1).sha256, `${label}: timed final state differs from verification`)
      assert.deepEqual(sample.witness, expected.witness, `${label}: timed workload activity differs`)
      pair[side] = sample
      sameSources(report)
      console.error(`${label}: ${sample.engineMs.toFixed(3)} ms`)
    }
    report.pairs.push(pair); updateReport(output, report)
  }
  assert.equal(sha256(readFileSync(verificationPath)), report.verification.sha256, 'verification report changed during comparison')
  report.summary = Object.fromEntries(report.workload.scenarios.map(spec => [spec.name, pairedSummary(report.pairs.filter(pair => pair.scenario === spec.name))]))
  report.claim = 'Complete direct-tick elapsed runtime, excluding initialization/prelude, warmup, scripted between-turn terrain edits, witness collection and hashing. Complete production terrain processing and surface resampling inside ticks are included. Each timed run\'s final state and aggregate activity record matches separate source-bound verification. Fresh sequential child processes, equally many AB and BA pairs. Turn samples are not independent replicates. Process CPU is recorded separately and includes witnesses; net heap deltas do not measure allocations. No renderer, GPU, hardware-FPS or cross-machine claim.'
}

function help() {
  console.log(`Usage (Node >= 22.13, no npm dependencies):
  node scripts/bench-simulation.mjs verify --baseline PATH --candidate PATH --output work/performance/verify.json
  node scripts/bench-simulation.mjs compare --baseline PATH --candidate PATH --verification work/performance/verify.json --output work/performance/compare.json
  node scripts/bench-simulation.mjs sample --tree PATH --scenarios mission18 --turns 3600 --warmups 0 --output work/performance/pilot.json

Options:
  --scenarios ${Object.keys(DEFAULT_TURNS).join(',')}
  --turns N or mission18=3600,mission6=1200,... (default: ${JSON.stringify(DEFAULT_TURNS)})
  --people 200       selected blue army; combat adds equally many red warriors
  --seed N           optional post-creation override of both RNG streams
  --verify-every 120 full graph/alias checkpoint interval; values checked every turn
  --clock-turns 240  production 60-Hz replay cap per scenario (verify only)
  --pairs 8         even number of fresh-process AB/BA pairs (compare only)
  --warmups 1       disposable warmup worlds per child/scenario
  --warmup-turns 240 warmup prefix length, capped by scenario turns
  --timeout-ms 600000 per timing-child timeout

Bridge: authored Mission 2, ordinary worship prelude, then 96 measured turns.
Armageddon: authored Mission 18, one supplied shot and real cast/projectile
prelude, then 192 measured turns covering deformation and initial staging.
Erosion: authored Mission 3, ordinary Shaman travel and worship prelude,
then 64 measured turns including activation, 63 work visits and retirement.
Native heights, masks and all sampled surface values have separate witnesses;
surface values and masks may remain unchanged despite native deformation.
Terrain comparisons require the full deformation lifecycle in both drivers.
Freeze identical workload options and source trees for verify and compare.
Every output must be a fresh .json file under this checkout's ignored work/.
No historical evidence, engine sources, installed dependencies or Git refs are changed.
Use sample with Node --cpu-prof --cpu-prof-dir=work/... for a separate diagnostic profile.
Clear NODE_OPTIONS, NODE_COMPILE_CACHE and NODE_V8_COVERAGE before running.
The owner must serialize this command with other measurements/builds/heavy tests.`)
}

async function main(args) {
  if (args[0] === '--help' || args[0] === '-h') { help(); return }
  if (args[0] === '--worker') { assert.equal(args.length, 2); assertRuntime('compare'); await worker(args[1]); return }
  const mode = args.shift()
  assert.ok(['verify', 'compare', 'sample'].includes(mode), 'choose verify, compare or sample; see --help')
  const allowed = new Set(['baseline', 'candidate', 'tree', 'output', 'scenarios', 'turns', 'people', 'seed', 'verify-every', 'clock-turns', 'pairs', 'warmups', 'warmup-turns', 'timeout-ms', 'verification'])
  const options = {}
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index]?.slice(2), value = args[index + 1]
    assert.ok(args[index].startsWith('--') && allowed.has(name) && value !== undefined && !value.startsWith('--') && !Object.hasOwn(options, name), `invalid option: ${args[index]}`)
    options[name] = value
  }
  assert.ok(options.output?.endsWith('.json'), '--output must name a fresh work/ JSON report')
  assertRuntime(mode)
  const output = withinWork(options.output), artifacts = `${output}.artifacts`
  assert.ok(!existsSync(output) && !existsSync(artifacts), 'refusing to overwrite a previous report or its artifacts')
  const report = {
    version: VERSION, mode, status: 'running', startedAt: new Date().toISOString(),
    command: [process.execPath, ...process.execArgv, SELF, ...process.argv.slice(2)],
    harnessSha256: sha256(readFileSync(SELF)), runtime: runtimeFingerprint(), workload: workloadOptions(options),
    policy: { warmups: integer(options.warmups ?? 1, 'warmups', 0, 20), warmupTurns: integer(options['warmup-turns'] ?? 240, 'warmup-turns', 1, 100000), warmup: 'Fresh disposable worlds, same scenario prefix; no state continues into the measured world. No forced GC.' },
  }
  if (mode === 'sample') { assert.ok(options.tree, '--tree is required'); report.source = sourceFingerprint(options.tree) }
  else {
    assert.ok(options.baseline && options.candidate, '--baseline and --candidate are required')
    report.sources = { baseline: sourceFingerprint(options.baseline), candidate: sourceFingerprint(options.candidate) }
  }
  mkdirSync(artifacts); writeNew(output, report)
  try {
    if (mode === 'verify') await verify(report, options)
    else if (mode === 'sample') await sample(report)
    else await compare(report, options, artifacts, output)
    sameSources(report)
    assert.deepEqual(runtimeFingerprint(), report.runtime, 'runtime changed during the run')
    report.status = 'passed'
  } catch (error) {
    report.status = 'failed'; report.error = { message: error.message, stack: error.stack }
    process.exitCode = 1
  }
  report.finishedAt = new Date().toISOString(); updateReport(output, report)
  console.log(json({ status: report.status, output, summary: report.summary, error: report.error?.message }))
}

if (process.argv[1] && realpathSync(process.argv[1]) === SELF)
  main(process.argv.slice(2)).catch(error => { console.error(error.stack); process.exitCode = 1 })
