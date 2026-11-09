
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0055d6c0 <.text+0x15c6c0>:
  55d6c0:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  55d6c6:	55                   	push   ebp
  55d6c7:	8b ec                	mov    ebp,esp
  55d6c9:	6a ff                	push   0xffffffff
  55d6cb:	68 88 31 59 00       	push   0x593188
  55d6d0:	68 74 58 56 00       	push   0x565874
  55d6d5:	50                   	push   eax
  55d6d6:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  55d6dd:	83 ec 60             	sub    esp,0x60
  55d6e0:	53                   	push   ebx
  55d6e1:	56                   	push   esi
  55d6e2:	57                   	push   edi
  55d6e3:	89 65 e8             	mov    DWORD PTR [ebp-0x18],esp
  55d6e6:	ff 15 f0 c5 d0 00    	call   DWORD PTR ds:0xd0c5f0
  55d6ec:	a3 e0 23 5e 00       	mov    ds:0x5e23e0,eax
  55d6f1:	33 c0                	xor    eax,eax
  55d6f3:	a0 e1 23 5e 00       	mov    al,ds:0x5e23e1
  55d6f8:	a3 ec 23 5e 00       	mov    ds:0x5e23ec,eax
  55d6fd:	a1 e0 23 5e 00       	mov    eax,ds:0x5e23e0
  55d702:	c1 2d e0 23 5e 00 10 	shr    DWORD PTR ds:0x5e23e0,0x10
  55d709:	25 ff 00 00 00       	and    eax,0xff
  55d70e:	a3 e8 23 5e 00       	mov    ds:0x5e23e8,eax
  55d713:	c1 e0 08             	shl    eax,0x8
  55d716:	03 05 ec 23 5e 00    	add    eax,DWORD PTR ds:0x5e23ec
  55d71c:	a3 e4 23 5e 00       	mov    ds:0x5e23e4,eax
  55d721:	e8 fa 54 00 00       	call   0x562c20
  55d726:	85 c0                	test   eax,eax
  55d728:	75 0a                	jne    0x55d734
  55d72a:	6a 1c                	push   0x1c
  55d72c:	e8 3f 01 00 00       	call   0x55d870
  55d731:	83 c4 04             	add    esp,0x4
  55d734:	e8 07 51 00 00       	call   0x562840
  55d739:	85 c0                	test   eax,eax
  55d73b:	75 0a                	jne    0x55d747
  55d73d:	6a 10                	push   0x10
  55d73f:	e8 2c 01 00 00       	call   0x55d870
  55d744:	83 c4 04             	add    esp,0x4
  55d747:	c7 45 fc 00 00 00 00 	mov    DWORD PTR [ebp-0x4],0x0
  55d74e:	e8 5d 12 00 00       	call   0x55e9b0
  55d753:	e8 08 81 00 00       	call   0x565860
  55d758:	ff 15 88 c7 d0 00    	call   DWORD PTR ds:0xd0c788
  55d75e:	a3 a4 b9 d0 00       	mov    ds:0xd0b9a4,eax
  55d763:	e8 58 7c 00 00       	call   0x5653c0
  55d768:	a3 20 24 5e 00       	mov    ds:0x5e2420,eax
  55d76d:	85 c0                	test   eax,eax
  55d76f:	74 09                	je     0x55d77a
  55d771:	83 3d a4 b9 d0 00 00 	cmp    DWORD PTR ds:0xd0b9a4,0x0
  55d778:	75 0a                	jne    0x55d784
  55d77a:	6a ff                	push   0xffffffff
  55d77c:	e8 ff fd ff ff       	call   0x55d580
  55d781:	83 c4 04             	add    esp,0x4
  55d784:	e8 c7 79 00 00       	call   0x565150
  55d789:	e8 d2 78 00 00       	call   0x565060
  55d78e:	e8 bd fd ff ff       	call   0x55d550
  55d793:	8b 35 a4 b9 d0 00    	mov    esi,DWORD PTR ds:0xd0b9a4
  55d799:	8a 06                	mov    al,BYTE PTR [esi]
  55d79b:	3c 22                	cmp    al,0x22
  55d79d:	74 0c                	je     0x55d7ab
  55d79f:	3c 20                	cmp    al,0x20
  55d7a1:	76 35                	jbe    0x55d7d8
  55d7a3:	46                   	inc    esi
  55d7a4:	80 3e 20             	cmp    BYTE PTR [esi],0x20
  55d7a7:	77 fa                	ja     0x55d7a3
  55d7a9:	eb 2d                	jmp    0x55d7d8
  55d7ab:	46                   	inc    esi
  55d7ac:	80 3e 22             	cmp    BYTE PTR [esi],0x22
  55d7af:	74 26                	je     0x55d7d7
  55d7b1:	8a 5d d8             	mov    bl,BYTE PTR [ebp-0x28]
  55d7b4:	8a 1e                	mov    bl,BYTE PTR [esi]
  55d7b6:	84 db                	test   bl,bl
  55d7b8:	74 18                	je     0x55d7d2
  55d7ba:	33 c0                	xor    eax,eax
  55d7bc:	8a c3                	mov    al,bl
  55d7be:	50                   	push   eax
  55d7bf:	e8 3c 78 00 00       	call   0x565000
  55d7c4:	83 c4 04             	add    esp,0x4
  55d7c7:	85 c0                	test   eax,eax
  55d7c9:	74 01                	je     0x55d7cc
  55d7cb:	46                   	inc    esi
  55d7cc:	46                   	inc    esi
  55d7cd:	80 3e 22             	cmp    BYTE PTR [esi],0x22
  55d7d0:	75 e2                	jne    0x55d7b4
  55d7d2:	80 3e 22             	cmp    BYTE PTR [esi],0x22
  55d7d5:	75 01                	jne    0x55d7d8
  55d7d7:	46                   	inc    esi
  55d7d8:	80 3e 00             	cmp    BYTE PTR [esi],0x0
  55d7db:	74 0b                	je     0x55d7e8
  55d7dd:	80 3e 20             	cmp    BYTE PTR [esi],0x20
  55d7e0:	77 06                	ja     0x55d7e8
  55d7e2:	46                   	inc    esi
  55d7e3:	80 3e 00             	cmp    BYTE PTR [esi],0x0
  55d7e6:	75 f5                	jne    0x55d7dd
  55d7e8:	c7 45 bc 00 00 00 00 	mov    DWORD PTR [ebp-0x44],0x0
  55d7ef:	8d 45 90             	lea    eax,[ebp-0x70]
  55d7f2:	50                   	push   eax
  55d7f3:	ff 15 88 c6 d0 00    	call   DWORD PTR ds:0xd0c688
  55d7f9:	f6 45 bc 01          	test   BYTE PTR [ebp-0x44],0x1
  55d7fd:	b8 0a 00 00 00       	mov    eax,0xa
  55d802:	74 08                	je     0x55d80c
  55d804:	8b 45 c0             	mov    eax,DWORD PTR [ebp-0x40]
  55d807:	25 ff ff 00 00       	and    eax,0xffff
  55d80c:	50                   	push   eax
  55d80d:	56                   	push   esi
  55d80e:	6a 00                	push   0x0
  55d810:	6a 00                	push   0x0
  55d812:	ff 15 8c c6 d0 00    	call   DWORD PTR ds:0xd0c68c
  55d818:	50                   	push   eax
  55d819:	e8 d2 66 02 00       	call   0x583ef0
  55d81e:	50                   	push   eax
  55d81f:	e8 5c fd ff ff       	call   0x55d580
  55d824:	eb 27                	jmp    0x55d84d
  55d826:	8b 45 ec             	mov    eax,DWORD PTR [ebp-0x14]
  55d829:	8b 00                	mov    eax,DWORD PTR [eax]
  55d82b:	8b 00                	mov    eax,DWORD PTR [eax]
  55d82d:	89 45 e0             	mov    DWORD PTR [ebp-0x20],eax
  55d830:	8b 45 ec             	mov    eax,DWORD PTR [ebp-0x14]
  55d833:	50                   	push   eax
  55d834:	8b 45 e0             	mov    eax,DWORD PTR [ebp-0x20]
  55d837:	50                   	push   eax
  55d838:	e8 43 76 00 00       	call   0x564e80
  55d83d:	83 c4 08             	add    esp,0x8
  55d840:	c3                   	ret
  55d841:	8b 65 e8             	mov    esp,DWORD PTR [ebp-0x18]
  55d844:	8b 45 e0             	mov    eax,DWORD PTR [ebp-0x20]
  55d847:	50                   	push   eax
  55d848:	e8 53 fd ff ff       	call   0x55d5a0
  55d84d:	83 c4 04             	add    esp,0x4
  55d850:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  55d857:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  55d85a:	5f                   	pop    edi
  55d85b:	64 a3 00 00 00 00    	mov    fs:0x0,eax
  55d861:	5e                   	pop    esi
  55d862:	5b                   	pop    ebx
  55d863:	8b e5                	mov    esp,ebp
  55d865:	5d                   	pop    ebp
  55d866:	c3                   	ret
