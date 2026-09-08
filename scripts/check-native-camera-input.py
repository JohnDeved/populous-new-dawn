"""Compare complete native keyboard and drag movement routines, including momentum.
Usage: python scripts/check-native-camera-input.py /path/to/d3dpoptb.exe
Only interaction cleanup and globe texture notifications are intercepted.
The check covers camera/velocity state; it does not certify their UI consumers.
"""
import json
import random
import struct
import subprocess
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP
from decomp import native_cpu

root = Path(__file__).resolve().parents[1]
cpu, _ = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x20000)
stack, stop = 0x201d000, 0x201e000
rng = random.Random(0x4424b0)


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *[v & 0xffffffff for v in args])
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, timeout=1000000, count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))


def leaf(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)


for address in [0x448fa0, 0x41ef30]:
    cpu.hook_add(UC_HOOK_CODE, leaf, begin=address, end=address)


def snapshot():
    return dict(camera=dict(x=read(0x89d1ec, 'H'), y=read(0x89d1ee, 'H'),
                            angle=read(0x89d1fa, 'H')),
                velocity=dict(turn=read(0x8926c7, 'h'), forward=read(0x8926c9, 'h'),
                              side=read(0x8926cb, 'h')))


cases, expected = [], []
keyboard_calls, drag_calls = 0, 0
for batch in range(256):
    camera = dict(x=rng.randrange(65536), y=rng.randrange(65536), angle=rng.randrange(2048))
    velocity = dict(turn=rng.randrange(-64, 65), forward=rng.randrange(-32768, 32768),
                    side=rng.randrange(-32768, 32768))
    write(0x89c6f0, 'B', 0)
    write(0x89d1ec, 'HH', camera['x'], camera['y'])
    write(0x89d1fa, 'H', camera['angle'])
    write(0x8926c7, 'hhh', velocity['turn'], velocity['forward'], velocity['side'])
    commands, states = [], []
    for frame in range(48):
        rate = rng.choice([-1, 0, 1, 19, 20, 24, 30, 60, 144, 1000])
        enabled = bool(rng.randrange(2))
        setting = rng.choice([-32768, -16, -15, 0, 1, 10, 16, 17, 32767])
        momentum = max(0, min(255, setting * 8 + 120)) if enabled else 0
        scale = rng.choice([None, 0, 1, 128, 256, 384, 512])
        write(0x5ca850, 'i', rate)
        write(0x895dad, 'h', setting)
        write(0x895da4, 'I', 1024 if enabled else 0)
        write(0x89c669, 'I', 0x100000 if scale is not None else 0)
        write(0x89c6a9, 'i', scale or 0)
        command = dict(rate=rate, momentum=momentum, scale=scale)
        if frame % 3 == 0:
            rotate = bool(rng.randrange(2))
            dx, dy = rng.randrange(-4096, 4097), rng.randrange(-4096, 4097)
            command.update(rotate=rotate, dx=dx, dy=dy)
            if rotate:
                call(0x4429c0, dx, momentum)
                drag_calls += 1
            else:
                call(0x442920, dy * 12, momentum)
                call(0x442880, dx * 12, momentum)
                drag_calls += 2
        else:
            # Every button byte, opposing keys, fast diagonals and decay-only frames.
            buttons = batch if frame == 1 else rng.choice([0, 0, 0, rng.randrange(256)])
            command['buttons'] = buttons
            call(0x4424b0, buttons)
            keyboard_calls += 1
        commands.append(command)
        states.append(snapshot())
    cases.append(dict(camera=camera, velocity=velocity, commands=commands))
    expected.append(states)

js = """import {stepCameraInput,dragCamera} from './app/camera-input.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
console.log(JSON.stringify(JSON.parse(input).map(({camera,velocity,commands})=>commands.map(c=>{
 const scale=c.scale===null?undefined:c.scale;
 if(c.buttons!==undefined)stepCameraInput(camera,velocity,c.buttons,c.rate,c.momentum,scale);
 else dragCamera(camera,velocity,c.rotate,c.dx,c.dy,c.momentum,scale);
 return structuredClone({camera,velocity});
}))));"""
result = subprocess.run(['node', '--input-type=module', '-e', js], input=json.dumps(cases),
                        capture_output=True, text=True, cwd=root)
assert result.returncode == 0, result.stderr
actual = json.loads(result.stdout)
assert len(actual) == len(expected)
for batch, (native, browser) in enumerate(zip(expected, actual)):
    assert len(native) == len(browser)
    for frame, (a, b) in enumerate(zip(native, browser)):
        assert a == b, (batch, frame, cases[batch]['commands'][frame], a, b)
print(f'PASS: {keyboard_calls:,} complete native keyboard calls and {drag_calls:,} drag-axis calls; '
      'camera and momentum agree through 256 mixed 48-step sequences')
