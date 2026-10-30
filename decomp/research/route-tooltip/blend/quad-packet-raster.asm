
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004f9460 <.text+0xf8460>:
  4f9460:	b8 a0 00 00 00       	mov    eax,0xa0
  4f9465:	c3                   	ret
  4f9466:	cc                   	int3
  4f9467:	cc                   	int3
  4f9468:	cc                   	int3
  4f9469:	cc                   	int3
  4f946a:	cc                   	int3
  4f946b:	cc                   	int3
  4f946c:	cc                   	int3
  4f946d:	cc                   	int3
  4f946e:	cc                   	int3
  4f946f:	cc                   	int3
  4f9470:	56                   	push   esi
  4f9471:	8b d1                	mov    edx,ecx
  4f9473:	57                   	push   edi
  4f9474:	a1 6c 8f a6 00       	mov    eax,ds:0xa68f6c
  4f9479:	2b 05 5c 8f a6 00    	sub    eax,DWORD PTR ds:0xa68f5c
  4f947f:	c1 f8 01             	sar    eax,0x1
  4f9482:	83 c0 06             	add    eax,0x6
  4f9485:	3d 00 20 00 00       	cmp    eax,0x2000
  4f948a:	0f 87 ff 00 00 00    	ja     0x4f958f
  4f9490:	66 a1 54 8f a6 00    	mov    ax,ds:0xa68f54
  4f9496:	8b 0d 6c 8f a6 00    	mov    ecx,DWORD PTR ds:0xa68f6c
  4f949c:	66 89 01             	mov    WORD PTR [ecx],ax
  4f949f:	8b 0d 6c 8f a6 00    	mov    ecx,DWORD PTR ds:0xa68f6c
  4f94a5:	66 a1 54 8f a6 00    	mov    ax,ds:0xa68f54
  4f94ab:	66 40                	inc    ax
  4f94ad:	66 89 41 02          	mov    WORD PTR [ecx+0x2],ax
  4f94b1:	8b 0d 6c 8f a6 00    	mov    ecx,DWORD PTR ds:0xa68f6c
  4f94b7:	66 a1 54 8f a6 00    	mov    ax,ds:0xa68f54
  4f94bd:	66 05 02 00          	add    ax,0x2
  4f94c1:	66 89 41 04          	mov    WORD PTR [ecx+0x4],ax
  4f94c5:	8b 0d 6c 8f a6 00    	mov    ecx,DWORD PTR ds:0xa68f6c
  4f94cb:	66 a1 54 8f a6 00    	mov    ax,ds:0xa68f54
  4f94d1:	66 89 41 06          	mov    WORD PTR [ecx+0x6],ax
  4f94d5:	8b 0d 6c 8f a6 00    	mov    ecx,DWORD PTR ds:0xa68f6c
  4f94db:	66 a1 54 8f a6 00    	mov    ax,ds:0xa68f54
  4f94e1:	66 05 02 00          	add    ax,0x2
  4f94e5:	8d 72 20             	lea    esi,[edx+0x20]
  4f94e8:	66 89 41 08          	mov    WORD PTR [ecx+0x8],ax
  4f94ec:	8b 0d 6c 8f a6 00    	mov    ecx,DWORD PTR ds:0xa68f6c
  4f94f2:	66 a1 54 8f a6 00    	mov    ax,ds:0xa68f54
  4f94f8:	66 05 03 00          	add    ax,0x3
  4f94fc:	66 89 41 0a          	mov    WORD PTR [ecx+0xa],ax
  4f9500:	b9 20 00 00 00       	mov    ecx,0x20
  4f9505:	83 05 6c 8f a6 00 0c 	add    DWORD PTR ds:0xa68f6c,0xc
  4f950c:	8b 3d 58 8f a6 00    	mov    edi,DWORD PTR ds:0xa68f58
  4f9512:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  4f9514:	8b 0d 58 8f a6 00    	mov    ecx,DWORD PTR ds:0xa68f58
  4f951a:	8b 42 14             	mov    eax,DWORD PTR [edx+0x14]
  4f951d:	89 41 68             	mov    DWORD PTR [ecx+0x68],eax
  4f9520:	8b 15 58 8f a6 00    	mov    edx,DWORD PTR ds:0xa68f58
  4f9526:	8b 42 68             	mov    eax,DWORD PTR [edx+0x68]
  4f9529:	89 42 48             	mov    DWORD PTR [edx+0x48],eax
  4f952c:	8b 15 58 8f a6 00    	mov    edx,DWORD PTR ds:0xa68f58
  4f9532:	8b 42 48             	mov    eax,DWORD PTR [edx+0x48]
  4f9535:	89 42 28             	mov    DWORD PTR [edx+0x28],eax
  4f9538:	8b 15 58 8f a6 00    	mov    edx,DWORD PTR ds:0xa68f58
  4f953e:	8b 42 28             	mov    eax,DWORD PTR [edx+0x28]
  4f9541:	89 42 08             	mov    DWORD PTR [edx+0x8],eax
  4f9544:	8b 0d 58 8f a6 00    	mov    ecx,DWORD PTR ds:0xa68f58
  4f954a:	c7 41 6c 00 00 80 3f 	mov    DWORD PTR [ecx+0x6c],0x3f800000
  4f9551:	8b 15 58 8f a6 00    	mov    edx,DWORD PTR ds:0xa68f58
  4f9557:	8b 42 6c             	mov    eax,DWORD PTR [edx+0x6c]
  4f955a:	89 42 4c             	mov    DWORD PTR [edx+0x4c],eax
  4f955d:	8b 15 58 8f a6 00    	mov    edx,DWORD PTR ds:0xa68f58
  4f9563:	8b 42 4c             	mov    eax,DWORD PTR [edx+0x4c]
  4f9566:	89 42 2c             	mov    DWORD PTR [edx+0x2c],eax
  4f9569:	8b 15 58 8f a6 00    	mov    edx,DWORD PTR ds:0xa68f58
  4f956f:	5f                   	pop    edi
  4f9570:	5e                   	pop    esi
  4f9571:	8b 42 2c             	mov    eax,DWORD PTR [edx+0x2c]
  4f9574:	89 42 0c             	mov    DWORD PTR [edx+0xc],eax
  4f9577:	b8 a0 00 00 00       	mov    eax,0xa0
  4f957c:	81 05 58 8f a6 00 80 	add    DWORD PTR ds:0xa68f58,0x80
  4f9583:	00 00 00 
  4f9586:	66 83 05 54 8f a6 00 	add    WORD PTR ds:0xa68f54,0x4
  4f958d:	04 
  4f958e:	c3                   	ret
  4f958f:	b8 a0 00 00 00       	mov    eax,0xa0
  4f9594:	5f                   	pop    edi
  4f9595:	5e                   	pop    esi
  4f9596:	c3                   	ret
  4f9597:	cc                   	int3
  4f9598:	cc                   	int3
  4f9599:	cc                   	int3
  4f959a:	cc                   	int3
  4f959b:	cc                   	int3
  4f959c:	cc                   	int3
  4f959d:	cc                   	int3
  4f959e:	cc                   	int3
  4f959f:	cc                   	int3
