// Diagnostic observation only. Never use profiled clocks for acceptance comparisons.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdirSync, lstatSync, readFileSync, writeFileSync, openSync, writeSync, closeSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
const MiB = 1024 * 1024
export const limits = Object.freeze({ trace: 32 * MiB, profile: 8 * MiB, bundles: 64 * MiB, total: 128 * MiB })
function files(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(e => {
    const path = resolve(root, e.name)
    if (e.isSymbolicLink()) return [] // Public assets are input symlinks, never output artifacts.
    return e.isDirectory() ? files(path) : [path]
  })
}
export function enforceOutputLimit(root) {
  const bytes = files(root).reduce((n, p) => n + lstatSync(p).size, 0)
  assert.ok(bytes <= limits.total, `Diagnostic total output exceeds 128 MiB: ${bytes}`)
  return bytes
}
export function createBudget(root, total = limits.total, reserve = 8 * MiB) {
  const sizes = new Map(); let used = 0
  function admit(path, size, metadata) {
    assert.ok(path.startsWith(root + '/'), 'Output path outside budget')
    const next = used - (sizes.get(path) ?? 0) + size
    assert.ok(next <= total - (metadata ? 0 : reserve), 'Shared output budget exhausted before write')
    return next
  }
  return {
    remaining: () => Math.max(0, total - reserve - used),
    write(path, value, metadata = false) {
      const data = Buffer.isBuffer(value) ? value : Buffer.from(value)
      const next = admit(path, data.length, metadata)
      mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, data)
      used = next; sizes.set(path, data.length)
    },
    append(path, fd, data) {
      const size = (sizes.get(path) ?? 0) + data.length, next = admit(path, size, false)
      writeSync(fd, data); used = next; sizes.set(path, size)
    },
    copy(source, target) {
      const size = lstatSync(source).size
      admit(target, size, false) // Check BEFORE loading source bytes or creating destination.
      this.write(target, readFileSync(source))
    },
    used: () => used,
  }
}
export function retainBundles(root, dist, budget = createBudget(root)) {
  let total = 0
  const entries = Object.fromEntries(Object.entries(dist).map(([side, directory]) => [side,
    files(directory).filter(p => /\.(js|map)$/.test(p)).map(p => {
      const size = lstatSync(p).size; total += size
      assert.ok(total <= limits.bundles, 'Emitted JS/maps exceed combined 64 MiB budget')
      const target = resolve(root, 'emitted', side, p.slice(directory.length + 1))
      budget.copy(p, target)
      return { path: target.slice(root.length + 1), bytes: size, sha256: createHash('sha256').update(readFileSync(target)).digest('hex') }
    })]))
  budget.write(resolve(root, 'emitted-bundles.json'), JSON.stringify({ entries, total, limits }, null, 2), true)
}
export async function startDiagnostic(page, output, session, save, budget = createBudget(output)) {
  const cdp = await page.context().newCDPSession(page)
  const state = session.diagnostic = { limits, timingComparable: false, boundaries: [], status: 'starting' }
  const write = (name, value, cap = MiB) => {
    const bytes = Buffer.from(JSON.stringify(value))
    if (bytes.length > cap) {
      budget.write(resolve(output, `${name}.partial`), bytes.subarray(0, cap))
      throw Error(`${name} exceeds byte cap; retained prefix only`)
    }
    budget.write(resolve(output, name), bytes)
  }
  let traceCdp = null, tracing = false, profiling = false, ended, ending
  state.traceStatus = 'unavailable'
  state.cpuProfileStatus = 'not-started'
  state.categoryAttempts = []
  const completed = new Promise(resolve => { ended = resolve })
  const endTrace = () => {
    if (!ending && tracing) ending = traceCdp.send('Tracing.end').then(() => { tracing = false })
    return ending
  }
  await cdp.send('Performance.enable')
  const requested = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8', 'v8.execute', 'disabled-by-default-v8.gc', 'disabled-by-default-v8.compile', 'blink.user_timing']
  // Browser-global Tracing is independent from page-scoped Profiler/Performance.
  // Preflight occurs only before navigation; no added workload warmup or input.
  const bounded = async (work, milliseconds) => {
    let timer
    try { return await Promise.race([work, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Category preflight timeout')), milliseconds) })]) }
    finally { clearTimeout(timer) }
  }
  try {
    const opening = page.context().browser().newBrowserCDPSession()
    let abandoned = false
    // A late session after preflight timeout must not remain owned but unobserved.
    void opening.then(session => { if (abandoned) return session.detach().catch(() => {}) }, () => {})
    try { traceCdp = await bounded(opening, 750) } catch (error) { abandoned = true; throw error }
    traceCdp.on('Tracing.tracingComplete', event => ended(event))
    traceCdp.on('Tracing.bufferUsage', event => {
      state.peakBufferUsage = Math.max(state.peakBufferUsage ?? 0, event.percentFull ?? event.value ?? 0)
      if (state.peakBufferUsage >= 0.9) {
        state.traceStoppedEarly = true
        void endTrace()?.catch(error => { state.traceEndFailure = String(error) })
      }
    })
    for (let attempt = 0; attempt < 3; attempt++) {
      let categories
      try {
        const result = await bounded(traceCdp.send('Tracing.getCategories'), 500)
        categories = result.categories
        assert.ok(Array.isArray(categories), 'Invalid category response')
        state.categoryAttempts.push({ attempt: attempt + 1, categories })
      } catch (error) {
        state.categoryAttempts.push({ attempt: attempt + 1, error: String(error) }); throw error
      }
      state.availableCategories = categories
      state.selectedCategories = requested.filter(c => categories.includes(c))
      state.missingCategories = requested.filter(c => !categories.includes(c))
      if (state.selectedCategories.includes('devtools.timeline')) break
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (state.selectedCategories?.includes('devtools.timeline')) {
      await traceCdp.send('Tracing.start', { transferMode: 'ReturnAsStream', streamFormat: 'json', bufferUsageReportingInterval: 250,
        traceConfig: { recordMode: 'recordUntilFull', traceBufferSizeInKb: 32768, includedCategories: state.selectedCategories } })
      tracing = true; state.traceStatus = 'recording'
    } else state.traceUnavailableReason = 'No timeline category after bounded browser-session preflight; activity remains unknown'
  } catch (error) {
    state.traceUnavailableReason = String(error)
  }
  state.status = tracing ? 'recording' : 'cpu-profile-only'; save()
  async function boundary(name) {
    // Outside the six fixed input blocks; no application/timer monkey-patching.
    if (tracing) {
      try { await traceCdp.send('Tracing.recordClockSyncMarker', { syncId: name }) }
      catch (error) { state.traceMarkerFailure = String(error); state.traceStatus = 'incomplete' }
    }
    const dom = await page.evaluate(() => ({ timeOrigin: performance.timeOrigin, now: performance.now(),
      menu: document.querySelectorAll('[data-original-main-menu]').length,
      badges: document.querySelectorAll('[data-frontend-badge], [data-frontend-badge-vector]').length }))
    const { metrics } = await cdp.send('Performance.getMetrics')
    state.boundaries.push({ name, dom, metrics })
    if (name === 'before-ordinary-hover') {
      await cdp.send('Profiler.enable')
      await cdp.send('Profiler.setSamplingInterval', { interval: 1000 })
      await cdp.send('Profiler.start'); profiling = true; state.cpuProfileStatus = 'recording'
    }
    if (name === 'after-ordinary-hover') await stopProfile()
    save()
  }
  async function stopProfile() {
    if (!profiling) return
    const { profile } = await cdp.send('Profiler.stop'); profiling = false
    state.cpuProfileStatus = 'writing'
    write('ordinary-hover.cpuprofile', profile, limits.profile)
    state.cpuProfileStatus = 'complete'
  }
  return { boundary,
    write(path, value) { budget.write(path, value) },
    async download(download, path) {
      const stream = await download.createReadStream(); assert.ok(stream, 'Download stream missing')
      budget.write(path, Buffer.alloc(0)); const fd = openSync(path, 'a')
      try { for await (const chunk of stream) budget.append(path, fd, Buffer.from(chunk)) }
      finally { stream.destroy(); closeSync(fd) }
    },
    async stop() {
    try {
      await stopProfile()
      if (!tracing && !ending) { state.status = state.cpuProfileStatus === 'complete' ? 'complete-cpu-profile-only' : 'incomplete-cpu-profile-only'; return }
      await endTrace()
      let timer
      const event = await Promise.race([completed, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Trace completion timeout')), 10000) })]).finally(() => clearTimeout(timer))
      state.dataLossOccurred = event.dataLossOccurred ?? false
      assert.ok(event.stream, 'Trace stream unavailable')
      const tracePath = resolve(output, 'trace.json'); budget.write(tracePath, Buffer.alloc(0)); const fd = openSync(tracePath, 'a'); let bytes = 0
      try {
        for (;;) {
          const chunk = await traceCdp.send('IO.read', { handle: event.stream, size: 64 * 1024 })
          const data = Buffer.from(chunk.data, chunk.base64Encoded ? 'base64' : 'utf8')
          const remaining = Math.min(limits.trace - bytes, budget.remaining())
          budget.append(tracePath, fd, data.subarray(0, remaining)); bytes += Math.min(data.length, remaining)
          if (data.length > remaining) { state.traceCapped = true; break }
          if (chunk.eof) break
        }
      } finally { closeSync(fd); await traceCdp.send('IO.close', { handle: event.stream }) }
      state.traceBytes = bytes
      state.traceStatus = state.traceStoppedEarly || state.traceCapped || state.dataLossOccurred || state.traceMarkerFailure ? 'incomplete' : 'complete'
      state.status = state.traceStatus
      assert.equal(state.status, 'complete', 'Trace incomplete; no causal absence claims permitted')
    } finally {
      if (traceCdp) { try { await traceCdp.detach() } catch (error) { state.traceDetachFailure = String(error) } }
      try { await cdp.detach() } catch (error) { state.pageDetachFailure = String(error) }
      save()
    }
  } }
}

// Every owned-resource close is observed, including watchdog-triggered rejection.
export async function closeOwned(resource, owner, key) {
  if (!resource) return true
  try { await resource.close(); return true }
  catch (error) { owner[key] = String(error).slice(0, 2000); return false }
}

export function removeOwned(path, owner, key, remove = rmSync) {
  try { remove(path, { recursive: true, force: true }); return true }
  catch (error) { owner[key] = String(error).slice(0, 2000); return false }
}
