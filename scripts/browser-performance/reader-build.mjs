// Trusted Node-only provenance. Never imported by the no-install reporter.
import assert from 'node:assert/strict'
import ts from 'typescript'
import { dragSourceProfiles } from './snapshot-drag-contract.mjs'
import { createHash } from 'node:crypto'
import { readdirSync, lstatSync, readlinkSync, realpathSync, openSync, readSync, closeSync, readFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { sha256 } from './protocol.mjs'
export const readerFixtureBinding = `import { Matrix4 as PndReaderMatrix4 } from 'three'\nObject.defineProperty(globalThis, '__pndReaderTypes', { value: Object.freeze({ Matrix4: PndReaderMatrix4 }), writable: false, configurable: false })\n`
export const readerImport = "import * as THREE from 'three'"
export function readerImportAdmission(source, read = path => readFileSync(resolve(source, path), 'utf8')) {
  try {
    const text = read('app/render-view.ts')
    assert.ok(typeof text === 'string' && Buffer.byteLength(text) <= 1024 * 1024)
    const ast = ts.createSourceFile('render-view.ts', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    assert.equal(ast.parseDiagnostics.length, 0)
    const imports = ast.statements.filter(node => ts.isImportDeclaration(node) && node.importClause?.namedBindings &&
      ts.isNamespaceImport(node.importClause.namedBindings) && node.importClause.namedBindings.name.text === 'THREE')
    assert.equal(imports.length, 1)
    const binding = imports[0].importClause.namedBindings
    assert.equal(imports[0].importClause.isTypeOnly, false)
    assert.ok(ts.isStringLiteral(imports[0].moduleSpecifier)); assert.equal(imports[0].moduleSpecifier.text, 'three')
    // No alternate lexical THREE binding can shadow the immutable imported one.
    const visit = node => {
      if ((ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node) || ts.isClassDeclaration(node) ||
        ts.isFunctionDeclaration(node) || ts.isImportClause(node) || ts.isImportSpecifier(node) || ts.isNamespaceImport(node)) &&
        node !== binding && node.name && ts.isIdentifier(node.name)) assert.notEqual(node.name.text, 'THREE')
      ts.forEachChild(node, visit)
    }
    visit(ast)
    const classes = ast.statements.filter(node => ts.isClassDeclaration(node) && node.name?.text === 'RenderView')
    assert.equal(classes.length, 1)
    const methods = classes[0].members.filter(node => ts.isMethodDeclaration(node) && node.name?.getText(ast) === 'collectPickCandidates')
    assert.equal(methods.length, 1); assert.ok(methods[0].body)
    // Bind the actual AST owner to an already-reviewed complete query-input
    // prefix, including new THREE.Matrix4() and getMatrixAt(instance, local).
    assert.ok(dragSourceProfiles.some(profile => {
      const spec = profile.slices.find(slice => slice.id === 'query-inputs')
      const start = methods[0].getStart(ast) - 2, end = text.indexOf(spec.end, start)
      return text.startsWith(spec.start, start) && end > start && end < methods[0].end && sha256(text.slice(start, end)) === spec.sha256
    }))
    return sha256(readerImport)
  } catch { return null }
}
// Preserve the legacy common-install contract. Declared pnpm sources also
// bind their real dependency graph and isolation policy, not only the old lock.
function regularSource(root, name) {
  const path = resolve(root, name)
  assert.ok(lstatSync(path).isFile(), 'Dependency source input must be a regular file')
  return readFileSync(path)
}
export function readerDependencyPolicy(root) {
  const manager = JSON.parse(regularSource(root, 'package.json')).packageManager ?? 'npm@11.9.0'
  assert.ok(['npm@11.9.0', 'pnpm@11.25.0'].includes(manager), 'Unsupported dependency source policy')
  return manager === 'pnpm@11.25.0' ? { packageManager: manager,
    pnpmLockSha256: sha256(regularSource(root, 'pnpm-lock.yaml')),
    workspaceSha256: sha256(regularSource(root, 'pnpm-workspace.yaml')) } : null
}
export function commonDependencyInputsEqual(base, head) {
  if (!['package.json', 'package-lock.json'].every(name => regularSource(base, name).equals(regularSource(head, name)))) return false
  if (!readerDependencyPolicy(base)) return true
  return ['pnpm-lock.yaml', 'pnpm-workspace.yaml'].every(name => regularSource(base, name).equals(regularSource(head, name)))
}
// Hash all installed dependency bytes, including the browser's actual Three
// build entry/core and the compiler's consumed tools, not just source references.
export function readerDependencyManifest(root) {
  const directory = realpathSync(resolve(root, 'node_modules')), entries = [], buffer = Buffer.alloc(64 * 1024)
  let bytes = 0
  const visit = folder => {
    for (const name of readdirSync(folder).sort()) {
      const path = resolve(folder, name), rel = relative(directory, path).replaceAll('\\', '/'), stat = lstatSync(path)
      assert.ok(entries.length < 100000 && bytes < 4 * 1024 ** 3, 'Dependency evidence exceeds bound')
      if (stat.isSymbolicLink()) {
        const target = readlinkSync(path), resolved = resolve(folder, target)
        assert.ok(resolved.startsWith(directory + '/') && realpathSync(path).startsWith(directory + '/'), 'External dependency link unsupported')
        entries.push([rel, 'link', target]); continue
      }
      if (stat.isDirectory()) { visit(path); continue }
      assert.ok(stat.isFile() && stat.size <= 256 * 1024 ** 2, 'Unsupported dependency file')
      const hash = createHash('sha256'), descriptor = openSync(path, 'r'); let size = 0
      try { for (;;) { const n = readSync(descriptor, buffer, 0, buffer.length, null); if (!n) break; hash.update(buffer.subarray(0, n)); size += n } }
      finally { closeSync(descriptor) }
      assert.equal(size, stat.size); bytes += size; entries.push([rel, 'file', size, hash.digest('hex')])
    }
  }
  visit(directory)
  const required = ['three/package.json', 'three/build/three.module.js', 'three/build/three.core.js',
    'three/src/core/BufferGeometry.js', 'three/src/core/BufferAttribute.js', 'three/src/objects/InstancedMesh.js', 'three/src/math/Matrix4.js', 'three/src/math/MathUtils.js']
  const byPath = new Map(entries.map(entry => [entry[0], entry]))
  // Inventory the physical store once; do not recursively duplicate package
  // aliases. Resolve every consumed logical path back to an inventoried regular
  // file and recheck its actual bytes, including the browser's build entries.
  const readerSources = required.map(logical => {
    const path = realpathSync(resolve(directory, logical))
    assert.ok(path.startsWith(directory + '/'), 'External reader dependency source unsupported')
    const physical = relative(directory, path).replaceAll('\\', '/'), entry = byPath.get(physical)
    assert.equal(entry?.[1], 'file', 'Reader dependency source missing')
    const actual = readFileSync(path)
    assert.equal(actual.length, entry[2]); assert.equal(sha256(actual), entry[3], 'Reader dependency changed during inventory')
    return [logical, physical, entry[2], entry[3]]
  })
  const three = JSON.parse(readFileSync(resolve(directory, readerSources[0][1])))
  assert.equal(three.version, '0.185.1', 'Reader contract requires reviewed Three version')
  const sourcePolicy = readerDependencyPolicy(root)
  if (sourcePolicy || readerSources.some(([logical, physical]) => logical !== physical)) {
    return { version: 2, sha256: sha256(JSON.stringify({ entries, readerSources, sourcePolicy })), files: entries.length, bytes,
      threeSha256: sha256(JSON.stringify(readerSources)), entries, readerSources, sourcePolicy }
  }
  // The legacy flat npm inventory and digests retain their exact schema.
  return { version: 1, sha256: sha256(JSON.stringify(entries)), files: entries.length, bytes,
    threeSha256: sha256(JSON.stringify(required.map(path => byPath.get(path)))), entries }
}
export function readerBundleManifest(dist) {
  const entries = []
  const visit = folder => {
    for (const name of readdirSync(folder).sort()) {
      const path = resolve(folder, name), stat = lstatSync(path), rel = relative(dist, path).replaceAll('\\', '/')
      if (stat.isSymbolicLink()) continue // Public asset links bind through exact source, not emitted JS.
      if (stat.isDirectory()) { visit(path); continue }
      assert.ok(stat.isFile() && entries.length < 1000 && stat.size <= 32 * 1024 ** 2)
      if (!name.endsWith('.map')) entries.push([rel, stat.size, sha256(readFileSync(path))])
    }
  }
  visit(dist); assert.ok(entries.some(([path]) => path.endsWith('.js')))
  return { sha256: sha256(JSON.stringify(entries)), entries }
}
export function readerSourceEvidence(root, admission) {
  return { profile: admission.status === 'admitted' ? admission.profile : null,
    slices: admission.status === 'admitted' ? admission.slices : [], importSha256: readerImportAdmission(root) }
}
export function readerBuildProvenance(root, dependencies, bundle, builderFiles) {
  return { dependenciesSha256: dependencies.sha256, threeSha256: dependencies.threeSha256,
    packageSha256: sha256(readFileSync(resolve(root, 'package.json'))), lockSha256: sha256(readFileSync(resolve(root, 'package-lock.json'))),
    builderSha256: sha256(JSON.stringify(builderFiles.map(file => [file, sha256(readFileSync(resolve(root, file)))]))), bundleSha256: bundle.sha256 }
}
