
/workspace/shared/populous-prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004b26c0 <.text+0xb16c0>:
  4b26c0:	57                   	push   edi
  4b26c1:	33 c0                	xor    eax,eax
  4b26c3:	bf 50 f6 98 00       	mov    edi,0x98f650
  4b26c8:	b9 40 00 00 00       	mov    ecx,0x40
  4b26cd:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4b26cf:	aa                   	stos   BYTE PTR es:[edi],al
  4b26d0:	b8 01 00 00 00       	mov    eax,0x1
  4b26d5:	5f                   	pop    edi
  4b26d6:	66 a3 48 f7 98 00    	mov    ds:0x98f748,ax
  4b26dc:	66 a3 4a f7 98 00    	mov    ds:0x98f74a,ax
  4b26e2:	b8 ff ff ff ff       	mov    eax,0xffffffff
  4b26e7:	a3 0a f7 98 00       	mov    ds:0x98f70a,eax
  4b26ec:	a3 0e f7 98 00       	mov    ds:0x98f70e,eax
  4b26f1:	c3                   	ret
