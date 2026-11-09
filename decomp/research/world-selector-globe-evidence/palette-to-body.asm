
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00554640 <.text+0x153640>:
  554640:	53                   	push   ebx
  554641:	56                   	push   esi
  554642:	57                   	push   edi
  554643:	8b d9                	mov    ebx,ecx
  554645:	8b 74 24 10          	mov    esi,DWORD PTR [esp+0x10]
  554649:	b9 00 01 00 00       	mov    ecx,0x100
  55464e:	8d 7b 30             	lea    edi,[ebx+0x30]
  554651:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  554653:	8b 74 24 14          	mov    esi,DWORD PTR [esp+0x14]
  554657:	8b 46 10             	mov    eax,DWORD PTR [esi+0x10]
  55465a:	8d 4b 1c             	lea    ecx,[ebx+0x1c]
  55465d:	40                   	inc    eax
  55465e:	51                   	push   ecx
  55465f:	c1 e8 03             	shr    eax,0x3
  554662:	8d 53 10             	lea    edx,[ebx+0x10]
  554665:	52                   	push   edx
  554666:	89 43 2c             	mov    DWORD PTR [ebx+0x2c],eax
  554669:	c7 43 04 ff 00 00 00 	mov    DWORD PTR [ebx+0x4],0xff
  554670:	c7 43 08 00 ff 00 00 	mov    DWORD PTR [ebx+0x8],0xff00
  554677:	c7 43 0c 00 00 ff 00 	mov    DWORD PTR [ebx+0xc],0xff0000
  55467e:	8b 06                	mov    eax,DWORD PTR [esi]
  554680:	8b cb                	mov    ecx,ebx
  554682:	50                   	push   eax
  554683:	68 ff 00 00 00       	push   0xff
  554688:	e8 53 04 00 00       	call   0x554ae0
  55468d:	8d 4b 20             	lea    ecx,[ebx+0x20]
  554690:	8d 53 14             	lea    edx,[ebx+0x14]
  554693:	51                   	push   ecx
  554694:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  554697:	52                   	push   edx
  554698:	8b 4b 08             	mov    ecx,DWORD PTR [ebx+0x8]
  55469b:	50                   	push   eax
  55469c:	51                   	push   ecx
  55469d:	8b cb                	mov    ecx,ebx
  55469f:	e8 3c 04 00 00       	call   0x554ae0
  5546a4:	8d 4b 24             	lea    ecx,[ebx+0x24]
  5546a7:	8d 53 18             	lea    edx,[ebx+0x18]
  5546aa:	51                   	push   ecx
  5546ab:	8b 46 08             	mov    eax,DWORD PTR [esi+0x8]
  5546ae:	52                   	push   edx
  5546af:	8b 4b 0c             	mov    ecx,DWORD PTR [ebx+0xc]
  5546b2:	50                   	push   eax
  5546b3:	51                   	push   ecx
  5546b4:	8b cb                	mov    ecx,ebx
  5546b6:	e8 25 04 00 00       	call   0x554ae0
  5546bb:	8b 4e 0c             	mov    ecx,DWORD PTR [esi+0xc]
  5546be:	5f                   	pop    edi
  5546bf:	5e                   	pop    esi
  5546c0:	89 4b 28             	mov    DWORD PTR [ebx+0x28],ecx
  5546c3:	5b                   	pop    ebx
  5546c4:	c2 08 00             	ret    0x8
  5546c7:	cc                   	int3
  5546c8:	cc                   	int3
  5546c9:	cc                   	int3
  5546ca:	cc                   	int3
  5546cb:	cc                   	int3
  5546cc:	cc                   	int3
  5546cd:	cc                   	int3
  5546ce:	cc                   	int3
  5546cf:	cc                   	int3
  5546d0:	83 ec 04             	sub    esp,0x4
  5546d3:	53                   	push   ebx
  5546d4:	56                   	push   esi
  5546d5:	57                   	push   edi
  5546d6:	55                   	push   ebp
  5546d7:	8b 41 2c             	mov    eax,DWORD PTR [ecx+0x2c]
  5546da:	8b f9                	mov    edi,ecx
  5546dc:	83 f8 01             	cmp    eax,0x1
  5546df:	0f 84 82 01 00 00    	je     0x554867
  5546e5:	83 f8 02             	cmp    eax,0x2
  5546e8:	75 79                	jne    0x554763
  5546ea:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  5546ee:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  5546f2:	ff 4c 24 20          	dec    DWORD PTR [esp+0x20]
  5546f6:	85 c0                	test   eax,eax
  5546f8:	0f 84 cb 01 00 00    	je     0x5548c9
  5546fe:	8b 6c 24 1c          	mov    ebp,DWORD PTR [esp+0x1c]
  554702:	33 c0                	xor    eax,eax
  554704:	8b 57 08             	mov    edx,DWORD PTR [edi+0x8]
  554707:	8a 45 00             	mov    al,BYTE PTR [ebp+0x0]
  55470a:	8a 4f 14             	mov    cl,BYTE PTR [edi+0x14]
  55470d:	8b 5f 04             	mov    ebx,DWORD PTR [edi+0x4]
  554710:	45                   	inc    ebp
  554711:	8b 44 87 30          	mov    eax,DWORD PTR [edi+eax*4+0x30]
  554715:	83 c6 02             	add    esi,0x2
  554718:	23 d0                	and    edx,eax
  55471a:	23 d8                	and    ebx,eax
  55471c:	d3 ea                	shr    edx,cl
  55471e:	8a 4f 20             	mov    cl,BYTE PTR [edi+0x20]
  554721:	66 d3 e2             	shl    dx,cl
  554724:	8a 4f 10             	mov    cl,BYTE PTR [edi+0x10]
  554727:	d3 eb                	shr    ebx,cl
  554729:	8a 4f 1c             	mov    cl,BYTE PTR [edi+0x1c]
  55472c:	66 d3 e3             	shl    bx,cl
  55472f:	66 0b d3             	or     dx,bx
  554732:	8a 4f 18             	mov    cl,BYTE PTR [edi+0x18]
  554735:	8b 5f 0c             	mov    ebx,DWORD PTR [edi+0xc]
  554738:	23 d8                	and    ebx,eax
  55473a:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  55473e:	d3 eb                	shr    ebx,cl
  554740:	8a 4f 24             	mov    cl,BYTE PTR [edi+0x24]
  554743:	ff 4c 24 20          	dec    DWORD PTR [esp+0x20]
  554747:	66 d3 e3             	shl    bx,cl
  55474a:	66 0b d3             	or     dx,bx
  55474d:	66 0b 57 28          	or     dx,WORD PTR [edi+0x28]
  554751:	85 c0                	test   eax,eax
  554753:	66 89 56 fe          	mov    WORD PTR [esi-0x2],dx
  554757:	75 a9                	jne    0x554702
  554759:	5d                   	pop    ebp
  55475a:	5f                   	pop    edi
  55475b:	5e                   	pop    esi
  55475c:	5b                   	pop    ebx
  55475d:	83 c4 04             	add    esp,0x4
  554760:	c2 0c 00             	ret    0xc
  554763:	83 f8 03             	cmp    eax,0x3
  554766:	74 7b                	je     0x5547e3
  554768:	83 f8 04             	cmp    eax,0x4
  55476b:	0f 85 58 01 00 00    	jne    0x5548c9
  554771:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  554775:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  554779:	ff 4c 24 20          	dec    DWORD PTR [esp+0x20]
  55477d:	85 c0                	test   eax,eax
  55477f:	0f 84 44 01 00 00    	je     0x5548c9
  554785:	8b 6c 24 1c          	mov    ebp,DWORD PTR [esp+0x1c]
  554789:	33 c0                	xor    eax,eax
  55478b:	8b 57 08             	mov    edx,DWORD PTR [edi+0x8]
  55478e:	8a 45 00             	mov    al,BYTE PTR [ebp+0x0]
  554791:	8a 4f 14             	mov    cl,BYTE PTR [edi+0x14]
  554794:	8b 5f 04             	mov    ebx,DWORD PTR [edi+0x4]
  554797:	45                   	inc    ebp
  554798:	8b 44 87 30          	mov    eax,DWORD PTR [edi+eax*4+0x30]
  55479c:	83 c6 04             	add    esi,0x4
  55479f:	23 d0                	and    edx,eax
  5547a1:	23 d8                	and    ebx,eax
  5547a3:	d3 ea                	shr    edx,cl
  5547a5:	8a 4f 20             	mov    cl,BYTE PTR [edi+0x20]
  5547a8:	d3 e2                	shl    edx,cl
  5547aa:	8a 4f 10             	mov    cl,BYTE PTR [edi+0x10]
  5547ad:	d3 eb                	shr    ebx,cl
  5547af:	8a 4f 1c             	mov    cl,BYTE PTR [edi+0x1c]
  5547b2:	d3 e3                	shl    ebx,cl
  5547b4:	0b d3                	or     edx,ebx
  5547b6:	8a 4f 18             	mov    cl,BYTE PTR [edi+0x18]
  5547b9:	8b 5f 0c             	mov    ebx,DWORD PTR [edi+0xc]
  5547bc:	23 d8                	and    ebx,eax
  5547be:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  5547c2:	d3 eb                	shr    ebx,cl
  5547c4:	8a 4f 24             	mov    cl,BYTE PTR [edi+0x24]
  5547c7:	ff 4c 24 20          	dec    DWORD PTR [esp+0x20]
  5547cb:	d3 e3                	shl    ebx,cl
  5547cd:	0b d3                	or     edx,ebx
  5547cf:	0b 57 28             	or     edx,DWORD PTR [edi+0x28]
  5547d2:	85 c0                	test   eax,eax
  5547d4:	89 56 fc             	mov    DWORD PTR [esi-0x4],edx
  5547d7:	75 b0                	jne    0x554789
  5547d9:	5d                   	pop    ebp
  5547da:	5f                   	pop    edi
  5547db:	5e                   	pop    esi
  5547dc:	5b                   	pop    ebx
  5547dd:	83 c4 04             	add    esp,0x4
  5547e0:	c2 0c 00             	ret    0xc
  5547e3:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  5547e7:	ff 4c 24 20          	dec    DWORD PTR [esp+0x20]
  5547eb:	85 c0                	test   eax,eax
  5547ed:	0f 84 d6 00 00 00    	je     0x5548c9
  5547f3:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  5547f7:	8b 6c 24 1c          	mov    ebp,DWORD PTR [esp+0x1c]
  5547fb:	33 c0                	xor    eax,eax
  5547fd:	8b 57 08             	mov    edx,DWORD PTR [edi+0x8]
  554800:	8a 45 00             	mov    al,BYTE PTR [ebp+0x0]
  554803:	8a 4f 14             	mov    cl,BYTE PTR [edi+0x14]
  554806:	8b 5f 04             	mov    ebx,DWORD PTR [edi+0x4]
  554809:	45                   	inc    ebp
  55480a:	8b 44 87 30          	mov    eax,DWORD PTR [edi+eax*4+0x30]
  55480e:	83 c6 03             	add    esi,0x3
  554811:	23 d0                	and    edx,eax
  554813:	23 d8                	and    ebx,eax
  554815:	d3 ea                	shr    edx,cl
  554817:	8a 4f 20             	mov    cl,BYTE PTR [edi+0x20]
  55481a:	d3 e2                	shl    edx,cl
  55481c:	8a 4f 10             	mov    cl,BYTE PTR [edi+0x10]
  55481f:	d3 eb                	shr    ebx,cl
  554821:	8a 4f 1c             	mov    cl,BYTE PTR [edi+0x1c]
  554824:	d3 e3                	shl    ebx,cl
  554826:	0b d3                	or     edx,ebx
  554828:	8a 4f 18             	mov    cl,BYTE PTR [edi+0x18]
  55482b:	8b 5f 0c             	mov    ebx,DWORD PTR [edi+0xc]
  55482e:	23 d8                	and    ebx,eax
  554830:	d3 eb                	shr    ebx,cl
  554832:	8a 4f 24             	mov    cl,BYTE PTR [edi+0x24]
  554835:	d3 e3                	shl    ebx,cl
  554837:	0b d3                	or     edx,ebx
  554839:	0b 57 28             	or     edx,DWORD PTR [edi+0x28]
  55483c:	89 54 24 10          	mov    DWORD PTR [esp+0x10],edx
  554840:	88 56 fd             	mov    BYTE PTR [esi-0x3],dl
  554843:	8a 44 24 11          	mov    al,BYTE PTR [esp+0x11]
  554847:	88 46 fe             	mov    BYTE PTR [esi-0x2],al
  55484a:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  55484e:	8a 4c 24 12          	mov    cl,BYTE PTR [esp+0x12]
  554852:	ff 4c 24 20          	dec    DWORD PTR [esp+0x20]
  554856:	88 4e ff             	mov    BYTE PTR [esi-0x1],cl
  554859:	85 c0                	test   eax,eax
  55485b:	75 9e                	jne    0x5547fb
  55485d:	5d                   	pop    ebp
  55485e:	5f                   	pop    edi
  55485f:	5e                   	pop    esi
  554860:	5b                   	pop    ebx
  554861:	83 c4 04             	add    esp,0x4
  554864:	c2 0c 00             	ret    0xc
  554867:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  55486b:	ff 4c 24 20          	dec    DWORD PTR [esp+0x20]
  55486f:	85 c0                	test   eax,eax
  554871:	74 56                	je     0x5548c9
  554873:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  554877:	8b 6c 24 1c          	mov    ebp,DWORD PTR [esp+0x1c]
  55487b:	33 c0                	xor    eax,eax
  55487d:	8b 57 08             	mov    edx,DWORD PTR [edi+0x8]
  554880:	8a 45 00             	mov    al,BYTE PTR [ebp+0x0]
  554883:	8a 4f 14             	mov    cl,BYTE PTR [edi+0x14]
  554886:	8b 5f 04             	mov    ebx,DWORD PTR [edi+0x4]
  554889:	45                   	inc    ebp
  55488a:	8b 44 87 30          	mov    eax,DWORD PTR [edi+eax*4+0x30]
  55488e:	46                   	inc    esi
  55488f:	23 d0                	and    edx,eax
  554891:	23 d8                	and    ebx,eax
  554893:	d3 ea                	shr    edx,cl
  554895:	8a 4f 20             	mov    cl,BYTE PTR [edi+0x20]
  554898:	d2 e2                	shl    dl,cl
  55489a:	8a 4f 10             	mov    cl,BYTE PTR [edi+0x10]
  55489d:	d3 eb                	shr    ebx,cl
  55489f:	8a 4f 1c             	mov    cl,BYTE PTR [edi+0x1c]
  5548a2:	d2 e3                	shl    bl,cl
  5548a4:	0a d3                	or     dl,bl
  5548a6:	8a 4f 18             	mov    cl,BYTE PTR [edi+0x18]
  5548a9:	8b 5f 0c             	mov    ebx,DWORD PTR [edi+0xc]
  5548ac:	23 d8                	and    ebx,eax
  5548ae:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  5548b2:	d3 eb                	shr    ebx,cl
  5548b4:	8a 4f 24             	mov    cl,BYTE PTR [edi+0x24]
  5548b7:	ff 4c 24 20          	dec    DWORD PTR [esp+0x20]
  5548bb:	d2 e3                	shl    bl,cl
  5548bd:	0a d3                	or     dl,bl
  5548bf:	0a 57 28             	or     dl,BYTE PTR [edi+0x28]
  5548c2:	85 c0                	test   eax,eax
  5548c4:	88 56 ff             	mov    BYTE PTR [esi-0x1],dl
  5548c7:	75 b2                	jne    0x55487b
  5548c9:	5d                   	pop    ebp
  5548ca:	5f                   	pop    edi
  5548cb:	5e                   	pop    esi
  5548cc:	5b                   	pop    ebx
  5548cd:	83 c4 04             	add    esp,0x4
