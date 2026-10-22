
00489470-00489520.bin:     file format binary


Disassembly of section .data:

00489470 <.data>:
  489470:	53                   	push   ebx
  489471:	33 c0                	xor    eax,eax
  489473:	8a 44 24 08          	mov    al,BYTE PTR [esp+0x8]
  489477:	56                   	push   esi
  489478:	57                   	push   edi
  489479:	55                   	push   ebp
  48947a:	8b 34 81             	mov    esi,DWORD PTR [ecx+eax*4]
  48947d:	85 f6                	test   esi,esi
  48947f:	74 7d                	je     0x4894fe
  489481:	bf 08 00 00 00       	mov    edi,0x8
  489486:	bd 04 00 00 00       	mov    ebp,0x4
  48948b:	8a 46 04             	mov    al,BYTE PTR [esi+0x4]
  48948e:	24 05                	and    al,0x5
  489490:	3a 44 24 1c          	cmp    al,BYTE PTR [esp+0x1c]
  489494:	75 61                	jne    0x4894f7
  489496:	8a 46 05             	mov    al,BYTE PTR [esi+0x5]
  489499:	8a c8                	mov    cl,al
  48949b:	8a d8                	mov    bl,al
  48949d:	80 e1 38             	and    cl,0x38
  4894a0:	c0 e9 03             	shr    cl,0x3
  4894a3:	8a d1                	mov    dl,cl
  4894a5:	0a d9                	or     bl,cl
  4894a7:	0a 54 24 18          	or     dl,BYTE PTR [esp+0x18]
  4894ab:	80 e3 07             	and    bl,0x7
  4894ae:	80 e2 07             	and    dl,0x7
  4894b1:	a8 40                	test   al,0x40
  4894b3:	75 04                	jne    0x4894b9
  4894b5:	3a da                	cmp    bl,dl
  4894b7:	75 3e                	jne    0x4894f7
  4894b9:	85 3d 61 c6 89 00    	test   DWORD PTR ds:0x89c661,edi
  4894bf:	74 1a                	je     0x4894db
  4894c1:	a1 f5 4c 89 00       	mov    eax,ds:0x894cf5
  4894c6:	8d 14 80             	lea    edx,[eax+eax*4]
  4894c9:	8d 04 90             	lea    eax,[eax+edx*4]
  4894cc:	85 2c 45 ff 4c 89 00 	test   DWORD PTR [eax*2+0x894cff],ebp
  4894d3:	74 06                	je     0x4894db
  4894d5:	f6 46 0a 01          	test   BYTE PTR [esi+0xa],0x1
  4894d9:	74 1c                	je     0x4894f7
  4894db:	f6 46 0a 02          	test   BYTE PTR [esi+0xa],0x2
  4894df:	74 09                	je     0x4894ea
  4894e1:	f6 05 62 c6 89 00 80 	test   BYTE PTR ds:0x89c662,0x80
  4894e8:	74 0d                	je     0x4894f7
  4894ea:	8b 46 06             	mov    eax,DWORD PTR [esi+0x6]
  4894ed:	85 c0                	test   eax,eax
  4894ef:	74 16                	je     0x489507
  4894f1:	ff d0                	call   eax
  4894f3:	85 c0                	test   eax,eax
  4894f5:	75 19                	jne    0x489510
  4894f7:	8b 76 0b             	mov    esi,DWORD PTR [esi+0xb]
  4894fa:	85 f6                	test   esi,esi
  4894fc:	75 8d                	jne    0x48948b
  4894fe:	33 c0                	xor    eax,eax
  489500:	5d                   	pop    ebp
  489501:	5f                   	pop    edi
  489502:	5e                   	pop    esi
  489503:	5b                   	pop    ebx
  489504:	c2 0c 00             	ret    0xc
  489507:	8b 06                	mov    eax,DWORD PTR [esi]
  489509:	5d                   	pop    ebp
  48950a:	5f                   	pop    edi
  48950b:	5e                   	pop    esi
  48950c:	5b                   	pop    ebx
  48950d:	c2 0c 00             	ret    0xc
  489510:	8b 06                	mov    eax,DWORD PTR [esi]
  489512:	5d                   	pop    ebp
  489513:	5f                   	pop    edi
  489514:	5e                   	pop    esi
  489515:	5b                   	pop    ebx
  489516:	c2 0c 00             	ret    0xc
  489519:	cc                   	int3
  48951a:	cc                   	int3
  48951b:	cc                   	int3
  48951c:	cc                   	int3
  48951d:	cc                   	int3
  48951e:	cc                   	int3
  48951f:	cc                   	int3
