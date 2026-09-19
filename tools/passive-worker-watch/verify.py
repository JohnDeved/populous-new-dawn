#!/usr/bin/env python3
"""Run the focused suite and write a fresh, internally consistent install receipt."""
from pathlib import Path
import argparse
import json
import sys
import time
import unittest

import watcher
import service


def test_fingerprints(source):
    return service.test_fingerprints(source)


def run_tests(source, receipt):
    started = time.time()
    runtime = watcher.fingerprints(source)
    tests = test_fingerprints(source)
    suite = unittest.defaultTestLoader.discover(str(source), pattern='test_watcher.py')
    discovered = suite.countTestCases()
    receipt.parent.mkdir(parents=True, exist_ok=True)
    log = receipt.with_suffix('.log')
    with log.open('w') as stream:
        result = unittest.TextTestRunner(stream=stream, verbosity=2).run(suite)
    finished = time.time()
    failures, errors, skipped = len(result.failures), len(result.errors), len(result.skipped)
    exceptional = len(result.expectedFailures) + len(result.unexpectedSuccesses)
    passed = result.testsRun - failures - errors - skipped - exceptional
    unchanged = runtime == watcher.fingerprints(source) and tests == test_fingerprints(source)
    success = (unchanged and discovered > 0 and result.testsRun == discovered == passed
               and result.wasSuccessful() and exceptional == 0)
    value = {'version': 1, 'kind': 'passive-watcher-tests', 'status': 'passed' if success else 'failed',
             'startedAt': started, 'finishedAt': finished, 'exitCode': 0 if success else 1,
             'testsDiscovered': discovered, 'testsRun': result.testsRun, 'testsPassed': passed,
             'failures': failures, 'errors': errors, 'skipped': skipped, 'exceptional': exceptional,
             'fingerprints': runtime, 'testFingerprints': tests, 'sourceUnchanged': unchanged,
             'command': [sys.executable, '-B', str(source / 'verify.py'), '--receipt', str(receipt)],
             'logSha256': watcher.sha(log)}
    watcher.atomic(receipt, value)
    print(json.dumps(value, sort_keys=True))
    return value['exitCode']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--receipt', required=True, type=Path)
    args = parser.parse_args()
    return run_tests(Path(__file__).resolve().parent, args.receipt.resolve())


if __name__ == '__main__':
    raise SystemExit(main())
