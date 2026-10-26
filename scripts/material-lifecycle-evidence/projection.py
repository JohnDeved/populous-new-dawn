"""Reuse accepted PR722 application mounts; never demand a full new checkout."""
import json
import os
from pathlib import Path
import sys
import controller as policy

EXPECTED_MOUNT='753ce81b458c6b71b8be6be76f3d2044f24cf1d44ab54a516dc5be887f746137'
ADMISSION_CLOSURE={
 'public_projection.py':'0f77aef6fa59422c35139aee9b9301643bd77c6b02845f10ad1a006f8e49b681',
 'source_admission.py':'a9fd096faefa0330d80c68e92ff3822e5959733b0fccd63d315854923745797a',
 'browser-plan.json':'0cefc93972727021324abbd6528b85b71f90891659785001a243f5c7c21110e3',
 'projection-readonly-audit.json':'c553c11f331938e4e7dc9cc451e7bc48a47e6b3305a22f97304c698b2f82e69a',
 'public-projection-plan.json':'ee497b768f9a547a7cea35fe580d3edb667d9e4002e9b8c2af02914e25611036'}
EXPECTED_REVIEW='7f0fda5d795aa60152c08c8fbc9f33d52b9dfc178ba87725ff308821c693be9a'


def inputs(shared,spec):
    profile=shared.pinned_json(spec['projection'])
    if profile.get('version') == 2:
        import fresh_projection
        profile, actual = fresh_projection.inputs(shared, spec, profile)
        policy.require(spec['tools']['pnpmVersion'] == fresh_projection.PNPM_VERSION, 'Pinned manager version differs')
        policy.require(profile['git'] == '/usr/bin/git' and
                       any(Path(profile['git']).is_relative_to(Path(root)) for root in spec['tools']['readonly']),
                       'Exact hosted Git tool must be in qualified closure')
        verify_execution_inputs(shared, spec)
        return profile, actual
    policy.require(set(profile)=={'version','kind','namespaceRuntime','applicationMounts','inventory',
                                 'sourceAdmission','sourceReview','evidenceParent','originalMountPlan'},
                   'Projection profile fields differ')
    policy.require(profile['version']==1 and profile['kind']=='accepted-material-projection','Wrong projection profile')
    review=shared.pinned_json(profile['sourceReview'])
    policy.require(profile['sourceReview']['sha256']==EXPECTED_REVIEW and
                   review['decision']=='ACCEPT_ACTUAL_SOURCE_ONLY_MOUNTED_ADMISSION' and
                   review['result']['exactHead']==policy.REVISION and review['result']['exactTree']==policy.TREE,
                   'Exact original mounted source acceptance required')
    policy.require(profile['originalMountPlan']['sha256']==EXPECTED_MOUNT,'Original mount-plan pin differs')
    original=shared.pinned_json(profile['originalMountPlan'])
    mounts=profile['applicationMounts']
    policy.require(type(mounts)is list and len(mounts)>0 and
                   all(row in original['readonly'] for row in mounts),'Application mount not in original accepted plan')
    # Exact original project sources, excluding only system/tool resources. The
    # qualified tool closure supplies those separately at the same tool paths.
    prefix=str(Path(profile['namespaceRuntime']).parents[1])+'/'
    original_apps=[row for row in original['readonly'] if row[0].startswith(prefix) and
                   '/protected-runtime-runner-08745845-20261025/' not in row[0] and
                   '/browser-recovery-154-20261025-attempt02/' not in row[0]]
    policy.require(mounts==original_apps,'Original application mounts omitted, reordered or added')
    runtime_targets=[b for a,b in original['writable'] if a==original['outputsPersist']]
    policy.require(runtime_targets==[profile['namespaceRuntime']],'Projection namespace differs')
    admission=policy.physical(profile['sourceAdmission']['path'])
    policy.require(policy.sha256_file(admission)==profile['sourceAdmission']['sha256'] and
                   any(str(admission)==a and a==b for a,b in mounts),'Source admission helper differs/unmounted')
    for name,digest in ADMISSION_CLOSURE.items():
        path=admission.parent/name
        policy.require(policy.sha256_file(path)==digest and [str(path),str(path)] in mounts,
                       'Original admission closure differs or is unmounted: '+name)
    inventory=shared.pinned_json(profile['inventory'])
    roots=sorted({a for a,_ in mounts if not any(a!=other and Path(a).is_relative_to(Path(other)) for other,_ in mounts)})
    policy.require(set(inventory)==set(roots),'Canonical application inventory incomplete')
    actual={name:shared.inventory_hash(Path(name),ignore_caches=Path(name).name=='node_modules') for name in roots}
    policy.require(actual==inventory,'Canonical projection identity changed')
    verify_execution_inputs(shared, spec)
    return profile,actual


def verify_execution_inputs(shared, spec):
    policy.verify_frozen_files(Path(__file__).parent,spec['frozenPins'])
    policy.require(shared.inventory_hash(Path(__file__).parent)==spec['checkerInventory'],'Checker inventory changed')
    browser=policy.physical(spec['browser']['path'])
    policy.require(policy.sha256_file(browser)==policy.BROWSER_SHA256 and
                   spec['browser']['archiveSha256']==policy.ARCHIVE_SHA256,'Browser pins differ')
    tools=spec['tools']
    policy.require(set(tools)=={'python','node','pnpm','bwrap','readonly','pnpmVersion'},'Tool fields differ')
    policy.require(Path(sys.executable).resolve()==Path(tools['python']),'Controller Python differs')
    for key in ('python','node','pnpm','bwrap'):
        policy.physical(tools[key])
        policy.require(any(Path(tools[key]).is_relative_to(Path(root)) for root in tools['readonly']), 'Tool not covered')
    policy.require(any(browser.is_relative_to(Path(root)) for root in tools['readonly']), 'Browser not qualified')
    policy.require(all(shared.safe_tool_root(Path(root)) for root in tools['readonly']),'Unsafe tool mount')
    shared.backend_qualification(spec['backend'],tools)


def mounts(shared,spec,profile,evidence):
    target=Path(profile['namespaceRuntime'])
    rows=[['rw',str(evidence/'launch-root'),str(target)]]
    rows += [['ro',a,b] for a,b in profile['applicationMounts']]
    rows += [['ro',name,name] for name in spec['tools']['readonly']]
    if str(Path(__file__).parent) not in spec['tools']['readonly']:
        rows += [['ro',str(Path(__file__).parent),str(Path(__file__).parent)]]
    if profile.get('version') == 2:
        references = [spec['projection'], profile['installation']]
        for reference in references:
            path = reference['path']
            policy.require(not any(Path(path).is_relative_to(Path(a)) for a, _ in profile['applicationMounts']),
                           'Fresh evidence reference overlaps source')
            rows.append(['ro', path, path])
    rows += [['rw',str(evidence/name),str(evidence/name)] for name in shared.PRIVATE_LEAVES
             if name!='shm' and not name.startswith('module-')]
    rows += [['rw',str(evidence/'tmp'),'/tmp'],['rw',str(evidence/'shm'),'/dev/shm']]
    rows += [['rw',str(evidence/('module-'+name.lstrip('.'))),str(target/'node_modules'/name)] for name in shared.CACHES]
    protected=[Path(a) for a,_ in profile['applicationMounts']]+[Path(x) for x in spec['tools']['readonly']]+[Path(__file__).parent]
    shared.validate_mounts(rows,evidence,protected,target,stage='run')
    return {'version':1,'mounts':rows,'rootReadOnly':True,'procReadOnly':True,'privatePidNamespace':True,
            'networkNamespace':False,'namespaceRuntime':str(target),'persistedOutputRoot':str(evidence/'launch-root'),
            'preparationRootMountedAtHostPath':False}
