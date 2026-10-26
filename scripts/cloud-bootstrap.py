#!/usr/bin/env python3
"""Plan or create a bound source-only workspace; native recovery is disabled.

Host prerequisites: Linux x86_64, Python 3.12 with venv, git, curl, Node >=22.13,
for native recovery. Source-only mode needs Python and Git, not native tools.
See engineering/cloud-bootstrap.md for trust and recovery boundaries.
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


def tree_digest(root, ignored=(), executable_bits=False):
    """Content identity without timestamps, permissions, or absolute paths."""
    h = hashlib.sha256()
    for path in sorted(root.rglob('*')):
        relative = path.relative_to(root)
        if relative.parts[0] in ignored:
            continue
        name = relative.as_posix()
        if path.is_symlink():
            if not path.resolve().is_relative_to(root.resolve()):
                raise ValueError(f'External symlink in tool tree: {name}')
            value = 'link:' + os.readlink(path)
        elif path.is_file():
            value = 'file:' + digest(path)
            if executable_bits:
                value += ':exec=' + oct(path.stat().st_mode & 0o111)
        elif path.is_dir():
            continue
        else:
            raise ValueError(f'Unsupported file in tool tree: {name}')
        h.update((name + '\0' + value + '\n').encode())
    return h.hexdigest()


def dependency_digest(root):
    # These are disposable bundler/tool caches, never installed package source.
    return tree_digest(root, ignored={'.cache', '.vite', '.vite-temp'}, executable_bits=True)


def atomic_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.' + uuid.uuid4().hex + '.tmp')
    temporary.write_text(json.dumps(data, indent=2) + '\n')
    temporary.replace(path)


def member_path(name):
    path = PurePosixPath(name)
    if not path.parts or path.is_absolute() or '..' in path.parts or '\\' in name or '\0' in name:
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
                parent = target.parent
                while parent != destination:
                    if parent.is_symlink():
                        raise ValueError(f'Archive link has a symlinked parent: {target}')
                    parent = parent.parent
                # Earlier links can change how later relative targets resolve.
                if not (target.parent / value).resolve().is_relative_to(destination.resolve()):
                    raise ValueError(f'Escaping archive link: {target}')
                target.parent.mkdir(parents=True, exist_ok=True)
                target.symlink_to(value)
            for target, _ in links:
                if not target.resolve().is_relative_to(destination.resolve()):
                    raise ValueError(f'Escaping final archive link: {target}')
    else:
        raise ValueError(f'Unknown archive format: {kind}')


class Bootstrap:
    def __init__(self, args, manifest):
        self.args, self.manifest = args, manifest
        self.root = Path(os.path.abspath(args.root))
        self.tools = self.root / 'prerequisites'
        self.cache = self.root / 'downloads'
        self.run_id = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ-') + uuid.uuid4().hex[:8]
        self.receipt = self.root / 'receipts' / self.run_id
        self.commands = []
        self.lock_fd = None
        self.result = {'schema': 1, 'status': 'unknown', 'run': self.run_id,
                       'manifestSha256': digest(MANIFEST), 'scriptSha256': digest(Path(__file__)),
                       'inputSha256': {name: digest(SOURCE / name) for name in [
                           'engineering/cloud-python.lock', 'engineering/cloud-python-build.lock',
                           'scripts/extract-reference.py']},
                       'commands': self.commands, 'limits': [
                           'Original installer and complete game executable are never launched.',
                           'No old ignored evidence, saves, Ghidra projects, or credentials are reconstructed.',
                           'Version/readiness checks are not browser gameplay, Ghidra analysis, or hardware performance proof.']}

    def run(self, argv, cwd=None, env=None, check=True, stdout_fd=None):
        index = len(self.commands)
        prefix = self.receipt / f'{index:02d}'
        record = {'argv': [str(x) for x in argv], 'cwd': str(cwd) if cwd else None,
                  'status': 'unknown'}
        if stdout_fd is not None:
            output = os.fstat(stdout_fd)
            record['stdoutSink'] = {'kind': 'held-archive-partial', 'device': output.st_dev,
                                    'inode': output.st_ino, 'initialBytes': output.st_size}
            record['stdoutCaptured'] = False  # Payload goes to the held file, not a log.
        self.commands.append(record)
        atomic_json(self.receipt / 'result.json', self.result)
        with prefix.with_suffix('.stdout').open('w') as out, prefix.with_suffix('.stderr').open('w') as err:
            temporary = self.root / 'runtime' / self.run_id / 'tmp'
            temporary.mkdir(parents=True, exist_ok=True)
            run_env = dict(os.environ if env is None else env, GIT_TERMINAL_PROMPT='0',
                           GH_PROMPT_DISABLED='1', TMPDIR=str(temporary))
            # A surviving direct child retains ownership if this controller is interrupted.
            inherited = () if self.lock_fd is None else (self.lock_fd,)
            completed = subprocess.run(record['argv'], cwd=cwd, env=run_env,
                                       stdout=out if stdout_fd is None else stdout_fd, stderr=err,
                                       timeout=1800, pass_fds=inherited)
        record.update(exitCode=completed.returncode, status='passed' if completed.returncode == 0 else 'failed',
                      stdoutSha256=digest(prefix.with_suffix('.stdout')),
                      stderrSha256=digest(prefix.with_suffix('.stderr')))
        atomic_json(self.receipt / 'result.json', self.result)
        if check and completed.returncode:
            raise RuntimeError(f'Command failed ({completed.returncode}): {argv[0]}; inspect {prefix}.stderr')
        return prefix.with_suffix('.stdout').read_text().strip()

    def archive(self, item):
        """Resume only an owned single-link regular partial through a held writer.

        The root lock and cache require cooperative ownership. Descriptor-relative
        checks do not make the whole bootstrap safe against hostile concurrent
        directory/name replacement or a same-user process altering open inodes.
        """
        name = item['sha256'] + '-' + item['archive']
        if Path(name).name != name or '/' in name or '\\' in name or '\0' in name:
            raise ValueError('Archive cache name must be a single path component')
        target = self.cache / name
        self.cache.mkdir(parents=True, exist_ok=True)
        directory = os.open(self.cache, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            if os.fstat(directory).st_uid != os.geteuid():
                raise ValueError('Archive cache directory is not owned by this user')

            def entry(filename):
                try:
                    return os.stat(filename, dir_fd=directory, follow_symlinks=False)
                except FileNotFoundError:
                    return None

            def regular(value, filename, links=1):
                if (value is None or not stat.S_ISREG(value.st_mode)
                        or value.st_uid != os.geteuid() or value.st_nlink != links):
                    raise ValueError(f'Unsafe managed archive file preserved: {filename}')
                return value.st_dev, value.st_ino

            def pinned(fd, filename, links=1):
                held = os.fstat(fd)
                if regular(held, filename, links) != regular(entry(filename), filename, links):
                    raise ValueError(f'Archive file identity changed; preserved: {filename}')
                return held

            def opened(filename, flags):
                before = entry(filename)
                regular(before, filename)
                fd = os.open(filename, flags | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=directory)
                try:
                    if regular(before, filename) != regular(pinned(fd, filename), filename):
                        raise ValueError(f'Archive file identity changed; preserved: {filename}')
                    return fd
                except BaseException:
                    os.close(fd)
                    raise

            def fingerprint(fd, filename):
                before = pinned(fd, filename)
                h, offset = hashlib.sha256(), 0
                while block := os.pread(fd, 1024 * 1024, offset):
                    h.update(block)
                    offset += len(block)
                after = pinned(fd, filename)
                if ((before.st_size, before.st_mtime_ns, before.st_ctime_ns)
                        != (after.st_size, after.st_mtime_ns, after.st_ctime_ns)):
                    raise ValueError(f'Archive changed while hashing; preserved: {filename}')
                return h.hexdigest()

            if entry(name) is not None:
                fd = opened(name, os.O_RDONLY)
                try:
                    if fingerprint(fd, name) != item['sha256']:
                        raise ValueError(f'SHA-256 mismatch or missing file: {target}')
                    return target
                finally:
                    os.close(fd)
            # Explicit external caches remain read-only; never download into them.
            for candidate in [*(root / item['archive'] for root in self.args.cache),
                              *(root / name for root in self.args.cache)]:
                if candidate.exists():
                    verify(candidate, item['sha256'])
                    return candidate

            partial = name + '.part'
            if entry(partial) is None:
                if self.args.offline:
                    raise ValueError(f'Offline cache miss: {item["archive"]}')
                fd = os.open(partial, os.O_RDWR | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                             0o600, dir_fd=directory)
            else:
                fd = opened(partial, os.O_RDWR)
            try:
                if fingerprint(fd, partial) != item['sha256']:
                    if self.args.offline:
                        raise ValueError(f'Offline cache miss: {item["archive"]}')
                    size = pinned(fd, partial).st_size
                    os.lseek(fd, size, os.SEEK_SET)
                    # Explicit offset: curl cannot infer the size of stdout. Its
                    # stdout is dup'd from this held descriptor, never reopened by name.
                    # Curl cannot rewind stdout on retry. Preserve an interrupted
                    # partial for a later explicit invocation with a fresh offset.
                    self.run(['curl', '--fail', '--location', '--proto', '=https', '--proto-redir', '=https',
                              '--connect-timeout', '30', '--max-time', '1800', '--retry', '0',
                              '--continue-at', str(size), '--output', '-', item['url']], stdout_fd=fd)
                    if fingerprint(fd, partial) != item['sha256']:
                        raise ValueError(f'SHA-256 mismatch or missing file: {self.cache / partial}')
                pinned(fd, partial)
                # link() is exclusive, unlike rename(): an appearing destination
                # is preserved, together with the verified partial, on failure.
                os.link(partial, name, src_dir_fd=directory, dst_dir_fd=directory, follow_symlinks=False)
                pinned(fd, partial, links=2)
                pinned(fd, name, links=2)
                os.unlink(partial, dir_fd=directory)
                pinned(fd, name)
                return target
            finally:
                os.close(fd)
        finally:
            os.close(directory)

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
                # Normalize '..' without resolving the interpreter symlink out of its venv.
                return Path(os.path.abspath(candidate))
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
                command = [python, '-m', 'pip', '--isolated', '--cache-dir', self.cache / 'pip', 'download', '--disable-pip-version-check', '--no-deps',
                           '--no-build-isolation', '--require-hashes', '--dest', wheel_cache, '-r', lock]
                if lock == build:
                    command.append('--only-binary=:all:')
                self.run(command)
            command = [python, '-m', 'pip', '--isolated', '--cache-dir', self.cache / 'pip', 'install', '--disable-pip-version-check', '--no-index',
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
        self.run([python, '-m', 'pip', '--isolated', '--cache-dir', self.cache / 'pip', 'check'])

    def repository(self):
        raise ValueError('Per-worker npm bootstrap retired; use the bound source/runtime planner')

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
        if not self.args.prerequisites_only:
            raise ValueError('Native recovery requires explicit prerequisites-only scope')
        if (platform.system(), platform.machine()) != ('Linux', 'x86_64'):
            raise ValueError('This manifest supports Linux x86_64 only')
        if sys.version_info[:2] != (3, 12):
            raise ValueError('Use Python 3.12 for the pinned native dependencies')
        for tool in ['git', 'curl', 'node']:
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
        for executable in ['support/analyzeHeadless', 'Ghidra/Features/Decompiler/os/linux_x86_64/decompile']:
            if not os.access(paths['ghidra'] / executable, os.X_OK):
                raise ValueError(f'Ghidra executable missing or not executable: {executable}')
        if repository:
            self.run([python, repository / 'scripts/decomp.py', 'check', paths['game'] / 'd3dpoptb.exe'], cwd=repository, env=env)
        self.result.update(status='passed', scope='prerequisites' if self.args.prerequisites_only else 'workspace',
                           repository=str(repository) if repository else None, commit=commit,
                           tools={name: str(path) for name, path in paths.items()})

    def execute(self):
        ancestors = [self.root, *self.root.parents, self.root.resolve(), *self.root.resolve().parents]
        if any((parent / 'package.json').exists() for parent in ancestors):
            raise ValueError('Root must be outside every Node package scope (ancestor package.json)')
        if self.root.is_symlink():
            raise ValueError('Root must not be a symlink')
        self.root.mkdir(parents=True, exist_ok=True)
        marker = self.root / 'bootstrap-owner.json'
        identity = {'schema': 1, 'repository': self.manifest['repository']}
        with (self.root / 'bootstrap.lock').open('a') as lock:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                self.lock_fd = lock.fileno()
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
    parser.add_argument('--mode', choices=('source', 'runtime', 'prerequisites'), default='source')
    action = parser.add_mutually_exclusive_group()
    action.add_argument('--plan', '--dry-run', action='store_true', help='Read-only planning (default)')
    action.add_argument('--apply', action='store_true', help='Create a source-only workspace (native recovery is disabled)')
    parser.add_argument('--binding', type=Path, help='Existing environment-owned storage binding')
    parser.add_argument('--binding-sha256', help='Explicit approved binding fingerprint')
    parser.add_argument('--source', type=Path, help='Existing clean local exact-source donor')
    parser.add_argument('--reserve-bytes', type=int, default=0)
    parser.add_argument('--allocation-bytes', type=int, default=0)
    parser.add_argument('--root', type=Path, help='Native prerequisite recovery root; not a warm storage selector')
    parser.add_argument('--cache', type=Path, action='append', default=[], help='Read-only archive cache; repeatable')
    parser.add_argument('--reuse-prerequisites', type=Path, help='Explicitly trusted existing tools/venv, verified before reuse')
    parser.add_argument('--offline', action='store_true', help='No artifact downloads, pip downloads or git fetches')
    parser.add_argument('--prerequisites-only', action='store_true', help='Legacy native selector; fails closed pending bounded execution qualification')
    parser.add_argument('--ref', help='Exact 40-character commit SHA for warm provisioning')
    parser.add_argument('--worktree', help='Explicit stable worker name under the bound private workspace root')
    args = parser.parse_args()
    try:
        if args.prerequisites_only:
            if args.mode != 'source':
                raise ValueError('Use either --mode prerequisites or --prerequisites-only')
            args.mode = 'prerequisites'
        if args.mode == 'prerequisites':
            raise ValueError('Native prerequisite recovery is disabled: bounded native execution '
                             'and extraction are not qualified; use source mode for warm workspace setup')
        if args.mode != 'prerequisites':
            if args.root or args.cache or args.reuse_prerequisites:
                raise ValueError('Recovery roots/cache options are separate from warm storage bindings')
            if not args.source or not args.binding:
                raise ValueError('Warm provisioning requires --source and --binding')
            sys.dont_write_bytecode = True
            sys.path.insert(0, str(SOURCE / 'scripts/orchestration'))
            from shared_workspace import execute
            print(json.dumps(execute(args), indent=2))
    except (ValueError, RuntimeError, OSError, KeyError, subprocess.SubprocessError) as error:
        parser.exit(1, f'Bootstrap blocked: {error}\n')


if __name__ == '__main__':
    main()

