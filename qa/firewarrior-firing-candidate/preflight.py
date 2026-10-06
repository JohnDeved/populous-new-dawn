"""Read source/import and released dependency identities without running the game."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
BASE = 'b0208188b8de345a6ad5e86cb7c49769624dda86'
HELPER_COMMIT = '23f11ea9df6045b950269ec77aa9ea21d17b9637'
INSTALLED_LOCK = '65e45d0a87d1ecd4fbf56508b9821eb3bfb3867c8477db4aaa1452eb2bed13d8'
PACKAGE_LOCK = 'c1599d8d7e3f028e290a13561c653cf926e739e98eb9ec1b476dbe1c2a4558ba'
BROWSER_SHA = '7c141b276aacc74fe51f06986345fb0dbce0e3756413746fb18541b878c17706'
ADAPTED = {'ground-and-dispatch.mjs': 'three corridor points and off-center real minimap target',
           'observer.mjs': 'passive cooldown, projectile mesh/payload and target identity/damage reads',
           'pause-input.mjs': 'passive phase/order/projectile reads and firing-specific release assertions'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dependency-root', type=Path)
    parser.add_argument('--browser', type=Path)
    parser.add_argument('--source-only', action='store_true', help='No Node, dependency resolution or execution; inspect candidate Git objects')
    parser.add_argument('--require-local-dependencies', action='store_true')
    args = parser.parse_args()
    sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
    git = lambda *argv: subprocess.check_output(['git', *argv], cwd=ROOT, text=True).strip()
    candidate = json.loads((HERE / 'candidate-source.json').read_text())
    assert candidate['status'] == 'ready', 'Final candidate source pins are required'
    assert candidate['applicationBase'] == BASE
    commit = candidate['candidateCommit']
    assert re.fullmatch('[a-f0-9]{40}', commit)
    assert git('rev-parse', f'{commit}:app') == candidate['appTree']
    assert git('rev-parse', f'{commit}:public') == candidate['publicTree']
    changed = git('diff', '--name-only', BASE, commit, '--', 'app', 'public').splitlines()
    assert changed == sorted(candidate['changedFiles']), 'Complete exact app/public change inventory'
    for path, digest in candidate['changedFiles'].items():
        data = subprocess.check_output(['git', 'show', f'{commit}:{path}'], cwd=ROOT)
        assert hashlib.sha256(data).hexdigest() == digest, path
    application_matches = all(git('rev-parse', f'HEAD:{tree}') == candidate[key]
                              for tree, key in [('app', 'appTree'), ('public', 'publicTree')])
    if not args.source_only:
        assert args.dependency_root and args.browser, 'Runtime preflight needs released dependency/browser paths'
        assert application_matches, 'Integrate the pinned packed candidate before runtime readiness'
        assert git('status', '--porcelain') == '', 'Runtime requires a clean committed candidate'
        for path, digest in candidate['changedFiles'].items():
            assert sha(ROOT / path) == digest, path
    baseline = json.loads((HERE / 'baseline-provenance.json').read_text())
    for name, digest in baseline['sourceSha256'].items():
        old = subprocess.check_output(['git', 'show', f"{baseline['sourceCommit']}:{baseline['sourcePrefix']}{name}"], cwd=ROOT)
        assert hashlib.sha256(old).hexdigest() == digest, name
        assert sha(ROOT / baseline['sourcePrefix'] / name) == digest, f'Historical baseline changed: {name}'
        if name not in baseline['adapted']:
            assert sha(HERE / name) == digest, f'Unexpected candidate helper change: {name}'
    for name, digest in baseline['baselineEvidenceSha256'].items():
        assert sha(ROOT / 'evidence/firewarrior-firing-phase/browser-baseline-01' / name) == digest, name
    def source_bytes(path):
        label = str(path.relative_to(ROOT))
        if args.source_only and label.startswith(('app/', 'public/')):
            return subprocess.check_output(['git', 'show', f'{commit}:{label}'], cwd=ROOT)
        return path.read_bytes()
    assert sha(ROOT / 'package-lock.json') == PACKAGE_LOCK
    if not args.source_only:
        assert sha(args.browser) == BROWSER_SHA
    provenance = json.loads((HERE / 'helper-provenance.json').read_text())
    assert provenance['sourceCommit'] == HELPER_COMMIT
    helper_identity = {}
    for name, digest in provenance['sourceSha256'].items():
        original = subprocess.check_output(['git', 'show', f"{HELPER_COMMIT}:{provenance['sourcePrefix']}{name}"], cwd=ROOT)
        assert hashlib.sha256(original).hexdigest() == digest
        current = sha(HERE / name)
        if name not in ADAPTED:
            assert current == digest, f'Unexpected helper alteration: {name}'
        helper_identity[name] = {'sourceSha256': digest, 'currentSha256': current,
                                 'adaptation': ADAPTED.get(name, 'byte-identical')}
    for path in ([] if args.source_only else sorted(HERE.glob('*.mjs'))):
        result = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
        assert result.returncode == 0, result.stderr
    # Exact checker, browser helper, harness and UI source import graph. Dynamic
    # root-resolved helper imports in scenario are explicitly seeded here.
    queue = [HERE / 'scenario.mjs', ROOT / 'scripts/local-render/harness.mjs',
             ROOT / 'scripts/browser-game.mjs', ROOT / 'scripts/campaign-start-readiness.mjs',
             ROOT / 'scripts/local-render/checkpoint-observer.mjs',
             ROOT / 'scripts/local-render/vite.config.mjs', ROOT / 'app/page.tsx',
             ROOT / 'app/layout.tsx', ROOT / 'worker/index.ts']
    closure, bare = {}, set()
    while queue:
        path = queue.pop().resolve()
        assert path.is_relative_to(ROOT), str(path)
        label = str(path.relative_to(ROOT))
        if label in closure:
            continue
        assert path.is_file(), label
        data = source_bytes(path)
        closure[label] = hashlib.sha256(data).hexdigest()
        if path.suffix not in ('.ts', '.tsx', '.mjs', '.js'):
            continue
        code = data.decode()
        pairs = re.findall(r'\bfrom\s+[\'"]([^\'"]+)[\'"]|\bimport\s*\(\s*[\'"]([^\'"]+)[\'"]', code)
        refs = [first or second for first, second in pairs]
        refs += re.findall(r'\bimport\s+[\'"]([^\'"]+)[\'"]', code)
        for ref in refs:
            if ref.startswith('node:'):
                continue
            if ref.startswith(('/app/', '/scripts/')):
                dependency = ROOT / ref[1:]
            elif ref.startswith('.'):
                dependency = path.parent / ref
            else:
                assert re.fullmatch(r'(?:@[\w.-]+/)?[\w.-]+(?:/[\w./-]+)?', ref), f'Unexpected bare import: {label}: {ref}'
                bare.add(ref)
                continue
            if not dependency.is_file():
                choices = [Path(str(dependency) + ext) for ext in ('.ts', '.tsx', '.mjs', '.js', '.json')]
                choices += [dependency / ('index' + ext) for ext in ('.ts', '.tsx', '.mjs', '.js')]
                choices = [choice for choice in choices if choice.is_file()]
                assert len(choices) == 1, f'Unresolved or ambiguous source import: {label}: {ref}'
                dependency = choices[0]
            queue.append(dependency)
    for name in ('.openai/hosting.json', 'package.json', 'package-lock.json'):
        closure[name] = sha(ROOT / name)
    if args.source_only:
        print(json.dumps({'status': 'prepared-candidate-source-only', 'sourceHead': git('rev-parse', 'HEAD'),
                          'sourceStatus': git('status', '--short'), 'candidate': candidate,
                          'candidateApplicationMatchesWorktree': application_matches,
                          'sourceClosure': dict(sorted(closure.items())),
                          'sourceClosureApplicationOrigin': commit,
                          'checkerFiles': {p.name: sha(p) for p in sorted(HERE.iterdir()) if p.is_file()},
                          'helperCorrespondence': helper_identity, 'baselinePreserved': True,
                          'bareImports': sorted(bare), 'runtimeReady': False,
                          'nodeSyntax': 'not-run', 'nativeExecution': False, 'browserExecution': False,
                          'visualAcceptance': 'not-run', 'publication': 'local-unpushed-not-reset-durable'}, indent=2))
        return
    dependencies = args.dependency_root.resolve()
    assert dependencies.is_dir() and not args.dependency_root.is_symlink()
    stat = dependencies.stat()
    assert stat.st_ino == 1978923, 'Only the released sole dependency tree is admissible'
    assert sha(dependencies / '.package-lock.json') == INSTALLED_LOCK
    upload_runtime = json.loads((HERE / 'upload-runtime.json').read_text())
    for name, digest in upload_runtime.items():
        assert sha(dependencies / name) == digest, f'Unreviewed Three upload implementation: {name}'
    local = dependencies == ROOT / 'node_modules'
    if args.require_local_dependencies:
        assert local, 'Receipted dependency move must finish before runtime readiness'
    # Built-in resolution only; no third-party module is imported or executed.
    code = """import {createRequire} from 'node:module';import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const r=createRequire(resolve(process.argv[1],'../package.json'));
const parent=pathToFileURL(resolve(process.argv[1],'../package.json')).href;
console.log(JSON.stringify(Object.fromEntries([
 ...['@playwright/test','playwright-core','vite'].map(name=>[name,r.resolve(name)]),
 ...['vinext','@cloudflare/vite-plugin'].map(name=>[name,fileURLToPath(import.meta.resolve(name,parent))])])));"""
    resolved = json.loads(subprocess.check_output(['node', '--experimental-import-meta-resolve', '--input-type=module', '-e', code, str(dependencies)], cwd=ROOT, text=True))
    runtime_files = {str(Path(path).resolve()): sha(Path(path)) for path in resolved.values()}
    for relative in ('.package-lock.json', 'playwright-core/lib/coreBundle.js', 'vite/bin/vite.js',
                     'three/package.json', 'three/src/renderers/webgl/WebGLTextures.js',
                     'three/src/renderers/webgl/WebGLCapabilities.js', 'three/src/renderers/webgl/WebGLProperties.js'):
        path = dependencies / relative
        runtime_files[str(path.resolve())] = sha(path)
    output = ROOT / 'work/orchestration/firewarrior-firing-browser-candidate-01'
    command = ['timeout', '--signal=TERM', '--kill-after=5s', '330s', 'taskset', '-c', '0-3',
               'env', f'TMPDIR={output / "tmp"}', 'CLOUDFLARE_CF_FETCH_ENABLED=false',
               'WRANGLER_SEND_METRICS=false', 'node', 'scripts/local-render/harness.mjs',
               '--game-root', str(ROOT), '--browser', str(args.browser.resolve()), '--port', '4401',
               '--mission', '10', '--timeout', '300000', '--scenario', str(HERE / 'scenario.mjs'),
               '--output', str(output / 'run')]
    print(json.dumps({'status': 'prepared-source-preflight', 'sourceHead': git('rev-parse', 'HEAD'),
                      'sourceStatus': git('status', '--short'), 'applicationBase': BASE, 'candidate': candidate, 'baselinePreserved': True,
                      'publicTree': git('rev-parse', 'HEAD:public'), 'sourceClosure': dict(sorted(closure.items())),
                      'checkerFiles': {p.name: sha(p) for p in sorted(HERE.iterdir()) if p.is_file()},
                      'helperCorrespondence': helper_identity, 'bareImports': sorted(bare),
                      'dependencyRoot': str(dependencies), 'dependencyInode': stat.st_ino,
                      'dependencyDevice': stat.st_dev, 'dependenciesLocal': local,
                      'runtimeReady': local, 'dependencyFiles': runtime_files,
                      'browser': str(args.browser.resolve()), 'browserSha256': BROWSER_SHA,
                      'node': subprocess.check_output(['node', '--version'], text=True).strip(),
                      'proposedArgv': command, 'nativeExecution': False, 'browserExecution': False,
                      'visualAcceptance': 'not-run', 'publication': 'local-unpushed-not-reset-durable'}, indent=2))


if __name__ == '__main__':
    main()
