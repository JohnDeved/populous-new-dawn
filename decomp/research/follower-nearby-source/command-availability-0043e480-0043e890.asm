
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0043e480 <.text+0x3d480>:
  43e480:	83 ec 10             	sub    esp,0x10
  43e483:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  43e48a:	c6 44 24 03 00       	mov    BYTE PTR [esp+0x3],0x0
  43e48f:	53                   	push   ebx
  43e490:	56                   	push   esi
  43e491:	57                   	push   edi
  43e492:	55                   	push   ebp
  43e493:	0f 85 88 01 00 00    	jne    0x43e621
  43e499:	c7 44 24 18 00 00 00 	mov    DWORD PTR [esp+0x18],0x0
  43e4a0:	00 
  43e4a1:	c6 44 24 13 01       	mov    BYTE PTR [esp+0x13],0x1
  43e4a6:	80 3d c0 ea 96 00 00 	cmp    BYTE PTR ds:0x96eac0,0x0
  43e4ad:	ba d3 79 89 00       	mov    edx,0x8979d3
  43e4b2:	0f 86 9f 00 00 00    	jbe    0x43e557
  43e4b8:	c7 44 24 14 e8 dd 89 	mov    DWORD PTR [esp+0x14],0x89dde8
  43e4bf:	00 
  43e4c0:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  43e4c5:	0f 84 8c 00 00 00    	je     0x43e557
  43e4cb:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  43e4cf:	80 38 00             	cmp    BYTE PTR [eax],0x0
  43e4d2:	0f bf 42 02          	movsx  eax,WORD PTR [edx+0x2]
  43e4d6:	75 0d                	jne    0x43e4e5
  43e4d8:	8d 0c 40             	lea    ecx,[eax+eax*2]
  43e4db:	8d 1c 89             	lea    ebx,[ecx+ecx*4]
  43e4de:	c6 44 13 12 00       	mov    BYTE PTR [ebx+edx*1+0x12],0x0
  43e4e3:	eb 4f                	jmp    0x43e534
  43e4e5:	0f bf 3a             	movsx  edi,WORD PTR [edx]
  43e4e8:	2b f8                	sub    edi,eax
  43e4ea:	79 03                	jns    0x43e4ef
  43e4ec:	83 c7 64             	add    edi,0x64
  43e4ef:	33 f6                	xor    esi,esi
  43e4f1:	32 c9                	xor    cl,cl
  43e4f3:	8d 04 40             	lea    eax,[eax+eax*2]
  43e4f6:	85 ff                	test   edi,edi
  43e4f8:	8d 2c 80             	lea    ebp,[eax+eax*4]
  43e4fb:	8d 42 06             	lea    eax,[edx+0x6]
  43e4fe:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  43e502:	8d 5c 15 06          	lea    ebx,[ebp+edx*1+0x6]
  43e506:	8d 82 e2 05 00 00    	lea    eax,[edx+0x5e2]
  43e50c:	7e 1d                	jle    0x43e52b
  43e50e:	84 c9                	test   cl,cl
  43e510:	75 22                	jne    0x43e534
  43e512:	3b c3                	cmp    eax,ebx
  43e514:	77 04                	ja     0x43e51a
  43e516:	8b 5c 24 1c          	mov    ebx,DWORD PTR [esp+0x1c]
  43e51a:	8b 2d 84 d1 89 00    	mov    ebp,DWORD PTR ds:0x89d184
  43e520:	39 2b                	cmp    DWORD PTR [ebx],ebp
  43e522:	75 02                	jne    0x43e526
  43e524:	b1 01                	mov    cl,0x1
  43e526:	46                   	inc    esi
  43e527:	3b fe                	cmp    edi,esi
  43e529:	7f e3                	jg     0x43e50e
  43e52b:	84 c9                	test   cl,cl
  43e52d:	75 05                	jne    0x43e534
  43e52f:	c6 44 24 13 00       	mov    BYTE PTR [esp+0x13],0x0
  43e534:	81 c2 e2 05 00 00    	add    edx,0x5e2
  43e53a:	33 c0                	xor    eax,eax
  43e53c:	a0 c0 ea 96 00       	mov    al,ds:0x96eac0
  43e541:	ff 44 24 18          	inc    DWORD PTR [esp+0x18]
  43e545:	81 44 24 14 65 0c 00 	add    DWORD PTR [esp+0x14],0xc65
  43e54c:	00 
  43e54d:	3b 44 24 18          	cmp    eax,DWORD PTR [esp+0x18]
  43e551:	0f 8f 69 ff ff ff    	jg     0x43e4c0
  43e557:	33 db                	xor    ebx,ebx
  43e559:	38 5c 24 13          	cmp    BYTE PTR [esp+0x13],bl
  43e55d:	0f 84 14 03 00 00    	je     0x43e877
  43e563:	be d3 79 89 00       	mov    esi,0x8979d3
  43e568:	38 1d c0 ea 96 00    	cmp    BYTE PTR ds:0x96eac0,bl
  43e56e:	76 63                	jbe    0x43e5d3
  43e570:	b9 8c d1 89 00       	mov    ecx,0x89d18c
  43e575:	33 c0                	xor    eax,eax
  43e577:	0f bf 7e 02          	movsx  edi,WORD PTR [esi+0x2]
  43e57b:	8d 14 7f             	lea    edx,[edi+edi*2]
  43e57e:	8d 3c 92             	lea    edi,[edx+edx*4]
  43e581:	03 fe                	add    edi,esi
  43e583:	8b 57 06             	mov    edx,DWORD PTR [edi+0x6]
  43e586:	83 c7 06             	add    edi,0x6
  43e589:	89 11                	mov    DWORD PTR [ecx],edx
  43e58b:	8b 6f 04             	mov    ebp,DWORD PTR [edi+0x4]
  43e58e:	89 69 04             	mov    DWORD PTR [ecx+0x4],ebp
  43e591:	8b 57 08             	mov    edx,DWORD PTR [edi+0x8]
  43e594:	89 51 08             	mov    DWORD PTR [ecx+0x8],edx
  43e597:	66 8b 6f 0c          	mov    bp,WORD PTR [edi+0xc]
  43e59b:	66 89 69 0c          	mov    WORD PTR [ecx+0xc],bp
  43e59f:	8a 57 0e             	mov    dl,BYTE PTR [edi+0xe]
  43e5a2:	88 51 0e             	mov    BYTE PTR [ecx+0xe],dl
  43e5a5:	66 8b 56 02          	mov    dx,WORD PTR [esi+0x2]
  43e5a9:	66 42                	inc    dx
  43e5ab:	66 89 56 02          	mov    WORD PTR [esi+0x2],dx
  43e5af:	66 83 fa 64          	cmp    dx,0x64
  43e5b3:	7c 04                	jl     0x43e5b9
  43e5b5:	66 89 46 02          	mov    WORD PTR [esi+0x2],ax
  43e5b9:	66 89 46 04          	mov    WORD PTR [esi+0x4],ax
  43e5bd:	83 c1 0f             	add    ecx,0xf
  43e5c0:	43                   	inc    ebx
  43e5c1:	81 c6 e2 05 00 00    	add    esi,0x5e2
  43e5c7:	33 d2                	xor    edx,edx
  43e5c9:	8a 15 c0 ea 96 00    	mov    dl,BYTE PTR ds:0x96eac0
  43e5cf:	3b d3                	cmp    edx,ebx
  43e5d1:	7f a4                	jg     0x43e577
  43e5d3:	f6 05 6b c6 89 00 40 	test   BYTE PTR ds:0x89c66b,0x40
  43e5da:	74 1c                	je     0x43e5f8
  43e5dc:	a1 d3 56 89 00       	mov    eax,ds:0x8956d3
  43e5e1:	50                   	push   eax
  43e5e2:	6a 04                	push   0x4
  43e5e4:	6a 0f                	push   0xf
  43e5e6:	68 8c d1 89 00       	push   0x89d18c
  43e5eb:	e8 20 cc 11 00       	call   0x55b210
  43e5f0:	83 c4 10             	add    esp,0x10
  43e5f3:	e9 79 02 00 00       	jmp    0x43e871
  43e5f8:	f6 05 6b c6 89 00 80 	test   BYTE PTR ds:0x89c66b,0x80
  43e5ff:	0f 84 6c 02 00 00    	je     0x43e871
  43e605:	a1 d3 56 89 00       	mov    eax,ds:0x8956d3
  43e60a:	50                   	push   eax
  43e60b:	6a 04                	push   0x4
  43e60d:	6a 0f                	push   0xf
  43e60f:	68 8c d1 89 00       	push   0x89d18c
  43e614:	e8 47 c7 11 00       	call   0x55ad60
  43e619:	83 c4 10             	add    esp,0x10
  43e61c:	e9 50 02 00 00       	jmp    0x43e871
  43e621:	0f be 15 f0 c6 89 00 	movsx  edx,BYTE PTR ds:0x89c6f0
  43e628:	33 f6                	xor    esi,esi
  43e62a:	8d 04 d2             	lea    eax,[edx+edx*8]
  43e62d:	8d 0c 42             	lea    ecx,[edx+eax*2]
  43e630:	8d 04 89             	lea    eax,[ecx+ecx*4]
  43e633:	2b c2                	sub    eax,edx
  43e635:	8d 04 c2             	lea    eax,[edx+eax*8]
  43e638:	8d 14 52             	lea    edx,[edx+edx*2]
  43e63b:	03 c0                	add    eax,eax
  43e63d:	8d 14 92             	lea    edx,[edx+edx*4]
  43e640:	0f bf 88 d5 79 89 00 	movsx  ecx,WORD PTR [eax+0x8979d5]
  43e647:	81 c2 8c d1 89 00    	add    edx,0x89d18c
  43e64d:	8d 1c 49             	lea    ebx,[ecx+ecx*2]
  43e650:	8d 0c 9b             	lea    ecx,[ebx+ebx*4]
  43e653:	03 c8                	add    ecx,eax
  43e655:	81 c1 d9 79 89 00    	add    ecx,0x8979d9
  43e65b:	8b 01                	mov    eax,DWORD PTR [ecx]
  43e65d:	8b 59 04             	mov    ebx,DWORD PTR [ecx+0x4]
  43e660:	8b 69 08             	mov    ebp,DWORD PTR [ecx+0x8]
  43e663:	89 02                	mov    DWORD PTR [edx],eax
  43e665:	66 8b 41 0c          	mov    ax,WORD PTR [ecx+0xc]
  43e669:	89 5a 04             	mov    DWORD PTR [edx+0x4],ebx
  43e66c:	8a 49 0e             	mov    cl,BYTE PTR [ecx+0xe]
  43e66f:	89 6a 08             	mov    DWORD PTR [edx+0x8],ebp
  43e672:	80 3d 9d 56 89 00 00 	cmp    BYTE PTR ds:0x89569d,0x0
  43e679:	66 89 42 0c          	mov    WORD PTR [edx+0xc],ax
  43e67d:	88 4a 0e             	mov    BYTE PTR [edx+0xe],cl
  43e680:	0f 84 3e 01 00 00    	je     0x43e7c4
  43e686:	f6 05 a4 5d 89 00 02 	test   BYTE PTR ds:0x895da4,0x2
  43e68d:	74 2d                	je     0x43e6bc
  43e68f:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  43e696:	8d 0c 40             	lea    ecx,[eax+eax*2]
  43e699:	8d 84 89 8c d1 89 00 	lea    eax,[ecx+ecx*4+0x89d18c]
  43e6a0:	c6 40 0e 00          	mov    BYTE PTR [eax+0xe],0x0
  43e6a4:	f6 05 84 d1 89 00 1f 	test   BYTE PTR ds:0x89d184,0x1f
  43e6ab:	75 0b                	jne    0x43e6b8
  43e6ad:	8a 0d 78 d1 89 00    	mov    cl,BYTE PTR ds:0x89d178
  43e6b3:	88 48 0e             	mov    BYTE PTR [eax+0xe],cl
  43e6b6:	eb 04                	jmp    0x43e6bc
  43e6b8:	c6 40 0e 00          	mov    BYTE PTR [eax+0xe],0x0
  43e6bc:	33 d2                	xor    edx,edx
  43e6be:	b9 98 d1 89 00       	mov    ecx,0x89d198
  43e6c3:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  43e6ca:	3b d0                	cmp    edx,eax
  43e6cc:	74 03                	je     0x43e6d1
  43e6ce:	c6 01 00             	mov    BYTE PTR [ecx],0x0
  43e6d1:	83 c1 0f             	add    ecx,0xf
  43e6d4:	42                   	inc    edx
  43e6d5:	81 f9 d4 d1 89 00    	cmp    ecx,0x89d1d4
  43e6db:	72 ed                	jb     0x43e6ca
  43e6dd:	33 f6                	xor    esi,esi
  43e6df:	e8 2c 5f fd ff       	call   0x414610
  43e6e4:	68 fe 4c 89 00       	push   0x894cfe
  43e6e9:	8b 0d 38 9c 59 00    	mov    ecx,DWORD PTR ds:0x599c38
  43e6ef:	bb bf 56 89 00       	mov    ebx,0x8956bf
  43e6f4:	ff 15 70 c9 d0 00    	call   DWORD PTR ds:0xd0c970
  43e6fa:	bf fe 4c 89 00       	mov    edi,0x894cfe
  43e6ff:	e8 4c 7e fd ff       	call   0x416550
  43e704:	8b 2d 8c c9 d0 00    	mov    ebp,DWORD PTR ds:0xd0c98c
  43e70a:	80 be 26 4e 89 00 00 	cmp    BYTE PTR [esi+0x894e26],0x0
  43e711:	74 05                	je     0x43e718
  43e713:	f6 07 0f             	test   BYTE PTR [edi],0xf
  43e716:	74 1c                	je     0x43e734
  43e718:	39 35 f5 4c 89 00    	cmp    DWORD PTR ds:0x894cf5,esi
  43e71e:	74 41                	je     0x43e761
  43e720:	8b 0d 38 9c 59 00    	mov    ecx,DWORD PTR ds:0x599c38
  43e726:	ff d5                	call   ebp
  43e728:	8b 0b                	mov    ecx,DWORD PTR [ebx]
  43e72a:	81 c1 60 ea 00 00    	add    ecx,0xea60
  43e730:	3b c1                	cmp    eax,ecx
  43e732:	72 2d                	jb     0x43e761
  43e734:	33 c9                	xor    ecx,ecx
  43e736:	33 c0                	xor    eax,eax
  43e738:	8a 81 ab 56 89 00    	mov    al,BYTE PTR [ecx+0x8956ab]
  43e73e:	3b c6                	cmp    eax,esi
  43e740:	74 08                	je     0x43e74a
  43e742:	41                   	inc    ecx
  43e743:	83 f9 04             	cmp    ecx,0x4
  43e746:	7c ee                	jl     0x43e736
  43e748:	eb 17                	jmp    0x43e761
  43e74a:	8d 04 49             	lea    eax,[ecx+ecx*2]
  43e74d:	8d 04 80             	lea    eax,[eax+eax*4]
  43e750:	c6 80 98 d1 89 00 1c 	mov    BYTE PTR [eax+0x89d198],0x1c
  43e757:	c7 80 90 d1 89 00 04 	mov    DWORD PTR [eax+0x89d190],0x4
  43e75e:	00 00 00 
  43e761:	83 c3 04             	add    ebx,0x4
  43e764:	83 c7 2a             	add    edi,0x2a
  43e767:	46                   	inc    esi
  43e768:	81 ff a6 4d 89 00    	cmp    edi,0x894da6
  43e76e:	72 9a                	jb     0x43e70a
  43e770:	33 c0                	xor    eax,eax
  43e772:	b9 fe 4c 89 00       	mov    ecx,0x894cfe
  43e777:	8a 11                	mov    dl,BYTE PTR [ecx]
  43e779:	83 c1 2a             	add    ecx,0x2a
  43e77c:	80 e2 0f             	and    dl,0xf
  43e77f:	40                   	inc    eax
  43e780:	81 f9 a6 4d 89 00    	cmp    ecx,0x894da6
  43e786:	88 90 25 4e 89 00    	mov    BYTE PTR [eax+0x894e25],dl
  43e78c:	72 e9                	jb     0x43e777
  43e78e:	a1 84 d1 89 00       	mov    eax,ds:0x89d184
  43e793:	50                   	push   eax
  43e794:	e8 27 5b fd ff       	call   0x4142c0
  43e799:	83 c4 04             	add    esp,0x4
  43e79c:	f6 05 6b c6 89 00 80 	test   BYTE PTR ds:0x89c66b,0x80
  43e7a3:	74 05                	je     0x43e7aa
  43e7a5:	e8 46 7b fd ff       	call   0x4162f0
  43e7aa:	f6 05 a4 5d 89 00 02 	test   BYTE PTR ds:0x895da4,0x2
  43e7b1:	74 05                	je     0x43e7b8
  43e7b3:	e8 68 67 fd ff       	call   0x414f20
  43e7b8:	be 01 00 00 00       	mov    esi,0x1
  43e7bd:	e8 fe 5b fd ff       	call   0x4143c0
  43e7c2:	eb 77                	jmp    0x43e83b
  43e7c4:	a1 19 58 89 00       	mov    eax,ds:0x895819
  43e7c9:	39 05 84 d1 89 00    	cmp    DWORD PTR ds:0x89d184,eax
  43e7cf:	74 3b                	je     0x43e80c
  43e7d1:	f6 05 a4 5d 89 00 02 	test   BYTE PTR ds:0x895da4,0x2
  43e7d8:	74 2d                	je     0x43e807
  43e7da:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  43e7e1:	8d 0c 40             	lea    ecx,[eax+eax*2]
  43e7e4:	8d 84 89 8c d1 89 00 	lea    eax,[ecx+ecx*4+0x89d18c]
  43e7eb:	c6 40 0e 00          	mov    BYTE PTR [eax+0xe],0x0
  43e7ef:	f6 05 84 d1 89 00 1f 	test   BYTE PTR ds:0x89d184,0x1f
  43e7f6:	75 0b                	jne    0x43e803
  43e7f8:	8a 0d 78 d1 89 00    	mov    cl,BYTE PTR ds:0x89d178
  43e7fe:	88 48 0e             	mov    BYTE PTR [eax+0xe],cl
  43e801:	eb 04                	jmp    0x43e807
  43e803:	c6 40 0e 00          	mov    BYTE PTR [eax+0xe],0x0
  43e807:	e8 04 60 fd ff       	call   0x414810
  43e80c:	a1 84 d1 89 00       	mov    eax,ds:0x89d184
  43e811:	50                   	push   eax
  43e812:	a3 19 58 89 00       	mov    ds:0x895819,eax
  43e817:	68 8c d1 89 00       	push   0x89d18c
  43e81c:	e8 ff 61 fd ff       	call   0x414a20
  43e821:	83 c4 08             	add    esp,0x8
  43e824:	85 c0                	test   eax,eax
  43e826:	74 13                	je     0x43e83b
  43e828:	f6 05 a4 5d 89 00 02 	test   BYTE PTR ds:0x895da4,0x2
  43e82f:	be 01 00 00 00       	mov    esi,0x1
  43e834:	74 05                	je     0x43e83b
  43e836:	e8 e5 66 fd ff       	call   0x414f20
  43e83b:	85 f6                	test   esi,esi
  43e83d:	74 38                	je     0x43e877
  43e83f:	be d3 79 89 00       	mov    esi,0x8979d3
  43e844:	ba 04 00 00 00       	mov    edx,0x4
  43e849:	33 c0                	xor    eax,eax
  43e84b:	66 89 46 04          	mov    WORD PTR [esi+0x4],ax
  43e84f:	66 8b 4e 02          	mov    cx,WORD PTR [esi+0x2]
  43e853:	66 41                	inc    cx
  43e855:	66 89 4e 02          	mov    WORD PTR [esi+0x2],cx
  43e859:	66 83 f9 64          	cmp    cx,0x64
  43e85d:	7c 04                	jl     0x43e863
  43e85f:	66 89 46 02          	mov    WORD PTR [esi+0x2],ax
  43e863:	81 c6 e2 05 00 00    	add    esi,0x5e2
  43e869:	4a                   	dec    edx
  43e86a:	75 df                	jne    0x43e84b
  43e86c:	c6 44 24 13 01       	mov    BYTE PTR [esp+0x13],0x1
  43e871:	ff 05 84 d1 89 00    	inc    DWORD PTR ds:0x89d184
  43e877:	8a 44 24 13          	mov    al,BYTE PTR [esp+0x13]
  43e87b:	5d                   	pop    ebp
  43e87c:	5f                   	pop    edi
  43e87d:	5e                   	pop    esi
  43e87e:	5b                   	pop    ebx
  43e87f:	83 c4 10             	add    esp,0x10
  43e882:	c3                   	ret
  43e883:	cc                   	int3
  43e884:	cc                   	int3
  43e885:	cc                   	int3
  43e886:	cc                   	int3
  43e887:	cc                   	int3
  43e888:	cc                   	int3
  43e889:	cc                   	int3
  43e88a:	cc                   	int3
  43e88b:	cc                   	int3
  43e88c:	cc                   	int3
  43e88d:	cc                   	int3
  43e88e:	cc                   	int3
  43e88f:	cc                   	int3
