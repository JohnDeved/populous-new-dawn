import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createWorld, effect } from '../../../app/model.ts'
import { createLivePerson, animateLiveObjects } from '../../../app/live-people.ts'
const path = '../sprite-stamp-gate-audit/work/orchestration/sprite-stamp-gate-214/native/result.json',
  raw = readFileSync(path), native = JSON.parse(raw), results = [],
  fields = ['object', 'draw', 'renderFlags', 'f1', 'f2', 'morph', 'palette', 'morphTimer', 'morphFrames'],
  snapshot = p => Object.fromEntries(fields.map(key => [key, p[key]]))
for (const row of native.personTimelines) {
  const world = createWorld(), unit = world.units.find(u => u.kind === 'brave' && u.team === 'blue')
  world.units = [unit]
  const person = ['brave', 'warrior', 'preacher', 'spy', 'firewarrior', 'shaman']
    .map(kind => createLivePerson(world, { ...unit, kind })).find(p => p.model === row.model)
  Object.assign(person, snapshot(row.initial), { state: 14 })
  assert.equal(person.flags3 & 0x40000, 0x40000)
  unit.native = person
  for (const sample of row.samples) {
    if (sample.logicalVisit) { world.turn++; animateLiveObjects(world, 'logical') }
    animateLiveObjects(world)
    assert.deepEqual(snapshot(person), snapshot(sample.after), `${row.name} model${row.model} counter${sample.counter}`)
  }
  results.push({ name: row.name, model: row.model, samples: row.samples.length })
}
for (const row of native.effectProducers) {
  const world = createWorld(), unit = world.units[0]
  world.units = []
  const fx = row.name === 'splash' ? effect(world, 'splash', unit, true) :
    { kind: 'smoke', animation: { ...row.initial } }
  world.effects = [fx]
  assert.equal(fx.animation.flags3 & 0x40000, row.initial.flags3 & 0x40000)
  Object.assign(fx.animation, snapshot(row.initial))
  for (const sample of row.samples) {
    if (sample.logicalVisit) { world.turn++; animateLiveObjects(world, 'logical') }
    animateLiveObjects(world)
    assert.deepEqual(snapshot(fx.animation), snapshot(sample.after), `${row.name} counter${sample.counter}`)
  }
  results.push({ name: row.name, samples: row.samples.length })
}
const result = {
  status: 'passed', retainedNativeSha256: createHash('sha256').update(raw).digest('hex'),
  cases: results, comparisons: results.reduce((sum, row) => sum + row.samples, 0),
  scope: 'Actual animateLiveObjects phase routing against accepted retained native timelines; actual current person/Splash creation, native animation poses supplied; clear-bit smoke animation records supplied. Processor bodies, elapsed wall time and gameplay are not executed here. Adapter stamps use completed World.turn and are deliberately not compared to native outer serials. No original probe repeated.'
}
writeFileSync('work/orchestration/sprite-logical-visit-fix/native-adapter-result.json', JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
