"""One reviewed Mission2 callback composition. Do not run without a separate grant.

All emulator imports/construction are behind the explicit execution argument.
No application/package/browser import or subprocess is used by this probe.
"""
import argparse
import bisect
import collections
import hashlib
import json
import struct
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CASE_PATH = HERE.parent / 'mission2-ordered-callback-proposal-2026-10-07/case.json'
CASE_SHA = 'ee204793dfb64b28657d133d7aa60485248915ec0b86aa7792848cc7c4f716f9'
SCRATCH, SCRATCH_BYTES = 0x2000000, 0x200000
OBJECTS, SHAPES, COUNTS, RECORDS = 0x2000000, 0x2004000, 0x2020000, 0x2040000
ARGS, STACK, STOP = 0x2180000, 0x21ed000, 0x21ef000
POOL, POOL_END, STRIDE = 0x8e0428, 0x937a98, 179
TABLE, TRIBES, LAND = 0x890390, 0x89d1c8, 0x8a03e4
GAME_RNG, COSMETIC_RNG, SEEDS = 0x89d178, 0x89bc72, 0x96eac1
MAX_OUTPUT = 16 * 1024 * 1024
output_bytes = 0


def sha(data):
    return hashlib.sha256(data).hexdigest()


def emit(value):
    global output_bytes
    text = json.dumps(value, separators=(',', ':'))
    output_bytes += len(text.encode()) + 1
    if output_bytes > MAX_OUTPUT:
        raise RuntimeError('Declared raw output ceiling exceeded')
    print(text, flush=True)


class Probe:
    def __init__(self, executable, case, closure, contract):
        # No caller reaches this constructor without the reviewed CLI gate.
        sys.path.insert(0, str(ROOT / 'scripts'))
        from decomp import native_cpu, configure_native_constants, load_native_shapes
        from unicorn import UC_HOOK_BLOCK, UC_HOOK_CODE, UC_HOOK_MEM_READ, UC_HOOK_MEM_WRITE
        from unicorn.unicorn_const import UC_QUERY_TIMEOUT
        from unicorn.x86_const import (
            UC_X86_REG_EAX, UC_X86_REG_EBX, UC_X86_REG_EDI, UC_X86_REG_EIP,
            UC_X86_REG_ESI, UC_X86_REG_ESP)
        self.reg = dict(eax=UC_X86_REG_EAX, ebx=UC_X86_REG_EBX, edi=UC_X86_REG_EDI,
                        eip=UC_X86_REG_EIP, esi=UC_X86_REG_ESI, esp=UC_X86_REG_ESP)
        self.timeout_query = UC_QUERY_TIMEOUT
        self.case, self.closure, self.contract = case, closure, contract
        self.cpu, self.identity = native_cpu(executable, tcg_buffer_size=64 * 1024 * 1024)
        assert self.cpu.ctl_get_tcg_buffer_size() == 64 * 1024 * 1024
        configure_native_constants(self.cpu, executable)
        self.cpu.mem_map(SCRATCH, SCRATCH_BYTES)
        self.loaded = {name: (executable.parent / name).read_bytes() for name in case['inputs']}
        for name, expected in case['inputs'].items():
            assert sha(self.loaded[name]) == expected['sha256'], name
        load_native_shapes(self.cpu, executable, OBJECTS, SHAPES)
        self.cpu.mem_write(0x8929cd, self.loaded['data/mwsearch.dat'])
        starts = list(struct.iter_unpack('<HH', self.loaded['data/vstart-0.ani']))
        frames = list(struct.iter_unpack('<HBBBBH', self.loaded['data/vfra-0.ani']))
        for index, (first, _) in enumerate(starts):
            frame, seen = first, set()
            while frame and frame not in seen:
                assert frame < len(frames)
                seen.add(frame)
                frame = frames[frame][-1]
            assert frame in (0, first)
            self.write(COUNTS + index * 6 + 1, 'B', len(seen) & 255)
        self.write(0x59df44, 'I', COUNTS)
        for row in case['fixedSetup']['zeroRegions']:
            self.cpu.mem_write(int(row['base'], 16), bytes(row['bytes']))
        for kind, fmt in [('bytes', 'B'), ('words', 'H'), ('dwords', 'I')]:
            for address, value in case['fixedSetup'][kind].items():
                self.write(int(address, 16), fmt, value)
        for address, value in case['fixedSetup']['rngWords'].items():
            self.write(int(address, 16), 'I', int(value, 16))
        for owner in range(4):
            self.write(TRIBES + owner * 0xc65 + 0xc22, 'B', owner)
        for row in contract['additionalFreshInputs']:
            value = bytes(row['zeroBytes']) if 'zeroBytes' in row else bytes.fromhex(row['bytes'])
            self.cpu.mem_write(int(row['address'], 16), value)
        self.write(0x892443, 'I', ARGS)
        self.cpu.mem_write(RECORDS, self.loaded['levels/levl2002.dat'][0x14043:0x14043 + 110000])
        self.cpu.mem_write(STACK - 0x4000, bytes(0x6000))
        self.write(STACK + 0x40, '4I', 0, 1, 2, 3)
        self.stage, self.record_id, self.entries = 'prepared', None, 0
        self.events, self.allocations, self.allocation_stack = [], [], []
        self.seed_copies, self.seed_writes, self.rng_writes = [], [], []
        self.call_counts, self.read_counts, self.write_counts = collections.Counter(), collections.Counter(), collections.Counter()
        self.total_instructions, self.call_instructions = 0, 0
        self.block_cache, self.returned_records = {}, {}
        self.instructions = {int(a, 16): row for a, row in closure['instructions'].items()}
        self.calls = {int(a, 16): row for a, row in closure['calls'].items()}
        self.supplied = {int(a, 16): n for a, n in closure['suppliedEntries'].items()}
        self.real_entries = {int(a, 16) for a in closure['realEntries']}
        self.mutable = [(int(r['start'], 16), int(r['endExclusive'], 16), r['owner'])
                        for r in contract['nativeWriteRanges']]
        self.mutable.sort()
        assert all(left[1] <= right[0] for left,right in zip(self.mutable,self.mutable[1:]))
        self.mutable_starts = [a for a,_,_ in self.mutable]
        self.readable = [(int(r['start'], 16), int(r['endExclusive'], 16))
                         for r in contract['nativeReadRanges']]
        self.immutable = []
        raw = self.loaded['d3dpoptb.exe']
        pe = struct.unpack_from('<I', raw, 60)[0]
        count, optional = struct.unpack_from('<H', raw, pe + 6)[0], struct.unpack_from('<H', raw, pe + 20)[0]
        base = struct.unpack_from('<I', raw, pe + 52)[0]
        for index in range(count):
            offset = pe + 24 + optional + index * 40
            name, virtual, rva, size, _ = struct.unpack_from('<8sIIII', raw, offset)
            flags = struct.unpack_from('<I', raw, offset + 36)[0]
            if not flags & 0x80000000:
                self.protect(base + rva, max(virtual, size), name.rstrip(b'\0').decode())
        constants = json.loads((ROOT / 'app/original-constants.json').read_text())
        for index in range(512):
            descriptor = bytes(self.cpu.mem_read(0x5aa5f0 + index * 31, 31))
            name = descriptor[:25].split(b'\0')[0].decode()
            if not name:
                break
            if name in constants:
                self.protect(struct.unpack_from('<I', descriptor, 27)[0], descriptor[25], name)
        for address, size, label in [
            (OBJECTS, len(self.loaded['objects/objs0-2.dat']), 'bank2 objects'),
            (SHAPES, len(self.loaded['objects/shapes.dat']), 'relocated shapes'),
            (COUNTS, len(starts) * 6, 'derived animation counts'),
            (0x8929cd, len(self.loaded['data/mwsearch.dat']), 'search data')]:
            self.protect(address, size, label)
        self.rebuild_protection()
        self.cpu.hook_add(UC_HOOK_BLOCK, self.on_block)
        self.cpu.hook_add(UC_HOOK_MEM_READ, self.on_read)
        self.cpu.hook_add(UC_HOOK_MEM_WRITE, self.on_write)
        observe = self.real_entries | set(self.supplied) | {0x4edad6}
        for address in observe:
            self.cpu.hook_add(UC_HOOK_CODE, self.on_entry, begin=address, end=address)
        self.verify_immutable()
        emit({'status': 'prepared', 'case': case['case'], 'inputHashes': case['inputs'],
              'caseSha256': CASE_SHA, 'bounds': case['proposedBounds']})

    def read(self, address, fmt='I'):
        return struct.unpack('<' + fmt, self.cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

    def write(self, address, fmt, *values):
        self.cpu.mem_write(address, struct.pack('<' + fmt, *values))

    def args(self, count):
        return list(struct.unpack('<' + 'I' * count, self.cpu.mem_read(self.cpu.reg_read(self.reg['esp']) + 4, count * 4)))

    def protect(self, address, size, label):
        self.immutable.append((address, bytes(self.cpu.mem_read(address, size)), label))

    def rebuild_protection(self):
        intervals = sorted((a, a + len(b)) for a,b,_ in self.immutable)
        self.protected_ranges = []
        for a,b in intervals:
            if self.protected_ranges and a <= self.protected_ranges[-1][1]:
                self.protected_ranges[-1] = (self.protected_ranges[-1][0], max(b, self.protected_ranges[-1][1]))
            else:
                self.protected_ranges.append((a,b))
        self.protected_starts = [a for a,_ in self.protected_ranges]

    def verify_immutable(self):
        for address, data, name in self.immutable:
            assert bytes(self.cpu.mem_read(address, len(data))) == data, ('changed input', name)

    def event(self, row):
        assert len(self.events) < 10000, 'Semantic event ceiling'
        self.events.append({'entry': self.entries, 'stage': self.stage, 'recordId': self.record_id, **row})

    def on_block(self, cpu, address, size, _):
        if address == STOP or address in self.supplied:
            return
        key = (address, size)
        if key not in self.block_cache:
            pc, count = address, 0
            while pc < address + size:
                assert pc in self.instructions, ('unfrozen instruction', hex(pc))
                row = self.instructions[pc]
                assert bytes(cpu.mem_read(pc, row['size'])).hex() == row['bytes']
                if pc in self.calls:
                    call = self.calls[pc]
                    assert call['classification'] in ('real', 'supplied'), ('excluded call reached', hex(pc), call)
                count += 1
                pc += row['size']
            assert pc == address + size, ('unaligned native block', key)
            self.block_cache[key] = count
        count = self.block_cache[key]
        self.call_instructions += count
        self.total_instructions += count
        assert self.total_instructions <= 35000000, 'Aggregate conservative instruction ceiling'

    def on_read(self, cpu, access, address, size, value, _):
        assert any(a <= address and address + size <= b for a,b in self.readable), ('native read range', hex(address), size)
        # Bound storage by instruction address, not the number of terrain reads.
        self.read_counts[cpu.reg_read(self.reg['eip'])] += 1

    def on_write(self, cpu, access, address, size, value, _):
        pc = cpu.reg_read(self.reg['eip'])
        if address < 0x897997 and address + size > 0x89798d:
            assert self.entries == 5 and self.stage == 'setup-5' and value == 0
            assert (pc, address, size) in ((0x42b7fe, 0x89798d, 4),
                                          (0x42b800, 0x897991, 4),
                                          (0x42b803, 0x897995, 2)), 'Unfrozen input-buffer write'
        if address < 0x89c48e and address + size > 0x89c48d:
            assert (self.entries, self.stage) in ((6, 'setup-6'), (9, 'setup-9'))
            assert (pc, address, size, cpu.reg_read(self.reg['esi'])) == (0x401906, 0x89c48d, 1, 0x400), 'Unfrozen sunlight-table final byte'
        index = bisect.bisect_right(self.protected_starts, address + size - 1) - 1
        assert index < 0 or self.protected_ranges[index][1] <= address, ('immutable write', hex(pc), hex(address), size)
        region_index = bisect.bisect_right(self.mutable_starts,address)-1
        region = (self.mutable[region_index][2] if region_index>=0 and
                  address+size<=self.mutable[region_index][1] else None)
        assert region is not None, ('native write range', hex(pc), hex(address), size)
        self.write_counts[(pc, region)] += 1
        if address in (GAME_RNG, COSMETIC_RNG):
            assert size == 4
            row = [pc, address, size, value & 0xffffffff]
            self.rng_writes.append(row)
            self.event({'rngWrite': row})
        if SEEDS <= address < SEEDS + 12:
            row = [pc, address, size, value]
            self.seed_writes.append(row)
            self.event({'seedWrite': row})
        if pc == 0x4eda29:
            assert self.allocation_stack and size == 1 and (address - POOL) % STRIDE == 0x2e
            row = [pc, address, size, value, self.allocation_stack[-1]['class']]
            self.seed_copies.append(row)
            self.event({'seedCopy': row})
        if RECORDS <= address < RECORDS + 110000:
            assert pc in (0x484f19,0x484f27,0x484fe8,0x484ff6,0x484ffa,0x485024), ('record mutation', hex(pc))

    def on_entry(self, cpu, address, size, _):
        sp = cpu.reg_read(self.reg['esp'])
        self.call_counts[address] += 1
        if address in self.supplied:
            ret = self.read(sp)
            call = self.calls.get(ret - 5)
            assert call and int(call['target'], 16) == address and call['classification'] == 'supplied'
            arguments = self.args(self.supplied[address])
            self.event({'supplied': f'{address:08x}', 'caller': f'{ret-5:08x}', 'args': arguments})
            if address == 0x48a050:
                cpu.reg_write(self.reg['eax'], 0)
            cpu.reg_write(self.reg['eip'], ret)
            cpu.reg_write(self.reg['esp'], sp + 4)
            return
        if address == 0x4ed8a0:
            cls, model, owner, point = self.args(4)
            cls, model, owner = cls & 255, model & 255, owner & 255
            assert len(self.allocations) + len(self.allocation_stack) < 86
            assert len(self.allocation_stack) < 2
            assert [cls, model] in self.contract['allowedClassModels']
            ret=self.read(sp)
            assert self.stage=='authored-record'
            if ret==0x485016:
                assert not self.allocation_stack
                record=RECORDS+(self.record_id-1)*55
                assert (cls,model,owner)==(self.read(record+1,'B'),self.read(record,'B'),self.read(record+2,'B'))
            elif ret==0x4037db:
                assert len(self.allocation_stack)==1 and self.allocation_stack[0]['class']==2
                assert (cls,model)==(6,9) and owner==self.allocation_stack[0]['owner']
            elif ret==0x485ce3:
                assert not self.allocation_stack and self.record_id==27 and (cls,model,owner)==(6,10,0)
            else:
                raise AssertionError(('unfrozen allocator caller',hex(ret)))
            row = dict(sp=sp, returnAddress=self.read(sp), sourceRecord=self.record_id,
                       depth=len(self.allocation_stack)+1, **{'class':cls}, model=model, owner=owner,
                       point=list(struct.unpack('<HHh', cpu.mem_read(point,6))),
                       seed=self.read(SEEDS+cls,'B'), argTop=self.read(0x892443), argFlag=self.read(0x89243a,'B'))
            self.allocation_stack.append(row)
            self.event({'allocationRequest': row.copy()})
        elif address == 0x4edad6:
            row = self.allocation_stack.pop()
            assert sp == row['sp'] and self.read(sp) == row['returnAddress']
            pointer = cpu.reg_read(self.reg['eax'])
            row.update(result=pointer, afterArgTop=self.read(0x892443), afterArgFlag=self.read(0x89243a,'B'))
            self.allocations.append(row)
            self.event({'allocationReturn': row})  # Retain return/cleanup before field assertions.
            if pointer:
                assert POOL < pointer < 0x930ab8 and (pointer-POOL)%STRIDE == 0
                row.update(handle=self.read(pointer+0x24,'H'), raw=bytes(cpu.mem_read(pointer,STRIDE)).hex())
                if row['class'] == 1:
                    assert self.read(pointer+0x2e,'B') == row['seed']
                    assert self.read(SEEDS+1,'B') == (row['seed']+1)&255
                if row['returnAddress']==0x485016:
                    self.returned_records[row['sourceRecord']] = pointer
            assert pointer, 'Unexpected allocation failure; preserve and stop'
        elif address in (0x4ed580,0x4ed640):
            pointer = self.args(1)[0]
            cls, model, state = struct.unpack('<BBB', cpu.mem_read(pointer+0x2a,3))
            assert [cls,model] in self.contract['allowedClassModels']
            if address == 0x4ed640:
                assert state in self.contract['allowedStates'][str(cls)], ('unfrozen state initializer',cls,model,state)
        elif address == 0x4e9d80:
            person, point = self.args(2)
            assert self.stage == 'roster-site-orders' and self.read(person+0x2b,'B') == 7
            assert bytes(cpu.mem_read(person+0x3d,4)) == bytes(cpu.mem_read(point,4)), 'Fixed authored Shaman is not at its commanded site center'
            assert self.read(person+0x9f,'H') == 0
            x,y=struct.unpack('<HH',cpu.mem_read(point,4));cell=LAND+((x>>9)+(y>>9)*128)*16
            assert not self.read(cell,'I')&0x200, 'Unexpected building at fixed Shaman site'
        elif address == 0x420840:
            mode, person, origin, target, _, _ = self.args(6)
            assert mode == 0 and self.read(person+0x9f,'H') == 0
            assert self.read(origin,'H') == self.read(target,'H'), 'Unproposed nontrivial path search'
            self.event({'sameCellRoute': [self.read(person+0x24,'H'), self.read(origin,'H')]})
        elif address == 0x4eadc0:
            person=self.args(1)[0];group=self.read(person+0x63,'H')
            assert self.read(person+0x9f,'H')==0
            if group:
                assert 1<=group<=400 and self.read(0x955c29+group*109+0x6c,'B')==0
        elif address == 0x49a3f0:
            index=self.args(1)[0]&255
            assert 0<index<16 and self.read(0x89290d+index*12,'B')==2

    def partition(self):
        arena=bytes(self.cpu.mem_read(POOL,POOL_END-POOL));handles=bytes(self.cpu.mem_read(TABLE,8000));seen=set();lists={}
        for label,address in [('high',0x89031c),('low',0x890320),('active',0x890324),('retiring',0x890328),('secondaryFree',0x89032c),('secondaryActive',0x890330)]:
            head=self.read(address);members=[];previous=0
            while head:
                assert POOL<head<POOL_END and (head-POOL)%STRIDE==0 and head not in seen
                offset=head-POOL;prev,next_=struct.unpack_from('<II',arena,offset)
                handle=struct.unpack_from('<H',arena,offset+0x24)[0]
                assert prev==previous and struct.unpack_from('<I',handles,handle*4)[0]==head and handle==(head-POOL)//STRIDE
                cls=arena[offset+0x2a];flags=struct.unpack_from('<I',arena,offset+0xc)[0]
                assert not flags&1
                assert cls in (1,2,5,6,7) if label=='active' else cls==0
                assert (1<=handle<640) if label=='low' else (640<=handle<1840) if label=='high' else True
                assert (handle>=1840) if label.startswith('secondary') else (handle<1840)
                seen.add(head);members.append(handle);previous,head=head,next_
            lists[label]=members
        assert len(seen)==1999 and not lists['retiring'] and not lists['secondaryActive']
        assert self.read(0x89c651)==len(lists['active']) and self.read(0x89c659)==sum(i<640 for i in lists['active'])
        heads=bytes(self.cpu.mem_read(LAND,0x40000));linked=set()
        for cell in range(16384):
            handle=struct.unpack_from('<H',heads,cell*16+6)[0];previous=0
            while handle:
                assert handle in lists['active'] and handle not in linked
                offset=handle*STRIDE;next_,prev=struct.unpack_from('<HH',arena,offset+0x20)
                x,y=struct.unpack_from('<HH',arena,offset+0x3d)
                assert prev==previous and (x>>9)+(y>>9)*128==cell
                assert struct.unpack_from('<I',arena,offset+0xc)[0]&0x20000
                linked.add(handle);previous,handle=handle,next_
        registered={i for i in lists['active'] if struct.unpack_from('<I',arena,i*STRIDE+0xc)[0]&0x20000}
        assert linked==registered
        return {key:len(value) for key,value in lists.items()}

    def snapshot(self, label):
        self.verify_immutable()
        emit({'snapshot':label,'entry':self.entries,'partition':self.partition(),
              'seedBytes':bytes(self.cpu.mem_read(SEEDS,12)).hex(),
              'pool':bytes(self.cpu.mem_read(POOL,POOL_END-POOL)).hex(),
              'terrainSha256':sha(bytes(self.cpu.mem_read(LAND,0x40000))),
              'terrain':bytes(self.cpu.mem_read(LAND,0x40000)).hex(),
              'terrainQueue':bytes(self.cpu.mem_read(0x68c6d0,0x4c18)).hex(),
              'motionState':bytes(self.cpu.mem_read(0x9557a4,0xaf62)).hex(),
              'tribes':bytes(self.cpu.mem_read(TRIBES,4*0xc65)).hex(),
              'orders':bytes(self.cpu.mem_read(0x938830,8000)).hex(),
              'rngs':[self.read(GAME_RNG),self.read(COSMETIC_RNG)]})

    def invoke(self, entry, args=(), stop=STOP, category='otherSetupAndTails', registers=None):
        self.entries += 1
        assert self.entries<=2011
        budget=self.case['proposedBounds']['perStage'][category]
        if stop==STOP:self.write(STACK,'I'*(len(args)+1),STOP,*args)
        self.cpu.reg_write(self.reg['esp'],STACK)
        for register,value in (registers or {}).items():self.cpu.reg_write(self.reg[register],value)
        self.call_instructions=0;started=time.perf_counter_ns();error=None
        try:self.cpu.emu_start(entry,stop,timeout=budget['timeoutMicroseconds'],count=budget['instructions'])
        except Exception as caught:error=repr(caught)
        elapsed=(time.perf_counter_ns()-started)/1e9
        row={'entry':self.entries,'stage':self.stage,'recordId':self.record_id,'start':f'{entry:08x}',
             'stop':f'{stop:08x}','eip':self.cpu.reg_read(self.reg['eip']),'esp':self.cpu.reg_read(self.reg['esp']),
             'elapsedSeconds':elapsed,'unicornTimeout':bool(self.cpu.query(self.timeout_query)),
             'nativeInstructionLimit':budget['instructions'],'blockInstructionUpperBound':self.call_instructions,
             'aggregateBlockInstructionUpperBound':self.total_instructions,'error':error}
        emit({'call':row})  # Publish partial stop/budget telemetry before assertions.
        assert error is None,error
        assert row['eip']==stop and row['esp']==STACK+(4 if stop==STOP else 0),row
        assert not row['unicornTimeout'] and not self.allocation_stack,row

    def run(self):
        setup=self.case['setupEntries']
        for number,row in enumerate(setup):
            self.stage='setup-'+str(number+1)
            if number==6:
                for value in self.case['preRecordLoadedBankStores']:self.write(int(value['address'],16),'B',value['value'])
                heights=struct.unpack('<16384h',self.loaded['levels/levl2002.dat'][:32768])
                terrain=bytearray(0x40000)
                for index,height in enumerate(heights):struct.pack_into('<h',terrain,index*16+4,height)
                self.cpu.mem_write(LAND,bytes(terrain))
            if number==8:
                data=self.loaded['levels/levl2002.dat']
                for index,value in enumerate(data[0x10000:0x14000]):
                    if value:self.write(LAND+index*16,'I',self.read(LAND+index*16)|4)
                for owner in range(4):self.cpu.mem_write(TRIBES+owner*0xc65+0x8a1,data[0x14000+owner*16:0x14004+owner*16])
                self.write(0x937ab0,'B',data[0x14042])
            category='terrain' if number==6 else 'navigation' if number==7 else 'otherSetupAndTails'
            self.invoke(int(row['entry'],16),row.get('args',()),int(row.get('stop',f'{STOP:08x}'),16),category,
                        {'ebx':0} if row.get('kind')=='slice' else None)
            if number==2:
                assert self.partition()==dict(high=1200,low=639,active=0,retiring=0,secondaryFree=160,secondaryActive=0)
                self.protect(TABLE,8000,'native bootstrap handles');self.rebuild_protection()
        assert bytes(self.cpu.mem_read(SEEDS,12))==bytes(12)
        self.snapshot('before-records')
        self.write(STACK+0x2c,'4I',0,0,0,0)
        self.write(STACK+0x40,'4I',0,1,2,3)
        for index in range(2000):
            self.stage='authored-record';self.record_id=index+1
            pointer=RECORDS+index*55;before=len(self.allocations)
            self.invoke(0x484edc,stop=0x485038,category='eachRecord',
                        registers={'esi':pointer+1,'edi':index+1,'ebx':0})
            if self.read(pointer+1,'B'):self.partition()
            else:assert len(self.allocations)==before
            assert self.read(0x892443)==ARGS and self.read(0x89243a,'B')==0
        self.record_id=None
        assert list(struct.unpack('<4I',self.cpu.mem_read(STACK+0x2c,16)))==[6,0,0,26]
        self.snapshot('after-records')
        self.stage='link-and-owner-counts';self.invoke(0x485050,stop=0x485153)
        assert all(self.read(TRIBES+owner*0xc65+0x949)==0x61 for owner in (1,2))
        self.snapshot('after-links')
        for value in self.case['preRosterTailStores']:self.write(int(value['address'],16),'B',value['value'])
        self.stage='roster-site-orders';self.invoke(0x42b403,stop=0x42b48a)
        self.snapshot('final')
        people=[row for row in self.allocations if row['class']==1]
        assert sum(row['returnAddress']==0x485016 for row in self.allocations)==78
        assert sum(row['returnAddress']==0x485ce3 for row in self.allocations)==1
        assert sum(row['returnAddress']==0x4037db for row in self.allocations)<=7
        assert len(people)==27 and [row['seed'] for row in people]==list(range(27))
        assert self.read(SEEDS+1,'B')==27 and self.entries==2011 and len(self.allocations)<=86
        assert [row[3] for row in self.seed_copies if row[4]==1]==list(range(27))
        assert [row[3] for row in self.seed_writes if row[1]==SEEDS+1 and row[2]==1]==list(range(1,28))
        for address,count in [(0x485b00,78),(0x4851e0,1),(0x4866a0,1),(0x4edf50,1),
                              (0x4ecac0,1),(0x503230,1),(0x419790,4),(0x419810,4),
                              (0x419880,4),(0x436c20,2),(0x436d00,2),(0x438730,2)]:
            assert self.call_counts[address]==count,('original callback count',hex(address),self.call_counts[address],count)
        for expected in self.case['assertions']['shamans']:
            person=self.returned_records[expected['recordId1']];owner=expected['owner']
            assert person==self.read(TRIBES+owner*0xc65+0x89d)
            assert self.read(person+0x2e,'B')==expected['successfulDirectOrdinal0']
            assert self.read(person+0x2c,'B')==10 and self.read(person+0xa7,'B')==18
            order=self.read(person+0x8b,'H');assert 0<order<800
            assert self.read(0x938830+order*10,'B')==18 and self.read(0x938830+order*10+2,'H')==1
        assert self.read(0x96aa7a,'H')==2
        assert all(self.read(TRIBES+owner*0xc65+0x89d)==0 for owner in (1,2))
        assert self.read(0x892443)==ARGS and self.read(0x89243a,'B')==0
        assert bytes(self.cpu.mem_read(0x96ead0,3))==bytes([28,0,0])
        assert self.read(0x89d188)==0
        self.verify_immutable()
        return {'status':'passed','entries':self.entries,'allocations':self.allocations,'events':self.events,
                'seedCopies':self.seed_copies,'seedWrites':self.seed_writes,'rngWrites':self.rng_writes,
                'callCounts':{f'{k:08x}':v for k,v in sorted(self.call_counts.items())},
                'readCounts':{f'{k:08x}':v for k,v in sorted(self.read_counts.items())},
                'writeCounts':[[f'{pc:08x}',region,n] for (pc,region),n in sorted(self.write_counts.items())],
                'limits':'Fixed supplied fresh Mission2 context; no OS load, full sound RNG, world visit, port or ordinary gameplay proof.'}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute-reviewed',action='store_true')
    parser.add_argument('executable',type=Path)
    args=parser.parse_args()
    if not args.execute_reviewed:raise SystemExit('Requires exact independent executable review and a separate run grant')
    assert sha(CASE_PATH.read_bytes())==CASE_SHA
    case=json.loads(CASE_PATH.read_text());closure=json.loads((HERE/'closure.json').read_text())
    contract=json.loads((HERE/'execution-contract.json').read_text())
    assert closure['ready'] and contract['freezeComplete'], 'Source checkpoint is not executable-frozen'
    launch=json.loads((HERE/'launch.json').read_text())
    for name,expected in launch['inputsSha256'].items():
        path=Path(name)
        if not path.is_absolute():path=ROOT/path
        assert sha(path.read_bytes())==expected,('changed frozen input',name)
    probe=None
    try:
        probe=Probe(args.executable,case,closure,contract)
        emit(probe.run())
    except Exception as error:
        emit({'status':'failed','error':repr(error),'stage':probe.stage if probe else 'setup',
              'entry':probe.entries if probe else 0,'allocations':probe.allocations if probe else [],
              'events':probe.events if probe else [],'allocationStack':probe.allocation_stack if probe else [],
              'rngWrites':probe.rng_writes if probe else [],'seedWrites':probe.seed_writes if probe else [],
              'poolAtStop':bytes(probe.cpu.mem_read(POOL,POOL_END-POOL)).hex() if probe else None,
              'seedBytesAtStop':bytes(probe.cpu.mem_read(SEEDS,12)).hex() if probe else None,
              'poolHeadsAtStop':[probe.read(a) for a in range(0x89031c,0x890334,4)] if probe else None,
              'registersAtStop':{name:probe.cpu.reg_read(register) for name,register in probe.reg.items()} if probe else None,
              'argumentTopAtStop':probe.read(0x892443) if probe else None,
              'argumentFlagAtStop':probe.read(0x89243a,'B') if probe else None})
        raise


if __name__=='__main__':
    main()
