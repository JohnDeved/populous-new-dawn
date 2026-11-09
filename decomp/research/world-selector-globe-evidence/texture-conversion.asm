
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004306a0 <.text+0x2f6a0>:
  4306a0:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  4306a4:	8b 4c 24 04          	mov    ecx,DWORD PTR [esp+0x4]
  4306a8:	8b 54 24 08          	mov    edx,DWORD PTR [esp+0x8]
  4306ac:	83 ec 04             	sub    esp,0x4
  4306af:	50                   	push   eax
  4306b0:	51                   	push   ecx
  4306b1:	8d 4c 24 0b          	lea    ecx,[esp+0xb]
  4306b5:	52                   	push   edx
  4306b6:	e8 55 9e 0f 00       	call   0x52a510
  4306bb:	40                   	inc    eax
  4306bc:	83 f8 01             	cmp    eax,0x1
  4306bf:	1b c0                	sbb    eax,eax
  4306c1:	83 c4 04             	add    esp,0x4
  4306c4:	c3                   	ret
  4306c5:	cc                   	int3
  4306c6:	cc                   	int3
  4306c7:	cc                   	int3
  4306c8:	cc                   	int3
  4306c9:	cc                   	int3
  4306ca:	cc                   	int3
  4306cb:	cc                   	int3
  4306cc:	cc                   	int3
  4306cd:	cc                   	int3
  4306ce:	cc                   	int3
  4306cf:	cc                   	int3
  4306d0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4306d4:	83 ec 3c             	sub    esp,0x3c
  4306d7:	83 c0 04             	add    eax,0x4
  4306da:	53                   	push   ebx
  4306db:	56                   	push   esi
  4306dc:	57                   	push   edi
  4306dd:	55                   	push   ebp
  4306de:	8b 48 08             	mov    ecx,DWORD PTR [eax+0x8]
  4306e1:	8b 50 04             	mov    edx,DWORD PTR [eax+0x4]
  4306e4:	89 4c 24 34          	mov    DWORD PTR [esp+0x34],ecx
  4306e8:	8b 08                	mov    ecx,DWORD PTR [eax]
  4306ea:	89 4c 24 18          	mov    DWORD PTR [esp+0x18],ecx
  4306ee:	8a 4c 24 54          	mov    cl,BYTE PTR [esp+0x54]
  4306f2:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4306f6:	bd 01 00 00 00       	mov    ebp,0x1
  4306fb:	d3 e8                	shr    eax,cl
  4306fd:	8a 4c 24 58          	mov    cl,BYTE PTR [esp+0x58]
  430701:	89 44 24 44          	mov    DWORD PTR [esp+0x44],eax
  430705:	d3 ea                	shr    edx,cl
  430707:	8a 4c 24 54          	mov    cl,BYTE PTR [esp+0x54]
  43070b:	b8 01 00 00 00       	mov    eax,0x1
  430710:	d3 e5                	shl    ebp,cl
  430712:	8a 4c 24 58          	mov    cl,BYTE PTR [esp+0x58]
  430716:	d3 e0                	shl    eax,cl
  430718:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  43071c:	8b 44 24 54          	mov    eax,DWORD PTR [esp+0x54]
  430720:	03 44 24 58          	add    eax,DWORD PTR [esp+0x58]
  430724:	85 d2                	test   edx,edx
  430726:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  43072a:	0f 84 e4 00 00 00    	je     0x430814
  430730:	c7 44 24 14 00 00 00 	mov    DWORD PTR [esp+0x14],0x0
  430737:	00 
  430738:	89 54 24 40          	mov    DWORD PTR [esp+0x40],edx
  43073c:	83 7c 24 44 00       	cmp    DWORD PTR [esp+0x44],0x0
  430741:	0f 84 bb 00 00 00    	je     0x430802
  430747:	c7 44 24 30 00 00 00 	mov    DWORD PTR [esp+0x30],0x0
  43074e:	00 
  43074f:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  430753:	8b c1                	mov    eax,ecx
  430755:	89 4c 24 2c          	mov    DWORD PTR [esp+0x2c],ecx
  430759:	8a 4c 24 58          	mov    cl,BYTE PTR [esp+0x58]
  43075d:	d3 e0                	shl    eax,cl
  43075f:	8b 4c 24 44          	mov    ecx,DWORD PTR [esp+0x44]
  430763:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  430767:	89 4c 24 3c          	mov    DWORD PTR [esp+0x3c],ecx
  43076b:	33 d2                	xor    edx,edx
  43076d:	33 db                	xor    ebx,ebx
  43076f:	8b 44 24 50          	mov    eax,DWORD PTR [esp+0x50]
  430773:	8b 74 24 30          	mov    esi,DWORD PTR [esp+0x30]
  430777:	89 54 24 28          	mov    DWORD PTR [esp+0x28],edx
  43077b:	8b 08                	mov    ecx,DWORD PTR [eax]
  43077d:	89 4c 24 24          	mov    DWORD PTR [esp+0x24],ecx
  430781:	8a 4c 24 54          	mov    cl,BYTE PTR [esp+0x54]
  430785:	d3 e6                	shl    esi,cl
  430787:	03 74 24 18          	add    esi,DWORD PTR [esp+0x18]
  43078b:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  43078f:	03 c6                	add    eax,esi
  430791:	39 54 24 20          	cmp    DWORD PTR [esp+0x20],edx
  430795:	74 37                	je     0x4307ce
  430797:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  43079b:	89 4c 24 38          	mov    DWORD PTR [esp+0x38],ecx
  43079f:	85 ed                	test   ebp,ebp
  4307a1:	74 21                	je     0x4307c4
  4307a3:	8b f0                	mov    esi,eax
  4307a5:	8b fd                	mov    edi,ebp
  4307a7:	33 c9                	xor    ecx,ecx
  4307a9:	8a 4e 02             	mov    cl,BYTE PTR [esi+0x2]
  4307ac:	83 c6 03             	add    esi,0x3
  4307af:	03 d1                	add    edx,ecx
  4307b1:	33 c9                	xor    ecx,ecx
  4307b3:	8a 4e fe             	mov    cl,BYTE PTR [esi-0x2]
  4307b6:	03 d9                	add    ebx,ecx
  4307b8:	33 c9                	xor    ecx,ecx
  4307ba:	8a 4e fd             	mov    cl,BYTE PTR [esi-0x3]
  4307bd:	01 4c 24 28          	add    DWORD PTR [esp+0x28],ecx
  4307c1:	4f                   	dec    edi
  4307c2:	75 e3                	jne    0x4307a7
  4307c4:	03 44 24 34          	add    eax,DWORD PTR [esp+0x34]
  4307c8:	ff 4c 24 38          	dec    DWORD PTR [esp+0x38]
  4307cc:	75 d1                	jne    0x43079f
  4307ce:	8b 74 24 24          	mov    esi,DWORD PTR [esp+0x24]
  4307d2:	8b 4c 24 2c          	mov    ecx,DWORD PTR [esp+0x2c]
  4307d6:	03 f1                	add    esi,ecx
  4307d8:	8b 44 24 28          	mov    eax,DWORD PTR [esp+0x28]
  4307dc:	8a 4c 24 10          	mov    cl,BYTE PTR [esp+0x10]
  4307e0:	d3 e8                	shr    eax,cl
  4307e2:	d3 eb                	shr    ebx,cl
  4307e4:	d3 ea                	shr    edx,cl
  4307e6:	83 44 24 2c 03       	add    DWORD PTR [esp+0x2c],0x3
  4307eb:	83 44 24 30 03       	add    DWORD PTR [esp+0x30],0x3
  4307f0:	88 06                	mov    BYTE PTR [esi],al
  4307f2:	ff 4c 24 3c          	dec    DWORD PTR [esp+0x3c]
  4307f6:	88 5e 01             	mov    BYTE PTR [esi+0x1],bl
  4307f9:	88 56 02             	mov    BYTE PTR [esi+0x2],dl
  4307fc:	0f 85 69 ff ff ff    	jne    0x43076b
  430802:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  430806:	01 44 24 14          	add    DWORD PTR [esp+0x14],eax
  43080a:	ff 4c 24 40          	dec    DWORD PTR [esp+0x40]
  43080e:	0f 85 28 ff ff ff    	jne    0x43073c
  430814:	5d                   	pop    ebp
  430815:	5f                   	pop    edi
  430816:	5e                   	pop    esi
  430817:	5b                   	pop    ebx
  430818:	83 c4 3c             	add    esp,0x3c
  43081b:	c3                   	ret
  43081c:	cc                   	int3
  43081d:	cc                   	int3
  43081e:	cc                   	int3
  43081f:	cc                   	int3
  430820:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  430824:	83 ec 44             	sub    esp,0x44
  430827:	83 c0 04             	add    eax,0x4
  43082a:	53                   	push   ebx
  43082b:	56                   	push   esi
  43082c:	57                   	push   edi
  43082d:	55                   	push   ebp
  43082e:	8b                   	.byte 0x8b
  43082f:	48                   	dec    eax
