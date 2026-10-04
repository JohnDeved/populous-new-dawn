#!/usr/bin/env python3
"""Recover an isolated, pinned Linux research workspace. Never launch the game.

Host prerequisites: Linux x86_64, Python 3.12 with venv, git, curl, Node >=22.13,
and npm. See engineering/cloud-bootstrap.md for trust and recovery boundaries.
"""
import argparse
import datetime
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import platform
import re
import shlex
import shutil
import stat
import subprocess
import sys
import tarfile
import tempfile
import uuid
import zipfile

SOURCE = Path(__file__).resolve().parents[1]
MANIFEST = SOURCE / 'engineering/cloud-bootstrap.json'


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def verify(path, expected):
    if not Path(path).is_file() or digest(path) != expected:
        raise ValueError(f'SHA-256 mismatch or missing file: {path}')


def tree_digest(root):
    """Content identity without timestamps, permissions, or absolute paths."""
    h = hashlib.sha256()
    for path in sorted(root.rglob('*')):
        name = path.relative_to(root).as_posix()
        if path.is_symlink():
            if not path.resolve().is_relative_to(root.resolve()):
                raise ValueError(f'External symlink in tool tree: {name}')
            value = 'link:' + os.readlink(path)
        elif path.is_file():
            value = 'file:' + digest(path)
        elif path.is_dir():
            continue
        else:
            raise ValueError(f'Unsupported file in tool tree: {name}')
        h.update((name + '\0' + value + '\n').encode())
    return h.hexdigest()


def atomic_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.' + uuid.uuid4().hex + '.tmp')
    temporary.write_text(json.dumps(data, indent=2) + '\n')
    temporary.replace(path)


def member_path(name):
    path = PurePosixPath(name)
    if path.is_absolute() or '..' in path.parts or '\\' in name or '\0' in name:
        raise ValueError(f'Unsafe archive member: {name!r}')
    return path


def unpack(archive, destination, kind):
    """Extract only regular files/directories and bounded internal tar symlinks."""
    if kind == 'zip':
        with zipfile.ZipFile(archive) as source:
            seen = set()
            for entry in source.infolist():
                relative = member_path(entry.filename)
                name = relative.as_posix()
                if name in seen:
                    raise ValueError(f'Duplicate archive member: {name}')
                seen.add(name)
                mode = entry.external_attr >> 16
                if stat.S_ISLNK(mode) or (stat.S_IFMT(mode) not in (0, stat.S_IFREG, stat.S_IFDIR)):
                    raise ValueError(f'Unsupported zip member: {name}')
                target = destination / relative
                if entry.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                else:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with source.open(entry) as data, target.open('xb') as output:
                        shutil.copyfileobj(data, output)
                    target.chmod(0o755 if mode & 0o111 else 0o644)
    elif kind == 'tar':
        with tarfile.open(archive) as source:
            entries = source.getmembers()
            seen, links = set(), []
            for entry in entries:
                relative = member_path(entry.name)
                name = relative.as_posix()
                if name in seen:
                    raise ValueError(f'Duplicate archive member: {name}')
                seen.add(name)
                target = destination / relative
                if entry.issym():
                    if PurePosixPath(entry.linkname).is_absolute() or '\\' in entry.linkname:
                        raise ValueError(f'Unsafe archive link: {name}')
                    resolved = (target.parent / entry.linkname).resolve()
                    if not resolved.is_relative_to(destination.resolve()):
                        raise ValueError(f'Escaping archive link: {name}')
                    links.append((target, entry.linkname))
                elif entry.isdir():
                    target.mkdir(parents=True, exist_ok=True)
                elif entry.isfile():
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with source.extractfile(entry) as data, target.open('xb') as output:
                        shutil.copyfileobj(data, output)
                    target.chmod(0o755 if entry.mode & 0o111 else 0o644)
                else:
                    raise ValueError(f'Unsupported tar member: {name}')
            # Never follow archive-supplied symlinks while creating files.
            for target, value in links:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.symlink_to(value)
    else:
        raise ValueError(f'Unknown archive format: {kind}')


class Bootstrap:
    def __init__(self, args, manifest):
        self.args, self.manifest = args, manifest
        self.root = args.root.absolute()
        self.tools = self.root / 'prerequisites'
        self.cache = self.root / 'downloads'
        self.run_id = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ-') + uuid.uuid4().hex[:8]
        self.receipt = self.root / 'receipts' / self.run_id
        self.commands = []
        self.result = {'schema': 1, 'status': 'unknown', 'run': self.run_id,
                       'manifestSha256': digest(MANIFEST), 'scriptSha256': digest(Path(__file__)),
                       'inputSha256': {name: digest(SOURCE / name) for name in [
                           'engineering/cloud-python.lock', 'engineering/cloud-python-build.lock',
                           'scripts/extract-reference.py']},
                       'commands': self.commands, 'limits': [
                           'Original installer and complete game executable are never launched.',
                           'No old ignored evidence, saves, Ghidra projects, or credentials are reconstructed.',
                           'Version/readiness checks are not browser gameplay, Ghidra analysis, or hardware performance proof.']}

    def run(self, argv, cwd=None, env=None, check=True):
        index = len(self.commands)
        prefix = self.receipt / f'{index:02d}'
        record = {'argv': [str(x) for x in argv], 'cwd': str(cwd) if cwd else None,
                  'status': 'unknown'}
        self.commands.append(record)
        atomic_json(self.receipt / 'result.json', self.result)
        with prefix.with_suffix('.stdout').open('w') as out, prefix.with_suffix('.stderr').open('w') as err:
            run_env = dict(os.environ if env is None else env, GIT_TERMINAL_PROMPT='0', GH_PROMPT_DISABLED='1')
            completed = subprocess.run(record['argv'], cwd=cwd, env=run_env, stdout=out, stderr=err, timeout=1800)
        record.update(exitCode=completed.returncode, status='passed' if completed.returncode == 0 else 'failed',
                      stdoutSha256=digest(prefix.with_suffix('.stdout')),
                      stderrSha256=digest(prefix.with_suffix('.stderr')))
        atomic_json(self.receipt / 'result.json', self.result)
        if check and completed.returncode:
            raise RuntimeError(f'Command failed ({completed.returncode}): {argv[0]}; inspect {prefix}.stderr')
        return prefix.with_suffix('.stdout').read_text().strip()

    def archive(self, item):
        target = self.cache / (item['sha256'] + '-' + item['archive'])
        # An explicitly supplied cache is read-only. Do not duplicate multi-GB archives.
        for candidate in [target, *(root / item['archive'] for root in self.args.cache),
                          *(root / target.name for root in self.args.cache)]:
            if candidate.exists():
                verify(candidate, item['sha256'])
                return candidate
        if self.args.offline:
            raise ValueError(f'Offline cache miss: {item["archive"]}')
        self.cache.mkdir(parents=True, exist_ok=True)
        partial = target.with_name(target.name + '.part')
        if partial.exists() and digest(partial) == item['sha256']:
            partial.rename(target)
            return target
        self.run(['curl', '--fail', '--location', '--proto', '=https', '--proto-redir', '=https',
                  '--connect-timeout', '30', '--max-time', '1800', '--retry', '3',
                  '--continue-at', '-', '--output', partial, item['url']])
        verify(partial, item['sha256'])
        partial.rename(target)
        return target

    def tool(self, name, python=None):
        item = self.manifest['artifacts'][name]
        target = self.tools / item['home']
        candidates = [target]
        if self.args.reuse_prerequisites:
            candidates.append(self.args.reuse_prerequisites / item['home'])
        for candidate in candidates:
            if candidate.exists():
                if tree_digest(candidate) != item['treeSha256']:
                    raise ValueError(f'Tool tree hash mismatch; preserved untouched: {candidate}')
                return candidate.resolve()
        archive = self.archive(item)
        staging = Path(tempfile.mkdtemp(prefix=f'{name}-', dir=self.root / 'staging'))
        # Failed staging is retained with the command receipts for diagnosis; never adopted.
        if item['format'] == 'inno':
            extracted = staging / item['home']
            self.run([python, SOURCE / 'scripts/extract-reference.py', '--component', 'Component0',
                      archive, extracted, '*'])
        else:
            unpack(archive, staging, item['format'])
            extracted = staging / item['home']
        if tree_digest(extracted) != item['treeSha256']:
            raise ValueError(f'Extracted tree hash mismatch; retained at {staging}')
        extracted.rename(target)
        staging.rmdir()
        return target

    def python(self):
        # Keep a venv at its original final path: its console scripts use absolute shebangs.
        target = self.tools / 'venv'
        if target.exists():
            self.verify_python(target / 'bin/python')
            return target / 'bin/python'
        if self.args.reuse_prerequisites:
            candidate = self.args.reuse_prerequisites / 'venv/bin/python'
            if candidate.is_file():
                self.verify_python(candidate)
                return candidate.resolve() if not candidate.is_symlink() else candidate.absolute()
        environment = Path(tempfile.mkdtemp(prefix='python-', dir=self.tools))
        self.run([sys.executable, '-m', 'venv', environment])
        python = environment / 'bin/python'
        wheel_cache = self.cache / 'python'
        wheel_cache.mkdir(parents=True, exist_ok=True)
        requirements = SOURCE / 'engineering/cloud-python.lock'
        build = SOURCE / 'engineering/cloud-python-build.lock'
        links = [wheel_cache, *(p / 'python' for p in self.args.cache), *self.args.cache]
        for lock in [build, requirements]:
            if not self.args.offline:
                command = [python, '-m', 'pip', '--isolated', 'download', '--disable-pip-version-check', '--no-deps',
                           '--no-build-isolation', '--require-hashes', '--dest', wheel_cache, '-r', lock]
                if lock == build:
                    command.append('--only-binary=:all:')
                self.run(command)
            command = [python, '-m', 'pip', '--isolated', 'install', '--disable-pip-version-check', '--no-index',
                       '--no-deps', '--no-build-isolation', '--require-hashes', '-r', lock]
            for link in links:
                if link.is_dir():
                    command.extend(['--find-links', link])
            self.run(command)
        self.verify_python(python)
        # Publish only the complete environment. No existing path is replaced.
        target.symlink_to(environment.name, target_is_directory=True)
        return target / 'bin/python'

    def verify_python(self, python):
        locks = SOURCE / 'engineering/cloud-python.lock'
        expected = dict(re.findall(r'^([A-Za-z0-9_-]+)==([^\s]+)', locks.read_text(), re.M))
        code = ('import importlib.metadata as m,json,sys; '
                'from refinery.lib.inno.archive import InnoArchive; import unicorn,capstone,PIL; '
                'from unicorn import Uc,UC_ARCH_X86,UC_MODE_32; Uc(UC_ARCH_X86,UC_MODE_32); '
                'expected=json.loads(sys.argv[1]); '
                'actual={k:m.version(k) for k in expected}; '
                'assert actual==expected,(actual,expected); print(json.dumps(actual,sort_keys=True))')
        self.run([python, '-c', code, json.dumps(expected)])
        self.run([python, '-m', 'pip', '--isolated', 'check'])

    def repository(self):
        repository = self.root / 'repository.git'
        url = self.manifest['repository']
        if not repository.exists():
            if self.args.offline:
                raise ValueError('Offline repository miss; clone requires existing GitHub access/network')
            staging = self.root / 'staging' / ('repository-' + uuid.uuid4().hex)
            self.run(['git', 'clone', '--bare', url, staging])
            staging.rename(repository)
        if self.run(['git', '-C', repository, 'rev-parse', '--is-bare-repository']) != 'true':
            raise ValueError('Expected the managed bare repository; refusing to alter it')
        if self.run(['git', '-C', repository, 'remote', 'get-url', 'origin']) != url:
            raise ValueError('Repository origin differs from the pinned repository')
        reference = self.args.ref
        if reference != 'main' and not re.fullmatch('[0-9a-f]{40}', reference):
            raise ValueError('--ref must be main or a full lowercase commit SHA')
        if not self.args.offline:
            fetch_ref = 'refs/heads/main:refs/heads/main' if reference == 'main' else reference
            self.run(['git', '-C', repository, 'fetch', '--no-tags', 'origin', fetch_ref])
        commit = self.run(['git', '-C', repository, 'rev-parse', '--verify', reference + '^{commit}'])
        name = self.args.worktree or commit[:12]
        if not re.fullmatch('[A-Za-z0-9][A-Za-z0-9_-]{0,63}', name):
            raise ValueError('Unsafe worktree name')
        target = self.root / 'worktrees' / name
        marker = self.root / 'worktree-state' / (name + '.json')
        if target.exists():
            if not marker.is_file():
                raise ValueError(f'Unowned worktree preserved: {target}')
            state = json.loads(marker.read_text())
            head = self.run(['git', '-C', target, 'rev-parse', 'HEAD'])
            if head != commit or state['commit'] != commit:
                raise ValueError('Existing worktree is a different revision; choose a new --worktree name')
            if self.run(['git', '-C', target, 'status', '--porcelain']):
                raise ValueError('Existing worktree has changes; preserved untouched, choose a new --worktree')
            if (target / 'node_modules').is_symlink() or not (target / 'node_modules').is_dir() or digest(target / 'package-lock.json') != state['lockSha256']:
                raise ValueError('Existing dependencies are missing/different; choose a new --worktree name')
            return target, commit
        staging = self.root / 'staging' / ('worktree-' + uuid.uuid4().hex)
        self.run(['git', '-C', repository, 'worktree', 'add', '--detach', staging, commit])
        temporary = self.root / 'runtime' / self.run_id / 'tmp'
        temporary.mkdir(parents=True, exist_ok=True)
        env = dict(os.environ, WRANGLER_SEND_METRICS='false', CLOUDFLARE_CF_FETCH_ENABLED='false', TMPDIR=str(temporary))
        command = ['npm', 'ci', '--no-audit', '--no-fund', '--cache', self.cache / 'npm']
        if self.args.offline:
            command.append('--offline')
        self.run(command, cwd=staging, env=env)
        target.parent.mkdir(parents=True, exist_ok=True)
        self.run(['git', '-C', repository, 'worktree', 'move', staging, target])
        atomic_json(marker, {'commit': commit, 'lockSha256': digest(target / 'package-lock.json')})
        return target, commit

    def environment(self, paths, python, repository):
        variables = dict(POPULOUS_PREREQUISITES=str(self.tools), POPULOUS_EXE=str(paths['game'] / 'd3dpoptb.exe'),
                         POPULOUS_GAME_ROOT=str(paths['game']), GHIDRA_HOME=str(paths['ghidra']),
                         JAVA_HOME=str(paths['jdk']), POPULOUS_BROWSER=str(paths['browser'] / 'chrome-headless-shell'),
                         POPULOUS_HEADLESS_SHELL=str(paths['browser'] / 'chrome-headless-shell'),
                         POPULOUS_PYTHON=str(python), WRANGLER_SEND_METRICS='false', CLOUDFLARE_CF_FETCH_ENABLED='false',
                         XDG_CONFIG_HOME=str(self.tools / 'config'), XDG_CACHE_HOME=str(self.tools / 'cache'),
                         XDG_DATA_HOME=str(self.tools / 'data'))
        temporary = self.root / 'runtime' / self.run_id / 'tmp'
        temporary.mkdir(parents=True, exist_ok=True)
        # Keep extensionless fixtures outside the repository's ESM package scope.
        variables['TMPDIR'] = str(temporary)
        if repository:
            variables['POPULOUS_REPOSITORY'] = str(repository)
        content = '# Generated local paths. Re-run the bootstrap after a reset; never back up credentials.\n'
        content += '\n'.join(f'export {key}={shlex.quote(value)}' for key, value in variables.items()) + '\n'
        content += f'export PATH={shlex.quote(str(python.parent))}:"$PATH"\n'
        # Unique env per run: never overwrite a file another job may have sourced.
        output = self.receipt / 'env.sh'
        output.write_text(content)
        self.result['environmentFile'] = str(output)
        env = dict(os.environ, **variables)
        env['PATH'] = str(python.parent) + os.pathsep + env.get('PATH', '')
        return env

    def recover(self):
        if (platform.system(), platform.machine()) != ('Linux', 'x86_64'):
            raise ValueError('This manifest supports Linux x86_64 only')
        if sys.version_info[:2] != (3, 12):
            raise ValueError('Use Python 3.12 for the pinned native dependencies')
        for tool in ['git', 'curl', 'node', 'npm']:
            if not shutil.which(tool):
                raise ValueError(f'Missing host prerequisite: {tool}')
        node = self.run(['node', '--version'])
        if tuple(map(int, node.lstrip('v').split('.'))) < (22, 13, 0):
            raise ValueError('Node >=22.13.0 is required')
        self.result['host'] = {'node': node, 'python': platform.python_version(), 'platform': platform.platform()}
        # Do not persist gh status output, config paths, tokens, or credential helpers.
        auth = False
        if not self.args.offline and shutil.which('gh'):
            try:
                auth = subprocess.run(['gh', 'auth', 'status', '--hostname', 'github.com'],
                                      stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                      timeout=20).returncode == 0
            except subprocess.TimeoutExpired:
                pass
        self.result['githubAuth'] = ('not checked (offline)' if self.args.offline else
                                     'available (not a write-permission test)' if auth else
                                     'absent or unreachable; authenticate separately for pushes/PRs')
        python = self.python()
        paths = {name: self.tool(name, python) for name in self.manifest['artifacts']}
        verify(paths['game'] / 'd3dpoptb.exe', self.manifest['executableSha256'])
        repository, commit = (None, None) if self.args.prerequisites_only else self.repository()
        env = self.environment(paths, python, repository)
        self.run([paths['jdk'] / 'bin/java', '-version'], env=env)
        self.run([paths['browser'] / 'chrome-headless-shell', '--version'], env=env)
        if not (paths['ghidra'] / 'support/analyzeHeadless').is_file():
            raise ValueError('Ghidra headless launcher missing')
        if repository:
            self.run([python, repository / 'scripts/decomp.py', 'check', paths['game'] / 'd3dpoptb.exe'], cwd=repository, env=env)
        self.result.update(status='passed', scope='prerequisites' if self.args.prerequisites_only else 'workspace',
                           repository=str(repository) if repository else None, commit=commit,
                           tools={name: str(path) for name, path in paths.items()})

    def execute(self):
        if any((parent / 'package.json').exists() for parent in [self.root, *self.root.parents]):
            raise ValueError('Root must be outside every Node package scope (ancestor package.json)')
        if self.root.is_symlink():
            raise ValueError('Root must not be a symlink')
        self.root.mkdir(parents=True, exist_ok=True)
        marker = self.root / 'bootstrap-owner.json'
        identity = {'schema': 1, 'repository': self.manifest['repository']}
        with (self.root / 'bootstrap.lock').open('a') as lock:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                raise ValueError('Another bootstrap owns this root; no lock was removed') from None
            if marker.exists():
                if json.loads(marker.read_text()) != identity:
                    raise ValueError('Root ownership marker differs; preserved untouched')
            else:
                if any(p.name != 'bootstrap.lock' for p in self.root.iterdir()):
                    raise ValueError('Root is not empty or bootstrap-owned; choose a fresh root')
                atomic_json(marker, identity)
            for path in [self.tools, self.cache, self.receipt.parent, self.receipt, self.root / 'staging',
                         self.root / 'runtime', self.root / 'worktrees', self.root / 'worktree-state']:
                if path.is_symlink() or (path.exists() and not path.is_dir()):
                    raise ValueError(f'Unexpected managed path preserved: {path}')
                path.mkdir(parents=True, exist_ok=True)
            try:
                self.recover()
            except Exception as error:
                self.result.update(status='blocked', error=str(error))
                raise
            finally:
                atomic_json(self.receipt / 'result.json', self.result)
                print(json.dumps({'status': self.result['status'], 'receipt': str(self.receipt / 'result.json'),
                                  'environment': self.result.get('environmentFile'),
                                  'githubAuth': self.result.get('githubAuth')}, indent=2), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', required=True, type=Path, help='New or bootstrap-owned writable workspace root')
    parser.add_argument('--cache', type=Path, action='append', default=[], help='Read-only archive cache; repeatable')
    parser.add_argument('--reuse-prerequisites', type=Path, help='Explicitly trusted existing tools/venv, verified before reuse')
    parser.add_argument('--offline', action='store_true', help='No artifact downloads, pip downloads or git fetches')
    parser.add_argument('--prerequisites-only', action='store_true', help='Recover tools/input without creating a checkout')
    parser.add_argument('--ref', default='main', help='main or an exact 40-character commit SHA')
    parser.add_argument('--worktree', help='New isolated worktree name; defaults to the commit prefix')
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text())
    try:
        Bootstrap(args, manifest).execute()
    except (ValueError, RuntimeError, OSError, subprocess.TimeoutExpired) as error:
        parser.exit(1, f'Bootstrap blocked: {error}\n')


if __name__ == '__main__':
    main()
