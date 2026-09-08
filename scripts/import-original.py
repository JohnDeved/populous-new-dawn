"""Decode the supplied Populous assets; never execute the Windows installer.
Usage: python3 scripts/import-original.py /path/to/extracted/game
Native layout evidence and remaining renderer differences: references/native-assets.md.
Only Python's standard library is needed. Format/geometry checks run on every import.
"""
from pathlib import Path
import hashlib, json, re, struct, sys, zlib

def png(path, width, height, pixels):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
    assert len(pixels) == width * height * 4
    rows = b''.join(b'\0' + pixels[y*width*4:(y+1)*width*4] for y in range(height))
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b''))

def sprites(data, palette, alpha=False):
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
                        pixels[(y*w+x)*4:(y*w+x)*4+4] = palette[idx*4:idx*4+4] if alpha else palette[idx*4:idx*4+3] + b'\xff'
                        x += 1
                    p += run
                assert x <= w
        result.append((w, h, pixels))
    return result

def resolve_object_bank(requested):
    return 2 if requested == 0 else requested # 0x40c670.

def building_shapes(data, objects):
    # 0x40c880 relocates 64 records (native 0x5ca2ec), each 48 bytes.
    assert len(data) >= 64*48 and len(objects)%54 == 0
    shapes=[]
    for i in range(64):
        width,height,x,y,ix,iy,ox,oy=struct.unpack_from('<4B4b',data,i*48)
        offset=struct.unpack_from('<I',data,i*48+44)[0]
        assert offset+width*height <= len(data)-64*48
        shapes.append(dict(width=width,height=height,x=x,y=y,inside=[ix,iy],outside=[ox,oy],offset=offset))
    indices=[list(struct.unpack_from('<4b',objects,i+44)) for i in range(0,len(objects),54)]
    assert all(0 <= n < len(shapes) for row in indices for n in row)
    return dict(objects=indices,shapes=shapes,cells=list(data[64*48:]))

def main():
    source = Path(sys.argv[1]); project = Path(__file__).resolve().parents[1]
    output = project / 'public/original'; output.mkdir(exist_ok=True)
    hashes = {}
    def read(name):
        data = (source / name).read_bytes(); hashes[name] = hashlib.sha256(data).hexdigest(); return data
    level = json.loads((project/'app/level-one.ts').read_text().split('export default ',1)[1].rstrip(';\n'))
    requested_bank = level['objectBank']
    object_bank = resolve_object_bank(requested_bank)
    assert level['landscapeBank'] == 12, 'This importer currently supports landscape bank c'
    palette = read('data/pal0-c.dat'); assert len(palette) == 1024
    atlas = read('data/bl320-c.dat'); assert len(atlas) == 256*1024
    png(output/'atlas.png', 256, 1024, b''.join(palette[v*4:v*4+3]+bytes([0 if v==0 else 255]) for v in atlas))
    objects, faces, points = [read(f'objects/{n}0-{object_bank}.dat') for n in ['objs','facs','pnts']]
    shape_data=read('objects/shapes.dat')
    (project/'app/original-shapes.json').write_text(json.dumps(building_shapes(shape_data,objects),separators=(',',':'))+'\n')
    assert len(objects)%54 == len(faces)%60 == len(points)%6 == 0
    models, topology = {}, {}
    # Models actually used in this mission, including every hut upgrade and both tribes.
    selected = [13,14,15,16,17,18,30,45,152,153,154,155,79,80,95,96,103,104,*range(131,137)]
    for i in selected:
        _, nf, np, _, _, _, scale, sf, _, sp, _, *_ = struct.unpack_from('<Hhhbbii4I6h4b3h',objects,i*54)
        assert nf>0 and np>0 and scale>0 and sf>0 and sp>0
        p, uv, order, face_stages = [], [], [], []
        for face in range(sf-1,sf+nf-1):
            _, tile, _, n, _ = struct.unpack_from('<hhHBb',faces,face*60)
            assert n in (3,4) and 0<=tile<256
            face_stages.extend([n, faces[face*60+59]]) # 0x471c40: visibility/cap bits, not texture-size byte +7.
            texcoords = struct.unpack_from('<8i',faces,face*60+8)
            indices = struct.unpack_from('<4h',faces,face*60+40)
            for k in ([0,1,2] if n==3 else [0,1,2,0,2,3]):
                order.append(indices[k])
                index = sp+indices[k]-1; assert 0<=index<len(points)//6
                x,y,z=struct.unpack_from('<3h',points,index*6)
                # The level importer reverses map Z: geometry must use the same handedness.
                p.extend(round(v/(scale*3),6) for v in (x,y,-z))
                uv.extend([round((tile%8+texcoords[k*2]/0x200000)/8,7),round(1-(tile//8+texcoords[k*2+1]/0x200000)/32,7)])
        assert len(p)//3 == len(uv)//2 and len(p)%9 == 0
        models[i] = {'p':p,'uv':uv,'scale':scale,'faces':face_stages}
        topology[i] = (scale, order)
    assert all(topology[i] == topology[152] for i in (153,154,155)), 'Vault morph topology differs'
    (project/'app/original-models.json').write_text(json.dumps(models,separators=(',',':')))
    bank = sprites(read('data/hspr0-0.dat'),palette); assert len(bank)==7953
    elements = list(struct.iter_unpack('<HhhHH',read('data/vele-0.ani')))
    frames = list(struct.iter_unpack('<HBBBBH',read('data/vfra-0.ani')))
    starts = list(struct.iter_unpack('<HH',read('data/vstart-0.ani')))
    # 0x42c320 counts the VFRA chain once for each distinct start frame.
    frame_counts=[]
    for first,_ in starts:
        frame=first;seen=set()
        while frame and frame not in seen:
            assert frame<len(frames);seen.add(frame);frame=frames[frame][-1]
        assert frame in (0,first)
        frame_counts.append(len(seen)&255)
    # VELE references legacy six-byte TAB records, numbered from one. VFRA chains
    # retain each body/weapon/clothing layer's signed offset and original timing.
    def composite(frame, team, kind):
        layers=[];element=frames[frame][0];visited=set()
        while element:
            assert element<len(elements) and element not in visited;visited.add(element)
            pos,x,y,flags,element=elements[element]
            layer,variant=(flags>>4)&31,flags>>9
            include=(layer==0 and variant!=1) or (layer==1 and variant==(1 if team=='red' else 0) and kind!='shaman') or (layer==2 and variant==2 and kind=='warrior')
            if include:
                assert pos%6==0 and 0<pos//6<=len(bank)
                w,h,data=bank[pos//6-1];layers.append((x,y,w,h,data,flags))
        assert layers
        left=min(a[0] for a in layers);top=min(a[1] for a in layers)
        width=max(x+w for x,y,w,h,data,flags in layers)-left;height=max(y+h for x,y,w,h,data,flags in layers)-top
        pixels=bytearray(width*height*4)
        for x,y,w,h,data,flags in layers:
            for sy in range(h):
                for sx in range(w):
                    dx,dy=x-left+(w-1-sx if flags&1 else sx),y-top+sy
                    if data[(sy*w+sx)*4+3]:pixels[(dy*width+dx)*4:(dy*width+dx)*4+4]=data[(sy*w+sx)*4:(sy*w+sx)*4+4]
        return width,height,left,top,pixels
    metadata = {}; rendered = []; cache = {}
    for team in ['blue','red','wild']:
        for kind in (['brave'] if team=='wild' else ['brave','warrior','shaman']):
            # Executable animation map at 0x5a6d50 -> object table 0x5a6858.
            states = {'walk':40,'idle':48,'selected':64,'work':88,'chop':104,'attack':120,'strike':104,'special':200,'recoil':112,'pray':144,'carry':72,'carryIdle':80,'airborne':152,'die':312,'drown':416,'dance':96}
            if team=='wild':states={k:0 if k=='walk' else 8 for k in states}
            elif kind!='shaman':states['idleGesture']=712 if kind=='brave' else 728
            if kind=='shaman':
                states={'walk':616,'idle':424,'selected':744,'work':456,'chop':456,'attack':456,'strike':456,'special':552,'recoil':424,'pray':552,'cast':648,'airborne':488,'die':352,'drown':616}
                states={k:v+(8 if team=='red' else 0) for k,v in states.items()}
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
                    directions.append({'frames':cycle,'flip':bool(mirror),'source':start+direction})
                metadata[f'{team}-{kind}'][state]=directions
    cell=1
    while cell<max(max(w,h) for w,h,x,y,data in rendered):cell*=2
    width=cell*32;height=((len(rendered)+31)//32)*cell;pixels=bytearray(width*height*4)
    for i,(w,h,left,top,data) in enumerate(rendered):
        x=i%32*cell;y=i//32*cell
        for row in range(h):pixels[((y+row)*width+x)*4:((y+row)*width+x+w)*4]=data[row*w*4:(row+1)*w*4]
    png(output/'units.png',width,height,pixels)
    info=[{'w':w,'h':h,'x':x,'y':y} for w,h,x,y,data in rendered]
    (project/'app/original-units.json').write_text(json.dumps({'width':width,'height':height,'cell':cell,'columns':32,'fps':12,'frameCounts':frame_counts,'frames':info,'animations':metadata},separators=(',',':')))
    hfx_data=read('data/hfx0-0.dat');hfx=sprites(hfx_data,palette)
    # 0x476570: HFX high nibble selects an AL0 colour, low nibble is 0..15 alpha.
    alpha=read('data/al0-c.dat');assert len(alpha)==65536
    fx_palette=b''.join(palette[alpha[(v|15)*256]*4:alpha[(v|15)*256]*4+3]+bytes([(v&15)*17]) for v in range(256))
    effects=sprites(hfx_data,fx_palette,alpha=True)
    # 0x4673b0 draws type-1 objects from HFX, including the small trail particles.
    # Trail draw type 1 uses the ordinary palette; the Blast head uses nibble alpha.
    fx_sequences={'impact':(1180,14),'smoke':(1224,16),'sparkle':(1288,16),'hit':(1294,6),'splash':(1304,16),'lightning':(1361,8),'birth':(1441,16),'blastShot':(0x460,8),'blastTrail':(0x13a,4),'spellTrail':(0x142,4),'log':(23,1)}
    fx_frames=[];fx_meta={};cell=256
    for name,(start,count) in fx_sequences.items():
        fx_meta[name]=[]
        for i in range(start,start+count):
            w,h,data=(hfx if name in ('blastTrail','spellTrail','log') else effects)[i];assert w<=cell and h<=cell
            fx_meta[name].append({'index':len(fx_frames),'w':w,'h':h,'source':i});fx_frames.append((w,h,data))
    fw=2048;fh=((len(fx_frames)+7)//8)*cell;pixels=bytearray(fw*fh*4)
    for i,(w,h,data) in enumerate(fx_frames):
        x=i%8*cell;y=i//8*cell
        for row in range(h):pixels[((y+row)*fw+x)*4:((y+row)*fw+x+w)*4]=data[row*w*4:(row+1)*w*4]
    png(output/'effects.png',fw,fh,pixels)
    (project/'app/original-effects.json').write_text(json.dumps({'width':fw,'height':fh,'animations':fx_meta},separators=(',',':')))
    data=read('levels/constant.dat')
    if data[:2]==b'@~':data=b'  '+bytes((~(v^(1<<((i-3)&7))))&255 for i,v in enumerate(data))[2:]
    constants={}
    for k,v in re.findall(r'^\s*P3CONST_(\S+)\s*=\s*(-?\d+)',data.decode('ascii'),re.M):constants.setdefault(k,int(v))
    assert constants['LIFE_BRAVE']==1000 and constants['BRAVE_SPEED']==70
    (project/'app/original-constants.json').write_text(json.dumps(constants,indent=2)+'\n')
    icons={'blast':355,'lightning':356,'bridge':365,'brave':666,'warrior':668,'shaman':664,'buildings':676,'spells':678,'followers':680,'gold':712,'hut':1028,'tower':1029,'camp':1030,'temple':1032}
    for name,i in icons.items():png(output/(name+'.png'),*hfx[i])
    png(output/'portrait.png',*bank[6879])
    for name,w,h,gray in [('bigf0-c.dat',256,1152,False),('disp0-c.dat',256,256,True),('watdisp.dat',256,256,True)]:
        data=read('data/'+name);assert len(data)==w*h
        rgba=b''.join((bytes([(v+128)%256]*3) if gray else palette[v*4:v*4+3])+b'\xff' for v in data)
        png(output/({'bigf0-c.dat':'land-colours','disp0-c.dat':'land-detail','watdisp.dat':'water-detail'}[name]+'.png'),w,h,rgba)
    for src,dst in [('dsky0-c1.png','clouds.png'),('dsky0-cb.png','sky.png')]:
        data=read('data/d3d/'+src);(output/dst).write_bytes(data)
    (output/'provenance.json').write_text(json.dumps({'landscapeBank':12,'requestedObjectBank':requested_bank,'objectBank':object_bank,'modelIds':selected,'sourceFrames':len(bank),'compositedFrames':len(rendered),'sha256':hashes},indent=2)+'\n')
    print(f'Validated {len(models)} models, {len(bank)} sprites, {len(rendered)} composite animation frames, {len(icons)} UI tiles and level-one landscape bank c.')

if __name__=='__main__':main()
