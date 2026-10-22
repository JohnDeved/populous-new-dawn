import test from 'node:test'
import assert from 'node:assert/strict'
import { helpGlyph, helpLink, prepareHelpDocument } from '../app/help-document.ts'
import art from '../app/original-help.json' with { type: 'json' }

const discovery = { spellBits: 0, buildingBits: 0, stock: [], levelFlags: 0, spellDefinitionByte: [] }

test('Query document uses three original panes, literal text, no illustration and native glyph rows', () => {
  const document = prepareHelpDocument(1051, 640, 480, 100)
  assert.equal(document.status, 'ready')
  assert.deepEqual(document.panels.inner.article, { x: 394, y: 54, width: 192, height: 368 })
  assert.equal(document.source.text, art.topics['1051'].text)
  assert.equal(document.source.illustration.kind, 255)
  assert.equal(document.article.height, 174)
  assert.equal(document.article.rows[0].height, 20)
  assert.equal(document.article.rows[2].y, 38)
  assert.equal(document.contents.rows.flatMap(r => r.nodes).filter(n => n.link >= 0).length > 0, true)
})

test('link discovery preserves unavailable targets and original font pixels', () => {
  assert.deepEqual(helpLink(1051 - 983, discovery), { available: true, target: 1051 })
  assert.deepEqual(helpLink(997 - 983, discovery), { available: false, target: 1057 })
  assert.deepEqual(helpLink(997 - 983, { ...discovery, buildingBits: 1 << 4 }), { available: true, target: 997 })
  assert.equal(helpGlyph('A', 3).url, '/original/result-font.png')
  assert.equal(helpGlyph('A', 4).url, '/original/hud.png')
  assert.equal(helpGlyph('A', 10).url, '/original/help/font-10.png')
  assert.equal(helpGlyph('A', 11).url, '/original/help/font-11.png')
  for (const font of [4, 10, 11]) assert.equal(helpGlyph('A', font).w, 6)
})

test('unimplemented inline art is an explicit document blocker, never silently omitted', () => {
  const [topic] = Object.entries(art.topics).find(([, value]) => /<i/.test(value.text))
  const document = prepareHelpDocument(Number(topic), 640, 480, 100)
  assert.equal(document.status, 'unsupported')
  assert.match(document.reason, /markup/)
  assert.equal(prepareHelpDocument(1051, 90, 60, 100).status, 'unsupported')
  assert.equal(prepareHelpDocument(1051, 640.5, 480, 100).status, 'unsupported')
})
