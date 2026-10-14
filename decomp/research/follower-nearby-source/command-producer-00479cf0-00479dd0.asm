
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00479cf0 <.text+0x78cf0>:
  479cf0:	53                   	push   ebx
  479cf1:	33 c0                	xor    eax,eax
  479cf3:	8a 44 24 08          	mov    al,BYTE PTR [esp+0x8]
  479cf7:	56                   	push   esi
  479cf8:	32 d2                	xor    dl,dl
  479cfa:	8d 0c 40             	lea    ecx,[eax+eax*2]
  479cfd:	f6 05 62 c6 89 00 08 	test   BYTE PTR ds:0x89c662,0x8
  479d04:	8d b4 89 97 79 89 00 	lea    esi,[ecx+ecx*4+0x897997]
  479d0b:	75 56                	jne    0x479d63
  479d0d:	66 8b 4c 24 10       	mov    cx,WORD PTR [esp+0x10]
  479d12:	0f b7 c1             	movzx  eax,cx
  479d15:	83 e8 0c             	sub    eax,0xc
  479d18:	83 f8 46             	cmp    eax,0x46
  479d1b:	77 0f                	ja     0x479d2c
  479d1d:	33 db                	xor    ebx,ebx
  479d1f:	8a 98 84 9d 47 00    	mov    bl,BYTE PTR [eax+0x479d84]
  479d25:	ff 24 9d 68 9d 47 00 	jmp    DWORD PTR [ebx*4+0x479d68]
  479d2c:	80 7e 0c 00          	cmp    BYTE PTR [esi+0xc],0x0
  479d30:	75 1c                	jne    0x479d4e
  479d32:	eb 18                	jmp    0x479d4c
  479d34:	81 0d 61 c6 89 00 00 	or     DWORD PTR ds:0x89c661,0x800
  479d3b:	08 00 00 
  479d3e:	81 0d 61 c6 89 00 00 	or     DWORD PTR ds:0x89c661,0x800000
  479d45:	00 80 00 
  479d48:	b2 01                	mov    dl,0x1
  479d4a:	eb 02                	jmp    0x479d4e
  479d4c:	b2 01                	mov    dl,0x1
  479d4e:	84 d2                	test   dl,dl
  479d50:	74 11                	je     0x479d63
  479d52:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  479d56:	88 4e 0c             	mov    BYTE PTR [esi+0xc],cl
  479d59:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  479d5d:	89 46 04             	mov    DWORD PTR [esi+0x4],eax
  479d60:	89 4e 08             	mov    DWORD PTR [esi+0x8],ecx
  479d63:	5e                   	pop    esi
  479d64:	5b                   	pop    ebx
  479d65:	c3                   	ret
  479d66:	8b ff                	mov    edi,edi
  479d68:	34 9d                	xor    al,0x9d
  479d6a:	47                   	inc    edi
  479d6b:	00 34 9d 47 00 4c 9d 	add    BYTE PTR [ebx*4-0x62b3ffb9],dh
  479d72:	47                   	inc    edi
  479d73:	00 4c 9d 47          	add    BYTE PTR [ebp+ebx*4+0x47],cl
  479d77:	00 4c 9d 47          	add    BYTE PTR [ebp+ebx*4+0x47],cl
  479d7b:	00 4c 9d 47          	add    BYTE PTR [ebp+ebx*4+0x47],cl
  479d7f:	00 2c 9d 47 00 00 06 	add    BYTE PTR [ebx*4+0x6000047],ch
  479d86:	06                   	push   es
  479d87:	06                   	push   es
  479d88:	06                   	push   es
  479d89:	06                   	push   es
  479d8a:	06                   	push   es
  479d8b:	06                   	push   es
  479d8c:	06                   	push   es
  479d8d:	06                   	push   es
  479d8e:	06                   	push   es
  479d8f:	06                   	push   es
  479d90:	06                   	push   es
  479d91:	06                   	push   es
  479d92:	06                   	push   es
  479d93:	06                   	push   es
  479d94:	01 06                	add    DWORD PTR [esi],eax
  479d96:	06                   	push   es
  479d97:	06                   	push   es
  479d98:	06                   	push   es
  479d99:	06                   	push   es
  479d9a:	06                   	push   es
  479d9b:	02 06                	add    al,BYTE PTR [esi]
  479d9d:	03 06                	add    eax,DWORD PTR [esi]
  479d9f:	06                   	push   es
  479da0:	06                   	push   es
  479da1:	06                   	push   es
  479da2:	06                   	push   es
  479da3:	06                   	push   es
  479da4:	06                   	push   es
  479da5:	04 04                	add    al,0x4
  479da7:	04 04                	add    al,0x4
  479da9:	06                   	push   es
  479daa:	06                   	push   es
  479dab:	06                   	push   es
  479dac:	06                   	push   es
  479dad:	06                   	push   es
  479dae:	06                   	push   es
  479daf:	06                   	push   es
  479db0:	06                   	push   es
  479db1:	06                   	push   es
  479db2:	06                   	push   es
  479db3:	06                   	push   es
  479db4:	06                   	push   es
  479db5:	06                   	push   es
  479db6:	06                   	push   es
  479db7:	06                   	push   es
  479db8:	06                   	push   es
  479db9:	06                   	push   es
  479dba:	06                   	push   es
  479dbb:	06                   	push   es
  479dbc:	06                   	push   es
  479dbd:	06                   	push   es
  479dbe:	06                   	push   es
  479dbf:	06                   	push   es
  479dc0:	06                   	push   es
  479dc1:	06                   	push   es
  479dc2:	06                   	push   es
  479dc3:	06                   	push   es
  479dc4:	06                   	push   es
  479dc5:	06                   	push   es
  479dc6:	06                   	push   es
  479dc7:	06                   	push   es
  479dc8:	06                   	push   es
  479dc9:	06                   	push   es
  479dca:	05 cc cc cc cc       	add    eax,0xcccccccc
  479dcf:	cc                   	int3
