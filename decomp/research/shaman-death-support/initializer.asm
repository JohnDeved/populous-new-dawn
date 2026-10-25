
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00502910 <.text+0x101910>:
  502910:	56                   	push   esi
  502911:	57                   	push   edi
  502912:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  502916:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  502919:	f6 c4 04             	test   ah,0x4
  50291c:	74 16                	je     0x502934
  50291e:	25 ff fb ff ff       	and    eax,0xfffffbff
  502923:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  502926:	83 2d 43 24 89 00 14 	sub    DWORD PTR ds:0x892443,0x14
  50292d:	a1 43 24 89 00       	mov    eax,ds:0x892443
  502932:	eb 02                	jmp    0x502936
  502934:	33 c0                	xor    eax,eax
  502936:	85 c0                	test   eax,eax
  502938:	74 7f                	je     0x5029b9
  50293a:	8b 38                	mov    edi,DWORD PTR [eax]
  50293c:	8d 46 3d             	lea    eax,[esi+0x3d]
  50293f:	50                   	push   eax
  502940:	56                   	push   esi
  502941:	e8 2a bb fe ff       	call   0x4ee470
  502946:	c6 46 75 01          	mov    BYTE PTR [esi+0x75],0x1
  50294a:	83 c4 08             	add    esp,0x8
  50294d:	8a 4f 2b             	mov    cl,BYTE PTR [edi+0x2b]
  502950:	88 4e 74             	mov    BYTE PTR [esi+0x74],cl
  502953:	80 f9 01             	cmp    cl,0x1
  502956:	66 8b 47 26          	mov    ax,WORD PTR [edi+0x26]
  50295a:	66 89 46 26          	mov    WORD PTR [esi+0x26],ax
  50295e:	74 2f                	je     0x50298f
  502960:	8a 47 78             	mov    al,BYTE PTR [edi+0x78]
  502963:	88 46 77             	mov    BYTE PTR [esi+0x77],al
  502966:	80 7f 2b 07          	cmp    BYTE PTR [edi+0x2b],0x7
  50296a:	75 0b                	jne    0x502977
  50296c:	c6 46 75 07          	mov    BYTE PTR [esi+0x75],0x7
  502970:	0f be 47 2f          	movsx  eax,BYTE PTR [edi+0x2f]
  502974:	89 46 68             	mov    DWORD PTR [esi+0x68],eax
  502977:	80 f9 01             	cmp    cl,0x1
  50297a:	74 13                	je     0x50298f
  50297c:	57                   	push   edi
  50297d:	e8 6e c6 fe ff       	call   0x4eeff0
  502982:	83 c4 04             	add    esp,0x4
  502985:	84 c0                	test   al,al
  502987:	75 06                	jne    0x50298f
  502989:	c6 46 2d 00          	mov    BYTE PTR [esi+0x2d],0x0
  50298d:	eb 04                	jmp    0x502993
  50298f:	c6 46 2d 03          	mov    BYTE PTR [esi+0x2d],0x3
  502993:	81 4e 0c 00 00 00 40 	or     DWORD PTR [esi+0xc],0x40000000
  50299a:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  50299e:	75 22                	jne    0x5029c2
  5029a0:	56                   	push   esi
  5029a1:	e8 4a ad fe ff       	call   0x4ed6f0
  5029a6:	83 c4 04             	add    esp,0x4
  5029a9:	c6 46 2c 0c          	mov    BYTE PTR [esi+0x2c],0xc
  5029ad:	56                   	push   esi
  5029ae:	e8 8d ac fe ff       	call   0x4ed640
  5029b3:	83 c4 04             	add    esp,0x4
  5029b6:	5f                   	pop    edi
  5029b7:	5e                   	pop    esi
  5029b8:	c3                   	ret
  5029b9:	56                   	push   esi
  5029ba:	e8 31 b3 fe ff       	call   0x4edcf0
  5029bf:	83 c4 04             	add    esp,0x4
  5029c2:	5f                   	pop    edi
  5029c3:	5e                   	pop    esi
  5029c4:	c3                   	ret
