"""Hosted read-only binding setup. Never launch target executables or use ldd."""
from pathlib import Path
import hashlib, json, os, re, subprocess, sys, sysconfig, time

CHROME_VERSION = 'Google Chrome 156.0.8078.79'
# Chromium a21ce95c24ce3964416f09ae1862f53f319eb4d0: ui/qt/qt_ui.cc
# dynamically tries Qt5/Qt6 alternatives; failed initialization is handled by
# ui/linux/linux_ui_factory.cc with alternate toolkit/built-in UI fallback.
# These remain hashed resources, and any required ELF edge promotes them.
QT_RESOURCES = frozenset(['/opt/google/chrome/libqt5_shim.so', '/opt/google/chrome/libqt6_shim.so'])

def admit_resource_policy(binding):
    assert binding['chromeVersion'] == CHROME_VERSION, 'Unreviewed Chrome version'
    assert binding['browser'] == '/opt/google/chrome/chrome', 'Unexpected browser root'

def resolve_needed(path, needed, paths, candidates):
    assert '/' not in needed
    found=next((directory/needed for directory in paths if (directory/needed).exists()),None)
    if found is None:
        available=candidates.get(needed,[])
        assert available, f'Unresolved static ELF dependency: {path}: {needed}'
        found=Path(available[0])
    return found

class ElfRoots:
    """Inventory identity and mandatory dependency traversal are independent."""
    def __init__(self):
        self.resources = set()
        self.required = set()
        self.pending = []

    def promote(self, path):
        path = Path(path)
        if path not in self.required:
            self.required.add(path)
            self.pending.append(path)

    def inventory(self, path, required=False):
        path = Path(path)
        self.resources.add(path)
        if required or str(path) not in QT_RESOURCES:
            self.promote(path)

def main():
    root=Path(sys.argv[1]).resolve(); binding=json.loads((root/'binding-input.json').read_text())
    admit_resource_policy(binding)
    files={}; links={}; directories={}; visited=set(); roots=ElfRoots(); start=time.monotonic()
    stdlib=Path(sysconfig.get_path('stdlib')).resolve()
    def deadline():
        assert time.monotonic()-start<170, 'Static runtime binding deadline'
    def add(path, required=False):
        deadline(); path=Path(path).absolute()
        assert path.exists(),str(path)
        # Bind every symlink in the resolution chain, not only the leaf.
        for part in [*reversed(path.parents),path]:
            if part.is_symlink():links[str(part)]=os.readlink(part)
        actual=path.resolve()
        if str(actual) in visited:
            if required and actual in roots.resources:roots.promote(actual)
            return
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
        if magic==b'\x7fELF':roots.inventory(actual, required)
    for manifest,key in [(binding['candidateManifest'],'sourceRoot'),(binding['infrastructureManifest'],'infrastructureRoot')]:
        for name in manifest['files']:add(Path(binding[key])/name)
    add(Path(binding['sourceRoot'])/'node_modules')
    for name in ['node','python','browser']:add(binding[name], required=True)
    add('/opt/google/chrome'); add(sysconfig.get_path('stdlib'))
    add('/etc/ld.so.cache');add('/usr/bin/readelf');add('/sbin/ldconfig')
    # ldconfig -p only lists the installed cache. ELF readers inspect bytes; no loader execution.
    cache=subprocess.check_output(['/sbin/ldconfig','-p'],text=True,timeout=5)
    candidates={}
    for line in cache.splitlines():
        match=re.match(r'\s*(\S+) \([^)]*x86-64[^)]*\) => (\S+)$',line)
        if match:candidates.setdefault(match[1],[]).append(match[2])
    processed=set()
    while roots.pending:
        deadline(); path=roots.pending.pop()
        if path in processed:continue
        processed.add(path)
        output=subprocess.check_output(['/usr/bin/readelf','-l','-d',str(path)],text=True,stderr=subprocess.PIPE,timeout=5)
        interp=re.search(r'Requesting program interpreter: ([^\]]+)',output)
        if interp:add(interp[1], required=True)
        paths=[]
        for raw in re.findall(r'\((?:RUNPATH|RPATH)\).*?\[([^\]]*)\]',output):
            for item in raw.split(':'):
                item=item.replace('${ORIGIN}',str(path.parent)).replace('$ORIGIN',str(path.parent))
                assert item.startswith('/') and '$' not in item, 'Unsupported ELF search path'
                paths.append(Path(item))
        for needed in re.findall(r'\(NEEDED\).*?\[([^\]]+)\]',output):
            found=resolve_needed(path, needed, paths, candidates)
            add(found, required=True)
    binding.pop('candidateManifest');binding.pop('infrastructureManifest');binding.pop('dependencyManifest')
    binding['directories']=directories
    binding['files']=sorted(files.values(),key=lambda item:item['path'])
    binding['links']=[{'path':path,'target':target} for path,target in sorted(links.items())]
    binding['tooling']['python']=sys.version
    binding['staticElfInputs']=sorted(str(path) for path in processed)
    binding['resourceOnlyElfInputs']=sorted(str(path) for path in roots.resources-roots.required)
    binding['elfResourcePolicy']={'chromeVersion':CHROME_VERSION,
        'chromiumCommit':'a21ce95c24ce3964416f09ae1862f53f319eb4d0',
        'inventoryOnlyCandidates':sorted(QT_RESOURCES),
        'rule':'Only optional dynamically loaded Qt toolkit alternatives are resource-only; required edges promote them. All other ELF roots remain mandatory.'}
    binding['runtimeLimitations']=['Static ELF graph and runtime resource files bound; late dlopen/driver selection is not attested.',
        'Library resolution uses recorded ELF paths and the installed x86-64 ldconfig cache; unsupported paths fail closed.']
    deadline()
    data=json.dumps(binding,indent=2)+'\n';assert len(data.encode())<=16*1024**2,'Binding metadata cap'
    with (root/'binding.json').open('x') as stream:stream.write(data)
if __name__=='__main__':main()
