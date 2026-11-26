import { command, commandWithOrdinaryMoveSelection } from './live-command.ts'
import { consumeOrdinaryMoveOwner } from './stay-selected-move-owner.ts'

type ReleaseOwner = Parameters<typeof consumeOrdinaryMoveOwner>[0]
type ReleaseContext = Parameters<typeof consumeOrdinaryMoveOwner>[1] & {
  world: Parameters<typeof command>[0]
}
type ReleaseInput = Parameters<typeof consumeOrdinaryMoveOwner>[2]
type Point = Parameters<typeof command>[1]

export function dispatchOrdinarySceneRelease(
  owner: ReleaseOwner,
  current: () => ReleaseContext,
  event: ReleaseInput,
  point: Point,
  cleanGround: boolean,
  readKeep: (() => boolean | undefined) | undefined,
  readWorld: () => ReleaseContext['world']
) {
  if (owner && readKeep) {
    const context = current()
    if (consumeOrdinaryMoveOwner(owner, context, event, cleanGround)) {
      const keep = readKeep()
      if (typeof keep !== 'boolean') return command(readWorld(), point, event)
      return commandWithOrdinaryMoveSelection(
        context.world, { kind: 'owned-unmodified-release', point }, keep
      ).accepted
    }
  }
  return command(readWorld(), point, event)
}
