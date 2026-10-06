// Fixed supplied count5/status replay. Execute only through the separately granted compare.py run.
// Actual controller/updater imports; no live acquisition, physics, caller, world or renderer claim.
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { stepPreachingOrder } from '../../../app/preacher-conversion.ts'
import { stepObjectAnimation } from '../../../app/animation.ts'
import rules from '../../../app/original-rules.json' with { type: 'json' }

const output = {
  status: 'running', nodeVersion: process.version, cases: [],
  completedControllerCalls: 0, completedUpdaterCalls: 0, completedAcquisitionAdapterCalls: 0,
  boundary: 'Direct actual controller/updater with supplied return5/status-clear adapter; six fixed supplied records and topology; no production scan, physics, caller or rendered execution',
}
let latestSnapshot, activeEvents = []
try {
  const { fields, frameCounts, cases, addresses } = JSON.parse(readFileSync(0, 'utf8'))
  if (cases.length !== 1 || addresses.person !== 0x2000000 || addresses.order !== 0x938934)
    throw new Error('Fixed case/address cap')
  const scenario = cases[0]
  if (scenario.id !== 'owned5-produced-bit2-terminal-mode0' || scenario.caseCount !== 1 ||
      scenario.controllerUpdaterPairs !== 3 || scenario.records.length !== 6 ||
      scenario.initialWorldSerial !== 4243 || scenario.acquisitionRadius !== 3 ||
      JSON.stringify(scenario.nextWorldSerials) !== '[4244,4245,4246]' ||
      JSON.stringify(scenario.explicitSupplies.counter.nextControllerCounters) !== '[14,15,16]' ||
      scenario.simulationRandom !== 3603658299 || scenario.cosmeticRandom !== 2096320492)
    throw new Error('Fixed supplied case drift')

  const freeze = value => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze)
      Object.freeze(value)
    }
    return value
  }
  freeze(scenario)
  const suppliedRecords = scenario.records
  const original = suppliedRecords[0]
  const p = { ...original.fields, commands: [...original.commands], building: null,
    cellNext: original.cellNext, cellPrevious: original.cellPrevious }
  const fieldNames = Object.keys(fields)
  if (fieldNames.length !== 45 || p.counter !== 13 ||
      JSON.stringify(p.commands) !== '[26,0,0,0,0,0,0,0]')
    throw new Error('Fixed Preacher field/queue supply drift')

  const pack = (person, commands, cellNext, cellPrevious, originalRaw) => {
    // Preserve every unmapped byte from the explicit supplied image, including zero supplies.
    const b = Buffer.from(originalRaw, 'hex')
    if (b.length !== 256 || commands.length !== 8) throw new Error('Raw record/queue width')
    for (const [name, [offset, type]] of Object.entries(fields)) {
      const value = person[name]
      if (!Number.isInteger(value)) throw new Error(`Unrepresented port field ${name}`)
      if (type === 'I') b.writeUInt32LE(value, offset)
      else if (type === 'H') b.writeUInt16LE(value, offset)
      else if (type === 'h') b.writeInt16LE(value, offset)
      else if (type === 'B') b.writeUInt8(value, offset)
      else throw new Error(`Unknown field encoding ${name}/${type}`)
    }
    commands.forEach((id, slot) => b.writeUInt16LE(id, 0x8b + 2 * slot))
    b.writeUInt16LE(cellNext, 0x20)
    b.writeUInt16LE(cellPrevious, 0x22)
    return b.toString('hex')
  }
  const expectedRawHashes = [
    'ef507e497f3c0b5813b1f8f2d3b0722c044c57661eeedfe79d3a943f5d08f204',
    '73ba4b980f28261de5f49277240f6be688d8ec8525e534fa80163e9bac454df2',
    'e2e0c688655c3675de4ddcb8d747e5625e1018272117f4f35eb17a9ada7fe36a',
    'd8f72cf91c1074ade6c43cabe94de5c37e2eddffcc163e70ad750c3c4b7ccfdd',
    '1244eef31b053300d0c57ab2337328ef7b508a51e5e36abff063cb3f2ed62dc3',
    '8f877c8560366329161470812f0969fe96dc87338d4ef2d7ed3bd51e4f4a61d1',
  ]
  suppliedRecords.forEach((record, index) => {
    if (record.id !== 3164 + index || record.fields.id !== record.id ||
        Number.parseInt(record.address, 16) !== addresses.person + index * 256 ||
        !/^[0-9a-f]{512}$/.test(record.raw256Hex) ||
        createHash('sha256').update(Buffer.from(record.raw256Hex, 'hex')).digest('hex') !== expectedRawHashes[index] ||
        record.raw256Sha256 !== expectedRawHashes[index] ||
        JSON.stringify(Object.keys(record.fields).sort()) !== JSON.stringify([...fieldNames].sort()) ||
        pack(record.fields, record.commands, record.cellNext, record.cellPrevious, record.raw256Hex) !== record.raw256Hex)
      throw new Error(`Fixed supplied record drift ${index}`)
  })

  const order = { ...scenario.order }
  const blank = { model: 0, flags: 0, references: 0, object: 0, a: 0, b: 0 }
  const orderRecords = Array.from({ length: 27 }, () => ({ ...blank }))
  orderRecords[26] = order
  const orders = { records: orderRecords, cursor: 26, active: 1 }
  const world = { randomState: scenario.simulationRandom, loadFlags: 0,
    orders, tribeFlags: [0, 0, 0, 0], playerTribe: 0 }
  const cosmetic = { randomState: scenario.cosmeticRandom }
  world.poseRandom = cosmetic
  const queueSupply = JSON.stringify(orders)
  const listenerSupply = JSON.stringify(suppliedRecords.slice(1))
  const commandSupply = JSON.stringify(p.commands)
  const queueFields = ['commandCursor', 'commandStatus', 'commandAux', 'commandPhase', 'immediateCommand']
  const assertSupplies = () => {
    if (world.orders !== orders || orders.records !== orderRecords || orderRecords[26] !== order ||
        JSON.stringify(orders) !== queueSupply || JSON.stringify(p.commands) !== commandSupply ||
        queueFields.some(key => p[key] !== original.fields[key]))
      throw new Error('Port order-pool/queue ownership mutation')
    if (JSON.stringify(suppliedRecords.slice(1)) !== listenerSupply ||
        p.cellNext !== original.cellNext || p.cellPrevious !== original.cellPrevious)
      throw new Error('Supplied listener/topology mutation')
  }
  const topology = freeze({
    objectPointers: scenario.topology.objectPointers.map(pointer => ({
      id: pointer.id, slotAddress: Number.parseInt(pointer.slotAddress, 16),
      address: Number.parseInt(pointer.personAddress, 16),
    })),
    cellHeads: scenario.topology.scannedCells.map(cellIndex => ({
      cellIndex, address: 0x8a03e4 + cellIndex * 16 + 6,
      headId: cellIndex === scenario.topology.cellIndex ? scenario.topology.headId : 0,
    })),
    nullObjectPointer: { slotAddress: 0x890390, value: 0 },
  })
  const orderRaw = () => {
    const b = Buffer.alloc(10)
    b.writeUInt8(order.model, 0)
    b.writeUInt8(order.flags, 1)
    ;['references', 'object', 'a', 'b'].forEach((key, index) => b.writeUInt16LE(order[key], 2 + index * 2))
    return b.toString('hex')
  }
  if (order.id !== 26 || scenario.orderAddress !== '00938934' ||
      scenario.orderRawHex !== '110001000000002b009f' || orderRaw() !== scenario.orderRawHex)
    throw new Error('Fixed order26 drift')
  const events = []
  let serial = scenario.initialWorldSerial, phase = 'initial', visit = 0, controllerReturn = null
  const snapshot = () => {
    const records = suppliedRecords.map((record, index) => ({
      id: record.id, address: Number.parseInt(record.address, 16),
      raw: index === 0 ? pack(p, p.commands, p.cellNext, p.cellPrevious, record.raw256Hex) : record.raw256Hex,
      fields: index === 0 ? Object.fromEntries(fieldNames.map(key => [key, p[key]])) : { ...record.fields },
      commands: [...(index === 0 ? p.commands : record.commands)],
      cellNext: index === 0 ? p.cellNext : record.cellNext,
      cellPrevious: index === 0 ? p.cellPrevious : record.cellPrevious,
    }))
    const sourceCandidates = rules.animationObjects.flatMap(([source, draw], id) =>
      source === p.object && draw === p.draw ? [id] : [])
    return { raw: records[0].raw, fields: records[0].fields, commands: records[0].commands,
      objectIdCandidates: sourceCandidates, sourceCandidates,
      order: { ...order }, orderRaw: orderRaw(),
      owner: { personAddress: addresses.person, personId: p.id, orderId: p.commands[0], orderAddress: addresses.order },
      worldAnimationCounter: serial, controllerReturn,
      cosmeticRandom: cosmetic.randomState, simulationRandom: world.randomState, records, topology }
  }
  latestSnapshot = snapshot
  const log = (kind, args, boundary, extra = {}) =>
    events.push({ visit, phase, kind, args, boundary, ...extra, state: snapshot() })
  const forbidden = (kind, args = []) => {
    log(kind, args, 'forbidden-port-path')
    throw new Error(`Unexpected ${kind}`)
  }
  assertSupplies()
  const record = { case: scenario.id, initial: snapshot(), rows: [] }
  output.cases.push(record)
  for (visit = 1; visit <= 3; visit++) {
    if (output.completedControllerCalls >= 3 || output.completedUpdaterCalls >= 3)
      throw new Error('Controller/updater call cap')
    p.counter = (p.counter + 1) & 255
    serial++
    if (p.counter !== scenario.explicitSupplies.counter.nextControllerCounters[visit - 1] ||
        serial !== scenario.nextWorldSerials[visit - 1])
      throw new Error('Supplied counter/serial drift')
    controllerReturn = null
    phase = 'before-controller'
    assertSupplies()
    const row = { case: scenario.id, visit, beforeController: snapshot(), events: [] }
    record.rows.push(row)
    events.length = 0
    activeEvents = events
    phase = 'controller'
    row.result = stepPreachingOrder(world, p, order, {
      animate: object => forbidden('upper-setter', [addresses.person, object]),
      animationDuration: () => forbidden('animation-duration'),
      frameCount: () => forbidden('frame-count'),
      sound: cue => forbidden('audio', [cue]),
      stop: () => forbidden('stop', [addresses.person]),
      acquire: radius => {
        if (radius !== 3 || ![1, 3].includes(visit) ||
            output.completedAcquisitionAdapterCalls !== (visit === 1 ? 0 : 1))
          throw new Error('Unexpected acquisition adapter radius/visit/count')
        const boundary = 'supplied-return5/status-clear adapter; no live scan or native first-angle/reveal call'
        log('acquisition-adapter-before', [addresses.person, radius], boundary)
        p.statusFlags &= ~2
        output.completedAcquisitionAdapterCalls++
        assertSupplies()
        log('acquisition-adapter-after', [addresses.person, radius], boundary, { returnValue: 5 })
        return 5
      },
      release: radius => forbidden('release', [addresses.person, radius]),
    })
    output.completedControllerCalls++
    controllerReturn = row.result
    phase = 'after-controller'
    assertSupplies()
    row.afterController = snapshot()
    p.stamp = serial
    phase = 'before-updater'
    row.beforeUpdater = snapshot()
    phase = 'updater'
    const updaterReturn = stepObjectAnimation(p, { counter: serial, levelFlags: scenario.worldGlobals.updaterLevelFlags,
      levelFlags2: scenario.worldGlobals.updaterLevelFlags2 },
    { frameCounts, modelFrames: [], morphDurations: [] }, () => forbidden('footprint'))
    row.updaterReturn = { type: typeof updaterReturn, value: updaterReturn ?? null }
    output.completedUpdaterCalls++
    phase = 'after-updater'
    assertSupplies()
    row.afterUpdater = snapshot()
    row.events = [...events]
    // The frozen current port takes its terminal simulation draw: do not demand an unchanged word.
    const expectedSimulation = visit === 3 ? 1607832750 : scenario.simulationRandom
    if (row.result !== 0 || world.randomState !== expectedSimulation ||
        cosmetic.randomState !== scenario.cosmeticRandom || p.assignment !== 336 ||
        p.animationMode !== (visit === 3 ? 2 : 0) ||
        output.completedAcquisitionAdapterCalls !== (visit === 3 ? 2 : 1))
      throw new Error('Unexpected return/RNG/turning/adapter result for frozen current port')
  }
  output.status = 'completed'
} catch (error) {
  output.status = 'blocked'
  output.error = `${error.name}: ${error.message}`
  try { output.interruptedState = latestSnapshot?.() }
  catch (snapshotError) { output.interruptedSnapshotError = `${snapshotError.name}: ${snapshotError.message}` }
  output.interruptedEvents = [...activeEvents]
  process.exitCode = 2
}
process.stdout.write(JSON.stringify(output))
