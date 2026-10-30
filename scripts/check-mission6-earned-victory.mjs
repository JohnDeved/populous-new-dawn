#!/usr/bin/env node
import assert from 'node:assert/strict'
import { dependencyInputPaths } from './orchestration/dependency-profile.mjs'
import { createHash, randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { runCommandReceipt, ROOT } from './orchestration/command-receipt.mjs'
import plan from './acceptance/m6/plan.json' with { type: 'json' }

export { plan }
const sha256 = value => createHash('sha256').update(value).digest('hex')

export function validatePlan(candidate) {
  assert.equal(candidate.version, 1)
  assert.equal(candidate.mission, 6)
  assert.equal(candidate.expectedWinTurn, 29504)
  assert.equal(candidate.stages[0]?.name, 'fresh-release')
  assert.equal(candidate.stages.at(-1)?.name, 'recovery-persistence')
  const names = new Set(),
    outputs = new Set()
  for (const stage of candidate.stages) {
    assert(/^[a-z0-9-]+$/.test(stage.name))
    assert(!names.has(stage.name), `Duplicate stage ${stage.name}`)
    names.add(stage.name)
    for (const input of stage.inputs) assert(outputs.has(input), `Unproduced input ${input}`)
    for (const output of stage.outputs) {
      assert(/^[a-z0-9-]+\.(v8|json)$/.test(output))
      assert(!outputs.has(output), `Overwritten stage output ${output}`)
      outputs.add(output)
    }
  }
  assert(outputs.has('recovery-persisted-win.v8'))
  assert(outputs.has('recovery-continue7.v8'))
}

// Bind executable/source inputs and producer checkpoints across process boundaries.
export function validateStageSource(expected, source, sharedPaths, producedInputs) {
  const binding = {
    headOid: source.headOid,
    trackedDiffSha256: source.trackedDiffSha256,
    sharedInputs: Object.fromEntries(
      sharedPaths.map(path => {
        assert(/^[a-f0-9]{64}$/.test(source.inputs[path]), `Missing shared input hash: ${path}`)
        return [path, source.inputs[path]]
      })
    ),
  }
  if (expected) assert.deepEqual(binding, expected, 'Source changed between acceptance stages')
  for (const [path, hash] of Object.entries(producedInputs))
    assert.equal(source.inputs[path], hash, `Checkpoint changed since its producer: ${path}`)
  return binding
}

export function runAcceptance(output, { boundedEarlyCamp = false } = {}) {
  assert.equal(typeof boundedEarlyCamp, 'boolean', 'boundedEarlyCamp must be a boolean')
  const boundedReceiptStages = ['fresh-release', ...(boundedEarlyCamp ? ['early-camp'] : [])]
  validatePlan(plan)
  assert(
    /^work\/orchestration\/m6-earned-victory\/[a-zA-Z0-9_-]+$/.test(output),
    'Use a new work/orchestration/m6-earned-victory/<run-id> directory'
  )
  mkdirSync(resolve(ROOT, 'work/orchestration/m6-earned-victory'), { recursive: true })
  // Exclusive creation protects earlier successful or interrupted attempts.
  mkdirSync(resolve(ROOT, output))
  const checkpoints = `${output}/checkpoints`
  mkdirSync(resolve(ROOT, checkpoints))
  const manifest = {
    version: 1,
    kind: 'mission6-earned-cpu-acceptance',
    status: 'running',
    nodeVersion: process.version,
    sourceBinding: null,
    boundedReceiptStages,
    limits: [
      'Ordinary public simulation commands, no rendered input dispatch',
      'Synthetic IndexedDB, not actual browser persistence',
      'Store-level Mission 7 start, not a rendered Continue button click',
      'No native executable equivalence or production deployment claim',
    ],
    stages: [],
  }
  const save = () =>
    writeFileSync(resolve(ROOT, output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  const sharedPaths = [
    'scripts/check-mission6-earned-victory.mjs',
    'scripts/acceptance/m6/plan.json',
    'scripts/acceptance/m6/output-path.mjs',
    'scripts/orchestration/command-receipt.mjs',
    'scripts/orchestration/command-log.mjs',
    'scripts/orchestration/command-receipt-v1.mjs',
    'scripts/orchestration/receipt-streams.mjs',
    'tests/support/profile-storage.mjs',
    'tests/support/bloodlust-scene.mjs',
    'package-lock.json',
    'package.json',
    'scripts/orchestration/dependency-profile.mjs',
    ...dependencyInputPaths(ROOT),
    ...plan.stages.map(stage => `scripts/acceptance/m6/${stage.name}.mjs`),
  ]
  const produced = new Map()
  save()
  return (async () => {
    for (const stage of plan.stages) {
      const script = `scripts/acceptance/m6/${stage.name}.mjs`
      const receiptPath = `${output}/${stage.name}.json`
      console.log(`Mission 6: ${stage.name}`)
      const receipt = await runCommandReceipt(ROOT, {
        output: receiptPath,
        streamVersion: boundedReceiptStages.includes(stage.name) ? 2 : 1,
        command: [process.execPath, script],
        inputs: [...sharedPaths, ...stage.inputs.map(name => `${checkpoints}/${name}`)],
        env: { ...process.env, PND_M6_OUTPUT: resolve(ROOT, checkpoints) },
      })
      const result = {
        name: stage.name,
        status: receipt.status,
        receipt: receiptPath,
        receiptSha256: sha256(readFileSync(resolve(ROOT, receiptPath))),
        source: receipt.source,
        outputs: {},
      }
      manifest.stages.push(result)
      if (receipt.status !== 'passed') {
        manifest.status = 'failed'
        save()
        throw new Error(`${stage.name}: ${receipt.status}; inspect ${receiptPath}`)
      }
      try {
        manifest.sourceBinding = validateStageSource(
          manifest.sourceBinding,
          receipt.source,
          sharedPaths,
          Object.fromEntries(stage.inputs.map(name => [`${checkpoints}/${name}`, produced.get(name)]))
        )
      } catch (error) {
        result.status = 'invalidated'
        manifest.status = 'invalidated'
        manifest.failure = error.message
        save()
        throw error
      }
      for (const name of stage.outputs) {
        const hash = sha256(readFileSync(resolve(ROOT, checkpoints, name)))
        result.outputs[name] = hash
        produced.set(name, hash)
      }
      save()
    }
    manifest.result = JSON.parse(
      readFileSync(resolve(ROOT, checkpoints, 'recovery-persistence-summary.json'), 'utf8')
    )
    assert.equal(manifest.result.naturalWinTurn, plan.expectedWinTurn)
    assert.deepEqual(manifest.result.profile.completed, [6])
    assert.equal(manifest.result.continueMission, 7)
    assert.equal(manifest.result.continueStatus, 'playing')
    manifest.status = 'passed'
    save()
    console.log(JSON.stringify({ status: manifest.status, output, ...manifest.result }))
    return manifest
  })()
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), flag = '--bounded-early-camp'
  const boundedEarlyCamp = args.includes(flag)
  const positional = args.filter(arg => arg !== flag)
  assert(
    args.filter(arg => arg === flag).length <= 1 &&
      positional.length <= 1 && positional.every(arg => !arg.startsWith('-')),
    'Usage: node scripts/check-mission6-earned-victory.mjs [output-directory] [--bounded-early-camp]'
  )
  await runAcceptance(positional[0] ?? `work/orchestration/m6-earned-victory/${randomUUID()}`, {
    boundedEarlyCamp,
  })
}
