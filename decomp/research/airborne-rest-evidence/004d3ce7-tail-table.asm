
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004d3ce7 <.text+0xd2ce7>:
  4d3ce7:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4d3cea:	83 e0 fb             	and    eax,0xfffffffb
  4d3ced:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4d3cf0:	25 ff df ff ff       	and    eax,0xffffdfff
  4d3cf5:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4d3cf8:	f6 46 11 04          	test   BYTE PTR [esi+0x11],0x4
  4d3cfc:	74 0b                	je     0x4d3d09
  4d3cfe:	80 4e 36 80          	or     BYTE PTR [esi+0x36],0x80
  4d3d02:	5f                   	pop    edi
  4d3d03:	5e                   	pop    esi
  4d3d04:	5b                   	pop    ebx
  4d3d05:	83 c4 08             	add    esp,0x8
  4d3d08:	c3                   	ret
  4d3d09:	66 81 66 35 ff 7f    	and    WORD PTR [esi+0x35],0x7fff
  4d3d0f:	5f                   	pop    edi
  4d3d10:	5e                   	pop    esi
  4d3d11:	5b                   	pop    ebx
  4d3d12:	83 c4 08             	add    esp,0x8
  4d3d15:	c3                   	ret
  4d3d16:	8b ff                	mov    edi,edi
  4d3d18:	86 33                	xchg   BYTE PTR [ebx],dh
  4d3d1a:	4d                   	dec    ebp
  4d3d1b:	00 e5                	add    ch,ah
  4d3d1d:	33 4d 00             	xor    ecx,DWORD PTR [ebp+0x0]
  4d3d20:	f5                   	cmc
  4d3d21:	33 4d 00             	xor    ecx,DWORD PTR [ebp+0x0]
  4d3d24:	05 34 4d 00 1a       	add    eax,0x1a004d34
  4d3d29:	34 4d                	xor    al,0x4d
  4d3d2b:	00 2a                	add    BYTE PTR [edx],ch
  4d3d2d:	34 4d                	xor    al,0x4d
  4d3d2f:	00 bb 34 4d 00 f9    	add    BYTE PTR [ebx-0x6ffb2cc],bh
  4d3d35:	34 4d                	xor    al,0x4d
  4d3d37:	00 09                	add    BYTE PTR [ecx],cl
  4d3d39:	35 4d 00 19 35       	xor    eax,0x3519004d
  4d3d3e:	4d                   	dec    ebp
  4d3d3f:	00 29                	add    BYTE PTR [ecx],ch
  4d3d41:	35 4d 00 82 35       	xor    eax,0x3582004d
  4d3d46:	4d                   	dec    ebp
  4d3d47:	00 a7 35 4d 00 0e    	add    BYTE PTR [edi+0xe004d35],ah
  4d3d4d:	36 4d                	ss dec ebp
  4d3d4f:	00 35 36 4d 00 45    	add    BYTE PTR ds:0x45004d36,dh
  4d3d55:	36 4d                	ss dec ebp
  4d3d57:	00 55 36             	add    BYTE PTR [ebp+0x36],dl
  4d3d5a:	4d                   	dec    ebp
  4d3d5b:	00 c8                	add    al,cl
  4d3d5d:	36 4d                	ss dec ebp
  4d3d5f:	00 f1                	add    cl,dh
  4d3d61:	36 4d                	ss dec ebp
  4d3d63:	00 df                	add    bh,bl
  4d3d65:	3a 4d 00             	cmp    cl,BYTE PTR [ebp+0x0]
