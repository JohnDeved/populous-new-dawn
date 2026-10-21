import { createRoot } from 'react-dom/client'
import { useLayoutEffect, useRef, useState } from 'react'
import { OriginalCampaignPopup } from '../../../app/original-campaign-popup'
import {
  acknowledgeMessage,
  createMessages,
  addMessage,
  messageHasDelete,
  messageText,
  messageViewPoint,
} from '../../../app/messages'
import { showCampaignPopup } from '../../../app/campaign-popup-session'
import { hudScale } from '../../../app/hud-layout'

const params = new URLSearchParams(location.search)
const before = params.has('before')
if (before) await import('virtual:campaign-baseline.css')
else await import('../../../app/globals.css')
const oneShot = params.has('oneShot')
const state = createMessages()
addMessage(state, 641, () => 0)
if (oneShot) state.slots[0]!.flags |= 0x200
if (params.has('multi')) {
  addMessage(state, 644, () => 0)
  state.slots[1]!.view = { cell: 0x60cc, payload: 308 }
  if (params.has('mixed')) state.slots[1]!.flags |= 0x200
}
const focusCalls: ReturnType<typeof messageViewPoint>[] = []
const pauseOwner = { paused: true }

let acknowledgments = 0,
  deletions = 0,
  leakedKeys = 0
addEventListener('keydown', () => leakedKeys++)
function Fixture() {
  const shell = useRef<HTMLElement>(null),
    details = useRef(new Map<number, HTMLDetailsElement>())
  const [, render] = useState(0)
  useLayoutEffect(() => {
    const resize = () => {
      if (before)
        for (const [slot, node] of details.current)
          node.toggleAttribute('data-lower', 300 + slot * 30 > Math.trunc(innerHeight / 2))
      shell.current?.style.setProperty(
        '--hud-scale',
        String(hudScale(innerWidth, innerHeight, 'auto'))
      )
    }
    if (params.has('diagnostics')) {
      void fetch('/diagnostics.html')
        .then(response => response.text())
        .then(html => {
          const graph = document.createElement('aside')
          graph.className = 'fps-graph'
          graph.innerHTML = html
          const renderer = graph.querySelector('[data-metric="renderer"]')!
          renderer.textContent =
            'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)'
          for (const metric of graph.querySelectorAll('[data-metric]')) {
            if (metric === renderer || metric.getAttribute('data-metric') === 'export-status')
              continue
            metric.textContent =
              metric.getAttribute('data-metric') === 'fps'
                ? '60'
                : metric.getAttribute('data-metric')?.includes('tail')
                  ? '16.0 / 20.0 / 28.0'
                  : '16.0 ms'
          }
          shell.current?.appendChild(graph)
        })
    }
    resize()
    addEventListener('resize', resize)
    Object.assign(window, {
      popupFixture: {
        read: () => ({
          state: structuredClone(state),
          acknowledgments,
          deletions,
          leakedKeys,
          focusCalls,
          paused: pauseOwner.paused,
        }),
        autoOpen: (slot: number) =>
          showCampaignPopup(details.current.get(slot)!, details.current.values()),
      },
    })
    return () => removeEventListener('resize', resize)
  }, [])
  return (
    <main ref={shell} className="game-shell">
      <div className="world-viewport" />
      <aside
        className="campaign-messages"
        aria-label="Campaign messages"
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.stopPropagation()
            if (event.repeat) event.preventDefault()
          }
        }}
      >
        {state.slots.map(
          (message, slot) =>
            message && (
              <details
                key={message.serial}
                open={slot === 0}
                ref={node => {
                  if (node) details.current.set(slot, node)
                  else details.current.delete(slot)
                }}
                data-message-serial={message.serial}
                style={
                  {
                    '--message-height': '24px',
                    '--message-top': `${300 + slot * 30}px`,
                    top: 300 + slot * 30,
                  } as React.CSSProperties
                }
              >
                <summary
                  aria-label="Read campaign message"
                  onClick={event => {
                    if (before) return
                    event.preventDefault()
                    const node = details.current.get(slot)!
                    if (node.open) node.open = false
                    else {
                      const target = messageViewPoint(message)
                      if (target) focusCalls.push(target)
                      showCampaignPopup(node, details.current.values())
                    }
                  }}
                >
                  <img src="/original/message.png" alt="" />
                </summary>
                {before ? (
                  <div>
                    <p>{messageText(message.stringId)}</p>
                    <button aria-label="Dismiss campaign message">×</button>
                  </div>
                ) : (
                  <OriginalCampaignPopup
                    text={messageText(message.stringId)}
                    onAcknowledge={() => {
                      acknowledgments++
                      const node = details.current.get(slot)!
                      node.open = false
                      acknowledgeMessage(state, slot)
                      render(value => value + 1)
                      if (state.slots[slot]) node.querySelector('summary')?.focus()
                    }}
                    onDelete={
                      messageHasDelete(message)
                        ? () => {
                            deletions++
                            acknowledgeMessage(state, slot, true)
                            render(value => value + 1)
                          }
                        : undefined
                    }
                  />
                )}
              </details>
            )
        )}
      </aside>
    </main>
  )
}
createRoot(document.getElementById('root')!).render(<Fixture />)
