
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00430bb0 <.text+0x2fbb0>:
  430bb0:	57                   	push   edi
  430bb1:	33 c0                	xor    eax,eax
  430bb3:	bf 70 3b 68 00       	mov    edi,0x683b70
  430bb8:	b9 9e 01 00 00       	mov    ecx,0x19e
  430bbd:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  430bbf:	66 ab                	stos   WORD PTR es:[edi],ax
  430bc1:	bf bf a1 96 00       	mov    edi,0x96a1bf
  430bc6:	b9 c0 00 00 00       	mov    ecx,0xc0
  430bcb:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  430bcd:	5f                   	pop    edi
  430bce:	c3                   	ret
  430bcf:	cc                   	int3
