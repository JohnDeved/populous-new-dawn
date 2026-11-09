# Native building normal icon identities

The eight building descriptors at d3dpoptb.exe VA 005cc458, stride 66 bytes, store the normal HFX icon at +37. Constructor 0044cb7f copies it to control +0x4f, consumed by renderer 0049d690. The executable SHA-256 is 3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f. Existing tests/fixtures/native-building-hud-layout.json retains the source bytes.

Ordered mapping: Hut 1028, Tower 1029, Camp 1030, Temple 1032, Spy Hut 1033, Firewarrior Hut 1031, Boat House 1034, Balloon Hut 1035. The former page incorrectly reused Tower for Temple and Camp for the final four buildings.

The separate 300x47 atlas preserves original pixels and native dimensions. public/original/building-icons-provenance.json binds its input, decoder, RGBA and PNG hashes. The extractor accepts an original game directory, the pinned existing import-original.py decoder, and a fresh absent output directory. It never executes the original executable or repacks the shared HUD atlas. Its generated metadata is copied into app/original-building-icons.json. Only the eight established HUD buildings are supported; the wider prison model type does not receive invented fallback art.

Six focused checks passed: descriptor mapping, exact page/roster/geometry preservation, absence of prison/state fallback, and three extraction refusal cases. Real extraction separately passed complete original RGBA comparison, including transparent gaps. The extracted atlas was inspected as an image. These are not application/browser fidelity checks.

Still pending: changed-file lint, exact-head Home build, and browser verification. Native building frames use families 794/812/803 rather than the current spell frames. Hover/selected/disabled/visibility mapping and integer placement need separate original-game proof. This normal-icon change does not resolve or claim those gates. Existing full-quality failures remain separate.

The descriptor fixture is carried separately from the original #760/#762 stack; the icon atlas and decoder provenance above are from #762 commit 647836c71a91bdbef39f34038b828076433a9647. This narrow port onto a4b481d5 does not import #760's geometry changes. The historical checks described above apply to that preservation commit, not by themselves to this port.
