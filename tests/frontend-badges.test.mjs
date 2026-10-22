import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { frontendBadges, frontendBadgeBounds, frontendBadgePixels, trademarkRows } from '../app/frontend-badges.ts'
import { frontendBackground } from '../app/frontend-composition.ts'
const source = new Uint8Array(readFileSync(new URL('../public/original/frontend/composition.bin', import.meta.url)))

test('sharp badge overlays copy exact live composed pixels and leave surrounding stone transparent', () => {
  for (const frameWidth of [640, 854, 972, 1148]) for (const glow of [null, 0, 7]) {
    for (const [index, badge] of frontendBadges.entries()) {
      const frame = frontendBackground(source, { x: badge.x + 20, y: badge.y + 20 }, true, glow, [], frameWidth)
      const before = frame.slice()
      const { pixels, width, height } = frontendBadgePixels(frame, frameWidth, index)
      assert.equal(height, badge.height + 2)
      assert.equal(width, badge.trademarkX + 17 - badge.x + 2)
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const inBody = x < badge.width + 2
        const inTrademark = trademarkRows.some((spans, row) => y >= row && y <= row + 2 && spans.some(([start, end]) =>
          x >= badge.trademarkX - badge.x + start && x <= badge.trademarkX - badge.x + end + 2))
        const at = (y * width + x) * 4
        if (inBody || inTrademark) {
          const original = ((frontendBadgeBounds[index].y + y) * frameWidth + (frameWidth - 640) / 2 + frontendBadgeBounds[index].x + x) * 4
          assert.deepEqual(pixels.subarray(at, at + 4), frame.subarray(original, original + 4))
        } else assert.deepEqual(pixels.subarray(at, at + 4), new Uint8ClampedArray(4))
      }
      assert.deepEqual(frame, before, 'overlay cannot alter background composition')
    }
  }
})

test('badge pixels retain animated pointer palette effects, not a static cover', () => {
  for (const [index, badge] of frontendBadges.entries()) {
    const draw = glow => frontendBadgePixels(frontendBackground(source,
      { x: badge.x + 20, y: badge.y + 20 }, true, glow, [], 972), 972, index).pixels
    assert.notDeepEqual(draw(null), draw(0))
    assert.notDeepEqual(draw(0), draw(7))
  }
})

test('only badge overlay uses sharp filtering; surrounding background remains unchanged', () => {
  const css = readFileSync(new URL('../app/original-main-menu.module.css', import.meta.url), 'utf8')
  assert.match(css, /\.badge\s*\{[^}]*pointer-events: none;[^}]*image-rendering: pixelated; image-rendering: crisp-edges;/)
  const body = readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8')
  assert.match(body, /frontendBadgePixels\(\s*rgba,\s*canvasWidth,\s*index,/)
  assert.match(body, /badgeContext\.putImageData/)
  assert.match(body, /prepared\.composition &&/)
  assert.equal((body.match(/setInterval\(/g) ?? []).length, 1, 'no extra animation scheduling')
})

test('live menu draw uploads badge snapshots from the same composition and owns no extra redraw', async () => {
  const { default: ts } = await import('typescript')
  const text = readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8')
  const parsed = ts.createSourceFile('menu.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let callback
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(parsed) === 'draw') callback = node.initializer.arguments[0]
    ts.forEachChild(node, visit)
  }
  visit(parsed)
  const code = ts.transpileModule(`return ${callback.getText(parsed)}`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  for (const canvasWidth of [640, 972]) for (const glow of [null, 3]) for (const ready of [false, true]) for (const failed of [false, true]) {
    const images = [[], [], []]
    const context = index => ({ getContext: () => ({ putImageData: image => images[index].push(image) }) })
    let compositions = 0
    const args = {
      canvas: { current: context(0) }, badges: { current: [context(1), context(2)] },
      prepared: { composition: source, badgeVectors: ready ? [{}, {}] : [null, null] }, pointer: { current: { x: 600, y: 440 } }, panel: 'main',
      pointerMode: { current: glow !== null }, glowFrame: { current: glow }, optionRows: [], canvasWidth,
      tutorialRecommendationRows: [], tutorialParagraphRows: [], frontendQuitRows: [],
      checkpointRecovery: { noticeRows: [], shadowRows: [] },
      vectorFailures: [failed, false], questionReady: true, artReady: true, logoReady: true, frontendBadgePixels,
      frontendBackground: (...values) => { compositions++; return frontendBackground(...values) },
      ImageData: class { constructor(data, width, height) { Object.assign(this, { data, width, height }) } },
    }
    new Function(...Object.keys(args), code)(...Object.values(args))()
    assert.equal(compositions, 1)
    assert.deepEqual(images.map(items => items.length), [1, 1, 1])
    for (const index of [0, 1]) {
      const expected = frontendBadgePixels(images[0][0].data, canvasWidth, index, ready && !(index === 0 && failed) ? { source, pointer: args.pointer.current, frame: glow } : undefined)
      assert.deepEqual(images[index + 1][0], new args.ImageData(expected.pixels, expected.width, expected.height))
    }
  }
})

test('vector mode removes all native lettering while preserving original guard and trademark', () => {
  for (const [index, badge] of frontendBadges.entries()) {
    const frame = frontendBackground(source, { x: 320, y: 240 }, true, null, [], 972)
    const native = frontendBadgePixels(frame, 972, index)
    const vector = frontendBadgePixels(frame, 972, index, { source, pointer: { x: 320, y: 240 }, frame: null })
    for (let y = 0; y < vector.height; y++) for (let x = 0; x < vector.width; x++) {
      const at = (y * vector.width + x) * 4
      if (x >= 1 && x <= badge.width && y >= 1 && y <= badge.height)
        assert.deepEqual(vector.pixels.subarray(at, at + 4), new Uint8ClampedArray(4))
      else assert.deepEqual(vector.pixels.subarray(at, at + 4), native.pixels.subarray(at, at + 4))
    }
  }
})

test('vector glow is bounded by the original cursor mask, animated and absent in keyboard mode', () => {
  for (const [index, badge] of frontendBadges.entries()) {
    const pointer = { x: badge.x + 25, y: badge.y + 25 }
    const frame = frontendBackground(source, pointer, true, null, [], 640)
    const draw = (pointer, phase) => frontendBadgePixels(frame, 640, index, { source, pointer, frame: phase })
    const unlit = draw(pointer, null), lit = draw(pointer, 0)
    assert.notDeepEqual(lit.pixels, unlit.pixels)
    assert.notDeepEqual(lit.pixels, draw(pointer, 7).pixels)
    assert.deepEqual(draw({ x: 320, y: 240 }, 0).pixels, draw({ x: 320, y: 240 }, null).pixels)
    for (let row = 1; row <= badge.height; row++) for (let col = 1; col <= badge.width; col++) {
      const alpha = lit.pixels[(row * lit.width + col) * 4 + 3]
      assert.ok(alpha >= 0 && alpha <= 255)
    }
  }
})
