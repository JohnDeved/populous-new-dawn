# Optional scene-fixture precompilation

The Node scene fixture normally uses the existing TypeScript `transpileModule`
emitter. The optional path separates that compiler process from the later scene
process: it reads the **same emitted bytes**, not a native replacement transform.
Neither application code, test selection, loader resolution, nor JSON wrapping
changes. With both cache settings absent, the normal path remains unchanged.

This is a bounded fixture aid, not a general build cache or an automatic memory
admission mechanism. Follow the [resource budget](resource-budget.md) and keep
preparation and consumption serial. Report both costs; precompilation does not
make compiler CPU, memory or output storage free.

## Scope and certification

- The existing ES2022/ESNext emitter settings, import elision, property transforms
  and generated-level literal bypass are preserved exactly. No `fileName`, native
  stripping, source maps, extra compiler settings or forced GC are introduced.
- Requests bind the actual source bytes, compiler entry/package bytes, helper,
  hook, preparer, Node version, architecture, platform and emitter settings.
  The external execution envelope must additionally bind the actual Node binary,
  complete resolved dependencies, other fixture inputs, command and environment.
  The recorded commit is provenance supplied by the caller, **not** an independent
  check that the working tree equals that commit. Bind any reviewed diff too.
- A consumer requires an absolute manifest path and its independently recorded
  SHA-256. Every load checks current source bytes and cached output bytes. Missing,
  changed, foreign or malformed entries fail closed; there is no compile fallback.
  Cache files are executable source: use only the reviewed preparer's output from
  a trusted, source-bound run, never a supplied manifest hash as proof of trust.
- `pnpm test`, `pnpm run test:focus`, serial runs and shard certification reject
  either `PND_SCENE_FIXTURE_PRECOMPILED` setting by presence, including empty
  strings. An externally prepared cache is supported only by an explicit direct
  Node command with its own source-bound evidence. It must not inherit ordinary
  full-suite/shard certification under an unbound environmental fingerprint.
- Normal top-level test discovery includes both new test files. Shared-helper
  fingerprint drift conservatively makes the standard suite serial; do not refresh
  `engineering/test-resources.json` merely to regain concurrency.

## Prepare an explicit request

Freeze the reviewed source, toolchain and dependencies first. From that checkout,
choose a new absolute request path outside tracked source and supply its reviewed
commit. The following **source-only** example inventories the current fixture's
top-level `app/*.ts` files; it does not import the application or TypeScript compiler.
Review the resulting exact inventory and hash before admitting compilation.
Nested or future unsupported modules are not silently compiled by the consumer.

```sh
# Set these to reviewed values, not a stale example request or manifest.
REQUEST=/absolute/owned/attempt/request.json
REVIEWED_COMMIT=<reviewed-40-character-commit>
node --input-type=module - "$REQUEST" "$REVIEWED_COMMIT" <<'JS'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdirSync, realpathSync, writeFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { sceneFixtureIdentity, sceneFixtureReadBounded } from './tests/support/scene-fixture-source.mjs'
const [requestPath, sourceCommit] = process.argv.slice(2)
assert(isAbsolute(requestPath) && /^[a-f0-9]{40}$/.test(sourceCommit))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const sourceRoot = realpathSync('.'), app = join(sourceRoot, 'app')
const names = readdirSync(app).filter(name => name.endsWith('.ts')).sort()
assert(names.length > 0 && names.length <= 512)
let total = 0
const entries = names.map(name => {
  assert(/^[a-z0-9-]+\.ts$/.test(name))
  const source = sceneFixtureReadBounded(join(app, name), 256 * 1024)
  total += source.length
  assert(total <= 6 * 1024 * 1024)
  return { name, sourceBytes: source.length, sourceSha256: hash(source) }
})
const bytes = Buffer.from(JSON.stringify({ format: 'scene-fixture-input-v1',
  sourceRoot, sourceCommit, identity: sceneFixtureIdentity(), entries }, null, 2) + '\n')
assert(bytes.length <= 256 * 1024)
writeFileSync(requestPath, bytes, { flag: 'wx', mode: 0o600 })
console.log(JSON.stringify({ requestPath, sha256: hash(bytes), modules: entries.length }))
JS
```

Do not automatically refresh the request when a pin fails. A changed source or
toolchain requires review and a new admitted attempt. Node version changes alone
invalidate the cache, even if the TypeScript package is unchanged.

## Serial compiler, then consumer

The preparer requires exactly three arguments: absolute request, reviewed request
SHA-256, and a **nonexistent** absolute output directory. Its parent must already
exist. Use the existing owned execution envelope, resource admission and raw
capture; the commands below describe the payload, not a replacement supervisor.

```sh
node --max-old-space-size=256 scripts/prepare-scene-fixture.mjs \
  "$REQUEST" "$REQUEST_SHA256" "$NEW_OUTPUT"
```

Wait for the actual compiler process to exit and review its native result, all
declared input/output hashes, manifest, tool identities and allocated output size
before launching the consumer. Limits are 512 sources, 256 KiB per source, 512 KiB
per emitted module and 6 MiB total source/output each. These are input/output
bounds, **not** a whole-process RSS guarantee. `--max-old-space-size` is not an RSS
cap either; the existing external sampled resource limits still apply.

`manifest.json` is written last, after source/tool validation. Failed or interrupted
writes can leave a partial manifest as well as partial modules; existence alone
does not prove completion. Only a successful waited preparation and independently
verified manifest/output hashes admit consumption. Preserve partial attempts for
inspection; do not reuse, overwrite, silently retry or count them as success.
The writer tests do not establish atomic publication or filesystem crash durability.

After acceptance, use the exact manifest hash recorded by that preparation. For
example, the unchanged ordinary numeric-runtime file can run as one direct process:

```sh
PND_SCENE_FIXTURE_PRECOMPILED="$NEW_OUTPUT/manifest.json" \
PND_SCENE_FIXTURE_PRECOMPILED_SHA256="$MANIFEST_SHA256" \
node --max-old-space-size=256 --test --test-isolation=none \
  --test-concurrency=1 --test-reporter=tap tests/ordinary-numeric-runtime.test.mjs
```

Keep existing test cases and oracle settings unchanged. This example does not
enable `PND_TERRAIN_BASELINE` or claim native parity. Preserve raw TAP, process
identity/exit/wait, source/tool/output pre/post bindings, resource samples and
cleanup outcome. Report preparation and consumer time/RSS/storage separately,
plus their serial peak and summed command durations; do not infer a matched
memory gain from a historical run with a different application revision.

## Regression coverage and limits

With both cache settings **unset**, normal isolated file execution is supported:

```sh
pnpm run test:focus tests/scene-fixture-precompiled.test.mjs \
  tests/scene-fixture-preparer.test.mjs tests/scene-fixture-source.test.mjs \
  tests/test-runner.test.mjs
```

- Reader tests cover cache validation and prove those paths do not import the
  compiler. Run in a fresh file-isolated process, not together with the compiler
  contract under `--test-isolation=none`.
- The unchanged compiler contract checks exact ordinary emission and all generated
  level literals. It remains required independently of cache-reader tests.
- Seven portable preparer cases cover five guard paths, successful publication and
  a writer exception after the first real output. They evaluate the real CLI module
  sequentially with unique query URLs and restored `argv`; these are **in-process**
  exceptions/filesystem assertions, not seven separate CLI exit observations.
  The injected writer exception does not simulate an OS crash.
- Runner regressions reject either/both/empty cache settings at planning and actual
  execution, including a setting introduced after a plan was created.

The focused checks are not full integration acceptance. Changes to this shared
fixture still require the planner's broad standard checks and review of its
existing consumers. Preparation/consumer qualification must bind the exact current
source and runtime; a previous private assembly result is not a new draft-head or
hosted full-suite pass.
