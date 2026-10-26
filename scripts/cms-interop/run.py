#!/usr/bin/env python3
"""Encrypt one fixed nonsensitive fixture. No input paths or decryption support.

This is an interoperability probe, NOT a real-data retention implementation.
The recipient's private key is publicly known upstream and is NOT shipped here.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import resource
import signal
import stat
import sys
import time

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
REPOSITORY = 'JohnDeved/populous-new-dawn'
WORKFLOW = '.github/workflows/ready-pr-check.yml'
CERT = HERE / 'fixtures/ee-cert-3072.pem'
CERT_SHA256 = '88ae70e2689a20dd5284dd40593c7070e1c7873296c7e5b4fd34630375f92820'
DER_SHA256 = '538c065a792ad06b085d00289bf61958ca7c5a8203b8f8fc0545709c4a1d2b4e'
SPKI_SHA256 = 'bdd33d9960914ef116f9b71719f9eccf23ab03c524e918a9cb3c5b999bfd5997'
OPENSSL = Path('/usr/bin/openssl')
FILE_CAP = 1024 * 1024
RAW_BYTES = 4096
SOURCE_PATHS = (
    WORKFLOW, 'scripts/cms-interop/run.py', 'scripts/cms-interop/bounded.py',
    'scripts/cms-interop/profile.py', 'scripts/cms-interop/fixtures/ee-cert-3072.pem',
    'scripts/cms-interop/fixtures/LICENSE.txt', 'scripts/cms-interop/fixtures/provenance.json',
    'tests/cms-interop.test.mjs', 'tests/cms-interop.test.py', 'tests/workflow-policy.test.mjs',
    'engineering/cms-interop.md',
)


def require(ok, code):
    if not ok:
        raise ValueError(code)


def module(name):
    spec = importlib.util.spec_from_file_location('cms_interop_' + name, HERE / (name + '.py'))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def regular(path, maximum=FILE_CAP, private=False):
    info = path.lstat()
    require(stat.S_ISREG(info.st_mode) and info.st_nlink == 1 and
            0 <= info.st_size <= maximum, 'regular-single-link-bounded-file')
    if private:
        require(stat.S_IMODE(info.st_mode) == 0o600, 'private-file-mode')
    return info


def file_identity(info):
    # Reading may update atime; it is not a mutation of the accepted bytes.
    return (info.st_dev, info.st_ino, info.st_mode, info.st_nlink, info.st_size,
            info.st_mtime_ns, info.st_ctime_ns)


def read(path, maximum=FILE_CAP, private=False):
    before = regular(path, maximum, private)
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd, 'rb') as stream:
        require(file_identity(os.fstat(stream.fileno())) == file_identity(before), 'file-race')
        data = stream.read(maximum + 1)
    require(len(data) == before.st_size and file_identity(path.lstat()) == file_identity(before), 'file-changed')
    return data


def digest_file(path, deadline, maximum=16 * FILE_CAP):
    before = regular(path, maximum)
    digest = hashlib.sha256()
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd, 'rb') as stream:
        require(file_identity(os.fstat(stream.fileno())) == file_identity(before), 'tool-file-race')
        total = 0
        while True:
            require(time.monotonic() < deadline, 'hash-deadline')
            block = stream.read(65536)
            if not block:
                break
            total += len(block)
            require(total <= maximum, 'hash-cap')
            digest.update(block)
    require(total == before.st_size and file_identity(path.lstat()) == file_identity(before), 'tool-file-changed')
    return {'sha256': digest.hexdigest(), 'bytes': total}


def pairs(values):
    result = {}
    for key, value in values:
        require(key not in result, 'duplicate-json-key')
        result[key] = value
    return result


def context(env, snapshot, workflow_bytes):
    fields = {'repository': 'GITHUB_REPOSITORY', 'runId': 'GITHUB_RUN_ID',
              'runAttempt': 'GITHUB_RUN_ATTEMPT', 'workflowRef': 'GITHUB_WORKFLOW_REF',
              'workflowSha': 'GITHUB_WORKFLOW_SHA', 'mergeSha': 'GITHUB_SHA',
              'headSha': 'PR_HEAD_SHA', 'baseSha': 'PR_BASE_SHA'}
    require(type(snapshot) is dict and type(snapshot.get('identity')) is dict, 'snapshot')
    identity = snapshot['identity']
    require(set(identity) == set(fields) | {'treeSha', 'workflowSha256'}, 'identity-fields')
    for key, variable in fields.items():
        require(type(identity[key]) is str and identity[key] == env.get(variable), 'identity-binding')
    require(identity['repository'] == REPOSITORY and env.get('GITHUB_JOB') == 'quality' and
            env.get('GITHUB_ACTIONS') == 'true' and env.get('CI') == 'true', 'hosted-quality-only')
    for key in ('workflowSha', 'mergeSha', 'headSha', 'baseSha', 'treeSha'):
        require(type(identity[key]) is str and re.fullmatch('[0-9a-f]{40}', identity[key]), 'source-sha')
    for key in ('runId', 'runAttempt'):
        require(re.fullmatch('[1-9][0-9]{0,19}', identity[key]), 'run-number')
    require(re.fullmatch(re.escape(REPOSITORY + '/' + WORKFLOW) +
                        r'@refs/(?:heads/[A-Za-z0-9._/-]{1,128}|pull/[1-9][0-9]*/merge)',
                        identity['workflowRef']), 'workflow-ref')
    require(identity['workflowSha256'] == hashlib.sha256(workflow_bytes).hexdigest(), 'workflow-hash')
    # Refuse overrides rather than changing their meaning or bypassing host policy.
    require(not any(env.get(key) for key in ('OPENSSL_CONF', 'OPENSSL_CONF_INCLUDE',
            'OPENSSL_MODULES', 'OPENSSL_ENGINES', 'LD_PRELOAD')), 'crypto-env-override')
    # setup-python uses its own runtime library directory for the parent Python.
    # This is not an OpenSSL child setting: bounded.py passes only PATH/LANG.
    require(env.get('LD_LIBRARY_PATH', '') in ('', str(Path(sys.base_prefix).resolve() / 'lib')),
            'parent-python-loader-path')
    return dict(identity)


def version_line(raw):
    line = raw.decode('ascii').splitlines()[0]
    require(len(line) <= 200 and re.fullmatch(
        r'OpenSSL 3\.[0-9]+\.[0-9]+(?:[a-z])? [A-Za-z0-9 -]+(?: \(Library: OpenSSL 3\.[0-9]+\.[0-9]+(?:[a-z])? [A-Za-z0-9 -]+\))?',
        line), 'openssl-observed-version')
    return line


def terminal(supervisor, name, bounded):
    phase = supervisor.run(name)
    require(phase['exit_code'] == 0 and phase['terminal_ok'] and
            bounded.clean_terminal(phase), 'phase-terminal')
    return phase


def publish(bounded, private, stage, destination, summary, deadline):
    """No final directory exists until both exact files and all gates settle."""
    require(time.monotonic() < deadline and not stage.exists() and
            not destination.exists(), 'publish-precondition')
    cipher = read(private / 'envelope.cms', private=True)
    require(len(cipher) == summary['ciphertext']['bytes'] and
            hashlib.sha256(cipher).hexdigest() == summary['ciphertext']['sha256'], 'publish-cipher-binding')
    stage.mkdir(mode=0o700)
    bounded.create(stage / 'envelope.cms', cipher)
    bounded.write_json(stage / 'summary.json', summary)
    require(sorted(p.name for p in stage.iterdir()) == ['envelope.cms', 'summary.json'], 'publish-pathset')
    for path in stage.iterdir():
        regular(path, private=True)
    require(stat.S_IMODE(stage.stat().st_mode) == 0o700 and
            time.monotonic() < deadline, 'publish-final-gate')
    stage.rename(destination)


def interrupted(signum, frame):
    raise RuntimeError('supervisor-interrupted')


def public_failure_stage(stage):
    if stage not in ('setup', 'context', 'admission', 'inputs', 'version',
                     'encrypt', 'profile', 'publish'):
        stage = 'unknown'
    try:
        print('PND_CMS_INTEROP_FAIL_STAGE=' + stage, file=sys.stderr, flush=True)
    except BaseException:
        pass


def main():
    os.umask(0o077)
    start = time.monotonic()
    deadline = start + 30
    private = None
    bounded = None
    handlers = {}
    failure_stage = 'setup'
    try:
        for signum in (signal.SIGTERM, signal.SIGINT):
            handlers[signum] = signal.signal(signum, interrupted)
        require(len(sys.argv) == 1, 'no-input-options')
        resource.setrlimit(resource.RLIMIT_FSIZE, (FILE_CAP, FILE_CAP))
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        bounded = module('bounded')
        profile = module('profile')
        failure_stage = 'context'
        require(Path(os.environ['GITHUB_WORKSPACE']).resolve(strict=True) == ROOT, 'workspace')
        identity = context(os.environ, json.loads(read(ROOT / 'work/ci/before.json'),
                           object_pairs_hook=pairs), read(ROOT / WORKFLOW))
        failure_stage = 'admission'
        parent = Path(os.environ['RUNNER_TEMP']).resolve(strict=True)
        require(parent.is_dir(), 'runner-temp')
        name = 'pnd-cms-interop-' + identity['runId'] + '-' + identity['runAttempt'] + '-quality'
        private, stage, destination = (parent / (name + suffix) for suffix in ('.private', '.publish-pending', ''))
        require(not any(p.exists() or p.is_symlink() for p in (private, stage, destination)), 'fresh-directories')
        fs = os.statvfs(parent)
        available = next(int(line.split()[1]) * 1024 for line in Path('/proc/meminfo').read_text().splitlines()
                         if line.startswith('MemAvailable:'))
        require(fs.f_bavail * fs.f_frsize >= 2 * 1024**3 and fs.f_favail >= 4096 and
                available >= 3 * 1024**3, 'host-admission')
        private.mkdir(mode=0o700)
        failure_stage = 'inputs'
        sources = {path: hashlib.sha256(read(ROOT / path)).hexdigest() for path in SOURCE_PATHS}
        certificate = read(CERT)
        require(hashlib.sha256(certificate).hexdigest() == CERT_SHA256 and
                b'PRIVATE KEY' not in certificate, 'pinned-public-test-certificate')
        recipient = profile.cert_identity(certificate)
        require(recipient['certificate_der_sha256'] == DER_SHA256 and
                recipient['spki_der_sha256'] == SPKI_SHA256 and recipient['rsa_bits'] == 3072, 'recipient-identity')
        tool = digest_file(OPENSSL, deadline)
        tool.update({'executable': '/usr/bin/openssl', 'configuration': 'system-default; no overrides'})
        bounded.create(private / 'generated.bin', bytes(range(256)) * 16)
        commands = {
            'version': ([OPENSSL, 'version', '-a'], FILE_CAP),
            'encrypt': ([OPENSSL, 'cms', '-encrypt', '-binary', '-in', private / 'generated.bin',
                '-outform', 'DER', '-out', private / 'envelope.cms', '-aes-256-gcm',
                '-recip', CERT, '-keyopt', 'rsa_padding_mode:oaep', '-keyopt', 'rsa_oaep_md:sha256',
                '-keyopt', 'rsa_mgf1_md:sha256'], FILE_CAP),
            'cms-inspect': ([OPENSSL, 'cms', '-cmsout', '-inform', 'DER', '-in', private / 'envelope.cms',
                            '-noout'], FILE_CAP),
        }
        supervisor = bounded.Supervisor(deadline, private, commands)
        failure_stage = 'version'
        terminal(supervisor, 'version', bounded)
        tool['observed_version'] = version_line(read(private / 'version.stdout', private=True))
        tool['version_a_sha256'] = hashlib.sha256(read(private / 'version.stdout', private=True)).hexdigest()
        failure_stage = 'encrypt'
        terminal(supervisor, 'encrypt', bounded)
        failure_stage = 'profile'
        cipher = read(private / 'envelope.cms', private=True)
        shape = profile.inspect_cms(cipher, recipient, RAW_BYTES)
        terminal(supervisor, 'cms-inspect', bounded)
        failure_stage = 'publish'
        require(digest_file(OPENSSL, deadline) == {key: tool[key] for key in ('sha256', 'bytes')}, 'tool-mutated')
        require(all(hashlib.sha256(read(ROOT / path)).hexdigest() == digest
                    for path, digest in sources.items()), 'source-mutated')
        summary = {
            'schema': 1, 'kind': 'pnd-generated-cms-interop', 'status': 'encrypted-profile-qualified',
            'classification': 'PUBLIC-TEST-RECIPIENT; GENERATED-NONSENSITIVE-ONLY',
            'identity': identity, 'sources_sha256': sources, 'tool': tool,
            'input': {'generator': 'bytes(range(256))*16', 'bytes': RAW_BYTES},
            'recipient': {'certificate_pem_sha256': CERT_SHA256, 'certificate_der_sha256': DER_SHA256,
                          'spki_der_sha256': SPKI_SHA256, 'rsa_bits': 3072},
            'ciphertext': {'name': 'envelope.cms', 'bytes': len(cipher),
                           'sha256': hashlib.sha256(cipher).hexdigest(), 'profile': shape['profile']},
            'limits': {'aggregate_seconds': 30, 'sampled_owned_rss_bytes': bounded.RSS_CAP,
                       'file_bytes': FILE_CAP, 'aggregate_raw_log_bytes': bounded.LOG_CAP},
            'phases': [{key: p[key] for key in ('name', 'exit_code', 'terminal_ok', 'elapsed_seconds',
                       'peak_owned_rss_bytes', 'raw_log_bytes', 'samples')} for p in supervisor.phases],
            'elapsed_before_publish_seconds': time.monotonic() - start,
            'authentication_claim': 'none; encryption-only; independent local decrypt still required',
        }
        bounded.write_json(private / 'receipt.json', summary)
        publish(bounded, private, stage, destination, summary, deadline)
        return 0
    except BaseException as exc:
        if private is not None and private.is_dir() and bounded is not None:
            try:
                bounded.write_json(private / 'failure.json', {'status': 'failed', 'error_type': type(exc).__name__})
            except BaseException:
                pass
        # Only this allowlisted stage token is public; child raw logs stay private.
        public_failure_stage(failure_stage)
        return 1
    finally:
        for signum, previous in handlers.items():
            signal.signal(signum, previous)


if __name__ == '__main__':
    raise SystemExit(main())
