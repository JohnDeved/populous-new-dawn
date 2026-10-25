# Tornado throw owns the airborne flag word

## Original producer and consumer

Retained `004d8e40`, state24's terminal throw, sets `*(uint *)(person+0x10) |=
0x400`. That word is `flags4`; `flags2` is at+0x0c and `flags3` at+0x14.
The shared physics driver `004e6d00` tests byte+0x11 bit4, the same flags4 bit,
before issuing the first-airborne cue (`0xc4` for a non-Shaman with vertical
velocity at least91). It sets the same word while falling and clears the bit
on landing. The port's person physics follows this flags4 ownership.

`stepTornadoPerson` instead wrote flags3. A controlled ordinary cast/capture
witness reached capture at turn10 and the natural throw at turn28 without forcing
controller movement, substate or expiry. The next physics visit emitted an extra
0xc4 cue. An identical supplied snapshot with the source-correct word emitted none.
The fix changes only the terminal bitwise assignment's destination to flags4.

## Other affected consumer

The existing person renderer reads flags3 bit0x400 to select signed morph*16 depth
bias instead of its ordinary -300. The wrong write therefore also polluted a
separate rendering mode and persisted beyond landing. No renderer or morph behavior
is changed. Vault appearance intentionally uses this flags3 bit on its own objects;
that path is unrelated and unchanged. Unrelated bits in both words, including an
already-set flags3 bit0x400, must be preserved.

## Regression evidence

The old Tornado helper assertion explicitly expected flags3=0x400. It was retained
as a failing diagnostic after the one-line correction, then changed to require
flags3=0 and flags4=0x400. Velocity, RNG, state, attribution and lifetime expectations
are unchanged. New tests cover both flag words, ordinary cast/capture/throw and
no extra cue, legitimate unmarked-fall sound, checkpoint equality and normal landing.

The first landing fixture stopped when `u.flight` cleared. Diagnostics showed that
the still-active Tornado had recaptured the person (state24), not landed them. The
fixture now follows the unmodified controller through possible recapture and its
normal200+24 lifetime, up to400 visits, until carry and airborne ownership actually
end. It asserts the retained thrown person's flag clears and exact checkpoint
continuation, without suppressing capture or mutating controller lifetime.

No native executable execution or normal-input rendered validation was performed.
The ordinary CPU witness supplies population and placement at the cast controller;
it does not establish full Tornado or rendering parity. No generated assets or
parity coverage are changed.
