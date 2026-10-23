
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004af440 <.text+0xae440>:
  4af440:	83 ec 0c             	sub    esp,0xc
  4af443:	b9 05 00 00 00       	mov    ecx,0x5
  4af448:	a1 50 a8 5c 00       	mov    eax,ds:0x5ca850
  4af44d:	53                   	push   ebx
  4af44e:	99                   	cdq
  4af44f:	f7 f9                	idiv   ecx
  4af451:	57                   	push   edi
  4af452:	a2 71 d1 89 00       	mov    ds:0x89d171,al
  4af457:	3c 04                	cmp    al,0x4
  4af459:	7d 07                	jge    0x4af462
  4af45b:	c6 05 71 d1 89 00 04 	mov    BYTE PTR ds:0x89d171,0x4
  4af462:	80 3d 71 d1 89 00 10 	cmp    BYTE PTR ds:0x89d171,0x10
  4af469:	7e 07                	jle    0x4af472
  4af46b:	c6 05 71 d1 89 00 10 	mov    BYTE PTR ds:0x89d171,0x10
  4af472:	bf 81 bb 89 00       	mov    edi,0x89bb81
  4af477:	e8 b4 a4 fe ff       	call   0x499930
  4af47c:	e8 8f 93 f6 ff       	call   0x418810
  4af481:	33 c0                	xor    eax,eax
  4af483:	b9 1c 00 00 00       	mov    ecx,0x1c
  4af488:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4af48a:	66 ab                	stos   WORD PTR es:[edi],ax
  4af48c:	8a 54 24 18          	mov    dl,BYTE PTR [esp+0x18]
  4af490:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  4af494:	66 a3 89 bb 89 00    	mov    ds:0x89bb89,ax
  4af49a:	33 c9                	xor    ecx,ecx
  4af49c:	33 c0                	xor    eax,eax
  4af49e:	88 15 82 bb 89 00    	mov    BYTE PTR ds:0x89bb82,dl
  4af4a4:	8a c2                	mov    al,dl
  4af4a6:	88 0d 87 bb 89 00    	mov    BYTE PTR ds:0x89bb87,cl
  4af4ac:	c6 05 81 bb 89 00 02 	mov    BYTE PTR ds:0x89bb81,0x2
  4af4b3:	c6 05 86 bb 89 00 ff 	mov    BYTE PTR ds:0x89bb86,0xff
  4af4ba:	83 f8 01             	cmp    eax,0x1
  4af4bd:	74 14                	je     0x4af4d3
  4af4bf:	83 f8 02             	cmp    eax,0x2
  4af4c2:	74 2d                	je     0x4af4f1
  4af4c4:	c6 05 f2 bb 89 00 01 	mov    BYTE PTR ds:0x89bbf2,0x1
  4af4cb:	88 0d ef bb 89 00    	mov    BYTE PTR ds:0x89bbef,cl
  4af4d1:	eb 33                	jmp    0x4af506
  4af4d3:	c6 05 f2 bb 89 00 03 	mov    BYTE PTR ds:0x89bbf2,0x3
  4af4da:	c6 05 ef bb 89 00 00 	mov    BYTE PTR ds:0x89bbef,0x0
  4af4e1:	c6 05 f0 bb 89 00 01 	mov    BYTE PTR ds:0x89bbf0,0x1
  4af4e8:	c6 05 f1 bb 89 00 02 	mov    BYTE PTR ds:0x89bbf1,0x2
  4af4ef:	eb 15                	jmp    0x4af506
  4af4f1:	c6 05 f2 bb 89 00 02 	mov    BYTE PTR ds:0x89bbf2,0x2
  4af4f8:	c6 05 ef bb 89 00 00 	mov    BYTE PTR ds:0x89bbef,0x0
  4af4ff:	c6 05 f0 bb 89 00 03 	mov    BYTE PTR ds:0x89bbf0,0x3
  4af506:	e8 f5 05 00 00       	call   0x4afb00
  4af50b:	f6 05 6c c6 89 00 10 	test   BYTE PTR ds:0x89c66c,0x10
  4af512:	74 07                	je     0x4af51b
  4af514:	c6 05 85 bb 89 00 01 	mov    BYTE PTR ds:0x89bb85,0x1
  4af51b:	80 3d 78 db 5c 00 00 	cmp    BYTE PTR ds:0x5cdb78,0x0
  4af522:	0f 85 e6 00 00 00    	jne    0x4af60e
  4af528:	83 0d b1 c6 89 00 10 	or     DWORD PTR ds:0x89c6b1,0x10
  4af52f:	c7 05 b5 c6 89 00 00 	mov    DWORD PTR ds:0x89c6b5,0x0
  4af536:	00 00 00 
  4af539:	81 25 69 c6 89 00 ff 	and    DWORD PTR ds:0x89c669,0xf7ffffff
  4af540:	ff ff f7 
  4af543:	b8 00 00 00 10       	mov    eax,0x10000000
  4af548:	85 05 69 c6 89 00    	test   DWORD PTR ds:0x89c669,eax
  4af54e:	0f 85 cb 00 00 00    	jne    0x4af61f
  4af554:	09 05 69 c6 89 00    	or     DWORD PTR ds:0x89c669,eax
  4af55a:	8d 44 24 08          	lea    eax,[esp+0x8]
  4af55e:	50                   	push   eax
  4af55f:	e8 ac 76 07 00       	call   0x526c10
  4af564:	83 c4 04             	add    esp,0x4
  4af567:	85 c0                	test   eax,eax
  4af569:	75 ef                	jne    0x4af55a
  4af56b:	bf 28 e9 98 00       	mov    edi,0x98e928
  4af570:	33 c0                	xor    eax,eax
  4af572:	b9 40 00 00 00       	mov    ecx,0x40
  4af577:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4af579:	bf 91 45 98 00       	mov    edi,0x984591
  4af57e:	b9 40 00 00 00       	mov    ecx,0x40
  4af583:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4af585:	bf 91 46 98 00       	mov    edi,0x984691
  4af58a:	b9 40 00 00 00       	mov    ecx,0x40
  4af58f:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4af591:	a3 60 45 98 00       	mov    ds:0x984560,eax
  4af596:	a3 68 45 98 00       	mov    ds:0x984568,eax
  4af59b:	a3 64 45 98 00       	mov    ds:0x984564,eax
  4af5a0:	a3 6c 45 98 00       	mov    ds:0x98456c,eax
  4af5a5:	a3 74 45 98 00       	mov    ds:0x984574,eax
  4af5aa:	a3 70 45 98 00       	mov    ds:0x984570,eax
  4af5af:	80 3d e7 c6 89 00 07 	cmp    BYTE PTR ds:0x89c6e7,0x7
  4af5b6:	75 0a                	jne    0x4af5c2
  4af5b8:	e8 93 9b 00 00       	call   0x4b9150
  4af5bd:	e8 0e b0 00 00       	call   0x4ba5d0
  4af5c2:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4af5c9:	8b c8                	mov    ecx,eax
  4af5cb:	8d 14 80             	lea    edx,[eax+eax*4]
  4af5ce:	8d 04 51             	lea    eax,[ecx+edx*2]
  4af5d1:	8d 1c c0             	lea    ebx,[eax+eax*8]
  4af5d4:	8d 14 d9             	lea    edx,[ecx+ebx*8]
  4af5d7:	8d 04 91             	lea    eax,[ecx+edx*4]
  4af5da:	05 c8 d1 89 00       	add    eax,0x89d1c8
  4af5df:	50                   	push   eax
  4af5e0:	6a 00                	push   0x0
  4af5e2:	e8 69 af fc ff       	call   0x47a550
  4af5e7:	66 a1 08 e9 98 00    	mov    ax,ds:0x98e908
  4af5ed:	83 c4 08             	add    esp,0x8
  4af5f0:	66 25 ff f3          	and    ax,0xf3ff
  4af5f4:	5f                   	pop    edi
  4af5f5:	66 a3 08 e9 98 00    	mov    ds:0x98e908,ax
  4af5fb:	5b                   	pop    ebx
  4af5fc:	c6 05 10 e9 98 00 00 	mov    BYTE PTR ds:0x98e910,0x0
  4af603:	c6 05 6c ce 89 00 00 	mov    BYTE PTR ds:0x89ce6c,0x0
  4af60a:	83 c4 0c             	add    esp,0xc
  4af60d:	c3                   	ret
  4af60e:	83 0d b5 c6 89 00 10 	or     DWORD PTR ds:0x89c6b5,0x10
  4af615:	81 0d 69 c6 89 00 00 	or     DWORD PTR ds:0x89c669,0x8000000
  4af61c:	00 00 08 
  4af61f:	5f                   	pop    edi
  4af620:	5b                   	pop    ebx
  4af621:	83 c4 0c             	add    esp,0xc
  4af624:	c3                   	ret
  4af625:	cc                   	int3
  4af626:	cc                   	int3
  4af627:	cc                   	int3
  4af628:	cc                   	int3
  4af629:	cc                   	int3
  4af62a:	cc                   	int3
  4af62b:	cc                   	int3
  4af62c:	cc                   	int3
  4af62d:	cc                   	int3
  4af62e:	cc                   	int3
  4af62f:	cc                   	int3
  4af630:	8a 44 24 04          	mov    al,BYTE PTR [esp+0x4]
  4af634:	a2 86 bb 89 00       	mov    ds:0x89bb86,al
  4af639:	c3                   	ret
  4af63a:	cc                   	int3
  4af63b:	cc                   	int3
  4af63c:	cc                   	int3
  4af63d:	cc                   	int3
  4af63e:	cc                   	int3
  4af63f:	cc                   	int3
