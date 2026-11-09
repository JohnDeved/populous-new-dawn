import test from 'node:test'
import assert from 'node:assert/strict'
import { createHelpSession } from '../app/help-session.ts'

function fixture(mode = 'blast', paused = false) {
  const world = { mode, paused, status: 'playing' }
  let current = true
  const session = createHelpSession(world, () => current)
  return { world, session, replace() { current = false } }
}

for (const mode of [null, 'blast', 'hut']) for (const paused of [false, true]) {
  test(`Query arms without pause and article cancels in two stages (${mode}, paused=${paused})`, () => {
    const { world, session } = fixture(mode, paused)
    assert.equal(session.armQuery(), true)
    assert.equal(session.phase, 'query')
    assert.equal(world.paused, paused)
    assert.equal(world.mode, null)
    assert.equal(session.armQuery(), false, 'a second HUD Query press must be routed as contextual help')
    session.openArticle(1051)
    assert.equal(session.phase, 'article')
    assert.equal(session.topic, 1051)
    assert.equal(world.paused, true)
    assert.equal(session.cancel(), true)
    assert.equal(session.phase, 'query')
    assert.equal(world.paused, paused)
    assert.equal(world.mode, null)
    assert.equal(session.cancel(), true)
    assert.equal(session.phase, 'inactive')
    assert.equal(world.mode, mode)
    assert.equal(session.cancel(), false)
  })
}

for (const paused of [false, true]) test(`direct article open/close restores mode and prior pause=${paused}`, () => {
  const { world, session } = fixture('blast', paused)
  session.openArticle()
  assert.equal(session.topic, 984)
  assert.equal(world.paused, true)
  session.openArticle(1024)
  session.openArticle(null)
  assert.equal(session.topic, 1024, 'no matching context retains current topic')
  session.closeArticle()
  assert.equal(session.phase, 'inactive')
  assert.equal(world.mode, 'blast')
  assert.equal(world.paused, paused, 'retargeting cannot overwrite the original browser pause owner')
})

for (const fromQuery of [false, true]) test(`same-world disposal releases article and mode ownership (Query=${fromQuery})`, () => {
  const { world, session } = fixture('hut')
  if (fromQuery) session.armQuery()
  session.openArticle(1051)
  session.dispose()
  assert.equal(session.phase, 'inactive')
  assert.deepEqual(world, { mode: 'hut', paused: false, status: 'playing' })
  world.paused = true
  session.dispose()
  assert.equal(world.paused, true)
  assert.equal(session.armQuery(), false)
  assert.equal(session.openArticle(), false)
})

for (const terminal of [false, true]) test(`stale Help never resumes a ${terminal ? 'terminal' : 'replaced'} world`, () => {
  const { world, session, replace } = fixture()
  session.armQuery(); session.openArticle(1023)
  if (terminal) world.status = 'lost'
  else replace()
  const before = { ...world }
  assert.equal(session.phase, 'inactive')
  assert.equal(session.cancel(), false)
  assert.equal(session.closeArticle(), false)
  assert.equal(session.openArticle(1051), false)
  session.dispose()
  assert.deepEqual(world, before)
})

test('invalid topics cannot partly open an article or mutate its world', () => {
  const { world, session } = fixture()
  for (const topic of [982, 1071, 1051.5, NaN, Infinity])
    assert.throws(() => session.openArticle(topic), /Unimported/)
  assert.equal(session.phase, 'inactive')
  assert.deepEqual(world, { mode: 'blast', paused: false, status: 'playing' })
})
