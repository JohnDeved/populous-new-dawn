import assert from 'node:assert/strict'

// One finite opt-in, never a caller-supplied count or environment override.
export const gameplayThreeCycleProfile = 'three-cycle-v1'
export const gameplayThreeCycleArgument = `--gameplay-resource-profile=${gameplayThreeCycleProfile}`
export function parseGameplayResourceArguments(args, scenario) {
  assert.ok(Array.isArray(args) && args.every(value => typeof value === 'string'))
  const positional = args[0] !== undefined && !args[0].startsWith('--')
  const output = positional ? args[0] : undefined
  const options = positional ? args.slice(1) : args
  assert.ok(options.length === 0 || (options.length === 1 && options[0] === gameplayThreeCycleArgument),
    'Only --gameplay-resource-profile=three-cycle-v1 is supported')
  const profile = options.length ? gameplayThreeCycleProfile : undefined
  assert.ok(profile === undefined || scenario === 'gameplay-resources', 'Resource profile requires gameplay-resources')
  return { output, profile }
}
