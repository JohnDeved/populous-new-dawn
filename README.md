# Populous · The First Dawn

A playable, single-world browser tribute to **Populous: The Beginning**, rendered in an original stylized low-poly style.

## Run

Node 24 or later:

```sh
npm ci
npm run dev
```

Open the URL printed by the server on a desktop monitor with a keyboard and mouse. Mobile is not a supported target. WebGL 2 and hardware acceleration are required. Use the music-note button to enable original synthesized audio.

## Play

Select your shaman or followers, then click a destination or enemy. Drag to select a group; Shift adds to selection. Right-drag to orbit, scroll to zoom, and WASD to pan. The minimap also moves the camera.

- `1–6`: Convert, Blast, Lightning, Land bridge, Earthquake, Volcano.
- `B`: Buildings. Place them on open, reachable land; free braves construct them.
- `H`: Select shaman. `F`: Focus selection. `Space`: Pause. `Esc`: Cancel targeting.
- Huts grow your tribe. Idle braves gather wood. Camps train nearby braves. Temples generate mana. Towers defend automatically.
- Spells reach 34 paces from your shaman. Destructive magic also hurts your own people.
- Defeat all Dakini followers and buildings. Your shaman returns after death while followers survive. Lose all your people and the world is lost.

## Checks

```sh
npm test
npx tsc --noEmit
npm run build
# While npm run dev is running; requires installed Google Chrome:
node qa/browser-check.mjs
```

The simulation check covers walkability, commands, conversion, resource validation, construction, training, pause, deformation, reincarnation, victory, and defeat. The browser check covers real WebGL rendering, sound controls, conversion, movement, building completion, pause, speed, menus, lightning, restart, and desktop controls. `qa/` contains captured evidence, ignored by source control except the reusable scripts.

## Implementation

`app/model.ts` is the deterministic game simulation. `app/scene.ts` owns Three.js rendering, raycast input, camera controls, and minimap. `app/audio.ts` synthesizes ambience and action cues. React in `app/page.tsx` renders the HUD.

This is one complete skirmish, with simplified resource gathering and enemy raid AI. It does not implement the original campaign, multiplayer, boats, balloons, preachers, spies, world wrapping, or saved games. No original game models, textures, music, or voice recordings are shipped. Research and user-supplied references are recorded in [references/README.md](references/README.md).
