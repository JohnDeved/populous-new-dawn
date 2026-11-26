"""Account for regular-file allocation in two isolated pnpm consumers and a store."""
import argparse
import json
import os
from pathlib import Path
import stat


def snapshot(root, device):
    files = {}
    paths = symlinks = 0
    pending = [root]
    while pending:
        with os.scandir(pending.pop()) as dirents:
            for entry in dirents:
                info = entry.stat(follow_symlinks=False)
                if stat.S_ISLNK(info.st_mode):
                    symlinks += 1
                    continue
                if info.st_dev != device:
                    raise ValueError(f"nested mount across devices: {entry.path}")
                if stat.S_ISDIR(info.st_mode):
                    pending.append(entry.path)
                    continue
                if not stat.S_ISREG(info.st_mode):
                    raise ValueError(f"unexpected non-regular file: {entry.path}")
                paths += 1
                key = (info.st_dev, info.st_ino)
                pair = (info.st_size, info.st_blocks * 512)
                if files.setdefault(key, pair) != pair:
                    raise ValueError(f"file changed while measuring: {entry.path}")
    return files, paths, symlinks


def measure(store, a, b, require_shared=True):
    roots = {}
    for key, raw in {"store": store, "consumerA": a, "consumerB": b}.items():
        path = Path(os.path.abspath(raw))
        if path != path.resolve(strict=True) or not path.is_dir():
            raise ValueError(f"{key} is not a real isolated directory")
        if any(path.is_relative_to(p) or p.is_relative_to(path) for p in roots.values()):
            raise ValueError(f"{key} overlaps another input root")
        roots[key] = path
    devices = {p.stat().st_dev for p in roots.values()}
    if len(devices) != 1:
        raise ValueError("all inputs must be on one filesystem")
    device, = devices
    rows = {name: snapshot(path, device) for name, path in roots.items()}
    if any(not row[0] for row in rows.values()):
        raise ValueError("every input must have regular files")
    combined = {}
    logical = {}
    for name, (files, paths, symlinks) in rows.items():
        for key, pair in files.items():
            if combined.setdefault(key, pair) != pair:
                raise ValueError("file changed between scans; stop both consumers first")
        logical[name] = {
            "regularFilePaths": paths, "skippedSymlinks": symlinks,
            "uniqueInodes": len(files),
            "uniqueAllocatedBytes": sum(v[1] for v in files.values()),
        }
    common = set.intersection(*(set(row[0]) for row in rows.values()))
    common_size = sum(combined[k][1] for k in common)
    if require_shared and not common_size:
        raise ValueError("no allocated regular file hardlinked across store and both consumers")
    total = sum(v[1] for v in combined.values())
    return {
        "scope": "regular files only; excludes directory and symlink allocation, network package caches and RAM",
        "device": device, "scopes": logical,
        "sharedAcrossStoreAndBothConsumers": {"inodes": len(common), "allocatedBytes": common_size},
        "observedUniqueRegularFileAllocationBytes": total,
        "crossScopeDoubleCountingRemovedBytes": sum(x["uniqueAllocatedBytes"] for x in logical.values()) - total,
    }


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("store")
    cli.add_argument("consumer_a", help="first actual isolated node_modules directory")
    cli.add_argument("consumer_b", help="second actual isolated node_modules directory")
    cli.add_argument("--control", action="store_true", help="allow no shared file for a negative control")
    args = cli.parse_args()
    print(json.dumps(measure(args.store, args.consumer_a, args.consumer_b, not args.control), indent=2))
