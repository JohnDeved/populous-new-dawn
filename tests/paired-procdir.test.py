"""Injected source tests only: no live procfs, pidfds, subprocesses or threads."""
import ast
from contextlib import ExitStack
import io
from pathlib import Path
import subprocess
import sys
import threading
from types import SimpleNamespace
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts/orchestration'))
GUARDS = [patch.object(subprocess, name, side_effect=AssertionError('Subprocess forbidden'))
          for name in ('Popen', 'run', 'check_output', 'check_call', 'call')]
for guard in GUARDS:
    guard.start()
import shared_execution as execution


def proc_stat(pid=20, ticks=200, ppid=10):
    fields = ['S', str(ppid), '20', '20'] + ['0'] * 15 + [str(ticks)]
    return str(pid) + ' (synthetic ) name) ' + ' '.join(fields) + '\n'


def row(pid=20, ticks=200, ppid=10):
    return dict(pid=pid, startTicks=ticks, ppid=ppid, state='S', pgid=pid, session=pid)


class PairedProcdirTests(unittest.TestCase):
    def setUp(self):
        self.stack = ExitStack(); self.addCleanup(self.stack.close)
        self.open = self.stack.enter_context(patch.object(execution.os, 'open', side_effect=AssertionError('Unexpected OS open')))
        self.pidfd = self.stack.enter_context(patch.object(execution.os, 'pidfd_open', side_effect=AssertionError('Unexpected pidfd')))
        self.close = self.stack.enter_context(patch.object(execution.os, 'close'))
        self.fdopen = self.stack.enter_context(patch.object(execution.os, 'fdopen', side_effect=AssertionError('Unexpected fdopen')))
        self.readlink = self.stack.enter_context(patch.object(execution.os, 'readlink', side_effect=AssertionError('Unexpected readlink')))
        self.sysconf = self.stack.enter_context(patch.object(execution.os, 'sysconf', return_value=4096))
        self.stack.enter_context(patch.object(execution, 'process_member', side_effect=AssertionError('Numeric enrichment forbidden')))
        self.stack.enter_context(patch.object(execution, 'process_ancestry', side_effect=AssertionError('Numeric ancestry forbidden')))
        self.send = self.stack.enter_context(patch.object(execution.signal, 'pidfd_send_signal', side_effect=AssertionError('Signals forbidden')))

    def watch(self):
        watch = object.__new__(execution.OwnerWatch)
        watch.parent = row(10, 100, 1)
        watch.pidfds = {}; watch.procdirs = {}; watch.handles_closed = False
        watch.lock = threading.RLock(); watch.direct_fds = []; watch.namespace_fds = []
        watch.known = {}; watch.history = {}; watch.namespace_roots = {}
        watch.closed = threading.Event(); watch.stream = io.BytesIO()
        watch.failure = watch.failure_marker = watch.unexpected_failure = None
        watch.limits = execution.BUILD_LIMITS
        watch.thread = SimpleNamespace(join=lambda timeout: None, is_alive=lambda: False)
        return watch

    def acquisition(self, data=None, *, events=None):
        events = [] if events is None else events
        self.open.side_effect = lambda path, flags, **kw: self.open_event(path, flags, kw, events)
        self.pidfd.side_effect = lambda pid: (events.append(('pidfd', pid)) or 41)
        stream = io.StringIO(proc_stat() if data is None else data)
        self.fdopen.side_effect = lambda fd, mode: (events.append(('fdopen', fd, mode)) or stream)
        return events, stream

    def open_event(self, path, flags, kw, events):
        events.append(('open', path, flags, kw))
        if path == '/proc/20':
            self.assertEqual(kw, {})
            self.assertEqual(flags, execution.os.O_RDONLY | execution.os.O_DIRECTORY | execution.os.O_CLOEXEC | execution.os.O_NOFOLLOW)
            return 40
        self.assertEqual(path, 'stat'); self.assertEqual(kw, {'dir_fd': 40})
        self.assertEqual(flags, execution.os.O_RDONLY | execution.os.O_CLOEXEC | execution.os.O_NOFOLLOW)
        return 42

    def test_acquisition_order_is_directory_pidfd_fresh_relative_stat(self):
        watch = self.watch(); events, stream = self.acquisition()
        watch.pin_identity(row(), 'first')
        self.assertEqual([event[:2] for event in events], [('open', '/proc/20'), ('pidfd', 20), ('open', 'stat'), ('fdopen', 42)])
        self.assertTrue(stream.closed)
        self.assertEqual(watch.pidfds, {(20, 200): 41}); self.assertEqual(watch.procdirs, {(20, 200): 40})

    def test_existing_pair_reused_without_numeric_lookup(self):
        watch = self.watch(); watch.pidfds[(20, 200)] = 41; watch.procdirs[(20, 200)] = 40
        watch.pin_identity(row(), 'second')
        self.open.assert_not_called(); self.pidfd.assert_not_called()

    def test_legacy_unpaired_fd_or_directory_never_retrofitted(self):
        for kind in ('pidfds', 'procdirs'):
            watch = self.watch(); getattr(watch, kind)[20, 200] = 40
            with self.assertRaisesRegex(ValueError, 'paired'): watch.pin_identity(row(), 'first')
        self.open.assert_not_called(); self.pidfd.assert_not_called()

    def test_initial_pid_start_and_ppid_comparisons_remain_fatal(self):
        for data in (proc_stat(pid=21), proc_stat(ticks=201), proc_stat(ppid=1), 'malformed'):
            watch = self.watch(); self.close.reset_mock(); self.acquisition(data)
            with self.assertRaises((ValueError, IndexError)): watch.pin_identity(row(), 'first')
            self.assertEqual([c.args[0] for c in self.close.call_args_list], [41, 40])
            self.assertEqual(watch.pidfds, {}); self.assertEqual(watch.procdirs, {})

    def test_directory_open_failure_does_not_attempt_pidfd(self):
        watch = self.watch(); self.open.side_effect = PermissionError(13, 'denied')
        with self.assertRaises(PermissionError): watch.pin_identity(row(), 'first')
        self.pidfd.assert_not_called(); self.close.assert_not_called()
        self.assertEqual(watch.observation_context['callsite'], 'pin-proc-directory-open')

    def test_pidfd_failure_or_exhaustion_closes_directory(self):
        for error in (ProcessLookupError(3, 'gone'), OSError(24, 'fd exhausted'), PermissionError(13, 'denied')):
            watch = self.watch(); self.close.reset_mock(); self.acquisition(); self.pidfd.side_effect = error
            with self.assertRaises(type(error)): watch.pin_identity(row(), 'second')
            self.close.assert_called_once_with(40)
            self.assertEqual(watch.pidfds, {}); self.assertEqual(watch.procdirs, {})

    def test_reap_after_directory_open_rejects_replacement_pidfd(self):
        watch = self.watch(); self.acquisition()
        # pidfd 41 could now refer to a reused PID; old directory 40 cannot.
        self.fdopen.side_effect = ProcessLookupError(3, 'old proc directory reaped')
        with self.assertRaises(ProcessLookupError): watch.pin_identity(row(), 'first')
        self.assertEqual([c.args[0] for c in self.close.call_args_list], [42, 41, 40])
        self.assertEqual(watch.pidfds, {}); self.assertEqual(watch.procdirs, {})
        self.send.assert_not_called()

    def test_partial_map_adoption_rolls_back_and_closes_both(self):
        class FailingDict(dict):
            def __setitem__(self, key, value): raise MemoryError('injected storage failure')
        watch = self.watch(); watch.procdirs = FailingDict(); self.acquisition()
        with self.assertRaises(MemoryError): watch.pin_identity(row(), 'first')
        self.assertEqual(watch.pidfds, {}); self.assertEqual(watch.procdirs, {})
        self.assertEqual([c.args[0] for c in self.close.call_args_list], [41, 40])

    def test_partial_close_error_does_not_replace_primary_unknown_failure(self):
        watch = self.watch(); self.acquisition(); primary = ProcessLookupError(3, 'unvalidated')
        self.pidfd.side_effect = primary; self.close.side_effect = OSError(9, 'close failed')
        with self.assertRaises(ProcessLookupError) as result: watch.pin_identity(row(), 'first')
        self.assertIs(result.exception, primary); self.assertTrue(primary.__notes__)

    def test_full_enrichment_all_lookups_relative_to_retained_directory(self):
        contents = {'stat': proc_stat(), 'status': 'NSpid:\t20 2\n', 'statm': '10 2\n'}
        streams = []
        def opening(path, flags, **kw):
            self.assertIn(path, contents); self.assertEqual(kw, {'dir_fd': 40})
            stream = io.StringIO(contents[path]); streams.append(stream); return 42
        self.open.side_effect = opening; self.fdopen.side_effect = lambda fd, mode: streams[-1]
        def link(path, **kw):
            self.assertEqual(kw, {'dir_fd': 40}); self.assertIn(path, ('ns/pid', 'exe'))
            return 'pid:[123]' if path == 'ns/pid' else '/owned/executable'
        self.readlink.side_effect = link
        result = execution.process_member_at(20, 40)
        self.assertEqual((result['pid'], result['startTicks'], result['ppid']), (20, 200, 10))
        self.assertEqual(result['nspid'], [20, 2]); self.assertTrue(all(s.closed for s in streams))

    def test_reap_or_permission_failure_during_enrichment_has_no_fallback(self):
        for error in (ProcessLookupError(3, 'reaped'), PermissionError(13, 'denied')):
            with patch.object(execution, 'process_ancestry_at', return_value=row()), \
                 patch.object(execution, 'proc_text_at', side_effect=error):
                with self.assertRaises(type(error)): execution.process_member_at(20, 40)
        self.readlink.assert_not_called()

    def test_process_text_rejects_arbitrary_or_traversal_leaf(self):
        for leaf in ('../status', '/proc/999/status', 'ns/pid', 'cmdline'):
            with self.assertRaisesRegex(ValueError, 'Unsupported'): execution.proc_text_at(40, leaf)
        self.open.assert_not_called()

    def test_fdopen_failure_remains_primary_when_transient_close_also_fails(self):
        primary = ProcessLookupError(3, 'fdopen primary')
        self.open.side_effect = None; self.open.return_value = 42
        self.fdopen.side_effect = primary; self.close.side_effect = OSError(9, 'close secondary')
        with self.assertRaises(ProcessLookupError) as result: execution.proc_text_at(40, 'stat')
        self.assertIs(result.exception, primary); self.assertTrue(primary.__notes__)

    def test_read_failure_remains_primary_when_stream_close_also_fails(self):
        primary = PermissionError(13, 'read primary')
        def read(): raise primary
        def close(): raise OSError(5, 'stream close secondary')
        self.open.side_effect = None; self.open.return_value = 42
        self.fdopen.side_effect = None; self.fdopen.return_value = SimpleNamespace(read=read, close=close)
        with self.assertRaises(PermissionError) as result: execution.proc_text_at(40, 'status')
        self.assertIs(result.exception, primary); self.assertTrue(primary.__notes__)

    def test_observe_member_demands_pair_and_uses_exact_directory(self):
        watch = self.watch(); watch.pidfds[(20, 200)] = 41; watch.procdirs[(20, 200)] = 40
        with patch.object(execution, 'process_member_at', return_value=row()) as member:
            self.assertEqual(watch.observe_member(20, {20: row()}, 'first'), row())
            member.assert_called_once_with(20, 40)
        watch.procdirs.clear()
        with self.assertRaisesRegex(ValueError, 'paired'): watch.observe_member(20, {20: row()}, 'first')

    def test_owned_rows_still_reject_ppid_change_after_successful_pair(self):
        parent = row(10, 100, 1); census = {10: parent, 20: row()}
        with self.assertRaises(execution.OwnedIdentityComparisonFault):
            execution.owned_process_rows(census, parent, set(), {},
                lambda pid: parent if pid == 10 else row(ppid=1))

    def test_finish_joins_before_closing_both_handles_and_retires_maps(self):
        watch = self.watch(); watch.pidfds[(20, 200)] = 41; watch.procdirs[(20, 200)] = 40
        events = []; watch.thread.join = lambda timeout: events.append('join')
        self.close.side_effect = lambda fd: events.append(('close', fd))
        with patch.object(execution.time, 'monotonic', return_value=1): watch.finish(cleanup_deadline=2)
        self.assertEqual(events, ['join', ('close', 41), ('close', 40)])
        self.assertEqual(watch.pidfds, {}); self.assertEqual(watch.procdirs, {}); self.assertTrue(watch.handles_closed)

    def test_join_failure_retains_both_handles_and_does_not_close(self):
        watch = self.watch(); watch.pidfds[(20, 200)] = 41; watch.procdirs[(20, 200)] = 40
        watch.thread.is_alive = lambda: True
        with self.assertRaisesRegex(ValueError, 'did not stop'): watch.finish()
        self.close.assert_not_called(); self.assertFalse(watch.handles_closed)
        self.assertEqual(watch.procdirs, {(20, 200): 40})

    def test_stream_close_failure_still_closes_process_handles(self):
        watch = self.watch(); watch.pidfds[(20, 200)] = 41; watch.procdirs[(20, 200)] = 40
        def fail(): raise OSError(5, 'stream failed')
        watch.stream = SimpleNamespace(close=fail)
        with self.assertRaisesRegex(OSError, 'stream failed'): watch.finish()
        self.assertEqual([c.args[0] for c in self.close.call_args_list], [41, 40])
        self.assertTrue(watch.handles_closed)

    def test_finish_close_error_still_attempts_every_handle_and_blocks_reuse(self):
        watch = self.watch(); watch.pidfds[(20, 200)] = 41; watch.procdirs[(20, 200)] = 40
        self.close.side_effect = [OSError(9, 'close failed'), None]
        with self.assertRaises(OSError): watch.finish()
        self.assertEqual([c.args[0] for c in self.close.call_args_list], [41, 40])
        self.assertTrue(watch.handles_closed); self.assertEqual(watch.procdirs, {})
        with self.assertRaisesRegex(ValueError, 'already closed'): watch.pin_identity(row(), 'first')
        with self.assertRaisesRegex(ValueError, 'already closed'): watch.observe_member(20, {20: row()}, 'first')
        with self.assertRaisesRegex(ValueError, 'already closed'): watch.pin_direct(SimpleNamespace(pid=20))
        self.pidfd.assert_not_called(); self.open.assert_not_called()

    def test_gate_namespace_handle_open_is_relative_not_numeric(self):
        watch = self.watch(); watch.parent.update(pidNamespace='pid:[1]', nspid=[10])
        gate = {**row(), 'rss': 1, 'nspid': [20, 2], 'pidNamespace': 'pid:[123]'}
        init = {**row(19, 190, 10), 'rss': 1, 'nspid': [19, 1], 'pidNamespace': 'pid:[123]'}
        watch.observe = lambda: [gate, init]
        watch.pidfds = {(20, 200): 41, (19, 190): 43}; watch.procdirs = {(20, 200): 40, (19, 190): 44}
        watch.namespaces = set(); self.open.side_effect = None; self.open.return_value = 45
        with patch.object(execution.os, 'fstat', return_value=SimpleNamespace(st_ino=123)):
            watch.bind_gate({'startTicks': 200, 'pid': 2, 'pidNamespace': 'pid:[123]'}, SimpleNamespace(pid=18))
        self.open.assert_called_once_with('ns/pid', execution.os.O_RDONLY | execution.os.O_CLOEXEC, dir_fd=40)


if __name__ == '__main__':
    try:
        unittest.main(verbosity=2)
    finally:
        for guard in reversed(GUARDS): guard.stop()
