"""One separately authorized immutable dependency copy; never move the old loan."""
from pathlib import Path
import datetime, gzip, hashlib, json, os, shutil, stat, subprocess, sys, time

PACKET = Path(__file__).with_name('copy-plan.json')
def sha(path):
    with Path(path).open('rb') as stream: return hashlib.file_digest(stream, 'sha256').hexdigest()
canonical = lambda value: hashlib.sha256((json.dumps(value, sort_keys=True) + '\n').encode()).hexdigest()
assert len(sys.argv) == 2 and sys.argv[1] == sha(PACKET), 'Exact reviewed copy-plan hash required'
plan = json.loads(PACKET.read_text())
assert sha(__file__) == plan['sourceCopyFileSha256']
assert {p: sha(p) for p in plan['toolsSha256']} == plan['toolsSha256']
started = time.monotonic()
deadline = started + plan['copySeconds']
source = Path(plan['dependencySource']); target = Path(plan['targetRoot']); destination = target / 'node_modules'
excluded = plan['excludedPaths']
skip = lambda p: any(p == x or p.startswith(x + '/') for x in excluded)
def bound():
    if time.monotonic() >= deadline: raise TimeoutError('Immutable copy deadline exceeded')
def inventory(directory):
    rows = {}
    for parent, dirs, files in os.walk(directory, followlinks=False):
        dirs[:] = [name for name in dirs if not skip(str((Path(parent) / name).relative_to(directory)))]
        for name in dirs + files:
            bound(); path = Path(parent) / name; key = str(path.relative_to(directory))
            if skip(key): continue
            info = path.lstat()
            if stat.S_ISLNK(info.st_mode): rows[key] = {'link': os.readlink(path), 'mode': info.st_mode}
            elif stat.S_ISREG(info.st_mode): rows[key] = {'sha256': sha(path), 'size': info.st_size, 'mode': info.st_mode}
            elif not stat.S_ISDIR(info.st_mode): raise RuntimeError('Unexpected dependency object')
    return rows

def git(*args): return subprocess.check_output(['/usr/bin/git', '-C', str(target), *args], text=True, timeout=5).strip()
def app_source():
    return {'head': git('rev-parse', 'HEAD'), 'status': git('status', '--porcelain'),
            'files': {p: sha(target / p) for p in plan['applicationSha256']}}
assert sorted(os.sched_getaffinity(0)) == plan['cpu']
assert source.is_dir() and not source.is_symlink() and [source.stat().st_dev, source.stat().st_ino] == plan['quarantinedIdentity']
assert not destination.exists() and not destination.is_symlink()
assert sha(plan['retainedInventory']) == plan['retainedInventorySha256']
retained = json.loads(gzip.decompress(Path(plan['retainedInventory']).read_bytes()))
expected = {p: row for p, row in retained.items() if not skip(p)}
assert canonical(expected) == plan['selectedInventorySha256']
for p, row in expected.items():
    assert not Path(p).is_absolute() and '..' not in Path(p).parts
    if 'link' in row:
        assert not Path(row['link']).is_absolute() and not os.path.normpath(str(Path(p).parent / row['link'])).startswith('../')
output = target / plan['receiptOutput']; assert not output.parent.exists()
output.parent.mkdir(parents=True, exist_ok=False)
receipt = {'status': 'running', 'startedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'planSha256': sha(PACKET), 'pid': os.getpid(), 'pidNamespace': os.readlink('/proc/self/ns/pid'),
           'networkNamespace': os.readlink('/proc/self/ns/net'), 'bootId': Path('/proc/sys/kernel/random/boot_id').read_text().strip(),
           'deadlineMonotonic': deadline, 'oldLoanMoved': False, 'retry': False}
def save(): output.write_text(json.dumps(receipt, indent=2) + '\n')
save()
try:
    receipt['applicationBefore'] = app_source()
    assert receipt['applicationBefore'] == {'head': plan['sourceHead'], 'status': '', 'files': plan['applicationSha256']}
    before = inventory(source); assert before == expected
    receipt['dependencySourceBeforeSha256'] = canonical(before); save()
    destination.mkdir()
    for name, row in sorted(expected.items()):
        bound(); src = source / name; dst = destination / name; dst.parent.mkdir(parents=True, exist_ok=True)
        assert src.lstat().st_mode == row['mode']
        if 'link' in row:
            assert os.readlink(src) == row['link']; os.symlink(row['link'], dst)
        else:
            fd = os.open(src, os.O_RDONLY | os.O_NOFOLLOW)
            with os.fdopen(fd, 'rb') as incoming, dst.open('xb') as outgoing:
                assert stat.S_ISREG(os.fstat(incoming.fileno()).st_mode)
                while block := incoming.read(1048576): bound(); outgoing.write(block)
            dst.chmod(stat.S_IMODE(row['mode']))
    copied = inventory(destination); after = inventory(source)
    assert copied == expected and after == expected
    assert all(not (destination / p).exists() and not (destination / p).is_symlink() for p in excluded)
    receipt['dependencyCopySha256'] = canonical(copied); receipt['dependencySourceAfterSha256'] = canonical(after)
    receipt['applicationAfter'] = app_source(); assert receipt['applicationAfter'] == receipt['applicationBefore']
    receipt['quarantinedIdentityAfter'] = [source.stat().st_dev, source.stat().st_ino]
    assert receipt['quarantinedIdentityAfter'] == plan['quarantinedIdentity']
    receipt['copyIdentity'] = [destination.stat().st_dev, destination.stat().st_ino]
    assert receipt['copyIdentity'] != plan['quarantinedIdentity']
    receipt['packetUnchanged'] = sha(PACKET) == receipt['planSha256']; assert receipt['packetUnchanged']
    receipt['toolsAfter'] = {p: sha(p) for p in plan['toolsSha256']}
    assert receipt['toolsAfter'] == plan['toolsSha256']
    assert sha(__file__) == plan['sourceCopyFileSha256']
    receipt['status'] = 'passed'
except BaseException as error:
    receipt['status'] = 'failed'; receipt['failure'] = repr(error)
finally:
    receipt['finishedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat(); save()
print(json.dumps({k: receipt.get(k) for k in ('status', 'copyIdentity', 'oldLoanMoved', 'failure')}))
sys.exit(0 if receipt['status'] == 'passed' else 1)
