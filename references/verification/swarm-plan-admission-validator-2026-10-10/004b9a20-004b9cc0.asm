
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004b9a20 <.text+0xb8a20>:
  4b9a20:	83 ec 2c             	sub    esp,0x2c
  4b9a23:	c6 44 24 03 01       	mov    BYTE PTR [esp+0x3],0x1
  4b9a28:	c7 44 24 28 01 00 00 	mov    DWORD PTR [esp+0x28],0x1
  4b9a2f:	00 
  4b9a30:	53                   	push   ebx
  4b9a31:	56                   	push   esi
  4b9a32:	8a 5c 24 44          	mov    bl,BYTE PTR [esp+0x44]
  4b9a36:	57                   	push   edi
  4b9a37:	55                   	push   ebp
  4b9a38:	33 ff                	xor    edi,edi
  4b9a3a:	53                   	push   ebx
  4b9a3b:	e8 80 1a f6 ff       	call   0x41b4c0
  4b9a40:	83 c4 04             	add    esp,0x4
  4b9a43:	84 c0                	test   al,al
  4b9a45:	0f 84 c3 01 00 00    	je     0x4b9c0e
  4b9a4b:	0f be eb             	movsx  ebp,bl
  4b9a4e:	8d 44 ad 00          	lea    eax,[ebp+ebp*4+0x0]
  4b9a52:	8d 4c 45 00          	lea    ecx,[ebp+eax*2+0x0]
  4b9a56:	8d 14 c9             	lea    edx,[ecx+ecx*8]
  4b9a59:	8d 44 d5 00          	lea    eax,[ebp+edx*8+0x0]
  4b9a5d:	8d 4c 85 00          	lea    ecx,[ebp+eax*4+0x0]
  4b9a61:	89 4c 24 28          	mov    DWORD PTR [esp+0x28],ecx
  4b9a65:	8a 81 e7 dd 89 00    	mov    al,BYTE PTR [ecx+0x89dde7]
  4b9a6b:	fe c8                	dec    al
  4b9a6d:	8b 35 e4 a4 5a 00    	mov    esi,DWORD PTR ds:0x5aa4e4
  4b9a73:	3c 01                	cmp    al,0x1
  4b9a75:	1a c0                	sbb    al,al
  4b9a77:	46                   	inc    esi
  4b9a78:	f6 d8                	neg    al
  4b9a7a:	88 44 24 12          	mov    BYTE PTR [esp+0x12],al
  4b9a7e:	33 c0                	xor    eax,eax
  4b9a80:	8a 44 24 44          	mov    al,BYTE PTR [esp+0x44]
  4b9a84:	83 f8 04             	cmp    eax,0x4
  4b9a87:	74 0a                	je     0x4b9a93
  4b9a89:	83 f8 0a             	cmp    eax,0xa
  4b9a8c:	74 0c                	je     0x4b9a9a
  4b9a8e:	83 f8 0b             	cmp    eax,0xb
  4b9a91:	75 16                	jne    0x4b9aa9
  4b9a93:	bf 01 00 00 00       	mov    edi,0x1
  4b9a98:	eb 0f                	jmp    0x4b9aa9
  4b9a9a:	33 c9                	xor    ecx,ecx
  4b9a9c:	bf 01 00 00 00       	mov    edi,0x1
  4b9aa1:	89 4c 24 38          	mov    DWORD PTR [esp+0x38],ecx
  4b9aa5:	88 4c 24 48          	mov    BYTE PTR [esp+0x48],cl
  4b9aa9:	8d 0c c0             	lea    ecx,[eax+eax*8]
  4b9aac:	33 d2                	xor    edx,edx
  4b9aae:	8d 04 48             	lea    eax,[eax+ecx*2]
  4b9ab1:	66 8b 14 85 28 72 5a 	mov    dx,WORD PTR [eax*4+0x5a7228]
  4b9ab8:	00 
  4b9ab9:	33 c0                	xor    eax,eax
  4b9abb:	8d 14 52             	lea    edx,[edx+edx*2]
  4b9abe:	03 d2                	add    edx,edx
  4b9ac0:	8a 44 24 48          	mov    al,BYTE PTR [esp+0x48]
  4b9ac4:	8b 0d c1 5e 89 00    	mov    ecx,DWORD PTR ds:0x895ec1
  4b9aca:	8d 14 d2             	lea    edx,[edx+edx*8]
  4b9acd:	03 d0                	add    edx,eax
  4b9acf:	0f be 44 0a 2c       	movsx  eax,BYTE PTR [edx+ecx*1+0x2c]
  4b9ad4:	c1 e0 04             	shl    eax,0x4
  4b9ad7:	8b 4c 24 40          	mov    ecx,DWORD PTR [esp+0x40]
  4b9adb:	66 89 4c 24 14       	mov    WORD PTR [esp+0x14],cx
  4b9ae0:	8d 04 40             	lea    eax,[eax+eax*2]
  4b9ae3:	03 05 3c df 59 00    	add    eax,DWORD PTR ds:0x59df3c
  4b9ae9:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  4b9aed:	8a 40 02             	mov    al,BYTE PTR [eax+0x2]
  4b9af0:	8b 54 24 1c          	mov    edx,DWORD PTR [esp+0x1c]
  4b9af4:	28 44 24 14          	sub    BYTE PTR [esp+0x14],al
  4b9af8:	c7 44 24 30 00 00 00 	mov    DWORD PTR [esp+0x30],0x0
  4b9aff:	00 
  4b9b00:	8a 4a 03             	mov    cl,BYTE PTR [edx+0x3]
  4b9b03:	8b 5a 2c             	mov    ebx,DWORD PTR [edx+0x2c]
  4b9b06:	28 4c 24 15          	sub    BYTE PTR [esp+0x15],cl
  4b9b0a:	66 8b 44 24 14       	mov    ax,WORD PTR [esp+0x14]
  4b9b0f:	66 89 44 24 16       	mov    WORD PTR [esp+0x16],ax
  4b9b14:	33 c0                	xor    eax,eax
  4b9b16:	8a 02                	mov    al,BYTE PTR [edx]
  4b9b18:	89 44 24 2c          	mov    DWORD PTR [esp+0x2c],eax
  4b9b1c:	33 c0                	xor    eax,eax
  4b9b1e:	8a 42 01             	mov    al,BYTE PTR [edx+0x1]
  4b9b21:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  4b9b25:	85 c0                	test   eax,eax
  4b9b27:	0f 8e e6 00 00 00    	jle    0x4b9c13
  4b9b2d:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  4b9b32:	0f 84 db 00 00 00    	je     0x4b9c13
  4b9b38:	c7 44 24 18 00 00 00 	mov    DWORD PTR [esp+0x18],0x0
  4b9b3f:	00 
  4b9b40:	83 7c 24 2c 00       	cmp    DWORD PTR [esp+0x2c],0x0
  4b9b45:	0f 8e a2 00 00 00    	jle    0x4b9bed
  4b9b4b:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  4b9b50:	0f 84 97 00 00 00    	je     0x4b9bed
  4b9b56:	8a 03                	mov    al,BYTE PTR [ebx]
  4b9b58:	a8 01                	test   al,0x1
  4b9b5a:	74 5e                	je     0x4b9bba
  4b9b5c:	8b 4c 24 12          	mov    ecx,DWORD PTR [esp+0x12]
  4b9b60:	8b 54 24 44          	mov    edx,DWORD PTR [esp+0x44]
  4b9b64:	51                   	push   ecx
  4b9b65:	24 f8                	and    al,0xf8
  4b9b67:	8b 4c 24 1a          	mov    ecx,DWORD PTR [esp+0x1a]
  4b9b6b:	6a 00                	push   0x0
  4b9b6d:	52                   	push   edx
  4b9b6e:	50                   	push   eax
  4b9b6f:	8b 44 24 38          	mov    eax,DWORD PTR [esp+0x38]
  4b9b73:	51                   	push   ecx
  4b9b74:	05 c8 d1 89 00       	add    eax,0x89d1c8
  4b9b79:	50                   	push   eax
  4b9b7a:	e8 d1 52 f9 ff       	call   0x44ee50
  4b9b7f:	88 44 24 2b          	mov    BYTE PTR [esp+0x2b],al
  4b9b83:	83 c4 18             	add    esp,0x18
  4b9b86:	85 ff                	test   edi,edi
  4b9b88:	75 30                	jne    0x4b9bba
  4b9b8a:	8b 44 24 16          	mov    eax,DWORD PTR [esp+0x16]
  4b9b8e:	56                   	push   esi
  4b9b8f:	55                   	push   ebp
  4b9b90:	50                   	push   eax
  4b9b91:	e8 0a 51 f9 ff       	call   0x44eca0
  4b9b96:	83 c4 0c             	add    esp,0xc
  4b9b99:	8b f8                	mov    edi,eax
  4b9b9b:	80 7c 24 44 0d       	cmp    BYTE PTR [esp+0x44],0xd
  4b9ba0:	75 18                	jne    0x4b9bba
  4b9ba2:	85 ff                	test   edi,edi
  4b9ba4:	75 14                	jne    0x4b9bba
  4b9ba6:	8d 46 02             	lea    eax,[esi+0x2]
  4b9ba9:	8b 4c 24 16          	mov    ecx,DWORD PTR [esp+0x16]
  4b9bad:	50                   	push   eax
  4b9bae:	55                   	push   ebp
  4b9baf:	51                   	push   ecx
  4b9bb0:	e8 eb 50 f9 ff       	call   0x44eca0
  4b9bb5:	83 c4 0c             	add    esp,0xc
  4b9bb8:	8b f8                	mov    edi,eax
  4b9bba:	f6 03 04             	test   BYTE PTR [ebx],0x4
  4b9bbd:	74 16                	je     0x4b9bd5
  4b9bbf:	8b 44 24 16          	mov    eax,DWORD PTR [esp+0x16]
  4b9bc3:	50                   	push   eax
  4b9bc4:	e8 87 5e f9 ff       	call   0x44fa50
  4b9bc9:	83 c4 04             	add    esp,0x4
  4b9bcc:	84 c0                	test   al,al
  4b9bce:	74 05                	je     0x4b9bd5
  4b9bd0:	c6 44 24 13 00       	mov    BYTE PTR [esp+0x13],0x0
  4b9bd5:	43                   	inc    ebx
  4b9bd6:	ff 44 24 18          	inc    DWORD PTR [esp+0x18]
  4b9bda:	80 44 24 16 02       	add    BYTE PTR [esp+0x16],0x2
  4b9bdf:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4b9be3:	39 44 24 2c          	cmp    DWORD PTR [esp+0x2c],eax
  4b9be7:	0f 8f 5e ff ff ff    	jg     0x4b9b4b
  4b9bed:	8a 44 24 14          	mov    al,BYTE PTR [esp+0x14]
  4b9bf1:	ff 44 24 30          	inc    DWORD PTR [esp+0x30]
  4b9bf5:	8b 4c 24 30          	mov    ecx,DWORD PTR [esp+0x30]
  4b9bf9:	88 44 24 16          	mov    BYTE PTR [esp+0x16],al
  4b9bfd:	80 44 24 17 02       	add    BYTE PTR [esp+0x17],0x2
  4b9c02:	39 4c 24 34          	cmp    DWORD PTR [esp+0x34],ecx
  4b9c06:	0f 8f 21 ff ff ff    	jg     0x4b9b2d
  4b9c0c:	eb 05                	jmp    0x4b9c13
  4b9c0e:	c6 44 24 13 00       	mov    BYTE PTR [esp+0x13],0x0
  4b9c13:	83 7c 24 38 00       	cmp    DWORD PTR [esp+0x38],0x0
  4b9c18:	74 7c                	je     0x4b9c96
  4b9c1a:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  4b9c1f:	0f 84 86 00 00 00    	je     0x4b9cab
  4b9c25:	85 ff                	test   edi,edi
  4b9c27:	74 6d                	je     0x4b9c96
  4b9c29:	66 8b 44 24 14       	mov    ax,WORD PTR [esp+0x14]
  4b9c2e:	66 89 44 24 18       	mov    WORD PTR [esp+0x18],ax
  4b9c33:	b8 fe 00 00 00       	mov    eax,0xfe
  4b9c38:	20 44 24 18          	and    BYTE PTR [esp+0x18],al
  4b9c3c:	20 44 24 19          	and    BYTE PTR [esp+0x19],al
  4b9c40:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  4b9c44:	66 0f b6 44 24 18    	movzx  ax,BYTE PTR [esp+0x18]
  4b9c4a:	66 c1 e0 08          	shl    ax,0x8
  4b9c4e:	66 89 44 24 20       	mov    WORD PTR [esp+0x20],ax
  4b9c53:	66 0f b6 44 24 19    	movzx  ax,BYTE PTR [esp+0x19]
  4b9c59:	66 c1 e0 08          	shl    ax,0x8
  4b9c5d:	66 89 44 24 22       	mov    WORD PTR [esp+0x22],ax
  4b9c62:	6a 00                	push   0x0
  4b9c64:	66 0f be 41 06       	movsx  ax,BYTE PTR [ecx+0x6]
  4b9c69:	66 c1 e0 06          	shl    ax,0x6
  4b9c6d:	66 01 44 24 24       	add    WORD PTR [esp+0x24],ax
  4b9c72:	66 0f be 41 07       	movsx  ax,BYTE PTR [ecx+0x7]
  4b9c77:	66 c1 e0 06          	shl    ax,0x6
  4b9c7b:	8d 4c 24 24          	lea    ecx,[esp+0x24]
  4b9c7f:	66 01 44 24 26       	add    WORD PTR [esp+0x26],ax
  4b9c84:	51                   	push   ecx
  4b9c85:	e8 76 e5 05 00       	call   0x518200
  4b9c8a:	83 c4 08             	add    esp,0x8
  4b9c8d:	84 c0                	test   al,al
  4b9c8f:	74 05                	je     0x4b9c96
  4b9c91:	c6 44 24 13 00       	mov    BYTE PTR [esp+0x13],0x0
  4b9c96:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  4b9c9b:	74 0e                	je     0x4b9cab
  4b9c9d:	85 ff                	test   edi,edi
  4b9c9f:	74 0a                	je     0x4b9cab
  4b9ca1:	b0 01                	mov    al,0x1
  4b9ca3:	5d                   	pop    ebp
  4b9ca4:	5f                   	pop    edi
  4b9ca5:	5e                   	pop    esi
  4b9ca6:	5b                   	pop    ebx
  4b9ca7:	83 c4 2c             	add    esp,0x2c
  4b9caa:	c3                   	ret
  4b9cab:	32 c0                	xor    al,al
  4b9cad:	5d                   	pop    ebp
  4b9cae:	5f                   	pop    edi
  4b9caf:	5e                   	pop    esi
  4b9cb0:	5b                   	pop    ebx
  4b9cb1:	83 c4 2c             	add    esp,0x2c
  4b9cb4:	c3                   	ret
  4b9cb5:	cc                   	int3
  4b9cb6:	cc                   	int3
  4b9cb7:	cc                   	int3
  4b9cb8:	cc                   	int3
  4b9cb9:	cc                   	int3
  4b9cba:	cc                   	int3
  4b9cbb:	cc                   	int3
  4b9cbc:	cc                   	int3
  4b9cbd:	cc                   	int3
  4b9cbe:	cc                   	int3
  4b9cbf:	cc                   	int3
