
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00455410 <.text+0x54410>:
  455410:	68 00 00 00 3f       	push   0x3f000000
  455415:	68 00 00 80 3f       	push   0x3f800000
  45541a:	68 00 00 f0 41       	push   0x41f00000
  45541f:	68 88 95 73 00       	push   0x739588
  455424:	e8 37 00 00 00       	call   0x455460
  455429:	83 c4 10             	add    esp,0x10
  45542c:	68 00 00 00 3f       	push   0x3f000000
  455431:	68 00 00 80 3f       	push   0x3f800000
  455436:	68 00 00 70 42       	push   0x42700000
  45543b:	68 b0 95 73 00       	push   0x7395b0
  455440:	e8 1b 00 00 00       	call   0x455460
  455445:	83 c4 10             	add    esp,0x10
  455448:	e8 c3 01 00 00       	call   0x455610
  45544d:	e8 9e 1e 00 00       	call   0x4572f0
  455452:	e9 b9 03 00 00       	jmp    0x455810
  455457:	cc                   	int3
  455458:	cc                   	int3
  455459:	cc                   	int3
  45545a:	cc                   	int3
  45545b:	cc                   	int3
  45545c:	cc                   	int3
  45545d:	cc                   	int3
  45545e:	cc                   	int3
  45545f:	cc                   	int3
  455460:	8b 4c 24 04          	mov    ecx,DWORD PTR [esp+0x4]
  455464:	83 ec 14             	sub    esp,0x14
  455467:	a1 b0 13 5f 00       	mov    eax,ds:0x5f13b0
  45546c:	56                   	push   esi
  45546d:	57                   	push   edi
  45546e:	39 01                	cmp    DWORD PTR [ecx],eax
  455470:	74 09                	je     0x45547b
  455472:	c7 41 24 01 00 00 00 	mov    DWORD PTR [ecx+0x24],0x1
  455479:	89 01                	mov    DWORD PTR [ecx],eax
  45547b:	83 79 24 01          	cmp    DWORD PTR [ecx+0x24],0x1
  45547f:	74 1d                	je     0x45549e
  455481:	8d 51 04             	lea    edx,[ecx+0x4]
  455484:	8b 41 10             	mov    eax,DWORD PTR [ecx+0x10]
  455487:	8b 71 14             	mov    esi,DWORD PTR [ecx+0x14]
  45548a:	83 c1 10             	add    ecx,0x10
  45548d:	5f                   	pop    edi
  45548e:	89 02                	mov    DWORD PTR [edx],eax
  455490:	8b 49 08             	mov    ecx,DWORD PTR [ecx+0x8]
  455493:	89 72 04             	mov    DWORD PTR [edx+0x4],esi
  455496:	5e                   	pop    esi
  455497:	89 4a 08             	mov    DWORD PTR [edx+0x8],ecx
  45549a:	83 c4 14             	add    esp,0x14
  45549d:	c3                   	ret
  45549e:	33 d2                	xor    edx,edx
  4554a0:	8d 71 04             	lea    esi,[ecx+0x4]
  4554a3:	8d 79 10             	lea    edi,[ecx+0x10]
  4554a6:	d9 06                	fld    DWORD PTR [esi]
  4554a8:	d8 1f                	fcomp  DWORD PTR [edi]
  4554aa:	df e0                	fnstsw ax
  4554ac:	f6 c4 40             	test   ah,0x40
  4554af:	74 24                	je     0x4554d5
  4554b1:	d9 41 14             	fld    DWORD PTR [ecx+0x14]
  4554b4:	d8 59 08             	fcomp  DWORD PTR [ecx+0x8]
  4554b7:	df e0                	fnstsw ax
  4554b9:	f6 c4 40             	test   ah,0x40
  4554bc:	74 17                	je     0x4554d5
  4554be:	d9 41 18             	fld    DWORD PTR [ecx+0x18]
  4554c1:	d8 59 0c             	fcomp  DWORD PTR [ecx+0xc]
  4554c4:	df e0                	fnstsw ax
  4554c6:	f6 c4 40             	test   ah,0x40
  4554c9:	74 0a                	je     0x4554d5
  4554cb:	ba 01 00 00 00       	mov    edx,0x1
  4554d0:	e9 ff 00 00 00       	jmp    0x4555d4
  4554d5:	d9 07                	fld    DWORD PTR [edi]
  4554d7:	d8 26                	fsub   DWORD PTR [esi]
  4554d9:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  4554dd:	d9 41 14             	fld    DWORD PTR [ecx+0x14]
  4554e0:	d8 61 08             	fsub   DWORD PTR [ecx+0x8]
  4554e3:	d9 5c 24 0c          	fstp   DWORD PTR [esp+0xc]
  4554e7:	d9 41 18             	fld    DWORD PTR [ecx+0x18]
  4554ea:	d8 61 0c             	fsub   DWORD PTR [ecx+0xc]
  4554ed:	d9 54 24 10          	fst    DWORD PTR [esp+0x10]
  4554f1:	d8 4c 24 10          	fmul   DWORD PTR [esp+0x10]
  4554f5:	d9 44 24 0c          	fld    DWORD PTR [esp+0xc]
  4554f9:	d8 4c 24 0c          	fmul   DWORD PTR [esp+0xc]
  4554fd:	f7 41 1c ff ff ff 7f 	test   DWORD PTR [ecx+0x1c],0x7fffffff
  455504:	de c1                	faddp  st(1),st
  455506:	d9 44 24 08          	fld    DWORD PTR [esp+0x8]
  45550a:	d8 4c 24 08          	fmul   DWORD PTR [esp+0x8]
  45550e:	de c1                	faddp  st(1),st
  455510:	d9 fa                	fsqrt
  455512:	75 0e                	jne    0x455522
  455514:	d9 5c 24 18          	fstp   DWORD PTR [esp+0x18]
  455518:	c7 44 24 14 20 bc be 	mov    DWORD PTR [esp+0x14],0x4cbebc20
  45551f:	4c 
  455520:	eb 0f                	jmp    0x455531
  455522:	d9 5c 24 18          	fstp   DWORD PTR [esp+0x18]
  455526:	d9 44 24 18          	fld    DWORD PTR [esp+0x18]
  45552a:	d8 71 1c             	fdiv   DWORD PTR [ecx+0x1c]
  45552d:	d9 5c 24 14          	fstp   DWORD PTR [esp+0x14]
  455531:	d9 44 24 14          	fld    DWORD PTR [esp+0x14]
  455535:	d8 1d fc c9 5f 00    	fcomp  DWORD PTR ds:0x5fc9fc
  45553b:	df e0                	fnstsw ax
  45553d:	f6 c4 01             	test   ah,0x1
  455540:	74 0a                	je     0x45554c
  455542:	ba 01 00 00 00       	mov    edx,0x1
  455547:	e9 88 00 00 00       	jmp    0x4555d4
  45554c:	d9 44 24 24          	fld    DWORD PTR [esp+0x24]
  455550:	d8 0d fc c9 5f 00    	fmul   DWORD PTR ds:0x5fc9fc
  455556:	d8 41 20             	fadd   DWORD PTR [ecx+0x20]
  455559:	d9 59 20             	fstp   DWORD PTR [ecx+0x20]
  45555c:	d9 41 20             	fld    DWORD PTR [ecx+0x20]
  45555f:	d8 0d fc c9 5f 00    	fmul   DWORD PTR ds:0x5fc9fc
  455565:	d8 41 1c             	fadd   DWORD PTR [ecx+0x1c]
  455568:	d9 59 1c             	fstp   DWORD PTR [ecx+0x1c]
  45556b:	d9 41 1c             	fld    DWORD PTR [ecx+0x1c]
  45556e:	d8 0d fc c9 5f 00    	fmul   DWORD PTR ds:0x5fc9fc
  455574:	dc 0d c8 f3 58 00    	fmul   QWORD PTR ds:0x58f3c8
  45557a:	d9 e8                	fld1
  45557c:	d8 74 24 18          	fdiv   DWORD PTR [esp+0x18]
  455580:	d9 44 24 08          	fld    DWORD PTR [esp+0x8]
  455584:	d8 c9                	fmul   st,st(1)
  455586:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  45558a:	d9 44 24 0c          	fld    DWORD PTR [esp+0xc]
  45558e:	d8 c9                	fmul   st,st(1)
  455590:	d9 5c 24 0c          	fstp   DWORD PTR [esp+0xc]
  455594:	d8 4c 24 10          	fmul   DWORD PTR [esp+0x10]
  455598:	d9 5c 24 10          	fstp   DWORD PTR [esp+0x10]
  45559c:	d9 44 24 08          	fld    DWORD PTR [esp+0x8]
  4555a0:	d8 c9                	fmul   st,st(1)
  4555a2:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  4555a6:	d9 44 24 0c          	fld    DWORD PTR [esp+0xc]
  4555aa:	d8 c9                	fmul   st,st(1)
  4555ac:	d9 5c 24 0c          	fstp   DWORD PTR [esp+0xc]
  4555b0:	d8 4c 24 10          	fmul   DWORD PTR [esp+0x10]
  4555b4:	d9 5c 24 10          	fstp   DWORD PTR [esp+0x10]
  4555b8:	d9 06                	fld    DWORD PTR [esi]
  4555ba:	d8 44 24 08          	fadd   DWORD PTR [esp+0x8]
  4555be:	d9 1e                	fstp   DWORD PTR [esi]
  4555c0:	d9 41 08             	fld    DWORD PTR [ecx+0x8]
  4555c3:	d8 44 24 0c          	fadd   DWORD PTR [esp+0xc]
  4555c7:	d9 59 08             	fstp   DWORD PTR [ecx+0x8]
  4555ca:	d9 41 0c             	fld    DWORD PTR [ecx+0xc]
  4555cd:	d8 44 24 10          	fadd   DWORD PTR [esp+0x10]
  4555d1:	d9 59 0c             	fstp   DWORD PTR [ecx+0xc]
  4555d4:	85 d2                	test   edx,edx
  4555d6:	74 2a                	je     0x455602
  4555d8:	8b 07                	mov    eax,DWORD PTR [edi]
  4555da:	8b 57 04             	mov    edx,DWORD PTR [edi+0x4]
  4555dd:	d9 41 1c             	fld    DWORD PTR [ecx+0x1c]
  4555e0:	dc 0d d0 f3 58 00    	fmul   QWORD PTR ds:0x58f3d0
  4555e6:	8b 7f 08             	mov    edi,DWORD PTR [edi+0x8]
  4555e9:	89 06                	mov    DWORD PTR [esi],eax
  4555eb:	c7 41 24 02 00 00 00 	mov    DWORD PTR [ecx+0x24],0x2
  4555f2:	c7 41 20 00 00 00 00 	mov    DWORD PTR [ecx+0x20],0x0
  4555f9:	d9 59 1c             	fstp   DWORD PTR [ecx+0x1c]
  4555fc:	89 56 04             	mov    DWORD PTR [esi+0x4],edx
  4555ff:	89 7e 08             	mov    DWORD PTR [esi+0x8],edi
  455602:	5f                   	pop    edi
  455603:	5e                   	pop    esi
  455604:	83 c4 14             	add    esp,0x14
  455607:	c3                   	ret
  455608:	cc                   	int3
  455609:	cc                   	int3
  45560a:	cc                   	int3
  45560b:	cc                   	int3
  45560c:	cc                   	int3
  45560d:	cc                   	int3
  45560e:	cc                   	int3
  45560f:	cc                   	int3
  455610:	a1 8c 95 73 00       	mov    eax,ds:0x73958c
  455615:	b9 8c 95 73 00       	mov    ecx,0x73958c
  45561a:	d9 05 b4 95 73 00    	fld    DWORD PTR ds:0x7395b4
  455620:	d8 25 8c 95 73 00    	fsub   DWORD PTR ds:0x73958c
  455626:	a3 54 95 73 00       	mov    ds:0x739554,eax
  45562b:	ba 54 95 73 00       	mov    edx,0x739554
  455630:	8b 41 04             	mov    eax,DWORD PTR [ecx+0x4]
  455633:	8b 49 08             	mov    ecx,DWORD PTR [ecx+0x8]
  455636:	89 42 04             	mov    DWORD PTR [edx+0x4],eax
  455639:	d9 1d 60 95 73 00    	fstp   DWORD PTR ds:0x739560
  45563f:	d9 05 b8 95 73 00    	fld    DWORD PTR ds:0x7395b8
  455645:	d8 25 90 95 73 00    	fsub   DWORD PTR ds:0x739590
  45564b:	89 4a 08             	mov    DWORD PTR [edx+0x8],ecx
  45564e:	d9                   	.byte 0xd9
  45564f:	1d                   	.byte 0x1d
