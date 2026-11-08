#!/usr/bin/env python3
"""Share selected, pinned native research data. Never executes original code."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess

DESTINATION = Path('work/native-inputs/game')


def git(checkout, *args):
    return subprocess.check_output(['git', '-C', str(checkout), *args])


def relative_file(value):
    path = PurePosixPath(value)
    if (not value or str(path) != value or path.is_absolute()
            or '..' in path.parts or not re.fullmatch(r'[A-Za-z0-9_./-]+', value)):
        raise ValueError(f'Unsafe input path: {value!r}')
    return path


def physical(path, *, missing=False):
    """Reject symlinks at every component, including the declared root."""
    if '..' in path.parts:
        raise ValueError(f'Parent traversal is not permitted: {path}')
    path = path.absolute()
    for part in [*reversed(path.parents), path]:
        try:
            mode = part.lstat().st_mode
        except FileNotFoundError:
            if missing:
                continue
            raise
        if stat.S_ISLNK(mode):
            raise ValueError(f'Symlink in physical path: {part}')
        if part != path and not stat.S_ISDIR(mode):
            raise ValueError(f'Non-directory ancestor: {part}')
    return path


def pinned_inputs(checkout, revision):
    if not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise ValueError('An exact 40-character commit SHA is required')
    if git(checkout, 'rev-parse', 'HEAD').decode().strip() != revision:
        raise ValueError('Checkout HEAD does not match the supplied revision')
    pins, documents = {}, {}

    def read(name):
        raw = git(checkout, 'show', f'{revision}:{name}')
        documents[name] = {
            'sha256': hashlib.sha256(raw).hexdigest(),
            'gitBlob': git(checkout, 'rev-parse', f'{revision}:{name}').decode().strip(),
        }
        return json.loads(raw)

    def add(name, digest, document):
        relative_file(name)
        if not isinstance(digest, str) or not re.fullmatch(r'[0-9a-f]{64}', digest):
            raise ValueError(f'Invalid pinned hash: {name}')
        if name in pins and pins[name]['sha256'] != digest:
            raise ValueError(f'Conflicting provenance: {name}')
        entry = pins.setdefault(name, {'sha256': digest, 'provenance': []})
        if document not in entry['provenance']:
            entry['provenance'].append(document)

    document = 'decomp/tools.json'
    add('d3dpoptb.exe', read(document)['executableSha256'], document)
    document = 'public/original/provenance.json'
    original = read(document)
    for mapping in [original['sha256'], original['stoneHeads']['sha256']]:
        for name, digest in mapping.items():
            add(name, digest, document)
    document = 'scripts/authored-environment-inputs.json'
    authored = read(document)
    for name, entry in authored['inputHashes'].items():
        add(name, entry['sha256'], document)
    provenance = read('decomp/research/original-startup-movies/provenance.json')
    if authored['archiveSha256'] != provenance['archive']['sha256']:
        raise ValueError('Conflicting archive provenance')
    return pins, documents, provenance


def inspect_source(source, names, pins):
    files = {}
    for name in names:
        path = physical(source / name)
        if not stat.S_ISREG(path.lstat().st_mode):
            raise ValueError(f'Input is not a regular file: {path}')
        # Stream data rather than retaining game/archive contents in memory.
        with path.open('rb') as stream:
            digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        if digest != pins[name]['sha256']:
            raise ValueError(f'Input bytes differ from pinned hash: {name}')
        files[name] = {**pins[name], 'bytes': path.stat().st_size}
    return files


def inspect_destination(target, source, names, *, require_all):
    physical(target, missing=not require_all)
    if target.exists() and not target.is_dir():
        raise ValueError(f'Destination is not a physical directory: {target}')
    directories = {'.'}
    for name in names:
        directories.update(str(p) for p in PurePosixPath(name).parents)
    if target.exists():
        for root, dirs, files in os.walk(target, followlinks=False):
            for leaf in dirs + files:
                path = Path(root) / leaf
                name = path.relative_to(target).as_posix()
                mode = path.lstat().st_mode
                if name in directories:
                    if not stat.S_ISDIR(mode):
                        raise ValueError(f'Destination directory replaced: {name}')
                elif name in names:
                    if not stat.S_ISLNK(mode) or os.readlink(path) != str(source / name):
                        raise ValueError(f'Wrong existing input target: {name}')
                else:
                    raise ValueError(f'Unexpected destination entry: {name}')
    if require_all:
        for name in names:
            link = target / name
            if not link.is_symlink() or os.readlink(link) != str(source / name):
                raise ValueError(f'Missing or wrong input target: {name}')


def share(action, checkout, source, revision, names):
    checkout, source = physical(Path(checkout)), physical(Path(source))
    if not checkout.is_dir() or not source.is_dir():
        raise ValueError('Checkout and source must be physical directories')
    if Path(git(checkout, 'rev-parse', '--show-toplevel').decode().strip()) != checkout:
        raise ValueError('Checkout must be the Git worktree root')
    target = checkout / DESTINATION
    if source.is_relative_to(target) or target.is_relative_to(source):
        raise ValueError('Source and destination may not overlap')
    if not names or len(names) != len(set(names)):
        raise ValueError('Select at least one unique input file')
    names = sorted(str(relative_file(name)) for name in names)
    pins, documents, provenance = pinned_inputs(checkout, revision)
    for name in names:
        if name not in pins:
            raise ValueError(f'No reviewed input pin: {name}')
    inspect_destination(target, source, names, require_all=action == 'verify')
    if git(checkout, 'ls-files', '-z', '--', 'work/native-inputs'):
        raise ValueError('Destination contains tracked paths')
    for name in names:
        ignored = subprocess.run(['git', '-C', str(checkout), 'check-ignore',
                                  '--no-index', '-q', '--', str(DESTINATION / name)])
        if ignored.returncode != 0:
            raise ValueError(f'Destination is not ignored: {name}')
    before = inspect_source(source, names, pins)
    if action == 'prepare':
        for name in names:
            link = target / name
            physical(link.parent, missing=True)
            link.parent.mkdir(parents=True, exist_ok=True)
            if not link.is_symlink():
                # No replacement or deletion: a racing/existing path fails closed.
                link.symlink_to(source / name)
    inspect_destination(target, source, names, require_all=True)
    if inspect_source(source, names, pins) != before:
        raise ValueError('Source changed during verification')
    return {'status': 'passed', 'action': action, 'revision': revision,
            'source': str(source), 'destination': str(target), 'files': before,
            'provenanceDocuments': documents,
            'helperSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'archive': provenance['archive'],
            'installer': provenance['installer'], 'originalPayloadExecuted': False,
            'copiedInputBytes': 0, 'sharedInputBytes': sum(f['bytes'] for f in before.values()),
            'scope': 'Selected research data only, not a complete installation or probe result'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'verify'])
    parser.add_argument('--checkout', required=True, type=Path)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--revision', required=True)
    parser.add_argument('--file', required=True, action='append', dest='files')
    args = parser.parse_args()
    try:
        result = share(args.action, args.checkout, args.source, args.revision, args.files)
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'Native input sharing refused: {error}\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
