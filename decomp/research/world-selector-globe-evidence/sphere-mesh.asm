
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004e3bc0 <.text+0xe2bc0>:
  4e3bc0:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  4e3bc4:	81 ec 4c 01 00 00    	sub    esp,0x14c
  4e3bca:	a3 a4 f2 a0 00       	mov    ds:0xa0f2a4,eax
  4e3bcf:	53                   	push   ebx
  4e3bd0:	8b 8c 24 5c 01 00 00 	mov    ecx,DWORD PTR [esp+0x15c]
  4e3bd7:	56                   	push   esi
  4e3bd8:	8b 94 24 64 01 00 00 	mov    edx,DWORD PTR [esp+0x164]
  4e3bdf:	57                   	push   edi
  4e3be0:	55                   	push   ebp
  4e3be1:	33 f6                	xor    esi,esi
  4e3be3:	89 0d a0 f2 a0 00    	mov    DWORD PTR ds:0xa0f2a0,ecx
  4e3be9:	89 15 18 a7 a1 00    	mov    DWORD PTR ds:0xa1a718,edx
  4e3bef:	d9 84 24 6c 01 00 00 	fld    DWORD PTR [esp+0x16c]
  4e3bf6:	89 35 88 48 5d 00    	mov    DWORD PTR ds:0x5d4888,esi
  4e3bfc:	89 35 8c 48 5d 00    	mov    DWORD PTR ds:0x5d488c,esi
  4e3c02:	89 35 90 48 5d 00    	mov    DWORD PTR ds:0x5d4890,esi
  4e3c08:	e8 47 80 07 00       	call   0x55bc54
  4e3c0d:	85 c0                	test   eax,eax
  4e3c0f:	0f 84 8d 06 00 00    	je     0x4e42a2
  4e3c15:	bb 1e 00 00 00       	mov    ebx,0x1e
  4e3c1a:	8d 0c 45 00 00 00 00 	lea    ecx,[eax*2+0x0]
  4e3c21:	85 c9                	test   ecx,ecx
  4e3c23:	7c 07                	jl     0x4e3c2c
  4e3c25:	4b                   	dec    ebx
  4e3c26:	03 c9                	add    ecx,ecx
  4e3c28:	85 c9                	test   ecx,ecx
  4e3c2a:	7d f9                	jge    0x4e3c25
  4e3c2c:	8d 4b 01             	lea    ecx,[ebx+0x1]
  4e3c2f:	83 f9 09             	cmp    ecx,0x9
  4e3c32:	0f 8d 6a 06 00 00    	jge    0x4e42a2
  4e3c38:	8d 34 9d 00 00 00 00 	lea    esi,[ebx*4+0x0]
  4e3c3f:	8a cb                	mov    cl,bl
  4e3c41:	ba ff ff ff ff       	mov    edx,0xffffffff
  4e3c46:	d3 e2                	shl    edx,cl
  4e3c48:	03 d0                	add    edx,eax
  4e3c4a:	b8 01 00 00 00       	mov    eax,0x1
  4e3c4f:	d3 e0                	shl    eax,cl
  4e3c51:	89 54 24 5c          	mov    DWORD PTR [esp+0x5c],edx
  4e3c55:	db 44 24 5c          	fild   DWORD PTR [esp+0x5c]
  4e3c59:	89 44 24 5c          	mov    DWORD PTR [esp+0x5c],eax
  4e3c5d:	da 74 24 5c          	fidiv  DWORD PTR [esp+0x5c]
  4e3c61:	d9 86 9c 48 5d 00    	fld    DWORD PTR [esi+0x5d489c]
  4e3c67:	d8 a6 98 48 5d 00    	fsub   DWORD PTR [esi+0x5d4898]
  4e3c6d:	de c9                	fmulp  st(1),st
  4e3c6f:	d8 86 98 48 5d 00    	fadd   DWORD PTR [esi+0x5d4898]
  4e3c75:	d9 54 24 5c          	fst    DWORD PTR [esp+0x5c]
  4e3c79:	d8 3d b0 f7 58 00    	fdivr  DWORD PTR ds:0x58f7b0
  4e3c7f:	d8 0d 18 f8 58 00    	fmul   DWORD PTR ds:0x58f818
  4e3c85:	d9 5c 24 40          	fstp   DWORD PTR [esp+0x40]
  4e3c89:	d9 05 b0 f7 58 00    	fld    DWORD PTR ds:0x58f7b0
  4e3c8f:	d8 0d 18 f8 58 00    	fmul   DWORD PTR ds:0x58f818
  4e3c95:	d8 bc 24 78 01 00 00 	fdivr  DWORD PTR [esp+0x178]
  4e3c9c:	d8 4c 24 40          	fmul   DWORD PTR [esp+0x40]
  4e3ca0:	e8 af 7f 07 00       	call   0x55bc54
  4e3ca5:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  4e3ca9:	83 f8 20             	cmp    eax,0x20
  4e3cac:	7e 08                	jle    0x4e3cb6
  4e3cae:	c7 44 24 20 20 00 00 	mov    DWORD PTR [esp+0x20],0x20
  4e3cb5:	00 
  4e3cb6:	83 3d 84 48 5d 00 00 	cmp    DWORD PTR ds:0x5d4884,0x0
  4e3cbd:	0f 84 91 00 00 00    	je     0x4e3d54
  4e3cc3:	d9 44 24 5c          	fld    DWORD PTR [esp+0x5c]
  4e3cc7:	d8 0d 1c f8 58 00    	fmul   DWORD PTR ds:0x58f81c
  4e3ccd:	d9 fe                	fsin
  4e3ccf:	53                   	push   ebx
  4e3cd0:	83 ec 08             	sub    esp,0x8
  4e3cd3:	d8 74 24 68          	fdiv   DWORD PTR [esp+0x68]
  4e3cd7:	68 c0 48 5d 00       	push   0x5d48c0
  4e3cdc:	8d 44 24 6c          	lea    eax,[esp+0x6c]
  4e3ce0:	50                   	push   eax
  4e3ce1:	d8 0d 20 f8 58 00    	fmul   DWORD PTR ds:0x58f820
  4e3ce7:	d8 05 e4 f7 58 00    	fadd   DWORD PTR ds:0x58f7e4
  4e3ced:	d8 0d b0 f7 58 00    	fmul   DWORD PTR ds:0x58f7b0
  4e3cf3:	d8 8c 24 80 01 00 00 	fmul   DWORD PTR [esp+0x180]
  4e3cfa:	d8 8c 24 80 01 00 00 	fmul   DWORD PTR [esp+0x180]
  4e3d01:	dd 5c 24 08          	fstp   QWORD PTR [esp+0x8]
  4e3d05:	e8 46 77 07 00       	call   0x55b450
  4e3d0a:	83 c4 14             	add    esp,0x14
  4e3d0d:	b8 ff 00 00 00       	mov    eax,0xff
  4e3d12:	88 44 24 12          	mov    BYTE PTR [esp+0x12],al
  4e3d16:	50                   	push   eax
  4e3d17:	88 44 24 15          	mov    BYTE PTR [esp+0x15],al
  4e3d1b:	50                   	push   eax
  4e3d1c:	88 44 24 18          	mov    BYTE PTR [esp+0x18],al
  4e3d20:	50                   	push   eax
  4e3d21:	88 44 24 1f          	mov    BYTE PTR [esp+0x1f],al
  4e3d25:	68 28 55 d0 00       	push   0xd05528
  4e3d2a:	e8 31 29 04 00       	call   0x526660
  4e3d2f:	8d 54 24 6c          	lea    edx,[esp+0x6c]
  4e3d33:	88 44 24 24          	mov    BYTE PTR [esp+0x24],al
  4e3d37:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  4e3d3b:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  4e3d3f:	83 c4 10             	add    esp,0x10
  4e3d42:	50                   	push   eax
  4e3d43:	51                   	push   ecx
  4e3d44:	52                   	push   edx
  4e3d45:	68 2c 01 00 00       	push   0x12c
  4e3d4a:	6a 00                	push   0x0
  4e3d4c:	e8 5f 41 04 00       	call   0x527eb0
  4e3d51:	83 c4 14             	add    esp,0x14
  4e3d54:	d9 05 b0 f7 58 00    	fld    DWORD PTR ds:0x58f7b0
  4e3d5a:	d8 0d 1c f8 58 00    	fmul   DWORD PTR ds:0x58f81c
  4e3d60:	8b 15 88 48 5d 00    	mov    edx,DWORD PTR ds:0x5d4888
  4e3d66:	be 01 00 00 00       	mov    esi,0x1
  4e3d6b:	6a 00                	push   0x0
  4e3d6d:	89 15 e8 45 a1 00    	mov    DWORD PTR ds:0xa145e8,edx
  4e3d73:	da 74 24 24          	fidiv  DWORD PTR [esp+0x24]
  4e3d77:	68 00 00 80 3f       	push   0x3f800000
  4e3d7c:	89 35 98 a6 a1 00    	mov    DWORD PTR ds:0xa1a698,esi
  4e3d82:	6a 00                	push   0x0
  4e3d84:	83 ec 04             	sub    esp,0x4
  4e3d87:	d9 5c 24 64          	fstp   DWORD PTR [esp+0x64]
  4e3d8b:	d9 84 24 80 01 00 00 	fld    DWORD PTR [esp+0x180]
  4e3d92:	d8 05 e0 f7 58 00    	fadd   DWORD PTR ds:0x58f7e0
  4e3d98:	8b 4c 24 64          	mov    ecx,DWORD PTR [esp+0x64]
  4e3d9c:	8b 84 24 80 01 00 00 	mov    eax,DWORD PTR [esp+0x180]
  4e3da3:	8b 94 24 74 01 00 00 	mov    edx,DWORD PTR [esp+0x174]
  4e3daa:	50                   	push   eax
  4e3dab:	d8 3d e4 f7 58 00    	fdivr  DWORD PTR ds:0x58f7e4
  4e3db1:	89 4c 24 30          	mov    DWORD PTR [esp+0x30],ecx
  4e3db5:	8b 8c 24 7c 01 00 00 	mov    ecx,DWORD PTR [esp+0x17c]
  4e3dbc:	51                   	push   ecx
  4e3dbd:	52                   	push   edx
  4e3dbe:	d9 5c 24 0c          	fstp   DWORD PTR [esp+0xc]
  4e3dc2:	e8 f9 f8 ff ff       	call   0x4e36c0
  4e3dc7:	c7 44 24 60 00 00 00 	mov    DWORD PTR [esp+0x60],0x0
  4e3dce:	00 
  4e3dcf:	89 74 24 74          	mov    DWORD PTR [esp+0x74],esi
  4e3dd3:	83 c4 1c             	add    esp,0x1c
  4e3dd6:	39 74 24 20          	cmp    DWORD PTR [esp+0x20],esi
  4e3dda:	0f 8e d8 02 00 00    	jle    0x4e40b8
  4e3de0:	c7 44 24 2c a8 f4 a0 	mov    DWORD PTR [esp+0x2c],0xa0f4a8
  4e3de7:	00 
  4e3de8:	be 04 00 00 00       	mov    esi,0x4
  4e3ded:	d9 44 24 1c          	fld    DWORD PTR [esp+0x1c]
  4e3df1:	d9 fe                	fsin
  4e3df3:	d9 54 24 10          	fst    DWORD PTR [esp+0x10]
  4e3df7:	d8 8c 24 6c 01 00 00 	fmul   DWORD PTR [esp+0x16c]
  4e3dfe:	d9 54 24 18          	fst    DWORD PTR [esp+0x18]
  4e3e02:	d8 64 24 44          	fsub   DWORD PTR [esp+0x44]
  4e3e06:	d8 7c 24 18          	fdivr  DWORD PTR [esp+0x18]
  4e3e0a:	d8 0d b0 f7 58 00    	fmul   DWORD PTR ds:0x58f7b0
  4e3e10:	d8 0d 18 f8 58 00    	fmul   DWORD PTR ds:0x58f818
  4e3e16:	e8 39 7e 07 00       	call   0x55bc54
  4e3e1b:	3d 80 00 00 00       	cmp    eax,0x80
  4e3e20:	7e 05                	jle    0x4e3e27
  4e3e22:	b8 80 00 00 00       	mov    eax,0x80
  4e3e27:	d9 05 b0 f7 58 00    	fld    DWORD PTR ds:0x58f7b0
  4e3e2d:	89 44 24 5c          	mov    DWORD PTR [esp+0x5c],eax
  4e3e31:	da 74 24 5c          	fidiv  DWORD PTR [esp+0x5c]
  4e3e35:	d8 0d 18 f8 58 00    	fmul   DWORD PTR ds:0x58f818
  4e3e3b:	33 db                	xor    ebx,ebx
  4e3e3d:	33 ff                	xor    edi,edi
  4e3e3f:	d9 5c 24 24          	fstp   DWORD PTR [esp+0x24]
  4e3e43:	d9 84 24 74 01 00 00 	fld    DWORD PTR [esp+0x174]
  4e3e4a:	d8 4c 24 10          	fmul   DWORD PTR [esp+0x10]
  4e3e4e:	8b 4c 24 24          	mov    ecx,DWORD PTR [esp+0x24]
  4e3e52:	89 86 98 a6 a1 00    	mov    DWORD PTR [esi+0xa1a698],eax
  4e3e58:	a1 88 48 5d 00       	mov    eax,ds:0x5d4888
  4e3e5d:	89 4c 24 28          	mov    DWORD PTR [esp+0x28],ecx
  4e3e61:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  4e3e65:	89 86 e8 45 a1 00    	mov    DWORD PTR [esi+0xa145e8],eax
  4e3e6b:	d9 5c 24 5c          	fstp   DWORD PTR [esp+0x5c]
  4e3e6f:	89 4c 24 44          	mov    DWORD PTR [esp+0x44],ecx
  4e3e73:	3d 00 08 00 00       	cmp    eax,0x800
  4e3e78:	0f 8d 24 04 00 00    	jge    0x4e42a2
  4e3e7e:	d9 84 24 70 01 00 00 	fld    DWORD PTR [esp+0x170]
  4e3e85:	d8 44 24 5c          	fadd   DWORD PTR [esp+0x5c]
  4e3e89:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  4e3e8d:	50                   	push   eax
  4e3e8e:	68 00 00 80 3f       	push   0x3f800000
  4e3e93:	53                   	push   ebx
  4e3e94:	d9 54 24 58          	fst    DWORD PTR [esp+0x58]
  4e3e98:	d8 05 e0 f7 58 00    	fadd   DWORD PTR ds:0x58f7e0
  4e3e9e:	8b 54 24 58          	mov    edx,DWORD PTR [esp+0x58]
  4e3ea2:	8b 84 24 74 01 00 00 	mov    eax,DWORD PTR [esp+0x174]
  4e3ea9:	d8 3d e4 f7 58 00    	fdivr  DWORD PTR ds:0x58f7e4
  4e3eaf:	d9 5c 24 54          	fstp   DWORD PTR [esp+0x54]
  4e3eb3:	d9 44 24 24          	fld    DWORD PTR [esp+0x24]
  4e3eb7:	d8 84 24 70 01 00 00 	fadd   DWORD PTR [esp+0x170]
  4e3ebe:	8b 4c 24 54          	mov    ecx,DWORD PTR [esp+0x54]
  4e3ec2:	51                   	push   ecx
  4e3ec3:	52                   	push   edx
  4e3ec4:	50                   	push   eax
  4e3ec5:	83 ec 04             	sub    esp,0x4
  4e3ec8:	d9 1c 24             	fstp   DWORD PTR [esp]
  4e3ecb:	e8 f0 f7 ff ff       	call   0x4e36c0
  4e3ed0:	d9 44 24 40          	fld    DWORD PTR [esp+0x40]
  4e3ed4:	d9 ff                	fcos
  4e3ed6:	83 c4 1c             	add    esp,0x1c
  4e3ed9:	c7 44 24 30 00 00 80 	mov    DWORD PTR [esp+0x30],0x3f800000
  4e3ee0:	3f 
  4e3ee1:	89 5c 24 34          	mov    DWORD PTR [esp+0x34],ebx
  4e3ee5:	8b 4c 24 2c          	mov    ecx,DWORD PTR [esp+0x2c]
  4e3ee9:	89 19                	mov    DWORD PTR [ecx],ebx
  4e3eeb:	8d a9 00 fe ff ff    	lea    ebp,[ecx-0x200]
  4e3ef1:	89 4c 24 50          	mov    DWORD PTR [esp+0x50],ecx
  4e3ef5:	d9 5c 24 10          	fstp   DWORD PTR [esp+0x10]
  4e3ef9:	d9 44 24 24          	fld    DWORD PTR [esp+0x24]
  4e3efd:	d9 fe                	fsin
  4e3eff:	d9 5c 24 5c          	fstp   DWORD PTR [esp+0x5c]
  4e3f03:	8b 8e 94 a6 a1 00    	mov    ecx,DWORD PTR [esi+0xa1a694]
  4e3f09:	2b cb                	sub    ecx,ebx
  4e3f0b:	83 f9 01             	cmp    ecx,0x1
  4e3f0e:	75 11                	jne    0x4e3f21
  4e3f10:	8b 86 98 a6 a1 00    	mov    eax,DWORD PTR [esi+0xa1a698]
  4e3f16:	2b c7                	sub    eax,edi
  4e3f18:	83 f8 01             	cmp    eax,0x1
  4e3f1b:	0f 84 22 01 00 00    	je     0x4e4043
  4e3f21:	d9 45 00             	fld    DWORD PTR [ebp+0x0]
  4e3f24:	d8 5c 24 28          	fcomp  DWORD PTR [esp+0x28]
  4e3f28:	df e0                	fnstsw ax
  4e3f2a:	f6 c4 01             	test   ah,0x1
  4e3f2d:	74 09                	je     0x4e3f38
  4e3f2f:	83 f9 01             	cmp    ecx,0x1
  4e3f32:	0f 85 cf 00 00 00    	jne    0x4e4007
  4e3f38:	8b 86 98 a6 a1 00    	mov    eax,DWORD PTR [esi+0xa1a698]
  4e3f3e:	2b c7                	sub    eax,edi
  4e3f40:	83 f8 01             	cmp    eax,0x1
  4e3f43:	0f 84 be 00 00 00    	je     0x4e4007
  4e3f49:	d9 44 24 10          	fld    DWORD PTR [esp+0x10]
  4e3f4d:	d8 4c 24 30          	fmul   DWORD PTR [esp+0x30]
  4e3f51:	8b 4c 24 28          	mov    ecx,DWORD PTR [esp+0x28]
  4e3f55:	8b 44 24 50          	mov    eax,DWORD PTR [esp+0x50]
  4e3f59:	81 3d 88 48 5d 00 00 	cmp    DWORD PTR ds:0x5d4888,0x800
  4e3f60:	08 00 00 
  4e3f63:	89 08                	mov    DWORD PTR [eax],ecx
  4e3f65:	d9 44 24 5c          	fld    DWORD PTR [esp+0x5c]
  4e3f69:	d8 4c 24 34          	fmul   DWORD PTR [esp+0x34]
  4e3f6d:	de e9                	fsubp  st(1),st
  4e3f6f:	d9 5c 24 3c          	fstp   DWORD PTR [esp+0x3c]
  4e3f73:	d9 44 24 5c          	fld    DWORD PTR [esp+0x5c]
  4e3f77:	d8 4c 24 30          	fmul   DWORD PTR [esp+0x30]
  4e3f7b:	d9 44 24 10          	fld    DWORD PTR [esp+0x10]
  4e3f7f:	d8 4c 24 34          	fmul   DWORD PTR [esp+0x34]
  4e3f83:	8b 54 24 3c          	mov    edx,DWORD PTR [esp+0x3c]
  4e3f87:	89 54 24 30          	mov    DWORD PTR [esp+0x30],edx
  4e3f8b:	de c1                	faddp  st(1),st
  4e3f8d:	d9 5c 24 38          	fstp   DWORD PTR [esp+0x38]
  4e3f91:	8b 4c 24 38          	mov    ecx,DWORD PTR [esp+0x38]
  4e3f95:	89 4c 24 34          	mov    DWORD PTR [esp+0x34],ecx
  4e3f99:	0f 8d 03 03 00 00    	jge    0x4e42a2
  4e3f9f:	d9 44 24 18          	fld    DWORD PTR [esp+0x18]
  4e3fa3:	d8 4c 24 38          	fmul   DWORD PTR [esp+0x38]
  4e3fa7:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  4e3fab:	8b 4c 24 3c          	mov    ecx,DWORD PTR [esp+0x3c]
  4e3faf:	8b 54 24 38          	mov    edx,DWORD PTR [esp+0x38]
  4e3fb3:	50                   	push   eax
  4e3fb4:	d8 ac 24 6c 01 00 00 	fsubr  DWORD PTR [esp+0x16c]
  4e3fbb:	8b 44 24 4c          	mov    eax,DWORD PTR [esp+0x4c]
  4e3fbf:	51                   	push   ecx
  4e3fc0:	8b 4c 24 54          	mov    ecx,DWORD PTR [esp+0x54]
  4e3fc4:	52                   	push   edx
  4e3fc5:	50                   	push   eax
  4e3fc6:	51                   	push   ecx
  4e3fc7:	83 ec 04             	sub    esp,0x4
  4e3fca:	83 ec 04             	sub    esp,0x4
  4e3fcd:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  4e3fd1:	d9 44 24 34          	fld    DWORD PTR [esp+0x34]
  4e3fd5:	d8 4c 24 58          	fmul   DWORD PTR [esp+0x58]
  4e3fd9:	d8 84 24 80 01 00 00 	fadd   DWORD PTR [esp+0x180]
  4e3fe0:	d9 1c 24             	fstp   DWORD PTR [esp]
  4e3fe3:	e8 d8 f6 ff ff       	call   0x4e36c0
  4e3fe8:	d9 44 24 44          	fld    DWORD PTR [esp+0x44]
  4e3fec:	d8 44 24 40          	fadd   DWORD PTR [esp+0x40]
  4e3ff0:	8b 86 e8 45 a1 00    	mov    eax,DWORD PTR [esi+0xa145e8]
  4e3ff6:	83 c4 1c             	add    esp,0x1c
  4e3ff9:	03 c7                	add    eax,edi
  4e3ffb:	47                   	inc    edi
  4e3ffc:	83 44 24 50 04       	add    DWORD PTR [esp+0x50],0x4
  4e4001:	d9 5c 24 28          	fstp   DWORD PTR [esp+0x28]
  4e4005:	eb 0c                	jmp    0x4e4013
  4e4007:	8b 86 e4 45 a1 00    	mov    eax,DWORD PTR [esi+0xa145e4]
  4e400d:	83 c5 04             	add    ebp,0x4
  4e4010:	03 c3                	add    eax,ebx
  4e4012:	43                   	inc    ebx
  4e4013:	81 3d 8c 48 5d 00 00 	cmp    DWORD PTR ds:0x5d488c,0x1000
  4e401a:	10 00 00 
  4e401d:	0f 8d 95 00 00 00    	jge    0x4e40b8
  4e4023:	50                   	push   eax
  4e4024:	8b 86 e8 45 a1 00    	mov    eax,DWORD PTR [esi+0xa145e8]
  4e402a:	03 c7                	add    eax,edi
  4e402c:	50                   	push   eax
  4e402d:	8b 86 e4 45 a1 00    	mov    eax,DWORD PTR [esi+0xa145e4]
  4e4033:	03 c3                	add    eax,ebx
  4e4035:	50                   	push   eax
  4e4036:	e8 55 f8 ff ff       	call   0x4e3890
  4e403b:	83 c4 0c             	add    esp,0xc
  4e403e:	e9 c0 fe ff ff       	jmp    0x4e3f03
  4e4043:	81 3d 8c 48 5d 00 00 	cmp    DWORD PTR ds:0x5d488c,0x1000
  4e404a:	10 00 00 
  4e404d:	7d 69                	jge    0x4e40b8
  4e404f:	8b 86 e4 45 a1 00    	mov    eax,DWORD PTR [esi+0xa145e4]
  4e4055:	8b 8e e8 45 a1 00    	mov    ecx,DWORD PTR [esi+0xa145e8]
  4e405b:	50                   	push   eax
  4e405c:	03 cf                	add    ecx,edi
  4e405e:	51                   	push   ecx
  4e405f:	03 c3                	add    eax,ebx
  4e4061:	50                   	push   eax
  4e4062:	e8 29 f8 ff ff       	call   0x4e3890
  4e4067:	83 c4 0c             	add    esp,0xc
  4e406a:	81 3d 8c 48 5d 00 00 	cmp    DWORD PTR ds:0x5d488c,0x1000
  4e4071:	10 00 00 
  4e4074:	7d 42                	jge    0x4e40b8
  4e4076:	8b 86 e8 45 a1 00    	mov    eax,DWORD PTR [esi+0xa145e8]
  4e407c:	8b 8e e4 45 a1 00    	mov    ecx,DWORD PTR [esi+0xa145e4]
  4e4082:	50                   	push   eax
  4e4083:	51                   	push   ecx
  4e4084:	03 c7                	add    eax,edi
  4e4086:	83 c6 04             	add    esi,0x4
  4e4089:	50                   	push   eax
  4e408a:	e8 01 f8 ff ff       	call   0x4e3890
  4e408f:	d9 44 24 28          	fld    DWORD PTR [esp+0x28]
  4e4093:	d8 44 24 60          	fadd   DWORD PTR [esp+0x60]
  4e4097:	ff 44 24 64          	inc    DWORD PTR [esp+0x64]
  4e409b:	83 c4 0c             	add    esp,0xc
  4e409e:	d9 5c 24 1c          	fstp   DWORD PTR [esp+0x1c]
  4e40a2:	81 44 24 2c 00 02 00 	add    DWORD PTR [esp+0x2c],0x200
  4e40a9:	00 
  4e40aa:	8b 4c 24 58          	mov    ecx,DWORD PTR [esp+0x58]
  4e40ae:	3b 4c 24 20          	cmp    ecx,DWORD PTR [esp+0x20]
  4e40b2:	0f 8c 35 fd ff ff    	jl     0x4e3ded
  4e40b8:	83 3d 84 48 5d 00 00 	cmp    DWORD PTR ds:0x5d4884,0x0
  4e40bf:	0f 85 dd 01 00 00    	jne    0x4e42a2
  4e40c5:	8b b4 24 60 01 00 00 	mov    esi,DWORD PTR [esp+0x160]
  4e40cc:	6a 01                	push   0x1
  4e40ce:	8b 1e                	mov    ebx,DWORD PTR [esi]
  4e40d0:	6a 03                	push   0x3
  4e40d2:	56                   	push   esi
  4e40d3:	8b 7b 5c             	mov    edi,DWORD PTR [ebx+0x5c]
  4e40d6:	ff d7                	call   edi
  4e40d8:	6a 02                	push   0x2
  4e40da:	6a 11                	push   0x11
  4e40dc:	56                   	push   esi
  4e40dd:	ff d7                	call   edi
  4e40df:	6a 02                	push   0x2
  4e40e1:	6a 12                	push   0x12
  4e40e3:	56                   	push   esi
  4e40e4:	ff d7                	call   edi
  4e40e6:	6a 01                	push   0x1
  4e40e8:	6a 1d                	push   0x1d
  4e40ea:	56                   	push   esi
  4e40eb:	ff d7                	call   edi
  4e40ed:	83 3d 90 48 5d 00 00 	cmp    DWORD PTR ds:0x5d4890,0x0
  4e40f4:	74 2a                	je     0x4e4120
  4e40f6:	83 3d 88 48 5d 00 00 	cmp    DWORD PTR ds:0x5d4888,0x0
  4e40fd:	74 21                	je     0x4e4120
  4e40ff:	6a 08                	push   0x8
  4e4101:	a1 90 48 5d 00       	mov    eax,ds:0x5d4890
  4e4106:	50                   	push   eax
  4e4107:	8b 0d 88 48 5d 00    	mov    ecx,DWORD PTR ds:0x5d4888
  4e410d:	68 20 a7 a1 00       	push   0xa1a720
  4e4112:	51                   	push   ecx
  4e4113:	68 20 07 a2 00       	push   0xa20720
  4e4118:	6a 03                	push   0x3
  4e411a:	6a 04                	push   0x4
  4e411c:	56                   	push   esi
  4e411d:	ff 53 78             	call   DWORD PTR [ebx+0x78]
  4e4120:	6a 05                	push   0x5
  4e4122:	6a 13                	push   0x13
  4e4124:	56                   	push   esi
  4e4125:	ff d7                	call   edi
  4e4127:	6a 06                	push   0x6
  4e4129:	6a 14                	push   0x14
  4e412b:	56                   	push   esi
  4e412c:	ff d7                	call   edi
  4e412e:	d9 84 24 6c 01 00 00 	fld    DWORD PTR [esp+0x16c]
  4e4135:	d8 0d 04 f8 58 00    	fmul   DWORD PTR ds:0x58f804
  4e413b:	6a 01                	push   0x1
  4e413d:	6a 1b                	push   0x1b
  4e413f:	56                   	push   esi
  4e4140:	d9 5c 24 1c          	fstp   DWORD PTR [esp+0x1c]
  4e4144:	ff d7                	call   edi
  4e4146:	6a 00                	push   0x0
  4e4148:	6a 29                	push   0x29
  4e414a:	56                   	push   esi
  4e414b:	ff d7                	call   edi
  4e414d:	6a 00                	push   0x0
  4e414f:	6a 0f                	push   0xf
  4e4151:	56                   	push   esi
  4e4152:	ff d7                	call   edi
  4e4154:	83 3d 94 48 5d 00 00 	cmp    DWORD PTR ds:0x5d4894,0x0
  4e415b:	0f 84 33 01 00 00    	je     0x4e4294
  4e4161:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  4e4166:	83 b8 e4 06 00 00 00 	cmp    DWORD PTR [eax+0x6e4],0x0
  4e416d:	74 6f                	je     0x4e41de
  4e416f:	6a 00                	push   0x0
  4e4171:	6a 01                	push   0x1
  4e4173:	56                   	push   esi
  4e4174:	ff d7                	call   edi
  4e4176:	8b 84 24 64 01 00 00 	mov    eax,DWORD PTR [esp+0x164]
  4e417d:	8b 8c 24 68 01 00 00 	mov    ecx,DWORD PTR [esp+0x168]
  4e4184:	8b 94 24 70 01 00 00 	mov    edx,DWORD PTR [esp+0x170]
  4e418b:	a3 70 46 a1 00       	mov    ds:0xa14670,eax
  4e4190:	8b 84 24 6c 01 00 00 	mov    eax,DWORD PTR [esp+0x16c]
  4e4197:	89 0d 74 46 a1 00    	mov    DWORD PTR ds:0xa14674,ecx
  4e419d:	d9 44 24 40          	fld    DWORD PTR [esp+0x40]
  4e41a1:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  4e41a5:	89 15 78 46 a1 00    	mov    DWORD PTR ds:0xa14678,edx
  4e41ab:	a3 7c 46 a1 00       	mov    ds:0xa1467c,eax
  4e41b0:	89 0d 80 46 a1 00    	mov    DWORD PTR ds:0xa14680,ecx
  4e41b6:	c7 05 84 46 a1 00 00 	mov    DWORD PTR ds:0xa14684,0x800000
  4e41bd:	00 80 00 
  4e41c0:	e8 8f 7a 07 00       	call   0x55bc54
  4e41c5:	c7 05 8c 46 a1 00 00 	mov    DWORD PTR ds:0xa1468c,0x0
  4e41cc:	00 00 00 
  4e41cf:	a3 88 46 a1 00       	mov    ds:0xa14688,eax
  4e41d4:	e8 67 f8 ff ff       	call   0x4e3a40
  4e41d9:	e9 b6 00 00 00       	jmp    0x4e4294
  4e41de:	b9 c8 c9 65 00       	mov    ecx,0x65c9c8
  4e41e3:	e8 38 56 02 00       	call   0x509820
  4e41e8:	d9 44 24 40          	fld    DWORD PTR [esp+0x40]
  4e41ec:	e8 63 7a 07 00       	call   0x55bc54
  4e41f1:	d9 44 24 10          	fld    DWORD PTR [esp+0x10]
  4e41f5:	d8 0d 08 f8 58 00    	fmul   DWORD PTR ds:0x58f808
  4e41fb:	8b d8                	mov    ebx,eax
  4e41fd:	6a 00                	push   0x0
  4e41ff:	53                   	push   ebx
  4e4200:	68 00 00 80 ff       	push   0xff800000
  4e4205:	d8 84 24 78 01 00 00 	fadd   DWORD PTR [esp+0x178]
  4e420c:	68 00 00 80 ff       	push   0xff800000
  4e4211:	83 ec 04             	sub    esp,0x4
  4e4214:	d9 5c 24 70          	fstp   DWORD PTR [esp+0x70]
  4e4218:	d9 44 24 24          	fld    DWORD PTR [esp+0x24]
  4e421c:	d8 84 24 80 01 00 00 	fadd   DWORD PTR [esp+0x180]
  4e4223:	8b 44 24 70          	mov    eax,DWORD PTR [esp+0x70]
  4e4227:	8b 8c 24 84 01 00 00 	mov    ecx,DWORD PTR [esp+0x184]
  4e422e:	8b 94 24 7c 01 00 00 	mov    edx,DWORD PTR [esp+0x17c]
  4e4235:	50                   	push   eax
  4e4236:	8b 84 24 7c 01 00 00 	mov    eax,DWORD PTR [esp+0x17c]
  4e423d:	51                   	push   ecx
  4e423e:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  4e4242:	52                   	push   edx
  4e4243:	50                   	push   eax
  4e4244:	56                   	push   esi
  4e4245:	e8 66 00 00 00       	call   0x4e42b0
  4e424a:	8b 8c 24 84 00 00 00 	mov    ecx,DWORD PTR [esp+0x84]
  4e4251:	83 c4 28             	add    esp,0x28
  4e4254:	d9 84 24 6c 01 00 00 	fld    DWORD PTR [esp+0x16c]
  4e425b:	d8 64 24 10          	fsub   DWORD PTR [esp+0x10]
  4e425f:	6a 01                	push   0x1
  4e4261:	53                   	push   ebx
  4e4262:	8b 94 24 78 01 00 00 	mov    edx,DWORD PTR [esp+0x178]
  4e4269:	68 00 00 80 ff       	push   0xff800000
  4e426e:	8b 84 24 74 01 00 00 	mov    eax,DWORD PTR [esp+0x174]
  4e4275:	68 00 00 80 ff       	push   0xff800000
  4e427a:	51                   	push   ecx
  4e427b:	8b 8c 24 78 01 00 00 	mov    ecx,DWORD PTR [esp+0x178]
  4e4282:	83 ec 04             	sub    esp,0x4
  4e4285:	d9 1c 24             	fstp   DWORD PTR [esp]
  4e4288:	52                   	push   edx
  4e4289:	50                   	push   eax
  4e428a:	51                   	push   ecx
  4e428b:	56                   	push   esi
  4e428c:	e8 1f 00 00 00       	call   0x4e42b0
  4e4291:	83 c4 28             	add    esp,0x28
  4e4294:	6a 00                	push   0x0
  4e4296:	6a 1b                	push   0x1b
  4e4298:	56                   	push   esi
  4e4299:	ff d7                	call   edi
  4e429b:	6a 00                	push   0x0
  4e429d:	6a 1d                	push   0x1d
  4e429f:	56                   	push   esi
  4e42a0:	ff d7                	call   edi
  4e42a2:	5d                   	pop    ebp
  4e42a3:	5f                   	pop    edi
  4e42a4:	5e                   	pop    esi
  4e42a5:	5b                   	pop    ebx
  4e42a6:	81 c4 4c 01 00 00    	add    esp,0x14c
  4e42ac:	c3                   	ret
  4e42ad:	cc                   	int3
  4e42ae:	cc                   	int3
  4e42af:	cc                   	int3
