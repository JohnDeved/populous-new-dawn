
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00412230 <.text+0x11230>:
  412230:	83 ec 1c             	sub    esp,0x1c
  412233:	f6 05 f4 c9 5f 00 04 	test   BYTE PTR ds:0x5fc9f4,0x4
  41223a:	53                   	push   ebx
  41223b:	56                   	push   esi
  41223c:	57                   	push   edi
  41223d:	55                   	push   ebp
  41223e:	74 4f                	je     0x41228f
  412240:	f6 05 04 ca 5f 00 01 	test   BYTE PTR ds:0x5fca04,0x1
  412247:	75 16                	jne    0x41225f
  412249:	80 0d 04 ca 5f 00 01 	or     BYTE PTR ds:0x5fca04,0x1
  412250:	8b 35 84 c7 d0 00    	mov    esi,DWORD PTR ds:0xd0c784
  412256:	ff d6                	call   esi
  412258:	a3 00 ca 5f 00       	mov    ds:0x5fca00,eax
  41225d:	eb 06                	jmp    0x412265
  41225f:	8b 35 84 c7 d0 00    	mov    esi,DWORD PTR ds:0xd0c784
  412265:	83 3d b4 13 5f 00 00 	cmp    DWORD PTR ds:0x5f13b4,0x0
  41226c:	7e 1a                	jle    0x412288
  41226e:	ff d6                	call   esi
  412270:	8b 0d 00 ca 5f 00    	mov    ecx,DWORD PTR ds:0x5fca00
  412276:	81 c1 c8 00 00 00    	add    ecx,0xc8
  41227c:	3b c8                	cmp    ecx,eax
  41227e:	73 0f                	jae    0x41228f
  412280:	ff 0d b4 13 5f 00    	dec    DWORD PTR ds:0x5f13b4
  412286:	eb 07                	jmp    0x41228f
  412288:	83 0d f4 c9 5f 00 08 	or     DWORD PTR ds:0x5fc9f4,0x8
  41228f:	a1 a8 13 5f 00       	mov    eax,ds:0x5f13a8
  412294:	33 f6                	xor    esi,esi
  412296:	50                   	push   eax
  412297:	e8 04 03 00 00       	call   0x4125a0
  41229c:	83 c4 04             	add    esp,0x4
  41229f:	8b 3d c4 13 5f 00    	mov    edi,DWORD PTR ds:0x5f13c4
  4122a5:	39 35 c0 13 5f 00    	cmp    DWORD PTR ds:0x5f13c0,esi
  4122ab:	0f 8e 1e 01 00 00    	jle    0x4123cf
  4122b1:	8b 47 10             	mov    eax,DWORD PTR [edi+0x10]
  4122b4:	c7 40 18 00 00 00 00 	mov    DWORD PTR [eax+0x18],0x0
  4122bb:	33 c0                	xor    eax,eax
  4122bd:	8b 5f 04             	mov    ebx,DWORD PTR [edi+0x4]
  4122c0:	3b d8                	cmp    ebx,eax
  4122c2:	7e 2f                	jle    0x4122f3
  4122c4:	8b 4f 08             	mov    ecx,DWORD PTR [edi+0x8]
  4122c7:	8b 11                	mov    edx,DWORD PTR [ecx]
  4122c9:	39 15 ac 13 5f 00    	cmp    DWORD PTR ds:0x5f13ac,edx
  4122cf:	7c 0c                	jl     0x4122dd
  4122d1:	74 16                	je     0x4122e9
  4122d3:	83 c1 04             	add    ecx,0x4
  4122d6:	40                   	inc    eax
  4122d7:	3b c3                	cmp    eax,ebx
  4122d9:	7c ec                	jl     0x4122c7
  4122db:	eb 16                	jmp    0x4122f3
  4122dd:	8b 47 10             	mov    eax,DWORD PTR [edi+0x10]
  4122e0:	c7 40 18 01 00 00 00 	mov    DWORD PTR [eax+0x18],0x1
  4122e7:	eb 0a                	jmp    0x4122f3
  4122e9:	8b 47 10             	mov    eax,DWORD PTR [edi+0x10]
  4122ec:	c7 40 18 02 00 00 00 	mov    DWORD PTR [eax+0x18],0x2
  4122f3:	8b 07                	mov    eax,DWORD PTR [edi]
  4122f5:	85 c0                	test   eax,eax
  4122f7:	7d 02                	jge    0x4122fb
  4122f9:	33 c0                	xor    eax,eax
  4122fb:	8d 14 40             	lea    edx,[eax+eax*2]
  4122fe:	8d 4c 24 20          	lea    ecx,[esp+0x20]
  412302:	8d 14 90             	lea    edx,[eax+edx*4]
  412305:	c1 e2 02             	shl    edx,0x2
  412308:	03 15 bc 13 5f 00    	add    edx,DWORD PTR ds:0x5f13bc
  41230e:	8b 42 1c             	mov    eax,DWORD PTR [edx+0x1c]
  412311:	8b 5a 20             	mov    ebx,DWORD PTR [edx+0x20]
  412314:	83 c2 1c             	add    edx,0x1c
  412317:	89 01                	mov    DWORD PTR [ecx],eax
  412319:	dd 05 48 f0 58 00    	fld    QWORD PTR ds:0x58f048
  41231f:	8b 52 08             	mov    edx,DWORD PTR [edx+0x8]
  412322:	8b 47 10             	mov    eax,DWORD PTR [edi+0x10]
  412325:	89 59 04             	mov    DWORD PTR [ecx+0x4],ebx
  412328:	8b 40 04             	mov    eax,DWORD PTR [eax+0x4]
  41232b:	33 db                	xor    ebx,ebx
  41232d:	89 51 08             	mov    DWORD PTR [ecx+0x8],edx
  412330:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  412334:	85 c0                	test   eax,eax
  412336:	da 74 24 10          	fidiv  DWORD PTR [esp+0x10]
  41233a:	d9 5c 24 10          	fstp   DWORD PTR [esp+0x10]
  41233e:	7e 7f                	jle    0x4123bf
  412340:	d9 44 24 10          	fld    DWORD PTR [esp+0x10]
  412344:	d8 0d 64 f0 58 00    	fmul   DWORD PTR ds:0x58f064
  41234a:	d9 54 24 10          	fst    DWORD PTR [esp+0x10]
  41234e:	33 ed                	xor    ebp,ebp
  412350:	89 5c 24 1c          	mov    DWORD PTR [esp+0x1c],ebx
  412354:	d9 44 24 1c          	fld    DWORD PTR [esp+0x1c]
  412358:	eb 02                	jmp    0x41235c
  41235a:	dd d9                	fstp   st(1)
  41235c:	d9 c0                	fld    st(0)
  41235e:	83 c5 0c             	add    ebp,0xc
  412361:	e8 ee 98 14 00       	call   0x55bc54
  412366:	d9 04 85 a8 15 5f 00 	fld    DWORD PTR [eax*4+0x5f15a8]
  41236d:	d8 4f 0c             	fmul   DWORD PTR [edi+0xc]
  412370:	8d 0c 85 00 00 00 00 	lea    ecx,[eax*4+0x0]
  412377:	43                   	inc    ebx
  412378:	8b 47 10             	mov    eax,DWORD PTR [edi+0x10]
  41237b:	d8 44 24 20          	fadd   DWORD PTR [esp+0x20]
  41237f:	8b 50 08             	mov    edx,DWORD PTR [eax+0x8]
  412382:	d9 5c 2a f4          	fstp   DWORD PTR [edx+ebp*1-0xc]
  412386:	8b 47 10             	mov    eax,DWORD PTR [edi+0x10]
  412389:	8b 50 08             	mov    edx,DWORD PTR [eax+0x8]
  41238c:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  412390:	89 44 2a f8          	mov    DWORD PTR [edx+ebp*1-0x8],eax
  412394:	d9 81 a8 6f 5f 00    	fld    DWORD PTR [ecx+0x5f6fa8]
  41239a:	d8 4f 0c             	fmul   DWORD PTR [edi+0xc]
  41239d:	8b 4f 10             	mov    ecx,DWORD PTR [edi+0x10]
  4123a0:	d8 44 24 28          	fadd   DWORD PTR [esp+0x28]
  4123a4:	8b 51 08             	mov    edx,DWORD PTR [ecx+0x8]
  4123a7:	d9 5c 2a fc          	fstp   DWORD PTR [edx+ebp*1-0x4]
  4123ab:	d9 c0                	fld    st(0)
  4123ad:	d8 c2                	fadd   st,st(2)
  4123af:	8b 4f 10             	mov    ecx,DWORD PTR [edi+0x10]
  4123b2:	39 59 04             	cmp    DWORD PTR [ecx+0x4],ebx
  4123b5:	7f a3                	jg     0x41235a
  4123b7:	dd d9                	fstp   st(1)
  4123b9:	d9 5c 24 1c          	fstp   DWORD PTR [esp+0x1c]
  4123bd:	dd d8                	fstp   st(0)
  4123bf:	46                   	inc    esi
  4123c0:	83 c7 18             	add    edi,0x18
  4123c3:	39 35 c0 13 5f 00    	cmp    DWORD PTR ds:0x5f13c0,esi
  4123c9:	0f 8f e2 fe ff ff    	jg     0x4122b1
  4123cf:	8b 0d a8 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13a8
  4123d5:	8d 14 49             	lea    edx,[ecx+ecx*2]
  4123d8:	8d 0c 91             	lea    ecx,[ecx+edx*4]
  4123db:	8d 54 24 20          	lea    edx,[esp+0x20]
  4123df:	c1 e1 02             	shl    ecx,0x2
  4123e2:	03 0d bc 13 5f 00    	add    ecx,DWORD PTR ds:0x5f13bc
  4123e8:	8b 41 1c             	mov    eax,DWORD PTR [ecx+0x1c]
  4123eb:	8b 59 20             	mov    ebx,DWORD PTR [ecx+0x20]
  4123ee:	83 c1 1c             	add    ecx,0x1c
  4123f1:	89 02                	mov    DWORD PTR [edx],eax
  4123f3:	89 5a 04             	mov    DWORD PTR [edx+0x4],ebx
  4123f6:	8b 49 08             	mov    ecx,DWORD PTR [ecx+0x8]
  4123f9:	89 4a 08             	mov    DWORD PTR [edx+0x8],ecx
  4123fc:	8b 15 b0 13 5f 00    	mov    edx,DWORD PTR ds:0x5f13b0
  412402:	8d 0c 52             	lea    ecx,[edx+edx*2]
  412405:	8d 14 8a             	lea    edx,[edx+ecx*4]
  412408:	b9 c0 95 73 00       	mov    ecx,0x7395c0
  41240d:	c1 e2 02             	shl    edx,0x2
  412410:	03 15 bc 13 5f 00    	add    edx,DWORD PTR ds:0x5f13bc
  412416:	83 c2 1c             	add    edx,0x1c
  412419:	c7 44 24 1c 00 00 16 	mov    DWORD PTR [esp+0x1c],0x43160000
  412420:	43 
  412421:	8b 02                	mov    eax,DWORD PTR [edx]
  412423:	89 01                	mov    DWORD PTR [ecx],eax
  412425:	a1 a8 13 5f 00       	mov    eax,ds:0x5f13a8
  41242a:	8b 5a 04             	mov    ebx,DWORD PTR [edx+0x4]
  41242d:	39 05 b0 13 5f 00    	cmp    DWORD PTR ds:0x5f13b0,eax
  412433:	89 59 04             	mov    DWORD PTR [ecx+0x4],ebx
  412436:	8b 52 08             	mov    edx,DWORD PTR [edx+0x8]
  412439:	89 51 08             	mov    DWORD PTR [ecx+0x8],edx
  41243c:	0f 85 81 00 00 00    	jne    0x4124c3
  412442:	d9 05 fc c9 5f 00    	fld    DWORD PTR ds:0x5fc9fc
  412448:	dc 0d 70 f0 58 00    	fmul   QWORD PTR ds:0x58f070
  41244e:	d8 05 40 9a 59 00    	fadd   DWORD PTR ds:0x599a40
  412454:	dc 15 48 f0 58 00    	fcom   QWORD PTR ds:0x58f048
  41245a:	d9 1d 40 9a 59 00    	fstp   DWORD PTR ds:0x599a40
  412460:	df e0                	fnstsw ax
  412462:	f6 c4 01             	test   ah,0x1
  412465:	75 0a                	jne    0x412471
  412467:	c7 05 40 9a 59 00 00 	mov    DWORD PTR ds:0x599a40,0x0
  41246e:	00 00 00 
  412471:	d9 05 40 9a 59 00    	fld    DWORD PTR ds:0x599a40
  412477:	d8 0d 64 f0 58 00    	fmul   DWORD PTR ds:0x58f064
  41247d:	e8 d2 97 14 00       	call   0x55bc54
  412482:	c7 05 c4 95 73 00 00 	mov    DWORD PTR ds:0x7395c4,0x43480000
  412489:	00 48 43 
  41248c:	c1 e0 02             	shl    eax,0x2
  41248f:	d9 80 a8 15 5f 00    	fld    DWORD PTR [eax+0x5f15a8]
  412495:	dc 0d 78 f0 58 00    	fmul   QWORD PTR ds:0x58f078
  41249b:	c7 44 24 1c 00 00 fa 	mov    DWORD PTR [esp+0x1c],0x43fa0000
  4124a2:	43 
  4124a3:	d8 44 24 20          	fadd   DWORD PTR [esp+0x20]
  4124a7:	d9 1d c0 95 73 00    	fstp   DWORD PTR ds:0x7395c0
  4124ad:	d9 80 a8 6f 5f 00    	fld    DWORD PTR [eax+0x5f6fa8]
  4124b3:	dc 0d 78 f0 58 00    	fmul   QWORD PTR ds:0x58f078
  4124b9:	d8 44 24 28          	fadd   DWORD PTR [esp+0x28]
  4124bd:	d9 1d c8 95 73 00    	fstp   DWORD PTR ds:0x7395c8
  4124c3:	d9 44 24 20          	fld    DWORD PTR [esp+0x20]
  4124c7:	d8 25 c0 95 73 00    	fsub   DWORD PTR ds:0x7395c0
  4124cd:	d9 5c 24 10          	fstp   DWORD PTR [esp+0x10]
  4124d1:	d9 44 24 24          	fld    DWORD PTR [esp+0x24]
  4124d5:	d8 25 c4 95 73 00    	fsub   DWORD PTR ds:0x7395c4
  4124db:	d9 5c 24 14          	fstp   DWORD PTR [esp+0x14]
  4124df:	d9 44 24 28          	fld    DWORD PTR [esp+0x28]
  4124e3:	d8 25 c8 95 73 00    	fsub   DWORD PTR ds:0x7395c8
  4124e9:	d9 5c 24 18          	fstp   DWORD PTR [esp+0x18]
  4124ed:	d9 44 24 14          	fld    DWORD PTR [esp+0x14]
  4124f1:	d8 4c 24 14          	fmul   DWORD PTR [esp+0x14]
  4124f5:	d9 44 24 18          	fld    DWORD PTR [esp+0x18]
  4124f9:	d8 4c 24 18          	fmul   DWORD PTR [esp+0x18]
  4124fd:	de c1                	faddp  st(1),st
  4124ff:	d9 44 24 10          	fld    DWORD PTR [esp+0x10]
  412503:	d8 4c 24 10          	fmul   DWORD PTR [esp+0x10]
  412507:	de c1                	faddp  st(1),st
  412509:	d9 fa                	fsqrt
  41250b:	dc 3d 88 f0 58 00    	fdivr  QWORD PTR ds:0x58f088
  412511:	d9 44 24 10          	fld    DWORD PTR [esp+0x10]
  412515:	d8 c9                	fmul   st,st(1)
  412517:	a1 b4 13 5f 00       	mov    eax,ds:0x5f13b4
  41251c:	83 c0 0a             	add    eax,0xa
  41251f:	d9 5c 24 10          	fstp   DWORD PTR [esp+0x10]
  412523:	d9 44 24 14          	fld    DWORD PTR [esp+0x14]
  412527:	d8 c9                	fmul   st,st(1)
  412529:	d9 5c 24 14          	fstp   DWORD PTR [esp+0x14]
  41252d:	d8 4c 24 18          	fmul   DWORD PTR [esp+0x18]
  412531:	d9 5c 24 18          	fstp   DWORD PTR [esp+0x18]
  412535:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  412539:	db 44 24 20          	fild   DWORD PTR [esp+0x20]
  41253d:	d9 44 24 1c          	fld    DWORD PTR [esp+0x1c]
  412541:	d8 c9                	fmul   st,st(1)
  412543:	d8 0d 90 f0 58 00    	fmul   DWORD PTR ds:0x58f090
  412549:	d9 44 24 10          	fld    DWORD PTR [esp+0x10]
  41254d:	d8 c9                	fmul   st,st(1)
  41254f:	d8 2d c0 95 73 00    	fsubr  DWORD PTR ds:0x7395c0
  412555:	d9 1d 98 95 73 00    	fstp   DWORD PTR ds:0x739598
  41255b:	d9 44 24 14          	fld    DWORD PTR [esp+0x14]
  41255f:	d8 c9                	fmul   st,st(1)
  412561:	d8 2d c4 95 73 00    	fsubr  DWORD PTR ds:0x7395c4
  412567:	d9 c9                	fxch   st(1)
  412569:	d8 4c 24 18          	fmul   DWORD PTR [esp+0x18]
  41256d:	d8 2d c8 95 73 00    	fsubr  DWORD PTR ds:0x7395c8
  412573:	d9 1d a0 95 73 00    	fstp   DWORD PTR ds:0x7395a0
  412579:	d9 44 24 1c          	fld    DWORD PTR [esp+0x1c]
  41257d:	dc 0d 98 f0 58 00    	fmul   QWORD PTR ds:0x58f098
  412583:	5d                   	pop    ebp
  412584:	5f                   	pop    edi
  412585:	5e                   	pop    esi
  412586:	5b                   	pop    ebx
  412587:	d8 ca                	fmul   st,st(2)
  412589:	83 c4 1c             	add    esp,0x1c
  41258c:	dc 0d a0 f0 58 00    	fmul   QWORD PTR ds:0x58f0a0
  412592:	de c1                	faddp  st(1),st
  412594:	d9 1d 9c 95 73 00    	fstp   DWORD PTR ds:0x73959c
  41259a:	dd d8                	fstp   st(0)
  41259c:	c3                   	ret
  41259d:	cc                   	int3
  41259e:	cc                   	int3
  41259f:	cc                   	int3
  4125a0:	83 ec 10             	sub    esp,0x10
  4125a3:	53                   	push   ebx
  4125a4:	56                   	push   esi
  4125a5:	8b 5c 24 1c          	mov    ebx,DWORD PTR [esp+0x1c]
  4125a9:	57                   	push   edi
  4125aa:	55                   	push   ebp
  4125ab:	8d 34 5b             	lea    esi,[ebx+ebx*2]
  4125ae:	8d 34 b3             	lea    esi,[ebx+esi*4]
  4125b1:	c1 e6 02             	shl    esi,0x2
  4125b4:	03 35 bc 13 5f 00    	add    esi,DWORD PTR ds:0x5f13bc
  4125ba:	8b 2e                	mov    ebp,DWORD PTR [esi]
  4125bc:	8d 6c 6d 00          	lea    ebp,[ebp+ebp*2+0x0]
  4125c0:	c1 e5 03             	shl    ebp,0x3
  4125c3:	03 2d c4 13 5f 00    	add    ebp,DWORD PTR ds:0x5f13c4
  4125c9:	39 1d a8 13 5f 00    	cmp    DWORD PTR ds:0x5f13a8,ebx
  4125cf:	75 10                	jne    0x4125e1
  4125d1:	33 c0                	xor    eax,eax
  4125d3:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  4125d7:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  4125db:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  4125df:	eb 2a                	jmp    0x41260b
  4125e1:	8b 4d 00             	mov    ecx,DWORD PTR [ebp+0x0]
  4125e4:	8d 14 49             	lea    edx,[ecx+ecx*2]
  4125e7:	8d 0c 91             	lea    ecx,[ecx+edx*4]
  4125ea:	8d 54 24 10          	lea    edx,[esp+0x10]
  4125ee:	c1 e1 02             	shl    ecx,0x2
  4125f1:	03 0d bc 13 5f 00    	add    ecx,DWORD PTR ds:0x5f13bc
  4125f7:	8b 41 1c             	mov    eax,DWORD PTR [ecx+0x1c]
  4125fa:	8b 79 20             	mov    edi,DWORD PTR [ecx+0x20]
  4125fd:	83 c1 1c             	add    ecx,0x1c
  412600:	89 02                	mov    DWORD PTR [edx],eax
  412602:	89 7a 04             	mov    DWORD PTR [edx+0x4],edi
  412605:	8b 49 08             	mov    ecx,DWORD PTR [ecx+0x8]
  412608:	89 4a 08             	mov    DWORD PTR [edx+0x8],ecx
  41260b:	8d 7e 14             	lea    edi,[esi+0x14]
  41260e:	d9 07                	fld    DWORD PTR [edi]
  412610:	d8 0d 64 f0 58 00    	fmul   DWORD PTR ds:0x58f064
  412616:	e8 39 96 14 00       	call   0x55bc54
  41261b:	d9 04 85 a8 15 5f 00 	fld    DWORD PTR [eax*4+0x5f15a8]
  412622:	d8 4d 0c             	fmul   DWORD PTR [ebp+0xc]
  412625:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  412629:	d8 44 24 10          	fadd   DWORD PTR [esp+0x10]
  41262d:	d9 5e 1c             	fstp   DWORD PTR [esi+0x1c]
  412630:	89 46 20             	mov    DWORD PTR [esi+0x20],eax
  412633:	d9 07                	fld    DWORD PTR [edi]
  412635:	d8 0d 64 f0 58 00    	fmul   DWORD PTR ds:0x58f064
  41263b:	e8 14 96 14 00       	call   0x55bc54
  412640:	d9 04 85 a8 6f 5f 00 	fld    DWORD PTR [eax*4+0x5f6fa8]
  412647:	d8 4d 0c             	fmul   DWORD PTR [ebp+0xc]
  41264a:	8d 56 1c             	lea    edx,[esi+0x1c]
  41264d:	d8 44 24 18          	fadd   DWORD PTR [esp+0x18]
  412651:	d9 5e 24             	fstp   DWORD PTR [esi+0x24]
  412654:	8b 4e 2c             	mov    ecx,DWORD PTR [esi+0x2c]
  412657:	8b 02                	mov    eax,DWORD PTR [edx]
  412659:	89 41 24             	mov    DWORD PTR [ecx+0x24],eax
  41265c:	83 c1 24             	add    ecx,0x24
  41265f:	8b 6a 04             	mov    ebp,DWORD PTR [edx+0x4]
  412662:	89 69 04             	mov    DWORD PTR [ecx+0x4],ebp
  412665:	8b 52 08             	mov    edx,DWORD PTR [edx+0x8]
  412668:	89 51 08             	mov    DWORD PTR [ecx+0x8],edx
  41266b:	8b 4e 2c             	mov    ecx,DWORD PTR [esi+0x2c]
  41266e:	c7 41 60 01 00 00 00 	mov    DWORD PTR [ecx+0x60],0x1
  412675:	39 1d b0 13 5f 00    	cmp    DWORD PTR ds:0x5f13b0,ebx
  41267b:	75 13                	jne    0x412690
  41267d:	8b 46 2c             	mov    eax,DWORD PTR [esi+0x2c]
  412680:	c7 40 18 00 00 00 00 	mov    DWORD PTR [eax+0x18],0x0
  412687:	8b 46 2c             	mov    eax,DWORD PTR [esi+0x2c]
  41268a:	83 48 60 02          	or     DWORD PTR [eax+0x60],0x2
  41268e:	eb 2b                	jmp    0x4126bb
  412690:	85 db                	test   ebx,ebx
  412692:	75 0c                	jne    0x4126a0
  412694:	8b 46 2c             	mov    eax,DWORD PTR [esi+0x2c]
  412697:	c7 40 18 00 00 00 00 	mov    DWORD PTR [eax+0x18],0x0
  41269e:	eb 1b                	jmp    0x4126bb
  4126a0:	8b 46 2c             	mov    eax,DWORD PTR [esi+0x2c]
  4126a3:	39 1d ac 13 5f 00    	cmp    DWORD PTR ds:0x5f13ac,ebx
  4126a9:	7d 09                	jge    0x4126b4
  4126ab:	c7 40 18 01 00 00 00 	mov    DWORD PTR [eax+0x18],0x1
  4126b2:	eb 07                	jmp    0x4126bb
  4126b4:	c7 40 18 02 00 00 00 	mov    DWORD PTR [eax+0x18],0x2
  4126bb:	d9 46 18             	fld    DWORD PTR [esi+0x18]
  4126be:	d8 0d fc c9 5f 00    	fmul   DWORD PTR ds:0x5fc9fc
  4126c4:	d8 0d a8 f0 58 00    	fmul   DWORD PTR ds:0x58f0a8
  4126ca:	d8 07                	fadd   DWORD PTR [edi]
  4126cc:	d9 1f                	fstp   DWORD PTR [edi]
  4126ce:	81 7e 14 00 00 b4 43 	cmp    DWORD PTR [esi+0x14],0x43b40000
  4126d5:	7c 17                	jl     0x4126ee
  4126d7:	dd 05 48 f0 58 00    	fld    QWORD PTR ds:0x58f048
  4126dd:	d9 07                	fld    DWORD PTR [edi]
  4126df:	d8 e1                	fsub   st,st(1)
  4126e1:	d9 1f                	fstp   DWORD PTR [edi]
  4126e3:	d8 17                	fcom   DWORD PTR [edi]
  4126e5:	df e0                	fnstsw ax
  4126e7:	f6 c4 41             	test   ah,0x41
  4126ea:	75 f1                	jne    0x4126dd
  4126ec:	dd d8                	fstp   st(0)
  4126ee:	81 3f 00 00 00 80    	cmp    DWORD PTR [edi],0x80000000
  4126f4:	76 21                	jbe    0x412717
  4126f6:	dd 05 40 f0 58 00    	fld    QWORD PTR ds:0x58f040
  4126fc:	dd 05 48 f0 58 00    	fld    QWORD PTR ds:0x58f048
  412702:	d9 07                	fld    DWORD PTR [edi]
  412704:	d8 c1                	fadd   st,st(1)
  412706:	d9 1f                	fstp   DWORD PTR [edi]
  412708:	d9 07                	fld    DWORD PTR [edi]
  41270a:	d8 da                	fcomp  st(2)
  41270c:	df e0                	fnstsw ax
  41270e:	f6 c4 01             	test   ah,0x1
  412711:	75 ef                	jne    0x412702
  412713:	dd d8                	fstp   st(0)
  412715:	dd d8                	fstp   st(0)
  412717:	33 c0                	xor    eax,eax
  412719:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  41271d:	39 46 04             	cmp    DWORD PTR [esi+0x4],eax
  412720:	7e 4f                	jle    0x412771
  412722:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  412726:	8b 4e 08             	mov    ecx,DWORD PTR [esi+0x8]
  412729:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  41272d:	8b 2c 01             	mov    ebp,DWORD PTR [ecx+eax*1]
  412730:	33 db                	xor    ebx,ebx
  412732:	33 ff                	xor    edi,edi
  412734:	8d 6c 6d 00          	lea    ebp,[ebp+ebp*2+0x0]
  412738:	c1 e5 03             	shl    ebp,0x3
  41273b:	03 2d c4 13 5f 00    	add    ebp,DWORD PTR ds:0x5f13c4
  412741:	39 5d 04             	cmp    DWORD PTR [ebp+0x4],ebx
  412744:	7e 19                	jle    0x41275f
  412746:	8b 45 08             	mov    eax,DWORD PTR [ebp+0x8]
  412749:	83 c3 04             	add    ebx,0x4
  41274c:	47                   	inc    edi
  41274d:	8b 4c 18 fc          	mov    ecx,DWORD PTR [eax+ebx*1-0x4]
  412751:	51                   	push   ecx
  412752:	e8 49 fe ff ff       	call   0x4125a0
  412757:	83 c4 04             	add    esp,0x4
  41275a:	39 7d 04             	cmp    DWORD PTR [ebp+0x4],edi
  41275d:	7f e7                	jg     0x412746
  41275f:	83 44 24 10 04       	add    DWORD PTR [esp+0x10],0x4
  412764:	ff 44 24 1c          	inc    DWORD PTR [esp+0x1c]
  412768:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  41276c:	39 46 04             	cmp    DWORD PTR [esi+0x4],eax
  41276f:	7f b5                	jg     0x412726
  412771:	5d                   	pop    ebp
  412772:	5f                   	pop    edi
  412773:	5e                   	pop    esi
  412774:	5b                   	pop    ebx
  412775:	83 c4 10             	add    esp,0x10
  412778:	c3                   	ret
  412779:	cc                   	int3
  41277a:	cc                   	int3
  41277b:	cc                   	int3
  41277c:	cc                   	int3
  41277d:	cc                   	int3
  41277e:	cc                   	int3
  41277f:	cc                   	int3
