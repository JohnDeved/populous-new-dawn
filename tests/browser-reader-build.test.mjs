import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, rmSync, renameSync, unlinkSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { readerImportAdmission, readerImport, readerBundleManifest, readerDependencyManifest, readerFixtureBinding, readerDependencyPolicy, commonDependencyInputsEqual } from '../scripts/browser-performance/reader-build.mjs'
import { readerImportSha256 } from '../scripts/browser-performance/snapshot-reader-proof.mjs'
const source = readFileSync(new URL('../app/render-view.ts', import.meta.url), 'utf8')
test('reader binding is a real top-level immutable Three import with reviewed AST query owner, never comment text', () => {
  assert.equal(readerImportAdmission('', () => source), readerImportSha256)
  for (const code of [source.replace(readerImport, `/*\n${readerImport}\n*/\nimport * as THREE from './fake-three'`),
    source.replace(readerImport, `import type * as THREE from 'three'`), source.replace(readerImport, `${readerImport}\nconst THREE = substitute`),
    source.replace('export class RenderView {', 'function wrapper(THREE: unknown) { class RenderView {') + '\n}',
    source.replace('const local = new THREE.Matrix4()', 'const local = new FakeMatrix4()'),
    source.replace('private collectPickCandidates(', 'private otherPickCandidates(')])
    assert.equal(readerImportAdmission('', () => code), null)
  assert.match(readerFixtureBinding, /import \{ Matrix4 as PndReaderMatrix4 \} from 'three'/)
  assert.match(readerFixtureBinding, /writable: false, configurable: false/)
})
test('emitted bundle manifest is byte-bound, bounded and excludes separately source-bound public symlinks', () => {
  const directory = mkdtempSync(join(tmpdir(), 'reader-build-'))
  try {
    mkdirSync(join(directory, 'assets')); writeFileSync(join(directory, 'assets/main.js'), 'const a=1')
    writeFileSync(join(directory, 'index.html'), '<html>'); writeFileSync(join(directory, 'assets/main.js.map'), 'not runtime')
    symlinkSync(join(directory, 'index.html'), join(directory, 'public-copy'))
    const one = readerBundleManifest(directory)
    assert.equal(one.entries.length, 2)
    writeFileSync(join(directory, 'assets/main.js'), 'const a=2')
    assert.notEqual(readerBundleManifest(directory).sha256, one.sha256)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
test('dependency manifest binds consumed Three builds and installed tool bytes, rejecting external links', () => {
  const root = mkdtempSync(join(tmpdir(), 'reader-deps-')), deps = resolve(root, 'node_modules')
  try {
    writeFileSync(resolve(root, 'package.json'), '{}')
    for (const file of ['three/package.json', 'three/build/three.module.js', 'three/build/three.core.js', 'three/src/core/BufferGeometry.js',
      'three/src/core/BufferAttribute.js', 'three/src/objects/InstancedMesh.js', 'three/src/math/Matrix4.js', 'three/src/math/MathUtils.js', 'typescript/lib/typescript.js']) {
      mkdirSync(resolve(deps, file, '..'), { recursive: true }); writeFileSync(resolve(deps, file), file.endsWith('package.json') ? '{"version":"0.185.1"}' : file)
    }
    const before = readerDependencyManifest(root)
    writeFileSync(resolve(deps, 'three/build/three.core.js'), 'altered actual consumed dependency')
    const after = readerDependencyManifest(root)
    assert.notEqual(before.sha256, after.sha256); assert.notEqual(before.threeSha256, after.threeSha256)
    symlinkSync('/tmp', resolve(deps, 'external'))
    assert.throws(() => readerDependencyManifest(root), /External dependency link/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

const requiredReaderFiles = ['package.json', 'build/three.module.js', 'build/three.core.js', 'src/core/BufferGeometry.js',
  'src/core/BufferAttribute.js', 'src/objects/InstancedMesh.js', 'src/math/Matrix4.js', 'src/math/MathUtils.js']
function dependencyFixture(root, pnpm = false) {
  writeFileSync(resolve(root, 'package.json'), JSON.stringify(pnpm ? { packageManager: 'pnpm@11.25.0' } : {}))
  writeFileSync(resolve(root, 'package-lock.json'), 'historical exact npm lock')
  if (pnpm) {
    writeFileSync(resolve(root, 'pnpm-lock.yaml'), 'exact pnpm lock')
    writeFileSync(resolve(root, 'pnpm-workspace.yaml'), 'exact isolated workspace')
  }
  const modules = resolve(root, 'node_modules'), three = resolve(modules, pnpm ? '.pnpm/three@0.185.1/node_modules/three' : 'three')
  for (const file of requiredReaderFiles) {
    mkdirSync(resolve(three, file, '..'), { recursive: true })
    writeFileSync(resolve(three, file), file === 'package.json' ? '{"version":"0.185.1"}' : file)
  }
  mkdirSync(resolve(modules, 'typescript/lib'), { recursive: true })
  writeFileSync(resolve(modules, 'typescript/lib/typescript.js'), 'consumed compiler')
  if (pnpm) symlinkSync('.pnpm/three@0.185.1/node_modules/three', resolve(modules, 'three'))
  return { modules, three }
}

test('pnpm reader inventory preserves physical bytes once and binds each actual consumed alias target', () => {
  const root = mkdtempSync(join(tmpdir(), 'reader-pnpm-'))
  try {
    const { modules, three } = dependencyFixture(root, true), before = readerDependencyManifest(root)
    assert.equal(before.version, 2); assert.equal(before.readerSources.length, 8)
    assert.deepEqual(before.sourcePolicy, readerDependencyPolicy(root))
    assert.ok(before.entries.some(entry => entry[0] === 'three' && entry[1] === 'link'))
    assert.equal(before.entries.filter(entry => entry[1] === 'file').length, 9)
    for (const [logical, physical, size, digest] of before.readerSources) {
      assert.equal(physical, `.pnpm/three@0.185.1/node_modules/${logical}`)
      assert.deepEqual(before.entries.find(entry => entry[0] === physical), [physical, 'file', size, digest])
    }
    writeFileSync(resolve(three, 'src/math/Matrix4.js'), 'changed actual callee')
    const changed = readerDependencyManifest(root)
    assert.notEqual(changed.sha256, before.sha256); assert.notEqual(changed.threeSha256, before.threeSha256)
    writeFileSync(resolve(modules, 'typescript/lib/typescript.js'), 'changed compiler')
    const compiler = readerDependencyManifest(root)
    assert.notEqual(compiler.sha256, changed.sha256); assert.equal(compiler.threeSha256, changed.threeSha256)
    writeFileSync(resolve(root, 'pnpm-lock.yaml'), 'changed real dependency graph')
    const policy = readerDependencyManifest(root)
    assert.notEqual(policy.sha256, compiler.sha256); assert.equal(policy.threeSha256, compiler.threeSha256)
    // Same files at a different contained target are a different callee binding.
    renameSync(three, resolve(three, '..', 'alternate-three'))
    unlinkSync(resolve(modules, 'three')); symlinkSync('.pnpm/three@0.185.1/node_modules/alternate-three', resolve(modules, 'three'))
    assert.notEqual(readerDependencyManifest(root).threeSha256, policy.threeSha256)
    unlinkSync(resolve(modules, 'three')); symlinkSync('/tmp', resolve(modules, 'three'))
    assert.throws(() => readerDependencyManifest(root), /External dependency link/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('common dependency admission retains legacy equality and also requires real pnpm lock and workspace bytes', () => {
  for (const pnpm of [false, true]) {
    const root = mkdtempSync(join(tmpdir(), 'common-reader-deps-')), base = resolve(root, 'base'), head = resolve(root, 'head')
    try {
      mkdirSync(base); mkdirSync(head); dependencyFixture(base, pnpm); dependencyFixture(head, pnpm)
      assert.equal(commonDependencyInputsEqual(base, head), true)
      for (const name of ['package.json', 'package-lock.json', ...(pnpm ? ['pnpm-lock.yaml', 'pnpm-workspace.yaml'] : [])]) {
        const original = readFileSync(resolve(head, name)); writeFileSync(resolve(head, name), Buffer.concat([original, Buffer.from('\n')]))
        assert.equal(commonDependencyInputsEqual(base, head), false, name); writeFileSync(resolve(head, name), original)
      }
      if (pnpm) {
        unlinkSync(resolve(head, 'pnpm-lock.yaml')); symlinkSync(resolve(base, 'pnpm-lock.yaml'), resolve(head, 'pnpm-lock.yaml'))
        assert.throws(() => commonDependencyInputsEqual(base, head), /regular file/)
      } else {
        assert.equal(readerDependencyManifest(base).version, 1)
        assert.equal(readerDependencyPolicy(base), null)
        writeFileSync(resolve(head, 'pnpm-lock.yaml'), 'undeclared historical file does not change npm policy')
        assert.equal(commonDependencyInputsEqual(base, head), true)
      }
    } finally { rmSync(root, { recursive: true, force: true }) }
  }
})

test('both trusted comparator runners use the strengthened common-input guard and bind pnpm policy in environment', () => {
  for (const name of ['run.mjs', 'run-live.mjs']) {
    const code = readFileSync(new URL(`../scripts/browser-performance/${name}`, import.meta.url), 'utf8')
    assert.match(code, /if \(!commonDependencyInputsEqual\(base, head\)\)/)
    assert.match(code, /const dependencyPolicy = readerDependencyPolicy\(root\)/)
    assert.match(code, /dependencyPolicy \? \{ dependencyPolicy \} : \{\}/)
    assert.match(code, /report.status = 'incompatible-dependencies'/)
  }
})
