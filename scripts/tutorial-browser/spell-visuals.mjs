import spellAngel from './angel-visuals.mjs'
import spellShield from './shield-visuals.mjs'
// Both episodes are mandatory under one unmodified outer deadline. Never start
// Shield until Angel has passed and its context closure has been observed.
export default async function spellVisuals(options, runAngel = spellAngel, runShield = spellShield) {
  const angel = await runAngel(options)
  if (angel.status !== 'passed' || !angel.contextClosed) throw Error('Angel episode did not pass and close')
  const shield = await runShield(options)
  if (shield.status !== 'passed' || !shield.cleanup?.contextClosed || !shield.cleanup?.closedWithinBudget)
    throw Error('Shield episode did not pass and close')
  return { episodes: ['angel', 'shield'], angel, shield }
}
