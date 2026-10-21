import { useEffect, useRef } from 'react'
import { missionNumbers } from './mission-data'

/** F8-only diagnostic access. Never an awarding campaign launch. */
export function DebugMissionPicker({
  onStart,
  onClose,
}: {
  onStart: (mission: number) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialog.current?.showModal()
    return () => dialog.current?.close()
  }, [])
  return (
    <dialog
      ref={dialog}
      className="game-dialog debug-mission-picker"
      data-debug-mission-picker
      aria-label="Debug missions"
      onCancel={event => {
        event.preventDefault()
        onClose()
      }}
    >
      <h2 tabIndex={-1} autoFocus>
        Debug missions
      </h2>
      <p>Diagnostic runs do not award campaign progress and cannot be saved.</p>
      <div>
        {missionNumbers.map(mission => (
          <button
            key={mission}
            aria-label={`Mission ${mission}`}
            onClick={() => onStart(mission)}
            onKeyDown={event => {
              if (event.repeat && (event.key === 'Enter' || event.key === ' '))
                event.preventDefault()
            }}
          >
            Mission {mission}
          </button>
        ))}
      </div>
      <button onClick={onClose}>Back</button>
    </dialog>
  )
}
