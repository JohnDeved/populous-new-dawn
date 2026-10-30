
004ff480-004ff4b0.bin:     file format binary


Disassembly of section .data:

004ff480 <.data>:
  4ff480:	80 3d e7 c6 89 00 0c 	cmp    BYTE PTR ds:0x89c6e7,0xc
  4ff487:	75 09                	jne    0x4ff492
  4ff489:	80 3d e8 c6 89 00 00 	cmp    BYTE PTR ds:0x89c6e8,0x0
  4ff490:	74 0c                	je     0x4ff49e
  4ff492:	80 3d e7 c6 89 00 10 	cmp    BYTE PTR ds:0x89c6e7,0x10
  4ff499:	74 03                	je     0x4ff49e
  4ff49b:	33 c0                	xor    eax,eax
  4ff49d:	c3                   	ret
  4ff49e:	b8 01 00 00 00       	mov    eax,0x1
  4ff4a3:	c3                   	ret
  4ff4a4:	cc                   	int3
  4ff4a5:	cc                   	int3
  4ff4a6:	cc                   	int3
  4ff4a7:	cc                   	int3
  4ff4a8:	cc                   	int3
  4ff4a9:	cc                   	int3
  4ff4aa:	cc                   	int3
  4ff4ab:	cc                   	int3
  4ff4ac:	cc                   	int3
  4ff4ad:	cc                   	int3
  4ff4ae:	cc                   	int3
  4ff4af:	cc                   	int3
