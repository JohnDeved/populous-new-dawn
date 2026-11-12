// Inactive reconstructed proposal. Private JSHandle state, not application state.
export function capturePreparationIdentity() {
  const scene = window.testSceneRef?.current, world = window.testStore?.getWorld()
  if (!scene || !world || scene.world !== world) throw Error('Preparation ownership unavailable')
  const retained = [...document.querySelectorAll('.campaign-messages details')].map(detail => {
    const serial = detail.getAttribute('data-message-serial')
    const bodies = [...detail.children].filter(node => node.tagName === 'DIV')
    if (!/^\d+$/.test(serial ?? '') || !detail.isConnected || bodies.length !== 1 ||
        !bodies[0].isConnected || bodies[0].parentElement !== detail)
      throw Error('Invalid retained popup identity')
    return { serial, detail, body: bodies[0] }
  })
  if (new Set(retained.map(record => record.serial)).size !== retained.length)
    throw Error('Duplicate popup serial')
  return { scene, world, retained }
}

export function observePreparationIdentity({ expected, requested }) {
  if (!expected || window.testSceneRef?.current !== expected.scene ||
      window.testStore?.getWorld() !== expected.world || expected.scene.world !== expected.world)
    throw Error('Preparation World or Scene replaced')
  const current = [...document.querySelectorAll('.campaign-messages details')].map(detail => {
    const serial = detail.getAttribute('data-message-serial')
    const bodies = [...detail.children].filter(node => node.tagName === 'DIV')
    if (!/^\d+$/.test(serial ?? '') || !detail.isConnected || bodies.length !== 1 ||
        !bodies[0].isConnected || bodies[0].parentElement !== detail)
      throw Error('Invalid retained popup identity')
    return { serial, detail, body: bodies[0] }
  })
  if (new Set(current.map(record => record.serial)).size !== current.length)
    throw Error('Duplicate popup serial')
  for (const previous of expected.retained) {
    const next = current.find(record => record.serial === previous.serial)
    if (!next || next.detail !== previous.detail || next.body !== previous.body)
      throw Error('Retained popup identity replaced')
  }
  if (requested) {
    if (typeof requested.open !== 'boolean') throw Error('Boolean popup state required')
    const record = current.find(item => item.serial === requested.serial)
    if (!record) throw Error('Requested retained popup missing')
    const style = getComputedStyle(record.body), box = record.body.getBoundingClientRect()
    const visible = style.visibility !== 'hidden' && style.visibility !== 'collapse' && box.width > 0 && box.height > 0
    if (record.detail.open !== requested.open || visible !== requested.open)
      throw Error('Retained popup state or visibility differs')
  }
  expected.retained = current
  return current.map(({ serial, detail }) => ({ serial, open: detail.open }))
}

// Cleanup has a separate fixed grace. Timeout is not cancellation: callers must
// tear down the context when teardownRequired is true. This module cannot own
// context/process teardown and is not an activation-ready adapter.
export function createIdentityLease(page, trace, { cleanupMs = 250 } = {}) {
  if (!Number.isFinite(cleanupMs) || cleanupMs <= 0 || cleanupMs > 250)
    throw Error('Invalid identity cleanup grace')
  let closed = false, handle, acquired = false
  const pending = new Set()
  trace.identityCleanup = { status: 'not-started', pending: 0, errors: 0 }
  const track = promise => {
    pending.add(promise)
    promise.then(() => pending.delete(promise), () => pending.delete(promise))
    return promise
  }
  const dispose = value => track(Promise.resolve().then(() => value.dispose()).catch(() => {
    trace.identityCleanup.errors++
    trace.teardownRequired = true
  }))
  return {
    acquire() {
      if (closed || acquired) throw Error('Identity lease unavailable')
      acquired = true
      return track(Promise.resolve().then(() => { if (closed) throw Error('Identity lease closed'); return page.evaluateHandle(capturePreparationIdentity) }).then(value => {
        if (closed) return dispose(value).then(() => { throw Error('Identity lease closed during acquisition') })
        handle = value
      }))
    },
    observe(requested) {
      if (closed || !handle) throw Error('Identity lease unavailable')
      return track(Promise.resolve().then(() => { if (closed) throw Error('Identity lease closed'); return page.evaluate(observePreparationIdentity, { expected: handle, requested }) }).then(value => {
        if (closed) throw Error('Identity lease closed during observation')
        return value
      }))
    },
    async close() {
      if (closed) throw Error('Identity lease already closed')
      closed = true
      if (handle) { const value = handle; handle = undefined; dispose(value) }
      let timer
      try {
        await Promise.race([Promise.allSettled([...pending]), new Promise(resolve => { timer = setTimeout(resolve, cleanupMs) })])
      } finally { clearTimeout(timer) }
      trace.identityCleanup.pending = pending.size
      trace.identityCleanup.status = pending.size || trace.identityCleanup.errors ? 'requires-context-teardown' : 'settled'
      if (pending.size) trace.teardownRequired = true
      if (trace.teardownRequired) throw Error('Identity cleanup requires caller context teardown')
    },
  }
}
