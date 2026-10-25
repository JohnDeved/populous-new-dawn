"""No crypto or external fixture input: unit fakes exercise fail-closed gates."""
import copy
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import time
import types
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    spec = importlib.util.spec_from_file_location('test_cms_' + name, ROOT / 'scripts/cms-interop' / (name + '.py'))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


run, bounded, profile = (load(name) for name in ('run', 'bounded', 'profile'))


def fixture_context(workflow):
    identity = {'repository': run.REPOSITORY, 'runId': '123', 'runAttempt': '2',
                'workflowRef': run.REPOSITORY + '/' + run.WORKFLOW + '@refs/pull/99/merge',
                'workflowSha': 'a' * 40, 'mergeSha': 'b' * 40, 'headSha': 'c' * 40,
                'baseSha': 'd' * 40, 'treeSha': 'e' * 40,
                'workflowSha256': hashlib.sha256(workflow).hexdigest()}
    names = {'repository': 'GITHUB_REPOSITORY', 'runId': 'GITHUB_RUN_ID',
             'runAttempt': 'GITHUB_RUN_ATTEMPT', 'workflowRef': 'GITHUB_WORKFLOW_REF',
             'workflowSha': 'GITHUB_WORKFLOW_SHA', 'mergeSha': 'GITHUB_SHA',
             'headSha': 'PR_HEAD_SHA', 'baseSha': 'PR_BASE_SHA'}
    env = {name: identity[key] for key, name in names.items()}
    env.update({'CI': 'true', 'GITHUB_ACTIONS': 'true', 'GITHUB_JOB': 'quality'})
    return env, {'identity': identity}


def clean(name):
    return {'name': name, 'exit_code': 0, 'terminal_ok': True, 'stop_reason': None,
            'error': None, 'cleanup_errors': [], 'persistence_errors': [],
            'direct_wait_complete': True, 'pipes_closed': True, 'group_absent': True,
            'elapsed_seconds': 0.01, 'peak_owned_rss_bytes': 1024,
            'raw_log_bytes': 0, 'samples': 1}


class InteropTests(unittest.TestCase):
    def test_signal_handler_and_public_stage_codes_are_bounded(self):
        with self.assertRaisesRegex(RuntimeError, '^supervisor-interrupted$'):
            run.interrupted(run.signal.SIGTERM, None)
        output = io.StringIO()
        with mock.patch.object(run.sys, 'stderr', output):
            run.public_failure_stage('context')
            run.public_failure_stage('/private/path-and-environment-value')
        self.assertEqual(output.getvalue(),
                         'PND_CMS_INTEROP_FAIL_STAGE=context\nPND_CMS_INTEROP_FAIL_STAGE=unknown\n')

    def test_context_requires_exact_bound_identity_and_default_configuration(self):
        env, snapshot = fixture_context(b'workflow')
        self.assertEqual(run.context(env, snapshot, b'workflow'), snapshot['identity'])
        python_library = str(Path(run.sys.base_prefix).resolve() / 'lib')
        self.assertEqual(run.context({**env, 'LD_LIBRARY_PATH': python_library}, snapshot, b'workflow'),
                         snapshot['identity'])
        # Exact setup-python environment observed in hosted Full433.
        hosted_prefix = '/opt/hostedtoolcache/Python/3.12.14/x64'
        with mock.patch.object(run.sys, 'base_prefix', hosted_prefix):
            self.assertEqual(run.context({**env, 'LD_LIBRARY_PATH': hosted_prefix + '/lib'},
                                         snapshot, b'workflow'), snapshot['identity'])
            with self.assertRaises(ValueError):
                run.context({**env, 'LD_LIBRARY_PATH': hosted_prefix + '/lib:/usr/lib'},
                            snapshot, b'workflow')
        for value in (python_library + ':', python_library + ':/unrelated', '/unrelated'):
            with self.subTest(parent_loader=value), self.assertRaises(ValueError):
                run.context({**env, 'LD_LIBRARY_PATH': value}, snapshot, b'workflow')
        for key in snapshot['identity']:
            changed = copy.deepcopy(snapshot)
            changed['identity'][key] = True
            with self.subTest(field=key), self.assertRaises(ValueError):
                run.context(env, changed, b'workflow')
        for key in ('OPENSSL_CONF', 'OPENSSL_CONF_INCLUDE', 'OPENSSL_MODULES',
                    'OPENSSL_ENGINES', 'LD_PRELOAD', 'LD_LIBRARY_PATH'):
            with self.subTest(override=key), self.assertRaises(ValueError):
                run.context({**env, key: 'test-only-override'}, snapshot, b'workflow')
        for change in ({'GITHUB_JOB': 'test-shards'}, {'GITHUB_ACTIONS': 'false'},
                       {'CI': 'false'}, {'GITHUB_RUN_ATTEMPT': '3'}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                run.context({**env, **change}, snapshot, b'workflow')
        with self.assertRaises(ValueError):
            run.context(env, snapshot, b'wrong-workflow')
        with self.assertRaises(ValueError):
            json.loads('{"identity":1,"identity":2}', object_pairs_hook=run.pairs)

    def test_only_observed_openssl3_versions_are_recorded(self):
        for version in ('OpenSSL 3.0.13 30 Jan 2024 (Library: OpenSSL 3.0.13 30 Jan 2024)',
                        'OpenSSL 3.5.7 9 Jun 2026'):
            self.assertEqual(run.version_line((version + '\nbuild details\n').encode()), version)
        for version in (b'OpenSSL 1.1.1w 11 Sep 2023', b'LibreSSL 4.0.0', b'garbage', b'\xff'):
            with self.subTest(version=version), self.assertRaises((ValueError, UnicodeError)):
                run.version_line(version)

    def test_pinned_fixture_is_certificate_only_and_exact_recipient(self):
        pem = run.CERT.read_bytes()
        self.assertEqual(hashlib.sha256(pem).hexdigest(), run.CERT_SHA256)
        recipient = profile.cert_identity(pem)
        self.assertEqual(recipient['certificate_der_sha256'], run.DER_SHA256)
        self.assertEqual(recipient['spki_der_sha256'], run.SPKI_SHA256)
        self.assertEqual(recipient['rsa_bits'], 3072)
        fixture_dir = run.CERT.parent
        self.assertEqual(sorted(p.name for p in fixture_dir.iterdir()),
                         ['LICENSE.txt', 'ee-cert-3072.pem', 'provenance.json'])
        for path in fixture_dir.iterdir():
            self.assertNotIn(b'-----BEGIN PRIVATE KEY-----', path.read_bytes())
            self.assertNotIn(b'-----BEGIN RSA PRIVATE KEY-----', path.read_bytes())
        provenance = json.loads((fixture_dir / 'provenance.json').read_text())
        self.assertEqual([p['upstream_path'] for p in provenance['files']],
                         ['test/certs/ee-cert-3072.pem', 'LICENSE.txt'])

    def test_exact_sha256_algorithm_parameters(self):
        for value in ('300b0609608648016503040201', '300d06096086480165030402010500'):
            reader = profile.DER(bytes.fromhex(value))
            profile.sha256_algorithm(reader, reader.root())
        for value in ('300d06096086480165030402010400', '300e0609608648016503040201050100',
                      '300b0609608648016503040202', '300f060960864801650304020105000500'):
            reader = profile.DER(bytes.fromhex(value))
            with self.subTest(value=value), self.assertRaises(ValueError):
                profile.sha256_algorithm(reader, reader.root())

    def test_every_dirty_terminal_blocks(self):
        for key, value in (('exit_code', 4), ('terminal_ok', False), ('stop_reason', 'timeout'),
                           ('error', 'OSError'), ('cleanup_errors', ['wait']),
                           ('persistence_errors', ['log']), ('direct_wait_complete', False),
                           ('pipes_closed', False), ('group_absent', False)):
            phase = {**clean('encrypt'), key: value}
            supervisor = types.SimpleNamespace(run=lambda _: phase)
            with self.subTest(key=key), self.assertRaises(ValueError):
                run.terminal(supervisor, 'encrypt', bounded)

    def test_publish_is_atomic_and_exact(self):
        with tempfile.TemporaryDirectory(prefix='pnd-cms-unit-') as tmp:
            root = Path(tmp)
            private = root / 'private'
            private.mkdir(mode=0o700)
            bounded.create(private / 'envelope.cms', b'unit-only-not-CMS')
            summary = {'ciphertext': {'bytes': 17, 'sha256': hashlib.sha256(b'unit-only-not-CMS').hexdigest()}}
            # No final directory for digest, expiry, persistence or pathset failures.
            for case in ('hash', 'expired', 'write', 'extra'):
                stage, dest = root / (case + '-pending'), root / case
                obj = copy.deepcopy(summary)
                if case == 'hash':
                    obj['ciphertext']['sha256'] = '0' * 64
                writer = bounded.write_json
                def write(path, value):
                    if case == 'write':
                        raise OSError('unit-only failure')
                    writer(path, value)
                    if case == 'extra':
                        bounded.create(path.parent / 'unexpected.txt', b'unit')
                with mock.patch.object(bounded, 'write_json', side_effect=write), self.assertRaises((ValueError, OSError)):
                    run.publish(bounded, private, stage, dest, obj,
                                time.monotonic() + (-1 if case == 'expired' else 10))
                self.assertFalse(dest.exists())
            run.publish(bounded, private, root / 'success-pending', root / 'success', summary, time.monotonic() + 10)
            self.assertEqual(sorted(p.name for p in (root / 'success').iterdir()), ['envelope.cms', 'summary.json'])
            for path in (root / 'success').iterdir():
                self.assertEqual(path.stat().st_mode & 0o777, 0o600)

    def test_file_reads_reject_links_modes_and_oversize(self):
        with tempfile.TemporaryDirectory(prefix='pnd-cms-unit-') as tmp:
            root = Path(tmp)
            bounded.create(root / 'data', b'x')
            self.assertEqual(run.read(root / 'data', private=True), b'x')
            (root / 'link').symlink_to(root / 'data')
            with self.assertRaises(ValueError):
                run.read(root / 'link')
            os.link(root / 'data', root / 'hardlink')
            with self.assertRaises(ValueError):
                run.read(root / 'data')
            bounded.create(root / 'mode', b'x')
            (root / 'mode').chmod(0o644)
            with self.assertRaises(ValueError):
                run.read(root / 'mode', private=True)
            with self.assertRaises(ValueError):
                run.read(root / 'mode', maximum=0)

    def test_whole_entry_never_publishes_after_failed_gate(self):
        # Mock-only opaque ciphertext: this tests orchestration, not crypto success.
        cases = ('pass', 'encrypt-exit', 'inspect-exit', 'log-cap', 'cleanup',
                 'persistence', 'profile', 'source-mutation')
        for case in cases:
            with self.subTest(case=case), tempfile.TemporaryDirectory(prefix='pnd-cms-entry-unit-') as tmp:
                root, temp = Path(tmp) / 'repo', Path(tmp) / 'temp'
                root.mkdir(); temp.mkdir()
                for relative in run.SOURCE_PATHS:
                    target = root / relative
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes((ROOT / relative).read_bytes())
                env, snapshot = fixture_context((root / run.WORKFLOW).read_bytes())
                env.update({'GITHUB_WORKSPACE': str(root), 'RUNNER_TEMP': str(temp)})
                (root / 'work/ci').mkdir(parents=True)
                (root / 'work/ci/before.json').write_text(json.dumps(snapshot))
                seen = []
                class FakeSupervisor:
                    def __init__(self, deadline, out, commands):
                        self.out, self.commands, self.phases = out, commands, []
                        self.deadline = deadline
                    def run(self, name):
                        seen.append(name)
                        phase = clean(name)
                        if name == 'version':
                            bounded.create(self.out / 'version.stdout', b'OpenSSL 3.0.13 30 Jan 2024\n')
                        if name == 'encrypt':
                            bounded.create(self.out / 'envelope.cms', b'opaque mock-only cipher')
                            if case == 'encrypt-exit': phase['exit_code'] = 1
                            if case == 'log-cap': phase['stop_reason'] = 'aggregate-raw-log-cap'
                            if case == 'cleanup': phase['cleanup_errors'] = ['wait']
                            if case == 'persistence': phase['persistence_errors'] = ['log']
                        if name == 'cms-inspect':
                            if case == 'inspect-exit': phase['exit_code'] = 1
                            if case == 'source-mutation':
                                (root / 'scripts/cms-interop/run.py').write_bytes(b'changed source')
                        self.phases.append(phase)
                        return phase
                original_read_text = Path.read_text
                def read_text(path, *args, **kwargs):
                    if str(path) == '/proc/meminfo': return 'MemAvailable: 4194304 kB\n'
                    return original_read_text(path, *args, **kwargs)
                modules = {'bounded': bounded, 'profile': profile}
                with mock.patch.dict(os.environ, env, clear=True), mock.patch.object(run, 'ROOT', root), \
                     mock.patch.object(run.sys, 'argv', ['run.py']), mock.patch.object(run.resource, 'setrlimit'), \
                     mock.patch.object(run, 'module', side_effect=modules.__getitem__), \
                     mock.patch.object(run, 'digest_file', side_effect=lambda *args: {'bytes': 1, 'sha256': 'f' * 64}), \
                     mock.patch.object(run.os, 'statvfs', return_value=types.SimpleNamespace(f_bavail=4 * 1024**3, f_frsize=1, f_favail=5000)), \
                     mock.patch.object(Path, 'read_text', read_text), \
                     mock.patch.object(bounded, 'Supervisor', FakeSupervisor), \
                     mock.patch.object(profile, 'inspect_cms', side_effect=ValueError('unit-profile') if case == 'profile' else None,
                                       return_value={'profile': 'mock-only-profile'}):
                    code = run.main()
                destination = temp / 'pnd-cms-interop-123-2-quality'
                self.assertEqual(code, 0 if case == 'pass' else 1)
                self.assertEqual(destination.exists(), case == 'pass')
                if case == 'profile' or case.startswith('encrypt') or case in ('log-cap', 'cleanup', 'persistence'):
                    self.assertEqual(seen, ['version', 'encrypt'])
                if case == 'pass':
                    self.assertEqual(sorted(p.name for p in destination.iterdir()), ['envelope.cms', 'summary.json'])
                    public = json.loads((destination / 'summary.json').read_text())
                    self.assertNotIn(str(temp), json.dumps(public))
                    self.assertNotIn('generated.bin', json.dumps(public))


if __name__ == '__main__':
    unittest.main(verbosity=2)
