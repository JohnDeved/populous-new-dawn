import assert from 'node:assert/strict'
export const limits = Object.freeze({
  buildRuntimeSeconds: 115, browserRuntimeSeconds: 65, stopSeconds: 5,
  memoryBytes: 4 * 1024 ** 3, tasks: 256, logBytes: 16 * 1024 ** 2, artifactBytes: 64 * 1024 ** 2,
})
export function admitModal(event, env) {
  const sha = value => assert.match(value ?? '', /^[a-f0-9]{40}$/)
  assert.equal(env.GITHUB_ACTIONS, 'true'); assert.equal(env.GITHUB_EVENT_NAME, 'pull_request')
  assert.equal(env.GITHUB_REPOSITORY, 'JohnDeved/populous-new-dawn'); assert.equal(event.action, 'ready_for_review')
  const pr = event.pull_request
  assert.equal(pr.state, 'open'); assert.equal(pr.draft, false)
  for (const side of ['head', 'base']) { assert.equal(pr[side].repo.full_name, env.GITHUB_REPOSITORY); sha(pr[side].sha) }
  sha(env.GITHUB_SHA); assert.equal(pr.head.sha, env.PR_HEAD_SHA); assert.equal(pr.base.sha, env.PR_BASE_SHA)
  assert.ok(pr.labels.some(label => label.name === `modal-v1:${pr.head.sha}`))
  for (const name of ['GITHUB_RUN_ID', 'GITHUB_RUN_ATTEMPT']) assert.match(env[name] ?? '', /^[1-9][0-9]*$/)
  return { head: pr.head.sha, base: pr.base.sha, merge: env.GITHUB_SHA,
    runId: env.GITHUB_RUN_ID, runAttempt: env.GITHUB_RUN_ATTEMPT }
}
export function serviceName(identity, stage) {
  assert.ok(['build', 'browser'].includes(stage))
  for (const value of [identity.runId, identity.runAttempt]) assert.match(value, /^[1-9][0-9]*$/)
  return `pnd-modal-${identity.runId}-${identity.runAttempt}-${stage}.service`
}
export function serviceArguments({ identity, stage, uid, gid, root, node, args, home, temporary }) {
  for (const id of [uid, gid]) assert.ok(Number.isInteger(id) && id > 0, 'Service must run as the unprivileged runner user')
  for (const value of [root, node, home, temporary]) assert.ok(value.startsWith('/') && !/[\n\0]/.test(value))
  const unit = serviceName(identity, stage), runtime = stage === 'build' ? limits.buildRuntimeSeconds : limits.browserRuntimeSeconds
  return ['--non-interactive', 'systemd-run', `--unit=${unit}`, '--wait', '--pipe',
    `--uid=${uid}`, `--gid=${gid}`, `--working-directory=${root}`, '--service-type=exec',
    `--property=RuntimeMaxSec=${runtime}s`, `--property=TimeoutStopSec=${limits.stopSeconds}s`,
    '--property=KillMode=control-group', '--property=SendSIGKILL=yes',
    `--property=MemoryMax=${limits.memoryBytes}`, `--property=TasksMax=${limits.tasks}`,
    '--property=LimitCORE=0', '--property=LimitFSIZE=67108864',
    `--setenv=HOME=${home}`, `--setenv=TMPDIR=${temporary}`, `--setenv=XDG_CACHE_HOME=${temporary}/cache`,
    `--setenv=PND_MODAL_UNIT=${unit}`, '--setenv=NODE_OPTIONS=', '--setenv=NODE_PATH=',
    '--setenv=NODE_COMPILE_CACHE=', '--setenv=NODE_V8_COVERAGE=', '--setenv=CI=true',
    `--setenv=DEBUG=${stage === 'browser' ? 'pw:browser' : ''}`, '--setenv=DEBUG_COLORS=0',
    node, '--max-old-space-size=768', ...args]
}
export function parseProperties(text) {
  return Object.fromEntries(text.trim().split('\n').map(line => {
    const index = line.indexOf('='); assert.ok(index > 0); return [line.slice(0, index), line.slice(index + 1)]
  }))
}
export function durationMilliseconds(text) {
  assert.match(text, /^(?:\d+(?:\.\d+)?(?:us|ms|s|min|h)(?: |$))+$/)
  return [...text.matchAll(/(\d+(?:\.\d+)?)(us|ms|s|min|h)/g)]
    .reduce((sum, [, value, unit]) => sum + Number(value) * { us: .001, ms: 1, s: 1000, min: 60000, h: 3600000 }[unit], 0)
}
export function validateSupervisor(properties, { unit, stage, pid, uid, cgroup }) {
  assert.equal(properties.Id, unit); assert.equal(Number(properties.MainPID), pid)
  assert.equal(Number(properties.User), uid); assert.ok(uid > 0)
  assert.equal(properties.KillMode, 'control-group'); assert.equal(properties.SendSIGKILL, 'yes')
  assert.equal(properties.ControlGroup, `/system.slice/${unit}`)
  assert.equal(cgroup.trim(), `0::${properties.ControlGroup}`, 'Worker must be in the proven unified control group')
  const runtime = stage === 'build' ? limits.buildRuntimeSeconds : limits.browserRuntimeSeconds
  assert.equal(durationMilliseconds(properties.RuntimeMaxUSec), runtime * 1000)
  assert.equal(durationMilliseconds(properties.TimeoutStopUSec), limits.stopSeconds * 1000)
  assert.equal(Number(properties.MemoryMax), limits.memoryBytes); assert.equal(Number(properties.TasksMax), limits.tasks)
  return { kind: 'systemd-control-group', unit, stage, pid, uid, runtimeMs: runtime * 1000,
    killAfterMs: limits.stopSeconds * 1000, hardCapMs: (runtime + limits.stopSeconds) * 1000,
    controlGroup: properties.ControlGroup, memoryBytes: limits.memoryBytes, tasks: limits.tasks }
}
