
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

005239f0 <.text+0x1229f0>:
  5239f0:	83 ec 0c             	sub    esp,0xc
  5239f3:	0f bf 0d 26 f0 88 00 	movsx  ecx,WORD PTR ds:0x88f026
  5239fa:	0f bf 05 2a f0 88 00 	movsx  eax,WORD PTR ds:0x88f02a
  523a01:	89 4c 24 08          	mov    DWORD PTR [esp+0x8],ecx
  523a05:	53                   	push   ebx
  523a06:	f6 05 64 c6 89 00 06 	test   BYTE PTR ds:0x89c664,0x6
  523a0d:	89 44 24 08          	mov    DWORD PTR [esp+0x8],eax
  523a11:	56                   	push   esi
  523a12:	57                   	push   edi
  523a13:	55                   	push   ebp
  523a14:	0f bf 1d 2c f0 88 00 	movsx  ebx,WORD PTR ds:0x88f02c
  523a1b:	0f bf 3d 28 f0 88 00 	movsx  edi,WORD PTR ds:0x88f028
  523a22:	0f 84 ba 01 00 00    	je     0x523be2
  523a28:	f6 05 69 c6 89 00 20 	test   BYTE PTR ds:0x89c669,0x20
  523a2f:	0f 85 ad 01 00 00    	jne    0x523be2
  523a35:	f6 05 46 f7 98 00 04 	test   BYTE PTR ds:0x98f746,0x4
  523a3c:	0f 85 a0 01 00 00    	jne    0x523be2
  523a42:	80 3d 8b 79 89 00 00 	cmp    BYTE PTR ds:0x89798b,0x0
  523a49:	0f 84 93 01 00 00    	je     0x523be2
  523a4f:	e8 bc f7 f6 ff       	call   0x493210
  523a54:	85 c0                	test   eax,eax
  523a56:	74 19                	je     0x523a71
  523a58:	33 c0                	xor    eax,eax
  523a5a:	a0 dd 28 89 00       	mov    al,ds:0x8928dd
  523a5f:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  523a66:	51                   	push   ecx
  523a67:	e8 d4 e0 f2 ff       	call   0x451b40
  523a6c:	83 c4 04             	add    esp,0x4
  523a6f:	eb 1c                	jmp    0x523a8d
  523a71:	33 c0                	xor    eax,eax
  523a73:	a0 dd 28 89 00       	mov    al,ds:0x8928dd
  523a78:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  523a7f:	51                   	push   ecx
  523a80:	68 88 16 59 00       	push   0x591688
  523a85:	e8 a6 32 ff ff       	call   0x516d30
  523a8a:	83 c4 08             	add    esp,0x8
  523a8d:	f6 05 64 c6 89 00 02 	test   BYTE PTR ds:0x89c664,0x2
  523a94:	74 0e                	je     0x523aa4
  523a96:	33 c0                	xor    eax,eax
  523a98:	be f8 00 00 00       	mov    esi,0xf8
  523a9d:	a0 f7 c6 89 00       	mov    al,ds:0x89c6f7
  523aa2:	eb 0c                	jmp    0x523ab0
  523aa4:	33 c0                	xor    eax,eax
  523aa6:	be f9 00 00 00       	mov    esi,0xf9
  523aab:	a0 f6 c6 89 00       	mov    al,ds:0x89c6f6
  523ab0:	bd fa 00 00 00       	mov    ebp,0xfa
  523ab5:	a2 9c 48 98 00       	mov    ds:0x98489c,al
  523aba:	e8 51 f7 f6 ff       	call   0x493210
  523abf:	6a 41                	push   0x41
  523ac1:	85 c0                	test   eax,eax
  523ac3:	74 07                	je     0x523acc
  523ac5:	e8 26 ed f2 ff       	call   0x4527f0
  523aca:	eb 05                	jmp    0x523ad1
  523acc:	e8 6f 40 00 00       	call   0x527b40
  523ad1:	83 c4 04             	add    esp,0x4
  523ad4:	2b d8                	sub    ebx,eax
  523ad6:	8b c3                	mov    eax,ebx
  523ad8:	c1 e3 03             	shl    ebx,0x3
  523adb:	2b d8                	sub    ebx,eax
  523add:	8d 34 b5 a8 2b 97 00 	lea    esi,[esi*4+0x972ba8]
  523ae4:	8b c3                	mov    eax,ebx
  523ae6:	8b 5c 24 14          	mov    ebx,DWORD PTR [esp+0x14]
  523aea:	99                   	cdq
  523aeb:	83 e2 07             	and    edx,0x7
  523aee:	03 c2                	add    eax,edx
  523af0:	c1 f8 03             	sar    eax,0x3
  523af3:	03 f8                	add    edi,eax
  523af5:	8b 06                	mov    eax,DWORD PTR [esi]
  523af7:	50                   	push   eax
  523af8:	e8 33 6b f7 ff       	call   0x49a630
  523afd:	83 c4 04             	add    esp,0x4
  523b00:	2b d8                	sub    ebx,eax
  523b02:	8b c3                	mov    eax,ebx
  523b04:	8b 5c 24 18          	mov    ebx,DWORD PTR [esp+0x18]
  523b08:	99                   	cdq
  523b09:	2b c2                	sub    eax,edx
  523b0b:	c1 f8 01             	sar    eax,0x1
  523b0e:	03 d8                	add    ebx,eax
  523b10:	e8 fb f6 f6 ff       	call   0x493210
  523b15:	85 c0                	test   eax,eax
  523b17:	74 15                	je     0x523b2e
  523b19:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  523b1e:	8b 0e                	mov    ecx,DWORD PTR [esi]
  523b20:	50                   	push   eax
  523b21:	51                   	push   ecx
  523b22:	57                   	push   edi
  523b23:	53                   	push   ebx
  523b24:	e8 77 e0 f2 ff       	call   0x451ba0
  523b29:	83 c4 10             	add    esp,0x10
  523b2c:	eb 23                	jmp    0x523b51
  523b2e:	83 ec 08             	sub    esp,0x8
  523b31:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  523b36:	89 64 24 18          	mov    DWORD PTR [esp+0x18],esp
  523b3a:	50                   	push   eax
  523b3b:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  523b3f:	e8 2c 24 ef ff       	call   0x415f70
  523b44:	8b 06                	mov    eax,DWORD PTR [esi]
  523b46:	50                   	push   eax
  523b47:	57                   	push   edi
  523b48:	53                   	push   ebx
  523b49:	e8 12 3e 00 00       	call   0x527960
  523b4e:	83 c4 14             	add    esp,0x14
  523b51:	85 ed                	test   ebp,ebp
  523b53:	0f 84 89 00 00 00    	je     0x523be2
  523b59:	8d 1c ad a8 2b 97 00 	lea    ebx,[ebp*4+0x972ba8]
  523b60:	8b 74 24 14          	mov    esi,DWORD PTR [esp+0x14]
  523b64:	8b 03                	mov    eax,DWORD PTR [ebx]
  523b66:	50                   	push   eax
  523b67:	e8 c4 6a f7 ff       	call   0x49a630
  523b6c:	83 c4 04             	add    esp,0x4
  523b6f:	2b f0                	sub    esi,eax
  523b71:	8b c6                	mov    eax,esi
  523b73:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  523b77:	99                   	cdq
  523b78:	2b c2                	sub    eax,edx
  523b7a:	c1 f8 01             	sar    eax,0x1
  523b7d:	03 f0                	add    esi,eax
  523b7f:	e8 8c f6 f6 ff       	call   0x493210
  523b84:	6a 41                	push   0x41
  523b86:	85 c0                	test   eax,eax
  523b88:	74 07                	je     0x523b91
  523b8a:	e8 61 ec f2 ff       	call   0x4527f0
  523b8f:	eb 05                	jmp    0x523b96
  523b91:	e8 aa 3f 00 00       	call   0x527b40
  523b96:	83 c4 04             	add    esp,0x4
  523b99:	03 f8                	add    edi,eax
  523b9b:	e8 70 f6 f6 ff       	call   0x493210
  523ba0:	85 c0                	test   eax,eax
  523ba2:	74 1b                	je     0x523bbf
  523ba4:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  523ba9:	8b 0b                	mov    ecx,DWORD PTR [ebx]
  523bab:	50                   	push   eax
  523bac:	51                   	push   ecx
  523bad:	57                   	push   edi
  523bae:	56                   	push   esi
  523baf:	e8 ec df f2 ff       	call   0x451ba0
  523bb4:	83 c4 10             	add    esp,0x10
  523bb7:	5d                   	pop    ebp
  523bb8:	5f                   	pop    edi
  523bb9:	5e                   	pop    esi
  523bba:	5b                   	pop    ebx
  523bbb:	83 c4 0c             	add    esp,0xc
  523bbe:	c3                   	ret
  523bbf:	83 ec 08             	sub    esp,0x8
  523bc2:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  523bc7:	89 64 24 18          	mov    DWORD PTR [esp+0x18],esp
  523bcb:	50                   	push   eax
  523bcc:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  523bd0:	e8 9b 23 ef ff       	call   0x415f70
  523bd5:	8b 03                	mov    eax,DWORD PTR [ebx]
  523bd7:	50                   	push   eax
  523bd8:	57                   	push   edi
  523bd9:	56                   	push   esi
  523bda:	e8 81 3d 00 00       	call   0x527960
  523bdf:	83 c4 14             	add    esp,0x14
  523be2:	5d                   	pop    ebp
  523be3:	5f                   	pop    edi
  523be4:	5e                   	pop    esi
  523be5:	5b                   	pop    ebx
  523be6:	83 c4 0c             	add    esp,0xc
  523be9:	c3                   	ret
