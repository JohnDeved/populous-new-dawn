
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044c650 <.text+0x4b650>:
  44c650:	53                   	push   ebx
  44c651:	b8 01 00 00 00       	mov    eax,0x1
  44c656:	56                   	push   esi
  44c657:	39 05 08 45 68 00    	cmp    DWORD PTR ds:0x684508,eax
  44c65d:	57                   	push   edi
  44c65e:	55                   	push   ebp
  44c65f:	7c 2b                	jl     0x44c68c
  44c661:	b9 22 42 68 00       	mov    ecx,0x684222
  44c666:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  44c66a:	39 11                	cmp    DWORD PTR [ecx],edx
  44c66c:	74 0e                	je     0x44c67c
  44c66e:	83 c1 06             	add    ecx,0x6
  44c671:	40                   	inc    eax
  44c672:	39 05 08 45 68 00    	cmp    DWORD PTR ds:0x684508,eax
  44c678:	7d f0                	jge    0x44c66a
  44c67a:	eb 14                	jmp    0x44c690
  44c67c:	0f bf c0             	movsx  eax,ax
  44c67f:	8d 0c 40             	lea    ecx,[eax+eax*2]
  44c682:	0f bf 04 4d 20 42 68 	movsx  eax,WORD PTR [ecx*2+0x684220]
  44c689:	00 
  44c68a:	eb 0b                	jmp    0x44c697
  44c68c:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  44c690:	0f bf 05 20 42 68 00 	movsx  eax,WORD PTR ds:0x684220
  44c697:	8b c8                	mov    ecx,eax
  44c699:	c1 e0 06             	shl    eax,0x6
  44c69c:	2b c1                	sub    eax,ecx
  44c69e:	2b c1                	sub    eax,ecx
  44c6a0:	66 8b a8 96 42 68 00 	mov    bp,WORD PTR [eax+0x684296]
  44c6a7:	66 85 ed             	test   bp,bp
  44c6aa:	74 5c                	je     0x44c708
  44c6ac:	0f bf d5             	movsx  edx,bp
  44c6af:	8b c2                	mov    eax,edx
  44c6b1:	c1 e2 06             	shl    edx,0x6
  44c6b4:	2b d0                	sub    edx,eax
  44c6b6:	2b d0                	sub    edx,eax
  44c6b8:	83 ba 8c 42 68 00 03 	cmp    DWORD PTR [edx+0x68428c],0x3
  44c6bf:	75 28                	jne    0x44c6e9
  44c6c1:	c7 82 8c 42 68 00 01 	mov    DWORD PTR [edx+0x68428c],0x1
  44c6c8:	00 00 00 
  44c6cb:	0f bf 82 98 42 68 00 	movsx  eax,WORD PTR [edx+0x684298]
  44c6d2:	8b c8                	mov    ecx,eax
  44c6d4:	c1 e0 06             	shl    eax,0x6
  44c6d7:	2b c1                	sub    eax,ecx
  44c6d9:	2b c1                	sub    eax,ecx
  44c6db:	66 8b 80 84 d0 5c 00 	mov    ax,WORD PTR [eax+0x5cd084]
  44c6e2:	66 89 82 62 42 68 00 	mov    WORD PTR [edx+0x684262],ax
  44c6e9:	a1 10 42 68 00       	mov    eax,ds:0x684210
  44c6ee:	89 82 90 42 68 00    	mov    DWORD PTR [edx+0x684290],eax
  44c6f4:	81 c2 5e 42 68 00    	add    edx,0x68425e
  44c6fa:	52                   	push   edx
  44c6fb:	e8 80 07 00 00       	call   0x44ce80
  44c700:	83 c4 04             	add    esp,0x4
  44c703:	e9 c7 01 00 00       	jmp    0x44c8cf
  44c708:	83 3d be d0 5c 00 00 	cmp    DWORD PTR ds:0x5cd0be,0x0
  44c70f:	66 b9 01 00          	mov    cx,0x1
  44c713:	74 2c                	je     0x44c741
  44c715:	33 ff                	xor    edi,edi
  44c717:	0f bf f1             	movsx  esi,cx
  44c71a:	8b c6                	mov    eax,esi
  44c71c:	c1 e6 06             	shl    esi,0x6
  44c71f:	2b f0                	sub    esi,eax
  44c721:	2b f0                	sub    esi,eax
  44c723:	39 96 80 d0 5c 00    	cmp    DWORD PTR [esi+0x5cd080],edx
  44c729:	74 19                	je     0x44c744
  44c72b:	66 41                	inc    cx
  44c72d:	0f bf c1             	movsx  eax,cx
  44c730:	8b f0                	mov    esi,eax
  44c732:	c1 e0 06             	shl    eax,0x6
  44c735:	2b c6                	sub    eax,esi
  44c737:	2b c6                	sub    eax,esi
  44c739:	39 b8 80 d0 5c 00    	cmp    DWORD PTR [eax+0x5cd080],edi
  44c73f:	75 d6                	jne    0x44c717
  44c741:	66 33 c9             	xor    cx,cx
  44c744:	66 85 c9             	test   cx,cx
  44c747:	0f 84 5f 01 00 00    	je     0x44c8ac
  44c74d:	0f bf c1             	movsx  eax,cx
  44c750:	66 bd 01 00          	mov    bp,0x1
  44c754:	8b d0                	mov    edx,eax
  44c756:	c1 e0 06             	shl    eax,0x6
  44c759:	2b c2                	sub    eax,edx
  44c75b:	2b c2                	sub    eax,edx
  44c75d:	8d b0 80 d0 5c 00    	lea    esi,[eax+0x5cd080]
  44c763:	33 c0                	xor    eax,eax
  44c765:	0f bf d5             	movsx  edx,bp
  44c768:	8b fa                	mov    edi,edx
  44c76a:	c1 e2 06             	shl    edx,0x6
  44c76d:	2b d7                	sub    edx,edi
  44c76f:	2b d7                	sub    edx,edi
  44c771:	39 82 8c 42 68 00    	cmp    DWORD PTR [edx+0x68428c],eax
  44c777:	74 0b                	je     0x44c784
  44c779:	66 45                	inc    bp
  44c77b:	66 83 fd 0a          	cmp    bp,0xa
  44c77f:	7e e4                	jle    0x44c765
  44c781:	66 33 ed             	xor    bp,bp
  44c784:	66 85 ed             	test   bp,bp
  44c787:	0f 84 22 01 00 00    	je     0x44c8af
  44c78d:	0f bf c5             	movsx  eax,bp
  44c790:	8b d0                	mov    edx,eax
  44c792:	c1 e0 06             	shl    eax,0x6
  44c795:	2b c2                	sub    eax,edx
  44c797:	2b c2                	sub    eax,edx
  44c799:	8d b8 5e 42 68 00    	lea    edi,[eax+0x68425e]
  44c79f:	c7 47 2e 01 00 00 00 	mov    DWORD PTR [edi+0x2e],0x1
  44c7a6:	66 89 4f 3a          	mov    WORD PTR [edi+0x3a],cx
  44c7aa:	8b 16                	mov    edx,DWORD PTR [esi]
  44c7ac:	89 17                	mov    DWORD PTR [edi],edx
  44c7ae:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  44c7b2:	66 89 47 04          	mov    WORD PTR [edi+0x4],ax
  44c7b6:	8b 5e 06             	mov    ebx,DWORD PTR [esi+0x6]
  44c7b9:	89 5f 06             	mov    DWORD PTR [edi+0x6],ebx
  44c7bc:	bb 80 02 00 00       	mov    ebx,0x280
  44c7c1:	8b 56 0a             	mov    edx,DWORD PTR [esi+0xa]
  44c7c4:	89 57 0a             	mov    DWORD PTR [edi+0xa],edx
  44c7c7:	8b 46 0e             	mov    eax,DWORD PTR [esi+0xe]
  44c7ca:	c1 e0 10             	shl    eax,0x10
  44c7cd:	99                   	cdq
  44c7ce:	f7 fb                	idiv   ebx
  44c7d0:	bb e0 01 00 00       	mov    ebx,0x1e0
  44c7d5:	89 47 0e             	mov    DWORD PTR [edi+0xe],eax
  44c7d8:	8b 46 12             	mov    eax,DWORD PTR [esi+0x12]
  44c7db:	c1 e0 10             	shl    eax,0x10
  44c7de:	99                   	cdq
  44c7df:	f7 fb                	idiv   ebx
  44c7e1:	bb 80 02 00 00       	mov    ebx,0x280
  44c7e6:	89 47 12             	mov    DWORD PTR [edi+0x12],eax
  44c7e9:	8b 46 16             	mov    eax,DWORD PTR [esi+0x16]
  44c7ec:	c1 e0 10             	shl    eax,0x10
  44c7ef:	99                   	cdq
  44c7f0:	f7 fb                	idiv   ebx
  44c7f2:	bb e0 01 00 00       	mov    ebx,0x1e0
  44c7f7:	89 47 16             	mov    DWORD PTR [edi+0x16],eax
  44c7fa:	8b 46 1a             	mov    eax,DWORD PTR [esi+0x1a]
  44c7fd:	c1 e0 10             	shl    eax,0x10
  44c800:	99                   	cdq
  44c801:	f7 fb                	idiv   ebx
  44c803:	89 47 1a             	mov    DWORD PTR [edi+0x1a],eax
  44c806:	8b 56 1e             	mov    edx,DWORD PTR [esi+0x1e]
  44c809:	89 57 1e             	mov    DWORD PTR [edi+0x1e],edx
  44c80c:	8b 46 22             	mov    eax,DWORD PTR [esi+0x22]
  44c80f:	89 47 22             	mov    DWORD PTR [edi+0x22],eax
  44c812:	8b 5e 26             	mov    ebx,DWORD PTR [esi+0x26]
  44c815:	89 5f 26             	mov    DWORD PTR [edi+0x26],ebx
  44c818:	8b 56 2a             	mov    edx,DWORD PTR [esi+0x2a]
  44c81b:	89 57 2a             	mov    DWORD PTR [edi+0x2a],edx
  44c81e:	66 c7 47 36 00 00    	mov    WORD PTR [edi+0x36],0x0
  44c824:	66 89 6f 38          	mov    WORD PTR [edi+0x38],bp
  44c828:	66 89 4f 3a          	mov    WORD PTR [edi+0x3a],cx
  44c82c:	a1 10 42 68 00       	mov    eax,ds:0x684210
  44c831:	89 47 32             	mov    DWORD PTR [edi+0x32],eax
  44c834:	66 c7 47 3c 00 00    	mov    WORD PTR [edi+0x3c],0x0
  44c83a:	8b 1d 61 c6 89 00    	mov    ebx,DWORD PTR ds:0x89c661
  44c840:	83 e3 08             	and    ebx,0x8
  44c843:	c1 eb 03             	shr    ebx,0x3
  44c846:	84 db                	test   bl,bl
  44c848:	74 05                	je     0x44c84f
  44c84a:	8b 77 0a             	mov    esi,DWORD PTR [edi+0xa]
  44c84d:	eb 03                	jmp    0x44c852
  44c84f:	8b 77 06             	mov    esi,DWORD PTR [edi+0x6]
  44c852:	83 7e 04 09          	cmp    DWORD PTR [esi+0x4],0x9
  44c856:	74 3c                	je     0x44c894
  44c858:	b0 01                	mov    al,0x1
  44c85a:	8a 4e 41             	mov    cl,BYTE PTR [esi+0x41]
  44c85d:	f6 c1 02             	test   cl,0x2
  44c860:	74 04                	je     0x44c866
  44c862:	84 db                	test   bl,bl
  44c864:	74 09                	je     0x44c86f
  44c866:	f6 c1 01             	test   cl,0x1
  44c869:	74 06                	je     0x44c871
  44c86b:	84 db                	test   bl,bl
  44c86d:	74 02                	je     0x44c871
  44c86f:	32 c0                	xor    al,al
  44c871:	f6 c1 08             	test   cl,0x8
  44c874:	74 02                	je     0x44c878
  44c876:	32 c0                	xor    al,al
  44c878:	84 c0                	test   al,al
  44c87a:	74 0f                	je     0x44c88b
  44c87c:	56                   	push   esi
  44c87d:	57                   	push   edi
  44c87e:	e8 fd 01 00 00       	call   0x44ca80
  44c883:	83 c4 08             	add    esp,0x8
  44c886:	66 85 c0             	test   ax,ax
  44c889:	74 09                	je     0x44c894
  44c88b:	83 c6 42             	add    esi,0x42
  44c88e:	83 7e 04 09          	cmp    DWORD PTR [esi+0x4],0x9
  44c892:	75 c4                	jne    0x44c858
  44c894:	57                   	push   edi
  44c895:	e8 e6 05 00 00       	call   0x44ce80
  44c89a:	83 c4 04             	add    esp,0x4
  44c89d:	8b 47 22             	mov    eax,DWORD PTR [edi+0x22]
  44c8a0:	85 c0                	test   eax,eax
  44c8a2:	74 0b                	je     0x44c8af
  44c8a4:	57                   	push   edi
  44c8a5:	ff d0                	call   eax
  44c8a7:	83 c4 04             	add    esp,0x4
  44c8aa:	eb 03                	jmp    0x44c8af
  44c8ac:	66 33 ed             	xor    bp,bp
  44c8af:	80 3d 00 f0 88 00 02 	cmp    BYTE PTR ds:0x88f000,0x2
  44c8b6:	75 17                	jne    0x44c8cf
  44c8b8:	83 3d cc c6 68 00 00 	cmp    DWORD PTR ds:0x68c6cc,0x0
  44c8bf:	75 0e                	jne    0x44c8cf
  44c8c1:	6a 01                	push   0x1
  44c8c3:	6a 6d                	push   0x6d
  44c8c5:	6a 00                	push   0x0
  44c8c7:	e8 84 d7 03 00       	call   0x48a050
  44c8cc:	83 c4 0c             	add    esp,0xc
  44c8cf:	0f bf c5             	movsx  eax,bp
  44c8d2:	8b c8                	mov    ecx,eax
  44c8d4:	c1 e0 06             	shl    eax,0x6
  44c8d7:	2b c1                	sub    eax,ecx
  44c8d9:	2b c1                	sub    eax,ecx
  44c8db:	8d b0 9a 42 68 00    	lea    esi,[eax+0x68429a]
  44c8e1:	0f bf 06             	movsx  eax,WORD PTR [esi]
  44c8e4:	8b c8                	mov    ecx,eax
  44c8e6:	c1 e0 03             	shl    eax,0x3
  44c8e9:	2b c1                	sub    eax,ecx
  44c8eb:	03 c0                	add    eax,eax
  44c8ed:	8d 9c c1 2c 45 68 00 	lea    ebx,[ecx+eax*8+0x68452c]
  44c8f4:	81 fb 2c 45 68 00    	cmp    ebx,0x68452c
  44c8fa:	74 5a                	je     0x44c956
  44c8fc:	bf 05 00 00 00       	mov    edi,0x5
  44c901:	39 7b 22             	cmp    DWORD PTR [ebx+0x22],edi
  44c904:	75 1b                	jne    0x44c921
  44c906:	80 7b 2a 00          	cmp    BYTE PTR [ebx+0x2a],0x0
  44c90a:	74 15                	je     0x44c921
  44c90c:	8b 43 5b             	mov    eax,DWORD PTR [ebx+0x5b]
  44c90f:	85 c0                	test   eax,eax
  44c911:	74 0e                	je     0x44c921
  44c913:	50                   	push   eax
  44c914:	e8 37 fd ff ff       	call   0x44c650
  44c919:	83 c4 04             	add    esp,0x4
  44c91c:	66 85 c0             	test   ax,ax
  44c91f:	75 1e                	jne    0x44c93f
  44c921:	0f bf 43 6d          	movsx  eax,WORD PTR [ebx+0x6d]
  44c925:	8b c8                	mov    ecx,eax
  44c927:	c1 e0 03             	shl    eax,0x3
  44c92a:	2b c1                	sub    eax,ecx
  44c92c:	03 c0                	add    eax,eax
  44c92e:	8d 9c c1 2c 45 68 00 	lea    ebx,[ecx+eax*8+0x68452c]
  44c935:	81 fb 2c 45 68 00    	cmp    ebx,0x68452c
  44c93b:	75 c4                	jne    0x44c901
  44c93d:	eb 17                	jmp    0x44c956
  44c93f:	0f bf c0             	movsx  eax,ax
  44c942:	66 8b 53 6b          	mov    dx,WORD PTR [ebx+0x6b]
  44c946:	8b c8                	mov    ecx,eax
  44c948:	c1 e0 06             	shl    eax,0x6
  44c94b:	2b c1                	sub    eax,ecx
  44c94d:	2b c1                	sub    eax,ecx
  44c94f:	66 89 90 94 42 68 00 	mov    WORD PTR [eax+0x684294],dx
  44c956:	0f bf 06             	movsx  eax,WORD PTR [esi]
  44c959:	8b c8                	mov    ecx,eax
  44c95b:	c1 e0 03             	shl    eax,0x3
  44c95e:	2b c1                	sub    eax,ecx
  44c960:	03 c0                	add    eax,eax
  44c962:	8d 9c c1 2c 45 68 00 	lea    ebx,[ecx+eax*8+0x68452c]
  44c969:	81 fb 2c 45 68 00    	cmp    ebx,0x68452c
  44c96f:	74 58                	je     0x44c9c9
  44c971:	bf 03 00 00 00       	mov    edi,0x3
  44c976:	39 7b 22             	cmp    DWORD PTR [ebx+0x22],edi
  44c979:	75 32                	jne    0x44c9ad
  44c97b:	80 7b 2a 00          	cmp    BYTE PTR [ebx+0x2a],0x0
  44c97f:	74 2c                	je     0x44c9ad
  44c981:	8b 43 5b             	mov    eax,DWORD PTR [ebx+0x5b]
  44c984:	85 c0                	test   eax,eax
  44c986:	74 25                	je     0x44c9ad
  44c988:	50                   	push   eax
  44c989:	e8 c2 fc ff ff       	call   0x44c650
  44c98e:	83 c4 04             	add    esp,0x4
  44c991:	66 85 c0             	test   ax,ax
  44c994:	74 17                	je     0x44c9ad
  44c996:	0f bf c0             	movsx  eax,ax
  44c999:	66 8b 4b 6b          	mov    cx,WORD PTR [ebx+0x6b]
  44c99d:	8b d0                	mov    edx,eax
  44c99f:	c1 e0 06             	shl    eax,0x6
  44c9a2:	2b c2                	sub    eax,edx
  44c9a4:	2b c2                	sub    eax,edx
  44c9a6:	66 89 88 94 42 68 00 	mov    WORD PTR [eax+0x684294],cx
  44c9ad:	0f bf 43 6d          	movsx  eax,WORD PTR [ebx+0x6d]
  44c9b1:	8b c8                	mov    ecx,eax
  44c9b3:	c1 e0 03             	shl    eax,0x3
  44c9b6:	2b c1                	sub    eax,ecx
  44c9b8:	03 c0                	add    eax,eax
  44c9ba:	8d 9c c1 2c 45 68 00 	lea    ebx,[ecx+eax*8+0x68452c]
  44c9c1:	81 fb 2c 45 68 00    	cmp    ebx,0x68452c
  44c9c7:	75 ad                	jne    0x44c976
  44c9c9:	0f bf 06             	movsx  eax,WORD PTR [esi]
  44c9cc:	8b c8                	mov    ecx,eax
  44c9ce:	c1 e0 03             	shl    eax,0x3
  44c9d1:	2b c1                	sub    eax,ecx
  44c9d3:	03 c0                	add    eax,eax
  44c9d5:	8d 9c c1 2c 45 68 00 	lea    ebx,[ecx+eax*8+0x68452c]
  44c9dc:	81 fb 2c 45 68 00    	cmp    ebx,0x68452c
  44c9e2:	0f 84 86 00 00 00    	je     0x44ca6e
  44c9e8:	33 f6                	xor    esi,esi
  44c9ea:	bf 04 00 00 00       	mov    edi,0x4
  44c9ef:	89 73 0c             	mov    DWORD PTR [ebx+0xc],esi
  44c9f2:	0f bf 43 6b          	movsx  eax,WORD PTR [ebx+0x6b]
  44c9f6:	8b c8                	mov    ecx,eax
  44c9f8:	c1 e0 06             	shl    eax,0x6
  44c9fb:	2b c1                	sub    eax,ecx
  44c9fd:	2b c1                	sub    eax,ecx
  44c9ff:	39 b0 90 42 68 00    	cmp    DWORD PTR [eax+0x684290],esi
  44ca05:	74 4b                	je     0x44ca52
  44ca07:	8b 43 67             	mov    eax,DWORD PTR [ebx+0x67]
  44ca0a:	85 c0                	test   eax,eax
  44ca0c:	74 06                	je     0x44ca14
  44ca0e:	53                   	push   ebx
  44ca0f:	ff d0                	call   eax
  44ca11:	83 c4 04             	add    esp,0x4
  44ca14:	85 3d 61 c6 89 00    	test   DWORD PTR ds:0x89c661,edi
  44ca1a:	75 30                	jne    0x44ca4c
  44ca1c:	8b 43 3f             	mov    eax,DWORD PTR [ebx+0x3f]
  44ca1f:	39 05 0c 45 68 00    	cmp    DWORD PTR ds:0x68450c,eax
  44ca25:	7c 25                	jl     0x44ca4c
  44ca27:	8b 4b 47             	mov    ecx,DWORD PTR [ebx+0x47]
  44ca2a:	03 c8                	add    ecx,eax
  44ca2c:	3b 0d 0c 45 68 00    	cmp    ecx,DWORD PTR ds:0x68450c
  44ca32:	7e 18                	jle    0x44ca4c
  44ca34:	8b 43 43             	mov    eax,DWORD PTR [ebx+0x43]
  44ca37:	39 05 10 45 68 00    	cmp    DWORD PTR ds:0x684510,eax
  44ca3d:	7c 0d                	jl     0x44ca4c
  44ca3f:	8b 4b 4b             	mov    ecx,DWORD PTR [ebx+0x4b]
  44ca42:	03 c8                	add    ecx,eax
  44ca44:	3b 0d 10 45 68 00    	cmp    ecx,DWORD PTR ds:0x684510
  44ca4a:	7f 06                	jg     0x44ca52
  44ca4c:	89 73 18             	mov    DWORD PTR [ebx+0x18],esi
  44ca4f:	89 73 1c             	mov    DWORD PTR [ebx+0x1c],esi
  44ca52:	0f bf 43 6d          	movsx  eax,WORD PTR [ebx+0x6d]
  44ca56:	8b c8                	mov    ecx,eax
  44ca58:	c1 e0 03             	shl    eax,0x3
  44ca5b:	2b c1                	sub    eax,ecx
  44ca5d:	03 c0                	add    eax,eax
  44ca5f:	8d 9c c1 2c 45 68 00 	lea    ebx,[ecx+eax*8+0x68452c]
  44ca66:	81 fb 2c 45 68 00    	cmp    ebx,0x68452c
  44ca6c:	75 81                	jne    0x44c9ef
  44ca6e:	66 8b c5             	mov    ax,bp
  44ca71:	5d                   	pop    ebp
  44ca72:	5f                   	pop    edi
  44ca73:	5e                   	pop    esi
  44ca74:	5b                   	pop    ebx
  44ca75:	c3                   	ret
  44ca76:	cc                   	int3
  44ca77:	cc                   	int3
  44ca78:	cc                   	int3
  44ca79:	cc                   	int3
  44ca7a:	cc                   	int3
  44ca7b:	cc                   	int3
  44ca7c:	cc                   	int3
  44ca7d:	cc                   	int3
  44ca7e:	cc                   	int3
  44ca7f:	cc                   	int3
  44ca80:	66 b9 01 00          	mov    cx,0x1
  44ca84:	53                   	push   ebx
  44ca85:	56                   	push   esi
  44ca86:	33 c0                	xor    eax,eax
  44ca88:	57                   	push   edi
  44ca89:	55                   	push   ebp
  44ca8a:	0f bf d1             	movsx  edx,cx
  44ca8d:	8b f2                	mov    esi,edx
  44ca8f:	c1 e2 03             	shl    edx,0x3
  44ca92:	2b d6                	sub    edx,esi
  44ca94:	03 d2                	add    edx,edx
  44ca96:	39 84 d6 30 45 68 00 	cmp    DWORD PTR [esi+edx*8+0x684530],eax
  44ca9d:	74 0c                	je     0x44caab
  44ca9f:	66 41                	inc    cx
  44caa1:	66 81 f9 00 01       	cmp    cx,0x100
  44caa6:	7e e2                	jle    0x44ca8a
  44caa8:	66 33 c9             	xor    cx,cx
  44caab:	66 85 c9             	test   cx,cx
  44caae:	0f 84 82 01 00 00    	je     0x44cc36
  44cab4:	0f bf c1             	movsx  eax,cx
  44cab7:	8b d0                	mov    edx,eax
  44cab9:	8b 5c 24 18          	mov    ebx,DWORD PTR [esp+0x18]
  44cabd:	c1 e0 03             	shl    eax,0x3
  44cac0:	2b c2                	sub    eax,edx
  44cac2:	03 c0                	add    eax,eax
  44cac4:	66 89 8c c2 4c 45 68 	mov    WORD PTR [edx+eax*8+0x68454c],cx
  44cacb:	00 
  44cacc:	8d b4 c2 2c 45 68 00 	lea    esi,[edx+eax*8+0x68452c]
  44cad3:	8b 03                	mov    eax,DWORD PTR [ebx]
  44cad5:	89 06                	mov    DWORD PTR [esi],eax
  44cad7:	8b 53 04             	mov    edx,DWORD PTR [ebx+0x4]
  44cada:	89 56 22             	mov    DWORD PTR [esi+0x22],edx
  44cadd:	8b 6b 08             	mov    ebp,DWORD PTR [ebx+0x8]
  44cae0:	89 6e 26             	mov    DWORD PTR [esi+0x26],ebp
  44cae3:	8a 43 0c             	mov    al,BYTE PTR [ebx+0xc]
  44cae6:	88 46 2a             	mov    BYTE PTR [esi+0x2a],al
  44cae9:	8b 7c 24 14          	mov    edi,DWORD PTR [esp+0x14]
  44caed:	8b 53 0d             	mov    edx,DWORD PTR [ebx+0xd]
  44caf0:	89 56 2b             	mov    DWORD PTR [esi+0x2b],edx
  44caf3:	8b 6b 11             	mov    ebp,DWORD PTR [ebx+0x11]
  44caf6:	89 6e 2f             	mov    DWORD PTR [esi+0x2f],ebp
  44caf9:	bd 80 02 00 00       	mov    ebp,0x280
  44cafe:	8b                   	.byte 0x8b
  44caff:	43                   	inc    ebx
