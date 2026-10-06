import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { browserModules, sha256 } from './source-policy.mjs'

// Supporting source correspondence under the independently pinned local compiler
// and server. A source map alone does not authenticate transformed semantics.
export function sourceCorrespondence(served, original, sourceMapURL) {
  if (served === original) return 'exact'
  const match = /^data:application\/json(?:;charset=[^;,]+)?;base64,([A-Za-z0-9+/=]+)$/.exec(sourceMapURL ?? '')
  assert.ok(match, 'Actual script needs exact bytes or a captured inline source map')
  const map = JSON.parse(Buffer.from(match[1], 'base64').toString())
  assert.ok(Array.isArray(map.sourcesContent) && map.sourcesContent.includes(original), 'Actual script source map does not contain the pinned source bytes')
  return 'inline-source-map'
}

export async function observeLoadedModules(page, root, origin, checkStop) {
  const session = await page.context().newCDPSession(page), parsed = new Map()
  const record = event => {
    let url
    try { url = new URL(event.url) } catch { return }
    const path = url.pathname.replace(/^\//, '')
    if (url.origin !== origin || !browserModules.includes(path)) return
    const rows = parsed.get(path) ?? []
    if (rows.length < 2 && !rows.some(row => row.scriptId === event.scriptId)) rows.push(event)
    parsed.set(path, rows)
  }
  session.on('Debugger.scriptParsed', record)
  await session.send('Debugger.enable') // Observation only; no pauses, breakpoints or evaluation.
  return {
    async read() {
      const modules = {}, observations = []
      for (const path of browserModules) {
        await checkStop()
        const events = parsed.get(path) ?? []
        assert.equal(events.length, 1, `One actually parsed module required: ${path}`)
        const event = events[0], { scriptSource } = await session.send('Debugger.getScriptSource', { scriptId: event.scriptId })
        await checkStop()
        const original = readFileSync(resolve(root, path), 'utf8')
        const correspondence = sourceCorrespondence(scriptSource, original, event.sourceMapURL)
        modules[path] = { sourceSha256: sha256(original), servedSha256: sha256(scriptSource), servedBody: scriptSource }
        observations.push({ path, scriptId: event.scriptId, url: event.url, executionContextId: event.executionContextId,
          cdpHash: event.hash, sourceMapSha256: sha256(event.sourceMapURL ?? ''), correspondence })
      }
      assert.equal(new Set(observations.map(row => row.executionContextId)).size, 1, 'Relevant modules must share the actual page execution context')
      return { modules, observations }
    },
    async dispose() { session.off('Debugger.scriptParsed', record); await session.detach() },
  }
}
