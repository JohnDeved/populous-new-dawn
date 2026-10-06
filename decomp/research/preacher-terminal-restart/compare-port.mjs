// Candidate-only replay of the accepted fixed sermon inputs; no original instructions.
// No world construction, browser, dependency import, gameplay edits or expected-value rewriting.
import { readFileSync } from 'node:fs'
import { stepPreachingOrder } from '../../../app/preacher-conversion.ts'
import { setPersonAnimation, stepObjectAnimation } from '../../../app/animation.ts'
import { stopPersonMovement } from '../../../app/person-state.ts'
import rules from '../../../app/original-rules.json' with { type: 'json' }

const input = JSON.parse(readFileSync(0, 'utf8'))
const { fields, frameCounts, cases, addresses } = input
const output = []
for (const scenario of cases) {
  const p = structuredClone(scenario.person)
  Object.assign(p, { commands: [1, 0, 0, 0, 0, 0, 0, 0], building: null })
  const order = { model: p.commandStatus, flags: 0, references: 1, object: 0, a: p.x, b: p.y }
  const world = { randomState: scenario.simulationRandom, loadFlags: 0,
    orders: { records: [{ ...order, model: 0, references: 0 }, order], cursor: 1, active: 1 },
    tribeFlags: [0, 0, 0, 0] }
  const cosmetic = { randomState: scenario.cosmeticRandom }
  world.poseRandom = cosmetic
  world.playerTribe = 0
  const setterWorld = { playerTribe: 0, gameFlags: 0, sessionSubstate: null,
    tribes: Array.from({ length: 4 }, () => ({ flags: 0, playerType: 1 })), objects: new Map() }
  const events = []
  let serial = 1000, phase = 'initial', visit = 0
  const raw = () => {
    const b = Buffer.alloc(256)
    for (const [name, [offset, type]] of Object.entries(fields)) {
      const value = p[name]
      if (!Number.isInteger(value)) throw new Error(`Unrepresented port field ${name}`)
      if (type === 'I') b.writeUInt32LE(value >>> 0, offset)
      else if (type === 'H') b.writeUInt16LE(value & 65535, offset)
      else if (type === 'h') b.writeInt16LE((value << 16) >> 16, offset)
      else b.writeUInt8(value & 255, offset)
    }
    p.commands.forEach((id, slot) => b.writeUInt16LE(id, 0x8b + 2 * slot))
    return b
  }
  const snapshot = () => ({ raw: raw().toString('hex'),
    fields: Object.fromEntries(Object.keys(fields).map(k => [k, p[k]])),
    objectIdCandidates: rules.animationObjects.flatMap(([source, draw], id) =>
      source === p.object && draw === p.draw ? [id] : []),
    commands: [...p.commands], order: { ...order }, worldAnimationCounter: serial,
    cosmeticRandom: cosmetic.randomState, simulationRandom: world.randomState })
  const log = (kind, args, boundary = 'actual-port') =>
    events.push({ visit, phase, kind, args, boundary, state: snapshot() })
  const animate = object => {
    log('upper-setter', [addresses.person, object])
    const [source, draw] = rules.animationObjects[object]
    // In this constrained on-foot/state10 domain the upper setter calls this lower pair.
    log('lower-setter-intent', [addresses.person + 0x33, draw, source])
    setPersonAnimation(p, object, setterWorld, { frameCounts })
  }
  const rows = []
  for (visit = 1; visit <= scenario.pairs; visit++) {
    p.counter = (p.counter + 1) & 255
    serial++
    phase = 'before-controller'
    const beforeController = snapshot(), eventStart = events.length
    phase = 'controller'
    const result = stepPreachingOrder(world, p, order, {
      animate,
      animationDuration: () => (rules.animationDescriptors[p.draw].step + 1) * frameCounts[p.object],
      frameCount: () => frameCounts[p.object],
      sound: cue => log('audio', [addresses.person, cue, 0], 'supplied-no-audio/no-extra-RNG'),
      stop: () => { log('stop', [addresses.person]); stopPersonMovement(p, (_, id) => animate(id)) },
      acquire: radius => {
        log('acquisition', [addresses.person, radius], 'supplied-adapter')
        const count = scenario.acquisitionCount
        p.statusFlags = count <= 4 ? p.statusFlags | 2 : p.statusFlags & ~2
        if (count && (p.statusFlags & 2)) {
          if (p.motionGroup !== 0) throw new Error('Unexpected motion group')
          p.turnAngle = scenario.firstAngle
          p.flags2 = (p.flags2 | 0x1080) >>> 0
        }
        return count
      },
      release: radius => log('release', [addresses.person, radius], 'supplied-empty-listeners'),
    })
    phase = 'after-controller'
    const afterController = snapshot()
    p.stamp = serial
    phase = 'before-updater'
    const beforeUpdater = snapshot()
    phase = 'updater'
    stepObjectAnimation(p, { counter: serial, levelFlags: 8, levelFlags2: 0x10000 },
      { frameCounts, modelFrames: [], morphDurations: [] },
      () => { throw new Error('Unexpected footprint') })
    phase = 'after-updater'
    rows.push({ case: scenario.id, visit, result,
      beforeController, afterController, beforeUpdater, afterUpdater: snapshot(),
      events: events.slice(eventStart) })
  }
  output.push({ case: scenario.id, rows })
}
process.stdout.write(JSON.stringify({ status: 'completed', nodeVersion: process.version, cases: output }))
