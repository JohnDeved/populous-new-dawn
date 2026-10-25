"""Bounded encrypt-only fixture supervisor, derived from local qualification.
No command-line dispatch. The caller supplies a fixed three-command OpenSSL map.
System OpenSSL configuration is left at its default; no provider override.
"""
import json
import os
from pathlib import Path
import resource
import selectors
import signal
import subprocess
import time

FILE_CAP = 1024 * 1024
LOG_CAP = 64 * 1024
RSS_CAP = 512 * 1024 * 1024

def require(ok, code):
    if not ok:
        raise RuntimeError(code)


def create(path, data):
    require(len(data) <= FILE_CAP, 'create-cap')
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'wb') as f:
        f.write(data)


def write_json(path, obj):
    create(path, (json.dumps(obj, indent=2) + '\n').encode())


def rss(pid):
    try:
        lines = Path(f'/proc/{pid}/status').read_text().splitlines()
    except FileNotFoundError:
        return 0
    return next((int(x.split()[1]) * 1024 for x in lines if x.startswith('VmRSS:')), 0)


def limits(file_limit):
    resource.setrlimit(resource.RLIMIT_FSIZE, (file_limit, file_limit))
    resource.setrlimit(resource.RLIMIT_CPU, (15, 15))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))


class Supervisor:
    def __init__(self, deadline, out, commands):
        self.deadline = deadline
        self.out = out
        self.commands = commands
        self.raw_remaining = LOG_CAP
        self.phases = []

    def run(self, name):
        require(name in self.commands, "unknown-fixed-phase")
        command, file_limit = self.commands[name]
        require(file_limit == FILE_CAP, "phase-file-cap")
        require(time.monotonic() < self.deadline, 'aggregate-deadline-before-spawn')
        start = time.monotonic()
        child = selector = None
        streams = {'stdout': bytearray(), 'stderr': bytearray()}
        phase = {'name': name, 'command': [str(x) for x in command], 'hard_file_limit_bytes': file_limit,
                 'exit_code': None, 'stop_reason': None, 'error': None,
                 'aggregate_deadline': self.deadline,
                 'cleanup_errors': [], 'persistence_errors': [], 'samples': 0,
                 'peak_owned_rss_bytes': rss(os.getpid()), 'pipes_closed': False,
                 'direct_wait_complete': False, 'group_absent': False}
        self.phases.append(phase)

        def drain(wait):
            for item, _ in selector.select(wait):
                try:
                    data = os.read(item.fileobj.fileno(), 8192)
                except BlockingIOError:
                    continue
                if not data:
                    selector.unregister(item.fileobj)
                    item.fileobj.close()
                else:
                    keep = min(len(data), self.raw_remaining)
                    streams[item.data].extend(data[:keep])
                    self.raw_remaining -= keep
                    if keep < len(data):
                        phase['stop_reason'] = 'aggregate-raw-log-cap'

        try:
            child = subprocess.Popen(phase['command'], cwd=self.out, stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True,
                preexec_fn=lambda: limits(file_limit), env={'PATH': '/usr/bin:/bin', 'LANG': 'C'})
            phase['pid'] = child.pid
            selector = selectors.DefaultSelector()
            for label, stream in [('stdout', child.stdout), ('stderr', child.stderr)]:
                os.set_blocking(stream.fileno(), False)
                selector.register(stream, selectors.EVENT_READ, label)
            while child.poll() is None or selector.get_map():
                if time.monotonic() >= self.deadline:
                    phase['stop_reason'] = 'aggregate-wall-deadline'
                    break
                owned = rss(os.getpid()) + rss(child.pid)
                phase['samples'] += 1
                phase['peak_owned_rss_bytes'] = max(phase['peak_owned_rss_bytes'], owned)
                if owned > RSS_CAP:
                    phase['stop_reason'] = 'sampled-owned-rss-cap'
                try:
                    for task in Path(f'/proc/{child.pid}/task').iterdir():
                        try:
                            if (task / 'children').read_text().strip():
                                phase['stop_reason'] = 'unexpected-process-child'
                        except FileNotFoundError:
                            pass
                except FileNotFoundError:
                    pass
                drain(min(0.01, max(0, self.deadline - time.monotonic())))
                if phase['stop_reason']:
                    break
        except BaseException as exc:
            phase['error'] = type(exc).__name__  # Never exception payload text.
        finally:
            if child is not None:
                if phase['stop_reason'] or phase['error'] or child.poll() is None:
                    try:
                        os.killpg(child.pid, signal.SIGKILL)
                    except ProcessLookupError:
                        pass
                    except BaseException as exc:
                        phase['cleanup_errors'].append('killpg:' + type(exc).__name__)
                drain_deadline = time.monotonic() + 0.2
                if selector is not None:
                    try:
                        while selector.get_map() and time.monotonic() < drain_deadline:
                            drain(min(0.01, max(0, drain_deadline - time.monotonic())))
                        if selector.get_map():
                            phase['cleanup_errors'].append('pipe-drain-deadline')
                    except BaseException as exc:
                        phase['cleanup_errors'].append('drain:' + type(exc).__name__)
                try:
                    phase['exit_code'] = child.wait(timeout=2)
                    phase['direct_wait_complete'] = True
                except BaseException as exc:
                    phase['cleanup_errors'].append('wait:' + type(exc).__name__)
                try:
                    os.killpg(child.pid, 0)
                    os.killpg(child.pid, signal.SIGKILL)
                    phase['cleanup_errors'].append('remaining-owned-group')
                except ProcessLookupError:
                    phase['group_absent'] = True
                except BaseException as exc:
                    phase['cleanup_errors'].append('group-check:' + type(exc).__name__)
                for stream in (child.stdout, child.stderr):
                    try:
                        if stream is not None and not stream.closed:
                            stream.close()
                    except BaseException as exc:
                        phase['cleanup_errors'].append('close:' + type(exc).__name__)
                phase['pipes_closed'] = all(s is not None and s.closed for s in (child.stdout, child.stderr))
            if selector is not None:
                try:
                    selector.close()
                except BaseException as exc:
                    phase['cleanup_errors'].append('selector:' + type(exc).__name__)
            for label, data in streams.items():
                try:
                    create(self.out / f'{name}.{label}', data)
                except BaseException as exc:
                    phase['persistence_errors'].append(label + ':' + type(exc).__name__)
            phase['raw_log_bytes'] = sum(map(len, streams.values()))
            phase['elapsed_seconds'] = time.monotonic() - start
            phase['terminal_ok'] = (phase['exit_code'] == 0 and clean_terminal(phase))
            try:
                write_json(self.out / f'{name}.phase.json', phase)
            except BaseException as exc:
                phase['persistence_errors'].append('phase:' + type(exc).__name__)
                phase['terminal_ok'] = False
        return phase


def clean_terminal(p):
    return (p['direct_wait_complete'] and p['pipes_closed'] and p['group_absent'] and
            not any(p[k] for k in ('stop_reason', 'error', 'cleanup_errors', 'persistence_errors')))
