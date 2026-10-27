"""Incremental, fail-closed allocation accounting for a fresh owned directory.

This library does not enable runtime apply or admit a migration. Callers retain
resource, ownership, identity, review, final inventory and durability gates.
"""
import os
from pathlib import Path
import stat
import time

FIELDS=('size','mode','uid','gid','mtimeNs','blocks')


def key(s):
    return {'device':s.st_dev,'inode':s.st_ino,'size':s.st_size,'mode':s.st_mode,
            'uid':s.st_uid,'gid':s.st_gid,'mtimeNs':s.st_mtime_ns,'blocks':s.st_blocks*512}


def require(ok,message):
    if not ok:raise ValueError(message)


def checked_stat(path):
    path=Path(path)
    require(path.is_absolute() and '..' not in path.parts,'unsafe accounting path')
    fd=os.open('/',os.O_RDONLY|os.O_DIRECTORY)
    try:
        for part in path.parts[1:-1]:
            nxt=os.open(part,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW,dir_fd=fd);os.close(fd);fd=nxt
        return os.stat(path.name,dir_fd=fd,follow_symlinks=False)
    finally:os.close(fd)


def validate_borrowed(info,baseline):
    require(stat.S_ISREG(info['mode']),'Borrowed inode is not regular')
    require(all(info[k]==baseline[k] for k in FIELDS),'Borrowed inode identity/allocation changed')


PARENT_GROWTH_RESERVE_BYTES = 64 * 1024


class IncrementalBudget:
    def __init__(self,root,cap,receipt_reserve,borrowed_inodes=None,borrowed_paths=None,full_interval=1.0,capacity_check=lambda:None,clock=time.monotonic):
        self.root=str(Path(root));require(self.root==str(Path(root).absolute()),'Absolute accounting root required')
        require(type(cap) is int and type(receipt_reserve) is int and 0<receipt_reserve<cap,'Invalid allocation budget')
        require(0<full_interval<=5,'Full reconciliation interval outside bound')
        self.cap=cap;self.reserve=receipt_reserve;self.borrowed={tuple(k):dict(v) for k,v in (borrowed_inodes or {}).items()}
        for k,v in self.borrowed.items():
            require(len(k)==2 and all(type(x)is int for x in k),'Invalid borrowed inode key')
            require(all(type(v[f])is int for f in FIELDS) and stat.S_ISREG(v['mode']),'Incomplete borrowed baseline')
        self.borrowed_paths={str(p):tuple(k)for p,k in (borrowed_paths or {}).items()}
        require(not self.borrowed or self.borrowed_paths,'Borrowed inode exemptions need exact declared paths')
        for p,k in self.borrowed_paths.items():
            require(Path(p).is_absolute() and str(Path(p))==p and '..' not in Path(p).parts and Path(p).is_relative_to(self.root) and k in self.borrowed,'Invalid borrowed alias path')
        self.capacity_check=capacity_check;self.clock=clock;self.interval=full_interval
        s=checked_stat(self.root);require(stat.S_ISDIR(s.st_mode) and s.st_uid==os.getuid(),'Unowned accounting root')
        require(not os.listdir(self.root),'Accounting starts only on fresh empty root')
        self.root_id=(s.st_dev,s.st_ino,s.st_uid,s.st_gid)
        self.paths={self.root:key(s)};self.total=s.st_blocks*512;self.ceiling=self.total
        self.inode_blocks={(s.st_dev,s.st_ino):s.st_blocks*512}
        self.last_full=clock();self.full_scans=0;self.incremental_updates=0;self.last_admission=None;self.last_mutation=None;self.ceiling_admission=None
        self._enforce()

    @classmethod
    def restore_verified(cls,root,cap,receipt_reserve,expected_rows,*,borrowed_inodes,borrowed_paths,capacity_check,full_interval=5.0,clock=time.monotonic):
        """Read-only accountant seeding from exact pinned retained metadata.

        This does not authorize mutation or authenticate content. The caller must
        separately complete the strict retained-core content proof before writes.
        The normal fresh-root constructor remains unchanged.
        """
        require(type(expected_rows)is dict and 0<len(expected_rows)<=100000,'Exact retained rows required')
        self=cls.__new__(cls);self.root=str(Path(root))
        require(self.root==str(Path(root).absolute()) and self.root in expected_rows,'Retained accounting root missing')
        require(type(cap)is int and type(receipt_reserve)is int and 0<receipt_reserve<cap and 0<full_interval<=5,'Invalid retained budget')
        self.cap=cap;self.reserve=receipt_reserve;self.borrowed={tuple(k):dict(v)for k,v in borrowed_inodes.items()}
        self.borrowed_paths={str(p):tuple(k)for p,k in borrowed_paths.items()}
        for p,k in self.borrowed_paths.items():
            require(Path(p).is_absolute() and str(Path(p))==p and '..'not in Path(p).parts and Path(p).is_relative_to(self.root) and k in self.borrowed,'Invalid retained borrowed path')
        self.capacity_check=capacity_check;self.clock=clock;self.interval=full_interval
        for p,r in expected_rows.items():
            require(self._path(p)==p and type(r)is dict and set(r)=={'device','inode',*FIELDS},'Invalid retained row')
            require(all(type(v)is int for v in r.values()),'Invalid retained row values')
        initial=checked_stat(self.root);require(stat.S_ISDIR(initial.st_mode)and initial.st_uid==os.getuid(),'Unowned retained root')
        self.root_id=(initial.st_dev,initial.st_ino,initial.st_uid,initial.st_gid)
        rows=self._walk_rows();require(rows==expected_rows,'Retained metadata differs from pinned snapshot')
        self.paths=rows;self.total=self._sum(rows);self.ceiling=self.total
        self.inode_blocks={(r['device'],r['inode']):r['blocks']for r in rows.values()if(r['device'],r['inode'])not in self.borrowed}
        self.last_full=clock();self.full_scans=1;self.incremental_updates=0
        self.last_admission=None;self.last_mutation=None;self.ceiling_admission=None
        self._enforce();return self

    def _root(self):
        s=checked_stat(self.root)
        require((s.st_dev,s.st_ino,s.st_uid,s.st_gid)==self.root_id and stat.S_ISDIR(s.st_mode),'Accounting root replaced')
    def _path(self,p):
        p=str(p);q=Path(p)
        require(q.is_absolute() and str(q)==p and '..'not in q.parts and q.is_relative_to(self.root),'Touched path outside root')
        return p
    def _sum(self,rows):
        inodes={}
        for path,value in rows.items():
            inode=(value['device'],value['inode'])
            if inode in self.borrowed:
                require(self.borrowed_paths.get(path)==inode,'Undeclared borrowed alias path')
                validate_borrowed(value,self.borrowed[inode]);continue
            if inode in inodes:require(inodes[inode]==value['blocks'],'Inconsistent observed inode allocation')
            inodes[inode]=value['blocks']
        return sum(inodes.values())
    def _enforce(self):
        self.capacity_check();self._root()
        require(self.total+self.reserve<=self.cap,'Allocation plus terminal reserve exceeded')
    def admit(self,projected_bytes):
        require(type(projected_bytes)is int and projected_bytes>=0,'Invalid projected mutation')
        if self.clock()-self.last_full>=self.interval:self.reconcile()
        self._enforce()
        require(self.total+projected_bytes+self.reserve<=self.cap,'Next mutation exceeds allocation/receipt reserve')
        # A whole-file reservation remains valid across creation/write/fsync,
        # while account() charges observed blocks. Never exceeds the real cap.
        self.last_admission={"chargedBefore":self.total,"requestedBytes":projected_bytes,"priorCeiling":self.ceiling,"receiptReserveBytes":self.reserve}
        self.ceiling=max(self.ceiling,self.total+projected_bytes)
        self.last_admission["admittedCeiling"]=self.ceiling
        if self.ceiling>self.last_admission["priorCeiling"]:self.ceiling_admission=dict(self.last_admission)
    def account(self,paths):
        if paths is None:return self.reconcile()
        require(type(paths) in (list,tuple) and paths,'Touched paths required')
        observed={}
        for p in sorted(set(map(self._path,paths)),key=lambda p:len(Path(p).parts)):
            require(p==self.root or str(Path(p).parent) in self.paths or str(Path(p).parent) in observed,'Untracked touched parent')
            value=key(checked_stat(p));require(stat.S_ISDIR(value['mode']) or stat.S_ISREG(value['mode']) or stat.S_ISLNK(value['mode']),'Special output inode')
            old=self.paths.get(p)
            if old:require((old['device'],old['inode'],stat.S_IFMT(old['mode']))==(value['device'],value['inode'],stat.S_IFMT(value['mode'])),'Tracked path replaced')
            observed[p]=value
        updates={}
        for path,value in observed.items():
            inode=(value['device'],value['inode'])
            if inode in self.borrowed:
                require(self.borrowed_paths.get(path)==inode,'Undeclared borrowed alias path')
                validate_borrowed(value,self.borrowed[inode]);continue
            if inode in updates:require(updates[inode]==value['blocks'],'Inconsistent touched inode allocation')
            updates[inode]=value['blocks']
        new_total=self.total+sum(blocks-self.inode_blocks.get(inode,0)for inode,blocks in updates.items())
        self.last_mutation={'operation':'account-touched-paths','paths':list(observed),'chargedBefore':self.total,'chargedAfter':new_total,'chargedDelta':new_total-self.total,'admittedCeiling':self.ceiling,'reservation':self.last_admission,'ceilingOrigin':self.ceiling_admission,'inodes':[{'device':k[0],'inode':k[1],'beforeBytes':self.inode_blocks.get(k,0),'afterBytes':v}for k,v in updates.items()]}
        require(new_total<=self.ceiling,'Mutation exceeded admitted allocation')
        self.paths.update(observed);self.inode_blocks.update(updates);self.total=new_total;self.incremental_updates+=1;self._enforce()
        if self.clock()-self.last_full>=self.interval:self.reconcile()
    def _walk_rows(self,consume=None):
        # Open the root once through no-follow parents, then retain parent FDs.
        # No writer runs concurrently in this synchronous reconciliation phase.
        parts=Path(self.root).parts;fd=os.open('/',os.O_RDONLY|os.O_DIRECTORY)
        try:
            for part in parts[1:]:
                nxt=os.open(part,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW,dir_fd=fd);os.close(fd);fd=nxt
            rows={} if consume is None else None
            def observe(path,value):
                if consume is None:rows[path]=value
                else:consume(path,value)
            def stable(info):
                return (info.st_dev,info.st_ino,info.st_mode,info.st_size,info.st_mtime_ns,info.st_ctime_ns,info.st_nlink,info.st_uid,info.st_gid,info.st_blocks)
            def visit(directory,path):
                initial=os.fstat(directory);require(stat.S_ISDIR(initial.st_mode),'Traversal directory replaced')
                observe(path,key(initial))
                for name in os.listdir(directory):
                    child_path=path+'/'+name;before=os.stat(name,dir_fd=directory,follow_symlinks=False)
                    if stat.S_ISDIR(before.st_mode):
                        child=os.open(name,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW,dir_fd=directory)
                        try:
                            require(stable(os.fstat(child))==stable(before),'Directory changed before traversal')
                            visit(child,child_path)
                            require(stable(os.stat(name,dir_fd=directory,follow_symlinks=False))==stable(os.fstat(child)),'Directory name changed during traversal')
                        finally:os.close(child)
                    else:
                        require(stat.S_ISREG(before.st_mode)or stat.S_ISLNK(before.st_mode),'Special output inode')
                        observe(child_path,key(before))
                require(stable(os.fstat(directory))==stable(initial),'Directory changed during traversal')
            require((os.fstat(fd).st_dev,os.fstat(fd).st_ino,os.fstat(fd).st_uid,os.fstat(fd).st_gid)==self.root_id,'Traversal root replaced')
            visit(fd,self.root);self._root();return rows
        finally:os.close(fd)

    def reconcile(self):
        self._enforce()
        # Borrow only references to tracked path strings. Never retain a second
        # full per-path identity dictionary during a periodic scan.
        unseen=set(self.paths);inodes={};measured=0
        def observe(p,value):
            nonlocal measured
            require(p in unseen,'Unreported or duplicate output path discovered')
            unseen.remove(p);old=self.paths[p]
            require((old['device'],old['inode'],stat.S_IFMT(old['mode']))==(value['device'],value['inode'],stat.S_IFMT(value['mode'])),'Unreported path replacement')
            inode=(value['device'],value['inode'])
            expected_blocks=self.borrowed[inode]['blocks'] if inode in self.borrowed else self.inode_blocks[inode]
            require(value['blocks']==expected_blocks,'Unreported directory/index allocation growth')
            # Every legitimate mutation is already accounted through account().
            # An unreported metadata drift must fail, not silently refresh state.
            require(value==old,'Unreported output metadata drift')
            if inode in self.borrowed:
                require(self.borrowed_paths.get(p)==inode,'Undeclared borrowed alias path')
                validate_borrowed(value,self.borrowed[inode]);return
            if inode in inodes:require(inodes[inode]==value['blocks'],'Inconsistent observed inode allocation')
            else:inodes[inode]=value['blocks'];measured+=value['blocks']
        self._walk_rows(observe)
        require(not unseen,'Tracked output path disappeared')
        require(measured==self.total,'Incremental allocation differs from full walk')
        self._enforce();completed_at=self.clock()
        self.last_full=completed_at;self.full_scans+=1
        return self.total
    def report(self):
        return {'newAllocatedBytes':self.total,'capBytes':self.cap,'receiptReserveBytes':self.reserve,
                'trackedPaths':len(self.paths),'borrowedInodeCount':len(self.borrowed),
                'fullScans':self.full_scans,'incrementalUpdates':self.incremental_updates,'lastAdmission':self.last_admission,'ceilingAdmission':self.ceiling_admission,'lastMutation':self.last_mutation}
