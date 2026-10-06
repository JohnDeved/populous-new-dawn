"""Read-only source/input preflight. Does not import a game module or create a CPU."""
import argparse
import ast
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
BASE = 'b0208188b8de345a6ad5e86cb7c49769624dda86'
EXE_SHA = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
MAPPER_SHA = '0a4783a8ee924c52e1125a5df3e4e625b3ab00835e848a2013e444bcfd979c2e'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('game', type=Path)
    parser.add_argument('--native-helper', type=Path, required=True)
    args = parser.parse_args()
    sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
    command = lambda *argv: subprocess.check_output(argv, cwd=ROOT, text=True).strip()
    assert command('git', 'diff', BASE, '--', 'app', 'public') == '', 'Application/artwork changed'
    assert sha(args.game / 'd3dpoptb.exe') == EXE_SHA
    assert sha(args.native_helper) == MAPPER_SHA
    helper_root = args.native_helper.resolve().parents[1]
    assert sha(helper_root / 'app/original-constants.json') == sha(ROOT / 'app/original-constants.json')
    mapper_source = args.native_helper.read_text()
    mapper_ast = ast.parse(mapper_source)
    native_fn = next(node for node in mapper_ast.body if isinstance(node, ast.FunctionDef) and node.name == 'native_cpu')
    body = ast.get_source_segment(mapper_source, native_fn)
    assert 'tcg_buffer_size' in [arg.arg for arg in native_fn.args.kwonlyargs]
    assert body.index('ctl_set_tcg_buffer_size') < body.index('mem_map')
    for path in (HERE / 'probe.py', HERE / 'preflight.py', HERE / 'host-check.py', HERE / 'port-smoke.py'):
        ast.parse(path.read_text(), filename=str(path))
    node = Path(shutil.which('node')).resolve()
    checked = subprocess.run([str(node), '--check', str(HERE / 'port.mjs')], capture_output=True, text=True)
    assert checked.returncode == 0, checked.stderr
    specs = json.loads((HERE / 'cases.json').read_text())
    assert len(specs) == 8 and sum(s['visits'] for s in specs) == 35
    # Conservative source closure includes type-only imports as well.
    queue = [ROOT / 'app/live-building-combat.ts']
    closure = {}
    while queue:
        path = queue.pop().resolve()
        label = str(path.relative_to(ROOT))
        if label in closure:
            continue
        assert path.is_file() and not path.is_symlink()
        closure[label] = sha(path)
        if path.suffix != '.ts':
            continue
        for specifier in re.findall(r'\bfrom\s+[\'"]([^\'"]+)[\'"]', path.read_text()):
            assert specifier.startswith('.'), f'Bare dependency requires separate grant: {label}: {specifier}'
            dependency = (path.parent / specifier).resolve()
            assert dependency.is_relative_to(ROOT / 'app')
            queue.append(dependency)
    inputs = {}
    for name in ('d3dpoptb.exe', 'levels/constant.dat', 'data/vstart-0.ani', 'data/vfra-0.ani'):
        path = args.game / name
        inputs[name] = {'bytes': path.stat().st_size, 'sha256': sha(path)}
    frame_rows = list(struct.iter_unpack('<HBBBBH', (args.game / 'data/vfra-0.ani').read_bytes()))
    count_values = []
    for first, _ in struct.iter_unpack('<HH', (args.game / 'data/vstart-0.ani').read_bytes()):
        at, seen = first, set()
        while at and at not in seen:
            assert len(seen) < 255
            seen.add(at)
            at = frame_rows[at][-1]
        assert at in (0, first)
        count_values.append(len(seen))
    assert count_values[56:64] == [5] * 8 and count_values[48] == 6
    exe = (args.game / 'd3dpoptb.exe').read_bytes()
    pe = struct.unpack_from('<I', exe, 60)[0]
    image_bytes = (struct.unpack_from('<I', exe, pe + 24 + 56)[0] + 4095) & ~4095
    assert image_bytes + 0x50000 < 16 * 1024**2
    print(json.dumps({
        'status': 'passed', 'nativeExecution': False, 'portExecution': False,
        'browserExecution': False, 'sourceHead': command('git', 'rev-parse', 'HEAD'),
        'sourceStatus': command('git', 'status', '--short'), 'applicationBase': BASE,
        'priorAudit': 'efd5d17293b18802b3cdca447b2efa8de8aca5b0',
        'python': {'path': str(Path(sys.executable).resolve()), 'version': sys.version},
        'unicornVersion': importlib.metadata.version('unicorn'),
        'node': {'path': str(node), 'version': command(str(node), '--version'), 'sha256': sha(node)},
        'nativeHelper': {'path': str(args.native_helper.resolve()), 'sha256': MAPPER_SHA},
        'nativeInputs': inputs, 'applicationClosure': dict(sorted(closure.items())),
        'probeSources': {p.name: sha(p) for p in sorted(HERE.iterdir()) if p.is_file()},
        'nativeImageBytes': image_bytes, 'mappedFixtureBytes': 0x50000,
        'cases': 16, 'maximumPlannedVisits': 70, 'requestedCpu': 4,
        'currentAffinity': sorted(os.sched_getaffinity(0)),
        'grantStatus': 'not-granted-by-this-preflight',
        'checks': {'pythonSyntax': 'passed', 'nodeSyntax': 'passed',
                   'native': 'not-run', 'portComparison': 'not-run', 'ordinaryBrowser': 'not-run'},
    }, indent=2))


if __name__ == '__main__':
    main()
