
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00427220 <.text+0x26220>:
  427220:	81 ec 58 05 00 00    	sub    esp,0x558
  427226:	b8 01 00 00 00       	mov    eax,0x1
  42722b:	81 25 7c d1 89 00 ff 	and    DWORD PTR ds:0x89d17c,0xffffc1ff
  427232:	c1 ff ff 
  427235:	53                   	push   ebx
  427236:	8a 0d ec c6 89 00    	mov    cl,BYTE PTR ds:0x89c6ec
  42723c:	56                   	push   esi
  42723d:	80 c1 09             	add    cl,0x9
  427240:	d3 e0                	shl    eax,cl
  427242:	57                   	push   edi
  427243:	6a 01                	push   0x1
  427245:	09 05 7c d1 89 00    	or     DWORD PTR ds:0x89d17c,eax
  42724b:	e8 00 7d 08 00       	call   0x4aef50
  427250:	83 c4 04             	add    esp,0x4
  427253:	f6 05 7c d1 89 00 01 	test   BYTE PTR ds:0x89d17c,0x1
  42725a:	0f 84 46 02 00 00    	je     0x4274a6
  427260:	a0 dd c6 89 00       	mov    al,ds:0x89c6dd
  427265:	33 db                	xor    ebx,ebx
  427267:	8a d8                	mov    bl,al
  427269:	a2 3f b7 89 00       	mov    ds:0x89b73f,al
  42726e:	53                   	push   ebx
  42726f:	e8 fc fa ff ff       	call   0x426d70
  427274:	83 c4 04             	add    esp,0x4
  427277:	85 c0                	test   eax,eax
  427279:	75 0c                	jne    0x427287
  42727b:	33 c0                	xor    eax,eax
  42727d:	5f                   	pop    edi
  42727e:	5e                   	pop    esi
  42727f:	5b                   	pop    ebx
  427280:	81 c4 58 05 00 00    	add    esp,0x558
  427286:	c3                   	ret
  427287:	53                   	push   ebx
  427288:	e8 33 ee 05 00       	call   0x4860c0
  42728d:	8d 84 24 28 01 00 00 	lea    eax,[esp+0x128]
  427294:	83 c4 04             	add    esp,0x4
  427297:	6a 00                	push   0x0
  427299:	68 ec 99 59 00       	push   0x5999ec
  42729e:	50                   	push   eax
  42729f:	e8 3c 8d 0d 00       	call   0x4fffe0
  4272a4:	8b b4 24 74 05 00 00 	mov    esi,DWORD PTR [esp+0x574]
  4272ab:	8d 84 24 30 01 00 00 	lea    eax,[esp+0x130]
  4272b2:	8d 4c 24 20          	lea    ecx,[esp+0x20]
  4272b6:	83 c4 0c             	add    esp,0xc
  4272b9:	68 30 98 59 00       	push   0x599830
  4272be:	56                   	push   esi
  4272bf:	68 d0 c1 59 00       	push   0x59c1d0
  4272c4:	50                   	push   eax
  4272c5:	68 b4 c1 59 00       	push   0x59c1b4
  4272ca:	51                   	push   ecx
  4272cb:	e8 80 41 13 00       	call   0x55b450
  4272d0:	83 c4 18             	add    esp,0x18
  4272d3:	e8 28 bf 07 00       	call   0x4a3200
  4272d8:	e8 43 ca 07 00       	call   0x4a3d20
  4272dd:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  4272e1:	51                   	push   ecx
  4272e2:	68 23 cd 89 00       	push   0x89cd23
  4272e7:	e8 c4 8e 0d 00       	call   0x5001b0
  4272ec:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  4272f0:	83 c4 08             	add    esp,0x8
  4272f3:	68 10 00 00 c0       	push   0xc0000010
  4272f8:	68 23 cd 89 00       	push   0x89cd23
  4272fd:	51                   	push   ecx
  4272fe:	e8 7d ef 0f 00       	call   0x526280
  427303:	83 c4 0c             	add    esp,0xc
  427306:	85 c0                	test   eax,eax
  427308:	75 44                	jne    0x42734e
  42730a:	8d 44 24 10          	lea    eax,[esp+0x10]
  42730e:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  427312:	50                   	push   eax
  427313:	68 98 13 00 00       	push   0x1398
  427318:	68 a9 a3 89 00       	push   0x89a3a9
  42731d:	51                   	push   ecx
  42731e:	e8 bd f2 0f 00       	call   0x5265e0
  427323:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  427327:	83 c4 10             	add    esp,0x10
  42732a:	81 7c 24 10 98 13 00 	cmp    DWORD PTR [esp+0x10],0x1398
  427331:	00 
  427332:	50                   	push   eax
  427333:	74 0a                	je     0x42733f
  427335:	e8 36 f0 0f 00       	call   0x526370
  42733a:	83 c4 04             	add    esp,0x4
  42733d:	eb 0f                	jmp    0x42734e
  42733f:	e8 2c f0 0f 00       	call   0x526370
  427344:	83 c4 04             	add    esp,0x4
  427347:	b8 01 00 00 00       	mov    eax,0x1
  42734c:	eb 02                	jmp    0x427350
  42734e:	33 c0                	xor    eax,eax
  427350:	85 c0                	test   eax,eax
  427352:	75 0c                	jne    0x427360
  427354:	33 c0                	xor    eax,eax
  427356:	5f                   	pop    edi
  427357:	5e                   	pop    esi
  427358:	5b                   	pop    ebx
  427359:	81 c4 58 05 00 00    	add    esp,0x558
  42735f:	c3                   	ret
  427360:	8d 84 24 24 01 00 00 	lea    eax,[esp+0x124]
  427367:	6a 00                	push   0x0
  427369:	68 ec 99 59 00       	push   0x5999ec
  42736e:	33 ff                	xor    edi,edi
  427370:	50                   	push   eax
  427371:	e8 6a 8c 0d 00       	call   0x4fffe0
  427376:	83 c4 0c             	add    esp,0xc
  427379:	83 ff 1e             	cmp    edi,0x1e
  42737c:	75 05                	jne    0x427383
  42737e:	bf 63 00 00 00       	mov    edi,0x63
  427383:	8d 84 24 24 01 00 00 	lea    eax,[esp+0x124]
  42738a:	57                   	push   edi
  42738b:	8d 4c 24 18          	lea    ecx,[esp+0x18]
  42738f:	68 b0 c1 59 00       	push   0x59c1b0
  427394:	56                   	push   esi
  427395:	68 d0 c1 59 00       	push   0x59c1d0
  42739a:	50                   	push   eax
  42739b:	68 9c c1 59 00       	push   0x59c19c
  4273a0:	51                   	push   ecx
  4273a1:	e8 aa 40 13 00       	call   0x55b450
  4273a6:	8d 4c 24 30          	lea    ecx,[esp+0x30]
  4273aa:	83 c4 1c             	add    esp,0x1c
  4273ad:	51                   	push   ecx
  4273ae:	e8 cd f0 0f 00       	call   0x526480
  4273b3:	83 c4 04             	add    esp,0x4
  4273b6:	85 c0                	test   eax,eax
  4273b8:	74 0d                	je     0x4273c7
  4273ba:	8d 44 24 14          	lea    eax,[esp+0x14]
  4273be:	50                   	push   eax
  4273bf:	e8 3c f1 0f 00       	call   0x526500
  4273c4:	83 c4 04             	add    esp,0x4
  4273c7:	47                   	inc    edi
  4273c8:	83 ff 1f             	cmp    edi,0x1f
  4273cb:	7c ac                	jl     0x427379
  4273cd:	8d 84 24 44 03 00 00 	lea    eax,[esp+0x344]
  4273d4:	6a 00                	push   0x0
  4273d6:	68 ec 99 59 00       	push   0x5999ec
  4273db:	50                   	push   eax
  4273dc:	e8 ff 8b 0d 00       	call   0x4fffe0
  4273e1:	8d 84 24 50 03 00 00 	lea    eax,[esp+0x350]
  4273e8:	83 c4 0c             	add    esp,0xc
  4273eb:	8d 8c 24 54 04 00 00 	lea    ecx,[esp+0x454]
  4273f2:	53                   	push   ebx
  4273f3:	68 b0 c1 59 00       	push   0x59c1b0
  4273f8:	6a 00                	push   0x0
  4273fa:	68 d0 c1 59 00       	push   0x59c1d0
  4273ff:	50                   	push   eax
  427400:	68 9c c1 59 00       	push   0x59c19c
  427405:	51                   	push   ecx
  427406:	e8 45 40 13 00       	call   0x55b450
  42740b:	8d 8c 24 70 04 00 00 	lea    ecx,[esp+0x470]
  427412:	83 c4 1c             	add    esp,0x1c
  427415:	51                   	push   ecx
  427416:	e8 65 f0 0f 00       	call   0x526480
  42741b:	83 c4 04             	add    esp,0x4
  42741e:	85 c0                	test   eax,eax
  427420:	74 75                	je     0x427497
  427422:	8d 84 24 44 03 00 00 	lea    eax,[esp+0x344]
  427429:	53                   	push   ebx
  42742a:	8d 8c 24 38 02 00 00 	lea    ecx,[esp+0x238]
  427431:	68 b0 c1 59 00       	push   0x59c1b0
  427436:	56                   	push   esi
  427437:	68 d0 c1 59 00       	push   0x59c1d0
  42743c:	50                   	push   eax
  42743d:	68 9c c1 59 00       	push   0x59c19c
  427442:	51                   	push   ecx
  427443:	e8 08 40 13 00       	call   0x55b450
  427448:	8d 8c 24 50 02 00 00 	lea    ecx,[esp+0x250]
  42744f:	83 c4 1c             	add    esp,0x1c
  427452:	51                   	push   ecx
  427453:	e8 28 f0 0f 00       	call   0x526480
  427458:	83 c4 04             	add    esp,0x4
  42745b:	85 c0                	test   eax,eax
  42745d:	74 10                	je     0x42746f
  42745f:	8d 84 24 34 02 00 00 	lea    eax,[esp+0x234]
  427466:	50                   	push   eax
  427467:	e8 94 f0 0f 00       	call   0x526500
  42746c:	83 c4 04             	add    esp,0x4
  42746f:	8d 84 24 34 02 00 00 	lea    eax,[esp+0x234]
  427476:	8d 8c 24 54 04 00 00 	lea    ecx,[esp+0x454]
  42747d:	50                   	push   eax
  42747e:	51                   	push   ecx
  42747f:	e8 dc f0 0f 00       	call   0x526560
  427484:	83 c4 08             	add    esp,0x8
  427487:	85 c0                	test   eax,eax
  427489:	74 0c                	je     0x427497
  42748b:	33 c0                	xor    eax,eax
  42748d:	5f                   	pop    edi
  42748e:	5e                   	pop    esi
  42748f:	5b                   	pop    ebx
  427490:	81 c4 58 05 00 00    	add    esp,0x558
  427496:	c3                   	ret
  427497:	b8 01 00 00 00       	mov    eax,0x1
  42749c:	5f                   	pop    edi
  42749d:	5e                   	pop    esi
  42749e:	5b                   	pop    ebx
  42749f:	81 c4 58 05 00 00    	add    esp,0x558
  4274a5:	c3                   	ret
  4274a6:	80 3d 00 f0 88 00 0a 	cmp    BYTE PTR ds:0x88f000,0xa
  4274ad:	75 0c                	jne    0x4274bb
  4274af:	81 0d 39 b7 89 00 00 	or     DWORD PTR ds:0x89b739,0x2000000
  4274b6:	00 00 02 
  4274b9:	eb 0a                	jmp    0x4274c5
  4274bb:	81 25 39 b7 89 00 ff 	and    DWORD PTR ds:0x89b739,0xfdffffff
  4274c2:	ff ff fd 
  4274c5:	33 db                	xor    ebx,ebx
  4274c7:	8a 1d 3f b7 89 00    	mov    bl,BYTE PTR ds:0x89b73f
  4274cd:	53                   	push   ebx
  4274ce:	e8 9d f8 ff ff       	call   0x426d70
  4274d3:	83 c4 04             	add    esp,0x4
  4274d6:	85 c0                	test   eax,eax
  4274d8:	75 0c                	jne    0x4274e6
  4274da:	33 c0                	xor    eax,eax
  4274dc:	5f                   	pop    edi
  4274dd:	5e                   	pop    esi
  4274de:	5b                   	pop    ebx
  4274df:	81 c4 58 05 00 00    	add    esp,0x558
  4274e5:	c3                   	ret
  4274e6:	53                   	push   ebx
  4274e7:	e8 d4 eb 05 00       	call   0x4860c0
  4274ec:	8d 84 24 28 01 00 00 	lea    eax,[esp+0x128]
  4274f3:	83 c4 04             	add    esp,0x4
  4274f6:	6a 00                	push   0x0
  4274f8:	68 ec 99 59 00       	push   0x5999ec
  4274fd:	50                   	push   eax
  4274fe:	e8 dd 8a 0d 00       	call   0x4fffe0
  427503:	8b b4 24 74 05 00 00 	mov    esi,DWORD PTR [esp+0x574]
  42750a:	8d 84 24 30 01 00 00 	lea    eax,[esp+0x130]
  427511:	8d 4c 24 20          	lea    ecx,[esp+0x20]
  427515:	83 c4 0c             	add    esp,0xc
  427518:	68 30 98 59 00       	push   0x599830
  42751d:	56                   	push   esi
  42751e:	68 d0 c1 59 00       	push   0x59c1d0
  427523:	50                   	push   eax
  427524:	68 b4 c1 59 00       	push   0x59c1b4
  427529:	51                   	push   ecx
  42752a:	e8 21 3f 13 00       	call   0x55b450
  42752f:	83 c4 18             	add    esp,0x18
  427532:	e8 c9 bc 07 00       	call   0x4a3200
  427537:	e8 e4 c7 07 00       	call   0x4a3d20
  42753c:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  427540:	51                   	push   ecx
  427541:	68 23 cd 89 00       	push   0x89cd23
  427546:	e8 65 8c 0d 00       	call   0x5001b0
  42754b:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  42754f:	83 c4 08             	add    esp,0x8
  427552:	68 10 00 00 c0       	push   0xc0000010
  427557:	68 23 cd 89 00       	push   0x89cd23
  42755c:	51                   	push   ecx
  42755d:	e8 1e ed 0f 00       	call   0x526280
  427562:	83 c4 0c             	add    esp,0xc
  427565:	85 c0                	test   eax,eax
  427567:	75 44                	jne    0x4275ad
  427569:	8d 44 24 10          	lea    eax,[esp+0x10]
  42756d:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  427571:	50                   	push   eax
  427572:	68 98 13 00 00       	push   0x1398
  427577:	68 a9 a3 89 00       	push   0x89a3a9
  42757c:	51                   	push   ecx
  42757d:	e8 5e f0 0f 00       	call   0x5265e0
  427582:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  427586:	83 c4 10             	add    esp,0x10
  427589:	81 7c 24 10 98 13 00 	cmp    DWORD PTR [esp+0x10],0x1398
  427590:	00 
  427591:	50                   	push   eax
  427592:	74 0a                	je     0x42759e
  427594:	e8 d7 ed 0f 00       	call   0x526370
  427599:	83 c4 04             	add    esp,0x4
  42759c:	eb 0f                	jmp    0x4275ad
  42759e:	e8 cd ed 0f 00       	call   0x526370
  4275a3:	83 c4 04             	add    esp,0x4
  4275a6:	b8 01 00 00 00       	mov    eax,0x1
  4275ab:	eb 02                	jmp    0x4275af
  4275ad:	33 c0                	xor    eax,eax
  4275af:	85 c0                	test   eax,eax
  4275b1:	75 0c                	jne    0x4275bf
  4275b3:	33 c0                	xor    eax,eax
  4275b5:	5f                   	pop    edi
  4275b6:	5e                   	pop    esi
  4275b7:	5b                   	pop    ebx
  4275b8:	81 c4 58 05 00 00    	add    esp,0x558
  4275be:	c3                   	ret
  4275bf:	8d 84 24 44 03 00 00 	lea    eax,[esp+0x344]
  4275c6:	6a 00                	push   0x0
  4275c8:	68 ec 99 59 00       	push   0x5999ec
  4275cd:	50                   	push   eax
  4275ce:	e8 0d 8a 0d 00       	call   0x4fffe0
  4275d3:	8d 84 24 30 01 00 00 	lea    eax,[esp+0x130]
  4275da:	83 c4 0c             	add    esp,0xc
  4275dd:	33 ff                	xor    edi,edi
  4275df:	6a 00                	push   0x0
  4275e1:	68 ec 99 59 00       	push   0x5999ec
  4275e6:	50                   	push   eax
  4275e7:	e8 f4 89 0d 00       	call   0x4fffe0
  4275ec:	83 c4 0c             	add    esp,0xc
  4275ef:	83 ff 1e             	cmp    edi,0x1e
  4275f2:	75 05                	jne    0x4275f9
  4275f4:	bf 63 00 00 00       	mov    edi,0x63
  4275f9:	8d 84 24 24 01 00 00 	lea    eax,[esp+0x124]
  427600:	57                   	push   edi
  427601:	8d 4c 24 18          	lea    ecx,[esp+0x18]
  427605:	68 b0 c1 59 00       	push   0x59c1b0
  42760a:	56                   	push   esi
  42760b:	68 d0 c1 59 00       	push   0x59c1d0
  427610:	50                   	push   eax
  427611:	68 9c c1 59 00       	push   0x59c19c
  427616:	51                   	push   ecx
  427617:	e8 34 3e 13 00       	call   0x55b450
  42761c:	8d 4c 24 30          	lea    ecx,[esp+0x30]
  427620:	83 c4 1c             	add    esp,0x1c
  427623:	51                   	push   ecx
  427624:	e8 57 ee 0f 00       	call   0x526480
  427629:	83 c4 04             	add    esp,0x4
  42762c:	85 c0                	test   eax,eax
  42762e:	74 0d                	je     0x42763d
  427630:	8d 44 24 14          	lea    eax,[esp+0x14]
  427634:	50                   	push   eax
  427635:	e8 c6 ee 0f 00       	call   0x526500
  42763a:	83 c4 04             	add    esp,0x4
  42763d:	47                   	inc    edi
  42763e:	83 ff 1f             	cmp    edi,0x1f
  427641:	7c ac                	jl     0x4275ef
  427643:	33 ff                	xor    edi,edi
  427645:	3b fb                	cmp    edi,ebx
  427647:	0f 85 b1 00 00 00    	jne    0x4276fe
  42764d:	83 ff 1e             	cmp    edi,0x1e
  427650:	75 05                	jne    0x427657
  427652:	bf 63 00 00 00       	mov    edi,0x63
  427657:	8d 84 24 44 03 00 00 	lea    eax,[esp+0x344]
  42765e:	57                   	push   edi
  42765f:	8d 8c 24 58 04 00 00 	lea    ecx,[esp+0x458]
  427666:	68 b0 c1 59 00       	push   0x59c1b0
  42766b:	6a 00                	push   0x0
  42766d:	68 d0 c1 59 00       	push   0x59c1d0
  427672:	50                   	push   eax
  427673:	68 9c c1 59 00       	push   0x59c19c
  427678:	51                   	push   ecx
  427679:	e8 d2 3d 13 00       	call   0x55b450
  42767e:	8d 8c 24 70 04 00 00 	lea    ecx,[esp+0x470]
  427685:	83 c4 1c             	add    esp,0x1c
  427688:	51                   	push   ecx
  427689:	e8 f2 ed 0f 00       	call   0x526480
  42768e:	83 c4 04             	add    esp,0x4
  427691:	85 c0                	test   eax,eax
  427693:	74 69                	je     0x4276fe
  427695:	8d 84 24 44 03 00 00 	lea    eax,[esp+0x344]
  42769c:	57                   	push   edi
  42769d:	8d 8c 24 38 02 00 00 	lea    ecx,[esp+0x238]
  4276a4:	68 b0 c1 59 00       	push   0x59c1b0
  4276a9:	56                   	push   esi
  4276aa:	68 d0 c1 59 00       	push   0x59c1d0
  4276af:	50                   	push   eax
  4276b0:	68 9c c1 59 00       	push   0x59c19c
  4276b5:	51                   	push   ecx
  4276b6:	e8 95 3d 13 00       	call   0x55b450
  4276bb:	8d 8c 24 50 02 00 00 	lea    ecx,[esp+0x250]
  4276c2:	83 c4 1c             	add    esp,0x1c
  4276c5:	51                   	push   ecx
  4276c6:	e8 b5 ed 0f 00       	call   0x526480
  4276cb:	83 c4 04             	add    esp,0x4
  4276ce:	85 c0                	test   eax,eax
  4276d0:	74 10                	je     0x4276e2
  4276d2:	8d 84 24 34 02 00 00 	lea    eax,[esp+0x234]
  4276d9:	50                   	push   eax
  4276da:	e8 21 ee 0f 00       	call   0x526500
  4276df:	83 c4 04             	add    esp,0x4
  4276e2:	8d 84 24 34 02 00 00 	lea    eax,[esp+0x234]
  4276e9:	8d 8c 24 54 04 00 00 	lea    ecx,[esp+0x454]
  4276f0:	50                   	push   eax
  4276f1:	51                   	push   ecx
  4276f2:	e8 69 ee 0f 00       	call   0x526560
  4276f7:	83 c4 08             	add    esp,0x8
  4276fa:	85 c0                	test   eax,eax
  4276fc:	75 19                	jne    0x427717
  4276fe:	47                   	inc    edi
  4276ff:	83 ff 1f             	cmp    edi,0x1f
  427702:	0f 8c 3d ff ff ff    	jl     0x427645
  427708:	b8 01 00 00 00       	mov    eax,0x1
  42770d:	5f                   	pop    edi
  42770e:	5e                   	pop    esi
  42770f:	5b                   	pop    ebx
  427710:	81 c4 58 05 00 00    	add    esp,0x558
  427716:	c3                   	ret
  427717:	33 c0                	xor    eax,eax
  427719:	5f                   	pop    edi
  42771a:	5e                   	pop    esi
  42771b:	5b                   	pop    ebx
  42771c:	81 c4 58 05 00 00    	add    esp,0x558
  427722:	c3                   	ret
  427723:	cc                   	int3
  427724:	cc                   	int3
  427725:	cc                   	int3
  427726:	cc                   	int3
  427727:	cc                   	int3
  427728:	cc                   	int3
  427729:	cc                   	int3
  42772a:	cc                   	int3
  42772b:	cc                   	int3
  42772c:	cc                   	int3
  42772d:	cc                   	int3
  42772e:	cc                   	int3
  42772f:	cc                   	int3
