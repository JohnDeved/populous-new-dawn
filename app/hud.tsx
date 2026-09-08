import native from './original-hud.json'
import { hudGlyph } from './hud-font.ts'
import type { spellButton } from './spell-button.ts'

export function HudSprite({ id }: { id: number | string }) {
  const r = (native.rects as Record<string, { x: number; y: number; w: number; h: number }>)[id]
  return (
    <i
      className="hud-sprite"
      aria-hidden="true"
      style={{ width: r.w, height: r.h, backgroundPosition: `-${r.x}px -${r.y}px` }}
    />
  )
}

export function NativeText({ text, font = 0 }: { text: string; font?: 0 | 2 }) {
  return (
    <span className="native-text" role="img" aria-label={text}>
      {Array.from(text, (c, i) => (
        <HudSprite key={i} id={hudGlyph(c.charCodeAt(0), font)} />
      ))}
    </span>
  )
}

export function SpellButtonArt({ view }: { view: ReturnType<typeof spellButton> }) {
  return (
    <span className="spell-art" aria-hidden="true">
      {view.sprites.map((sprite, i) => (
        <span key={i} style={{ left: sprite.x, top: sprite.y }}>
          <HudSprite id={sprite.id} />
        </span>
      ))}
      {view.fills.length > 0 && (
        <span className="native-charge">
          {view.fills.map((fill, i) => (
            <i
              key={i}
              style={{ width: fill.width, backgroundColor: native.colors[fill.palette] }}
            />
          ))}
        </span>
      )}
    </span>
  )
}
