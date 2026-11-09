
/workspace/shared/populous-prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004b3920 <.text+0xb2920>:
  4b3920:	83 ec 20             	sub    esp,0x20
  4b3923:	53                   	push   ebx
  4b3924:	56                   	push   esi
  4b3925:	57                   	push   edi
  4b3926:	8b 35 88 d1 89 00    	mov    esi,DWORD PTR ds:0x89d188
  4b392c:	55                   	push   ebp
  4b392d:	a1 81 79 89 00       	mov    eax,ds:0x897981
  4b3932:	33 ed                	xor    ebp,ebp
  4b3934:	8b 0d 50 a8 5c 00    	mov    ecx,DWORD PTR ds:0x5ca850
  4b393a:	8b 15 4c a8 5c 00    	mov    edx,DWORD PTR ds:0x5ca84c
  4b3940:	89 6c 24 14          	mov    DWORD PTR [esp+0x14],ebp
  4b3944:	a3 1e f7 98 00       	mov    ds:0x98f71e,eax
  4b3949:	89 0d 22 f7 98 00    	mov    DWORD PTR ds:0x98f722,ecx
  4b394f:	f6 05 46 f7 98 00 08 	test   BYTE PTR ds:0x98f746,0x8
  4b3956:	89 15 26 f7 98 00    	mov    DWORD PTR ds:0x98f726,edx
  4b395c:	0f 84 d3 00 00 00    	je     0x4b3a35
  4b3962:	66 39 2d 4c f7 98 00 	cmp    WORD PTR ds:0x98f74c,bp
  4b3969:	74 16                	je     0x4b3981
  4b396b:	66 ff 0d 4c f7 98 00 	dec    WORD PTR ds:0x98f74c
  4b3972:	75 0d                	jne    0x4b3981
  4b3974:	6a 01                	push   0x1
  4b3976:	55                   	push   ebp
  4b3977:	6a 08                	push   0x8
  4b3979:	e8 82 65 fc ff       	call   0x479f00
  4b397e:	83 c4 0c             	add    esp,0xc
  4b3981:	33 ed                	xor    ebp,ebp
  4b3983:	33 c0                	xor    eax,eax
  4b3985:	66 8b 2d 46 f7 98 00 	mov    bp,WORD PTR ds:0x98f746
  4b398c:	66 a1 46 f7 98 00    	mov    ax,ds:0x98f746
  4b3992:	83 e5 08             	and    ebp,0x8
  4b3995:	25 80 00 00 00       	and    eax,0x80
  4b399a:	83 3d 60 f6 98 00 ff 	cmp    DWORD PTR ds:0x98f660,0xffffffff
  4b39a1:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  4b39a5:	74 55                	je     0x4b39fc
  4b39a7:	bf ff ff ff ff       	mov    edi,0xffffffff
  4b39ac:	39 35 60 f6 98 00    	cmp    DWORD PTR ds:0x98f660,esi
  4b39b2:	7f 3f                	jg     0x4b39f3
  4b39b4:	e8 67 06 00 00       	call   0x4b4020
  4b39b9:	39 3d 60 f6 98 00    	cmp    DWORD PTR ds:0x98f660,edi
  4b39bf:	74 32                	je     0x4b39f3
  4b39c1:	e8 5a 03 ff ff       	call   0x4a3d20
  4b39c6:	8d 44 24 18          	lea    eax,[esp+0x18]
  4b39ca:	8b 0d 54 f6 98 00    	mov    ecx,DWORD PTR ds:0x98f654
  4b39d0:	50                   	push   eax
  4b39d1:	6a 08                	push   0x8
  4b39d3:	68 60 f6 98 00       	push   0x98f660
  4b39d8:	51                   	push   ecx
  4b39d9:	e8 a2 2b 07 00       	call   0x526580
  4b39de:	83 c4 10             	add    esp,0x10
  4b39e1:	85 c0                	test   eax,eax
  4b39e3:	74 06                	je     0x4b39eb
  4b39e5:	89 3d 60 f6 98 00    	mov    DWORD PTR ds:0x98f660,edi
  4b39eb:	39 3d 60 f6 98 00    	cmp    DWORD PTR ds:0x98f660,edi
  4b39f1:	75 b9                	jne    0x4b39ac
  4b39f3:	83 3d 60 f6 98 00 ff 	cmp    DWORD PTR ds:0x98f660,0xffffffff
  4b39fa:	75 39                	jne    0x4b3a35
  4b39fc:	f6 05 47 f7 98 00 0c 	test   BYTE PTR ds:0x98f747,0xc
  4b3a03:	74 17                	je     0x4b3a1c
  4b3a05:	66 81 25 46 f7 98 00 	and    WORD PTR ds:0x98f746,0xf3ff
  4b3a0c:	ff f3 
  4b3a0e:	a1 54 f6 98 00       	mov    eax,ds:0x98f654
  4b3a13:	50                   	push   eax
  4b3a14:	e8 57 29 07 00       	call   0x526370
  4b3a19:	83 c4 04             	add    esp,0x4
  4b3a1c:	bf ec f6 98 00       	mov    edi,0x98f6ec
  4b3a21:	33 c0                	xor    eax,eax
  4b3a23:	b9 07 00 00 00       	mov    ecx,0x7
  4b3a28:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4b3a2a:	66 ab                	stos   WORD PTR es:[edi],ax
  4b3a2c:	66 81 25 46 f7 98 00 	and    WORD PTR ds:0x98f746,0xfff7
  4b3a33:	f7 ff 
  4b3a35:	f6 05 46 f7 98 00 10 	test   BYTE PTR ds:0x98f746,0x10
  4b3a3c:	0f 84 e6 02 00 00    	je     0x4b3d28
  4b3a42:	e8 a9 09 00 00       	call   0x4b43f0
