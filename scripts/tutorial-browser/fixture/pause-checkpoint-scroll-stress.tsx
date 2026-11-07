import { useState } from 'react'
import { OriginalPauseMenu } from '../../../app/original-pause-menu'

// Validation-only synthetic copy, not a shipped error or a game/store state.
export const stressReason = 'Wide checkpoint warning text exercises scrolling without changing native geometry. '.repeat(12).trim()

export default function PauseCheckpointScrollStress() {
  const [open, setOpen] = useState(true)
  const unexpected = () => { throw new Error('Unexpected component stress action') }
  return <div data-evidence-scope="component-scroll-stress">
    {open && <OriginalPauseMenu
      tutorial={false}
      hasCheckpoint={false}
      checkpointReadStatus="read"
      saveDisabledReason={stressReason}
      onRetryCheckpoint={unexpected}
      renderOptions={() => null}
      onContinue={() => setOpen(false)}
      onSave={async () => unexpected()}
      onLoad={unexpected}
      onRestart={unexpected}
      onQuitLevel={unexpected}
      onQuitGame={unexpected}
    />}
  </div>
}
