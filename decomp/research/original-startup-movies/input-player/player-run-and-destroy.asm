
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0057a800 <.text+0x179800>:
  57a800:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  57a804:	56                   	push   esi
  57a805:	57                   	push   edi
  57a806:	8b 30                	mov    esi,DWORD PTR [eax]
  57a808:	8b 8e 14 06 00 00    	mov    ecx,DWORD PTR [esi+0x614]
  57a80e:	8b 86 10 06 00 00    	mov    eax,DWORD PTR [esi+0x610]
  57a814:	8b 16                	mov    edx,DWORD PTR [esi]
  57a816:	2b c8                	sub    ecx,eax
  57a818:	89 8a 90 00 00 00    	mov    DWORD PTR [edx+0x90],ecx
  57a81e:	8b ce                	mov    ecx,esi
  57a820:	e8 3b 00 00 00       	call   0x57a860
  57a825:	8b ce                	mov    ecx,esi
  57a827:	e8 44 39 00 00       	call   0x57e170
  57a82c:	8b ce                	mov    ecx,esi
  57a82e:	e8 0d 17 00 00       	call   0x57bf40
  57a833:	8b 06                	mov    eax,DWORD PTR [esi]
  57a835:	8b 3d 24 c7 d0 00    	mov    edi,DWORD PTR ds:0xd0c724
  57a83b:	05 9c 00 00 00       	add    eax,0x9c
  57a840:	6a 06                	push   0x6
  57a842:	50                   	push   eax
  57a843:	ff d7                	call   edi
  57a845:	8b 0e                	mov    ecx,DWORD PTR [esi]
  57a847:	6a 00                	push   0x0
  57a849:	51                   	push   ecx
  57a84a:	ff d7                	call   edi
  57a84c:	56                   	push   esi
  57a84d:	e8 7e 15 fe ff       	call   0x55bdd0
  57a852:	83 c4 04             	add    esp,0x4
  57a855:	33 c0                	xor    eax,eax
  57a857:	5f                   	pop    edi
  57a858:	5e                   	pop    esi
  57a859:	c3                   	ret
  57a85a:	90                   	nop
  57a85b:	90                   	nop
  57a85c:	90                   	nop
  57a85d:	90                   	nop
  57a85e:	90                   	nop
  57a85f:	90                   	nop
  57a860:	56                   	push   esi
  57a861:	8b f1                	mov    esi,ecx
  57a863:	8b 06                	mov    eax,DWORD PTR [esi]
  57a865:	f7 40 04 00 00 08 00 	test   DWORD PTR [eax+0x4],0x80000
  57a86c:	75 13                	jne    0x57a881
  57a86e:	8b 80 a4 00 00 00    	mov    eax,DWORD PTR [eax+0xa4]
  57a874:	85 c0                	test   eax,eax
  57a876:	74 09                	je     0x57a881
  57a878:	6a 00                	push   0x0
  57a87a:	50                   	push   eax
  57a87b:	ff 15 34 c9 d0 00    	call   DWORD PTR ds:0xd0c934
  57a881:	8b 46 1c             	mov    eax,DWORD PTR [esi+0x1c]
  57a884:	85 c0                	test   eax,eax
  57a886:	74 09                	je     0x57a891
  57a888:	50                   	push   eax
  57a889:	e8 42 15 fe ff       	call   0x55bdd0
  57a88e:	83 c4 04             	add    esp,0x4
  57a891:	8b 46 20             	mov    eax,DWORD PTR [esi+0x20]
  57a894:	85 c0                	test   eax,eax
  57a896:	74 09                	je     0x57a8a1
  57a898:	50                   	push   eax
  57a899:	e8 32 15 fe ff       	call   0x55bdd0
  57a89e:	83 c4 04             	add    esp,0x4
  57a8a1:	8d 86 e8 01 00 00    	lea    eax,[esi+0x1e8]
  57a8a7:	b9 18 00 00 00       	mov    ecx,0x18
  57a8ac:	c7 00 00 00 00 00    	mov    DWORD PTR [eax],0x0
  57a8b2:	83 c0 10             	add    eax,0x10
  57a8b5:	49                   	dec    ecx
  57a8b6:	75 f4                	jne    0x57a8ac
  57a8b8:	8b 06                	mov    eax,DWORD PTR [esi]
  57a8ba:	8b 88 84 00 00 00    	mov    ecx,DWORD PTR [eax+0x84]
  57a8c0:	85 c9                	test   ecx,ecx
  57a8c2:	74 14                	je     0x57a8d8
  57a8c4:	8d 46 68             	lea    eax,[esi+0x68]
  57a8c7:	b9 18 00 00 00       	mov    ecx,0x18
  57a8cc:	c7 00 00 00 00 00    	mov    DWORD PTR [eax],0x0
  57a8d2:	83 c0 10             	add    eax,0x10
  57a8d5:	49                   	dec    ecx
  57a8d6:	75 f4                	jne    0x57a8cc
  57a8d8:	33 c0                	xor    eax,eax
  57a8da:	5e                   	pop    esi
  57a8db:	c3                   	ret
  57a8dc:	90                   	nop
  57a8dd:	90                   	nop
  57a8de:	90                   	nop
  57a8df:	90                   	nop
  57a8e0:	53                   	push   ebx
  57a8e1:	56                   	push   esi
  57a8e2:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  57a8e6:	57                   	push   edi
  57a8e7:	56                   	push   esi
  57a8e8:	f7 46 04 00 00 01 00 	test   DWORD PTR [esi+0x4],0x10000
  57a8ef:	74 55                	je     0x57a946
  57a8f1:	6a 00                	push   0x0
  57a8f3:	68 60 a9 57 00       	push   0x57a960
  57a8f8:	e8 93 a9 00 00       	call   0x585290
  57a8fd:	83 c4 0c             	add    esp,0xc
  57a900:	83 f8 ff             	cmp    eax,0xffffffff
  57a903:	89 86 ac 00 00 00    	mov    DWORD PTR [esi+0xac],eax
  57a909:	75 06                	jne    0x57a911
  57a90b:	0b c0                	or     eax,eax
  57a90d:	5f                   	pop    edi
  57a90e:	5e                   	pop    esi
  57a90f:	5b                   	pop    ebx
  57a910:	c3                   	ret
  57a911:	8b 3d 24 c7 d0 00    	mov    edi,DWORD PTR ds:0xd0c724
  57a917:	81 c6 9c 00 00 00    	add    esi,0x9c
  57a91d:	6a 01                	push   0x1
  57a91f:	56                   	push   esi
  57a920:	ff d7                	call   edi
  57a922:	83 f8 02             	cmp    eax,0x2
  57a925:	74 14                	je     0x57a93b
  57a927:	8b 1d e0 c6 d0 00    	mov    ebx,DWORD PTR ds:0xd0c6e0
  57a92d:	6a 14                	push   0x14
  57a92f:	ff d3                	call   ebx
  57a931:	6a 01                	push   0x1
  57a933:	56                   	push   esi
  57a934:	ff d7                	call   edi
  57a936:	83 f8 02             	cmp    eax,0x2
  57a939:	75 f2                	jne    0x57a92d
  57a93b:	6a 02                	push   0x2
  57a93d:	56                   	push   esi
  57a93e:	ff d7                	call   edi
  57a940:	33 c0                	xor    eax,eax
  57a942:	5f                   	pop    edi
  57a943:	5e                   	pop    esi
  57a944:	5b                   	pop    ebx
  57a945:	c3                   	ret
  57a946:	e8 15 00 00 00       	call   0x57a960
  57a94b:	83 c4 04             	add    esp,0x4
  57a94e:	b8 01 00 00 00       	mov    eax,0x1
  57a953:	5f                   	pop    edi
  57a954:	5e                   	pop    esi
  57a955:	5b                   	pop    ebx
  57a956:	c3                   	ret
  57a957:	90                   	nop
  57a958:	90                   	nop
  57a959:	90                   	nop
  57a95a:	90                   	nop
  57a95b:	90                   	nop
  57a95c:	90                   	nop
  57a95d:	90                   	nop
  57a95e:	90                   	nop
  57a95f:	90                   	nop
  57a960:	53                   	push   ebx
  57a961:	8b 5c 24 08          	mov    ebx,DWORD PTR [esp+0x8]
  57a965:	56                   	push   esi
  57a966:	57                   	push   edi
  57a967:	8b 3b                	mov    edi,DWORD PTR [ebx]
  57a969:	8b cb                	mov    ecx,ebx
  57a96b:	8b 07                	mov    eax,DWORD PTR [edi]
  57a96d:	8b 70 04             	mov    esi,DWORD PTR [eax+0x4]
  57a970:	81 e6 00 00 01 00    	and    esi,0x10000
  57a976:	e8 25 00 00 00       	call   0x57a9a0
  57a97b:	8b 87 d8 03 00 00    	mov    eax,DWORD PTR [edi+0x3d8]
  57a981:	85 c0                	test   eax,eax
  57a983:	74 09                	je     0x57a98e
  57a985:	53                   	push   ebx
  57a986:	e8 75 fe ff ff       	call   0x57a800
  57a98b:	83 c4 04             	add    esp,0x4
  57a98e:	85 f6                	test   esi,esi
  57a990:	74 05                	je     0x57a997
  57a992:	e8 49 aa 00 00       	call   0x5853e0
  57a997:	5f                   	pop    edi
  57a998:	5e                   	pop    esi
  57a999:	5b                   	pop    ebx
  57a99a:	c3                   	ret
