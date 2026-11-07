
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00426b60 <.text+0x25b60>:
  426b60:	81 ec a8 02 00 00    	sub    esp,0x2a8
  426b66:	53                   	push   ebx
  426b67:	56                   	push   esi
  426b68:	57                   	push   edi
  426b69:	6a 01                	push   0x1
  426b6b:	6a 0c                	push   0xc
  426b6d:	bf a9 a3 89 00       	mov    edi,0x89a3a9
  426b72:	e8 89 c5 01 00       	call   0x443100
  426b77:	83 c4 08             	add    esp,0x8
  426b7a:	33 c0                	xor    eax,eax
  426b7c:	83 25 a8 5d 89 00 ef 	and    DWORD PTR ds:0x895da8,0xffffffef
  426b83:	b9 e6 04 00 00       	mov    ecx,0x4e6
  426b88:	f3 ab                	rep stos DWORD PTR es:[edi],eax
