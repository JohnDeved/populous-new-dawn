
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00502aea <.text+0x101aea>:
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
