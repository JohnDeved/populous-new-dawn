# Mission 10 ordinary Firewarrior firing candidate

Source preparation only for [issue 229](https://github.com/JohnDeved/populous-new-dawn/issues/229).
No candidate browser, Node test, native replay, npm command or dependency transfer
has run as part of this preparation. Local commits are unpushed and not reset-durable.

The runtime/artwork candidate is pinned by `candidate-source.json`, including its
complete seven-path app/public change inventory relative to accepted b0208188,
SHA-256s, and exact app/public Git tree identities. This QA branch starts at
dc9c2b2d and intentionally makes no app/public changes. Integrate these QA changes
into the pinned packed source before runtime preflight or browser execution.
The Python `--source-only` mode reads the packed candidate's Git objects and
explicitly reports whether this worktree contains that application.

## Historical evidence stays intact

`baseline-provenance.json` records every original baseline checker file's SHA-256
at dc9c2b2d and every retained browser-baseline evidence file. Candidate helpers
were initially transferred byte-for-byte. Only README, preflight, scenario and
render-observation are adapted; all other transferred files remain byte-identical,
including helper-provenance, ordinary input, detached probes, entry/identity,
ground route, passive observation, real Pause input and its eight original tests.
The old baseline native source48/draw14 expectations remain in the baseline
checker, its unchanged tests and raw evidence. They have not been rewritten to
represent the candidate. The accepted baseline acquired Firewarrior178 and fired
at Tower65 with automatic command21/flags0x22/substate11; its captured volley was
not the first. Runtime IDs are still resolved from the same authored source and
ordinary acquisition, rather than manufactured or selected by a new fixture.

## Ordinary route and candidate expectations

Use the exact baseline route: All missions → Mission10 → Enter, visible intro
Skip and normal Shaman readiness; source-bound Hut149 and original Brave input;
passive observation before admission/allocation/emergence; actual4000-mana cost;
select the newly trained on-foot Firewarrior; one genuine model3 ground Move
using the existing corridor and minimap helper. Never click the Tower or issue a
manual attack. Detect automatic command21/substate11/phase44 with a real paired
volley attributed to the acquired unit and the source-bound hostile Tower.

Hold/release the public Pause button exactly as the baseline does. Detection
continues to observe actual ownership and projectile state, without an intended
artwork predicate. At detection, pointer release, click and screenshot-time reads,
require native source56/draw13 and exact automatic flags0x22. Preserve frame/layer,
direction, mirrored UV and scale assertions, actual full-view and actor-crop
screenshots, stable paused owner/turn/phase, public Resume and observed phase40/
completion. A missed release or missing transient observation remains a failure.
The witness does not assert that the captured volley is the first.

The renderer reference accepts explicit atlasX/atlasY together, falling back to
the historical index/columns/cell formula. It rejects incomplete or out-of-bounds
origins and retains the old mirror/composition expectations. Production source and
independent artwork checks separately prove that only the80 appended pieces have
explicit coordinates. Exact image size remains2048×8128, columns32, cell64.
The earlier2048×8256 candidate and its8192-limit resize are rejected.

## Transparent texture observation

At the visible Start dialog, assert that no game scene canvas exists, then install
three WebGL2 prototype wrappers: texStorage2D, texImage2D and texSubImage2D. No
harness or application changes are needed. Each calls its original method exactly
once with the original receiver/arguments, returns its original result and
rethrows the same original exception. Observation failure only invalidates QA;
it does not replace an original result or stop an application call.

Read TEXTURE_BINDING_2D on the current active unit to identify the real texture;
no bindTexture or activeTexture wrapper is needed. Around actual texStorage2D,
read TEXTURE_IMMUTABLE_FORMAT. Record its false→true transition and immutable
levels1 alongside requested2048×8128 dimensions. Record the actual level0 full
texSubImage2D call, dimensions and HTMLImageElement identity. Other overloads,
extra allocations/uploads, mip levels, resized canvas sources and unsupported
paths cannot satisfy acceptance. No manual upload, renderer invocation, texture
initialization, simulation tick, clock, RNG, world or camera mutation is added.
The observer never calls getError: it leaves the application's error queue intact.

Immediately after ordinary scene readiness, correlate the observed GL object with
the actual visible unit SpriteMaterial maps and their already-existing
renderer.properties record. Check properties.has before properties.get so a
missing record cannot be created by observation. Require one shared unit map,
an initialized valid GL texture, exact original image URL, complete image,
natural/display dimensions2048×8128, and matching texture/source renderer versions.
The same context's gl.MAX_TEXTURE_SIZE and renderer.capabilities.maxTextureSize
must agree and cover8128. Three's reviewed upload implementation is separately
pinned in `upload-runtime.json`; this gate does not require16384 capability.

Restore only wrappers still owned by this observer immediately after readiness.
Retain the bounded observations, then require identical map/source/GL object/image
identities and versions at the actual Firewarrior screenshot. This limits hook
lifetime to preload; it does not claim to observe every upload after restoration.
The unchanged source/versions and pinned Three path bind that initial upload to
the captured map. The harness's complete warnings stream starts before navigation
and remains active through pixels/recovery. Reject any texture resize/oversize
warning, even when Three omits the atlas filename; retain unrelated warnings.

This proves observed allocation requests, the immutable-format transition and
original-image upload calls on the actual map. A normally returning WebGL call
alone is not a success query: WebGL can queue errors without throwing. No GPU
texture readback or broad original-raster claim is made. Actual local actor pixels
and visual inspection remain mandatory; metadata cannot replace them.

Observer limits:60000ms,200000 upload calls,2048 records,4 contexts,1024 textures
and1024 source-image identities. Exceeded limits disable recording and fail QA;
original calls continue. Cleanup retains bounded raw records and restores only
owned methods. No global process or port cleanup is added.

## Prepared checks and execution bounds

The source-only preflight uses Python standard library and Git reads. It verifies
candidate objects, exact historical checker/evidence preservation, helper transfer
identity and the source import closure without running Node or resolving packages:

```sh
python qa/firewarrior-firing-candidate/preflight.py --source-only
```

Prepared, not run: fake-GL Node tests verify exact receiver/arguments/results and
single forwarding, exception identity, current active-unit binding, readonly
allocation flags, original image identity, restoration ownership, bounded failure,
8192 capability acceptance and rejection of resizes/foreign/unsupported uploads.
The unchanged eight Pause tests retain their raw baseline expectations. These host
checks do not constitute gameplay or GPU evidence. A proposed CPU4 grant:

```sh
timeout --signal=TERM --kill-after=2s 25s taskset -c 4 \
  prlimit --as=8589934592 --cpu=15:20 --fsize=8388608 --core=0 \
  node --max-old-space-size=128 --test --test-concurrency=1 \
  qa/firewarrior-firing-candidate/pause-input.test.mjs \
  qa/firewarrior-firing-candidate/texture-observation.test.mjs
```

The existing sole dependency tree must be moved only by its coordinator, with a
receipt. No install/copy/symlink/second tree is authorized here. Runtime preflight
retains the accepted inode/lock/browser identity checks, Node syntax checks,
built-in resolution only, full import closure and pinned Three implementation:

```sh
python qa/firewarrior-firing-candidate/preflight.py \
  --dependency-root node_modules --browser "$POPULOUS_BROWSER" --require-local-dependencies
```

Only after integrated source review, focused test grant, dependency transfer,
runtime preflight and a separately coordinated browser grant:

```sh
timeout --signal=TERM --kill-after=5s 330s taskset -c 0-3 \
  env TMPDIR="$PWD/work/orchestration/firewarrior-firing-browser-candidate-01/tmp" \
  CLOUDFLARE_CF_FETCH_ENABLED=false WRANGLER_SEND_METRICS=false \
  node scripts/local-render/harness.mjs --game-root "$PWD" --browser "$POPULOUS_BROWSER" \
  --port 4401 --mission 10 --timeout 300000 \
  --scenario "$PWD/qa/firewarrior-firing-candidate/scenario.mjs" \
  --output "$PWD/work/orchestration/firewarrior-firing-browser-candidate-01/run"
```

Create fresh owned tmp/output directories and use the existing receipt wrapper,
binding checker/preflight/manifest/runtime inputs. Include the actual ESM bundles
with `--input node_modules/three/build/three.module.js` and
`--input node_modules/three/build/three.core.js`; both are pinned in
upload-runtime.json, runtime preflight dependencyFiles/outerReceiptInputs and the
scenario's before/after runtime identity. Check the private port before
launch without disturbing services. Retain the baseline's single CPU0–3 lane,
ephemeral1440×1000 sandboxed official Headless Shell,300s harness/330s outer bound,
entry60s,training110s/30s no-progress,route/firing42s,capture/recovery20s,
180s passive observer,18000 total/12000 undrained rows and192MiB raw-row ceiling.
Retain harness terminal receipt and actual original-session termination.

Source review, candidate browser execution, screenshots and visual review remain
separate gates. No new parity, hardware-performance, person-target, whole-command,
whole-game or release-completion claim is supported by this source preparation.
