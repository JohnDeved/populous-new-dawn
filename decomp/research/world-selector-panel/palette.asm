
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004a3200 <.text+0xa2200>:
  4a3200:	f6 05 69 c6 89 00 04 	test   BYTE PTR ds:0x89c669,0x4
  4a3207:	0f 85 b9 00 00 00    	jne    0x4a32c6
  4a320d:	83 3d 24 df 59 00 00 	cmp    DWORD PTR ds:0x59df24,0x0
  4a3214:	0f 84 ac 00 00 00    	je     0x4a32c6
  4a321a:	e8 51 a0 0b 00       	call   0x55d270
  4a321f:	3b 05 f0 d8 5c 00    	cmp    eax,DWORD PTR ds:0x5cd8f0
  4a3225:	0f 82 9b 00 00 00    	jb     0x4a32c6
  4a322b:	05 90 01 00 00       	add    eax,0x190
  4a3230:	ff 05 95 c6 89 00    	inc    DWORD PTR ds:0x89c695
  4a3236:	a3 f0 d8 5c 00       	mov    ds:0x5cd8f0,eax
  4a323b:	a1 24 df 59 00       	mov    eax,ds:0x59df24
  4a3240:	8d 88 fc 03 00 00    	lea    ecx,[eax+0x3fc]
  4a3246:	c6 01 00             	mov    BYTE PTR [ecx],0x0
  4a3249:	c6 80 fd 03 00 00 00 	mov    BYTE PTR [eax+0x3fd],0x0
  4a3250:	c6 80 fe 03 00 00 00 	mov    BYTE PTR [eax+0x3fe],0x0
  4a3257:	c6 80 f8 03 00 00 00 	mov    BYTE PTR [eax+0x3f8],0x0
  4a325e:	c6 80 f9 03 00 00 00 	mov    BYTE PTR [eax+0x3f9],0x0
  4a3265:	c6 80 fa 03 00 00 00 	mov    BYTE PTR [eax+0x3fa],0x0
  4a326c:	6a 01                	push   0x1
  4a326e:	c6 01 ff             	mov    BYTE PTR [ecx],0xff
  4a3271:	c6 80 fd 03 00 00 ff 	mov    BYTE PTR [eax+0x3fd],0xff
  4a3278:	c6 80 fe 03 00 00 ff 	mov    BYTE PTR [eax+0x3fe],0xff
  4a327f:	c6 80 f8 03 00 00 83 	mov    BYTE PTR [eax+0x3f8],0x83
  4a3286:	c6 80 f9 03 00 00 83 	mov    BYTE PTR [eax+0x3f9],0x83
  4a328d:	c6 80 fa 03 00 00 83 	mov    BYTE PTR [eax+0x3fa],0x83
  4a3294:	68 ff 00 00 00       	push   0xff
  4a3299:	a1 24 df 59 00       	mov    eax,ds:0x59df24
  4a329e:	05 fc 03 00 00       	add    eax,0x3fc
  4a32a3:	50                   	push   eax
  4a32a4:	e8 f7 f2 00 00       	call   0x4b25a0
  4a32a9:	83 c4 0c             	add    esp,0xc
  4a32ac:	a1 24 df 59 00       	mov    eax,ds:0x59df24
  4a32b1:	05 f8 03 00 00       	add    eax,0x3f8
  4a32b6:	6a 01                	push   0x1
  4a32b8:	68 fe 00 00 00       	push   0xfe
  4a32bd:	50                   	push   eax
  4a32be:	e8 dd f2 00 00       	call   0x4b25a0
  4a32c3:	83 c4 0c             	add    esp,0xc
  4a32c6:	c3                   	ret
  4a32c7:	cc                   	int3
  4a32c8:	cc                   	int3
  4a32c9:	cc                   	int3
  4a32ca:	cc                   	int3
  4a32cb:	cc                   	int3
  4a32cc:	cc                   	int3
  4a32cd:	cc                   	int3
  4a32ce:	cc                   	int3
  4a32cf:	cc                   	int3
  4a32d0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4a32d4:	c6 80 fc 03 00 00 00 	mov    BYTE PTR [eax+0x3fc],0x0
  4a32db:	c6 80 fd 03 00 00 00 	mov    BYTE PTR [eax+0x3fd],0x0
  4a32e2:	c6 80 fe 03 00 00 00 	mov    BYTE PTR [eax+0x3fe],0x0
  4a32e9:	c6 80 f8 03 00 00 00 	mov    BYTE PTR [eax+0x3f8],0x0
  4a32f0:	c6 80 f9 03 00 00 00 	mov    BYTE PTR [eax+0x3f9],0x0
  4a32f7:	c6 80 fa 03 00 00 00 	mov    BYTE PTR [eax+0x3fa],0x0
  4a32fe:	80 7c 24 08 00       	cmp    BYTE PTR [esp+0x8],0x0
  4a3303:	74 2a                	je     0x4a332f
  4a3305:	c6 80 fc 03 00 00 ff 	mov    BYTE PTR [eax+0x3fc],0xff
  4a330c:	c6 80 fd 03 00 00 ff 	mov    BYTE PTR [eax+0x3fd],0xff
  4a3313:	c6 80 fe 03 00 00 ff 	mov    BYTE PTR [eax+0x3fe],0xff
  4a331a:	c6 80 f8 03 00 00 83 	mov    BYTE PTR [eax+0x3f8],0x83
  4a3321:	c6 80 f9 03 00 00 83 	mov    BYTE PTR [eax+0x3f9],0x83
  4a3328:	c6 80 fa 03 00 00 83 	mov    BYTE PTR [eax+0x3fa],0x83
  4a332f:	c3                   	ret
  4a3330:	f6 05 69 c6 89 00 04 	test   BYTE PTR ds:0x89c669,0x4
  4a3337:	56                   	push   esi
  4a3338:	8b 74 24 08          	mov    esi,DWORD PTR [esp+0x8]
  4a333c:	89 35 24 df 59 00    	mov    DWORD PTR ds:0x59df24,esi
  4a3342:	0f 85 b5 00 00 00    	jne    0x4a33fd
  4a3348:	85 f6                	test   esi,esi
  4a334a:	0f 84 ad 00 00 00    	je     0x4a33fd
  4a3350:	e8 1b 9f 0b 00       	call   0x55d270
  4a3355:	39 05 f0 d8 5c 00    	cmp    DWORD PTR ds:0x5cd8f0,eax
  4a335b:	0f 87 9c 00 00 00    	ja     0x4a33fd
  4a3361:	05 90 01 00 00       	add    eax,0x190
  4a3366:	8b 0d 24 df 59 00    	mov    ecx,DWORD PTR ds:0x59df24
  4a336c:	a3 f0 d8 5c 00       	mov    ds:0x5cd8f0,eax
  4a3371:	ff 05 95 c6 89 00    	inc    DWORD PTR ds:0x89c695
  4a3377:	8d 81 fc 03 00 00    	lea    eax,[ecx+0x3fc]
  4a337d:	c6 00 00             	mov    BYTE PTR [eax],0x0
  4a3380:	c6 81 fd 03 00 00 00 	mov    BYTE PTR [ecx+0x3fd],0x0
  4a3387:	c6 81 fe 03 00 00 00 	mov    BYTE PTR [ecx+0x3fe],0x0
  4a338e:	c6 81 f8 03 00 00 00 	mov    BYTE PTR [ecx+0x3f8],0x0
  4a3395:	c6 81 f9 03 00 00 00 	mov    BYTE PTR [ecx+0x3f9],0x0
  4a339c:	c6 81 fa 03 00 00 00 	mov    BYTE PTR [ecx+0x3fa],0x0
  4a33a3:	6a 01                	push   0x1
  4a33a5:	c6 00 ff             	mov    BYTE PTR [eax],0xff
  4a33a8:	c6 81 fd 03 00 00 ff 	mov    BYTE PTR [ecx+0x3fd],0xff
  4a33af:	c6 81 fe 03 00 00 ff 	mov    BYTE PTR [ecx+0x3fe],0xff
  4a33b6:	c6 81 f8 03 00 00 83 	mov    BYTE PTR [ecx+0x3f8],0x83
  4a33bd:	c6 81 f9 03 00 00 83 	mov    BYTE PTR [ecx+0x3f9],0x83
  4a33c4:	c6 81 fa 03 00 00 83 	mov    BYTE PTR [ecx+0x3fa],0x83
  4a33cb:	68 ff 00 00 00       	push   0xff
  4a33d0:	a1 24 df 59 00       	mov    eax,ds:0x59df24
  4a33d5:	05 fc 03 00 00       	add    eax,0x3fc
  4a33da:	50                   	push   eax
  4a33db:	e8 c0 f1 00 00       	call   0x4b25a0
  4a33e0:	83 c4 0c             	add    esp,0xc
  4a33e3:	a1 24 df 59 00       	mov    eax,ds:0x59df24
  4a33e8:	05 f8 03 00 00       	add    eax,0x3f8
  4a33ed:	6a 01                	push   0x1
  4a33ef:	68 fe 00 00 00       	push   0xfe
  4a33f4:	50                   	push   eax
  4a33f5:	e8 a6 f1 00 00       	call   0x4b25a0
  4a33fa:	83 c4 0c             	add    esp,0xc
  4a33fd:	68 00 01 00 00       	push   0x100
  4a3402:	6a 00                	push   0x0
  4a3404:	56                   	push   esi
  4a3405:	e8 96 f1 00 00       	call   0x4b25a0
  4a340a:	83 c4 0c             	add    esp,0xc
  4a340d:	6a 10                	push   0x10
  4a340f:	6a 10                	push   0x10
  4a3411:	68 58 df 98 00       	push   0x98df58
  4a3416:	e8 f5 7d 08 00       	call   0x52b210
  4a341b:	83 c4 0c             	add    esp,0xc
  4a341e:	5e                   	pop    esi
  4a341f:	c3                   	ret
  4a3420:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4a3424:	56                   	push   esi
  4a3425:	57                   	push   edi
  4a3426:	8b f0                	mov    esi,eax
  4a3428:	bf c0 df 98 00       	mov    edi,0x98dfc0
  4a342d:	b9 00 01 00 00       	mov    ecx,0x100
  4a3432:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  4a3434:	5f                   	pop    edi
  4a3435:	a3 50 df 98 00       	mov    ds:0x98df50,eax
  4a343a:	5e                   	pop    esi
  4a343b:	c3                   	ret
  4a343c:	cc                   	int3
  4a343d:	cc                   	int3
  4a343e:	cc                   	int3
  4a343f:	cc                   	int3
  4a3440:	66 b8 00 02          	mov    ax,0x200
  4a3444:	81 ec 00 06 00 00    	sub    esp,0x600
  4a344a:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4a3450:	53                   	push   ebx
  4a3451:	66 3b 81 f6 08 00 00 	cmp    ax,WORD PTR [ecx+0x8f6]
  4a3458:	56                   	push   esi
  4a3459:	57                   	push   edi
  4a345a:	55                   	push   ebp
  4a345b:	1b ff                	sbb    edi,edi
  4a345d:	81 e7 00 ff 00 00    	and    edi,0xff00
  4a3463:	81 c7 ff 00 00 00    	add    edi,0xff
  4a3469:	83 b9 10 0d 00 00 00 	cmp    DWORD PTR [ecx+0xd10],0x0
