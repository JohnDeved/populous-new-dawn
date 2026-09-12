import rules from './original-rules.json' with { type: 'json' }
import hud from './original-hud.json' with { type: 'json' }
import { chargeFills } from './hud-charge.ts'

interface SpellButtonState {
  model: number
  permanent: boolean
  charging: boolean
  hovered: boolean
  selected: boolean
  stock: number
  gifts: number
  progress: number
}

// 0x4c2fe0: stable mana-cost order; unavailable descriptor slots are omitted.
export const spellOrder = rules.spellCharging
  .map((spell, model) => ({ ...spell, model }))
  .filter(spell => spell.model && spell.mode)
  .toSorted((a, b) => a.cost - b.cost)
  .map(spell => spell.model)

// Native spacing cache for the fixed logical width and ordinary 1–4-shot limits.
const shotPositions = [[], [12], [7, 17], [7, 12, 17], [5, 10, 15, 20]]
const rects = hud.rects as Record<string, { w: number; h: number }>

// 0x49daf0 at the HUD's 31×43 logical button size. Window scaling and the
// remaining control-slot/locked-state dispatcher still belong to the UI adapter.
export function spellButton(s: SpellButtonState) {
  const rule = rules.spellCharging[s.model]
  let state = s.selected ? 1 : 0
  if (s.hovered) state = 2
  const border = (s.permanent ? 821 : 510) + state * 9
  const [readyIcon, inactiveIcon, hoverIcon] = rule.icons
  let icon = s.charging || s.stock ? readyIcon : inactiveIcon
  if (s.hovered) icon = hoverIcon
  const iconRect = rects[icon] ?? { w: 28, h: 25 }
  const emptyMarkers = s.permanent ? [55, 68] : [66, 67]
  const sprites = shotPositions[rule.normalLimit].map((x, i) => {
    let id = emptyMarkers[Number(s.hovered)]
    if (i < s.stock) id = i < s.gifts ? 65 : 54
    return { id, x, y: 2 }
  })
  sprites.push({
    id: icon,
    x: 15 - Math.trunc(iconRect.w / 2),
    y: 21 - Math.trunc(iconRect.h / 2),
  })
  const fills =
    s.permanent && s.charging && !s.hovered && rule.mode !== 2
      ? chargeFills(s.progress, rule.cost, 24)
      : []
  const frame = `button${s.permanent ? '' : '-gift'}${['', '-selected', '-hover'][state]}`
  return { border, frame, sprites, fills }
}
