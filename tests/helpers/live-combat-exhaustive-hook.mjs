// Independent baseline module graph for paired whole-turn replay. No production
// switch or alternate runtime branch is installed in the shipped application.
export async function load(url, context, nextLoad) {
    const loaded = await nextLoad(url, context)
    if (!url.endsWith('/app/live-combat.ts') && !url.endsWith('/app/live-combat-index.ts')) return loaded
    let source = String(loaded.source)
    if (url.endsWith('/app/live-combat.ts')) {
      const start = source.indexOf('export function combatWorld(')
      const end = source.indexOf('export function selectLiveCombatTarget(', start)
      if (start < 0 || end < 0) throw Error('Exhaustive combat oracle hook lost its source boundary')
      source = `import { exhaustiveCombatWorld } from '../tests/helpers/exhaustive-live-combat.mjs'\n` +
        source.slice(0, start) + 'export const combatWorld = exhaustiveCombatWorld\n\n' + source.slice(end)
    } else {
      const marker = '  sessions.set(w, {})'
      if (!source.includes(marker)) throw Error('Exhaustive combat oracle hook lost its session boundary')
      // Same-cell peers follow the original exhaustive path too; publishers are
      // otherwise identical so only indexing/query selection differs.
      source = source.replace(marker, '  return visit()\n' + marker)
    }
    return { ...loaded, source }
}
