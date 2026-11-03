"""Extract only eight proven native normal building icons into a separate atlas.
Source-only candidate. Usage: python -I -S -B extract-building-icons.py GAME DECODER EMPTY_OUTPUT
Never repacks shared HUD atlas or overwrites existing outputs.
"""
import hashlib
import importlib.util
import json
import os
import stat
from pathlib import Path
import sys

EXPECTED = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'data/hfx0-0.dat': '681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf',
    'data/pal0-c.dat': '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53',
}
DECODER_SHA = 'bdad3fc18e32ef02ad8ba1c8edba6b2cb6f0a458b2160d1477bf32ead4954867'
ICONS = [('hut',1028),('tower',1029),('camp',1030),('temple',1032),
         ('spyHut',1033),('firewarriorHut',1031),('boatHouse',1034),('balloonHut',1035)]
DIMENSIONS = {1028:(36,43),1029:(35,43),1030:(38,47),1031:(38,43),
              1032:(38,44),1033:(38,47),1034:(35,43),1035:(35,43)}
SIZES = {'d3dpoptb.exe':2275840, 'data/hfx0-0.dat':1094550, 'data/pal0-c.dat':1024}

def checked_read(path, size, digest):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NOATIME)
    try:
        before = os.fstat(fd)
        if not stat.S_ISREG(before.st_mode) or before.st_size != size:
            raise ValueError('Input type/size mismatch: '+str(path))
        chunks = []; remaining = size + 1
        while remaining:
            chunk = os.read(fd, min(remaining, 1048576))
            if not chunk: break
            chunks.append(chunk); remaining -= len(chunk)
        data = b''.join(chunks)
        if os.fstat(fd) != before or path.lstat() != before:
            raise ValueError('Input identity changed: '+str(path))
        if len(data) != size or hashlib.sha256(data).hexdigest() != digest:
            raise ValueError('Input hash mismatch: '+str(path))
        return data
    finally:
        os.close(fd)

def main():
    if len(sys.argv) != 4:
        raise ValueError('Expected verified game, exact decoder, and fresh output directory')
    game, decoder, output = map(Path, sys.argv[1:])
    if output.exists() or output.is_symlink():
        raise ValueError('Output must be absent; no overwrite')
    raw = {name:checked_read(game/name,SIZES[name],digest) for name,digest in EXPECTED.items()}
    decoder_bytes = checked_read(decoder,58545,DECODER_SHA)
    spec = importlib.util.spec_from_file_location('pinned_original_decoder',decoder)
    assets = importlib.util.module_from_spec(spec)
    exec(compile(decoder_bytes,str(decoder),'exec'),assets.__dict__)
    bank = assets.sprites(raw['data/hfx0-0.dat'],raw['data/pal0-c.dat'])
    width,height=300,47
    pixels=bytearray(width*height*4);icons={};x=0
    for kind,number in ICONS:
        w,h,rgba=bank[number]
        if (w,h)!=DIMENSIONS[number] or x+w>width or h>height or len(rgba)!=w*h*4:
            raise ValueError('Unexpected bounded icon dimensions')
        icons[kind]={'id':number,'x':x,'y':0,'w':w,'h':h}
        for y in range(h):
            start=(y*width+x)*4;pixels[start:start+w*4]=rgba[y*w*4:(y+1)*w*4]
        x+=w+1
    if x-1 != width:
        raise ValueError('Unexpected atlas extent')
    output.mkdir()
    assets.png(output/'building-icons.png',width,height,pixels)
    (output/'original-building-icons.json').write_text(json.dumps({'width':width,'height':height,'icons':icons},indent=2)+'\n')
    (output/'provenance.json').write_text(json.dumps({'inputs':EXPECTED,'decoderSha256':DECODER_SHA,'iconIds':dict(ICONS),'rgbaSha256':hashlib.sha256(pixels).hexdigest(),'pngSha256':hashlib.sha256((output/'building-icons.png').read_bytes()).hexdigest(),'limit':'Normal icon identity only; no state/frame/native pixel acceptance.'},indent=2)+'\n')

if __name__ == '__main__':
    main()
