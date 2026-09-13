import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { progressStatus } from './progress.mjs'
import {
  ROOT, changedPaths, parseOptions, repositoryCheckCoverage, safeRepoPath,
  validateContract, validateRepository,
} from './cli.mjs'

export function prepareContract(repo, spec, { taskId, base = 'HEAD' } = {}) {
  assert(!spec.identity && !spec.version, 'Supply a task spec, not an existing contract')
  assert(!spec.verification?.results?.length, 'Preparation does not import old results')
  const manifests = validateRepository(repo)
  const baseline = changedPaths(repo, base)
  const { inputPaths = [], ...intent } = spec
  assert(Array.isArray(inputPaths), 'inputPaths must be an array of policy/evidence files')
  const paths = [...new Set([
    'GOAL.md', 'parity.json', 'engineering/checks.json', 'engineering/project-map.json',
    ...inputPaths,
  ])].sort()
  const requested = spec.verification?.requiredCheckIds
  assert(Array.isArray(requested) && requested.length, 'Specify the required check IDs')
  const included = requested.includes('repository-check')
    ? repositoryCheckCoverage(repo, manifests) : []
  const coverage = [...new Set(requested)].filter(id => included.includes(id))
    .map(checkId => ({ checkId, coveredBy: 'repository-check' }))
  const contract = {
    ...intent,
    version: 1,
    identity: {
      taskId,
      baseCommit: baseline.baseCommit,
      baseline: baseline.records,
      inputFingerprints: Object.fromEntries(paths.map(path => [path,
        createHash('sha256').update(readFileSync(safeRepoPath(repo, path))).digest('hex'),
      ])),
    },
    research: { nativeQuestions: [], evidence: [], assumptions: [], ...spec.research },
    modernization: { risks: [], measurementNeeds: [], corrections: [], ...spec.modernization },
    verification: {
      ...spec.verification,
      requiredCheckIds: [...new Set(requested)].filter(id => !included.includes(id)),
      coverage,
      results: [],
    },
  }
  validateContract(repo, contract, manifests)
  return contract
}

export function main(argv = process.argv.slice(2), repo = ROOT) {
  const options = parseOptions(argv)
  assert(options.spec && options.contract && options['task-id'], 'Requires --spec, --contract, and --task-id')
  for (const key of Object.keys(options))
    assert(['spec', 'contract', 'task-id', 'base'].includes(key), `Unknown option: --${key}`)
  assert(options.contract.startsWith('work/orchestration/'), 'Contract must be under ignored work/orchestration/')
  const output = safeRepoPath(repo, options.contract, { mustExist: false })
  execFileSync('git', ['check-ignore', '-q', '--', options.contract], { cwd: repo })
  const spec = JSON.parse(readFileSync(safeRepoPath(repo, options.spec), 'utf8'))
  const contract = prepareContract(repo, spec, { taskId: options['task-id'], base: options.base })
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, `${JSON.stringify(contract, null, 2)}\n`, { flag: 'wx' })
  return {
    contract: options.contract,
    base: contract.identity.baseCommit,
    baselineEntries: contract.identity.baseline.length,
    requiredCheckIds: contract.verification.requiredCheckIds,
    coverage: contract.verification.coverage,
    executesChecks: false,
    deliveryClock: progressStatus(repo),
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    console.log(JSON.stringify(main(), null, 2))
  } catch (error) {
    console.error(`orchestration prepare: ${error.message}`)
    process.exitCode = 1
  }
}
