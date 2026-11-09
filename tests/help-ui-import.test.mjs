import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

test('Help data importer excludes bytecode writes, aliases, escape paths and concurrent replacement', () => {
  const output = execFileSync(process.env.PND_TEST_PYTHON || 'python3', ['-I', '-S', '-B', '-c', `
import runpy, sys, tempfile
from pathlib import Path
m = runpy.run_path('scripts/import-help-ui.py')
assert sys.dont_write_bytecode
with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    safe = m['output_target'](root, 'child/new.bin')
    m['write_new'](safe, b'old')
    try: m['write_new'](safe, b'new')
    except FileExistsError: pass
    else: raise AssertionError('existing file replaced')
    assert safe.read_bytes() == b'old'
    (root / 'dangling').symlink_to(root / 'absent')
    (root / 'alias').symlink_to(root / 'child', target_is_directory=True)
    for name in ['dangling', 'alias/new.bin', '../outside.bin', 'child']:
        try: m['output_target'](root, name)
        except ValueError: pass
        else: raise AssertionError('unsafe output accepted: ' + name)
    for name in ['dangling', 'child']:
        try: m['regular_file'](root / name)
        except ValueError: pass
        else: raise AssertionError('unsafe reused input accepted: ' + name)
    inputs = root / 'inputs'; inputs.mkdir(); (inputs / 'data').write_bytes(b'input')
    g = m['main'].__globals__
    g['EXPECTED'] = {'data': g['original'].sha(b'input')}
    g['build'] = lambda _: {'child/new.bin': b'old'}
    before = sorted((str(p), p.lstat().st_size, p.lstat().st_mtime_ns) for p in root.rglob('*'))
    sys.argv = ['import-help-ui.py', str(inputs), '--output', str(root), '--check']
    m['main']()
    after = sorted((str(p), p.lstat().st_size, p.lstat().st_mtime_ns) for p in root.rglob('*'))
    assert before == after
`], { cwd: new URL('../', import.meta.url), encoding: 'utf8' })
  assert.equal(JSON.parse(output).check, true)
})
