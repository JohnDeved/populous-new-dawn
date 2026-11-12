# Gameplay diagnostic pre-install admission proposal

Source-only design, 2026-11-12. Reviewed reference: inactive commit 4ff93ec9. No workflow activation, package execution, qualification, or new permission is implied.

## Current verified boundaries

- Workflow blob 14c086be4e4373f14371a4e4a2ff701a5c113cd5 rejects owned-swamp-diagnostic and spy-discovery-diagnostic before checkout/install. Retain this guard until the complete route is separately reviewed.
- identity.mjs blob a71eedf965266386468a3d102732ed7876798e04 binds workflow_dispatch, main workflow identity, exact candidate SHA, and disjoint infrastructure/candidate roots. It is not candidate dependency admission.
- Existing install step selects npm or pnpm from candidate package.json. pnpm uses frozen lock and disabled scripts; npm ci does not disable lifecycle scripts. Post-install dependencyReceipt binds pnpm package/lock/workspace metadata but cannot retroactively authorize installation.

## Proposed independent inactive module

Infrastructure-owned admission receives an explicit reviewed tuple: infrastructure SHA, candidate SHA, diagnostic kind, package-manager version, and SHA-256 of package.json, package-lock.json, pnpm-lock.yaml and pnpm-workspace.yaml where present. Pins must be reviewed input, not generated from the candidate and automatically accepted. Missing, unexpected or changed files reject before package-manager execution.

For the first gameplay route, admit only the already chosen pnpm 11.25.0 policy. Do not inherit the legacy npm lifecycle route. Confirm clean exact checkout and regular non-aliased policy files. Inventory candidate .npmrc/.pnpmfile.cjs/workspace configuration and reject unreviewed config, registries, hooks or local/file/link/workspace dependency sources rather than guessing their safety. Pin all intentionally supported policy inputs. Do not silently drop a committed setting to make installation succeed.

Installation ownership and environment are separate prerequisites: fresh private store/cache/HOME/temp and bounded owned command; normal approved proxy routing retained; explicit allowed package configuration; no adoption of held resources. Frozen lock and --ignore-scripts are necessary but not complete proof. Local current shared destination absence must not be bypassed by this proposal.

Independent review additions: bind package-manager bootstrap provenance and bytes, Node/platform tuple and exact install command, not version alone; global npm bootstrap itself executes a package manager. Resolve the effective configuration across environment npm_config_*/pnpm_config_*, ancestor/user/global config and manager hooks; fresh HOME alone is insufficient. Include patch files, patchedDependencies, overrides, catalogs, workspace manifests and every install-affecting referenced input in the reviewed closure. Validate lock resolution origins/integrity and reject unreviewed Git/URL tarballs as well as local sources. Reuse existing manualIdentity/sourceManifest checks rather than duplicating them, and recheck the entire admitted policy/input closure immediately before launch.

Second review additions: pin expected absence as well as presence of configuration/hook files so newly added policy inputs fail closed. Effective configuration includes NODE_OPTIONS and explicit allowed proxy settings; inherited verifyDepsBeforeRun overrides must not silently win. Resolve transitive lockfile/workspace references, not only root declarations. Final recheck requires exclusive source ownership, with no concurrent writable actor. Unsupported features can be rejected rather than adding a general-purpose resolver. The current Spy workspace declares hardlink imports; a proposed private copy-mode profile must explicitly reconcile and bind that intentional effective-policy difference, not silently modify source policy.

After install, verify desired/installed locks, source identities, dependency layout and native compatibility before imports/build/browser. Existing native smoke receipts apply only to their exact profile, not arbitrary new candidate. Process cleanup, resource admission and browser gates remain separate; this design must not grant them implicitly.

## Small source-only test plan

Use supplied metadata fixtures, no package manager or app imports: accepted exact tuple; changed candidate/infrastructure/kind; missing/altered lock; unsupported manager; symlink policy file; unreviewed config/hook; local-path dependency; changed policy after admission; stale admission reused for another candidate. Tests must distinguish metadata admission from actual install success. Independent review precedes implementation or execution.

## Status

Proposed, not implemented. No observed security breach is claimed. Main workflow's existing guard remains a valid fail-closed boundary. Runtime qualification remains blocked by unavailable qualified current profile/shared destination in this execution scope.
