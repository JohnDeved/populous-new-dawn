import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../scripts/browser-native-options.mjs', import.meta.url), 'utf8')
const sizes = ['auto', '1', '1.5', '2', '2.5', '3', '4']
const choose = new Function('assert', 'expect', source.replace(/^import .*\n/gm, '').replaceAll('export async', 'async') + '\nreturn chooseHudSize;')

function fixture(initial, advances = true) {
  let value = initial, clicks = 0
  const row = {
    getAttribute: async name => { assert.equal(name, 'data-hud-size'); return value },
    click: async () => { clicks++; if (advances) value = sizes[(sizes.indexOf(value) + 1) % sizes.length] },
  }
  const scope = { getByRole(role, options) {
    assert.equal(role, 'button')
    assert.ok(options.name.test(`HUD size : <${value}>`))
    return row
  } }
  const change = choose(assert, actual => ({ toHaveAttribute: async (name, expected) => {
    assert.equal(actual, row)
    assert.equal(await row.getAttribute(name), expected, 'wait for the actual displayed transition')
  } }))
  return { change: target => change(scope, target), clicks: () => clicks, value: () => value }
}

test('HUD browser helper uses only ordinary row clicks for all 49 existing value transitions', async () => {
  for (const initial of sizes) for (const target of sizes) {
    const ui = fixture(initial)
    await ui.change(target)
    assert.equal(ui.value(), target)
    assert.equal(ui.clicks(), (sizes.indexOf(target) - sizes.indexOf(initial) + sizes.length) % sizes.length)
  }
  assert.doesNotMatch(source, /evaluate|dispatchEvent|localStorage|setItem|setHudSize|onClick|\.press\(/)
})

test('HUD browser helper rejects unknown values and does not silently certify an unchanged control', async () => {
  await assert.rejects(fixture('auto').change('bogus'), /Unsupported HUD size/)
  await assert.rejects(fixture('bogus').change('auto'), /Unknown displayed HUD size/)
  await assert.rejects(fixture('auto', false).change('1'), /actual displayed transition/)
})

test('all affected HUD consumers use native row interactions or observations without old picker assumptions', () => {
  const selections = [
    'check-browser-building-panel-hover.mjs', 'check-browser-campaign-message-presentation.mjs',
    'check-browser-follower-frame-alpha.mjs', 'check-browser-follower-tasks.mjs',
    'check-browser-follower-transports.mjs', 'check-browser-hud-scale.mjs',
    'check-browser-worship-panel-live.mjs', 'local-render/minimap-frame.mjs',
    'tutorial-browser/compact-message-layout.mjs',
  ]
  for (const file of selections) {
    const text = readFileSync(new URL('../scripts/' + file, import.meta.url), 'utf8')
    assert.match(text, /import \{ (?:choose|change)HudSize \} from/)
    assert.match(text, /await (?:choose|change)HudSize\(/)
    assert.doesNotMatch(text, /selectOption|inputValue\(\)|getByRole\('combobox'[^\n]*HUD size|getByLabel\('HUD size'/)
  }
  for (const file of ['local-render/early-missions.mjs', 'local-render/original-options-ingame.mjs', 'local-render/original-pause-menu.mjs']) {
    const text = readFileSync(new URL('../scripts/' + file, import.meta.url), 'utf8')
    assert.match(text, /getByRole\('button', \{ name: \/\^HUD size : </)
    assert.doesNotMatch(text, /getByRole\('combobox'[^\n]*HUD size/)
  }
  const audio = readFileSync(new URL('../scripts/check-browser-audio-preferences.mjs', import.meta.url), 'utf8')
  assert.match(audio, /toHaveAccessibleName\('♪ Sound on', \{ timeout: 90000 \}\)/)
})


test('HUD round-trip enters every native menu level and returns to play through ordinary buttons', async () => {
  const calls = []
  const change = new Function('chooseHudSize', source.slice(source.indexOf('export async function changeHudSize')).replace('export async', 'async') + '\nreturn changeHudSize;')(
    async (page, value) => { assert.equal(page, scope); assert.equal(value, '2.5'); calls.push('HUD size') }
  )
  const scope = {
    getByRole: (role, { name, exact }) => {
      assert.equal(role, 'button'); assert.equal(exact, true)
      return { click: async () => calls.push(name) }
    },
    locator: selector => ({ waitFor: async ({ state }) => {
      assert.equal(selector, 'dialog[data-original-pause-menu]'); assert.equal(state, 'hidden'); calls.push('closed')
    } }),
  }
  await change(scope, '2.5')
  assert.deepEqual(calls, ['Menu', 'Options', 'Browser compatibility and help', 'HUD size', 'Back to Options', 'Back', 'Continue Game', 'closed'])
})

test('compact persistence uses the minimal public 400% then Automatic route and rejects absent storage', async () => {
  const compact = readFileSync(new URL('../scripts/tutorial-browser/compact-message-layout.mjs', import.meta.url), 'utf8')
  const body = compact.slice(compact.indexOf('async function selectHudPreference'), compact.indexOf('export async function checkCompactMessages'))
  for (const stores of [true, false]) {
    let value='auto', persisted=null, clicks=0
    const row={getAttribute:async()=>value,click:async()=>{clicks++;value=sizes[(sizes.indexOf(value)+1)%sizes.length];if(stores)persisted=value}}
    const chooseReal=choose(assert,actual=>({toHaveAttribute:async(name,want)=>{assert.equal(actual,row);assert.equal(await row.getAttribute(name),want)}}))
    const page={setViewportSize:async()=>{},evaluate:async()=>persisted,getByRole:(_role,{name})=>name instanceof RegExp?row:{click:async()=>{}},
      locator:()=>({waitFor:async()=>{}})}
    const select=new Function('assert','chooseHudSize',body+'\nreturn selectHudPreference;')(assert,chooseReal)
    await assert.rejects(select(page,'auto'),/persisted by its public setting action/)
    assert.equal(clicks,0,'An unstored default is not silently accepted')
    if (!stores) {
      await assert.rejects(select(page,'4'),/persisted by its public setting action/)
      assert.equal(clicks,6)
      continue
    }
    for (const target of ['4','auto']) {
      await select(page,target)
      assert.equal(value,target);assert.equal(persisted,target,'Strict storage witness follows a real public persistence action')
      assert.equal(clicks,target==='4'?6:7,'No redundant preference-cycle clicks')
    }
  }
})
