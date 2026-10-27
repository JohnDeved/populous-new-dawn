"""Pure, exact-byte shim rebasing. No I/O, subprocesses or migration authority."""
import hashlib
import re
from pathlib import PurePosixPath

MAX_SHIM_BYTES = 1024 * 1024
HASH = re.compile(r'[0-9a-f]{64}\Z')


def rebase_shim(body, *, relative_path, old_prefix, new_prefix,
                expected_offsets, source_sha256, result_sha256):
    """Replace only independently reviewed old-prefix byte occurrences.

    Caller must authenticate/freeze this entire specification before mutation.
    Returned bytes still require the normal exclusive-write and resource gates.
    Neither source nor destination paths are opened by this function.
    """
    if type(body) is not bytes or len(body) > MAX_SHIM_BYTES:
        raise ValueError('invalid or oversized shim bytes')
    if type(relative_path) is not str:
        raise ValueError('invalid relative shim path')
    path = PurePosixPath(relative_path)
    if (str(path) != relative_path or path.is_absolute()
            or '..' in path.parts or '\\' in relative_path or '\x00' in relative_path
            or '.bin' not in path.parts or path.parts[-1] == '.bin'):
        raise ValueError('noncanonical relative .bin file')
    if (type(old_prefix) is not bytes or type(new_prefix) is not bytes
            or not old_prefix or not new_prefix or old_prefix == new_prefix
            or b'\x00' in old_prefix or b'\x00' in new_prefix
            or len(old_prefix) > MAX_SHIM_BYTES or len(new_prefix) > MAX_SHIM_BYTES):
        raise ValueError('invalid prefixes')
    if any(type(x) is not str or not HASH.fullmatch(x) for x in (source_sha256, result_sha256)):
        raise ValueError('invalid expected hash')
    if hashlib.sha256(body).hexdigest() != source_sha256:
        raise ValueError('source hash mismatch')
    if type(expected_offsets) not in (list, tuple) or any(type(x) is not int or x < 0 for x in expected_offsets):
        raise ValueError('invalid expected offsets')
    actual = []
    start = 0
    while True:
        at = body.find(old_prefix, start)
        if at < 0:
            break
        actual.append(at)
        start = at + len(old_prefix)
    if actual != list(expected_offsets):
        raise ValueError('unexpected prefix occurrences')
    if new_prefix in body:
        raise ValueError('destination prefix already present')
    projected = len(body) + len(actual) * (len(new_prefix) - len(old_prefix))
    if projected > MAX_SHIM_BYTES:
        raise ValueError('rebased shim exceeds bound')
    chunks = []
    start = 0
    for at in actual:
        chunks.extend((body[start:at], new_prefix))
        start = at + len(old_prefix)
    chunks.append(body[start:])
    result = b''.join(chunks)
    if hashlib.sha256(result).hexdigest() != result_sha256:
        raise ValueError('result hash mismatch')
    return result
