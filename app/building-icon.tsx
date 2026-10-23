import original from './original-building-icons.json'
import type { BuildingKind } from './world-types'

// Exact normal-art identities from native descriptors 005cc458 + 66 * slot.
// This component does not claim native selected, held, disabled or visibility behavior.
export function BuildingIcon({ kind }: { kind: BuildingKind }) {
  // Prison is a wider model type, not one of the eight admitted HUD entries.
  // Never substitute invented art for an unsupported identity.
  if (!(kind in original.icons)) return null
  const icon = original.icons[kind as keyof typeof original.icons]
  return (
    <i
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: icon.w,
        height: icon.h,
        flex: 'none',
        pointerEvents: 'none',
        imageRendering: 'pixelated',
        backgroundImage: "url('/original/building-icons.png')",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `-${icon.x}px -${icon.y}px`,
      }}
    />
  )
}
