"""Host-only checks of this probe's deny-write and failure-preservation paths.

Imports only probe.py's stdlib definitions. No Unicorn, game/application module,
Node, browser, package, or native executable is imported or executed.
"""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import signal
import sys

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('firing_probe_host_checks', HERE / 'probe.py')
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    assert args.output.resolve().is_relative_to(probe.ROOT / 'work/orchestration')
    assert not args.output.exists()
    args.output.mkdir(parents=True)
    checked = []
    for label, begin, end in probe.MUTABLE:
        assert probe.write_region(begin, 1) == label
        assert probe.write_region(end - 1, 1) == label
        try:
            probe.write_region(end - 1, 2)
        except AssertionError:
            pass
        else:
            raise AssertionError(f'Cross-boundary write accepted: {label}')
    for address in (0x51ba26, 0x4ee700, 0x5a6858, 0x5a6d50, 0x5a6af8,
                    0x2010001, 0x2020000, 0x2030000, 0x890394, 0x8a03e4,
                    0x204e000, 0xffffffff):
        try:
            probe.write_region(address, 4)
        except AssertionError:
            pass
        else:
            raise AssertionError(f'Immutable write accepted: {address:08x}')
    checked.append('exact mutable boundaries and code/table/count/order/thunk/pointer/land denial')

    for error_type in (RuntimeError, TimeoutError, AssertionError):
        output = args.output / error_type.__name__
        output.mkdir()
        state = {'status': 'running', 'phase': 'native-visit', 'case': 'host-case', 'visit': 0}
        path = output / 'cases/host-case/visit-00.json'
        probe.save_json(output / 'cases/host-case/case.json', {'status': 'running'})
        fixture = {'step': 0}
        events = []
        def operation():
            # Prove the before-record reached disk before the failing operation.
            prior = json.loads(path.read_text())
            assert prior['status'] == 'running' and prior['before'] == {'step': 0}
            fixture['step'] = 1
            events.append({'hostOnly': 'partial event'})
            raise error_type('host-only injected failure')
        code = probe.finish_probe(output, state,
                                  lambda: probe.native_visit(path, 0, lambda: dict(fixture), operation, events))
        assert code == 2
        saved = json.loads(path.read_text())
        assert saved['status'] == 'failed' and saved['afterFailure'] == {'step': 1}
        assert saved['events'] == events and saved['error']['type'] == error_type.__name__
        terminal = json.loads((output / 'terminal.json').read_text())
        assert terminal['status'] == 'failed' and terminal['exitCode'] == 2
        assert json.loads((output / 'cases/host-case/case.json').read_text())['status'] == 'failed'
    checked.append('exception/timeout/assertion retain before, partial after, events, case and terminal failure')

    for timeout in (False, True):
        output = args.output / ('child-timeout' if timeout else 'child-success')
        output.mkdir()
        stdin = output / 'input.json'
        stdin.write_text('{}\n')
        code = ("import signal,sys,time; signal.signal(signal.SIGTERM,signal.SIG_IGN); "
                "print('host-only partial stdout',flush=True); "
                "print('host-only partial stderr',file=sys.stderr,flush=True); time.sleep(20)") if timeout else (
                "import sys; print('host-only completed stdout',flush=True); "
                "print('host-only completed stderr',file=sys.stderr,flush=True)")
        try:
            probe.run_port_child([sys.executable, '-c', code], stdin, output, timeout=0.4 if timeout else 2)
        except TimeoutError:
            assert timeout
        else:
            assert not timeout
        result = json.loads((output / 'port-process.json').read_text())
        assert result['reaped'] and result['maxRssKiB'] > 0
        assert result['status'] == ('failed' if timeout else 'completed')
        assert (output / 'port.stdout.json').read_text().startswith('host-only ')
        assert (output / 'port.stderr.txt').read_text().startswith('host-only ')
        if timeout:
            assert result['sentTerm'] and result['sentKill'] and result['returnCode'] == -signal.SIGKILL
        try:
            os.waitpid(result['pid'], os.WNOHANG)
        except ChildProcessError:
            pass
        else:
            raise AssertionError('Direct child was not already reaped')
    checked.append('direct dummy child success and forced timeout retain partial logs, TERM/KILL, wait4 and exact RSS')
    assert 'unicorn' not in sys.modules
    report = {'status': 'passed', 'hostOnly': True, 'nativeExecution': False,
              'portExecution': False, 'browserExecution': False, 'checks': checked}
    probe.save_json(args.output / 'result.json', report)
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
