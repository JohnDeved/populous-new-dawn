# Level one: evidence and implementation

Researched 2026-09-07. The latest user request selects the original first mission and a camera that travels around a miniature planet. The original game artwork now supersedes the generated cover; its invented mountain is not part of this level.

## Primary evidence from the supplied game

Read `PopulousTB-Setup.zip` as an archive, then extracted the Inno Setup payload without executing the Windows installer. Binary Refinery's `InnoArchive` parser ran in an isolated temporary Python environment. The original game, manual, installer and audio banks are not runtime dependencies.

- `levels/levl2001.dat`: SHA-256 `97cdb6e170f68b462b5b36c42c99a598b0466e0131a105f30612f50d7f16e40c`.
- 128 × 128 height grid, 390 nonzero land vertices, 44 nonempty object records. Terrain heights are little endian; object coordinates are big endian. This distinction matters.
- Blue: six braves, one shaman, two small huts. Dakini: two warriors, two braves (including the central guard), one shaman, one large hut, one warrior training hut. These are the file's initial objects; births change the counts after play begins.
- Land Bridge head: one worshipper, seven seconds, repeatable. Lightning head: one worshipper, eight seconds per gift, four uses. Vault: shaman-only, eight seconds, unlocks the Warrior Training Hut. These timings and limits come from the trigger records.
- The terrain crosses both original map seams. The importer unwraps it before display: two scene units per original terrain cell, with blue to the south and Dakini to the north. Heights are scaled by 1/45; local foundations support the imported native models.
- `levl2001.hdr` selects AI script 10, so the matching campaign file is **levels/cpscr010.dat**, not the similarly named expansion script. Its bytecode is now imported by `scripts/import-script.py`; the reconstructed interpreter runs turn-zero initialization. The recurring terrain-marker/head-removal block is reconstructed; the rest of the live command host remains open.

`Manual.pdf`, printed pages 2–7, was rendered and read visually. It confirms shaman-only vault worship, repeatable single-shot gifts, four logs per tree with regrowth, drowning, small/medium/large hut capacities of 3/4/5, housing and work generating more mana, manually assigning braves to buildings, spell charging toggles, construction near an existing settlement, and G to guard the shaman. The manual also describes a population limit of 200. No original manual pages or quotations are distributed here.

The reproducible importer is `scripts/import-level.py`. Run it against the extracted campaign `levels` directory; it generates only the compact geometry/object description in `app/level-one.ts`. Binary extraction API: https://binref.github.io/lib/inno/archive.html

## Cross-checks and mechanics

- Mission flow and special events: [The Journey Begins](https://wiki.popre.net/The_Journey_Begins), [level-one walkthrough](https://ts.popre.net/websites/tsh/info_walkthroughs_level1.html). Worship, bridge to the centre, defeat the guard, learn warrior training, gather Lightning gifts, bridge to the enemy. The script checks terrain markers 35–40 and 25–29, removing the southern head when both height sums are positive on its EVERY 31 2 phase. This can occur without a complete walkable route. Victory checks remaining followers rather than requiring every empty building to be demolished.
- [Mana](https://wiki.popre.net/Mana): follower-generated flow goes into charging and training. The browser uses the documented relative per-minute generation rates and the 50/50 split when both are active. Working/housed braves generate more than idle braves. Blast charging can be paused by right-clicking its card; shrine gifts do not recharge.
- [Hut](https://wiki.popre.net/Hut), [Warrior Training Hut](https://wiki.popre.net/Warrior_Training_Hut): three/eight logs respectively. Builders physically walk to trees, chop, carry logs, deliver them and complete construction. Training starts only after braves are ordered inside. Occupied huts breed faster and eventually upgrade.
- [Blast](https://wiki.popre.net/Blast), [Landbridge](https://wiki.popre.net/Landbridge), [Lightning](https://wiki.popre.net/Lightning): distinct ranges, maximum four held shots, knockback/drowning, shore-to-shore terrain raising and lethal direct Lightning hits. The browser scales the documented 6/10/12-cell ranges to 12/20/24 scene units.

## Planet and grounding

The ocean is a complete sphere. Map points and followers are mapped to its surface; units, trees and buildings align with the local surface normal. Right/middle drag and WASD orbit the planet centre. Zoom changes altitude, with a closer oblique view over the active settlement. Enter or the planet button gives an overview; F and the minimap focus a surface location.

All building supports share one tangent plane. Supporting terrain vertices are placed on that plane, including the wall base, fence and doorway. Simulation sampling uses the same triangle diagonal as the renderer. Placement checks the complete footprint, slope, dry land, settlement proximity and spacing. Land Bridge preserves existing foundations. Construction uses scaffolding instead of scaling the house through the ground. Regression checks verify each supporting vertex and interpolated points against the plane before and after bridge casts.

## Deliberate differences

This recreates the first mission's geography and progression, not the original executable. Combat damage, recoil animation, breeding/upgrade timing, training cost and reincarnation delay use a compact browser simulation. Enemy AI still defends locally and casts Blast. Native script initialization supplies its state/attribute setup and disables Dakini reincarnation; the recurring terrain-marker rule also runs, while the rest of the campaign command host remains unimplemented. Spell charging uses normalized mana units and an initial stock of four Blasts. Land raising is gradual after a native-style projectile flight, but its deformation rule remains approximate. The globe is stylized; it does not emulate the original engine's projection or all 128 × 128 cells as navigable land. There is no fog-of-war, saving, multiplayer or later-campaign content. Models, textures and Web Audio cues remain original.
