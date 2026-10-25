import assert from 'node:assert/strict'
import test from 'node:test'
import { recognizeReaderSources, inactiveHelperReaderSha256 } from '../scripts/browser-performance/snapshot-readers.mjs'
import { equivalentReaderEvidence, equivalentInactiveHelperEvidence, readerImportSha256 } from '../scripts/browser-performance/snapshot-reader-proof.mjs'
import { comparableWork, sha256 } from '../scripts/browser-performance/snapshot-protocol.mjs'

// Exact retained PR632 run39215390008 reader bodies. Only Mt -> jt differs.
const baseSources = [
  'getAttribute(e){return this.attributes[e]}',
  'getIndex(){return this.index}',
  'getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}',
  'getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Mt(t,this.array)),t}',
  'getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Mt(t,this.array)),t}',
  'getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Mt(t,this.array)),t}',
  'getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Mt(t,this.array)),t}',
  'fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}',
]
const headSources = baseSources.map(source => source.replaceAll('Mt(', 'jt('))
const hash = label => sha256(label)
function evidence(sources) {
  const { rawSha256, allSourcesSha256, semanticSha256 } = recognizeReaderSources(sources)
  return { version: 1, sources, rawSha256, allSourcesSha256, semanticSha256,
    strictData: true, matrixBinding: true, sessionStable: true,
    source: { profile: null, slices: [], importSha256: readerImportSha256 },
    provenance: Object.fromEntries(['dependencies', 'three', 'package', 'lock', 'builder', 'bundle'].map(key =>
      [key + 'Sha256', hash(key === 'bundle' ? sources.join('') : key)])) }
}
function fixture(name = 'ordinary-hover') {
  const contexts = ['base', 'head', 'head', 'base', 'base', 'head'].map(side =>
    ({ side, evidence: evidence(side === 'base' ? baseSources : headSources) }))
  const phases = contexts.map(({ evidence: readers }) => {
    const geometryProof = { metadata: { version: 1,
      position: { type: 'Float32Array', count: 98304, itemSize: 3, normalized: false },
      index: { type: 'Uint32Array', submittedCount: 6, itemSize: 1, normalized: false },
      drawRange: { start: 0, count: 6 }, instanceCount: 1,
      worldMatrix: Array(16).fill(0), boundingBox: Array(6).fill(0), parentBasis: [0, 0, 0],
      nativeRelative: true, painterGround: true, terrainGrid: true, nativeScale: 0, nativeSize: 0 },
      positionSha256: hash('position'), indexSha256: hash('index'), instancesSha256: hash('instances'), consumerMethodsSha256: readers.rawSha256 }
    return { name, stateSha256: hash('state'), viewConfigSha256: hash('view'), targetId: 54, point: [1, 2],
      readerEvidenceSha256: readers.allSourcesSha256,
      blocks: Array.from({ length: 6 }, (_, step) => ({ step, event: 'pointermove', point: [1, 2], poses: [hash('pose')], inventory: [1],
        geometryProof: structuredClone(geometryProof), geometrySha256: hash(JSON.stringify(geometryProof)) })) }
  })
  return { contexts, phases }
}

test('actual Mt to jt pair retains unequal raw hashes and qualifies only five stable cohorts', () => {
  assert.equal(recognizeReaderSources(baseSources).rawSha256, 'fe206a1f32839c17065e8d705d3c0057d7cf6855da9176ab70892c88bcde01f1')
  assert.equal(recognizeReaderSources(headSources).rawSha256, 'edc5a3232ce689911a99d3c1620a914b89a9087f3ace650cab853191f774905c')
  assert.equal(inactiveHelperReaderSha256(baseSources), inactiveHelperReaderSha256(headSources))
  for (const name of ['native-hover', 'ordinary-hover', 'hud', 'world-recovery', 'menu-recovery']) {
    const { contexts, phases } = fixture(name)
    assert.equal(equivalentReaderEvidence(contexts), false, 'No held-drag profile admission is invented')
    assert.equal(equivalentInactiveHelperEvidence(contexts), true)
    assert.equal(comparableWork(phases), false)
    assert.equal(comparableWork(phases, contexts), true)
  }
  for (const name of ['native-view-drag-warm', 'unknown']) {
    const { contexts, phases } = fixture(name)
    assert.equal(comparableWork(phases, contexts), false)
  }
})

test('helper-only projection rejects active changes and keeps local names and branch spelling significant', () => {
  for (const [index, change] of [
    [0, () => 'getAttribute(z){return this.attributes[z]}'],
    [3, () => 'getX(e){let q=this.array[e*this.itemSize];return this.normalized&&(q=jt(q,this.array)),q}'],
    [3, () => 'getX(e){let t=this.array[e*this.itemSize];if(this.normalized)t=jt(t,this.array);return t}'],
    [3, () => 'getX(e){let t=this.array[e*this.itemSize];return this.normalized?jt(t,this.array):t}'],
    [4, source => source.replace('+1', '+2')],
    [3, source => source.replace('this.normalized&&', '')],
    [3, source => source.replace('jt(t,this.array)', 'jt(this.array,t)')],
    [3, source => source.replace('jt(', 't(')],
    [7, source => source.replace('<16', '<15')],
  ]) {
    const sources = [...headSources]; sources[index] = change(sources[index])
    try { assert.notEqual(inactiveHelperReaderSha256(sources), inactiveHelperReaderSha256(baseSources)) }
    catch (error) { if (error.message !== 'Unsupported terrain reader source') throw error }
  }
})

test('missing, forged or drifting reader/source/dependency evidence never activates fallback', () => {
  const changes = [
    x => { delete x.contexts[1].evidence },
    x => { x.contexts[1].side = 'other' },
    ...['strictData', 'matrixBinding', 'sessionStable'].map(key => x => { x.contexts[1].evidence[key] = false }),
    ...['rawSha256', 'allSourcesSha256', 'semanticSha256'].map(key => x => { x.contexts[1].evidence[key] = hash('forged') }),
    x => { x.contexts[1].evidence.source.importSha256 = null },
    x => { x.contexts[1].evidence.source.importSha256 = hash('wrong import') },
    x => { x.contexts[1].evidence.source.profile = 'invented' },
    x => { x.contexts[1].evidence.source.slices = [{}] },
    x => { delete x.contexts[1].evidence.sources },
    ...['dependencies', 'three', 'package', 'lock', 'builder', 'bundle'].map(key => x => { x.contexts[1].evidence.provenance[key + 'Sha256'] = hash('drift') }),
    x => { x.contexts[1].evidence = evidence(headSources.map(s => s.replaceAll('jt(', 'kt('))) },
  ]
  for (const change of changes) {
    const input = fixture(); change(input)
    assert.equal(equivalentInactiveHelperEvidence(input.contexts), false, change.toString())
    assert.equal(comparableWork(input.phases, input.contexts), false, change.toString())
  }
})

test('original raw-reader/component hashes, exact geometry and workload remain required', () => {
  const changes = [
    x => { x.phases[1].readerEvidenceSha256 = hash('wrong') },
    x => { x.phases[1].blocks[0].geometrySha256 = hash('wrong') },
    x => { delete x.phases[1].blocks[0].geometryProof },
    x => { x.phases[1].blocks[0].geometryProof.consumerMethodsSha256 = hash('wrong') },
    x => { x.phases[1].blocks[0].geometryProof.metadata.position.normalized = true },
    ...['positionSha256', 'indexSha256', 'instancesSha256'].map(key => x => {
      const block = x.phases[1].blocks[0]; block.geometryProof[key] = hash('changed'); block.geometrySha256 = hash(JSON.stringify(block.geometryProof))
    }),
    ...['stateSha256', 'viewConfigSha256'].map(key => x => { x.phases[1][key] = hash('changed') }),
    x => { x.phases[1].blocks[0].poses = [hash('changed')] },
    x => { x.phases[1].blocks[0].inventory = [2] },
    x => { x.phases[1].name = 'hud' },
    x => { x.phases[1].warmup = { blocks: [] } },
    x => { x.phases[1].blocks[0].geometryAfterSha256 = hash('after') },
  ]
  for (const change of changes) {
    const input = fixture(); change(input)
    assert.equal(comparableWork(input.phases, input.contexts), false, change.toString())
  }
})
