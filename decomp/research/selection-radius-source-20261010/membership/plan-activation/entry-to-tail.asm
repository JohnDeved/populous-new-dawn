
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004b8470 <.text+0xb7470>:
  4b8470:	81 ec 28 07 00 00    	sub    esp,0x728
  4b8476:	53                   	push   ebx
  4b8477:	56                   	push   esi
  4b8478:	8b b4 24 34 07 00 00 	mov    esi,DWORD PTR [esp+0x734]
  4b847f:	57                   	push   edi
  4b8480:	55                   	push   ebp
  4b8481:	33 ff                	xor    edi,edi
  4b8483:	66 8b 7e 24          	mov    di,WORD PTR [esi+0x24]
  4b8487:	33 db                	xor    ebx,ebx
  4b8489:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4b848c:	88 5c 24 12          	mov    BYTE PTR [esp+0x12],bl
  4b8490:	88 5c 24 13          	mov    BYTE PTR [esp+0x13],bl
  4b8494:	a8 04                	test   al,0x4
  4b8496:	0f 84 b9 00 00 00    	je     0x4b8555
  4b849c:	0f be 4e 2f          	movsx  ecx,BYTE PTR [esi+0x2f]
  4b84a0:	83 e0 fb             	and    eax,0xfffffffb
  4b84a3:	8d 14 89             	lea    edx,[ecx+ecx*4]
  4b84a6:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4b84a9:	8b c1                	mov    eax,ecx
  4b84ab:	8d 0c 51             	lea    ecx,[ecx+edx*2]
  4b84ae:	8d 2c c9             	lea    ebp,[ecx+ecx*8]
  4b84b1:	8d 14 e8             	lea    edx,[eax+ebp*8]
  4b84b4:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  4b84b8:	51                   	push   ecx
  4b84b9:	8a 84 90 e7 dd 89 00 	mov    al,BYTE PTR [eax+edx*4+0x89dde7]
  4b84c0:	fe c8                	dec    al
  4b84c2:	66 8b 56 68          	mov    dx,WORD PTR [esi+0x68]
  4b84c6:	3c 01                	cmp    al,0x1
  4b84c8:	66 0f b6 8e 9b 00 00 	movzx  cx,BYTE PTR [esi+0x9b]
  4b84cf:	00 
  4b84d0:	1a c0                	sbb    al,al
  4b84d2:	f6 d8                	neg    al
  4b84d4:	88 84 24 fc 00 00 00 	mov    BYTE PTR [esp+0xfc],al
  4b84db:	8d 84 24 1c 04 00 00 	lea    eax,[esp+0x41c]
  4b84e2:	50                   	push   eax
  4b84e3:	52                   	push   edx
  4b84e4:	51                   	push   ecx
  4b84e5:	e8 66 18 00 00       	call   0x4b9d50
  4b84ea:	83 c4 10             	add    esp,0x10
  4b84ed:	39 5c 24 14          	cmp    DWORD PTR [esp+0x14],ebx
  4b84f1:	7e 62                	jle    0x4b8555
  4b84f3:	8d ac 24 1e 04 00 00 	lea    ebp,[esp+0x41e]
  4b84fa:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  4b84ff:	0f 85 43 06 00 00    	jne    0x4b8b48
  4b8505:	8b 84 24 f8 00 00 00 	mov    eax,DWORD PTR [esp+0xf8]
  4b850c:	8a 8e 9e 00 00 00    	mov    cl,BYTE PTR [esi+0x9e]
  4b8512:	50                   	push   eax
  4b8513:	8a 55 00             	mov    dl,BYTE PTR [ebp+0x0]
  4b8516:	66 8b 45 fe          	mov    ax,WORD PTR [ebp-0x2]
  4b851a:	57                   	push   edi
  4b851b:	51                   	push   ecx
  4b851c:	52                   	push   edx
  4b851d:	0f be 4e 2f          	movsx  ecx,BYTE PTR [esi+0x2f]
  4b8521:	8d 14 89             	lea    edx,[ecx+ecx*4]
  4b8524:	50                   	push   eax
  4b8525:	8b c1                	mov    eax,ecx
  4b8527:	8d 0c 50             	lea    ecx,[eax+edx*2]
  4b852a:	8d 14 c9             	lea    edx,[ecx+ecx*8]
  4b852d:	8d 0c d0             	lea    ecx,[eax+edx*8]
  4b8530:	8d 0c 88             	lea    ecx,[eax+ecx*4]
  4b8533:	81 c1 c8 d1 89 00    	add    ecx,0x89d1c8
  4b8539:	51                   	push   ecx
  4b853a:	e8 11 69 f9 ff       	call   0x44ee50
  4b853f:	83 c4 18             	add    esp,0x18
  4b8542:	84 c0                	test   al,al
  4b8544:	75 05                	jne    0x4b854b
  4b8546:	c6 44 24 13 01       	mov    BYTE PTR [esp+0x13],0x1
  4b854b:	83 c5 08             	add    ebp,0x8
  4b854e:	43                   	inc    ebx
  4b854f:	3b 5c 24 14          	cmp    ebx,DWORD PTR [esp+0x14]
  4b8553:	7c a5                	jl     0x4b84fa
  4b8555:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  4b855a:	0f 85 ef 05 00 00    	jne    0x4b8b4f
  4b8560:	56                   	push   esi
  4b8561:	33 db                	xor    ebx,ebx
  4b8563:	e8 48 1c 00 00       	call   0x4ba1b0
  4b8568:	33 c9                	xor    ecx,ecx
  4b856a:	33 ed                	xor    ebp,ebp
  4b856c:	8a 8e 9e 00 00 00    	mov    cl,BYTE PTR [esi+0x9e]
  4b8572:	33 c0                	xor    eax,eax
  4b8574:	83 c4 04             	add    esp,0x4
  4b8577:	8a 9e 9a 00 00 00    	mov    bl,BYTE PTR [esi+0x9a]
  4b857d:	8d 14 c9             	lea    edx,[ecx+ecx*8]
  4b8580:	8d 0c 51             	lea    ecx,[ecx+edx*2]
  4b8583:	c1 e1 02             	shl    ecx,0x2
  4b8586:	85 db                	test   ebx,ebx
  4b8588:	66 8b a9 3a 72 5a 00 	mov    bp,WORD PTR [ecx+0x5a723a]
  4b858f:	66 8b 81 3e 72 5a 00 	mov    ax,WORD PTR [ecx+0x5a723e]
  4b8596:	89 44 24 2c          	mov    DWORD PTR [esp+0x2c],eax
  4b859a:	0f 84 81 05 00 00    	je     0x4b8b21
  4b85a0:	b8 00 00 00 00       	mov    eax,0x0
  4b85a5:	bf 00 00 00 00       	mov    edi,0x0
  4b85aa:	66 8b 81 40 72 5a 00 	mov    ax,WORD PTR [ecx+0x5a7240]
  4b85b1:	0f be 4e 2f          	movsx  ecx,BYTE PTR [esi+0x2f]
  4b85b5:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  4b85b9:	89 4c 24 20          	mov    DWORD PTR [esp+0x20],ecx
  4b85bd:	7e 27                	jle    0x4b85e6
  4b85bf:	8d 44 24 58          	lea    eax,[esp+0x58]
  4b85c3:	8d 4e 6a             	lea    ecx,[esi+0x6a]
  4b85c6:	66 8b 11             	mov    dx,WORD PTR [ecx]
  4b85c9:	66 85 d2             	test   dx,dx
  4b85cc:	74 11                	je     0x4b85df
  4b85ce:	0f b7 d2             	movzx  edx,dx
  4b85d1:	83 c0 04             	add    eax,0x4
  4b85d4:	47                   	inc    edi
  4b85d5:	8b 14 95 90 03 89 00 	mov    edx,DWORD PTR [edx*4+0x890390]
  4b85dc:	89 50 fc             	mov    DWORD PTR [eax-0x4],edx
  4b85df:	83 c1 02             	add    ecx,0x2
  4b85e2:	3b fb                	cmp    edi,ebx
  4b85e4:	7c e0                	jl     0x4b85c6
  4b85e6:	8d 7c 24 30          	lea    edi,[esp+0x30]
  4b85ea:	33 c0                	xor    eax,eax
  4b85ec:	b9 0a 00 00 00       	mov    ecx,0xa
  4b85f1:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4b85f3:	8d 84 24 a8 00 00 00 	lea    eax,[esp+0xa8]
  4b85fa:	8d 4c 24 30          	lea    ecx,[esp+0x30]
  4b85fe:	8d 54 24 58          	lea    edx,[esp+0x58]
  4b8602:	50                   	push   eax
  4b8603:	51                   	push   ecx
  4b8604:	52                   	push   edx
  4b8605:	56                   	push   esi
  4b8606:	e8 55 1c 00 00       	call   0x4ba260
  4b860b:	83 c4 10             	add    esp,0x10
  4b860e:	3b eb                	cmp    ebp,ebx
  4b8610:	0f 8f b8 04 00 00    	jg     0x4b8ace
  4b8616:	f6 46 2e 0f          	test   BYTE PTR [esi+0x2e],0xf
  4b861a:	0f 85 c4 04 00 00    	jne    0x4b8ae4
  4b8620:	f6 86 9c 00 00 00 01 	test   BYTE PTR [esi+0x9c],0x1
  4b8627:	75 17                	jne    0x4b8640
  4b8629:	83 7c 24 38 00       	cmp    DWORD PTR [esp+0x38],0x0
  4b862e:	7f 10                	jg     0x4b8640
  4b8630:	8b 44 24 54          	mov    eax,DWORD PTR [esp+0x54]
  4b8634:	03 44 24 38          	add    eax,DWORD PTR [esp+0x38]
  4b8638:	3b c3                	cmp    eax,ebx
  4b863a:	0f 8c a4 04 00 00    	jl     0x4b8ae4
  4b8640:	80 a6 9c 00 00 00 fe 	and    BYTE PTR [esi+0x9c],0xfe
  4b8647:	b8 c0 80 5a 00       	mov    eax,0x5a80c0
  4b864c:	c6 00 00             	mov    BYTE PTR [eax],0x0
  4b864f:	83 c0 02             	add    eax,0x2
  4b8652:	3d ce 80 5a 00       	cmp    eax,0x5a80ce
  4b8657:	72 f3                	jb     0x4b864c
  4b8659:	66 8b 56 68          	mov    dx,WORD PTR [esi+0x68]
  4b865d:	8d 44 24 14          	lea    eax,[esp+0x14]
  4b8661:	8d 8c 24 18 04 00 00 	lea    ecx,[esp+0x418]
  4b8668:	50                   	push   eax
  4b8669:	66 0f b6 86 9b 00 00 	movzx  ax,BYTE PTR [esi+0x9b]
  4b8670:	00 
  4b8671:	51                   	push   ecx
  4b8672:	52                   	push   edx
  4b8673:	50                   	push   eax
  4b8674:	e8 d7 16 00 00       	call   0x4b9d50
  4b8679:	83 c4 10             	add    esp,0x10
  4b867c:	80 be 9e 00 00 00 0a 	cmp    BYTE PTR [esi+0x9e],0xa
  4b8683:	74 75                	je     0x4b86fa
  4b8685:	66 8b 56 68          	mov    dx,WORD PTR [esi+0x68]
  4b8689:	8d 44 24 18          	lea    eax,[esp+0x18]
  4b868d:	8d 8c 24 f8 00 00 00 	lea    ecx,[esp+0xf8]
  4b8694:	50                   	push   eax
  4b8695:	c6 44 24 15 01       	mov    BYTE PTR [esp+0x15],0x1
  4b869a:	51                   	push   ecx
  4b869b:	33 ff                	xor    edi,edi
  4b869d:	66 0f b6 86 9b 00 00 	movzx  ax,BYTE PTR [esi+0x9b]
  4b86a4:	00 
  4b86a5:	52                   	push   edx
  4b86a6:	50                   	push   eax
  4b86a7:	e8 74 17 00 00       	call   0x4b9e20
  4b86ac:	83 c4 10             	add    esp,0x10
  4b86af:	39 7c 24 18          	cmp    DWORD PTR [esp+0x18],edi
  4b86b3:	7e 35                	jle    0x4b86ea
  4b86b5:	8d ac 24 f8 00 00 00 	lea    ebp,[esp+0xf8]
  4b86bc:	55                   	push   ebp
  4b86bd:	56                   	push   esi
  4b86be:	e8 2d bd f4 ff       	call   0x4043f0
  4b86c3:	83 c4 08             	add    esp,0x8
  4b86c6:	8b 4d 00             	mov    ecx,DWORD PTR [ebp+0x0]
  4b86c9:	0f bf 51 04          	movsx  edx,WORD PTR [ecx+0x4]
  4b86cd:	2b c2                	sub    eax,edx
  4b86cf:	99                   	cdq
  4b86d0:	33 c2                	xor    eax,edx
  4b86d2:	2b c2                	sub    eax,edx
  4b86d4:	83 f8 01             	cmp    eax,0x1
  4b86d7:	7f 0c                	jg     0x4b86e5
  4b86d9:	83 c5 08             	add    ebp,0x8
  4b86dc:	47                   	inc    edi
  4b86dd:	3b 7c 24 18          	cmp    edi,DWORD PTR [esp+0x18]
  4b86e1:	7c d9                	jl     0x4b86bc
  4b86e3:	eb 05                	jmp    0x4b86ea
  4b86e5:	c6 44 24 11 00       	mov    BYTE PTR [esp+0x11],0x0
  4b86ea:	80 7c 24 11 01       	cmp    BYTE PTR [esp+0x11],0x1
  4b86ef:	1a c0                	sbb    al,al
  4b86f1:	f6 d8                	neg    al
  4b86f3:	a2 c2 80 5a 00       	mov    ds:0x5a80c2,al
  4b86f8:	eb 07                	jmp    0x4b8701
  4b86fa:	c6 05 c2 80 5a 00 00 	mov    BYTE PTR ds:0x5a80c2,0x0
  4b8701:	c6 44 24 18 00       	mov    BYTE PTR [esp+0x18],0x0
  4b8706:	0f bf 86 96 00 00 00 	movsx  eax,WORD PTR [esi+0x96]
  4b870d:	3b 44 24 1c          	cmp    eax,DWORD PTR [esp+0x1c]
  4b8711:	0f 9c c1             	setl   cl
  4b8714:	88 0d c0 80 5a 00    	mov    BYTE PTR ds:0x5a80c0,cl
  4b871a:	83 7c 24 14 00       	cmp    DWORD PTR [esp+0x14],0x0
  4b871f:	0f 8e ca 00 00 00    	jle    0x4b87ef
  4b8725:	8d bc 24 18 04 00 00 	lea    edi,[esp+0x418]
  4b872c:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  4b8730:	89 84 24 f8 00 00 00 	mov    DWORD PTR [esp+0xf8],eax
  4b8737:	8b 07                	mov    eax,DWORD PTR [edi]
  4b8739:	0f bf 48 06          	movsx  ecx,WORD PTR [eax+0x6]
  4b873d:	8b 14 8d 90 03 89 00 	mov    edx,DWORD PTR [ecx*4+0x890390]
  4b8744:	85 d2                	test   edx,edx
  4b8746:	0f 84 93 00 00 00    	je     0x4b87df
  4b874c:	33 c0                	xor    eax,eax
  4b874e:	8a 42 2a             	mov    al,BYTE PTR [edx+0x2a]
  4b8751:	83 f8 01             	cmp    eax,0x1
  4b8754:	74 0c                	je     0x4b8762
  4b8756:	83 f8 03             	cmp    eax,0x3
  4b8759:	74 4a                	je     0x4b87a5
  4b875b:	83 f8 05             	cmp    eax,0x5
  4b875e:	74 4d                	je     0x4b87ad
  4b8760:	eb 68                	jmp    0x4b87ca
  4b8762:	0f be 42 2f          	movsx  eax,BYTE PTR [edx+0x2f]
  4b8766:	3b 44 24 20          	cmp    eax,DWORD PTR [esp+0x20]
  4b876a:	75 31                	jne    0x4b879d
  4b876c:	33 c9                	xor    ecx,ecx
  4b876e:	32 c0                	xor    al,al
  4b8770:	85 db                	test   ebx,ebx
  4b8772:	7e 15                	jle    0x4b8789
  4b8774:	8d 6c 24 58          	lea    ebp,[esp+0x58]
  4b8778:	39 55 00             	cmp    DWORD PTR [ebp+0x0],edx
  4b877b:	74 0a                	je     0x4b8787
  4b877d:	83 c5 04             	add    ebp,0x4
  4b8780:	41                   	inc    ecx
  4b8781:	3b d9                	cmp    ebx,ecx
  4b8783:	7f f3                	jg     0x4b8778
  4b8785:	eb 02                	jmp    0x4b8789
  4b8787:	b0 01                	mov    al,0x1
  4b8789:	84 c0                	test   al,al
  4b878b:	75 08                	jne    0x4b8795
  4b878d:	fe 05 c6 80 5a 00    	inc    BYTE PTR ds:0x5a80c6
  4b8793:	eb 35                	jmp    0x4b87ca
  4b8795:	fe 05 cc 80 5a 00    	inc    BYTE PTR ds:0x5a80cc
  4b879b:	eb 2d                	jmp    0x4b87ca
  4b879d:	fe 05 c8 80 5a 00    	inc    BYTE PTR ds:0x5a80c8
  4b87a3:	eb 25                	jmp    0x4b87ca
  4b87a5:	fe 05 ca 80 5a 00    	inc    BYTE PTR ds:0x5a80ca
  4b87ab:	eb 1d                	jmp    0x4b87ca
  4b87ad:	33 c0                	xor    eax,eax
  4b87af:	fe 05 c4 80 5a 00    	inc    BYTE PTR ds:0x5a80c4
  4b87b5:	8a 42 2b             	mov    al,BYTE PTR [edx+0x2b]
  4b87b8:	8d 0c 40             	lea    ecx,[eax+eax*2]
  4b87bb:	f6 04 cd c4 79 5a 00 	test   BYTE PTR [ecx*8+0x5a79c4],0x10
  4b87c2:	10 
  4b87c3:	74 05                	je     0x4b87ca
  4b87c5:	c6 44 24 18 01       	mov    BYTE PTR [esp+0x18],0x1
  4b87ca:	33 c0                	xor    eax,eax
  4b87cc:	66 8b 42 20          	mov    ax,WORD PTR [edx+0x20]
  4b87d0:	8b 14 85 90 03 89 00 	mov    edx,DWORD PTR [eax*4+0x890390]
  4b87d7:	85 d2                	test   edx,edx
  4b87d9:	0f 85 6d ff ff ff    	jne    0x4b874c
  4b87df:	83 c7 08             	add    edi,0x8
  4b87e2:	ff 8c 24 f8 00 00 00 	dec    DWORD PTR [esp+0xf8]
  4b87e9:	0f 85 48 ff ff ff    	jne    0x4b8737
  4b87ef:	c6 84 24 f8 00 00 00 	mov    BYTE PTR [esp+0xf8],0x1
  4b87f6:	01 
  4b87f7:	b8 c0 80 5a 00       	mov    eax,0x5a80c0
  4b87fc:	80 38 00             	cmp    BYTE PTR [eax],0x0
  4b87ff:	75 0c                	jne    0x4b880d
  4b8801:	83 c0 02             	add    eax,0x2
  4b8804:	3d ce 80 5a 00       	cmp    eax,0x5a80ce
  4b8809:	72 f1                	jb     0x4b87fc
  4b880b:	eb 08                	jmp    0x4b8815
  4b880d:	c6 84 24 f8 00 00 00 	mov    BYTE PTR [esp+0xf8],0x0
  4b8814:	00 
  4b8815:	33 c9                	xor    ecx,ecx
  4b8817:	38 8c 24 f8 00 00 00 	cmp    BYTE PTR [esp+0xf8],cl
  4b881e:	74 35                	je     0x4b8855
  4b8820:	33 ff                	xor    edi,edi
  4b8822:	85 db                	test   ebx,ebx
  4b8824:	7e 23                	jle    0x4b8849
  4b8826:	8d 44 24 58          	lea    eax,[esp+0x58]
  4b882a:	84 c9                	test   cl,cl
  4b882c:	75 27                	jne    0x4b8855
  4b882e:	8b 10                	mov    edx,DWORD PTR [eax]
  4b8830:	80 7a 2d 09          	cmp    BYTE PTR [edx+0x2d],0x9
  4b8834:	75 0b                	jne    0x4b8841
  4b8836:	80 ba a8 00 00 00 06 	cmp    BYTE PTR [edx+0xa8],0x6
  4b883d:	75 02                	jne    0x4b8841
  4b883f:	b1 01                	mov    cl,0x1
  4b8841:	83 c0 04             	add    eax,0x4
  4b8844:	47                   	inc    edi
  4b8845:	3b df                	cmp    ebx,edi
  4b8847:	7f e1                	jg     0x4b882a
  4b8849:	84 c9                	test   cl,cl
  4b884b:	75 08                	jne    0x4b8855
  4b884d:	c6 84 24 f8 00 00 00 	mov    BYTE PTR [esp+0xf8],0x0
  4b8854:	00 
  4b8855:	80 bc 24 f8 00 00 00 	cmp    BYTE PTR [esp+0xf8],0x0
  4b885c:	00 
  4b885d:	0f 85 65 01 00 00    	jne    0x4b89c8
  4b8863:	c6 44 24 11 00       	mov    BYTE PTR [esp+0x11],0x0
  4b8868:	39 5c 24 54          	cmp    DWORD PTR [esp+0x54],ebx
  4b886c:	75 0e                	jne    0x4b887c
  4b886e:	80 3d cc 80 5a 00 00 	cmp    BYTE PTR ds:0x5a80cc,0x0
  4b8875:	75 05                	jne    0x4b887c
  4b8877:	c6 44 24 11 01       	mov    BYTE PTR [esp+0x11],0x1
  4b887c:	33 d2                	xor    edx,edx
  4b887e:	bf c1 80 5a 00       	mov    edi,0x5a80c1
  4b8883:	c7 84 24 f8 00 00 00 	mov    DWORD PTR [esp+0xf8],0x0
  4b888a:	00 00 00 00 
  4b888e:	83 7c 24 38 00       	cmp    DWORD PTR [esp+0x38],0x0
  4b8893:	0f 84 d3 00 00 00    	je     0x4b896c
  4b8899:	81 ff c3 80 5a 00    	cmp    edi,0x5a80c3
  4b889f:	75 19                	jne    0x4b88ba
  4b88a1:	33 c0                	xor    eax,eax
  4b88a3:	33 c9                	xor    ecx,ecx
  4b88a5:	8a 86 9e 00 00 00    	mov    al,BYTE PTR [esi+0x9e]
  4b88ab:	8d 2c c0             	lea    ebp,[eax+eax*8]
  4b88ae:	8d 04 68             	lea    eax,[eax+ebp*2]
  4b88b1:	8a 0c 85 47 72 5a 00 	mov    cl,BYTE PTR [eax*4+0x5a7247]
  4b88b8:	eb 32                	jmp    0x4b88ec
  4b88ba:	81 ff c5 80 5a 00    	cmp    edi,0x5a80c5
  4b88c0:	75 25                	jne    0x4b88e7
  4b88c2:	80 7c 24 18 00       	cmp    BYTE PTR [esp+0x18],0x0
  4b88c7:	74 1e                	je     0x4b88e7
  4b88c9:	33 c0                	xor    eax,eax
  4b88cb:	33 c9                	xor    ecx,ecx
  4b88cd:	8a 86 9e 00 00 00    	mov    al,BYTE PTR [esi+0x9e]
  4b88d3:	8d 2c c0             	lea    ebp,[eax+eax*8]
  4b88d6:	8d 04 68             	lea    eax,[eax+ebp*2]
  4b88d9:	8a 04 85 47 72 5a 00 	mov    al,BYTE PTR [eax*4+0x5a7247]
  4b88e0:	c0 e8 01             	shr    al,0x1
  4b88e3:	8a c8                	mov    cl,al
  4b88e5:	eb 05                	jmp    0x4b88ec
  4b88e7:	b9 01 00 00 00       	mov    ecx,0x1
  4b88ec:	c7 44 24 1c 00 00 00 	mov    DWORD PTR [esp+0x1c],0x0
  4b88f3:	00 
  4b88f4:	85 c9                	test   ecx,ecx
  4b88f6:	7e 64                	jle    0x4b895c
  4b88f8:	83 7c 24 38 00       	cmp    DWORD PTR [esp+0x38],0x0
  4b88fd:	74 5d                	je     0x4b895c
  4b88ff:	c6 44 24 20 00       	mov    BYTE PTR [esp+0x20],0x0
  4b8904:	83 fa 06             	cmp    edx,0x6
  4b8907:	74 15                	je     0x4b891e
  4b8909:	80 7f ff 00          	cmp    BYTE PTR [edi-0x1],0x0
  4b890d:	74 0f                	je     0x4b891e
  4b890f:	33 c0                	xor    eax,eax
  4b8911:	8a 07                	mov    al,BYTE PTR [edi]
  4b8913:	39 4c 84 30          	cmp    DWORD PTR [esp+eax*4+0x30],ecx
  4b8917:	7d 05                	jge    0x4b891e
  4b8919:	c6 44 24 20 01       	mov    BYTE PTR [esp+0x20],0x1
  4b891e:	80 7c 24 20 00       	cmp    BYTE PTR [esp+0x20],0x0
  4b8923:	74 2d                	je     0x4b8952
  4b8925:	33 c0                	xor    eax,eax
  4b8927:	ff 4c 24 38          	dec    DWORD PTR [esp+0x38]
  4b892b:	8a 07                	mov    al,BYTE PTR [edi]
  4b892d:	ff 44 84 30          	inc    DWORD PTR [esp+eax*4+0x30]
  4b8931:	8b 84 24 f8 00 00 00 	mov    eax,DWORD PTR [esp+0xf8]
  4b8938:	ff 84 24 f8 00 00 00 	inc    DWORD PTR [esp+0xf8]
  4b893f:	8b ac 84 a8 00 00 00 	mov    ebp,DWORD PTR [esp+eax*4+0xa8]
  4b8946:	8a 07                	mov    al,BYTE PTR [edi]
  4b8948:	88 45 2d             	mov    BYTE PTR [ebp+0x2d],al
  4b894b:	81 4d 0c 00 00 00 40 	or     DWORD PTR [ebp+0xc],0x40000000
  4b8952:	ff 44 24 1c          	inc    DWORD PTR [esp+0x1c]
  4b8956:	3b 4c 24 1c          	cmp    ecx,DWORD PTR [esp+0x1c]
  4b895a:	7f 9c                	jg     0x4b88f8
  4b895c:	83 c7 02             	add    edi,0x2
  4b895f:	42                   	inc    edx
  4b8960:	81 ff cf 80 5a 00    	cmp    edi,0x5a80cf
  4b8966:	0f 82 22 ff ff ff    	jb     0x4b888e
  4b896c:	8b 44 24 54          	mov    eax,DWORD PTR [esp+0x54]
  4b8970:	03 44 24 38          	add    eax,DWORD PTR [esp+0x38]
  4b8974:	3b c3                	cmp    eax,ebx
  4b8976:	75 31                	jne    0x4b89a9
  4b8978:	80 3d cc 80 5a 00 00 	cmp    BYTE PTR ds:0x5a80cc,0x0
  4b897f:	74 28                	je     0x4b89a9
  4b8981:	85 db                	test   ebx,ebx
  4b8983:	7e 24                	jle    0x4b89a9
  4b8985:	8d 7c 24 58          	lea    edi,[esp+0x58]
  4b8989:	8b d3                	mov    edx,ebx
  4b898b:	8b 07                	mov    eax,DWORD PTR [edi]
  4b898d:	80 78 2d 09          	cmp    BYTE PTR [eax+0x2d],0x9
  4b8991:	74 10                	je     0x4b89a3
  4b8993:	8a 0d cd 80 5a 00    	mov    cl,BYTE PTR ds:0x5a80cd
  4b8999:	88 48 2d             	mov    BYTE PTR [eax+0x2d],cl
  4b899c:	81 48 0c 00 00 00 40 	or     DWORD PTR [eax+0xc],0x40000000
  4b89a3:	83 c7 04             	add    edi,0x4
  4b89a6:	4a                   	dec    edx
  4b89a7:	75 e2                	jne    0x4b898b
  4b89a9:	80 7c 24 11 00       	cmp    BYTE PTR [esp+0x11],0x0
  4b89ae:	0f 84 30 01 00 00    	je     0x4b8ae4
  4b89b4:	8b 44 24 58          	mov    eax,DWORD PTR [esp+0x58]
  4b89b8:	c6 40 2d 02          	mov    BYTE PTR [eax+0x2d],0x2
  4b89bc:	81 48 0c 00 00 00 40 	or     DWORD PTR [eax+0xc],0x40000000
  4b89c3:	e9 1c 01 00 00       	jmp    0x4b8ae4
  4b89c8:	66 8b 46 49          	mov    ax,WORD PTR [esi+0x49]
  4b89cc:	33 ff                	xor    edi,edi
  4b89ce:	66 8b 4e 4d          	mov    cx,WORD PTR [esi+0x4d]
  4b89d2:	66 89 44 24 24       	mov    WORD PTR [esp+0x24],ax
  4b89d7:	b8 01 00 00 00       	mov    eax,0x1
  4b89dc:	66 89 4c 24 26       	mov    WORD PTR [esp+0x26],cx
  4b89e1:	8b 15 43 24 89 00    	mov    edx,DWORD PTR ds:0x892443
  4b89e7:	66 89 7c 24 28       	mov    WORD PTR [esp+0x28],di
  4b89ec:	33 c9                	xor    ecx,ecx
  4b89ee:	a2 37 ce 89 00       	mov    ds:0x89ce37,al
  4b89f3:	8a 8e 9f 00 00 00    	mov    cl,BYTE PTR [esi+0x9f]
  4b89f9:	89 0a                	mov    DWORD PTR [edx],ecx
  4b89fb:	33 c9                	xor    ecx,ecx
  4b89fd:	66 8b 4e 24          	mov    cx,WORD PTR [esi+0x24]
  4b8a01:	8b 15 43 24 89 00    	mov    edx,DWORD PTR ds:0x892443
  4b8a07:	89 4a 04             	mov    DWORD PTR [edx+0x4],ecx
  4b8a0a:	8b 15 43 24 89 00    	mov    edx,DWORD PTR ds:0x892443
  4b8a10:	89 42 08             	mov    DWORD PTR [edx+0x8],eax
  4b8a13:	8b 15 43 24 89 00    	mov    edx,DWORD PTR ds:0x892443
  4b8a19:	c7 42 0c ff ff ff ff 	mov    DWORD PTR [edx+0xc],0xffffffff
  4b8a20:	8b 15 43 24 89 00    	mov    edx,DWORD PTR ds:0x892443
  4b8a26:	89 7a 10             	mov    DWORD PTR [edx+0x10],edi
  4b8a29:	83 05 43 24 89 00 14 	add    DWORD PTR ds:0x892443,0x14
  4b8a30:	a2 3a 24 89 00       	mov    ds:0x89243a,al
  4b8a35:	8d 44 24 24          	lea    eax,[esp+0x24]
  4b8a39:	50                   	push   eax
  4b8a3a:	8a 4e 2f             	mov    cl,BYTE PTR [esi+0x2f]
  4b8a3d:	51                   	push   ecx
  4b8a3e:	8a 96 9e 00 00 00    	mov    dl,BYTE PTR [esi+0x9e]
  4b8a44:	52                   	push   edx
  4b8a45:	6a 02                	push   0x2
  4b8a47:	e8 54 4e 03 00       	call   0x4ed8a0
  4b8a4c:	83 c4 10             	add    esp,0x10
  4b8a4f:	8b e8                	mov    ebp,eax
  4b8a51:	85 ed                	test   ebp,ebp
  4b8a53:	74 4f                	je     0x4b8aa4
  4b8a55:	66 8b 45 24          	mov    ax,WORD PTR [ebp+0x24]
  4b8a59:	66 89 86 92 00 00 00 	mov    WORD PTR [esi+0x92],ax
  4b8a60:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  4b8a64:	75 16                	jne    0x4b8a7c
  4b8a66:	56                   	push   esi
  4b8a67:	e8 84 4c 03 00       	call   0x4ed6f0
  4b8a6c:	83 c4 04             	add    esp,0x4
  4b8a6f:	c6 46 2c 02          	mov    BYTE PTR [esi+0x2c],0x2
  4b8a73:	56                   	push   esi
  4b8a74:	e8 c7 4b 03 00       	call   0x4ed640
  4b8a79:	83 c4 04             	add    esp,0x4
  4b8a7c:	80 3d 3a 24 89 00 00 	cmp    BYTE PTR ds:0x89243a,0x0
  4b8a83:	74 0e                	je     0x4b8a93
  4b8a85:	81 4d 0c 00 04 00 00 	or     DWORD PTR [ebp+0xc],0x400
  4b8a8c:	c6 05 3a 24 89 00 00 	mov    BYTE PTR ds:0x89243a,0x0
  4b8a93:	55                   	push   ebp
  4b8a94:	e8 e7 4a 03 00       	call   0x4ed580
  4b8a99:	66 8b 46 41          	mov    ax,WORD PTR [esi+0x41]
  4b8a9d:	83 c4 04             	add    esp,0x4
  4b8aa0:	66 89 45 41          	mov    WORD PTR [ebp+0x41],ax
  4b8aa4:	85 db                	test   ebx,ebx
  4b8aa6:	7e 3c                	jle    0x4b8ae4
  4b8aa8:	8d 4c 24 58          	lea    ecx,[esp+0x58]
  4b8aac:	8b c3                	mov    eax,ebx
  4b8aae:	8b 11                	mov    edx,DWORD PTR [ecx]
  4b8ab0:	83 c1 04             	add    ecx,0x4
  4b8ab3:	c6 42 2d 02          	mov    BYTE PTR [edx+0x2d],0x2
  4b8ab7:	81 4a 0c 00 00 00 40 	or     DWORD PTR [edx+0xc],0x40000000
  4b8abe:	c6 82 a8 00 00 00 15 	mov    BYTE PTR [edx+0xa8],0x15
  4b8ac5:	80 4a 76 10          	or     BYTE PTR [edx+0x76],0x10
  4b8ac9:	48                   	dec    eax
  4b8aca:	75 e2                	jne    0x4b8aae
  4b8acc:	eb 16                	jmp    0x4b8ae4
  4b8ace:	39 5c 24 38          	cmp    DWORD PTR [esp+0x38],ebx
  4b8ad2:	7d 10                	jge    0x4b8ae4
  4b8ad4:	c6 44 24 12 01       	mov    BYTE PTR [esp+0x12],0x1
  4b8ad9:	c7 84 24 f8 00 00 00 	mov    DWORD PTR [esp+0xf8],0x2
  4b8ae0:	02 00 00 00 
  4b8ae4:	80 7c 24 12 00       	cmp    BYTE PTR [esp+0x12],0x0
  4b8ae9:	74 36                	je     0x4b8b21
  4b8aeb:	85 db                	test   ebx,ebx
  4b8aed:	7e 32                	jle    0x4b8b21
  4b8aef:	8d 54 24 58          	lea    edx,[esp+0x58]
  4b8af3:	8b c3                	mov    eax,ebx
  4b8af5:	8b 3a                	mov    edi,DWORD PTR [edx]
  4b8af7:	33 c9                	xor    ecx,ecx
  4b8af9:	8a 4f 2d             	mov    cl,BYTE PTR [edi+0x2d]
  4b8afc:	3b 8c 24 f8 00 00 00 	cmp    ecx,DWORD PTR [esp+0xf8]
  4b8b03:	74 16                	je     0x4b8b1b
  4b8b05:	80 f9 01             	cmp    cl,0x1
  4b8b08:	74 11                	je     0x4b8b1b
  4b8b0a:	8a 8c 24 f8 00 00 00 	mov    cl,BYTE PTR [esp+0xf8]
  4b8b11:	88 4f 2d             	mov    BYTE PTR [edi+0x2d],cl
  4b8b14:	81 4f 0c 00 00 00 40 	or     DWORD PTR [edi+0xc],0x40000000
  4b8b1b:	83 c2 04             	add    edx,0x4
  4b8b1e:	48                   	dec    eax
  4b8b1f:	75 d4                	jne    0x4b8af5
  4b8b21:	39 5c 24 2c          	cmp    DWORD PTR [esp+0x2c],ebx
  4b8b25:	7e 21                	jle    0x4b8b48
  4b8b27:	f6 46 2e 7f          	test   BYTE PTR [esi+0x2e],0x7f
  4b8b2b:	75 1b                	jne    0x4b8b48
  4b8b2d:	85 db                	test   ebx,ebx
  4b8b2f:	75 17                	jne    0x4b8b48
  4b8b31:	8a 86 9d 00 00 00    	mov    al,BYTE PTR [esi+0x9d]
  4b8b37:	fe c0                	inc    al
  4b8b39:	88 86 9d 00 00 00    	mov    BYTE PTR [esi+0x9d],al
  4b8b3f:	3c 32                	cmp    al,0x32
  4b8b41:	76 05                	jbe    0x4b8b48
  4b8b43:	c6 44 24 13 01       	mov    BYTE PTR [esp+0x13],0x1
