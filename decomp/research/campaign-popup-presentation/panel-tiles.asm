
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00523d40 <.text+0x122d40>:
  523d40:	83 ec 28             	sub    esp,0x28
  523d43:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  523d48:	33 c9                	xor    ecx,ecx
  523d4a:	53                   	push   ebx
  523d4b:	66 8b 88 b4 2d 00 00 	mov    cx,WORD PTR [eax+0x2db4]
  523d52:	56                   	push   esi
  523d53:	89 4c 24 18          	mov    DWORD PTR [esp+0x18],ecx
  523d57:	57                   	push   edi
  523d58:	55                   	push   ebp
  523d59:	33 c9                	xor    ecx,ecx
  523d5b:	66 8b 88 b6 2d 00 00 	mov    cx,WORD PTR [eax+0x2db6]
  523d62:	0f bf 44 24 44       	movsx  eax,WORD PTR [esp+0x44]
  523d67:	89 4c 24 1c          	mov    DWORD PTR [esp+0x1c],ecx
  523d6b:	89 44 24 30          	mov    DWORD PTR [esp+0x30],eax
  523d6f:	83 0d 74 a0 5d 00 08 	or     DWORD PTR ds:0x5da074,0x8
  523d76:	0f bf 4c 24 3c       	movsx  ecx,WORD PTR [esp+0x3c]
  523d7b:	48                   	dec    eax
  523d7c:	89 4c 24 18          	mov    DWORD PTR [esp+0x18],ecx
  523d80:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  523d84:	89 44 24 24          	mov    DWORD PTR [esp+0x24],eax
  523d88:	0f af c8             	imul   ecx,eax
  523d8b:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  523d8f:	03 c1                	add    eax,ecx
  523d91:	0f bf 74 24 40       	movsx  esi,WORD PTR [esp+0x40]
  523d96:	0f bf 4c 24 48       	movsx  ecx,WORD PTR [esp+0x48]
  523d9b:	89 44 24 2c          	mov    DWORD PTR [esp+0x2c],eax
  523d9f:	89 4c 24 10          	mov    DWORD PTR [esp+0x10],ecx
  523da3:	49                   	dec    ecx
  523da4:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  523da8:	0f af c1             	imul   eax,ecx
  523dab:	03 c6                	add    eax,esi
  523dad:	89 4c 24 28          	mov    DWORD PTR [esp+0x28],ecx
  523db1:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  523db5:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  523db9:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  523dbe:	05 50 2d 00 00       	add    eax,0x2d50
  523dc3:	50                   	push   eax
  523dc4:	56                   	push   esi
  523dc5:	51                   	push   ecx
  523dc6:	e8 15 25 ff ff       	call   0x5162e0
  523dcb:	8b 4c 24 38          	mov    ecx,DWORD PTR [esp+0x38]
  523dcf:	83 c4 0c             	add    esp,0xc
  523dd2:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  523dd7:	05 58 2d 00 00       	add    eax,0x2d58
  523ddc:	50                   	push   eax
  523ddd:	56                   	push   esi
  523dde:	51                   	push   ecx
  523ddf:	e8 fc 24 ff ff       	call   0x5162e0
  523de4:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  523de8:	8b 54 24 24          	mov    edx,DWORD PTR [esp+0x24]
  523dec:	83 c4 0c             	add    esp,0xc
  523def:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  523df4:	05 60 2d 00 00       	add    eax,0x2d60
  523df9:	50                   	push   eax
  523dfa:	51                   	push   ecx
  523dfb:	52                   	push   edx
  523dfc:	e8 df 24 ff ff       	call   0x5162e0
  523e01:	83 c4 0c             	add    esp,0xc
  523e04:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  523e09:	05 68 2d 00 00       	add    eax,0x2d68
  523e0e:	50                   	push   eax
  523e0f:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  523e13:	8b 54 24 30          	mov    edx,DWORD PTR [esp+0x30]
  523e17:	51                   	push   ecx
  523e18:	bb 01 00 00 00       	mov    ebx,0x1
  523e1d:	52                   	push   edx
  523e1e:	e8 bd 24 ff ff       	call   0x5162e0
  523e23:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  523e27:	03 44 24 2c          	add    eax,DWORD PTR [esp+0x2c]
  523e2b:	83 c4 0c             	add    esp,0xc
  523e2e:	8b f8                	mov    edi,eax
  523e30:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  523e34:	39 5c 24 24          	cmp    DWORD PTR [esp+0x24],ebx
  523e38:	7e 52                	jle    0x523e8c
  523e3a:	8b eb                	mov    ebp,ebx
  523e3c:	b8 af 05 00 00       	mov    eax,0x5af
  523e41:	83 e5 01             	and    ebp,0x1
  523e44:	83 fd 01             	cmp    ebp,0x1
  523e47:	83 d0 ff             	adc    eax,0xffffffff
  523e4a:	c1 e0 03             	shl    eax,0x3
  523e4d:	03 05 14 df 59 00    	add    eax,DWORD PTR ds:0x59df14
  523e53:	50                   	push   eax
  523e54:	56                   	push   esi
  523e55:	57                   	push   edi
  523e56:	e8 85 24 ff ff       	call   0x5162e0
  523e5b:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  523e5f:	83 c4 0c             	add    esp,0xc
  523e62:	b8 b1 05 00 00       	mov    eax,0x5b1
  523e67:	83 fd 01             	cmp    ebp,0x1
  523e6a:	83 d0 ff             	adc    eax,0xffffffff
  523e6d:	43                   	inc    ebx
  523e6e:	c1 e0 03             	shl    eax,0x3
  523e71:	03 05 14 df 59 00    	add    eax,DWORD PTR ds:0x59df14
  523e77:	50                   	push   eax
  523e78:	51                   	push   ecx
  523e79:	57                   	push   edi
  523e7a:	e8 61 24 ff ff       	call   0x5162e0
  523e7f:	03 7c 24 2c          	add    edi,DWORD PTR [esp+0x2c]
  523e83:	83 c4 0c             	add    esp,0xc
  523e86:	3b 5c 24 24          	cmp    ebx,DWORD PTR [esp+0x24]
  523e8a:	7c ae                	jl     0x523e3a
  523e8c:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  523e90:	03 c6                	add    eax,esi
  523e92:	8b e8                	mov    ebp,eax
  523e94:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  523e98:	83 7c 24 28 01       	cmp    DWORD PTR [esp+0x28],0x1
  523e9d:	7e 5d                	jle    0x523efc
  523e9f:	83 e3 01             	and    ebx,0x1
  523ea2:	bf b3 05 00 00       	mov    edi,0x5b3
  523ea7:	8b 74 24 28          	mov    esi,DWORD PTR [esp+0x28]
  523eab:	83 fb 01             	cmp    ebx,0x1
  523eae:	83 d7 ff             	adc    edi,0xffffffff
  523eb1:	83 fb 01             	cmp    ebx,0x1
  523eb4:	bb b5 05 00 00       	mov    ebx,0x5b5
  523eb9:	83 d3 ff             	adc    ebx,0xffffffff
  523ebc:	4e                   	dec    esi
  523ebd:	8d 04 fd 00 00 00 00 	lea    eax,[edi*8+0x0]
  523ec4:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  523ec8:	03 05 14 df 59 00    	add    eax,DWORD PTR ds:0x59df14
  523ece:	50                   	push   eax
  523ecf:	55                   	push   ebp
  523ed0:	51                   	push   ecx
  523ed1:	e8 0a 24 ff ff       	call   0x5162e0
  523ed6:	8b 4c 24 38          	mov    ecx,DWORD PTR [esp+0x38]
  523eda:	83 c4 0c             	add    esp,0xc
  523edd:	8d 04 dd 00 00 00 00 	lea    eax,[ebx*8+0x0]
  523ee4:	03 05 14 df 59 00    	add    eax,DWORD PTR ds:0x59df14
  523eea:	50                   	push   eax
  523eeb:	55                   	push   ebp
  523eec:	51                   	push   ecx
  523eed:	e8 ee 23 ff ff       	call   0x5162e0
  523ef2:	03 6c 24 28          	add    ebp,DWORD PTR [esp+0x28]
  523ef6:	83 c4 0c             	add    esp,0xc
  523ef9:	4e                   	dec    esi
  523efa:	75 c1                	jne    0x523ebd
  523efc:	8b 54 24 10          	mov    edx,DWORD PTR [esp+0x10]
  523f00:	8b 4c 24 30          	mov    ecx,DWORD PTR [esp+0x30]
  523f04:	83 ea 02             	sub    edx,0x2
  523f07:	83 e9 02             	sub    ecx,0x2
  523f0a:	6a 0c                	push   0xc
  523f0c:	a1 74 a0 5d 00       	mov    eax,ds:0x5da074
  523f11:	89 54 24 14          	mov    DWORD PTR [esp+0x14],edx
  523f15:	50                   	push   eax
  523f16:	db 44 24 18          	fild   DWORD PTR [esp+0x18]
  523f1a:	89 4c 24 18          	mov    DWORD PTR [esp+0x18],ecx
  523f1e:	68 b6 05 00 00       	push   0x5b6
  523f23:	8b 44 24 28          	mov    eax,DWORD PTR [esp+0x28]
  523f27:	68 e8 10 99 00       	push   0x9910e8
  523f2c:	0f af c2             	imul   eax,edx
  523f2f:	83 ec 04             	sub    esp,0x4
  523f32:	83 ec 04             	sub    esp,0x4
  523f35:	83 ec 04             	sub    esp,0x4
  523f38:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  523f3c:	db 44 24 2c          	fild   DWORD PTR [esp+0x2c]
  523f40:	89 44 24 2c          	mov    DWORD PTR [esp+0x2c],eax
  523f44:	8b 44 24 3c          	mov    eax,DWORD PTR [esp+0x3c]
  523f48:	83 ec 04             	sub    esp,0x4
  523f4b:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  523f4f:	db 44 24 30          	fild   DWORD PTR [esp+0x30]
  523f53:	0f af c1             	imul   eax,ecx
  523f56:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  523f5a:	89 44 24 30          	mov    DWORD PTR [esp+0x30],eax
  523f5e:	83 ec 04             	sub    esp,0x4
  523f61:	83 ec 04             	sub    esp,0x4
  523f64:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  523f6a:	db 44 24 38          	fild   DWORD PTR [esp+0x38]
  523f6e:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  523f72:	db 44 24 3c          	fild   DWORD PTR [esp+0x3c]
  523f76:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  523f7a:	db 44 24 5c          	fild   DWORD PTR [esp+0x5c]
  523f7e:	d9 1c 24             	fstp   DWORD PTR [esp]
  523f81:	e8 4a a0 f5 ff       	call   0x47dfd0
  523f86:	83 25 74 a0 5d 00 f7 	and    DWORD PTR ds:0x5da074,0xfffffff7
  523f8d:	5d                   	pop    ebp
  523f8e:	5f                   	pop    edi
  523f8f:	5e                   	pop    esi
  523f90:	5b                   	pop    ebx
  523f91:	83 c4 28             	add    esp,0x28
  523f94:	c3                   	ret
