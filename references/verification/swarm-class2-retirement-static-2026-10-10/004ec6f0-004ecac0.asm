
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


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
  4ec70f:	38 15 bf ea 96 00    	cmp    BYTE PTR ds:0x96eabf,dl
  4ec715:	76 21                	jbe    0x4ec738
  4ec717:	b8 ec dd 89 00       	mov    eax,0x89ddec
  4ec71c:	8a 08                	mov    cl,BYTE PTR [eax]
  4ec71e:	84 c9                	test   cl,cl
  4ec720:	74 04                	je     0x4ec726
  4ec722:	fe c9                	dec    cl
  4ec724:	88 08                	mov    BYTE PTR [eax],cl
  4ec726:	05 65 0c 00 00       	add    eax,0xc65
  4ec72b:	42                   	inc    edx
  4ec72c:	33 c9                	xor    ecx,ecx
  4ec72e:	8a 0d bf ea 96 00    	mov    cl,BYTE PTR ds:0x96eabf
  4ec734:	3b ca                	cmp    ecx,edx
  4ec736:	7f e4                	jg     0x4ec71c
  4ec738:	b8 b6 57 95 00       	mov    eax,0x9557b6
  4ec73d:	33 c9                	xor    ecx,ecx
  4ec73f:	8b 15 80 f4 64 00    	mov    edx,DWORD PTR ds:0x64f480
  4ec745:	8b 1d 90 f4 64 00    	mov    ebx,DWORD PTR ds:0x64f490
  4ec74b:	89 08                	mov    DWORD PTR [eax],ecx
  4ec74d:	01 15 94 f4 64 00    	add    DWORD PTR ds:0x64f494,edx
  4ec753:	89 48 04             	mov    DWORD PTR [eax+0x4],ecx
  4ec756:	01 1d 9c f4 64 00    	add    DWORD PTR ds:0x64f49c,ebx
  4ec75c:	a1 84 f4 64 00       	mov    eax,ds:0x64f484
  4ec761:	89 0d 80 f4 64 00    	mov    DWORD PTR ds:0x64f480,ecx
  4ec767:	01 05 98 f4 64 00    	add    DWORD PTR ds:0x64f498,eax
  4ec76d:	89 0d 84 f4 64 00    	mov    DWORD PTR ds:0x64f484,ecx
  4ec773:	89 0d 88 f4 64 00    	mov    DWORD PTR ds:0x64f488,ecx
  4ec779:	89 0d 8c f4 64 00    	mov    DWORD PTR ds:0x64f48c,ecx
  4ec77f:	89 0d 90 f4 64 00    	mov    DWORD PTR ds:0x64f490,ecx
  4ec785:	88 0d 60 ce 89 00    	mov    BYTE PTR ds:0x89ce60,cl
  4ec78b:	f6 05 66 c6 89 00 02 	test   BYTE PTR ds:0x89c666,0x2
  4ec792:	75 13                	jne    0x4ec7a7
  4ec794:	f6 05 7c d1 89 00 20 	test   BYTE PTR ds:0x89d17c,0x20
  4ec79b:	75 0a                	jne    0x4ec7a7
  4ec79d:	e8 8e c6 f2 ff       	call   0x418e30
  4ec7a2:	e8 99 87 ff ff       	call   0x4e4f40
  4ec7a7:	be c8 d1 89 00       	mov    esi,0x89d1c8
  4ec7ac:	e8 7f ea f2 ff       	call   0x41b230
  4ec7b1:	bd 04 00 00 00       	mov    ebp,0x4
  4ec7b6:	e8 f5 a5 f4 ff       	call   0x436db0
  4ec7bb:	e8 30 73 fa ff       	call   0x493af0
  4ec7c0:	e8 eb fb ff ff       	call   0x4ec3b0
  4ec7c5:	8b 86 8d 08 00 00    	mov    eax,DWORD PTR [esi+0x88d]
  4ec7cb:	85 c0                	test   eax,eax
  4ec7cd:	74 19                	je     0x4ec7e8
  4ec7cf:	33 db                	xor    ebx,ebx
  4ec7d1:	8b 78 08             	mov    edi,DWORD PTR [eax+0x8]
  4ec7d4:	38 58 2a             	cmp    BYTE PTR [eax+0x2a],bl
  4ec7d7:	74 09                	je     0x4ec7e2
  4ec7d9:	50                   	push   eax
  4ec7da:	e8 21 48 01 00       	call   0x501000
  4ec7df:	83 c4 04             	add    esp,0x4
  4ec7e2:	8b c7                	mov    eax,edi
  4ec7e4:	85 ff                	test   edi,edi
  4ec7e6:	75 e9                	jne    0x4ec7d1
  4ec7e8:	81 c6 65 0c 00 00    	add    esi,0xc65
  4ec7ee:	4d                   	dec    ebp
  4ec7ef:	75 d4                	jne    0x4ec7c5
  4ec7f1:	a1 5c 03 89 00       	mov    eax,ds:0x89035c
  4ec7f6:	85 c0                	test   eax,eax
  4ec7f8:	74 12                	je     0x4ec80c
  4ec7fa:	8b 70 08             	mov    esi,DWORD PTR [eax+0x8]
  4ec7fd:	50                   	push   eax
  4ec7fe:	e8 2d be 02 00       	call   0x518630
  4ec803:	83 c4 04             	add    esp,0x4
  4ec806:	8b c6                	mov    eax,esi
  4ec808:	85 f6                	test   esi,esi
  4ec80a:	75 ee                	jne    0x4ec7fa
  4ec80c:	6a 00                	push   0x0
  4ec80e:	e8 3d d6 f9 ff       	call   0x489e50
  4ec813:	83 c4 04             	add    esp,0x4
  4ec816:	8b 35 58 03 89 00    	mov    esi,DWORD PTR ds:0x890358
  4ec81c:	85 f6                	test   esi,esi
  4ec81e:	74 6e                	je     0x4ec88e
  4ec820:	33 db                	xor    ebx,ebx
  4ec822:	bd 00 80 00 00       	mov    ebp,0x8000
  4ec827:	8b 7e 08             	mov    edi,DWORD PTR [esi+0x8]
  4ec82a:	38 1d 60 ce 89 00    	cmp    BYTE PTR ds:0x89ce60,bl
  4ec830:	75 44                	jne    0x4ec876
  4ec832:	a0 f0 c6 89 00       	mov    al,ds:0x89c6f0
  4ec837:	38 46 69             	cmp    BYTE PTR [esi+0x69],al
  4ec83a:	74 05                	je     0x4ec841
  4ec83c:	38 46 6a             	cmp    BYTE PTR [esi+0x6a],al
  4ec83f:	75 35                	jne    0x4ec876
  4ec841:	c6 05 60 ce 89 00 01 	mov    BYTE PTR ds:0x89ce60,0x1
  4ec848:	8d 46 3d             	lea    eax,[esi+0x3d]
  4ec84b:	50                   	push   eax
  4ec84c:	e8 ff 83 f1 ff       	call   0x404c50
  4ec851:	66 a3 e5 c6 89 00    	mov    ds:0x89c6e5,ax
  4ec857:	83 c4 04             	add    esp,0x4
  4ec85a:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4ec861:	8b c8                	mov    ecx,eax
  4ec863:	8d 14 80             	lea    edx,[eax+eax*4]
  4ec866:	8d 04 51             	lea    eax,[ecx+edx*2]
  4ec869:	8d 14 c0             	lea    edx,[eax+eax*8]
  4ec86c:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4ec86f:	09 ac 81 05 db 89 00 	or     DWORD PTR [ecx+eax*4+0x89db05],ebp
  4ec876:	56                   	push   esi
  4ec877:	e8 34 c7 02 00       	call   0x518fb0
  4ec87c:	83 c4 04             	add    esp,0x4
  4ec87f:	56                   	push   esi
  4ec880:	e8 cb d5 f9 ff       	call   0x489e50
  4ec885:	83 c4 04             	add    esp,0x4
  4ec888:	8b f7                	mov    esi,edi
  4ec88a:	85 ff                	test   edi,edi
  4ec88c:	75 99                	jne    0x4ec827
  4ec88e:	6a 01                	push   0x1
  4ec890:	e8 bb d5 f9 ff       	call   0x489e50
  4ec895:	83 c4 04             	add    esp,0x4
  4ec898:	a1 24 03 89 00       	mov    eax,ds:0x890324
  4ec89d:	83 0d 69 c6 89 00 40 	or     DWORD PTR ds:0x89c669,0x40
  4ec8a4:	85 c0                	test   eax,eax
  4ec8a6:	74 1c                	je     0x4ec8c4
  4ec8a8:	33 db                	xor    ebx,ebx
  4ec8aa:	8b 70 04             	mov    esi,DWORD PTR [eax+0x4]
  4ec8ad:	38 58 2c             	cmp    BYTE PTR [eax+0x2c],bl
  4ec8b0:	74 0c                	je     0x4ec8be
  4ec8b2:	50                   	push   eax
  4ec8b3:	fe 40 2e             	inc    BYTE PTR [eax+0x2e]
  4ec8b6:	e8 45 0e 00 00       	call   0x4ed700
  4ec8bb:	83 c4 04             	add    esp,0x4
  4ec8be:	8b c6                	mov    eax,esi
  4ec8c0:	85 f6                	test   esi,esi
  4ec8c2:	75 e6                	jne    0x4ec8aa
  4ec8c4:	83 25 69 c6 89 00 bf 	and    DWORD PTR ds:0x89c669,0xffffffbf
  4ec8cb:	a1 60 03 89 00       	mov    eax,ds:0x890360
  4ec8d0:	85 c0                	test   eax,eax
  4ec8d2:	74 46                	je     0x4ec91a
  4ec8d4:	8b 70 08             	mov    esi,DWORD PTR [eax+0x8]
  4ec8d7:	33 c9                	xor    ecx,ecx
  4ec8d9:	8a 48 2a             	mov    cl,BYTE PTR [eax+0x2a]
  4ec8dc:	83 e9 02             	sub    ecx,0x2
  4ec8df:	83 f9 08             	cmp    ecx,0x8
  4ec8e2:	77 30                	ja     0x4ec914
  4ec8e4:	33 d2                	xor    edx,edx
  4ec8e6:	8a 91 80 ca 4e 00    	mov    dl,BYTE PTR [ecx+0x4eca80]
  4ec8ec:	ff 24 95 6c ca 4e 00 	jmp    DWORD PTR [edx*4+0x4eca6c]
  4ec8f3:	50                   	push   eax
  4ec8f4:	e8 87 69 f1 ff       	call   0x403280
  4ec8f9:	eb 16                	jmp    0x4ec911
  4ec8fb:	50                   	push   eax
  4ec8fc:	e8 df c5 f8 ff       	call   0x478ee0
  4ec901:	eb 0e                	jmp    0x4ec911
  4ec903:	50                   	push   eax
  4ec904:	e8 27 f6 fc ff       	call   0x4bbf30
  4ec909:	eb 06                	jmp    0x4ec911
  4ec90b:	50                   	push   eax
  4ec90c:	e8 9f 5f 01 00       	call   0x5028b0
  4ec911:	83 c4 04             	add    esp,0x4
  4ec914:	8b c6                	mov    eax,esi
  4ec916:	85 f6                	test   esi,esi
  4ec918:	75 ba                	jne    0x4ec8d4
  4ec91a:	e8 d1 2e 00 00       	call   0x4ef7f0
  4ec91f:	e8 3c 3b 00 00       	call   0x4f0460
  4ec924:	a1 30 03 89 00       	mov    eax,ds:0x890330
  4ec929:	85 c0                	test   eax,eax
  4ec92b:	74 15                	je     0x4ec942
  4ec92d:	8b 70 04             	mov    esi,DWORD PTR [eax+0x4]
  4ec930:	50                   	push   eax
  4ec931:	fe 40 2e             	inc    BYTE PTR [eax+0x2e]
  4ec934:	e8 c7 0d 00 00       	call   0x4ed700
  4ec939:	83 c4 04             	add    esp,0x4
  4ec93c:	8b c6                	mov    eax,esi
  4ec93e:	85 f6                	test   esi,esi
  4ec940:	75 eb                	jne    0x4ec92d
  4ec942:	e8 79 01 00 00       	call   0x4ecac0
  4ec947:	e8 04 4a f1 ff       	call   0x401350
  4ec94c:	83 3d 28 03 89 00 00 	cmp    DWORD PTR ds:0x890328,0x0
  4ec953:	74 38                	je     0x4ec98d
  4ec955:	8b 3d 28 03 89 00    	mov    edi,DWORD PTR ds:0x890328
  4ec95b:	be 80 02 00 00       	mov    esi,0x280
  4ec960:	8b 5f 04             	mov    ebx,DWORD PTR [edi+0x4]
  4ec963:	fe 4f 2e             	dec    BYTE PTR [edi+0x2e]
  4ec966:	75 1f                	jne    0x4ec987
  4ec968:	83 67 0c fe          	and    DWORD PTR [edi+0xc],0xfffffffe
  4ec96c:	57                   	push   edi
  4ec96d:	e8 ce 51 f1 ff       	call   0x401b40
  4ec972:	83 c4 04             	add    esp,0x4
  4ec975:	ff 0d 51 c6 89 00    	dec    DWORD PTR ds:0x89c651
  4ec97b:	66 39 77 24          	cmp    WORD PTR [edi+0x24],si
  4ec97f:	73 06                	jae    0x4ec987
  4ec981:	ff 0d 59 c6 89 00    	dec    DWORD PTR ds:0x89c659
  4ec987:	8b fb                	mov    edi,ebx
  4ec989:	85 db                	test   ebx,ebx
  4ec98b:	75 d3                	jne    0x4ec960
  4ec98d:	e8 ce 7c 01 00       	call   0x504660
  4ec992:	80 3d ce ea 96 00 00 	cmp    BYTE PTR ds:0x96eace,0x0
  4ec999:	74 15                	je     0x4ec9b0
  4ec99b:	a0 ce ea 96 00       	mov    al,ds:0x96eace
  4ec9a0:	50                   	push   eax
  4ec9a1:	e8 ea 56 01 00       	call   0x502090
  4ec9a6:	c6 05 ce ea 96 00 00 	mov    BYTE PTR ds:0x96eace,0x0
  4ec9ad:	83 c4 04             	add    esp,0x4
  4ec9b0:	e8 6b f6 00 00       	call   0x4fc020
  4ec9b5:	32 c9                	xor    cl,cl
  4ec9b7:	66 83 3d 8a 9e 96 00 	cmp    WORD PTR ds:0x969e8a,0x0
  4ec9be:	00 
  4ec9bf:	74 2f                	je     0x4ec9f0
  4ec9c1:	33 c0                	xor    eax,eax
  4ec9c3:	66 a1 8a 9e 96 00    	mov    ax,ds:0x969e8a
  4ec9c9:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  4ec9d0:	85 c0                	test   eax,eax
  4ec9d2:	74 0f                	je     0x4ec9e3
  4ec9d4:	80 78 2a 01          	cmp    BYTE PTR [eax+0x2a],0x1
  4ec9d8:	75 09                	jne    0x4ec9e3
  4ec9da:	66 83 78 6e 00       	cmp    WORD PTR [eax+0x6e],0x0
  4ec9df:	7e 02                	jle    0x4ec9e3
  4ec9e1:	b1 01                	mov    cl,0x1
  4ec9e3:	84 c9                	test   cl,cl
  4ec9e5:	75 09                	jne    0x4ec9f0
  4ec9e7:	66 c7 05 8a 9e 96 00 	mov    WORD PTR ds:0x969e8a,0x0
  4ec9ee:	00 00 
  4ec9f0:	e8 4b 01 f3 ff       	call   0x41cb40
  4ec9f5:	e8 46 15 f6 ff       	call   0x44df40
  4ec9fa:	e8 d1 41 00 00       	call   0x4f0bd0
  4ec9ff:	e8 fc 43 00 00       	call   0x4f0e00
  4eca04:	e8 87 f9 ff ff       	call   0x4ec390
  4eca09:	e8 62 40 f6 ff       	call   0x450a70
  4eca0e:	e8 3d db f2 ff       	call   0x41a550
  4eca13:	e8 b8 fc f2 ff       	call   0x41c6d0
  4eca18:	e8 a3 78 00 00       	call   0x4f42c0
  4eca1d:	83 3d bb 5d 89 00 00 	cmp    DWORD PTR ds:0x895dbb,0x0
  4eca24:	74 41                	je     0x4eca67
  4eca26:	33 c9                	xor    ecx,ecx
  4eca28:	a1 bb 5d 89 00       	mov    eax,ds:0x895dbb
  4eca2d:	8a 0d 67 d1 89 00    	mov    cl,BYTE PTR ds:0x89d167
  4eca33:	5d                   	pop    ebp
  4eca34:	5f                   	pop    edi
  4eca35:	89 48 08             	mov    DWORD PTR [eax+0x8],ecx
  4eca38:	5e                   	pop    esi
  4eca39:	5b                   	pop    ebx
  4eca3a:	c3                   	ret
  4eca3b:	a1 24 03 89 00       	mov    eax,ds:0x890324
  4eca40:	85 c0                	test   eax,eax
  4eca42:	74 0d                	je     0x4eca51
  4eca44:	66 81 60 35 fe ff    	and    WORD PTR [eax+0x35],0xfffe
  4eca4a:	8b 40 04             	mov    eax,DWORD PTR [eax+0x4]
  4eca4d:	85 c0                	test   eax,eax
  4eca4f:	75 f3                	jne    0x4eca44
  4eca51:	a1 30 03 89 00       	mov    eax,ds:0x890330
  4eca56:	85 c0                	test   eax,eax
  4eca58:	74 0d                	je     0x4eca67
  4eca5a:	66 81 60 35 fe ff    	and    WORD PTR [eax+0x35],0xfffe
  4eca60:	8b 40 04             	mov    eax,DWORD PTR [eax+0x4]
  4eca63:	85 c0                	test   eax,eax
  4eca65:	75 f3                	jne    0x4eca5a
  4eca67:	5d                   	pop    ebp
  4eca68:	5f                   	pop    edi
  4eca69:	5e                   	pop    esi
  4eca6a:	5b                   	pop    ebx
  4eca6b:	c3                   	ret
  4eca6c:	f3 c8 4e 00 fb       	repz enter 0x4e,0xfb
  4eca71:	c8 4e 00 03          	enter  0x4e,0x3
  4eca75:	c9                   	leave
  4eca76:	4e                   	dec    esi
  4eca77:	00 0b                	add    BYTE PTR [ebx],cl
  4eca79:	c9                   	leave
  4eca7a:	4e                   	dec    esi
  4eca7b:	00 14 c9             	add    BYTE PTR [ecx+ecx*8],dl
  4eca7e:	4e                   	dec    esi
  4eca7f:	00 00                	add    BYTE PTR [eax],al
  4eca81:	04 04                	add    al,0x4
  4eca83:	04 04                	add    al,0x4
  4eca85:	01 02                	add    DWORD PTR [edx],eax
  4eca87:	04 03                	add    al,0x3
  4eca89:	cc                   	int3
  4eca8a:	cc                   	int3
  4eca8b:	cc                   	int3
  4eca8c:	cc                   	int3
  4eca8d:	cc                   	int3
  4eca8e:	cc                   	int3
  4eca8f:	cc                   	int3
  4eca90:	a1 24 03 89 00       	mov    eax,ds:0x890324
  4eca95:	85 c0                	test   eax,eax
  4eca97:	74 0d                	je     0x4ecaa6
  4eca99:	66 81 60 35 fe ff    	and    WORD PTR [eax+0x35],0xfffe
  4eca9f:	8b 40 04             	mov    eax,DWORD PTR [eax+0x4]
  4ecaa2:	85 c0                	test   eax,eax
  4ecaa4:	75 f3                	jne    0x4eca99
  4ecaa6:	a1 30 03 89 00       	mov    eax,ds:0x890330
  4ecaab:	85 c0                	test   eax,eax
  4ecaad:	74 0d                	je     0x4ecabc
  4ecaaf:	66 81 60 35 fe ff    	and    WORD PTR [eax+0x35],0xfffe
  4ecab5:	8b 40 04             	mov    eax,DWORD PTR [eax+0x4]
  4ecab8:	85 c0                	test   eax,eax
  4ecaba:	75 f3                	jne    0x4ecaaf
  4ecabc:	c3                   	ret
  4ecabd:	cc                   	int3
  4ecabe:	cc                   	int3
  4ecabf:	cc                   	int3
