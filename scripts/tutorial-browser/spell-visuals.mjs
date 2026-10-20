import spellAngel from './angel-visuals.mjs'
// One fixed180s hosted shard. Future Shield wiring belongs immediately after the
// awaited Angel closure and must use its own45s inclusive /55s admission guard.
// Until separately integrated there is no skipped/fake Shield success entry.
export default async function spellVisuals(options, runAngel = spellAngel) {
  const angel = await runAngel(options)
  if (angel.status !== 'passed' || !angel.contextClosed) throw Error('Angel episode did not pass and close')
  return { episodes: ['angel'], angel }
}
