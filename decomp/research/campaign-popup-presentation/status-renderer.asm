
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00523200 <.text+0x122200>:
  523200:	81 ec 8c 00 00 00    	sub    esp,0x8c
  523206:	b9 01 00 00 00       	mov    ecx,0x1
  52320b:	66 89 4c 24 00       	mov    WORD PTR [esp+0x0],cx
  523210:	53                   	push   ebx
  523211:	56                   	push   esi
  523212:	33 db                	xor    ebx,ebx
  523214:	f6 05 46 f7 98 00 04 	test   BYTE PTR ds:0x98f746,0x4
  52321b:	57                   	push   edi
  52321c:	55                   	push   ebp
  52321d:	0f 85 31 03 00 00    	jne    0x523554
  523223:	66 33 c0             	xor    ax,ax
  523226:	f6 05 6c c6 89 00 10 	test   BYTE PTR ds:0x89c66c,0x10
  52322d:	74 15                	je     0x523244
  52322f:	66 85 0d ee 22 89 00 	test   WORD PTR ds:0x8922ee,cx
  523236:	75 0c                	jne    0x523244
  523238:	f6 05 b1 c6 89 00 ce 	test   BYTE PTR ds:0x89c6b1,0xce
  52323f:	74 03                	je     0x523244
  523241:	66 8b c1             	mov    ax,cx
  523244:	66 85 c0             	test   ax,ax
  523247:	0f 85 36 02 00 00    	jne    0x523483
  52324d:	f6 05 ee 22 89 00 03 	test   BYTE PTR ds:0x8922ee,0x3
  523254:	0f 84 fa 02 00 00    	je     0x523554
  52325a:	f6 05 ee 22 89 00 01 	test   BYTE PTR ds:0x8922ee,0x1
  523261:	74 1f                	je     0x523282
  523263:	66 ff 0d ec 22 89 00 	dec    WORD PTR ds:0x8922ec
  52326a:	66 83 3d ec 22 89 00 	cmp    WORD PTR ds:0x8922ec,0x0
  523271:	00 
  523272:	7e 07                	jle    0x52327b
  523274:	bb f0 22 89 00       	mov    ebx,0x8922f0
  523279:	eb 0c                	jmp    0x523287
  52327b:	e8 00 78 f5 ff       	call   0x47aa80
  523280:	eb 05                	jmp    0x523287
  523282:	bb 95 23 89 00       	mov    ebx,0x892395
  523287:	85 db                	test   ebx,ebx
  523289:	0f 84 c5 02 00 00    	je     0x523554
  52328f:	f6 03 02             	test   BYTE PTR [ebx],0x2
  523292:	74 0d                	je     0x5232a1
  523294:	80 bb a4 00 00 00 ff 	cmp    BYTE PTR [ebx+0xa4],0xff
  52329b:	0f 85 b3 02 00 00    	jne    0x523554
  5232a1:	8d 6b 02             	lea    ebp,[ebx+0x2]
  5232a4:	e8 67 ff f6 ff       	call   0x493210
  5232a9:	85 c0                	test   eax,eax
  5232ab:	74 09                	je     0x5232b6
  5232ad:	55                   	push   ebp
  5232ae:	e8 dd 04 f3 ff       	call   0x453790
  5232b3:	83 c4 04             	add    esp,0x4
  5232b6:	8a 83 a4 00 00 00    	mov    al,BYTE PTR [ebx+0xa4]
  5232bc:	3c ff                	cmp    al,0xff
  5232be:	74 20                	je     0x5232e0
  5232c0:	0f be c0             	movsx  eax,al
  5232c3:	c1 e0 05             	shl    eax,0x5
  5232c6:	8d 4c 24 1c          	lea    ecx,[esp+0x1c]
  5232ca:	05 a6 4d 89 00       	add    eax,0x894da6
  5232cf:	50                   	push   eax
  5232d0:	68 0c dd 5d 00       	push   0x5ddd0c
  5232d5:	51                   	push   ecx
  5232d6:	e8 e5 82 03 00       	call   0x55b5c0
  5232db:	83 c4 0c             	add    esp,0xc
  5232de:	eb 07                	jmp    0x5232e7
  5232e0:	66 c7 44 24 1c 00 00 	mov    WORD PTR [esp+0x1c],0x0
  5232e7:	e8 24 ff f6 ff       	call   0x493210
  5232ec:	85 c0                	test   eax,eax
  5232ee:	74 19                	je     0x523309
  5232f0:	33 c0                	xor    eax,eax
  5232f2:	a0 d4 28 89 00       	mov    al,ds:0x8928d4
  5232f7:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  5232fe:	51                   	push   ecx
  5232ff:	e8 3c e8 f2 ff       	call   0x451b40
  523304:	83 c4 04             	add    esp,0x4
  523307:	eb 1c                	jmp    0x523325
  523309:	33 c0                	xor    eax,eax
  52330b:	a0 d4 28 89 00       	mov    al,ds:0x8928d4
  523310:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  523317:	51                   	push   ecx
  523318:	68 88 16 59 00       	push   0x591688
  52331d:	e8 0e 3a ff ff       	call   0x516d30
  523322:	83 c4 08             	add    esp,0x8
  523325:	8d 44 24 1c          	lea    eax,[esp+0x1c]
  523329:	50                   	push   eax
  52332a:	e8 01 73 f7 ff       	call   0x49a630
  52332f:	66 be 00 00          	mov    si,0x0
  523333:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  523337:	83 c4 04             	add    esp,0x4
  52333a:	55                   	push   ebp
  52333b:	e8 f0 72 f7 ff       	call   0x49a630
  523340:	83 c4 04             	add    esp,0x4
  523343:	f6 05 ee 22 89 00 04 	test   BYTE PTR ds:0x8922ee,0x4
  52334a:	75 13                	jne    0x52335f
  52334c:	66 8b 35 cf c6 89 00 	mov    si,WORD PTR ds:0x89c6cf
  523353:	66 2b f0             	sub    si,ax
  523356:	66 2b 74 24 14       	sub    si,WORD PTR [esp+0x14]
  52335b:	66 83 ee 02          	sub    si,0x2
  52335f:	e8 ac fe f6 ff       	call   0x493210
  523364:	66 8b 3d d1 c6 89 00 	mov    di,WORD PTR ds:0x89c6d1
  52336b:	6a 41                	push   0x41
  52336d:	85 c0                	test   eax,eax
  52336f:	74 07                	je     0x523378
  523371:	e8 7a f4 f2 ff       	call   0x4527f0
  523376:	eb 05                	jmp    0x52337d
  523378:	e8 c3 47 00 00       	call   0x527b40
  52337d:	66 2b f8             	sub    di,ax
  523380:	83 c4 04             	add    esp,0x4
  523383:	33 c0                	xor    eax,eax
  523385:	a0 f6 c6 89 00       	mov    al,ds:0x89c6f6
  52338a:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  52338e:	33 c0                	xor    eax,eax
  523390:	f6 03 01             	test   BYTE PTR [ebx],0x1
  523393:	a0 f9 c6 89 00       	mov    al,ds:0x89c6f9
  523398:	74 1b                	je     0x5233b5
  52339a:	80 3d 87 79 89 00 00 	cmp    BYTE PTR ds:0x897987,0x0
  5233a1:	74 12                	je     0x5233b5
  5233a3:	66 c7 44 24 10 00 00 	mov    WORD PTR [esp+0x10],0x0
  5233aa:	33 c0                	xor    eax,eax
  5233ac:	a0 f4 c6 89 00       	mov    al,ds:0x89c6f4
  5233b1:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  5233b5:	66 83 7c 24 10 00    	cmp    WORD PTR [esp+0x10],0x0
  5233bb:	0f 84 93 01 00 00    	je     0x523554
  5233c1:	83 7c 24 14 00       	cmp    DWORD PTR [esp+0x14],0x0
  5233c6:	74 50                	je     0x523418
  5233c8:	a2 9c 48 98 00       	mov    ds:0x98489c,al
  5233cd:	e8 3e fe f6 ff       	call   0x493210
  5233d2:	85 c0                	test   eax,eax
  5233d4:	74 17                	je     0x5233ed
  5233d6:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  5233db:	8d 4c 24 1c          	lea    ecx,[esp+0x1c]
  5233df:	50                   	push   eax
  5233e0:	51                   	push   ecx
  5233e1:	57                   	push   edi
  5233e2:	56                   	push   esi
  5233e3:	e8 b8 e7 f2 ff       	call   0x451ba0
  5233e8:	83 c4 10             	add    esp,0x10
  5233eb:	eb 2b                	jmp    0x523418
  5233ed:	83 ec 08             	sub    esp,0x8
  5233f0:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  5233f5:	89 64 24 18          	mov    DWORD PTR [esp+0x18],esp
  5233f9:	50                   	push   eax
  5233fa:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  5233fe:	e8 6d 2b ef ff       	call   0x415f70
  523403:	0f bf cf             	movsx  ecx,di
  523406:	0f bf d6             	movsx  edx,si
  523409:	8d 44 24 24          	lea    eax,[esp+0x24]
  52340d:	50                   	push   eax
  52340e:	51                   	push   ecx
  52340f:	52                   	push   edx
  523410:	e8 4b 45 00 00       	call   0x527960
  523415:	83 c4 14             	add    esp,0x14
  523418:	8a 44 24 18          	mov    al,BYTE PTR [esp+0x18]
  52341c:	a2 9c 48 98 00       	mov    ds:0x98489c,al
  523421:	e8 ea fd f6 ff       	call   0x493210
  523426:	85 c0                	test   eax,eax
  523428:	74 23                	je     0x52344d
  52342a:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  52342f:	50                   	push   eax
  523430:	55                   	push   ebp
  523431:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  523435:	57                   	push   edi
  523436:	66 03 c6             	add    ax,si
  523439:	50                   	push   eax
  52343a:	e8 61 e7 f2 ff       	call   0x451ba0
  52343f:	83 c4 10             	add    esp,0x10
  523442:	5d                   	pop    ebp
  523443:	5f                   	pop    edi
  523444:	5e                   	pop    esi
  523445:	5b                   	pop    ebx
  523446:	81 c4 8c 00 00 00    	add    esp,0x8c
  52344c:	c3                   	ret
  52344d:	83 ec 08             	sub    esp,0x8
  523450:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  523455:	89 64 24 18          	mov    DWORD PTR [esp+0x18],esp
  523459:	50                   	push   eax
  52345a:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  52345e:	e8 0d 2b ef ff       	call   0x415f70
  523463:	0f bf c7             	movsx  eax,di
  523466:	55                   	push   ebp
  523467:	50                   	push   eax
  523468:	0f bf c6             	movsx  eax,si
  52346b:	03 44 24 24          	add    eax,DWORD PTR [esp+0x24]
  52346f:	50                   	push   eax
  523470:	e8 eb 44 00 00       	call   0x527960
  523475:	83 c4 14             	add    esp,0x14
  523478:	5d                   	pop    ebp
  523479:	5f                   	pop    edi
  52347a:	5e                   	pop    esi
  52347b:	5b                   	pop    ebx
  52347c:	81 c4 8c 00 00 00    	add    esp,0x8c
  523482:	c3                   	ret
  523483:	e8 88 fd f6 ff       	call   0x493210
  523488:	85 c0                	test   eax,eax
  52348a:	74 19                	je     0x5234a5
  52348c:	33 c0                	xor    eax,eax
  52348e:	a0 d4 28 89 00       	mov    al,ds:0x8928d4
  523493:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  52349a:	51                   	push   ecx
  52349b:	e8 a0 e6 f2 ff       	call   0x451b40
  5234a0:	83 c4 04             	add    esp,0x4
  5234a3:	eb 1c                	jmp    0x5234c1
  5234a5:	33 c0                	xor    eax,eax
  5234a7:	a0 d4 28 89 00       	mov    al,ds:0x8928d4
  5234ac:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  5234b3:	51                   	push   ecx
  5234b4:	68 88 16 59 00       	push   0x591688
  5234b9:	e8 72 38 ff ff       	call   0x516d30
  5234be:	83 c4 08             	add    esp,0x8
  5234c1:	66 8b 1d cf c6 89 00 	mov    bx,WORD PTR ds:0x89c6cf
  5234c8:	8b 3d e4 2f 97 00    	mov    edi,DWORD PTR ds:0x972fe4
  5234ce:	57                   	push   edi
  5234cf:	e8 5c 71 f7 ff       	call   0x49a630
  5234d4:	66 2b d8             	sub    bx,ax
  5234d7:	83 c4 04             	add    esp,0x4
  5234da:	e8 31 fd f6 ff       	call   0x493210
  5234df:	66 8b 35 d1 c6 89 00 	mov    si,WORD PTR ds:0x89c6d1
  5234e6:	6a 41                	push   0x41
  5234e8:	85 c0                	test   eax,eax
  5234ea:	74 07                	je     0x5234f3
  5234ec:	e8 ff f2 f2 ff       	call   0x4527f0
  5234f1:	eb 05                	jmp    0x5234f8
  5234f3:	e8 48 46 00 00       	call   0x527b40
  5234f8:	66 2b f0             	sub    si,ax
  5234fb:	83 c4 04             	add    esp,0x4
  5234fe:	a0 f4 c6 89 00       	mov    al,ds:0x89c6f4
  523503:	a2 9c 48 98 00       	mov    ds:0x98489c,al
  523508:	e8 03 fd f6 ff       	call   0x493210
  52350d:	85 c0                	test   eax,eax
  52350f:	74 1c                	je     0x52352d
  523511:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  523516:	50                   	push   eax
  523517:	57                   	push   edi
  523518:	56                   	push   esi
  523519:	53                   	push   ebx
  52351a:	e8 81 e6 f2 ff       	call   0x451ba0
  52351f:	83 c4 10             	add    esp,0x10
  523522:	5d                   	pop    ebp
  523523:	5f                   	pop    edi
  523524:	5e                   	pop    esi
  523525:	5b                   	pop    ebx
  523526:	81 c4 8c 00 00 00    	add    esp,0x8c
  52352c:	c3                   	ret
  52352d:	83 ec 08             	sub    esp,0x8
  523530:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  523535:	89 64 24 18          	mov    DWORD PTR [esp+0x18],esp
  523539:	50                   	push   eax
  52353a:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  52353e:	e8 2d 2a ef ff       	call   0x415f70
  523543:	0f bf c6             	movsx  eax,si
  523546:	0f bf cb             	movsx  ecx,bx
  523549:	57                   	push   edi
  52354a:	50                   	push   eax
  52354b:	51                   	push   ecx
  52354c:	e8 0f 44 00 00       	call   0x527960
  523551:	83 c4 14             	add    esp,0x14
  523554:	5d                   	pop    ebp
  523555:	5f                   	pop    edi
  523556:	5e                   	pop    esi
  523557:	5b                   	pop    ebx
  523558:	81 c4 8c 00 00 00    	add    esp,0x8c
  52355e:	c3                   	ret
