import { hutDismantleSnapshot, hutResidentIdentity } from './mission1-hut-dismantle-snapshot.mjs'
import {
  assertHutDismantleStarted,
  assertHutDismantleFinished,
  assertHutTimberLedger,
  assertHutTimberVisit,
} from './mission1-hut-dismantle-contract.mjs'
import { armTempleCheckpoint } from './temple-training-checkpoint.mjs'
import { armBuildingSceneStart } from './mission3-building-lifecycle.mjs'

// Passive afterTurn/click owners only. Every simulation visit is checked locally;
// only meaningful events and scalar status leave this bounded observer.
export function createHutDismantleEpoch({ scene, store, ids, baseline = null, record }) {
  const world = scene.world,
    target = world.buildings.find(item => item.id === ids.targetId),
    worker = world.units.find(item => item.id === ids.workerId),
    clock = scene.gameClock,
    descriptor = Object.getOwnPropertyDescriptor(clock, 'afterTurn'),
    original = clock.afterTurn
  if (
    world !== store.getWorld() ||
    !scene.isCurrent() ||
    typeof original !== 'function' ||
    typeof record !== 'function'
  )
    throw Error('Current Scene and actual afterTurn caller required')
  const errors = [],
    visits = { initial: world.turn, first: null, last: world.turn, count: 0 }
  let closed = false,
    closedResult = null,
    started = !!baseline,
    input = null,
    removeInput = null
  const error = value => {
    if (errors.length < 16) errors.push(String(value?.stack ?? value).slice(0, 2048))
  }
  const snapshot = () => hutDismantleSnapshot(world, { ...ids, scene })
  let previous = snapshot()
  const initial = previous
  if (baseline) assertHutTimberLedger(baseline, previous)
  function observe() {
    if (closed) return
    try {
      if (world !== store.getWorld() || !scene.isCurrent()) throw Error('Stale Scene advanced')
      const current = snapshot()
      if (current.turn !== visits.last + 1)
        throw Error('Skipped or duplicate fixed-turn observation')
      visits.first ??= current.turn
      visits.last = current.turn
      visits.count++
      if (
        world.units.find(item => item.id === ids.workerId) !== worker ||
        (current.target && world.buildings.find(item => item.id === ids.targetId) !== target)
      )
        throw Error('Target or worker identity changed within the epoch')
      const before = previous
      previous = current
      if (started) {
        const delta = assertHutTimberVisit(baseline, before, current)
        if (
          delta.transferred ||
          delta.dropped.length ||
          !!before.target !== !!current.target ||
          before.worker.entry !== current.worker.entry
        )
          record({
            kind: 'work',
            ...delta,
            worker: current.worker,
            targetPresent: !!current.target,
          })
      }
    } catch (failure) {
      error(failure)
    }
  }
  function wrapped(...args) {
    try {
      return original.apply(this, args)
    } catch (failure) {
      error(failure)
      throw failure
    } finally {
      observe()
    }
  }
  clock.afterTurn = wrapped
  const api = {
    snapshot,
    initial: () => structuredClone(initial),
    armInput(button) {
      if (
        input ||
        removeInput ||
        started ||
        !button?.isConnected ||
        button.disabled ||
        button.getAttribute('aria-label') !== 'Dismantle hut'
      )
        throw Error('One available Dismantle hut control required')
      let before = null,
        identity = null
      const capture = event => {
        try {
          if (!event.isTrusted || (event.target !== button && !button.contains(event.target)))
            throw Error('Trusted target Dismantle click required')
          if (
            !button.isConnected ||
            button.disabled ||
            scene.buildingPanels.get(ids.targetId)?.lastElementChild !== button ||
            world !== store.getWorld() ||
            !scene.isCurrent()
          )
            throw Error('Dismantle input owner changed')
          if (before) throw Error('Repeated Dismantle click')
          before = snapshot()
          if (
            !before.presentation.record ||
            !before.presentation.panel ||
            before.presentation.panelHidden
          )
            throw Error('Actual pointer-dwell inspection panel required')
          identity = hutResidentIdentity(world, ids.workerId)
          input = { trusted: true, before, after: null, sameResidentPerson: null }
        } catch (failure) {
          error(failure)
        }
      }
      const after = () => {
        try {
          if (!input || !before || !identity) throw Error('Dismantle capture missing')
          input.after = snapshot()
          input.sameResidentPerson = identity()
          assertHutDismantleStarted(before, input.after, input.sameResidentPerson)
          baseline = before
          previous = input.after
          started = true
          record({
            kind: 'input',
            turn: before.turn,
            workerId: ids.workerId,
            targetId: ids.targetId,
          })
        } catch (failure) {
          error(failure)
        }
      }
      const add = button.addEventListener,
        remove = button.removeEventListener
      removeInput = () => {
        for (const [listener, capturing] of [
          [capture, true],
          [after, false],
        ]) {
          try {
            remove.call(button, 'click', listener, capturing)
          } catch (failure) {
            error(failure)
          }
        }
      }
      try {
        add.call(button, 'click', capture, true)
        add.call(button, 'click', after)
      } catch (failure) {
        removeInput()
        throw failure
      }
    },
    input: () => structuredClone(input),
    baseline: () => structuredClone(baseline),
    status() {
      const current = snapshot()
      if (!closed && (clock.afterTurn !== wrapped || current.turn !== visits.last))
        error(Error('Hut turn observer lost ownership or missed a visit'))
      return {
        closed,
        started,
        visits: { ...visits },
        errors: [...errors],
        current: {
          turn: current.turn,
          remaining: current.target?.remaining ?? 0,
          targetPresent: !!current.target,
          cargo: current.worker?.cargo ?? null,
          entry: current.worker?.entry ?? null,
          paused: current.paused,
          reservations: current.reservations,
          ...current.presentation,
        },
      }
    },
    finish() {
      if (closed) throw Error('Hut epoch is already closed')
      if (
        world !== store.getWorld() ||
        !scene.isCurrent() ||
        clock.afterTurn !== wrapped ||
        world.turn !== visits.last
      ) {
        error(Error('Hut finalize requires the current uninterrupted observer owner'))
        throw Error('Hut finalize ownership failed')
      }
      if (errors.length) throw Error('Hut finalize preserves prior observation errors')
      // End the dismantle-specific observation at the unchanged full completion
      // predicate, in this synchronous task. Later resting belongs to its own
      // controller and must not inherit command10 ownership requirements.
      const final = snapshot(),
        recovery = assertHutDismantleFinished(baseline, final)
      const observation = api.close()
      if (observation.errors.length) throw Error('Hut finalize cleanup failed')
      return { final, recovery, turn: final.turn }
    },
    close() {
      if (closedResult) return structuredClone(closedResult)
      if (!closed) {
        closed = true
        if (world.turn !== visits.last) error(Error('Unobserved turn before epoch cleanup'))
        try {
          if (clock.afterTurn !== wrapped) throw Error('Foreign afterTurn replacement preserved')
          if (descriptor) Object.defineProperty(clock, 'afterTurn', descriptor)
          else delete clock.afterTurn
        } catch (failure) {
          error(failure)
        }
        try {
          removeInput?.()
        } catch (failure) {
          error(failure)
        }
      }
      let final = null
      try {
        final = snapshot()
      } catch (failure) {
        error(failure)
      }
      closedResult = {
        initial,
        final,
        input: structuredClone(input),
        baseline: structuredClone(baseline),
        visits: { ...visits },
        closed,
        errors: [...errors],
      }
      return structuredClone(closedResult)
    },
  }
  return api
}

export function installHutDismantleRuntime({
  scene,
  store,
  ids,
  prototype,
  sceneRef,
  doc = document,
  maxEvents = 64,
}) {
  if (!Number.isInteger(maxEvents) || maxEvents < 1 || maxEvents > 64)
    throw Error('Meaningful-event bound must be 1–64')
  const epochs = [],
    events = [],
    boundaries = {},
    errors = []
  let start = null,
    overflow = false,
    closed = false,
    oldDisposed = null
  const record = event => {
    if (events.length >= maxEvents) {
      overflow = true
      throw Error('Hut meaningful-event capacity exceeded')
    }
    events.push({ epoch: epochs.length, ...event })
  }
  const attach = (scene, baseline = null) => {
    const epoch = createHutDismantleEpoch({ scene, store, ids, baseline, record })
    epochs.push(epoch)
    return epoch
  }
  attach(scene)
  const current = () => epochs.at(-1)
  const button = label => {
    const found = [...doc.querySelectorAll('button')].filter(
      item => item.textContent.trim() === label
    )
    if (found.length !== 1 || !found[0].isConnected || found[0].disabled)
      throw Error(`One public ${label} required`)
    return found[0]
  }
  const checkpoint = kind =>
    armTempleCheckpoint({
      kind,
      store,
      button: button(kind === 'save' ? 'Save checkpoint' : 'Load checkpoint'),
      snapshot: ({ world }) => hutDismantleSnapshot(world, ids),
    })
  return {
    status: () => ({
      epochs: epochs.length,
      current: current().status(),
      overflow,
      errors: [...errors],
      start: start?.evidence ?? null,
      oldDisposed,
    }),
    snapshot: () => current().snapshot(),
    armInput() {
      current().armInput(scene.buildingPanels.get(ids.targetId)?.lastElementChild)
    },
    input: () => current().input(),
    armSave() {
      if (boundaries.save) throw Error('Single Save required')
      boundaries.save = checkpoint('save')
    },
    async saved() {
      return {
        status: boundaries.save.status(),
        actual: await boundaries.save.digest(),
        expectedLoad: await boundaries.save.expectedLoadDigest(),
      }
    },
    armLoad() {
      if (boundaries.load || epochs.length !== 1) throw Error('Single in-session Load required')
      const oldWorld = store.getWorld(),
        baseline = current().baseline()
      if (!baseline) throw Error('Dismantle input must precede Load')
      boundaries.load = checkpoint('load')
      try {
        start = armBuildingSceneStart({
          prototype,
          store,
          expectedWorld: () => (store.getWorld() === oldWorld ? null : store.getWorld()),
          sceneRef,
          attach(next) {
            oldDisposed = scene.disposed === true
            const old = current().close()
            errors.push(...old.errors)
            attach(next, baseline)
          },
        })
      } catch (failure) {
        boundaries.load.close()
        throw failure
      }
    },
    async loaded() {
      return {
        status: boundaries.load.status(),
        digest: await boundaries.load.digest(),
        initial: current().initial(),
      }
    },
    finish() {
      if (
        closed ||
        overflow ||
        errors.length ||
        epochs.some(epoch => epoch.status().errors.length) ||
        Object.values(boundaries).some(boundary => boundary.status().errorCount) ||
        start?.evidence.errors.length ||
        start?.evidence.originalThrew
      )
        throw Error('Hut finalize preserves prior observer/checkpoint/start errors or overflow')
      if (
        epochs.length !== 2 ||
        !start?.evidence.attached ||
        !start?.evidence.restored ||
        !boundaries.save?.status().captured ||
        !boundaries.load?.status().captured
      )
        throw Error('Hut finalize requires the observed public Save/Load and Scene handoff')
      return current().finish()
    },
    close() {
      if (closed) return { closed, errors: [...errors], overflow, events: structuredClone(events) }
      closed = true
      for (const boundary of Object.values(boundaries)) {
        try {
          errors.push(...boundary.close().errors)
        } catch (failure) {
          errors.push(String(failure))
        }
      }
      try {
        start?.close()
      } catch (failure) {
        errors.push(String(failure))
      }
      const result = epochs.flatMap(epoch => {
        try {
          return [epoch.close()]
        } catch (failure) {
          errors.push(String(failure))
          return []
        }
      })
      errors.push(...result.flatMap(epoch => epoch.errors))
      return {
        closed,
        errors,
        overflow,
        events,
        epochs: result,
        start: structuredClone(start?.evidence ?? null),
        oldDisposed,
        boundaries: Object.fromEntries(
          Object.entries(boundaries).map(([kind, owner]) => [kind, owner.status()])
        ),
      }
    },
  }
}
