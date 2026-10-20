import { useEffect, useRef, useState } from 'react'
import type { createGameStore } from './game-store'
import type { GameScene } from './scene'
import { SPELLS } from './world-rules'
import type { Spell } from './world-types'
import { SpellButtonArt } from './hud'
import { spellHudButton, spellHudPermanent, spellHudVisibility } from './spell-visibility'
import { CHEAT_SAVE_NOTICE, type SpellTestCheat } from './spell-test-cheats'
import styles from './spell-test-menu.module.css'

export function SpellTestMenu({
  store,
  scene,
  onClose,
  onSelect,
}: {
  store: ReturnType<typeof createGameStore>
  scene: GameScene
  onClose: () => void
  onSelect: (spell: Spell) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [notice, setNotice] = useState(
    'No cheats applied. Opening this menu does not grant anything.'
  )
  const world = store.getWorld()
  useEffect(() => {
    const modal = dialog.current,
      previousFocus = document.activeElement
    scene.setModalSuspended(true)
    modal?.showModal()
    // Do not place initial focus on a resource grant.
    modal?.querySelector<HTMLButtonElement>('[data-cheat-close]')?.focus()
    return () => {
      modal?.close()
      if (store.getWorld() === world) {
        scene.setModalSuspended(false)
      }
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [scene, store, world])
  function grant(action: SpellTestCheat) {
    if (!store.applySpellTestCheat(action)) {
      setNotice('Cheats are unavailable while mission controls are locked.')
      return
    }
    setNotice(
      action === 'unlock'
        ? 'All implemented spells unlocked and refilled.'
        : action === 'refill'
          ? 'Available spell charges refilled.'
          : 'Incoming mana refilled to at least 1,000,000. It follows normal distribution when play resumes.'
    )
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="spell-test-title"
      data-spell-test-menu
      onCancel={event => {
        event.preventDefault()
        onClose()
      }}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          if (!event.repeat) onClose()
        } else if (event.key === 'F8') {
          event.preventDefault()
          event.stopPropagation()
          if (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey)
            scene.togglePerformance()
        } else if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault()
      }}
    >
      <header>
        <h2 id="spell-test-title">Cheats / spell testing</h2>
        <button type="button" data-cheat-close onClick={onClose}>
          Close · F9
        </button>
      </header>
      <p>
        Session-only testing. Grants disable saving and campaign progress for this mission. Restart
        or load your unchanged checkpoint to return to normal play.
      </p>
      <div className={styles.actions}>
        <button type="button" onClick={() => grant('unlock')}>
          Unlock + refill all spells
        </button>
        <button type="button" onClick={() => grant('refill')}>
          Refill available charges
        </button>
        <button type="button" onClick={() => grant('mana')}>
          Refill mana
        </button>
      </div>
      <p role="status">{notice}</p>
      <p>
        Select a spell, then click a valid target in the world. Normal range, Shaman readiness,
        costs and cooldowns still apply. This menu lists only implemented spells; it does not add
        missing spell behavior.
      </p>
      <div className={styles.spells} aria-label="Test spell selection">
        {SPELLS.map(spell => {
          const visibility = spellHudVisibility(world, spell),
            available = visibility === 'visible',
            stock = world.shots[spell.id],
            view = spellHudButton(visibility, {
              model: spell.model,
              permanent: spellHudPermanent(world, spell),
              charging: false,
              hovered: false,
              selected: world.mode === spell.id,
              stock,
              gifts: world.giftCounts[spell.id],
              progress: 0,
            })
          return (
            <button
              type="button"
              key={spell.id}
              disabled={!available}
              aria-label={`Test ${spell.name}, ${stock} shots`}
              onClick={() => onSelect(spell.id)}
            >
              <span className={styles.art}>
                <SpellButtonArt view={view} />
              </span>
              <span>
                {spell.name}
                <small>{available ? `${stock} shots` : 'Locked'}</small>
              </span>
            </button>
          )
        })}
      </div>
      {store.hasUsedCheats() && <p className={styles.warning}>{CHEAT_SAVE_NOTICE}</p>}
    </dialog>
  )
}
