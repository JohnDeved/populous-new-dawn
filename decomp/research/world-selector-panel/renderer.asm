
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004284d0 <.text+0x274d0>:
  4284d0:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  4284d5:	c7 05 78 a0 5d 00 00 	mov    DWORD PTR ds:0x5da078,0x0
  4284dc:	00 00 00 
  4284df:	8b 80 48 06 00 00    	mov    eax,DWORD PTR [eax+0x648]
  4284e5:	50                   	push   eax
  4284e6:	8b 00                	mov    eax,DWORD PTR [eax]
  4284e8:	ff 50 28             	call   DWORD PTR [eax+0x28]
  4284eb:	6a 00                	push   0x0
  4284ed:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4284f3:	6a 03                	push   0x3
  4284f5:	e8 c6 81 0f 00       	call   0x5206c0
  4284fa:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  428500:	6a 02                	push   0x2
  428502:	6a 11                	push   0x11
  428504:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  42850a:	50                   	push   eax
  42850b:	8b 00                	mov    eax,DWORD PTR [eax]
  42850d:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  428510:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  428516:	6a 02                	push   0x2
  428518:	6a 12                	push   0x12
  42851a:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  428520:	50                   	push   eax
  428521:	8b 00                	mov    eax,DWORD PTR [eax]
  428523:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  428526:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  42852c:	6a 02                	push   0x2
  42852e:	6a 09                	push   0x9
  428530:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  428536:	50                   	push   eax
  428537:	8b 00                	mov    eax,DWORD PTR [eax]
  428539:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  42853c:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  428542:	6a 01                	push   0x1
  428544:	6a 07                	push   0x7
  428546:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  42854c:	50                   	push   eax
  42854d:	8b 00                	mov    eax,DWORD PTR [eax]
  42854f:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  428552:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  428558:	6a 01                	push   0x1
  42855a:	6a 0e                	push   0xe
  42855c:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  428562:	50                   	push   eax
  428563:	8b 00                	mov    eax,DWORD PTR [eax]
  428565:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  428568:	c3                   	ret
  428569:	cc                   	int3
  42856a:	cc                   	int3
  42856b:	cc                   	int3
  42856c:	cc                   	int3
  42856d:	cc                   	int3
  42856e:	cc                   	int3
  42856f:	cc                   	int3
  428570:	83 ec 08             	sub    esp,0x8
  428573:	83 3d 88 c2 59 00 00 	cmp    DWORD PTR ds:0x59c288,0x0
  42857a:	56                   	push   esi
  42857b:	57                   	push   edi
  42857c:	74 39                	je     0x4285b7
  42857e:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  428583:	6a 00                	push   0x0
  428585:	6a 01                	push   0x1
  428587:	8b 80 48 06 00 00    	mov    eax,DWORD PTR [eax+0x648]
  42858d:	50                   	push   eax
  42858e:	8b 30                	mov    esi,DWORD PTR [eax]
  428590:	ff 56 5c             	call   DWORD PTR [esi+0x5c]
  428593:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  428599:	6a 08                	push   0x8
  42859b:	8b 15 88 c2 59 00    	mov    edx,DWORD PTR ds:0x59c288
  4285a1:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  4285a7:	52                   	push   edx
  4285a8:	68 48 93 67 00       	push   0x679348
  4285ad:	6a 03                	push   0x3
  4285af:	8b 30                	mov    esi,DWORD PTR [eax]
  4285b1:	6a 01                	push   0x1
  4285b3:	50                   	push   eax
  4285b4:	ff 56 74             	call   DWORD PTR [esi+0x74]
  4285b7:	33 ff                	xor    edi,edi
  4285b9:	89 3d 88 c2 59 00    	mov    DWORD PTR ds:0x59c288,edi
  4285bf:	39 3d f8 c1 59 00    	cmp    DWORD PTR ds:0x59c1f8,edi
  4285c5:	0f 84 e5 00 00 00    	je     0x4286b0
  4285cb:	39 3d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,edi
  4285d1:	0f 8e 88 00 00 00    	jle    0x42865f
  4285d7:	33 f6                	xor    esi,esi
  4285d9:	8b c7                	mov    eax,edi
  4285db:	83 c6 70             	add    esi,0x70
  4285de:	99                   	cdq
  4285df:	33 c2                	xor    eax,edx
  4285e1:	2b c2                	sub    eax,edx
  4285e3:	83 e0 07             	and    eax,0x7
  4285e6:	33 c2                	xor    eax,edx
  4285e8:	2b c2                	sub    eax,edx
  4285ea:	89 44 24 08          	mov    DWORD PTR [esp+0x8],eax
  4285ee:	8b c7                	mov    eax,edi
  4285f0:	db 44 24 08          	fild   DWORD PTR [esp+0x8]
  4285f4:	99                   	cdq
  4285f5:	d8 0d 68 f1 58 00    	fmul   DWORD PTR ds:0x58f168
  4285fb:	83 e2 07             	and    edx,0x7
  4285fe:	47                   	inc    edi
  4285ff:	03 c2                	add    eax,edx
  428601:	c1 f8 03             	sar    eax,0x3
  428604:	89 44 24 08          	mov    DWORD PTR [esp+0x8],eax
  428608:	a1 fc c1 59 00       	mov    eax,ds:0x59c1fc
  42860d:	db 44 24 08          	fild   DWORD PTR [esp+0x8]
  428611:	8b 4c 30 d0          	mov    ecx,DWORD PTR [eax+esi*1-0x30]
  428615:	51                   	push   ecx
  428616:	6a ff                	push   0xffffffff
  428618:	d8 0d 68 f1 58 00    	fmul   DWORD PTR ds:0x58f168
  42861e:	d9 05 68 f1 58 00    	fld    DWORD PTR ds:0x58f168
  428624:	6a 00                	push   0x0
  428626:	d8 c1                	fadd   st,st(1)
  428628:	83 ec 04             	sub    esp,0x4
  42862b:	83 ec 04             	sub    esp,0x4
  42862e:	83 ec 04             	sub    esp,0x4
  428631:	83 ec 04             	sub    esp,0x4
  428634:	d9 5c 24 0c          	fstp   DWORD PTR [esp+0xc]
  428638:	d9 05 68 f1 58 00    	fld    DWORD PTR ds:0x58f168
  42863e:	d8 c2                	fadd   st,st(2)
  428640:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  428644:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  428648:	d9 1c 24             	fstp   DWORD PTR [esp]
  42864b:	e8 a0 fd ff ff       	call   0x4283f0
  428650:	83 c4 1c             	add    esp,0x1c
  428653:	3b 3d b8 13 5f 00    	cmp    edi,DWORD PTR ds:0x5f13b8
  428659:	0f 8c 7a ff ff ff    	jl     0x4285d9
  42865f:	c7 44 24 0c 00 00 00 	mov    DWORD PTR [esp+0xc],0x0
  428666:	00 
  428667:	be 88 a3 67 00       	mov    esi,0x67a388
  42866c:	d9 44 24 0c          	fld    DWORD PTR [esp+0xc]
  428670:	d8 05 70 f1 58 00    	fadd   DWORD PTR ds:0x58f170
  428676:	8b 06                	mov    eax,DWORD PTR [esi]
  428678:	8b 54 24 0c          	mov    edx,DWORD PTR [esp+0xc]
  42867c:	50                   	push   eax
  42867d:	83 c6 60             	add    esi,0x60
  428680:	6a ff                	push   0xffffffff
  428682:	6a 00                	push   0x0
  428684:	d9 5c 24 14          	fstp   DWORD PTR [esp+0x14]
  428688:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  42868c:	68 00 00 ef 43       	push   0x43ef0000
  428691:	51                   	push   ecx
  428692:	68 00 00 af 43       	push   0x43af0000
  428697:	52                   	push   edx
  428698:	e8 53 fd ff ff       	call   0x4283f0
  42869d:	8b 4c 24 24          	mov    ecx,DWORD PTR [esp+0x24]
  4286a1:	83 c4 1c             	add    esp,0x1c
  4286a4:	81 fe 08 a5 67 00    	cmp    esi,0x67a508
  4286aa:	89 4c 24 0c          	mov    DWORD PTR [esp+0xc],ecx
  4286ae:	72 bc                	jb     0x42866c
  4286b0:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  4286b5:	8b 80 48 06 00 00    	mov    eax,DWORD PTR [eax+0x648]
  4286bb:	50                   	push   eax
  4286bc:	8b 30                	mov    esi,DWORD PTR [eax]
  4286be:	ff 56 2c             	call   DWORD PTR [esi+0x2c]
  4286c1:	c7 05 78 a0 5d 00 01 	mov    DWORD PTR ds:0x5da078,0x1
  4286c8:	00 00 00 
  4286cb:	5f                   	pop    edi
  4286cc:	5e                   	pop    esi
  4286cd:	83 c4 08             	add    esp,0x8
  4286d0:	c3                   	ret
  4286d1:	cc                   	int3
  4286d2:	cc                   	int3
  4286d3:	cc                   	int3
  4286d4:	cc                   	int3
  4286d5:	cc                   	int3
  4286d6:	cc                   	int3
  4286d7:	cc                   	int3
  4286d8:	cc                   	int3
  4286d9:	cc                   	int3
  4286da:	cc                   	int3
  4286db:	cc                   	int3
  4286dc:	cc                   	int3
  4286dd:	cc                   	int3
  4286de:	cc                   	int3
  4286df:	cc                   	int3
  4286e0:	a1 88 c2 59 00       	mov    eax,ds:0x59c288
  4286e5:	8b c8                	mov    ecx,eax
  4286e7:	40                   	inc    eax
  4286e8:	c1 e1 05             	shl    ecx,0x5
  4286eb:	a3 88 c2 59 00       	mov    ds:0x59c288,eax
  4286f0:	8d 81 48 93 67 00    	lea    eax,[ecx+0x679348]
  4286f6:	c3                   	ret
  4286f7:	cc                   	int3
  4286f8:	cc                   	int3
  4286f9:	cc                   	int3
  4286fa:	cc                   	int3
  4286fb:	cc                   	int3
  4286fc:	cc                   	int3
  4286fd:	cc                   	int3
  4286fe:	cc                   	int3
  4286ff:	cc                   	int3
  428700:	81 3d 88 c2 59 00 80 	cmp    DWORD PTR ds:0x59c288,0x80
  428707:	00 00 00 
  42870a:	75 4c                	jne    0x428758
  42870c:	83 3d 88 c2 59 00 00 	cmp    DWORD PTR ds:0x59c288,0x0
  428713:	74 39                	je     0x42874e
  428715:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  42871a:	6a 00                	push   0x0
  42871c:	6a 01                	push   0x1
  42871e:	8b 80 48 06 00 00    	mov    eax,DWORD PTR [eax+0x648]
  428724:	50                   	push   eax
  428725:	8b 00                	mov    eax,DWORD PTR [eax]
  428727:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  42872a:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  428730:	6a 08                	push   0x8
  428732:	8b 15 88 c2 59 00    	mov    edx,DWORD PTR ds:0x59c288
  428738:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  42873e:	52                   	push   edx
  42873f:	68 48 93 67 00       	push   0x679348
  428744:	6a 03                	push   0x3
  428746:	6a 01                	push   0x1
  428748:	50                   	push   eax
  428749:	8b 00                	mov    eax,DWORD PTR [eax]
  42874b:	ff 50 74             	call   DWORD PTR [eax+0x74]
  42874e:	c7                   	.byte 0xc7
  42874f:	05                   	.byte 0x5
