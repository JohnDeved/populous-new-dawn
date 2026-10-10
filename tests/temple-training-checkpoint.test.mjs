import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { addBuilding, addUnit } from '../app/model.ts'
import { buildingAdmission } from '../app/live-building-entry.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { checkpointObservation } from '../scripts/local-render/checkpoint-observer.mjs'
import {
  armTempleCheckpoint,
  readTempleCommittedLoad,
} from '../scripts/local-render/temple-training-checkpoint.mjs'

// Supporting contracts only: injected active model-5 state, trusted event token,
// and a controllable IDB transaction boundary. Production createGameStore,
// migration, Page Load body and the complete typed encoder execute unchanged.
// No browser, genuine training input, admission, conversion or native parity is
// claimed by these tests; the ordinary scenario supplies those separate gates.
class Button {
  isConnected = true
  disabled = false
  listeners = new Map()
  addEventListener(type, listener, capture = false) {
    assert.equal(type, 'click')
    this.listeners.set(listener, capture)
  }
  removeEventListener(type, listener, capture) {
    assert.equal(type, 'click')
    assert.equal(this.listeners.get(listener), capture)
    this.listeners.delete(listener)
  }
  contains(target) {
    return target?.parent === this
  }
  click(isTrusted = true, target = this) {
    const event = { isTrusted, target, eventPhase: 0 },
      results = []
    try {
      for (const phase of [true, false]) {
        event.eventPhase = phase ? 2 : 3
        for (const [listener, capture] of [...this.listeners])
          if (capture === phase) results.push(listener.call(this, event))
      }
    } finally {
      event.eventPhase = 0
    }
    return results
  }
  async clickWithMicrotaskCheckpoint() {
    const event = { isTrusted: true, target: this, eventPhase: 2 }
    try {
      for (const phase of [true, false]) {
        event.eventPhase = phase ? 2 : 3
        for (const [listener, capture] of [...this.listeners]) {
          if (capture !== phase) continue
          listener.call(this, event)
          await Promise.resolve()
        }
      }
    } finally {
      event.eventPhase = 0
    }
  }
}

const settle = () => new Promise(resolve => setImmediate(resolve))
let session = 0
async function storage(t) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB'),
    records = new Map(),
    pending = [],
    events = []
  let closed = 0
  const notify = (target, type) => {
    const event = new Event(type)
    target.dispatchEvent(event)
    target[`on${type}`]?.call(target, event)
  }
  const database = {
    objectStoreNames: { contains: name => name === 'checkpoints' },
    transaction(name, mode = 'readonly') {
      assert.equal(name, 'checkpoints')
      const transaction = new EventTarget(),
        writes = []
      transaction.objectStore = name => {
        assert.equal(name, 'checkpoints')
        return {
          put(value, key) {
            assert.equal(mode, 'readwrite')
            writes.push([key, structuredClone(value)])
            events.push(`put:${key}`)
          },
          get(key) {
            events.push(`get:${key}`)
            return { result: structuredClone(records.get(key)) }
          },
        }
      }
      pending.push({
        mode,
        complete() {
          for (const [key, value] of writes) records.set(key, value)
          events.push(`complete:${mode}`)
          notify(transaction, 'complete')
        },
        abort() {
          transaction.error = Error('supplied transaction abort')
          events.push(`abort:${mode}`)
          notify(transaction, 'abort')
        },
      })
      return transaction
    },
    close() {
      closed++
    },
  }
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: {
      async databases() {
        return [{ name: 'populous-new-dawn' }]
      },
      open(name, version) {
        assert.equal(name, 'populous-new-dawn')
        assert.ok(version === undefined || version === 1)
        const request = new EventTarget()
        request.result = database
        queueMicrotask(() => notify(request, 'success'))
        return request
      },
    },
  })
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'indexedDB', previous)
    else delete globalThis.indexedDB
  })
  const { createGameStore } = await import(`../app/game-store.ts?temple-checkpoint=${++session}`)
  return {
    createGameStore,
    records,
    events,
    get closed() {
      return closed
    },
    async transaction(mode) {
      await settle()
      assert.equal(pending[0]?.mode, mode)
      return pending.shift()
    },
    async read() {
      const result = checkpointObservation()
      ;(await this.transaction('readonly')).complete()
      return result
    },
  }
}

function activeFixture(createGameStore) {
  const store = createGameStore()
  store.startMission(3)
  const world = store.getWorld(),
    temple = addBuilding(world, 'blue', 'temple', { x: -2, z: 32 }, true),
    trainee = addUnit(world, 'blue', 'brave', { x: 7, z: 33 }),
    person = createLivePerson(world, trainee),
    admission = buildingAdmission(world, temple)
  registerLivePerson(world, person)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  shaman.native = createLivePerson(world, shaman)
  registerLivePerson(world, shaman.native)
  Object.assign(world, { turn: 707, time: 707 / 12, paused: true, unlockedTemple: true })
  Object.assign(person, { flags3: 0, savedVehicle: 0, orderDelay: 0 })
  person.commands.fill(0)
  person.commands[0] = 1
  person.commandCursor = 0
  Object.assign(world.buildingOrders.records[1], {
    model: 8,
    a: temple.id,
    flags: 0,
    references: 1,
  })
  Object.assign(world.buildingOrders, { active: 1, cursor: 2 })
  Object.assign(trainee, {
    native: null,
    entry: { person, orders: world.buildingOrders },
    work: temple.id,
    inside: temple.id,
  })
  Object.assign(admission, {
    activity: admission.activity | 128,
    inside: 1,
    storedMana: 123,
    trainingCost: 3500,
  })
  admission.occupants[0] = trainee.id
  world.secondaryEffects.reservations = [`building-panel:${temple.id}`]
  for (const slot of [2, 9])
    world.secondaryEffects.slots[slot] = {
      kind: 'orderMarker',
      effect: 10000 + slot,
      counter: slot,
      serial: slot,
    }
  world.secondaryEffects.order = [2, 9]
  world.secondaryEffects.free = [159, 158]
  const snapshot = ({ phase, world: current }) => {
    const building = current.buildings.find(item => item.id === temple.id),
      unit = current.units.find(item => item.id === trainee.id)
    return {
      phase,
      temple: building.id,
      class: building.admission.class,
      model: building.admission.model,
      activity: building.admission.activity,
      storedMana: building.admission.storedMana,
      trainee: unit.id,
      native: unit.native === null,
      registered: current.objectCells.objects.get(unit.id) === unit.entry.person,
      ordersShared: unit.entry.orders === current.buildingOrders,
      commands: [...unit.entry.person.commands],
      reservations: [...current.secondaryEffects.reservations],
      secondaryOrder: [...current.secondaryEffects.order],
    }
  }
  return { store, world, temple, trainee, person, snapshot }
}

async function typed(world) {
  const key = Symbol('test-only checkpoint'),
    record = { version: 1, world }
  Object.defineProperty(globalThis, key, { configurable: true, value: record })
  try {
    return await checkpointObservation({ observationName: key })
  } finally {
    delete globalThis[key]
  }
}

// Bind the exact shipped body without a TypeScript dependency or a replacement
// implementation of Load/unpause ordering. The parameter alone has a TS type.
const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8'),
  start = page.indexOf('  function beginLoad(request: LoadRequest) {'),
  end = page.indexOf('\n  function restart()', start)
assert.ok(start >= 0 && end > start)
const beginLoad = page.slice(start, end).replace('request: LoadRequest', 'request')
function publicLoad(store) {
  const noop = () => {},
    bindings = {
      store,
      cancelNearbyInput: noop,
      engine: { current: null },
      setSelectorOpen: noop,
      audio: { current: { reset: noop } },
      setMenu: noop,
      setReady: noop,
      setError: noop,
      loadRequest: { current: null },
      setTab: noop,
      setStartup: noop,
    }
  return new Function(...Object.keys(bindings), `${beginLoad}; return beginLoad;`)(
    ...Object.values(bindings)
  )
}

test('active Temple Save observes post-normalization publication, committed IDB and first Page Load before unpause', async t => {
  const db = await storage(t),
    f = activeFixture(db.createGameStore),
    button = new Button(),
    save = armTempleCheckpoint({ kind: 'save', store: f.store, button, snapshot: f.snapshot }),
    before = structuredClone(f.world),
    symbols = Object.getOwnPropertySymbols(globalThis)
  t.after(() => save.close())
  let result,
    finished = false
  button.addEventListener('click', () => {
    result = f.store.saveCheckpoint()
    result.then(() => {
      finished = true
    })
  })
  button.click()
  assert.equal(save.status().captured, true, 'the boundary is captured inside the Save handler')
  assert.equal(save.status().publications, 1)
  assert.deepEqual(save.status().click.target.secondaryOrder, [2, 9])
  assert.deepEqual(save.status().publication.target.secondaryOrder, [9, 2])
  assert.equal(save.status().publication.target.class, 2)
  assert.equal(save.status().publication.target.model, 5)
  assert.equal(save.status().publication.target.activity & 128, 128)
  assert.equal(save.status().publication.target.ordersShared, true)
  assert.equal(save.status().publication.target.registered, true)
  const write = await db.transaction('readwrite')
  assert.equal(finished, false)
  assert.equal(db.records.has('latest'), false, 'request creation is not transaction commitment')
  assert.equal(await db.read(), null, 'readback rejects an uncommitted Save')
  write.complete()
  assert.equal(await result, true)
  const digest = save.digest()
  assert.deepEqual(
    Object.getOwnPropertySymbols(globalThis),
    symbols,
    'the bridge is gone before asynchronous digest completion'
  )
  const saved = await digest
  assert.deepEqual(await db.read(), saved)
  assert.notEqual(
    (await typed(before)).checkpointSha256,
    saved.checkpointSha256,
    'a pre-click snapshot is insufficient after secondary normalization'
  )
  assert.deepEqual(
    Object.getOwnPropertySymbols(globalThis),
    symbols,
    'the encoder bridge leaves no global record'
  )
  assert.deepEqual(
    Object.keys(saved).sort(),
    [
      'actorsSha256',
      'checkpointSha256',
      'level',
      'stockSha256',
      'terrainSha256',
      'time',
      'turn',
      'version',
    ].sort()
  )
  const recordBefore = structuredClone(db.records),
    liveBefore = structuredClone(f.world),
    expected = await save.expectedLoadDigest()
  assert.deepEqual(db.records, recordBefore)
  assert.deepEqual(f.world, liveBefore, 'expected migration never mutates live or stored state')
  assert.notEqual(expected.checkpointSha256, saved.checkpointSha256)
  const loadButton = new Button(),
    load = armTempleCheckpoint({
      kind: 'load',
      store: f.store,
      button: loadButton,
      snapshot: f.snapshot,
    })
  t.after(() => load.close())
  const publications = [],
    unsubscribe = f.store.subscribe(() => {
      publications.push({ paused: f.store.getWorld().paused, captured: load.status().captured })
    })
  t.after(unsubscribe)
  loadButton.addEventListener('click', () => publicLoad(f.store)({ kind: 'checkpoint' }))
  loadButton.click()
  assert.deepEqual(publications, [
    { paused: true, captured: true },
    { paused: false, captured: true },
  ])
  assert.equal(load.status().publication.paused, true)
  assert.equal(f.store.getWorld().paused, false)
  assert.deepEqual(load.status().publication.target.reservations, [])
  assert.equal(load.status().publication.target.ordersShared, true)
  assert.equal(load.status().publication.target.registered, true)
  assert.equal(load.status().publication.target.storedMana, 123)
  assert.deepEqual(await load.digest(), expected)
  assert.notEqual(
    (await typed(f.store.getWorld())).checkpointSha256,
    expected.checkpointSha256,
    'post-unpause observation cannot stand in for the first publication'
  )
  assert.deepEqual(
    await save.digest(),
    saved,
    'Load and detached migration cannot rewrite the Save capture'
  )
  assert.deepEqual(db.records, recordBefore, 'in-session Load does not replace committed storage')
  for (const capture of [save, load]) {
    assert.deepEqual(capture.close().cleanup, { listener: true, subscription: true })
    assert.deepEqual(capture.close().errors, [])
  }
  assert.equal(button.listeners.size, 1, 'the public handler survives cleanup')
  assert.equal(loadButton.listeners.size, 1)
  assert.equal(db.closed, 2, 'both readback database handles close')
})

test('fresh store restores committed active Temple and public Load Game publishes before Page unpause', async t => {
  const db = await storage(t),
    f = activeFixture(db.createGameStore),
    saved = f.store.saveCheckpoint()
  ;(await db.transaction('readwrite')).complete()
  assert.equal(await saved, true)
  const committedBefore = await db.read(),
    recordsBefore = structuredClone(db.records),
    read = readTempleCommittedLoad()
  ;(await db.transaction('readonly')).complete()
  const expected = await read
  assert.deepEqual(expected.committed, committedBefore)
  assert.deepEqual(db.records, recordsBefore, 'detached restore/Load prediction cannot alter IDB')
  assert.notEqual(expected.expectedLoad.checkpointSha256, committedBefore.checkpointSha256)

  // A new store has no in-session checkpoint. Its actual restore publication
  // enables the selector; the Load handler subsequently replaces its World.
  const store = db.createGameStore(),
    before = store.getWorld(),
    snapshot = context =>
      context.world.outcome.level === 3
        ? f.snapshot(context)
        : { phase: context.phase, level: context.world.outcome.level },
    disabled = new Button()
  assert.equal(store.hasCheckpoint(), false)
  disabled.disabled = !store.hasCheckpoint()
  for (const button of [null, disabled])
    assert.throws(
      () => armTempleCheckpoint({ kind: 'load', store, button, snapshot }),
      /Available public Temple Save\/Load controls and store required/
    )
  assert.equal(disabled.listeners.size, 0)
  const restoring = store.restoreCheckpoint()
  assert.equal(store.hasCheckpoint(), false, 'Load is unavailable before the IDB read completes')
  ;(await db.transaction('readonly')).complete()
  assert.equal(await restoring, true)
  assert.equal(store.hasCheckpoint(), true)
  assert.equal(store.getWorld(), before, 'restore retains startup World until public Load')

  // Verify the actual selector label, availability and Page callback wiring,
  // then execute that unchanged callback body and the existing Page body adapter.
  const selector = readFileSync(new URL('../app/world-selector.tsx', import.meta.url), 'utf8'),
    selectorUse = page.match(/<WorldSelector\b[\s\S]*?\n\s*\/>/)?.[0],
    handlerName = selectorUse?.match(/\bonLoad=\{(\w+)\}/)?.[1]
  assert.match(
    selector,
    /\{hasCheckpoint && \(\s*<button autoFocus onClick=\{onLoad\}>\s*Load Game\s*<\/button>/
  )
  assert.match(selectorUse, /hasCheckpoint=\{store\.hasCheckpoint\(\)\}/)
  assert.ok(handlerName)
  const handlerStart = page.indexOf(`  function ${handlerName}() {`),
    handlerEnd = page.indexOf('\n  function ', handlerStart + 1)
  assert.ok(handlerStart >= 0 && handlerEnd > handlerStart)
  const handler = new Function(
      'beginLoad',
      `${page.slice(handlerStart, handlerEnd)}; return ${handlerName};`
    )(publicLoad(store)),
    button = new Button(),
    capture = armTempleCheckpoint({ kind: 'load', store, button, snapshot }),
    publications = [],
    unsubscribe = store.subscribe(() => {
      publications.push({ paused: store.getWorld().paused, captured: capture.status().captured })
    })
  t.after(() => capture.close())
  t.after(unsubscribe)
  button.addEventListener('click', handler)
  button.click()
  assert.notEqual(store.getWorld(), before)
  assert.deepEqual(publications, [
    { paused: true, captured: true },
    { paused: false, captured: true },
  ])
  assert.equal(capture.status().publications, 1)
  assert.equal(capture.status().publication.paused, true)
  assert.equal(capture.status().publication.target.activity & 128, 128)
  assert.equal(capture.status().publication.target.storedMana, 123)
  assert.equal(capture.status().publication.target.ordersShared, true)
  assert.equal(capture.status().publication.target.registered, true)
  assert.deepEqual(await capture.digest(), expected.expectedLoad)
  assert.equal(store.getWorld().paused, false)
  assert.notEqual(
    (await typed(store.getWorld())).checkpointSha256,
    expected.expectedLoad.checkpointSha256
  )
  assert.deepEqual(
    await db.read(),
    committedBefore,
    'typed committed checkpoint survives restore and Load'
  )
  assert.deepEqual(db.records, recordsBefore)
  assert.deepEqual(capture.close().cleanup, { listener: true, subscription: true })
  assert.deepEqual(capture.close().errors, [])
  assert.equal(button.listeners.size, 1, 'observation cleanup preserves the public Load callback')
})

test('full typed digest rejects wrong active training, stored mana, shared orders and iteration order despite matching summary digests', async t => {
  const db = await storage(t),
    f = activeFixture(db.createGameStore),
    button = new Button(),
    save = armTempleCheckpoint({ kind: 'save', store: f.store, button, snapshot: f.snapshot })
  t.after(() => save.close())
  let pending
  button.addEventListener('click', () => {
    pending = f.store.saveCheckpoint()
  })
  button.click()
  ;(await db.transaction('readwrite')).complete()
  await pending
  const saved = await save.digest(),
    good = db.records.get('latest').world
  const cases = [
    [
      'activity',
      w => {
        w.buildings.find(b => b.id === f.temple.id).admission.activity ^= 128
      },
    ],
    [
      'stored mana',
      w => {
        w.buildings.find(b => b.id === f.temple.id).admission.storedMana++
      },
    ],
    [
      'shared order alias',
      w => {
        const u = w.units.find(u => u.id === f.trainee.id)
        u.entry.orders = structuredClone(u.entry.orders)
      },
    ],
    [
      'registered person alias',
      w => {
        const u = w.units.find(u => u.id === f.trainee.id)
        u.entry.person = structuredClone(u.entry.person)
      },
    ],
    [
      'Map iteration',
      w => {
        w.objectCells.objects = new Map([...w.objectCells.objects].reverse())
      },
    ],
    [
      'property order',
      w => {
        const b = w.buildings.find(b => b.id === f.temple.id),
          a = b.admission.activity
        delete b.admission.activity
        b.admission.activity = a
      },
    ],
  ]
  for (const [name, change] of cases) {
    const wrong = structuredClone(good)
    change(wrong)
    const digest = await typed(wrong)
    assert.notEqual(digest.checkpointSha256, saved.checkpointSha256, name)
    for (const key of ['actorsSha256', 'terrainSha256', 'stockSha256'])
      assert.equal(digest[key], saved[key], `${name}: ${key} omits this state`)
  }
  const migrated = migrateCheckpoint(structuredClone(good))
  assert.deepEqual(await typed(migrated), await save.expectedLoadDigest())
  assert.ok(
    migrated.units.find(u => u.id === f.trainee.id).entry.person.flags3 & 0x40000,
    'production migration includes more than reservation clearing'
  )
})

test('native-dispatch microtasks do not expire capture and Load skips same-World publications', async t => {
  const db = await storage(t),
    f = activeFixture(db.createGameStore),
    button = new Button(),
    save = armTempleCheckpoint({ kind: 'save', store: f.store, button, snapshot: f.snapshot })
  t.after(() => save.close())
  let result
  button.addEventListener('click', () => {
    result = f.store.saveCheckpoint()
  })
  await button.clickWithMicrotaskCheckpoint()
  assert.equal(save.status().captured, true)
  assert.deepEqual(save.status().errors, [])
  ;(await db.transaction('readwrite')).complete()
  await result
  const loadButton = new Button(),
    load = armTempleCheckpoint({
      kind: 'load',
      store: f.store,
      button: loadButton,
      snapshot: f.snapshot,
    })
  t.after(() => load.close())
  loadButton.addEventListener('click', () => {
    f.store.update()
    assert.equal(load.status().captured, false)
    publicLoad(f.store)({ kind: 'checkpoint' })
  })
  await loadButton.clickWithMicrotaskCheckpoint()
  assert.equal(load.status().publications, 2)
  assert.equal(load.status().publication.paused, true)
  assert.deepEqual(await load.digest(), await save.expectedLoadDigest())
})

test('publication read or snapshot errors are retained without rejecting the production Save', async t => {
  const db = await storage(t)
  for (const failure of ['snapshot', 'getWorld']) {
    const f = activeFixture(db.createGameStore),
      button = new Button(),
      original = f.store.getWorld
    let reads = 0,
      result
    f.store.getWorld = function () {
      assert.equal(this, f.store)
      if (++reads === 3 && failure === 'getWorld')
        throw Error('supplied publication getWorld failure')
      return original()
    }
    const capture = armTempleCheckpoint({
      kind: 'save',
      store: f.store,
      button,
      snapshot(context) {
        if (context.phase === 'publication' && failure === 'snapshot')
          throw Error('supplied publication snapshot failure')
        return f.snapshot(context)
      },
    })
    t.after(() => capture.close())
    button.addEventListener('click', () => {
      result = f.store.saveCheckpoint()
    })
    assert.doesNotThrow(() => button.click())
    ;(await db.transaction('readwrite')).complete()
    assert.equal(await result, true, 'observer failure cannot reject the original handler')
    assert.equal(capture.status().captured, false)
    assert.match(capture.status().errors[0], /supplied publication/)
    await assert.rejects(capture.digest(), /observation errors/)
    assert.deepEqual(capture.close().cleanup, { listener: true, subscription: true })
  }
})

test('untrusted, absent, delayed and wrong-world publications fail closed without changing public behavior', async t => {
  const db = await storage(t)
  for (const kind of ['save', 'load'])
    for (const action of ['untrusted', 'absent', 'delayed', 'wrong-world']) {
      const f = activeFixture(db.createGameStore),
        button = new Button(),
        capture = armTempleCheckpoint({ kind, store: f.store, button, snapshot: f.snapshot })
      t.after(() => capture.close())
      let calls = 0
      button.addEventListener('click', () => {
        calls++
        if (action === 'untrusted') f.store.update()
        if (action === 'delayed') queueMicrotask(() => f.store.update())
        if (action === 'wrong-world') {
          if (kind === 'save') f.store.startMission(3)
          else f.store.update()
        }
      })
      button.click(action !== 'untrusted')
      await new Promise(resolve => setTimeout(resolve, 5))
      assert.equal(calls, 1)
      assert.equal(capture.status().captured, false, `${kind}: ${action}`)
      assert.ok(capture.status().errorCount)
      await assert.rejects(capture.digest(), /missing or has observation errors/)
      assert.deepEqual(capture.close().cleanup, { listener: true, subscription: true })
    }
})

test('passive observation forwards receivers, retains errors, bounds evidence and preserves foreign ownership on cleanup', async t => {
  const db = await storage(t),
    f = activeFixture(db.createGameStore),
    button = new Button(),
    listeners = new Set(),
    original = f.store.getWorld,
    token = Error('supplied public failure')
  let removed = 0
  const store = {
    getWorld() {
      assert.equal(this, store)
      return original()
    },
    subscribe(callback) {
      assert.equal(this, store)
      listeners.add(callback)
      return () => {
        removed++
        listeners.delete(callback)
      }
    },
  }
  let snapshotCalls = 0
  const capture = armTempleCheckpoint({
    kind: 'save',
    store,
    button,
    snapshot() {
      snapshotCalls++
      throw Error('supplied target failure')
    },
  })
  button.addEventListener('click', function () {
    assert.equal(this, button)
    throw token
  })
  assert.throws(
    () => button.click(),
    error => error === token,
    'the original handler throws its exact error once'
  )
  assert.equal(snapshotCalls, 1)
  assert.match(capture.status().errors[0], /supplied target failure/)
  for (let index = 0; index < 40; index++)
    assert.throws(
      () => button.click(),
      error => error === token
    )
  assert.equal(capture.status().errors.length, 16)
  assert.equal(capture.status().errorCount, 41)
  const foreign = () => {
    throw Error('foreign replacement must not be called')
  }
  button.removeEventListener = foreign
  store.subscribe = foreign
  assert.deepEqual(capture.close().cleanup, { listener: true, subscription: true })
  assert.equal(button.removeEventListener, foreign)
  assert.equal(store.subscribe, foreign)
  assert.equal(listeners.size, 0)
  assert.equal(removed, 1)
  capture.close()
  assert.equal(removed, 1)
})

test('cleanup failures attempt both resources and installation or target-copy failures leave close usable', async t => {
  const db = await storage(t),
    f = activeFixture(db.createGameStore),
    button = new Button()
  let unsubscribed = 0
  button.removeEventListener = () => {
    throw Error('supplied listener cleanup failure')
  }
  const store = {
    getWorld: () => f.world,
    subscribe: () => () => {
      unsubscribed++
      throw Error('supplied subscription cleanup failure')
    },
  }
  const capture = armTempleCheckpoint({ kind: 'save', store, button, snapshot: f.snapshot })
  const closed = capture.close()
  assert.deepEqual(closed.cleanup, { listener: false, subscription: false })
  assert.equal(closed.errors.length, 2)
  assert.equal(unsubscribed, 1)
  assert.deepEqual(capture.close(), closed)
  button.click()
  assert.deepEqual(capture.status(), closed, 'even an unremovable listener is inert after close')

  const normal = new Button(),
    brokenStore = {
      getWorld: () => f.world,
      subscribe() {
        throw Error('supplied subscribe failure')
      },
    },
    broken = armTempleCheckpoint({
      kind: 'load',
      store: brokenStore,
      button: normal,
      snapshot: f.snapshot,
    })
  assert.equal(broken.status().closed, true)
  assert.equal(normal.listeners.size, 0)
  assert.match(broken.close().errors[0], /supplied subscribe failure/)
  for (const snapshot of [() => f.world, () => Array(2049).fill(1)]) {
    const button = new Button(),
      observer = armTempleCheckpoint({ kind: 'save', store: f.store, button, snapshot })
    button.click()
    assert.match(observer.status().errors[0], /snapshot exceeds bounds/)
    assert.deepEqual(observer.close().cleanup, { listener: true, subscription: true })
  }
})

test('aborted Save cannot claim committed IDB even though its synchronous in-session boundary exists', async t => {
  const db = await storage(t),
    f = activeFixture(db.createGameStore),
    button = new Button(),
    capture = armTempleCheckpoint({ kind: 'save', store: f.store, button, snapshot: f.snapshot })
  t.after(() => capture.close())
  let saved
  button.addEventListener('click', () => {
    saved = f.store.saveCheckpoint()
  })
  button.click()
  ;(await db.transaction('readwrite')).abort()
  assert.equal(await saved, false)
  assert.equal(capture.status().captured, true)
  assert.ok((await capture.digest()).checkpointSha256)
  assert.equal(await db.read(), null)
  assert.equal(f.store.hasCheckpoint(), true, 'the production session-only fallback remains intact')
  const load = armTempleCheckpoint({
    kind: 'load',
    store: f.store,
    button: new Button(),
    snapshot: f.snapshot,
  })
  t.after(() => load.close())
  await assert.rejects(load.expectedLoadDigest(), /requires a Save/)
})
