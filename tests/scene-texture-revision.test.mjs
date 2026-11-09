import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'

// Actual cache functions with the image-loader boundary supplied. No network,
// browser decoder or original-pixel equivalence is asserted.
function fixture() {
  const pending = []
  const source = readFileSync(new URL('../app/scene-assets.ts', import.meta.url), 'utf8')
  const body = source.slice(source.indexOf('const textures ='), source.indexOf('export function effectFrame'))
  const makeTexture = () => ({ userData: {}, dispose() { this.disposed = true } })
  const api = vm.runInNewContext(stripTypeScriptTypes(body.replaceAll('export function', 'function') + ';({loadTexture, retryFailedTexture, sceneTextureRevision})'), {
    THREE: {
      TextureLoader: class { load(url, ready, progress, fail) { const t = makeTexture(); pending.push({ url, ready, fail, texture: t }); return t } },
      DataTexture: class { constructor() { Object.assign(this, makeTexture()) } },
    },
    templeArt: { modelAtlas: 'temple-model', sparkleAtlas: 'temple-sparkle' },
    nativeUnits: { atlas: 'units' }, lightningTexture: () => new Uint8Array(32 * 32 * 4),
    console: { error() {} },
  })
  return { ...api, pending }
}

test('late success increments once and passive cache reads preserve identity and revision', async () => {
  const f = fixture(), asset = f.loadTexture('sky'), initial = f.sceneTextureRevision()
  assert.equal(f.sceneTextureRevision(), 0)
  assert.strictEqual(f.loadTexture('sky'), asset)
  f.pending[0].ready()
  assert.equal(await asset.ready, true)
  assert.equal(f.sceneTextureRevision(), initial + 1)
  assert.strictEqual(f.loadTexture('sky'), asset)
  assert.equal(f.sceneTextureRevision(), initial + 1)
})

test('failure preserves passive entry and explicit retry has its own completion', async () => {
  const f = fixture(), failed = f.loadTexture('tornado')
  f.pending[0].fail(new Error('decode'))
  assert.equal(await failed.ready, false)
  assert.equal(f.sceneTextureRevision(), 1)
  assert.strictEqual(f.loadTexture('tornado'), failed)
  assert.equal(f.pending.length, 1)
  const retried = f.retryFailedTexture('tornado')
  assert.notStrictEqual(retried, failed)
  assert.equal(failed.texture.disposed, true)
  assert.equal(f.sceneTextureRevision(), 1)
  f.pending[1].ready()
  assert.equal(await retried.ready, true)
  assert.equal(f.sceneTextureRevision(), 2)
})

test('synchronous data texture completion is observable without a scene subscription', async () => {
  const f = fixture(), asset = f.loadTexture('lightning-bolt')
  assert.equal(await asset.ready, true)
  assert.equal(f.sceneTextureRevision(), 1)
  assert.strictEqual(f.loadTexture('lightning-bolt'), asset)
  assert.equal(f.sceneTextureRevision(), 1)
  assert.equal(f.pending.length, 0)
})
