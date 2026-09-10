#!/usr/bin/env python3
"""Extract original percussion and convert MP2 drones for browser streaming.
Usage: python scripts/import-music.py GAME_DIRECTORY
Requires decomp/extraction-requirements.txt. No original binaries are executed.
"""
import hashlib,json,struct,subprocess,sys,tempfile,wave
from pathlib import Path
import imageio_ffmpeg
from decomp import ROOT,inspect

def entries(path):
    raw=path.read_bytes()
    if len(raw)<4:raise ValueError('Truncated music bank')
    count=struct.unpack_from('<I',raw)[0]
    if not 0<count<64 or 4+count*4>len(raw):raise ValueError('Invalid sample count')
    for i in range(count):
        offset=struct.unpack_from('<I',raw,4+i*4)[0]
        if offset<4+count*4 or offset+40>len(raw):raise ValueError('Invalid header offset')
        header,size,name,rate,bits,flags,unused,start,end=struct.unpack_from('<II16sHBBIII',raw,offset)
        if header!=40 or rate!=22050 or bits!=16 or flags not in (3,131,37):raise ValueError('Unsupported music encoding')
        # Bit 128 is a timed silence descriptor, with no payload. Its next bytes
        # belong to the next sample header (native 0x570833 / 0x577880 / 0x577920).
        if not flags&128 and offset+40+size>len(raw):raise ValueError('Truncated sample')
        if flags!=37 and size%4:raise ValueError('Invalid stereo PCM length')
        payload=b'' if flags&128 else raw[offset+40:offset+40+size]
        yield dict(id=i+1,name=name.split(b'\0')[0].decode('ascii'),rate=rate,frames=size//4,flags=flags,sourceBytes=size,sourceSha256=hashlib.sha256(payload).hexdigest()),payload

def verify(game):
    report=json.loads((ROOT/'app/original-music.json').read_text());out=ROOT/'public/original/audio'
    assert inspect(game/'d3dpoptb.exe')['sha256']==report['executableSha256']
    for name,sha in report['banks'].items():assert hashlib.sha256((game/'sound'/name).read_bytes()).hexdigest()==sha
    for bank,clips in enumerate(report['drums']):
        for (info,pcm),clip in zip(entries(game/'sound'/f'popdrum{bank}22.sdt'),clips):
            assert all(clip[k]==v for k,v in info.items())
            if clip['file']:
                with wave.open(str(out/clip['file']),'rb') as wav:
                    assert wav.getnchannels()==2 and wav.getframerate()==clip['rate'] and wav.getnframes()==clip['frames']
                    assert wav.readframes(wav.getnframes())==pcm
            else:assert info['flags']==131 and not pcm
    for (info,mp2),clip in zip(entries(game/'sound'/'popdrones22.sdt'),report['drones']):
        assert hashlib.sha256(mp2).hexdigest()==clip['sourceSha256']
        assert hashlib.sha256((out/clip['file']).read_bytes()).hexdigest()==clip['fileSha256']
    with tempfile.TemporaryDirectory() as tmp:
        path=Path(tmp)/'bad.sdt'
        for raw in [b'',struct.pack('<II',1,0xffffffff),struct.pack('<I',1000)]:
            path.write_bytes(raw)
            try:list(entries(path))
            except ValueError:pass
            else:raise AssertionError('Corrupt bank accepted')
    print('PASS: original bank identities, 29 byte-exact stereo drum assets, 10 silence descriptors, 5 drone source/output hashes and corrupt-bank rejection')

def main():
    game=Path(sys.argv[1]);identity=inspect(game/'d3dpoptb.exe');out=ROOT/'public/original/audio';out.mkdir(exist_ok=True)
    if '--check' in sys.argv:return verify(game)
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe();report=dict(executableSha256=identity['sha256'],ffmpeg=imageio_ffmpeg.get_ffmpeg_version(),banks={},drones=[],drums=[])
    for bank in range(10):
        source=game/'sound'/f'popdrum{bank}22.sdt';report['banks'][source.name]=hashlib.sha256(source.read_bytes()).hexdigest();clips=[]
        for info,pcm in entries(source):
            assert info['flags'] in (3,131)
            if info['flags']&128:info['file']=None
            else:
                file=f"drum-{bank}-{info['id']}.wav";info['file']=file
                with wave.open(str(out/file),'wb') as wav:
                    wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(info['rate']);wav.writeframes(pcm)
                with wave.open(str(out/file),'rb') as wav:assert wav.readframes(wav.getnframes())==pcm
            clips.append(info)
        report['drums'].append(clips)
    source=game/'sound'/'popdrones22.sdt';report['banks'][source.name]=hashlib.sha256(source.read_bytes()).hexdigest()
    with tempfile.TemporaryDirectory() as tmp:
        for info,mp2 in entries(source):
            assert info['flags']==37
            src=Path(tmp)/'drone.mp2';src.write_bytes(mp2);decoded=Path(tmp)/'drone.wav'
            subprocess.run([ffmpeg,'-v','error','-y','-i',str(src),'-c:a','pcm_s16le',str(decoded)],check=True)
            with wave.open(str(decoded),'rb') as wav:
                assert wav.getnchannels()==2 and wav.getframerate()==22050
                info['frames']=wav.getnframes();info['decodedPcmSha256']=hashlib.sha256(wav.readframes(wav.getnframes())).hexdigest()
            file=f"drone-{info['id']}.m4a";info['file']=file
            subprocess.run([ffmpeg,'-v','error','-y','-i',str(src),'-c:a','aac','-b:a','160k','-movflags','+faststart',str(out/file)],check=True)
            info['fileSha256']=hashlib.sha256((out/file).read_bytes()).hexdigest();report['drones'].append(info)
    assert len(report['drones'])==5 and sum(map(len,report['drums']))==39
    (ROOT/'app/original-music.json').write_text(json.dumps(report,indent=2)+'\n')
    print('Imported 5 original MP2 drones as streaming AAC, 29 exact PCM drum clips and 10 timed silence descriptors')
if __name__=='__main__':main()
