// Data-only exact source inventory shared by the producer and separately pinned
// nine-job reader. No optional episode and no old-save-format fallback.
export const SHIELD_VISUAL_INPUTS = Object.freeze([
  'scripts/tutorial-browser/shield-visuals.mjs', 'scripts/tutorial-browser/shield-visuals-inputs.mjs',
  'scripts/tutorial-browser/shield-budget.mjs', 'scripts/tutorial-browser/shield-checkpoint.mjs',
  'scripts/tutorial-browser/shield-evidence.mjs', 'scripts/tutorial-browser/shield-observer.mjs',
  'scripts/tutorial-browser/checkpoint-codec.mjs', 'scripts/tutorial-browser/m2-pointer-f8.mjs',
  'scripts/browser-game.mjs', 'tests/support/bloodlust-scene.mjs', 'tests/level-start-fixture.mjs',
  'app/scene.ts', 'app/projection.ts', 'app/painter.ts', 'app/sprite-layers.ts',
  'app/shield-appearance.ts', 'app/spell-effects-runtime.ts', 'app/scene-shield.ts', 'app/scene-entities.ts',
  'app/scene-assets.ts', 'app/original-shield.json', 'app/original-units.json', 'public/original/shield.png',
  'app/checkpoint-format.ts', 'app/game-store.ts', 'app/game-clock.ts', 'app/live-people.ts', 'app/flyby.ts',
])
export const SHIELD_VISUAL_FILES = Object.freeze([
  'shield-visuals.json', 'shield-checkpoint-transfer.json', 'shield-checkpoint-source.json',
  'shield-checkpoint-expected.json', 'shield-initial-load-boundary.json',
  'shield-public-save.json', 'shield-public-load-expected.json', 'shield-public-load-boundary.json',
  'shield-build-frames.json', 'shield-context.png', 'shield-visible-pause.json',
  'shield-original-0.png', 'shield-original-1.png', 'shield-original-2.png', 'shield-original-3.png',
  'shield-scaled-0.png', 'shield-loaded-0.png',
])
