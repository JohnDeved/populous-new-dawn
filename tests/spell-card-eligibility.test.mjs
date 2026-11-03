import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const tree=f=>ts.createSourceFile(f,fs.readFileSync(new URL('../app/'+f,import.meta.url),'utf8'),ts.ScriptTarget.Latest,true,f.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS)
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
const page=tree('page.tsx');let attrs
function visit(n){if(ts.isJsxOpeningElement(n)&&n.attributes.properties.some(a=>ts.isJsxAttribute(a)&&a.name.getText(page)==='className'&&a.initializer?.text==='spell-card')){assert.equal(attrs,undefined);attrs=n.attributes.properties}ts.forEachChild(n,visit)}visit(page);assert.ok(attrs)
const handlers=Object.fromEntries(['onClick','onContextMenu'].map(name=>[name,attrs.find(a=>a.name?.getText(page)===name).initializer.expression.getText(page)]))
const source=tree('spell-visibility.ts'),names=['spellHudVisibility','spellHudPermanent','spellHudCanCharge'];const nodes=source.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text));assert.equal(nodes.length,3)
const helpers=new Function('rules','undiscoveredSpellModels',compile(nodes.map(n=>n.getText(source).replace(/^export /,'')).join('\n'))+';return {spellHudVisibility,spellHudPermanent,spellHudCanCharge}')(JSON.parse(fs.readFileSync(new URL('../app/original-rules.json',import.meta.url),'utf8')),()=>new Set())
const storeSource=tree('game-store.ts'),factory=storeSource.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='createGameStore'),obj=factory.body.statements.find(ts.isReturnStatement).expression,change=obj.properties.find(n=>n.name?.getText(storeSource)==='change').initializer
function fixture(kind,effect='live') {
 const calls=[],s={id:'blast',model:1},w={manaWorld:{playerTribe:0,gameFlags:0,spells:[{available:2,disabled:0}]},manaTribes:[{}],shots:{blast:1},mode:null,charging:true};const token={}
 const store=new Function('world','update','inputClock','presentationToken',compile('const change='+change.getText(storeSource))+';return {change}')(w,()=>calls.push('update'),{token,advance(){calls.push('drain');if(effect==='blocked')w.manaWorld.gameFlags|=32;if(effect==='switchPlayer'){w.manaWorld.spells.push({available:2,disabled:0});w.manaTribes.push({});w.manaWorld.playerTribe=1}if(effect==='stockOnly')w.manaWorld.spells[0].available=0;if(effect==='unowned'){w.manaWorld.spells[0].available=0;w.shots.blast=0}}},token)
 const bindings={store,s,player:0,interactive:true,undiscovered:false,canCharge:true,...helpers}
 const run=new Function(...Object.keys(bindings),compile('const handler='+handlers[kind==='select'?'onClick':'onContextMenu'])+';return handler')(...Object.values(bindings))
 return {w,calls,run:()=>run({preventDefault(){calls.push('prevent')}})}
}
for(const kind of ['select','charge']){
 for(const effect of ['blocked','unowned'])test(`${kind}: ${effect} after input drain refuses stale rendered eligibility`,()=>{const f=fixture(kind,effect);f.run();assert.equal(f.w.mode,null);assert.equal(f.w.manaWorld.spells[0].disabled,0);assert.equal(f.w.charging,true);assert.deepEqual(f.calls,kind==='select'?['drain','update']:['prevent','drain','update'])})
 test(`${kind}: live callback retains effect and one update`,()=>{const f=fixture(kind);f.run();if(kind==='select')assert.equal(f.w.mode,'blast');else{assert.equal(f.w.manaWorld.spells[0].disabled,1);assert.equal(f.w.charging,false)}assert.equal(f.calls.filter(x=>x==='update').length,1)})
}

test('stock-only spell remains selectable but cannot toggle permanent charging',()=>{for(const kind of ['select','charge']){const f=fixture(kind,'stockOnly');f.run();assert.equal(f.w.mode,kind==='select'?'blast':null);assert.equal(f.w.manaWorld.spells[0].disabled,0)}})

test('charging reads the current player after drain rather than captured render owner',()=>{const f=fixture('charge','switchPlayer');f.run();assert.equal(f.w.manaWorld.spells[0].disabled,0);assert.equal(f.w.manaWorld.spells[1].disabled,1);assert.equal(f.w.charging,false);assert.deepEqual(f.calls,['prevent','drain','update'])})
