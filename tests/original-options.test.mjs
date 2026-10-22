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
const rowDeclarations = ['browserLabel', 'gameRows', 'activeStorageNotice', 'storageRows', 'rows'].map(name => {
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
const readRows = new Function('useMemo', 'gamePreferences', 'category', 'browser', 'masterText', 'musicText', 'categories', 'ingame', 'skin', 'gameStorageNotice', 'storageNotice',
  ts.transpileModule([
    ...['unavailableRows', 'browserFallback', 'browserTitle', 'ingameStorageCopy'].map(declaration),
    optionsSource.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'noticeLines').getText(optionsSource),
    'const compatibility = undefined;', rowDeclarations, 'return rows;',
  ].join('\n'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
  }).outputText
)
const optionRows = (preferences, category = 'Game', browser = false, notices = {}, skin = 'frontend') =>
  readRows(make => make(), preferences, category, browser, 'Master volume : <35%>', 'Music volume : <65%>', ['Game', 'Sound', 'Graphics'], ingame, skin, notices.gameStorageNotice ?? '', notices.storageNotice ?? '')
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

test('Game publishes five native positions and the browser-only sixth row and only current supported values to indexed shadows', () => {
  const base = [
    { text: 'Game', x: 170, y: 420 },
    { text: 'Sound', x: 320, y: 420 },
    { text: 'Graphics', x: 470, y: 420 },
    { text: 'Back', x: 320, y: 454 },
  ]
  for (const rotation of ['cursor', 'control-cursor']) for (const flipRotation of [false, true]) {
    const rows = optionRows({ rotation, flipRotation })
    const game = rows.slice(4)
    assert.deepEqual(game.map(({ x, y }) => [x, y]), [[320, 139], [320, 169], [320, 199], [320, 229], [320, 259], [320, 289]])
    assert.deepEqual(game.map(({ id }) => id), ['tooltips', 'rotation', 'flipRotation', 'staySelected', 'autocastSpell', 'compatibility'])
    const expected = [
      ...base,
      { text: 'Tooltips : <Unavailable>', x: 320, y: 139 },
      { text: `Rotation : <${rotation === 'cursor' ? 'Cursor' : 'Control Cursor'}>`, x: 320, y: 169 },
      { text: `Flip Rotation : <${flipRotation ? 'Yes' : 'No'}>`, x: 320, y: 199 },
      { text: 'Stay Selected : <Unavailable>', x: 320, y: 229 },
      { text: 'Autocast Spell : <Unavailable>', x: 320, y: 259 },
      { text: 'Browser compatibility and help', x: 320, y: 289 },
    ]
    assert.deepEqual(rows.map(({ text, x, y }) => ({ text, x, y })), expected)
    const actualPixels = frontendBackground(source, { x: 320, y: 240 }, false, null, rows)
    assert.deepEqual(actualPixels, frontendBackground(source, { x: 320, y: 240 }, false, null, expected))
    assert.notDeepEqual(actualPixels, frontendBackground(source, { x: 320, y: 240 }, false, null, base))
  }
  const preferences = { rotation: 'control-cursor', flipRotation: true }
  assert.equal(optionRows(preferences, 'Game', true)[0].text, 'Browser compatibility and help')
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
    assert.equal(optionRows(preferences, category, true)[0].text, 'Browser compatibility and help')
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
const render = new Function('requestAnimationFrame', 'MenuTooltip', 'React', 'useEffect', 'useMemo', 'useRef', 'useState', 'frontend', 'ingame', 'styles', 'props',
  ts.transpileModule([
    ...['categories', 'fontBanks', 'unavailableRows', 'hudSizes', 'browserFallback', 'browserTitle', 'ingameStorageCopy'].map(declaration),
    optionsSource.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'noticeLines').getText(optionsSource),
    textFunction.getText(optionsSource),
    optionsFunction.getText(optionsSource).replace(/^export /, ''),
    'const useLayoutEffect = useEffect; return OriginalOptions(props);',
  ].join('\n'), {compilerOptions: {target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React}}).outputText
)
function renderOptions(skin, category, highlight = null, browser = false, props = {}) {
  const state = [category, browser, highlight, skin, skin], nodes = [], effects = [], focus = [], changes = []
  let hook = 0
  const React = {
    Fragment: 'fragment',
    createElement(type, props, ...children) {
      const element = typeof type === 'function'
        ? type({...props, children}) : {type, props: props ?? {}, children}
      if (element) nodes.push(element)
      return element
    },
  }
  render(run => run(), () => null, React, (run, dependencies) => effects.push({run, dependencies}), make => make(),
    () => ({current: {querySelector: selector => ({focus: () => focus.push(selector)})}}),
    () => { const index = hook++; return [state.shift(), value => changes.push({index, value})] }, frontend, ingame, new Proxy({}, {get: (_, key) => key}), {
      skin, volume: .35, musicVolume: .65, storageNotice: '', gameStorageNotice: '',
      gamePreferences: {rotation: 'cursor', flipRotation: false},
      onBack() {}, onVolume() {}, onMusicVolume() {}, onGamePreferences() {},
      ...props,
    })
  effects.find(effect => effect.dependencies.length === 1 && effect.dependencies[0] === category).run()
  return {nodes, focus, changes, effects}
}

test('browser help opens at its heading, not its trailing Back button, on every visit', () => {
  for (const skin of ['frontend', 'ingame']) for (let visit = 0; visit < 3; visit++) {
    const help = renderOptions(skin, 'Game', null, true)
    const heading = help.nodes.find(node => 'data-browser-help-heading' in node.props)
    assert.equal(heading.type, 'h2')
    assert.equal(heading.props.tabIndex, -1, 'entry focus does not add a heading to the Tab order')
    assert.equal(heading.props.style.top, skin === 'frontend' ? 139 : 79, 'frontend header clears the original logo at y10..111')
    assert.equal(heading.props['aria-label'], 'Browser compatibility and help')
    assert.match(heading.children[0].props.className, /text/)
    const entry = help.effects.find(effect => effect.dependencies.length === 1 && effect.dependencies[0] === true)
    entry.run()
    assert.equal(help.focus.at(-1), '[data-browser-help-heading]')
    assert.equal(help.focus.includes('[data-return-options]'), false)
    const back = help.nodes.find(node => node.props['data-return-options'])
    back.props.onClick()
    assert.deepEqual(help.changes.at(-1), {index: 1, value: false})
    assert.equal(help.focus.at(-1), '[data-compatibility]', 'Back retains the original Options row focus')
    const options = renderOptions(skin, 'Game')
    const before = [...options.focus]
    options.effects.find(effect => effect.dependencies.length === 1 && effect.dependencies[0] === false).run()
    assert.deepEqual(options.focus, before, 'a closed help panel never takes focus')
  }
})
test('both skins render unsupported rows as inert notes and focus the full selected Direct3D label by its stable key', () => {
  for (const skin of ['frontend', 'ingame']) for (const [category, expected] of [['Graphics', graphics], ['Direct3D', direct3D]]) {
    const {nodes, focus} = renderOptions(skin, category)
    const notes = nodes.filter(node => node.props.role === 'note')
    assert.deepEqual(notes.map(node => [node.props['aria-label'], node.props.style.top]), expected.map(row => [row.text, row.y]))
    for (const note of notes) {
      assert.equal(note.type, 'div')
      assert.equal(note.props.tabIndex, 0)
      assert.equal(note.props['data-menu-tooltip'], note.props['aria-description'])
      assert.match(note.props['aria-description'], /not available in the browser version/)
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


test('Options keeps explanatory copy on keyboard-accessible selector tooltips, not persistent paragraphs', () => {
  for (const skin of ['frontend', 'ingame']) for (const category of ['Game', 'Sound', 'Graphics', 'Direct3D']) {
    const {nodes} = renderOptions(skin, category)
    assert.equal(nodes.some(node => node.type === 'p'), false)
    const targets = nodes.filter(node => node.props['data-menu-tooltip'])
    assert.ok(targets.length >= 2)
    for (const target of targets) {
      assert.equal(target.props['aria-description'], target.props['data-menu-tooltip'])
      assert.ok(target.type === 'button' || target.type === 'input' || target.props.tabIndex === 0)
      if (target.props.role === 'note') assert.equal(target.props.onClick, undefined)
    }
    const browser = nodes.find(node => node.props['data-compatibility'])
    assert.equal(Boolean(browser), category === 'Game')
    if (browser) {
      assert.equal(browser.type, 'button')
      assert.equal(browser.props['aria-label'], 'Browser compatibility and help')
      assert.equal(typeof browser.props.onClick, 'function')
    }
    if (category === 'Game') {
      for (const key of ['rotation', 'flipRotation']) {
        assert.equal(typeof nodes.find(node => node.props['data-option-key'] === key).props.onClick, 'function')
      }
    }
    if (category === 'Sound') {
      const sliders = nodes.filter(node => node.props.type === 'range')
      assert.deepEqual(sliders.map(node => node.props.value), [.35, .65])
      assert.ok(sliders.every(node => typeof node.props.onChange === 'function'))
      const destination = skin === 'frontend'
        ? 'Enable audio from the battlefield menu.'
        : 'Enable audio in Browser compatibility and help.'
      assert.equal(sliders[0].props['data-menu-tooltip'], `Master volume also affects music. ${destination}`)
      assert.equal(sliders[1].props['data-menu-tooltip'], destination)
    }
  }
  const css = readFileSync(new URL('../app/original-options.module.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /browserLink/)
})

test('all Options tooltip text fits the original selector font within its reference frame', () => {
  const {fonts} = JSON.parse(readFileSync(new URL('../public/original/world-selector/text/provenance.json', import.meta.url)))
  for (const category of ['Game', 'Sound', 'Graphics', 'Direct3D']) {
    const {nodes} = renderOptions('frontend', category)
    for (const node of nodes.filter(node => node.props['data-menu-tooltip'])) {
      const glyphs = [...node.props['data-menu-tooltip']].map(letter => fonts.tooltip.glyphs[letter.charCodeAt(0) - 32])
      assert.ok(glyphs.every(Boolean))
      assert.ok(glyphs.reduce((sum, glyph) => sum + glyph.advance, 0) < 620)
    }
  }
})


test('Game browser row uses ordinary native highlight, activation and Back focus in both skins', () => {
  for (const skin of ['frontend', 'ingame']) {
    const {nodes, changes} = renderOptions(skin, 'Game')
    const row = nodes.find(node => node.props['data-compatibility'])
    assert.equal(row.props['data-option-key'], 'compatibility')
    assert.equal(row.props.tabIndex, undefined, 'ordinary button participates in native keyboard order')
    assert.deepEqual(row.props.style, {left: 320, top: 289})
    assert.match(row.props.className, /choice gameChoice/)
    row.props.onFocus(); assert.deepEqual(changes.at(-1), {index: 2, value: 'compatibility'})
    row.props.onClick(); assert.deepEqual(changes.at(-1), {index: 1, value: true})
    const highlighted = renderOptions(skin, 'Game', 'compatibility').nodes.find(node => node.props['data-compatibility'])
    assert.match(highlighted.children[0].children[0][0].props.style.backgroundImage, skin === 'ingame' ? /pause-font/ : /frontend\/fehi33we/)
    assert.equal(highlighted.children[0].props.style.opacity, 1)
    const help = renderOptions(skin, 'Game', null, true)
    assert.equal(help.nodes.some(node => node.props['data-compatibility']), false)
    const back = help.nodes.find(node => node.props['data-return-options'])
    back.props.onClick()
    assert.deepEqual(help.changes.at(-1), {index: 1, value: false})
    assert.equal(help.focus.at(-1), '[data-compatibility]')
  }
})

test('browser-only sixth Game row and hit target fit native frame uniformly at desktop/wide/high-DPI sizes', () => {
  const text = 'Browser compatibility and help'
  for (const bank of [frontend.banks.feft33we, frontend.banks.fehi33we, ingame]) {
    const glyphs = [...text].map(letter => bank.rects[letter.charCodeAt(0) - 32])
    const width = glyphs.reduce((sum, glyph) => sum + glyph.w, 0)
    assert.equal(width, 448)
    assert.ok(width <= 540)
    assert.ok(289 + Math.max(...glyphs.map(glyph => glyph.h)) < 338, 'row clears storage notice and category navigation')
    for (const [vw,vh,dpr] of [[640,480,1],[1280,800,1],[3440,1440,1],[3840,2160,2],[800,600,2]]) {
      const scale = Math.min(vw / 640, vh / 480), left = (vw - 640 * scale) / 2
      assert.ok((left + (320 - 270) * scale) * dpr >= 0)
      assert.ok((left + (320 + 270) * scale) * dpr <= vw * dpr)
      assert.ok((289 + 26) * scale * dpr < 420 * scale * dpr)
    }
  }
  for (const category of ['Sound','Graphics','Direct3D']) {
    assert.equal(optionRows({rotation:'cursor',flipRotation:false}, category).some(row => row.text === text), false)
  }
})

const storageNotices = {
  gameStorageNotice: 'Game settings apply for this session; browser storage is unavailable.',
  storageNotice: 'Volume changes apply for this session; browser storage is unavailable.',
}
const descendants = node => !node || typeof node !== 'object' ? [] :
  [node, ...[node.children].flat(Infinity).flatMap(descendants)]

test('Game and Sound storage failures retain the complete session-only disclosure in native glyph rows for both skins', () => {
  const css = readFileSync(new URL('../app/original-options.module.css', import.meta.url), 'utf8')
  const storageStyle = css.match(/\.storage\s*\{([^}]+)\}/)[1]
  assert.match(storageStyle, /left: 0; top: 338px; width: 640px;/)
  assert.doesNotMatch(storageStyle, /font:|sans-serif|text-shadow:|background:/)
  assert.match(css, /\.noticeLine[^}]*height: 30px/)
  const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  for (const notice of Object.values(storageNotices)) assert.ok(home.includes(`'${notice}'`), 'cover the actual Home storage failure copy')
  for (const skin of ['frontend', 'ingame']) for (const category of ['Game', 'Sound']) {
    const expectedNotice = category === 'Game' ? storageNotices.gameStorageNotice : storageNotices.storageNotice
    const {nodes} = renderOptions(skin, category, null, false, storageNotices)
    const statuses = nodes.filter(node => node.props.role === 'status')
    assert.equal(statuses.length, 1, 'only the active category announces its storage failure')
    const status = statuses[0]
    assert.equal(status.props.className, 'storage')
    assert.equal(status.props['aria-label'], expectedNotice)
    assert.equal(status.props.tabIndex, undefined, 'a passive status does not intercept keyboard navigation')
    const announcement = descendants(status).find(node => node.props.className === 'game-a11y-status')
    assert.deepEqual(announcement.children, [expectedNotice])
    const rows = optionRows({rotation:'cursor',flipRotation:false}, category, false, storageNotices, skin).filter(row => row.y >= 338 && row.y < 420)
    const visibleNotice = skin === 'ingame'
      ? `Session-only ${category === 'Game' ? 'game settings' : 'volume changes'}; browser storage unavailable.` : expectedNotice
    assert.equal(rows.map(row => row.text).join(' '), visibleNotice, 'Visible copy retains both session-only effect and unavailable browser storage')
    assert.equal(rows.length, 2)
    const lines = descendants(status).filter(node => node.props.className === 'noticeLine')
    assert.equal(lines.length, rows.length)
    const bank = skin === 'frontend' ? frontend.banks.feft33we : ingame
    for (const [index, line] of lines.entries()) {
      assert.equal(line.props['aria-hidden'], 'true', 'decorative glyphs do not duplicate the live announcement')
      const text = line.children[0], glyphs = text.children.flat(Infinity)
      const expectedGlyphs = [...rows[index].text].map(letter => bank.rects[letter.charCodeAt(0) - 32])
      assert.equal(text.props.className, 'text')
      assert.equal(text.props.style.opacity, skin === 'ingame' ? 2 / 3 : 1)
      assert.equal(glyphs.length, expectedGlyphs.length)
      for (const [letter, glyph] of glyphs.entries()) {
        assert.equal(glyph.props.style.width, expectedGlyphs[letter].w)
        assert.equal(glyph.props.style.height, expectedGlyphs[letter].h)
        assert.match(glyph.props.style.backgroundImage, skin === 'frontend' ? /frontend\/feft33we/ : /pause-font/)
      }
      const width = expectedGlyphs.reduce((sum, glyph) => sum + glyph.w, 0)
      assert.ok(width <= (skin === 'ingame' ? 432 : 600))
      assert.deepEqual([rows[index].x, rows[index].y], [320, 338 + index * 30])
      assert.ok(rows[index].y + Math.max(...expectedGlyphs.map(glyph => glyph.h)) < 420, 'actual glyphs clear category navigation and Back at y454')
      for (const [vw,vh,dpr] of [[640,480,1],[1280,800,1],[3440,1440,1],[3840,2160,2],[800,600,2]]) {
        const scale = Math.min(vw / 640, vh / 480), left = (vw - 640 * scale) / 2
        assert.ok((left + (320 - width / 2) * scale) * dpr >= 0)
        assert.ok((left + (320 + width / 2) * scale) * dpr <= vw * dpr)
        assert.ok((338 + lines.length * 30) * scale * dpr < 420 * scale * dpr)
      }
    }
  }
})

test('storage warnings preserve navigation and publish only current native shadow rows, including recovery and repeated category changes', () => {
  for (const skin of ['frontend', 'ingame']) for (let visit = 0; visit < 2; visit++) {
    for (const category of ['Game', 'Sound', 'Graphics', 'Direct3D']) for (const notices of [storageNotices, {}]) {
      let back = 0
      const publications = []
      const ui = renderOptions(skin, category, null, false, {...notices, onBack: () => back++, onTextRowsChange: rows => publications.push(rows)})
      const clean = renderOptions(skin, category)
      const controls = nodes => nodes.filter(node => node.type === 'button' || node.type === 'input' || node.props.tabIndex === 0).map(node => node.props['aria-label'])
      assert.deepEqual(controls(ui.nodes), controls(clean.nodes), 'warnings add no keyboard stops or replacement controls')
      ui.nodes.find(node => node.props['data-panel-back']).props.onClick()
      assert.equal(back, 1)
      assert.deepEqual(ui.focus, [`[aria-current="page"][data-option-key="${category}"]`])
      ui.effects.find(effect => effect.dependencies.length === 3 && typeof effect.dependencies[1] === 'function').run()
      assert.deepEqual(publications[0], optionRows({rotation:'cursor',flipRotation:false}, category, false, notices, skin))
      const visible = Object.keys(notices).length > 0 && ['Game', 'Sound'].includes(category)
      assert.equal(ui.nodes.some(node => node.props.className === 'storage'), visible)
      assert.equal(publications[0].some(row => row.y === 338), visible)
      const help = renderOptions(skin, category, null, true, notices)
      assert.equal(help.nodes.some(node => node.props.className === 'storage'), false, 'ordinary warning does not leak into the browser destination')
      assert.deepEqual(optionRows({rotation:'cursor',flipRotation:false}, category, true, notices), optionRows({rotation:'cursor',flipRotation:false}, category, true))
    }
  }
})

test('unavailable font assets keep storage notices readable without publishing misleading bitmap shadows', () => {
  for (const skin of ['frontend', 'ingame']) for (const category of ['Game', 'Sound']) {
    const publications = []
    const ui = renderOptions(skin, category, null, false, {
      ...storageNotices,
      preparedFrontend: {fonts: false, lowFont: false, sliders: true},
      preparedIngame: {fonts: false, sliders: true},
      onTextRowsChange: rows => publications.push(rows),
    })
    const status = ui.nodes.find(node => node.props.className === 'storage')
    const fallback = descendants(status).filter(node => node.props.className === 'fallback')
    assert.equal(fallback.map(node => node.children.join('')).join(' '), skin === 'ingame'
      ? `Session-only ${category === 'Game' ? 'game settings' : 'volume changes'}; browser storage unavailable.` : status.props['aria-label'])
    assert.equal(descendants(status).some(node => node.type === 'i'), false)
    ui.effects.find(effect => effect.dependencies.length === 3 && typeof effect.dependencies[1] === 'function').run()
    assert.deepEqual(publications, [[]])
  }
})


test('in-game browser-only copy clears the HUD gutter without altering native rows, font or accessible names', () => {
  for (const category of ['Game', 'Sound']) {
    const rows = optionRows({ rotation: 'cursor', flipRotation: false }, category, false, storageNotices, 'ingame')
    const browserRows = rows.filter(row => row.id === 'compatibility' || row.y === 338 || row.y === 368)
    assert.equal(browserRows.length, category === 'Game' ? 3 : 2)
    for (const row of browserRows) {
      const glyphs = [...row.text].map(letter => ingame.rects[letter.charCodeAt(0) - 32])
      const width = glyphs.reduce((sum, glyph) => sum + glyph.w, 0)
      assert.equal(row.x, 320)
      assert.ok(320 - (width >> 1) >= 104, 'Native occupied glyphs reserve the HUD-safe gutter')
      assert.ok(row.y + Math.max(...glyphs.map(glyph => glyph.h)) < 420)
    }
    for (const fallback of [false, true]) {
      const ui = renderOptions('ingame', category, null, false, { ...storageNotices,
        preparedIngame: { fonts: !fallback, sliders: true } })
      const status = ui.nodes.find(node => node.props['data-options-browser-copy'] === 'storage')
      assert.equal(status.props['aria-label'], category === 'Game' ? storageNotices.gameStorageNotice : storageNotices.storageNotice)
      const texts = descendants(status).filter(node => node.props['data-options-text'])
      assert.equal(texts.length, 2)
      assert.ok(texts.every(node => node.props['data-options-font'] === (fallback ? 'fallback' : 'glyphs')))
      if (category === 'Game') {
        const help = ui.nodes.find(node => node.props['data-compatibility'])
        assert.equal(help.props['aria-label'], 'Browser compatibility and help')
        assert.equal(help.props['data-options-browser-copy'], 'help')
        assert.equal(help.children[0].props['data-options-text'], 'Browser controls and help')
        assert.deepEqual(help.props.style, { left: 320, top: 289 })
      }
    }
    const native = rows.filter(row => row.y < 289 && row.id !== 'compatibility')
    assert.deepEqual(native, optionRows({ rotation: 'cursor', flipRotation: false }, category).filter(row => row.y < 289))
  }
})
