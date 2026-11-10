// Isolated diagnostic instrumentation, never production deployment.
import * as THREE from 'three'
import { createHookProvenance } from './cpu-hook-provenance.mjs'
const registry = createHookProvenance({families: ['default-draw-before','default-draw-after','default-compile','scene-prepare','scene-cleanup','native-draw','selection-draw','model-compile','tornado-compile','globe-compile','bound-compile','native-compile'],maxHooks:4096})
const graph: unknown[] = []
export function cpuRegister<T extends Function>(fn: T, family: string, delegates: Function[] = []): T {
 registry.register(fn,family,{delegates})
 graph.push(registry.describe(fn))
 return fn
}
export const cpuDescribe = (fn: Function) => registry.describe(fn)
cpuRegister(THREE.Object3D.prototype.onBeforeRender,'default-draw-before')
cpuRegister(THREE.Object3D.prototype.onAfterRender,'default-draw-after')
cpuRegister(THREE.Material.prototype.onBeforeCompile,'default-compile')
Object.defineProperty(globalThis,'__cpuHookProbe',{value:Object.freeze({describe:cpuDescribe,graph:()=>structuredClone(graph)}),configurable:false,writable:false})
