import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  symlinkSync,
  lstatSync,
  realpathSync,
} from 'node:fs'
import { join, resolve, dirname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { protocol as p } from './protocol.mjs'
import { space, save, sha, fileSha, bytes } from './io.mjs'
import { comparePair } from './compare.mjs'
const [baseArg, candidateArg, outArg, browserArg] = process.argv.slice(2)
const base = realpathSync(baseArg),
  candidate = realpathSync(candidateArg),
  out = resolve(outArg),
  browser = realpathSync(browserArg)
assert.ok(!existsSync(out), 'One fresh attempt only')
mkdirSync(out, { recursive: true })
const roots = { baseline: base, candidate },
  report = {
    protocol: p,
    status: 'incomplete',
    startedAt: new Date().toISOString(),
    children: [],
    comparisons: [],
  },
  saveReport = () => save(join(out, 'status.json'), report)
const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const fingerprint = root =>
  Object.fromEntries(
    execFileSync('git', ['ls-files', '-z'], { cwd: root })
      .toString()
      .split('\0')
      .filter(Boolean)
      .map(path => [path, fileSha(join(root, path))])
  )
async function child(label, args, cwd, timeout) {
  const row = {
    label,
    command: [process.execPath, ...args],
    startedAt: new Date().toISOString(),
    status: 'running',
  }
  report.children.push(row)
  saveReport()
  const stdout = [],
    stderr = []
  let count = 0,
    timer,
    kill
  const result = await new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_OPTIONS: '',
        NODE_PATH: '',
        NODE_COMPILE_CACHE: '',
        NODE_V8_COVERAGE: '',
      },
    })
    const collect = target => data => {
      count += data.length
      if (count <= 4 * 1024 ** 2) target.push(data)
      else row.logTruncated = true
    }
    proc.stdout.on('data', collect(stdout))
    proc.stderr.on('data', collect(stderr))
    timer = setTimeout(() => {
      row.timedOut = true
      proc.kill('SIGTERM')
      kill = setTimeout(() => proc.kill('SIGKILL'), p.childGraceMs)
    }, timeout)
    proc.on('error', reject)
    proc.on('close', (code, signal) => resolve({ code, signal }))
  }).finally(() => {
    clearTimeout(timer)
    clearTimeout(kill)
    writeFileSync(join(out, `${label}.stdout.log`), Buffer.concat(stdout))
    writeFileSync(join(out, `${label}.stderr.log`), Buffer.concat(stderr))
  })
  Object.assign(row, result, { status: 'terminal', endedAt: new Date().toISOString() })
  saveReport()
  assert.equal(row.timedOut, undefined, label)
  assert.equal(result.code, 0, label)
}
let before
try {
  saveReport()
  report.freeBefore = space(out, true)
  for (const key of ['NODE_OPTIONS', 'NODE_PATH', 'NODE_COMPILE_CACHE', 'NODE_V8_COVERAGE'])
    assert.ok(!process.env[key], `Unexpected ${key}`)
  assert.equal(process.execArgv.length, 0)
  assert.equal(process.versions.node, '24.19.0')
  assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1', 'One hosted attempt only')
  assert.equal(git(base, 'rev-parse', 'HEAD^{tree}'), p.baselineTree)
  for (const [side, root] of Object.entries(roots)) {
    assert.equal(git(root, 'rev-parse', 'HEAD'), p[side])
    assert.equal(git(root, 'status', '--porcelain', '--untracked-files=no'), '')
  }
  assert.equal(git(candidate, 'rev-parse', 'HEAD^{tree}'), p.candidateTree)
  for (const name of ['package.json', 'package-lock.json'])
    assert.deepEqual(readFileSync(join(base, name)), readFileSync(join(candidate, name)))
  const locks = Object.values(roots).map(root => ({
    path: realpathSync(join(root, 'node_modules/.package-lock.json')),
    sha256: fileSha(join(root, 'node_modules/.package-lock.json')),
  }))
  assert.equal(locks[0].path, locks[1].path)
  before = Object.fromEntries(
    Object.entries(roots).map(([side, root]) => [side, fingerprint(root)])
  )
  report.binding = {
    source: before,
    node: {
      executable: realpathSync(process.execPath),
      sha256: fileSha(process.execPath),
      versions: process.versions,
      execArgv: process.execArgv,
    },
    locks,
    browser: {
      path: browser,
      sha256: fileSha(browser),
      version: execFileSync(browser, ['--version'], { encoding: 'utf8' }).trim(),
    },
  }
  const setup = await import(
    pathToFileURL(join(base, 'scripts/browser-performance/snapshot-setup.mjs'))
  )
  const fixtureDir = join(out, 'fixture')
  mkdirSync(fixtureDir)
  const fixture = await setup.createSnapshotFixture({
    output: fixtureDir,
    source: { commit: p.baseline },
  })
  save(join(fixtureDir, 'fixture.json'), fixture)
  report.fixture = fixture.receipt
  saveReport()
  const dist = {}
  for (const [side, root] of Object.entries(roots)) {
    space(out)
    const build = join(out, `build-${side}`)
    mkdirSync(build)
    await child(
      `build-${side}`,
      [join(import.meta.dirname, 'build.mjs'), root, build, p[side]],
      base,
      p.buildMs
    )
    dist[side] = join(build, 'dist')
    for (const file of readdirSync(join(root, 'public'))) {
      const target = join(dist[side], file)
      assert.ok(!existsSync(target))
      symlinkSync(
        join(root, 'public', file),
        target,
        lstatSync(join(root, 'public', file)).isDirectory() ? 'dir' : 'file'
      )
    }
  }
  for (const [cohort, side] of p.order) {
    space(out)
    assert.ok(bytes(out) < p.maximumEvidenceBytes, 'Total evidence budget')
    const dir = join(out, `${cohort}-${side}`)
    await child(
      `${cohort}-${side}`,
      [
        join(import.meta.dirname, 'worker.mjs'),
        base,
        roots[side],
        dist[side],
        join(fixtureDir, 'fixture.json'),
        dir,
        cohort,
        side,
        browser,
      ],
      base,
      p.childMs + p.childGraceMs
    )
    const r = JSON.parse(readFileSync(join(dir, 'report.json')))
    for (const asset of r.served) {
      const path = resolve(dist[side], '.' + decodeURIComponent(asset.path))
      assert.ok(path.startsWith(dist[side] + sep) || path === dist[side])
      const served = asset.path === '/' ? join(dist[side], 'index.html') : path
      assert.equal(fileSha(served), asset.sha256, `Served asset binding ${asset.path}`)
    }
  }
  const { checkpointCodec } = await import(
    pathToFileURL(join(base, 'scripts/tutorial-browser/checkpoint-codec.mjs'))
  )
  for (const cohort of ['camera', 'animation'])
    report.comparisons.push({
      cohort,
      rows: comparePair(
        join(out, `${cohort}-baseline`),
        join(out, `${cohort}-candidate`),
        out,
        checkpointCodec
      ),
    })
  report.status = 'passed'
} catch (error) {
  report.failure = { message: String(error), stack: error.stack }
  process.exitCode = 1
} finally {
  try {
    if (before)
      for (const [side, root] of Object.entries(roots))
        assert.deepEqual(fingerprint(root), before[side], `End source drift ${side}`)
    for (const [side, root] of Object.entries(roots)) {
      assert.equal(git(root, 'rev-parse', 'HEAD'), p[side])
      assert.equal(git(root, 'status', '--porcelain', '--untracked-files=no'), '')
    }
    if (report.binding) {
      assert.equal(fileSha(process.execPath), report.binding.node.sha256)
      assert.equal(fileSha(browser), report.binding.browser.sha256)
      for (const lock of report.binding.locks) assert.equal(fileSha(lock.path), lock.sha256)
    }
    report.endBinding = 'passed'
  } catch (error) {
    report.endBinding = String(error)
    process.exitCode = 1
  }
  report.endedAt = new Date().toISOString()
  saveReport()
}
