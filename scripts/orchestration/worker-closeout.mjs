#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { lstatSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const GIT_OID = /^[0-9a-f]{40,64}$/i

function pathExists(path) {
  try {
    lstatSync(path)
    return true
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false
    throw error
  }
}

export function canonicalPath(value) {
  assert(typeof value === 'string' && value.trim(), 'path must be non-empty')
  assert(isAbsolute(value), `path must be absolute: ${value}`)
  let target = resolve(value),
    ancestor = target
  const tail = []
  while (!pathExists(ancestor)) {
    const parent = dirname(ancestor)
    assert(parent !== ancestor, `cannot canonicalize path: ${value}`)
    tail.unshift(basename(ancestor))
    ancestor = parent
  }
  return resolve(realpathSync(ancestor), ...tail)
}

export function pathsOverlap(left, right) {
  const a = canonicalPath(left),
    b = canonicalPath(right),
    fromA = relative(a, b),
    fromB = relative(b, a)
  return (
    fromA === '' ||
    (!fromA.startsWith(`..${sep}`) && fromA !== '..' && !isAbsolute(fromA)) ||
    (!fromB.startsWith(`..${sep}`) && fromB !== '..' && !isAbsolute(fromB))
  )
}

export function assessProjectRelease({
  sourceProject,
  bundleProject = null,
  activeProject,
  bundlePreflight = 'not-run',
}) {
  const source = canonicalPath(sourceProject),
    active = canonicalPath(activeProject),
    bundle = bundleProject ? canonicalPath(bundleProject) : null,
    reasons = []
  if (bundle && pathsOverlap(source, bundle)) reasons.push('REVIEW_BUNDLE_OVERLAPS_SOURCE')
  if (pathsOverlap(active, source)) reasons.push('PROJECT_STILL_BOUND')
  if (bundle && pathsOverlap(active, bundle)) reasons.push('REVIEW_BUNDLE_STILL_BOUND')
  if (bundle && bundlePreflight !== 'open')
    reasons.push(
      bundlePreflight === 'project-in-use'
        ? 'REVIEW_BUNDLE_PROJECT_IN_USE'
        : 'REVIEW_BUNDLE_PREFLIGHT_NOT_VERIFIED'
    )
  return {
    status: reasons.length ? 'failed' : 'passed',
    reasons,
    sourceReleased: !pathsOverlap(active, source),
    bundleReleased: bundle ? !pathsOverlap(active, bundle) : null,
    reviewerOpenPreflight: bundle ? bundlePreflight : 'not-applicable',
  }
}

export function classifyWorkerStatus({
  complete = false,
  meaningfulWorkRemaining = false,
  reviewReady = false,
  requiredBlocked = false,
} = {}) {
  if (complete) return 'DONE'
  if (meaningfulWorkRemaining) return 'IN_PROGRESS'
  if (reviewReady) return 'NEEDS_REVIEW'
  if (requiredBlocked) return 'BLOCKED'
  return 'IN_PROGRESS'
}

export function deniedOperationDisposition({
  required = false,
  meaningfulWorkRemaining = false,
  reviewReady = false,
} = {}) {
  return {
    operation: 'denied',
    retry: false,
    required,
    workerStatus: classifyWorkerStatus({
      meaningfulWorkRemaining,
      reviewReady,
      requiredBlocked: required,
    }),
  }
}

export function assessWorkerCloseout({
  sourceProject,
  bundleProject = null,
  activeProject,
  bundlePreflight = 'not-run',
  expectedHead,
  deniedOperation = null,
  meaningfulWorkRemaining = false,
  reviewReady = false,
  complete = false,
}) {
  assert(GIT_OID.test(expectedHead ?? ''), 'trusted expected head is required')
  const source = canonicalPath(sourceProject),
    sourceHead = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim()
  assert.equal(sourceHead, expectedHead, 'source HEAD does not match trusted expected head')
  const release = assessProjectRelease({
      sourceProject: source,
      bundleProject,
      activeProject,
      bundlePreflight,
    }),
    requiredBlocked = release.status !== 'passed',
    denied =
      deniedOperation === null
        ? null
        : deniedOperationDisposition({
            required: deniedOperation === 'required',
            meaningfulWorkRemaining,
            reviewReady,
          }),
    workerStatus =
      denied?.workerStatus ??
      classifyWorkerStatus({
        complete: complete && release.status === 'passed',
        meaningfulWorkRemaining,
        reviewReady,
        requiredBlocked,
      })
  return {
    ...release,
    expectedHead,
    sourceHead,
    deniedOperation: denied,
    workerStatus,
  }
}

function parseArgs(args) {
  const options = {}
  for (let index = 0; index < args.length; index++) {
    const flag = args[index]
    assert(flag.startsWith('--'), `unexpected argument: ${flag}`)
    const key = flag.slice(2),
      value = args[++index]
    assert(value !== undefined && !value.startsWith('--'), `missing value for ${flag}`)
    assert(!Object.hasOwn(options, key), `duplicate option: ${flag}`)
    options[key] = value
  }
  return options
}

function booleanOption(value, label, fallback = false) {
  if (value === undefined) return fallback
  assert(['true', 'false'].includes(value), `${label} must be true or false`)
  return value === 'true'
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const allowed = new Set([
    'source-project',
    'bundle-project',
    'active-project',
    'bundle-preflight',
    'expected-head',
    'denied-operation',
    'meaningful-work-remaining',
    'review-ready',
    'complete',
  ])
  for (const key of Object.keys(options)) assert(allowed.has(key), `unknown option: --${key}`)
  for (const key of ['source-project', 'active-project', 'expected-head'])
    assert(options[key], `missing --${key}`)
  if (options['bundle-project']) {
    assert(options['bundle-preflight'], 'bundle closeout requires --bundle-preflight')
    assert(
      ['open', 'project-in-use', 'not-run'].includes(options['bundle-preflight']),
      '--bundle-preflight must be open, project-in-use, or not-run'
    )
  } else
    assert(
      !options['bundle-preflight'] || options['bundle-preflight'] === 'not-run',
      '--bundle-preflight requires --bundle-project'
    )
  if (options['denied-operation'])
    assert(
      ['optional', 'required'].includes(options['denied-operation']),
      '--denied-operation must be optional or required'
    )
  const result = assessWorkerCloseout({
    sourceProject: options['source-project'],
    bundleProject: options['bundle-project'] ?? null,
    activeProject: options['active-project'],
    bundlePreflight: options['bundle-preflight'] ?? 'not-run',
    expectedHead: options['expected-head'],
    deniedOperation: options['denied-operation'] ?? null,
    meaningfulWorkRemaining: booleanOption(
      options['meaningful-work-remaining'],
      '--meaningful-work-remaining'
    ),
    reviewReady: booleanOption(options['review-ready'], '--review-ready'),
    complete: booleanOption(options.complete, '--complete'),
  })
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.status === 'passed' ? 0 : 2
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
