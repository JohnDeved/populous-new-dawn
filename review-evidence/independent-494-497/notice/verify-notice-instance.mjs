import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const [repository, output] = process.argv.slice(2)
assert.ok(repository && output, 'Usage: node verify-notice-instance.mjs CHECKOUT REPORT.json')
const root = resolve(repository), reportPath = resolve(output)
assert.ok(!reportPath.startsWith(root + sep), 'Keep review output outside the source checkout')
const require = createRequire(resolve(root, 'package.json'))
const ts = require('typescript')
const { pageNode, pageSource, evaluatePage } = await import(pathToFileURL(resolve(root, 'tests/support/follower-nearby-page.mjs')))
const { requestTutorial } = await import(pathToFileURL(resolve(root, 'app/world-effects.ts')))
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex')
const snapshot = () => ({
  head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  diffSha256: createHash('sha256').update(execFileSync('git', ['diff', 'HEAD', '--binary'], { cwd: root })).digest('hex'),
  files: Object.fromEntries(['app/page.tsx', 'app/world-effects.ts', 'tests/support/follower-nearby-page.mjs',
    'package-lock.json', 'node_modules/.package-lock.json'].map(file => [file, hash(resolve(root, file))])),
  typescriptSha256: hash(require.resolve('typescript')),
})
const report = { status: 'running', node: process.version, probeSha256: hash(import.meta.filename),
  sourceBefore: snapshot(), cases: [],
  limits: ['Real producer and extracted Home callback; no browser, CSS timer or duplicate-event-delivery claim.'] }
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
const notice = pageNode(node => ts.isJsxElement(node) &&
  node.openingElement.attributes.properties.some(attribute =>
    attribute.name?.getText(pageSource) === 'className' && attribute.initializer?.text === 'world-message route-notice'))
function fixture() {
  let world = { routeNotice: null }
  const store = { change: action => action(world) }
  return {
    get world() { return world },
    issue() { requestTutorial(world, 0x200000, 603); return world.routeNotice },
    replace() { world = { routeNotice: null }; return world },
    completion() { return evaluatePage(notice.getText(pageSource), {
      store, world, routeNotice: world.routeNotice, menu: false, selectorOpen: false,
      ROUTE_FAILURE_TEXT: 'Route failure',
    }).props.onAnimationEnd },
  }
}
const check = (name, run) => {
  try { const details = run(); report.cases.push({ name, status: 'passed', details }) }
  catch (error) { report.cases.push({ name, status: 'failed', error: error.stack ?? String(error) }) }
}
check('reused serial does not restore authority to a completed notice callback', () => {
  const f = fixture(), original = f.issue(), stale = f.completion()
  assert.equal(original.serial, 1)
  stale(); assert.equal(f.world.routeNotice, null)
  const replacement = f.issue()
  assert.equal(replacement.serial, original.serial, 'Actual producer must reuse serial 1 after clearing')
  assert.notEqual(replacement, original)
  stale()
  assert.equal(f.world.routeNotice, replacement, 'Obsolete callback cleared a different same-world notice with reused serial')
  f.completion()(); assert.equal(f.world.routeNotice, null, 'Current callback must still clear its own notice')
  return { originalSerial: original.serial, replacementSerial: replacement.serial, replacementRetained: true }
})
check('an active replacement notice survives the previous callback', () => {
  const f = fixture(), original = f.issue(), stale = f.completion(), replacement = f.issue()
  assert.equal(replacement.serial, original.serial + 1)
  stale(); assert.equal(f.world.routeNotice, replacement)
  f.completion()(); assert.equal(f.world.routeNotice, null)
})
check('a replacement world retains its same-serial notice', () => {
  const f = fixture(), original = f.issue(), stale = f.completion()
  f.replace(); const replacement = f.issue()
  assert.equal(replacement.serial, original.serial)
  stale(); assert.equal(f.world.routeNotice, replacement)
  f.completion()(); assert.equal(f.world.routeNotice, null)
})
check('duplicate completion of an already-cleared notice is harmless', () => {
  const f = fixture(); f.issue(); const complete = f.completion()
  complete(); complete(); assert.equal(f.world.routeNotice, null)
})
report.sourceAfter = snapshot()
report.sourceUnchanged = JSON.stringify(report.sourceAfter) === JSON.stringify(report.sourceBefore)
report.status = report.sourceUnchanged && report.cases.every(c => c.status === 'passed') ? 'passed' : 'failed'
report.finishedAt = new Date().toISOString()
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ status: report.status, head: report.sourceBefore.head,
  cases: report.cases.map(({ name, status }) => ({ name, status })), reportPath }))
if (report.status !== 'passed') process.exitCode = 1
