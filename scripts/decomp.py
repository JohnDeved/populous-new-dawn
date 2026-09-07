#!/usr/bin/env python3
"""Pinned static-analysis workflow. The original executable is never launched."""
import argparse
import hashlib
import json
import os
import platform
import re
import shutil
import struct
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCK = json.loads((ROOT / 'decomp/tools.json').read_text())
TOOLS = ROOT / '.tools/decomp'


def run(*args, **kwargs):
    return subprocess.run([str(a) for a in args], check=True, **kwargs)


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def verify(path, expected):
    if digest(path) != expected:
        raise ValueError(f'SHA256 mismatch: {path}')


def inspect(executable):
    verify(executable, LOCK['executableSha256'])
    b = executable.read_bytes()
    pe = struct.unpack_from('<I', b, 60)[0]
    if b[pe:pe + 4] != b'PE\0\0' or struct.unpack_from('<H', b, pe + 24)[0] != 0x10b:
        raise ValueError('Expected PE32 executable')
    debug_rva, debug_size = struct.unpack_from('<II', b, pe + 24 + 96 + 6 * 8)
    return {'sha256': digest(executable), 'bytes': len(b),
            'debugDirectoryRva': debug_rva, 'debugDirectorySize': debug_size}


def native_cpu(executable):
    """Map the verified PE image for isolated CPU comparisons; do not start Windows."""
    from unicorn import Uc, UC_ARCH_X86, UC_MODE_32
    identity = inspect(executable)
    data = executable.read_bytes()
    pe = struct.unpack_from('<I', data, 60)[0]
    count = struct.unpack_from('<H', data, pe + 6)[0]
    opt = struct.unpack_from('<H', data, pe + 20)[0]
    base = struct.unpack_from('<I', data, pe + 24 + 28)[0]
    size = struct.unpack_from('<I', data, pe + 24 + 56)[0]
    cpu = Uc(UC_ARCH_X86, UC_MODE_32)
    cpu.mem_map(base, (size + 4095) & ~4095)
    for i in range(count):
        _, _, va, length, offset = struct.unpack_from('<8sIIII', data, pe + 24 + opt + i * 40)
        if length:
            cpu.mem_write(base + va, data[offset:offset + length])
    return cpu, identity


def setup(cache):
    if (platform.system(), platform.machine()) != ('Darwin', 'arm64'):
        raise ValueError('Bootstrap targets macOS arm64; elsewhere supply GHIDRA_HOME and JAVA_HOME')
    TOOLS.mkdir(parents=True, exist_ok=True)
    cache.mkdir(parents=True, exist_ok=True)
    for name in ('ghidra', 'jdk'):
        item = LOCK[name]
        archive = cache / item['archive']
        if not archive.exists():
            partial = archive.with_suffix(archive.suffix + '.part')
            run('curl', '--fail', '--location', '--retry', '3', '-o', partial, item['url'])
            verify(partial, item['sha256'])
            partial.replace(archive)
        verify(archive, item['sha256'])
        if not (TOOLS / item['home']).exists():
            if name == 'ghidra':
                run('ditto', '-xk', archive, TOOLS)
            else:
                run('tar', '-xzf', archive, '-C', TOOLS)
    ghidra = TOOLS / LOCK['ghidra']['home']
    binary = ghidra / 'Ghidra/Features/Decompiler/os/mac_arm_64/decompile'
    if not binary.exists():
        cpp = ghidra / 'Ghidra/Features/Decompiler/src/decompile/cpp'
        run('make', '-j4', 'ghidra_opt', 'ARCH_TYPE=-arch arm64',
            'ADDITIONAL_FLAGS=-mmacosx-version-min=11.0 -w', cwd=cpp)
        binary.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(cpp / 'ghidra_opt', binary)
    print(f'Tools ready: {TOOLS}')


def metadata():
    item = LOCK['metadata']
    checkout = TOOLS / 'pop3-rev'
    if not checkout.exists():
        checkout.mkdir(parents=True)
        run('git', 'init', checkout)
    path = checkout / item['file']
    if not path.exists():
        run('git', '-C', checkout, 'fetch', '--depth', '1', item['repository'], item['commit'])
        run('git', '-C', checkout, 'checkout', '--detach', 'FETCH_HEAD')
    verify(path, item['sha256'])
    return path


def headless(args, *options):
    ghidra = Path(os.environ.get('GHIDRA_HOME', TOOLS / LOCK['ghidra']['home']))
    env = dict(os.environ, JAVA_HOME=os.environ.get('JAVA_HOME', str(TOOLS / LOCK['jdk']['home'])))
    args.project_dir.mkdir(parents=True, exist_ok=True)
    run(ghidra / 'support/analyzeHeadless', args.project_dir, args.project_name,
        '-scriptPath', ROOT / 'scripts/ghidra', *options, env=env)


def export(args):
    addresses = args.addresses or [f.stem for f in sorted((ROOT / 'decomp/generated').glob('*.c'))]
    if not addresses or any(not re.fullmatch(r'[0-9a-fA-F]{8}', a) for a in addresses):
        raise ValueError('Supply eight-digit hexadecimal entry addresses')
    addresses = sorted(set(a.lower() for a in addresses))
    # Ghidra can return exit 0 after a script exception. Require a fresh completion receipt.
    with tempfile.TemporaryDirectory(prefix='populous-export-') as tmp:
        headless(args, '-process', args.program, '-noanalysis', '-postScript',
                 'ExportFunctions.java', tmp, *addresses)
        output = Path(tmp)
        if not (output / 'complete.txt').is_file():
            raise RuntimeError('Export failed: no completion receipt; existing exports preserved')
        for address in addresses:
            if not (output / f'{address}.c').is_file():
                raise RuntimeError(f'Missing function {address}')
        args.output.mkdir(parents=True, exist_ok=True)
        for address in addresses:
            shutil.copy2(output / f'{address}.c', args.output / f'{address}.c')
    print(f'Exported {len(addresses)} functions to {args.output}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    setup_parser = sub.add_parser('setup', help='Install verified Ghidra and JDK locally')
    setup_parser.add_argument('--cache', type=Path, default=TOOLS / 'downloads')
    init_parser = sub.add_parser('init', help='Analyze original bytes and optionally apply community metadata')
    init_parser.add_argument('executable', type=Path)
    init_parser.add_argument('--metadata', action='store_true')
    export_parser = sub.add_parser('export', help='Export selected functions, or all recorded functions')
    export_parser.add_argument('addresses', nargs='*')
    export_parser.add_argument('--program', default='d3dpoptb.exe')
    export_parser.add_argument('--output', type=Path, default=ROOT / 'decomp/generated')
    for p in (init_parser, export_parser):
        # Ghidra rejects hidden directory components in project paths.
        p.add_argument('--project-dir', type=Path, default=ROOT / 'work/decomp/projects')
        p.add_argument('--project-name', default='populous')
    check_parser = sub.add_parser('check', help='Verify executable identity and recorded exports')
    check_parser.add_argument('executable', type=Path)
    args = parser.parse_args()
    if args.command == 'setup':
        setup(args.cache.resolve())
    elif args.command == 'init':
        print(json.dumps(inspect(args.executable), indent=2), flush=True)
        options = ['-import', args.executable.resolve()]
        with tempfile.TemporaryDirectory(prefix='populous-init-') as tmp:
            if args.metadata:
                print('Community metadata describes a different hash; names/types remain hypotheses.', flush=True)
                options += ['-postScript', 'ImportMetadata.java', metadata(), Path(tmp) / 'metadata-complete.txt']
            headless(args, *options, '-postScript', 'ExportFunctions.java', tmp, '00586074')
            if not (Path(tmp) / 'complete.txt').is_file():
                raise RuntimeError('Initialization failed; inspect Ghidra output')
            if args.metadata and not (Path(tmp) / 'metadata-complete.txt').is_file():
                raise RuntimeError('Metadata import failed; inspect Ghidra output')
    elif args.command == 'export':
        export(args)
    else:
        print(json.dumps(inspect(args.executable), indent=2))
        manifest = json.loads((ROOT / 'decomp/exports.json').read_text())
        if manifest['executableSha256'] != LOCK['executableSha256']:
            raise ValueError('Export manifest targets a different executable')
        for name, sha in manifest['files'].items():
            verify(ROOT / 'decomp/generated' / name, sha)
        # Exercise rejection as well as real executable/table checks.
        with tempfile.TemporaryDirectory() as tmp:
            bad = Path(tmp) / 'wrong.exe'
            bad.write_bytes(b'not the reference executable')
            try:
                inspect(bad)
            except ValueError:
                pass
            else:
                raise AssertionError('Unknown executable was accepted')
        run('python3', ROOT / 'scripts/inspect-executable.py', args.executable,
            ROOT / 'app/original-constants.json', stdout=subprocess.DEVNULL)
        print(f"Verified {len(manifest['files'])} exports, native tables and unknown-build rejection")


if __name__ == '__main__':
    main()
