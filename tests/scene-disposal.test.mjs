import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import * as THREE from 'three'

// Execute the production constructor's renderer assignment and complete dispose
// body without allocating a world, loading assets, or supplying a real GPU.
// These are caller/ownership tests, not browser context-loss or rendering proof.
const source = ts.createSourceFile('scene.ts', readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
const sceneClass = source.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'GameScene')
const disposeBody = sceneClass.members.find(node => ts.isMethodDeclaration(node) && node.name.getText(source) === 'dispose').body
const constructor = sceneClass.members.find(ts.isConstructorDeclaration)
const rendererAssignment = constructor.body.statements.find(node => ts.isExpressionStatement(node) && node.expression.left?.getText(source) === 'this.renderer')
function evaluate(expression, bindings = {}) {
  const javascript = ts.transpileModule(`(${expression})`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
  return new Function(...Object.keys(bindings), `return ${javascript}`)(...Object.values(bindings))
}
const expected = [
  'cursor', 'nearby-cancel', 'nearby-reset', 'training', 'presentation', 'frame',
  'sound', 'terrain-abort', 'resize', 'listener', 'globe-remove', 'globe', 'group',
  'water', 'terrain', 'view', 'fps', 'renderer', 'canvas', 'tooltip-cancel',
  'tooltip', 'pointer', 'building-panel', 'object-panels', 'spell-pointer',
  'worship', 'context-loss',
]
function fixture(failAt) {
  const calls = [], failure = new Error(`cleanup failed: ${failAt}`)
  const record = name => () => {
    assert.equal(scene.disposed, true, 'disposal guard is set before cleanup')
    calls.push(name)
    if (name === failAt) throw failure
  }
  const owned = name => ({ dispose: record(name) })
  const scene = {
    disposed: false,
    neutralCursor: owned('cursor'),
    cancelNearbyFollowers: record('nearby-cancel'),
    nearbyFollowers: { reset: record('nearby-reset') },
    onNearbyFollowersCancel: () => {},
    releaseTrainingPanelRequests: record('training'),
    presentationBinding: { release: record('presentation') },
    frame: 42,
    ownedSounds: new Map([['sound', record('sound')]]),
    terrainLoad: { abort: record('terrain-abort') },
    resize: { disconnect: record('resize') },
    disposeListeners: [record('listener')],
    scene: { remove: record('globe-remove') },
    globe: owned('globe'),
    releaseGroup: record('group'),
    waterMap: owned('water'),
    terrainMap: owned('terrain'),
    view: owned('view'),
    fpsGraph: owned('fps'),
    renderer: { dispose: record('renderer'), domElement: { remove: record('canvas') }, forceContextLoss: record('context-loss') },
    cancelTooltipInspection: record('tooltip-cancel'),
    tooltipInput: {},
    tooltipElement: { remove: record('tooltip') },
    pointerOutline: { remove: record('pointer') },
    buildingPanels: new Map([['panel', { remove: record('building-panel') }]]),
    objectPanels: owned('object-panels'),
    spellPointer: { remove: record('spell-pointer') },
    worshipPresentation: owned('worship'),
  }
  const dispose = evaluate(`function () ${disposeBody.getText(source)}`, {
    cancelAnimationFrame: frame => { assert.equal(frame, 42); record('frame')() },
  }).bind(scene)
  return { scene, dispose, calls, failure }
}

test('GameScene creates an independently owned renderer without a supplied canvas or context', () => {
  const options = []
  class WebGLRenderer {
    constructor(value) { options.push(value); this.domElement = {} }
  }
  const create = evaluate(`function () { ${rendererAssignment.getText(source)} }`, { THREE: { WebGLRenderer } })
  const first = {}, replacement = {}
  create.call(first); create.call(replacement)
  assert.notEqual(first.renderer, replacement.renderer)
  assert.notEqual(first.renderer.domElement, replacement.renderer.domElement)
  for (const value of options) {
    assert.equal(Object.hasOwn(value, 'canvas'), false)
    assert.equal(Object.hasOwn(value, 'context'), false)
  }
})

test('GameScene retires its context after every existing cleanup and repeated disposal is a no-op', () => {
  const f = fixture()
  f.dispose()
  assert.deepEqual(f.calls, expected)
  assert.equal(f.scene.neutralCursor, null)
  assert.equal(f.scene.onNearbyFollowersCancel, undefined)
  assert.equal(f.scene.releaseTrainingPanelRequests, null)
  assert.equal(f.scene.ownedSounds.size, 0)
  assert.equal(f.scene.fpsGraph, null)
  assert.equal(f.scene.tooltipInput, null)
  assert.equal(f.scene.buildingPanels.size, 0)
  f.dispose()
  assert.deepEqual(f.calls, expected)
})

test('absent optional owners and an inactive frame do not prevent terminal retirement', () => {
  const f = fixture()
  Object.assign(f.scene, { neutralCursor: null, nearbyFollowers: undefined,
    releaseTrainingPanelRequests: null, presentationBinding: undefined, frame: 0, fpsGraph: null })
  f.scene.ownedSounds.clear(); f.scene.buildingPanels.clear(); f.scene.disposeListeners.length = 0
  f.dispose()
  const omitted = new Set(['cursor', 'nearby-reset', 'training', 'presentation', 'frame', 'fps', 'sound', 'building-panel', 'listener'])
  assert.deepEqual(f.calls, expected.filter(name => !omitted.has(name)))
})

for (const failAt of ['cursor', 'group', 'renderer', 'canvas', 'worship']) {
  test(`existing ${failAt} cleanup error retains fail-fast order and the disposal guard`, () => {
    const f = fixture(failAt)
    assert.throws(f.dispose, error => error === f.failure)
    const prefix = expected.slice(0, expected.indexOf(failAt) + 1)
    assert.deepEqual(f.calls, prefix)
    f.dispose()
    assert.deepEqual(f.calls, prefix)
    assert.equal(f.calls.includes('context-loss'), false)
  })
}

test('a terminal context-loss error propagates only after existing cleanup and is not retried', () => {
  const f = fixture('context-loss')
  assert.throws(f.dispose, error => error === f.failure)
  assert.deepEqual(f.calls, expected)
  assert.equal(f.scene.buildingPanels.size, 0)
  assert.equal(f.scene.tooltipInput, null)
  f.dispose()
  assert.deepEqual(f.calls, expected)
})

test('Scene cleanup keeps cached texture, image and geometry identities for later consumers', () => {
  const assetSource = ts.createSourceFile('scene-assets.ts', readFileSync(new URL('../app/scene-assets.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
  const release = assetSource.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'releaseGroup')
  const image = { width: 2, height: 2, data: new Uint8Array(16) }, texture = new THREE.Texture(image)
  const geometry = new THREE.BufferGeometry(), material = new THREE.SpriteMaterial({ map: texture })
  const meshMaterial = new THREE.MeshBasicMaterial({ map: texture })
  const asset = { texture }, textures = new Map([['shared', asset]])
  const releases = []
  texture.addEventListener('dispose', () => releases.push('texture'))
  geometry.addEventListener('dispose', () => releases.push('geometry'))
  material.addEventListener('dispose', () => releases.push('sprite-material'))
  meshMaterial.addEventListener('dispose', () => releases.push('mesh-material'))
  const releaseGroup = evaluate(`function () { let sharedGeometryMembership; return function ${release.name.text}(g) ${release.body.getText(assetSource)} }`, {
    THREE, textures, meshes: new Map([['shared', geometry]]),
  })()
  const f = fixture(), group = new THREE.Group()
  group.add(new THREE.Sprite(material), new THREE.Mesh(geometry, meshMaterial))
  f.scene.scene = group
  f.scene.releaseGroup = releaseGroup
  f.dispose()
  assert.deepEqual(releases.sort(), ['mesh-material', 'sprite-material'])
  assert.equal(textures.get('shared'), asset)
  assert.equal(asset.texture, texture)
  assert.equal(texture.image, image)
  assert.equal(group.children[1].geometry, geometry)
  assert.equal(f.calls.at(-1), 'context-loss')
  const laterConsumer = new THREE.SpriteMaterial({ map: textures.get('shared').texture })
  assert.equal(laterConsumer.map, texture)
  assert.equal(laterConsumer.map.image, image)
  laterConsumer.dispose()
})
