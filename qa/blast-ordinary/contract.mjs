// Pure evidence reducer. It never creates, advances or changes a game World.
const require = (value, message) => { if (!value) throw Error(message) }
const keys = (value, allowed) => require(Object.keys(value).every(key => allowed.includes(key)), 'Unrecognized or seeded evidence field')
const clone = value => structuredClone(value)
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const moved = (a, b) => a.x !== b.x || a.y !== b.y
const short = n => (n << 16) >> 16
const browserPoint = p => ({ x: short(p.x - 2048) / 256, z: -short(p.y + 2048) / 256 })

export function createBlastEpisode(options) {
  keys(options, ['expectation', 'actorId', 'targetId', 'runId', 'sourceFingerprint', 'maxTurns', 'triggerTurn'])
  const { expectation, actorId, targetId, runId, sourceFingerprint, maxTurns = 48, triggerTurn } = options
  require(['baseline', 'candidate'].includes(expectation), 'Explicit baseline/candidate expectation required')
  require(Number.isInteger(actorId) && Number.isInteger(targetId) && actorId !== targetId && runId && sourceFingerprint, 'Bound run and person identities required')
  require(Number.isInteger(maxTurns) && maxTurns >= 12 && maxTurns <= 120, 'Bounded cast turn limit required')
  require(Number.isInteger(triggerTurn) && triggerTurn >= 0, 'Actual response trigger turn required')
  const rows = [], frames = [], errors = []
  let before, lastAfter, entry, release, hover, arrival, impact, retired, windupMotion = false, flightMotion = false
  const fail = message => { errors.push(message); throw Error(message) }
  const check = (condition, message) => { if (!condition) fail(message) }
  function live(sample, targetRequired = true) {
    keys(sample, ['turn', 'level', 'playing', 'paused', 'speed', 'flags', 'sceneMatches', 'actor', 'target', 'stock', 'castCount', 'mana', 'random', 'shot', 'effects'])
    check(Number.isInteger(sample.turn) && sample.level === 2 && sample.playing && !sample.paused && sample.speed === 1 && !(sample.flags & 32) && sample.sceneMatches, 'Ordinary Mission2 clock/context changed')
    check(sample.actor?.id === actorId && sample.actor.same && sample.actor.hp > 0 && sample.actor.team === 'blue', 'Original Blue Shaman changed or disappeared')
    if (targetRequired) check(sample.target?.id === targetId && sample.target.same && sample.target.team === 'green' && sample.target.kind === 'warrior' && sample.target.inside === null && sample.target.ownerValid, 'Original outdoor response target changed or disappeared')
  }
  return {
    hover(value) {
      keys(value, ['turn', 'targetId', 'mode', 'canvasOwned', 'hitId', 'visible', 'lines', 'context', 'position', 'previousTurn', 'previousPosition', 'orderModel'])
      check(!hover && !entry, 'Hover may be accepted only once')
      check(value.turn >= triggerTurn && value.turn <= triggerTurn + 4, 'Response release window expired')
      check(value.mode === 'blast' && value.targetId === targetId && value.hitId === targetId && value.canvasOwned && value.orderModel === 19, 'A real response person hit in Blast mode is required')
      check(value.turn > value.previousTurn && moved(value.position, value.previousPosition), 'Target was stopped or motion sample repeated')
      check(expectation === 'candidate' ? value.visible && value.lines === 16 : !value.visible, 'Expected visible hover feedback missing or baseline phenotype changed')
      hover = clone(value)
    },
    release(value, sample) {
      keys(value, ['turn', 'targetId', 'mode', 'trusted', 'canvasOwned', 'context', 'handlerPersonId', 'handlerTerrain', 'stockBefore', 'castCountBefore'])
      check(hover && !release, 'One delivered release must follow an observed hover')
      live(sample)
      check(value.turn >= triggerTurn && value.turn <= triggerTurn + 4, 'Actual response release window expired')
      check(sample.target.hp > 0, 'Ordinary setup requires a living response member at release')
      check(value.turn >= hover.turn && value.turn <= hover.turn + 1 && same(value.context, hover.context), 'Stale pointer or changed input context')
      check(value.mode === 'blast' && value.targetId === targetId && value.trusted && value.canvasOwned, 'Actual trusted Blast release on the owned canvas required')
      check(expectation === 'candidate' ? value.handlerPersonId === targetId : value.handlerPersonId === null && value.handlerTerrain, 'Real handler pick does not match the declared phenotype')
      check(sample.shot && sample.shot.phase === 'windup' && sample.shot.remaining === 6 && sample.shot.caster === actorId, 'Release did not allocate one fresh Blast windup')
      check(sample.stock === value.stockBefore - 1 && sample.castCount === value.castCountBefore + 1, 'Cast payment/count was not observed at release')
      check(expectation === 'candidate' ? sample.shot.tracking?.personId === targetId : sample.shot.tracking === null, 'Allocated identity does not match expectation')
      entry = clone(sample); release = clone(value); rows.push({ stage: 'release', sample: clone(sample) })
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
      keys(value, ['turn', 'kind', 'targetId', 'visible', 'lines', 'pixels', 'effectId'])
      check(['hover', 'ack', 'arrival', 'impact'].includes(value.kind), 'Unknown frame evidence')
      if (frames.some(frame => frame.kind === value.kind)) return
      check(value.visible && value.pixels > 0, 'Rendered feedback pixels are missing')
      if (value.kind === 'hover' || value.kind === 'ack') {
        check(value.targetId === targetId && value.lines === (value.kind === 'ack' ? 32 : 16), 'Wrong person or bracket phase')
        check(value.kind === 'hover' ? hover && !entry && value.turn >= hover.turn && value.turn <= hover.turn + 1 : release && value.turn >= release.turn && value.turn <= release.turn + 3, 'Stale bracket frame or missing input phase')
      }
      if (value.kind === 'arrival') check(arrival && value.turn === arrival.turn && arrival.shot.visualIds.includes(value.effectId), 'Rendered arrival is stale or absent')
      if (value.kind === 'impact') check(impact && value.turn >= impact.turn && value.effectId === impact.flash.id, 'Rendered impact is stale or absent')
      frames.push(clone(value))
    },
    report(...args) {
      require(args.length === 0, 'Cannot seed a success report')
      const required = expectation === 'candidate' ? ['hover', 'ack', 'arrival', 'impact'] : ['arrival', 'impact']
      const complete = !!(entry && release && arrival && impact && retired && windupMotion && flightMotion && !before && !errors.length && required.every(kind => frames.some(f => f.kind === kind)))
      return clone({ version: 1, expectation, runId, sourceFingerprint, triggerTurn, actorId, targetId, complete, errors, hover, release, entry, arrival, impact, retired, windupMotion, flightMotion, rows, frames,
        limits: 'Ordinary rendered browser episode only when accompanied by the harness receipt and retained frame files. No original execution, full parity, hardware performance, ground comparison or save/reload claim.' })
    },
    error(error) { errors.push(String(error?.stack ?? error)) },
  }
}
