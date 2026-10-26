
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0057bb30 <.text+0x17ab30>:
  57bb30:	83 ec 6c             	sub    esp,0x6c
  57bb33:	56                   	push   esi
  57bb34:	8b f1                	mov    esi,ecx
  57bb36:	57                   	push   edi
  57bb37:	b9 1b 00 00 00       	mov    ecx,0x1b
  57bb3c:	33 c0                	xor    eax,eax
  57bb3e:	8d 7c 24 08          	lea    edi,[esp+0x8]
  57bb42:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  57bb44:	8b 06                	mov    eax,DWORD PTR [esi]
  57bb46:	c7 44 24 08 6c 00 00 	mov    DWORD PTR [esp+0x8],0x6c
  57bb4d:	00 
  57bb4e:	8d 54 24 08          	lea    edx,[esp+0x8]
  57bb52:	8b 40 14             	mov    eax,DWORD PTR [eax+0x14]
  57bb55:	52                   	push   edx
  57bb56:	50                   	push   eax
  57bb57:	8b 08                	mov    ecx,DWORD PTR [eax]
  57bb59:	ff 51 58             	call   DWORD PTR [ecx+0x58]
  57bb5c:	85 c0                	test   eax,eax
  57bb5e:	75 0e                	jne    0x57bb6e
  57bb60:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  57bb64:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  57bb68:	89 46 04             	mov    DWORD PTR [esi+0x4],eax
  57bb6b:	89 4e 08             	mov    DWORD PTR [esi+0x8],ecx
  57bb6e:	5f                   	pop    edi
  57bb6f:	5e                   	pop    esi
  57bb70:	83 c4 6c             	add    esp,0x6c
  57bb73:	c3                   	ret
