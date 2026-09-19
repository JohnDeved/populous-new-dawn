import ast
import copy
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import plistlib
import socket
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import records
import watcher
import service

CONFIG = records.configuration(ROOT / 'managed.json')
FIXTURE = json.loads((ROOT / 'fixtures/local-events.json').read_text())
NOW = FIXTURE['now']
IDS = list(records.WORKERS.values())


def iso(value):
    return datetime.fromtimestamp(value, timezone.utc).isoformat()


def payload(text):
    return json.dumps({'content': [{'type': 'text', 'text': text}]})


class DatabaseCase(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.cache = {'electron-persisted-atom-state': {'chatgpt-sidebar-state-v1': {
            'redacted-scope': {'pinnedConversations': [
                {'conversation': {'id': w['id'], 'title': w['title'], 'isTask': True,
                                  'createdAt': iso(NOW - 3600), 'updatedAt': iso(NOW - 10),
                                  'projectId': None}, 'pinnedAt': iso(NOW - 3500)}
                for w in CONFIG['workers']], 'pinnedProjects': [], 'projects': []}},
                'irrelevant-private-field': 'MUST-NOT-RETAIN'}, 'unrelated': 'MUST-NOT-RETAIN'}
        self.write_cache()
        schemas = {
            'state_5.sqlite': ['CREATE TABLE threads(id TEXT PRIMARY KEY)'],
            'queue_1.sqlite': ['CREATE TABLE queued_items(id TEXT,thread_id TEXT,created_at_ms INTEGER,payload_json TEXT)'],
            'thread_history_1.sqlite': [
                'CREATE TABLE thread_items(item_id TEXT,thread_id TEXT,created_at_ms INTEGER,item_json TEXT,item_type TEXT)',
                'CREATE TABLE thread_realtime_items(item_id TEXT,thread_id TEXT,created_at_ms INTEGER,item_json TEXT,item_type TEXT)',
                'CREATE TABLE thread_turns(thread_id TEXT,turn_id TEXT,status TEXT,started_at INTEGER,completed_at INTEGER,error_json TEXT,rollout_ordinal INTEGER)'],
        }
        for name, queries in schemas.items():
            with sqlite3.connect(self.root / name) as connection:
                for sql in queries: connection.execute(sql)
        with sqlite3.connect(self.root / 'state_5.sqlite') as connection:
            connection.execute('INSERT INTO threads VALUES(?)', (records.COORDINATOR,))

    def write_cache(self):
        (self.root / '.codex-global-state.json').write_text(json.dumps(self.cache))

    def rows(self):
        return self.cache['electron-persisted-atom-state']['chatgpt-sidebar-state-v1']['redacted-scope']['pinnedConversations']

    def add_final(self, text='Worker1 | #x | DONE', at=NOW - 1, ident='message-1', table='queued_items', thread=records.COORDINATOR, item_type='userMessage'):
        name = 'queue_1.sqlite' if table == 'queued_items' else 'thread_history_1.sqlite'
        with sqlite3.connect(self.root / name) as connection:
            if table == 'queued_items':
                connection.execute('INSERT INTO queued_items VALUES(?,?,?,?)', (ident, thread, at * 1000, payload(text)))
            else:
                connection.execute(f'INSERT INTO {table} VALUES(?,?,?,?,?)', (ident, thread, at * 1000, payload(text), item_type))

    def add_turn(self, status='failed', at=NOW - 1, ident='turn-1', worker=IDS[0], error='{"code":"synthetic"}', local=True):
        if local:
            with sqlite3.connect(self.root / 'state_5.sqlite') as connection:
                connection.execute('INSERT OR IGNORE INTO threads VALUES(?)', (worker,))
        with sqlite3.connect(self.root / 'thread_history_1.sqlite') as connection:
            connection.execute('INSERT INTO thread_turns VALUES(?,?,?,?,?,?,?)',
                               (worker, ident, status, at - 20, at, error, int(at)))

    def snapshot(self, now=NOW):
        return records.snapshot(self.root, CONFIG, now)

    def state(self, now=NOW - 5):
        return watcher.new_state(CONFIG, self.root, now)


class ReaderTests(DatabaseCase):
    def test_exact_four_identity_and_no_fabricated_activity(self):
        value = self.snapshot()
        self.assertTrue(value['complete'])
        self.assertEqual(set(value['workers']), set(IDS))
        self.assertTrue(all(w['bound'] and w['liveStatus'] == 'unknown' for w in value['workers'].values()))
        self.assertFalse(value['claims']['silentStops'])
        self.assertFalse(value['claims']['activeStatus'])
        self.assertTrue(all(v['recentTurnCount'] == 0 for v in value['localTurnCoverage'].values()))
        self.assertNotIn('MUST-NOT-RETAIN', json.dumps(value))

    def test_stale_cache_is_not_idle_or_fresh(self):
        for row in self.rows():
            row['conversation'].update(createdAt=iso(NOW - 200000), updatedAt=iso(NOW - 100000))
        self.write_cache()
        value = self.snapshot()
        self.assertTrue(value['complete'])
        self.assertTrue(all(not w['metadataFresh'] and w['liveStatus'] == 'unknown' for w in value['workers'].values()))
        self.assertEqual(value['events'], [])

    def test_missing_duplicate_title_mismatch_and_future_metadata(self):
        original = copy.deepcopy(self.cache)
        for fault in ['missing', 'duplicate', 'title', 'future', 'timestamp']:
            self.cache = copy.deepcopy(original)
            if fault == 'missing': self.rows().pop(0)
            elif fault == 'duplicate': self.rows().append(copy.deepcopy(self.rows()[0]))
            elif fault == 'title': self.rows()[0]['conversation']['title'] = 'Worker4 parked'
            elif fault == 'future': self.rows()[0]['conversation']['updatedAt'] = iso(NOW + 1)
            else: self.rows()[0]['conversation']['createdAt'] = 'invalid'
            self.write_cache()
            self.assertFalse(self.snapshot()['complete'], fault)

    def test_parked_metadata_is_never_returned(self):
        self.rows().append({'conversation': {'id': 'parked', 'title': 'Worker 4', 'status': 'failed'}})
        self.write_cache()
        self.add_turn(worker='parked')
        self.add_final('Worker4 | #x | DONE')
        value = self.snapshot()
        self.assertNotIn('parked', json.dumps(value))
        self.assertEqual(value['events'], [])

    def test_header_fixtures_filter_only_explicit_finals(self):
        bindings = self.snapshot()['workers']
        for row in FIXTURE['headers']:
            event = records.final_event(payload(row['text']), 'item', NOW - 1, bindings, NOW, 900, 'queued_items')
            self.assertEqual(event is not None, row['accepted'], row['text'])

    def test_timestamp_floor_staleness_and_future_rejected(self):
        bindings = self.snapshot()['workers']
        for at in [NOW + 1, NOW - 901, NOW - 4000]:
            self.assertIsNone(records.final_event(payload('Worker1 | #x | DONE'), 'x', at, bindings, NOW, 900, 'queued_items'))
        bindings[IDS[0]]['createdAt'] = NOW
        self.assertIsNone(records.final_event(payload('Worker1 | #x | DONE'), 'x', NOW - 1, bindings, NOW, 900, 'queued_items'))

    def test_correct_current_explicit_id_and_number_attribution(self):
        self.add_final('Worker1 | chat_id=' + IDS[0] + ' | #x | DONE')
        event = self.snapshot()['events'][0]
        self.assertEqual(event['attribution'], 'explicit-id-self-report')
        self.assertTrue(event['alreadyAddressedToCoordinator'])

    def test_queue_realtime_history_copies_coalesce(self):
        for table in ['queued_items', 'thread_items', 'thread_realtime_items']:
            self.add_final(table=table)
        self.add_final('Worker1  |  #x  | DONE', ident='copy-with-whitespace')
        # Exact copies and repeated whitespace coalesce across all local transports.
        value = self.snapshot()
        self.assertEqual(len(value['events']), 1)
        self.assertEqual(value['eventCounts'], {'queued_items': 2, 'thread_items': 1, 'thread_realtime_items': 1})

    def test_foreign_thread_assistant_quotes_and_bad_payload_ignored(self):
        self.add_final(thread='other-coordinator')
        self.add_final(table='thread_items', item_type='agentMessage')
        self.add_final('intro\nWorker1 | #x | DONE', ident='quoted')
        self.add_final('Worker1 | #x | DONE maybe', ident='not-final')
        self.assertEqual(self.snapshot()['events'], [])

    def test_changed_report_is_new_but_body_not_retained(self):
        self.add_final('Worker1 | #x | DONE\nHead: aaaa', ident='a')
        self.add_final('Worker1 | #x | DONE\nHead: bbbb', ident='b')
        value = self.snapshot()
        self.assertEqual(len(value['events']), 2)
        self.assertNotIn('Head:', json.dumps(value))

    def test_typed_error_is_not_positive_stop(self):
        self.add_turn()
        event = self.snapshot()['events'][0]
        self.assertEqual(event['kind'], 'local_error')
        self.assertNotIn('reportedState', event)
        self.assertNotIn('synthetic', json.dumps(event))
        self.assertFalse(event['alreadyAddressedToCoordinator'])

    def test_completed_interrupted_progress_and_missing_error_do_not_emit(self):
        for index, status in enumerate(['completed', 'interrupted', 'inProgress']):
            self.add_turn(status=status, ident=str(index))
        self.add_turn(error=None, ident='empty')
        self.assertEqual(self.snapshot()['events'], [])

    def test_error_requires_same_local_thread_and_fresh_completion(self):
        self.add_turn(local=False)
        self.add_turn(at=NOW - 901, ident='stale', worker=IDS[1])
        self.add_turn(at=NOW + 1, ident='future', worker=IDS[2])
        self.assertEqual(self.snapshot()['events'], [])

    def test_databases_open_readonly_and_are_not_created(self):
        with records.readonly(self.root, 'queue_1.sqlite') as conn:
            self.assertEqual(conn.execute('PRAGMA query_only').fetchone()[0], 1)
            with self.assertRaises(sqlite3.OperationalError): conn.execute('DELETE FROM queued_items')
        with self.assertRaises(sqlite3.OperationalError):
            with records.readonly(self.root, 'missing.sqlite'): pass
        self.assertFalse((self.root / 'missing.sqlite').exists())
        before = {p.name: watcher.sha(p) for p in self.root.glob('*.sqlite')}
        self.snapshot()
        self.assertEqual(before, {p.name: watcher.sha(p) for p in self.root.glob('*.sqlite')})

    def test_missing_coordinator_or_saturated_window_fails_closed(self):
        with sqlite3.connect(self.root / 'state_5.sqlite') as conn: conn.execute('DELETE FROM threads')
        with self.assertRaises(records.EvidenceUnavailable): self.snapshot()
        with sqlite3.connect(self.root / 'state_5.sqlite') as conn: conn.execute('INSERT INTO threads VALUES(?)', (records.COORDINATOR,))
        with patch.object(records, 'MAX_ROWS', 1):
            # Cache itself exceeds bound; no partial-success claim.
            with self.assertRaises(records.EvidenceUnavailable): self.snapshot()

    def test_no_network_or_process_invocation_during_monitor_read(self):
        with patch.object(subprocess, 'Popen', side_effect=AssertionError('No monitoring subprocess')), \
             patch.object(socket, 'socket', side_effect=AssertionError('No monitoring network')):
            self.assertTrue(self.snapshot()['complete'])


class EventStateTests(DatabaseCase):
    def test_cold_start_baselines_existing_error(self):
        self.add_turn()
        state = self.state(now=NOW)
        watcher.observe(state, self.snapshot(), CONFIG, NOW)
        self.assertEqual(state['pending'], {})
        self.assertEqual(state['events'][-1]['disposition'], 'baseline-or-unsupported')

    def test_finals_are_positive_reported_stop_but_already_notified(self):
        self.add_final('Worker2b | #x | ERROR')
        state = self.state()
        events = watcher.observe(state, self.snapshot(), CONFIG, NOW)
        self.assertEqual(events[0]['disposition'], 'covered-by-coordinator-handoff')
        self.assertEqual(state['latestFinal'][IDS[1]]['reportedState'], 'ERROR')
        self.assertEqual(state['pending'], {})
        watcher.notify_pending(state, CONFIG, NOW, lambda s: None, lambda _: self.fail('duplicate final notice'))

    def test_silence_and_updated_metadata_never_create_idle(self):
        state = self.state()
        for now in [NOW, NOW + 30, NOW + 300, NOW + 900]:
            self.assertEqual(watcher.observe(state, self.snapshot(now), CONFIG, now), [])
        self.assertEqual(state['pending'], {})
        self.assertTrue(all(w['liveStatus'] == 'unknown' for w in state['workers'].values()))

    def test_duplicate_error_once_across_snapshots_and_restart(self):
        self.add_turn()
        state = self.state()
        watcher.observe(state, self.snapshot(), CONFIG, NOW)
        calls = []
        watcher.notify_pending(state, CONFIG, NOW, lambda s: None, lambda text: calls.append(text) or {'confirmed': True})
        path = self.root / 'watch-state.json'
        watcher.atomic(path, state)
        restarted = watcher.load_state(path, CONFIG, self.root, NOW + 30)
        watcher.observe(restarted, self.snapshot(NOW + 30), CONFIG, NOW + 30)
        watcher.notify_pending(restarted, CONFIG, NOW + 90, lambda s: None, lambda text: calls.append(text) or {'confirmed': True})
        self.assertEqual(len(calls), 1)
        self.assertEqual(restarted['pending'], {})

    def test_final_covers_same_or_earlier_error_before_output(self):
        self.add_turn(at=NOW - 3)
        self.add_final(at=NOW - 1)
        state = self.state()
        watcher.observe(state, self.snapshot(), CONFIG, NOW)
        self.assertEqual(state['pending'], {})

    def test_final_arriving_during_backoff_cancels_pending(self):
        self.add_turn(at=NOW - 3)
        state = self.state()
        state['nextNotifyAt'] = NOW + 60
        watcher.observe(state, self.snapshot(), CONFIG, NOW)
        self.assertEqual(len(state['pending']), 1)
        self.add_final(at=NOW + 1)
        watcher.observe(state, self.snapshot(NOW + 30), CONFIG, NOW + 30)
        self.assertEqual(state['pending'], {})

    def test_event_expiry_and_clock_reversal(self):
        self.add_turn()
        state = self.state()
        watcher.observe(state, self.snapshot(), CONFIG, NOW)
        watcher.observe(state, self.snapshot(NOW + 901), CONFIG, NOW + 901)
        self.assertEqual(state['pending'], {})
        with self.assertRaises(records.EvidenceUnavailable): watcher.observe(state, self.snapshot(NOW), CONFIG, NOW)

    def test_durable_intent_before_one_batched_output(self):
        self.add_turn(worker=IDS[0]); self.add_turn(worker=IDS[1], ident='second')
        state = self.state(); watcher.observe(state, self.snapshot(), CONFIG, NOW)
        path = self.root / 'watch-state.json'
        def output(text):
            saved = json.loads(path.read_text())
            self.assertEqual(saved['pending'], {})
            self.assertEqual(saved['attempts'][-1]['state'], 'uncertain')
            self.assertEqual(text.count('chat_id='), 2)
            return {'confirmed': True}
        result = watcher.notify_pending(state, CONFIG, NOW, lambda s: watcher.atomic(path, s), output)
        self.assertTrue(result['confirmed'])
        self.assertEqual(state['nextNotifyAt'], NOW + 60)

    def test_failure_never_retries_same_batch_and_new_event_backs_off(self):
        self.add_turn(); state = self.state(); watcher.observe(state, self.snapshot(), CONFIG, NOW)
        calls = []
        failed = lambda text: calls.append(text) or {'confirmed': False, 'exitCode': 1}
        watcher.notify_pending(state, CONFIG, NOW, lambda s: None, failed)
        self.assertEqual(state['nextNotifyAt'], NOW + 300)
        self.add_turn(at=NOW + 1, ident='new')
        watcher.observe(state, self.snapshot(NOW + 30), CONFIG, NOW + 30)
        watcher.notify_pending(state, CONFIG, NOW + 30, lambda s: None, failed)
        self.assertEqual(len(calls), 1)
        watcher.notify_pending(state, CONFIG, NOW + 300, lambda s: None, failed)
        self.assertEqual(len(calls), 2)
        self.assertEqual(state['nextNotifyAt'], NOW + 900)
        self.assertEqual(state['pending'], {})

    def test_crash_after_intent_consumes_event_across_restart(self):
        self.add_turn(); state = self.state(); watcher.observe(state, self.snapshot(), CONFIG, NOW)
        path = self.root / 'watch-state.json'
        def crash(_): raise KeyboardInterrupt()
        with self.assertRaises(KeyboardInterrupt): watcher.notify_pending(state, CONFIG, NOW, lambda s: watcher.atomic(path, s), crash)
        recovered = watcher.load_state(path, CONFIG, self.root, NOW + 10)
        self.assertEqual(recovered['attempts'][0]['state'], 'unknown-after-restart')
        watcher.observe(recovered, self.snapshot(NOW + 30), CONFIG, NOW + 30)
        self.assertEqual(recovered['pending'], {})

    def test_timeout_and_unconfirmed_success_are_not_retried(self):
        for failure in [TimeoutError('uncertain'), {'confirmed': False, 'exitCode': 0}]:
            state = self.state(); self.add_turn(ident=str(type(failure)))
            watcher.observe(state, self.snapshot(), CONFIG, NOW)
            calls = []
            def output(_):
                calls.append(True)
                if isinstance(failure, Exception): raise failure
                return failure
            watcher.notify_pending(state, CONFIG, NOW, lambda s: None, output)
            watcher.notify_pending(state, CONFIG, NOW + 301, lambda s: None, output)
            self.assertEqual(len(calls), 1)

    def test_corrupt_legacy_or_different_root_state_preserved(self):
        for raw in ['{broken', '{"version":1}', json.dumps(watcher.new_state(CONFIG, Path('/other'), NOW))]:
            path = self.root / 'state.json'; path.write_text(raw)
            recovered = watcher.load_state(path, CONFIG, self.root, NOW)
            self.assertTrue(recovered['outputBlocked'])
            self.assertEqual(recovered['pending'], {})
            self.assertFalse(path.exists())
        self.assertEqual(len(list(self.root.glob('state.preserved.*.json'))), 3)

    def test_cleanup_uncertainty_stops_without_retry(self):
        self.add_turn(); state = self.state(); watcher.observe(state, self.snapshot(), CONFIG, NOW)
        def fail(_): raise watcher.CleanupUnverified('unknown child')
        with self.assertRaises(watcher.CleanupUnverified): watcher.notify_pending(state, CONFIG, NOW, lambda s: None, fail)
        self.assertTrue(state['outputBlocked'])

    def test_delivery_copy_does_not_refresh_final_timestamp(self):
        self.add_final(at=NOW - 3)
        state = self.state()
        watcher.observe(state, self.snapshot(), CONFIG, NOW)
        self.add_final(at=NOW + 10, table='thread_items')
        watcher.observe(state, self.snapshot(NOW + 30), CONFIG, NOW + 30)
        self.assertEqual(state['latestFinal'][IDS[0]]['at'], NOW - 3)
        self.assertEqual(len(state['events']), 1)

    def test_malformed_nested_state_is_preserved_not_replayed(self):
        path = self.root / 'state.json'
        state = self.state(); state['seen'] = {'x': 'not-a-time'}
        path.write_text(json.dumps(state))
        recovered = watcher.load_state(path, CONFIG, self.root, NOW)
        self.assertTrue(recovered['outputBlocked'])
        self.assertEqual(recovered['pending'], {})
        self.assertEqual(len(list(self.root.glob('state.preserved.*.json'))), 1)

    def test_backoff_is_capped_and_success_resets_failure_count(self):
        self.add_turn(); state = self.state(); watcher.observe(state, self.snapshot(), CONFIG, NOW)
        state['notificationFailures'] = 20
        watcher.notify_pending(state, CONFIG, NOW, lambda s: None, lambda _: {'confirmed': False})
        self.assertEqual(state['nextNotifyAt'], NOW + CONFIG['maxFailureBackoffSeconds'])
        self.add_turn(at=NOW + 3601, ident='later')
        watcher.observe(state, self.snapshot(NOW + 3610), CONFIG, NOW + 3610)
        watcher.notify_pending(state, CONFIG, NOW + 3610, lambda s: None, lambda _: {'confirmed': True})
        self.assertEqual(state['notificationFailures'], 0)

    def test_missing_binding_is_unavailable_not_a_worker_error(self):
        state = self.state(); self.rows().pop(); self.write_cache()
        with self.assertRaises(records.EvidenceUnavailable): watcher.observe(state, self.snapshot(), CONFIG, NOW)
        self.assertEqual(state['pending'], {})


class LifecycleAndSurfaceTests(DatabaseCase):
    def test_config_cannot_add_parked_or_redirect_coordinator(self):
        for key, val in [('coordinator', 'other'), ('mode', 'anything')]:
            config = copy.deepcopy(CONFIG); config[key] = val
            p = self.root / 'config.json'; p.write_text(json.dumps(config))
            with self.assertRaises(ValueError): records.configuration(p)
        config = copy.deepcopy(CONFIG); config['workers'].append({'number': 4, 'id': 'parked'})
        p.write_text(json.dumps(config))
        with self.assertRaises(ValueError): records.configuration(p)

    def test_monitoring_source_has_no_process_network_or_ui_import(self):
        tree = ast.parse((ROOT / 'records.py').read_text())
        imported = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import): imported.update(n.name.split('.')[0] for n in node.names)
            elif isinstance(node, ast.ImportFrom): imported.add((node.module or '').split('.')[0])
        self.assertTrue(imported <= {'__future__', 'contextlib', 'datetime', 'hashlib', 'json', 'math', 'pathlib', 're', 'sqlite3', 'time'})
        combined = '\n'.join((ROOT / name).read_text() for name in watcher.SOURCE_NAMES if name.endswith('.py'))
        for bad in ['list_threads', 'read_thread', 'wait_threads', 'navigate_to_codex_page', 'send_message_to_thread',
                    'AXUIElement', 'NSAppleScript', 'sidebar.swift', '--sampler', 'urllib', 'requests.',
                    'socket.', 'http.client', 'shell=True', 'app-chat-send']:
            self.assertNotIn(bad, combined)
        self.assertFalse((ROOT / 'sidebar.swift').exists())

    def test_queue_command_is_only_configured_output_and_confirmation_strict(self):
        with patch.object(watcher, 'child', return_value=subprocess.CompletedProcess([], 0, 'Queued message a for thread wrong.', '')) as call:
            self.assertFalse(watcher.enqueue('notice')['confirmed'])
            self.assertEqual(call.call_args.args[0], [str(watcher.CLI), 'queue', '--thread', records.COORDINATOR, '--message', 'notice'])

    def test_singleton_and_pid_reuse(self):
        with watcher.singleton(self.root):
            with self.assertRaises(BlockingIOError):
                with watcher.singleton(self.root): pass
        with watcher.singleton(self.root): pass
        runtime = Path('/tmp/owned/runtime')
        ident = {'pid': 42, 'description': 'created ' + str(runtime / 'watcher.py') + ' run --state-dir /tmp/owned'}
        self.assertTrue(service.matching_process(ident, runtime, ident))
        self.assertFalse(service.matching_process(ident, runtime, {**ident, 'description': 'different creation'}))

    def test_disable_refuses_unverified_pid(self):
        with patch.object(service, 'status', return_value={'registered': True, 'plistOwned': True, 'pid': 42, 'processVerified': False}), patch.object(service, 'launchctl') as call:
            with self.assertRaises(RuntimeError): service.disable(self.root, self.root / 'agent.plist')
            call.assert_not_called()

    def test_retired_watcher_blocks_install_without_signal_or_bootstrap(self):
        with patch.object(service, 'validate_gate', return_value={}), patch.object(service, 'retired_watcher_processes', return_value=['42 python /old/work/orchestration/worker-watch-cli/watch.py']), patch.object(service, 'launchctl') as ctl:
            with self.assertRaises(RuntimeError): service.install(ROOT, self.root, self.root / 'new-home', self.root / 'agent', self.root / 'dry', self.root / 'tests')
            ctl.assert_not_called()
            self.assertFalse((self.root / 'new-home').exists())

    def test_agent_spec_single_local_process_and_no_sampler(self):
        spec = service.agent_spec(self.root / 'runtime', self.root, Path('/usr/bin/python3'), self.root / 'records')
        self.assertEqual(spec['Label'], service.LABEL)
        self.assertEqual(spec['KeepAlive'], {'Crashed': True})
        self.assertNotIn('--sampler', spec['ProgramArguments'])
        self.assertEqual(spec, plistlib.loads(plistlib.dumps(spec)))

    def test_uninstall_preserves_receipts(self):
        p = self.root / 'agent.plist'
        p.write_bytes(plistlib.dumps(service.agent_spec(self.root / 'runtime', self.root, Path('/usr/bin/python3'), self.root / 'records')))
        (self.root / 'state.json').write_text('receipt')
        with patch.object(service, 'disable', return_value={'disabled': True}): service.uninstall(self.root, p)
        self.assertEqual((self.root / 'state.json').read_text(), 'receipt')
        self.assertFalse(p.exists())
        self.assertEqual(len(list((self.root / 'receipts').glob('*.plist'))), 1)

    def test_dry_reads_once_never_notifies_and_accepts_only_reduced_claims(self):
        self.add_final()
        destination = self.root / 'dry.json'
        with patch.object(watcher.time, 'time', return_value=NOW), patch.object(watcher, 'enqueue') as output:
            result = watcher.dry(ROOT, self.root, destination)
        self.assertEqual(result['status'], 'passed')
        self.assertFalse(result['snapshot']['claims']['silentStops'])
        self.assertEqual(result['notificationCalls'], 0)
        self.assertEqual(result['coldStartPending'], 0)
        output.assert_not_called()

    def test_green_gate_binds_source_root_freshness_and_honest_claims(self):
        dry_path = self.root / 'dry.json'; tests_path = self.root / 'tests.json'
        with patch.object(watcher.time, 'time', return_value=NOW): watcher.dry(ROOT, self.root, dry_path)
        tests_path.write_text(json.dumps(valid_test_receipt(NOW)))
        self.assertEqual(service.validate_gate(ROOT, self.root, dry_path, tests_path, NOW + 1), watcher.fingerprints(ROOT))
        with self.assertRaises(RuntimeError): service.validate_gate(ROOT, self.root, dry_path, tests_path, NOW + 901)
        value = json.loads(dry_path.read_text()); value['snapshot']['claims']['activeStatus'] = True
        dry_path.write_text(json.dumps(value))
        with self.assertRaises(RuntimeError): service.validate_gate(ROOT, self.root, dry_path, tests_path, NOW + 1)

    def test_logs_and_receipts_are_bounded(self):
        log = watcher.logger(self.root)
        for _ in range(400): log.info('x' * 2048)
        for handler in log.handlers: handler.close()
        self.assertLessEqual(len(list(self.root.glob('watcher.log*'))), 3)
        self.assertTrue(all(p.stat().st_size <= 262144 for p in self.root.glob('watcher.log*')))


def valid_test_receipt(now):
    import verify
    return {'version': 1, 'kind': 'passive-watcher-tests', 'status': 'passed',
            'startedAt': now - 1, 'finishedAt': now, 'exitCode': 0,
            'testsDiscovered': 44, 'testsRun': 44, 'testsPassed': 44,
            'failures': 0, 'errors': 0, 'skipped': 0, 'exceptional': 0,
            'fingerprints': watcher.fingerprints(ROOT),
            'testFingerprints': verify.test_fingerprints(ROOT), 'sourceUnchanged': True}


class Reviewer1bRegressions(DatabaseCase):
    def test_delayed_identical_final_cannot_cover_newer_error_after_1800s(self):
        self.add_final(at=NOW - 1)
        state = self.state()
        watcher.observe(state, self.snapshot(), CONFIG, NOW)
        original = copy.deepcopy(state['latestFinal'][IDS[0]])
        later = NOW + 1801
        watcher.observe(state, self.snapshot(later), CONFIG, later)  # Old transient window is empty.
        path = self.root / 'state.json'
        watcher.atomic(path, state)
        state = watcher.load_state(path, CONFIG, self.root, later)
        self.add_final(at=later + 2, ident='delayed-copy', table='thread_items')
        self.add_turn(at=later + 1, ident='genuinely-new-error')
        watcher.observe(state, self.snapshot(later + 3), CONFIG, later + 3)
        self.assertEqual(state['latestFinal'][IDS[0]]['at'], original['at'])
        self.assertEqual(state['latestFinal'][IDS[0]]['key'], original['key'])
        self.assertEqual(state['seen'][original['key']], original['at'])
        self.assertEqual(len(state['pending']), 1, 'old final must not suppress the newer error')

    def test_missing_kind_pending_is_quarantined_before_consumption(self):
        state = self.state()
        self.add_turn()
        event = copy.deepcopy(self.snapshot()['events'][0])
        del event['kind']
        state['pending'][event['key']] = event
        path = self.root / 'state.json'
        watcher.atomic(path, state)
        recovered = watcher.load_state(path, CONFIG, self.root, NOW)
        self.assertEqual(recovered['pending'], {})
        self.assertTrue(recovered['outputBlocked'])
        preserved = list(self.root.glob('state.preserved.*.json'))
        self.assertEqual(len(preserved), 1)
        self.assertNotIn('kind', json.loads(preserved[0].read_text())['pending'][event['key']])
        watcher.notify_pending(recovered, CONFIG, NOW, lambda s: None,
                               lambda _: self.fail('quarantined record must not send'))

    def test_observe_cannot_reset_incomplete_cycle_failure_backoff(self):
        state = self.state()
        state['readerFailures'] = 3
        state['nextReadAt'] = NOW + 120
        state['health'] = {'status': 'read-error', 'at': NOW - 30}
        watcher.observe(state, self.snapshot(), CONFIG, NOW)
        self.assertEqual(state['readerFailures'], 3)
        self.assertEqual(state['nextReadAt'], NOW + 120)
        self.assertEqual(state['health']['status'], 'read-error')

    def test_migration_restores_original_final_identity_from_retained_journal(self):
        self.add_final(at=NOW - 1)
        state = self.state()
        watcher.observe(state, self.snapshot(), CONFIG, NOW)
        original = copy.deepcopy(state['latestFinal'][IDS[0]])
        state['seen'].clear()  # Old v2 code pruned the key after 1800 seconds.
        path = self.root / 'state.json'
        watcher.atomic(path, state)
        recovered = watcher.load_state(path, CONFIG, self.root, NOW + 1801)
        self.assertFalse(recovered['outputBlocked'])
        self.assertEqual(recovered['seen'][original['key']], original['at'])

    def test_final_identity_survives_journal_rotation_and_later_distinct_final(self):
        self.add_final(at=NOW - 1)
        state = self.state()
        watcher.observe(state, self.snapshot(), CONFIG, NOW)
        original = copy.deepcopy(state['latestFinal'][IDS[0]])
        self.add_final('Worker1 | #newer | DONE', at=NOW + 5, ident='newer-final')
        watcher.observe(state, self.snapshot(NOW + 10), CONFIG, NOW + 10)
        newer = copy.deepcopy(state['latestFinal'][IDS[0]])
        state['events'] = []  # Model bounded journal rotation, not identity deletion.
        later = NOW + 2000
        self.add_final(at=later, ident='ancient-copy')
        watcher.observe(state, self.snapshot(later + 1), CONFIG, later + 1)
        self.assertEqual(state['seen'][original['key']], original['at'])
        self.assertEqual(state['latestFinal'][IDS[0]], newer)

    def test_all_consumed_pending_fields_are_validated_at_load(self):
        self.add_turn()
        valid = self.snapshot()['events'][0]
        mutations = [{'kind': None}, {'kind': 'final_report'}, {'key': 'error:wrong'},
                     {'number': 5}, {'number': True}, {'worker': 'parked'}, {'at': 'invalid'},
                     {'source': 'queued_items'}, {'recordKey': 'coordinator:wrong'},
                     {'alreadyAddressedToCoordinator': True}]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                state = self.state()
                state['pending'][valid['key']] = {**valid, **mutation}
                path = self.root / 'state.json'
                watcher.atomic(path, state)
                recovered = watcher.load_state(path, CONFIG, self.root, NOW)
                self.assertEqual(recovered['pending'], {})
                self.assertTrue(recovered['outputBlocked'])

    def test_repeated_post_observe_failure_escalates_until_whole_cycle_succeeds(self):
        self.add_turn()
        state = self.state()
        watcher.observe(state, self.snapshot(), CONFIG, NOW)
        state['pending'][next(iter(state['pending']))].pop('kind')
        for index, delta in enumerate([30, 60, 120], 1):
            at = NOW + index
            watcher.observe(state, self.snapshot(at), CONFIG, at)
            with self.assertRaises(ValueError):
                watcher.notify_pending(state, CONFIG, at, lambda s: None,
                                       lambda _: self.fail('invalid intent cannot send'))
            watcher.cycle_failed(state, CONFIG, at, 'invalid pending')
            self.assertEqual(state['readerFailures'], index)
            self.assertEqual(state['nextReadAt'], at + delta)
        state['pending'] = {}
        watcher.cycle_succeeded(state, CONFIG, NOW + 10)
        self.assertEqual(state['readerFailures'], 0)
        self.assertEqual(state['health']['status'], 'ok')
        self.assertEqual(state['nextReadAt'], NOW + 40)

    def test_future_inconsistent_or_unbound_test_receipts_fail_closed(self):
        for mutation in [{'finishedAt': NOW + 1}, {'startedAt': NOW + 2},
                         {'testsRun': True}, {'testsDiscovered': 45}, {'failures': 1},
                         {'errors': 1}, {'skipped': 1}, {'exceptional': 1},
                         {'testFingerprints': {}}, {'sourceUnchanged': False}, {'exitCode': False}]:
            with self.subTest(mutation=mutation):
                receipt = valid_test_receipt(NOW)
                receipt.update(mutation)
                with self.assertRaises(RuntimeError): service.validate_test_receipt(receipt, ROOT, NOW)
        with self.assertRaises(RuntimeError): service.validate_test_receipt([], ROOT, NOW)

    def test_test_receipt_freshness_boundary_and_actual_runner_contract(self):
        import verify
        receipt = valid_test_receipt(NOW)
        self.assertIsNone(service.validate_test_receipt(receipt, ROOT, NOW + 899))
        with self.assertRaises(RuntimeError): service.validate_test_receipt(receipt, ROOT, NOW + 900)
        self.assertEqual(verify.test_fingerprints(ROOT), service.test_fingerprints(ROOT))
        runner = (ROOT / 'verify.py').read_text()
        self.assertIn('result.testsRun == discovered == passed', runner)
        self.assertIn('result.wasSuccessful()', runner)

    def test_aged_tests_receipt_rejected_despite_matching_pass_hashes(self):
        dry_path, tests_path = self.root / 'dry.json', self.root / 'tests.json'
        with patch.object(watcher.time, 'time', return_value=NOW): watcher.dry(ROOT, self.root, dry_path)
        tests_path.write_text(json.dumps(valid_test_receipt(NOW - 901)))
        with self.assertRaises(RuntimeError): service.validate_gate(ROOT, self.root, dry_path, tests_path, NOW)

    def test_exit1_and_zero_tests_receipts_rejected_despite_pass_claim(self):
        dry_path, tests_path = self.root / 'dry.json', self.root / 'tests.json'
        with patch.object(watcher.time, 'time', return_value=NOW): watcher.dry(ROOT, self.root, dry_path)
        for mutation in [{'exitCode': 1}, {'testsDiscovered': 0, 'testsRun': 0, 'testsPassed': 0}]:
            with self.subTest(mutation=mutation):
                receipt = valid_test_receipt(NOW)
                receipt.update(mutation)
                tests_path.write_text(json.dumps(receipt))
                with self.assertRaises(RuntimeError): service.validate_gate(ROOT, self.root, dry_path, tests_path, NOW)


if __name__ == '__main__':
    unittest.main(verbosity=2)
