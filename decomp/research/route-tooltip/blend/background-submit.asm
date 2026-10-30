
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00516a00 <.text+0x115a00>:
  516a00:	83 ec 08             	sub    esp,0x8
  516a03:	33 c0                	xor    eax,eax
  516a05:	33 c9                	xor    ecx,ecx
  516a07:	53                   	push   ebx
  516a08:	8a 44 24 16          	mov    al,BYTE PTR [esp+0x16]
  516a0c:	56                   	push   esi
  516a0d:	8a 4c 24 19          	mov    cl,BYTE PTR [esp+0x19]
  516a11:	57                   	push   edi
  516a12:	55                   	push   ebp
  516a13:	33 d2                	xor    edx,edx
  516a15:	8a 54 24 20          	mov    dl,BYTE PTR [esp+0x20]
  516a19:	bb ff 00 00 00       	mov    ebx,0xff
  516a1e:	83 3d 78 a0 5d 00 00 	cmp    DWORD PTR ds:0x5da078,0x0
  516a25:	74 1f                	je     0x516a46
  516a27:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  516a2b:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  516a2f:	8b 7c 24 1c          	mov    edi,DWORD PTR [esp+0x1c]
  516a33:	50                   	push   eax
  516a34:	51                   	push   ecx
  516a35:	57                   	push   edi
  516a36:	e8 15 14 01 00       	call   0x527e50
  516a3b:	83 c4 0c             	add    esp,0xc
  516a3e:	5d                   	pop    ebp
  516a3f:	5f                   	pop    edi
  516a40:	5e                   	pop    esi
  516a41:	5b                   	pop    ebx
  516a42:	83 c4 08             	add    esp,0x8
  516a45:	c3                   	ret
  516a46:	33 f6                	xor    esi,esi
  516a48:	f6 05 74 a0 5d 00 08 	test   BYTE PTR ds:0x5da074,0x8
  516a4f:	74 6c                	je     0x516abd
  516a51:	81 3d e8 a0 5d 00 60 	cmp    DWORD PTR ds:0x5da0e8,0x974560
  516a58:	45 97 00 
  516a5b:	75 08                	jne    0x516a65
  516a5d:	8b 1d 7c a0 5d 00    	mov    ebx,DWORD PTR ds:0x5da07c
  516a63:	eb 6c                	jmp    0x516ad1
  516a65:	8a 44 24 24          	mov    al,BYTE PTR [esp+0x24]
  516a69:	33 c9                	xor    ecx,ecx
  516a6b:	0c 0f                	or     al,0xf
  516a6d:	8a c8                	mov    cl,al
  516a6f:	a1 e8 a0 5d 00       	mov    eax,ds:0x5da0e8
  516a74:	c1 e1 08             	shl    ecx,0x8
  516a77:	8a 04 01             	mov    al,BYTE PTR [ecx+eax*1]
  516a7a:	33 c9                	xor    ecx,ecx
  516a7c:	88 44 24 14          	mov    BYTE PTR [esp+0x14],al
  516a80:	33 c0                	xor    eax,eax
  516a82:	8a 44 24 14          	mov    al,BYTE PTR [esp+0x14]
  516a86:	33 d2                	xor    edx,edx
  516a88:	8a 5c 24 24          	mov    bl,BYTE PTR [esp+0x24]
  516a8c:	8a 0c 85 29 55 d0 00 	mov    cl,BYTE PTR [eax*4+0xd05529]
  516a93:	8a 14 85 2a 55 d0 00 	mov    dl,BYTE PTR [eax*4+0xd0552a]
  516a9a:	8d 34 85 00 00 00 00 	lea    esi,[eax*4+0x0]
  516aa1:	33 c0                	xor    eax,eax
  516aa3:	88 5c 24 10          	mov    BYTE PTR [esp+0x10],bl
  516aa7:	8a 86 28 55 d0 00    	mov    al,BYTE PTR [esi+0xd05528]
  516aad:	33 db                	xor    ebx,ebx
  516aaf:	80 64 24 10 0f       	and    BYTE PTR [esp+0x10],0xf
  516ab4:	8a 5c 24 10          	mov    bl,BYTE PTR [esp+0x10]
  516ab8:	c1 e3 04             	shl    ebx,0x4
  516abb:	eb 14                	jmp    0x516ad1
  516abd:	f6 05 74 a0 5d 00 10 	test   BYTE PTR ds:0x5da074,0x10
  516ac4:	74 10                	je     0x516ad6
  516ac6:	bb 00 01 00 00       	mov    ebx,0x100
  516acb:	2b 1d 7c a0 5d 00    	sub    ebx,DWORD PTR ds:0x5da07c
  516ad1:	be 40 00 00 00       	mov    esi,0x40
  516ad6:	8b 7c 24 1c          	mov    edi,DWORD PTR [esp+0x1c]
  516ada:	db 07                	fild   DWORD PTR [edi]
  516adc:	8b 2f                	mov    ebp,DWORD PTR [edi]
  516ade:	d9 15 d0 a1 5d 00    	fst    DWORD PTR ds:0x5da1d0
  516ae4:	d9 1d 70 a1 5d 00    	fstp   DWORD PTR ds:0x5da170
  516aea:	db 47 04             	fild   DWORD PTR [edi+0x4]
  516aed:	8b 6f 04             	mov    ebp,DWORD PTR [edi+0x4]
  516af0:	d9 15 94 a1 5d 00    	fst    DWORD PTR ds:0x5da194
  516af6:	d9 1d 74 a1 5d 00    	fstp   DWORD PTR ds:0x5da174
  516afc:	db 47 08             	fild   DWORD PTR [edi+0x8]
  516aff:	8b 6f 08             	mov    ebp,DWORD PTR [edi+0x8]
  516b02:	d9 15 b0 a1 5d 00    	fst    DWORD PTR ds:0x5da1b0
  516b08:	d9 1d 90 a1 5d 00    	fstp   DWORD PTR ds:0x5da190
  516b0e:	c1 e3 10             	shl    ebx,0x10
  516b11:	8b 7f 0c             	mov    edi,DWORD PTR [edi+0xc]
  516b14:	c1 e0 10             	shl    eax,0x10
  516b17:	0b d9                	or     ebx,ecx
  516b19:	c1 e3 08             	shl    ebx,0x8
  516b1c:	89 7c 24 10          	mov    DWORD PTR [esp+0x10],edi
  516b20:	db 44 24 10          	fild   DWORD PTR [esp+0x10]
  516b24:	0b d8                	or     ebx,eax
  516b26:	0b da                	or     ebx,edx
  516b28:	89 1d e0 a1 5d 00    	mov    DWORD PTR ds:0x5da1e0,ebx
  516b2e:	89 1d c0 a1 5d 00    	mov    DWORD PTR ds:0x5da1c0,ebx
  516b34:	d9 15 d4 a1 5d 00    	fst    DWORD PTR ds:0x5da1d4
  516b3a:	d9 1d b4 a1 5d 00    	fstp   DWORD PTR ds:0x5da1b4
  516b40:	56                   	push   esi
  516b41:	89 1d a0 a1 5d 00    	mov    DWORD PTR ds:0x5da1a0,ebx
  516b47:	6a 00                	push   0x0
  516b49:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  516b4f:	68 d0 a1 5d 00       	push   0x5da1d0
  516b54:	89 1d 80 a1 5d 00    	mov    DWORD PTR ds:0x5da180,ebx
  516b5a:	68 b0 a1 5d 00       	push   0x5da1b0
  516b5f:	68 90 a1 5d 00       	push   0x5da190
  516b64:	68 70 a1 5d 00       	push   0x5da170
  516b69:	e8 12 6e f6 ff       	call   0x47d980
  516b6e:	5d                   	pop    ebp
  516b6f:	5f                   	pop    edi
  516b70:	5e                   	pop    esi
  516b71:	5b                   	pop    ebx
  516b72:	83 c4 08             	add    esp,0x8
  516b75:	c3                   	ret
  516b76:	cc                   	int3
  516b77:	cc                   	int3
  516b78:	cc                   	int3
  516b79:	cc                   	int3
  516b7a:	cc                   	int3
  516b7b:	cc                   	int3
  516b7c:	cc                   	int3
  516b7d:	cc                   	int3
  516b7e:	cc                   	int3
  516b7f:	cc                   	int3
