import test from 'node:test'
import assert from 'node:assert/strict'
import { assertNativeHelpLayout } from '../scripts/tutorial-browser/selector-inspection.mjs'

const layout = () => ({ focused: true, scrollTop: 0, scrollHeight: 482, clientHeight: 480,
  documentOverflow: false, fields: ['Browser compatibility and help', 'Select Level', '1× game speed',
    'Performance', 'HUD size : <Automatic>', '♫ Enable sound', 'Back to Options'].map(label =>
    ({ label, fits: true, glyphsFit: true, actionable: true })) })

test('native help accepts all visible and reachable fields without inventing long-document overflow', () => {
  for (const scrollHeight of [480, 482]) assertNativeHelpLayout({ ...layout(), scrollHeight })
})

test('native help still rejects missing mandatory content, clipped text and unreachable Back', () => {
  for (const index of [0, 1, 2, 3, 4, 5, 6]) {
    const missing = layout(); missing.fields.splice(index, 1)
    assert.throws(() => assertNativeHelpLayout(missing), /Required native help/)
  }
  for (const field of ['fits', 'glyphsFit', 'actionable']) {
    const clipped = layout(); clipped.fields.at(-1)[field] = false
    assert.throws(() => assertNativeHelpLayout(clipped), /Back to Options/)
  }
  assert.throws(() => assertNativeHelpLayout({ ...layout(), documentOverflow: true }), /overflow/)
  assert.throws(() => assertNativeHelpLayout({ ...layout(), scrollTop: 20 }), /start at the top/)
  assert.throws(() => assertNativeHelpLayout({ ...layout(), focused: false }))
})
