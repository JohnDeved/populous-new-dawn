
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004ba7a0 <.text+0xb97a0>:
  4ba7a0:	0f be 44 24 08       	movsx  eax,BYTE PTR [esp+0x8]
  4ba7a5:	81 ec 2c 03 00 00    	sub    esp,0x32c
  4ba7ab:	8d 14 c0             	lea    edx,[eax+eax*8]
  4ba7ae:	33 c9                	xor    ecx,ecx
  4ba7b0:	53                   	push   ebx
  4ba7b1:	56                   	push   esi
  4ba7b2:	8d 04 50             	lea    eax,[eax+edx*2]
  4ba7b5:	66 8b 0c 85 28 72 5a 	mov    cx,WORD PTR [eax*4+0x5a7228]
  4ba7bc:	00 
  4ba7bd:	57                   	push   edi
  4ba7be:	55                   	push   ebp
  4ba7bf:	8d 0c 49             	lea    ecx,[ecx+ecx*2]
  4ba7c2:	03 c9                	add    ecx,ecx
  4ba7c4:	8b 15 c1 5e 89 00    	mov    edx,DWORD PTR ds:0x895ec1
  4ba7ca:	0f be 84 24 48 03 00 	movsx  eax,BYTE PTR [esp+0x348]
  4ba7d1:	00 
  4ba7d2:	8d 0c c9             	lea    ecx,[ecx+ecx*8]
  4ba7d5:	03 c8                	add    ecx,eax
  4ba7d7:	8b 84 24 40 03 00 00 	mov    eax,DWORD PTR [esp+0x340]
  4ba7de:	0f be 4c 11 2c       	movsx  ecx,BYTE PTR [ecx+edx*1+0x2c]
  4ba7e3:	8b d1                	mov    edx,ecx
  4ba7e5:	c1 e2 04             	shl    edx,0x4
  4ba7e8:	66 89 44 24 10       	mov    WORD PTR [esp+0x10],ax
  4ba7ed:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  4ba7f1:	8d 14 52             	lea    edx,[edx+edx*2]
  4ba7f4:	8d 44 24 18          	lea    eax,[esp+0x18]
  4ba7f8:	03 15 3c df 59 00    	add    edx,DWORD PTR ds:0x59df3c
  4ba7fe:	50                   	push   eax
  4ba7ff:	8a 5a 02             	mov    bl,BYTE PTR [edx+0x2]
  4ba802:	8a 52 03             	mov    dl,BYTE PTR [edx+0x3]
  4ba805:	28 5c 24 14          	sub    BYTE PTR [esp+0x14],bl
  4ba809:	28 54 24 15          	sub    BYTE PTR [esp+0x15],dl
  4ba80d:	8d 54 24 20          	lea    edx,[esp+0x20]
  4ba811:	8b 5c 24 14          	mov    ebx,DWORD PTR [esp+0x14]
  4ba815:	52                   	push   edx
  4ba816:	80 bc 24 58 03 00 00 	cmp    BYTE PTR [esp+0x358],0x0
  4ba81d:	00 
  4ba81e:	53                   	push   ebx
  4ba81f:	51                   	push   ecx
  4ba820:	74 07                	je     0x4ba829
  4ba822:	e8 c9 f6 ff ff       	call   0x4b9ef0
  4ba827:	eb 05                	jmp    0x4ba82e
  4ba829:	e8 22 f5 ff ff       	call   0x4b9d50
  4ba82e:	c7 44 24 20 00 00 00 	mov    DWORD PTR [esp+0x20],0x0
  4ba835:	00 
  4ba836:	83 c4 10             	add    esp,0x10
  4ba839:	83 7c 24 18 00       	cmp    DWORD PTR [esp+0x18],0x0
  4ba83e:	0f 8e ef 00 00 00    	jle    0x4ba933
  4ba844:	8d 6c 24 1c          	lea    ebp,[esp+0x1c]
  4ba848:	8b 45 00             	mov    eax,DWORD PTR [ebp+0x0]
  4ba84b:	f6 40 01 04          	test   BYTE PTR [eax+0x1],0x4
  4ba84f:	0f 84 c9 00 00 00    	je     0x4ba91e
  4ba855:	66 8b 40 08          	mov    ax,WORD PTR [eax+0x8]
  4ba859:	33 ff                	xor    edi,edi
  4ba85b:	66 25 ff 03          	and    ax,0x3ff
  4ba85f:	74 18                	je     0x4ba879
  4ba861:	0f b7 c0             	movzx  eax,ax
  4ba864:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  4ba86b:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  4ba86f:	75 08                	jne    0x4ba879
  4ba871:	80 78 2a 00          	cmp    BYTE PTR [eax+0x2a],0x0
  4ba875:	74 02                	je     0x4ba879
  4ba877:	8b f8                	mov    edi,eax
  4ba879:	85 ff                	test   edi,edi
  4ba87b:	0f 84 9d 00 00 00    	je     0x4ba91e
  4ba881:	8a 84 24 4c 03 00 00 	mov    al,BYTE PTR [esp+0x34c]
  4ba888:	38 47 2f             	cmp    BYTE PTR [edi+0x2f],al
  4ba88b:	74 0e                	je     0x4ba89b
  4ba88d:	80 bc 24 50 03 00 00 	cmp    BYTE PTR [esp+0x350],0x0
  4ba894:	00 
  4ba895:	0f 84 83 00 00 00    	je     0x4ba91e
  4ba89b:	66 83 bf 92 00 00 00 	cmp    WORD PTR [edi+0x92],0x0
  4ba8a2:	00 
  4ba8a3:	75 79                	jne    0x4ba91e
  4ba8a5:	83 c7 6a             	add    edi,0x6a
  4ba8a8:	be 14 00 00 00       	mov    esi,0x14
  4ba8ad:	66 8b 07             	mov    ax,WORD PTR [edi]
  4ba8b0:	33 db                	xor    ebx,ebx
  4ba8b2:	66 3b c3             	cmp    ax,bx
  4ba8b5:	74 17                	je     0x4ba8ce
  4ba8b7:	0f b7 c0             	movzx  eax,ax
  4ba8ba:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  4ba8c1:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  4ba8c5:	75 07                	jne    0x4ba8ce
  4ba8c7:	38 58 2a             	cmp    BYTE PTR [eax+0x2a],bl
  4ba8ca:	74 02                	je     0x4ba8ce
  4ba8cc:	8b d8                	mov    ebx,eax
  4ba8ce:	85 db                	test   ebx,ebx
  4ba8d0:	74 22                	je     0x4ba8f4
  4ba8d2:	f6 43 0e 10          	test   BYTE PTR [ebx+0xe],0x10
  4ba8d6:	75 1c                	jne    0x4ba8f4
  4ba8d8:	8a 43 2c             	mov    al,BYTE PTR [ebx+0x2c]
  4ba8db:	53                   	push   ebx
  4ba8dc:	88 43 7d             	mov    BYTE PTR [ebx+0x7d],al
  4ba8df:	e8 0c 2e 03 00       	call   0x4ed6f0
  4ba8e4:	83 c4 04             	add    esp,0x4
  4ba8e7:	c6 43 2c 23          	mov    BYTE PTR [ebx+0x2c],0x23
  4ba8eb:	53                   	push   ebx
  4ba8ec:	e8 4f 2d 03 00       	call   0x4ed640
  4ba8f1:	83 c4 04             	add    esp,0x4
  4ba8f4:	83 c7 02             	add    edi,0x2
  4ba8f7:	4e                   	dec    esi
  4ba8f8:	75 b3                	jne    0x4ba8ad
  4ba8fa:	66 8b 45 04          	mov    ax,WORD PTR [ebp+0x4]
  4ba8fe:	6a 03                	push   0x3
  4ba900:	66 89 44 24 18       	mov    WORD PTR [esp+0x18],ax
  4ba905:	8b 8c 24 50 03 00 00 	mov    ecx,DWORD PTR [esp+0x350]
  4ba90c:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4ba910:	51                   	push   ecx
  4ba911:	6a 00                	push   0x0
  4ba913:	6a 00                	push   0x0
  4ba915:	50                   	push   eax
  4ba916:	e8 75 e8 ff ff       	call   0x4b9190
  4ba91b:	83 c4 14             	add    esp,0x14
  4ba91e:	83 c5 08             	add    ebp,0x8
  4ba921:	ff 44 24 10          	inc    DWORD PTR [esp+0x10]
  4ba925:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  4ba929:	3b 44 24 18          	cmp    eax,DWORD PTR [esp+0x18]
  4ba92d:	0f 8c 15 ff ff ff    	jl     0x4ba848
  4ba933:	5d                   	pop    ebp
  4ba934:	5f                   	pop    edi
  4ba935:	5e                   	pop    esi
  4ba936:	5b                   	pop    ebx
  4ba937:	81 c4 2c 03 00 00    	add    esp,0x32c
  4ba93d:	c3                   	ret
  4ba93e:	cc                   	int3
  4ba93f:	cc                   	int3
  4ba940:	53                   	push   ebx
  4ba941:	56                   	push   esi
  4ba942:	57                   	push   edi
  4ba943:	be 14 00 00 00       	mov    esi,0x14
  4ba948:	8b 7c 24 10          	mov    edi,DWORD PTR [esp+0x10]
  4ba94c:	55                   	push   ebp
  4ba94d:	83 c7 6a             	add    edi,0x6a
  4ba950:	bd 01 00 00 00       	mov    ebp,0x1
  4ba955:	66 8b 07             	mov    ax,WORD PTR [edi]
  4ba958:	33 db                	xor    ebx,ebx
  4ba95a:	66 3b c3             	cmp    ax,bx
  4ba95d:	74 16                	je     0x4ba975
  4ba95f:	0f b7 c0             	movzx  eax,ax
  4ba962:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  4ba969:	85 68 0c             	test   DWORD PTR [eax+0xc],ebp
  4ba96c:	75 07                	jne    0x4ba975
  4ba96e:	38 58 2a             	cmp    BYTE PTR [eax+0x2a],bl
  4ba971:	74 02                	je     0x4ba975
  4ba973:	8b d8                	mov    ebx,eax
  4ba975:	85 db                	test   ebx,ebx
  4ba977:	74 22                	je     0x4ba99b
  4ba979:	f6 43 0e 10          	test   BYTE PTR [ebx+0xe],0x10
  4ba97d:	75 1c                	jne    0x4ba99b
  4ba97f:	8a 43 2c             	mov    al,BYTE PTR [ebx+0x2c]
  4ba982:	53                   	push   ebx
  4ba983:	88 43 7d             	mov    BYTE PTR [ebx+0x7d],al
  4ba986:	e8 65 2d 03 00       	call   0x4ed6f0
  4ba98b:	83 c4 04             	add    esp,0x4
  4ba98e:	c6 43 2c 23          	mov    BYTE PTR [ebx+0x2c],0x23
  4ba992:	53                   	push   ebx
  4ba993:	e8 a8 2c 03 00       	call   0x4ed640
  4ba998:	83 c4 04             	add    esp,0x4
  4ba99b:	83 c7 02             	add    edi,0x2
  4ba99e:	4e                   	dec    esi
  4ba99f:	75 b4                	jne    0x4ba955
  4ba9a1:	5d                   	pop    ebp
  4ba9a2:	5f                   	pop    edi
  4ba9a3:	5e                   	pop    esi
  4ba9a4:	5b                   	pop    ebx
  4ba9a5:	c3                   	ret
  4ba9a6:	cc                   	int3
  4ba9a7:	cc                   	int3
  4ba9a8:	cc                   	int3
  4ba9a9:	cc                   	int3
  4ba9aa:	cc                   	int3
  4ba9ab:	cc                   	int3
  4ba9ac:	cc                   	int3
  4ba9ad:	cc                   	int3
  4ba9ae:	cc                   	int3
  4ba9af:	cc                   	int3
