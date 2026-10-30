"""Synthetic-only collector defaults, identities and retained failure semantics."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

SCRIPTS = Path(__file__).resolve().parents[1]/'scripts/orchestration'
spec = importlib.util.spec_from_file_location('collector', SCRIPTS/'collect_native_ui_archive.py')
collector = importlib.util.module_from_spec(spec); spec.loader.exec_module(collector)
ea = collector.archive_reader


class CollectorTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='archive-collector-fixture-'); self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve(); self.evidence = self.root/'evidence'; self.evidence.mkdir()
        self.archive = self.evidence/'canonical.zip'; self.inputs = self.root/'inputs'; self.inputs.mkdir()
        self.candidate = 'a'*40; self.tree = 'b'*40; self.workflow = 'c'*40
        row = {'blob': 'd'*40, 'mode': '100644', 'bytes': 4, 'sha256': hashlib.sha256(b'data').hexdigest()}
        self.candidate_source = {'commit': self.candidate, 'tree': self.tree, 'files': {'app/a.ts': row, 'tests/a.test.mjs': dict(row)}}
        self.infrastructure = {'commit': self.workflow, 'tree': 'e'*40, 'files': {collector.WORKFLOW: dict(row)}}
        identity = {'candidateSha': self.candidate, 'workflowSha': self.workflow, 'eventSha': self.workflow,
                    'workflowRef': collector.REPOSITORY+'/'+collector.WORKFLOW+'@refs/heads/main',
                    'event': 'workflow_dispatch', 'runId': '12', 'runAttempt': '1'}
        self.members = {'receipt.json': {'identity': identity, 'status': 'passed'},
                        'episodes.json': {'cleanupVerified': True, 'episodes': [{'id': name, 'status': 'passed', 'timedOut': False, 'cleanupVerified': True} for name in collector.EPISODES]},
                        'candidate-source.json': self.candidate_source, 'infrastructure-source.json': self.infrastructure,
                        'screen/example.png': b'fake image bytes', 'browser.log': b'raw log bytes'}
        self.run = {'id': 12, 'run_attempt': 1, 'status': 'completed', 'head_sha': self.workflow, 'head_branch': 'main',
                    'event': 'workflow_dispatch', 'path': collector.WORKFLOW, 'repository': {'full_name': collector.REPOSITORY}, 'conclusion': 'success'}
        self.request = {'version': 1, 'runId': 12, 'runAttempt': 1, 'candidateSha': self.candidate, 'candidateTree': self.tree,
                        'workflowSha': self.workflow, 'archive': str(self.archive), 'output': str(self.root/'collected')}
        self.request['run'] = self.binding('run', self.run)
        self.request['expectedCandidate'] = self.binding('candidate', copy.deepcopy(self.candidate_source))
        self.request['expectedInfrastructure'] = self.binding('infrastructure', copy.deepcopy(self.infrastructure))
        self.write_archive()

    def binding(self, name, value):
        path = self.inputs/(name+'.json'); body = json.dumps(value, sort_keys=True).encode(); path.write_bytes(body)
        return {'path': str(path), 'sha256': hashlib.sha256(body).hexdigest()}

    def write_archive(self):
        with zipfile.ZipFile(self.archive, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
            for name, value in self.members.items():
                info = zipfile.ZipInfo(name); info.external_attr = (stat.S_IFREG|0o644)<<16; info.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(info, value if isinstance(value, bytes) else json.dumps(value, sort_keys=True).encode())
        self.artifacts = {'total_count': 1, 'artifacts': [{'id': 42, 'name': f'native-ui-evidence-{self.candidate}-12-1', 'expired': False,
                          'workflow_run': {'id': 12, 'head_sha': self.workflow}, 'size_in_bytes': self.archive.stat().st_size,
                          'digest': 'sha256:'+hashlib.sha256(self.archive.read_bytes()).hexdigest()}]}
        self.request['artifacts'] = self.binding('artifacts', self.artifacts)

    def cli(self, digest):
        request = self.inputs/'request.json'; request.write_text(json.dumps(self.request))
        expected = hashlib.sha256(request.read_bytes()).hexdigest() if digest is None else digest
        return subprocess.run([sys.executable, '-I', '-B', str(SCRIPTS/'collect_native_ui_archive.py'),
                               '--request', str(request), '--request-sha256', expected],
                              capture_output=True, text=True, timeout=5, check=False)

    def test_real_isolated_cli_collects_without_sibling_import_setup(self):
        result = self.cli(None)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['status'], 'collected')
        self.assertEqual(result.stderr, '')
        self.assertFalse(list(self.root.rglob('*.png')))

    def test_real_isolated_cli_rejects_wrong_request_hash(self):
        result = self.cli('0'*64)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('ValueError', result.stderr)
        self.assertFalse(Path(self.request['output']).exists())

    def test_default_has_only_small_metadata_and_no_extracted_members(self):
        before = ea.record(self.archive.stat()); result = collector.collect(self.request)
        self.assertEqual(result['status'], 'collected'); self.assertEqual(result['extractedMembers'], [])
        self.assertEqual(set(p.name for p in Path(self.request['output']).iterdir()), {'archive-manifest.json', 'collection.json'})
        self.assertEqual(ea.record(self.archive.stat()), before)
        self.assertFalse((self.evidence/'unpacked').exists()); self.assertFalse(list(self.root.rglob('*.png')))
        self.assertEqual(result['runtimeAcceptance'], 'not-performed'); self.assertEqual(result['visualInspection'], 'not-performed')

    def test_repeated_collection_has_no_second_payload_copy(self):
        collector.collect(self.request); self.request['output'] = str(self.root/'second'); collector.collect(self.request)
        self.assertEqual(list(self.root.rglob('*.zip')), [self.archive]); self.assertFalse(list(self.root.rglob('*.png')))
        self.assertEqual((self.root/'collected/archive-manifest.json').read_bytes(), (self.root/'second/archive-manifest.json').read_bytes())

    def test_index_is_complete_exact_member_hashes_not_acceptance(self):
        result = collector.collect(self.request); index = json.loads((self.root/'collected/archive-manifest.json').read_text())
        self.assertEqual({row['name'] for row in index['members']}, set(self.members))
        self.assertEqual(next(row for row in index['members'] if row['name'].endswith('.png'))['sha256'], hashlib.sha256(self.members['screen/example.png']).hexdigest())
        self.assertEqual(result['archiveManifestSha256'], ea.sha(ea.encoded(index)))

    def test_failed_runtime_remains_a_collected_failure_not_a_pass(self):
        self.members['receipt.json']['status'] = 'failed'; self.members['episodes.json']['episodes'][2].update(status='failed', failure='fixture failure', cleanupVerified=False)
        self.write_archive(); result = collector.collect(self.request)
        self.assertEqual(result['status'], 'collected'); self.assertEqual(result['runtimeStatus'], 'failed')
        self.assertEqual(result['episodes'][2]['failure'], 'fixture failure'); self.assertFalse(result['episodes'][2]['cleanupVerified'])
        self.assertEqual(result['runtimeAcceptance'], 'not-performed')

    def test_interrupted_missing_sources_preserved_as_identity_error(self):
        del self.members['candidate-source.json']; self.members['receipt.json']['status'] = 'interrupted'; self.write_archive()
        result = collector.collect(self.request)
        self.assertEqual(result['status'], 'collected-with-identity-errors'); self.assertEqual(result['runtimeStatus'], 'interrupted')
        self.assertTrue(self.archive.exists()); self.assertTrue((self.root/'collected/collection.json').exists())

    def test_candidate_every_row_is_compared(self):
        self.members['candidate-source.json']['files']['tests/a.test.mjs']['sha256'] = 'f'*64; self.write_archive()
        result = collector.collect(self.request); self.assertIn('tests/a.test.mjs', result['identityErrors'][0])

    def test_infrastructure_complete_pathset_is_compared(self):
        self.members['infrastructure-source.json']['files']['extra'] = dict(next(iter(self.infrastructure['files'].values()))); self.write_archive()
        self.assertEqual(collector.collect(self.request)['status'], 'collected-with-identity-errors')

    def test_wrong_receipt_identity_retained_without_acceptance(self):
        self.members['receipt.json']['identity']['eventSha'] = 'f'*40; self.write_archive()
        self.assertIn('Runtime receipt identity missing or mismatched', collector.collect(self.request)['identityErrors'])

    def test_partial_episode_ledger_not_full_coverage(self):
        self.members['episodes.json']['episodes'].pop(); self.write_archive()
        result = collector.collect(self.request); self.assertEqual(result['episodes'], []); self.assertTrue(result['identityErrors'])

    def test_api_digest_required_not_archive_self_claim(self):
        self.artifacts['artifacts'][0]['digest'] = 'sha256:'+'0'*64; self.request['artifacts'] = self.binding('artifacts', self.artifacts)
        with self.assertRaises(ValueError): collector.collect(self.request)
        self.assertFalse(Path(self.request['output']).exists()); self.assertTrue(self.archive.exists())

    def test_api_size_mismatch_rejected(self):
        self.artifacts['artifacts'][0]['size_in_bytes'] += 1; self.request['artifacts'] = self.binding('artifacts', self.artifacts)
        with self.assertRaises(ValueError): collector.collect(self.request)

    def test_different_api_workflow_or_repository_rejected(self):
        for field, value in [('head_sha', 'f'*40), ('repository', {'full_name': 'other/project'}), ('head_branch', 'feature'), ('path', 'wrong.yml')]:
            with self.subTest(field=field):
                self.request['run'] = self.binding('run', {**self.run, field: value})
                with self.assertRaises(ValueError): collector.collect(self.request)

    def test_no_existing_output_overwrite(self):
        collector.collect(self.request); before = (self.root/'collected/collection.json').read_bytes()
        with self.assertRaises(FileExistsError): collector.collect(self.request)
        self.assertEqual((self.root/'collected/collection.json').read_bytes(), before)

    def test_output_cannot_be_inside_held_archive_root(self):
        self.request['output'] = str(self.evidence/'new')
        with self.assertRaises(ValueError): collector.collect(self.request)

    def test_oversized_profile_does_not_fallback_to_extract_all(self):
        self.artifacts['artifacts'][0]['size_in_bytes'] = ea.LIMITS['archive_bytes']+1; self.request['artifacts'] = self.binding('artifacts', self.artifacts)
        with self.assertRaisesRegex(ValueError, 'qualified pilot profile'): collector.collect(self.request)
        self.assertFalse(Path(self.request['output']).exists())

    def test_external_input_mutation_during_stream_is_rejected(self):
        original = ea.Archive.copy
        def mutate(source, name, expected, writer):
            result = original(source, name, expected, writer)
            Path(self.request['run']['path']).write_bytes(b'{}')
            return result
        with patch.object(ea.Archive, 'copy', mutate), self.assertRaises(ValueError): collector.collect(self.request)
        self.assertFalse(Path(self.request['output']).exists())


if __name__ == '__main__': unittest.main()
