// Pure evidence reducer. It never creates, advances or changes a game World.
const requireEvidence = (value, message) => { if (!value) throw Error(message) }
const keys = (value, allowed) => requireEvidence(Object.keys(value).every(key => allowed.includes(key)), 'Unrecognized or seeded evidence field')
const clone = value => structuredClone(value)
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const moved = (a, b) => a.x !== b.x || a.y !== b.y
const short = n => (n << 16) >> 16
const browserPoint = p => ({ x: short(p.x - 2048) / 256, z: -short(p.y + 2048) / 256 })

export function createBlastEpisode(options) {
  keys(options, ['expectation', 'actorId', 'targetId', 'runId', 'sourceFingerprint', 'maxTurns'])
  const { expectation, actorId, targetId, runId, sourceFingerprint, maxTurns = 48 } = options
  requireEvidence(['baseline', 'candidate'].includes(expectation), 'Explicit baseline/candidate expectation required')
  requireEvidence(Number.isInteger(actorId) && Number.isInteger(targetId) && actorId !== targetId && runId && sourceFingerprint, 'Bound run and person identities required')
  requireEvidence(Number.isInteger(maxTurns) && maxTurns >= 12 && maxTurns <= 120, 'Bounded cast turn limit required')
  const rows = [], frames = [], errors = []
  let triggerTurn, triggerObservedAt, before, lastAfter, entry, release, hover, proposal, movement, arrival, impact, retired, windupMotion = false, flightMotion = false
  const fail = message => { errors.push(message); throw Error(message) }
  const check = (condition, message) => { if (!condition) fail(message) }
  function live(sample, targetRequired = true) {
    keys(sample, ['turn', 'level', 'playing', 'paused', 'speed', 'flags', 'sceneMatches', 'actor', 'target', 'stock', 'castCount', 'mana', 'random', 'shot', 'effects'])
    check(Number.isInteger(sample.turn) && sample.level === 2 && sample.playing && !sample.paused && sample.speed === 1 && !(sample.flags & 32) && sample.sceneMatches, 'Ordinary Mission2 clock/context changed')
    check(sample.actor?.id === actorId && sample.actor.same && sample.actor.hp > 0 && sample.actor.team === 'blue', 'Original Blue Shaman changed or disappeared')
    if (entry) check(sample.actor.position && entry.actor.position && sample.actor.position.x === entry.actor.position.x && sample.actor.position.y === entry.actor.position.y, 'Original Shaman moved during the cast')
    if (movement && targetRequired) check(sample.target.movementOrderSame, 'Original public movement order changed')
    if (targetRequired) check(sample.target?.id === targetId && sample.target.same && sample.target.team === 'blue' && sample.target.kind === 'brave' && sample.target.inside === null && sample.target.ownerValid, 'Original outdoor commanded Blue target changed or disappeared')
  }
  return {
    observingTurns: () => !!entry && !retired,
    trigger(turn, observedAt) {
      const prepared = expectation === 'baseline' ? proposal : hover
      check(triggerTurn === undefined && prepared && !entry && Number.isInteger(turn) && turn >= 0, 'One actual response trigger turn required after declared preparation')
      check(turn >= prepared.turn && Number.isFinite(observedAt), 'Prepared input and actual observation must precede the trigger')
      check(expectation === 'baseline' || frames.some(frame => frame.kind === 'hover' && frame.turn <= turn && frame.observedAt <= observedAt), 'A real validated hover frame must precede the response trigger')
      triggerTurn = turn; triggerObservedAt = observedAt
    },
    propose(value) {
      keys(value, ['kind', 'turn', 'targetId', 'mode', 'canvasOwned', 'hitId', 'context', 'position', 'previousTurn', 'previousPosition', 'idle', 'point'])
      check(expectation === 'baseline' && value.kind === 'proposed-pixel', 'Only baseline may use proposed-pixel evidence')
      check(!proposal && !hover && triggerTurn === undefined && !entry, 'One proposed pixel before the trigger required')
      check(Number.isInteger(value.turn) && value.turn >= 0 && Number.isInteger(value.point?.x) && Number.isInteger(value.point?.y), 'Actual proposal turn and integer pixel required')
      check(value.mode === 'blast' && value.targetId === targetId && value.hitId === targetId && value.canvasOwned && value.idle === true, 'A real idle person pixel in Blast mode is required')
      check(value.turn > value.previousTurn && !moved(value.position, value.previousPosition), 'Idle target moved or stationary sample repeated')
      proposal = clone(value)
    },
    hover(value) {
      keys(value, ['turn', 'targetId', 'mode', 'canvasOwned', 'hitId', 'visible', 'lines', 'context', 'position', 'previousTurn', 'previousPosition', 'idle', 'point', 'observedAt'])
      check(expectation === 'candidate', 'Only candidate uses actual hover evidence')
      check(!hover && triggerTurn === undefined && !entry, 'Hover may be accepted only once before the trigger')
      check(Number.isInteger(value.turn) && value.turn >= 0, 'Actual prospective hover turn required')
      check(value.mode === 'blast' && value.targetId === targetId && value.hitId === targetId && value.canvasOwned && value.idle === true, 'A real idle person hit in Blast mode is required')
      check(value.turn > value.previousTurn && !moved(value.position, value.previousPosition), 'Idle target moved or stationary sample repeated')
      check(value.visible && value.lines === 16, 'Expected visible hover feedback missing')
      check(Number.isFinite(value.observedAt) && Number.isFinite(value.point?.x) && Number.isFinite(value.point?.y), 'Actual hover point and observation time required')
      hover = clone(value)
    },
    release(value, sample) {
      keys(value, ['turn', 'targetId', 'mode', 'trusted', 'canvasOwned', 'context', 'handlerPersonId', 'handlerTerrain', 'stockBefore', 'castCountBefore', 'point', 'targetCheck', 'press', 'observedAt'])
      const prepared = expectation === 'baseline' ? proposal : hover
      check(prepared && !release, 'One delivered release must follow declared preparation')
      live(sample)
      check(value.turn >= triggerTurn && value.turn <= triggerTurn + 4, 'Actual response release window expired')
      check(sample.target.hp > 0, 'Ordinary setup requires a living response member at release')
      check(value.turn >= prepared.turn && sample.turn === value.turn && same(value.context, prepared.context) &&
        same(sample.target.position, prepared.position), 'Actual release pose, context or event-time sample differs from the preparation')
      if (expectation === 'candidate') {
        const frame = frames.find(frame => frame.kind === 'hover'), press = value.press
        check(frame && press?.trusted && press.canvasOwned && press.mode === 'blast' && press.targetSame && press.ownerValid &&
          Number.isInteger(press.turn) && Number.isFinite(press.observedAt) && Number.isFinite(value.observedAt) &&
          frame.turn <= press.turn && press.turn <= triggerTurn && value.turn >= triggerTurn &&
          frame.observedAt <= press.observedAt && press.observedAt <= triggerObservedAt && triggerObservedAt <= value.observedAt &&
          same(press.position, hover.position) && same(press.context, hover.context) && same(press.point, hover.point) && same(value.point, hover.point),
        'Natural hover frame must precede the actual matching press, trigger and release')
      }
      if (expectation === 'baseline') {
        check(same(value.point, proposal.point), 'Actual release pixel differs from proposed pixel')
        const delivered = value.targetCheck
        check(delivered?.range.phase === 'before-handler' && delivered.range.turn === value.turn && delivered.range.targetId === targetId && delivered.range.sameOriginal && delivered.range.targetError === null, 'Original proposed target is no longer in actual source range at release')
        check(delivered?.pixel.phase === 'after-handler-diagnostic' && delivered.pixel.turn === value.turn && delivered.pixel.personId === targetId && same(delivered.pixel.point, value.point), 'Original proposed target no longer owns the delivered pixel')
      }
      check(value.mode === 'blast' && value.targetId === targetId && value.trusted && value.canvasOwned, 'Actual trusted Blast release on the owned canvas required')
      check(expectation === 'candidate' ? value.handlerPersonId === targetId : value.handlerPersonId === null && value.handlerTerrain, 'Real handler pick does not match the declared phenotype')
      check(sample.shot && sample.shot.phase === 'windup' && sample.shot.remaining === 6 && sample.shot.caster === actorId, 'Release did not allocate one fresh Blast windup')
      check(sample.stock === value.stockBefore - 1 && sample.castCount === value.castCountBefore + 1, 'Cast payment/count was not observed at release')
      check(expectation === 'candidate' ? sample.shot.tracking?.personId === targetId : sample.shot.tracking === null, 'Allocated identity does not match expectation')
      entry = clone(sample); release = clone(value); rows.push({ stage: 'release', sample: clone(sample) })
    },
    move(value, sample) {
      keys(value, ['turn', 'mode', 'selected', 'trusted', 'canvasOwned', 'point', 'shotBefore', 'order', 'expected', 'handlerPoint', 'handlerPersonId', 'afterMode', 'afterSelected', 'ownerSame'])
      check(entry && release && !movement, 'One public movement must follow the accepted cast')
      live(sample)
      check(value.trusted && value.canvasOwned && value.mode === null && value.afterMode === null &&
        same(value.selected, [targetId]) && same(value.afterSelected, [targetId]), 'Ground movement lost ordinary mode or original selection')
      check(value.shotBefore?.id === entry.shot.id && value.shotBefore.phase === 'windup' && value.shotBefore.remaining > 0 &&
        sample.shot?.id === entry.shot.id && sample.castCount === entry.castCount, 'Movement was late or created another cast')
      check(value.handlerPersonId === null && value.handlerPoint && value.ownerSame && value.order?.model === 3 &&
        value.order.a === value.expected.a && value.order.b === value.expected.b && same(value.point, value.expected.pixel) &&
        (Math.round((value.handlerPoint.x + 8) * 256) & 65535) === value.expected.a &&
        (Math.round((-value.handlerPoint.z - 8) * 256) & 65535) === value.expected.b, 'Original person did not receive the declared ordinary ground move')
      check(value.turn === sample.turn && value.turn >= entry.turn && value.turn < entry.turn + 6, 'Movement must be delivered during the original windup')
      movement = clone(value)
    },
    before(sample) {
      if (!entry || retired) return
      check(!before, 'Repeated before sample without its matching after sample')
      live(sample)
      check(sample.turn === (lastAfter ?? entry.turn), 'Non-adjacent before turn')
      check(sample.turn - entry.turn < maxTurns, 'Cast exceeded bounded lifecycle')
      check(sample.shot?.id === entry.shot.id, 'Tracked projectile disappeared before observed impact')
      before = clone(sample)
    },
    after(sample) {
      if (!entry || retired) return
      check(before && sample.turn === before.turn + 1, 'Missing before or non-adjacent after sample')
      live(sample, before.shot.phase !== 'arrived')
      const a = before, b = sample, shot = b.shot
      check(b.castCount === entry.castCount, 'An additional cast contaminated this episode')
      if (a.shot.phase === 'windup') windupMotion ||= moved(a.target.position, b.target.position)
      if (a.shot.phase === 'flying') flightMotion ||= moved(a.target.position, b.target.position)
      if (shot) {
        check(shot.id === entry.shot.id, 'Projectile identity changed')
        if (a.shot.phase === 'windup') check(shot.remaining === a.shot.remaining - 1 && shot.phase === (shot.remaining ? 'windup' : 'flying'), 'Missing or reordered windup visit')
        else check(a.shot.phase === 'flying' && ['flying', 'arrived'].includes(shot.phase), 'Unexpected projectile phase transition')
        if (expectation === 'candidate') {
          check(shot.tracking?.personId === targetId && same(shot.tracking.destination, a.target.position), 'Parent did not follow the before-turn person position')
          if (shot.phase !== 'windup') check(shot.tracking.shotPersonId === targetId && same(shot.destination, a.target.position), 'Shot did not follow the same person')
        } else check(shot.tracking === null && same(shot.destination, entry.shot.destination) && same(shot.target, entry.shot.target), 'Baseline fixed point unexpectedly changed')
        if (shot.phase === 'arrived') {
          check(!arrival, 'Repeated arrival sample')
          arrival = { turn: b.turn, shot: clone(shot) }
        }
      } else {
        check(a.shot.phase === 'arrived' && arrival?.turn === a.turn, 'Projectile retired without observed arrival')
        const wave = b.effects.filter(e => e.kind === 'blastWave' && !a.effects.some(old => old.id === e.id))
        const flash = b.effects.filter(e => e.kind === 'blast' && !a.effects.some(old => old.id === e.id))
        check(wave.length === 1 && flash.length === 1, 'Actual new wave and impact effect were not observed')
        const expected = expectation === 'candidate' ? browserPoint(a.target.position) : entry.shot.target
        check(same(wave[0].point, expected) && same(flash[0].point, expected), 'Impact did not use the parent destination on its impact visit')
        impact = { turn: b.turn, expected, wave: clone(wave[0]), flash: clone(flash[0]) }; retired = b.turn
      }
      rows.push({ stage: 'turn', before: a, after: clone(b) }); lastAfter = b.turn; before = null
    },
    frame(value) {
      keys(value, ['turn', 'kind', 'targetId', 'visible', 'lines', 'pixels', 'effectId', 'position', 'context', 'point', 'renderFrame', 'observedAt', 'targetSame', 'ownerValid', 'phase', 'shotId', 'drawNow', 'ackUntil'])
      check(['hover', 'ack', 'projectile', 'impact'].includes(value.kind), 'Unknown frame evidence')
      if (value.kind === 'hover') check(triggerTurn === undefined && !release, 'Natural hover frame must be recorded before the trigger')
      if (frames.some(frame => frame.kind === value.kind)) return
      check(value.visible && value.pixels > 0, 'Rendered feedback pixels are missing')
      if (value.kind === 'hover' || value.kind === 'ack') {
        check(value.targetId === targetId && value.lines === (value.kind === 'ack' ? 32 : 16), 'Wrong person or bracket phase')
        if (value.kind === 'hover') check(hover && value.targetSame && value.ownerValid && value.turn >= hover.turn && Number.isInteger(value.renderFrame) && value.renderFrame >= 0 &&
          Number.isFinite(value.observedAt) && value.observedAt >= hover.observedAt && same(value.position, hover.position) &&
          same(value.context, hover.context) && same(value.point, hover.point), 'Natural hover frame pose/context/pixel or chronology differs')
        else {
          check(release && value.turn >= release.turn, 'Acknowledgment precedes its actual release')
          const observed = value.turn === entry.turn ? entry : rows.find(row => row.stage === 'turn' && row.after.turn === value.turn)?.after
          check(value.targetSame && value.ownerValid && observed?.target.same && observed.target.ownerValid &&
            same(value.position, observed.target.position) && same(value.context, release.context) &&
            Number.isInteger(value.renderFrame) && value.renderFrame >= 0 && Number.isFinite(value.observedAt) &&
            Number.isFinite(value.drawNow) && Number.isFinite(value.ackUntil) && value.drawNow < value.ackUntil &&
            value.observedAt >= release.observedAt && value.drawNow <= value.observedAt && value.ackUntil > release.observedAt,
          'Acknowledgment lacks its actual natural HUD time, original target pose or context')
        }
      }
      if (value.kind === 'projectile') {
        const observed = rows.find(row => row.stage === 'turn' && row.after.turn === value.turn)?.after.shot
        check(observed && Number.isInteger(value.renderFrame) && value.renderFrame >= 0 && ['flying', 'arrived'].includes(value.phase) && observed.phase === value.phase &&
          value.shotId === entry.shot.id && observed.id === value.shotId && observed.visualIds[0] === value.effectId,
        'Natural projectile frame lacks the actual owned shot, visible phase or visual identity')
      }
      if (value.kind === 'impact') check(impact && value.turn >= impact.turn && value.effectId === impact.flash.id, 'Rendered impact is stale or absent')
      frames.push(clone(value))
    },
    report(...args) {
      requireEvidence(args.length === 0, 'Cannot seed a success report')
      const required = expectation === 'candidate' ? ['hover', 'ack', 'projectile', 'impact'] : ['projectile', 'impact']
      const complete = !!(entry && release && movement && arrival && impact && retired && windupMotion && flightMotion && !before && !errors.length && required.every(kind => frames.some(f => f.kind === kind)))
      return clone({ version: 1, expectation, runId, sourceFingerprint, triggerTurn, triggerObservedAt, actorId, targetId, complete, errors, hover, proposal, release, movement, entry, arrival, impact, retired, windupMotion, flightMotion, rows, frames,
        limits: 'Ordinary rendered browser episode only when accompanied by the harness receipt and retained frame files. No original execution, full parity, hardware performance, ground comparison or save/reload claim.' })
    },
    error(error) { errors.push(String(error?.stack ?? error)) },
  }
}
