import assert from 'node:assert/strict'

// Keyboard events come from Playwright, not dispatchEvent. Presentation time is
// advanced explicitly by the existing scenario's frame helper, not a real clock.
export async function verifyHeldEnter({ page, state, frame, capture }) {
  const before = await state()
  assert.equal(before.stage, null)
  assert.equal(before.overview, false)
  await page.evaluate(() => {
    if (Object.hasOwn(window, '__globeHeldEnterWitness'))
      throw new Error('Held-Enter observation already installed')
    const events = []
    const listener = event => {
      if (event.key === 'Enter') events.push({
        key: event.key, code: event.code, repeat: event.repeat,
        trusted: event.isTrusted,
        ownedByControl: Boolean(event.target?.closest('button,input,dialog')),
      })
    }
    window.__globeHeldEnterWitness = { events, listener }
    window.addEventListener('keydown', listener, true)
  })
  const entered = async () => {
    const current = await state()
    assert.equal(current.stage, null, 'completed overview must not start returning')
    assert.equal(current.overview, true)
    assert.equal(current.morph.active, false)
    assert.equal(current.morph.value, 0)
    assert.equal(current.remaining, 0)
    assert.equal(current.ground, false)
    return current
  }
  const returned = async () => {
    const current = await state()
    assert.equal(current.stage, null, 'completed return must not start entering')
    assert.equal(current.overview, false)
    assert.equal(current.morph.active, false)
    assert.equal(current.remaining, 0)
    assert.equal(current.preset, before.preset)
    assert.equal(current.bearing, before.bearing)
    assert.deepEqual(current.center, before.center)
    assert.equal(current.ground, true)
    return current
  }
  try {
    await page.keyboard.down('Enter')
    assert.equal((await state()).stage, 'enter')
    await page.keyboard.down('Enter')
    assert.equal((await state()).stage, 'enter')
    await frame(24)
    await entered()
    // A second down without an up is an actual browser repeat event. Playwright
    // does not generate a stream of OS autorepeats merely because a key is held.
    await page.keyboard.down('Enter')
    await entered()
    await frame(25)
    await entered()
    await capture('overview')
    await page.keyboard.up('Enter')

    await page.keyboard.down('Enter')
    assert.equal((await state()).stage, 'exit')
    await page.keyboard.down('Enter')
    assert.equal((await state()).stage, 'exit')
    await frame(25)
    await returned()
    await page.keyboard.down('Enter')
    await returned()
    await frame(24)
    await returned()
    await capture('ground')
    await page.keyboard.up('Enter')

    // Releasing the key must restore both ordinary toggle directions.
    await page.keyboard.press('Enter')
    await frame(24)
    await entered()
    await page.keyboard.press('Enter')
    await frame(25)
    await returned()
    const events = await page.evaluate(() => window.__globeHeldEnterWitness.events)
    assert.deepEqual(events, [false, true, true, false, true, true, false, false].map(repeat => ({
      key: 'Enter', code: 'Enter', repeat, trusted: true, ownedByControl: false,
    })), 'real gameplay keydown ownership, trust and repeat sequence')
    return { events, presentationFrames: [24, 25, 25, 24, 24, 25] }
  } finally {
    try {
      await page.keyboard.up('Enter')
    } finally {
      await page.evaluate(() => {
        const observation = window.__globeHeldEnterWitness
        window.removeEventListener('keydown', observation.listener, true)
        delete window.__globeHeldEnterWitness
      })
    }
  }
}
