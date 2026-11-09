
game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00523170 <.text+0x122170>:
  523170:	83 3d 6a bc 89 00 0b 	cmp    DWORD PTR ds:0x89bc6a,0xb
  523177:	75 1c                	jne    0x523195
  523179:	33 c0                	xor    eax,eax
  52317b:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  523180:	50                   	push   eax
  523181:	6a 00                	push   0x0
  523183:	6a 00                	push   0x0
  523185:	6a 01                	push   0x1
  523187:	68 f8 dc 5d 00       	push   0x5ddcf8
  52318c:	e8 ef 9a f7 ff       	call   0x49cc80
  523191:	83 c4 14             	add    esp,0x14
  523194:	c3                   	ret
  523195:	33 c0                	xor    eax,eax
  523197:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  52319c:	50                   	push   eax
  52319d:	6a 00                	push   0x0
  52319f:	6a 00                	push   0x0
  5231a1:	6a 01                	push   0x1
  5231a3:	68 e8 dc 5d 00       	push   0x5ddce8
  5231a8:	e8 d3 9a f7 ff       	call   0x49cc80
  5231ad:	83 c4 14             	add    esp,0x14
  5231b0:	c3                   	ret
