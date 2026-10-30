import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { assertFullscreenClearance } from '../scripts/local-render/fullscreen-clearance.mjs'
import { restorePausePreferenceWrite } from '../scripts/local-render/original-pause-checkpoint-style.mjs'

const fixture = () => ({ viewport:{width:320,height:240}, owner:true, count:1, hit:true,
  button:{x:12,y:12,width:17,height:14}, focus:{x:9,y:9,right:32,bottom:29},
  occupied:[{label:'scrolled footer and diagnostics column',x:44,y:-200,right:285,bottom:600}] })

test('rendered clearance accepts the reserved gutter across the entire scroll range', () => {
  assert.doesNotThrow(() => assertFullscreenClearance(fixture()))
})
test('rendered clearance rejects overlap, including focus ring alone', () => {
  for (const x of [12,30]) {
    const sample = fixture(); sample.occupied[0].x=x
    assert.throws(() => assertFullscreenClearance(sample), /must clear/)
  }
})
test('rendered clearance rejects clipping, interception, duplicate portals and wrong ownership', () => {
  for (const change of [s=>s.focus.x=-1,s=>s.hit=false,s=>s.count=2,s=>s.owner=false,s=>s.button.width=90]) {
    const sample = fixture(); change(sample)
    assert.throws(() => assertFullscreenClearance(sample))
  }
})

test('rendered clearance rejects missing or malformed occupied geometry', () => {
  for (const change of [s=>s.occupied=[],s=>s.occupied=null,s=>s.occupied[0].x=NaN,
    s=>s.occupied[0].bottom=Infinity,s=>s.occupied[0].right=44,s=>s.occupied[0].bottom=-201,
    s=>s.focus.right=NaN,s=>s.focus.bottom=9]) {
    const sample = fixture(); change(sample)
    assert.throws(() => assertFullscreenClearance(sample), /geometry/)
  }
})


test('pause preference cleanup preserves the original assertion and records its own failure', async () => {
  const primary = new Error('Fullscreen must clear Graphics row')
  const cleanup = new Error('Page was closed')
  await assert.doesNotReject(restorePausePreferenceWrite({ evaluate: async () => { throw cleanup } }, primary))
  assert.equal(primary.message, 'Fullscreen must clear Graphics row')
  assert.equal(primary.preferenceRestoreError, String(cleanup))
  await assert.rejects(restorePausePreferenceWrite({ evaluate: async () => { throw cleanup } }), error => error === cleanup)
  await assert.doesNotReject(restorePausePreferenceWrite({ evaluate: async () => {} }))
})

test('noninteractive Options labels and rows have the same strict collision contract', () => {
  for (const label of ['Screen Resolution : <Unavailable>', 'Master volume', 'Sound quality unavailable']) {
    const sample = fixture()
    sample.occupied.push({label,x:20,y:12,right:300,bottom:40})
    assert.throws(() => assertFullscreenClearance(sample), /must clear/)
  }
})


test('preference restore preserves explicit nonstandard primaries even when diagnostics cannot be attached', async () => {
  const unprintable = { toString() { throw Error('diagnostic coercion failed') } }
  const hostile = Object.defineProperty({}, 'preferenceRestoreError', { set() { throw Error('annotation rejected') } })
  for (const primary of [undefined, null, false, 0, -0, NaN, '', 'primary', 0n, Symbol('primary'),
    Object.freeze(Error('frozen')), Object.preventExtensions(Error('nonextensible')), hostile]) {
    for (const cleanup of [Error('restore failed'), unprintable])
      await assert.doesNotReject(restorePausePreferenceWrite({ evaluate: async () => { throw cleanup } }, primary))
  }
  await assert.rejects(restorePausePreferenceWrite({ evaluate: async () => { throw unprintable } }),
    error => error === unprintable, 'omitting the primary still rejects the actual cleanup value')
})

test('actual Options finally distinguishes no primary from every caught value and restores once', async () => {
  const source = readFileSync(new URL('../scripts/local-render/original-pause-checkpoint-style.mjs', import.meta.url), 'utf8')
  const start = source.indexOf('      let optionsError')
  const end = source.indexOf("      await phase('input', () => button('Back').click(), 'back-from-options')", start)
  assert.ok(start >= 0 && end > start)
  const body = source.slice(start, end)
  assert.match(body, /finally \{ await phase\(\x27cleanup\x27, \(\) => restorePausePreferenceWrite/)
  const primaries = [undefined, null, false, 0, -0, NaN, '', 'primary', 0n, Symbol('primary'),
    Object.freeze(Error('frozen')), Object.preventExtensions(Error('nonextensible'))]
  for (const actionFails of [false, true]) for (const restoreFails of [false, true])
    for (const primary of actionFails ? primaries : [undefined]) {
      const cleanup = Error('restore failed'); let actions = 0, restores = 0
      const page = {
        locator: () => ({ click: async () => { actions++; if (actionFails) throw primary } }),
        setViewportSize: async () => {},
        evaluate: async () => { restores++; if (restoreFails) throw cleanup },
      }
      const run = vm.runInNewContext(`(async () => { ${body} })`, {
        page, modal: { getByRole: () => ({ filter: () => ({ waitFor: async () => {} }) }) },
        button: () => ({ click: async () => {} }), fullscreenClearance: async () => {},
        fallback: false, screenshots: [], restorePausePreferenceWrite,
        phase: (_stage, operation) => operation(), labelCase: () => {}, diagnostics: { fail: () => {} },
      })
      const outcome = await run().then(() => ({ failed: false }), error => ({ failed: true, error }))
      assert.equal(actions, 1); assert.equal(restores, 1)
      assert.equal(outcome.failed, actionFails || restoreFails)
      if (outcome.failed) assert.ok(Object.is(outcome.error, actionFails ? primary : cleanup),
        'the real finally never replaces a caught value or swallows cleanup-only failure')
    }
})
