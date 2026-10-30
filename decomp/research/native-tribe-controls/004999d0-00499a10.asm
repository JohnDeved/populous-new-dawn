
004999d0-00499a10.bin:     file format binary


Disassembly of section .data:

004999d0 <.data>:
  4999d0:	a1 a8 5d 89 00       	mov    eax,ds:0x895da8
  4999d5:	25 00 00 10 00       	and    eax,0x100000
  4999da:	83 f8 01             	cmp    eax,0x1
  4999dd:	1b c0                	sbb    eax,eax
  4999df:	f7 d8                	neg    eax
  4999e1:	c3                   	ret
  4999e2:	cc                   	int3
  4999e3:	cc                   	int3
  4999e4:	cc                   	int3
  4999e5:	cc                   	int3
  4999e6:	cc                   	int3
  4999e7:	cc                   	int3
  4999e8:	cc                   	int3
  4999e9:	cc                   	int3
  4999ea:	cc                   	int3
  4999eb:	cc                   	int3
  4999ec:	cc                   	int3
  4999ed:	cc                   	int3
  4999ee:	cc                   	int3
  4999ef:	cc                   	int3
  4999f0:	81 25 a8 5d 89 00 ff 	and    DWORD PTR ds:0x895da8,0xffefffff
  4999f7:	ff ef ff
  4999fa:	c3                   	ret
  4999fb:	cc                   	int3
  4999fc:	cc                   	int3
  4999fd:	cc                   	int3
  4999fe:	cc                   	int3
  4999ff:	cc                   	int3
  499a00:	81 0d a8 5d 89 00 00 	or     DWORD PTR ds:0x895da8,0x100000
  499a07:	00 10 00
  499a0a:	c3                   	ret
  499a0b:	cc                   	int3
  499a0c:	cc                   	int3
  499a0d:	cc                   	int3
  499a0e:	cc                   	int3
  499a0f:	cc                   	int3
