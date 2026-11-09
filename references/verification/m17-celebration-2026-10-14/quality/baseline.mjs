import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {deserialize} from 'node:v8'
import {migrateCheckpoint} from '../../app/game-store.ts'
import {frame} from '../../../populous-m17-pose-audit/work/m17-restart-route/clock-driver.mjs'
const w=migrateCheckpoint(deserialize(readFileSync('../populous-m17-pose-audit/work/m17-restart-route/won-terminal.v8')))
assert.equal(w.turn,6784)
try { for(let i=0;i<30;i++) frame(w); assert.fail('Expected baseline throw') }
catch(e) { console.log(JSON.stringify({turn:w.turn,status:w.status,message:e.message})); assert.equal(w.turn,6792); assert.match(e.message,/Live firewarriors are not yet implemented/) }
