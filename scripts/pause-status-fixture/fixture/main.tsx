import { createRoot } from 'react-dom/client'
import { OriginalPauseStatus } from '../../../app/original-pause-status'
import '../../../app/globals.css'

const before = new URLSearchParams(location.search).has('before')
if (before) {
  const style = document.createElement('style')
  style.textContent = await (await fetch('/before.css')).text()
  document.head.appendChild(style)
}
createRoot(document.getElementById('root')!).render(
  <main
    className="game-shell"
    style={{ position: 'relative', width: '100vw', height: '100vh', background: '#163030' }}
  >
    {before ? (
      <button className="paused-badge">
        Ⅱ <span>WORLD PAUSED</span>
        <small>Click to resume</small>
      </button>
    ) : (
      <OriginalPauseStatus />
    )}
  </main>
)
