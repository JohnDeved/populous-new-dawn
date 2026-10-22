import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { missionNumbers } from '../app/mission-data.ts'
import { selectorArt, selectorTitle, selectorTooltip, selectorWorld } from '../app/world-selector-art.ts'

const read = path => JSON.parse(readFileSync(path, 'utf8'))
const manifest = read('app/original-world-selector.json')
const root = 'public/original/world-selector/native/'
const provenance = read(root + 'provenance.json')
const runtime = read(root + 'runtime.json')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')

function pixels(png) {
  assert.equal(png.readUInt8(24), 8)
  assert.equal(png.readUInt8(25), 6)
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20)
  const compressed = []
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset)
    if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT') compressed.push(png.subarray(offset + 8, offset + 8 + length))
    offset += length + 12
  }
  const raw = inflateSync(Buffer.concat(compressed)), rows = []
  assert.equal(raw.length, height * (width * 4 + 1))
  for (let y = 0; y < height; y++) {
    const start = y * (width * 4 + 1)
    assert.equal(raw[start], 0, 'imported pixels use the unchanged filter-zero PNG encoder')
    rows.push(raw.subarray(start + 1, start + 1 + width * 4))
  }
  return {width, height, rgba: Buffer.concat(rows)}
}

test('every selector image preserves recorded dimensions, source RGBA and PNG bytes', () => {
  assert.equal(provenance.sourceManifestSha256, sha(readFileSync('app/original-world-selector.json')))
  assert.deepEqual(provenance.inputs, read('decomp/research/world-selector-manifest/sources.json').inputs)
  assert.deepEqual(provenance.decoderFunctionsSha256, manifest.decoderFunctionsSha256)
  assert.deepEqual(provenance.fontSlots, {title: 3, tooltip: 11})
  assert.ok(provenance.limits.some(value => /Cursor palette backend remains unresolved/.test(value)))
  for (const [url, asset] of Object.entries(provenance.assets)) {
    const png = readFileSync(`public${url}`), frame = pixels(png)
    assert.equal(sha(png), asset.outputSha256, url)
    assert.equal(sha(frame.rgba), asset.rgbaSha256, url)
    assert.deepEqual([frame.width, frame.height], [asset.width, asset.height], url)
    const alpha = frame.rgba.filter((_, i) => i % 4 === 3)
    assert.ok(alpha.every(value => value === 0 || value === 255), url)
  }
  const generated = readdirSync(root).filter(name => name.endsWith('.png'))
  assert.equal(generated.length, 102)
  assert.ok(generated.every(name => `/original/world-selector/native/${name}` in provenance.assets))
  assert.ok(readdirSync(root).reduce((total, name) => total + readFileSync(root + name).length, 0) < 1_000_000)
})

test('all 20 selected-world palette banks include three native socket sizes and distinct font slots', () => {
  assert.deepEqual(Object.keys(runtime.banks), Object.keys(manifest.paletteBanks))
  for (const bank of Object.values(runtime.banks)) {
    for (const [frame, size] of [[0, [638, 61]], [1, [21, 21]], [2, [21, 21]], [3, [13, 15]],
      [4, [13, 15]], [5, [10, 12]], [6, [10, 12]], [10, [37, 37]]]) {
      assert.deepEqual([provenance.assets[bank.panel[frame]].width, provenance.assets[bank.panel[frame]].height], size)
    }
    for (const [id, width] of [[978, 109], [979, 167], [980, 218]]) {
      assert.deepEqual([provenance.assets[bank.tooltips[id]].width, provenance.assets[bank.tooltips[id]].height], [width, 10])
    }
    assert.deepEqual([provenance.assets[bank.cursor].width, provenance.assets[bank.cursor].height], [26, 27])
  }
  for (const world of manifest.worlds) {
    assert.deepEqual(selectorArt(world.mission), runtime.banks[world.palette])
    const title = selectorTitle(world.mission)
    assert.equal(title.text, world.title.text)
    assert.equal(provenance.assets[title.src].rgbaSha256, world.title.rgbaSha256)
    assert.equal(title.width, world.title.width)
    assert.equal(title.height, 19)
    assert.equal(selectorTooltip(world.mission, '980').text, 'You have conquered this world: {}select')
  }
  assert.equal(selectorWorld(25).body.index, 0, 'the sun reuses its existing special scene renderer')
  assert.throws(() => selectorWorld(0), RangeError)
  assert.throws(() => selectorArt(26), RangeError)
})

test('opening URL identity and bitmap bytes are reused, not reinterpreted or regenerated', () => {
  for (const mission of [1, 2, 3]) {
    const art = selectorArt(mission)
    for (const frame of [0, 5, 6, 10]) assert.equal(art.panel[frame], `/original/world-selector/panel/${mission}-${frame}.png`)
    assert.equal(art.cursor, `/original/world-selector/text/cursor-${mission}.png`)
    for (const id of [978, 979, 980]) assert.equal(art.tooltips[id], `/original/world-selector/text/tooltip-${mission}-${id}.png`)
    assert.equal(selectorTitle(mission).src, `/original/world-selector/text/title-${mission}.png`)
  }
  const css = readFileSync('app/world-selector.module.css', 'utf8')
  assert.match(css, /\.nativeGlyph img \{ left: 0; top: 0; width: 100%; height: 100%; \}/)
  assert.match(css, /\.nativeSelector \.selectedTitle \{ bottom: calc\(var\(--panel-width\) \* 61 \/ 640\); \}/)
  assert.match(css, /\.nativeSelector \.selectedTitle h3 \{ min-height: 0; \}/)
  assert.match(css, /\.selector \.nativePanel \.start \{[^}]+min-width: 0; min-height: 0;/)
})

test('native campaign activation uses the controlled profile and rejects unsupported or locked starts', () => {
  const home = readFileSync('app/page.tsx', 'utf8')
  const selectors = [...home.matchAll(/<WorldSelector\s[\s\S]*?\/>/g)]
  assert.equal(selectors.length, 1, 'one controlled native campaign entry')
  assert.match(selectors[0][0], /nativeSelection=\{\{\s+\.\.\.store\.getCampaignSelection\(\),\s+onSelect: store\.selectCampaignMission,\s+\}\}/)
  assert.match(selectors[0][0], /missions=\{missionNumbers\}/)
  assert.match(selectors[0][0], /onStart=\{startMission\}/)
  assert.match(home, /function startMission\(mission: number\) \{\s+beginLoad\(\{ kind: 'mission', mission \}\)/)
  assert.match(home, /if \(request\.kind === 'mission' && !store\.startMission\(request\.mission\)\) return/)
  const store = createGameStore(), original = store.getWorld()
  assert.deepEqual(store.getCampaignSelection(), { selected: 1, progressionMission: 1, available: [1] })
  assert.deepEqual(store.getCompletedMissions(), [])
  assert.deepEqual(missionNumbers, Array.from({length: 23}, (_, i) => i + 1))
  for (const mission of [2, 23, 24, 25, 79]) {
    assert.equal(store.startMission(mission), false, `locked or unsupported Mission ${mission} stays unplayable`)
    assert.equal(store.getWorld(), original)
  }
  assert.equal(store.startMission(1), true, 'only initial native availability may launch')
  assert.equal(store.isDebugLaunch(), false)
  assert.equal(store.canSave(), true)
})

test('art importer validates destinations before writes and check never changes bytes', () => {
  const result = spawnSync('python3', ['-B', '-'], {encoding: 'utf8', input: `
import importlib.util
from pathlib import Path
import tempfile
spec = importlib.util.spec_from_file_location('art', 'scripts/import-world-selector-art.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    target = root / 'outputs'
    target.mkdir()
    (target / 'b.png').write_bytes(b'preserve')
    try:
        module.write_outputs({'a.png': b'new', 'b.png': b'different'}, target)
    except ValueError:
        pass
    else:
        raise AssertionError('Conflicting output accepted')
    assert not (target / 'a.png').exists()
    assert (target / 'b.png').read_bytes() == b'preserve'
    module.write_outputs({'b.png': b'preserve'}, target, check=True)
    assert list(target.iterdir()) == [target / 'b.png']
    try:
        module.build_art(root, root / 'missing.exe', root)
    except FileNotFoundError:
        pass
    else:
        raise AssertionError('Missing inputs accepted')
`})
  assert.equal(result.status, 0, result.stderr)
})
