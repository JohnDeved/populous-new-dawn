# Mission 18 native findings

Scope: Mission 18's authored rewards, first Red patrol, and landscape-bank-16
sky in the SHA-256 `3a5065c7…dfbe4f` desktop executable. Registered Ghidra
exports are evidence, not recovered source.

## Authored gameplay

`levl2018.hdr` selects scripts 19/20/32 and landscape bank 16. Worship triggers
473, 476, and 479 link one-based reward records 476, 479, and 482. Their
zero-based objects 475/478/481 carry model-18 Armageddon and two model-16
Volcano rewards. All three require six worshippers; Armageddon has target 350
and each Volcano target 200.

Red script `cpscr019.dat` defines marker entry 1 as marker 1 → 2 with quotas
`[0,7,3,1]`, then its turn-zero branch calls `1092(1,-1,-1,-1)`. The existing
native-backed marker task therefore selects seven Warriors, three Firewarriors,
and one Preacher and gives them persistent guard routes between those markers.
The live port reaches the same path from ordinary Mission 18 creation and normal
AI turns; no test-created enemy people or economy state are required.

The first recurring Red block at words 624–644 is not claimed. Although its
`1092(1,2,-1,-1)` patrol is reachable at turn 1472, the same branch also calls
unported command 1074. The adjacent Green Erosion/boat and Land Bridge attacks
require specialist/vehicle populations absent from the authored browser start.

## Bank-g sky

`0042a140` maps bank 16 to suffix `g`. The requested `Dsky0-gb.png` is absent
from the supplied game, so `004b5f40` returns failure and `004b60d0` selects the
type-1 fallback from `sky0-g.dat` and `pal0-g.dat`; packaged g1/g2 images are not
used on this path. `004306d0` averages every 4×4 RGB block, producing the native
128×128 texture. Its RGBA SHA-256 is
`afe74d4c1fe39cc37b2285bfb6313117b9fca50fdbc5fc7fa158d62009b6d463`;
the imported PNG is `99a8a652…7604caa`.

The ordinary projected view draws one opaque size-256 lens layer and no backdrop
or second cloud layer. A non-lens native view instead clears to palette index
`0x78` (`#ad94a5`). The browser binds only the existing projected-sky boundary;
non-lens view configuration, device rasterization, and exact native camera/audio
presentation remain open.

Run:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission18.py EXE
```

The non-recording check verifies executable/data hashes, header selection,
reward links and payloads, exact Red marker setup/startup words, bank-g fallback
inventory, the 4×4 average, and the tracked PNG. Registered supporting exports:
`0042a140`, `004306d0`, and `004b5f40`.

Mission 18 reuses the generic model-18 arena/result owners documented in
`mission17-armageddon.md`; no inspected owner contains a Mission 18 override.
