"""One isolated seed + offline consumer pnpm reuse witness. No build or cache."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import signal
import stat
import subprocess
import time

from measure import measure
from offline_report import LIMIT, install_log, installer_exit_evidence
from receipt import EXPECTED_TOOLS, document, github_identity, payloads, seal

HEAD = '3032e0d6ae52b597187dfb434596eada4c702b82'
TREE = '5ab80bc0feaaf7969107fefb8fda0545074d046f'
PINS = {
    'package.json': '00d79488949acbc7b480b77cb6853e4d27a93dd4b827c569782bc0c26b5e2803',
    'package-lock.json': 'ee9f7ef0d2c55181e1221a1d619bfebc8e46d0b2196fa7147b2070119944fffd',
    'pnpm-lock.yaml': '65f88ce6928376938c053ec27d8fd23f1eea23807f97256cdd75d9495d02c3fd',
    'pnpm-workspace.yaml': 'a22ba417d9c5b244d5fe4b8baa54a9eb793ebf1dc70f62301755070eb8b14b40',
}
HOOKS = ('.npmrc', '.pnpmfile.cjs', 'pnpmfile.cjs', '.pnpmfile.mjs', 'pnpmfile.mjs')
DIR = Path(__file__).resolve().parent
ADMIT, RESERVE, INODES = 4*1024**3, 2*1024**3, 50000


def need(ok, why):
    if not ok:
        raise ValueError(why)


def check_room(p, floor=RESERVE):
    s = os.statvfs(p)
    available = s.f_bavail * s.f_frsize
    need(available >= floor and s.f_favail >= INODES, 'physical reserve/admission failed')
    return {'availableBytes': available, 'availableInodes': s.f_favail}


def digest(p):
    with p.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def capture(argv, cwd, env=None):
    return subprocess.run(argv, cwd=cwd, env=env, capture_output=True, text=True,
                          check=True, timeout=20).stdout.strip()


def no_nested(roots):
    for i, p in enumerate(roots):
        need(p.is_absolute() and p == p.resolve(strict=True) and p.is_dir(), 'not a physical root')
        need(not any(p.is_relative_to(q) or q.is_relative_to(p) for q in roots[:i]), 'roots overlap')
    need(len({p.stat().st_dev for p in roots}) == 1, 'all roots must share one device')


def verify_checkout(p, first=True):
    read = lambda *args: capture(['git', *args], p)
    need(read('rev-parse','--show-toplevel') == str(p) and read('rev-parse','HEAD') == HEAD,
         'wrong checkout HEAD or root')
    need(read('rev-parse','HEAD^{tree}') == TREE, 'wrong checkout tree')
    need(not read('status','--porcelain=v1','--untracked-files=no'), 'tracked data changed')
    need(not read('ls-tree','HEAD','--',*HOOKS), 'committed config/hooks are inadmissible')
    expected = {'.git', *PINS}
    if not first:
        expected.add('node_modules')
    need({x.name for x in p.iterdir()} == expected, 'checkout materialized unexpected paths')
    need((p/'.git').is_dir() and not (p/'.git').is_symlink(), 'not a private Git checkout')
    for f, sha in PINS.items():
        target = p/f
        need(stat.S_ISREG(target.lstat().st_mode) and digest(target) == sha, f'metadata changed: {f}')


def private_env(base, name):
    root = base/name
    root.mkdir(mode=0o700)
    env = {'PATH':os.environ['PATH'],'LANG':'C.UTF-8','CI':'true',
           'npm_config_manage_package_manager_versions':'false','npm_config_update_notifier':'false'}
    for var, leaf in [('HOME','home'),('XDG_CACHE_HOME','cache'),('XDG_CONFIG_HOME','config'),
                      ('XDG_DATA_HOME','data'),('XDG_STATE_HOME','state'),('TMPDIR','tmp')]:
        path=root/leaf
        path.mkdir(mode=0o700)
        env[var] = str(path)
    for var, leaf in [('npm_config_userconfig','user-npmrc'),('npm_config_globalconfig','global-npmrc')]:
        path=root/leaf
        path.touch(mode=0o600, exist_ok=False)
        env[var]=str(path)
    return root,env


class InstallerExit(Exception):
    def __init__(self, returncode, private_log):
        super().__init__('installer exited unsuccessfully')
        self.returncode = returncode
        self.private_log = private_log


def guarded(argv, cwd, env, log, reserve, seconds=120, poll=.25, cap=LIMIT):
    deadline=time.monotonic()+seconds
    reserve()
    with log.open('xb', buffering=0) as stream, subprocess.Popen(
        argv,cwd=cwd,env=env,stdout=stream,stderr=subprocess.STDOUT,start_new_session=True) as p:
        try:
            while True:
                reserve()
                need(os.fstat(stream.fileno()).st_size <= cap, 'installer log cap exceeded')
                remain=deadline-time.monotonic()
                if remain <= 0:
                    raise subprocess.TimeoutExpired(argv, seconds)
                try:
                    code=p.wait(timeout=min(poll,remain))
                except subprocess.TimeoutExpired:
                    continue
                reserve()
                need(os.fstat(stream.fileno()).st_size <= cap, 'installer log cap exceeded')
                if code != 0:
                    raise InstallerExit(code,log)
                # None of the fixed CLI commands should outlive its direct parent.
                # If a lingering descendant exists, signal it rather than measuring changing state.
                try:
                    os.killpg(p.pid,0)
                except ProcessLookupError:
                    return
                raise ValueError('unexpected surviving installer descendant')
        except BaseException:
            try:
                os.killpg(p.pid,signal.SIGKILL)
            except ProcessLookupError:
                pass
            p.wait()
            raise


def binding_key(x):
    return int(x['device']),int(x['inode'])


def admit_bindings(store, seed, warm):
    key=binding_key(seed)
    need(key == binding_key(warm), 'native files physically differ between checkouts')
    found=[]
    for d, _, files in os.walk(store,followlinks=False):
        for f in files:
            p=Path(d)/f;s=p.lstat()
            if stat.S_ISREG(s.st_mode) and (s.st_dev,s.st_ino) == key:
                found.append(str(p.relative_to(store)))
    need(found, 'shared native binding missing in declared store')
    return sorted(found)


def main(seed,warm,experiment):
    stage='admission'
    receipt={}
    reserve=lambda:check_room(experiment)
    try:
        no_nested([seed,warm,experiment])
        need(not any(experiment.iterdir()),'experiment must begin empty')
        verify_checkout(seed);verify_checkout(warm)
        receipt['admission']=check_room(experiment,ADMIT)
        receipt.update(head=HEAD,tree=TREE,metadataSha256=PINS,device=experiment.stat().st_dev)
        stage='bootstrap'
        boot,env=private_env(experiment,'bootstrap')
        prefix=boot/'prefix';prefix.mkdir()
        env['npm_config_cache']=str(boot/'npm-cache')
        guarded(['npm','install','--global','--prefix',str(prefix),'--ignore-scripts','--no-audit',
                 '--no-fund','--fetch-retries=0','pnpm@11.25.0'],boot,env,
                experiment/'bootstrap.log',reserve,seconds=90)
        envs={}
        for role in ('seed','warm'):
            _, e=private_env(experiment,role);e['PATH']=str(prefix/'bin')+os.pathsep+e['PATH']
            envs[role]=e
        stage='toolchain'
        env=envs['seed']
        node=capture(['node','--version'],seed,env); pnpm=capture(['pnpm','--version'],seed,env)
        platform=capture(['node','-p','process.platform+"/"+process.arch+"/"+Boolean(process.report.getReport().header.glibcVersionRuntime)'],seed,env)
        need(dict(node=node,pnpm=pnpm,platform=platform)==EXPECTED_TOOLS,'toolchain mismatch')
        store=experiment/'store'; vstore=store/'v11'
        need(capture(['pnpm','store','path','--store-dir',str(store)],seed,env)==str(vstore)
             and not os.path.lexists(store),'wrong or pre-populated store')
        receipt.update(node=node,pnpm=pnpm,platform=platform,arms={})
        for role,p in [('seed',seed),('warm',warm)]:
            stage=role+'-install'
            verify_checkout(p)
            e=envs[role]; log=experiment/(role+'.log')
            flags=['--offline'] if role=='warm' else []
            args=['pnpm','install','--frozen-lockfile','--ignore-scripts','--store-dir',str(store),
                  '--reporter','append-only',*flags]
            guard_start=time.monotonic()
            guarded(args,p,e,log,reserve)
            seconds=round(time.monotonic()-guard_start,3)
            proof=install_log(log,offline=bool(flags))
            verify_checkout(p,first=False)
            for path in [p/'node_modules',p/'node_modules/.pnpm',vstore]:
                need(path == path.resolve(strict=True) and path.is_dir(),'nonphysical store or install dir')
            layout=p/'node_modules/.pnpm/lock.yaml'
            need(stat.S_ISREG(layout.lstat().st_mode) and digest(layout)==PINS['pnpm-lock.yaml'],
                 'installed virtual lock differs from source')
            stage=role+'-native-smoke'
            smoke=json.loads(capture(['node',str(DIR/'smoke.cjs'),str(p)],p,e))
            receipt['arms'][role]={'offline':bool(flags),'frozen':True,'ignoredScripts':True,
                                   'seconds':seconds,'smoke':smoke,'headroom':reserve(),**proof}
        stage='physical-proof'
        verify_checkout(seed,first=False);verify_checkout(warm,first=False)
        receipt['nativeBindingMatchesInStore']=admit_bindings(
            vstore, receipt['arms']['seed']['smoke'], receipt['arms']['warm']['smoke'])
        receipt['physical']=measure(vstore,seed/'node_modules',warm/'node_modules')
        receipt.update(status='passed',scope='two sparse same-revision checkouts; pnpm offline mode only; no build, network or RAM savings claim')
        return receipt
    except (InstallerExit,ValueError,OSError,subprocess.SubprocessError) as e:
        # Do not include subprocess output, environment values, or arbitrary exception strings.
        reason='timeout' if isinstance(e,subprocess.TimeoutExpired) else {
            'physical reserve/admission failed':'reserve',
            'installer log cap exceeded':'log-cap',
            'installer exited unsuccessfully':'installer-exit',
            'unexpected surviving installer descendant':'surviving-process',
        }.get(str(e),'validation')
        receipt.update(status='failed',stage=stage,errorClass=type(e).__name__,failureReason=reason)
        if isinstance(e, InstallerExit):
            receipt['installerExit']=installer_exit_evidence(
                e.private_log,e.returncode,stage in {'seed-install','warm-install'})
        return receipt


if __name__=='__main__':
    cli=argparse.ArgumentParser()
    for role in ('seed','warm','experiment'):cli.add_argument('--'+role,type=Path,required=True)
    cli.add_argument('--receipt-dir',type=Path,required=True)
    cli.add_argument('--pinfile',type=Path,required=True)
    a=cli.parse_args()
    head=capture(['git','rev-parse','HEAD'],DIR)
    ident=github_identity(os.environ,head)
    pins=payloads(DIR,a.pinfile)
    result=main(a.seed,a.warm,a.experiment)
    body=document(ident,pins,HEAD,TREE,PINS,result)
    seal(a.receipt_dir,Path(os.environ['RUNNER_TEMP']),body)
    print(json.dumps({'status':result['status'],'stage':result.get('stage'),
                      'receiptBytes':len(body),'receiptSha256':hashlib.sha256(body).hexdigest()},sort_keys=True))
    raise SystemExit(0 if result['status']=='passed' else 2)
