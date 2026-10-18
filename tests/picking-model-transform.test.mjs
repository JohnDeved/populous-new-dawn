import assert from 'node:assert/strict'
import test from 'node:test'
import { modelMatrix, modelPoint } from '../app/projection.ts'
import { preparePickingModelTransform } from '../app/picking-model-transform.ts'

test('private numeric kernel matches unchanged public modelPoint across overflow and animated bases', () => {
  const values = [-2147483648, -65537, -1, -0, 0, 1.5, 32768, 2147483647, NaN, Infinity]
  for (const angles of [
    [0, 0, 0],
    [511, 256, 128],
    [1024, -64, 7],
  ]) {
    const basis = modelMatrix(...angles),
      transform = preparePickingModelTransform(basis)
    for (const x of values)
      for (const y of values)
        for (const scale of [0, 1, 256, 1024]) {
          const raw = [x, y, -x],
            origin = { x: 1, y: 2, z: 3 }
          assert.deepEqual(transform(raw, scale, origin), modelPoint(raw, scale, basis, origin))
        }
  }
  const basis = modelMatrix(0),
    transform = preparePickingModelTransform(basis)
  const expected = transform([100, 200, 300], 256, { x: 0, y: 0, z: 0 })
  basis[0] += 12345
  assert.deepEqual(
    transform([100, 200, 300], 256, { x: 0, y: 0, z: 0 }),
    expected,
    'only immutable numeric coefficients retained'
  )
  assert.notDeepEqual(
    preparePickingModelTransform(basis)([100, 200, 300], 256, { x: 0, y: 0, z: 0 }),
    expected
  )
  expected.x = 999
  assert.notEqual(
    transform([100, 200, 300], 256, { x: 0, y: 0, z: 0 }).x,
    999,
    'results remain fresh and caller-owned'
  )
})

test('raw map hooks and origin getter ordering remain unchanged', () => {
  const basis = modelMatrix(511, 256, 128),
    transform = preparePickingModelTransform(basis)
  function observe(fn) {
    const reads = [],
      raw = [100, 200, 300]
    raw.map = function (callback) {
      reads.push('map')
      const p = Array.prototype.map.call(this, callback)
      return new Proxy(p, {
        get(target, key) {
          reads.push('p.' + String(key))
          return target[key]
        },
      })
    }
    const origin = Object.fromEntries(['x', 'y', 'z'].map((key, i) => [key, i]))
    for (const key of ['x', 'y', 'z'])
      Object.defineProperty(origin, key, {
        get() {
          reads.push('origin.' + key)
          return 1
        },
      })
    return { result: fn(raw, 256, origin), reads }
  }
  assert.deepEqual(
    observe(transform),
    observe((raw, scale, origin) => modelPoint(raw, scale, basis, origin))
  )
})

// Frozen main 9cd97887 model caller; public helper remains the independent oracle.
const legacyModelSource =
  "  model(mesh: THREE.Mesh, viewKey: string) {\n    const s = this.scene,\n      g = mesh.parent!,\n      meta = g.userData,\n      shape = mesh.userData\n    const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute\n    mesh.updateWorldMatrix(true, false)\n    const key = [\n      viewKey,\n      position.version,\n      ...mesh.matrixWorld.elements,\n      shape.nativeModel,\n      shape.nativeResource?.bank,\n      shape.stage,\n      shape.nativeSize,\n      meta.nativeHeading,\n      meta.nativeTilt,\n      meta.nativeRoll,\n    ].join(',')\n    const cached = this.models.get(mesh)\n    if (cached?.key === key && cached.position === position) return cached.commands\n    const resource =\n        (shape.nativeResource as NativeModelResource | undefined) ??\n        nativeModelResource(shape.nativeModel),\n      { data } = resource,\n      { stage } = shape\n    const origin = new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld)\n    const nativeOrigin = s.view.relative(origin, (origin.y * 128) / 45)\n    const basis = modelMatrix(meta.nativeHeading ?? 0, meta.nativeTilt ?? 0, meta.nativeRoll ?? 0)\n    const points = new Map<string, ReturnType<typeof projectPoint>>()\n    const commands: ModelCommand[] = []\n    let rendered = 0,\n      vertex = 0,\n      faceNumber = 0\n    const id = meta.building ?? meta.shrine ?? meta.point?.id\n    for (let face = 0; face < data.tiles.length; face++) {\n      const count = data.faces[face * 2] === 3 ? 3 : 6,\n        flags = data.faces[face * 2 + 1]\n      const visible = modelFaceVisible(data, face, stage)\n      const corners = []\n      for (let i = 0; i < count; i++) {\n        const raw = visible\n          ? [position.getX(rendered + i), position.getY(rendered + i), position.getZ(rendered + i)]\n          : data.p.slice((vertex + i) * 3, (vertex + i + 1) * 3)\n        raw[0] = Math.round(raw[0] * data.scale * 3)\n        raw[1] = Math.round(raw[1] * data.scale * 3)\n        raw[2] = Math.round(-raw[2] * data.scale * 3)\n        const vertexKey = raw.join(',')\n        let p = points.get(vertexKey)\n        if (!p) {\n          p = projectPoint(\n            modelPoint(raw, shape.nativeSize ?? data.scale, basis, nativeOrigin),\n            s.view.projection\n          )\n          points.set(vertexKey, p)\n        }\n        corners.push(p)\n      }\n      if (stage === 4 || flags & (1 << stage))\n        for (let i = 0; i < count; i += 3) {\n          const triangle = corners.slice(i, i + 3)\n          const front = modelTriangleVisible(\n            triangle,\n            s.view.projection.width,\n            s.view.projection.height\n          )\n          if (stage === 4 && !front) continue\n          // Construction submits both sides, reversing rear-facing triangles.\n          if (stage !== 4 && !front) triangle.reverse()\n          commands.push({\n            kind: 'model',\n            id,\n            points: triangle.map(p => ({ x: p.screenX, y: p.screenY })),\n            bucket: polygonBucket(\n              triangle.map(p => p.z),\n              data.biases[face]\n            ),\n            face: faceNumber + i / 3,\n          })\n        }\n      if (visible) rendered += count\n      vertex += count\n      faceNumber += count / 3\n    }\n    commands.push({\n      kind: 'bounds',\n      id,\n      ...modelHitBounds([...points.values()]),\n      face: faceNumber,\n    })\n    this.models.set(mesh, { key, position, commands })\n    return commands\n  }\n\n"

test('actual ordered model commands and picks match frozen caller through staged and animated inputs', async t => {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  await loadSceneFixture()
  const THREE = await import('three')
  const { stripTypeScriptTypes } = await import('node:module')
  const { ScenePicking } = await import('../app/scene-picking.ts')
  const { RenderView } = await import('../app/render-view.ts')
  const { projectPoint } = await import('../app/projection.ts')
  const { modelFaceVisible, modelStage } = await import('../app/model-faces.ts')
  const { modelTriangleVisible, polygonBucket } = await import('../app/painter-order.ts')
  const { modelHitBounds } = await import('../app/world-picking.ts')
  const { nativeModelResource } = await import('../app/model-resources.ts')
  const bindings = {
    ScenePicking,
    THREE,
    modelMatrix,
    modelPoint,
    projectPoint,
    modelFaceVisible,
    modelTriangleVisible,
    polygonBucket,
    modelHitBounds,
    nativeModelResource,
  }
  const Oracle = new Function(
    ...Object.keys(bindings),
    'return ' + stripTypeScriptTypes('(class extends ScenePicking { ' + legacyModelSource + ' })')
  )(...Object.values(bindings))
  const view = new RenderView()
  t.after(() => view.dispose())
  const sourceCommand = { bucket: 50, cell: 0, phase: 2, object: 0, face: 0 }
  view.painter.source = () => sourceCommand
  view.pickSubmissionKey = () => 'empty-ground'
  view.pickCandidates = () => []
  const scene = {
    view,
    frame: 1,
    objects: new THREE.Group(),
    decorations: new THREE.Group(),
    unitMeshes: new Map(),
    terrain: new THREE.Group(),
    camera: new THREE.Camera(),
    renderer: {
      domElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) },
    },
  }
  const current = new ScenePicking(scene),
    oracle = new Oracle(scene)
  let pickedWitnesses = 0
  for (const [id, bank] of [
    [5, 2],
    [15, 6],
  ])
    for (const stage of [0, 2, 4]) {
      const resource = nativeModelResource(id, bank),
        data = resource.data,
        { p } = modelStage(data, stage)
      const geometry = new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute(p, 3)
      )
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial()),
        group = new THREE.Group()
      group.userData.building = 7
      Object.assign(mesh.userData, {
        nativeModel: id,
        nativeResource: resource,
        stage,
        nativeSize: data.scale,
        nativeScale: data.scale,
      })
      group.add(mesh)
      scene.objects.add(group)
      try {
        for (const [heading, tilt, roll, size] of [
          [0, 0, 0, data.scale],
          [511, 128, -64, 73],
          [1024, -128, 256, 160],
        ]) {
          Object.assign(group.userData, {
            nativeHeading: heading,
            nativeTilt: tilt,
            nativeRoll: roll,
          })
          mesh.userData.nativeSize = size
          group.position.y += 0.25
          view.update(800, 600, { x: 0, z: 0 }, heading / 512, 0, false)
          const position = mesh.geometry.getAttribute('position')
          if (position.count) position.setY(0, position.getY(0) + 0.125)
          position.needsUpdate = true
          const key = `${heading}:${tilt}:${roll}:${size}`
          const commands = current.model(mesh, key)
          assert.deepEqual(commands, oracle.model(mesh, key))
          assert.equal(
            current.model(mesh, key),
            commands,
            'unchanged key retains existing command cache'
          )
          const first = commands.find(command => command.kind === 'model')
          if (first) {
            scene.frame++
            const event = {
              clientX: first.points.reduce((s, p) => s + p.x, 0) / 3,
              clientY: first.points.reduce((s, p) => s + p.y, 0) / 3,
            }
            const picked = current.pick(event)
            assert.equal(picked, oracle.pick(event))
            if (picked === 7) pickedWitnesses++
            assert.equal(current.lastKind, oracle.lastKind)
          }
          mesh.geometry.setAttribute('position', position.clone())
          assert.deepEqual(
            current.model(mesh, key),
            oracle.model(mesh, key),
            'replacement attributes preserve command parity'
          )
        }
      } finally {
        scene.objects.remove(group)
        geometry.dispose()
        mesh.material.dispose()
      }
    }
  assert.ok(pickedWitnesses > 0, 'real model winners exercised, not only misses')
})
