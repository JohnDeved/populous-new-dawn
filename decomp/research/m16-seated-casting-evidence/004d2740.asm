
../populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004d2740 <.text+0xd1740>:
  4d2740:	83 ec 24             	sub    esp,0x24
  4d2743:	33 c0                	xor    eax,eax
  4d2745:	53                   	push   ebx
  4d2746:	56                   	push   esi
  4d2747:	8b 74 24 30          	mov    esi,DWORD PTR [esp+0x30]
  4d274b:	57                   	push   edi
  4d274c:	66 c7 86 87 00 00 00 	mov    WORD PTR [esi+0x87],0x0
  4d2753:	00 00 
  4d2755:	55                   	push   ebp
  4d2756:	8a 46 7d             	mov    al,BYTE PTR [esi+0x7d]
  4d2759:	83 f8 0e             	cmp    eax,0xe
  4d275c:	74 0c                	je     0x4d276a
  4d275e:	83 f8 13             	cmp    eax,0x13
  4d2761:	74 41                	je     0x4d27a4
  4d2763:	83 f8 18             	cmp    eax,0x18
  4d2766:	74 47                	je     0x4d27af
  4d2768:	eb 55                	jmp    0x4d27bf
  4d276a:	0f be 46 2f          	movsx  eax,BYTE PTR [esi+0x2f]
  4d276e:	8b c8                	mov    ecx,eax
  4d2770:	8d 14 80             	lea    edx,[eax+eax*4]
  4d2773:	8d 04 51             	lea    eax,[ecx+edx*2]
  4d2776:	8d 1c c0             	lea    ebx,[eax+eax*8]
  4d2779:	8d 14 d9             	lea    edx,[ecx+ebx*8]
  4d277c:	8d 84 91 c8 d1 89 00 	lea    eax,[ecx+edx*4+0x89d1c8]
  4d2783:	8b 8c 91 f5 da 89 00 	mov    ecx,DWORD PTR [ecx+edx*4+0x89daf5]
  4d278a:	85 c9                	test   ecx,ecx
  4d278c:	74 07                	je     0x4d2795
  4d278e:	49                   	dec    ecx
  4d278f:	89 88 2d 09 00 00    	mov    DWORD PTR [eax+0x92d],ecx
  4d2795:	6a 00                	push   0x0
  4d2797:	6a 00                	push   0x0
  4d2799:	56                   	push   esi
  4d279a:	e8 b1 2f f7 ff       	call   0x445750
  4d279f:	83 c4 0c             	add    esp,0xc
  4d27a2:	eb 1b                	jmp    0x4d27bf
  4d27a4:	66 c7 86 87 00 00 00 	mov    WORD PTR [esi+0x87],0x0
  4d27ab:	00 00 
  4d27ad:	eb 10                	jmp    0x4d27bf
  4d27af:	81 66 0c ff bf ff ff 	and    DWORD PTR [esi+0xc],0xffffbfff
  4d27b6:	66 c7 86 89 00 00 00 	mov    WORD PTR [esi+0x89],0x0
  4d27bd:	00 00 
  4d27bf:	8a 46 7d             	mov    al,BYTE PTR [esi+0x7d]
  4d27c2:	38 46 2c             	cmp    BYTE PTR [esi+0x2c],al
  4d27c5:	74 15                	je     0x4d27dc
  4d27c7:	33 c9                	xor    ecx,ecx
  4d27c9:	8a c8                	mov    cl,al
  4d27cb:	f6 84 89 7a 6f 5a 00 	test   BYTE PTR [ecx+ecx*4+0x5a6f7a],0x1
  4d27d2:	01 
  4d27d3:	74 07                	je     0x4d27dc
  4d27d5:	81 4e 14 00 08 00 00 	or     DWORD PTR [esi+0x14],0x800
  4d27dc:	f6 46 14 20          	test   BYTE PTR [esi+0x14],0x20
  4d27e0:	74 09                	je     0x4d27eb
  4d27e2:	56                   	push   esi
  4d27e3:	e8 58 75 f3 ff       	call   0x409d40
  4d27e8:	83 c4 04             	add    esp,0x4
  4d27eb:	81 66 0c dd fd de fc 	and    DWORD PTR [esi+0xc],0xfcdefddd
  4d27f2:	66 81 66 35 ff fe    	and    WORD PTR [esi+0x35],0xfeff
  4d27f8:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  4d27fb:	3c 07                	cmp    al,0x7
  4d27fd:	75 0e                	jne    0x4d280d
  4d27ff:	81 4e 10 00 01 00 00 	or     DWORD PTR [esi+0x10],0x100
  4d2806:	80 8e b2 00 00 00 04 	or     BYTE PTR [esi+0xb2],0x4
  4d280d:	8d 5e 10             	lea    ebx,[esi+0x10]
  4d2810:	3c 08                	cmp    al,0x8
  4d2812:	74 08                	je     0x4d281c
  4d2814:	81 23 7f 7f ff ff    	and    DWORD PTR [ebx],0xffff7f7f
  4d281a:	eb 06                	jmp    0x4d2822
  4d281c:	81 23 ff 7f ff ff    	and    DWORD PTR [ebx],0xffff7fff
  4d2822:	33 c0                	xor    eax,eax
  4d2824:	83 23 f7             	and    DWORD PTR [ebx],0xfffffff7
  4d2827:	8a 46 2c             	mov    al,BYTE PTR [esi+0x2c]
  4d282a:	66 81 66 76 1f f5    	and    WORD PTR [esi+0x76],0xf51f
  4d2830:	8b ac 80 79 6f 5a 00 	mov    ebp,DWORD PTR [eax+eax*4+0x5a6f79]
  4d2837:	f7 c5 10 00 00 00    	test   ebp,0x10
  4d283d:	75 09                	jne    0x4d2848
  4d283f:	56                   	push   esi
  4d2840:	e8 fb 10 fd ff       	call   0x4a3940
  4d2845:	83 c4 04             	add    esp,0x4
  4d2848:	56                   	push   esi
  4d2849:	81 23 f8 ff fe ff    	and    DWORD PTR [ebx],0xfffefff8
  4d284f:	e8 7c 1f 00 00       	call   0x4d47d0
  4d2854:	83 c4 04             	add    esp,0x4
  4d2857:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4d285a:	0f bf 7e 5f          	movsx  edi,WORD PTR [esi+0x5f]
  4d285e:	25 ff 7f ff ff       	and    eax,0xffff7fff
  4d2863:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4d2866:	25 ff ff fb ff       	and    eax,0xfffbffff
  4d286b:	f7 c5 00 02 00 00    	test   ebp,0x200
  4d2871:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4d2874:	75 70                	jne    0x4d28e6
  4d2876:	33 c0                	xor    eax,eax
  4d2878:	8a 46 30             	mov    al,BYTE PTR [esi+0x30]
  4d287b:	8b c8                	mov    ecx,eax
  4d287d:	8d 14 80             	lea    edx,[eax+eax*4]
  4d2880:	8d 04 92             	lea    eax,[edx+edx*4]
  4d2883:	0f bf 8c 08 94 7b 5a 	movsx  ecx,WORD PTR [eax+ecx*1+0x5a7b94]
  4d288a:	00 
  4d288b:	8b e9                	mov    ebp,ecx
  4d288d:	c1 fd 02             	sar    ebp,0x2
  4d2890:	85 ed                	test   ebp,ebp
  4d2892:	75 05                	jne    0x4d2899
  4d2894:	bd 01 00 00 00       	mov    ebp,0x1
  4d2899:	8b 15 78 d1 89 00    	mov    edx,DWORD PTR ds:0x89d178
  4d289f:	8b c2                	mov    eax,edx
  4d28a1:	8d 14 d2             	lea    edx,[edx+edx*8]
  4d28a4:	8d 14 d0             	lea    edx,[eax+edx*8]
  4d28a7:	8d 14 90             	lea    edx,[eax+edx*4]
  4d28aa:	c1 e2 02             	shl    edx,0x2
  4d28ad:	8d 14 d0             	lea    edx,[eax+edx*8]
  4d28b0:	81 c2 df 24 00 00    	add    edx,0x24df
  4d28b6:	89 15 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,edx
  4d28bc:	89 54 24 30          	mov    DWORD PTR [esp+0x30],edx
  4d28c0:	c1 4c 24 30 0d       	ror    DWORD PTR [esp+0x30],0xd
  4d28c5:	8b 44 24 30          	mov    eax,DWORD PTR [esp+0x30]
  4d28c9:	2b d2                	sub    edx,edx
  4d28cb:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d28d0:	f7 f5                	div    ebp
  4d28d2:	8d 04 11             	lea    eax,[ecx+edx*1]
  4d28d5:	f6 46 16 08          	test   BYTE PTR [esi+0x16],0x8
  4d28d9:	66 89 46 5f          	mov    WORD PTR [esi+0x5f],ax
  4d28dd:	74 07                	je     0x4d28e6
  4d28df:	66 03 c0             	add    ax,ax
  4d28e2:	66 89 46 5f          	mov    WORD PTR [esi+0x5f],ax
  4d28e6:	8b 4e 0c             	mov    ecx,DWORD PTR [esi+0xc]
  4d28e9:	33 c0                	xor    eax,eax
  4d28eb:	81 c9 00 00 00 40    	or     ecx,0x40000000
  4d28f1:	8a 46 2c             	mov    al,BYTE PTR [esi+0x2c]
  4d28f4:	48                   	dec    eax
  4d28f5:	89 4e 0c             	mov    DWORD PTR [esi+0xc],ecx
  4d28f8:	c6 46 2d 00          	mov    BYTE PTR [esi+0x2d],0x0
  4d28fc:	66 c7 46 70 00 00    	mov    WORD PTR [esi+0x70],0x0
  4d2902:	83 f8 2b             	cmp    eax,0x2b
  4d2905:	0f 87 a8 07 00 00    	ja     0x4d30b3
  4d290b:	ff 24 85 34 31 4d 00 	jmp    DWORD PTR [eax*4+0x4d3134]
  4d2912:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  4d2917:	8b c8                	mov    ecx,eax
  4d2919:	8d 14 c0             	lea    edx,[eax+eax*8]
  4d291c:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4d291f:	8d 04 81             	lea    eax,[ecx+eax*4]
  4d2922:	c1 e0 02             	shl    eax,0x2
  4d2925:	8d 04 c1             	lea    eax,[ecx+eax*8]
  4d2928:	05 df 24 00 00       	add    eax,0x24df
  4d292d:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d2932:	89 44 24 2c          	mov    DWORD PTR [esp+0x2c],eax
  4d2936:	c1 4c 24 2c 0d       	ror    DWORD PTR [esp+0x2c],0xd
  4d293b:	8b 44 24 2c          	mov    eax,DWORD PTR [esp+0x2c]
  4d293f:	b9 32 00 00 00       	mov    ecx,0x32
  4d2944:	2b d2                	sub    edx,edx
  4d2946:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d294b:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2951:	f7 f1                	div    ecx
  4d2953:	66 03 d1             	add    dx,cx
  4d2956:	66 89 56 70          	mov    WORD PTR [esi+0x70],dx
  4d295a:	e9 54 07 00 00       	jmp    0x4d30b3
  4d295f:	56                   	push   esi
  4d2960:	e8 9b c7 01 00       	call   0x4ef100
  4d2965:	83 c4 04             	add    esp,0x4
  4d2968:	33 c0                	xor    eax,eax
  4d296a:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2970:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  4d2973:	66 8b 04 45 24 6f 5a 	mov    ax,WORD PTR [eax*2+0x5a6f24]
  4d297a:	00 
  4d297b:	50                   	push   eax
  4d297c:	56                   	push   esi
  4d297d:	e8 be 16 00 00       	call   0x4d4040
  4d2982:	83 c4 08             	add    esp,0x8
  4d2985:	6a 00                	push   0x0
  4d2987:	6a 11                	push   0x11
  4d2989:	56                   	push   esi
  4d298a:	e8 c1 76 fb ff       	call   0x48a050
  4d298f:	83 c4 0c             	add    esp,0xc
  4d2992:	8d 4e 3d             	lea    ecx,[esi+0x3d]
  4d2995:	8a 56 2f             	mov    dl,BYTE PTR [esi+0x2f]
  4d2998:	51                   	push   ecx
  4d2999:	52                   	push   edx
  4d299a:	6a 41                	push   0x41
  4d299c:	6a 07                	push   0x7
  4d299e:	e8 fd ae 01 00       	call   0x4ed8a0
  4d29a3:	81 4e 0c 00 00 10 00 	or     DWORD PTR [esi+0xc],0x100000
  4d29aa:	83 c4 10             	add    esp,0x10
  4d29ad:	e9 01 07 00 00       	jmp    0x4d30b3
  4d29b2:	56                   	push   esi
  4d29b3:	e8 b8 32 00 00       	call   0x4d5c70
  4d29b8:	83 c4 04             	add    esp,0x4
  4d29bb:	e9 f3 06 00 00       	jmp    0x4d30b3
  4d29c0:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  4d29c5:	8b c8                	mov    ecx,eax
  4d29c7:	8d 14 c0             	lea    edx,[eax+eax*8]
  4d29ca:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4d29cd:	8d 04 81             	lea    eax,[ecx+eax*4]
  4d29d0:	c1 e0 02             	shl    eax,0x2
  4d29d3:	8d 04 c1             	lea    eax,[ecx+eax*8]
  4d29d6:	05 df 24 00 00       	add    eax,0x24df
  4d29db:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d29e0:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  4d29e4:	c1 4c 24 28 0d       	ror    DWORD PTR [esp+0x28],0xd
  4d29e9:	8b 44 24 28          	mov    eax,DWORD PTR [esp+0x28]
  4d29ed:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d29f2:	66 25 3f 00          	and    ax,0x3f
  4d29f6:	66 05 20 00          	add    ax,0x20
  4d29fa:	66 89 46 70          	mov    WORD PTR [esi+0x70],ax
  4d29fe:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  4d2a03:	8b c8                	mov    ecx,eax
  4d2a05:	8d 14 c0             	lea    edx,[eax+eax*8]
  4d2a08:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4d2a0b:	8d 04 81             	lea    eax,[ecx+eax*4]
  4d2a0e:	c1 e0 02             	shl    eax,0x2
  4d2a11:	8d 04 c1             	lea    eax,[ecx+eax*8]
  4d2a14:	05 df 24 00 00       	add    eax,0x24df
  4d2a19:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d2a1e:	89 44 24 24          	mov    DWORD PTR [esp+0x24],eax
  4d2a22:	c1 4c 24 24 0d       	ror    DWORD PTR [esp+0x24],0xd
  4d2a27:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  4d2a2b:	56                   	push   esi
  4d2a2c:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d2a31:	e8 2a 7a 01 00       	call   0x4ea460
  4d2a36:	83 c4 04             	add    esp,0x4
  4d2a39:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4d2a3c:	0d 80 00 00 00       	or     eax,0x80
  4d2a41:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4d2a44:	0d 00 10 00 00       	or     eax,0x1000
  4d2a49:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4d2a4c:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  4d2a50:	66 25 ff 07          	and    ax,0x7ff
  4d2a54:	66 89 46 57          	mov    WORD PTR [esi+0x57],ax
  4d2a58:	e9 56 06 00 00       	jmp    0x4d30b3
  4d2a5d:	56                   	push   esi
  4d2a5e:	e8 dd 70 01 00       	call   0x4e9b40
  4d2a63:	66 c7 46 72 00 00    	mov    WORD PTR [esi+0x72],0x0
  4d2a69:	66 c7 46 70 80 00    	mov    WORD PTR [esi+0x70],0x80
  4d2a6f:	83 c4 04             	add    esp,0x4
  4d2a72:	e9 3c 06 00 00       	jmp    0x4d30b3
  4d2a77:	56                   	push   esi
  4d2a78:	e8 c3 70 01 00       	call   0x4e9b40
  4d2a7d:	66 c7 46 70 80 00    	mov    WORD PTR [esi+0x70],0x80
  4d2a83:	83 c4 04             	add    esp,0x4
  4d2a86:	e9 28 06 00 00       	jmp    0x4d30b3
  4d2a8b:	66 c7 46 70 32 00    	mov    WORD PTR [esi+0x70],0x32
  4d2a91:	56                   	push   esi
  4d2a92:	e8 a9 70 01 00       	call   0x4e9b40
  4d2a97:	83 c4 04             	add    esp,0x4
  4d2a9a:	68 ef 28 89 00       	push   0x8928ef
  4d2a9f:	56                   	push   esi
  4d2aa0:	e8 db 72 01 00       	call   0x4e9d80
  4d2aa5:	83 c4 08             	add    esp,0x8
  4d2aa8:	e9 06 06 00 00       	jmp    0x4d30b3
  4d2aad:	c6 46 2d 00          	mov    BYTE PTR [esi+0x2d],0x0
  4d2ab1:	66 c7 46 72 00 00    	mov    WORD PTR [esi+0x72],0x0
  4d2ab7:	81 c9 00 00 00 40    	or     ecx,0x40000000
  4d2abd:	89 4e 0c             	mov    DWORD PTR [esi+0xc],ecx
  4d2ac0:	e9 ee 05 00 00       	jmp    0x4d30b3
  4d2ac5:	66 c7 46 72 00 00    	mov    WORD PTR [esi+0x72],0x0
  4d2acb:	e9 e3 05 00 00       	jmp    0x4d30b3
  4d2ad0:	56                   	push   esi
  4d2ad1:	e8 8a f7 f5 ff       	call   0x432260
  4d2ad6:	83 c4 04             	add    esp,0x4
  4d2ad9:	e9 d5 05 00 00       	jmp    0x4d30b3
  4d2ade:	80 4e 76 10          	or     BYTE PTR [esi+0x76],0x10
  4d2ae2:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2ae8:	c6 86 a8 00 00 00 01 	mov    BYTE PTR [esi+0xa8],0x1
  4d2aef:	81 c9 00 00 00 01    	or     ecx,0x1000000
  4d2af5:	89 4e 0c             	mov    DWORD PTR [esi+0xc],ecx
  4d2af8:	e9 b6 05 00 00       	jmp    0x4d30b3
  4d2afd:	80 4e 76 10          	or     BYTE PTR [esi+0x76],0x10
  4d2b01:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2b07:	c6 86 a8 00 00 00 01 	mov    BYTE PTR [esi+0xa8],0x1
  4d2b0e:	81 c9 00 00 00 01    	or     ecx,0x1000000
  4d2b14:	89 4e 0c             	mov    DWORD PTR [esi+0xc],ecx
  4d2b17:	e9 97 05 00 00       	jmp    0x4d30b3
  4d2b1c:	8d 46 68             	lea    eax,[esi+0x68]
  4d2b1f:	50                   	push   eax
  4d2b20:	56                   	push   esi
  4d2b21:	e8 fa f9 f5 ff       	call   0x432520
  4d2b26:	83 c4 08             	add    esp,0x8
  4d2b29:	56                   	push   esi
  4d2b2a:	e8 91 3d 00 00       	call   0x4d68c0
  4d2b2f:	83 c4 04             	add    esp,0x4
  4d2b32:	e9 7c 05 00 00       	jmp    0x4d30b3
  4d2b37:	0f be 4e 2f          	movsx  ecx,BYTE PTR [esi+0x2f]
  4d2b3b:	8b c1                	mov    eax,ecx
  4d2b3d:	8d 14 89             	lea    edx,[ecx+ecx*4]
  4d2b40:	8d 0c 50             	lea    ecx,[eax+edx*2]
  4d2b43:	8d 2c c9             	lea    ebp,[ecx+ecx*8]
  4d2b46:	8d 14 e8             	lea    edx,[eax+ebp*8]
  4d2b49:	ff 84 90 f5 da 89 00 	inc    DWORD PTR [eax+edx*4+0x89daf5]
  4d2b50:	8a 46 7a             	mov    al,BYTE PTR [esi+0x7a]
  4d2b53:	66 81 66 76 fb ff    	and    WORD PTR [esi+0x76],0xfffb
  4d2b59:	0c 01                	or     al,0x1
  4d2b5b:	81 23 ff ff fb ff    	and    DWORD PTR [ebx],0xfffbffff
  4d2b61:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2b67:	56                   	push   esi
  4d2b68:	88 46 7a             	mov    BYTE PTR [esi+0x7a],al
  4d2b6b:	83 66 14 fe          	and    DWORD PTR [esi+0x14],0xfffffffe
  4d2b6f:	81 4e 0c 00 00 00 01 	or     DWORD PTR [esi+0xc],0x1000000
  4d2b76:	0c 80                	or     al,0x80
  4d2b78:	88 46 7a             	mov    BYTE PTR [esi+0x7a],al
  4d2b7b:	e8 00 c1 01 00       	call   0x4eec80
  4d2b80:	83 c4 04             	add    esp,0x4
  4d2b83:	6a 01                	push   0x1
  4d2b85:	56                   	push   esi
  4d2b86:	e8 45 2d fc ff       	call   0x4958d0
  4d2b8b:	83 c4 08             	add    esp,0x8
  4d2b8e:	e9 20 05 00 00       	jmp    0x4d30b3
  4d2b93:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  4d2b98:	8b c8                	mov    ecx,eax
  4d2b9a:	8d 14 c0             	lea    edx,[eax+eax*8]
  4d2b9d:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4d2ba0:	8d 04 81             	lea    eax,[ecx+eax*4]
  4d2ba3:	c1 e0 02             	shl    eax,0x2
  4d2ba6:	8d 04 c1             	lea    eax,[ecx+eax*8]
  4d2ba9:	05 df 24 00 00       	add    eax,0x24df
  4d2bae:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d2bb3:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  4d2bb7:	c1 4c 24 20 0d       	ror    DWORD PTR [esp+0x20],0xd
  4d2bbc:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  4d2bc0:	b9 32 00 00 00       	mov    ecx,0x32
  4d2bc5:	2b d2                	sub    edx,edx
  4d2bc7:	6a ff                	push   0xffffffff
  4d2bc9:	6a ff                	push   0xffffffff
  4d2bcb:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d2bd0:	f7 f1                	div    ecx
  4d2bd2:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2bd8:	0f bf 46 72          	movsx  eax,WORD PTR [esi+0x72]
  4d2bdc:	66 03 d1             	add    dx,cx
  4d2bdf:	66 89 56 70          	mov    WORD PTR [esi+0x70],dx
  4d2be3:	8b 0c 85 90 03 89 00 	mov    ecx,DWORD PTR [eax*4+0x890390]
  4d2bea:	51                   	push   ecx
  4d2beb:	e8 00 4e fd ff       	call   0x4a79f0
  4d2bf0:	83 c4 0c             	add    esp,0xc
  4d2bf3:	e9 bb 04 00 00       	jmp    0x4d30b3
  4d2bf8:	56                   	push   esi
  4d2bf9:	e8 72 41 00 00       	call   0x4d6d70
  4d2bfe:	83 c4 04             	add    esp,0x4
  4d2c01:	e9 ad 04 00 00       	jmp    0x4d30b3
  4d2c06:	56                   	push   esi
  4d2c07:	e8 84 43 00 00       	call   0x4d6f90
  4d2c0c:	83 c4 04             	add    esp,0x4
  4d2c0f:	e9 9f 04 00 00       	jmp    0x4d30b3
  4d2c14:	56                   	push   esi
  4d2c15:	e8 16 47 00 00       	call   0x4d7330
  4d2c1a:	83 c4 04             	add    esp,0x4
  4d2c1d:	e9 91 04 00 00       	jmp    0x4d30b3
  4d2c22:	80 4e 76 01          	or     BYTE PTR [esi+0x76],0x1
  4d2c26:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2c2c:	56                   	push   esi
  4d2c2d:	e8 1e 06 00 00       	call   0x4d3250
  4d2c32:	66 89 46 70          	mov    WORD PTR [esi+0x70],ax
  4d2c36:	83 c4 04             	add    esp,0x4
  4d2c39:	6a 00                	push   0x0
  4d2c3b:	56                   	push   esi
  4d2c3c:	e8 9f 54 00 00       	call   0x4d80e0
  4d2c41:	83 c4 08             	add    esp,0x8
  4d2c44:	56                   	push   esi
  4d2c45:	e8 16 78 01 00       	call   0x4ea460
  4d2c4a:	83 c4 04             	add    esp,0x4
  4d2c4d:	80 7e 2b 04          	cmp    BYTE PTR [esi+0x2b],0x4
  4d2c51:	0f 85 5c 04 00 00    	jne    0x4d30b3
  4d2c57:	6a 04                	push   0x4
  4d2c59:	56                   	push   esi
  4d2c5a:	e8 91 77 f3 ff       	call   0x40a3f0
  4d2c5f:	83 c4 08             	add    esp,0x8
  4d2c62:	85 c0                	test   eax,eax
  4d2c64:	0f 84 49 04 00 00    	je     0x4d30b3
  4d2c6a:	56                   	push   esi
  4d2c6b:	e8 80 c3 00 00       	call   0x4deff0
  4d2c70:	83 c4 04             	add    esp,0x4
  4d2c73:	e9 3b 04 00 00       	jmp    0x4d30b3
  4d2c78:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2c7e:	8d 5e 49             	lea    ebx,[esi+0x49]
  4d2c81:	53                   	push   ebx
  4d2c82:	e8 69 6a 01 00       	call   0x4e96f0
  4d2c87:	83 c4 04             	add    esp,0x4
  4d2c8a:	53                   	push   ebx
  4d2c8b:	e8 40 6a 01 00       	call   0x4e96d0
  4d2c90:	83 c4 04             	add    esp,0x4
  4d2c93:	66 83 be 9f 00 00 00 	cmp    WORD PTR [esi+0x9f],0x0
  4d2c9a:	00 
  4d2c9b:	75 25                	jne    0x4d2cc2
  4d2c9d:	6a 00                	push   0x0
  4d2c9f:	56                   	push   esi
  4d2ca0:	e8 4b 77 f3 ff       	call   0x40a3f0
  4d2ca5:	83 c4 08             	add    esp,0x8
  4d2ca8:	85 c0                	test   eax,eax
  4d2caa:	75 16                	jne    0x4d2cc2
  4d2cac:	6a 6d                	push   0x6d
  4d2cae:	56                   	push   esi
  4d2caf:	e8 8c 13 00 00       	call   0x4d4040
  4d2cb4:	66 c7 46 70 0a 00    	mov    WORD PTR [esi+0x70],0xa
  4d2cba:	83 c4 08             	add    esp,0x8
  4d2cbd:	e9 f1 03 00 00       	jmp    0x4d30b3
  4d2cc2:	66 83 7e 78 01       	cmp    WORD PTR [esi+0x78],0x1
  4d2cc7:	b8 00 00 00 00       	mov    eax,0x0
  4d2ccc:	83 d0 ff             	adc    eax,0xffffffff
  4d2ccf:	83 e0 04             	and    eax,0x4
  4d2cd2:	50                   	push   eax
  4d2cd3:	56                   	push   esi
  4d2cd4:	e8 17 13 00 00       	call   0x4d3ff0
  4d2cd9:	66 c7 46 70 0a 00    	mov    WORD PTR [esi+0x70],0xa
  4d2cdf:	83 c4 08             	add    esp,0x8
  4d2ce2:	e9 cc 03 00 00       	jmp    0x4d30b3
  4d2ce7:	56                   	push   esi
  4d2ce8:	e8 13 56 00 00       	call   0x4d8300
  4d2ced:	83 c4 04             	add    esp,0x4
  4d2cf0:	e9 be 03 00 00       	jmp    0x4d30b3
  4d2cf5:	6a 01                	push   0x1
  4d2cf7:	56                   	push   esi
  4d2cf8:	e8 83 3f f9 ff       	call   0x466c80
  4d2cfd:	83 c4 08             	add    esp,0x8
  4d2d00:	8b 03                	mov    eax,DWORD PTR [ebx]
  4d2d02:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2d08:	0d 00 04 00 00       	or     eax,0x400
  4d2d0d:	6a 00                	push   0x0
  4d2d0f:	6a 00                	push   0x0
  4d2d11:	89 03                	mov    DWORD PTR [ebx],eax
  4d2d13:	0d 80 00 00 00       	or     eax,0x80
  4d2d18:	56                   	push   esi
  4d2d19:	89 03                	mov    DWORD PTR [ebx],eax
  4d2d1b:	e8 30 2a f7 ff       	call   0x445750
  4d2d20:	81 4e 0c 00 40 00 00 	or     DWORD PTR [esi+0xc],0x4000
  4d2d27:	83 c4 0c             	add    esp,0xc
  4d2d2a:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  4d2d2f:	8b c8                	mov    ecx,eax
  4d2d31:	8d 14 c0             	lea    edx,[eax+eax*8]
  4d2d34:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4d2d37:	8d 04 81             	lea    eax,[ecx+eax*4]
  4d2d3a:	c1 e0 02             	shl    eax,0x2
  4d2d3d:	8d 04 c1             	lea    eax,[ecx+eax*8]
  4d2d40:	05 df 24 00 00       	add    eax,0x24df
  4d2d45:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d2d4a:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  4d2d4e:	c1 4c 24 1c 0d       	ror    DWORD PTR [esp+0x1c],0xd
  4d2d53:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  4d2d57:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d2d5c:	24 07                	and    al,0x7
  4d2d5e:	88 46 2d             	mov    BYTE PTR [esi+0x2d],al
  4d2d61:	e9 4d 03 00 00       	jmp    0x4d30b3
  4d2d66:	56                   	push   esi
  4d2d67:	e8 74 57 04 00       	call   0x5184e0
  4d2d6c:	83 c4 04             	add    esp,0x4
  4d2d6f:	e9 3f 03 00 00       	jmp    0x4d30b3
  4d2d74:	33 c0                	xor    eax,eax
  4d2d76:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  4d2d79:	66 8b 04 45 12 6f 5a 	mov    ax,WORD PTR [eax*2+0x5a6f12]
  4d2d80:	00 
  4d2d81:	50                   	push   eax
  4d2d82:	56                   	push   esi
  4d2d83:	e8 b8 12 00 00       	call   0x4d4040
  4d2d88:	83 c4 08             	add    esp,0x8
  4d2d8b:	81 0b 80 00 00 00    	or     DWORD PTR [ebx],0x80
  4d2d91:	66 c7 46 5f 6e 00    	mov    WORD PTR [esi+0x5f],0x6e
  4d2d97:	6a 00                	push   0x0
  4d2d99:	6a 00                	push   0x0
  4d2d9b:	56                   	push   esi
  4d2d9c:	e8 af 29 f7 ff       	call   0x445750
  4d2da1:	66 c7 46 70 40 00    	mov    WORD PTR [esi+0x70],0x40
  4d2da7:	83 c4 0c             	add    esp,0xc
  4d2daa:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  4d2daf:	8b c8                	mov    ecx,eax
  4d2db1:	8d 14 c0             	lea    edx,[eax+eax*8]
  4d2db4:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4d2db7:	8d 04 81             	lea    eax,[ecx+eax*4]
  4d2dba:	c1 e0 02             	shl    eax,0x2
  4d2dbd:	8d 04 c1             	lea    eax,[ecx+eax*8]
  4d2dc0:	05 df 24 00 00       	add    eax,0x24df
  4d2dc5:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d2dca:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  4d2dce:	c1 4c 24 18 0d       	ror    DWORD PTR [esp+0x18],0xd
  4d2dd3:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4d2dd7:	56                   	push   esi
  4d2dd8:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d2ddd:	e8 7e 76 01 00       	call   0x4ea460
  4d2de2:	83 c4 04             	add    esp,0x4
  4d2de5:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4d2de8:	0d 80 00 00 00       	or     eax,0x80
  4d2ded:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4d2df0:	0d 00 10 00 00       	or     eax,0x1000
  4d2df5:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4d2df8:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4d2dfc:	66 25 ff 07          	and    ax,0x7ff
  4d2e00:	66 89 46 57          	mov    WORD PTR [esi+0x57],ax
  4d2e04:	e9 aa 02 00 00       	jmp    0x4d30b3
  4d2e09:	56                   	push   esi
  4d2e0a:	e8 f1 c2 01 00       	call   0x4ef100
  4d2e0f:	83 c4 04             	add    esp,0x4
  4d2e12:	33 c0                	xor    eax,eax
  4d2e14:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2e1a:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  4d2e1d:	66 8b 04 45 24 6f 5a 	mov    ax,WORD PTR [eax*2+0x5a6f24]
  4d2e24:	00 
  4d2e25:	50                   	push   eax
  4d2e26:	56                   	push   esi
  4d2e27:	e8 14 12 00 00       	call   0x4d4040
  4d2e2c:	81 4e 0c 00 00 10 00 	or     DWORD PTR [esi+0xc],0x100000
  4d2e33:	83 c4 08             	add    esp,0x8
  4d2e36:	e9 78 02 00 00       	jmp    0x4d30b3
  4d2e3b:	c6 46 2d 00          	mov    BYTE PTR [esi+0x2d],0x0
  4d2e3f:	c6 86 b2 00 00 00 00 	mov    BYTE PTR [esi+0xb2],0x0
  4d2e46:	81 c9 00 00 00 40    	or     ecx,0x40000000
  4d2e4c:	89 4e 0c             	mov    DWORD PTR [esi+0xc],ecx
  4d2e4f:	a1 a4 a5 5a 00       	mov    eax,ds:0x5aa5a4
  4d2e54:	66 89 86 97 00 00 00 	mov    WORD PTR [esi+0x97],ax
  4d2e5b:	e9 53 02 00 00       	jmp    0x4d30b3
  4d2e60:	56                   	push   esi
  4d2e61:	e8 1a 56 04 00       	call   0x518480
  4d2e66:	83 c4 04             	add    esp,0x4
  4d2e69:	e9 45 02 00 00       	jmp    0x4d30b3
  4d2e6e:	80 4e 76 01          	or     BYTE PTR [esi+0x76],0x1
  4d2e72:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2e78:	56                   	push   esi
  4d2e79:	e8 e2 75 01 00       	call   0x4ea460
  4d2e7e:	83 c4 04             	add    esp,0x4
  4d2e81:	e9 2d 02 00 00       	jmp    0x4d30b3
  4d2e86:	56                   	push   esi
  4d2e87:	e8 34 61 00 00       	call   0x4d8fc0
  4d2e8c:	83 c4 04             	add    esp,0x4
  4d2e8f:	e9 1f 02 00 00       	jmp    0x4d30b3
  4d2e94:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  4d2e99:	8b c8                	mov    ecx,eax
  4d2e9b:	8d 14 c0             	lea    edx,[eax+eax*8]
  4d2e9e:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4d2ea1:	8d 04 81             	lea    eax,[ecx+eax*4]
  4d2ea4:	c1 e0 02             	shl    eax,0x2
  4d2ea7:	8d 04 c1             	lea    eax,[ecx+eax*8]
  4d2eaa:	05 df 24 00 00       	add    eax,0x24df
  4d2eaf:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d2eb4:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  4d2eb8:	c1 4c 24 14 0d       	ror    DWORD PTR [esp+0x14],0xd
  4d2ebd:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  4d2ec1:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d2ec6:	66 25 07 00          	and    ax,0x7
  4d2eca:	66 05 04 00          	add    ax,0x4
  4d2ece:	66 89 46 70          	mov    WORD PTR [esi+0x70],ax
  4d2ed2:	66 25 01 00          	and    ax,0x1
  4d2ed6:	66 3d 01 00          	cmp    ax,0x1
  4d2eda:	1b c0                	sbb    eax,eax
  4d2edc:	25 ac fe 00 00       	and    eax,0xfeac
  4d2ee1:	05 aa 00 00 00       	add    eax,0xaa
  4d2ee6:	66 03 46 26          	add    ax,WORD PTR [esi+0x26]
  4d2eea:	66 25 ff 07          	and    ax,0x7ff
  4d2eee:	50                   	push   eax
  4d2eef:	56                   	push   esi
  4d2ef0:	e8 eb eb f2 ff       	call   0x401ae0
  4d2ef5:	83 c4 08             	add    esp,0x8
  4d2ef8:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2efe:	56                   	push   esi
  4d2eff:	e8 ec 02 00 00       	call   0x4d31f0
  4d2f04:	83 c4 04             	add    esp,0x4
  4d2f07:	e9 a7 01 00 00       	jmp    0x4d30b3
  4d2f0c:	56                   	push   esi
  4d2f0d:	e8 6e 66 00 00       	call   0x4d9580
  4d2f12:	83 c4 04             	add    esp,0x4
  4d2f15:	e9 99 01 00 00       	jmp    0x4d30b3
  4d2f1a:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2f20:	66 83 7e 78 01       	cmp    WORD PTR [esi+0x78],0x1
  4d2f25:	b8 00 00 00 00       	mov    eax,0x0
  4d2f2a:	83 d0 ff             	adc    eax,0xffffffff
  4d2f2d:	83 e0 04             	and    eax,0x4
  4d2f30:	50                   	push   eax
  4d2f31:	56                   	push   esi
  4d2f32:	e8 b9 10 00 00       	call   0x4d3ff0
  4d2f37:	83 c4 08             	add    esp,0x8
  4d2f3a:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  4d2f3f:	8b c8                	mov    ecx,eax
  4d2f41:	8d 14 c0             	lea    edx,[eax+eax*8]
  4d2f44:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4d2f47:	8d 04 81             	lea    eax,[ecx+eax*4]
  4d2f4a:	c1 e0 02             	shl    eax,0x2
  4d2f4d:	8d 04 c1             	lea    eax,[ecx+eax*8]
  4d2f50:	05 df 24 00 00       	add    eax,0x24df
  4d2f55:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d2f5a:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  4d2f5e:	c1 4c 24 10 0d       	ror    DWORD PTR [esp+0x10],0xd
  4d2f63:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  4d2f67:	b9 64 00 00 00       	mov    ecx,0x64
  4d2f6c:	2b d2                	sub    edx,edx
  4d2f6e:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4d2f73:	f7 f1                	div    ecx
  4d2f75:	66 03 d1             	add    dx,cx
  4d2f78:	66 89 56 70          	mov    WORD PTR [esi+0x70],dx
  4d2f7c:	e9 32 01 00 00       	jmp    0x4d30b3
  4d2f81:	66 c7 46 70 18 00    	mov    WORD PTR [esi+0x70],0x18
  4d2f87:	66 c7 46 5f 00 00    	mov    WORD PTR [esi+0x5f],0x0
  4d2f8d:	66 83 7e 78 01       	cmp    WORD PTR [esi+0x78],0x1
  4d2f92:	b8 00 00 00 00       	mov    eax,0x0
  4d2f97:	83 d0 ff             	adc    eax,0xffffffff
  4d2f9a:	83 e0 04             	and    eax,0x4
  4d2f9d:	50                   	push   eax
  4d2f9e:	56                   	push   esi
  4d2f9f:	e8 4c 10 00 00       	call   0x4d3ff0
  4d2fa4:	83 c4 08             	add    esp,0x8
  4d2fa7:	56                   	push   esi
  4d2fa8:	e8 a3 be 01 00       	call   0x4eee50
  4d2fad:	83 c4 04             	add    esp,0x4
  4d2fb0:	e9 fe 00 00 00       	jmp    0x4d30b3
  4d2fb5:	6a 00                	push   0x0
  4d2fb7:	81 0b 80 00 00 00    	or     DWORD PTR [ebx],0x80
  4d2fbd:	6a 00                	push   0x0
  4d2fbf:	56                   	push   esi
  4d2fc0:	e8 8b 27 f7 ff       	call   0x445750
  4d2fc5:	83 c4 0c             	add    esp,0xc
  4d2fc8:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4d2fcb:	0d 00 40 00 00       	or     eax,0x4000
  4d2fd0:	81 0b 00 20 00 00    	or     DWORD PTR [ebx],0x2000
  4d2fd6:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4d2fd9:	a9 00 00 02 00       	test   eax,0x20000
  4d2fde:	74 09                	je     0x4d2fe9
  4d2fe0:	56                   	push   esi
  4d2fe1:	e8 0a b5 01 00       	call   0x4ee4f0
  4d2fe6:	83 c4 04             	add    esp,0x4
  4d2fe9:	c6 46 2d 00          	mov    BYTE PTR [esi+0x2d],0x0
  4d2fed:	81 4e 0c 00 00 00 40 	or     DWORD PTR [esi+0xc],0x40000000
  4d2ff4:	e9 ba 00 00 00       	jmp    0x4d30b3
  4d2ff9:	f7 c1 00 00 80 00    	test   ecx,0x800000
  4d2fff:	74                   	.byte 0x74
