import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
const head = '9c88a0d433b90f6a0539d48e46e0c82877f12f9d'
const source = execFileSync('git', ['show', `${head}:qa/campaign-continuity/scenario.mjs`], { encoding: 'utf8' })
const section = (name, next) => source.slice(source.indexOf(`  const ${name} =`), source.indexOf(`  const ${next} =`))
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const execute = new AsyncFunction('assert', 'original', `
  const before = { turn: 20, lastOrderTurn: 19, selected: [30] };
  const read = async () => before, requireOrderable = () => {}, requireDeclaredPreacherOrder = () => {},
    capturePendingSermon = async () => {}, sermonPlan = null, log = () => {};
  const prepareEntityClick = async () => {};
  const page = { mouse: { click: async () => { throw original } },
    evaluate: async () => ({ restored: true, errors: [], events: [] }) };
  ${section('finishEntityClick', 'clickOrder')}
  ${section('clickOrder', 'groundHit')}
  try { await clickOrder({ id: 29, collection: 'shrines', x: 814, y: 300 }); }
  catch (error) { return { sameError: error === original, hasOriginalCause: error.cause === original, name: error.name, message: error.message }; }
`)
const original = Error('Browser input delivery failed before pointerdown')
const result = await execute(assert, original)
assert.equal(result.sameError, false)
assert.equal(result.hasOriginalCause, false)
assert.match(result.message, /Retain the actually delivered ordinary pointer pair/)
console.log(JSON.stringify({ head, reproduced: true, originalError: original.message, ...result }, null, 2))
