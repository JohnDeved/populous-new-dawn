import assert from 'node:assert/strict'

// A narrow harness facade, never an event substitute. Actual Playwright methods
// retain their receiver and arguments. Gating at dispatch catches nested public
// helpers whose preceding read settles after expiry. Observations are untouched.
export function guardBrowserAdmission(browser, admission) {
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

