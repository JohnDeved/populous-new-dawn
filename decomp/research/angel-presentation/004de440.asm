
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004de440 <.text+0xdd440>:
  4de440:	80 7c 24 0c 00       	cmp    BYTE PTR [esp+0xc],0x0
  4de445:	56                   	push   esi
  4de446:	57                   	push   edi
  4de447:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  4de44b:	8d 7e 33             	lea    edi,[esi+0x33]
  4de44e:	0f 85 ba 00 00 00    	jne    0x4de50e
  4de454:	66 8b 07             	mov    ax,WORD PTR [edi]
  4de457:	8b 54 24 10          	mov    edx,DWORD PTR [esp+0x10]
  4de45b:	0f bf c8             	movsx  ecx,ax
  4de45e:	3b ca                	cmp    ecx,edx
  4de460:	74 04                	je     0x4de466
  4de462:	66 89 56 7a          	mov    WORD PTR [esi+0x7a],dx
  4de466:	66 8b 4e 7a          	mov    cx,WORD PTR [esi+0x7a]
  4de46a:	66 3b c8             	cmp    cx,ax
  4de46d:	0f 84 f3 00 00 00    	je     0x4de566
  4de473:	0f bf c1             	movsx  eax,cx
  4de476:	33 d2                	xor    edx,edx
  4de478:	83 f8 3e             	cmp    eax,0x3e
  4de47b:	74 07                	je     0x4de484
  4de47d:	83 f8 45             	cmp    eax,0x45
  4de480:	74 0d                	je     0x4de48f
  4de482:	eb 1e                	jmp    0x4de4a2
  4de484:	8a 46 7c             	mov    al,BYTE PTR [esi+0x7c]
  4de487:	3c 05                	cmp    al,0x5
  4de489:	7d 12                	jge    0x4de49d
  4de48b:	fe c0                	inc    al
  4de48d:	eb 09                	jmp    0x4de498
  4de48f:	8a 46 7c             	mov    al,BYTE PTR [esi+0x7c]
  4de492:	84 c0                	test   al,al
  4de494:	7e 07                	jle    0x4de49d
  4de496:	fe c8                	dec    al
  4de498:	88 46 7c             	mov    BYTE PTR [esi+0x7c],al
  4de49b:	eb 05                	jmp    0x4de4a2
  4de49d:	ba 01 00 00 00       	mov    edx,0x1
  4de4a2:	85 d2                	test   edx,edx
  4de4a4:	75 30                	jne    0x4de4d6
  4de4a6:	b1 02                	mov    cl,0x2
  4de4a8:	8a 46 7c             	mov    al,BYTE PTR [esi+0x7c]
  4de4ab:	66 98                	cbw
  4de4ad:	f6 f9                	idiv   cl
  4de4af:	0f be c0             	movsx  eax,al
  4de4b2:	83 c0 4c             	add    eax,0x4c
  4de4b5:	66 83 7e 74 00       	cmp    WORD PTR [esi+0x74],0x0
  4de4ba:	75 06                	jne    0x4de4c2
  4de4bc:	66 c7 46 74 45 00    	mov    WORD PTR [esi+0x74],0x45
  4de4c2:	6a 02                	push   0x2
  4de4c4:	50                   	push   eax
  4de4c5:	0f bf 46 74          	movsx  eax,WORD PTR [esi+0x74]
  4de4c9:	50                   	push   eax
  4de4ca:	56                   	push   esi
  4de4cb:	e8 60 e7 f2 ff       	call   0x40cc30
  4de4d0:	83 c4 10             	add    esp,0x10
  4de4d3:	5f                   	pop    edi
  4de4d4:	5e                   	pop    esi
  4de4d5:	c3                   	ret
  4de4d6:	51                   	push   ecx
  4de4d7:	6a 04                	push   0x4
  4de4d9:	57                   	push   edi
  4de4da:	e8 21 02 01 00       	call   0x4ee700
  4de4df:	0f bf 07             	movsx  eax,WORD PTR [edi]
  4de4e2:	83 c4 0c             	add    esp,0xc
  4de4e5:	8b 0d c1 5e 89 00    	mov    ecx,DWORD PTR ds:0x895ec1
  4de4eb:	8d 04 40             	lea    eax,[eax+eax*2]
  4de4ee:	03 c0                	add    eax,eax
  4de4f0:	8d 14 c0             	lea    edx,[eax+eax*8]
  4de4f3:	8a 44 0a 07          	mov    al,BYTE PTR [edx+ecx*1+0x7]
  4de4f7:	5f                   	pop    edi
  4de4f8:	88 46 3b             	mov    BYTE PTR [esi+0x3b],al
  4de4fb:	66 8b 46 35          	mov    ax,WORD PTR [esi+0x35]
  4de4ff:	80 cc 80             	or     ah,0x80
  4de502:	66 89 46 35          	mov    WORD PTR [esi+0x35],ax
  4de506:	0c 80                	or     al,0x80
  4de508:	66 89 46 35          	mov    WORD PTR [esi+0x35],ax
  4de50c:	5e                   	pop    esi
  4de50d:	c3                   	ret
  4de50e:	8b                   	.byte 0x8b
  4de50f:	54                   	push   esp

d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004de50e <.text+0xdd50e>:
  4de50e:	8b 54 24 10          	mov    edx,DWORD PTR [esp+0x10]
  4de512:	52                   	push   edx
  4de513:	6a 04                	push   0x4
  4de515:	57                   	push   edi
  4de516:	e8 e5 01 01 00       	call   0x4ee700
  4de51b:	66 8b 3f             	mov    di,WORD PTR [edi]
  4de51e:	83 c4 0c             	add    esp,0xc
  4de521:	0f bf d7             	movsx  edx,di
  4de524:	8b 0d c1 5e 89 00    	mov    ecx,DWORD PTR ds:0x895ec1
  4de52a:	8d 04 52             	lea    eax,[edx+edx*2]
  4de52d:	03 c0                	add    eax,eax
  4de52f:	8d 04 c0             	lea    eax,[eax+eax*8]
  4de532:	8a 44 08 07          	mov    al,BYTE PTR [eax+ecx*1+0x7]
  4de536:	66 89 7e 7a          	mov    WORD PTR [esi+0x7a],di
  4de53a:	88 46 3b             	mov    BYTE PTR [esi+0x3b],al
  4de53d:	66 8b 46 35          	mov    ax,WORD PTR [esi+0x35]
  4de541:	80 cc 80             	or     ah,0x80
  4de544:	66 89 46 35          	mov    WORD PTR [esi+0x35],ax
  4de548:	0c 80                	or     al,0x80
  4de54a:	66 89 46 35          	mov    WORD PTR [esi+0x35],ax
  4de54e:	83 fa 3e             	cmp    edx,0x3e
  4de551:	74 08                	je     0x4de55b
  4de553:	83 fa 45             	cmp    edx,0x45
  4de556:	74 0a                	je     0x4de562
  4de558:	5f                   	pop    edi
  4de559:	5e                   	pop    esi
  4de55a:	c3                   	ret
  4de55b:	c6 46 7c 03          	mov    BYTE PTR [esi+0x7c],0x3
  4de55f:	5f                   	pop    edi
  4de560:	5e                   	pop    esi
  4de561:	c3                   	ret
  4de562:	c6 46 7c 00          	mov    BYTE PTR [esi+0x7c],0x0
  4de566:	5f                   	pop    edi
  4de567:	5e                   	pop    esi
  4de568:	c3                   	ret
  4de569:	cc                   	int3
  4de56a:	cc                   	int3
  4de56b:	cc                   	int3
  4de56c:	cc                   	int3
  4de56d:	cc                   	int3
  4de56e:	cc                   	int3
  4de56f:	cc                   	int3
  4de570:	56                   	push   esi
  4de571:	57                   	push   edi
  4de572:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  4de576:	8a 46 7b             	mov    al,BYTE PTR [esi+0x7b]
  4de579:	3c c8                	cmp    al,0xc8
  4de57b:	73 05                	jae    0x4de582
  4de57d:	fe c0                	inc    al
  4de57f:	88                   	.byte 0x88
