
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0047e3e0 <.text+0x7d3e0>:
  47e3e0:	56                   	push   esi
  47e3e1:	33 f6                	xor    esi,esi
  47e3e3:	39 35 e8 e2 59 00    	cmp    DWORD PTR ds:0x59e2e8,esi
  47e3e9:	0f 84 e0 00 00 00    	je     0x47e4cf
  47e3ef:	89 35 e8 e2 59 00    	mov    DWORD PTR ds:0x59e2e8,esi
  47e3f5:	e8 06 4e 02 00       	call   0x4a3200
  47e3fa:	e8 21 59 02 00       	call   0x4a3d20
  47e3ff:	68 8c e3 59 00       	push   0x59e38c
  47e404:	68 23 cd 89 00       	push   0x89cd23
  47e409:	e8 a2 1d 08 00       	call   0x5001b0
  47e40e:	83 c4 08             	add    esp,0x8
  47e411:	68 80 5a 98 00       	push   0x985a80
  47e416:	56                   	push   esi
  47e417:	68 23 cd 89 00       	push   0x89cd23
  47e41c:	e8 5f 8f 0a 00       	call   0x527380
  47e421:	66 a1 cf c6 89 00    	mov    ax,ds:0x89c6cf
  47e427:	83 c4 0c             	add    esp,0xc
  47e42a:	66 c1 f8 01          	sar    ax,0x1
  47e42e:	8b 15 8c 5a 98 00    	mov    edx,DWORD PTR ds:0x985a8c
  47e434:	0f bf c8             	movsx  ecx,ax
  47e437:	66 8b 42 04          	mov    ax,WORD PTR [edx+0x4]
  47e43b:	66 c1 e8 01          	shr    ax,0x1
  47e43f:	0f b7 d0             	movzx  edx,ax
  47e442:	2b ca                	sub    ecx,edx
  47e444:	33 d2                	xor    edx,edx
  47e446:	89 0d 98 5a 98 00    	mov    DWORD PTR ds:0x985a98,ecx
  47e44c:	8b 0d 8c 5a 98 00    	mov    ecx,DWORD PTR ds:0x985a8c
  47e452:	0f bf 05 d1 c6 89 00 	movsx  eax,WORD PTR ds:0x89c6d1
  47e459:	66 8b 51 06          	mov    dx,WORD PTR [ecx+0x6]
  47e45d:	b9 00 00 00 80       	mov    ecx,0x80000000
  47e462:	2b c2                	sub    eax,edx
  47e464:	89 35 a0 5a 98 00    	mov    DWORD PTR ds:0x985aa0,esi
  47e46a:	a3 9c 5a 98 00       	mov    ds:0x985a9c,eax
  47e46f:	a1 a0 5a 98 00       	mov    eax,ds:0x985aa0
  47e474:	ff 05 a0 5a 98 00    	inc    DWORD PTR ds:0x985aa0
  47e47a:	8d 14 c5 00 00 00 00 	lea    edx,[eax*8+0x0]
  47e481:	2b d0                	sub    edx,eax
  47e483:	39 0c 95 f8 df 59 00 	cmp    DWORD PTR [edx*4+0x59dff8],ecx
  47e48a:	75 e3                	jne    0x47e46f
  47e48c:	b9 f8 df 59 00       	mov    ecx,0x59dff8
  47e491:	33 d2                	xor    edx,edx
  47e493:	ff 0d a0 5a 98 00    	dec    DWORD PTR ds:0x985aa0
  47e499:	39 15 a0 5a 98 00    	cmp    DWORD PTR ds:0x985aa0,edx
  47e49f:	7e 2e                	jle    0x47e4cf
  47e4a1:	33 f6                	xor    esi,esi
  47e4a3:	a1 98 5a 98 00       	mov    eax,ds:0x985a98
  47e4a8:	48                   	dec    eax
  47e4a9:	01 41 04             	add    DWORD PTR [ecx+0x4],eax
  47e4ac:	a1 9c 5a 98 00       	mov    eax,ds:0x985a9c
  47e4b1:	48                   	dec    eax
  47e4b2:	01 41 08             	add    DWORD PTR [ecx+0x8],eax
  47e4b5:	83 39 02             	cmp    DWORD PTR [ecx],0x2
  47e4b8:	75 06                	jne    0x47e4c0
  47e4ba:	ff 49 04             	dec    DWORD PTR [ecx+0x4]
  47e4bd:	ff 49 08             	dec    DWORD PTR [ecx+0x8]
  47e4c0:	89 71 18             	mov    DWORD PTR [ecx+0x18],esi
  47e4c3:	42                   	inc    edx
  47e4c4:	83 c1 1c             	add    ecx,0x1c
  47e4c7:	3b 15 a0 5a 98 00    	cmp    edx,DWORD PTR ds:0x985aa0
  47e4cd:	7c d4                	jl     0x47e4a3
  47e4cf:	33 c0                	xor    eax,eax
  47e4d1:	5e                   	pop    esi
  47e4d2:	a3 b0 5a 98 00       	mov    ds:0x985ab0,eax
  47e4d7:	a3 ac 5a 98 00       	mov    ds:0x985aac,eax
  47e4dc:	83 0d f4 c9 5f 00 10 	or     DWORD PTR ds:0x5fc9f4,0x10
  47e4e3:	c3                   	ret
  47e4e4:	cc                   	int3
  47e4e5:	cc                   	int3
  47e4e6:	cc                   	int3
  47e4e7:	cc                   	int3
  47e4e8:	cc                   	int3
  47e4e9:	cc                   	int3
  47e4ea:	cc                   	int3
  47e4eb:	cc                   	int3
  47e4ec:	cc                   	int3
  47e4ed:	cc                   	int3
  47e4ee:	cc                   	int3
  47e4ef:	cc                   	int3
  47e4f0:	68 80 5a 98 00       	push   0x985a80
  47e4f5:	e8 f6 8f 0a 00       	call   0x5274f0
  47e4fa:	83 c4 04             	add    esp,0x4
  47e4fd:	c3                   	ret
  47e4fe:	cc                   	int3
  47e4ff:	cc                   	int3
  47e500:	f6 05 f4 c9 5f 00 04 	test   BYTE PTR ds:0x5fc9f4,0x4
  47e507:	75 1f                	jne    0x47e528
  47e509:	83 0d f4 c9 5f 00 04 	or     DWORD PTR ds:0x5fc9f4,0x4
  47e510:	c7 05 b0 5a 98 00 01 	mov    DWORD PTR ds:0x985ab0,0x1
  47e517:	00 00 00 
  47e51a:	6a 00                	push   0x0
  47e51c:	6a 00                	push   0x0
  47e51e:	6a 00                	push   0x0
  47e520:	e8 db e4 07 00       	call   0x4fca00
  47e525:	83 c4 0c             	add    esp,0xc
  47e528:	c3                   	ret
  47e529:	cc                   	int3
  47e52a:	cc                   	int3
  47e52b:	cc                   	int3
  47e52c:	cc                   	int3
  47e52d:	cc                   	int3
  47e52e:	cc                   	int3
  47e52f:	cc                   	int3
  47e530:	f6 05 f4 c9 5f 00 04 	test   BYTE PTR ds:0x5fc9f4,0x4
  47e537:	53                   	push   ebx
  47e538:	56                   	push   esi
  47e539:	57                   	push   edi
  47e53a:	55                   	push   ebp
  47e53b:	75 54                	jne    0x47e591
  47e53d:	8b 35 f4 c9 5f 00    	mov    esi,DWORD PTR ds:0x5fc9f4
  47e543:	e8 28 41 03 00       	call   0x4b2670
  47e548:	83 e6 10             	and    esi,0x10
  47e54b:	8b f8                	mov    edi,eax
  47e54d:	f6 05 b4 5a 98 00 01 	test   BYTE PTR ds:0x985ab4,0x1
  47e554:	75 0d                	jne    0x47e563
  47e556:	80 0d b4 5a 98 00 01 	or     BYTE PTR ds:0x985ab4,0x1
  47e55d:	89 3d f8 58 98 00    	mov    DWORD PTR ds:0x9858f8,edi
  47e563:	85 f6                	test   esi,esi
  47e565:	75 08                	jne    0x47e56f
  47e567:	39 3d f8 58 98 00    	cmp    DWORD PTR ds:0x9858f8,edi
  47e56d:	74 15                	je     0x47e584
  47e56f:	6a 00                	push   0x0
  47e571:	a1 8c 5a 98 00       	mov    eax,ds:0x985a8c
  47e576:	6a 00                	push   0x0
  47e578:	83 c0 60             	add    eax,0x60
  47e57b:	50                   	push   eax
  47e57c:	e8 7f e4 07 00       	call   0x4fca00
  47e581:	83 c4 0c             	add    esp,0xc
  47e584:	83 25 f4 c9 5f 00 ef 	and    DWORD PTR ds:0x5fc9f4,0xffffffef
  47e58b:	89 3d f8 58 98 00    	mov    DWORD PTR ds:0x9858f8,edi
  47e591:	f6 05 f4 c9 5f 00 20 	test   BYTE PTR ds:0x5fc9f4,0x20
  47e598:	0f 84 b4 00 00 00    	je     0x47e652
  47e59e:	bf f8 df 59 00       	mov    edi,0x59dff8
  47e5a3:	33 db                	xor    ebx,ebx
  47e5a5:	39 1d a0 5a 98 00    	cmp    DWORD PTR ds:0x985aa0,ebx
  47e5ab:	7e 67                	jle    0x47e614
  47e5ad:	be 09 a4 89 00       	mov    esi,0x89a409
  47e5b2:	66 8b 06             	mov    ax,WORD PTR [esi]
  47e5b5:	bd 00 00 00 00       	mov    ebp,0x0
  47e5ba:	a8 05                	test   al,0x5
  47e5bc:	74 05                	je     0x47e5c3
  47e5be:	bd 01 00 00 00       	mov    ebp,0x1
  47e5c3:	53                   	push   ebx
  47e5c4:	e8 77 78 00 00       	call   0x485e40
  47e5c9:	83 c4 04             	add    esp,0x4
  47e5cc:	85 ed                	test   ebp,ebp
  47e5ce:	75 04                	jne    0x47e5d4
  47e5d0:	85 c0                	test   eax,eax
  47e5d2:	74 2e                	je     0x47e602
  47e5d4:	83 7f 14 00          	cmp    DWORD PTR [edi+0x14],0x0
  47e5d8:	74 28                	je     0x47e602
  47e5da:	f6 05 f4 c9 5f 00 04 	test   BYTE PTR ds:0x5fc9f4,0x4
  47e5e1:	75 11                	jne    0x47e5f4
  47e5e3:	8d 43 01             	lea    eax,[ebx+0x1]
  47e5e6:	50                   	push   eax
  47e5e7:	e8 44 43 f9 ff       	call   0x412930
  47e5ec:	83 c4 04             	add    esp,0x4
  47e5ef:	a3 b0 13 5f 00       	mov    ds:0x5f13b0,eax
  47e5f4:	c7 47 18 01 00 00 00 	mov    DWORD PTR [edi+0x18],0x1
  47e5fb:	83 25 f4 c9 5f 00 df 	and    DWORD PTR ds:0x5fc9f4,0xffffffdf
  47e602:	81 c6 a4 00 00 00    	add    esi,0xa4
  47e608:	43                   	inc    ebx
  47e609:	83 c7 1c             	add    edi,0x1c
  47e60c:	39 1d a0 5a 98 00    	cmp    DWORD PTR ds:0x985aa0,ebx
  47e612:	7f 9e                	jg     0x47e5b2
  47e614:	a1 f4 c9 5f 00       	mov    eax,ds:0x5fc9f4
  47e619:	83 e0 04             	and    eax,0x4
  47e61c:	75 2d                	jne    0x47e64b
  47e61e:	83 3d ac 5a 98 00 00 	cmp    DWORD PTR ds:0x985aac,0x0
  47e625:	74 24                	je     0x47e64b
  47e627:	b9 01 00 00 00       	mov    ecx,0x1
  47e62c:	85 c0                	test   eax,eax
  47e62e:	89 0d b0 5a 98 00    	mov    DWORD PTR ds:0x985ab0,ecx
  47e634:	75 15                	jne    0x47e64b
  47e636:	83 0d f4 c9 5f 00 04 	or     DWORD PTR ds:0x5fc9f4,0x4
  47e63d:	6a 00                	push   0x0
  47e63f:	6a 00                	push   0x0
  47e641:	6a 00                	push   0x0
  47e643:	e8 b8 e3 07 00       	call   0x4fca00
  47e648:	83 c4 0c             	add    esp,0xc
  47e64b:	83 25 f4 c9 5f 00 df 	and    DWORD PTR ds:0x5fc9f4,0xffffffdf
  47e652:	5d                   	pop    ebp
  47e653:	5f                   	pop    edi
  47e654:	5e                   	pop    esi
  47e655:	5b                   	pop    ebx
  47e656:	c3                   	ret
  47e657:	cc                   	int3
  47e658:	cc                   	int3
  47e659:	cc                   	int3
  47e65a:	cc                   	int3
  47e65b:	cc                   	int3
  47e65c:	cc                   	int3
  47e65d:	cc                   	int3
  47e65e:	cc                   	int3
  47e65f:	cc                   	int3
  47e660:	81 ec 1c 02 00 00    	sub    esp,0x21c
  47e666:	c7 44 24 10 ff ff ff 	mov    DWORD PTR [esp+0x10],0xffffffff
  47e66d:	ff 
  47e66e:	53                   	push   ebx
  47e66f:	56                   	push   esi
  47e670:	57                   	push   edi
  47e671:	be f8 df 59 00       	mov    esi,0x59dff8
  47e676:	55                   	push   ebp
  47e677:	33 ff                	xor    edi,edi
  47e679:	e8 42 0c 00 00       	call   0x47f2c0
  47e67e:	39 3d a0 5a 98 00    	cmp    DWORD PTR ds:0x985aa0,edi
  47e684:	0f 8e 4a 01 00 00    	jle    0x47e7d4
  47e68a:	c7 44 24 28 09 a4 89 	mov    DWORD PTR [esp+0x28],0x89a409
  47e691:	00 
  47e692:	8b 44 24 28          	mov    eax,DWORD PTR [esp+0x28]
  47e696:	bb 00 00 00 00       	mov    ebx,0x0
  47e69b:	66 8b 00             	mov    ax,WORD PTR [eax]
  47e69e:	a8 05                	test   al,0x5
  47e6a0:	74 05                	je     0x47e6a7
  47e6a2:	bb 01 00 00 00       	mov    ebx,0x1
  47e6a7:	57                   	push   edi
  47e6a8:	e8 93 77 00 00       	call   0x485e40
  47e6ad:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  47e6b1:	83 c4 04             	add    esp,0x4
  47e6b4:	85 db                	test   ebx,ebx
  47e6b6:	75 08                	jne    0x47e6c0
  47e6b8:	85 c0                	test   eax,eax
  47e6ba:	0f 84 fc 00 00 00    	je     0x47e7bc
  47e6c0:	8b 06                	mov    eax,DWORD PTR [esi]
  47e6c2:	83 f8 01             	cmp    eax,0x1
  47e6c5:	74 0c                	je     0x47e6d3
  47e6c7:	83 f8 02             	cmp    eax,0x2
  47e6ca:	74 0e                	je     0x47e6da
  47e6cc:	b8 05 00 00 00       	mov    eax,0x5
  47e6d1:	eb 0c                	jmp    0x47e6df
  47e6d3:	b8 03 00 00 00       	mov    eax,0x3
  47e6d8:	eb 05                	jmp    0x47e6df
  47e6da:	b8 01 00 00 00       	mov    eax,0x1
  47e6df:	83 7c 24 1c 00       	cmp    DWORD PTR [esp+0x1c],0x0
  47e6e4:	74 01                	je     0x47e6e7
  47e6e6:	40                   	inc    eax
  47e6e7:	8b 6e 04             	mov    ebp,DWORD PTR [esi+0x4]
  47e6ea:	8b 5e 08             	mov    ebx,DWORD PTR [esi+0x8]
  47e6ed:	83 7e 18 00          	cmp    DWORD PTR [esi+0x18],0x0
  47e6f1:	74 09                	je     0x47e6fc
  47e6f3:	45                   	inc    ebp
  47e6f4:	43                   	inc    ebx
  47e6f5:	c7 46 18 00 00 00 00 	mov    DWORD PTR [esi+0x18],0x0
  47e6fc:	8d 0c c5 00 00 00 00 	lea    ecx,[eax*8+0x0]
  47e703:	50                   	push   eax
  47e704:	03 0d 8c 5a 98 00    	add    ecx,DWORD PTR ds:0x985a8c
  47e70a:	53                   	push   ebx
  47e70b:	89 4c 24 2c          	mov    DWORD PTR [esp+0x2c],ecx
  47e70f:	55                   	push   ebp
  47e710:	b9 78 59 98 00       	mov    ecx,0x985978
  47e715:	e8 a6 ae fa ff       	call   0x4295c0
  47e71a:	66 89 6c 24 10       	mov    WORD PTR [esp+0x10],bp
  47e71f:	8b 4c 24 24          	mov    ecx,DWORD PTR [esp+0x24]
  47e723:	66 8b 41 04          	mov    ax,WORD PTR [ecx+0x4]
  47e727:	66 03 c5             	add    ax,bp
  47e72a:	66 89 44 24 12       	mov    WORD PTR [esp+0x12],ax
  47e72f:	66 8b 41 06          	mov    ax,WORD PTR [ecx+0x6]
  47e733:	0f bf cd             	movsx  ecx,bp
  47e736:	66 89 5c 24 14       	mov    WORD PTR [esp+0x14],bx
  47e73b:	66 03 c3             	add    ax,bx
  47e73e:	3b 0d e0 c9 5f 00    	cmp    ecx,DWORD PTR ds:0x5fc9e0
  47e744:	66 89 44 24 16       	mov    WORD PTR [esp+0x16],ax
  47e749:	7d 2f                	jge    0x47e77a
  47e74b:	0f bf 44 24 12       	movsx  eax,WORD PTR [esp+0x12]
  47e750:	3b 05 e0 c9 5f 00    	cmp    eax,DWORD PTR ds:0x5fc9e0
  47e756:	7c 22                	jl     0x47e77a
  47e758:	0f bf c3             	movsx  eax,bx
  47e75b:	3b 05 e4 c9 5f 00    	cmp    eax,DWORD PTR ds:0x5fc9e4
  47e761:	7d 17                	jge    0x47e77a
  47e763:	0f bf 44 24 16       	movsx  eax,WORD PTR [esp+0x16]
  47e768:	3b 05 e4 c9 5f 00    	cmp    eax,DWORD PTR ds:0x5fc9e4
  47e76e:	7c 0a                	jl     0x47e77a
  47e770:	c7 44 24 18 01 00 00 	mov    DWORD PTR [esp+0x18],0x1
  47e777:	00 
  47e778:	eb 08                	jmp    0x47e782
  47e77a:	c7 44 24 18 00 00 00 	mov    DWORD PTR [esp+0x18],0x0
  47e781:	00 
  47e782:	8b 5c 24 14          	mov    ebx,DWORD PTR [esp+0x14]
  47e786:	8d 4c 24 10          	lea    ecx,[esp+0x10]
  47e78a:	8d 56 0c             	lea    edx,[esi+0xc]
  47e78d:	8b 01                	mov    eax,DWORD PTR [ecx]
  47e78f:	8b 49 08             	mov    ecx,DWORD PTR [ecx+0x8]
  47e792:	89 02                	mov    DWORD PTR [edx],eax
  47e794:	8d 47 01             	lea    eax,[edi+0x1]
  47e797:	89 5a 04             	mov    DWORD PTR [edx+0x4],ebx
  47e79a:	50                   	push   eax
  47e79b:	89 4a 08             	mov    DWORD PTR [edx+0x8],ecx
  47e79e:	e8 8d 41 f9 ff       	call   0x412930
  47e7a3:	83 c4 04             	add    esp,0x4
  47e7a6:	83 7e 14 00          	cmp    DWORD PTR [esi+0x14],0x0
  47e7aa:	74 10                	je     0x47e7bc
  47e7ac:	83 7c 24 1c 01       	cmp    DWORD PTR [esp+0x1c],0x1
  47e7b1:	1b c0                	sbb    eax,eax
  47e7b3:	05 d4 03 00 00       	add    eax,0x3d4
  47e7b8:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  47e7bc:	47                   	inc    edi
  47e7bd:	83 c6 1c             	add    esi,0x1c
  47e7c0:	81 44 24 28 a4 00 00 	add    DWORD PTR [esp+0x28],0xa4
  47e7c7:	00 
  47e7c8:	3b 3d a0 5a 98 00    	cmp    edi,DWORD PTR ds:0x985aa0
  47e7ce:	0f 8c be fe ff ff    	jl     0x47e692
  47e7d4:	b9 41 02 00 00       	mov    ecx,0x241
  47e7d9:	ba ae 01 00 00       	mov    edx,0x1ae
  47e7de:	66 89 4c 24 10       	mov    WORD PTR [esp+0x10],cx
  47e7e3:	a1 8c 5a 98 00       	mov    eax,ds:0x985a8c
  47e7e8:	66 8b 70 5c          	mov    si,WORD PTR [eax+0x5c]
  47e7ec:	83 c0 58             	add    eax,0x58
  47e7ef:	66 03 f1             	add    si,cx
  47e7f2:	66 8b 40 06          	mov    ax,WORD PTR [eax+0x6]
  47e7f6:	66 89 74 24 12       	mov    WORD PTR [esp+0x12],si
  47e7fb:	66 03 c2             	add    ax,dx
  47e7fe:	39 0d e0 c9 5f 00    	cmp    DWORD PTR ds:0x5fc9e0,ecx
  47e804:	66 89 54 24 14       	mov    WORD PTR [esp+0x14],dx
  47e809:	66 89 44 24 16       	mov    WORD PTR [esp+0x16],ax
  47e80e:	7e 2c                	jle    0x47e83c
  47e810:	0f bf 44 24 12       	movsx  eax,WORD PTR [esp+0x12]
  47e815:	3b 05 e0 c9 5f 00    	cmp    eax,DWORD PTR ds:0x5fc9e0
  47e81b:	7c 1f                	jl     0x47e83c
  47e81d:	39 15 e4 c9 5f 00    	cmp    DWORD PTR ds:0x5fc9e4,edx
  47e823:	7e 17                	jle    0x47e83c
  47e825:	0f bf 44 24 16       	movsx  eax,WORD PTR [esp+0x16]
  47e82a:	3b 05 e4 c9 5f 00    	cmp    eax,DWORD PTR ds:0x5fc9e4
  47e830:	7c 0a                	jl     0x47e83c
  47e832:	c7 44 24 18 01 00 00 	mov    DWORD PTR [esp+0x18],0x1
  47e839:	00 
  47e83a:	eb 08                	jmp    0x47e844
  47e83c:	c7 44 24 18 00 00 00 	mov    DWORD PTR [esp+0x18],0x0
  47e843:	00 
  47e844:	8b 5c 24 14          	mov    ebx,DWORD PTR [esp+0x14]
  47e848:	8b 6c 24 18          	mov    ebp,DWORD PTR [esp+0x18]
  47e84c:	8d 74 24 10          	lea    esi,[esp+0x10]
  47e850:	bf a4 5a 98 00       	mov    edi,0x985aa4
  47e855:	8b 06                	mov    eax,DWORD PTR [esi]
  47e857:	89 07                	mov    DWORD PTR [edi],eax
  47e859:	89 5f 04             	mov    DWORD PTR [edi+0x4],ebx
  47e85c:	89 6f 08             	mov    DWORD PTR [edi+0x8],ebp
  47e85f:	83 3d ac 5a 98 00 00 	cmp    DWORD PTR ds:0x985aac,0x0
  47e866:	75 09                	jne    0x47e871
  47e868:	83 3d b0 5a 98 00 00 	cmp    DWORD PTR ds:0x985ab0,0x0
  47e86f:	74 33                	je     0x47e8a4
  47e871:	83 3d b0 5a 98 00 00 	cmp    DWORD PTR ds:0x985ab0,0x0
  47e878:	74 14                	je     0x47e88e
  47e87a:	b9 42 02 00 00       	mov    ecx,0x242
  47e87f:	ba af 01 00 00       	mov    edx,0x1af
  47e884:	c7 05 b0 5a 98 00 00 	mov    DWORD PTR ds:0x985ab0,0x0
  47e88b:	00 00 00 
  47e88e:	6a 0a                	push   0xa
  47e890:	52                   	push   edx
  47e891:	51                   	push   ecx
  47e892:	b9 78 59 98 00       	mov    ecx,0x985978
  47e897:	e8 24 ad fa ff       	call   0x4295c0
  47e89c:	c7 44 24 20 d2 03 00 	mov    DWORD PTR [esp+0x20],0x3d2
  47e8a3:	00 
  47e8a4:	e8 67 49 01 00       	call   0x493210
  47e8a9:	85 c0                	test   eax,eax
  47e8ab:	75 0f                	jne    0x47e8bc
  47e8ad:	68 98 59 98 00       	push   0x985998
  47e8b2:	e8 09 af fa ff       	call   0x4297c0
  47e8b7:	83 c4 04             	add    esp,0x4
  47e8ba:	eb 29                	jmp    0x47e8e5
  47e8bc:	e8 4f 49 01 00       	call   0x493210
  47e8c1:	85 c0                	test   eax,eax
  47e8c3:	a1 b8 5b 5d 00       	mov    eax,ds:0x5d5bb8
  47e8c8:	8b 48 0c             	mov    ecx,DWORD PTR [eax+0xc]
  47e8cb:	51                   	push   ecx
  47e8cc:	74 0a                	je     0x47e8d8
  47e8ce:	e8 6d 32 fd ff       	call   0x451b40
  47e8d3:	83 c4 04             	add    esp,0x4
  47e8d6:	eb 0d                	jmp    0x47e8e5
  47e8d8:	68 88 16 59 00       	push   0x591688
  47e8dd:	e8 be 91 0a 00       	call   0x527aa0
  47e8e2:	83 c4 08             	add    esp,0x8
  47e8e5:	6a 01                	push   0x1
  47e8e7:	8b 0d b0 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13b0
  47e8ed:	a1 bc 13 5f 00       	mov    eax,ds:0x5f13bc
  47e8f2:	8d 14 49             	lea    edx,[ecx+ecx*2]
  47e8f5:	8d 0c 91             	lea    ecx,[ecx+edx*4]
  47e8f8:	8b 54 88 28          	mov    edx,DWORD PTR [eax+ecx*4+0x28]
  47e8fc:	8d 4c 24 30          	lea    ecx,[esp+0x30]
  47e900:	52                   	push   edx
  47e901:	51                   	push   ecx
  47e902:	e8 39 53 04 00       	call   0x4c3c40
  47e907:	83 c4 0c             	add    esp,0xc
  47e90a:	e8 01 49 01 00       	call   0x493210
  47e90f:	85 c0                	test   eax,eax
  47e911:	74 17                	je     0x47e92a
  47e913:	8d 44 24 2c          	lea    eax,[esp+0x2c]
  47e917:	50                   	push   eax
  47e918:	e8 73 4e fd ff       	call   0x453790
  47e91d:	83 c4 04             	add    esp,0x4
  47e920:	a0 f4 c6 89 00       	mov    al,ds:0x89c6f4
  47e925:	a2 9c 48 98 00       	mov    ds:0x98489c,al
  47e92a:	33 f6                	xor    esi,esi
  47e92c:	8d 5c 24 2c          	lea    ebx,[esp+0x2c]
  47e930:	66 39 74 24 2c       	cmp    WORD PTR [esp+0x2c],si
  47e935:	74 2a                	je     0x47e961
  47e937:	33 ff                	xor    edi,edi
  47e939:	83 c3 02             	add    ebx,0x2
  47e93c:	66 8b 7b fe          	mov    di,WORD PTR [ebx-0x2]
  47e940:	e8 cb 48 01 00       	call   0x493210
  47e945:	57                   	push   edi
  47e946:	85 c0                	test   eax,eax
  47e948:	74 07                	je     0x47e951
  47e94a:	e8 81 3e fd ff       	call   0x4527d0
  47e94f:	eb 05                	jmp    0x47e956
  47e951:	e8 ba 91 0a 00       	call   0x527b10
  47e956:	83 c4 04             	add    esp,0x4
  47e959:	03 f0                	add    esi,eax
  47e95b:	66 83 3b 00          	cmp    WORD PTR [ebx],0x0
  47e95f:	75 d6                	jne    0x47e937
  47e961:	e8 aa 48 01 00       	call   0x493210
  47e966:	85 c0                	test   eax,eax
  47e968:	74 29                	je     0x47e993
  47e96a:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  47e96f:	8d 4c 24 2c          	lea    ecx,[esp+0x2c]
  47e973:	c1 fe 01             	sar    esi,0x1
  47e976:	50                   	push   eax
  47e977:	51                   	push   ecx
  47e978:	a1 b0 c9 5f 00       	mov    eax,ds:0x5fc9b0
  47e97d:	c1 f8 01             	sar    eax,0x1
  47e980:	68 90 01 00 00       	push   0x190
  47e985:	66 2b c6             	sub    ax,si
  47e988:	50                   	push   eax
  47e989:	e8 12 32 fd ff       	call   0x451ba0
  47e98e:	83 c4 10             	add    esp,0x10
  47e991:	eb 36                	jmp    0x47e9c9
  47e993:	83 ec 08             	sub    esp,0x8
  47e996:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  47e99b:	89 64 24 18          	mov    DWORD PTR [esp+0x18],esp
  47e99f:	50                   	push   eax
  47e9a0:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  47e9a4:	c1 fe 01             	sar    esi,0x1
  47e9a7:	e8 c4 75 f9 ff       	call   0x415f70
  47e9ac:	8d 44 24 34          	lea    eax,[esp+0x34]
  47e9b0:	50                   	push   eax
  47e9b1:	68 90 01 00 00       	push   0x190
  47e9b6:	a1 b0 c9 5f 00       	mov    eax,ds:0x5fc9b0
  47e9bb:	c1 f8 01             	sar    eax,0x1
  47e9be:	2b c6                	sub    eax,esi
  47e9c0:	50                   	push   eax
  47e9c1:	e8 9a 8f 0a 00       	call   0x527960
  47e9c6:	83 c4 14             	add    esp,0x14
  47e9c9:	f6 05 f4 c9 5f 00 04 	test   BYTE PTR ds:0x5fc9f4,0x4
  47e9d0:	75 0d                	jne    0x47e9df
  47e9d2:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  47e9d6:	50                   	push   eax
  47e9d7:	e8 b4 00 00 00       	call   0x47ea90
  47e9dc:	83 c4 04             	add    esp,0x4
  47e9df:	5d                   	pop    ebp
  47e9e0:	5f                   	pop    edi
  47e9e1:	5e                   	pop    esi
  47e9e2:	5b                   	pop    ebx
  47e9e3:	81 c4 1c 02 00 00    	add    esp,0x21c
  47e9e9:	c3                   	ret
  47e9ea:	cc                   	int3
  47e9eb:	cc                   	int3
  47e9ec:	cc                   	int3
  47e9ed:	cc                   	int3
  47e9ee:	cc                   	int3
  47e9ef:	cc                   	int3
  47e9f0:	83 ec 04             	sub    esp,0x4
  47e9f3:	a1 8c 5a 98 00       	mov    eax,ds:0x985a8c
  47e9f8:	33 d2                	xor    edx,edx
  47e9fa:	56                   	push   esi
  47e9fb:	66 8b 90 cc 00 00 00 	mov    dx,WORD PTR [eax+0xcc]
  47ea02:	57                   	push   edi
  47ea03:	0f bf 44 24 18       	movsx  eax,WORD PTR [esp+0x18]
  47ea08:	0f af d0             	imul   edx,eax
  47ea0b:	0f bf 74 24 14       	movsx  esi,WORD PTR [esp+0x14]
  47ea10:	a1 8c 5a 98 00       	mov    eax,ds:0x985a8c
  47ea15:	33 ff                	xor    edi,edi
  47ea17:	0f bf 4c 24 10       	movsx  ecx,WORD PTR [esp+0x10]
  47ea1c:	66 8b b8 ce 00 00 00 	mov    di,WORD PTR [eax+0xce]
  47ea23:	6a 00                	push   0x0
  47ea25:	0f bf 44 24 20       	movsx  eax,WORD PTR [esp+0x20]
  47ea2a:	0f af f8             	imul   edi,eax
  47ea2d:	68 00 81 e1 82       	push   0x82e18100
  47ea32:	03 fe                	add    edi,esi
  47ea34:	68 0a d7 23 3c       	push   0x3c23d70a
  47ea39:	03 d1                	add    edx,ecx
  47ea3b:	89 7c 24 14          	mov    DWORD PTR [esp+0x14],edi
  47ea3f:	83 ec 04             	sub    esp,0x4
  47ea42:	83 ec 04             	sub    esp,0x4
  47ea45:	db 44 24 1c          	fild   DWORD PTR [esp+0x1c]
  47ea49:	89 54 24 1c          	mov    DWORD PTR [esp+0x1c],edx
  47ea4d:	83 ec 04             	sub    esp,0x4
  47ea50:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  47ea54:	db 44 24 20          	fild   DWORD PTR [esp+0x20]
  47ea58:	89 74 24 20          	mov    DWORD PTR [esp+0x20],esi
  47ea5c:	83 ec 04             	sub    esp,0x4
  47ea5f:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  47ea63:	db 44 24 24          	fild   DWORD PTR [esp+0x24]
  47ea67:	89 4c 24 24          	mov    DWORD PTR [esp+0x24],ecx
  47ea6b:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  47ea6f:	db 44 24 24          	fild   DWORD PTR [esp+0x24]
  47ea73:	d9 1c 24             	fstp   DWORD PTR [esp]
  47ea76:	e8 75 99 fa ff       	call   0x4283f0
  47ea7b:	83 c4 1c             	add    esp,0x1c
  47ea7e:	5f                   	pop    edi
  47ea7f:	5e                   	pop    esi
  47ea80:	83 c4 04             	add    esp,0x4
  47ea83:	c3                   	ret
  47ea84:	cc                   	int3
  47ea85:	cc                   	int3
  47ea86:	cc                   	int3
  47ea87:	cc                   	int3
  47ea88:	cc                   	int3
  47ea89:	cc                   	int3
  47ea8a:	cc                   	int3
  47ea8b:	cc                   	int3
  47ea8c:	cc                   	int3
  47ea8d:	cc                   	int3
  47ea8e:	cc                   	int3
  47ea8f:	cc                   	int3
  47ea90:	81 ec 10 02 00 00    	sub    esp,0x210
  47ea96:	f6 05 fc 58 98 00 01 	test   BYTE PTR ds:0x9858fc,0x1
  47ea9d:	53                   	push   ebx
  47ea9e:	56                   	push   esi
  47ea9f:	57                   	push   edi
  47eaa0:	55                   	push   ebp
  47eaa1:	75 16                	jne    0x47eab9
  47eaa3:	80 0d fc 58 98 00 01 	or     BYTE PTR ds:0x9858fc,0x1
  47eaaa:	8b 3d 84 c7 d0 00    	mov    edi,DWORD PTR ds:0xd0c784
  47eab0:	ff d7                	call   edi
  47eab2:	a3 70 59 98 00       	mov    ds:0x985970,eax
  47eab7:	eb 06                	jmp    0x47eabf
  47eab9:	8b 3d 84 c7 d0 00    	mov    edi,DWORD PTR ds:0xd0c784
  47eabf:	8b b4 24 24 02 00 00 	mov    esi,DWORD PTR [esp+0x224]
  47eac6:	39 35 ec e2 59 00    	cmp    DWORD PTR ds:0x59e2ec,esi
  47eacc:	74 18                	je     0x47eae6
  47eace:	89 35 ec e2 59 00    	mov    DWORD PTR ds:0x59e2ec,esi
  47ead4:	ff d7                	call   edi
  47ead6:	5d                   	pop    ebp
  47ead7:	a3 70 59 98 00       	mov    ds:0x985970,eax
  47eadc:	5f                   	pop    edi
  47eadd:	5e                   	pop    esi
  47eade:	5b                   	pop    ebx
  47eadf:	81 c4 10 02 00 00    	add    esp,0x210
  47eae5:	c3                   	ret
  47eae6:	ff d7                	call   edi
  47eae8:	8b 0d 70 59 98 00    	mov    ecx,DWORD PTR ds:0x985970
  47eaee:	81 c1 f4 01 00 00    	add    ecx,0x1f4
  47eaf4:	3b c1                	cmp    eax,ecx
  47eaf6:	0f 86 19 02 00 00    	jbe    0x47ed15
  47eafc:	85 f6                	test   esi,esi
  47eafe:	0f 8c 11 02 00 00    	jl     0x47ed15
  47eb04:	e8 07 47 01 00       	call   0x493210
  47eb09:	85 c0                	test   eax,eax
  47eb0b:	75 0f                	jne    0x47eb1c
  47eb0d:	68 d8 59 98 00       	push   0x9859d8
  47eb12:	e8 a9 ac fa ff       	call   0x4297c0
  47eb17:	83 c4 04             	add    esp,0x4
  47eb1a:	eb 29                	jmp    0x47eb45
  47eb1c:	e8 ef 46 01 00       	call   0x493210
  47eb21:	85 c0                	test   eax,eax
  47eb23:	a1 38 5d 5d 00       	mov    eax,ds:0x5d5d38
  47eb28:	8b 48 0c             	mov    ecx,DWORD PTR [eax+0xc]
  47eb2b:	51                   	push   ecx
  47eb2c:	74 0a                	je     0x47eb38
  47eb2e:	e8 0d 30 fd ff       	call   0x451b40
  47eb33:	83 c4 04             	add    esp,0x4
  47eb36:	eb 0d                	jmp    0x47eb45
  47eb38:	68 88 16 59 00       	push   0x591688
  47eb3d:	e8 5e 8f 0a 00       	call   0x527aa0
  47eb42:	83 c4 08             	add    esp,0x8
  47eb45:	8b 04 b5 a8 2b 97 00 	mov    eax,DWORD PTR [esi*4+0x972ba8]
  47eb4c:	8d 4c 24 20          	lea    ecx,[esp+0x20]
  47eb50:	50                   	push   eax
  47eb51:	68 70 99 59 00       	push   0x599970
  47eb56:	51                   	push   ecx
  47eb57:	e8 64 ca 0d 00       	call   0x55b5c0
  47eb5c:	83 c4 0c             	add    esp,0xc
  47eb5f:	e8 ac 46 01 00       	call   0x493210
  47eb64:	85 c0                	test   eax,eax
  47eb66:	74 17                	je     0x47eb7f
  47eb68:	8d 44 24 20          	lea    eax,[esp+0x20]
  47eb6c:	50                   	push   eax
  47eb6d:	e8 1e 4c fd ff       	call   0x453790
  47eb72:	83 c4 04             	add    esp,0x4
  47eb75:	a0 f4 c6 89 00       	mov    al,ds:0x89c6f4
  47eb7a:	a2 9c 48 98 00       	mov    ds:0x98489c,al
  47eb7f:	33 f6                	xor    esi,esi
  47eb81:	8d 7c 24 20          	lea    edi,[esp+0x20]
  47eb85:	66 39 74 24 20       	cmp    WORD PTR [esp+0x20],si
  47eb8a:	89 74 24 18          	mov    DWORD PTR [esp+0x18],esi
  47eb8e:	74 4d                	je     0x47ebdd
  47eb90:	33 db                	xor    ebx,ebx
  47eb92:	83 c7 02             	add    edi,0x2
  47eb95:	66 8b 5f fe          	mov    bx,WORD PTR [edi-0x2]
  47eb99:	e8 72 46 01 00       	call   0x493210
  47eb9e:	53                   	push   ebx
  47eb9f:	85 c0                	test   eax,eax
  47eba1:	74 07                	je     0x47ebaa
  47eba3:	e8 28 3c fd ff       	call   0x4527d0
  47eba8:	eb 05                	jmp    0x47ebaf
  47ebaa:	e8 61 8f 0a 00       	call   0x527b10
  47ebaf:	83 c4 04             	add    esp,0x4
  47ebb2:	03 f0                	add    esi,eax
  47ebb4:	e8 57 46 01 00       	call   0x493210
  47ebb9:	53                   	push   ebx
  47ebba:	85 c0                	test   eax,eax
  47ebbc:	74 07                	je     0x47ebc5
  47ebbe:	e8 2d 3c fd ff       	call   0x4527f0
  47ebc3:	eb 05                	jmp    0x47ebca
  47ebc5:	e8 76 8f 0a 00       	call   0x527b40
  47ebca:	83 c4 04             	add    esp,0x4
  47ebcd:	3b 44 24 18          	cmp    eax,DWORD PTR [esp+0x18]
  47ebd1:	7e 04                	jle    0x47ebd7
  47ebd3:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  47ebd7:	66 83 3f 00          	cmp    WORD PTR [edi],0x0
  47ebdb:	75 b3                	jne    0x47eb90
  47ebdd:	8b ce                	mov    ecx,esi
  47ebdf:	8b 54 24 18          	mov    edx,DWORD PTR [esp+0x18]
  47ebe3:	c1 f9 02             	sar    ecx,0x2
  47ebe6:	c1 fa 02             	sar    edx,0x2
  47ebe9:	83 c1 03             	add    ecx,0x3
  47ebec:	83 c2 02             	add    edx,0x2
  47ebef:	8d 1c 8d 00 00 00 00 	lea    ebx,[ecx*4+0x0]
  47ebf6:	8b 3d e0 c9 5f 00    	mov    edi,DWORD PTR ds:0x5fc9e0
  47ebfc:	8d 04 95 00 00 00 00 	lea    eax,[edx*4+0x0]
  47ec03:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  47ec07:	8b c3                	mov    eax,ebx
  47ec09:	c1 f8 01             	sar    eax,0x1
  47ec0c:	2b f8                	sub    edi,eax
  47ec0e:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  47ec12:	79 04                	jns    0x47ec18
  47ec14:	33 ff                	xor    edi,edi
  47ec16:	eb 13                	jmp    0x47ec2b
  47ec18:	8d 04 3b             	lea    eax,[ebx+edi*1]
  47ec1b:	3b 05 b0 c9 5f 00    	cmp    eax,DWORD PTR ds:0x5fc9b0
  47ec21:	7e 08                	jle    0x47ec2b
  47ec23:	8b 3d b0 c9 5f 00    	mov    edi,DWORD PTR ds:0x5fc9b0
  47ec29:	2b fb                	sub    edi,ebx
  47ec2b:	a1 e4 c9 5f 00       	mov    eax,ds:0x5fc9e4
  47ec30:	83 e8 1e             	sub    eax,0x1e
  47ec33:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  47ec37:	79 0a                	jns    0x47ec43
  47ec39:	c7 44 24 10 00 00 00 	mov    DWORD PTR [esp+0x10],0x0
  47ec40:	00 
  47ec41:	eb 1d                	jmp    0x47ec60
  47ec43:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  47ec47:	03 44 24 10          	add    eax,DWORD PTR [esp+0x10]
  47ec4b:	3b 05 b4 c9 5f 00    	cmp    eax,DWORD PTR ds:0x5fc9b4
  47ec51:	7e 0d                	jle    0x47ec60
  47ec53:	a1 b4 c9 5f 00       	mov    eax,ds:0x5fc9b4
  47ec58:	2b 44 24 1c          	sub    eax,DWORD PTR [esp+0x1c]
  47ec5c:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  47ec60:	33 c0                	xor    eax,eax
  47ec62:	85 d2                	test   edx,edx
  47ec64:	7e 31                	jle    0x47ec97
  47ec66:	33 db                	xor    ebx,ebx
  47ec68:	85 c9                	test   ecx,ecx
  47ec6a:	7e 26                	jle    0x47ec92
  47ec6c:	85 db                	test   ebx,ebx
  47ec6e:	75 06                	jne    0x47ec76
  47ec70:	85 c0                	test   eax,eax
  47ec72:	74 19                	je     0x47ec8d
  47ec74:	eb 13                	jmp    0x47ec89
  47ec76:	8b e9                	mov    ebp,ecx
  47ec78:	2b eb                	sub    ebp,ebx
  47ec7a:	83 fd 01             	cmp    ebp,0x1
  47ec7d:	75 06                	jne    0x47ec85
  47ec7f:	85 c0                	test   eax,eax
  47ec81:	74 0a                	je     0x47ec8d
  47ec83:	eb 04                	jmp    0x47ec89
  47ec85:	85 c0                	test   eax,eax
  47ec87:	74 04                	je     0x47ec8d
  47ec89:	8b ea                	mov    ebp,edx
  47ec8b:	2b e8                	sub    ebp,eax
  47ec8d:	43                   	inc    ebx
  47ec8e:	3b cb                	cmp    ecx,ebx
  47ec90:	7f da                	jg     0x47ec6c
  47ec92:	40                   	inc    eax
  47ec93:	3b c2                	cmp    eax,edx
  47ec95:	7c cf                	jl     0x47ec66
  47ec97:	c1 fe 01             	sar    esi,0x1
  47ec9a:	6a 00                	push   0x0
  47ec9c:	2b fe                	sub    edi,esi
  47ec9e:	e8 fd a3 fa ff       	call   0x4290a0
  47eca3:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  47eca7:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  47ecab:	c1 f8 01             	sar    eax,0x1
  47ecae:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  47ecb2:	c1 f9 01             	sar    ecx,0x1
  47ecb5:	83 c4 04             	add    esp,0x4
  47ecb8:	03 f7                	add    esi,edi
  47ecba:	2b c1                	sub    eax,ecx
  47ecbc:	8b 7c 24 10          	mov    edi,DWORD PTR [esp+0x10]
  47ecc0:	03 f8                	add    edi,eax
  47ecc2:	e8 49 45 01 00       	call   0x493210
  47ecc7:	85 c0                	test   eax,eax
  47ecc9:	74 17                	je     0x47ece2
  47eccb:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  47ecd0:	8d 4c 24 20          	lea    ecx,[esp+0x20]
  47ecd4:	50                   	push   eax
  47ecd5:	51                   	push   ecx
  47ecd6:	57                   	push   edi
  47ecd7:	56                   	push   esi
  47ecd8:	e8 c3 2e fd ff       	call   0x451ba0
  47ecdd:	83 c4 10             	add    esp,0x10
  47ece0:	eb 25                	jmp    0x47ed07
  47ece2:	83 ec 08             	sub    esp,0x8
  47ece5:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  47ecea:	89 64 24 1c          	mov    DWORD PTR [esp+0x1c],esp
  47ecee:	50                   	push   eax
  47ecef:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  47ecf3:	e8 78 72 f9 ff       	call   0x415f70
  47ecf8:	8d 44 24 28          	lea    eax,[esp+0x28]
  47ecfc:	50                   	push   eax
  47ecfd:	57                   	push   edi
  47ecfe:	56                   	push   esi
  47ecff:	e8 5c 8c 0a 00       	call   0x527960
  47ed04:	83 c4 14             	add    esp,0x14
  47ed07:	a1 38 f5 58 00       	mov    eax,ds:0x58f538
  47ed0c:	50                   	push   eax
  47ed0d:	e8 8e a3 fa ff       	call   0x4290a0
  47ed12:	83 c4 04             	add    esp,0x4
  47ed15:	5d                   	pop    ebp
  47ed16:	5f                   	pop    edi
  47ed17:	5e                   	pop    esi
  47ed18:	5b                   	pop    ebx
  47ed19:	81 c4 10 02 00 00    	add    esp,0x210
  47ed1f:	c3                   	ret
