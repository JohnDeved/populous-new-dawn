"""Deterministic same-host qualification review, reviewed independently as code.

Never accepts a runner label, producer status alone, copied old receipt, unknown
cleanup, changed closure or unsealed result. The output derives from reverified
actual sealed artifacts, not an input assertion that tests passed.
"""
import errno
import json
import os
from pathlib import Path
import controller as policy

CASES = {'readonly', 'rename', 'frozen', 'clock', 'escape', 'overflow', 'observer'}
LIMITS = dict(owner_rss_bytes=512*1024**2, v8_mib=768, producer_seconds=10, envelope_seconds=120,
    raw_bytes=4*1024**2, outer_raw_bytes=1024**2, evidence_bytes=16*1024**2, allocation_bytes=32*1024**2,
    reserve_bytes=2*1024**3, available_memory_bytes=policy.OPENING_MEMORY, free_inodes=32768,
    cleanup_seconds=5, sample_seconds=.1)


def reference(shared, path):
    path = Path(path)
    return {'path': str(path), 'sha256': shared.file_identity(path, private=True)['sha256']}


def verify_python_alias(shared, selected_tools, proof):
    alias = proof['pythonCommandAlias']
    interpreter = Path(selected_tools['python'])
    identity = shared.file_identity(interpreter)['key'][:2]
    policy.require(set(alias) == {'bareCommandExecuted','inode','path','readonly','readonlyMountFlags','writeDeniedErrno'},
                   'Exact Python command alias proof required')
    policy.require(alias['bareCommandExecuted'] is True and alias['readonly'] is True,
                   'Python command alias not executed/read-only')
    policy.require(alias['path'] == str(interpreter.with_name('python3')) and
                   type(alias['inode']) is list and len(alias['inode']) == 2 and
                   all(type(value) is int for value in alias['inode']) and alias['inode'] == identity,
                   'Python command alias path/interpreter inode differs')
    policy.require(type(alias['readonlyMountFlags']) is int and alias['readonlyMountFlags'] & os.ST_RDONLY and
                   type(alias['writeDeniedErrno']) is int and
                   alias['writeDeniedErrno'] in (errno.EROFS,errno.EACCES,errno.ETXTBSY),
                   'Python command alias lacks readonly mount/write-denial proof')


def review(shared, qualification, selected_tools, destination):
    terminal = shared.verify_sealed_receipt(qualification)
    root = policy.physical(qualification['terminal']['path']).parent
    destination = policy.physical(destination)
    policy.require(not destination.is_relative_to(root), 'Acceptance would mutate sealed evidence')
    adapter_sha = shared.file_identity(shared.__file__)['sha256']
    policy.require(terminal['kind'] == 'shared-execution-qualification' and terminal['error'] is None and
                   terminal['adapterSha256'] == adapter_sha and terminal['platform'] == 'linux' and
                   terminal['pnpmExecuted'] is False and terminal['applicationExecuted'] is False and
                   set(terminal['capabilities']) == set(shared.CAPABILITIES) and
                   set(terminal['cases']) == CASES, 'Incomplete exact qualification')
    policy.require(terminal['selectedBackend'] == {k: selected_tools[k] for k in ('python','bwrap')},
                   'Selected backend differs')
    policy.require(len(selected_tools['readonly']) == len(set(selected_tools['readonly'])) and
                   {name: shared.inventory_hash(Path(name)) for name in selected_tools['readonly']} == terminal['tools'],
                   'Qualified tool closure changed')
    policy.require(shared.tree_inventory(root.parent/'sentinels') == terminal['sentinelInputs'],
                   'Original protected sentinels changed')
    limits = terminal['limits']
    shared.Limits(**limits)
    policy.require(limits == LIMITS, 'Exact qualification limits differ')
    for name in sorted(CASES):
        result = terminal['cases'][name]['result']
        resources = terminal['cases'][name]['resources']
        # The sampler may retain the deliberately injected fault before joining.
        # Permit only that exact observer-case timing, never an unrelated failure.
        healthy = resources['failure'] is None and resources['failureMarker'] is None
        expected_fault = (name == 'observer' and
                          resources['failureMarker'] == shared.QUALIFIER_OBSERVER_FAULT and
                          resources['failure'] == 'Observer failure: QualificationObservationFault: '
                                                  'Injected persistent qualification observation failure')
        policy.require(resources['sampleCount'] > 0 and 0 < resources['sampledPeakOwnerRssBytes'] <= limits['owner_rss_bytes'] and
                       (healthy or expected_fault) and resources['unexpectedFailure'] is None,
                       'Missing or failed joined resource evidence: '+name)
        policy.require(result['gateBinding'] is not None and result['gateBinding'] == resources['gateBinding'],
                       'Namespace binding missing: '+name)
        gate = result['gateBinding']
        policy.require(any(row['pid'] == gate['hostPid'] and row['startTicks'] == gate['startTicks'] and
                           gate['pidNamespace'] in row['namespaces'] and row['positiveRss'] and
                           selected_tools['python'] in row['executables'] for row in resources['history']),
                       'No positive qualified gate observation: '+name)
        if name == 'observer':
            shared.require_qualifier_observer_failure(result)
            proof = json.loads((root/name/'independent-cleanup-proof.json').read_bytes())
            policy.require(proof == {'injectedFault':shared.QUALIFIER_OBSERVER_FAULT,
                            'knownLiveSurvivors':[], 'payloadOutcomeRetained':'failed-or-unknown',
                            'payloadWasNotRelabeled':True}, 'Observer fault cleanup proof differs')
        else:
            policy.require(result['survivors'] == [] and result['cleanupFailure'] is None, 'Cleanup failed or unknown: '+name)
            if name == 'overflow':
                policy.require(result['failure'] == {'type':'ValueError', 'message':'Outer raw output hard byte cap exceeded', 'injectedFault':None} and
                               result['stopReason'] == 'ValueError: Outer raw output hard byte cap exceeded' and result['storedRawBytes'] == limits['outer_raw_bytes'] and
                               result['observedRawBytes'] > limits['outer_raw_bytes'], 'Overflow was not observed/bounded')
            else:
                policy.require(result['exitCode'] == 0 and result['stopReason'] is None and result['failure'] is None,
                               'Generated qualifier case failed: '+name)
        if name in ('readonly','frozen'):
            proof = json.loads((root/name/'control/result.json').read_bytes())
            verify_python_alias(shared, selected_tools, proof)
            policy.require(proof['preparationHostAliasAbsent'] is True and
                           proof['allVisibleProcRootAliasesChecked'] is True and len(proof['deniedPaths']) >= 5,
                           'Missing actual read-only alias coverage')
            sentinel = str(root.parent/'sentinels'/'sentinel')
            processes = proof['visiblePrivateProcesses']
            expected = {str(root.parent/'sentinels'/leaf) for leaf in ('sentinel','alias','link')}
            policy.require(set(processes) == {'1', str(gate['namespacePid'])}, 'Private proc coverage differs')
            for pid, row in processes.items():
                policy.require(pid.isdecimal() and row['pid'] == int(pid) and
                               row['pidNamespace'] == gate['pidNamespace'] and row['nspid'] == [int(pid)] and
                               row['ppid'] == (0 if pid == '1' else 1) and
                               row['startTicks'] == (gate['initStartTicks'] if pid == '1' else gate['startTicks']),
                               'Foreign/reused private process')
                expected.add('/proc/'+pid+'/root'+sentinel)
            if name == 'frozen':
                expected.add('/pnd-fixture/node_modules/'+shared.STATE)
            policy.require(set(proof['deniedPaths']) == expected, 'Read-only alias denial inventory differs')
            if name == 'frozen':
                policy.require('/pnd-fixture/node_modules/'+shared.STATE in proof['deniedPaths'],
                               'Frozen state write denial missing')
        if name == 'rename':
            proof = json.loads((root/name/'control/result.json').read_bytes())
            path = root/name/'modules-root'/shared.STATE
            policy.require(proof['fixtureOnlyNotPnpm'] is True and
                           proof['state'] == shared.file_identity(path, private=True), 'Renamed state proof changed')
        if name == 'clock':
            policy.require(result['producer']['clock'] == 'CLOCK_BOOTTIME' and
                           result['producer']['durationUpperBoundSeconds'] < 1 < result['wallSeconds'],
                           'Producer/envelope clocks not distinguished')
        if name == 'escape':
            policy.require(any(row['pid'] != gate['hostPid'] and gate['hostPid'] in row['parents'] and
                               row['pid'] in row['sessions'] and row['positiveRss'] for row in resources['history']),
                           'Escaped-session descendant not positively observed')
    # Reverify all bytes/inodes after reading the constituent evidence.
    policy.require(shared.verify_sealed_receipt(qualification) == terminal, 'Qualification changed during review')
    value = {'version':shared.VERSION, 'kind':'shared-execution-backend-acceptance', 'status':'accepted',
             'adapterSha256':adapter_sha, 'platform':'linux', 'capabilities':list(shared.CAPABILITIES),
             'qualification':qualification,
             'scope':'Actual same-host generated containment, independently reviewed deterministic verifier; not browser acceptance',
             'verifierSha256':policy.sha256_file(__file__)}
    shared.save_new(Path(destination), value)
    accepted = reference(shared, destination)
    shared.backend_qualification(accepted, selected_tools)
    return accepted
