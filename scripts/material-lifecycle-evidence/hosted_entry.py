#!/usr/bin/env python3
"""Trusted same-job bridge: prepared checkout -> qualification -> one proof.

Preparation is the existing trusted hosted checkout/pinned installation step,
not an arbitrary repository script, shared-runtime migration or local retry.
Run only from independently reviewed infrastructure. Default is plan-only.
"""
import argparse
import json
import os
from pathlib import Path
import sys
sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import controller as policy
import execution
import fresh_projection as fresh
import qualification_review
import hosted_resources

QUALIFICATION_LIMITS = qualification_review.LIMITS
FIELDS = {'version','kind','checkout','git','installation','sharedAdapter','tools','toolRoots','browser'}


def tool_root(shared, name, names):
    path = Path(name)
    policy.physical(path.parent)
    policy.require(path.is_absolute() and '..' not in path.parts and shared.safe_tool_root(path), 'Unsafe tool path')
    if path.is_symlink():
        target = policy.physical(path.resolve(strict=True))
        policy.require(target.is_file() and shared.safe_tool_root(target) and str(target) in names,
                       'Tool alias requires separately qualified safe physical target')
    else:
        policy.physical(path)
    return path


def admit(shared, value):
    policy.require(set(value) == FIELDS and value['version'] == 1 and
                   value['kind'] == 'material-hosted-prepared-inputs', 'Wrong prepared inputs')
    tools = value['tools']
    policy.require(set(tools) == {'python','node','pnpm','bwrap','readonly','pnpmVersion'} and
                   tools['pnpmVersion'] == fresh.PNPM_VERSION, 'Wrong pinned tools')
    policy.require(value['git'] == '/usr/bin/git' and
                   Path(tools['python']) == Path(sys.executable).resolve(), 'Actual interpreter/Git differ')
    roots = [tool_root(shared, name, tools['readonly']) for name in tools['readonly']]
    policy.require(roots and len(roots) == len(set(roots)) and
                   all(shared.safe_tool_root(path) for path in roots), 'Unsafe or duplicate tool roots')
    # Never widen a missing library/font dependency into whole host-system trees.
    policy.require(not set(roots).intersection(map(Path,('/usr/lib','/usr/lib64','/usr/local',
                   '/usr/share','/usr/lib/x86_64-linux-gnu','/usr/local/lib'))), 'Broad host tool tree denied')
    policy.require(Path(shared.__file__).parent in roots and HERE in roots,
                   'Exact helper and entry directories must be qualified')
    for path in [*map(Path, (tools[k] for k in ('python','node','pnpm','bwrap'))),
                 Path(value['git']), Path(value['browser']['path'])]:
        policy.physical(path)
        policy.require(any(path.is_relative_to(root) for root in roots), 'Tool missing from closure: '+str(path))
    policy.require(value['browser']['archiveSha256'] == policy.ARCHIVE_SHA256 and
                   policy.sha256_file(value['browser']['path']) == policy.BROWSER_SHA256, 'Browser pin differs')
    policy.require({str(path):shared.inventory_hash(path) for path in roots} == value['toolRoots'],
                   'Prepared tool closure changed')
    policy.verify_frozen_files(HERE, policy.FROZEN_PINS)
    fresh.installation(value['installation'], shared, policy.physical(value['checkout']))
    return roots


def save_reference(shared, path, value):
    shared.save_new(path, value)
    return qualification_review.reference(shared, path)


def run(value, destination):
    shared = execution.load_shared(value['sharedAdapter'])
    destination = policy.physical(destination)
    policy.require(destination.parent.is_dir() and destination.parent.stat().st_uid == os.getuid(),
                   'Owned existing destination parent required')
    # No resume, overwrite, retry or reused qualifier from another runner.
    policy.require(not os.path.lexists(destination), 'Fresh single-attempt destination required')
    protected = [policy.physical(value['checkout']), HERE, Path(value['sharedAdapter']['path']).parent,
                 *map(Path, value['tools']['readonly'])]
    policy.require(not any(destination.is_relative_to(path) or path.is_relative_to(destination)
                           for path in protected), 'Destination overlaps protected input')
    destination.mkdir(mode=0o700)
    outcome = {'status':'failed-or-unknown', 'browserAttempted':False, 'error':None}
    try:
        # Each phase is bounded independently. Existing qualifier/controller own
        # their pidfds, memory, disk, raw caps, deadlines, cleanup and final seals.
        with hosted_resources.guard(shared,[Path(value['checkout']),destination],
                                    destination/'prepare-source',prepare=True):
            admit(shared, value)
            shared.assert_capacity(shared.host_snapshot(destination), policy.material_limits(shared), admission=True)
            policy.require(shared.host_snapshot(destination)['MemAvailable'] >= policy.OPENING_MEMORY,
                           'Opening memory below original floor')
            profile = fresh.build_profile(shared, value['checkout'], value['git'], destination, value['installation'])
            profile_ref = save_reference(shared, destination/'projection.json', profile)
            qualifier_tools = {**value['tools'], 'node':value['tools']['python'],
                               'pnpm':value['tools']['python'], 'pnpmVersion':'not-executed-sentinel-only'}
            qualifier = save_reference(shared, destination/'qualification-spec.json', {
                'version':1, 'kind':'shared-execution-qualification-spec', 'tools':qualifier_tools,
                'toolRoots':value['toolRoots'], 'limits':QUALIFICATION_LIMITS})
        result = shared.qualify_backend(qualifier, destination/'qualification', value['sharedAdapter']['sha256'])
        policy.require(result['status'] == 'passed' and result['error'] is None,
                       'Actual target qualification failed; no browser attempt')
        with hosted_resources.guard(shared,[Path(value['checkout']),destination],
                                    destination/'prepare-review',prepare=True):
            records = destination/'qualification/evidence'
            qualification = {'terminal':qualification_review.reference(shared, records/'terminal.json'),
                             'finalBudget':qualification_review.reference(shared, records/'final-budget.json')}
            backend = qualification_review.review(shared, qualification, value['tools'], destination/'backend.json')
            spec = {'version':1, 'kind':'material-lifecycle-execution', 'sharedAdapter':value['sharedAdapter'],
                    'tools':value['tools'], 'backend':backend, 'projection':profile_ref,
                    'checkerInventory':shared.inventory_hash(HERE), 'frozenPins':policy.FROZEN_PINS,
                    'browser':value['browser']}
            save_reference(shared, destination/'material-spec.json', spec)
        # Source/closure/seal rechecked by the existing controller immediately
        # before ownership. Its exact browser launch is the sandbox/WebGL2 test.
        # No preparatory browser smoke, fallback flags, second attempt or restart.
        outcome['browserAttempted'] = 'see owned controller terminal (dispatch is not launch evidence)'
        outcome.update(execution.execute(spec, destination/'attempt-01'))
    except BaseException as error:
        outcome['status'] = 'failed-or-unknown'
        outcome['error'] = type(error).__name__+': '+str(error)
    finally:
        shared.save_new(destination/'entry-result.json', {**outcome,
            'entrySha256':policy.sha256_file(__file__), 'visualReview':'pending',
            'claim':'Qualification is not rendered proof; successful proof still requires screenshot review'})
    return outcome


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--inputs', required=True)
    parser.add_argument('--inputs-sha256', required=True)
    parser.add_argument('--destination', required=True)
    parser.add_argument('--execute', action='store_true')
    args = parser.parse_args()
    policy.require(policy.sha256_file(args.inputs) == args.inputs_sha256, 'Prepared input manifest differs')
    value = json.loads(Path(args.inputs).read_bytes())
    if not args.execute:
        print(json.dumps({'status':'plan-only', 'candidate':policy.REVISION,
                          'action':'Reviewed same-job qualification then at most one original rendered attempt'}))
        return 0
    result = run(value, args.destination)
    print(json.dumps(result))
    return 0 if result['status'] == 'passed-pending-rendered-review' else 2


if __name__ == '__main__':
    raise SystemExit(main())
