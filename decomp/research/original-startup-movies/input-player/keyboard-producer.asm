
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0052c880 <.text+0x12b880>:
  52c880:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  52c886:	55                   	push   ebp
  52c887:	8b ec                	mov    ebp,esp
  52c889:	6a ff                	push   0xffffffff
  52c88b:	68 b4 cb 52 00       	push   0x52cbb4
  52c890:	50                   	push   eax
  52c891:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  52c898:	81 ec e4 00 00 00    	sub    esp,0xe4
  52c89e:	c7 45 ec 00 00 00 00 	mov    DWORD PTR [ebp-0x14],0x0
  52c8a5:	c7 45 f0 00 00 00 00 	mov    DWORD PTR [ebp-0x10],0x0
  52c8ac:	56                   	push   esi
  52c8ad:	57                   	push   edi
  52c8ae:	6a 00                	push   0x0
  52c8b0:	6a 00                	push   0x0
  52c8b2:	6a 00                	push   0x0
  52c8b4:	6a 00                	push   0x0
  52c8b6:	ff 15 c4 c6 d0 00    	call   DWORD PTR ds:0xd0c6c4
  52c8bc:	89 45 e8             	mov    DWORD PTR [ebp-0x18],eax
  52c8bf:	85 c0                	test   eax,eax
  52c8c1:	75 0a                	jne    0x52c8cd
  52c8c3:	b8 01 00 00 00       	mov    eax,0x1
  52c8c8:	e9 d5 02 00 00       	jmp    0x52cba2
  52c8cd:	6a 00                	push   0x0
  52c8cf:	8d 45 ec             	lea    eax,[ebp-0x14]
  52c8d2:	50                   	push   eax
  52c8d3:	68 00 05 00 00       	push   0x500
  52c8d8:	e8 03 de ff ff       	call   0x52a6e0
  52c8dd:	50                   	push   eax
  52c8de:	e8 55 86 05 00       	call   0x584f38
  52c8e3:	85 c0                	test   eax,eax
  52c8e5:	74 14                	je     0x52c8fb
  52c8e7:	8b 45 e8             	mov    eax,DWORD PTR [ebp-0x18]
  52c8ea:	50                   	push   eax
  52c8eb:	ff 15 a4 c7 d0 00    	call   DWORD PTR ds:0xd0c7a4
  52c8f1:	b8 01 00 00 00       	mov    eax,0x1
  52c8f6:	e9 a7 02 00 00       	jmp    0x52cba2
  52c8fb:	6a 00                	push   0x0
  52c8fd:	8d 45 f0             	lea    eax,[ebp-0x10]
  52c900:	50                   	push   eax
  52c901:	8b 4d ec             	mov    ecx,DWORD PTR [ebp-0x14]
  52c904:	8b 01                	mov    eax,DWORD PTR [ecx]
  52c906:	68 48 09 59 00       	push   0x590948
  52c90b:	51                   	push   ecx
  52c90c:	ff 50 0c             	call   DWORD PTR [eax+0xc]
  52c90f:	85 c0                	test   eax,eax
  52c911:	74 1d                	je     0x52c930
  52c913:	8b 45 e8             	mov    eax,DWORD PTR [ebp-0x18]
  52c916:	50                   	push   eax
  52c917:	ff 15 a4 c7 d0 00    	call   DWORD PTR ds:0xd0c7a4
  52c91d:	8b 4d ec             	mov    ecx,DWORD PTR [ebp-0x14]
  52c920:	51                   	push   ecx
  52c921:	8b 01                	mov    eax,DWORD PTR [ecx]
  52c923:	ff 50 08             	call   DWORD PTR [eax+0x8]
  52c926:	b8 01 00 00 00       	mov    eax,0x1
  52c92b:	e9 72 02 00 00       	jmp    0x52cba2
  52c930:	6a 06                	push   0x6
  52c932:	e8 c9 dd ff ff       	call   0x52a700
  52c937:	50                   	push   eax
  52c938:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  52c93b:	50                   	push   eax
  52c93c:	8b 30                	mov    esi,DWORD PTR [eax]
  52c93e:	ff 56 34             	call   DWORD PTR [esi+0x34]
  52c941:	68 20 4f 58 00       	push   0x584f20
  52c946:	8b 4d f0             	mov    ecx,DWORD PTR [ebp-0x10]
  52c949:	51                   	push   ecx
  52c94a:	8b 01                	mov    eax,DWORD PTR [ecx]
  52c94c:	ff 50 2c             	call   DWORD PTR [eax+0x2c]
  52c94f:	33 c0                	xor    eax,eax
  52c951:	8d 4d b0             	lea    ecx,[ebp-0x50]
  52c954:	89 45 b8             	mov    DWORD PTR [ebp-0x48],eax
  52c957:	89 45 bc             	mov    DWORD PTR [ebp-0x44],eax
  52c95a:	51                   	push   ecx
  52c95b:	8b 55 f0             	mov    edx,DWORD PTR [ebp-0x10]
  52c95e:	c7 45 c0 20 00 00 00 	mov    DWORD PTR [ebp-0x40],0x20
  52c965:	c7 45 b0 14 00 00 00 	mov    DWORD PTR [ebp-0x50],0x14
  52c96c:	c7 45 b4 10 00 00 00 	mov    DWORD PTR [ebp-0x4c],0x10
  52c973:	6a 01                	push   0x1
  52c975:	8b 02                	mov    eax,DWORD PTR [edx]
  52c977:	52                   	push   edx
  52c978:	ff 50 18             	call   DWORD PTR [eax+0x18]
  52c97b:	8b 4d e8             	mov    ecx,DWORD PTR [ebp-0x18]
  52c97e:	8b 55 f0             	mov    edx,DWORD PTR [ebp-0x10]
  52c981:	8b 02                	mov    eax,DWORD PTR [edx]
  52c983:	51                   	push   ecx
  52c984:	52                   	push   edx
  52c985:	ff 50 30             	call   DWORD PTR [eax+0x30]
  52c988:	85 c0                	test   eax,eax
  52c98a:	74 26                	je     0x52c9b2
  52c98c:	8b 45 e8             	mov    eax,DWORD PTR [ebp-0x18]
  52c98f:	50                   	push   eax
  52c990:	ff 15 a4 c7 d0 00    	call   DWORD PTR ds:0xd0c7a4
  52c996:	8b 4d f0             	mov    ecx,DWORD PTR [ebp-0x10]
  52c999:	51                   	push   ecx
  52c99a:	8b 01                	mov    eax,DWORD PTR [ecx]
  52c99c:	ff 50 08             	call   DWORD PTR [eax+0x8]
  52c99f:	8b 4d ec             	mov    ecx,DWORD PTR [ebp-0x14]
  52c9a2:	51                   	push   ecx
  52c9a3:	8b 01                	mov    eax,DWORD PTR [ecx]
  52c9a5:	ff 50 08             	call   DWORD PTR [eax+0x8]
  52c9a8:	b8 01 00 00 00       	mov    eax,0x1
  52c9ad:	e9 f0 01 00 00       	jmp    0x52cba2
  52c9b2:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  52c9b5:	b9 58 5e d0 00       	mov    ecx,0xd05e58
  52c9ba:	50                   	push   eax
  52c9bb:	68 10 c8 52 00       	push   0x52c810
  52c9c0:	6a 06                	push   0x6
  52c9c2:	e8 e9 f5 ff ff       	call   0x52bfb0
  52c9c7:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  52c9ca:	b9 58 5e d0 00       	mov    ecx,0xd05e58
  52c9cf:	50                   	push   eax
  52c9d0:	68 10 c8 52 00       	push   0x52c810
  52c9d5:	6a 07                	push   0x7
  52c9d7:	e8 d4 f5 ff ff       	call   0x52bfb0
  52c9dc:	6a 01                	push   0x1
  52c9de:	8b 4d 08             	mov    ecx,DWORD PTR [ebp+0x8]
  52c9e1:	8d bd 10 ff ff ff    	lea    edi,[ebp-0xf0]
  52c9e7:	e8 a4 0c 00 00       	call   0x52d690
  52c9ec:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  52c9ef:	50                   	push   eax
  52c9f0:	8b 30                	mov    esi,DWORD PTR [eax]
  52c9f2:	ff 56 1c             	call   DWORD PTR [esi+0x1c]
  52c9f5:	33 c0                	xor    eax,eax
  52c9f7:	b9 28 00 00 00       	mov    ecx,0x28
  52c9fc:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  52c9fe:	8b 4d 08             	mov    ecx,DWORD PTR [ebp+0x8]
  52ca01:	e8 7a 0c 00 00       	call   0x52d680
  52ca06:	85 c0                	test   eax,eax
  52ca08:	0f 85 2e 01 00 00    	jne    0x52cb3c
  52ca0e:	68 c8 00 00 00       	push   0xc8
  52ca13:	8b 45 e8             	mov    eax,DWORD PTR [ebp-0x18]
  52ca16:	50                   	push   eax
  52ca17:	ff 15 cc c6 d0 00    	call   DWORD PTR ds:0xd0c6cc
  52ca1d:	85 c0                	test   eax,eax
  52ca1f:	0f 85 07 01 00 00    	jne    0x52cb2c
  52ca25:	8d bd 10 ff ff ff    	lea    edi,[ebp-0xf0]
  52ca2b:	33 c0                	xor    eax,eax
  52ca2d:	b9 28 00 00 00       	mov    ecx,0x28
  52ca32:	50                   	push   eax
  52ca33:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  52ca35:	8d 45 e4             	lea    eax,[ebp-0x1c]
  52ca38:	8d 8d 10 ff ff ff    	lea    ecx,[ebp-0xf0]
  52ca3e:	50                   	push   eax
  52ca3f:	8b 55 f0             	mov    edx,DWORD PTR [ebp-0x10]
  52ca42:	c7 45 e4 0a 00 00 00 	mov    DWORD PTR [ebp-0x1c],0xa
  52ca49:	51                   	push   ecx
  52ca4a:	8b 02                	mov    eax,DWORD PTR [edx]
  52ca4c:	6a 10                	push   0x10
  52ca4e:	52                   	push   edx
  52ca4f:	ff 50 28             	call   DWORD PTR [eax+0x28]
  52ca52:	3d 1e 00 07 80       	cmp    eax,0x8007001e
  52ca57:	75 0e                	jne    0x52ca67
  52ca59:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  52ca5c:	50                   	push   eax
  52ca5d:	8b 30                	mov    esi,DWORD PTR [eax]
  52ca5f:	ff 56 1c             	call   DWORD PTR [esi+0x1c]
  52ca62:	e9 c5 00 00 00       	jmp    0x52cb2c
  52ca67:	85 c0                	test   eax,eax
  52ca69:	74 09                	je     0x52ca74
  52ca6b:	83 f8 01             	cmp    eax,0x1
  52ca6e:	0f 85 b8 00 00 00    	jne    0x52cb2c
  52ca74:	c6 45 d4 01          	mov    BYTE PTR [ebp-0x2c],0x1
  52ca78:	c6 45 d8 00          	mov    BYTE PTR [ebp-0x28],0x0
  52ca7c:	c7 45 d0 00 00 00 00 	mov    DWORD PTR [ebp-0x30],0x0
  52ca83:	83 7d e4 00          	cmp    DWORD PTR [ebp-0x1c],0x0
  52ca87:	0f 8e 9f 00 00 00    	jle    0x52cb2c
  52ca8d:	8d 85 10 ff ff ff    	lea    eax,[ebp-0xf0]
  52ca93:	89 45 e0             	mov    DWORD PTR [ebp-0x20],eax
  52ca96:	8b 45 e0             	mov    eax,DWORD PTR [ebp-0x20]
  52ca99:	8b 4d e0             	mov    ecx,DWORD PTR [ebp-0x20]
  52ca9c:	8a 00                	mov    al,BYTE PTR [eax]
  52ca9e:	88 45 d6             	mov    BYTE PTR [ebp-0x2a],al
  52caa1:	8b 41 04             	mov    eax,DWORD PTR [ecx+0x4]
  52caa4:	25 80 00 00 00       	and    eax,0x80
  52caa9:	c1 e8 07             	shr    eax,0x7
  52caac:	83 7d 08 00          	cmp    DWORD PTR [ebp+0x8],0x0
  52cab0:	88 45 d7             	mov    BYTE PTR [ebp-0x29],al
  52cab3:	b8 00 00 00 00       	mov    eax,0x0
  52cab8:	74 06                	je     0x52cac0
  52caba:	8b 45 08             	mov    eax,DWORD PTR [ebp+0x8]
  52cabd:	83 c0 04             	add    eax,0x4
  52cac0:	6a 00                	push   0x0
  52cac2:	8d 4d c4             	lea    ecx,[ebp-0x3c]
  52cac5:	50                   	push   eax
  52cac6:	e8 d5 f2 ff ff       	call   0x52bda0
  52cacb:	6a 01                	push   0x1
  52cacd:	8d 4d c4             	lea    ecx,[ebp-0x3c]
  52cad0:	c7 45 fc 00 00 00 00 	mov    DWORD PTR [ebp-0x4],0x0
  52cad7:	e8 f4 f2 ff ff       	call   0x52bdd0
  52cadc:	85 c0                	test   eax,eax
  52cade:	74 17                	je     0x52caf7
  52cae0:	8a 4d d7             	mov    cl,BYTE PTR [ebp-0x29]
  52cae3:	33 d2                	xor    edx,edx
  52cae5:	8a 55 d6             	mov    dl,BYTE PTR [ebp-0x2a]
  52cae8:	8b 45 08             	mov    eax,DWORD PTR [ebp+0x8]
  52caeb:	88 4c 02 1c          	mov    BYTE PTR [edx+eax*1+0x1c],cl
  52caef:	8d 4d c4             	lea    ecx,[ebp-0x3c]
  52caf2:	e8 29 f3 ff ff       	call   0x52be20
  52caf7:	e8 24 9f ff ff       	call   0x526a20
  52cafc:	b9 40 59 d0 00       	mov    ecx,0xd05940
  52cb01:	88 45 d5             	mov    BYTE PTR [ebp-0x2b],al
  52cb04:	8d 45 d4             	lea    eax,[ebp-0x2c]
  52cb07:	50                   	push   eax
  52cb08:	e8 a3 fa ff ff       	call   0x52c5b0
  52cb0d:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  52cb14:	e8 a5 00 00 00       	call   0x52cbbe
  52cb19:	83 45 e0 10          	add    DWORD PTR [ebp-0x20],0x10
  52cb1d:	ff 45 d0             	inc    DWORD PTR [ebp-0x30]
  52cb20:	8b 45 d0             	mov    eax,DWORD PTR [ebp-0x30]
  52cb23:	3b 45 e4             	cmp    eax,DWORD PTR [ebp-0x1c]
  52cb26:	0f 8c 6a ff ff ff    	jl     0x52ca96
  52cb2c:	8b 4d 08             	mov    ecx,DWORD PTR [ebp+0x8]
  52cb2f:	e8 4c 0b 00 00       	call   0x52d680
  52cb34:	85 c0                	test   eax,eax
  52cb36:	0f 84 d2 fe ff ff    	je     0x52ca0e
