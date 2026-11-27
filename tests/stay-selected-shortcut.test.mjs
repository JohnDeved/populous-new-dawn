import assert from 'node:assert/strict'
import test from 'node:test'
import { isStaySelectedShortcut } from '../app/stay-selected-shortcut.ts'

const press = {
  key: 'L', shiftKey: true, altKey: false, ctrlKey: false, metaKey: false, repeat: false
}

test('Shift+L press toggles exactly once and does not rely on capitalization', () => {
  assert.equal(isStaySelectedShortcut(press), true)
  assert.equal(isStaySelectedShortcut({ ...press, key: 'l' }), true)
  assert.equal(isStaySelectedShortcut({ ...press, repeat: true }), false)
})

test('plain L remains with Followers; Ctrl, Alt, Meta and other keys are not claimed', () => {
  for (const extra of [
    { key: 'l', shiftKey: false },
    { shiftKey: false },
    { altKey: true },
    { ctrlKey: true },
    { metaKey: true },
    { key: 'z' },
  ]) assert.equal(isStaySelectedShortcut({ ...press, ...extra }), false)
})
