# Inactive, environment-specific controller proposal. No invocation until review/admission.
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

BASE = Path(__file__).resolve().parent
NODE = Path('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node')
NODE_SHA = '61ab14cd750fc24d5db53490ec5fc40f756e4b6e136b78cf7004265471d9bd1d'
BLOBS = {
    'supervisor-kernel-cases.mjs': '8c1ed4c341e0377e381f4d53bdcc6d63fcbbed11',
    'supervise-observed.mjs': '1a805b93bb71c4cfbc32373b68bd0720832653e1',
    'group-exit-observer.mjs': 'e733b000838233be323f0b2685ccf35d4e122b95',
}
def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as file:
        for block in iter(lambda: file.read(1048576), b''):
            digest.update(block)
    return digest.hexdigest()
def inputs():
    result = {}
    for name, expected in BLOBS.items():
        data = (BASE / name).read_bytes()
        actual = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        if actual != expected:
            raise RuntimeError('Source identity mismatch: ' + name)
        result[name] = hashlib.sha256(data).hexdigest()
    if sha(NODE) != NODE_SHA:
        raise RuntimeError('Unqualified Node executable')
    result['node'] = NODE_SHA
    return result
def identity(pid):
    raw = Path('/proc/' + str(pid) + '/stat').read_text()
    fields = raw[raw.rfind(')') + 2:].split()
    return dict(pid=pid, ppid=int(fields[1]), pgrp=int(fields[2]), session=int(fields[3]), starttime=fields[19])
def presence(pgid):
    if not isinstance(pgid, int) or isinstance(pgid, bool) or pgid <= 1:
        return 'invalid'
    try:
        os.kill(-pgid, 0)  # Read-only, never a destructive numeric-group signal.
        return 'present'
    except ProcessLookupError:
        return 'absent'
    except PermissionError:
        return 'unverified'

def main():
    if len(sys.argv) != 3 or sys.argv[1] != '--admitted-owned-supervisor-kernel-cases':
        raise RuntimeError('Explicit admitted invocation required; marker alone is not authorization')
    output = Path(sys.argv[2])
    if not output.is_absolute():
        raise RuntimeError('Absolute exclusive output required')
    output.mkdir()
    (output / 'home').mkdir()
    (output / 'tmp').mkdir()
    before = inputs()  # Complete validation before any child creation.
    script = 'import { runSupervisorKernelCases } from ' + json.dumps((BASE / 'supervisor-kernel-cases.mjs').as_uri())
    script += '; await runSupervisorKernelCases({output:' + json.dumps(str(output / 'probe'))
    script += ',admission:"observed-supervisor-two-owned-children-v1"});'
    command = [str(NODE), '--max-old-space-size=128', '--input-type=module', '-e', script]
    report = dict(status='running', sourceRef='a28a7938165aa896604893a9fad91e4bfc6eed55',
                  inputsBefore=before, command=command, interventions=[], scope='Two direct-child cases only')
    def save():
        (output / 'controller-result.json').write_text(json.dumps(report, indent=2) + '\n')
    save()
    child = None
    started = time.monotonic()
    primary = None
    cleanup_attempted = False
    def finish_owned_parent():
        nonlocal cleanup_attempted
        # Popen methods target only our direct unreaped child, never its numeric group.
        if child is None or child.poll() is not None or cleanup_attempted:
            return
        cleanup_attempted = True
        report['interventions'].append('direct-parent-SIGTERM')
        child.terminate()
        try:
            child.wait(timeout=2)
        except subprocess.TimeoutExpired:
            report['interventions'].append('direct-parent-SIGKILL')
            child.kill()
            child.wait(timeout=2)
    try:
        with (output / 'stdout.log').open('xb') as stdout, (output / 'stderr.log').open('xb') as stderr:
            child = subprocess.Popen(command, cwd=BASE, start_new_session=True, stdin=subprocess.DEVNULL,
                stdout=stdout, stderr=stderr, env={'PATH': '/usr/bin:/bin',
                'HOME': str(output / 'home'), 'TMPDIR': str(output / 'tmp'),
                'NODE_OPTIONS': '', 'NODE_PATH': '', 'NODE_COMPILE_CACHE': '', 'NODE_V8_COVERAGE': ''})
            report['parentIdentity'] = identity(child.pid)
            owner = report['parentIdentity']
            if owner['ppid'] != os.getpid() or owner['pgrp'] != child.pid or owner['session'] != child.pid:
                raise RuntimeError('Parent ownership binding failed')
            save()
            try:
                report['exit'] = child.wait(timeout=10)
            except subprocess.TimeoutExpired:
                report['timeout'] = True
                finish_owned_parent()
                report['exit'] = child.returncode
                raise RuntimeError('Parent deadline exceeded; pilot descendant cleanup remains unverified')
        if report['exit'] != 0:
            raise RuntimeError('Pilot parent failed')
        result_path = output / 'probe' / 'result.json'
        if result_path.stat().st_size > 1048576:
            raise RuntimeError('Probe receipt exceeds size budget')
        probe = json.loads(result_path.read_text())
        report['probeResult'] = probe
        if probe.get('status') != 'passed' or not probe.get('inputsUnchanged'):
            raise RuntimeError('Probe did not verify both cases')
        if [case.get('name') for case in probe.get('cases', [])] != ['normal', 'deadline']:
            raise RuntimeError('Missing fixed case receipts')
        report['postExitGroupObservations'] = []
        for case in probe['cases']:
            pgid = case['result']['groupCleanup']['pgid']
            observed = presence(pgid)
            report['postExitGroupObservations'].append(dict(pgid=pgid, status=observed))
            if observed != 'absent':
                raise RuntimeError('Child group absence not observed after parent exit')
        if report['interventions']:
            raise RuntimeError('Controller intervention is never acceptance')
        report['status'] = 'passed'
    except BaseException as error:
        primary = error
        report['status'] = 'failed'
        report['error'] = repr(error)
    finally:
        try:
            finish_owned_parent()
        except BaseException as error:
            report['parentCleanupError'] = repr(error)
            report['status'] = 'failed'
            if primary is None:
                primary = error
        report['elapsedSeconds'] = time.monotonic() - started
        report['parentReaped'] = child is None or child.poll() is not None
        try:
            report['inputsAfter'] = inputs()
            report['inputsUnchanged'] = before == report['inputsAfter']
            report['streams'] = {name: dict(bytes=(output / name).stat().st_size, sha256=sha(output / name))
                                 for name in ['stdout.log', 'stderr.log'] if (output / name).exists()}
            if not report['inputsUnchanged'] or not report['parentReaped'] or report['interventions']:
                report['status'] = 'failed'
            save()
        except BaseException as error:
            report['receiptError'] = repr(error)
            report['status'] = 'failed'
            if primary is None:
                primary = error
            try:
                save()
            except BaseException:
                pass
    if primary is not None:
        raise primary
    if report['status'] != 'passed':
        raise RuntimeError('Controller result failed')

if __name__ == '__main__':
    main()
