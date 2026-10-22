
00489300-00489470.bin:     file format binary


Disassembly of section .data:

00489300 <.data>:
  489300:	83 ec 04             	sub    esp,0x4
  489303:	33 c0                	xor    eax,eax
  489305:	53                   	push   ebx
  489306:	56                   	push   esi
  489307:	57                   	push   edi
  489308:	8b f1                	mov    esi,ecx
  48930a:	55                   	push   ebp
  48930b:	8b fe                	mov    edi,esi
  48930d:	b9 00 01 00 00       	mov    ecx,0x100
  489312:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  489314:	8b 7c 24 18          	mov    edi,DWORD PTR [esp+0x18]
  489318:	89 86 00 04 00 00    	mov    DWORD PTR [esi+0x400],eax
  48931e:	38 07                	cmp    BYTE PTR [edi],al
  489320:	0f 84 de 00 00 00    	je     0x489404
  489326:	8a 4f 05             	mov    cl,BYTE PTR [edi+0x5]
  489329:	33 c0                	xor    eax,eax
  48932b:	80 e1 18             	and    cl,0x18
  48932e:	8a c1                	mov    al,cl
  489330:	83 f8 08             	cmp    eax,0x8
  489333:	74 07                	je     0x48933c
  489335:	83 f8 10             	cmp    eax,0x10
  489338:	74 0a                	je     0x489344
  48933a:	eb 1a                	jmp    0x489356
  48933c:	8a 0f                	mov    cl,BYTE PTR [edi]
  48933e:	88 4c 24 13          	mov    BYTE PTR [esp+0x13],cl
  489342:	eb 12                	jmp    0x489356
  489344:	8a 07                	mov    al,BYTE PTR [edi]
  489346:	8b 0d 50 05 5f 00    	mov    ecx,DWORD PTR ds:0x5f0550
  48934c:	50                   	push   eax
  48934d:	e8 3e 87 f7 ff       	call   0x401a90
  489352:	88 44 24 13          	mov    BYTE PTR [esp+0x13],al
  489356:	6a 0f                	push   0xf
  489358:	e8 43 19 0d 00       	call   0x55aca0
  48935d:	83 c4 04             	add    esp,0x4
  489360:	85 c0                	test   eax,eax
  489362:	0f 84 90 00 00 00    	je     0x4893f8
  489368:	8b 4f 01             	mov    ecx,DWORD PTR [edi+0x1]
  48936b:	89 08                	mov    DWORD PTR [eax],ecx
  48936d:	8a 57 06             	mov    dl,BYTE PTR [edi+0x6]
  489370:	88 50 05             	mov    BYTE PTR [eax+0x5],dl
  489373:	8a 5f 07             	mov    bl,BYTE PTR [edi+0x7]
  489376:	88 58 0a             	mov    BYTE PTR [eax+0xa],bl
  489379:	8b 4f 08             	mov    ecx,DWORD PTR [edi+0x8]
  48937c:	89 48 06             	mov    DWORD PTR [eax+0x6],ecx
  48937f:	8a 57 05             	mov    dl,BYTE PTR [edi+0x5]
  489382:	88 50 04             	mov    BYTE PTR [eax+0x4],dl
  489385:	c7 40 0b 00 00 00 00 	mov    DWORD PTR [eax+0xb],0x0
  48938c:	f6 40 04 02          	test   BYTE PTR [eax+0x4],0x2
  489390:	74 37                	je     0x4893c9
  489392:	8a 4c 24 13          	mov    cl,BYTE PTR [esp+0x13]
  489396:	33 d2                	xor    edx,edx
  489398:	88 48 04             	mov    BYTE PTR [eax+0x4],cl
  48939b:	8b 8e 00 04 00 00    	mov    ecx,DWORD PTR [esi+0x400]
  4893a1:	3b ca                	cmp    ecx,edx
  4893a3:	75 08                	jne    0x4893ad
  4893a5:	89 86 00 04 00 00    	mov    DWORD PTR [esi+0x400],eax
  4893ab:	eb 4b                	jmp    0x4893f8
  4893ad:	8d 69 0b             	lea    ebp,[ecx+0xb]
  4893b0:	8b 5d 00             	mov    ebx,DWORD PTR [ebp+0x0]
  4893b3:	85 db                	test   ebx,ebx
  4893b5:	74 04                	je     0x4893bb
  4893b7:	8b cb                	mov    ecx,ebx
  4893b9:	eb 08                	jmp    0x4893c3
  4893bb:	ba 01 00 00 00       	mov    edx,0x1
  4893c0:	89 45 00             	mov    DWORD PTR [ebp+0x0],eax
  4893c3:	85 d2                	test   edx,edx
  4893c5:	74 e6                	je     0x4893ad
  4893c7:	eb 2f                	jmp    0x4893f8
  4893c9:	33 d2                	xor    edx,edx
  4893cb:	33 c9                	xor    ecx,ecx
  4893cd:	8a 4c 24 13          	mov    cl,BYTE PTR [esp+0x13]
  4893d1:	8d 0c 8e             	lea    ecx,[esi+ecx*4]
  4893d4:	8b 19                	mov    ebx,DWORD PTR [ecx]
  4893d6:	3b da                	cmp    ebx,edx
  4893d8:	75 04                	jne    0x4893de
  4893da:	89 01                	mov    DWORD PTR [ecx],eax
  4893dc:	eb 1a                	jmp    0x4893f8
  4893de:	8d 6b 0b             	lea    ebp,[ebx+0xb]
  4893e1:	8b 4d 00             	mov    ecx,DWORD PTR [ebp+0x0]
  4893e4:	85 c9                	test   ecx,ecx
  4893e6:	74 04                	je     0x4893ec
  4893e8:	8b d9                	mov    ebx,ecx
  4893ea:	eb 08                	jmp    0x4893f4
  4893ec:	ba 01 00 00 00       	mov    edx,0x1
  4893f1:	89 45 00             	mov    DWORD PTR [ebp+0x0],eax
  4893f4:	85 d2                	test   edx,edx
  4893f6:	74 e6                	je     0x4893de
  4893f8:	83 c7 0c             	add    edi,0xc
  4893fb:	80 3f 00             	cmp    BYTE PTR [edi],0x0
  4893fe:	0f 85 22 ff ff ff    	jne    0x489326
  489404:	8b c6                	mov    eax,esi
  489406:	5d                   	pop    ebp
  489407:	5f                   	pop    edi
  489408:	5e                   	pop    esi
  489409:	5b                   	pop    ebx
  48940a:	83 c4 04             	add    esp,0x4
  48940d:	c2 04 00             	ret    0x4
  489410:	53                   	push   ebx
  489411:	56                   	push   esi
  489412:	8b f1                	mov    esi,ecx
  489414:	57                   	push   edi
  489415:	55                   	push   ebp
  489416:	8b d9                	mov    ebx,ecx
  489418:	bd 00 01 00 00       	mov    ebp,0x100
  48941d:	83 3e 00             	cmp    DWORD PTR [esi],0x0
  489420:	74 14                	je     0x489436
  489422:	8b 06                	mov    eax,DWORD PTR [esi]
  489424:	50                   	push   eax
  489425:	8b 78 0b             	mov    edi,DWORD PTR [eax+0xb]
  489428:	e8 23 19 0d 00       	call   0x55ad50
  48942d:	83 c4 04             	add    esp,0x4
  489430:	89 3e                	mov    DWORD PTR [esi],edi
  489432:	85 ff                	test   edi,edi
  489434:	75 ec                	jne    0x489422
  489436:	83 c6 04             	add    esi,0x4
  489439:	4d                   	dec    ebp
  48943a:	75 e1                	jne    0x48941d
  48943c:	83 bb 00 04 00 00 00 	cmp    DWORD PTR [ebx+0x400],0x0
  489443:	74 1c                	je     0x489461
  489445:	8b 83 00 04 00 00    	mov    eax,DWORD PTR [ebx+0x400]
  48944b:	50                   	push   eax
  48944c:	8b 70 0b             	mov    esi,DWORD PTR [eax+0xb]
  48944f:	e8 fc 18 0d 00       	call   0x55ad50
  489454:	83 c4 04             	add    esp,0x4
  489457:	89 b3 00 04 00 00    	mov    DWORD PTR [ebx+0x400],esi
  48945d:	85 f6                	test   esi,esi
  48945f:	75 e4                	jne    0x489445
  489461:	5d                   	pop    ebp
  489462:	5f                   	pop    edi
  489463:	5e                   	pop    esi
  489464:	5b                   	pop    ebx
  489465:	c3                   	ret
  489466:	cc                   	int3
  489467:	cc                   	int3
  489468:	cc                   	int3
  489469:	cc                   	int3
  48946a:	cc                   	int3
  48946b:	cc                   	int3
  48946c:	cc                   	int3
  48946d:	cc                   	int3
  48946e:	cc                   	int3
  48946f:	cc                   	int3
