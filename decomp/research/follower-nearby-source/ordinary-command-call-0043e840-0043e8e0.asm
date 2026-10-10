
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0043e840 <.text+0x3d840>:
  43e840:	d3 79 89             	sar    DWORD PTR [ecx-0x77],cl
  43e843:	00 ba 04 00 00 00    	add    BYTE PTR [edx+0x4],bh
  43e849:	33 c0                	xor    eax,eax
  43e84b:	66 89 46 04          	mov    WORD PTR [esi+0x4],ax
  43e84f:	66 8b 4e 02          	mov    cx,WORD PTR [esi+0x2]
  43e853:	66 41                	inc    cx
  43e855:	66 89 4e 02          	mov    WORD PTR [esi+0x2],cx
  43e859:	66 83 f9 64          	cmp    cx,0x64
  43e85d:	7c 04                	jl     0x43e863
  43e85f:	66 89 46 02          	mov    WORD PTR [esi+0x2],ax
  43e863:	81 c6 e2 05 00 00    	add    esi,0x5e2
  43e869:	4a                   	dec    edx
  43e86a:	75 df                	jne    0x43e84b
  43e86c:	c6 44 24 13 01       	mov    BYTE PTR [esp+0x13],0x1
  43e871:	ff 05 84 d1 89 00    	inc    DWORD PTR ds:0x89d184
  43e877:	8a 44 24 13          	mov    al,BYTE PTR [esp+0x13]
  43e87b:	5d                   	pop    ebp
  43e87c:	5f                   	pop    edi
  43e87d:	5e                   	pop    esi
  43e87e:	5b                   	pop    ebx
  43e87f:	83 c4 10             	add    esp,0x10
  43e882:	c3                   	ret
  43e883:	cc                   	int3
  43e884:	cc                   	int3
  43e885:	cc                   	int3
  43e886:	cc                   	int3
  43e887:	cc                   	int3
  43e888:	cc                   	int3
  43e889:	cc                   	int3
  43e88a:	cc                   	int3
  43e88b:	cc                   	int3
  43e88c:	cc                   	int3
  43e88d:	cc                   	int3
  43e88e:	cc                   	int3
  43e88f:	cc                   	int3
  43e890:	f6 05 46 f7 98 00 10 	test   BYTE PTR ds:0x98f746,0x10
  43e897:	53                   	push   ebx
  43e898:	56                   	push   esi
  43e899:	57                   	push   edi
  43e89a:	55                   	push   ebp
  43e89b:	75 34                	jne    0x43e8d1
  43e89d:	be 8c d1 89 00       	mov    esi,0x89d18c
  43e8a2:	bf c8 d1 89 00       	mov    edi,0x89d1c8
  43e8a7:	bd 04 00 00 00       	mov    ebp,0x4
  43e8ac:	33 db                	xor    ebx,ebx
  43e8ae:	38 9f 20 0c 00 00    	cmp    BYTE PTR [edi+0xc20],bl
  43e8b4:	74 0f                	je     0x43e8c5
  43e8b6:	38 5e 0c             	cmp    BYTE PTR [esi+0xc],bl
  43e8b9:	74 0a                	je     0x43e8c5
  43e8bb:	56                   	push   esi
  43e8bc:	57                   	push   edi
  43e8bd:	e8 1e 00 00 00       	call   0x43e8e0
  43e8c2:	83 c4 08             	add    esp,0x8
  43e8c5:	83 c6 0f             	add    esi,0xf
  43e8c8:	81 c7 65 0c 00 00    	add    edi,0xc65
  43e8ce:	4d                   	dec    ebp
  43e8cf:	75 dd                	jne    0x43e8ae
  43e8d1:	5d                   	pop    ebp
  43e8d2:	5f                   	pop    edi
  43e8d3:	5e                   	pop    esi
  43e8d4:	5b                   	pop    ebx
  43e8d5:	c3                   	ret
  43e8d6:	cc                   	int3
  43e8d7:	cc                   	int3
  43e8d8:	cc                   	int3
  43e8d9:	cc                   	int3
  43e8da:	cc                   	int3
  43e8db:	cc                   	int3
  43e8dc:	cc                   	int3
  43e8dd:	cc                   	int3
  43e8de:	cc                   	int3
  43e8df:	cc                   	int3
