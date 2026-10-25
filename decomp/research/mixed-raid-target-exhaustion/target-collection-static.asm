
populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004f5950 <.text+0xf4950>:
  4f5950:	83 ec 18             	sub    esp,0x18
  4f5953:	33 d2                	xor    edx,edx
  4f5955:	89 54 24 0c          	mov    DWORD PTR [esp+0xc],edx
  4f5959:	53                   	push   ebx
  4f595a:	56                   	push   esi
  4f595b:	33 c0                	xor    eax,eax
  4f595d:	66 8b 44 24 28       	mov    ax,WORD PTR [esp+0x28]
  4f5962:	57                   	push   edi
  4f5963:	55                   	push   ebp
  4f5964:	25 fe 00 00 00       	and    eax,0xfe
  4f5969:	03 c0                	add    eax,eax
  4f596b:	33 c9                	xor    ecx,ecx
  4f596d:	66 8b 4c 24 30       	mov    cx,WORD PTR [esp+0x30]
  4f5972:	89 54 24 14          	mov    DWORD PTR [esp+0x14],edx
  4f5976:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  4f597c:	89 54 24 18          	mov    DWORD PTR [esp+0x18],edx
  4f5980:	0b c1                	or     eax,ecx
  4f5982:	0f bf 1c 85 ea 03 8a 	movsx  ebx,WORD PTR [eax*4+0x8a03ea]
  4f5989:	00 
  4f598a:	8b 34 9d 90 03 89 00 	mov    esi,DWORD PTR [ebx*4+0x890390]
  4f5991:	3b f2                	cmp    esi,edx
  4f5993:	0f 84 15 01 00 00    	je     0x4f5aae
  4f5999:	8b 5c 24 34          	mov    ebx,DWORD PTR [esp+0x34]
  4f599d:	8b 7c 24 38          	mov    edi,DWORD PTR [esp+0x38]
  4f59a1:	8b 6c 24 2c          	mov    ebp,DWORD PTR [esp+0x2c]
  4f59a5:	33 c0                	xor    eax,eax
  4f59a7:	8a 46 2a             	mov    al,BYTE PTR [esi+0x2a]
  4f59aa:	83 f8 01             	cmp    eax,0x1
  4f59ad:	74 0e                	je     0x4f59bd
  4f59af:	83 f8 02             	cmp    eax,0x2
  4f59b2:	0f 84 98 00 00 00    	je     0x4f5a50
  4f59b8:	e9 da 00 00 00       	jmp    0x4f5a97
  4f59bd:	f6 46 0e 01          	test   BYTE PTR [esi+0xe],0x1
  4f59c1:	0f 85 d0 00 00 00    	jne    0x4f5a97
  4f59c7:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  4f59ca:	3c 01                	cmp    al,0x1
  4f59cc:	0f 84 c5 00 00 00    	je     0x4f5a97
  4f59d2:	3c 08                	cmp    al,0x8
  4f59d4:	0f 84 bd 00 00 00    	je     0x4f5a97
  4f59da:	80 7e 2c 17          	cmp    BYTE PTR [esi+0x2c],0x17
  4f59de:	0f 84 b3 00 00 00    	je     0x4f5a97
  4f59e4:	f6 46 11 10          	test   BYTE PTR [esi+0x11],0x10
  4f59e8:	0f 85 a9 00 00 00    	jne    0x4f5a97
  4f59ee:	0f be 85 22 0c 00 00 	movsx  eax,BYTE PTR [ebp+0xc22]
  4f59f5:	50                   	push   eax
  4f59f6:	56                   	push   esi
  4f59f7:	e8 b4 8d fe ff       	call   0x4de7b0
  4f59fc:	83 c4 08             	add    esp,0x8
  4f59ff:	85 c0                	test   eax,eax
  4f5a01:	0f 85 90 00 00 00    	jne    0x4f5a97
  4f5a07:	8a 85 22 0c 00 00    	mov    al,BYTE PTR [ebp+0xc22]
  4f5a0d:	3c ff                	cmp    al,0xff
  4f5a0f:	74 1d                	je     0x4f5a2e
  4f5a11:	8a 4e 2f             	mov    cl,BYTE PTR [esi+0x2f]
  4f5a14:	80 f9 ff             	cmp    cl,0xff
  4f5a17:	74 15                	je     0x4f5a2e
  4f5a19:	3a c1                	cmp    al,cl
  4f5a1b:	74 11                	je     0x4f5a2e
  4f5a1d:	0f be c0             	movsx  eax,al
  4f5a20:	b2 01                	mov    dl,0x1
  4f5a22:	8a 80 b6 08 96 00    	mov    al,BYTE PTR [eax+0x9608b6]
  4f5a28:	d2 e2                	shl    dl,cl
  4f5a2a:	22 c2                	and    al,dl
  4f5a2c:	eb 02                	jmp    0x4f5a30
  4f5a2e:	b0 01                	mov    al,0x1
  4f5a30:	84 c0                	test   al,al
  4f5a32:	75 63                	jne    0x4f5a97
  4f5a34:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4f5a38:	3b 44 24 3c          	cmp    eax,DWORD PTR [esp+0x3c]
  4f5a3c:	7d 59                	jge    0x4f5a97
  4f5a3e:	33 c0                	xor    eax,eax
  4f5a40:	83 c7 04             	add    edi,0x4
  4f5a43:	66 8b 46 24          	mov    ax,WORD PTR [esi+0x24]
  4f5a47:	ff 44 24 18          	inc    DWORD PTR [esp+0x18]
  4f5a4b:	89 47 fc             	mov    DWORD PTR [edi-0x4],eax
  4f5a4e:	eb 47                	jmp    0x4f5a97
  4f5a50:	8a 85 22 0c 00 00    	mov    al,BYTE PTR [ebp+0xc22]
  4f5a56:	3c ff                	cmp    al,0xff
  4f5a58:	74 1d                	je     0x4f5a77
  4f5a5a:	8a 4e 2f             	mov    cl,BYTE PTR [esi+0x2f]
  4f5a5d:	80 f9 ff             	cmp    cl,0xff
  4f5a60:	74 15                	je     0x4f5a77
  4f5a62:	3a c1                	cmp    al,cl
  4f5a64:	74 11                	je     0x4f5a77
  4f5a66:	0f be c0             	movsx  eax,al
  4f5a69:	b2 01                	mov    dl,0x1
  4f5a6b:	8a 80 b6 08 96 00    	mov    al,BYTE PTR [eax+0x9608b6]
  4f5a71:	d2 e2                	shl    dl,cl
  4f5a73:	22 c2                	and    al,dl
  4f5a75:	eb 02                	jmp    0x4f5a79
  4f5a77:	b0 01                	mov    al,0x1
  4f5a79:	84 c0                	test   al,al
  4f5a7b:	75 1a                	jne    0x4f5a97
  4f5a7d:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  4f5a81:	3b 44 24 3c          	cmp    eax,DWORD PTR [esp+0x3c]
  4f5a85:	7d 10                	jge    0x4f5a97
  4f5a87:	33 c0                	xor    eax,eax
  4f5a89:	83 c3 04             	add    ebx,0x4
  4f5a8c:	66 8b 46 24          	mov    ax,WORD PTR [esi+0x24]
  4f5a90:	ff 44 24 14          	inc    DWORD PTR [esp+0x14]
  4f5a94:	89 43 fc             	mov    DWORD PTR [ebx-0x4],eax
  4f5a97:	33 c0                	xor    eax,eax
  4f5a99:	66 8b 46 20          	mov    ax,WORD PTR [esi+0x20]
  4f5a9d:	8b 34 85 90 03 89 00 	mov    esi,DWORD PTR [eax*4+0x890390]
  4f5aa4:	85 f6                	test   esi,esi
  4f5aa6:	0f 85 f9 fe ff ff    	jne    0x4f59a5
  4f5aac:	eb 04                	jmp    0x4f5ab2
  4f5aae:	8b 6c 24 2c          	mov    ebp,DWORD PTR [esp+0x2c]
  4f5ab2:	8b 44 24 40          	mov    eax,DWORD PTR [esp+0x40]
  4f5ab6:	c7 44 24 20 00 00 00 	mov    DWORD PTR [esp+0x20],0x0
  4f5abd:	00 
  4f5abe:	8d 48 01             	lea    ecx,[eax+0x1]
  4f5ac1:	0f af c8             	imul   ecx,eax
  4f5ac4:	8d 04 8d ff ff ff ff 	lea    eax,[ecx*4-0x1]
  4f5acb:	89 44 24 24          	mov    DWORD PTR [esp+0x24],eax
  4f5acf:	85 c0                	test   eax,eax
  4f5ad1:	0f 8e 94 01 00 00    	jle    0x4f5c6b
  4f5ad7:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  4f5adb:	6a 00                	push   0x0
  4f5add:	8b 4c 24 34          	mov    ecx,DWORD PTR [esp+0x34]
  4f5ae1:	50                   	push   eax
  4f5ae2:	51                   	push   ecx
  4f5ae3:	e8 a8 6d fa ff       	call   0x49c890
  4f5ae8:	66 89 44 24 1e       	mov    WORD PTR [esp+0x1e],ax
  4f5aed:	ff 44 24 28          	inc    DWORD PTR [esp+0x28]
  4f5af1:	83 c4 0c             	add    esp,0xc
  4f5af4:	33 c0                	xor    eax,eax
  4f5af6:	66 8b 44 24 12       	mov    ax,WORD PTR [esp+0x12]
  4f5afb:	33 c9                	xor    ecx,ecx
  4f5afd:	66 8b 4c 24 12       	mov    cx,WORD PTR [esp+0x12]
  4f5b02:	25 fe 00 00 00       	and    eax,0xfe
  4f5b07:	03 c0                	add    eax,eax
  4f5b09:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  4f5b0f:	0b c1                	or     eax,ecx
  4f5b11:	0f bf 14 85 ea 03 8a 	movsx  edx,WORD PTR [eax*4+0x8a03ea]
  4f5b18:	00 
  4f5b19:	8b 34 95 90 03 89 00 	mov    esi,DWORD PTR [edx*4+0x890390]
  4f5b20:	85 f6                	test   esi,esi
  4f5b22:	0f 84 1d 01 00 00    	je     0x4f5c45
  4f5b28:	8b 4c 24 34          	mov    ecx,DWORD PTR [esp+0x34]
  4f5b2c:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  4f5b30:	8d 1c 81             	lea    ebx,[ecx+eax*4]
  4f5b33:	8b 4c 24 38          	mov    ecx,DWORD PTR [esp+0x38]
  4f5b37:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4f5b3b:	8d 3c 81             	lea    edi,[ecx+eax*4]
  4f5b3e:	33 c0                	xor    eax,eax
  4f5b40:	8a 46 2a             	mov    al,BYTE PTR [esi+0x2a]
  4f5b43:	83 f8 01             	cmp    eax,0x1
  4f5b46:	74 0e                	je     0x4f5b56
  4f5b48:	83 f8 02             	cmp    eax,0x2
  4f5b4b:	0f 84 98 00 00 00    	je     0x4f5be9
  4f5b51:	e9 da 00 00 00       	jmp    0x4f5c30
  4f5b56:	f6 46 0e 01          	test   BYTE PTR [esi+0xe],0x1
  4f5b5a:	0f 85 d0 00 00 00    	jne    0x4f5c30
  4f5b60:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  4f5b63:	3c 01                	cmp    al,0x1
  4f5b65:	0f 84 c5 00 00 00    	je     0x4f5c30
  4f5b6b:	3c 08                	cmp    al,0x8
  4f5b6d:	0f 84 bd 00 00 00    	je     0x4f5c30
  4f5b73:	80 7e 2c 17          	cmp    BYTE PTR [esi+0x2c],0x17
  4f5b77:	0f 84 b3 00 00 00    	je     0x4f5c30
  4f5b7d:	f6 46 11 10          	test   BYTE PTR [esi+0x11],0x10
  4f5b81:	0f 85 a9 00 00 00    	jne    0x4f5c30
  4f5b87:	0f be 85 22 0c 00 00 	movsx  eax,BYTE PTR [ebp+0xc22]
  4f5b8e:	50                   	push   eax
  4f5b8f:	56                   	push   esi
  4f5b90:	e8 1b 8c fe ff       	call   0x4de7b0
  4f5b95:	83 c4 08             	add    esp,0x8
  4f5b98:	85 c0                	test   eax,eax
  4f5b9a:	0f 85 90 00 00 00    	jne    0x4f5c30
  4f5ba0:	8a 85 22 0c 00 00    	mov    al,BYTE PTR [ebp+0xc22]
  4f5ba6:	3c ff                	cmp    al,0xff
  4f5ba8:	74 1d                	je     0x4f5bc7
  4f5baa:	8a 4e 2f             	mov    cl,BYTE PTR [esi+0x2f]
  4f5bad:	80 f9 ff             	cmp    cl,0xff
  4f5bb0:	74 15                	je     0x4f5bc7
  4f5bb2:	3a c1                	cmp    al,cl
  4f5bb4:	74 11                	je     0x4f5bc7
  4f5bb6:	0f be c0             	movsx  eax,al
  4f5bb9:	b2 01                	mov    dl,0x1
  4f5bbb:	8a 80 b6 08 96 00    	mov    al,BYTE PTR [eax+0x9608b6]
  4f5bc1:	d2 e2                	shl    dl,cl
  4f5bc3:	22 c2                	and    al,dl
  4f5bc5:	eb 02                	jmp    0x4f5bc9
  4f5bc7:	b0 01                	mov    al,0x1
  4f5bc9:	84 c0                	test   al,al
  4f5bcb:	75 63                	jne    0x4f5c30
  4f5bcd:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4f5bd1:	3b 44 24 3c          	cmp    eax,DWORD PTR [esp+0x3c]
  4f5bd5:	7d 59                	jge    0x4f5c30
  4f5bd7:	33 c0                	xor    eax,eax
  4f5bd9:	83 c7 04             	add    edi,0x4
  4f5bdc:	66 8b 46 24          	mov    ax,WORD PTR [esi+0x24]
  4f5be0:	ff 44 24 18          	inc    DWORD PTR [esp+0x18]
  4f5be4:	89 47 fc             	mov    DWORD PTR [edi-0x4],eax
  4f5be7:	eb 47                	jmp    0x4f5c30
  4f5be9:	8a 85 22 0c 00 00    	mov    al,BYTE PTR [ebp+0xc22]
  4f5bef:	3c ff                	cmp    al,0xff
  4f5bf1:	74 1d                	je     0x4f5c10
  4f5bf3:	8a 4e 2f             	mov    cl,BYTE PTR [esi+0x2f]
  4f5bf6:	80 f9 ff             	cmp    cl,0xff
  4f5bf9:	74 15                	je     0x4f5c10
  4f5bfb:	3a c1                	cmp    al,cl
  4f5bfd:	74 11                	je     0x4f5c10
  4f5bff:	0f be c0             	movsx  eax,al
  4f5c02:	b2 01                	mov    dl,0x1
  4f5c04:	8a 80 b6 08 96 00    	mov    al,BYTE PTR [eax+0x9608b6]
  4f5c0a:	d2 e2                	shl    dl,cl
  4f5c0c:	22 c2                	and    al,dl
  4f5c0e:	eb 02                	jmp    0x4f5c12
  4f5c10:	b0 01                	mov    al,0x1
  4f5c12:	84 c0                	test   al,al
  4f5c14:	75 1a                	jne    0x4f5c30
  4f5c16:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  4f5c1a:	3b 44 24 3c          	cmp    eax,DWORD PTR [esp+0x3c]
  4f5c1e:	7d 10                	jge    0x4f5c30
  4f5c20:	33 c0                	xor    eax,eax
  4f5c22:	83 c3 04             	add    ebx,0x4
  4f5c25:	66 8b 46 24          	mov    ax,WORD PTR [esi+0x24]
  4f5c29:	ff 44 24 14          	inc    DWORD PTR [esp+0x14]
  4f5c2d:	89 43 fc             	mov    DWORD PTR [ebx-0x4],eax
  4f5c30:	33 c0                	xor    eax,eax
  4f5c32:	66 8b 46 20          	mov    ax,WORD PTR [esi+0x20]
  4f5c36:	8b 34 85 90 03 89 00 	mov    esi,DWORD PTR [eax*4+0x890390]
  4f5c3d:	85 f6                	test   esi,esi
  4f5c3f:	0f 85 f9 fe ff ff    	jne    0x4f5b3e
  4f5c45:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  4f5c49:	3b 44 24 3c          	cmp    eax,DWORD PTR [esp+0x3c]
  4f5c4d:	7c 0a                	jl     0x4f5c59
  4f5c4f:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4f5c53:	3b 44 24 3c          	cmp    eax,DWORD PTR [esp+0x3c]
  4f5c57:	7d 12                	jge    0x4f5c6b
  4f5c59:	ff 44 24 20          	inc    DWORD PTR [esp+0x20]
  4f5c5d:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  4f5c61:	3b 44 24 24          	cmp    eax,DWORD PTR [esp+0x24]
  4f5c65:	0f 8c 6c fe ff ff    	jl     0x4f5ad7
  4f5c6b:	5d                   	pop    ebp
  4f5c6c:	5f                   	pop    edi
  4f5c6d:	5e                   	pop    esi
  4f5c6e:	5b                   	pop    ebx
  4f5c6f:	83 c4 18             	add    esp,0x18
  4f5c72:	c3                   	ret
  4f5c73:	cc                   	int3
  4f5c74:	cc                   	int3
  4f5c75:	cc                   	int3
  4f5c76:	cc                   	int3
  4f5c77:	cc                   	int3
  4f5c78:	cc                   	int3
  4f5c79:	cc                   	int3
  4f5c7a:	cc                   	int3
  4f5c7b:	cc                   	int3
  4f5c7c:	cc                   	int3
  4f5c7d:	cc                   	int3
  4f5c7e:	cc                   	int3
  4f5c7f:	cc                   	int3
