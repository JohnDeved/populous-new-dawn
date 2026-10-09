// Internal JSON grammar reader for oversized discovery inputs. It never attests
// an owned receipt: only the caller may decide what the seven retained values mean.
const FIELDS = new Set(['kind', 'status', 'parityMeasurements', 'identity', 'verification', 'command', 'source'])
const LIMITS = Object.freeze({ chunkBytes: 64 * 1024, metadataBytes: 4 * 1024 * 1024,
  totalMetadataBytes: 16 * 1024 * 1024, depth: 128, tokens: 8000000, totalTokens: 16000000,
  keyBytes: 16 * 1024, keys: 4096, numberBytes: 128, fileMs: 30000, totalMs: 120000 })

export class MetadataError extends Error {
  constructor(message, fatal = false) { super(message); this.fatal = fatal }
}

export function createMetadataBudget(reductions = {}, now = () => performance.now()) {
  const limits = { ...LIMITS }
  for (const [key, value] of Object.entries(reductions)) {
    if (!Object.hasOwn(LIMITS, key) || !Number.isSafeInteger(value) || value < 0 || value > LIMITS[key])
      throw new RangeError('Streaming discovery limits may only be reduced')
    limits[key] = value
  }
  if (limits.chunkBytes === 0) throw new RangeError('Streaming chunk size must be positive')
  return { limits, now, started: now(), tokens: 0, metadataBytes: 0 }
}

export function checkMetadataTime(budget, fileStarted) {
  const elapsed = budget.now()
  if (elapsed - budget.started >= budget.limits.totalMs)
    throw new MetadataError('Receipt discovery time limit reached; no partial report written', true)
  if (fileStarted !== undefined && elapsed - fileStarted >= budget.limits.fileMs)
    throw new MetadataError('streaming file time limit reached')
}

const whitespace = c => c === ' ' || c === '\n' || c === '\r' || c === '\t'
const numeric = c => c >= '0' && c <= '9' || c === '-' || c === '+' || c === '.' || c === 'e' || c === 'E'
const numberPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/

export class MetadataParser {
  constructor(budget) {
    this.budget = budget
    this.started = budget.now()
    this.stack = []
    this.root = 'value'
    this.value = {}
    this.keys = new Set()
    this.tokens = 0
    this.metadataBytes = 0
  }

  invalid() { throw new MetadataError('invalid JSON') }

  token() {
    if (++this.budget.tokens > this.budget.limits.totalTokens)
      throw new MetadataError('Receipt JSON token limit reached; no partial report written', true)
    if (++this.tokens > this.budget.limits.tokens) throw new MetadataError('streaming token limit reached')
  }

  charge(bytes) {
    this.budget.metadataBytes += bytes
    if (this.budget.metadataBytes > this.budget.limits.totalMetadataBytes)
      throw new MetadataError('Receipt metadata limit reached; no partial report written', true)
    this.metadataBytes += bytes
    if (this.metadataBytes > this.budget.limits.metadataBytes) throw new MetadataError('streaming metadata limit reached')
  }

  append(capture, start, end) {
    const part = this.text.slice(start, end)
    this.charge(Buffer.byteLength(part))
    capture.parts.push(part)
  }

  complete(end) {
    const parent = this.stack.at(-1)
    if (this.capture && parent?.root && parent.state === 'value') {
      this.append(this.capture, this.captureStart, end)
      this.value[parent.key] = JSON.parse(this.capture.parts.join(''))
      this.capture = null
    }
    if (parent) parent.state = 'commaOrEnd'
    else this.root = 'done'
  }

  finishNumber(end) {
    if (!numberPattern.test(this.current.raw)) this.invalid()
    this.current = null
    this.complete(end)
  }

  startValue(c, position) {
    const parent = this.stack.at(-1)
    if (parent?.root && FIELDS.has(parent.key)) {
      this.capture = { parts: [] }
      this.captureStart = position
    }
    this.token()
    if (c === '{' || c === '[') {
      if (this.stack.length >= this.budget.limits.depth) throw new MetadataError('streaming depth limit reached')
      this.stack.push({ kind: c, state: c === '{' ? 'keyOrEnd' : 'valueOrEnd',
        root: c === '{' && this.stack.length === 0 })
    } else if (c === '"') this.current = { kind: 'string', key: false, escape: false, hex: 0 }
    else if (c === '-' || c >= '0' && c <= '9') this.current = { kind: 'number', raw: c }
    else if (c === 't' || c === 'f' || c === 'n')
      this.current = { kind: 'literal', word: c === 't' ? 'true' : c === 'f' ? 'false' : 'null', at: 1,
        rootNull: c === 'n' && this.stack.length === 0 }
    else this.invalid()
    if (this.current?.kind === 'number' && this.budget.limits.numberBytes === 0)
      throw new MetadataError('streaming number limit reached')
  }

  close(c, position) {
    const frame = this.stack.at(-1)
    if (!frame || c !== (frame.kind === '{' ? '}' : ']')) this.invalid()
    this.token()
    this.stack.pop()
    this.complete(position + 1)
  }

  write(text) {
    this.text = text
    this.captureStart = 0
    this.keyStart = 0
    checkMetadataTime(this.budget, this.started)
    for (let i = 0; i < text.length; i++) {
      if ((i & 1023) === 0) checkMetadataTime(this.budget, this.started)
      const c = text[i], current = this.current
      if (current?.kind === 'number') {
        if (numeric(c)) {
          if (current.raw.length >= this.budget.limits.numberBytes) throw new MetadataError('streaming number limit reached')
          current.raw += c
          continue
        }
        this.finishNumber(i)
        i--
        continue
      }
      if (current?.kind === 'literal') {
        if (c !== current.word[current.at++]) this.invalid()
        if (current.at === current.word.length) {
          // The former full reader's null root cannot safely reach value.kind.
          if (current.rootNull) this.invalid()
          this.current = null
          this.complete(i + 1)
        }
        continue
      }
      if (current?.kind === 'string') {
        if (current.hex) {
          if (!/[0-9a-fA-F]/.test(c)) this.invalid()
          current.hex--
        } else if (current.escape) {
          if (c === 'u') current.hex = 4
          else if (!'"\\/bfnrt'.includes(c)) this.invalid()
          current.escape = false
        } else if (c === '\\') current.escape = true
        else if (c === '"') {
          this.current = null
          if (current.key) {
            const frame = this.stack.at(-1)
            if (frame.root) {
              this.append(this.keyCapture, this.keyStart, i + 1)
              const key = JSON.parse(this.keyCapture.parts.join('')), bytes = Buffer.byteLength(key)
              if (bytes > this.budget.limits.keyBytes) throw new MetadataError('streaming key limit reached')
              this.charge(bytes)
              if (this.keys.has(key)) throw new MetadataError('duplicate top-level JSON key')
              if (this.keys.size >= this.budget.limits.keys) throw new MetadataError('streaming key count limit reached')
              this.keys.add(key)
              frame.key = key
              this.keyCapture = null
            }
            frame.state = 'colon'
          } else this.complete(i + 1)
        } else if (c.charCodeAt(0) < 32) this.invalid()
        continue
      }
      if (whitespace(c)) continue
      const frame = this.stack.at(-1)
      if (!frame) {
        if (this.root !== 'value') this.invalid()
        this.startValue(c, i)
      } else if (frame.state === 'keyOrEnd' || frame.state === 'key') {
        if (c === '}' && frame.state === 'keyOrEnd') this.close(c, i)
        else {
          if (c !== '"') this.invalid()
          this.token()
          this.current = { kind: 'string', key: true, escape: false, hex: 0 }
          if (frame.root) { this.keyCapture = { parts: [] }; this.keyStart = i }
        }
      } else if (frame.state === 'colon') {
        if (c !== ':') this.invalid()
        this.token()
        frame.state = 'value'
      } else if (frame.state === 'commaOrEnd') {
        if (c === ',') { this.token(); frame.state = frame.kind === '{' ? 'key' : 'value' }
        else this.close(c, i)
      } else if (frame.state === 'valueOrEnd' && c === ']') this.close(c, i)
      else this.startValue(c, i)
    }
    if (this.capture) this.append(this.capture, this.captureStart, text.length)
    if (this.keyCapture) this.append(this.keyCapture, this.keyStart, text.length)
    this.text = ''
  }

  finish() {
    if (this.current?.kind === 'number') this.finishNumber(0)
    if (this.current || this.stack.length || this.root !== 'done') this.invalid()
    checkMetadataTime(this.budget, this.started)
    return this.value
  }
}
