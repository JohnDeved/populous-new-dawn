import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Extends the accepted cb57bd7 ordinary observer with existing model45 body reads. No game callbacks, clock or live owners are changed.
export default async function ({ page, root, output, openMission, receipt, signal }) {
  const report = {
    schema: 'stone-head-logical-visits-214/v1',
    scenarioSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
    source: JSON.parse(JSON.stringify(receipt.source)),
    method: 'Ordinary Mission 1 entry, natural opening, public pause/resume and shipped 1×/2× settings. Independent read-only RAF snapshots; no world, clock, terrain, camera, storage or render mutation.',
    identityScope: 'Owner identities use a local WeakMap per segment; compare them only inside that segment. Aliases identify existing references on the sampled Unit/Effect.',
    segments: [], actions: [],
    limits: 'Functional headless rendering only. RAF samples may miss intermediate visits or whole frame cycles. Raw stamps are observations, not an inferred counter or proof that a processor ran. Painter submission is only a liveness aid; the retained screenshots need visual review. Geometry samples cover the first six existing vertices. No native wall-clock, hardware-performance, complete lifecycle or unsampled family claim.',
  }
  const save = () => writeFileSync(resolve(output, 'sprite-observations.json'), JSON.stringify(report, null, 2) + '\n')
  const controlState = () => page.evaluate(() => {
    const w = window.testSceneRef.current.world
    return { turn: w.turn, time: w.time, speed: w.speed, paused: w.paused, level: w.outcome.level, status: w.status }
  })
  const click = async (label, button) => {
    signal.throwIfAborted()
    const before = await controlState()
    await button.click()
    report.actions.push({ label, before, after: await controlState() })
    save()
  }
  const waitState = async (speed, paused) => {
    await page.waitForFunction(({ speed, paused }) => {
      const w = window.testSceneRef.current.world
      return w.speed === speed && w.paused === paused
    }, { speed, paused }, { timeout: 5000 })
  }
  await openMission(1)
  const { waitForShamanReadiness } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  report.readiness = await waitForShamanReadiness(page)
  report.environment = await page.evaluate(() => {
    const s = window.testSceneRef.current, gl = s.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
    return { userAgent: navigator.userAgent, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio, canvas: [gl.drawingBufferWidth, gl.drawingBufferHeight], renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), timeOrigin: performance.timeOrigin }
  })
  await waitState(1, false)
  const observe = async (label, milliseconds, speed, paused) => {
    signal.throwIfAborted()
    const data = await page.evaluate(async ({ label, milliseconds }) => {
      const { unitAnimationSource, unitAnimation } = await import('/app/model.ts')
      const { default: rules } = await import('/app/original-rules.json')
      const rows = [], start = performance.now(), owners = new WeakMap()
      let nextOwner = 1
      const identity = p => {
        if (!p) return null
        if (!owners.has(p)) owners.set(p, nextOwner++)
        return owners.get(p)
      }
      const native = p => p ? {
        ownerIdentity: identity(p), class: p.class ?? null, model: p.model ?? null,
        object: p.object, draw: p.draw, f1: p.f1, f2: p.f2, flags3: p.flags3, stamp: p.stamp,
        flags2: p.flags2 ?? null, flags4: p.flags4 ?? null, renderFlags: p.renderFlags,
        state: p.state ?? null, substate: p.substate ?? null, commandStatus: p.commandStatus ?? null,
        speed: p.speed ?? null, morph: p.morph, morphTimer: p.morphTimer, morphFrames: p.morphFrames,
      } : null
      const uv = sprite => {
        const t = sprite?.userData.atlasTransform
        return t ? [t.x, t.y, t.z, t.w] : null
      }
      const layer = sprite => ({ visible: sprite.visible, piece: sprite.userData.piece ?? null, uv: uv(sprite) })
      return await new Promise(resolve => {
        const sample = now => {
          try {
            const s = window.testSceneRef.current, w = s.world
            const units = w.units.filter(u => u.team === 'blue' && u.hp > 0).slice(0, 16).map(u => {
              const p = unitAnimationSource(u), mesh = s.unitMeshes.get(u.id)
              const slots = [['flight', u.flight], ['fight.motion', u.fight?.motion], ['native', u.native], ['entry.person', u.entry?.person], ['builder.person', u.builder?.person]]
              return { id: u.id, kind: u.kind, x: u.x, z: u.z, state: unitAnimation(w, u),
                sourceAliases: p ? slots.filter(([, owner]) => owner === p).map(([name]) => name) : [],
                native: native(p), mesh: mesh ? { frame: mesh.userData.frame, draw: mesh.userData.draw, frameFlip: mesh.userData.frameFlip, visible: mesh.visible, layers: (mesh.userData.layers ?? []).map(layer) } : null }
            })
            const effects = w.effects.map(f => {
              const mesh = s.fxMeshes.get(f.id)
              return { id: f.id, kind: f.kind, age: f.age, turnsRemaining: f.turnsRemaining ?? null,
                animation: native(f.animation), smokeAliasesAnimation: !!f.smoke && f.smoke === f.animation,
                mesh: mesh ? { visible: mesh.visible, frame: mesh.userData.frame ?? null, sequence: mesh.userData.sequence ?? null, displayedUv: mesh.children.map(layer) } : null }
            })
            const smoke = w.secondaryEffects.slots.filter(e => e?.kind === 'hutRoot' || e?.kind === 'hutPuff').map(e => ({ ...e, position: { ...e.position } }))
            const displayedSmoke = [...s.buildingMeshes].flatMap(([id, group]) => {
              const state = group.userData.hutOccupancySmoke
              return state ? [{ id, kind: 'root', visible: state.group.visible, uv: uv(state.sprite), root: state.state.root ? { ...state.state.root } : null }] : []
            }).concat([...(s.hutSmokePuffs ?? [])].map(([id, group]) => ({ id, kind: 'puff', visible: group.visible, uv: uv(group.children[0]) })))
            const stoneHeads = w.shrines.filter(h => h.model === 45 && h.kind !== 'vault').map(h => {
              const body = h.stoneHead, group = s.shrineMeshes.get(h.id)?.g, mesh = group?.children[0]
              const positions = mesh?.geometry?.attributes.position, uvs = mesh?.geometry?.attributes.uv
              const modes = mesh?.geometry?.attributes.textureMode, painter = s.view.painter
              const range = mesh && painter.ranges.get(mesh)
              const submitted = range ? painter.commandsBySlot.slice(range[0], range[0] + range[1]).filter(Boolean) : []
              const xyz = p => p ? [p.x, p.y, p.z] : null
              return { id: h.id, kind: h.kind, model: h.model, mode: h.mode ?? null,
                x: h.x, z: h.z, enabled: h.enabled, active: h.active, followers: h.followers,
                remaining: h.remaining, uses: h.uses, progress: h.progress,
                availability: body === undefined ? 'uninitialized' : body === null ? 'unsupported-null' : 'existing',
                body: body ? { ...native(body), family: body.family, enabled: body.enabled,
                  holdFrame: body.holdFrame, triggerIndex: body.triggerIndex, sceneryIndex: body.sceneryIndex,
                  descriptorMode: rules.animationDescriptors[body.draw]?.mode ?? null } : null,
                rendered: mesh ? { nativeModel: mesh.userData.nativeModel, phase: mesh.userData.stoneHeadFrame ?? null,
                  groupVisible: group.visible, meshVisible: mesh.visible, objectsVisible: s.objects.visible,
                  sceneVisible: s.scene.visible, parentIsObjects: group.parent === s.objects,
                  geometryId: mesh.geometry.uuid, materialId: mesh.material.uuid,
                  groupPosition: xyz(group.position), meshPosition: xyz(mesh.position),
                  groupMatrixWorld: [...group.matrixWorld.elements], meshMatrixWorld: [...mesh.matrixWorld.elements],
                  positionCount: positions?.count ?? null, positionItemSize: positions?.itemSize ?? null,
                  positionVersion: positions?.version ?? null,
                  positionSample: positions ? Array.from(positions.array.slice(0, 18)) : null,
                  uvCount: uvs?.count ?? null, uvSample: uvs ? Array.from(uvs.array.slice(0, 12)) : null,
                  textureModeSample: modes ? Array.from(modes.array.slice(0, 6)) : null,
                  painterRange: range ? [...range] : null, submittedFaceCount: submitted.length,
                  submittedFaceSample: submitted.slice(0, 8).map(c => ({ slot: c.slot, face: c.face, object: c.object, bucket: c.bucket, phase: c.phase })) } : null }
            })
            rows.push({ now, sceneNow: s.previous, turn: w.turn, time: w.time, speed: w.speed, paused: w.paused, landFlags: w.land.landFlags, levelFlags2: w.levelFlags2, animationFrame: s.gameClock.animationFrame, animationTime: s.gameClock.animationTime, smokeAnimationFrame: w.secondaryEffects.animationFrame, selected: [...w.selected], units, effects, smoke, displayedSmoke, stoneHeads })
            if (performance.now() - start >= milliseconds) resolve({ label, requestedMs: milliseconds, rows })
            else requestAnimationFrame(sample)
          } catch (error) { resolve({ label, requestedMs: milliseconds, rows, error: String(error) }) }
        }
        requestAnimationFrame(sample)
      })
    }, { label, milliseconds })
    report.segments.push(data)
    save() // Preserve raw rows before every assertion, including observation failures.
    assert.equal(data.error, undefined, `${label}: observer error`)
    assert.ok(data.rows.length >= 2, `${label}: at least two samples`)
    const first = data.rows[0], last = data.rows.at(-1)
    data.summary = { samples: data.rows.length, elapsedSeconds: (last.sceneNow - first.sceneNow) / 1000, animationVisits: last.animationFrame - first.animationFrame, simulationTurns: last.turn - first.turn, gameTime: last.time - first.time,
      nativeUnitSamples: data.rows.flatMap(row => row.units).filter(u => u.native).length,
      walkingNativeSamples: data.rows.flatMap(row => row.units).filter(u => u.native && u.state === 'walk').length,
      effectKinds: [...new Set(data.rows.flatMap(row => row.effects.map(f => f.kind)))],
      hutSmokeModes: [...new Set(data.rows.flatMap(row => row.displayedSmoke.map(f => f.root?.mode).filter(Boolean)))] }
    save()
    assert.ok(data.rows.every(row => row.speed === speed && row.paused === paused), `${label}: actual speed/pause matches requested segment`)
    assert.ok(data.rows.every(row => row.units.every(u => !u.native || ['flags3', 'stamp', 'f1', 'f2', 'model'].every(key => Number.isFinite(u.native[key])))), `${label}: native owner fields are present`)
    if (paused) {
      assert.equal(data.summary.animationVisits, 0)
      assert.equal(data.summary.simulationTurns, 0)
      const display = row => ({ units: row.units, effects: row.effects, smoke: row.smoke, displayedSmoke: row.displayedSmoke, stoneHeads: row.stoneHeads.map(h => ({ ...h, rendered: h.rendered && { ...h.rendered, painterRange: undefined, submittedFaceSample: undefined } })) })
      for (const row of data.rows.slice(1)) assert.deepEqual(display(row), display(first), `${label}: raw pose and rendered frame/UV freeze`)
    } else {
      assert.ok(data.summary.animationVisits > 0 && data.summary.simulationTurns > 0, `${label}: normal clocks advance`)
    }
    return data
  }
  const pause = async (speed, label) => {
    await click(label, page.getByRole('button', { name: 'Pause game', exact: true }))
    await waitState(speed, true)
    await observe(label, 1500, speed, true)
  }
  const resume = async speed => {
    await click(`public resume at ${speed}×`, page.getByRole('button', { name: 'Resume game', exact: true }))
    await waitState(speed, false)
  }
  const setSpeed = async (before, after) => {
    await click(`open settings at ${before}×`, page.getByRole('button', { name: 'Game settings', exact: true }))
    const dialog = page.locator('dialog.game-dialog[open]')
    await dialog.waitFor({ state: 'visible' })
    await waitState(before, true)
    await observe(`settings pause at ${before}×`, 250, before, true)
    await click(`select shipped ${after}× speed`, dialog.getByRole('button', { name: `${before}× game speed`, exact: true }))
    await waitState(after, true)
    await observe(`settings selected ${after}× while paused`, 250, after, true)
    // Continue Game closes the dialog; its onClose handler resumes this mission.
    await click(`Continue Game at ${after}×`, dialog.getByRole('button', { name: /^Continue Game/ }))
    await dialog.waitFor({ state: 'hidden' })
    await waitState(after, false)
  }
  await observe('normal-speed natural opening', 8000, 1, false)
  await page.screenshot({ path: resolve(output, 'normal-speed-opening.png') })
  await pause(1, 'public pause')
  await resume(1)
  await observe('public resume', 4000, 1, false)
  await page.screenshot({ path: resolve(output, 'normal-speed-resumed.png') })
  await setSpeed(1, 2)
  await observe('shipped 2× speed natural play', 4000, 2, false)
  await page.screenshot({ path: resolve(output, 'shipped-2x-speed.png') })
  await pause(2, 'public pause at 2×')
  await resume(2)
  await setSpeed(2, 1)
  await observe('restored shipped 1× speed', 2000, 1, false)
  report.coverage = { naturalWalkObserved: report.segments.some(s => s.summary.walkingNativeSamples > 0),
    splashObserved: report.segments.some(s => s.summary.effectKinds.includes('splash')),
    damageSmokeObserved: report.segments.some(s => s.summary.effectKinds.includes('buildingSmoke')),
    enabledBodyQueued: report.segments.some(s => s.rows.some(row => row.stoneHeads.some(h =>
      h.enabled && h.body?.family === 45 && h.body.enabled && h.rendered?.nativeModel === 45 &&
      h.rendered.groupVisible && h.rendered.meshVisible && h.rendered.objectsVisible && h.rendered.sceneVisible &&
      h.rendered.parentIsObjects && h.rendered.submittedFaceCount > 0))) }
  save()
  assert.equal(report.coverage.naturalWalkObserved, true, 'Genuine native-backed natural walk must be observed; absence is not a pass')
  assert.equal(report.coverage.enabledBodyQueued, true, 'No ordinary enabled model45 body with visible flags and queued faces; retain the gap rather than substitute a fixture')
  return { source: report.source, scenarioSha256: report.scenarioSha256, environment: report.environment, coverage: report.coverage, summaries: report.segments.map(({ label, summary }) => ({ label, ...summary })), artifact: 'sprite-observations.json', limits: report.limits }
}
