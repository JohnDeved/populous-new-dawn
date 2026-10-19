
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004eeff0 <.text+0xedff0>:
  4eeff0:	83 ec 04             	sub    esp,0x4
  4eeff3:	53                   	push   ebx
  4eeff4:	56                   	push   esi
  4eeff5:	57                   	push   edi
  4eeff6:	32 db                	xor    bl,bl
  4eeff8:	8b 74 24 14          	mov    esi,DWORD PTR [esp+0x14]
  4eeffc:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4eefff:	a8 02                	test   al,0x2
  4ef001:	0f 85 e4 00 00 00    	jne    0x4ef0eb
  4ef007:	33 c9                	xor    ecx,ecx
  4ef009:	8a 4e 30             	mov    cl,BYTE PTR [esi+0x30]
  4ef00c:	8b d1                	mov    edx,ecx
  4ef00e:	8d 3c 89             	lea    edi,[ecx+ecx*4]
  4ef011:	8d 0c bf             	lea    ecx,[edi+edi*4]
  4ef014:	f6 84 11 a8 7b 5a 00 	test   BYTE PTR [ecx+edx*1+0x5a7ba8],0x2
  4ef01b:	02
  4ef01c:	0f 85 c9 00 00 00    	jne    0x4ef0eb
  4ef022:	a9 00 00 08 00       	test   eax,0x80000
  4ef027:	0f 85 be 00 00 00    	jne    0x4ef0eb
  4ef02d:	66 8b 46 3f          	mov    ax,WORD PTR [esi+0x3f]
  4ef031:	8d 7e 3d             	lea    edi,[esi+0x3d]
  4ef034:	66 8b 0f             	mov    cx,WORD PTR [edi]
  4ef037:	50                   	push   eax
  4ef038:	51                   	push   ecx
  4ef039:	e8 02 f9 f5 ff       	call   0x44e940
  4ef03e:	83 c4 08             	add    esp,0x8
  4ef041:	66 3b 46 41          	cmp    ax,WORD PTR [esi+0x41]
  4ef045:	0f 8c a0 00 00 00    	jl     0x4ef0eb
  4ef04b:	57                   	push   edi
  4ef04c:	e8 2f 09 f6 ff       	call   0x44f980
  4ef051:	83 c4 04             	add    esp,0x4
  4ef054:	84 c0                	test   al,al
  4ef056:	0f 85 88 00 00 00    	jne    0x4ef0e4
  4ef05c:	8b 56 10             	mov    edx,DWORD PTR [esi+0x10]
  4ef05f:	f7 c2 00 00 80 00    	test   edx,0x800000
  4ef065:	75 0b                	jne    0x4ef072
  4ef067:	b3 01                	mov    bl,0x1
  4ef069:	5f                   	pop    edi
  4ef06a:	8a c3                	mov    al,bl
  4ef06c:	5e                   	pop    esi
  4ef06d:	5b                   	pop    ebx
  4ef06e:	83 c4 04             	add    esp,0x4
  4ef071:	c3                   	ret
  4ef072:	66 83 be 9f 00 00 00 	cmp    WORD PTR [esi+0x9f],0x0
  4ef079:	00
  4ef07a:	75 6f                	jne    0x4ef0eb
  4ef07c:	66 8b 07             	mov    ax,WORD PTR [edi]
  4ef07f:	66 8b 4e 3f          	mov    cx,WORD PTR [esi+0x3f]
  4ef083:	88 64 24 0e          	mov    BYTE PTR [esp+0xe],ah
  4ef087:	33 c0                	xor    eax,eax
  4ef089:	88 6c 24 0f          	mov    BYTE PTR [esp+0xf],ch
  4ef08d:	66 8b 44 24 0e       	mov    ax,WORD PTR [esp+0xe]
  4ef092:	33 c9                	xor    ecx,ecx
  4ef094:	66 8b 4c 24 0e       	mov    cx,WORD PTR [esp+0xe]
  4ef099:	25 fe 00 00 00       	and    eax,0xfe
  4ef09e:	03 c0                	add    eax,eax
  4ef0a0:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  4ef0a6:	0b c1                	or     eax,ecx
  4ef0a8:	33 c9                	xor    ecx,ecx
  4ef0aa:	8a 04 85 f0 03 8a 00 	mov    al,BYTE PTR [eax*4+0x8a03f0]
  4ef0b1:	24 0f                	and    al,0xf
  4ef0b3:	8a c8                	mov    cl,al
  4ef0b5:	8b c1                	mov    eax,ecx
  4ef0b7:	c1 e1 03             	shl    ecx,0x3
  4ef0ba:	2b c8                	sub    ecx,eax
  4ef0bc:	f6 04 4d 28 a3 5a 00 	test   BYTE PTR [ecx*2+0x5aa328],0x3c
  4ef0c3:	3c
  4ef0c4:	74 13                	je     0x4ef0d9
  4ef0c6:	f7 c2 00 00 00 01    	test   edx,0x1000000
  4ef0cc:	75 1d                	jne    0x4ef0eb
  4ef0ce:	b3 01                	mov    bl,0x1
  4ef0d0:	5f                   	pop    edi
  4ef0d1:	8a c3                	mov    al,bl
  4ef0d3:	5e                   	pop    esi
  4ef0d4:	5b                   	pop    ebx
  4ef0d5:	83 c4 04             	add    esp,0x4
  4ef0d8:	c3                   	ret
  4ef0d9:	b3 01                	mov    bl,0x1
  4ef0db:	5f                   	pop    edi
  4ef0dc:	8a c3                	mov    al,bl
  4ef0de:	5e                   	pop    esi
  4ef0df:	5b                   	pop    ebx
  4ef0e0:	83 c4 04             	add    esp,0x4
  4ef0e3:	c3                   	ret
  4ef0e4:	81 66 10 ff ff ff fe 	and    DWORD PTR [esi+0x10],0xfeffffff
  4ef0eb:	8a c3                	mov    al,bl
  4ef0ed:	5f                   	pop    edi
  4ef0ee:	5e                   	pop    esi
  4ef0ef:	5b                   	pop    ebx
  4ef0f0:	83 c4 04             	add    esp,0x4
  4ef0f3:	c3                   	ret
