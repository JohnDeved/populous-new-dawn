import { observeEntityPointer } from '../../qa/erosion-ordinary/input.mjs'

export const templeManualBounds = Object.freeze({
  segmentMs: 15000,
  totalMs: 30000,
  rows: 2048,
  exportBytes: 8 * 1024 * 1024,
})
const require = (condition, message) => {
  if (!condition) throw Error(message)
}
const released = s => !s.record && !s.latch && s.reservations === 0 && !s.dom.present

// Observe actual callers only. The supplied snapshot is the maintained training
// epoch's read-only snapshot, so both observations use the same record identities.
export function createTempleManualObservation({
  scene,
  snapshot,
  mode,
  doc = document,
  pointerObserver = observeEntityPointer,
  maxRows = templeManualBounds.rows,
}) {
  require(['expiry', 'approach'].includes(mode), 'Finite Temple manual segment required')
  require(Number.isInteger(maxRows) &&
    maxRows > 0 &&
    maxRows <= templeManualBounds.rows, 'Finite manual row bound required')
  const targetId = snapshot().target.id,
    controller = scene.tooltipController,
    rows = [],
    errors = [],
    restorers = []
  let closed = false,
    taken = false,
    pointer = null,
    input = null,
    firstDisplay = null,
    creation = null,
    reuse = null,
    request = null,
    heldVisits = 0,
    release = null,
    terminal = null,
    firstFrame = null,
    terminalKind = null,
    rowBytes = 0
  const read = () => ({
    ...snapshot(),
    inspection: {
      selected: scene.objectPanels.buildingInspected,
      held: scene.objectPanels.buildingHeldPointer,
    },
    controller: {
      category: controller.category,
      key: controller.key,
      dwell: controller.dwell,
      threshold: controller.session.threshold,
      sample: controller.session.sample,
      visits: controller.session.visits,
      lastVisit: controller.lastVisit && structuredClone(controller.lastVisit),
      output: { ...controller.output },
    },
    name: {
      hidden: scene.tooltipElement?.hidden ?? true,
      text: scene.tooltipElement?.getAttribute?.('aria-label') ?? null,
    },
  })
  const initial = read()
  const finishInput = () => {
    if (pointer) {
      input = pointer.finish()
      pointer = null
      errors.push(...input.errors)
    }
    return input
  }
  const detach = () => {
    if (closed) return
    closed = true
    try {
      finishInput()
    } catch (failure) {
      errors.push(String(failure?.stack ?? failure))
    }
    for (const restore of restorers.reverse())
      try {
        restore()
      } catch (failure) {
        errors.push(String(failure?.stack ?? failure))
      }
  }
  const fail = failure => {
    errors.push(String(failure?.stack ?? failure))
    try {
      terminal ??= read()
    } catch (problem) {
      errors.push(String(problem?.stack ?? problem))
    }
    detach()
  }
  const push = row => {
    require(rows.length < maxRows, 'Temple manual row cap exceeded')
    const next = { ordinal: rows.length + 1, ...row }
    const bytes = new TextEncoder().encode(JSON.stringify(next)).byteLength
    require(rowBytes + bytes <=
      templeManualBounds.exportBytes / 2, 'Temple manual row byte cap exceeded')
    rowBytes += bytes
    rows.push(next)
    return next
  }
  const validateInput = () => {
    finishInput()
    require(input?.restored && !input.errors.length, 'Manual pointer observation must restore')
    require(input.events.length === 2, 'Exactly one manual right-down/right-up pair required')
    const down = input.events[0],
      picks = down.picks.filter(
        pick => pick.owner === 'scene' && ['pickUnit', 'pickWorldObject'].includes(pick.name)
      )
    require(picks.length === 2 &&
      picks[0].name === 'pickUnit' &&
      picks[0].id === null &&
      picks[1].name === 'pickWorldObject' &&
      picks[1].id === targetId, 'Actual right-down must miss a person and pick this Temple')
    for (const pick of picks)
      require(pick.receiverMatches &&
        !pick.threw &&
        JSON.stringify(pick.args) ===
          JSON.stringify(down.args), 'Actual right-down picker receiver or input changed')
    const inspected = mode === 'expiry' ? reuse : creation
    require(inspected &&
      inspected.args[2] === inspected.after.inspection.held &&
      release?.args[0] ===
        inspected.args[2], 'Actual controller press and release pointer must match')
    for (const [index, event] of input.events.entries()) {
      require(event.type === ['pointerdown', 'pointerup'][index], 'Manual pointer order mismatch')
      require(event.trusted &&
        event.canvasTarget &&
        event.canvasOwned &&
        event.button === 2, 'Trusted owned canvas right-button input required')
      require(['ctrlKey', 'shiftKey', 'altKey', 'metaKey'].every(
        key => !event.args[key]
      ), 'Unmodified manual input required')
    }
  }
  const complete = (kind, after) => {
    require(!errors.length && !closed, 'Manual endpoint cannot complete after an error')
    require(after.current &&
      after.level === 3 &&
      after.speed === 1 &&
      !after.paused &&
      after.status === 'playing' &&
      after.shamanAlive &&
      !after.inputMask &&
      after.target?.id === targetId &&
      after.target.identity === initial.target.identity &&
      after.target.hp > 0 &&
      after.target.progress >= 1, 'Current living Temple and uninterrupted ordinary game required')
    require(creation &&
      creation.after.record.hold === 16, 'Actual fresh manual allocation required')
    require(creation.after.record.automatic === false, 'Creation must precede automatic ownership')
    require(creation.before.record === null &&
      creation.after.record.phase === -1 &&
      creation.after.record.remaining ===
        0, 'Fresh manual allocation must be captured before the creating controller step')
    validateInput()
    if (kind === 'expiry') {
      require(firstDisplay && firstFrame, 'Genuine first name display and rendered frame required')
      require(reuse &&
        reuse.after.record.identity ===
          creation.after.record.identity, 'Same manual record reuse required')
      require(release && heldVisits >= 4, 'Held renewal and actual matching release required')
      require(released(after), 'Complete manual retirement endpoint required')
      require(after.target.builders.every(id => !id) &&
        !after.target.workers.length &&
        !after.target.admission.inside &&
        after.target.admission.occupants.every(id => !id) &&
        !after.target.admission.queueHead &&
        !after.target.admission.queueFrom &&
        !after.target.admission.entering, 'Empty Temple endpoint required')
      require(!(after.target.admission.activity & 128) &&
        !after.trained, 'Idle manual segment started training')
    } else {
      require(request && request.result === 'automatic:reused', 'Actual automatic reuse required')
      require(request.before.record?.identity ===
        creation.after.record.identity, 'Automatic producer replaced manual identity')
      require(request.before.record.automatic === false &&
        request.after.record.automatic, 'Actual manual-to-automatic transition required')
      for (const key of ['identity', 'phase', 'remaining', 'hold'])
        require(request.after.record[key] ===
          request.before.record[key], `Automatic reuse reset ${key}`)
      require(!request.before.latch &&
        request.after.latch &&
        request.after.reservations === 1, 'Automatic successful-request ownership required')
    }
    terminal = after
    terminalKind = kind
    // Validate and detach in the same synchronous caller, before later gameplay.
    detach()
  }
  const wrap = (owner, key, kind, relevant = () => true) => {
    const descriptor = Object.getOwnPropertyDescriptor(owner, key),
      original = owner[key]
    require(typeof original === 'function', `Missing actual manual caller ${key}`)
    function replacement(...args) {
      const observe = !closed && relevant(args)
      let before
      if (observe)
        try {
          before = read()
        } catch (failure) {
          fail(failure)
        }
      let result
      try {
        result = original.apply(this, args)
      } catch (failure) {
        if (observe && !closed) fail(failure)
        throw failure
      }
      if (observe && !closed)
        try {
          const after = read(),
            row = push({
              kind,
              args,
              before,
              after,
              result: result ?? null,
              receiverMatches: this === owner,
            })
          if (kind === 'inspect' && args[1] !== 'automatic') {
            if (result === `${args[1]}:created`) creation ??= row
            if (result === 'explicit:reused') reuse ??= row
          }
          if (
            kind === 'release' &&
            before.inspection.held === args[0] &&
            after.inspection.held === null
          )
            release ??= row
          if (kind === 'visit') {
            if (after.controller.lastVisit?.firstDisplay === targetId) firstDisplay ??= row
            if (
              before.inspection.held !== null &&
              after.inspection.held === before.inspection.held &&
              after.record?.phase === 1 &&
              after.record.remaining === 15 &&
              after.offTarget
            )
              heldVisits++
            if (mode === 'expiry' && creation && release && released(after))
              complete('expiry', after)
          }
          if (kind === 'request') {
            request ??= row
            require(mode === 'approach', 'Automatic activity interrupted idle manual segment')
            complete('approach', after)
          }
          if (
            kind === 'paint' &&
            !firstFrame &&
            firstDisplay &&
            after.dom.present &&
            !after.dom.hidden &&
            !after.name.hidden
          ) {
            const canvas = scene.buildingPanels.get(targetId)?.querySelector('canvas')
            require(canvas, 'Manual panel canvas missing')
            firstFrame = { snapshot: after, panel: canvas.toDataURL('image/png') }
          }
        } catch (failure) {
          fail(failure)
        }
      return result
    }
    owner[key] = replacement
    restorers.push(() => {
      require(owner[key] === replacement, `Foreign replacement of manual ${key}; preserved`)
      if (descriptor) Object.defineProperty(owner, key, descriptor)
      else delete owner[key]
    })
  }
  try {
    wrap(scene.objectPanels, 'inspectBuilding', 'inspect', args => args[0] === targetId)
    wrap(scene.objectPanels, 'releaseBuildingButton', 'release')
    wrap(scene.objectPanels, 'requestAutomaticTraining', 'request', args => args[0] === targetId)
    wrap(scene, 'updateTooltipController', 'visit')
    // Paint observations need only the first relevant frame, not every RAF.
    wrap(scene, 'renderBuildingPanels', 'paint', () => !firstFrame && !!firstDisplay)
  } catch (failure) {
    fail(failure)
    throw new AggregateError(
      errors.map(message => Error(message)),
      errors.join('\n')
    )
  }
  return {
    armInput() {
      require(!closed && !pointer && !input, 'One owned manual pointer pair required')
      pointer = pointerObserver(scene, doc, { id: targetId, collection: 'buildings' })
    },
    finishInput,
    status() {
      const current = closed ? terminal : read()
      return {
        closed,
        complete: terminalKind,
        errors: [...errors],
        count: rows.length,
        created: !!creation,
        reused: !!reuse,
        heldVisits,
        released: !!release,
        frame: !!firstFrame,
        firstDisplay: !!firstDisplay,
        turn: current?.turn ?? null,
        category: current?.controller.category ?? null,
        selectedCount: current?.selected.length ?? null,
        recordIdentity: current?.record?.identity ?? null,
        phase: current?.record?.phase ?? null,
        remaining: current?.record?.remaining ?? null,
      }
    },
    take() {
      require(!taken, 'Manual evidence may be exported only once')
      taken = true
      if (!closed) {
        terminal = read()
        detach()
      }
      const result = {
        mode,
        targetId,
        initial,
        terminal,
        terminalKind,
        closed,
        errors: [...errors],
        creation,
        reuse,
        release,
        request,
        firstDisplay,
        heldVisits,
        firstFrame,
        input,
        rows,
      }
      require(new TextEncoder().encode(JSON.stringify(result)).byteLength <=
        templeManualBounds.exportBytes, 'Manual evidence export exceeds byte cap')
      return result
    },
  }
}
