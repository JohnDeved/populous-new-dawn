import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const oracle = JSON.parse(read('tests/fixtures/tribe-flag-reference.json'))
const pixels = value => {
  assert.match(value, /^(?:0|(?:0|[1-9]\d*)px)$/)
  return value === '0' ? 0 : Number(value.slice(0, -2))
}

test('CSS pixel reader rejects alternate units and partial numbers', () => {
  assert.equal(pixels('0'), 0)
  assert.equal(pixels('0px'), 0)
  assert.equal(pixels('77px'), 77)
  for (const invalid of ['77em', '20px garbage', '77', ' 77px', '77px ', '7.7px', 'NaNpx', '', '01px']) {
    assert.throws(() => pixels(invalid))
  }
})

test('native tribe endpoints derive from retained descriptors, not CSS dimensions', () => {
  assert.equal(oracle.originalExecutableSha256, '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  assert.equal(oracle.records.length, 3)
  assert.deepEqual(oracle.records.map(record => [record.address, record.key]), [
    ['005cb0f2', 1], ['005cb134', 2], ['005cb176', 3],
  ])
  assert.deepEqual(oracle.rootOrigin, [0, 0])
  assert.deepEqual(oracle.referenceSize, [640, 480])
  const x = fixed => Number((640n * fixed) / 65536n)
  const y = fixed => Number((480n * fixed + 240n) / 65536n)
  for (const record of oracle.records) {
    const raw = Buffer.from(record.raw, 'hex')
    const descriptor = Array.from({ length: 6 }, (_, index) => raw.readInt16LE(25 + index * 2))
    assert.deepEqual(descriptor, record.descriptor)
    assert.equal(raw.readUInt32LE(41), 0x0049d2a0)
    assert.equal(raw.readUInt32LE(55), record.key)
    const [left, top, hitLeft, hitTop, width, height] = descriptor
    assert.deepEqual([hitLeft, hitTop], [left, top])
    const fx = BigInt(left) * 65536n / 640n
    const fy = BigInt(top) * 65536n / 480n
    const fw = BigInt(width) * 65536n / 640n
    const fh = BigInt(height) * 65536n / 480n
    assert.deepEqual([x(fx), y(fy), x(fx + fw), y(fy + fh)], record.expectedEndpoints)
  }
})

test('tribe CSS realizes each endpoint rectangle within the unchanged upper HUD', () => {
  const css = read('app/globals.css')
  const declarations = selector => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = css.match(new RegExp(escaped + '\\{([^}]+)\\}'))
    assert.ok(match, selector)
    return Object.fromEntries(match[1].split(';').filter(Boolean).map(value => value.split(':')))
  }
  const parent = declarations('.shaman-controls')
  assert.equal(parent.left, '0')
  assert.equal(parent.top, '112px')
  for (const [index, name] of ['dakini', 'chumara', 'matak'].entries()) {
    const style = { ...declarations('.tribe-flag'), ...declarations('.' + name) }
    const [left, top, width, height] = ['left', 'top', 'width', 'height'].map(key => pixels(style[key]))
    const px = pixels(parent.left), py = pixels(parent.top)
    assert.deepEqual([px + left, py + top, px + left + width, py + top + height], oracle.records[index].expectedEndpoints)
  }
})

test('geometry preserves tribe availability without advertising an invented camera action', () => {
  const page = read('app/page.tsx')
  assert.match(page, /enemyTribes = missionComputerTribes\(world\.outcome\.level\)\.filter\(/)
  assert.match(page, /\{enemies\.map\(enemy => \(/)
  assert.match(page, /className=\{`tribe-flag \$\{enemy\.name\.toLowerCase\(\)\}`\}/)
  assert.match(page, /aria-label=\{`\$\{enemy\.name\} tribe`\}/)
  assert.doesNotMatch(page, /Focus \$\{enemy\.name\} tribe/)
})

// Passive indicators do not need the old button-only keyboard-focus override.
// Other actual controls keep their existing visible keyboard outline.
test('passive tribe indicators do not reserve a keyboard-focus outline', () => {
  const css = read('app/globals.css')
  const global = css.match(/button:focus-visible,[^{]+\{([^}]+)\}/)
  assert.ok(global, 'existing global keyboard outline')
  assert.match(global[1], /(?:^|;)outline:2px solid white(?:;|$)/)
  assert.doesNotMatch(css, /\.tribe-flag:focus-visible/)
})
