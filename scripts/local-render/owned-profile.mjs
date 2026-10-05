// One game-only profile lease. No stale-lock recovery or personal-profile adoption.
import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { hostname } from 'node:os'
import { isDeepStrictEqual } from 'node:util'
import { readRecoveryAdmission } from '../../qa/mission-three-controls/recovery-admission.mjs'
import { readGameplayContinuation } from '../../qa/mission-three-controls/sermon-successor.mjs'

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const json = value => JSON.stringify(value, null, 2) + '\n'
const markerName = 'populous-profile.json', lockName = 'owner.lock'
const runtimeScripts = new Set(['harness.mjs', 'owned-profile.mjs', 'checkpoint-observer.mjs', 'vite.config.mjs'])
const checkerPath = path => path.startsWith('qa/') ||
  (path.startsWith('scripts/local-render/') && !runtimeScripts.has(basename(path)))

export function profileInputReceipt(root, scenario) {
  const names = execFileSync('git', ['-C', root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const inputs = [...new Set(names.split('\0').filter(Boolean))].sort().map(path => {
    let stat
    try { stat = lstatSync(resolve(root, path)) } catch (error) { if (error.code === 'ENOENT') return { path, missing: true }; throw error }
    if (!stat.isFile() || stat.isSymbolicLink()) throw Error(`Persistent profile inputs must be regular nonsymlink files: ${path}`)
    return { path, mode: stat.mode, sha256: sha256(readFileSync(resolve(root, path))) }
  })
  if (scenario) {
    const path = relative(root, resolve(scenario))
    if (!checkerPath(path) || !inputs.some(input => input.path === path && !input.missing)) throw Error('Persistent scenario must be a repository-enumerated QA/scenario file')
  }
  return {
    application: sha256(JSON.stringify(inputs.filter(input => !checkerPath(input.path)))),
    checker: sha256(JSON.stringify(inputs.filter(input => checkerPath(input.path)))),
  }
}

// Do not follow even an ancestor symlink. Only the final task directory is new;
// an existing directory must carry this harness's matching provenance.
function inspectPath(path, { create = false, privateOwner = false } = {}) {
  for (const part of path.split(sep).filter(Boolean).reduce((all, part) => [...all, resolve(all.at(-1) ?? sep, part)], [])) {
    let stat
    try { stat = lstatSync(part) } catch (error) {
      if (error.code !== 'ENOENT' || !create) throw error
      mkdirSync(part, { mode: 0o700 }); stat = lstatSync(part)
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error(`Profile path is not a real directory: ${part}`)
    if (privateOwner && part === path && (stat.uid !== process.getuid() || (stat.mode & 0o077))) throw Error('Profile must be private and owned by this user')
  }
}
function readOwnedJson(path) {
  const stat = lstatSync(path)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.uid !== process.getuid() || (stat.mode & 0o077) || stat.size > 65536) throw Error(`Unrecognized profile metadata: ${path}`)
  return JSON.parse(readFileSync(path, 'utf8'))
}
export function validateProfilePaths(root, path, output) {
  root = resolve(root)
  const parent = resolve(root, 'work/local-render-profiles')
  if (!isAbsolute(path) || path !== resolve(path) || dirname(path) !== parent || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(basename(path))) throw Error('Profile must be a canonical absolute task directory under gameRoot/work/local-render-profiles')
  if (relative(path, resolve(output)).split(sep)[0] !== '..' || relative(resolve(output), path).split(sep)[0] !== '..') throw Error('Evidence output must not overlap the private profile')
  for (const target of [path, resolve(output)]) {
    for (const part of target.split(sep).filter(Boolean).reduce((all, part) => [...all, resolve(all.at(-1) ?? sep, part)], [])) {
      let stat
      try { stat = lstatSync(part) } catch (error) { if (error.code === 'ENOENT') break; throw error }
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error(`Profile/output path is not a real directory: ${part}`)
    }
  }
  execFileSync('git', ['-C', root, 'check-ignore', '-q', '--', path])
  return parent
}

export function acquireProfile({ path, root, origin, source, inputs, runtime, output, correspondence, scenario }) {
  root = resolve(root)
  const parent = validateProfilePaths(root, path, output)
  inspectPath(parent, { create: true })
  let created = false
  try { mkdirSync(path, { mode: 0o700 }); created = true } catch (error) { if (error.code !== 'EEXIST') throw error }
  inspectPath(path, { privateOwner: true })
  const marker = resolve(path, markerName), lock = resolve(path, lockName), dataDir = resolve(path, 'browser')
  const binding = { root, origin, application: inputs.application, runtime }
  let manifest, recoveryAdmission = null, gameplayContinuation = null
  if (created) {
    manifest = { version: 1, purpose: 'populous-local-render-game-only', id: randomUUID(), path, createdAt: new Date().toISOString(), binding, lastRun: null }
    writeFileSync(marker, json(manifest), { flag: 'wx', mode: 0o600 })
    mkdirSync(dataDir, { mode: 0o700 })
  } else {
    manifest = readOwnedJson(marker)
    if (manifest.version !== 1 || manifest.purpose !== 'populous-local-render-game-only' || !/^[0-9a-f-]{36}$/.test(manifest.id ?? '') || manifest.path !== path) throw Error('Profile ownership or game/runtime/origin inputs do not match; use a new task profile')
    if (manifest.gameplayContinuationClaim) throw Error('The single reviewed gameplay successor is already claimed; preserve it for review')
    if (manifest.recoveryAdmission && manifest.lastRun && correspondence) {
      gameplayContinuation = readGameplayContinuation(correspondence,
        { root, path, id: manifest.id, origin, source, inputs, runtime, scenario }, manifest)
      recoveryAdmission = gameplayContinuation.recoveryAdmission
    } else {
      if (!isDeepStrictEqual(manifest.binding, binding)) throw Error('Profile ownership or game/runtime/origin inputs do not match; use a new task profile')
      if (manifest.recoveryAdmission) {
        if (manifest.lastRun || manifest.recoveryClaim) throw Error('Single-segment recovery already claimed; preserve it for review')
        recoveryAdmission = readRecoveryAdmission(manifest.recoveryAdmission,
          { root, path, id: manifest.id, origin, source, inputs, runtime, scenario, correspondence }, { storagePath: dataDir })
      }
    }
    if ((!recoveryAdmission || manifest.lastRun) && (!manifest.lastRun?.cleanupVerified || !manifest.lastRun.continuationVerified || !Object.hasOwn(manifest.lastRun, 'checkpointAtEnd'))) throw Error('Profile has no verified terminal provenance; preserve it for review')
    inspectPath(dataDir, { privateOwner: true })
    for (const name of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
      try { lstatSync(resolve(dataDir, name)) } catch (error) { if (error.code === 'ENOENT') continue; throw error }
      throw Error('Existing browser ownership marker; preserve the profile for review')
    }
  }
  let review = null
  if (!created && !recoveryAdmission && (manifest.lastRun.sourceFingerprint !== source.fingerprint || manifest.lastRun.checker !== inputs.checker)) {
    if (!correspondence) throw Error('Changed checker/source requires an explicit reviewed correspondence')
    const bytes = readFileSync(correspondence), value = JSON.parse(bytes)
    if (value.priorRunId !== manifest.lastRun.runId || value.previousSourceFingerprint !== manifest.lastRun.sourceFingerprint || value.currentSourceFingerprint !== source.fingerprint || value.previousChecker !== manifest.lastRun.checker || value.currentChecker !== inputs.checker || value.decision !== 'ACCEPT' || !value.reviewer || !value.reference) throw Error('Reviewed correspondence does not match this exact continuation')
    review = { ...value, sha256: sha256(bytes) }
    if (JSON.stringify(review).length > 4096) throw Error('Correspondence must be bounded')
  }
  const runId = randomUUID(), owner = { version: 1, profileId: manifest.id, runId, pid: process.pid, hostname: hostname(), startedAt: new Date().toISOString(), output }
  // wx refuses live, stale, corrupt, or symlink locks alike. Never infer ownership
  // from a PID, kill an unknown process, or automatically remove a stale lock.
  writeFileSync(lock, json(owner), { flag: 'wx', mode: 0o600 })
  if (gameplayContinuation || (recoveryAdmission && !manifest.lastRun)) {
    manifest = gameplayContinuation ? { ...manifest, binding, gameplayContinuationClaim: {
      runId, priorRunId: manifest.lastRun.runId, correspondenceSha256: gameplayContinuation.reference.sha256,
      reference: gameplayContinuation.reference, previousBinding: manifest.binding,
    } } : { ...manifest, recoveryClaim: { runId } }
    const temp = resolve(path, `claim-${runId}.tmp`)
    writeFileSync(temp, json(manifest), { flag: 'wx', mode: 0o600 })
    renameSync(temp, marker)
  }
  const profile = { id: manifest.id, path, runId, mode: created ? 'created' : 'reused', origin, inputs, correspondence: review, previousRun: manifest.lastRun, checkpoints: [],
    ...(recoveryAdmission ? { recoveryAdmission, recoveryClaim: manifest.recoveryClaim } : {}),
    ...(gameplayContinuation ? { gameplayContinuation, gameplayContinuationClaim: manifest.gameplayContinuationClaim } : {}) }
  let finished = false
  return { dataDir, profile,
    finish(receipt, cleanupVerified) {
      if (finished) throw Error('Profile lease already finished')
      if (!cleanupVerified) throw Error('Browser cleanup is unverified; profile lock retained')
      if (!receipt.profile?.continuationVerified) throw Error('Checkpoint/source provenance is unverified; profile lock retained')
      inspectPath(path, { privateOwner: true })
      if (!isDeepStrictEqual(readOwnedJson(lock), owner) || !isDeepStrictEqual(readOwnedJson(marker), manifest)) throw Error('Profile ownership changed; lock retained')
      const text = readFileSync(resolve(output, 'receipt.json'), 'utf8')
      if (sha256(text) !== sha256(json(receipt))) throw Error('Terminal receipt changed; lock retained')
      const lastRun = { runId, sourceFingerprint: source.fingerprint, sourceCommit: source.commit, checker: inputs.checker, receiptPath: resolve(output, 'receipt.json'), receiptSha256: sha256(text), status: receipt.status, cleanupVerified, continuationVerified: receipt.profile.continuationVerified, checkpointAtEnd: receipt.profile.checkpointAtEnd }
      const temp = resolve(path, `manifest-${runId}.tmp`)
      writeFileSync(temp, json({ ...manifest, lastRun }), { flag: 'wx', mode: 0o600 })
      renameSync(temp, marker)
      unlinkSync(lock)
      finished = true
    },
  }
}

// Passing ignoreDefaultArgs:true also omits Playwright's user-data-dir flag.
// Explicitly retain only the owned data directory and the debugging pipe.
export function persistentLaunchOptions(launch, dataDir) {
  return { ...launch, args: [...launch.args, `--user-data-dir=${dataDir}`, 'about:blank'], viewport: { width: 1440, height: 1000 }, acceptDownloads: false, serviceWorkers: 'block' }
}
