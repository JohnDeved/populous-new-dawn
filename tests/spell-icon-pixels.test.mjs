import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import test from 'node:test'
import sharp from 'sharp'
import pixels from './fixtures/spell-icon-pixels.json' with { type: 'json' }
import states from './fixtures/spell-icon-states.json' with { type: 'json' }
import hud from '../app/original-hud.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import { SPELLS } from '../app/world-rules.ts'
import { assertOriginalSpellIconPixels } from '../scripts/spell-icon-pixel-evidence.mjs'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')

test('canonical pixel fixture binds all original descriptors, source inputs and decoder', () => {
  assert.equal(pixels.schemaVersion, 1)
  assert.equal(pixels.sources['d3dpoptb.exe'], '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  for (const path of ['data/hfx0-0.dat', 'data/pal0-c.dat'])
    assert.equal(pixels.sources[path], hud.sha256[path])
  assert.equal(pixels.decoder.path, 'scripts/import-original.py')
  assert.equal(hash(readFileSync(new URL('../' + pixels.decoder.path, import.meta.url))), pixels.decoder.sha256)
  assert.deepEqual(pixels.descriptorLayout, { base: 0x5a80d0, stride: 62,
    iconOffsets: [16, 18, 20], bank: 'data/hfx0-0.dat', renderer: '0049daf0' })
  assert.deepEqual(pixels.descriptors.map(d => d.model), SPELLS.map(s => s.model).sort((a, b) => a - b))
  for (const descriptor of pixels.descriptors) {
    assert.equal(descriptor.address, 0x5a80d0 + descriptor.model * 62)
    assert.match(descriptor.recordSHA256, /^[a-f0-9]{64}$/)
    assert.deepEqual(descriptor.icons, states.icons[descriptor.model])
    assert.deepEqual(descriptor.icons, rules.spellCharging[descriptor.model].icons)
  }
  assert.deepEqual(pixels.frames.map(f => f.id), [...new Set(Object.values(states.icons).flat().concat(1056))].sort((a, b) => a - b))
  assert.equal(pixels.frames.length, 61)
})

test('all shipped HUD sprite RGBA bytes match independently decoded original source hashes', async () => {
  const { data, info } = await sharp(new URL('../public/original/hud.png', import.meta.url).pathname)
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  assert.deepEqual([info.width, info.height, info.channels], [hud.width, hud.height, 4])
  const actual = pixels.frames.map(({ id, width, height }) => {
    const rect = hud.rects[id]
    assert.deepEqual([rect.w, rect.h], [width, height])
    const rows = Array.from({ length: height }, (_, y) => {
      const begin = ((rect.y + y) * info.width + rect.x) * 4
      return data.subarray(begin, begin + width * 4)
    })
    return { id, width, height, rgbaSHA256: hash(Buffer.concat(rows)) }
  })
  assertOriginalSpellIconPixels(actual, pixels)
})

test('original pixel contract rejects missing, extra, duplicate, reordered and changed frames', () => {
  assert.doesNotThrow(() => assertOriginalSpellIconPixels(pixels.frames, pixels))
  const first = pixels.frames[0]
  for (const wrong of [pixels.frames.slice(1), [...pixels.frames, first],
    [first, ...pixels.frames.slice(0, -1)], [...pixels.frames].reverse(),
    [{ ...first, rgbaSHA256: '0'.repeat(64) }, ...pixels.frames.slice(1)],
    [{ ...first, width: first.width + 1 }, ...pixels.frames.slice(1)]])
    assert.throws(() => assertOriginalSpellIconPixels(wrong, pixels))
})

test('shared rendered witness is invoked by both local CLI and the existing bounded hosted Tutorial', async () => {
  const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
  for (const path of ['scripts/check-browser-spell-icon-states.mjs', 'scripts/tutorial-browser/spell-icon-states.mjs'])
    assert.match(read(path), /runSpellIconMatrix\(/)
  const runner = read('scripts/tutorial-browser/run.mjs')
  assert.match(runner, /spellIconScenarioSha256: hash\(spellIconScenario\)/)
  assert.match(runner, /if \(selectedScenario === 'tutorial' \|\| selectedScenario === 'frontend-held-escape'\) \{[\s\S]*receipt\.spellIconStates = await/)
  const { spellIconEpisodeLimitMs } = await import('../scripts/tutorial-browser/spell-icon-states.mjs')
  assert.equal(spellIconEpisodeLimitMs, 75000)
  const { browserCapMs } = await import('../scripts/tutorial-browser/scenario-policy.mjs')
  assert.equal(browserCapMs('tutorial'), 240000)
  assert.match(read('scripts/spell-icon-state-browser.mjs'), /page\.evaluate\(readOriginalSpellIconPixels/)
  assert.match(read('scripts/spell-icon-state-browser.mjs'), /assertOriginalSpellIconPixels\(report\.originalPixels/)
})

// Source-composition guard: the original witness predates the pnpm dependency
// profile and shared producer deadline. Neither may be replaced by stale inputs.
test('composed witness retains package-manager receipts and the current outer browser clock', () => {
  const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
  const evidence = read('scripts/spell-icon-state-evidence.mjs')
  assert.match(evidence, /import \{ dependencyInputPaths \} from '\.\/orchestration\/dependency-profile\.mjs'/)
  assert.match(evidence, /'scripts\/orchestration\/dependency-profile\.mjs', \.\.\.dependencyInputPaths\(root\)/)
  assert.doesNotMatch(evidence, /'node_modules\/\.package-lock\.json'/)
  for (const input of ['scripts/spell-icon-state-browser.mjs', 'scripts/spell-icon-pixel-evidence.mjs',
    'scripts/check-static-spell-icon-pixels.py', 'scripts/import-original.py', 'tests/fixtures/spell-icon-pixels.json'])
    assert.ok(evidence.includes(`'${input}'`), `Composed input retained: ${input}`)
  const runner = read('scripts/tutorial-browser/run.mjs')
  const declarations = runner.match(/^let browser,([^\n]+)$/m)?.[1].split(',').map(name => name.trim())
  for (const name of ['browserDeadlineAt', 'producerBudget', 'producerCleanup'])
    assert.ok(declarations?.includes(name), `Current runner owner retained: ${name}`)
  assert.match(runner, /const browserStartedMs = performance\.now\(\)/)
  assert.match(runner, /const elapsedMs = performance\.now\(\) - browserStartedMs/)
  assert.doesNotMatch(runner, /browserStartedAt/)
  assert.match(runner, /receipt\.browserCapMs = browserCapMs\(selectedScenario\)/)
  assert.match(runner, /timer = setTimeout\([^\n]+receipt\.browserCapMs\)/)
})
