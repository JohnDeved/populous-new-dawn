"""Verify Balloon Hut and Balloon descriptors in the supplied native executable."""

import hashlib
import json
import struct
import sys
from pathlib import Path

EXPECTED = "3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f"


def main() -> None:
    executable = Path(sys.argv[1])
    blob = executable.read_bytes()
    sha256 = hashlib.sha256(blob).hexdigest()
    assert sha256 == EXPECTED, sha256

    pe = struct.unpack_from("<I", blob, 60)[0]
    count = struct.unpack_from("<H", blob, pe + 6)[0]
    optional = struct.unpack_from("<H", blob, pe + 20)[0]
    base = struct.unpack_from("<I", blob, pe + 52)[0]
    sections = [
        struct.unpack_from("<8sIIII", blob, pe + 24 + optional + index * 40)
        for index in range(count)
    ]

    def read(address: int, size: int) -> bytes:
        rva = address - base
        for _, _virtual_size, virtual, raw_size, raw in sections:
            if virtual <= rva and rva + size <= virtual + raw_size:
                return blob[raw + rva - virtual : raw + rva - virtual + size]
        raise ValueError(hex(address))

    def building(model: int) -> dict:
        raw = read(0x5A7228 + model * 76, 76)
        return {
            "model": model,
            "vehicleModel": raw[49],
            "capacity": raw[32],
            "supportHeight": struct.unpack_from("<h", raw, 38)[0],
            "flags": struct.unpack_from("<I", raw, 72)[0],
        }

    def vehicle(model: int) -> dict:
        raw = read(0x5A7938 + model * 23, 23)
        return {
            "model": model,
            "raw": raw.hex(),
            "capacity": raw[8],
            "passengerLayout": raw[9],
            "landedState": raw[10],
            "occupiedState": raw[11],
            "restHeight": struct.unpack_from("<h", raw, 13)[0],
            "productionWork": struct.unpack_from("<h", raw, 19)[0],
            "flags": struct.unpack_from("<H", raw, 21)[0],
        }

    buildings = [building(15), building(16)]
    vehicles = [vehicle(3), vehicle(4)]
    assert [item["vehicleModel"] for item in buildings] == [3, 4]
    assert vehicles[0] == {**vehicles[1], "model": 3}
    assert (
        vehicles[0]["capacity"],
        vehicles[0]["passengerLayout"],
        vehicles[0]["landedState"],
        vehicles[0]["occupiedState"],
        vehicles[0]["restHeight"],
        vehicles[0]["productionWork"],
        vehicles[0]["flags"],
    ) == (2, 2, 2, 4, 560, 1000, 1)
    print(json.dumps({"executableSha256": sha256, "buildings": buildings, "vehicles": vehicles}))


if __name__ == "__main__":
    main()
