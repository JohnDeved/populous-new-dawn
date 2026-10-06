# Authored Land Bridge initialization proof

The original Mission 2 reward returns an initialized turn-1 bridge, while accepted main `b28b031` creates a turn-0 bridge. The native first visit initializes controller fields without terrain/trails/notifications. The next native and port component visits match exactly on supplied raw DAT terrain.

Read [findings](findings.md) and the [independent review](independent-review.md) for the bounded finding and all exclusions. The [receipt](receipt.json), [observations](observations.json), [instruction trace](executed-instructions.json), and raw logs bind the single native execution to its frozen inputs. The reviewer checked every retained instruction against the canonical original PE bytes.

These allowlisted text artifacts are byte-identical to the reviewed originals; [manifest.json](manifest.json) records hashes. Absolute local paths are provenance, not prerequisites for remote readers. The scratch probe is reproduced from the original source checkout under its documented ignored directory. No original executable, game assets, browser profiles, credentials, package tree or unrelated logs are published.

Scope excludes mixed-class scheduling, absolute world timing, ordinary native worship, native trail allocation/cosmetic RNG, terrain notification consumers, audio and rendering. PR 191's accepted endpoints, final terrain and checkpoint claims remain valid. Raw-DAT heightStep=0 must not be confused with its ordinary captured heightStep=2. No parity credit is claimed.
