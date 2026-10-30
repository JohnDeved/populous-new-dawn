
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044a2f0 <.text+0x492f0>:
  44a2f0:	81 ec 1c 03 00 00    	sub    esp,0x31c
  44a2f6:	53                   	push   ebx
  44a2f7:	56                   	push   esi
  44a2f8:	66 be 3a 00          	mov    si,0x3a
  44a2fc:	57                   	push   edi
  44a2fd:	55                   	push   ebp
  44a2fe:	e8 0d 8f 04 00       	call   0x493210
  44a303:	85 c0                	test   eax,eax
  44a305:	74 0d                	je     0x44a314
  44a307:	6a 3a                	push   0x3a
  44a309:	e8 12 96 00 00       	call   0x453920
  44a30e:	66 8b f0             	mov    si,ax
  44a311:	83 c4 04             	add    esp,0x4
  44a314:	83 3d 18 42 68 00 00 	cmp    DWORD PTR ds:0x684218,0x0
  44a31b:	0f 84 9f 08 00 00    	je     0x44abc0
  44a321:	83 3d 9d b6 68 00 00 	cmp    DWORD PTR ds:0x68b69d,0x0
  44a328:	0f 84 92 08 00 00    	je     0x44abc0
  44a32e:	6a 02                	push   0x2
  44a330:	e8 3b 70 00 00       	call   0x451370
  44a335:	83 c4 04             	add    esp,0x4
  44a338:	85 c0                	test   eax,eax
  44a33a:	0f 85 80 08 00 00    	jne    0x44abc0
  44a340:	f6 05 69 c6 89 00 20 	test   BYTE PTR ds:0x89c669,0x20
  44a347:	0f 85 73 08 00 00    	jne    0x44abc0
  44a34d:	66 83 3d a1 b6 68 00 	cmp    WORD PTR ds:0x68b6a1,0x0
  44a354:	00 
  44a355:	0f 84 65 08 00 00    	je     0x44abc0
  44a35b:	c6 44 24 11 01       	mov    BYTE PTR [esp+0x11],0x1
  44a360:	0f bf 05 cf c6 89 00 	movsx  eax,WORD PTR ds:0x89c6cf
  44a367:	0f bf 0d d1 c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6d1
  44a36e:	66 81 3d d1 c6 89 00 	cmp    WORD PTR ds:0x89c6d1,0x258
  44a375:	58 02 
  44a377:	bf 03 00 00 00       	mov    edi,0x3
  44a37c:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  44a380:	89 4c 24 24          	mov    DWORD PTR [esp+0x24],ecx
  44a384:	7f 05                	jg     0x44a38b
  44a386:	bf 04 00 00 00       	mov    edi,0x4
  44a38b:	c6 05 9c 48 98 00 50 	mov    BYTE PTR ds:0x98489c,0x50
  44a392:	e8 79 8e 04 00       	call   0x493210
  44a397:	85 c0                	test   eax,eax
  44a399:	8b 04 bd d0 cb 87 00 	mov    eax,DWORD PTR [edi*4+0x87cbd0]
  44a3a0:	50                   	push   eax
  44a3a1:	74 0a                	je     0x44a3ad
  44a3a3:	e8 98 77 00 00       	call   0x451b40
  44a3a8:	83 c4 04             	add    esp,0x4
  44a3ab:	eb 0d                	jmp    0x44a3ba
  44a3ad:	68 88 16 59 00       	push   0x591688
  44a3b2:	e8 79 c9 0c 00       	call   0x516d30
  44a3b7:	83 c4 08             	add    esp,0x8
  44a3ba:	e8 81 f6 04 00       	call   0x499a40
  44a3bf:	85 c0                	test   eax,eax
  44a3c1:	0f 84 b2 01 00 00    	je     0x44a579
  44a3c7:	33 db                	xor    ebx,ebx
  44a3c9:	66 39 35 a1 b6 68 00 	cmp    WORD PTR ds:0x68b6a1,si
  44a3d0:	74 14                	je     0x44a3e6
  44a3d2:	b8 a1 b6 68 00       	mov    eax,0x68b6a1
  44a3d7:	66 83 38 00          	cmp    WORD PTR [eax],0x0
  44a3db:	74 09                	je     0x44a3e6
  44a3dd:	83 c0 02             	add    eax,0x2
  44a3e0:	43                   	inc    ebx
  44a3e1:	66 39 30             	cmp    WORD PTR [eax],si
  44a3e4:	75 f1                	jne    0x44a3d7
  44a3e6:	bd 07 00 00 00       	mov    ebp,0x7
  44a3eb:	68 a1 b6 68 00       	push   0x68b6a1
  44a3f0:	2b eb                	sub    ebp,ebx
  44a3f2:	e8 89 12 11 00       	call   0x55b680
  44a3f7:	83 c4 04             	add    esp,0x4
  44a3fa:	8d 48 06             	lea    ecx,[eax+0x6]
  44a3fd:	66 c7 44 24 2c 20 00 	mov    WORD PTR [esp+0x2c],0x20
  44a404:	a1 6a bc 89 00       	mov    eax,ds:0x89bc6a
  44a409:	83 f8 09             	cmp    eax,0x9
  44a40c:	74 0c                	je     0x44a41a
  44a40e:	83 f8 0a             	cmp    eax,0xa
  44a411:	74 10                	je     0x44a423
  44a413:	83 f8 0b             	cmp    eax,0xb
  44a416:	74 14                	je     0x44a42c
  44a418:	eb 19                	jmp    0x44a433
  44a41a:	66 c7 44 24 2c 40 a1 	mov    WORD PTR [esp+0x2c],0xa140
  44a421:	eb 10                	jmp    0x44a433
  44a423:	66 c7 44 24 2c a1 a1 	mov    WORD PTR [esp+0x2c],0xa1a1
  44a42a:	eb 07                	jmp    0x44a433
  44a42c:	66 c7 44 24 2c 40 81 	mov    WORD PTR [esp+0x2c],0x8140
  44a433:	85 ed                	test   ebp,ebp
  44a435:	0f 8e a7 00 00 00    	jle    0x44a4e2
  44a43b:	83 f9 07             	cmp    ecx,0x7
  44a43e:	7c 2b                	jl     0x44a46b
  44a440:	8b c1                	mov    eax,ecx
  44a442:	8d 14 4d a1 b6 68 00 	lea    edx,[ecx*2+0x68b6a1]
  44a449:	2b c5                	sub    eax,ebp
  44a44b:	8d 3c 45 a1 b6 68 00 	lea    edi,[eax*2+0x68b6a1]
  44a452:	8d 41 fa             	lea    eax,[ecx-0x6]
  44a455:	2b c8                	sub    ecx,eax
  44a457:	66 8b 07             	mov    ax,WORD PTR [edi]
  44a45a:	83 ef 02             	sub    edi,0x2
  44a45d:	66 89 02             	mov    WORD PTR [edx],ax
  44a460:	83 ea 02             	sub    edx,0x2
  44a463:	81 fa af b6 68 00    	cmp    edx,0x68b6af
  44a469:	73 ec                	jae    0x44a457
  44a46b:	3b cb                	cmp    ecx,ebx
  44a46d:	7c 18                	jl     0x44a487
  44a46f:	8d 3c 4d a1 b6 68 00 	lea    edi,[ecx*2+0x68b6a1]
  44a476:	8b 44 24 2c          	mov    eax,DWORD PTR [esp+0x2c]
  44a47a:	2b cb                	sub    ecx,ebx
  44a47c:	25 ff ff 00 00       	and    eax,0xffff
  44a481:	fd                   	std
  44a482:	41                   	inc    ecx
  44a483:	f3 66 ab             	rep stos WORD PTR es:[edi],ax
  44a486:	fc                   	cld
  44a487:	b9 06 00 00 00       	mov    ecx,0x6
  44a48c:	8b c5                	mov    eax,ebp
  44a48e:	99                   	cdq
  44a48f:	2b c2                	sub    eax,edx
  44a491:	c1 f8 01             	sar    eax,0x1
  44a494:	3b c1                	cmp    eax,ecx
  44a496:	7f 30                	jg     0x44a4c8
  44a498:	bf ad b6 68 00       	mov    edi,0x68b6ad
  44a49d:	8d 0c 45 00 00 00 00 	lea    ecx,[eax*2+0x0]
  44a4a4:	2b f9                	sub    edi,ecx
  44a4a6:	ba ad b6 68 00       	mov    edx,0x68b6ad
  44a4ab:	bb 07 00 00 00       	mov    ebx,0x7
  44a4b0:	b9 06 00 00 00       	mov    ecx,0x6
  44a4b5:	2b d8                	sub    ebx,eax
  44a4b7:	2b cb                	sub    ecx,ebx
  44a4b9:	66 8b 07             	mov    ax,WORD PTR [edi]
  44a4bc:	83 ef 02             	sub    edi,0x2
  44a4bf:	66 89 02             	mov    WORD PTR [edx],ax
  44a4c2:	83 ea 02             	sub    edx,0x2
  44a4c5:	4b                   	dec    ebx
  44a4c6:	75 f1                	jne    0x44a4b9
  44a4c8:	85 c9                	test   ecx,ecx
  44a4ca:	7c 16                	jl     0x44a4e2
  44a4cc:	8d 3c 4d a1 b6 68 00 	lea    edi,[ecx*2+0x68b6a1]
  44a4d3:	41                   	inc    ecx
  44a4d4:	fd                   	std
  44a4d5:	8b 44 24 2c          	mov    eax,DWORD PTR [esp+0x2c]
  44a4d9:	25 ff ff 00 00       	and    eax,0xffff
  44a4de:	f3 66 ab             	rep stos WORD PTR es:[edi],ax
  44a4e1:	fc                   	cld
  44a4e2:	33 ff                	xor    edi,edi
  44a4e4:	68 88 cd 59 00       	push   0x59cd88
  44a4e9:	8d 44 24 30          	lea    eax,[esp+0x30]
  44a4ed:	50                   	push   eax
  44a4ee:	e8 cd 10 11 00       	call   0x55b5c0
  44a4f3:	83 c4 08             	add    esp,0x8
  44a4f6:	a1 6a bc 89 00       	mov    eax,ds:0x89bc6a
  44a4fb:	83 f8 09             	cmp    eax,0x9
  44a4fe:	74 0c                	je     0x44a50c
  44a500:	83 f8 0a             	cmp    eax,0xa
  44a503:	74 10                	je     0x44a515
  44a505:	83 f8 0b             	cmp    eax,0xb
  44a508:	74 14                	je     0x44a51e
  44a50a:	eb 19                	jmp    0x44a525
  44a50c:	66 c7 44 24 2c 40 a1 	mov    WORD PTR [esp+0x2c],0xa140
  44a513:	eb 10                	jmp    0x44a525
  44a515:	66 c7 44 24 2c a1 a1 	mov    WORD PTR [esp+0x2c],0xa1a1
  44a51c:	eb 07                	jmp    0x44a525
  44a51e:	66 c7 44 24 2c 40 81 	mov    WORD PTR [esp+0x2c],0x8140
  44a525:	66 39 35 a1 b6 68 00 	cmp    WORD PTR ds:0x68b6a1,si
  44a52c:	74 14                	je     0x44a542
  44a52e:	b8 a1 b6 68 00       	mov    eax,0x68b6a1
  44a533:	66 83 38 00          	cmp    WORD PTR [eax],0x0
  44a537:	74 09                	je     0x44a542
  44a539:	83 c0 02             	add    eax,0x2
  44a53c:	47                   	inc    edi
  44a53d:	66 39 30             	cmp    WORD PTR [eax],si
  44a540:	75 f1                	jne    0x44a533
  44a542:	81 ff 00 01 00 00    	cmp    edi,0x100
  44a548:	7e 04                	jle    0x44a54e
  44a54a:	33 f6                	xor    esi,esi
  44a54c:	eb 2f                	jmp    0x44a57d
  44a54e:	8d 44 24 2c          	lea    eax,[esp+0x2c]
  44a552:	57                   	push   edi
  44a553:	68 a1 b6 68 00       	push   0x68b6a1
  44a558:	50                   	push   eax
  44a559:	e8 32 20 11 00       	call   0x55c590
  44a55e:	8d 44 24 38          	lea    eax,[esp+0x38]
  44a562:	83 c4 0c             	add    esp,0xc
  44a565:	66 c7 44 7c 2c 00 00 	mov    WORD PTR [esp+edi*2+0x2c],0x0
  44a56c:	50                   	push   eax
  44a56d:	e8 be 00 05 00       	call   0x49a630
  44a572:	83 c4 04             	add    esp,0x4
  44a575:	8b f0                	mov    esi,eax
  44a577:	eb 04                	jmp    0x44a57d
  44a579:	8b 74 24 2c          	mov    esi,DWORD PTR [esp+0x2c]
  44a57d:	68 a1 b6 68 00       	push   0x68b6a1
  44a582:	e8 a9 00 05 00       	call   0x49a630
  44a587:	83 c4 04             	add    esp,0x4
  44a58a:	8b f8                	mov    edi,eax
  44a58c:	e8 7f 8c 04 00       	call   0x493210
  44a591:	6a 41                	push   0x41
  44a593:	85 c0                	test   eax,eax
  44a595:	74 07                	je     0x44a59e
  44a597:	e8 54 82 00 00       	call   0x4527f0
  44a59c:	eb 05                	jmp    0x44a5a3
  44a59e:	e8 9d d5 0d 00       	call   0x527b40
  44a5a3:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  44a5a7:	83 c4 04             	add    esp,0x4
  44a5aa:	e8 61 8c 04 00       	call   0x493210
  44a5af:	85 c0                	test   eax,eax
  44a5b1:	74 04                	je     0x44a5b7
  44a5b3:	ff 44 24 1c          	inc    DWORD PTR [esp+0x1c]
  44a5b7:	e8 84 f4 04 00       	call   0x499a40
  44a5bc:	85 c0                	test   eax,eax
  44a5be:	74 7e                	je     0x44a63e
  44a5c0:	3b f7                	cmp    esi,edi
  44a5c2:	0f 8d 8f 01 00 00    	jge    0x44a757
  44a5c8:	83 3d b3 c6 68 00 00 	cmp    DWORD PTR ds:0x68c6b3,0x0
  44a5cf:	7e 1b                	jle    0x44a5ec
  44a5d1:	ff 0d b3 c6 68 00    	dec    DWORD PTR ds:0x68c6b3
  44a5d7:	0f 85 7a 01 00 00    	jne    0x44a757
  44a5dd:	a1 81 79 89 00       	mov    eax,ds:0x897981
  44a5e2:	a3 00 42 68 00       	mov    ds:0x684200,eax
  44a5e7:	e9 61 01 00 00       	jmp    0x44a74d
  44a5ec:	f7 df                	neg    edi
  44a5ee:	3b 3d b7 c6 68 00    	cmp    edi,DWORD PTR ds:0x68c6b7
  44a5f4:	7d 3d                	jge    0x44a633
  44a5f6:	8b 0d 81 79 89 00    	mov    ecx,DWORD PTR ds:0x897981
  44a5fc:	a1 50 a8 5c 00       	mov    eax,ds:0x5ca850
  44a601:	c1 e0 08             	shl    eax,0x8
  44a604:	2b 0d 00 42 68 00    	sub    ecx,DWORD PTR ds:0x684200
  44a60a:	c1 e1 08             	shl    ecx,0x8
  44a60d:	bf 0c 00 00 00       	mov    edi,0xc
  44a612:	99                   	cdq
  44a613:	f7 ff                	idiv   edi
  44a615:	3b c8                	cmp    ecx,eax
  44a617:	0f 86 3a 01 00 00    	jbe    0x44a757
  44a61d:	83 2d b7 c6 68 00 05 	sub    DWORD PTR ds:0x68c6b7,0x5
  44a624:	a1 81 79 89 00       	mov    eax,ds:0x897981
  44a629:	a3 00 42 68 00       	mov    ds:0x684200,eax
  44a62e:	e9 24 01 00 00       	jmp    0x44a757
  44a633:	89 35 b7 c6 68 00    	mov    DWORD PTR ds:0x68c6b7,esi
  44a639:	e9 19 01 00 00       	jmp    0x44a757
  44a63e:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  44a642:	b9 05 00 00 00       	mov    ecx,0x5
  44a647:	03 c0                	add    eax,eax
  44a649:	99                   	cdq
  44a64a:	f7 f9                	idiv   ecx
  44a64c:	8b c8                	mov    ecx,eax
  44a64e:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  44a652:	c1 f8 03             	sar    eax,0x3
  44a655:	83 e9 0a             	sub    ecx,0xa
  44a658:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  44a65c:	8b c7                	mov    eax,edi
  44a65e:	99                   	cdq
  44a65f:	2b c2                	sub    eax,edx
  44a661:	c1 f8 01             	sar    eax,0x1
  44a664:	3b c8                	cmp    ecx,eax
  44a666:	8b f0                	mov    esi,eax
  44a668:	7d 02                	jge    0x44a66c
  44a66a:	8b f1                	mov    esi,ecx
  44a66c:	83 ee 3c             	sub    esi,0x3c
  44a66f:	3b 74 24 14          	cmp    esi,DWORD PTR [esp+0x14]
  44a673:	7d 04                	jge    0x44a679
  44a675:	8b 74 24 14          	mov    esi,DWORD PTR [esp+0x14]
  44a679:	8d 7c 24 2c          	lea    edi,[esp+0x2c]
  44a67d:	bb a1 b6 68 00       	mov    ebx,0x68b6a1
  44a682:	c7 07 00 00 00 00    	mov    DWORD PTR [edi],0x0
  44a688:	85 db                	test   ebx,ebx
  44a68a:	74 3f                	je     0x44a6cb
  44a68c:	8d 84 24 2c 02 00 00 	lea    eax,[esp+0x22c]
  44a693:	68 80 00 00 00       	push   0x80
  44a698:	50                   	push   eax
  44a699:	8b ee                	mov    ebp,esi
  44a69b:	56                   	push   esi
  44a69c:	53                   	push   ebx
  44a69d:	68 a1 b6 68 00       	push   0x68b6a1
  44a6a2:	e8 69 45 01 00       	call   0x45ec10
  44a6a7:	83 c4 14             	add    esp,0x14
  44a6aa:	8b d8                	mov    ebx,eax
  44a6ac:	8d 84 24 2c 02 00 00 	lea    eax,[esp+0x22c]
  44a6b3:	50                   	push   eax
  44a6b4:	e8 77 ff 04 00       	call   0x49a630
  44a6b9:	83 c4 04             	add    esp,0x4
  44a6bc:	2b e8                	sub    ebp,eax
  44a6be:	79 05                	jns    0x44a6c5
  44a6c0:	bd 64 00 00 00       	mov    ebp,0x64
  44a6c5:	01 2f                	add    DWORD PTR [edi],ebp
  44a6c7:	85 db                	test   ebx,ebx
  44a6c9:	75 c1                	jne    0x44a68c
  44a6cb:	83 c6 0a             	add    esi,0xa
  44a6ce:	83 c7 04             	add    edi,0x4
  44a6d1:	8d 44 24 60          	lea    eax,[esp+0x60]
  44a6d5:	3b f8                	cmp    edi,eax
  44a6d7:	72 a4                	jb     0x44a67d
  44a6d9:	b9 ff c9 9a 3b       	mov    ecx,0x3b9ac9ff
  44a6de:	b8 ff ff ff ff       	mov    eax,0xffffffff
  44a6e3:	33 d2                	xor    edx,edx
  44a6e5:	8b 7c 94 2c          	mov    edi,DWORD PTR [esp+edx*4+0x2c]
  44a6e9:	3b cf                	cmp    ecx,edi
  44a6eb:	7e 04                	jle    0x44a6f1
  44a6ed:	8b cf                	mov    ecx,edi
  44a6ef:	8b c2                	mov    eax,edx
  44a6f1:	42                   	inc    edx
  44a6f2:	83 fa 0d             	cmp    edx,0xd
  44a6f5:	7c ee                	jl     0x44a6e5
  44a6f7:	83 f8 ff             	cmp    eax,0xffffffff
  44a6fa:	74 09                	je     0x44a705
  44a6fc:	8d 44 80 bf          	lea    eax,[eax+eax*4-0x41]
  44a700:	8d 34 46             	lea    esi,[esi+eax*2]
  44a703:	eb 03                	jmp    0x44a708
  44a705:	83 ee 46             	sub    esi,0x46
  44a708:	3b 74 24 14          	cmp    esi,DWORD PTR [esp+0x14]
  44a70c:	7d 04                	jge    0x44a712
  44a70e:	8b 74 24 14          	mov    esi,DWORD PTR [esp+0x14]
  44a712:	b8 a1 b6 68 00       	mov    eax,0x68b6a1
  44a717:	33 ff                	xor    edi,edi
  44a719:	3b c7                	cmp    eax,edi
  44a71b:	74 21                	je     0x44a73e
  44a71d:	8d 8c 24 2c 02 00 00 	lea    ecx,[esp+0x22c]
  44a724:	68 80 00 00 00       	push   0x80
  44a729:	51                   	push   ecx
  44a72a:	47                   	inc    edi
  44a72b:	56                   	push   esi
  44a72c:	50                   	push   eax
  44a72d:	68 a1 b6 68 00       	push   0x68b6a1
  44a732:	e8 d9 44 01 00       	call   0x45ec10
  44a737:	83 c4 14             	add    esp,0x14
  44a73a:	85 c0                	test   eax,eax
  44a73c:	75 df                	jne    0x44a71d
  44a73e:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  44a742:	0f af f9             	imul   edi,ecx
  44a745:	89 4c 24 28          	mov    DWORD PTR [esp+0x28],ecx
  44a749:	89 7c 24 1c          	mov    DWORD PTR [esp+0x1c],edi
  44a74d:	c7 05 b7 c6 68 00 00 	mov    DWORD PTR ds:0x68c6b7,0x0
  44a754:	00 00 00 
  44a757:	f6 05 c0 c6 68 00 0c 	test   BYTE PTR ds:0x68c6c0,0xc
  44a75e:	0f 84 fb 01 00 00    	je     0x44a95f
  44a764:	a1 50 a3 74 00       	mov    eax,ds:0x74a350
  44a769:	33 ff                	xor    edi,edi
  44a76b:	0f bf 58 24          	movsx  ebx,WORD PTR [eax+0x24]
  44a76f:	0f bf 68 26          	movsx  ebp,WORD PTR [eax+0x26]
  44a773:	33 c0                	xor    eax,eax
  44a775:	f6 05 c0 c6 68 00 04 	test   BYTE PTR ds:0x68c6c0,0x4
  44a77c:	74 5a                	je     0x44a7d8
  44a77e:	66 39 05 bb c6 68 00 	cmp    WORD PTR ds:0x68c6bb,ax
  44a785:	74 1d                	je     0x44a7a4
  44a787:	33 c9                	xor    ecx,ecx
  44a789:	66 8b 0d bb c6 68 00 	mov    cx,WORD PTR ds:0x68c6bb
  44a790:	8b 0c 8d 90 03 89 00 	mov    ecx,DWORD PTR [ecx*4+0x890390]
  44a797:	f6 41 0c 01          	test   BYTE PTR [ecx+0xc],0x1
  44a79b:	75 07                	jne    0x44a7a4
  44a79d:	38 41 2a             	cmp    BYTE PTR [ecx+0x2a],al
  44a7a0:	74 02                	je     0x44a7a4
  44a7a2:	8b c1                	mov    eax,ecx
  44a7a4:	85 c0                	test   eax,eax
  44a7a6:	74 29                	je     0x44a7d1
  44a7a8:	8d 48 3d             	lea    ecx,[eax+0x3d]
  44a7ab:	8d 54 24 14          	lea    edx,[esp+0x14]
  44a7af:	8b 39                	mov    edi,DWORD PTR [ecx]
  44a7b1:	89 3a                	mov    DWORD PTR [edx],edi
  44a7b3:	bf 00 02 00 00       	mov    edi,0x200
  44a7b8:	66 8b 49 04          	mov    cx,WORD PTR [ecx+0x4]
  44a7bc:	66 89 4a 04          	mov    WORD PTR [edx+0x4],cx
  44a7c0:	33 c9                	xor    ecx,ecx
  44a7c2:	8a 48 2a             	mov    cl,BYTE PTR [eax+0x2a]
  44a7c5:	83 f9 01             	cmp    ecx,0x1
  44a7c8:	75 5f                	jne    0x44a829
  44a7ca:	bf 80 00 00 00       	mov    edi,0x80
  44a7cf:	eb 58                	jmp    0x44a829
  44a7d1:	c6 44 24 11 00       	mov    BYTE PTR [esp+0x11],0x0
  44a7d6:	eb 51                	jmp    0x44a829
  44a7d8:	66 a1 bb c6 68 00    	mov    ax,ds:0x68c6bb
  44a7de:	66 89 44 24 12       	mov    WORD PTR [esp+0x12],ax
  44a7e3:	b8 fe 00 00 00       	mov    eax,0xfe
  44a7e8:	20 44 24 12          	and    BYTE PTR [esp+0x12],al
  44a7ec:	20 44 24 13          	and    BYTE PTR [esp+0x13],al
  44a7f0:	66 0f b6 44 24 12    	movzx  ax,BYTE PTR [esp+0x12]
  44a7f6:	66 40                	inc    ax
  44a7f8:	66 c1 e0 08          	shl    ax,0x8
  44a7fc:	66 89 44 24 14       	mov    WORD PTR [esp+0x14],ax
  44a801:	66 0f b6 44 24 13    	movzx  ax,BYTE PTR [esp+0x13]
  44a807:	66 40                	inc    ax
  44a809:	66 c1 e0 08          	shl    ax,0x8
  44a80d:	66 89 44 24 16       	mov    WORD PTR [esp+0x16],ax
  44a812:	8b 44 24 16          	mov    eax,DWORD PTR [esp+0x16]
  44a816:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  44a81a:	50                   	push   eax
  44a81b:	51                   	push   ecx
  44a81c:	e8 1f 41 00 00       	call   0x44e940
  44a821:	66 89 44 24 20       	mov    WORD PTR [esp+0x20],ax
  44a826:	83 c4 08             	add    esp,0x8
  44a829:	80 7c 24 11 00       	cmp    BYTE PTR [esp+0x11],0x0
  44a82e:	0f 84 49 01 00 00    	je     0x44a97d
  44a834:	68 80 00 00 00       	push   0x80
  44a839:	a1 50 a3 74 00       	mov    eax,ds:0x74a350
  44a83e:	66 8b 40 32          	mov    ax,WORD PTR [eax+0x32]
  44a842:	8d 4c 24 18          	lea    ecx,[esp+0x18]
  44a846:	66 05 00 02          	add    ax,0x200
  44a84a:	66 25 ff 07          	and    ax,0x7ff
  44a84e:	50                   	push   eax
  44a84f:	51                   	push   ecx
  44a850:	e8 1b c2 09 00       	call   0x4e6a70
  44a855:	c7 44 24 50 00 00 00 	mov    DWORD PTR [esp+0x50],0x0
  44a85c:	00 
  44a85d:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  44a861:	83 c4 0c             	add    esp,0xc
  44a864:	0f b7 c3             	movzx  eax,bx
  44a867:	81 e1 ff ff 00 00    	and    ecx,0xffff
  44a86d:	2b c8                	sub    ecx,eax
  44a86f:	8b c1                	mov    eax,ecx
  44a871:	79 04                	jns    0x44a877
  44a873:	8b c1                	mov    eax,ecx
  44a875:	f7 d8                	neg    eax
  44a877:	f6 c4 80             	test   ah,0x80
  44a87a:	74 11                	je     0x44a88d
  44a87c:	85 c9                	test   ecx,ecx
  44a87e:	8d 88 00 00 ff ff    	lea    ecx,[eax-0x10000]
  44a884:	7f 07                	jg     0x44a88d
  44a886:	b9 00 00 01 00       	mov    ecx,0x10000
  44a88b:	2b c8                	sub    ecx,eax
  44a88d:	c1 f9 01             	sar    ecx,0x1
  44a890:	89 4c 24 2c          	mov    DWORD PTR [esp+0x2c],ecx
  44a894:	33 c9                	xor    ecx,ecx
  44a896:	0f b7 c5             	movzx  eax,bp
  44a899:	66 8b 4c 24 16       	mov    cx,WORD PTR [esp+0x16]
  44a89e:	2b c8                	sub    ecx,eax
  44a8a0:	8b c1                	mov    eax,ecx
  44a8a2:	79 04                	jns    0x44a8a8
  44a8a4:	8b c1                	mov    eax,ecx
  44a8a6:	f7 d8                	neg    eax
  44a8a8:	f6 c4 80             	test   ah,0x80
  44a8ab:	74 11                	je     0x44a8be
  44a8ad:	85 c9                	test   ecx,ecx
  44a8af:	8d 88 00 00 ff ff    	lea    ecx,[eax-0x10000]
  44a8b5:	7f 07                	jg     0x44a8be
  44a8b7:	b9 00 00 01 00       	mov    ecx,0x10000
  44a8bc:	2b c8                	sub    ecx,eax
  44a8be:	c1 f9 01             	sar    ecx,0x1
  44a8c1:	89 4c 24 34          	mov    DWORD PTR [esp+0x34],ecx
  44a8c5:	8b 44 24 16          	mov    eax,DWORD PTR [esp+0x16]
  44a8c9:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  44a8cd:	50                   	push   eax
  44a8ce:	52                   	push   edx
  44a8cf:	e8 6c 40 00 00       	call   0x44e940
  44a8d4:	8d 4c 24 34          	lea    ecx,[esp+0x34]
  44a8d8:	83 c4 08             	add    esp,0x8
  44a8db:	0f bf c0             	movsx  eax,ax
  44a8de:	03 c7                	add    eax,edi
  44a8e0:	51                   	push   ecx
  44a8e1:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  44a8e5:	e8 f6 32 02 00       	call   0x46dbe0
  44a8ea:	83 c4 04             	add    esp,0x4
  44a8ed:	f6 44 24 44 1e       	test   BYTE PTR [esp+0x44],0x1e
  44a8f2:	75 64                	jne    0x44a958
  44a8f4:	f6 05 c0 c6 68 00 02 	test   BYTE PTR ds:0x68c6c0,0x2
  44a8fb:	74 25                	je     0x44a922
  44a8fd:	d9 44 24 38          	fld    DWORD PTR [esp+0x38]
  44a901:	8b c6                	mov    eax,esi
  44a903:	99                   	cdq
  44a904:	2b c2                	sub    eax,edx
  44a906:	c1 f8 01             	sar    eax,0x1
  44a909:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  44a90d:	da 64 24 14          	fisub  DWORD PTR [esp+0x14]
  44a911:	0f bf 05 8c ca 87 00 	movsx  eax,WORD PTR ds:0x87ca8c
  44a918:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  44a91c:	da 44 24 14          	fiadd  DWORD PTR [esp+0x14]
  44a920:	eb 13                	jmp    0x44a935
  44a922:	0f bf 05 8c ca 87 00 	movsx  eax,WORD PTR ds:0x87ca8c
  44a929:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  44a92d:	db 44 24 14          	fild   DWORD PTR [esp+0x14]
  44a931:	d8 44 24 38          	fadd   DWORD PTR [esp+0x38]
  44a935:	e8 1a 13 11 00       	call   0x55bc54
  44a93a:	8b f8                	mov    edi,eax
  44a93c:	0f bf 05 8e ca 87 00 	movsx  eax,WORD PTR ds:0x87ca8e
  44a943:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  44a947:	db 44 24 14          	fild   DWORD PTR [esp+0x14]
  44a94b:	d8 44 24 3c          	fadd   DWORD PTR [esp+0x3c]
  44a94f:	e8 00 13 11 00       	call   0x55bc54
  44a954:	8b d8                	mov    ebx,eax
  44a956:	eb 2d                	jmp    0x44a985
  44a958:	c6 44 24 11 00       	mov    BYTE PTR [esp+0x11],0x0
  44a95d:	eb 1e                	jmp    0x44a97d
  44a95f:	8b 3d 08 42 68 00    	mov    edi,DWORD PTR ds:0x684208
  44a965:	8b c6                	mov    eax,esi
  44a967:	99                   	cdq
  44a968:	2b c2                	sub    eax,edx
  44a96a:	8b 1d 0c 42 68 00    	mov    ebx,DWORD PTR ds:0x68420c
  44a970:	c1 f8 01             	sar    eax,0x1
  44a973:	83 c3 14             	add    ebx,0x14
  44a976:	2b f8                	sub    edi,eax
  44a978:	83 c7 08             	add    edi,0x8
  44a97b:	eb 08                	jmp    0x44a985
  44a97d:	8b 7c 24 2c          	mov    edi,DWORD PTR [esp+0x2c]
  44a981:	8b 5c 24 2c          	mov    ebx,DWORD PTR [esp+0x2c]
  44a985:	80 7c 24 11 00       	cmp    BYTE PTR [esp+0x11],0x0
  44a98a:	0f 84 30 02 00 00    	je     0x44abc0
  44a990:	85 ff                	test   edi,edi
  44a992:	7d 02                	jge    0x44a996
  44a994:	33 ff                	xor    edi,edi
  44a996:	3b 7c 24 20          	cmp    edi,DWORD PTR [esp+0x20]
  44a99a:	7e 04                	jle    0x44a9a0
  44a99c:	8b 7c 24 20          	mov    edi,DWORD PTR [esp+0x20]
  44a9a0:	85 db                	test   ebx,ebx
  44a9a2:	7d 02                	jge    0x44a9a6
  44a9a4:	33 db                	xor    ebx,ebx
  44a9a6:	3b 5c 24 24          	cmp    ebx,DWORD PTR [esp+0x24]
  44a9aa:	7e 04                	jle    0x44a9b0
  44a9ac:	8b 5c 24 24          	mov    ebx,DWORD PTR [esp+0x24]
  44a9b0:	8d 04 3e             	lea    eax,[esi+edi*1]
  44a9b3:	3b 44 24 20          	cmp    eax,DWORD PTR [esp+0x20]
  44a9b7:	7c 06                	jl     0x44a9bf
  44a9b9:	8b 7c 24 20          	mov    edi,DWORD PTR [esp+0x20]
  44a9bd:	2b fe                	sub    edi,esi
  44a9bf:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  44a9c3:	03 c3                	add    eax,ebx
  44a9c5:	3b 44 24 24          	cmp    eax,DWORD PTR [esp+0x24]
  44a9c9:	7c 08                	jl     0x44a9d3
  44a9cb:	8b 5c 24 24          	mov    ebx,DWORD PTR [esp+0x24]
  44a9cf:	2b 5c 24 1c          	sub    ebx,DWORD PTR [esp+0x1c]
  44a9d3:	66 83 3d a1 b6 68 00 	cmp    WORD PTR ds:0x68b6a1,0x0
  44a9da:	00 
  44a9db:	0f 84 df 01 00 00    	je     0x44abc0
  44a9e1:	80 3d bf c6 68 00 01 	cmp    BYTE PTR ds:0x68c6bf,0x1
  44a9e8:	b0 98                	mov    al,0x98
  44a9ea:	75 05                	jne    0x44a9f1
  44a9ec:	a0 f6 c6 89 00       	mov    al,ds:0x89c6f6
  44a9f1:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  44a9f5:	50                   	push   eax
  44a9f6:	51                   	push   ecx
  44a9f7:	56                   	push   esi
  44a9f8:	53                   	push   ebx
  44a9f9:	57                   	push   edi
  44a9fa:	e8 c1 7a 05 00       	call   0x4a24c0
  44a9ff:	83 c4 14             	add    esp,0x14
  44aa02:	a1 bc e0 5c 00       	mov    eax,ds:0x5ce0bc
  44aa07:	8d 88 3a 80 24 00    	lea    ecx,[eax+0x24803a]
  44aa0d:	89 7c 24 2c          	mov    DWORD PTR [esp+0x2c],edi
  44aa11:	33 ff                	xor    edi,edi
  44aa13:	89 7c 24 30          	mov    DWORD PTR [esp+0x30],edi
  44aa17:	df 6c 24 2c          	fild   QWORD PTR [esp+0x2c]
  44aa1b:	d9 19                	fstp   DWORD PTR [ecx]
  44aa1d:	89 5c 24 2c          	mov    DWORD PTR [esp+0x2c],ebx
  44aa21:	89 7c 24 30          	mov    DWORD PTR [esp+0x30],edi
  44aa25:	df 6c 24 2c          	fild   QWORD PTR [esp+0x2c]
  44aa29:	d9 90 3e 80 24 00    	fst    DWORD PTR [eax+0x24803e]
  44aa2f:	8b 01                	mov    eax,DWORD PTR [ecx]
  44aa31:	8b 54 24 1c          	mov    edx,DWORD PTR [esp+0x1c]
  44aa35:	d9 1d 60 8f a6 00    	fstp   DWORD PTR ds:0xa68f60
  44aa3b:	a3 64 8f a6 00       	mov    ds:0xa68f64,eax
  44aa40:	a1 bc e0 5c 00       	mov    eax,ds:0x5ce0bc
  44aa45:	89 b8 4a 80 24 00    	mov    DWORD PTR [eax+0x24804a],edi
  44aa4b:	89 b8 4e 80 24 00    	mov    DWORD PTR [eax+0x24804e],edi
  44aa51:	89 b0 52 80 24 00    	mov    DWORD PTR [eax+0x248052],esi
  44aa57:	89 90 56 80 24 00    	mov    DWORD PTR [eax+0x248056],edx
  44aa5d:	e8 de ef 04 00       	call   0x499a40
  44aa62:	85 c0                	test   eax,eax
  44aa64:	74 59                	je     0x44aabf
  44aa66:	e8 a5 87 04 00       	call   0x493210
  44aa6b:	85 c0                	test   eax,eax
  44aa6d:	74 20                	je     0x44aa8f
  44aa6f:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  44aa74:	8b 0d b7 c6 68 00    	mov    ecx,DWORD PTR ds:0x68c6b7
  44aa7a:	50                   	push   eax
  44aa7b:	68 a1 b6 68 00       	push   0x68b6a1
  44aa80:	57                   	push   edi
  44aa81:	51                   	push   ecx
  44aa82:	e8 19 71 00 00       	call   0x451ba0
  44aa87:	83 c4 10             	add    esp,0x10
  44aa8a:	e9 e1 00 00 00       	jmp    0x44ab70
  44aa8f:	83 ec 08             	sub    esp,0x8
  44aa92:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  44aa97:	89 64 24 34          	mov    DWORD PTR [esp+0x34],esp
  44aa9b:	50                   	push   eax
  44aa9c:	8b 4c 24 38          	mov    ecx,DWORD PTR [esp+0x38]
  44aaa0:	e8 cb b4 fc ff       	call   0x415f70
  44aaa5:	68 a1 b6 68 00       	push   0x68b6a1
  44aaaa:	a1 b7 c6 68 00       	mov    eax,ds:0x68c6b7
  44aaaf:	6a 00                	push   0x0
  44aab1:	50                   	push   eax
  44aab2:	e8 a9 ce 0d 00       	call   0x527960
  44aab7:	83 c4 14             	add    esp,0x14
  44aaba:	e9 b1 00 00 00       	jmp    0x44ab70
  44aabf:	bf a1 b6 68 00       	mov    edi,0x68b6a1
  44aac4:	33 db                	xor    ebx,ebx
  44aac6:	3b fb                	cmp    edi,ebx
  44aac8:	0f 84 a2 00 00 00    	je     0x44ab70
  44aace:	8d 84 24 2c 02 00 00 	lea    eax,[esp+0x22c]
  44aad5:	68 80 00 00 00       	push   0x80
  44aada:	50                   	push   eax
  44aadb:	56                   	push   esi
  44aadc:	57                   	push   edi
  44aadd:	68 a1 b6 68 00       	push   0x68b6a1
  44aae2:	e8 29 41 01 00       	call   0x45ec10
  44aae7:	83 c4 14             	add    esp,0x14
  44aaea:	8b f8                	mov    edi,eax
  44aaec:	8d 84 24 2c 02 00 00 	lea    eax,[esp+0x22c]
  44aaf3:	50                   	push   eax
  44aaf4:	e8 37 fb 04 00       	call   0x49a630
  44aaf9:	83 c4 04             	add    esp,0x4
  44aafc:	8b e8                	mov    ebp,eax
  44aafe:	e8 0d 87 04 00       	call   0x493210
  44ab03:	85 c0                	test   eax,eax
  44ab05:	74 28                	je     0x44ab2f
  44ab07:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  44ab0c:	8d 8c 24 2c 02 00 00 	lea    ecx,[esp+0x22c]
  44ab13:	50                   	push   eax
  44ab14:	51                   	push   ecx
  44ab15:	53                   	push   ebx
  44ab16:	8b c6                	mov    eax,esi
  44ab18:	2b c5                	sub    eax,ebp
  44ab1a:	c1 f8 01             	sar    eax,0x1
  44ab1d:	66 03 05 b7 c6 68 00 	add    ax,WORD PTR ds:0x68c6b7
  44ab24:	50                   	push   eax
  44ab25:	e8 76 70 00 00       	call   0x451ba0
  44ab2a:	83 c4 10             	add    esp,0x10
  44ab2d:	eb 35                	jmp    0x44ab64
  44ab2f:	83 ec 08             	sub    esp,0x8
  44ab32:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  44ab37:	89 64 24 34          	mov    DWORD PTR [esp+0x34],esp
  44ab3b:	50                   	push   eax
  44ab3c:	8b 4c 24 38          	mov    ecx,DWORD PTR [esp+0x38]
  44ab40:	e8 2b b4 fc ff       	call   0x415f70
  44ab45:	8d 84 24 34 02 00 00 	lea    eax,[esp+0x234]
  44ab4c:	50                   	push   eax
  44ab4d:	53                   	push   ebx
  44ab4e:	8b c6                	mov    eax,esi
  44ab50:	2b c5                	sub    eax,ebp
  44ab52:	c1 f8 01             	sar    eax,0x1
  44ab55:	03 05 b7 c6 68 00    	add    eax,DWORD PTR ds:0x68c6b7
  44ab5b:	50                   	push   eax
  44ab5c:	e8 ff cd 0d 00       	call   0x527960
  44ab61:	83 c4 14             	add    esp,0x14
  44ab64:	03 5c 24 28          	add    ebx,DWORD PTR [esp+0x28]
  44ab68:	85 ff                	test   edi,edi
  44ab6a:	0f 85 5e ff ff ff    	jne    0x44aace
  44ab70:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  44ab76:	33 f6                	xor    esi,esi
  44ab78:	8d 81 3a 80 24 00    	lea    eax,[ecx+0x24803a]
  44ab7e:	89 30                	mov    DWORD PTR [eax],esi
  44ab80:	89 b1 3e 80 24 00    	mov    DWORD PTR [ecx+0x24803e],esi
  44ab86:	8b 08                	mov    ecx,DWORD PTR [eax]
  44ab88:	8b 15 bc e0 5c 00    	mov    edx,DWORD PTR ds:0x5ce0bc
  44ab8e:	89 0d 64 8f a6 00    	mov    DWORD PTR ds:0xa68f64,ecx
  44ab94:	0f bf 05 d1 c6 89 00 	movsx  eax,WORD PTR ds:0x89c6d1
  44ab9b:	0f bf 1d cf c6 89 00 	movsx  ebx,WORD PTR ds:0x89c6cf
  44aba2:	89 35 60 8f a6 00    	mov    DWORD PTR ds:0xa68f60,esi
  44aba8:	89 b2 4a 80 24 00    	mov    DWORD PTR [edx+0x24804a],esi
  44abae:	89 b2 4e 80 24 00    	mov    DWORD PTR [edx+0x24804e],esi
  44abb4:	89 9a 52 80 24 00    	mov    DWORD PTR [edx+0x248052],ebx
  44abba:	89 82 56 80 24 00    	mov    DWORD PTR [edx+0x248056],eax
  44abc0:	c7 05 9d b6 68 00 00 	mov    DWORD PTR ds:0x68b69d,0x0
  44abc7:	00 00 00 
  44abca:	5d                   	pop    ebp
  44abcb:	5f                   	pop    edi
  44abcc:	5e                   	pop    esi
  44abcd:	5b                   	pop    ebx
  44abce:	81 c4 1c 03 00 00    	add    esp,0x31c
  44abd4:	c3                   	ret
  44abd5:	cc                   	int3
  44abd6:	cc                   	int3
  44abd7:	cc                   	int3
  44abd8:	cc                   	int3
  44abd9:	cc                   	int3
  44abda:	cc                   	int3
  44abdb:	cc                   	int3
