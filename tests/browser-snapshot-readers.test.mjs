import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { BufferAttribute, BufferGeometry, InstancedMesh, Matrix4 } from 'three'
import { readerContract, recognizeReaderSources } from '../scripts/browser-performance/snapshot-readers.mjs'

const sha256 = value => createHash('sha256').update(value).digest('hex')
const installed = [BufferGeometry.prototype.getAttribute, BufferGeometry.prototype.getIndex,
  InstancedMesh.prototype.getMatrixAt, BufferAttribute.prototype.getX, BufferAttribute.prototype.getY,
  BufferAttribute.prototype.getZ, BufferAttribute.prototype.getX, Matrix4.prototype.fromArray].map(method => method.toString())
const compact = [
  'getAttribute(p){return this.attributes[p];}',
  'getIndex(){return this.index;}',
  'getMatrixAt(p,q){return q.fromArray(this.instanceMatrix.array,p*16);}',
  'getX(p){let x=this.array[p*this.itemSize];if(this.normalized)x=H(x,this.array);return x;}',
  'getY(p){let y=this.array[p*this.itemSize+1];if(this.normalized)y=H(y,this.array);return y;}',
  'getZ(p){let z=this.array[p*this.itemSize+2];if(this.normalized)z=H(z,this.array);return z;}',
  'getX(p){let x=this.array[p*this.itemSize];if(this.normalized)x=H(x,this.array);return x;}',
  'fromArray(a,o=0){for(let i=0;i<16;i++){this.elements[i]=a[i+o];}return this;}',
]
function rejected(index, source) {
  const sources = [...compact]
  sources[index] = source
  assert.throws(() => recognizeReaderSources(sources), error =>
    error.code === 'ERR_ASSERTION' && error.message === 'Unsupported terrain reader source')
}
function mutations(index, changes) {
  for (const [before, after] of changes) {
    assert.ok(compact[index].includes(before), `Missing fixture fragment: ${before}`)
    rejected(index, compact[index].replace(before, after))
  }
}

test('actual installed Three 0.185.1 methods admit only a fixed, frozen eight-reader contract', () => {
  const packagePath = new URL('../node_modules/three/package.json', import.meta.url)
  assert.equal(JSON.parse(readFileSync(packagePath, 'utf8')).version, '0.185.1')
  const result = recognizeReaderSources(installed)
  assert.equal(result.version, 1)
  assert.equal(result.id, 'three-nonnormalized-terrain-readers-v1')
  assert.equal(result.semanticSha256, readerContract.semanticSha256)
  assert.equal(result.rawSha256, sha256(JSON.stringify(installed.slice(0, 7))))
  assert.equal(result.allSourcesSha256, sha256(JSON.stringify(installed)))
  assert.deepEqual(readerContract.names, ['geometry.getAttribute', 'geometry.getIndex', 'mesh.getMatrixAt',
    'position.getX', 'position.getY', 'position.getZ', 'index.getX', 'matrix.fromArray'])
  assert.ok(Object.isFrozen(readerContract) && Object.isFrozen(readerContract.names) && Object.isFrozen(result))
  assert.equal(recognizeReaderSources(compact).semanticSha256, result.semanticSha256)
})

test('representative binding-renamed minifier shapes preserve semantics, not raw identities', () => {
  // Representative positive fixtures do not establish the cause of any prior run.
  const renamed = [
    'getAttribute(e){return this.attributes[e]}',
    'getIndex(){return this.index}',
    'getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}',
    'getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Q(e,this.array)),e}',
    'getY(t){let e=this.array[t*this.itemSize+1];return this.normalized?R(e,this.array):e}',
    'getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=S(e,this.array)),e}',
    'getX(t){let e=this.array[t*this.itemSize];return this.normalized?T(e,this.array):e}',
    'fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}',
  ]
  const expected = recognizeReaderSources(installed), actual = recognizeReaderSources(renamed)
  assert.equal(actual.semanticSha256, expected.semanticSha256)
  assert.notEqual(actual.rawSha256, expected.rawSha256)
  assert.notEqual(actual.allSourcesSha256, expected.allSourcesSha256)
  const eighthOnly = [...installed]
  eighthOnly[7] = renamed[7]
  assert.equal(recognizeReaderSources(eighthOnly).rawSha256, expected.rawSha256)
  assert.notEqual(recognizeReaderSources(eighthOnly).allSourcesSha256, expected.allSourcesSha256)
  for (const index of [3, 4, 5, 6]) {
    const method = ['getX', 'getY', 'getZ', 'getX'][index - 3], offset = ['', '+1', '+2', ''][index - 3]
    for (const tail of ['if(this.normalized)$v=inactive($v,this.array);return $v;',
      'return this.normalized&&($v=inactive($v,this.array)),$v;',
      'return this.normalized?inactive($v,this.array):$v;']) {
      const sources = [...compact]
      sources[index] = `${method}(_p){let $v=this.array[_p*this.itemSize${offset}];${tail}}`
      assert.equal(recognizeReaderSources(sources).semanticSha256, expected.semanticSha256)
    }
  }
})

test('only local statement-ending semicolons and harmless ASCII whitespace may vary', () => {
  const sources = compact.map(source => source.replaceAll(';}', '}').replaceAll('{', '{\n\t').replaceAll('}', '\n}'))
  assert.equal(recognizeReaderSources(sources).semanticSha256, readerContract.semanticSha256)
  for (const index of [3, 4, 5, 6]) {
    rejected(index, compact[index].replace(';if', ' if'))
    rejected(index, compact[index].replace(';return', ' return'))
  }
  rejected(7, 'fromArray(a,o=0){for(let i=0;i<16;i++)this.elements[i]=a[i+o] return this}')
})

test('geometry and matrix-reader fields, argument order, operations and return values are exact', () => {
  mutations(0, [['getAttribute', 'getIndex'], ['this.attributes', 'this.other'], ['[p]', '[other]'],
    ['[p]', '[p+0]'], ['return this', 'return other'], ['return ', ''], ['this.attributes[p]', 'this.attributes.p']])
  mutations(1, [['this.index', 'this.indices'], ['this.index', 'index'], ['this.index', 'this.index()'],
    ['getIndex()', 'getIndex(p)'], ['return this.index', 'this.index=0;return this.index']])
  mutations(2, [['p,q', 'p,p'], ['q.fromArray', 'p.fromArray'], ['q.fromArray', 'q.set'],
    ['this.instanceMatrix.array', 'this.instanceMatrix.other'], ['this.instanceMatrix.array', 'this.other.array'],
    ['p*16', 'p*15'], ['p*16', '16*p'], ['p*16', 'p+16'], ['p*16', 'p*8+8'], ['p*16', 'other*16'],
    ['this.instanceMatrix.array,p*16', 'p*16,this.instanceMatrix.array'], ['p*16)', 'p*16,0)'],
    ['return q.fromArray', 'return other.fromArray'], ['return q.fromArray', 'q.fromArray'],
    ['return q.fromArray(this.instanceMatrix.array,p*16)', 'q.fromArray(this.instanceMatrix.array,p*16);return q']])
})

test('all four attribute readers reject every changed operation, active helper and binding collision', () => {
  for (const index of [3, 4, 5, 6]) {
    const local = ['x', 'y', 'z', 'x'][index - 3], coordinate = ['', '+1', '+2', ''][index - 3]
    mutations(index, [['let ', 'const '], ['let ', 'var '], ['this.array[', 'other.array['],
      ['this.array[', 'this.other['], ['p*this.itemSize', 'this.itemSize*p'], ['p*this.itemSize', 'p+this.itemSize'],
      ['p*this.itemSize', 'p*this.other'], ['p*this.itemSize', 'other*this.itemSize'],
      [`p*this.itemSize${coordinate}]`, `p*this.itemSize+3]`], ['if(this.normalized)', 'if(this.other)'],
      ['if(this.normalized)', 'if(p)'], ['if(this.normalized)', 'if(true)'],
      ['if(this.normalized)', 'if(!this.normalized)'], ['if(this.normalized)', 'if(this.normalized===false)'],
      ['if(this.normalized)', ''], [`H(${local},this.array)`, `H(this.array,${local})`],
      [`H(${local},this.array)`, `H(${local},this.other)`], [`H(${local},this.array)`, `H(${local},this.array,0)`],
      [`H(${local},this.array)`, `object.H(${local},this.array)`], [`H(${local},this.array)`, `p(${local},this.array)`],
      [`H(${local},this.array)`, `${local}(${local},this.array)`], [`H(${local},this.array)`, `eval(${local},this.array)`],
      [`${local}=H`, 'this.array=H'], [`return ${local};`, `return p;`], [`return ${local};`, `return H(${local},this.array);`],
      [`return ${local};`, `return ${local}+0;`], [`return ${local};`, `return ${local}++;`],
      [`return ${local};`, `other();return ${local};`], [`let ${local}=`, 'let p=']])
    rejected(index, compact[index].replace(`p*this.itemSize${coordinate}`, `p*this.itemSize${coordinate}+0`))
    for (const tail of [
      `return this.normalized||(${local}=H(${local},this.array)),${local};`,
      `return ${local},this.normalized&&(${local}=H(${local},this.array));`,
      `return other&&(${local}=H(${local},this.array)),${local};`,
      `return this.normalized&&H(${local},this.array),${local};`,
      `return this.normalized?${local}:H(${local},this.array);`,
      `return this.normalized?H(${local},this.array):other;`,
      `return this.normalized?H(${local},this.array):H(${local},this.array);`,
      `return this.normalized?(other(),H(${local},this.array)):${local};`,
    ]) rejected(index, compact[index].slice(0, compact[index].indexOf('if(')) + tail + '}')
  }
})

test('fromArray accepts only the one default parameter and the exact sixteen-write loop', () => {
  mutations(7, [['a,o=0', 'a=0,o=0'], ['a,o=0', 'a,o'], ['a,o=0', 'a,o=1'], ['a,o=0', 'a,o=null'],
    ['a,o=0', 'a,a=0'], ['a,o=0', 'a,o=0,extra'], ['let i=0', 'let a=0'], ['let i=0', 'let i=1'],
    ['let i=0', 'var i=0'], ['i<16', 'i<15'], ['i<16', 'i<17'], ['i<16', 'i<=16'], ['i<16', '16>i'],
    ['i++', '++i'], ['i++', 'i+=1'], ['i++', 'o++'], ['this.elements', 'this.array'], ['this.elements[i]', 'this.elements[o]'],
    ['a[i+o]', 'a[o+i]'], ['a[i+o]', 'a[i*o]'], ['a[i+o]', 'a[i]'], ['a[i+o]', 'other[i+o]'],
    ['=a[i+o]', '=H(a[i+o])'], ['return this', 'return a'], ['return this', 'return this.elements'],
    ['}return', '}other();return'], ['this.elements[i]=a[i+o];', 'this.elements[i]=a[i+o];this.other=0;']])
})

test('rejects extra members/statements and unsupported function syntax without executing text', () => {
  for (let index = 0; index < compact.length; index++) {
    const source = compact[index]
    for (const changed of [`async ${source}`, `*${source}`, `get ${source}`, `set ${source}`, `function ${source}`,
      `(${source})`, `{${source}}`, `${source},other(){return 0}`, `${source};`,
      source.replace('{', '{other();'), source.replace('{', '{"use strict";'),
      source.replace('{', '{globalThis.__readerSourceExecuted=true;'),
      source.replace('{', '{throw new Error();'), source.replace('return ', 'return other(),')]) rejected(index, changed)
  }
  for (const source of ['getIndex() { [native code] }', '()=>this.index', 'function(){return this.index}',
    'getIndex(...p){return this.index}', 'getIndex(p=0){return this.index}', 'getIndex(){return this["index"]}']) rejected(1, source)
  assert.equal(Object.hasOwn(globalThis, '__readerSourceExecuted'), false)
})

test('rejects reserved or colliding bindings, escapes, comments, and lexical ambiguity', () => {
  for (const name of ['this', 'return', 'let', 'class', 'await', 'yield', 'null', 'true', 'false', 'eval', 'arguments', 'static']) {
    rejected(0, `getAttribute(${name}){return this.attributes[${name}]}`)
    rejected(3, `getX(p){let ${name}=this.array[p*this.itemSize];if(this.normalized)${name}=H(${name},this.array);return ${name}}`)
    rejected(3, `getX(p){let x=this.array[p*this.itemSize];if(this.normalized)x=${name}(x,this.array);return x}`)
  }
  rejected(0, 'getAttribute(\\u0070){return this.attributes[\\u0070]}')
  rejected(0, 'getAttribute(é){return this.attributes[é]}')
  for (let index = 0; index < compact.length; index++) {
    for (const comment of ['/**/', '//comment\n', '<!--comment\n', '#!comment\n']) {
      rejected(index, comment + compact[index])
      rejected(index, compact[index].replace('{', '{' + comment))
    }
    for (const newline of ['\n', '\r', '\r\n', '\u2028', '\u2029']) rejected(index, compact[index].replace('return ', `return${newline}`))
    for (const character of ['\0', '\v', '\f', '\ufeff', '\u00a0', '`', '"', "'", '\\', '/', '@', '-', '!']) {
      rejected(index, compact[index] + character)
    }
  }
  rejected(7, compact[7].replace('i++', 'i\n++'))
  rejected(7, compact[7].replace('i++', 'i+ +'))
  rejected(3, compact[3].replace('let x', 'letx'))
})

test('bounds exact input inventory, source bytes, nesting, tokens, and full consumption', () => {
  for (const input of [null, {}, 'text', [], compact.slice(0, 7), [...compact, compact[0]], Array(8)]) {
    assert.throws(() => recognizeReaderSources(input), { code: 'ERR_ASSERTION', message: 'Unsupported terrain reader source' })
  }
  const extraProperty = [...compact]
  extraProperty.extra = true
  assert.throws(() => recognizeReaderSources(extraProperty), /Unsupported terrain reader source/)
  for (const invalid of [undefined, null, 42, {}, [], Object(compact[1]), () => compact[1], '', ' '.repeat(1024), 'a'.repeat(100000)]) rejected(1, invalid)
  const padded = compact.map(source => source + ' '.repeat(readerContract.maximumBodyBytes - Buffer.byteLength(source)))
  assert.equal(recognizeReaderSources(padded).semanticSha256, readerContract.semanticSha256)
  rejected(1, padded[1] + ' ')
  rejected(1, padded[1] + 'é')
  rejected(1, '{'.repeat(readerContract.maximumDepth + 1) + '}'.repeat(readerContract.maximumDepth + 1))
  rejected(1, ';'.repeat(readerContract.maximumTokens + 1))
  for (let index = 0; index < compact.length; index++) {
    for (const malformed of [compact[index].slice(0, -1), compact[index] + '}', compact[index] + compact[index],
      compact[index].replace('{', '['), compact[index].replace(')', ']')]) rejected(index, malformed)
  }
  const swapped = [...compact]
  ;[swapped[4], swapped[5]] = [swapped[5], swapped[4]]
  assert.throws(() => recognizeReaderSources(swapped), /Unsupported terrain reader source/)
  rejected(5, compact[4])
})

test('trusted recognizer imports without a local package tree or source-text execution facility', async () => {
  const source = readFileSync(new URL('../scripts/browser-performance/snapshot-readers.mjs', import.meta.url), 'utf8')
  // A data module cannot resolve bare packages or relative files. Built-in Node
  // imports remain available, as in the privileged no-install reporter path.
  const isolated = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  assert.deepEqual(isolated.recognizeReaderSources(compact), recognizeReaderSources(compact))
})

test('accessor source arrays reject without reading or recognizing different values than hashed', () => {
  const values = [...compact]; let called = false
  Object.defineProperty(values, 7, { enumerable: true, get() { called = true; return compact[7] } })
  assert.throws(() => recognizeReaderSources(values), /Unsupported terrain reader source/)
  assert.equal(called, false)
})
