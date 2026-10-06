
/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0051f030 <.text+0x11e030>:
  51f030:	66 8b 44 24 08       	mov    ax,WORD PTR [esp+0x8]
  51f035:	83 ec 14             	sub    esp,0x14
  51f038:	66 89 44 24 04       	mov    WORD PTR [esp+0x4],ax
  51f03d:	53                   	push   ebx
  51f03e:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  51f042:	56                   	push   esi
  51f043:	8b 4c 24 2c          	mov    ecx,DWORD PTR [esp+0x2c]
  51f047:	57                   	push   edi
  51f048:	28 44 24 10          	sub    BYTE PTR [esp+0x10],al
  51f04c:	55                   	push   ebp
  51f04d:	40                   	inc    eax
  51f04e:	28 4c 24 15          	sub    BYTE PTR [esp+0x15],cl
  51f052:	41                   	inc    ecx
  51f053:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  51f057:	c6 44 24 13 00       	mov    BYTE PTR [esp+0x13],0x0
  51f05c:	80 7c 24 44 00       	cmp    BYTE PTR [esp+0x44],0x0
  51f061:	0f 85 28 02 00 00    	jne    0x51f28f
  51f067:	8b 6c 24 40          	mov    ebp,DWORD PTR [esp+0x40]
  51f06b:	85 ed                	test   ebp,ebp
  51f06d:	74 07                	je     0x51f076
  51f06f:	c7 45 00 00 00 00 00 	mov    DWORD PTR [ebp+0x0],0x0
  51f076:	66 8b 44 24 14       	mov    ax,WORD PTR [esp+0x14]
  51f07b:	89 4c 24 1c          	mov    DWORD PTR [esp+0x1c],ecx
  51f07f:	66 89 44 24 16       	mov    WORD PTR [esp+0x16],ax
  51f084:	85 c9                	test   ecx,ecx
  51f086:	0f 84 ce 03 00 00    	je     0x51f45a
  51f08c:	8b 74 24 28          	mov    esi,DWORD PTR [esp+0x28]
  51f090:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  51f095:	0f 85 bf 03 00 00    	jne    0x51f45a
  51f09b:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  51f09f:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  51f0a3:	85 c0                	test   eax,eax
  51f0a5:	0f 84 c3 01 00 00    	je     0x51f26e
  51f0ab:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  51f0b0:	0f 85 b8 01 00 00    	jne    0x51f26e
  51f0b6:	33 c0                	xor    eax,eax
  51f0b8:	33 c9                	xor    ecx,ecx
  51f0ba:	66 8b 44 24 16       	mov    ax,WORD PTR [esp+0x16]
  51f0bf:	66 8b 4c 24 16       	mov    cx,WORD PTR [esp+0x16]
  51f0c4:	25 fe 00 00 00       	and    eax,0xfe
  51f0c9:	03 c0                	add    eax,eax
  51f0cb:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  51f0d1:	0b c1                	or     eax,ecx
  51f0d3:	0f bf 14 85 ea 03 8a 	movsx  edx,WORD PTR [eax*4+0x8a03ea]
  51f0da:	00
  51f0db:	8b 3c 95 90 03 89 00 	mov    edi,DWORD PTR [edx*4+0x890390]
  51f0e2:	85 ff                	test   edi,edi
  51f0e4:	0f 84 70 01 00 00    	je     0x51f25a
  51f0ea:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  51f0ef:	0f 85 65 01 00 00    	jne    0x51f25a
  51f0f5:	80 7f 2a 01          	cmp    BYTE PTR [edi+0x2a],0x1
  51f0f9:	0f 85 46 01 00 00    	jne    0x51f245
  51f0ff:	8a 47 2b             	mov    al,BYTE PTR [edi+0x2b]
  51f102:	3c 04                	cmp    al,0x4
  51f104:	74 35                	je     0x51f13b
  51f106:	3c 07                	cmp    al,0x7
  51f108:	74 31                	je     0x51f13b
  51f10a:	80 7c 24 3c 00       	cmp    BYTE PTR [esp+0x3c],0x0
  51f10f:	0f 84 30 01 00 00    	je     0x51f245
  51f115:	85 ed                	test   ebp,ebp
  51f117:	0f 84 28 01 00 00    	je     0x51f245
  51f11d:	8a 47 2f             	mov    al,BYTE PTR [edi+0x2f]
  51f120:	38 46 2f             	cmp    BYTE PTR [esi+0x2f],al
  51f123:	0f 85 1c 01 00 00    	jne    0x51f245
  51f129:	80 7f 2c 17          	cmp    BYTE PTR [edi+0x2c],0x17
  51f12d:	0f 85 12 01 00 00    	jne    0x51f245
  51f133:	89 7d 00             	mov    DWORD PTR [ebp+0x0],edi
  51f136:	e9 0a 01 00 00       	jmp    0x51f245
  51f13b:	66 83 bf 9d 00 00 00 	cmp    WORD PTR [edi+0x9d],0x0
  51f142:	00
  51f143:	0f 85 fc 00 00 00    	jne    0x51f245
  51f149:	8b 57 0c             	mov    edx,DWORD PTR [edi+0xc]
  51f14c:	f7 c2 00 00 80 00    	test   edx,0x800000
  51f152:	0f 85 ed 00 00 00    	jne    0x51f245
  51f158:	b0 01                	mov    al,0x1
  51f15a:	33 c9                	xor    ecx,ecx
  51f15c:	8a 4f 2c             	mov    cl,BYTE PTR [edi+0x2c]
  51f15f:	f6 84 89 7a 6f 5a 00 	test   BYTE PTR [ecx+ecx*4+0x5a6f7a],0x4
  51f166:	04
  51f167:	74 02                	je     0x51f16b
  51f169:	32 c0                	xor    al,al
  51f16b:	84 c0                	test   al,al
  51f16d:	0f 84 d2 00 00 00    	je     0x51f245
  51f173:	c6 44 24 12 01       	mov    BYTE PTR [esp+0x12],0x1
  51f178:	66 83 7f 6e 00       	cmp    WORD PTR [edi+0x6e],0x0
  51f17d:	0f 8e a7 00 00 00    	jle    0x51f22a
  51f183:	f7 c2 00 00 01 00    	test   edx,0x10000
  51f189:	0f 85 9b 00 00 00    	jne    0x51f22a
  51f18f:	8a 5e 2f             	mov    bl,BYTE PTR [esi+0x2f]
  51f192:	80 fb ff             	cmp    bl,0xff
  51f195:	74 1d                	je     0x51f1b4
  51f197:	8a 4f 2f             	mov    cl,BYTE PTR [edi+0x2f]
  51f19a:	80 f9 ff             	cmp    cl,0xff
  51f19d:	74 15                	je     0x51f1b4
  51f19f:	3a d9                	cmp    bl,cl
  51f1a1:	74 11                	je     0x51f1b4
  51f1a3:	0f be c3             	movsx  eax,bl
  51f1a6:	b2 01                	mov    dl,0x1
  51f1a8:	8a 80 b6 08 96 00    	mov    al,BYTE PTR [eax+0x9608b6]
  51f1ae:	d2 e2                	shl    dl,cl
  51f1b0:	22 c2                	and    al,dl
  51f1b2:	eb 02                	jmp    0x51f1b6
  51f1b4:	b0 01                	mov    al,0x1
  51f1b6:	84 c0                	test   al,al
  51f1b8:	75 70                	jne    0x51f22a
  51f1ba:	8a 47 2f             	mov    al,BYTE PTR [edi+0x2f]
  51f1bd:	3a d8                	cmp    bl,al
  51f1bf:	74 69                	je     0x51f22a
  51f1c1:	3c ff                	cmp    al,0xff
  51f1c3:	74 65                	je     0x51f22a
  51f1c5:	0f be c3             	movsx  eax,bl
  51f1c8:	50                   	push   eax
  51f1c9:	57                   	push   edi
  51f1ca:	e8 e1 f5 fb ff       	call   0x4de7b0
  51f1cf:	83 c4 08             	add    esp,0x8
  51f1d2:	85 c0                	test   eax,eax
  51f1d4:	75 54                	jne    0x51f22a
  51f1d6:	0f be 47 2f          	movsx  eax,BYTE PTR [edi+0x2f]
  51f1da:	50                   	push   eax
  51f1db:	56                   	push   esi
  51f1dc:	e8 cf f5 fb ff       	call   0x4de7b0
  51f1e1:	83 c4 08             	add    esp,0x8
  51f1e4:	85 c0                	test   eax,eax
  51f1e6:	75 42                	jne    0x51f22a
  51f1e8:	f6 47 11 10          	test   BYTE PTR [edi+0x11],0x10
  51f1ec:	75 3c                	jne    0x51f22a
  51f1ee:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  51f1f1:	3c 04                	cmp    al,0x4
  51f1f3:	75 16                	jne    0x51f20b
  51f1f5:	f6 05 7c d1 89 00 02 	test   BYTE PTR ds:0x89d17c,0x2
  51f1fc:	75 31                	jne    0x51f22f
  51f1fe:	8a 47 2b             	mov    al,BYTE PTR [edi+0x2b]
  51f201:	3c 04                	cmp    al,0x4
  51f203:	74 2a                	je     0x51f22f
  51f205:	3c 07                	cmp    al,0x7
  51f207:	74 26                	je     0x51f22f
  51f209:	eb 1f                	jmp    0x51f22a
  51f20b:	3c 06                	cmp    al,0x6
  51f20d:	75 11                	jne    0x51f220
  51f20f:	f6 05 7c d1 89 00 02 	test   BYTE PTR ds:0x89d17c,0x2
  51f216:	74 17                	je     0x51f22f
  51f218:	80 7f 2b 07          	cmp    BYTE PTR [edi+0x2b],0x7
  51f21c:	75 11                	jne    0x51f22f
  51f21e:	eb 0a                	jmp    0x51f22a
  51f220:	3c 08                	cmp    al,0x8
  51f222:	74 0b                	je     0x51f22f
  51f224:	80 7f 2b 08          	cmp    BYTE PTR [edi+0x2b],0x8
  51f228:	75 05                	jne    0x51f22f
  51f22a:	c6 44 24 12 00       	mov    BYTE PTR [esp+0x12],0x0
  51f22f:	80 7c 24 12 00       	cmp    BYTE PTR [esp+0x12],0x0
  51f234:	74 0f                	je     0x51f245
  51f236:	66 83 bf 9f 00 00 00 	cmp    WORD PTR [edi+0x9f],0x0
  51f23d:	00
  51f23e:	75 05                	jne    0x51f245
  51f240:	c6 44 24 13 02       	mov    BYTE PTR [esp+0x13],0x2
  51f245:	33 c0                	xor    eax,eax
  51f247:	66 8b 47 20          	mov    ax,WORD PTR [edi+0x20]
  51f24b:	8b 3c 85 90 03 89 00 	mov    edi,DWORD PTR [eax*4+0x890390]
  51f252:	85 ff                	test   edi,edi
  51f254:	0f 85 90 fe ff ff    	jne    0x51f0ea
  51f25a:	80 44 24 16 02       	add    BYTE PTR [esp+0x16],0x2
  51f25f:	ff 4c 24 18          	dec    DWORD PTR [esp+0x18]
  51f263:	83 7c 24 18 00       	cmp    DWORD PTR [esp+0x18],0x0
  51f268:	0f 85 3d fe ff ff    	jne    0x51f0ab
  51f26e:	8a 44 24 14          	mov    al,BYTE PTR [esp+0x14]
  51f272:	ff 4c 24 1c          	dec    DWORD PTR [esp+0x1c]
  51f276:	80 44 24 17 02       	add    BYTE PTR [esp+0x17],0x2
  51f27b:	83 7c 24 1c 00       	cmp    DWORD PTR [esp+0x1c],0x0
  51f280:	88 44 24 16          	mov    BYTE PTR [esp+0x16],al
  51f284:	0f 85 06 fe ff ff    	jne    0x51f090
  51f28a:	e9 cb 01 00 00       	jmp    0x51f45a
  51f28f:	66 8b 44 24 14       	mov    ax,WORD PTR [esp+0x14]
  51f294:	8b 6c 24 48          	mov    ebp,DWORD PTR [esp+0x48]
  51f298:	66 89 44 24 16       	mov    WORD PTR [esp+0x16],ax
  51f29d:	89 4c 24 1c          	mov    DWORD PTR [esp+0x1c],ecx
  51f2a1:	c7 45 00 00 00 00 00 	mov    DWORD PTR [ebp+0x0],0x0
  51f2a8:	85 c9                	test   ecx,ecx
  51f2aa:	0f 84 aa 01 00 00    	je     0x51f45a
  51f2b0:	8b 74 24 28          	mov    esi,DWORD PTR [esp+0x28]
  51f2b4:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  51f2b9:	0f 85 9b 01 00 00    	jne    0x51f45a
  51f2bf:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  51f2c3:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  51f2c7:	85 c0                	test   eax,eax
  51f2c9:	0f 84 6f 01 00 00    	je     0x51f43e
  51f2cf:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  51f2d4:	0f 85 64 01 00 00    	jne    0x51f43e
  51f2da:	33 c0                	xor    eax,eax
  51f2dc:	33 c9                	xor    ecx,ecx
  51f2de:	66 8b 44 24 16       	mov    ax,WORD PTR [esp+0x16]
  51f2e3:	66 8b 4c 24 16       	mov    cx,WORD PTR [esp+0x16]
  51f2e8:	25 fe 00 00 00       	and    eax,0xfe
  51f2ed:	03 c0                	add    eax,eax
  51f2ef:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  51f2f5:	0b c1                	or     eax,ecx
  51f2f7:	0f bf 14 85 ea 03 8a 	movsx  edx,WORD PTR [eax*4+0x8a03ea]
  51f2fe:	00
  51f2ff:	8b 3c 95 90 03 89 00 	mov    edi,DWORD PTR [edx*4+0x890390]
  51f306:	85 ff                	test   edi,edi
  51f308:	0f 84 1c 01 00 00    	je     0x51f42a
  51f30e:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  51f313:	0f 85 11 01 00 00    	jne    0x51f42a
  51f319:	80 7f 2a 01          	cmp    BYTE PTR [edi+0x2a],0x1
  51f31d:	0f 85 f2 00 00 00    	jne    0x51f415
  51f323:	8a 47 2b             	mov    al,BYTE PTR [edi+0x2b]
  51f326:	3c 04                	cmp    al,0x4
  51f328:	0f 84 e7 00 00 00    	je     0x51f415
  51f32e:	3c 07                	cmp    al,0x7
  51f330:	0f 84 df 00 00 00    	je     0x51f415
  51f336:	c6 44 24 12 01       	mov    BYTE PTR [esp+0x12],0x1
  51f33b:	66 83 7e 6e 00       	cmp    WORD PTR [esi+0x6e],0x0
  51f340:	0f 8e a5 00 00 00    	jle    0x51f3eb
  51f346:	f6 46 0e 01          	test   BYTE PTR [esi+0xe],0x1
  51f34a:	0f 85 9b 00 00 00    	jne    0x51f3eb
  51f350:	8a 5f 2f             	mov    bl,BYTE PTR [edi+0x2f]
  51f353:	80 fb ff             	cmp    bl,0xff
  51f356:	74 1d                	je     0x51f375
  51f358:	8a 4e 2f             	mov    cl,BYTE PTR [esi+0x2f]
  51f35b:	80 f9 ff             	cmp    cl,0xff
  51f35e:	74 15                	je     0x51f375
  51f360:	3a cb                	cmp    cl,bl
  51f362:	74 11                	je     0x51f375
  51f364:	0f be c3             	movsx  eax,bl
  51f367:	b2 01                	mov    dl,0x1
  51f369:	8a 80 b6 08 96 00    	mov    al,BYTE PTR [eax+0x9608b6]
  51f36f:	d2 e2                	shl    dl,cl
  51f371:	22 c2                	and    al,dl
  51f373:	eb 02                	jmp    0x51f377
  51f375:	b0 01                	mov    al,0x1
  51f377:	84 c0                	test   al,al
  51f379:	75 70                	jne    0x51f3eb
  51f37b:	8a 46 2f             	mov    al,BYTE PTR [esi+0x2f]
  51f37e:	3a c3                	cmp    al,bl
  51f380:	74 69                	je     0x51f3eb
  51f382:	3c ff                	cmp    al,0xff
  51f384:	74 65                	je     0x51f3eb
  51f386:	0f be c3             	movsx  eax,bl
  51f389:	50                   	push   eax
  51f38a:	56                   	push   esi
  51f38b:	e8 20 f4 fb ff       	call   0x4de7b0
  51f390:	83 c4 08             	add    esp,0x8
  51f393:	85 c0                	test   eax,eax
  51f395:	75 54                	jne    0x51f3eb
  51f397:	0f be 46 2f          	movsx  eax,BYTE PTR [esi+0x2f]
  51f39b:	50                   	push   eax
  51f39c:	57                   	push   edi
  51f39d:	e8 0e f4 fb ff       	call   0x4de7b0
  51f3a2:	83 c4 08             	add    esp,0x8
  51f3a5:	85 c0                	test   eax,eax
  51f3a7:	75 42                	jne    0x51f3eb
  51f3a9:	f6 46 11 10          	test   BYTE PTR [esi+0x11],0x10
  51f3ad:	75 3c                	jne    0x51f3eb
  51f3af:	8a 47 2b             	mov    al,BYTE PTR [edi+0x2b]
  51f3b2:	3c 04                	cmp    al,0x4
  51f3b4:	75 16                	jne    0x51f3cc
  51f3b6:	f6 05 7c d1 89 00 02 	test   BYTE PTR ds:0x89d17c,0x2
  51f3bd:	75 31                	jne    0x51f3f0
  51f3bf:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  51f3c2:	3c 04                	cmp    al,0x4
  51f3c4:	74 2a                	je     0x51f3f0
  51f3c6:	3c 07                	cmp    al,0x7
  51f3c8:	74 26                	je     0x51f3f0
  51f3ca:	eb 1f                	jmp    0x51f3eb
  51f3cc:	3c 06                	cmp    al,0x6
  51f3ce:	75 11                	jne    0x51f3e1
  51f3d0:	f6 05 7c d1 89 00 02 	test   BYTE PTR ds:0x89d17c,0x2
  51f3d7:	74 17                	je     0x51f3f0
  51f3d9:	80 7e 2b 07          	cmp    BYTE PTR [esi+0x2b],0x7
  51f3dd:	75 11                	jne    0x51f3f0
  51f3df:	eb 0a                	jmp    0x51f3eb
  51f3e1:	3c 08                	cmp    al,0x8
  51f3e3:	74 0b                	je     0x51f3f0
  51f3e5:	80 7e 2b 08          	cmp    BYTE PTR [esi+0x2b],0x8
  51f3e9:	75 05                	jne    0x51f3f0
  51f3eb:	c6 44 24 12 00       	mov    BYTE PTR [esp+0x12],0x0
  51f3f0:	80 7c 24 12 00       	cmp    BYTE PTR [esp+0x12],0x0
  51f3f5:	74 1e                	je     0x51f415
  51f3f7:	80 7f 2f ff          	cmp    BYTE PTR [edi+0x2f],0xff
  51f3fb:	74 18                	je     0x51f415
  51f3fd:	66 83 bf 9d 00 00 00 	cmp    WORD PTR [edi+0x9d],0x0
  51f404:	00
  51f405:	75 0e                	jne    0x51f415
  51f407:	80 7f 2c 17          	cmp    BYTE PTR [edi+0x2c],0x17
  51f40b:	74 08                	je     0x51f415
  51f40d:	c6 44 24 13 02       	mov    BYTE PTR [esp+0x13],0x2
  51f412:	89 7d 00             	mov    DWORD PTR [ebp+0x0],edi
  51f415:	33 c0                	xor    eax,eax
  51f417:	66 8b 47 20          	mov    ax,WORD PTR [edi+0x20]
  51f41b:	8b 3c 85 90 03 89 00 	mov    edi,DWORD PTR [eax*4+0x890390]
  51f422:	85 ff                	test   edi,edi
  51f424:	0f 85 e4 fe ff ff    	jne    0x51f30e
  51f42a:	80 44 24 16 02       	add    BYTE PTR [esp+0x16],0x2
  51f42f:	ff 4c 24 18          	dec    DWORD PTR [esp+0x18]
  51f433:	83 7c 24 18 00       	cmp    DWORD PTR [esp+0x18],0x0
  51f438:	0f 85 91 fe ff ff    	jne    0x51f2cf
  51f43e:	8a 44 24 14          	mov    al,BYTE PTR [esp+0x14]
  51f442:	ff 4c 24 1c          	dec    DWORD PTR [esp+0x1c]
  51f446:	80 44 24 17 02       	add    BYTE PTR [esp+0x17],0x2
  51f44b:	83 7c 24 1c 00       	cmp    DWORD PTR [esp+0x1c],0x0
  51f450:	88 44 24 16          	mov    BYTE PTR [esp+0x16],al
  51f454:	0f 85 5a fe ff ff    	jne    0x51f2b4
  51f45a:	8a 44 24 13          	mov    al,BYTE PTR [esp+0x13]
  51f45e:	5d                   	pop    ebp
  51f45f:	5f                   	pop    edi
  51f460:	5e                   	pop    esi
  51f461:	5b                   	pop    ebx
  51f462:	83 c4 14             	add    esp,0x14
  51f465:	c3                   	ret
