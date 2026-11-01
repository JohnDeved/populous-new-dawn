import test from 'node:test'

// Two TAP groups run seven supplied scenarios, not gameplay/browser evidence.
// The existing scripts read checker text; they do not launch its browser entry.
await test('Spy lifecycle checker: three supplied opponent scenarios', async () => {
  await import('../scripts/check-spy-lifecycle-opponent.mjs')
})

await test('Spy lifecycle checker: four supplied reveal-order scenarios', async () => {
  await import('../scripts/check-spy-lifecycle-reveal-order.mjs')
})
