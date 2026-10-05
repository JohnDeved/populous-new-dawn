import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, relative, sep } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

// One deliberately staged composition row. This is not ordinary worship or
// natural simultaneous completion. The only fixture writes are three createGift
// calls and their phase/remaining overrides, in two synchronous transactions.
const application = 'cfa86a32f03d021cd1ad725eed9f458ab239d56b'
const inputManifestSha256 = 'a35c75da2dabcc2d21e8498548752e61ebf3ab13c1d5b248710b1223363199c5'
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const json = value => JSON.stringify(value, (_key, item) =>
  typeof item === 'number' && !Number.isFinite(item) ? String(item) : item, 2) + '\n'

async function install(page, inputs) {
  await page.evaluate(async inputs => {
    // Independent read-only atlas decode; it never uses the renderer's cached
    // sprite canvas or texture object as the expected pixel source.
    const effectsAtlas = new Image()
    effectsAtlas.src = '/original/effects.png'
    await effectsAtlas.decode()
    if (effectsAtlas.naturalWidth !== inputs.effects.width || effectsAtlas.naturalHeight !== inputs.effects.height)
      throw Error('Independent effects-atlas dimensions do not match pinned metadata')
    const { createGift } = await import('/app/model.ts'),
      { worshipHandoffGeometry, worshipDrawPoint, interpolateWorshipPoint, worshipTargetPoint } =
        await import('/app/worship-acquisition-layout.ts'),
      scene = window.testSceneRef.current, world = scene.world,
      presentation = scene.worshipPresentation, canvas = presentation.canvas,
      context = canvas.getContext('2d'), oracle = document.createElement('canvas').getContext('2d'),
      alphaOracle = document.createElement('canvas').getContext('2d'),
      restorers = [], fixtures = [], seen = new Set()
    if (world !== window.testStore.getWorld() || world.outcome.level !== 1 || world.paused ||
        world.gifts.length || world.worshipAcquisition.requests.length ||
        world.worshipAcquisition.controllers.spell || !canvas.hidden)
      throw Error('Staged row requires a fresh, unpaused M1 with empty acquisition state')
    if (innerWidth !== 960 || innerHeight !== 720 || devicePixelRatio !== 1)
      throw Error('This finite composition row requires 960x720 at DPR1')
    const evidence = window.stagedWorshipComposition = {
      label: 'STAGED COMPOSITION: older Lightning pulse plus winning Bridge body',
      armedTurn: world.turn, mutations: [], handoffs: [], selects: [], samples: [],
      firstReplacementVisit: null, decodedBody: null, errors: [], cues: 0, visits: 0,
      pairStaged: false, samplesComplete: false, completed: false, restored: false,
      replacementDraws: [],
      turns: [], arrival: null, retirement: null, terminal: null,
      spriteProofs: { ghost: null, tint: null }, spriteProofAttempts: { ghost: false, tint: false },
    }
    const copy = value => structuredClone(value)
    const serialize = value => JSON.stringify(value, (_key, item) =>
      typeof item === 'number' && !Number.isFinite(item) ? String(item) : item)
    const require = (condition, message) => { if (!condition) throw Error(message) }
    const observe = fn => { try { return fn() } catch (error) {
      if (evidence.errors.length < 16) evidence.errors.push(String(error.stack ?? error))
    } }
    const focus = () => copy({ turn: world.turn, paused: world.paused, mode: world.mode,
      gifts: world.gifts.filter(g => fixtures.includes(g.id)), acquisition: world.worshipAcquisition,
      shots: world.shots, giftCounts: world.giftCounts,
      gameplayRandom: world.randomState, cosmeticRandom: world.cosmeticRandom })
    const lifecycle = () => copy({ turn: world.turn, paused: world.paused,
      gifts: world.gifts.filter(g => fixtures.includes(g.id)).map(g => ({ id: g.id, reward: g.reward, phase: g.phase, remaining: g.remaining })),
      effects: world.effects.filter(g => fixtures.includes(g.id)).map(g => g.id),
      shots: { bridge: world.shots.bridge, lightning: world.shots.lightning },
      giftCounts: { bridge: world.giftCounts.bridge, lightning: world.giftCounts.lightning },
      requests: world.worshipAcquisition.requests,
      active: Object.fromEntries(['spell', 'companion', 'pulse'].map(key => [key, !!world.worshipAcquisition.controllers[key]?.active])),
      commands: world.worshipAcquisition.controllers.drawCommands.length, hidden: canvas.hidden })
    const wrap = (owner, key, factory) => {
      const own = Object.hasOwn(owner, key), original = owner[key], replacement = factory(original)
      owner[key] = replacement
      restorers.push(() => {
        require(owner[key] === replacement, `Observer ownership changed: ${key}`)
        if (own) owner[key] = original; else delete owner[key]
      })
    }
    const headFor = reward => {
      const matching = world.shrines.filter(h => h.kind === reward && h.ordinarySpellReward)
      require(matching.length === 1, `Expected exactly one authored ${reward} source`)
      return matching[0]
    }
    // Native phase-ready boundary is phase1/timer77, then the real object turn
    // produces phase0/timer76 and requests. No queue/controller/clock/RNG writes.
    const stage = (label, rewards) => {
      require(evidence.mutations.length < 2 && fixtures.length + rewards.length <= 3, 'Fixture write bound exceeded')
      const started = performance.now(), omitted = () => Object.fromEntries(Object.entries(world).filter(([key]) => !['nextId', 'effects', 'gifts'].includes(key))),
        unchangedBefore = serialize(omitted()), effectsBefore = serialize(world.effects), giftsBefore = serialize(world.gifts),
        before = { nextId: world.nextId, effectsLength: world.effects.length, giftsLength: world.gifts.length }, beforeFocus = focus(),
        writes = []
      require(unchangedBefore.length <= 64_000_000, 'Fixture audit exceeds 64 MB source-state bound')
      for (const reward of rewards) {
        const head = headFor(reward), gift = createGift(world, reward, head, 0, head.ordinarySpellReward), initial = copy(gift)
        gift.phase = 1
        gift.remaining = 77
        fixtures.push(gift.id)
        writes.push({ source: copy({ id: head.id, kind: head.kind, x: head.x, z: head.z,
          ordinarySpellReward: head.ordinarySpellReward }), initial, final: copy(gift),
          overrides: [{ field: 'phase', before: 6, after: 1 }, { field: 'remaining', before: 82, after: 77 }] })
      }
      require(serialize(omitted()) === unchangedBefore, 'Fixture changed World outside nextId/effects/gifts')
      require(serialize(world.effects.slice(0, before.effectsLength)) === effectsBefore, 'Fixture changed a pre-existing effect')
      require(serialize(world.gifts.slice(0, before.giftsLength)) === giftsBefore, 'Fixture changed a pre-existing gift')
      require(world.nextId === before.nextId + rewards.length, 'Unexpected createGift ID allocation')
      require(world.effects.length === before.effectsLength + rewards.length && world.gifts.length === before.giftsLength + rewards.length,
        'Unexpected createGift array mutation')
      require(world.gifts.slice(before.giftsLength).every((gift, i) => gift === world.effects[before.effectsLength + i]),
        'Gift/effect alias ownership changed')
      evidence.mutations.push({ label, turn: world.turn, before, beforeFocus, afterFocus: focus(),
        after: { nextId: world.nextId, effectsLength: world.effects.length, giftsLength: world.gifts.length },
        writes, unchangedWorldOutsideWhitelist: true, auditedUnchangedBytes: unchangedBefore.length, auditMilliseconds: performance.now() - started })
    }
    let operation = 'outside', drawing = null, beforeTurn = null
    wrap(scene, 'onSound', original => function (...args) {
      const result = original.apply(this, args)
      if (args[0] === 0x71) evidence.cues++
      return result
    })
    const measuredCard = (measurement, model) => {
      if (!measurement) return null
      const shell = scene.container.parentElement.getBoundingClientRect(), target = measurement.targetRect,
        cards = [...document.querySelectorAll('.spell-card')].flatMap(button => {
          const fiber = button[Object.keys(button).find(key => key.startsWith('__reactFiber'))],
            rect = button.getBoundingClientRect(), actual = { x: rect.x - shell.x, y: rect.y - shell.y, width: rect.width, height: rect.height }
          return ['x', 'y', 'width', 'height'].every(key => Math.abs(actual[key] - target[key]) < 1e-5)
            ? [{ label: button.getAttribute('aria-label'), title: button.title, connected: button.isConnected, rect: actual,
              reactKey: fiber?.key, exactHostElement: fiber?.stateNode === button }] : []
        })
      require(cards.length === 1, 'Measurement must match exactly one connected real React spell card')
      // page.tsx independently keys each host button with SPELLS.id. Reading the
      // actual element's key also identifies undiscovered cards, whose public
      // labels are deliberately indistinguishable. No bridge ref/map is reused.
      const expectedKey = { 3: 'lightning', 12: 'bridge' }[model]
      require(expectedKey && cards[0].exactHostElement && cards[0].reactKey === expectedKey,
        `Measured model ${model} points to wrong React host key: ${cards[0].reactKey}`)
      return cards[0]
    }
    wrap(presentation.bridge, 'select', original => function (...args) {
      const before = observe(focus), result = original.apply(this, args)
      observe(() => {
        require(evidence.selects.length < 8, 'Select observation bound exceeded')
        // select runs before initializer. The request drain order is independently
        // asserted below; resolve its matching fixture from the pending operation.
        const gift = world.gifts.find(g => fixtures.includes(g.id) && g.ordinaryWorship.model === args[0] &&
          (operation === 'pair-drain' ? g.id !== fixtures[0] : true)), anchor = gift && presentation.anchors.get(gift.id)
        evidence.selects.push({ operation, model: args[0], giftId: gift?.id, before, measurement: copy(result),
          card: measuredCard(result, args[0]), expectedGeometry: result ? worshipHandoffGeometry(result, anchor) : null })
      })
      return result
    })
    wrap(scene.gameClock, 'beforeTurn', original => function (...args) {
      beforeTurn = observe(lifecycle)
      return original.apply(this, args)
    })
    wrap(scene.gameClock, 'afterTurn', original => function (...args) {
      const queued = [...world.worshipAcquisition.requests], before = queued.length ? observe(focus) : null,
        visits = evidence.visits, previousOperation = operation
      if (queued.length) operation = evidence.handoffs.length ? 'pair-drain' : 'old-drain'
      let result
      try { result = original.apply(this, args) } finally { operation = previousOperation }
      if (queued.length) observe(() => {
        require(evidence.handoffs.length < 2, 'Handoff transaction bound exceeded')
        evidence.handoffs.push({ queued, before, after: focus(), uiVisitsBefore: visits, uiVisitsAfter: evidence.visits })
      })
      if (!evidence.completed) observe(() => {
        require(beforeTurn && evidence.turns.length < 128, 'Original turn observation missing or exceeds 128-turn bound')
        evidence.turns.push({ before: beforeTurn, after: lifecycle() })
        beforeTurn = null
      })
      return result
    })
    wrap(scene.gameClock, 'worshipVisit', original => function (...args) {
      const previousOperation = operation, beforeVisit = evidence.handoffs.length === 2 && !evidence.arrival ? observe(lifecycle) : null
      operation = 'ui-visit'
      let result
      try { result = original.apply(this, args) } finally { operation = previousOperation }
      evidence.visits++
      observe(() => {
        const a = world.worshipAcquisition, c = a.controllers
        if (beforeVisit) {
          const beforeGift = beforeVisit.gifts.find(g => g.id === fixtures[1]), gift = world.gifts.find(g => g.id === fixtures[1])
          if (beforeGift?.remaining > 1 && gift?.remaining === 1) evidence.arrival = { before: beforeVisit, after: lifecycle() }
        }
        if (!evidence.pairStaged && c.pulse?.active && c.pulse.model === 3 && c.pulse.remaining === 100) {
          evidence.pairStaged = true
          evidence.oldPulseAtStaging = focus()
          stage('pair-ready: Bridge then Lightning creation, real drain must reverse authored clone order', ['bridge', 'lightning'])
        }
        if (evidence.handoffs.length === 2 && c.spell?.model === 12 && !evidence.firstReplacementVisit)
          evidence.firstReplacementVisit = focus()
      })
      return result
    })
    wrap(presentation.bridge, 'measure', original => function (...args) {
      const result = original.apply(this, args)
      if (drawing) observe(() => drawing.layouts.push({ geometry: args[1], model: args[0], measurement: copy(result), card: measuredCard(result, args[0]) }))
      return result
    })
    wrap(presentation, 'sprite', original => function (...args) {
      const result = original.apply(this, args)
      if (drawing) drawing.sprite = { command: args[0], image: result }
      return result
    })
    for (const key of ['translate', 'rotate']) wrap(context, key, original => function (...args) {
      const result = original.apply(this, args)
      if (drawing) drawing.primitives.push({ kind: key, args: [...args] })
      return result
    })
    const cropPixels = call => {
      const [a, b, c, d, e, f] = call.transform, [x, y, w, h] = call.kind === 'body' ? call.args.slice(4) : call.args,
        corners = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([x, y]) => [a * x + c * y + e, b * x + d * y + f]),
        left = Math.max(0, Math.floor(Math.min(...corners.map(p => p[0])))),
        top = Math.max(0, Math.floor(Math.min(...corners.map(p => p[1])))),
        right = Math.min(canvas.width, Math.ceil(Math.max(...corners.map(p => p[0])))),
        bottom = Math.min(canvas.height, Math.ceil(Math.max(...corners.map(p => p[1]))))
      require(right > left && bottom > top && (right - left) * (bottom - top) <= 1_000_000, 'Rendered crop out of bounds')
      const image = context.getImageData(left, top, right - left, bottom - top), out = document.createElement('canvas')
      out.width = image.width; out.height = image.height; out.getContext('2d').putImageData(image, 0, 0)
      return { bounds: [left, top, image.width, image.height], pixels: image.data,
        nontransparent: image.data.filter((_byte, i) => i % 4 === 3 && image.data[i] > 0).length, png: out.toDataURL() }
    }
    const spriteFrame = command => {
      // These two native-backed command families select their own canonical
      // metadata rows, independently of the renderer's flattened atlas search.
      const frame = (command.palette === 'ghost' ? inputs.effects.animations.blastTrail : inputs.effects.animations.sparkle)
        .find(frame => frame.source === command.frame)
      require(frame, 'Command has no pinned ordinary ghost/sparkle frame')
      return frame
    }
    const submissionIdentity = (command, index) => ({ index, kind: command.kind, model: command.model, frame: command.frame,
      ...(command.kind === 'sprite' ? { owner: command.owner, palette: command.palette, rgb: command.rgb, particle: command.particle } : {}) })
    const spritePixels = (kind, command, sprite, call, commandIndex) => {
      const frame = spriteFrame(command), source = document.createElement('canvas')
      require(frame.w * frame.h <= 10_000 && sprite.width === frame.w && sprite.height === frame.h, 'Sprite decode dimensions exceed the finite frame bound')
      source.width = frame.w; source.height = frame.h
      const sourceRect = [(frame.index % 8) * 256, Math.floor(frame.index / 8) * 256, frame.w, frame.h],
        sourceContext = source.getContext('2d')
      sourceContext.drawImage(effectsAtlas, ...sourceRect, 0, 0, frame.w, frame.h)
      const sourcePixels = sourceContext.getImageData(0, 0, frame.w, frame.h).data,
        actualContext = sprite.getContext('2d'), color = [command.rgb >>> 16, (command.rgb >>> 8) & 255, command.rgb & 255], texels = []
      require(kind === 'ghost' ? command.palette === 'ghost' && command.rgb === 0xffffff : command.palette !== 'ghost' && command.rgb !== 0xffffff,
        'Sprite proof must exercise ordinary ghost pixels or a real nonwhite tint')
      for (let y = 0; y < frame.h && texels.length < 3; y++) for (let x = 0; x < frame.w && texels.length < 3; x++) {
        const offset = (y * frame.w + x) * 4, rgba = [...sourcePixels.slice(offset, offset + 4)]
        if (rgba[3] !== 255) continue
        const expected = kind === 'ghost' ? [...rgba] : [...rgba.slice(0, 3).map((value, channel) => Math.round(value * color[channel] / 255)), rgba[3]],
          changed = expected.slice(0, 3).some((value, channel) => rgba[channel] !== 0 && value !== rgba[channel])
        if (kind === 'tint' && !changed) continue
        texels.push({ local: [x, y], source: [sourceRect[0] + x, sourceRect[1] + y], sourceRgba: rgba, expected,
          actual: [...actualContext.getImageData(x, y, 1, 1).data], nonzeroChannelChanged: changed })
      }
      require(texels.length === 3, `Missing three eligible opaque ${kind} texels in the bounded actual sprite sample`)
      return { tag: drawing.tag, commandIndex, command: copy(command), call, frame, sourceRect,
        source: { url: effectsAtlas.currentSrc, size: [effectsAtlas.naturalWidth, effectsAtlas.naturalHeight] },
        returnedSpriteSize: [sprite.width, sprite.height], color, texels,
        limit: 'Source-to-returned-sprite pixels only; actual ghost destination alpha/order, not full composited-raster equivalence' }
    }
    wrap(context, 'drawImage', original => function (...args) {
      const result = original.apply(this, args)
      if (drawing) observe(() => {
        const transform = this.getTransform(), base = { args: args.slice(1),
          transform: [transform.a, transform.b, transform.c, transform.d, transform.e, transform.f],
          alpha: this.globalAlpha, smoothing: this.imageSmoothingEnabled }
        require(drawing.submissions.length < 1100, 'Actual submission capture exceeds 1100 commands in a sampled frame')
        if (args.length === 5) {
          const sprite = drawing.sprite, command = sprite?.command, commandIndex = drawing.commandIndices.get(command)
          require(Number.isInteger(commandIndex) && command.kind === 'sprite' && args[0] === sprite.image,
            'Actual sprite draw must use its exact original command and returned canvas')
          alphaOracle.globalAlpha = command.palette === 'ghost' ? 85 / 255 : 1
          const frame = spriteFrame(command)
          require(args[0] instanceof HTMLCanvasElement && args[0].width === frame.w && args[0].height === frame.h, 'Returned sprite canvas must match its pinned frame dimensions')
          const call = { kind: 'sprite', commandIndex, identity: submissionIdentity(command, commandIndex),
            imageIdentityMatched: args[0] === sprite.image, sourceFrame: frame, returnedSpriteSize: [args[0].width, args[0].height],
            ...base, requestedAlpha: command.palette === 'ghost' ? 85 / 255 : 1,
            expectedRepresentedAlpha: alphaOracle.globalAlpha }
          drawing.submissions.push(call)
          const kind = command.palette === 'ghost' ? 'ghost' : command.rgb !== 0xffffff ? 'tint' : null
          if (kind && !evidence.spriteProofAttempts[kind]) {
            evidence.spriteProofAttempts[kind] = true
            evidence.spriteProofs[kind] = spritePixels(kind, command, args[0], call, commandIndex)
          }
        }
        if (args.length === 5 && drawing.sprite?.command === drawing.pulse && args[0] === drawing.sprite.image) {
          drawing.pulseCall = { kind: 'pulse', ...base }
          drawing.pulsePixels = cropPixels(drawing.pulseCall)
        }
        if (args.length === 9 && args[0] instanceof HTMLImageElement) {
          require(!drawing.bodyCall, 'Expected one winning body submission')
          const art = inputs.art.bodyFrames[12], rect = inputs.hud.rects[art.source]
          drawing.submissions.push({ kind: 'body', commandIndex: drawing.commandIndices.get(drawing.body),
            identity: submissionIdentity(drawing.body, drawing.commandIndices.get(drawing.body)), ...base, requestedAlpha: 1, expectedRepresentedAlpha: 1 })
          drawing.bodyCall = { kind: 'body', ...base, source: args[0].currentSrc, sourceSize: [args[0].naturalWidth, args[0].naturalHeight] }
          if (!evidence.decodedBody) {
            const decode = document.createElement('canvas'); decode.width = art.w; decode.height = art.h
            const dc = decode.getContext('2d'); dc.drawImage(args[0], rect.x, rect.y, art.w, art.h, 0, 0, art.w, art.h)
            evidence.decodedBody = { frame: art.source, rgba: [...dc.getImageData(0, 0, art.w, art.h).data], png: decode.toDataURL() }
          }
        }
      })
      return result
    })
    wrap(presentation, 'draw', original => function (...args) {
      const a = world.worshipAcquisition, commands = a.controllers.drawCommands,
        body = commands.find(c => c.kind === 'body' && c.model === 12),
        pulse = commands.find(c => c.kind === 'sprite' && c.owner === 'pulse' && c.model === 3),
        prior = a.previousDrawCommands.find(c => c.kind === 'body'),
        matches = body && prior?.geometry === body.geometry && !!prior.radians === !!body.radians,
        interval = a.clock.nextVisit - a.clock.lastVisit,
        fraction = world.paused || world.land.landFlags & 2 || !interval ? 1 : Math.max(0, Math.min(1, (a.clock.elapsed - a.clock.lastVisit) / interval)),
        changed = body && matches && ['x', 'y', 'scale', 'radians'].some(key => body[key] !== prior[key]),
        tag = body && pulse && (!seen.has('new-binding') && prior && prior.geometry !== body.geometry ? 'new-binding' :
          !seen.has('intermediate') && matches && changed && fraction > 0 && fraction < 1 ? 'intermediate' :
            !seen.has('final-leg') && body.finalLeg && matches && fraction > 0 && fraction < 1 ? 'final-leg' : null),
        before = tag ? observe(focus) : null
      drawing = tag ? { tag, body, pulse, layouts: [], primitives: [], sprite: null, bodyCall: null, pulseCall: null,
        commands, commandIndices: new Map(commands.map((command, index) => [command, index])), submissions: [],
        previousParticles: new Map(a.previousDrawCommands.filter(c => c.kind === 'sprite' && c.particle !== undefined).map(c => [c.particle, c])),
        expectedSubmissions: commands.map(submissionIdentity) } : null
      const current = drawing
      let result
      try { result = original.apply(this, args) } finally { drawing = null }
      if (body && evidence.handoffs.length === 2 && evidence.replacementDraws.length < 8) observe(() => {
        evidence.replacementDraws.push({ turn: world.turn, elapsed: a.clock.elapsed, lastVisit: a.clock.lastVisit,
          nextVisit: a.clock.nextVisit, fraction, tag, bodyModel: body.model, priorModel: prior?.model ?? null,
          samePriorGeometry: prior?.geometry === body.geometry, bodyRadians: body.radians,
          oldPulsePresent: !!pulse, spellStep: a.controllers.spell.step, spellVisits: a.controllers.spell.visits })
      })
      if (current) observe(() => {
        const after = focus(), bodyLayout = current.layouts.find(l => l.geometry === body.geometry),
          pulseLayout = current.layouts.find(l => l.geometry === pulse.geometry)
        require(current.expectedSubmissions.length <= 1100 && current.commandIndices.size === current.expectedSubmissions.length, 'Each bounded draw command must have a unique reference identity')
        require(current.bodyCall && current.pulseCall && bodyLayout?.measurement && pulseLayout?.measurement, 'Both real Canvas submissions and card measurements required')
        require(current.layouts.length === 2, 'Exactly two reference geometries must be measured once each')
        require(body.geometry !== pulse.geometry && serialize(bodyLayout.card.rect) !== serialize(pulseLayout.card.rect), 'Old pulse and new body require distinct real cards')
        const previous = matches ? prior : undefined, layout = bodyLayout.measurement,
          point = worshipDrawPoint(interpolateWorshipPoint(body, previous, fraction), body.geometry, layout, body.finalLeg),
          scale = (previous ? previous.scale + (body.scale - previous.scale) * fraction : body.scale) * layout.hudScale,
          angle = previous ? previous.radians + Math.atan2(Math.sin(body.radians - previous.radians), Math.cos(body.radians - previous.radians)) * fraction : body.radians,
          art = inputs.art.bodyFrames[12], rect = inputs.hud.rects[art.source], width = art.crop.width * scale, height = art.crop.height * scale,
          expectedPrimitives = [{ kind: 'translate', args: [point.x + art.crop.x * scale, point.y + art.crop.y * scale] }, { kind: 'rotate', args: [-angle] }],
          ratio = devicePixelRatio || 1
        oracle.setTransform(ratio, 0, 0, ratio, 0, 0)
        for (const primitive of expectedPrimitives) oracle[primitive.kind](...primitive.args)
        const represented = oracle.getTransform(), target = worshipTargetPoint(pulseLayout.measurement), pulseScale = pulseLayout.measurement.hudScale,
          expectedBody = { args: [rect.x + art.crop.x, rect.y + art.crop.y, art.crop.width, art.crop.height,
            body.radians ? -width / 2 : 0, body.radians ? -height / 2 : 0, width, height],
            transform: [represented.a, represented.b, represented.c, represented.d, represented.e, represented.f] },
          expectedPulse = { args: [target.x + (pulse.x - pulse.geometry.target.x) * pulseScale,
            target.y + (pulse.y - pulse.geometry.target.y) * pulseScale, pulse.width * pulseScale, pulse.height * pulseScale],
            transform: [ratio, 0, 0, ratio, 0, 0] }, bodyPixels = cropPixels(current.bodyCall), texels = []
        const spriteMappings = current.commands.flatMap((command, commandIndex) => {
          if (command.kind !== 'sprite') return []
          const mappedLayout = current.layouts.find(layout => layout.geometry === command.geometry)?.measurement
          require(mappedLayout, 'Each sprite must have its actual owned measured geometry')
          const previous = command.particle === undefined ? undefined : current.previousParticles.get(command.particle),
            matchingPriorGeometry = !!previous && previous.geometry === command.geometry,
            eligible = command.owner !== 'pulse' && command.palette !== 'ghost' && matchingPriorGeometry,
            frame = spriteFrame(command)
          let point
          if (command.owner === 'pulse') {
            const target = worshipTargetPoint(mappedLayout)
            point = { x: target.x + (command.x - command.geometry.target.x) * mappedLayout.hudScale,
              y: target.y + (command.y - command.geometry.target.y) * mappedLayout.hudScale }
          } else {
            require(command.palette !== 'ghost' || command.particle === undefined, 'Native ghost trails have no interpolation slot')
            const interpolated = interpolateWorshipPoint(command, eligible ? previous : undefined, fraction)
            point = worshipDrawPoint({ x: interpolated.x + command.width / 2, y: interpolated.y + command.height / 2 }, command.geometry, mappedLayout)
            point.x -= command.width * mappedLayout.hudScale / 2
            point.y -= command.height * mappedLayout.hudScale / 2
          }
          return [{ commandIndex, frame, owner: command.owner, palette: command.palette, particle: command.particle,
            model: command.model, current: { x: command.x, y: command.y },
            previous: previous ? { x: previous.x, y: previous.y, model: previous.model, particle: previous.particle } : null,
            matchingPriorGeometry, interpolated: eligible,
            foreignPriorRefused: !!previous && !matchingPriorGeometry,
            changedMatchingPose: eligible && (previous.x !== command.x || previous.y !== command.y),
            expected: { args: [point.x, point.y, command.width * mappedLayout.hudScale, command.height * mappedLayout.hudScale],
              transform: [ratio, 0, 0, ratio, 0, 0] } }]
        })
        const [ba, bb, bc, bd, be, bf] = current.bodyCall.transform, [bx, by, bw, bh] = current.bodyCall.args.slice(4),
          sxScale = ba * bw / art.crop.width, syScale = bd * bh / art.crop.height
        if (!body.radians && Math.abs(bb) < 1e-8 && Math.abs(bc) < 1e-8 && sxScale >= 2 && syScale >= 2) {
          const source = evidence.decodedBody.rgba, [left, top, pixelWidth, pixelHeight] = bodyPixels.bounds
          for (let sy = art.crop.y + 1; sy < art.crop.y + art.crop.height - 1 && texels.length < 8; sy++)
            for (let sx = art.crop.x + 1; sx < art.crop.x + art.crop.width - 1 && texels.length < 8; sx++) {
              if (![[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]].every(([dx, dy]) => source[((sy + dy) * art.w + sx + dx) * 4 + 3] === 255)) continue
              const px = Math.floor(ba * bx + be + (sx - art.crop.x + .5) * sxScale), py = Math.floor(bd * by + bf + (sy - art.crop.y + .5) * syScale)
              if (px < left || py < top || px >= left + pixelWidth || py >= top + pixelHeight) continue
              const sourceOffset = (sy * art.w + sx) * 4, destinationOffset = ((py - top) * pixelWidth + px - left) * 4
              texels.push({ source: [sx, sy], destination: [px, py], expected: source.slice(sourceOffset, sourceOffset + 4),
                actual: [...bodyPixels.pixels.slice(destinationOffset, destinationOffset + 4)] })
            }
        }
        delete bodyPixels.pixels; delete current.pulsePixels.pixels
        require(evidence.samples.length < 3, 'Rendered sample bound exceeded')
        evidence.samples.push({ tag, before, after, fraction, prior: copy(prior), matchingPriorBinding: !!matches,
          oldPulseGeometryOwned: pulse.geometry === a.controllers.pulse.geometry, bodyGeometryOwned: body.geometry === a.controllers.spell.geometry,
          body: copy(body), pulse: copy(pulse), layouts: current.layouts.map(l => ({ model: l.model, measurement: l.measurement, card: l.card })),
          bodyCall: current.bodyCall, pulseCall: current.pulseCall, expectedBody, expectedPulse,
          submissions: current.submissions, expectedSubmissions: current.expectedSubmissions, spriteMappings,
          primitives: { actual: current.primitives, expected: expectedPrimitives },
          numericOracle: 'Detached Canvas executes expected-only DPR/translate/rotate; original actual inputs are retained without alteration',
          bodyPixels, pulsePixels: current.pulsePixels, opaqueTexels: texels, hidden: canvas.hidden,
          viewport: [innerWidth, innerHeight], dpr: ratio, overlayPng: canvas.toDataURL() })
        seen.add(tag)
        evidence.samplesComplete = ['new-binding', 'intermediate', 'final-leg'].every(tag => seen.has(tag))
      })
      observe(() => {
        if (evidence.completed) return
        // Lifecycle must finish independently; unchanged final sample assertions
        // still fail if an actual renderer boundary was never observed.
        const c = world.worshipAcquisition.controllers
        if (world.gifts.some(g => fixtures.includes(g.id)) || world.effects.some(g => fixtures.includes(g.id)) ||
            c.spell?.active || c.companion?.active || c.pulse?.active || c.drawCommands.length ||
            world.worshipAcquisition.requests.length || !canvas.hidden) return
        evidence.retirement ??= lifecycle()
        // Two further original object turns establish that cleanup persists and
        // no late request, controller or duplicate payout appears.
        if (world.turn >= evidence.retirement.turn + 2) {
          evidence.terminal = lifecycle()
          evidence.completed = true
        }
      })
      return result
    })
    const gl = scene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    evidence.renderer = { webgl: gl.getParameter(gl.VERSION), renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) }
    window.restoreStagedWorshipComposition = () => {
      for (const restore of restorers.reverse()) observe(restore)
      evidence.restored = evidence.errors.length === 0
      evidence.final = focus()
      evidence.diagnostics = copy(presentation.diagnostics)
      delete window.restoreStagedWorshipComposition
    }
    stage('old Lightning phase-ready source', ['lightning'])
  }, inputs)
}

export default async function ({ page, root, output, receipt, openMission, signal }) {
  assert.equal(receipt.profile?.mode, 'created', 'Use a fresh owned profile for this staged row')
  assert.equal(receipt.profile.checkpointAtStart, null)
  assert.equal(receipt.source.commit, application, 'Run against the exact cfa application checkout')
  assert.equal(receipt.source.trackedDiffSha256, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'Tracked application and harness inputs must remain unchanged')
  const scenarioPath = 'scripts/local-render/staged-worship-composition.mjs',
    manifestPath = 'scripts/local-render/staged-worship-composition-inputs.json',
    admitted = {
      [scenarioPath]: digest(readFileSync(new URL(import.meta.url))),
      [manifestPath]: inputManifestSha256,
      'scripts/local-render/ordinary-worship.mjs': 'e109f328e3b0203081df9440e1c2ae5f07b31ff02a29e284367fed05d72c65ce',
      'scripts/local-render/ordinary-worship-m1-route.mjs': '30cb88b50c95c3e80a2f890082345ba6c34c91c42e512c2950631665d3aa8879',
      'scripts/local-render/ordinary-worship-boundaries.mjs': '1eee9b26be3bf8034054d94087d0845f8915e3ab0653112d33db55d19e6cf6b9',
    }
  assert.equal(relative(resolve(root), fileURLToPath(import.meta.url)).split(sep).join('/'), scenarioPath,
    'Owned profile requires the frozen checker copied inside gameRoot')
  for (const file of receipt.source.untracked) {
    assert.ok(Object.hasOwn(admitted, file.path), `Unreviewed untracked input: ${file.path}`)
    assert.equal(file.sha256, admitted[file.path], `Changed admitted checker: ${file.path}`)
  }
  for (const required of [scenarioPath, manifestPath])
    assert.ok(receipt.source.untracked.some(file => file.path === required), `Missing frozen checker input: ${required}`)
  assert.deepEqual(receipt.source.status.split('\n').sort(),
    receipt.source.untracked.map(file => `?? ${file.path}`).sort(), 'Only pinned untracked checker files are admitted')
  const manifestBytes = readFileSync(new URL('./staged-worship-composition-inputs.json', import.meta.url))
  assert.equal(digest(manifestBytes), inputManifestSha256, 'Frozen external manifest bytes')
  const manifest = JSON.parse(manifestBytes)
  assert.equal(manifest.application, application)
  for (const [path, expected] of Object.entries(manifest.sha256))
    assert.equal(digest(readFileSync(resolve(root, path))), expected, `Exact cfa application input: ${path}`)
  const rules = JSON.parse(readFileSync(resolve(root, 'app/original-rules.json'), 'utf8'))
  const inputs = { effects: JSON.parse(readFileSync(resolve(root, 'app/original-effects.json'), 'utf8')), stockLimits: { bridge: rules.spellCharging[12].normalLimit, lightning: rules.spellCharging[3].normalLimit }, art: JSON.parse(readFileSync(resolve(root, 'app/original-worship-acquisition.json'), 'utf8')),
    hud: JSON.parse(readFileSync(resolve(root, 'app/original-hud.json'), 'utf8')) },
    report = { status: 'running', application, source: receipt.source, scenarioSha256: digest(readFileSync(new URL(import.meta.url))),
      manifest, inputManifestSha256, label: 'EXPLICITLY STAGED composition, not ordinary or naturally simultaneous worship',
      scope: 'Three phase-ready gifts, two synchronous source-audited write transactions, two real RAF request drains, three rendered dual-binding samples with bounded sprite order/mapping/ghost/tint checks, all three original payouts and retired overlay held through two more object turns.',
      limits: 'Native-backed component composition only; old pulse uses Lightning instead of Tornado from the eight-case native pair proof. No ordinary M1 progression, native GPU equality, exhaustive pulse raster, hardware timing, or parity claim.',
      browserVersion: receipt.browserVersion, observer: null }
  const save = () => writeFileSync(resolve(output, 'staged-worship-composition.json'), json(report))
  let armed = false
  try {
    report.viewportBefore = page.viewportSize()
    await page.setViewportSize({ width: 960, height: 720 })
    report.viewport = { size: page.viewportSize(), dpr: await page.evaluate(() => devicePixelRatio), reason: 'Smaller real viewport exposes the one-visit replacement draw without modifying clocks or rendering callbacks' }
    assert.equal(report.viewport.dpr, 1)
    await openMission(1)
    const resume = page.getByRole('button', { name: 'Resume game', exact: true })
    if (await resume.isVisible()) await resume.click()
    const { waitForShamanReadiness } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
    report.readiness = await waitForShamanReadiness(page, { timeout: 30000 })
    signal.throwIfAborted()
    armed = true
    await install(page, inputs)
    await page.waitForFunction(() => window.stagedWorshipComposition.completed || window.stagedWorshipComposition.errors.length,
      null, { timeout: 15000, polling: 10 })
    signal.throwIfAborted()
    await page.screenshot({ path: resolve(output, 'staged-composition-page.png') })
  } catch (error) { report.status = 'failed'; report.failure = error.stack }
  finally {
    if (armed && !page.isClosed()) {
      await page.evaluate(() => window.restoreStagedWorshipComposition?.())
      report.observer = await page.evaluate(() => window.stagedWorshipComposition)
      if (report.observer) {
        const png = (object, key, filename) => {
          if (!object?.[key]) return
          const bytes = Buffer.from(object[key].split(',')[1], 'base64')
          assert.ok(bytes.length <= 8_000_000, 'PNG artifact exceeds 8 MB bound')
          writeFileSync(resolve(output, filename), bytes)
          delete object[key]; object[`${key}Artifact`] = filename
        }
        png(report.observer.decodedBody, 'png', 'staged-bridge-source.png')
        if (report.observer.decodedBody) {
          report.observer.decodedBody.rgbaSha256 = digest(Buffer.from(report.observer.decodedBody.rgba))
          delete report.observer.decodedBody.rgba
        }
        for (const sample of report.observer.samples) {
          png(sample, 'overlayPng', `staged-${sample.tag}-overlay.png`)
          png(sample.bodyPixels, 'png', `staged-${sample.tag}-body.png`)
          png(sample.pulsePixels, 'png', `staged-${sample.tag}-old-pulse.png`)
        }
      }
    }
    save()
  }
  if (report.status === 'failed') throw Error(report.failure)
  try {
    const o = report.observer
    assert.deepEqual(o.errors, []); assert.equal(o.restored, true); assert.equal(o.completed, true)
    assert.deepEqual(o.diagnostics, []); assert.deepEqual(receipt.errors, [])
    assert.equal(o.mutations.length, 2); assert.deepEqual(o.mutations.map(m => m.writes.length), [1, 2])
    assert.ok(o.mutations.every(m => m.unchangedWorldOutsideWhitelist))
    for (const mutation of o.mutations) {
      assert.deepEqual(mutation.afterFocus.gameplayRandom, mutation.beforeFocus.gameplayRandom)
      assert.deepEqual(mutation.afterFocus.cosmeticRandom, mutation.beforeFocus.cosmeticRandom)
      assert.deepEqual(mutation.afterFocus.acquisition, mutation.beforeFocus.acquisition)
      assert.deepEqual(mutation.afterFocus.shots, mutation.beforeFocus.shots)
      assert.deepEqual(mutation.afterFocus.giftCounts, mutation.beforeFocus.giftCounts)
    }
    const [old, pair] = o.handoffs, [bridge, lightning] = o.mutations[1].writes.map(w => w.final)
    assert.equal(o.handoffs.length, 2); assert.equal(o.cues, 3)
    assert.deepEqual(old.queued, [o.mutations[0].writes[0].final.id])
    assert.deepEqual(old.after.acquisition.controllers.spell.geometry,
      o.selects.find(s => s.operation === 'old-drain').expectedGeometry)
    assert.deepEqual(pair.before.acquisition.controllers.pulse.geometry, old.after.acquisition.controllers.spell.geometry)
    assert.equal(pair.before.acquisition.controllers.pulse.active, true)
    assert.equal(pair.before.acquisition.controllers.pulse.model, 3)
    assert.deepEqual(pair.queued, [bridge.id, lightning.id], 'Actual object loop queues staged creation order')
    assert.deepEqual(o.selects.filter(s => s.operation === 'pair-drain').map(s => s.model), [3, 12], 'Real request drain reverses native clone priority')
    assert.deepEqual(pair.after.acquisition.requests, [])
    assert.equal(pair.after.acquisition.controllers.spell.giftId, bridge.id)
    assert.equal(pair.after.acquisition.controllers.spell.model, 12)
    assert.equal(pair.after.acquisition.controllers.spell.visits, 0)
    assert.equal(pair.after.acquisition.controllers.companion.visits, 0)
    assert.equal(pair.after.acquisition.controllers.companion.model, 12)
    assert.deepEqual(pair.after.acquisition.controllers.companion.geometry, pair.after.acquisition.controllers.spell.geometry)
    assert.equal(pair.uiVisitsBefore, pair.uiVisitsAfter)
    assert.deepEqual(pair.after.acquisition.controllers.pulse, pair.before.acquisition.controllers.pulse, 'Both ready handoffs preserve every old pulse field')
    assert.deepEqual(pair.after.gameplayRandom, pair.before.gameplayRandom)
    assert.deepEqual(pair.after.cosmeticRandom, pair.before.cosmeticRandom)
    assert.deepEqual(pair.after.shots, pair.before.shots); assert.deepEqual(pair.after.giftCounts, pair.before.giftCounts)
    for (const id of [bridge.id, lightning.id]) {
      const gift = pair.before.gifts.find(g => g.id === id)
      assert.equal(gift.phase, 0); assert.equal(gift.remaining, 76)
    }
    assert.deepEqual(pair.after.acquisition.controllers.spell.geometry,
      o.selects.find(s => s.operation === 'pair-drain' && s.model === 12).expectedGeometry)
    assert.equal(o.decodedBody.rgbaSha256, inputs.art.bodyFrames[12].rgbaSha256)
    assert.deepEqual(o.samples.map(s => s.tag).sort(), ['final-leg', 'intermediate', 'new-binding'])
    const initial = o.samples.find(s => s.tag === 'new-binding')
    assert.equal(initial.prior.model, 3); assert.equal(initial.matchingPriorBinding, false)
    assert.ok(initial.opaqueTexels.length > 0, 'Require actual opaque source-to-overlay pixel correspondence at replacement')
    for (const sample of o.samples) {
      assert.deepEqual(sample.after, sample.before, 'Draw preserves observed acquisition/gift/stock/controller/clock/RNG state')
      assert.equal(sample.pulse.model, 3); assert.equal(sample.body.model, 12)
      assert.equal(sample.oldPulseGeometryOwned, true); assert.equal(sample.bodyGeometryOwned, true)
      assert.deepEqual(sample.pulse.geometry, pair.after.acquisition.controllers.pulse.geometry)
      assert.deepEqual(sample.body.geometry, pair.after.acquisition.controllers.spell.geometry)
      assert.equal(sample.hidden, false)
      const bodyCard = sample.layouts.find(l => l.model === 12).card, pulseCard = sample.layouts.find(l => l.model === 3).card
      assert.equal(bodyCard.connected, true); assert.equal(pulseCard.connected, true)
      assert.equal(bodyCard.exactHostElement, true); assert.equal(pulseCard.exactHostElement, true)
      assert.equal(bodyCard.reactKey, 'bridge'); assert.equal(pulseCard.reactKey, 'lightning')
      const center = card => [card.rect.x + card.rect.width / 2, card.rect.y + card.rect.height / 2]
      const [bodyX, bodyY] = center(bodyCard), [pulseX, pulseY] = center(pulseCard)
      assert.ok(Math.hypot(bodyX - pulseX, bodyY - pulseY) > 10, 'Real cards must have distinct target centers')
      if (sample.tag !== 'new-binding') {
        assert.equal(sample.matchingPriorBinding, true)
        assert.ok(sample.fraction > 0 && sample.fraction < 1)
        assert.equal(sample.prior.model, 12)
      }
      if (sample.tag === 'intermediate')
        assert.ok(['x', 'y', 'scale', 'radians'].some(key => sample.body[key] !== sample.prior[key]))
      if (sample.tag === 'final-leg') assert.equal(sample.body.finalLeg, true)
      for (const [actual, expected] of [[sample.bodyCall, sample.expectedBody], [sample.pulseCall, sample.expectedPulse]]) {
        for (const key of ['args', 'transform']) {
          assert.equal(actual[key].length, expected[key].length)
          actual[key].forEach((value, i) => assert.ok(Math.abs(value - expected[key][i]) < 1e-5, `${sample.tag} ${actual.kind} ${key}[${i}]`))
        }
        assert.equal(actual.alpha, 1); assert.equal(actual.smoothing, false)
      }
      assert.equal(sample.primitives.actual.length, sample.primitives.expected.length)
      sample.primitives.actual.forEach((actual, index) => {
        const expected = sample.primitives.expected[index]
        assert.deepEqual(actual, expected, `${sample.tag} exact original Canvas ${actual.kind} inputs`)
      })
      assert.ok(sample.bodyPixels.nontransparent > 0 && sample.pulsePixels.nontransparent > 0)
      for (const texel of sample.opaqueTexels) assert.deepEqual(texel.actual, texel.expected)
      assert.deepEqual(sample.submissions.map(call => call.commandIndex), sample.expectedSubmissions.map(command => command.index),
        'Every original draw command must reach Canvas exactly once in its existing identity order')
      sample.submissions.forEach((call, index) => {
        const command = sample.expectedSubmissions[index]
        assert.equal(call.kind, command.kind)
        assert.deepEqual(call.identity, command, 'Owner/model/frame/palette/rgb and command identity retain original order')
        assert.equal(call.alpha, call.expectedRepresentedAlpha, 'Exact expected-only Canvas alpha representation')
        assert.equal(call.requestedAlpha, command.palette === 'ghost' ? 85 / 255 : 1)
        assert.equal(call.smoothing, false)
        if (call.kind === 'sprite') {
          const mapping = sample.spriteMappings.find(mapping => mapping.commandIndex === call.commandIndex)
          assert.equal(call.imageIdentityMatched, true)
          assert.equal(call.sourceFrame.source, command.frame)
          assert.deepEqual(call.sourceFrame, mapping.frame)
          assert.deepEqual(call.returnedSpriteSize, [mapping.frame.w, mapping.frame.h])
          for (const key of ['args', 'transform']) {
            assert.equal(call[key].length, mapping.expected[key].length)
            call[key].forEach((value, i) => assert.ok(Math.abs(value - mapping.expected[key][i]) < 1e-5,
              `${sample.tag} sprite ${call.commandIndex} ${key}[${i}]`))
          }
          if (mapping.owner === 'pulse' || mapping.palette === 'ghost') assert.equal(mapping.interpolated, false)
          if (mapping.foreignPriorRefused) assert.equal(mapping.interpolated, false)
        }
      })
    }
    const newParticles = initial.spriteMappings.filter(mapping => mapping.particle !== undefined)
    assert.ok(newParticles.length > 0, 'New binding must submit real stable particle slots')
    newParticles.forEach(mapping => {
      assert.equal(mapping.matchingPriorGeometry, false, 'First replacement frame must not blend old particle ownership')
      assert.equal(mapping.interpolated, false)
      if (mapping.previous) assert.equal(mapping.foreignPriorRefused, true)
    })
    const intermediate = o.samples.find(sample => sample.tag === 'intermediate')
    assert.ok(intermediate.spriteMappings.some(mapping => mapping.interpolated && mapping.changedMatchingPose),
      'A genuine fractional frame must contain a changed matching-prior particle pose')
    report.spriteBindingCoverage = {
      replacementSlots: newParticles.length,
      foreignPriorSlotsRefused: newParticles.filter(mapping => mapping.foreignPriorRefused).length,
      foreignPriorBrowserCoverage: newParticles.some(mapping => mapping.foreignPriorRefused) ? 'observed' : 'not observed: no prior foreign particle slots remain at this late-pulse replacement',
      absentPriorSlots: newParticles.filter(mapping => !mapping.previous).length,
      changedMatchingIntermediateSlots: intermediate.spriteMappings.filter(mapping => mapping.interpolated && mapping.changedMatchingPose).length,
      limitation: 'No interpolation from an old owner is permitted; absent prior slots are distinguished from exercised foreign-prior rejection.' }
    for (const kind of ['ghost', 'tint']) {
      const proof = o.spriteProofs[kind]
      assert.equal(o.spriteProofAttempts[kind], true)
      assert.ok(proof, `Missing actual ${kind} submission within the three original sampled draws`)
      const sample = o.samples.find(sample => sample.tag === proof.tag), command = sample.expectedSubmissions[proof.commandIndex]
      assert.equal(command.kind, 'sprite'); assert.equal(command.frame, proof.command.frame)
      assert.equal(command.rgb, proof.command.rgb); assert.equal(command.palette, proof.command.palette)
      assert.deepEqual(proof.returnedSpriteSize, [proof.frame.w, proof.frame.h])
      assert.equal(proof.call.alpha, proof.call.expectedRepresentedAlpha)
      assert.equal(proof.texels.length, 3)
      if (kind === 'ghost') {
        assert.equal(proof.command.palette, 'ghost'); assert.equal(proof.command.rgb, 0xffffff)
        assert.equal(proof.call.requestedAlpha, 85 / 255)
      } else {
        assert.notEqual(proof.command.palette, 'ghost'); assert.notEqual(proof.command.rgb, 0xffffff)
        assert.ok(proof.texels.some(texel => texel.nonzeroChannelChanged))
      }
      for (const texel of proof.texels) {
        assert.equal(texel.sourceRgba[3], 255)
        const expected = kind === 'ghost' ? texel.sourceRgba : [
          ...texel.sourceRgba.slice(0, 3).map((value, channel) => Math.round(value * proof.color[channel] / 255)), 255]
        assert.deepEqual(texel.expected, expected)
        assert.deepEqual(texel.actual, expected, 'Independent pinned-atlas texel to actual returned-sprite pixel equality')
      }
    }
    assert.ok(o.arrival, 'Winner must arrive through the original UI visit')
    assert.equal(o.arrival.after.gifts.find(g => g.id === bridge.id).remaining, 1)
    assert.deepEqual(o.arrival.after.shots, o.arrival.before.shots, 'Arrival cannot grant stock')
    assert.deepEqual(o.arrival.after.giftCounts, o.arrival.before.giftCounts)
    const payoutRows = []
    for (const row of o.turns) {
      assert.equal(row.after.turn, row.before.turn + 1)
      const removed = row.before.gifts.filter(g => !row.after.gifts.some(after => after.id === g.id))
      const increments = { bridge: 0, lightning: 0 }
      for (const gift of row.before.gifts) {
        const after = row.after.gifts.find(g => g.id === gift.id)
        if (after) assert.equal(after.remaining, gift.remaining - 1, 'Actual object turn owns ordinary countdown')
        else {
          assert.equal(gift.remaining, 1, 'Gift pays only when its actual object countdown reaches zero')
          increments[gift.reward]++
          payoutRows.push({ id: gift.id, reward: gift.reward, turn: row.after.turn })
        }
      }
      for (const reward of ['bridge', 'lightning']) {
        assert.equal(row.after.shots[reward], row.before.shots[reward] < inputs.stockLimits[reward]
          ? Math.min(inputs.stockLimits[reward], row.before.shots[reward] + increments[reward]) : row.before.shots[reward])
        assert.equal(row.after.giftCounts[reward], Math.min(15, row.before.giftCounts[reward] + increments[reward]))
      }
      assert.equal(removed.length, increments.bridge + increments.lightning)
    }
    assert.equal(payoutRows.length, 3)
    assert.equal(payoutRows.find(row => row.id === bridge.id).turn, o.arrival.after.turn + 1, 'Winner pays on next actual object turn')
    for (const [mutation, write] of [[o.mutations[0], o.mutations[0].writes[0]], [o.mutations[1], o.mutations[1].writes[1]]]) {
      assert.equal(payoutRows.find(row => row.id === write.final.id).turn, mutation.turn + 77, 'Superseded Lightning retains its full staged countdown')
      const visits = o.turns.filter(row => row.before.gifts.some(g => g.id === write.final.id))
      assert.equal(visits.length, 77)
      visits.forEach((row, index) => assert.equal(row.before.gifts.find(g => g.id === write.final.id).remaining, 77 - index))
    }
    assert.ok(o.retirement && o.terminal && o.terminal.turn >= o.retirement.turn + 2)
    const retirementStates = o.turns.filter(row => row.before.turn >= o.retirement.turn && row.after.turn <= o.terminal.turn)
      .flatMap(row => [row.before, row.after])
    assert.ok(retirementStates.length >= 4, 'Two complete real object turns must retain clean retirement')
    for (const state of [o.retirement, ...retirementStates, o.terminal]) {
      assert.equal(state.paused, false)
      assert.deepEqual(state.gifts, []); assert.deepEqual(state.effects, []); assert.deepEqual(state.requests, [])
      assert.deepEqual(state.active, { spell: false, companion: false, pulse: false })
      assert.equal(state.commands, 0); assert.equal(state.hidden, true)
      for (const [reward, count] of [['lightning', 2], ['bridge', 1]]) {
        const initial = o.mutations[0].beforeFocus
        assert.equal(state.shots[reward], initial.shots[reward] < inputs.stockLimits[reward]
          ? Math.min(inputs.stockLimits[reward], initial.shots[reward] + count) : initial.shots[reward])
        assert.equal(state.giftCounts[reward], Math.min(15, initial.giftCounts[reward] + count))
      }
    }
    assert.deepEqual(o.terminal.shots, o.retirement.shots); assert.deepEqual(o.terminal.giftCounts, o.retirement.giftCounts)
    assert.deepEqual(o.final.gifts, []); assert.deepEqual(o.final.acquisition.requests, [])
    assert.deepEqual(o.final.acquisition.controllers.drawCommands, [])
    for (const key of ['spell', 'companion', 'pulse']) assert.equal(o.final.acquisition.controllers[key]?.active ?? false, false)
    report.payouts = payoutRows
    report.status = 'passed'; save(); return report
  } catch (error) { report.status = 'failed'; report.failure = error.stack; save(); throw error }
}
