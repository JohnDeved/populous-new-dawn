"""Hosted read-only binding setup. Never launch target executables or use ldd."""
from pathlib import Path
import hashlib, json, os, re, subprocess, sys, sysconfig, time

def main():
    root=Path(sys.argv[1]).resolve(); binding=json.loads((root/'binding-input.json').read_text())
    files={}; links={}; directories={}; visited=set(); elf=[]; start=time.monotonic()
    stdlib=Path(sysconfig.get_path('stdlib')).resolve()
    def deadline():
        assert time.monotonic()-start<170, 'Static runtime binding deadline'
    def add(path):
        deadline(); path=Path(path).absolute()
        assert path.exists(),str(path)
        # Bind every symlink in the resolution chain, not only the leaf.
        for part in [*reversed(path.parents),path]:
            if part.is_symlink():links[str(part)]=os.readlink(part)
        actual=path.resolve()
        if str(actual) in visited:return
        visited.add(str(actual))
        if actual.is_dir():
            excluded=['__pycache__','site-packages','dist-packages'] if actual==stdlib or stdlib in actual.parents else []
            directories[str(actual)]={'excluded':excluded,'names':sorted(child.name for child in actual.iterdir() if child.name not in excluded)}
            for child in sorted(actual.iterdir()):
                if child.name not in excluded:add(child)
            return
        assert actual.is_file(),str(actual)
        h=hashlib.sha256()
        with actual.open('rb') as stream:
            magic=stream.read(4);h.update(magic)
            while chunk:=stream.read(1024*1024):deadline();h.update(chunk)
        files[str(actual)]={'path':str(actual),'sha256':h.hexdigest(),'bytes':actual.stat().st_size,'mode':actual.stat().st_mode&0o7777}
        if magic==b'\x7fELF':elf.append(actual)
    for manifest,key in [(binding['candidateManifest'],'sourceRoot'),(binding['infrastructureManifest'],'infrastructureRoot')]:
        for name in manifest['files']:add(Path(binding[key])/name)
    add(Path(binding['sourceRoot'])/'node_modules')
    for name in ['node','python','browser']:add(binding[name])
    add('/opt/google/chrome'); add(sysconfig.get_path('stdlib'))
    add('/etc/ld.so.cache');add('/usr/bin/readelf');add('/sbin/ldconfig')
    # ldconfig -p only lists the installed cache. ELF readers inspect bytes; no loader execution.
    cache=subprocess.check_output(['/sbin/ldconfig','-p'],text=True,timeout=5)
    candidates={}
    for line in cache.splitlines():
        match=re.match(r'\s*(\S+) \([^)]*x86-64[^)]*\) => (\S+)$',line)
        if match:candidates.setdefault(match[1],[]).append(match[2])
    processed=set()
    while elf:
        deadline(); path=elf.pop()
        if path in processed:continue
        processed.add(path)
        output=subprocess.check_output(['/usr/bin/readelf','-l','-d',str(path)],text=True,stderr=subprocess.PIPE,timeout=5)
        interp=re.search(r'Requesting program interpreter: ([^\]]+)',output)
        if interp:add(interp[1])
        paths=[]
        for raw in re.findall(r'\((?:RUNPATH|RPATH)\).*?\[([^\]]*)\]',output):
            for item in raw.split(':'):
                item=item.replace('${ORIGIN}',str(path.parent)).replace('$ORIGIN',str(path.parent))
                assert item.startswith('/') and '$' not in item, 'Unsupported ELF search path'
                paths.append(Path(item))
        for needed in re.findall(r'\(NEEDED\).*?\[([^\]]+)\]',output):
            assert '/' not in needed
            found=next((directory/needed for directory in paths if (directory/needed).exists()),None)
            if found is None:
                available=candidates.get(needed,[])
                assert available, f'Unresolved static ELF dependency: {path}: {needed}'
                found=Path(available[0])
            add(found)
    binding.pop('candidateManifest');binding.pop('infrastructureManifest');binding.pop('dependencyManifest')
    binding['directories']=directories
    binding['files']=sorted(files.values(),key=lambda item:item['path'])
    binding['links']=[{'path':path,'target':target} for path,target in sorted(links.items())]
    binding['tooling']['python']=sys.version
    binding['staticElfInputs']=sorted(str(path) for path in processed)
    binding['runtimeLimitations']=['Static ELF graph and runtime resource files bound; late dlopen/driver selection is not attested.',
        'Library resolution uses recorded ELF paths and the installed x86-64 ldconfig cache; unsupported paths fail closed.']
    deadline()
    data=json.dumps(binding,indent=2)+'\n';assert len(data.encode())<=16*1024**2,'Binding metadata cap'
    with (root/'binding.json').open('x') as stream:stream.write(data)
if __name__=='__main__':main()
