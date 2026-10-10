
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044c4a0 <.text+0x4b4a0>:
  44c4a0:	8b 54 24 04          	mov    edx,DWORD PTR [esp+0x4]
  44c4a4:	56                   	push   esi
  44c4a5:	57                   	push   edi
  44c4a6:	8b 7a 5f             	mov    edi,DWORD PTR [edx+0x5f]
  44c4a9:	8b 42 22             	mov    eax,DWORD PTR [edx+0x22]
  44c4ac:	83 f8 05             	cmp    eax,0x5
  44c4af:	75 13                	jne    0x44c4c4
  44c4b1:	8b ca                	mov    ecx,edx
  44c4b3:	8b 74 24 10          	mov    esi,DWORD PTR [esp+0x10]
  44c4b7:	2b ce                	sub    ecx,esi
  44c4b9:	83 f9 e4             	cmp    ecx,0xffffffe4
  44c4bc:	0f 84 98 00 00 00    	je     0x44c55a
  44c4c2:	eb 04                	jmp    0x44c4c8
  44c4c4:	8b 74 24 10          	mov    esi,DWORD PTR [esp+0x10]
  44c4c8:	48                   	dec    eax
  44c4c9:	83 f8 07             	cmp    eax,0x7
  44c4cc:	0f 87 88 00 00 00    	ja     0x44c55a
  44c4d2:	ff 24 85 60 c5 44 00 	jmp    DWORD PTR [eax*4+0x44c560]
  44c4d9:	5f                   	pop    edi
  44c4da:	c7 06 00 00 00 00    	mov    DWORD PTR [esi],0x0
  44c4e0:	5e                   	pop    esi
  44c4e1:	c3                   	ret
  44c4e2:	83 3e 05             	cmp    DWORD PTR [esi],0x5
  44c4e5:	7f 0e                	jg     0x44c4f5
  44c4e7:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  44c4eb:	85 c0                	test   eax,eax
  44c4ed:	74 06                	je     0x44c4f5
  44c4ef:	52                   	push   edx
  44c4f0:	ff d0                	call   eax
  44c4f2:	83 c4 04             	add    esp,0x4
  44c4f5:	5f                   	pop    edi
  44c4f6:	c7 06 00 00 00 00    	mov    DWORD PTR [esi],0x0
  44c4fc:	5e                   	pop    esi
  44c4fd:	c3                   	ret
  44c4fe:	8a 42 2a             	mov    al,BYTE PTR [edx+0x2a]
  44c501:	34 01                	xor    al,0x1
  44c503:	88 42 2a             	mov    BYTE PTR [edx+0x2a],al
  44c506:	24 01                	and    al,0x1
  44c508:	88 42 2a             	mov    BYTE PTR [edx+0x2a],al
  44c50b:	74 0e                	je     0x44c51b
  44c50d:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  44c511:	85 c0                	test   eax,eax
  44c513:	74 06                	je     0x44c51b
  44c515:	52                   	push   edx
  44c516:	ff d0                	call   eax
  44c518:	83 c4 04             	add    esp,0x4
  44c51b:	5f                   	pop    edi
  44c51c:	c7 06 00 00 00 00    	mov    DWORD PTR [esi],0x0
  44c522:	5e                   	pop    esi
  44c523:	c3                   	ret
  44c524:	8b 07                	mov    eax,DWORD PTR [edi]
  44c526:	33 c9                	xor    ecx,ecx
  44c528:	40                   	inc    eax
  44c529:	89 07                	mov    DWORD PTR [edi],eax
  44c52b:	8a 4a 2a             	mov    cl,BYTE PTR [edx+0x2a]
  44c52e:	3b c8                	cmp    ecx,eax
  44c530:	7d 06                	jge    0x44c538
  44c532:	c7 07 00 00 00 00    	mov    DWORD PTR [edi],0x0
  44c538:	83 3e 00             	cmp    DWORD PTR [esi],0x0
  44c53b:	74 0e                	je     0x44c54b
  44c53d:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  44c541:	85 c0                	test   eax,eax
  44c543:	74 06                	je     0x44c54b
  44c545:	52                   	push   edx
  44c546:	ff d0                	call   eax
  44c548:	83 c4 04             	add    esp,0x4
  44c54b:	5f                   	pop    edi
  44c54c:	c7 06 00 00 00 00    	mov    DWORD PTR [esi],0x0
  44c552:	5e                   	pop    esi
  44c553:	c3                   	ret
  44c554:	c7 06 00 00 00 00    	mov    DWORD PTR [esi],0x0
  44c55a:	5f                   	pop    edi
  44c55b:	5e                   	pop    esi
  44c55c:	c3                   	ret
  44c55d:	8d 49 00             	lea    ecx,[ecx+0x0]
  44c560:	d9 c4                	fld    st(4)
  44c562:	44                   	inc    esp
  44c563:	00 e2                	add    dl,ah
  44c565:	c4 44 00 fe          	les    eax,FWORD PTR [eax+eax*1-0x2]
  44c569:	c4 44 00 24          	les    eax,FWORD PTR [eax+eax*1+0x24]
  44c56d:	c5 44 00 d9          	lds    eax,FWORD PTR [eax+eax*1-0x27]
  44c571:	c4 44 00 5a          	les    eax,FWORD PTR [eax+eax*1+0x5a]
  44c575:	c5 44 00 5a          	lds    eax,FWORD PTR [eax+eax*1+0x5a]
  44c579:	c5 44 00 54          	lds    eax,FWORD PTR [eax+eax*1+0x54]
  44c57d:	c5 44 00 56          	lds    eax,FWORD PTR [eax+eax*1+0x56]
  44c581:	b9 01 00 00 00       	mov    ecx,0x1
  44c586:	39 0d 08 45 68 00    	cmp    DWORD PTR ds:0x684508,ecx
  44c58c:	7c 19                	jl     0x44c5a7
  44c58e:	b8 22 42 68 00       	mov    eax,0x684222
  44c593:	8b 54 24 08          	mov    edx,DWORD PTR [esp+0x8]
  44c597:	39 10                	cmp    DWORD PTR [eax],edx
  44c599:	74 0f                	je     0x44c5aa
  44c59b:	83 c0 06             	add    eax,0x6
  44c59e:	41                   	inc    ecx
  44c59f:	39 0d 08 45 68 00    	cmp    DWORD PTR ds:0x684508,ecx
  44c5a5:	7d f0                	jge    0x44c597
  44c5a7:	66 33 c9             	xor    cx,cx
  44c5aa:	66 85 c9             	test   cx,cx
  44c5ad:	74 65                	je     0x44c614
  44c5af:	0f bf c1             	movsx  eax,cx
  44c5b2:	8b 15 08 45 68 00    	mov    edx,DWORD PTR ds:0x684508
  44c5b8:	4a                   	dec    edx
  44c5b9:	3b c2                	cmp    eax,edx
  44c5bb:	7d 30                	jge    0x44c5ed
  44c5bd:	0f bf c1             	movsx  eax,cx
  44c5c0:	66 41                	inc    cx
  44c5c2:	8d 04 40             	lea    eax,[eax+eax*2]
  44c5c5:	03 c0                	add    eax,eax
  44c5c7:	8d 90 22 42 68 00    	lea    edx,[eax+0x684222]
  44c5cd:	8d b0 1c 42 68 00    	lea    esi,[eax+0x68421c]
  44c5d3:	8b 02                	mov    eax,DWORD PTR [edx]
  44c5d5:	89 06                	mov    DWORD PTR [esi],eax
  44c5d7:	66 8b 52 04          	mov    dx,WORD PTR [edx+0x4]
  44c5db:	0f bf c1             	movsx  eax,cx
  44c5de:	66 89 56 04          	mov    WORD PTR [esi+0x4],dx
  44c5e2:	8b 15 08 45 68 00    	mov    edx,DWORD PTR ds:0x684508
  44c5e8:	4a                   	dec    edx
  44c5e9:	3b c2                	cmp    eax,edx
  44c5eb:	7c d0                	jl     0x44c5bd
  44c5ed:	33 c9                	xor    ecx,ecx
  44c5ef:	ff 0d 08 45 68 00    	dec    DWORD PTR ds:0x684508
  44c5f5:	a1 08 45 68 00       	mov    eax,ds:0x684508
  44c5fa:	8d 14 40             	lea    edx,[eax+eax*2]
  44c5fd:	89 0c 55 1c 42 68 00 	mov    DWORD PTR [edx*2+0x68421c],ecx
  44c604:	a1 08 45 68 00       	mov    eax,ds:0x684508
  44c609:	8d 14 40             	lea    edx,[eax+eax*2]
  44c60c:	66 89 0c 55 20 42 68 	mov    WORD PTR [edx*2+0x684220],cx
  44c613:	00 
  44c614:	5e                   	pop    esi
  44c615:	c3                   	ret
  44c616:	cc                   	int3
  44c617:	cc                   	int3
  44c618:	cc                   	int3
  44c619:	cc                   	int3
  44c61a:	cc                   	int3
  44c61b:	cc                   	int3
  44c61c:	cc                   	int3
  44c61d:	cc                   	int3
  44c61e:	cc                   	int3
  44c61f:	cc                   	int3
  44c620:	b8 01 00 00 00       	mov    eax,0x1
  44c625:	39 05 08 45 68 00    	cmp    DWORD PTR ds:0x684508,eax
  44c62b:	7c 19                	jl     0x44c646
  44c62d:	ba 22 42 68 00       	mov    edx,0x684222
  44c632:	8b 4c 24 04          	mov    ecx,DWORD PTR [esp+0x4]
  44c636:	39 0a                	cmp    DWORD PTR [edx],ecx
  44c638:	74 0f                	je     0x44c649
  44c63a:	83 c2 06             	add    edx,0x6
  44c63d:	40                   	inc    eax
  44c63e:	39 05 08 45 68 00    	cmp    DWORD PTR ds:0x684508,eax
  44c644:	7d f0                	jge    0x44c636
  44c646:	66 33 c0             	xor    ax,ax
  44c649:	c3                   	ret
  44c64a:	cc                   	int3
  44c64b:	cc                   	int3
  44c64c:	cc                   	int3
  44c64d:	cc                   	int3
  44c64e:	cc                   	int3
  44c64f:	cc                   	int3
