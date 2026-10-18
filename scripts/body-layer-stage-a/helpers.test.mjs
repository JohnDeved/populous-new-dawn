import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { transformStart, installStartLatch } from './start-latch.mjs'
import { bytes } from './io.mjs'
import { loadSetup } from './setup-adapter.mjs'
import { checkpointCodec } from '../../scripts/tutorial-browser/checkpoint-codec.mjs'
// This ignored test lives two levels below the repository. No application, build,
// browser, scene constructor, gameplay callback or measurement is executed.
const root = new URL('../../', import.meta.url).pathname
for (const revision of [
  '5087f2e805097665c4fdcce657553db3a693bb76',
  '8bd14a84e34545f9a0f0b1fe5c1ebbf8267e5f59',
])
  test(`exact start transform ${revision}`, () => {
    const original = execFileSync('git', ['show', `${revision}:app/scene.ts`], {
      cwd: root,
      encoding: 'utf8',
    })
    const result = transformStart(original, revision)
    assert.equal(result.code.split('globalThis.__bodyStartLatch(this)').length, 2)
    assert.equal(result.code.split('requestAnimationFrame(this.animate)').length, 3)
    assert.equal(
      result.code.replace(
        'globalThis.__bodyStartLatch(this)',
        'requestAnimationFrame(this.animate)'
      ),
      original
    )
    assert.throws(() => transformStart(original + '\n', revision), /Unexpected original/)
  })
test('latch detects callbacks and every World mutation before release', () => {
  globalThis.window = {}
  installStartLatch(checkpointCodec)
  const scene = {
    previous: null,
    frame: 0,
    fpsGraph: null,
    world: { paused: true, clock: { elapsed: 0 }, values: new Float32Array([-0, 1]) },
  }
  assert.equal(window.__bodyStartLatch(scene), 0)
  window.__bodyVerifyStart()
  scene.world.clock.elapsed = 1
  assert.throws(() => window.__bodyVerifyStart(), /World changed/)
  scene.world.clock.elapsed = 0
  scene.world.values[0] = 0
  assert.throws(() => window.__bodyVerifyStart(), /World changed/)
  scene.world.values[0] = -0
  scene.previous = 0
  assert.throws(() => window.__bodyVerifyStart(), /Callback escaped/)
  scene.previous = null
  assert.throws(() => window.__bodyStartLatch(scene), /More than one/)
  delete globalThis.window
})
test('asset symlinks are not copied or charged as generated evidence', () => {
  const dir = mkdtempSync(join(tmpdir(), 'body-budget-'))
  writeFileSync(join(dir, 'one'), Buffer.alloc(11))
  symlinkSync(dir, join(dir, 'alias'))
  assert.equal(bytes(dir), 11)
})
test('setup adaptation is bound and only adds the pre-input observer', async () => {
  const { loadSnapshot, binding } = await loadSetup(root)
  assert.equal(typeof loadSnapshot, 'function')
  assert.equal(
    binding.originalSha256,
    '4bb9b653f0116a8d40bad6c61465eb6fba79a7cfa295c27dacabd7a02e1f000d'
  )
  assert.match(loadSnapshot.toString(), /window\.__bodyVerifyStart/)
})

test('comparison checks lossless states, actual counters, pixels and preserves mismatch evidence', async () => {
  const { gzipSync } = await import('node:zlib'),
    { readFileSync, existsSync } = await import('node:fs')
  const { sha, save } = await import('./io.mjs'),
    { comparePair } = await import('./compare.mjs')
  const out = mkdtempSync(join(tmpdir(), 'body-comparator-')),
    a = join(out, 'a'),
    b = join(out, 'b')
  const { mkdirSync } = await import('node:fs')
  mkdirSync(a)
  mkdirSync(b)
  const state = {
    world: { value: -0 },
    layers: [
      {
        id: 7,
        layerIndex: 0,
        groupVisible: true,
        visible: true,
        materialVisible: true,
        transparent: false,
        opacity: 1,
        depthWrite: true,
        range: [0, 1],
      },
    ],
    depth: [2],
  }
  const pixels = Buffer.from([1, 2, 3, 255]),
    bytes = Buffer.from(
      JSON.stringify({ state: checkpointCodec(state), picks: checkpointCodec([]) })
    )
  for (const path of [a, b]) {
    writeFileSync(join(path, 'p.gz'), gzipSync(pixels))
    writeFileSync(join(path, 's.gz'), gzipSync(bytes))
    writeFileSync(
      join(path, 'initial-state.json.gz'),
      gzipSync(Buffer.from(JSON.stringify(checkpointCodec(state))))
    )
  }
  const row = candidate => ({
    width: 1,
    height: 1,
    pixelFile: 'p.gz',
    pixelSha256: sha(pixels),
    stateFile: 's.gz',
    stateSha256: sha(bytes),
    counters: { calls: candidate ? 9 : 10, triangles: candidate ? 18 : 20, points: 0, lines: 0 },
  })
  for (const [path, candidate] of [
    [a, false],
    [b, true],
  ])
    save(join(path, 'report.json'), {
      status: 'passed',
      cohort: 'camera',
      environment: {},
      browserVersion: 'test-only',
      browserBinary: { sha256: 'test-only' },
      initialStateSha256: sha(Buffer.from(JSON.stringify(checkpointCodec(state)))),
      bootstrap: row(candidate),
      steps: Array.from({ length: 28 }, () => row(candidate)),
      controls: Array.from({ length: 24 }, () => ({ ...row(false), name: 'overview' })),
    })
  assert.equal(comparePair(a, b, out, checkpointCodec).length, 53)
  // Exercise the positive/non-vacuous sharing and callback counter contracts.
  const aReport = JSON.parse(readFileSync(join(a, 'report.json'))),
    bReport = JSON.parse(readFileSync(join(b, 'report.json')))
  for (const report of [aReport, bReport]) {
    const r = report.controls[0]
    r.name = 'shared-points'
    r.counters.points = 1
    r.extra = {
      target: { id: 7, layerIndex: 0 },
      freshBody: true,
      frustumCulled: false,
      visible: true,
      materialVisible: true,
      center: [0.5, 0.5],
      calls: 0,
    }
  }
  save(join(a, 'report.json'), aReport)
  save(join(b, 'report.json'), bReport)
  assert.equal(comparePair(a, b, out, checkpointCodec).length, 53)
  for (const report of [aReport, bReport]) report.controls[0].counters.points = 0
  save(join(a, 'report.json'), aReport)
  save(join(b, 'report.json'), bReport)
  assert.throws(() => comparePair(a, b, out, checkpointCodec), /Points must participate/)
  for (const report of [aReport, bReport]) {
    report.controls[0].counters.points = 1
    report.controls[0].name = 'points-hook'
  }
  save(join(a, 'report.json'), aReport)
  save(join(b, 'report.json'), bReport)
  assert.throws(() => comparePair(a, b, out, checkpointCodec), /Actual material callback/)
  for (const report of [aReport, bReport]) report.controls[0].extra.calls = 1
  save(join(a, 'report.json'), aReport)
  save(join(b, 'report.json'), bReport)
  assert.equal(comparePair(a, b, out, checkpointCodec).length, 53)

  const report = JSON.parse(readFileSync(join(b, 'report.json')))
  const altered = Buffer.from([9, 2, 3, 255])
  writeFileSync(join(b, 'p.gz'), gzipSync(altered))
  for (const r of [report.bootstrap, ...report.steps, ...report.controls])
    r.pixelSha256 = sha(altered)
  save(join(b, 'report.json'), report)
  assert.throws(() => comparePair(a, b, out, checkpointCodec), /RGBA mismatch/)
  assert.ok(existsSync(join(out, 'camera-0-diff.png')))
  assert.match(readFileSync(join(out, 'comparison-camera.json'), 'utf8'), /changedPixels/)
  writeFileSync(join(b, 'p.gz'), gzipSync(pixels))
  for (const r of [report.bootstrap, ...report.steps, ...report.controls])
    r.pixelSha256 = sha(pixels)
  const wrong = Buffer.from(
    JSON.stringify({
      state: checkpointCodec({ ...state, world: { value: 0 } }),
      picks: checkpointCodec([]),
    })
  )
  writeFileSync(join(b, 's.gz'), gzipSync(wrong))
  for (const r of [report.bootstrap, ...report.steps, ...report.controls])
    r.stateSha256 = sha(wrong)
  save(join(b, 'report.json'), report)
  assert.throws(() => comparePair(a, b, out, checkpointCodec), /Complete World/)
})

test('canonical window admission keeps actual HUD canvas dimensions distinct', async () => {
  const { protocol } = await import('./protocol.mjs')
  const { protocol: rejected } = await import('./rejected-controls.fixture.mjs')
  const { assertSnapshotAdmission } =
    await import('../../scripts/browser-performance/snapshot-setup.mjs')
  const fixture = {
    receipt: { admittedSimulationSha256: 'test-only', selected: [], focus: { x: 0, z: 0 } },
  }
  const state = {
    level: 2,
    paused: true,
    sameScene: true,
    sceneConnected: true,
    latchRemoved: true,
    visibility: 'visible',
    inputMask: 0,
    flybyActive: false,
    modalSuspended: false,
    simulationSha256: 'test-only',
    selected: [],
    mode: null,
    viewport: {
      ...protocol.viewport,
      devicePixelRatio: 1,
      canvas: { left: 320, top: 0, width: 1120, height: 1000 },
    },
    camera: {
      viewPoint: { x: 0, z: 0 },
      position: { x: 2048, y: 63488, angle: 0 },
      presetMatches: true,
      projection: { width: 1120, height: 1000 },
      bearing: 0,
      preset: 0,
      zoom: 0,
      transition: false,
      overview: false,
      pointerGesture: false,
      navigation: 0,
      motion: 0,
      resultMotion: 0,
      pointerButtons: 0,
      preview: null,
      keys: [],
      velocity: { turn: 0, forward: 0, side: 0 },
    },
  }
  assert.throws(() =>
    assertSnapshotAdmission(
      { ...state, viewport: { ...state.viewport, ...rejected.viewport } },
      fixture
    )
  )
  assert.doesNotThrow(() => assertSnapshotAdmission(state, fixture))
  assert.notEqual(state.viewport.width, state.viewport.canvas.width)
  assert.equal(protocol.drawingBuffer.mode, 'actual-hud-layout')
})

test('each Points control creates a fresh body and supplies actual SpriteMaterial draw inputs', async () => {
  const T = await import('three'),
    { controlRender } = await import('./page.mjs')
  const { controlRender: rejected } = await import('./rejected-controls.fixture.mjs')
  const run = control => {
    let created = 0
    const unit = { id: 7, heading: 0 },
      groups = new Map(),
      world = { units: [unit], paused: true },
      rootScene = new T.Scene()
    const factory = () => {
      created++
      const g = new T.Group(),
        layer = new T.Sprite(new T.SpriteMaterial({ transparent: false }))
      g.userData = { layers: [layer], drawFlags: 0 }
      g.add(layer)
      groups.set(7, g)
      return g
    }
    factory()
    const scene = {
      world,
      unitMeshes: groups,
      scene: rootScene,
      frame: 0,
      container: { style: {} },
      renderer: { domElement: { style: {} }, setSize() {}, info: { render: { points: 0 } } },
      view: { painter: { depth: () => 3 } },
      updateView() {},
      updateUnitsFrame() {
        if (!world.units.length) groups.delete(7)
        else if (!groups.has(7)) factory()
      },
      renderSceneFrame() {
        const extra = window.__bodyExtra
        assert.ok(
          extra.center?.isVector2,
          'SpriteMaterial Points must have center before rendering'
        )
        assert.equal(extra.frustumCulled, false)
        scene.renderer.info.render.points = 1
        extra.material.onBeforeRender()
      },
    }
    globalThis.window = {
      testSceneRef: { current: scene },
      __bodyThree: T,
      __bodyStep: 0,
      __bodyCapture: () => ({ created, group: groups.get(7), extra: window.__bodyExtra }),
    }
    globalThis.cancelAnimationFrame = () => {}
    const rows = []
    try {
      for (const name of ['shared-points', 'ignored-points', 'points-hook'])
        rows.push(control({ name, size: { width: 640, height: 480 } }))
      return rows
    } finally {
      delete globalThis.window
      delete globalThis.cancelAnimationFrame
    }
  }
  assert.throws(() => run(rejected), /SpriteMaterial Points must have center/)
  const rows = run(controlRender)
  assert.deepEqual(
    rows.map(r => r.created),
    [2, 3, 4]
  )
  assert.notEqual(rows[0].group, rows[1].group)
  assert.ok(rows[1].extra.userData.nativeIgnore)
  assert.ok(rows[2].extra.userData.calls > 0)
})

test('generated TSX entry installs the latch and renders once; preserved ASI entry fails', async () => {
  const { readFileSync } = await import('node:fs')
  const { resolve } = await import('node:path')
  const { runInNewContext } = await import('node:vm')
  const ts = await import('typescript')
  const buildSource = readFileSync(new URL('./build.mjs', import.meta.url), 'utf8')
  const template = buildSource.match(/`import \{ createRoot \}[\s\S]*?`/g)
  assert.equal(template?.length, 1)
  const entry = new Function(
    'resolve',
    'source',
    'installStartLatch',
    'checkpointCodec',
    `return ${template[0]}`
  )(resolve, '/source', installStartLatch, checkpointCodec)
  const oldBuild = execFileSync(
    'git',
    ['show', 'f8e1769874b19da230b2ae5dcc25983bcec60e68:scripts/body-layer-stage-a/build.mjs'],
    { cwd: root, encoding: 'utf8' }
  )
  const oldTemplate = oldBuild.match(/`import \{ createRoot \}[\s\S]*?`/g)
  assert.equal(oldTemplate?.length, 1)
  const oldEntry = new Function(
    'resolve',
    'source',
    'installStartLatch',
    'checkpointCodec',
    `return ${oldTemplate[0]}`
  )(resolve, '/source', installStartLatch, checkpointCodec)
  function execute(source) {
    let renders = 0
    const window = {},
      three = { sentinel: true }
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText
    runInNewContext(compiled, {
      window,
      exports: {},
      document: { getElementById: () => ({}) },
      require(id) {
        if (id === 'three') return three
        if (id === 'react-dom/client')
          return {
            createRoot: () => ({
              render() {
                assert.equal(typeof window.__bodyStartLatch, 'function')
                renders++
              },
            }),
          }
        if (id === 'react/jsx-runtime') return { jsx: (...args) => args }
        if (id === '/source/app/page.tsx') return { default: function Home() {} }
        if (id === '/source/app/globals.css') return {}
        throw Error(`Unexpected entry import ${id}`)
      },
    })
    assert.equal(renders, 1)
    assert.equal(window.__bodyThree, three)
    assert.equal(typeof window.__bodyVerifyStart, 'function')
  }
  assert.throws(() => execute(oldEntry), /Object.assign\(\.\.\.\) is not a function/)
  execute(entry)
})
