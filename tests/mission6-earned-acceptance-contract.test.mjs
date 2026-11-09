import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdirSync, readFileSync, rmdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import {
  plan,
  validatePlan,
  runAcceptance,
  validateStageSource,
} from '../scripts/check-mission6-earned-victory.mjs'

test('Mission 6 acceptance graph starts fresh and has no missing checkpoint producers', () => {
  validatePlan(plan)
  assert.equal(plan.stages.length, 19)
  assert.deepEqual(plan.stages[0].inputs, [])
  for (const stage of plan.stages) {
    const source = readFileSync(
      new URL(`../scripts/acceptance/m6/${stage.name}.mjs`, import.meta.url),
      'utf8'
    )
    const paths = kind =>
      [...source.matchAll(new RegExp(`${kind}\\(outputPath\\(['"]([^'"]+)['"]\\)`, 'g'))].map(
        match => match[1]
      )
    assert.deepEqual([...new Set(paths('readFileSync'))], stage.inputs, `${stage.name} inputs`)
    assert.deepEqual([...new Set(paths('writeFileSync'))], stage.outputs, `${stage.name} outputs`)
    assert.match(source, /tick\(/)
    if (stage.name !== 'fresh-release')
      assert.match(source, /assert\.deepEqual\((w, replay|replay, w)\)/)
  }
})

test('Mission 6 graph rejects an external save or an overwritten checkpoint', () => {
  const missing = structuredClone(plan)
  missing.stages[0].inputs.push('unearned.v8')
  assert.throws(() => validatePlan(missing), /Unproduced input/)
  const overwrite = structuredClone(plan)
  overwrite.stages[1].outputs.push(overwrite.stages[0].outputs[0])
  assert.throws(() => validatePlan(overwrite), /Overwritten stage output/)
})

test('Mission 6 runner rejects unsafe or existing outputs before executing simulation', () => {
  assert.throws(() => runAcceptance('../outside'), /Use a new/)
  const output = `work/orchestration/m6-earned-victory/contract-${randomUUID()}`
  mkdirSync(output, { recursive: true })
  try {
    assert.throws(() => runAcceptance(output), /EEXIST/)
  } finally {
    rmdirSync(output)
  }
})

test('winning persistence stage uses the owned replay and documents storage and UI limits', () => {
  const source = readFileSync(
    new URL('../scripts/acceptance/m6/recovery-persistence.mjs', import.meta.url),
    'utf8'
  )
  assert.match(source, /const replay = store\.getWorld\(\)/)
  assert.match(source, /tick\(replay, 1 \/ 12\)/)
  assert.match(source, /store\.update\(\)/)
  assert.match(source, /assert\.equal\(store\.getWorld\(\), replay\)/)
  assert.match(source, /await restored\.restoreCheckpoint\(\)/)
  assert.match(source, /Synthetic IndexedDB contract fixture, not browser persistence proof/)
  assert.match(source, /no rendered UI click claim/)
})

test('stage source binding rejects changed commits, shared inputs and producer checkpoints', () => {
  const shared = 'runner.mjs',
    checkpoint = 'earned.v8',
    a = 'a'.repeat(64),
    b = 'b'.repeat(64)
  const source = {
    headOid: 'source-head',
    trackedDiffSha256: a,
    inputs: { [shared]: a, [checkpoint]: b },
  }
  const expected = validateStageSource(null, source, [shared], { [checkpoint]: b })
  assert.deepEqual(validateStageSource(expected, source, [shared], { [checkpoint]: b }), expected)
  assert.throws(
    () => validateStageSource(expected, { ...source, headOid: 'other' }, [shared], {}),
    /Source changed/
  )
  assert.throws(
    () => validateStageSource(expected, { ...source, trackedDiffSha256: b }, [shared], {}),
    /Source changed/
  )
  assert.throws(
    () =>
      validateStageSource(
        expected,
        { ...source, inputs: { ...source.inputs, [shared]: b } },
        [shared],
        {}
      ),
    /Source changed/
  )
  assert.throws(
    () => validateStageSource(expected, source, [shared], { [checkpoint]: a }),
    /Checkpoint changed/
  )
  assert.throws(() => validateStageSource(null, source, ['missing'], {}), /Missing shared input/)
})
