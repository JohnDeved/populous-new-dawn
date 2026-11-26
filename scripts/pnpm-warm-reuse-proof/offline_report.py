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

# Stable public pnpm diagnostic tokens only, never arbitrary log substrings.
KNOWN_PNPM_ERRORS = frozenset({
    'ERR_PNPM_NO_OFFLINE_META',
    'ERR_PNPM_NO_OFFLINE_TARBALL',
    'ERR_PNPM_TARBALL_INTEGRITY',
    'ERR_PNPM_OUTDATED_LOCKFILE',
    'ERR_PNPM_FROZEN_LOCKFILE_WITH_OUTDATED_LOCKFILE',
    'ERR_PNPM_LOCKFILE_CONFIG_MISMATCH',
    'ERR_PNPM_UNEXPECTED_STORE',
})
HEADER_SPACE = rb'(?:[ \t]|\xe2\x80[\x89\xaf]|\xc2\xa0)'
HEADER_COLOR = rb'(?:\x1b\[[0-9;]{1,16}m)'
ERROR_HEADER = re.compile(rb'^'+HEADER_SPACE+rb'{0,4}'+HEADER_COLOR+rb'{0,2}'
                          rb'(ERR_PNPM_[A-Z0-9_]{1,80})'+HEADER_COLOR+rb'{0,2}'
                          rb'(?=$|'+HEADER_SPACE+rb')')
SCAN_STATES = frozenset({'matched', 'no-allowlisted-code', 'unavailable', 'not-pnpm-stage'})


def installer_exit_evidence(log, returncode, pnpm_stage):
    """Reduce one bounded private log to allowed labels and an ordinary exit code."""
    import os
    import stat

    number = returncode if type(returncode) is int and 1 <= returncode <= 255 else None
    result={'exitStatus':number,'pnpmCodes':[],'pnpmCodeObservation':'not-pnpm-stage'}
    if not pnpm_stage:
        return result
    result['pnpmCodeObservation']='unavailable'
    try:
        with os.fdopen(os.open(log, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK), 'rb') as stream:
            if not stat.S_ISREG(os.fstat(stream.fileno()).st_mode):
                return result
            raw=stream.read(LIMIT+1)
    except OSError:
        return result
    if len(raw)>LIMIT:
        return result
    codes=set()
    for line in raw.split(b'\n'):
        m=ERROR_HEADER.match(line.rstrip(b'\r'))
        if m:
            code=m.group(1).decode('ascii')
            if code in KNOWN_PNPM_ERRORS:
                codes.add(code)
    result.update(pnpmCodes=sorted(codes),pnpmCodeObservation='matched' if codes else 'no-allowlisted-code')
    return result
