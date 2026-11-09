
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0052a510 <.text+0x129510>:
  52a510:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  52a516:	55                   	push   ebp
  52a517:	8b ec                	mov    ebp,esp
  52a519:	6a ff                	push   0xffffffff
  52a51b:	68 a9 a6 52 00       	push   0x52a6a9
  52a520:	50                   	push   eax
  52a521:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  52a528:	83 ec 10             	sub    esp,0x10
  52a52b:	53                   	push   ebx
  52a52c:	56                   	push   esi
  52a52d:	57                   	push   edi
  52a52e:	8b 5d 08             	mov    ebx,DWORD PTR [ebp+0x8]
  52a531:	8b 03                	mov    eax,DWORD PTR [ebx]
  52a533:	89 45 ec             	mov    DWORD PTR [ebp-0x14],eax
  52a536:	85 c0                	test   eax,eax
  52a538:	0f 84 7d 01 00 00    	je     0x52a6bb
  52a53e:	8b 4d 0c             	mov    ecx,DWORD PTR [ebp+0xc]
  52a541:	8b 11                	mov    edx,DWORD PTR [ecx]
  52a543:	85 d2                	test   edx,edx
  52a545:	0f 84 70 01 00 00    	je     0x52a6bb
  52a54b:	83 c1 10             	add    ecx,0x10
  52a54e:	8b 43 10             	mov    eax,DWORD PTR [ebx+0x10]
  52a551:	89 4d f0             	mov    DWORD PTR [ebp-0x10],ecx
  52a554:	39 01                	cmp    DWORD PTR [ecx],eax
  52a556:	0f 85 bc 00 00 00    	jne    0x52a618
  52a55c:	8b 43 14             	mov    eax,DWORD PTR [ebx+0x14]
  52a55f:	8b 4d 0c             	mov    ecx,DWORD PTR [ebp+0xc]
  52a562:	39 41 14             	cmp    DWORD PTR [ecx+0x14],eax
  52a565:	0f 85 ad 00 00 00    	jne    0x52a618
  52a56b:	8b 43 18             	mov    eax,DWORD PTR [ebx+0x18]
  52a56e:	39 41 18             	cmp    DWORD PTR [ecx+0x18],eax
  52a571:	0f 85 a1 00 00 00    	jne    0x52a618
  52a577:	8b 41 1c             	mov    eax,DWORD PTR [ecx+0x1c]
  52a57a:	39 43 1c             	cmp    DWORD PTR [ebx+0x1c],eax
  52a57d:	0f 85 95 00 00 00    	jne    0x52a618
  52a583:	8b 73 20             	mov    esi,DWORD PTR [ebx+0x20]
  52a586:	39 71 20             	cmp    DWORD PTR [ecx+0x20],esi
  52a589:	0f 85 89 00 00 00    	jne    0x52a618
  52a58f:	83 79 24 01          	cmp    DWORD PTR [ecx+0x24],0x1
  52a593:	1b c0                	sbb    eax,eax
  52a595:	f7 d8                	neg    eax
  52a597:	83 7b 24 01          	cmp    DWORD PTR [ebx+0x24],0x1
  52a59b:	1b c9                	sbb    ecx,ecx
  52a59d:	f7 d9                	neg    ecx
  52a59f:	3b c1                	cmp    eax,ecx
  52a5a1:	75 75                	jne    0x52a618
  52a5a3:	3b 55 ec             	cmp    edx,DWORD PTR [ebp-0x14]
  52a5a6:	0f 84 f9 00 00 00    	je     0x52a6a5
  52a5ac:	8b 4d 0c             	mov    ecx,DWORD PTR [ebp+0xc]
  52a5af:	8b 41 04             	mov    eax,DWORD PTR [ecx+0x4]
  52a5b2:	8b 4b 04             	mov    ecx,DWORD PTR [ebx+0x4]
  52a5b5:	3b c1                	cmp    eax,ecx
  52a5b7:	72 02                	jb     0x52a5bb
  52a5b9:	8b c1                	mov    eax,ecx
  52a5bb:	46                   	inc    esi
  52a5bc:	8b 4d 0c             	mov    ecx,DWORD PTR [ebp+0xc]
  52a5bf:	c1 ee 03             	shr    esi,0x3
  52a5c2:	8b 49 08             	mov    ecx,DWORD PTR [ecx+0x8]
  52a5c5:	0f af c6             	imul   eax,esi
  52a5c8:	8b 73 08             	mov    esi,DWORD PTR [ebx+0x8]
  52a5cb:	3b ce                	cmp    ecx,esi
  52a5cd:	72 02                	jb     0x52a5d1
  52a5cf:	8b ce                	mov    ecx,esi
  52a5d1:	89 4d f0             	mov    DWORD PTR [ebp-0x10],ecx
  52a5d4:	8b 4d ec             	mov    ecx,DWORD PTR [ebp-0x14]
  52a5d7:	8b 75 f0             	mov    esi,DWORD PTR [ebp-0x10]
  52a5da:	89 4d ec             	mov    DWORD PTR [ebp-0x14],ecx
  52a5dd:	ff 4d f0             	dec    DWORD PTR [ebp-0x10]
  52a5e0:	85 f6                	test   esi,esi
  52a5e2:	0f 84 bd 00 00 00    	je     0x52a6a5
  52a5e8:	8b 7d ec             	mov    edi,DWORD PTR [ebp-0x14]
  52a5eb:	8b f2                	mov    esi,edx
  52a5ed:	8b c8                	mov    ecx,eax
  52a5ef:	c1 e9 02             	shr    ecx,0x2
  52a5f2:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  52a5f4:	8b c8                	mov    ecx,eax
  52a5f6:	83 e1 03             	and    ecx,0x3
  52a5f9:	f3 a4                	rep movs BYTE PTR es:[edi],BYTE PTR ds:[esi]
  52a5fb:	8b 4b 0c             	mov    ecx,DWORD PTR [ebx+0xc]
  52a5fe:	8b 75 0c             	mov    esi,DWORD PTR [ebp+0xc]
  52a601:	01 4d ec             	add    DWORD PTR [ebp-0x14],ecx
  52a604:	03 56 0c             	add    edx,DWORD PTR [esi+0xc]
  52a607:	8b 4d f0             	mov    ecx,DWORD PTR [ebp-0x10]
  52a60a:	ff 4d f0             	dec    DWORD PTR [ebp-0x10]
  52a60d:	85 c9                	test   ecx,ecx
  52a60f:	75 d7                	jne    0x52a5e8
  52a611:	33 c0                	xor    eax,eax
  52a613:	e9 a8 00 00 00       	jmp    0x52a6c0
  52a618:	8b 4d 0c             	mov    ecx,DWORD PTR [ebp+0xc]
  52a61b:	8b 73 20             	mov    esi,DWORD PTR [ebx+0x20]
  52a61e:	46                   	inc    esi
  52a61f:	8b 79 20             	mov    edi,DWORD PTR [ecx+0x20]
  52a622:	c1 ee 03             	shr    esi,0x3
  52a625:	47                   	inc    edi
  52a626:	c1 ef 03             	shr    edi,0x3
  52a629:	3b 55 ec             	cmp    edx,DWORD PTR [ebp-0x14]
  52a62c:	75 16                	jne    0x52a644
  52a62e:	8b 41 04             	mov    eax,DWORD PTR [ecx+0x4]
  52a631:	8b 4b 0c             	mov    ecx,DWORD PTR [ebx+0xc]
  52a634:	0f af c7             	imul   eax,edi
  52a637:	3b c1                	cmp    eax,ecx
  52a639:	72 02                	jb     0x52a63d
  52a63b:	8b c1                	mov    eax,ecx
  52a63d:	2b d2                	sub    edx,edx
  52a63f:	f7 f6                	div    esi
  52a641:	89 43 04             	mov    DWORD PTR [ebx+0x4],eax
  52a644:	8b 4d 0c             	mov    ecx,DWORD PTR [ebp+0xc]
  52a647:	8b 43 04             	mov    eax,DWORD PTR [ebx+0x4]
  52a64a:	8b 71 04             	mov    esi,DWORD PTR [ecx+0x4]
  52a64d:	3b f0                	cmp    esi,eax
  52a64f:	72 02                	jb     0x52a653
  52a651:	8b f0                	mov    esi,eax
  52a653:	8b 4d 0c             	mov    ecx,DWORD PTR [ebp+0xc]
  52a656:	8b 43 08             	mov    eax,DWORD PTR [ebx+0x8]
  52a659:	8b 79 08             	mov    edi,DWORD PTR [ecx+0x8]
  52a65c:	3b f8                	cmp    edi,eax
  52a65e:	72 02                	jb     0x52a662
  52a660:	8b f8                	mov    edi,eax
  52a662:	56                   	push   esi
  52a663:	8b 45 10             	mov    eax,DWORD PTR [ebp+0x10]
  52a666:	50                   	push   eax
  52a667:	8b 4d f0             	mov    ecx,DWORD PTR [ebp-0x10]
  52a66a:	51                   	push   ecx
  52a66b:	8d 53 10             	lea    edx,[ebx+0x10]
  52a66e:	52                   	push   edx
  52a66f:	8d 4d e4             	lea    ecx,[ebp-0x1c]
  52a672:	e8 f9 da 01 00       	call   0x548170
  52a677:	56                   	push   esi
  52a678:	8b 4d 0c             	mov    ecx,DWORD PTR [ebp+0xc]
  52a67b:	c7 45 fc 00 00 00 00 	mov    DWORD PTR [ebp-0x4],0x0
  52a682:	57                   	push   edi
  52a683:	8b 41 0c             	mov    eax,DWORD PTR [ecx+0xc]
  52a686:	50                   	push   eax
  52a687:	8b 53 0c             	mov    edx,DWORD PTR [ebx+0xc]
  52a68a:	52                   	push   edx
  52a68b:	8b 01                	mov    eax,DWORD PTR [ecx]
  52a68d:	50                   	push   eax
  52a68e:	8b 13                	mov    edx,DWORD PTR [ebx]
  52a690:	52                   	push   edx
  52a691:	8d 4d e4             	lea    ecx,[ebp-0x1c]
  52a694:	e8 87 dd 01 00       	call   0x548420
  52a699:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  52a6a0:	e8 0e 00 00 00       	call   0x52a6b3
  52a6a5:	33 c0                	xor    eax,eax
  52a6a7:	eb 17                	jmp    0x52a6c0
  52a6a9:	b8 08 5e 59 00       	mov    eax,0x595e08
  52a6ae:	e9 3d 11 03 00       	jmp    0x55b7f0
  52a6b3:	8d 4d e4             	lea    ecx,[ebp-0x1c]
  52a6b6:	e9 35 e6 ff ff       	jmp    0x528cf0
  52a6bb:	b8 ff ff ff ff       	mov    eax,0xffffffff
  52a6c0:	8b 4d f4             	mov    ecx,DWORD PTR [ebp-0xc]
  52a6c3:	5f                   	pop    edi
  52a6c4:	64 89 0d 00 00 00 00 	mov    DWORD PTR fs:0x0,ecx
  52a6cb:	5e                   	pop    esi
  52a6cc:	5b                   	pop    ebx
  52a6cd:	8b e5                	mov    esp,ebp
  52a6cf:	5d                   	pop    ebp
  52a6d0:	c2 0c 00             	ret    0xc
  52a6d3:	cc                   	int3
  52a6d4:	cc                   	int3
  52a6d5:	cc                   	int3
  52a6d6:	cc                   	int3
  52a6d7:	cc                   	int3
  52a6d8:	cc                   	int3
  52a6d9:	cc                   	int3
  52a6da:	cc                   	int3
  52a6db:	cc                   	int3
  52a6dc:	cc                   	int3
  52a6dd:	cc                   	int3
  52a6de:	cc                   	int3
  52a6df:	cc                   	int3
  52a6e0:	a1 64 0a 5e 00       	mov    eax,ds:0x5e0a64
  52a6e5:	c3                   	ret
  52a6e6:	cc                   	int3
  52a6e7:	cc                   	int3
  52a6e8:	cc                   	int3
  52a6e9:	cc                   	int3
  52a6ea:	cc                   	int3
  52a6eb:	cc                   	int3
  52a6ec:	cc                   	int3
  52a6ed:	cc                   	int3
  52a6ee:	cc                   	int3
  52a6ef:	cc                   	int3
  52a6f0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  52a6f4:	a3 64 0a 5e 00       	mov    ds:0x5e0a64,eax
  52a6f9:	c3                   	ret
  52a6fa:	cc                   	int3
  52a6fb:	cc                   	int3
  52a6fc:	cc                   	int3
  52a6fd:	cc                   	int3
  52a6fe:	cc                   	int3
  52a6ff:	cc                   	int3
  52a700:	a1 68 0a 5e 00       	mov    eax,ds:0x5e0a68
  52a705:	c3                   	ret
  52a706:	cc                   	int3
  52a707:	cc                   	int3
  52a708:	cc                   	int3
  52a709:	cc                   	int3
  52a70a:	cc                   	int3
  52a70b:	cc                   	int3
  52a70c:	cc                   	int3
  52a70d:	cc                   	int3
  52a70e:	cc                   	int3
  52a70f:	cc                   	int3
  52a710:	83 ec 1c             	sub    esp,0x1c
  52a713:	53                   	push   ebx
  52a714:	56                   	push   esi
  52a715:	57                   	push   edi
  52a716:	bb d0 07 00 00       	mov    ebx,0x7d0
  52a71b:	8d 44 24 0c          	lea    eax,[esp+0xc]
  52a71f:	55                   	push   ebp
