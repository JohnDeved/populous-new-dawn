import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import ts from 'typescript'
import artwork from '../app/original-options-art.json' with {type:'json'}
import frontend from '../app/original-frontend.json' with {type:'json'}
import ingame from '../app/original-pause-font.json' with {type:'json'}
import {frontendBackground} from '../app/frontend-composition.ts'
const source=new Uint8Array(readFileSync(new URL('../public/original/frontend/composition.bin',import.meta.url)))
// Evaluate the production row declarations, rather than copying their strings
// into a fixture. This proves text/shadow inputs, not React focus or live rendering.
const optionsSource = ts.createSourceFile(
  'original-options.tsx',
  readFileSync(new URL('../app/original-options.tsx', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
)
const optionsFunction = optionsSource.statements.find(
  node => ts.isFunctionDeclaration(node) && node.name?.text === 'OriginalOptions'
)
const rowDeclarations = ['gameRows', 'rows'].map(name => {
  const statement = optionsFunction.body.statements.find(
    node => ts.isVariableStatement(node) && node.declarationList.declarations.some(
      declaration => declaration.name.getText(optionsSource) === name
    )
  )
  assert.ok(statement, `Production ${name} declaration exists`)
  return statement.getText(optionsSource)
}).join('\n')
const declaration = name => optionsSource.statements.find(
  node => ts.isVariableStatement(node) && node.declarationList.declarations.some(
    item => item.name.getText(optionsSource) === name
  )
).getText(optionsSource)
const readRows = new Function('useMemo', 'gamePreferences', 'category', 'browser', 'masterText', 'musicText', 'categories',
  ts.transpileModule(`${declaration('unavailableRows')}\n${rowDeclarations}\nreturn rows;`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
  }).outputText
)
const optionRows = (preferences, category = 'Game', browser = false) =>
  readRows(make => make(), preferences, category, browser, 'Master volume : <35%>', 'Music volume : <65%>', ['Game', 'Sound', 'Graphics'])
test('Options uses separate source-hashed original slider banks with unclipped thumb dimensions',()=>{
 assert.equal(artwork.inputs['data/fenew/feslider.spr'],'99dd18f3d07b7e8b36977b60f1543fe089972523c5f364db7fe19d85dc5667c8')
 assert.equal(artwork.inputs['data/fenew/igmslidr.spr'],'ab91567305e23bdbe9923cd8b9ea49956a562fd06dcf549513f27db1220d63da')
 assert.equal(artwork.inputs['data/pal0-c.dat'],'6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53')
 const hashes={}
 for(const skin of ['frontend','ingame']) {
  assert.deepEqual(artwork.banks[skin].map(({w,h})=>[w,h]),[[308,19],[23,22],[23,22]])
  hashes[skin]=artwork.banks[skin].map(({file,w,h})=>{
   const data=readFileSync(new URL(`../public/original/options/${file}`,import.meta.url))
   assert.equal(data.readUInt32BE(16),w);assert.equal(data.readUInt32BE(20),h)
   return createHash('sha256').update(data).digest('hex')
  })
 }
 assert.notDeepEqual(hashes.frontend,hashes.ingame)
 assert.notEqual(hashes.frontend[1],hashes.frontend[2])
 assert.notEqual(hashes.ingame[1],hashes.ingame[2])
})
test('Options indexed shadows are tied to actual labels and reference positions, without stale main labels',()=>{
 const pointer={x:320,y:240},rows=[{text:'Game',x:170,y:420},{text:'Sound',x:320,y:420},{text:'Graphics',x:470,y:420},{text:'Back',x:320,y:454}]
 const plain=frontendBackground(source,pointer,false),options=frontendBackground(source,pointer,false,null,rows)
 assert.notDeepEqual(options,plain)
 assert.notDeepEqual(options,frontendBackground(source,pointer,true))
 assert.deepEqual(options,frontendBackground(source,pointer,false,null,rows))
 assert.notDeepEqual(options,frontendBackground(source,pointer,false,null,[...rows,{text:'Master volume : <35%>',x:320,y:139}]))
 assert.deepEqual(options.subarray(110*640*4,130*640*4),plain.subarray(110*640*4,130*640*4))
})

test('Game publishes all five native positions and only current supported values to indexed shadows', () => {
  const base = [
    { text: 'Game', x: 170, y: 420 },
    { text: 'Sound', x: 320, y: 420 },
    { text: 'Graphics', x: 470, y: 420 },
    { text: 'Back', x: 320, y: 454 },
  ]
  for (const rotation of ['cursor', 'control-cursor']) for (const flipRotation of [false, true]) {
    const rows = optionRows({ rotation, flipRotation })
    const game = rows.slice(4)
    assert.deepEqual(game.map(({ x, y }) => [x, y]), [[320, 139], [320, 169], [320, 199], [320, 229], [320, 259]])
    assert.deepEqual(game.map(({ id }) => id), ['tooltips', 'rotation', 'flipRotation', 'staySelected', 'autocastSpell'])
    const expected = [
      ...base,
      { text: 'Tooltips : <Unavailable>', x: 320, y: 139 },
      { text: `Rotation : <${rotation === 'cursor' ? 'Cursor' : 'Control Cursor'}>`, x: 320, y: 169 },
      { text: `Flip Rotation : <${flipRotation ? 'Yes' : 'No'}>`, x: 320, y: 199 },
      { text: 'Stay Selected : <Unavailable>', x: 320, y: 229 },
      { text: 'Autocast Spell : <Unavailable>', x: 320, y: 259 },
    ]
    assert.deepEqual(rows.map(({ text, x, y }) => ({ text, x, y })), expected)
    const actualPixels = frontendBackground(source, { x: 320, y: 240 }, false, null, rows)
    assert.deepEqual(actualPixels, frontendBackground(source, { x: 320, y: 240 }, false, null, expected))
    assert.notDeepEqual(actualPixels, frontendBackground(source, { x: 320, y: 240 }, false, null, base))
  }
  const preferences = { rotation: 'control-cursor', flipRotation: true }
  assert.deepEqual(optionRows(preferences, 'Game', true), [])
  assert.equal(optionRows(preferences, 'Graphics').some(row => /Rotation|Tooltips|Selected|Autocast/.test(row.text)), false)
  assert.equal(optionRows(preferences, 'Sound').some(row => /Rotation|Tooltips|Selected|Autocast/.test(row.text)), false)
})


const graphics = [
  { text: 'Screen Resolution : <Unavailable>', x: 320, y: 139 },
  { text: 'Sky : <Unavailable>', x: 320, y: 169 },
  { text: 'Footsteps : <Unavailable>', x: 320, y: 199 },
  { text: 'Landscape Detail : <Unavailable>', x: 320, y: 229 },
  { text: 'Quick Defaults : <Unavailable>', x: 320, y: 259 },
]
const direct3D = [
  { text: 'Device Selection : <Unavailable>', x: 320, y: 139 },
  { text: 'Filtering : <Unavailable>', x: 320, y: 169 },
]
test('Graphics and Direct3D publish the native no-gamma rows and full navigation label to indexed shadows', () => {
  const preferences = { rotation: 'cursor', flipRotation: false }
  for (const [category, expected] of [['Graphics', graphics], ['Direct3D', direct3D]]) {
    const rows = optionRows(preferences, category)
    const navigation = [
      { text: 'Game', x: 170, y: 420 },
      { text: 'Sound', x: 320, y: 420 },
      { text: 'Graphics', x: 470, y: 420 },
      { text: 'Back', x: 320, y: 454 },
      { text: 'Direct3D Options', x: 320, y: 390 },
    ]
    assert.deepEqual(rows, [...navigation, ...expected])
    const pixels = frontendBackground(source, { x: 320, y: 240 }, false, null, rows)
    assert.deepEqual(pixels, frontendBackground(source, { x: 320, y: 240 }, false, null, [...navigation, ...expected]))
    assert.notDeepEqual(pixels, frontendBackground(source, { x: 320, y: 240 }, false, null, navigation))
    assert.deepEqual(optionRows(preferences, category, true), [])
  }
  for (const category of ['Game', 'Sound']) {
    assert.equal(optionRows(preferences, category).some(row => /Direct3D/.test(row.text)), false)
  }
})

// Evaluate the production component with deterministic hook state. Browser checks
// additionally exercise React focus, event dispatch, fonts and actual Home/scene callers.
const textFunction = optionsSource.statements.find(
  node => ts.isFunctionDeclaration(node) && node.name?.text === 'Text'
)
const render = new Function('React', 'useEffect', 'useMemo', 'useRef', 'useState', 'frontend', 'ingame', 'styles', 'props',
  ts.transpileModule([
    ...['categories', 'fontBanks', 'unavailableRows'].map(declaration),
    textFunction.getText(optionsSource),
    optionsFunction.getText(optionsSource).replace(/^export /, ''),
    'return OriginalOptions(props);',
  ].join('\n'), {compilerOptions: {target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React}}).outputText
)
function renderOptions(skin, category, highlight = null) {
  const state = [category, false, highlight, true], nodes = [], effects = [], focus = []
  const React = {
    Fragment: 'fragment',
    createElement(type, props, ...children) {
      const element = typeof type === 'function'
        ? type({...props, children}) : {type, props: props ?? {}, children}
      nodes.push(element)
      return element
    },
  }
  render(React, (run, dependencies) => effects.push({run, dependencies}), make => make(),
    () => ({current: {querySelector: selector => ({focus: () => focus.push(selector)})}}),
    () => [state.shift(), () => {}], frontend, ingame, new Proxy({}, {get: (_, key) => key}), {
      skin, volume: .35, musicVolume: .65, storageNotice: '', gameStorageNotice: '',
      gamePreferences: {rotation: 'cursor', flipRotation: false},
      onBack() {}, onVolume() {}, onMusicVolume() {}, onGamePreferences() {},
    })
  effects.find(effect => effect.dependencies.length === 1 && effect.dependencies[0] === category).run()
  return {nodes, focus}
}
test('both skins render unsupported rows as inert notes and focus the full selected Direct3D label by its stable key', () => {
  for (const skin of ['frontend', 'ingame']) for (const [category, expected] of [['Graphics', graphics], ['Direct3D', direct3D]]) {
    const {nodes, focus} = renderOptions(skin, category)
    const notes = nodes.filter(node => node.props.role === 'note')
    assert.deepEqual(notes.map(node => [node.props['aria-label'], node.props.style.top]), expected.map(row => [row.text, row.y]))
    for (const note of notes) {
      assert.equal(note.type, 'div')
      assert.equal(note.props.tabIndex, undefined)
      assert.equal(note.props.disabled, undefined)
      assert.equal(Object.keys(note.props).some(key => /^on[A-Z]/.test(key)), false)
      const text = note.children[0]
      assert.equal(text.props.style.opacity, skin === 'ingame' ? 2 / 3 : 1)
      assert.match(text.children[0][0].props.style.backgroundImage, skin === 'ingame' ? /pause-font/ : /frontend\/feft33we/)
    }
    const nav = nodes.find(node => node.props['data-option-key'] === 'Direct3D')
    assert.equal(nav.props['aria-label'], 'Direct3D Options')
    assert.deepEqual(nav.props.style, {left: 320, top: 390})
    assert.equal(nav.type, category === 'Direct3D' ? 'span' : 'button')
    if (category === 'Direct3D') {
      assert.equal(nav.props['aria-current'], 'page')
      assert.equal(nav.props.tabIndex, -1)
      assert.equal(nav.props.onClick, undefined)
      assert.equal(nav.children[0].props.style.opacity, 1)
      assert.match(nav.children[0].children[0][0].props.style.backgroundImage, skin === 'ingame' ? /pause-font/ : /frontend\/felo33we/)
    }
    assert.deepEqual(focus, [`[aria-current="page"][data-option-key="${category}"]`])
    assert.equal(nodes.some(node => /Gamma|Turns Per Second|Reduce Screen|Colour Palette|Sky Detail|Anti-Aliasing/.test(node.props['aria-label'] ?? '')), false)
  }
})
test('Direct3D Options has room for all 245 original glyph pixels in both fonts and highlights through its internal key', () => {
  for (const bank of [frontend.banks.feft33we, frontend.banks.fehi33we, frontend.banks.felo33we, ingame]) {
    assert.equal([...('Direct3D Options')].reduce((width, letter) => width + bank.rects[letter.charCodeAt(0) - 32].w, 0), 245)
  }
  const css = readFileSync(new URL('../app/original-options.module.css', import.meta.url), 'utf8')
  assert.match(css, /\.choice\[data-option-key='Direct3D'\]\s*\{\s*width:\s*260px;/)
  for (const skin of ['frontend', 'ingame']) {
    const {nodes} = renderOptions(skin, 'Graphics', 'Direct3D')
    const nav = nodes.find(node => node.props['data-option-key'] === 'Direct3D')
    assert.equal(nav.children[0].props.style.opacity, 1)
    assert.match(nav.children[0].children[0][0].props.style.backgroundImage, skin === 'ingame' ? /pause-font/ : /frontend\/fehi33we/)
  }
})
