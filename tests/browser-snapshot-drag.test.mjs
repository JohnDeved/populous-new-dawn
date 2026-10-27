import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { inspectDragSource, dragSourceProfiles } from '../scripts/browser-performance/snapshot-drag-contract.mjs'
import { installSnapshotDragObserver } from '../scripts/browser-performance/snapshot-drag-observer.mjs'
import { RenderView } from '../app/render-view.ts'
const root = resolve(import.meta.dirname, '..')
const routeTooltipId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-route-tooltip-v1'
const resultClockId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-route-tooltip-result-clock-v1'
const looseLogProfileId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-loose-log-v1'
// Literal inverse of PR831's reviewed resource route, only for historical fixtures.
// Production admission never strips or normalizes candidate source.
const looseLogDeltas = [
  ['app/scene-picking.ts', `    // Only live loose timber uses this sprite route. Other effects/decorations
    // remain non-pickable, and the shared painter stream still owns occlusion.
    if (!s.overviewActive)
      s.decorations.traverseVisible(group => {
        const { point: tree, sprite } = group.userData
        if (
          tree?.model !== 11 ||
          !Number.isInteger(tree.id) ||
          tree.id <= 0 ||
          !(tree.logs > 0) ||
          !s.world.trees.includes(tree) ||
          !(sprite instanceof THREE.Sprite) ||
          sprite.parent !== group ||
          !sprite.visible ||
          !sprite.material.visible
        )
          return
        const source = view.painter.source(sprite)
        if (!source) return
        const anchor = view.screen(sprite.getWorldPosition(new THREE.Vector3()), s.camera),
          scale = sprite.getWorldScale(new THREE.Vector3()),
          width = Math.trunc((scale.x * rect.width) / view.projection.width),
          height = Math.trunc((scale.y * rect.height) / view.projection.height),
          x = Math.trunc(((anchor.x + 1) * rect.width) / 2),
          y = Math.trunc(((1 - anchor.y) * rect.height) / 2)
        // Native type-1 header rectangles include all four edges and transparent
        // corners. Use current displayed size/anchor, not unported native scaling
        // or height offsets; odd widths intentionally use integer half-width.
        const bounds = { x: x - Math.trunc(width / 2), y: y - height, width, height }
        if (width <= 0 || height <= 0 || !inHitBounds(point, bounds)) return
        hits.push({
          kind: 'resource',
          id: tree.id,
          bounds,
          eligible: true,
          source,
          bucket: source.bucket,
          face: source.face,
        })
      })
`, ``],
  ['app/scene-picking.ts', `  lastKind: 'person' | 'model' | 'resource' | null = null`, `  lastKind: 'person' | 'model' | null = null`],
  ['app/world-picking.ts', `  | { kind: 'person' | 'resource'; id: number; bounds: HitBounds; eligible: boolean }`, `  | { kind: 'person'; id: number; bounds: HitBounds; eligible: boolean }`],
  ['app/world-picking.ts', `  let result: { kind: 'person' | 'model' | 'resource'; id: number } | null = null`, `  let result: { kind: 'person' | 'model'; id: number } | null = null`],
  ['app/world-picking.ts', `      case 'person':
      case 'resource':
        if (command.eligible && inHitBounds(point, command.bounds))
          result = { kind: command.kind, id: command.id }`, `      case 'person':
        if (command.eligible && inHitBounds(point, command.bounds))
          result = { kind: 'person', id: command.id }`],
 ]
function preLooseLogRead(path, read = mainHistoricalRead) {
  let source = read(path)
  for (const [owner, current, previous] of looseLogDeltas) if (path === owner) {
    assert.equal(source.split(current).length, 2, 'exact reviewed loose-log inverse boundary')
    source = source.replace(current, previous)
  }
  return source
}
const cpuProfileId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-v1'
// Exact inverse of the independently reviewed CPU-retirement delta. Never strip
// arbitrary guards or normalize candidate source before the admission hash.
const cpuRetirementDeltas = [
  ['app/scene.ts', `    this.dispatchNearbyFollowers(now)
    // Synchronous UI/audio callbacks may retire this scene before the frame ends.
    if (this.disposed) return`, `    this.dispatchNearbyFollowers(now)`],
  ['app/scene.ts', `    advanceGame(this.world, this.gameClock, dt, simulationMetrics)
    if (this.disposed) return`, `    advanceGame(this.world, this.gameClock, dt, simulationMetrics)`],
  ['app/scene.ts', `    this.playWorldSounds()
    if (this.disposed) return`, `    this.playWorldSounds()`],
  ['app/scene.ts', `    if (!cameraOwnsFrame) {
      const flying = this.updateFlyby(dt)
      if (this.disposed) return
      if (!flying) this.updateView()
    }`, `    if (!cameraOwnsFrame && !this.updateFlyby(dt)) this.updateView()`],
  ['app/scene.ts', `    this.updateHudFrame(now, dt)
    if (this.disposed) return`, `    this.updateHudFrame(now, dt)`],
  ['app/scene-terrain-runtime.ts', `  if (scene.disposed || !scene.terrainTextures) return`, `  if (!scene.terrainTextures) return`],
  ['app/scene-terrain-runtime.ts', `export function updateWater(scene: GameScene, metrics?: WaterUpdateMetrics) {
  if (scene.disposed) return`, `export function updateWater(scene: GameScene, metrics?: WaterUpdateMetrics) {`],
]
function preCpuRead(path, read = preLooseLogRead) {
  let source = read(path)
  for (const [owner, current, previous] of cpuRetirementDeltas) if (path === owner) {
    assert.equal(source.split(current).length, 2, 'exact reviewed inverse boundary')
    source = source.replace(current, previous)
  }
  return source
}

const combinedCpuProfileId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-v1'
const renderCpuProfileId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-render-cpu-leases-v1'
// Literal inverse of the reviewed PR #789 RenderView delta. This reconstructs
// historical fixture reads only; production admission never normalizes source.
const renderCpuDeltas = [
  [`  private ordinaryPickScratch: OrdinaryPickScratch | null = null
  private ordinaryPickDepth = 0
  private pickOperationDepth = 0
  private ordinaryPickDisposed = false
  groundPickCache = new WeakMap<
`, `  private ordinaryPickScratch: OrdinaryPickScratch | null = null
  private ordinaryPickDepth = 0
  private ordinaryPickDisposed = false
  groundPickCache = new WeakMap<
`],
  [`  // for equivalent submissions even when an external producer rewrites the index.
  pickSubmissionKey(objects: THREE.Object3D[]) {
    if (this.ordinaryPickDepth === 0 && this.pickOperationDepth === 0)
      this.ordinaryPickDisposed = false
    this.ordinaryPickDepth++
    try {
      return this.collectPickSubmissionKey(objects)
    } finally {
      if (--this.ordinaryPickDepth === 0) this.ordinaryPickScratch?.clearPoints()
    }
  }

  private collectPickSubmissionKey(objects: THREE.Object3D[]) {
    const submissions = this.pickSubmissions,
      keys: string[] = []
    for (const root of objects)
      root.traverseVisible(object => {
`, `  // for equivalent submissions even when an external producer rewrites the index.
  pickSubmissionKey(objects: THREE.Object3D[]) {
    const keys: string[] = []
    for (const root of objects)
      root.traverseVisible(object => {
`],
  [`            object instanceof THREE.InstancedMesh ? object.instanceMatrix.version : -1,
          matrix = object.matrixWorld.elements.join(',')
        const cached = submissions.get(object)
        let same =
          !!cached &&
`, `            object instanceof THREE.InstancedMesh ? object.instanceMatrix.version : -1,
          matrix = object.matrixWorld.elements.join(',')
        const cached = this.pickSubmissions.get(object)
        let same =
          !!cached &&
`],
  [`        }
        const revision = same ? cached!.revision : (cached?.revision ?? 0) + 1
        if (!this.ordinaryPickDisposed)
          submissions.set(object, {
            revision,
            position,
            positionVersion,
            index,
            indexVersion: index?.version ?? -1,
            drawStart,
            drawCount,
            instances,
            instanceVersion,
            matrix,
            cells,
          })
        keys.push(\`\${object.id}:\${revision}\`)
      })
`, `        }
        const revision = same ? cached!.revision : (cached?.revision ?? 0) + 1
        this.pickSubmissions.set(object, {
          revision,
          position,
          positionVersion,
          index,
          indexVersion: index?.version ?? -1,
          drawStart,
          drawCount,
          instances,
          instanceVersion,
          matrix,
          cells,
        })
        keys.push(\`\${object.id}:\${revision}\`)
      })
`],
  [`    ordinaryMetrics?: OrdinaryTerrainMetrics
  ): ViewPickCandidate[] {
    if (this.ordinaryPickDepth === 0 && this.pickOperationDepth === 0)
      this.ordinaryPickDisposed = false
    this.ordinaryPickDepth++
    try {
`, `    ordinaryMetrics?: OrdinaryTerrainMetrics
  ): ViewPickCandidate[] {
    if (this.ordinaryPickDepth === 0) this.ordinaryPickDisposed = false
    this.ordinaryPickDepth++
    try {
`],
  [`    owned = false
  ): ViewPickCandidate[] {
    if (this.ordinaryPickDepth === 0 && this.pickOperationDepth === 0)
      this.ordinaryPickDisposed = false
    this.ordinaryPickDepth++
    try {
`, `    owned = false
  ): ViewPickCandidate[] {
    if (this.ordinaryPickDepth === 0) this.ordinaryPickDisposed = false
    this.ordinaryPickDepth++
    try {
`],
  [`            if (terrainCorners && firstCorner >= 0) terrainCorners[firstCorner] = i + 1
          }
          if (nativeEdges && !reuse && !this.ordinaryPickDisposed) {
            let entries = this.groundPickCache.get(object)
            if (!entries) this.groundPickCache.set(object, (entries = new Map()))
`, `            if (terrainCorners && firstCorner >= 0) terrainCorners[firstCorner] = i + 1
          }
          if (nativeEdges && !reuse) {
            let entries = this.groundPickCache.get(object)
            if (!entries) this.groundPickCache.set(object, (entries = new Map()))
`],
  [`    if (!runtimeTerrainPicking(this, terrain) || this.overview || this.ordinaryPickDepth !== 0)
      return this.pick(mouse, [terrain], camera, false, metrics)
    this.beginPickOperation()
    try {
      return this.pickOwnedTerrainQuery(mouse, terrain, camera, metrics)
    } finally {
      this.endPickOperation()
    }
  }

  private pickOwnedTerrainQuery(
    mouse: THREE.Vector2,
    terrain: THREE.Object3D,
    camera: THREE.Camera,
    metrics?: OrdinaryTerrainMetrics
  ) {
    const candidates = this.pickCandidateQuery(
      mouse,
`, `    if (!runtimeTerrainPicking(this, terrain) || this.overview || this.ordinaryPickDepth !== 0)
      return this.pick(mouse, [terrain], camera, false, metrics)
    const candidates = this.pickCandidateQuery(
      mouse,
`],
  [`  }

  private beginPickOperation() {
    if (this.ordinaryPickDepth === 0 && this.pickOperationDepth === 0)
      this.ordinaryPickDisposed = false
    this.pickOperationDepth++
    this.painter.beginCpuLease()
  }

  private endPickOperation() {
    this.pickOperationDepth--
    this.painter.endCpuLease()
  }

  resolvePickCandidates(candidates: ViewPickCandidate[]) {
    this.beginPickOperation()
    try {
      return this.resolveCandidates(candidates)
    } finally {
      this.endPickOperation()
    }
  }

  private resolveCandidates(candidates: ViewPickCandidate[]) {
    let best: ViewPickCandidate | null = null
    for (const candidate of candidates) {
`, `  }

  resolvePickCandidates(candidates: ViewPickCandidate[]) {
    let best: ViewPickCandidate | null = null
    for (const candidate of candidates) {
`],
  [`    camera: THREE.Camera,
    nativeEdges = false,
    ordinaryMetrics?: OrdinaryTerrainMetrics
  ) {
    this.beginPickOperation()
    try {
      return this.pickQuery(mouse, objects, camera, nativeEdges, ordinaryMetrics)
    } finally {
      this.endPickOperation()
    }
  }

  private pickQuery(
    mouse: THREE.Vector2,
    objects: THREE.Object3D[],
    camera: THREE.Camera,
    nativeEdges: boolean,
    ordinaryMetrics?: OrdinaryTerrainMetrics
  ) {
`, `    camera: THREE.Camera,
    nativeEdges = false,
    ordinaryMetrics?: OrdinaryTerrainMetrics
  ) {
`],
  [`    // Drop ownership without mutating any buffers an active reentrant call holds.
    this.ordinaryPickScratch = null
    this.groundPickCache = new WeakMap()
    this.pickSubmissions = new WeakMap()
    // Remaining instances/roots in this query must not reacquire ownership.
    // A later independent top-level query may initialize fresh storage.
    this.ordinaryPickDisposed = true
    this.boundsTexture.dispose()
    this.painter.dispose()
  }
}
`, `    // Drop ownership without mutating any buffers an active reentrant call holds.
    this.ordinaryPickScratch = null
    // Remaining instances/roots in this query must not reacquire ownership.
    // A later independent top-level query may initialize fresh storage.
    this.ordinaryPickDisposed = true
    this.boundsTexture.dispose()
    this.painter.texture.dispose()
  }
}
`],
]
function preRenderCpuRead(path, read = preLooseLogRead) {
  let source = read(path)
  if (path === 'app/render-view.ts') for (const [current, previous] of renderCpuDeltas) {
    assert.equal(source.split(current).length, 2, 'exact reviewed RenderView inverse boundary')
    source = source.replace(current, previous)
  }
  return source
}

const preBothCpuRead = path => preCpuRead(path, preRenderCpuRead)
const atomicProfileId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-loose-log-route-tooltip-result-clock-v1'
const callbackRetirementProfileId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-loose-log-route-tooltip-result-clock-tooltip-retirement-v1'

// These readers reconstruct historical fixtures only; production admission never
// strips source. The guarded callback is the exact independently reviewed delta.
const rawSnapshotRead = path => readFileSync(resolve(root, path), 'utf8')

// Exact inverse only for historical fixtures. Production inspectDragSource reads
// raw candidate bytes; it never invokes this reader or normalizes new owners.
const callbackRetirementDeltas = [
  [
    "app/scene-camera-runtime.ts",
    "        if (event.kind === 5) {\n          scene.acquireForcedTooltip(\n            forcedTooltipObject(scene.world, event.flags, event.value),\n            event.duration\n          )\n          // Route replacement may synchronously publish and retire this owner.\n          if (!scene.isCurrent()) return false\n        }\n",
    "        if (event.kind === 5)\n          scene.acquireForcedTooltip(\n            forcedTooltipObject(scene.world, event.flags, event.value),\n            event.duration\n          )\n"
  ],
  [
    "app/scene-camera-runtime.ts",
    "      if (!scene.world.paused || scene.world.routeNotice || scene.tooltipController?.routeNotice) {\n        scene.updateTooltipController(scene.previous ?? performance.now())\n        // Stop this catch-up visit before touching released/replaced scene state.\n        if (!scene.isCurrent()) return false\n      }\n",
    "      if (!scene.world.paused || scene.world.routeNotice || scene.tooltipController?.routeNotice)\n        scene.updateTooltipController(scene.previous ?? performance.now())\n"
  ],
  [
    "app/scene-tooltip-runtime.ts",
    "    if (expiredRoute) {\n      scene.onChange()\n      // Publication can revoke this Scene before the panel/output work below.\n      if (!scene.isCurrent()) return\n    }\n",
    "    if (expiredRoute) scene.onChange()\n"
  ],
  [
    "app/scene.ts",
    "      const flying = this.updateFlyby(dt)\n      if (!this.isCurrent()) return\n",
    "      const flying = this.updateFlyby(dt)\n      if (this.disposed) return\n"
  ]
]
function preCallbackRetirementRead(path) {
  let source = rawSnapshotRead(path)
  for (const [owner, current, previous] of callbackRetirementDeltas) if (owner === path) {
    assert.equal(source.split(current).length, 2, 'exact callback-retirement inverse boundary')
    source = source.replace(current, previous)
  }
  return source
}

const correctedResultClockFrame = `    if (!document.hidden) {
      const previousPhase =
        ((Math.floor(this.resultClock.inputCycles / 4) & 1) << 1) |
        (Math.floor(this.resultClock.inputCycles / 6) & 1)
      advanceResultClock(this.resultClock, dt)
      const nextPhase =
        ((Math.floor(this.resultClock.inputCycles / 4) & 1) << 1) |
        (Math.floor(this.resultClock.inputCycles / 6) & 1)
      if (this.world.status !== 'playing' && previousPhase !== nextPhase) {
        this.onChange()
        if (this.disposed) return
      }
    }
`
const guardedResultCallback = `      if (this.world.status !== 'playing' && previousPhase !== nextPhase) {
        this.onChange()
        if (this.disposed) return
      }`
const historicalResultCallback = `      if (this.world.status !== 'playing' && previousPhase !== nextPhase) this.onChange()`
function mainHistoricalRead(path) {
  let scene = preCallbackRetirementRead('app/scene.ts')
  assert.equal(scene.split(correctedResultClockFrame).length, 2, 'exact corrected result-clock inverse')
  scene = scene.replace(correctedResultClockFrame, '')
  return preRouteTooltipReader(name => name === 'app/scene.ts' ? scene : preCallbackRetirementRead(name))(path)
}
function uiHistoricalRead(path) {
  // Explicitly start at raw current source, not the main-only default reader.
  const read = name => preRenderCpuRead(name,
    owner => preCpuRead(owner, file => preLooseLogRead(file, preCallbackRetirementRead)))
  let source = read(path)
  if (path === 'app/scene.ts') {
    assert.equal(source.split(guardedResultCallback).length, 2, 'exact reviewed callback guard inverse')
    source = source.replace(guardedResultCallback, historicalResultCallback)
  }
  return source
}
const mainHistoricalIds = ["generic-terrain-v1", "owned-numeric-terrain-v1", "owned-numeric-terrain-neutral-cursor-v1", "owned-numeric-terrain-neutral-cursor-pick-paths-v1", "owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1", "owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-v1", "owned-numeric-terrain-neutral-cursor-pick-paths-epoch-render-cpu-leases-v1", "owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-v1", "owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-loose-log-v1"]
const uiHistoricalIds = ["generic-terrain-v1", "owned-numeric-terrain-v1", "owned-numeric-terrain-neutral-cursor-v1", "owned-numeric-terrain-neutral-cursor-pick-paths-v1", "owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1", "owned-numeric-terrain-neutral-cursor-pick-paths-epoch-route-tooltip-v1", "owned-numeric-terrain-neutral-cursor-pick-paths-epoch-route-tooltip-result-clock-v1"]

test('source-owner admission selects one exact bounded route; projection kernel remains changeable', () => {
  const read = path => readFileSync(resolve(root, path), 'utf8')
  const admitted = inspectDragSource(root)
  assert.equal(admitted.status, 'admitted'); assert.equal(admitted.version, 2)
  assert.equal(admitted.profiles.filter(profile => profile.status === 'admitted').length, 1)
  const profile = dragSourceProfiles.find(profile => profile.id === admitted.profile)
  assert.ok(profile); assert.equal(profile.slices.length, profile.id === callbackRetirementProfileId ? 24 : profile.id === atomicProfileId ? 22 : profile.id === resultClockId ? 20 : profile.id === looseLogProfileId ? 19 : [renderCpuProfileId, combinedCpuProfileId].includes(profile.id) ? 18 : ['owned-numeric-terrain-neutral-cursor-v1', 'owned-numeric-terrain-neutral-cursor-pick-paths-v1', 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1', routeTooltipId, cpuProfileId].includes(profile.id) ? 17 : 16)
  for (const slice of profile.slices) {
    const changed = inspectDragSource(root, path => {
      if (path !== slice.path) return read(path)
      if (slice.absentFile) return ''
      if (slice.absentMarker) return `${read(path)}\n${slice.absentMarker}`
      return slice.start === null ? `${read(path)}\n`
        : read(path).replace(slice.start, `${slice.start}\n/* changed admission */`)
    })
    assert.equal(changed.status, 'unsupported-source-contract', slice.id)
    assert.equal(changed.profile, null)
    assert.ok(changed.profiles.find(p => p.id === profile.id).slices.find(s => s.id === slice.id).reason)
  }
  const boundary = profile.slices.find(s => s.id === 'query-inputs')
  for (const replacement of ['', `${boundary.start}\n${boundary.start}`, ' '.repeat(1024 * 1024 + 1),
    `${read(boundary.path)}\n${boundary.end}`]) {
    assert.equal(inspectDragSource(root, path => path === boundary.path ? replacement : read(path)).status, 'unsupported-source-contract')
  }
  assert.equal(inspectDragSource(root, path => path !== boundary.path ? read(path)
    : read(path).replace(boundary.end, `${boundary.end}\n          // reviewable projection kernel change`)).status, 'admitted')
})

test('atomic route profiles cache both source reads and failures; only ENOENT establishes helper absence', () => {
  const calls = new Map(), helper = 'app/runtime-terrain-picking.ts'
  const read = path => readFileSync(resolve(root, path), 'utf8')
  const result = inspectDragSource(root, path => { calls.set(path, (calls.get(path) ?? 0) + 1); return read(path) })
  assert.equal(result.status, 'admitted'); assert.ok([...calls.values()].every(count => count === 1))
  assert.equal(calls.size, new Set(dragSourceProfiles.flatMap(p => p.slices.map(s => s.path))).size)
  for (const replacement of [() => '', () => undefined, () => ' '.repeat(1024 * 1024 + 1),
    () => { throw Object.assign(Error('unreadable'), { code: 'EACCES' }) }, () => { throw Error('unknown failure') }]) {
    let failures = 0
    const changed = inspectDragSource(root, path => {
      if (path !== helper) return read(path)
      failures++; return replacement()
    })
    assert.equal(changed.status, 'unsupported-source-contract'); assert.equal(failures, 1)
  }
  // A failed RenderView read cannot establish the absence of an owned method.
  assert.equal(inspectDragSource(root, path => {
    if (path === 'app/render-view.ts') throw Object.assign(Error('missing'), { code: 'ENOENT' })
    return read(path)
  }).status, 'unsupported-source-contract')
})

test('route admission binds numeric lease gates, actual constructor order and helper lifecycle, not just query signatures', () => {
  const read = path => readFileSync(resolve(root, path), 'utf8')
  const checks = [
    ['app/render-view.ts', '          const scratch =\n            !nativeEdges &&', '          const scratch =\n            nativeEdges &&'],
    ['app/scene.ts', '    this.cursor.visible = false\n    this.range.visible = false', '    this.range.visible = false\n    this.cursor.visible = false'],
    ['app/scene-input-runtime.ts', 'export function pick(', 'export function pick(\n/* altered public dispatch */'],
    ['app/neutral-cursor.ts', '!scene.pointerButtons &&', 'true &&'],
    ['app/scene.ts', '    this.updatePointerFrame(now, pointerMetrics)\n    this.neutralCursor?.update()', '    this.neutralCursor?.update()\n    this.updatePointerFrame(now, pointerMetrics)'],
  ]
  if (['owned-numeric-terrain-v1', 'owned-numeric-terrain-neutral-cursor-v1', 'owned-numeric-terrain-neutral-cursor-pick-paths-v1', 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1', cpuProfileId, renderCpuProfileId, combinedCpuProfileId, looseLogProfileId, routeTooltipId, resultClockId, atomicProfileId, callbackRetirementProfileId].includes(inspectDragSource(root).profile)) checks.push(
    ['app/render-view.ts', 'owned && scratch && runtimeTerrainPicking(this, object)', 'owned && scratch'],
    ['app/runtime-terrain-picking.ts', 'if (released.has(scene.view)) return', 'if (false) return'],
    ['app/scene-terrain-runtime.ts', '    rebindRuntimeTerrainPicking(scene)', '    /* omitted rebind */'])
  for (const [path, before, after] of checks) {
    assert.equal(read(path).split(before).length, 2)
    assert.equal(inspectDragSource(root, name => name === path ? read(name).replace(before, after) : read(name)).status,
      'unsupported-source-contract', path)
  }
})

// Remove only the complete frame-clock addition to recover the previous frame
// owner. The now-unused helper/import/field cannot affect that historical route;
// the new route instead requires all three exact clock-owner slices below.
const resultClockFrame = `    if (!document.hidden) {
      const previousPhase =
        ((Math.floor(this.resultClock.inputCycles / 4) & 1) << 1) |
        (Math.floor(this.resultClock.inputCycles / 6) & 1)
      advanceResultClock(this.resultClock, dt)
      const nextPhase =
        ((Math.floor(this.resultClock.inputCycles / 4) & 1) << 1) |
        (Math.floor(this.resultClock.inputCycles / 6) & 1)
      if (this.world.status !== 'playing' && previousPhase !== nextPhase) this.onChange()
    }
`
function preResultClockReader(read) {
  const scene = read('app/scene.ts')
  assert.equal(scene.split(resultClockFrame).length, 2)
  return path => path === 'app/scene.ts' ? scene.replace(resultClockFrame, '') : read(path)
}

test('result-clock admission preserves all historical profiles and binds the complete new clock route', () => {
  const read = uiHistoricalRead
  assert.equal(createHash('sha256').update(JSON.stringify(uiHistoricalIds.slice(0, -1).map(id => dragSourceProfiles.find(profile => profile.id === id)))).digest('hex'),
    'b265d10660d59d936f8c2c8a22af59b46cb429aca85616206fd0926eaa9ef1e8',
    'all six historical profile IDs, owner boundaries and pins remain exact')
  const previous = dragSourceProfiles.find(profile => profile.id === routeTooltipId)
  const current = dragSourceProfiles.find(profile => profile.id === resultClockId)
  assert.equal(current.id, resultClockId)
  assert.equal(current.slices.length, 20)
  for (let i = 0; i < previous.slices.length; i++) {
    const old = previous.slices[i], next = current.slices[i]
    assert.deepEqual(next.id === 'frame-order' ? { ...next, sha256: old.sha256 } : next, old)
    if (next.id === 'frame-order') {
      assert.equal(old.sha256, '27ed72fea09df7d40a3e632ca56da9aa487a2df73dc950655f74bf1bb7b93adf')
      assert.equal(next.sha256, '5c8dbbf4dc2caaf257c7eedb472dcd7caeca30aeda695dd2fa0294934a6aeb50')
    }
  }
  assert.deepEqual(current.slices.slice(17).map(slice => slice.id),
    ['result-clock-owner', 'result-clock-import', 'result-clock-initialization'])
  const admitted = inspectDragSource(root, read)
  assert.equal(admitted.profile, resultClockId)
  assert.equal(admitted.profiles.filter(profile => profile.status === 'admitted').length, 1)
  const historical = inspectDragSource(root, preResultClockReader(read))
  assert.equal(historical.profile, routeTooltipId)
  assert.equal(historical.profiles.filter(profile => profile.status === 'admitted').length, 1)

  // No partial frame removal, unknown helper, remapped import or shared clock is
  // admitted. These are supplied source-data mutations, never executed.
  const checks = [
    ['app/scene.ts', '      advanceResultClock(this.resultClock, dt)\n', ''],
    ['app/scene.ts', "      if (this.world.status !== 'playing' && previousPhase !== nextPhase) this.onChange()\n", ''],
    ['app/scene.ts', '    if (!document.hidden) {\n      const previousPhase', '    if (!this.world.paused) {\n      const previousPhase'],
    ['app/scene.ts', 'advanceResultClock(this.resultClock, dt)', 'advanceResultClock(this.resultClock, dt * this.world.speed)'],
    ['app/scene.ts', "import { createResultClock, advanceResultClock } from './result-session.ts'", "import { createResultClock, advanceResultClock } from './unreviewed-clock.ts'"],
    ['app/scene.ts', '  resultClock = createResultClock()', '  resultClock = sharedClock'],
    ['app/result-session.ts', 'Math.floor((elapsed + 1e-7) / 83)', 'Math.floor((elapsed + 1e-7) / 12)'],
    ['app/result-session.ts', 'clock.inputCycles = (clock.inputCycles + cycles) >>> 0', 'clock.inputCycles = (clock.inputCycles + cycles) >>> 0; mutateWorld()'],
    ['app/scene-input-runtime.ts', '      scene.fpsGraph?.interactionRecording,\n', '      scene.fpsGraph,\n'],
  ]
  for (const [path, before, after] of checks) {
    assert.equal(read(path).split(before).length, 2)
    const rejected = inspectDragSource(root, name => name === path ? read(name).replace(before, after) : read(name))
    assert.equal(rejected.status, 'unsupported-source-contract', `${path}: ${before}`)
    assert.equal(rejected.profile, null)
  }
  let failures = 0
  const unavailable = inspectDragSource(root, path => {
    if (path === 'app/result-session.ts') { failures++; throw Object.assign(Error('unreadable'), { code: 'EACCES' }) }
    return read(path)
  })
  assert.equal(unavailable.status, 'unsupported-source-contract')
  assert.equal(failures, 1)
})

const cameraPath = 'app/scene-camera-runtime.ts'
// Undo only the four reviewed route-tooltip edits. The admission function still
// hashes the complete owner bytes; this reconstruction never normalizes a profile.
const routeTooltipInverse = [
  ['  if (!scene.world.paused || scene.world.routeNotice || scene.tooltipController?.routeNotice) {',
   '  if (!scene.world.paused) {'],
  ['      for (const event of scene.world.paused ? [] : stepFlyby(state, scene.flybyCamera, 24)) {',
   '      for (const event of stepFlyby(state, scene.flybyCamera, 24)) {'],
  ['      if (!scene.world.paused || scene.world.routeNotice || scene.tooltipController?.routeNotice)\n        scene.updateTooltipController(scene.previous ?? performance.now())',
   '      scene.updateTooltipController(scene.previous ?? performance.now())'],
  ['      if (active && !scene.world.paused) scene.commitSky(scene.flybyCamera, scene.flybyTime)',
   '      if (active) scene.commitSky(scene.flybyCamera, scene.flybyTime)'],
]
function preRouteTooltipReader(read) {
  let source = read(cameraPath)
  for (const [before, after] of routeTooltipInverse) {
    assert.equal(source.split(before).length, 2)
    source = source.replace(before, after)
  }
  return path => path === cameraPath ? source : read(path)
}

test('route-tooltip admission adds only the exact reviewed camera owner and rejects partial or mixed routes', () => {
  const read = preResultClockReader(uiHistoricalRead)
  const epochId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1'
  const epoch = dragSourceProfiles.find(profile => profile.id === epochId)
  const route = dragSourceProfiles.find(profile => profile.id === routeTooltipId)
  assert.equal(route.slices.length, 17)
  for (let i = 0; i < epoch.slices.length; i++) {
    const previous = epoch.slices[i], next = route.slices[i]
    if (previous.id !== 'camera-producers') assert.deepEqual(next, previous)
    else {
      assert.equal(previous.sha256, '458fa0be8df6e0ab718c1006b0f54f4b703e877850afd2896249544b9dcddad8')
      assert.equal(next.sha256, 'cd3b53fce3efc61851ceb0c34d11d35d13a15cac7162753d8b1677c7d2b8875e')
      assert.deepEqual({ ...next, sha256: previous.sha256 }, previous, 'all route-tooltip boundaries remain exact')
    }
  }
  const current = inspectDragSource(root, read)
  assert.equal(current.profile, routeTooltipId)
  assert.equal(current.profiles.filter(profile => profile.status === 'admitted').length, 1)
  const historical = inspectDragSource(root, preRouteTooltipReader(read))
  assert.equal(historical.profile, epochId)
  assert.equal(historical.profiles.filter(profile => profile.status === 'admitted').length, 1)
  // Every nonempty partial inverse is an unreviewed camera owner, not either route.
  for (let mask = 1; mask < (1 << routeTooltipInverse.length) - 1; mask++) {
    let source = read(cameraPath)
    for (const [index, [before, after]] of routeTooltipInverse.entries()) {
      assert.equal(source.split(before).length, 2)
      if (mask & (1 << index)) source = source.replace(before, after)
    }
    const rejected = inspectDragSource(root, path => path === cameraPath ? source : read(path))
    assert.equal(rejected.status, 'unsupported-source-contract', `partial inverse ${mask}`)
    assert.equal(rejected.profile, null)
  }
  // An unknown route clock or a historical recording input with the new camera
  // owner is not a reviewed complete route, even though each old slice is known.
  for (const [path, before, after] of [
    [cameraPath, 'scene.flybyTime += dt', 'scene.flybyTime += dt * 2'],
    ['app/scene-input-runtime.ts', '      scene.fpsGraph?.interactionRecording,\n', '      scene.fpsGraph,\n'],
  ]) {
    assert.equal(read(path).split(before).length, 2)
    const rejected = inspectDragSource(root, name => name === path ? read(name).replace(before, after) : read(name))
    assert.equal(rejected.status, 'unsupported-source-contract')
    assert.equal(rejected.profile, null)
  }
})

test('pick-path and recording-epoch admission preserve exact historical source contracts', () => {
  const read = preBothCpuRead
  const oldId = 'owned-numeric-terrain-neutral-cursor-v1'
  const newId = 'owned-numeric-terrain-neutral-cursor-pick-paths-v1'
  const epochId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1'
  const historical = dragSourceProfiles.find(profile => profile.id === oldId)
  const candidate = dragSourceProfiles.find(profile => profile.id === newId)
  const epoch = dragSourceProfiles.find(profile => profile.id === epochId)
  assert.deepEqual(dragSourceProfiles.map(profile => profile.id), [
    'generic-terrain-v1', 'owned-numeric-terrain-v1', oldId, newId, epochId, cpuProfileId, renderCpuProfileId, combinedCpuProfileId, looseLogProfileId, routeTooltipId, resultClockId, atomicProfileId, callbackRetirementProfileId,
  ])
  assert.equal(historical.slices.length, 17)
  assert.equal(candidate.slices.length, 17)
  assert.equal(epoch.slices.length, 17)
  for (let i = 0; i < historical.slices.length; i++) {
    const previous = historical.slices[i], next = candidate.slices[i]
    if (previous.id !== 'query-inputs') assert.deepEqual(next, previous)
    else {
      assert.equal(previous.sha256, '766eeb9c4c381ce38f1e718e13f8ba9cf79ae912bd1b0031fae36dbcb10c2a0e')
      assert.equal(next.sha256, 'c3b43f1239d7f441378bca9466f092fa70425e3b2e85e4805d097b31b9f0485c')
      assert.deepEqual({ ...next, sha256: previous.sha256 }, previous, 'all boundaries remain exact')
    }
  }
  for (let i = 0; i < candidate.slices.length; i++) {
    const previous = candidate.slices[i], next = epoch.slices[i]
    if (previous.id !== 'pointer-callback') assert.deepEqual(next, previous)
    else {
      assert.equal(previous.sha256, '8f0549696e9474b1573436a41a7040e553e44c79c7b3bb8e4c2a18a060518c0c')
      assert.equal(next.sha256, '741e838886ad865d30e675158c627bb1056b0d4b0c04ee32f0b15296bd2b1895')
      assert.deepEqual({ ...next, sha256: previous.sha256 }, previous, 'all epoch boundaries remain exact')
    }
  }
  const current = inspectDragSource(root, read)
  assert.equal(current.profile, epochId)
  assert.equal(current.profiles.filter(profile => profile.status === 'admitted').length, 1)
  // Undo exactly the reviewed recording argument to recover PR640's full route.
  const inputPath = 'app/scene-input-runtime.ts'
  const epochArgument = '      scene.fpsGraph?.interactionRecording,\n'
  assert.equal(read(inputPath).split(epochArgument).length, 2)
  const preEpochInput = read(inputPath).replace(epochArgument, '      scene.fpsGraph,\n')
  const preEpochRead = path => path === inputPath ? preEpochInput : read(path)
  const preEpoch = inspectDragSource(root, preEpochRead)
  assert.equal(preEpoch.profile, newId)
  assert.equal(preEpoch.profiles.filter(profile => profile.status === 'admitted').length, 1)
  // Reconstruct only the independently reviewed inverse delta. Admission still
  // hashes the complete resulting prefix, not a normalized instrumentation shape.
  let oldSource = read('app/render-view.ts')
  const inverse = [
    [`            else if (nativeMetrics.cacheRepresentationChanged !== undefined)
              nativeMetrics.cacheRepresentationChanged++`,
     `            // Version 1 has no representation-only reason; do not report a
            // changed key when only packed/sparse storage eligibility changed.`],
    [`          // Observe the selected representation once per admitted instance, never
          // re-read eligibility inputs or add work inside vertex/triangle loops.
          const paths = ordinary?.paths
          if (paths) paths[numeric ? 'numeric' : packedTerrain ? 'packedVector' : 'sparseVector']++
`, ''],
  ]
  for (const [before, after] of inverse) {
    assert.equal(oldSource.split(before).length, 2)
    oldSource = oldSource.replace(before, after)
  }
  const old = inspectDragSource(root, path => path === 'app/render-view.ts' ? oldSource : preEpochRead(path))
  assert.equal(old.profile, oldId)
  assert.equal(old.profiles.filter(profile => profile.status === 'admitted').length, 1)
  // New epoch input plus pre-counter query inputs is not a reviewed whole route.
  const mixed = inspectDragSource(root, path => path === 'app/render-view.ts' ? oldSource : read(path))
  assert.equal(mixed.status, 'unsupported-source-contract')
  assert.equal(mixed.profile, null)
  // Neither an unknown observer variant nor modified eligibility/lifecycle is admitted.
  for (const [path, before, after] of [
    [inputPath, epochArgument, '      scene.fpsGraph?.samples,\n'],
    ['app/render-view.ts', "const paths = ordinary?.paths", "const paths = undefined"],
    ['app/render-view.ts', 'owned && scratch && runtimeTerrainPicking(this, object)', 'owned && scratch'],
    ['app/runtime-terrain-picking.ts', 'if (released.has(scene.view)) return', 'if (false) return'],
  ]) {
    assert.equal(read(path).split(before).length, 2)
    const rejected = inspectDragSource(root, name => name === path ? read(name).replace(before, after) : read(name))
    assert.equal(rejected.status, 'unsupported-source-contract')
    assert.equal(rejected.profile, null)
  }
})


test('RenderView CPU lease admission is additive, atomic and binds the new helper', () => {
  const read = preCpuRead
  const current = inspectDragSource(root, read), previous = inspectDragSource(root, preBothCpuRead)
  assert.equal(current.profile, renderCpuProfileId)
  assert.equal(previous.profile, 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1')
  for (const result of [current, previous]) {
    assert.equal(result.status, 'admitted')
    assert.equal(result.profiles.filter(profile => profile.status === 'admitted').length, 1)
  }
  const oldProfile = dragSourceProfiles.find(profile => profile.id === previous.profile)
  const next = dragSourceProfiles.find(profile => profile.id === current.profile)
  const changed = ['submission-key', 'query-entry', 'owned-terrain-entry']
  assert.equal(oldProfile.slices.length, 17)
  assert.equal(next.slices.length, 18)
  for (const [i, oldSlice] of oldProfile.slices.entries()) {
    assert.deepEqual({ ...next.slices[i], sha256: oldSlice.sha256 }, oldSlice)
    assert.equal(next.slices[i].sha256 !== oldSlice.sha256, changed.includes(oldSlice.id), oldSlice.id)
  }
  const historicalHashes = {
    'submission-key': '5e18c8d895f34b4b0f161c08993932ab41be6a4f53fe585d77641921e5c9c67a',
    'query-entry': '5344885e512cc204ccbd721fb5210977eb9b16efa7dc55de39ee72b235cb1bb8',
    'owned-terrain-entry': 'c69ef62767a9417c736a1cc6636fdfba48ee81e305a995d0001d06d760741e86',
  }
  for (const [id, hash] of Object.entries(historicalHashes))
    assert.equal(oldProfile.slices.find(slice => slice.id === id).sha256, hash)
  const helper = next.slices.at(-1)
  assert.equal(helper.id, 'pick-operation-leases')
  const sliceText = (source, spec) => source.slice(source.indexOf(spec.start), source.indexOf(spec.end))
  const path = 'app/render-view.ts', source = read(path), historical = preBothCpuRead(path)
  // Every nonempty proper mixture of the three old/new call sites is unreviewed.
  for (let mask = 1; mask < 7; mask++) {
    let mixed = source
    for (let i = 0; i < changed.length; i++) if (mask & (1 << i)) {
      const spec = next.slices.find(slice => slice.id === changed[i])
      mixed = mixed.replace(sliceText(source, spec), sliceText(historical, spec))
    }
    const result = inspectDragSource(root, name => name === path ? mixed : read(name))
    assert.equal(result.status, 'unsupported-source-contract')
    assert.equal(result.profile, null)
  }
  for (const [before, after] of [
    ['    this.pickOperationDepth++', '    this.pickOperationDepth += 2'],
    ['    this.painter.beginCpuLease()', '    /* missing painter lease */'],
    ['    this.painter.endCpuLease()', '    /* missing painter release */'],
    ['      return this.resolveCandidates(candidates)', '      return null'],
  ]) {
    assert.equal(source.split(before).length, 2)
    const result = inspectDragSource(root, name => name === path ? source.replace(before, after) : read(name))
    assert.equal(result.status, 'unsupported-source-contract')
    assert.ok(result.profiles.find(profile => profile.id === renderCpuProfileId).slices.find(slice => slice.id === helper.id).reason)
  }
})

test('disposed CPU source admission is a new atomic route, not a historical hash replacement', () => {
  const read = preRenderCpuRead
  const current = inspectDragSource(root, read), previous = inspectDragSource(root, preBothCpuRead)
  assert.equal(current.profile, cpuProfileId)
  assert.equal(previous.profile, 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1')
  for (const result of [current, previous]) {
    assert.equal(result.status, 'admitted')
    assert.equal(result.profiles.filter(profile => profile.status === 'admitted').length, 1)
  }
  const oldProfile = dragSourceProfiles.find(profile => profile.id === previous.profile)
  const newProfile = dragSourceProfiles.find(profile => profile.id === current.profile)
  assert.equal(newProfile.slices.length, 17)
  const changed = ['frame-order', 'terrain-producers']
  for (const [i, oldSlice] of oldProfile.slices.entries()) {
    const next = newProfile.slices[i]
    assert.deepEqual({ ...next, sha256: oldSlice.sha256 }, oldSlice, 'same exact slice boundaries')
    assert.equal(next.sha256 !== oldSlice.sha256, changed.includes(oldSlice.id), oldSlice.id)
  }
  assert.equal(oldProfile.slices.find(slice => slice.id === 'frame-order').sha256,
    '27ed72fea09df7d40a3e632ca56da9aa487a2df73dc950655f74bf1bb7b93adf')
  assert.equal(oldProfile.slices.find(slice => slice.id === 'terrain-producers').sha256,
    'dc14566b740986371148d787257891351a3ca0f7ea236cda730cba542f50a3ad')
  // Neither partial route is reviewed, even though each owner was seen before.
  for (const owner of ['app/scene.ts', 'app/scene-terrain-runtime.ts']) {
    const mixed = inspectDragSource(root, path => path === owner ? preBothCpuRead(path) : read(path))
    assert.equal(mixed.status, 'unsupported-source-contract'); assert.equal(mixed.profile, null)
  }
  // Omitting any single new boundary does not accidentally admit a historical route.
  for (const [owner, currentText, previousText] of cpuRetirementDeltas) {
    assert.equal(read(owner).split(currentText).length, 2)
    const missing = inspectDragSource(root, path => path === owner ? read(path).replace(currentText, previousText) : read(path))
    assert.equal(missing.status, 'unsupported-source-contract'); assert.equal(missing.profile, null)
  }
})

test('combined CPU admission preserves both siblings and composes exact historical readers', () => {
  const read = preLooseLogRead
  const epochId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1'
  for (const [reader, id] of [[read, combinedCpuProfileId], [preCpuRead, renderCpuProfileId],
    [preRenderCpuRead, cpuProfileId], [preBothCpuRead, epochId],
    [path => preRenderCpuRead(path, preCpuRead), epochId]]) {
    const result = inspectDragSource(root, reader)
    assert.equal(result.status, 'admitted'); assert.equal(result.profile, id)
    assert.equal(result.profiles.filter(profile => profile.status === 'admitted').length, 1)
  }
  const combined = dragSourceProfiles.find(profile => profile.id === combinedCpuProfileId)
  const render = dragSourceProfiles.find(profile => profile.id === renderCpuProfileId)
  const cpu = dragSourceProfiles.find(profile => profile.id === cpuProfileId)
  assert.equal(combined.slices.length, 18)
  for (const [i, slice] of combined.slices.entries()) {
    const sibling = ['frame-order', 'terrain-producers'].includes(slice.id) ? cpu : render
    assert.deepEqual(slice, sibling.slices[i], 'reuse the exact reviewed sibling boundary')
  }
  const changed = ['frame-order', 'terrain-producers', 'submission-key', 'query-entry', 'owned-terrain-entry']
  const part = (source, spec) => spec.start === null ? source
    : source.slice(source.indexOf(spec.start), source.indexOf(spec.end))
  // Test every five-slice old/new combination. Whole sibling groups stay valid;
  // partial groups do not. Old call sites with an unused new helper retain their
  // existing historical admission. This does not tighten that known boundary.
  for (let mask = 0; mask < 32; mask++) {
    const replacements = new Map()
    for (const [i, id] of changed.entries()) if (mask & (1 << i)) {
      const spec = combined.slices.find(slice => slice.id === id)
      const source = replacements.get(spec.path) ?? read(spec.path)
      replacements.set(spec.path, source.replace(part(read(spec.path), spec), part(preBothCpuRead(spec.path), spec)))
    }
    const result = inspectDragSource(root, path => replacements.get(path) ?? read(path))
    const expected = { 0: combinedCpuProfileId, 3: renderCpuProfileId, 28: cpuProfileId, 31: epochId }[mask]
    assert.equal(result.profile, expected ?? null, `mixed-route mask ${mask}`)
    assert.equal(result.status, expected ? 'admitted' : 'unsupported-source-contract', `mixed-route mask ${mask}`)
    if (expected) assert.equal(result.profiles.filter(profile => profile.status === 'admitted').length, 1)
    if (mask === 28 || mask === 31)
      assert.ok(replacements.get('app/render-view.ts').includes('  private beginPickOperation()'))
  }
})


test('composed source profile preserves both exact historical branch inventories', () => {
  assert.equal(new Set(dragSourceProfiles.map(profile => profile.id)).size, 13)
  for (const [ids, digest] of [
    [mainHistoricalIds, '82475e1af1f3f44c1bf7487ddee1071b912e565bee93c1dd31dce703245d5706'],
    [uiHistoricalIds, '782217be629beb86e707a7455d9ec0a7f9e56757816d3d232213dda7f2529444'],
  ]) {
    const historical = ids.map(id => dragSourceProfiles.find(profile => profile.id === id))
    assert.ok(historical.every(Boolean), 'Every historical ID remains present')
    assert.equal(createHash('sha256').update(JSON.stringify(historical)).digest('hex'), digest,
      'Original ordered branch profile data, boundaries and hashes remain byte-exact')
  }
  for (const [read, id] of [[mainHistoricalRead, looseLogProfileId], [uiHistoricalRead, resultClockId]]) {
    const result = inspectDragSource(root, read)
    assert.equal(result.status, 'admitted'); assert.equal(result.profile, id)
    assert.equal(result.profiles.filter(profile => profile.status === 'admitted').length, 1)
  }
})

test('historical atomic source route retains all22 reviewed owners without widening the gate', () => {
  const current = dragSourceProfiles.find(profile => profile.id === atomicProfileId)
  const main = dragSourceProfiles.find(profile => profile.id === looseLogProfileId)
  const ui = dragSourceProfiles.find(profile => profile.id === resultClockId)
  assert.equal(current.slices.length, 22)
  assert.equal(new Set(current.slices.map(slice => slice.id)).size, 22)
  for (const [index, inherited] of main.slices.entries()) {
    const next = current.slices[index]
    if (next.id === 'camera-producers') assert.deepEqual(next, ui.slices.find(slice => slice.id === next.id))
    else if (next.id === 'frame-order') {
      assert.deepEqual({ ...next, sha256: inherited.sha256 }, inherited)
      assert.equal(next.sha256, 'b21655fc1ea8787294beb80db52f8113a36a10f3fefe1ea4a0515a1b8f190cd1')
    } else assert.deepEqual(next, inherited)
  }
  assert.deepEqual(current.slices.slice(19), ui.slices.slice(17))
  const admitted = inspectDragSource(root, preCallbackRetirementRead)
  assert.equal(admitted.status, 'admitted'); assert.equal(admitted.profile, atomicProfileId)
  assert.equal(admitted.profiles.filter(profile => profile.status === 'admitted').length, 1)
  // All22 individual owner mutations, source bounds, unknown reads, and mutable
  // projection-kernel checks remain in the original shared admission tests.
  const scene = preCallbackRetirementRead('app/scene.ts')
  for (const [before, after] of [
    [guardedResultCallback, historicalResultCallback],
    [correctedResultClockFrame, ''],
    ['  resultClock = createResultClock()', '  resultClock = sharedClock'],
    ["import { createResultClock, advanceResultClock } from './result-session.ts'",
      "import { createResultClock, advanceResultClock } from './unreviewed-clock.ts'"],
  ]) {
    assert.equal(scene.split(before).length, 2, 'Exact new owner mutation boundary')
    const rejected = inspectDragSource(root, path => path === 'app/scene.ts'
      ? scene.replace(before, after) : preCallbackRetirementRead(path))
    assert.equal(rejected.status, 'unsupported-source-contract'); assert.equal(rejected.profile, null)
  }
  // Neither parent frame nor the old camera alone is the composed atomic route.
  for (const owner of ['app/scene.ts', cameraPath]) {
    const rejected = inspectDragSource(root, path => path === owner ? mainHistoricalRead(path) : preCallbackRetirementRead(path))
    assert.equal(rejected.status, 'unsupported-source-contract'); assert.equal(rejected.profile, null)
  }
  for (const [code, text] of [['ENOENT', 'missing'], ['EACCES', 'unreadable']]) {
    let failures = 0
    const rejected = inspectDragSource(root, path => {
      if (path === 'app/result-session.ts') { failures++; throw Object.assign(Error(text), { code }) }
      return preCallbackRetirementRead(path)
    })
    assert.equal(rejected.status, 'unsupported-source-contract'); assert.equal(rejected.profile, null)
    assert.equal(failures, 1)
  }
})

function observer() {
  const callbacks = new Map(), events = new Map(); let id = 0
  const recorder = { recentCount: 1, timestamp: 20 }, view = new RenderView()
  view.update(1240, 1000, { x: -107, z: -101 }, 0, 0, false, 1440)
  const scene = { fpsGraph: { samples: recorder }, view, cameraPosition: { x: 40192, y: 23808, angle: 0 },
    viewPoint: { x: -107, z: -101 }, cameraBearing: 0, viewZoom: 0, viewPreset: 0,
    pointerScreen: { clientX: 820, clientY: 380 }, pointerButtons: 2,
    world: { paused: true, turn: 70, inputMask: 0, flyby: { flags: 0 } }, modalSuspended: false, viewTransition: null,
    overviewActive: false, overviewStage: null, globeMorph: { active: false }, keys: new Set(), cameraMotion: { active: 0 }, resultCamera: { active: 0 },
    cameraVelocity: { turn: 0, forward: 0, side: 0 }, navigationButtons: () => 0, pointerGesture: { pointerId: 1, button: 2 },
    hoveredObject: null, tooltipInput: { picked: 54 } }
  const witness = Array(113).fill(0); witness[10] = 1; witness[19] = 22032
  const window = { __pndSnapshotGeometry: { witnessWidth: 113, writeWitness(buffer, offset) { for (let i = 0; i < 113; i++) buffer[offset + i] = witness[i] } }, testSceneRef: { current: scene },
    addEventListener: (name, fn, options) => { assert.equal(options.capture, true); events.set(name, fn) }, removeEventListener: name => events.delete(name) }
  const context = vm.createContext({ window, performance: { now: () => 45 }, Float64Array,
    requestAnimationFrame: fn => { callbacks.set(++id, fn); return id }, cancelAnimationFrame: i => callbacks.delete(i) })
  vm.runInContext(`(${installSnapshotDragObserver.toString()})()`, context)
  const api = window.__pndSnapshotObserver
  const input = (event = {}) => events.get('pointermove')({ type: 'pointermove', clientX: 821, clientY: 380, buttons: 2, isTrusted: true, ...event })
  const tick = (serial, now = serial * 20) => { recorder.recentCount = serial; recorder.timestamp = now
    const list = [...callbacks.values()]; callbacks.clear(); list.forEach(fn => fn(now)) }
  const move = () => { scene.cameraPosition.angle = 1; scene.cameraBearing = Math.PI / 1024; scene.pointerScreen.clientX = 821
    view.update(1240, 1000, scene.viewPoint, scene.cameraBearing, 0, false, 1440); witness[10] = 2; witness[19] = 21636 }
  return { context, window, api, witness, scene, recorder, input, tick, move, callbacks, events, arm: () => api.arm({ geometryWitness: [...witness], type: 'pointermove', x: 821, y: 380, buttons: 2 }) }
}

test('separate held-drag observer binds synchronous old input, exact next sample and all effective projection values', () => {
  const o = observer(); o.arm(); o.input(); o.move()
  for (let i = 2; i <= 5; i++) o.tick(i)
  const block = o.api.finish(4)
  assert.equal(block.event.timestampMs, 45); assert.equal(block.frames[0].timestampMs, 40)
  assert.equal(block.event.beforePose[2], 0); assert.equal(block.event.geometryWitness[19], 22032)
  for (const frame of block.frames) { assert.equal(frame.pose.length, 72); assert.equal(frame.pose[2], 1); assert.equal(frame.pose[27], 54); assert.equal(frame.geometryWitness[19], 21636) }
  assert.notDeepEqual(block.event.beforePose.slice(55, 64), block.frames[0].pose.slice(55, 64))
  assert.equal(o.api.stop().error, null); assert.equal(o.events.size, 0); assert.equal(o.callbacks.size, 0)
})

test('held-drag observer never accepts stale pre-input geometry, duplicate input, missing first sample or changed later prefix', () => {
  for (const change of [o => { o.witness[10]++; o.input() }, o => { o.input({ buttons: 0 }) },
    o => { o.input(); o.input() }, o => { o.input(); o.tick(3) },
    o => { o.input(); o.move(); o.tick(2); o.witness[10]++; o.tick(3) },
    o => { o.input(); o.scene.fpsGraph.samples = { ...o.recorder }; o.tick(2) }, o => { o.input(); o.tick(1200) }]) {
    const o = observer(); o.arm(); change(o); assert.throws(() => o.api.ready(4)); assert.ok(o.api.stop().error)
  }
})

test('projection shape changes fail admission without traversing extra fields on every RAF', () => {
  const o = observer(); o.scene.view.projection.extra = 1; assert.throws(() => o.arm(), /projection input shape/); o.api.stop()
})

test('a last-move projection expansion is rejected outside selected callbacks, not silently truncated', () => {
  for (const mutate of [p => { p.extra = 1 }, p => p.matrix.push(1), p => p.bounds.push(1)]) {
    const o = observer(); o.arm(); o.input(); o.move(); mutate(o.scene.view.projection)
    for (let serial = 2; serial <= 5; serial++) o.tick(serial)
    assert.throws(() => o.api.finish(4), /projection input shape/); o.api.stop()
  }
})

test('production held-right pointer callback calls native object query before ordinary terrain and leaves settled callbacks idle', async t => {
  const { tooltipCallerFixture } = await import('./support/tooltip-scene.mjs')
  const { scene, point } = await tooltipCallerFixture(t)
  const { updatePointerFrame, pointerMove } = await import('../app/scene-input-runtime.ts')
  const { createPointerFrameMetrics } = await import('../app/pointer-frame-metrics.ts')
  const unit = scene.world.units.find(person => person.hp > 0)
  assert.ok(unit)
  const calls = []; let prefix = 'old'
  // Supplied leaf queries expose caller order, not browser or geometry parity.
  scene.picking.pick = () => { calls.push(['native', prefix]); return unit.id }
  scene.pick = () => { calls.push(['ordinary', prefix]); prefix = 'new'; return null }
  scene.pointerScreen = { ...point }; scene.pointerButtons = 2; scene.pointerState = ''
  scene.cameraPosition = { x: 40192, y: 23808, angle: 0 }; scene.cameraVelocity = { turn: 0, forward: 0, side: 0 }
  scene.pointerGesture = { pointerId: 1, button: 2 }; scene.dragLast = { x: point.clientX, y: point.clientY }
  scene.cameraMotion = { active: 0 }; scene.captureCamera = () => {}; scene.updateView = () => {}
  pointerMove(scene, { pointerId: 1, buttons: 2, clientX: point.clientX + 1, clientY: point.clientY })
  assert.equal(scene.cameraPosition.angle, 1); assert.deepEqual(scene.cameraVelocity, { turn: 0, forward: 0, side: 0 })
  const first = createPointerFrameMetrics(true); updatePointerFrame(scene, 100, first)
  assert.deepEqual(calls, [['native', 'old'], ['ordinary', 'old']]); assert.equal(prefix, 'new')
  assert.equal(scene.hoveredObject, null); assert.equal(scene.tooltipInput.picked, unit.id)
  assert.equal(first.objectPickCalls, 1); assert.equal(first.terrainPickCalls, 1)
  const settled = createPointerFrameMetrics(true); updatePointerFrame(scene, 120, settled)
  assert.equal(calls.length, 2); assert.equal(settled.objectPickCalls, 0); assert.equal(settled.terrainPickCalls, 0)
})

test('only comparative runner opt-in retains completed stable phases after the final added capture fails', async () => {
  const { retainStablePhasesAfterDragFailure } = await import('../scripts/browser-performance/snapshot-capture.mjs')
  const make = () => ({ shard: 'world', status: 'incomplete', phases: [
    { name: 'native-hover', status: 'passed', summaryFile: 'native.json' },
    { name: 'ordinary-hover', status: 'passed', summaryFile: 'ordinary.json' },
    { name: 'native-view-drag-warm', status: 'incomplete', rawFile: 'failed-raw.json', failure: 'first callback missing' },
  ] })
  const report = make(), prior = structuredClone(report.phases)
  assert.equal(retainStablePhasesAfterDragFailure(report, true), true)
  assert.equal(report.status, 'passed-with-incomplete-drag'); assert.deepEqual(report.phases, prior)
  for (const modify of [r => { r.phases[0].status = 'incomplete' }, r => { r.phases.pop() },
    r => { r.shard = 'recovery' }, r => { r.phases[2].name = 'ordinary-hover' }]) {
    const value = make(); modify(value); const before = JSON.stringify(value)
    assert.equal(retainStablePhasesAfterDragFailure(value, true), false); assert.equal(JSON.stringify(value), before)
  }
  const smoke = make(); assert.equal(retainStablePhasesAfterDragFailure(smoke, false), false)
  assert.equal(smoke.status, 'incomplete')
})

test('observer stop records absolute epoch and rejects replacement or reset even before a subsequent RAF', () => {
  const valid = observer(); valid.arm(); valid.input(); valid.move()
  for (let serial = 2; serial <= 5; serial++) valid.tick(serial)
  const result = valid.api.stop()
  assert.deepEqual(JSON.parse(JSON.stringify(result.recorder)), { startSerial: 1, startTimestampMs: 20, endSerial: 5, endTimestampMs: 100 })
  for (const change of [o => { o.scene.fpsGraph.samples = { ...o.recorder } }, o => { o.recorder.recentCount = 0 }]) {
    const value = observer(); change(value); assert.equal(value.api.stop().error, 'Recorder epoch changed')
  }
})

test('two fixed six-input observers retain one absolute recorder epoch and never select a later first callback', () => {
  const o = observer(), sequences = []
  let serial = 1
  for (let sequence = 0; sequence < 2; sequence++) {
    const api = o.window.__pndSnapshotObserver
    for (let step = 0; step < 6; step++) {
      const angle = (step + 1) % 2, x = 820 + angle
      api.arm({ geometryWitness: [...o.witness], type: 'pointermove', x, y: 380, buttons: 2 })
      o.input({ clientX: x }); o.scene.cameraPosition.angle = angle; o.scene.cameraBearing = angle * Math.PI / 1024
      o.scene.pointerScreen.clientX = x
      o.scene.view.update(1240, 1000, o.scene.viewPoint, o.scene.cameraBearing, 0, false, 1440)
      o.witness[10]++; o.witness[19] = angle ? 21636 : 22032
      for (let i = 0; i < 4; i++) o.tick(++serial)
      const block = api.finish(4)
      assert.equal(block.event.sequence, step + 1)
      assert.equal(block.frames[0].serial, sequence * 24 + step * 4 + 2)
      assert.equal(block.frames[0].serial, block.event.anchorSerial + 1)
    }
    sequences.push(api.stop())
    if (sequence === 0) vm.runInContext(`(${installSnapshotDragObserver.toString()})()`, o.context)
  }
  assert.equal(sequences[0].recorder.endSerial, 25); assert.equal(sequences[1].recorder.startSerial, 25)
  assert.equal(sequences[0].recorder.endTimestampMs, sequences[1].recorder.startTimestampMs)
  assert.equal(o.recorder.recentCount, 49); assert.equal(o.scene.cameraPosition.angle, 0)
  for (const result of sequences) { assert.equal(result.error, null); assert.equal(result.events.length, 6); assert.equal(result.frames.length, 24) }
})


test('loose-log source admission is additive and binds the exact shared queue owner', () => {
  const read = mainHistoricalRead
  const current = inspectDragSource(root, read), previous = inspectDragSource(root, preLooseLogRead)
  assert.equal(current.profile, looseLogProfileId)
  assert.equal(previous.profile, combinedCpuProfileId)
  for (const result of [current, previous]) {
    assert.equal(result.status, 'admitted')
    assert.equal(result.profiles.filter(profile => profile.status === 'admitted').length, 1)
  }
  const oldProfile = dragSourceProfiles.find(profile => profile.id === combinedCpuProfileId)
  const profile = dragSourceProfiles.find(profile => profile.id === looseLogProfileId)
  assert.equal(oldProfile.slices.length, 18)
  assert.equal(profile.slices.length, 19)
  for (const [i, oldSlice] of oldProfile.slices.entries()) {
    assert.deepEqual({ ...profile.slices[i], sha256: oldSlice.sha256 }, oldSlice)
    assert.equal(profile.slices[i].sha256 !== oldSlice.sha256, oldSlice.id === 'native-route')
  }
  assert.equal(oldProfile.slices.find(slice => slice.id === 'native-route').sha256,
    '80d43ac8561bb04fbc6f4491ad9a8d0e91395cb63bf08ce1997173298bb3ccc9')
  assert.equal(profile.slices.at(-1).id, 'resource-queue-owner')
  for (const helper of [preLooseLogRead('app/world-picking.ts'), `${read('app/world-picking.ts')}\n`, '']) {
    const result = inspectDragSource(root, path => path === 'app/world-picking.ts' ? helper : read(path))
    assert.equal(result.status, 'unsupported-source-contract')
    assert.equal(result.profile, null)
  }
  // A new resource route is not admitted with any historical CPU-owner mixture.
  for (const reader of [preCpuRead, preRenderCpuRead, preBothCpuRead]) {
    const result = inspectDragSource(root, path => path === 'app/scene-picking.ts' || path === 'app/world-picking.ts'
      ? read(path) : reader(path))
    assert.equal(result.status, 'unsupported-source-contract')
    assert.equal(result.profile, null)
  }
  // Preserve the historical boundary: an unused new helper was not hashed there.
  assert.equal(inspectDragSource(root, path => path === 'app/scene-picking.ts'
    ? preLooseLogRead(path) : read(path)).profile, combinedCpuProfileId)
})


test('callback-retirement source profile adds exact owners without replacing historical identities', () => {
  const previous = dragSourceProfiles.find(profile => profile.id === atomicProfileId)
  const current = dragSourceProfiles.find(profile => profile.id === callbackRetirementProfileId)
  assert.equal(previous.slices.length, 22)
  assert.equal(current.slices.length, 24)
  assert.equal(new Set(current.slices.map(slice => slice.id)).size, 24)
  for (const [index, inherited] of previous.slices.entries()) {
    const next = current.slices[index]
    assert.deepEqual({ ...next, sha256: inherited.sha256 }, inherited)
    assert.equal(next.sha256 !== inherited.sha256, ['camera-producers', 'frame-order'].includes(next.id))
  }
  assert.deepEqual(current.slices.slice(22).map(slice => slice.id),
    ['tooltip-retirement-owner', 'scene-current-owner'])
  for (const [read, expected] of [[rawSnapshotRead, callbackRetirementProfileId],
    [preCallbackRetirementRead, atomicProfileId]]) {
    const result = inspectDragSource(root, read)
    assert.equal(result.status, 'admitted'); assert.equal(result.profile, expected)
    assert.equal(result.profiles.filter(profile => profile.status === 'admitted').length, 1)
  }
  // Omission of any individual guard never admits the current composition.
  for (const [owner, currentText, previousText] of callbackRetirementDeltas) {
    const source = rawSnapshotRead(owner)
    assert.equal(source.split(currentText).length, 2)
    const rejected = inspectDragSource(root, path => path === owner
      ? source.replace(currentText, previousText) : rawSnapshotRead(path))
    assert.equal(rejected.status, 'unsupported-source-contract')
    assert.equal(rejected.profile, null)
  }
  // The new profile binds the actual callback producer and current-owner helper,
  // not just the call sites. Historical profiles retain their prior boundaries.
  for (const [path, before, after] of [
    ['app/scene-tooltip-runtime.ts', 'if (!scene.isCurrent()) return', 'if (false) return'],
    ['app/scene.ts', 'return !this.disposed && (!this.presentationBinding || this.presentationBinding.isCurrent())', 'return true'],
  ]) {
    const source = rawSnapshotRead(path)
    assert.equal(source.split(before).length, 2)
    const rejected = inspectDragSource(root, owner => owner === path
      ? source.replace(before, after) : rawSnapshotRead(owner))
    assert.equal(rejected.status, 'unsupported-source-contract'); assert.equal(rejected.profile, null)
  }
})
