import assert from 'node:assert/strict'
import { snapshotMission18, classifyMission18 } from './observe.mjs'
import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const latestCandidateTree = 'dec598bdde625573cb6968bd4f64053ca1a0f031'
const latestParents = [
  '44bdeae9ec9050c10f6b5fa5e35c3bc7c3bebc80',
  'c32f205d7daa8eaa69c5bc86b3537b1755ceeb57',
]
const pngMagic = Buffer.from('89504e470d0a1a0a', 'hex')
export function classifySource(source, readCommit) {
  const fixed = sources[source.commit]
  if (fixed) {
    assert.equal(source.tree, fixed[0])
    return fixed[1]
  }
  assert.match(source.commit, /^[0-9a-f]{40}$/, 'Malformed candidate commit')
  assert.equal(source.tree, latestCandidateTree, 'Unreviewed source commit; rebind this scenario before launch')
  const header = readCommit(source.commit).split('\n\n', 1)[0].split('\n')
  assert.equal(header[0], 'tree ' + latestCandidateTree)
  assert.deepEqual(header.filter(row => row.startsWith('parent ')), latestParents.map(sha => 'parent ' + sha))
  return true
}
const sources = {
  'c32f205d7daa8eaa69c5bc86b3537b1755ceeb57': ['21a936c0dae95c20855c03fa4f02b7002f022664', false],
  '398a762adc09183336574b2dec5070ba96c1a0dc': ['8ae95f8e6c845381162c756e1080f5cdd55d1348', false],
  '44bdeae9ec9050c10f6b5fa5e35c3bc7c3bebc80': ['7b685f55dcc35443c9a1cbca398cbbd2e3dc3206', true],
}
export default async function witness({ page, root, output, receipt, signal }) {
  const source = receipt.source
  const hasOpening = classifySource(source, commit =>
    execFileSync('git', ['cat-file', 'commit', commit], { cwd: root, encoding: 'utf8', maxBuffer: 262144 }))
  assert.equal(resolve(output), output, 'Output must be the harness-owned absolute directory')
  assert.equal(source.status, '', 'Only a clean detached checkout is admitted')
  assert.equal(source.untracked.length, 0)
  const helper = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)

  // Do not call the stock openMission() helper: it clicks Skip Introduction.
  await helper.showAllMissions(page)
  signal.throwIfAborted()
  const start = page.getByRole('dialog', { name: 'Start game', exact: true })
  await start.getByRole('button', { name: 'Mission 18', exact: true }).focus()
  await page.keyboard.press('Enter')
  await helper.bindGame(page)

  const role = hasOpening ? 'candidate' : 'baseline'
  const guarded = async (stage, timeout) => {
    const deadline = performance.now() + timeout
    let s
    for (;;) {
      signal.throwIfAborted()
      s = await page.evaluate(snapshotMission18)
      const gate = classifyMission18(s, role, stage)
      if (gate === 'take') break
      if (gate === 'paused') throw Error(
        `Native pause at turn ${s.turn} (lastMessage=${s.lastMessage}); record and use only a verified public message-control flow, or stop.`
      )
      if (gate === 'invalid' || gate === 'missed' || performance.now() >= deadline)
        throw Error(`${role}/${stage} not witnessed (${gate}): ${JSON.stringify(s)}`)
      await page.waitForTimeout(40)
    }
    assert.ok(s.buffer.every(n => n > 0))
    assert.ok(s.camera.every(Number.isFinite))
    return { ...s, paused:s.pause }
  }
  const pending = []
  const capture = async (stage, timeout) => {
    const before = await guarded(stage, timeout)
    const name = `m18-open-${stage}.png`
    const PNG = await page.screenshot({ timeout: 5000 })
    assert.ok(PNG.subarray(0, 8).equals(pngMagic), 'Invalid PNG transport')
    const after = await guarded(stage, 0)
    assert.deepEqual(after.viewport, before.viewport)
    assert.deepEqual(after.buffer, before.buffer)
    assert.equal(after.renderer, before.renderer)
    assert.ok(after.turn >= before.turn)
    pending.push([name, PNG])
    return { name, sha256: createHash('sha256').update(PNG).digest('hex'), before, after }
  }
  const early = await capture('early', 8000)
  const active = await capture('active', 8000)
  const complete = await capture('later', 15000)
  for (const [name, PNG] of pending) await writeFile(resolve(output, name), PNG, {flag:'wx', mode:0o600})
  return {
    mission: 18,
    entry: 'All missions direct-start, not campaign unlock; natural run, no Skip Introduction',
    sourceRole: hasOpening ? 'repaired candidate' : 'current main comparison',
    screenshots: [early, active, complete],
    timing: 'Metadata samples bracket the screenshots; not exact same-frame telemetry.',
    claims: 'Comparison is new-game opening only; human pixel review still required.',
  }
}
