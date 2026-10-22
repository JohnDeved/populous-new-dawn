import { useState, type CSSProperties } from 'react'
import styles from './query-control.module.css'

// 005caba8/005cabc0/005cabd8 row-major frame IDs; 004a1f50 tiles the
// middle/edge pieces rather than stretching their original pixels.
const frameOffsets = [0, 4, 1, 6, 8, 7, 2, 5, 3]
const frameRects = [
  [0, 0, 4, 4],
  [4, 0, 5, 4],
  [9, 0, 4, 4],
  [0, 4, 4, 4],
  [4, 4, 5, 4],
  [9, 4, 4, 4],
  [0, 8, 4, 4],
  [4, 8, 5, 4],
  [9, 8, 4, 4],
]

/** Original 640-reference Query artwork. The interim Menu callback and name are
 * deliberately retained until the complete Encyclopaedia is safe to activate. */
export function QueryControlArt() {
  const [failed, setFailed] = useState(false)
  return (
    <span
      className={styles.art}
      data-query-art={failed ? 'failed' : 'source-bound'}
      aria-hidden="true"
    >
      {failed ? (
        // Exceptional recovery only; not accepted as native artwork.
        <span className={styles.fallback} aria-hidden="true">
          ?
        </span>
      ) : (
        <>
          {(['normal', 'hover', 'held'] as const).map((state, stateIndex) => (
            <span key={state} className={`${styles.frame} ${styles[state]}`} aria-hidden="true">
              {frameRects.map(([left, top, width, height], index) => (
                <i
                  key={index}
                  style={
                    {
                      left,
                      top,
                      width,
                      height,
                      backgroundImage: `url('/original/query-control/hfx-${[1005, 996, 1014][stateIndex] + frameOffsets[index]}.png')`,
                    } as CSSProperties
                  }
                >
                  <img
                    className={styles.probe}
                    src={`/original/query-control/hfx-${[1005, 996, 1014][stateIndex] + frameOffsets[index]}.png`}
                    alt=""
                    onError={() => setFailed(true)}
                  />
                </i>
              ))}
            </span>
          ))}
          <img
            className={styles.icon}
            src="/original/query-control/hfx-105.png"
            width={4}
            height={6}
            alt=""
            onError={() => setFailed(true)}
          />
        </>
      )}
    </span>
  )
}
