
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004aa4e0 <.text+0xa94e0>:
  4aa4e0:	83 ec 0c             	sub    esp,0xc
  4aa4e3:	53                   	push   ebx
  4aa4e4:	57                   	push   edi
  4aa4e5:	e8 86 81 00 00       	call   0x4b2670
  4aa4ea:	85 c0                	test   eax,eax
  4aa4ec:	0f 84 b0 03 00 00    	je     0x4aa8a2
  4aa4f2:	32 db                	xor    bl,bl
  4aa4f4:	f6 05 1c e9 98 00 03 	test   BYTE PTR ds:0x98e91c,0x3
  4aa4fb:	74 02                	je     0x4aa4ff
  4aa4fd:	b3 01                	mov    bl,0x1
  4aa4ff:	f6 05 1c e9 98 00 0c 	test   BYTE PTR ds:0x98e91c,0xc
  4aa506:	74 03                	je     0x4aa50b
  4aa508:	80 cb 02             	or     bl,0x2
  4aa50b:	f6 05 1c e9 98 00 30 	test   BYTE PTR ds:0x98e91c,0x30
  4aa512:	74 03                	je     0x4aa517
  4aa514:	80 cb 04             	or     bl,0x4
  4aa517:	e8 74 56 05 00       	call   0x4ffb90
  4aa51c:	8b 08                	mov    ecx,DWORD PTR [eax]
  4aa51e:	89 0d 80 45 98 00    	mov    DWORD PTR ds:0x984580,ecx
  4aa524:	8b 50 04             	mov    edx,DWORD PTR [eax+0x4]
  4aa527:	89 15 84 45 98 00    	mov    DWORD PTR ds:0x984584,edx
  4aa52d:	e8 6e 34 00 00       	call   0x4ad9a0
  4aa532:	f6 05 6c c6 89 00 10 	test   BYTE PTR ds:0x89c66c,0x10
  4aa539:	0f 85 b3 01 00 00    	jne    0x4aa6f2
  4aa53f:	e8 4c 56 05 00       	call   0x4ffb90
  4aa544:	8b 08                	mov    ecx,DWORD PTR [eax]
  4aa546:	8b 50 04             	mov    edx,DWORD PTR [eax+0x4]
  4aa549:	33 c0                	xor    eax,eax
  4aa54b:	89 0d 08 42 68 00    	mov    DWORD PTR ds:0x684208,ecx
  4aa551:	a0 18 ea 98 00       	mov    al,ds:0x98ea18
  4aa556:	89 15 0c 42 68 00    	mov    DWORD PTR ds:0x68420c,edx
  4aa55c:	a3 80 cd 59 00       	mov    ds:0x59cd80,eax
  4aa561:	33 c0                	xor    eax,eax
  4aa563:	a0 19 ea 98 00       	mov    al,ds:0x98ea19
  4aa568:	a3 84 cd 59 00       	mov    ds:0x59cd84,eax
  4aa56d:	e8 be 0b fa ff       	call   0x44b130
  4aa572:	e8 e9 35 fa ff       	call   0x44db60
  4aa577:	84 c0                	test   al,al
  4aa579:	75 18                	jne    0x4aa593
  4aa57b:	e8 e0 0a fa ff       	call   0x44b060
  4aa580:	85 c0                	test   eax,eax
  4aa582:	75 05                	jne    0x4aa589
  4aa584:	e8 b7 4d 00 00       	call   0x4af340
  4aa589:	e8 e2 0a fa ff       	call   0x44b070
  4aa58e:	e8 fd 0a fa ff       	call   0x44b090
  4aa593:	6a 00                	push   0x0
  4aa595:	6a 00                	push   0x0
  4aa597:	68 98 db 5c 00       	push   0x5cdb98
  4aa59c:	e8 df c4 07 00       	call   0x526a80
  4aa5a1:	83 c4 0c             	add    esp,0xc
  4aa5a4:	f6 05 6c c6 89 00 08 	test   BYTE PTR ds:0x89c66c,0x8
  4aa5ab:	0f 84 05 01 00 00    	je     0x4aa6b6
  4aa5b1:	80 3d 78 db 5c 00 00 	cmp    BYTE PTR ds:0x5cdb78,0x0
  4aa5b8:	a1 b5 c6 89 00       	mov    eax,ds:0x89c6b5
  4aa5bd:	0f 85 e3 00 00 00    	jne    0x4aa6a6
  4aa5c3:	c7 05 b5 c6 89 00 00 	mov    DWORD PTR ds:0x89c6b5,0x0
  4aa5ca:	00 00 00 
  4aa5cd:	81 25 69 c6 89 00 ff 	and    DWORD PTR ds:0x89c669,0xf7ffffff
  4aa5d4:	ff ff f7 
  4aa5d7:	09 05 b1 c6 89 00    	or     DWORD PTR ds:0x89c6b1,eax
  4aa5dd:	b8 00 00 00 10       	mov    eax,0x10000000
  4aa5e2:	85 05 69 c6 89 00    	test   DWORD PTR ds:0x89c669,eax
  4aa5e8:	0f 85 c8 00 00 00    	jne    0x4aa6b6
  4aa5ee:	09 05 69 c6 89 00    	or     DWORD PTR ds:0x89c669,eax
  4aa5f4:	8d 44 24 08          	lea    eax,[esp+0x8]
  4aa5f8:	50                   	push   eax
  4aa5f9:	e8 12 c6 07 00       	call   0x526c10
  4aa5fe:	83 c4 04             	add    esp,0x4
  4aa601:	85 c0                	test   eax,eax
  4aa603:	75 ef                	jne    0x4aa5f4
  4aa605:	bf 28 e9 98 00       	mov    edi,0x98e928
  4aa60a:	33 c0                	xor    eax,eax
  4aa60c:	b9 40 00 00 00       	mov    ecx,0x40
  4aa611:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4aa613:	bf 91 45 98 00       	mov    edi,0x984591
  4aa618:	b9 40 00 00 00       	mov    ecx,0x40
  4aa61d:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4aa61f:	bf 91 46 98 00       	mov    edi,0x984691
  4aa624:	b9 40 00 00 00       	mov    ecx,0x40
  4aa629:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4aa62b:	a3 60 45 98 00       	mov    ds:0x984560,eax
  4aa630:	a3 68 45 98 00       	mov    ds:0x984568,eax
  4aa635:	a3 64 45 98 00       	mov    ds:0x984564,eax
  4aa63a:	a3 6c 45 98 00       	mov    ds:0x98456c,eax
  4aa63f:	a3 74 45 98 00       	mov    ds:0x984574,eax
  4aa644:	a3 70 45 98 00       	mov    ds:0x984570,eax
  4aa649:	80 3d e7 c6 89 00 07 	cmp    BYTE PTR ds:0x89c6e7,0x7
  4aa650:	75 0a                	jne    0x4aa65c
  4aa652:	e8 f9 ea 00 00       	call   0x4b9150
  4aa657:	e8 74 ff 00 00       	call   0x4ba5d0
  4aa65c:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4aa663:	8b c8                	mov    ecx,eax
  4aa665:	8d 14 80             	lea    edx,[eax+eax*4]
  4aa668:	8d 04 51             	lea    eax,[ecx+edx*2]
  4aa66b:	8d 14 c0             	lea    edx,[eax+eax*8]
  4aa66e:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4aa671:	8d 04 81             	lea    eax,[ecx+eax*4]
  4aa674:	05 c8 d1 89 00       	add    eax,0x89d1c8
  4aa679:	50                   	push   eax
  4aa67a:	6a 00                	push   0x0
  4aa67c:	e8 cf fe fc ff       	call   0x47a550
  4aa681:	c6 05 10 e9 98 00 00 	mov    BYTE PTR ds:0x98e910,0x0
  4aa688:	c6 05 6c ce 89 00 00 	mov    BYTE PTR ds:0x89ce6c,0x0
  4aa68f:	66 81 25 08 e9 98 00 	and    WORD PTR ds:0x98e908,0xfbff
  4aa696:	ff fb 
  4aa698:	66 81 25 08 e9 98 00 	and    WORD PTR ds:0x98e908,0xf7ff
  4aa69f:	ff f7 
  4aa6a1:	83 c4 08             	add    esp,0x8
  4aa6a4:	eb 10                	jmp    0x4aa6b6
  4aa6a6:	81 0d 69 c6 89 00 00 	or     DWORD PTR ds:0x89c669,0x8000000
  4aa6ad:	00 00 08 
  4aa6b0:	09 05 b5 c6 89 00    	or     DWORD PTR ds:0x89c6b5,eax
  4aa6b6:	f6 05 6c c6 89 00 04 	test   BYTE PTR ds:0x89c66c,0x4
  4aa6bd:	74 0e                	je     0x4aa6cd
  4aa6bf:	a1 b5 c6 89 00       	mov    eax,ds:0x89c6b5
  4aa6c4:	50                   	push   eax
  4aa6c5:	e8 f6 4a 00 00       	call   0x4af1c0
  4aa6ca:	83 c4 04             	add    esp,0x4
  4aa6cd:	53                   	push   ebx
  4aa6ce:	8b 0d 6c ce 98 00    	mov    ecx,DWORD PTR ds:0x98ce6c
  4aa6d4:	68 28 e9 98 00       	push   0x98e928
  4aa6d9:	e8 42 ee fd ff       	call   0x489520
  4aa6de:	e8 cd 34 00 00       	call   0x4adbb0
  4aa6e3:	e8 18 5a fd ff       	call   0x480100
  4aa6e8:	e8 43 27 f7 ff       	call   0x41ce30
  4aa6ed:	e9 3e 01 00 00       	jmp    0x4aa830
  4aa6f2:	e8 69 34 fa ff       	call   0x44db60
  4aa6f7:	6a 00                	push   0x0
  4aa6f9:	6a 00                	push   0x0
  4aa6fb:	68 98 db 5c 00       	push   0x5cdb98
  4aa700:	e8 7b c3 07 00       	call   0x526a80
  4aa705:	83 c4 0c             	add    esp,0xc
  4aa708:	f6 05 6c c6 89 00 08 	test   BYTE PTR ds:0x89c66c,0x8
  4aa70f:	0f 84 04 01 00 00    	je     0x4aa819
  4aa715:	80 3d 78 db 5c 00 00 	cmp    BYTE PTR ds:0x5cdb78,0x0
  4aa71c:	a1 b5 c6 89 00       	mov    eax,ds:0x89c6b5
  4aa721:	0f 85 e2 00 00 00    	jne    0x4aa809
  4aa727:	c7 05 b5 c6 89 00 00 	mov    DWORD PTR ds:0x89c6b5,0x0
  4aa72e:	00 00 00 
  4aa731:	81 25 69 c6 89 00 ff 	and    DWORD PTR ds:0x89c669,0xf7ffffff
  4aa738:	ff ff f7 
  4aa73b:	09 05 b1 c6 89 00    	or     DWORD PTR ds:0x89c6b1,eax
  4aa741:	b8 00 00 00 10       	mov    eax,0x10000000
  4aa746:	85 05 69 c6 89 00    	test   DWORD PTR ds:0x89c669,eax
  4aa74c:	0f 85 c7 00 00 00    	jne    0x4aa819
  4aa752:	09 05 69 c6 89 00    	or     DWORD PTR ds:0x89c669,eax
  4aa758:	8d 44 24 08          	lea    eax,[esp+0x8]
  4aa75c:	50                   	push   eax
  4aa75d:	e8 ae c4 07 00       	call   0x526c10
  4aa762:	83 c4 04             	add    esp,0x4
  4aa765:	85 c0                	test   eax,eax
  4aa767:	75 ef                	jne    0x4aa758
  4aa769:	bf 28 e9 98 00       	mov    edi,0x98e928
  4aa76e:	33 c0                	xor    eax,eax
  4aa770:	b9 40 00 00 00       	mov    ecx,0x40
  4aa775:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4aa777:	bf 91 45 98 00       	mov    edi,0x984591
  4aa77c:	b9 40 00 00 00       	mov    ecx,0x40
  4aa781:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4aa783:	bf 91 46 98 00       	mov    edi,0x984691
  4aa788:	b9 40 00 00 00       	mov    ecx,0x40
  4aa78d:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4aa78f:	a3 60 45 98 00       	mov    ds:0x984560,eax
  4aa794:	a3 68 45 98 00       	mov    ds:0x984568,eax
  4aa799:	a3 64 45 98 00       	mov    ds:0x984564,eax
  4aa79e:	a3 6c 45 98 00       	mov    ds:0x98456c,eax
  4aa7a3:	a3 74 45 98 00       	mov    ds:0x984574,eax
  4aa7a8:	a3 70 45 98 00       	mov    ds:0x984570,eax
  4aa7ad:	80 3d e7 c6 89 00 07 	cmp    BYTE PTR ds:0x89c6e7,0x7
  4aa7b4:	75 0a                	jne    0x4aa7c0
  4aa7b6:	e8 95 e9 00 00       	call   0x4b9150
  4aa7bb:	e8 10 fe 00 00       	call   0x4ba5d0
  4aa7c0:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4aa7c7:	8b c8                	mov    ecx,eax
  4aa7c9:	8d 14 80             	lea    edx,[eax+eax*4]
  4aa7cc:	8d 04 51             	lea    eax,[ecx+edx*2]
  4aa7cf:	8d 1c c0             	lea    ebx,[eax+eax*8]
  4aa7d2:	8d 14 d9             	lea    edx,[ecx+ebx*8]
  4aa7d5:	33 db                	xor    ebx,ebx
  4aa7d7:	8d 04 91             	lea    eax,[ecx+edx*4]
  4aa7da:	05 c8 d1 89 00       	add    eax,0x89d1c8
  4aa7df:	50                   	push   eax
  4aa7e0:	53                   	push   ebx
  4aa7e1:	e8 6a fd fc ff       	call   0x47a550
  4aa7e6:	83 c4 08             	add    esp,0x8
  4aa7e9:	88 1d 10 e9 98 00    	mov    BYTE PTR ds:0x98e910,bl
  4aa7ef:	66 81 25 08 e9 98 00 	and    WORD PTR ds:0x98e908,0xfbff
  4aa7f6:	ff fb 
  4aa7f8:	66 81 25 08 e9 98 00 	and    WORD PTR ds:0x98e908,0xf7ff
  4aa7ff:	ff f7 
  4aa801:	88 1d 6c ce 89 00    	mov    BYTE PTR ds:0x89ce6c,bl
  4aa807:	eb 10                	jmp    0x4aa819
  4aa809:	81 0d 69 c6 89 00 00 	or     DWORD PTR ds:0x89c669,0x8000000
  4aa810:	00 00 08 
  4aa813:	09 05 b5 c6 89 00    	or     DWORD PTR ds:0x89c6b5,eax
  4aa819:	f6 05 6c c6 89 00 04 	test   BYTE PTR ds:0x89c66c,0x4
  4aa820:	74 0e                	je     0x4aa830
  4aa822:	a1 b5 c6 89 00       	mov    eax,ds:0x89c6b5
  4aa827:	50                   	push   eax
  4aa828:	e8 93 49 00 00       	call   0x4af1c0
  4aa82d:	83 c4 04             	add    esp,0x4
  4aa830:	66 81 25 46 f7 98 00 	and    WORD PTR ds:0x98f746,0xbfff
  4aa837:	ff bf 
  4aa839:	6a 02                	push   0x2
  4aa83b:	e8 30 6b fa ff       	call   0x451370
  4aa840:	83 c4 04             	add    esp,0x4
  4aa843:	85 c0                	test   eax,eax
  4aa845:	74 10                	je     0x4aa857
  4aa847:	83 3d 60 45 98 00 00 	cmp    DWORD PTR ds:0x984560,0x0
  4aa84e:	74 07                	je     0x4aa857
  4aa850:	e8 ab 41 fb ff       	call   0x45ea00
  4aa855:	eb 1c                	jmp    0x4aa873
  4aa857:	6a 04                	push   0x4
  4aa859:	e8 12 6b fa ff       	call   0x451370
  4aa85e:	83 c4 04             	add    esp,0x4
  4aa861:	85 c0                	test   eax,eax
  4aa863:	74 0e                	je     0x4aa873
  4aa865:	83 3d 60 45 98 00 00 	cmp    DWORD PTR ds:0x984560,0x0
  4aa86c:	74 05                	je     0x4aa873
  4aa86e:	e8 cd c2 fd ff       	call   0x486b40
  4aa873:	81 25 61 c6 89 00 ff 	and    DWORD PTR ds:0x89c661,0xfffff7ff
  4aa87a:	f7 ff ff 
  4aa87d:	33 c0                	xor    eax,eax
  4aa87f:	a3 98 48 98 00       	mov    ds:0x984898,eax
  4aa884:	a3 60 45 98 00       	mov    ds:0x984560,eax
  4aa889:	a3 68 45 98 00       	mov    ds:0x984568,eax
  4aa88e:	a3 64 45 98 00       	mov    ds:0x984564,eax
  4aa893:	a3 6c 45 98 00       	mov    ds:0x98456c,eax
  4aa898:	a3 74 45 98 00       	mov    ds:0x984574,eax
  4aa89d:	a3 70 45 98 00       	mov    ds:0x984570,eax
  4aa8a2:	5f                   	pop    edi
  4aa8a3:	5b                   	pop    ebx
  4aa8a4:	83 c4 0c             	add    esp,0xc
  4aa8a7:	c3                   	ret
  4aa8a8:	cc                   	int3
  4aa8a9:	cc                   	int3
  4aa8aa:	cc                   	int3
  4aa8ab:	cc                   	int3
  4aa8ac:	cc                   	int3
  4aa8ad:	cc                   	int3
  4aa8ae:	cc                   	int3
  4aa8af:	cc                   	int3
