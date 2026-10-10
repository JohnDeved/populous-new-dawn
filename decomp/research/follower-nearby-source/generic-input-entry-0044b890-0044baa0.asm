
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044b890 <.text+0x4a890>:
  44b890:	0f bf 05 16 43 68 00 	movsx  eax,WORD PTR ds:0x684316
  44b897:	53                   	push   ebx
  44b898:	8b c8                	mov    ecx,eax
  44b89a:	c1 e0 03             	shl    eax,0x3
  44b89d:	56                   	push   esi
  44b89e:	57                   	push   edi
  44b89f:	2b c1                	sub    eax,ecx
  44b8a1:	55                   	push   ebp
  44b8a2:	03 c0                	add    eax,eax
  44b8a4:	0f bf 84 c1 97 45 68 	movsx  eax,WORD PTR [ecx+eax*8+0x684597]
  44b8ab:	00 
  44b8ac:	8b c8                	mov    ecx,eax
  44b8ae:	c1 e0 06             	shl    eax,0x6
  44b8b1:	2b c1                	sub    eax,ecx
  44b8b3:	2b c1                	sub    eax,ecx
  44b8b5:	0f bf 80 9a 42 68 00 	movsx  eax,WORD PTR [eax+0x68429a]
  44b8bc:	8b c8                	mov    ecx,eax
  44b8be:	c1 e0 03             	shl    eax,0x3
  44b8c1:	2b c1                	sub    eax,ecx
  44b8c3:	03 c0                	add    eax,eax
  44b8c5:	8d 84 c1 2c 45 68 00 	lea    eax,[ecx+eax*8+0x68452c]
  44b8cc:	3d 2c 45 68 00       	cmp    eax,0x68452c
  44b8d1:	74 2c                	je     0x44b8ff
  44b8d3:	33 d2                	xor    edx,edx
  44b8d5:	be 05 00 00 00       	mov    esi,0x5
  44b8da:	38 50 2a             	cmp    BYTE PTR [eax+0x2a],dl
  44b8dd:	74 05                	je     0x44b8e4
  44b8df:	39 70 22             	cmp    DWORD PTR [eax+0x22],esi
  44b8e2:	74 20                	je     0x44b904
  44b8e4:	0f bf 48 6d          	movsx  ecx,WORD PTR [eax+0x6d]
  44b8e8:	8b c1                	mov    eax,ecx
  44b8ea:	c1 e1 03             	shl    ecx,0x3
  44b8ed:	2b c8                	sub    ecx,eax
  44b8ef:	03 c9                	add    ecx,ecx
  44b8f1:	8d 84 c8 2c 45 68 00 	lea    eax,[eax+ecx*8+0x68452c]
  44b8f8:	3d 2c 45 68 00       	cmp    eax,0x68452c
  44b8fd:	75 db                	jne    0x44b8da
  44b8ff:	5d                   	pop    ebp
  44b900:	5f                   	pop    edi
  44b901:	5e                   	pop    esi
  44b902:	5b                   	pop    ebx
  44b903:	c3                   	ret
  44b904:	c6 40 2a 00          	mov    BYTE PTR [eax+0x2a],0x0
  44b908:	8b 40 5b             	mov    eax,DWORD PTR [eax+0x5b]
  44b90b:	85 c0                	test   eax,eax
  44b90d:	74 f0                	je     0x44b8ff
  44b90f:	b9 01 00 00 00       	mov    ecx,0x1
  44b914:	39 0d 08 45 68 00    	cmp    DWORD PTR ds:0x684508,ecx
  44b91a:	7c 15                	jl     0x44b931
  44b91c:	ba 22 42 68 00       	mov    edx,0x684222
  44b921:	39 02                	cmp    DWORD PTR [edx],eax
  44b923:	74 0f                	je     0x44b934
  44b925:	83 c2 06             	add    edx,0x6
  44b928:	41                   	inc    ecx
  44b929:	3b 0d 08 45 68 00    	cmp    ecx,DWORD PTR ds:0x684508
  44b92f:	7e f0                	jle    0x44b921
  44b931:	66 33 c9             	xor    cx,cx
  44b934:	66 85 c9             	test   cx,cx
  44b937:	74 c6                	je     0x44b8ff
  44b939:	0f bf c1             	movsx  eax,cx
  44b93c:	8d 14 40             	lea    edx,[eax+eax*2]
  44b93f:	0f bf 0c 55 20 42 68 	movsx  ecx,WORD PTR [edx*2+0x684220]
  44b946:	00 
  44b947:	8b c1                	mov    eax,ecx
  44b949:	c1 e1 06             	shl    ecx,0x6
  44b94c:	2b c8                	sub    ecx,eax
  44b94e:	2b c8                	sub    ecx,eax
  44b950:	8d b1 5e 42 68 00    	lea    esi,[ecx+0x68425e]
  44b956:	83 7e 2e 00          	cmp    DWORD PTR [esi+0x2e],0x0
  44b95a:	74 a3                	je     0x44b8ff
  44b95c:	c7 46 2e 00 00 00 00 	mov    DWORD PTR [esi+0x2e],0x0
  44b963:	0f bf 46 3c          	movsx  eax,WORD PTR [esi+0x3c]
  44b967:	8b c8                	mov    ecx,eax
  44b969:	c1 e0 03             	shl    eax,0x3
  44b96c:	2b c1                	sub    eax,ecx
  44b96e:	03 c0                	add    eax,eax
  44b970:	8d 84 c1 2c 45 68 00 	lea    eax,[ecx+eax*8+0x68452c]
  44b977:	3d 2c 45 68 00       	cmp    eax,0x68452c
  44b97c:	74 28                	je     0x44b9a6
  44b97e:	83 78 04 00          	cmp    DWORD PTR [eax+0x4],0x0
  44b982:	74 07                	je     0x44b98b
  44b984:	c7 40 04 00 00 00 00 	mov    DWORD PTR [eax+0x4],0x0
  44b98b:	0f bf 48 6d          	movsx  ecx,WORD PTR [eax+0x6d]
  44b98f:	8b c1                	mov    eax,ecx
  44b991:	c1 e1 03             	shl    ecx,0x3
  44b994:	2b c8                	sub    ecx,eax
  44b996:	03 c9                	add    ecx,ecx
  44b998:	8d 84 c8 2c 45 68 00 	lea    eax,[eax+ecx*8+0x68452c]
  44b99f:	3d 2c 45 68 00       	cmp    eax,0x68452c
  44b9a4:	75 d8                	jne    0x44b97e
  44b9a6:	8b 06                	mov    eax,DWORD PTR [esi]
  44b9a8:	b9 01 00 00 00       	mov    ecx,0x1
  44b9ad:	39 0d 08 45 68 00    	cmp    DWORD PTR ds:0x684508,ecx
  44b9b3:	7c 15                	jl     0x44b9ca
  44b9b5:	ba 22 42 68 00       	mov    edx,0x684222
  44b9ba:	39 02                	cmp    DWORD PTR [edx],eax
  44b9bc:	74 0f                	je     0x44b9cd
  44b9be:	83 c2 06             	add    edx,0x6
  44b9c1:	41                   	inc    ecx
  44b9c2:	39 0d 08 45 68 00    	cmp    DWORD PTR ds:0x684508,ecx
  44b9c8:	7d f0                	jge    0x44b9ba
  44b9ca:	66 33 c9             	xor    cx,cx
  44b9cd:	66 85 c9             	test   cx,cx
  44b9d0:	74 65                	je     0x44ba37
  44b9d2:	0f bf c1             	movsx  eax,cx
  44b9d5:	8b 15 08 45 68 00    	mov    edx,DWORD PTR ds:0x684508
  44b9db:	4a                   	dec    edx
  44b9dc:	3b c2                	cmp    eax,edx
  44b9de:	7d 30                	jge    0x44ba10
  44b9e0:	0f bf c1             	movsx  eax,cx
  44b9e3:	66 41                	inc    cx
  44b9e5:	8d 04 40             	lea    eax,[eax+eax*2]
  44b9e8:	03 c0                	add    eax,eax
  44b9ea:	8d 90 22 42 68 00    	lea    edx,[eax+0x684222]
  44b9f0:	8d b8 1c 42 68 00    	lea    edi,[eax+0x68421c]
  44b9f6:	8b 02                	mov    eax,DWORD PTR [edx]
  44b9f8:	89 07                	mov    DWORD PTR [edi],eax
  44b9fa:	66 8b 52 04          	mov    dx,WORD PTR [edx+0x4]
  44b9fe:	0f bf c1             	movsx  eax,cx
  44ba01:	66 89 57 04          	mov    WORD PTR [edi+0x4],dx
  44ba05:	8b 15 08 45 68 00    	mov    edx,DWORD PTR ds:0x684508
  44ba0b:	4a                   	dec    edx
  44ba0c:	3b c2                	cmp    eax,edx
  44ba0e:	7c d0                	jl     0x44b9e0
  44ba10:	33 c9                	xor    ecx,ecx
  44ba12:	ff 0d 08 45 68 00    	dec    DWORD PTR ds:0x684508
  44ba18:	a1 08 45 68 00       	mov    eax,ds:0x684508
  44ba1d:	8d 14 40             	lea    edx,[eax+eax*2]
  44ba20:	89 0c 55 1c 42 68 00 	mov    DWORD PTR [edx*2+0x68421c],ecx
  44ba27:	a1 08 45 68 00       	mov    eax,ds:0x684508
  44ba2c:	8d 14 40             	lea    edx,[eax+eax*2]
  44ba2f:	66 89 0c 55 20 42 68 	mov    WORD PTR [edx*2+0x684220],cx
  44ba36:	00 
  44ba37:	ba 01 00 00 00       	mov    edx,0x1
  44ba3c:	39 15 08 45 68 00    	cmp    DWORD PTR ds:0x684508,edx
  44ba42:	7c 3d                	jl     0x44ba81
  44ba44:	bf 26 42 68 00       	mov    edi,0x684226
  44ba49:	0f bf 07             	movsx  eax,WORD PTR [edi]
  44ba4c:	8b c8                	mov    ecx,eax
  44ba4e:	c1 e0 06             	shl    eax,0x6
  44ba51:	2b c1                	sub    eax,ecx
  44ba53:	2b c1                	sub    eax,ecx
  44ba55:	8d 88 5e 42 68 00    	lea    ecx,[eax+0x68425e]
  44ba5b:	8b 80 8c 42 68 00    	mov    eax,DWORD PTR [eax+0x68428c]
  44ba61:	83 f8 02             	cmp    eax,0x2
  44ba64:	74 05                	je     0x44ba6b
  44ba66:	83 f8 01             	cmp    eax,0x1
  44ba69:	75 0a                	jne    0x44ba75
  44ba6b:	66 8b 46 38          	mov    ax,WORD PTR [esi+0x38]
  44ba6f:	66 39 41 36          	cmp    WORD PTR [ecx+0x36],ax
  44ba73:	74 0f                	je     0x44ba84
  44ba75:	83 c7 06             	add    edi,0x6
  44ba78:	42                   	inc    edx
  44ba79:	39 15 08 45 68 00    	cmp    DWORD PTR ds:0x684508,edx
  44ba7f:	7d c8                	jge    0x44ba49
  44ba81:	66 33 d2             	xor    dx,dx
  44ba84:	66 85 d2             	test   dx,dx
  44ba87:	0f 84 72 fe ff ff    	je     0x44b8ff
  44ba8d:	0f bf c2             	movsx  eax,dx
  44ba90:	8d 0c 40             	lea    ecx,[eax+eax*2]
  44ba93:	0f bf 04 4d 20 42 68 	movsx  eax,WORD PTR [ecx*2+0x684220]
  44ba9a:	00 
  44ba9b:	8b c8                	mov    ecx,eax
  44ba9d:	bb                   	.byte 0xbb
  44ba9e:	01 00                	add    DWORD PTR [eax],eax
