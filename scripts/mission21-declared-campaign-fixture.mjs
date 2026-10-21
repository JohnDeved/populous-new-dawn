import assert from 'node:assert/strict'
import { waitForStartupMenu } from './browser-new-game.mjs'

// Test-only branch setup. These prerequisites are declared fixture history,
// never evidence that earlier missions were naturally completed in this run.
const prerequisites = [16, 17, 18, 19]
export function mission21BranchProfile(completed = prerequisites) {
  assert.ok(Array.isArray(completed), 'Declared completed prerequisites must be an array')
  assert.ok(completed.every(mission => prerequisites.includes(mission)), 'Only fork prerequisites 16–19 may be declared')
  assert.equal(new Set(completed).size, completed.length, 'Duplicate declared prerequisite')
  const ordered = [...completed].sort((a, b) => a - b)
  return { version: 1, completed: ordered, nativeCampaign: {
    version: 1, history: 'legacy-completed-only',
    flags: Array.from({ length: 25 }, (_, index) => ordered.includes(index + 1) ? 5 : index === 19 ? 4 : 0),
  } }
}

export function validateMission21BranchProfile(profile) {
  assert.equal(profile?.version, 1, 'Unsupported declared profile version')
  assert.equal(profile.nativeCampaign?.version, 1, 'Unsupported declared native profile version')
  assert.equal(profile.nativeCampaign.history, 'legacy-completed-only', 'Fixture history must not claim native-earned progress')
  const flags = profile.nativeCampaign.flags
  assert.ok(Array.isArray(flags) && flags.length === 25, 'Declared flags must contain 25 bytes')
  for (let index = 0; index < 25; index++)
    assert.ok(Number.isInteger(flags[index]) && flags[index] >= 0 && flags[index] <= 255, 'Declared flags must be byte integers')
  assert.deepEqual(profile, mission21BranchProfile(profile.completed), 'Declared profile must match its supported completed set and M20 availability')
  return profile
}

export async function prepareMission21BranchFixture(page, profile) {
  validateMission21BranchProfile(profile)
  await waitForStartupMenu(page)
  await page.evaluate(async fixture => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('populous-new-dawn', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      await new Promise((resolve, reject) => {
        const transaction = database.transaction('checkpoints', 'readwrite')
        const store = transaction.objectStore('checkpoints'), request = store.count()
        request.onsuccess = () => {
          // Refuse even a checkpoint-only context. The caller must supply a new
          // ephemeral context, never overwrite an existing campaign or save.
          if (request.result !== 0) { transaction.abort(); return }
          store.put(fixture, 'profile')
        }
        transaction.oncomplete = resolve
        transaction.onabort = () => reject(new Error('Declared M21 branch fixture requires an empty checkpoint database'))
        transaction.onerror = () => reject(transaction.error)
      })
    } finally { database.close() }
  }, profile)
  console.log(JSON.stringify({ campaignFixture: { kind: 'mission21-branch', profile,
    limits: 'Declared prerequisite history, not naturally earned earlier campaign progress. The M20 terminal outcome is also supplied diagnostic state.' } }))
  await page.reload({ waitUntil: 'networkidle' })
}
