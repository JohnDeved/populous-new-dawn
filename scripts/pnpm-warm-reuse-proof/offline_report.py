"""Fail-closed summary of the pinned pnpm append-only reporter, never disclose raw logs."""
import hashlib
import re

LIMIT = 4 * 1024 * 1024
PROGRESS = re.compile(
    rb"^Progress: resolved ([0-9]{1,12}), reused ([0-9]{1,12}), downloaded "
    rb"([0-9]{1,12}), added ([0-9]{1,12})(, done)?$"
)


def install_log(path, offline):
    with path.open("rb") as stream:
        raw = stream.read(LIMIT + 1)
    if len(raw) > LIMIT:
        raise ValueError("pnpm output exceeds receipt bound")
    receipt = {"logSha256": hashlib.sha256(raw).hexdigest()}
    if not offline:
        return receipt
    rows = []
    for line in raw.splitlines():
        if not line.startswith(b"Progress:"):
            continue
        match = PROGRESS.fullmatch(line)
        if match is None:
            raise ValueError("offline pnpm reporter format unrecognized")
        resolved, reused, downloaded, added = map(int, match.groups()[:4])
        if downloaded:
            raise ValueError("offline pnpm reporter recorded a download")
        rows.append((resolved, reused, downloaded, added, match.group(5) is not None))
    if not rows or not rows[-1][4] or any(row[4] for row in rows[:-1]):
        raise ValueError("offline pnpm reporter lacks a unique final progress row")
    resolved, reused, downloaded, added, _ = rows[-1]
    if not (resolved > 0 and reused > 0 and added > 0):
        raise ValueError("offline pnpm reporter did not demonstrate nonzero reuse")
    receipt["pnpmReportedProgress"] = {
        "resolved": resolved, "reused": reused, "downloaded": downloaded,
        "added": added, "progressRows": len(rows),
        "scope": "pnpm append-only reporter counts, not network telemetry",
    }
    return receipt
