
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004860c0 <.text+0x850c0>:
  4860c0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4860c4:	53                   	push   ebx
  4860c5:	56                   	push   esi
  4860c6:	83 f8 63             	cmp    eax,0x63
  4860c9:	57                   	push   edi
  4860ca:	55                   	push   ebp
  4860cb:	0f 84 88 00 00 00    	je     0x486159
  4860d1:	be 0a 07 96 00       	mov    esi,0x96070a
  4860d6:	bf a9 a3 89 00       	mov    edi,0x89a3a9
  4860db:	b9 0e 00 00 00       	mov    ecx,0xe
  4860e0:	33 ed                	xor    ebp,ebp
  4860e2:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  4860e4:	33 c9                	xor    ecx,ecx
  4860e6:	8a 0d 99 b7 89 00    	mov    cl,BYTE PTR ds:0x89b799
  4860ec:	49                   	dec    ecx
  4860ed:	85 c9                	test   ecx,ecx
  4860ef:	7e 31                	jle    0x486122
  4860f1:	bb 1a 08 96 00       	mov    ebx,0x96081a
  4860f6:	8d 0c 80             	lea    ecx,[eax+eax*4]
  4860f9:	8d 34 c8             	lea    esi,[eax+ecx*8]
  4860fc:	8d 14 b5 0d a4 89 00 	lea    edx,[esi*4+0x89a40d]
  486103:	8b fa                	mov    edi,edx
  486105:	8b f3                	mov    esi,ebx
  486107:	b9 0c 00 00 00       	mov    ecx,0xc
  48610c:	83 c3 30             	add    ebx,0x30
  48610f:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  486111:	83 c2 30             	add    edx,0x30
  486114:	45                   	inc    ebp
  486115:	33 c9                	xor    ecx,ecx
  486117:	8a 0d 99 b7 89 00    	mov    cl,BYTE PTR ds:0x89b799
  48611d:	49                   	dec    ecx
  48611e:	3b cd                	cmp    ecx,ebp
  486120:	7f e1                	jg     0x486103
  486122:	8d 0c 80             	lea    ecx,[eax+eax*4]
  486125:	8d 04 c8             	lea    eax,[eax+ecx*8]
  486128:	8b 1d ae 08 96 00    	mov    ebx,DWORD PTR ds:0x9608ae
  48612e:	b9 aa 08 96 00       	mov    ecx,0x9608aa
  486133:	8d 14 85 01 a4 89 00 	lea    edx,[eax*4+0x89a401]
  48613a:	8d 34 85 00 00 00 00 	lea    esi,[eax*4+0x0]
  486141:	8b 01                	mov    eax,DWORD PTR [ecx]
  486143:	8b 49 08             	mov    ecx,DWORD PTR [ecx+0x8]
  486146:	89 02                	mov    DWORD PTR [edx],eax
  486148:	a1 b6 08 96 00       	mov    eax,ds:0x9608b6
  48614d:	89 5a 04             	mov    DWORD PTR [edx+0x4],ebx
  486150:	89 4a 08             	mov    DWORD PTR [edx+0x8],ecx
  486153:	89 86 a1 a4 89 00    	mov    DWORD PTR [esi+0x89a4a1],eax
  486159:	5d                   	pop    ebp
  48615a:	5f                   	pop    edi
  48615b:	5e                   	pop    esi
  48615c:	5b                   	pop    ebx
  48615d:	c3                   	ret
