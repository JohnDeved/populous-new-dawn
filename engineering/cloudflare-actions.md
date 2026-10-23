# Cloudflare builds on GitHub Actions

Issue: [#747](https://github.com/JohnDeved/populous-new-dawn/issues/747).
Source implementation is not deployment or cutover evidence. Keep this issue open
until the pilot, production promotion and native-build disconnect are proved.

## Existing host, unchanged release gate

This project is a **Worker**, not Cloudflare Pages. The trusted destination is
`populous-new-dawn`, account `19321bcee0ed17a93b709cb602dd070c`, already hosted at
`populous-new-dawn.webtorrent.workers.dev`. `wrangler.cloudflare.jsonc` and the
[successful existing PR comment](https://github.com/JohnDeved/populous-new-dawn/pull/729#issuecomment-6326132623)
confirm the Worker and version/branch URL model. No `.openai/hosting.json`, route,
subscription, hosting destination, existing workflow or branch protection changes
are part of this source migration.

- `Cloudflare build` runs once for PR opened/synchronized/reopened events targeting
  main and once for pushes to main, not for branch pushes as well as PR events.
  It checks out the exact head/main SHA, uses Node 24.19.0 and pnpm 11.25.0 with the
  frozen lockfile, and runs `pnpm run build:cloudflare` without deployment secrets
  or write permissions. Fork publication is deliberately unsupported.
- `Cloudflare publish` runs from trusted default-branch source after that build.
  It checks API workflow identity, source workflow bytes, run/attempt/artifact
  association, downloaded ZIP SHA-256 against GitHub metadata, and current PR head
  or main. It does not execute PR package scripts,
  generated Wrangler config, build hooks or artifact JavaScript. A bounded ZIP
  reader rejects traversal, symlinks, duplicates, hidden ZIP entries and excessive
  expansion; a fixed allowlist copies built modules/assets to fresh paths.
- The official pinned `cloudflare/wrangler-action` runs Wrangler 4.92.0 in a fresh
  directory, with publisher-owned config and `--no-bundle`. A fixed trusted
  pre-command repeats the live-head/secrets check after tool installation, directly
  before the upload, not a hook supplied by PR code. Module collection is
  bounded to `worker/`; no PR lockfile/package/hook config enters that directory.
  The source's generated config is ignored. ASSETS/IMAGES are the only declared
  bindings. Preview uploads never promote production traffic.
- Wrangler 4.92.0 normally inherits existing runtime secrets during version upload.
  The fixed config sets API metadata `keep_bindings: []` and preflight refuses any
  existing Worker secret names. No secret values are read or written. If this
  application gains secrets/private bindings, stop and design an isolated preview
  Worker before enabling publication. Do not relax the guard to make CI pass.
- Production requires mode `enabled`, a current-main push originating from exactly
  one merged PR, a successful API-verified `ready-pr-check.yml` workflow, all six
  expected successful gate jobs and its exact run/attempt quality receipt. The
  receipt's tested Git tree must equal the production commit tree. Upload produces
  a version first; a second current-main/gate check precedes 100% promotion through
  the existing Worker's deployments API. Direct pushes are not a bypass.
- The existing ready-PR `Full check` contract remains mandatory and unchanged.
  Preview success is neither review approval nor a substitute for that gate.

The repository was public when inspected on 2026-10-22. These workflows use
standard `ubuntu-24.04` runners, whose minutes are free for public repositories
under [current GitHub billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
This is not a promise that all artifact storage or Cloudflare usage is free.
Build archives expire after one day, small publication results after seven days.
No larger runners, paid plan or cross-trust dependency cache is configured.

## One current PR comment

`Cloudflare preview comment` watches build and publisher runs, including publisher
cancellation. Routing comes from GitHub-associated PRs and the trusted publisher's
numeric run title, never an artifact-supplied PR target. After routing, a per-PR
concurrency group serializes upserts; unrelated PRs cannot displace each other.
It only updates its own `github-actions[bot]` comment with the exact marker
`<!-- populous-cloudflare-preview:v1 -->`. A repeated identical result is a no-op.
Cloudflare's old app-owned comment is historical and cannot be edited by the
Actions token; the replacement owns one new comment rather than impersonating it.

Both links are accepted only from validated successful upload output:

- Branch preview: a stable, collision-resistant branch alias starting `b-`, with
  a slug and hash of the entire original branch. It moves with successful updates.
- Exact commit preview: the immutable uploaded Worker version URL. Its eight-digit
  version prefix is not the Git SHA; the comment explicitly links the actual Git
  SHA built by the source run. Never synthesize a URL from that commit SHA.

The reporter removes success links when the current attempt fails or is cancelled.
A completed build alone means publication queued/disabled, never deployed. Missing
or malformed publisher evidence is non-success. Failed/cancelled uploads may have
an uncertain remote outcome. Do not blindly retry them or label them successful.
Runs/attempts older than a current source, current comment or newer build cannot
publish a stale comment. Current-head checks occur immediately before publication
and before comment mutation.

Cloudflare aliases do not offer a GitHub-head compare-and-swap. If the head changes
*during* the remote upload, that upload may briefly move the alias to the prior
commit; post-upload checking refuses to report it as current, and serialized newer
publication corrects the alias. Immutable version links never change. Do not
claim a globally atomic alias/GitHub update or that cancellation rolls back a write.

## Setup: explicit approval required

The initial read-only inspection found no repository Actions secrets, variables or
environments. Do not put a deployment token in ordinary repository/organization
secrets: same-repository PR workflows can be modified to request them.

After the owner's action-time approval, configure:

1. An **account-owned** Cloudflare API token scoped to **Specified Workers**,
   selecting only the existing `populous-new-dawn` Worker, role **Individual Workers
   Editor**. No creation/deletion capability or other account/zone resource access
   is requested. [Cloudflare's granular-token instructions](https://developers.cloudflare.com/changelog/post/2026-09-15-granular-worker-permissions/)
   and [role reference](https://developers.cloudflare.com/workers/authorization/workers/).
2. GitHub environment `cloudflare-worker`, deployment policy **Selected branches
   and tags** with exactly a **branch** rule `main` and no tag rules. Store the token
   only as environment secret `CLOUDFLARE_API_TOKEN`. No new GitHub PAT is needed;
   the ordinary per-job `GITHUB_TOKEN` handles read operations and the separate
   reporter's narrowly scoped comment permission. No per-run reviewer gate is
   required by this design. [GitHub environment instructions](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).
3. Repository variable `CLOUDFLARE_ACTIONS_MODE`: unset disables publishing;
   `preview` enables only the pilot previews; `enabled` enables previews plus
   guarded main promotion. This is a rollout control, not a secret or release gate.

The account ID is nonsecret trusted configuration, not another credential. Never
print token values, upload them in artifacts, configure them through PR source, or
expand the token automatically. Granular Worker-token support is current, but API
reference permissions are inconsistent across endpoints: version upload lists
Individual Workers Editor; assets-upload-session and account subdomain lookup
still list legacy Workers Scripts permissions. Wrangler 4.92 uses those endpoints.
If the narrow token is rejected, stop the exact operation, retain the error code
without credential data, and seek a scoped remedy. **Do not silently replace it
with account-wide Workers Scripts Edit or grant other permissions.**

Permission references:
[version upload](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/versions/methods/create/),
[asset upload session](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/assets/subresources/upload/methods/create/),
[subdomain lookup](https://developers.cloudflare.com/api/resources/workers/subresources/subdomains/methods/get/).

## Staged pilot and cutover

The coordinator owns these steps. This document does not claim they happened.

1. Review and merge source-only changes through the unchanged Full check. Trusted
   `workflow_run` code must exist on main before it can publish; a PR cannot
   self-authorize a new publisher. Leave native Builds connected and mode unset.
2. Obtain approved narrow credential/environment setup. Verify policy is main-only
   and no runtime secrets/private resource bindings are attached to this Worker.
   Set mode `preview`. The current production stays untouched throughout the pilot.
3. Use a same-repository PR with two different ordinary commits and the unchanged
   build workflow. For each, retain GitHub build/publisher run IDs and attempts,
   exact source SHA, returned Worker version ID, both HTTP-tested preview links,
   and screenshot/runtime revision evidence. Verify the branch link moves to the
   second revision and the first immutable URL still serves the first revision.
4. Verify exactly one Actions-owned comment is edited in place, including a rerun,
   a superseded head, a controlled failed build and cancellation. Confirm a fork
   cannot deploy. Do not use real secrets in negative test fixtures.
5. Retain the existing production version ID and native build configuration for
   rollback. Only after replacement preview evidence passes, disconnect **this
   Worker's build integration**, not the GitHub App or hosted Worker: Cloudflare
   **Workers & Pages → populous-new-dawn → Settings → Builds → Disconnect**.
   [Official disconnect instructions](https://developers.cloudflare.com/workers/ci-cd/builds/#disconnecting-builds).
   Merely switching to `versions upload` still consumes native build minutes.
6. Set mode `enabled`; rerun the current successful main build if needed, or use the
   next reviewed/merged PR. Verify production gate provenance, exact promoted
   version, homepage/runtime revision and both preview links. If promotion fails,
   leave prior production serving and report the exact blocker; do not bypass gates.
7. Push/update a normal PR and complete a reviewed merge. Verify GitHub builds once
   per intended event and Cloudflare creates no native Build run, while serving
   GitHub-uploaded versions normally. Record before/after run evidence in #747.
   Only then mark migration/cutover complete.

Rollback: unset `CLOUDFLARE_ACTIONS_MODE` to stop new publications, inspect any
in-flight operation before retrying, and restore the previously recorded production
version through the existing authorized deployment process if necessary. Reconnect
only this Worker's native build integration using the recorded settings if needed;
its exhausted monthly build quota may still prevent builds. Do not remove hosting,
revoke unrelated credentials, reinstall the app, or buy an upgrade as a fallback.

## Source verification

Focused offline command: `node --test tests/cloudflare-pipeline.test.mjs`.
Tests cover byte-only artifacts/config exclusion, unsafe paths and symlinks,
workflow pinning, fork/stale/closed admission, exact returned URLs, idempotent
comment edits, older-run/head races, missing evidence and cancellation/failure
truthfulness. These are not live Cloudflare deployment evidence. The ordinary
ready-PR full gate is still required for source acceptance.

Action tags were resolved through the official repositories on 2026-10-22 and
pinned to full commit IDs: checkout v7.0.1, setup-node v7.1.0, upload-artifact v7.0.2,
and cloudflare/wrangler-action v4.1.3. Wrangler remains the repository's exact
4.92.0, not a floating latest version. No third-party sticky-comment action is
needed; the small trusted reporter owns the single-comment contract.

Further references: [official Wrangler action](https://github.com/cloudflare/wrangler-action),
[Cloudflare external GitHub CI](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/),
[version versus alias URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/),
[GitHub workflow_run security](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run).
