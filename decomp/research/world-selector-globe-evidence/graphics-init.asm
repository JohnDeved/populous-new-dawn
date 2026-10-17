
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00428c80 <.text+0x27c80>:
  428c80:	83 c4 08             	add    esp,0x8
  428c83:	51                   	push   ecx
  428c84:	68 00 00 04 00       	push   0x40000
  428c89:	52                   	push   edx
  428c8a:	68 23 cd 89 00       	push   0x89cd23
  428c8f:	e8 ec d2 0f 00       	call   0x525f80
  428c94:	83 c4 10             	add    esp,0x10
  428c97:	b8 00 02 00 00       	mov    eax,0x200
  428c9c:	89 44 24 68          	mov    DWORD PTR [esp+0x68],eax
  428ca0:	6a 00                	push   0x0
  428ca2:	8b 54 24 6c          	mov    edx,DWORD PTR [esp+0x6c]
  428ca6:	6a 00                	push   0x0
  428ca8:	8d 4c 24 40          	lea    ecx,[esp+0x40]
  428cac:	68 50 5b d0 00       	push   0xd05b50
  428cb1:	50                   	push   eax
  428cb2:	52                   	push   edx
  428cb3:	e8 68 07 10 00       	call   0x529420
  428cb8:	8d 4c 24 38          	lea    ecx,[esp+0x38]
  428cbc:	e8 bf 07 10 00       	call   0x529480
  428cc1:	8b 54 24 40          	mov    edx,DWORD PTR [esp+0x40]
  428cc5:	8b 7c 24 38          	mov    edi,DWORD PTR [esp+0x38]
  428cc9:	0f af 54 24 44       	imul   edx,DWORD PTR [esp+0x44]
  428cce:	33 c0                	xor    eax,eax
  428cd0:	8b ca                	mov    ecx,edx
  428cd2:	c1 e9 02             	shr    ecx,0x2
  428cd5:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  428cd7:	8b ca                	mov    ecx,edx
  428cd9:	83 e1 03             	and    ecx,0x3
  428cdc:	f3 aa                	rep stos BYTE PTR es:[edi],al
  428cde:	33 f6                	xor    esi,esi
  428ce0:	8b 5c 24 18          	mov    ebx,DWORD PTR [esp+0x18]
  428ce4:	c7 44 24 1c 00 01 00 	mov    DWORD PTR [esp+0x1c],0x100
  428ceb:	00 
  428cec:	c7 44 24 20 00 01 00 	mov    DWORD PTR [esp+0x20],0x100
  428cf3:	00 
  428cf4:	33 ff                	xor    edi,edi
  428cf6:	bd 00 01 00 00       	mov    ebp,0x100
  428cfb:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  428cff:	6a 00                	push   0x0
  428d01:	8b 4c 24 24          	mov    ecx,DWORD PTR [esp+0x24]
  428d05:	53                   	push   ebx
  428d06:	68 80 5b d0 00       	push   0xd05b80
  428d0b:	81 c3 00 00 01 00    	add    ebx,0x10000
  428d11:	51                   	push   ecx
  428d12:	50                   	push   eax
  428d13:	8d 4c 24 7c          	lea    ecx,[esp+0x7c]
  428d17:	e8 04 07 10 00       	call   0x529420
  428d1c:	8d 8c 24 90 00 00 00 	lea    ecx,[esp+0x90]
  428d23:	e8 d8 06 10 00       	call   0x529400
  428d28:	8d 4c 24 28          	lea    ecx,[esp+0x28]
  428d2c:	8d 54 24 30          	lea    edx,[esp+0x30]
  428d30:	8d 84 24 90 00 00 00 	lea    eax,[esp+0x90]
  428d37:	51                   	push   ecx
  428d38:	8d 4c 24 3c          	lea    ecx,[esp+0x3c]
  428d3c:	52                   	push   edx
  428d3d:	89 6c 24 30          	mov    DWORD PTR [esp+0x30],ebp
  428d41:	50                   	push   eax
  428d42:	89 6c 24 38          	mov    DWORD PTR [esp+0x38],ebp
  428d46:	89 7c 24 3c          	mov    DWORD PTR [esp+0x3c],edi
  428d4a:	03 fd                	add    edi,ebp
  428d4c:	89 74 24 40          	mov    DWORD PTR [esp+0x40],esi
  428d50:	e8 8b 07 10 00       	call   0x5294e0
  428d55:	8d 8c 24 20 02 00 00 	lea    ecx,[esp+0x220]
  428d5c:	8d 94 24 90 00 00 00 	lea    edx,[esp+0x90]
  428d63:	8d 44 24 68          	lea    eax,[esp+0x68]
  428d67:	51                   	push   ecx
  428d68:	52                   	push   edx
  428d69:	50                   	push   eax
  428d6a:	e8 31 79 00 00       	call   0x4306a0
  428d6f:	83 c4 0c             	add    esp,0xc
  428d72:	81 ff 00 02 00 00    	cmp    edi,0x200
  428d78:	7c 81                	jl     0x428cfb
  428d7a:	81 c6 00 01 00 00    	add    esi,0x100
  428d80:	81 fe 00 02 00 00    	cmp    esi,0x200
  428d86:	0f 8c 68 ff ff ff    	jl     0x428cf4
  428d8c:	33 f6                	xor    esi,esi
  428d8e:	8d 44 24 10          	lea    eax,[esp+0x10]
  428d92:	50                   	push   eax
  428d93:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  428d99:	8b 44 24 44          	mov    eax,DWORD PTR [esp+0x44]
  428d9d:	68 00 18 00 00       	push   0x1800
  428da2:	c1 e8 02             	shr    eax,0x2
  428da5:	89 74 24 18          	mov    DWORD PTR [esp+0x18],esi
  428da9:	8b 91 a0 1d 00 00    	mov    edx,DWORD PTR [ecx+0x1da0]
  428daf:	52                   	push   edx
  428db0:	56                   	push   esi
  428db1:	50                   	push   eax
  428db2:	8b 51 04             	mov    edx,DWORD PTR [ecx+0x4]
  428db5:	8b 44 24 50          	mov    eax,DWORD PTR [esp+0x50]
  428db9:	c1 e8 02             	shr    eax,0x2
  428dbc:	50                   	push   eax
  428dbd:	52                   	push   edx
  428dbe:	e8 2d 67 00 00       	call   0x42f4f0
  428dc3:	8d 8c 24 d4 00 00 00 	lea    ecx,[esp+0xd4]
  428dca:	83 c4 1c             	add    esp,0x1c
  428dcd:	e8 2e 06 10 00       	call   0x529400
  428dd2:	8d 8c 24 b8 00 00 00 	lea    ecx,[esp+0xb8]
  428dd9:	8b 54 24 10          	mov    edx,DWORD PTR [esp+0x10]
  428ddd:	51                   	push   ecx
  428dde:	52                   	push   edx
  428ddf:	e8 fc 7c 00 00       	call   0x430ae0
  428de4:	8d 4c 24 40          	lea    ecx,[esp+0x40]
  428de8:	83 c4 08             	add    esp,0x8
  428deb:	6a 02                	push   0x2
  428ded:	6a 02                	push   0x2
  428def:	51                   	push   ecx
  428df0:	e8 db 78 00 00       	call   0x4306d0
  428df5:	8d 8c 24 c4 00 00 00 	lea    ecx,[esp+0xc4]
  428dfc:	8d 54 24 44          	lea    edx,[esp+0x44]
  428e00:	83 c4 0c             	add    esp,0xc
  428e03:	56                   	push   esi
  428e04:	51                   	push   ecx
  428e05:	52                   	push   edx
  428e06:	e8 95 78 00 00       	call   0x4306a0
  428e0b:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  428e0f:	83 c4 0c             	add    esp,0xc
  428e12:	51                   	push   ecx
  428e13:	e8 78 7d 00 00       	call   0x430b90
  428e18:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  428e1c:	83 c4 04             	add    esp,0x4
  428e1f:	56                   	push   esi
  428e20:	56                   	push   esi
  428e21:	51                   	push   ecx
  428e22:	8b 8c 24 38 06 00 00 	mov    ecx,DWORD PTR [esp+0x638]
  428e29:	e8 32 0a 0e 00       	call   0x509860
  428e2e:	39 74 24 10          	cmp    DWORD PTR [esp+0x10],esi
  428e32:	74 0e                	je     0x428e42
  428e34:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  428e38:	50                   	push   eax
  428e39:	8b 18                	mov    ebx,DWORD PTR [eax]
  428e3b:	ff 53 08             	call   DWORD PTR [ebx+0x8]
  428e3e:	89 74 24 10          	mov    DWORD PTR [esp+0x10],esi
  428e42:	8d 4c 24 38          	lea    ecx,[esp+0x38]
  428e46:	e8 75 06 10 00       	call   0x5294c0
  428e4b:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  428e4f:	50                   	push   eax
  428e50:	e8 fb 1e 13 00       	call   0x55ad50
  428e55:	83 c4 04             	add    esp,0x4
  428e58:	33 c0                	xor    eax,eax
  428e5a:	5d                   	pop    ebp
  428e5b:	5f                   	pop    edi
  428e5c:	5e                   	pop    esi
  428e5d:	5b                   	pop    ebx
  428e5e:	81 c4 10 06 00 00    	add    esp,0x610
  428e64:	c3                   	ret
  428e65:	cc                   	int3
  428e66:	cc                   	int3
  428e67:	cc                   	int3
  428e68:	cc                   	int3
  428e69:	cc                   	int3
  428e6a:	cc                   	int3
  428e6b:	cc                   	int3
  428e6c:	cc                   	int3
  428e6d:	cc                   	int3
  428e6e:	cc                   	int3
  428e6f:	cc                   	int3
  428e70:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  428e76:	55                   	push   ebp
  428e77:	8b ec                	mov    ebp,esp
  428e79:	6a ff                	push   0xffffffff
  428e7b:	68 4c 90 42 00       	push   0x42904c
  428e80:	50                   	push   eax
  428e81:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  428e88:	83 ec 38             	sub    esp,0x38
  428e8b:	53                   	push   ebx
  428e8c:	56                   	push   esi
  428e8d:	57                   	push   edi
  428e8e:	e8 ed e8 0e 00       	call   0x517780
  428e93:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  428e98:	6a 0c                	push   0xc
  428e9a:	8b b0 a8 1d 00 00    	mov    esi,DWORD PTR [eax+0x1da8]
  428ea0:	e8 fb 1d 13 00       	call   0x55aca0
  428ea5:	89 45 f0             	mov    DWORD PTR [ebp-0x10],eax
  428ea8:	83 c4 04             	add    esp,0x4
  428eab:	c7 45 fc 00 00 00 00 	mov    DWORD PTR [ebp-0x4],0x0
  428eb2:	8b f8                	mov    edi,eax
  428eb4:	b8 00 00 00 00       	mov    eax,0x0
  428eb9:	85 ff                	test   edi,edi
  428ebb:	74 4b                	je     0x428f08
  428ebd:	8b 46 10             	mov    eax,DWORD PTR [esi+0x10]
  428ec0:	89 45 e0             	mov    DWORD PTR [ebp-0x20],eax
  428ec3:	8b 4e 14             	mov    ecx,DWORD PTR [esi+0x14]
  428ec6:	89 4d e4             	mov    DWORD PTR [ebp-0x1c],ecx
  428ec9:	8b 56 18             	mov    edx,DWORD PTR [esi+0x18]
  428ecc:	89 55 e8             	mov    DWORD PTR [ebp-0x18],edx
  428ecf:	8b 46 1c             	mov    eax,DWORD PTR [esi+0x1c]
  428ed2:	89 45 ec             	mov    DWORD PTR [ebp-0x14],eax
  428ed5:	8b 4e 10             	mov    ecx,DWORD PTR [esi+0x10]
  428ed8:	89 4d d0             	mov    DWORD PTR [ebp-0x30],ecx
  428edb:	8b 56 14             	mov    edx,DWORD PTR [esi+0x14]
  428ede:	89 55 d4             	mov    DWORD PTR [ebp-0x2c],edx
  428ee1:	8d 55 e0             	lea    edx,[ebp-0x20]
  428ee4:	8b 46 18             	mov    eax,DWORD PTR [esi+0x18]
  428ee7:	52                   	push   edx
  428ee8:	89 45 d8             	mov    DWORD PTR [ebp-0x28],eax
  428eeb:	8d 45 d0             	lea    eax,[ebp-0x30]
  428eee:	8b 4e 1c             	mov    ecx,DWORD PTR [esi+0x1c]
  428ef1:	50                   	push   eax
  428ef2:	68 00 f0 87 00       	push   0x87f000
  428ef7:	89 4d dc             	mov    DWORD PTR [ebp-0x24],ecx
  428efa:	8b 0d f8 ef 87 00    	mov    ecx,DWORD PTR ds:0x87eff8
  428f00:	51                   	push   ecx
  428f01:	8b cf                	mov    ecx,edi
  428f03:	e8 68 d6 04 00       	call   0x476570
  428f08:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  428f0f:	68 f8 c3 59 00       	push   0x59c3f8
  428f14:	a3 00 c2 59 00       	mov    ds:0x59c200,eax
  428f19:	a3 cc cb 87 00       	mov    ds:0x87cbcc,eax
  428f1e:	e8 ad e5 02 00       	call   0x4574d0
  428f23:	83 c4 04             	add    esp,0x4
  428f26:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  428f2b:	6a 00                	push   0x0
  428f2d:	8b 48 04             	mov    ecx,DWORD PTR [eax+0x4]
  428f30:	56                   	push   esi
  428f31:	51                   	push   ecx
  428f32:	b9 38 ca 65 00       	mov    ecx,0x65ca38
  428f37:	e8 f4 75 03 00       	call   0x460530
  428f3c:	8b f8                	mov    edi,eax
  428f3e:	85 ff                	test   edi,edi
  428f40:	7d 21                	jge    0x428f63
  428f42:	57                   	push   edi
  428f43:	68 44 c3 59 00       	push   0x59c344
  428f48:	e8 83 e5 02 00       	call   0x4574d0
  428f4d:	83 c4 08             	add    esp,0x8
  428f50:	8b c7                	mov    eax,edi
  428f52:	8b 4d f4             	mov    ecx,DWORD PTR [ebp-0xc]
  428f55:	5f                   	pop    edi
  428f56:	64 89 0d 00 00 00 00 	mov    DWORD PTR fs:0x0,ecx
  428f5d:	5e                   	pop    esi
  428f5e:	5b                   	pop    ebx
  428f5f:	8b e5                	mov    esp,ebp
  428f61:	5d                   	pop    ebp
  428f62:	c3                   	ret
  428f63:	68 38 c3 59 00       	push   0x59c338
  428f68:	bb 50 ea 66 00       	mov    ebx,0x66ea50
  428f6d:	bf 48 a3 67 00       	mov    edi,0x67a348
  428f72:	e8 59 e5 02 00       	call   0x4574d0
  428f77:	83 c4 04             	add    esp,0x4
  428f7a:	68 e4 c3 59 00       	push   0x59c3e4
  428f7f:	e8 4c e5 02 00       	call   0x4574d0
  428f84:	83 c4 04             	add    esp,0x4
  428f87:	8b cf                	mov    ecx,edi
  428f89:	68 38 ca 65 00       	push   0x65ca38
  428f8e:	6a 00                	push   0x0
  428f90:	56                   	push   esi
  428f91:	68 80 00 00 00       	push   0x80
  428f96:	68 80 00 00 00       	push   0x80
  428f9b:	e8 e0 d4 04 00       	call   0x476480
  428fa0:	89 45 f0             	mov    DWORD PTR [ebp-0x10],eax
  428fa3:	85 c0                	test   eax,eax
  428fa5:	7c 78                	jl     0x42901f
  428fa7:	68 38 c3 59 00       	push   0x59c338
  428fac:	e8 1f e5 02 00       	call   0x4574d0
  428fb1:	83 c4 04             	add    esp,0x4
  428fb4:	8b 47 38             	mov    eax,DWORD PTR [edi+0x38]
  428fb7:	8b 4f 40             	mov    ecx,DWORD PTR [edi+0x40]
  428fba:	8b 57 48             	mov    edx,DWORD PTR [edi+0x48]
  428fbd:	89 45 bc             	mov    DWORD PTR [ebp-0x44],eax
  428fc0:	8d 45 bc             	lea    eax,[ebp-0x44]
  428fc3:	50                   	push   eax
  428fc4:	89 4d c0             	mov    DWORD PTR [ebp-0x40],ecx
  428fc7:	b9 38 ca 65 00       	mov    ecx,0x65ca38
  428fcc:	89 55 c4             	mov    DWORD PTR [ebp-0x3c],edx
  428fcf:	89 7d c8             	mov    DWORD PTR [ebp-0x38],edi
  428fd2:	e8 a9 76 03 00       	call   0x460680
  428fd7:	89 5f 58             	mov    DWORD PTR [edi+0x58],ebx
  428fda:	83 c7 60             	add    edi,0x60
  428fdd:	83 c3 24             	add    ebx,0x24
  428fe0:	81 ff c8 a4 67 00    	cmp    edi,0x67a4c8
  428fe6:	72 92                	jb     0x428f7a
  428fe8:	c7 05 24 c3 59 00 38 	mov    DWORD PTR ds:0x59c324,0x65ca38
  428fef:	ca 65 00 
  428ff2:	68 c8 c3 59 00       	push   0x59c3c8
  428ff7:	e8 d4 e4 02 00       	call   0x4574d0
  428ffc:	83 c4 04             	add    esp,0x4
  428fff:	e8 4c 5d 05 00       	call   0x47ed50
  429004:	8b f0                	mov    esi,eax
  429006:	85 f6                	test   esi,esi
  429008:	7d 2e                	jge    0x429038
  42900a:	56                   	push   esi
  42900b:	68 44 c3 59 00       	push   0x59c344
  429010:	e8 bb e4 02 00       	call   0x4574d0
  429015:	83 c4 08             	add    esp,0x8
  429018:	8b c6                	mov    eax,esi
  42901a:	e9 33 ff ff ff       	jmp    0x428f52
  42901f:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  429022:	50                   	push   eax
  429023:	68 44 c3 59 00       	push   0x59c344
  429028:	e8 a3 e4 02 00       	call   0x4574d0
  42902d:	83 c4 08             	add    esp,0x8
  429030:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  429033:	e9 1a ff ff ff       	jmp    0x428f52
  429038:	68 38 c3 59 00       	push   0x59c338
  42903d:	e8 8e e4 02 00       	call   0x4574d0
  429042:	83 c4 04             	add    esp,0x4
  429045:	33 c0                	xor    eax,eax
  429047:	e9 06 ff ff ff       	jmp    0x428f52
  42904c:	b8 c8 4f 59 00       	mov    eax,0x594fc8
  429051:	e9 9a 27 13 00       	jmp    0x55b7f0
  429056:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  429059:	50                   	push   eax
  42905a:	e8 f1 1c 13 00       	call   0x55ad50
  42905f:	83 c4 04             	add    esp,0x4
  429062:	c3                   	ret
  429063:	cc                   	int3
  429064:	cc                   	int3
  429065:	cc                   	int3
  429066:	cc                   	int3
  429067:	cc                   	int3
  429068:	cc                   	int3
  429069:	cc                   	int3
  42906a:	cc                   	int3
  42906b:	cc                   	int3
  42906c:	cc                   	int3
  42906d:	cc                   	int3
  42906e:	cc                   	int3
  42906f:	cc                   	int3
