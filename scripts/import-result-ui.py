#!/usr/bin/env python3
"""Import the bounded original result-statistics panel and Western F00T3 font.

Usage: python3 scripts/import-result-ui.py GAME_ROOT [--output PROJECT_ROOT]
Writes only public/original/result-{panel,font}.png and app/original-result-ui.json.
Uses the existing sprites/png decoder definitions, never the broad importer main.
All inputs are hash-pinned; the Windows executable is read only as static PE data.
Source-palette reconstruction, not a native GPU capture. See metadata boundaries.
"""
import argparse
import ast
import hashlib
import json
from pathlib import Path
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    'd3dpoptb.exe': '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
    'data/pal0-c.dat': '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53',
    'data/hfx0-0.dat': '681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf',
    'data/f00t3-0.dat': '148658bb22b8a42f892719d0f0b814ccb9cfcb260f8e6f1ea60475bec90b9af0',
    'language/lang00.dat': 'e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_decoder(path):
    source = path.read_text()
    definitions = [node for node in ast.parse(source).body
                   if isinstance(node, ast.FunctionDef) and node.name in ('sprites', 'png')]
    if len(definitions) != 2 or {node.name for node in definitions} != {'sprites', 'png'}:
        raise ValueError('Existing sprite/PNG decoder definitions not found')
    namespace = {'struct': struct, 'zlib': zlib}
    exec(compile(ast.Module(body=definitions, type_ignores=[]), str(path), 'exec'), namespace)
    fingerprints = {node.name: sha(ast.get_source_segment(source, node).encode())
                    for node in definitions}
    return namespace['sprites'], namespace['png'], fingerprints


class StaticPE:
    """Minimal address-to-file reader; never loads or executes the PE image."""
    def __init__(self, data):
        self.data = data
        if data[:2] != b'MZ':
            raise ValueError('Expected DOS header')
        pe = struct.unpack_from('<I', data, 0x3c)[0]
        if data[pe:pe+4] != b'PE\0\0':
            raise ValueError('Expected PE signature')
        sections = struct.unpack_from('<H', data, pe+6)[0]
        optional_size = struct.unpack_from('<H', data, pe+20)[0]
        optional = pe+24
        if struct.unpack_from('<H', data, optional)[0] != 0x10b:
            raise ValueError('Expected PE32')
        self.base = struct.unpack_from('<I', data, optional+28)[0]
        self.sections = []
        for i in range(sections):
            at = optional+optional_size+i*40
            _, rva, size, offset = struct.unpack_from('<4I', data, at+8)
            self.sections.append((rva, size, offset))

    def read(self, address, size):
        rva = address-self.base
        for start, length, offset in self.sections:
            if start <= rva and rva+size <= start+length:
                result = self.data[offset+rva-start:offset+rva-start+size]
                if len(result) == size:
                    return result
        raise ValueError(f'Address outside file-backed PE data: {address:08x}')

    def wide(self, address):
        data = bytearray()
        for i in range(256):
            code = self.read(address+i*2, 2)
            if code == b'\0\0':
                return data.decode('utf-16le')
            data.extend(code)
        raise ValueError('Unterminated bounded UTF-16 string')


def copy_frame(canvas, width, frame, x, y):
    w, h, pixels = frame
    for row in range(h):
        start = ((y+row)*width+x)*4
        canvas[start:start+w*4] = pixels[row*w*4:(row+1)*w*4]


def build(inputs, sprites, decoder_hashes):
    pe = StaticPE(inputs['d3dpoptb.exe'])
    language = inputs['language/lang00.dat'].decode('utf-16le').split('\0')
    palette = inputs['data/pal0-c.dat']
    if len(palette) != 1024:
        raise ValueError('Expected 256 four-byte palette entries')
    hfx = sprites(inputs['data/hfx0-0.dat'], palette, alpha=False)
    font = sprites(inputs['data/f00t3-0.dat'], palette, alpha=False)
    if len(font) != 224 or any(hfx[i][:2] != (16, 16) for i in range(1450, 1463)):
        raise ValueError('Unexpected result sprite metrics')

    def width(text):
        if any(not 32 <= ord(c) <= 255 for c in text):
            raise ValueError('Only source-bound Western glyph indices are supported')
        return sum(font[ord(c)-32][0] for c in text)

    rows = []
    expected_gaps = [1, 0, 1, 0, 0, 0, 1, 0, 0, 1]
    for i in range(10):
        label, counter, group = struct.unpack('<HbB', pe.read(0x5add30+i*4, 4))
        if (label, counter, group) != (741+i, i, expected_gaps[i]):
            raise ValueError('Unexpected native statistics descriptor')
        rows.append({'labelId': label, 'label': language[label],
                     'counterIndex': counter, 'groupBefore': bool(group)})
    if pe.read(0x5add58, 2) != b'\0\0':
        raise ValueError('Missing statistics descriptor sentinel')

    formats = {name: pe.wide(address) for name, address in {
        'player': 0x5dddbc, 'status': 0x5dddac, 'time': 0x5ddd74,
        'counterSeparator': 0x5ddd54, 'counterReserveText': 0x5ddd5c,
        'timeReserveText': 0x59c8ec, 'missionTitle': 0x5d4784,
    }.items()}
    expected_formats = {'player': '%s %d.', 'status': '%s: %s',
                        'time': ':  %2.2ld:%2.2ld:%2.2ld', 'counterSeparator': ': ',
                        'counterReserveText': ': 22:22:22', 'timeReserveText': ' 22:22:22 ',
                        'missionTitle': '%02d : %s'}
    if formats != expected_formats:
        raise ValueError(f'Unexpected native text formats: {formats!r}')
    titles, title_sources = {}, {}
    # Existing, separately reviewed 004c3c40 title formatter and dispatch data.
    # This reads exact case bytes, not counter producers or dialog controllers.
    for mission in range(1, 24):
        slot = pe.read(0x4c3fb4+mission-1, 1)[0]
        target = struct.unpack('<I', pe.read(0x4c3f00+slot*4, 4))[0]
        case = pe.read(target, 10)
        if case[0] != 0xbe or case[5] != 0xba:
            raise ValueError('Unexpected mission title dispatch case')
        number, label = struct.unpack('<I', case[1:5])[0], struct.unpack('<I', case[6:10])[0]
        if number != mission:
            raise ValueError('Unexpected native mission title number')
        title = formats['missionTitle'] % (number, language[label])
        titles[str(mission)] = title
        title_sources[str(mission)] = {'languageId': label, 'caseAddress': f'{target:08x}',
                                       'width': width(title)}
    tutorial_slot = pe.read(0x4c3fb4+79-1, 1)[0]
    tutorial_target = struct.unpack('<I', pe.read(0x4c3f00+tutorial_slot*4, 4))[0]
    if tutorial_target != 0x4c3e75:
        raise ValueError('Unexpected Tutorial 79 dispatch')

    aw, ah = font[ord('A')-32][:2]
    tw, th = hfx[1462][:2]
    iw, ih = hfx[1028][:2]
    max_label = max(width(row['label']) for row in rows)
    colon, time_reserve = width(':'), width(formats['timeReserveText'])
    line, gap, top, bottom = ah-1, ah*5//16+2, th//2, aw//2
    cw = max(max_label+colon+time_reserve, 5*iw+4*aw)+2*tw
    ch = 14*line+4*gap+2*(top+bottom)+line//2+ih
    columns, tile_rows = (cw+tw-1)//tw, (ch+th-1)//th
    pw, ph = columns*tw, tile_rows*th
    dx, dy = (pw-cw)//2, (ph-ch)//2
    heading_y = dy+top
    time_y = heading_y+3*line+line//2
    label_x, value_x = dx+tw, dx+tw+max_label+colon
    y = time_y+line
    for row in rows:
        y += gap if row['groupBefore'] else 0
        row['y'] = y
        y += line
    layout = {'panelWidth': pw, 'panelHeight': ph, 'contentWidth': cw, 'contentHeight': ch,
              'contentInset': [dx, dy], 'columns': columns, 'rows': tile_rows,
              'headingY': heading_y, 'playerY': heading_y+line, 'statusY': heading_y+2*line,
              'timeY': time_y, 'labelX': label_x, 'valueColonX': value_x,
              'lineHeight': line, 'groupGap': gap, 'promptY': ph+line//4,
              'maxLabelWidth': max_label, 'colonWidth': colon, 'timeReserveWidth': time_reserve,
              'counterSeparatorWidth': width(formats['counterSeparator']),
              'counterValueStartX': value_x+width(formats['counterSeparator']),
              'counterReserveWidth': width(formats['counterReserveText'])}
    if (pw, ph, heading_y, time_y, label_x, value_x) != (384, 368, 13, 76, 17, 277):
        raise ValueError('Native layout differs from reviewed English 640x480 contract')
    panel = bytearray(pw*ph*4)
    tile_map = []
    for row in range(tile_rows):
        tile_line = []
        for column in range(columns):
            if row == 0:
                frame = 1450 if column == 0 else 1451 if column == columns-1 else 1454+(column%2 == 0)
            elif row == tile_rows-1:
                frame = 1452 if column == 0 else 1453 if column == columns-1 else 1456+(column%2 == 0)
            elif column == 0:
                frame = 1458+((columns-1)%2 == 0)
            elif column == columns-1:
                frame = 1460+((columns-1)%2 == 0)
            else:
                frame = 1462
            copy_frame(panel, pw, hfx[frame], column*tw, row*th)
            tile_line.append(frame)
        tile_map.append(tile_line)
    cell_w, cell_h = max(f[0] for f in font), max(f[1] for f in font)
    fw, fh = cell_w*16, cell_h*14
    atlas = bytearray(fw*fh*4)
    rects = []
    for index, frame in enumerate(font):
        w, h, pixels = frame
        x, y = index%16*cell_w, index//16*cell_h
        copy_frame(atlas, fw, frame, x, y)
        rects.append({'x': x, 'y': y, 'w': w, 'h': h, 'advance': w,
                      'codepoint': index+32, 'rgbaSha256': sha(pixels)})
    labels = {name: language[i] for name, i in {
        'player': 287, 'status': 735, 'completed': 736, 'failed': 737,
        'ongoing': 738, 'aborted': 739, 'time': 740, 'spacePrompt': 250,
    }.items()}
    runtime = {'version': 1, 'panelUrl': '/original/result-panel.png',
               'fontUrl': '/original/result-font.png', 'layout640': layout,
               'nativeRows': rows, 'labels': labels, 'formats': formats, 'titles': titles,
               'font': {'width': fw, 'height': fh, 'cellWidth': cell_w, 'cellHeight': cell_h,
                        'firstCodepoint': 32, 'rects': rects},
               'provenance': {
                   'inputs': {name: {'sha256': EXPECTED[name], 'bytes': len(data)}
                              for name, data in inputs.items()},
                   'decoderFunctionsSha256': decoder_hashes,
                   'consumers': {'renderer': '00523fa0', 'layout': '0042b940',
                                 'panelTiles': '00523d40', 'fontSelection': '0042bde0',
                                 'rowTable': '005add30', 'missionTitle': '004c3c40'},
                   'fontSource': 'data/f00t3-0.dat', 'fontSlot': 3, 'fontPointer': '0087cbdc',
                   'paletteSource': 'data/pal0-c.dat',
                   'panelFrames': {str(i): {'width': hfx[i][0], 'height': hfx[i][1],
                                            'rgbaSha256': sha(hfx[i][2])} for i in range(1450, 1463)},
                   'panelTileMap': tile_map, 'titleSources': title_sources,
                   'tutorial79': {'dispatchTarget': '004c3e75',
                                  'fallbackBuffer': '009fd108 + (level << 8)',
                                  'nativeValueEstablished': False},
                   'pixelPolicy': 'Source palette RGB, literal RLE pixels alpha255, skipped pixels transparent; exact source glyph advances without added kerning, tracking or shadow.',
                   'limits': [
                       'Static English normal-resolution source reconstruction, not an original GPU screenshot.',
                       'Panel flag8 uses current vertex tint; its entry value is unproved. Source pixels are unmodulated pal0-c RGB, not live mission tint or GPU quantization/filter/blend parity.',
                       'Native small-resolution font4 switch is not imported; responsive normal-font scaling is a browser adaptation.',
                       'This is the general statistics overlay with outcome-sensitive status. Native activation/input are not established.',
                       'Statistics labels/order/format are proved; counter producers and browser equivalents are not. Unsupported values require explicit unavailable markers.',
                       'No Tutorial 79 dynamic name value is proved; literal Tutorial is an explicit browser fallback.',
                       'Native reward row data, cursor changes, Space destination and blinking cadence are not established.',
                   ],
               }}
    return runtime, (pw, ph, panel), (fw, fh, atlas)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game_root', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT)
    parser.add_argument('--decoder', type=Path, default=ROOT/'scripts/import-original.py')
    args = parser.parse_args()
    files = {}
    for path in sorted(args.game_root.rglob('*')):
        if path.is_file():
            name = path.relative_to(args.game_root).as_posix().lower()
            if name in EXPECTED:
                if name in files:
                    raise ValueError(f'Ambiguous case-insensitive source: {name}')
                files[name] = path
    inputs = {}
    # Validate all pinned inputs, decode and verify geometry before any output write.
    for name, expected in EXPECTED.items():
        if name not in files:
            raise ValueError(f'Missing source: {name}')
        data = files[name].read_bytes()
        if sha(data) != expected:
            raise ValueError(f'Source hash mismatch: {name}')
        inputs[name] = data
    sprites, png, decoder_hashes = load_decoder(args.decoder)
    runtime, panel, font = build(inputs, sprites, decoder_hashes)
    public = args.output/'public/original'
    public.mkdir(parents=True, exist_ok=True)
    (args.output/'app').mkdir(parents=True, exist_ok=True)
    for name, frame in [('result-panel.png', panel), ('result-font.png', font)]:
        png(public/name, *frame)
        runtime['provenance'].setdefault('outputs', {})[name] = {
            'sha256': sha((public/name).read_bytes()), 'rgbaSha256': sha(frame[2]),
            'width': frame[0], 'height': frame[1]}
    (args.output/'app/original-result-ui.json').write_text(json.dumps(runtime, indent=2)+'\n')
    print('Imported result panel 384x368, 224 F00T3 glyphs, ten native row descriptors and mission titles 1-23.')


if __name__ == '__main__':
    main()
