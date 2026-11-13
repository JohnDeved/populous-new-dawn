# Guard Post knowledge-owner correction

This addendum supersedes the older claim in help-building-discovery.md and help-spell-discovery.md that current Hut1 and GuardPost17 knowledge owners are absent. Verified against main 532cd9efb13acf0a36f2b9774c8892b18f918be6, not inferred from historical prose.

app/help-building-discovery.ts (blob 479bfe0dcc3b37f6cb3bc5b366ca12d625cd88f8) maps Help bit17 to World.unlockedGuardPost. These are knowledge bits, not rendered/picked object models. Native picked class10/model16 in guard-post-context.md remains a distinct identity.

New World creation initializes unlockedGuardPost=true, with source comment identifying 0042caad after the profile copy. Old checkpoints with missing state remain unsupported; this must not be backfilled. It is player-0 knowledge ownership, not placement/HUD availability or complete producer parity.

No gameplay change is justified by this correction. Placement/removal producer, capacity/terrain, loop/N-release and save lifecycle remain unresolved. No tests or original/browser execution performed.
