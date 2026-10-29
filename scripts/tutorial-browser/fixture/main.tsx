// Supplied worship-slot boundary in the test host only.
if (new URLSearchParams(location.search).get('worship-panel-lifecycle') === '1') {
  void import('../worship-panel-fixture.mjs').then(fixture => {
    Object.defineProperty(globalThis, '__pndWorshipPanelFixture', { value: Object.freeze({ ...fixture }) })
  })
}
import { Matrix4 as PndReaderMatrix4 } from 'three'
Object.defineProperty(globalThis, '__pndReaderTypes', {
  value: Object.freeze({ Matrix4: PndReaderMatrix4 }),
  writable: false,
  configurable: false,
})
// Opt-in lifecycle fixture for the hosted browser test, never the shipped entry.
if (new URLSearchParams(location.search).get('building-panel-identity') === '1') {
  void import('../building-panel-fixture.mjs').then(fixture => {
    Object.defineProperty(globalThis, '__pndBuildingPanelFixture', {
      value: Object.freeze({ ...fixture }),
      writable: false,
      configurable: false,
    })
  })
}
// Hosted-only Tornado acceptance needs production module references after bundling.
if (new URLSearchParams(location.search).get('tornado-appearance') === '1') {
  void import('../tornado-fixture.mjs').then(fixture => {
    Object.defineProperty(globalThis, '__pndTornadoFixture', {
      value: Object.freeze({ ...fixture }),
      writable: false,
      configurable: false,
    })
  })
}
// Query-gated test-host bundle only; production Home never imports this fixture.
if (new URLSearchParams(location.search).get('hypnotise-fixture') === '1') {
  void import('../hypnotise-fixture.mjs').then(fixture => {
    Object.defineProperty(globalThis, '__pndHypnotiseFixture', {
      value: Object.freeze({ ...fixture }), writable: false, configurable: false,
    })
  })
}
import { createRoot } from 'react-dom/client'
import Home from '../../../app/page'
import '../../../app/globals.css'
createRoot(document.getElementById('root')!).render(<Home />)
