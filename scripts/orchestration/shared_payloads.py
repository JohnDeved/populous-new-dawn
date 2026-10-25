"""Bounded read-only payload authentication. No writes, installers or processes."""
import base64
import hashlib
import os
import re
import stat
from pathlib import PurePosixPath
from shared_shim import rebase_shim

MAX_PAYLOAD_BYTES = 16 * 1024**2
READ_BYTES = 65536

def require(ok,message):
    if not ok:raise ValueError(message)

def identity(s):
    return dict(device=s.st_dev,inode=s.st_ino,mode=s.st_mode,size=s.st_size,
                mtimeNs=s.st_mtime_ns,ctimeNs=s.st_ctime_ns,nlink=s.st_nlink,
                uid=s.st_uid,gid=s.st_gid)

def key(s):
    return [s.st_dev,s.st_ino,s.st_mode,s.st_size,s.st_mtime_ns,s.st_ctime_ns,
            s.st_nlink,s.st_uid,s.st_gid]

def open_parent(path):
    require(type(path)is str and '\x00'not in path and '\\'not in path,'Invalid path')
    p=PurePosixPath(path)
    require(p.is_absolute()and str(p)==path and '..'not in p.parts and path!='/','Noncanonical path')
    fd=os.open('/',os.O_RDONLY|os.O_DIRECTORY)
    try:
        for part in p.parts[1:-1]:
            child=os.open(part,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW,dir_fd=fd)
            os.close(fd);fd=child
        return fd,p.name
    except BaseException:os.close(fd);raise

def validate_metadata(row):
    require(type(row.get('bytes'))is int and 0<=row['bytes']<=MAX_PAYLOAD_BYTES,'Payload byte bound')
    require(type(row.get('sha256'))is str and re.fullmatch('[a-f0-9]{64}',row['sha256']),'Malformed SHA256')
    require(row.get('mode')in (0o600,0o644,0o755),'Invalid target mode')
    if 'blobSha'in row:require(type(row['blobSha'])is str and re.fullmatch('[a-f0-9]{40}',row['blobSha']),'Malformed Git OID')

def verify_file(path,row,checkpoint,anchor=None,target=False):
    validate_metadata(row)
    parent,name=open_parent(path)
    try:
        fd=os.open(name,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK,dir_fd=parent)
        try:
            before=os.fstat(fd);require(stat.S_ISREG(before.st_mode)and before.st_size==row['bytes'],'Descriptor file type/size differs')
            if anchor is not None:require(key(before)==anchor['key'],'Private source identity differs')
            if target:require(stat.S_IMODE(before.st_mode)==row['mode'],'Private target mode differs')
            digest=hashlib.sha256();git=hashlib.sha1(f"blob {row['bytes']}\0".encode());count=0
            while True:
                checkpoint();chunk=os.read(fd,READ_BYTES)
                if not chunk:break
                count+=len(chunk);require(count<=row['bytes'],'Descriptor file grew');digest.update(chunk);git.update(chunk)
            require(count==row['bytes']and key(before)==key(os.fstat(fd))==key(os.stat(name,dir_fd=parent,follow_symlinks=False)),'Descriptor file changed during authentication')
            require(digest.hexdigest()==row['sha256'],'Descriptor SHA256 differs')
            if anchor is not None:require(digest.hexdigest()==anchor['sha256'],'Private source anchor hash differs')
            if 'blobSha'in row:require(git.hexdigest()==row['blobSha'],'Descriptor Git blob OID differs')
            return identity(before)
        finally:os.close(fd)
    finally:os.close(parent)

def verify_inline(row,*,shim_source=None,shim_spec=None):
    """Authenticate one inline row; optional shim proof must be supplied together.

    Returned bytes are bounded per file, never aggregate payload materialization.
    A caller authenticates the shim source identity before passing its bytes.
    """
    validate_metadata(row)
    text=row.get('inlineBase64')
    require(type(text)is str and len(text)<=4*((MAX_PAYLOAD_BYTES+2)//3),'Inline payload bound')
    require('source'not in row and 'data'not in row,'Ambiguous inline source')
    body=base64.b64decode(text,validate=True)
    require(len(body)==row['bytes']and hashlib.sha256(body).hexdigest()==row['sha256'],'Inline SHA256/size differs')
    if 'blobSha'in row:require(hashlib.sha1(f'blob {len(body)}\0'.encode()+body).hexdigest()==row['blobSha'],'Inline Git OID differs')
    require((shim_source is None)==(shim_spec is None),'Incomplete shim proof')
    if shim_spec is not None:require(rebase_shim(shim_source,**shim_spec)==body,'Inline shim proof differs')
    return body
