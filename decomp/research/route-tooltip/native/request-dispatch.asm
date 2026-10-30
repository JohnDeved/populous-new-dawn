
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00499d90 <.text+0x98d90>:
  499d90:	83 ec 08             	sub    esp,0x8
  499d93:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  499d9a:	56                   	push   esi
  499d9b:	0f 85 8e 01 00 00    	jne    0x499f2f
  499da1:	f6 05 46 f7 98 00 10 	test   BYTE PTR ds:0x98f746,0x10
  499da8:	0f 85 81 01 00 00    	jne    0x499f2f
  499dae:	f6 05 7c d1 89 00 02 	test   BYTE PTR ds:0x89d17c,0x2
  499db5:	0f 85 74 01 00 00    	jne    0x499f2f
  499dbb:	f6 05 64 c6 89 00 06 	test   BYTE PTR ds:0x89c664,0x6
  499dc2:	0f 85 67 01 00 00    	jne    0x499f2f
  499dc8:	8b 74 24 10          	mov    esi,DWORD PTR [esp+0x10]
  499dcc:	85 35 39 b7 89 00    	test   DWORD PTR ds:0x89b739,esi
  499dd2:	0f 85 57 01 00 00    	jne    0x499f2f
  499dd8:	8d 44 24 0a          	lea    eax,[esp+0xa]
  499ddc:	8d 4c 24 08          	lea    ecx,[esp+0x8]
  499de0:	8d 54 24 07          	lea    edx,[esp+0x7]
  499de4:	50                   	push   eax
  499de5:	8d 44 24 0d          	lea    eax,[esp+0xd]
  499de9:	51                   	push   ecx
  499dea:	52                   	push   edx
  499deb:	50                   	push   eax
  499dec:	56                   	push   esi
  499ded:	e8 4e 01 00 00       	call   0x499f40
  499df2:	83 c4 14             	add    esp,0x14
  499df5:	f6 05 6d c6 89 00 08 	test   BYTE PTR ds:0x89c66d,0x8
  499dfc:	74 06                	je     0x499e04
  499dfe:	b1 00                	mov    cl,0x0
  499e00:	84 c0                	test   al,al
  499e02:	74 02                	je     0x499e06
  499e04:	b1 01                	mov    cl,0x1
  499e06:	84 c9                	test   cl,cl
  499e08:	0f 84 21 01 00 00    	je     0x499f2f
  499e0e:	80 7c 24 07 00       	cmp    BYTE PTR [esp+0x7],0x0
  499e13:	74 06                	je     0x499e1b
  499e15:	09 35 39 b7 89 00    	or     DWORD PTR ds:0x89b739,esi
  499e1b:	33 c9                	xor    ecx,ecx
  499e1d:	8a c8                	mov    cl,al
  499e1f:	85 c9                	test   ecx,ecx
  499e21:	74 0e                	je     0x499e31
  499e23:	83 f9 01             	cmp    ecx,0x1
  499e26:	0f 84 ea 00 00 00    	je     0x499f16
  499e2c:	5e                   	pop    esi
  499e2d:	83 c4 08             	add    esp,0x8
  499e30:	c3                   	ret
  499e31:	6a 03                	push   0x3
  499e33:	e8 98 6d f9 ff       	call   0x430bd0
  499e38:	83 c4 04             	add    esp,0x4
  499e3b:	80 3d e7 41 68 00 ff 	cmp    BYTE PTR ds:0x6841e7,0xff
  499e42:	74 14                	je     0x499e58
  499e44:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  499e48:	8a 0d e7 41 68 00    	mov    cl,BYTE PTR ds:0x6841e7
  499e4e:	50                   	push   eax
  499e4f:	51                   	push   ecx
  499e50:	e8 eb 6f f9 ff       	call   0x430e40
  499e55:	83 c4 08             	add    esp,0x8
  499e58:	80 7c 24 08 00       	cmp    BYTE PTR [esp+0x8],0x0
  499e5d:	74 39                	je     0x499e98
  499e5f:	80 3d e7 41 68 00 ff 	cmp    BYTE PTR ds:0x6841e7,0xff
  499e66:	74 60                	je     0x499ec8
  499e68:	6a 30                	push   0x30
  499e6a:	a0 e7 41 68 00       	mov    al,ds:0x6841e7
  499e6f:	50                   	push   eax
  499e70:	e8 bb 70 f9 ff       	call   0x430f30
  499e75:	83 c4 08             	add    esp,0x8
  499e78:	80 3d e7 41 68 00 ff 	cmp    BYTE PTR ds:0x6841e7,0xff
  499e7f:	74 65                	je     0x499ee6
  499e81:	0f be 05 e7 41 68 00 	movsx  eax,BYTE PTR ds:0x6841e7
  499e88:	8d 0c 80             	lea    ecx,[eax+eax*4]
  499e8b:	81 8c c9 b3 3b 68 00 	or     DWORD PTR [ecx+ecx*8+0x683bb3],0x200
  499e92:	00 02 00 00 
  499e96:	eb 30                	jmp    0x499ec8
  499e98:	0f be 05 e7 41 68 00 	movsx  eax,BYTE PTR ds:0x6841e7
  499e9f:	8d 0c 80             	lea    ecx,[eax+eax*4]
  499ea2:	83 a4 c9 b3 3b 68 00 	and    DWORD PTR [ecx+ecx*8+0x683bb3],0xfffffffe
  499ea9:	fe 
  499eaa:	80 3d e7 41 68 00 ff 	cmp    BYTE PTR ds:0x6841e7,0xff
  499eb1:	74 33                	je     0x499ee6
  499eb3:	0f be 05 e7 41 68 00 	movsx  eax,BYTE PTR ds:0x6841e7
  499eba:	8d 0c 80             	lea    ecx,[eax+eax*4]
  499ebd:	81 a4 c9 b3 3b 68 00 	and    DWORD PTR [ecx+ecx*8+0x683bb3],0xfffffdff
  499ec4:	ff fd ff ff 
  499ec8:	80 3d e7 41 68 00 ff 	cmp    BYTE PTR ds:0x6841e7,0xff
  499ecf:	74 15                	je     0x499ee6
  499ed1:	0f be 05 e7 41 68 00 	movsx  eax,BYTE PTR ds:0x6841e7
  499ed8:	8d 0c 80             	lea    ecx,[eax+eax*4]
  499edb:	81 8c c9 b3 3b 68 00 	or     DWORD PTR [ecx+ecx*8+0x683bb3],0x20000
  499ee2:	00 00 02 00 
  499ee6:	66 83 7c 24 0a 00    	cmp    WORD PTR [esp+0xa],0x0
  499eec:	7e 41                	jle    0x499f2f
  499eee:	80 3d e7 41 68 00 ff 	cmp    BYTE PTR ds:0x6841e7,0xff
  499ef5:	74 38                	je     0x499f2f
  499ef7:	0f be 05 e7 41 68 00 	movsx  eax,BYTE PTR ds:0x6841e7
  499efe:	66 8b 4c 24 0a       	mov    cx,WORD PTR [esp+0xa]
  499f03:	8d 14 80             	lea    edx,[eax+eax*4]
  499f06:	66 f7 d9             	neg    cx
  499f09:	66 89 8c d2 ae 3b 68 	mov    WORD PTR [edx+edx*8+0x683bae],cx
  499f10:	00 
  499f11:	5e                   	pop    esi
  499f12:	83 c4 08             	add    esp,0x8
  499f15:	c3                   	ret
  499f16:	a1 50 a8 5c 00       	mov    eax,ds:0x5ca850
  499f1b:	8b 4c 24 09          	mov    ecx,DWORD PTR [esp+0x9]
  499f1f:	66 6b c0 03          	imul   ax,ax,0x3
  499f23:	50                   	push   eax
  499f24:	6a 00                	push   0x0
  499f26:	51                   	push   ecx
  499f27:	e8 c4 38 fb ff       	call   0x44d7f0
  499f2c:	83 c4 0c             	add    esp,0xc
  499f2f:	5e                   	pop    esi
  499f30:	83 c4 08             	add    esp,0x8
  499f33:	c3                   	ret
  499f34:	cc                   	int3
  499f35:	cc                   	int3
  499f36:	cc                   	int3
  499f37:	cc                   	int3
  499f38:	cc                   	int3
  499f39:	cc                   	int3
  499f3a:	cc                   	int3
  499f3b:	cc                   	int3
  499f3c:	cc                   	int3
  499f3d:	cc                   	int3
  499f3e:	cc                   	int3
  499f3f:	cc                   	int3
  499f40:	53                   	push   ebx
  499f41:	33 c0                	xor    eax,eax
  499f43:	56                   	push   esi
  499f44:	32 c9                	xor    cl,cl
  499f46:	66 33 f6             	xor    si,si
  499f49:	57                   	push   edi
  499f4a:	bb 01 00 00 00       	mov    ebx,0x1
  499f4f:	8b 7c 24 10          	mov    edi,DWORD PTR [esp+0x10]
  499f53:	8a d3                	mov    dl,bl
  499f55:	81 ff 00 00 01 00    	cmp    edi,0x10000
  499f5b:	7f 0f                	jg     0x499f6c
  499f5d:	74 5b                	je     0x499fba
  499f5f:	81 ff 00 80 00 00    	cmp    edi,0x8000
  499f65:	74 53                	je     0x499fba
  499f67:	e9 d4 00 00 00       	jmp    0x49a040
  499f6c:	81 ff 00 00 04 00    	cmp    edi,0x40000
  499f72:	7f 0f                	jg     0x499f83
  499f74:	74 44                	je     0x499fba
  499f76:	81 ff 00 00 02 00    	cmp    edi,0x20000
  499f7c:	74 3c                	je     0x499fba
  499f7e:	e9 bd 00 00 00       	jmp    0x49a040
  499f83:	81 ff 00 00 10 00    	cmp    edi,0x100000
  499f89:	7f 0f                	jg     0x499f9a
  499f8b:	74 2d                	je     0x499fba
  499f8d:	81 ff 00 00 08 00    	cmp    edi,0x80000
  499f93:	74 25                	je     0x499fba
  499f95:	e9 a6 00 00 00       	jmp    0x49a040
  499f9a:	81 ff 00 00 20 00    	cmp    edi,0x200000
  499fa0:	74 18                	je     0x499fba
  499fa2:	81 ff 00 00 00 04    	cmp    edi,0x4000000
  499fa8:	0f 84 8c 00 00 00    	je     0x49a03a
  499fae:	81 ff 00 00 00 08    	cmp    edi,0x8000000
  499fb4:	0f 85 86 00 00 00    	jne    0x49a040
  499fba:	b0 01                	mov    al,0x1
  499fbc:	81 ff 00 00 01 00    	cmp    edi,0x10000
  499fc2:	7f 0c                	jg     0x499fd0
  499fc4:	74 4a                	je     0x49a010
  499fc6:	81 ff 00 80 00 00    	cmp    edi,0x8000
  499fcc:	74 3c                	je     0x49a00a
  499fce:	eb 70                	jmp    0x49a040
  499fd0:	81 ff 00 00 04 00    	cmp    edi,0x40000
  499fd6:	7f 0c                	jg     0x499fe4
  499fd8:	74 42                	je     0x49a01c
  499fda:	81 ff 00 00 02 00    	cmp    edi,0x20000
  499fe0:	74 34                	je     0x49a016
  499fe2:	eb 5c                	jmp    0x49a040
  499fe4:	81 ff 00 00 10 00    	cmp    edi,0x100000
  499fea:	7f 0c                	jg     0x499ff8
  499fec:	74 3a                	je     0x49a028
  499fee:	81 ff 00 00 08 00    	cmp    edi,0x80000
  499ff4:	74 2c                	je     0x49a022
  499ff6:	eb 48                	jmp    0x49a040
  499ff8:	81 ff 00 00 20 00    	cmp    edi,0x200000
  499ffe:	74 2e                	je     0x49a02e
  49a000:	81 ff 00 00 00 08    	cmp    edi,0x8000000
  49a006:	74 2c                	je     0x49a034
  49a008:	eb 36                	jmp    0x49a040
  49a00a:	b1 04                	mov    cl,0x4
  49a00c:	32 db                	xor    bl,bl
  49a00e:	eb 30                	jmp    0x49a040
  49a010:	b1 03                	mov    cl,0x3
  49a012:	32 db                	xor    bl,bl
  49a014:	eb 2a                	jmp    0x49a040
  49a016:	b1 05                	mov    cl,0x5
  49a018:	32 db                	xor    bl,bl
  49a01a:	eb 24                	jmp    0x49a040
  49a01c:	b1 06                	mov    cl,0x6
  49a01e:	32 db                	xor    bl,bl
  49a020:	eb 1e                	jmp    0x49a040
  49a022:	b1 08                	mov    cl,0x8
  49a024:	32 db                	xor    bl,bl
  49a026:	eb 18                	jmp    0x49a040
  49a028:	b1 07                	mov    cl,0x7
  49a02a:	32 db                	xor    bl,bl
  49a02c:	eb 12                	jmp    0x49a040
  49a02e:	b1 09                	mov    cl,0x9
  49a030:	32 db                	xor    bl,bl
  49a032:	eb 0c                	jmp    0x49a040
  49a034:	b1 0a                	mov    cl,0xa
  49a036:	32 db                	xor    bl,bl
  49a038:	eb 06                	jmp    0x49a040
  49a03a:	66 be ff 00          	mov    si,0xff
  49a03e:	32 d2                	xor    dl,dl
  49a040:	8b 7c 24 14          	mov    edi,DWORD PTR [esp+0x14]
  49a044:	88 0f                	mov    BYTE PTR [edi],cl
  49a046:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  49a04a:	88 19                	mov    BYTE PTR [ecx],bl
  49a04c:	8b 5c 24 1c          	mov    ebx,DWORD PTR [esp+0x1c]
  49a050:	88 13                	mov    BYTE PTR [ebx],dl
  49a052:	8b 54 24 20          	mov    edx,DWORD PTR [esp+0x20]
  49a056:	66 89 32             	mov    WORD PTR [edx],si
  49a059:	5f                   	pop    edi
  49a05a:	5e                   	pop    esi
  49a05b:	5b                   	pop    ebx
  49a05c:	c3                   	ret
  49a05d:	cc                   	int3
  49a05e:	cc                   	int3
  49a05f:	cc                   	int3
