
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00526fd0 <.text+0x125fd0>:
  526fd0:	83 3d b0 59 d0 00 00 	cmp    DWORD PTR ds:0xd059b0,0x0
  526fd7:	74 0b                	je     0x526fe4
  526fd9:	8b 0d b0 59 d0 00    	mov    ecx,DWORD PTR ds:0xd059b0
  526fdf:	e9 7c 70 00 00       	jmp    0x52e060
  526fe4:	33 c0                	xor    eax,eax
  526fe6:	c3                   	ret

INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0052e060 <.text+0x12d060>:
  52e060:	83 b9 e0 00 00 00 00 	cmp    DWORD PTR [ecx+0xe0],0x0
  52e067:	74 07                	je     0x52e070
  52e069:	8b 81 ec 00 00 00    	mov    eax,DWORD PTR [ecx+0xec]
  52e06f:	c3                   	ret
  52e070:	33 c0                	xor    eax,eax
  52e072:	c3                   	ret
