import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

const expectedHome = '34cb9ea2d3e3fbe4fa9a88fc72e4a7a4730147330de353098bb73b6ae5c589c4'
export function observedHome(source) {
  assert.equal(createHash('sha256').update(source).digest('hex'), expectedHome, 'Require reviewed actual Home bytes')
  const original = '    hudPreference.subscribe,\n    hudPreference.getSnapshot,\n    hudPreference.getServerSnapshot'
  assert.equal(source.split(original).length, 2, 'Exactly one actual HUD subscription call')
  const changed = '    window.__hudStrictProbe.wrapSubscribe(hudPreference.subscribe),\n    hudPreference.getSnapshot,\n    hudPreference.getServerSnapshot'
  return source.replace(original, changed)
}

export function fixtureMain(homePath, stylePath, probePath) {
  for (const path of [homePath, stylePath, probePath]) assert.ok(path.startsWith('/') && !path.includes('\0'))
  return `import React, { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Home from ${JSON.stringify(homePath)}
import ${JSON.stringify(stylePath)}
import { createStrictProbe } from ${JSON.stringify(probePath)}
if (!import.meta.env.DEV) throw Error('Real development React required')
const blocked = new URLSearchParams(location.search).get('case') === 'blocked'
const probe = createStrictProbe(localStorage, Storage.prototype, { seed: blocked ? '2.5' : '1.5', blockRead: blocked })
window.__hudStrictProbe = probe
Object.defineProperty(window, '__hudStrictRuntime', { value: Object.freeze({ react: React.version, development: import.meta.env.DEV }) })
function Witness({ epoch }) {
  useEffect(() => { probe.witness('effect-setup', epoch); return () => probe.witness('effect-cleanup', epoch) }, [epoch])
  return <Home />
}
function Host() {
  const [mounted, setMounted] = useState(true)
  const [epoch, setEpoch] = useState(1)
  const [renders, setRenders] = useState(0)
  return <>
    <aside aria-label="StrictMode test host" style={{ position: 'fixed', top: 4, right: 4, zIndex: 200, background: '#fff', color: '#000', padding: 4, font: '12px sans-serif' }}>
      <span>Development fixture · mount {epoch} · rerenders {renders}</span>
      <button disabled={!mounted} onClick={() => setMounted(false)}>Unmount Home fixture</button>
      <button disabled={mounted} onClick={() => { setEpoch(epoch + 1); setMounted(true) }}>Mount Home fixture</button>
      <button disabled={!mounted} onClick={() => setRenders(renders + 1)}>Rerender Home fixture</button>
      <button disabled={mounted} onClick={() => probe.seedFresh()}>Seed fresh HUD size 3</button>
    </aside>
    {mounted && <StrictMode><Witness key={epoch} epoch={epoch} /></StrictMode>}
  </>
}
createRoot(document.getElementById('root')).render(<StrictMode><Host /></StrictMode>)
`
}
