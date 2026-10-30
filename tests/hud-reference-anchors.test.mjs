import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { commandDockTop, followerTaskPosition } from '../app/hud-layout.ts'
import { worshipDrawPoint, worshipTargetPoint } from '../app/worship-acquisition-layout.ts'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('all36 follower anchors accumulate normalized parent and child before conversion', () => {
  assert.equal(commandDockTop, 203)
  const xs = [0, 15, 31, 47, 63, 80]
  const locals = [6, 47, 88, 129, 190, 231]
  const ys = [209, 250, 291, 332, 393, 434]
  for (const [row, local] of locals.entries()) {
    for (let column = 0; column < 6; column++) {
      const point = followerTaskPosition(column, local)
      assert.deepEqual([point.left, point.top + commandDockTop], [xs[column], ys[row]])
    }
  }
  assert.match(read('app/follower-tasks-view.tsx'), /style=\{followerTaskPosition\(column, row.y\)\}/)
})

test('Query descriptor remains evidence, while the DOM uses realized reference bounds', () => {
  const fx = Math.trunc(64 * 65536 / 640), fy = Math.trunc(114 * 65536 / 480)
  const fw = Math.trunc(13 * 65536 / 640), fh = Math.trunc(12 * 65536 / 480)
  const x = value => Math.floor(640 * value / 65536)
  const y = value => Math.floor((480 * value + 240) / 65536)
  assert.deepEqual([x(fx), y(fy), x(fx + fw), y(fy + fh)], [63, 113, 76, 125])
  const css = read('app/globals.css')
  assert.match(css, /\.shaman-controls\{[^}]*top:112px/)
  assert.match(css, /\.help-button\{position:absolute;left:63px;top:1px;width:13px;height:12px/)
})

test('roster-driven fit refreshes minimap backing pixels and preserves the world seam', () => {
  const page = read('app/page.tsx'), css = read('app/globals.css')
  assert.match(page, /hudScale\(window.innerWidth, window.innerHeight, hudSize, spellRoster.length\)/)
  assert.match(page, /\}, \[hudSize, spellRoster.length\]\)/)
  assert.match(page, /<MinimapFrame key=\{`\$\{hudSize\}-\$\{hudHeight\}`\} \/>/)
  assert.match(css, /--side:calc\(100px \* var\(--hud-scale\)\)/)
  assert.match(css, /\.world-viewport\{position:absolute;inset:0 0 0 var\(--side\)/)
  assert.match(read('app/scene.ts'), /this.resize.observe\(container\)/)
})

test('worship arrival still follows a measured target and a cached target rescaled with the HUD', () => {
  const viewport = { x: 100, y: 0, width: 540, height: 480 }
  const targetRect = { x: 4, y: 212, width: 31, height: 43 }
  const reference = { viewport, targetRect, targetHud: { x: 19.5, y: 233.5 },
    target: { x: 19, y: 233 }, origin: { x: 300, y: 240 }, hudScale: 1 }
  for (const scale of [0.5, 1, 480 / 522, 2]) {
    const cached = { viewport: { x: 100 * scale, y: 0, width: 640 - 100 * scale, height: 480 },
      targetRect: { x: 4 * scale, y: 212 * scale, width: 31 * scale, height: 43 * scale },
      targetHud: reference.targetHud, hudScale: scale }
    const measured = { ...cached, targetRect: { ...cached.targetRect, y: 256 * scale } }
    for (const current of [cached, measured]) {
      const actual = worshipDrawPoint(reference.target, reference, current, true)
      const expected = worshipTargetPoint(current)
      assert.ok(Math.abs(actual.x - expected.x) < 1e-9)
      assert.ok(Math.abs(actual.y - expected.y) < 1e-9)
    }
  }
})
