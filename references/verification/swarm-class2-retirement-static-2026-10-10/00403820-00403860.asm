
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00403820 <.text+0x2820>:
  403820:	56                   	push   esi
  403821:	8b 74 24 08          	mov    esi,DWORD PTR [esp+0x8]
  403825:	f6 46 14 40          	test   BYTE PTR [esi+0x14],0x40
  403829:	75 20                	jne    0x40384b
  40382b:	56                   	push   esi
  40382c:	e8 2f 00 00 00       	call   0x403860
  403831:	83 c4 04             	add    esp,0x4
  403834:	8a 86 af 00 00 00    	mov    al,BYTE PTR [esi+0xaf]
  40383a:	3c ff                	cmp    al,0xff
  40383c:	74 0d                	je     0x40384b
  40383e:	6a 01                	push   0x1
  403840:	6a 04                	push   0x4
  403842:	50                   	push   eax
  403843:	e8 08 7d 01 00       	call   0x41b550
  403848:	83 c4 0c             	add    esp,0xc
  40384b:	56                   	push   esi
  40384c:	e8 9f a4 0e 00       	call   0x4edcf0
  403851:	83 c4 04             	add    esp,0x4
  403854:	5e                   	pop    esi
  403855:	c3                   	ret
  403856:	cc                   	int3
  403857:	cc                   	int3
  403858:	cc                   	int3
  403859:	cc                   	int3
  40385a:	cc                   	int3
  40385b:	cc                   	int3
  40385c:	cc                   	int3
  40385d:	cc                   	int3
  40385e:	cc                   	int3
  40385f:	cc                   	int3
