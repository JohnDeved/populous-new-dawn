export interface GamePreferences {
  rotation: 'cursor' | 'control-cursor'
  flipRotation: boolean
}

// Preserve the browser's existing keyboard mapping. Native installed defaults
// and persistence have not been established by the settings-bit evidence.
export const DEFAULT_GAME_PREFERENCES: Readonly<GamePreferences> = {
  rotation: 'cursor',
  flipRotation: false,
}
export const GAME_PREFERENCES_KEY = 'populous-game-preferences'

function hasGamePreferences(value: unknown): value is GamePreferences {
  return (
    typeof value === 'object' &&
    value !== null &&
    'rotation' in value &&
    (value.rotation === 'cursor' || value.rotation === 'control-cursor') &&
    'flipRotation' in value &&
    typeof value.flipRotation === 'boolean'
  )
}

// These browser input preferences never enter world/profile checkpoints. Reads
// leave unknown or corrupt records intact until the player changes a control.
export function readGamePreferences(): GamePreferences {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(GAME_PREFERENCES_KEY) ?? 'null')
    if (hasGamePreferences(saved) && 'version' in saved && saved.version === 1)
      return { rotation: saved.rotation, flipRotation: saved.flipRotation }
  } catch {
    // SSR and disabled browser storage retain the compatibility defaults.
  }
  return { ...DEFAULT_GAME_PREFERENCES }
}

export function saveGamePreferences(preferences: GamePreferences): boolean {
  if (!hasGamePreferences(preferences)) return false
  try {
    localStorage.setItem(
      GAME_PREFERENCES_KEY,
      JSON.stringify({
        version: 1,
        rotation: preferences.rotation,
        flipRotation: preferences.flipRotation,
      })
    )
    return true
  } catch {
    return false
  }
}
