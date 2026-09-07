#!/usr/bin/env python3
"""Decode the supplied SDT PCM banks and native cue table, without running the game."""
import argparse
import hashlib
import json
import struct
import wave
from pathlib import Path
from decomp import ROOT, inspect

# Original sample IDs are one-based: 0x5753d0 indexes the offset array at bank + id*4.
# 0x577680 preserves rate/bits and takes flag bit 0 as the stereo indicator.
def bank(path):
    b = path.read_bytes()
    if len(b) < 4: raise ValueError('Truncated SDT')
    count = struct.unpack_from('<I', b)[0]
    if not 0 < count <= (len(b)-4)//4: raise ValueError('Invalid SDT count')
    entries = []
    for i in range(count):
        offset = struct.unpack_from('<I', b, 4+i*4)[0]
        if offset < 4+count*4 or offset+40 > len(b): raise ValueError('Invalid SDT offset')
        header,size,name,rate,bits,flags,unknown,start,end = struct.unpack_from('<II16sHBBIII', b, offset)
        channels = 1+(flags&1)
        if header != 40 or not rate or bits not in (8,16) or flags not in (2,3): raise ValueError('Unsupported SDT encoding')
        if offset+header+size > len(b) or size % (channels*bits//8): raise ValueError('Invalid PCM length')
        if end and not 0 <= start < end <= size: raise ValueError('Invalid loop region')
        pcm = b[offset+header:offset+header+size]
        entries.append(({'id':i+1,'name':name.split(b'\0')[0].decode('ascii'),'rate':rate,'bits':bits,'channels':channels,'frames':size//(channels*bits//8),'loopStart':start,'loopEnd':end,'pcmSha256':hashlib.sha256(pcm).hexdigest()},pcm))
    return entries


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('game',type=Path);args=parser.parse_args()
    exe=args.game/'d3dpoptb.exe';identity=inspect(exe);b=exe.read_bytes();pe=struct.unpack_from('<I',b,60)[0]
    n=struct.unpack_from('<H',b,pe+6)[0];opt=struct.unpack_from('<H',b,pe+20)[0]
    def read(address,size):
        for i in range(n):
            _,vs,va,rs,raw=struct.unpack_from('<8sIIII',b,pe+24+opt+i*40)
            rva=address-0x400000
            if va<=rva and rva+size<=va+min(vs,rs):return b[raw+rva-va:raw+rva-va+size]
        raise ValueError('Unmapped cue table')
    banks={name:bank(args.game/'sound'/file) for name,file in [('sound','soundd2.sdt'),('fight','popfightnew.sdt')]}
    cues=[]
    for i in range(229):
        r=read(0x5acf60+i*12,12);first,alternate=struct.unpack_from('<HH',r)
        source='fight' if r[11] else 'sound'
        ids=list(range(first,first+r[5])) if first else []
        if any(s>len(banks[source]) for s in ids):raise ValueError('Cue outside bank')
        cues.append({'bank':source,'samples':ids,'pitchVariation':r[8],'volume':r[10],'priority':r[7],'frameGate':r[4]})
    output=ROOT/'public/original/audio';output.mkdir(parents=True,exist_ok=True)
    samples={}
    for name,entries in banks.items():
        samples[name]={}
        for info,pcm in entries:
            file=f"{name}-{info['id']}.wav"
            with wave.open(str(output/file),'wb') as wav:
                wav.setnchannels(info['channels']);wav.setsampwidth(info['bits']//8);wav.setframerate(info['rate']);wav.writeframes(pcm)
            with wave.open(str(output/file),'rb') as wav:
                assert wav.readframes(wav.getnframes())==pcm
                assert wav.getnframes()==info['frames']
            samples[name][str(info['id'])]={**info,'file':file}
    data={'executableSha256':identity['sha256'],'banks':{name:hashlib.sha256((args.game/'sound'/file).read_bytes()).hexdigest() for name,file in [('sound','soundd2.sdt'),('fight','popfightnew.sdt')]},'cues':cues,'samples':samples}
    (ROOT/'app/original-sound.json').write_text(json.dumps(data,separators=(',',':'))+'\n')
    assert samples['sound']['188']['name']=='Lghtng' and samples['sound']['42']['name']=='Sv_sel02'
    assert samples['sound']['102']['channels']==1 and samples['sound']['102']['rate']==22050
    assert samples['fight']['1']['name']=='Punch31'
    # Corrupt input must fail before extraction.
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        bad=Path(tmp)/'bad.sdt';bad.write_bytes(struct.pack('<II',1,0xffffffff))
        try:bank(bad)
        except ValueError:pass
        else:raise AssertionError('Corrupt bank accepted')
    print(f'Exported {sum(map(len,banks.values()))} PCM samples and {len(cues)} native cues; byte round-trips and corrupt-bank rejection passed')

if __name__=='__main__':main()
