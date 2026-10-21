
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044a280 <.text+0x49280>:
  44a280:	57                   	push   edi
  44a281:	33 c0                	xor    eax,eax
  44a283:	bf 10 42 68 00       	mov    edi,0x684210
  44a288:	b9 2e 21 00 00       	mov    ecx,0x212e
  44a28d:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  44a28f:	66 ab                	stos   WORD PTR es:[edi],ax
  44a291:	c6 05 c9 c6 68 00 ff 	mov    BYTE PTR ds:0x68c6c9,0xff
  44a298:	c7 05 b7 c6 68 00 00 	mov    DWORD PTR ds:0x68c6b7,0x0
  44a29f:	00 00 00 
  44a2a2:	b8 01 00 00 00       	mov    eax,0x1
  44a2a7:	a3 10 42 68 00       	mov    ds:0x684210,eax
  44a2ac:	a3 08 45 68 00       	mov    ds:0x684508,eax
  44a2b1:	6a 00                	push   0x0
  44a2b3:	a3 18 42 68 00       	mov    ds:0x684218,eax
  44a2b8:	a3 c5 c6 68 00       	mov    ds:0x68c6c5,eax
  44a2bd:	a1 50 a8 5c 00       	mov    eax,ds:0x5ca850
  44a2c2:	03 c0                	add    eax,eax
  44a2c4:	a3 b3 c6 68 00       	mov    ds:0x68c6b3,eax
  44a2c9:	e8 52 83 05 00       	call   0x4a2620
  44a2ce:	83 c4 04             	add    esp,0x4
  44a2d1:	e8 0a 83 05 00       	call   0x4a25e0
  44a2d6:	a1 c5 c6 68 00       	mov    eax,ds:0x68c6c5
  44a2db:	50                   	push   eax
  44a2dc:	e8 6f 23 00 00       	call   0x44c650
  44a2e1:	83 c4 04             	add    esp,0x4
  44a2e4:	5f                   	pop    edi
  44a2e5:	c3                   	ret
  44a2e6:	cc                   	int3
  44a2e7:	cc                   	int3
  44a2e8:	cc                   	int3
  44a2e9:	cc                   	int3
  44a2ea:	cc                   	int3
  44a2eb:	cc                   	int3
  44a2ec:	cc                   	int3
  44a2ed:	cc                   	int3
  44a2ee:	cc                   	int3
  44a2ef:	cc                   	int3
