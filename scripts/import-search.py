"""Import the original indexed search ring table.
Usage: python scripts/import-search.py /path/to/data/mwsearch.dat
"""
import hashlib,json,struct,sys
from pathlib import Path
data=Path(sys.argv[1]).read_bytes();sha=hashlib.sha256(data).hexdigest()
assert len(data)==8320 and sha=='0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0','Unverified search table'
rings=list(struct.iter_unpack('<hh',data[:128]));points=list(struct.unpack('<8192b',data[128:]))
assert all(offset>=0 and count>0 and offset+count*2<=len(points) for offset,count in rings)
output=Path(__file__).resolve().parents[1]/'app/original-search.json'
output.write_text(json.dumps(dict(sha256=sha,rings=rings,points=points),separators=(',',':'))+'\n')
print(f'Imported {len(rings)} rings from {sha}')
