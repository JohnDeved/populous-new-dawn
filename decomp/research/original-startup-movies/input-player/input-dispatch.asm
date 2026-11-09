
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00526a80 <.text+0x125a80>:
  526a80:	83 ec 0c             	sub    esp,0xc
  526a83:	53                   	push   ebx
  526a84:	56                   	push   esi
  526a85:	57                   	push   edi
  526a86:	55                   	push   ebp
  526a87:	e8 84 3c 00 00       	call   0x52a710
  526a8c:	8b 5c 24 24          	mov    ebx,DWORD PTR [esp+0x24]
  526a90:	85 db                	test   ebx,ebx
  526a92:	74 09                	je     0x526a9d
  526a94:	e8 77 02 00 00       	call   0x526d10
  526a99:	3b c3                	cmp    eax,ebx
  526a9b:	77 07                	ja     0x526aa4
  526a9d:	e8 6e 02 00 00       	call   0x526d10
  526aa2:	8b d8                	mov    ebx,eax
  526aa4:	8b eb                	mov    ebp,ebx
  526aa6:	8b c3                	mov    eax,ebx
  526aa8:	4b                   	dec    ebx
  526aa9:	85 c0                	test   eax,eax
  526aab:	0f 84 32 01 00 00    	je     0x526be3
  526ab1:	8b 74 24 28          	mov    esi,DWORD PTR [esp+0x28]
  526ab5:	8b 7c 24 20          	mov    edi,DWORD PTR [esp+0x20]
  526ab9:	8d 44 24 10          	lea    eax,[esp+0x10]
  526abd:	50                   	push   eax
  526abe:	e8 4d 01 00 00       	call   0x526c10
  526ac3:	83 c4 04             	add    esp,0x4
  526ac6:	85 ff                	test   edi,edi
  526ac8:	0f 84 0a 01 00 00    	je     0x526bd8
  526ace:	33 c0                	xor    eax,eax
  526ad0:	8a 44 24 10          	mov    al,BYTE PTR [esp+0x10]
  526ad4:	83 f8 01             	cmp    eax,0x1
  526ad7:	74 1f                	je     0x526af8
  526ad9:	83 f8 02             	cmp    eax,0x2
  526adc:	0f 84 c7 00 00 00    	je     0x526ba9
  526ae2:	83 f8 03             	cmp    eax,0x3
  526ae5:	0f 84 d1 00 00 00    	je     0x526bbc
  526aeb:	2b eb                	sub    ebp,ebx
  526aed:	8d 45 ff             	lea    eax,[ebp-0x1]
  526af0:	5d                   	pop    ebp
  526af1:	5f                   	pop    edi
  526af2:	5e                   	pop    esi
  526af3:	5b                   	pop    ebx
  526af4:	83 c4 0c             	add    esp,0xc
  526af7:	c3                   	ret
  526af8:	33 c0                	xor    eax,eax
  526afa:	8a 44 24 11          	mov    al,BYTE PTR [esp+0x11]
  526afe:	8d 90 10 ff ff ff    	lea    edx,[eax-0xf0]
  526b04:	83 fa 06             	cmp    edx,0x6
  526b07:	77 0f                	ja     0x526b18
  526b09:	33 c9                	xor    ecx,ecx
  526b0b:	8a 8a fc 6b 52 00    	mov    cl,BYTE PTR [edx+0x526bfc]
  526b11:	ff 24 8d f0 6b 52 00 	jmp    DWORD PTR [ecx*4+0x526bf0]
  526b18:	8b 4f 0c             	mov    ecx,DWORD PTR [edi+0xc]
  526b1b:	85 c9                	test   ecx,ecx
  526b1d:	74 15                	je     0x526b34
  526b1f:	8b 54 24 18          	mov    edx,DWORD PTR [esp+0x18]
  526b23:	56                   	push   esi
  526b24:	66 83 7c 24 16 01    	cmp    WORD PTR [esp+0x16],0x1
  526b2a:	52                   	push   edx
  526b2b:	1b d2                	sbb    edx,edx
  526b2d:	42                   	inc    edx
  526b2e:	52                   	push   edx
  526b2f:	e9 9e 00 00 00       	jmp    0x526bd2
  526b34:	8b 0f                	mov    ecx,DWORD PTR [edi]
  526b36:	85 c9                	test   ecx,ecx
  526b38:	0f 84 9a 00 00 00    	je     0x526bd8
  526b3e:	66 83 7c 24 12 01    	cmp    WORD PTR [esp+0x12],0x1
  526b44:	1b d2                	sbb    edx,edx
  526b46:	56                   	push   esi
  526b47:	42                   	inc    edx
  526b48:	52                   	push   edx
  526b49:	50                   	push   eax
  526b4a:	ff d1                	call   ecx
  526b4c:	83 c4 0c             	add    esp,0xc
  526b4f:	e9 84 00 00 00       	jmp    0x526bd8
  526b54:	8b 4f 10             	mov    ecx,DWORD PTR [edi+0x10]
  526b57:	85 c9                	test   ecx,ecx
  526b59:	74 26                	je     0x526b81
  526b5b:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  526b5f:	56                   	push   esi
  526b60:	c1 ea 10             	shr    edx,0x10
  526b63:	66 83 7c 24 16 01    	cmp    WORD PTR [esp+0x16],0x1
  526b69:	52                   	push   edx
  526b6a:	0f bf 54 24 1c       	movsx  edx,WORD PTR [esp+0x1c]
  526b6f:	52                   	push   edx
  526b70:	8b 54 24 24          	mov    edx,DWORD PTR [esp+0x24]
  526b74:	52                   	push   edx
  526b75:	1b d2                	sbb    edx,edx
  526b77:	42                   	inc    edx
  526b78:	52                   	push   edx
  526b79:	50                   	push   eax
  526b7a:	ff d1                	call   ecx
  526b7c:	83 c4 18             	add    esp,0x18
  526b7f:	eb 57                	jmp    0x526bd8
  526b81:	8b 4f 04             	mov    ecx,DWORD PTR [edi+0x4]
  526b84:	85 c9                	test   ecx,ecx
  526b86:	74 50                	je     0x526bd8
  526b88:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  526b8c:	56                   	push   esi
  526b8d:	c1 ea 10             	shr    edx,0x10
  526b90:	66 83 7c 24 16 01    	cmp    WORD PTR [esp+0x16],0x1
  526b96:	52                   	push   edx
  526b97:	0f bf 54 24 1c       	movsx  edx,WORD PTR [esp+0x1c]
  526b9c:	52                   	push   edx
  526b9d:	1b d2                	sbb    edx,edx
  526b9f:	42                   	inc    edx
  526ba0:	52                   	push   edx
  526ba1:	50                   	push   eax
  526ba2:	ff d1                	call   ecx
  526ba4:	83 c4 14             	add    esp,0x14
  526ba7:	eb 2f                	jmp    0x526bd8
  526ba9:	80 7c 24 11 01       	cmp    BYTE PTR [esp+0x11],0x1
  526bae:	1b c0                	sbb    eax,eax
  526bb0:	40                   	inc    eax
  526bb1:	50                   	push   eax
  526bb2:	e8 d9 3b 00 00       	call   0x52a790
  526bb7:	83 c4 04             	add    esp,0x4
  526bba:	eb 1c                	jmp    0x526bd8
  526bbc:	8b 4f 08             	mov    ecx,DWORD PTR [edi+0x8]
  526bbf:	85 c9                	test   ecx,ecx
  526bc1:	74 15                	je     0x526bd8
  526bc3:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  526bc7:	56                   	push   esi
  526bc8:	8b 54 24 18          	mov    edx,DWORD PTR [esp+0x18]
  526bcc:	50                   	push   eax
  526bcd:	8b 44 24 1a          	mov    eax,DWORD PTR [esp+0x1a]
  526bd1:	52                   	push   edx
  526bd2:	50                   	push   eax
  526bd3:	ff d1                	call   ecx
  526bd5:	83 c4 10             	add    esp,0x10
  526bd8:	8b c3                	mov    eax,ebx
  526bda:	4b                   	dec    ebx
  526bdb:	85 c0                	test   eax,eax
  526bdd:	0f 85 d6 fe ff ff    	jne    0x526ab9
  526be3:	8b c5                	mov    eax,ebp
  526be5:	5d                   	pop    ebp
  526be6:	5f                   	pop    edi
  526be7:	5e                   	pop    esi
  526be8:	5b                   	pop    ebx
  526be9:	83 c4 0c             	add    esp,0xc
  526bec:	c3                   	ret
