
/workspace/shared/populous-prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004b43f0 <.text+0xb33f0>:
  4b43f0:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4b43f7:	83 ec 08             	sub    esp,0x8
  4b43fa:	8b c8                	mov    ecx,eax
  4b43fc:	8d 14 80             	lea    edx,[eax+eax*4]
  4b43ff:	56                   	push   esi
  4b4400:	8d 04 51             	lea    eax,[ecx+edx*2]
  4b4403:	8d 34 c0             	lea    esi,[eax+eax*8]
  4b4406:	66 a1 46 f7 98 00    	mov    ax,ds:0x98f746
  4b440c:	8d 14 f1             	lea    edx,[ecx+esi*8]
  4b440f:	66 25 08 00          	and    ax,0x8
  4b4413:	8d b4 91 c8 d1 89 00 	lea    esi,[ecx+edx*4+0x89d1c8]
  4b441a:	0f 85 9e 01 00 00    	jne    0x4b45be
  4b4420:	33 c9                	xor    ecx,ecx
  4b4422:	f6 05 08 f7 98 00 01 	test   BYTE PTR ds:0x98f708,0x1
  4b4429:	75 3b                	jne    0x4b4466
  4b442b:	39 0d ec f6 98 00    	cmp    DWORD PTR ds:0x98f6ec,ecx
  4b4431:	74 33                	je     0x4b4466
  4b4433:	83 3d ec f6 98 00 26 	cmp    DWORD PTR ds:0x98f6ec,0x26
  4b443a:	b9 01 00 00 00       	mov    ecx,0x1
  4b443f:	7c 09                	jl     0x4b444a
  4b4441:	83 2d ec f6 98 00 26 	sub    DWORD PTR ds:0x98f6ec,0x26
  4b4448:	eb 1c                	jmp    0x4b4466
  4b444a:	83 3d ec f6 98 00 da 	cmp    DWORD PTR ds:0x98f6ec,0xffffffda
  4b4451:	7f 09                	jg     0x4b445c
  4b4453:	83 05 ec f6 98 00 26 	add    DWORD PTR ds:0x98f6ec,0x26
  4b445a:	eb 0a                	jmp    0x4b4466
  4b445c:	c7 05 ec f6 98 00 00 	mov    DWORD PTR ds:0x98f6ec,0x0
  4b4463:	00 00 00 
  4b4466:	f6 05 08 f7 98 00 02 	test   BYTE PTR ds:0x98f708,0x2
  4b446d:	75 3a                	jne    0x4b44a9
  4b446f:	83 3d f0 f6 98 00 00 	cmp    DWORD PTR ds:0x98f6f0,0x0
  4b4476:	74 31                	je     0x4b44a9
  4b4478:	83 c9 02             	or     ecx,0x2
  4b447b:	83 3d f0 f6 98 00 26 	cmp    DWORD PTR ds:0x98f6f0,0x26
  4b4482:	7c 09                	jl     0x4b448d
  4b4484:	83 2d f0 f6 98 00 26 	sub    DWORD PTR ds:0x98f6f0,0x26
  4b448b:	eb 1c                	jmp    0x4b44a9
  4b448d:	83 3d f0 f6 98 00 da 	cmp    DWORD PTR ds:0x98f6f0,0xffffffda
  4b4494:	7f 09                	jg     0x4b449f
  4b4496:	83 05 f0 f6 98 00 26 	add    DWORD PTR ds:0x98f6f0,0x26
  4b449d:	eb 0a                	jmp    0x4b44a9
  4b449f:	c7 05 f0 f6 98 00 00 	mov    DWORD PTR ds:0x98f6f0,0x0
  4b44a6:	00 00 00 
  4b44a9:	f6 05 08 f7 98 00 04 	test   BYTE PTR ds:0x98f708,0x4
  4b44b0:	75 3a                	jne    0x4b44ec
  4b44b2:	83 3d f4 f6 98 00 00 	cmp    DWORD PTR ds:0x98f6f4,0x0
  4b44b9:	74 31                	je     0x4b44ec
  4b44bb:	83 c9 04             	or     ecx,0x4
  4b44be:	83 3d f4 f6 98 00 02 	cmp    DWORD PTR ds:0x98f6f4,0x2
  4b44c5:	7c 09                	jl     0x4b44d0
  4b44c7:	83 2d f4 f6 98 00 02 	sub    DWORD PTR ds:0x98f6f4,0x2
  4b44ce:	eb 1c                	jmp    0x4b44ec
  4b44d0:	83 3d f4 f6 98 00 fe 	cmp    DWORD PTR ds:0x98f6f4,0xfffffffe
  4b44d7:	7f 09                	jg     0x4b44e2
  4b44d9:	83 05 f4 f6 98 00 02 	add    DWORD PTR ds:0x98f6f4,0x2
  4b44e0:	eb 0a                	jmp    0x4b44ec
  4b44e2:	c7 05 f4 f6 98 00 00 	mov    DWORD PTR ds:0x98f6f4,0x0
  4b44e9:	00 00 00 
  4b44ec:	8a 15 08 f7 98 00    	mov    dl,BYTE PTR ds:0x98f708
  4b44f2:	80 e2 08             	and    dl,0x8
  4b44f5:	75 3a                	jne    0x4b4531
  4b44f7:	83 3d f8 f6 98 00 00 	cmp    DWORD PTR ds:0x98f6f8,0x0
  4b44fe:	74 31                	je     0x4b4531
  4b4500:	83 c9 08             	or     ecx,0x8
  4b4503:	83 3d f8 f6 98 00 28 	cmp    DWORD PTR ds:0x98f6f8,0x28
  4b450a:	7c 09                	jl     0x4b4515
  4b450c:	83 2d f8 f6 98 00 28 	sub    DWORD PTR ds:0x98f6f8,0x28
  4b4513:	eb 1c                	jmp    0x4b4531
  4b4515:	83 3d f8 f6 98 00 d8 	cmp    DWORD PTR ds:0x98f6f8,0xffffffd8
  4b451c:	7f 09                	jg     0x4b4527
  4b451e:	83 05 f8 f6 98 00 28 	add    DWORD PTR ds:0x98f6f8,0x28
  4b4525:	eb 0a                	jmp    0x4b4531
  4b4527:	c7 05 f8 f6 98 00 00 	mov    DWORD PTR ds:0x98f6f8,0x0
  4b452e:	00 00 00 
  4b4531:	84 d2                	test   dl,dl
  4b4533:	75 05                	jne    0x4b453a
  4b4535:	f6 c1 08             	test   cl,0x8
  4b4538:	74 09                	je     0x4b4543
  4b453a:	66 c7 05 06 f7 98 00 	mov    WORD PTR ds:0x98f706,0x0
  4b4541:	00 00 
  4b4543:	66 83 3d 06 f7 98 00 	cmp    WORD PTR ds:0x98f706,0x50
  4b454a:	50 
  4b454b:	7e 48                	jle    0x4b4595
  4b454d:	83 3d fc f6 98 00 00 	cmp    DWORD PTR ds:0x98f6fc,0x0
  4b4554:	74 46                	je     0x4b459c
  4b4556:	83 3d ec f6 98 00 00 	cmp    DWORD PTR ds:0x98f6ec,0x0
  4b455d:	75 12                	jne    0x4b4571
  4b455f:	83 3d f0 f6 98 00 00 	cmp    DWORD PTR ds:0x98f6f0,0x0
  4b4566:	75 09                	jne    0x4b4571
  4b4568:	83 3d f4 f6 98 00 00 	cmp    DWORD PTR ds:0x98f6f4,0x0
  4b456f:	74 2b                	je     0x4b459c
  4b4571:	83 c9 08             	or     ecx,0x8
  4b4574:	83 3d fc f6 98 00 00 	cmp    DWORD PTR ds:0x98f6fc,0x0
  4b457b:	7e 0c                	jle    0x4b4589
  4b457d:	c7 05 f8 f6 98 00 d8 	mov    DWORD PTR ds:0x98f6f8,0xffffffd8
  4b4584:	ff ff ff 
  4b4587:	eb 13                	jmp    0x4b459c
  4b4589:	c7 05 f8 f6 98 00 28 	mov    DWORD PTR ds:0x98f6f8,0x28
  4b4590:	00 00 00 
  4b4593:	eb 07                	jmp    0x4b459c
  4b4595:	66 ff 05 06 f7 98 00 	inc    WORD PTR ds:0x98f706
  4b459c:	80 3d 09 f7 98 00 00 	cmp    BYTE PTR ds:0x98f709,0x0
  4b45a3:	74 0d                	je     0x4b45b2
  4b45a5:	c7 05 f8 f6 98 00 f0 	mov    DWORD PTR ds:0x98f6f8,0xf0
  4b45ac:	00 00 00 
  4b45af:	83 c9 08             	or     ecx,0x8
  4b45b2:	08 0d 08 f7 98 00    	or     BYTE PTR ds:0x98f708,cl
  4b45b8:	09 0d 2a f7 98 00    	or     DWORD PTR ds:0x98f72a,ecx
  4b45be:	f6 05 08 f7 98 00 0f 	test   BYTE PTR ds:0x98f708,0xf
  4b45c5:	0f 84 81 01 00 00    	je     0x4b474c
  4b45cb:	66 85 c0             	test   ax,ax
  4b45ce:	0f 85 1a 01 00 00    	jne    0x4b46ee
  4b45d4:	8d 46 24             	lea    eax,[esi+0x24]
  4b45d7:	8d 54 24 04          	lea    edx,[esp+0x4]
  4b45db:	8b 08                	mov    ecx,DWORD PTR [eax]
  4b45dd:	89 0a                	mov    DWORD PTR [edx],ecx
  4b45df:	66 8b 40 04          	mov    ax,WORD PTR [eax+0x4]
  4b45e3:	66 89 42 04          	mov    WORD PTR [edx+0x4],ax
  4b45e7:	a1 ec f6 98 00       	mov    eax,ds:0x98f6ec
  4b45ec:	c1 f8 04             	sar    eax,0x4
  4b45ef:	8d 54 24 04          	lea    edx,[esp+0x4]
  4b45f3:	50                   	push   eax
  4b45f4:	66 a1 04 f7 98 00    	mov    ax,ds:0x98f704
  4b45fa:	66 05 00 02          	add    ax,0x200
  4b45fe:	66 25 ff 07          	and    ax,0x7ff
  4b4602:	50                   	push   eax
  4b4603:	52                   	push   edx
  4b4604:	e8 67 24 03 00       	call   0x4e6a70
  4b4609:	83 c4 0c             	add    esp,0xc
  4b460c:	a1 f0 f6 98 00       	mov    eax,ds:0x98f6f0
  4b4611:	c1 f8 04             	sar    eax,0x4
  4b4614:	8d 4c 24 04          	lea    ecx,[esp+0x4]
  4b4618:	50                   	push   eax
  4b4619:	66 a1 04 f7 98 00    	mov    ax,ds:0x98f704
  4b461f:	66 25 ff 07          	and    ax,0x7ff
  4b4623:	50                   	push   eax
  4b4624:	51                   	push   ecx
  4b4625:	e8 46 24 03 00       	call   0x4e6a70
  4b462a:	66 8b 4c 24 10       	mov    cx,WORD PTR [esp+0x10]
  4b462f:	83 c4 0c             	add    esp,0xc
  4b4632:	66 8b 54 24 06       	mov    dx,WORD PTR [esp+0x6]
  4b4637:	66 89 0d 00 f7 98 00 	mov    WORD PTR ds:0x98f700,cx
  4b463e:	8b 0d f4 f6 98 00    	mov    ecx,DWORD PTR ds:0x98f6f4
  4b4644:	c1 f9 02             	sar    ecx,0x2
  4b4647:	66 89 15 02 f7 98 00 	mov    WORD PTR ds:0x98f702,dx
  4b464e:	66 8b 46 32          	mov    ax,WORD PTR [esi+0x32]
  4b4652:	66 03 c1             	add    ax,cx
  4b4655:	66 25 ff 07          	and    ax,0x7ff
  4b4659:	80 3d 09 f7 98 00 00 	cmp    BYTE PTR ds:0x98f709,0x0
  4b4660:	66 a3 04 f7 98 00    	mov    ds:0x98f704,ax
  4b4666:	a1 f8 f6 98 00       	mov    eax,ds:0x98f6f8
  4b466b:	74 32                	je     0x4b469f
  4b466d:	c1 f8 02             	sar    eax,0x2
  4b4670:	39 05 fc f6 98 00    	cmp    DWORD PTR ds:0x98f6fc,eax
  4b4676:	7e 08                	jle    0x4b4680
  4b4678:	29 05 fc f6 98 00    	sub    DWORD PTR ds:0x98f6fc,eax
  4b467e:	eb 28                	jmp    0x4b46a8
  4b4680:	8b c8                	mov    ecx,eax
  4b4682:	f7 d9                	neg    ecx
  4b4684:	3b 0d fc f6 98 00    	cmp    ecx,DWORD PTR ds:0x98f6fc
  4b468a:	7f 16                	jg     0x4b46a2
  4b468c:	33 c0                	xor    eax,eax
  4b468e:	a2 09 f7 98 00       	mov    ds:0x98f709,al
  4b4693:	a3 fc f6 98 00       	mov    ds:0x98f6fc,eax
  4b4698:	a3 f8 f6 98 00       	mov    ds:0x98f6f8,eax
  4b469d:	eb 09                	jmp    0x4b46a8
  4b469f:	c1 f8 02             	sar    eax,0x2
  4b46a2:	01 05 fc f6 98 00    	add    DWORD PTR ds:0x98f6fc,eax
  4b46a8:	b8 00 e0 ff ff       	mov    eax,0xffffe000
  4b46ad:	39 05 fc f6 98 00    	cmp    DWORD PTR ds:0x98f6fc,eax
  4b46b3:	7d 05                	jge    0x4b46ba
  4b46b5:	a3 fc f6 98 00       	mov    ds:0x98f6fc,eax
  4b46ba:	b8 00 20 00 00       	mov    eax,0x2000
  4b46bf:	39 05 fc f6 98 00    	cmp    DWORD PTR ds:0x98f6fc,eax
  4b46c5:	7e 05                	jle    0x4b46cc
  4b46c7:	a3 fc f6 98 00       	mov    ds:0x98f6fc,eax
  4b46cc:	81 3d fc f6 98 00 00 	cmp    DWORD PTR ds:0x98f6fc,0xffffe000
  4b46d3:	e0 ff ff 
  4b46d6:	74 0c                	je     0x4b46e4
  4b46d8:	81 3d fc f6 98 00 00 	cmp    DWORD PTR ds:0x98f6fc,0x2000
  4b46df:	20 00 00 
  4b46e2:	75 0a                	jne    0x4b46ee
  4b46e4:	c7 05 f8 f6 98 00 00 	mov    DWORD PTR ds:0x98f6f8,0x0
  4b46eb:	00 00 00 
  4b46ee:	66 a1 00 f7 98 00    	mov    ax,ds:0x98f700
  4b46f4:	66 89 46 24          	mov    WORD PTR [esi+0x24],ax
  4b46f8:	66 8b 0d 02 f7 98 00 	mov    cx,WORD PTR ds:0x98f702
  4b46ff:	66 89 4e 26          	mov    WORD PTR [esi+0x26],cx
  4b4703:	66 8b 15 04 f7 98 00 	mov    dx,WORD PTR ds:0x98f704
  4b470a:	66 89 56 32          	mov    WORD PTR [esi+0x32],dx
  4b470e:	a1 fc f6 98 00       	mov    eax,ds:0x98f6fc
  4b4713:	c1 f8 03             	sar    eax,0x3
  4b4716:	66 89 46 34          	mov    WORD PTR [esi+0x34],ax
  4b471a:	f6 05 08 f7 98 00 04 	test   BYTE PTR ds:0x98f708,0x4
  4b4721:	74 0a                	je     0x4b472d
  4b4723:	81 0d 1c ca 87 00 80 	or     DWORD PTR ds:0x87ca1c,0x80
  4b472a:	00 00 00 
  4b472d:	f6 05 08 f7 98 00 08 	test   BYTE PTR ds:0x98f708,0x8
  4b4734:	74 16                	je     0x4b474c
  4b4736:	68 00 04 00 00       	push   0x400
  4b473b:	a1 fc f6 98 00       	mov    eax,ds:0x98f6fc
  4b4740:	c1 f8 03             	sar    eax,0x3
  4b4743:	50                   	push   eax
  4b4744:	e8 b7 7f f6 ff       	call   0x41c700
  4b4749:	83 c4 08             	add    esp,0x8
  4b474c:	5e                   	pop    esi
  4b474d:	83 c4 08             	add    esp,0x8
  4b4750:	c3                   	ret
