import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/pointer-brackets.json' with {type:'json'}
import {pointerBrackets} from '../app/world-picking.ts'

test('sprite pointer brackets match native palette, two/four-layer geometry and unsigned animation wrap',()=>{
 for(const c of fixture.cases)if(c.active)assert.deepEqual(pointerBrackets(c.bounds,c.frame,c.acknowledged),c.expected)
 assert.deepEqual(fixture.expiry,[[4,42],[3,42],[2,42],[1,42],[0,0],[0,0],[0,0]])
})
