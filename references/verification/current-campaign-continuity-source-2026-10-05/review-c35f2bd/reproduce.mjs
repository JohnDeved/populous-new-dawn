import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
const head = 'c35f2bd11b68ccf374f35338ac6dd1d271d2c046'
const source = path => execFileSync('git', ['show', `${head}:${path}`], { encoding: 'utf8' })
const scenario = source('qa/campaign-continuity/scenario.mjs')
const body = (name, next) => scenario.slice(scenario.indexOf(`  const ${name} =`), scenario.indexOf(`  const ${next} =`, scenario.indexOf(`  const ${name} =`)))
const routesSource = source('qa/campaign-continuity/routes.mjs')
const routes = new Function('assert', routesSource.replace(/^import .*$/gm, '').replace(/^export /gm, '') + '\nreturn {missionRoutes,validateMissionMilestones}') (assert)
const boundariesSource = source('qa/campaign-continuity/boundaries.mjs')
const boundaryFns = new Function('assert', 'validateMissionMilestones', boundariesSource.replace(/^import .*$/gm, '').replace(/^export /gm, '') + '\nreturn {validateSegmentPredecessor}') (assert, routes.validateMissionMilestones)
const actualPage = source('app/page.tsx')
const suffix = actualPage.match(/\? `Continue to Mission \$\{nextMission\}`\s*: 'Restart Level'\}\{' '\}\s*<span>([^<]+)<\/span>/)?.[1]
assert.equal(suffix, '↗', 'Derive the visible name suffix from the actual shipped page')
assert.match(body('button', 'safeLabel'), /getByRole\('button', \{ name, exact: true \}\)/)
const requestedName = 'Continue to Mission 2', renderedName = `${requestedName} ${suffix}`
assert.notEqual(requestedName, renderedName)
console.log(JSON.stringify({ finding: 'R1', requestedName, renderedName, exactMatches: requestedName === renderedName, source: 'actual app/page.tsx result-button contents and actual button() exact matcher; source-only accessibility-name derivation, not rendered browser proof' }))
const progress = new Function('assert', 'objectiveProgress', `const conditionMet=()=>false; ${body('progressFor', 'pauseForPreservation')} return progressFor;`)(assert, () => { throw Error('Existing named-effect handler should have been reached') })
for (const type of ['effect-present', 'effect-finished']) {
  let failure
  try { progress({ units: [], buildings: [], shrines: [], effects: [] }, {type,kind:'bridge'}, 'combat', []) } catch (error) { failure = error.message }
  assert.match(failure, /Wait must name its objective/)
  console.log(JSON.stringify({ finding: 'R2', condition: {type,kind:'bridge'}, actualAdapterFailure: failure }))
}
const saved = { level: 2, turn: 100, time: 8, checkpointSha256: 'full-committed', actorsSha256: 'actors', terrainSha256: 'terrain', stockSha256: 'stock' }
const previous = { runId: 'prior', cleanupVerified: true, continuationVerified: true }
const sourceIdentity = { fingerprint: 'source' }, profile = { id: 'profile', checkpointAtStart: saved }
const prior = { status: 'failed', failure: 'Error: server cleanup failed', previousFailure: 'Error: Verified mission boundary; retained failures prevent a clean harness pass', source: sourceIdentity, errors: [], profile: { ...previous, id: profile.id, checkpointAtEnd: saved } }
const result = { kind: 'fresh-current-campaign', phase: 'continued-and-saved', level: 2, profileId: profile.id, runId: previous.runId, source: sourceIdentity, failures: [{kind:'observed-input-rejection'}], controlStops: [], browserErrors: [], preserveVerificationFailed: false, protectedLatest: {checkpoint:saved}, currentEpoch:null,
  transitions:[{from:1,to:2,boundary:{sameStore:true,newWorld:true,newScene:true,currentCorrespondence:true,level:2,replacementLevel:2,error:null}}], milestones:routes.missionRoutes[1].required.map(name=>({level:1,name})), checkpointProofs:[{level:1,loaded:true}], ownedWallMs:10000,missionWallMs:{1:9000,2:1000,3:0},epochs:[{name:'m1',level:1,activeSeconds:400},{name:'m2-start',level:2,activeSeconds:8}] }
const admitted = boundaryFns.validateSegmentPredecessor(previous, prior, result, profile, sourceIdentity)
assert.equal(admitted.failures.at(-1).error, 'Error: server cleanup failed')
const harness = source('scripts/local-render/harness.mjs')
assert.match(harness, /try \{ await stopServer\(server\) \} catch \(error\) \{ outcome = \{ status: 'failed', failure: String\(error\), previousFailure: outcome.failure \} \}/)
assert.match(harness, /receipt\.profile\.cleanupVerified = cleanupVerified/)
console.log(JSON.stringify({ finding: 'R3', terminalCleanupFailureAdmitted: true, recordedFailure: admitted.failures.at(-1), source: 'actual validator executed with the failure shape emitted by actual harness stopServer catch; no server or browser started' }))
console.log(JSON.stringify({head, scenarioSha256:createHash('sha256').update(scenario).digest('hex'), allThreeFindingsReproduced:true}))
