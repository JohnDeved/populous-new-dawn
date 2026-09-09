import { followerNumber, followerIcon, populationMeter } from './hud-population.ts'
import { manaMeter } from './hud-mana.ts'
import type { ManaTribe, ManaWorld } from './mana.ts'
import native from './original-hud.json'
import type { spellButton } from './spell-button.ts'
import { healthBarPixels } from './hud-health.ts'

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

export function ShamanHealth({ health, maximum }: { health: number; maximum: number }) {
  const pixels = healthBarPixels(Math.round(health * 20), Math.round(maximum * 20))
  return (
    <div
      className="health-bar"
      role="meter"
      aria-label="Shaman health"
      aria-valuemin={0}
      aria-valuemax={maximum}
      aria-valuenow={Math.max(0, Math.min(maximum, health))}
    >
      <span style={{ backgroundColor: native.colors[172] }}>
        <i style={{ height: Math.max(0, pixels), backgroundColor: native.colors[130] }} />
      </span>
    </div>
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

export function ManaMeter({ tribe, world }: { tribe: ManaTribe; world: ManaWorld }) {
  const colors = manaMeter(tribe, world)
  return (
    <div
      className="mana-meter"
      role="meter"
      aria-label="Mana production"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round((colors.filter(c => c === 130 || c === 231).length / 44) * 100)}
    >
      <span style={{ backgroundColor: native.colors[172] }}>
        {colors.map((color, i) => (
          <i key={i} style={{ left: i * 2, backgroundColor: native.colors[color] }} />
        ))}
      </span>
    </div>
  )
}

export function FollowerNumber({ count, total = false }: { count: number; total?: boolean }) {
  const label = followerNumber(count, total)
  return (
    <span
      className="follower-number"
      role="img"
      aria-label={String(count)}
      style={{ left: label.x, top: label.y }}
    >
      {label.ids.map((id, i) => (
        <HudSprite key={i} id={id} />
      ))}
    </span>
  )
}

export function PopulationMeter({
  population,
  capacity,
}: {
  population: number
  capacity: number
}) {
  const meter = populationMeter(population, capacity, 0)
  return (
    <span
      className="population-meter"
      role="meter"
      aria-label="Population capacity"
      aria-valuemin={0}
      aria-valuemax={Math.max(1, capacity)}
      aria-valuenow={Math.min(population, Math.max(1, capacity))}
      aria-valuetext={`${population} of ${capacity}`}
    >
      <span style={{ backgroundColor: native.colors[130] }}>
        <i
          style={{
            height: meter.pixels,
            backgroundColor:
              population >= capacity
                ? 'var(--population-full-color, #ff2500)'
                : native.colors[meter.color],
          }}
        />
      </span>
    </span>
  )
}

export function FollowerIcon({ sprite }: { sprite: number }) {
  return (
    <span className="follower-icon" aria-hidden="true">
      {[sprite, sprite + 1].map(id => {
        const p = followerIcon(id)
        return (
          <span key={id} style={{ left: p.x, top: p.y }}>
            <HudSprite id={id} />
          </span>
        )
      })}
    </span>
  )
}
