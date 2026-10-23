import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {ROUTE_FAILURE_TEXT} from '../app/world-rules.ts'

const source=ts.createSourceFile('page.tsx',readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
let announcement
function visit(node){
 if(ts.isJsxElement(node)&&node.openingElement.attributes.properties.some(a=>ts.isJsxAttribute(a)&&a.name.getText(source)==='data-route-announcement'))announcement=node
 ts.forEachChild(node,visit)
}
visit(source);assert.ok(announcement,'Actual Home must retain a route live region')
const js=ts.transpileModule(`function render(ready,world){return ${announcement.getText(source)}}`,{compilerOptions:{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText
const render=new Function('React','ROUTE_FAILURE_TEXT',`${js};return render`)(React,ROUTE_FAILURE_TEXT)
test('actual Home keeps a hidden persistent route status region and renews request-keyed content',()=>{
 const empty=render(false,{routeNotice:null}), first=render(true,{routeNotice:{serial:1}}),again=render(true,{routeNotice:{serial:2}})
 assert.equal(empty.type,'p');assert.equal(empty.props.role,'status');assert.equal(empty.props['aria-atomic'],'true')
 assert.equal(empty.props.className,'game-a11y-status')
 assert.doesNotMatch(renderToStaticMarkup(empty),/One or more/)
 assert.ok(renderToStaticMarkup(first).includes('One or more of your people'))
 assert.equal(first.props.children.props.children,ROUTE_FAILURE_TEXT)
 assert.equal(first.props.children.key,'1');assert.equal(again.props.children.key,'2')
 assert.doesNotMatch(renderToStaticMarkup(render(true,{routeNotice:null})),/One or more/)
 const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8'),rule=css.match(/\.game-a11y-status\{([^}]+)\}/)?.[1]
 assert.ok(rule);for(const part of ['width:1px','height:1px','overflow:hidden','clip-path:inset(50%)','pointer-events:none'])assert.ok(rule.includes(part))
})
