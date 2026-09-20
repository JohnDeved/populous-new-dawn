export interface AudioPreferences {
  volume: number
  musicVolume: number
}

export const DEFAULT_AUDIO_PREFERENCES: Readonly<AudioPreferences> = {
  volume: 0.35,
  musicVolume: 0.65,
}
export const AUDIO_PREFERENCES_KEY = 'populous-audio-preferences'

function isVolume(level: unknown): level is number {
  return typeof level === 'number' && Number.isFinite(level) && level >= 0 && level <= 1
}

function hasAudioVolumes(value: unknown): value is AudioPreferences {
  return (
    typeof value === 'object' &&
    value !== null &&
    'volume' in value &&
    'musicVolume' in value &&
    isVolume(value.volume) &&
    isVolume(value.musicVolume)
  )
}

// Browser preferences are separate from game/profile checkpoints. Reads never
// replace unsupported or corrupt data; only an explicit control change writes.
export function readAudioPreferences(): AudioPreferences {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(AUDIO_PREFERENCES_KEY) ?? 'null')
    if (hasAudioVolumes(saved) && 'version' in saved && saved.version === 1)
      return { volume: saved.volume, musicVolume: saved.musicVolume }
  } catch {
    // SSR and browsers with disabled storage still use the existing defaults.
  }
  return { ...DEFAULT_AUDIO_PREFERENCES }
}

export function saveAudioPreferences(preferences: AudioPreferences): boolean {
  if (!hasAudioVolumes(preferences)) return false
  try {
    localStorage.setItem(
      AUDIO_PREFERENCES_KEY,
      JSON.stringify({
        version: 1,
        volume: preferences.volume,
        musicVolume: preferences.musicVolume,
      })
    )
    return true
  } catch {
    return false
  }
}
