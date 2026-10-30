; terminalExit
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0041b4f0 <.text+0x1a4f0>:
  41b4f0:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  41b4f7:	75 1f                	jne    0x41b518
  41b4f9:	6a 00                	push   0x0
  41b4fb:	a0 f0 c6 89 00       	mov    al,ds:0x89c6f0
  41b500:	81 0d 65 c6 89 00 00 	or     DWORD PTR ds:0x89c665,0x8000000
  41b507:	00 00 08
  41b50a:	6a 36                	push   0x36
  41b50c:	6a 4a                	push   0x4a
  41b50e:	50                   	push   eax
  41b50f:	e8 dc e7 05 00       	call   0x479cf0
  41b514:	83 c4 10             	add    esp,0x10
  41b517:	c3                   	ret
  41b518:	83 0d 61 c6 89 00 20 	or     DWORD PTR ds:0x89c661,0x20
  41b51f:	c3                   	ret

; resultFontSelection
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0042bde0 <.text+0x2ade0>:
  42bde0:	0f bf 05 cf c6 89 00 	movsx  eax,WORD PTR ds:0x89c6cf
  42bde7:	0f bf 0d d1 c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6d1
  42bdee:	0f af c1             	imul   eax,ecx
  42bdf1:	3d 00 b0 04 00       	cmp    eax,0x4b000
  42bdf6:	7d 52                	jge    0x42be4a
  42bdf8:	b8 02 00 00 00       	mov    eax,0x2
  42bdfd:	b9 04 00 00 00       	mov    ecx,0x4
  42be02:	a2 d5 28 89 00       	mov    ds:0x8928d5,al
  42be07:	88 0d d4 28 89 00    	mov    BYTE PTR ds:0x8928d4,cl
  42be0d:	a2 d6 28 89 00       	mov    ds:0x8928d6,al
  42be12:	a2 d7 28 89 00       	mov    ds:0x8928d7,al
  42be17:	88 0d d8 28 89 00    	mov    BYTE PTR ds:0x8928d8,cl
  42be1d:	88 0d d9 28 89 00    	mov    BYTE PTR ds:0x8928d9,cl
  42be23:	a2 db 28 89 00       	mov    ds:0x8928db,al
  42be28:	88 0d dc 28 89 00    	mov    BYTE PTR ds:0x8928dc,cl
  42be2e:	c6 05 d3 28 89 00 06 	mov    BYTE PTR ds:0x8928d3,0x6
  42be35:	c6 05 da 28 89 00 00 	mov    BYTE PTR ds:0x8928da,0x0
  42be3c:	c6 05 dd 28 89 00 03 	mov    BYTE PTR ds:0x8928dd,0x3
  42be43:	88 0d de 28 89 00    	mov    BYTE PTR ds:0x8928de,cl
  42be49:	c3                   	ret
  42be4a:	33 c0                	xor    eax,eax
  42be4c:	b9 03 00 00 00       	mov    ecx,0x3
  42be51:	a2 d5 28 89 00       	mov    ds:0x8928d5,al
  42be56:	88 0d d4 28 89 00    	mov    BYTE PTR ds:0x8928d4,cl
  42be5c:	a2 d6 28 89 00       	mov    ds:0x8928d6,al
  42be61:	88 0d d8 28 89 00    	mov    BYTE PTR ds:0x8928d8,cl
  42be67:	88 0d d9 28 89 00    	mov    BYTE PTR ds:0x8928d9,cl
  42be6d:	a2 db 28 89 00       	mov    ds:0x8928db,al
  42be72:	88 0d dc 28 89 00    	mov    BYTE PTR ds:0x8928dc,cl
  42be78:	88 0d dd 28 89 00    	mov    BYTE PTR ds:0x8928dd,cl
  42be7e:	c6 05 d3 28 89 00 04 	mov    BYTE PTR ds:0x8928d3,0x4
  42be85:	c6 05 d7 28 89 00 02 	mov    BYTE PTR ds:0x8928d7,0x2
  42be8c:	c6 05 da 28 89 00 01 	mov    BYTE PTR ds:0x8928da,0x1
  42be93:	88 0d de 28 89 00    	mov    BYTE PTR ds:0x8928de,cl
  42be99:	c3                   	ret

; tribeDispatch
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0043e90b <.text+0x3d90b>:
  43e90b:	8a 48 0c             	mov    cl,BYTE PTR [eax+0xc]
  43e90e:	83 e9 0c             	sub    ecx,0xc
  43e911:	83 f9 7a             	cmp    ecx,0x7a
  43e914:	0f 87 7a 39 00 00    	ja     0x442294
  43e91a:	33 c0                	xor    eax,eax
  43e91c:	8a 81 f0 23 44 00    	mov    al,BYTE PTR [ecx+0x4423f0]
  43e922:	ff 24 85 c0 22 44 00 	jmp    DWORD PTR [eax*4+0x4422c0]

; tribeNextLevel
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0043fb95 <.text+0x3eb95>:
  43fb95:	8b 84 24 e8 03 00 00 	mov    eax,DWORD PTR [esp+0x3e8]
  43fb9c:	8b 48 04             	mov    ecx,DWORD PTR [eax+0x4]
  43fb9f:	51                   	push   ecx
  43fba0:	e8 4b 5d 04 00       	call   0x4858f0
  43fba5:	83 c4 04             	add    esp,0x4
  43fba8:	e9 e7 26 00 00       	jmp    0x442294

; queueTribeCommand
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00479cf0 <.text+0x78cf0>:
  479cf0:	53                   	push   ebx
  479cf1:	33 c0                	xor    eax,eax
  479cf3:	8a 44 24 08          	mov    al,BYTE PTR [esp+0x8]
  479cf7:	56                   	push   esi
  479cf8:	32 d2                	xor    dl,dl
  479cfa:	8d 0c 40             	lea    ecx,[eax+eax*2]
  479cfd:	f6 05 62 c6 89 00 08 	test   BYTE PTR ds:0x89c662,0x8
  479d04:	8d b4 89 97 79 89 00 	lea    esi,[ecx+ecx*4+0x897997]
  479d0b:	75 56                	jne    0x479d63
  479d0d:	66 8b 4c 24 10       	mov    cx,WORD PTR [esp+0x10]
  479d12:	0f b7 c1             	movzx  eax,cx
  479d15:	83 e8 0c             	sub    eax,0xc
  479d18:	83 f8 46             	cmp    eax,0x46
  479d1b:	77 0f                	ja     0x479d2c
  479d1d:	33 db                	xor    ebx,ebx
  479d1f:	8a 98 84 9d 47 00    	mov    bl,BYTE PTR [eax+0x479d84]
  479d25:	ff 24 9d 68 9d 47 00 	jmp    DWORD PTR [ebx*4+0x479d68]
  479d2c:	80 7e 0c 00          	cmp    BYTE PTR [esi+0xc],0x0
  479d30:	75 1c                	jne    0x479d4e
  479d32:	eb 18                	jmp    0x479d4c
  479d34:	81 0d 61 c6 89 00 00 	or     DWORD PTR ds:0x89c661,0x800
  479d3b:	08 00 00
  479d3e:	81 0d 61 c6 89 00 00 	or     DWORD PTR ds:0x89c661,0x800000
  479d45:	00 80 00
  479d48:	b2 01                	mov    dl,0x1
  479d4a:	eb 02                	jmp    0x479d4e
  479d4c:	b2 01                	mov    dl,0x1
  479d4e:	84 d2                	test   dl,dl
  479d50:	74 11                	je     0x479d63
  479d52:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  479d56:	88 4e 0c             	mov    BYTE PTR [esi+0xc],cl
  479d59:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  479d5d:	89 46 04             	mov    DWORD PTR [esi+0x4],eax
  479d60:	89 4e 08             	mov    DWORD PTR [esi+0x8],ecx
  479d63:	5e                   	pop    esi
  479d64:	5b                   	pop    ebx
  479d65:	c3                   	ret

; headerSentinelGuard
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00485660 <.text+0x84660>:
  485660:	81 ec 24 02 00 00    	sub    esp,0x224
  485666:	53                   	push   ebx
  485667:	56                   	push   esi
  485668:	8b b4 24 30 02 00 00 	mov    esi,DWORD PTR [esp+0x230]
  48566f:	57                   	push   edi
  485670:	83 fe 36             	cmp    esi,0x36
  485673:	0f 84 63 02 00 00    	je     0x4858dc

; headerSentinelReturn
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004858dc <.text+0x848dc>:
  4858dc:	5f                   	pop    edi
  4858dd:	5e                   	pop    esi
  4858de:	5b                   	pop    ebx
  4858df:	81 c4 24 02 00 00    	add    esp,0x224
  4858e5:	c3                   	ret

; nextLevel
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004858f0 <.text+0x848f0>:
  4858f0:	81 25 65 c6 89 00 ff 	and    DWORD PTR ds:0x89c665,0xf7ffffff
  4858f7:	ff ff f7
  4858fa:	83 ec 08             	sub    esp,0x8
  4858fd:	f6 05 7c d1 89 00 01 	test   BYTE PTR ds:0x89d17c,0x1
  485904:	53                   	push   ebx
  485905:	56                   	push   esi
  485906:	57                   	push   edi
  485907:	74 11                	je     0x48591a
  485909:	6a 07                	push   0x7
  48590b:	e8 50 d1 fb ff       	call   0x442a60
  485910:	83 c4 04             	add    esp,0x4
  485913:	5f                   	pop    edi
  485914:	5e                   	pop    esi
  485915:	5b                   	pop    ebx
  485916:	83 c4 08             	add    esp,0x8
  485919:	c3                   	ret
  48591a:	e8 b1 71 01 00       	call   0x49cad0
  48591f:	e8 4c b5 ff ff       	call   0x480e70
  485924:	33 c9                	xor    ecx,ecx
  485926:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  48592a:	8a 0d 15 a3 89 00    	mov    cl,BYTE PTR ds:0x89a315
  485930:	3b f1                	cmp    esi,ecx
  485932:	75 07                	jne    0x48593b
  485934:	b8 63 00 00 00       	mov    eax,0x63
  485939:	eb 30                	jmp    0x48596b
  48593b:	33 c0                	xor    eax,eax
  48593d:	bf 59 a0 89 00       	mov    edi,0x89a059
  485942:	33 d2                	xor    edx,edx
  485944:	8a 17                	mov    dl,BYTE PTR [edi]
  485946:	3b d6                	cmp    edx,esi
  485948:	74 21                	je     0x48596b
  48594a:	83 c7 18             	add    edi,0x18
  48594d:	40                   	inc    eax
  48594e:	81 ff 29 a3 89 00    	cmp    edi,0x89a329
  485954:	72 ec                	jb     0x485942
  485956:	83 fe 1c             	cmp    esi,0x1c
  485959:	7c 0a                	jl     0x485965
  48595b:	83 fe 1e             	cmp    esi,0x1e
  48595e:	7e 09                	jle    0x485969
  485960:	83 fe 4f             	cmp    esi,0x4f
  485963:	74 04                	je     0x485969
  485965:	33 c0                	xor    eax,eax
  485967:	eb 02                	jmp    0x48596b
  485969:	8b c6                	mov    eax,esi
  48596b:	66 89 35 dd c6 89 00 	mov    WORD PTR ds:0x89c6dd,si
  485972:	a2 3f b7 89 00       	mov    ds:0x89b73f,al
  485977:	0f bf c6             	movsx  eax,si
  48597a:	3b c1                	cmp    eax,ecx
  48597c:	75 0c                	jne    0x48598a
  48597e:	81 0d 65 c6 89 00 00 	or     DWORD PTR ds:0x89c665,0x200
  485985:	02 00 00
  485988:	eb 0f                	jmp    0x485999
  48598a:	81 25 65 c6 89 00 ff 	and    DWORD PTR ds:0x89c665,0xfffffdff
  485991:	fd ff ff
  485994:	e8 57 3b f9 ff       	call   0x4194f0
  485999:	6a 00                	push   0x0
  48599b:	68 a9 a3 89 00       	push   0x89a3a9
  4859a0:	e8 0b 17 fa ff       	call   0x4270b0
  4859a5:	83 c4 08             	add    esp,0x8
  4859a8:	56                   	push   esi
  4859a9:	e8 b2 fc ff ff       	call   0x485660
  4859ae:	83 c4 04             	add    esp,0x4
  4859b1:	a0 99 b7 89 00       	mov    al,ds:0x89b799
  4859b6:	a2 c0 ea 96 00       	mov    ds:0x96eac0,al
  4859bb:	a2 bf ea 96 00       	mov    ds:0x96eabf,al
  4859c0:	f6 05 66 c6 89 00 02 	test   BYTE PTR ds:0x89c666,0x2
  4859c7:	74 0f                	je     0x4859d8
  4859c9:	6a 00                	push   0x0
  4859cb:	e8 90 cf f8 ff       	call   0x412960
  4859d0:	83 c4 04             	add    esp,0x4
  4859d3:	e9 b6 00 00 00       	jmp    0x485a8e
  4859d8:	33 c0                	xor    eax,eax
  4859da:	33 db                	xor    ebx,ebx
  4859dc:	a0 a1 b7 89 00       	mov    al,ds:0x89b7a1
  4859e1:	8a 1d a2 b7 89 00    	mov    bl,BYTE PTR ds:0x89b7a2
  4859e7:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  4859eb:	33 c0                	xor    eax,eax
  4859ed:	a0 a3 b7 89 00       	mov    al,ds:0x89b7a3
  4859f2:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  4859f6:	33 c0                	xor    eax,eax
  4859f8:	a0 3f b7 89 00       	mov    al,ds:0x89b73f
  4859fd:	50                   	push   eax
  4859fe:	e8 5d 04 00 00       	call   0x485e60
  485a03:	83 c4 04             	add    esp,0x4
  485a06:	33 c0                	xor    eax,eax
  485a08:	a0 3f b7 89 00       	mov    al,ds:0x89b73f
  485a0d:	83 e8 0f             	sub    eax,0xf
  485a10:	83 f8 05             	cmp    eax,0x5
  485a13:	77 66                	ja     0x485a7b
  485a15:	ff 24 85 e4 5a 48 00 	jmp    DWORD PTR [eax*4+0x485ae4]
  485a1c:	33 c0                	xor    eax,eax
  485a1e:	f6 05 d9 b0 89 00 01 	test   BYTE PTR ds:0x89b0d9,0x1
  485a25:	74 05                	je     0x485a2c
  485a27:	b8 03 00 00 00       	mov    eax,0x3
  485a2c:	85 c0                	test   eax,eax
  485a2e:	74 4b                	je     0x485a7b
  485a30:	b8 14 00 00 00       	mov    eax,0x14
  485a35:	83 f8 13             	cmp    eax,0x13
  485a38:	74 2b                	je     0x485a65
  485a3a:	3b c0                	cmp    eax,eax
  485a3c:	74 33                	je     0x485a71
  485a3e:	eb 3b                	jmp    0x485a7b
  485a40:	33 c0                	xor    eax,eax
  485a42:	f6 05 35 b0 89 00 01 	test   BYTE PTR ds:0x89b035,0x1
  485a49:	74 05                	je     0x485a50
  485a4b:	b8 03 00 00 00       	mov    eax,0x3
  485a50:	85 c0                	test   eax,eax
  485a52:	74 27                	je     0x485a7b
  485a54:	b8 13 00 00 00       	mov    eax,0x13
  485a59:	83 f8 13             	cmp    eax,0x13
  485a5c:	74 07                	je     0x485a65
  485a5e:	83 f8 14             	cmp    eax,0x14
  485a61:	74 0e                	je     0x485a71
  485a63:	eb 16                	jmp    0x485a7b
  485a65:	81 0d 41 b7 89 00 00 	or     DWORD PTR ds:0x89b741,0x2000
  485a6c:	20 00 00
  485a6f:	eb 0a                	jmp    0x485a7b
  485a71:	81 0d 41 b7 89 00 00 	or     DWORD PTR ds:0x89b741,0x10000
  485a78:	00 01 00
  485a7b:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  485a7f:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  485a83:	50                   	push   eax
  485a84:	53                   	push   ebx
  485a85:	51                   	push   ecx
  485a86:	e8 05 5b fa ff       	call   0x42b590
  485a8b:	83 c4 0c             	add    esp,0xc
  485a8e:	f6 05 66 c6 89 00 02 	test   BYTE PTR ds:0x89c666,0x2
  485a95:	74 04                	je     0x485a9b
  485a97:	6a 01                	push   0x1
  485a99:	eb 02                	jmp    0x485a9d
  485a9b:	6a 00                	push   0x0
  485a9d:	33 c0                	xor    eax,eax
  485a9f:	a0 3f b7 89 00       	mov    al,ds:0x89b73f
  485aa4:	50                   	push   eax
  485aa5:	e8 26 6c fa ff       	call   0x42c6d0
  485aaa:	c6 05 12 cf 89 00 00 	mov    BYTE PTR ds:0x89cf12,0x0
  485ab1:	83 c4 08             	add    esp,0x8
  485ab4:	e8 77 72 fa ff       	call   0x42cd30
  485ab9:	6a ff                	push   0xffffffff
  485abb:	6a 00                	push   0x0
  485abd:	6a 08                	push   0x8
  485abf:	e8 3c 44 ff ff       	call   0x479f00
  485ac4:	83 c4 0c             	add    esp,0xc
  485ac7:	66 0f be 05 f0 c6 89 	movsx  ax,BYTE PTR ds:0x89c6f0
  485ace:	00
  485acf:	6a 00                	push   0x0
  485ad1:	50                   	push   eax
  485ad2:	6a 0a                	push   0xa
  485ad4:	e8 27 44 ff ff       	call   0x479f00
  485ad9:	83 c4 0c             	add    esp,0xc
  485adc:	5f                   	pop    edi
  485add:	5e                   	pop    esi
  485ade:	5b                   	pop    ebx
  485adf:	83 c4 08             	add    esp,0x8
  485ae2:	c3                   	ret

; levelSpecLoad
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00486350 <.text+0x85350>:
  486350:	81 ec 24 02 00 00    	sub    esp,0x224
  486356:	8d 44 24 04          	lea    eax,[esp+0x4]
  48635a:	6a 00                	push   0x0
  48635c:	68 2c cd 59 00       	push   0x59cd2c
  486361:	50                   	push   eax
  486362:	e8 79 9c 07 00       	call   0x4fffe0
  486367:	8d 44 24 10          	lea    eax,[esp+0x10]
  48636b:	8d 8c 24 20 01 00 00 	lea    ecx,[esp+0x120]
  486372:	83 c4 0c             	add    esp,0xc
  486375:	68 50 1e 5a 00       	push   0x5a1e50
  48637a:	50                   	push   eax
  48637b:	68 34 9b 59 00       	push   0x599b34
  486380:	51                   	push   ecx
  486381:	e8 ca 50 0d 00       	call   0x55b450
  486386:	83 c4 10             	add    esp,0x10
  486389:	e8 72 ce 01 00       	call   0x4a3200
  48638e:	e8 8d d9 01 00       	call   0x4a3d20
  486393:	8d 8c 24 14 01 00 00 	lea    ecx,[esp+0x114]
  48639a:	51                   	push   ecx
  48639b:	68 23 cd 89 00       	push   0x89cd23
  4863a0:	e8 0b 9e 07 00       	call   0x5001b0
  4863a5:	8d 4c 24 08          	lea    ecx,[esp+0x8]
  4863a9:	83 c4 08             	add    esp,0x8
  4863ac:	51                   	push   ecx
  4863ad:	68 ff ff ff 0f       	push   0xfffffff
  4863b2:	68 0d a0 89 00       	push   0x89a00d
  4863b7:	68 23 cd 89 00       	push   0x89cd23
  4863bc:	e8 bf fb 09 00       	call   0x525f80
  4863c1:	83 c4 10             	add    esp,0x10
  4863c4:	85 c0                	test   eax,eax
  4863c6:	74 7c                	je     0x486444
  4863c8:	8d 44 24 04          	lea    eax,[esp+0x4]
  4863cc:	6a 00                	push   0x0
  4863ce:	68 2c cd 59 00       	push   0x59cd2c
  4863d3:	50                   	push   eax
  4863d4:	e8 67 9c 07 00       	call   0x500040
  4863d9:	8d 44 24 10          	lea    eax,[esp+0x10]
  4863dd:	8d 8c 24 20 01 00 00 	lea    ecx,[esp+0x120]
  4863e4:	83 c4 0c             	add    esp,0xc
  4863e7:	68 50 1e 5a 00       	push   0x5a1e50
  4863ec:	50                   	push   eax
  4863ed:	68 34 9b 59 00       	push   0x599b34
  4863f2:	51                   	push   ecx
  4863f3:	e8 58 50 0d 00       	call   0x55b450
  4863f8:	83 c4 10             	add    esp,0x10
  4863fb:	e8 00 ce 01 00       	call   0x4a3200
  486400:	e8 1b d9 01 00       	call   0x4a3d20
  486405:	8d 8c 24 14 01 00 00 	lea    ecx,[esp+0x114]
  48640c:	51                   	push   ecx
  48640d:	68 23 cd 89 00       	push   0x89cd23
  486412:	e8 99 9d 07 00       	call   0x5001b0
  486417:	8d 4c 24 08          	lea    ecx,[esp+0x8]
  48641b:	83 c4 08             	add    esp,0x8
  48641e:	51                   	push   ecx
  48641f:	68 ff ff ff 0f       	push   0xfffffff
  486424:	68 0d a0 89 00       	push   0x89a00d
  486429:	68 23 cd 89 00       	push   0x89cd23
  48642e:	e8 4d fb 09 00       	call   0x525f80
  486433:	83 c4 10             	add    esp,0x10
  486436:	85 c0                	test   eax,eax
  486438:	74 0a                	je     0x486444
  48643a:	6a 1a                	push   0x1a
  48643c:	e8 9f a5 07 00       	call   0x5009e0
  486441:	83 c4 04             	add    esp,0x4
  486444:	81 c4 24 02 00 00    	add    esp,0x224
  48644a:	c3                   	ret

; blinkProducer
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004a470b <.text+0xa370b>:
  4a470b:	b9 01 00 00 00       	mov    ecx,0x1
  4a4710:	ff 05 81 79 89 00    	inc    DWORD PTR ds:0x897981
  4a4716:	a1 84 d1 89 00       	mov    eax,ds:0x89d184
  4a471b:	2b d2                	sub    edx,edx
  4a471d:	f7 f1                	div    ecx
  4a471f:	24 01                	and    al,0x1
  4a4721:	41                   	inc    ecx
  4a4722:	83 f9 08             	cmp    ecx,0x8
  4a4725:	88 81 84 79 89 00    	mov    BYTE PTR [ecx+0x897984],al
  4a472b:	7c e9                	jl     0x4a4716

; keyboardRoutes
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004a9f09 <.text+0xa8f09>:
  4a9f09:	80 3d 81 bb 89 00 02 	cmp    BYTE PTR ds:0x89bb81,0x2
  4a9f10:	0f 84 b5 01 00 00    	je     0x4aa0cb
  4a9f16:	80 3d 81 bb 89 00 03 	cmp    BYTE PTR ds:0x89bb81,0x3
  4a9f1d:	0f 84 a8 01 00 00    	je     0x4aa0cb
  4a9f23:	66 f7 05 46 f7 98 00 	test   WORD PTR ds:0x98f746,0x4010
  4a9f2a:	10 40
  4a9f2c:	0f 85 56 01 00 00    	jne    0x4aa088
  4a9f32:	f6 05 6c c6 89 00 10 	test   BYTE PTR ds:0x89c66c,0x10
  4a9f39:	0f 84 b5 00 00 00    	je     0x4a9ff4
  4a9f3f:	85 db                	test   ebx,ebx
  4a9f41:	0f 84 a6 01 00 00    	je     0x4aa0ed
  4a9f47:	83 fe 01             	cmp    esi,0x1
  4a9f4a:	75 3e                	jne    0x4a9f8a
  4a9f4c:	f6 44 24 0b 01       	test   BYTE PTR [esp+0xb],0x1
  4a9f51:	74 29                	je     0x4a9f7c
  4a9f53:	83 3d 70 aa 96 00 00 	cmp    DWORD PTR ds:0x96aa70,0x0
  4a9f5a:	74 11                	je     0x4a9f6d
  4a9f5c:	a1 70 aa 96 00       	mov    eax,ds:0x96aa70
  4a9f61:	c6 80 8a 00 00 00 01 	mov    BYTE PTR [eax+0x8a],0x1
  4a9f68:	e9 80 01 00 00       	jmp    0x4aa0ed
  4a9f6d:	6a 01                	push   0x1
  4a9f6f:	e8 4c 52 00 00       	call   0x4af1c0
  4a9f74:	83 c4 04             	add    esp,0x4
  4a9f77:	e9 71 01 00 00       	jmp    0x4aa0ed
  4a9f7c:	6a 00                	push   0x0
  4a9f7e:	6a 00                	push   0x0
  4a9f80:	68 9b 00 00 00       	push   0x9b
  4a9f85:	e9 5b 01 00 00       	jmp    0x4aa0e5
  4a9f8a:	83 fe 39             	cmp    esi,0x39
  4a9f8d:	0f 85 5a 01 00 00    	jne    0x4aa0ed
  4a9f93:	f6 05 68 c6 89 00 04 	test   BYTE PTR ds:0x89c668,0x4
  4a9f9a:	75 0e                	jne    0x4a9faa
  4a9f9c:	f6 05 d7 9b 96 00 01 	test   BYTE PTR ds:0x969bd7,0x1
  4a9fa3:	74 05                	je     0x4a9faa
  4a9fa5:	e8 d6 f0 f9 ff       	call   0x449080
  4a9faa:	f6 05 64 c6 89 00 06 	test   BYTE PTR ds:0x89c664,0x6
  4a9fb1:	0f 84 36 01 00 00    	je     0x4aa0ed
  4a9fb7:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  4a9fbe:	74 29                	je     0x4a9fe9
  4a9fc0:	f6 05 7c d1 89 00 02 	test   BYTE PTR ds:0x89d17c,0x2
  4a9fc7:	74 20                	je     0x4a9fe9
  4a9fc9:	f6 05 69 c6 89 00 20 	test   BYTE PTR ds:0x89c669,0x20
  4a9fd0:	75 0c                	jne    0x4a9fde
  4a9fd2:	83 0d 69 c6 89 00 20 	or     DWORD PTR ds:0x89c669,0x20
  4a9fd9:	e9 0f 01 00 00       	jmp    0x4aa0ed
  4a9fde:	6a 00                	push   0x0
  4a9fe0:	6a 00                	push   0x0
  4a9fe2:	6a 63                	push   0x63
  4a9fe4:	e9 fc 00 00 00       	jmp    0x4aa0e5
  4a9fe9:	6a 00                	push   0x0
  4a9feb:	6a 00                	push   0x0
  4a9fed:	6a 5b                	push   0x5b
  4a9fef:	e9 f1 00 00 00       	jmp    0x4aa0e5
  4a9ff4:	f6 05 69 c6 89 00 20 	test   BYTE PTR ds:0x89c669,0x20
  4a9ffb:	74 2c                	je     0x4aa029
  4a9ffd:	85 db                	test   ebx,ebx
  4a9fff:	74 28                	je     0x4aa029
  4aa001:	f6 05 64 c6 89 00 06 	test   BYTE PTR ds:0x89c664,0x6
  4aa008:	74 14                	je     0x4aa01e
  4aa00a:	83 fe 39             	cmp    esi,0x39
  4aa00d:	0f 85 da 00 00 00    	jne    0x4aa0ed
  4aa013:	6a 00                	push   0x0
  4aa015:	6a 00                	push   0x0
  4aa017:	6a 63                	push   0x63
  4aa019:	e9 c7 00 00 00       	jmp    0x4aa0e5
  4aa01e:	6a 00                	push   0x0
  4aa020:	6a 00                	push   0x0
  4aa022:	6a 63                	push   0x63
  4aa024:	e9 bc 00 00 00       	jmp    0x4aa0e5
  4aa029:	80 3d e7 c6 89 00 04 	cmp    BYTE PTR ds:0x89c6e7,0x4
  4aa030:	75 2c                	jne    0x4aa05e
  4aa032:	8b 44 24 0b          	mov    eax,DWORD PTR [esp+0xb]
  4aa036:	53                   	push   ebx
  4aa037:	50                   	push   eax
  4aa038:	56                   	push   esi
  4aa039:	e8 72 45 00 00       	call   0x4ae5b0
  4aa03e:	83 c4 0c             	add    esp,0xc
  4aa041:	85 db                	test   ebx,ebx
  4aa043:	0f 84 a4 00 00 00    	je     0x4aa0ed
  4aa049:	ff 15 84 c7 d0 00    	call   DWORD PTR ds:0xd0c784
  4aa04f:	05 c8 00 00 00       	add    eax,0xc8
  4aa054:	a3 74 db 5c 00       	mov    ds:0x5cdb74,eax
  4aa059:	e9 8f 00 00 00       	jmp    0x4aa0ed
  4aa05e:	e8 2d 5b 05 00       	call   0x4ffb90
  4aa063:	8b 48 04             	mov    ecx,DWORD PTR [eax+0x4]
  4aa066:	8b 10                	mov    edx,DWORD PTR [eax]
  4aa068:	51                   	push   ecx
  4aa069:	83 fb 01             	cmp    ebx,0x1
  4aa06c:	1a c0                	sbb    al,al
  4aa06e:	52                   	push   edx
  4aa06f:	24 03                	and    al,0x3
  4aa071:	8b 4c 24 13          	mov    ecx,DWORD PTR [esp+0x13]
  4aa075:	fe c0                	inc    al
  4aa077:	50                   	push   eax
  4aa078:	51                   	push   ecx
  4aa079:	56                   	push   esi
  4aa07a:	8b 0d 6c ce 98 00    	mov    ecx,DWORD PTR ds:0x98ce6c
  4aa080:	e8 eb f3 fd ff       	call   0x489470
  4aa085:	50                   	push   eax
  4aa086:	eb 5d                	jmp    0x4aa0e5
  4aa088:	33 c0                	xor    eax,eax
  4aa08a:	85 db                	test   ebx,ebx
  4aa08c:	74 5f                	je     0x4aa0ed
  4aa08e:	f6 05 46 f7 98 00 04 	test   BYTE PTR ds:0x98f746,0x4
  4aa095:	74 56                	je     0x4aa0ed
  4aa097:	80 3d 50 f7 98 00 03 	cmp    BYTE PTR ds:0x98f750,0x3
  4aa09e:	74 4d                	je     0x4aa0ed
  4aa0a0:	a3 10 d1 59 00       	mov    ds:0x59d110,eax
  4aa0a5:	b0 01                	mov    al,0x1
  4aa0a7:	84 c0                	test   al,al
  4aa0a9:	74 42                	je     0x4aa0ed
  4aa0ab:	e8 50 86 00 00       	call   0x4b2700
  4aa0b0:	a0 12 f7 98 00       	mov    al,ds:0x98f712
  4aa0b5:	6a 02                	push   0x2
  4aa0b7:	a2 61 d1 89 00       	mov    ds:0x89d161,al
  4aa0bc:	e8 df 2e ff ff       	call   0x49cfa0
  4aa0c1:	83 c4 04             	add    esp,0x4
  4aa0c4:	e8 a7 a6 00 00       	call   0x4b4770
  4aa0c9:	eb 22                	jmp    0x4aa0ed
  4aa0cb:	85 db                	test   ebx,ebx
  4aa0cd:	74 1e                	je     0x4aa0ed
  4aa0cf:	83 fe 1c             	cmp    esi,0x1c
  4aa0d2:	74 08                	je     0x4aa0dc
  4aa0d4:	81 fe 9c 00 00 00    	cmp    esi,0x9c
  4aa0da:	75 11                	jne    0x4aa0ed
  4aa0dc:	6a 00                	push   0x0
  4aa0de:	6a 00                	push   0x0
  4aa0e0:	68 b0 00 00 00       	push   0xb0
  4aa0e5:	e8 96 0a 00 00       	call   0x4aab80
  4aa0ea:	83 c4 0c             	add    esp,0xc
  4aa0ed:	b8 01 00 00 00       	mov    eax,0x1
  4aa0f2:	5e                   	pop    esi
  4aa0f3:	c6 05 78 db 5c 00 00 	mov    BYTE PTR ds:0x5cdb78,0x0
  4aa0fa:	5b                   	pop    ebx
  4aa0fb:	83 c4 04             	add    esp,0x4
  4aa0fe:	c3                   	ret

; commandDispatch
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004aabac <.text+0xa9bac>:
  4aabac:	8d 53 f3             	lea    edx,[ebx-0xd]
  4aabaf:	81 fa c1 00 00 00    	cmp    edx,0xc1
  4aabb5:	8d b4 85 c8 d1 89 00 	lea    esi,[ebp+eax*4+0x89d1c8]
  4aabbc:	8d 44 85 00          	lea    eax,[ebp+eax*4+0x0]
  4aabc0:	77 0f                	ja     0x4aabd1
  4aabc2:	33 c9                	xor    ecx,ecx
  4aabc4:	8a 8a 40 d7 4a 00    	mov    cl,BYTE PTR [edx+0x4ad740]
  4aabca:	ff 24 8d c4 d5 4a 00 	jmp    DWORD PTR [ecx*4+0x4ad5c4]
  4aabd1:	33 ff                	xor    edi,edi
  4aabd3:	e9 0a 10 00 00       	jmp    0x4abbe2

; statisticsDismiss
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004ab498 <.text+0xaa498>:
  4ab498:	83 3d 88 d1 89 00 0a 	cmp    DWORD PTR ds:0x89d188,0xa
  4ab49f:	0f 86 3d 07 00 00    	jbe    0x4abbe2
  4ab4a5:	f6 05 68 c6 89 00 04 	test   BYTE PTR ds:0x89c668,0x4
  4ab4ac:	0f 85 30 07 00 00    	jne    0x4abbe2
  4ab4b2:	f6 05 64 c6 89 00 06 	test   BYTE PTR ds:0x89c664,0x6
  4ab4b9:	74 23                	je     0x4ab4de
  4ab4bb:	f6 05 69 c6 89 00 20 	test   BYTE PTR ds:0x89c669,0x20
  4ab4c2:	0f 84 1a 07 00 00    	je     0x4abbe2
  4ab4c8:	e8 b3 ff fd ff       	call   0x48b480
  4ab4cd:	83 35 69 c6 89 00 20 	xor    DWORD PTR ds:0x89c669,0x20
  4ab4d4:	e8 17 00 f7 ff       	call   0x41b4f0
  4ab4d9:	e9 04 07 00 00       	jmp    0x4abbe2
  4ab4de:	83 35 69 c6 89 00 20 	xor    DWORD PTR ds:0x89c669,0x20
  4ab4e5:	e9 f8 06 00 00       	jmp    0x4abbe2

; commandPausedGuard
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004abbe2 <.text+0xaabe2>:
  4abbe2:	85 ff                	test   edi,edi
  4abbe4:	0f 85 cf 19 00 00    	jne    0x4ad5b9
  4abbea:	f6 05 61 c6 89 00 02 	test   BYTE PTR ds:0x89c661,0x2
  4abbf1:	0f 85 c2 19 00 00    	jne    0x4ad5b9
  4abbf7:	8d 4b f1             	lea    ecx,[ebx-0xf]
  4abbfa:	81 f9 b7 00 00 00    	cmp    ecx,0xb7
  4abc00:	0f 87 b3 19 00 00    	ja     0x4ad5b9
  4abc06:	33 c0                	xor    eax,eax
  4abc08:	8a 81 dc d8 4a 00    	mov    al,BYTE PTR [ecx+0x4ad8dc]
  4abc0e:	ff 24 85 14 d8 4a 00 	jmp    DWORD PTR [eax*4+0x4ad814]

; resultStatisticsOpen
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004abd86 <.text+0xaad86>:
  4abd86:	83 3d 88 d1 89 00 0a 	cmp    DWORD PTR ds:0x89d188,0xa
  4abd8d:	0f 86 26 18 00 00    	jbe    0x4ad5b9
  4abd93:	f6 05 68 c6 89 00 04 	test   BYTE PTR ds:0x89c668,0x4
  4abd9a:	75 43                	jne    0x4abddf
  4abd9c:	83 0d 69 c6 89 00 20 	or     DWORD PTR ds:0x89c669,0x20
  4abda3:	6a 01                	push   0x1
  4abda5:	6a 00                	push   0x0
  4abda7:	6a 08                	push   0x8
  4abda9:	e8 52 e1 fc ff       	call   0x479f00
  4abdae:	83 c4 0c             	add    esp,0xc
  4abdb1:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  4abdb8:	75 15                	jne    0x4abdcf
  4abdba:	66 0f be 05 f0 c6 89 	movsx  ax,BYTE PTR ds:0x89c6f0
  4abdc1:	00
  4abdc2:	6a 01                	push   0x1
  4abdc4:	50                   	push   eax
  4abdc5:	6a 0a                	push   0xa
  4abdc7:	e8 34 e1 fc ff       	call   0x479f00
  4abdcc:	83 c4 0c             	add    esp,0xc
  4abdcf:	e8 cc ec fc ff       	call   0x47aaa0
  4abdd4:	5d                   	pop    ebp
  4abdd5:	5f                   	pop    edi
  4abdd6:	5e                   	pop    esi
  4abdd7:	5b                   	pop    ebx
  4abdd8:	81 c4 3c 03 00 00    	add    esp,0x33c
  4abdde:	c3                   	ret
  4abddf:	e8 0c f7 f6 ff       	call   0x41b4f0
  4abde4:	5d                   	pop    ebp
  4abde5:	5f                   	pop    edi
  4abde6:	5e                   	pop    esi
  4abde7:	5b                   	pop    ebx
  4abde8:	81 c4 3c 03 00 00    	add    esp,0x33c
  4abdee:	c3                   	ret

; resultKeyPredicate
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004ff4f0 <.text+0xfe4f0>:
  4ff4f0:	a1 61 c6 89 00       	mov    eax,ds:0x89c661
  4ff4f5:	25 00 00 00 06       	and    eax,0x6000000
  4ff4fa:	83 f8 01             	cmp    eax,0x1
  4ff4fd:	1b c0                	sbb    eax,eax
  4ff4ff:	40                   	inc    eax
  4ff500:	c3                   	ret
  4ff501:	cc                   	int3
  4ff502:	cc                   	int3
  4ff503:	cc                   	int3
  4ff504:	cc                   	int3
  4ff505:	cc                   	int3
  4ff506:	cc                   	int3
  4ff507:	cc                   	int3
  4ff508:	cc                   	int3
  4ff509:	cc                   	int3
  4ff50a:	cc                   	int3
  4ff50b:	cc                   	int3
  4ff50c:	cc                   	int3
  4ff50d:	cc                   	int3
  4ff50e:	cc                   	int3
  4ff50f:	cc                   	int3
  4ff510:	80 3d 96 8a 98 00 00 	cmp    BYTE PTR ds:0x988a96,0x0
  4ff517:	75 0c                	jne    0x4ff525
  4ff519:	80 3d b6 c5 98 00 00 	cmp    BYTE PTR ds:0x98c5b6,0x0
  4ff520:	75 03                	jne    0x4ff525
  4ff522:	33 c0                	xor    eax,eax
  4ff524:	c3                   	ret
  4ff525:	b8 01 00 00 00       	mov    eax,0x1
  4ff52a:	c3                   	ret
  4ff52b:	cc                   	int3
