// Opt-in diagnostic proposal; no browser launch/environment is changed here.
// Raw protocol lines are transient only. Never return payloads or unfiltered logs.
import { createHash } from 'node:crypto'

export function createCaptureProtocolCollector({ enabled = false, clock = () => performance.now() } = {}) {
  const maxLine = 2048, maxEvents = 128, maxPending = 16
  const report = { enabled, events: [], overlongLines: 0, malformed: 0, dropped: 0, clockErrors: 0, unfinished: 0 }
  const pending = new Map()
  let carry = '', discarding = false, closed = false
  const now = () => {
    try { const n = clock(); if (Number.isFinite(n)) return n } catch {}
    report.clockErrors++; return null
  }
  const emit = event => {
    if (report.events.length < maxEvents) report.events.push(event)
    else report.dropped++
  }
  const session = value => createHash('sha256').update(value).digest('hex').slice(0, 16)
  function line(text) {
    const marker = /\bpw:protocol\s+(SEND ► |◀ RECV )/.exec(text)
    if (!marker) return
    const direction = marker[1].startsWith('SEND') ? 'send' : 'receive'
    const raw = text.slice(marker.index + marker[0].length).trim()
    let message
    try {
      message = JSON.parse(raw)
      if (message && typeof message === 'object' && raw.includes(' <<<<<( LOG TRUNCATED )>>>>> '))
        message.truncated = true
    } catch {
      // Playwright's capped screenshot response is deliberately not JSON.
      // Recover ONLY source-qualified top-level identity, never response data.
      const id = /^\{"id":([1-9]\d*),"(?:result|error)":\{/.exec(raw)
      const owner = /,"sessionId":"([A-Za-z0-9_-]{1,128})"\}$/.exec(raw)
      if (direction !== 'receive' || !raw.includes(' <<<<<( LOG TRUNCATED )>>>>> ') || !id || !owner) {
        report.malformed++; return
      }
      const failure = /^\{"id":[1-9]\d*,"error":\{/.test(raw)
      message = { id: Number(id[1]), sessionId: owner[1], truncated: true,
        [failure ? 'error' : 'result']: {} }
    }
    const targeted = direction === 'send' && ['Page.captureScreenshot', 'Page.getLayoutMetrics'].includes(message?.method)
    if (!message || !Number.isSafeInteger(message.id) || message.id <= 0 ||
        typeof message.sessionId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(message.sessionId)) {
      if (targeted) report.malformed++
      return
    }
    const key = `${message.sessionId}:${message.id}`
    if (direction === 'send') {
      if (pending.has(key)) { pending.get(key).ambiguous = true; report.malformed++; return }
      if (!targeted) return
      if (pending.size >= maxPending) { report.dropped++; return }
      const start = now(), owner = session(message.sessionId)
      pending.set(key, { start, method: message.method, session: owner, id: message.id })
      emit({ phase: 'sent', method: message.method, session: owner, id: message.id, observedMs: start })
    } else {
      const request = pending.get(key)
      if (!request) return
      // Reused pending identity has no unique request/response pairing.
      // Keep its bounded slot until finish records a censored observation.
      if (request.ambiguous) return
      if (!Object.hasOwn(message, 'result') && !Object.hasOwn(message, 'error')) {
        report.malformed++; return
      }
      pending.delete(key)
      const end = now()
      emit({ phase: message.error !== undefined ? 'error-response' : 'response',
        method: request.method, session: request.session, id: request.id, observedMs: end,
        intervalMs: request.start !== null && end !== null && end >= request.start ? end - request.start : null,
        truncated: !!message.truncated })
    }
  }
  return {
    push(chunk) {
      if (!enabled || closed) return
      if (typeof chunk !== 'string') throw new TypeError('Decode UTF-8 stream with StringDecoder before collection')
      // Bounded transient carry, including when a producer never emits newline.
      for (const char of chunk) {
        if (char === '\n') {
          if (!discarding) line(carry)
          carry = ''; discarding = false
        } else if (!discarding) {
          if (carry.length + char.length > maxLine) { carry = ''; discarding = true; report.overlongLines++ }
          else carry += char
        }
      }
    },
    finish() {
      if (!closed && enabled) {
        if (carry && !discarding) line(carry)
        for (const request of pending.values()) {
          report.unfinished++
          emit({ phase: 'censored', method: request.method, session: request.session, id: request.id,
            ...(request.ambiguous ? { ambiguous: true } : {}) })
        }
      }
      closed = true; carry = ''; pending.clear()
      return structuredClone(report)
    },
  }
}
