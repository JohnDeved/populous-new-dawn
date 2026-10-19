
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0052a7e0 <.text+0x1297e0>:
  52a7e0:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  52a7e4:	8b 4c 24 08          	mov    ecx,DWORD PTR [esp+0x8]
  52a7e8:	8b 54 24 04          	mov    edx,DWORD PTR [esp+0x4]
  52a7ec:	50                   	push   eax
  52a7ed:	51                   	push   ecx
  52a7ee:	a1 f0 5a d0 00       	mov    eax,ds:0xd05af0
  52a7f3:	8b 00                	mov    eax,DWORD PTR [eax]
  52a7f5:	52                   	push   edx
  52a7f6:	8b 0d f0 5a d0 00    	mov    ecx,DWORD PTR ds:0xd05af0
  52a7fc:	ff 50 38             	call   DWORD PTR [eax+0x38]
  52a7ff:	c3                   	ret
  52a800:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  52a804:	56                   	push   esi
  52a805:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  52a809:	57                   	push   edi
  52a80a:	8b 4e 18             	mov    ecx,DWORD PTR [esi+0x18]
  52a80d:	89 08                	mov    DWORD PTR [eax],ecx
  52a80f:	83 c6 28             	add    esi,0x28
  52a812:	8d 78 10             	lea    edi,[eax+0x10]
  52a815:	8b 56 f4             	mov    edx,DWORD PTR [esi-0xc]
  52a818:	89 50 04             	mov    DWORD PTR [eax+0x4],edx
  52a81b:	8b 4e f8             	mov    ecx,DWORD PTR [esi-0x8]
  52a81e:	89 48 08             	mov    DWORD PTR [eax+0x8],ecx
  52a821:	b9 06 00 00 00       	mov    ecx,0x6
  52a826:	8b 56 fc             	mov    edx,DWORD PTR [esi-0x4]
  52a829:	89 50 0c             	mov    DWORD PTR [eax+0xc],edx
  52a82c:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  52a82e:	5f                   	pop    edi
  52a82f:	5e                   	pop    esi
  52a830:	c3                   	ret
  52a831:	cc                   	int3
  52a832:	cc                   	int3
  52a833:	cc                   	int3
  52a834:	cc                   	int3
  52a835:	cc                   	int3
  52a836:	cc                   	int3
  52a837:	cc                   	int3
  52a838:	cc                   	int3
  52a839:	cc                   	int3
  52a83a:	cc                   	int3
  52a83b:	cc                   	int3
  52a83c:	cc                   	int3
  52a83d:	cc                   	int3
  52a83e:	cc                   	int3
  52a83f:	cc                   	int3
  52a840:	e9 0b 00 00 00       	jmp    0x52a850
  52a845:	cc                   	int3
  52a846:	cc                   	int3
  52a847:	cc                   	int3
  52a848:	cc                   	int3
  52a849:	cc                   	int3
  52a84a:	cc                   	int3
  52a84b:	cc                   	int3
  52a84c:	cc                   	int3
  52a84d:	cc                   	int3
  52a84e:	cc                   	int3
  52a84f:	cc                   	int3
  52a850:	c7 05 18 5c d0 00 1f 	mov    DWORD PTR ds:0xd05c18,0x1f
  52a857:	00 00 00 
  52a85a:	c7 05 1c 5c d0 00 e0 	mov    DWORD PTR ds:0xd05c1c,0x3e0
  52a861:	03 00 00 
  52a864:	c7 05 20 5c d0 00 00 	mov    DWORD PTR ds:0xd05c20,0x7c00
  52a86b:	7c 00 00 
  52a86e:	c7 05 28 5c d0 00 10 	mov    DWORD PTR ds:0xd05c28,0x10
  52a875:	00 00 00 
  52a878:	33 c0                	xor    eax,eax
  52a87a:	a3 24 5c d0 00       	mov    ds:0xd05c24,eax
  52a87f:	a3 2c 5c d0 00       	mov    ds:0xd05c2c,eax
  52a884:	c3                   	ret
  52a885:	cc                   	int3
  52a886:	cc                   	int3
  52a887:	cc                   	int3
  52a888:	cc                   	int3
  52a889:	cc                   	int3
  52a88a:	cc                   	int3
  52a88b:	cc                   	int3
  52a88c:	cc                   	int3
  52a88d:	cc                   	int3
  52a88e:	cc                   	int3
  52a88f:	cc                   	int3
  52a890:	e9 0b 00 00 00       	jmp    0x52a8a0
  52a895:	cc                   	int3
  52a896:	cc                   	int3
  52a897:	cc                   	int3
  52a898:	cc                   	int3
  52a899:	cc                   	int3
  52a89a:	cc                   	int3
  52a89b:	cc                   	int3
  52a89c:	cc                   	int3
  52a89d:	cc                   	int3
  52a89e:	cc                   	int3
  52a89f:	cc                   	int3
  52a8a0:	c7 05 00 5c d0 00 ff 	mov    DWORD PTR ds:0xd05c00,0xff
  52a8a7:	00 00 00 
  52a8aa:	c7 05 04 5c d0 00 00 	mov    DWORD PTR ds:0xd05c04,0xff00
  52a8b1:	ff 00 00 
  52a8b4:	c7 05 08 5c d0 00 00 	mov    DWORD PTR ds:0xd05c08,0xff0000
  52a8bb:	00 ff 00 
  52a8be:	c7 05 10 5c d0 00 18 	mov    DWORD PTR ds:0xd05c10,0x18
  52a8c5:	00 00 00 
  52a8c8:	33 c0                	xor    eax,eax
  52a8ca:	a3 0c 5c d0 00       	mov    ds:0xd05c0c,eax
  52a8cf:	a3 14 5c d0 00       	mov    ds:0xd05c14,eax
  52a8d4:	c3                   	ret
  52a8d5:	cc                   	int3
  52a8d6:	cc                   	int3
  52a8d7:	cc                   	int3
  52a8d8:	cc                   	int3
  52a8d9:	cc                   	int3
  52a8da:	cc                   	int3
  52a8db:	cc                   	int3
  52a8dc:	cc                   	int3
  52a8dd:	cc                   	int3
  52a8de:	cc                   	int3
  52a8df:	cc                   	int3
  52a8e0:	53                   	push   ebx
  52a8e1:	8b 51 04             	mov    edx,DWORD PTR [ecx+0x4]
  52a8e4:	56                   	push   esi
  52a8e5:	57                   	push   edi
  52a8e6:	55                   	push   ebp
  52a8e7:	83 3a 00             	cmp    DWORD PTR [edx],0x0
  52a8ea:	74 4b                	je     0x52a937
  52a8ec:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  52a8f0:	bf 01 00 00 00       	mov    edi,0x1
  52a8f5:	8b 31                	mov    esi,DWORD PTR [ecx]
  52a8f7:	8b 1a                	mov    ebx,DWORD PTR [edx]
  52a8f9:	39 33                	cmp    DWORD PTR [ebx],esi
  52a8fb:	75 32                	jne    0x52a92f
  52a8fd:	8b 43 04             	mov    eax,DWORD PTR [ebx+0x4]
  52a900:	39 41 04             	cmp    DWORD PTR [ecx+0x4],eax
  52a903:	75 2a                	jne    0x52a92f
  52a905:	8b 43 08             	mov    eax,DWORD PTR [ebx+0x8]
  52a908:	39 41 08             	cmp    DWORD PTR [ecx+0x8],eax
  52a90b:	75 22                	jne    0x52a92f
  52a90d:	8b 43 0c             	mov    eax,DWORD PTR [ebx+0xc]
  52a910:	39 41 0c             	cmp    DWORD PTR [ecx+0xc],eax
  52a913:	75 1a                	jne    0x52a92f
  52a915:	8b 43 10             	mov    eax,DWORD PTR [ebx+0x10]
  52a918:	39 41 10             	cmp    DWORD PTR [ecx+0x10],eax
  52a91b:	75 12                	jne    0x52a92f
  52a91d:	39 79 14             	cmp    DWORD PTR [ecx+0x14],edi
  52a920:	1b ed                	sbb    ebp,ebp
  52a922:	f7 dd                	neg    ebp
  52a924:	39 7b 14             	cmp    DWORD PTR [ebx+0x14],edi
  52a927:	1b c0                	sbb    eax,eax
  52a929:	f7 d8                	neg    eax
  52a92b:	3b e8                	cmp    ebp,eax
  52a92d:	74 11                	je     0x52a940
  52a92f:	83 c2 04             	add    edx,0x4
  52a932:	83 3a 00             	cmp    DWORD PTR [edx],0x0
  52a935:	75 c0                	jne    0x52a8f7
  52a937:	33 c0                	xor    eax,eax
  52a939:	5d                   	pop    ebp
  52a93a:	5f                   	pop    edi
  52a93b:	5e                   	pop    esi
  52a93c:	5b                   	pop    ebx
  52a93d:	c2 04 00             	ret    0x4
  52a940:	b8 01 00 00 00       	mov    eax,0x1
  52a945:	5d                   	pop    ebp
  52a946:	5f                   	pop    edi
  52a947:	5e                   	pop    esi
  52a948:	5b                   	pop    ebx
  52a949:	c2 04 00             	ret    0x4
  52a94c:	cc                   	int3
  52a94d:	cc                   	int3
  52a94e:	cc                   	int3
  52a94f:	cc                   	int3
  52a950:	8b 51 04             	mov    edx,DWORD PTR [ecx+0x4]
  52a953:	33 c0                	xor    eax,eax
  52a955:	39 02                	cmp    DWORD PTR [edx],eax
  52a957:	74 16                	je     0x52a96f
  52a959:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  52a95d:	8b 48 10             	mov    ecx,DWORD PTR [eax+0x10]
