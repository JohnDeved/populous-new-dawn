
../populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0049d2a0 <.text+0x9c2a0>:
  49d2a0:	83 ec 10             	sub    esp,0x10
  49d2a3:	33 c0                	xor    eax,eax
  49d2a5:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  49d2a9:	53                   	push   ebx
  49d2aa:	56                   	push   esi
  49d2ab:	32 c9                	xor    cl,cl
  49d2ad:	8b 74 24 1c          	mov    esi,DWORD PTR [esp+0x1c]
  49d2b1:	57                   	push   edi
  49d2b2:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  49d2b6:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  49d2ba:	8a 5e 63             	mov    bl,BYTE PTR [esi+0x63]
  49d2bd:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  49d2c1:	0f be 3d f0 c6 89 00 	movsx  edi,BYTE PTR ds:0x89c6f0
  49d2c8:	33 d2                	xor    edx,edx
  49d2ca:	8a d1                	mov    dl,cl
  49d2cc:	3b d7                	cmp    edx,edi
  49d2ce:	74 02                	je     0x49d2d2
  49d2d0:	fe c0                	inc    al
  49d2d2:	3a c3                	cmp    al,bl
  49d2d4:	73 04                	jae    0x49d2da
  49d2d6:	fe c1                	inc    cl
  49d2d8:	eb ee                	jmp    0x49d2c8
  49d2da:	33 db                	xor    ebx,ebx
  49d2dc:	8a d9                	mov    bl,cl
  49d2de:	53                   	push   ebx
  49d2df:	e8 cc c1 f7 ff       	call   0x4194b0
  49d2e4:	83 c4 04             	add    esp,0x4
  49d2e7:	84 c0                	test   al,al
  49d2e9:	74 0d                	je     0x49d2f8
  49d2eb:	f6 05 81 79 89 00 02 	test   BYTE PTR ds:0x897981,0x2
  49d2f2:	0f 85 d8 00 00 00    	jne    0x49d3d0
  49d2f8:	8b 46 37             	mov    eax,DWORD PTR [esi+0x37]
  49d2fb:	50                   	push   eax
  49d2fc:	e8 ef ce fa ff       	call   0x44a1f0
  49d301:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  49d305:	83 c4 04             	add    esp,0x4
  49d308:	8b 46 3b             	mov    eax,DWORD PTR [esi+0x3b]
  49d30b:	50                   	push   eax
  49d30c:	e8 ff ce fa ff       	call   0x44a210
  49d311:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  49d315:	83 c4 04             	add    esp,0x4
  49d318:	8b 46 47             	mov    eax,DWORD PTR [esi+0x47]
  49d31b:	03 46 37             	add    eax,DWORD PTR [esi+0x37]
  49d31e:	50                   	push   eax
  49d31f:	e8 cc ce fa ff       	call   0x44a1f0
  49d324:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  49d328:	83 c4 04             	add    esp,0x4
  49d32b:	8b 46 4b             	mov    eax,DWORD PTR [esi+0x4b]
  49d32e:	03 46 3b             	add    eax,DWORD PTR [esi+0x3b]
  49d331:	50                   	push   eax
  49d332:	e8 d9 ce fa ff       	call   0x44a210
  49d337:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  49d33b:	83 c4 04             	add    esp,0x4
  49d33e:	83 7e 10 00          	cmp    DWORD PTR [esi+0x10],0x0
  49d342:	0f 84 88 00 00 00    	je     0x49d3d0
  49d348:	f6 05 65 c6 89 00 10 	test   BYTE PTR ds:0x89c665,0x10
  49d34f:	74 19                	je     0x49d36a
  49d351:	83 7e 18 00          	cmp    DWORD PTR [esi+0x18],0x0
  49d355:	75 0c                	jne    0x49d363
  49d357:	83 7e 1c 00          	cmp    DWORD PTR [esi+0x1c],0x0
  49d35b:	75 06                	jne    0x49d363
  49d35d:	83 7e 0c 00          	cmp    DWORD PTR [esi+0xc],0x0
  49d361:	74 07                	je     0x49d36a
  49d363:	b8 01 00 00 00       	mov    eax,0x1
  49d368:	eb 02                	jmp    0x49d36c
  49d36a:	33 c0                	xor    eax,eax
  49d36c:	85 c0                	test   eax,eax
  49d36e:	75 23                	jne    0x49d393
  49d370:	8d 04 9b             	lea    eax,[ebx+ebx*4]
  49d373:	8d 0c 43             	lea    ecx,[ebx+eax*2]
  49d376:	8d 14 c9             	lea    edx,[ecx+ecx*8]
  49d379:	8d 04 d3             	lea    eax,[ebx+edx*8]
  49d37c:	80 bc 83 ec dd 89 00 	cmp    BYTE PTR [ebx+eax*4+0x89ddec],0x0
  49d383:	00 
  49d384:	74 09                	je     0x49d38f
  49d386:	f6 05 81 79 89 00 04 	test   BYTE PTR ds:0x897981,0x4
  49d38d:	75 04                	jne    0x49d393
  49d38f:	33 c0                	xor    eax,eax
  49d391:	eb 05                	jmp    0x49d398
  49d393:	b8 01 00 00 00       	mov    eax,0x1
  49d398:	85 c0                	test   eax,eax
  49d39a:	8d 04 5b             	lea    eax,[ebx+ebx*2]
  49d39d:	74 1c                	je     0x49d3bb
  49d39f:	8b 0c 85 74 d2 5c 00 	mov    ecx,DWORD PTR [eax*4+0x5cd274]
  49d3a6:	8d 54 24 0c          	lea    edx,[esp+0xc]
  49d3aa:	51                   	push   ecx
  49d3ab:	52                   	push   edx
  49d3ac:	e8 9f 4b 00 00       	call   0x4a1f50
  49d3b1:	83 c4 08             	add    esp,0x8
  49d3b4:	5f                   	pop    edi
  49d3b5:	5e                   	pop    esi
  49d3b6:	5b                   	pop    ebx
  49d3b7:	83 c4 10             	add    esp,0x10
  49d3ba:	c3                   	ret
  49d3bb:	8b 0c 85 70 d2 5c 00 	mov    ecx,DWORD PTR [eax*4+0x5cd270]
  49d3c2:	8d 54 24 0c          	lea    edx,[esp+0xc]
  49d3c6:	51                   	push   ecx
  49d3c7:	52                   	push   edx
  49d3c8:	e8 83 4b 00 00       	call   0x4a1f50
  49d3cd:	83 c4 08             	add    esp,0x8
  49d3d0:	5f                   	pop    edi
  49d3d1:	5e                   	pop    esi
  49d3d2:	5b                   	pop    ebx
  49d3d3:	83 c4 10             	add    esp,0x10
  49d3d6:	c3                   	ret
  49d3d7:	cc                   	int3
  49d3d8:	cc                   	int3
  49d3d9:	cc                   	int3
  49d3da:	cc                   	int3
  49d3db:	cc                   	int3
  49d3dc:	cc                   	int3
  49d3dd:	cc                   	int3
  49d3de:	cc                   	int3
  49d3df:	cc                   	int3
  49d3e0:	83 ec 14             	sub    esp,0x14
  49d3e3:	33 c0                	xor    eax,eax
  49d3e5:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  49d3e9:	53                   	push   ebx
  49d3ea:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  49d3ee:	56                   	push   esi
  49d3ef:	8b 74 24 20          	mov    esi,DWORD PTR [esp+0x20]
  49d3f3:	57                   	push   edi
  49d3f4:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  49d3f8:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  49d3fc:	8a 4e 63             	mov    cl,BYTE PTR [esi+0x63]
  49d3ff:	88 44 24 0f          	mov    BYTE PTR [esp+0xf],al
  49d403:	0f be 3d f0 c6 89 00 	movsx  edi,BYTE PTR ds:0x89c6f0
  49d40a:	33 d2                	xor    edx,edx
  49d40c:	8a 54 24 0f          	mov    dl,BYTE PTR [esp+0xf]
  49d410:	3b d7                	cmp    edx,edi
  49d412:	74 02                	je     0x49d416
  49d414:	fe c0                	inc    al
  49d416:	3a c8                	cmp    cl,al
  49d418:	76 06                	jbe    0x49d420
  49d41a:	fe 44 24 0f          	inc    BYTE PTR [esp+0xf]
  49d41e:	eb ea                	jmp    0x49d40a
  49d420:	33 db                	xor    ebx,ebx
  49d422:	8a 5c 24 0f          	mov    bl,BYTE PTR [esp+0xf]
  49d426:	53                   	push   ebx
  49d427:	e8 84 c0 f7 ff       	call   0x4194b0
  49d42c:	83 c4 04             	add    esp,0x4
  49d42f:	84 c0                	test   al,al
  49d431:	74 0d                	je     0x49d440
  49d433:	f6 05 81 79 89 00 02 	test   BYTE PTR ds:0x897981,0x2
  49d43a:	0f 85 ef 00 00 00    	jne    0x49d52f
  49d440:	8b 46 37             	mov    eax,DWORD PTR [esi+0x37]
  49d443:	50                   	push   eax
  49d444:	e8 a7 cd fa ff       	call   0x44a1f0
  49d449:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  49d44d:	83 c4 04             	add    esp,0x4
  49d450:	8b 46 3b             	mov    eax,DWORD PTR [esi+0x3b]
  49d453:	50                   	push   eax
  49d454:	e8 b7 cd fa ff       	call   0x44a210
  49d459:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  49d45d:	83 c4 04             	add    esp,0x4
  49d460:	8b 46 47             	mov    eax,DWORD PTR [esi+0x47]
  49d463:	03 46 37             	add    eax,DWORD PTR [esi+0x37]
  49d466:	50                   	push   eax
  49d467:	e8 84 cd fa ff       	call   0x44a1f0
  49d46c:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  49d470:	83 c4 04             	add    esp,0x4
  49d473:	8b 46 4b             	mov    eax,DWORD PTR [esi+0x4b]
  49d476:	03 46 3b             	add    eax,DWORD PTR [esi+0x3b]
  49d479:	50                   	push   eax
  49d47a:	e8 91 cd fa ff       	call   0x44a210
  49d47f:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  49d483:	83 c4 04             	add    esp,0x4
  49d486:	83 7e 10 00          	cmp    DWORD PTR [esi+0x10],0x0
  49d48a:	0f 84 9f 00 00 00    	je     0x49d52f
  49d490:	80 3d f0 c6 89 00 ff 	cmp    BYTE PTR ds:0x89c6f0,0xff
  49d497:	74 28                	je     0x49d4c1
  49d499:	80 7c 24 0f ff       	cmp    BYTE PTR [esp+0xf],0xff
  49d49e:	74 21                	je     0x49d4c1
  49d4a0:	8a 4c 24 0f          	mov    cl,BYTE PTR [esp+0xf]
  49d4a4:	38 0d f0 c6 89 00    	cmp    BYTE PTR ds:0x89c6f0,cl
  49d4aa:	74 15                	je     0x49d4c1
  49d4ac:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  49d4b3:	b2 01                	mov    dl,0x1
  49d4b5:	8a 80 b6 08 96 00    	mov    al,BYTE PTR [eax+0x9608b6]
  49d4bb:	d2 e2                	shl    dl,cl
  49d4bd:	22 c2                	and    al,dl
  49d4bf:	eb 02                	jmp    0x49d4c3
  49d4c1:	b0 01                	mov    al,0x1
  49d4c3:	84 c0                	test   al,al
  49d4c5:	74 1f                	je     0x49d4e6
  49d4c7:	8d 04 5b             	lea    eax,[ebx+ebx*2]
  49d4ca:	8d 54 24 10          	lea    edx,[esp+0x10]
  49d4ce:	8b 0c 85 78 d2 5c 00 	mov    ecx,DWORD PTR [eax*4+0x5cd278]
  49d4d5:	51                   	push   ecx
  49d4d6:	52                   	push   edx
  49d4d7:	e8 74 4a 00 00       	call   0x4a1f50
  49d4dc:	83 c4 08             	add    esp,0x8
  49d4df:	5f                   	pop    edi
  49d4e0:	5e                   	pop    esi
  49d4e1:	5b                   	pop    ebx
  49d4e2:	83 c4 14             	add    esp,0x14
  49d4e5:	c3                   	ret
  49d4e6:	83 7e 18 00          	cmp    DWORD PTR [esi+0x18],0x0
  49d4ea:	75 2b                	jne    0x49d517
  49d4ec:	83 7e 1c 00          	cmp    DWORD PTR [esi+0x1c],0x0
  49d4f0:	75 25                	jne    0x49d517
  49d4f2:	83 7e 0c 00          	cmp    DWORD PTR [esi+0xc],0x0
  49d4f6:	75 1f                	jne    0x49d517
  49d4f8:	8d 04 5b             	lea    eax,[ebx+ebx*2]
  49d4fb:	8d 54 24 10          	lea    edx,[esp+0x10]
  49d4ff:	8b 0c 85 70 d2 5c 00 	mov    ecx,DWORD PTR [eax*4+0x5cd270]
  49d506:	51                   	push   ecx
  49d507:	52                   	push   edx
  49d508:	e8 43 4a 00 00       	call   0x4a1f50
  49d50d:	83 c4 08             	add    esp,0x8
  49d510:	5f                   	pop    edi
  49d511:	5e                   	pop    esi
  49d512:	5b                   	pop    ebx
  49d513:	83 c4 14             	add    esp,0x14
  49d516:	c3                   	ret
  49d517:	8d 04 5b             	lea    eax,[ebx+ebx*2]
  49d51a:	8d 54 24 10          	lea    edx,[esp+0x10]
  49d51e:	8b 0c 85 74 d2 5c 00 	mov    ecx,DWORD PTR [eax*4+0x5cd274]
  49d525:	51                   	push   ecx
  49d526:	52                   	push   edx
  49d527:	e8 24 4a 00 00       	call   0x4a1f50
  49d52c:	83 c4 08             	add    esp,0x8
  49d52f:	5f                   	pop    edi
  49d530:	5e                   	pop    esi
  49d531:	5b                   	pop    ebx
  49d532:	83 c4 14             	add    esp,0x14
  49d535:	c3                   	ret
  49d536:	cc                   	int3
  49d537:	cc                   	int3
  49d538:	cc                   	int3
  49d539:	cc                   	int3
  49d53a:	cc                   	int3
  49d53b:	cc                   	int3
  49d53c:	cc                   	int3
  49d53d:	cc                   	int3
  49d53e:	cc                   	int3
  49d53f:	cc                   	int3
  49d540:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  49d547:	53                   	push   ebx
  49d548:	56                   	push   esi
  49d549:	0f 84 9c 00 00 00    	je     0x49d5eb
  49d54f:	0f be 35 f0 c6 89 00 	movsx  esi,BYTE PTR ds:0x89c6f0
  49d556:	8d 04 b6             	lea    eax,[esi+esi*4]
  49d559:	8d 0c 46             	lea    ecx,[esi+eax*2]
  49d55c:	8d 14 c9             	lea    edx,[ecx+ecx*8]
  49d55f:	33 c9                	xor    ecx,ecx
  49d561:	8d 04 d6             	lea    eax,[esi+edx*8]
  49d564:	39 8c 86 f9 da 89 00 	cmp    DWORD PTR [esi+eax*4+0x89daf9],ecx
  49d56b:	75 7e                	jne    0x49d5eb
  49d56d:	32 d2                	xor    dl,dl
  49d56f:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  49d573:	8a 40 63             	mov    al,BYTE PTR [eax+0x63]
  49d576:	33 db                	xor    ebx,ebx
  49d578:	8a da                	mov    bl,dl
  49d57a:	3b de                	cmp    ebx,esi
  49d57c:	74 02                	je     0x49d580
  49d57e:	fe c1                	inc    cl
  49d580:	3a c1                	cmp    al,cl
  49d582:	76 04                	jbe    0x49d588
  49d584:	fe c2                	inc    dl
  49d586:	eb ee                	jmp    0x49d576
  49d588:	80 3d bb 45 98 00 00 	cmp    BYTE PTR ds:0x9845bb,0x0
  49d58f:	74 09                	je     0x49d59a
  49d591:	80 3d bb 46 98 00 00 	cmp    BYTE PTR ds:0x9846bb,0x0
  49d598:	74 36                	je     0x49d5d0
  49d59a:	80 3d c7 45 98 00 00 	cmp    BYTE PTR ds:0x9845c7,0x0
  49d5a1:	74 09                	je     0x49d5ac
  49d5a3:	80 3d c7 46 98 00 00 	cmp    BYTE PTR ds:0x9846c7,0x0
  49d5aa:	74 24                	je     0x49d5d0
  49d5ac:	80 3d c9 45 98 00 00 	cmp    BYTE PTR ds:0x9845c9,0x0
  49d5b3:	74 09                	je     0x49d5be
  49d5b5:	80 3d c9 46 98 00 00 	cmp    BYTE PTR ds:0x9846c9,0x0
  49d5bc:	74 12                	je     0x49d5d0
  49d5be:	80 3d 49 46 98 00 00 	cmp    BYTE PTR ds:0x984649,0x0
  49d5c5:	74 24                	je     0x49d5eb
  49d5c7:	80 3d 49 47 98 00 00 	cmp    BYTE PTR ds:0x984749,0x0
  49d5ce:	75 1b                	jne    0x49d5eb
  49d5d0:	33 c0                	xor    eax,eax
  49d5d2:	8a c2                	mov    al,dl
  49d5d4:	3b f0                	cmp    esi,eax
  49d5d6:	74 13                	je     0x49d5eb
  49d5d8:	6a 00                	push   0x0
  49d5da:	50                   	push   eax
  49d5db:	6a 49                	push   0x49
  49d5dd:	a0 f0 c6 89 00       	mov    al,ds:0x89c6f0
  49d5e2:	50                   	push   eax
  49d5e3:	e8 08 c7 fd ff       	call   0x479cf0
  49d5e8:	83 c4 10             	add    esp,0x10
  49d5eb:	5e                   	pop    esi
  49d5ec:	5b                   	pop    ebx
  49d5ed:	c3                   	ret
  49d5ee:	cc                   	int3
  49d5ef:	cc                   	int3
  49d5f0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  49d5f4:	53                   	push   ebx
  49d5f5:	56                   	push   esi
  49d5f6:	33 c9                	xor    ecx,ecx
  49d5f8:	39 48 10             	cmp    DWORD PTR [eax+0x10],ecx
  49d5fb:	74 24                	je     0x49d621
  49d5fd:	32 d2                	xor    dl,dl
  49d5ff:	8a 40 63             	mov    al,BYTE PTR [eax+0x63]
  49d602:	0f be 35 f0 c6 89 00 	movsx  esi,BYTE PTR ds:0x89c6f0
  49d609:	33 db                	xor    ebx,ebx
  49d60b:	8a da                	mov    bl,dl
  49d60d:	3b de                	cmp    ebx,esi
  49d60f:	74 02                	je     0x49d613
  49d611:	fe c1                	inc    cl
  49d613:	3a c8                	cmp    cl,al
  49d615:	73 04                	jae    0x49d61b
  49d617:	fe c2                	inc    dl
  49d619:	eb ee                	jmp    0x49d609
  49d61b:	88 15 80 ae 5c 00    	mov    BYTE PTR ds:0x5cae80,dl
  49d621:	5e                   	pop    esi
  49d622:	5b                   	pop    ebx
  49d623:	c3                   	ret
  49d624:	cc                   	int3
  49d625:	cc                   	int3
  49d626:	cc                   	int3
  49d627:	cc                   	int3
  49d628:	cc                   	int3
  49d629:	cc                   	int3
  49d62a:	cc                   	int3
  49d62b:	cc                   	int3
  49d62c:	cc                   	int3
  49d62d:	cc                   	int3
  49d62e:	cc                   	int3
  49d62f:	cc                   	int3
  49d630:	53                   	push   ebx
  49d631:	33 c0                	xor    eax,eax
  49d633:	56                   	push   esi
  49d634:	32 c9                	xor    cl,cl
  49d636:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  49d63a:	57                   	push   edi
  49d63b:	0f be 3d f0 c6 89 00 	movsx  edi,BYTE PTR ds:0x89c6f0
  49d642:	8a 5e 63             	mov    bl,BYTE PTR [esi+0x63]
  49d645:	33 d2                	xor    edx,edx
  49d647:	8a d1                	mov    dl,cl
  49d649:	3b d7                	cmp    edx,edi
  49d64b:	74 02                	je     0x49d64f
  49d64d:	fe c0                	inc    al
  49d64f:	3a c3                	cmp    al,bl
  49d651:	73 04                	jae    0x49d657
  49d653:	fe c1                	inc    cl
  49d655:	eb ee                	jmp    0x49d645
  49d657:	33 c0                	xor    eax,eax
  49d659:	8a c1                	mov    al,cl
  49d65b:	50                   	push   eax
  49d65c:	e8 1f be f7 ff       	call   0x419480
  49d661:	83 c4 04             	add    esp,0x4
  49d664:	84 c0                	test   al,al
  49d666:	75 0b                	jne    0x49d673
  49d668:	c7 46 10 01 00 00 00 	mov    DWORD PTR [esi+0x10],0x1
  49d66f:	5f                   	pop    edi
  49d670:	5e                   	pop    esi
  49d671:	5b                   	pop    ebx
  49d672:	c3                   	ret
  49d673:	c7 46 10 00 00 00 00 	mov    DWORD PTR [esi+0x10],0x0
  49d67a:	5f                   	pop    edi
  49d67b:	5e                   	pop    esi
  49d67c:	5b                   	pop    ebx
  49d67d:	c3                   	ret
  49d67e:	cc                   	int3
  49d67f:	cc                   	int3
  49d680:	e9 cb 3a fb ff       	jmp    0x451150
  49d685:	cc                   	int3
  49d686:	cc                   	int3
  49d687:	cc                   	int3
  49d688:	cc                   	int3
  49d689:	cc                   	int3
  49d68a:	cc                   	int3
  49d68b:	cc                   	int3
  49d68c:	cc                   	int3
  49d68d:	cc                   	int3
  49d68e:	cc                   	int3
  49d68f:	cc                   	int3
