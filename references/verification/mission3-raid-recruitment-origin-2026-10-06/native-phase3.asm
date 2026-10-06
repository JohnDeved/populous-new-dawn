
/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004cb400 <.text+0xca400>:
  4cb400:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  4cb404:	81 ec c0 00 00 00    	sub    esp,0xc0
  4cb40a:	53                   	push   ebx
  4cb40b:	8d 0c c0             	lea    ecx,[eax+eax*8]
  4cb40e:	56                   	push   esi
  4cb40f:	57                   	push   edi
  4cb410:	55                   	push   ebp
  4cb411:	8d 04 c9             	lea    eax,[ecx+ecx*8]
  4cb414:	03 84 24 d8 00 00 00 	add    eax,DWORD PTR [esp+0xd8]
  4cb41b:	8b ac 24 d4 00 00 00 	mov    ebp,DWORD PTR [esp+0xd4]
  4cb422:	8d 5c 28 36          	lea    ebx,[eax+ebp*1+0x36]
  4cb426:	80 7b 26 00          	cmp    BYTE PTR [ebx+0x26],0x0
  4cb42a:	74 1c                	je     0x4cb448
  4cb42c:	8b 84 24 d8 00 00 00 	mov    eax,DWORD PTR [esp+0xd8]
  4cb433:	50                   	push   eax
  4cb434:	55                   	push   ebp
  4cb435:	e8 76 1a 00 00       	call   0x4cceb0
  4cb43a:	83 c4 08             	add    esp,0x8
  4cb43d:	5d                   	pop    ebp
  4cb43e:	5f                   	pop    edi
  4cb43f:	5e                   	pop    esi
  4cb440:	5b                   	pop    ebx
  4cb441:	81 c4 c0 00 00 00    	add    esp,0xc0
  4cb447:	c3                   	ret
  4cb448:	c7 44 24 34 00 00 00 	mov    DWORD PTR [esp+0x34],0x0
  4cb44f:	00
  4cb450:	66 8b 43 32          	mov    ax,WORD PTR [ebx+0x32]
  4cb454:	66 85 c0             	test   ax,ax
  4cb457:	74 1a                	je     0x4cb473
  4cb459:	0f b7 c0             	movzx  eax,ax
  4cb45c:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  4cb463:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  4cb467:	75 0a                	jne    0x4cb473
  4cb469:	80 78 2a 00          	cmp    BYTE PTR [eax+0x2a],0x0
  4cb46d:	74 04                	je     0x4cb473
  4cb46f:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  4cb473:	66 83 7b 42 05       	cmp    WORD PTR [ebx+0x42],0x5
  4cb478:	0f 86 cb 00 00 00    	jbe    0x4cb549
  4cb47e:	8b b5 81 08 00 00    	mov    esi,DWORD PTR [ebp+0x881]
  4cb484:	85 f6                	test   esi,esi
  4cb486:	0f 84 bd 00 00 00    	je     0x4cb549
  4cb48c:	8b 84 24 d8 00 00 00 	mov    eax,DWORD PTR [esp+0xd8]
  4cb493:	40                   	inc    eax
  4cb494:	89 44 24 40          	mov    DWORD PTR [esp+0x40],eax
  4cb498:	8b 44 24 40          	mov    eax,DWORD PTR [esp+0x40]
  4cb49c:	50                   	push   eax
  4cb49d:	56                   	push   esi
  4cb49e:	e8 bd 6f 02 00       	call   0x4f2460
  4cb4a3:	83 c4 08             	add    esp,0x8
  4cb4a6:	85 c0                	test   eax,eax
  4cb4a8:	74 06                	je     0x4cb4b0
  4cb4aa:	80 7e 2c 17          	cmp    BYTE PTR [esi+0x2c],0x17
  4cb4ae:	74 0c                	je     0x4cb4bc
  4cb4b0:	8b 76 08             	mov    esi,DWORD PTR [esi+0x8]
  4cb4b3:	85 f6                	test   esi,esi
  4cb4b5:	75 e1                	jne    0x4cb498
  4cb4b7:	e9 8d 00 00 00       	jmp    0x4cb549
  4cb4bc:	33 c0                	xor    eax,eax
  4cb4be:	8b bd 81 08 00 00    	mov    edi,DWORD PTR [ebp+0x881]
  4cb4c4:	89 44 24 50          	mov    DWORD PTR [esp+0x50],eax
  4cb4c8:	89 44 24 64          	mov    DWORD PTR [esp+0x64],eax
  4cb4cc:	3b f8                	cmp    edi,eax
  4cb4ce:	74 2e                	je     0x4cb4fe
  4cb4d0:	8b 44 24 40          	mov    eax,DWORD PTR [esp+0x40]
  4cb4d4:	50                   	push   eax
  4cb4d5:	57                   	push   edi
  4cb4d6:	e8 85 6f 02 00       	call   0x4f2460
  4cb4db:	83 c4 08             	add    esp,0x8
  4cb4de:	85 c0                	test   eax,eax
  4cb4e0:	74 15                	je     0x4cb4f7
  4cb4e2:	8a 47 2b             	mov    al,BYTE PTR [edi+0x2b]
  4cb4e5:	3c 04                	cmp    al,0x4
  4cb4e7:	75 06                	jne    0x4cb4ef
  4cb4e9:	89 7c 24 50          	mov    DWORD PTR [esp+0x50],edi
  4cb4ed:	eb 08                	jmp    0x4cb4f7
  4cb4ef:	3c 07                	cmp    al,0x7
  4cb4f1:	75 04                	jne    0x4cb4f7
  4cb4f3:	89 7c 24 64          	mov    DWORD PTR [esp+0x64],edi
  4cb4f7:	8b 7f 08             	mov    edi,DWORD PTR [edi+0x8]
  4cb4fa:	85 ff                	test   edi,edi
  4cb4fc:	75 d2                	jne    0x4cb4d0
  4cb4fe:	83 7c 24 50 00       	cmp    DWORD PTR [esp+0x50],0x0
  4cb503:	75 0c                	jne    0x4cb511
  4cb505:	83 7c 24 64 00       	cmp    DWORD PTR [esp+0x64],0x0
  4cb50a:	74 3d                	je     0x4cb549
  4cb50c:	83 7c 24 50 00       	cmp    DWORD PTR [esp+0x50],0x0
  4cb511:	8b 7c 24 50          	mov    edi,DWORD PTR [esp+0x50]
  4cb515:	75 04                	jne    0x4cb51b
  4cb517:	8b 7c 24 64          	mov    edi,DWORD PTR [esp+0x64]
  4cb51b:	66 8b 46 3d          	mov    ax,WORD PTR [esi+0x3d]
  4cb51f:	66 c1 e8 08          	shr    ax,0x8
  4cb523:	24 fe                	and    al,0xfe
  4cb525:	88 44 24 2e          	mov    BYTE PTR [esp+0x2e],al
  4cb529:	66 8b 46 3f          	mov    ax,WORD PTR [esi+0x3f]
  4cb52d:	66 c1 e8 08          	shr    ax,0x8
  4cb531:	24 fe                	and    al,0xfe
  4cb533:	88 44 24 2f          	mov    BYTE PTR [esp+0x2f],al
  4cb537:	8b 4c 24 2e          	mov    ecx,DWORD PTR [esp+0x2e]
  4cb53b:	51                   	push   ecx
  4cb53c:	57                   	push   edi
  4cb53d:	e8 fe ff f6 ff       	call   0x43b540
  4cb542:	83 4f 14 02          	or     DWORD PTR [edi+0x14],0x2
  4cb546:	83 c4 08             	add    esp,0x8
  4cb549:	33 c0                	xor    eax,eax
  4cb54b:	ff 43 08             	inc    DWORD PTR [ebx+0x8]
  4cb54e:	66 8b 43 42          	mov    ax,WORD PTR [ebx+0x42]
  4cb552:	83 f8 17             	cmp    eax,0x17
  4cb555:	77 30                	ja     0x4cb587
  4cb557:	ff 24 85 c4 ca 4c 00 	jmp    DWORD PTR [eax*4+0x4ccac4]
  4cb55e:	c7 03 00 00 00 00    	mov    DWORD PTR [ebx],0x0
  4cb564:	66 c7 43 0c 00 00    	mov    WORD PTR [ebx+0xc],0x0
  4cb56a:	c7 43 08 00 00 00 00 	mov    DWORD PTR [ebx+0x8],0x0
  4cb571:	c6 43 25 00          	mov    BYTE PTR [ebx+0x25],0x0
  4cb575:	66 c7 43 42 02 00    	mov    WORD PTR [ebx+0x42],0x2
  4cb57b:	6a 03                	push   0x3
  4cb57d:	53                   	push   ebx
  4cb57e:	55                   	push   ebp
  4cb57f:	e8 fc a6 02 00       	call   0x4f5c80
  4cb584:	83 c4 0c             	add    esp,0xc
  4cb587:	5d                   	pop    ebp
  4cb588:	5f                   	pop    edi
  4cb589:	5e                   	pop    esi
  4cb58a:	5b                   	pop    ebx
  4cb58b:	81 c4 c0 00 00 00    	add    esp,0xc0
  4cb591:	c3                   	ret
  4cb592:	bf ff ff ff ff       	mov    edi,0xffffffff
  4cb597:	33 f6                	xor    esi,esi
  4cb599:	55                   	push   ebp
  4cb59a:	e8 81 aa 02 00       	call   0x4f6020
  4cb59f:	66 89 44 24 30       	mov    WORD PTR [esp+0x30],ax
  4cb5a4:	83 c4 04             	add    esp,0x4
  4cb5a7:	8a 4b 25             	mov    cl,BYTE PTR [ebx+0x25]
  4cb5aa:	80 f9 07             	cmp    cl,0x7
  4cb5ad:	0f 83 00 01 00 00    	jae    0x4cb6b3
  4cb5b3:	fe c1                	inc    cl
  4cb5b5:	33 c0                	xor    eax,eax
  4cb5b7:	8a c1                	mov    al,cl
  4cb5b9:	88 4b 25             	mov    BYTE PTR [ebx+0x25],cl
  4cb5bc:	48                   	dec    eax
  4cb5bd:	83 f8 05             	cmp    eax,0x5
  4cb5c0:	0f 87 e5 00 00 00    	ja     0x4cb6ab
  4cb5c6:	ff 24 85 24 cb 4c 00 	jmp    DWORD PTR [eax*4+0x4ccb24]
  4cb5cd:	33 c0                	xor    eax,eax
  4cb5cf:	b9 64 00 00 00       	mov    ecx,0x64
  4cb5d4:	8a 43 48             	mov    al,BYTE PTR [ebx+0x48]
  4cb5d7:	bf 02 00 00 00       	mov    edi,0x2
  4cb5dc:	0f af 43 36          	imul   eax,DWORD PTR [ebx+0x36]
  4cb5e0:	99                   	cdq
  4cb5e1:	f7 f9                	idiv   ecx
  4cb5e3:	8b f0                	mov    esi,eax
  4cb5e5:	e9 c1 00 00 00       	jmp    0x4cb6ab
  4cb5ea:	33 c0                	xor    eax,eax
  4cb5ec:	b9 64 00 00 00       	mov    ecx,0x64
  4cb5f1:	8a 43 49             	mov    al,BYTE PTR [ebx+0x49]
  4cb5f4:	bf 03 00 00 00       	mov    edi,0x3
  4cb5f9:	0f af 43 36          	imul   eax,DWORD PTR [ebx+0x36]
  4cb5fd:	99                   	cdq
  4cb5fe:	f7 f9                	idiv   ecx
  4cb600:	8b f0                	mov    esi,eax
  4cb602:	e9 a4 00 00 00       	jmp    0x4cb6ab
  4cb607:	33 c0                	xor    eax,eax
  4cb609:	b9 64 00 00 00       	mov    ecx,0x64
  4cb60e:	8a 43 4a             	mov    al,BYTE PTR [ebx+0x4a]
  4cb611:	bf 04 00 00 00       	mov    edi,0x4
  4cb616:	0f af 43 36          	imul   eax,DWORD PTR [ebx+0x36]
  4cb61a:	99                   	cdq
  4cb61b:	f7 f9                	idiv   ecx
  4cb61d:	8b f0                	mov    esi,eax
  4cb61f:	e9 87 00 00 00       	jmp    0x4cb6ab
  4cb624:	33 c0                	xor    eax,eax
  4cb626:	b9 64 00 00 00       	mov    ecx,0x64
  4cb62b:	8a 43 4b             	mov    al,BYTE PTR [ebx+0x4b]
  4cb62e:	bf 05 00 00 00       	mov    edi,0x5
  4cb633:	0f af 43 36          	imul   eax,DWORD PTR [ebx+0x36]
  4cb637:	99                   	cdq
  4cb638:	f7 f9                	idiv   ecx
  4cb63a:	8b f0                	mov    esi,eax
  4cb63c:	eb 6d                	jmp    0x4cb6ab
  4cb63e:	33 c0                	xor    eax,eax
  4cb640:	b9 64 00 00 00       	mov    ecx,0x64
  4cb645:	8a 43 4c             	mov    al,BYTE PTR [ebx+0x4c]
  4cb648:	bf 06 00 00 00       	mov    edi,0x6
  4cb64d:	0f af 43 36          	imul   eax,DWORD PTR [ebx+0x36]
  4cb651:	99                   	cdq
  4cb652:	f7 f9                	idiv   ecx
  4cb654:	8b f0                	mov    esi,eax
  4cb656:	eb 53                	jmp    0x4cb6ab
  4cb658:	80 7b 4d 00          	cmp    BYTE PTR [ebx+0x4d],0x0
  4cb65c:	74 46                	je     0x4cb6a4
  4cb65e:	55                   	push   ebp
  4cb65f:	e8 3c 6f 02 00       	call   0x4f25a0
  4cb664:	83 c4 04             	add    esp,0x4
  4cb667:	8b f0                	mov    esi,eax
  4cb669:	85 f6                	test   esi,esi
  4cb66b:	74 37                	je     0x4cb6a4
  4cb66d:	56                   	push   esi
  4cb66e:	e8 bd 6d 02 00       	call   0x4f2430
  4cb673:	83 c4 04             	add    esp,0x4
  4cb676:	85 c0                	test   eax,eax
  4cb678:	75 2a                	jne    0x4cb6a4
  4cb67a:	66 ff 43 0c          	inc    WORD PTR [ebx+0xc]
  4cb67e:	83 66 10 bf          	and    DWORD PTR [esi+0x10],0xffffffbf
  4cb682:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  4cb686:	75 1c                	jne    0x4cb6a4
  4cb688:	8a 46 2c             	mov    al,BYTE PTR [esi+0x2c]
  4cb68b:	56                   	push   esi
  4cb68c:	88 46 7d             	mov    BYTE PTR [esi+0x7d],al
  4cb68f:	e8 5c 20 02 00       	call   0x4ed6f0
  4cb694:	83 c4 04             	add    esp,0x4
  4cb697:	c6 46 2c 0e          	mov    BYTE PTR [esi+0x2c],0xe
  4cb69b:	56                   	push   esi
  4cb69c:	e8 9f 1f 02 00       	call   0x4ed640
  4cb6a1:	83 c4 04             	add    esp,0x4
  4cb6a4:	33 f6                	xor    esi,esi
  4cb6a6:	bf 07 00 00 00       	mov    edi,0x7
  4cb6ab:	85 f6                	test   esi,esi
  4cb6ad:	0f 84 f4 fe ff ff    	je     0x4cb5a7
  4cb6b3:	83 fe 64             	cmp    esi,0x64
  4cb6b6:	7c 05                	jl     0x4cb6bd
  4cb6b8:	be 64 00 00 00       	mov    esi,0x64
  4cb6bd:	85 f6                	test   esi,esi
  4cb6bf:	7e 6c                	jle    0x4cb72d
  4cb6c1:	8b 44 24 2c          	mov    eax,DWORD PTR [esp+0x2c]
  4cb6c5:	68 08 d1 a0 00       	push   0xa0d108
  4cb6ca:	56                   	push   esi
  4cb6cb:	6a 07                	push   0x7
  4cb6cd:	50                   	push   eax
  4cb6ce:	6a 01                	push   0x1
  4cb6d0:	6a ff                	push   0xffffffff
  4cb6d2:	57                   	push   edi
  4cb6d3:	57                   	push   edi
  4cb6d4:	55                   	push   ebp
  4cb6d5:	e8 b6 cd 02 00       	call   0x4f8490
  4cb6da:	83 c4 24             	add    esp,0x24
  4cb6dd:	85 c0                	test   eax,eax
  4cb6df:	74 4c                	je     0x4cb72d
  4cb6e1:	66 01 43 0c          	add    WORD PTR [ebx+0xc],ax
  4cb6e5:	85 c0                	test   eax,eax
  4cb6e7:	7e 44                	jle    0x4cb72d
  4cb6e9:	bf 0a d1 a0 00       	mov    edi,0xa0d10a
  4cb6ee:	89 44 24 7c          	mov    DWORD PTR [esp+0x7c],eax
  4cb6f2:	33 c0                	xor    eax,eax
  4cb6f4:	66 8b 07             	mov    ax,WORD PTR [edi]
  4cb6f7:	8b 34 85 90 03 89 00 	mov    esi,DWORD PTR [eax*4+0x890390]
  4cb6fe:	83 66 10 bf          	and    DWORD PTR [esi+0x10],0xffffffbf
  4cb702:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  4cb706:	75 1c                	jne    0x4cb724
  4cb708:	8a 46 2c             	mov    al,BYTE PTR [esi+0x2c]
  4cb70b:	56                   	push   esi
  4cb70c:	88 46 7d             	mov    BYTE PTR [esi+0x7d],al
  4cb70f:	e8 dc 1f 02 00       	call   0x4ed6f0
  4cb714:	83 c4 04             	add    esp,0x4
  4cb717:	c6 46 2c 0e          	mov    BYTE PTR [esi+0x2c],0xe
  4cb71b:	56                   	push   esi
  4cb71c:	e8 1f 1f 02 00       	call   0x4ed640
  4cb721:	83 c4 04             	add    esp,0x4
  4cb724:	83 c7 04             	add    edi,0x4
  4cb727:	ff 4c 24 7c          	dec    DWORD PTR [esp+0x7c]
  4cb72b:	75 c5                	jne    0x4cb6f2
  4cb72d:	80 7b 25 07          	cmp    BYTE PTR [ebx+0x25],0x7
  4cb731:	0f 85 50 fe ff ff    	jne    0x4cb587
  4cb737:	0f bf 4b 0c          	movsx  ecx,WORD PTR [ebx+0xc]
  4cb73b:	8b 43 36             	mov    eax,DWORD PTR [ebx+0x36]
  4cb73e:	2b c1                	sub    eax,ecx
  4cb740:	85 c0                	test   eax,eax
  4cb742:	7e 6e                	jle    0x4cb7b2
  4cb744:	68 08 d1 a0 00       	push   0xa0d108
  4cb749:	50                   	push   eax
  4cb74a:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  4cb74e:	6a 07                	push   0x7
  4cb750:	50                   	push   eax
  4cb751:	6a 01                	push   0x1
  4cb753:	6a ff                	push   0xffffffff
  4cb755:	6a ff                	push   0xffffffff
  4cb757:	6a ff                	push   0xffffffff
  4cb759:	55                   	push   ebp
  4cb75a:	e8 31 cd 02 00       	call   0x4f8490
  4cb75f:	83 c4 24             	add    esp,0x24
  4cb762:	85 c0                	test   eax,eax
  4cb764:	74 4c                	je     0x4cb7b2
  4cb766:	66 01 43 0c          	add    WORD PTR [ebx+0xc],ax
  4cb76a:	85 c0                	test   eax,eax
  4cb76c:	7e 44                	jle    0x4cb7b2
  4cb76e:	bf 0a d1 a0 00       	mov    edi,0xa0d10a
  4cb773:	89 44 24 78          	mov    DWORD PTR [esp+0x78],eax
  4cb777:	33 c0                	xor    eax,eax
  4cb779:	66 8b 07             	mov    ax,WORD PTR [edi]
  4cb77c:	8b 34 85 90 03 89 00 	mov    esi,DWORD PTR [eax*4+0x890390]
  4cb783:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  4cb787:	75 1c                	jne    0x4cb7a5
  4cb789:	8a 46 2c             	mov    al,BYTE PTR [esi+0x2c]
  4cb78c:	56                   	push   esi
  4cb78d:	88 46 7d             	mov    BYTE PTR [esi+0x7d],al
  4cb790:	e8 5b 1f 02 00       	call   0x4ed6f0
  4cb795:	83 c4 04             	add    esp,0x4
  4cb798:	c6 46 2c 0e          	mov    BYTE PTR [esi+0x2c],0xe
  4cb79c:	56                   	push   esi
  4cb79d:	e8 9e 1e 02 00       	call   0x4ed640
  4cb7a2:	83 c4 04             	add    esp,0x4
  4cb7a5:	83 66 10 bf          	and    DWORD PTR [esi+0x10],0xffffffbf
  4cb7a9:	83 c7 04             	add    edi,0x4
  4cb7ac:	ff 4c 24 78          	dec    DWORD PTR [esp+0x78]
  4cb7b0:	75 c5                	jne    0x4cb777
  4cb7b2:	66 83 7b 0c 00       	cmp    WORD PTR [ebx+0xc],0x0
  4cb7b7:	74 6b                	je     0x4cb824
  4cb7b9:	66 c7 43 42 04 00    	mov    WORD PTR [ebx+0x42],0x4
  4cb7bf:	c6 85 b1 05 00 00 14 	mov    BYTE PTR [ebp+0x5b1],0x14
  4cb7c6:	8a 43 31             	mov    al,BYTE PTR [ebx+0x31]
  4cb7c9:	be 00 00 00 00       	mov    esi,0x0
  4cb7ce:	24 01                	and    al,0x1
  4cb7d0:	8b bd 81 08 00 00    	mov    edi,DWORD PTR [ebp+0x881]
  4cb7d6:	3c 01                	cmp    al,0x1
  4cb7d8:	83 d6 ff             	adc    esi,0xffffffff
  4cb7db:	66 81 e6 00 20       	and    si,0x2000
  4cb7e0:	85 ff                	test   edi,edi
  4cb7e2:	74 25                	je     0x4cb809
  4cb7e4:	80 7f 2c 0e          	cmp    BYTE PTR [edi+0x2c],0xe
  4cb7e8:	75 18                	jne    0x4cb802
  4cb7ea:	8b 84 24 d8 00 00 00 	mov    eax,DWORD PTR [esp+0xd8]
  4cb7f1:	40                   	inc    eax
  4cb7f2:	50                   	push   eax
  4cb7f3:	57                   	push   edi
  4cb7f4:	e8 47 6c 02 00       	call   0x4f2440
  4cb7f9:	0f b7 ce             	movzx  ecx,si
  4cb7fc:	83 c4 08             	add    esp,0x8
  4cb7ff:	09 4f 14             	or     DWORD PTR [edi+0x14],ecx
  4cb802:	8b 7f 08             	mov    edi,DWORD PTR [edi+0x8]
  4cb805:	85 ff                	test   edi,edi
  4cb807:	75 db                	jne    0x4cb7e4
  4cb809:	f6 43 31 02          	test   BYTE PTR [ebx+0x31],0x2
  4cb80d:	0f 84 74 fd ff ff    	je     0x4cb587
  4cb813:	66 c7 43 42 07 00    	mov    WORD PTR [ebx+0x42],0x7
  4cb819:	5d                   	pop    ebp
  4cb81a:	5f                   	pop    edi
  4cb81b:	5e                   	pop    esi
  4cb81c:	5b                   	pop    ebx
  4cb81d:	81 c4 c0 00 00 00    	add    esp,0xc0
  4cb823:	c3                   	ret

/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386

Contents of section .text:
 4ccac4 5eb54c00 87b54c00 7bb54c00 92b54c00  ^.L...L.{.L...L.
 4ccad4 47b84c00 5eb84c00 b7b84c00 e8b84c00  G.L.^.L...L...L.
 4ccae4 8cb94c00 2fba4c00 c4bb4c00 edbf4c00  ..L./.L...L...L.
 4ccaf4 04c04c00 a1c04c00 bdc04c00 d4c04c00  ..L...L...L...L.
 4ccb04 12c14c00 08c34c00 3fc74c00 71c74c00  ..L...L.?.L.q.L.
 4ccb14 c0c74c00 d7c74c00 4aca4c00 6bca4c00  ..L...L.J.L.k.L.
 4ccb24 cdb54c00 eab54c00 07b64c00 24b64c00  ..L...L...L.$.L.
 4ccb34 3eb64c00 58b64c00                    >.L.X.L.
