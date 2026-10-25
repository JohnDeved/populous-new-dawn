
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00410d80 <.text+0xfd80>:
  410d80:	bf 0a 07 96 00       	mov    edi,0x96070a
  410d85:	53                   	push   ebx
  410d86:	e8 d5 50 07 00       	call   0x485e60
  410d8b:	83 c4 04             	add    esp,0x4
  410d8e:	b9 0e 00 00 00       	mov    ecx,0xe
  410d93:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  410d95:	88 1d 3f b7 89 00    	mov    BYTE PTR ds:0x89b73f,bl
  410d9b:	eb 05                	jmp    0x410da2
  410d9d:	e8 be 53 07 00       	call   0x486160
  410da2:	c6 05 f0 c6 89 00 00 	mov    BYTE PTR ds:0x89c6f0,0x0
  410da9:	33 c0                	xor    eax,eax
  410dab:	a0 a3 b7 89 00       	mov    al,ds:0x89b7a3
  410db0:	50                   	push   eax
  410db1:	33 c0                	xor    eax,eax
  410db3:	a0 a2 b7 89 00       	mov    al,ds:0x89b7a2
  410db8:	50                   	push   eax
  410db9:	33 c0                	xor    eax,eax
  410dbb:	a0 a1 b7 89 00       	mov    al,ds:0x89b7a1
  410dc0:	50                   	push   eax
  410dc1:	e8 ca a7 01 00       	call   0x42b590
  410dc6:	83 c4 0c             	add    esp,0xc
  410dc9:	6a 00                	push   0x0
  410dcb:	6a 00                	push   0x0
  410dcd:	e8 5e b9 01 00       	call   0x42c730
  410dd2:	81 0d 39 b7 89 00 00 	or     DWORD PTR ds:0x89b739,0x100
  410dd9:	01 00 00 
  410ddc:	83 c4 08             	add    esp,0x8
  410ddf:	80 3d b0 5d 89 00 00 	cmp    BYTE PTR ds:0x895db0,0x0
  410de6:	74 05                	je     0x410ded
  410de8:	e8 f3 a5 07 00       	call   0x48b3e0
  410ded:	e8 0e a7 07 00       	call   0x48b500
  410df2:	5f                   	pop    edi
  410df3:	5e                   	pop    esi
  410df4:	5b                   	pop    ebx
  410df5:	c3                   	ret
  410df6:	cc                   	int3
  410df7:	cc                   	int3
  410df8:	cc                   	int3
  410df9:	cc                   	int3
  410dfa:	cc                   	int3
  410dfb:	cc                   	int3
  410dfc:	cc                   	int3
  410dfd:	cc                   	int3
  410dfe:	cc                   	int3
  410dff:	cc                   	int3
  410e00:	33 c0                	xor    eax,eax
  410e02:	a3 b0 c9 5f 00       	mov    ds:0x5fc9b0,eax
  410e07:	a3 b4 c9 5f 00       	mov    ds:0x5fc9b4,eax
  410e0c:	a3 e0 c9 5f 00       	mov    ds:0x5fc9e0,eax
  410e11:	a3 e4 c9 5f 00       	mov    ds:0x5fc9e4,eax
  410e16:	c3                   	ret
  410e17:	cc                   	int3
  410e18:	cc                   	int3
  410e19:	cc                   	int3
  410e1a:	cc                   	int3
  410e1b:	cc                   	int3
  410e1c:	cc                   	int3
  410e1d:	cc                   	int3
  410e1e:	cc                   	int3
  410e1f:	cc                   	int3
  410e20:	33 c0                	xor    eax,eax
  410e22:	a0 02 f0 88 00       	mov    al,ds:0x88f002
  410e27:	83 f8 01             	cmp    eax,0x1
  410e2a:	74 44                	je     0x410e70
  410e2c:	83 f8 04             	cmp    eax,0x4
  410e2f:	0f 84 08 01 00 00    	je     0x410f3d
  410e35:	83 f8 05             	cmp    eax,0x5
  410e38:	0f 84 f5 00 00 00    	je     0x410f33
  410e3e:	e8 9d 02 00 00       	call   0x4110e0
  410e43:	80 3d 02 f0 88 00 05 	cmp    BYTE PTR ds:0x88f002,0x5
  410e4a:	0f 84 3a 01 00 00    	je     0x410f8a
  410e50:	80 3d 02 f0 88 00 04 	cmp    BYTE PTR ds:0x88f002,0x4
  410e57:	0f 84 2d 01 00 00    	je     0x410f8a
  410e5d:	80 3d e0 de 59 00 00 	cmp    BYTE PTR ds:0x59dee0,0x0
  410e64:	75 05                	jne    0x410e6b
  410e66:	e8 15 ed 00 00       	call   0x41fb80
  410e6b:	e9 00 77 01 00       	jmp    0x428570
  410e70:	81 25 61 c6 89 00 ff 	and    DWORD PTR ds:0x89c661,0xff7fffff
  410e77:	ff 7f ff 
  410e7a:	6a 00                	push   0x0
  410e7c:	e8 3f 23 11 00       	call   0x5231c0
  410e81:	83 c4 04             	add    esp,0x4
  410e84:	66 81 3d cf c6 89 00 	cmp    WORD PTR ds:0x89c6cf,0x280
  410e8b:	80 02 
  410e8d:	75 1a                	jne    0x410ea9
  410e8f:	66 81 3d d1 c6 89 00 	cmp    WORD PTR ds:0x89c6d1,0x1e0
  410e96:	e0 01 
  410e98:	75 0f                	jne    0x410ea9
  410e9a:	66 83 3d d3 c6 89 00 	cmp    WORD PTR ds:0x89c6d3,0x10
  410ea1:	10 
  410ea2:	b8 00 00 00 00       	mov    eax,0x0
  410ea7:	74 05                	je     0x410eae
  410ea9:	b8 01 00 00 00       	mov    eax,0x1
  410eae:	83 3d 1c d1 59 00 00 	cmp    DWORD PTR ds:0x59d11c,0x0
  410eb5:	75 1c                	jne    0x410ed3
  410eb7:	68 b4 9a 59 00       	push   0x599ab4
  410ebc:	e8 0f 66 04 00       	call   0x4574d0
  410ec1:	83 c4 04             	add    esp,0x4
  410ec4:	e8 27 16 0a 00       	call   0x4b24f0
  410ec9:	b8 01 00 00 00       	mov    eax,0x1
  410ece:	a3 1c d1 59 00       	mov    ds:0x59d11c,eax
  410ed3:	85 c0                	test   eax,eax
  410ed5:	74 21                	je     0x410ef8
  410ed7:	68 80 9a 59 00       	push   0x599a80
  410edc:	e8 ef 65 04 00       	call   0x4574d0
  410ee1:	83 c4 04             	add    esp,0x4
  410ee4:	6a 10                	push   0x10
  410ee6:	68 e0 01 00 00       	push   0x1e0
  410eeb:	68 80 02 00 00       	push   0x280
  410ef0:	e8 8b f6 0e 00       	call   0x500580
  410ef5:	83 c4 0c             	add    esp,0xc
  410ef8:	6a 01                	push   0x1
  410efa:	e8 c1 22 11 00       	call   0x5231c0
  410eff:	83 c4 04             	add    esp,0x4
  410f02:	e8 c9 00 00 00       	call   0x410fd0
  410f07:	6a 01                	push   0x1
  410f09:	e8 42 a5 07 00       	call   0x48b450
  410f0e:	83 c4 04             	add    esp,0x4
  410f11:	6a 03                	push   0x3
  410f13:	e8 c8 1b 03 00       	call   0x442ae0
  410f18:	83 c4 04             	add    esp,0x4
  410f1b:	e8 90 79 01 00       	call   0x4288b0
  410f20:	85 c0                	test   eax,eax
  410f22:	0f 85 16 ff ff ff    	jne    0x410e3e
  410f28:	81 0d 61 c6 89 00 00 	or     DWORD PTR ds:0x89c661,0x800000
  410f2f:	00 80 00 
  410f32:	c3                   	ret
  410f33:	6a 04                	push   0x4
  410f35:	e8 a6 1b 03 00       	call   0x442ae0
  410f3a:	83 c4 04             	add    esp,0x4
  410f3d:	e8 6e 1b 03 00       	call   0x442ab0
  410f42:	e8 79 7b 01 00       	call   0x428ac0
  410f47:	80 3d 00 f0 88 00 07 	cmp    BYTE PTR ds:0x88f000,0x7
  410f4e:	75 4a                	jne    0x410f9a
  410f50:	83 3d 1c d1 59 00 00 	cmp    DWORD PTR ds:0x59d11c,0x0
  410f57:	74 75                	je     0x410fce
  410f59:	e8 e2 15 0a 00       	call   0x4b2540
  410f5e:	c7 05 1c d1 59 00 00 	mov    DWORD PTR ds:0x59d11c,0x0
  410f65:	00 00 00 
  410f68:	68 44 9a 59 00       	push   0x599a44
  410f6d:	e8 5e 65 04 00       	call   0x4574d0
  410f72:	83 c4 04             	add    esp,0x4
  410f75:	6a 08                	push   0x8
  410f77:	68 e0 01 00 00       	push   0x1e0
  410f7c:	68 80 02 00 00       	push   0x280
  410f81:	e8 fa f5 0e 00       	call   0x500580
  410f86:	83 c4 0c             	add    esp,0xc
  410f89:	c3                   	ret
  410f8a:	e8 e1 75 01 00       	call   0x428570
  410f8f:	6a 01                	push   0x1
  410f91:	e8 2a 22 11 00       	call   0x5231c0
  410f96:	83 c4 04             	add    esp,0x4
  410f99:	c3                   	ret
  410f9a:	a0 f0 9c 74 00       	mov    al,ds:0x749cf0
  410f9f:	38 05 90 45 98 00    	cmp    BYTE PTR ds:0x984590,al
  410fa5:	74 27                	je     0x410fce
  410fa7:	33 c9                	xor    ecx,ecx
  410fa9:	8a c8                	mov    cl,al
  410fab:	8d 0c 49             	lea    ecx,[ecx+ecx*2]
  410fae:	c1 e1 02             	shl    ecx,0x2
  410fb1:	8b 81 24 cf 89 00    	mov    eax,DWORD PTR [ecx+0x89cf24]
  410fb7:	8b 91 20 cf 89 00    	mov    edx,DWORD PTR [ecx+0x89cf20]
  410fbd:	50                   	push   eax
  410fbe:	8b 89 1c cf 89 00    	mov    ecx,DWORD PTR [ecx+0x89cf1c]
  410fc4:	52                   	push   edx
  410fc5:	51                   	push   ecx
  410fc6:	e8 b5 f5 0e 00       	call   0x500580
  410fcb:	83 c4 0c             	add    esp,0xc
  410fce:	c3                   	ret
  410fcf:	cc                   	int3
