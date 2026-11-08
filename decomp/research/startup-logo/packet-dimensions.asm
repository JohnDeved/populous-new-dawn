
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0057d000 <.text+0x17c000>:
  57d000:	0f bf 02             	movsx  eax,WORD PTR [edx]
  57d003:	56                   	push   esi
  57d004:	8b 31                	mov    esi,DWORD PTR [ecx]
  57d006:	89 46 64             	mov    DWORD PTR [esi+0x64],eax
  57d009:	8b 31                	mov    esi,DWORD PTR [ecx]
  57d00b:	0f bf 42 02          	movsx  eax,WORD PTR [edx+0x2]
  57d00f:	89 46 60             	mov    DWORD PTR [esi+0x60],eax
  57d012:	33 c0                	xor    eax,eax
  57d014:	8a 42 04             	mov    al,BYTE PTR [edx+0x4]
  57d017:	5e                   	pop    esi
  57d018:	89 41 48             	mov    DWORD PTR [ecx+0x48],eax
  57d01b:	8a 42 07             	mov    al,BYTE PTR [edx+0x7]
  57d01e:	83 e0 02             	and    eax,0x2
  57d021:	89 41 40             	mov    DWORD PTR [ecx+0x40],eax
  57d024:	8a 52 07             	mov    dl,BYTE PTR [edx+0x7]
  57d027:	83 e2 01             	and    edx,0x1
  57d02a:	89 51 44             	mov    DWORD PTR [ecx+0x44],edx
  57d02d:	c3                   	ret
