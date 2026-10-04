# Recover a cloud development workspace

Run `scripts/cloud-bootstrap.py` from a reviewed checkout after a Linux cloud reset.
The recipe lives in Git; disposable paths are recreated, not promised permanent.
It does not configure a service, scheduled job, paid environment, or GitHub Actions.
A cloud environment's existing startup command can invoke this same entry point.

## Start or resume

Host requirements: Linux x86_64, Python 3.12 with `venv`, Git, curl, Node >=22.13.0,
npm, and the ordinary shared libraries needed by Chrome/Java. Node 24.19.0 and
Python 3.12.14 are the recovered baseline. Host runtimes and OS packages are not
installed by this script. A first recovery needs network access to GitHub, npm,
PyPI, the pinned vendor downloads, and the already-approved game archive.

Choose a new writable directory **outside every Node package** (no ancestor
`package.json`). Keep a reviewed checkout or fetch it normally with existing Git
access, then run:

```sh
python3 scripts/cloud-bootstrap.py --root "$HOME/pnd-cloud" --ref main
```

The JSON result names a unique receipt and `env.sh`. Source that exact file, then
use `$POPULOUS_REPOSITORY`. Re-running reuses verified installed inputs and the
same clean worktree. A different main commit gets a new worktree; it never resets
an existing branch. Use `--ref <full-commit-sha> --worktree <name>` for a frozen
candidate. Writable dependencies remain private at that worktree's literal
`node_modules` path. `TMPDIR` is a private sibling outside its ESM package scope.
Do not use this recipe to share writable dependencies or start competing heavy jobs.

When the previous tools/archive cache still exists, reuse it rather than copying
or downloading it again:

```sh
python3 scripts/cloud-bootstrap.py --root "$HOME/pnd-recovered" \
  --reuse-prerequisites "$EXISTING_PREREQUISITES" \
  --cache "$EXISTING_PREREQUISITES" --prerequisites-only --offline
```

`--prerequisites-only` verifies tools/input without cloning/installing a worktree.
`--offline` prevents downloads, git fetches and the online GitHub-auth check;
it does not invent absent caches. For a full offline recovery the managed bare
repository, npm cache, and Python packages must already exist. `--cache` is
repeatable and read-only; it accepts original archive names or hash-prefixed names,
and Python distributions in the directory or its `python/` child.

## What is pinned and checked

- `cloud-bootstrap.json` records the actual 2026-10-04 recovery URLs, archive
  SHA-256s, versions and complete extracted-tree fingerprints. It selects the base
  game's `Component0`, verifies all 1,210 extracted files as one tree, and checks
  the original EXE's canonical SHA-256. No installer or complete EXE is launched.
- Ghidra 12.1.3, Linux Temurin 21.0.12.1+1, and Chrome Headless Shell 154.0.8037.92
  are fixed downloads. An archive/tree mismatch fails closed; no new release,
  alternate build, or silently changed download is accepted.
- Python locks contain the restored versions, including Unicorn 2.1.4, Capstone
  5.0.7 and binary-refinery 0.10.11, with official PyPI release hashes. The pinned binary dependency closure
  is installed first because refinery imports its runtime during source metadata generation. Package installation uses `--require-hashes`, `--no-deps`
  and `--no-build-isolation`; `pip check` and actual imports validate the closure.
  An explicitly supplied existing venv is trusted local executable code: its
  package versions/imports are checked, but its provenance is **not** retroactively
  certified by download hashes. New environments use the hash-locked path.
- `npm ci` uses the chosen revision's committed lockfile and integrity hashes.
  No writable `node_modules` copy or symlink is adopted. A reused worktree must
  retain its recorded commit/lock, dependencies and clean tracked/untracked state.
- Java and Chrome are invoked only for versions; the Ghidra launcher/tree is
  checked. Native `decomp.py check` verifies the EXE, exports and native tables
  in a full workspace recovery. This is not Ghidra project initialization or a
  rendered gameplay check. Follow the usual coordinated native/browser checks
  before claiming those capabilities or hardware performance.

## Failures, authentication and evidence

One filesystem lock serializes this recipe per root. It never infers an old job
stopped from missing PIDs and never clears queue locks or analysis projects.
An unowned/nonempty root, changed worktree, corrupt cache/tree, or missing offline
input is preserved and reported. Use a fresh root/worktree when ownership is
uncertain; do not clean or overwrite another task's files.

Downloads resume their owned `.part` files and are renamed only after SHA-256
verification. Tool extraction is staged and only a verified complete tree is
published. Interrupted staging directories remain for diagnosis. Python venvs
keep their original paths so absolute console-script shebangs do not break; a
completed venv is published through a relative link. A failed/incomplete venv is
never adopted as complete. Review and manually remove only known-owned failed
staging after confirming no job uses it. A server that cannot resume a partial
fails visibly; the script does not erase it or redownload behind your back.

Authentication is a separate prerequisite for publishing. The recipe reports
`gh auth status` as available/absent/unreachable, never prints or saves its output,
and never copies config, creates tokens, backs up secrets, logs in, or tests write
permission by pushing. Use the shared approved GitHub login route if absent.
Read access can still suffice to recover the workspace. Never bundle credentials,
browser profiles, environment dumps or session data with recovery evidence.

Each attempt gets immutable-named command stdout/stderr, input fingerprints,
exit results, a terminal result (or retained unknown result on interruption), and
its own environment file under `receipts/`. Old receipts/native projects are not
rewritten. These local files may also disappear on a complete executor reset:
push original source commits frequently, retain source-bound native findings in
Git, and publish bounded redacted review bundles/Git bundles through the existing
[handoff process](worker-handoff.md). Recovered prerequisites do not recover
uncommitted work, ignored evidence, saves, or old Ghidra projects.

## Regression coverage

`node --test tests/cloud-bootstrap.test.mjs` runs isolated Python fixtures for
hash rejection, unsafe archives/links, cache reuse, partial resumption, atomic
publication, ownership/locking, failure receipts, safe environment quoting, and an
actual tiny Git clone/worktree plus npm install/reuse. It uses no real vendor or
game downloads. Live validation results, exact commits and remaining cold-path
limits belong in the PR/evidence receipt; these fixtures alone do not prove a
complete network recovery or browser launch.
