// Hosted setup only; imports of this entry point are not dry tests.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, realpathSync, lstatSync } from 'node:fs'
import { resolve, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { candidateBrowserBinding } from './candidate-browser.mjs'
import { hostedAdmission } from './admission.mjs'
import { APP, URL, admitDeployment } from './policy.mjs'
import { separateRoots, sourceManifest, sha256 } from '../native-ui-evidence/identity.mjs'
import { directoryManifest } from '../native-ui-evidence/files.mjs'
import { dependencyReceipt } from '../orchestration/dependency-profile.mjs'
const identity = hostedAdmission(process.env)
assert.equal(process.env.PND_HUD_CHROME_VERSION, 'Google Chrome 156.0.8078.79', 'Unreviewed Chrome toolkit resource policy')
const here = dirname(fileURLToPath(import.meta.url))
const { candidateRoot, infrastructureRoot } = separateRoots(resolve(process.argv[2]), resolve(here, '../..'))
const output = resolve(process.argv[3])
assert.equal(output, resolve(process.env.GITHUB_WORKSPACE, 'outputs/hud-preference-ssr'))
assert.equal(lstatSync(output, { throwIfNoEntry: false }), undefined, 'Fresh hosted output required')
mkdirSync(dirname(output), { recursive: true })
assert.equal(realpathSync(dirname(output)), dirname(output), 'Output parent alias')
for (const root of [candidateRoot, infrastructureRoot]) assert.ok(!output.startsWith(root + sep))
mkdirSync(output)
const save = (name, value) => writeFileSync(resolve(output, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
try {
  const candidate = sourceManifest(candidateRoot, APP)
  assert.equal(candidate.tree, '62baccd2e89cd3c1480ed749a8a3ff33571b4521')
  const selected = name => name.startsWith('scripts/hud-preference-ssr-evidence/') || [
    '.github/workflows/native-ui-evidence.yml', 'scripts/native-ui-evidence/identity.mjs',
    'scripts/native-ui-evidence/files.mjs', 'scripts/orchestration/dependency-profile.mjs',
  ].includes(name)
  const infrastructure = sourceManifest(infrastructureRoot, identity.workflowSha, selected)
  save('candidate-source.json', candidate); save('infrastructure-source.json', infrastructure)
  const dependencies = directoryManifest(resolve(candidateRoot, 'node_modules'))
  save('dependencies.json', dependencies)
  save('dependency-profile.json', dependencyReceipt(candidateRoot))
  const deploymentPath = resolve(here, 'deployment.json')
  assert.equal(sha256(deploymentPath), '96f196ba3ae31fdb8e93f9e735a634190b862be3da10392a400827cab6e75fe8')
  const deployment = JSON.parse(readFileSync(deploymentPath, 'utf8')); admitDeployment(deployment)
  save('deployment.json', deployment)
  const { playwrightEntry, tooling } = candidateBrowserBinding(candidateRoot)
  const binding = { version: 1, identity, application: APP, tree: candidate.tree, url: URL,
    sourceRoot: candidateRoot, infrastructureRoot, resultPath: deploymentPath,
    resultSha256: sha256(deploymentPath), publicationRun: '42236818036', publicationArtifact: '13512091913',
    publicationResultZipSha256: '297916a546f6a4ed18c40da05336402b9da36e950a2625ca513c8f1e088d6d94',
    publicationZipMeaning: '429-byte publication-result ZIP, not an application source/build ZIP',
    sourceBuildRun: '42236689124', sourceBuildAttempt: 1,
    chromeVersion: process.env.PND_HUD_CHROME_VERSION,
    node: realpathSync(process.execPath), python: '/usr/bin/python3', browser: '/opt/google/chrome/chrome',
    playwrightEntry, tooling: { ...tooling, node: process.version, platform: process.platform, architecture: process.arch,
      scope: 'Actual hosted binding, not historical local runtime. Static ELF dependencies do not attest late dlopen driver selection.' },
    composition: { bytes: 583816, sha256: 'becd7998a8e77ca29b2b4ca94df2feb8bf91cb8c4261da6889018bb5242dd324' },
    candidateManifest: candidate, infrastructureManifest: infrastructure, dependencyManifest: dependencies }
  assert.equal(process.version, 'v24.19.0'); assert.equal(process.platform, 'linux'); assert.equal(process.arch, 'x64')
  save('binding-input.json', binding)
  // Read-only runtime binding: no browser launch, install, endpoint request or local server.
  execFileSync('/usr/bin/python3', ['-I', '-S', '-B', resolve(here, 'runtime_binding.py'), output], {
    timeout: 180000, maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    env: { PATH: '/usr/local/bin:/usr/bin:/bin', LC_ALL: 'C', PYTHONDONTWRITEBYTECODE: '1' },
  })
  save('runtime-admission.json', { approved: true, bindingSha256: sha256(resolve(output, 'binding.json')), identity,
    authority: 'Explicit main workflow_dispatch with matching infrastructure_sha, exact candidate and first attempt' })
} catch (error) {
  save('setup-blocker.json', { status: 'blocked', error: String(error), identity, browserStarted: false })
  throw error
}
