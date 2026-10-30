#!/usr/bin/env python3
"""Material command integration using unchanged maintained ownership primitives.

Consumes an independently prepared owned shared-runtime specification, not an
arbitrary hosted checkout. No adoption, installation, qualification or repair.
Default CLI is plan-only; --execute still requires exact reviewed spec pins.
"""
from dataclasses import asdict
import argparse
import importlib.util
import json
import os
from pathlib import Path
import socket
import sys
import time
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import controller as policy
import projection


def load_shared(reference):
    path=policy.physical(reference['path'])
    policy.require(policy.sha256_file(path)==reference['sha256'],'Maintained adapter differs')
    spec=importlib.util.spec_from_file_location('material_shared',path)
    module=importlib.util.module_from_spec(spec);sys.modules[spec.name]=module;spec.loader.exec_module(module)
    return module


def load_spec(path, expected):
    policy.require(policy.sha256_file(path)==expected,'Material spec differs')
    spec=json.loads(Path(path).read_bytes())
    policy.require(set(spec)=={'version','kind','sharedAdapter','tools','backend','projection','checkerInventory','frozenPins','browser'},'Unexpected material spec fields')
    policy.require(spec['version']==1 and spec['kind']=='material-lifecycle-execution','Wrong material spec')
    return spec


def raw_lengths(evidence):
    result={}
    for path in evidence.rglob('*'):
        if path.name.endswith(('.stdout','.stderr','.log')):
            policy.require(path.is_file() and not path.is_symlink(),'Raw log path replaced')
            result[str(path.relative_to(evidence))]=path.stat().st_size
    return result


def watch_type(shared):
    class MaterialWatch(shared.OwnerWatch):
        cleanup_started=None
        cleanup_elapsed=None
        def cleanup(self):
            if self.cleanup_started is None:self.cleanup_started=time.monotonic()
            # Never abandon survivor cleanup merely because acceptance time expired.
            return super().cleanup()
        def finish(self):
            try:return super().finish()
            finally:
                if self.cleanup_started is not None:
                    self.cleanup_elapsed=time.monotonic()-self.cleanup_started
                    policy.require(self.cleanup_elapsed<=5,'Aggregate cleanup exceeded original5s')
        def check(self):
            super().check()
            lengths=raw_lengths(self.evidence)
            if lengths:policy.verify_raw_budget(lengths)
    return MaterialWatch


def validate_artifacts(shared,evidence,browser,watch,result):
    policy.require(result['exitCode']==0 and result['stopReason'] is None and
                   result['cleanupFailure'] is None and result['survivors']==[], 'Material payload failed or unknown')
    output=evidence/'receipt/browser'
    receipt=json.loads((output/'receipt.json').read_bytes())
    report=json.loads((output/'material-lifecycle.json').read_bytes())
    verification=json.loads((output/'contract-verification.json').read_bytes())
    policy.require(receipt['status']=='passed' and receipt['browserVersion']==policy.BROWSER_VERSION,
                   'Harness receipt failed or browser differs')
    policy.require(receipt['source']['commit']==policy.REVISION and receipt['source']['tree']==policy.TREE and
                   receipt['source']['status']=='' and not receipt['source']['untracked'], 'Served source differs')
    policy.require(receipt['launch']==dict(executablePath=str(browser),headless=True,chromiumSandbox=True,
                   ignoreDefaultArgs=True,args=['--remote-debugging-pipe'],timeout=30000), 'Harness launch policy differs')
    policy.require(receipt['readiness']['timeoutMs']==60000,'Readiness limit differs')
    policy.require(verification['validation']['status']=='passed' and
                   verification['reportSha256']==policy.sha256_file(output/'material-lifecycle.json'),
                   'Contract result not bound to actual report')
    policy.require(tuple(verification['screenshots'])==policy.SCREENSHOTS,'Screenshot inventory differs')
    for name,row in verification['screenshots'].items():
        info=shared.file_identity(output/name,private=True)
        policy.require(info['sha256']==row['sha256'] and (output/name).stat().st_size==row['bytes'],
                       'Actual screenshot bytes changed')
    policy.require(report['browserVersion']==policy.BROWSER_VERSION and
                   report['rendering']['webglVersion'].startswith('WebGL 2.0') and
                   report['rendering']['contextLost'] is False,'WebGL/browser provenance missing')
    policy.require(any(str(browser) in row['executables'] and row['positiveRss'] for row in watch.report()['history']),
                   'Pinned browser not positively observed')
    comparison=json.loads((evidence/'receipt/source-comparison.json').read_bytes())
    policy.require(comparison['status']=='protected-source-identical' and
                   comparison['allSourceLeavesAndReadonlyAncestorsExact'] is True,
                   'Mounted source/dependency/state comparison failed')
    policy.verify_raw_budget(raw_lengths(evidence))
    return dict(contract=verification,screenshotReview='pending-independent-rendered-review',
                source=receipt['source'],browserVersion=receipt['browserVersion'],rendering=report['rendering'])


def execute(spec,evidence):
    shared=load_shared(spec['sharedAdapter']);limits=policy.material_limits(shared)
    evidence=policy.physical(evidence)
    policy.require(not os.path.lexists(evidence),'Fresh attempt required')
    started=time.monotonic()
    with shared.envelope(limits.envelope_seconds) as deadline:
        profile,before=projection.inputs(shared,spec)
        parent=policy.physical(profile['evidenceParent'])
        policy.require(evidence.parent==parent and parent.stat().st_uid==os.getuid(),'Evidence parent differs or unowned')
        protected=[*map(Path,before),*map(Path,spec['tools']['readonly']),HERE]
        policy.require(not any(evidence.is_relative_to(path) or path.is_relative_to(evidence) for path in protected),
                       'Evidence overlaps input before allocation')
        snapshot=shared.host_snapshot(parent);shared.assert_capacity(snapshot,limits,admission=True)
        policy.require(snapshot['MemAvailable']>=policy.OPENING_MEMORY,'Opening memory below original floor')
        shared.make_layout(evidence,stage='run')
        watch=watch_type(shared)(evidence,limits,started)
        after=result=outputs=None;error=None
        # Existing profile uses only read-only canonical data and fresh private
        # output leaves. No owned-root migration, adoption or shared lock mutation.
        try:
            shared.save_new(evidence/'inputs-before.json',before)
            shared.save_new(evidence/'admission.json',{'opening':snapshot,'limits':asdict(limits),'materialSpec':spec})
            with socket.socket() as port:port.bind(('127.0.0.1',4198))
            mounts=projection.mounts(shared,spec,profile,evidence)
            command=[spec['tools']['python'],'-I','-B',str(HERE/'payload.py'),
                     profile['sourceAdmission']['path'],profile['namespaceRuntime'],spec['tools']['node'],
                     spec['browser']['path'],str(evidence)]
            if profile.get('version') == 2:
                command += [spec['projection']['path'], spec['projection']['sha256'],
                            spec['sharedAdapter']['path'], spec['sharedAdapter']['sha256']]
            transport_spec={'tools':spec['tools'],'runtime':{'path':profile['namespaceRuntime']}}
            result=shared.run_payload(transport_spec,mounts,evidence,command,limits,watch,
                                     expected_exe=spec['tools']['python'])
            outputs=validate_artifacts(shared,evidence,Path(spec['browser']['path']),watch,result)
        except BaseException as failure:
            error=type(failure).__name__+': '+str(failure)
        finally:
            try:
                policy.require(not watch.survivors(),'Owned survivors before postcheck')
                policy.require(time.monotonic()<deadline-2,'No postcheck budget')
                after_profile,after=projection.inputs(shared,spec)
                policy.require(before==after and profile==after_profile,'Canonical projection changed')
                shared.save_new(evidence/'inputs-after.json',after)
                watch.check()
            except BaseException as failure:
                error=(error or '')+'; postcheck: '+str(failure)
            try:
                watch.cleanup();policy.require(not watch.survivors(),'Postcheck survivors')
                shared.finish_observer(watch)
            except BaseException as failure:
                error=(error or '')+'; joined observer/cleanup: '+str(failure)
            try:lengths=raw_lengths(evidence)
            except BaseException as failure:
                lengths=None;error=(error or '')+'; raw inventory: '+str(failure)
            terminal=dict(kind='material-lifecycle-execution',error=error,inputsBefore=before,inputsAfter=after,
                          payload=result,outputs=outputs,resources=watch.report(),rawLengths=lengths,
                          cleanupStartedMonotonic=watch.cleanup_started,cleanupElapsedSeconds=watch.cleanup_elapsed,
                          materialControllerSha256=policy.sha256_file(__file__),payloadAttempted=result is not None,
                          browserObserved=any(spec['browser']['path'] in row['executables'] and row['positiveRss']
                                              for row in watch.report()['history']),visualReview='pending',
                          claim='Controlled lifecycle only, not permanent resource resolution')
            try:shared.seal_receipt(evidence,terminal,limits,deadline)
            except BaseException as failure:
                error=(error or '')+'; seal: '+str(failure)
                try:shared.save_new(evidence/'seal-failed.json',{'status':'failed-or-unknown','error':error[:4000]})
                except BaseException:pass
        return {'status':'passed-pending-rendered-review' if error is None else 'failed-or-unknown','error':error,'evidence':str(evidence)}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--spec',required=True);parser.add_argument('--spec-sha256',required=True)
    parser.add_argument('--evidence',required=True);parser.add_argument('--execute',action='store_true')
    args=parser.parse_args();spec=load_spec(args.spec,args.spec_sha256)
    if not args.execute:
        print(json.dumps({'status':'plan-only','requirements':['accepted original projection profile and unchanged inventory','fresh exact backend qualification','independent source review']}));return 0
    result=execute(spec,args.evidence);print(json.dumps(result));return 0 if result['error'] is None else 2

if __name__=='__main__':raise SystemExit(main())
