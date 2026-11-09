
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00529420 <.text+0x128420>:
  529420:	8b 54 24 04          	mov    edx,DWORD PTR [esp+0x4]
  529424:	56                   	push   esi
  529425:	89 51 04             	mov    DWORD PTR [ecx+0x4],edx
  529428:	57                   	push   edi
  529429:	8d 79 10             	lea    edi,[ecx+0x10]
  52942c:	8b 74 24 14          	mov    esi,DWORD PTR [esp+0x14]
  529430:	c7 41 20 00 00 00 00 	mov    DWORD PTR [ecx+0x20],0x0
  529437:	c7 41 24 00 00 00 00 	mov    DWORD PTR [ecx+0x24],0x0
  52943e:	8b c1                	mov    eax,ecx
  529440:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  529444:	89 48 08             	mov    DWORD PTR [eax+0x8],ecx
  529447:	b9 06 00 00 00       	mov    ecx,0x6
  52944c:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  52944e:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  529452:	89 08                	mov    DWORD PTR [eax],ecx
  529454:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  529458:	85 c9                	test   ecx,ecx
  52945a:	74 08                	je     0x529464
  52945c:	5f                   	pop    edi
  52945d:	89 48 0c             	mov    DWORD PTR [eax+0xc],ecx
  529460:	5e                   	pop    esi
  529461:	c2 14 00             	ret    0x14
  529464:	8b 48 20             	mov    ecx,DWORD PTR [eax+0x20]
  529467:	5f                   	pop    edi
  529468:	41                   	inc    ecx
  529469:	5e                   	pop    esi
  52946a:	c1 e9 03             	shr    ecx,0x3
  52946d:	0f af ca             	imul   ecx,edx
  529470:	89 48 0c             	mov    DWORD PTR [eax+0xc],ecx
  529473:	c2 14 00             	ret    0x14
  529476:	cc                   	int3
  529477:	cc                   	int3
  529478:	cc                   	int3
  529479:	cc                   	int3
  52947a:	cc                   	int3
  52947b:	cc                   	int3
  52947c:	cc                   	int3
  52947d:	cc                   	int3
  52947e:	cc                   	int3
  52947f:	cc                   	int3
  529480:	56                   	push   esi
  529481:	83 39 00             	cmp    DWORD PTR [ecx],0x0
  529484:	8b f1                	mov    esi,ecx
  529486:	74 07                	je     0x52948f
  529488:	b8 ff ff ff ff       	mov    eax,0xffffffff
  52948d:	5e                   	pop    esi
  52948e:	c3                   	ret
  52948f:	8b 46 20             	mov    eax,DWORD PTR [esi+0x20]
  529492:	8b 4e 08             	mov    ecx,DWORD PTR [esi+0x8]
  529495:	40                   	inc    eax
  529496:	c1 e8 03             	shr    eax,0x3
  529499:	0f af 46 04          	imul   eax,DWORD PTR [esi+0x4]
  52949d:	0f af c8             	imul   ecx,eax
  5294a0:	51                   	push   ecx
  5294a1:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  5294a4:	e8 87 d1 ff ff       	call   0x526630
  5294a9:	83 c4 04             	add    esp,0x4
  5294ac:	89 06                	mov    DWORD PTR [esi],eax
  5294ae:	83 f8 01             	cmp    eax,0x1
  5294b1:	5e                   	pop    esi
  5294b2:	1b c0                	sbb    eax,eax
  5294b4:	c3                   	ret
  5294b5:	cc                   	int3
  5294b6:	cc                   	int3
  5294b7:	cc                   	int3
  5294b8:	cc                   	int3
  5294b9:	cc                   	int3
  5294ba:	cc                   	int3
  5294bb:	cc                   	int3
  5294bc:	cc                   	int3
  5294bd:	cc                   	int3
  5294be:	cc                   	int3
  5294bf:	cc                   	int3
  5294c0:	56                   	push   esi
  5294c1:	8b 01                	mov    eax,DWORD PTR [ecx]
  5294c3:	8b f1                	mov    esi,ecx
  5294c5:	85 c0                	test   eax,eax
  5294c7:	74 0f                	je     0x5294d8
  5294c9:	50                   	push   eax
  5294ca:	e8 81 d1 ff ff       	call   0x526650
  5294cf:	83 c4 04             	add    esp,0x4
  5294d2:	c7 06 00 00 00 00    	mov    DWORD PTR [esi],0x0
  5294d8:	5e                   	pop    esi
  5294d9:	c3                   	ret
  5294da:	cc                   	int3
  5294db:	cc                   	int3
  5294dc:	cc                   	int3
  5294dd:	cc                   	int3
  5294de:	cc                   	int3
  5294df:	cc                   	int3
  5294e0:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  5294e4:	83 ec 20             	sub    esp,0x20
  5294e7:	56                   	push   esi
  5294e8:	8b 10                	mov    edx,DWORD PTR [eax]
  5294ea:	8b 70 04             	mov    esi,DWORD PTR [eax+0x4]
  5294ed:	89 54 24 0c          	mov    DWORD PTR [esp+0xc],edx
  5294f1:	8b 44 24 2c          	mov    eax,DWORD PTR [esp+0x2c]
  5294f5:	89 74 24 10          	mov    DWORD PTR [esp+0x10],esi
  5294f9:	8b 10                	mov    edx,DWORD PTR [eax]
  5294fb:	8b 70 04             	mov    esi,DWORD PTR [eax+0x4]
  5294fe:	89 54 24 04          	mov    DWORD PTR [esp+0x4],edx
  529502:	89 74 24 18          	mov    DWORD PTR [esp+0x18],esi
  529506:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  52950a:	8b 54 24 0c          	mov    edx,DWORD PTR [esp+0xc]
  52950e:	03 d0                	add    edx,eax
  529510:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  529514:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  529518:	89 54 24 1c          	mov    DWORD PTR [esp+0x1c],edx
  52951c:	03 c6                	add    eax,esi
  52951e:	8d 54 24 14          	lea    edx,[esp+0x14]
  529522:	8b 74 24 28          	mov    esi,DWORD PTR [esp+0x28]
  529526:	52                   	push   edx
  529527:	89 44 24 24          	mov    DWORD PTR [esp+0x24],eax
  52952b:	56                   	push   esi
  52952c:	e8 0f 00 00 00       	call   0x529540
  529531:	5e                   	pop    esi
  529532:	83 c4 20             	add    esp,0x20
  529535:	c2 0c 00             	ret    0xc
  529538:	cc                   	int3
  529539:	cc                   	int3
  52953a:	cc                   	int3
  52953b:	cc                   	int3
  52953c:	cc                   	int3
  52953d:	cc                   	int3
  52953e:	cc                   	int3
  52953f:	cc                   	int3
  529540:	83 ec 10             	sub    esp,0x10
  529543:	33 c0                	xor    eax,eax
  529545:	89 44 24 00          	mov    DWORD PTR [esp+0x0],eax
  529549:	53                   	push   ebx
  52954a:	56                   	push   esi
  52954b:	8b d9                	mov    ebx,ecx
  52954d:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  529551:	57                   	push   edi
  529552:	55                   	push   ebp
  529553:	8b 4b 04             	mov    ecx,DWORD PTR [ebx+0x4]
  529556:	8b 53 08             	mov    edx,DWORD PTR [ebx+0x8]
  529559:	8b 44 24 28          	mov    eax,DWORD PTR [esp+0x28]
  52955d:	89 4c 24 18          	mov    DWORD PTR [esp+0x18],ecx
  529561:	50                   	push   eax
  529562:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  529566:	89 54 24 20          	mov    DWORD PTR [esp+0x20],edx
  52956a:	51                   	push   ecx
  52956b:	e8 e0 2c 00 00       	call   0x52c250
  529570:	83 c4 08             	add    esp,0x8
  529573:	85 c0                	test   eax,eax
  529575:	75 0d                	jne    0x529584
  529577:	8d 44 24 10          	lea    eax,[esp+0x10]
  52957b:	50                   	push   eax
  52957c:	e8 2f 2d 00 00       	call   0x52c2b0
  529581:	83 c4 04             	add    esp,0x4
  529584:	8b 13                	mov    edx,DWORD PTR [ebx]
  529586:	8b 6c 24 24          	mov    ebp,DWORD PTR [esp+0x24]
  52958a:	89 55 00             	mov    DWORD PTR [ebp+0x0],edx
  52958d:	8b 43 04             	mov    eax,DWORD PTR [ebx+0x4]
  529590:	8d 7d 10             	lea    edi,[ebp+0x10]
  529593:	89 45 04             	mov    DWORD PTR [ebp+0x4],eax
  529596:	8b 4b 08             	mov    ecx,DWORD PTR [ebx+0x8]
  529599:	89 4d 08             	mov    DWORD PTR [ebp+0x8],ecx
  52959c:	b9 06 00 00 00       	mov    ecx,0x6
  5295a1:	8b 73 0c             	mov    esi,DWORD PTR [ebx+0xc]
  5295a4:	89 75 0c             	mov    DWORD PTR [ebp+0xc],esi
  5295a7:	8d 73 10             	lea    esi,[ebx+0x10]
  5295aa:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  5295ac:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  5295b0:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  5295b4:	2b 74 24 10          	sub    esi,DWORD PTR [esp+0x10]
  5295b8:	2b 4c 24 14          	sub    ecx,DWORD PTR [esp+0x14]
  5295bc:	8b 7d 20             	mov    edi,DWORD PTR [ebp+0x20]
  5295bf:	89 75 04             	mov    DWORD PTR [ebp+0x4],esi
  5295c2:	47                   	inc    edi
  5295c3:	89 4d 08             	mov    DWORD PTR [ebp+0x8],ecx
  5295c6:	c1 ef 03             	shr    edi,0x3
  5295c9:	8b 43 0c             	mov    eax,DWORD PTR [ebx+0xc]
  5295cc:	0f af 7c 24 10       	imul   edi,DWORD PTR [esp+0x10]
  5295d1:	0f af 44 24 14       	imul   eax,DWORD PTR [esp+0x14]
  5295d6:	03 f8                	add    edi,eax
  5295d8:	03 fa                	add    edi,edx
  5295da:	85 f6                	test   esi,esi
  5295dc:	89 7d 00             	mov    DWORD PTR [ebp+0x0],edi
  5295df:	74 10                	je     0x5295f1
  5295e1:	85 c9                	test   ecx,ecx
  5295e3:	74 0c                	je     0x5295f1
  5295e5:	33 c0                	xor    eax,eax
  5295e7:	5d                   	pop    ebp
  5295e8:	5f                   	pop    edi
  5295e9:	5e                   	pop    esi
  5295ea:	5b                   	pop    ebx
  5295eb:	83 c4 10             	add    esp,0x10
  5295ee:	c2 08 00             	ret    0x8
  5295f1:	b8 ff ff ff ff       	mov    eax,0xffffffff
  5295f6:	5d                   	pop    ebp
  5295f7:	5f                   	pop    edi
  5295f8:	5e                   	pop    esi
  5295f9:	5b                   	pop    ebx
  5295fa:	83 c4 10             	add    esp,0x10
  5295fd:	c2 08 00             	ret    0x8
