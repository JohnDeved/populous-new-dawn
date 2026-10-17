
../populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0049e5c0 <.text+0x9d5c0>:
  49e5c0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  49e5c4:	83 ec 04             	sub    esp,0x4
  49e5c7:	53                   	push   ebx
  49e5c8:	8b 48 63             	mov    ecx,DWORD PTR [eax+0x63]
  49e5cb:	51                   	push   ecx
  49e5cc:	32 db                	xor    bl,bl
  49e5ce:	e8 0d 4a 02 00       	call   0x4c2fe0
  49e5d3:	88 44 24 0b          	mov    BYTE PTR [esp+0xb],al
  49e5d7:	83 c4 04             	add    esp,0x4
  49e5da:	66 83 3d c1 c6 89 00 	cmp    WORD PTR ds:0x89c6c1,0x2
  49e5e1:	02 
  49e5e2:	74 5d                	je     0x49e641
  49e5e4:	f6 05 64 c6 89 00 06 	test   BYTE PTR ds:0x89c664,0x6
  49e5eb:	75 54                	jne    0x49e641
  49e5ed:	3a c3                	cmp    al,bl
  49e5ef:	74 3a                	je     0x49e62b
  49e5f1:	f6 05 7c d1 89 00 20 	test   BYTE PTR ds:0x89d17c,0x20
  49e5f8:	75 2f                	jne    0x49e629
  49e5fa:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  49e601:	8b c8                	mov    ecx,eax
  49e603:	8d 14 80             	lea    edx,[eax+eax*4]
  49e606:	8d 04 51             	lea    eax,[ecx+edx*2]
  49e609:	8d 14 c0             	lea    edx,[eax+eax*8]
  49e60c:	8d 04 d1             	lea    eax,[ecx+edx*8]
  49e60f:	8b 84 81 65 da 89 00 	mov    eax,DWORD PTR [ecx+eax*4+0x89da65]
  49e616:	85 c0                	test   eax,eax
  49e618:	74 0f                	je     0x49e629
  49e61a:	6a 13                	push   0x13
  49e61c:	50                   	push   eax
  49e61d:	e8 ce bd f6 ff       	call   0x40a3f0
  49e622:	83 c4 08             	add    esp,0x8
  49e625:	85 c0                	test   eax,eax
  49e627:	75 02                	jne    0x49e62b
  49e629:	b3 01                	mov    bl,0x1
  49e62b:	84 db                	test   bl,bl
  49e62d:	74 12                	je     0x49e641
  49e62f:	8b 44 24 07          	mov    eax,DWORD PTR [esp+0x7]
  49e633:	50                   	push   eax
  49e634:	e8 97 4a 02 00       	call   0x4c30d0
  49e639:	83 c4 04             	add    esp,0x4
  49e63c:	e8 9f 4a 02 00       	call   0x4c30e0
  49e641:	5b                   	pop    ebx
  49e642:	83 c4 04             	add    esp,0x4
  49e645:	c3                   	ret
  49e646:	cc                   	int3
  49e647:	cc                   	int3
  49e648:	cc                   	int3
  49e649:	cc                   	int3
  49e64a:	cc                   	int3
  49e64b:	cc                   	int3
  49e64c:	cc                   	int3
  49e64d:	cc                   	int3
  49e64e:	cc                   	int3
  49e64f:	cc                   	int3
  49e650:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  49e654:	83 ec 04             	sub    esp,0x4
  49e657:	53                   	push   ebx
  49e658:	8b 48 63             	mov    ecx,DWORD PTR [eax+0x63]
  49e65b:	56                   	push   esi
  49e65c:	57                   	push   edi
  49e65d:	51                   	push   ecx
  49e65e:	e8 7d 49 02 00       	call   0x4c2fe0
  49e663:	88 44 24 13          	mov    BYTE PTR [esp+0x13],al
  49e667:	83 c4 04             	add    esp,0x4
  49e66a:	f6 05 7c d1 89 00 20 	test   BYTE PTR ds:0x89d17c,0x20
  49e671:	0f 85 4c 01 00 00    	jne    0x49e7c3
  49e677:	84 c0                	test   al,al
  49e679:	0f 84 44 01 00 00    	je     0x49e7c3
  49e67f:	33 db                	xor    ebx,ebx
  49e681:	8a d8                	mov    bl,al
  49e683:	53                   	push   ebx
  49e684:	e8 17 46 02 00       	call   0x4c2ca0
  49e689:	83 c4 04             	add    esp,0x4
  49e68c:	84 c0                	test   al,al
  49e68e:	0f 84 2f 01 00 00    	je     0x49e7c3
  49e694:	81 0d a8 5d 89 00 00 	or     DWORD PTR ds:0x895da8,0x800000
  49e69b:	00 80 00 
  49e69e:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  49e6a5:	53                   	push   ebx
  49e6a6:	50                   	push   eax
  49e6a7:	e8 f4 44 02 00       	call   0x4c2ba0
  49e6ac:	83 c4 08             	add    esp,0x8
  49e6af:	85 c0                	test   eax,eax
  49e6b1:	75 34                	jne    0x49e6e7
  49e6b3:	8b 35 74 3b 68 00    	mov    esi,DWORD PTR ds:0x683b74
  49e6b9:	85 f6                	test   esi,esi
  49e6bb:	74 2a                	je     0x49e6e7
  49e6bd:	bf 01 ff ff ff       	mov    edi,0xffffff01
  49e6c2:	66 39 7e 1c          	cmp    WORD PTR [esi+0x1c],di
  49e6c6:	75 18                	jne    0x49e6e0
  49e6c8:	8b c6                	mov    eax,esi
  49e6ca:	b9 2d 00 00 00       	mov    ecx,0x2d
  49e6cf:	2d 92 3b 68 00       	sub    eax,0x683b92
  49e6d4:	99                   	cdq
  49e6d5:	f7 f9                	idiv   ecx
  49e6d7:	50                   	push   eax
  49e6d8:	e8 03 29 f9 ff       	call   0x430fe0
  49e6dd:	83 c4 04             	add    esp,0x4
  49e6e0:	8b 76 29             	mov    esi,DWORD PTR [esi+0x29]
  49e6e3:	85 f6                	test   esi,esi
  49e6e5:	75 db                	jne    0x49e6c2
  49e6e7:	80 3d ae 45 98 00 00 	cmp    BYTE PTR ds:0x9845ae,0x0
  49e6ee:	74 09                	je     0x49e6f9
  49e6f0:	80 3d ae 46 98 00 00 	cmp    BYTE PTR ds:0x9846ae,0x0
  49e6f7:	74 12                	je     0x49e70b
  49e6f9:	80 3d 2e 46 98 00 00 	cmp    BYTE PTR ds:0x98462e,0x0
  49e700:	74 23                	je     0x49e725
  49e702:	80 3d 2e 47 98 00 00 	cmp    BYTE PTR ds:0x98472e,0x0
  49e709:	75 1a                	jne    0x49e725
  49e70b:	6a 00                	push   0x0
  49e70d:	a0 f0 c6 89 00       	mov    al,ds:0x89c6f0
  49e712:	53                   	push   ebx
  49e713:	6a 75                	push   0x75
  49e715:	50                   	push   eax
  49e716:	e8 d5 b5 fd ff       	call   0x479cf0
  49e71b:	83 c4 10             	add    esp,0x10
  49e71e:	5f                   	pop    edi
  49e71f:	5e                   	pop    esi
  49e720:	5b                   	pop    ebx
  49e721:	83 c4 04             	add    esp,0x4
  49e724:	c3                   	ret
  49e725:	80 3d bb 45 98 00 00 	cmp    BYTE PTR ds:0x9845bb,0x0
  49e72c:	74 09                	je     0x49e737
  49e72e:	80 3d bb 46 98 00 00 	cmp    BYTE PTR ds:0x9846bb,0x0
  49e735:	74 12                	je     0x49e749
  49e737:	80 3d c7 45 98 00 00 	cmp    BYTE PTR ds:0x9845c7,0x0
  49e73e:	74 3b                	je     0x49e77b
  49e740:	80 3d c7 46 98 00 00 	cmp    BYTE PTR ds:0x9846c7,0x0
  49e747:	75 32                	jne    0x49e77b
  49e749:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  49e750:	53                   	push   ebx
  49e751:	50                   	push   eax
  49e752:	e8 49 44 02 00       	call   0x4c2ba0
  49e757:	83 c4 08             	add    esp,0x8
  49e75a:	8a 0d f0 c6 89 00    	mov    cl,BYTE PTR ds:0x89c6f0
  49e760:	83 f8 01             	cmp    eax,0x1
  49e763:	1b c0                	sbb    eax,eax
  49e765:	f7 d8                	neg    eax
  49e767:	50                   	push   eax
  49e768:	53                   	push   ebx
  49e769:	6a 74                	push   0x74
  49e76b:	51                   	push   ecx
  49e76c:	e8 7f b5 fd ff       	call   0x479cf0
  49e771:	83 c4 10             	add    esp,0x10
  49e774:	5f                   	pop    edi
  49e775:	5e                   	pop    esi
  49e776:	5b                   	pop    ebx
  49e777:	83 c4 04             	add    esp,0x4
  49e77a:	c3                   	ret
  49e77b:	be 01 00 00 00       	mov    esi,0x1
  49e780:	8a 4c 24 0f          	mov    cl,BYTE PTR [esp+0xf]
  49e784:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  49e78b:	d3 e6                	shl    esi,cl
  49e78d:	8d 14 c5 00 00 00 00 	lea    edx,[eax*8+0x0]
  49e794:	2b d0                	sub    edx,eax
  49e796:	85 34 d5 0a 07 96 00 	test   DWORD PTR [edx*8+0x96070a],esi
  49e79d:	74 24                	je     0x49e7c3
  49e79f:	53                   	push   ebx
  49e7a0:	50                   	push   eax
  49e7a1:	e8 fa 43 02 00       	call   0x4c2ba0
  49e7a6:	83 c4 08             	add    esp,0x8
  49e7a9:	8a 0d f0 c6 89 00    	mov    cl,BYTE PTR ds:0x89c6f0
  49e7af:	83 f8 01             	cmp    eax,0x1
  49e7b2:	1b c0                	sbb    eax,eax
  49e7b4:	f7 d8                	neg    eax
  49e7b6:	50                   	push   eax
  49e7b7:	53                   	push   ebx
  49e7b8:	6a 56                	push   0x56
  49e7ba:	51                   	push   ecx
  49e7bb:	e8 30 b5 fd ff       	call   0x479cf0
  49e7c0:	83 c4 10             	add    esp,0x10
  49e7c3:	5f                   	pop    edi
  49e7c4:	5e                   	pop    esi
  49e7c5:	5b                   	pop    ebx
  49e7c6:	83 c4 04             	add    esp,0x4
  49e7c9:	c3                   	ret
  49e7ca:	cc                   	int3
  49e7cb:	cc                   	int3
  49e7cc:	cc                   	int3
  49e7cd:	cc                   	int3
  49e7ce:	cc                   	int3
  49e7cf:	cc                   	int3
  49e7d0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  49e7d4:	83 78 10 00          	cmp    DWORD PTR [eax+0x10],0x0
  49e7d8:	74 1d                	je     0x49e7f7
  49e7da:	83 78 4f 00          	cmp    DWORD PTR [eax+0x4f],0x0
  49e7de:	74 17                	je     0x49e7f7
  49e7e0:	80 78 5a 04          	cmp    BYTE PTR [eax+0x5a],0x4
  49e7e4:	74 11                	je     0x49e7f7
  49e7e6:	8b 40 63             	mov    eax,DWORD PTR [eax+0x63]
  49e7e9:	50                   	push   eax
  49e7ea:	e8 f1 47 02 00       	call   0x4c2fe0
  49e7ef:	83 c4 04             	add    esp,0x4
  49e7f2:	a2 78 ae 5c 00       	mov    ds:0x5cae78,al
  49e7f7:	c3                   	ret
  49e7f8:	cc                   	int3
  49e7f9:	cc                   	int3
  49e7fa:	cc                   	int3
  49e7fb:	cc                   	int3
  49e7fc:	cc                   	int3
  49e7fd:	cc                   	int3
  49e7fe:	cc                   	int3
  49e7ff:	cc                   	int3
  49e800:	53                   	push   ebx
  49e801:	56                   	push   esi
  49e802:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  49e806:	8b 46 63             	mov    eax,DWORD PTR [esi+0x63]
  49e809:	50                   	push   eax
  49e80a:	e8 d1 47 02 00       	call   0x4c2fe0
  49e80f:	83 c4 04             	add    esp,0x4
  49e812:	8a d8                	mov    bl,al
  49e814:	c7 46 08 00 00 00 00 	mov    DWORD PTR [esi+0x8],0x0
  49e81b:	c7 46 10 01 00 00 00 	mov    DWORD PTR [esi+0x10],0x1
  49e822:	c6 46 5a 00          	mov    BYTE PTR [esi+0x5a],0x0
  49e826:	c7 46 4f 00 00 00 00 	mov    DWORD PTR [esi+0x4f],0x0
  49e82d:	66 c7 46 57 00 00    	mov    WORD PTR [esi+0x57],0x0
  49e833:	84 db                	test   bl,bl
  49e835:	74 76                	je     0x49e8ad
  49e837:	53                   	push   ebx
  49e838:	e8 d3 48 02 00       	call   0x4c3110
  49e83d:	83 c4 04             	add    esp,0x4
  49e840:	85 c0                	test   eax,eax
  49e842:	74 45                	je     0x49e889
  49e844:	33 c9                	xor    ecx,ecx
  49e846:	c7 46 10 01 00 00 00 	mov    DWORD PTR [esi+0x10],0x1
  49e84d:	8a cb                	mov    cl,bl
  49e84f:	88 46 5a             	mov    BYTE PTR [esi+0x5a],al
  49e852:	c7 46 4f 01 00 00 00 	mov    DWORD PTR [esi+0x4f],0x1
  49e859:	8b d1                	mov    edx,ecx
  49e85b:	c1 e1 06             	shl    ecx,0x6
  49e85e:	2b ca                	sub    ecx,edx
  49e860:	2b ca                	sub    ecx,edx
  49e862:	81 c1 d0 80 5a 00    	add    ecx,0x5a80d0
  49e868:	f6 05 7c d1 89 00 20 	test   BYTE PTR ds:0x89d17c,0x20
  49e86f:	74 06                	je     0x49e877
  49e871:	66 8b 41 18          	mov    ax,WORD PTR [ecx+0x18]
  49e875:	eb 04                	jmp    0x49e87b
  49e877:	66 8b 41 16          	mov    ax,WORD PTR [ecx+0x16]
  49e87b:	c7 46 08 01 00 00 00 	mov    DWORD PTR [esi+0x8],0x1
  49e882:	66 89 46 57          	mov    WORD PTR [esi+0x57],ax
  49e886:	5e                   	pop    esi
  49e887:	5b                   	pop    ebx
  49e888:	c3                   	ret
  49e889:	53                   	push   ebx
  49e88a:	e8 51 49 02 00       	call   0x4c31e0
  49e88f:	83 c4 04             	add    esp,0x4
  49e892:	85 c0                	test   eax,eax
  49e894:	74 17                	je     0x49e8ad
  49e896:	c7 46 10 01 00 00 00 	mov    DWORD PTR [esi+0x10],0x1
  49e89d:	c7 46 4f 01 00 00 00 	mov    DWORD PTR [esi+0x4f],0x1
  49e8a4:	66 c7 46 57 42 03    	mov    WORD PTR [esi+0x57],0x342
  49e8aa:	88 46 5a             	mov    BYTE PTR [esi+0x5a],al
  49e8ad:	5e                   	pop    esi
  49e8ae:	5b                   	pop    ebx
  49e8af:	c3                   	ret
