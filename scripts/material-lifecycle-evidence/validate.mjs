import assert from 'node:assert/strict'
import { readFileSync, lstatSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { validateLifecycle } from './contract.mjs'
const output = resolve(process.argv[2])
const hash = data => createHash('sha256').update(data).digest('hex')
const report = JSON.parse(readFileSync(join(output, 'material-lifecycle.json')))
const validation = validateLifecycle(report)
const screenshots = {}
for (const name of report.screenshots) {
  const path = join(output, name), info = lstatSync(path)
  assert.ok(info.isFile() && !info.isSymbolicLink() && info.size <= 32 * 1024 * 1024)
  const bytes = readFileSync(path)
  assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137,80,78,71,13,10,26,10]))
  assert.equal(bytes.subarray(12,16).toString('ascii'), 'IHDR')
  assert.ok(bytes.readUInt32BE(16)>0 && bytes.readUInt32BE(20)>0)
  screenshots[name] = { bytes:bytes.length, sha256:hash(bytes), verifiedPng:true,
    width:bytes.readUInt32BE(16), height:bytes.readUInt32BE(20) }
}
writeFileSync(join(output,'contract-verification.json'), JSON.stringify({ validation,
  reportSha256:hash(readFileSync(join(output,'material-lifecycle.json'))), screenshots }), {flag:'wx'})
