# Native environment setup

Run this recovery automatically when native research needs missing inputs or tools.
The user authorized downloading the original archive and preparing this environment.
Inspect the current executor and network policy first. Reuse verified local files;
an unset variable or absent historical path is not an external blocker. Do not run
the Windows installer. Keep downloads, game data, and Ghidra projects outside Git.

## Reuse an existing installation

From the repository root in Bash:

```bash
source /workspace/shared/populous-prerequisites/env.sh
test -x "$JAVA_HOME/bin/javac"
test -x "$GHIDRA_HOME/support/analyzeHeadless"
python -c 'import unicorn; from refinery.lib.inno.archive import InnoArchive; print(unicorn.__version__)'
python scripts/decomp.py check "$POPULOUS_EXE"
```

If anything is missing, complete the corresponding steps below. Inspect existing
`env.sh` before replacing it; preserve custom settings. Historical input locations
are listed in [native research](native-research.md). Search those and the current
workspace before downloading. A failed checksum must stop use of that file; preserve
it for diagnosis rather than silently replacing it.

## Share existing research data without copying it

Research checks accept an explicit executable or game-root argument. Reuse one
physical, verified extraction on persistent disk; do not copy it into each checkout
or replace tracked `public/original` assets. For selected inputs, the standard-library
helper creates only file symlinks beneath the checkout's ignored
`work/native-inputs/game`. Example from an owned checkout:

```sh
revision=$(git rev-parse HEAD)
game_root=/path/to/existing/verified/game
python3 -B scripts/orchestration/shared_native_inputs.py prepare \
  --checkout "$PWD" --revision "$revision" --source "$game_root" \
  --file d3dpoptb.exe --file data/pal0-c.dat
python3 -B scripts/orchestration/shared_native_inputs.py verify \
  --checkout "$PWD" --revision "$revision" --source "$game_root" \
  --file d3dpoptb.exe --file data/pal0-c.dat
export POPULOUS_EXE="$PWD/work/native-inputs/game/d3dpoptb.exe"
```

Select every adjacent file required by the actual reader with repeated `--file`.
The selected set must match on each invocation; changing it requires a separate owned
checkout or explicit review of the old links, not automatic pruning. This is a
partial research view, not a complete game installation. Missing members still need
scoped recovery from the existing verified archive. Unknown/unpinned files are refused.

Hashes come from the exact checkout commit's `decomp/tools.json`,
`public/original/provenance.json` and `scripts/authored-environment-inputs.json`.
The JSON result binds the selected bytes, source root, commit, provenance documents,
and retained archive/installer provenance. It does not re-verify an archive that was
not supplied. Save stdout outside the linked game tree when retaining a receipt.

Preparation preflights all selected bytes and existing paths before creating links;
it never replaces, deletes, downloads, executes, chmods or copies an input. Verification
is read-only and rejects wrong targets even when their bytes match, changed source
bytes, source/ancestor symlinks, tracked or nonignored destinations, and extra entries.
Keep source inputs immutable by ownership convention and serialize changes with all
consumers. Symlinks are not write protection or a concurrent-writer security sandbox.
Reverify immediately before and after a research check; keep its mutable outputs in
a separate private directory. A sharing receipt is not native execution, gameplay,
or full-check evidence. Existing historical links are left untouched.

Focused safety regression: `node --test tests/shared-native-inputs.test.mjs`.
No package installation, original binary execution, browser or build is needed.

## Fresh Linux x86-64 setup

Requires Bash, curl, Python 3 with venv, unzip, and tar. Check `uname -sm`; the JDK
below is Linux x86-64 only. Other architectures need their own verified JDK archive.
The macOS bootstrap in `scripts/decomp.py setup` is not a Linux installer.

```bash
set -euo pipefail
native_root=/workspace/shared/populous-prerequisites
mkdir -p "$native_root/downloads"

# Reuse downloads only after checking their identities. Download to a partial file
# and rename only after verification; a failed download cannot become a valid cache.
fetch_verified() {
  local url="$1" sha="$2" target="$3"
  if test -f "$target"; then
    printf '%s  %s\n' "$sha" "$target" | sha256sum -c -
    return
  fi
  curl --fail --location --retry 2 --max-time 300 -o "$target.part" "$url"
  printf '%s  %s\n' "$sha" "$target.part" | sha256sum -c -
  mv "$target.part" "$target"
}

fetch_verified \
  https://the-beginning.b-cdn.net/wp-content/downloads/other/PopulousTB-Setup.zip \
  6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702 \
  "$native_root/PopulousTB-Setup.zip"
fetch_verified \
  https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_12.1.3_build/ghidra_12.1.3_PUBLIC_20260817.zip \
  93a5d11a9ad510622acaaf908c556a7b9b764d338e78a7567f3689bf5081fd54 \
  "$native_root/downloads/ghidra.zip"
fetch_verified \
  https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.12.1%2B1/OpenJDK21U-jdk_x64_linux_hotspot_21.0.12.1_1.tar.gz \
  ce79869e1307ed8ee1e2baa86a412b1eb5b75d10a01006d788a6f968bcfaee94 \
  "$native_root/downloads/jdk-linux.tar.gz"

test -d "$native_root/ghidra_12.1.3_PUBLIC" || unzip -q "$native_root/downloads/ghidra.zip" -d "$native_root"
test -d "$native_root/jdk-21.0.12.1+1" || tar -xzf "$native_root/downloads/jdk-linux.tar.gz" -C "$native_root"
test -d "$native_root/venv" || python3 -m venv "$native_root/venv"
"$native_root/venv/bin/python" -m pip install \
  -r decomp/extraction-requirements.txt -r decomp/requirements.txt

# Component0 selects the base game; expansion destinations can conflict.
# The extractor rejects differing existing files and never launches the installer.
"$native_root/venv/bin/python" scripts/extract-reference.py --component Component0 \
  "$native_root/PopulousTB-Setup.zip" "$native_root/game" '*' \
  > "$native_root/extraction-$(date -u +%Y%m%dT%H%M%SZ).log"

# Create this file only if absent; merge these bindings into an existing file.
if ! test -f "$native_root/env.sh"; then
  cat > "$native_root/env.sh" <<'ENV'
export GHIDRA_HOME=/workspace/shared/populous-prerequisites/ghidra_12.1.3_PUBLIC
export JAVA_HOME=/workspace/shared/populous-prerequisites/jdk-21.0.12.1+1
export POPULOUS_EXE=/workspace/shared/populous-prerequisites/game/d3dpoptb.exe
export PATH="/workspace/shared/populous-prerequisites/venv/bin:$PATH"
ENV
fi
source "$native_root/env.sh"
"$JAVA_HOME/bin/javac" -version
python scripts/decomp.py check "$POPULOUS_EXE"
```

Ghidra requires a full JDK: `java -version` alone can pass with only a JRE installed.
Retain download URLs/checksums and extraction logs alongside the installation.
The game URL and identity originate in the retained
[startup-movie provenance](../decomp/research/original-startup-movies/provenance.json).
Ghidra identity is pinned in `decomp/tools.json`; its JDK entry is macOS-specific.
The Linux JDK checksum above is the Temurin release package checksum.

## Prove decompilation works

Source `env.sh` in each new shell; tool calls do not necessarily retain exports.
Reuse a verified existing project and serialize all access to it. If none exists,
initialize once from the repository root, then export one routine to ignored scratch:

```bash
source /workspace/shared/populous-prerequisites/env.sh
python scripts/decomp.py init "$POPULOUS_EXE"
python scripts/decomp.py export 00586074 --output work/native-setup/smoke
```

The default project is `work/decomp/projects/populous.gpr`. Do not re-import over an
existing project or mass-export to tracked files. The wrapper checks original bytes
and requires an export completion receipt. A launcher usage message alone proves
only that Java starts, not that decompilation succeeds. Preserve command logs and
the exact executable hash (`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`).

Only report a blocker after attempting the documented recovery and recording the
actual failure. Respect access denials; ask for missing input only if verified local
recovery and the documented source cannot supply it. Setup does not authorize asset
regeneration, parity recording, or launching the original game.
