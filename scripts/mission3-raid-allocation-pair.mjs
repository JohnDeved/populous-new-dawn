// Controlled adapter composition. This does not create or simulate a live mission.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import script from '../app/original-script-three.json' with { type: 'json' }
import { runScript, scriptState } from '../app/popscript.ts'
import { createComputerQueue } from '../app/computer.ts'
import { campaignCommand } from '../app/campaign-command-runtime.ts'
import { campaignInternal } from '../app/campaign-runtime.ts'

const fixture = JSON.parse(readFileSync(process.argv[2], 'utf8'))
assert.equal(fixture.cases.length, 5)
assert.equal(fixture.attributes.length, 48)
assert.equal(fixture.attributes[25], 1)
assert.equal(fixture.scriptSha256, script.sha256)
const [start, end] = fixture.block
assert.deepEqual([start, end], [796, 833])
const block = { ...script, codes: [12, 1003, ...script.codes.slice(start, end), 1004, 1019] }

const results = fixture.cases.map(c => {
  const ai = {
    ...scriptState(script), ...createComputerQueue(),
    attributes: [...fixture.attributes],
    states: c.enabled ? fixture.states : fixture.states & ~(1 << 20),
  }
  for (const { index, type } of c.occupied) Object.assign(ai.tasks[index], { flags: 1, type })
  const before = structuredClone(ai.tasks), reads = [], commands = [], rngTransitions = []
  let seed = fixture.seed
  const world = {
    outcome: { level: 3 }, activeCampaignTribe: fixture.tribe, turn: fixture.turn,
    ai, units: [], buildings: fixture.buildings.map(b => ({
      id: b.id, kind: 'hut', level: b.model, team: 'blue', hp: 100, progress: 1,
      object: b.object, angle: b.angle * Math.PI * 2 / 2048,
      anchor: { x: b.anchorX, y: b.anchorY }, x: 0, z: 0,
    })),
  }
  Object.defineProperty(world, 'randomState', {
    get: () => seed,
    set: value => { seed = value >>> 0; rngTransitions.push(seed) },
  })
  runScript(block, ai, {
    turn: fixture.turn, tribe: fixture.tribe,
    readInternal: id => {
      if (Object.hasOwn(fixture.populations, id)) {
        reads.push(id)
        return fixture.populations[id]
      }
      return campaignInternal(world, id)
    },
    command: (opcode, args) => {
      assert.equal(opcode, 1059)
      commands.push({ opcode, args })
      campaignCommand(world, opcode, args, script)
    },
  })
  const allocated = ai.tasks.flatMap((task, index) =>
    !(before[index].flags & 1) && task.flags & 1 ? [{
      index, flags: task.flags, type: task.type, phase: task.phase,
      entity: task.entity, target: task.target, origin: task.origin,
      requested: task.requested, damage: task.extra, marker: task.mode,
      quotas: task.quotas, retreatPercent: task.retreatPercent, spells: task.spells,
    }] : [])
  const occupiedUnchanged = c.occupied.every(({ index }) =>
    JSON.stringify(before[index]) === JSON.stringify(ai.tasks[index]))
  return { name: c.name, rng: seed, rngTransitions, reads, commands, allocated,
    occupiedUnchanged, attributes: ai.attributes }
})
process.stdout.write(JSON.stringify(results))
