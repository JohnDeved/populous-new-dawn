
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0049cfa0 <.text+0x9bfa0>:
  49cfa0:	8a 44 24 04          	mov    al,BYTE PTR [esp+0x4]
  49cfa4:	f6 d0                	not    al
  49cfa6:	20 05 d4 ea 96 00    	and    BYTE PTR ds:0x96ead4,al
  49cfac:	75 0a                	jne    0x49cfb8
  49cfae:	a1 48 a8 5c 00       	mov    eax,ds:0x5ca848
  49cfb3:	a3 50 a8 5c 00       	mov    ds:0x5ca850,eax
  49cfb8:	c3                   	ret
  49cfb9:	cc                   	int3
  49cfba:	cc                   	int3
  49cfbb:	cc                   	int3
  49cfbc:	cc                   	int3
  49cfbd:	cc                   	int3
  49cfbe:	cc                   	int3
  49cfbf:	cc                   	int3
