// Debug-only registry populated at reviewed creation/wrapping sites, never by
// function name, source-string similarity or guessed material type.
export function createHookProvenance({families,maxHooks=1024}={}){
 if(!Array.isArray(families)||families.some(f=>typeof f!=='string'||!f)||!Number.isSafeInteger(maxHooks)||maxHooks<0)throw new Error('Explicit provenance admission required');
 const allowed=new Set(families),hooks=new WeakMap();let count=0;
 function register(fn,family,{delegates=[]}={}){
  if(typeof fn!=='function'||!allowed.has(family)||!Array.isArray(delegates)||delegates.length>4)throw new Error('Unreviewed hook family');
  if(hooks.has(fn))throw new Error('Hook already registered');
  if(count>=maxHooks)throw new Error('Hook registry budget exceeded');
  for(const original of delegates)if(typeof original!=='function'||!hooks.has(original))throw new Error('Unknown delegated hook');
  hooks.set(fn,{family,delegates:delegates.slice(),id:++count});return fn;
 }
 function describe(fn){
  const entry=hooks.get(fn);if(!entry)throw new Error('Unknown runtime hook identity');
  return{id:entry.id,family:entry.family,delegates:entry.delegates.map(d=>({id:hooks.get(d).id,family:hooks.get(d).family}))};
 }
 return{register,describe,stats:()=>({registeredHooks:count}),scope:'Trusted creation-site identity evidence only; registry does not execute or certify hooks'};
}
