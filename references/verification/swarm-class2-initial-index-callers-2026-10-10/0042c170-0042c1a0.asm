
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0042c170 <.text+0x2b170>:
  42c170:	66 c7 05 9e 5d 89 00 	mov    WORD PTR ds:0x895d9e,0x0
  42c177:	00 00 
  42c179:	f6 05 e4 8a 5a 00 02 	test   BYTE PTR ds:0x5a8ae4,0x2
  42c180:	b8 b8 8a 5a 00       	mov    eax,0x5a8ab8
  42c185:	75 14                	jne    0x42c19b
  42c187:	b9 02 00 00 00       	mov    ecx,0x2
  42c18c:	66 ff 05 9e 5d 89 00 	inc    WORD PTR ds:0x895d9e
  42c193:	83 c0 34             	add    eax,0x34
  42c196:	85 48 2c             	test   DWORD PTR [eax+0x2c],ecx
  42c199:	74 f1                	je     0x42c18c
  42c19b:	c3                   	ret
  42c19c:	cc                   	int3
  42c19d:	cc                   	int3
  42c19e:	cc                   	int3
  42c19f:	cc                   	int3
