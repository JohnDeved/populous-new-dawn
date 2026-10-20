// Independent PNG/PSFB readers. No production importer or decoder is called.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'
import { join } from 'node:path'
import art from '../app/original-shield.json' with { type: 'json' }

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const hashes = [
  'af103a9b883fee192b0888bb34ec81f1fe0444a5db0b10e11f357bc4ddd12bd4',
  'd47f54071a5f108adf030ae651f63811f48bde3627b4f297385c64ea52e54320',
  '92bd08a8948f05121413e8d5d71e33389e57e8697f19ecfc0c1e2f5e97ff8f7f',
  '788d81dcba0d4ad9dc01f122687b9042a457bd1baa5519d9a888a5332110d9f6',
  '131fbd64745222f67129637a5f286ee540de380117ff04d1c2aab47342364ca8',
  'db8026993ae94112df71bfbd079e763356a1782f0bdfd0f45a4aa26b670e9f70',
  '0d546b4436e8247ce2c0c5c56d827144cdbaad6675a31edc162fee4a06c46518',
  '9c931796b0b2e51d3b14012831b84deb4ee6d8adfa7432435a51423aa916ffc3',
  'a4771b0aa8d8e6fc93dbe6d814b692c9f0064911297290b2aa33549115bf8843',
  '3fcb4212b2b94101559a16690cc5e17c21d8652152112e15734a1234f0576227',
  'fd403be3f24d8be738982301c4ac17900cec0f88f71420b36e1d2478682d0881',
  '1f3c42f928535c75e7d955d2b1ea5c3947395fb83736e8c561f1477ff5be939e',
  'dd382084c1b5d9b176b27c7a44b6e17e659d1f0db3624dbe2815895be891623a',
  '823c5cb8ec829e8f556db51b21ab1748c386fa2e7731b799bc478ce51e4382e2',
  '6bf2abf90ffc35d0fb206bf494bd99642fd613e287a1829c1e43a009658c5a83',
]
const rgb = [
  [51, 63, 203],
  [255, 75, 22],
  [223, 155, 31],
  [47, 171, 99],
]
const bases = [
  1538, 1539, 1540, 1541, 1542, 1541, 1540, 1539, 1538, 1539, 1540, 1541, 1542, 1541, 1540, 1539,
]
const lifts = [0, 32, 64, 96, 128, 160, 192, 224, 256, 224, 192, 160, 128, 96, 64, 32]

function atlasPixels() {
  const png = readFileSync(new URL('../public/original/shield.png', import.meta.url))
  assert.equal(sha(png), art.pngSHA256)
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  const compressed = []
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset),
      name = png.toString('ascii', offset + 4, offset + 8)
    const bytes = png.subarray(offset + 8, offset + 8 + length)
    if (name === 'IHDR') {
      assert.deepEqual(
        [bytes.readUInt32BE(0), bytes.readUInt32BE(4), bytes[8], bytes[9]],
        [512, 16, 8, 6]
      )
    }
    if (name === 'IDAT') compressed.push(bytes)
    offset += length + 12
  }
  const scanlines = inflateSync(Buffer.concat(compressed)),
    pixels = Buffer.alloc(512 * 16 * 4)
  assert.equal(scanlines.length, 16 * 2049)
  for (let y = 0; y < 16; y++) {
    assert.equal(scanlines[y * 2049], 0, 'the retained importer emits unfiltered RGBA rows')
    scanlines.copy(pixels, y * 2048, y * 2049 + 1, (y + 1) * 2049)
  }
  return pixels
}
function crop(pixels, index) {
  return Buffer.concat(
    Array.from({ length: 16 }, (_, y) =>
      pixels.subarray(y * 2048 + index * 128, y * 2048 + (index + 1) * 128)
    )
  )
}

test('Shield PNG independently matches all 15 raw RGBA hashes and three distinct alpha families', () => {
  const pixels = atlasPixels()
  assert.equal(art.frames.length, 15)
  for (let index = 0; index < 15; index++) {
    const data = crop(pixels, index),
      frame = art.frames[index],
      alpha = []
    assert.deepEqual(
      [frame.source, frame.x, frame.y, frame.w, frame.h],
      [1538 + index, index * 32, 0, 32, 16]
    )
    assert.equal(sha(data), hashes[index])
    assert.equal(frame.rgbaSHA256, hashes[index])
    for (let p = 0; p < data.length; p += 4) {
      alpha.push(data[p + 3])
      assert.equal(data[p + 3] % 17, 0)
      if (data[p + 3]) assert.deepEqual([...data.subarray(p, p + 3)], [229, 220, 214])
    }
    assert.equal(Math.max(...alpha), [170, 119, 85][Math.floor(index / 5)])
  }
  assert.ok(
    crop(pixels, 15).every(value => value === 0),
    'unused atlas cell stays transparent'
  )
  assert.deepEqual(
    art.phases,
    bases.map((source, i) => ({ source, lift: lifts[i] }))
  )
  assert.deepEqual(
    art.tints.map(t => [t.owner, t.selector, t.paletteIndex, t.rgb]),
    rgb.map((color, i) => [i, [4, 0, 1, 3][i], [220, 138, 154, 228][i], color])
  )
})

test(
  'Shield atlas and tables match independent raw original-file decoding',
  {
    skip: !process.env.POPULOUS_GAME && 'Set POPULOUS_GAME for the static original-data comparison',
  },
  () => {
    const raw = Object.fromEntries(
      Object.entries(art.inputSHA256).map(([name, expected]) => {
        const bytes = readFileSync(join(process.env.POPULOUS_GAME, name))
        assert.equal(sha(bytes), expected, name)
        return [name, bytes]
      })
    )
    const hfx = raw['data/hfx0-0.dat'],
      pal = raw['data/pal0-c.dat'],
      al = raw['data/al0-c.dat']
    assert.equal(hfx.toString('ascii', 0, 4), 'PSFB')
    const pixels = atlasPixels()
    for (let source = 1538; source <= 1552; source++) {
      const header = 8 + source * 8,
        width = hfx.readUInt16LE(header),
        height = hfx.readUInt16LE(header + 2)
      assert.deepEqual([width, height], [32, 16])
      let cursor = hfx.readUInt32LE(header + 4)
      const decoded = Buffer.alloc(width * height * 4)
      for (let y = 0; y < height; y++) {
        let x = 0
        for (;;) {
          const count = hfx.readInt8(cursor++)
          if (!count) break
          if (count < 0) x -= count
          else
            for (let i = 0; i < count; i++) {
              const value = hfx[cursor++],
                dest = (y * width + x++) * 4,
                color = al[(value | 15) << 8] * 4
              pal.copy(decoded, dest, color, color + 3)
              decoded[dest + 3] = (value & 15) * 17
            }
          assert.ok(x <= width)
        }
      }
      assert.deepEqual(crop(pixels, source - 1538), decoded, `HFX${source}`)
    }
    const exe = raw['d3dpoptb.exe'],
      pe = exe.readUInt32LE(0x3c),
      count = exe.readUInt16LE(pe + 6)
    const sections = pe + 24 + exe.readUInt16LE(pe + 20)
    const at = address => {
      const rva = address - 0x400000
      for (let i = 0; i < count; i++) {
        const section = sections + i * 40,
          start = exe.readUInt32LE(section + 12)
        if (rva >= start && rva < start + exe.readUInt32LE(section + 16))
          return exe.readUInt32LE(section + 20) + rva - start
      }
      assert.fail(`unmapped address ${address.toString(16)}`)
    }
    for (let i = 0; i < 16; i++) {
      const offset = at(0x59d9d8 + i * 4)
      assert.deepEqual(art.phases[i], {
        source: exe.readInt16LE(offset),
        lift: exe.readInt16LE(offset + 2),
      })
    }
    for (let owner = 0; owner < 4; owner++) {
      const selector = exe[at(0x5a89cb + owner * 5)],
        paletteIndex = al[selector * 4096 + 0xf82]
      assert.deepEqual(art.tints[owner], {
        owner,
        selector,
        paletteIndex,
        rgb: [...pal.subarray(paletteIndex * 4, paletteIndex * 4 + 3)],
      })
    }
  }
)
