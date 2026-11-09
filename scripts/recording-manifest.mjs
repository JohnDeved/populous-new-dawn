import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Retained Component0 identities from the two static research checkers. This
// tool neither decodes a GM save nor executes GP commands or CP camera payloads.
const inputIdentities = {
  "rddata/rdmn001.dat": [
    286,
    "b947d85037945626b58bd085d8bd3996ca2be3ea0072c88eee6621bcc2485f91"
  ],
  "rddata/rd001gm.dat": [
    858468,
    "fc18b981d980ddb9735545573093a5951ff6a574f7addc15cc977eca68df2890"
  ],
  "rddata/rd001gm.ver": [
    68,
    "d84c92ca0c698e9e82366d9425a8751d1913d48195ab2ad7f6e5e4a81afa7e7e"
  ],
  "rddata/rd005gm.dat": [
    858468,
    "6587c7c67e8ad1cd015fc088d03df6056c787ff1b6dd1d7e31ca3ba20eec7844"
  ],
  "rddata/rd005gm.ver": [
    68,
    "4cd55e16b29f5275f91b473a3f2721c0b487cf0aba1116ebda498f4ed2198d79"
  ],
  "rddata/rd002gm.dat": [
    858468,
    "c224346ebae53496c5d4b9d50d22032890097554b713a67ad3a89d02ffc4f8c2"
  ],
  "rddata/rd002gm.ver": [
    68,
    "95d4320f9e308327b9ba37c41266ceca133a1d2208ab8ad6f523b0d84c6abf35"
  ],
  "rddata/rd006gm.dat": [
    858468,
    "f40a17d7eb9bbf87a6a551d445a51f7c7729d819d898f0e49be9a399153037bb"
  ],
  "rddata/rd006gm.ver": [
    68,
    "b97da6cf4a6427af5d854dff95481cf5255907e42ce1b3111a661eb447e11a19"
  ],
  "rddata/rd003gm.dat": [
    858468,
    "26a24908568ca470b9c0d9d835f5493bb0c81ea8b154c5d335b7f6877fc0feda"
  ],
  "rddata/rd003gm.ver": [
    68,
    "6b75d1cda5e7d2b5e36d4a25a0c3b0d809931cd7684c5b1698f6d5268c1d77de"
  ],
  "rddata/rd001cp.dat": [
    9168,
    "5bcc842585c7f19030118b2cfe571e28582a74930ddda02af0e3298bc8fd046c"
  ],
  "rddata/rd001gp.dat": [
    128,
    "674c29211dc6d97c8f8456c0e24abf9f91c9fc4d586f3697347decd9f0329d2e"
  ],
  "rddata/rd002cp.dat": [
    9264,
    "35a4e5e9da7491a75da0a9b4b177f791e9be27ac0329e639c24f74f1f00b08c3"
  ],
  "rddata/rd002gp.dat": [
    206,
    "6f0258cc48cbd0d63ad11612513485e33da17401c226915fccd1204873ed2c29"
  ],
  "rddata/rd003cp.dat": [
    6880,
    "2744b81465d1a011b7cbfa8b2cd2a86ed046e4b5a53b787e1232c52ff92ec822"
  ],
  "rddata/rd003gp.dat": [
    388,
    "67467dad19d5f8ae8cae5f708d840d91649d68427be93983448c970806b688e6"
  ],
  "rddata/rd005cp.dat": [
    11264,
    "2c71643172686ae1595b5397794a72a961bbb8e9f1a46eaafa7825669c8cc6d2"
  ],
  "rddata/rd005gp.dat": [
    700,
    "697fdfbb3818f5adeb5766b37ebffc0b4799f851354f5356c00b26209462a417"
  ],
  "rddata/rd006cp.dat": [
    24400,
    "c1973b5d15d49dc0e1d59e075e8e3400306c2df79fea228159e580e219a98f4d"
  ],
  "rddata/rd006gp.dat": [
    1142,
    "28294b963db5a40721d955234b6dded3a09dd72a67e731d72ce802114e4f6a7f"
  ]
}
const recordingOrder = [1, 5, 2, 6, 3]
const streamSummaries = {
  "1": [
    864,
    1562,
    5,
    573,
    1562
  ],
  "5": [
    9166,
    9942,
    27,
    704,
    9876
  ],
  "2": [
    5668,
    6325,
    8,
    579,
    6325
  ],
  "6": [
    17307,
    18846,
    44,
    1525,
    18846
  ],
  "3": [
    11320,
    11840,
    15,
    430,
    11759
  ]
}

function requireBytes(value) {
  if (!(value instanceof Uint8Array)) throw new TypeError('Expected recording bytes')
  return Buffer.from(value.buffer, value.byteOffset, value.byteLength)
}

/** Parse only the evidenced outer framing; payload bytes remain opaque. */
export function inspectRecordingStream(value, kind) {
  if (kind !== 'gp' && kind !== 'cp') throw new TypeError('Expected gp or cp stream')
  const data = requireBytes(value)
  const frames = []
  let offset = 0
  while (offset + 8 <= data.length) {
    const counter = data.readInt32LE(offset)
    const size = data.readInt16LE(offset + 4)
    const type = data[offset + 6]
    const auxiliary = data[offset + 7]
    offset += 8
    // The signed counter alone identifies the sentinel, including its varied
    // remaining bytes. Never search inside the opaque payload for ff bytes.
    if (counter === -1) {
      const expectedTail = kind === 'gp' ? 8 : 0
      if (data.length - offset !== expectedTail) throw new Error('Invalid stream trailer')
      return {
        frames,
        trailer:
          kind === 'gp'
            ? { startCounter: data.readInt32LE(offset), endCounter: data.readInt32LE(offset + 4) }
            : null,
      }
    }
    if (counter < 0 || size < 0 || offset + size > data.length)
      throw new Error('Invalid stream counter or payload length')
    if (frames.length && counter < frames.at(-1).counter)
      throw new Error('Decreasing simulation counter')
    const empty = size === 0 && type === 0
    const known = kind === 'gp' ? size === 18 && type === 1 : size === 8 && type === 10
    if (!empty && !known) throw new Error('Unsupported recording payload shape')
    frames.push({ counter, size, type, auxiliary, payloadOffset: offset })
    offset += size
  }
  throw new Error('Missing complete stream sentinel')
}

export function inspectRecordingPair({ recordingId, gm, version, gp, cp }) {
  if (!Number.isInteger(recordingId) || recordingId < 0 || recordingId > 127)
    throw new TypeError('Invalid recording ID')
  const snapshot = requireBytes(gm)
  const sidecar = requireBytes(version)
  if (snapshot.length !== 858468 || sidecar.length !== 68 || sidecar.readUInt32LE(0) !== 106)
    throw new Error('Unsupported recording snapshot or sidecar')
  const startCounter = snapshot.readInt32LE(16)
  if (startCounter < 0) throw new Error('Invalid snapshot simulation counter')
  const commands = inspectRecordingStream(gp, 'gp')
  const camera = inspectRecordingStream(cp, 'cp')
  const gpEnd = commands.frames.at(-1)
  const cpEnd = camera.frames.at(-1)
  if (
    !gpEnd || !cpEnd || gpEnd.size !== 0 || gpEnd.type !== 0 ||
    cpEnd.size !== 0 || cpEnd.type !== 0
  )
    throw new Error('Missing scheduled stream completion record')
  if (commands.trailer.startCounter !== startCounter || commands.trailer.endCounter !== gpEnd.counter)
    throw new Error('GP trailer disagrees with snapshot or completion counter')
  if (
    [...commands.frames, ...camera.frames].some(
      frame => frame.counter < startCounter || frame.counter > gpEnd.counter
    )
  )
    throw new Error('Stream record outside snapshot-to-GP interval')
  return {
    recordingId,
    sourceMapId: null,
    sourceIdentityStatus: 'unresolved',
    startCounter,
    sidecarVersion: 106,
    completion: { stream: 'gp', counter: gpEnd.counter },
    gp: { endCounter: gpEnd.counter, frames: commands.frames },
    cp: { endCounter: cpEnd.counter, frames: camera.frames },
  }
}

/** Authenticate all 21 inputs before producing a data-only manifest. */
export function buildRecordingManifest(readMember) {
  if (typeof readMember !== 'function') throw new TypeError('Expected member reader')
  const blobs = new Map()
  const inputs = []
  for (const [path, [bytes, expected]] of Object.entries(inputIdentities)) {
    // Retain a private copy: later reader calls cannot alter already-checked data.
    const data = Buffer.from(requireBytes(readMember(path)))
    const sha256 = createHash('sha256').update(data).digest('hex')
    if (data.length !== bytes || sha256 !== expected)
      throw new Error(`Recording identity mismatch: ${path}`)
    blobs.set(path, data)
    inputs.push({ path, bytes, sha256 })
  }
  const montage = blobs.get('rddata/rdmn001.dat').toString('ascii')
  const commands = montage
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split(/\s+/))
  const expected = recordingOrder.map(id => ['MONTYPE_GAME', String(id), '0'])
  expected.push(['MONTYPE_RESTART', '0', '0'])
  if (JSON.stringify(commands) !== JSON.stringify(expected)) throw new Error('Unsupported montage')
  const recordings = recordingOrder.map(recordingId => {
    const prefix = `rddata/rd${String(recordingId).padStart(3, '0')}`
    const recording = inspectRecordingPair({
      recordingId,
      gm: blobs.get(`${prefix}gm.dat`),
      version: blobs.get(`${prefix}gm.ver`),
      gp: blobs.get(`${prefix}gp.dat`),
      cp: blobs.get(`${prefix}cp.dat`),
    })
    const observed = [
      recording.startCounter, recording.gp.endCounter, recording.gp.frames.length,
      recording.cp.frames.length, recording.cp.endCounter,
    ]
    if (JSON.stringify(observed) !== JSON.stringify(streamSummaries[recordingId]))
      throw new Error('Changed recording summary')
    return {
      ...recording,
      files: {
        gm: `${prefix}gm.dat`, version: `${prefix}gm.ver`,
        gp: `${prefix}gp.dat`, cp: `${prefix}cp.dat`,
      },
    }
  })
  return {
    format: 'original-recording-manifest-v1',
    purpose: 'data-only; not a replay decoder or campaign map catalogue',
    counterUnit: 'original-simulation-counter',
    payloadStatus: 'opaque-not-decoded',
    inputs,
    entries: [
      ...recordingOrder.map(recordingId => ({ kind: 'recording', recordingId, limit: 0 })),
      { kind: 'restart', targetIndex: 0 },
    ],
    recordings,
  }
}

// Explicit CLI only. Imports perform no filesystem reads, native execution or
// output writes. The caller owns stdout destination; the original files are read-only.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 3) {
    process.stderr.write('Usage: node scripts/recording-manifest.mjs ORIGINAL_GAME_ROOT\n')
    process.exitCode = 1
  } else {
    try {
      const root = resolve(process.argv[2])
      const manifest = buildRecordingManifest(path => readFileSync(resolve(root, path)))
      process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`)
    } catch (error) {
      process.stderr.write(`Recording manifest failed: ${error.message}\n`)
      process.exitCode = 1
    }
  }
}
