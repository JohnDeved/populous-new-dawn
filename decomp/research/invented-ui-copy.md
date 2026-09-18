# Invented browser UI copy boundary

Issue 58 removes only positively identified browser-authored flavor prose from the existing page shell. This note does **not** claim that the current startup chooser, combined settings dialog, checkpoint workflow, loading/error lifecycle, end-screen structure, or browser accessibility layer matches the original menus.

## Reused evidence

No new native sweep was needed. The implementation reuses:

- `work/orchestration/worker-2-invented-copy/evidence/copy-user-report.md`, SHA-256 `9c7188603245710509914826e9e3a7363e10f7ad107c139a12fbabdbe8ab6246`, copied byte-for-byte from the existing issue 58 user report.
- `work/orchestration/worker-2-invented-copy/evidence/messages-user-report.md`, SHA-256 `e63b348419281448b398f0bb69255b32c2d344b54acfad811a6c2e2284d41219`, retained only as adjacent campaign-message context.
- [original-menus.md](original-menus.md), which proves original menu labels and explicitly distinguishes native menu structure from the browser's current compatibility UI.
- [loading-art.md](loading-art.md), which proves localized English entry 515 is `Loading...`.
- `app/original-messages.json`, retained unchanged as the imported native campaign/tutorial message corpus.
- The supplied English `language/lang00.dat`, SHA-256 `e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d`.

The targeted localized-string lookup establishes these exact literals:

| Language entry | Original English text | Browser use in this bounded change |
| ---: | --- | --- |
| 248 | `Level Complete` | result eyebrow for a win |
| 249 | `Level Failed` | result eyebrow for a loss |
| 268 | `Populous: The Beginning` | replaces browser-only “First Dawn” decorative branding in the startup/settings surfaces |
| 303 | `Continue Game` | closes the existing in-game dialog and resumes the current game |
| 434 | `Restart Level` | existing result restart action |
| 443 | `Select Level` | heading for the current browser mission chooser |
| 515 | `Loading...` | neutral status text replacing the browser-authored startup metaphor |
| 751 | `Level Won` | result heading for a win |
| 752 | `Level Lost` | result heading for a loss |
| 1189 | `You have failed to conquer this world.` | generic loss explanation |

Using an original literal here does not imply that the browser screen containing it has the original layout, timing, navigation tree, or caller. In particular, the current mission chooser is still a browser adaptation rather than native main menu 0, and the initial checkpoint lookup is not claimed to be the original resource-loading caller proved in the loading-art research.

## Removed or replaced page flavor copy

The page-only correction is intentionally small:

- `POPULOUS · THE FIRST DAWN` → `Populous: The Beginning`.
- `Choose your world` → `Select Level`.
- `A world is awakening` → `Loading...`.
- `The world could not awaken` → neutral modern error heading `Loading failed`.
- `THE FIRST STEP TO GODHOOD` / `THE CIRCLE IS BROKEN` → `Level Complete` / `Level Failed`.
- `A world united.` / `Even gods can fall.` → `Level Won` / `Level Lost`.
- On victory, the factual `The <tribe> are defeated.` is retained while the invented suffix `Your people will remember this dawn.` is removed.
- The invented loss sentence is replaced by original entry 1189.
- `Begin again` → `Restart Level`.
- The settings-dialog metaphor `The world can wait.` → truthful modern heading `Game settings`.
- `Return to the world` → `Continue Game`.

## Deliberately preserved modern copy

Not every non-native browser sentence is a parity defect. This change preserves copy that communicates real browser behavior or accessibility:

- `Choose a mission …` and the recommended-next-mission status.
- `Looking for your last saved world.`, because it explains the browser checkpoint lookup rather than pretending that state is an original native loading phase.
- `The battlefield did not finish loading. Retry the same request when you are ready.`, `Technical details`, and `Try again`.
- Mission-specific help/objective prose and campaign facts already attached to the browser's current mission implementation.
- `Save checkpoint`, `Load checkpoint`, HUD/audio/game-speed/zoom/focus controls, and their accessible names, because they describe browser compatibility features rather than original save-slot/options behavior.
- `Continue to Mission N`, because it truthfully describes the browser campaign-progression action.
- All original campaign/tutorial messages in `app/original-messages.json` and all message runtime/content paths.

The issue 58 user report also identifies invented spell-success prose outside `page.tsx`. That is real task evidence but outside this Worker2 page-copy ownership grant, so this slice neither edits nor makes a completeness claim about those runtime strings.

## Verification boundary

The focused browser check covers the current startup chooser, the modern loading-error recovery surface, the in-game settings dialog, and forced win/loss result presentation. It asserts the removed flavor strings are absent while functional retry/accessibility/control copy remains available.

This slice does not change DOM structure, CSS/layout, loading state transitions, message content/runtime, simulation, store, scene, audio, RNG, or campaign logic. CEO integration owns aggregate/build gates.
