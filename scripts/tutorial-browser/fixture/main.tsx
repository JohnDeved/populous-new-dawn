import { Matrix4 as PndReaderMatrix4 } from 'three'
Object.defineProperty(globalThis, '__pndReaderTypes', { value: Object.freeze({ Matrix4: PndReaderMatrix4 }), writable: false, configurable: false })
// Opt-in lifecycle fixture for the hosted browser test, never the shipped entry.
if (new URLSearchParams(location.search).get('building-panel-identity') === '1') {
  void import('../building-panel-fixture.mjs').then(fixture => {
    Object.defineProperty(globalThis, '__pndBuildingPanelFixture', {
      value: Object.freeze({ ...fixture }), writable: false, configurable: false,
    })
  })
}
import { createRoot } from 'react-dom/client'
import Home from '../../../app/page'
import '../../../app/globals.css'
createRoot(document.getElementById('root')!).render(<Home />)
