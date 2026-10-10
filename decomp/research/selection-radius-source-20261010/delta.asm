
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00461d40 <.text+0x60d40>:
  461d40:	8b 54 24 08          	mov    edx,DWORD PTR [esp+0x8]
  461d44:	8b 4c 24 04          	mov    ecx,DWORD PTR [esp+0x4]
  461d48:	8b c2                	mov    eax,edx
  461d4a:	2b c1                	sub    eax,ecx
  461d4c:	79 04                	jns    0x461d52
  461d4e:	2b ca                	sub    ecx,edx
  461d50:	8b c1                	mov    eax,ecx
  461d52:	3d 80 00 00 00       	cmp    eax,0x80
  461d57:	7e 09                	jle    0x461d62
  461d59:	b9 00 01 00 00       	mov    ecx,0x100
  461d5e:	2b c8                	sub    ecx,eax
  461d60:	8b c1                	mov    eax,ecx
  461d62:	c3                   	ret
  461d63:	cc                   	int3
  461d64:	cc                   	int3
  461d65:	cc                   	int3
  461d66:	cc                   	int3
  461d67:	cc                   	int3
  461d68:	cc                   	int3
  461d69:	cc                   	int3
  461d6a:	cc                   	int3
  461d6b:	cc                   	int3
  461d6c:	cc                   	int3
  461d6d:	cc                   	int3
  461d6e:	cc                   	int3
  461d6f:	cc                   	int3
