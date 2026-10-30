
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00525650 <.text+0x124650>:
  525650:	81 ec 3c 04 00 00    	sub    esp,0x43c
  525656:	53                   	push   ebx
  525657:	56                   	push   esi
  525658:	57                   	push   edi
  525659:	33 db                	xor    ebx,ebx
  52565b:	55                   	push   ebp
  52565c:	38 1d 81 bb 89 00    	cmp    BYTE PTR ds:0x89bb81,bl
  525662:	0f 84 5a 05 00 00    	je     0x525bc2
  525668:	89 5c 24 40          	mov    DWORD PTR [esp+0x40],ebx
  52566c:	89 5c 24 24          	mov    DWORD PTR [esp+0x24],ebx
  525670:	e8 1b a5 fd ff       	call   0x4ffb90
  525675:	89 44 24 44          	mov    DWORD PTR [esp+0x44],eax
  525679:	33 c0                	xor    eax,eax
  52567b:	a0 81 bb 89 00       	mov    al,ds:0x89bb81
  525680:	3b c3                	cmp    eax,ebx
  525682:	74 26                	je     0x5256aa
  525684:	83 f8 03             	cmp    eax,0x3
  525687:	74 0f                	je     0x525698
  525689:	83 f8 04             	cmp    eax,0x4
  52568c:	74 14                	je     0x5256a2
  52568e:	c7 44 24 40 01 00 00 	mov    DWORD PTR [esp+0x40],0x1
  525695:	00 
  525696:	eb 12                	jmp    0x5256aa
  525698:	c7 44 24 24 01 00 00 	mov    DWORD PTR [esp+0x24],0x1
  52569f:	00 
  5256a0:	eb 08                	jmp    0x5256aa
  5256a2:	c7 44 24 24 ff ff ff 	mov    DWORD PTR [esp+0x24],0xffffffff
  5256a9:	ff 
  5256aa:	a0 f4 c6 89 00       	mov    al,ds:0x89c6f4
  5256af:	33 f6                	xor    esi,esi
  5256b1:	a2 9c 48 98 00       	mov    ds:0x98489c,al
  5256b6:	39 74 24 24          	cmp    DWORD PTR [esp+0x24],esi
  5256ba:	0f 84 84 02 00 00    	je     0x525944
  5256c0:	66 81 3d cf c6 89 00 	cmp    WORD PTR ds:0x89c6cf,0x200
  5256c7:	00 02 
  5256c9:	89 74 24 20          	mov    DWORD PTR [esp+0x20],esi
  5256cd:	89 74 24 1c          	mov    DWORD PTR [esp+0x1c],esi
  5256d1:	89 74 24 14          	mov    DWORD PTR [esp+0x14],esi
  5256d5:	75 19                	jne    0x5256f0
  5256d7:	66 81 3d d1 c6 89 00 	cmp    WORD PTR ds:0x89c6d1,0x180
  5256de:	80 01 
  5256e0:	75 0e                	jne    0x5256f0
  5256e2:	bf 01 00 00 00       	mov    edi,0x1
  5256e7:	e8 14 42 f7 ff       	call   0x499900
  5256ec:	85 c0                	test   eax,eax
  5256ee:	75 02                	jne    0x5256f2
  5256f0:	33 ff                	xor    edi,edi
  5256f2:	80 3d 84 bb 89 00 00 	cmp    BYTE PTR ds:0x89bb84,0x0
  5256f9:	75 05                	jne    0x525700
  5256fb:	e8 00 a4 f8 ff       	call   0x4afb00
  525700:	80 3d 86 bb 89 00 ff 	cmp    BYTE PTR ds:0x89bb86,0xff
  525707:	0f 84 cb 00 00 00    	je     0x5257d8
  52570d:	0f be 05 86 bb 89 00 	movsx  eax,BYTE PTR ds:0x89bb86
  525714:	8d 0c 80             	lea    ecx,[eax+eax*4]
  525717:	8b 84 c9 96 3b 68 00 	mov    eax,DWORD PTR [ecx+ecx*8+0x683b96]
  52571e:	8d b4 c9 92 3b 68 00 	lea    esi,[ecx+ecx*8+0x683b92]
  525725:	50                   	push   eax
  525726:	e8 e5 4a f2 ff       	call   0x44a210
  52572b:	83 c4 04             	add    esp,0x4
  52572e:	a3 b3 bb 89 00       	mov    ds:0x89bbb3,eax
  525733:	8b 46 08             	mov    eax,DWORD PTR [esi+0x8]
  525736:	50                   	push   eax
  525737:	e8 d4 4a f2 ff       	call   0x44a210
  52573c:	83 c4 04             	add    esp,0x4
  52573f:	8b d8                	mov    ebx,eax
  525741:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  525744:	50                   	push   eax
  525745:	e8 c6 4a f2 ff       	call   0x44a210
  52574a:	83 c4 04             	add    esp,0x4
  52574d:	03 d8                	add    ebx,eax
  52574f:	a1 78 3b 68 00       	mov    eax,ds:0x683b78
  525754:	89 1d bb bb 89 00    	mov    DWORD PTR ds:0x89bbbb,ebx
  52575a:	50                   	push   eax
  52575b:	e8 90 4a f2 ff       	call   0x44a1f0
  525760:	83 c4 04             	add    esp,0x4
  525763:	a3 af bb 89 00       	mov    ds:0x89bbaf,eax
  525768:	a1 78 3b 68 00       	mov    eax,ds:0x683b78
  52576d:	50                   	push   eax
  52576e:	e8 7d 4a f2 ff       	call   0x44a1f0
  525773:	83 c4 04             	add    esp,0x4
  525776:	8b f0                	mov    esi,eax
  525778:	a1 7c 3b 68 00       	mov    eax,ds:0x683b7c
  52577d:	50                   	push   eax
  52577e:	e8 6d 4a f2 ff       	call   0x44a1f0
  525783:	8d 54 24 18          	lea    edx,[esp+0x18]
  525787:	83 c4 04             	add    esp,0x4
  52578a:	03 f0                	add    esi,eax
  52578c:	b9 af bb 89 00       	mov    ecx,0x89bbaf
  525791:	89 35 b7 bb 89 00    	mov    DWORD PTR ds:0x89bbb7,esi
  525797:	8b 01                	mov    eax,DWORD PTR [ecx]
  525799:	8b 59 04             	mov    ebx,DWORD PTR [ecx+0x4]
  52579c:	8b 69 08             	mov    ebp,DWORD PTR [ecx+0x8]
  52579f:	89 02                	mov    DWORD PTR [edx],eax
  5257a1:	8b 41 0c             	mov    eax,DWORD PTR [ecx+0xc]
  5257a4:	89 5a 04             	mov    DWORD PTR [edx+0x4],ebx
  5257a7:	89 6a 08             	mov    DWORD PTR [edx+0x8],ebp
  5257aa:	85 ff                	test   edi,edi
  5257ac:	89 42 0c             	mov    DWORD PTR [edx+0xc],eax
  5257af:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  5257b3:	74 23                	je     0x5257d8
  5257b5:	8b 35 b3 bb 89 00    	mov    esi,DWORD PTR ds:0x89bbb3
  5257bb:	a1 7c 90 a6 00       	mov    eax,ds:0xa6907c
  5257c0:	2b 35 7c 90 a6 00    	sub    esi,DWORD PTR ds:0xa6907c
  5257c6:	8b 0d 78 90 a6 00    	mov    ecx,DWORD PTR ds:0xa69078
  5257cc:	29 44 24 20          	sub    DWORD PTR [esp+0x20],eax
  5257d0:	29 4c 24 14          	sub    DWORD PTR [esp+0x14],ecx
  5257d4:	29 4c 24 1c          	sub    DWORD PTR [esp+0x1c],ecx
  5257d8:	a1 8f bb 89 00       	mov    eax,ds:0x89bb8f
  5257dd:	8b 1d 93 bb 89 00    	mov    ebx,DWORD PTR ds:0x89bb93
  5257e3:	8d 4c 24 28          	lea    ecx,[esp+0x28]
  5257e7:	85 ff                	test   edi,edi
  5257e9:	8b 2d 97 bb 89 00    	mov    ebp,DWORD PTR ds:0x89bb97
  5257ef:	ba 8f bb 89 00       	mov    edx,0x89bb8f
  5257f4:	89 01                	mov    DWORD PTR [ecx],eax
  5257f6:	8b 42 0c             	mov    eax,DWORD PTR [edx+0xc]
  5257f9:	89 59 04             	mov    DWORD PTR [ecx+0x4],ebx
  5257fc:	89 69 08             	mov    DWORD PTR [ecx+0x8],ebp
  5257ff:	89 41 0c             	mov    DWORD PTR [ecx+0xc],eax
  525802:	8b 6c 24 2c          	mov    ebp,DWORD PTR [esp+0x2c]
  525806:	74 23                	je     0x52582b
  525808:	8b 2d 93 bb 89 00    	mov    ebp,DWORD PTR ds:0x89bb93
  52580e:	a1 7c 90 a6 00       	mov    eax,ds:0xa6907c
  525813:	2b 2d 7c 90 a6 00    	sub    ebp,DWORD PTR ds:0xa6907c
  525819:	8b 0d 78 90 a6 00    	mov    ecx,DWORD PTR ds:0xa69078
  52581f:	29 44 24 34          	sub    DWORD PTR [esp+0x34],eax
  525823:	29 4c 24 28          	sub    DWORD PTR [esp+0x28],ecx
  525827:	29 4c 24 30          	sub    DWORD PTR [esp+0x30],ecx
  52582b:	8b 7c 24 1c          	mov    edi,DWORD PTR [esp+0x1c]
  52582f:	8b 44 24 30          	mov    eax,DWORD PTR [esp+0x30]
  525833:	2b 7c 24 14          	sub    edi,DWORD PTR [esp+0x14]
  525837:	2b 44 24 28          	sub    eax,DWORD PTR [esp+0x28]
  52583b:	8b 5c 24 20          	mov    ebx,DWORD PTR [esp+0x20]
  52583f:	89 44 24 38          	mov    DWORD PTR [esp+0x38],eax
  525843:	2b de                	sub    ebx,esi
  525845:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  525849:	2b c5                	sub    eax,ebp
  52584b:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  52584f:	89 44 24 3c          	mov    DWORD PTR [esp+0x3c],eax
  525853:	8b c7                	mov    eax,edi
  525855:	99                   	cdq
  525856:	2b c2                	sub    eax,edx
  525858:	c1 f8 01             	sar    eax,0x1
  52585b:	03 c8                	add    ecx,eax
  52585d:	8b c3                	mov    eax,ebx
  52585f:	99                   	cdq
  525860:	2b c2                	sub    eax,edx
  525862:	89 4c 24 14          	mov    DWORD PTR [esp+0x14],ecx
  525866:	c1 f8 01             	sar    eax,0x1
  525869:	03 f0                	add    esi,eax
  52586b:	8b 44 24 38          	mov    eax,DWORD PTR [esp+0x38]
  52586f:	99                   	cdq
  525870:	2b c2                	sub    eax,edx
  525872:	89 74 24 10          	mov    DWORD PTR [esp+0x10],esi
  525876:	0f be 0d 88 bb 89 00 	movsx  ecx,BYTE PTR ds:0x89bb88
  52587d:	0f be 35 71 d1 89 00 	movsx  esi,BYTE PTR ds:0x89d171
  525884:	c1 f8 01             	sar    eax,0x1
  525887:	8b d0                	mov    edx,eax
  525889:	8b 44 24 28          	mov    eax,DWORD PTR [esp+0x28]
  52588d:	2b 54 24 14          	sub    edx,DWORD PTR [esp+0x14]
  525891:	03 c2                	add    eax,edx
  525893:	99                   	cdq
  525894:	f7 fe                	idiv   esi
  525896:	0f af c1             	imul   eax,ecx
  525899:	03 44 24 14          	add    eax,DWORD PTR [esp+0x14]
  52589d:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  5258a1:	8b 44 24 3c          	mov    eax,DWORD PTR [esp+0x3c]
  5258a5:	99                   	cdq
  5258a6:	2b c2                	sub    eax,edx
  5258a8:	c1 f8 01             	sar    eax,0x1
  5258ab:	2b 44 24 10          	sub    eax,DWORD PTR [esp+0x10]
  5258af:	03 c5                	add    eax,ebp
  5258b1:	8b 6c 24 10          	mov    ebp,DWORD PTR [esp+0x10]
  5258b5:	99                   	cdq
  5258b6:	f7 fe                	idiv   esi
  5258b8:	0f af c1             	imul   eax,ecx
  5258bb:	03 e8                	add    ebp,eax
  5258bd:	8b 44 24 38          	mov    eax,DWORD PTR [esp+0x38]
  5258c1:	2b c7                	sub    eax,edi
  5258c3:	99                   	cdq
  5258c4:	f7 fe                	idiv   esi
  5258c6:	0f af c1             	imul   eax,ecx
  5258c9:	03 f8                	add    edi,eax
  5258cb:	8b 44 24 3c          	mov    eax,DWORD PTR [esp+0x3c]
  5258cf:	2b c3                	sub    eax,ebx
  5258d1:	99                   	cdq
  5258d2:	f7 fe                	idiv   esi
  5258d4:	0f af c1             	imul   eax,ecx
  5258d7:	8d 0c 18             	lea    ecx,[eax+ebx*1]
  5258da:	8a 15 71 d1 89 00    	mov    dl,BYTE PTR ds:0x89d171
  5258e0:	38 15 88 bb 89 00    	cmp    BYTE PTR ds:0x89bb88,dl
  5258e6:	75 06                	jne    0x5258ee
  5258e8:	83 ef 0a             	sub    edi,0xa
  5258eb:	83 e9 0a             	sub    ecx,0xa
  5258ee:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  5258f3:	33 f6                	xor    esi,esi
  5258f5:	66 8b b0 b6 2d 00 00 	mov    si,WORD PTR [eax+0x2db6]
  5258fc:	8b c1                	mov    eax,ecx
  5258fe:	99                   	cdq
  5258ff:	f7 fe                	idiv   esi
  525901:	50                   	push   eax
  525902:	33 f6                	xor    esi,esi
  525904:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  525909:	66 8b b0 b4 2d 00 00 	mov    si,WORD PTR [eax+0x2db4]
  525910:	8b c7                	mov    eax,edi
  525912:	99                   	cdq
  525913:	f7 fe                	idiv   esi
  525915:	50                   	push   eax
  525916:	8b c1                	mov    eax,ecx
  525918:	99                   	cdq
  525919:	2b c2                	sub    eax,edx
  52591b:	8b 4c 24 30          	mov    ecx,DWORD PTR [esp+0x30]
  52591f:	c1 f8 01             	sar    eax,0x1
  525922:	66 2b e8             	sub    bp,ax
  525925:	8b c7                	mov    eax,edi
  525927:	99                   	cdq
  525928:	55                   	push   ebp
  525929:	2b c2                	sub    eax,edx
  52592b:	c1 f8 01             	sar    eax,0x1
  52592e:	66 2b c8             	sub    cx,ax
  525931:	51                   	push   ecx
  525932:	e8 09 e4 ff ff       	call   0x523d40
  525937:	8a 4c 24 34          	mov    cl,BYTE PTR [esp+0x34]
  52593b:	83 c4 10             	add    esp,0x10
  52593e:	00 0d 88 bb 89 00    	add    BYTE PTR ds:0x89bb88,cl
  525944:	83 7c 24 40 00       	cmp    DWORD PTR [esp+0x40],0x0
  525949:	0f 84 73 02 00 00    	je     0x525bc2
  52594f:	e8 bc d8 f6 ff       	call   0x493210
  525954:	85 c0                	test   eax,eax
  525956:	74 19                	je     0x525971
  525958:	33 c0                	xor    eax,eax
  52595a:	a0 de 28 89 00       	mov    al,ds:0x8928de
  52595f:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  525966:	51                   	push   ecx
  525967:	e8 d4 c1 f2 ff       	call   0x451b40
  52596c:	83 c4 04             	add    esp,0x4
  52596f:	eb 1c                	jmp    0x52598d
  525971:	33 c0                	xor    eax,eax
  525973:	a0 de 28 89 00       	mov    al,ds:0x8928de
  525978:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  52597f:	51                   	push   ecx
  525980:	68 88 16 59 00       	push   0x591688
  525985:	e8 a6 13 ff ff       	call   0x516d30
  52598a:	83 c4 08             	add    esp,0x8
  52598d:	80 3d 84 bb 89 00 00 	cmp    BYTE PTR ds:0x89bb84,0x0
  525994:	75 05                	jne    0x52599b
  525996:	e8 65 a1 f8 ff       	call   0x4afb00
  52599b:	66 a1 8d bb 89 00    	mov    ax,ds:0x89bb8d
  5259a1:	8b 15 93 bb 89 00    	mov    edx,DWORD PTR ds:0x89bb93
  5259a7:	66 8b 0d 8b bb 89 00 	mov    cx,WORD PTR ds:0x89bb8b
  5259ae:	50                   	push   eax
  5259af:	51                   	push   ecx
  5259b0:	a1 8f bb 89 00       	mov    eax,ds:0x89bb8f
  5259b5:	52                   	push   edx
  5259b6:	50                   	push   eax
  5259b7:	e8 84 e3 ff ff       	call   0x523d40
  5259bc:	83 c4 10             	add    esp,0x10
  5259bf:	8b 1d a7 bb 89 00    	mov    ebx,DWORD PTR ds:0x89bba7
  5259c5:	2b 1d 9f bb 89 00    	sub    ebx,DWORD PTR ds:0x89bb9f
  5259cb:	8b 35 9f bb 89 00    	mov    esi,DWORD PTR ds:0x89bb9f
  5259d1:	0f bf 0d 89 bb 89 00 	movsx  ecx,WORD PTR ds:0x89bb89
  5259d8:	8b 3d a3 bb 89 00    	mov    edi,DWORD PTR ds:0x89bba3
  5259de:	a1 ab bb 89 00       	mov    eax,ds:0x89bbab
  5259e3:	8b 14 8d a8 2b 97 00 	mov    edx,DWORD PTR [ecx*4+0x972ba8]
  5259ea:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  5259ee:	8b ea                	mov    ebp,edx
  5259f0:	89 54 24 10          	mov    DWORD PTR [esp+0x10],edx
  5259f4:	85 d2                	test   edx,edx
  5259f6:	0f 84 8e 00 00 00    	je     0x525a8a
  5259fc:	39 7c 24 28          	cmp    DWORD PTR [esp+0x28],edi
  525a00:	0f 8e 84 00 00 00    	jle    0x525a8a
  525a06:	8d 44 24 48          	lea    eax,[esp+0x48]
  525a0a:	68 00 02 00 00       	push   0x200
  525a0f:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  525a13:	50                   	push   eax
  525a14:	53                   	push   ebx
  525a15:	55                   	push   ebp
  525a16:	51                   	push   ecx
  525a17:	e8 f4 91 f3 ff       	call   0x45ec10
  525a1c:	83 c4 14             	add    esp,0x14
  525a1f:	8b e8                	mov    ebp,eax
  525a21:	e8 ea d7 f6 ff       	call   0x493210
  525a26:	85 c0                	test   eax,eax
  525a28:	74 17                	je     0x525a41
  525a2a:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  525a2f:	8d 4c 24 48          	lea    ecx,[esp+0x48]
  525a33:	50                   	push   eax
  525a34:	51                   	push   ecx
  525a35:	57                   	push   edi
  525a36:	56                   	push   esi
  525a37:	e8 64 c1 f2 ff       	call   0x451ba0
  525a3c:	83 c4 10             	add    esp,0x10
  525a3f:	eb 25                	jmp    0x525a66
  525a41:	83 ec 08             	sub    esp,0x8
  525a44:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  525a49:	89 64 24 1c          	mov    DWORD PTR [esp+0x1c],esp
  525a4d:	50                   	push   eax
  525a4e:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  525a52:	e8 19 05 ef ff       	call   0x415f70
  525a57:	8d 44 24 50          	lea    eax,[esp+0x50]
  525a5b:	50                   	push   eax
  525a5c:	57                   	push   edi
  525a5d:	56                   	push   esi
  525a5e:	e8 fd 1e 00 00       	call   0x527960
  525a63:	83 c4 14             	add    esp,0x14
  525a66:	e8 a5 d7 f6 ff       	call   0x493210
  525a6b:	6a 41                	push   0x41
  525a6d:	85 c0                	test   eax,eax
  525a6f:	74 07                	je     0x525a78
  525a71:	e8 7a cd f2 ff       	call   0x4527f0
  525a76:	eb 05                	jmp    0x525a7d
  525a78:	e8 c3 20 00 00       	call   0x527b40
  525a7d:	83 c4 04             	add    esp,0x4
  525a80:	03 f8                	add    edi,eax
  525a82:	85 ed                	test   ebp,ebp
  525a84:	0f 85 72 ff ff ff    	jne    0x5259fc
  525a8a:	c7 44 24 14 00 00 00 	mov    DWORD PTR [esp+0x14],0x0
  525a91:	00 
  525a92:	80 3d f2 bb 89 00 00 	cmp    BYTE PTR ds:0x89bbf2,0x0
  525a99:	0f 8e 23 01 00 00    	jle    0x525bc2
  525a9f:	bd c3 bb 89 00       	mov    ebp,0x89bbc3
  525aa4:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  525aa8:	8d 7d fc             	lea    edi,[ebp-0x4]
  525aab:	8a 80 ef bb 89 00    	mov    al,BYTE PTR [eax+0x89bbef]
  525ab1:	50                   	push   eax
  525ab2:	e8 f9 a3 f8 ff       	call   0x4afeb0
  525ab7:	83 c4 04             	add    esp,0x4
  525aba:	8b f0                	mov    esi,eax
  525abc:	8b 44 24 44          	mov    eax,DWORD PTR [esp+0x44]
  525ac0:	8b 00                	mov    eax,DWORD PTR [eax]
  525ac2:	39 07                	cmp    DWORD PTR [edi],eax
  525ac4:	7f 1b                	jg     0x525ae1
  525ac6:	39 45 04             	cmp    DWORD PTR [ebp+0x4],eax
  525ac9:	7c 16                	jl     0x525ae1
  525acb:	8b 44 24 44          	mov    eax,DWORD PTR [esp+0x44]
  525acf:	8b 40 04             	mov    eax,DWORD PTR [eax+0x4]
  525ad2:	39 45 00             	cmp    DWORD PTR [ebp+0x0],eax
  525ad5:	7f 0a                	jg     0x525ae1
  525ad7:	ba 01 00 00 00       	mov    edx,0x1
  525adc:	39 45 08             	cmp    DWORD PTR [ebp+0x8],eax
  525adf:	7d 02                	jge    0x525ae3
  525ae1:	33 d2                	xor    edx,edx
  525ae3:	85 d2                	test   edx,edx
  525ae5:	74 2e                	je     0x525b15
  525ae7:	80 3d 81 46 98 00 00 	cmp    BYTE PTR ds:0x984681,0x0
  525aee:	74 09                	je     0x525af9
  525af0:	80 3d 81 47 98 00 00 	cmp    BYTE PTR ds:0x984781,0x0
  525af7:	74 15                	je     0x525b0e
  525af9:	b8 01 00 00 00       	mov    eax,0x1
  525afe:	8a 0d 07 cf 89 00    	mov    cl,BYTE PTR ds:0x89cf07
  525b04:	d3 e0                	shl    eax,cl
  525b06:	85 05 7b 9d 89 00    	test   DWORD PTR ds:0x899d7b,eax
  525b0c:	74 07                	je     0x525b15
  525b0e:	b8 01 00 00 00       	mov    eax,0x1
  525b13:	eb 02                	jmp    0x525b17
  525b15:	33 c0                	xor    eax,eax
  525b17:	50                   	push   eax
  525b18:	52                   	push   edx
  525b19:	57                   	push   edi
  525b1a:	e8 41 ca f7 ff       	call   0x4a2560
  525b1f:	83 c4 0c             	add    esp,0xc
  525b22:	8b 3f                	mov    edi,DWORD PTR [edi]
  525b24:	8b 5d 04             	mov    ebx,DWORD PTR [ebp+0x4]
  525b27:	56                   	push   esi
  525b28:	e8 03 4b f7 ff       	call   0x49a630
  525b2d:	83 c4 04             	add    esp,0x4
  525b30:	2b d8                	sub    ebx,eax
  525b32:	2b df                	sub    ebx,edi
  525b34:	8b c3                	mov    eax,ebx
  525b36:	99                   	cdq
  525b37:	2b c2                	sub    eax,edx
  525b39:	c1 f8 01             	sar    eax,0x1
  525b3c:	03 f8                	add    edi,eax
  525b3e:	e8 cd d6 f6 ff       	call   0x493210
  525b43:	8b 5d 08             	mov    ebx,DWORD PTR [ebp+0x8]
  525b46:	6a 41                	push   0x41
  525b48:	85 c0                	test   eax,eax
  525b4a:	74 07                	je     0x525b53
  525b4c:	e8 9f cc f2 ff       	call   0x4527f0
  525b51:	eb 05                	jmp    0x525b58
  525b53:	e8 e8 1f 00 00       	call   0x527b40
  525b58:	83 c4 04             	add    esp,0x4
  525b5b:	2b d8                	sub    ebx,eax
  525b5d:	2b 5d 00             	sub    ebx,DWORD PTR [ebp+0x0]
  525b60:	8b c3                	mov    eax,ebx
  525b62:	8b 5d 00             	mov    ebx,DWORD PTR [ebp+0x0]
  525b65:	99                   	cdq
  525b66:	2b c2                	sub    eax,edx
  525b68:	c1 f8 01             	sar    eax,0x1
  525b6b:	03 d8                	add    ebx,eax
  525b6d:	e8 9e d6 f6 ff       	call   0x493210
  525b72:	85 c0                	test   eax,eax
  525b74:	74 13                	je     0x525b89
  525b76:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  525b7b:	50                   	push   eax
  525b7c:	56                   	push   esi
  525b7d:	53                   	push   ebx
  525b7e:	57                   	push   edi
  525b7f:	e8 1c c0 f2 ff       	call   0x451ba0
  525b84:	83 c4 10             	add    esp,0x10
  525b87:	eb 21                	jmp    0x525baa
  525b89:	83 ec 08             	sub    esp,0x8
  525b8c:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  525b91:	89 64 24 30          	mov    DWORD PTR [esp+0x30],esp
  525b95:	50                   	push   eax
  525b96:	8b 4c 24 34          	mov    ecx,DWORD PTR [esp+0x34]
  525b9a:	e8 d1 03 ef ff       	call   0x415f70
  525b9f:	56                   	push   esi
  525ba0:	53                   	push   ebx
  525ba1:	57                   	push   edi
  525ba2:	e8 b9 1d 00 00       	call   0x527960
  525ba7:	83 c4 14             	add    esp,0x14
  525baa:	83 c5 10             	add    ebp,0x10
  525bad:	ff 44 24 14          	inc    DWORD PTR [esp+0x14]
  525bb1:	0f be 05 f2 bb 89 00 	movsx  eax,BYTE PTR ds:0x89bbf2
  525bb8:	3b 44 24 14          	cmp    eax,DWORD PTR [esp+0x14]
  525bbc:	0f 8f e2 fe ff ff    	jg     0x525aa4
  525bc2:	5d                   	pop    ebp
  525bc3:	5f                   	pop    edi
  525bc4:	5e                   	pop    esi
  525bc5:	5b                   	pop    ebx
  525bc6:	81 c4 3c 04 00 00    	add    esp,0x43c
  525bcc:	c3                   	ret
