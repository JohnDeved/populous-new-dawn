import { createRoot } from 'react-dom/client'
import { useLayoutEffect, useRef } from 'react'
import { OriginalResultScreen } from '../../../app/original-result-screen'
import { hudScale } from '../../../app/hud-layout'
import '../../../app/globals.css'

const params = new URLSearchParams(location.search)
const status = params.get('status') === 'lost' ? 'lost' : 'won'
const level = Number(params.get('level') ?? 1)

function Fixture() {
  const shell = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const resize = () => shell.current?.style.setProperty(
      '--hud-scale', String(hudScale(innerWidth, innerHeight, 'auto'))
    )
    resize()
    addEventListener('resize', resize)
    return () => removeEventListener('resize', resize)
  }, [])
  return (
    <main ref={shell} className="game-shell" data-result-statistics="true">
      <div className="world-viewport" />
      <OriginalResultScreen status={status} level={level} player={1} time={125}
        stage="statistics" inputCycles={0} />
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
