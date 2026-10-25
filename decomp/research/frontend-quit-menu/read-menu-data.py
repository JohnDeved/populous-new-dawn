#!/usr/bin/env python3
"""Read exact menu data from a SHA-locked original PE. Never execute original code.
Usage: python3 read-menu-data.py --repo REPO --game GAME_ROOT --output NEW_FILE
"""
import argparse, hashlib, importlib.util, json, struct
from pathlib import Path
p = argparse.ArgumentParser()
p.add_argument('--repo', required=True, type=Path)
p.add_argument('--game', required=True, type=Path)
p.add_argument('--output', required=True, type=Path)
a = p.parse_args()
spec = importlib.util.spec_from_file_location('reader', a.repo / 'scripts/check-static-mission18-sky.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
exe = a.game / 'D3DPopTB.exe'
pe = m.PE32(exe)  # Enforces original SHA-256 before reading descriptors.
lang_bytes = (a.game / 'language/lang00.dat').read_bytes()
assert hashlib.sha256(lang_bytes).hexdigest() == 'e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d'
lang = lang_bytes.decode('utf-16le').split('\0')
result = {'exe': str(exe), 'exeSha256': m.sha256(pe.data), 'langSha256': m.sha256(lang_bytes), 'method': 'read-only PE data; no original execution/emulation', 'menus': {}}
for n in [0, 1, 2, 17, 18, 19]:
    address = 0x5d9c98 + n * 32
    raw = struct.unpack('<8I', pe.read(address, 32))
    item_list = raw[2]
    entries = []
    for i in range(100):
        kind, desc = struct.unpack('<2I', pe.read(item_list + i * 8, 8))
        if kind == 0x80000000:
            break
        words = struct.unpack('<16I', pe.read(desc, 64))
        row = {'type': kind, 'descriptor': f'{desc:08x}', 'u32': [f'{v:08x}' for v in words]}
        if kind in [4, 5, 8, 10, 11]:
            row.update(labelId=words[9], label=lang[words[9]], action=f'{words[10]:08x}')
        elif kind == 2:
            row.update(labelId=words[7], label=lang[words[7]])
        entries.append(row)
    else:
        raise ValueError('Unterminated menu list')
    result['menus'][n] = {'address': f'{address:08x}', 'record': [f'{v:08x}' for v in raw], 'list': f'{item_list:08x}', 'entries': entries, 'sentinel': f'{item_list + i * 8:08x}'}
menu = result['menus'][1]
assert menu['list'] == '005d9ae0' and menu['sentinel'] == '005d9b00'
assert [(x['type'], x['descriptor'], x['labelId'], x['label']) for x in menu['entries']] == [(2,'005d7648',1212,'Quit?'),(5,'005d81c4',235,'Yes'),(4,'005d7c18',236,'No'),(5,'005d7d78',328,'Back')]
assert [x.get('action') for x in menu['entries']] == [None, '004c3610', '00000000', '004c3970']
assert menu['record'][3] == '004c3800'
assert [pe.u32(0x45a4cc + (t-1)*4) for t in [2,4,5]] == [0x45a4b2]*3
assert [pe.u32(0x45d6c4 + (t-2)*4) for t in [2,4,5]] == [0x45b741,0x45b9bb,0x45b9bb]
with a.output.open('x') as f:
    json.dump(result, f, indent=2)
    f.write('\n')
print('PASS: hash-locked original menu1 labels, actions, record, initializer and renderer dispatch; no original execution.')
