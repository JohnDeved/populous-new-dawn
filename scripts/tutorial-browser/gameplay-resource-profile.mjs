import assert from 'node:assert/strict'

// One finite opt-in, never a caller-supplied count or environment override.
export const gameplayThreeCycleProfile = 'three-cycle-v1'
export const gameplayThreeCycleArgument = `--gameplay-resource-profile=${gameplayThreeCycleProfile}`
export const gameplayOwnershipArgument = '--gameplay-ownership-probe=weak-v1'
export function parseGameplayResourceArguments(args, scenario) {
  assert.ok(Array.isArray(args) && args.every(value => typeof value === 'string'))
  const positional = args[0] !== undefined && !args[0].startsWith('--')
  const output = positional ? args[0] : undefined
  const options = positional ? args.slice(1) : args
  const ownershipProbe = options.includes(gameplayOwnershipArgument)
  const profileOptions = options.filter(option => option !== gameplayOwnershipArgument)
  assert.ok(options.filter(option => option === gameplayOwnershipArgument).length <= 1,
    'Ownership diagnostic must not be repeated')
  assert.ok(profileOptions.length === 0 || (profileOptions.length === 1 && profileOptions[0] === gameplayThreeCycleArgument),
    'Only --gameplay-resource-profile=three-cycle-v1 is supported')
  const profile = profileOptions.length ? gameplayThreeCycleProfile : undefined
  assert.ok(!ownershipProbe || profile === gameplayThreeCycleProfile, 'Ownership diagnostic requires three-cycle-v1')
  assert.ok(profile === undefined || scenario === 'gameplay-resources', 'Resource profile requires gameplay-resources')
  return { output, profile, ...(ownershipProbe ? { ownershipProbe: 'weak-v1' } : {}) }
}

// The event snapshot, not mutable current PR labels, selects one exact head.
// Never return label text as a command: dispatch always uses the fixed CLI flag.
export function gameplayOwnershipSelection(event, eventName, headSha, scenario) {
  if (eventName !== 'pull_request' || event?.action !== 'ready_for_review' ||
      scenario !== 'gameplay-resources' || !/^[a-f0-9]{40}$/.test(headSha ?? '') ||
      event.pull_request?.draft !== false || event.pull_request?.head?.sha !== headSha)
    return undefined
  const label = `weak-v1:${headSha}`
  if (!Array.isArray(event.pull_request.labels) || !event.pull_request.labels.some(item => item?.name === label)) return undefined
  return { version: 1, mode: 'weak-v1', event: eventName, action: event.action, headSha, label, scenario }
}
