"""Compare browser panel pixels against source art and executable draw traces."""
from decomp import ROOT

def check_panel_pixels(exe, frames, cases, height_correction=lambda c: 0):
    import base64, importlib.util, io
    from PIL import Image, ImageDraw
    spec = importlib.util.spec_from_file_location('assets', ROOT/'scripts/import-original.py')
    assets = importlib.util.module_from_spec(spec); spec.loader.exec_module(assets)
    palette = (exe.parent/'data/pal0-c.dat').read_bytes()
    bank = assets.sprites((exe.parent/'data/hfx0-0.dat').read_bytes(), palette)
    compared = 0
    for frame in frames:
        c = frame['state']; assert c in cases
        expected = Image.new('RGBA', (c['expected']['width'], c['expected']['height'] + height_correction(c)))
        for event in c['expected']['events']:
            layer = Image.new('RGBA', expected.size)
            if event[0] == 'sprite':
                _, sprite, x, y, tint, faded = event
                w,h,data = bank[sprite]; data = bytearray(data)
                for at in range(0,len(data),4):
                    if tint >= 0: data[at:at+3] = palette[tint*4:tint*4+3]
                    if data[at+3]: data[at+3] = 85 if faded else 170 if sprite == 52 else 255
                layer.alpha_composite(Image.frombytes('RGBA',(w,h),bytes(data)), (x,y))
            else:
                kind,color,(left,top,right,bottom),*opacity = event
                if kind == 'line': right=max(left+1,right); bottom=max(top+1,bottom)
                if right <= left or bottom <= top: continue
                rgba=tuple(palette[color*4:color*4+3])+(opacity[0] if opacity else 255,)
                ImageDraw.Draw(layer).rectangle((left,top,right-1,bottom-1),fill=rgba)
            expected.alpha_composite(layer)
        actual = Image.open(io.BytesIO(base64.b64decode(frame['png']))).convert('RGBA')
        assert actual.size == expected.size
        # Canvas premultiplication can round a translucent color by one byte.
        differences = [abs(a-b) for a,b in zip(actual.tobytes(),expected.tobytes())]
        assert max(differences) <= 1, (c, max(differences))
        compared += actual.width*actual.height
    print(f'PASS: {len(frames)} browser canvases, {compared:,} RGBA pixels match source HFX and native draw submissions (one-byte alpha rounding tolerance)')
