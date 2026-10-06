"""One actual-port startup check against the exact native-01 sixteen fixtures.

No native CPU import/run, fixture regeneration, result comparison or resume mode.
Uses the reviewed direct-child guardian from probe.py with its unchanged limits.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import resource
import signal
import subprocess
import sys

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('firing_probe_port_smoke', HERE / 'probe.py')
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)
ROOT = probe.ROOT
FIXTURES = ROOT / 'work/orchestration/firewarrior-firing-phase-20261006/native-01/supplied-fixtures.json'
FIXTURE_SHA = '9ad6cabf2ddd1dbc7305816b6b795a9c62ca606a83218c3857f90d2d3a39561d'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--preflight-receipt', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    assert args.output.resolve().is_relative_to(ROOT / 'work/orchestration')
    assert not args.output.exists(), 'Smoke output must be fresh'
    args.output.mkdir(parents=True)
    state = {'status': 'running', 'phase': 'port-smoke-preflight', 'nativeExecution': False}
    result = probe.finish_probe(args.output, state, lambda: run(args, state))
    print(json.dumps(state))
    return result


def run(args, state):
    resource.setrlimit(resource.RLIMIT_AS, (512 * 1024**2, 8 * 1024**3))
    resource.setrlimit(resource.RLIMIT_CPU, (30, 35))
    resource.setrlimit(resource.RLIMIT_FSIZE, (8 * 1024**2, 8 * 1024**2))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    for signum in (signal.SIGALRM, signal.SIGTERM, signal.SIGXCPU, signal.SIGXFSZ):
        signal.signal(signum, probe.interrupted)
    signal.alarm(45)
    sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
    git = lambda *argv: subprocess.check_output(['git', *argv], cwd=ROOT, text=True).strip()
    receipt = json.loads(args.preflight_receipt.read_text())
    assert receipt['status'] == 'passed' and receipt['source'] == receipt['sourceAfter']
    preflight = json.loads(receipt['stdout'])
    assert preflight['sourceHead'] == git('rev-parse', 'HEAD')
    assert preflight['sourceStatus'] == '' and git('status', '--short') == ''
    assert str(Path(sys.executable).resolve()) == preflight['python']['path']
    assert sha(FIXTURES) == FIXTURE_SHA
    fixtures = json.loads(FIXTURES.read_text())
    specs = json.loads((HERE / 'cases.json').read_text())
    expected_names = [prefix + row['name'] for prefix in ('person-', 'building-') for row in specs]
    assert len(fixtures) == 16 and [row['spec']['name'] for row in fixtures] == expected_names
    paths = {ROOT / name: digest for name, digest in preflight['applicationClosure'].items()}
    paths.update({HERE / name: digest for name, digest in preflight['probeSources'].items()})
    paths[Path(preflight['node']['path'])] = preflight['node']['sha256']
    paths[Path(sys.executable).resolve()] = sha(Path(sys.executable).resolve())
    paths[FIXTURES] = FIXTURE_SHA
    paths[args.preflight_receipt.resolve()] = sha(args.preflight_receipt)
    for path, expected in paths.items():
        assert sha(path) == expected, str(path)
    command = [preflight['node']['path'], '--max-old-space-size=128', str(HERE / 'port.mjs')]
    manifest = {'sourceHead': preflight['sourceHead'], 'sourceStatus': '', 'argv': command,
                'fixturesSha256': FIXTURE_SHA, 'plannedCases': expected_names,
                'inputSha256': {str(path): digest for path, digest in paths.items()},
                'nativeExecution': False, 'status': 'prepared'}
    probe.save_json(args.output / 'manifest.json', manifest)
    try:
        state['phase'] = 'actual-port-smoke'
        process = probe.run_port_child(command, FIXTURES, args.output, limits=probe.node_limits)
        assert process['reaped'] and process['returnCode'] == 0, 'Actual port child failed; retained process/log evidence'
        output = json.loads((args.output / 'port.stdout.json').read_text())
        assert output['exposures'] == 1
        assert [row['name'] for row in output['cases']] == expected_names
        assert output['callerHash'] == preflight['applicationClosure']['app/live-building-combat.ts']
        for case, fixture in zip(output['cases'], fixtures, strict=True):
            visits = case['visits']
            assert 1 <= len(visits) <= fixture['spec']['visits']
            assert [row['visit'] for row in visits] == list(range(len(visits)))
            assert all(not row['complete'] for row in visits[:-1])
            assert len(visits) == fixture['spec']['visits'] or visits[-1]['complete']
        manifest.update(status='passed-startup-only', emittedCases=len(output['cases']),
                        emittedVisits=sum(len(row['visits']) for row in output['cases']),
                        process=process)
        return 0
    except BaseException as error:
        manifest.update(status='failed', error={'type': type(error).__name__, 'message': str(error)})
        raise
    finally:
        after = {str(path): sha(path) for path in paths}
        manifest['inputSha256After'] = after
        manifest['sourceHeadAfter'] = git('rev-parse', 'HEAD')
        manifest['sourceStatusAfter'] = git('status', '--short')
        stable = (after == manifest['inputSha256'] and manifest['sourceHeadAfter'] == manifest['sourceHead']
                  and manifest['sourceStatusAfter'] == '')
        manifest['sourceStable'] = stable
        if not stable:
            manifest['status'] = 'invalidated'
        probe.save_json(args.output / 'manifest.json', manifest)
        assert stable, 'Source or fixture changed during port smoke'
        assert 'unicorn' not in sys.modules


if __name__ == '__main__':
    raise SystemExit(main())
