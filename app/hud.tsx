import native from './original-hud.json'
import { hudGlyph } from './hud-font.ts'

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
