  49d6f8:	83 0d 74 a0 5d 00 08                            	or     DWORD PTR ds:0x5da074,0x8
  49d6ff:	68 b0 ac 5c 00                                  	push   0x5cacb0
  49d704:	68 98 ac 5c 00                                  	push   0x5cac98
  49d709:	68 80 ac 5c 00                                  	push   0x5cac80
  49d70e:	56                                              	push   esi
  49d70f:	e8 bc 46 00 00                                  	call   0x4a1dd0
  49d714:	83 c4 10                                        	add    esp,0x10
  49d717:	83 7e 5f 00                                     	cmp    DWORD PTR [esi+0x5f],0x0
  49d71b:	0f 84 68 01 00 00                               	je     0x49d889
  49d721:	8b 4e 4f                                        	mov    ecx,DWORD PTR [esi+0x4f]
  49d724:	85 c9                                           	test   ecx,ecx
  49d726:	0f 84 5d 01 00 00                               	je     0x49d889
  49d72c:	83 7e 08 00                                     	cmp    DWORD PTR [esi+0x8],0x0
  49d730:	0f 84 b1 00 00 00                               	je     0x49d7e7
  49d736:	83 7e 18 00                                     	cmp    DWORD PTR [esi+0x18],0x0
  49d73a:	75 0b                                           	jne    0x49d747
  49d73c:	83 7e 1c 00                                     	cmp    DWORD PTR [esi+0x1c],0x0
  49d740:	b8 00 00 00 00                                  	mov    eax,0x0
  49d745:	74 05                                           	je     0x49d74c
  49d747:	b8 01 00 00 00                                  	mov    eax,0x1
  49d74c:	03 c0                                           	add    eax,eax
  49d74e:	33 ed                                           	xor    ebp,ebp
  49d750:	8d 1c c0                                        	lea    ebx,[eax+eax*8]
  49d753:	03 d9                                           	add    ebx,ecx
  49d755:	33 c9                                           	xor    ecx,ecx
  49d757:	c1 e3 03                                        	shl    ebx,0x3
  49d75a:	03 1d 14 df 59 00                               	add    ebx,DWORD PTR ds:0x59df14
  49d760:	66 8b 4b 06                                     	mov    cx,WORD PTR [ebx+0x6]
  49d764:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  49d76d:	66 8b 6b 04                                     	mov    bp,WORD PTR [ebx+0x4]
  49d771:	74 41                                           	je     0x49d7b4
  49d773:	66 a1 cf c6 89 00                               	mov    ax,ds:0x89c6cf
  49d779:	66 39 05 44 a9 5c 00                            	cmp    WORD PTR ds:0x5ca944,ax
  49d780:	74 1e                                           	je     0x49d7a0
  49d782:	c7 44 24 10 80 02 00 00                         	mov    DWORD PTR [esp+0x10],0x280
  49d78a:	66 a3 44 a9 5c 00                               	mov    ds:0x5ca944,ax
  49d790:	0f bf c0                                        	movsx  eax,ax
  49d793:	c1 e0 10                                        	shl    eax,0x10
  49d796:	99                                              	cdq
  49d797:	f7 7c 24 10                                     	idiv   DWORD PTR [esp+0x10]
  49d79b:	a3 48 a9 5c 00                                  	mov    ds:0x5ca948,eax
  49d7a0:	0f af 0d 48 a9 5c 00                            	imul   ecx,DWORD PTR ds:0x5ca948
  49d7a7:	0f af 2d 48 a9 5c 00                            	imul   ebp,DWORD PTR ds:0x5ca948
  49d7ae:	c1 f9 10                                        	sar    ecx,0x10
  49d7b1:	c1 fd 10                                        	sar    ebp,0x10
  49d7b4:	8b 44 24 18                                     	mov    eax,DWORD PTR [esp+0x18]
  49d7b8:	51                                              	push   ecx
  49d7b9:	55                                              	push   ebp
  49d7ba:	03 c7                                           	add    eax,edi
  49d7bc:	99                                              	cdq
  49d7bd:	53                                              	push   ebx
  49d7be:	2b c2                                           	sub    eax,edx
  49d7c0:	c1 f8 01                                        	sar    eax,0x1
  49d7c3:	8b d8                                           	mov    ebx,eax
  49d7c5:	8b c1                                           	mov    eax,ecx
  49d7c7:	99                                              	cdq
  49d7c8:	2b c2                                           	sub    eax,edx
  49d7ca:	c1 f8 01                                        	sar    eax,0x1
  49d7cd:	2b d8                                           	sub    ebx,eax
  49d7cf:	8b 44 24 28                                     	mov    eax,DWORD PTR [esp+0x28]
  49d7d3:	03 44 24 20                                     	add    eax,DWORD PTR [esp+0x20]
  49d7d7:	53                                              	push   ebx
  49d7d8:	99                                              	cdq
  49d7d9:	2b c2                                           	sub    eax,edx
  49d7db:	c1 f8 01                                        	sar    eax,0x1
  49d7de:	8b c8                                           	mov    ecx,eax
  49d7e0:	8b c5                                           	mov    eax,ebp
  49d7e2:	e9 91 00 00 00                                  	jmp    0x49d878
  49d7e7:	a1 14 df 59 00                                  	mov    eax,ds:0x59df14
  49d7ec:	33 ed                                           	xor    ebp,ebp
  49d7ee:	66 8b 6c c8 4e                                  	mov    bp,WORD PTR [eax+ecx*8+0x4e]
  49d7f3:	33 db                                           	xor    ebx,ebx
  49d7f5:	66 8b 5c c8 4c                                  	mov    bx,WORD PTR [eax+ecx*8+0x4c]
  49d7fa:	8d 4c c8 48                                     	lea    ecx,[eax+ecx*8+0x48]
  49d7fe:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  49d807:	74 41                                           	je     0x49d84a
  49d809:	66 a1 cf c6 89 00                               	mov    ax,ds:0x89c6cf
  49d80f:	66 39 05 44 a9 5c 00                            	cmp    WORD PTR ds:0x5ca944,ax
  49d816:	74 1e                                           	je     0x49d836
  49d818:	c7 44 24 10 80 02 00 00                         	mov    DWORD PTR [esp+0x10],0x280
  49d820:	66 a3 44 a9 5c 00                               	mov    ds:0x5ca944,ax
  49d826:	0f bf c0                                        	movsx  eax,ax
  49d829:	c1 e0 10                                        	shl    eax,0x10
  49d82c:	99                                              	cdq
  49d82d:	f7 7c 24 10                                     	idiv   DWORD PTR [esp+0x10]
  49d831:	a3 48 a9 5c 00                                  	mov    ds:0x5ca948,eax
  49d836:	0f af 2d 48 a9 5c 00                            	imul   ebp,DWORD PTR ds:0x5ca948
  49d83d:	0f af 1d 48 a9 5c 00                            	imul   ebx,DWORD PTR ds:0x5ca948
  49d844:	c1 fd 10                                        	sar    ebp,0x10
  49d847:	c1 fb 10                                        	sar    ebx,0x10
  49d84a:	8b 44 24 18                                     	mov    eax,DWORD PTR [esp+0x18]
  49d84e:	55                                              	push   ebp
  49d84f:	53                                              	push   ebx
  49d850:	03 c7                                           	add    eax,edi
  49d852:	99                                              	cdq
  49d853:	51                                              	push   ecx
  49d854:	2b c2                                           	sub    eax,edx
  49d856:	c1 f8 01                                        	sar    eax,0x1
  49d859:	8b c8                                           	mov    ecx,eax
  49d85b:	8b c5                                           	mov    eax,ebp
  49d85d:	99                                              	cdq
  49d85e:	2b c2                                           	sub    eax,edx
  49d860:	c1 f8 01                                        	sar    eax,0x1
  49d863:	2b c8                                           	sub    ecx,eax
  49d865:	8b 44 24 28                                     	mov    eax,DWORD PTR [esp+0x28]
  49d869:	03 44 24 20                                     	add    eax,DWORD PTR [esp+0x20]
  49d86d:	51                                              	push   ecx
  49d86e:	99                                              	cdq
  49d86f:	2b c2                                           	sub    eax,edx
  49d871:	c1 f8 01                                        	sar    eax,0x1
  49d874:	8b c8                                           	mov    ecx,eax
  49d876:	8b c3                                           	mov    eax,ebx
  49d878:	99                                              	cdq
  49d879:	2b c2                                           	sub    eax,edx
  49d87b:	c1 f8 01                                        	sar    eax,0x1
  49d87e:	2b c8                                           	sub    ecx,eax
  49d880:	51                                              	push   ecx
  49d881:	e8 aa 8b 07 00                                  	call   0x516430
  49d886:	83 c4 14                                        	add    esp,0x14
  49d889:	8a 46 5a                                        	mov    al,BYTE PTR [esi+0x5a]
  49d88c:	3c 03                                           	cmp    al,0x3
  49d88e:	75 5a                                           	jne    0x49d8ea
  49d890:	f6 05 81 79 89 00 02                            	test   BYTE PTR ds:0x897981,0x2
  49d897:	0f 84 f6 00 00 00                               	je     0x49d993
  49d89d:	8b 3d 14 df 59 00                               	mov    edi,DWORD PTR ds:0x59df14
  49d8a3:	66 8b 87 f6 0a 00 00                            	mov    ax,WORD PTR [edi+0xaf6]
  49d8aa:	81 c7 f0 0a 00 00                               	add    edi,0xaf0
  49d8b0:	66 c1 e8 01                                     	shr    ax,0x1
  49d8b4:	57                                              	push   edi
  49d8b5:	0f b7 c0                                        	movzx  eax,ax
  49d8b8:	03 46 3b                                        	add    eax,DWORD PTR [esi+0x3b]
  49d8bb:	50                                              	push   eax
  49d8bc:	e8 4f c9 fa ff                                  	call   0x44a210
  49d8c1:	83 c4 04                                        	add    esp,0x4
  49d8c4:	50                                              	push   eax
  49d8c5:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  49d8c9:	66 c1 e8 01                                     	shr    ax,0x1
  49d8cd:	0f b7 c0                                        	movzx  eax,ax
  49d8d0:	03 46 37                                        	add    eax,DWORD PTR [esi+0x37]
  49d8d3:	50                                              	push   eax
  49d8d4:	e8 17 c9 fa ff                                  	call   0x44a1f0
  49d8d9:	83 c4 04                                        	add    esp,0x4
  49d8dc:	50                                              	push   eax
  49d8dd:	e8 fe 89 07 00                                  	call   0x5162e0
  49d8e2:	83 c4 0c                                        	add    esp,0xc
  49d8e5:	e9 a9 00 00 00                                  	jmp    0x49d993
  49d8ea:	3c 04                                           	cmp    al,0x4
  49d8ec:	0f 85 a1 00 00 00                               	jne    0x49d993
  49d8f2:	8b 0d 14 df 59 00                               	mov    ecx,DWORD PTR ds:0x59df14
  49d8f8:	33 db                                           	xor    ebx,ebx
  49d8fa:	66 8b 99 fe 20 00 00                            	mov    bx,WORD PTR [ecx+0x20fe]
  49d901:	81 c1 f8 20 00 00                               	add    ecx,0x20f8
  49d907:	33 f6                                           	xor    esi,esi
  49d909:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  49d912:	66 8b 71 04                                     	mov    si,WORD PTR [ecx+0x4]
  49d916:	74 3c                                           	je     0x49d954
  49d918:	66 a1 cf c6 89 00                               	mov    ax,ds:0x89c6cf
  49d91e:	66 39 05 44 a9 5c 00                            	cmp    WORD PTR ds:0x5ca944,ax
  49d925:	74 19                                           	je     0x49d940
  49d927:	66 a3 44 a9 5c 00                               	mov    ds:0x5ca944,ax
  49d92d:	bd 80 02 00 00                                  	mov    ebp,0x280
  49d932:	0f bf c0                                        	movsx  eax,ax
  49d935:	c1 e0 10                                        	shl    eax,0x10
  49d938:	99                                              	cdq
  49d939:	f7 fd                                           	idiv   ebp
  49d93b:	a3 48 a9 5c 00                                  	mov    ds:0x5ca948,eax
  49d940:	0f af 1d 48 a9 5c 00                            	imul   ebx,DWORD PTR ds:0x5ca948
  49d947:	0f af 35 48 a9 5c 00                            	imul   esi,DWORD PTR ds:0x5ca948
  49d94e:	c1 fb 10                                        	sar    ebx,0x10
  49d951:	c1 fe 10                                        	sar    esi,0x10
  49d954:	8b 44 24 18                                     	mov    eax,DWORD PTR [esp+0x18]
  49d958:	53                                              	push   ebx
  49d959:	56                                              	push   esi
  49d95a:	03 c7                                           	add    eax,edi
  49d95c:	99                                              	cdq
  49d95d:	51                                              	push   ecx
  49d95e:	2b c2                                           	sub    eax,edx
  49d960:	c1 f8 01                                        	sar    eax,0x1
  49d963:	8b c8                                           	mov    ecx,eax
  49d965:	8b c3                                           	mov    eax,ebx
  49d967:	99                                              	cdq
  49d968:	2b c2                                           	sub    eax,edx
  49d96a:	c1 f8 01                                        	sar    eax,0x1
  49d96d:	2b c8                                           	sub    ecx,eax
  49d96f:	8b 44 24 28                                     	mov    eax,DWORD PTR [esp+0x28]
  49d973:	03 44 24 20                                     	add    eax,DWORD PTR [esp+0x20]
  49d977:	51                                              	push   ecx
  49d978:	99                                              	cdq
  49d979:	2b c2                                           	sub    eax,edx
  49d97b:	c1 f8 01                                        	sar    eax,0x1
  49d97e:	8b c8                                           	mov    ecx,eax
  49d980:	8b c6                                           	mov    eax,esi
  49d982:	99                                              	cdq
  49d983:	2b c2                                           	sub    eax,edx
  49d985:	c1 f8 01                                        	sar    eax,0x1
  49d988:	2b c8                                           	sub    ecx,eax
  49d98a:	51                                              	push   ecx
  49d98b:	e8 a0 8a 07 00                                  	call   0x516430
  49d990:	83 c4 14                                        	add    esp,0x14
  49d993:	83 25 74 a0 5d 00 f7                            	and    DWORD PTR ds:0x5da074,0xfffffff7
  49dd9b:	83 0d 74 a0 5d 00 08                            	or     DWORD PTR ds:0x5da074,0x8
  49dda2:	c7 44 24 38 00 00 00 00                         	mov    DWORD PTR [esp+0x38],0x0
  49ddaa:	f6 05 7c d1 89 00 20                            	test   BYTE PTR ds:0x89d17c,0x20
  49ddb1:	75 43                                           	jne    0x49ddf6
  49ddb3:	0f be 15 f0 c6 89 00                            	movsx  edx,BYTE PTR ds:0x89c6f0
  49ddba:	8b c2                                           	mov    eax,edx
  49ddbc:	8a 4c 24 10                                     	mov    cl,BYTE PTR [esp+0x10]
  49ddc0:	c1 e2 03                                        	shl    edx,0x3
  49ddc3:	2b d0                                           	sub    edx,eax
  49ddc5:	b8 01 00 00 00                                  	mov    eax,0x1
  49ddca:	d3 e0                                           	shl    eax,cl
  49ddcc:	85 04 d5 0a 07 96 00                            	test   DWORD PTR [edx*8+0x96070a],eax
  49ddd3:	75 21                                           	jne    0x49ddf6
  49ddd5:	8b 8c 24 cc 00 00 00                            	mov    ecx,DWORD PTR [esp+0xcc]
  49dddc:	80 79 5a 04                                     	cmp    BYTE PTR [ecx+0x5a],0x4
  49dde0:	74 14                                           	je     0x49ddf6
  49dde2:	83 79 4f 00                                     	cmp    DWORD PTR [ecx+0x4f],0x0
  49dde6:	74 0e                                           	je     0x49ddf6
  49dde8:	83 79 63 00                                     	cmp    DWORD PTR [ecx+0x63],0x0
  49ddec:	74 08                                           	je     0x49ddf6
  49ddee:	c7 44 24 38 01 00 00 00                         	mov    DWORD PTR [esp+0x38],0x1
  49ddf6:	83 7c 24 38 00                                  	cmp    DWORD PTR [esp+0x38],0x0
  49ddfb:	74 11                                           	je     0x49de0e
  49ddfd:	68 40 ad 5c 00                                  	push   0x5cad40
  49de02:	68 28 ad 5c 00                                  	push   0x5cad28
  49de07:	68 10 ad 5c 00                                  	push   0x5cad10
  49de0c:	eb 0f                                           	jmp    0x49de1d
  49de0e:	68 f8 ac 5c 00                                  	push   0x5cacf8
  49de13:	68 e0 ac 5c 00                                  	push   0x5cace0
  49de18:	68 c8 ac 5c 00                                  	push   0x5cacc8
  49de1d:	8b 8c 24 d8 00 00 00                            	mov    ecx,DWORD PTR [esp+0xd8]
  49de24:	51                                              	push   ecx
  49de25:	e8 a6 3f 00 00                                  	call   0x4a1dd0
  49de2a:	8b 8c 24 dc 00 00 00                            	mov    ecx,DWORD PTR [esp+0xdc]
  49de31:	83 c4 10                                        	add    esp,0x10
  49de34:	83 79 4f 00                                     	cmp    DWORD PTR [ecx+0x4f],0x0
  49de38:	0f 84 67 07 00 00                               	je     0x49e5a5
  49de3e:	80 79 5a 04                                     	cmp    BYTE PTR [ecx+0x5a],0x4
  49de42:	0f 84 ad 06 00 00                               	je     0x49e4f5
  49de48:	83 79 18 00                                     	cmp    DWORD PTR [ecx+0x18],0x0
  49de4c:	75 10                                           	jne    0x49de5e
  49de4e:	83 79 1c 00                                     	cmp    DWORD PTR [ecx+0x1c],0x0
  49de52:	75 0a                                           	jne    0x49de5e
  49de54:	c7 44 24 30 00 00 00 00                         	mov    DWORD PTR [esp+0x30],0x0
  49de5c:	eb 08                                           	jmp    0x49de66
  49de5e:	c7 44 24 30 01 00 00 00                         	mov    DWORD PTR [esp+0x30],0x1
  49de66:	0f be 0d f0 c6 89 00                            	movsx  ecx,BYTE PTR ds:0x89c6f0
  49de6d:	8b 44 24 10                                     	mov    eax,DWORD PTR [esp+0x10]
  49de71:	50                                              	push   eax
  49de72:	51                                              	push   ecx
  49de73:	e8 c8 4c 02 00                                  	call   0x4c2b40
  49de78:	8b 8c 24 d4 00 00 00                            	mov    ecx,DWORD PTR [esp+0xd4]
  49de7f:	83 c4 08                                        	add    esp,0x8
  49de82:	8b f0                                           	mov    esi,eax
  49de84:	83 79 08 00                                     	cmp    DWORD PTR [ecx+0x8],0x0
  49de88:	74 69                                           	je     0x49def3
  49de8a:	83 7c 24 30 00                                  	cmp    DWORD PTR [esp+0x30],0x0
  49de8f:	8b 44 24 10                                     	mov    eax,DWORD PTR [esp+0x10]
  49de93:	75 46                                           	jne    0x49dedb
  49de95:	c1 e0 06                                        	shl    eax,0x6
  49de98:	2b 44 24 10                                     	sub    eax,DWORD PTR [esp+0x10]
  49de9c:	8b 4c 24 10                                     	mov    ecx,DWORD PTR [esp+0x10]
  49dea0:	2b 44 24 10                                     	sub    eax,DWORD PTR [esp+0x10]
  49dea4:	51                                              	push   ecx
  49dea5:	0f be 15 f0 c6 89 00                            	movsx  edx,BYTE PTR ds:0x89c6f0
  49deac:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  49deb0:	52                                              	push   edx
  49deb1:	0f bf 80 e0 80 5a 00                            	movsx  eax,WORD PTR [eax+0x5a80e0]
  49deb8:	c1 e0 03                                        	shl    eax,0x3
  49debb:	03 05 14 df 59 00                               	add    eax,DWORD PTR ds:0x59df14
  49dec1:	89 44 24 20                                     	mov    DWORD PTR [esp+0x20],eax
  49dec5:	e8 d6 4c 02 00                                  	call   0x4c2ba0
  49deca:	83 c4 08                                        	add    esp,0x8
  49decd:	85 c0                                           	test   eax,eax
  49decf:	75 49                                           	jne    0x49df1a
  49ded1:	85 f6                                           	test   esi,esi
  49ded3:	75 45                                           	jne    0x49df1a
  49ded5:	8b 44 24 14                                     	mov    eax,DWORD PTR [esp+0x14]
  49ded9:	eb 2b                                           	jmp    0x49df06
  49dedb:	c1 e0 06                                        	shl    eax,0x6
  49dede:	2b 44 24 10                                     	sub    eax,DWORD PTR [esp+0x10]
  49dee2:	2b 44 24 10                                     	sub    eax,DWORD PTR [esp+0x10]
  49dee6:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  49deea:	0f bf 80 e4 80 5a 00                            	movsx  eax,WORD PTR [eax+0x5a80e4]
  49def1:	eb 1a                                           	jmp    0x49df0d
  49def3:	8b 44 24 10                                     	mov    eax,DWORD PTR [esp+0x10]
  49def7:	c1 e0 06                                        	shl    eax,0x6
  49defa:	2b 44 24 10                                     	sub    eax,DWORD PTR [esp+0x10]
  49defe:	2b 44 24 10                                     	sub    eax,DWORD PTR [esp+0x10]
  49df02:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  49df06:	0f bf 80 e2 80 5a 00                            	movsx  eax,WORD PTR [eax+0x5a80e2]
  49df0d:	c1 e0 03                                        	shl    eax,0x3
  49df10:	03 05 14 df 59 00                               	add    eax,DWORD PTR ds:0x59df14
  49df16:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  49df1a:	8b 84 24 84 00 00 00                            	mov    eax,DWORD PTR [esp+0x84]
  49df21:	2b 44 24 7c                                     	sub    eax,DWORD PTR [esp+0x7c]
  49df25:	99                                              	cdq
  49df26:	83 e2 0f                                        	and    edx,0xf
  49df29:	89 44 24 50                                     	mov    DWORD PTR [esp+0x50],eax
  49df2d:	03 c2                                           	add    eax,edx
  49df2f:	8b 15 14 df 59 00                               	mov    edx,DWORD PTR ds:0x59df14
  49df35:	c1 f8 04                                        	sar    eax,0x4
  49df38:	33 c9                                           	xor    ecx,ecx
  49df3a:	66 8b 8a be 01 00 00                            	mov    cx,WORD PTR [edx+0x1be]
  49df41:	89 44 24 54                                     	mov    DWORD PTR [esp+0x54],eax
  49df45:	8b 44 24 7c                                     	mov    eax,DWORD PTR [esp+0x7c]
  49df49:	89 4c 24 68                                     	mov    DWORD PTR [esp+0x68],ecx
  49df4d:	03 44 24 54                                     	add    eax,DWORD PTR [esp+0x54]
  49df51:	89 44 24 4c                                     	mov    DWORD PTR [esp+0x4c],eax
  49df55:	a1 7c d1 89 00                                  	mov    eax,ds:0x89d17c
  49df5a:	83 e0 20                                        	and    eax,0x20
  49df5d:	83 f8 01                                        	cmp    eax,0x1
  49df60:	1b c0                                           	sbb    eax,eax
  49df62:	83 e0 f5                                        	and    eax,0xfffffff5
  49df65:	83 c0 41                                        	add    eax,0x41
  49df68:	89 44 24 6c                                     	mov    DWORD PTR [esp+0x6c],eax
  49df6c:	8b 44 24 10                                     	mov    eax,DWORD PTR [esp+0x10]
  49df70:	50                                              	push   eax
  49df71:	e8 da 4d 02 00                                  	call   0x4c2d50
  49df76:	89 44 24 30                                     	mov    DWORD PTR [esp+0x30],eax
  49df7a:	83 c4 04                                        	add    esp,0x4
  49df7d:	0f be 0d f0 c6 89 00                            	movsx  ecx,BYTE PTR ds:0x89c6f0
  49df84:	8b 44 24 10                                     	mov    eax,DWORD PTR [esp+0x10]
  49df88:	50                                              	push   eax
  49df89:	51                                              	push   ecx
  49df8a:	e8 b1 4b 02 00                                  	call   0x4c2b40
  49df8f:	8b 4c 24 18                                     	mov    ecx,DWORD PTR [esp+0x18]
  49df93:	89 44 24 50                                     	mov    DWORD PTR [esp+0x50],eax
  49df97:	83 c4 08                                        	add    esp,0x8
  49df9a:	0f be 15 f0 c6 89 00                            	movsx  edx,BYTE PTR ds:0x89c6f0
  49dfa1:	51                                              	push   ecx
  49dfa2:	52                                              	push   edx
  49dfa3:	33 f6                                           	xor    esi,esi
  49dfa5:	e8 36 4b 02 00                                  	call   0x4c2ae0
  49dfaa:	8b 4c 24 34                                     	mov    ecx,DWORD PTR [esp+0x34]
  49dfae:	89 44 24 78                                     	mov    DWORD PTR [esp+0x78],eax
  49dfb2:	83 c4 08                                        	add    esp,0x8
  49dfb5:	8d 94 89 0b db 98 00                            	lea    edx,[ecx+ecx*4+0x98db0b]
  49dfbc:	3b ce                                           	cmp    ecx,esi
  49dfbe:	89 54 24 58                                     	mov    DWORD PTR [esp+0x58],edx
  49dfc2:	0f 8e c5 00 00 00                               	jle    0x49e08d
  49dfc8:	39 74 24 48                                     	cmp    DWORD PTR [esp+0x48],esi
  49dfcc:	7e 11                                           	jle    0x49dfdf
  49dfce:	b8 41 00 00 00                                  	mov    eax,0x41
  49dfd3:	39 74 24 70                                     	cmp    DWORD PTR [esp+0x70],esi
  49dfd7:	7f 26                                           	jg     0x49dfff
  49dfd9:	8b 44 24 6c                                     	mov    eax,DWORD PTR [esp+0x6c]
  49dfdd:	eb 20                                           	jmp    0x49dfff
  49dfdf:	83 7c 24 38 00                                  	cmp    DWORD PTR [esp+0x38],0x0
  49dfe4:	74 0c                                           	je     0x49dff2
  49dfe6:	83 7c 24 30 01                                  	cmp    DWORD PTR [esp+0x30],0x1
  49dfeb:	1b c0                                           	sbb    eax,eax
  49dfed:	83 c0 43                                        	add    eax,0x43
  49dff0:	eb 0d                                           	jmp    0x49dfff
  49dff2:	83 7c 24 30 01                                  	cmp    DWORD PTR [esp+0x30],0x1
  49dff7:	1b c0                                           	sbb    eax,eax
  49dff9:	83 e0 f3                                        	and    eax,0xfffffff3
  49dffc:	83 c0 44                                        	add    eax,0x44
  49dfff:	8d 3c c5 00 00 00 00                            	lea    edi,[eax*8+0x0]
  49e006:	33 c9                                           	xor    ecx,ecx
  49e008:	03 3d 14 df 59 00                               	add    edi,DWORD PTR ds:0x59df14
  49e00e:	33 db                                           	xor    ebx,ebx
  49e010:	66 8b 4f 06                                     	mov    cx,WORD PTR [edi+0x6]
  49e014:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  49e01d:	66 8b 5f 04                                     	mov    bx,WORD PTR [edi+0x4]
  49e021:	74 3c                                           	je     0x49e05f
  49e023:	66 a1 cf c6 89 00                               	mov    ax,ds:0x89c6cf
  49e029:	66 39 05 44 a9 5c 00                            	cmp    WORD PTR ds:0x5ca944,ax
  49e030:	74 19                                           	je     0x49e04b
  49e032:	66 a3 44 a9 5c 00                               	mov    ds:0x5ca944,ax
  49e038:	bd 80 02 00 00                                  	mov    ebp,0x280
  49e03d:	0f bf c0                                        	movsx  eax,ax
  49e040:	c1 e0 10                                        	shl    eax,0x10
  49e043:	99                                              	cdq
  49e044:	f7 fd                                           	idiv   ebp
  49e046:	a3 48 a9 5c 00                                  	mov    ds:0x5ca948,eax
  49e04b:	0f af 0d 48 a9 5c 00                            	imul   ecx,DWORD PTR ds:0x5ca948
  49e052:	0f af 1d 48 a9 5c 00                            	imul   ebx,DWORD PTR ds:0x5ca948
  49e059:	c1 f9 10                                        	sar    ecx,0x10
  49e05c:	c1 fb 10                                        	sar    ebx,0x10
  49e05f:	8b 44 24 4c                                     	mov    eax,DWORD PTR [esp+0x4c]
  49e063:	51                                              	push   ecx
  49e064:	8b 4c 24 5c                                     	mov    ecx,DWORD PTR [esp+0x5c]
  49e068:	53                                              	push   ebx
  49e069:	57                                              	push   edi
  49e06a:	46                                              	inc    esi
  49e06b:	50                                              	push   eax
  49e06c:	0f be 01                                        	movsx  eax,BYTE PTR [ecx]
  49e06f:	03 84 24 88 00 00 00                            	add    eax,DWORD PTR [esp+0x88]
  49e076:	50                                              	push   eax
  49e077:	e8 b4 83 07 00                                  	call   0x516430
  49e07c:	ff 44 24 6c                                     	inc    DWORD PTR [esp+0x6c]
  49e080:	83 c4 14                                        	add    esp,0x14
  49e083:	39 74 24 2c                                     	cmp    DWORD PTR [esp+0x2c],esi
  49e087:	0f 8f 3b ff ff ff                               	jg     0x49dfc8
  49e08d:	8b 84 24 80 00 00 00                            	mov    eax,DWORD PTR [esp+0x80]
  49e094:	8b 7c 24 54                                     	mov    edi,DWORD PTR [esp+0x54]
  49e098:	2b 44 24 78                                     	sub    eax,DWORD PTR [esp+0x78]
  49e09c:	47                                              	inc    edi
  49e09d:	99                                              	cdq
  49e09e:	83 e2 0f                                        	and    edx,0xf
  49e0a1:	03 c2                                           	add    eax,edx
  49e0a3:	c1 f8 04                                        	sar    eax,0x4
  49e0a6:	8d 70 01                                        	lea    esi,[eax+0x1]
  49e0a9:	8b 44 24 50                                     	mov    eax,DWORD PTR [esp+0x50]
  49e0ad:	c1 e0 02                                        	shl    eax,0x2
  49e0b0:	99                                              	cdq
  49e0b1:	83 e2 1f                                        	and    edx,0x1f
  49e0b4:	03 c2                                           	add    eax,edx
  49e0b6:	c1 f8 05                                        	sar    eax,0x5
  49e0b9:	83 f8 04                                        	cmp    eax,0x4
  49e0bc:	7d 05                                           	jge    0x49e0c3
  49e0be:	b8 04 00 00 00                                  	mov    eax,0x4
  49e0c3:	83 f8 08                                        	cmp    eax,0x8
  49e0c6:	7e 05                                           	jle    0x49e0cd
  49e0c8:	b8 08 00 00 00                                  	mov    eax,0x8
  49e0cd:	8b 8c 24 84 00 00 00                            	mov    ecx,DWORD PTR [esp+0x84]
  49e0d4:	2b cf                                           	sub    ecx,edi
  49e0d6:	49                                              	dec    ecx
  49e0d7:	89 8c 24 a4 00 00 00                            	mov    DWORD PTR [esp+0xa4],ecx
  49e0de:	2b c8                                           	sub    ecx,eax
  49e0e0:	8b 44 24 78                                     	mov    eax,DWORD PTR [esp+0x78]
  49e0e4:	89 8c 24 9c 00 00 00                            	mov    DWORD PTR [esp+0x9c],ecx
  49e0eb:	03 c6                                           	add    eax,esi
  49e0ed:	33 c9                                           	xor    ecx,ecx
  49e0ef:	8b 54 24 18                                     	mov    edx,DWORD PTR [esp+0x18]
  49e0f3:	89 84 24 98 00 00 00                            	mov    DWORD PTR [esp+0x98],eax
  49e0fa:	8b 84 24 80 00 00 00                            	mov    eax,DWORD PTR [esp+0x80]
  49e101:	2b c6                                           	sub    eax,esi
  49e103:	33 f6                                           	xor    esi,esi
  49e105:	48                                              	dec    eax
  49e106:	89 84 24 a0 00 00 00                            	mov    DWORD PTR [esp+0xa0],eax
  49e10d:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  49e116:	66 8b 4a 06                                     	mov    cx,WORD PTR [edx+0x6]
  49e11a:	66 8b 72 04                                     	mov    si,WORD PTR [edx+0x4]
  49e11e:	74 3c                                           	je     0x49e15c
  49e120:	66 a1 cf c6 89 00                               	mov    ax,ds:0x89c6cf
  49e126:	66 39 05 44 a9 5c 00                            	cmp    WORD PTR ds:0x5ca944,ax
  49e12d:	74 19                                           	je     0x49e148
  49e12f:	66 a3 44 a9 5c 00                               	mov    ds:0x5ca944,ax
  49e135:	bf 80 02 00 00                                  	mov    edi,0x280
  49e13a:	0f bf c0                                        	movsx  eax,ax
  49e13d:	c1 e0 10                                        	shl    eax,0x10
  49e140:	99                                              	cdq
  49e141:	f7 ff                                           	idiv   edi
  49e143:	a3 48 a9 5c 00                                  	mov    ds:0x5ca948,eax
  49e148:	0f af 0d 48 a9 5c 00                            	imul   ecx,DWORD PTR ds:0x5ca948
  49e14f:	0f af 35 48 a9 5c 00                            	imul   esi,DWORD PTR ds:0x5ca948
  49e156:	c1 f9 10                                        	sar    ecx,0x10
  49e159:	c1 fe 10                                        	sar    esi,0x10
  49e15c:	8b 44 24 18                                     	mov    eax,DWORD PTR [esp+0x18]
  49e160:	51                                              	push   ecx
  49e161:	56                                              	push   esi
  49e162:	50                                              	push   eax
  49e163:	8b 84 24 a8 00 00 00                            	mov    eax,DWORD PTR [esp+0xa8]
  49e16a:	03 44 24 74                                     	add    eax,DWORD PTR [esp+0x74]
  49e16e:	03 44 24 58                                     	add    eax,DWORD PTR [esp+0x58]
  49e172:	99                                              	cdq
  49e173:	2b c2                                           	sub    eax,edx
  49e175:	c1 f8 01                                        	sar    eax,0x1
  49e178:	8b f8                                           	mov    edi,eax
  49e17a:	8b c1                                           	mov    eax,ecx
  49e17c:	99                                              	cdq
  49e17d:	2b c2                                           	sub    eax,edx
  49e17f:	c1 f8 01                                        	sar    eax,0x1
  49e182:	2b f8                                           	sub    edi,eax
  49e184:	8b 84 24 8c 00 00 00                            	mov    eax,DWORD PTR [esp+0x8c]
  49e18b:	03 84 24 84 00 00 00                            	add    eax,DWORD PTR [esp+0x84]
  49e192:	57                                              	push   edi
  49e193:	99                                              	cdq
  49e194:	2b c2                                           	sub    eax,edx
  49e196:	c1 f8 01                                        	sar    eax,0x1
  49e199:	8b c8                                           	mov    ecx,eax
  49e19b:	8b c6                                           	mov    eax,esi
  49e19d:	99                                              	cdq
  49e19e:	2b c2                                           	sub    eax,edx
  49e1a0:	c1 f8 01                                        	sar    eax,0x1
  49e1a3:	2b c8                                           	sub    ecx,eax
  49e1a5:	51                                              	push   ecx
  49e1a6:	e8 85 82 07 00                                  	call   0x516430
  49e1ab:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  49e1af:	83 c4 14                                        	add    esp,0x14
  49e1b2:	51                                              	push   ecx
  49e1b3:	e8 e8 4a 02 00                                  	call   0x4c2ca0
  49e1b8:	83 c4 04                                        	add    esp,0x4
  49e1bb:	84 c0                                           	test   al,al
  49e1bd:	0f 84 e2 03 00 00                               	je     0x49e5a5
  49e1c3:	f6 05 7c d1 89 00 20                            	test   BYTE PTR ds:0x89d17c,0x20
  49e1ca:	0f 85 d5 03 00 00                               	jne    0x49e5a5
  49e1d0:	ba 01 00 00 00                                  	mov    edx,0x1
  49e1d5:	8a 4c 24 10                                     	mov    cl,BYTE PTR [esp+0x10]
  49e1d9:	0f be 35 f0 c6 89 00                            	movsx  esi,BYTE PTR ds:0x89c6f0
  49e1e0:	d3 e2                                           	shl    edx,cl
  49e1e2:	8d 04 f5 00 00 00 00                            	lea    eax,[esi*8+0x0]
  49e1e9:	2b c6                                           	sub    eax,esi
  49e1eb:	85 14 c5 0a 07 96 00                            	test   DWORD PTR [eax*8+0x96070a],edx
  49e1f2:	0f 84 ad 03 00 00                               	je     0x49e5a5
  49e1f8:	8b 44 24 10                                     	mov    eax,DWORD PTR [esp+0x10]
  49e1fc:	50                                              	push   eax
  49e1fd:	56                                              	push   esi
  49e1fe:	e8 9d 49 02 00                                  	call   0x4c2ba0
  49e203:	83 c4 08                                        	add    esp,0x8
  49e206:	85 c0                                           	test   eax,eax
  49e208:	0f 84 97 03 00 00                               	je     0x49e5a5
  49e20e:	33 ff                                           	xor    edi,edi
  49e210:	8b 8c 24 cc 00 00 00                            	mov    ecx,DWORD PTR [esp+0xcc]
  49e217:	39 79 18                                        	cmp    DWORD PTR [ecx+0x18],edi
  49e21a:	0f 85 85 03 00 00                               	jne    0x49e5a5
  49e220:	39 79 1c                                        	cmp    DWORD PTR [ecx+0x1c],edi
  49e223:	0f 85 7c 03 00 00                               	jne    0x49e5a5
  49e229:	8b 44 24 14                                     	mov    eax,DWORD PTR [esp+0x14]
  49e22d:	8b 88 d4 80 5a 00                               	mov    ecx,DWORD PTR [eax+0x5a80d4]
  49e233:	0f be 05 f0 c6 89 00                            	movsx  eax,BYTE PTR ds:0x89c6f0
  49e23a:	8d 14 80                                        	lea    edx,[eax+eax*4]
  49e23d:	89 4c 24 1c                                     	mov    DWORD PTR [esp+0x1c],ecx
  49e241:	8b c8                                           	mov    ecx,eax
  49e243:	8d 04 51                                        	lea    eax,[ecx+edx*2]
  49e246:	8d 1c c0                                        	lea    ebx,[eax+eax*8]
  49e249:	8b 44 24 10                                     	mov    eax,DWORD PTR [esp+0x10]
  49e24d:	89 bc 24 94 00 00 00                            	mov    DWORD PTR [esp+0x94],edi
  49e254:	8d 14 d9                                        	lea    edx,[ecx+ebx*8]
  49e257:	89 bc 24 90 00 00 00                            	mov    DWORD PTR [esp+0x90],edi
  49e25e:	89 bc 24 8c 00 00 00                            	mov    DWORD PTR [esp+0x8c],edi
  49e265:	8d 0c 91                                        	lea    ecx,[ecx+edx*4]
  49e268:	8b b4 24 a0 00 00 00                            	mov    esi,DWORD PTR [esp+0xa0]
  49e26f:	2b b4 24 98 00 00 00                            	sub    esi,DWORD PTR [esp+0x98]
  49e276:	89 bc 24 88 00 00 00                            	mov    DWORD PTR [esp+0x88],edi
  49e27d:	8b 94 81 31 db 89 00                            	mov    edx,DWORD PTR [ecx+eax*4+0x89db31]
  49e284:	83 ee 02                                        	sub    esi,0x2
  49e287:	81 c1 c8 d1 89 00                               	add    ecx,0x89d1c8
  49e28d:	68 e0 a9 5c 00                                  	push   0x5ca9e0
  49e292:	8d 84 24 9c 00 00 00                            	lea    eax,[esp+0x9c]
  49e299:	89 54 24 44                                     	mov    DWORD PTR [esp+0x44],edx
  49e29d:	89 4c 24 48                                     	mov    DWORD PTR [esp+0x48],ecx
  49e2a1:	50                                              	push   eax
  49e2a2:	e8 a9 3c 00 00                                  	call   0x4a1f50
  49e2a7:	8d 94 24 a0 00 00 00                            	lea    edx,[esp+0xa0]
  49e2ae:	8d 8c 24 90 00 00 00                            	lea    ecx,[esp+0x90]
  49e2b5:	83 c4 08                                        	add    esp,0x8
  49e2b8:	8b 02                                           	mov    eax,DWORD PTR [edx]
  49e2ba:	8b 5a 04                                        	mov    ebx,DWORD PTR [edx+0x4]
  49e2bd:	8b 6a 08                                        	mov    ebp,DWORD PTR [edx+0x8]
  49e2c0:	89 01                                           	mov    DWORD PTR [ecx],eax
  49e2c2:	8b 42 0c                                        	mov    eax,DWORD PTR [edx+0xc]
  49e2c5:	89 59 04                                        	mov    DWORD PTR [ecx+0x4],ebx
  49e2c8:	89 69 08                                        	mov    DWORD PTR [ecx+0x8],ebp
  49e2cb:	89 41 0c                                        	mov    DWORD PTR [ecx+0xc],eax
  49e2ce:	8b 84 24 9c 00 00 00                            	mov    eax,DWORD PTR [esp+0x9c]
  49e2d5:	40                                              	inc    eax
  49e2d6:	ff 8c 24 94 00 00 00                            	dec    DWORD PTR [esp+0x94]
  49e2dd:	89 84 24 8c 00 00 00                            	mov    DWORD PTR [esp+0x8c],eax
  49e2e4:	ff 84 24 88 00 00 00                            	inc    DWORD PTR [esp+0x88]
  49e2eb:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  49e2ef:	99                                              	cdq
  49e2f0:	f7 fe                                           	idiv   esi
  49e2f2:	8b e8                                           	mov    ebp,eax
  49e2f4:	3b f0                                           	cmp    esi,eax
  49e2f6:	7d 0a                                           	jge    0x49e302
  49e2f8:	8b e8                                           	mov    ebp,eax
  49e2fa:	47                                              	inc    edi
  49e2fb:	99                                              	cdq
  49e2fc:	f7 fe                                           	idiv   esi
  49e2fe:	3b f0                                           	cmp    esi,eax
  49e300:	7c f6                                           	jl     0x49e2f8
  49e302:	bb f0 00 00 00                                  	mov    ebx,0xf0
  49e307:	2b df                                           	sub    ebx,edi
  49e309:	39 6c 24 1c                                     	cmp    DWORD PTR [esp+0x1c],ebp
  49e30d:	7e 61                                           	jle    0x49e370
  49e30f:	81 fb ef 00 00 00                               	cmp    ebx,0xef
  49e315:	7e 05                                           	jle    0x49e31c
  49e317:	bb ef 00 00 00                                  	mov    ebx,0xef
  49e31c:	8b 44 24 40                                     	mov    eax,DWORD PTR [esp+0x40]
  49e320:	99                                              	cdq
  49e321:	f7 fd                                           	idiv   ebp
  49e323:	8b c2                                           	mov    eax,edx
  49e325:	0f af c6                                        	imul   eax,esi
  49e328:	99                                              	cdq
  49e329:	f7 fd                                           	idiv   ebp
  49e32b:	3b c6                                           	cmp    eax,esi
  49e32d:	7e 02                                           	jle    0x49e331
  49e32f:	8b c6                                           	mov    eax,esi
  49e331:	8b 8c 24 88 00 00 00                            	mov    ecx,DWORD PTR [esp+0x88]
  49e338:	83 ec 08                                        	sub    esp,0x8
  49e33b:	03 c8                                           	add    ecx,eax
  49e33d:	89 64 24 6c                                     	mov    DWORD PTR [esp+0x6c],esp
  49e341:	89 8c 24 98 00 00 00                            	mov    DWORD PTR [esp+0x98],ecx
  49e348:	53                                              	push   ebx
  49e349:	8b 4c 24 70                                     	mov    ecx,DWORD PTR [esp+0x70]
  49e34d:	43                                              	inc    ebx
  49e34e:	e8 7d 42 fb ff                                  	call   0x4525d0
  49e353:	8d 8c 24 90 00 00 00                            	lea    ecx,[esp+0x90]
  49e35a:	51                                              	push   ecx
  49e35b:	e8 30 85 07 00                                  	call   0x516890
  49e360:	83 c4 0c                                        	add    esp,0xc
  49e363:	8b c6                                           	mov    eax,esi
  49e365:	0f af c5                                        	imul   eax,ebp
  49e368:	8b e8                                           	mov    ebp,eax
  49e36a:	39 6c 24 1c                                     	cmp    DWORD PTR [esp+0x1c],ebp
  49e36e:	7f 9f                                           	jg     0x49e30f
  49e370:	8b 44 24 2c                                     	mov    eax,DWORD PTR [esp+0x2c]
  49e374:	3b 44 24 48                                     	cmp    eax,DWORD PTR [esp+0x48]
  49e378:	0f 8e 18 01 00 00                               	jle    0x49e496
  49e37e:	8b 44 24 44                                     	mov    eax,DWORD PTR [esp+0x44]
  49e382:	83 b8 51 09 00 00 00                            	cmp    DWORD PTR [eax+0x951],0x0
  49e389:	0f 84 07 01 00 00                               	je     0x49e496
  49e38f:	66 83 b8 05 0a 00 00 00                         	cmp    WORD PTR [eax+0xa05],0x0
  49e397:	0f 85 f9 00 00 00                               	jne    0x49e496
  49e39d:	8b 0d 72 bc 89 00                               	mov    ecx,DWORD PTR ds:0x89bc72
  49e3a3:	8b c1                                           	mov    eax,ecx
  49e3a5:	8d 14 c9                                        	lea    edx,[ecx+ecx*8]
  49e3a8:	8d 0c d0                                        	lea    ecx,[eax+edx*8]
  49e3ab:	8d 0c 88                                        	lea    ecx,[eax+ecx*4]
  49e3ae:	c1 e1 02                                        	shl    ecx,0x2
  49e3b1:	8d 0c c8                                        	lea    ecx,[eax+ecx*8]
  49e3b4:	81 c1 df 24 00 00                               	add    ecx,0x24df
  49e3ba:	89 0d 72 bc 89 00                               	mov    DWORD PTR ds:0x89bc72,ecx
  49e3c0:	89 4c 24 28                                     	mov    DWORD PTR [esp+0x28],ecx
  49e3c4:	c1 4c 24 28 0d                                  	ror    DWORD PTR [esp+0x28],0xd
  49e3c9:	8b 44 24 28                                     	mov    eax,DWORD PTR [esp+0x28]
  49e3cd:	a3 72 bc 89 00                                  	mov    ds:0x89bc72,eax
  49e3d2:	24 07                                           	and    al,0x7
  49e3d4:	3c 01                                           	cmp    al,0x1
  49e3d6:	0f 85 ba 00 00 00                               	jne    0x49e496
  49e3dc:	8b 44 24 28                                     	mov    eax,DWORD PTR [esp+0x28]
  49e3e0:	8b c8                                           	mov    ecx,eax
  49e3e2:	8d 14 c0                                        	lea    edx,[eax+eax*8]
  49e3e5:	8d 04 d1                                        	lea    eax,[ecx+edx*8]
  49e3e8:	8d 04 81                                        	lea    eax,[ecx+eax*4]
  49e3eb:	c1 e0 02                                        	shl    eax,0x2
  49e3ee:	8d 04 c1                                        	lea    eax,[ecx+eax*8]
  49e3f1:	05 df 24 00 00                                  	add    eax,0x24df
  49e3f6:	89 44 24 34                                     	mov    DWORD PTR [esp+0x34],eax
  49e3fa:	c1 4c 24 34 0d                                  	ror    DWORD PTR [esp+0x34],0xd
  49e3ff:	8b 44 24 34                                     	mov    eax,DWORD PTR [esp+0x34]
  49e403:	8b 9c 24 90 00 00 00                            	mov    ebx,DWORD PTR [esp+0x90]
  49e40a:	8b c8                                           	mov    ecx,eax
  49e40c:	a3 72 bc 89 00                                  	mov    ds:0x89bc72,eax
  49e411:	83 e1 03                                        	and    ecx,0x3
  49e414:	a1 14 df 59 00                                  	mov    eax,ds:0x59df14
  49e419:	8d bc c8 a0 28 00 00                            	lea    edi,[eax+ecx*8+0x28a0]
  49e420:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  49e424:	66 c1 e8 01                                     	shr    ax,0x1
  49e428:	0f b7 c8                                        	movzx  ecx,ax
  49e42b:	2b d9                                           	sub    ebx,ecx
  49e42d:	33 c0                                           	xor    eax,eax
  49e42f:	66 8b 47 06                                     	mov    ax,WORD PTR [edi+0x6]
  49e433:	8d 14 80                                        	lea    edx,[eax+eax*4]
  49e436:	8d 04 50                                        	lea    eax,[eax+edx*2]
  49e439:	c1 e0 04                                        	shl    eax,0x4
  49e43c:	f7 d8                                           	neg    eax
  49e43e:	99                                              	cdq
  49e43f:	81 e2 ff 00 00 00                               	and    edx,0xff
  49e445:	03 c2                                           	add    eax,edx
  49e447:	c1 f8 08                                        	sar    eax,0x8
  49e44a:	8b c8                                           	mov    ecx,eax
  49e44c:	8b 84 24 8c 00 00 00                            	mov    eax,DWORD PTR [esp+0x8c]
  49e453:	03 84 24 94 00 00 00                            	add    eax,DWORD PTR [esp+0x94]
  49e45a:	68 00 f0 87 00                                  	push   0x87f000
  49e45f:	99                                              	cdq
  49e460:	2b c2                                           	sub    eax,edx
  49e462:	c1 f8 01                                        	sar    eax,0x1
  49e465:	83 0d 74 a0 5d 00 08                            	or     DWORD PTR ds:0x5da074,0x8
  49e46c:	8d 2c 01                                        	lea    ebp,[ecx+eax*1]
  49e46f:	e8 fc 7d 07 00                                  	call   0x516270
  49e474:	83 c4 04                                        	add    esp,0x4
  49e477:	57                                              	push   edi
  49e478:	55                                              	push   ebp
  49e479:	53                                              	push   ebx
  49e47a:	e8 61 7e 07 00                                  	call   0x5162e0
  49e47f:	83 c4 0c                                        	add    esp,0xc
  49e482:	68 60 45 97 00                                  	push   0x974560
  49e487:	e8 e4 7d 07 00                                  	call   0x516270
  49e48c:	83 25 74 a0 5d 00 f7                            	and    DWORD PTR ds:0x5da074,0xfffffff7
  49e496:	83 7c 24 1c 00                                  	cmp    DWORD PTR [esp+0x1c],0x0
  49e49b:	8b c6                                           	mov    eax,esi
  49e49d:	7e 0c                                           	jle    0x49e4ab
  49e49f:	8b c6                                           	mov    eax,esi
  49e4a1:	0f af 44 24 40                                  	imul   eax,DWORD PTR [esp+0x40]
  49e4a6:	99                                              	cdq
  49e4a7:	f7 7c 24 1c                                     	idiv   DWORD PTR [esp+0x1c]
  49e4ab:	3b c6                                           	cmp    eax,esi
  49e4ad:	7e 02                                           	jle    0x49e4b1
  49e4af:	8b c6                                           	mov    eax,esi
  49e4b1:	8b 8c 24 88 00 00 00                            	mov    ecx,DWORD PTR [esp+0x88]
  49e4b8:	83 ec 08                                        	sub    esp,0x8
  49e4bb:	03 c8                                           	add    ecx,eax
  49e4bd:	89 64 24 68                                     	mov    DWORD PTR [esp+0x68],esp
  49e4c1:	0f be 05 f0 c6 89 00                            	movsx  eax,BYTE PTR ds:0x89c6f0
  49e4c8:	89 8c 24 98 00 00 00                            	mov    DWORD PTR [esp+0x98],ecx
  49e4cf:	8a 84 80 cc 89 5a 00                            	mov    al,BYTE PTR [eax+eax*4+0x5a89cc]
  49e4d6:	8b 4c 24 68                                     	mov    ecx,DWORD PTR [esp+0x68]
  49e4da:	50                                              	push   eax
  49e4db:	e8 90 7a f7 ff                                  	call   0x415f70
  49e4e0:	8d 8c 24 90 00 00 00                            	lea    ecx,[esp+0x90]
  49e4e7:	51                                              	push   ecx
  49e4e8:	e8 a3 83 07 00                                  	call   0x516890
  49e4ed:	83 c4 0c                                        	add    esp,0xc
  49e4f0:	e9 b0 00 00 00                                  	jmp    0x49e5a5
  49e4f5:	8b 0d 14 df 59 00                               	mov    ecx,DWORD PTR ds:0x59df14
  49e4fb:	33 ff                                           	xor    edi,edi
  49e4fd:	81 c1 00 21 00 00                               	add    ecx,0x2100
  49e503:	33 f6                                           	xor    esi,esi
  49e505:	83 0d 74 a0 5d 00 08                            	or     DWORD PTR ds:0x5da074,0x8
  49e50c:	66 8b 79 06                                     	mov    di,WORD PTR [ecx+0x6]
  49e510:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  49e519:	66 8b 71 04                                     	mov    si,WORD PTR [ecx+0x4]
  49e51d:	74 3c                                           	je     0x49e55b
  49e51f:	66 a1 cf c6 89 00                               	mov    ax,ds:0x89c6cf
  49e525:	66 39 05 44 a9 5c 00                            	cmp    WORD PTR ds:0x5ca944,ax
  49e52c:	74 19                                           	je     0x49e547
  49e52e:	66 a3 44 a9 5c 00                               	mov    ds:0x5ca944,ax
  49e534:	bb 80 02 00 00                                  	mov    ebx,0x280
  49e539:	0f bf c0                                        	movsx  eax,ax
  49e53c:	c1 e0 10                                        	shl    eax,0x10
  49e53f:	99                                              	cdq
  49e540:	f7 fb                                           	idiv   ebx
  49e542:	a3 48 a9 5c 00                                  	mov    ds:0x5ca948,eax
  49e547:	0f af 3d 48 a9 5c 00                            	imul   edi,DWORD PTR ds:0x5ca948
  49e54e:	0f af 35 48 a9 5c 00                            	imul   esi,DWORD PTR ds:0x5ca948
  49e555:	c1 ff 10                                        	sar    edi,0x10
  49e558:	c1 fe 10                                        	sar    esi,0x10
  49e55b:	8b 44 24 7c                                     	mov    eax,DWORD PTR [esp+0x7c]
  49e55f:	57                                              	push   edi
  49e560:	03 84 24 88 00 00 00                            	add    eax,DWORD PTR [esp+0x88]
  49e567:	56                                              	push   esi
  49e568:	99                                              	cdq
  49e569:	51                                              	push   ecx
  49e56a:	2b c2                                           	sub    eax,edx
  49e56c:	c1 f8 01                                        	sar    eax,0x1
  49e56f:	8b c8                                           	mov    ecx,eax
  49e571:	8b c7                                           	mov    eax,edi
  49e573:	99                                              	cdq
  49e574:	2b c2                                           	sub    eax,edx
  49e576:	c1 f8 01                                        	sar    eax,0x1
  49e579:	2b c8                                           	sub    ecx,eax
  49e57b:	8b 84 24 8c 00 00 00                            	mov    eax,DWORD PTR [esp+0x8c]
  49e582:	03 84 24 84 00 00 00                            	add    eax,DWORD PTR [esp+0x84]
  49e589:	51                                              	push   ecx
  49e58a:	99                                              	cdq
  49e58b:	2b c2                                           	sub    eax,edx
  49e58d:	c1 f8 01                                        	sar    eax,0x1
  49e590:	8b c8                                           	mov    ecx,eax
  49e592:	8b c6                                           	mov    eax,esi
  49e594:	99                                              	cdq
  49e595:	2b c2                                           	sub    eax,edx
  49e597:	c1 f8 01                                        	sar    eax,0x1
  49e59a:	2b c8                                           	sub    ecx,eax
  49e59c:	51                                              	push   ecx
  49e59d:	e8 8e 7e 07 00                                  	call   0x516430
  49e5a2:	83 c4 14                                        	add    esp,0x14
  49e5a5:	83 25 74 a0 5d 00 f7                            	and    DWORD PTR ds:0x5da074,0xfffffff7
  4a026e:	83 0d 74 a0 5d 00 08                            	or     DWORD PTR ds:0x5da074,0x8
  4a0275:	68 d8 ab 5c 00                                  	push   0x5cabd8
  4a027a:	68 c0 ab 5c 00                                  	push   0x5cabc0
  4a027f:	68 a8 ab 5c 00                                  	push   0x5caba8
  4a0284:	57                                              	push   edi
  4a0285:	e8 46 1b 00 00                                  	call   0x4a1dd0
  4a028a:	83 c4 10                                        	add    esp,0x10
  4a028d:	83 7f 08 00                                     	cmp    DWORD PTR [edi+0x8],0x0
  4a0291:	0f 84 66 02 00 00                               	je     0x4a04fd
  4a0297:	8b 4f 4f                                        	mov    ecx,DWORD PTR [edi+0x4f]
  4a029a:	85 c9                                           	test   ecx,ecx
  4a029c:	0f 84 5b 02 00 00                               	je     0x4a04fd
  4a02a2:	83 7f 18 00                                     	cmp    DWORD PTR [edi+0x18],0x0
  4a02a6:	75 0b                                           	jne    0x4a02b3
  4a02a8:	83 7f 1c 00                                     	cmp    DWORD PTR [edi+0x1c],0x0
  4a02ac:	b8 00 00 00 00                                  	mov    eax,0x0
  4a02b1:	74 05                                           	je     0x4a02b8
  4a02b3:	b8 01 00 00 00                                  	mov    eax,0x1
  4a02b8:	03 c8                                           	add    ecx,eax
  4a02ba:	8b 57 63                                        	mov    edx,DWORD PTR [edi+0x63]
  4a02bd:	0f be 05 f0 c6 89 00                            	movsx  eax,BYTE PTR ds:0x89c6f0
  4a02c4:	8d 1c cd 00 00 00 00                            	lea    ebx,[ecx*8+0x0]
  4a02cb:	42                                              	inc    edx
  4a02cc:	8d 2c 80                                        	lea    ebp,[eax+eax*4]
  4a02cf:	03 1d 14 df 59 00                               	add    ebx,DWORD PTR ds:0x59df14
  4a02d5:	8b c8                                           	mov    ecx,eax
  4a02d7:	8d 04 69                                        	lea    eax,[ecx+ebp*2]
  4a02da:	8d 3c c0                                        	lea    edi,[eax+eax*8]
  4a02dd:	8d 2c f9                                        	lea    ebp,[ecx+edi*8]
  4a02e0:	8d 04 a9                                        	lea    eax,[ecx+ebp*4]
  4a02e3:	f6 80 05 db 89 00 80                            	test   BYTE PTR [eax+0x89db05],0x80
  4a02ea:	74 20                                           	je     0x4a030c
  4a02ec:	33 ff                                           	xor    edi,edi
  4a02ee:	b9 01 00 00 00                                  	mov    ecx,0x1
  4a02f3:	8d 94 50 f1 dc 89 00                            	lea    edx,[eax+edx*2+0x89dcf1]
  4a02fa:	b8 05 00 00 00                                  	mov    eax,0x5
  4a02ff:	0f bf 2a                                        	movsx  ebp,WORD PTR [edx]
  4a0302:	03 fd                                           	add    edi,ebp
  4a0304:	83 c2 0c                                        	add    edx,0xc
  4a0307:	48                                              	dec    eax
  4a0308:	75 f5                                           	jne    0x4a02ff
  4a030a:	eb 1b                                           	jmp    0x4a0327
  4a030c:	33 ff                                           	xor    edi,edi
  4a030e:	33 c9                                           	xor    ecx,ecx
  4a0310:	8d 94 50 85 dc 89 00                            	lea    edx,[eax+edx*2+0x89dc85]
  4a0317:	b8 05 00 00 00                                  	mov    eax,0x5
  4a031c:	0f bf 2a                                        	movsx  ebp,WORD PTR [edx]
  4a031f:	03 fd                                           	add    edi,ebp
  4a0321:	83 c2 0c                                        	add    edx,0xc
  4a0324:	48                                              	dec    eax
  4a0325:	75 f5                                           	jne    0x4a031c
  4a0327:	83 ff 64                                        	cmp    edi,0x64
  4a032a:	7d 1b                                           	jge    0x4a0347
  4a032c:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  4a0335:	7c 10                                           	jl     0x4a0347
  4a0337:	66 81 3d d1 c6 89 00 e0 01                      	cmp    WORD PTR ds:0x89c6d1,0x1e0
  4a0340:	bd 04 00 00 00                                  	mov    ebp,0x4
  4a0345:	7d 05                                           	jge    0x4a034c
  4a0347:	bd 06 00 00 00                                  	mov    ebp,0x6
  4a034c:	03 e9                                           	add    ebp,ecx
  4a034e:	e8 bd 2e ff ff                                  	call   0x493210
  4a0353:	85 c0                                           	test   eax,eax
  4a0355:	8b 04 ad d0 cb 87 00                            	mov    eax,DWORD PTR [ebp*4+0x87cbd0]
  4a035c:	50                                              	push   eax
  4a035d:	74 0a                                           	je     0x4a0369
  4a035f:	e8 dc 17 fb ff                                  	call   0x451b40
  4a0364:	83 c4 04                                        	add    esp,0x4
  4a0367:	eb 0d                                           	jmp    0x4a0376
  4a0369:	68 88 16 59 00                                  	push   0x591688
  4a036e:	e8 bd 69 07 00                                  	call   0x516d30
  4a0373:	83 c4 08                                        	add    esp,0x8
  4a0376:	57                                              	push   edi
  4a0377:	83 ff 64                                        	cmp    edi,0x64
  4a037a:	7c 07                                           	jl     0x4a0383
  4a037c:	68 d4 d2 5c 00                                  	push   0x5cd2d4
  4a0381:	eb 05                                           	jmp    0x4a0388
  4a0383:	68 c8 d2 5c 00                                  	push   0x5cd2c8
  4a0388:	8d 44 24 38                                     	lea    eax,[esp+0x38]
  4a038c:	33 ed                                           	xor    ebp,ebp
  4a038e:	50                                              	push   eax
  4a038f:	e8 2c b2 0b 00                                  	call   0x55b5c0
  4a0394:	66 8b 6b 04                                     	mov    bp,WORD PTR [ebx+0x4]
  4a0398:	83 c4 0c                                        	add    esp,0xc
  4a039b:	33 c9                                           	xor    ecx,ecx
  4a039d:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  4a03a6:	66 8b 4b 06                                     	mov    cx,WORD PTR [ebx+0x6]
  4a03aa:	74 41                                           	je     0x4a03ed
  4a03ac:	66 a1 cf c6 89 00                               	mov    ax,ds:0x89c6cf
  4a03b2:	66 39 05 44 a9 5c 00                            	cmp    WORD PTR ds:0x5ca944,ax
  4a03b9:	74 1e                                           	je     0x4a03d9
  4a03bb:	c7 44 24 20 80 02 00 00                         	mov    DWORD PTR [esp+0x20],0x280
  4a03c3:	66 a3 44 a9 5c 00                               	mov    ds:0x5ca944,ax
  4a03c9:	0f bf c0                                        	movsx  eax,ax
  4a03cc:	c1 e0 10                                        	shl    eax,0x10
  4a03cf:	99                                              	cdq
  4a03d0:	f7 7c 24 20                                     	idiv   DWORD PTR [esp+0x20]
  4a03d4:	a3 48 a9 5c 00                                  	mov    ds:0x5ca948,eax
  4a03d9:	0f af 0d 48 a9 5c 00                            	imul   ecx,DWORD PTR ds:0x5ca948
  4a03e0:	0f af 2d 48 a9 5c 00                            	imul   ebp,DWORD PTR ds:0x5ca948
  4a03e7:	c1 f9 10                                        	sar    ecx,0x10
  4a03ea:	c1 fd 10                                        	sar    ebp,0x10
  4a03ed:	8b 44 24 14                                     	mov    eax,DWORD PTR [esp+0x14]
  4a03f1:	51                                              	push   ecx
  4a03f2:	55                                              	push   ebp
  4a03f3:	03 c6                                           	add    eax,esi
  4a03f5:	99                                              	cdq
  4a03f6:	53                                              	push   ebx
  4a03f7:	2b c2                                           	sub    eax,edx
  4a03f9:	c1 f8 01                                        	sar    eax,0x1
  4a03fc:	8b d8                                           	mov    ebx,eax
  4a03fe:	8d 41 08                                        	lea    eax,[ecx+0x8]
  4a0401:	99                                              	cdq
  4a0402:	2b c2                                           	sub    eax,edx
  4a0404:	c1 f8 01                                        	sar    eax,0x1
  4a0407:	2b d8                                           	sub    ebx,eax
  4a0409:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  4a040d:	03 44 24 1c                                     	add    eax,DWORD PTR [esp+0x1c]
  4a0411:	53                                              	push   ebx
  4a0412:	99                                              	cdq
  4a0413:	2b c2                                           	sub    eax,edx
  4a0415:	c1 f8 01                                        	sar    eax,0x1
  4a0418:	8b c8                                           	mov    ecx,eax
  4a041a:	8b c5                                           	mov    eax,ebp
  4a041c:	99                                              	cdq
  4a041d:	2b c2                                           	sub    eax,edx
  4a041f:	c1 f8 01                                        	sar    eax,0x1
  4a0422:	2b c8                                           	sub    ecx,eax
  4a0424:	51                                              	push   ecx
  4a0425:	e8 06 60 07 00                                  	call   0x516430
  4a042a:	83 c4 14                                        	add    esp,0x14
  4a042d:	85 ff                                           	test   edi,edi
  4a042f:	0f 84 c8 00 00 00                               	je     0x4a04fd
  4a0435:	8d 4c 24 10                                     	lea    ecx,[esp+0x10]
  4a0439:	8d 54 24 20                                     	lea    edx,[esp+0x20]
  4a043d:	89 74 24 1c                                     	mov    DWORD PTR [esp+0x1c],esi
  4a0441:	8b 01                                           	mov    eax,DWORD PTR [ecx]
  4a0443:	8b 59 04                                        	mov    ebx,DWORD PTR [ecx+0x4]
  4a0446:	8b 69 08                                        	mov    ebp,DWORD PTR [ecx+0x8]
  4a0449:	83 ee 0a                                        	sub    esi,0xa
  4a044c:	c6 05 9c 48 98 00 00                            	mov    BYTE PTR ds:0x98489c,0x0
  4a0453:	89 02                                           	mov    DWORD PTR [edx],eax
  4a0455:	8b 41 0c                                        	mov    eax,DWORD PTR [ecx+0xc]
  4a0458:	89 5a 04                                        	mov    DWORD PTR [edx+0x4],ebx
  4a045b:	89 6a 08                                        	mov    DWORD PTR [edx+0x8],ebp
  4a045e:	89 42 0c                                        	mov    DWORD PTR [edx+0xc],eax
  4a0461:	e8 aa 2d ff ff                                  	call   0x493210
  4a0466:	8b 5c 24 20                                     	mov    ebx,DWORD PTR [esp+0x20]
  4a046a:	8b 7c 24 28                                     	mov    edi,DWORD PTR [esp+0x28]
  4a046e:	85 c0                                           	test   eax,eax
  4a0470:	8d 44 24 30                                     	lea    eax,[esp+0x30]
  4a0474:	50                                              	push   eax
  4a0475:	74 27                                           	je     0x4a049e
  4a0477:	e8 14 20 fb ff                                  	call   0x452490
  4a047c:	83 c4 04                                        	add    esp,0x4
  4a047f:	2b f8                                           	sub    edi,eax
  4a0481:	66 46                                           	inc    si
  4a0483:	2b fb                                           	sub    edi,ebx
  4a0485:	c1 ef 01                                        	shr    edi,0x1
  4a0488:	6a 00                                           	push   0x0
  4a048a:	66 03 fb                                        	add    di,bx
  4a048d:	8d 44 24 34                                     	lea    eax,[esp+0x34]
  4a0491:	50                                              	push   eax
  4a0492:	56                                              	push   esi
  4a0493:	57                                              	push   edi
  4a0494:	e8 77 21 fb ff                                  	call   0x452610
  4a0499:	83 c4 10                                        	add    esp,0x10
  4a049c:	eb 5f                                           	jmp    0x4a04fd
  4a049e:	e8 8d a1 ff ff                                  	call   0x49a630
  4a04a3:	83 c4 04                                        	add    esp,0x4
  4a04a6:	2b f8                                           	sub    edi,eax
  4a04a8:	2b fb                                           	sub    edi,ebx
  4a04aa:	8b c7                                           	mov    eax,edi
  4a04ac:	99                                              	cdq
  4a04ad:	2b c2                                           	sub    eax,edx
  4a04af:	c1 f8 01                                        	sar    eax,0x1
  4a04b2:	8d 3c 03                                        	lea    edi,[ebx+eax*1]
  4a04b5:	e8 56 2d ff ff                                  	call   0x493210
  4a04ba:	85 c0                                           	test   eax,eax
  4a04bc:	74 17                                           	je     0x4a04d5
  4a04be:	a0 9c 48 98 00                                  	mov    al,ds:0x98489c
  4a04c3:	8d 4c 24 30                                     	lea    ecx,[esp+0x30]
  4a04c7:	50                                              	push   eax
  4a04c8:	51                                              	push   ecx
  4a04c9:	56                                              	push   esi
  4a04ca:	57                                              	push   edi
  4a04cb:	e8 d0 16 fb ff                                  	call   0x451ba0
  4a04d0:	83 c4 10                                        	add    esp,0x10
  4a04d3:	eb 28                                           	jmp    0x4a04fd
  4a04d5:	83 ec 08                                        	sub    esp,0x8
  4a04d8:	a0 9c 48 98 00                                  	mov    al,ds:0x98489c
  4a04dd:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  4a04e1:	50                                              	push   eax
  4a04e2:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  4a04e6:	e8 85 5a f7 ff                                  	call   0x415f70
  4a04eb:	0f bf cf                                        	movsx  ecx,di
  4a04ee:	8d 44 24 38                                     	lea    eax,[esp+0x38]
  4a04f2:	50                                              	push   eax
  4a04f3:	56                                              	push   esi
  4a04f4:	51                                              	push   ecx
  4a04f5:	e8 66 74 08 00                                  	call   0x527960
  4a04fa:	83 c4 14                                        	add    esp,0x14
  4a04fd:	83 25 74 a0 5d 00 f7                            	and    DWORD PTR ds:0x5da074,0xfffffff7
  4a057e:	83 0d 74 a0 5d 00 08                            	or     DWORD PTR ds:0x5da074,0x8
  4a0585:	68 d8 ab 5c 00                                  	push   0x5cabd8
  4a058a:	68 c0 ab 5c 00                                  	push   0x5cabc0
  4a058f:	68 a8 ab 5c 00                                  	push   0x5caba8
  4a0594:	57                                              	push   edi
  4a0595:	e8 36 18 00 00                                  	call   0x4a1dd0
  4a059a:	83 c4 10                                        	add    esp,0x10
  4a059d:	83 7f 08 00                                     	cmp    DWORD PTR [edi+0x8],0x0
  4a05a1:	0f 84 43 02 00 00                               	je     0x4a07ea
  4a05a7:	8b 4f 4f                                        	mov    ecx,DWORD PTR [edi+0x4f]
  4a05aa:	85 c9                                           	test   ecx,ecx
  4a05ac:	0f 84 38 02 00 00                               	je     0x4a07ea
  4a05b2:	83 7f 18 00                                     	cmp    DWORD PTR [edi+0x18],0x0
  4a05b6:	75 0b                                           	jne    0x4a05c3
  4a05b8:	83 7f 1c 00                                     	cmp    DWORD PTR [edi+0x1c],0x0
  4a05bc:	b8 00 00 00 00                                  	mov    eax,0x0
  4a05c1:	74 05                                           	je     0x4a05c8
  4a05c3:	b8 01 00 00 00                                  	mov    eax,0x1
  4a05c8:	03 c8                                           	add    ecx,eax
  4a05ca:	8b 57 63                                        	mov    edx,DWORD PTR [edi+0x63]
  4a05cd:	0f be 05 f0 c6 89 00                            	movsx  eax,BYTE PTR ds:0x89c6f0
  4a05d4:	8d 1c cd 00 00 00 00                            	lea    ebx,[ecx*8+0x0]
  4a05db:	8b c8                                           	mov    ecx,eax
  4a05dd:	03 1d 14 df 59 00                               	add    ebx,DWORD PTR ds:0x59df14
  4a05e3:	8d 2c 80                                        	lea    ebp,[eax+eax*4]
  4a05e6:	8d 04 69                                        	lea    eax,[ecx+ebp*2]
  4a05e9:	8d 3c c0                                        	lea    edi,[eax+eax*8]
  4a05ec:	8d 2c f9                                        	lea    ebp,[ecx+edi*8]
  4a05ef:	8d 04 a9                                        	lea    eax,[ecx+ebp*4]
  4a05f2:	f6 80 05 db 89 00 80                            	test   BYTE PTR [eax+0x89db05],0x80
  4a05f9:	74 0f                                           	je     0x4a060a
  4a05fb:	0f bf bc 50 01 dc 89 00                         	movsx  edi,WORD PTR [eax+edx*2+0x89dc01]
  4a0603:	b9 01 00 00 00                                  	mov    ecx,0x1
  4a0608:	eb 0a                                           	jmp    0x4a0614
  4a060a:	0f bf bc 50 ef db 89 00                         	movsx  edi,WORD PTR [eax+edx*2+0x89dbef]
  4a0612:	33 c9                                           	xor    ecx,ecx
  4a0614:	83 ff 64                                        	cmp    edi,0x64
  4a0617:	7d 1b                                           	jge    0x4a0634
  4a0619:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  4a0622:	7c 10                                           	jl     0x4a0634
  4a0624:	66 81 3d d1 c6 89 00 e0 01                      	cmp    WORD PTR ds:0x89c6d1,0x1e0
  4a062d:	bd 04 00 00 00                                  	mov    ebp,0x4
  4a0632:	7d 05                                           	jge    0x4a0639
  4a0634:	bd 06 00 00 00                                  	mov    ebp,0x6
  4a0639:	03 e9                                           	add    ebp,ecx
  4a063b:	e8 d0 2b ff ff                                  	call   0x493210
  4a0640:	85 c0                                           	test   eax,eax
  4a0642:	8b 04 ad d0 cb 87 00                            	mov    eax,DWORD PTR [ebp*4+0x87cbd0]
  4a0649:	50                                              	push   eax
  4a064a:	74 0a                                           	je     0x4a0656
  4a064c:	e8 ef 14 fb ff                                  	call   0x451b40
  4a0651:	83 c4 04                                        	add    esp,0x4
  4a0654:	eb 0d                                           	jmp    0x4a0663
  4a0656:	68 88 16 59 00                                  	push   0x591688
  4a065b:	e8 d0 66 07 00                                  	call   0x516d30
  4a0660:	83 c4 08                                        	add    esp,0x8
  4a0663:	57                                              	push   edi
  4a0664:	83 ff 64                                        	cmp    edi,0x64
  4a0667:	7c 07                                           	jl     0x4a0670
  4a0669:	68 d4 d2 5c 00                                  	push   0x5cd2d4
  4a066e:	eb 05                                           	jmp    0x4a0675
  4a0670:	68 c8 d2 5c 00                                  	push   0x5cd2c8
  4a0675:	8d 44 24 38                                     	lea    eax,[esp+0x38]
  4a0679:	33 ed                                           	xor    ebp,ebp
  4a067b:	50                                              	push   eax
  4a067c:	e8 3f af 0b 00                                  	call   0x55b5c0
  4a0681:	66 8b 6b 04                                     	mov    bp,WORD PTR [ebx+0x4]
  4a0685:	83 c4 0c                                        	add    esp,0xc
  4a0688:	33 c9                                           	xor    ecx,ecx
  4a068a:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  4a0693:	66 8b 4b 06                                     	mov    cx,WORD PTR [ebx+0x6]
  4a0697:	74 41                                           	je     0x4a06da
  4a0699:	66 a1 cf c6 89 00                               	mov    ax,ds:0x89c6cf
  4a069f:	66 39 05 44 a9 5c 00                            	cmp    WORD PTR ds:0x5ca944,ax
  4a06a6:	74 1e                                           	je     0x4a06c6
  4a06a8:	c7 44 24 20 80 02 00 00                         	mov    DWORD PTR [esp+0x20],0x280
  4a06b0:	66 a3 44 a9 5c 00                               	mov    ds:0x5ca944,ax
  4a06b6:	0f bf c0                                        	movsx  eax,ax
  4a06b9:	c1 e0 10                                        	shl    eax,0x10
  4a06bc:	99                                              	cdq
  4a06bd:	f7 7c 24 20                                     	idiv   DWORD PTR [esp+0x20]
  4a06c1:	a3 48 a9 5c 00                                  	mov    ds:0x5ca948,eax
  4a06c6:	0f af 0d 48 a9 5c 00                            	imul   ecx,DWORD PTR ds:0x5ca948
  4a06cd:	0f af 2d 48 a9 5c 00                            	imul   ebp,DWORD PTR ds:0x5ca948
  4a06d4:	c1 f9 10                                        	sar    ecx,0x10
  4a06d7:	c1 fd 10                                        	sar    ebp,0x10
  4a06da:	8b 44 24 14                                     	mov    eax,DWORD PTR [esp+0x14]
  4a06de:	51                                              	push   ecx
  4a06df:	55                                              	push   ebp
  4a06e0:	03 c6                                           	add    eax,esi
  4a06e2:	99                                              	cdq
  4a06e3:	53                                              	push   ebx
  4a06e4:	2b c2                                           	sub    eax,edx
  4a06e6:	c1 f8 01                                        	sar    eax,0x1
  4a06e9:	8b d8                                           	mov    ebx,eax
  4a06eb:	8d 41 08                                        	lea    eax,[ecx+0x8]
  4a06ee:	99                                              	cdq
  4a06ef:	2b c2                                           	sub    eax,edx
  4a06f1:	c1 f8 01                                        	sar    eax,0x1
  4a06f4:	2b d8                                           	sub    ebx,eax
  4a06f6:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  4a06fa:	03 44 24 1c                                     	add    eax,DWORD PTR [esp+0x1c]
  4a06fe:	53                                              	push   ebx
  4a06ff:	99                                              	cdq
  4a0700:	2b c2                                           	sub    eax,edx
  4a0702:	c1 f8 01                                        	sar    eax,0x1
  4a0705:	8b c8                                           	mov    ecx,eax
  4a0707:	8b c5                                           	mov    eax,ebp
  4a0709:	99                                              	cdq
  4a070a:	2b c2                                           	sub    eax,edx
  4a070c:	c1 f8 01                                        	sar    eax,0x1
  4a070f:	2b c8                                           	sub    ecx,eax
  4a0711:	51                                              	push   ecx
  4a0712:	e8 19 5d 07 00                                  	call   0x516430
  4a0717:	83 c4 14                                        	add    esp,0x14
  4a071a:	85 ff                                           	test   edi,edi
  4a071c:	0f 84 c8 00 00 00                               	je     0x4a07ea
  4a0722:	8d 4c 24 10                                     	lea    ecx,[esp+0x10]
  4a0726:	8d 54 24 20                                     	lea    edx,[esp+0x20]
  4a072a:	89 74 24 1c                                     	mov    DWORD PTR [esp+0x1c],esi
  4a072e:	8b 01                                           	mov    eax,DWORD PTR [ecx]
  4a0730:	8b 59 04                                        	mov    ebx,DWORD PTR [ecx+0x4]
  4a0733:	8b 69 08                                        	mov    ebp,DWORD PTR [ecx+0x8]
  4a0736:	83 ee 0a                                        	sub    esi,0xa
  4a0739:	c6 05 9c 48 98 00 00                            	mov    BYTE PTR ds:0x98489c,0x0
  4a0740:	89 02                                           	mov    DWORD PTR [edx],eax
  4a0742:	8b 41 0c                                        	mov    eax,DWORD PTR [ecx+0xc]
  4a0745:	89 5a 04                                        	mov    DWORD PTR [edx+0x4],ebx
  4a0748:	89 6a 08                                        	mov    DWORD PTR [edx+0x8],ebp
  4a074b:	89 42 0c                                        	mov    DWORD PTR [edx+0xc],eax
  4a074e:	e8 bd 2a ff ff                                  	call   0x493210
  4a0753:	8b 5c 24 20                                     	mov    ebx,DWORD PTR [esp+0x20]
  4a0757:	8b 7c 24 28                                     	mov    edi,DWORD PTR [esp+0x28]
  4a075b:	85 c0                                           	test   eax,eax
  4a075d:	8d 44 24 30                                     	lea    eax,[esp+0x30]
  4a0761:	50                                              	push   eax
  4a0762:	74 27                                           	je     0x4a078b
  4a0764:	e8 27 1d fb ff                                  	call   0x452490
  4a0769:	83 c4 04                                        	add    esp,0x4
  4a076c:	2b f8                                           	sub    edi,eax
  4a076e:	66 46                                           	inc    si
  4a0770:	2b fb                                           	sub    edi,ebx
  4a0772:	c1 ef 01                                        	shr    edi,0x1
  4a0775:	6a 00                                           	push   0x0
  4a0777:	66 03 fb                                        	add    di,bx
  4a077a:	8d 44 24 34                                     	lea    eax,[esp+0x34]
  4a077e:	50                                              	push   eax
  4a077f:	56                                              	push   esi
  4a0780:	57                                              	push   edi
  4a0781:	e8 8a 1e fb ff                                  	call   0x452610
  4a0786:	83 c4 10                                        	add    esp,0x10
  4a0789:	eb 5f                                           	jmp    0x4a07ea
  4a078b:	e8 a0 9e ff ff                                  	call   0x49a630
  4a0790:	83 c4 04                                        	add    esp,0x4
  4a0793:	2b f8                                           	sub    edi,eax
  4a0795:	2b fb                                           	sub    edi,ebx
  4a0797:	8b c7                                           	mov    eax,edi
  4a0799:	99                                              	cdq
  4a079a:	2b c2                                           	sub    eax,edx
  4a079c:	c1 f8 01                                        	sar    eax,0x1
  4a079f:	8d 3c 03                                        	lea    edi,[ebx+eax*1]
  4a07a2:	e8 69 2a ff ff                                  	call   0x493210
  4a07a7:	85 c0                                           	test   eax,eax
  4a07a9:	74 17                                           	je     0x4a07c2
  4a07ab:	a0 9c 48 98 00                                  	mov    al,ds:0x98489c
  4a07b0:	8d 4c 24 30                                     	lea    ecx,[esp+0x30]
  4a07b4:	50                                              	push   eax
  4a07b5:	51                                              	push   ecx
  4a07b6:	56                                              	push   esi
  4a07b7:	57                                              	push   edi
  4a07b8:	e8 e3 13 fb ff                                  	call   0x451ba0
  4a07bd:	83 c4 10                                        	add    esp,0x10
  4a07c0:	eb 28                                           	jmp    0x4a07ea
  4a07c2:	83 ec 08                                        	sub    esp,0x8
  4a07c5:	a0 9c 48 98 00                                  	mov    al,ds:0x98489c
  4a07ca:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  4a07ce:	50                                              	push   eax
  4a07cf:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  4a07d3:	e8 98 57 f7 ff                                  	call   0x415f70
  4a07d8:	0f bf cf                                        	movsx  ecx,di
  4a07db:	8d 44 24 38                                     	lea    eax,[esp+0x38]
  4a07df:	50                                              	push   eax
  4a07e0:	56                                              	push   esi
  4a07e1:	51                                              	push   ecx
  4a07e2:	e8 79 71 08 00                                  	call   0x527960
  4a07e7:	83 c4 14                                        	add    esp,0x14
  4a07ea:	83 25 74 a0 5d 00 f7                            	and    DWORD PTR ds:0x5da074,0xfffffff7
  4a0c58:	83 0d 74 a0 5d 00 08                            	or     DWORD PTR ds:0x5da074,0x8
  4a0c5f:	68 d8 ab 5c 00                                  	push   0x5cabd8
  4a0c64:	68 c0 ab 5c 00                                  	push   0x5cabc0
  4a0c69:	68 a8 ab 5c 00                                  	push   0x5caba8
  4a0c6e:	57                                              	push   edi
  4a0c6f:	e8 5c 11 00 00                                  	call   0x4a1dd0
  4a0c74:	8b bc 24 8c 00 00 00                            	mov    edi,DWORD PTR [esp+0x8c]
  4a0c7b:	83 c4 10                                        	add    esp,0x10
  4a0c7e:	83 ff 64                                        	cmp    edi,0x64
  4a0c81:	57                                              	push   edi
  4a0c82:	7c 07                                           	jl     0x4a0c8b
  4a0c84:	68 d4 d2 5c 00                                  	push   0x5cd2d4
  4a0c89:	eb 05                                           	jmp    0x4a0c90
  4a0c8b:	68 c8 d2 5c 00                                  	push   0x5cd2c8
  4a0c90:	8d 44 24 38                                     	lea    eax,[esp+0x38]
  4a0c94:	50                                              	push   eax
  4a0c95:	e8 26 a9 0b 00                                  	call   0x55b5c0
  4a0c9a:	83 c4 0c                                        	add    esp,0xc
  4a0c9d:	83 ff 64                                        	cmp    edi,0x64
  4a0ca0:	7d 1b                                           	jge    0x4a0cbd
  4a0ca2:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  4a0cab:	7c 10                                           	jl     0x4a0cbd
  4a0cad:	66 81 3d d1 c6 89 00 e0 01                      	cmp    WORD PTR ds:0x89c6d1,0x1e0
  4a0cb6:	bb 04 00 00 00                                  	mov    ebx,0x4
  4a0cbb:	7d 05                                           	jge    0x4a0cc2
  4a0cbd:	bb 06 00 00 00                                  	mov    ebx,0x6
  4a0cc2:	0f be 84 24 80 00 00 00                         	movsx  eax,BYTE PTR [esp+0x80]
  4a0cca:	03 d8                                           	add    ebx,eax
  4a0ccc:	e8 3f 25 ff ff                                  	call   0x493210
  4a0cd1:	85 c0                                           	test   eax,eax
  4a0cd3:	8b 04 9d d0 cb 87 00                            	mov    eax,DWORD PTR [ebx*4+0x87cbd0]
  4a0cda:	50                                              	push   eax
  4a0cdb:	74 0a                                           	je     0x4a0ce7
  4a0cdd:	e8 5e 0e fb ff                                  	call   0x451b40
  4a0ce2:	83 c4 04                                        	add    esp,0x4
  4a0ce5:	eb 0d                                           	jmp    0x4a0cf4
  4a0ce7:	68 88 16 59 00                                  	push   0x591688
  4a0cec:	e8 3f 60 07 00                                  	call   0x516d30
  4a0cf1:	83 c4 08                                        	add    esp,0x8
  4a0cf4:	33 ed                                           	xor    ebp,ebp
  4a0cf6:	8b 4c 24 78                                     	mov    ecx,DWORD PTR [esp+0x78]
  4a0cfa:	66 8b 69 06                                     	mov    bp,WORD PTR [ecx+0x6]
  4a0cfe:	33 db                                           	xor    ebx,ebx
  4a0d00:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  4a0d09:	66 8b 59 04                                     	mov    bx,WORD PTR [ecx+0x4]
  4a0d0d:	74 41                                           	je     0x4a0d50
  4a0d0f:	66 a1 cf c6 89 00                               	mov    ax,ds:0x89c6cf
  4a0d15:	66 39 05 44 a9 5c 00                            	cmp    WORD PTR ds:0x5ca944,ax
  4a0d1c:	74 1e                                           	je     0x4a0d3c
  4a0d1e:	c7 44 24 20 80 02 00 00                         	mov    DWORD PTR [esp+0x20],0x280
  4a0d26:	66 a3 44 a9 5c 00                               	mov    ds:0x5ca944,ax
  4a0d2c:	0f bf c0                                        	movsx  eax,ax
  4a0d2f:	c1 e0 10                                        	shl    eax,0x10
  4a0d32:	99                                              	cdq
  4a0d33:	f7 7c 24 20                                     	idiv   DWORD PTR [esp+0x20]
  4a0d37:	a3 48 a9 5c 00                                  	mov    ds:0x5ca948,eax
  4a0d3c:	0f af 2d 48 a9 5c 00                            	imul   ebp,DWORD PTR ds:0x5ca948
  4a0d43:	0f af 1d 48 a9 5c 00                            	imul   ebx,DWORD PTR ds:0x5ca948
  4a0d4a:	c1 fd 10                                        	sar    ebp,0x10
  4a0d4d:	c1 fb 10                                        	sar    ebx,0x10
  4a0d50:	8b 44 24 14                                     	mov    eax,DWORD PTR [esp+0x14]
  4a0d54:	55                                              	push   ebp
  4a0d55:	53                                              	push   ebx
  4a0d56:	03 c6                                           	add    eax,esi
  4a0d58:	99                                              	cdq
  4a0d59:	51                                              	push   ecx
  4a0d5a:	2b c2                                           	sub    eax,edx
  4a0d5c:	c1 f8 01                                        	sar    eax,0x1
  4a0d5f:	8b c8                                           	mov    ecx,eax
  4a0d61:	8d 45 08                                        	lea    eax,[ebp+0x8]
  4a0d64:	99                                              	cdq
  4a0d65:	2b c2                                           	sub    eax,edx
  4a0d67:	c1 f8 01                                        	sar    eax,0x1
  4a0d6a:	2b c8                                           	sub    ecx,eax
  4a0d6c:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  4a0d70:	03 44 24 1c                                     	add    eax,DWORD PTR [esp+0x1c]
  4a0d74:	51                                              	push   ecx
  4a0d75:	99                                              	cdq
  4a0d76:	2b c2                                           	sub    eax,edx
  4a0d78:	c1 f8 01                                        	sar    eax,0x1
  4a0d7b:	8b c8                                           	mov    ecx,eax
  4a0d7d:	8b c3                                           	mov    eax,ebx
  4a0d7f:	99                                              	cdq
  4a0d80:	2b c2                                           	sub    eax,edx
  4a0d82:	c1 f8 01                                        	sar    eax,0x1
  4a0d85:	2b c8                                           	sub    ecx,eax
  4a0d87:	51                                              	push   ecx
  4a0d88:	e8 a3 56 07 00                                  	call   0x516430
  4a0d8d:	83 c4 14                                        	add    esp,0x14
  4a0d90:	85 ff                                           	test   edi,edi
  4a0d92:	0f 84 c8 00 00 00                               	je     0x4a0e60
  4a0d98:	8d 4c 24 10                                     	lea    ecx,[esp+0x10]
  4a0d9c:	8d 54 24 20                                     	lea    edx,[esp+0x20]
  4a0da0:	89 74 24 1c                                     	mov    DWORD PTR [esp+0x1c],esi
  4a0da4:	8b 01                                           	mov    eax,DWORD PTR [ecx]
  4a0da6:	8b 59 04                                        	mov    ebx,DWORD PTR [ecx+0x4]
  4a0da9:	8b 69 08                                        	mov    ebp,DWORD PTR [ecx+0x8]
  4a0dac:	83 ee 0a                                        	sub    esi,0xa
  4a0daf:	c6 05 9c 48 98 00 00                            	mov    BYTE PTR ds:0x98489c,0x0
  4a0db6:	89 02                                           	mov    DWORD PTR [edx],eax
  4a0db8:	8b 41 0c                                        	mov    eax,DWORD PTR [ecx+0xc]
  4a0dbb:	89 5a 04                                        	mov    DWORD PTR [edx+0x4],ebx
  4a0dbe:	89 6a 08                                        	mov    DWORD PTR [edx+0x8],ebp
  4a0dc1:	89 42 0c                                        	mov    DWORD PTR [edx+0xc],eax
  4a0dc4:	e8 47 24 ff ff                                  	call   0x493210
  4a0dc9:	8b 5c 24 20                                     	mov    ebx,DWORD PTR [esp+0x20]
  4a0dcd:	8b 7c 24 28                                     	mov    edi,DWORD PTR [esp+0x28]
  4a0dd1:	85 c0                                           	test   eax,eax
  4a0dd3:	8d 44 24 30                                     	lea    eax,[esp+0x30]
  4a0dd7:	50                                              	push   eax
  4a0dd8:	74 27                                           	je     0x4a0e01
  4a0dda:	e8 b1 16 fb ff                                  	call   0x452490
  4a0ddf:	83 c4 04                                        	add    esp,0x4
  4a0de2:	2b f8                                           	sub    edi,eax
  4a0de4:	66 46                                           	inc    si
  4a0de6:	2b fb                                           	sub    edi,ebx
  4a0de8:	c1 ef 01                                        	shr    edi,0x1
  4a0deb:	6a 00                                           	push   0x0
  4a0ded:	66 03 fb                                        	add    di,bx
  4a0df0:	8d 44 24 34                                     	lea    eax,[esp+0x34]
  4a0df4:	50                                              	push   eax
  4a0df5:	56                                              	push   esi
  4a0df6:	57                                              	push   edi
  4a0df7:	e8 14 18 fb ff                                  	call   0x452610
  4a0dfc:	83 c4 10                                        	add    esp,0x10
  4a0dff:	eb 5f                                           	jmp    0x4a0e60
  4a0e01:	e8 2a 98 ff ff                                  	call   0x49a630
  4a0e06:	83 c4 04                                        	add    esp,0x4
  4a0e09:	2b f8                                           	sub    edi,eax
  4a0e0b:	2b fb                                           	sub    edi,ebx
  4a0e0d:	8b c7                                           	mov    eax,edi
  4a0e0f:	99                                              	cdq
  4a0e10:	2b c2                                           	sub    eax,edx
  4a0e12:	c1 f8 01                                        	sar    eax,0x1
  4a0e15:	8d 3c 03                                        	lea    edi,[ebx+eax*1]
  4a0e18:	e8 f3 23 ff ff                                  	call   0x493210
  4a0e1d:	85 c0                                           	test   eax,eax
  4a0e1f:	74 17                                           	je     0x4a0e38
  4a0e21:	a0 9c 48 98 00                                  	mov    al,ds:0x98489c
  4a0e26:	8d 4c 24 30                                     	lea    ecx,[esp+0x30]
  4a0e2a:	50                                              	push   eax
  4a0e2b:	51                                              	push   ecx
  4a0e2c:	56                                              	push   esi
  4a0e2d:	57                                              	push   edi
  4a0e2e:	e8 6d 0d fb ff                                  	call   0x451ba0
  4a0e33:	83 c4 10                                        	add    esp,0x10
  4a0e36:	eb 28                                           	jmp    0x4a0e60
  4a0e38:	83 ec 08                                        	sub    esp,0x8
  4a0e3b:	a0 9c 48 98 00                                  	mov    al,ds:0x98489c
  4a0e40:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  4a0e44:	50                                              	push   eax
  4a0e45:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  4a0e49:	e8 22 51 f7 ff                                  	call   0x415f70
  4a0e4e:	0f bf cf                                        	movsx  ecx,di
  4a0e51:	8d 44 24 38                                     	lea    eax,[esp+0x38]
  4a0e55:	50                                              	push   eax
  4a0e56:	56                                              	push   esi
  4a0e57:	51                                              	push   ecx
  4a0e58:	e8 03 6b 08 00                                  	call   0x527960
  4a0e5d:	83 c4 14                                        	add    esp,0x14
  4a0e60:	83 25 74 a0 5d 00 f7                            	and    DWORD PTR ds:0x5da074,0xfffffff7
  4a1936:	83 0d 74 a0 5d 00 08                            	or     DWORD PTR ds:0x5da074,0x8
  4a193d:	68 90 ab 5c 00                                  	push   0x5cab90
  4a1942:	68 78 ab 5c 00                                  	push   0x5cab78
  4a1947:	68 60 ab 5c 00                                  	push   0x5cab60
  4a194c:	56                                              	push   esi
  4a194d:	e8 3e 05 00 00                                  	call   0x4a1e90
  4a1952:	83 c4 10                                        	add    esp,0x10
  4a1955:	8b 4e 4f                                        	mov    ecx,DWORD PTR [esi+0x4f]
  4a1958:	85 c9                                           	test   ecx,ecx
  4a195a:	0f 84 b6 00 00 00                               	je     0x4a1a16
  4a1960:	83 7e 18 00                                     	cmp    DWORD PTR [esi+0x18],0x0
  4a1964:	75 0b                                           	jne    0x4a1971
  4a1966:	83 7e 1c 00                                     	cmp    DWORD PTR [esi+0x1c],0x0
  4a196a:	b8 00 00 00 00                                  	mov    eax,0x0
  4a196f:	74 05                                           	je     0x4a1976
  4a1971:	b8 01 00 00 00                                  	mov    eax,0x1
  4a1976:	03 c8                                           	add    ecx,eax
  4a1978:	33 ed                                           	xor    ebp,ebp
  4a197a:	c1 e1 03                                        	shl    ecx,0x3
  4a197d:	33 f6                                           	xor    esi,esi
  4a197f:	03 0d 14 df 59 00                               	add    ecx,DWORD PTR ds:0x59df14
  4a1985:	66 8b 69 06                                     	mov    bp,WORD PTR [ecx+0x6]
  4a1989:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  4a1992:	66 8b 71 04                                     	mov    si,WORD PTR [ecx+0x4]
  4a1996:	74 41                                           	je     0x4a19d9
  4a1998:	66 a1 cf c6 89 00                               	mov    ax,ds:0x89c6cf
  4a199e:	66 39 05 44 a9 5c 00                            	cmp    WORD PTR ds:0x5ca944,ax
  4a19a5:	74 1e                                           	je     0x4a19c5
  4a19a7:	c7 44 24 10 80 02 00 00                         	mov    DWORD PTR [esp+0x10],0x280
  4a19af:	66 a3 44 a9 5c 00                               	mov    ds:0x5ca944,ax
  4a19b5:	0f bf c0                                        	movsx  eax,ax
  4a19b8:	c1 e0 10                                        	shl    eax,0x10
  4a19bb:	99                                              	cdq
  4a19bc:	f7 7c 24 10                                     	idiv   DWORD PTR [esp+0x10]
  4a19c0:	a3 48 a9 5c 00                                  	mov    ds:0x5ca948,eax
  4a19c5:	0f af 2d 48 a9 5c 00                            	imul   ebp,DWORD PTR ds:0x5ca948
  4a19cc:	0f af 35 48 a9 5c 00                            	imul   esi,DWORD PTR ds:0x5ca948
  4a19d3:	c1 fd 10                                        	sar    ebp,0x10
  4a19d6:	c1 fe 10                                        	sar    esi,0x10
  4a19d9:	8b 44 24 20                                     	mov    eax,DWORD PTR [esp+0x20]
  4a19dd:	55                                              	push   ebp
  4a19de:	56                                              	push   esi
  4a19df:	03 c3                                           	add    eax,ebx
  4a19e1:	99                                              	cdq
  4a19e2:	51                                              	push   ecx
  4a19e3:	2b c2                                           	sub    eax,edx
  4a19e5:	c1 f8 01                                        	sar    eax,0x1
  4a19e8:	8b c8                                           	mov    ecx,eax
  4a19ea:	8b c5                                           	mov    eax,ebp
  4a19ec:	99                                              	cdq
  4a19ed:	2b c2                                           	sub    eax,edx
  4a19ef:	c1 f8 01                                        	sar    eax,0x1
  4a19f2:	2b c8                                           	sub    ecx,eax
  4a19f4:	8b 44 24 28                                     	mov    eax,DWORD PTR [esp+0x28]
  4a19f8:	51                                              	push   ecx
  4a19f9:	03 c7                                           	add    eax,edi
  4a19fb:	99                                              	cdq
  4a19fc:	2b c2                                           	sub    eax,edx
  4a19fe:	c1 f8 01                                        	sar    eax,0x1
  4a1a01:	8b c8                                           	mov    ecx,eax
  4a1a03:	8b c6                                           	mov    eax,esi
  4a1a05:	99                                              	cdq
  4a1a06:	2b c2                                           	sub    eax,edx
  4a1a08:	c1 f8 01                                        	sar    eax,0x1
  4a1a0b:	2b c8                                           	sub    ecx,eax
  4a1a0d:	51                                              	push   ecx
  4a1a0e:	e8 1d 4a 07 00                                  	call   0x516430
  4a1a13:	83 c4 14                                        	add    esp,0x14
  4a1a16:	83 25 74 a0 5d 00 f7                            	and    DWORD PTR ds:0x5da074,0xfffffff7
  4a1a98:	83 0d 74 a0 5d 00 08                            	or     DWORD PTR ds:0x5da074,0x8
  4a1a9f:	68 20 ac 5c 00                                  	push   0x5cac20
  4a1aa4:	68 08 ac 5c 00                                  	push   0x5cac08
  4a1aa9:	68 f0 ab 5c 00                                  	push   0x5cabf0
  4a1aae:	56                                              	push   esi
  4a1aaf:	e8 dc 03 00 00                                  	call   0x4a1e90
  4a1ab4:	83 c4 10                                        	add    esp,0x10
  4a1ab7:	8b 46 4f                                        	mov    eax,DWORD PTR [esi+0x4f]
  4a1aba:	85 c0                                           	test   eax,eax
  4a1abc:	0f 84 0f 01 00 00                               	je     0x4a1bd1
  4a1ac2:	83 7e 18 00                                     	cmp    DWORD PTR [esi+0x18],0x0
  4a1ac6:	75 0b                                           	jne    0x4a1ad3
  4a1ac8:	83 7e 1c 00                                     	cmp    DWORD PTR [esi+0x1c],0x0
  4a1acc:	b9 00 00 00 00                                  	mov    ecx,0x0
  4a1ad1:	74 05                                           	je     0x4a1ad8
  4a1ad3:	b9 01 00 00 00                                  	mov    ecx,0x1
  4a1ad8:	80 7e 2a 01                                     	cmp    BYTE PTR [esi+0x2a],0x1
  4a1adc:	1b db                                           	sbb    ebx,ebx
  4a1ade:	33 ed                                           	xor    ebp,ebp
  4a1ae0:	8d 5c 58 02                                     	lea    ebx,[eax+ebx*2+0x2]
  4a1ae4:	03 d9                                           	add    ebx,ecx
  4a1ae6:	33 c9                                           	xor    ecx,ecx
  4a1ae8:	c1 e3 03                                        	shl    ebx,0x3
  4a1aeb:	03 1d 14 df 59 00                               	add    ebx,DWORD PTR ds:0x59df14
  4a1af1:	66 8b 4b 06                                     	mov    cx,WORD PTR [ebx+0x6]
  4a1af5:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  4a1afe:	66 8b 6b 04                                     	mov    bp,WORD PTR [ebx+0x4]
  4a1b02:	74 3c                                           	je     0x4a1b40
  4a1b04:	66 a1 cf c6 89 00                               	mov    ax,ds:0x89c6cf
  4a1b0a:	66 39 05 44 a9 5c 00                            	cmp    WORD PTR ds:0x5ca944,ax
  4a1b11:	74 19                                           	je     0x4a1b2c
  4a1b13:	66 a3 44 a9 5c 00                               	mov    ds:0x5ca944,ax
  4a1b19:	be 80 02 00 00                                  	mov    esi,0x280
  4a1b1e:	0f bf c0                                        	movsx  eax,ax
  4a1b21:	c1 e0 10                                        	shl    eax,0x10
  4a1b24:	99                                              	cdq
  4a1b25:	f7 fe                                           	idiv   esi
  4a1b27:	a3 48 a9 5c 00                                  	mov    ds:0x5ca948,eax
  4a1b2c:	0f af 0d 48 a9 5c 00                            	imul   ecx,DWORD PTR ds:0x5ca948
  4a1b33:	0f af 2d 48 a9 5c 00                            	imul   ebp,DWORD PTR ds:0x5ca948
  4a1b3a:	c1 f9 10                                        	sar    ecx,0x10
  4a1b3d:	c1 fd 10                                        	sar    ebp,0x10
  4a1b40:	66 8b 73 04                                     	mov    si,WORD PTR [ebx+0x4]
  4a1b44:	0f b7 c6                                        	movzx  eax,si
  4a1b47:	3b c5                                           	cmp    eax,ebp
  4a1b49:	74 4b                                           	je     0x4a1b96
  4a1b4b:	33 c0                                           	xor    eax,eax
  4a1b4d:	66 8b 43 06                                     	mov    ax,WORD PTR [ebx+0x6]
  4a1b51:	3b c1                                           	cmp    eax,ecx
  4a1b53:	74 41                                           	je     0x4a1b96
  4a1b55:	8b 44 24 14                                     	mov    eax,DWORD PTR [esp+0x14]
  4a1b59:	51                                              	push   ecx
  4a1b5a:	55                                              	push   ebp
  4a1b5b:	03 c7                                           	add    eax,edi
  4a1b5d:	99                                              	cdq
  4a1b5e:	53                                              	push   ebx
  4a1b5f:	2b c2                                           	sub    eax,edx
  4a1b61:	c1 f8 01                                        	sar    eax,0x1
  4a1b64:	8b f0                                           	mov    esi,eax
  4a1b66:	8b c1                                           	mov    eax,ecx
  4a1b68:	99                                              	cdq
  4a1b69:	2b c2                                           	sub    eax,edx
  4a1b6b:	c1 f8 01                                        	sar    eax,0x1
  4a1b6e:	2b f0                                           	sub    esi,eax
  4a1b70:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  4a1b74:	03 44 24 24                                     	add    eax,DWORD PTR [esp+0x24]
  4a1b78:	56                                              	push   esi
  4a1b79:	99                                              	cdq
  4a1b7a:	2b c2                                           	sub    eax,edx
  4a1b7c:	c1 f8 01                                        	sar    eax,0x1
  4a1b7f:	8b c8                                           	mov    ecx,eax
  4a1b81:	8b c5                                           	mov    eax,ebp
  4a1b83:	99                                              	cdq
  4a1b84:	2b c2                                           	sub    eax,edx
  4a1b86:	c1 f8 01                                        	sar    eax,0x1
  4a1b89:	2b c8                                           	sub    ecx,eax
  4a1b8b:	51                                              	push   ecx
  4a1b8c:	e8 9f 48 07 00                                  	call   0x516430
  4a1b91:	83 c4 14                                        	add    esp,0x14
  4a1b94:	eb 3b                                           	jmp    0x4a1bd1
  4a1b96:	66 8b 4b 06                                     	mov    cx,WORD PTR [ebx+0x6]
  4a1b9a:	53                                              	push   ebx
  4a1b9b:	66 c1 e9 01                                     	shr    cx,0x1
  4a1b9f:	8b 44 24 18                                     	mov    eax,DWORD PTR [esp+0x18]
  4a1ba3:	03 c7                                           	add    eax,edi
  4a1ba5:	99                                              	cdq
  4a1ba6:	2b c2                                           	sub    eax,edx
  4a1ba8:	0f b7 d1                                        	movzx  edx,cx
  4a1bab:	c1 f8 01                                        	sar    eax,0x1
  4a1bae:	2b c2                                           	sub    eax,edx
  4a1bb0:	66 c1 ee 01                                     	shr    si,0x1
  4a1bb4:	50                                              	push   eax
  4a1bb5:	0f b7 ce                                        	movzx  ecx,si
  4a1bb8:	8b 44 24 18                                     	mov    eax,DWORD PTR [esp+0x18]
  4a1bbc:	03 44 24 20                                     	add    eax,DWORD PTR [esp+0x20]
  4a1bc0:	99                                              	cdq
  4a1bc1:	2b c2                                           	sub    eax,edx
  4a1bc3:	c1 f8 01                                        	sar    eax,0x1
  4a1bc6:	2b c1                                           	sub    eax,ecx
  4a1bc8:	50                                              	push   eax
  4a1bc9:	e8 12 47 07 00                                  	call   0x5162e0
  4a1bce:	83 c4 0c                                        	add    esp,0xc
  4a1bd1:	83 25 74 a0 5d 00 f7                            	and    DWORD PTR ds:0x5da074,0xfffffff7
  4a1e44:	83 0d 74 a0 5d 00 08                            	or     DWORD PTR ds:0x5da074,0x8
  4a1e4b:	83 7e 18 00                                     	cmp    DWORD PTR [esi+0x18],0x0
  4a1e4f:	75 18                                           	jne    0x4a1e69
  4a1e51:	83 7e 1c 00                                     	cmp    DWORD PTR [esi+0x1c],0x0
  4a1e55:	75 12                                           	jne    0x4a1e69
  4a1e57:	83 7e 0c 00                                     	cmp    DWORD PTR [esi+0xc],0x0
  4a1e5b:	74 06                                           	je     0x4a1e63
  4a1e5d:	8b 44 24 28                                     	mov    eax,DWORD PTR [esp+0x28]
  4a1e61:	eb 0a                                           	jmp    0x4a1e6d
  4a1e63:	8b 44 24 20                                     	mov    eax,DWORD PTR [esp+0x20]
  4a1e67:	eb 04                                           	jmp    0x4a1e6d
  4a1e69:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  4a1e6d:	8d 4c 24 08                                     	lea    ecx,[esp+0x8]
  4a1e71:	50                                              	push   eax
  4a1e72:	51                                              	push   ecx
  4a1e73:	e8 d8 00 00 00                                  	call   0x4a1f50
  4a1e78:	83 c4 08                                        	add    esp,0x8
  4a1e7b:	83 25 74 a0 5d 00 f7                            	and    DWORD PTR ds:0x5da074,0xfffffff7
  4a1f04:	83 0d 74 a0 5d 00 08                            	or     DWORD PTR ds:0x5da074,0x8
  4a1f0b:	80 7e 2a 00                                     	cmp    BYTE PTR [esi+0x2a],0x0
  4a1f0f:	74 06                                           	je     0x4a1f17
  4a1f11:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  4a1f15:	eb 1c                                           	jmp    0x4a1f33
  4a1f17:	83 7e 18 00                                     	cmp    DWORD PTR [esi+0x18],0x0
  4a1f1b:	75 12                                           	jne    0x4a1f2f
  4a1f1d:	83 7e 1c 00                                     	cmp    DWORD PTR [esi+0x1c],0x0
  4a1f21:	75 0c                                           	jne    0x4a1f2f
  4a1f23:	83 7e 0c 00                                     	cmp    DWORD PTR [esi+0xc],0x0
  4a1f27:	75 06                                           	jne    0x4a1f2f
  4a1f29:	8b 44 24 20                                     	mov    eax,DWORD PTR [esp+0x20]
  4a1f2d:	eb 04                                           	jmp    0x4a1f33
  4a1f2f:	8b 44 24 28                                     	mov    eax,DWORD PTR [esp+0x28]
  4a1f33:	8d 4c 24 08                                     	lea    ecx,[esp+0x8]
  4a1f37:	50                                              	push   eax
  4a1f38:	51                                              	push   ecx
  4a1f39:	e8 12 00 00 00                                  	call   0x4a1f50
  4a1f3e:	83 c4 08                                        	add    esp,0x8
  4a1f41:	83 25 74 a0 5d 00 f7                            	and    DWORD PTR ds:0x5da074,0xfffffff7
  525c1e:	83 0d 74 a0 5d 00 08                            	or     DWORD PTR ds:0x5da074,0x8
  525c25:	03 d2                                           	add    edx,edx
  525c27:	2b f2                                           	sub    esi,edx
  525c29:	79 02                                           	jns    0x525c2d
  525c2b:	f7 de                                           	neg    esi
  525c2d:	bf 0f 00 00 00                                  	mov    edi,0xf
  525c32:	ff 4c 24 0c                                     	dec    DWORD PTR [esp+0xc]
  525c36:	2b fe                                           	sub    edi,esi
  525c38:	ff 4c 24 08                                     	dec    DWORD PTR [esp+0x8]
  525c3c:	be 04 00 00 00                                  	mov    esi,0x4
  525c41:	83 ec 08                                        	sub    esp,0x8
  525c44:	89 64 24 20                                     	mov    DWORD PTR [esp+0x20],esp
  525c48:	57                                              	push   edi
  525c49:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  525c4d:	83 ef 03                                        	sub    edi,0x3
  525c50:	e8 7b c9 f2 ff                                  	call   0x4525d0
  525c55:	8d 44 24 10                                     	lea    eax,[esp+0x10]
  525c59:	50                                              	push   eax
  525c5a:	e8 81 0c ff ff                                  	call   0x5168e0
  525c5f:	ff 4c 24 18                                     	dec    DWORD PTR [esp+0x18]
  525c63:	ff 4c 24 14                                     	dec    DWORD PTR [esp+0x14]
  525c67:	ff 44 24 20                                     	inc    DWORD PTR [esp+0x20]
  525c6b:	ff 44 24 1c                                     	inc    DWORD PTR [esp+0x1c]
  525c6f:	83 c4 0c                                        	add    esp,0xc
  525c72:	4e                                              	dec    esi
  525c73:	75 cc                                           	jne    0x525c41
  525c75:	68 60 45 97 00                                  	push   0x974560
  525c7a:	e8 f1 05 ff ff                                  	call   0x516270
  525c7f:	83 c4 04                                        	add    esp,0x4
  525c82:	83 25 74 a0 5d 00 f7                            	and    DWORD PTR ds:0x5da074,0xfffffff7
