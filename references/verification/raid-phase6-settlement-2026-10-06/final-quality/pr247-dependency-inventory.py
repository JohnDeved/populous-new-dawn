import hashlib
import json
import os
from pathlib import Path
import sys

# Exact algorithm used in PR247 dependency-transfer-01; read-only metadata inventory.
def inventory(path):
    rows = []
    for base, dirs, files in os.walk(path, followlinks=False):
        for name in sorted(dirs + files):
            p = Path(base) / name
            s = p.lstat()
            rows.append([str(p.relative_to(path)), s.st_dev, s.st_ino, s.st_mode,
                         s.st_size, s.st_mtime_ns, os.readlink(p) if p.is_symlink() else None])
    rows.sort()
    return {'entries': len(rows), 'sha256': hashlib.sha256(
        json.dumps(rows, separators=(',', ':')).encode()).hexdigest()}

if __name__ == '__main__':
    print(json.dumps(inventory(Path(sys.argv[1]))))
