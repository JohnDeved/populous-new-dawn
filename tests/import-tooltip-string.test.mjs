// Run the actual scoped producer with only its verified-input boundary supplied.
// No original binary/language assets, native execution or image imports are needed.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

test('scoped Blast text producer preserves entries, is idempotent and rejects mismatched inputs', () => {
  const script = fileURLToPath(new URL('../scripts/import-messages.py', import.meta.url))
  const result = spawnSync(
    'python3',
    [
      '-c',
      String.raw`
import hashlib, json, pathlib, runpy, struct, sys, tempfile, types
script = sys.argv[1]
with tempfile.TemporaryDirectory() as directory:
    root = pathlib.Path(directory)
    (root / 'app').mkdir()
    (root / 'language').mkdir()
    exe = bytearray(128)
    struct.pack_into('<I', exe, 60, 64)
    (root / 'd3dpoptb.exe').write_bytes(exe)
    strings = [''] * 815
    strings[814] = 'Blast: {}select. |}toggle on/off.'
    lang = ('\0'.join(strings) + '\0').encode('utf-16le')
    (root / 'language/lang00.dat').write_bytes(lang)
    digest = hashlib.sha256(exe).hexdigest()
    supplied = types.ModuleType('decomp')
    supplied.ROOT = root
    supplied.inspect = lambda path: {'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    sys.modules['decomp'] = supplied
    output = root / 'app/original-tooltips.json'
    original = {'executableSha256': digest, 'languageSha256': hashlib.sha256(lang).hexdigest(),
                'strings': {'908': 'retained Hut'}, 'names': {'2': [[908]]}, 'other': [1, 2, 3]}
    output.write_text(json.dumps(original))
    def run(number='814', *extra):
        sys.argv = [script, str(root), '--tooltip-string', number, *extra]
        try:
            runpy.run_path(script, run_name='__main__')
        except SystemExit as error:
            assert error.code == 0, error
    run()
    expected = {**original, 'strings': {**original['strings'], '814': strings[814]}}
    assert json.loads(output.read_text()) == expected
    saved = output.read_bytes()
    run()
    assert output.read_bytes() == saved
    for field in ['executableSha256', 'languageSha256']:
        bad = {**expected, field: 'wrong'}
        output.write_text(json.dumps(bad))
        before = output.read_bytes()
        try:
            run()
        except AssertionError:
            pass
        else:
            raise AssertionError('mismatched identity accepted: ' + field)
        assert output.read_bytes() == before
    output.write_bytes(saved)
    try:
        run('815')
    except ValueError:
        pass
    else:
        raise AssertionError('unbound text ID accepted')
    assert output.read_bytes() == saved
    assert sorted(p.name for p in (root / 'app').iterdir()) == ['original-tooltips.json']
`,
      script,
    ],
    { encoding: 'utf8' }
  )
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Imported tooltip string 814/)
})
