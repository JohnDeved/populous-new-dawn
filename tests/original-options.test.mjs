import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import ts from 'typescript'
import artwork from '../app/original-options-art.json' with {type:'json'}
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
const readRows = new Function('useMemo', 'gamePreferences', 'category', 'browser', 'masterText', 'musicText', 'categories',
  ts.transpileModule(`${rowDeclarations}\nreturn rows;`, {
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
  assert.deepEqual(optionRows(preferences, 'Graphics'), [...base, { text: 'Direct3D', x: 320, y: 390 }])
  assert.equal(optionRows(preferences, 'Sound').some(row => /Rotation|Tooltips|Selected|Autocast/.test(row.text)), false)
})
