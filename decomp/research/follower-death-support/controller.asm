
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

005029d0 <.text+0x1019d0>:
  5029d0:	83 ec 0c             	sub    esp,0xc
  5029d3:	33 c0                	xor    eax,eax
  5029d5:	53                   	push   ebx
  5029d6:	56                   	push   esi
  5029d7:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  5029db:	57                   	push   edi
  5029dc:	8a 46 2d             	mov    al,BYTE PTR [esi+0x2d]
  5029df:	83 f8 06             	cmp    eax,0x6
  5029e2:	0f 87 9b 04 00 00    	ja     0x502e83
  5029e8:	ff 24 85 8c 2e 50 00 	jmp    DWORD PTR [eax*4+0x502e8c]
  5029ef:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  5029f2:	a9 00 00 00 40       	test   eax,0x40000000
  5029f7:	74 3e                	je     0x502a37
  5029f9:	66 c7 46 6e 04 00    	mov    WORD PTR [esi+0x6e],0x4
  5029ff:	25 ff ff ff bf       	and    eax,0xbfffffff
  502a04:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  502a07:	33 c0                	xor    eax,eax
  502a09:	8a 46 74             	mov    al,BYTE PTR [esi+0x74]
  502a0c:	8d 56 33             	lea    edx,[esi+0x33]
  502a0f:	0f bf 04 45 a6 6e 5a 	movsx  eax,WORD PTR [eax*2+0x5a6ea6]
  502a16:	00
  502a17:	c1 e0 02             	shl    eax,0x2
  502a1a:	66 8b 88 58 68 5a 00 	mov    cx,WORD PTR [eax+0x5a6858]
  502a21:	66 8b 80 5a 68 5a 00 	mov    ax,WORD PTR [eax+0x5a685a]
  502a28:	51                   	push   ecx
  502a29:	50                   	push   eax
  502a2a:	52                   	push   edx
  502a2b:	e8 d0 bc fe ff       	call   0x4ee700
  502a30:	c6 46 39 00          	mov    BYTE PTR [esi+0x39],0x0
  502a34:	83 c4 0c             	add    esp,0xc
  502a37:	66 8b 46 6e          	mov    ax,WORD PTR [esi+0x6e]
  502a3b:	66 48                	dec    ax
  502a3d:	66 89 46 6e          	mov    WORD PTR [esi+0x6e],ax
  502a41:	66 85 c0             	test   ax,ax
  502a44:	0f 8f 39 04 00 00    	jg     0x502e83
  502a4a:	c6 46 2d 01          	mov    BYTE PTR [esi+0x2d],0x1
  502a4e:	81 4e 0c 00 00 00 40 	or     DWORD PTR [esi+0xc],0x40000000
  502a55:	5f                   	pop    edi
  502a56:	5e                   	pop    esi
  502a57:	5b                   	pop    ebx
  502a58:	83 c4 0c             	add    esp,0xc
  502a5b:	c3                   	ret
  502a5c:	c6 46 78 01          	mov    BYTE PTR [esi+0x78],0x1
  502a60:	66 8b 46 3f          	mov    ax,WORD PTR [esi+0x3f]
  502a64:	66 8b 4e 3d          	mov    cx,WORD PTR [esi+0x3d]
  502a68:	50                   	push   eax
  502a69:	51                   	push   ecx
  502a6a:	e8 d1 be f4 ff       	call   0x44e940
  502a6f:	81 66 10 ff fb ff ff 	and    DWORD PTR [esi+0x10],0xfffffbff
  502a76:	66 89 46 41          	mov    WORD PTR [esi+0x41],ax
  502a7a:	83 c4 08             	add    esp,0x8
  502a7d:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  502a80:	a9 00 00 00 40       	test   eax,0x40000000
  502a85:	74 3e                	je     0x502ac5
  502a87:	66 c7 46 6e 80 00    	mov    WORD PTR [esi+0x6e],0x80
  502a8d:	25 ff ff ff bf       	and    eax,0xbfffffff
  502a92:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  502a95:	33 c0                	xor    eax,eax
  502a97:	8a 46 74             	mov    al,BYTE PTR [esi+0x74]
  502a9a:	8d 56 33             	lea    edx,[esi+0x33]
  502a9d:	0f bf 04 45 94 6e 5a 	movsx  eax,WORD PTR [eax*2+0x5a6e94]
  502aa4:	00
  502aa5:	c1 e0 02             	shl    eax,0x2
  502aa8:	66 8b 88 58 68 5a 00 	mov    cx,WORD PTR [eax+0x5a6858]
  502aaf:	66 8b 80 5a 68 5a 00 	mov    ax,WORD PTR [eax+0x5a685a]
  502ab6:	51                   	push   ecx
  502ab7:	50                   	push   eax
  502ab8:	52                   	push   edx
  502ab9:	e8 42 bc fe ff       	call   0x4ee700
  502abe:	c6 46 39 00          	mov    BYTE PTR [esi+0x39],0x0
  502ac2:	83 c4 0c             	add    esp,0xc
  502ac5:	66 8b 46 6e          	mov    ax,WORD PTR [esi+0x6e]
  502ac9:	66 48                	dec    ax
  502acb:	66 89 46 6e          	mov    WORD PTR [esi+0x6e],ax
  502acf:	66 85 c0             	test   ax,ax
  502ad2:	0f 8f ab 03 00 00    	jg     0x502e83
  502ad8:	c6 46 2d 02          	mov    BYTE PTR [esi+0x2d],0x2
  502adc:	81 4e 0c 00 00 00 40 	or     DWORD PTR [esi+0xc],0x40000000
  502ae3:	5f                   	pop    edi
  502ae4:	5e                   	pop    esi
  502ae5:	5b                   	pop    ebx
  502ae6:	83 c4 0c             	add    esp,0xc
  502ae9:	c3                   	ret
  502aea:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  502aed:	a9 00 00 00 40       	test   eax,0x40000000
  502af2:	74 3e                	je     0x502b32
  502af4:	66 c7 46 6e 03 00    	mov    WORD PTR [esi+0x6e],0x3
  502afa:	25 ff ff ff bf       	and    eax,0xbfffffff
  502aff:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  502b02:	33 c0                	xor    eax,eax
  502b04:	8a 46 74             	mov    al,BYTE PTR [esi+0x74]
  502b07:	8d 56 33             	lea    edx,[esi+0x33]
  502b0a:	0f bf 04 45 b8 6e 5a 	movsx  eax,WORD PTR [eax*2+0x5a6eb8]
  502b11:	00
  502b12:	c1 e0 02             	shl    eax,0x2
  502b15:	66 8b 88 58 68 5a 00 	mov    cx,WORD PTR [eax+0x5a6858]
  502b1c:	66 8b 80 5a 68 5a 00 	mov    ax,WORD PTR [eax+0x5a685a]
  502b23:	51                   	push   ecx
  502b24:	50                   	push   eax
  502b25:	52                   	push   edx
  502b26:	e8 d5 bb fe ff       	call   0x4ee700
  502b2b:	c6 46 39 00          	mov    BYTE PTR [esi+0x39],0x0
  502b2f:	83 c4 0c             	add    esp,0xc
  502b32:	66 8b 46 6e          	mov    ax,WORD PTR [esi+0x6e]
  502b36:	66 48                	dec    ax
  502b38:	66 89 46 6e          	mov    WORD PTR [esi+0x6e],ax
  502b3c:	66 85 c0             	test   ax,ax
  502b3f:	7f 0b                	jg     0x502b4c
  502b41:	c6 46 2d 03          	mov    BYTE PTR [esi+0x2d],0x3
  502b45:	81 4e 0c 00 00 00 40 	or     DWORD PTR [esi+0xc],0x40000000
  502b4c:	8d 7e 3d             	lea    edi,[esi+0x3d]
  502b4f:	57                   	push   edi
  502b50:	e8 2b ce f4 ff       	call   0x44f980
  502b55:	83 c4 04             	add    esp,0x4
  502b58:	84 c0                	test   al,al
  502b5a:	0f 85 23 03 00 00    	jne    0x502e83
  502b60:	66 8b 57 04          	mov    dx,WORD PTR [edi+0x4]
  502b64:	8d 4c 24 0c          	lea    ecx,[esp+0xc]
  502b68:	8b 07                	mov    eax,DWORD PTR [edi]
  502b6a:	89 01                	mov    DWORD PTR [ecx],eax
  502b6c:	66 89 51 04          	mov    WORD PTR [ecx+0x4],dx
  502b70:	8b 4c 24 0e          	mov    ecx,DWORD PTR [esp+0xe]
  502b74:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  502b78:	51                   	push   ecx
  502b79:	50                   	push   eax
  502b7a:	e8 c1 bd f4 ff       	call   0x44e940
  502b7f:	66 89 44 24 18       	mov    WORD PTR [esp+0x18],ax
  502b84:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  502b88:	83 c4 08             	add    esp,0x8
  502b8b:	8a 56 2f             	mov    dl,BYTE PTR [esi+0x2f]
  502b8e:	51                   	push   ecx
  502b8f:	52                   	push   edx
  502b90:	6a 41                	push   0x41
  502b92:	6a 07                	push   0x7
  502b94:	e8 07 ad fe ff       	call   0x4ed8a0
  502b99:	83 c4 10             	add    esp,0x10
  502b9c:	5f                   	pop    edi
  502b9d:	5e                   	pop    esi
  502b9e:	5b                   	pop    ebx
  502b9f:	83 c4 0c             	add    esp,0xc
  502ba2:	c3                   	ret
  502ba3:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  502ba6:	a9 00 00 00 40       	test   eax,0x40000000
  502bab:	74 7a                	je     0x502c27
  502bad:	66 c7 46 6e 20 00    	mov    WORD PTR [esi+0x6e],0x20
  502bb3:	25 ff ff ff bf       	and    eax,0xbfffffff
  502bb8:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  502bbb:	33 c0                	xor    eax,eax
  502bbd:	8a 46 74             	mov    al,BYTE PTR [esi+0x74]
  502bc0:	8d 56 33             	lea    edx,[esi+0x33]
  502bc3:	0f bf 3c 45 b8 6e 5a 	movsx  edi,WORD PTR [eax*2+0x5a6eb8]
  502bca:	00
  502bcb:	66 8b 04 bd 58 68 5a 	mov    ax,WORD PTR [edi*4+0x5a6858]
  502bd2:	00
  502bd3:	8d 1c bd 00 00 00 00 	lea    ebx,[edi*4+0x0]
  502bda:	66 8b 8b 5a 68 5a 00 	mov    cx,WORD PTR [ebx+0x5a685a]
  502be1:	50                   	push   eax
  502be2:	51                   	push   ecx
  502be3:	52                   	push   edx
  502be4:	e8 17 bb fe ff       	call   0x4ee700
  502be9:	66 8b 46 35          	mov    ax,WORD PTR [esi+0x35]
  502bed:	83 c4 0c             	add    esp,0xc
  502bf0:	80 cc 20             	or     ah,0x20
  502bf3:	66 89 46 35          	mov    WORD PTR [esi+0x35],ax
  502bf7:	80 cc 40             	or     ah,0x40
  502bfa:	66 89 46 35          	mov    WORD PTR [esi+0x35],ax
  502bfe:	83 ff 6c             	cmp    edi,0x6c
  502c01:	74 24                	je     0x502c27
  502c03:	66 c7 46 37 00 00    	mov    WORD PTR [esi+0x37],0x0
  502c09:	0c 02                	or     al,0x2
  502c0b:	66 89 46 35          	mov    WORD PTR [esi+0x35],ax
  502c0f:	a1 44 df 59 00       	mov    eax,ds:0x59df44
  502c14:	0f bf 8b 58 68 5a 00 	movsx  ecx,WORD PTR [ebx+0x5a6858]
  502c1b:	8d 14 49             	lea    edx,[ecx+ecx*2]
  502c1e:	8a 44 50 01          	mov    al,BYTE PTR [eax+edx*2+0x1]
  502c22:	fe c8                	dec    al
  502c24:	88 46 39             	mov    BYTE PTR [esi+0x39],al
  502c27:	66 8b 5e 41          	mov    bx,WORD PTR [esi+0x41]
  502c2b:	66 83 c3 28          	add    bx,0x28
  502c2f:	80 7e 77 00          	cmp    BYTE PTR [esi+0x77],0x0
  502c33:	66 89 5e 41          	mov    WORD PTR [esi+0x41],bx
  502c37:	74 67                	je     0x502ca0
  502c39:	66 8b 46 3f          	mov    ax,WORD PTR [esi+0x3f]
  502c3d:	8d 7e 3d             	lea    edi,[esi+0x3d]
  502c40:	66 8b 0f             	mov    cx,WORD PTR [edi]
  502c43:	50                   	push   eax
  502c44:	51                   	push   ecx
  502c45:	e8 f6 bc f4 ff       	call   0x44e940
  502c4a:	0f bf c8             	movsx  ecx,ax
  502c4d:	0f bf c3             	movsx  eax,bx
  502c50:	83 c4 08             	add    esp,0x8
  502c53:	81 c1 00 02 00 00    	add    ecx,0x200
  502c59:	3b c8                	cmp    ecx,eax
  502c5b:	7f 43                	jg     0x502ca0
  502c5d:	33 db                	xor    ebx,ebx
  502c5f:	8a 5e 77             	mov    bl,BYTE PTR [esi+0x77]
  502c62:	85 db                	test   ebx,ebx
  502c64:	7e 36                	jle    0x502c9c
  502c66:	57                   	push   edi
  502c67:	68 ff 00 00 00       	push   0xff
  502c6c:	6a 0b                	push   0xb
  502c6e:	6a 05                	push   0x5
  502c70:	e8 2b ac fe ff       	call   0x4ed8a0
  502c75:	83 c4 10             	add    esp,0x10
  502c78:	85 c0                	test   eax,eax
  502c7a:	74 20                	je     0x502c9c
  502c7c:	66 8b 4e 41          	mov    cx,WORD PTR [esi+0x41]
  502c80:	83 eb 64             	sub    ebx,0x64
  502c83:	66 89 48 41          	mov    WORD PTR [eax+0x41],cx
  502c87:	6a 00                	push   0x0
  502c89:	83 48 0c 04          	or     DWORD PTR [eax+0xc],0x4
  502c8d:	6a 0b                	push   0xb
  502c8f:	56                   	push   esi
  502c90:	e8 bb 73 f8 ff       	call   0x48a050
  502c95:	83 c4 0c             	add    esp,0xc
  502c98:	85 db                	test   ebx,ebx
  502c9a:	7f ca                	jg     0x502c66
  502c9c:	c6 46 77 00          	mov    BYTE PTR [esi+0x77],0x0
  502ca0:	66 8b 46 6e          	mov    ax,WORD PTR [esi+0x6e]
  502ca4:	66 48                	dec    ax
  502ca6:	66 89 46 6e          	mov    WORD PTR [esi+0x6e],ax
  502caa:	66 85 c0             	test   ax,ax
  502cad:	7f 0b                	jg     0x502cba
  502caf:	c6 46 2d 04          	mov    BYTE PTR [esi+0x2d],0x4
  502cb3:	81 4e 0c 00 00 00 40 	or     DWORD PTR [esi+0xc],0x40000000
  502cba:	80 7e 74 01          	cmp    BYTE PTR [esi+0x74],0x1
  502cbe:	0f 85 bf 01 00 00    	jne    0x502e83
  502cc4:	66 8b 46 26          	mov    ax,WORD PTR [esi+0x26]
  502cc8:	5f                   	pop    edi
  502cc9:	66 05 5b 00          	add    ax,0x5b
  502ccd:	66 25 ff 07          	and    ax,0x7ff
  502cd1:	66 89 46 26          	mov    WORD PTR [esi+0x26],ax
  502cd5:	5e                   	pop    esi
  502cd6:	5b                   	pop    ebx
  502cd7:	83 c4 0c             	add    esp,0xc
  502cda:	c3                   	ret
  502cdb:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  502cde:	a9 00 00 00 40       	test   eax,0x40000000
  502ce3:	74 1e                	je     0x502d03
  502ce5:	80 4e 35 10          	or     BYTE PTR [esi+0x35],0x10
  502ce9:	66 c7 46 6e 2c 01    	mov    WORD PTR [esi+0x6e],0x12c
  502cef:	25 ff ff ff bf       	and    eax,0xbfffffff
  502cf4:	80 7e 75 07          	cmp    BYTE PTR [esi+0x75],0x7
  502cf8:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  502cfb:	75 06                	jne    0x502d03
  502cfd:	66 c7 46 6e 2c 01    	mov    WORD PTR [esi+0x6e],0x12c
