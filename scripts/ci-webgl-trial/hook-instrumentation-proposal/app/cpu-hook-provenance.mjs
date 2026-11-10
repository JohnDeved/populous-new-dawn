// Creation-site provenance with weak ownership. No global strong graph of every
// historical callback: each inventory supplies its current runtime hook roots.
export function createHookProvenance({families,maxHooks=4096}={}){
 if(!Array.isArray(families)||families.some(f=>typeof f!=='string'||!f)||!Number.isSafeInteger(maxHooks)||maxHooks<0)throw new Error('Explicit provenance admission required');
 const allowed=new Set(families),hooks=new WeakMap(),counts=Object.fromEntries(families.map(f=>[f,0]));let serial=0;
 const entry=fn=>{const e=hooks.get(fn);if(!e)throw new Error('Unknown runtime hook identity');return e};
 function register(fn,family,{delegates=[]}={}){
  if(typeof fn!=='function'||!allowed.has(family)||!Array.isArray(delegates)||delegates.length>4)throw new Error('Unreviewed hook family');
  if(hooks.has(fn))throw new Error('Hook already registered');
  for(const original of delegates)entry(original);
  if(serial>=Number.MAX_SAFE_INTEGER)throw new Error('Hook identity space exhausted');
  hooks.set(fn,{family,delegates:delegates.slice(),id:++serial});counts[family]++;return fn;
 }
 function describe(fn){const e=entry(fn);return{id:e.id,family:e.family,delegates:e.delegates.map(d=>{const n=entry(d);return{id:n.id,family:n.family}})}}
 function graph(roots){
  if(!Array.isArray(roots)||roots.length>maxHooks)throw new Error('Hook root budget exceeded');
  const seen=new Set(),todo=[...roots],out=[];let edges=0;
  while(todo.length){const fn=todo.pop();if(seen.has(fn))continue;if(seen.size>=maxHooks)throw new Error('Reachable hook graph budget exceeded');const e=entry(fn);seen.add(fn);out.push(describe(fn));edges+=e.delegates.length;if(edges>maxHooks*4)throw new Error('Hook edge budget exceeded');for(const d of e.delegates)if(!seen.has(d))todo.push(d);if(todo.length>maxHooks*4)throw new Error('Hook traversal budget exceeded');}
  return out.sort((a,b)=>a.id-b.id);
 }
 return{register,describe,graph,stats:()=>({cumulativeRegistrations:serial,maxReachableHooks:maxHooks,cumulativeByFamily:{...counts}}),scope:'Weak creation-site registry; maxHooks bounds each reachable inventory graph, not cumulative registrations or measured heap'};
}
