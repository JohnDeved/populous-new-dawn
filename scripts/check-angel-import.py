"""Independent Angel byte/decoder/atlas preflight. Never executes original code."""
from pathlib import Path
import hashlib
import importlib.util
import json
import struct
import argparse

REPO = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("game", type=Path)
GAME = parser.parse_args().game
PINS = json.loads((REPO / "scripts/angel-inputs.json").read_text())


def sha(value):
    return hashlib.sha256(value).hexdigest()


def canonical(value):
    return json.dumps(value, separators=(",", ":"), sort_keys=True).encode()


def load_decoder():
    spec = importlib.util.spec_from_file_location("decoder", REPO / "scripts/import-original.py")
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    return decoder


decoder = load_decoder()
pins = dict(PINS["inputSha256"])
provenance = json.loads((REPO / "public/original/provenance.json").read_text())
for name in ("data/pal0-c.dat", "data/al0-c.dat", "data/bl320-c.dat"):
    pins[name] = provenance["sha256"][name]
raw = {}
for name, digest in pins.items():
    raw[name] = (GAME / name).read_bytes()
    assert sha(raw[name]) == digest, name

exe = (GAME / "d3dpoptb.exe").read_bytes()
assert sha(exe) == "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f"
pe = int.from_bytes(exe[0x3C:0x40], "little")
assert exe[pe:pe + 4] == b"PE\0\0"
sections = pe + 24 + int.from_bytes(exe[pe + 20:pe + 22], "little")
tile_table = None
for i in range(int.from_bytes(exe[pe + 6:pe + 8], "little")):
    section = sections + i * 40
    size, rva, disk_size, disk = struct.unpack_from("<4I", exe, section + 8)
    if rva <= 0x1AA218 < rva + min(size, disk_size):
        at = disk + 0x1AA218 - rva
        tile_table = exe[at:at + 256]
assert tile_table is not None and len(tile_table) == 256

dataset = {"bases": {}, "points": {}, "cycles": {}, "tribeTiles": [162, 170]}
models = []
for bank in (2, 6):
    objects, faces, points = (raw[f"objects/{kind}0-{bank}.dat"] for kind in ("objs", "facs", "pnts"))
    for model in range(62, 79):
        record = objects[model * 54:(model + 1) * 54]
        count = int.from_bytes(record[2:4], "little", signed=True)
        point_count = int.from_bytes(record[4:6], "little", signed=True)
        first_face = int.from_bytes(record[16:20], "little") - 1
        first_point = int.from_bytes(record[24:28], "little") - 1
        face_bytes = faces[first_face * 60:(first_face + count) * 60]
        point_bytes = points[first_point * 6:(first_point + point_count) * 6]
        assert point_count == 87 and len(point_bytes) == 522
        triples = [list(struct.unpack_from("<hhh", point_bytes, k * 6)) for k in range(87)]
        if bank == 2:
            dataset["points"][str(model)] = triples
        else:
            assert triples == dataset["points"][str(model)]
        base = model in (62, 69)
        assert count == (111 if base else 157)
        order = []
        independently_decoded = {
            "p": [], "uv": [], "scale": int.from_bytes(record[12:16], "little", signed=True),
            "faces": [], "tiles": [], "normals": [], "modes": [], "biases": [],
            "panelHeight": int(int.from_bytes(record[40:42], "little", signed=True) / 2),
        }
        assert independently_decoded["scale"] == 160
        remapped_faces = 0
        for face in range(count):
            f = face_bytes[face * 60:(face + 1) * 60]
            corner_count = f[6]
            ids = [int.from_bytes(f[40 + k * 2:42 + k * 2], "little", signed=True) for k in range(4)]
            assert corner_count in (3, 4)
            assert all(0 <= index < 87 for index in ids[:corner_count])
            tile = int.from_bytes(f[2:4], "little", signed=True)
            if not base:
                assert tile == -1 and f[7] == 0
                continue
            assert 0 <= tile < 256
            assert bool(tile_table[tile] & 1) == (tile in (162, 170))
            remapped_faces += int(bool(tile_table[tile] & 1))
            d = independently_decoded
            d["faces"].extend((corner_count, f[59]))
            d["tiles"].append(tile)
            d["modes"].append(f[7])
            d["biases"].append(-int.from_bytes(record[6:7], "little", signed=True)
                               - int.from_bytes(f[58:59], "little", signed=True))
            d["normals"].append([-1] * 4 if f[4] & 1 else [
                int.from_bytes(f[48 + k * 2:50 + k * 2], "little", signed=True) for k in range(4)
            ])
            for corner in ((0, 1, 2) if corner_count == 3 else (0, 1, 2, 0, 2, 3)):
                index = ids[corner]
                order.append(index)
                x, y, z = triples[index]
                d["p"].extend((round(x / 480, 6), round(y / 480, 6), round(-z / 480, 6)))
                u = int.from_bytes(f[8 + corner * 8:12 + corner * 8], "little", signed=True)
                v = int.from_bytes(f[12 + corner * 8:16 + corner * 8], "little", signed=True)
                d["uv"].extend((round((tile % 8 + u / 2097152) / 8, 7),
                                round(1 - (tile // 8 + v / 2097152) / 32, 7)))
        if base:
            decoded, (scale, imported_order) = decoder.decode_original_model(objects, faces, points, model)
            assert decoded == independently_decoded and imported_order == order
            assert len(order) == 471 and remapped_faces == 73 and scale == 160
            candidate = {"model": decoded, "pointIndices": order, "morph": record[7]}
            if bank == 2:
                dataset["bases"][str(model)] = candidate
            else:
                assert candidate == dataset["bases"][str(model)]
        models.append({"bank": bank, "id": model, "pointsSha256": sha(point_bytes),
                       "facesSha256": sha(face_bytes), "semanticObjectSha256": sha(record[:16] + record[32:])})
for i in range(17):
    a, b = models[i], models[i + 17]
    assert all(a[k] == b[k] for k in ("pointsSha256", "facesSha256", "semanticObjectSha256"))

assert raw["objects/morph0-2.dat"] == raw["objects/morph0-6.dat"]
for morph, base, first_key in ((4, 62, 63), (5, 69, 70)):
    record = raw["objects/morph0-2.dat"][morph * 368:(morph + 1) * 368]
    assert struct.unpack_from("<ii", record) == (base, 6)
    keys = list(struct.unpack_from("<6i", record, 8))
    lengths = list(struct.unpack_from("<6i", record, 88))
    assert keys == list(range(first_key, first_key + 6)) and lengths == [1] * 6
    dataset["cycles"][str(morph)] = {
        "base": base, "lastFrame": 11,
        "segments": [{"from": keys[i], "to": keys[(i + 1) % 6], "first": i * 2,
                      "last": i * 2 + 1, "duration": 2} for i in range(6)],
    }

rules = json.loads((REPO / "app/original-rules.json").read_text())
width, height, atlas = decoder.read_owned_rgba_png(REPO / "public/original/atlas.png")
assert (width, height) == (256, 1024)
pixels = decoder.object_texture(decoder.object_atlas(
    raw["data/bl320-c.dat"], raw["data/pal0-c.dat"], raw["data/al0-c.dat"], rules["objectTextureAlpha"]))
assert pixels == atlas

# Independently reconstruct each used tile from palette data, including alpha and
# ordered transparent-edge expansion. No atlas or other tracked file is written.
used = sorted({tile for base in dataset["bases"].values() for tile in base["model"]["tiles"]}
              | set(range(163, 167)) | set(range(171, 175)))
tile_hashes = {}
for tile in used:
    raw_tile = bytearray()
    for y in range(32):
        for x in range(32):
            value = raw["data/bl320-c.dat"][(tile // 8 * 32 + y) * 256 + tile % 8 * 32 + x]
            if rules["objectTextureAlpha"][tile]:
                alpha = (value & 15) * 17
                color = raw["data/al0-c.dat"][(value | 15) * 256] if alpha else 0
            else:
                color, alpha = value, 255 if value else 0
            rgb = raw["data/pal0-c.dat"][color * 4:color * 4 + 3] if color or alpha else b"\0\0\0"
            raw_tile.extend((component // 16 * 17 for component in rgb))
            raw_tile.append(alpha)
    for vertical in (False, True):
        for line in range(32):
            previous = (line if vertical else line * 32) * 4
            old = bytes(raw_tile[previous:previous + 4])
            for position in range(1, 32):
                current = ((position * 32 + line) if vertical else (line * 32 + position)) * 4
                new = bytes(raw_tile[current:current + 4])
                if not any(old) and any(new):
                    raw_tile[previous:previous + 3] = new[:3]
                elif any(old) and not any(new):
                    raw_tile[current:current + 3] = old[:3]
                previous, old = current, new
    actual = b"".join(atlas[((tile // 8 * 32 + y) * 256 + tile % 8 * 32) * 4:
                           ((tile // 8 * 32 + y) * 256 + tile % 8 * 32 + 32) * 4]
                      for y in range(32))
    assert raw_tile == actual, tile
    tile_hashes[str(tile)] = sha(actual)

actual = json.loads((REPO / "app/original-angel.json").read_text())
metadata = actual.pop("provenance")
assert actual == dataset, "Imported Angel data differs from independent byte decoding"
assert metadata["inputSha256"] == PINS["inputSha256"]
assert metadata["exeSha256"] == sha(exe)
assert metadata["decoderSha256"] == sha((REPO / "scripts/import-original.py").read_bytes())
assert metadata["textureFlags"] == {"address": "005aa218", "sha256": sha(tile_table)}
assert metadata["resourceSha256"] == {
    str(model["id"]): {"object": model["semanticObjectSha256"],
                       "faces": model["facesSha256"], "points": model["pointsSha256"]}
    for model in models if model["bank"] == 2
}
assert sha((REPO / "public/original/atlas.png").read_bytes()) == PINS["modelAtlasSha256"]
assert sha(atlas) == PINS["modelAtlasRgbaSha256"]
assert tile_hashes == PINS["tileRgbaSha256"]
print(json.dumps({"status": "passed", "originalCodeExecuted": False,
                  "baseModels": 2, "rawPointModels": 17, "banks": [2, 6],
                  "verifiedPaletteTiles": len(tile_hashes),
                  "datasetSha256": sha((REPO / "app/original-angel.json").read_bytes()),
                  "verifierSha256": sha(Path(__file__).read_bytes())}, indent=2))
