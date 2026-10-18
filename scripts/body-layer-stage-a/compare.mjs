import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync, deflateSync } from 'node:zlib'
import { sha, save } from './io.mjs'
function png(width, height, rgba) {
  const table = Uint32Array.from({ length: 256 }, (_, n) => {
    for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1
    return n >>> 0
  })
  const chunk = (name, data) => {
    const type = Buffer.from(name),
      body = Buffer.concat([type, data])
    let c = 0xffffffff
    for (const x of body) c = table[(c ^ x) & 255] ^ (c >>> 8)
    const size = Buffer.alloc(4),
      crc = Buffer.alloc(4)
    size.writeUInt32BE(data.length)
    crc.writeUInt32BE((c ^ 0xffffffff) >>> 0)
    return Buffer.concat([size, body, crc])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6
  const rows = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++)
    rgba.copy(rows, y * (1 + width * 4) + 1, (height - 1 - y) * width * 4, (height - y) * width * 4)
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
export function comparePair(aDir, bDir, out, decode) {
  const a = JSON.parse(readFileSync(join(aDir, 'report.json'))),
    b = JSON.parse(readFileSync(join(bDir, 'report.json')))
  assert.equal(a.status, 'passed')
  assert.equal(b.status, 'passed')
  assert.equal(a.cohort, b.cohort)
  assert.deepEqual(a.environment, b.environment)
  assert.equal(a.browserVersion, b.browserVersion)
  assert.equal(a.browserBinary.sha256, b.browserBinary.sha256)
  const ai = gunzipSync(readFileSync(join(aDir, 'initial-state.json.gz'))),
    bi = gunzipSync(readFileSync(join(bDir, 'initial-state.json.gz')))
  assert.equal(sha(ai), a.initialStateSha256)
  assert.equal(sha(bi), b.initialStateSha256)
  assert.deepEqual(
    decode(JSON.parse(ai), true),
    decode(JSON.parse(bi), true),
    'Complete pre-bootstrap state mismatch'
  )
  const rows = [],
    ar = [a.bootstrap, ...a.steps, ...a.controls],
    br = [b.bootstrap, ...b.steps, ...b.controls]
  assert.equal(ar.length, 53)
  assert.equal(br.length, 53)
  try {
    for (let i = 0; i < ar.length; i++) {
      const x = ar[i],
        y = br[i],
        row = { index: i, name: x.name ?? `step-${i}`, status: 'incomplete' }
      rows.push(row)
      const xp = gunzipSync(readFileSync(join(aDir, x.pixelFile))),
        yp = gunzipSync(readFileSync(join(bDir, y.pixelFile)))
      assert.equal(sha(xp), x.pixelSha256)
      assert.equal(sha(yp), y.pixelSha256)
      assert.equal(x.width, y.width)
      assert.equal(x.height, y.height)
      const xs = gunzipSync(readFileSync(join(aDir, x.stateFile))),
        ys = gunzipSync(readFileSync(join(bDir, y.stateFile)))
      assert.equal(sha(xs), x.stateSha256)
      assert.equal(sha(ys), y.stateSha256)
      const xx = JSON.parse(xs),
        yy = JSON.parse(ys)
      // Actual decoded graphs retain undefined, signed zero, Maps, typed buffers and aliases.
      assert.deepEqual(
        decode(xx.state, true),
        decode(yy.state, true),
        'Complete World/logical/Painter/input mismatch'
      )
      assert.deepEqual(decode(xx.picks, true), decode(yy.picks, true), 'Pick results mismatch')
      assert.deepEqual(x.extra, y.extra)
      if (!xp.equals(yp)) {
        const diff = Buffer.alloc(xp.length)
        let changed = 0
        for (let j = 0; j < xp.length; j += 4) {
          const different = !xp.subarray(j, j + 4).equals(yp.subarray(j, j + 4))
          if (different) changed++
          diff[j] = different ? 255 : 0
          diff[j + 3] = 255
        }
        row.changedPixels = changed
        for (const [label, pixels] of [
          ['baseline', xp],
          ['candidate', yp],
          ['diff', diff],
        ])
          writeFileSync(join(out, `${a.cohort}-${i}-${label}.png`), png(x.width, x.height, pixels))
        throw Error(`RGBA mismatch at ${a.cohort}/${i}: ${changed} pixels`)
      }
      const state = decode(xx.state, true),
        eligible = state.layers.filter(
          l =>
            l.groupVisible &&
            l.visible &&
            l.materialVisible &&
            !l.transparent &&
            l.opacity === 1 &&
            l.depthWrite &&
            l.range &&
            state.depth[l.range[0]] === 2
        ).length
      row.counters = { baseline: x.counters, candidate: y.counters }
      row.actualCallReduction = x.counters.calls - y.counters.calls
      if (i < 29) {
        assert.equal(
          row.actualCallReduction,
          eligible,
          'Draw-call reduction must match actual clipped body inventory'
        )
        assert.equal(x.counters.triangles - y.counters.triangles, 2 * eligible)
        assert.equal(x.counters.points, y.counters.points)
        assert.equal(x.counters.lines, y.counters.lines)
      }
      if (['overview', 'override', 'points-hook'].includes(x.name))
        for (const key of ['calls', 'triangles', 'points', 'lines'])
          assert.equal(x.counters[key], y.counters[key], `Fallback changed ${key}`)
      if (['shared-points', 'ignored-points', 'points-hook'].includes(x.name)) {
        for (const record of [x, y]) {
          assert.equal(record.counters.points, 1, 'Points must participate in an actual draw')
          assert.equal(record.extra?.freshBody, true, 'Each Points case needs a new owned body')
          assert.equal(record.extra?.frustumCulled, false)
          assert.equal(record.extra?.visible, true)
          assert.equal(record.extra?.materialVisible, true)
          assert.equal(
            record.extra?.center?.length,
            2,
            'SpriteMaterial Points needs a valid center'
          )
          if (x.name === 'points-hook')
            assert.ok(record.extra.calls > 0, 'Actual material callback must execute')
        }
        if (x.name !== 'points-hook') {
          const target = state.layers.find(
            l => l.id === x.extra.target.id && l.layerIndex === x.extra.target.layerIndex
          )
          assert.ok(
            target?.groupVisible &&
              target.visible &&
              target.materialVisible &&
              !target.transparent &&
              target.opacity === 1 &&
              target.depthWrite &&
              target.range &&
              state.depth[target.range[0]] === 2,
            'Shared target must otherwise qualify for clipping'
          )
          assert.ok(eligible >= 1)
          assert.equal(
            row.actualCallReduction,
            eligible - 1,
            'Shared target must use the generic submitted path'
          )
          assert.equal(x.counters.triangles - y.counters.triangles, 2 * (eligible - 1))
          assert.equal(x.counters.lines, y.counters.lines)
        }
      }
      row.status = 'passed'
    }
  } finally {
    save(join(out, `comparison-${a.cohort}.json`), { rows })
  }
  return rows
}
