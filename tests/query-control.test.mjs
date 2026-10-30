import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import ts from 'typescript'
import { pageButton, pageSource, evaluatePage } from './support/follower-nearby-page.mjs'
import art from '../decomp/research/native-help/query-control.json' with { type: 'json' }

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const require = createRequire(import.meta.url)
const compiled = ts.transpileModule(read('app/query-control.tsx'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
} }).outputText
const tree = node => !node || typeof node !== 'object' ? [] :
  [node, ...[node.props?.children].flat(Infinity).flatMap(tree)]
function fixture() {
  let failed = false
  const module = { exports: {} }
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name === 'react') return { useState: () => [failed, value => { failed = value }] }
    if (name.endsWith('.module.css')) return new Proxy({}, { get: (_, key) => key === '__esModule' ? false : key })
    return require(name)
  }, module, module.exports)
  return () => module.exports.QueryControlArt()
}

test('actual Menu button keeps accessible recovery and action while replacing only its invented artwork', () => {
  let opens = 0
  const rendered = evaluatePage(pageButton(['help-button']).getText(pageSource), {
    openMenu() { opens++ }, QueryControlArt: 'NativeQueryArt',
  })
  assert.equal(rendered.props['aria-label'], 'Menu')
  assert.equal(rendered.props['aria-description'], 'Help and game menu')
  assert.equal(rendered.children[0].type, 'NativeQueryArt')
  rendered.props.onClick()
  assert.equal(opens, 1)
  assert.match(read('app/globals.css'), /\.help-button\{position:absolute;left:63px;top:1px;width:13px;height:12px;border:0;/)
})

test('actual native art uses three original row-major frames and integer-centered HFX105', () => {
  const render = fixture(), nodes = tree(render())
  const states = nodes.filter(node => node.type === 'span' && node.props.className?.startsWith('frame '))
  assert.equal(states.length, 3)
  for (const [index, expected] of [
    [1005, 1009, 1006, 1011, 1013, 1012, 1007, 1010, 1008],
    [996, 1000, 997, 1002, 1004, 1003, 998, 1001, 999],
    [1014, 1018, 1015, 1020, 1022, 1021, 1016, 1019, 1017],
  ].entries()) {
    const tiles = tree(states[index]).filter(node => node.type === 'i')
    assert.deepEqual(tiles.map(node => Number(node.props.style.backgroundImage.match(/hfx-(\d+)/)[1])), expected)
    assert.deepEqual(tiles.map(node => { const { left, top, width, height } = node.props.style; return [left, top, width, height] }), [
      [0, 0, 4, 4], [4, 0, 5, 4], [9, 0, 4, 4],
      [0, 4, 4, 4], [4, 4, 5, 4], [9, 4, 4, 4],
      [0, 8, 4, 4], [4, 8, 5, 4], [9, 8, 4, 4],
    ])
  }
  const icon = nodes.find(node => node.type === 'img' && node.props.className === 'icon')
  assert.equal(icon.props.src, '/original/query-control/hfx-105.png')
  assert.equal(icon.props.width, 4)
  assert.equal(icon.props.height, 6)
  assert.match(read('app/query-control.module.css'), /\.icon\{position:absolute;left:4px;top:3px;/)
  assert.match(read('app/query-control.module.css'), /:focus-visible \.hover/ )
  assert.ok(nodes.filter(node => node.type === 'img').every(node => typeof node.props.onError === 'function'), 'every frame/icon failure has a recovery path')
})

test('asset failure is explicit recovery, never fake native success or removed Menu access', () => {
  const render = fixture()
  tree(render()).find(node => node.type === 'img').props.onError()
  const fallback = render()
  assert.equal(fallback.props['data-query-art'], 'failed')
  assert.equal(tree(fallback).find(node => node.props.className === 'fallback').props.children, '?')
  const css = read('app/query-control.module.css')
  assert.match(css, /:has\(\[data-query-art="source-bound"\]\):focus-visible\{outline:0\}/)
  assert.doesNotMatch(css, /:global\(\.help-button\):focus-visible\{outline:0\}/, 'failed artwork retains the browser recovery focus indicator')
})

test('all28 original Query glyph/frame assets retain declared bytes and source boundaries', () => {
  assert.equal(Object.keys(art.icons).length, 28)
  for (const asset of Object.values(art.icons)) {
    const bytes = readFileSync(new URL('../public' + asset.url, import.meta.url))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256)
    assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [asset.width, asset.height])
  }
  assert.equal(art.originalExecuted, false)
  assert.equal(art.sourceDescriptor.helpTopic, 1051)
  assert.deepEqual(art.referenceRect, [64, 114, 13, 12])
})
