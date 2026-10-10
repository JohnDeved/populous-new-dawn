
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004a1a30 <.text+0xa0a30>:
  4a1a30:	83 ec 10             	sub    esp,0x10
  4a1a33:	53                   	push   ebx
  4a1a34:	56                   	push   esi
  4a1a35:	8b 74 24 1c          	mov    esi,DWORD PTR [esp+0x1c]
  4a1a39:	57                   	push   edi
  4a1a3a:	55                   	push   ebp
  4a1a3b:	8b 46 37             	mov    eax,DWORD PTR [esi+0x37]
  4a1a3e:	50                   	push   eax
  4a1a3f:	e8 ac 87 fa ff       	call   0x44a1f0
  4a1a44:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  4a1a48:	83 c4 04             	add    esp,0x4
  4a1a4b:	8b 46 3b             	mov    eax,DWORD PTR [esi+0x3b]
  4a1a4e:	50                   	push   eax
  4a1a4f:	e8 bc 87 fa ff       	call   0x44a210
  4a1a54:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  4a1a58:	83 c4 04             	add    esp,0x4
  4a1a5b:	8b 46 47             	mov    eax,DWORD PTR [esi+0x47]
  4a1a5e:	03 46 37             	add    eax,DWORD PTR [esi+0x37]
  4a1a61:	50                   	push   eax
  4a1a62:	e8 89 87 fa ff       	call   0x44a1f0
  4a1a67:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  4a1a6b:	83 c4 04             	add    esp,0x4
  4a1a6e:	8b 46 4b             	mov    eax,DWORD PTR [esi+0x4b]
  4a1a71:	03 46 3b             	add    eax,DWORD PTR [esi+0x3b]
  4a1a74:	50                   	push   eax
  4a1a75:	e8 96 87 fa ff       	call   0x44a210
  4a1a7a:	83 c4 04             	add    esp,0x4
  4a1a7d:	8b f8                	mov    edi,eax
  4a1a7f:	83 7e 10 00          	cmp    DWORD PTR [esi+0x10],0x0
  4a1a83:	0f 84 48 01 00 00    	je     0x4a1bd1
  4a1a89:	83 7e 08 00          	cmp    DWORD PTR [esi+0x8],0x0
  4a1a8d:	74 09                	je     0x4a1a98
  4a1a8f:	83 25 74 a0 5d 00 f7 	and    DWORD PTR ds:0x5da074,0xfffffff7
  4a1a96:	eb 07                	jmp    0x4a1a9f
  4a1a98:	83 0d 74 a0 5d 00 08 	or     DWORD PTR ds:0x5da074,0x8
  4a1a9f:	68 20 ac 5c 00       	push   0x5cac20
  4a1aa4:	68 08 ac 5c 00       	push   0x5cac08
  4a1aa9:	68 f0 ab 5c 00       	push   0x5cabf0
  4a1aae:	56                   	push   esi
  4a1aaf:	e8 dc 03 00 00       	call   0x4a1e90
  4a1ab4:	83 c4 10             	add    esp,0x10
  4a1ab7:	8b 46 4f             	mov    eax,DWORD PTR [esi+0x4f]
  4a1aba:	85 c0                	test   eax,eax
  4a1abc:	0f 84 0f 01 00 00    	je     0x4a1bd1
  4a1ac2:	83 7e 18 00          	cmp    DWORD PTR [esi+0x18],0x0
  4a1ac6:	75 0b                	jne    0x4a1ad3
  4a1ac8:	83 7e 1c 00          	cmp    DWORD PTR [esi+0x1c],0x0
  4a1acc:	b9 00 00 00 00       	mov    ecx,0x0
  4a1ad1:	74 05                	je     0x4a1ad8
  4a1ad3:	b9 01 00 00 00       	mov    ecx,0x1
  4a1ad8:	80 7e 2a 01          	cmp    BYTE PTR [esi+0x2a],0x1
  4a1adc:	1b db                	sbb    ebx,ebx
  4a1ade:	33 ed                	xor    ebp,ebp
  4a1ae0:	8d 5c 58 02          	lea    ebx,[eax+ebx*2+0x2]
  4a1ae4:	03 d9                	add    ebx,ecx
  4a1ae6:	33 c9                	xor    ecx,ecx
  4a1ae8:	c1 e3 03             	shl    ebx,0x3
  4a1aeb:	03 1d 14 df 59 00    	add    ebx,DWORD PTR ds:0x59df14
  4a1af1:	66 8b 4b 06          	mov    cx,WORD PTR [ebx+0x6]
  4a1af5:	66 81 3d cf c6 89 00 	cmp    WORD PTR ds:0x89c6cf,0x280
  4a1afc:	80 02 
  4a1afe:	66 8b 6b 04          	mov    bp,WORD PTR [ebx+0x4]
  4a1b02:	74 3c                	je     0x4a1b40
  4a1b04:	66 a1 cf c6 89 00    	mov    ax,ds:0x89c6cf
  4a1b0a:	66 39 05 44 a9 5c 00 	cmp    WORD PTR ds:0x5ca944,ax
  4a1b11:	74 19                	je     0x4a1b2c
  4a1b13:	66 a3 44 a9 5c 00    	mov    ds:0x5ca944,ax
  4a1b19:	be 80 02 00 00       	mov    esi,0x280
  4a1b1e:	0f bf c0             	movsx  eax,ax
  4a1b21:	c1 e0 10             	shl    eax,0x10
  4a1b24:	99                   	cdq
  4a1b25:	f7 fe                	idiv   esi
  4a1b27:	a3 48 a9 5c 00       	mov    ds:0x5ca948,eax
  4a1b2c:	0f af 0d 48 a9 5c 00 	imul   ecx,DWORD PTR ds:0x5ca948
  4a1b33:	0f af 2d 48 a9 5c 00 	imul   ebp,DWORD PTR ds:0x5ca948
  4a1b3a:	c1 f9 10             	sar    ecx,0x10
  4a1b3d:	c1 fd 10             	sar    ebp,0x10
  4a1b40:	66 8b 73 04          	mov    si,WORD PTR [ebx+0x4]
  4a1b44:	0f b7 c6             	movzx  eax,si
  4a1b47:	3b c5                	cmp    eax,ebp
  4a1b49:	74 4b                	je     0x4a1b96
  4a1b4b:	33 c0                	xor    eax,eax
  4a1b4d:	66 8b 43 06          	mov    ax,WORD PTR [ebx+0x6]
  4a1b51:	3b c1                	cmp    eax,ecx
  4a1b53:	74 41                	je     0x4a1b96
  4a1b55:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  4a1b59:	51                   	push   ecx
  4a1b5a:	55                   	push   ebp
  4a1b5b:	03 c7                	add    eax,edi
  4a1b5d:	99                   	cdq
  4a1b5e:	53                   	push   ebx
  4a1b5f:	2b c2                	sub    eax,edx
  4a1b61:	c1 f8 01             	sar    eax,0x1
  4a1b64:	8b f0                	mov    esi,eax
  4a1b66:	8b c1                	mov    eax,ecx
  4a1b68:	99                   	cdq
  4a1b69:	2b c2                	sub    eax,edx
  4a1b6b:	c1 f8 01             	sar    eax,0x1
  4a1b6e:	2b f0                	sub    esi,eax
  4a1b70:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  4a1b74:	03 44 24 24          	add    eax,DWORD PTR [esp+0x24]
  4a1b78:	56                   	push   esi
  4a1b79:	99                   	cdq
  4a1b7a:	2b c2                	sub    eax,edx
  4a1b7c:	c1 f8 01             	sar    eax,0x1
  4a1b7f:	8b c8                	mov    ecx,eax
  4a1b81:	8b c5                	mov    eax,ebp
  4a1b83:	99                   	cdq
  4a1b84:	2b c2                	sub    eax,edx
  4a1b86:	c1 f8 01             	sar    eax,0x1
  4a1b89:	2b c8                	sub    ecx,eax
  4a1b8b:	51                   	push   ecx
  4a1b8c:	e8 9f 48 07 00       	call   0x516430
  4a1b91:	83 c4 14             	add    esp,0x14
  4a1b94:	eb 3b                	jmp    0x4a1bd1
  4a1b96:	66 8b 4b 06          	mov    cx,WORD PTR [ebx+0x6]
  4a1b9a:	53                   	push   ebx
  4a1b9b:	66 c1 e9 01          	shr    cx,0x1
  4a1b9f:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4a1ba3:	03 c7                	add    eax,edi
  4a1ba5:	99                   	cdq
  4a1ba6:	2b c2                	sub    eax,edx
  4a1ba8:	0f b7 d1             	movzx  edx,cx
  4a1bab:	c1 f8 01             	sar    eax,0x1
  4a1bae:	2b c2                	sub    eax,edx
  4a1bb0:	66 c1 ee 01          	shr    si,0x1
  4a1bb4:	50                   	push   eax
  4a1bb5:	0f b7 ce             	movzx  ecx,si
  4a1bb8:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4a1bbc:	03 44 24 20          	add    eax,DWORD PTR [esp+0x20]
  4a1bc0:	99                   	cdq
  4a1bc1:	2b c2                	sub    eax,edx
  4a1bc3:	c1 f8 01             	sar    eax,0x1
  4a1bc6:	2b c1                	sub    eax,ecx
  4a1bc8:	50                   	push   eax
  4a1bc9:	e8 12 47 07 00       	call   0x5162e0
  4a1bce:	83 c4 0c             	add    esp,0xc
  4a1bd1:	83 25 74 a0 5d 00 f7 	and    DWORD PTR ds:0x5da074,0xfffffff7
  4a1bd8:	5d                   	pop    ebp
  4a1bd9:	5f                   	pop    edi
  4a1bda:	5e                   	pop    esi
  4a1bdb:	5b                   	pop    ebx
  4a1bdc:	83 c4 10             	add    esp,0x10
  4a1bdf:	c3                   	ret
  4a1be0:	83 ec 10             	sub    esp,0x10
  4a1be3:	33 c0                	xor    eax,eax
  4a1be5:	56                   	push   esi
  4a1be6:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  4a1bea:	39 46 10             	cmp    DWORD PTR [esi+0x10],eax
  4a1bed:	74 67                	je     0x4a1c56
  4a1bef:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  4a1bf3:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  4a1bf7:	89 44 24 08          	mov    DWORD PTR [esp+0x8],eax
  4a1bfb:	89 44 24 04          	mov    DWORD PTR [esp+0x4],eax
  4a1bff:	8b 46 37             	mov    eax,DWORD PTR [esi+0x37]
  4a1c02:	50                   	push   eax
  4a1c03:	e8 e8 85 fa ff       	call   0x44a1f0
  4a1c08:	89 44 24 08          	mov    DWORD PTR [esp+0x8],eax
  4a1c0c:	83 c4 04             	add    esp,0x4
  4a1c0f:	8b 46 3b             	mov    eax,DWORD PTR [esi+0x3b]
  4a1c12:	50                   	push   eax
  4a1c13:	e8 f8 85 fa ff       	call   0x44a210
  4a1c18:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  4a1c1c:	83 c4 04             	add    esp,0x4
  4a1c1f:	8b 46 47             	mov    eax,DWORD PTR [esi+0x47]
  4a1c22:	03 46 37             	add    eax,DWORD PTR [esi+0x37]
  4a1c25:	50                   	push   eax
  4a1c26:	e8 c5 85 fa ff       	call   0x44a1f0
  4a1c2b:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  4a1c2f:	83 c4 04             	add    esp,0x4
  4a1c32:	8b 46 4b             	mov    eax,DWORD PTR [esi+0x4b]
  4a1c35:	03 46 3b             	add    eax,DWORD PTR [esi+0x3b]
  4a1c38:	50                   	push   eax
  4a1c39:	e8 d2 85 fa ff       	call   0x44a210
  4a1c3e:	8d 54 24 08          	lea    edx,[esp+0x8]
  4a1c42:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  4a1c46:	83 c4 04             	add    esp,0x4
  4a1c49:	8b 4e 5f             	mov    ecx,DWORD PTR [esi+0x5f]
  4a1c4c:	51                   	push   ecx
  4a1c4d:	52                   	push   edx
  4a1c4e:	e8 fd 02 00 00       	call   0x4a1f50
  4a1c53:	83 c4 08             	add    esp,0x8
  4a1c56:	5e                   	pop    esi
  4a1c57:	83 c4 10             	add    esp,0x10
  4a1c5a:	c3                   	ret
  4a1c5b:	cc                   	int3
  4a1c5c:	cc                   	int3
  4a1c5d:	cc                   	int3
  4a1c5e:	cc                   	int3
  4a1c5f:	cc                   	int3
  4a1c60:	83 ec 1c             	sub    esp,0x1c
  4a1c63:	53                   	push   ebx
  4a1c64:	56                   	push   esi
  4a1c65:	8b 74 24 28          	mov    esi,DWORD PTR [esp+0x28]
  4a1c69:	57                   	push   edi
  4a1c6a:	55                   	push   ebp
  4a1c6b:	83 7e 10 00          	cmp    DWORD PTR [esi+0x10],0x0
  4a1c6f:	0f 84 4b 01 00 00    	je     0x4a1dc0
  4a1c75:	8b 46 37             	mov    eax,DWORD PTR [esi+0x37]
  4a1c78:	50                   	push   eax
  4a1c79:	e8 72 85 fa ff       	call   0x44a1f0
  4a1c7e:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  4a1c82:	83 c4 04             	add    esp,0x4
  4a1c85:	8b 46 3b             	mov    eax,DWORD PTR [esi+0x3b]
  4a1c88:	50                   	push   eax
  4a1c89:	e8 82 85 fa ff       	call   0x44a210
  4a1c8e:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  4a1c92:	83 c4 04             	add    esp,0x4
  4a1c95:	8b 46 47             	mov    eax,DWORD PTR [esi+0x47]
  4a1c98:	03 46 37             	add    eax,DWORD PTR [esi+0x37]
  4a1c9b:	50                   	push   eax
  4a1c9c:	e8 4f 85 fa ff       	call   0x44a1f0
  4a1ca1:	83 c4 04             	add    esp,0x4
  4a1ca4:	8b f8                	mov    edi,eax
  4a1ca6:	8b 46 4b             	mov    eax,DWORD PTR [esi+0x4b]
  4a1ca9:	03 46 3b             	add    eax,DWORD PTR [esi+0x3b]
  4a1cac:	50                   	push   eax
  4a1cad:	e8 5e 85 fa ff       	call   0x44a210
  4a1cb2:	66 8b 5e 63          	mov    bx,WORD PTR [esi+0x63]
  4a1cb6:	2b 7c 24 14          	sub    edi,DWORD PTR [esp+0x14]
  4a1cba:	0f b7 cb             	movzx  ecx,bx
  4a1cbd:	c1 e1 03             	shl    ecx,0x3
  4a1cc0:	2b 44 24 18          	sub    eax,DWORD PTR [esp+0x18]
  4a1cc4:	33 d2                	xor    edx,edx
  4a1cc6:	33 f6                	xor    esi,esi
  4a1cc8:	83 c4 04             	add    esp,0x4
  4a1ccb:	03 0d 14 df 59 00    	add    ecx,DWORD PTR ds:0x59df14
  4a1cd1:	66 8b 51 04          	mov    dx,WORD PTR [ecx+0x4]
  4a1cd5:	66 8b 71 06          	mov    si,WORD PTR [ecx+0x6]
  4a1cd9:	66 85 db             	test   bx,bx
  4a1cdc:	0f 84 de 00 00 00    	je     0x4a1dc0
  4a1ce2:	8b 2d bc e0 5c 00    	mov    ebp,DWORD PTR ds:0x5ce0bc
  4a1ce8:	89 6c 24 20          	mov    DWORD PTR [esp+0x20],ebp
  4a1cec:	8d 8d 3a 80 24 00    	lea    ecx,[ebp+0x24803a]
  4a1cf2:	8b 6c 24 10          	mov    ebp,DWORD PTR [esp+0x10]
  4a1cf6:	89 6c 24 24          	mov    DWORD PTR [esp+0x24],ebp
  4a1cfa:	8b 6c 24 14          	mov    ebp,DWORD PTR [esp+0x14]
  4a1cfe:	c7 44 24 28 00 00 00 	mov    DWORD PTR [esp+0x28],0x0
  4a1d05:	00 
  4a1d06:	df 6c 24 24          	fild   QWORD PTR [esp+0x24]
  4a1d0a:	89 6c 24 10          	mov    DWORD PTR [esp+0x10],ebp
  4a1d0e:	8b 6c 24 20          	mov    ebp,DWORD PTR [esp+0x20]
  4a1d12:	c7 44 24 14 00 00 00 	mov    DWORD PTR [esp+0x14],0x0
  4a1d19:	00 
  4a1d1a:	d9 19                	fstp   DWORD PTR [ecx]
  4a1d1c:	df 6c 24 10          	fild   QWORD PTR [esp+0x10]
  4a1d20:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  4a1d24:	d9 95 3e 80 24 00    	fst    DWORD PTR [ebp+0x24803e]
  4a1d2a:	8b 09                	mov    ecx,DWORD PTR [ecx]
  4a1d2c:	6a 0c                	push   0xc
  4a1d2e:	d9 1d 60 8f a6 00    	fstp   DWORD PTR ds:0xa68f60
  4a1d34:	db 44 24 14          	fild   DWORD PTR [esp+0x14]
  4a1d38:	a1 74 a0 5d 00       	mov    eax,ds:0x5da074
  4a1d3d:	89 0d 64 8f a6 00    	mov    DWORD PTR ds:0xa68f64,ecx
  4a1d43:	89 7c 24 14          	mov    DWORD PTR [esp+0x14],edi
  4a1d47:	50                   	push   eax
  4a1d48:	db 44 24 18          	fild   DWORD PTR [esp+0x18]
  4a1d4c:	d9 c1                	fld    st(1)
  4a1d4e:	89 74 24 18          	mov    DWORD PTR [esp+0x18],esi
  4a1d52:	53                   	push   ebx
  4a1d53:	da 74 24 1c          	fidiv  DWORD PTR [esp+0x1c]
  4a1d57:	89 54 24 1c          	mov    DWORD PTR [esp+0x1c],edx
  4a1d5b:	68 e8 10 99 00       	push   0x9910e8
  4a1d60:	83 ec 04             	sub    esp,0x4
  4a1d63:	83 ec 04             	sub    esp,0x4
  4a1d66:	83 ec 04             	sub    esp,0x4
  4a1d69:	83 ec 04             	sub    esp,0x4
  4a1d6c:	d9 5c 24 0c          	fstp   DWORD PTR [esp+0xc]
  4a1d70:	d9 c0                	fld    st(0)
  4a1d72:	da 74 24 30          	fidiv  DWORD PTR [esp+0x30]
  4a1d76:	6a 00                	push   0x0
  4a1d78:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  4a1d7e:	6a 00                	push   0x0
  4a1d80:	d9 5c 24 10          	fstp   DWORD PTR [esp+0x10]
  4a1d84:	d9 c9                	fxch   st(1)
  4a1d86:	d9 5c 24 0c          	fstp   DWORD PTR [esp+0xc]
  4a1d8a:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  4a1d8e:	e8 3d c2 fd ff       	call   0x47dfd0
  4a1d93:	8b 15 bc e0 5c 00    	mov    edx,DWORD PTR ds:0x5ce0bc
  4a1d99:	8d 8a 3a 80 24 00    	lea    ecx,[edx+0x24803a]
  4a1d9f:	c7 01 00 00 00 00    	mov    DWORD PTR [ecx],0x0
  4a1da5:	c7 82 3e 80 24 00 00 	mov    DWORD PTR [edx+0x24803e],0x0
  4a1dac:	00 00 00 
  4a1daf:	8b 01                	mov    eax,DWORD PTR [ecx]
  4a1db1:	c7 05 60 8f a6 00 00 	mov    DWORD PTR ds:0xa68f60,0x0
  4a1db8:	00 00 00 
  4a1dbb:	a3 64 8f a6 00       	mov    ds:0xa68f64,eax
  4a1dc0:	5d                   	pop    ebp
  4a1dc1:	5f                   	pop    edi
  4a1dc2:	5e                   	pop    esi
  4a1dc3:	5b                   	pop    ebx
  4a1dc4:	83 c4 1c             	add    esp,0x1c
  4a1dc7:	c3                   	ret
  4a1dc8:	cc                   	int3
  4a1dc9:	cc                   	int3
  4a1dca:	cc                   	int3
  4a1dcb:	cc                   	int3
  4a1dcc:	cc                   	int3
  4a1dcd:	cc                   	int3
  4a1dce:	cc                   	int3
  4a1dcf:	cc                   	int3
