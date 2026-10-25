import test from 'node:test'
import assert from 'node:assert/strict'
import { transportCounts, selectTransportPassengers, focusTransport } from '../app/hud-transports.ts'
const person = (id, extra={}) => ({id, model:2,x:256+id*20,y:256,assignment:0,commandStatus:0,flags3:0x123456f8,flags4:0x20000000,selectionFlags:0,...extra})
const boat = (id,passengers,extra={})=>({id,model:1,x:256,y:256,owner:0,countOwner:0,passengerCount:passengers.length,passengers,active:true,...extra})
const point={x:0,y:0}
test('transport presence uses real ownership and survives an empty count',()=>{
 const people=[person(1),person(2),person(3,{model:3})]
 const vehicles=[boat(10,[1,2,3]),boat(11,[]),boat(12,[1],{countOwner:1}),boat(13,[1],{model:3,owner:1}),boat(14,[],{model:4,active:false})]
 const counts=transportCounts(vehicles,people,point)
 assert.deepEqual(counts[1],{present:true,counts:[1,0,1,1,0,0,0,0,0]})
 assert.deepEqual(counts[3],{present:true,counts:[1,0,1,0,0,0,0,0,0]})
 assert.equal(transportCounts([boat(1,[])],[],point)[1].present,true)
 assert.equal(transportCounts([boat(1,[])],[],point)[1].counts[0],0)
})
test('class filter acquires a vehicle and selects all eligible passengers; Ctrl counts vehicles',()=>{
 const people=Array.from({length:14},(_,i)=>person(i+1,{model:i%2?3:2,flags4:0x20000000|(i===1?128:0)}))
 const vehicles=Array.from({length:7},(_,i)=>boat(100+i,[i*2+1,i*2+2]))
 selectTransportPassengers(vehicles,people,1,2,point,'five')
 assert.equal(people.filter(p=>p.selectionFlags&128).length,9)
 assert.equal(people[1].selectionFlags,0)
 assert.equal(people[0].flags3,0x23456f8)
})
test('driver command priority, matching-passenger distance and vehicle nearby boundary remain distinct',()=>{
 const people=[person(1,{commandStatus:1,x:256}),person(2,{x:7000})]
 const vehicles=[boat(10,[1],{x:7000}),boat(11,[2])]
 selectTransportPassengers(vehicles,people,1,2,point,'single',true)
 assert.deepEqual(people.filter(p=>p.selectionFlags&128).map(p=>p.id),[2])
})
test('native reverse vehicle-list focus cycles, variants reacquire, and selected/blocked occupants can focus',()=>{
 const people=[person(1),person(2,{selectionFlags:128,flags4:128}),person(3)]
 const vehicles=[boat(4,[1]),boat(5,[2],{model:2}),boat(6,[3])]
 const before=structuredClone({people,vehicles})
 let previous=0
 assert.deepEqual(Array.from({length:4},()=>previous=focusTransport(vehicles,people,1,2,point,previous)),[4,6,5,4])
 const variants=vehicles.map(v=>({...v,model:2}))
 previous=0
 assert.deepEqual(Array.from({length:4},()=>previous=focusTransport(variants,people,1,2,point,previous)),[4,4,4,4])
 assert.deepEqual({people,vehicles},before)
})
