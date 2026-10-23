
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00412960 <.text+0x11960>:
  412960:	83 ec 08             	sub    esp,0x8
  412963:	f6 05 64 c6 89 00 02 	test   BYTE PTR ds:0x89c664,0x2
  41296a:	53                   	push   ebx
  41296b:	56                   	push   esi
  41296c:	57                   	push   edi
  41296d:	55                   	push   ebp
  41296e:	0f 84 6c 03 00 00    	je     0x412ce0
  412974:	8b 0d b0 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13b0
  41297a:	a1 bc 13 5f 00       	mov    eax,ds:0x5f13bc
  41297f:	8d 14 49             	lea    edx,[ecx+ecx*2]
  412982:	8d 0c 91             	lea    ecx,[ecx+edx*4]
  412985:	8b 7c 88 28          	mov    edi,DWORD PTR [eax+ecx*4+0x28]
  412989:	83 ff 18             	cmp    edi,0x18
  41298c:	74 26                	je     0x4129b4
  41298e:	83 ff 19             	cmp    edi,0x19
  412991:	74 3e                	je     0x4129d1
  412993:	33 f6                	xor    esi,esi
  412995:	8d 47 ff             	lea    eax,[edi-0x1]
  412998:	89 74 24 10          	mov    DWORD PTR [esp+0x10],esi
  41299c:	83 f8 18             	cmp    eax,0x18
  41299f:	0f 87 25 03 00 00    	ja     0x412cca
  4129a5:	33 c9                	xor    ecx,ecx
  4129a7:	8a 88 2c 2e 41 00    	mov    cl,BYTE PTR [eax+0x412e2c]
  4129ad:	ff 24 8d 14 2e 41 00 	jmp    DWORD PTR [ecx*4+0x412e14]
  4129b4:	33 c0                	xor    eax,eax
  4129b6:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  4129bb:	50                   	push   eax
  4129bc:	6a 00                	push   0x0
  4129be:	6a 00                	push   0x0
  4129c0:	6a 01                	push   0x1
  4129c2:	68 b4 9b 59 00       	push   0x599bb4
  4129c7:	e8 b4 a2 08 00       	call   0x49cc80
  4129cc:	83 c4 14             	add    esp,0x14
  4129cf:	eb c2                	jmp    0x412993
  4129d1:	c7 05 f4 c9 5f 00 00 	mov    DWORD PTR ds:0x5fc9f4,0x0
  4129d8:	00 00 00
  4129db:	81 0d 65 c6 89 00 00 	or     DWORD PTR ds:0x89c665,0x80000
  4129e2:	00 08 00
  4129e5:	6a 0c                	push   0xc
  4129e7:	e8 74 00 03 00       	call   0x442a60
  4129ec:	83 c4 04             	add    esp,0x4
  4129ef:	5d                   	pop    ebp
  4129f0:	5f                   	pop    edi
  4129f1:	5e                   	pop    esi
  4129f2:	5b                   	pop    ebx
  4129f3:	83 c4 08             	add    esp,0x8
  4129f6:	c3                   	ret
  4129f7:	33 ed                	xor    ebp,ebp
  4129f9:	8d 5f 01             	lea    ebx,[edi+0x1]
  4129fc:	83 fb 10             	cmp    ebx,0x10
  4129ff:	7f 1a                	jg     0x412a1b
  412a01:	53                   	push   ebx
  412a02:	e8 39 c3 06 00       	call   0x47ed40
  412a07:	83 c4 04             	add    esp,0x4
  412a0a:	85 c0                	test   eax,eax
  412a0c:	74 08                	je     0x412a16
  412a0e:	43                   	inc    ebx
  412a0f:	83 fb 10             	cmp    ebx,0x10
  412a12:	7e ed                	jle    0x412a01
  412a14:	eb 05                	jmp    0x412a1b
  412a16:	bd 01 00 00 00       	mov    ebp,0x1
  412a1b:	85 ed                	test   ebp,ebp
  412a1d:	74 7d                	je     0x412a9c
  412a1f:	33 c9                	xor    ecx,ecx
  412a21:	39 35 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,esi
  412a27:	7e 18                	jle    0x412a41
  412a29:	a1 bc 13 5f 00       	mov    eax,ds:0x5f13bc
  412a2e:	83 c0 28             	add    eax,0x28
  412a31:	39 18                	cmp    DWORD PTR [eax],ebx
  412a33:	74 5f                	je     0x412a94
  412a35:	83 c0 34             	add    eax,0x34
  412a38:	41                   	inc    ecx
  412a39:	39 0d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,ecx
  412a3f:	7f f0                	jg     0x412a31
  412a41:	89 35 ac 13 5f 00    	mov    DWORD PTR ds:0x5f13ac,esi
  412a47:	8b 0d ac 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13ac
  412a4d:	a1 bc 13 5f 00       	mov    eax,ds:0x5f13bc
  412a52:	8d 14 49             	lea    edx,[ecx+ecx*2]
  412a55:	8d 0c 91             	lea    ecx,[ecx+edx*4]
  412a58:	8b 44 88 28          	mov    eax,DWORD PTR [eax+ecx*4+0x28]
  412a5c:	8d 14 80             	lea    edx,[eax+eax*4]
  412a5f:	8d 04 d0             	lea    eax,[eax+edx*8]
  412a62:	80 0c 85 65 a3 89 00 	or     BYTE PTR [eax*4+0x89a365],0x4
  412a69:	04
  412a6a:	83 fb 10             	cmp    ebx,0x10
  412a6d:	0f 85 57 02 00 00    	jne    0x412cca
  412a73:	80 0d a5 ad 89 00 04 	or     BYTE PTR ds:0x89ada5,0x4
  412a7a:	80 0d 49 ae 89 00 04 	or     BYTE PTR ds:0x89ae49,0x4
  412a81:	80 0d ed ae 89 00 04 	or     BYTE PTR ds:0x89aeed,0x4
  412a88:	80 0d 91 af 89 00 04 	or     BYTE PTR ds:0x89af91,0x4
  412a8f:	e9 36 02 00 00       	jmp    0x412cca
  412a94:	89 0d ac 13 5f 00    	mov    DWORD PTR ds:0x5f13ac,ecx
  412a9a:	eb ab                	jmp    0x412a47
  412a9c:	c7 44 24 10 01 00 00 	mov    DWORD PTR [esp+0x10],0x1
  412aa3:	00
  412aa4:	bf 10 00 00 00       	mov    edi,0x10
  412aa9:	e9 1c 02 00 00       	jmp    0x412cca
  412aae:	bb 10 00 00 00       	mov    ebx,0x10
  412ab3:	bd a5 ad 89 00       	mov    ebp,0x89ada5
  412ab8:	89 74 24 14          	mov    DWORD PTR [esp+0x14],esi
  412abc:	53                   	push   ebx
  412abd:	80 4d 00 04          	or     BYTE PTR [ebp+0x0],0x4
  412ac1:	e8 7a c2 06 00       	call   0x47ed40
  412ac6:	83 c4 04             	add    esp,0x4
  412ac9:	85 c0                	test   eax,eax
  412acb:	74 11                	je     0x412ade
  412acd:	81 c5 a4 00 00 00    	add    ebp,0xa4
  412ad3:	43                   	inc    ebx
  412ad4:	81 fd 35 b0 89 00    	cmp    ebp,0x89b035
  412ada:	72 e0                	jb     0x412abc
  412adc:	eb 08                	jmp    0x412ae6
  412ade:	c7 44 24 14 01 00 00 	mov    DWORD PTR [esp+0x14],0x1
  412ae5:	00
  412ae6:	39 74 24 14          	cmp    DWORD PTR [esp+0x14],esi
  412aea:	74 38                	je     0x412b24
  412aec:	33 c9                	xor    ecx,ecx
  412aee:	39 35 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,esi
  412af4:	7e 18                	jle    0x412b0e
  412af6:	a1 bc 13 5f 00       	mov    eax,ds:0x5f13bc
  412afb:	83 c0 28             	add    eax,0x28
  412afe:	39 18                	cmp    DWORD PTR [eax],ebx
  412b00:	74 17                	je     0x412b19
  412b02:	83 c0 34             	add    eax,0x34
  412b05:	41                   	inc    ecx
  412b06:	39 0d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,ecx
  412b0c:	7f f0                	jg     0x412afe
  412b0e:	89 35 ac 13 5f 00    	mov    DWORD PTR ds:0x5f13ac,esi
  412b14:	e9 b1 01 00 00       	jmp    0x412cca
  412b19:	89 0d ac 13 5f 00    	mov    DWORD PTR ds:0x5f13ac,ecx
  412b1f:	e9 a6 01 00 00       	jmp    0x412cca
  412b24:	c7 44 24 10 01 00 00 	mov    DWORD PTR [esp+0x10],0x1
  412b2b:	00
  412b2c:	bf 14 00 00 00       	mov    edi,0x14
  412b31:	e9 94 01 00 00       	jmp    0x412cca
  412b36:	33 ed                	xor    ebp,ebp
  412b38:	bb 14 00 00 00       	mov    ebx,0x14
  412b3d:	53                   	push   ebx
  412b3e:	e8 fd c1 06 00       	call   0x47ed40
  412b43:	83 c4 04             	add    esp,0x4
  412b46:	85 c0                	test   eax,eax
  412b48:	74 08                	je     0x412b52
  412b4a:	43                   	inc    ebx
  412b4b:	83 fb 16             	cmp    ebx,0x16
  412b4e:	7c ed                	jl     0x412b3d
  412b50:	eb 05                	jmp    0x412b57
  412b52:	bd 01 00 00 00       	mov    ebp,0x1
  412b57:	85 ed                	test   ebp,ebp
  412b59:	0f 84 8c 00 00 00    	je     0x412beb
  412b5f:	83 fb 14             	cmp    ebx,0x14
  412b62:	75 1c                	jne    0x412b80
  412b64:	6a 10                	push   0x10
  412b66:	e8 d5 c1 06 00       	call   0x47ed40
  412b6b:	83 c4 04             	add    esp,0x4
  412b6e:	85 c0                	test   eax,eax
  412b70:	74 2f                	je     0x412ba1
  412b72:	6a 11                	push   0x11
  412b74:	e8 c7 c1 06 00       	call   0x47ed40
  412b79:	83 c4 04             	add    esp,0x4
  412b7c:	85 c0                	test   eax,eax
  412b7e:	74 21                	je     0x412ba1
  412b80:	83 fb 15             	cmp    ebx,0x15
  412b83:	75 2e                	jne    0x412bb3
  412b85:	6a 12                	push   0x12
  412b87:	e8 b4 c1 06 00       	call   0x47ed40
  412b8c:	83 c4 04             	add    esp,0x4
  412b8f:	85 c0                	test   eax,eax
  412b91:	74 0e                	je     0x412ba1
  412b93:	6a 13                	push   0x13
  412b95:	e8 a6 c1 06 00       	call   0x47ed40
  412b9a:	83 c4 04             	add    esp,0x4
  412b9d:	85 c0                	test   eax,eax
  412b9f:	75 12                	jne    0x412bb3
  412ba1:	c7 44 24 10 01 00 00 	mov    DWORD PTR [esp+0x10],0x1
  412ba8:	00
  412ba9:	bf 10 00 00 00       	mov    edi,0x10
  412bae:	e9 17 01 00 00       	jmp    0x412cca
  412bb3:	33 c0                	xor    eax,eax
  412bb5:	39 35 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,esi
  412bbb:	7e 19                	jle    0x412bd6
  412bbd:	8b 0d bc 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13bc
  412bc3:	83 c1 28             	add    ecx,0x28
  412bc6:	39 19                	cmp    DWORD PTR [ecx],ebx
  412bc8:	74 17                	je     0x412be1
  412bca:	83 c1 34             	add    ecx,0x34
  412bcd:	40                   	inc    eax
  412bce:	39 05 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,eax
  412bd4:	7f f0                	jg     0x412bc6
  412bd6:	89 35 ac 13 5f 00    	mov    DWORD PTR ds:0x5f13ac,esi
  412bdc:	e9 e9 00 00 00       	jmp    0x412cca
  412be1:	a3 ac 13 5f 00       	mov    ds:0x5f13ac,eax
  412be6:	e9 df 00 00 00       	jmp    0x412cca
  412beb:	c7 44 24 10 01 00 00 	mov    DWORD PTR [esp+0x10],0x1
  412bf2:	00
  412bf3:	bf 16 00 00 00       	mov    edi,0x16
  412bf8:	e9 cd 00 00 00       	jmp    0x412cca
  412bfd:	33 ed                	xor    ebp,ebp
  412bff:	8b df                	mov    ebx,edi
  412c01:	83 fb 19             	cmp    ebx,0x19
  412c04:	7f 1a                	jg     0x412c20
  412c06:	53                   	push   ebx
  412c07:	e8 34 c1 06 00       	call   0x47ed40
  412c0c:	83 c4 04             	add    esp,0x4
  412c0f:	85 c0                	test   eax,eax
  412c11:	74 08                	je     0x412c1b
  412c13:	43                   	inc    ebx
  412c14:	83 fb 19             	cmp    ebx,0x19
  412c17:	7e ed                	jle    0x412c06
  412c19:	eb 05                	jmp    0x412c20
  412c1b:	bd 01 00 00 00       	mov    ebp,0x1
  412c20:	85 ed                	test   ebp,ebp
  412c22:	74 2c                	je     0x412c50
  412c24:	33 c0                	xor    eax,eax
  412c26:	39 35 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,esi
  412c2c:	7e 73                	jle    0x412ca1
  412c2e:	8b 0d bc 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13bc
  412c34:	83 c1 28             	add    ecx,0x28
  412c37:	39 19                	cmp    DWORD PTR [ecx],ebx
  412c39:	74 0e                	je     0x412c49
  412c3b:	83 c1 34             	add    ecx,0x34
  412c3e:	40                   	inc    eax
  412c3f:	39 05 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,eax
  412c45:	7f f0                	jg     0x412c37
  412c47:	eb 58                	jmp    0x412ca1
  412c49:	a3 ac 13 5f 00       	mov    ds:0x5f13ac,eax
  412c4e:	eb 57                	jmp    0x412ca7
  412c50:	33 c0                	xor    eax,eax
  412c52:	39 35 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,esi
  412c58:	7e 47                	jle    0x412ca1
  412c5a:	8b 0d bc 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13bc
  412c60:	83 c1 28             	add    ecx,0x28
  412c63:	83 39 19             	cmp    DWORD PTR [ecx],0x19
  412c66:	74 0e                	je     0x412c76
  412c68:	83 c1 34             	add    ecx,0x34
  412c6b:	40                   	inc    eax
  412c6c:	39 05 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,eax
  412c72:	7f ef                	jg     0x412c63
  412c74:	eb 2b                	jmp    0x412ca1
  412c76:	a3 ac 13 5f 00       	mov    ds:0x5f13ac,eax
  412c7b:	eb 2a                	jmp    0x412ca7
  412c7d:	33 c0                	xor    eax,eax
  412c7f:	39 35 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,esi
  412c85:	7e 1a                	jle    0x412ca1
  412c87:	8b 0d bc 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13bc
  412c8d:	83 c1 28             	add    ecx,0x28
  412c90:	83 39 19             	cmp    DWORD PTR [ecx],0x19
  412c93:	74 44                	je     0x412cd9
  412c95:	83 c1 34             	add    ecx,0x34
  412c98:	40                   	inc    eax
  412c99:	39 05 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,eax
  412c9f:	7f ef                	jg     0x412c90
  412ca1:	89 35 ac 13 5f 00    	mov    DWORD PTR ds:0x5f13ac,esi
  412ca7:	8b 0d ac 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13ac
  412cad:	a1 bc 13 5f 00       	mov    eax,ds:0x5f13bc
  412cb2:	8d 14 49             	lea    edx,[ecx+ecx*2]
  412cb5:	8d 0c 91             	lea    ecx,[ecx+edx*4]
  412cb8:	8b 4c 88 28          	mov    ecx,DWORD PTR [eax+ecx*4+0x28]
  412cbc:	8d 04 89             	lea    eax,[ecx+ecx*4]
  412cbf:	8d 0c c1             	lea    ecx,[ecx+eax*8]
  412cc2:	80 0c 8d 65 a3 89 00 	or     BYTE PTR [ecx*4+0x89a365],0x4
  412cc9:	04
  412cca:	39 74 24 10          	cmp    DWORD PTR [esp+0x10],esi
  412cce:	0f 85 c1 fc ff ff    	jne    0x412995
  412cd4:	e9 cf 00 00 00       	jmp    0x412da8
  412cd9:	a3 ac 13 5f 00       	mov    ds:0x5f13ac,eax
  412cde:	eb c7                	jmp    0x412ca7
  412ce0:	83 7c 24 1c 00       	cmp    DWORD PTR [esp+0x1c],0x0
  412ce5:	75 1b                	jne    0x412d02
  412ce7:	33 c0                	xor    eax,eax
  412ce9:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  412cee:	50                   	push   eax
  412cef:	6a 00                	push   0x0
  412cf1:	6a 00                	push   0x0
  412cf3:	6a 01                	push   0x1
  412cf5:	68 a0 9b 59 00       	push   0x599ba0
  412cfa:	e8 81 9f 08 00       	call   0x49cc80
  412cff:	83 c4 14             	add    esp,0x14
  412d02:	33 f6                	xor    esi,esi
  412d04:	bf 01 00 00 00       	mov    edi,0x1
  412d09:	57                   	push   edi
  412d0a:	e8 31 c0 06 00       	call   0x47ed40
  412d0f:	83 c4 04             	add    esp,0x4
  412d12:	85 c0                	test   eax,eax
  412d14:	74 08                	je     0x412d1e
  412d16:	47                   	inc    edi
  412d17:	83 ff 19             	cmp    edi,0x19
  412d1a:	7e ed                	jle    0x412d09
  412d1c:	eb 05                	jmp    0x412d23
  412d1e:	be 01 00 00 00       	mov    esi,0x1
  412d23:	85 f6                	test   esi,esi
  412d25:	74 2c                	je     0x412d53
  412d27:	33 c9                	xor    ecx,ecx
  412d29:	39 0d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,ecx
  412d2f:	7e 4a                	jle    0x412d7b
  412d31:	a1 bc 13 5f 00       	mov    eax,ds:0x5f13bc
  412d36:	83 c0 28             	add    eax,0x28
  412d39:	39 38                	cmp    DWORD PTR [eax],edi
  412d3b:	74 0e                	je     0x412d4b
  412d3d:	83 c0 34             	add    eax,0x34
  412d40:	41                   	inc    ecx
  412d41:	39 0d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,ecx
  412d47:	7f f0                	jg     0x412d39
  412d49:	eb 30                	jmp    0x412d7b
  412d4b:	89 0d ac 13 5f 00    	mov    DWORD PTR ds:0x5f13ac,ecx
  412d51:	eb 32                	jmp    0x412d85
  412d53:	33 c0                	xor    eax,eax
  412d55:	39 05 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,eax
  412d5b:	7e 1e                	jle    0x412d7b
  412d5d:	8b 0d bc 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13bc
  412d63:	83 c1 28             	add    ecx,0x28
  412d66:	83 39 19             	cmp    DWORD PTR [ecx],0x19
  412d69:	0f 84 9b 00 00 00    	je     0x412e0a
  412d6f:	83 c1 34             	add    ecx,0x34
  412d72:	40                   	inc    eax
  412d73:	39 05 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,eax
  412d79:	7f eb                	jg     0x412d66
  412d7b:	c7 05 ac 13 5f 00 00 	mov    DWORD PTR ds:0x5f13ac,0x0
  412d82:	00 00 00
  412d85:	8b 0d ac 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13ac
  412d8b:	a1 bc 13 5f 00       	mov    eax,ds:0x5f13bc
  412d90:	8d 14 49             	lea    edx,[ecx+ecx*2]
  412d93:	8d 0c 91             	lea    ecx,[ecx+edx*4]
  412d96:	8b 4c 88 28          	mov    ecx,DWORD PTR [eax+ecx*4+0x28]
  412d9a:	8d 04 89             	lea    eax,[ecx+ecx*4]
  412d9d:	8d 0c c1             	lea    ecx,[ecx+eax*8]
  412da0:	80 0c 8d 65 a3 89 00 	or     BYTE PTR [ecx*4+0x89a365],0x4
  412da7:	04
  412da8:	6a 10                	push   0x10
  412daa:	e8 91 bf 06 00       	call   0x47ed40
  412daf:	83 c4 04             	add    esp,0x4
  412db2:	85 c0                	test   eax,eax
  412db4:	74 15                	je     0x412dcb
  412db6:	6a 11                	push   0x11
  412db8:	e8 83 bf 06 00       	call   0x47ed40
  412dbd:	83 c4 04             	add    esp,0x4
  412dc0:	85 c0                	test   eax,eax
  412dc2:	74 07                	je     0x412dcb
  412dc4:	80 0d 35 b0 89 00 04 	or     BYTE PTR ds:0x89b035,0x4
  412dcb:	6a 12                	push   0x12
  412dcd:	e8 6e bf 06 00       	call   0x47ed40
  412dd2:	83 c4 04             	add    esp,0x4
  412dd5:	85 c0                	test   eax,eax
  412dd7:	74 15                	je     0x412dee
  412dd9:	6a 13                	push   0x13
  412ddb:	e8 60 bf 06 00       	call   0x47ed40
  412de0:	83 c4 04             	add    esp,0x4
  412de3:	85 c0                	test   eax,eax
  412de5:	74 07                	je     0x412dee
  412de7:	80 0d d9 b0 89 00 04 	or     BYTE PTR ds:0x89b0d9,0x4
  412dee:	c7 05 f4 c9 5f 00 00 	mov    DWORD PTR ds:0x5fc9f4,0x0
  412df5:	00 00 00
  412df8:	6a 0a                	push   0xa
  412dfa:	e8 61 fc 02 00       	call   0x442a60
  412dff:	83 c4 04             	add    esp,0x4
  412e02:	5d                   	pop    ebp
  412e03:	5f                   	pop    edi
  412e04:	5e                   	pop    esi
  412e05:	5b                   	pop    ebx
  412e06:	83 c4 08             	add    esp,0x8
  412e09:	c3                   	ret
  412e0a:	a3 ac 13 5f 00       	mov    ds:0x5f13ac,eax
  412e0f:	e9 71 ff ff ff       	jmp    0x412d85
