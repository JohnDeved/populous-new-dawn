// Portable appender/decoder contract. Only canonical identity expectations are
// supplied; source bank, palette and existing atlas are controlled local fixtures.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

test('nearby appender preserves all old pixels/metadata, is idempotent, and rejects unsafe inputs', () => {
  const result = spawnSync('python3', ['-B', '-c', String.raw`
import contextlib, hashlib, importlib.util, io, json, pathlib, struct, sys, tempfile
from PIL import Image
spec=importlib.util.spec_from_file_location('nearby_import',sys.argv[1])
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
sha=lambda data:hashlib.sha256(data).hexdigest()
with tempfile.TemporaryDirectory() as directory:
    root=pathlib.Path(directory)
    (root/'data').mkdir();(root/'app').mkdir();(root/'public/original').mkdir(parents=True)
    palette=bytes(value for i in range(256) for value in (i,255-i,i//2,0))
    bank=bytearray(b'PSFB'+struct.pack('<I',879)+bytes(879*8))
    for ident in range(879):
        struct.pack_into('<HHI',bank,8+ident*8,19,16,len(bank))
        for y in range(16):bank.extend(bytes([255,18])+bytes([(ident+y)%256])*18+bytes([0]))
    (root/'data/hfx0-0.dat').write_bytes(bank)
    (root/'data/pal0-c.dat').write_bytes(palette)
    module.hud.HASHES={'data/hfx0-0.dat':sha(bank),'data/pal0-c.dat':sha(palette)}
    frames=module.hud.original_frames(root,(875,876,877,878))
    meta={'executableSha256':module.EXE_SHA,'sha256':dict(module.hud.HASHES),'width':64,'height':20,
          'rects':{'875':{'x':0,'y':0,'w':19,'h':16},'old':{'x':40,'y':0,'w':2,'h':2}},
          'colors':['unchanged'],'unrelated':{'nested':[1,2,3]}}
    original=Image.new('RGBA',(64,20),(7,9,11,13));original.paste(frames['875'],(0,0))
    metadata=root/'app/original-hud.json';image=root/'public/original/hud.png'
    metadata.write_text(json.dumps(meta));original.save(image)
    def snapshot():return (metadata.read_bytes(),image.read_bytes())
    def rejected(message,check=False):
        before=snapshot()
        try:module.prepare(root,root,check)
        except ValueError as error:assert message in str(error),str(error)
        else:raise AssertionError('invalid append accepted: '+message)
        assert snapshot()==before,'failure wrote an output'
    rejected('not installed',True)
    before=snapshot()
    sys.argv=[sys.argv[1],str(root),'--project-root',str(root)]
    with contextlib.redirect_stdout(io.StringIO()) as output:module.main()
    receipt=json.loads(output.getvalue())
    assert receipt['appended']==[876,877,878]
    assert receipt['oldPixelsSha256']==receipt['preservedOldPixelsSha256']==sha(original.tobytes())
    assert receipt['oldRectanglesPreserved']==2 and receipt['priorMetadataPreserved']
    installed=json.loads(metadata.read_text())
    restored=json.loads(metadata.read_text())
    for ident in (876,877,878):del restored['rects'][str(ident)]
    restored['height']=meta['height'];assert restored==meta
    with Image.open(image) as after:
        assert after.crop((0,0,64,20)).tobytes()==original.tobytes()
        module.hud.validate_installed(installed,after,frames,(875,876,877,878))
    saved=snapshot()
    for check in (False,True):
        result,outputs=module.prepare(root,root,check)
        assert result['changed'] is False and outputs is None
        assert snapshot()==saved
    partial=json.loads(metadata.read_text());del partial['rects']['877']
    metadata.write_text(json.dumps(partial));rejected('Partial nearby append')
    metadata.write_bytes(saved[0])
    for ident in ('875','877'):
        with Image.open(io.BytesIO(saved[1])) as opened:bad=opened.convert('RGBA')
        r=installed['rects'][ident];bad.putpixel((r['x']+2,r['y']+2),(1,2,3,4));bad.save(image)
        rejected('Existing original sprite differs')
        image.write_bytes(saved[1])
    bad=json.loads(saved[0]);bad['executableSha256']='wrong';metadata.write_text(json.dumps(bad))
    rejected('executable identity');metadata.write_bytes(saved[0])
    (root/'data/pal0-c.dat').write_bytes(bytes(1024));rejected('Canonical input SHA mismatch')
    (root/'data/pal0-c.dat').write_bytes(palette)
    assert sorted(p.name for p in (root/'app').iterdir())==['original-hud.json']
    assert sorted(p.name for p in (root/'public/original').iterdir())==['hud.png']
print('PASS portable nearby append preservation, idempotence, check-only and rejection contracts')
`, fileURLToPath(new URL('../scripts/import-follower-nearby.py', import.meta.url))], { encoding: 'utf8', timeout: 30000 })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /PASS portable nearby append/)
})
