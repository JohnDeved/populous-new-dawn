"""Private Linux sampler for a specifically admitted directly owned workload."""
import json
import mmap
import os
import signal
import tempfile
import time
from pathlib import Path

from observer import observe, read, stat_id

_REPORT_LIMIT = 256 * 1024

class PreLaunchFailure(Exception):
    """OS setup failed before any workload child could exist."""

def restore_exec_signals():
    for name in ('SIGPIPE', 'SIGXFZ', 'SIGXFSZ'):
        if hasattr(signal, name):
            signal.signal(getattr(signal, name), signal.SIG_DFL)

def detach_observer_stdio():
    """Do not leave the sampler holding any inherited build-log pipe ends."""
    os.closerange(0, 3)
    fd = os.open(os.devnull, os.O_RDWR)
    try:
        for stream in (0, 1, 2):
            if fd != stream:
                os.dup2(fd, stream)
    finally:
        if fd > 2:
            os.close(fd)

def _poll(pid):
    done, status = os.waitpid(pid, os.WNOHANG)
    return status if done else None

def run_owned(argv, *, duration=15, interval=250, sampler=observe):
    """Return raw wait status and a bounded numeric-only observer diagnostic."""
    if not argv or not os.path.isabs(argv[0]):
        raise ValueError('workload requires an explicitly chosen absolute executable')
    if not 1 <= duration <= 15 or not 250 <= interval <= 5000:
        raise ValueError('sampling out of bounds')
    try:
        gate_read, gate_write = os.pipe()
    except OSError as exc:
        raise PreLaunchFailure from exc
    try:
        result = tempfile.TemporaryFile()
    except OSError as exc:
        os.close(gate_read)
        os.close(gate_write)
        raise PreLaunchFailure from exc
    if result.fileno() < 3:
        result.close()
        os.close(gate_read)
        os.close(gate_write)
        raise PreLaunchFailure("sampler receipt conflicts with standard streams")
    try:
        finished = mmap.mmap(-1, 1)
    except OSError as exc:
        result.close()
        os.close(gate_read)
        os.close(gate_write)
        raise PreLaunchFailure from exc
    with result, finished:
        try:
            workload = os.fork()
        except BaseException as exc:
            os.close(gate_read)
            os.close(gate_write)
            if isinstance(exc, OSError):
                raise PreLaunchFailure from exc
            raise
        if workload == 0:
            try:
                os.close(gate_write)
                result.close()
                token = os.read(gate_read, 1)
                os.close(gate_read)
                if token != b'G':
                    os._exit(126)
                # Match normal Python subprocess restore_signals behavior.
                restore_exec_signals()
                os.execv(argv[0], argv)
            except FileNotFoundError:
                os._exit(127)
            except BaseException:
                os._exit(126)
        os.close(gate_read)
        observer = None
        diagnostic = {'status': 'sampler-unavailable'}
        try:
            identity = stat_id(read(Path('/proc') / str(workload) / 'stat', 8192, lambda: None))
            if identity[0] != workload or identity[2] != os.getpid():
                raise RuntimeError('not the owned gated child')
            observer = os.fork()
            if observer == 0:
                try:
                    os.close(gate_write)
                    detach_observer_stdio()
                    # This helper is never the workload and cannot acquire arbitrary PIDs.
                    report = sampler(workload, identity[1], duration_seconds=duration,
                                     interval_ms=interval, stopped=lambda: finished[0] == 1)
                    data = json.dumps(report, allow_nan=False).encode()
                    if not 0 < len(data) <= _REPORT_LIMIT:
                        os._exit(1)
                    result.write(data)
                    result.flush()
                    os._exit(0)
                except BaseException:
                    os._exit(1)
        except Exception:
            pass
        finally:
            # The parent's release is the only start signal. No extra workload environment.
            try:
                os.write(gate_write, b'G')
            except BrokenPipeError:
                pass
            finally:
                os.close(gate_write)

        workload_status = None
        observer_status = None
        observer_abandoned = False
        deadline = time.monotonic() + duration + 1
        while workload_status is None or (observer is not None and observer_status is None and not observer_abandoned):
            try:
                if workload_status is None:
                    workload_status = _poll(workload)
                    if workload_status is not None:
                        finished[0] = 1
                        deadline = min(deadline, time.monotonic() + 0.5)
                if observer is not None and observer_status is None and not observer_abandoned:
                    observer_status = _poll(observer)
                    if observer_status is None and time.monotonic() >= deadline:
                        # Only our own unreaped sampler child can have this PID.
                        try:
                            os.kill(observer, signal.SIGKILL)
                        except OSError:
                            pass
                        # Even SIGKILL may not end an uninterruptible procfs read
                        # immediately. Only try a nonblocking reap; if still stuck
                        # the OS may reap the orphan after this wrapper exits.
                        try:
                            _poll(observer)
                        except OSError:
                            pass
                        observer_abandoned = True
                        diagnostic = {'status': 'sampler-timeout'}
                if workload_status is None or (observer is not None and observer_status is None and not observer_abandoned):
                    time.sleep(0.025)
            except KeyboardInterrupt:
                # The foreground group supplies terminal SIGINT to the workload;
                # keep waiting for its actual status rather than changing it here.
                continue
        if observer_status == 0 and not observer_abandoned:
            result.seek(0)
            try:
                data = result.read(_REPORT_LIMIT + 1)
                if 0 < len(data) <= _REPORT_LIMIT:
                    diagnostic = json.loads(data)
            except (ValueError, OSError):
                pass
        return workload_status, diagnostic

