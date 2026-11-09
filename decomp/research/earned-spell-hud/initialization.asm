
../populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0042ca00 <.text+0x2ba00>:
  42ca00:	83 ec 04             	sub    esp,0x4
  42ca03:	53                   	push   ebx
  42ca04:	56                   	push   esi
  42ca05:	57                   	push   edi
  42ca06:	33 db                	xor    ebx,ebx
  42ca08:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  42ca0f:	55                   	push   ebp
  42ca10:	75 1a                	jne    0x42ca2c
  42ca12:	be 41 b7 89 00       	mov    esi,0x89b741
  42ca17:	bf 0a 07 96 00       	mov    edi,0x96070a
  42ca1c:	b9 0e 00 00 00       	mov    ecx,0xe
  42ca21:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  42ca23:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  42ca2a:	74 72                	je     0x42ca9e
  42ca2c:	f6 05 61 bc 89 00 10 	test   BYTE PTR ds:0x89bc61,0x10
  42ca33:	74 69                	je     0x42ca9e
  42ca35:	a1 24 4d 89 00       	mov    eax,ds:0x894d24
  42ca3a:	01 05 78 d1 89 00    	add    DWORD PTR ds:0x89d178,eax
  42ca40:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  42ca45:	8b c8                	mov    ecx,eax
  42ca47:	8d 14 c0             	lea    edx,[eax+eax*8]
  42ca4a:	8d 04 d1             	lea    eax,[ecx+edx*8]
  42ca4d:	8d 04 81             	lea    eax,[ecx+eax*4]
  42ca50:	c1 e0 02             	shl    eax,0x2
  42ca53:	8d 04 c1             	lea    eax,[ecx+eax*8]
  42ca56:	05 df 24 00 00       	add    eax,0x24df
  42ca5b:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  42ca60:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  42ca64:	c1 4c 24 10 0d       	ror    DWORD PTR [esp+0x10],0xd
  42ca69:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  42ca6d:	b9 03 00 00 00       	mov    ecx,0x3
  42ca72:	2b d2                	sub    edx,edx
  42ca74:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  42ca79:	f7 f1                	div    ecx
  42ca7b:	85 d2                	test   edx,edx
  42ca7d:	74 0c                	je     0x42ca8b
  42ca7f:	83 fa 01             	cmp    edx,0x1
  42ca82:	74 0e                	je     0x42ca92
  42ca84:	83 fa 02             	cmp    edx,0x2
  42ca87:	74 10                	je     0x42ca99
  42ca89:	eb 13                	jmp    0x42ca9e
  42ca8b:	bb 15 00 00 00       	mov    ebx,0x15
  42ca90:	eb 0c                	jmp    0x42ca9e
  42ca92:	bb 12 00 00 00       	mov    ebx,0x12
  42ca97:	eb 05                	jmp    0x42ca9e
  42ca99:	bb 14 00 00 00       	mov    ebx,0x14
  42ca9e:	33 ff                	xor    edi,edi
  42caa0:	80 3d c0 ea 96 00 00 	cmp    BYTE PTR ds:0x96eac0,0x0
  42caa7:	0f 86 e9 00 00 00    	jbe    0x42cb96
  42caad:	57                   	push   edi
  42caae:	6a 11                	push   0x11
  42cab0:	e8 7b c3 fd ff       	call   0x408e30
  42cab5:	83 c4 08             	add    esp,0x8
  42cab8:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  42cabf:	75 3a                	jne    0x42cafb
  42cac1:	33 ed                	xor    ebp,ebp
  42cac3:	be d0 80 5a 00       	mov    esi,0x5a80d0
  42cac8:	66 8b 06             	mov    ax,WORD PTR [esi]
  42cacb:	66 85 c0             	test   ax,ax
  42cace:	74 06                	je     0x42cad6
  42cad0:	66 3d 02 00          	cmp    ax,0x2
  42cad4:	75 0a                	jne    0x42cae0
  42cad6:	57                   	push   edi
  42cad7:	55                   	push   ebp
  42cad8:	e8 83 61 09 00       	call   0x4c2c60
  42cadd:	83 c4 08             	add    esp,0x8
  42cae0:	83 c6 3e             	add    esi,0x3e
  42cae3:	45                   	inc    ebp
  42cae4:	81 fe e6 85 5a 00    	cmp    esi,0x5a85e6
  42caea:	76 dc                	jbe    0x42cac8
  42caec:	6a 00                	push   0x0
  42caee:	e8 cd 64 09 00       	call   0x4c2fc0
  42caf3:	83 c4 04             	add    esp,0x4
  42caf6:	e9 82 00 00 00       	jmp    0x42cb7d
  42cafb:	33 ed                	xor    ebp,ebp
  42cafd:	be d0 80 5a 00       	mov    esi,0x5a80d0
  42cb02:	81 fe fe 82 5a 00    	cmp    esi,0x5a82fe
  42cb08:	74 18                	je     0x42cb22
  42cb0a:	66 8b 06             	mov    ax,WORD PTR [esi]
  42cb0d:	66 85 c0             	test   ax,ax
  42cb10:	74 06                	je     0x42cb18
  42cb12:	66 3d 02 00          	cmp    ax,0x2
  42cb16:	75 0a                	jne    0x42cb22
  42cb18:	57                   	push   edi
  42cb19:	55                   	push   ebp
  42cb1a:	e8 41 61 09 00       	call   0x4c2c60
  42cb1f:	83 c4 08             	add    esp,0x8
  42cb22:	83 c6 3e             	add    esi,0x3e
  42cb25:	45                   	inc    ebp
  42cb26:	81 fe e6 85 5a 00    	cmp    esi,0x5a85e6
  42cb2c:	76 d4                	jbe    0x42cb02
  42cb2e:	f6 05 61 bc 89 00 02 	test   BYTE PTR ds:0x89bc61,0x2
  42cb35:	74 07                	je     0x42cb3e
  42cb37:	bb 15 00 00 00       	mov    ebx,0x15
  42cb3c:	eb 1e                	jmp    0x42cb5c
  42cb3e:	f6 05 61 bc 89 00 08 	test   BYTE PTR ds:0x89bc61,0x8
  42cb45:	74 07                	je     0x42cb4e
  42cb47:	bb 12 00 00 00       	mov    ebx,0x12
  42cb4c:	eb 0e                	jmp    0x42cb5c
  42cb4e:	f6 05 61 bc 89 00 04 	test   BYTE PTR ds:0x89bc61,0x4
  42cb55:	74 05                	je     0x42cb5c
  42cb57:	bb 14 00 00 00       	mov    ebx,0x14
  42cb5c:	85 db                	test   ebx,ebx
  42cb5e:	74 1d                	je     0x42cb7d
  42cb60:	81 0d 7c d1 89 00 00 	or     DWORD PTR ds:0x89d17c,0x100
  42cb67:	01 00 00 
  42cb6a:	53                   	push   ebx
  42cb6b:	e8 50 64 09 00       	call   0x4c2fc0
  42cb70:	83 c4 04             	add    esp,0x4
  42cb73:	57                   	push   edi
  42cb74:	53                   	push   ebx
  42cb75:	e8 c6 60 09 00       	call   0x4c2c40
  42cb7a:	83 c4 08             	add    esp,0x8
  42cb7d:	57                   	push   edi
  42cb7e:	e8 9d e9 fe ff       	call   0x41b520
  42cb83:	83 c4 04             	add    esp,0x4
  42cb86:	47                   	inc    edi
  42cb87:	33 c0                	xor    eax,eax
  42cb89:	a0 c0 ea 96 00       	mov    al,ds:0x96eac0
  42cb8e:	3b c7                	cmp    eax,edi
  42cb90:	0f 8f 17 ff ff ff    	jg     0x42caad
  42cb96:	f6 05 68 c6 89 00 04 	test   BYTE PTR ds:0x89c668,0x4
  42cb9d:	74 0f                	je     0x42cbae
  42cb9f:	c6 05 57 71 5a 00 00 	mov    BYTE PTR ds:0x5a7157,0x0
  42cba6:	5d                   	pop    ebp
  42cba7:	5f                   	pop    edi
  42cba8:	5e                   	pop    esi
  42cba9:	5b                   	pop    ebx
  42cbaa:	83 c4 04             	add    esp,0x4
  42cbad:	c3                   	ret
  42cbae:	c6 05 57 71 5a 00 01 	mov    BYTE PTR ds:0x5a7157,0x1
  42cbb5:	5d                   	pop    ebp
  42cbb6:	5f                   	pop    edi
  42cbb7:	5e                   	pop    esi
  42cbb8:	5b                   	pop    ebx
  42cbb9:	83 c4 04             	add    esp,0x4
  42cbbc:	c3                   	ret
  42cbbd:	cc                   	int3
  42cbbe:	cc                   	int3
  42cbbf:	cc                   	int3
