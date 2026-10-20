"""Import only Angel bases, raw morph points and cycles from verified static data.

Usage: python3 scripts/import-angel.py /path/to/game [--check]
Never runs the original game/installer or writes any shared atlas/model catalog.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
PINS = json.loads((ROOT / "scripts/angel-inputs.json").read_text())


def sha(data):
    return hashlib.sha256(data).hexdigest()


def checked(path, expected):
    data = path.read_bytes()
    if sha(data) != expected:
        raise ValueError("Unexpected source hash: " + str(path))
    return data


def tile_flags(exe):
    pe = struct.unpack_from("<I", exe, 0x3C)[0]
    assert exe[pe:pe + 4] == b"PE\0\0"
    count = struct.unpack_from("<H", exe, pe + 6)[0]
    start = pe + 24 + struct.unpack_from("<H", exe, pe + 20)[0]
    for index in range(count):
        size, rva, disk_size, disk = struct.unpack_from("<4I", exe, start + index * 40 + 8)
        if rva <= 0x1AA218 and 0x1AA218 + 256 <= rva + min(size, disk_size):
            at = disk + 0x1AA218 - rva
            return exe[at:at + 256]
    raise ValueError("Missing original texture flag table")


def generate(game):
    raw = {name: checked(game / name, expected)
           for name, expected in PINS["inputSha256"].items()}
    flags = tile_flags(checked(game / "d3dpoptb.exe", PINS["exeSha256"]))
    checked(ROOT / "scripts/import-original.py", PINS["decoderSha256"])
    spec = importlib.util.spec_from_file_location("angel_model_decoder", ROOT / "scripts/import-original.py")
    decoder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(decoder)
    result = {"bases": {}, "points": {}, "cycles": {}, "tribeTiles": [162, 170]}
    resource_hashes = {}
    for bank in (2, 6):
        objects, faces, points = (raw[f"objects/{kind}0-{bank}.dat"] for kind in ("objs", "facs", "pnts"))
        for model in range(62, 79):
            record = objects[model * 54:(model + 1) * 54]
            count, point_count = struct.unpack_from("<hh", record, 2)
            first_face = struct.unpack_from("<I", record, 16)[0] - 1
            first_point = struct.unpack_from("<I", record, 24)[0] - 1
            assert point_count == 87 and count == (111 if model in (62, 69) else 157)
            face_bytes = faces[first_face * 60:(first_face + count) * 60]
            point_bytes = points[first_point * 6:(first_point + point_count) * 6]
            assert len(face_bytes) == count * 60 and len(point_bytes) == 522
            hashes = {"object": sha(record[:16] + record[32:]),
                      "faces": sha(face_bytes), "points": sha(point_bytes)}
            coordinates = [list(struct.unpack_from("<3h", point_bytes, offset))
                           for offset in range(0, 522, 6)]
            if bank == 2:
                resource_hashes[str(model)] = hashes
                result["points"][str(model)] = coordinates
            else:
                assert hashes == resource_hashes[str(model)], "Angel bank mismatch"
                assert coordinates == result["points"][str(model)]
            if model in (62, 69):
                data, (scale, order) = decoder.decode_original_model(objects, faces, points, model)
                assert scale == 160 and len(order) == 471 and all(0 <= i < 87 for i in order)
                assert sum(tile in (162, 170) for tile in data["tiles"]) == 73
                assert all(bool(flags[tile] & 1) == (tile in (162, 170)) for tile in data["tiles"])
                base = {"model": data, "pointIndices": order, "morph": record[7]}
                if bank == 2:
                    result["bases"][str(model)] = base
                else:
                    assert base == result["bases"][str(model)]
            else:
                assert all(face_bytes[f * 60 + 7] == 0 and
                           struct.unpack_from("<h", face_bytes, f * 60 + 2)[0] == -1
                           for f in range(count)), "Morph keys must remain untextured data"
    assert raw["objects/morph0-2.dat"] == raw["objects/morph0-6.dat"]
    for morph, base, first in ((4, 62, 63), (5, 69, 70)):
        record = raw["objects/morph0-2.dat"][morph * 368:(morph + 1) * 368]
        assert struct.unpack_from("<ii", record) == (base, 6)
        keys = list(struct.unpack_from("<6i", record, 8))
        lengths = list(struct.unpack_from("<6i", record, 88))
        assert keys == list(range(first, first + 6)) and lengths == [1] * 6
        result["cycles"][str(morph)] = {
            "base": base, "lastFrame": 11,
            "segments": [{"from": keys[i], "to": keys[(i + 1) % 6], "first": i * 2,
                          "last": i * 2 + 1, "duration": 2} for i in range(6)],
        }
    result["provenance"] = {
        "exeSha256": PINS["exeSha256"],
        "decoderSha256": PINS["decoderSha256"],
        "inputSha256": PINS["inputSha256"],
        "banks": [2, 6],
        "resourceSha256": resource_hashes,
        "textureFlags": {"address": "005aa218", "sha256": sha(flags)},
        "scope": "Static data only. Compatibility-c atlas is reused unchanged; authored mission palettes and full Angel controller parity are not claimed.",
    }
    return (json.dumps(result, separators=(",", ":"), sort_keys=True) + "\n").encode()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("game", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    generated = generate(args.game)
    output = ROOT / "app/original-angel.json"
    if args.check:
        if output.read_bytes() != generated:
            raise ValueError("Angel import differs; no files were written")
        print("Verified original Angel data; no files written.")
    else:
        output.write_bytes(generated)
        print("Imported only original-angel.json; shared atlases and models unchanged.")


if __name__ == "__main__":
    main()
