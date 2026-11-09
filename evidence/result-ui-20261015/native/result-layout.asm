
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0042b920 <.text+0x2a920>:
  42b920:	84 d1                	test   cl,dl
  42b922:	89 00                	mov    DWORD PTR [eax],eax
  42b924:	e8 07 f3 04 00       	call   0x47ac30
  42b929:	5f                   	pop    edi
  42b92a:	c3                   	ret
  42b92b:	cc                   	int3
  42b92c:	cc                   	int3
  42b92d:	cc                   	int3
  42b92e:	cc                   	int3
  42b92f:	cc                   	int3
  42b930:	c3                   	ret
  42b931:	cc                   	int3
  42b932:	cc                   	int3
  42b933:	cc                   	int3
  42b934:	cc                   	int3
  42b935:	cc                   	int3
  42b936:	cc                   	int3
  42b937:	cc                   	int3
  42b938:	cc                   	int3
  42b939:	cc                   	int3
  42b93a:	cc                   	int3
  42b93b:	cc                   	int3
  42b93c:	cc                   	int3
  42b93d:	cc                   	int3
  42b93e:	cc                   	int3
  42b93f:	cc                   	int3
  42b940:	83 ec 28             	sub    esp,0x28
  42b943:	b8 01 00 00 00       	mov    eax,0x1
  42b948:	66 81 3d d1 c6 89 00 	cmp    WORD PTR ds:0x89c6d1,0xdc
  42b94f:	dc 00 
  42b951:	53                   	push   ebx
  42b952:	56                   	push   esi
  42b953:	57                   	push   edi
  42b954:	55                   	push   ebp
  42b955:	7e 02                	jle    0x42b959
  42b957:	33 c0                	xor    eax,eax
  42b959:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  42b95d:	e8 ae 78 06 00       	call   0x493210
  42b962:	85 c0                	test   eax,eax
  42b964:	74 19                	je     0x42b97f
  42b966:	33 c0                	xor    eax,eax
  42b968:	a0 de 28 89 00       	mov    al,ds:0x8928de
  42b96d:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  42b974:	51                   	push   ecx
  42b975:	e8 c6 61 02 00       	call   0x451b40
  42b97a:	83 c4 04             	add    esp,0x4
  42b97d:	eb 1c                	jmp    0x42b99b
  42b97f:	33 c0                	xor    eax,eax
  42b981:	a0 de 28 89 00       	mov    al,ds:0x8928de
  42b986:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  42b98d:	51                   	push   ecx
  42b98e:	68 98 16 59 00       	push   0x591698
  42b993:	e8 98 b3 0e 00       	call   0x516d30
  42b998:	83 c4 08             	add    esp,0x8
  42b99b:	bf 30 dd 5a 00       	mov    edi,0x5add30
  42b9a0:	33 db                	xor    ebx,ebx
  42b9a2:	33 f6                	xor    esi,esi
  42b9a4:	33 ed                	xor    ebp,ebp
  42b9a6:	66 39 1d 30 dd 5a 00 	cmp    WORD PTR ds:0x5add30,bx
  42b9ad:	74 2a                	je     0x42b9d9
  42b9af:	0f bf 07             	movsx  eax,WORD PTR [edi]
  42b9b2:	8b 0c 85 a8 2b 97 00 	mov    ecx,DWORD PTR [eax*4+0x972ba8]
  42b9b9:	51                   	push   ecx
  42b9ba:	e8 71 ec 06 00       	call   0x49a630
  42b9bf:	83 c4 04             	add    esp,0x4
  42b9c2:	3b c3                	cmp    eax,ebx
  42b9c4:	7e 02                	jle    0x42b9c8
  42b9c6:	8b d8                	mov    ebx,eax
  42b9c8:	80 7f 03 00          	cmp    BYTE PTR [edi+0x3],0x0
  42b9cc:	74 01                	je     0x42b9cf
  42b9ce:	45                   	inc    ebp
  42b9cf:	83 c7 04             	add    edi,0x4
  42b9d2:	46                   	inc    esi
  42b9d3:	66 83 3f 00          	cmp    WORD PTR [edi],0x0
  42b9d7:	75 d6                	jne    0x42b9af
  42b9d9:	83 c6 04             	add    esi,0x4
  42b9dc:	e8 2f 78 06 00       	call   0x493210
  42b9e1:	85 c0                	test   eax,eax
  42b9e3:	74 4e                	je     0x42ba33
  42b9e5:	68 1c c9 59 00       	push   0x59c91c
  42b9ea:	e8 a1 7d 02 00       	call   0x453790
  42b9ef:	83 c4 04             	add    esp,0x4
  42b9f2:	68 04 c9 59 00       	push   0x59c904
  42b9f7:	e8 94 7d 02 00       	call   0x453790
  42b9fc:	83 c4 04             	add    esp,0x4
  42b9ff:	e8 0c 78 06 00       	call   0x493210
  42ba04:	6a 41                	push   0x41
  42ba06:	85 c0                	test   eax,eax
  42ba08:	74 07                	je     0x42ba11
  42ba0a:	e8 c1 6d 02 00       	call   0x4527d0
  42ba0f:	eb 05                	jmp    0x42ba16
  42ba11:	e8 fa c0 0f 00       	call   0x527b10
  42ba16:	83 c4 04             	add    esp,0x4
  42ba19:	68 1c c9 59 00       	push   0x59c91c
  42ba1e:	e8 0d ec 06 00       	call   0x49a630
  42ba23:	83 c4 04             	add    esp,0x4
  42ba26:	03 d8                	add    ebx,eax
  42ba28:	89 5c 24 2c          	mov    DWORD PTR [esp+0x2c],ebx
  42ba2c:	68 04 c9 59 00       	push   0x59c904
  42ba31:	eb 32                	jmp    0x42ba65
  42ba33:	e8 d8 77 06 00       	call   0x493210
  42ba38:	6a 41                	push   0x41
  42ba3a:	85 c0                	test   eax,eax
  42ba3c:	74 07                	je     0x42ba45
  42ba3e:	e8 8d 6d 02 00       	call   0x4527d0
  42ba43:	eb 05                	jmp    0x42ba4a
  42ba45:	e8 c6 c0 0f 00       	call   0x527b10
  42ba4a:	83 c4 04             	add    esp,0x4
  42ba4d:	68 1c c9 59 00       	push   0x59c91c
  42ba52:	e8 d9 eb 06 00       	call   0x49a630
  42ba57:	83 c4 04             	add    esp,0x4
  42ba5a:	03 d8                	add    ebx,eax
  42ba5c:	89 5c 24 2c          	mov    DWORD PTR [esp+0x2c],ebx
  42ba60:	68 ec c8 59 00       	push   0x59c8ec
  42ba65:	e8 c6 eb 06 00       	call   0x49a630
  42ba6a:	03 44 24 30          	add    eax,DWORD PTR [esp+0x30]
  42ba6e:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  42ba72:	83 c4 04             	add    esp,0x4
  42ba75:	e8 96 77 06 00       	call   0x493210
  42ba7a:	6a 41                	push   0x41
  42ba7c:	85 c0                	test   eax,eax
  42ba7e:	74 07                	je     0x42ba87
  42ba80:	e8 4b 6d 02 00       	call   0x4527d0
  42ba85:	eb 05                	jmp    0x42ba8c
  42ba87:	e8 84 c0 0f 00       	call   0x527b10
  42ba8c:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  42ba90:	83 c4 04             	add    esp,0x4
  42ba93:	83 7c 24 10 00       	cmp    DWORD PTR [esp+0x10],0x0
  42ba98:	74 31                	je     0x42bacb
  42ba9a:	e8 71 77 06 00       	call   0x493210
  42ba9f:	6a 41                	push   0x41
  42baa1:	85 c0                	test   eax,eax
  42baa3:	74 13                	je     0x42bab8
  42baa5:	e8 26 6d 02 00       	call   0x4527d0
  42baaa:	99                   	cdq
  42baab:	83 c4 04             	add    esp,0x4
  42baae:	2b c2                	sub    eax,edx
  42bab0:	c1 f8 01             	sar    eax,0x1
  42bab3:	83 c0 02             	add    eax,0x2
  42bab6:	eb 33                	jmp    0x42baeb
  42bab8:	e8 53 c0 0f 00       	call   0x527b10
  42babd:	99                   	cdq
  42babe:	83 c4 04             	add    esp,0x4
  42bac1:	2b c2                	sub    eax,edx
  42bac3:	c1 f8 01             	sar    eax,0x1
  42bac6:	83 c0 02             	add    eax,0x2
  42bac9:	eb 20                	jmp    0x42baeb
  42bacb:	e8 40 77 06 00       	call   0x493210
  42bad0:	6a 41                	push   0x41
  42bad2:	85 c0                	test   eax,eax
  42bad4:	74 07                	je     0x42badd
  42bad6:	e8 f5 6c 02 00       	call   0x4527d0
  42badb:	eb 05                	jmp    0x42bae2
  42badd:	e8 2e c0 0f 00       	call   0x527b10
  42bae2:	99                   	cdq
  42bae3:	83 c4 04             	add    esp,0x4
  42bae6:	2b c2                	sub    eax,edx
  42bae8:	c1 f8 01             	sar    eax,0x1
  42baeb:	33 c9                	xor    ecx,ecx
  42baed:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  42baf1:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  42baf6:	66 8b 88 26 20 00 00 	mov    cx,WORD PTR [eax+0x2026]
  42bafd:	89 4c 24 34          	mov    DWORD PTR [esp+0x34],ecx
  42bb01:	33 c9                	xor    ecx,ecx
  42bb03:	66 8b 88 24 20 00 00 	mov    cx,WORD PTR [eax+0x2024]
  42bb0a:	33 ff                	xor    edi,edi
  42bb0c:	8b 44 24 30          	mov    eax,DWORD PTR [esp+0x30]
  42bb10:	8d 14 89             	lea    edx,[ecx+ecx*4]
  42bb13:	8d 0c 82             	lea    ecx,[edx+eax*4]
  42bb16:	8b 15 14 df 59 00    	mov    edx,DWORD PTR ds:0x59df14
  42bb1c:	66 8b ba b4 2d 00 00 	mov    di,WORD PTR [edx+0x2db4]
  42bb23:	89 4c 24 20          	mov    DWORD PTR [esp+0x20],ecx
  42bb27:	33 c9                	xor    ecx,ecx
  42bb29:	83 7c 24 10 00       	cmp    DWORD PTR [esp+0x10],0x0
  42bb2e:	66 8b 8a b6 2d 00 00 	mov    cx,WORD PTR [edx+0x2db6]
  42bb35:	89 4c 24 14          	mov    DWORD PTR [esp+0x14],ecx
  42bb39:	74 0d                	je     0x42bb48
  42bb3b:	8b c1                	mov    eax,ecx
  42bb3d:	99                   	cdq
  42bb3e:	83 e2 03             	and    edx,0x3
  42bb41:	03 c2                	add    eax,edx
  42bb43:	c1 f8 02             	sar    eax,0x2
  42bb46:	eb 0a                	jmp    0x42bb52
  42bb48:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  42bb4c:	99                   	cdq
  42bb4d:	2b c2                	sub    eax,edx
  42bb4f:	c1 f8 01             	sar    eax,0x1
  42bb52:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  42bb56:	e8 b5 76 06 00       	call   0x493210
  42bb5b:	85 c0                	test   eax,eax
  42bb5d:	74 2b                	je     0x42bb8a
  42bb5f:	e8 ac 76 06 00       	call   0x493210
  42bb64:	6a 41                	push   0x41
  42bb66:	85 c0                	test   eax,eax
  42bb68:	74 10                	je     0x42bb7a
  42bb6a:	e8 81 6c 02 00       	call   0x4527f0
  42bb6f:	83 c4 04             	add    esp,0x4
  42bb72:	8d 58 01             	lea    ebx,[eax+0x1]
  42bb75:	e9 97 00 00 00       	jmp    0x42bc11
  42bb7a:	e8 c1 bf 0f 00       	call   0x527b40
  42bb7f:	83 c4 04             	add    esp,0x4
  42bb82:	8d 58 01             	lea    ebx,[eax+0x1]
  42bb85:	e9 87 00 00 00       	jmp    0x42bc11
  42bb8a:	83 7c 24 10 00       	cmp    DWORD PTR [esp+0x10],0x0
  42bb8f:	74 57                	je     0x42bbe8
  42bb91:	e8 7a 76 06 00       	call   0x493210
  42bb96:	6a 41                	push   0x41
  42bb98:	85 c0                	test   eax,eax
  42bb9a:	74 26                	je     0x42bbc2
  42bb9c:	e8 4f 6c 02 00       	call   0x4527f0
  42bba1:	83 c4 04             	add    esp,0x4
  42bba4:	8d 0c c5 00 00 00 00 	lea    ecx,[eax*8+0x0]
  42bbab:	2b c8                	sub    ecx,eax
  42bbad:	8d 04 4d 00 00 00 00 	lea    eax,[ecx*2+0x0]
  42bbb4:	99                   	cdq
  42bbb5:	83 e2 0f             	and    edx,0xf
  42bbb8:	03 c2                	add    eax,edx
  42bbba:	c1 f8 04             	sar    eax,0x4
  42bbbd:	8d 58 01             	lea    ebx,[eax+0x1]
  42bbc0:	eb 4f                	jmp    0x42bc11
  42bbc2:	e8 79 bf 0f 00       	call   0x527b40
  42bbc7:	83 c4 04             	add    esp,0x4
  42bbca:	8d 0c c5 00 00 00 00 	lea    ecx,[eax*8+0x0]
  42bbd1:	2b c8                	sub    ecx,eax
  42bbd3:	8d 04 4d 00 00 00 00 	lea    eax,[ecx*2+0x0]
  42bbda:	99                   	cdq
  42bbdb:	83 e2 0f             	and    edx,0xf
  42bbde:	03 c2                	add    eax,edx
  42bbe0:	c1 f8 04             	sar    eax,0x4
  42bbe3:	8d 58 01             	lea    ebx,[eax+0x1]
  42bbe6:	eb 29                	jmp    0x42bc11
  42bbe8:	e8 23 76 06 00       	call   0x493210
  42bbed:	6a 41                	push   0x41
  42bbef:	85 c0                	test   eax,eax
  42bbf1:	74 07                	je     0x42bbfa
  42bbf3:	e8 f8 6b 02 00       	call   0x4527f0
  42bbf8:	eb 05                	jmp    0x42bbff
  42bbfa:	e8 41 bf 0f 00       	call   0x527b40
  42bbff:	c1 e0 04             	shl    eax,0x4
  42bc02:	83 c4 04             	add    esp,0x4
  42bc05:	99                   	cdq
  42bc06:	83 e2 0f             	and    edx,0xf
  42bc09:	03 c2                	add    eax,edx
  42bc0b:	c1 f8 04             	sar    eax,0x4
  42bc0e:	8d 58 ff             	lea    ebx,[eax-0x1]
  42bc11:	83 7c 24 10 00       	cmp    DWORD PTR [esp+0x10],0x0
  42bc16:	74 0a                	je     0x42bc22
  42bc18:	c7 44 24 24 03 00 00 	mov    DWORD PTR [esp+0x24],0x3
  42bc1f:	00 
  42bc20:	eb 2d                	jmp    0x42bc4f
  42bc22:	e8 e9 75 06 00       	call   0x493210
  42bc27:	6a 41                	push   0x41
  42bc29:	85 c0                	test   eax,eax
  42bc2b:	74 07                	je     0x42bc34
  42bc2d:	e8 be 6b 02 00       	call   0x4527f0
  42bc32:	eb 05                	jmp    0x42bc39
  42bc34:	e8 07 bf 0f 00       	call   0x527b40
  42bc39:	83 c4 04             	add    esp,0x4
  42bc3c:	8d 04 80             	lea    eax,[eax+eax*4]
  42bc3f:	99                   	cdq
  42bc40:	83 e2 0f             	and    edx,0xf
  42bc43:	03 c2                	add    eax,edx
  42bc45:	c1 f8 04             	sar    eax,0x4
  42bc48:	83 c0 02             	add    eax,0x2
  42bc4b:	89 44 24 24          	mov    DWORD PTR [esp+0x24],eax
  42bc4f:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  42bc53:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  42bc57:	3b c1                	cmp    eax,ecx
  42bc59:	7f 02                	jg     0x42bc5d
  42bc5b:	8b c1                	mov    eax,ecx
  42bc5d:	0f af 6c 24 24       	imul   ebp,DWORD PTR [esp+0x24]
  42bc62:	0f af f3             	imul   esi,ebx
  42bc65:	8d 0c 78             	lea    ecx,[eax+edi*2]
  42bc68:	8b c3                	mov    eax,ebx
  42bc6a:	99                   	cdq
  42bc6b:	2b c2                	sub    eax,edx
  42bc6d:	89 4c 24 10          	mov    DWORD PTR [esp+0x10],ecx
  42bc71:	c1 f8 01             	sar    eax,0x1
  42bc74:	8b 4c 24 28          	mov    ecx,DWORD PTR [esp+0x28]
  42bc78:	03 4c 24 18          	add    ecx,DWORD PTR [esp+0x18]
  42bc7c:	8d 4c 4d 00          	lea    ecx,[ebp+ecx*2+0x0]
  42bc80:	03 ce                	add    ecx,esi
  42bc82:	8b 74 24 34          	mov    esi,DWORD PTR [esp+0x34]
  42bc86:	03 c8                	add    ecx,eax
  42bc88:	03 f1                	add    esi,ecx
  42bc8a:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  42bc8e:	8d 44 0f ff          	lea    eax,[edi+ecx*1-0x1]
  42bc92:	99                   	cdq
  42bc93:	f7 ff                	idiv   edi
  42bc95:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  42bc99:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  42bc9d:	8d 44 30 ff          	lea    eax,[eax+esi*1-0x1]
  42bca1:	99                   	cdq
  42bca2:	f7 7c 24 14          	idiv   DWORD PTR [esp+0x14]
  42bca6:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  42bcaa:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  42bcae:	66 89 0d f7 26 89 00 	mov    WORD PTR ds:0x8926f7,cx
  42bcb5:	8b 6c 24 20          	mov    ebp,DWORD PTR [esp+0x20]
  42bcb9:	0f af c7             	imul   eax,edi
  42bcbc:	0f af 6c 24 14       	imul   ebp,DWORD PTR [esp+0x14]
  42bcc1:	66 a3 f3 26 89 00    	mov    ds:0x8926f3,ax
  42bcc7:	2b c1                	sub    eax,ecx
  42bcc9:	99                   	cdq
  42bcca:	66 89 2d f5 26 89 00 	mov    WORD PTR ds:0x8926f5,bp
  42bcd1:	2b c2                	sub    eax,edx
  42bcd3:	c1 f8 01             	sar    eax,0x1
  42bcd6:	66 89 35 f9 26 89 00 	mov    WORD PTR ds:0x8926f9,si
  42bcdd:	66 a3 fb 26 89 00    	mov    ds:0x8926fb,ax
  42bce3:	8b c5                	mov    eax,ebp
  42bce5:	66 8b 4c 24 28       	mov    cx,WORD PTR [esp+0x28]
  42bcea:	2b c6                	sub    eax,esi
  42bcec:	99                   	cdq
  42bced:	66 89 3d 03 27 89 00 	mov    WORD PTR ds:0x892703,di
  42bcf4:	2b c2                	sub    eax,edx
  42bcf6:	c1 f8 01             	sar    eax,0x1
  42bcf9:	66 a3 fd 26 89 00    	mov    ds:0x8926fd,ax
  42bcff:	66 8b 44 24 24       	mov    ax,WORD PTR [esp+0x24]
  42bd04:	66 89 0d 05 27 89 00 	mov    WORD PTR ds:0x892705,cx
  42bd0b:	8a 4c 24 1c          	mov    cl,BYTE PTR [esp+0x1c]
  42bd0f:	66 89 3d ff 26 89 00 	mov    WORD PTR ds:0x8926ff,di
  42bd16:	8a 54 24 20          	mov    dl,BYTE PTR [esp+0x20]
  42bd1a:	66 03 7c 24 2c       	add    di,WORD PTR [esp+0x2c]
  42bd1f:	88 0d 0d 27 89 00    	mov    BYTE PTR ds:0x89270d,cl
  42bd25:	66 89 3d 01 27 89 00 	mov    WORD PTR ds:0x892701,di
  42bd2c:	88 15 0e 27 89 00    	mov    BYTE PTR ds:0x89270e,dl
  42bd32:	66 89 1d 07 27 89 00 	mov    WORD PTR ds:0x892707,bx
  42bd39:	66 a3 09 27 89 00    	mov    ds:0x892709,ax
  42bd3f:	33 c0                	xor    eax,eax
  42bd41:	66 a3 0b 27 89 00    	mov    ds:0x89270b,ax
  42bd47:	a2 0f 27 89 00       	mov    ds:0x89270f,al
  42bd4c:	8a 4c 24 30          	mov    cl,BYTE PTR [esp+0x30]
  42bd50:	8a 54 24 18          	mov    dl,BYTE PTR [esp+0x18]
  42bd54:	88 0d 10 27 89 00    	mov    BYTE PTR ds:0x892710,cl
  42bd5a:	5d                   	pop    ebp
  42bd5b:	88 15 11 27 89 00    	mov    BYTE PTR ds:0x892711,dl
  42bd61:	5f                   	pop    edi
  42bd62:	5e                   	pop    esi
  42bd63:	5b                   	pop    ebx
  42bd64:	83 c4 28             	add    esp,0x28
  42bd67:	c3                   	ret
  42bd68:	cc                   	int3
  42bd69:	cc                   	int3
  42bd6a:	cc                   	int3
  42bd6b:	cc                   	int3
  42bd6c:	cc                   	int3
  42bd6d:	cc                   	int3
  42bd6e:	cc                   	int3
  42bd6f:	cc                   	int3
  42bd70:	33 d2                	xor    edx,edx
  42bd72:	b8 a0 00 00 00       	mov    eax,0xa0
  42bd77:	66 89 15 e7 26 89 00 	mov    WORD PTR ds:0x8926e7,dx
  42bd7e:	66 89 15 e9 26 89 00 	mov    WORD PTR ds:0x8926e9,dx
  42bd85:	66 a3 eb 26 89 00    	mov    ds:0x8926eb,ax
  42bd8b:	0f bf 0d d1 c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6d1
  42bd92:	66 a3 ed 26 89 00    	mov    ds:0x8926ed,ax
  42bd98:	b8 0a 00 00 00       	mov    eax,0xa
  42bd9d:	66                   	data16
  42bd9e:	a3                   	.byte 0xa3
  42bd9f:	ef                   	out    dx,eax
