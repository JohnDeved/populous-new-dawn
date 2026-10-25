"""Verify imported task frame/root/sprite pixels against executed native draw geometry.
Usage: python scripts/check-native-follower-task-art.py EXE
The accepted raster probe supplies coordinate/format/bank/raster leaves. This is
logical-coordinate draw-request equivalence, not a running original-game screenshot.
"""
import json
import runpy
import subprocess
import sys
import tempfile
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='follower-task-art-') as output:
    sys.argv = [str(root / 'scripts/capture-native-followers-panel.py'), sys.argv[1], output]
    n = runpy.run_path(sys.argv[0])
    # Functions from run_path retain their own global namespace.
    g = n['call'].__globals__
    call, write, cpu = [n[k] for k in ['call','write','cpu']]
    g['draws'] = []; g['text_draws'] = []; g['fills'] = []
    call(0x4a1720, 0x5cd178)
    actual = n['raster'](100,277,(0,204))
    assert actual.tobytes() == Image.open(root/'public/original/follower-task-panel.png').convert('RGBA').tobytes()
    for held, name in [(0,'normal'),(1,'pressed')]:
        b = n['button']; cpu.mem_write(b,bytes(128))
        write(b+8,'I',1); write(b+0x10,'I',1); write(b+0x18,'I',held)
        write(b+0x37,'ii',0,0);write(b+0x47,'ii',15,34)
        g['draws'] = []; g['text_draws'] = []; g['fills'] = []
        call(0x4a0e70,b)
        g['draws'] = g['draws'][:9]
        assert n['raster'](15,34).tobytes() == Image.open(root/f'public/original/follower-task-{name}.png').convert('RGBA').tobytes()
    # All36 task/transport descriptors now share the maintained number helper. Compare font identity,
    # glyph indices and absolute logical placement to the maintained number helper.
    descriptors = json.loads((root/'decomp/research/follower-task-panel/native-panel-contract.json').read_text())['descriptors']
    glyph_cases = [dict(nearby='nearby' in c['name'],counts=c['formatted'],descriptors=descriptors,
                        expected=c['text'])
                   for c in n['all_draws']]
    # Adjacent two/three-digit font boundary, including Total in nearby mode.
    for nearby in (False,True):
        for total in (False,True):
            for count in (0,99,100):
                cpu.mem_write(0x89d1c8,bytes(4*0xc65));cpu.mem_write(n['button'],bytes(128))
                write(0x89c6f0,'B',0);write(0x89d1c8+0x93d,'I',128 if nearby else 0)
                write((0x89dcd9 if nearby else 0x89dc6d)+(2*6+2)*2,'h',count)
                b=n['button'];write(b+8,'I',1);write(b+0x10,'I',1)
                write(b+0x37,'ii',0,0);write(b+0x47,'ii',15,34)
                write(b+0x4f,'I',641 if total else 0);write(b+99,'I',1 if total else 11)
                g['draws']=[];g['text_draws']=[];g['fills']=[];g['formatted']=[]
                call(0x4a0200 if total else 0x4a0e70,b)
                expected=list(g['text_draws'])
                assert not count or all(glyph[0]==(6 if count>=100 else 4)+int(nearby) for glyph in expected)
                glyph_cases.append(dict(nearby=nearby,counts=[count],root=0,
                    descriptors=[dict(rectangle=[0,0,15,34])],expected=expected))
    # Vehicle Total and class cells use the same two/three-digit fonts, including nearby.
    for nearby in (False,True):
        for kind in (1,3):
            for model in (0,2):
                for count in (0,99,100):
                    cpu.mem_write(0x89d1c8,bytes(4*0xc65));cpu.mem_write(n['button'],bytes(128))
                    write(0x89c6f0,'B',0);write(0x89d1c8+0x93d,'I',128 if nearby else 0)
                    base=(0x89ddb1 if nearby else 0x89dd9f) if kind==1 else (0x89ddd5 if nearby else 0x89ddc3)
                    write(base+model*2,'h',count)
                    b=n['button'];write(b+8,'I',1);write(b+0x10,'I',1)
                    write(b+0x37,'ii',0,0);write(b+0x47,'ii',15,34);write(b+99,'I',model+(8 if kind==3 else 0))
                    g['draws']=[];g['text_draws']=[];g['fills']=[];g['formatted']=[]
                    call(0x4a1580,b)
                    expected=list(g['text_draws'])
                    assert not count or all(glyph[0]==(6 if count>=100 else 4)+int(nearby) for glyph in expected)
                    glyph_cases.append(dict(nearby=nearby,counts=[count],root=0,
                        descriptors=[dict(rectangle=[0,0,15,34])],expected=expected))
    script = r"""import {followerNumber} from './app/hud-population.ts';
import hud from './app/original-hud.json' with {type:'json'};
let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>c.descriptors.flatMap((d,i)=>{
 const label=followerNumber(c.counts[i],false,c.nearby);let x=d.rectangle[0]+label.x;
 return label.ids.map(id=>{const [,font,index]=id.match(/^f00t(\d+)-(\d+)$/);const out=[Number(font),Number(index),x,(c.root??204)+d.rectangle[1]+24];x+=hud.rects[id].w;return out});
}))));"""
    result = subprocess.run(['node','--input-type=module','-e',script],cwd=root,input=json.dumps(glyph_cases),text=True,capture_output=True)
    assert result.returncode == 0, result.stderr
    for case, actual in zip(glyph_cases,json.loads(result.stdout),strict=True):
        assert actual == case['expected'], case
    meta = json.loads((root/'app/original-follower-tasks.json').read_text())
    atlas = Image.open(root/'public/original/follower-tasks.png').convert('RGBA')
    for icon in n['artifacts']:
        r = meta['rects'][str(icon['id'])]
        w,h,data = n['art'][icon['id']]
        assert atlas.crop((r['x'],r['y'],r['x']+w,r['y']+h)).tobytes() == bytes(data)
print('PASS: imported root, normal/pressed34px frames and18 exact original sprites plus144 task/transport number layouts and36 zero/99/100 font-boundary cases match native logical draw requests')
