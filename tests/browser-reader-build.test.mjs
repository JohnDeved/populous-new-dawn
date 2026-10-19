import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { readerImportAdmission, readerImport, readerBundleManifest, readerDependencyManifest, readerFixtureBinding } from '../scripts/browser-performance/reader-build.mjs'
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
