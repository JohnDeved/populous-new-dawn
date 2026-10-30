
004aa1c0-004aa4e0.bin:     file format binary


Disassembly of section .data:

004aa1c0 <.data>:
  4aa1c0:	83 ec 04             	sub    esp,0x4
  4aa1c3:	f6 05 6c c6 89 00 08 	test   BYTE PTR ds:0x89c66c,0x8
  4aa1ca:	53                   	push   ebx
  4aa1cb:	56                   	push   esi
  4aa1cc:	57                   	push   edi
  4aa1cd:	55                   	push   ebp
  4aa1ce:	74 0d                	je     0x4aa1dd
  4aa1d0:	b8 01 00 00 00       	mov    eax,0x1
  4aa1d5:	5d                   	pop    ebp
  4aa1d6:	5f                   	pop    edi
  4aa1d7:	5e                   	pop    esi
  4aa1d8:	5b                   	pop    ebx
  4aa1d9:	83 c4 04             	add    esp,0x4
  4aa1dc:	c3                   	ret
  4aa1dd:	b9 01 00 00 00       	mov    ecx,0x1
  4aa1e2:	a0 1c e9 98 00       	mov    al,ds:0x98e91c
  4aa1e7:	88 0d 78 db 5c 00    	mov    BYTE PTR ds:0x5cdb78,cl
  4aa1ed:	a8 03                	test   al,0x3
  4aa1ef:	c6 44 24 13 00       	mov    BYTE PTR [esp+0x13],0x0
  4aa1f4:	74 04                	je     0x4aa1fa
  4aa1f6:	88 4c 24 13          	mov    BYTE PTR [esp+0x13],cl
  4aa1fa:	a8 0c                	test   al,0xc
  4aa1fc:	74 05                	je     0x4aa203
  4aa1fe:	80 4c 24 13 02       	or     BYTE PTR [esp+0x13],0x2
  4aa203:	a8 30                	test   al,0x30
  4aa205:	74 05                	je     0x4aa20c
  4aa207:	80 4c 24 13 04       	or     BYTE PTR [esp+0x13],0x4
  4aa20c:	8b 5c 24 1c          	mov    ebx,DWORD PTR [esp+0x1c]
  4aa210:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  4aa214:	85 db                	test   ebx,ebx
  4aa216:	88 9e 28 e9 98 00    	mov    BYTE PTR [esi+0x98e928],bl
  4aa21c:	74 10                	je     0x4aa22e
  4aa21e:	c6 86 91 45 98 00 01 	mov    BYTE PTR [esi+0x984591],0x1
  4aa225:	c6 86 91 46 98 00 00 	mov    BYTE PTR [esi+0x984691],0x0
  4aa22c:	eb 0e                	jmp    0x4aa23c
  4aa22e:	c6 86 91 45 98 00 00 	mov    BYTE PTR [esi+0x984591],0x0
  4aa235:	c6 86 91 46 98 00 01 	mov    BYTE PTR [esi+0x984691],0x1
  4aa23c:	66 81 3d cf c6 89 00 	cmp    WORD PTR ds:0x89c6cf,0x200
  4aa243:	00 02
  4aa245:	75 2a                	jne    0x4aa271
  4aa247:	66 81 3d d1 c6 89 00 	cmp    WORD PTR ds:0x89c6d1,0x180
  4aa24e:	80 01
  4aa250:	75 25                	jne    0x4aa277
  4aa252:	e8 a9 f6 fe ff       	call   0x499900
  4aa257:	8b 7c 24 20          	mov    edi,DWORD PTR [esp+0x20]
  4aa25b:	85 c0                	test   eax,eax
  4aa25d:	74 1c                	je     0x4aa27b
  4aa25f:	2b 3d 78 90 a6 00    	sub    edi,DWORD PTR ds:0xa69078
  4aa265:	8b 6c 24 24          	mov    ebp,DWORD PTR [esp+0x24]
  4aa269:	2b 2d 7c 90 a6 00    	sub    ebp,DWORD PTR ds:0xa6907c
  4aa26f:	eb 0e                	jmp    0x4aa27f
  4aa271:	8b 7c 24 20          	mov    edi,DWORD PTR [esp+0x20]
  4aa275:	eb 04                	jmp    0x4aa27b
  4aa277:	8b 7c 24 20          	mov    edi,DWORD PTR [esp+0x20]
  4aa27b:	8b 6c 24 24          	mov    ebp,DWORD PTR [esp+0x24]
  4aa27f:	81 fe f0 00 00 00    	cmp    esi,0xf0
  4aa285:	74 15                	je     0x4aa29c
  4aa287:	81 fe f1 00 00 00    	cmp    esi,0xf1
  4aa28d:	74 35                	je     0x4aa2c4
  4aa28f:	81 fe f2 00 00 00    	cmp    esi,0xf2
  4aa295:	74 55                	je     0x4aa2ec
  4aa297:	e9 82 00 00 00       	jmp    0x4aa31e
  4aa29c:	85 db                	test   ebx,ebx
  4aa29e:	74 18                	je     0x4aa2b8
  4aa2a0:	89 3d 78 45 98 00    	mov    DWORD PTR ds:0x984578,edi
  4aa2a6:	89 2d 7c 45 98 00    	mov    DWORD PTR ds:0x98457c,ebp
  4aa2ac:	c7 05 60 45 98 00 01 	mov    DWORD PTR ds:0x984560,0x1
  4aa2b3:	00 00 00
  4aa2b6:	eb 66                	jmp    0x4aa31e
  4aa2b8:	c7 05 6c 45 98 00 01 	mov    DWORD PTR ds:0x98456c,0x1
  4aa2bf:	00 00 00
  4aa2c2:	eb 4e                	jmp    0x4aa312
  4aa2c4:	85 db                	test   ebx,ebx
  4aa2c6:	74 18                	je     0x4aa2e0
  4aa2c8:	89 3d 78 45 98 00    	mov    DWORD PTR ds:0x984578,edi
  4aa2ce:	89 2d 7c 45 98 00    	mov    DWORD PTR ds:0x98457c,ebp
  4aa2d4:	c7 05 68 45 98 00 01 	mov    DWORD PTR ds:0x984568,0x1
  4aa2db:	00 00 00
  4aa2de:	eb 3e                	jmp    0x4aa31e
  4aa2e0:	c7 05 74 45 98 00 01 	mov    DWORD PTR ds:0x984574,0x1
  4aa2e7:	00 00 00
  4aa2ea:	eb 26                	jmp    0x4aa312
  4aa2ec:	85 db                	test   ebx,ebx
  4aa2ee:	74 18                	je     0x4aa308
  4aa2f0:	89 3d 78 45 98 00    	mov    DWORD PTR ds:0x984578,edi
  4aa2f6:	89 2d 7c 45 98 00    	mov    DWORD PTR ds:0x98457c,ebp
  4aa2fc:	c7 05 64 45 98 00 01 	mov    DWORD PTR ds:0x984564,0x1
  4aa303:	00 00 00
  4aa306:	eb 16                	jmp    0x4aa31e
  4aa308:	c7 05 70 45 98 00 01 	mov    DWORD PTR ds:0x984570,0x1
  4aa30f:	00 00 00
  4aa312:	89 3d 88 45 98 00    	mov    DWORD PTR ds:0x984588,edi
  4aa318:	89 2d 8c 45 98 00    	mov    DWORD PTR ds:0x98458c,ebp
  4aa31e:	80 3d 81 bb 89 00 02 	cmp    BYTE PTR ds:0x89bb81,0x2
  4aa325:	0f 84 7f 01 00 00    	je     0x4aa4aa
  4aa32b:	80 3d 81 bb 89 00 03 	cmp    BYTE PTR ds:0x89bb81,0x3
  4aa332:	0f 84 72 01 00 00    	je     0x4aa4aa
  4aa338:	f6 05 6c c6 89 00 10 	test   BYTE PTR ds:0x89c66c,0x10
  4aa33f:	74 56                	je     0x4aa397
  4aa341:	33 c0                	xor    eax,eax
  4aa343:	85 db                	test   ebx,ebx
  4aa345:	0f 84 80 01 00 00    	je     0x4aa4cb
  4aa34b:	f6 05 46 f7 98 00 04 	test   BYTE PTR ds:0x98f746,0x4
  4aa352:	0f 84 73 01 00 00    	je     0x4aa4cb
  4aa358:	80 3d 50 f7 98 00 03 	cmp    BYTE PTR ds:0x98f750,0x3
  4aa35f:	0f 84 66 01 00 00    	je     0x4aa4cb
  4aa365:	a3 10 d1 59 00       	mov    ds:0x59d110,eax
  4aa36a:	b0 01                	mov    al,0x1
  4aa36c:	84 c0                	test   al,al
  4aa36e:	0f 84 57 01 00 00    	je     0x4aa4cb
  4aa374:	e8 87 83 00 00       	call   0x4b2700
  4aa379:	a0 12 f7 98 00       	mov    al,ds:0x98f712
  4aa37e:	6a 02                	push   0x2
  4aa380:	a2 61 d1 89 00       	mov    ds:0x89d161,al
  4aa385:	e8 16 2c ff ff       	call   0x49cfa0
  4aa38a:	83 c4 04             	add    esp,0x4
  4aa38d:	e8 de a3 00 00       	call   0x4b4770
  4aa392:	e9 34 01 00 00       	jmp    0x4aa4cb
  4aa397:	f6 05 69 c6 89 00 20 	test   BYTE PTR ds:0x89c669,0x20
  4aa39e:	74 28                	je     0x4aa3c8
  4aa3a0:	85 db                	test   ebx,ebx
  4aa3a2:	74 24                	je     0x4aa3c8
  4aa3a4:	f6 05 64 c6 89 00 06 	test   BYTE PTR ds:0x89c664,0x6
  4aa3ab:	74 12                	je     0x4aa3bf
  4aa3ad:	83 fe 39             	cmp    esi,0x39
  4aa3b0:	0f 85 15 01 00 00    	jne    0x4aa4cb
  4aa3b6:	55                   	push   ebp
  4aa3b7:	57                   	push   edi
  4aa3b8:	6a 63                	push   0x63
  4aa3ba:	e9 04 01 00 00       	jmp    0x4aa4c3
  4aa3bf:	55                   	push   ebp
  4aa3c0:	57                   	push   edi
  4aa3c1:	6a 63                	push   0x63
  4aa3c3:	e9 fb 00 00 00       	jmp    0x4aa4c3
  4aa3c8:	80 3d 10 e9 98 00 01 	cmp    BYTE PTR ds:0x98e910,0x1
  4aa3cf:	74 09                	je     0x4aa3da
  4aa3d1:	80 3d 10 e9 98 00 02 	cmp    BYTE PTR ds:0x98e910,0x2
  4aa3d8:	75 27                	jne    0x4aa401
  4aa3da:	81 fe f2 00 00 00    	cmp    esi,0xf2
  4aa3e0:	75 1f                	jne    0x4aa401
  4aa3e2:	85 db                	test   ebx,ebx
  4aa3e4:	75 1b                	jne    0x4aa401
  4aa3e6:	8b 44 24 13          	mov    eax,DWORD PTR [esp+0x13]
  4aa3ea:	55                   	push   ebp
  4aa3eb:	57                   	push   edi
  4aa3ec:	8b 0d 6c ce 98 00    	mov    ecx,DWORD PTR ds:0x98ce6c
  4aa3f2:	6a 04                	push   0x4
  4aa3f4:	50                   	push   eax
  4aa3f5:	56                   	push   esi
  4aa3f6:	e8 75 f0 fd ff       	call   0x489470
  4aa3fb:	50                   	push   eax
  4aa3fc:	e9 c2 00 00 00       	jmp    0x4aa4c3
  4aa401:	33 c0                	xor    eax,eax
  4aa403:	89 3d 08 42 68 00    	mov    DWORD PTR ds:0x684208,edi
  4aa409:	a0 18 ea 98 00       	mov    al,ds:0x98ea18
  4aa40e:	89 2d 0c 42 68 00    	mov    DWORD PTR ds:0x68420c,ebp
  4aa414:	a3 80 cd 59 00       	mov    ds:0x59cd80,eax
  4aa419:	33 c0                	xor    eax,eax
  4aa41b:	a0 19 ea 98 00       	mov    al,ds:0x98ea19
  4aa420:	a3 84 cd 59 00       	mov    ds:0x59cd84,eax
  4aa425:	e8 06 0d fa ff       	call   0x44b130
  4aa42a:	e8 31 0c fa ff       	call   0x44b060
  4aa42f:	85 c0                	test   eax,eax
  4aa431:	74 2d                	je     0x4aa460
  4aa433:	80 3d 80 ae 5c 00 ff 	cmp    BYTE PTR ds:0x5cae80,0xff
  4aa43a:	75 24                	jne    0x4aa460
  4aa43c:	80 3d e7 c6 89 00 09 	cmp    BYTE PTR ds:0x89c6e7,0x9
  4aa443:	74 1b                	je     0x4aa460
  4aa445:	80 3d e7 c6 89 00 0f 	cmp    BYTE PTR ds:0x89c6e7,0xf
  4aa44c:	74 12                	je     0x4aa460
  4aa44e:	80 3d 74 ae 5c 00 00 	cmp    BYTE PTR ds:0x5cae74,0x0
  4aa455:	74 74                	je     0x4aa4cb
  4aa457:	f6 05 09 e9 98 00 04 	test   BYTE PTR ds:0x98e909,0x4
  4aa45e:	74 6b                	je     0x4aa4cb
  4aa460:	8b 44 24 13          	mov    eax,DWORD PTR [esp+0x13]
  4aa464:	55                   	push   ebp
  4aa465:	57                   	push   edi
  4aa466:	53                   	push   ebx
  4aa467:	50                   	push   eax
  4aa468:	56                   	push   esi
  4aa469:	e8 d2 6c f8 ff       	call   0x431140
  4aa46e:	83 c4 14             	add    esp,0x14
  4aa471:	84 c0                	test   al,al
  4aa473:	75 56                	jne    0x4aa4cb
  4aa475:	8b 44 24 13          	mov    eax,DWORD PTR [esp+0x13]
  4aa479:	55                   	push   ebp
  4aa47a:	57                   	push   edi
  4aa47b:	53                   	push   ebx
  4aa47c:	50                   	push   eax
  4aa47d:	56                   	push   esi
  4aa47e:	e8 dd 0f fd ff       	call   0x47b460
  4aa483:	83 c4 14             	add    esp,0x14
  4aa486:	84 c0                	test   al,al
  4aa488:	75 41                	jne    0x4aa4cb
  4aa48a:	55                   	push   ebp
  4aa48b:	83 fb 01             	cmp    ebx,0x1
  4aa48e:	1a c0                	sbb    al,al
  4aa490:	57                   	push   edi
  4aa491:	24 03                	and    al,0x3
  4aa493:	8b 4c 24 1b          	mov    ecx,DWORD PTR [esp+0x1b]
  4aa497:	fe c0                	inc    al
  4aa499:	50                   	push   eax
  4aa49a:	51                   	push   ecx
  4aa49b:	56                   	push   esi
  4aa49c:	8b 0d 6c ce 98 00    	mov    ecx,DWORD PTR ds:0x98ce6c
  4aa4a2:	e8 c9 ef fd ff       	call   0x489470
  4aa4a7:	50                   	push   eax
  4aa4a8:	eb 19                	jmp    0x4aa4c3
  4aa4aa:	81 fe f0 00 00 00    	cmp    esi,0xf0
  4aa4b0:	75 19                	jne    0x4aa4cb
  4aa4b2:	85 db                	test   ebx,ebx
  4aa4b4:	75 15                	jne    0x4aa4cb
  4aa4b6:	80 3d 81 bb 89 00 03 	cmp    BYTE PTR ds:0x89bb81,0x3
  4aa4bd:	74 0c                	je     0x4aa4cb
  4aa4bf:	55                   	push   ebp
  4aa4c0:	57                   	push   edi
  4aa4c1:	6a 66                	push   0x66
  4aa4c3:	e8 b8 06 00 00       	call   0x4aab80
  4aa4c8:	83 c4 0c             	add    esp,0xc
  4aa4cb:	b8 01 00 00 00       	mov    eax,0x1
  4aa4d0:	5d                   	pop    ebp
  4aa4d1:	c6 05 78 db 5c 00 00 	mov    BYTE PTR ds:0x5cdb78,0x0
  4aa4d8:	5f                   	pop    edi
  4aa4d9:	5e                   	pop    esi
  4aa4da:	5b                   	pop    ebx
  4aa4db:	83 c4 04             	add    esp,0x4
  4aa4de:	c3                   	ret
  4aa4df:	cc                   	int3
