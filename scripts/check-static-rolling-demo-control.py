#!/usr/bin/env python3
"""Hash-bound Rolling Demo control and GP/CP framing proof. No target execution.

Requires Python 3.9+ and Capstone 5.0.7. Reuses the locked PE reader and prior
snapshot identities. Source-map identities deliberately remain unresolved.
"""
from pathlib import Path
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import struct
import sys

HERE = Path(__file__).resolve().parent
READER_SHA = '74dd55ab6d811f0f0d870c94eb404d2c06915bf96232b6dc39c25f19ceee6da2'
PRIOR_SHA = '598dd207893cbbf328981426cfd790a82ef4d9028fdf6a6be83a7fd772a14f20'
ACTIVE = [1, 5, 2, 6, 3]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_locked(name, filename, digest):
    path = HERE / filename
    if sha(path.read_bytes()) != digest:
        raise ValueError(f'Changed dependency: {filename}')
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def frame_stream(data, trailer_size):
    """Read only the observed outer <signed turn, signed size, type, aux> frames.

    Payloads remain opaque; this is not a replay decoder. Stop on turn -1,
    regardless of remaining sentinel bytes (the shipped CP sentinels differ).
    Reject malformed/truncated framing; do not imitate unsafe original reads.
    """
    position = 0
    records = []
    while position + 8 <= len(data):
        turn, size, kind, auxiliary = struct.unpack_from('<ihBB', data, position)
        position += 8
        if turn == -1:
            if len(data) - position != trailer_size:
                raise ValueError('Unexpected bytes after stream sentinel')
            return records, data[position:]
        if turn < 0 or size < 0 or position + size > len(data):
            raise ValueError('Invalid turn or payload length')
        if records and turn < records[-1]['turn']:
            raise ValueError('Decreasing stream turn')
        records.append({'turn': turn, 'size': size, 'type': kind, 'auxiliary': auxiliary})
        position += size
    raise ValueError('Missing complete stream sentinel')


# [start, endExclusive) original-byte windows, including branches around claims.
WINDOWS = {
    0x004194f0: 0x00419505,
    0x004b36e0: 0x004b3911,
    0x004b2700: 0x004b28c5,
    0x004b4770: 0x004b47a1,
    0x004b3920: 0x004b3ed0,
    0x004b3ed0: 0x004b4012,
    0x004a9d90: 0x004aa100,
    0x004aa1c0: 0x004aa4e0,
    0x004b28d0: 0x004b2b2e,
    0x004b2d20: 0x004b2e29,
    0x00442f40: 0x004430f5,
    0x00442a60: 0x00442ad2,
    0x004a5985: 0x004a59bc,
    0x004b4020: 0x004b407c,
    0x004b41bd: 0x004b4225,
    0x004a4737: 0x004a4776,
    0x0043e890: 0x0043e8d6,
    0x004b3510: 0x004b357d,
    0x004af0a0: 0x004af1b2,
    0x0049cfa0: 0x0049cfb9,
}

EXPECTED = [
    (0x004194f0, 'and', 'dword ptr [0x89c661], 0xfdffffff'),
    (0x004194fa, 'and', 'dword ptr [0x89c661], 0xfbffffff'),
    # Start admission, saved caller state, mode and success/failure
    (0x004b36e0, 'test', 'byte ptr [0x98f746], 0x21'),
    (0x004b36e8, 'jne', '0x4b390f'),
    (0x004b370f, 'mov', 'word ptr [0x98f74a], cx'),
    (0x004b3718, 'mov', 'al, byte ptr [0x89d161]'),
    (0x004b3721, 'mov', 'dword ptr [0x98f712], eax'),
    (0x004b3726, 'mov', 'byte ptr [0x98f750], dl'),
    (0x004b372c, 'mov', 'byte ptr [0x89d161], 0xe'),
    (0x004b3737, 'call', '0x4b30e0'),
    (0x004b3741, 'je', '0x4b3753'),
    (0x004b3743, 'or', 'byte ptr [0x98f746], 0x20'),
    (0x004b374a, 'or', 'byte ptr [0x98f746], 4'),
    (0x004b3753, 'mov', 'dword ptr [0x59d110], 0'),
    (0x004b38c3, 'mov', 'al, byte ptr [0x98f712]'),
    (0x004b38d1, 'mov', 'byte ptr [0x89d161], al'),
    (0x004b38d6, 'call', '0x49cfa0'),
    (0x004b38e5, 'cmp', 'eax, 2'),
    (0x004b38ea, 'cmp', 'eax, 3'),
    (0x004b38ef, 'push', '7'),
    (0x004b38f1, 'call', '0x442a60'),
    (0x004b38f9, 'mov', 'byte ptr [0x98f750], 0'),
    # GP and CP file names, header reads and snapshot-relative origin
    (0x004b28ec, 'push', '0x5ce06c'),
    (0x004b28f2, 'push', '0x5ce060'),
    (0x004b28f8, 'call', '0x55b450'),
    (0x004b2974, 'call', '0x526280'),
    (0x004b2989, 'or', 'byte ptr [0x98f747], 2'),
    (0x004b2990, 'test', 'byte ptr [0x98f746], 1'),
    (0x004b2997, 'je', '0x4b2a1f'),
    (0x004b29bc, 'push', '-8'),
    (0x004b29bf, 'call', '0x5263b0'),
    (0x004b29d7, 'push', '4'),
    (0x004b29d9, 'push', '0x98f70a'),
    (0x004b29df, 'call', '0x526580'),
    (0x004b29f7, 'push', '4'),
    (0x004b29f9, 'push', '0x98f70e'),
    (0x004b29ff, 'call', '0x526580'),
    (0x004b2a39, 'push', '8'),
    (0x004b2a3b, 'push', '0x98f658'),
    (0x004b2a41, 'call', '0x526580'),
    (0x004b2b11, 'test', 'byte ptr [0x98f746], 1'),
    (0x004b2b18, 'jne', '0x4b2b24'),
    (0x004b2b1a, 'mov', 'eax, dword ptr [0x89d188]'),
    (0x004b2b1f, 'mov', 'dword ptr [0x98f70a], eax'),
    (0x004b2d72, 'push', '0x5ce070'),
    (0x004b2d79, 'push', '0x5ce044'),
    (0x004b2d7f, 'call', '0x55b450'),
    (0x004b2dd5, 'call', '0x526280'),
    (0x004b2dea, 'or', 'byte ptr [0x98f747], 8'),
    (0x004b2e0b, 'push', '8'),
    (0x004b2e0d, 'push', '0x98f660'),
    (0x004b2e13, 'call', '0x526580'),
    # Playback owns command dispatch and consumes streams in simulation service
    (0x0043e890, 'test', 'byte ptr [0x98f746], 0x10'),
    (0x0043e89b, 'jne', '0x43e8d1'),
    (0x004a5985, 'cmp', 'byte ptr [0x89bb81], bl'),
    (0x004a598b, 'je', '0x4a59b4'),
    (0x004a598d, 'cmp', 'byte ptr [0x89bb81], 3'),
    (0x004a5994, 'je', '0x4a59b4'),
    (0x004a5996, 'call', '0x4b3920'),
    (0x004a599b, 'test', 'dword ptr [0x89c661], ebp'),
    (0x004a59ad, 'call', '0x4ec6f0'),
    (0x004b3926, 'mov', 'esi, dword ptr [0x89d188]'),
    (0x004b394f, 'test', 'byte ptr [0x98f746], 8'),
    (0x004b39ac, 'cmp', 'dword ptr [0x98f660], esi'),
    (0x004b39b2, 'jg', '0x4b39f3'),
    (0x004b39b4, 'call', '0x4b4020'),
    (0x004b39d1, 'push', '8'),
    (0x004b39d3, 'push', '0x98f660'),
    (0x004b39d9, 'call', '0x526580'),
    (0x004b3a2c, 'and', 'word ptr [0x98f746], 0xfff7'),
    (0x004b3a35, 'test', 'byte ptr [0x98f746], 0x10'),
    (0x004b3a42, 'call', '0x4b43f0'),
    (0x004b3a59, 'cmp', 'dword ptr [0x98f658], esi'),
    (0x004b3a5f, 'jg', '0x4b3b36'),
    (0x004b3a7e, 'movsx', 'ecx, word ptr [0x98f65c]'),
    (0x004b3a8e, 'call', '0x526580'),
    (0x004b3aa3, 'mov', 'al, byte ptr [0x98f65e]'),
    (0x004b3aa8, 'cmp', 'eax, 1'),
    (0x004b3aad, 'call', '0x4439d0'),
    (0x004b3ab2, 'cmp', 'eax, dword ptr [esp + 0x18]'),
    (0x004b3ab8, 'mov', 'bl, 1'),
    (0x004b3add, 'call', '0x43e8e0'),
    (0x004b3af1, 'mov', 'byte ptr [0x98f74f], 8'),
    (0x004b3b10, 'push', '8'),
    (0x004b3b12, 'push', '0x98f658'),
    (0x004b3b18, 'call', '0x526580'),
    (0x004b3b7b, 'call', '0x526370'),
    # CP framing and camera record fields (type10)
    (0x004b4026, 'cmp', 'word ptr [0x98f664], 0'),
    (0x004b403d, 'movsx', 'ecx, word ptr [0x98f664]'),
    (0x004b404d, 'call', '0x526580'),
    (0x004b4066, 'mov', 'al, byte ptr [0x98f666]'),
    (0x004b406b, 'dec', 'eax'),
    (0x004b406c, 'cmp', 'eax, 0xa'),
    (0x004b406f, 'ja', '0x4b4215'),
    (0x004b4075, 'jmp', 'dword ptr [eax*4 + 0x4b4228]'),
    (0x004b41bd, 'mov', 'cx, word ptr [esp + 4]'),
    (0x004b41c2, 'mov', 'al, byte ptr [0x98f667]'),
    (0x004b41c7, 'mov', 'dx, word ptr [esp + 6]'),
    (0x004b41cc, 'mov', 'byte ptr [0x98f708], al'),
    (0x004b41d1, 'mov', 'ax, word ptr [esp + 0xa]'),
    (0x004b41d6, 'mov', 'word ptr [0x98f700], cx'),
    (0x004b41dd, 'movsx', 'ecx, word ptr [esp + 8]'),
    (0x004b41e2, 'mov', 'word ptr [0x98f702], dx'),
    (0x004b41e9, 'mov', 'dword ptr [0x98f6fc], ecx'),
    (0x004b41ef, 'mov', 'word ptr [0x98f704], ax'),
    # Montage advancement, strict timeout and restart, stop and exhaustion
    (0x004b3d28, 'test', 'byte ptr [0x98f746], 0x20'),
    (0x004b3d40, 'lea', 'eax, [eax*4 + 0x98f66c]'),
    (0x004b3d49, 'cmp', 'edx, 3'),
    (0x004b3d4e, 'test', 'byte ptr [0x98f746], 0x10'),
    (0x004b3d55, 'je', '0x4b3d77'),
    (0x004b3d57, 'mov', 'ax, word ptr [eax + 2]'),
    (0x004b3d5b, 'cmp', 'ax, 1'),
    (0x004b3d5f, 'jle', '0x4b3d79'),
    (0x004b3d64, 'mov', 'edx, dword ptr [0x89d188]'),
    (0x004b3d6a, 'sub', 'edx, dword ptr [0x98f70a]'),
    (0x004b3d70, 'shr', 'edx, 4'),
    (0x004b3d73, 'cmp', 'edx, eax'),
    (0x004b3d75, 'jle', '0x4b3d79'),
    (0x004b3da7, 'inc', 'byte ptr [0x98f668]'),
    (0x004b3dad, 'cmp', 'byte ptr [0x98f668], al'),
    (0x004b3db3, 'jge', '0x4b3e47'),
    (0x004b3dcd, 'cmp', 'ecx, 1'),
    (0x004b3dd0, 'je', '0x4b3dde'),
    (0x004b3dd2, 'cmp', 'ecx, 2'),
    (0x004b3dd5, 'je', '0x4b3dfe'),
    (0x004b3dd7, 'cmp', 'ecx, 3'),
    (0x004b3dda, 'je', '0x4b3e1d'),
    (0x004b3dde, 'call', '0x4b2700'),
    (0x004b3dea, 'mov', 'byte ptr [0x89d161], al'),
    (0x004b3def, 'call', '0x49cfa0'),
    (0x004b3df7, 'call', '0x4b4770'),
    (0x004b3dfe, 'cmp', 'byte ptr [0x98f669], 1'),
    (0x004b3e0f, 'call', '0x4b30e0'),
    (0x004b3e22, 'mov', 'word ptr [0x98f748], ax'),
    (0x004b3e28, 'call', '0x4b3ed0'),
    (0x004b3e37, 'mov', 'byte ptr [0x98f74f], 8'),
    (0x004b3e63, 'call', '0x4b2700'),
    (0x004b3e6f, 'mov', 'byte ptr [0x89d161], al'),
    (0x004b3e74, 'call', '0x49cfa0'),
    (0x004b3e8d, 'push', '7'),
    (0x004b3e8f, 'call', '0x442a60'),
    # Next recording activation requires both stream loaders
    (0x004b3edc, 'call', '0x4b28d0'),
    (0x004b3ee6, 'je', '0x4b3f90'),
    (0x004b3ef4, 'call', '0x4b2d20'),
    (0x004b3efe, 'je', '0x4b3f90'),
    (0x004b3f04, 'or', 'byte ptr [0x98f746], 0x10'),
    (0x004b3f0b, 'or', 'byte ptr [0x98f746], 8'),
    (0x004b351f, 'call', '0x4b28d0'),
    (0x004b3529, 'je', '0x4b35cd'),
    (0x004b3537, 'call', '0x4b2d20'),
    (0x004b3541, 'je', '0x4b35cd'),
    (0x004b3547, 'or', 'byte ptr [0x98f746], 0x10'),
    (0x004b354e, 'or', 'byte ptr [0x98f746], 8'),
    # Keyboard and pointer interruption guards and consumed return
    (0x004a9d93, 'test', 'byte ptr [0x89c66c], 8'),
    (0x004a9d9c, 'je', '0x4a9da9'),
    (0x004a9f09, 'cmp', 'byte ptr [0x89bb81], 2'),
    (0x004a9f16, 'cmp', 'byte ptr [0x89bb81], 3'),
    (0x004a9f23, 'test', 'word ptr [0x98f746], 0x4010'),
    (0x004a9f2c, 'jne', '0x4aa088'),
    (0x004aa088, 'xor', 'eax, eax'),
    (0x004aa08a, 'test', 'ebx, ebx'),
    (0x004aa08c, 'je', '0x4aa0ed'),
    (0x004aa08e, 'test', 'byte ptr [0x98f746], 4'),
    (0x004aa095, 'je', '0x4aa0ed'),
    (0x004aa097, 'cmp', 'byte ptr [0x98f750], 3'),
    (0x004aa09e, 'je', '0x4aa0ed'),
    (0x004aa0a0, 'mov', 'dword ptr [0x59d110], eax'),
    (0x004aa0ab, 'call', '0x4b2700'),
    (0x004aa0b0, 'mov', 'al, byte ptr [0x98f712]'),
    (0x004aa0b7, 'mov', 'byte ptr [0x89d161], al'),
    (0x004aa0bc, 'call', '0x49cfa0'),
    (0x004aa0c4, 'call', '0x4b4770'),
    (0x004aa0c9, 'jmp', '0x4aa0ed'),
    (0x004aa1c3, 'test', 'byte ptr [0x89c66c], 8'),
    (0x004aa338, 'test', 'byte ptr [0x89c66c], 0x10'),
    (0x004aa33f, 'je', '0x4aa397'),
    (0x004aa343, 'test', 'ebx, ebx'),
    (0x004aa345, 'je', '0x4aa4cb'),
    (0x004aa34b, 'test', 'byte ptr [0x98f746], 4'),
    (0x004aa352, 'je', '0x4aa4cb'),
    (0x004aa358, 'cmp', 'byte ptr [0x98f750], 3'),
    (0x004aa35f, 'je', '0x4aa4cb'),
    (0x004aa365, 'mov', 'dword ptr [0x59d110], eax'),
    (0x004aa374, 'call', '0x4b2700'),
    (0x004aa379, 'mov', 'al, byte ptr [0x98f712]'),
    (0x004aa380, 'mov', 'byte ptr [0x89d161], al'),
    (0x004aa385, 'call', '0x49cfa0'),
    (0x004aa38d, 'call', '0x4b4770'),
    (0x004aa392, 'jmp', '0x4aa4cb'),
    # Shared cleanup and frontend request; restore clock-control bit
    (0x004b2700, 'test', 'byte ptr [0x98f747], 3'),
    (0x004b270a, 'je', '0x4b2723'),
    (0x004b270c, 'and', 'word ptr [0x98f746], 0xfcff'),
    (0x004b2715, 'mov', 'eax, dword ptr [0x98f650]'),
    (0x004b271b, 'call', '0x526370'),
    (0x004b2723, 'test', 'byte ptr [0x98f747], 0xc'),
    (0x004b272a, 'je', '0x4b2743'),
    (0x004b272c, 'and', 'word ptr [0x98f746], 0xf3ff'),
    (0x004b2735, 'mov', 'eax, dword ptr [0x98f654]'),
    (0x004b273b, 'call', '0x526370'),
    (0x004b2743, 'and', 'word ptr [0x98f746], 0xff03'),
    (0x004b2886, 'mov', 'edi, 0x98f6ec'),
    (0x004b289c, 'xor', 'eax, eax'),
    (0x004b289e, 'and', 'dword ptr [0x89c669], 0xffefffff'),
    (0x004b28a8, 'mov', 'ecx, 7'),
    (0x004b28ae, 'rep stosd', 'dword ptr es:[edi], eax'),
    (0x004b28b0, 'stosw', 'word ptr es:[edi], ax'),
    (0x004b28ba, 'or', 'byte ptr [0x98f747], 0x40'),
    (0x004b4770, 'movsx', 'eax, byte ptr [0x98f750]'),
    (0x004b4777, 'cmp', 'eax, 2'),
    (0x004b477a, 'jl', '0x4b478b'),
    (0x004b477c, 'cmp', 'eax, 3'),
    (0x004b477f, 'jg', '0x4b478b'),
    (0x004b4781, 'push', '7'),
    (0x004b4783, 'call', '0x442a60'),
    (0x004b478b, 'mov', 'byte ptr [0x98f750], 0'),
    (0x004b4792, 'and', 'dword ptr [0x89c665], 0xfbffffff'),
    (0x004b479c, 'jmp', '0x4194f0'),
    (0x00442a67, 'mov', 'cl, byte ptr [esp + 4]'),
    (0x00442a6b, 'cmp', 'cl, 7'),
    (0x00442a8d, 'test', 'cl, cl'),
    (0x00442a91, 'mov', 'byte ptr [0x88f001], cl'),
    (0x00442a97, 'mov', 'byte ptr [0x88f002], 5'),
    (0x00442a9e, 'mov', 'byte ptr [0x88f003], 0'),
    (0x00442ab0, 'cmp', 'byte ptr [0x88f001], 0'),
    (0x00442ab9, 'mov', 'al, byte ptr [0x88f001]'),
    (0x00442abe, 'mov', 'byte ptr [0x88f000], al'),
    (0x0049cfa4, 'not', 'al'),
    (0x0049cfa6, 'and', 'byte ptr [0x96ead4], al'),
    (0x0049cfae, 'mov', 'eax, dword ptr [0x5ca848]'),
    (0x0049cfb3, 'mov', 'dword ptr [0x5ca850], eax'),
    (0x004a4739, 'mov', 'al, byte ptr [0x88f000]'),
    (0x004a473e, 'sub', 'eax, 2'),
    (0x004a4748, 'mov', 'cl, byte ptr [eax + 0x4a4954]'),
    (0x004a474e, 'jmp', 'dword ptr [ecx*4 + 0x4a4938]'),
    (0x004a475c, 'call', '0x457a60'),
    # Pointer guard producer, immediate versus deferred input lock
    (0x004b3576, 'push', '0x20'),
    (0x004b3578, 'call', '0x4af0a0'),
    (0x004af0a7, 'cmp', 'byte ptr [0x5cdb78], 0'),
    (0x004af0b0, 'jne', '0x4af19c'),
    (0x004af0c0, 'and', 'dword ptr [0x89c669], 0xf7ffffff'),
    (0x004af0ca, 'or', 'dword ptr [0x89c6b1], eax'),
    (0x004af0d0, 'mov', 'eax, 0x10000000'),
    (0x004af0d5, 'test', 'dword ptr [0x89c669], eax'),
    (0x004af0db, 'jne', '0x4af1ac'),
    (0x004af0e1, 'or', 'dword ptr [0x89c669], eax'),
    (0x004af0ec, 'call', '0x526c10'),
    (0x004af0f8, 'mov', 'edi, 0x98e928'),
    (0x004af106, 'mov', 'edi, 0x984591'),
    (0x004af112, 'mov', 'edi, 0x984691'),
    (0x004af19c, 'or', 'dword ptr [0x89c669], 0x8000000'),
    (0x004af1a6, 'or', 'dword ptr [0x89c6b5], eax'),
    # Current writer lead is GAMNT version107 plus checksum, not an old RD producer
    (0x00442f6f, 'mov', 'bl, byte ptr [esp + 0x348]'),
    (0x00442f89, 'push', 'ebx'),
    (0x00442f8a, 'push', '0x59cce0'),
    (0x00442f90, 'push', '0x59ccc4'),
    (0x00442f96, 'call', '0x55b450'),
    (0x00442fae, 'push', 'ebx'),
    (0x00442faf, 'push', '0x59cce0'),
    (0x00442fb5, 'push', '0x59ccc4'),
    (0x00442fbb, 'call', '0x55b450'),
    (0x00442fdf, 'push', '0x8e0424'),
    (0x00442fe4, 'push', '0x8a03e4'),
    (0x00442fe9, 'call', '0x49afb0'),
    (0x0044305e, 'push', '1'),
    (0x0044306d, 'push', '0x6b'),
    (0x0044306f, 'call', '0x428110'),
    (0x00443085, 'push', 'esi'),
    (0x00443086, 'push', '0xd1964'),
    (0x0044308b, 'push', '0x89d178'),
    (0x00443090, 'push', '0x6b'),
    (0x00443094, 'call', '0x49a750'),
]

STREAM_INPUTS = {
    'rddata/rd001cp.dat': (9168, '5bcc842585c7f19030118b2cfe571e28582a74930ddda02af0e3298bc8fd046c'),
    'rddata/rd001gp.dat': (128, '674c29211dc6d97c8f8456c0e24abf9f91c9fc4d586f3697347decd9f0329d2e'),
    'rddata/rd002cp.dat': (9264, '35a4e5e9da7491a75da0a9b4b177f791e9be27ac0329e639c24f74f1f00b08c3'),
    'rddata/rd002gp.dat': (206, '6f0258cc48cbd0d63ad11612513485e33da17401c226915fccd1204873ed2c29'),
    'rddata/rd003cp.dat': (6880, '2744b81465d1a011b7cbfa8b2cd2a86ed046e4b5a53b787e1232c52ff92ec822'),
    'rddata/rd003gp.dat': (388, '67467dad19d5f8ae8cae5f708d840d91649d68427be93983448c970806b688e6'),
    'rddata/rd005cp.dat': (11264, '2c71643172686ae1595b5397794a72a961bbb8e9f1a46eaafa7825669c8cc6d2'),
    'rddata/rd005gp.dat': (700, '697fdfbb3818f5adeb5766b37ebffc0b4799f851354f5356c00b26209462a417'),
    'rddata/rd006cp.dat': (24400, 'c1973b5d15d49dc0e1d59e075e8e3400306c2df79fea228159e580e219a98f4d'),
    'rddata/rd006gp.dat': (1142, '28294b963db5a40721d955234b6dded3a09dd72a67e731d72ce802114e4f6a7f'),
}

# Observations independently bound to the input hashes, not inferred map IDs.
STREAM_SUMMARIES = {
    1: (864, 1562, 5, 573, 1562),
    5: (9166, 9942, 27, 704, 9876),
    2: (5668, 6325, 8, 579, 6325),
    6: (17307, 18846, 44, 1525, 18846),
    3: (11320, 11840, 15, 430, 11759),
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--exe', type=Path, required=True)
    parser.add_argument('--data-root', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    import capstone
    if capstone.__version__ != '5.0.7':
        raise ValueError('Capstone 5.0.7 required')
    reader = load_locked('rolling_pe', 'check-static-mission18-sky.py', READER_SHA)
    prior = load_locked('rolling_prior', 'check-static-recorded-demo-provenance.py', PRIOR_SHA)
    pe = reader.PE32(args.exe)
    out = args.output_dir.expanduser()
    if out.exists() or out.is_symlink() or not out.parent.is_dir():
        raise ValueError('Output must be new, with an existing parent')
    out.mkdir()
    checks = []

    def equal(actual, expected, claim):
        if actual != expected:
            raise ValueError(f'{claim}: expected {expected!r}, got {actual!r}')
        checks.append(claim)

    decoder = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
    rows = {}
    windows = []
    for start, end in WINDOWS.items():
        data = pe.read(start, end - start)
        instructions = list(decoder.disasm(data, start))
        equal(sum(i.size for i in instructions), end - start, f'complete window {start:08x}')
        rows.update({i.address: (i.mnemonic, i.op_str) for i in instructions})
        windows.append({'start': f'{start:08x}', 'endExclusive': f'{end:08x}', 'sha256': sha(data)})
        (out / f'{start:08x}.txt').write_text(
            '# Static bytes only; no target execution. SHA-256 ' + sha(data) + '\n' +
            '\n'.join(f'{i.address:08x} {i.bytes.hex():24} {i.mnemonic} {i.op_str}' for i in instructions) + '\n')
    for address, mnemonic, operands in EXPECTED:
        equal(rows.get(address), (mnemonic, operands), f'instruction {address:08x}')
    for address, text in {
        0x5ce06c: 'GP', 0x5ce070: 'CP', 0x5ce060: 'RD%03d%s.%s',
        0x5ce044: '%s\\RD%03d%s.%s', 0x59cce0: 'GAMNT', 0x59ccc4: '%s\\%s%d.%s',
    }.items():
        equal(pe.cstr(address), text, f'filename literal {address:08x}')
    equal(pe.u32(0x4b4228 + 9 * 4), 0x4b41bd, 'CP type10 dispatches camera fields')
    frontend_index = pe.read(0x4a4954 + 7 - 2, 1)[0]
    equal(pe.u32(0x4a4938 + frontend_index * 4), 0x4a475c, 'state7 dispatches frontend draw call')

    inputs = []
    blobs = {}
    for name, (size, digest) in {**prior.INPUTS, **STREAM_INPUTS}.items():
        data = (args.data_root / name).read_bytes()
        equal(len(data), size, 'input size ' + name)
        equal(sha(data), digest, 'input SHA ' + name)
        blobs[name] = data
        inputs.append({'path': name, 'bytes': size, 'sha256': digest})
    commands = [line.split() for line in blobs['rddata/rdmn001.dat'].decode('ascii').splitlines()
                if line.strip() and not line.lstrip().startswith('#')]
    equal(commands, [['MONTYPE_GAME', str(rid), '0'] for rid in ACTIVE] +
          [['MONTYPE_RESTART', '0', '0']], 'montage: five zero-limit games then restart, no STOP')
    recordings = []
    for rid in ACTIVE:
        start, end, gp_count, cp_count, cp_end = STREAM_SUMMARIES[rid]
        prefix = f'rddata/rd{rid:03}'
        gm = blobs[prefix + 'gm.dat']
        equal(struct.unpack_from('<i', gm, 0x10)[0], start, f'{rid}: saved simulation counter')
        equal(struct.unpack_from('<I', blobs[prefix + 'gm.ver'])[0], 106, f'{rid}: older sidecar106')
        gp, trailer = frame_stream(blobs[prefix + 'gp.dat'], 8)
        cp, _ = frame_stream(blobs[prefix + 'cp.dat'], 0)
        equal(struct.unpack('<ii', trailer), (start, end), f'{rid}: GP trailing start/end counters')
        equal((len(gp), len(cp), gp[-1]['turn'], cp[-1]['turn']),
              (gp_count, cp_count, end, cp_end), f'{rid}: scheduled records including zero-size end record')
        equal(sorted(set((r['size'], r['type']) for r in gp)), [(0, 0), (18, 1)], f'{rid}: GP frame shapes')
        equal(sorted(set((r['size'], r['type']) for r in cp)), [(0, 0), (8, 10)], f'{rid}: CP frame shapes')
        equal(all(start <= r['turn'] <= end for r in gp + cp), True, f'{rid}: records within saved counter interval')
        recordings.append({
            'recordingId': rid, 'sourceMapId': None, 'sourceIdentityStatus': 'UNRESOLVED',
            'snapshotCounterOffset': 16, 'startCounter': start, 'gpEndCounter': end,
            'cpEndCounter': cp_end, 'gpRecords': len(gp), 'cpRecords': len(cp),
            'gpFirstCounter': gp[0]['turn'], 'cpFirstCounter': cp[0]['turn'],
            'montageLimit': 0,
        })
    report = {
        'status': 'PASS_STATIC_ROLLING_DEMO_CONTROL_AND_FRAMING',
        'at': datetime.now(timezone.utc).isoformat(), 'assertions': len(checks), 'checks': checks,
        'exeSha256': sha(pe.data), 'scriptSha256': sha(Path(__file__).read_bytes()),
        'readerSha256': READER_SHA, 'priorCheckerSha256': PRIOR_SHA,
        'python': sys.version, 'capstone': capstone.__version__, 'windows': windows,
        'inputIdentities': inputs, 'recordings': recordings,
        'sourceMapIdentity': 'UNRESOLVED: GAMNT version107 writer is not the version106 RD creation producer.',
        'ownership': {
            'flags': '0098f746 word: GP=0x10, CP=8, montage=0x20, input-exit permission=4',
            'start': '004c5a80 -> 004b36e0(1,2) -> 004b30e0 -> 004b28d0 + 004b2d20',
            'service': '004a5996 -> 004b3920; CP first, then GP; simulation counter0089d188',
            'counterVA': '0089d188',
            'advance': '004b3d28: GP inactive OR (signed limit>1 AND ((counter-origin) unsigned>>4)>limit)',
            'interrupt': '004a9d90 keyboard / 004aa1c0 pointer -> 004b2700 -> restore0089d161 -> 0049cfa0(2) -> 004b4770',
            'return': 'mode2/3 -> 00442a60(7); requested state0088f001=7, phase0088f002=5; frontend consumer004a475c -> 00457a60',
        },
        'limits': [
            'No original executable, emulator, Windows API, renderer, or live replay ran.',
            'No recording ID, time counter, checksum, camera coordinate, art bank, or raw word assigned a map ID.',
            'GP/CP payload execution and simulation equivalence are unproved; payloads remain opaque here.',
            'OS input routing, deferred input-lock servicing, frontend destruction/init and eventual main-menu focus are not end-to-end proven.',
            'No replay runtime, save codec, menu, campaign, AI, startup, Credits or parity change.',
        ],
    }
    (out / 'evidence.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in ['status', 'assertions', 'exeSha256', 'scriptSha256', 'recordings']}, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, struct.error, ImportError) as error:
        print(f'FAIL: {error}', file=sys.stderr)
        sys.exit(1)
