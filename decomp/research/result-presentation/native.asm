# Static bounded disassembly; GNU objdump 2.44; original executable is never run.

# paletteSlotDestination
Disassembly of section .text:

00429dab <.text+0x28dab>:
  429dab:	8b 0d f8 ef 87 00    	mov    ecx,DWORD PTR ds:0x87eff8
  429db1:	68 f4 c6 89 00       	push   0x89c6f4
  429db6:	51                   	push   ecx
  429db7:	e8 04 10 00 00       	call   0x42adc0

# paletteSlots
Disassembly of section .text:

0042adc0 <.text+0x29dc0>:
  42adc0:	56                   	push   esi
  42adc1:	57                   	push   edi
  42adc2:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  42adc6:	6a 00                	push   0x0
  42adc8:	56                   	push   esi
  42adc9:	e8 02 85 07 00       	call   0x4a32d0
  42adce:	83 c4 08             	add    esp,0x8
  42add1:	68 ff 00 00 00       	push   0xff
  42add6:	68 ff 00 00 00       	push   0xff
  42addb:	68 ff 00 00 00       	push   0xff
  42ade0:	56                   	push   esi
  42ade1:	e8 7a b8 0f 00       	call   0x526660
  42ade6:	8b 7c 24 20          	mov    edi,DWORD PTR [esp+0x20]
  42adea:	83 c4 10             	add    esp,0x10
  42aded:	6a 0c                	push   0xc
  42adef:	88 07                	mov    BYTE PTR [edi],al
  42adf1:	6a 0c                	push   0xc
  42adf3:	6a 0c                	push   0xc
  42adf5:	56                   	push   esi
  42adf6:	e8 65 b8 0f 00       	call   0x526660
  42adfb:	83 c4 10             	add    esp,0x10
  42adfe:	88 47 01             	mov    BYTE PTR [edi+0x1],al
  42ae01:	6a 00                	push   0x0
  42ae03:	6a 00                	push   0x0
  42ae05:	68 ff 00 00 00       	push   0xff
  42ae0a:	56                   	push   esi
  42ae0b:	e8 50 b8 0f 00       	call   0x526660
  42ae10:	83 c4 10             	add    esp,0x10
  42ae13:	88 47 02             	mov    BYTE PTR [edi+0x2],al
  42ae16:	6a 00                	push   0x0
  42ae18:	68 ff 00 00 00       	push   0xff
  42ae1d:	6a 00                	push   0x0
  42ae1f:	56                   	push   esi
  42ae20:	e8 3b b8 0f 00       	call   0x526660
  42ae25:	83 c4 10             	add    esp,0x10
  42ae28:	88 47 03             	mov    BYTE PTR [edi+0x3],al

# levelLoadReset
Disassembly of section .text:

0042b590 <.text+0x2a590>:
  42b590:	53                   	push   ebx
  42b591:	57                   	push   edi
  42b592:	bf d3 79 89 00       	mov    edi,0x8979d3
  42b597:	e8 04 0a 00 00       	call   0x42bfa0

# statisticsLayout
Disassembly of section .text:

0042b940 <.text+0x2a940>:
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

# clearLevelCounters
Disassembly of section .text:

0042bfa0 <.text+0x2afa0>:
  42bfa0:	53                   	push   ebx
  42bfa1:	b8 fe 8a d7 09       	mov    eax,0x9d78afe
  42bfa6:	57                   	push   edi
  42bfa7:	33 db                	xor    ebx,ebx
  42bfa9:	bf 50 db 98 00       	mov    edi,0x98db50
  42bfae:	b9 00 01 00 00       	mov    ecx,0x100
  42bfb3:	6a 01                	push   0x1
  42bfb5:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  42bfba:	68 50 db 98 00       	push   0x98db50
  42bfbf:	88 1d d5 ea 96 00    	mov    BYTE PTR ds:0x96ead5,bl
  42bfc5:	a3 72 bc 89 00       	mov    ds:0x89bc72,eax
  42bfca:	33 c0                	xor    eax,eax
  42bfcc:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  42bfce:	e8 fd 72 07 00       	call   0x4a32d0
  42bfd3:	89 1d 84 d1 89 00    	mov    DWORD PTR ds:0x89d184,ebx
  42bfd9:	83 c4 08             	add    esp,0x8
  42bfdc:	89 1d 88 d1 89 00    	mov    DWORD PTR ds:0x89d188,ebx
  42bfe2:	b8 84 d1 89 00       	mov    eax,0x89d184
  42bfe7:	b8 c1 ea 96 00       	mov    eax,0x96eac1
  42bfec:	bf 10 41 97 00       	mov    edi,0x974110
  42bff1:	b9 14 00 00 00       	mov    ecx,0x14
  42bff6:	89 18                	mov    DWORD PTR [eax],ebx
  42bff8:	89 58 04             	mov    DWORD PTR [eax+0x4],ebx
  42bffb:	89 58 08             	mov    DWORD PTR [eax+0x8],ebx
  42bffe:	33 c0                	xor    eax,eax
  42c000:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  42c002:	83 0d a4 5d 89 00 10 	or     DWORD PTR ds:0x895da4,0x10
  42c009:	66 89 1d 89 bb 89 00 	mov    WORD PTR ds:0x89bb89,bx
  42c010:	88 1d ac 5d 89 00    	mov    BYTE PTR ds:0x895dac,bl

# upperLevelLoadReset
Disassembly of section .text:

0042c7f7 <.text+0x2b7f7>:
  42c7f7:	33 db                	xor    ebx,ebx
  42c7f9:	a0 a2 b7 89 00       	mov    al,ds:0x89b7a2
  42c7fe:	8a 1d a3 b7 89 00    	mov    bl,BYTE PTR ds:0x89b7a3
  42c804:	8a 0d a1 b7 89 00    	mov    cl,BYTE PTR ds:0x89b7a1
  42c80a:	c7 44 24 0c 00 00 00 	mov    DWORD PTR [esp+0xc],0x0
  42c811:	00
  42c812:	c7 44 24 10 00 00 00 	mov    DWORD PTR [esp+0x10],0x0
  42c819:	00
  42c81a:	bf d3 79 89 00       	mov    edi,0x8979d3
  42c81f:	88 44 24 0c          	mov    BYTE PTR [esp+0xc],al
  42c823:	88 4c 24 10          	mov    BYTE PTR [esp+0x10],cl
  42c827:	e8 74 f7 ff ff       	call   0x42bfa0

# singlePlayerAdmission
Disassembly of section .text:

0043e480 <.text+0x3d480>:
  43e480:	83 ec 10             	sub    esp,0x10
  43e483:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  43e48a:	c6 44 24 03 00       	mov    BYTE PTR [esp+0x3],0x0
  43e48f:	53                   	push   ebx
  43e490:	56                   	push   esi
  43e491:	57                   	push   edi
  43e492:	55                   	push   ebp
  43e493:	0f 85 88 01 00 00    	jne    0x43e621
  43e499:	c7 44 24 18 00 00 00 	mov    DWORD PTR [esp+0x18],0x0
  43e4a0:	00
  43e4a1:	c6 44 24 13 01       	mov    BYTE PTR [esp+0x13],0x1
  43e4a6:	80 3d c0 ea 96 00 00 	cmp    BYTE PTR ds:0x96eac0,0x0
  43e4ad:	ba d3 79 89 00       	mov    edx,0x8979d3
  43e4b2:	0f 86 9f 00 00 00    	jbe    0x43e557
  43e4b8:	c7 44 24 14 e8 dd 89 	mov    DWORD PTR [esp+0x14],0x89dde8
  43e4bf:	00
  43e4c0:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  43e4c5:	0f 84 8c 00 00 00    	je     0x43e557
  43e4cb:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  43e4cf:	80 38 00             	cmp    BYTE PTR [eax],0x0
  43e4d2:	0f bf 42 02          	movsx  eax,WORD PTR [edx+0x2]
  43e4d6:	75 0d                	jne    0x43e4e5
  43e4d8:	8d 0c 40             	lea    ecx,[eax+eax*2]
  43e4db:	8d 1c 89             	lea    ebx,[ecx+ecx*4]
  43e4de:	c6 44 13 12 00       	mov    BYTE PTR [ebx+edx*1+0x12],0x0
  43e4e3:	eb 4f                	jmp    0x43e534
  43e4e5:	0f bf 3a             	movsx  edi,WORD PTR [edx]
  43e4e8:	2b f8                	sub    edi,eax
  43e4ea:	79 03                	jns    0x43e4ef
  43e4ec:	83 c7 64             	add    edi,0x64
  43e4ef:	33 f6                	xor    esi,esi
  43e4f1:	32 c9                	xor    cl,cl
  43e4f3:	8d 04 40             	lea    eax,[eax+eax*2]
  43e4f6:	85 ff                	test   edi,edi
  43e4f8:	8d 2c 80             	lea    ebp,[eax+eax*4]
  43e4fb:	8d 42 06             	lea    eax,[edx+0x6]
  43e4fe:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  43e502:	8d 5c 15 06          	lea    ebx,[ebp+edx*1+0x6]
  43e506:	8d 82 e2 05 00 00    	lea    eax,[edx+0x5e2]
  43e50c:	7e 1d                	jle    0x43e52b
  43e50e:	84 c9                	test   cl,cl
  43e510:	75 22                	jne    0x43e534
  43e512:	3b c3                	cmp    eax,ebx
  43e514:	77 04                	ja     0x43e51a
  43e516:	8b 5c 24 1c          	mov    ebx,DWORD PTR [esp+0x1c]
  43e51a:	8b 2d 84 d1 89 00    	mov    ebp,DWORD PTR ds:0x89d184
  43e520:	39 2b                	cmp    DWORD PTR [ebx],ebp
  43e522:	75 02                	jne    0x43e526
  43e524:	b1 01                	mov    cl,0x1
  43e526:	46                   	inc    esi
  43e527:	3b fe                	cmp    edi,esi
  43e529:	7f e3                	jg     0x43e50e
  43e52b:	84 c9                	test   cl,cl
  43e52d:	75 05                	jne    0x43e534
  43e52f:	c6 44 24 13 00       	mov    BYTE PTR [esp+0x13],0x0
  43e534:	81 c2 e2 05 00 00    	add    edx,0x5e2
  43e53a:	33 c0                	xor    eax,eax
  43e53c:	a0 c0 ea 96 00       	mov    al,ds:0x96eac0
  43e541:	ff 44 24 18          	inc    DWORD PTR [esp+0x18]
  43e545:	81 44 24 14 65 0c 00 	add    DWORD PTR [esp+0x14],0xc65
  43e54c:	00
  43e54d:	3b 44 24 18          	cmp    eax,DWORD PTR [esp+0x18]
  43e551:	0f 8f 69 ff ff ff    	jg     0x43e4c0
  43e557:	33 db                	xor    ebx,ebx
  43e559:	38 5c 24 13          	cmp    BYTE PTR [esp+0x13],bl
  43e55d:	0f 84 14 03 00 00    	je     0x43e877
  43e563:	be d3 79 89 00       	mov    esi,0x8979d3
  43e568:	38 1d c0 ea 96 00    	cmp    BYTE PTR ds:0x96eac0,bl
  43e56e:	76 63                	jbe    0x43e5d3
  43e570:	b9 8c d1 89 00       	mov    ecx,0x89d18c
  43e575:	33 c0                	xor    eax,eax
  43e577:	0f bf 7e 02          	movsx  edi,WORD PTR [esi+0x2]
  43e57b:	8d 14 7f             	lea    edx,[edi+edi*2]
  43e57e:	8d 3c 92             	lea    edi,[edx+edx*4]
  43e581:	03 fe                	add    edi,esi
  43e583:	8b 57 06             	mov    edx,DWORD PTR [edi+0x6]
  43e586:	83 c7 06             	add    edi,0x6
  43e589:	89 11                	mov    DWORD PTR [ecx],edx
  43e58b:	8b 6f 04             	mov    ebp,DWORD PTR [edi+0x4]
  43e58e:	89 69 04             	mov    DWORD PTR [ecx+0x4],ebp
  43e591:	8b 57 08             	mov    edx,DWORD PTR [edi+0x8]
  43e594:	89 51 08             	mov    DWORD PTR [ecx+0x8],edx
  43e597:	66 8b 6f 0c          	mov    bp,WORD PTR [edi+0xc]
  43e59b:	66 89 69 0c          	mov    WORD PTR [ecx+0xc],bp
  43e59f:	8a 57 0e             	mov    dl,BYTE PTR [edi+0xe]
  43e5a2:	88 51 0e             	mov    BYTE PTR [ecx+0xe],dl
  43e5a5:	66 8b 56 02          	mov    dx,WORD PTR [esi+0x2]
  43e5a9:	66 42                	inc    dx
  43e5ab:	66 89 56 02          	mov    WORD PTR [esi+0x2],dx
  43e5af:	66 83 fa 64          	cmp    dx,0x64
  43e5b3:	7c 04                	jl     0x43e5b9
  43e5b5:	66 89 46 02          	mov    WORD PTR [esi+0x2],ax
  43e5b9:	66 89 46 04          	mov    WORD PTR [esi+0x4],ax
  43e5bd:	83 c1 0f             	add    ecx,0xf
  43e5c0:	43                   	inc    ebx
  43e5c1:	81 c6 e2 05 00 00    	add    esi,0x5e2
  43e5c7:	33 d2                	xor    edx,edx
  43e5c9:	8a 15 c0 ea 96 00    	mov    dl,BYTE PTR ds:0x96eac0
  43e5cf:	3b d3                	cmp    edx,ebx
  43e5d1:	7f a4                	jg     0x43e577
  43e5d3:	f6 05 6b c6 89 00 40 	test   BYTE PTR ds:0x89c66b,0x40
  43e5da:	74 1c                	je     0x43e5f8
  43e5dc:	a1 d3 56 89 00       	mov    eax,ds:0x8956d3
  43e5e1:	50                   	push   eax
  43e5e2:	6a 04                	push   0x4
  43e5e4:	6a 0f                	push   0xf
  43e5e6:	68 8c d1 89 00       	push   0x89d18c
  43e5eb:	e8 20 cc 11 00       	call   0x55b210
  43e5f0:	83 c4 10             	add    esp,0x10
  43e5f3:	e9 79 02 00 00       	jmp    0x43e871
  43e5f8:	f6 05 6b c6 89 00 80 	test   BYTE PTR ds:0x89c66b,0x80
  43e5ff:	0f 84 6c 02 00 00    	je     0x43e871
  43e605:	a1 d3 56 89 00       	mov    eax,ds:0x8956d3
  43e60a:	50                   	push   eax
  43e60b:	6a 04                	push   0x4
  43e60d:	6a 0f                	push   0xf
  43e60f:	68 8c d1 89 00       	push   0x89d18c
  43e614:	e8 47 c7 11 00       	call   0x55ad60
  43e619:	83 c4 10             	add    esp,0x10
  43e61c:	e9 50 02 00 00       	jmp    0x43e871

# admittedCounterIncrement
Disassembly of section .text:

0043e871 <.text+0x3d871>:
  43e871:	ff 05 84 d1 89 00    	inc    DWORD PTR ds:0x89d184
  43e877:	8a 44 24 13          	mov    al,BYTE PTR [esp+0x13]
  43e87b:	5d                   	pop    ebp
  43e87c:	5f                   	pop    edi
  43e87d:	5e                   	pop    esi
  43e87e:	5b                   	pop    ebx
  43e87f:	83 c4 10             	add    esp,0x10
  43e882:	c3                   	ret

# speedMultiplier
Disassembly of section .text:

0043ec32 <.text+0x3dc32>:
  43ec32:	8b 84 24 e8 03 00 00 	mov    eax,DWORD PTR [esp+0x3e8]
  43ec39:	8a 40 04             	mov    al,BYTE PTR [eax+0x4]
  43ec3c:	00 05 ac 5d 89 00    	add    BYTE PTR ds:0x895dac,al
  43ec42:	f6 05 62 c6 89 00 80 	test   BYTE PTR ds:0x89c662,0x80
  43ec49:	75 22                	jne    0x43ec6d
  43ec4b:	80 3d ac 5d 89 00 00 	cmp    BYTE PTR ds:0x895dac,0x0
  43ec52:	7d 07                	jge    0x43ec5b
  43ec54:	c6 05 ac 5d 89 00 00 	mov    BYTE PTR ds:0x895dac,0x0
  43ec5b:	80 3d ac 5d 89 00 04 	cmp    BYTE PTR ds:0x895dac,0x4
  43ec62:	7e 29                	jle    0x43ec8d
  43ec64:	c6 05 ac 5d 89 00 04 	mov    BYTE PTR ds:0x895dac,0x4
  43ec6b:	eb 20                	jmp    0x43ec8d
  43ec6d:	80 3d ac 5d 89 00 00 	cmp    BYTE PTR ds:0x895dac,0x0
  43ec74:	7d 07                	jge    0x43ec7d
  43ec76:	c6 05 ac 5d 89 00 00 	mov    BYTE PTR ds:0x895dac,0x0
  43ec7d:	80 3d ac 5d 89 00 20 	cmp    BYTE PTR ds:0x895dac,0x20
  43ec84:	7e 07                	jle    0x43ec8d
  43ec86:	c6 05 ac 5d 89 00 20 	mov    BYTE PTR ds:0x895dac,0x20

# languageFamily
Disassembly of section .text:

00493210 <.text+0x92210>:
  493210:	a1 6a bc 89 00       	mov    eax,ds:0x89bc6a
  493215:	83 f8 09             	cmp    eax,0x9
  493218:	7c 05                	jl     0x49321f
  49321a:	83 f8 0b             	cmp    eax,0xb
  49321d:	7e 03                	jle    0x493222
  49321f:	33 c0                	xor    eax,eax
  493221:	c3                   	ret
  493222:	b8 01 00 00 00       	mov    eax,0x1
  493227:	c3                   	ret

# defaultSettingsInit
Disassembly of section .text:

0049a940 <.text+0x99940>:
  49a940:	83 ec 04             	sub    esp,0x4
  49a943:	80 3d 72 9a 5a 00 ff 	cmp    BYTE PTR ds:0x5a9a72,0xff
  49a94a:	56                   	push   esi
  49a94b:	57                   	push   edi
  49a94c:	74 6a                	je     0x49a9b8
  49a94e:	be 68 9a 5a 00       	mov    esi,0x5a9a68
  49a953:	b9 08 00 00 00       	mov    ecx,0x8
  49a958:	ba ff ff ff ff       	mov    edx,0xffffffff
  49a95d:	84 4e 0b             	test   BYTE PTR [esi+0xb],cl
  49a960:	74 4e                	je     0x49a9b0
  49a962:	8b 46 f8             	mov    eax,DWORD PTR [esi-0x8]
  49a965:	89 44 24 08          	mov    DWORD PTR [esp+0x8],eax
  49a969:	0f be 46 0a          	movsx  eax,BYTE PTR [esi+0xa]
  49a96d:	48                   	dec    eax
  49a96e:	83 f8 03             	cmp    eax,0x3
  49a971:	77 3d                	ja     0x49a9b0
  49a973:	ff 24 85 c0 a9 49 00 	jmp    DWORD PTR [eax*4+0x49a9c0]
  49a97a:	8a 06                	mov    al,BYTE PTR [esi]
  49a97c:	8b 7c 24 08          	mov    edi,DWORD PTR [esp+0x8]
  49a980:	88 07                	mov    BYTE PTR [edi],al
  49a982:	eb 2c                	jmp    0x49a9b0
  49a984:	8b 06                	mov    eax,DWORD PTR [esi]
  49a986:	8b 7c 24 08          	mov    edi,DWORD PTR [esp+0x8]
  49a98a:	66 89 07             	mov    WORD PTR [edi],ax
  49a98d:	eb 21                	jmp    0x49a9b0
  49a98f:	8b 06                	mov    eax,DWORD PTR [esi]
  49a991:	8b 7c 24 08          	mov    edi,DWORD PTR [esp+0x8]
  49a995:	89 07                	mov    DWORD PTR [edi],eax
  49a997:	eb 17                	jmp    0x49a9b0
  49a999:	8b 7e fc             	mov    edi,DWORD PTR [esi-0x4]
  49a99c:	85 3e                	test   DWORD PTR [esi],edi
  49a99e:	74 08                	je     0x49a9a8
  49a9a0:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  49a9a4:	09 38                	or     DWORD PTR [eax],edi
  49a9a6:	eb 08                	jmp    0x49a9b0
  49a9a8:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  49a9ac:	f7 d7                	not    edi
  49a9ae:	21 38                	and    DWORD PTR [eax],edi
  49a9b0:	83 c6 14             	add    esi,0x14
  49a9b3:	38 56 0a             	cmp    BYTE PTR [esi+0xa],dl
  49a9b6:	75 a5                	jne    0x49a95d
  49a9b8:	5f                   	pop    edi
  49a9b9:	5e                   	pop    esi
  49a9ba:	83 c4 04             	add    esp,0x4
  49a9bd:	c3                   	ret

# settingsStartup
Disassembly of section .text:

004a44e9 <.text+0xa34e9>:
  4a44e9:	e8 52 64 ff ff       	call   0x49a940
  4a44ee:	e8 dd 64 ff ff       	call   0x49a9d0

# blinkProducerAndDispatch
Disassembly of section .text:

004a470b <.text+0xa370b>:
  4a470b:	b9 01 00 00 00       	mov    ecx,0x1
  4a4710:	ff 05 81 79 89 00    	inc    DWORD PTR ds:0x897981
  4a4716:	a1 84 d1 89 00       	mov    eax,ds:0x89d184
  4a471b:	2b d2                	sub    edx,edx
  4a471d:	f7 f1                	div    ecx
  4a471f:	24 01                	and    al,0x1
  4a4721:	41                   	inc    ecx
  4a4722:	83 f9 08             	cmp    ecx,0x8
  4a4725:	88 81 84 79 89 00    	mov    BYTE PTR [ecx+0x897984],al
  4a472b:	7c e9                	jl     0x4a4716
  4a472d:	e8 2e df ff ff       	call   0x4a2660
  4a4732:	e8 99 b4 fa ff       	call   0x44fbd0
  4a4737:	33 c0                	xor    eax,eax
  4a4739:	a0 00 f0 88 00       	mov    al,ds:0x88f000
  4a473e:	83 e8 02             	sub    eax,0x2
  4a4741:	83 f8 0a             	cmp    eax,0xa
  4a4744:	77 30                	ja     0x4a4776
  4a4746:	33 c9                	xor    ecx,ecx
  4a4748:	8a 88 54 49 4a 00    	mov    cl,BYTE PTR [eax+0x4a4954]
  4a474e:	ff 24 8d 38 49 4a 00 	jmp    DWORD PTR [ecx*4+0x4a4938]
  4a4755:	e8 06 02 00 00       	call   0x4a4960

# schedulerVisit
Disassembly of section .text:

004a4b6a <.text+0xa3b6a>:
  4a4b6a:	e8 21 0a 00 00       	call   0x4a5590

# renderVisit
Disassembly of section .text:

004a4c07 <.text+0xa3c07>:
  4a4c07:	e8 64 d9 07 00       	call   0x522570

# schedulerDeadline
Disassembly of section .text:

004a5590 <.text+0xa4590>:
  4a5590:	83 ec 58             	sub    esp,0x58
  4a5593:	33 c9                	xor    ecx,ecx
  4a5595:	8a 0d 61 d1 89 00    	mov    cl,BYTE PTR ds:0x89d161
  4a559b:	b8 e8 03 00 00       	mov    eax,0x3e8
  4a55a0:	99                   	cdq
  4a55a1:	f7 f9                	idiv   ecx
  4a55a3:	53                   	push   ebx
  4a55a4:	56                   	push   esi
  4a55a5:	57                   	push   edi
  4a55a6:	55                   	push   ebp
  4a55a7:	8b 35 84 c7 d0 00    	mov    esi,DWORD PTR ds:0xd0c784
  4a55ad:	a3 30 d9 5c 00       	mov    ds:0x5cd930,eax
  4a55b2:	83 3d 84 d1 89 00 00 	cmp    DWORD PTR ds:0x89d184,0x0
  4a55b9:	75 08                	jne    0x4a55c3
  4a55bb:	ff d6                	call   esi
  4a55bd:	48                   	dec    eax
  4a55be:	a3 2c d9 5c 00       	mov    ds:0x5cd92c,eax

# singlePlayerScheduler
Disassembly of section .text:

004a5931 <.text+0xa4931>:
  4a5931:	ff d6                	call   esi
  4a5933:	3b 05 2c d9 5c 00    	cmp    eax,DWORD PTR ds:0x5cd92c
  4a5939:	0f 86 96 00 00 00    	jbe    0x4a59d5
  4a593f:	c6 05 63 d1 89 00 01 	mov    BYTE PTR ds:0x89d163,0x1
  4a5946:	e8 35 8b f9 ff       	call   0x43e480
  4a594b:	84 c0                	test   al,al
  4a594d:	74 6d                	je     0x4a59bc
  4a594f:	f6 05 6b c6 89 00 c0 	test   BYTE PTR ds:0x89c66b,0xc0
  4a5956:	74 05                	je     0x4a595d
  4a5958:	e8 d3 83 f9 ff       	call   0x43dd30
  4a595d:	e8 2e 8f f9 ff       	call   0x43e890
  4a5962:	e8 59 51 fd ff       	call   0x47aac0
  4a5967:	e8 b4 89 f9 ff       	call   0x43e320
  4a596c:	e8 bf 52 fd ff       	call   0x47ac30
  4a5971:	0f be 3d ac 5d 89 00 	movsx  edi,BYTE PTR ds:0x895dac
  4a5978:	47                   	inc    edi
  4a5979:	74 41                	je     0x4a59bc
  4a597b:	bb 02 00 00 00       	mov    ebx,0x2
  4a5980:	bd 00 00 80 00       	mov    ebp,0x800000
  4a5985:	38 1d 81 bb 89 00    	cmp    BYTE PTR ds:0x89bb81,bl
  4a598b:	74 27                	je     0x4a59b4
  4a598d:	80 3d 81 bb 89 00 03 	cmp    BYTE PTR ds:0x89bb81,0x3
  4a5994:	74 1e                	je     0x4a59b4
  4a5996:	e8 85 df 00 00       	call   0x4b3920
  4a599b:	85 2d 61 c6 89 00    	test   DWORD PTR ds:0x89c661,ebp
  4a59a1:	75 05                	jne    0x4a59a8
  4a59a3:	e8 68 bb fb ff       	call   0x461510
  4a59a8:	e8 93 03 00 00       	call   0x4a5d40
  4a59ad:	e8 3e 6d 04 00       	call   0x4ec6f0
  4a59b2:	eb 05                	jmp    0x4a59b9
  4a59b4:	e8 87 9c 00 00       	call   0x4af640
  4a59b9:	4f                   	dec    edi
  4a59ba:	75 c9                	jne    0x4a5985
  4a59bc:	a1 30 d9 5c 00       	mov    eax,ds:0x5cd930
  4a59c1:	01 05 2c d9 5c 00    	add    DWORD PTR ds:0x5cd92c,eax
  4a59c7:	ff d6                	call   esi
  4a59c9:	3b 05 2c d9 5c 00    	cmp    eax,DWORD PTR ds:0x5cd92c
  4a59cf:	0f 87 6a ff ff ff    	ja     0x4a593f
  4a59d5:	5d                   	pop    ebp
  4a59d6:	5f                   	pop    edi
  4a59d7:	5e                   	pop    esi
  4a59d8:	5b                   	pop    ebx
  4a59d9:	83 c4 58             	add    esp,0x58
  4a59dc:	c3                   	ret

# simulationCounterIncrement
Disassembly of section .text:

004ec6f0 <.text+0xeb6f0>:
  4ec6f0:	f6 05 61 c6 89 00 02 	test   BYTE PTR ds:0x89c661,0x2
  4ec6f7:	53                   	push   ebx
  4ec6f8:	56                   	push   esi
  4ec6f9:	57                   	push   edi
  4ec6fa:	55                   	push   ebp
  4ec6fb:	0f 85 3a 03 00 00    	jne    0x4eca3b
  4ec701:	33 d2                	xor    edx,edx
  4ec703:	ff 05 88 d1 89 00    	inc    DWORD PTR ds:0x89d188
  4ec709:	88 15 67 d1 89 00    	mov    BYTE PTR ds:0x89d167,dl

# directGpuGlyph
Disassembly of section .text:

00516c80 <.text+0x115c80>:
  516c80:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  516c84:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  516c88:	83 ec 0c             	sub    esp,0xc
  516c8b:	83 3d 78 a0 5d 00 00 	cmp    DWORD PTR ds:0x5da078,0x0
  516c92:	56                   	push   esi
  516c93:	8d b4 c8 00 ff ff ff 	lea    esi,[eax+ecx*8-0x100]
  516c9a:	74 1e                	je     0x516cba
  516c9c:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  516ca0:	56                   	push   esi
  516ca1:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  516ca5:	50                   	push   eax
  516ca6:	51                   	push   ecx
  516ca7:	e8 34 3b 01 00       	call   0x52a7e0
  516cac:	83 c4 0c             	add    esp,0xc
  516caf:	33 c0                	xor    eax,eax
  516cb1:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  516cb5:	5e                   	pop    esi
  516cb6:	83 c4 0c             	add    esp,0xc
  516cb9:	c3                   	ret
  516cba:	8d 44 24 0c          	lea    eax,[esp+0xc]
  516cbe:	8d 4c 24 08          	lea    ecx,[esp+0x8]
  516cc2:	50                   	push   eax
  516cc3:	51                   	push   ecx
  516cc4:	56                   	push   esi
  516cc5:	e8 a6 f4 ff ff       	call   0x516170
  516cca:	83 c4 0c             	add    esp,0xc
  516ccd:	83 7c 24 08 00       	cmp    DWORD PTR [esp+0x8],0x0
  516cd2:	74 45                	je     0x516d19
  516cd4:	f6 05 74 a0 5d 00 08 	test   BYTE PTR ds:0x5da074,0x8
  516cdb:	b8 ff ff ff 00       	mov    eax,0xffffff
  516ce0:	74 05                	je     0x516ce7
  516ce2:	a1 e0 a0 5d 00       	mov    eax,ds:0x5da0e0
  516ce7:	8b 0d 74 a0 5d 00    	mov    ecx,DWORD PTR ds:0x5da074
  516ced:	8b 54 24 08          	mov    edx,DWORD PTR [esp+0x8]
  516cf1:	db 44 24 1c          	fild   DWORD PTR [esp+0x1c]
  516cf5:	51                   	push   ecx
  516cf6:	50                   	push   eax
  516cf7:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  516cfb:	50                   	push   eax
  516cfc:	52                   	push   edx
  516cfd:	83 ec 04             	sub    esp,0x4
  516d00:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  516d06:	83 ec 04             	sub    esp,0x4
  516d09:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  516d0d:	db 44 24 30          	fild   DWORD PTR [esp+0x30]
  516d11:	d9 1c 24             	fstp   DWORD PTR [esp]
  516d14:	e8 37 6f f6 ff       	call   0x47dc50
  516d19:	33 c0                	xor    eax,eax
  516d1b:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  516d1f:	5e                   	pop    esi
  516d20:	83 c4 0c             	add    esp,0xc
  516d23:	c3                   	ret

# fontVtableSelection
Disassembly of section .text:

00516d30 <.text+0x115d30>:
  516d30:	83 3d 78 a0 5d 00 00 	cmp    DWORD PTR ds:0x5da078,0x0
  516d37:	75 16                	jne    0x516d4f
  516d39:	81 7c 24 04 98 16 59 	cmp    DWORD PTR [esp+0x4],0x591698
  516d40:	00
  516d41:	b8 f0 a1 5d 00       	mov    eax,0x5da1f0
  516d46:	74 0b                	je     0x516d53
  516d48:	b8 00 a2 5d 00       	mov    eax,0x5da200
  516d4d:	eb 04                	jmp    0x516d53
  516d4f:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  516d53:	8b 4c 24 08          	mov    ecx,DWORD PTR [esp+0x8]
  516d57:	51                   	push   ecx
  516d58:	50                   	push   eax
  516d59:	e8 42 0d 01 00       	call   0x527aa0
  516d5e:	83 c4 08             	add    esp,0x8
  516d61:	c3                   	ret

# terminalOverlay
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

# panelTiles
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

# statisticsFontAndCenter
Disassembly of section .text:

00523fa0 <.text+0x122fa0>:
  523fa0:	81 ec 48 04 00 00    	sub    esp,0x448
  523fa6:	f6 05 69 c6 89 00 20 	test   BYTE PTR ds:0x89c669,0x20
  523fad:	53                   	push   ebx
  523fae:	56                   	push   esi
  523faf:	57                   	push   edi
  523fb0:	55                   	push   ebp
  523fb1:	0f 84 6d 0a 00 00    	je     0x524a24
  523fb7:	f6 05 66 c6 89 00 02 	test   BYTE PTR ds:0x89c666,0x2
  523fbe:	0f 85 60 0a 00 00    	jne    0x524a24
  523fc4:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  523fcb:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  523fcf:	a1 61 c6 89 00       	mov    eax,ds:0x89c661
  523fd4:	25 00 00 00 06       	and    eax,0x6000000
  523fd9:	83 f8 01             	cmp    eax,0x1
  523fdc:	1b c0                	sbb    eax,eax
  523fde:	40                   	inc    eax
  523fdf:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  523fe3:	e8 28 f2 f6 ff       	call   0x493210
  523fe8:	85 c0                	test   eax,eax
  523fea:	74 19                	je     0x524005
  523fec:	33 c0                	xor    eax,eax
  523fee:	a0 de 28 89 00       	mov    al,ds:0x8928de
  523ff3:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  523ffa:	51                   	push   ecx
  523ffb:	e8 40 db f2 ff       	call   0x451b40
  524000:	83 c4 04             	add    esp,0x4
  524003:	eb 1c                	jmp    0x524021
  524005:	33 c0                	xor    eax,eax
  524007:	a0 de 28 89 00       	mov    al,ds:0x8928de
  52400c:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  524013:	51                   	push   ecx
  524014:	68 88 16 59 00       	push   0x591688
  524019:	e8 12 2d ff ff       	call   0x516d30
  52401e:	83 c4 08             	add    esp,0x8
  524021:	0f bf 05 2a f0 88 00 	movsx  eax,WORD PTR ds:0x88f02a
  524028:	0f bf 0d f3 26 89 00 	movsx  ecx,WORD PTR ds:0x8926f3
  52402f:	2b c1                	sub    eax,ecx
  524031:	99                   	cdq
  524032:	2b c2                	sub    eax,edx
  524034:	0f bf 0d 26 f0 88 00 	movsx  ecx,WORD PTR ds:0x88f026
  52403b:	c1 f8 01             	sar    eax,0x1
  52403e:	03 c8                	add    ecx,eax
  524040:	0f bf 15 f5 26 89 00 	movsx  edx,WORD PTR ds:0x8926f5
  524047:	0f bf 05 2c f0 88 00 	movsx  eax,WORD PTR ds:0x88f02c
  52404e:	2b c2                	sub    eax,edx
  524050:	89 4c 24 20          	mov    DWORD PTR [esp+0x20],ecx
  524054:	99                   	cdq
  524055:	2b c2                	sub    eax,edx
  524057:	0f bf 0d 28 f0 88 00 	movsx  ecx,WORD PTR ds:0x88f028
  52405e:	c1 f8 01             	sar    eax,0x1
  524061:	03 c8                	add    ecx,eax
  524063:	66 0f be 15 0d 27 89 	movsx  dx,BYTE PTR ds:0x89270d
  52406a:	00
  52406b:	66 0f be 05 0e 27 89 	movsx  ax,BYTE PTR ds:0x89270e
  524072:	00
  524073:	89 4c 24 24          	mov    DWORD PTR [esp+0x24],ecx
  524077:	50                   	push   eax
  524078:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  52407c:	52                   	push   edx
  52407d:	51                   	push   ecx
  52407e:	50                   	push   eax
  52407f:	e8 bc fc ff ff       	call   0x523d40

# statisticsStatusBlink
Disassembly of section .text:

00524228 <.text+0x123228>:
  524228:	0f bf 05 07 27 89 00 	movsx  eax,WORD PTR ds:0x892707
  52422f:	03 d8                	add    ebx,eax
  524231:	f6 05 64 c6 89 00 02 	test   BYTE PTR ds:0x89c664,0x2
  524238:	74 07                	je     0x524241
  52423a:	a1 28 37 97 00       	mov    eax,ds:0x973728
  52423f:	eb 15                	jmp    0x524256
  524241:	f6 05 64 c6 89 00 04 	test   BYTE PTR ds:0x89c664,0x4
  524248:	74 07                	je     0x524251
  52424a:	a1 2c 37 97 00       	mov    eax,ds:0x97372c
  52424f:	eb 05                	jmp    0x524256
  524251:	a1 30 37 97 00       	mov    eax,ds:0x973730
  524256:	8d 8c 24 58 03 00 00 	lea    ecx,[esp+0x358]
  52425d:	50                   	push   eax
  52425e:	68 70 99 59 00       	push   0x599970
  524263:	51                   	push   ecx
  524264:	e8 57 73 03 00       	call   0x55b5c0
  524269:	8d 84 24 64 03 00 00 	lea    eax,[esp+0x364]
  524270:	8d 94 24 64 01 00 00 	lea    edx,[esp+0x164]
  524277:	83 c4 0c             	add    esp,0xc
  52427a:	8b 0d 24 37 97 00    	mov    ecx,DWORD PTR ds:0x973724
  524280:	50                   	push   eax
  524281:	51                   	push   ecx
  524282:	68 ac dd 5d 00       	push   0x5dddac
  524287:	52                   	push   edx
  524288:	e8 13 f7 f2 ff       	call   0x4539a0
  52428d:	8d 8c 24 68 01 00 00 	lea    ecx,[esp+0x168]
  524294:	83 c4 10             	add    esp,0x10
  524297:	0f bf 35 f7 26 89 00 	movsx  esi,WORD PTR ds:0x8926f7
  52429e:	51                   	push   ecx
  52429f:	e8 8c 63 f7 ff       	call   0x49a630
  5242a4:	83 c4 04             	add    esp,0x4
  5242a7:	2b f0                	sub    esi,eax
  5242a9:	8b c6                	mov    eax,esi
  5242ab:	99                   	cdq
  5242ac:	2b c2                	sub    eax,edx
  5242ae:	c1 f8 01             	sar    eax,0x1
  5242b1:	83 7c 24 34 00       	cmp    DWORD PTR [esp+0x34],0x0
  5242b6:	8d 34 07             	lea    esi,[edi+eax*1]
  5242b9:	74 24                	je     0x5242df
  5242bb:	80 3d 8b 79 89 00 00 	cmp    BYTE PTR ds:0x89798b,0x0
  5242c2:	74 1b                	je     0x5242df
  5242c4:	a1 24 37 97 00       	mov    eax,ds:0x973724
  5242c9:	8d 8c 24 58 01 00 00 	lea    ecx,[esp+0x158]
  5242d0:	50                   	push   eax
  5242d1:	68 a4 dd 5d 00       	push   0x5ddda4
  5242d6:	51                   	push   ecx
  5242d7:	e8 c4 f6 f2 ff       	call   0x4539a0
  5242dc:	83 c4 0c             	add    esp,0xc
  5242df:	e8 2c ef f6 ff       	call   0x493210
  5242e4:	85 c0                	test   eax,eax
  5242e6:	74 1a                	je     0x524302
  5242e8:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  5242ed:	8d 8c 24 58 01 00 00 	lea    ecx,[esp+0x158]
  5242f4:	50                   	push   eax
  5242f5:	51                   	push   ecx
  5242f6:	53                   	push   ebx
  5242f7:	56                   	push   esi
  5242f8:	e8 a3 d8 f2 ff       	call   0x451ba0
  5242fd:	83 c4 10             	add    esp,0x10
  524300:	eb 28                	jmp    0x52432a
  524302:	83 ec 08             	sub    esp,0x8
  524305:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  52430a:	89 64 24 60          	mov    DWORD PTR [esp+0x60],esp
  52430e:	50                   	push   eax
  52430f:	8b 4c 24 64          	mov    ecx,DWORD PTR [esp+0x64]
  524313:	e8 58 1c ef ff       	call   0x415f70
  524318:	8d 84 24 60 01 00 00 	lea    eax,[esp+0x160]
  52431f:	50                   	push   eax
  524320:	53                   	push   ebx
  524321:	56                   	push   esi
  524322:	e8 39 36 00 00       	call   0x527960
  524327:	83 c4 14             	add    esp,0x14

# statisticsRewardModulationEnd
Disassembly of section .text:

005248b4 <.text+0x1238b4>:
  5248b4:	83 25 74 a0 5d 00 f7 	and    DWORD PTR ds:0x5da074,0xfffffff7

# statisticsPrompt
Disassembly of section .text:

0052495d <.text+0x12395d>:
  52495d:	83 7c 24 34 00       	cmp    DWORD PTR [esp+0x34],0x0
  524962:	0f 84 bc 00 00 00    	je     0x524a24
  524968:	80 3d 89 79 89 00 00 	cmp    BYTE PTR ds:0x897989,0x0
  52496f:	0f 84 af 00 00 00    	je     0x524a24
  524975:	0f bf 35 f3 26 89 00 	movsx  esi,WORD PTR ds:0x8926f3
  52497c:	a1 90 2f 97 00       	mov    eax,ds:0x972f90
  524981:	50                   	push   eax
  524982:	e8 a9 5c f7 ff       	call   0x49a630
  524987:	83 c4 04             	add    esp,0x4
  52498a:	2b f0                	sub    esi,eax
  52498c:	8b c6                	mov    eax,esi
  52498e:	8b 74 24 20          	mov    esi,DWORD PTR [esp+0x20]
  524992:	99                   	cdq
  524993:	2b c2                	sub    eax,edx
  524995:	c1 f8 01             	sar    eax,0x1
  524998:	03 f0                	add    esi,eax
  52499a:	0f bf 05 07 27 89 00 	movsx  eax,WORD PTR ds:0x892707
  5249a1:	99                   	cdq
  5249a2:	83 e2 03             	and    edx,0x3
  5249a5:	8b 7c 24 24          	mov    edi,DWORD PTR [esp+0x24]
  5249a9:	03 c2                	add    eax,edx
  5249ab:	c1 f8 02             	sar    eax,0x2
  5249ae:	0f bf 0d f5 26 89 00 	movsx  ecx,WORD PTR ds:0x8926f5
  5249b5:	0f bf c0             	movsx  eax,ax
  5249b8:	03 c1                	add    eax,ecx
  5249ba:	0f bf 0d d1 c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6d1
  5249c1:	03 f8                	add    edi,eax
  5249c3:	3b f9                	cmp    edi,ecx
  5249c5:	7e 0c                	jle    0x5249d3
  5249c7:	0f bf 05 07 27 89 00 	movsx  eax,WORD PTR ds:0x892707
  5249ce:	2b c8                	sub    ecx,eax
  5249d0:	8d 79 fe             	lea    edi,[ecx-0x2]
  5249d3:	e8 38 e8 f6 ff       	call   0x493210
  5249d8:	85 c0                	test   eax,eax
  5249da:	74 22                	je     0x5249fe
  5249dc:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  5249e1:	8b 0d 90 2f 97 00    	mov    ecx,DWORD PTR ds:0x972f90
  5249e7:	50                   	push   eax
  5249e8:	51                   	push   ecx
  5249e9:	57                   	push   edi
  5249ea:	56                   	push   esi
  5249eb:	e8 b0 d1 f2 ff       	call   0x451ba0
  5249f0:	83 c4 10             	add    esp,0x10
  5249f3:	5d                   	pop    ebp
  5249f4:	5f                   	pop    edi
  5249f5:	5e                   	pop    esi
  5249f6:	5b                   	pop    ebx
  5249f7:	81 c4 48 04 00 00    	add    esp,0x448
  5249fd:	c3                   	ret
  5249fe:	83 ec 08             	sub    esp,0x8
  524a01:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  524a06:	89 64 24 60          	mov    DWORD PTR [esp+0x60],esp
  524a0a:	50                   	push   eax
  524a0b:	8b 4c 24 64          	mov    ecx,DWORD PTR [esp+0x64]
  524a0f:	e8 5c 15 ef ff       	call   0x415f70
  524a14:	a1 90 2f 97 00       	mov    eax,ds:0x972f90
  524a19:	50                   	push   eax
  524a1a:	57                   	push   edi
  524a1b:	56                   	push   esi
  524a1c:	e8 3f 2f 00 00       	call   0x527960
  524a21:	83 c4 14             	add    esp,0x14
  524a24:	5d                   	pop    ebp
  524a25:	5f                   	pop    edi
  524a26:	5e                   	pop    esi
  524a27:	5b                   	pop    ebx
  524a28:	81 c4 48 04 00 00    	add    esp,0x448
  524a2e:	c3                   	ret

# directCpuMetrics
Disassembly of section .text:

005279d0 <.text+0x1269d0>:
  5279d0:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  5279d4:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  5279d8:	8d 14 c8             	lea    edx,[eax+ecx*8]
  5279db:	33 c0                	xor    eax,eax
  5279dd:	66 8b 82 04 ff ff ff 	mov    ax,WORD PTR [edx-0xfc]
  5279e4:	8b 4c 24 08          	mov    ecx,DWORD PTR [esp+0x8]
  5279e8:	89 01                	mov    DWORD PTR [ecx],eax
  5279ea:	33 c0                	xor    eax,eax
  5279ec:	66 8b 82 06 ff ff ff 	mov    ax,WORD PTR [edx-0xfa]
  5279f3:	89 41 04             	mov    DWORD PTR [ecx+0x4],eax
  5279f6:	c3                   	ret

# directCpuGlyph
Disassembly of section .text:

00527a00 <.text+0x126a00>:
  527a00:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  527a04:	56                   	push   esi
  527a05:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  527a09:	8d b4 c8 00 ff ff ff 	lea    esi,[eax+ecx*8-0x100]
  527a10:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  527a14:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  527a18:	56                   	push   esi
  527a19:	51                   	push   ecx
  527a1a:	50                   	push   eax
  527a1b:	e8 c0 2d 00 00       	call   0x52a7e0
  527a20:	83 c4 0c             	add    esp,0xc
  527a23:	33 c0                	xor    eax,eax
  527a25:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  527a29:	5e                   	pop    esi
  527a2a:	c3                   	ret
