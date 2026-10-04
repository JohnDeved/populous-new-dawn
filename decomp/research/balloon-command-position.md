# Balloon raw command-position startup

## Finding

A staged driver Spy, boarded through the shipped `command` path onto Mission 22's
actual Balloon, could not issue the ordinary disguise control: live startup threw
`Unported live movement order consumer` at `configurePersonOrder`'s
`commandPosition` callback. This is earlier than the separate non-driver command
scheduling gap. Boat disguise and state 30 were already supported.

Retained exports `decomp/generated/00432df0.c` and
`decomp/generated/004389c0.c` identify the complete configuration and position
leaf. No new Ghidra export is needed. Configuration first recomputes flag
`0x08000000` from the order descriptor (Shaman bit `0x100000`, other people
bit `0x4000`). If that flag is clear, the person has a vehicle, and flag
`0x02000000` is set, the real leaf writes the two destination words at
person offsets `+0x53/+0x55`.

The leaf's branch precedence is:

1. Descriptor bit `4`: center the packed cell in `order.b`.
2. Otherwise bit `0x800`: center the packed cell in `order.a`.
3. Otherwise bits `0x242`: resolve the object in `order.a`, using a building's
   outside point, class 5/model 9 head approach, or other object's position.
4. Otherwise: copy the raw `order.a/order.b` words.

Command 16's descriptor is `0x400`, so it takes the last branch. For a freshly
encoded disguise command targeting tribe 2, the resulting destination is `[2,0]`.
It is **not** the passenger's current position. Existing `personOrderFocus` has
an object-first focus policy and is not a replacement for this startup leaf.

## Bounded live adapter

Only `orderContext`'s startup consumer changes. It accepts the raw branch when
`flags & (4 | 0x800 | 0x242)` is zero, masks both payload words to unsigned 16,
and retains the explicit unsupported boundary for every cell/object branch.
`configurePersonOrder`, the update consumer, vehicle ownership, and scheduling
are unchanged. The broader cell/object command-position resolver remains a
separate prerequisite.

## Verification

`python scripts/check-native-balloon-command-position.py "$POPULOUS_EXE"`
executes the verified original binary with Unicorn 2.1.4:
SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
It checks all 35 descriptor identities, 126 raw-leaf payload cases across 21
models, and 1,152 complete `00432df0`→`004389c0` compositions for commands 15/16.
The matrix covers person models 2/5/6, vehicle presence, airborne/old-special flags,
cancelled orders, current/immediate records, and word boundaries. The native
leaf runs without interception; an observation-only hook counts its calls.
Configuration fields are compared with the production `startLiveOrders`
adapter, including its new consumer. Startup speed/RNG and vehicle scheduling
are explicitly outside that field comparison. No fixtures/assets are generated.

`node --test tests/transport-idle.test.mjs` includes a failure-first reproduction
through real boarding→ordinary disguise. After repair it covers completion,
63-turn rest, replacement disguise, signed raw command 15 payloads, the three
retained encoded-position boundaries, and pending-disguise checkpoint
continuation without replay. The hold assertion starts after the command's
completion visit; this evidence does not assert zero Balloon movement during
that visit. The fixture deliberately stages Spy population/location and does
not prove ordinary Spy acquisition, passenger scheduling, or an entire mission.

Rendered/browser and standard aggregate/build acceptance must be completed by
the parent-controlled lane; focused native/source results do not establish them.
No parity credit, complete native-game execution, or hardware performance claim
is made.
