
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004434e0 <.text+0x424e0>:
  4434e0:	53                   	push   ebx
  4434e1:	33 c0                	xor    eax,eax
  4434e3:	8a 5c 24 08          	mov    bl,BYTE PTR [esp+0x8]
  4434e7:	8a c3                	mov    al,bl
  4434e9:	85 c0                	test   eax,eax
  4434eb:	75 0f                	jne    0x4434fc
  4434ed:	e8 7e f8 01 00       	call   0x462d70
  4434f2:	c7 05 74 aa 96 00 ba 	mov    DWORD PTR ds:0x96aa74,0x96aaba
  4434f9:	aa 96 00 
  4434fc:	f6 05 61 c6 89 00 02 	test   BYTE PTR ds:0x89c661,0x2
  443503:	75 09                	jne    0x44350e
  443505:	53                   	push   ebx
  443506:	e8 b5 80 fd ff       	call   0x41b5c0
  44350b:	83 c4 04             	add    esp,0x4
  44350e:	53                   	push   ebx
  44350f:	e8 1c 14 05 00       	call   0x494930
  443514:	83 c4 04             	add    esp,0x4
  443517:	5b                   	pop    ebx
  443518:	c3                   	ret
  443519:	cc                   	int3
  44351a:	cc                   	int3
  44351b:	cc                   	int3
  44351c:	cc                   	int3
  44351d:	cc                   	int3
  44351e:	cc                   	int3
  44351f:	cc                   	int3
  443520:	81 ec 44 01 00 00    	sub    esp,0x144
  443526:	b9 01 00 00 00       	mov    ecx,0x1
  44352b:	8b 84 24 4c 01 00 00 	mov    eax,DWORD PTR [esp+0x14c]
  443532:	53                   	push   ebx
  443533:	56                   	push   esi
  443534:	2d c8 d1 89 00       	sub    eax,0x89d1c8
  443539:	57                   	push   edi
  44353a:	be 65 0c 00 00       	mov    esi,0xc65
  44353f:	99                   	cdq
  443540:	55                   	push   ebp
  443541:	f7 fe                	idiv   esi
  443543:	8b ac 24 58 01 00 00 	mov    ebp,DWORD PTR [esp+0x158]
  44354a:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  44354e:	8b 7d 08             	mov    edi,DWORD PTR [ebp+0x8]
  443551:	8b 45 04             	mov    eax,DWORD PTR [ebp+0x4]
  443554:	8d 1c 40             	lea    ebx,[eax+eax*2]
  443557:	8d 04 98             	lea    eax,[eax+ebx*4]
  44355a:	85 0c 85 e4 8a 5a 00 	test   DWORD PTR [eax*4+0x5a8ae4],ecx
  443561:	8d 34 85 b8 8a 5a 00 	lea    esi,[eax*4+0x5a8ab8]
  443568:	74 0f                	je     0x443579
  44356a:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  443571:	3b 44 24 10          	cmp    eax,DWORD PTR [esp+0x10]
  443575:	74 02                	je     0x443579
  443577:	33 c9                	xor    ecx,ecx
  443579:	85 c9                	test   ecx,ecx
  44357b:	0f 84 83 01 00 00    	je     0x443704
  443581:	33 c0                	xor    eax,eax
  443583:	8a 06                	mov    al,BYTE PTR [esi]
  443585:	83 f8 01             	cmp    eax,0x1
  443588:	74 0e                	je     0x443598
  44358a:	83 f8 02             	cmp    eax,0x2
  44358d:	0f 84 8e 00 00 00    	je     0x443621
  443593:	e9 17 01 00 00       	jmp    0x4436af
  443598:	33 c0                	xor    eax,eax
  44359a:	8a 46 1f             	mov    al,BYTE PTR [esi+0x1f]
  44359d:	85 c0                	test   eax,eax
  44359f:	74 0a                	je     0x4435ab
  4435a1:	83 f8 03             	cmp    eax,0x3
  4435a4:	74 41                	je     0x4435e7
  4435a6:	e9 04 01 00 00       	jmp    0x4436af
  4435ab:	85 ff                	test   edi,edi
  4435ad:	74 0c                	je     0x4435bb
  4435af:	8b 4e 20             	mov    ecx,DWORD PTR [esi+0x20]
  4435b2:	80 39 01             	cmp    BYTE PTR [ecx],0x1
  4435b5:	1a c0                	sbb    al,al
  4435b7:	f6 d8                	neg    al
  4435b9:	88 01                	mov    BYTE PTR [ecx],al
  4435bb:	8b 46 20             	mov    eax,DWORD PTR [esi+0x20]
  4435be:	80 38 00             	cmp    BYTE PTR [eax],0x0
  4435c1:	74 06                	je     0x4435c9
  4435c3:	0f bf 46 17          	movsx  eax,WORD PTR [esi+0x17]
  4435c7:	eb 04                	jmp    0x4435cd
  4435c9:	0f bf 46 19          	movsx  eax,WORD PTR [esi+0x19]
  4435cd:	8b 04 85 a8 2b 97 00 	mov    eax,DWORD PTR [eax*4+0x972ba8]
  4435d4:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  4435d8:	50                   	push   eax
  4435d9:	51                   	push   ecx
  4435da:	e8 41 7e 11 00       	call   0x55b420
  4435df:	83 c4 08             	add    esp,0x8
  4435e2:	e9 c8 00 00 00       	jmp    0x4436af
  4435e7:	85 ff                	test   edi,edi
  4435e9:	74 08                	je     0x4435f3
  4435eb:	8b 46 28             	mov    eax,DWORD PTR [esi+0x28]
  4435ee:	8b 4e 1b             	mov    ecx,DWORD PTR [esi+0x1b]
  4435f1:	31 08                	xor    DWORD PTR [eax],ecx
  4435f3:	8b 46 28             	mov    eax,DWORD PTR [esi+0x28]
  4435f6:	8b 08                	mov    ecx,DWORD PTR [eax]
  4435f8:	85 4e 1b             	test   DWORD PTR [esi+0x1b],ecx
  4435fb:	74 06                	je     0x443603
  4435fd:	0f bf 46 17          	movsx  eax,WORD PTR [esi+0x17]
  443601:	eb 04                	jmp    0x443607
  443603:	0f bf 46 19          	movsx  eax,WORD PTR [esi+0x19]
  443607:	8b 04 85 a8 2b 97 00 	mov    eax,DWORD PTR [eax*4+0x972ba8]
  44360e:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  443612:	50                   	push   eax
  443613:	51                   	push   ecx
  443614:	e8 07 7e 11 00       	call   0x55b420
  443619:	83 c4 08             	add    esp,0x8
  44361c:	e9 8e 00 00 00       	jmp    0x4436af
  443621:	33 c0                	xor    eax,eax
  443623:	8a 46 1f             	mov    al,BYTE PTR [esi+0x1f]
  443626:	85 c0                	test   eax,eax
  443628:	74 57                	je     0x443681
  44362a:	83 f8 01             	cmp    eax,0x1
  44362d:	74 5b                	je     0x44368a
  44362f:	83 f8 02             	cmp    eax,0x2
  443632:	74 60                	je     0x443694
  443634:	8b 9c 24 94 00 00 00 	mov    ebx,DWORD PTR [esp+0x94]
  44363b:	85 ff                	test   edi,edi
  44363d:	74 1a                	je     0x443659
  44363f:	8b 46 11             	mov    eax,DWORD PTR [esi+0x11]
  443642:	0f af c7             	imul   eax,edi
  443645:	03 d8                	add    ebx,eax
  443647:	8b 46 01             	mov    eax,DWORD PTR [esi+0x1]
  44364a:	3b d8                	cmp    ebx,eax
  44364c:	7d 02                	jge    0x443650
  44364e:	8b d8                	mov    ebx,eax
  443650:	8b 46 05             	mov    eax,DWORD PTR [esi+0x5]
  443653:	3b d8                	cmp    ebx,eax
  443655:	7e 02                	jle    0x443659
  443657:	8b d8                	mov    ebx,eax
  443659:	8d 44 24 14          	lea    eax,[esp+0x14]
  44365d:	53                   	push   ebx
  44365e:	68 00 cd 59 00       	push   0x59cd00
  443663:	50                   	push   eax
  443664:	e8 57 7f 11 00       	call   0x55b5c0
  443669:	83 c4 0c             	add    esp,0xc
  44366c:	33 c0                	xor    eax,eax
  44366e:	8a 46 1f             	mov    al,BYTE PTR [esi+0x1f]
  443671:	85 c0                	test   eax,eax
  443673:	74 26                	je     0x44369b
  443675:	83 f8 01             	cmp    eax,0x1
  443678:	74 28                	je     0x4436a2
  44367a:	83 f8 02             	cmp    eax,0x2
  44367d:	74 2b                	je     0x4436aa
  44367f:	eb 2e                	jmp    0x4436af
  443681:	8b 46 20             	mov    eax,DWORD PTR [esi+0x20]
  443684:	33 db                	xor    ebx,ebx
  443686:	8a 18                	mov    bl,BYTE PTR [eax]
  443688:	eb b1                	jmp    0x44363b
  44368a:	8b 46 24             	mov    eax,DWORD PTR [esi+0x24]
  44368d:	33 db                	xor    ebx,ebx
  44368f:	66 8b 18             	mov    bx,WORD PTR [eax]
  443692:	eb a7                	jmp    0x44363b
  443694:	8b 46 28             	mov    eax,DWORD PTR [esi+0x28]
  443697:	8b 18                	mov    ebx,DWORD PTR [eax]
  443699:	eb a0                	jmp    0x44363b
  44369b:	8b 46 20             	mov    eax,DWORD PTR [esi+0x20]
  44369e:	88 18                	mov    BYTE PTR [eax],bl
  4436a0:	eb 0d                	jmp    0x4436af
  4436a2:	8b 46 24             	mov    eax,DWORD PTR [esi+0x24]
  4436a5:	66 89 18             	mov    WORD PTR [eax],bx
  4436a8:	eb 05                	jmp    0x4436af
  4436aa:	8b 46 28             	mov    eax,DWORD PTR [esi+0x28]
  4436ad:	89 18                	mov    DWORD PTR [eax],ebx
  4436af:	0f bf 4e 15          	movsx  ecx,WORD PTR [esi+0x15]
  4436b3:	8d 44 24 14          	lea    eax,[esp+0x14]
  4436b7:	8b 14 8d a8 2b 97 00 	mov    edx,DWORD PTR [ecx*4+0x972ba8]
  4436be:	8d 8c 24 94 00 00 00 	lea    ecx,[esp+0x94]
  4436c5:	50                   	push   eax
  4436c6:	52                   	push   edx
  4436c7:	8b 45 04             	mov    eax,DWORD PTR [ebp+0x4]
  4436ca:	40                   	inc    eax
  4436cb:	50                   	push   eax
  4436cc:	68 e8 cc 59 00       	push   0x59cce8
  4436d1:	51                   	push   ecx
  4436d2:	e8 e9 7e 11 00       	call   0x55b5c0
  4436d7:	8b 4c 24 24          	mov    ecx,DWORD PTR [esp+0x24]
  4436db:	8d 94 24 a8 00 00 00 	lea    edx,[esp+0xa8]
  4436e2:	83 c4 14             	add    esp,0x14
  4436e5:	6a 00                	push   0x0
  4436e7:	51                   	push   ecx
  4436e8:	6a 10                	push   0x10
  4436ea:	52                   	push   edx
  4436eb:	e8 30 73 03 00       	call   0x47aa20
  4436f0:	83 c4 10             	add    esp,0x10
  4436f3:	85 ff                	test   edi,edi
  4436f5:	74 0d                	je     0x443704
  4436f7:	8b 46 30             	mov    eax,DWORD PTR [esi+0x30]
  4436fa:	85 c0                	test   eax,eax
  4436fc:	74 06                	je     0x443704
  4436fe:	56                   	push   esi
  4436ff:	ff d0                	call   eax
  443701:	83 c4 04             	add    esp,0x4
  443704:	5d                   	pop    ebp
  443705:	5f                   	pop    edi
  443706:	5e                   	pop    esi
  443707:	5b                   	pop    ebx
  443708:	81 c4 44 01 00 00    	add    esp,0x144
  44370e:	c3                   	ret
  44370f:	cc                   	int3
  443710:	83 ec 04             	sub    esp,0x4
  443713:	8b 15 18 cc 59 00    	mov    edx,DWORD PTR ds:0x59cc18
  443719:	85 d2                	test   edx,edx
  44371b:	75 0c                	jne    0x443729
  44371d:	c7 05 24 d3 5d 00 00 	mov    DWORD PTR ds:0x5dd324,0x0
  443724:	00 00 00 
  443727:	eb 35                	jmp    0x44375e
  443729:	7d 15                	jge    0x443740
  44372b:	b8 ff ff ff ff       	mov    eax,0xffffffff
  443730:	b1 01                	mov    cl,0x1
  443732:	2a ca                	sub    cl,dl
  443734:	d3 e0                	shl    eax,cl
  443736:	89 44 24 00          	mov    DWORD PTR [esp+0x0],eax
  44373a:	db 44 24 00          	fild   DWORD PTR [esp+0x0]
  44373e:	eb 12                	jmp    0x443752
  443740:	b8 01 00 00 00       	mov    eax,0x1
  443745:	8d 4a ff             	lea    ecx,[edx-0x1]
  443748:	d3 e0                	shl    eax,cl
  44374a:	89 44 24 00          	mov    DWORD PTR [esp+0x0],eax
  44374e:	db 44 24 00          	fild   DWORD PTR [esp+0x0]
  443752:	d8 3d e4 f2 58 00    	fdivr  DWORD PTR ds:0x58f2e4
  443758:	d9 1d 24 d3 5d 00    	fstp   DWORD PTR ds:0x5dd324
  44375e:	8b 15 1c cc 59 00    	mov    edx,DWORD PTR ds:0x59cc1c
  443764:	85 d2                	test   edx,edx
  443766:	75 0e                	jne    0x443776
  443768:	c7 05 28 d3 5d 00 00 	mov    DWORD PTR ds:0x5dd328,0x0
  44376f:	00 00 00 
  443772:	83 c4 04             	add    esp,0x4
  443775:	c3                   	ret
  443776:	7d 23                	jge    0x44379b
  443778:	b8 ff ff ff ff       	mov    eax,0xffffffff
  44377d:	b1 01                	mov    cl,0x1
  44377f:	2a ca                	sub    cl,dl
  443781:	d3 e0                	shl    eax,cl
  443783:	89 44 24 00          	mov    DWORD PTR [esp+0x0],eax
  443787:	db 44 24 00          	fild   DWORD PTR [esp+0x0]
  44378b:	83 c4 04             	add    esp,0x4
  44378e:	d8 3d e4 f2 58 00    	fdivr  DWORD PTR ds:0x58f2e4
  443794:	d9 1d 28 d3 5d 00    	fstp   DWORD PTR ds:0x5dd328
  44379a:	c3                   	ret
  44379b:	b8 01 00 00 00       	mov    eax,0x1
  4437a0:	8d 4a ff             	lea    ecx,[edx-0x1]
  4437a3:	d3 e0                	shl    eax,cl
  4437a5:	89 44 24 00          	mov    DWORD PTR [esp+0x0],eax
  4437a9:	db 44 24 00          	fild   DWORD PTR [esp+0x0]
  4437ad:	83 c4 04             	add    esp,0x4
  4437b0:	d8 3d e4 f2 58 00    	fdivr  DWORD PTR ds:0x58f2e4
  4437b6:	d9 1d 28 d3 5d 00    	fstp   DWORD PTR ds:0x5dd328
  4437bc:	c3                   	ret
  4437bd:	cc                   	int3
  4437be:	cc                   	int3
  4437bf:	cc                   	int3
  4437c0:	f6 05 61 c6 89 00 02 	test   BYTE PTR ds:0x89c661,0x2
  4437c7:	75 2e                	jne    0x4437f7
  4437c9:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4437cd:	8b 40 1b             	mov    eax,DWORD PTR [eax+0x1b]
  4437d0:	85 c0                	test   eax,eax
  4437d2:	74 06                	je     0x4437da
  4437d4:	83 f8 01             	cmp    eax,0x1
  4437d7:	74 14                	je     0x4437ed
  4437d9:	c3                   	ret
  4437da:	80 3d b0 5d 89 00 00 	cmp    BYTE PTR ds:0x895db0,0x0
  4437e1:	74 05                	je     0x4437e8
  4437e3:	e9 f8 7b 04 00       	jmp    0x48b3e0
  4437e8:	e9 33 7c 04 00       	jmp    0x48b420
  4437ed:	e8 de 80 04 00       	call   0x48b8d0
  4437f2:	e9 09 7d 04 00       	jmp    0x48b500
  4437f7:	c3                   	ret
  4437f8:	cc                   	int3
  4437f9:	cc                   	int3
  4437fa:	cc                   	int3
  4437fb:	cc                   	int3
  4437fc:	cc                   	int3
  4437fd:	cc                   	int3
  4437fe:	cc                   	int3
  4437ff:	cc                   	int3
  443800:	f6 05 61 c6 89 00 02 	test   BYTE PTR ds:0x89c661,0x2
  443807:	75 0f                	jne    0x443818
  443809:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  44380d:	83 78 1b 01          	cmp    DWORD PTR [eax+0x1b],0x1
  443811:	75 05                	jne    0x443818
  443813:	e9 38 7b 04 00       	jmp    0x48b350
  443818:	c3                   	ret
  443819:	cc                   	int3
  44381a:	cc                   	int3
  44381b:	cc                   	int3
  44381c:	cc                   	int3
  44381d:	cc                   	int3
  44381e:	cc                   	int3
  44381f:	cc                   	int3
  443820:	f6 05 a8 5d 89 00 08 	test   BYTE PTR ds:0x895da8,0x8
  443827:	74 1a                	je     0x443843
  443829:	81 25 a4 5d 89 00 ff 	and    DWORD PTR ds:0x895da4,0xdfffffff
  443830:	ff ff df 
  443833:	80 3d 00 f0 88 00 02 	cmp    BYTE PTR ds:0x88f000,0x2
  44383a:	75 29                	jne    0x443865
  44383c:	e8 2f 99 07 00       	call   0x4bd170
  443841:	eb 22                	jmp    0x443865
  443843:	81 0d a4 5d 89 00 00 	or     DWORD PTR ds:0x895da4,0x20000000
  44384a:	00 00 20 
  44384d:	80 3d 00 f0 88 00 02 	cmp    BYTE PTR ds:0x88f000,0x2
  443854:	75 05                	jne    0x44385b
  443856:	e8 d5 99 07 00       	call   0x4bd230
  44385b:	6a 00                	push   0x0
  44385d:	e8 ee af 00 00       	call   0x44e850
  443862:	83 c4 04             	add    esp,0x4
  443865:	83 25 a8 5d 89 00 fb 	and    DWORD PTR ds:0x895da8,0xfffffffb
  44386c:	f6 05 a8 5d 89 00 02 	test   BYTE PTR ds:0x895da8,0x2
  443873:	74 21                	je     0x443896
  443875:	f6 05 66 c6 89 00 02 	test   BYTE PTR ds:0x89c666,0x2
  44387c:	75 07                	jne    0x443885
  44387e:	83 0d a8 5d 89 00 04 	or     DWORD PTR ds:0x895da8,0x4
  443885:	f6 05 a8 5d 89 00 02 	test   BYTE PTR ds:0x895da8,0x2
  44388c:	74 08                	je     0x443896
  44388e:	80 0d d2 ea 96 00 01 	or     BYTE PTR ds:0x96ead2,0x1
  443895:	c3                   	ret
  443896:	80 25 d2 ea 96 00 fe 	and    BYTE PTR ds:0x96ead2,0xfe
  44389d:	c3                   	ret
  44389e:	cc                   	int3
  44389f:	cc                   	int3
  4438a0:	53                   	push   ebx
  4438a1:	a1 a8 5d 89 00       	mov    eax,ds:0x895da8
  4438a6:	56                   	push   esi
  4438a7:	25 00 80 00 00       	and    eax,0x8000
  4438ac:	57                   	push   edi
  4438ad:	be c8 d1 89 00       	mov    esi,0x89d1c8
  4438b2:	83 f8 01             	cmp    eax,0x1
  4438b5:	1a db                	sbb    bl,bl
  4438b7:	33 ff                	xor    edi,edi
  4438b9:	fe c3                	inc    bl
  4438bb:	80 3d c0 ea 96 00 00 	cmp    BYTE PTR ds:0x96eac0,0x0
  4438c2:	76 25                	jbe    0x4438e9
  4438c4:	80 be 1f 0c 00 00 02 	cmp    BYTE PTR [esi+0xc1f],0x2
  4438cb:	75 0a                	jne    0x4438d7
  4438cd:	53                   	push   ebx
  4438ce:	56                   	push   esi
  4438cf:	e8 dc 87 fd ff       	call   0x41c0b0
  4438d4:	83 c4 08             	add    esp,0x8
  4438d7:	47                   	inc    edi
  4438d8:	81 c6 65 0c 00 00    	add    esi,0xc65
  4438de:	33 c0                	xor    eax,eax
  4438e0:	a0 c0 ea 96 00       	mov    al,ds:0x96eac0
  4438e5:	3b c7                	cmp    eax,edi
  4438e7:	7f db                	jg     0x4438c4
  4438e9:	84 db                	test   bl,bl
  4438eb:	74 0b                	je     0x4438f8
  4438ed:	80 0d d2 ea 96 00 02 	or     BYTE PTR ds:0x96ead2,0x2
  4438f4:	5f                   	pop    edi
  4438f5:	5e                   	pop    esi
  4438f6:	5b                   	pop    ebx
  4438f7:	c3                   	ret
  4438f8:	80 25 d2 ea 96 00 fd 	and    BYTE PTR ds:0x96ead2,0xfd
  4438ff:	5f                   	pop    edi
  443900:	5e                   	pop    esi
  443901:	5b                   	pop    ebx
  443902:	c3                   	ret
  443903:	cc                   	int3
  443904:	cc                   	int3
  443905:	cc                   	int3
  443906:	cc                   	int3
  443907:	cc                   	int3
  443908:	cc                   	int3
  443909:	cc                   	int3
  44390a:	cc                   	int3
  44390b:	cc                   	int3
  44390c:	cc                   	int3
  44390d:	cc                   	int3
  44390e:	cc                   	int3
  44390f:	cc                   	int3
