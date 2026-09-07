"""Decode the supplied Populous assets; never execute the Windows installer.
Usage: python3 scripts/import-original.py /path/to/extracted/game
Native layout evidence and remaining renderer differences: references/native-assets.md.
Only Python's standard library is needed. Format/geometry checks run on every import.
"""
from pathlib import Path
import hashlib, json, struct, sys, zlib

def png(path, width, height, pixels):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
    assert len(pixels) == width * height * 4
    rows = b''.join(b'\0' + pixels[y*width*4:(y+1)*width*4] for y in range(height))
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b''))

def sprites(data, palette):
    assert data[:4] == b'PSFB', 'Invalid sprite bank'
    count = struct.unpack_from('<I', data, 4)[0]
    assert 8 + count * 8 <= len(data)
    result = []
    for i in range(count):
        w, h, p = struct.unpack_from('<HHI', data, 8 + i * 8)
        assert w * h <= 1048576 and p <= len(data)
        pixels = bytearray(w * h * 4)
        for y in range(h):
            x = 0
            while True:
                run = struct.unpack_from('<b', data, p)[0]; p += 1
                if run == 0: break
                if run < 0: x -= run
                else:
                    assert x + run <= w and p + run <= len(data), (i, y, x, run, w)
                    for idx in data[p:p+run]:
                        pixels[(y*w+x)*4:(y*w+x)*4+4] = palette[idx*4:idx*4+3] + b'\xff'
                        x += 1
                    p += run
                assert x <= w
        result.append((w, h, pixels))
    return result

def main():
    source = Path(sys.argv[1]); project = Path(__file__).resolve().parents[1]
    output = project / 'public/original'; output.mkdir(exist_ok=True)
    hashes = {}
    def read(name):
        data = (source / name).read_bytes(); hashes[name] = hashlib.sha256(data).hexdigest(); return data
    # levl2001.hdr byte 96 selects landscape bank 12 ('c'); byte 97 selects object bank 0.
    palette = read('data/pal0-c.dat'); assert len(palette) == 1024
    atlas = read('data/bl320-c.dat'); assert len(atlas) == 256*1024
    png(output/'atlas.png', 256, 1024, b''.join(palette[v*4:v*4+3]+bytes([0 if v==0 else 255]) for v in atlas))
    objects, faces, points = [read('objects/'+n+'0-0.dat') for n in ['objs','facs','pnts']]
    assert len(objects)%54 == len(faces)%60 == len(points)%6 == 0
    models = {}
    # Models actually used in this mission, including every hut upgrade and both tribes.
    selected = [13,14,15,60,61,62,30,82,94,117,118,133,134,141,142,*range(169,175)]
    for i in selected:
        _, nf, np, _, _, _, scale, sf, _, sp, _, *_ = struct.unpack_from('<Hhhbbii4I6h4b3h',objects,i*54)
        assert nf>0 and np>0 and scale>0 and sf>0 and sp>0
        p, uv = [], []
        for face in range(sf-1,sf+nf-1):
            _, tile, _, n, _ = struct.unpack_from('<hhHBb',faces,face*60)
            assert n in (3,4) and 0<=tile<256
            texcoords = struct.unpack_from('<8i',faces,face*60+8)
            indices = struct.unpack_from('<4h',faces,face*60+40)
            for k in ([0,1,2] if n==3 else [0,1,2,0,2,3]):
                index = sp+indices[k]-1; assert 0<=index<len(points)//6
                p.extend(round(v/(scale*3),6) for v in struct.unpack_from('<3h',points,index*6))
                uv.extend([round((tile%8+texcoords[k*2]/0x200000)/8,7),round(1-(tile//8+texcoords[k*2+1]/0x200000)/32,7)])
        assert len(p)//3 == len(uv)//2 and len(p)%9 == 0
        models[i] = {'p':p,'uv':uv}
    (project/'app/original-models.json').write_text(json.dumps(models,separators=(',',':')))
    bank = sprites(read('data/hspr0-0.dat'),palette); assert len(bank)==7953
    elements = list(struct.iter_unpack('<HhhHH',read('data/vele-0.ani')))
    frames = list(struct.iter_unpack('<HBBBBH',read('data/vfra-0.ani')))
    starts = list(struct.iter_unpack('<HH',read('data/vstart-0.ani')))
    # VELE references legacy six-byte TAB records, numbered from one. VFRA chains
    # retain each body/weapon/clothing layer's signed offset and original timing.
    def composite(frame, team, kind):
        pixels = bytearray(64*64*4); element = frames[frame][0]; visited = set()
        while element:
            assert element<len(elements) and element not in visited; visited.add(element)
            pos,x,y,flags,element = elements[element]
            layer, variant = (flags>>4)&15, flags>>9
            include = flags & ~1 == 0 or (layer==1 and variant==(1 if team=='red' else 0)) or (layer==2 and variant==2 and kind=='warrior')
            if not include: continue
            assert pos%6==0 and 0<pos//6<=len(bank)
            w,h,data = bank[pos//6-1]
            for sy in range(h):
                for sx in range(w):
                    dx,dy=x+32+(w-1-sx if flags&1 else sx),y+48+sy
                    assert 0<=dx<64 and 0<=dy<64
                    if data[(sy*w+sx)*4+3]:pixels[(dy*64+dx)*4:(dy*64+dx)*4+4]=data[(sy*w+sx)*4:(sy*w+sx)*4+4]
        return pixels
    metadata = {}; rendered = []; cache = {}
    for team in ['blue','red','wild']:
        for kind in (['brave'] if team=='wild' else ['brave','warrior','shaman']):
            states = {'walk':0 if team=='wild' else 40,'idle':8 if team=='wild' else 48,'work':16 if team=='wild' else 72,'attack':16 if team=='wild' else 88,'carry':776}
            if kind=='warrior':states['attack']=728
            if kind=='shaman':states={'walk':424 if team=='blue' else 432,'idle':424 if team=='blue' else 432,'work':456 if team=='blue' else 464,'attack':456 if team=='blue' else 464}
            metadata[f'{team}-{kind}'] = {}
            for state,start in states.items():
                directions=[]
                for direction in range(8):
                    frame,mirror=starts[start+direction]; cycle=[]; seen=set()
                    while frame not in seen:
                        assert 0<frame<len(frames);seen.add(frame)
                        key=(frame,team,kind)
                        if key not in cache:cache[key]=len(rendered);rendered.append(composite(frame,team,kind))
                        cycle.append(cache[key]);frame=frames[frame][-1]
                    directions.append({'frames':cycle,'flip':bool(mirror)})
                metadata[f'{team}-{kind}'][state]=directions
    width=1024;height=((len(rendered)+15)//16)*64;pixels=bytearray(width*height*4)
    for i,data in enumerate(rendered):
        x=i%16*64;y=i//16*64
        for row in range(64):pixels[((y+row)*width+x)*4:((y+row)*width+x+64)*4]=data[row*256:(row+1)*256]
    png(output/'units.png',width,height,pixels)
    (project/'app/original-units.json').write_text(json.dumps({'width':width,'height':height,'animations':metadata},separators=(',',':')))
    hfx = sprites(read('data/hfx0-0.dat'),palette)
    icons={'blast':355,'lightning':356,'bridge':365,'brave':666,'warrior':668,'shaman':664,'buildings':676,'spells':678,'followers':680,'gold':712,'hut':1028,'tower':1029,'camp':1030,'temple':1032}
    for name,i in icons.items():png(output/(name+'.png'),*hfx[i])
    png(output/'portrait.png',*bank[6879])
    for name,w,h,gray in [('bigf0-c.dat',256,1152,False),('disp0-c.dat',256,256,True),('watdisp.dat',256,256,True)]:
        data=read('data/'+name);assert len(data)==w*h
        rgba=b''.join((bytes([(v+128)%256]*3) if gray else palette[v*4:v*4+3])+b'\xff' for v in data)
        png(output/({'bigf0-c.dat':'land-colours','disp0-c.dat':'land-detail','watdisp.dat':'water-detail'}[name]+'.png'),w,h,rgba)
    for src,dst in [('dsky0-c1.png','clouds.png'),('dsky0-cb.png','sky.png')]:
        data=read('data/d3d/'+src);(output/dst).write_bytes(data)
    (output/'provenance.json').write_text(json.dumps({'landscapeBank':12,'objectBank':0,'modelIds':selected,'sourceFrames':len(bank),'compositedFrames':len(rendered),'sha256':hashes},indent=2)+'\n')
    print(f'Validated {len(models)} models, {len(bank)} sprites, {len(rendered)} composite animation frames, {len(icons)} UI tiles and level-one landscape bank c.')

if __name__=='__main__':main()
