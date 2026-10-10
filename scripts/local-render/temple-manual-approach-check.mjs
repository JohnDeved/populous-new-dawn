// Supporting Node caller check, not browser evidence. Reuse the unchanged
// composed fixture without changing the saved profile's application inputs.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import ts from 'typescript'
import { createTempleManualSteps } from './temple-manual-inspection.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { assertTempleTrainInput } from './temple-training-contract.mjs'
import { findEntityInput, inspectEntityPoint } from '../../qa/erosion-ordinary/input.mjs'

const fixtureUrl = new URL('../../tests/temple-manual-episode.test.mjs', import.meta.url)
const fixtureSource = readFileSync(fixtureUrl, 'utf8').split("test('actual Temple dwell")[0]
const fixtureModule = fixtureSource
  .replaceAll('import.meta.url', JSON.stringify(fixtureUrl.href))
  .replace(/(from\s*|import\()(['"])([^'"]+)\2/g, (all, start, quote, path) => {
    const url = path.startsWith('.') ? new URL(path, fixtureUrl).href : import.meta.resolve(path)
    return `${start}${quote}${url}${quote}`
  })
const { fixture, pageEscape } = await import(
  `data:text/javascript;base64,${Buffer.from(fixtureModule + '\nexport { fixture, pageEscape }').toString('base64')}`
)
const nop = () => {}

// Invoke the actual training host's local dispatch closure, with its unchanged
// maintained input/recipient proof and finally cleanup, rather than copying it.
function trainingDispatch(bindings) {
  const source = ts.createSourceFile(
    'temple-training-auto.mjs',
    readFileSync(new URL('./temple-training-auto.mjs', import.meta.url), 'utf8'),
    ts.ScriptTarget.Latest,
    true
  )
  let callback
  const visit = node => {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'dispatch')
      callback = node.initializer
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert(callback, 'Actual training dispatch closure required')
  return Function(
    ...Object.keys(bindings),
    `return (${callback.getText(source)})`
  )(...Object.values(bindings))
}

for (const failDispatch of [false, true])
  test(`approach host attaches before actual dispatch and ${failDispatch ? 'preserves dispatch failure with cleanup' : 'inspects through intervening turns without relocating'}`, async t => {
    const f = await fixture(t, 'approach'),
      { scene, world, temple, epoch } = f
    f.manual.take()
    const originalInspect = scene.objectPanels.inspectBuilding,
      output = mkdtempSync(resolve(tmpdir(), 'temple-approach-caller-')),
      report = { actions: [] },
      failure = Error('supplied dispatch transport failure')
    t.after(() => rmSync(output, { recursive: true, force: true }))
    window.templeTraining = epoch
    scene.acknowledgePointer = Object.getPrototypeOf(scene).acknowledgePointer
    scene.pointerAck = { target: 0, until: 0 }
    const candidates = []
    for (let y = -32; y <= 32; y += 2)
      for (let x = -32; x <= 32; x += 2)
        candidates.push({ x: f.point.clientX + x, y: f.point.clientY + y })
    const interior = findEntityInput(candidates, temple.id, point =>
      inspectEntityPoint(scene, 'buildings', point)
    )
    assert(interior, 'Controlled projected Temple must contain an actual interior')
    Object.assign(f.point, { clientX: interior.x, clientY: interior.y })
    scene.chooseFollowers(2, { ctrlKey: false, shiftKey: false })
    const traineeId = world.selected[0],
      shamanId = world.units.find(u => u.kind === 'shaman' && u.team === 'blue').id,
      hit = {
        x: f.point.clientX,
        y: f.point.clientY,
        id: temple.id,
        collection: 'buildings',
        rejection: null,
      }
    let dispatched = false,
      escaped = false,
      rightCount = 0
    const page = {
      async evaluate(fn, arg) {
        // Real frame/turn visits continue across host round trips.
        f.frame(1 / 12)
        return Function(
          'imports',
          `return (${fn.toString().replaceAll('import(', 'imports(')})`
        )(path => import(new URL('../..' + path, import.meta.url)))(arg)
      },
      async waitForFunction(fn) {
        for (let i = 0; i < 100 && !fn(); i++) f.frame(1 / 12)
        assert(fn())
      },
      async waitForTimeout() {
        f.frame(1 / 12)
      },
      mouse: {
        async click(x, y) {
          assert(window.templeManual, 'Passive observer must precede command input')
          assert.notEqual(scene.objectPanels.inspectBuilding, originalInspect)
          assert.deepEqual([x, y], [hit.x, hit.y])
          if (failDispatch) throw failure
          f.fire('pointerdown', { button: 0, buttons: 1 })
          f.fire('pointerup', { button: 0, buttons: 0 })
          dispatched = true
          f.frame(1 / 12)
        },
        async move() {
          assert.fail('Approach must retain the actual training pointer')
        },
        async down({ button }) {
          assert(dispatched && escaped)
          assert.equal(button, 'right')
          assert.deepEqual(world.selected, [])
          f.fire('pointerdown')
          f.frame(1 / 12)
          rightCount++
        },
        async up({ button }) {
          assert.equal(button, 'right')
          f.fire('pointerup')
          f.frame(1 / 12)
          rightCount++
        },
      },
      keyboard: {
        async press(key) {
          assert(dispatched)
          assert.equal(key, 'Escape')
          pageEscape(f)({ key, code: key, target: { closest: () => null }, preventDefault: nop })
          escaped = true
          f.frame(1 / 12)
        },
      },
    }
    const signal = new AbortController().signal,
      deadlineAt = Date.now() + 30000,
      input = createMission1VaultInput({
        page,
        signal,
        report,
        save: nop,
        originalShamanId: shamanId,
        deadlineAt,
      })
    await input.prepareDispatch()
    report.hit = hit
    const dispatch = trainingDispatch({
        page,
        input,
        report,
        save: nop,
        traineeId,
        targetId: temple.id,
        assertTempleTrainInput,
      }),
      steps = createTempleManualSteps({ output }),
      result = steps.approach({
        page,
        signal,
        report,
        save: nop,
        targetId: temple.id,
        shamanId,
        traineeId,
        hit,
        dispatch,
        deadlineAt,
      })
    if (failDispatch) {
      await assert.rejects(result, error => error === failure)
      assert.equal(report.manual.approach.status, 'failed')
      assert.equal(report.manual.approach.observation.closed, true)
      assert.equal(report.manual.approach.observation.creation, null)
      assert.equal(rightCount, 0)
    } else {
      const evidence = await result
      assert.equal(report.manual.approach.status, 'passed')
      assert(evidence.initial.turn < report.dispatch.after.turn)
      assert(evidence.creation.before.turn > report.dispatch.after.turn)
      assert.equal(evidence.creation.result, 'explicit:created')
      assert.equal(evidence.request.result, 'automatic:reused')
      assert.equal(rightCount, 2)
    }
    assert.equal(scene.objectPanels.inspectBuilding, originalInspect)
    assert.equal(window.templeManual, undefined)
    assert.equal(window.mission1VaultDispatch, undefined)
    assert.deepEqual(report.manual.approach.cleanupErrors, [])
  })
