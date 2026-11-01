import { StringDecoder } from 'node:string_decoder'
import { createCaptureProtocolCollector } from './capture-protocol-collector.mjs'

export const captureBegin = 'PND_CAPTURE_WINDOW_V1 BEGIN'
export const captureEnd = 'PND_CAPTURE_WINDOW_V1 END'

// Pure environment preparation. Caller must still use its existing owned-child
// supervisor/deadline. No DEBUG_FILE may bypass the exclusive redacting pipe.
export function captureDiagnosticEnvironment(env, enabled = false) {
  if (!enabled) return env
  const next = { ...env }
  for (const name of Object.keys(next))
    if (/^debug(?:_|$)/i.test(name) || name === 'MAX_LOG_LENGTH') delete next[name]
  return { ...next, DEBUG: 'pw:protocol', DEBUG_COLORS: '0', MAX_LOG_LENGTH: '1024',
    PND_CAPTURE_PROTOCOL_WINDOW: '1' }
}

// When disabled, invoke exactly once without marker I/O or promise wrapping.
export function withCaptureProtocolWindow(enabled, write, action) {
  if (!enabled) return action()
  // A missing marker invalidates the independent diagnostic window; it must
  // never replace the gameplay result/error or prevent its execution.
  const mark = value => { try { write(value + '\n') } catch {} }
  mark(captureBegin)
  let result
  try { result = action() } catch (error) { mark(captureEnd); throw error }
  return Promise.resolve(result).finally(() => mark(captureEnd))
}

// Attach only to fresh, exclusively owned pipes. No output chunk is forwarded,
// stored, logged or included in errors. Process lifecycle remains with caller.
export function observeCaptureProtocolChild(child, { enabled = false, clock } = {}) {
  if (!enabled) return null
  for (const stream of [child.stdout, child.stderr])
    if (!stream || stream.readableFlowing !== null || stream.listenerCount('data') || stream.listenerCount('readable'))
      throw new Error('Capture diagnostics require fresh exclusive stdout/stderr pipes')
  const collector = createCaptureProtocolCollector({ enabled: true, clock })
  const decoder = new StringDecoder('utf8')
  let carry = '', dropping = false, state = 'before', begins = 0, ends = 0
  let protocolOutsideWindow = 0, overlongLines = 0, stdoutBytes = 0, stderrBytes = 0, markerErrors = 0
  let result
  const completed = new Promise(resolve => { result = resolve })
  function line(text) {
    if (text === captureBegin) {
      begins++
      if (state !== 'before') { markerErrors++; state = 'invalid' } else state = 'active'
    } else if (text === captureEnd) {
      ends++
      if (state !== 'active') { markerErrors++; state = 'invalid' } else state = 'after'
    } else if (state === 'active') collector.push(text + '\n')
    else if (text.includes('pw:protocol')) protocolOutsideWindow++
  }
  function consume(text) {
    for (const char of text) {
      if (char === '\n') {
        if (!dropping) line(carry)
        carry = ''; dropping = false
      } else if (!dropping) {
        if (carry.length + char.length > 2048) { carry = ''; dropping = true; overlongLines++ }
        else carry += char
      }
    }
  }
  const output = chunk => { stdoutBytes += chunk.length }
  const errorOutput = chunk => { stderrBytes += chunk.length; consume(decoder.write(chunk)) }
  // Swallow no process failures: report only bounded category, never raw Error.
  let spawnError = false
  const failed = () => { spawnError = true }
  const close = (code, signal) => {
    consume(decoder.end())
    if (carry && !dropping) line(carry)
    carry = ''
    child.stdout.removeListener('data', output); child.stderr.removeListener('data', errorOutput)
    child.removeListener('error', failed); child.removeListener('close', close)
    result({ code: Number.isInteger(code) ? code : null,
      signal: typeof signal === 'string' && /^[A-Z0-9]{1,16}$/.test(signal) ? signal : null,
      spawnError, windowComplete: state === 'after' && begins === 1 && ends === 1 && !markerErrors,
      begins, ends, markerErrors, protocolOutsideWindow, overlongLines, stdoutBytes, stderrBytes,
      collection: collector.finish() })
  }
  child.stdout.on('data', output); child.stderr.on('data', errorOutput)
  child.on('error', failed); child.once('close', close)
  return completed
}
