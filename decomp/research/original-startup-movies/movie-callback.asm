
game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0049cc50 <.text+0x9bc50>:
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
  49cc7d:	cc                   	int3
  49cc7e:	cc                   	int3
  49cc7f:	cc                   	int3
