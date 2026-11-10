; Original d3dpoptb.exe instruction bytes. Display-only header is normalized.
; Complete caller window 004a4960..004a4d37 (end exclusive).
  4a4960:	53                   	push   ebx
  4a4961:	33 c0                	xor    eax,eax
  4a4963:	56                   	push   esi
  4a4964:	33 db                	xor    ebx,ebx
  4a4966:	a0 02 f0 88 00       	mov    al,ds:0x88f002
  4a496b:	88 1d 63 d1 89 00    	mov    BYTE PTR ds:0x89d163,bl
  4a4971:	83 f8 01             	cmp    eax,0x1
  4a4974:	74 17                	je     0x4a498d
  4a4976:	83 f8 04             	cmp    eax,0x4
  4a4979:	0f 84 f4 00 00 00    	je     0x4a4a73
  4a497f:	83 f8 05             	cmp    eax,0x5
  4a4982:	0f 84 e1 00 00 00    	je     0x4a4a69
  4a4988:	e9 33 01 00 00       	jmp    0x4a4ac0
  4a498d:	c6 05 33 ce 89 00 00 	mov    BYTE PTR ds:0x89ce33,0x0
  4a4994:	6a 00                	push   0x0
  4a4996:	6a 00                	push   0x0
  4a4998:	6a 00                	push   0x0
  4a499a:	e8 61 80 05 00       	call   0x4fca00
  4a499f:	83 c4 0c             	add    esp,0xc
  4a49a2:	6a 01                	push   0x1
  4a49a4:	e8 17 e8 07 00       	call   0x5231c0
  4a49a9:	83 c4 04             	add    esp,0x4
  4a49ac:	e8 bf 52 f8 ff       	call   0x429c70
  4a49b1:	f6 05 a8 5d 89 00 08 	test   BYTE PTR ds:0x895da8,0x8
  4a49b8:	74 07                	je     0x4a49c1
  4a49ba:	e8 b1 87 01 00       	call   0x4bd170
  4a49bf:	eb 05                	jmp    0x4a49c6
  4a49c1:	e8 6a 88 01 00       	call   0x4bd230
  4a49c6:	0f bf 05 d1 c6 89 00 	movsx  eax,WORD PTR ds:0x89c6d1
  4a49cd:	0f bf 0d cf c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6cf
  4a49d4:	50                   	push   eax
  4a49d5:	51                   	push   ecx
  4a49d6:	e8 15 28 f7 ff       	call   0x4171f0
  4a49db:	83 c4 08             	add    esp,0x8
  4a49de:	a2 ee c6 89 00       	mov    ds:0x89c6ee,al
  4a49e3:	e8 28 29 f7 ff       	call   0x417310
  4a49e8:	0f bf 0d d1 c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6d1
  4a49ef:	0f bf 15 cf c6 89 00 	movsx  edx,WORD PTR ds:0x89c6cf
  4a49f6:	0f be 05 5a f0 88 00 	movsx  eax,BYTE PTR ds:0x88f05a
  4a49fd:	51                   	push   ecx
  4a49fe:	52                   	push   edx
  4a49ff:	50                   	push   eax
  4a4a00:	e8 6b 5d f8 ff       	call   0x42a770
  4a4a05:	83 c4 0c             	add    esp,0xc
  4a4a08:	6a 03                	push   0x3
  4a4a0a:	e8 d1 e0 f9 ff       	call   0x442ae0
  4a4a0f:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4a4a16:	8d 14 80             	lea    edx,[eax+eax*4]
  4a4a19:	83 c4 04             	add    esp,0x4
  4a4a1c:	8b c8                	mov    ecx,eax
  4a4a1e:	8d 04 51             	lea    eax,[ecx+edx*2]
  4a4a21:	8d 34 c0             	lea    esi,[eax+eax*8]
  4a4a24:	8d 14 f1             	lea    edx,[ecx+esi*8]
  4a4a27:	8d 04 91             	lea    eax,[ecx+edx*4]
  4a4a2a:	66 8b 0d c1 c6 89 00 	mov    cx,WORD PTR ds:0x89c6c1
  4a4a31:	05 c8 d1 89 00       	add    eax,0x89d1c8
  4a4a36:	50                   	push   eax
  4a4a37:	51                   	push   ecx
  4a4a38:	e8 f3 5e fd ff       	call   0x47a930
  4a4a3d:	83 c4 08             	add    esp,0x8
  4a4a40:	e8 db 98 f9 ff       	call   0x43e320
  4a4a45:	e8 e6 61 fd ff       	call   0x47ac30
  4a4a4a:	80 3d b0 5d 89 00 00 	cmp    BYTE PTR ds:0x895db0,0x0
  4a4a51:	74 05                	je     0x4a4a58
  4a4a53:	e8 88 69 fe ff       	call   0x48b3e0
  4a4a58:	66 83 3d c1 c6 89 00 	cmp    WORD PTR ds:0x89c6c1,0x2
  4a4a5f:	02 
  4a4a60:	74 5e                	je     0x4a4ac0
  4a4a62:	e8 99 6a fe ff       	call   0x48b500
  4a4a67:	eb 57                	jmp    0x4a4ac0
  4a4a69:	6a 04                	push   0x4
  4a4a6b:	e8 70 e0 f9 ff       	call   0x442ae0
  4a4a70:	83 c4 04             	add    esp,0x4
  4a4a73:	e8 78 05 01 00       	call   0x4b4ff0
  4a4a78:	68 ff 00 00 00       	push   0xff
  4a4a7d:	e8 1e 85 ff ff       	call   0x49cfa0
  4a4a82:	83 c4 04             	add    esp,0x4
  4a4a85:	e8 b6 89 01 00       	call   0x4bd440
  4a4a8a:	80 3d 24 04 8e 00 00 	cmp    BYTE PTR ds:0x8e0424,0x0
  4a4a91:	75 05                	jne    0x4a4a98
  4a4a93:	e8 18 e0 f9 ff       	call   0x442ab0
  4a4a98:	bb 01 00 00 00       	mov    ebx,0x1
  4a4a9d:	53                   	push   ebx
  4a4a9e:	e8 ad 69 fe ff       	call   0x48b450
  4a4aa3:	83 c4 04             	add    esp,0x4
  4a4aa6:	e8 25 6e fe ff       	call   0x48b8d0
  4a4aab:	c6 05 33 ce 89 00 00 	mov    BYTE PTR ds:0x89ce33,0x0
  4a4ab2:	6a 00                	push   0x0
  4a4ab4:	6a 00                	push   0x0
  4a4ab6:	6a 00                	push   0x0
  4a4ab8:	e8 43 7f 05 00       	call   0x4fca00
  4a4abd:	83 c4 0c             	add    esp,0xc
  4a4ac0:	83 3d bb 5d 89 00 00 	cmp    DWORD PTR ds:0x895dbb,0x0
  4a4ac7:	75 21                	jne    0x4a4aea
  4a4ac9:	66 83 3d c1 c6 89 00 	cmp    WORD PTR ds:0x89c6c1,0x2
  4a4ad0:	02 
  4a4ad1:	74 17                	je     0x4a4aea
  4a4ad3:	80 3d 36 ce 89 00 00 	cmp    BYTE PTR ds:0x89ce36,0x0
  4a4ada:	75 0e                	jne    0x4a4aea
  4a4adc:	80 3d b1 5d 89 00 01 	cmp    BYTE PTR ds:0x895db1,0x1
  4a4ae3:	75 05                	jne    0x4a4aea
  4a4ae5:	e8 16 6a fe ff       	call   0x48b500
  4a4aea:	85 db                	test   ebx,ebx
  4a4aec:	0f 85 42 02 00 00    	jne    0x4a4d34
  4a4af2:	e8 89 70 fa ff       	call   0x44bb80
  4a4af7:	e8 14 d4 00 00       	call   0x4b1f10
  4a4afc:	e8 bf c9 f8 ff       	call   0x4314c0
  4a4b01:	e8 1a 48 fa ff       	call   0x449320
  4a4b06:	e8 65 af 00 00       	call   0x4afa70
  4a4b0b:	e8 70 b5 00 00       	call   0x4b0080
  4a4b10:	f6 05 6c c6 89 00 80 	test   BYTE PTR ds:0x89c66c,0x80
  4a4b17:	74 0c                	je     0x4a4b25
  4a4b19:	e8 92 36 fb ff       	call   0x4581b0
  4a4b1e:	e8 0d 36 fb ff       	call   0x458130
  4a4b23:	eb 05                	jmp    0x4a4b2a
  4a4b25:	e8 b6 59 00 00       	call   0x4aa4e0
  4a4b2a:	80 3d 01 f0 88 00 0a 	cmp    BYTE PTR ds:0x88f001,0xa
  4a4b31:	0f 84 f3 01 00 00    	je     0x4a4d2a
  4a4b37:	80 3d 02 f0 88 00 05 	cmp    BYTE PTR ds:0x88f002,0x5
  4a4b3e:	0f 84 e6 01 00 00    	je     0x4a4d2a
  4a4b44:	80 3d 02 f0 88 00 04 	cmp    BYTE PTR ds:0x88f002,0x4
  4a4b4b:	0f 84 d9 01 00 00    	je     0x4a4d2a
  4a4b51:	e8 ca 91 f9 ff       	call   0x43dd20
  4a4b56:	e8 b5 a9 fd ff       	call   0x47f510
  4a4b5b:	e8 20 a9 fd ff       	call   0x47f480
  4a4b60:	e8 eb 43 01 00       	call   0x4b8f50
  4a4b65:	e8 56 98 f9 ff       	call   0x43e3c0
  4a4b6a:	e8 21 0a 00 00       	call   0x4a5590
  4a4b6f:	e8 1c 7f 04 00       	call   0x4eca90
  4a4b74:	e8 67 6f f7 ff       	call   0x41bae0
  4a4b79:	e8 e2 fb 00 00       	call   0x4b4760
  4a4b7e:	e8 4d 6b f7 ff       	call   0x41b6d0
  4a4b83:	e8 c8 3d f7 ff       	call   0x418950
  4a4b88:	e8 83 29 f7 ff       	call   0x417510
  4a4b8d:	e8 de 2f f7 ff       	call   0x417b70
  4a4b92:	e8 d9 36 f7 ff       	call   0x418270
  4a4b97:	e8 a4 30 f7 ff       	call   0x417c40
  4a4b9c:	e8 ef 4e f7 ff       	call   0x419a90
  4a4ba1:	e8 7a fd 05 00       	call   0x504920
  4a4ba6:	6a 01                	push   0x1
  4a4ba8:	e8 c3 c6 04 00       	call   0x4f1270
  4a4bad:	83 c4 04             	add    esp,0x4
  4a4bb0:	e8 9b 74 f7 ff       	call   0x41c050
  4a4bb5:	e8 96 b6 07 00       	call   0x520250
  4a4bba:	e8 61 75 f7 ff       	call   0x41c120
  4a4bbf:	e8 3c 5d fe ff       	call   0x48a900
  4a4bc4:	e8 27 b8 fd ff       	call   0x4803f0
  4a4bc9:	e8 a2 da 00 00       	call   0x4b2670
  4a4bce:	85 c0                	test   eax,eax
  4a4bd0:	0f 84 c9 00 00 00    	je     0x4a4c9f
  4a4bd6:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  4a4bdd:	74 16                	je     0x4a4bf5
  4a4bdf:	80 3d 9d 56 89 00 00 	cmp    BYTE PTR ds:0x89569d,0x0
  4a4be6:	74 0d                	je     0x4a4bf5
  4a4be8:	83 3d 84 d1 89 00 00 	cmp    DWORD PTR ds:0x89d184,0x0
  4a4bef:	0f 84 aa 00 00 00    	je     0x4a4c9f
  4a4bf5:	e8 46 b4 f7 ff       	call   0x420040
  4a4bfa:	f6 05 63 c6 89 00 80 	test   BYTE PTR ds:0x89c663,0x80
  4a4c01:	0f 85 93 00 00 00    	jne    0x4a4c9a
  4a4c07:	e8 64 d9 07 00       	call   0x522570
  4a4c0c:	85 c0                	test   eax,eax
  4a4c0e:	75 0a                	jne    0x4a4c1a
  4a4c10:	81 0d 61 c6 89 00 00 	or     DWORD PTR ds:0x89c661,0x800000
  4a4c17:	00 80 00 
  4a4c1a:	83 3d 1c d9 5c 00 00 	cmp    DWORD PTR ds:0x5cd91c,0x0
  4a4c21:	75 77                	jne    0x4a4c9a
  4a4c23:	ff 05 44 a4 5c 00    	inc    DWORD PTR ds:0x5ca444
  4a4c29:	e8 32 86 05 00       	call   0x4fd260
  4a4c2e:	6a 00                	push   0x0
  4a4c30:	e8 1b da 00 00       	call   0x4b2650
  4a4c35:	50                   	push   eax
  4a4c36:	e8 95 51 08 00       	call   0x529dd0
  4a4c3b:	83 c4 08             	add    esp,0x8
  4a4c3e:	83 f8 01             	cmp    eax,0x1
  4a4c41:	1a c0                	sbb    al,al
  4a4c43:	f6 d8                	neg    al
  4a4c45:	a2 40 df 59 00       	mov    ds:0x59df40,al
  4a4c4a:	e8 01 da 00 00       	call   0x4b2650
  4a4c4f:	50                   	push   eax
  4a4c50:	e8 6b 35 08 00       	call   0x5281c0
  4a4c55:	83 c4 04             	add    esp,0x4
  4a4c58:	e8 f3 d9 00 00       	call   0x4b2650
  4a4c5d:	8b 48 24             	mov    ecx,DWORD PTR [eax+0x24]
  4a4c60:	66 89 0d d5 c6 89 00 	mov    WORD PTR ds:0x89c6d5,cx
  4a4c67:	e8 e4 d9 00 00       	call   0x4b2650
  4a4c6c:	8b 48 20             	mov    ecx,DWORD PTR [eax+0x20]
  4a4c6f:	66 89 0d d7 c6 89 00 	mov    WORD PTR ds:0x89c6d7,cx
  4a4c76:	e8 45 b3 fd ff       	call   0x47ffc0
  4a4c7b:	e8 a0 b8 fd ff       	call   0x480520
  4a4c80:	e8 cb d9 00 00       	call   0x4b2650
  4a4c85:	50                   	push   eax
  4a4c86:	e8 d5 51 08 00       	call   0x529e60
  4a4c8b:	c6 05 40 df 59 00 00 	mov    BYTE PTR ds:0x59df40,0x0
  4a4c92:	83 c4 04             	add    esp,0x4
  4a4c95:	e8 56 86 05 00       	call   0x4fd2f0
  4a4c9a:	e8 d1 9a 04 00       	call   0x4ee770
  4a4c9f:	e8 cc 4a fe ff       	call   0x489770
  4a4ca4:	6a 00                	push   0x0
  4a4ca6:	e8 c5 c5 04 00       	call   0x4f1270
  4a4cab:	83 c4 04             	add    esp,0x4
  4a4cae:	e8 1d aa fd ff       	call   0x47f6d0
  4a4cb3:	e8 a8 dc ff ff       	call   0x4a2960
  4a4cb8:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  4a4cbf:	74 1a                	je     0x4a4cdb
  4a4cc1:	f6 05 61 c6 89 00 20 	test   BYTE PTR ds:0x89c661,0x20
  4a4cc8:	74 0c                	je     0x4a4cd6
  4a4cca:	6a 01                	push   0x1
  4a4ccc:	e8 5f 07 fa ff       	call   0x445430
  4a4cd1:	83 c4 04             	add    esp,0x4
  4a4cd4:	eb 05                	jmp    0x4a4cdb
  4a4cd6:	e8 a5 08 fa ff       	call   0x445580
  4a4cdb:	f6 05 6b c6 89 00 08 	test   BYTE PTR ds:0x89c66b,0x8
  4a4ce2:	75 2e                	jne    0x4a4d12
  4a4ce4:	e8 c7 5b fd ff       	call   0x47a8b0
  4a4ce9:	38 05 33 ce 89 00    	cmp    BYTE PTR ds:0x89ce33,al
  4a4cef:	74 43                	je     0x4a4d34
  4a4cf1:	6a 00                	push   0x0
  4a4cf3:	a2 33 ce 89 00       	mov    ds:0x89ce33,al
  4a4cf8:	0f be c0             	movsx  eax,al
  4a4cfb:	c1 e0 03             	shl    eax,0x3
  4a4cfe:	6a 00                	push   0x0
  4a4d00:	03 05 10 df 59 00    	add    eax,DWORD PTR ds:0x59df10
  4a4d06:	50                   	push   eax
  4a4d07:	e8 f4 7c 05 00       	call   0x4fca00
  4a4d0c:	83 c4 0c             	add    esp,0xc
  4a4d0f:	5e                   	pop    esi
  4a4d10:	5b                   	pop    ebx
  4a4d11:	c3                   	ret
  4a4d12:	c6 05 33 ce 89 00 00 	mov    BYTE PTR ds:0x89ce33,0x0
  4a4d19:	6a 00                	push   0x0
  4a4d1b:	6a 00                	push   0x0
  4a4d1d:	6a 00                	push   0x0
  4a4d1f:	e8 dc 7c 05 00       	call   0x4fca00
  4a4d24:	83 c4 0c             	add    esp,0xc
  4a4d27:	5e                   	pop    esi
  4a4d28:	5b                   	pop    ebx
  4a4d29:	c3                   	ret
  4a4d2a:	6a 00                	push   0x0
  4a4d2c:	e8 8f e4 07 00       	call   0x5231c0
  4a4d31:	83 c4 04             	add    esp,0x4
  4a4d34:	5e                   	pop    esi
  4a4d35:	5b                   	pop    ebx
  4a4d36:	c3                   	ret
