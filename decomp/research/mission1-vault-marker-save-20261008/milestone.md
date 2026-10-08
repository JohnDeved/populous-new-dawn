# Mission 1 Vault artwork and Save/Load milestone

Issue23 / draft PR269. This is partial evidence from ordinary06, which ended **failed** at the immediate Vault command33 recipient assertion. Gift acquisition, six-visit hiding,82-visit unlock and home-island construction remain incomplete.

The ordinary route earned Land Bridge, crossed it with the original Shaman, made one short ordinary approach and cast one genuine Blast. It then rendered the Warrior Training Hut knowledge marker as HFX1077 with its bank-c glow. The retained images show the marker before saving and after a public reload and Load Game:

- `camp-marker-before-save.png`: visible HFX1077 body and glow1419 at turn946.
- `camp-marker-after-load.png`: visible HFX1077 body and glow1425 at turn984.

At turn946, public Save checkpoint committed a nonzero glow cursor (`f1=12`, `displayedFrame=2`), one completed bridge and the original Shaman30 at100HP. The saved snapshot exactly matched the synchronous store replacement captured during public Load Game. This proves that same-browser-context reload/Load boundary. The two later screenshots have different camera views and advancing glow frames; they are not a pixel-equality comparison or a cross-process persistence claim.

Save/Load equality covers the bounded recorded Mission 1 snapshot, including the glow cursor, Bridge/land state and original Shaman. The full checkpoint digest identifies committed storage only; no full loaded-World digest comparison was performed.

The subsequent real Vault click was trusted, owned and acknowledged to Vault2. It delivered work2, uncancelled order14/model33/a2 and initial VaultTask phase0/entering=true. The helper incorrectly demanded phase>=1 immediately; the shipped task advances phase0 on its later simulation visit. This explains the recipient assertion, without establishing the later acquisition phases.

Product source:8348cad7ff47fd597bfbf84caa09135b24f339dd. Witness QA source:11e9b4ea2be8a5ee7de4479e35a12d8d13af81af. Exact source, raw receipt/report and PNG hashes, checkpoint identity hashes, and incomplete fields are retained in `evidence.json`. No raw archive, checkpoint payload or browser profile is included.
