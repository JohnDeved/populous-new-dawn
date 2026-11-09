; Original d3dpoptb.exe instruction bytes. Display-only header is normalized.
; Complete cleanup window 004b2700..004b28c5 (end exclusive).
  4b2700:	f6 05 47 f7 98 00 03 	test   BYTE PTR ds:0x98f747,0x3
  4b2707:	53                   	push   ebx
  4b2708:	56                   	push   esi
  4b2709:	57                   	push   edi
  4b270a:	74 17                	je     0x4b2723
  4b270c:	66 81 25 46 f7 98 00 	and    WORD PTR ds:0x98f746,0xfcff
  4b2713:	ff fc 
  4b2715:	a1 50 f6 98 00       	mov    eax,ds:0x98f650
  4b271a:	50                   	push   eax
  4b271b:	e8 50 3c 07 00       	call   0x526370
  4b2720:	83 c4 04             	add    esp,0x4
  4b2723:	f6 05 47 f7 98 00 0c 	test   BYTE PTR ds:0x98f747,0xc
  4b272a:	74 17                	je     0x4b2743
  4b272c:	66 81 25 46 f7 98 00 	and    WORD PTR ds:0x98f746,0xf3ff
  4b2733:	ff f3 
  4b2735:	a1 54 f6 98 00       	mov    eax,ds:0x98f654
  4b273a:	50                   	push   eax
  4b273b:	e8 30 3c 07 00       	call   0x526370
  4b2740:	83 c4 04             	add    esp,0x4
  4b2743:	66 81 25 46 f7 98 00 	and    WORD PTR ds:0x98f746,0xff03
  4b274a:	03 ff 
  4b274c:	e8 9f a1 f7 ff       	call   0x42c8f0
  4b2751:	c6 05 ec c6 89 00 00 	mov    BYTE PTR ds:0x89c6ec,0x0
  4b2758:	e8 b3 4b f6 ff       	call   0x417310
  4b275d:	66 83 3d c1 c6 89 00 	cmp    WORD PTR ds:0x89c6c1,0x2
  4b2764:	02 
  4b2765:	75 05                	jne    0x4b276c
  4b2767:	e8 24 61 f6 ff       	call   0x418890
  4b276c:	33 f6                	xor    esi,esi
  4b276e:	bf ec f6 98 00       	mov    edi,0x98f6ec
  4b2773:	56                   	push   esi
  4b2774:	e8 87 54 f6 ff       	call   0x417c00
  4b2779:	83 c4 04             	add    esp,0x4
  4b277c:	33 c0                	xor    eax,eax
  4b277e:	c7 05 a9 c6 89 00 30 	mov    DWORD PTR ds:0x89c6a9,0x30
  4b2785:	00 00 00 
  4b2788:	81 0d 69 c6 89 00 00 	or     DWORD PTR ds:0x89c669,0x100000
  4b278f:	00 10 00 
  4b2792:	b9 07 00 00 00       	mov    ecx,0x7
  4b2797:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4b2799:	66 ab                	stos   WORD PTR es:[edi],ax
  4b279b:	66 0f be 0d f0 c6 89 	movsx  cx,BYTE PTR ds:0x89c6f0
  4b27a2:	00 
  4b27a3:	0f bf d1             	movsx  edx,cx
  4b27a6:	89 35 3e f7 98 00    	mov    DWORD PTR ds:0x98f73e,esi
  4b27ac:	b8 3e f7 98 00       	mov    eax,0x98f73e
  4b27b1:	8d 1c 92             	lea    ebx,[edx+edx*4]
  4b27b4:	89 70 04             	mov    DWORD PTR [eax+0x4],esi
  4b27b7:	8b c2                	mov    eax,edx
  4b27b9:	89 35 2e f7 98 00    	mov    DWORD PTR ds:0x98f72e,esi
  4b27bf:	8d 14 58             	lea    edx,[eax+ebx*2]
  4b27c2:	89 35 36 f7 98 00    	mov    DWORD PTR ds:0x98f736,esi
  4b27c8:	89 35 32 f7 98 00    	mov    DWORD PTR ds:0x98f732,esi
  4b27ce:	89 35 3a f7 98 00    	mov    DWORD PTR ds:0x98f73a,esi
  4b27d4:	8d 1c d2             	lea    ebx,[edx+edx*8]
  4b27d7:	8d 14 d8             	lea    edx,[eax+ebx*8]
  4b27da:	8d 94 90 c8 d1 89 00 	lea    edx,[eax+edx*4+0x89d1c8]
  4b27e1:	66 8b 42 24          	mov    ax,WORD PTR [edx+0x24]
  4b27e5:	66 a3 00 f7 98 00    	mov    ds:0x98f700,ax
  4b27eb:	66 8b 5a 26          	mov    bx,WORD PTR [edx+0x26]
  4b27ef:	56                   	push   esi
  4b27f0:	66 89 1d 02 f7 98 00 	mov    WORD PTR ds:0x98f702,bx
  4b27f7:	51                   	push   ecx
  4b27f8:	66 8b 42 32          	mov    ax,WORD PTR [edx+0x32]
  4b27fc:	6a 0a                	push   0xa
  4b27fe:	66 a3 04 f7 98 00    	mov    ds:0x98f704,ax
  4b2804:	0f bf 42 34          	movsx  eax,WORD PTR [edx+0x34]
  4b2808:	c1 e0 03             	shl    eax,0x3
  4b280b:	a3 fc f6 98 00       	mov    ds:0x98f6fc,eax
  4b2810:	e8 eb 76 fc ff       	call   0x479f00
  4b2815:	83 c4 0c             	add    esp,0xc
  4b2818:	f6 05 46 f7 98 00 08 	test   BYTE PTR ds:0x98f746,0x8
  4b281f:	74 20                	je     0x4b2841
  4b2821:	6a 01                	push   0x1
  4b2823:	56                   	push   esi
  4b2824:	6a 08                	push   0x8
  4b2826:	e8 d5 76 fc ff       	call   0x479f00
  4b282b:	83 c4 0c             	add    esp,0xc
  4b282e:	81 0d 69 c6 89 00 00 	or     DWORD PTR ds:0x89c669,0x80000
  4b2835:	00 08 00 
  4b2838:	6a 20                	push   0x20
  4b283a:	e8 61 c8 ff ff       	call   0x4af0a0
  4b283f:	eb 31                	jmp    0x4b2872
  4b2841:	80 3d 50 f7 98 00 03 	cmp    BYTE PTR ds:0x98f750,0x3
  4b2848:	74 17                	je     0x4b2861
  4b284a:	80 3d 50 f7 98 00 02 	cmp    BYTE PTR ds:0x98f750,0x2
  4b2851:	74 0e                	je     0x4b2861
  4b2853:	6a ff                	push   0xffffffff
  4b2855:	6a 00                	push   0x0
  4b2857:	6a 08                	push   0x8
  4b2859:	e8 a2 76 fc ff       	call   0x479f00
  4b285e:	83 c4 0c             	add    esp,0xc
  4b2861:	81 25 69 c6 89 00 ff 	and    DWORD PTR ds:0x89c669,0xfff7ffff
  4b2868:	ff f7 ff 
  4b286b:	6a 01                	push   0x1
  4b286d:	e8 4e c9 ff ff       	call   0x4af1c0
  4b2872:	83 c4 04             	add    esp,0x4
  4b2875:	6a 02                	push   0x2
  4b2877:	e8 14 a7 fe ff       	call   0x49cf90
  4b287c:	c6 05 a0 45 98 00 00 	mov    BYTE PTR ds:0x9845a0,0x0
  4b2883:	83 c4 04             	add    esp,0x4
  4b2886:	bf ec f6 98 00       	mov    edi,0x98f6ec
  4b288b:	c6 05 e8 46 98 00 00 	mov    BYTE PTR ds:0x9846e8,0x0
  4b2892:	6a 00                	push   0x0
  4b2894:	e8 67 53 f6 ff       	call   0x417c00
  4b2899:	83 c4 04             	add    esp,0x4
  4b289c:	33 c0                	xor    eax,eax
  4b289e:	81 25 69 c6 89 00 ff 	and    DWORD PTR ds:0x89c669,0xffefffff
  4b28a5:	ff ef ff 
  4b28a8:	b9 07 00 00 00       	mov    ecx,0x7
  4b28ad:	50                   	push   eax
  4b28ae:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4b28b0:	66 ab                	stos   WORD PTR es:[edi],ax
  4b28b2:	e8 c9 4e fc ff       	call   0x477780
  4b28b7:	83 c4 04             	add    esp,0x4
  4b28ba:	80 0d 47 f7 98 00 40 	or     BYTE PTR ds:0x98f747,0x40
  4b28c1:	5f                   	pop    edi
  4b28c2:	5e                   	pop    esi
  4b28c3:	5b                   	pop    ebx
  4b28c4:	c3                   	ret
