import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'
import ts from 'typescript'
import art from '../app/original-message-tabs.json' with { type: 'json' }

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const sha = data => createHash('sha256').update(data).digest('hex')
function png(data) {
  assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  let width, height, offset = 8
  const chunks = []
  while (offset < data.length) {
    const length = data.readUInt32BE(offset), name = data.toString('ascii', offset + 4, offset + 8), chunk = data.subarray(offset + 8, offset + 8 + length)
    if (name === 'IHDR') { width = chunk.readUInt32BE(0); height = chunk.readUInt32BE(4); assert.equal(chunk[9], 6) }
    if (name === 'IDAT') chunks.push(chunk)
    offset += length + 12
  }
  const rows = inflateSync(Buffer.concat(chunks)), pixels = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    assert.equal(rows[y * (width * 4 + 1)], 0)
    rows.copy(pixels, y * width * 4, y * (width * 4 + 1) + 1, (y + 1) * (width * 4 + 1))
  }
  return { width, height, pixels }
}
const frames = Object.fromEntries(Object.entries(art.sprites).map(([id, frame]) => [id, png(Buffer.from(frame.src.split(',')[1], 'base64'))]))

test('native descriptors distinguish normal, pointer-hover and activation without inventing icon variants', () => {
  assert.deepEqual(art.descriptors, {
    normal: [1005, 1009, 1006, 1011, 1013, 1012, 1007, 1010, 1008],
    hover: [996, 1000, 997, 1002, 1004, 1003, 998, 1001, 999],
    active: [1014, 1018, 1015, 1020, 1022, 1021, 1016, 1019, 1017],
  })
  assert.deepEqual(art.icons, { 1: { normal: 171, active: 171 }, 3: { normal: 174, active: 174 } })
  assert.equal(art.provenance.inputs['d3dpoptb.exe'], '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  assert.equal(art.provenance.inputs['data/hfx0-0.dat'], '681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf')
  assert.equal(art.provenance.inputs['data/pal0-c.dat'], '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53')
  assert.equal(Object.keys(frames).length, 29)
  for (const [id, frame] of Object.entries(frames)) {
    assert.deepEqual([frame.width, frame.height], id === '171' ? [25, 18] : id === '174' ? [15, 22] : [4, 4])
    assert.equal(sha(frame.pixels), art.sprites[id].rgbaSha256)
    assert.ok(frame.pixels.every((v, i) => i % 4 !== 3 || v === 0 || v === 255), 'No invented modulation/opacity')
  }
})

function component() {
  const code = ts.transpileModule(source('app/original-message-tab.tsx'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS },
  }).outputText
  const exports = {}, React = { createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }) }
  Function('exports', 'require', 'React', code)(exports, path => {
    if (path.endsWith('.json')) return { default: art }
    assert.ok(path.endsWith('.module.css'))
    return { default: { art: 'art', tile: 'tile' } }
  }, React)
  return exports.OriginalMessageTab
}

test('actual component is presentational, paints corners last and retains the exact normal/active icon data', () => {
  const render = component()
  for (const flags of [0x40, 0x42, 0xc1, 0xc3, 0x4, 0x200c1]) {
    const props = Object.freeze({ flags }), root = render(props), [tiles, icons] = root.children
    assert.equal(root.props['data-active'], !!(flags & 2))
    assert.equal(root.props['aria-hidden'], 'true')
    assert.deepEqual(tiles.map(tile => tile.props['data-position']), [4, 1, 7, 3, 5, 0, 2, 6, 8])
    for (const tile of tiles) for (const state of ['normal', 'hover', 'active']) {
      const id = art.descriptors[state][tile.props['data-position']]
      assert.equal(tile.props.style[`--tile-${state}`], `url('${art.sprites[id].src}')`)
    }
    const pair = art.icons[flags & 1 ? 3 : 1]
    for (const icon of icons) {
      const frame = art.sprites[pair[icon.props['data-icon']]]
      assert.equal(icon.props.src, frame.src)
      assert.deepEqual(icon.props.style, { '--icon-width': `${frame.width}px`, '--icon-height': `${frame.height}px` })
    }
    assert.doesNotMatch(source('app/original-message-tab.tsx'), /onClick|onKey|useEffect|flags\s*[|&]=/)
  }
})

test('shipped summary retains placement, hit target and callbacks while only its art is replaced', () => {
  const page = source('app/page.tsx'), css = source('app/globals.css'), style = source('app/original-message-tab.module.css')
  assert.match(page, /<OriginalMessageTab flags=\{message!\.flags\} \/>/)
  assert.match(page, /height = messageScreenY\(message!\.height, messageViewportHeight\)/)
  assert.match(page, /showCampaignPopup\(details, messageDetails\.current\.values\(\)\)/)
  assert.match(page, /aria-label="Read campaign message"/)
  const summary = css.match(/\.campaign-messages summary\{([^}]+)\}/)[1]
  assert.match(summary, /width:var\(--message-width,32px\);height:var\(--message-height\)/)
  assert.match(summary, /padding:0;border:0;background:none/)
  assert.doesNotMatch(summary, /ridge|#d3ad47|grid/)
  assert.match(style, /:global\(summary\):is\(:hover, :focus-visible\) \.tile \{ background-image: var\(--tile-hover\); \}/)
  assert.match(style, /:global\(summary\):active \.tile, \.art\[data-active='true'\] \.tile \{ background-image: var\(--tile-active\); \}/)
  assert.doesNotMatch(style, /\[open\]|scale\(/)
  assert.match(style, /round\(to-zero, calc\(\(100% - var\(--icon-width\)\) \/ 2\), 1px\)/)
  assert.match(style, /\.tile\[data-position='4'\] \{ inset: 4px; width: auto; height: auto; \}/)
  assert.match(style, /\.tile\[data-position='8'\] \{ right: 0; bottom: 0; \}/)
  assert.match(source('scripts/campaign-popup-fixture/fixture/main.tsx'), /<OriginalMessageTab flags=\{message\.flags\} \/>/)
  for (const path of ['app/original-message-tab.tsx', 'app/original-message-tab.module.css', 'app/original-message-tabs.json'])
    assert.ok(source('scripts/campaign-popup-fixture/run.mjs').includes(`'${path}'`), `Browser evidence fingerprints ${path}`)
})
