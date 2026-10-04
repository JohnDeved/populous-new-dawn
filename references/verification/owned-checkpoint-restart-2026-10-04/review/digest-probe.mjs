import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
const commit = '7153bcc51eaf542ce5e55ecdea139078fe814ff6'
const source = execFileSync('git', ['show', `${commit}:scripts/local-render/checkpoint-observer.mjs`], { encoding: 'utf8' })
const { readCommittedCheckpoint } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
let record = { version: 1, world: { outcome: { level: 1 }, turn: 10, time: 1, units: [], terrain: [], mana: 0, wood: 0, shots: {}, giftCounts: {} } }
globalThis.indexedDB = { databases: async () => [{ name: 'populous-new-dawn' }], open() { const request = {}; setTimeout(() => { request.result = { objectStoreNames: { contains: () => true }, close() {}, transaction() { const transaction = { objectStore: () => ({ get() { return { result: structuredClone(record) } } }) }; setTimeout(() => transaction.oncomplete(), 0); return transaction } }; request.onsuccess() }, 0); return request } }
const digest = async () => (await readCommittedCheckpoint({ evaluate: fn => fn() })).checkpointSha256
const results = []
for (const [name, first, second] of [['actual-effect-duration-Infinity-vs-null', Infinity, null], ['map-vs-object', new Map([[1, 2]]), { map: [[1, 2]] }], ['different-DataView-bytes', new DataView(Uint8Array.from([1]).buffer), new DataView(Uint8Array.from([2]).buffer)]]) {
  record.world.test = first; const a = await digest(); record.world.test = second; const b = await digest(); assert.equal(a, b); results.push({ name, firstSha256: a, secondSha256: b, collision: a === b })
}
const artifact = { commit, noBrowserLaunched: true, command: 'node work/orchestration/owned-profile-review-69e3e33/digest-probe.mjs', results }
writeFileSync('work/orchestration/owned-profile-review-69e3e33/digest-results.json', JSON.stringify(artifact, null, 2) + '\n')
console.log(JSON.stringify(artifact, null, 2))
