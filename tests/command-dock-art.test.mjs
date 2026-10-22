import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const read = path => readFileSync(new URL('../' + path, import.meta.url))
const css = read('app/globals.css').toString()
const native = JSON.parse(read('decomp/research/ordinary-hud-controls/native.json'))
const declarations = selector => Object.fromEntries(
  css.slice(css.indexOf(selector + '{') + selector.length + 1).split('}')[0]
    .split(';').filter(Boolean).map(value => {
      const separator = value.indexOf(':')
      return [value.slice(0, separator), value.slice(separator + 1)]
    })
)

test('all command tabs share the original root geometry and source-owned artwork', () => {
  assert.equal(native.executableSha256, '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  assert.deepEqual(native.roots.map(root => root.id), [2, 3, 4])
  for (const root of native.roots) {
    assert.deepEqual(root.rectangle, [0, 204, 100, 277])
    assert.equal(root.renderer, '004a1720')
  }
  assert.deepEqual(native.frames.commands.ids, [707, 709, 708, 710, 0, 711, 559, 562, 560])
  const dock = declarations('.command-dock')
  assert.deepEqual([dock.left, dock.top, dock.width, dock.height], ['0', '204px', '100px', '277px'])
  assert.equal(dock.background, "url('/original/follower-task-panel.png') no-repeat")
  assert.equal(dock.border, '0')
  assert.equal(dock.bottom, undefined, 'do not stretch the original root to the viewport footer')
  const png = read('public/original/follower-task-panel.png')
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [100, 277])
  assert.equal(createHash('sha256').update(png).digest('hex'),
    '1ef9497deeeff80e86b7782c82695b4efd960254626ebd6455e7dab07c700978')
})

test('removing the painted ridge preserves the current command controls and follower layout', () => {
  const dock = declarations('.command-dock')
  assert.equal(dock.padding, '9px 4px 7px', 'retain prior 2px border plus 7px/2px content offsets')
  assert.equal(dock.overflow, undefined, 'do not clip controls or keyboard focus')
  const followers = declarations('.followers-dock')
  assert.equal(followers.padding, '0')
  assert.equal(followers.background, dock.background)
  assert.equal(followers.height, dock.height)
  const page = read('app/page.tsx').toString()
  assert.match(page, /className=\{`command-dock\$\{tab === 'followers' \? ' followers-dock' : ''\}`\}/)
  assert.match(page, /aria-label="Command panel"/)
  assert.match(page, /className="help-button"[\s\S]*?aria-label="Menu"[\s\S]*?aria-description="Help and game menu"[\s\S]*?onClick=\{openMenu\}/)
})


test('edge-aligned follower controls retain an inset native-palette keyboard focus ring', () => {
  const focus = declarations('.follower-tasks button:focus-visible')
  assert.equal(focus.outline, '1px solid #fff7bb')
  assert.equal(focus['outline-offset'], '-1px')
  const hud = JSON.parse(read('app/original-hud.json'))
  assert.ok(hud.colors.includes('#fff7bb'), 'reuse the original HUD palette')
  const button = declarations('.follower-tasks button')
  assert.equal(button.width, '15px')
  assert.equal(button.height, '34px')
  assert.equal(button.overflow, 'visible', 'do not hide native artwork to clip the focus ring')
  const outwardExtent = parseFloat(focus.outline) + parseFloat(focus['outline-offset'])
  assert.equal(outwardExtent, 0, 'the ring must not extend beyond the edge-aligned button')
  for (const scale of [0.96, 1, 2]) assert.equal(outwardExtent * scale, 0)
})
