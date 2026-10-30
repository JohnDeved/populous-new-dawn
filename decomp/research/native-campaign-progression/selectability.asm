
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0047ed20 <.text+0x7dd20>:
  47ed20:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  47ed24:	8d 0c 80             	lea    ecx,[eax+eax*4]
  47ed27:	8d 14 c8             	lea    edx,[eax+ecx*8]
  47ed2a:	66 8b 04 95 65 a3 89 	mov    ax,WORD PTR [edx*4+0x89a365]
  47ed31:	00
  47ed32:	a8 05                	test   al,0x5
  47ed34:	75 03                	jne    0x47ed39
  47ed36:	33 c0                	xor    eax,eax
  47ed38:	c3                   	ret
  47ed39:	b8 01 00 00 00       	mov    eax,0x1
  47ed3e:	c3                   	ret
  47ed3f:	cc                   	int3
  47ed40:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  47ed44:	48                   	dec    eax
  47ed45:	50                   	push   eax
  47ed46:	e8 f5 70 00 00       	call   0x485e40
  47ed4b:	83 c4 04             	add    esp,0x4
  47ed4e:	c3                   	ret
