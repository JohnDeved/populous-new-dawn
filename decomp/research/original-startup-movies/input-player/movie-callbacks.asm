
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0049cc10 <.text+0x9bc10>:
  49cc10:	83 7c 24 08 00       	cmp    DWORD PTR [esp+0x8],0x0
  49cc15:	74 0a                	je     0x49cc21
  49cc17:	c7 05 64 a8 5c 00 01 	mov    DWORD PTR ds:0x5ca864,0x1
  49cc1e:	00 00 00 
  49cc21:	b8 01 00 00 00       	mov    eax,0x1
  49cc26:	c3                   	ret
  49cc27:	cc                   	int3
  49cc28:	cc                   	int3
  49cc29:	cc                   	int3
  49cc2a:	cc                   	int3
  49cc2b:	cc                   	int3
  49cc2c:	cc                   	int3
  49cc2d:	cc                   	int3
  49cc2e:	cc                   	int3
  49cc2f:	cc                   	int3
  49cc30:	83 7c 24 08 00       	cmp    DWORD PTR [esp+0x8],0x0
  49cc35:	74 0a                	je     0x49cc41
  49cc37:	c7 05 64 a8 5c 00 01 	mov    DWORD PTR ds:0x5ca864,0x1
  49cc3e:	00 00 00 
  49cc41:	b8 01 00 00 00       	mov    eax,0x1
  49cc46:	c3                   	ret
  49cc47:	cc                   	int3
  49cc48:	cc                   	int3
  49cc49:	cc                   	int3
  49cc4a:	cc                   	int3
  49cc4b:	cc                   	int3
  49cc4c:	cc                   	int3
  49cc4d:	cc                   	int3
  49cc4e:	cc                   	int3
  49cc4f:	cc                   	int3
  49cc50:	6a 00                	push   0x0
  49cc52:	6a 00                	push   0x0
  49cc54:	68 68 a8 5c 00       	push   0x5ca868
  49cc59:	e8 22 9e 08 00       	call   0x526a80
  49cc5e:	83 c4 0c             	add    esp,0xc
  49cc61:	83 3d 64 a8 5c 00 00 	cmp    DWORD PTR ds:0x5ca864,0x0
  49cc68:	74 10                	je     0x49cc7a
  49cc6a:	c7 05 64 a8 5c 00 00 	mov    DWORD PTR ds:0x5ca864,0x0
  49cc71:	00 00 00 
  49cc74:	b8 01 00 00 00       	mov    eax,0x1
  49cc79:	c3                   	ret
  49cc7a:	33 c0                	xor    eax,eax
  49cc7c:	c3                   	ret
