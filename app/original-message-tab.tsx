import type { CSSProperties } from 'react'
import art from './original-message-tabs.json'
import styles from './original-message-tab.module.css'

const sprite = (id: number) => art.sprites[String(id) as keyof typeof art.sprites]
// Center and strips precede the full corners, matching the native HFX painter.
const painterOrder = [4, 1, 7, 3, 5, 0, 2, 6, 8]

export function OriginalMessageTab({ flags }: { flags: number }) {
  const icons = art.icons[flags & 1 ? '3' : '1']
  return (
    <span
      className={styles.art}
      data-native-message-tab
      data-active={!!(flags & 2)}
      aria-hidden="true"
    >
      {painterOrder.map(position => (
        <i
          key={position}
          className={styles.tile}
          data-position={position}
          style={
            {
              '--tile-normal': `url('${sprite(art.descriptors.normal[position]).src}')`,
              '--tile-hover': `url('${sprite(art.descriptors.hover[position]).src}')`,
              '--tile-active': `url('${sprite(art.descriptors.active[position]).src}')`,
            } as CSSProperties
          }
        />
      ))}
      {(['normal', 'active'] as const).map(state => {
        const icon = sprite(icons[state])
        return (
          <img
            key={state}
            data-icon={state}
            src={icon.src}
            alt=""
            style={
              {
                '--icon-width': `${icon.width}px`,
                '--icon-height': `${icon.height}px`,
              } as CSSProperties
            }
          />
        )
      })}
    </span>
  )
}
