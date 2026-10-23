import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

export const repository = 'JohnDeved/populous-new-dawn'
export const workflowPath = '.github/workflows/native-ui-evidence.yml'
export const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex')
export const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
export function fullSha(value) {
  assert.match(value ?? '', /^[a-f0-9]{40}$/, 'An exact full Git SHA is required')
  return value
}
export function manualIdentity(env) {
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch', 'Manual source mode is unavailable in PR runs')
  assert.equal(env.GITHUB_REPOSITORY, repository)
  assert.equal(env.GITHUB_REF, 'refs/heads/main', 'Only reviewed default-branch infrastructure may run')
  assert.equal(env.GITHUB_WORKFLOW_REF, `${repository}/${workflowPath}@refs/heads/main`)
  const workflowSha = fullSha(env.GITHUB_WORKFLOW_SHA)
  const eventSha = fullSha(env.GITHUB_SHA)
  assert.equal(eventSha, workflowSha, 'This main-only dispatch must identify the executing workflow revision')
  return { candidateSha: fullSha(env.PND_UI_CANDIDATE_SHA), workflowSha, eventSha,
    workflowRef: env.GITHUB_WORKFLOW_REF, event: env.GITHUB_EVENT_NAME,
    runId: env.GITHUB_RUN_ID ?? null, runAttempt: env.GITHUB_RUN_ATTEMPT ?? null }
}
export function separateRoots(candidate, infrastructure) {
  for (const root of [candidate, infrastructure]) assert.ok(isAbsolute(root), 'Explicit absolute roots required')
  const roots = [realpathSync(candidate), realpathSync(infrastructure)]
  assert.deepEqual(roots, [candidate, infrastructure], 'Root aliases are not permitted')
  for (const [a, b] of [roots, [...roots].reverse()]) {
    const rel = relative(a, b)
    assert.ok(rel.startsWith(`..${sep}`) || rel === '..', 'Candidate and infrastructure roots must be disjoint')
  }
  return { candidateRoot: roots[0], infrastructureRoot: roots[1] }
}
export function sourceManifest(root, expectedSha, selected) {
  assert.equal(git(root, 'rev-parse', 'HEAD'), fullSha(expectedSha))
  assert.equal(git(root, 'diff', '--name-only', 'HEAD', '--'), '', 'Tracked source must be clean')
  const entries = git(root, 'ls-tree', '-rz', 'HEAD').split('\0').filter(Boolean).map(record => {
    const [metadata, name] = record.split('\t'), [mode, type, blob] = metadata.split(' ')
    return { name, mode, type, blob }
  }).filter(({ name }) => !selected || selected(name))
  assert.ok(entries.length)
  const files = Object.fromEntries(entries.map(({ name, mode, type, blob }) => {
    const file = resolve(root, name), stat = lstatSync(file)
    assert.ok(stat.isFile() && !stat.isSymbolicLink(), `Regular tracked input required: ${name}`)
    assert.equal(type, 'blob'); assert.equal(realpathSync(file), file, `Input alias: ${name}`)
    const bytes = readFileSync(file)
    assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), blob, `Git bytes differ: ${name}`)
    return [name, { blob, mode, fileMode: stat.mode, bytes: stat.size, sha256: createHash('sha256').update(bytes).digest('hex') }]
  }))
  return { commit: expectedSha, tree: git(root, 'rev-parse', 'HEAD^{tree}'), files }
}
export function verifyManifest(root, manifest) {
  assert.deepEqual(sourceManifest(root, manifest.commit, name => Object.hasOwn(manifest.files, name)), manifest)
}
export const infrastructureInput = name => name.startsWith('scripts/native-ui-evidence/') ||
  name === 'scripts/browser-options-audio.mjs' || name === 'scripts/tutorial-browser/browser-config.mjs' || name === 'scripts/orchestration/dependency-profile.mjs' || name === workflowPath
export function candidateDependency(root, name) {
  const entry = createRequire(resolve(root, 'package.json')).resolve(name)
  const canonical = realpathSync(entry)
  assert.ok(canonical.startsWith(realpathSync(resolve(root, 'node_modules')) + sep), 'Dependency escaped candidate install')
  return pathToFileURL(canonical).href
}
export async function candidateDependencyExport(root, name, exportName) {
  const namespace = await import(candidateDependency(root, name))
  const named = namespace[exportName], commonJs = namespace.default?.[exportName]
  assert.ok(named !== undefined || commonJs !== undefined, `Missing candidate dependency export: ${name}.${exportName}`)
  if (named !== undefined && commonJs !== undefined) {
    assert.equal(named, commonJs, `Ambiguous candidate dependency export: ${name}.${exportName}`)
  }
  const value = named !== undefined ? named : commonJs
  assert.ok(value !== null && ['object', 'function'].includes(typeof value), `Invalid candidate dependency export: ${name}.${exportName}`)
  return value
}
export function homeBuildOptions(candidateRoot, output, revision, plugins) {
  fullSha(revision)
  const fixture = resolve(candidateRoot, 'scripts/tutorial-browser/fixture')
  const main = readFileSync(resolve(fixture, 'main.tsx'), 'utf8')
  assert.match(main, /import Home from ['"]\.\.\/\.\.\/\.\.\/app\/page['"]/)
  assert.match(main, /import ['"]\.\.\/\.\.\/\.\.\/app\/globals\.css['"]/)
  assert.equal(realpathSync(resolve(fixture, '../../../app')), resolve(candidateRoot, 'app'))
  return { configFile: false, mode: 'production', root: fixture, publicDir: false,
    define: { __PND_BUILD_REVISION__: JSON.stringify(revision) },
    resolve: { dedupe: ['react', 'react-dom', 'three'] }, plugins: [plugins.react()],
    css: { postcss: { plugins: [plugins.tailwindcss({ base: candidateRoot })] } },
    build: { outDir: output, emptyOutDir: false, copyPublicDir: false, sourcemap: true, reportCompressedSize: false } }
}
