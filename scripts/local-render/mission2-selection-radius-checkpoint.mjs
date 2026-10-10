import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { checkpointObservation } from './checkpoint-observer.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'

// Authored Mission 2 startup owners at product ac7e894b. Additional ordinary
// allocations are allowed; none of these five existing members may be missing.
export const requiredRadiusMembers = Object.freeze([
  { sourceIndex: 1, id: 1, model: 7, owner: 3, x: 68, z: 102, angle: 512 },
  { sourceIndex: 3, id: 2, model: 3, owner: 3, x: 82, z: 102, angle: 512 },
  { sourceIndex: 5, id: 3, model: 3, owner: 3, x: 76, z: 114, angle: 512 },
  { sourceIndex: 24, id: 22, model: 4, owner: 3, x: 116, z: -132, angle: 512 },
  { sourceIndex: 79, id: 71, model: 3, owner: 3, x: 102, z: 118, angle: 1536 },
])
export const requiredRadiusSource = Object.freeze({
  sourceSha256: '83f5c446975398b163ef00526567f7a86b2666d26f9f026231ec0b36bf5a289f',
  headerSha256: '44be9f709f03f4b4d936d86056256e7bb98683088332b4bb47354ad709ea8a49',
})
export const radiusCheckpointBounds = Object.freeze({
  innerMs: 180000,
  outerMs: 220000,
  killGraceMs: 15000,
  committedMs: 10000,
  resumeMs: 15000,
  maximumTurn: 2048,
  attempts: 1,
})

function assertSnapshot(snapshot) {
  assert.equal(snapshot.level, 2)
  assert.ok(snapshot.turn > 0, 'At least one ordinary object turn must complete')
  assert.ok(
    snapshot.turn <= radiusCheckpointBounds.maximumTurn,
    'Startup storage observation exceeded its turn cap'
  )
  assert.equal(snapshot.tribe, 3)
  assert.equal(snapshot.aiAlias, true)
  assert.ok(Number.isInteger(snapshot.radius) && snapshot.radius >= 0 && snapshot.radius <= 255)
  assert.equal(snapshot.hasMembership, true)
  assert.deepEqual(snapshot.source, requiredRadiusSource)
  assert.deepEqual(
    snapshot.sources,
    requiredRadiusMembers,
    'Authored indices and live IDs have distinct owners'
  )
  for (const required of requiredRadiusMembers) {
    const member = snapshot.members.find(item => item.id === required.id)
    assert.ok(member, `Authored M2 member ${required.id} must be retained`)
    assert.equal(member.model, required.model)
    assert.deepEqual(member.anchor, {
      x: Math.round((required.x + 8) * 256) & 0xfe00,
      y: Math.round((-required.z - 8) * 256) & 0xfe00,
    })
    assert.equal(member.angle, required.angle)
  }
  for (const member of snapshot.members) {
    assert.equal(member.team, 'green')
    assert.equal(member.present, true)
    assert.equal(member.sameObject, true, 'Snapshot must alias the actual loaded building')
    assert.ok(Number.isFinite(member.x) && Number.isFinite(member.z))
  }
}

export default async function ({ page, output, receipt, openMission, observeCheckpoint, signal }) {
  assert.equal(receipt.profile?.mode, 'created')
  assert.equal(receipt.profile.checkpointAtStart, null)
  const owner = randomUUID(),
    deadline = Date.parse(receipt.startedAt) + radiusCheckpointBounds.innerMs,
    report = {
      status: 'running',
      source: receipt.source,
      bounds: radiusCheckpointBounds,
      requiredMembers: requiredRadiusMembers,
      requiredSource: requiredRadiusSource,
      method:
        'Public Mission 2 entry, real clock, settings pause and trusted Save/Load. Read-only queue/alias snapshots and unchanged typed checkpoint observer.',
      limits:
        'Startup/rebuild and actual storage ownership only. No original save-history recovery, removed-member ordinary episode, battle improvement or hardware-performance claim.',
      actions: [],
      cleanupErrors: [],
    },
    persist = () =>
      writeFileSync(
        resolve(output, 'mission2-selection-radius-checkpoint.json'),
        JSON.stringify(report, null, 2) + '\n'
      )
  let installed = false,
    failure
  const admit = (end = deadline) => {
    signal.throwIfAborted()
    assert.ok(Date.now() < Math.min(end, deadline), 'Declared checkpoint deadline expired')
  }
  const options = (maximum = 10000) => {
    admit()
    return { timeout: Math.max(1, Math.min(maximum, deadline - Date.now())) }
  }
  const click = async name => {
    admit()
    report.actions.push({ name, phase: 'before', at: new Date().toISOString() })
    persist()
    await page.getByRole('button', { name, exact: true }).click(options())
    admit()
    report.actions.push({ name, phase: 'after', at: new Date().toISOString() })
    persist()
  }
  const call = (method, kind) =>
    page.evaluate(
      ({ owner, method, kind }) => {
        const held = window.selectionRadiusCheckpoint
        if (held?.owner !== owner) throw Error('Checkpoint observer ownership changed')
        return held.api[method](kind)
      },
      { owner, method, kind }
    )
  persist()
  try {
    await openMission(2)
    await page.waitForFunction(() => window.testStore.getWorld().turn > 0, null, options(15000))
    await click('Game settings')
    await page.locator('dialog.game-dialog').waitFor({ state: 'visible', ...options() })
    report.before = await page.evaluate(
      async ({ owner, requiredMembers }) => {
        if (Object.hasOwn(window, 'selectionRadiusCheckpoint'))
          throw Error('Foreign checkpoint observer exists')
        const { armTempleCheckpoint } =
            await import('/scripts/local-render/temple-training-checkpoint.mjs'),
          { buildingModel } = await import('/app/building-shapes.ts'),
          { missionData } = await import('/app/mission-data.ts'),
          store = window.testStore,
          observers = new Map(),
          sources = requiredMembers.map(({ sourceIndex, id }) => {
            const source = missionData(2).level.objects.find(item => item.index === sourceIndex)
            if (source?.type !== 2) throw Error('Required authored class-2 source is absent')
            return {
              sourceIndex,
              id,
              model: source.model,
              owner: source.owner,
              x: source.x,
              z: source.z,
              angle: source.angle,
            }
          }),
          snapshot = ({ world }) => {
            const ai = world.campaignAIs[3]
            return {
              level: world.outcome.level,
              turn: world.turn,
              tribe: world.activeCampaignTribe,
              aiAlias: ai === world.ai,
              radius: ai?.constructionRadius,
              basePresent: ai?.constructionBase !== undefined,
              base: ai?.constructionBase,
              hasMembership: Array.isArray(ai?.constructionBuildings),
              source: {
                sourceSha256: missionData(2).level.sourceSha256,
                headerSha256: missionData(2).level.headerSha256,
              },
              sources,
              members: Array.isArray(ai?.constructionBuildings)
                ? ai.constructionBuildings.map(member => ({
                    id: member.id,
                    team: member.team,
                    model: buildingModel(member),
                    x: member.x,
                    z: member.z,
                    anchor: { ...member.anchor },
                    angle: Math.round((member.angle * 2048) / (2 * Math.PI)),
                    present: world.buildings.some(building => building.id === member.id),
                    sameObject:
                      world.buildings.find(building => building.id === member.id) === member,
                  }))
                : [],
            }
          }
        if (!store.getWorld().paused)
          throw Error('Public settings must own pause before observation')
        const api = {
          arm(kind) {
            if (observers.has(kind)) throw Error('One attempt per public checkpoint operation')
            const name = kind === 'save' ? 'Save checkpoint' : 'Load checkpoint',
              button = [...document.querySelectorAll('button')].find(
                item => item.textContent.trim() === name
              )
            if (!button) throw Error(`Missing public ${name}`)
            observers.set(kind, armTempleCheckpoint({ kind, store, button, snapshot }))
          },
          async result(kind) {
            const observer = observers.get(kind)
            if (!observer) throw Error('Checkpoint observer was not armed')
            const closed = observer.close()
            return {
              status: closed,
              digest: await observer.digest(),
              expectedLoad: kind === 'save' ? await observer.expectedLoadDigest() : undefined,
            }
          },
          close() {
            const results = []
            for (const [kind, observer] of observers) {
              try {
                results.push({ kind, status: observer.close() })
              } catch (error) {
                results.push({ kind, error: String(error) })
              }
            }
            return results
          },
        }
        const initial = snapshot({ world: store.getWorld() })
        window.selectionRadiusCheckpoint = { owner, api }
        return initial
      },
      { owner, requiredMembers: requiredRadiusMembers }
    )
    installed = true
    assertSnapshot(report.before)
    persist()
    await call('arm', 'save')
    await click('Save checkpoint')
    report.saved = await call('result', 'save')
    assert.equal(report.saved.status.captured, true)
    assert.equal(report.saved.status.trusted, true)
    assert.deepEqual(report.saved.status.errors, [])
    assertSnapshot(report.saved.status.publication.target)
    const end = Math.min(deadline, Date.now() + radiusCheckpointBounds.committedMs)
    const committed = await waitForCheckpointReadback(
      async () => {
        admit(end)
        report.committed = await page.evaluate(checkpointObservation)
        persist()
        return JSON.stringify(report.committed) === JSON.stringify(report.saved.digest)
      },
      {
        pause: async () => {
          admit(end)
          await page.waitForTimeout(100)
        },
      }
    )
    assert.equal(committed, true, 'Public Save must commit the full typed snapshot')
    report.profileSave = await observeCheckpoint('M2 selection-radius ownership Save')
    await page.screenshot({ path: resolve(output, 'radius-saved-settings.png'), ...options() })
    await call('arm', 'load')
    await click('Load checkpoint')
    report.loaded = await call('result', 'load')
    assert.equal(report.loaded.status.captured, true)
    assert.equal(report.loaded.status.trusted, true)
    assert.deepEqual(report.loaded.status.errors, [])
    assertSnapshot(report.loaded.status.publication.target)
    assert.deepEqual(
      report.loaded.status.publication.target,
      report.saved.status.publication.target
    )
    assert.deepEqual(report.loaded.digest, report.saved.expectedLoad)
    persist()
    await bindGame(page)
    await page.waitForFunction(
      turn => {
        const world = window.testStore.getWorld()
        return !world.paused && world.turn > turn
      },
      report.loaded.status.publication.turn,
      options(radiusCheckpointBounds.resumeMs)
    )
    await click('Pause game')
    report.resumed = await page.evaluate(() => ({
      turn: window.testStore.getWorld().turn,
      paused: window.testStore.getWorld().paused,
    }))
    assert.equal(report.resumed.paused, true)
    assert.ok(report.resumed.turn <= radiusCheckpointBounds.maximumTurn)
    await page.screenshot({ path: resolve(output, 'radius-loaded-paused.png'), ...options() })
    report.profileLoad = await observeCheckpoint('M2 selection-radius ownership after Load')
    assert.equal(report.profileLoad.checkpoint.checkpointSha256, report.committed.checkpointSha256)
  } catch (error) {
    failure = error
    report.failure = String(error?.stack ?? error)
  } finally {
    if (installed) {
      try {
        report.cleanup = await page.evaluate(owner => {
          const held = window.selectionRadiusCheckpoint
          if (held?.owner !== owner) throw Error('Checkpoint cleanup ownership changed')
          try {
            return held.api.close()
          } finally {
            if (window.selectionRadiusCheckpoint === held) delete window.selectionRadiusCheckpoint
          }
        }, owner)
        for (const result of report.cleanup) {
          assert.equal(result.error, undefined)
          assert.deepEqual(result.status.errors, [])
          assert.equal(result.status.closed, true)
          assert.deepEqual(result.status.cleanup, { listener: true, subscription: true })
        }
      } catch (error) {
        report.cleanupErrors.push(String(error?.stack ?? error))
      }
    }
    report.status = failure || report.cleanupErrors.length ? 'failed' : 'passed'
    persist()
  }
  if (failure) throw failure
  assert.deepEqual(report.cleanupErrors, [])
  return report
}
