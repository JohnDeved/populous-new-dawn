# Bounded browser readiness audit

Source audit began on accepted main
`b219c63be33c440cea0927c487f16573e5a1c0ec`. It excluded the separately owned
early-missions guard, transport/follower work and Mission3 ordinary-control work.
No browser or full-check job ran for the audit itself. The one subsequent full
check was the exact repaired-candidate acceptance retained in this packet.

Installed Playwright 1.63.0 calls `predicate()`, tests truthiness and fulfills the
result before Promise adoption. Thus an async predicate's Promise ends polling
even when it later resolves false. Rejections still propagate. The exact installed
bundle hash and short source excerpt are in
[installed-playwright-polling.json](inputs/installed-playwright-polling.json).

| Caller at audited source | Predicate and Promise behavior | Independent later evidence / repair boundary |
| --- | --- | --- |
| [checkpoint:398](https://github.com/JohnDeved/populous-new-dawn/blob/b219c63be33c440cea0927c487f16573e5a1c0ec/scripts/check-browser-checkpoint.mjs#L398) | Async IDB `latest.version === 1`; returns Promise and discarded false handle. | Repaired by PR197. Later restored-state predicate/assertions were already independent evidence and remain unchanged. |
| [Mission4:572](https://github.com/JohnDeved/populous-new-dawn/blob/b219c63be33c440cea0927c487f16573e5a1c0ec/scripts/check-browser-mission4-natural-victory.mjs#L572) | Async persisted profile read; returns Promise. | Later fresh-page `Mission 4, completed` visibility independently verifies persistence. Small repair would reuse awaited readback and assert true. |
| [building-menu:33](https://github.com/JohnDeved/populous-new-dawn/blob/b219c63be33c440cea0927c487f16573e5a1c0ec/scripts/check-browser-building-menu.mjs#L33) | Async import and HUD image complete/naturalWidth test; returns Promise. | No direct post-wait assertion of this readiness result. Await each observation or preload before synchronous polling. |
| [building-panel-hover:64](https://github.com/JohnDeved/populous-new-dawn/blob/b219c63be33c440cea0927c487f16573e5a1c0ec/scripts/check-browser-building-panel-hover.mjs#L64) | Same async HUD asset gate; returns Promise. | Same minimal repair boundary; later UI assertions do not repair this gate. |
| [worship-panel-live:46](https://github.com/JohnDeved/populous-new-dawn/blob/b219c63be33c440cea0927c487f16573e5a1c0ec/scripts/check-browser-worship-panel-live.mjs#L46) | Same async HUD asset gate; returns Promise. | No direct result assertion; same minimal repair boundary. |
| [minimap-frame:89](https://github.com/JohnDeved/populous-new-dawn/blob/b219c63be33c440cea0927c487f16573e5a1c0ec/scripts/local-render/minimap-frame.mjs#L89) | Synchronous enabled-button check; no Promise. | In-memory save availability precedes committed IDB storage in game-store:386. Later Load Game/binding proves loadability and capture checks raster/layout, not exact saved-world identity. Small repair would await exact committed readback before reload. |

These are readiness/race findings. They do not relabel earlier successful gameplay,
saved-world or pixel evidence. No additional persistent-function alias or
camera-after-target-mode defect was demonstrated in the nonexcluded shared
browser/local-render sources inspected. This negative result is bounded, not a
certification of every historical standalone checker.

The earlier alleged Menu-selector blocker was incorrect and withdrawn. At audited
page.tsx:869, the HUD help button has accessible name `Menu`; at :1084 the separate
top-actions control is `Game settings`. Both call `setMenu(true)`. Neither selector
was changed in this repair.
