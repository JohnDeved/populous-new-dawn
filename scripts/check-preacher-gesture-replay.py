#!/usr/bin/env python3
"""Replay the candidate port against accepted native rows, without native execution.

Usage: python -B scripts/check-preacher-gesture-replay.py NATIVE_RUN_DIR --output DIR
The original 63 cases, frame counts and native rows are immutable hash-pinned inputs.
Every state byte is compared. Known residuals require exact case/phase/field/value
matches; raw event differences remain visible beside declared adapter boundaries.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = {
    'native.json': 'bce40128163d945f90d56392c4fb8ecd21765f7e7ed3724b4ff5f90ac41c034d',
    'supplied-input.json': 'a708520a0297fad98a655670d11a8614bda45c8f5f2c6d39b5f65881e2aa3502',
    'frozen-manifest.json': '125acb5330e5487c7c5bd6438c13c2ec975ecb9d04538560ee9898d885b4a3b7',
}
TERMINAL = {'timer839-no-decision', 'timer839-turning-known-difference', 'timer839-active-final'}
sha = lambda data: hashlib.sha256(data).hexdigest()


def same(actual, expected, message):
    if json.dumps(actual, sort_keys=True) != json.dumps(expected, sort_keys=True):
        raise ValueError(message + ': ' + json.dumps({'actual': actual, 'expected': expected}))


def sources():
    pending = [ROOT/'scripts/preacher-gesture-replay.mjs', Path(__file__), ROOT/'app/original-units.json']
    found = {}
    while pending:
        path = pending.pop().resolve()
        if path in found:
            continue
        if not path.is_relative_to(ROOT):
            raise ValueError('Import leaves repository: ' + str(path))
        data = path.read_bytes()
        found[path] = sha(data)
        if path.suffix in ['.ts', '.mjs']:
            for specifier in re.findall(r"(?:from\s*|import\s*)['\"]([^'\"]+)['\"]", data.decode()):
                if specifier.startswith('.'):
                    pending.append(path.parent/specifier)
    return {str(path.relative_to(ROOT)): digest for path,digest in sorted(found.items())}


def snapshot_delta(native, port, case, phase, fields):
    same(sorted(port), sorted(native), 'Snapshot schema differs')
    same(sorted(port['fields']), sorted(native['fields']), 'Decoded field schema differs')
    field_delta = {key: [value,port['fields'][key]] for key,value in native['fields'].items()
                   if json.dumps(value) != json.dumps(port['fields'][key])}
    expected_fields = {}
    expected_other = {}
    if case in TERMINAL and phase != 'beforeController':
        expected_fields['flags2'] = [0x40200000, 0x200000]
        if case == 'timer839-turning-known-difference':
            expected_fields.update(assignment=[0,16], animationMode=[0,1])
            expected_other['simulationRandom'] = [4,3138912261]
    same(field_delta,expected_fields,f'{case}/{phase}: unexpected field differences')
    other = {key:[value,port[key]] for key,value in native.items() if key not in ['raw','fields']
             and json.dumps(value,sort_keys=True)!=json.dumps(port[key],sort_keys=True)}
    same(other,expected_other,f'{case}/{phase}: unexpected snapshot differences')
    native_bytes = bytes.fromhex(native['raw'])
    port_bytes = bytes.fromhex(port['raw'])
    same([len(native_bytes),len(port_bytes)],[256,256],'Supplied record width differs')
    expected_bytes = bytearray(native_bytes)
    for key,(_before,after) in expected_fields.items():
        offset,fmt=fields[key]
        struct.pack_into('<'+fmt,expected_bytes,offset,after)
    if bytes(expected_bytes)!=port_bytes:
        raise ValueError(f'{case}/{phase}: unexpected raw record bytes')
    return {'fields':field_delta,'other':other,
            'rawByteOffsets':[index for index,(a,b) in enumerate(zip(native_bytes,port_bytes)) if a!=b]}


def compare(native, port, fields):
    same(len(port['cases']),27,'Candidate case count differs')
    inventory=[]
    state_rows=0
    semantic_requests=0
    for original,candidate in zip(native['cases'],port['cases'],strict=True):
        case=original['case']
        same(candidate['case'],case,'Case order differs')
        for n,p in zip(original['rows'],candidate['rows'],strict=True):
            same([p['case'],p['visit']],[n['case'],n['visit']],'Visit identity differs')
            record={'case':case,'visit':n['visit'],'stateResiduals':{}}
            for phase in ['beforeController','afterController','beforeUpdater','afterUpdater']:
                delta=snapshot_delta(n[phase],p[phase],case,phase,fields)
                if any(delta.values()):record['stateResiduals'][phase]=delta
            expected_result=[0,1] if case=='command32-expiry-odd-known-difference' else [n['result'],n['result']]
            same([n['result'],p['result']],expected_result,'Unexpected completion return')
            if n['result']!=p['result']:record['returnResidual']=expected_result
            if record['stateResiduals'] or 'returnResidual' in record:state_rows+=1
            # Preserve the full raw event inventory. Two supplied native no-op
            # leaves and one known odd32 release are matched only at exact cells.
            native_events=[]
            native_adapter_events=[]
            for event in n['events']:
                if event['kind'] in ['reveal-check','registration']:
                    same(case,'acquire-after-decision-no-retroactive-cue','Unexpected extra native leaf')
                    native_adapter_events.append(event)
                else:native_events.append(event)
            if case=='acquire-after-decision-no-retroactive-cue':
                same([e['kind'] for e in native_adapter_events],['reveal-check','registration'],
                     'Positive acquisition leaf order differs')
            port_events=list(p['events'])
            if case=='command32-expiry-odd-known-difference':
                same(len(port_events),1,'Unexpected odd32 event count')
                event=port_events.pop()
                same([event['kind'],event['args']],['release',[0x2000000,3]],'Unexpected odd32 release')
                snapshot_delta(n['afterController'],event['state'],case,'odd32-release',fields)
            same(len(port_events),len(native_events),'Request sequence length differs: '+case)
            for ne,pe in zip(native_events,port_events,strict=True):
                kind='lower-setter' if pe['kind']=='lower-setter-intent' else pe['kind']
                same([pe['visit'],pe['phase'],kind,pe['args']],
                     [ne['visit'],ne['phase'],ne['kind'],ne['args']], 'Request/ordering differs: '+case)
                snapshot_delta(ne['state'],pe['state'],case,'event-'+ne['kind'],fields)
                semantic_requests+=1
            if n['events']!=p['events']:
                record['rawEventResiduals']={'native':n['events'],'port':p['events']}
            if record['stateResiduals'] or 'returnResidual' in record or 'rawEventResiduals' in record:
                inventory.append(record)
    same(sum(len(c['rows']) for c in port['cases']),63,'Candidate visit count differs')
    same(state_rows,4,'Known residual row set changed')
    return inventory,semantic_requests


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('native_run_dir',type=Path)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    output=args.output.resolve()
    if not output.is_relative_to(ROOT/'work/orchestration'):
        raise ValueError('Output must be in this checkout work/orchestration')
    output.mkdir(parents=True,exist_ok=False)
    inputs={name:(args.native_run_dir/name).read_bytes() for name in REFERENCE}
    for name,expected in REFERENCE.items():same(sha(inputs[name]),expected,'Accepted native input drift: '+name)
    native=json.loads(inputs['native.json']);payload=json.loads(inputs['supplied-input.json'])
    same(native['completedControllerCalls'],63,'Incomplete accepted native run')
    same(payload['frameCounts'],json.loads((ROOT/'app/original-units.json').read_text())['frameCounts'],
         'Candidate loaded counts differ')
    before=sources();node=shutil.which('node');node_hash=sha(Path(node).read_bytes())
    binding={'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
             'candidateSourceBefore':before,'nativeInputs':REFERENCE,'nodePath':node,'nodeSha256':node_hash,
             'caseCount':len(payload['cases']),'controllerPairs':sum(c['pairs'] for c in payload['cases'])}
    (output/'binding.json').write_text(json.dumps(binding,indent=2)+'\n')
    try:
        try:
            result=subprocess.run([node,str(ROOT/'scripts/preacher-gesture-replay.mjs')],
                input=json.dumps(payload).encode(),capture_output=True,cwd=ROOT,timeout=15)
        except subprocess.TimeoutExpired as error:
            (output/'port.stdout.json').write_bytes(error.stdout or b'')
            (output/'port.stderr.txt').write_bytes(error.stderr or b'')
            (output/'port-status.json').write_text(json.dumps({'status':'timed-out','seconds':15})+'\n')
            raise
        (output/'port.stdout.json').write_bytes(result.stdout)
        (output/'port.stderr.txt').write_bytes(result.stderr)
        (output/'port-status.json').write_text(json.dumps({'status':'exited','exitCode':result.returncode})+'\n')
        if result.returncode:raise ValueError('Candidate port exited '+str(result.returncode))
        port=json.loads(result.stdout)
        inventory,requests=compare(native,port,payload['fields'])
        (output/'differences.json').write_text(json.dumps(inventory,indent=2)+'\n')
        summary={'status':'passed','scope':'Candidate port against unchanged accepted supplied-state native rows',
                 'pairs':63,'knownStateOrReturnResidualRows':4,'comparedRequests':requests,
                 'rawResidualRows':len(inventory),'wholeSermonEquality':'not-claimed',
                 'audio':'request-only interception; live owner flag tested separately',
                 'newNativeExecution':False,'nodeVersion':port['nodeVersion']}
    except Exception as error:
        summary={'status':'failed','error':f'{type(error).__name__}: {error}','newNativeExecution':False}
    finally:
        def observed(path):
            try:
                return sha(path.read_bytes())
            except OSError as error:
                return {'error':f'{type(error).__name__}: {error}'}
        binding['candidateSourceAfter']={path:observed(ROOT/path) for path in before}
        binding['nativeInputsAfter']={name:observed(args.native_run_dir/name) for name in REFERENCE}
        binding['nodeSha256After']=observed(Path(node))
        binding['unchanged']=(before==binding['candidateSourceAfter'] and
                              REFERENCE==binding['nativeInputsAfter'] and node_hash==binding['nodeSha256After'])
        (output/'binding.json').write_text(json.dumps(binding,indent=2)+'\n')
    if not binding['unchanged']:summary={'status':'failed','error':'Source/input drift during replay'}
    (output/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps(summary,indent=2))
    return 0 if summary['status']=='passed' else 1


if __name__=='__main__':sys.exit(main())
