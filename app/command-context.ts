import rules from './original-rules.json' with { type: 'json' }

export const CommandContext = {
  Ground: 1,
  Plan: 2,
  Enemy: 4,
  Tree: 8,
  Building: 16,
  Completed: 32,
  Unfinished: 64,
  Friendly: 128,
  NearbyEnemy: 256,
  Obelisk: 512,
  Vehicle: 1024,
  Head: 2048,
  Flatten: 4096,
  SpyEscape: 8192,
  Guard: 16384,
  Dismantling: 32768,
  Challenged: 65536,
  Convert: 131072,
  OwnShaman: 262144,
  Vault: 524288,
  Force: 1048576,
  Prison: 2097152,
  Sabotage: 4194304,
  FlattenValid: 8388608,
  ForcedEnemy: 16777216,
} as const

// 0x437750, automatic choice for a selection containing outdoor people.
// Descriptor masks let a mixed group choose an action that some members can do.
// The retained manual wheel choice and all-inside branch have separate ownership.
export function chooseContextCommand(flags: number, people: number) {
  const c = CommandContext
  const has = (mask: number) => !!(flags & mask)
  const accept = (model: number, condition: boolean) =>
    condition && rules.personCommands[model].people & people ? model : 0
  const friendly = has(c.Friendly),
    challenged = has(c.Challenged)
  let plan = 19,
    building = 19
  if (friendly && !challenged) {
    plan = has(c.Dismantling) ? 10 : 6
    building = has(c.Dismantling) ? 10 : 8
  } else if (!friendly && people === 32) building = 15
  return (
    accept(24, has(c.Guard) && !has(c.Completed | c.Obelisk | c.Vehicle)) ||
    accept(30, has(c.OwnShaman) && has(c.Force)) ||
    accept(people === 16 && !has(c.ForcedEnemy) ? 3 : 28, has(c.Enemy)) ||
    accept(people === 32 ? 13 : 7, has(c.Tree)) ||
    accept(22, has(c.Vehicle)) ||
    accept(16, has(c.SpyEscape)) ||
    accept(34, has(c.Sabotage) && has(c.Force)) ||
    accept(plan, has(c.Plan)) ||
    accept(building, has(c.Completed)) ||
    accept(11, has(c.Flatten)) ||
    accept(20, has(c.Obelisk) && people === 128) ||
    accept(29, has(c.Convert)) ||
    accept(27, has(c.Head)) ||
    accept(33, has(c.Vault)) ||
    accept(19, has(c.Prison)) ||
    accept(people === 16 && !has(c.ForcedEnemy) ? 3 : 19, has(c.NearbyEnemy)) ||
    3
  )
}
