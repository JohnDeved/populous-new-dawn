import { isAbsolute } from 'node:path'
import { superviseBrowserCheck } from '../performance-queue.mjs'
import { captureDiagnosticEnvironment, observeCaptureProtocolChild } from './capture-protocol-window.mjs'
import { qualifyCaptureInputs } from './qualify-capture-inputs.mjs'

// Source design only. Deliberately no generic observer/supervisor injection or
// CLI launch here: bind the exact reviewed implementations at this boundary.
export async function runIntegratedCaptureProtocol({ enabled = false, cwd, runner, node,
  trustedNodeSha256, env = process.env } = {}) {
  if (!enabled) return { enabled: false, started: false }
  if (![cwd, runner, node].every(value => typeof value === 'string' && isAbsolute(value)))
    throw Error('Capture cwd, runner and executable must be absolute paths')
  const snapshot = { ...env }
  if (Object.values(snapshot).some(value => value !== undefined && typeof value !== 'string'))
    throw Error('Capture environment values must be strings')
  for (const key of ['NODE_OPTIONS','NODE_PATH','NODE_COMPILE_CACHE','NODE_V8_COVERAGE','PWDEBUG','PW_INSTRUMENT_MODULES'])
    if (snapshot[key]) throw Error('Capture diagnostic forbids inherited runtime instrumentation')
  const childEnv = Object.freeze(captureDiagnosticEnvironment({ ...snapshot,
    POPULOUS_BROWSER_SCENARIO: 'tutorial' }, true))
  // run.mjs owns this exact port; do not falsely certify cleanup of another URL.
  if (childEnv.POPULOUS_URL !== 'http://127.0.0.1:5198' || childEnv.PND_QUEUE_PORTS !== '5198')
    throw Error('Capture runner must declare its exact internally hosted URL and port')
  qualifyCaptureInputs({ cwd, runner, node }, trustedNodeSha256)
  let result, observation = null, supervisorFailed = false
  try {
    result = await superviseBrowserCheck({
      checkerCommand: [node, runner], cwd, env: childEnv, serverMode: 'checker',
      observeChecker: child => observeCaptureProtocolChild(child, { enabled: true }).then(value => {
        observation = value
        return value
      }),
    })
  } catch {
    // Failed Tutorial runs are the diagnostic target. Preserve only the exact
    // bound observer's metadata, never a supervisor/child exception payload.
    supervisorFailed = true
  }
  const quality = observation?.collection
  const runnerSucceeded = !!(!supervisorFailed && result?.resourcesReleased && observation && observation.code === 0 &&
    observation.signal === null && !observation.spawnError)
  const usableObservation = !!(observation?.windowComplete && !observation.markerErrors &&
    !observation.overlongLines && quality && !quality.malformed && !quality.dropped &&
    !quality.overlongLines && !quality.clockErrors)
  return { enabled: true, runnerSucceeded, supervisorFailed, usableObservation, observation }
}
