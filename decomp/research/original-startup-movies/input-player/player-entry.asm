
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0057ae00 <.text+0x179e00>:
  57ae00:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  57ae04:	8b 4c 24 08          	mov    ecx,DWORD PTR [esp+0x8]
  57ae08:	8b 54 24 04          	mov    edx,DWORD PTR [esp+0x4]
  57ae0c:	56                   	push   esi
  57ae0d:	50                   	push   eax
  57ae0e:	51                   	push   ecx
  57ae0f:	52                   	push   edx
  57ae10:	e8 4b eb ff ff       	call   0x579960
  57ae15:	8b f0                	mov    esi,eax
  57ae17:	83 c4 0c             	add    esp,0xc
  57ae1a:	85 f6                	test   esi,esi
  57ae1c:	74 1d                	je     0x57ae3b
  57ae1e:	8b 06                	mov    eax,DWORD PTR [esi]
  57ae20:	56                   	push   esi
  57ae21:	c7 80 d8 03 00 00 01 	mov    DWORD PTR [eax+0x3d8],0x1
  57ae28:	00 00 00 
  57ae2b:	e8 b0 fa ff ff       	call   0x57a8e0
  57ae30:	83 c4 04             	add    esp,0x4
  57ae33:	85 c0                	test   eax,eax
  57ae35:	75 04                	jne    0x57ae3b
  57ae37:	8b c6                	mov    eax,esi
  57ae39:	5e                   	pop    esi
  57ae3a:	c3                   	ret
  57ae3b:	33 c0                	xor    eax,eax
  57ae3d:	5e                   	pop    esi
  57ae3e:	c3                   	ret
