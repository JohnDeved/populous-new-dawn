#!/usr/bin/env python3
"""Portable material policy adapter; no execution entry point is enabled.

Reuse shared_execution.Limits/OwnerWatch/run_payload/finish_observer for eventual
execution. This module supplies strict admission and terminal evidence policy;
it is NOT a second process supervisor, nor evidence of a hosted browser run.
"""
from dataclasses import asdict
import hashlib
import math
from pathlib import Path
import stat

REVISION = '977bf3026e429f7edd6187c16427913357224f7d'
TREE = 'c17cce4f10b9f4407d22c9266254e6cbb524a8f3'
BROWSER_VERSION = '154.0.8037.92'
BROWSER_SHA256 = '7c141b276aacc74fe51f06986345fb0dbce0e3756413746fb18541b878c17706'
CONTRACT_SHA256 = 'bb5e9afe155a587dd8aff1d7db2c96868da047c389c2dfc803be456e569c435a'
ARCHIVE_SHA256 = '636aa5c79f2693632e9921b8bbb050038ba11672e02346c06c20f991aed096f9'
OPENING_MEMORY = 5100273664
LIMITS = dict(owner_rss_bytes=2147483648, v8_mib=768, producer_seconds=210,
              envelope_seconds=240, raw_bytes=16777216, outer_raw_bytes=1048576,
              evidence_bytes=134217728, allocation_bytes=1073741824,
              reserve_bytes=2147483648, available_memory_bytes=2147483648,
              free_inodes=32768, cleanup_seconds=5, sample_seconds=0.1)
FROZEN_PINS = {'probe.mjs': 'f18743101f39485662be279ef40597a9473a205f755bbcd3938253a70dc70469', 'observer.mjs': '08c58009394e49a41d1057f5b7e382246271eeb1b1fdafdf2b53031de0b9b0df', 'contract.mjs': 'bb5e9afe155a587dd8aff1d7db2c96868da047c389c2dfc803be456e569c435a', 'source-inputs.json': 'ad82dfae18b914bd2e40dc0457ba0a1a92e19f89166dd8fd609a0ab8fdbdb906'}
SCREENSHOTS = ('prepared-removal.png', 'prepared-transition.png', 'replacement.png')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def finite(value, label):
    require(type(value) in (int, float) and math.isfinite(value) and value >= 0,
            'Invalid nonnegative measurement: ' + label)
    return value


def material_limits(shared_execution):
    """Use the merged primitive's validated class without monkeypatching it."""
    limits = shared_execution.Limits(**LIMITS)
    require(asdict(limits) == LIMITS, 'Maintained limits drift')
    return limits


def physical(path):
    path = Path(path)
    require(path.is_absolute() and '..' not in path.parts, 'Absolute physical path required')
    for item in reversed((path, *path.parents)):
        require(not item.is_symlink(), 'Symlink path component: ' + str(item))
    return path


def sha256_file(path):
    path = physical(path)
    info = path.lstat()
    require(stat.S_ISREG(info.st_mode), 'Regular file required')
    with path.open('rb') as stream:
        result = hashlib.file_digest(stream, 'sha256').hexdigest()
    after = path.lstat()
    require((info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns, info.st_ctime_ns) ==
            (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns),
            'File changed while hashing')
    return result


def verify_frozen_files(root, pins):
    root = physical(root)
    require(pins == FROZEN_PINS, 'Frozen pins themselves differ')
    require(set(pins) == {'probe.mjs', 'observer.mjs', 'contract.mjs', 'source-inputs.json'},
            'Frozen module inventory differs')
    for name, expected in pins.items():
        require(sha256_file(root / name) == expected, 'Frozen module hash differs: ' + name)


def check_admission(snapshot, source, browser):
    require(source == {'commit': REVISION, 'tree': TREE, 'status': '', 'untracked': []},
            'Exact clean candidate identity required')
    require(browser == {'version': BROWSER_VERSION, 'sha256': BROWSER_SHA256,
                        'archiveSha256': ARCHIVE_SHA256, 'sandbox': True},
            'Pinned sandboxed browser required')
    for key, minimum in [('MemAvailable', OPENING_MEMORY),
                         ('availableBytes', LIMITS['reserve_bytes'] + LIMITS['allocation_bytes']),
                         ('freeInodes', LIMITS['free_inodes'])]:
        require(finite(snapshot[key], key) >= minimum, 'Insufficient opening ' + key)


def harness_command(node, game, scenario, output, browser):
    """Only existing harness CLI, never Chrome flags or shell interpolation."""
    paths = [physical(value) for value in (node, game, scenario, output, browser)]
    node, game, scenario, output, browser = map(str, paths)
    return [node, str(Path(game) / 'scripts/local-render/harness.mjs'), '--game-root', game,
            '--scenario', scenario, '--output', output, '--browser', browser,
            '--port', '4198', '--timeout', '180000']


def verify_raw_budget(lengths):
    """Include transport, server, wrangler, and every source-admission log."""
    require(type(lengths) is dict and bool(lengths), 'Complete raw inventory required')
    for name, value in lengths.items():
        require(type(name) is str and name and type(value) is int and value >= 0,
                'Invalid raw entry')
    require(sum(lengths.values()) <= LIMITS['raw_bytes'], 'Combined raw cap exceeded')


def validate_terminal(receipt, browser_path):
    """Fail-closed second gate after maintained observer join/seal.

The caller must authenticate this data from actual sealed artifacts. This
validator cannot turn user-supplied JSON, screenshots, or acknowledgements into
runtime proof. No executable caller currently exists.
"""
    require(receipt['observerJoined'] is True, 'Observer join required')
    resource = receipt['resources']
    require(resource['failure'] is None and resource['unexpectedFailure'] is None,
            'Observer failed')
    require(type(resource['sampleCount']) is int and resource['sampleCount'] > 0,
            'No resource samples')
    require(finite(resource['sampledPeakOwnerRssBytes'], 'RSS') <= LIMITS['owner_rss_bytes'],
            'Owner RSS exceeded')
    require(receipt['survivors'] == [], 'Cleanup unknown or survivors')
    payload = receipt['payload']
    require(payload['exitCode'] == 0 and payload['stopReason'] is None and
            payload['failure'] is None and payload['cleanupFailure'] is None,
            'Payload failed or unknown')
    require(receipt['sourceBefore'] == receipt['sourceAfter'], 'Source changed')
    check_admission(receipt['opening'], receipt['sourceBefore'], receipt['browser'])
    history = resource['history']
    require(any(str(browser_path) in row.get('executables', []) and
                row.get('positiveRss') is True for row in history),
            'Pinned browser not positively observed')
    for key, maximum in [('envelopeSeconds', 240), ('payloadSeconds', 210),
                         ('harnessSeconds', 180), ('browserLaunchSeconds', 30),
                         ('serverReadinessSeconds', 60), ('cleanupSeconds', 5)]:
        require(finite(receipt['timing'][key], key) <= maximum, 'Time budget exceeded: ' + key)
    verify_raw_budget(receipt['rawLengths'])
    final = receipt['finalBudget']
    for key, cap in [('evidenceBytes', LIMITS['evidence_bytes']),
                     ('allocatedBytes', LIMITS['allocation_bytes'])]:
        require(finite(final[key], key) + 65536 < cap, 'Final receipt reserve missing: ' + key)
    for key, minimum in [('MemAvailable', LIMITS['available_memory_bytes']),
                         ('availableBytes', LIMITS['reserve_bytes']),
                         ('freeInodes', LIMITS['free_inodes'])]:
        require(finite(final[key], key) >= minimum, 'Final reserve missing: ' + key)
    require(receipt['contractSha256'] == CONTRACT_SHA256 and
            receipt['contract'] == {'status': 'passed', 'moduleSha256': CONTRACT_SHA256},
            'Unchanged contract validation required')
    require(tuple(receipt['screenshots']) == SCREENSHOTS, 'Actual screenshot inventory differs')
    for row in receipt['screenshots'].values():
        require(row['verifiedPng'] is True and type(row['bytes']) is int and row['bytes'] > 8 and
                type(row['sha256']) is str and len(row['sha256']) == 64,
                'Screenshot file proof required')
    require(receipt['rendering']['webglVersion'].startswith('WebGL 2.0'), 'WebGL provenance missing')
    return {'status': 'passed-pending-independent-rendered-review',
            'claim': 'Controlled material lifecycle only; no permanent RAM claim'}


def execute(*_args, **_kwargs):
    raise RuntimeError('Hosted execution is disabled pending reviewed mounted input admission, '
                       'qualified namespace/pidfd backend and sealed artifact integration')
