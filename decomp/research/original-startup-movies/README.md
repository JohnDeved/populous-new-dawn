# Startup movie static evidence

See [the research note](../original-startup-movies.md) for scope and conclusions.

- provenance.json: source archive and inner installer identities.
- retained-sources.json: six reference-source hashes at the immutable base.
- installer-member-summary.json: compact FMV subset and full member-index hash.
- movie-inventory.json: seven files, hashes, sizes and probe packet counts.
- movie-strings.json: executable filename addresses, not standalone caller proof.
- metadata/: raw FFprobe stream/format and packet-count observations.
- *-caller.asm, movie-wrapper.asm and movie-callback.asm: bounded static excerpts.
- *-version.txt and extractor-*.txt: inspection/extraction tool identities.
- startup-boundaries/: conditional entry, lobby/language producers and frontend timer evidence/reproducer.
- input-player/: queued input, consumed stop flag and player cleanup evidence/reproducer.
- SHA256SUMS: checksums for the evidence files above, excluding itself.

The rejected byte-pattern candidate remains labeled in the research note. No
archive, executable, media binary or decoded audiovisual content is included.

Follow-up notes: [startup boundaries](../original-startup-boundaries.md) and [movie input/player](../original-movie-input-player.md). Reproducers require a separately authorized local executable with the recorded hash; the included text can be reviewed and committed without that executable.
