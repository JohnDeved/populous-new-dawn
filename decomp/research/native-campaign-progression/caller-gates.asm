
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004585e5 <.text+0x575e5>:
  4585e5:	e8 96 2e 03 00       	call   0x48b480
  4585ea:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  4585f1:	74 05                	je     0x4585f8
  4585f3:	e9 18 25 05 00       	jmp    0x4aab10
  4585f8:	f6 05 7c d1 89 00 01 	test   BYTE PTR ds:0x89d17c,0x1
  4585ff:	74 0b                	je     0x45860c
  458601:	6a 07                	push   0x7
  458603:	e8 58 a4 fe ff       	call   0x442a60
  458608:	83 c4 04             	add    esp,0x4
  45860b:	c3                   	ret
  45860c:	c7 05 f4 c9 5f 00 00 	mov    DWORD PTR ds:0x5fc9f4,0x0
  458613:	00 00 00
  458616:	81 0d 61 c6 89 00 00 	or     DWORD PTR ds:0x89c661,0x4000000
  45861d:	00 00 04
  458620:	6a 01                	push   0x1
  458622:	e8 39 a3 fb ff       	call   0x412960
  458627:	83 c4 04             	add    esp,0x4
  45862a:	c3                   	ret
