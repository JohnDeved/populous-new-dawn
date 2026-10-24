
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00524a30 <.text+0x123a30>:
  524a30:	0f be 44 24 04       	movsx  eax,BYTE PTR [esp+0x4]
  524a35:	83 ec 38             	sub    esp,0x38
  524a38:	85 c0                	test   eax,eax
  524a3a:	56                   	push   esi
  524a3b:	74 17                	je     0x524a54
  524a3d:	83 f8 01             	cmp    eax,0x1
  524a40:	0f 84 f1 00 00 00    	je     0x524b37
  524a46:	83 f8 02             	cmp    eax,0x2
  524a49:	0f 84 43 01 00 00    	je     0x524b92
  524a4f:	e9 a5 01 00 00       	jmp    0x524bf9
  524a54:	f6 05 a5 5d 89 00 80 	test   BYTE PTR ds:0x895da5,0x80
  524a5b:	75 76                	jne    0x524ad3
  524a5d:	83 3d d0 54 5d 00 01 	cmp    DWORD PTR ds:0x5d54d0,0x1
  524a64:	75 5e                	jne    0x524ac4
  524a66:	33 c9                	xor    ecx,ecx
  524a68:	33 d2                	xor    edx,edx
  524a6a:	8a 0d 32 ce 89 00    	mov    cl,BYTE PTR ds:0x89ce32
  524a70:	33 c0                	xor    eax,eax
  524a72:	c1 e1 02             	shl    ecx,0x2
  524a75:	03 0d f8 ef 87 00    	add    ecx,DWORD PTR ds:0x87eff8
  524a7b:	8a 51 01             	mov    dl,BYTE PTR [ecx+0x1]
  524a7e:	8a 41 02             	mov    al,BYTE PTR [ecx+0x2]
  524a81:	c1 e2 08             	shl    edx,0x8
  524a84:	0b d0                	or     edx,eax
  524a86:	33 c0                	xor    eax,eax
  524a88:	8a 01                	mov    al,BYTE PTR [ecx]
  524a8a:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  524a90:	c1 e0 10             	shl    eax,0x10
  524a93:	0b d0                	or     edx,eax
  524a95:	52                   	push   edx
  524a96:	e8 65 d6 ff ff       	call   0x522100
  524a9b:	0f bf 0d cf c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6cf
  524aa2:	0f bf 15 d1 c6 89 00 	movsx  edx,WORD PTR ds:0x89c6d1
  524aa9:	33 c0                	xor    eax,eax
  524aab:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  524aaf:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  524ab3:	8d 44 24 0c          	lea    eax,[esp+0xc]
  524ab7:	89 4c 24 14          	mov    DWORD PTR [esp+0x14],ecx
  524abb:	89 54 24 18          	mov    DWORD PTR [esp+0x18],edx
  524abf:	e9 27 01 00 00       	jmp    0x524beb
  524ac4:	6a 00                	push   0x0
  524ac6:	e8 65 2b ff ff       	call   0x517630
  524acb:	83 c4 04             	add    esp,0x4
  524ace:	e9 26 01 00 00       	jmp    0x524bf9
  524ad3:	83 3d c0 dc 5d 00 00 	cmp    DWORD PTR ds:0x5ddcc0,0x0
  524ada:	75 47                	jne    0x524b23
  524adc:	e8 1f e7 f7 ff       	call   0x4a3200
  524ae1:	e8 3a f2 f7 ff       	call   0x4a3d20
  524ae6:	68 18 dd 5d 00       	push   0x5ddd18
  524aeb:	68 23 cd 89 00       	push   0x89cd23
  524af0:	e8 bb b6 fd ff       	call   0x5001b0
  524af5:	8d 44 24 14          	lea    eax,[esp+0x14]
  524af9:	83 c4 08             	add    esp,0x8
  524afc:	50                   	push   eax
  524afd:	68 d0 41 00 00       	push   0x41d0
  524b02:	68 40 11 d0 00       	push   0xd01140
  524b07:	68 23 cd 89 00       	push   0x89cd23
  524b0c:	e8 6f 14 00 00       	call   0x525f80
  524b11:	83 c4 10             	add    esp,0x10
  524b14:	e8 17 ed ff ff       	call   0x523830
  524b19:	c7 05 c0 dc 5d 00 01 	mov    DWORD PTR ds:0x5ddcc0,0x1
  524b20:	00 00 00 
  524b23:	e8 08 ed ff ff       	call   0x523830
  524b28:	6a 01                	push   0x1
  524b2a:	e8 01 2b ff ff       	call   0x517630
  524b2f:	83 c4 04             	add    esp,0x4
  524b32:	e9 c2 00 00 00       	jmp    0x524bf9
  524b37:	33 c9                	xor    ecx,ecx
  524b39:	33 d2                	xor    edx,edx
  524b3b:	8a 0d 32 ce 89 00    	mov    cl,BYTE PTR ds:0x89ce32
  524b41:	33 c0                	xor    eax,eax
  524b43:	c1 e1 02             	shl    ecx,0x2
  524b46:	03 0d f8 ef 87 00    	add    ecx,DWORD PTR ds:0x87eff8
  524b4c:	8a 51 01             	mov    dl,BYTE PTR [ecx+0x1]
  524b4f:	8a 41 02             	mov    al,BYTE PTR [ecx+0x2]
  524b52:	c1 e2 08             	shl    edx,0x8
  524b55:	0b d0                	or     edx,eax
  524b57:	33 c0                	xor    eax,eax
  524b59:	8a 01                	mov    al,BYTE PTR [ecx]
  524b5b:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  524b61:	c1 e0 10             	shl    eax,0x10
  524b64:	0b d0                	or     edx,eax
  524b66:	52                   	push   edx
  524b67:	e8 94 d5 ff ff       	call   0x522100
  524b6c:	0f bf 0d cf c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6cf
  524b73:	0f bf 15 d1 c6 89 00 	movsx  edx,WORD PTR ds:0x89c6d1
  524b7a:	33 c0                	xor    eax,eax
  524b7c:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  524b80:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  524b84:	8d 44 24 0c          	lea    eax,[esp+0xc]
  524b88:	89 4c 24 14          	mov    DWORD PTR [esp+0x14],ecx
  524b8c:	89 54 24 18          	mov    DWORD PTR [esp+0x18],edx
  524b90:	eb 59                	jmp    0x524beb
  524b92:	33 c9                	xor    ecx,ecx
  524b94:	33 d2                	xor    edx,edx
  524b96:	8a 0d 32 ce 89 00    	mov    cl,BYTE PTR ds:0x89ce32
  524b9c:	33 c0                	xor    eax,eax
  524b9e:	c1 e1 02             	shl    ecx,0x2
  524ba1:	03 0d f8 ef 87 00    	add    ecx,DWORD PTR ds:0x87eff8
  524ba7:	8a 51 01             	mov    dl,BYTE PTR [ecx+0x1]
  524baa:	8a 41 02             	mov    al,BYTE PTR [ecx+0x2]
  524bad:	c1 e2 08             	shl    edx,0x8
  524bb0:	0b d0                	or     edx,eax
  524bb2:	33 c0                	xor    eax,eax
  524bb4:	8a 01                	mov    al,BYTE PTR [ecx]
  524bb6:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  524bbc:	c1 e0 10             	shl    eax,0x10
  524bbf:	0b d0                	or     edx,eax
  524bc1:	52                   	push   edx
  524bc2:	e8 39 d5 ff ff       	call   0x522100
  524bc7:	0f bf 0d cf c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6cf
  524bce:	0f bf 15 d1 c6 89 00 	movsx  edx,WORD PTR ds:0x89c6d1
  524bd5:	33 c0                	xor    eax,eax
  524bd7:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  524bdb:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  524bdf:	8d 44 24 0c          	lea    eax,[esp+0xc]
  524be3:	89 4c 24 14          	mov    DWORD PTR [esp+0x14],ecx
  524be7:	89 54 24 18          	mov    DWORD PTR [esp+0x18],edx
  524beb:	50                   	push   eax
  524bec:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  524bf2:	6a 01                	push   0x1
  524bf4:	e8 c7 ba ff ff       	call   0x5206c0
  524bf9:	33 c9                	xor    ecx,ecx
  524bfb:	38 0d 66 d1 89 00    	cmp    BYTE PTR ds:0x89d166,cl
  524c01:	0f 84 e0 00 00 00    	je     0x524ce7
  524c07:	c7 44 24 0c 30 00 00 	mov    DWORD PTR [esp+0xc],0x30
  524c0e:	00 
  524c0f:	b8 48 00 00 00       	mov    eax,0x48
  524c14:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  524c18:	c7 44 24 14 60 00 00 	mov    DWORD PTR [esp+0x14],0x60
  524c1f:	00 
  524c20:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  524c24:	8d 44 24 1c          	lea    eax,[esp+0x1c]
  524c28:	89 08                	mov    DWORD PTR [eax],ecx
  524c2a:	89 48 04             	mov    DWORD PTR [eax+0x4],ecx
  524c2d:	89 48 08             	mov    DWORD PTR [eax+0x8],ecx
  524c30:	89 48 0c             	mov    DWORD PTR [eax+0xc],ecx
  524c33:	33 c0                	xor    eax,eax
  524c35:	0f be 0d 65 d1 89 00 	movsx  ecx,BYTE PTR ds:0x89d165
  524c3c:	8a 84 89 c8 89 5a 00 	mov    al,BYTE PTR [ecx+ecx*4+0x5a89c8]
  524c43:	c1 e0 02             	shl    eax,0x2
  524c46:	8a 88 28 55 d0 00    	mov    cl,BYTE PTR [eax+0xd05528]
  524c4c:	8a 90 29 55 d0 00    	mov    dl,BYTE PTR [eax+0xd05529]
  524c52:	8a 80 2a 55 d0 00    	mov    al,BYTE PTR [eax+0xd0552a]
  524c58:	88 4c 24 06          	mov    BYTE PTR [esp+0x6],cl
  524c5c:	88 54 24 05          	mov    BYTE PTR [esp+0x5],dl
  524c60:	88 44 24 04          	mov    BYTE PTR [esp+0x4],al
  524c64:	0f bf 05 26 f0 88 00 	movsx  eax,WORD PTR ds:0x88f026
  524c6b:	0f bf 0d 2a f0 88 00 	movsx  ecx,WORD PTR ds:0x88f02a
  524c72:	0f bf 35 cf c6 89 00 	movsx  esi,WORD PTR ds:0x89c6cf
  524c79:	03 c8                	add    ecx,eax
  524c7b:	89 44 24 2c          	mov    DWORD PTR [esp+0x2c],eax
  524c7f:	a1 81 c6 89 00       	mov    eax,ds:0x89c681
  524c84:	89 4c 24 34          	mov    DWORD PTR [esp+0x34],ecx
  524c88:	99                   	cdq
  524c89:	0f bf 0d 28 f0 88 00 	movsx  ecx,WORD PTR ds:0x88f028
  524c90:	f7 fe                	idiv   esi
  524c92:	03 c1                	add    eax,ecx
  524c94:	89 4c 24 30          	mov    DWORD PTR [esp+0x30],ecx
  524c98:	33 c9                	xor    ecx,ecx
  524c9a:	89 44 24 38          	mov    DWORD PTR [esp+0x38],eax
  524c9e:	33 c0                	xor    eax,eax
  524ca0:	8a 4c 24 05          	mov    cl,BYTE PTR [esp+0x5]
  524ca4:	a0 66 d1 89 00       	mov    al,ds:0x89d166
  524ca9:	83 e0 03             	and    eax,0x3
  524cac:	8b 44 84 0c          	mov    eax,DWORD PTR [esp+eax*4+0xc]
  524cb0:	c1 e0 10             	shl    eax,0x10
  524cb3:	0b c1                	or     eax,ecx
  524cb5:	33 c9                	xor    ecx,ecx
  524cb7:	c1 e0 08             	shl    eax,0x8
  524cba:	8a 4c 24 06          	mov    cl,BYTE PTR [esp+0x6]
  524cbe:	c1 e1 10             	shl    ecx,0x10
  524cc1:	8d 54 24 2c          	lea    edx,[esp+0x2c]
  524cc5:	0b c1                	or     eax,ecx
  524cc7:	33 c9                	xor    ecx,ecx
  524cc9:	8a 4c 24 04          	mov    cl,BYTE PTR [esp+0x4]
  524ccd:	0b c1                	or     eax,ecx
  524ccf:	50                   	push   eax
  524cd0:	52                   	push   edx
  524cd1:	e8 5a 2b ff ff       	call   0x517830
  524cd6:	83 25 74 a0 5d 00 f7 	and    DWORD PTR ds:0x5da074,0xfffffff7
  524cdd:	83 25 74 a0 5d 00 ef 	and    DWORD PTR ds:0x5da074,0xffffffef
  524ce4:	83 c4 08             	add    esp,0x8
  524ce7:	5e                   	pop    esi
  524ce8:	83 c4 38             	add    esp,0x38
  524ceb:	c3                   	ret
  524cec:	cc                   	int3
  524ced:	cc                   	int3
  524cee:	cc                   	int3
  524cef:	cc                   	int3
