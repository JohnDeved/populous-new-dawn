import rules from './original-rules.json' with { type: 'json' }
import { random, short } from './native-math.ts'
import { terrainPointHeight } from './native-terrain.ts'
import {
  allocateSecondaryEffect,
  releaseSecondaryEffect,
  type SecondaryEffect,
  type SecondaryEffects,
} from './secondary-effects.ts'
import type { World } from './world-types.ts'

// Player Guard Posts (#1010): player-local class-10/model-16 secondary markers.
// Static evidence: decomp/research/guard-posts.md. A post is a marker only:
// follower orders store its cell, never the post, so removing a post never
// cancels or retargets guards. Posts exist only on the owner's machine.

export type GuardPost = Extract<SecondaryEffect, { kind: 'guardPost' }>
type GuardPostSmoke = Extract<SecondaryEffect, { kind: 'guardPostSmoke' }>
export type GuardPostWorld = Pick<
  World,
  'land' | 'secondaryEffects' | 'cosmeticRandom' | 'effectCounter'
>

// 005030c0 evicts at 64 posts; 00502eb0 removes a post whose pre-increment age
// exceeds 3000; 004ba9b0 chains at most eight posts into one route.
export const GUARD_POST_CAP = 64
export const GUARD_POST_MAX_AGE = 3000
export const GUARD_POST_CHAIN_LIMIT = 8
// 004edae0: class10/model16 needs count <= 156, class7/model3 smoke <= 140.
const POST_RESERVE = 4
const SMOKE_RESERVE = 20

/** Native packed cell (x>>8 & 0xfe) | (y & 0xfe00). */
export const guardPostCell = (point: { x: number; y: number }) =>
  ((point.x >>> 8) & 0xfe) | (point.y & 0xfe00)
/** 00500a30 case 0x10 snaps the post to the cell centre. */
export const guardPostCellCentre = (cell: number) => ({
  x: ((cell & 0xfe) << 8) + 0x100,
  y: (cell & 0xfe00) + 0x100,
})
/** Index into the browser's 128x128 land arrays. */
export const guardPostLandIndex = (cell: number) =>
  ((cell >>> 9) & 127) * 128 + ((cell & 0xfe) >>> 1)

export function guardPostSlots(state: SecondaryEffects) {
  // Newest first, the native allocated-list order used by every scan below.
  const slots: number[] = []
  for (const slot of state.order) if (state.slots[slot]?.kind === 'guardPost') slots.push(slot)
  return slots
}

export function guardPostCount(state: SecondaryEffects) {
  let count = 0
  for (const slot of state.order) if (state.slots[slot]?.kind === 'guardPost') count++
  return count
}

// 005030c0/00503230: smoke divisor from the post count (0 disables smoke).
export function guardPostDivisor(count: number) {
  if (count < 13) return 2
  if (count < 22) return 4
  if (count < 33) return 8
  return 0
}

export function guardPostsInCell(state: SecondaryEffects, cell: number) {
  const posts: { slot: number; post: GuardPost }[] = []
  cell &= 0xfefe
  for (const slot of state.order) {
    const post = state.slots[slot]
    if (post?.kind === 'guardPost' && post.cell === cell) posts.push({ slot, post })
  }
  return posts
}

// Class-10/model-16 view for shared cell-object consumers. Writing `timer`
// writes the post age (+0x70), as command-25 arrival does at 0043292e.
export function guardPostCellObjects(state: SecondaryEffects, cell: number) {
  return guardPostsInCell(state, cell).map(({ post }) => ({
    class: 10,
    model: 16,
    x: post.position.x,
    y: post.position.y,
    flags2: 0,
    tribe: -1,
    signal: 0,
    get timer() {
      return post.age
    },
    set timer(value: number) {
      post.age = value
    },
  }))
}

// Tribe command 0x62, player branch: 004edae0(10,16), alloc_unit_2 and the
// 00500a30 case-0x10 initializer (cell-centre snap, age 0), then 005030c0.
export function allocateGuardPost(w: GuardPostWorld, cell: number) {
  cell &= 0xfefe
  const centre = guardPostCellCentre(cell)
  const slot = allocateSecondaryEffect(
    w.secondaryEffects,
    {
      kind: 'guardPost',
      counter: w.effectCounter,
      cell,
      position: { ...centre, h: terrainPointHeight(w.land, centre) },
      age: 0,
    },
    POST_RESERVE
  )
  if (slot !== null) evictGuardPosts(w.secondaryEffects, slot)
  return slot
}

// 005030c0 at 64 posts: evict the oldest by age (first strict maximum in list
// order); when every age is 0, the post farthest from the new one.
function evictGuardPosts(state: SecondaryEffects, newest: number) {
  if (guardPostCount(state) < GUARD_POST_CAP) return
  const origin = (state.slots[newest] as GuardPost).position
  let victim = -1,
    best = 0
  for (const slot of guardPostSlots(state)) {
    const { age } = state.slots[slot] as GuardPost
    if (age > best) {
      best = age
      victim = slot
    }
  }
  if (victim < 0)
    for (const slot of guardPostSlots(state)) {
      const { position } = state.slots[slot] as GuardPost
      // ponytail: native calc_distance_toroidal approximation is not ported;
      // only the ranking matters and ties differ only at exact equal distances.
      const distance = Math.hypot(short(position.x - origin.x), short(position.y - origin.y))
      if (distance > best) {
        best = distance
        victim = slot
      }
    }
  if (victim >= 0) releaseSecondaryEffect(state, victim)
}

// 004ef180 -> 00503080 -> 004ee1e0: the record is freed immediately.
export function removeGuardPost(state: SecondaryEffects, slot: number) {
  if (state.slots[slot]?.kind !== 'guardPost') return false
  releaseSecondaryEffect(state, slot)
  return true
}

// 004ba640 placement-click branch: delete every post on the cell.
export function removeGuardPostsInCell(state: SecondaryEffects, cell: number) {
  const posts = guardPostsInCell(state, cell)
  for (const { slot } of posts) releaseSecondaryEffect(state, slot)
  return posts.length
}

// 00502eb0, state-15 visit. The secondary traversal increments `counter`
// (class counter +0x2e) before this call. All draws use the cosmetic RNG
// (0089bc72); the simulation RNG is never consumed.
export function stepGuardPost(w: GuardPostWorld, slot: number, post: GuardPost) {
  const state = w.secondaryEffects,
    { position } = post
  position.h = terrainPointHeight(w.land, position)
  const x = (random(w.cosmeticRandom) & 63) + position.x - 32,
    y = (random(w.cosmeticRandom) & 63) + position.y - 32,
    divisor = guardPostDivisor(guardPostCount(state))
  if (divisor && !(post.counter & (divisor - 1))) {
    const smoke = allocateSecondaryEffect(
      state,
      {
        kind: 'guardPostSmoke',
        counter: w.effectCounter,
        position: { x: x & 65535, y: y & 65535, h: position.h + 110 },
        lifetime: 20,
      },
      SMOKE_RESERVE
    )
    if (smoke !== null) {
      // 0050bf60 (class-7/model-3 initializer) draws once; 00502eb0 then
      // replaces its +0x5f lifetime with 4 + rand % 32.
      random(w.cosmeticRandom)
      ;(state.slots[smoke] as GuardPostSmoke).lifetime = (random(w.cosmeticRandom) & 31) + 4
    }
  }
  const { age } = post
  post.age = age + 1
  if (
    age > GUARD_POST_MAX_AGE ||
    rules.terrainCategoryFlags[w.land.categories[guardPostLandIndex(post.cell)] & 15] & 0x3e
  )
    releaseSecondaryEffect(state, slot)
}

// ponytail: the class-7/model-3 smoke body (state 3 processor 0050bd70 and its
// state change) is not ported; the record keeps the 00502eb0 lifetime as its
// visit budget so pool capacity and cosmetic RNG follow the producer.
export function stepGuardPostSmoke(state: SecondaryEffects, slot: number, smoke: GuardPostSmoke) {
  if (--smoke.lifetime <= 0) releaseSecondaryEffect(state, slot)
}
