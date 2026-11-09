// Trusted, dependency-free recognition of eight fixed Three terrain-reader shapes.
// This never evaluates source text. Admission alone proves neither its provenance
// nor its live owner/callee: callers must separately prove prototype/data ownership,
// strict normalized === false, the imported Matrix4.fromArray callee, stable method
// references, source profiles, and dependency/build/session identities.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

const sha256 = value => createHash('sha256').update(value).digest('hex')
const names = Object.freeze(['geometry.getAttribute', 'geometry.getIndex', 'mesh.getMatrixAt',
  'position.getX', 'position.getY', 'position.getZ', 'index.getX', 'matrix.fromArray'])
const limits = Object.freeze({ maximumBodyBytes: 1024, maximumTokens: 192, maximumDepth: 8 })
const unsupported = () => assert.fail('Unsupported terrain reader source')
const reserved = new Set(('await break case catch class const continue debugger default delete do else enum export extends false ' +
  'finally for function if implements import in instanceof interface let new null package private protected public return ' +
  'static super switch this throw true try typeof var void while with yield eval arguments').split(' '))
const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/

// There is no general JavaScript parser or identifier normalization here. These
// ASCII tokens are the whole accepted alphabet; comments, strings, escapes, unknown
// operators and non-ASCII whitespace/identifiers fail before template matching.
function tokenize(source) {
  if (typeof source !== 'string' || source.length > limits.maximumBodyBytes ||
    Buffer.byteLength(source) > limits.maximumBodyBytes) unsupported()
  const tokens = [], stack = [], token = /[A-Za-z_$][A-Za-z0-9_$]*|[0-9]+|&&|\+\+|[{}()[\].,;=*+<?:]/y
  const closing = { ')': '(', ']': '[', '}': '{' }
  let cursor = 0, lineBreak = false
  while (cursor < source.length) {
    const character = source[cursor]
    if (' \t\r\n'.includes(character)) {
      lineBreak ||= character === '\r' || character === '\n'
      cursor++
      continue
    }
    token.lastIndex = cursor
    const match = token.exec(source)
    if (!match) unsupported()
    const value = match[0]
    // Discarding whitespace must not turn return-newline into a value return, or
    // turn an invalid newline-separated increment into the approved postfix form.
    if (lineBreak && (tokens.at(-1) === 'return' || value === '++')) unsupported()
    if ('([{'.includes(value)) {
      stack.push(value)
      if (stack.length > limits.maximumDepth) unsupported()
    } else if (Object.hasOwn(closing, value) && stack.pop() !== closing[value]) unsupported()
    tokens.push(value)
    if (tokens.length > limits.maximumTokens) unsupported()
    cursor = token.lastIndex
    lineBreak = false
  }
  if (stack.length) unsupported()
  return tokens
}

const attribute = (method, offset) => {
  const declaration = `${method}($parameter){let $local=this.array[$parameter*this.itemSize${offset}];`
  return [
    `${declaration}if(this.normalized)$local=$helper($local,this.array);return $local;}`,
    `${declaration}return this.normalized&&($local=$helper($local,this.array)),$local;}`,
    `${declaration}return this.normalized?$helper($local,this.array):$local;}`,
  ]
}
const matrixLoop = 'for(let $index=0;$index<16;$index++)'
const matrixAssignment = 'this.elements[$index]=$array[$index+$offset];'
const shapes = [
  ['getAttribute($parameter){return this.attributes[$parameter];}'],
  ['getIndex(){return this.index;}'],
  ['getMatrixAt($parameter,$matrix){return $matrix.fromArray(this.instanceMatrix.array,$parameter*16);}'],
  attribute('getX', ''), attribute('getY', '+1'), attribute('getZ', '+2'), attribute('getX', ''),
  [`fromArray($array,$offset=0){${matrixLoop}{${matrixAssignment}}return this;}`,
    `fromArray($array,$offset=0){${matrixLoop}${matrixAssignment}return this;}`],
]
const templates = shapes.map(variants => variants.map(tokenize))

// A fixed semantic fingerprint, not a digest of binding names. Both raw hashes
// remain available so admitted implementation differences cannot be hidden.
export const readerContract = Object.freeze({ version: 1, id: 'three-nonnormalized-terrain-readers-v1', names, ...limits,
  semanticSha256: sha256(JSON.stringify({ version: 1, names, canonicalSources: shapes.map(variants => variants[0]) })) })

function matches(tokens, template, helperPositions = null) {
  const bindings = new Map(), used = new Set()
  let cursor = 0
  for (let index = 0; index < template.length; index++) {
    const expected = template[index], actual = tokens[cursor]
    // Only a statement's final semicolon directly before a closing brace may be
    // omitted. In particular, declarations and unbraced loop bodies keep theirs.
    if (expected === ';' && template[index + 1] === '}' && actual === '}') continue
    if (expected.startsWith('$')) {
      if (!identifier.test(actual ?? '') || reserved.has(actual)) return false
      if (!bindings.has(expected)) {
        // Includes the inactive free helper: it must not resolve to a parameter
        // or local binding, and no two declared bindings may alias each other.
        if (used.has(actual)) return false
        bindings.set(expected, actual)
        used.add(actual)
      } else if (bindings.get(expected) !== actual) return false
      if (expected === '$helper') helperPositions?.push(cursor)
    } else if (actual !== expected) return false
    cursor++
  }
  return cursor === tokens.length
}

// A narrower proof than semantic equivalence: preserve all tokens, including
// branch spelling and local bindings, except the inactive free helper identifier.
// Never use this without strict own-data normalized === false and live reader,
// import/callee, provenance, session and original geometry proof validation.
export function inactiveHelperReaderSha256(sources) {
  recognizeReaderSources(sources)
  const projected = sources.map((source, index) => {
    const tokens = tokenize(source)
    for (const template of templates[index]) {
      const positions = []
      if (!matches(tokens, template, positions)) continue
      for (const position of positions) tokens[position] = '$inactiveNormalizationHelper'
      return tokens
    }
    unsupported()
  })
  return sha256(JSON.stringify(projected))
}

export function recognizeReaderSources(sources) {
  if (!Array.isArray(sources) || sources.length !== names.length ||
    Object.keys(sources).join(',') !== '0,1,2,3,4,5,6,7') unsupported()
  // Snapshot only own primitive data values: recognize exactly what we hash.
  sources = names.map((_, index) => {
    const descriptor = Object.getOwnPropertyDescriptor(sources, String(index))
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || typeof descriptor.value !== 'string') unsupported()
    return descriptor.value
  })
  for (let index = 0; index < sources.length; index++) {
    const tokens = tokenize(sources[index])
    if (!templates[index].some(template => matches(tokens, template))) unsupported()
  }
  return Object.freeze({ version: readerContract.version, id: readerContract.id,
    semanticSha256: readerContract.semanticSha256, rawSha256: sha256(JSON.stringify(sources.slice(0, 7))),
    allSourcesSha256: sha256(JSON.stringify(sources)) })
}
