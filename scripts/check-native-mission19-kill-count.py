"""Bounded supplied-state execution of native kill-credit writer and script reader."""
import hashlib
import json
import struct
import sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu

exe = Path(sys.argv[1])
assert hashlib.sha256(exe.read_bytes()).hexdigest() == '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
cpu, _ = native_cpu(exe)
cpu.mem_map(0x2000000, 0x20000)
obj, field, stack, stop = 0x2000000, 0x2001000, 0x201d000, 0x201e000
base, stride = 0x89d1c8, 0xc65

def put(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))

def call(address, *args):
    put(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, timeout=1000000, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    return cpu.reg_read(UC_X86_REG_EAX)

cases = []
for attacker in range(4):
    for victim in range(4):
        for initial in (0, 2, 25, 65535):
            cpu.mem_write(base, bytes(4 * stride))
            for tribe in range(4):
                put(base + tribe * stride + 0xc22, 'B', tribe)
            put(obj + 0x2f, 'B', victim)
            address = base + attacker * stride + 0xa1f + victim * 2
            put(address, 'H', initial)
            call(0x4a3960, attacker, obj)
            expected = (initial + 1) & 65535
            for observed_attacker in range(4):
                for observed_victim in range(4):
                    put(field, 'Ii', 2, 1176 + observed_victim)
                    actual = call(0x48f350, base + observed_attacker * stride, 0, field)
                    assert actual == (expected if (attacker, victim) == (observed_attacker, observed_victim) else 0)
            cases.append([attacker, victim, initial, expected])
# Wild/neutral victim does not write a tribe credit.
cpu.mem_write(base, bytes(4 * stride))
put(obj + 0x2f, 'B', 255)
call(0x4a3960, 1, obj)
assert bytes(cpu.mem_read(base, 4 * stride)) == bytes(4 * stride)
print(json.dumps({'passed': True, 'writer': '004a3960', 'reader': '0048f350', 'interceptedLeaves': [], 'cases': cases, 'neutralCase': True}))
