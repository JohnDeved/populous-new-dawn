"""Decode the supplied Populous assets; never execute the Windows installer.
Usage: python3 scripts/import-original.py /path/to/extracted/game [--units-only | --vehicles-only | --training-huts-only | --hut-smoke-only]
--units-only appends Shaman families to the existing unit atlas and writes only
app/original-units.json, public/original/unit-layers.png and provenance.json.
--vehicles-only appends original mesh143/144 to original-models.json and its
provenance modelIds; it never regenerates the shared object atlas.
--training-huts-only appends meshes 98/100/101/102/105 and provenance modelIds,
retaining every existing model, texture and unrelated asset.
--hut-smoke-only appends HFX1329-1344 and HFX1385-1400 after the existing
effects atlas rows, preserving all existing pixels and metadata indices.
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

def read_owned_rgba_png(path):
    """Read our generated filter-0 RGBA8 PNG without normalizing any pixels."""
    data = path.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    offset = 8
    width = height = None
    compressed = bytearray()
    while offset < len(data):
        size = struct.unpack_from('>I', data, offset)[0]
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:offset + 8 + size]
        assert zlib.crc32(kind + payload) & 0xffffffff == struct.unpack_from(
            '>I', data, offset + 8 + size
        )[0]
        offset += 12 + size
        if kind == b'IHDR':
            width, height, depth, color, compression, filtering, interlace = struct.unpack(
                '>IIBBBBB', payload
            )
            assert (depth, color, compression, filtering, interlace) == (8, 6, 0, 0, 0)
        elif kind == b'IDAT':
            compressed.extend(payload)
        elif kind == b'IEND':
            break
    assert width is not None and height is not None
    raw = zlib.decompress(bytes(compressed))
    stride = width * 4
    assert len(raw) == height * (stride + 1)
    pixels = bytearray()
    for y in range(height):
        row = raw[y * (stride + 1):(y + 1) * (stride + 1)]
        assert row[0] == 0, 'Owned effects atlas must retain filter-0 rows'
        pixels.extend(row[1:])
    return width, height, pixels


def object_atlas(data, palette, alpha, alpha_tiles):
    """0x4b6e60/0x42fb30: selected object tiles use AL colors and nibble opacity."""
    output = bytearray()
    for i, value in enumerate(data):
        tile = (i % 256) // 32 + (i // (256 * 32)) * 8
        if alpha_tiles[tile]:
            opacity = (value & 15) * 17
            color = alpha[(value | 15) * 256] if opacity else 0
        else:
            color, opacity = value, 255 if value else 0
            if not value:
                output.extend(bytes(4))
                continue
        output.extend(palette[color * 4:color * 4 + 3])
        output.append(opacity)
    return output


def object_texture(pixels):
    """0x5218d0 selects ARGB4444 for alpha-capable object textures; quantize before filtering."""
    return object_texture_edges(bytes((value >> 4) * 17 for value in pixels))


def object_texture_edges(pixels):
    """0x4b6e60: expand RGB into zero texels, rows then columns within each 32px tile."""
    assert len(pixels) == 256 * 1024 * 4
    pixels = bytearray(pixels)
    for tile in range(256):
        origin = ((tile // 8) * 32 * 256 + (tile % 8) * 32) * 4
        for across, down in [(4, 256 * 4), (256 * 4, 4)]:
            for line in range(32):
                previous_at = origin + line * down
                previous = pixels[previous_at:previous_at + 4]
                for position in range(1, 32):
                    current_at = origin + line * down + position * across
                    current = pixels[current_at:current_at + 4]
                    if not any(previous) and any(current):
                        pixels[previous_at:previous_at + 3] = current[:3]
                    elif any(previous) and not any(current):
                        pixels[current_at:current_at + 3] = previous[:3]
                    previous_at, previous = current_at, current
    return pixels


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

def building_shapes(data, objects, smoke_offsets=b''):
    # 0x404640 / 0x4047b0: optional model/orientation corrections, in four-unit coordinates.
    offsets = [[[0,0,0] for _ in range(4)] for _ in range(30)]
    for line in smoke_offsets.decode('ascii').splitlines():
        fields=line.split('#',1)[0].split()
        if not fields: continue
        assert len(fields)==6 and fields[0]=='SMOKE', 'Malformed socket correction'
        model,angle,x,h,y=map(int,fields[1:])
        assert 0<=model<30 and 0<=angle<4 and all(-32768<=v<=32767 for v in (x,h,y))
        offsets[model][angle]=[x,h,y]
    corrected=[80,81,82,*range(110,119),*range(122,131),*range(134,143)]
    # 0x40c880 relocates 64 records (native 0x5ca2ec), each 48 bytes.
    assert len(data) >= 64*48 and len(objects)%54 == 0
    shapes=[]
    for i in range(64):
        width,height,x,y,ix,iy,ox,oy=struct.unpack_from('<4B4b',data,i*48)
        offset=struct.unpack_from('<I',data,i*48+44)[0]
        assert offset+width*height <= len(data)-64*48
        smoke=[]
        for j in range(6):
            point=list(struct.unpack_from('<3B',data,i*48+26+j*3))
            if not point[2]:break
            smoke.append(point)
        fire=[list(struct.unpack_from('<3B',data,i*48+26+j*3)) for j in range(6)]
        sockets=[list(struct.unpack_from('<3B',data,i*48+8+j*3)) for j in range(6)]
        shapes.append(dict(width=width,height=height,x=x,y=y,inside=[ix,iy],outside=[ox,oy],offset=offset,smoke=smoke,fire=fire,sockets=sockets))
    indices=[list(struct.unpack_from('<4b',objects,i+44)) for i in range(0,len(objects),54)]
    assert all(0 <= n < len(shapes) for row in indices for n in row)
    # 0x403d50: object origin relative to its bounding-box reference.
    origins=[[
        struct.unpack_from('<h',objects,i+48)[0]-struct.unpack_from('<h',objects,i+32)[0],
        struct.unpack_from('<h',objects,i+52)[0]-struct.unpack_from('<h',objects,i+36)[0],
    ] for i in range(0,len(objects),54)]
    return dict(objects=indices,origins=origins,shapes=shapes,cells=list(data[64*48:]),socketOffsets={str(model):offsets[i] for i,model in enumerate(corrected)})

def append_shaman_units(source, project):
    """Add the original four-tribe model-7 families without reindexing old art.

    This bounded mode writes only original-units.json, unit-layers.png and its
    provenance.json. The normal full importer calls it after producing that same
    baseline, so a future full import cannot silently remove the added families.
    004673b0 / 00450e60 select base + tribe*8, not follower-style recoloring.
    """
    output = project / 'public/original'
    units_path = project / 'app/original-units.json'
    provenance_path = output / 'provenance.json'
    units = json.loads(units_path.read_text())
    provenance = json.loads(provenance_path.read_text())
    rules = json.loads((project / 'app/original-rules.json').read_text())
    inputs = {}
    for name in ['vstart-0.ani', 'vfra-0.ani', 'vele-0.ani', 'hspr0-0.dat', 'pal0-c.dat']:
        relative = 'data/' + name
        data = (source / relative).read_bytes()
        if hashlib.sha256(data).hexdigest() != provenance['sha256'][relative]:
            raise ValueError('Original unit input identity differs: ' + relative)
        inputs[name] = data
    starts = list(struct.iter_unpack('<HH', inputs['vstart-0.ani']))
    frames = list(struct.iter_unpack('<HBBBBH', inputs['vfra-0.ani']))
    elements = list(struct.iter_unpack('<HhhHH', inputs['vele-0.ani']))
    bank = sprites(inputs['hspr0-0.dat'], inputs['pal0-c.dat'])
    assert len(starts) == 792 and len(bank) == 7953
    old_frames = list(units['frames'])
    old_pieces = list(units['pieces'])
    old_animations = dict(units['animations'])
    piece_index = {piece['source']: i for i, piece in enumerate(old_pieces)}
    frame_index = {}
    for i, frame in enumerate(old_frames):
        frame_index.setdefault(frame['source'], i)

    def raw_layers(frame):
        layers, seen = [], set()
        element = frames[frame][0]
        while element:
            assert element < len(elements) and element not in seen
            seen.add(element)
            reference, x, y, flags, element = elements[element]
            assert reference % 6 == 0 and 0 < reference // 6 <= len(bank)
            layers.append((reference // 6 - 1, x, y, flags))
        return layers

    def cycle(start):
        first, mirror = starts[start]
        frame, sequence = first, []
        while frame and frame not in sequence:
            assert frame < len(frames)
            sequence.append(frame)
            frame = frames[frame][-1]
        assert frame in (0, first)
        return sequence, bool(mirror)

    assert units['frameCounts'] == [len(cycle(i)[0]) & 255 for i in range(len(starts))]
    for item in old_frames:
        assert [(old_pieces[layer['piece']]['source'], layer['x'], layer['y'], layer['flags'])
                for layer in item['layers']] == raw_layers(item['source'])
    for item in old_pieces:
        assert (item['w'], item['h']) == bank[item['source']][:2]
    bases = {directions[0]['source'] for directions in units['animations']['blue-shaman'].values()}
    bases.update(rules['animationObjects'][obj][0]
                 for i, obj in enumerate(rules['personAnimationObjects']) if i % 9 == 7 and obj >= 0)
    required_starts = sorted({base + tribe * 8 for base in bases for tribe in range(4)})
    needed_frames = {frame for start in required_starts for direction in range(8)
                     for frame in cycle(start + direction)[0]}
    needed_pieces = {piece for frame in needed_frames for piece, *_ in raw_layers(frame)}
    for source_piece in sorted(needed_pieces - piece_index.keys()):
        width, height, _ = bank[source_piece]
        assert max(width, height) <= units['cell']
        piece_index[source_piece] = len(units['pieces'])
        units['pieces'].append({'source': source_piece, 'w': width, 'h': height})
    for source_frame in sorted(needed_frames - frame_index.keys()):
        frame_index[source_frame] = len(units['frames'])
        units['frames'].append({
            'source': source_frame, 'nativeWidth': frames[source_frame][1],
            'nativeHeight': frames[source_frame][2],
            'layers': [{'piece': piece_index[piece], 'x': x, 'y': y, 'flags': flags}
                       for piece, x, y, flags in raw_layers(source_frame)],
        })

    def directions(start):
        result = []
        for direction in range(8):
            sequence, mirror = cycle(start + direction)
            assert sequence
            result.append({'frames': [frame_index[frame] for frame in sequence],
                           'flip': mirror, 'source': start + direction})
        return result

    # Existing blue/red signatures are intentionally byte-for-byte preserved.
    # Direct native-source lookup also covers phase-specific shared spirit poses.
    units['shamanSources'] = {str(start): directions(start) for start in required_starts}
    for team, tribe in [('yellow', 2), ('green', 3)]:
        units['animations'][team + '-shaman'] = {
            state: directions(old[0]['source'] + tribe * 8)
            for state, old in units['animations']['blue-shaman'].items()
        }
    assert units['frames'][:len(old_frames)] == old_frames
    assert units['pieces'][:len(old_pieces)] == old_pieces
    assert all(units['animations'][key] == value for key, value in old_animations.items())
    cell, columns = units['cell'], units['columns']
    width = units['width']
    height = ((len(units['pieces']) + columns - 1) // columns) * cell
    assert width == cell * columns
    pixels = bytearray(width * height * 4)
    for i, piece in enumerate(units['pieces']):
        w, h, rgba = bank[piece['source']]
        x, y = (i % columns) * cell, (i // columns) * cell
        for row in range(h):
            at = ((y + row) * width + x) * 4
            pixels[at:at + w * 4] = rgba[row * w * 4:(row + 1) * w * 4]
    units['height'] = height
    png(output / 'unit-layers.png', width, height, pixels)
    units_path.write_text(json.dumps(units, separators=(',', ':')))
    provenance['animationFrames'] = len(units['frames'])
    provenance['spritePieces'] = len(units['pieces'])
    provenance['unitAtlasSha256'] = hashlib.sha256((output / 'unit-layers.png').read_bytes()).hexdigest()
    provenance_path.write_text(json.dumps(provenance, indent=2) + '\n')
    print(f"Appended {len(units['frames']) - len(old_frames)} original Shaman frames and "
          f"{len(units['pieces']) - len(old_pieces)} pieces; atlas {width}x{height}; "
          "old frame/piece indices and animation clocks preserved.")

def decode_original_model(objects, faces, points, i):
    """Decode one original OBJS/FACS/PNTS record without writing any asset."""
    _, nf, np, _, _, _, scale, sf, _, sp, _, *_ = struct.unpack_from('<Hhhbbii4I6h4b3h',objects,i*54)
    assert nf>0 and np>0 and scale>0 and sf>0 and sp>0
    p, uv, order, face_stages, tiles, normals, modes, biases = [], [], [], [], [], [], [], []
    for face in range(sf-1,sf+nf-1):
        # Keep mode-zero faces: collapse allocates them and consumes RNG too.
        modes.append(faces[face*60+7])
        biases.append(-struct.unpack_from("<b",objects,i*54+6)[0]-struct.unpack_from("<b",faces,face*60+58)[0])
        _, tile, _, n, _ = struct.unpack_from('<hhHBb',faces,face*60)
        assert n in (3,4) and 0<=tile<256
        face_stages.extend([n, faces[face*60+59]]) # 0x471c40: visibility/cap bits, not texture-size byte +7.
        tiles.append(tile)
        flags = struct.unpack_from('<H', faces, face*60+4)[0]
        normals.append([-1]*4 if flags & 1 else list(struct.unpack_from('<4h', faces, face*60+48)))
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
    decoded = {'p':p,'uv':uv,'scale':scale,'faces':face_stages,'tiles':tiles,'normals':normals,'modes':modes,'biases':biases,'panelHeight':int(struct.unpack_from('<h',objects,i*54+40)[0]/2)}
    return decoded, (scale, order)

def append_vehicle_models(source, project):
    """Import only original class-4 mesh IDs 143/144; keep all previous assets.

    00463c63 reads descriptor+4, then 004ee700 selects draw type 2. The adjacent
    838/839 descriptor+6 values are tooltip string IDs (004f0f90/0044d7f0), not
    missing render resources. Campaign object banks 2 and 6 share these meshes.
    """
    models_path = project / 'app/original-models.json'
    provenance_path = project / 'public/original/provenance.json'
    models = json.loads(models_path.read_text())
    provenance = json.loads(provenance_path.read_text())
    if provenance['objectBank'] != 2:
        raise ValueError('Vehicle append requires the reviewed bank-2 model baseline')
    original = dict(models)
    raw = {}
    for kind in ['objs', 'facs', 'pnts']:
        name = f'objects/{kind}0-2.dat'
        data = (source / name).read_bytes()
        if hashlib.sha256(data).hexdigest() != provenance['sha256'][name]:
            raise ValueError('Original vehicle input hash mismatch: ' + name)
        raw[kind] = data
    objects, faces, points = raw['objs'], raw['facs'], raw['pnts']
    if len(objects) % 54 or len(faces) % 60 or len(points) % 6:
        raise ValueError('Invalid original vehicle record sizes')
    for model in [143, 144]:
        record = struct.unpack_from('<Hhhbbii4I6h4b3h', objects, model * 54)
        flags, face_count, point_count, scale = record[0], record[1], record[2], record[6]
        face_start, point_start = record[7], record[9]
        if flags or scale != 160 or face_count < 1 or point_count < 1:
            raise ValueError('Unexpected original static vehicle model: ' + str(model))
        assert 1 <= face_start and face_start + face_count - 1 <= len(faces) // 60
        assert 1 <= point_start and point_start + point_count - 1 <= len(points) // 6
        p, uv, stages, tiles, normals, modes, biases = [], [], [], [], [], [], []
        for face in range(face_start - 1, face_start + face_count - 1):
            offset = face * 60
            _, tile, face_flags, count, mode = struct.unpack_from('<hhHBb', faces, offset)
            assert count in (3, 4) and 0 <= tile < 256 and mode in (3, 6, 22)
            indices = struct.unpack_from('<4h', faces, offset + 40)
            tex = struct.unpack_from('<8i', faces, offset + 8)
            stages.extend([count, faces[offset + 59]])
            tiles.append(tile)
            modes.append(mode)
            biases.append(-struct.unpack_from('<b', objects, model * 54 + 6)[0]
                          - struct.unpack_from('<b', faces, offset + 58)[0])
            normals.append([-1] * 4 if face_flags & 1
                           else list(struct.unpack_from('<4h', faces, offset + 48)))
            for corner in ([0, 1, 2] if count == 3 else [0, 1, 2, 0, 2, 3]):
                assert 0 <= indices[corner] < point_count
                x, y, z = struct.unpack_from('<3h', points, (point_start + indices[corner] - 1) * 6)
                p.extend(round(value / (scale * 3), 6) for value in (x, y, -z))
                uv.extend([round((tile % 8 + tex[corner * 2] / 0x200000) / 8, 7),
                           round(1 - (tile // 8 + tex[corner * 2 + 1] / 0x200000) / 32, 7)])
        decoded = dict(p=p, uv=uv, scale=scale, faces=stages, tiles=tiles,
                       normals=normals, modes=modes, biases=biases,
                       panelHeight=int(struct.unpack_from('<h', objects, model * 54 + 40)[0] / 2))
        if str(model) in models and models[str(model)] != decoded:
            raise ValueError('Refusing to overwrite a differing existing vehicle model: ' + str(model))
        models[str(model)] = decoded
    assert all(models[key] == value for key, value in original.items())
    for model in [143, 144]:
        if model not in provenance['modelIds']:
            provenance['modelIds'].append(model)
    models_path.write_text(json.dumps(models, separators=(',', ':')))
    provenance_path.write_text(json.dumps(provenance, indent=2) + '\n')
    print('Imported original Boat 143 and Balloon 144; all prior models and atlas bytes retained.')

def append_training_hut_models(source, project):
    """Append only the five absent original tribe-specific training meshes.

    0040b170 chooses a distinct object for each owner. The original points and
    textures differ from Blue; neither a fallback mesh nor recoloring is valid.
    """
    selected = (98, 100, 101, 102, 105)
    models_path = project / 'app/original-models.json'
    provenance_path = project / 'public/original/provenance.json'
    models = json.loads(models_path.read_text())
    provenance = json.loads(provenance_path.read_text())
    if provenance['objectBank'] != 2:
        raise ValueError('Training-hut append requires the reviewed bank-2 baseline')
    raw = []
    for kind in ('objs', 'facs', 'pnts'):
        name = f'objects/{kind}0-2.dat'
        data = (source / name).read_bytes()
        if hashlib.sha256(data).hexdigest() != provenance['sha256'][name]:
            raise ValueError('Original training-hut input hash mismatch: ' + name)
        raw.append(data)
    if any(len(data) % stride for data, stride in zip(raw, (54, 60, 6))):
        raise ValueError('Invalid original training-hut record sizes')
    additions = {str(model): decode_original_model(*raw, model)[0] for model in selected}
    for key, decoded in additions.items():
        if key in models and models[key] != decoded:
            raise ValueError('Refusing to overwrite a differing existing training mesh: ' + key)
    models.update(additions)
    for model in selected:
        if model not in provenance['modelIds']:
            provenance['modelIds'].append(model)
    models_path.write_text(json.dumps(models, separators=(',', ':')))
    provenance_path.write_text(json.dumps(provenance, indent=2) + '\n')
    print('Appended original training-hut meshes 98, 100, 101, 102, 105; previous models and atlas retained.')


def append_hut_smoke_effects(source, project):
    """Append occupancy-smoke HFX rows without moving or rewriting existing atlas pixels."""
    output = project / 'public/original'
    effects_path = output / 'effects.png'
    metadata_path = project / 'app/original-effects.json'
    provenance = json.loads((output / 'provenance.json').read_text())
    metadata = json.loads(metadata_path.read_text())
    old_metadata = json.loads(metadata_path.read_text())

    inputs = {}
    for name in ('pal0-c.dat', 'al0-c.dat', 'hfx0-0.dat'):
        relative = 'data/' + name
        data = (source / relative).read_bytes()
        if hashlib.sha256(data).hexdigest() != provenance['sha256'][relative]:
            raise ValueError('Original hut-smoke input identity differs: ' + relative)
        inputs[name] = data

    if any(name in metadata['animations'] for name in ('hutSmokeFull', 'hutSmokePartial')):
        raise ValueError('Hut occupancy smoke is already present in the effects metadata')

    width, old_height, old_pixels = read_owned_rgba_png(effects_path)
    if (width, old_height) != (metadata['width'], metadata['height']):
        raise ValueError('Effects PNG dimensions differ from metadata')
    cell, columns = 256, 8
    if width != cell * columns or old_height % cell:
        raise ValueError('Unexpected effects atlas geometry')

    # Never fill unused cells in the existing final row: all old pixels, including
    # transparent padding, are preserved exactly. New content begins on a new row.
    first_index = (old_height // cell) * columns
    additions = (
        ('hutSmokeFull', 1329, 16),
        ('hutSmokePartial', 1385, 16),
    )
    final_index = first_index + sum(count for _, _, count in additions)
    new_height = ((final_index + columns - 1) // columns) * cell
    pixels = bytearray(width * new_height * 4)
    pixels[:len(old_pixels)] = old_pixels

    palette = inputs['pal0-c.dat']
    alpha = inputs['al0-c.dat']
    fx_palette = b''.join(
        palette[alpha[(value | 15) * 256] * 4:alpha[(value | 15) * 256] * 4 + 3]
        + bytes([(value & 15) * 17])
        for value in range(256)
    )
    effects = sprites(inputs['hfx0-0.dat'], fx_palette, alpha=True)
    index = first_index
    for name, start, count in additions:
        entries = []
        for source in range(start, start + count):
            w, h, data = effects[source]
            assert w <= cell and h <= cell
            x = (index % columns) * cell
            y = (index // columns) * cell
            for row in range(h):
                begin = ((y + row) * width + x) * 4
                pixels[begin:begin + w * 4] = data[row * w * 4:(row + 1) * w * 4]
            entries.append({'index': index, 'w': w, 'h': h, 'source': source})
            index += 1
        metadata['animations'][name] = entries

    metadata['height'] = new_height
    # Existing metadata values and indices are immutable in this append-only mode.
    for key, value in old_metadata.items():
        if key == 'height':
            continue
        if key == 'animations':
            for name, sequence in value.items():
                assert metadata['animations'][name] == sequence
        else:
            assert metadata[key] == value

    png(effects_path, width, new_height, pixels)
    metadata_path.write_text(json.dumps(metadata, separators=(',', ':')))
    check_width, check_height, check_pixels = read_owned_rgba_png(effects_path)
    assert (check_width, check_height) == (width, new_height)
    assert check_pixels[:len(old_pixels)] == old_pixels
    print(
        f'Appended original hut occupancy smoke HFX1329-1344/HFX1385-1400 at '
        f'atlas indices {first_index}-{index - 1}; preserved {width}x{old_height} existing pixels.'
    )


def main():
    source = Path(sys.argv[1]); project = Path(__file__).resolve().parents[1]
    if '--hut-smoke-only' in sys.argv[2:]:
        if sys.argv[2:] != ['--hut-smoke-only']:
            raise ValueError('Usage: import-original.py GAME_ROOT --hut-smoke-only')
        append_hut_smoke_effects(source, project)
        return
    if '--training-huts-only' in sys.argv[2:]:
        if sys.argv[2:] != ['--training-huts-only']:
            raise ValueError('Usage: import-original.py GAME_ROOT --training-huts-only')
        append_training_hut_models(source, project)
        return
    if '--vehicles-only' in sys.argv[2:]:
        if sys.argv[2:] != ['--vehicles-only']:
            raise ValueError('Usage: import-original.py GAME_ROOT --vehicles-only')
        append_vehicle_models(source, project)
        return
    if '--units-only' in sys.argv[2:]:
        if sys.argv[2:] != ['--units-only']:
            raise ValueError('Usage: import-original.py GAME_ROOT --units-only')
        append_shaman_units(source, project)
        return
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
    alpha=read('data/al0-c.dat');assert len(alpha)==65536
    rules=json.loads((project/'app/original-rules.json').read_text())
    png(output/'atlas.png', 256, 1024, object_texture(object_atlas(atlas,palette,alpha,rules['objectTextureAlpha'])))
    objects, faces, points = [read(f'objects/{n}0-{object_bank}.dat') for n in ['objs','facs','pnts']]
    shape_data=read('objects/shapes.dat')
    (project/'app/original-shapes.json').write_text(json.dumps(building_shapes(shape_data,objects,read('data/smoke.txt')),separators=(',',':'))+'\n')
    assert len(objects)%54 == len(faces)%60 == len(points)%6 == 0
    models, topology = {}, {}
    # Models actually used in this mission, including every hut family, upgrade and all four tribe colors.
    selected = [5,13,14,15,16,17,18,30,45,152,153,154,155,79,80,81,82,*range(83,87),*range(91,107),*range(107,143)]
    animation_tiles = read('data/anibl0-0.dat')
    assert len(animation_tiles) == 500
    fire = animation_tiles[20:40] # ANIBL record 1, consumed by 0x4f0f60.
    assert 0 < fire[17] <= 12
    (project/'app/original-fire.json').write_text(json.dumps(dict(model=5,tile=fire[16],frames=list(fire[4:4+fire[17]])),indent=2)+'\n')
    for i in selected:
        models[i], topology[i] = decode_original_model(objects, faces, points, i)
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
    def frame_layers(frame):
        layers=[];element=frames[frame][0];visited=set()
        while element:
            assert element<len(elements) and element not in visited;visited.add(element)
            pos,x,y,flags,element=elements[element]
            assert pos%6==0 and 0<pos//6<=len(bank)
            piece=pos//6-1
            layers.append({'piece':piece,'x':x,'y':y,'flags':flags})
        return layers
    metadata = {}; rendered = []; source_frames = []; cache = {}; source_cache = {}
    def animation(team,kind,start,reuse=False):
        directions=[]
        for direction in range(8):
            frame,mirror=starts[start+direction]; cycle=[]; seen=set()
            while frame not in seen:
                assert 0<frame<len(frames);seen.add(frame)
                key=(frame,team,kind)
                if reuse and frame in source_cache:index=source_cache[frame]
                else:
                    if key not in cache:cache[key]=len(rendered);rendered.append(frame_layers(frame));source_frames.append(frame)
                    index=cache[key];source_cache.setdefault(frame,index)
                cycle.append(index);frame=frames[frame][-1]
            directions.append({'frames':cycle,'flip':bool(mirror),'source':start+direction})
        return directions
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
                metadata[f'{team}-{kind}'][state]=animation(team,kind,start)
    # Append new native poses after established frame/piece slots. Existing
    # standing/action fixtures retain their exact indices and original RGBA.
    used=sorted({layer['piece'] for layers in rendered for layer in layers})
    for signature,states in metadata.items():
        team,kind=signature.split('-')
        model=1 if team=='wild' else {'brave':2,'warrior':3,'shaman':7}[kind]
        obj=rules['personAnimationObjects'][2*9+model]
        start=rules['animationObjects'][obj][0]+(8 if kind=='shaman' and team=='red' else 0)
        states['launch']=animation(team,kind,start)
    used+=sorted({layer['piece'] for layers in rendered for layer in layers}-set(used))
    # Encounter recoil and standing gestures append after existing launch poses;
    # established animation and piece indices remain stable.
    for signature,states in metadata.items():
        team,kind=signature.split('-')
        if team=='wild' or kind=='shaman':continue
        for state,start in [('stagger',128),('idleShift',384),('idleLook',392),('idleScratch',400)]:
            states[state]=animation(team,kind,start)
    used+=sorted({layer['piece'] for layers in rendered for layer in layers}-set(used))
    for signature,states in metadata.items():
        team,kind=signature.split('-')
        model=1 if team=='wild' else {'brave':2,'warrior':3,'shaman':7}[kind]
        obj=rules['personAnimationObjects'][27*9+model]
        start=rules['animationObjects'][obj][0]+(8 if kind=='shaman' and team=='red' else 0)
        states['electrocution']=animation(team,kind,start)
    used+=sorted({layer['piece'] for layers in rendered for layer in layers}-set(used))
    # Preserve every established frame and piece index, then append model 4.
    for team in ['blue','red']:
        kind='preacher';signature=f'{team}-{kind}'
        states={'walk':40,'idle':48,'selected':64,'work':88,'chop':104,'attack':120,'strike':104,'special':200,'recoil':112,'pray':144,'carry':72,'carryIdle':80,'airborne':152,'die':312,'drown':416,'dance':96,'preachStart':160,'preach':168}
        metadata[signature]={state:animation(team,kind,start,True) for state,start in states.items()}
        obj=rules['personAnimationObjects'][2*9+4]
        metadata[signature]['launch']=animation(team,kind,rules['animationObjects'][obj][0],True)
        for state,start in [('stagger',128),('idleShift',384),('idleLook',392),('idleScratch',400)]:
            metadata[signature][state]=animation(team,kind,start,True)
        obj=rules['personAnimationObjects'][27*9+4]
        metadata[signature]['electrocution']=animation(team,kind,rules['animationObjects'][obj][0],True)
    # Firewarrior is new to the browser roster, so append it after every
    # previously reviewed frame index instead of shifting native fixtures.
    for team in ['blue','red']:
        kind='firewarrior';signature=f'{team}-{kind}'
        states={'walk':40,'idle':48,'selected':64,'work':88,'chop':104,'attack':120,'strike':104,'special':200,'recoil':112,'pray':144,'carry':72,'carryIdle':80,'airborne':152,'die':312,'drown':416,'dance':96,'idleGesture':728}
        metadata[signature]={state:animation(team,kind,start) for state,start in states.items()}
        obj=rules['personAnimationObjects'][2*9+6]
        metadata[signature]['launch']=animation(team,kind,rules['animationObjects'][obj][0])
        for state,start in [('stagger',128),('idleShift',384),('idleLook',392),('idleScratch',400)]:
            metadata[signature][state]=animation(team,kind,start)
        obj=rules['personAnimationObjects'][27*9+6]
        metadata[signature]['electrocution']=animation(team,kind,rules['animationObjects'][obj][0])
    # Spy reuses the already imported VFRA frames and VELE layers. Draw descriptor
    # 17 selects its person variant without growing or reindexing the reviewed atlas.
    for team in ['blue','red']:
        kind='spy';signature=f'{team}-{kind}'
        states={'walk':40,'idle':48,'selected':64,'work':88,'chop':104,'attack':120,'strike':104,'special':200,'recoil':112,'pray':144,'carry':72,'carryIdle':80,'airborne':152,'die':312,'drown':416,'dance':96,'idleGesture':728}
        metadata[signature]={state:animation(team,kind,start,True) for state,start in states.items()}
        obj=rules['personAnimationObjects'][2*9+5]
        metadata[signature]['launch']=animation(team,kind,rules['animationObjects'][obj][0],True)
        for state,start in [('stagger',128),('idleShift',384),('idleLook',392),('idleScratch',400)]:
            metadata[signature][state]=animation(team,kind,start,True)
        obj=rules['personAnimationObjects'][27*9+5]
        metadata[signature]['electrocution']=animation(team,kind,rules['animationObjects'][obj][0],True)
    # Keep raw pieces: the original scales offsets and rectangles separately,
    # and enables/disables layers at draw time (including standing shadows).
    used+=sorted({layer['piece'] for layers in rendered for layer in layers}-set(used))
    piece_index={source:i for i,source in enumerate(used)}
    cell=1
    while cell<max(max(bank[i][:2]) for i in used):cell*=2
    width=cell*32;height=((len(used)+31)//32)*cell;pixels=bytearray(width*height*4)
    pieces=[]
    for i,piece_source in enumerate(used):
        w,h,data=bank[piece_source];pieces.append({'source':piece_source,'w':w,'h':h})
        x=i%32*cell;y=i//32*cell
        for row in range(h):pixels[((y+row)*width+x)*4:((y+row)*width+x+w)*4]=data[row*w*4:(row+1)*w*4]
    png(output/'unit-layers.png',width,height,pixels)
    info=[{'source':source_frames[i],'nativeWidth':frames[source_frames[i]][1],'nativeHeight':frames[source_frames[i]][2],
        'layers':[{**layer,'piece':piece_index[layer['piece']]} for layer in layers]} for i,layers in enumerate(rendered)]
    (project/'app/original-units.json').write_text(json.dumps({'atlas':'unit-layers','width':width,'height':height,'cell':cell,'columns':32,'fps':12,'frameCounts':frame_counts,'frames':info,'pieces':pieces,'animations':metadata},separators=(',',':')))
    hfx_data=read('data/hfx0-0.dat');hfx=sprites(hfx_data,palette)
    # 0x476570: HFX high nibble selects an AL0 colour, low nibble is 0..15 alpha.
    fx_palette=b''.join(palette[alpha[(v|15)*256]*4:alpha[(v|15)*256]*4+3]+bytes([(v&15)*17]) for v in range(256))
    effects=sprites(hfx_data,fx_palette,alpha=True)
    # 0x4673b0 draws type-1 objects from HFX, including the small trail particles.
    # Trail draw type 1 uses the ordinary palette; the Blast head uses nibble alpha.
    fx_sequences={'impact':(1099,9),'smoke':(1224,16),'sparkle':(1288,16),'hit':(1294,6),'splash':(1304,16),'lightning':(1361,8),'birth':(1441,16),'blastShot':(0x460,8),'blastTrail':(0x13a,8),'spellTrail':(0x142,8),'log':(23,1),'halo':(1466,12),'haloShadow':(70,1),'buildingSmoke':(1345,16),'unitShadow':(22,1)}
    fx_frames=[];fx_meta={};cell=256
    for name,(start,count) in fx_sequences.items():
        fx_meta[name]=[]
        for i in range(start,start+count):
            w,h,data=(hfx if name in ('blastTrail','spellTrail','log','haloShadow','unitShadow') else effects)[i];assert w<=cell and h<=cell
            fx_meta[name].append({'index':len(fx_frames),'w':w,'h':h,'source':i});fx_frames.append((w,h,data))
    fw=2048;fh=((len(fx_frames)+7)//8)*cell;pixels=bytearray(fw*fh*4)
    for i,(w,h,data) in enumerate(fx_frames):
        x=i%8*cell;y=i//8*cell
        for row in range(h):pixels[((y+row)*fw+x)*4:((y+row)*fw+x+w)*4]=data[row*w*4:(row+1)*w*4]
    png(output/'effects.png',fw,fh,pixels)
    # 0x46b294 selects AL0; 0x516270 derives the halo's vertex tint from it.
    halo_color=list(palette[alpha[0x2f82]*4:alpha[0x2f82]*4+3])
    smoke_color=list(palette[alpha[7*4096+0x2f82]*4:alpha[7*4096+0x2f82]*4+3])
    (project/'app/original-effects.json').write_text(json.dumps({'width':fw,'height':fh,'haloColor':halo_color,'buildingSmokeColor':smoke_color,'animations':fx_meta},separators=(',',':')))
    data=read('levels/constant.dat')
    if data[:2]==b'@~':data=b'  '+bytes((~(v^(1<<((i-3)&7))))&255 for i,v in enumerate(data))[2:]
    constants={}
    for k,v in re.findall(r'^\s*P3CONST_(\S+)\s*=\s*(-?\d+)',data.decode('ascii'),re.M):constants.setdefault(k,int(v))
    assert constants['LIFE_BRAVE']==1000 and constants['BRAVE_SPEED']==70
    (project/'app/original-constants.json').write_text(json.dumps(constants,indent=2)+'\n')
    icons={'selection':53,'blast':355,'lightning':356,'bridge':365,'brave':666,'warrior':668,'firewarrior':672,'shaman':664,'buildings':676,'spells':678,'followers':680,'gold':712,'hut':1028,'tower':1029,'camp':1030,'temple':1032}
    for name,i in icons.items():png(output/(name+'.png'),*hfx[i])
    png(output/'portrait.png',*bank[6879])
    for name,w,h,gray in [('bigf0-c.dat',256,1152,False),('disp0-c.dat',256,256,True),('watdisp.dat',256,256,True)]:
        data=read('data/'+name);assert len(data)==w*h
        rgba=b''.join((bytes([(v+128)%256]*3) if gray else palette[v*4:v*4+3])+b'\xff' for v in data)
        png(output/({'bigf0-c.dat':'land-colours','disp0-c.dat':'land-detail','watdisp.dat':'water-detail'}[name]+'.png'),w,h,rgba)
    for sky_bank,suffix in [('c',''),('d','-d')]:
        for layer,dst in [('1','clouds'),('2','clouds-high'),('b','sky')]:
            data=read(f'data/d3d/dsky0-{sky_bank}{layer}.png');(output/f'{dst}{suffix}.png').write_bytes(data)
    sky_g=read('data/sky0-g.dat');palette_g=read('data/pal0-g.dat')
    assert len(sky_g)==512*512 and len(palette_g)==1024
    # 0x4306d0 averages each 4x4 RGB block before 004b60d0 creates the 128px type-1 texture.
    sky_g_rgba=bytearray()
    for y in range(128):
        for x in range(128):
            colors=[palette_g[sky_g[(y*4+dy)*512+x*4+dx]*4:][:3] for dy in range(4) for dx in range(4)]
            sky_g_rgba.extend(sum(color[channel] for color in colors)>>4 for channel in range(3));sky_g_rgba.append(255)
    png(output/'sky-g.png',128,128,sky_g_rgba)
    lens=read('data/skylens.dat');assert len(lens)==81*26*8
    (project/'app/original-skylens.json').write_text(json.dumps(list(struct.unpack('<4212i',lens)),separators=(',',':'))+'\n')
    terrain=[read('data/'+name) for name in ['pal0-c.dat','bigf0-c.dat','cliff0-c.dat','disp0-c.dat','fade0-c.dat']]
    assert list(map(len,terrain))==[1024,294912,8192,65536,16384]
    (output/'landscape.bin').write_bytes(b''.join(terrain))
    waves=read('data/watdisp.dat');assert len(waves)==65536
    (output/'waves.bin').write_bytes(waves)
    unit_atlas_hash=hashlib.sha256((output/'unit-layers.png').read_bytes()).hexdigest()
    (output/'provenance.json').write_text(json.dumps({'landscapeBank':12,'requestedObjectBank':requested_bank,'objectBank':object_bank,'modelIds':selected,'sourceFrames':len(bank),'animationFrames':len(rendered),'spritePieces':len(pieces),'unitAtlasSha256':unit_atlas_hash,'sha256':hashes},indent=2)+'\n')
    append_shaman_units(source, project)
    append_vehicle_models(source, project)
    print(f'Validated {len(models)} models, {len(bank)} sprites, {len(rendered)} layered animation frames, {len(icons)} UI tiles and level-one landscape bank c.')

if __name__=='__main__':main()
