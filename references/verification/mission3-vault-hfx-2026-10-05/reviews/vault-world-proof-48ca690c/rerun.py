import hashlib
import json
import runpy
import sys
from pathlib import Path

root = Path.cwd()
out = root / 'work/reviews/vault-world-proof-48ca690c'
probe = root / 'scripts/probe-native-vault-knowledge.py'
assert hashlib.sha256(probe.read_bytes()).hexdigest() == '48ca690c78230073b0f1a69ee203d252ed768bb2efcc11ba44ff434b067b530d'
sys.path.insert(0, str(root / 'scripts'))
sys.argv = [str(probe), str(root.parent / 'prerequisites/game/d3dpoptb.exe'), '--output', str(out / 'native')]
g = runpy.run_path(str(probe), run_name='__main__')
previous = json.loads((root / 'work/orchestration/vault-hfx/native-attempt-1/probe-result.json').read_text())
current = json.loads((out / 'native/probe-result.json').read_text())
for value in (previous, current):
    value.pop('seconds')
assert previous == current, 'Independent replay differs semantically from supplied result'
cpu, read, write, call = [g[n] for n in ('cpu', 'read', 'write', 'call')]
marker, glow, gift = [g[n] for n in ('marker', 'marker_glow', 'gift')]
assert (read(marker + 0x3a, 'B'), read(glow + 0x3a, 'B'), read(glow + 0x3b, 'B')) == (0, 43, 1)
assert read(gift + 0x35, 'H') & 16, 'Gift must be hidden at end of replay'
assert read(gift + 0x78, 'H') == 0
gift_glow_id = current['giftAfterCompletion']['glow']
gift_glow = read(0x890390 + gift_glow_id * 4)
assert read(gift_glow + 0x2a, 'B') == 0, 'Gift-owned glow must retire'
assert [(r['queue']['renderType'], r['queue']['queueFlags'], r['queue']['argb']) for r in current['worldResourceReads']] == [(17, 0, '0xffffffff'), (18, 2, '0xfff7ebc9')]
assert current['payoutVisits'][-2:] == [[81, 1, 0, False], [82, 0, 32, True]]
# The fixtures deliberately leave global-list bookkeeping intercepted. This is
# a supplied nonzero cursor test on the original scheduler, not a lifetime test.
write(glow + 0x37, 'H', 20)
write(0x89c661, 'I', 2)
call(0x4ee770)
assert read(glow + 0x37, 'H') == 20
write(0x89c661, 'I', 0)
call(0x4ee770)
assert read(glow + 0x37, 'H') == 24
# Execute the unmodified selector with a nonzero cursor and deliberately varied
# morph byte. Neither selector nor draw43 animation consumes that morph byte.
selected = []
for morph in (0, 1, 7):
    write(glow + 0x3b, 'B', morph)
    write(g['stack'] + 0x20, 'I', glow)
    cpu.reg_write(g['UC_X86_REG_ESP'], g['stack'])
    cpu.reg_write(g['UC_X86_REG_EAX'], 1)
    cpu.reg_write(g['UC_X86_REG_EBP'], 0x5a6af8 + 43 * 11)
    cpu.emu_start(0x4689a4, 0x468a09, timeout=100000, count=100)
    assert cpu.reg_read(g['UC_X86_REG_EIP']) == 0x468a09
    selected.append((cpu.reg_read(g['UC_X86_REG_EDX']) - g['entries']) // 8)
    g['guard']()
assert selected == [1423, 1423, 1423]
summary = {'status': 'passed', 'unchangedResultMatch': True, 'guardedRegions': len(g['guarded']), 'giftHidden': True, 'giftGlowRetired': gift_glow_id, 'nonzeroPauseCursor': [20, 20, 24], 'morphVariations': [0, 1, 7], 'selectedHfxAtCursor24': selected, 'descriptor0': list(cpu.mem_read(0x5a6af8, 11)), 'descriptor43': list(cpu.mem_read(0x5a6af8 + 43 * 11, 11)), 'python': sys.version}
(out / 'independent-rerun.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary))
