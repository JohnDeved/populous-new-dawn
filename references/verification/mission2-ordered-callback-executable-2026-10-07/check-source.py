"""Host-only source/observer checks. Does not import Unicorn or execute native code."""
import ast
import hashlib
import importlib.util
import json
import struct
import sys
from pathlib import Path

HERE=Path(__file__).resolve().parent


class Memory:
    def __init__(self):
        self.regions=[(0x8e0428,bytearray(2000*179)),(0x890390,bytearray(8000)),
                      (0x8a03e4,bytearray(0x40000)),(0x89031c,bytearray(0x74)),
                      (0x89c651,bytearray(16))]
    def find(self,address,size):
        for base,data in self.regions:
            if base<=address and address+size<=base+len(data):return data,address-base
        raise AssertionError(('unmapped host observer fixture',hex(address),size))
    def mem_read(self,address,size):
        data,offset=self.find(address,size);return bytes(data[offset:offset+size])
    def mem_write(self,address,value):
        data,offset=self.find(address,len(value));data[offset:offset+len(value)]=value


def main():
    for file in HERE.glob('*.py'):ast.parse(file.read_text(),filename=str(file))
    closure=json.loads((HERE/'closure.json').read_text())
    case=json.loads((HERE.parent/'mission2-ordered-callback-proposal-2026-10-07/case.json').read_text())
    assert closure['ready'] and not closure['pending']
    assert len(case['setupEntries'])+case['recordStage']['count']+len(case['tailStages'])==2011
    assert not set(closure['realEntries'])&set(case['forbiddenEntries'])
    for address,row in closure['calls'].items():
        encoded=bytes.fromhex(closure['instructions'][address]['bytes'])
        assert encoded[0]==0xe8 and len(encoded)==5
        target=int(address,16)+5+struct.unpack_from('<i',encoded,1)[0]
        assert target==int(row['target'],16) and int(row['return'],16)==int(address,16)+5
    assert 'unicorn' not in sys.modules
    spec=importlib.util.spec_from_file_location('mission2_source_only_probe',HERE/'probe.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    assert 'unicorn' not in sys.modules
    assert hashlib.sha256(module.CASE_PATH.read_bytes()).hexdigest()==module.CASE_SHA
    mutations=[]
    def world(active=()):
        probe=module.Probe.__new__(module.Probe);probe.cpu=Memory()
        groups={'high':[i for i in range(1839,639,-1) if i not in active],
                'low':[i for i in range(639,0,-1) if i not in active],
                'active':list(active),'retiring':[],
                'secondaryFree':list(range(1999,1839,-1)),'secondaryActive':[]}
        for handle in range(2000):
            probe.write(0x890390+handle*4,'I',0x8e0428+handle*179 if handle else 0)
            probe.write(0x8e0428+handle*179+0x24,'H',handle)
        for (name,ids),head in zip(groups.items(),range(0x89031c,0x890334,4)):
            probe.write(head,'I',0x8e0428+ids[0]*179 if ids else 0)
            for index,handle in enumerate(ids):
                pointer=0x8e0428+handle*179
                probe.write(pointer,'II',0x8e0428+ids[index-1]*179 if index else 0,
                            0x8e0428+ids[index+1]*179 if index+1<len(ids) else 0)
                if name=='active':
                    probe.write(pointer+0x2a,'B',1);probe.write(pointer+0xc,'I',0x20000)
                    probe.write(pointer+0x20,'HH',ids[index+1] if index+1<len(ids) else 0,
                                ids[index-1] if index else 0)
        probe.write(0x8a03e4+6,'H',active[0] if active else 0)
        probe.write(0x89c651,'I',len(active));probe.write(0x89c659,'I',sum(i<640 for i in active))
        return probe
    empty=world();assert empty.partition()==dict(high=1200,low=639,active=0,retiring=0,secondaryFree=160,secondaryActive=0)
    active=world((1839,639,1838));assert active.partition()==dict(high=1198,low=638,active=3,retiring=0,secondaryFree=160,secondaryActive=0)
    tests=[
        ('free-backlink',(),0x8e0428+1839*179,'I',1),
        ('free-cycle',(),0x8e0428+640*179+4,'I',0x8e0428+1839*179),
        ('handle-alias',(),0x890390+1839*4,'I',0x8e0428+1838*179),
        ('missing-free-record',(),0x89031c,'I',0x8e0428+1838*179),
        ('free-class',(),0x8e0428+1839*179+0x2a,'B',1),
        ('occupancy-count',(),0x89c651,'I',1),
        ('active-class',(1839,639,1838),0x8e0428+1839*179+0x2a,'B',0),
        ('cell-backlink',(1839,639,1838),0x8e0428+639*179+0x22,'H',0),
        ('cell-position',(1839,639,1838),0x8e0428+639*179+0x3d,'H',512),
        ('registration-flag',(1839,639,1838),0x8e0428+639*179+0xc,'I',0),
        ('missing-cell-members',(1839,639,1838),0x8a03e4+6,'H',0),
        ('cell-cycle',(1839,639,1838),0x8e0428+1838*179+0x20,'H',1839),
    ]
    for name,ids,address,fmt,value in tests:
        probe=world(ids);probe.write(address,fmt,value)
        try:probe.partition()
        except AssertionError:mutations.append(name)
        else:raise AssertionError(('observer accepted corrupt partition',name))
    assert 'unicorn' not in sys.modules
    result={'status':'passed','mode':'host-only AST/JSON/call encoding and synthetic observer fault checks',
            'nativeExecution':False,'emulatorImported':False,'validPartitions':2,
            'rejectedCorruptions':mutations,'callSitesChecked':len(closure['calls']),
            'limits':'These synthetic memory checks validate the observer only; they are not original allocation or Mission2 results.'}
    (HERE/'host-source-checks.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))


if __name__=='__main__':main()
