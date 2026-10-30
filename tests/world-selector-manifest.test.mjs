import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { selectorWorlds, openingCampaignMissions } from '../app/world-selector-data.ts'

const read = path => JSON.parse(readFileSync(path, 'utf8'))
const manifest = read('app/original-world-selector.json')
const sourcePath = 'decomp/research/world-selector-manifest/sources.json'
const sources = read(sourcePath)
const panel = read('decomp/research/world-selector-panel/panel-data.json')
const text = read('public/original/world-selector/text/provenance.json')
const globes = read('public/original/world-selector/globes/provenance.json')

test('inactive manifest preserves all 25 original body identities and header banks', () => {
  assert.deepEqual(manifest.worlds.map(world => world.mission), Array.from({ length: 25 }, (_, i) => i + 1))
  assert.deepEqual(manifest.worlds.map(world => world.palette),
    ['c', 's', 'p', 'd', 'm', 'c', '6', 'b', '5', 'p', '6', 'h', '1', 'a', 'o',
      'l', 'c', 'g', 'd', '9', 't', '4', 'u', 'n', 'i'])
  for (const world of manifest.worlds) {
    assert.deepEqual(world.body, selectorWorlds.find(body => body.mission === world.mission))
    assert.match(sources.inputs[world.header], /^[a-f0-9]{64}$/)
    assert.match(sources.inputs[manifest.paletteBanks[world.palette].source], /^[a-f0-9]{64}$/)
  }
  assert.equal(manifest.worlds[24].body.index, 0)
  assert.equal(Object.keys(manifest.paletteBanks).length, 20)
  assert.deepEqual(openingCampaignMissions, [1, 2, 3], 'data prerequisite must not activate progression')
})

test('all 25 sockets use original kinds, coordinates, frame pairs and dimensions', () => {
  for (const world of manifest.worlds) {
    const [kind, x, y] = panel.raw_rows[world.mission - 1]
    const glyph = world.panel
    assert.equal(glyph.kind, kind)
    assert.deepEqual(glyph.sourceXY, [x, y])
    assert.deepEqual(glyph.localXY, [x - 1 - Number(kind === 2), y - 1 - Number(kind === 2)])
    assert.deepEqual(glyph.nativeXY, [glyph.localXY[0] + 1, glyph.localXY[1] + 419])
    assert.equal(glyph.availableFrame, [5, 3, 1][kind])
    assert.equal(glyph.completedFrame, glyph.availableFrame + 1)
    assert.equal(glyph.width, panel.frames[glyph.availableFrame].width)
    assert.equal(glyph.height, panel.frames[glyph.availableFrame].height)
  }
  assert.deepEqual(manifest.worlds.slice(15, 21).map(world => world.panel.nativeXY),
    [[408, 426], [412, 437], [412, 448], [408, 459], [442, 430], [442, 456]])
  assert.equal(manifest.panel.hitEdges, 'exclusive-left-top-inclusive-right-bottom')
  assert.deepEqual(manifest.panel.pressedOffset, [1, 1])
  assert.deepEqual(manifest.panel.nativeOrigin, [1, 419])
  assert.equal(manifest.panel.width, 638)
  assert.equal(manifest.panel.height, 61)
})

test('title cases retain native string IDs, Western glyph metrics and exact first-three pixels', () => {
  assert.deepEqual(manifest.worlds.map(world => world.title.languageId),
    [610, 640, 647, 653, 660, 663, 667, 671, 674, 678, 683, 685, 687, 689, 691, 693, 696, 698, 700, 706, 708, 712, 714, 716, 718])
  for (const world of manifest.worlds.slice(0, 3)) {
    const prior = text.banks[world.mission].title
    for (const field of ['text', 'width', 'height', 'rgbaSha256', 'languageId']) {
      assert.equal(world.title[field], prior[field])
    }
  }
  for (const [mission, label, width] of [[4, '04 : Combined Forces', 193], [14, '14 : Attacked From All Sides', 253],
    [16, '16 : Bloodlust', 129], [24, "24 : Journey's End", 162], [25, '25 : The Beginning', 157]]) {
    assert.equal(manifest.worlds[mission - 1].title.text, label)
    assert.equal(manifest.worlds[mission - 1].title.width, width)
    assert.equal(manifest.worlds[mission - 1].title.height, 19)
  }
  assert.equal(manifest.title.fontSlot, 3)
  assert.equal(manifest.title.nativeY, 400)
})

test('shared launch, tooltip and cursor contracts do not invent text or palette certainty', () => {
  assert.deepEqual(manifest.panel.launch, { nativeXY: [577, 430], highlightFrame: 10,
    hitDimensionsFrame: 11, width: 37, height: 37 })
  assert.equal(manifest.tooltip.fontSlot, 11)
  assert.equal(manifest.tooltip.delayMs, 500)
  assert.equal(manifest.tooltip.delayComparison, 'strictly-greater')
  for (const id of [978, 979, 980]) {
    for (const field of ['text', 'width', 'height']) {
      assert.equal(manifest.tooltip.strings[id][field], text.banks[1].tooltips[id][field])
    }
  }
  assert.equal(manifest.cursor.frame, 12)
  assert.deepEqual(manifest.cursor.hotspot, [0, 0])
  assert.deepEqual([manifest.cursor.width, manifest.cursor.height], [26, 27])
  assert.match(manifest.cursor.paletteBinding, /unresolved/)
})

test('source pinning agrees with independently retained imports and verified archive', () => {
  assert.equal(manifest.sourceManifestSha256, createHash('sha256').update(readFileSync(sourcePath)).digest('hex'))
  assert.equal(sources.archive.sha256, '6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702')
  assert.equal(sources.archive.component, 'Component0')
  for (const [name, hash] of Object.entries(text.inputs)) assert.equal(sources.inputs[name], hash)
  for (const asset of globes.assets) {
    for (const [name, hash] of Object.entries(asset.sources ?? {})) {
      if (name in sources.inputs) assert.equal(sources.inputs[name], hash)
    }
  }
  assert.deepEqual(manifest.decoderFunctionsSha256, text.decoderFunctionsSha256)
})

test('importer rejects missing/corrupt inputs and non-native title cases before writing', () => {
  const result = spawnSync('python3', ['-B', '-'], { encoding: 'utf8', input: `
import importlib.util
from pathlib import Path
import tempfile
spec = importlib.util.spec_from_file_location('manifest', 'scripts/import-world-selector-manifest.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    try:
        module.read_inputs(root, root / 'd3dpoptb.exe', root)
    except FileNotFoundError:
        pass
    else:
        raise AssertionError('Missing input accepted')
    (root / 'd3dpoptb.exe').write_bytes(b'wrong source')
    try:
        module.read_inputs(root, root / 'd3dpoptb.exe', root)
    except ValueError as error:
        assert str(error) == 'Source hash mismatch: d3dpoptb.exe'
    else:
        raise AssertionError('Wrong input accepted')
    assert not (root / 'app').exists()
class InvalidPE:
    def read(self, address, size): return bytes(size)
    def u32(self, address): return 0
try:
    module.title_ids(InvalidPE())
except ValueError as error:
    assert str(error) == 'Unexpected native title dispatch: 1'
else:
    raise AssertionError('Guessed title sequence accepted')
` })
  assert.equal(result.status, 0, result.stderr)
})
