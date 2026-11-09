
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00411790 <.text+0x10790>:
  411790:	81 ec d4 02 00 00    	sub    esp,0x2d4
  411796:	83 3d 3c 9a 59 00 00 	cmp    DWORD PTR ds:0x599a3c,0x0
  41179d:	53                   	push   ebx
  41179e:	56                   	push   esi
  41179f:	57                   	push   edi
  4117a0:	55                   	push   ebp
  4117a1:	0f 84 22 0a 00 00    	je     0x4121c9
  4117a7:	c7 05 3c 9a 59 00 00 	mov    DWORD PTR ds:0x599a3c,0x0
  4117ae:	00 00 00 
  4117b1:	e8 6a 25 09 00       	call   0x4a3d20
  4117b6:	8d 84 24 d4 01 00 00 	lea    eax,[esp+0x1d4]
  4117bd:	6a 00                	push   0x0
  4117bf:	68 48 9b 59 00       	push   0x599b48
  4117c4:	50                   	push   eax
  4117c5:	e8 76 e8 0e 00       	call   0x500040
  4117ca:	8d 84 24 e0 01 00 00 	lea    eax,[esp+0x1e0]
  4117d1:	8d 8c 24 d0 00 00 00 	lea    ecx,[esp+0xd0]
  4117d8:	83 c4 0c             	add    esp,0xc
  4117db:	68 3c 9b 59 00       	push   0x599b3c
  4117e0:	50                   	push   eax
  4117e1:	68 34 9b 59 00       	push   0x599b34
  4117e6:	51                   	push   ecx
  4117e7:	e8 64 9c 14 00       	call   0x55b450
  4117ec:	83 c4 10             	add    esp,0x10
  4117ef:	8b 35 0c df 59 00    	mov    esi,DWORD PTR ds:0x59df0c
  4117f5:	e8 06 1a 09 00       	call   0x4a3200
  4117fa:	e8 21 25 09 00       	call   0x4a3d20
  4117ff:	8d 8c 24 c4 00 00 00 	lea    ecx,[esp+0xc4]
  411806:	51                   	push   ecx
  411807:	68 23 cd 89 00       	push   0x89cd23
  41180c:	e8 9f e9 0e 00       	call   0x5001b0
  411811:	8d 44 24 64          	lea    eax,[esp+0x64]
  411815:	83 c4 08             	add    esp,0x8
  411818:	50                   	push   eax
  411819:	68 ff ff ff 0f       	push   0xfffffff
  41181e:	56                   	push   esi
  41181f:	68 23 cd 89 00       	push   0x89cd23
  411824:	e8 57 47 11 00       	call   0x525f80
  411829:	8b 44 24 6c          	mov    eax,DWORD PTR [esp+0x6c]
  41182d:	83 c4 10             	add    esp,0x10
  411830:	6a 00                	push   0x0
  411832:	50                   	push   eax
  411833:	56                   	push   esi
  411834:	e8 07 b7 08 00       	call   0x49cf40
  411839:	8b 7c 24 68          	mov    edi,DWORD PTR [esp+0x68]
  41183d:	83 c4 0c             	add    esp,0xc
  411840:	8b ce                	mov    ecx,esi
  411842:	03 fe                	add    edi,esi
  411844:	3b fe                	cmp    edi,esi
  411846:	76 0d                	jbe    0x411855
  411848:	80 39 0a             	cmp    BYTE PTR [ecx],0xa
  41184b:	75 03                	jne    0x411850
  41184d:	c6 01 00             	mov    BYTE PTR [ecx],0x0
  411850:	41                   	inc    ecx
  411851:	3b f9                	cmp    edi,ecx
  411853:	77 f3                	ja     0x411848
  411855:	8b c6                	mov    eax,esi
  411857:	3b fe                	cmp    edi,esi
  411859:	c7 05 b8 13 5f 00 00 	mov    DWORD PTR ds:0x5f13b8,0x0
  411860:	00 00 00 
  411863:	76 1b                	jbe    0x411880
  411865:	80 38 23             	cmp    BYTE PTR [eax],0x23
  411868:	74 06                	je     0x411870
  41186a:	ff 05 b8 13 5f 00    	inc    DWORD PTR ds:0x5f13b8
  411870:	80 38 00             	cmp    BYTE PTR [eax],0x0
  411873:	74 06                	je     0x41187b
  411875:	40                   	inc    eax
  411876:	80 38 00             	cmp    BYTE PTR [eax],0x0
  411879:	75 fa                	jne    0x411875
  41187b:	40                   	inc    eax
  41187c:	3b f8                	cmp    edi,eax
  41187e:	77 e5                	ja     0x411865
  411880:	a1 b8 13 5f 00       	mov    eax,ds:0x5f13b8
  411885:	8d 04 40             	lea    eax,[eax+eax*2]
  411888:	c1 e0 03             	shl    eax,0x3
  41188b:	50                   	push   eax
  41188c:	e8 9f 4d 11 00       	call   0x526630
  411891:	89 44 24 48          	mov    DWORD PTR [esp+0x48],eax
  411895:	83 c4 04             	add    esp,0x4
  411898:	3b fe                	cmp    edi,esi
  41189a:	76 46                	jbe    0x4118e2
  41189c:	8d 58 14             	lea    ebx,[eax+0x14]
  41189f:	80 3e 23             	cmp    BYTE PTR [esi],0x23
  4118a2:	74 2e                	je     0x4118d2
  4118a4:	53                   	push   ebx
  4118a5:	8d 43 fc             	lea    eax,[ebx-0x4]
  4118a8:	50                   	push   eax
  4118a9:	8d 4b f8             	lea    ecx,[ebx-0x8]
  4118ac:	51                   	push   ecx
  4118ad:	8d 53 f4             	lea    edx,[ebx-0xc]
  4118b0:	52                   	push   edx
  4118b1:	8d 43 f0             	lea    eax,[ebx-0x10]
  4118b4:	50                   	push   eax
  4118b5:	8d 4b ec             	lea    ecx,[ebx-0x14]
  4118b8:	8d 94 24 8c 00 00 00 	lea    edx,[esp+0x8c]
  4118bf:	51                   	push   ecx
  4118c0:	52                   	push   edx
  4118c1:	83 c3 18             	add    ebx,0x18
  4118c4:	68 1c 9b 59 00       	push   0x599b1c
  4118c9:	56                   	push   esi
  4118ca:	e8 21 9c 14 00       	call   0x55b4f0
  4118cf:	83 c4 24             	add    esp,0x24
  4118d2:	80 3e 00             	cmp    BYTE PTR [esi],0x0
  4118d5:	74 06                	je     0x4118dd
  4118d7:	46                   	inc    esi
  4118d8:	80 3e 00             	cmp    BYTE PTR [esi],0x0
  4118db:	75 fa                	jne    0x4118d7
  4118dd:	46                   	inc    esi
  4118de:	3b fe                	cmp    edi,esi
  4118e0:	77 bd                	ja     0x41189f
  4118e2:	8b 35 b8 13 5f 00    	mov    esi,DWORD PTR ds:0x5f13b8
  4118e8:	8d 04 76             	lea    eax,[esi+esi*2]
  4118eb:	c1 e0 02             	shl    eax,0x2
  4118ee:	50                   	push   eax
  4118ef:	e8 3c 4d 11 00       	call   0x526630
  4118f4:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  4118f8:	83 c4 04             	add    esp,0x4
  4118fb:	85 f6                	test   esi,esi
  4118fd:	7e 0c                	jle    0x41190b
  4118ff:	c7 00 19 fc ff ff    	mov    DWORD PTR [eax],0xfffffc19
  411905:	83 c0 0c             	add    eax,0xc
  411908:	4e                   	dec    esi
  411909:	75 f4                	jne    0x4118ff
  41190b:	33 ff                	xor    edi,edi
  41190d:	a1 b8 13 5f 00       	mov    eax,ds:0x5f13b8
  411912:	89 7c 24 10          	mov    DWORD PTR [esp+0x10],edi
  411916:	8d 14 40             	lea    edx,[eax+eax*2]
  411919:	8d 04 90             	lea    eax,[eax+edx*4]
  41191c:	c1 e0 02             	shl    eax,0x2
  41191f:	50                   	push   eax
  411920:	e8 0b 4d 11 00       	call   0x526630
  411925:	89 7c 24 24          	mov    DWORD PTR [esp+0x24],edi
  411929:	83 c4 04             	add    esp,0x4
  41192c:	8b f0                	mov    esi,eax
  41192e:	a3 bc 13 5f 00       	mov    ds:0x5f13bc,eax
  411933:	c7 05 a8 13 5f 00 19 	mov    DWORD PTR ds:0x5f13a8,0xfffffc19
  41193a:	fc ff ff 
  41193d:	39 3d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,edi
  411943:	0f 8e f5 00 00 00    	jle    0x411a3e
  411949:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  41194d:	8b 44 24 44          	mov    eax,DWORD PTR [esp+0x44]
  411951:	83 c0 04             	add    eax,0x4
  411954:	89 4c 24 24          	mov    DWORD PTR [esp+0x24],ecx
  411958:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  41195c:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  411960:	8b 48 fc             	mov    ecx,DWORD PTR [eax-0x4]
  411963:	89 4e 0c             	mov    DWORD PTR [esi+0xc],ecx
  411966:	d9 40 08             	fld    DWORD PTR [eax+0x8]
  411969:	33 ff                	xor    edi,edi
  41196b:	d9 56 14             	fst    DWORD PTR [esi+0x14]
  41196e:	d9 5e 10             	fstp   DWORD PTR [esi+0x10]
  411971:	8b 48 0c             	mov    ecx,DWORD PTR [eax+0xc]
  411974:	89 4e 18             	mov    DWORD PTR [esi+0x18],ecx
  411977:	8b 68 10             	mov    ebp,DWORD PTR [eax+0x10]
  41197a:	89 6e 28             	mov    DWORD PTR [esi+0x28],ebp
  41197d:	e8 9e 23 09 00       	call   0x4a3d20
  411982:	68 04 9b 59 00       	push   0x599b04
  411987:	68 f0 9a 59 00       	push   0x599af0
  41198c:	e8 5f 98 14 00       	call   0x55b1f0
  411991:	83 c4 08             	add    esp,0x8
  411994:	8b d8                	mov    ebx,eax
  411996:	3b df                	cmp    ebx,edi
  411998:	74 46                	je     0x4119e0
  41199a:	8d 44 24 58          	lea    eax,[esp+0x58]
  41199e:	50                   	push   eax
  41199f:	68 ec 9a 59 00       	push   0x599aec
  4119a4:	53                   	push   ebx
  4119a5:	e8 76 a2 14 00       	call   0x55bc20
  4119aa:	83 c4 0c             	add    esp,0xc
  4119ad:	85 c0                	test   eax,eax
  4119af:	7c 26                	jl     0x4119d7
  4119b1:	85 ff                	test   edi,edi
  4119b3:	75 22                	jne    0x4119d7
  4119b5:	3b 6c 24 58          	cmp    ebp,DWORD PTR [esp+0x58]
  4119b9:	75 05                	jne    0x4119c0
  4119bb:	bf 01 00 00 00       	mov    edi,0x1
  4119c0:	8d 44 24 58          	lea    eax,[esp+0x58]
  4119c4:	50                   	push   eax
  4119c5:	68 ec 9a 59 00       	push   0x599aec
  4119ca:	53                   	push   ebx
  4119cb:	e8 50 a2 14 00       	call   0x55bc20
  4119d0:	83 c4 0c             	add    esp,0xc
  4119d3:	85 c0                	test   eax,eax
  4119d5:	7d da                	jge    0x4119b1
  4119d7:	53                   	push   ebx
  4119d8:	e8 d3 92 14 00       	call   0x55acb0
  4119dd:	83 c4 04             	add    esp,0x4
  4119e0:	89 7e 30             	mov    DWORD PTR [esi+0x30],edi
  4119e3:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4119e6:	50                   	push   eax
  4119e7:	e8 94 51 04 00       	call   0x456b80
  4119ec:	8b 4c 24 28          	mov    ecx,DWORD PTR [esp+0x28]
  4119f0:	83 c4 04             	add    esp,0x4
  4119f3:	89 46 2c             	mov    DWORD PTR [esi+0x2c],eax
  4119f6:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  4119fa:	83 44 24 24 0c       	add    DWORD PTR [esp+0x24],0xc
  4119ff:	8b 10                	mov    edx,DWORD PTR [eax]
  411a01:	ff 44 24 10          	inc    DWORD PTR [esp+0x10]
  411a05:	89 11                	mov    DWORD PTR [ecx],edx
  411a07:	8b 50 04             	mov    edx,DWORD PTR [eax+0x4]
  411a0a:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  411a0e:	89 51 04             	mov    DWORD PTR [ecx+0x4],edx
  411a11:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  411a15:	89 41 08             	mov    DWORD PTR [ecx+0x8],eax
  411a18:	83 3a ff             	cmp    DWORD PTR [edx],0xffffffff
  411a1b:	75 05                	jne    0x411a22
  411a1d:	a3 a8 13 5f 00       	mov    ds:0x5f13a8,eax
  411a22:	83 c6 34             	add    esi,0x34
  411a25:	ff 44 24 20          	inc    DWORD PTR [esp+0x20]
  411a29:	83 44 24 14 18       	add    DWORD PTR [esp+0x14],0x18
  411a2e:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  411a32:	39 05 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,eax
  411a38:	0f 8f 1e ff ff ff    	jg     0x41195c
  411a3e:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  411a42:	8d 04 40             	lea    eax,[eax+eax*2]
  411a45:	c1 e0 02             	shl    eax,0x2
  411a48:	50                   	push   eax
  411a49:	e8 e2 4b 11 00       	call   0x526630
  411a4e:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  411a52:	83 c4 04             	add    esp,0x4
  411a55:	83 7c 24 10 00       	cmp    DWORD PTR [esp+0x10],0x0
  411a5a:	7e 12                	jle    0x411a6e
  411a5c:	8b c8                	mov    ecx,eax
  411a5e:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  411a62:	c7 01 19 fc ff ff    	mov    DWORD PTR [ecx],0xfffffc19
  411a68:	83 c1 0c             	add    ecx,0xc
  411a6b:	48                   	dec    eax
  411a6c:	75 f4                	jne    0x411a62
  411a6e:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  411a72:	8b 54 24 1c          	mov    edx,DWORD PTR [esp+0x1c]
  411a76:	8b 01                	mov    eax,DWORD PTR [ecx]
  411a78:	83 7c 24 10 01       	cmp    DWORD PTR [esp+0x10],0x1
  411a7d:	89 02                	mov    DWORD PTR [edx],eax
  411a7f:	8b 59 04             	mov    ebx,DWORD PTR [ecx+0x4]
  411a82:	89 5a 04             	mov    DWORD PTR [edx+0x4],ebx
  411a85:	8b 49 08             	mov    ecx,DWORD PTR [ecx+0x8]
  411a88:	89 4a 08             	mov    DWORD PTR [edx+0x8],ecx
  411a8b:	c7 05 c0 13 5f 00 01 	mov    DWORD PTR ds:0x5f13c0,0x1
  411a92:	00 00 00 
  411a95:	0f 8e ad 00 00 00    	jle    0x411b48
  411a9b:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  411a9f:	8b 54 24 10          	mov    edx,DWORD PTR [esp+0x10]
  411aa3:	83 c1 0c             	add    ecx,0xc
  411aa6:	4a                   	dec    edx
  411aa7:	33 ff                	xor    edi,edi
  411aa9:	33 db                	xor    ebx,ebx
  411aab:	39 1d c0 13 5f 00    	cmp    DWORD PTR ds:0x5f13c0,ebx
  411ab1:	7e 61                	jle    0x411b14
  411ab3:	8b 74 24 1c          	mov    esi,DWORD PTR [esp+0x1c]
  411ab7:	8b 29                	mov    ebp,DWORD PTR [ecx]
  411ab9:	83 c6 04             	add    esi,0x4
  411abc:	39 6e fc             	cmp    DWORD PTR [esi-0x4],ebp
  411abf:	75 40                	jne    0x411b01
  411ac1:	d9 41 04             	fld    DWORD PTR [ecx+0x4]
  411ac4:	dd 9c 24 84 00 00 00 	fstp   QWORD PTR [esp+0x84]
  411acb:	d9 06                	fld    DWORD PTR [esi]
  411acd:	dd 5c 24 7c          	fstp   QWORD PTR [esp+0x7c]
  411ad1:	dd 84 24 84 00 00 00 	fld    QWORD PTR [esp+0x84]
  411ad8:	dc 25 30 f0 58 00    	fsub   QWORD PTR ds:0x58f030
  411ade:	dc 5c 24 7c          	fcomp  QWORD PTR [esp+0x7c]
  411ae2:	df e0                	fnstsw ax
  411ae4:	f6 c4 01             	test   ah,0x1
  411ae7:	74 18                	je     0x411b01
  411ae9:	dd 84 24 84 00 00 00 	fld    QWORD PTR [esp+0x84]
  411af0:	dc 05 30 f0 58 00    	fadd   QWORD PTR ds:0x58f030
  411af6:	dc 5c 24 7c          	fcomp  QWORD PTR [esp+0x7c]
  411afa:	df e0                	fnstsw ax
  411afc:	f6 c4 41             	test   ah,0x41
  411aff:	74 0e                	je     0x411b0f
  411b01:	83 c6 0c             	add    esi,0xc
  411b04:	43                   	inc    ebx
  411b05:	39 1d c0 13 5f 00    	cmp    DWORD PTR ds:0x5f13c0,ebx
  411b0b:	7f af                	jg     0x411abc
  411b0d:	eb 05                	jmp    0x411b14
  411b0f:	bf 01 00 00 00       	mov    edi,0x1
  411b14:	85 ff                	test   edi,edi
  411b16:	75 26                	jne    0x411b3e
  411b18:	8b 35 c0 13 5f 00    	mov    esi,DWORD PTR ds:0x5f13c0
  411b1e:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  411b22:	8d 1c 76             	lea    ebx,[esi+esi*2]
  411b25:	8d 34 98             	lea    esi,[eax+ebx*4]
  411b28:	8b 19                	mov    ebx,DWORD PTR [ecx]
  411b2a:	89 1e                	mov    DWORD PTR [esi],ebx
  411b2c:	8b 41 04             	mov    eax,DWORD PTR [ecx+0x4]
  411b2f:	89 46 04             	mov    DWORD PTR [esi+0x4],eax
  411b32:	8b 69 08             	mov    ebp,DWORD PTR [ecx+0x8]
  411b35:	89 6e 08             	mov    DWORD PTR [esi+0x8],ebp
  411b38:	ff 05 c0 13 5f 00    	inc    DWORD PTR ds:0x5f13c0
  411b3e:	83 c1 0c             	add    ecx,0xc
  411b41:	4a                   	dec    edx
  411b42:	0f 85 5f ff ff ff    	jne    0x411aa7
  411b48:	a1 c0 13 5f 00       	mov    eax,ds:0x5f13c0
  411b4d:	8d 04 40             	lea    eax,[eax+eax*2]
  411b50:	c1 e0 03             	shl    eax,0x3
  411b53:	50                   	push   eax
  411b54:	e8 d7 4a 11 00       	call   0x526630
  411b59:	83 c4 04             	add    esp,0x4
  411b5c:	8b f0                	mov    esi,eax
  411b5e:	83 3d c0 13 5f 00 00 	cmp    DWORD PTR ds:0x5f13c0,0x0
  411b65:	c7 44 24 4c 00 00 00 	mov    DWORD PTR [esp+0x4c],0x0
  411b6c:	00 
  411b6d:	a3 c4 13 5f 00       	mov    ds:0x5f13c4,eax
  411b72:	0f 8e 3e 02 00 00    	jle    0x411db6
  411b78:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  411b7c:	89 44 24 48          	mov    DWORD PTR [esp+0x48],eax
  411b80:	8b 44 24 48          	mov    eax,DWORD PTR [esp+0x48]
  411b84:	8b 08                	mov    ecx,DWORD PTR [eax]
  411b86:	89 0e                	mov    DWORD PTR [esi],ecx
  411b88:	8b 50 04             	mov    edx,DWORD PTR [eax+0x4]
  411b8b:	89 56 0c             	mov    DWORD PTR [esi+0xc],edx
  411b8e:	e8 5d 50 04 00       	call   0x456bf0
  411b93:	83 7c 24 10 00       	cmp    DWORD PTR [esp+0x10],0x0
  411b98:	89 46 10             	mov    DWORD PTR [esi+0x10],eax
  411b9b:	c7 46 04 00 00 00 00 	mov    DWORD PTR [esi+0x4],0x0
  411ba2:	7e 24                	jle    0x411bc8
  411ba4:	8b 54 24 18          	mov    edx,DWORD PTR [esp+0x18]
  411ba8:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  411bac:	8b 02                	mov    eax,DWORD PTR [edx]
  411bae:	39 06                	cmp    DWORD PTR [esi],eax
  411bb0:	75 10                	jne    0x411bc2
  411bb2:	d9 42 04             	fld    DWORD PTR [edx+0x4]
  411bb5:	d8 5e 0c             	fcomp  DWORD PTR [esi+0xc]
  411bb8:	df e0                	fnstsw ax
  411bba:	f6 c4 40             	test   ah,0x40
  411bbd:	74 03                	je     0x411bc2
  411bbf:	ff 46 04             	inc    DWORD PTR [esi+0x4]
  411bc2:	83 c2 0c             	add    edx,0xc
  411bc5:	49                   	dec    ecx
  411bc6:	75 e4                	jne    0x411bac
  411bc8:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  411bcb:	c1 e0 02             	shl    eax,0x2
  411bce:	50                   	push   eax
  411bcf:	e8 5c 4a 11 00       	call   0x526630
  411bd4:	83 c4 04             	add    esp,0x4
  411bd7:	89 46 08             	mov    DWORD PTR [esi+0x8],eax
  411bda:	83 7c 24 10 00       	cmp    DWORD PTR [esp+0x10],0x0
  411bdf:	7e 2f                	jle    0x411c10
  411be1:	8b 7c 24 18          	mov    edi,DWORD PTR [esp+0x18]
  411be5:	33 d2                	xor    edx,edx
  411be7:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  411beb:	8b 07                	mov    eax,DWORD PTR [edi]
  411bed:	39 06                	cmp    DWORD PTR [esi],eax
  411bef:	75 19                	jne    0x411c0a
  411bf1:	d9 47 04             	fld    DWORD PTR [edi+0x4]
  411bf4:	d8 5e 0c             	fcomp  DWORD PTR [esi+0xc]
  411bf7:	df e0                	fnstsw ax
  411bf9:	f6 c4 40             	test   ah,0x40
  411bfc:	74 0c                	je     0x411c0a
  411bfe:	8b 47 08             	mov    eax,DWORD PTR [edi+0x8]
  411c01:	8b 5e 08             	mov    ebx,DWORD PTR [esi+0x8]
  411c04:	89 04 13             	mov    DWORD PTR [ebx+edx*1],eax
  411c07:	83 c2 04             	add    edx,0x4
  411c0a:	83 c7 0c             	add    edi,0xc
  411c0d:	49                   	dec    ecx
  411c0e:	75 db                	jne    0x411beb
  411c10:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  411c13:	c1 e0 04             	shl    eax,0x4
  411c16:	50                   	push   eax
  411c17:	e8 14 4a 11 00       	call   0x526630
  411c1c:	83 c4 04             	add    esp,0x4
  411c1f:	89 46 14             	mov    DWORD PTR [esi+0x14],eax
  411c22:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  411c25:	33 ff                	xor    edi,edi
  411c27:	c1 e0 02             	shl    eax,0x2
  411c2a:	33 db                	xor    ebx,ebx
  411c2c:	50                   	push   eax
  411c2d:	e8 fe 49 11 00       	call   0x526630
  411c32:	83 c4 04             	add    esp,0x4
  411c35:	39 7e 04             	cmp    DWORD PTR [esi+0x4],edi
  411c38:	7e 36                	jle    0x411c70
  411c3a:	8b d0                	mov    edx,eax
  411c3c:	8b 4e 08             	mov    ecx,DWORD PTR [esi+0x8]
  411c3f:	83 c7 04             	add    edi,0x4
  411c42:	8b 6c 39 fc          	mov    ebp,DWORD PTR [ecx+edi*1-0x4]
  411c46:	8b cd                	mov    ecx,ebp
  411c48:	8d 6c 6d 00          	lea    ebp,[ebp+ebp*2+0x0]
  411c4c:	83 c2 04             	add    edx,0x4
  411c4f:	43                   	inc    ebx
  411c50:	8d 2c a9             	lea    ebp,[ecx+ebp*4]
  411c53:	8b 0d bc 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13bc
  411c59:	d9 44 a9 0c          	fld    DWORD PTR [ecx+ebp*4+0xc]
  411c5d:	d9 46 0c             	fld    DWORD PTR [esi+0xc]
  411c60:	d9 f3                	fpatan
  411c62:	dc 0d 38 f0 58 00    	fmul   QWORD PTR ds:0x58f038
  411c68:	d9 5a fc             	fstp   DWORD PTR [edx-0x4]
  411c6b:	39 5e 04             	cmp    DWORD PTR [esi+0x4],ebx
  411c6e:	7f cc                	jg     0x411c3c
  411c70:	33 d2                	xor    edx,edx
  411c72:	33 ff                	xor    edi,edi
  411c74:	39 56 04             	cmp    DWORD PTR [esi+0x4],edx
  411c77:	0f 8e 14 01 00 00    	jle    0x411d91
  411c7d:	8b d8                	mov    ebx,eax
  411c7f:	89 54 24 50          	mov    DWORD PTR [esp+0x50],edx
  411c83:	47                   	inc    edi
  411c84:	89 7c 24 54          	mov    DWORD PTR [esp+0x54],edi
  411c88:	39 7e 04             	cmp    DWORD PTR [esi+0x4],edi
  411c8b:	7f 08                	jg     0x411c95
  411c8d:	c7 44 24 54 00 00 00 	mov    DWORD PTR [esp+0x54],0x0
  411c94:	00 
  411c95:	8b 6e 08             	mov    ebp,DWORD PTR [esi+0x8]
  411c98:	8b 4c 24 50          	mov    ecx,DWORD PTR [esp+0x50]
  411c9c:	8b 6c 0d 00          	mov    ebp,DWORD PTR [ebp+ecx*1+0x0]
  411ca0:	8b cd                	mov    ecx,ebp
  411ca2:	8d 6c 6d 00          	lea    ebp,[ebp+ebp*2+0x0]
  411ca6:	8d 2c a9             	lea    ebp,[ecx+ebp*4]
  411ca9:	8b 0d bc 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13bc
  411caf:	d9 44 a9 10          	fld    DWORD PTR [ecx+ebp*4+0x10]
  411cb3:	d8 03                	fadd   DWORD PTR [ebx]
  411cb5:	8b 6e 14             	mov    ebp,DWORD PTR [esi+0x14]
  411cb8:	d9 5c 15 00          	fstp   DWORD PTR [ebp+edx*1+0x0]
  411cbc:	8b 6e 14             	mov    ebp,DWORD PTR [esi+0x14]
  411cbf:	8d 4c 15 00          	lea    ecx,[ebp+edx*1+0x0]
  411cc3:	d9 01                	fld    DWORD PTR [ecx]
  411cc5:	81 39 00 00 00 80    	cmp    DWORD PTR [ecx],0x80000000
  411ccb:	dd 9c 24 a4 00 00 00 	fstp   QWORD PTR [esp+0xa4]
  411cd2:	76 0f                	jbe    0x411ce3
  411cd4:	dd 84 24 a4 00 00 00 	fld    QWORD PTR [esp+0xa4]
  411cdb:	dc 05 48 f0 58 00    	fadd   QWORD PTR ds:0x58f048
  411ce1:	d9 19                	fstp   DWORD PTR [ecx]
  411ce3:	8b 4e 14             	mov    ecx,DWORD PTR [esi+0x14]
  411ce6:	03 ca                	add    ecx,edx
  411ce8:	d9 01                	fld    DWORD PTR [ecx]
  411cea:	81 39 00 00 b4 43    	cmp    DWORD PTR [ecx],0x43b40000
  411cf0:	dd 9c 24 9c 00 00 00 	fstp   QWORD PTR [esp+0x9c]
  411cf7:	7c 0f                	jl     0x411d08
  411cf9:	dd 84 24 9c 00 00 00 	fld    QWORD PTR [esp+0x9c]
  411d00:	dc 25 48 f0 58 00    	fsub   QWORD PTR ds:0x58f048
  411d06:	d9 19                	fstp   DWORD PTR [ecx]
  411d08:	8b 6e 08             	mov    ebp,DWORD PTR [esi+0x8]
  411d0b:	8b 4c 24 54          	mov    ecx,DWORD PTR [esp+0x54]
  411d0f:	8b 6c 8d 00          	mov    ebp,DWORD PTR [ebp+ecx*4+0x0]
  411d13:	8b cd                	mov    ecx,ebp
  411d15:	8d 6c 6d 00          	lea    ebp,[ebp+ebp*2+0x0]
  411d19:	8d 2c a9             	lea    ebp,[ecx+ebp*4]
  411d1c:	8b 0d bc 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13bc
  411d22:	d9 44 a9 10          	fld    DWORD PTR [ecx+ebp*4+0x10]
  411d26:	d8 23                	fsub   DWORD PTR [ebx]
  411d28:	8b 6e 14             	mov    ebp,DWORD PTR [esi+0x14]
  411d2b:	d9 5c 15 04          	fstp   DWORD PTR [ebp+edx*1+0x4]
  411d2f:	8b 6e 14             	mov    ebp,DWORD PTR [esi+0x14]
  411d32:	8d 4c 15 04          	lea    ecx,[ebp+edx*1+0x4]
  411d36:	d9 01                	fld    DWORD PTR [ecx]
  411d38:	81 39 00 00 00 80    	cmp    DWORD PTR [ecx],0x80000000
  411d3e:	dd 9c 24 94 00 00 00 	fstp   QWORD PTR [esp+0x94]
  411d45:	76 0f                	jbe    0x411d56
  411d47:	dd 84 24 94 00 00 00 	fld    QWORD PTR [esp+0x94]
  411d4e:	dc 05 48 f0 58 00    	fadd   QWORD PTR ds:0x58f048
  411d54:	d9 19                	fstp   DWORD PTR [ecx]
  411d56:	8b 4e 14             	mov    ecx,DWORD PTR [esi+0x14]
  411d59:	8d 4c 11 04          	lea    ecx,[ecx+edx*1+0x4]
  411d5d:	d9 01                	fld    DWORD PTR [ecx]
  411d5f:	81 39 00 00 b4 43    	cmp    DWORD PTR [ecx],0x43b40000
  411d65:	dd 9c 24 8c 00 00 00 	fstp   QWORD PTR [esp+0x8c]
  411d6c:	7c 0f                	jl     0x411d7d
  411d6e:	dd 84 24 8c 00 00 00 	fld    QWORD PTR [esp+0x8c]
  411d75:	dc 25 48 f0 58 00    	fsub   QWORD PTR ds:0x58f048
  411d7b:	d9 19                	fstp   DWORD PTR [ecx]
  411d7d:	83 c3 04             	add    ebx,0x4
  411d80:	83 c2 10             	add    edx,0x10
  411d83:	83 44 24 50 04       	add    DWORD PTR [esp+0x50],0x4
  411d88:	39 7e 04             	cmp    DWORD PTR [esi+0x4],edi
  411d8b:	0f 8f f2 fe ff ff    	jg     0x411c83
  411d91:	50                   	push   eax
  411d92:	83 c6 18             	add    esi,0x18
  411d95:	e8 b6 48 11 00       	call   0x526650
  411d9a:	83 44 24 4c 0c       	add    DWORD PTR [esp+0x4c],0xc
  411d9f:	ff 44 24 50          	inc    DWORD PTR [esp+0x50]
  411da3:	8b 44 24 50          	mov    eax,DWORD PTR [esp+0x50]
  411da7:	83 c4 04             	add    esp,0x4
  411daa:	39 05 c0 13 5f 00    	cmp    DWORD PTR ds:0x5f13c0,eax
  411db0:	0f 8f ca fd ff ff    	jg     0x411b80
  411db6:	8b 44 24 44          	mov    eax,DWORD PTR [esp+0x44]
  411dba:	50                   	push   eax
  411dbb:	e8 90 48 11 00       	call   0x526650
  411dc0:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  411dc4:	83 c4 04             	add    esp,0x4
  411dc7:	50                   	push   eax
  411dc8:	e8 83 48 11 00       	call   0x526650
  411dcd:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  411dd1:	83 c4 04             	add    esp,0x4
  411dd4:	33 ff                	xor    edi,edi
  411dd6:	50                   	push   eax
  411dd7:	e8 74 48 11 00       	call   0x526650
  411ddc:	83 c4 04             	add    esp,0x4
  411ddf:	8b 35 bc 13 5f 00    	mov    esi,DWORD PTR ds:0x5f13bc
  411de5:	39 3d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,edi
  411deb:	0f 8e 93 00 00 00    	jle    0x411e84
  411df1:	c7 46 04 00 00 00 00 	mov    DWORD PTR [esi+0x4],0x0
  411df8:	8b 15 c4 13 5f 00    	mov    edx,DWORD PTR ds:0x5f13c4
  411dfe:	33 ed                	xor    ebp,ebp
  411e00:	39 2d c0 13 5f 00    	cmp    DWORD PTR ds:0x5f13c0,ebp
  411e06:	7e 2f                	jle    0x411e37
  411e08:	39 3a                	cmp    DWORD PTR [edx],edi
  411e0a:	75 03                	jne    0x411e0f
  411e0c:	ff 46 04             	inc    DWORD PTR [esi+0x4]
  411e0f:	33 db                	xor    ebx,ebx
  411e11:	8b 42 04             	mov    eax,DWORD PTR [edx+0x4]
  411e14:	3b c3                	cmp    eax,ebx
  411e16:	7e 13                	jle    0x411e2b
  411e18:	8b 4a 08             	mov    ecx,DWORD PTR [edx+0x8]
  411e1b:	39 39                	cmp    DWORD PTR [ecx],edi
  411e1d:	74 0a                	je     0x411e29
  411e1f:	83 c1 04             	add    ecx,0x4
  411e22:	43                   	inc    ebx
  411e23:	3b d8                	cmp    ebx,eax
  411e25:	7c f4                	jl     0x411e1b
  411e27:	eb 02                	jmp    0x411e2b
  411e29:	89 2e                	mov    DWORD PTR [esi],ebp
  411e2b:	45                   	inc    ebp
  411e2c:	83 c2 18             	add    edx,0x18
  411e2f:	39 2d c0 13 5f 00    	cmp    DWORD PTR ds:0x5f13c0,ebp
  411e35:	7f d1                	jg     0x411e08
  411e37:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  411e3a:	c1 e0 02             	shl    eax,0x2
  411e3d:	50                   	push   eax
  411e3e:	e8 ed 47 11 00       	call   0x526630
  411e43:	83 c4 04             	add    esp,0x4
  411e46:	33 d2                	xor    edx,edx
  411e48:	89 46 08             	mov    DWORD PTR [esi+0x8],eax
  411e4b:	a1 c4 13 5f 00       	mov    eax,ds:0x5f13c4
  411e50:	39 15 c0 13 5f 00    	cmp    DWORD PTR ds:0x5f13c0,edx
  411e56:	7e 1c                	jle    0x411e74
  411e58:	33 c9                	xor    ecx,ecx
  411e5a:	39 38                	cmp    DWORD PTR [eax],edi
  411e5c:	75 0a                	jne    0x411e68
  411e5e:	8b 5e 08             	mov    ebx,DWORD PTR [esi+0x8]
  411e61:	83 c1 04             	add    ecx,0x4
  411e64:	89 54 0b fc          	mov    DWORD PTR [ebx+ecx*1-0x4],edx
  411e68:	42                   	inc    edx
  411e69:	83 c0 18             	add    eax,0x18
  411e6c:	39 15 c0 13 5f 00    	cmp    DWORD PTR ds:0x5f13c0,edx
  411e72:	7f e6                	jg     0x411e5a
  411e74:	47                   	inc    edi
  411e75:	83 c6 34             	add    esi,0x34
  411e78:	39 3d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,edi
  411e7e:	0f 8f 6d ff ff ff    	jg     0x411df1
  411e84:	68 e8 03 00 00       	push   0x3e8
  411e89:	e8 32 4e 04 00       	call   0x456cc0
  411e8e:	83 c4 04             	add    esp,0x4
  411e91:	a3 c8 13 5f 00       	mov    ds:0x5f13c8,eax
  411e96:	e8 65 13 09 00       	call   0x4a3200
  411e9b:	e8 80 1e 09 00       	call   0x4a3d20
  411ea0:	68 08 9b 59 00       	push   0x599b08
  411ea5:	68 23 cd 89 00       	push   0x89cd23
  411eaa:	e8 01 e3 0e 00       	call   0x5001b0
  411eaf:	83 c4 08             	add    esp,0x8
  411eb2:	33 f6                	xor    esi,esi
  411eb4:	68 cc 13 5f 00       	push   0x5f13cc
  411eb9:	6a 00                	push   0x0
  411ebb:	68 23 cd 89 00       	push   0x89cd23
  411ec0:	e8 bb 54 11 00       	call   0x527380
  411ec5:	83 c4 0c             	add    esp,0xc
  411ec8:	83 fe 0c             	cmp    esi,0xc
  411ecb:	0f 8d 62 01 00 00    	jge    0x412033
  411ed1:	a1 72 bc 89 00       	mov    eax,ds:0x89bc72
  411ed6:	8b c8                	mov    ecx,eax
  411ed8:	8d 14 c0             	lea    edx,[eax+eax*8]
  411edb:	8d 04 d1             	lea    eax,[ecx+edx*8]
  411ede:	8d 04 81             	lea    eax,[ecx+eax*4]
  411ee1:	c1 e0 02             	shl    eax,0x2
  411ee4:	8d 04 c1             	lea    eax,[ecx+eax*8]
  411ee7:	05 df 24 00 00       	add    eax,0x24df
  411eec:	a3 72 bc 89 00       	mov    ds:0x89bc72,eax
  411ef1:	89 44 24 40          	mov    DWORD PTR [esp+0x40],eax
  411ef5:	c1 4c 24 40 0d       	ror    DWORD PTR [esp+0x40],0xd
  411efa:	b9 40 42 0f 00       	mov    ecx,0xf4240
  411eff:	8b 44 24 40          	mov    eax,DWORD PTR [esp+0x40]
  411f03:	2b d2                	sub    edx,edx
  411f05:	f7 f1                	div    ecx
  411f07:	81 ea 20 a1 07 00    	sub    edx,0x7a120
  411f0d:	8b 44 24 40          	mov    eax,DWORD PTR [esp+0x40]
  411f11:	8b c8                	mov    ecx,eax
  411f13:	89 54 24 74          	mov    DWORD PTR [esp+0x74],edx
  411f17:	db 44 24 74          	fild   DWORD PTR [esp+0x74]
  411f1b:	8d 14 c0             	lea    edx,[eax+eax*8]
  411f1e:	8d 04 d1             	lea    eax,[ecx+edx*8]
  411f21:	d9 9c 24 b8 00 00 00 	fstp   DWORD PTR [esp+0xb8]
  411f28:	8d 04 81             	lea    eax,[ecx+eax*4]
  411f2b:	c1 e0 02             	shl    eax,0x2
  411f2e:	8d 04 c1             	lea    eax,[ecx+eax*8]
  411f31:	05 df 24 00 00       	add    eax,0x24df
  411f36:	89 44 24 3c          	mov    DWORD PTR [esp+0x3c],eax
  411f3a:	c1 4c 24 3c 0d       	ror    DWORD PTR [esp+0x3c],0xd
  411f3f:	b9 40 42 0f 00       	mov    ecx,0xf4240
  411f44:	8b 44 24 3c          	mov    eax,DWORD PTR [esp+0x3c]
  411f48:	2b d2                	sub    edx,edx
  411f4a:	f7 f1                	div    ecx
  411f4c:	81 ea 20 a1 07 00    	sub    edx,0x7a120
  411f52:	8b 44 24 3c          	mov    eax,DWORD PTR [esp+0x3c]
  411f56:	8b c8                	mov    ecx,eax
  411f58:	89 54 24 70          	mov    DWORD PTR [esp+0x70],edx
  411f5c:	db 44 24 70          	fild   DWORD PTR [esp+0x70]
  411f60:	8d 14 c0             	lea    edx,[eax+eax*8]
  411f63:	8d 04 d1             	lea    eax,[ecx+edx*8]
  411f66:	d9 9c 24 bc 00 00 00 	fstp   DWORD PTR [esp+0xbc]
  411f6d:	8d 04 81             	lea    eax,[ecx+eax*4]
  411f70:	c1 e0 02             	shl    eax,0x2
  411f73:	8d 04 c1             	lea    eax,[ecx+eax*8]
  411f76:	05 df 24 00 00       	add    eax,0x24df
  411f7b:	89 44 24 38          	mov    DWORD PTR [esp+0x38],eax
  411f7f:	c1 4c 24 38 0d       	ror    DWORD PTR [esp+0x38],0xd
  411f84:	8b 44 24 38          	mov    eax,DWORD PTR [esp+0x38]
  411f88:	b9 40 42 0f 00       	mov    ecx,0xf4240
  411f8d:	2b d2                	sub    edx,edx
  411f8f:	a3 72 bc 89 00       	mov    ds:0x89bc72,eax
  411f94:	f7 f1                	div    ecx
  411f96:	81 ea 20 a1 07 00    	sub    edx,0x7a120
  411f9c:	89 54 24 6c          	mov    DWORD PTR [esp+0x6c],edx
  411fa0:	db 44 24 6c          	fild   DWORD PTR [esp+0x6c]
  411fa4:	d9 9c 24 c0 00 00 00 	fstp   DWORD PTR [esp+0xc0]
  411fab:	d9 84 24 bc 00 00 00 	fld    DWORD PTR [esp+0xbc]
  411fb2:	d8 8c 24 bc 00 00 00 	fmul   DWORD PTR [esp+0xbc]
  411fb9:	d9 84 24 c0 00 00 00 	fld    DWORD PTR [esp+0xc0]
  411fc0:	d8 8c 24 c0 00 00 00 	fmul   DWORD PTR [esp+0xc0]
  411fc7:	de c1                	faddp  st(1),st
  411fc9:	d9 84 24 b8 00 00 00 	fld    DWORD PTR [esp+0xb8]
  411fd0:	d8 8c 24 b8 00 00 00 	fmul   DWORD PTR [esp+0xb8]
  411fd7:	de c1                	faddp  st(1),st
  411fd9:	d9 fa                	fsqrt
  411fdb:	d9 e1                	fabs
  411fdd:	dc 1d 50 f0 58 00    	fcomp  QWORD PTR ds:0x58f050
  411fe3:	df e0                	fnstsw ax
  411fe5:	f6 c4 01             	test   ah,0x1
  411fe8:	0f 85 e3 fe ff ff    	jne    0x411ed1
  411fee:	b9 06 00 00 00       	mov    ecx,0x6
  411ff3:	8b c6                	mov    eax,esi
  411ff5:	99                   	cdq
  411ff6:	f7 f9                	idiv   ecx
  411ff8:	8b 8c 24 c0 00 00 00 	mov    ecx,DWORD PTR [esp+0xc0]
  411fff:	8d 04 d5 00 00 00 00 	lea    eax,[edx*8+0x0]
  412006:	03 05 d8 13 5f 00    	add    eax,DWORD PTR ds:0x5f13d8
  41200c:	8b 94 24 bc 00 00 00 	mov    edx,DWORD PTR [esp+0xbc]
  412013:	50                   	push   eax
  412014:	51                   	push   ecx
  412015:	8b 84 24 c0 00 00 00 	mov    eax,DWORD PTR [esp+0xc0]
  41201c:	52                   	push   edx
  41201d:	50                   	push   eax
  41201e:	46                   	inc    esi
  41201f:	e8 4c 4e 04 00       	call   0x456e70
  412024:	83 c4 10             	add    esp,0x10
  412027:	89 04 b5 e0 13 5f 00 	mov    DWORD PTR [esi*4+0x5f13e0],eax
  41202e:	e9 95 fe ff ff       	jmp    0x411ec8
  412033:	be 14 14 5f 00       	mov    esi,0x5f1414
  412038:	a1 72 bc 89 00       	mov    eax,ds:0x89bc72
  41203d:	8b c8                	mov    ecx,eax
  41203f:	8d 14 c0             	lea    edx,[eax+eax*8]
  412042:	8d 04 d1             	lea    eax,[ecx+edx*8]
  412045:	8d 04 81             	lea    eax,[ecx+eax*4]
  412048:	c1 e0 02             	shl    eax,0x2
  41204b:	8d 04 c1             	lea    eax,[ecx+eax*8]
  41204e:	05 df 24 00 00       	add    eax,0x24df
  412053:	a3 72 bc 89 00       	mov    ds:0x89bc72,eax
  412058:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  41205c:	c1 4c 24 34 0d       	ror    DWORD PTR [esp+0x34],0xd
  412061:	b9 a0 86 01 00       	mov    ecx,0x186a0
  412066:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  41206a:	2b d2                	sub    edx,edx
  41206c:	f7 f1                	div    ecx
  41206e:	81 ea 50 c3 00 00    	sub    edx,0xc350
  412074:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  412078:	8b c8                	mov    ecx,eax
  41207a:	89 54 24 68          	mov    DWORD PTR [esp+0x68],edx
  41207e:	db 44 24 68          	fild   DWORD PTR [esp+0x68]
  412082:	8d 14 c0             	lea    edx,[eax+eax*8]
  412085:	8d 04 d1             	lea    eax,[ecx+edx*8]
  412088:	d9 9c 24 ac 00 00 00 	fstp   DWORD PTR [esp+0xac]
  41208f:	8d 04 81             	lea    eax,[ecx+eax*4]
  412092:	c1 e0 02             	shl    eax,0x2
  412095:	8d 04 c1             	lea    eax,[ecx+eax*8]
  412098:	05 df 24 00 00       	add    eax,0x24df
  41209d:	89 44 24 30          	mov    DWORD PTR [esp+0x30],eax
  4120a1:	c1 4c 24 30 0d       	ror    DWORD PTR [esp+0x30],0xd
  4120a6:	b9 a0 86 01 00       	mov    ecx,0x186a0
  4120ab:	8b 44 24 30          	mov    eax,DWORD PTR [esp+0x30]
  4120af:	2b d2                	sub    edx,edx
  4120b1:	f7 f1                	div    ecx
  4120b3:	81 ea 50 c3 00 00    	sub    edx,0xc350
  4120b9:	8b 44 24 30          	mov    eax,DWORD PTR [esp+0x30]
  4120bd:	8b c8                	mov    ecx,eax
  4120bf:	89 54 24 64          	mov    DWORD PTR [esp+0x64],edx
  4120c3:	db 44 24 64          	fild   DWORD PTR [esp+0x64]
  4120c7:	8d 14 c0             	lea    edx,[eax+eax*8]
  4120ca:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4120cd:	d9 9c 24 b0 00 00 00 	fstp   DWORD PTR [esp+0xb0]
  4120d4:	8d 04 81             	lea    eax,[ecx+eax*4]
  4120d7:	c1 e0 02             	shl    eax,0x2
  4120da:	8d 04 c1             	lea    eax,[ecx+eax*8]
  4120dd:	05 df 24 00 00       	add    eax,0x24df
  4120e2:	89 44 24 2c          	mov    DWORD PTR [esp+0x2c],eax
  4120e6:	c1 4c 24 2c 0d       	ror    DWORD PTR [esp+0x2c],0xd
  4120eb:	8b 44 24 2c          	mov    eax,DWORD PTR [esp+0x2c]
  4120ef:	b9 a0 86 01 00       	mov    ecx,0x186a0
  4120f4:	2b d2                	sub    edx,edx
  4120f6:	a3 72 bc 89 00       	mov    ds:0x89bc72,eax
  4120fb:	f7 f1                	div    ecx
  4120fd:	81 ea 50 c3 00 00    	sub    edx,0xc350
  412103:	89 54 24 60          	mov    DWORD PTR [esp+0x60],edx
  412107:	db 44 24 60          	fild   DWORD PTR [esp+0x60]
  41210b:	d9 9c 24 b4 00 00 00 	fstp   DWORD PTR [esp+0xb4]
  412112:	d9 84 24 b0 00 00 00 	fld    DWORD PTR [esp+0xb0]
  412119:	d8 8c 24 b0 00 00 00 	fmul   DWORD PTR [esp+0xb0]
  412120:	d9 84 24 b4 00 00 00 	fld    DWORD PTR [esp+0xb4]
  412127:	d8 8c 24 b4 00 00 00 	fmul   DWORD PTR [esp+0xb4]
  41212e:	de c1                	faddp  st(1),st
  412130:	d9 84 24 ac 00 00 00 	fld    DWORD PTR [esp+0xac]
  412137:	d8 8c 24 ac 00 00 00 	fmul   DWORD PTR [esp+0xac]
  41213e:	de c1                	faddp  st(1),st
  412140:	d9 fa                	fsqrt
  412142:	d9 e1                	fabs
  412144:	dc 1d 58 f0 58 00    	fcomp  QWORD PTR ds:0x58f058
  41214a:	df e0                	fnstsw ax
  41214c:	f6 c4 01             	test   ah,0x1
  41214f:	0f 85 e3 fe ff ff    	jne    0x412038
  412155:	a1 72 bc 89 00       	mov    eax,ds:0x89bc72
  41215a:	8b c8                	mov    ecx,eax
  41215c:	8d 14 c0             	lea    edx,[eax+eax*8]
  41215f:	8d 04 d1             	lea    eax,[ecx+edx*8]
  412162:	8d 04 81             	lea    eax,[ecx+eax*4]
  412165:	c1 e0 02             	shl    eax,0x2
  412168:	8d 04 c1             	lea    eax,[ecx+eax*8]
  41216b:	05 df 24 00 00       	add    eax,0x24df
  412170:	a3 72 bc 89 00       	mov    ds:0x89bc72,eax
  412175:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  412179:	c1 4c 24 28 0d       	ror    DWORD PTR [esp+0x28],0xd
  41217e:	8b 44 24 28          	mov    eax,DWORD PTR [esp+0x28]
  412182:	8b 8c 24 b4 00 00 00 	mov    ecx,DWORD PTR [esp+0xb4]
  412189:	a3 72 bc 89 00       	mov    ds:0x89bc72,eax
  41218e:	83 e0 07             	and    eax,0x7
  412191:	c1 e0 03             	shl    eax,0x3
  412194:	8b 94 24 b0 00 00 00 	mov    edx,DWORD PTR [esp+0xb0]
  41219b:	03 05 d8 13 5f 00    	add    eax,DWORD PTR ds:0x5f13d8
  4121a1:	83 c0 30             	add    eax,0x30
  4121a4:	50                   	push   eax
  4121a5:	51                   	push   ecx
  4121a6:	8b 84 24 b4 00 00 00 	mov    eax,DWORD PTR [esp+0xb4]
  4121ad:	52                   	push   edx
  4121ae:	50                   	push   eax
  4121af:	83 c6 04             	add    esi,0x4
  4121b2:	e8 b9 4c 04 00       	call   0x456e70
  4121b7:	83 c4 10             	add    esp,0x10
  4121ba:	89 46 fc             	mov    DWORD PTR [esi-0x4],eax
  4121bd:	81 fe a4 15 5f 00    	cmp    esi,0x5f15a4
  4121c3:	0f 82 6f fe ff ff    	jb     0x412038
  4121c9:	f6 05 f4 c9 5f 00 01 	test   BYTE PTR ds:0x5fc9f4,0x1
  4121d0:	74 34                	je     0x412206
  4121d2:	33 c9                	xor    ecx,ecx
  4121d4:	39 0d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,ecx
  4121da:	7e 19                	jle    0x4121f5
  4121dc:	a1 bc 13 5f 00       	mov    eax,ds:0x5f13bc
  4121e1:	83 c0 28             	add    eax,0x28
  4121e4:	83 38 01             	cmp    DWORD PTR [eax],0x1
  4121e7:	74 3c                	je     0x412225
  4121e9:	83 c0 34             	add    eax,0x34
  4121ec:	41                   	inc    ecx
  4121ed:	39 0d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,ecx
  4121f3:	7f ef                	jg     0x4121e4
  4121f5:	c7 05 ac 13 5f 00 00 	mov    DWORD PTR ds:0x5f13ac,0x0
  4121fc:	00 00 00 
  4121ff:	83 25 f4 c9 5f 00 fe 	and    DWORD PTR ds:0x5fc9f4,0xfffffffe
  412206:	a1 ac 13 5f 00       	mov    eax,ds:0x5f13ac
  41220b:	5d                   	pop    ebp
  41220c:	5f                   	pop    edi
  41220d:	a3 b0 13 5f 00       	mov    ds:0x5f13b0,eax
  412212:	c7 05 b4 13 5f 00 1e 	mov    DWORD PTR ds:0x5f13b4,0x1e
  412219:	00 00 00 
  41221c:	5e                   	pop    esi
  41221d:	5b                   	pop    ebx
  41221e:	81 c4 d4 02 00 00    	add    esp,0x2d4
  412224:	c3                   	ret
  412225:	89 0d ac 13 5f 00    	mov    DWORD PTR ds:0x5f13ac,ecx
  41222b:	eb d2                	jmp    0x4121ff
  41222d:	cc                   	int3
  41222e:	cc                   	int3
  41222f:	cc                   	int3
