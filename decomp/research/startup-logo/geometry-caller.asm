
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0057c1e0 <.text+0x17b1e0>:
  57c1e0:	83 ec 70             	sub    esp,0x70
  57c1e3:	53                   	push   ebx
  57c1e4:	8b c2                	mov    eax,edx
  57c1e6:	55                   	push   ebp
  57c1e7:	56                   	push   esi
  57c1e8:	8b 10                	mov    edx,DWORD PTR [eax]
  57c1ea:	8b 40 0c             	mov    eax,DWORD PTR [eax+0xc]
  57c1ed:	8b f1                	mov    esi,ecx
  57c1ef:	57                   	push   edi
  57c1f0:	b9 1b 00 00 00       	mov    ecx,0x1b
  57c1f5:	8d 7c 24 14          	lea    edi,[esp+0x14]
  57c1f9:	89 86 a0 03 00 00    	mov    DWORD PTR [esi+0x3a0],eax
  57c1ff:	33 c0                	xor    eax,eax
  57c201:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  57c203:	8b ce                	mov    ecx,esi
  57c205:	89 54 24 10          	mov    DWORD PTR [esp+0x10],edx
  57c209:	33 db                	xor    ebx,ebx
  57c20b:	33 ed                	xor    ebp,ebp
  57c20d:	c7 44 24 14 6c 00 00 	mov    DWORD PTR [esp+0x14],0x6c
  57c214:	00 
  57c215:	e8 76 0d 00 00       	call   0x57cf90
  57c21a:	8b ce                	mov    ecx,esi
  57c21c:	e8 2f 05 00 00       	call   0x57c750
