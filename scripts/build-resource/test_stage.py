import json
import os
import signal
import io
from contextlib import redirect_stdout
import time
import unittest
from unittest.mock import patch
from launcher import PreLaunchFailure, run_owned
from observer import observe
from stage import main, measure, emit

class TelemetryTests(unittest.TestCase):
    def test_exact_command_and_cadence_success(self):
        args = []
        def spawn(argv, **opts):
            args.append((argv, opts))
            return 0, {"rows": [], "maximaKiB": {"pssKiB": None}}
        marks = iter([0, 17_900_000_000])
        disk = iter([4096, 2048])
        raw, data = measure("/tmp/tool/bin/pnpm", spawn=spawn, free=lambda: next(disk), clock=lambda: next(marks))
        self.assertEqual(args, [(["/tmp/tool/bin/pnpm", "run", "build"], {"duration": 15, "interval": 250})])
        self.assertEqual(raw, 0)
        self.assertEqual(data["stageObservedElapsedMsIncludingMonitor"], 17900)
        self.assertEqual((data["availableBytesBefore"], data["availableBytesAfter"]), (4096, 2048))
        self.assertIsNone(data["observation"]["maximaKiB"]["pssKiB"])

    def test_failure_with_unavailable_measurement_is_saved(self):
        args = []
        def spawn(argv, **options):
            args.append(argv)
            return 17 << 8, {"status": "sampler-unavailable"}
        raw, data = measure("/usr/bin/npm", spawn=spawn, free=lambda: None)
        self.assertEqual(args, [["/usr/bin/npm", "run", "build"]])
        self.assertEqual((raw, data["buildExitCode"], data["buildSignal"]), (17 << 8, 17, None))
        out = io.StringIO()
        with redirect_stdout(out):
            emit(data)
        lines = out.getvalue().splitlines()
        self.assertEqual(len([line for line in lines if line]), 1)
        self.assertEqual(json.loads(lines[-1].split(" ", 1)[1]), data)

    def test_invalid_entry_is_rejected_without_start(self):
        for invalid in ["npm", "/usr/bin/sh", "/usr/bin/npx"]:
            with self.assertRaises(ValueError):
                measure(invalid, spawn=self.fail)

    def test_missing_receipt_does_not_replace_build_status(self):
        with patch("stage.measure", return_value=(17 << 8, {})) as x, patch("stage.emit", side_effect=OSError), patch("sys.stderr"):
            self.assertEqual(main(["--executable", "/usr/bin/npm"]), 17)
            x.assert_called_once_with("/usr/bin/npm")

    def test_signal_is_recorded_without_faking_exit(self):
        raw, data = measure("/usr/bin/npm", spawn=lambda *a, **kw: (signal.SIGTERM, {}), free=lambda: None)
        self.assertEqual(raw, signal.SIGTERM)
        self.assertIsNone(data["buildExitCode"])
        self.assertEqual(data["buildSignal"], signal.SIGTERM)

    def test_ineligible_output_does_not_create_file(self):
        with self.assertRaises(ValueError):
            emit({"rows": "x" * 4096})

    def test_cooperative_stop_keeps_partial_numeric_rows(self):
        sampled = {"status": "observed", "members": 3, "pssKiB": 42}
        with patch("observer.sample", return_value=sampled) as item, patch("observer.time.sleep"):
            stopped = iter([False, True, True])
            report = observe(20, 10, stopped=lambda: next(stopped, True))
        self.assertEqual(item.call_count, 1)
        self.assertEqual(report["maximaKiB"]["pssKiB"], 42)
        self.assertEqual(len(report["rows"]), 1)

    def test_owned_wait_keeps_fast_failure_and_stops_sampler(self):
        def monitor(pid, start, *, duration_seconds, interval_ms, stopped):
            while not stopped():
                time.sleep(0.005)
            streams = [os.fstat(fd) for fd in (0, 1, 2)]
            null = os.stat(os.devnull)
            return {"status": "stopped", "rows": [{"elapsedMs": 1}],
                    "detached": all((st.st_dev, st.st_ino) == (null.st_dev, null.st_ino) for st in streams)}
        began = time.monotonic()
        status, report = run_owned(["/bin/sh", "-c", "exit 17"], duration=3, sampler=monitor)
        self.assertEqual(os.waitstatus_to_exitcode(status), 17)
        self.assertLess(time.monotonic() - began, 2.0)
        self.assertEqual(report["status"], "stopped")
        self.assertEqual(report["rows"], [{"elapsedMs": 1}])
        self.assertTrue(report["detached"])

    def test_observer_deadline_never_waits_blocking_for_stuck_child(self):
        with patch("launcher.os.fork", side_effect=[42, 43]), patch("launcher.read", return_value=""), patch("launcher.stat_id", return_value=(42, 100, os.getpid())), patch("launcher.os.waitpid", side_effect=[(42, 17 << 8), (0, 0), (0, 0)]) as wait, patch("launcher.os.kill") as kill, patch("launcher.time.monotonic", side_effect=[0, 0, 1]):
            code, data = run_owned(["/usr/bin/npm", "run", "build"])
        self.assertEqual((code, data), (17 << 8, {"status": "sampler-timeout"}))
        self.assertEqual([c.args for c in wait.call_args_list], [(42, os.WNOHANG), (43, os.WNOHANG), (43, os.WNOHANG)])
        kill.assert_called_once_with(43, signal.SIGKILL)

    def test_known_prelaunch_pipe_tempfile_and_first_fork_failures(self):
        for target in ["launcher.os.pipe", "launcher.tempfile.TemporaryFile", "launcher.mmap.mmap", "launcher.os.fork"]:
            with self.subTest(target=target), patch(target, side_effect=OSError):
                with self.assertRaises(PreLaunchFailure):
                    run_owned(["/usr/bin/npm", "run", "build"])

    def test_prelaunch_error_execs_original_exactly_once_and_skips_receipt(self):
        class Replaced(Exception):
            pass
        with patch("stage.measure", side_effect=PreLaunchFailure), patch("stage.os.execv", side_effect=Replaced) as ex, patch("stage.emit") as persist_mock, patch("sys.stderr"):
            with self.assertRaises(Replaced):
                main(["--executable", "/usr/bin/npm"])
            ex.assert_called_once_with("/usr/bin/npm", ["/usr/bin/npm", "run", "build"])
            persist_mock.assert_not_called()

    def test_observer_fork_failure_does_not_replace_started_workload(self):
        with patch("launcher.os.fork", side_effect=[42, OSError]) as fork, patch("launcher.read", return_value=""), patch("launcher.stat_id", return_value=(42, 100, os.getpid())), patch("launcher._poll", return_value=17 << 8) as poll:
            code, data = run_owned(["/usr/bin/npm", "run", "build"])
            self.assertEqual((code, data), (17 << 8, {"status": "sampler-unavailable"}))
            self.assertEqual(fork.call_count, 2)
            poll.assert_called_once_with(42)

    def test_known_postfork_error_has_no_prelaunch_marker(self):
        with patch("launcher.os.fork", return_value=42), patch("launcher.read", side_effect=OSError), patch("launcher._poll", side_effect=OSError("after workload fork")):
            with self.assertRaisesRegex(OSError, "after workload fork"):
                run_owned(["/usr/bin/npm", "run", "build"])

    def test_ambiguous_or_postlaunch_failure_never_reexecs(self):
        with patch("stage.measure", side_effect=OSError), patch("stage.os.execv") as ex, patch("stage.emit") as persist_mock:
            with self.assertRaises(OSError):
                main(["--executable", "/usr/bin/npm"])
            ex.assert_not_called()
            persist_mock.assert_not_called()

if __name__ == "__main__":
    unittest.main()
