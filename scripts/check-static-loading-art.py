#!/usr/bin/env python3
"""Check original loading-mask, caller and resource-error evidence without execution.

python3 -B scripts/check-static-loading-art.py --data-root /path/to/original-game
Add --output /path/to/new-directory for the full byte report and mask previews.
Uses the existing sibling PE32 reader, Capstone 5, and Pillow for optional previews.
No current-directory, Git-head, scratch snapshot or native emulator dependency.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys

EXE_SHA256 = '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
LANGUAGE_SHA256 = 'e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d'
ASSETS = {
    'loadlogo.dat': ('4e4c1c3eda079427d744dd102695b717a08261ca20f461c1e9efb7357c6fce87', {0, 255}),
    'loadlog2.dat': ('ef0b112f4fa1d357637380f287e5f517538dd79eff75b1b42b2c0955e9d61a56', {0, 254, 255}),
}

# These are the original 26-check proof's instruction expectations, not regenerated
# guessed pseudocode. Keep their semantics and original four windows inspectable.
MASK_BYTES = {
    0x522c6c: 'be02000000',            # usual two-byte destination step
    0x522c7f: 'be01000000',            # alternate one-byte step (store stays word)
    0x522cd1: 'c744242802000000',      # two buffer passes, not a percentage
    0x522d09: '8a842430010000',        # show argument is read as one byte
    0x522d10: '83f801',
    0x522d42: 'a1b4339700',            # localized string pointer
    0x522e40: '2d82000000',            # screen width minus 130
    0x522e56: '2da1000000',            # screen height minus 161
    0x522ea5: '8b15e8d85c00',          # loaded mask pointer
    0x522ec9: '81fb82000000',          # 130 source bytes per row
    0x522ee9: '803a00',                # any nonzero, not separate FE/FF colors
    0x522eee: '66c701ffff',            # literal native white-word store
    0x522ef5: '42',                    # one source-byte advance
    0x522ef7: '3915ecd85c00',          # stop at loaded end pointer
    0x5231c0: '807c2404011ac0fec050e831faffff',  # byte boolean -> 00522c00
}
ORIGINAL_WINDOWS = ((0x522c00, 0x56b), (0x5231c0, 0x13),
                    (0x4a4560, 0x26), (0x49bdf0, 0x50))

# Narrow additional trace: actual resource-loading callers and plain-file errors.
# Branch bytes deliberately retain their destinations, not just mnemonic names.
CALLER_BYTES = {
    0x4a4966: 'a002f08800',            # interface_state_3
    0x4a4971: '83f8017417',            # == 1 -> initialization branch
    0x4a49a2: '6a01e817e80700',        # show before load_files
    0x4a49ac: 'e8bf52f8ff',            # call 00429c70
    0x4a4a00: 'e86b5df8ff',            # call load_hspr 0042a770
    0x4a4a08: '6a03e8d1e0f9ff',        # set interface_state_3 to 3
    0x4a4b2a: '803d01f088000a0f84f3010000',  # state_2==10 -> clear branch
    0x4a4b37: '803d02f08800050f84e6010000',  # state_3==5 -> same branch
    0x4a4b44: '803d02f08800040f84d9010000',  # state_3==4 -> same branch
    0x4a4d2a: '6a00e88fe40700',        # clear-only request
    0x429cc5: '6a01e8f4940f00',        # palette/resource load refreshes show
    0x4a27d4: '6a01e8e5090800',        # another palette-update caller, not progress
    0x4a457a: 'e8f1090000',            # main_3 -> init_all 004a4f70
    0x4a5018: '6870345a00e8ce6dffff',  # startup array 005a3470 -> 0049bdf0
    0x4a5022: '83c404a1f8ef8700a324df5900',  # return discarded, not tested
    0x49bdf8: '803e21',                # resource-array ! terminator
    0x49be00: '81c620010000',          # descriptor stride 0x120
    0x49be06: 'e8a5000000',            # descriptor load
    0x49be0e: '84c0750232db',          # failed descriptor accumulates false
    0x49be14: '803e2175e4',            # continue through remaining entries
    0x49bee1: 'f6871a01000001744f',    # flag0 selects plain-file object
    0x49bf6b: 'c70640f65800',          # plain-file object vtable
    0x49bfb0: 'e8cbb30800',            # load_sprite_internal 00527380
    0x49bfb8: '85c00f85c9000000',      # nonzero error skips publication
    0x49bfc0: 'b301',                  # success flag only after accepted load
    0x49bfce: '8b50048911',            # publish buffer pointer
    0x49c027: '899716010000',          # publish loaded byte count
    0x49c085: '03c28901',              # end pointer = buffer + length
    0x5273c3: 'e8886e0000',            # open file helper
    0x5273c8: '85c0741f',              # open success == 0
    0x5273d8: 'b8ffffffff',            # open failure returns -1
    0x5273f2: 'e859ffffff',            # virtual-load wrapper 00527350
    0x527376: 'ff500c',                # plain-file vtable +0xc -> 0052adf0
    0x52ae11: 'ff5014',                # requested file length
    0x52ae16: '85db750c',              # zero length rejected
    0x52ae1a: 'b8ffffffff',
    0x52ae26: '53e804b8ffff',          # allocate exactly requested bytes
    0x52ae31: '85ed750c',              # allocation failure rejected
    0x52ae35: 'b8ffffffff',
    0x52ae41: '538bce558b06ff5008',    # read requested length into new buffer
    0x52ae4a: '3bc37415',              # short read rejected
    0x52ae4e: '55e8fcb7ffff',          # free temporary buffer on short read
    0x52ae57: 'b8ffffffff',
    0x52ae63: '33c0896f045d895f08',    # success publishes data/size, returns 0
}
ADDED_WINDOWS = (
    (0x4a4960, 0x132), (0x4a4b2a, 0x27), (0x4a4d2a, 0x0d),
    (0x429c70, 0x75), (0x4a27d0, 0x14), (0x4a5018, 0x17),
    (0x49beb0, 0x1ec), (0x527350, 0x30), (0x527380, 0x9b), (0x52adf0, 0x80),
)


class ProofFailure(Exception):
    """Inputs or expected original bytes do not match the published proof."""


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_reader():
    location = Path(__file__).resolve().with_name('check-static-mission18-sky.py')
    spec = importlib.util.spec_from_file_location('loading_art_pe32', location)
    if spec is None or spec.loader is None:
        raise ProofFailure('Existing sibling PE32 reader is unavailable')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, location


def prove(data_root: Path, exe_path: Path) -> tuple[dict, dict[str, bytes]]:
    import capstone
    if capstone.__version__.split('.')[0] != '5':
        raise ProofFailure('Use the existing Capstone 5 environment')
    reader, reader_path = load_reader()
    exe_bytes = exe_path.read_bytes()
    if digest(exe_bytes) != EXE_SHA256:
        raise ProofFailure('Canonical D3D executable SHA-256 mismatch')
    pe = reader.PE32(exe_path)
    checks: list[str] = []

    def equal(actual, expected, label):
        if actual != expected:
            raise ProofFailure(f'{label}: expected {expected!r}, got {actual!r}')
        checks.append(label)

    inputs, masks = [], {}
    for name, (expected, values) in ASSETS.items():
        raw = (data_root / 'data' / name).read_bytes()
        equal(digest(raw), expected, name + ' canonical SHA')
        equal(len(raw), 130 * 161, name + ' native dimensions')
        equal(set(raw), values, name + ' byte values')
        masks[name] = bytes(255 if value else 0 for value in raw)
        inputs.append(dict(path='data/' + name, size=len(raw), sha256=expected,
                           nonzero=sum(value != 0 for value in raw), maskSHA=digest(masks[name])))
    equal(pe.cstr(0x5a3b30), 'data\\loadlog2.dat', 'default resource path')
    descriptor = pe.read(0x5a3b30, 0x120)
    for address in (0x5cd8e8, 0x5cd8ec):
        equal(struct.pack('<I', address) in descriptor, True, 'descriptor buffer target ' + hex(address))
    for address, expected in MASK_BYTES.items():
        equal(pe.read(address, len(bytes.fromhex(expected))).hex(), expected,
              'original instruction ' + hex(address))
    equal(pe.read(0x4a4573, 7).hex(), 'c6053c3b5a0033', 'font11 path[12] becomes3')
    language = (data_root / 'language/lang00.dat').read_bytes()
    names = language.decode('utf-16-le').split('\0')
    equal(names[515], 'Loading...', 'localized loading text index515')
    historical_checks = len(checks)
    if historical_checks != 26:
        raise ProofFailure('Historical mask check count changed unexpectedly')

    # Strengthened portable input validation; historical receipt stays unchanged.
    equal(digest(language), LANGUAGE_SHA256, 'canonical language identity')
    equal(pe.u32(0x5a3b30 + 0x10e), 0x5cd8e8, 'descriptor exact data destination')
    equal(pe.u32(0x5a3b30 + 0x112), 0x5cd8ec, 'descriptor exact end destination')
    equal(pe.u32(0x5a3b30 + 0x116), 0, 'descriptor initial requested size')
    equal(struct.unpack('<H', pe.read(0x5a3b30 + 0x11a, 2))[0], 0, 'plain-file flags')
    paths = [pe.cstr(0x5a3470 + i * 0x120) for i in range(8)]
    equal(paths, ['data\\point0-0.dat', '*PALETTE', '*FADE_PALETTE', '*BIT_MASKS',
                  'wld_back_DUMMY', '*isl_back_DUMMY', 'data\\loadlog2.dat', '!'],
          'startup resource array includes mask then terminator')
    equal(pe.u32(0x58f640 + 0x0c), 0x52adf0, 'plain-file vtable loader')
    for address, expected in CALLER_BYTES.items():
        equal(pe.read(address, len(bytes.fromhex(expected))).hex(), expected,
              'caller/resource instruction ' + hex(address))
    # The first condition is in the retained main_3 window, not inferred solely
    # from the filename-changing store.
    equal(pe.read(0x4a456a, 9).hex(), '833d6abc89000b7507', 'font-mode11 condition')

    decoder = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
    windows = []
    for address, length in ORIGINAL_WINDOWS + ADDED_WINDOWS:
        raw = pe.read(address, length)
        windows.append(dict(address=f'{address:08x}', size=length, sha256=digest(raw),
                            instructions=[dict(va=f'{i.address:08x}', bytes=i.bytes.hex(),
                                               text=i.mnemonic + ' ' + i.op_str)
                                          for i in decoder.disasm(raw, address)]))
    result = dict(
        at=datetime.now(timezone.utc).isoformat(), status='PASS_STATIC_LOADING_ART',
        checks=len(checks), historicalMaskChecks=historical_checks, checkLabels=checks,
        exeSHA=EXE_SHA256, sourceSHA=digest(Path(__file__).read_bytes()),
        readerSHA=digest(reader_path.read_bytes()), languageSHA=digest(language),
        toolVersion=capstone.__version__, inputs=inputs, windows=windows,
        descriptor=dict(address='005a3b30', flags=0, dataDestination='005cd8e8',
                        endDestination='005cd8ec', array='005a3470', index=6, paths=paths),
        decoder='130x161 row-major byte mask; zero is skipped, any nonzero reaches FFFF word store.',
        layout='Normal centered origin with truncation toward zero; original text and512x384 branches retained.',
        callers=dict(showBeforeResources='004a49a4', resourceRefresh='00429cc7',
                     clearStateBranch='004a4d2c', runtimeRoutine='004a4960',
                     flags='interface_state_3==1: show/resources/set3; state_2==10 or state_3==4/5: clear'),
        resourceErrors='Open/zero-length/allocation/short-read failure returns error; descriptor success alone publishes buffer/end; array accumulates failure but init_all call004a501d does not inspect AL.',
        limits=[
            'Static original bytes and selected callers only; no native execution, interception, GPU pixels or integrated loading check.',
            'No complete enumeration of indirect callers, all mission/error lifecycles, or runtime retry/allocation-error behavior.',
            'No percentage/progress metric, prescribed fade duration, artificial delay or mission-specific artwork is established.',
            'Exact font metrics, text shadow/palette roles, alternate one-byte destination raster and512x384 compatibility composition remain unvalidated.',
            'loadlogo is a supplied related mask, not the default filename caller; font_type11 names loadlog3, whose availability is not checked.',
            'Optional PNGs visualize the decoded nonzero mask, not a reconstruction of the original loading screen.',
        ],
    )
    return result, masks


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-root', type=Path, required=True)
    parser.add_argument('--exe', type=Path, help='Defaults to DATA_ROOT/d3dpoptb.exe; canonical SHA still required')
    parser.add_argument('--output', type=Path, help='New directory only; report and two research mask PNGs')
    args = parser.parse_args()
    try:
        if args.output and args.output.exists():
            raise ProofFailure('Preserve old evidence; output directory already exists')
        result, masks = prove(args.data_root, args.exe or args.data_root / 'd3dpoptb.exe')
        if args.output:
            from PIL import Image
            args.output.mkdir(parents=True, exist_ok=False)
            for name, mask in masks.items():
                Image.frombytes('L', (130, 161), mask).save(args.output / (name + '.mask.png'))
            (args.output / 'report.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
        summary = {key: value for key, value in result.items() if key not in ('windows', 'checkLabels')}
        print(json.dumps(summary, indent=2))
        return 0
    except (OSError, ValueError, ImportError, IndexError, struct.error, ProofFailure) as error:
        print(f'FAIL_STATIC_LOADING_ART: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
