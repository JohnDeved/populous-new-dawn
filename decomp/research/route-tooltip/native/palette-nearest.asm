
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00526660 <.text+0x125660>:
  526660:	81 ec 14 02 00 00    	sub    esp,0x214
  526666:	33 c0                	xor    eax,eax
  526668:	8a 84 24 1c 02 00 00 	mov    al,BYTE PTR [esp+0x21c]
  52666f:	53                   	push   ebx
  526670:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  526674:	56                   	push   esi
  526675:	57                   	push   edi
  526676:	33 c0                	xor    eax,eax
  526678:	8a 84 24 2c 02 00 00 	mov    al,BYTE PTR [esp+0x22c]
  52667f:	55                   	push   ebp
  526680:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  526684:	33 c0                	xor    eax,eax
  526686:	8a 84 24 34 02 00 00 	mov    al,BYTE PTR [esp+0x234]
  52668d:	8b b4 24 28 02 00 00 	mov    esi,DWORD PTR [esp+0x228]
  526694:	c7 44 24 14 00 00 00 	mov    DWORD PTR [esp+0x14],0x1000000
  52669b:	01 
  52669c:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  5266a0:	33 c0                	xor    eax,eax
  5266a2:	66 89 44 24 12       	mov    WORD PTR [esp+0x12],ax
  5266a7:	66 89 44 24 10       	mov    WORD PTR [esp+0x10],ax
  5266ac:	8b 7c 24 18          	mov    edi,DWORD PTR [esp+0x18]
  5266b0:	33 c9                	xor    ecx,ecx
  5266b2:	8a 4e 02             	mov    cl,BYTE PTR [esi+0x2]
  5266b5:	33 d2                	xor    edx,edx
  5266b7:	2b f9                	sub    edi,ecx
  5266b9:	8a 56 01             	mov    dl,BYTE PTR [esi+0x1]
  5266bc:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  5266c0:	33 db                	xor    ebx,ebx
  5266c2:	2b ca                	sub    ecx,edx
  5266c4:	8a 1e                	mov    bl,BYTE PTR [esi]
  5266c6:	0f af ff             	imul   edi,edi
  5266c9:	0f af c9             	imul   ecx,ecx
  5266cc:	8b 54 24 20          	mov    edx,DWORD PTR [esp+0x20]
  5266d0:	03 f9                	add    edi,ecx
  5266d2:	2b d3                	sub    edx,ebx
  5266d4:	0f af d2             	imul   edx,edx
  5266d7:	8d 0c 17             	lea    ecx,[edi+edx*1]
  5266da:	39 4c 24 14          	cmp    DWORD PTR [esp+0x14],ecx
  5266de:	7e 0c                	jle    0x5266ec
  5266e0:	89 4c 24 14          	mov    DWORD PTR [esp+0x14],ecx
  5266e4:	85 c9                	test   ecx,ecx
  5266e6:	0f 84 eb 01 00 00    	je     0x5268d7
  5266ec:	40                   	inc    eax
  5266ed:	83 c6 04             	add    esi,0x4
  5266f0:	3d 00 01 00 00       	cmp    eax,0x100
  5266f5:	72 b5                	jb     0x5266ac
  5266f7:	8d 84 24 24 01 00 00 	lea    eax,[esp+0x124]
  5266fe:	8b 8c 24 28 02 00 00 	mov    ecx,DWORD PTR [esp+0x228]
  526705:	33 d2                	xor    edx,edx
  526707:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  52670b:	33 db                	xor    ebx,ebx
  52670d:	8a 59 02             	mov    bl,BYTE PTR [ecx+0x2]
  526710:	8b 7c 24 1c          	mov    edi,DWORD PTR [esp+0x1c]
  526714:	2b f3                	sub    esi,ebx
  526716:	8b 6c 24 20          	mov    ebp,DWORD PTR [esp+0x20]
  52671a:	33 db                	xor    ebx,ebx
  52671c:	8a 59 01             	mov    bl,BYTE PTR [ecx+0x1]
  52671f:	2b fb                	sub    edi,ebx
  526721:	33 db                	xor    ebx,ebx
  526723:	0f af f6             	imul   esi,esi
  526726:	0f af ff             	imul   edi,edi
  526729:	8a 19                	mov    bl,BYTE PTR [ecx]
  52672b:	03 f7                	add    esi,edi
  52672d:	2b eb                	sub    ebp,ebx
  52672f:	0f af ed             	imul   ebp,ebp
  526732:	03 f5                	add    esi,ebp
  526734:	3b 74 24 14          	cmp    esi,DWORD PTR [esp+0x14]
  526738:	75 08                	jne    0x526742
  52673a:	66 ff 44 24 12       	inc    WORD PTR [esp+0x12]
  52673f:	88 10                	mov    BYTE PTR [eax],dl
  526741:	40                   	inc    eax
  526742:	42                   	inc    edx
  526743:	83 c1 04             	add    ecx,0x4
  526746:	81 fa 00 01 00 00    	cmp    edx,0x100
  52674c:	72 b9                	jb     0x526707
  52674e:	66 83 7c 24 12 01    	cmp    WORD PTR [esp+0x12],0x1
  526754:	75 12                	jne    0x526768
  526756:	8a 84 24 24 01 00 00 	mov    al,BYTE PTR [esp+0x124]
  52675d:	5d                   	pop    ebp
  52675e:	5f                   	pop    edi
  52675f:	5e                   	pop    esi
  526760:	5b                   	pop    ebx
  526761:	81 c4 14 02 00 00    	add    esp,0x214
  526767:	c3                   	ret
  526768:	33 f6                	xor    esi,esi
  52676a:	bd 00 00 00 01       	mov    ebp,0x1000000
  52676f:	66 39 74 24 12       	cmp    WORD PTR [esp+0x12],si
  526774:	74 5f                	je     0x5267d5
  526776:	8b 5c 24 12          	mov    ebx,DWORD PTR [esp+0x12]
  52677a:	81 e3 ff ff 00 00    	and    ebx,0xffff
  526780:	33 c0                	xor    eax,eax
  526782:	8b 94 24 28 02 00 00 	mov    edx,DWORD PTR [esp+0x228]
  526789:	8a 84 34 24 01 00 00 	mov    al,BYTE PTR [esp+esi*1+0x124]
  526790:	8b 7c 24 18          	mov    edi,DWORD PTR [esp+0x18]
  526794:	8d 0c 82             	lea    ecx,[edx+eax*4]
  526797:	33 c0                	xor    eax,eax
  526799:	8a 41 02             	mov    al,BYTE PTR [ecx+0x2]
  52679c:	2b f8                	sub    edi,eax
  52679e:	8b c7                	mov    eax,edi
  5267a0:	99                   	cdq
  5267a1:	33 c2                	xor    eax,edx
  5267a3:	2b c2                	sub    eax,edx
  5267a5:	33 d2                	xor    edx,edx
  5267a7:	8b f8                	mov    edi,eax
  5267a9:	8a 51 01             	mov    dl,BYTE PTR [ecx+0x1]
  5267ac:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  5267b0:	2b c2                	sub    eax,edx
  5267b2:	99                   	cdq
  5267b3:	33 c2                	xor    eax,edx
  5267b5:	2b fa                	sub    edi,edx
  5267b7:	03 f8                	add    edi,eax
  5267b9:	33 d2                	xor    edx,edx
  5267bb:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  5267bf:	8a 11                	mov    dl,BYTE PTR [ecx]
  5267c1:	2b c2                	sub    eax,edx
  5267c3:	99                   	cdq
  5267c4:	33 c2                	xor    eax,edx
  5267c6:	2b c2                	sub    eax,edx
  5267c8:	03 c7                	add    eax,edi
  5267ca:	3b e8                	cmp    ebp,eax
  5267cc:	7e 02                	jle    0x5267d0
  5267ce:	8b e8                	mov    ebp,eax
  5267d0:	46                   	inc    esi
  5267d1:	3b f3                	cmp    esi,ebx
  5267d3:	72 ab                	jb     0x526780
  5267d5:	8d 5c 24 24          	lea    ebx,[esp+0x24]
  5267d9:	33 f6                	xor    esi,esi
  5267db:	66 39 74 24 12       	cmp    WORD PTR [esp+0x12],si
  5267e0:	74 71                	je     0x526853
  5267e2:	8b 44 24 12          	mov    eax,DWORD PTR [esp+0x12]
  5267e6:	25 ff ff 00 00       	and    eax,0xffff
  5267eb:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  5267ef:	33 c0                	xor    eax,eax
  5267f1:	8b 94 24 28 02 00 00 	mov    edx,DWORD PTR [esp+0x228]
  5267f8:	8a 84 34 24 01 00 00 	mov    al,BYTE PTR [esp+esi*1+0x124]
  5267ff:	8b 7c 24 18          	mov    edi,DWORD PTR [esp+0x18]
  526803:	8d 0c 82             	lea    ecx,[edx+eax*4]
  526806:	33 c0                	xor    eax,eax
  526808:	8a 41 02             	mov    al,BYTE PTR [ecx+0x2]
  52680b:	2b f8                	sub    edi,eax
  52680d:	8b c7                	mov    eax,edi
  52680f:	99                   	cdq
  526810:	33 c2                	xor    eax,edx
  526812:	2b c2                	sub    eax,edx
  526814:	33 d2                	xor    edx,edx
  526816:	8b f8                	mov    edi,eax
  526818:	8a 51 01             	mov    dl,BYTE PTR [ecx+0x1]
  52681b:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  52681f:	2b c2                	sub    eax,edx
  526821:	99                   	cdq
  526822:	33 c2                	xor    eax,edx
  526824:	2b fa                	sub    edi,edx
  526826:	03 f8                	add    edi,eax
  526828:	33 d2                	xor    edx,edx
  52682a:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  52682e:	8a 11                	mov    dl,BYTE PTR [ecx]
  526830:	2b c2                	sub    eax,edx
  526832:	99                   	cdq
  526833:	33 c2                	xor    eax,edx
  526835:	2b fa                	sub    edi,edx
  526837:	03 f8                	add    edi,eax
  526839:	3b fd                	cmp    edi,ebp
  52683b:	75 0f                	jne    0x52684c
  52683d:	66 ff 44 24 10       	inc    WORD PTR [esp+0x10]
  526842:	8a 84 34 24 01 00 00 	mov    al,BYTE PTR [esp+esi*1+0x124]
  526849:	88 03                	mov    BYTE PTR [ebx],al
  52684b:	43                   	inc    ebx
  52684c:	46                   	inc    esi
  52684d:	3b 74 24 14          	cmp    esi,DWORD PTR [esp+0x14]
  526851:	72 9c                	jb     0x5267ef
  526853:	66 83 7c 24 10 01    	cmp    WORD PTR [esp+0x10],0x1
  526859:	75 0f                	jne    0x52686a
  52685b:	8a 44 24 24          	mov    al,BYTE PTR [esp+0x24]
  52685f:	5d                   	pop    ebp
  526860:	5f                   	pop    edi
  526861:	5e                   	pop    esi
  526862:	5b                   	pop    ebx
  526863:	81 c4 14 02 00 00    	add    esp,0x214
  526869:	c3                   	ret
  52686a:	33 f6                	xor    esi,esi
  52686c:	bf 00 00 00 01       	mov    edi,0x1000000
  526871:	66 39 74 24 10       	cmp    WORD PTR [esp+0x10],si
  526876:	74 5b                	je     0x5268d3
  526878:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  52687c:	25 ff ff 00 00       	and    eax,0xffff
  526881:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  526885:	8a 44 24 24          	mov    al,BYTE PTR [esp+0x24]
  526889:	33 c9                	xor    ecx,ecx
  52688b:	8b 94 24 28 02 00 00 	mov    edx,DWORD PTR [esp+0x228]
  526892:	8a 4c 34 24          	mov    cl,BYTE PTR [esp+esi*1+0x24]
  526896:	33 db                	xor    ebx,ebx
  526898:	8a 5c 8a 02          	mov    bl,BYTE PTR [edx+ecx*4+0x2]
  52689c:	8d 2c 8a             	lea    ebp,[edx+ecx*4]
  52689f:	33 d2                	xor    edx,edx
  5268a1:	33 c9                	xor    ecx,ecx
  5268a3:	8a 55 01             	mov    dl,BYTE PTR [ebp+0x1]
  5268a6:	8a 4d 00             	mov    cl,BYTE PTR [ebp+0x0]
  5268a9:	0f af c9             	imul   ecx,ecx
  5268ac:	0f af d2             	imul   edx,edx
  5268af:	03 ca                	add    ecx,edx
  5268b1:	0f af db             	imul   ebx,ebx
  5268b4:	8d 0c 4b             	lea    ecx,[ebx+ecx*2]
  5268b7:	3b f9                	cmp    edi,ecx
  5268b9:	7e 06                	jle    0x5268c1
  5268bb:	8b f9                	mov    edi,ecx
  5268bd:	8a 44 34 24          	mov    al,BYTE PTR [esp+esi*1+0x24]
  5268c1:	46                   	inc    esi
  5268c2:	3b 74 24 14          	cmp    esi,DWORD PTR [esp+0x14]
  5268c6:	72 c1                	jb     0x526889
  5268c8:	5d                   	pop    ebp
  5268c9:	5f                   	pop    edi
  5268ca:	5e                   	pop    esi
  5268cb:	5b                   	pop    ebx
  5268cc:	81 c4 14 02 00 00    	add    esp,0x214
  5268d2:	c3                   	ret
  5268d3:	8a 44 24 24          	mov    al,BYTE PTR [esp+0x24]
  5268d7:	5d                   	pop    ebp
  5268d8:	5f                   	pop    edi
  5268d9:	5e                   	pop    esi
  5268da:	5b                   	pop    ebx
  5268db:	81 c4 14 02 00 00    	add    esp,0x214
  5268e1:	c3                   	ret
  5268e2:	cc                   	int3
  5268e3:	cc                   	int3
  5268e4:	cc                   	int3
  5268e5:	cc                   	int3
  5268e6:	cc                   	int3
  5268e7:	cc                   	int3
  5268e8:	cc                   	int3
  5268e9:	cc                   	int3
  5268ea:	cc                   	int3
  5268eb:	cc                   	int3
  5268ec:	cc                   	int3
  5268ed:	cc                   	int3
  5268ee:	cc                   	int3
  5268ef:	cc                   	int3
