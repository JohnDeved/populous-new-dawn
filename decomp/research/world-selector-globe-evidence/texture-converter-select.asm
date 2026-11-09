
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00548170 <.text+0x147170>:
  548170:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  548176:	55                   	push   ebp
  548177:	8b ec                	mov    ebp,esp
  548179:	6a ff                	push   0xffffffff
  54817b:	68 d4 83 54 00       	push   0x5483d4
  548180:	50                   	push   eax
  548181:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  548188:	83 ec 08             	sub    esp,0x8
  54818b:	89 4d ec             	mov    DWORD PTR [ebp-0x14],ecx
  54818e:	53                   	push   ebx
  54818f:	56                   	push   esi
  548190:	57                   	push   edi
  548191:	8b 7d 0c             	mov    edi,DWORD PTR [ebp+0xc]
  548194:	8b 75 08             	mov    esi,DWORD PTR [ebp+0x8]
  548197:	8b 47 10             	mov    eax,DWORD PTR [edi+0x10]
  54819a:	40                   	inc    eax
  54819b:	c1 e8 03             	shr    eax,0x3
  54819e:	89 41 04             	mov    DWORD PTR [ecx+0x4],eax
  5481a1:	8b 46 10             	mov    eax,DWORD PTR [esi+0x10]
  5481a4:	40                   	inc    eax
  5481a5:	c1 e8 03             	shr    eax,0x3
  5481a8:	89 41 08             	mov    DWORD PTR [ecx+0x8],eax
  5481ab:	8b 0f                	mov    ecx,DWORD PTR [edi]
  5481ad:	39 0d 68 5b d0 00    	cmp    DWORD PTR ds:0xd05b68,ecx
  5481b3:	75 3f                	jne    0x5481f4
  5481b5:	a1 6c 5b d0 00       	mov    eax,ds:0xd05b6c
  5481ba:	39 47 04             	cmp    DWORD PTR [edi+0x4],eax
  5481bd:	75 35                	jne    0x5481f4
  5481bf:	a1 70 5b d0 00       	mov    eax,ds:0xd05b70
  5481c4:	39 47 08             	cmp    DWORD PTR [edi+0x8],eax
  5481c7:	75 2b                	jne    0x5481f4
  5481c9:	a1 74 5b d0 00       	mov    eax,ds:0xd05b74
  5481ce:	39 47 0c             	cmp    DWORD PTR [edi+0xc],eax
  5481d1:	75 21                	jne    0x5481f4
  5481d3:	a1 78 5b d0 00       	mov    eax,ds:0xd05b78
  5481d8:	39 47 10             	cmp    DWORD PTR [edi+0x10],eax
  5481db:	75 17                	jne    0x5481f4
  5481dd:	83 7f 14 01          	cmp    DWORD PTR [edi+0x14],0x1
  5481e1:	1b c0                	sbb    eax,eax
  5481e3:	f7 d8                	neg    eax
  5481e5:	83 3d 7c 5b d0 00 01 	cmp    DWORD PTR ds:0xd05b7c,0x1
  5481ec:	1b d2                	sbb    edx,edx
  5481ee:	f7 da                	neg    edx
  5481f0:	3b c2                	cmp    eax,edx
  5481f2:	74 57                	je     0x54824b
  5481f4:	39 0d 50 5b d0 00    	cmp    DWORD PTR ds:0xd05b50,ecx
  5481fa:	0f 85 b0 00 00 00    	jne    0x5482b0
  548200:	a1 54 5b d0 00       	mov    eax,ds:0xd05b54
  548205:	39 47 04             	cmp    DWORD PTR [edi+0x4],eax
  548208:	0f 85 a2 00 00 00    	jne    0x5482b0
  54820e:	a1 58 5b d0 00       	mov    eax,ds:0xd05b58
  548213:	39 47 08             	cmp    DWORD PTR [edi+0x8],eax
  548216:	0f 85 94 00 00 00    	jne    0x5482b0
  54821c:	a1 5c 5b d0 00       	mov    eax,ds:0xd05b5c
  548221:	39 47 0c             	cmp    DWORD PTR [edi+0xc],eax
  548224:	0f 85 86 00 00 00    	jne    0x5482b0
  54822a:	a1 60 5b d0 00       	mov    eax,ds:0xd05b60
  54822f:	39 47 10             	cmp    DWORD PTR [edi+0x10],eax
  548232:	75 7c                	jne    0x5482b0
  548234:	83 7f 14 01          	cmp    DWORD PTR [edi+0x14],0x1
  548238:	1b c0                	sbb    eax,eax
  54823a:	f7 d8                	neg    eax
  54823c:	83 3d 64 5b d0 00 01 	cmp    DWORD PTR ds:0xd05b64,0x1
  548243:	1b c9                	sbb    ecx,ecx
  548245:	f7 d9                	neg    ecx
  548247:	3b c1                	cmp    eax,ecx
  548249:	75 65                	jne    0x5482b0
  54824b:	f6 45 14 01          	test   BYTE PTR [ebp+0x14],0x1
  54824f:	75 5f                	jne    0x5482b0
  548251:	8b 46 10             	mov    eax,DWORD PTR [esi+0x10]
  548254:	40                   	inc    eax
  548255:	83 e0 f8             	and    eax,0xfffffff8
  548258:	83 f8 10             	cmp    eax,0x10
  54825b:	75 53                	jne    0x5482b0
  54825d:	6a 2c                	push   0x2c
  54825f:	e8 3c 2a 01 00       	call   0x55aca0
  548264:	89 45 f0             	mov    DWORD PTR [ebp-0x10],eax
  548267:	83 c4 04             	add    esp,0x4
  54826a:	c7 45 fc 00 00 00 00 	mov    DWORD PTR [ebp-0x4],0x0
  548271:	8b d8                	mov    ebx,eax
  548273:	b8 00 00 00 00       	mov    eax,0x0
  548278:	85 db                	test   ebx,ebx
  54827a:	74 09                	je     0x548285
  54827c:	56                   	push   esi
  54827d:	8b cb                	mov    ecx,ebx
  54827f:	57                   	push   edi
  548280:	e8 4b d5 00 00       	call   0x5557d0
  548285:	8b 4d ec             	mov    ecx,DWORD PTR [ebp-0x14]
  548288:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  54828f:	89 01                	mov    DWORD PTR [ecx],eax
  548291:	8b 45 f4             	mov    eax,DWORD PTR [ebp-0xc]
  548294:	5f                   	pop    edi
  548295:	64 a3 00 00 00 00    	mov    fs:0x0,eax
  54829b:	5e                   	pop    esi
  54829c:	5b                   	pop    ebx
  54829d:	8b e5                	mov    esp,ebp
  54829f:	5d                   	pop    ebp
  5482a0:	c2 10 00             	ret    0x10
  5482a3:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  5482a6:	50                   	push   eax
  5482a7:	e8 a4 2a 01 00       	call   0x55ad50
  5482ac:	83 c4 04             	add    esp,0x4
  5482af:	c3                   	ret
  5482b0:	8b 47 14             	mov    eax,DWORD PTR [edi+0x14]
  5482b3:	85 c0                	test   eax,eax
  5482b5:	75 5e                	jne    0x548315
  5482b7:	83 7e 14 00          	cmp    DWORD PTR [esi+0x14],0x0
  5482bb:	75 54                	jne    0x548311
  5482bd:	6a 40                	push   0x40
  5482bf:	e8 dc 29 01 00       	call   0x55aca0
  5482c4:	89 45 f0             	mov    DWORD PTR [ebp-0x10],eax
  5482c7:	83 c4 04             	add    esp,0x4
  5482ca:	c7 45 fc 01 00 00 00 	mov    DWORD PTR [ebp-0x4],0x1
  5482d1:	8b d8                	mov    ebx,eax
  5482d3:	85 db                	test   ebx,ebx
  5482d5:	74 29                	je     0x548300
  5482d7:	56                   	push   esi
  5482d8:	8b cb                	mov    ecx,ebx
  5482da:	57                   	push   edi
  5482db:	c7 03 d8 1c 59 00    	mov    DWORD PTR [ebx],0x591cd8
  5482e1:	c6 45 fc 02          	mov    BYTE PTR [ebp-0x4],0x2
  5482e5:	c7 03 c8 1c 59 00    	mov    DWORD PTR [ebx],0x591cc8
  5482eb:	e8 c0 c8 00 00       	call   0x554bb0
  5482f0:	c6 45 fc 01          	mov    BYTE PTR [ebp-0x4],0x1
  5482f4:	8b c3                	mov    eax,ebx
  5482f6:	eb 8d                	jmp    0x548285
  5482f8:	8b 4d f0             	mov    ecx,DWORD PTR [ebp-0x10]
  5482fb:	e9 c0 01 00 00       	jmp    0x5484c0
  548300:	33 c0                	xor    eax,eax
  548302:	eb 81                	jmp    0x548285
  548304:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  548307:	50                   	push   eax
  548308:	e8 43 2a 01 00       	call   0x55ad50
  54830d:	83 c4 04             	add    esp,0x4
  548310:	c3                   	ret
  548311:	85 c0                	test   eax,eax
  548313:	74 76                	je     0x54838b
  548315:	83 7e 14 00          	cmp    DWORD PTR [esi+0x14],0x0
  548319:	75 68                	jne    0x548383
  54831b:	8b 5d 10             	mov    ebx,DWORD PTR [ebp+0x10]
  54831e:	85 db                	test   ebx,ebx
  548320:	0f 84 6b ff ff ff    	je     0x548291
  548326:	68 30 04 00 00       	push   0x430
  54832b:	e8 70 29 01 00       	call   0x55aca0
  548330:	89 45 f0             	mov    DWORD PTR [ebp-0x10],eax
  548333:	83 c4 04             	add    esp,0x4
  548336:	c7 45 fc 03 00 00 00 	mov    DWORD PTR [ebp-0x4],0x3
  54833d:	8b f8                	mov    edi,eax
  54833f:	85 ff                	test   edi,edi
  548341:	74 2c                	je     0x54836f
  548343:	56                   	push   esi
  548344:	8b cf                	mov    ecx,edi
  548346:	53                   	push   ebx
  548347:	c7 07 d8 1c 59 00    	mov    DWORD PTR [edi],0x591cd8
  54834d:	c6 45 fc 04          	mov    BYTE PTR [ebp-0x4],0x4
  548351:	c7 07 b8 1c 59 00    	mov    DWORD PTR [edi],0x591cb8
  548357:	e8 e4 c2 00 00       	call   0x554640
  54835c:	c6 45 fc 03          	mov    BYTE PTR [ebp-0x4],0x3
  548360:	8b c7                	mov    eax,edi
  548362:	e9 1e ff ff ff       	jmp    0x548285
  548367:	8b 4d f0             	mov    ecx,DWORD PTR [ebp-0x10]
  54836a:	e9 51 01 00 00       	jmp    0x5484c0
  54836f:	33 c0                	xor    eax,eax
  548371:	e9 0f ff ff ff       	jmp    0x548285
  548376:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  548379:	50                   	push   eax
  54837a:	e8 d1 29 01 00       	call   0x55ad50
  54837f:	83 c4 04             	add    esp,0x4
  548382:	c3                   	ret
  548383:	85 c0                	test   eax,eax
  548385:	0f 85 06 ff ff ff    	jne    0x548291
  54838b:	83 7e 14 00          	cmp    DWORD PTR [esi+0x14],0x0
  54838f:	0f 84 fc fe ff ff    	je     0x548291
  548395:	8b 5d 10             	mov    ebx,DWORD PTR [ebp+0x10]
  548398:	85 db                	test   ebx,ebx
  54839a:	0f 84 f1 fe ff ff    	je     0x548291
  5483a0:	68 38 04 00 00       	push   0x438
  5483a5:	e8 f6 28 01 00       	call   0x55aca0
  5483aa:	89 45 f0             	mov    DWORD PTR [ebp-0x10],eax
  5483ad:	83 c4 04             	add    esp,0x4
  5483b0:	c7 45 fc 05 00 00 00 	mov    DWORD PTR [ebp-0x4],0x5
  5483b7:	8b f0                	mov    esi,eax
  5483b9:	b8 00 00 00 00       	mov    eax,0x0
  5483be:	85 f6                	test   esi,esi
  5483c0:	0f 84 bf fe ff ff    	je     0x548285
  5483c6:	53                   	push   ebx
  5483c7:	8b ce                	mov    ecx,esi
  5483c9:	57                   	push   edi
  5483ca:	e8 a1 cd 00 00       	call   0x555170
  5483cf:	e9 b1 fe ff ff       	jmp    0x548285
  5483d4:	b8 b0 63 59 00       	mov    eax,0x5963b0
  5483d9:	e9 12 34 01 00       	jmp    0x55b7f0
  5483de:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  5483e1:	50                   	push   eax
  5483e2:	e8 69 29 01 00       	call   0x55ad50
  5483e7:	83 c4 04             	add    esp,0x4
  5483ea:	c3                   	ret
  5483eb:	cc                   	int3
  5483ec:	cc                   	int3
  5483ed:	cc                   	int3
  5483ee:	cc                   	int3
  5483ef:	cc                   	int3
  5483f0:	8b 41 08             	mov    eax,DWORD PTR [ecx+0x8]
  5483f3:	8b 54 24 08          	mov    edx,DWORD PTR [esp+0x8]
  5483f7:	39 41 04             	cmp    DWORD PTR [ecx+0x4],eax
  5483fa:	8b 09                	mov    ecx,DWORD PTR [ecx]
  5483fc:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  548400:	50                   	push   eax
  548401:	52                   	push   edx
  548402:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  548406:	50                   	push   eax
  548407:	8b 01                	mov    eax,DWORD PTR [ecx]
  548409:	73 06                	jae    0x548411
  54840b:	ff 50 08             	call   DWORD PTR [eax+0x8]
  54840e:	c2 0c 00             	ret    0xc
  548411:	ff 50 04             	call   DWORD PTR [eax+0x4]
  548414:	c2 0c 00             	ret    0xc
  548417:	cc                   	int3
  548418:	cc                   	int3
  548419:	cc                   	int3
  54841a:	cc                   	int3
  54841b:	cc                   	int3
  54841c:	cc                   	int3
  54841d:	cc                   	int3
  54841e:	cc                   	int3
  54841f:	cc                   	int3
