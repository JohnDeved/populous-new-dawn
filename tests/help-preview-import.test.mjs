import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import supplemental from '../app/original-help-previews.json' with { type: 'json' }

const script = fileURLToPath(new URL('../scripts/import-help-previews.py', import.meta.url))
function python(body) {
  const result = spawnSync('python3', ['-B', '-c', `
import importlib.util, tempfile, pathlib, hashlib, sys, json, os
spec = importlib.util.spec_from_file_location('help_preview_import', ${JSON.stringify(script)})
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
${body}
`], { encoding: 'utf8', timeout: 10000 })
  assert.equal(result.status, 0, result.stderr || result.stdout)
}

test('preview exporter pins the original executable and both complete model banks', () => {
  python(`
assert len(m.PINS) == 7
assert m.PINS['d3dpoptb.exe'] == '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
assert m.PINS == json.loads(${JSON.stringify(JSON.stringify(supplemental.sources))})
`)
})

test('all source hashes are preflighted before decode and destination creation', () => {
  python(`
with tempfile.TemporaryDirectory() as temp:
    root = pathlib.Path(temp)
    (root / 'first').write_bytes(b'valid')
    (root / 'last').write_bytes(b'changed')
    m.PINS = {'first': hashlib.sha256(b'valid').hexdigest(), 'last': hashlib.sha256(b'expected').hexdigest()}
    output = root / 'original-help-previews.json'
    decoded = []
    m.export = lambda data: decoded.append(True)
    sys.argv = ['import-help-previews.py', str(root), '--output', str(output)]
    try:
        m.main()
        raise AssertionError('mismatched input accepted')
    except ValueError as error:
        assert 'Source hash mismatch: last' in str(error)
    assert not decoded and not output.exists()
`)
})

test('source symlinks and unbounded files are not accepted as verified regular data', () => {
  python(`
with tempfile.TemporaryDirectory() as temp:
    root = pathlib.Path(temp)
    real = root / 'real'; real.write_bytes(b'valid')
    m.PINS = {'link': hashlib.sha256(b'valid').hexdigest()}
    (root / 'link').symlink_to(real)
    try:
        m.verified_inputs(root)
        raise AssertionError('source symlink accepted')
    except ValueError as error:
        assert 'bounded regular source' in str(error)
    m.PINS = {'large': 'unused'}
    with (root / 'large').open('wb') as file:
        file.truncate(16 * 1024 * 1024 + 1)
    try:
        m.verified_inputs(root)
        raise AssertionError('unbounded source accepted')
    except ValueError as error:
        assert 'bounded regular source' in str(error)
`)
})

test('export output is exclusive, preview-only and symlink rejecting; check is read-only', () => {
  python(`
with tempfile.TemporaryDirectory() as temp:
    root = pathlib.Path(temp)
    # Isolate destination semantics from source parsing with synthetic trusted data.
    m.PINS = {}; m.export = lambda data: {'version': 1, 'test': True}
    output = root / 'original-help-previews.json'
    def call(flag, path):
        sys.argv = ['import-help-previews.py', str(root), flag, str(path)]
        m.main()
    call('--output', output)
    before = output.read_bytes()
    try:
        call('--output', output)
        raise AssertionError('overwrite accepted')
    except FileExistsError:
        pass
    assert output.read_bytes() == before
    call('--check', output)
    assert output.read_bytes() == before
    shared = root / 'original-models.json'
    try:
        call('--output', shared)
        raise AssertionError('shared bank filename accepted')
    except ValueError as error:
        assert 'must be named' in str(error)
    assert not shared.exists()
    other = root / 'other'; other.mkdir()
    linked = other / 'original-help-previews.json'; linked.symlink_to(output)
    for flag in ['--output', '--check']:
        try:
            call(flag, linked)
            raise AssertionError('destination symlink accepted')
        except ValueError as error:
            assert 'symlinks' in str(error)
    assert output.read_bytes() == before
    m.export = lambda data: {'changed': True}
    try:
        call('--check', output)
        raise AssertionError('different output accepted')
    except ValueError as error:
        assert 'differs' in str(error)
    assert output.read_bytes() == before
`)
})

test('new exporter never imports the full importer or invokes original software', () => {
  const code = readFileSync(script, 'utf8')
  assert.doesNotMatch(code, /import-original|subprocess|os\.system|exec\(|eval\(/)
  assert.match(code, /target\.open\('xb'\)/)
  assert.match(code, /export\(verified_inputs\(args\.source\)\)/)
})
