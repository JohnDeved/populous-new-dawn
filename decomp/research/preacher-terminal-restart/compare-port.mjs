// Fixed command17 restart comparison. Run through compare.py only after a separate grant.
// Frozen b2 application imports; no world construction, browser or dependency import.
import { readFileSync } from 'node:fs'
import { stepPreachingOrder } from '../../../app/preacher-conversion.ts'
import { setPersonAnimation, stepObjectAnimation } from '../../../app/animation.ts'
import { stopPersonMovement } from '../../../app/person-state.ts'
import rules from '../../../app/original-rules.json' with { type: 'json' }

const input = JSON.parse(readFileSync(0, 'utf8'))
const { fields, frameCounts, cases, addresses } = input
const output = { status: 'running', nodeVersion: process.version, cases: [],
  completedControllerCalls: 0, completedUpdaterCalls: 0 }
let latestSnapshot, activeEvents = []
try {
  if (cases.length !== 1 || cases[0].pairs !== 3 || addresses.person !== 0x2000000 ||
      addresses.order !== 0x938934) throw new Error('Fixed case/address cap')
  const scenario = cases[0]
  const p = structuredClone(scenario.person)
  Object.assign(p, { commands: [...scenario.commands], building: null })
  const order = { ...scenario.order }
  const blank = { model: 0, flags: 0, references: 0, object: 0, a: 0, b: 0 }
  const records = Array.from({ length: 27 }, () => ({ ...blank }))
  records[26] = order
  const world = { randomState: scenario.simulationRandom, loadFlags: 0,
    orders: { records, cursor: 26, active: 1 }, tribeFlags: [0, 0, 0, 0] }
  const cosmetic = { randomState: scenario.cosmeticRandom }
  world.poseRandom = cosmetic
  world.playerTribe = 0
  const setterWorld = { playerTribe: 0, gameFlags: 0, sessionSubstate: null,
    tribes: Array.from({ length: 4 }, () => ({ flags: 0, playerType: 1 })), objects: new Map() }
  const events = []
  let serial = scenario.worldAnimationCounter, phase = 'initial', visit = 0, controllerReturn = null
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
  const orderRaw = () => {
    const b = Buffer.alloc(10)
    b.writeUInt8(order.model, 0)
    b.writeUInt8(order.flags, 1)
    ;['references', 'object', 'a', 'b'].forEach((key, index) => b.writeUInt16LE(order[key], 2 + index * 2))
    return b.toString('hex')
  }
  const snapshot = () => ({ raw: raw().toString('hex'),
    fields: Object.fromEntries(Object.keys(fields).map(k => [k, p[k]])),
    objectIdCandidates: rules.animationObjects.flatMap(([source, draw], id) =>
      source === p.object && draw === p.draw ? [id] : []),
    commands: [...p.commands], order: { ...order }, orderRaw: orderRaw(),
    owner: { personAddress: addresses.person, personId: p.id, orderId: p.commands[0], orderAddress: addresses.order },
    worldAnimationCounter: serial, controllerReturn,
    cosmeticRandom: cosmetic.randomState, simulationRandom: world.randomState })
  latestSnapshot = snapshot
  const log = (kind, args, boundary = 'actual-port') =>
    events.push({ visit, phase, kind, args, boundary, state: snapshot() })
  const animate = object => {
    if (![17, 95].includes(object)) throw new Error(`Unexpected animation object ${object}`)
    log('upper-setter', [addresses.person, object])
    const [source, draw] = rules.animationObjects[object]
    // This is the intent before the upper setter; retain this distinct boundary label.
    log('lower-setter-intent', [addresses.person + 0x33, draw, source])
    setPersonAnimation(p, object, setterWorld, { frameCounts })
  }
  const record = { case: scenario.id, initial: snapshot(), rows: [] }
  output.cases.push(record)
  for (visit = 1; visit <= 3; visit++) {
    if (output.completedControllerCalls >= 3 || output.completedUpdaterCalls >= 3)
      throw new Error('Controller/updater call cap')
    p.counter = (p.counter + 1) & 255
    serial++
    if (p.counter !== scenario.nextCounters[visit - 1] || serial !== 4245 + visit)
      throw new Error('Supplied counter/serial drift')
    controllerReturn = null
    phase = 'before-controller'
    const row = { case: scenario.id, visit, beforeController: snapshot(), events: [] }
    record.rows.push(row)
    events.length = 0
    activeEvents = events
    phase = 'controller'
    row.result = stepPreachingOrder(world, p, order, {
      animate,
      animationDuration: () => (rules.animationDescriptors[p.draw].step + 1) * frameCounts[p.object],
      frameCount: () => frameCounts[p.object],
      sound: cue => { throw new Error(`Unexpected audio ${cue}`) },
      stop: () => { log('stop', [addresses.person]); stopPersonMovement(p, (_, id) => animate(id)) },
      acquire: radius => {
        if (radius !== 3 || ![1, 3].includes(visit) || scenario.acquisitionCount !== 0)
          throw new Error('Unexpected acquisition radius/visit/population')
        log('acquisition', [addresses.person, radius], 'supplied-empty-count/status port adapter')
        p.statusFlags |= 2
        return 0
      },
      release: () => { throw new Error('Unexpected release') },
    })
    output.completedControllerCalls++
    controllerReturn = row.result
    phase = 'after-controller'
    row.afterController = snapshot()
    p.stamp = serial
    phase = 'before-updater'
    row.beforeUpdater = snapshot()
    phase = 'updater'
    stepObjectAnimation(p, { counter: serial, levelFlags: 0, levelFlags2: 0 },
      { frameCounts, modelFrames: [], morphDurations: [] },
      () => { throw new Error('Unexpected footprint') })
    output.completedUpdaterCalls++
    phase = 'after-updater'
    row.afterUpdater = snapshot()
    row.events = [...events]
    if (row.result !== 0 || world.randomState !== scenario.simulationRandom ||
        cosmetic.randomState !== scenario.cosmeticRandom) throw new Error('Unexpected return/RNG mutation')
    if (world.orders.records[26] !== order || world.orders.active !== 1 || world.orders.cursor !== 26 ||
        records.some((record, index) => index !== 26 && JSON.stringify(record) !== JSON.stringify(blank)))
      throw new Error('Port order-pool ownership drift')
  }
  output.status = 'completed'
} catch (error) {
  output.status = 'blocked'
  output.error = `${error.name}: ${error.message}`
  output.interruptedState = latestSnapshot?.()
  output.interruptedEvents = [...activeEvents]
  process.exitCode = 2
}
process.stdout.write(JSON.stringify(output))
