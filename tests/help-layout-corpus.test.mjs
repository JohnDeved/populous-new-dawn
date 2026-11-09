import test from 'node:test'
import assert from 'node:assert/strict'
import { layoutHelpText } from '../app/help-layout.ts'
import art from '../app/original-help.json' with { type: 'json' }
import articleArt from '../app/original-help-article.json' with { type: 'json' }

// Original published article data, not an original-runtime or browser oracle.
// Exercise the narrow-pane progress safeguard with the entire shipped corpus.
const inlineImage = index => {
  const id = articleArt.inline[index]
  const image = articleArt.icons[id]
  assert.ok(image, `Original inline image slot ${index} is missing`)
  return { id, ...image }
}

for (const width of [1, 2, 16, 48, 192, 320]) {
  test(`all original Help articles retain text and image order at ${width}px`, () => {
    assert.equal(Object.keys(art.topics).length, 88)
    for (const [topic, source] of Object.entries(art.topics)) {
      const layout = layoutHelpText(source.text, width, 3, inlineImage)
      const nodes = layout.rows.flatMap(row => row.nodes)
      assert.equal(layout.rows.map(row => row.text).join(''), source.text.replace(/<[^>]*>/g, ''), `${topic}: text lost or duplicated`)
      const slots = [...source.text.matchAll(/<i (\d+)>/g)].map(match => Number(match[1]))
      assert.deepEqual(nodes.filter(node => node.image).map(node => node.image.id), slots.map(slot => inlineImage(slot).id), `${topic}: image order changed`)
      let y = 0
      for (const row of layout.rows) {
        assert.equal(row.y, y, `${topic}: non-contiguous rows`)
        assert.ok(Number.isFinite(row.height) && row.height > 0, `${topic}: invalid row height`)
        y += row.height + 4
        for (const node of row.nodes) {
          assert.ok(Number.isInteger(node.sourceStart) && node.sourceStart >= 0)
          assert.ok(Number.isInteger(node.sourceCount) && node.sourceCount >= 0)
          assert.ok(node.sourceStart + node.sourceCount <= source.text.length)
        }
      }
      assert.equal(layout.height, y - 4)
    }
  })
}
