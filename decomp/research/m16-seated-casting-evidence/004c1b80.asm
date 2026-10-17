
../populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004c1b80 <.text+0xc0b80>:
  4c1b80:	53                   	push   ebx
  4c1b81:	56                   	push   esi
  4c1b82:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  4c1b86:	57                   	push   edi
  4c1b87:	0f be 46 2f          	movsx  eax,BYTE PTR [esi+0x2f]
  4c1b8b:	55                   	push   ebp
  4c1b8c:	8b c8                	mov    ecx,eax
  4c1b8e:	8d 14 80             	lea    edx,[eax+eax*4]
  4c1b91:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  4c1b95:	8d 04 51             	lea    eax,[ecx+edx*2]
  4c1b98:	8d 1c c0             	lea    ebx,[eax+eax*8]
  4c1b9b:	8d 14 d9             	lea    edx,[ecx+ebx*8]
  4c1b9e:	8a 5e 2b             	mov    bl,BYTE PTR [esi+0x2b]
  4c1ba1:	8d ac 91 c8 d1 89 00 	lea    ebp,[ecx+edx*4+0x89d1c8]
  4c1ba8:	75 15                	jne    0x4c1bbf
  4c1baa:	56                   	push   esi
  4c1bab:	e8 40 bb 02 00       	call   0x4ed6f0
  4c1bb0:	83 c4 04             	add    esp,0x4
  4c1bb3:	88 5e 2c             	mov    BYTE PTR [esi+0x2c],bl
  4c1bb6:	56                   	push   esi
  4c1bb7:	e8 84 ba 02 00       	call   0x4ed640
  4c1bbc:	83 c4 04             	add    esp,0x4
  4c1bbf:	66 8b 56 41          	mov    dx,WORD PTR [esi+0x41]
  4c1bc3:	8d 5e 3d             	lea    ebx,[esi+0x3d]
  4c1bc6:	8d 4e 6c             	lea    ecx,[esi+0x6c]
  4c1bc9:	8b 03                	mov    eax,DWORD PTR [ebx]
  4c1bcb:	89 01                	mov    DWORD PTR [ecx],eax
  4c1bcd:	66 89 51 04          	mov    WORD PTR [ecx+0x4],dx
  4c1bd1:	8b bd 9d 08 00 00    	mov    edi,DWORD PTR [ebp+0x89d]
  4c1bd7:	85 ff                	test   edi,edi
  4c1bd9:	0f 84 e0 00 00 00    	je     0x4c1cbf
  4c1bdf:	a0 f0 c6 89 00       	mov    al,ds:0x89c6f0
  4c1be4:	6a 00                	push   0x0
  4c1be6:	38 46 2f             	cmp    BYTE PTR [esi+0x2f],al
  4c1be9:	66 0f b6 46 2b       	movzx  ax,BYTE PTR [esi+0x2b]
  4c1bee:	75 06                	jne    0x4c1bf6
  4c1bf0:	66 05 74 00          	add    ax,0x74
  4c1bf4:	eb 04                	jmp    0x4c1bfa
  4c1bf6:	66 05 8a 00          	add    ax,0x8a
  4c1bfa:	50                   	push   eax
  4c1bfb:	57                   	push   edi
  4c1bfc:	e8 4f 84 fc ff       	call   0x48a050
  4c1c01:	83 c4 0c             	add    esp,0xc
  4c1c04:	f6 47 0e 10          	test   BYTE PTR [edi+0xe],0x10
  4c1c08:	75 1c                	jne    0x4c1c26
  4c1c0a:	8a 47 2c             	mov    al,BYTE PTR [edi+0x2c]
  4c1c0d:	57                   	push   edi
  4c1c0e:	88 47 7d             	mov    BYTE PTR [edi+0x7d],al
  4c1c11:	e8 da ba 02 00       	call   0x4ed6f0
  4c1c16:	83 c4 04             	add    esp,0x4
  4c1c19:	c6 47 2c 16          	mov    BYTE PTR [edi+0x2c],0x16
  4c1c1d:	57                   	push   edi
  4c1c1e:	e8 1d ba 02 00       	call   0x4ed640
  4c1c23:	83 c4 04             	add    esp,0x4
  4c1c26:	66 8b 03             	mov    ax,WORD PTR [ebx]
  4c1c29:	66 2b 47 3d          	sub    ax,WORD PTR [edi+0x3d]
  4c1c2d:	0f b7 d8             	movzx  ebx,ax
  4c1c30:	66 8b 46 3f          	mov    ax,WORD PTR [esi+0x3f]
  4c1c34:	8b cb                	mov    ecx,ebx
  4c1c36:	66 2b 47 3f          	sub    ax,WORD PTR [edi+0x3f]
  4c1c3a:	85 db                	test   ebx,ebx
  4c1c3c:	0f b7 c0             	movzx  eax,ax
  4c1c3f:	7d 04                	jge    0x4c1c45
  4c1c41:	8b cb                	mov    ecx,ebx
  4c1c43:	f7 d9                	neg    ecx
  4c1c45:	8b d0                	mov    edx,eax
  4c1c47:	85 c0                	test   eax,eax
  4c1c49:	7d 04                	jge    0x4c1c4f
  4c1c4b:	8b d0                	mov    edx,eax
  4c1c4d:	f7 da                	neg    edx
  4c1c4f:	81 f9 00 80 00 00    	cmp    ecx,0x8000
  4c1c55:	7c 06                	jl     0x4c1c5d
  4c1c57:	8d 99 00 00 ff ff    	lea    ebx,[ecx-0x10000]
  4c1c5d:	81 fa 00 80 00 00    	cmp    edx,0x8000
  4c1c63:	7c 06                	jl     0x4c1c6b
  4c1c65:	8d 82 00 00 ff ff    	lea    eax,[edx-0x10000]
  4c1c6b:	f7 d8                	neg    eax
  4c1c6d:	50                   	push   eax
  4c1c6e:	53                   	push   ebx
  4c1c6f:	e8 00 44 0c 00       	call   0x586074
  4c1c74:	66 25 ff 07          	and    ax,0x7ff
  4c1c78:	83 c4 08             	add    esp,0x8
  4c1c7b:	f6 47 0c 80          	test   BYTE PTR [edi+0xc],0x80
  4c1c7f:	74 04                	je     0x4c1c85
  4c1c81:	66 89 47 57          	mov    WORD PTR [edi+0x57],ax
  4c1c85:	66 89 47 5d          	mov    WORD PTR [edi+0x5d],ax
  4c1c89:	f6 47 0d 80          	test   BYTE PTR [edi+0xd],0x80
  4c1c8d:	74 08                	je     0x4c1c97
  4c1c8f:	66 05 00 04          	add    ax,0x400
  4c1c93:	66 25 ff 07          	and    ax,0x7ff
  4c1c97:	66 89 47 26          	mov    WORD PTR [edi+0x26],ax
  4c1c9b:	80 7e 7d 26          	cmp    BYTE PTR [esi+0x7d],0x26
  4c1c9f:	c6 86 a8 00 00 00 01 	mov    BYTE PTR [esi+0xa8],0x1
  4c1ca6:	74 07                	je     0x4c1caf
  4c1ca8:	c6 86 a8 00 00 00 00 	mov    BYTE PTR [esi+0xa8],0x0
  4c1caf:	c6 46 2d 03          	mov    BYTE PTR [esi+0x2d],0x3
  4c1cb3:	81 4e 0c 00 00 00 40 	or     DWORD PTR [esi+0xc],0x40000000
  4c1cba:	5d                   	pop    ebp
  4c1cbb:	5f                   	pop    edi
  4c1cbc:	5e                   	pop    esi
  4c1cbd:	5b                   	pop    ebx
  4c1cbe:	c3                   	ret
  4c1cbf:	f6 85 3f 09 00 00 08 	test   BYTE PTR [ebp+0x93f],0x8
  4c1cc6:	74 36                	je     0x4c1cfe
  4c1cc8:	a0 f0 c6 89 00       	mov    al,ds:0x89c6f0
  4c1ccd:	6a 01                	push   0x1
  4c1ccf:	38 46 2f             	cmp    BYTE PTR [esi+0x2f],al
  4c1cd2:	66 0f b6 46 2b       	movzx  ax,BYTE PTR [esi+0x2b]
  4c1cd7:	75 06                	jne    0x4c1cdf
  4c1cd9:	66 05 74 00          	add    ax,0x74
  4c1cdd:	eb 04                	jmp    0x4c1ce3
  4c1cdf:	66 05 8a 00          	add    ax,0x8a
  4c1ce3:	50                   	push   eax
  4c1ce4:	6a 00                	push   0x0
  4c1ce6:	e8 65 83 fc ff       	call   0x48a050
  4c1ceb:	c6 46 2d 00          	mov    BYTE PTR [esi+0x2d],0x0
  4c1cef:	83 c4 0c             	add    esp,0xc
  4c1cf2:	81 4e 0c 00 00 00 40 	or     DWORD PTR [esi+0xc],0x40000000
  4c1cf9:	5d                   	pop    ebp
  4c1cfa:	5f                   	pop    edi
  4c1cfb:	5e                   	pop    esi
  4c1cfc:	5b                   	pop    ebx
  4c1cfd:	c3                   	ret
  4c1cfe:	c6 46 2d 04          	mov    BYTE PTR [esi+0x2d],0x4
  4c1d02:	81 4e 0c 00 00 00 40 	or     DWORD PTR [esi+0xc],0x40000000
  4c1d09:	5d                   	pop    ebp
  4c1d0a:	5f                   	pop    edi
  4c1d0b:	5e                   	pop    esi
  4c1d0c:	5b                   	pop    ebx
  4c1d0d:	c3                   	ret
  4c1d0e:	cc                   	int3
  4c1d0f:	cc                   	int3
  4c1d10:	83 ec 24             	sub    esp,0x24
  4c1d13:	53                   	push   ebx
  4c1d14:	56                   	push   esi
  4c1d15:	8b 74 24 30          	mov    esi,DWORD PTR [esp+0x30]
  4c1d19:	57                   	push   edi
  4c1d1a:	55                   	push   ebp
  4c1d1b:	8a 5e 2f             	mov    bl,BYTE PTR [esi+0x2f]
  4c1d1e:	0f be c3             	movsx  eax,bl
  4c1d21:	8b c8                	mov    ecx,eax
  4c1d23:	8d 14 80             	lea    edx,[eax+eax*4]
  4c1d26:	c6 44 24 11 00       	mov    BYTE PTR [esp+0x11],0x0
  4c1d2b:	8d 04 51             	lea    eax,[ecx+edx*2]
  4c1d2e:	8d 2c c0             	lea    ebp,[eax+eax*8]
  4c1d31:	8d 14 e9             	lea    edx,[ecx+ebp*8]
  4c1d34:	8b bc 91 65 da 89 00 	mov    edi,DWORD PTR [ecx+edx*4+0x89da65]
  4c1d3b:	8d 84 91 c8 d1 89 00 	lea    eax,[ecx+edx*4+0x89d1c8]
  4c1d42:	85 ff                	test   edi,edi
  4c1d44:	75 0d                	jne    0x4c1d53
  4c1d46:	f6 80 3f 09 00 00 08 	test   BYTE PTR [eax+0x93f],0x8
  4c1d4d:	0f 84 7a 03 00 00    	je     0x4c20cd
  4c1d53:	33 c0                	xor    eax,eax
  4c1d55:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  4c1d58:	8b c8                	mov    ecx,eax
  4c1d5a:	c1 e1 06             	shl    ecx,0x6
  4c1d5d:	2b c8                	sub    ecx,eax
  4c1d5f:	2b c8                	sub    ecx,eax
  4c1d61:	66 8b 46 6a          	mov    ax,WORD PTR [esi+0x6a]
  4c1d65:	8d a9 d0 80 5a 00    	lea    ebp,[ecx+0x5a80d0]
  4c1d6b:	66 85 c0             	test   ax,ax
  4c1d6e:	74 23                	je     0x4c1d93
  4c1d70:	0f b7 c0             	movzx  eax,ax
  4c1d73:	33 c9                	xor    ecx,ecx
  4c1d75:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  4c1d7c:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
