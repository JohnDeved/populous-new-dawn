# Source-bound result UI fixture

This runner renders the actual OriginalResultScreen with current globals.css and production hudScale. It byte-extracts Home's result JSX gate, click capture and keyboard effect. Remaining world/store/engine dependencies are explicit fixture stubs. Callback spies establish dispatch only, not live world/camera/campaign/pause/profile behavior.

Run from an available checkout with its installed dependencies and an installed official Chrome Headless Shell. No installation is performed. Serialize this browser run with other heavy checks.

1. Set POPULOUS_GAME_ROOT to the checkout's absolute path.
2. Set POPULOUS_FIXTURE_ROOT to a writable fixture directory, POPULOUS_RESULT_OUTPUT to a fresh writable output directory, and POPULOUS_BROWSER to the installed official Chrome Headless Shell executable.
3. Run `python scripts/result-ui-fixture/prepare.py --game-root "$POPULOUS_GAME_ROOT" --fixture-root "$POPULOUS_FIXTURE_ROOT"`.
4. Run `NODE_OPTIONS=--max-old-space-size=512 node scripts/result-ui-fixture/capture.mjs`.

Optional POPULOUS_RESULT_PORT defaults to4190. The fixture has its own Vite config, React plugin, bounded Tailwind scan base, node_modules symlink and cache. It does not use the full-game Vite server or change deployment config. Browser sandbox is enabled; no unsafe renderer or certificate-bypass flags are used.

Preparation records all nine production source/asset hashes plus commit identity and exact source-fragment hashes. Execution rechecks source hashes at end, records browser/renderer/DPR and capture geometry, and preserves24 case results. Output must be fresh to prevent overwriting existing evidence. If required source fragments move, preparation fails rather than silently substitute a reimplementation. Unknown changed production paths still need normal review.

Original verified run:73f3b74271850344b15fe996a456bd6153108b60,24 passed checks and19 screenshots. The portable version is adapted from that runner without changing scenario assertions. Its portability adaptation was statically inspected, not separately browser-executed. Retain original executed prepare.py/main.tsx/source.json/capture-final.mjs alongside their raw receipt and screenshots if citing the original run.
