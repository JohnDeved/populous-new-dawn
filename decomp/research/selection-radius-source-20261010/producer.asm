
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004615f0 <.text+0x605f0>:
  4615f0:	83 ec 0c             	sub    esp,0xc
  4615f3:	53                   	push   ebx
  4615f4:	56                   	push   esi
  4615f5:	57                   	push   edi
  4615f6:	55                   	push   ebp
  4615f7:	8b 7c 24 20          	mov    edi,DWORD PTR [esp+0x20]
  4615fb:	8a 87 bd 05 00 00    	mov    al,BYTE PTR [edi+0x5bd]
  461601:	84 c0                	test   al,al
  461603:	74 08                	je     0x46160d
  461605:	fe c8                	dec    al
  461607:	88 87 bd 05 00 00    	mov    BYTE PTR [edi+0x5bd],al
  46160d:	57                   	push   edi
  46160e:	e8 bd 0a 09 00       	call   0x4f20d0
  461613:	83 c4 04             	add    esp,0x4
  461616:	85 c0                	test   eax,eax
  461618:	74 3b                	je     0x461655
  46161a:	33 db                	xor    ebx,ebx
  46161c:	8d b7 40 05 00 00    	lea    esi,[edi+0x540]
  461622:	66 8b 06             	mov    ax,WORD PTR [esi]
  461625:	66 85 c0             	test   ax,ax
  461628:	74 22                	je     0x46164c
  46162a:	66 48                	dec    ax
  46162c:	66 89 06             	mov    WORD PTR [esi],ax
  46162f:	75 1b                	jne    0x46164c
  461631:	8a 46 fe             	mov    al,BYTE PTR [esi-0x2]
  461634:	84 c0                	test   al,al
  461636:	74 14                	je     0x46164c
  461638:	fe c8                	dec    al
  46163a:	88 46 fe             	mov    BYTE PTR [esi-0x2],al
  46163d:	74 0d                	je     0x46164c
  46163f:	53                   	push   ebx
  461640:	57                   	push   edi
  461641:	e8 6a 0a 09 00       	call   0x4f20b0
  461646:	66 89 06             	mov    WORD PTR [esi],ax
  461649:	83 c4 08             	add    esp,0x8
  46164c:	83 c6 04             	add    esi,0x4
  46164f:	43                   	inc    ebx
  461650:	83 fb 16             	cmp    ebx,0x16
  461653:	7c cd                	jl     0x461622
  461655:	57                   	push   edi
  461656:	e8 35 09 00 00       	call   0x461f90
  46165b:	0f be 8f 22 0c 00 00 	movsx  ecx,BYTE PTR [edi+0xc22]
  461662:	83 c4 04             	add    esp,0x4
  461665:	8b c1                	mov    eax,ecx
  461667:	c1 e1 02             	shl    ecx,0x2
  46166a:	8d 14 49             	lea    edx,[ecx+ecx*2]
  46166d:	8d 0c 90             	lea    ecx,[eax+edx*4]
  461670:	c1 e1 02             	shl    ecx,0x2
  461673:	8d 04 c8             	lea    eax,[eax+ecx*8]
  461676:	8d 14 c5 b2 d7 95 00 	lea    edx,[eax*8+0x95d7b2]
  46167d:	52                   	push   edx
  46167e:	57                   	push   edi
  46167f:	e8 2c b0 02 00       	call   0x48c6b0
  461684:	0f be 87 22 0c 00 00 	movsx  eax,BYTE PTR [edi+0xc22]
  46168b:	83 c4 08             	add    esp,0x8
  46168e:	03 05 88 d1 89 00    	add    eax,DWORD PTR ds:0x89d188
  461694:	8d 48 0d             	lea    ecx,[eax+0xd]
  461697:	f6 c1 3f             	test   cl,0x3f
  46169a:	0f 85 d5 00 00 00    	jne    0x461775
  4616a0:	80 bf b4 05 00 00 00 	cmp    BYTE PTR [edi+0x5b4],0x0
  4616a7:	0f 84 dd 00 00 00    	je     0x46178a
  4616ad:	66 8b 87 6a 03 00 00 	mov    ax,WORD PTR [edi+0x36a]
  4616b4:	8b b7 85 08 00 00    	mov    esi,DWORD PTR [edi+0x885]
  4616ba:	66 89 44 24 14       	mov    WORD PTR [esp+0x14],ax
  4616bf:	85 f6                	test   esi,esi
  4616c1:	c7 44 24 18 00 00 00 	mov    DWORD PTR [esp+0x18],0x0
  4616c8:	00 
  4616c9:	74 71                	je     0x46173c
  4616cb:	33 db                	xor    ebx,ebx
  4616cd:	8a d8                	mov    bl,al
  4616cf:	33 c0                	xor    eax,eax
  4616d1:	8a 44 24 15          	mov    al,BYTE PTR [esp+0x15]
  4616d5:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  4616d9:	66 8b 46 3d          	mov    ax,WORD PTR [esi+0x3d]
  4616dd:	66 c1 e8 08          	shr    ax,0x8
  4616e1:	24 fe                	and    al,0xfe
  4616e3:	88 44 24 10          	mov    BYTE PTR [esp+0x10],al
  4616e7:	66 8b 46 3f          	mov    ax,WORD PTR [esi+0x3f]
  4616eb:	66 c1 e8 08          	shr    ax,0x8
  4616ef:	24 fe                	and    al,0xfe
  4616f1:	88 44 24 11          	mov    BYTE PTR [esp+0x11],al
  4616f5:	33 c0                	xor    eax,eax
  4616f7:	66 8b 4c 24 10       	mov    cx,WORD PTR [esp+0x10]
  4616fc:	66 89 4c 24 12       	mov    WORD PTR [esp+0x12],cx
  461701:	8a c1                	mov    al,cl
  461703:	50                   	push   eax
  461704:	53                   	push   ebx
  461705:	e8 36 06 00 00       	call   0x461d40
  46170a:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  46170e:	83 c4 08             	add    esp,0x8
  461711:	8b e8                	mov    ebp,eax
  461713:	33 c0                	xor    eax,eax
  461715:	8a 44 24 13          	mov    al,BYTE PTR [esp+0x13]
  461719:	50                   	push   eax
  46171a:	51                   	push   ecx
  46171b:	e8 20 06 00 00       	call   0x461d40
  461720:	0f af ed             	imul   ebp,ebp
  461723:	0f af c0             	imul   eax,eax
  461726:	83 c4 08             	add    esp,0x8
  461729:	03 c5                	add    eax,ebp
  46172b:	39 44 24 18          	cmp    DWORD PTR [esp+0x18],eax
  46172f:	7d 04                	jge    0x461735
  461731:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  461735:	8b 76 08             	mov    esi,DWORD PTR [esi+0x8]
  461738:	85 f6                	test   esi,esi
  46173a:	75 9d                	jne    0x4616d9
  46173c:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  461740:	50                   	push   eax
  461741:	e8 ba 48 12 00       	call   0x586000
  461746:	0f be 8f 22 0c 00 00 	movsx  ecx,BYTE PTR [edi+0xc22]
  46174d:	c1 e1 04             	shl    ecx,0x4
  461750:	33 d2                	xor    edx,edx
  461752:	c1 f8 01             	sar    eax,0x1
  461755:	83 c4 04             	add    esp,0x4
  461758:	8a 94 49 f8 07 96 00 	mov    dl,BYTE PTR [ecx+ecx*2+0x9607f8]
  46175f:	33 c9                	xor    ecx,ecx
  461761:	03 c2                	add    eax,edx
  461763:	8a 8f 6c 03 00 00    	mov    cl,BYTE PTR [edi+0x36c]
  461769:	3b c8                	cmp    ecx,eax
  46176b:	7d 1d                	jge    0x46178a
  46176d:	88 87 6c 03 00 00    	mov    BYTE PTR [edi+0x36c],al
  461773:	eb 15                	jmp    0x46178a
  461775:	40                   	inc    eax
  461776:	57                   	push   edi
  461777:	a8 3f                	test   al,0x3f
  461779:	75 07                	jne    0x461782
  46177b:	e8 60 0e 00 00       	call   0x4625e0
  461780:	eb 05                	jmp    0x461787
  461782:	e8 59 0c 00 00       	call   0x4623e0
  461787:	83 c4 04             	add    esp,0x4
  46178a:	57                   	push   edi
  46178b:	e8 a0 e7 ff ff       	call   0x45ff30
  461790:	83 c4 04             	add    esp,0x4
  461793:	57                   	push   edi
  461794:	e8 87 52 06 00       	call   0x4c6a20
  461799:	83 c4 04             	add    esp,0x4
  46179c:	8b f0                	mov    esi,eax
  46179e:	57                   	push   edi
  46179f:	e8 bc 4f 06 00       	call   0x4c6760
  4617a4:	83 c4 04             	add    esp,0x4
  4617a7:	57                   	push   edi
  4617a8:	e8 73 54 09 00       	call   0x4f6c20
  4617ad:	83 c4 04             	add    esp,0x4
  4617b0:	57                   	push   edi
  4617b1:	e8 ca 4e 06 00       	call   0x4c6680
  4617b6:	83 c4 04             	add    esp,0x4
  4617b9:	85 f6                	test   esi,esi
  4617bb:	75 09                	jne    0x4617c6
  4617bd:	57                   	push   edi
  4617be:	e8 9d f0 06 00       	call   0x4d0860
  4617c3:	83 c4 04             	add    esp,0x4
  4617c6:	33 ed                	xor    ebp,ebp
  4617c8:	8d 47 74             	lea    eax,[edi+0x74]
  4617cb:	f6 00 01             	test   BYTE PTR [eax],0x1
  4617ce:	74 0e                	je     0x4617de
  4617d0:	83 c0 52             	add    eax,0x52
  4617d3:	45                   	inc    ebp
  4617d4:	83 fd 0a             	cmp    ebp,0xa
  4617d7:	7c f2                	jl     0x4617cb
  4617d9:	bd ff ff ff ff       	mov    ebp,0xffffffff
