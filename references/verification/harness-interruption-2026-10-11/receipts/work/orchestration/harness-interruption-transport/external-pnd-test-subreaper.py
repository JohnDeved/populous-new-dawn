"""Reap only descendants of one foreground test command in this executor."""
import ctypes
import os
import subprocess
import sys

if len(sys.argv) < 2:
    raise SystemExit("Supply the foreground command as argv")
libc = ctypes.CDLL(None, use_errno=True)
if libc.prctl(36, 1, 0, 0, 0) != 0:  # Linux PR_SET_CHILD_SUBREAPER
    error = ctypes.get_errno()
    raise OSError(error, os.strerror(error))

command = subprocess.Popen(sys.argv[1:])
exit_code = None
reaped = 0
while True:
    try:
        pid, status = os.waitpid(-1, 0)
    except InterruptedError:
        continue
    except ChildProcessError:
        break
    reaped += 1
    if pid == command.pid:
        exit_code = os.waitstatus_to_exitcode(status)

print(f"Task subreaper: command exit={exit_code}, descendants reaped={reaped}", file=sys.stderr)
if exit_code is None:
    raise SystemExit("Foreground command exit was not observed")
raise SystemExit(exit_code if exit_code >= 0 else 128 - exit_code)
