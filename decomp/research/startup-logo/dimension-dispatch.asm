
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0057cf90 <.text+0x17bf90>:
  57cf90:	8b 81 a0 03 00 00    	mov    eax,DWORD PTR [ecx+0x3a0]
  57cf96:	48                   	dec    eax
  57cf97:	83 f8 06             	cmp    eax,0x6
  57cf9a:	77 1b                	ja     0x57cfb7
  57cf9c:	ff 24 85 b8 cf 57 00 	jmp    DWORD PTR [eax*4+0x57cfb8]
  57cfa3:	e9 38 00 00 00       	jmp    0x57cfe0
  57cfa8:	e9 53 00 00 00       	jmp    0x57d000
  57cfad:	e9 7e 00 00 00       	jmp    0x57d030
  57cfb2:	e9 f9 01 00 00       	jmp    0x57d1b0
  57cfb7:	c3                   	ret
