# Art, sound, gameplay, and stack references

## Accepted direction

The user selected the original generated `public/og.png` artwork as the art and level-design target on 2026-09-07: stylized low-poly geometry, a prominent rocky mountain, a blue coastal village, a rival red settlement beyond the ridge, warm dawn light, azure roof patterns, turquoise water, standing stones, and palms. The illustration is concept/cover artwork; the game itself renders an interactive Three.js scene.

The screenshot references below guide architecture and game identity. They are kept in this research folder, outside public assets, and are not used as game textures.

## Visual references

- Official storefront screenshots: https://store.steampowered.com/app/2616430/Populous_The_Beginning/ — broad thatched roofs, tribal markings, watchtowers, fences, unit scale.
- Community screenshot: https://images.igdb.com/igdb/image/upload/t_1080p_2x/jz4wrwlvitlsuszlsco9.webp — curved horizon and settlement density.
- User: https://the-beginning.b-cdn.net/wp-content/uploads/2022/01/PopTB_1_5_4044-2022-01-04-19_15_40.png — curved hilly landscape, standing stones, vegetation, large blue tower.
- User: https://i.ytimg.com/vi/MMLOns86Rr0/maxresdefault.jpg — settlement construction, distinct training buildings, timber scaffolding.
- User: https://www.dazeland.com/images/PC-consoles/Populous3-5.jpg — early village, proportions, fences, warriors, clear troop silhouettes.
- User-provided thumbnail references `user-ref3.jpg`, `user-ref5.jpg`, and `user-ref6.jpg`: shrine gathering, volcanic terrain, and balloons respectively. Balloons are reference-only and are not in this single-world version.

## Audio references

- Original soundtrack, in-game tracks 2–5, credited to Mark Knight: https://www.youtube.com/watch?v=kIY_4F47R6Q
- Original menu music reference: https://www.youtube.com/watch?v=mc1JrhV5d2k
- Composer's own catalogue and credits: https://marktdkknight.bandcamp.com/
- Shaman cue catalogue, including selection, acknowledgement, blast, bolt, landbridge, earthquake, and volcano variants: https://sounds.spriters-resource.com/pc_computer/populousbegin/asset/393974/
- Audio-bank documentation from the PopSoundEditor author: https://toksisitee.github.io/blog/pop-sound-editor — distinguishes rhythmic drum banks, music/drone banks, and follower/ambient/effects banks.

These are located listening/reference sources and cue documentation; direct playback of their recordings was not available through the research tools. No original recordings were copied into the game. `app/audio.ts` instead synthesizes an original layered ambience, sparse modal tones, hand-drum-like pulses, and separate spell cues. Audio begins only after a user gesture and supports mute and volume. The first version uses tonal acknowledgements, not voiced speech.

## Gameplay references

- https://wiki.popre.net/Populous%3A_The_Beginning — shaman-led real-time strategy, followers, buildings, conversion, mana, and enemy tribes.
- https://wiki.popre.net/Shaman — selection and casting range, combat, and reincarnation supported by living followers.
- https://ts.popre.net/websites/poptb.com/guide/getting-started/index.html — tribes, follower and building roles.

The implementation uses a compact, deterministic simulation. Its economy is simplified: idle braves generate wood, huts generate braves, camps train nearby braves, and temples add mana. The terrain is a bounded heightfield projected onto a curve, without world wrapping. Values are tuned for this one scenario rather than copied from the original game.

## Stack research and decision

- Three.js installation: https://threejs.org/manual/en/installation.html — npm plus Vite is the documented build-tool route.
- Three.js WebGLRenderer: https://threejs.org/docs/pages/WebGLRenderer.html — WebGL 2 renderer; appropriate for a browser-first 3D island with dynamic geometry.
- Three.js manual: https://threejs.org/manual/en/fundamentals.html — scene, camera, and renderer model.

Chosen: Three.js for rendering and raycasting; a TypeScript simulation with a fixed 30 Hz timestep; React for the HUD; Vite/vinext for bundling and the Sites-compatible shell; Web Audio for original sound; native Node assertions and Playwright/Chrome for verification. No physics engine, multiplayer server, asset downloads at runtime, or model loader is needed for this scale.

## Cover artwork

Generated once with the built-in image generation tool and saved to `public/og.png`. The accepted prompt requested a landscape social card reading “POPULOUS”, “THE FIRST DAWN”, and “A BROWSER TRIBUTE”, with elegant Roman serif typography, deep teal and gold, an original low-poly curved island, blue shaman and thatched huts, mossy rocky mountain, palms and conifers, a distant red village, and warm directional dawn light. The image also became the user-approved art direction for the playable level.
