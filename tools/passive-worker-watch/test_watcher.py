import ast
import copy
import importlib.util
import json
import os
from pathlib import Path
import plistlib
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import watcher
import service

CONFIG = watcher.configuration(ROOT / 'managed.json')
IDS = list(watcher.EXPECTED.values())


def observation(at, status='clear', identity='111:start', **updates):
    value = {'version': 1, 'sampleId': str(at), 'at': at, 'trusted': True,
             'complete': True, 'appIdentity': identity,
             'rows': {ident: {'count': 1, 'visible': True, 'status': status} for ident in IDS}}
    value.update(updates)
    return value


def stopped(state, start=1000, kind='clear'):
    watcher.observe(state, observation(start, 'working'), [], CONFIG, start)
    watcher.observe(state, observation(start + 30, kind), [], CONFIG, start + 30)
    return watcher.observe(state, observation(start + 60, kind), [], CONFIG, start + 60)


class TransitionTests(unittest.TestCase):
    def setUp(self):
        self.state = watcher.initial(CONFIG)

    def test_managed_four_are_exact(self):
        self.assertEqual({w['number'] for w in CONFIG['workers']}, {1, 2, 3, 5})
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'managed.json'
            value = copy.deepcopy(CONFIG)
            value['workers'].append({'number': 7, 'id': 'parked', 'title': 'Worker 7'})
            path.write_text(json.dumps(value))
            with self.assertRaises(ValueError):
                watcher.configuration(path)

    def test_stale_idle_never_alerts(self):
        for now in range(1000, 2000, 30):
            self.assertEqual(watcher.observe(self.state, observation(now), [], CONFIG, now), [])
        self.assertEqual(self.state['pending'], [])

    def test_working_two_clear_alerts_once(self):
        events = stopped(self.state)
        self.assertEqual(len(events), 4)
        self.assertTrue(all(e['status'] == 'idle' for e in events))
        for now in range(1090, 2000, 30):
            self.assertEqual(watcher.observe(self.state, observation(now), [], CONFIG, now), [])

    def test_single_clear_and_cached_sample_do_not_confirm(self):
        watcher.observe(self.state, observation(1000, 'working'), [], CONFIG, 1000)
        for now in [1030, 1031, 1032]:
            self.assertEqual(watcher.observe(self.state, observation(1030), [], CONFIG, now), [])
        self.assertEqual(self.state['pending'], [])

    def test_confirmation_minimum_is_required(self):
        watcher.observe(self.state, observation(1000, 'working'), [], CONFIG, 1000)
        watcher.observe(self.state, observation(1030), [], CONFIG, 1030)
        self.assertEqual(watcher.observe(self.state, observation(1040), [], CONFIG, 1040), [])
        self.assertEqual(len(watcher.observe(self.state, observation(1050), [], CONFIG, 1050)), 4)

    def test_unknown_duplicate_hidden_disarm(self):
        for defect in ['incomplete', 'duplicate', 'hidden', 'missing', 'untrusted', 'unknown']:
            with self.subTest(defect=defect):
                state = watcher.initial(CONFIG)
                watcher.observe(state, observation(1000, 'working'), [], CONFIG, 1000)
                obs = observation(1030)
                if defect == 'incomplete': obs['complete'] = False
                elif defect == 'duplicate': obs['rows'][IDS[0]]['count'] = 2
                elif defect == 'hidden': obs['rows'][IDS[0]]['visible'] = False
                elif defect == 'missing': del obs['rows'][IDS[0]]
                elif defect == 'untrusted': obs['trusted'] = False
                else: obs['rows'][IDS[0]]['status'] = 'unknown'
                self.assertEqual(watcher.observe(state, obs, [], CONFIG, 1030), [])
                self.assertEqual(watcher.observe(state, observation(1060), [], CONFIG, 1060), [])
                self.assertEqual(watcher.observe(state, observation(1090), [], CONFIG, 1090), [])

    def test_parked_workers_ignored(self):
        obs = observation(1000)
        obs['rows']['parked-worker4'] = {'count': 1, 'visible': True, 'status': 'working'}
        watcher.observe(self.state, obs, [], CONFIG, 1000)
        obs = observation(1030)
        obs['rows']['parked-worker4'] = {'count': 1, 'visible': True, 'status': 'clear'}
        watcher.observe(self.state, obs, [], CONFIG, 1030)
        self.assertEqual(watcher.observe(self.state, observation(1060), [], CONFIG, 1060), [])
        self.assertEqual(set(self.state['workers']), set(IDS))

    def test_app_restart_and_long_gap_require_fresh_working(self):
        for at, identity in [(1030, '222:new'), (1200, '111:start')]:
            state = watcher.initial(CONFIG)
            watcher.observe(state, observation(1000, 'working'), [], CONFIG, 1000)
            watcher.observe(state, observation(at, identity=identity), [], CONFIG, at)
            self.assertEqual(watcher.observe(state, observation(at + 30, identity=identity), [], CONFIG, at + 30), [])

    def test_explicit_system_error_only_after_working(self):
        self.assertEqual(watcher.observe(self.state, observation(1000, 'systemError'), [], CONFIG, 1000), [])
        self.assertTrue(all(e['status'] == 'systemError' for e in stopped(self.state, 1030, 'systemError')))

    def test_self_report_suppresses_duplicate_but_old_report_does_not(self):
        watcher.observe(self.state, observation(1000, 'working'), [], CONFIG, 1000)
        watcher.observe(self.state, observation(1030), [], CONFIG, 1030)
        reports = [{'worker': IDS[0], 'at': 1050}, {'worker': IDS[1], 'at': 999}]
        events = watcher.observe(self.state, observation(1060), reports, CONFIG, 1060)
        self.assertTrue(events[0]['coveredBySelfReport'])
        self.assertEqual(len(self.state['pending']), 3)

    def test_new_active_episode_rearms_once(self):
        first = stopped(self.state)
        second = stopped(self.state, 1090)
        self.assertEqual([e['epoch'] for e in first], [1] * 4)
        self.assertEqual([e['epoch'] for e in second], [2] * 4)

    def test_restart_does_not_replay_stop_or_pending_event(self):
        stopped(self.state)
        watcher.restart(self.state, CONFIG)
        self.assertEqual(self.state['pending'], [])
        for now in [1090, 1120]:
            self.assertEqual(watcher.observe(self.state, observation(now), [], CONFIG, now), [])

    def test_clock_future_or_backwards_is_safe(self):
        self.assertFalse(watcher.usable(observation(1200), CONFIG, 1000))
        watcher.observe(self.state, observation(1000, 'working'), [], CONFIG, 1000)
        watcher.observe(self.state, observation(990), [], CONFIG, 990)
        self.assertEqual(watcher.observe(self.state, observation(1020), [], CONFIG, 1020), [])


class NotificationTests(unittest.TestCase):
    def setUp(self):
        self.state = watcher.initial(CONFIG)
        stopped(self.state)

    def test_durable_intent_precedes_one_batched_notification(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'state.json'
            calls = []
            def send(text):
                on_disk = json.loads(path.read_text())
                self.assertEqual(on_disk['attempts'][-1]['state'], 'uncertain')
                self.assertEqual(on_disk['pending'], [])
                calls.append(text)
                return {'confirmed': True}
            persist = lambda state: watcher.atomic(path, state)
            watcher.notify_pending(self.state, CONFIG, [], 1060, persist, send)
            watcher.notify_pending(self.state, CONFIG, [], 1090, persist, send)
            self.assertEqual(len(calls), 1)
            self.assertEqual(calls[0].count('chat_id='), 4)

    def test_uncertain_timeout_and_nonzero_never_loop_even_after_restart(self):
        for failure in [TimeoutError('timeout'), {'confirmed': False, 'exitCode': 1}, {'confirmed': False, 'exitCode': 0}]:
            state = watcher.initial(CONFIG)
            stopped(state)
            calls = []
            def send(_):
                calls.append(True)
                if isinstance(failure, Exception): raise failure
                return failure
            watcher.notify_pending(state, CONFIG, [], 1060, lambda s: None, send)
            self.assertTrue(state['outputBlocked'])
            watcher.restart(state, CONFIG)
            stopped(state, 2000)
            watcher.notify_pending(state, CONFIG, [], 3000, lambda s: None, send)
            self.assertEqual(len(calls), 1)

    def test_crash_after_intent_blocks_on_restart(self):
        self.state['attempts'] = [{'at': 1060, 'state': 'uncertain'}]
        watcher.restart(self.state, CONFIG)
        self.assertTrue(self.state['outputBlocked'])

    def test_rate_bound_and_expiry(self):
        self.state['lastAttemptAt'] = 1040
        calls = []
        output = lambda text: calls.append(text) or {'confirmed': True}
        self.assertIsNone(watcher.notify_pending(self.state, CONFIG, [], 1060, lambda s: None, output))
        watcher.notify_pending(self.state, CONFIG, [], 1100, lambda s: None, output)
        self.assertEqual(len(calls), 1)
        state = watcher.initial(CONFIG)
        stopped(state)
        watcher.notify_pending(state, CONFIG, [], 1200, lambda s: None, output)
        self.assertEqual(len(calls), 1)

    def test_fresh_activity_cancels_pending_and_database_failure_blocks_output(self):
        output = lambda _: self.fail('must not enqueue')
        watcher.notify_pending(self.state, CONFIG, None, 1060, lambda s: None, output)
        watcher.observe(self.state, observation(1090, 'working'), [], CONFIG, 1090)
        watcher.notify_pending(self.state, CONFIG, [], 1090, lambda s: None, output)

    def test_queue_command_is_exact_and_wrong_thread_stdout_fails(self):
        with patch.object(watcher, 'child', return_value=watcher.subprocess.CompletedProcess([], 0, 'Queued message abc for thread other.', '')) as child:
            self.assertFalse(watcher.enqueue('notice')['confirmed'])
            self.assertEqual(child.call_args.args[0], [str(watcher.CLI), 'queue', '--thread', watcher.COORDINATOR, '--message', 'notice'])


class StorageAndServiceTests(unittest.TestCase):
    def test_corrupt_state_preserved_and_output_fused(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'state.json'
            path.write_text('{broken')
            state = watcher.load_state(path, CONFIG)
            self.assertTrue(state['outputBlocked'])
            saved = list(Path(tmp).glob('state.corrupt.*.json'))
            self.assertEqual(saved[0].read_text(), '{broken')

    def test_singleton_and_stale_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            with watcher.singleton(root):
                with self.assertRaises(BlockingIOError):
                    with watcher.singleton(root): pass
            with watcher.singleton(root): pass
            state = watcher.initial(CONFIG)
            state['process'] = {'pid': 99999, 'running': True}
            watcher.atomic(root / 'state.json', state)
            self.assertEqual(watcher.load_state(root / 'state.json', CONFIG)['workers'][IDS[0]]['phase'], 'unknown')

    def test_pid_reuse_or_different_command_refuses_disable(self):
        runtime = Path('/tmp/owned/runtime')
        first = {'pid': 42, 'description': 'old ' + str(runtime / 'watcher.py') + ' run --state-dir /tmp/owned'}
        self.assertTrue(service.matching_process(first, runtime, first))
        self.assertFalse(service.matching_process(first, runtime, {**first, 'description': 'new unrelated'}))
        with patch.object(service, 'status', return_value={'registered': True, 'pid': 42, 'processVerified': False, 'plistOwned': True}), patch.object(service, 'launchctl') as ctl:
            with self.assertRaises(RuntimeError): service.disable(Path('/tmp/owned'), Path('/tmp/agent'))
            ctl.assert_not_called()

    def test_launch_agent_has_one_exact_daemon_and_no_shell(self):
        root = Path('/tmp/owned')
        spec = service.agent_spec(root / 'runtime', root, Path('/usr/bin/python3'))
        self.assertEqual(spec['Label'], service.LABEL)
        self.assertEqual(spec['KeepAlive'], {'Crashed': True})
        self.assertNotIn('StartInterval', spec)
        self.assertEqual(spec['ProgramArguments'][1:3], ['/tmp/owned/runtime/watcher.py', 'run'])
        self.assertEqual(plistlib.loads(plistlib.dumps(spec)), spec)

    def test_uninstall_preserves_owned_plist_and_all_receipts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / 'agent.plist'
            path.write_bytes(plistlib.dumps(service.agent_spec(root / 'runtime', root, Path('/usr/bin/python3'))))
            (root / 'state.json').write_text('historical state')
            with patch.object(service, 'disable', return_value={'disabled': True}):
                service.uninstall(root, path)
            self.assertFalse(path.exists())
            self.assertEqual((root / 'state.json').read_text(), 'historical state')
            self.assertEqual(len(list((root / 'receipts').glob('*.plist'))), 1)

    def test_blocked_or_stale_dry_receipt_cannot_install(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            dry = root / 'dry.json'; tests = root / 'tests.json'
            dry.write_text(json.dumps({'status': 'blocked'})); tests.write_text('{}')
            with patch.object(watcher, 'fingerprints', return_value={}):
                with self.assertRaises(RuntimeError): service.validate_gate(ROOT, root, dry, tests, 1000)

    def test_logs_are_bounded(self):
        with tempfile.TemporaryDirectory() as tmp:
            log = watcher.logger(Path(tmp))
            for _ in range(400): log.info('x' * 2048)
            for handler in log.handlers: handler.close()
            logs = list(Path(tmp).glob('watcher.log*'))
            self.assertLessEqual(len(logs), 3)
            self.assertTrue(all(p.stat().st_size <= 262144 for p in logs))

    def test_local_databases_read_only_and_headers_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name, tables in [('queue_1.sqlite', ['queued_items']), ('thread_history_1.sqlite', ['thread_items', 'thread_realtime_items'])]:
                db = sqlite3.connect(root / name)
                for table in tables:
                    db.execute(f'CREATE TABLE {table}(thread_id TEXT, created_at_ms INTEGER, payload_json TEXT, item_json TEXT, item_type TEXT)')
                    for number in [1, 2, 3, 4, 5, 6, 7]:
                        payload = json.dumps({'content': [{'type': 'text', 'text': f'Worker{number} | #test | DONE\nNo body retained'}]})
                        db.execute(f'INSERT INTO {table} VALUES(?,?,?,?,?)', (watcher.COORDINATOR, 1050000, payload, payload, 'userMessage'))
                db.commit(); db.close()
            before = {p.name: watcher.sha(p) for p in root.glob('*.sqlite')}
            reports = watcher.read_reports(root, CONFIG, 1000, 1100)
            self.assertEqual({r['worker'] for r in reports}, set(IDS))
            self.assertTrue(all(set(r) == {'worker', 'at', 'stop'} for r in reports))
            self.assertEqual(before, {p.name: watcher.sha(p) for p in root.glob('*.sqlite')})
            with self.assertRaises(sqlite3.OperationalError):
                ro = sqlite3.connect((root / 'queue_1.sqlite').as_uri() + '?mode=ro', uri=True)
                try: ro.execute('DELETE FROM queued_items')
                finally: ro.close()

    def test_retired_explicit_identity_and_quoted_headers_ignored(self):
        for text in ['Worker1 | chat_id=retired | #x | DONE', '> Worker1 | #x | DONE', 'Worker4 | #x | DONE']:
            self.assertIsNone(watcher.parse_report(json.dumps({'content': [{'type': 'text', 'text': text}]}), 1, CONFIG))


class SurfaceTests(unittest.TestCase):
    def test_no_network_task_or_input_code_in_runtime(self):
        files = [ROOT / 'watcher.py', ROOT / 'service.py', ROOT / 'sidebar.swift']
        banned = ['list_threads', 'read_thread', 'wait_threads', 'navigate_to_codex_page',
                  'send_message_to_thread', 'rpc_session', 'app-chat-send', 'CGEvent(',
                  'postToPid', 'AXUIElementPerformAction', 'AXUIElementSetAttributeValue',
                  '.activate(', 'AXIsProcessTrustedWithOptions', 'screenshot', 'urllib',
                  'requests.', 'http.client', 'websocket', 'socket.', 'shell=True', 'os.system']
        for file in files:
            text = file.read_text()
            for token in banned:
                self.assertNotIn(token, text, (file.name, token))
        for file in files[:2]:
            tree = ast.parse(file.read_text())
            imports = {node.names[0].name.split('.')[0] for node in ast.walk(tree) if isinstance(node, ast.Import)}
            self.assertTrue(imports <= {'argparse','fcntl','hashlib','json','logging','math','os','re','signal','sqlite3','subprocess','tempfile','time','uuid','plistlib','shutil','sys','watcher'})

    def test_monitoring_only_calls_passive_sampler(self):
        with patch.object(watcher, 'child', return_value=watcher.subprocess.CompletedProcess([], 0, json.dumps(observation(1000)), '')) as call:
            watcher.sample(Path('/tmp/sidebar'), ROOT / 'managed.json')
            self.assertEqual(call.call_args.args[0], ['/tmp/sidebar', str(ROOT / 'managed.json')])
        self.assertIn('"AXWebArea", "AXTextArea", "AXMenu"', (ROOT / 'sidebar.swift').read_text())

    def test_dry_block_does_not_send_or_retry(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            value = observation(1000, trusted=False, reason='accessibility-not-trusted')
            with patch.object(watcher, 'fingerprints', return_value={}), patch.object(watcher, 'sample', return_value=value) as sampler, patch.object(watcher, 'enqueue') as output, patch.object(watcher, 'read_reports') as records:
                result = watcher.dry(ROOT, root / 'sidebar', root, root / 'dry.json')
            self.assertEqual(result['status'], 'blocked')
            self.assertEqual(result['notificationCalls'], 0)
            sampler.assert_called_once(); output.assert_not_called(); records.assert_not_called()

    def test_dry_success_still_never_emits_notification(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            with patch.object(watcher, 'fingerprints', return_value={}), patch.object(watcher, 'sample', side_effect=[observation(1000,'working'), observation(1020)]), patch.object(watcher, 'read_reports', return_value=[]), patch.object(watcher.time, 'time', side_effect=[1000,1000,1000,1000,1020,1020,1020,1020]), patch.object(watcher.time, 'sleep'), patch.object(watcher, 'enqueue') as output:
                result = watcher.dry(ROOT, root / 'sidebar', root, root / 'dry.json')
            self.assertEqual(result['status'], 'passed')
            output.assert_not_called()


class FinalBoundaryTests(unittest.TestCase):
    def test_titles_cannot_redirect_to_parked_rows(self):
        with tempfile.TemporaryDirectory() as tmp:
            value = copy.deepcopy(CONFIG)
            value['workers'][0]['title'] = 'Worker 4 - xhigh'
            path = Path(tmp) / 'managed.json'
            path.write_text(json.dumps(value))
            with self.assertRaises(ValueError): watcher.configuration(path)

    def test_persistent_disable_without_a_running_pid(self):
        value = {'registered': False, 'pid': None, 'processVerified': False, 'plistOwned': True}
        with patch.object(service, 'status', return_value=value), patch.object(service, 'launchctl', return_value=watcher.subprocess.CompletedProcess([], 0, '', '')) as call:
            result = service.disable(Path('/tmp/owned'), Path('/tmp/owned.plist'))
        self.assertTrue(result['disabled'])
        call.assert_called_once_with('disable', f'gui/{os.getuid()}/{service.LABEL}')

    def test_cleanup_uncertainty_stops_instead_of_continuing(self):
        state = watcher.initial(CONFIG)
        stopped(state)
        def unsafe(_): raise watcher.CleanupUnverified('identity unavailable')
        with self.assertRaises(watcher.CleanupUnverified):
            watcher.notify_pending(state, CONFIG, [], 1060, lambda s: None, unsafe)
        self.assertTrue(state['outputBlocked'])
        self.assertEqual(state['attempts'][-1]['state'], 'uncertain')

    def test_wrong_or_future_report_does_not_suppress(self):
        state = watcher.initial(CONFIG)
        watcher.observe(state, observation(1000, 'working'), [], CONFIG, 1000)
        watcher.observe(state, observation(1030), [], CONFIG, 1030)
        reports = [{'worker': 'parked', 'at': 1050}, {'worker': IDS[0], 'at': 9999}]
        self.assertEqual(len(watcher.observe(state, observation(1060), reports, CONFIG, 1060)), 4)
        self.assertEqual(len(state['pending']), 4)

    def test_green_install_gate_is_source_and_binary_bound(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            expected = {'sampler': 'same'}
            dry = {'status': 'passed', 'notificationCalls': 0, 'fingerprints': expected,
                   'sourceUnchanged': True, 'finishedAt': 1060,
                   'samples': [observation(1000), observation(1020)]}
            (root / 'dry.json').write_text(json.dumps(dry))
            (root / 'tests.json').write_text(json.dumps({'status': 'passed', 'fingerprints': expected}))
            with patch.object(watcher, 'fingerprints', return_value=expected):
                self.assertEqual(service.validate_gate(ROOT, root, root / 'dry.json', root / 'tests.json', 1070), expected)
                with self.assertRaises(RuntimeError): service.validate_gate(ROOT, root, root / 'dry.json', root / 'tests.json', 3000)
            with patch.object(watcher, 'fingerprints', return_value={'sampler': 'changed'}):
                with self.assertRaises(RuntimeError): service.validate_gate(ROOT, root, root / 'dry.json', root / 'tests.json', 1070)

    def test_read_failure_never_creates_a_database(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(sqlite3.OperationalError): watcher.read_reports(Path(tmp), CONFIG, 1000, 1100)
            self.assertEqual(list(Path(tmp).iterdir()), [])


if __name__ == '__main__':
    unittest.main(verbosity=2)
