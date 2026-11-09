from pathlib import Path
p=Path('app/firewarrior.ts');s=p.read_text();start=s.index('// 0x51fbf0 / 0x4bbcf0:');end=s.index('export function stepTowerFirewarrior',start);block=s[start:end]
block=block.replace('// point. Keep the ordinary actor-target adapter above unchanged.','// point. Ordinary actor-target shots remain in firewarrior.ts.')
block=block.replace('person: LivePerson,','person: PointShotPerson,').replace('destination: NativePoint\n)', 'destination: NativePoint,\n  hooks: PointShotHooks\n)')
block=block.replace("effect(w, 'firewarriorShot'", "hooks.effect(w, 'firewarriorShot'").replace("effect(w, 'trail'", "hooks.effect(w, 'trail'").replace('sound(w,','hooks.sound(w,')
block=block.replace('function stepFirewarriorPoint(w: World, fx: Effect)', 'export function stepFirewarriorPoint(\n  w: World, fx: Effect, position: NativePoint, hooks: PointShotHooks\n)')
block=block.replace('    position = nativePosition(w, fx),\n','')
header='''import type { Effect, NativePoint, Point, Unit, World } from './world-types.ts'
import { nativeAngle, short } from './native-math.ts'
import { browserPosition, nativeDistance, nativeStep3D } from './world-coordinates.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { TURNS_PER_SECOND } from './world-rules.ts'
import { createSpellTrail } from './spell-trails.ts'
import constants from './original-constants.json' with { type: 'json' }

type PointShotPerson = NativePoint & {
  heading: number
  supportHeight: number
  tribe: number
  flags3: number
  disguise: number
}
type PointShotHooks = {
  effect: (world: World, kind: Effect['kind'], point: Point) => Effect
  sound: (world: World, cue: number, point: Point) => void
}
function locate(fx: Effect, p: NativePoint) {
  Object.assign(fx, browserPosition(p))
  fx.height = p.h / 45
}

'''
Path('app/firewarrior-point.ts').write_text(header+block)
s=s[:start]+s[end:];s=s.replace('Building, Effect, NativePoint, Unit, World','Building, Effect, Unit, World').replace("import { createSpellTrail } from './spell-trails.ts'\nimport type { LivePerson } from './live-people.ts'", "import { stepFirewarriorPoint } from './firewarrior-point.ts'")
s=s.replace('stepFirewarriorPoint(w, fx)','stepFirewarriorPoint(w, fx, nativePosition(w, fx), { effect, sound })');p.write_text(s)
p=Path('app/live-people.ts');s=p.read_text().replace("from './firewarrior.ts'", "from './firewarrior-point.ts'",1).replace('launchFirewarriorPoint(w, source, person as LivePerson, to)','launchFirewarriorPoint(w, source, person as LivePerson, to, { effect, sound })');p.write_text(s)
p=Path('tests/firewarrior-celebration.test.mjs');s=p.read_text().replace("import { launchFirewarriorPoint, stepFirewarriorShots } from '../app/firewarrior.ts'", "import { stepFirewarriorShots } from '../app/firewarrior.ts'\nimport { launchFirewarriorPoint } from '../app/firewarrior-point.ts'\nimport { effect, sound } from '../app/world-effects.ts'")
# All fixture launch calls use four simple positional arguments.
s=s.replace('launchFirewarriorPoint(w, u, p, target)', 'launchFirewarriorPoint(w, u, p, target, { effect, sound })')
p.write_text(s)
