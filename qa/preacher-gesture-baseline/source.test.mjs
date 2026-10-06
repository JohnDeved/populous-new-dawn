import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const root = new URL('../../', import.meta.url), here = new URL('./', import.meta.url)
const read = path => readFileSync(new URL(path, root))
const json = name => JSON.parse(readFileSync(new URL(name, here)))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')

test('application and maintained helper bytes match the frozen accepted application', () => {
  for (const [file, digest] of Object.entries(json('application-inputs.json').files)) assert.equal(sha(read(file)), digest, file)
  const sprites = JSON.parse(read('app/original-units.json'))
  const sources = Object.values(sprites.animations['blue-preacher']).map(d => d[0].source)
  assert.ok(sources.includes(168)); assert.ok(!sources.includes(176)); assert.ok(!sources.includes(184))
})

test('inherited ordinary input helpers remain byte-identical and dependency locks agree', () => {
  for (const [file, digest] of Object.entries(json('provenance.json').byteIdenticalFiles))
    assert.equal(sha(readFileSync(new URL(`inherited/${file}`, here))), digest, file)
  const runtime = json('expected-runtime.json'), input = json('application-inputs.json')
  assert.equal(runtime.packageLockSha256, input.files['package-lock.json'])
  for (const [name, digest] of Object.entries(runtime.harness)) assert.equal(input.files[`scripts/local-render/${name}`], digest)
})

test('new browser route has no simulation stepping, world fixtures or diagnostic camera mutation', () => {
  for (const file of ['scenario.mjs', 'observe.mjs', 'pixels.mjs']) {
    const source = readFileSync(new URL(file, here), 'utf8')
    assert.doesNotMatch(source, /\b(?:tick|advanceGame|addUnit|addBuilding|naturalPreacherJourney|cancelAnimationFrame|setSelection|placeBuilding)\s*\(/)
    assert.doesNotMatch(source, /\b(?:scene|s)\.(?:animate|focus|onChange|updateCameraMotion)\s*\(/)
    assert.doesNotMatch(source, /\b(?:w|world)\.(?:speed|paused|randomState|units|turn|time)\s*=/)
  }
})
