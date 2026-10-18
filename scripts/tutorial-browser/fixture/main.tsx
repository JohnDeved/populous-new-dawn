import { Matrix4 as PndReaderMatrix4 } from 'three'
Object.defineProperty(globalThis, '__pndReaderTypes', { value: Object.freeze({ Matrix4: PndReaderMatrix4 }), writable: false, configurable: false })
import { createRoot } from 'react-dom/client'
import Home from '../../../app/page'
import '../../../app/globals.css'
createRoot(document.getElementById('root')!).render(<Home />)
