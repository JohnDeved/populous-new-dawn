import test from 'node:test'
import assert from 'node:assert/strict'
import { createHelpHistory } from '../app/help-history.ts'
import { createHelpSession } from '../app/help-session.ts'

test('home, duplicate visits and branches retain native history semantics', () => {
  const history = createHelpHistory()
  assert.equal(history.topic, 984)
  assert.equal(history.back(), null)
  history.visit(1051)
  history.visit(1051)
  assert.equal(history.back(), 1051)
  assert.equal(history.back(), 984)
  assert.equal(history.back(), null)
  assert.equal(history.forward(), 1051)
  history.visit(1057)
  assert.equal(history.forward(), null)
  assert.equal(history.back(), 1051)
  assert.equal(history.forward(), 1057)
})

test('capacity uses an explicit memory-safe browser bound, not a native out-of-bounds write', () => {
  const history = createHelpHistory()
  for (let i = 0; i < 100; i++) history.visit(983 + i % 88)
  let count = 0
  while (history.back() !== null) count++
  assert.equal(count, 63)
  count = 0
  while (history.forward() !== null) count++
  assert.equal(count, 63)
  assert.equal(history.topic, 994)
})

test('invalid visits preserve current and forward history', () => {
  const history = createHelpHistory()
  history.visit(1051)
  history.back()
  for (const value of [982, 1071, NaN, 1051.5]) assert.throws(() => history.visit(value), /Unimported/)
  assert.equal(history.topic, 984)
  assert.equal(history.forward(), 1051)
})

test('article navigation and scroll remain scene-owned and transient', () => {
  const world = { mode: 'blast', paused: false, status: 'playing' }
  let current = true
  const session = createHelpSession(world, () => current)
  assert.equal(session.navigate('home'), false)
  assert.equal(session.scroll(20), false)
  session.armQuery()
  session.openArticle(1051)
  session.scroll(30)
  session.navigate(1024)
  assert.equal(session.scrollPosition, 0)
  session.scroll(50)
  session.navigate('back')
  assert.equal(session.topic, 1051)
  assert.equal(session.scrollPosition, 0)
  session.navigate('forward')
  session.navigate('home')
  assert.equal(session.topic, 984)
  session.closeArticle()
  assert.equal(session.phase, 'query')
  session.openArticle(null)
  session.navigate('back')
  assert.equal(session.topic, 1024, 'close/reopen keeps this scene’s article history')
  current = false
  assert.equal(session.navigate(1057), false)
  assert.equal(session.scroll(99), false)
  assert.equal(session.topic, 1024)
  assert.deepEqual(Object.keys(world).sort(), ['mode', 'paused', 'status'])
})
