import assert from 'node:assert/strict'
import { gameplayFramePlan } from './gameplay-frame-evidence.mjs'
import { gameplayAggregateBudget } from './scenario-policy.mjs'

// One absolute aggregate and the original frame envelope. Timers are wakeups;
// monotonic checks, not timer delivery order, decide whether work was admitted.
export function createGameplayAdmission({ deadlineAt, expectedRevision, onExpire, signal,
  now = () => performance.now(), wallNow = Date.now, schedule = setTimeout, cancel = clearTimeout }) {
  assert.ok(Number.isFinite(deadlineAt), 'An absolute host deadline is required')
  const started = now(), allowance = Math.min(gameplayAggregateBudget.totalBrowserMs, deadlineAt - wallNow())
  const aggregateDeadline = started + allowance, frameDeadline = Math.min(aggregateDeadline, started + gameplayAggregateBudget.frameMs)
  const report = { version: 1, status: 'running', budget: gameplayAggregateBudget, allowanceMs: allowance,
    episodes: [{ name: 'frames', status: 'running', startedMs: 0 }], resources: [], cleanupErrors: [] }
  let failure, aggregateTimer, frameTimer, localCheck, closeRequested = false, disposed = false
  const elapsed = () => now() - started
  const stop = error => {
    failure ??= error
    report.status = 'failed'; report.failure = String(failure)
    return failure
  }
  const cleanupFailed = error => { report.cleanupErrors.push(String(error)); return stop(error) }
  const requestClose = error => {
    if (closeRequested) return
    closeRequested = true
    try { Promise.resolve(onExpire(error)).catch(cleanupFailed) }
    catch (cleanup) { cleanupFailed(cleanup) }
  }
  const expire = scope => {
    if (disposed || scope === 'frames' && report.episodes[0].status !== 'running') return failure
    const error = Object.assign(new Error(`Gameplay ${scope} deadline exceeded`), { code: 'GAMEPLAY_ADMISSION_TIMEOUT' })
    if (!report.timedOut) { report.timedOut = scope; report.expiredMs = elapsed(); report.timeoutFailure = String(error) }
    // A primary failure never cancels the independently required deadline
    // shutdown. It remains primary even when cleanup subsequently stalls.
    stop(error); requestClose(error)
    return failure
  }
  const abort = () => {
    const error = signal.reason ?? new Error('Gameplay aggregate aborted')
    stop(error); requestClose(error)
  }
  const withinDeadline = at => {
    if (at >= aggregateDeadline) throw expire('aggregate')
    if (report.episodes.at(-1).name === 'frames' && report.episodes.at(-1).status === 'running' && at >= frameDeadline)
      throw expire('frames')
  }
  const check = () => {
    if (signal?.aborted) abort()
    assert.equal(disposed, false, 'Gameplay admission is closed')
    withinDeadline(now())
    if (failure) throw failure
    try { localCheck?.() } catch (error) { throw stop(error) }
    const observed = now()
    withinDeadline(observed)
    return aggregateDeadline - observed
  }
  const acquire = async (kind, create, close, active = check) => {
    active()
    const record = { kind, episode: report.episodes.at(-1).name, startedMs: elapsed() }
    report.resources.push(record)
    let resource
    try {
      resource = await create(); record.createdMs = elapsed()
      active()
      return resource
    } catch (error) {
      stop(error)
      if (resource) {
        try { await close(resource); record.lateClosed = true }
        catch (cleanup) { record.cleanupError = String(cleanup); report.cleanupErrors.push(String(cleanup)) }
      }
      throw stop(error)
    }
  }
  const finishEpisode = (name, result) => {
    check()
    const record = report.episodes.at(-1)
    assert.equal(record.name, name); assert.equal(record.status, 'running')
    assert.equal(result?.status, 'passed', 'Every complete gameplay report is required')
    assert.equal(result.expectedRevision, expectedRevision, 'Exact episode build identity required')
    if (name === 'frames') {
      assert.deepEqual(result.measuredPhases, gameplayFramePlan.phases.map(p => p.name))
      assert.deepEqual(result.phases.map(p => [p.name, p.status]), gameplayFramePlan.phases.map(p => [p.name, 'passed']))
    }
    if (name !== 'frames') assert.equal(result.contextClosed, true, 'Companion context cleanup is required')
    if (name === 'melee') assert.equal(result.capMs, gameplayAggregateBudget.meleeMs)
    if (name === 'corpse') {
      assert.deepEqual(result.budgetCapsMs, { deathAndSave: gameplayAggregateBudget.corpseDeathMs, loadAndVerify: gameplayAggregateBudget.corpseLoadMs })
      assert.deepEqual(result.budgets.map(b => b.name), ['death-through-committed-save', 'load-reframe-resume-and-terminal-verification'])
      for (const b of result.budgets) {
        assert.equal(b.timedOut, undefined)
        assert.ok(Number.isFinite(b.completedElapsedMs) && b.completedElapsedMs < b.deadlineElapsedMs)
      }
      assert.ok(result.budgets[0].committedSave, 'Exact committed-save transition must be retained')
    }
    const remaining = check()
    record.status = 'passed'; record.finishedMs = allowance - remaining; record.remainingAggregateMs = remaining
    if (name === 'frames') cancel(frameTimer)
  }
  const begin = name => {
    check()
    const previous = report.episodes.at(-1)
    assert.equal(previous.status, 'passed')
    assert.equal(name, previous.name === 'frames' ? 'melee' : previous.name === 'melee' ? 'corpse' : null)
    report.episodes.push({ name, status: 'running', startedMs: elapsed() })
  }
  const dispose = () => {
    cancel(aggregateTimer); cancel(frameTimer); signal?.removeEventListener('abort', abort); disposed = true
  }
  signal?.addEventListener('abort', abort, { once: true })
  aggregateTimer = schedule(() => expire('aggregate'), Math.max(0, allowance))
  frameTimer = schedule(() => expire('frames'), Math.max(0, frameDeadline - started))
  return { report, check, acquire, begin, finishEpisode, fail: stop, cleanupFailed, dispose,
    setLocalCheck(checkLocal) { check(); assert.equal(localCheck, undefined); localCheck = checkLocal },
    clearLocalCheck() { localCheck = undefined },
    complete() {
      check()
      assert.deepEqual(report.episodes.map(({ name, status }) => [name, status]), [['frames', 'passed'], ['melee', 'passed'], ['corpse', 'passed']])
      assert.deepEqual(report.cleanupErrors, [])
      report.finishedMs = allowance - check(); report.status = 'passed'; dispose()
    },
  }
}

// A narrow harness facade, never an event substitute. Actual Playwright methods
// retain their receiver and arguments. Gating at dispatch catches nested public
// helpers whose preceding read settles after expiry. Observations are untouched.
export function guardGameplayBrowser(browser, admission) {
  const raw = new WeakMap(), cache = new WeakMap()
  const unwrap = value => raw.get(value) ?? value
  const locatorFactories = new Set(['locator', 'getByRole', 'getByText', 'getByLabel', 'getByTestId', 'getByTitle', 'getByAltText', 'getByPlaceholder', 'filter', 'first', 'last', 'nth', 'or', 'and'])
  const locatorInputs = new Set(['click', 'dblclick', 'tap', 'press', 'pressSequentially', 'type', 'focus', 'fill', 'clear', 'selectOption', 'check', 'uncheck', 'setChecked', 'hover', 'dragTo', 'setInputFiles'])
  const pageInputs = new Set(['goto', 'reload', 'goBack', 'goForward', 'setViewportSize', 'click', 'dblclick', 'tap', 'press', 'type', 'focus', 'fill', 'selectOption', 'check', 'uncheck', 'setChecked', 'hover', 'dragAndDrop', 'setInputFiles'])
  const argsFor = args => args.map(value => {
    if (raw.has(value)) return unwrap(value)
    if (value && Object.getPrototypeOf(value) === Object.prototype && (raw.has(value.has) || raw.has(value.hasNot)))
      return { ...value, ...(value.has ? { has: unwrap(value.has) } : {}), ...(value.hasNot ? { hasNot: unwrap(value.hasNot) } : {}) }
    return value
  })
  const wrap = (target, kind, owner) => {
    if (cache.has(target)) return cache.get(target)
    const held = new Set()
    const active = () => {
      admission.check()
      for (let item = owner; item; item = item.parent)
        assert.equal(item.closed, false, 'Gameplay input resource is closing')
    }
    const proxy = new Proxy(target, { get(object, key) {
      const value = Reflect.get(object, key, object)
      if (kind === 'page' && ['keyboard', 'mouse', 'touchscreen'].includes(key)) return wrap(value, key, owner)
      if (typeof value !== 'function') return value
      if (kind === 'browser' && key === 'newContext') return async (...args) =>
        wrap(await admission.acquire('context', () => value.apply(object, args), item => item.close()), 'context', { closed: false })
      if (kind === 'context' && key === 'newPage') return async (...args) => {
        active()
        return wrap(await admission.acquire('page', () => value.apply(object, args), item => item.close(), active), 'page', { closed: false, parent: owner })
      }
      if (['context', 'page'].includes(kind) && key === 'close') return (...args) => {
        owner.closed = true; return value.apply(object, args)
      }
      if (['page', 'locator'].includes(kind) && locatorFactories.has(key))
        return (...args) => wrap(value.apply(object, argsFor(args)), 'locator', owner)
      if (kind === 'locator' && locatorInputs.has(key) || kind === 'page' && pageInputs.has(key))
        return (...args) => { active(); return value.apply(object, argsFor(args)) }
      if (['keyboard', 'mouse', 'touchscreen'].includes(kind)) return (...args) => {
        const id = kind === 'keyboard' ? args[0] : args[0]?.button ?? 'left'
        // Only release input this exact facade owns after expiry. Never invent a
        // late key/button-down, click, wheel, move, or foreign release.
        if (key === 'up' && held.has(id)) {
          held.delete(id)
          let expired = false
          try { active() } catch { expired = true }
          if (!expired) return value.apply(object, args)
          try { return Promise.resolve(value.apply(object, args)).catch(error => { admission.report.cleanupErrors.push(String(error)) }) }
          catch (error) { admission.report.cleanupErrors.push(String(error)); return Promise.resolve() }
        }
        try { active() } catch (error) { if (key === 'up') return Promise.resolve(); throw error }
        if (key === 'down') held.add(id)
        return value.apply(object, args)
      }
      return value.bind(object)
    } })
    cache.set(target, proxy); raw.set(proxy, target); return proxy
  }
  return wrap(browser, 'browser')
}
