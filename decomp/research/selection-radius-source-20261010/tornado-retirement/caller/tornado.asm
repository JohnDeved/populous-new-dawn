
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0050f490 <.text+0x10e490>:
  50f490:	83 ec 44             	sub    esp,0x44
  50f493:	53                   	push   ebx
  50f494:	56                   	push   esi
  50f495:	8b 74 24 50          	mov    esi,DWORD PTR [esp+0x50]
  50f499:	57                   	push   edi
  50f49a:	66 8b 4e 72          	mov    cx,WORD PTR [esi+0x72]
  50f49e:	55                   	push   ebp
  50f49f:	66 49                	dec    cx
  50f4a1:	66 8b 46 61          	mov    ax,WORD PTR [esi+0x61]
  50f4a5:	66 89 4e 72          	mov    WORD PTR [esi+0x72],cx
  50f4a9:	66 85 c0             	test   ax,ax
  50f4ac:	74 06                	je     0x50f4b4
  50f4ae:	66 48                	dec    ax
  50f4b0:	66 89 46 61          	mov    WORD PTR [esi+0x61],ax
  50f4b4:	66 85 c9             	test   cx,cx
  50f4b7:	75 0a                	jne    0x50f4c3
  50f4b9:	80 7e 2d 00          	cmp    BYTE PTR [esi+0x2d],0x0
  50f4bd:	0f 85 69 09 00 00    	jne    0x50fe2c
  50f4c3:	f6 46 10 10          	test   BYTE PTR [esi+0x10],0x10
  50f4c7:	75 10                	jne    0x50f4d9
  50f4c9:	6a 40                	push   0x40
  50f4cb:	68 a3 00 00 00       	push   0xa3
  50f4d0:	56                   	push   esi
  50f4d1:	e8 7a ab f7 ff       	call   0x48a050
  50f4d6:	83 c4 0c             	add    esp,0xc
  50f4d9:	8d 46 3d             	lea    eax,[esi+0x3d]
  50f4dc:	8d 54 24 4c          	lea    edx,[esp+0x4c]
  50f4e0:	8b 08                	mov    ecx,DWORD PTR [eax]
  50f4e2:	66 8b 40 04          	mov    ax,WORD PTR [eax+0x4]
  50f4e6:	89 0a                	mov    DWORD PTR [edx],ecx
  50f4e8:	66 8b 4e 5d          	mov    cx,WORD PTR [esi+0x5d]
  50f4ec:	66 89 42 04          	mov    WORD PTR [edx+0x4],ax
  50f4f0:	8d 44 24 4c          	lea    eax,[esp+0x4c]
  50f4f4:	66 8b 56 5f          	mov    dx,WORD PTR [esi+0x5f]
  50f4f8:	52                   	push   edx
  50f4f9:	51                   	push   ecx
  50f4fa:	50                   	push   eax
  50f4fb:	e8 70 75 fd ff       	call   0x4e6a70
  50f500:	8d 4c 24 58          	lea    ecx,[esp+0x58]
  50f504:	83 c4 0c             	add    esp,0xc
  50f507:	51                   	push   ecx
  50f508:	56                   	push   esi
  50f509:	e8 72 f0 fd ff       	call   0x4ee580
  50f50e:	66 8b 4e 3f          	mov    cx,WORD PTR [esi+0x3f]
  50f512:	83 c4 08             	add    esp,0x8
  50f515:	66 8b 56 3d          	mov    dx,WORD PTR [esi+0x3d]
  50f519:	51                   	push   ecx
  50f51a:	52                   	push   edx
  50f51b:	e8 20 f4 f3 ff       	call   0x44e940
  50f520:	81 66 10 ff fb ff ff 	and    DWORD PTR [esi+0x10],0xfffffbff
  50f527:	66 89 46 41          	mov    WORD PTR [esi+0x41],ax
  50f52b:	83 c4 08             	add    esp,0x8
  50f52e:	80 7e 2d 00          	cmp    BYTE PTR [esi+0x2d],0x0
  50f532:	0f 85 4c 05 00 00    	jne    0x50fa84
  50f538:	8d 46 3d             	lea    eax,[esi+0x3d]
  50f53b:	8d 54 24 4c          	lea    edx,[esp+0x4c]
  50f53f:	33 ff                	xor    edi,edi
  50f541:	8b 08                	mov    ecx,DWORD PTR [eax]
  50f543:	66 8b 40 04          	mov    ax,WORD PTR [eax+0x4]
  50f547:	89 0a                	mov    DWORD PTR [edx],ecx
  50f549:	66 89 42 04          	mov    WORD PTR [edx+0x4],ax
  50f54d:	66 8b 46 74          	mov    ax,WORD PTR [esi+0x74]
  50f551:	66 81 44 24 50 a0 05 	add    WORD PTR [esp+0x50],0x5a0
  50f558:	66 85 c0             	test   ax,ax
  50f55b:	74 0a                	je     0x50f567
  50f55d:	0f b7 c0             	movzx  eax,ax
  50f560:	8b 3c 85 90 03 89 00 	mov    edi,DWORD PTR [eax*4+0x890390]
  50f567:	85 ff                	test   edi,edi
  50f569:	0f 84 ba 00 00 00    	je     0x50f629
  50f56f:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  50f574:	8b c8                	mov    ecx,eax
  50f576:	8d 14 c0             	lea    edx,[eax+eax*8]
  50f579:	8d 04 d1             	lea    eax,[ecx+edx*8]
  50f57c:	8d 04 81             	lea    eax,[ecx+eax*4]
  50f57f:	c1 e0 02             	shl    eax,0x2
  50f582:	8d 04 c1             	lea    eax,[ecx+eax*8]
  50f585:	05 df 24 00 00       	add    eax,0x24df
  50f58a:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50f58f:	89 44 24 40          	mov    DWORD PTR [esp+0x40],eax
  50f593:	c1 4c 24 40 0d       	ror    DWORD PTR [esp+0x40],0xd
  50f598:	8b 54 24 40          	mov    edx,DWORD PTR [esp+0x40]
  50f59c:	8b 4c 24 40          	mov    ecx,DWORD PTR [esp+0x40]
  50f5a0:	83 e2 27             	and    edx,0x27
  50f5a3:	8b c1                	mov    eax,ecx
  50f5a5:	83 ea 14             	sub    edx,0x14
  50f5a8:	8d 1c c9             	lea    ebx,[ecx+ecx*8]
  50f5ab:	8d 0c d8             	lea    ecx,[eax+ebx*8]
  50f5ae:	8d 0c 88             	lea    ecx,[eax+ecx*4]
  50f5b1:	c1 e1 02             	shl    ecx,0x2
  50f5b4:	8d 0c c8             	lea    ecx,[eax+ecx*8]
  50f5b7:	81 c1 df 24 00 00    	add    ecx,0x24df
  50f5bd:	89 4c 24 3c          	mov    DWORD PTR [esp+0x3c],ecx
  50f5c1:	c1 4c 24 3c 0d       	ror    DWORD PTR [esp+0x3c],0xd
  50f5c6:	66 01 54 24 4c       	add    WORD PTR [esp+0x4c],dx
  50f5cb:	8b 44 24 3c          	mov    eax,DWORD PTR [esp+0x3c]
  50f5cf:	8d 4c 24 4c          	lea    ecx,[esp+0x4c]
  50f5d3:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50f5d8:	66 83 6c 24 50 5a    	sub    WORD PTR [esp+0x50],0x5a
  50f5de:	66 25 27 00          	and    ax,0x27
  50f5e2:	51                   	push   ecx
  50f5e3:	66 2d 14 00          	sub    ax,0x14
  50f5e7:	57                   	push   edi
  50f5e8:	66 01 44 24 56       	add    WORD PTR [esp+0x56],ax
  50f5ed:	e8 8e ef fd ff       	call   0x4ee580
  50f5f2:	66 8b 47 74          	mov    ax,WORD PTR [edi+0x74]
  50f5f6:	83 c4 08             	add    esp,0x8
  50f5f9:	66 85 c0             	test   ax,ax
  50f5fc:	74 10                	je     0x50f60e
  50f5fe:	0f b7 c0             	movzx  eax,ax
  50f601:	8b 0c 85 90 03 89 00 	mov    ecx,DWORD PTR [eax*4+0x890390]
  50f608:	8a 51 3c             	mov    dl,BYTE PTR [ecx+0x3c]
  50f60b:	88 57 3c             	mov    BYTE PTR [edi+0x3c],dl
  50f60e:	66 8b 47 74          	mov    ax,WORD PTR [edi+0x74]
  50f612:	66 85 c0             	test   ax,ax
  50f615:	74 12                	je     0x50f629
  50f617:	0f b7 c0             	movzx  eax,ax
  50f61a:	8b 3c 85 90 03 89 00 	mov    edi,DWORD PTR [eax*4+0x890390]
  50f621:	85 ff                	test   edi,edi
  50f623:	0f 85 46 ff ff ff    	jne    0x50f56f
  50f629:	66 8b 44 24 4c       	mov    ax,WORD PTR [esp+0x4c]
  50f62e:	66 8b 4c 24 4e       	mov    cx,WORD PTR [esp+0x4e]
  50f633:	88 64 24 16          	mov    BYTE PTR [esp+0x16],ah
  50f637:	33 c0                	xor    eax,eax
  50f639:	88 6c 24 17          	mov    BYTE PTR [esp+0x17],ch
  50f63d:	66 8b 44 24 16       	mov    ax,WORD PTR [esp+0x16]
  50f642:	33 c9                	xor    ecx,ecx
  50f644:	66 8b 4c 24 16       	mov    cx,WORD PTR [esp+0x16]
  50f649:	25 fe 00 00 00       	and    eax,0xfe
  50f64e:	03 c0                	add    eax,eax
  50f650:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  50f656:	0b c1                	or     eax,ecx
  50f658:	85 ff                	test   edi,edi
  50f65a:	8d 14 85 e4 03 8a 00 	lea    edx,[eax*4+0x8a03e4]
  50f661:	74 43                	je     0x50f6a6
  50f663:	8a 42 0c             	mov    al,BYTE PTR [edx+0xc]
  50f666:	33 c9                	xor    ecx,ecx
  50f668:	24 0f                	and    al,0xf
  50f66a:	8a c8                	mov    cl,al
  50f66c:	8b c1                	mov    eax,ecx
  50f66e:	c1 e1 03             	shl    ecx,0x3
  50f671:	2b c8                	sub    ecx,eax
  50f673:	f6 04 4d 28 a3 5a 00 	test   BYTE PTR [ecx*2+0x5aa328],0x2
  50f67a:	02 
  50f67b:	74 06                	je     0x50f683
  50f67d:	c6 47 3c 05          	mov    BYTE PTR [edi+0x3c],0x5
  50f681:	eb 23                	jmp    0x50f6a6
  50f683:	8a 42 0a             	mov    al,BYTE PTR [edx+0xa]
  50f686:	3c d4                	cmp    al,0xd4
  50f688:	76 06                	jbe    0x50f690
  50f68a:	c6 47 3c ff          	mov    BYTE PTR [edi+0x3c],0xff
  50f68e:	eb 16                	jmp    0x50f6a6
  50f690:	3c c8                	cmp    al,0xc8
  50f692:	76 06                	jbe    0x50f69a
  50f694:	c6 47 3c 03          	mov    BYTE PTR [edi+0x3c],0x3
  50f698:	eb 0c                	jmp    0x50f6a6
  50f69a:	c6 47 3c fe          	mov    BYTE PTR [edi+0x3c],0xfe
  50f69e:	3c 7f                	cmp    al,0x7f
  50f6a0:	77 04                	ja     0x50f6a6
  50f6a2:	c6 47 3c 04          	mov    BYTE PTR [edi+0x3c],0x4
  50f6a6:	66 8b 42 06          	mov    ax,WORD PTR [edx+0x6]
  50f6aa:	66 85 c0             	test   ax,ax
  50f6ad:	0f 84 8a 05 00 00    	je     0x50fc3d
  50f6b3:	0f bf c0             	movsx  eax,ax
  50f6b6:	8b 2c 85 90 03 89 00 	mov    ebp,DWORD PTR [eax*4+0x890390]
  50f6bd:	85 ed                	test   ebp,ebp
  50f6bf:	0f 84 78 05 00 00    	je     0x50fc3d
  50f6c5:	33 c0                	xor    eax,eax
  50f6c7:	66 8b 45 20          	mov    ax,WORD PTR [ebp+0x20]
  50f6cb:	8b 0c 85 90 03 89 00 	mov    ecx,DWORD PTR [eax*4+0x890390]
  50f6d2:	8a 45 2a             	mov    al,BYTE PTR [ebp+0x2a]
  50f6d5:	89 4c 24 44          	mov    DWORD PTR [esp+0x44],ecx
  50f6d9:	3c 01                	cmp    al,0x1
  50f6db:	0f 85 ee 00 00 00    	jne    0x50f7cf
  50f6e1:	f6 45 11 08          	test   BYTE PTR [ebp+0x11],0x8
  50f6e5:	0f 85 d8 00 00 00    	jne    0x50f7c3
  50f6eb:	80 7d 2b 08          	cmp    BYTE PTR [ebp+0x2b],0x8
  50f6ef:	0f 84 7e 03 00 00    	je     0x50fa73
  50f6f5:	f6 45 15 80          	test   BYTE PTR [ebp+0x15],0x80
  50f6f9:	0f 85 74 03 00 00    	jne    0x50fa73
  50f6ff:	80 7d 2c 18          	cmp    BYTE PTR [ebp+0x2c],0x18
  50f703:	0f 84 6a 03 00 00    	je     0x50fa73
  50f709:	f6 45 0e 80          	test   BYTE PTR [ebp+0xe],0x80
  50f70d:	74 51                	je     0x50f760
  50f70f:	66 8b 45 3d          	mov    ax,WORD PTR [ebp+0x3d]
  50f713:	66 8b 4d 3f          	mov    cx,WORD PTR [ebp+0x3f]
  50f717:	88 64 24 14          	mov    BYTE PTR [esp+0x14],ah
  50f71b:	55                   	push   ebp
  50f71c:	33 c0                	xor    eax,eax
  50f71e:	88 6c 24 19          	mov    BYTE PTR [esp+0x19],ch
  50f722:	66 8b 44 24 18       	mov    ax,WORD PTR [esp+0x18]
  50f727:	25 fe 00 00 00       	and    eax,0xfe
  50f72c:	8d 0c 45 00 00 00 00 	lea    ecx,[eax*2+0x0]
  50f733:	33 c0                	xor    eax,eax
  50f735:	66 8b 44 24 18       	mov    ax,WORD PTR [esp+0x18]
  50f73a:	25 00 fe 00 00       	and    eax,0xfe00
  50f73f:	0b c8                	or     ecx,eax
  50f741:	33 c0                	xor    eax,eax
  50f743:	66 8b 04 8d ec 03 8a 	mov    ax,WORD PTR [ecx*4+0x8a03ec]
  50f74a:	00 
  50f74b:	25 ff 03 00 00       	and    eax,0x3ff
  50f750:	8b 0c 85 90 03 89 00 	mov    ecx,DWORD PTR [eax*4+0x890390]
  50f757:	51                   	push   ecx
  50f758:	e8 33 7d ef ff       	call   0x407490
  50f75d:	83 c4 08             	add    esp,0x8
  50f760:	f6 45 0e 10          	test   BYTE PTR [ebp+0xe],0x10
  50f764:	0f 85 09 03 00 00    	jne    0x50fa73
  50f76a:	8a 45 2c             	mov    al,BYTE PTR [ebp+0x2c]
  50f76d:	55                   	push   ebp
  50f76e:	88 45 7d             	mov    BYTE PTR [ebp+0x7d],al
  50f771:	e8 7a df fd ff       	call   0x4ed6f0
  50f776:	83 c4 04             	add    esp,0x4
  50f779:	c6 45 2c 18          	mov    BYTE PTR [ebp+0x2c],0x18
  50f77d:	55                   	push   ebp
  50f77e:	e8 bd de fd ff       	call   0x4ed640
  50f783:	83 c4 04             	add    esp,0x4
  50f786:	80 7d 2b 07          	cmp    BYTE PTR [ebp+0x2b],0x7
  50f78a:	75 17                	jne    0x50f7a3
  50f78c:	a0 f0 c6 89 00       	mov    al,ds:0x89c6f0
  50f791:	6a 00                	push   0x0
  50f793:	38 45 2f             	cmp    BYTE PTR [ebp+0x2f],al
  50f796:	75 04                	jne    0x50f79c
  50f798:	6a 1a                	push   0x1a
  50f79a:	eb 0e                	jmp    0x50f7aa
  50f79c:	68 89 00 00 00       	push   0x89
  50f7a1:	eb 07                	jmp    0x50f7aa
  50f7a3:	6a 00                	push   0x0
  50f7a5:	68 d2 00 00 00       	push   0xd2
  50f7aa:	55                   	push   ebp
  50f7ab:	e8 a0 a8 f7 ff       	call   0x48a050
  50f7b0:	66 8b 46 24          	mov    ax,WORD PTR [esi+0x24]
  50f7b4:	83 c4 0c             	add    esp,0xc
  50f7b7:	66 89 85 89 00 00 00 	mov    WORD PTR [ebp+0x89],ax
  50f7be:	e9 b0 02 00 00       	jmp    0x50fa73
  50f7c3:	80 8d 93 00 00 00 02 	or     BYTE PTR [ebp+0x93],0x2
  50f7ca:	e9 a4 02 00 00       	jmp    0x50fa73
  50f7cf:	3c 07                	cmp    al,0x7
  50f7d1:	75 5a                	jne    0x50f82d
  50f7d3:	80 7d 2b 1b          	cmp    BYTE PTR [ebp+0x2b],0x1b
  50f7d7:	0f 85 96 02 00 00    	jne    0x50fa73
  50f7dd:	80 7d 2d 04          	cmp    BYTE PTR [ebp+0x2d],0x4
  50f7e1:	0f 83 8c 02 00 00    	jae    0x50fa73
  50f7e7:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  50f7ec:	8b c8                	mov    ecx,eax
  50f7ee:	8d 14 c0             	lea    edx,[eax+eax*8]
  50f7f1:	8d 04 d1             	lea    eax,[ecx+edx*8]
  50f7f4:	8d 04 81             	lea    eax,[ecx+eax*4]
  50f7f7:	c1 e0 02             	shl    eax,0x2
  50f7fa:	8d 04 c1             	lea    eax,[ecx+eax*8]
  50f7fd:	05 df 24 00 00       	add    eax,0x24df
  50f802:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50f807:	89 44 24 38          	mov    DWORD PTR [esp+0x38],eax
  50f80b:	c1 4c 24 38 0d       	ror    DWORD PTR [esp+0x38],0xd
  50f810:	8b 44 24 38          	mov    eax,DWORD PTR [esp+0x38]
  50f814:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50f819:	24 03                	and    al,0x3
  50f81b:	04 04                	add    al,0x4
  50f81d:	88 45 2d             	mov    BYTE PTR [ebp+0x2d],al
  50f820:	66 8b 4e 24          	mov    cx,WORD PTR [esi+0x24]
  50f824:	66 89 4d 74          	mov    WORD PTR [ebp+0x74],cx
  50f828:	e9 46 02 00 00       	jmp    0x50fa73
  50f82d:	3c 02                	cmp    al,0x2
  50f82f:	0f 85 ee 00 00 00    	jne    0x50f923
  50f835:	33 c9                	xor    ecx,ecx
  50f837:	8a 4d 2b             	mov    cl,BYTE PTR [ebp+0x2b]
  50f83a:	8d 14 c9             	lea    edx,[ecx+ecx*8]
  50f83d:	8d 0c 51             	lea    ecx,[ecx+edx*2]
  50f840:	f6 04 8d 71 72 5a 00 	test   BYTE PTR [ecx*4+0x5a7271],0x80
  50f847:	80 
  50f848:	0f 85 25 02 00 00    	jne    0x50fa73
  50f84e:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  50f853:	8b c8                	mov    ecx,eax
  50f855:	8d 14 c0             	lea    edx,[eax+eax*8]
  50f858:	8d 04 d1             	lea    eax,[ecx+edx*8]
  50f85b:	8d 04 81             	lea    eax,[ecx+eax*4]
  50f85e:	c1 e0 02             	shl    eax,0x2
  50f861:	8d 04 c1             	lea    eax,[ecx+eax*8]
  50f864:	05 df 24 00 00       	add    eax,0x24df
  50f869:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50f86e:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  50f872:	c1 4c 24 34 0d       	ror    DWORD PTR [esp+0x34],0xd
  50f877:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  50f87b:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50f880:	24 07                	and    al,0x7
  50f882:	3c 02                	cmp    al,0x2
  50f884:	0f 83 e9 01 00 00    	jae    0x50fa73
  50f88a:	8a 5d 78             	mov    bl,BYTE PTR [ebp+0x78]
  50f88d:	6a 01                	push   0x1
  50f88f:	55                   	push   ebp
  50f890:	33 ff                	xor    edi,edi
  50f892:	8d 43 ff             	lea    eax,[ebx-0x1]
  50f895:	88 45 78             	mov    BYTE PTR [ebp+0x78],al
  50f898:	e8 03 88 f8 ff       	call   0x4980a0
  50f89d:	83 c4 08             	add    esp,0x8
  50f8a0:	8a 46 2f             	mov    al,BYTE PTR [esi+0x2f]
  50f8a3:	50                   	push   eax
  50f8a4:	55                   	push   ebp
  50f8a5:	e8 56 94 ef ff       	call   0x408d00
  50f8aa:	66 8b 85 82 00 00 00 	mov    ax,WORD PTR [ebp+0x82]
  50f8b1:	83 c4 08             	add    esp,0x8
  50f8b4:	66 3b c7             	cmp    ax,di
  50f8b7:	74 18                	je     0x50f8d1
  50f8b9:	0f b7 c0             	movzx  eax,ax
  50f8bc:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  50f8c3:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  50f8c7:	75 08                	jne    0x50f8d1
  50f8c9:	80 78 2a 00          	cmp    BYTE PTR [eax+0x2a],0x0
  50f8cd:	74 02                	je     0x50f8d1
  50f8cf:	8b f8                	mov    edi,eax
  50f8d1:	85 ff                	test   edi,edi
  50f8d3:	74 16                	je     0x50f8eb
  50f8d5:	57                   	push   edi
  50f8d6:	e8 b5 ac fa ff       	call   0x4ba590
  50f8db:	83 c4 04             	add    esp,0x4
  50f8de:	8a 46 2f             	mov    al,BYTE PTR [esi+0x2f]
  50f8e1:	50                   	push   eax
  50f8e2:	57                   	push   edi
  50f8e3:	e8 c8 ac fa ff       	call   0x4ba5b0
  50f8e8:	83 c4 08             	add    esp,0x8
  50f8eb:	80 7d 2a 00          	cmp    BYTE PTR [ebp+0x2a],0x0
  50f8ef:	74 09                	je     0x50f8fa
  50f8f1:	38 5d 78             	cmp    BYTE PTR [ebp+0x78],bl
  50f8f4:	0f 84 79 01 00 00    	je     0x50fa73
  50f8fa:	6a 00                	push   0x0
  50f8fc:	6a ff                	push   0xffffffff
  50f8fe:	6a ff                	push   0xffffffff
  50f900:	6a 00                	push   0x0
  50f902:	56                   	push   esi
  50f903:	53                   	push   ebx
  50f904:	6a 01                	push   0x1
  50f906:	6a 00                	push   0x0
  50f908:	55                   	push   ebp
  50f909:	e8 52 7f ef ff       	call   0x407860
  50f90e:	83 c4 24             	add    esp,0x24
  50f911:	6a 00                	push   0x0
  50f913:	6a 12                	push   0x12
  50f915:	55                   	push   ebp
  50f916:	e8 35 a7 f7 ff       	call   0x48a050
  50f91b:	83 c4 0c             	add    esp,0xc
  50f91e:	e9 50 01 00 00       	jmp    0x50fa73
  50f923:	3c 05                	cmp    al,0x5
  50f925:	0f 85 f4 00 00 00    	jne    0x50fa1f
  50f92b:	8a 45 2b             	mov    al,BYTE PTR [ebp+0x2b]
  50f92e:	3c 06                	cmp    al,0x6
  50f930:	0f 87 92 00 00 00    	ja     0x50f9c8
  50f936:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  50f93b:	8b c8                	mov    ecx,eax
  50f93d:	8d 14 c0             	lea    edx,[eax+eax*8]
  50f940:	8d 04 d1             	lea    eax,[ecx+edx*8]
  50f943:	8d 04 81             	lea    eax,[ecx+eax*4]
  50f946:	c1 e0 02             	shl    eax,0x2
  50f949:	8d 04 c1             	lea    eax,[ecx+eax*8]
  50f94c:	05 df 24 00 00       	add    eax,0x24df
  50f951:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50f956:	89 44 24 30          	mov    DWORD PTR [esp+0x30],eax
  50f95a:	c1 4c 24 30 0d       	ror    DWORD PTR [esp+0x30],0xd
  50f95f:	8b 44 24 30          	mov    eax,DWORD PTR [esp+0x30]
  50f963:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50f968:	24 07                	and    al,0x7
  50f96a:	3c 04                	cmp    al,0x4
  50f96c:	0f 83 01 01 00 00    	jae    0x50fa73
  50f972:	66 83 bd 84 00 00 00 	cmp    WORD PTR [ebp+0x84],0x64
  50f979:	64 
  50f97a:	7c 3a                	jl     0x50f9b6
  50f97c:	8d 45 3d             	lea    eax,[ebp+0x3d]
  50f97f:	50                   	push   eax
  50f980:	68 ff 00 00 00       	push   0xff
  50f985:	6a 39                	push   0x39
  50f987:	6a 07                	push   0x7
  50f989:	e8 12 df fd ff       	call   0x4ed8a0
  50f98e:	83 c4 10             	add    esp,0x10
  50f991:	8b f8                	mov    edi,eax
  50f993:	85 ff                	test   edi,edi
  50f995:	74 1f                	je     0x50f9b6
  50f997:	6a 00                	push   0x0
  50f999:	68 d4 00 00 00       	push   0xd4
  50f99e:	57                   	push   edi
  50f99f:	e8 ac a6 f7 ff       	call   0x48a050
  50f9a4:	66 8b 46 24          	mov    ax,WORD PTR [esi+0x24]
  50f9a8:	83 c4 0c             	add    esp,0xc
  50f9ab:	66 89 47 72          	mov    WORD PTR [edi+0x72],ax
  50f9af:	81 4f 10 00 04 00 00 	or     DWORD PTR [edi+0x10],0x400
  50f9b6:	6a ff                	push   0xffffffff
  50f9b8:	6a 9c                	push   0xffffff9c
  50f9ba:	55                   	push   ebp
  50f9bb:	e8 30 80 f9 ff       	call   0x4a79f0
  50f9c0:	83 c4 0c             	add    esp,0xc
  50f9c3:	e9 ab 00 00 00       	jmp    0x50fa73
  50f9c8:	3c 08                	cmp    al,0x8
  50f9ca:	77 0e                	ja     0x50f9da
  50f9cc:	55                   	push   ebp
  50f9cd:	e8 ae f7 fd ff       	call   0x4ef180
  50f9d2:	83 c4 04             	add    esp,0x4
  50f9d5:	e9 99 00 00 00       	jmp    0x50fa73
  50f9da:	3c 0b                	cmp    al,0xb
  50f9dc:	0f 85 91 00 00 00    	jne    0x50fa73
  50f9e2:	66 8b 85 91 00 00 00 	mov    ax,WORD PTR [ebp+0x91]
  50f9e9:	33 c9                	xor    ecx,ecx
  50f9eb:	66 3b c1             	cmp    ax,cx
  50f9ee:	74 17                	je     0x50fa07
  50f9f0:	0f b7 c0             	movzx  eax,ax
  50f9f3:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  50f9fa:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  50f9fe:	75 07                	jne    0x50fa07
  50fa00:	38 48 2a             	cmp    BYTE PTR [eax+0x2a],cl
  50fa03:	74 02                	je     0x50fa07
  50fa05:	8b c8                	mov    ecx,eax
  50fa07:	85 c9                	test   ecx,ecx
  50fa09:	75 68                	jne    0x50fa73
  50fa0b:	66 8b 46 24          	mov    ax,WORD PTR [esi+0x24]
  50fa0f:	66 89 85 91 00 00 00 	mov    WORD PTR [ebp+0x91],ax
  50fa16:	81 4d 10 00 04 00 00 	or     DWORD PTR [ebp+0x10],0x400
  50fa1d:	eb 54                	jmp    0x50fa73
  50fa1f:	3c 04                	cmp    al,0x4
  50fa21:	75 50                	jne    0x50fa73
  50fa23:	83 c5 3d             	add    ebp,0x3d
  50fa26:	8a 46 2f             	mov    al,BYTE PTR [esi+0x2f]
  50fa29:	55                   	push   ebp
  50fa2a:	50                   	push   eax
  50fa2b:	6a 01                	push   0x1
  50fa2d:	6a 07                	push   0x7
  50fa2f:	e8 6c de fd ff       	call   0x4ed8a0
  50fa34:	83 c4 10             	add    esp,0x10
  50fa37:	85 c0                	test   eax,eax
  50fa39:	74 38                	je     0x50fa73
  50fa3b:	c7 40 68 03 00 00 00 	mov    DWORD PTR [eax+0x68],0x3
  50fa42:	b9 02 00 00 00       	mov    ecx,0x2
  50fa47:	66 89 48 70          	mov    WORD PTR [eax+0x70],cx
  50fa4b:	66 c7 40 72 05 00    	mov    WORD PTR [eax+0x72],0x5
  50fa51:	66 c7 40 78 62 00    	mov    WORD PTR [eax+0x78],0x62
  50fa57:	66 c7 40 74 8c 00    	mov    WORD PTR [eax+0x74],0x8c
  50fa5d:	c6 40 7b 01          	mov    BYTE PTR [eax+0x7b],0x1
  50fa61:	c6 40 7d 00          	mov    BYTE PTR [eax+0x7d],0x0
  50fa65:	66 89 48 76          	mov    WORD PTR [eax+0x76],cx
  50fa69:	0f bf 48 72          	movsx  ecx,WORD PTR [eax+0x72]
  50fa6d:	c1 e1 08             	shl    ecx,0x8
  50fa70:	89 48 6c             	mov    DWORD PTR [eax+0x6c],ecx
  50fa73:	8b 6c 24 44          	mov    ebp,DWORD PTR [esp+0x44]
  50fa77:	85 ed                	test   ebp,ebp
  50fa79:	0f 85 46 fc ff ff    	jne    0x50f6c5
  50fa7f:	e9 b9 01 00 00       	jmp    0x50fc3d
  50fa84:	66 83 7e 72 0c       	cmp    WORD PTR [esi+0x72],0xc
  50fa89:	7d 0e                	jge    0x50fa99
  50fa8b:	56                   	push   esi
  50fa8c:	68 a3 00 00 00       	push   0xa3
  50fa91:	e8 da ac f7 ff       	call   0x48a770
  50fa96:	83 c4 08             	add    esp,0x8
  50fa99:	8d 46 3d             	lea    eax,[esi+0x3d]
  50fa9c:	8d 54 24 4c          	lea    edx,[esp+0x4c]
  50faa0:	8b 08                	mov    ecx,DWORD PTR [eax]
  50faa2:	66 8b 40 04          	mov    ax,WORD PTR [eax+0x4]
  50faa6:	89 0a                	mov    DWORD PTR [edx],ecx
  50faa8:	66 89 42 04          	mov    WORD PTR [edx+0x4],ax
  50faac:	33 ff                	xor    edi,edi
  50faae:	66 8b 46 72          	mov    ax,WORD PTR [esi+0x72]
  50fab2:	66 2d 08 00          	sub    ax,0x8
  50fab6:	66 6b c0 5a          	imul   ax,ax,0x5a
  50faba:	66 01 44 24 50       	add    WORD PTR [esp+0x50],ax
  50fabf:	66 8b 46 74          	mov    ax,WORD PTR [esi+0x74]
  50fac3:	66 85 c0             	test   ax,ax
  50fac6:	74 0a                	je     0x50fad2
  50fac8:	0f b7 c0             	movzx  eax,ax
  50facb:	8b 3c 85 90 03 89 00 	mov    edi,DWORD PTR [eax*4+0x890390]
  50fad2:	85 ff                	test   edi,edi
  50fad4:	0f 84 bc 00 00 00    	je     0x50fb96
  50fada:	8b 0d 78 d1 89 00    	mov    ecx,DWORD PTR ds:0x89d178
  50fae0:	8b c1                	mov    eax,ecx
  50fae2:	8d 14 c9             	lea    edx,[ecx+ecx*8]
  50fae5:	8d 0c d0             	lea    ecx,[eax+edx*8]
  50fae8:	8d 0c 88             	lea    ecx,[eax+ecx*4]
  50faeb:	c1 e1 02             	shl    ecx,0x2
  50faee:	8d 0c c8             	lea    ecx,[eax+ecx*8]
  50faf1:	81 c1 df 24 00 00    	add    ecx,0x24df
  50faf7:	89 0d 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,ecx
  50fafd:	89 4c 24 2c          	mov    DWORD PTR [esp+0x2c],ecx
  50fb01:	c1 4c 24 2c 0d       	ror    DWORD PTR [esp+0x2c],0xd
  50fb06:	8b 54 24 2c          	mov    edx,DWORD PTR [esp+0x2c]
  50fb0a:	8b 44 24 2c          	mov    eax,DWORD PTR [esp+0x2c]
  50fb0e:	83 e2 27             	and    edx,0x27
  50fb11:	8b c8                	mov    ecx,eax
  50fb13:	83 ea 14             	sub    edx,0x14
  50fb16:	8d 1c c0             	lea    ebx,[eax+eax*8]
  50fb19:	8d 04 d9             	lea    eax,[ecx+ebx*8]
  50fb1c:	8d 04 81             	lea    eax,[ecx+eax*4]
  50fb1f:	c1 e0 02             	shl    eax,0x2
  50fb22:	8d 04 c1             	lea    eax,[ecx+eax*8]
  50fb25:	05 df 24 00 00       	add    eax,0x24df
  50fb2a:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  50fb2e:	c1 4c 24 28 0d       	ror    DWORD PTR [esp+0x28],0xd
  50fb33:	66 01 54 24 4c       	add    WORD PTR [esp+0x4c],dx
  50fb38:	8b 44 24 28          	mov    eax,DWORD PTR [esp+0x28]
  50fb3c:	8d 4c 24 4c          	lea    ecx,[esp+0x4c]
  50fb40:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50fb45:	66 83 6c 24 50 5a    	sub    WORD PTR [esp+0x50],0x5a
  50fb4b:	66 25 27 00          	and    ax,0x27
  50fb4f:	51                   	push   ecx
  50fb50:	66 2d 14 00          	sub    ax,0x14
  50fb54:	57                   	push   edi
  50fb55:	66 01 44 24 56       	add    WORD PTR [esp+0x56],ax
  50fb5a:	e8 21 ea fd ff       	call   0x4ee580
  50fb5f:	66 8b 47 74          	mov    ax,WORD PTR [edi+0x74]
  50fb63:	83 c4 08             	add    esp,0x8
  50fb66:	66 85 c0             	test   ax,ax
  50fb69:	74 10                	je     0x50fb7b
  50fb6b:	0f b7 c0             	movzx  eax,ax
  50fb6e:	8b 0c 85 90 03 89 00 	mov    ecx,DWORD PTR [eax*4+0x890390]
  50fb75:	8a 51 3c             	mov    dl,BYTE PTR [ecx+0x3c]
  50fb78:	88 57 3c             	mov    BYTE PTR [edi+0x3c],dl
  50fb7b:	66 8b 47 74          	mov    ax,WORD PTR [edi+0x74]
  50fb7f:	66 85 c0             	test   ax,ax
  50fb82:	74 12                	je     0x50fb96
  50fb84:	0f b7 c0             	movzx  eax,ax
  50fb87:	8b 3c 85 90 03 89 00 	mov    edi,DWORD PTR [eax*4+0x890390]
  50fb8e:	85 ff                	test   edi,edi
  50fb90:	0f 85 44 ff ff ff    	jne    0x50fada
  50fb96:	66 8b 44 24 4c       	mov    ax,WORD PTR [esp+0x4c]
  50fb9b:	66 8b 4c 24 4e       	mov    cx,WORD PTR [esp+0x4e]
  50fba0:	88 64 24 12          	mov    BYTE PTR [esp+0x12],ah
  50fba4:	33 c0                	xor    eax,eax
  50fba6:	88 6c 24 13          	mov    BYTE PTR [esp+0x13],ch
  50fbaa:	66 8b 44 24 12       	mov    ax,WORD PTR [esp+0x12]
  50fbaf:	33 c9                	xor    ecx,ecx
  50fbb1:	66 8b 4c 24 12       	mov    cx,WORD PTR [esp+0x12]
  50fbb6:	25 fe 00 00 00       	and    eax,0xfe
  50fbbb:	03 c0                	add    eax,eax
  50fbbd:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  50fbc3:	0b c1                	or     eax,ecx
  50fbc5:	85 ff                	test   edi,edi
  50fbc7:	8d 14 85 e4 03 8a 00 	lea    edx,[eax*4+0x8a03e4]
  50fbce:	74 43                	je     0x50fc13
  50fbd0:	8a 42 0c             	mov    al,BYTE PTR [edx+0xc]
  50fbd3:	33 c9                	xor    ecx,ecx
  50fbd5:	24 0f                	and    al,0xf
  50fbd7:	8a c8                	mov    cl,al
  50fbd9:	8b c1                	mov    eax,ecx
  50fbdb:	c1 e1 03             	shl    ecx,0x3
  50fbde:	2b c8                	sub    ecx,eax
  50fbe0:	f6 04 4d 28 a3 5a 00 	test   BYTE PTR [ecx*2+0x5aa328],0x2
  50fbe7:	02 
  50fbe8:	74 06                	je     0x50fbf0
  50fbea:	c6 47 3c 05          	mov    BYTE PTR [edi+0x3c],0x5
  50fbee:	eb 23                	jmp    0x50fc13
  50fbf0:	8a 42 0a             	mov    al,BYTE PTR [edx+0xa]
  50fbf3:	3c d4                	cmp    al,0xd4
  50fbf5:	76 06                	jbe    0x50fbfd
  50fbf7:	c6 47 3c ff          	mov    BYTE PTR [edi+0x3c],0xff
  50fbfb:	eb 16                	jmp    0x50fc13
  50fbfd:	3c c8                	cmp    al,0xc8
  50fbff:	76 06                	jbe    0x50fc07
  50fc01:	c6 47 3c 03          	mov    BYTE PTR [edi+0x3c],0x3
  50fc05:	eb 0c                	jmp    0x50fc13
  50fc07:	c6 47 3c fe          	mov    BYTE PTR [edi+0x3c],0xfe
  50fc0b:	3c 7f                	cmp    al,0x7f
  50fc0d:	77 04                	ja     0x50fc13
  50fc0f:	c6 47 3c 04          	mov    BYTE PTR [edi+0x3c],0x4
  50fc13:	66 8b 46 74          	mov    ax,WORD PTR [esi+0x74]
  50fc17:	33 c9                	xor    ecx,ecx
  50fc19:	66 85 c0             	test   ax,ax
  50fc1c:	74 12                	je     0x50fc30
  50fc1e:	0f b7 c0             	movzx  eax,ax
  50fc21:	8b 0c 85 90 03 89 00 	mov    ecx,DWORD PTR [eax*4+0x890390]
  50fc28:	66 8b 41 74          	mov    ax,WORD PTR [ecx+0x74]
  50fc2c:	66 89 46 74          	mov    WORD PTR [esi+0x74],ax
  50fc30:	85 c9                	test   ecx,ecx
  50fc32:	74 09                	je     0x50fc3d
  50fc34:	51                   	push   ecx
  50fc35:	e8 46 f5 fd ff       	call   0x4ef180
  50fc3a:	83 c4 04             	add    esp,0x4
  50fc3d:	8d 44 24 4c          	lea    eax,[esp+0x4c]
  50fc41:	8a 4e 2f             	mov    cl,BYTE PTR [esi+0x2f]
  50fc44:	50                   	push   eax
  50fc45:	51                   	push   ecx
  50fc46:	6a 2b                	push   0x2b
  50fc48:	6a 07                	push   0x7
  50fc4a:	e8 51 dc fd ff       	call   0x4ed8a0
  50fc4f:	83 c4 10             	add    esp,0x10
  50fc52:	85 c0                	test   eax,eax
  50fc54:	74 07                	je     0x50fc5d
  50fc56:	81 48 10 00 00 40 00 	or     DWORD PTR [eax+0x10],0x400000
  50fc5d:	66 8b 46 76          	mov    ax,WORD PTR [esi+0x76]
  50fc61:	66 48                	dec    ax
  50fc63:	66 89 46 76          	mov    WORD PTR [esi+0x76],ax
  50fc67:	66 85 c0             	test   ax,ax
  50fc6a:	0f 8f bc 01 00 00    	jg     0x50fe2c
  50fc70:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  50fc75:	8b c8                	mov    ecx,eax
  50fc77:	8d 14 c0             	lea    edx,[eax+eax*8]
  50fc7a:	66 83 7e 61 00       	cmp    WORD PTR [esi+0x61],0x0
  50fc7f:	8d 04 d1             	lea    eax,[ecx+edx*8]
  50fc82:	8d 04 81             	lea    eax,[ecx+eax*4]
  50fc85:	0f 84 cf 00 00 00    	je     0x50fd5a
  50fc8b:	c1 e0 02             	shl    eax,0x2
  50fc8e:	8d 04 c1             	lea    eax,[ecx+eax*8]
  50fc91:	05 df 24 00 00       	add    eax,0x24df
  50fc96:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50fc9b:	89 44 24 24          	mov    DWORD PTR [esp+0x24],eax
  50fc9f:	c1 4c 24 24 0d       	ror    DWORD PTR [esp+0x24],0xd
  50fca4:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  50fca8:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50fcad:	66 25 07 00          	and    ax,0x7
  50fcb1:	66 89 46 76          	mov    WORD PTR [esi+0x76],ax
  50fcb5:	66 8b 46 4f          	mov    ax,WORD PTR [esi+0x4f]
  50fcb9:	66 2b 46 3d          	sub    ax,WORD PTR [esi+0x3d]
  50fcbd:	0f b7 f8             	movzx  edi,ax
  50fcc0:	66 8b 46 51          	mov    ax,WORD PTR [esi+0x51]
  50fcc4:	8b cf                	mov    ecx,edi
  50fcc6:	66 2b 46 3f          	sub    ax,WORD PTR [esi+0x3f]
  50fcca:	85 ff                	test   edi,edi
  50fccc:	0f b7 c0             	movzx  eax,ax
  50fccf:	7d 04                	jge    0x50fcd5
  50fcd1:	8b cf                	mov    ecx,edi
  50fcd3:	f7 d9                	neg    ecx
  50fcd5:	8b d0                	mov    edx,eax
  50fcd7:	85 c0                	test   eax,eax
  50fcd9:	7d 04                	jge    0x50fcdf
  50fcdb:	8b d0                	mov    edx,eax
  50fcdd:	f7 da                	neg    edx
  50fcdf:	81 f9 00 80 00 00    	cmp    ecx,0x8000
  50fce5:	7c 06                	jl     0x50fced
  50fce7:	8d b9 00 00 ff ff    	lea    edi,[ecx-0x10000]
  50fced:	81 fa 00 80 00 00    	cmp    edx,0x8000
  50fcf3:	7c 06                	jl     0x50fcfb
  50fcf5:	8d 82 00 00 ff ff    	lea    eax,[edx-0x10000]
  50fcfb:	f7 d8                	neg    eax
  50fcfd:	50                   	push   eax
  50fcfe:	57                   	push   edi
  50fcff:	e8 70 63 07 00       	call   0x586074
  50fd04:	83 c4 08             	add    esp,0x8
  50fd07:	33 c9                	xor    ecx,ecx
  50fd09:	66 8b c8             	mov    cx,ax
  50fd0c:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  50fd11:	8d 1c c0             	lea    ebx,[eax+eax*8]
  50fd14:	81 e1 ff 07 00 00    	and    ecx,0x7ff
  50fd1a:	8b d0                	mov    edx,eax
  50fd1c:	8d 04 da             	lea    eax,[edx+ebx*8]
  50fd1f:	8d 04 82             	lea    eax,[edx+eax*4]
  50fd22:	c1 e0 02             	shl    eax,0x2
  50fd25:	8d 04 c2             	lea    eax,[edx+eax*8]
  50fd28:	05 df 24 00 00       	add    eax,0x24df
  50fd2d:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50fd32:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  50fd36:	c1 4c 24 20 0d       	ror    DWORD PTR [esp+0x20],0xd
  50fd3b:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  50fd3f:	bf c7 01 00 00       	mov    edi,0x1c7
  50fd44:	2b d2                	sub    edx,edx
  50fd46:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50fd4b:	f7 f7                	div    edi
  50fd4d:	8d 04 11             	lea    eax,[ecx+edx*1]
  50fd50:	2d e3 00 00 00       	sub    eax,0xe3
  50fd55:	e9 c9 00 00 00       	jmp    0x50fe23
  50fd5a:	c1 e0 02             	shl    eax,0x2
  50fd5d:	8d 04 c1             	lea    eax,[ecx+eax*8]
  50fd60:	05 df 24 00 00       	add    eax,0x24df
  50fd65:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50fd6a:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  50fd6e:	c1 4c 24 1c 0d       	ror    DWORD PTR [esp+0x1c],0xd
  50fd73:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  50fd77:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50fd7c:	66 25 1f 00          	and    ax,0x1f
  50fd80:	66 89 46 76          	mov    WORD PTR [esi+0x76],ax
  50fd84:	66 8b 46 3d          	mov    ax,WORD PTR [esi+0x3d]
  50fd88:	66 2b 46 57          	sub    ax,WORD PTR [esi+0x57]
  50fd8c:	0f b7 f8             	movzx  edi,ax
  50fd8f:	66 8b 46 3f          	mov    ax,WORD PTR [esi+0x3f]
  50fd93:	66 2b 46 59          	sub    ax,WORD PTR [esi+0x59]
  50fd97:	85 ff                	test   edi,edi
  50fd99:	0f b7 d0             	movzx  edx,ax
  50fd9c:	8b c7                	mov    eax,edi
  50fd9e:	7d 04                	jge    0x50fda4
  50fda0:	8b c7                	mov    eax,edi
  50fda2:	f7 d8                	neg    eax
  50fda4:	8b ca                	mov    ecx,edx
  50fda6:	85 d2                	test   edx,edx
  50fda8:	7d 04                	jge    0x50fdae
  50fdaa:	8b ca                	mov    ecx,edx
  50fdac:	f7 d9                	neg    ecx
  50fdae:	3d 00 80 00 00       	cmp    eax,0x8000
  50fdb3:	7c 06                	jl     0x50fdbb
  50fdb5:	8d b8 00 00 ff ff    	lea    edi,[eax-0x10000]
  50fdbb:	81 f9 00 80 00 00    	cmp    ecx,0x8000
  50fdc1:	7c 06                	jl     0x50fdc9
  50fdc3:	8d 91 00 00 ff ff    	lea    edx,[ecx-0x10000]
  50fdc9:	f7 da                	neg    edx
  50fdcb:	52                   	push   edx
  50fdcc:	57                   	push   edi
  50fdcd:	e8 a2 62 07 00       	call   0x586074
  50fdd2:	83 c4 08             	add    esp,0x8
  50fdd5:	33 c9                	xor    ecx,ecx
  50fdd7:	66 8b c8             	mov    cx,ax
  50fdda:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  50fddf:	8d 1c c0             	lea    ebx,[eax+eax*8]
  50fde2:	81 e1 ff 07 00 00    	and    ecx,0x7ff
  50fde8:	8b d0                	mov    edx,eax
  50fdea:	8d 04 da             	lea    eax,[edx+ebx*8]
  50fded:	8d 04 82             	lea    eax,[edx+eax*4]
  50fdf0:	c1 e0 02             	shl    eax,0x2
  50fdf3:	8d 04 c2             	lea    eax,[edx+eax*8]
  50fdf6:	05 df 24 00 00       	add    eax,0x24df
  50fdfb:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50fe00:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  50fe04:	c1 4c 24 18 0d       	ror    DWORD PTR [esp+0x18],0xd
  50fe09:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  50fe0d:	bf 55 03 00 00       	mov    edi,0x355
  50fe12:	2b d2                	sub    edx,edx
  50fe14:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50fe19:	f7 f7                	div    edi
  50fe1b:	8d 04 11             	lea    eax,[ecx+edx*1]
  50fe1e:	2d aa 01 00 00       	sub    eax,0x1aa
  50fe23:	25 ff 07 00 00       	and    eax,0x7ff
  50fe28:	66 89 46 5d          	mov    WORD PTR [esi+0x5d],ax
  50fe2c:	66 83 7e 72 00       	cmp    WORD PTR [esi+0x72],0x0
  50fe31:	75 1c                	jne    0x50fe4f
  50fe33:	66 c7 46 72 18 00    	mov    WORD PTR [esi+0x72],0x18
  50fe39:	8a 46 2d             	mov    al,BYTE PTR [esi+0x2d]
  50fe3c:	84 c0                	test   al,al
  50fe3e:	8d 48 01             	lea    ecx,[eax+0x1]
  50fe41:	88 4e 2d             	mov    BYTE PTR [esi+0x2d],cl
  50fe44:	74 09                	je     0x50fe4f
  50fe46:	56                   	push   esi
  50fe47:	e8 a4 de fd ff       	call   0x4edcf0
  50fe4c:	83 c4 04             	add    esp,0x4
  50fe4f:	5d                   	pop    ebp
  50fe50:	5f                   	pop    edi
  50fe51:	5e                   	pop    esi
  50fe52:	5b                   	pop    ebx
  50fe53:	83 c4 44             	add    esp,0x44
  50fe56:	c3                   	ret
  50fe57:	cc                   	int3
  50fe58:	cc                   	int3
  50fe59:	cc                   	int3
  50fe5a:	cc                   	int3
  50fe5b:	cc                   	int3
  50fe5c:	cc                   	int3
  50fe5d:	cc                   	int3
  50fe5e:	cc                   	int3
  50fe5f:	cc                   	int3
