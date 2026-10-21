import { useEffect, useState } from 'react'
import { pauseStatusLayout } from './pause-status-layout'
import styles from './original-pause-status.module.css'

const label = 'Paused'

export function OriginalPauseStatus() {
  const [layout, setLayout] = useState(() => pauseStatusLayout(640, 480))
  useEffect(() => {
    const resize = () => setLayout(pauseStatusLayout(window.innerWidth, window.innerHeight))
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return (
    <div
      className={styles.status}
      data-original-pause-status
      data-font={layout.font}
      role="status"
      aria-label={label}
      style={{ height: layout.height }}
    >
      <span className="game-a11y-status">{label}</span>
      {layout.glyphs.map((rect, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={styles.glyph}
          style={{
            width: rect.w,
            height: rect.h,
            backgroundPosition: `-${rect.x}px -${rect.y}px`,
          }}
        />
      ))}
    </div>
  )
}
