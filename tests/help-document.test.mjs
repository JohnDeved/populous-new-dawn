import test from 'node:test'
import assert from 'node:assert/strict'
import { helpGlyph, helpLink, helpInlineImage, prepareHelpDocument } from '../app/help-document.ts'
import { layoutHelpText } from '../app/help-layout.ts'
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

test('all 88 original texts use supported markup and all 21 image slots retain original IDs', () => {
  for (const [topic, source] of Object.entries(art.topics)) {
    const document = prepareHelpDocument(Number(topic), 640, 480, 100)
    assert.equal(document.status, 'ready', `${topic}: ${document.reason}`)
    const slots = [...source.text.matchAll(/<i (\d+)>/g)].map(match => Number(match[1]))
    assert.deepEqual(document.article.rows.flatMap(row => row.nodes.flatMap(node => node.image ? [node.image.id] : [])), slots.map(slot => helpInlineImage(slot).id))
  }
  assert.equal(helpInlineImage(15).id, 1609)
  assert.equal(helpInlineImage(16).id, 1609, 'the duplicate source map is not corrected by guesswork')
  for (const slot of [-1, 21, 0.5, NaN]) assert.throws(() => helpInlineImage(slot), /Unimported/)
})

test('the shipped malformed a/ tag is consumed without closing or splitting its link', () => {
  assert.ok(art.topics['1029'].text.endsWith('Worship Object<a/>'))
  const retained = layoutHelpText('<a 58>A<a/>B', 100).rows[0].nodes.filter(node => node.text)
  assert.equal(retained.length, 1)
  assert.deepEqual(retained.map(node => [node.text, node.link, node.sourceCount]), [['AB', 58, 6]])
  const closed = layoutHelpText('<a 58>A</a>B', 100).rows[0].nodes.filter(node => node.text)
  assert.deepEqual(closed.map(node => [node.text, node.link]), [['A', 58], ['B', -1]])
  const wrapped = layoutHelpText('<a 58>A <a/>AA', 12)
  assert.deepEqual(wrapped.rows.map(row => row.text), ['A ', 'AA'])
  assert.deepEqual(wrapped.rows.flatMap(row => row.nodes.filter(node => node.text).map(node =>
    [node.sourceStart, node.sourceCount, node.link])), [[6, 2, 58], [8, 6, 58]],
    'native rollback retains the previous break and reconsumes the unknown tag on the next row')
  assert.throws(() => layoutHelpText('<unverified>A', 100), /Unsupported/)
})

test('inline layout preserves native run replacement and overflow bookkeeping', () => {
  const image = { id: 1, url: '/fixture.png', width: 80, height: 30 }
  const same = layoutHelpText('A<i 0>B', 100, 3, () => image)
  assert.equal(same.rows[0].nodes[0].image, image)
  assert.equal(same.rows[0].nodes[0].text, '', 'native image replaces the current run')
  assert.equal(same.rows[0].nodes[1].x, 80)
  assert.equal(same.rows[0].height, 30)
  const next = layoutHelpText('A<i 0>B', 80, 3, () => image)
  assert.equal(next.rows[0].text, 'A')
  assert.equal(next.rows[1].nodes[0].image, image)
  assert.equal(next.rows[1].nodes[1].x, 80, 'native overflow reset permits following text beyond measured width')
})

test('unsupported markup and impossible dimensions remain explicit blockers', () => {
  assert.throws(() => layoutHelpText('<i 0>', 192), /markup/)
  assert.equal(prepareHelpDocument(1051, 90, 60, 100).status, 'unsupported')
  assert.equal(prepareHelpDocument(1051, 640.5, 480, 100).status, 'unsupported')
})
