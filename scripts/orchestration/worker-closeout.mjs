#!/usr/bin/env node
import assert from 'node:assert/strict'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

function absolute(value, label) {
  assert(typeof value === 'string' && value.trim(), `${label} must be non-empty`)
  assert(isAbsolute(value), `${label} must be absolute`)
  return resolve(value)
}

export function pathsOverlap(left, right) {
  const a = resolve(left),
    b = resolve(right),
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
  const source = absolute(sourceProject, 'source project'),
    active = absolute(activeProject, 'active project'),
    bundle = bundleProject ? absolute(bundleProject, 'bundle project') : null,
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
    workerStatus: classifyWorkerStatus({
      meaningfulWorkRemaining,
      reviewReady,
      requiredBlocked: required,
    }),
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

function main() {
  const options = parseArgs(process.argv.slice(2))
  for (const key of Object.keys(options))
    assert(
      ['source-project', 'bundle-project', 'active-project', 'bundle-preflight'].includes(key),
      `unknown option: --${key}`
    )
  for (const key of ['source-project', 'active-project']) assert(options[key], `missing --${key}`)
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
  const result = assessProjectRelease({
    sourceProject: options['source-project'],
    bundleProject: options['bundle-project'] ?? null,
    activeProject: options['active-project'],
    bundlePreflight: options['bundle-preflight'] ?? 'not-run',
  })
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.status === 'passed' ? 0 : 2
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
