// Decode the immutable capture using builtins only; no application/native execution.
import { readFileSync, writeFileSync } from 'node:fs'
import { deserialize } from 'node:v8'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const folder = 'decomp/research/raid-state33-release/'
const bytes = readFileSync(folder + 'captured-3227/snapshot.bin')
assert.equal(createHash('sha256').update(bytes).digest('hex'), '389ce3174fd613bb7841502ee737301a3e131451022ad8b7152f1613fa316562')
const raw = deserialize(bytes)
const out = { kind: 'Derived raw values; no native encoding or experiment',
  captureSha256: '389ce3174fd613bb7841502ee737301a3e131451022ad8b7152f1613fa316562',
  turn: raw.turn, random: raw.random, cosmetic: raw.cosmetic, activeCampaignTribe: raw.activeCampaignTribe,
  people: raw.people.map(p => {
    assert.equal(p.unit.native, p.registered)
    assert.equal(p.registered, raw.objectCells.objects.get(p.id))
    assert.equal(p.nativeFlags7f.present, false)
    return { id: p.id, nativeFlags7f: { present: false }, person: p.registered }
  }),
  pool: raw.orders, tasks: raw.campaignAIs[3].tasks, cursor: raw.campaignAIs[3].cursor,
  cells: raw.cells, target1022: raw.target1022.building,
  manaWorld: raw.manaWorld, manaTribes: raw.manaTribes,
  castingTribes: raw.castingTribes, levelFlags2: raw.levelFlags2 }
writeFileSync(folder + 'pair/raw-input.json', JSON.stringify(out, null, 2) + '\n')
console.log('Decoded existing capture only; no app/native execution')
