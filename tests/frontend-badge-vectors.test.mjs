import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import provenance from '../references/frontend-badge-vectors.json' with { type: 'json' }

const tags = new Set(['svg', 'g', 'defs', 'clipPath', 'path'])
const attrs = new Set(['xmlns', 'width', 'height', 'viewBox', 'version', 'id', 'transform', 'd',
  'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'clip-path', 'clipPathUnits'])
test('sanitized reviewed SVGs retain paths and contain no active or externally fetched content', () => {
  for (const item of provenance.assets) {
    const bytes = readFileSync(new URL(`../${item.output}`, import.meta.url))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sanitizedSha256)
    const xml = bytes.toString()
    assert.equal((xml.match(/<path\b/g) ?? []).length, item.pathCount)
    assert.match(xml, /viewBox="0 0 /)
    assert.doesNotMatch(xml, /<!DOCTYPE|<!ENTITY|<script|<image|<foreignObject|<style|<text|\bhref=|\bon\w+=/i)
    for (const [, name, attributes] of xml.matchAll(/<(?![/?])([\w-]+)\b([^>]*?)\/?\s*>/g)) {
      assert.ok(tags.has(name), name)
      for (const [, attribute, value] of attributes.matchAll(/([\w:-]+)="([^"]*)"/g)) {
        assert.ok(attrs.has(attribute), attribute)
        if (value.includes('url(')) assert.match(value, /^url\(#[\w-]+\)$/)
      }
    }
  }
})

test('vector display remains display-resolution, aspect-preserving and separately sourced', () => {
  const css = readFileSync(new URL('../app/original-main-menu.module.css', import.meta.url), 'utf8')
  assert.match(css, /\.badgeVector\s*\{[^}]*object-fit: contain;[^}]*image-rendering: auto;/)
  const source = readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8')
  assert.match(source, /container\.appendChild\(image\)/)
  assert.match(source, /onError=\{failVector\}/)
  assert.match(source, /!vectorFailures\[index\]/)
  assert.match(provenance.assets.find(item => item.name === 'bullfrog').provenance, /not official vector master/)
  assert.match(provenance.assets.find(item => item.name === 'bullfrog').provenance, /non-free/)
})

test('decoded SVG DOM object is reused across warm mount/cleanup without new src/decode calls', async () => {
  const { default: ts } = await import('typescript')
  const source = readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8')
  const parsed = ts.createSourceFile('menu.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let effect, fail
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(parsed) === 'useLayoutEffect' &&
      node.arguments[0].getText(parsed).includes('appendChild(image)')) effect = node.arguments[0]
    if (ts.isVariableDeclaration(node) && node.name.getText(parsed) === 'failVector') fail = node.initializer.arguments[0]
    ts.forEachChild(node, visit)
  }
  visit(parsed); assert.ok(effect); assert.ok(fail)
  const compile = (node, args) => new Function(...Object.keys(args), ts.transpileModule(
    `return ${node.getText(parsed)}`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText)(...Object.values(args))
  const listeners = new Set(), failures = []
  const image = { style: {}, parentNode: null, setAttribute() {},
    addEventListener: (name, fn) => { assert.equal(name, 'error'); listeners.add(fn) },
    removeEventListener: (name, fn) => listeners.delete(fn),
    set src(_) { assert.fail('warm mount must not assign src or refetch') },
    decode() { assert.fail('warm mount must not decode') },
  }
  const container = { appendChild: node => { assert.equal(node, image); node.parentNode = container },
    removeChild: node => { assert.equal(node.parentNode, container); node.parentNode = null } }
  const setup = compile(effect, { host: { current: container }, image, index: 0, onError: index => failures.push(index) })
  for (let cycle = 0; cycle < 3; cycle++) {
    const cleanup = setup(); assert.equal(image.parentNode, container); assert.equal(listeners.size, 1)
    if (cycle === 2) for (const listener of listeners) listener()
    cleanup(); assert.equal(image.parentNode, null); assert.equal(listeners.size, 0)
  }
  assert.deepEqual(failures, [0])
  const failedBadgeVectors = new WeakSet(), state = []
  compile(fail, { prepared: { badgeVectors: [image, null] }, failedBadgeVectors,
    setVectorFailures: update => state.push(update([false, false])) })(0)
  assert.equal(failedBadgeVectors.has(image), true, 'error persists for this prepared image session across menu remounts')
  assert.deepEqual(state, [[true, false]])
  assert.match(source, /failedBadgeVectors\.has\(image\)/, 'new menu initializes from retained image failure')
})
