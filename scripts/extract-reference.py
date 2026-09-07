"""Extract selected game files without running the installer.
Usage: python scripts/extract-reference.py SETUP.zip OUTPUT 'objects/*0-2.*'
Install optional decomp/extraction-requirements.txt first. Paths are relative to {app}.
"""
import argparse
import fnmatch
import hashlib
from pathlib import Path, PurePosixPath
import zipfile
from refinery.lib.inno.archive import InnoArchive

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('installer', type=Path)
p.add_argument('output', type=Path)
p.add_argument('patterns', nargs='+')
args = p.parse_args()
if zipfile.is_zipfile(args.installer):
    with zipfile.ZipFile(args.installer) as z:
        names = [n for n in z.namelist() if PurePosixPath(n).name.lower() == 'setup_populous_the_beginning.exe']
        if len(names) != 1: raise ValueError('Expected exactly one Populous Inno installer')
        data = z.read(names[0])
else:
    data = args.installer.read_bytes()
archive = InnoArchive(bytearray(data))
selected = {}
for entry in archive.files:
    if not entry.path.startswith('data/{app}/'): continue
    name = entry.path[len('data/{app}/'):].lower()
    if not any(fnmatch.fnmatchcase(name, pattern.lower()) for pattern in args.patterns): continue
    path = PurePosixPath(name)
    if path.is_absolute() or '..' in path.parts or '\\' in name: raise ValueError(f'Unsafe path: {name}')
    if name in selected: raise ValueError(f'Ambiguous installer destination: {name}')
    selected[name] = entry
for pattern in args.patterns:
    if not any(fnmatch.fnmatchcase(n, pattern.lower()) for n in selected): raise ValueError(f'No files match {pattern}')
for name, entry in selected.items():
    target = args.output / name
    if not target.resolve().is_relative_to(args.output.resolve()): raise ValueError(f'Output escapes destination: {name}')
    content = archive.read_file_and_check(entry)
    if target.exists() and target.read_bytes() != content: raise ValueError(f'Different file already exists: {target}')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(content)
    print(name, len(content), hashlib.sha256(content).hexdigest(), flush=True)
