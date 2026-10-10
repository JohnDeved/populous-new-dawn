
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004ba410 <.text+0xb9410>:
  4ba410:	83 ec 0c             	sub    esp,0xc
  4ba413:	8d 44 24 04          	lea    eax,[esp+0x4]
  4ba417:	53                   	push   ebx
  4ba418:	56                   	push   esi
  4ba419:	57                   	push   edi
  4ba41a:	8b 74 24 1c          	mov    esi,DWORD PTR [esp+0x1c]
  4ba41e:	50                   	push   eax
  4ba41f:	56                   	push   esi
  4ba420:	e8 9b fb ff ff       	call   0x4b9fc0
  4ba425:	66 8b 4c 24 18       	mov    cx,WORD PTR [esp+0x18]
  4ba42a:	83 c4 08             	add    esp,0x8
  4ba42d:	66 8b 44 24 12       	mov    ax,WORD PTR [esp+0x12]
  4ba432:	88 6c 24 0e          	mov    BYTE PTR [esp+0xe],ch
  4ba436:	33 c9                	xor    ecx,ecx
  4ba438:	88 64 24 0f          	mov    BYTE PTR [esp+0xf],ah
  4ba43c:	66 8b 4c 24 0e       	mov    cx,WORD PTR [esp+0xe]
  4ba441:	33 c0                	xor    eax,eax
  4ba443:	66 8b 44 24 0e       	mov    ax,WORD PTR [esp+0xe]
  4ba448:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  4ba44e:	25 fe 00 00 00       	and    eax,0xfe
  4ba453:	33 db                	xor    ebx,ebx
  4ba455:	03 c0                	add    eax,eax
  4ba457:	0b c1                	or     eax,ecx
  4ba459:	81 24 85 e4 03 8a 00 	and    DWORD PTR [eax*4+0x8a03e4],0xffffbfff
  4ba460:	ff bf ff ff 
  4ba464:	66 8b 46 3d          	mov    ax,WORD PTR [esi+0x3d]
  4ba468:	66 8b 4e 3f          	mov    cx,WORD PTR [esi+0x3f]
  4ba46c:	88 64 24 0e          	mov    BYTE PTR [esp+0xe],ah
  4ba470:	33 c0                	xor    eax,eax
  4ba472:	88 6c 24 0f          	mov    BYTE PTR [esp+0xf],ch
  4ba476:	66 8b 44 24 0e       	mov    ax,WORD PTR [esp+0xe]
  4ba47b:	25 fe 00 00 00       	and    eax,0xfe
  4ba480:	8d 0c 45 00 00 00 00 	lea    ecx,[eax*2+0x0]
  4ba487:	33 c0                	xor    eax,eax
  4ba489:	66 8b 44 24 0e       	mov    ax,WORD PTR [esp+0xe]
  4ba48e:	25 00 fe 00 00       	and    eax,0xfe00
  4ba493:	0b c8                	or     ecx,eax
  4ba495:	66 8b 04 8d ec 03 8a 	mov    ax,WORD PTR [ecx*4+0x8a03ec]
  4ba49c:	00 
  4ba49d:	66 25 ff 03          	and    ax,0x3ff
  4ba4a1:	74 67                	je     0x4ba50a
  4ba4a3:	0f b7 c0             	movzx  eax,ax
  4ba4a6:	33 ff                	xor    edi,edi
  4ba4a8:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  4ba4af:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  4ba4b3:	75 07                	jne    0x4ba4bc
  4ba4b5:	38 58 2a             	cmp    BYTE PTR [eax+0x2a],bl
  4ba4b8:	74 02                	je     0x4ba4bc
  4ba4ba:	8b f8                	mov    edi,eax
  4ba4bc:	85 ff                	test   edi,edi
  4ba4be:	74 4a                	je     0x4ba50a
  4ba4c0:	33 c0                	xor    eax,eax
  4ba4c2:	8a 47 2a             	mov    al,BYTE PTR [edi+0x2a]
  4ba4c5:	83 f8 02             	cmp    eax,0x2
  4ba4c8:	74 07                	je     0x4ba4d1
  4ba4ca:	83 f8 09             	cmp    eax,0x9
  4ba4cd:	74 1a                	je     0x4ba4e9
  4ba4cf:	eb 39                	jmp    0x4ba50a
  4ba4d1:	8a 86 a0 00 00 00    	mov    al,BYTE PTR [esi+0xa0]
  4ba4d7:	50                   	push   eax
  4ba4d8:	57                   	push   edi
  4ba4d9:	e8 22 e8 f4 ff       	call   0x408d00
  4ba4de:	83 c4 08             	add    esp,0x8
  4ba4e1:	80 7f 2b 0a          	cmp    BYTE PTR [edi+0x2b],0xa
  4ba4e5:	75 23                	jne    0x4ba50a
  4ba4e7:	eb 1c                	jmp    0x4ba505
  4ba4e9:	66 8b 87 92 00 00 00 	mov    ax,WORD PTR [edi+0x92]
  4ba4f0:	66 85 c0             	test   ax,ax
  4ba4f3:	74 15                	je     0x4ba50a
  4ba4f5:	0f bf c0             	movsx  eax,ax
  4ba4f8:	8b 0c 85 90 03 89 00 	mov    ecx,DWORD PTR [eax*4+0x890390]
  4ba4ff:	80 79 2b 0a          	cmp    BYTE PTR [ecx+0x2b],0xa
  4ba503:	75 05                	jne    0x4ba50a
  4ba505:	bb 01 00 00 00       	mov    ebx,0x1
  4ba50a:	80 be 9e 00 00 00 0a 	cmp    BYTE PTR [esi+0x9e],0xa
  4ba511:	75 2d                	jne    0x4ba540
  4ba513:	85 db                	test   ebx,ebx
  4ba515:	75 29                	jne    0x4ba540
  4ba517:	66 8b 46 3d          	mov    ax,WORD PTR [esi+0x3d]
  4ba51b:	66 c1 e8 08          	shr    ax,0x8
  4ba51f:	24 fe                	and    al,0xfe
  4ba521:	88 44 24 0e          	mov    BYTE PTR [esp+0xe],al
  4ba525:	66 8b 46 3f          	mov    ax,WORD PTR [esi+0x3f]
  4ba529:	66 c1 e8 08          	shr    ax,0x8
  4ba52d:	24 fe                	and    al,0xfe
  4ba52f:	88 44 24 0f          	mov    BYTE PTR [esp+0xf],al
  4ba533:	8b 4c 24 0e          	mov    ecx,DWORD PTR [esp+0xe]
  4ba537:	51                   	push   ecx
  4ba538:	e8 83 2a f7 ff       	call   0x42cfc0
  4ba53d:	83 c4 04             	add    esp,0x4
  4ba540:	8d 44 24 14          	lea    eax,[esp+0x14]
  4ba544:	50                   	push   eax
  4ba545:	56                   	push   esi
  4ba546:	e8 75 fa ff ff       	call   0x4b9fc0
  4ba54b:	66 8b 44 24 1c       	mov    ax,WORD PTR [esp+0x1c]
  4ba550:	83 c4 08             	add    esp,0x8
  4ba553:	66 c1 e8 08          	shr    ax,0x8
  4ba557:	24 fe                	and    al,0xfe
  4ba559:	88 44 24 0e          	mov    BYTE PTR [esp+0xe],al
  4ba55d:	8d 56 66             	lea    edx,[esi+0x66]
  4ba560:	66 8b 44 24 16       	mov    ax,WORD PTR [esp+0x16]
  4ba565:	66 c1 e8 08          	shr    ax,0x8
  4ba569:	24 fe                	and    al,0xfe
  4ba56b:	88 44 24 0f          	mov    BYTE PTR [esp+0xf],al
  4ba56f:	8b 4c 24 0e          	mov    ecx,DWORD PTR [esp+0xe]
  4ba573:	51                   	push   ecx
  4ba574:	52                   	push   edx
  4ba575:	e8 f6 91 fd ff       	call   0x493770
  4ba57a:	83 c4 08             	add    esp,0x8
  4ba57d:	56                   	push   esi
  4ba57e:	e8 6d 37 03 00       	call   0x4edcf0
  4ba583:	83 c4 04             	add    esp,0x4
  4ba586:	5f                   	pop    edi
  4ba587:	5e                   	pop    esi
  4ba588:	5b                   	pop    ebx
  4ba589:	83 c4 0c             	add    esp,0xc
  4ba58c:	c3                   	ret
  4ba58d:	cc                   	int3
  4ba58e:	cc                   	int3
  4ba58f:	cc                   	int3
