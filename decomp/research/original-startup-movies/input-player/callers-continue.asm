
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00523170 <.text+0x122170>:
  523170:	83 3d 6a bc 89 00 0b 	cmp    DWORD PTR ds:0x89bc6a,0xb
  523177:	75 1c                	jne    0x523195
  523179:	33 c0                	xor    eax,eax
  52317b:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  523180:	50                   	push   eax
  523181:	6a 00                	push   0x0
  523183:	6a 00                	push   0x0
  523185:	6a 01                	push   0x1
  523187:	68 f8 dc 5d 00       	push   0x5ddcf8
  52318c:	e8 ef 9a f7 ff       	call   0x49cc80
  523191:	83 c4 14             	add    esp,0x14
  523194:	c3                   	ret
  523195:	33 c0                	xor    eax,eax
  523197:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  52319c:	50                   	push   eax
  52319d:	6a 00                	push   0x0
  52319f:	6a 00                	push   0x0
  5231a1:	6a 01                	push   0x1
  5231a3:	68 e8 dc 5d 00       	push   0x5ddce8
  5231a8:	e8 d3 9a f7 ff       	call   0x49cc80
  5231ad:	83 c4 14             	add    esp,0x14
  5231b0:	c3                   	ret
  5231b1:	cc                   	int3
  5231b2:	cc                   	int3
  5231b3:	cc                   	int3
  5231b4:	cc                   	int3
  5231b5:	cc                   	int3
  5231b6:	cc                   	int3
  5231b7:	cc                   	int3
  5231b8:	cc                   	int3
  5231b9:	cc                   	int3
  5231ba:	cc                   	int3
  5231bb:	cc                   	int3

INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004c3340 <.text+0xc2340>:
  4c3340:	c6 05 f0 c6 89 00 00 	mov    BYTE PTR ds:0x89c6f0,0x0
  4c3347:	a1 6a bc 89 00       	mov    eax,ds:0x89bc6a
  4c334c:	48                   	dec    eax
  4c334d:	83 f8 0a             	cmp    eax,0xa
  4c3350:	77 07                	ja     0x4c3359
  4c3352:	ff 24 85 ec 34 4c 00 	jmp    DWORD PTR [eax*4+0x4c34ec]
  4c3359:	33 c0                	xor    eax,eax
  4c335b:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  4c3360:	50                   	push   eax
  4c3361:	6a 00                	push   0x0
  4c3363:	6a 00                	push   0x0
  4c3365:	6a 01                	push   0x1
  4c3367:	68 bc 46 5d 00       	push   0x5d46bc
  4c336c:	e9 d9 00 00 00       	jmp    0x4c344a
  4c3371:	33 c0                	xor    eax,eax
  4c3373:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  4c3378:	50                   	push   eax
  4c3379:	6a 03                	push   0x3
  4c337b:	6a 00                	push   0x0
  4c337d:	6a 01                	push   0x1
  4c337f:	68 bc 46 5d 00       	push   0x5d46bc
  4c3384:	e9 c1 00 00 00       	jmp    0x4c344a
  4c3389:	33 c0                	xor    eax,eax
  4c338b:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  4c3390:	50                   	push   eax
  4c3391:	6a 02                	push   0x2
  4c3393:	6a 00                	push   0x0
  4c3395:	6a 01                	push   0x1
  4c3397:	68 bc 46 5d 00       	push   0x5d46bc
  4c339c:	e9 a9 00 00 00       	jmp    0x4c344a
  4c33a1:	33 c0                	xor    eax,eax
  4c33a3:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  4c33a8:	50                   	push   eax
  4c33a9:	6a 00                	push   0x0
  4c33ab:	6a 00                	push   0x0
  4c33ad:	6a 01                	push   0x1
  4c33af:	68 e4 46 5d 00       	push   0x5d46e4
  4c33b4:	e9 91 00 00 00       	jmp    0x4c344a
  4c33b9:	33 c0                	xor    eax,eax
  4c33bb:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  4c33c0:	50                   	push   eax
  4c33c1:	6a 04                	push   0x4
  4c33c3:	6a 00                	push   0x0
  4c33c5:	6a 01                	push   0x1
  4c33c7:	68 d0 46 5d 00       	push   0x5d46d0
  4c33cc:	eb 7c                	jmp    0x4c344a
  4c33ce:	33 c0                	xor    eax,eax
  4c33d0:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  4c33d5:	50                   	push   eax
  4c33d6:	6a 03                	push   0x3
  4c33d8:	6a 00                	push   0x0
  4c33da:	6a 01                	push   0x1
  4c33dc:	68 d0 46 5d 00       	push   0x5d46d0
  4c33e1:	eb 67                	jmp    0x4c344a
  4c33e3:	33 c0                	xor    eax,eax
  4c33e5:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  4c33ea:	50                   	push   eax
  4c33eb:	6a 04                	push   0x4
  4c33ed:	6a 00                	push   0x0
  4c33ef:	6a 01                	push   0x1
  4c33f1:	68 bc 46 5d 00       	push   0x5d46bc
  4c33f6:	eb 52                	jmp    0x4c344a
  4c33f8:	33 c0                	xor    eax,eax
  4c33fa:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  4c33ff:	50                   	push   eax
  4c3400:	6a 02                	push   0x2
  4c3402:	6a 00                	push   0x0
  4c3404:	6a 01                	push   0x1
  4c3406:	68 d0 46 5d 00       	push   0x5d46d0
  4c340b:	eb 3d                	jmp    0x4c344a
  4c340d:	33 c0                	xor    eax,eax
  4c340f:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  4c3414:	50                   	push   eax
  4c3415:	6a 00                	push   0x0
  4c3417:	6a 00                	push   0x0
  4c3419:	6a 01                	push   0x1
  4c341b:	68 d0 46 5d 00       	push   0x5d46d0
  4c3420:	eb 28                	jmp    0x4c344a
  4c3422:	33 c0                	xor    eax,eax
  4c3424:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  4c3429:	50                   	push   eax
  4c342a:	6a 00                	push   0x0
  4c342c:	6a 00                	push   0x0
  4c342e:	6a 01                	push   0x1
  4c3430:	68 0c 47 5d 00       	push   0x5d470c
  4c3435:	eb 13                	jmp    0x4c344a
  4c3437:	33 c0                	xor    eax,eax
  4c3439:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  4c343e:	50                   	push   eax
  4c343f:	6a 00                	push   0x0
  4c3441:	6a 00                	push   0x0
  4c3443:	6a 01                	push   0x1
  4c3445:	68 f8 46 5d 00       	push   0x5d46f8
  4c344a:	e8 31 98 fd ff       	call   0x49cc80
  4c344f:	81 25 65 c6 89 00 ff 	and    DWORD PTR ds:0x89c665,0xfff7ffff
  4c3456:	ff f7 ff 
  4c3459:	83 c4 14             	add    esp,0x14
  4c345c:	e8 bf 8a f6 ff       	call   0x42bf20
  4c3461:	6a 00                	push   0x0
  4c3463:	e8 f8 36 f6 ff       	call   0x426b60
  4c3468:	83 c4 04             	add    esp,0x4
  4c346b:	85 c0                	test   eax,eax
  4c346d:	74 7b                	je     0x4c34ea
  4c346f:	83 25 7c d1 89 00 fe 	and    DWORD PTR ds:0x89d17c,0xfffffffe
  4c3476:	81 25 65 c6 89 00 ff 	and    DWORD PTR ds:0x89c665,0xfbffffff
  4c347d:	ff ff fb 
  4c3480:	c7 05 f4 c9 5f 00 01 	mov    DWORD PTR ds:0x5fc9f4,0x1
  4c3487:	00 00 00 
  4c348a:	6a 0a                	push   0xa
  4c348c:	e8 cf f5 f7 ff       	call   0x442a60
  4c3491:	83 c4 04             	add    esp,0x4
  4c3494:	a0 50 c6 89 00       	mov    al,ds:0x89c650
  4c3499:	a2 c0 ea 96 00       	mov    ds:0x96eac0,al
  4c349e:	a2 bf ea 96 00       	mov    ds:0x96eabf,al
  4c34a3:	e8 68 84 f6 ff       	call   0x42b910
  4c34a8:	e8 43 83 f6 ff       	call   0x42b7f0
  4c34ad:	e8 6e ae f7 ff       	call   0x43e320
  4c34b2:	e8 79 77 fb ff       	call   0x47ac30
  4c34b7:	80 0d 09 a4 89 00 04 	or     BYTE PTR ds:0x89a409,0x4
  4c34be:	c6 05 78 9c 74 00 01 	mov    BYTE PTR ds:0x749c78,0x1
  4c34c5:	80 3d 33 ce 89 00 00 	cmp    BYTE PTR ds:0x89ce33,0x0
  4c34cc:	74 1c                	je     0x4c34ea
  4c34ce:	6a 00                	push   0x0
  4c34d0:	a1 10 df 59 00       	mov    eax,ds:0x59df10
  4c34d5:	0f be 0d 33 ce 89 00 	movsx  ecx,BYTE PTR ds:0x89ce33
  4c34dc:	6a 00                	push   0x0
  4c34de:	8d 14 c8             	lea    edx,[eax+ecx*8]
  4c34e1:	52                   	push   edx
  4c34e2:	e8 19 95 03 00       	call   0x4fca00
  4c34e7:	83 c4 0c             	add    esp,0xc
  4c34ea:	c3                   	ret
  4c34eb:	90                   	nop
