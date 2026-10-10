
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00485050 <.text+0x84050>:
  485050:	e8 8b 01 00 00       	call   0x4851e0
  485055:	a1 24 03 89 00       	mov    eax,ds:0x890324
  48505a:	85 c0                	test   eax,eax
  48505c:	74 0c                	je     0x48506a
  48505e:	33 c9                	xor    ecx,ecx
  485060:	89 48 08             	mov    DWORD PTR [eax+0x8],ecx
  485063:	8b 40 04             	mov    eax,DWORD PTR [eax+0x4]
  485066:	85 c0                	test   eax,eax
  485068:	75 f6                	jne    0x485060
  48506a:	e8 31 16 00 00       	call   0x4866a0
  48506f:	e8 dc 8e 06 00       	call   0x4edf50
