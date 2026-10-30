
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00485e40 <.text+0x84e40>:
  485e40:	33 c0                	xor    eax,eax
  485e42:	8b 4c 24 04          	mov    ecx,DWORD PTR [esp+0x4]
  485e46:	8d 14 89             	lea    edx,[ecx+ecx*4]
  485e49:	8d 0c d1             	lea    ecx,[ecx+edx*8]
  485e4c:	f6 04 8d 09 a4 89 00 	test   BYTE PTR [ecx*4+0x89a409],0x1
  485e53:	01
  485e54:	74 05                	je     0x485e5b
  485e56:	b8 03 00 00 00       	mov    eax,0x3
  485e5b:	c3                   	ret
