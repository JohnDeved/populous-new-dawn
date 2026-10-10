
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0040b130 <.text+0xa130>:
  40b130:	56                   	push   esi
  40b131:	8b 74 24 08          	mov    esi,DWORD PTR [esp+0x8]
  40b135:	85 f6                	test   esi,esi
  40b137:	74 12                	je     0x40b14b
  40b139:	56                   	push   esi
  40b13a:	e8 f1 00 00 00       	call   0x40b230
  40b13f:	83 c4 04             	add    esp,0x4
  40b142:	56                   	push   esi
  40b143:	e8 38 40 0e 00       	call   0x4ef180
  40b148:	83 c4 04             	add    esp,0x4
  40b14b:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  40b14f:	85 f6                	test   esi,esi
  40b151:	74 19                	je     0x40b16c
  40b153:	6a 01                	push   0x1
  40b155:	8a 46 2f             	mov    al,BYTE PTR [esi+0x2f]
  40b158:	6a 07                	push   0x7
  40b15a:	50                   	push   eax
  40b15b:	e8 f0 03 01 00       	call   0x41b550
  40b160:	83 c4 0c             	add    esp,0xc
  40b163:	56                   	push   esi
  40b164:	e8 17 40 0e 00       	call   0x4ef180
  40b169:	83 c4 04             	add    esp,0x4
  40b16c:	5e                   	pop    esi
  40b16d:	c3                   	ret
  40b16e:	cc                   	int3
  40b16f:	cc                   	int3
