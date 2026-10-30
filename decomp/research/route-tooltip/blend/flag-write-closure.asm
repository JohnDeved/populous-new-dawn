  45982d:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  459834:	56                                              	push   esi
  459835:	57                                              	push   edi
  459836:	e8 a5 ca 0b 00                                  	call   0x5162e0
  45983b:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  45f02b:	80 7c 24 12 00                                  	cmp    BYTE PTR [esp+0x12],0x0
  45f030:	75 16                                           	jne    0x45f048
  45f032:	66 8b 46 06                                     	mov    ax,WORD PTR [esi+0x6]
  45f036:	66 a9 f0 01                                     	test   ax,0x1f0
  45f03a:	75 0c                                           	jne    0x45f048
  45f03c:	80 e4 fe                                        	and    ah,0xfe
  45f03f:	80 fc 02                                        	cmp    ah,0x2
  45f042:	0f 84 d4 01 00 00                               	je     0x45f21c
  45f048:	33 ff                                           	xor    edi,edi
  45f04a:	66 8b 3e                                        	mov    di,WORD PTR [esi]
  45f04d:	03 3d 18 df 59 00                               	add    edi,DWORD PTR ds:0x59df18
  45f053:	3b 3d 18 df 59 00                               	cmp    edi,DWORD PTR ds:0x59df18
  45f059:	0f 86 bd 01 00 00                               	jbe    0x45f21c
  45f05f:	66 8b 46 06                                     	mov    ax,WORD PTR [esi+0x6]
  45f063:	66 0f b6 4c 24 13                               	movzx  cx,BYTE PTR [esp+0x13]
  45f069:	66 25 0f 00                                     	and    ax,0xf
  45f06d:	66 0b c1                                        	or     ax,cx
  45f070:	0f b7 d0                                        	movzx  edx,ax
  45f073:	33 c0                                           	xor    eax,eax
  45f075:	89 15 74 a0 5d 00                               	mov    DWORD PTR ds:0x5da074,edx
  45f07b:	66 8b 5e 04                                     	mov    bx,WORD PTR [esi+0x4]
  45f07f:	a0 64 d1 89 00                                  	mov    al,ds:0x89d164
  45f084:	66 8b 4e 02                                     	mov    cx,WORD PTR [esi+0x2]
  45f088:	83 f8 01                                        	cmp    eax,0x1
  45f08b:	74 0e                                           	je     0x45f09b
  45f08d:	83 f8 02                                        	cmp    eax,0x2
  45f090:	0f 84 85 00 00 00                               	je     0x45f11b
  45f096:	e9 62 01 00 00                                  	jmp    0x45f1fd
  45f09b:	0f bf c1                                        	movsx  eax,cx
  45f09e:	0f bf cb                                        	movsx  ecx,bx
  45f0a1:	8b 15 86 bc 89 00                               	mov    edx,DWORD PTR ds:0x89bc86
  45f0a7:	89 44 24 20                                     	mov    DWORD PTR [esp+0x20],eax
  45f0ab:	8d 44 24 20                                     	lea    eax,[esp+0x20]
  45f0af:	89 4c 24 1c                                     	mov    DWORD PTR [esp+0x1c],ecx
  45f0b3:	8d 4c 24 1c                                     	lea    ecx,[esp+0x1c]
  45f0b7:	51                                              	push   ecx
  45f0b8:	50                                              	push   eax
  45f0b9:	52                                              	push   edx
  45f0ba:	e8 d1 6f 01 00                                  	call   0x476090
  45f0bf:	8d 4c 24 24                                     	lea    ecx,[esp+0x24]
  45f0c3:	83 c4 0c                                        	add    esp,0xc
  45f0c6:	33 c0                                           	xor    eax,eax
  45f0c8:	8b 15 86 bc 89 00                               	mov    edx,DWORD PTR ds:0x89bc86
  45f0ce:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  45f0d2:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  45f0d6:	33 c0                                           	xor    eax,eax
  45f0d8:	66 8b 47 06                                     	mov    ax,WORD PTR [edi+0x6]
  45f0dc:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  45f0e0:	8d 44 24 14                                     	lea    eax,[esp+0x14]
  45f0e4:	50                                              	push   eax
  45f0e5:	51                                              	push   ecx
  45f0e6:	52                                              	push   edx
  45f0e7:	e8 a4 6f 01 00                                  	call   0x476090
  45f0ec:	8b 4c 24 20                                     	mov    ecx,DWORD PTR [esp+0x20]
  45f0f0:	8b 54 24 24                                     	mov    edx,DWORD PTR [esp+0x24]
  45f0f4:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f0f9:	03 44 24 28                                     	add    eax,DWORD PTR [esp+0x28]
  45f0fd:	83 c4 0c                                        	add    esp,0xc
  45f100:	51                                              	push   ecx
  45f101:	52                                              	push   edx
  45f102:	57                                              	push   edi
  45f103:	50                                              	push   eax
  45f104:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f109:	03 44 24 30                                     	add    eax,DWORD PTR [esp+0x30]
  45f10d:	50                                              	push   eax
  45f10e:	e8 1d 73 0b 00                                  	call   0x516430
  45f113:	83 c4 14                                        	add    esp,0x14
  45f116:	e9 01 01 00 00                                  	jmp    0x45f21c
  45f11b:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  45f124:	0f 8e d3 00 00 00                               	jle    0x45f1fd
  45f12a:	0f bf 05 cf c6 89 00                            	movsx  eax,WORD PTR ds:0x89c6cf
  45f131:	c1 e0 08                                        	shl    eax,0x8
  45f134:	bd 80 02 00 00                                  	mov    ebp,0x280
  45f139:	99                                              	cdq
  45f13a:	f7 fd                                           	idiv   ebp
  45f13c:	03 c0                                           	add    eax,eax
  45f13e:	bd e0 01 00 00                                  	mov    ebp,0x1e0
  45f143:	8d 14 40                                        	lea    edx,[eax+eax*2]
  45f146:	8d 04 92                                        	lea    eax,[edx+edx*4]
  45f149:	99                                              	cdq
  45f14a:	83 e2 1f                                        	and    edx,0x1f
  45f14d:	03 c2                                           	add    eax,edx
  45f14f:	c1 f8 05                                        	sar    eax,0x5
  45f152:	89 44 24 24                                     	mov    DWORD PTR [esp+0x24],eax
  45f156:	0f bf 05 d1 c6 89 00                            	movsx  eax,WORD PTR ds:0x89c6d1
  45f15d:	c1 e0 08                                        	shl    eax,0x8
  45f160:	99                                              	cdq
  45f161:	f7 fd                                           	idiv   ebp
  45f163:	03 c0                                           	add    eax,eax
  45f165:	8d 14 40                                        	lea    edx,[eax+eax*2]
  45f168:	8d 04 92                                        	lea    eax,[edx+edx*4]
  45f16b:	99                                              	cdq
  45f16c:	83 e2 1f                                        	and    edx,0x1f
  45f16f:	03 c2                                           	add    eax,edx
  45f171:	c1 f8 05                                        	sar    eax,0x5
  45f174:	8b e8                                           	mov    ebp,eax
  45f176:	0f bf c1                                        	movsx  eax,cx
  45f179:	0f af 44 24 24                                  	imul   eax,DWORD PTR [esp+0x24]
  45f17e:	99                                              	cdq
  45f17f:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f185:	03 c2                                           	add    eax,edx
  45f187:	c1 f8 08                                        	sar    eax,0x8
  45f18a:	89 44 24 20                                     	mov    DWORD PTR [esp+0x20],eax
  45f18e:	0f bf c3                                        	movsx  eax,bx
  45f191:	0f af c5                                        	imul   eax,ebp
  45f194:	99                                              	cdq
  45f195:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f19b:	03 c2                                           	add    eax,edx
  45f19d:	c1 f8 08                                        	sar    eax,0x8
  45f1a0:	89 44 24 1c                                     	mov    DWORD PTR [esp+0x1c],eax
  45f1a4:	33 c0                                           	xor    eax,eax
  45f1a6:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  45f1aa:	0f af 44 24 24                                  	imul   eax,DWORD PTR [esp+0x24]
  45f1af:	99                                              	cdq
  45f1b0:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f1b6:	03 c2                                           	add    eax,edx
  45f1b8:	c1 f8 08                                        	sar    eax,0x8
  45f1bb:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  45f1bf:	33 c0                                           	xor    eax,eax
  45f1c1:	66 8b 47 06                                     	mov    ax,WORD PTR [edi+0x6]
  45f1c5:	8b 4c 24 18                                     	mov    ecx,DWORD PTR [esp+0x18]
  45f1c9:	0f af c5                                        	imul   eax,ebp
  45f1cc:	99                                              	cdq
  45f1cd:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f1d3:	03 c2                                           	add    eax,edx
  45f1d5:	c1 f8 08                                        	sar    eax,0x8
  45f1d8:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  45f1dc:	50                                              	push   eax
  45f1dd:	51                                              	push   ecx
  45f1de:	57                                              	push   edi
  45f1df:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f1e4:	03 44 24 28                                     	add    eax,DWORD PTR [esp+0x28]
  45f1e8:	50                                              	push   eax
  45f1e9:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f1ee:	03 44 24 30                                     	add    eax,DWORD PTR [esp+0x30]
  45f1f2:	50                                              	push   eax
  45f1f3:	e8 38 72 0b 00                                  	call   0x516430
  45f1f8:	83 c4 14                                        	add    esp,0x14
  45f1fb:	eb 1f                                           	jmp    0x45f21c
  45f1fd:	0f bf c3                                        	movsx  eax,bx
  45f200:	0f bf 54 24 34                                  	movsx  edx,WORD PTR [esp+0x34]
  45f205:	57                                              	push   edi
  45f206:	03 c2                                           	add    eax,edx
  45f208:	50                                              	push   eax
  45f209:	0f bf c1                                        	movsx  eax,cx
  45f20c:	0f bf 4c 24 38                                  	movsx  ecx,WORD PTR [esp+0x38]
  45f211:	03 c1                                           	add    eax,ecx
  45f213:	50                                              	push   eax
  45f214:	e8 c7 70 0b 00                                  	call   0x5162e0
  45f219:	83 c4 0c                                        	add    esp,0xc
  45f21c:	33 c0                                           	xor    eax,eax
  45f21e:	66 8b 46 08                                     	mov    ax,WORD PTR [esi+0x8]
  45f222:	8d 04 80                                        	lea    eax,[eax+eax*4]
  45f225:	03 c0                                           	add    eax,eax
  45f227:	03 05 4c df 59 00                               	add    eax,DWORD PTR ds:0x59df4c
  45f22d:	8b f0                                           	mov    esi,eax
  45f22f:	3b 35 4c df 59 00                               	cmp    esi,DWORD PTR ds:0x59df4c
  45f235:	0f 87 f0 fd ff ff                               	ja     0x45f02b
  45f23b:	e9 3e 02 00 00                                  	jmp    0x45f47e
  45f26b:	80 7c 24 12 00                                  	cmp    BYTE PTR [esp+0x12],0x0
  45f270:	75 16                                           	jne    0x45f288
  45f272:	66 8b 46 06                                     	mov    ax,WORD PTR [esi+0x6]
  45f276:	66 a9 f0 01                                     	test   ax,0x1f0
  45f27a:	75 0c                                           	jne    0x45f288
  45f27c:	80 e4 fe                                        	and    ah,0xfe
  45f27f:	80 fc 02                                        	cmp    ah,0x2
  45f282:	0f 84 d7 01 00 00                               	je     0x45f45f
  45f288:	33 ff                                           	xor    edi,edi
  45f28a:	66 8b 3e                                        	mov    di,WORD PTR [esi]
  45f28d:	03 3d 18 df 59 00                               	add    edi,DWORD PTR ds:0x59df18
  45f293:	3b 3d 18 df 59 00                               	cmp    edi,DWORD PTR ds:0x59df18
  45f299:	0f 86 c0 01 00 00                               	jbe    0x45f45f
  45f29f:	66 8b 46 06                                     	mov    ax,WORD PTR [esi+0x6]
  45f2a3:	33 c9                                           	xor    ecx,ecx
  45f2a5:	24 0f                                           	and    al,0xf
  45f2a7:	0a 44 24 13                                     	or     al,BYTE PTR [esp+0x13]
  45f2ab:	34 01                                           	xor    al,0x1
  45f2ad:	8a c8                                           	mov    cl,al
  45f2af:	33 c0                                           	xor    eax,eax
  45f2b1:	a0 64 d1 89 00                                  	mov    al,ds:0x89d164
  45f2b6:	89 0d 74 a0 5d 00                               	mov    DWORD PTR ds:0x5da074,ecx
  45f2bc:	66 8b 5e 04                                     	mov    bx,WORD PTR [esi+0x4]
  45f2c0:	66 8b 4e 02                                     	mov    cx,WORD PTR [esi+0x2]
  45f2c4:	66 03 4f 04                                     	add    cx,WORD PTR [edi+0x4]
  45f2c8:	66 f7 d9                                        	neg    cx
  45f2cb:	83 f8 01                                        	cmp    eax,0x1
  45f2ce:	74 0e                                           	je     0x45f2de
  45f2d0:	83 f8 02                                        	cmp    eax,0x2
  45f2d3:	0f 84 85 00 00 00                               	je     0x45f35e
  45f2d9:	e9 62 01 00 00                                  	jmp    0x45f440
  45f2de:	0f bf c1                                        	movsx  eax,cx
  45f2e1:	0f bf cb                                        	movsx  ecx,bx
  45f2e4:	8b 15 86 bc 89 00                               	mov    edx,DWORD PTR ds:0x89bc86
  45f2ea:	89 44 24 20                                     	mov    DWORD PTR [esp+0x20],eax
  45f2ee:	8d 44 24 20                                     	lea    eax,[esp+0x20]
  45f2f2:	89 4c 24 1c                                     	mov    DWORD PTR [esp+0x1c],ecx
  45f2f6:	8d 4c 24 1c                                     	lea    ecx,[esp+0x1c]
  45f2fa:	51                                              	push   ecx
  45f2fb:	50                                              	push   eax
  45f2fc:	52                                              	push   edx
  45f2fd:	e8 8e 6d 01 00                                  	call   0x476090
  45f302:	8d 4c 24 24                                     	lea    ecx,[esp+0x24]
  45f306:	83 c4 0c                                        	add    esp,0xc
  45f309:	33 c0                                           	xor    eax,eax
  45f30b:	8b 15 86 bc 89 00                               	mov    edx,DWORD PTR ds:0x89bc86
  45f311:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  45f315:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  45f319:	33 c0                                           	xor    eax,eax
  45f31b:	66 8b 47 06                                     	mov    ax,WORD PTR [edi+0x6]
  45f31f:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  45f323:	8d 44 24 14                                     	lea    eax,[esp+0x14]
  45f327:	50                                              	push   eax
  45f328:	51                                              	push   ecx
  45f329:	52                                              	push   edx
  45f32a:	e8 61 6d 01 00                                  	call   0x476090
  45f32f:	8b 4c 24 20                                     	mov    ecx,DWORD PTR [esp+0x20]
  45f333:	8b 54 24 24                                     	mov    edx,DWORD PTR [esp+0x24]
  45f337:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f33c:	03 44 24 28                                     	add    eax,DWORD PTR [esp+0x28]
  45f340:	83 c4 0c                                        	add    esp,0xc
  45f343:	51                                              	push   ecx
  45f344:	52                                              	push   edx
  45f345:	57                                              	push   edi
  45f346:	50                                              	push   eax
  45f347:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f34c:	03 44 24 30                                     	add    eax,DWORD PTR [esp+0x30]
  45f350:	50                                              	push   eax
  45f351:	e8 da 70 0b 00                                  	call   0x516430
  45f356:	83 c4 14                                        	add    esp,0x14
  45f359:	e9 01 01 00 00                                  	jmp    0x45f45f
  45f35e:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  45f367:	0f 8e d3 00 00 00                               	jle    0x45f440
  45f36d:	0f bf 05 cf c6 89 00                            	movsx  eax,WORD PTR ds:0x89c6cf
  45f374:	c1 e0 08                                        	shl    eax,0x8
  45f377:	bd 80 02 00 00                                  	mov    ebp,0x280
  45f37c:	99                                              	cdq
  45f37d:	f7 fd                                           	idiv   ebp
  45f37f:	03 c0                                           	add    eax,eax
  45f381:	bd e0 01 00 00                                  	mov    ebp,0x1e0
  45f386:	8d 14 40                                        	lea    edx,[eax+eax*2]
  45f389:	8d 04 92                                        	lea    eax,[edx+edx*4]
  45f38c:	99                                              	cdq
  45f38d:	83 e2 1f                                        	and    edx,0x1f
  45f390:	03 c2                                           	add    eax,edx
  45f392:	c1 f8 05                                        	sar    eax,0x5
  45f395:	89 44 24 24                                     	mov    DWORD PTR [esp+0x24],eax
  45f399:	0f bf 05 d1 c6 89 00                            	movsx  eax,WORD PTR ds:0x89c6d1
  45f3a0:	c1 e0 08                                        	shl    eax,0x8
  45f3a3:	99                                              	cdq
  45f3a4:	f7 fd                                           	idiv   ebp
  45f3a6:	03 c0                                           	add    eax,eax
  45f3a8:	8d 14 40                                        	lea    edx,[eax+eax*2]
  45f3ab:	8d 04 92                                        	lea    eax,[edx+edx*4]
  45f3ae:	99                                              	cdq
  45f3af:	83 e2 1f                                        	and    edx,0x1f
  45f3b2:	03 c2                                           	add    eax,edx
  45f3b4:	c1 f8 05                                        	sar    eax,0x5
  45f3b7:	8b e8                                           	mov    ebp,eax
  45f3b9:	0f bf c1                                        	movsx  eax,cx
  45f3bc:	0f af 44 24 24                                  	imul   eax,DWORD PTR [esp+0x24]
  45f3c1:	99                                              	cdq
  45f3c2:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f3c8:	03 c2                                           	add    eax,edx
  45f3ca:	c1 f8 08                                        	sar    eax,0x8
  45f3cd:	89 44 24 20                                     	mov    DWORD PTR [esp+0x20],eax
  45f3d1:	0f bf c3                                        	movsx  eax,bx
  45f3d4:	0f af c5                                        	imul   eax,ebp
  45f3d7:	99                                              	cdq
  45f3d8:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f3de:	03 c2                                           	add    eax,edx
  45f3e0:	c1 f8 08                                        	sar    eax,0x8
  45f3e3:	89 44 24 1c                                     	mov    DWORD PTR [esp+0x1c],eax
  45f3e7:	33 c0                                           	xor    eax,eax
  45f3e9:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  45f3ed:	0f af 44 24 24                                  	imul   eax,DWORD PTR [esp+0x24]
  45f3f2:	99                                              	cdq
  45f3f3:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f3f9:	03 c2                                           	add    eax,edx
  45f3fb:	c1 f8 08                                        	sar    eax,0x8
  45f3fe:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  45f402:	33 c0                                           	xor    eax,eax
  45f404:	66 8b 47 06                                     	mov    ax,WORD PTR [edi+0x6]
  45f408:	8b 4c 24 18                                     	mov    ecx,DWORD PTR [esp+0x18]
  45f40c:	0f af c5                                        	imul   eax,ebp
  45f40f:	99                                              	cdq
  45f410:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f416:	03 c2                                           	add    eax,edx
  45f418:	c1 f8 08                                        	sar    eax,0x8
  45f41b:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  45f41f:	50                                              	push   eax
  45f420:	51                                              	push   ecx
  45f421:	57                                              	push   edi
  45f422:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f427:	03 44 24 28                                     	add    eax,DWORD PTR [esp+0x28]
  45f42b:	50                                              	push   eax
  45f42c:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f431:	03 44 24 30                                     	add    eax,DWORD PTR [esp+0x30]
  45f435:	50                                              	push   eax
  45f436:	e8 f5 6f 0b 00                                  	call   0x516430
  45f43b:	83 c4 14                                        	add    esp,0x14
  45f43e:	eb 1f                                           	jmp    0x45f45f
  45f440:	0f bf c3                                        	movsx  eax,bx
  45f443:	0f bf 54 24 34                                  	movsx  edx,WORD PTR [esp+0x34]
  45f448:	57                                              	push   edi
  45f449:	03 c2                                           	add    eax,edx
  45f44b:	50                                              	push   eax
  45f44c:	0f bf c1                                        	movsx  eax,cx
  45f44f:	0f bf 4c 24 38                                  	movsx  ecx,WORD PTR [esp+0x38]
  45f454:	03 c1                                           	add    eax,ecx
  45f456:	50                                              	push   eax
  45f457:	e8 84 6e 0b 00                                  	call   0x5162e0
  45f45c:	83 c4 0c                                        	add    esp,0xc
  45f45f:	33 c0                                           	xor    eax,eax
  45f461:	66 8b 46 08                                     	mov    ax,WORD PTR [esi+0x8]
  45f465:	8d 04 80                                        	lea    eax,[eax+eax*4]
  45f468:	03 c0                                           	add    eax,eax
  45f46a:	03 05 4c df 59 00                               	add    eax,DWORD PTR ds:0x59df4c
  45f470:	8b f0                                           	mov    esi,eax
  45f472:	3b 35 4c df 59 00                               	cmp    esi,DWORD PTR ds:0x59df4c
  45f478:	0f 87 ed fd ff ff                               	ja     0x45f26b
  45f47e:	33 c0                                           	xor    eax,eax
  45f480:	5d                                              	pop    ebp
  45f481:	5f                                              	pop    edi
  45f482:	a3 74 a0 5d 00                                  	mov    ds:0x5da074,eax
  45f4fb:	66 8b 56 06                                     	mov    dx,WORD PTR [esi+0x6]
  45f4ff:	32 c9                                           	xor    cl,cl
  45f501:	66 8b c2                                        	mov    ax,dx
  45f504:	66 25 f0 01                                     	and    ax,0x1f0
  45f508:	66 c1 e8 04                                     	shr    ax,0x4
  45f50c:	0f b7 c0                                        	movzx  eax,ax
  45f50f:	85 c0                                           	test   eax,eax
  45f511:	74 07                                           	je     0x45f51a
  45f513:	83 f8 01                                        	cmp    eax,0x1
  45f516:	74 16                                           	je     0x45f52e
  45f518:	eb 29                                           	jmp    0x45f543
  45f51a:	66 8b c2                                        	mov    ax,dx
  45f51d:	80 e4 fe                                        	and    ah,0xfe
  45f520:	80 fc 02                                        	cmp    ah,0x2
  45f523:	75 1c                                           	jne    0x45f541
  45f525:	80 7c 24 12 00                                  	cmp    BYTE PTR [esp+0x12],0x0
  45f52a:	74 17                                           	je     0x45f543
  45f52c:	eb 13                                           	jmp    0x45f541
  45f52e:	66 8b c2                                        	mov    ax,dx
  45f531:	0f be 7c 24 3c                                  	movsx  edi,BYTE PTR [esp+0x3c]
  45f536:	66 c1 e8 09                                     	shr    ax,0x9
  45f53a:	0f b7 d8                                        	movzx  ebx,ax
  45f53d:	3b fb                                           	cmp    edi,ebx
  45f53f:	75 02                                           	jne    0x45f543
  45f541:	b1 01                                           	mov    cl,0x1
  45f543:	84 c9                                           	test   cl,cl
  45f545:	0f 84 d0 01 00 00                               	je     0x45f71b
  45f54b:	33 ff                                           	xor    edi,edi
  45f54d:	66 8b 3e                                        	mov    di,WORD PTR [esi]
  45f550:	03 3d 18 df 59 00                               	add    edi,DWORD PTR ds:0x59df18
  45f556:	3b 3d 18 df 59 00                               	cmp    edi,DWORD PTR ds:0x59df18
  45f55c:	0f 86 b9 01 00 00                               	jbe    0x45f71b
  45f562:	66 83 e2 0f                                     	and    dx,0xf
  45f566:	66 0f b6 44 24 13                               	movzx  ax,BYTE PTR [esp+0x13]
  45f56c:	66 0b d0                                        	or     dx,ax
  45f56f:	33 c0                                           	xor    eax,eax
  45f571:	0f b7 ca                                        	movzx  ecx,dx
  45f574:	a0 64 d1 89 00                                  	mov    al,ds:0x89d164
  45f579:	89 0d 74 a0 5d 00                               	mov    DWORD PTR ds:0x5da074,ecx
  45f57f:	66 8b 5e 04                                     	mov    bx,WORD PTR [esi+0x4]
  45f583:	83 f8 01                                        	cmp    eax,0x1
  45f586:	66 8b 4e 02                                     	mov    cx,WORD PTR [esi+0x2]
  45f58a:	74 0e                                           	je     0x45f59a
  45f58c:	83 f8 02                                        	cmp    eax,0x2
  45f58f:	0f 84 85 00 00 00                               	je     0x45f61a
  45f595:	e9 62 01 00 00                                  	jmp    0x45f6fc
  45f59a:	0f bf c1                                        	movsx  eax,cx
  45f59d:	0f bf cb                                        	movsx  ecx,bx
  45f5a0:	8b 15 86 bc 89 00                               	mov    edx,DWORD PTR ds:0x89bc86
  45f5a6:	89 44 24 20                                     	mov    DWORD PTR [esp+0x20],eax
  45f5aa:	8d 44 24 20                                     	lea    eax,[esp+0x20]
  45f5ae:	89 4c 24 1c                                     	mov    DWORD PTR [esp+0x1c],ecx
  45f5b2:	8d 4c 24 1c                                     	lea    ecx,[esp+0x1c]
  45f5b6:	51                                              	push   ecx
  45f5b7:	50                                              	push   eax
  45f5b8:	52                                              	push   edx
  45f5b9:	e8 d2 6a 01 00                                  	call   0x476090
  45f5be:	8d 4c 24 24                                     	lea    ecx,[esp+0x24]
  45f5c2:	83 c4 0c                                        	add    esp,0xc
  45f5c5:	33 c0                                           	xor    eax,eax
  45f5c7:	8b 15 86 bc 89 00                               	mov    edx,DWORD PTR ds:0x89bc86
  45f5cd:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  45f5d1:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  45f5d5:	33 c0                                           	xor    eax,eax
  45f5d7:	66 8b 47 06                                     	mov    ax,WORD PTR [edi+0x6]
  45f5db:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  45f5df:	8d 44 24 14                                     	lea    eax,[esp+0x14]
  45f5e3:	50                                              	push   eax
  45f5e4:	51                                              	push   ecx
  45f5e5:	52                                              	push   edx
  45f5e6:	e8 a5 6a 01 00                                  	call   0x476090
  45f5eb:	8b 4c 24 20                                     	mov    ecx,DWORD PTR [esp+0x20]
  45f5ef:	8b 54 24 24                                     	mov    edx,DWORD PTR [esp+0x24]
  45f5f3:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f5f8:	03 44 24 28                                     	add    eax,DWORD PTR [esp+0x28]
  45f5fc:	83 c4 0c                                        	add    esp,0xc
  45f5ff:	51                                              	push   ecx
  45f600:	52                                              	push   edx
  45f601:	57                                              	push   edi
  45f602:	50                                              	push   eax
  45f603:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f608:	03 44 24 30                                     	add    eax,DWORD PTR [esp+0x30]
  45f60c:	50                                              	push   eax
  45f60d:	e8 1e 6e 0b 00                                  	call   0x516430
  45f612:	83 c4 14                                        	add    esp,0x14
  45f615:	e9 01 01 00 00                                  	jmp    0x45f71b
  45f61a:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  45f623:	0f 8e d3 00 00 00                               	jle    0x45f6fc
  45f629:	0f bf 05 cf c6 89 00                            	movsx  eax,WORD PTR ds:0x89c6cf
  45f630:	c1 e0 08                                        	shl    eax,0x8
  45f633:	bd 80 02 00 00                                  	mov    ebp,0x280
  45f638:	99                                              	cdq
  45f639:	f7 fd                                           	idiv   ebp
  45f63b:	03 c0                                           	add    eax,eax
  45f63d:	bd e0 01 00 00                                  	mov    ebp,0x1e0
  45f642:	8d 14 40                                        	lea    edx,[eax+eax*2]
  45f645:	8d 04 92                                        	lea    eax,[edx+edx*4]
  45f648:	99                                              	cdq
  45f649:	83 e2 1f                                        	and    edx,0x1f
  45f64c:	03 c2                                           	add    eax,edx
  45f64e:	c1 f8 05                                        	sar    eax,0x5
  45f651:	89 44 24 24                                     	mov    DWORD PTR [esp+0x24],eax
  45f655:	0f bf 05 d1 c6 89 00                            	movsx  eax,WORD PTR ds:0x89c6d1
  45f65c:	c1 e0 08                                        	shl    eax,0x8
  45f65f:	99                                              	cdq
  45f660:	f7 fd                                           	idiv   ebp
  45f662:	03 c0                                           	add    eax,eax
  45f664:	8d 14 40                                        	lea    edx,[eax+eax*2]
  45f667:	8d 04 92                                        	lea    eax,[edx+edx*4]
  45f66a:	99                                              	cdq
  45f66b:	83 e2 1f                                        	and    edx,0x1f
  45f66e:	03 c2                                           	add    eax,edx
  45f670:	c1 f8 05                                        	sar    eax,0x5
  45f673:	8b e8                                           	mov    ebp,eax
  45f675:	0f bf c1                                        	movsx  eax,cx
  45f678:	0f af 44 24 24                                  	imul   eax,DWORD PTR [esp+0x24]
  45f67d:	99                                              	cdq
  45f67e:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f684:	03 c2                                           	add    eax,edx
  45f686:	c1 f8 08                                        	sar    eax,0x8
  45f689:	89 44 24 20                                     	mov    DWORD PTR [esp+0x20],eax
  45f68d:	0f bf c3                                        	movsx  eax,bx
  45f690:	0f af c5                                        	imul   eax,ebp
  45f693:	99                                              	cdq
  45f694:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f69a:	03 c2                                           	add    eax,edx
  45f69c:	c1 f8 08                                        	sar    eax,0x8
  45f69f:	89 44 24 1c                                     	mov    DWORD PTR [esp+0x1c],eax
  45f6a3:	33 c0                                           	xor    eax,eax
  45f6a5:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  45f6a9:	0f af 44 24 24                                  	imul   eax,DWORD PTR [esp+0x24]
  45f6ae:	99                                              	cdq
  45f6af:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f6b5:	03 c2                                           	add    eax,edx
  45f6b7:	c1 f8 08                                        	sar    eax,0x8
  45f6ba:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  45f6be:	33 c0                                           	xor    eax,eax
  45f6c0:	66 8b 47 06                                     	mov    ax,WORD PTR [edi+0x6]
  45f6c4:	8b 4c 24 18                                     	mov    ecx,DWORD PTR [esp+0x18]
  45f6c8:	0f af c5                                        	imul   eax,ebp
  45f6cb:	99                                              	cdq
  45f6cc:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f6d2:	03 c2                                           	add    eax,edx
  45f6d4:	c1 f8 08                                        	sar    eax,0x8
  45f6d7:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  45f6db:	50                                              	push   eax
  45f6dc:	51                                              	push   ecx
  45f6dd:	57                                              	push   edi
  45f6de:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f6e3:	03 44 24 28                                     	add    eax,DWORD PTR [esp+0x28]
  45f6e7:	50                                              	push   eax
  45f6e8:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f6ed:	03 44 24 30                                     	add    eax,DWORD PTR [esp+0x30]
  45f6f1:	50                                              	push   eax
  45f6f2:	e8 39 6d 0b 00                                  	call   0x516430
  45f6f7:	83 c4 14                                        	add    esp,0x14
  45f6fa:	eb 1f                                           	jmp    0x45f71b
  45f6fc:	0f bf 54 24 34                                  	movsx  edx,WORD PTR [esp+0x34]
  45f701:	0f bf c3                                        	movsx  eax,bx
  45f704:	57                                              	push   edi
  45f705:	03 d0                                           	add    edx,eax
  45f707:	52                                              	push   edx
  45f708:	0f bf c1                                        	movsx  eax,cx
  45f70b:	0f bf 54 24 38                                  	movsx  edx,WORD PTR [esp+0x38]
  45f710:	03 d0                                           	add    edx,eax
  45f712:	52                                              	push   edx
  45f713:	e8 c8 6b 0b 00                                  	call   0x5162e0
  45f718:	83 c4 0c                                        	add    esp,0xc
  45f71b:	33 c0                                           	xor    eax,eax
  45f71d:	66 8b 46 08                                     	mov    ax,WORD PTR [esi+0x8]
  45f721:	8d 04 80                                        	lea    eax,[eax+eax*4]
  45f724:	03 c0                                           	add    eax,eax
  45f726:	03 05 4c df 59 00                               	add    eax,DWORD PTR ds:0x59df4c
  45f72c:	8b f0                                           	mov    esi,eax
  45f72e:	3b 35 4c df 59 00                               	cmp    esi,DWORD PTR ds:0x59df4c
  45f734:	0f 87 c1 fd ff ff                               	ja     0x45f4fb
  45f73a:	e9 6e 02 00 00                                  	jmp    0x45f9ad
  45f76a:	66 8b 4e 06                                     	mov    cx,WORD PTR [esi+0x6]
  45f76e:	32 d2                                           	xor    dl,dl
  45f770:	66 8b c1                                        	mov    ax,cx
  45f773:	66 25 f0 01                                     	and    ax,0x1f0
  45f777:	66 c1 e8 04                                     	shr    ax,0x4
  45f77b:	0f b7 c0                                        	movzx  eax,ax
  45f77e:	85 c0                                           	test   eax,eax
  45f780:	74 07                                           	je     0x45f789
  45f782:	83 f8 01                                        	cmp    eax,0x1
  45f785:	74 16                                           	je     0x45f79d
  45f787:	eb 29                                           	jmp    0x45f7b2
  45f789:	66 8b c1                                        	mov    ax,cx
  45f78c:	80 e4 fe                                        	and    ah,0xfe
  45f78f:	80 fc 02                                        	cmp    ah,0x2
  45f792:	75 1c                                           	jne    0x45f7b0
  45f794:	80 7c 24 12 00                                  	cmp    BYTE PTR [esp+0x12],0x0
  45f799:	74 17                                           	je     0x45f7b2
  45f79b:	eb 13                                           	jmp    0x45f7b0
  45f79d:	66 8b c1                                        	mov    ax,cx
  45f7a0:	0f be 7c 24 3c                                  	movsx  edi,BYTE PTR [esp+0x3c]
  45f7a5:	66 c1 e8 09                                     	shr    ax,0x9
  45f7a9:	0f b7 d8                                        	movzx  ebx,ax
  45f7ac:	3b fb                                           	cmp    edi,ebx
  45f7ae:	75 02                                           	jne    0x45f7b2
  45f7b0:	b2 01                                           	mov    dl,0x1
  45f7b2:	84 d2                                           	test   dl,dl
  45f7b4:	0f 84 d4 01 00 00                               	je     0x45f98e
  45f7ba:	33 ff                                           	xor    edi,edi
  45f7bc:	66 8b 3e                                        	mov    di,WORD PTR [esi]
  45f7bf:	03 3d 18 df 59 00                               	add    edi,DWORD PTR ds:0x59df18
  45f7c5:	3b 3d 18 df 59 00                               	cmp    edi,DWORD PTR ds:0x59df18
  45f7cb:	0f 86 bd 01 00 00                               	jbe    0x45f98e
  45f7d1:	80 e1 0f                                        	and    cl,0xf
  45f7d4:	33 c0                                           	xor    eax,eax
  45f7d6:	0a 4c 24 13                                     	or     cl,BYTE PTR [esp+0x13]
  45f7da:	80 f1 01                                        	xor    cl,0x1
  45f7dd:	8a c1                                           	mov    al,cl
  45f7df:	a3 74 a0 5d 00                                  	mov    ds:0x5da074,eax
  45f7e4:	33 c0                                           	xor    eax,eax
  45f7e6:	66 8b 5e 04                                     	mov    bx,WORD PTR [esi+0x4]
  45f7ea:	a0 64 d1 89 00                                  	mov    al,ds:0x89d164
  45f7ef:	66 8b 4e 02                                     	mov    cx,WORD PTR [esi+0x2]
  45f7f3:	66 03 4f 04                                     	add    cx,WORD PTR [edi+0x4]
  45f7f7:	66 f7 d9                                        	neg    cx
  45f7fa:	83 f8 01                                        	cmp    eax,0x1
  45f7fd:	74 0e                                           	je     0x45f80d
  45f7ff:	83 f8 02                                        	cmp    eax,0x2
  45f802:	0f 84 85 00 00 00                               	je     0x45f88d
  45f808:	e9 62 01 00 00                                  	jmp    0x45f96f
  45f80d:	0f bf c1                                        	movsx  eax,cx
  45f810:	0f bf cb                                        	movsx  ecx,bx
  45f813:	8b 15 86 bc 89 00                               	mov    edx,DWORD PTR ds:0x89bc86
  45f819:	89 44 24 20                                     	mov    DWORD PTR [esp+0x20],eax
  45f81d:	8d 44 24 20                                     	lea    eax,[esp+0x20]
  45f821:	89 4c 24 1c                                     	mov    DWORD PTR [esp+0x1c],ecx
  45f825:	8d 4c 24 1c                                     	lea    ecx,[esp+0x1c]
  45f829:	51                                              	push   ecx
  45f82a:	50                                              	push   eax
  45f82b:	52                                              	push   edx
  45f82c:	e8 5f 68 01 00                                  	call   0x476090
  45f831:	8d 4c 24 24                                     	lea    ecx,[esp+0x24]
  45f835:	83 c4 0c                                        	add    esp,0xc
  45f838:	33 c0                                           	xor    eax,eax
  45f83a:	8b 15 86 bc 89 00                               	mov    edx,DWORD PTR ds:0x89bc86
  45f840:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  45f844:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  45f848:	33 c0                                           	xor    eax,eax
  45f84a:	66 8b 47 06                                     	mov    ax,WORD PTR [edi+0x6]
  45f84e:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  45f852:	8d 44 24 14                                     	lea    eax,[esp+0x14]
  45f856:	50                                              	push   eax
  45f857:	51                                              	push   ecx
  45f858:	52                                              	push   edx
  45f859:	e8 32 68 01 00                                  	call   0x476090
  45f85e:	8b 4c 24 20                                     	mov    ecx,DWORD PTR [esp+0x20]
  45f862:	8b 54 24 24                                     	mov    edx,DWORD PTR [esp+0x24]
  45f866:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f86b:	03 44 24 28                                     	add    eax,DWORD PTR [esp+0x28]
  45f86f:	83 c4 0c                                        	add    esp,0xc
  45f872:	51                                              	push   ecx
  45f873:	52                                              	push   edx
  45f874:	57                                              	push   edi
  45f875:	50                                              	push   eax
  45f876:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f87b:	03 44 24 30                                     	add    eax,DWORD PTR [esp+0x30]
  45f87f:	50                                              	push   eax
  45f880:	e8 ab 6b 0b 00                                  	call   0x516430
  45f885:	83 c4 14                                        	add    esp,0x14
  45f888:	e9 01 01 00 00                                  	jmp    0x45f98e
  45f88d:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  45f896:	0f 8e d3 00 00 00                               	jle    0x45f96f
  45f89c:	0f bf 05 cf c6 89 00                            	movsx  eax,WORD PTR ds:0x89c6cf
  45f8a3:	c1 e0 08                                        	shl    eax,0x8
  45f8a6:	bd 80 02 00 00                                  	mov    ebp,0x280
  45f8ab:	99                                              	cdq
  45f8ac:	f7 fd                                           	idiv   ebp
  45f8ae:	03 c0                                           	add    eax,eax
  45f8b0:	bd e0 01 00 00                                  	mov    ebp,0x1e0
  45f8b5:	8d 14 40                                        	lea    edx,[eax+eax*2]
  45f8b8:	8d 04 92                                        	lea    eax,[edx+edx*4]
  45f8bb:	99                                              	cdq
  45f8bc:	83 e2 1f                                        	and    edx,0x1f
  45f8bf:	03 c2                                           	add    eax,edx
  45f8c1:	c1 f8 05                                        	sar    eax,0x5
  45f8c4:	89 44 24 24                                     	mov    DWORD PTR [esp+0x24],eax
  45f8c8:	0f bf 05 d1 c6 89 00                            	movsx  eax,WORD PTR ds:0x89c6d1
  45f8cf:	c1 e0 08                                        	shl    eax,0x8
  45f8d2:	99                                              	cdq
  45f8d3:	f7 fd                                           	idiv   ebp
  45f8d5:	03 c0                                           	add    eax,eax
  45f8d7:	8d 14 40                                        	lea    edx,[eax+eax*2]
  45f8da:	8d 04 92                                        	lea    eax,[edx+edx*4]
  45f8dd:	99                                              	cdq
  45f8de:	83 e2 1f                                        	and    edx,0x1f
  45f8e1:	03 c2                                           	add    eax,edx
  45f8e3:	c1 f8 05                                        	sar    eax,0x5
  45f8e6:	8b e8                                           	mov    ebp,eax
  45f8e8:	0f bf c1                                        	movsx  eax,cx
  45f8eb:	0f af 44 24 24                                  	imul   eax,DWORD PTR [esp+0x24]
  45f8f0:	99                                              	cdq
  45f8f1:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f8f7:	03 c2                                           	add    eax,edx
  45f8f9:	c1 f8 08                                        	sar    eax,0x8
  45f8fc:	89 44 24 20                                     	mov    DWORD PTR [esp+0x20],eax
  45f900:	0f bf c3                                        	movsx  eax,bx
  45f903:	0f af c5                                        	imul   eax,ebp
  45f906:	99                                              	cdq
  45f907:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f90d:	03 c2                                           	add    eax,edx
  45f90f:	c1 f8 08                                        	sar    eax,0x8
  45f912:	89 44 24 1c                                     	mov    DWORD PTR [esp+0x1c],eax
  45f916:	33 c0                                           	xor    eax,eax
  45f918:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  45f91c:	0f af 44 24 24                                  	imul   eax,DWORD PTR [esp+0x24]
  45f921:	99                                              	cdq
  45f922:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f928:	03 c2                                           	add    eax,edx
  45f92a:	c1 f8 08                                        	sar    eax,0x8
  45f92d:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  45f931:	33 c0                                           	xor    eax,eax
  45f933:	66 8b 47 06                                     	mov    ax,WORD PTR [edi+0x6]
  45f937:	8b 4c 24 18                                     	mov    ecx,DWORD PTR [esp+0x18]
  45f93b:	0f af c5                                        	imul   eax,ebp
  45f93e:	99                                              	cdq
  45f93f:	81 e2 ff 00 00 00                               	and    edx,0xff
  45f945:	03 c2                                           	add    eax,edx
  45f947:	c1 f8 08                                        	sar    eax,0x8
  45f94a:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  45f94e:	50                                              	push   eax
  45f94f:	51                                              	push   ecx
  45f950:	57                                              	push   edi
  45f951:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f956:	03 44 24 28                                     	add    eax,DWORD PTR [esp+0x28]
  45f95a:	50                                              	push   eax
  45f95b:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45f960:	03 44 24 30                                     	add    eax,DWORD PTR [esp+0x30]
  45f964:	50                                              	push   eax
  45f965:	e8 c6 6a 0b 00                                  	call   0x516430
  45f96a:	83 c4 14                                        	add    esp,0x14
  45f96d:	eb 1f                                           	jmp    0x45f98e
  45f96f:	0f bf 54 24 34                                  	movsx  edx,WORD PTR [esp+0x34]
  45f974:	0f bf c3                                        	movsx  eax,bx
  45f977:	57                                              	push   edi
  45f978:	03 d0                                           	add    edx,eax
  45f97a:	52                                              	push   edx
  45f97b:	0f bf c1                                        	movsx  eax,cx
  45f97e:	0f bf 54 24 38                                  	movsx  edx,WORD PTR [esp+0x38]
  45f983:	03 d0                                           	add    edx,eax
  45f985:	52                                              	push   edx
  45f986:	e8 55 69 0b 00                                  	call   0x5162e0
  45f98b:	83 c4 0c                                        	add    esp,0xc
  45f98e:	33 c0                                           	xor    eax,eax
  45f990:	66 8b 46 08                                     	mov    ax,WORD PTR [esi+0x8]
  45f994:	8d 04 80                                        	lea    eax,[eax+eax*4]
  45f997:	03 c0                                           	add    eax,eax
  45f999:	03 05 4c df 59 00                               	add    eax,DWORD PTR ds:0x59df4c
  45f99f:	8b f0                                           	mov    esi,eax
  45f9a1:	3b 35 4c df 59 00                               	cmp    esi,DWORD PTR ds:0x59df4c
  45f9a7:	0f 87 bd fd ff ff                               	ja     0x45f76a
  45f9ad:	33 c0                                           	xor    eax,eax
  45f9af:	5d                                              	pop    ebp
  45f9b0:	5f                                              	pop    edi
  45f9b1:	a3 74 a0 5d 00                                  	mov    ds:0x5da074,eax
  45fa2b:	66 8b 56 06                                     	mov    dx,WORD PTR [esi+0x6]
  45fa2f:	32 c9                                           	xor    cl,cl
  45fa31:	66 8b c2                                        	mov    ax,dx
  45fa34:	66 25 f0 01                                     	and    ax,0x1f0
  45fa38:	66 c1 e8 04                                     	shr    ax,0x4
  45fa3c:	0f b7 c0                                        	movzx  eax,ax
  45fa3f:	85 c0                                           	test   eax,eax
  45fa41:	74 23                                           	je     0x45fa66
  45fa43:	83 f8 01                                        	cmp    eax,0x1
  45fa46:	74 32                                           	je     0x45fa7a
  45fa48:	0f be 7c 24 40                                  	movsx  edi,BYTE PTR [esp+0x40]
  45fa4d:	3b f8                                           	cmp    edi,eax
  45fa4f:	75 3e                                           	jne    0x45fa8f
  45fa51:	66 8b c2                                        	mov    ax,dx
  45fa54:	0f be 7c 24 44                                  	movsx  edi,BYTE PTR [esp+0x44]
  45fa59:	66 c1 e8 09                                     	shr    ax,0x9
  45fa5d:	0f b7 d8                                        	movzx  ebx,ax
  45fa60:	3b fb                                           	cmp    edi,ebx
  45fa62:	75 2b                                           	jne    0x45fa8f
  45fa64:	eb 27                                           	jmp    0x45fa8d
  45fa66:	66 8b c2                                        	mov    ax,dx
  45fa69:	80 e4 fe                                        	and    ah,0xfe
  45fa6c:	80 fc 02                                        	cmp    ah,0x2
  45fa6f:	75 1c                                           	jne    0x45fa8d
  45fa71:	80 7c 24 12 00                                  	cmp    BYTE PTR [esp+0x12],0x0
  45fa76:	74 17                                           	je     0x45fa8f
  45fa78:	eb 13                                           	jmp    0x45fa8d
  45fa7a:	66 8b c2                                        	mov    ax,dx
  45fa7d:	0f be 7c 24 3c                                  	movsx  edi,BYTE PTR [esp+0x3c]
  45fa82:	66 c1 e8 09                                     	shr    ax,0x9
  45fa86:	0f b7 d8                                        	movzx  ebx,ax
  45fa89:	3b fb                                           	cmp    edi,ebx
  45fa8b:	75 02                                           	jne    0x45fa8f
  45fa8d:	b1 01                                           	mov    cl,0x1
  45fa8f:	84 c9                                           	test   cl,cl
  45fa91:	0f 84 d0 01 00 00                               	je     0x45fc67
  45fa97:	33 ff                                           	xor    edi,edi
  45fa99:	66 8b 3e                                        	mov    di,WORD PTR [esi]
  45fa9c:	03 3d 18 df 59 00                               	add    edi,DWORD PTR ds:0x59df18
  45faa2:	39 3d 18 df 59 00                               	cmp    DWORD PTR ds:0x59df18,edi
  45faa8:	0f 83 b9 01 00 00                               	jae    0x45fc67
  45faae:	66 83 e2 0f                                     	and    dx,0xf
  45fab2:	66 0f b6 44 24 13                               	movzx  ax,BYTE PTR [esp+0x13]
  45fab8:	66 0b d0                                        	or     dx,ax
  45fabb:	33 c0                                           	xor    eax,eax
  45fabd:	0f b7 ca                                        	movzx  ecx,dx
  45fac0:	a0 64 d1 89 00                                  	mov    al,ds:0x89d164
  45fac5:	89 0d 74 a0 5d 00                               	mov    DWORD PTR ds:0x5da074,ecx
  45facb:	66 8b 5e 04                                     	mov    bx,WORD PTR [esi+0x4]
  45facf:	83 f8 01                                        	cmp    eax,0x1
  45fad2:	66 8b 4e 02                                     	mov    cx,WORD PTR [esi+0x2]
  45fad6:	74 0e                                           	je     0x45fae6
  45fad8:	83 f8 02                                        	cmp    eax,0x2
  45fadb:	0f 84 85 00 00 00                               	je     0x45fb66
  45fae1:	e9 62 01 00 00                                  	jmp    0x45fc48
  45fae6:	0f bf c1                                        	movsx  eax,cx
  45fae9:	0f bf cb                                        	movsx  ecx,bx
  45faec:	8b 15 86 bc 89 00                               	mov    edx,DWORD PTR ds:0x89bc86
  45faf2:	89 44 24 20                                     	mov    DWORD PTR [esp+0x20],eax
  45faf6:	8d 44 24 20                                     	lea    eax,[esp+0x20]
  45fafa:	89 4c 24 1c                                     	mov    DWORD PTR [esp+0x1c],ecx
  45fafe:	8d 4c 24 1c                                     	lea    ecx,[esp+0x1c]
  45fb02:	51                                              	push   ecx
  45fb03:	50                                              	push   eax
  45fb04:	52                                              	push   edx
  45fb05:	e8 86 65 01 00                                  	call   0x476090
  45fb0a:	8d 4c 24 24                                     	lea    ecx,[esp+0x24]
  45fb0e:	83 c4 0c                                        	add    esp,0xc
  45fb11:	33 c0                                           	xor    eax,eax
  45fb13:	8b 15 86 bc 89 00                               	mov    edx,DWORD PTR ds:0x89bc86
  45fb19:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  45fb1d:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  45fb21:	33 c0                                           	xor    eax,eax
  45fb23:	66 8b 47 06                                     	mov    ax,WORD PTR [edi+0x6]
  45fb27:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  45fb2b:	8d 44 24 14                                     	lea    eax,[esp+0x14]
  45fb2f:	50                                              	push   eax
  45fb30:	51                                              	push   ecx
  45fb31:	52                                              	push   edx
  45fb32:	e8 59 65 01 00                                  	call   0x476090
  45fb37:	8b 4c 24 20                                     	mov    ecx,DWORD PTR [esp+0x20]
  45fb3b:	8b 54 24 24                                     	mov    edx,DWORD PTR [esp+0x24]
  45fb3f:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45fb44:	03 44 24 28                                     	add    eax,DWORD PTR [esp+0x28]
  45fb48:	83 c4 0c                                        	add    esp,0xc
  45fb4b:	51                                              	push   ecx
  45fb4c:	52                                              	push   edx
  45fb4d:	57                                              	push   edi
  45fb4e:	50                                              	push   eax
  45fb4f:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45fb54:	03 44 24 30                                     	add    eax,DWORD PTR [esp+0x30]
  45fb58:	50                                              	push   eax
  45fb59:	e8 d2 68 0b 00                                  	call   0x516430
  45fb5e:	83 c4 14                                        	add    esp,0x14
  45fb61:	e9 01 01 00 00                                  	jmp    0x45fc67
  45fb66:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  45fb6f:	0f 8e d3 00 00 00                               	jle    0x45fc48
  45fb75:	0f bf 05 cf c6 89 00                            	movsx  eax,WORD PTR ds:0x89c6cf
  45fb7c:	c1 e0 08                                        	shl    eax,0x8
  45fb7f:	bd 80 02 00 00                                  	mov    ebp,0x280
  45fb84:	99                                              	cdq
  45fb85:	f7 fd                                           	idiv   ebp
  45fb87:	03 c0                                           	add    eax,eax
  45fb89:	bd e0 01 00 00                                  	mov    ebp,0x1e0
  45fb8e:	8d 14 40                                        	lea    edx,[eax+eax*2]
  45fb91:	8d 04 92                                        	lea    eax,[edx+edx*4]
  45fb94:	99                                              	cdq
  45fb95:	83 e2 1f                                        	and    edx,0x1f
  45fb98:	03 c2                                           	add    eax,edx
  45fb9a:	c1 f8 05                                        	sar    eax,0x5
  45fb9d:	89 44 24 24                                     	mov    DWORD PTR [esp+0x24],eax
  45fba1:	0f bf 05 d1 c6 89 00                            	movsx  eax,WORD PTR ds:0x89c6d1
  45fba8:	c1 e0 08                                        	shl    eax,0x8
  45fbab:	99                                              	cdq
  45fbac:	f7 fd                                           	idiv   ebp
  45fbae:	03 c0                                           	add    eax,eax
  45fbb0:	8d 14 40                                        	lea    edx,[eax+eax*2]
  45fbb3:	8d 04 92                                        	lea    eax,[edx+edx*4]
  45fbb6:	99                                              	cdq
  45fbb7:	83 e2 1f                                        	and    edx,0x1f
  45fbba:	03 c2                                           	add    eax,edx
  45fbbc:	c1 f8 05                                        	sar    eax,0x5
  45fbbf:	8b e8                                           	mov    ebp,eax
  45fbc1:	0f bf c1                                        	movsx  eax,cx
  45fbc4:	0f af 44 24 24                                  	imul   eax,DWORD PTR [esp+0x24]
  45fbc9:	99                                              	cdq
  45fbca:	81 e2 ff 00 00 00                               	and    edx,0xff
  45fbd0:	03 c2                                           	add    eax,edx
  45fbd2:	c1 f8 08                                        	sar    eax,0x8
  45fbd5:	89 44 24 20                                     	mov    DWORD PTR [esp+0x20],eax
  45fbd9:	0f bf c3                                        	movsx  eax,bx
  45fbdc:	0f af c5                                        	imul   eax,ebp
  45fbdf:	99                                              	cdq
  45fbe0:	81 e2 ff 00 00 00                               	and    edx,0xff
  45fbe6:	03 c2                                           	add    eax,edx
  45fbe8:	c1 f8 08                                        	sar    eax,0x8
  45fbeb:	89 44 24 1c                                     	mov    DWORD PTR [esp+0x1c],eax
  45fbef:	33 c0                                           	xor    eax,eax
  45fbf1:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  45fbf5:	0f af 44 24 24                                  	imul   eax,DWORD PTR [esp+0x24]
  45fbfa:	99                                              	cdq
  45fbfb:	81 e2 ff 00 00 00                               	and    edx,0xff
  45fc01:	03 c2                                           	add    eax,edx
  45fc03:	c1 f8 08                                        	sar    eax,0x8
  45fc06:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  45fc0a:	33 c0                                           	xor    eax,eax
  45fc0c:	66 8b 47 06                                     	mov    ax,WORD PTR [edi+0x6]
  45fc10:	8b 4c 24 18                                     	mov    ecx,DWORD PTR [esp+0x18]
  45fc14:	0f af c5                                        	imul   eax,ebp
  45fc17:	99                                              	cdq
  45fc18:	81 e2 ff 00 00 00                               	and    edx,0xff
  45fc1e:	03 c2                                           	add    eax,edx
  45fc20:	c1 f8 08                                        	sar    eax,0x8
  45fc23:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  45fc27:	50                                              	push   eax
  45fc28:	51                                              	push   ecx
  45fc29:	57                                              	push   edi
  45fc2a:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45fc2f:	03 44 24 28                                     	add    eax,DWORD PTR [esp+0x28]
  45fc33:	50                                              	push   eax
  45fc34:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45fc39:	03 44 24 30                                     	add    eax,DWORD PTR [esp+0x30]
  45fc3d:	50                                              	push   eax
  45fc3e:	e8 ed 67 0b 00                                  	call   0x516430
  45fc43:	83 c4 14                                        	add    esp,0x14
  45fc46:	eb 1f                                           	jmp    0x45fc67
  45fc48:	0f bf 54 24 34                                  	movsx  edx,WORD PTR [esp+0x34]
  45fc4d:	0f bf c3                                        	movsx  eax,bx
  45fc50:	57                                              	push   edi
  45fc51:	03 d0                                           	add    edx,eax
  45fc53:	52                                              	push   edx
  45fc54:	0f bf c1                                        	movsx  eax,cx
  45fc57:	0f bf 54 24 38                                  	movsx  edx,WORD PTR [esp+0x38]
  45fc5c:	03 d0                                           	add    edx,eax
  45fc5e:	52                                              	push   edx
  45fc5f:	e8 7c 66 0b 00                                  	call   0x5162e0
  45fc64:	83 c4 0c                                        	add    esp,0xc
  45fc67:	33 c0                                           	xor    eax,eax
  45fc69:	66 8b 46 08                                     	mov    ax,WORD PTR [esi+0x8]
  45fc6d:	8d 04 80                                        	lea    eax,[eax+eax*4]
  45fc70:	03 c0                                           	add    eax,eax
  45fc72:	03 05 4c df 59 00                               	add    eax,DWORD PTR ds:0x59df4c
  45fc78:	8b f0                                           	mov    esi,eax
  45fc7a:	39 35 4c df 59 00                               	cmp    DWORD PTR ds:0x59df4c,esi
  45fc80:	0f 82 a5 fd ff ff                               	jb     0x45fa2b
  45fc86:	e9 8e 02 00 00                                  	jmp    0x45ff19
  45fcba:	66 8b 4e 06                                     	mov    cx,WORD PTR [esi+0x6]
  45fcbe:	32 d2                                           	xor    dl,dl
  45fcc0:	66 8b c1                                        	mov    ax,cx
  45fcc3:	66 25 f0 01                                     	and    ax,0x1f0
  45fcc7:	66 c1 e8 04                                     	shr    ax,0x4
  45fccb:	0f b7 c0                                        	movzx  eax,ax
  45fcce:	85 c0                                           	test   eax,eax
  45fcd0:	74 23                                           	je     0x45fcf5
  45fcd2:	83 f8 01                                        	cmp    eax,0x1
  45fcd5:	74 32                                           	je     0x45fd09
  45fcd7:	0f be 7c 24 40                                  	movsx  edi,BYTE PTR [esp+0x40]
  45fcdc:	3b f8                                           	cmp    edi,eax
  45fcde:	75 3e                                           	jne    0x45fd1e
  45fce0:	66 8b c1                                        	mov    ax,cx
  45fce3:	0f be 7c 24 44                                  	movsx  edi,BYTE PTR [esp+0x44]
  45fce8:	66 c1 e8 09                                     	shr    ax,0x9
  45fcec:	0f b7 d8                                        	movzx  ebx,ax
  45fcef:	3b fb                                           	cmp    edi,ebx
  45fcf1:	75 2b                                           	jne    0x45fd1e
  45fcf3:	eb 27                                           	jmp    0x45fd1c
  45fcf5:	66 8b c1                                        	mov    ax,cx
  45fcf8:	80 e4 fe                                        	and    ah,0xfe
  45fcfb:	80 fc 02                                        	cmp    ah,0x2
  45fcfe:	75 1c                                           	jne    0x45fd1c
  45fd00:	80 7c 24 12 00                                  	cmp    BYTE PTR [esp+0x12],0x0
  45fd05:	74 17                                           	je     0x45fd1e
  45fd07:	eb 13                                           	jmp    0x45fd1c
  45fd09:	66 8b c1                                        	mov    ax,cx
  45fd0c:	0f be 7c 24 3c                                  	movsx  edi,BYTE PTR [esp+0x3c]
  45fd11:	66 c1 e8 09                                     	shr    ax,0x9
  45fd15:	0f b7 d8                                        	movzx  ebx,ax
  45fd18:	3b fb                                           	cmp    edi,ebx
  45fd1a:	75 02                                           	jne    0x45fd1e
  45fd1c:	b2 01                                           	mov    dl,0x1
  45fd1e:	84 d2                                           	test   dl,dl
  45fd20:	0f 84 d4 01 00 00                               	je     0x45fefa
  45fd26:	33 ff                                           	xor    edi,edi
  45fd28:	66 8b 3e                                        	mov    di,WORD PTR [esi]
  45fd2b:	03 3d 18 df 59 00                               	add    edi,DWORD PTR ds:0x59df18
  45fd31:	39 3d 18 df 59 00                               	cmp    DWORD PTR ds:0x59df18,edi
  45fd37:	0f 83 bd 01 00 00                               	jae    0x45fefa
  45fd3d:	80 e1 0f                                        	and    cl,0xf
  45fd40:	33 c0                                           	xor    eax,eax
  45fd42:	0a 4c 24 13                                     	or     cl,BYTE PTR [esp+0x13]
  45fd46:	80 f1 01                                        	xor    cl,0x1
  45fd49:	8a c1                                           	mov    al,cl
  45fd4b:	a3 74 a0 5d 00                                  	mov    ds:0x5da074,eax
  45fd50:	33 c0                                           	xor    eax,eax
  45fd52:	66 8b 5e 04                                     	mov    bx,WORD PTR [esi+0x4]
  45fd56:	a0 64 d1 89 00                                  	mov    al,ds:0x89d164
  45fd5b:	66 8b 4e 02                                     	mov    cx,WORD PTR [esi+0x2]
  45fd5f:	66 03 4f 04                                     	add    cx,WORD PTR [edi+0x4]
  45fd63:	66 f7 d9                                        	neg    cx
  45fd66:	83 f8 01                                        	cmp    eax,0x1
  45fd69:	74 0e                                           	je     0x45fd79
  45fd6b:	83 f8 02                                        	cmp    eax,0x2
  45fd6e:	0f 84 85 00 00 00                               	je     0x45fdf9
  45fd74:	e9 62 01 00 00                                  	jmp    0x45fedb
  45fd79:	0f bf c1                                        	movsx  eax,cx
  45fd7c:	0f bf cb                                        	movsx  ecx,bx
  45fd7f:	8b 15 86 bc 89 00                               	mov    edx,DWORD PTR ds:0x89bc86
  45fd85:	89 44 24 20                                     	mov    DWORD PTR [esp+0x20],eax
  45fd89:	8d 44 24 20                                     	lea    eax,[esp+0x20]
  45fd8d:	89 4c 24 1c                                     	mov    DWORD PTR [esp+0x1c],ecx
  45fd91:	8d 4c 24 1c                                     	lea    ecx,[esp+0x1c]
  45fd95:	51                                              	push   ecx
  45fd96:	50                                              	push   eax
  45fd97:	52                                              	push   edx
  45fd98:	e8 f3 62 01 00                                  	call   0x476090
  45fd9d:	8d 4c 24 24                                     	lea    ecx,[esp+0x24]
  45fda1:	83 c4 0c                                        	add    esp,0xc
  45fda4:	33 c0                                           	xor    eax,eax
  45fda6:	8b 15 86 bc 89 00                               	mov    edx,DWORD PTR ds:0x89bc86
  45fdac:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  45fdb0:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  45fdb4:	33 c0                                           	xor    eax,eax
  45fdb6:	66 8b 47 06                                     	mov    ax,WORD PTR [edi+0x6]
  45fdba:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  45fdbe:	8d 44 24 14                                     	lea    eax,[esp+0x14]
  45fdc2:	50                                              	push   eax
  45fdc3:	51                                              	push   ecx
  45fdc4:	52                                              	push   edx
  45fdc5:	e8 c6 62 01 00                                  	call   0x476090
  45fdca:	8b 4c 24 20                                     	mov    ecx,DWORD PTR [esp+0x20]
  45fdce:	8b 54 24 24                                     	mov    edx,DWORD PTR [esp+0x24]
  45fdd2:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45fdd7:	03 44 24 28                                     	add    eax,DWORD PTR [esp+0x28]
  45fddb:	83 c4 0c                                        	add    esp,0xc
  45fdde:	51                                              	push   ecx
  45fddf:	52                                              	push   edx
  45fde0:	57                                              	push   edi
  45fde1:	50                                              	push   eax
  45fde2:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45fde7:	03 44 24 30                                     	add    eax,DWORD PTR [esp+0x30]
  45fdeb:	50                                              	push   eax
  45fdec:	e8 3f 66 0b 00                                  	call   0x516430
  45fdf1:	83 c4 14                                        	add    esp,0x14
  45fdf4:	e9 01 01 00 00                                  	jmp    0x45fefa
  45fdf9:	66 81 3d cf c6 89 00 80 02                      	cmp    WORD PTR ds:0x89c6cf,0x280
  45fe02:	0f 8e d3 00 00 00                               	jle    0x45fedb
  45fe08:	0f bf 05 cf c6 89 00                            	movsx  eax,WORD PTR ds:0x89c6cf
  45fe0f:	c1 e0 08                                        	shl    eax,0x8
  45fe12:	bd 80 02 00 00                                  	mov    ebp,0x280
  45fe17:	99                                              	cdq
  45fe18:	f7 fd                                           	idiv   ebp
  45fe1a:	03 c0                                           	add    eax,eax
  45fe1c:	bd e0 01 00 00                                  	mov    ebp,0x1e0
  45fe21:	8d 14 40                                        	lea    edx,[eax+eax*2]
  45fe24:	8d 04 92                                        	lea    eax,[edx+edx*4]
  45fe27:	99                                              	cdq
  45fe28:	83 e2 1f                                        	and    edx,0x1f
  45fe2b:	03 c2                                           	add    eax,edx
  45fe2d:	c1 f8 05                                        	sar    eax,0x5
  45fe30:	89 44 24 24                                     	mov    DWORD PTR [esp+0x24],eax
  45fe34:	0f bf 05 d1 c6 89 00                            	movsx  eax,WORD PTR ds:0x89c6d1
  45fe3b:	c1 e0 08                                        	shl    eax,0x8
  45fe3e:	99                                              	cdq
  45fe3f:	f7 fd                                           	idiv   ebp
  45fe41:	03 c0                                           	add    eax,eax
  45fe43:	8d 14 40                                        	lea    edx,[eax+eax*2]
  45fe46:	8d 04 92                                        	lea    eax,[edx+edx*4]
  45fe49:	99                                              	cdq
  45fe4a:	83 e2 1f                                        	and    edx,0x1f
  45fe4d:	03 c2                                           	add    eax,edx
  45fe4f:	c1 f8 05                                        	sar    eax,0x5
  45fe52:	8b e8                                           	mov    ebp,eax
  45fe54:	0f bf c1                                        	movsx  eax,cx
  45fe57:	0f af 44 24 24                                  	imul   eax,DWORD PTR [esp+0x24]
  45fe5c:	99                                              	cdq
  45fe5d:	81 e2 ff 00 00 00                               	and    edx,0xff
  45fe63:	03 c2                                           	add    eax,edx
  45fe65:	c1 f8 08                                        	sar    eax,0x8
  45fe68:	89 44 24 20                                     	mov    DWORD PTR [esp+0x20],eax
  45fe6c:	0f bf c3                                        	movsx  eax,bx
  45fe6f:	0f af c5                                        	imul   eax,ebp
  45fe72:	99                                              	cdq
  45fe73:	81 e2 ff 00 00 00                               	and    edx,0xff
  45fe79:	03 c2                                           	add    eax,edx
  45fe7b:	c1 f8 08                                        	sar    eax,0x8
  45fe7e:	89 44 24 1c                                     	mov    DWORD PTR [esp+0x1c],eax
  45fe82:	33 c0                                           	xor    eax,eax
  45fe84:	66 8b 47 04                                     	mov    ax,WORD PTR [edi+0x4]
  45fe88:	0f af 44 24 24                                  	imul   eax,DWORD PTR [esp+0x24]
  45fe8d:	99                                              	cdq
  45fe8e:	81 e2 ff 00 00 00                               	and    edx,0xff
  45fe94:	03 c2                                           	add    eax,edx
  45fe96:	c1 f8 08                                        	sar    eax,0x8
  45fe99:	89 44 24 18                                     	mov    DWORD PTR [esp+0x18],eax
  45fe9d:	33 c0                                           	xor    eax,eax
  45fe9f:	66 8b 47 06                                     	mov    ax,WORD PTR [edi+0x6]
  45fea3:	8b 4c 24 18                                     	mov    ecx,DWORD PTR [esp+0x18]
  45fea7:	0f af c5                                        	imul   eax,ebp
  45feaa:	99                                              	cdq
  45feab:	81 e2 ff 00 00 00                               	and    edx,0xff
  45feb1:	03 c2                                           	add    eax,edx
  45feb3:	c1 f8 08                                        	sar    eax,0x8
  45feb6:	89 44 24 14                                     	mov    DWORD PTR [esp+0x14],eax
  45feba:	50                                              	push   eax
  45febb:	51                                              	push   ecx
  45febc:	57                                              	push   edi
  45febd:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45fec2:	03 44 24 28                                     	add    eax,DWORD PTR [esp+0x28]
  45fec6:	50                                              	push   eax
  45fec7:	0f bf 44 24 40                                  	movsx  eax,WORD PTR [esp+0x40]
  45fecc:	03 44 24 30                                     	add    eax,DWORD PTR [esp+0x30]
  45fed0:	50                                              	push   eax
  45fed1:	e8 5a 65 0b 00                                  	call   0x516430
  45fed6:	83 c4 14                                        	add    esp,0x14
  45fed9:	eb 1f                                           	jmp    0x45fefa
  45fedb:	0f bf 54 24 34                                  	movsx  edx,WORD PTR [esp+0x34]
  45fee0:	0f bf c3                                        	movsx  eax,bx
  45fee3:	57                                              	push   edi
  45fee4:	03 d0                                           	add    edx,eax
  45fee6:	52                                              	push   edx
  45fee7:	0f bf c1                                        	movsx  eax,cx
  45feea:	0f bf 54 24 38                                  	movsx  edx,WORD PTR [esp+0x38]
  45feef:	03 d0                                           	add    edx,eax
  45fef1:	52                                              	push   edx
  45fef2:	e8 e9 63 0b 00                                  	call   0x5162e0
  45fef7:	83 c4 0c                                        	add    esp,0xc
  45fefa:	33 c0                                           	xor    eax,eax
  45fefc:	66 8b 46 08                                     	mov    ax,WORD PTR [esi+0x8]
  45ff00:	8d 04 80                                        	lea    eax,[eax+eax*4]
  45ff03:	03 c0                                           	add    eax,eax
  45ff05:	03 05 4c df 59 00                               	add    eax,DWORD PTR ds:0x59df4c
  45ff0b:	8b f0                                           	mov    esi,eax
  45ff0d:	39 35 4c df 59 00                               	cmp    DWORD PTR ds:0x59df4c,esi
  45ff13:	0f 82 a1 fd ff ff                               	jb     0x45fcba
  45ff19:	33 c0                                           	xor    eax,eax
  45ff1b:	5d                                              	pop    ebp
  45ff1c:	5f                                              	pop    edi
  45ff1d:	a3 74 a0 5d 00                                  	mov    ds:0x5da074,eax
  49fbbc:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  49fbc3:	89 44 24 34                                     	mov    DWORD PTR [esp+0x34],eax
  49fbc7:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  49fbcb:	2b 44 24 24                                     	sub    eax,DWORD PTR [esp+0x24]
  49fbcf:	8b 54 24 34                                     	mov    edx,DWORD PTR [esp+0x34]
  49fbd3:	2b 44 24 18                                     	sub    eax,DWORD PTR [esp+0x18]
  49fbd7:	89 54 24 24                                     	mov    DWORD PTR [esp+0x24],edx
  49fbdb:	03 c3                                           	add    eax,ebx
  49fbdd:	03 d1                                           	add    edx,ecx
  49fbdf:	89 44 24 38                                     	mov    DWORD PTR [esp+0x38],eax
  49fbe3:	89 54 24 3c                                     	mov    DWORD PTR [esp+0x3c],edx
  49fbe7:	89 54 24 2c                                     	mov    DWORD PTR [esp+0x2c],edx
  49fbeb:	83 ec 08                                        	sub    esp,0x8
  49fbee:	8b 4c 24 1b                                     	mov    ecx,DWORD PTR [esp+0x1b]
  49fbf2:	89 44 24 30                                     	mov    DWORD PTR [esp+0x30],eax
  49fbf6:	8b 44 24 20                                     	mov    eax,DWORD PTR [esp+0x20]
  49fbfa:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  49fbfe:	03 44 24 40                                     	add    eax,DWORD PTR [esp+0x40]
  49fc02:	51                                              	push   ecx
  49fc03:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  49fc07:	89 44 24 24                                     	mov    DWORD PTR [esp+0x24],eax
  49fc0b:	89 44 24 3c                                     	mov    DWORD PTR [esp+0x3c],eax
  49fc0f:	e8 5c 63 f7 ff                                  	call   0x415f70
  49fc14:	8d 4c 24 2c                                     	lea    ecx,[esp+0x2c]
  49fc18:	51                                              	push   ecx
  49fc19:	e8 72 6c 07 00                                  	call   0x516890
  49fc1e:	8b 4c 24 40                                     	mov    ecx,DWORD PTR [esp+0x40]
  49fc22:	8b 54 24 48                                     	mov    edx,DWORD PTR [esp+0x48]
  49fc26:	8b 44 24 44                                     	mov    eax,DWORD PTR [esp+0x44]
  49fc2a:	83 c4 0c                                        	add    esp,0xc
  49fc2d:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  505612:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  505619:	8b 4c 24 6c                                     	mov    ecx,DWORD PTR [esp+0x6c]
  50561d:	41                                              	inc    ecx
  50561e:	89 4c 24 1c                                     	mov    DWORD PTR [esp+0x1c],ecx
  505622:	8b 84 24 98 00 00 00                            	mov    eax,DWORD PTR [esp+0x98]
  505629:	40                                              	inc    eax
  50562a:	89 4c 24 4c                                     	mov    DWORD PTR [esp+0x4c],ecx
  50562e:	8b 5c 24 6c                                     	mov    ebx,DWORD PTR [esp+0x6c]
  505632:	89 84 24 c0 00 00 00                            	mov    DWORD PTR [esp+0xc0],eax
  505639:	03 9c 24 84 00 00 00                            	add    ebx,DWORD PTR [esp+0x84]
  505640:	89 5c 24 30                                     	mov    DWORD PTR [esp+0x30],ebx
  505644:	8d 7b ff                                        	lea    edi,[ebx-0x1]
  505647:	8b 9c 24 98 00 00 00                            	mov    ebx,DWORD PTR [esp+0x98]
  50564e:	89 7c 24 54                                     	mov    DWORD PTR [esp+0x54],edi
  505652:	89 44 24 50                                     	mov    DWORD PTR [esp+0x50],eax
  505656:	83 c3 05                                        	add    ebx,0x5
  505659:	89 5c 24 58                                     	mov    DWORD PTR [esp+0x58],ebx
  50565d:	83 ec 08                                        	sub    esp,0x8
  505660:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  505664:	68 9a 00 00 00                                  	push   0x9a
  505669:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  50566d:	e8 fe 08 f1 ff                                  	call   0x415f70
  505672:	8d 4c 24 54                                     	lea    ecx,[esp+0x54]
  505676:	51                                              	push   ecx
  505677:	e8 14 12 01 00                                  	call   0x516890
  50567c:	8b 84 24 a4 00 00 00                            	mov    eax,DWORD PTR [esp+0xa4]
  505683:	83 c4 0c                                        	add    esp,0xc
  505686:	83 c0 06                                        	add    eax,0x6
  505689:	83 ec 08                                        	sub    esp,0x8
  50568c:	89 44 24 3c                                     	mov    DWORD PTR [esp+0x3c],eax
  505690:	89 64 24 4c                                     	mov    DWORD PTR [esp+0x4c],esp
  505694:	8b 4c 24 4c                                     	mov    ecx,DWORD PTR [esp+0x4c]
  505698:	68 9d 00 00 00                                  	push   0x9d
  50569d:	e8 2e cf f4 ff                                  	call   0x4525d0
  5056a2:	8b 4c 24 3c                                     	mov    ecx,DWORD PTR [esp+0x3c]
  5056a6:	8b 54 24 74                                     	mov    edx,DWORD PTR [esp+0x74]
  5056aa:	8b 84 24 a0 00 00 00                            	mov    eax,DWORD PTR [esp+0xa0]
  5056b1:	51                                              	push   ecx
  5056b2:	52                                              	push   edx
  5056b3:	50                                              	push   eax
  5056b4:	52                                              	push   edx
  5056b5:	e8 06 10 01 00                                  	call   0x5166c0
  5056ba:	83 c4 10                                        	add    esp,0x10
  5056bd:	89 64 24 34                                     	mov    DWORD PTR [esp+0x34],esp
  5056c1:	68 9d 00 00 00                                  	push   0x9d
  5056c6:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  5056ca:	e8 01 cf f4 ff                                  	call   0x4525d0
  5056cf:	8b 8c 24 a0 00 00 00                            	mov    ecx,DWORD PTR [esp+0xa0]
  5056d6:	8b 54 24 38                                     	mov    edx,DWORD PTR [esp+0x38]
  5056da:	8b 44 24 74                                     	mov    eax,DWORD PTR [esp+0x74]
  5056de:	51                                              	push   ecx
  5056df:	52                                              	push   edx
  5056e0:	51                                              	push   ecx
  5056e1:	50                                              	push   eax
  5056e2:	e8 d9 0f 01 00                                  	call   0x5166c0
  5056e7:	83 c4 10                                        	add    esp,0x10
  5056ea:	89 64 24 50                                     	mov    DWORD PTR [esp+0x50],esp
  5056ee:	68 96 00 00 00                                  	push   0x96
  5056f3:	8b 4c 24 54                                     	mov    ecx,DWORD PTR [esp+0x54]
  5056f7:	e8 d4 ce f4 ff                                  	call   0x4525d0
  5056fc:	53                                              	push   ebx
  5056fd:	8b 8c 24 a4 00 00 00                            	mov    ecx,DWORD PTR [esp+0xa4]
  505704:	57                                              	push   edi
  505705:	51                                              	push   ecx
  505706:	57                                              	push   edi
  505707:	e8 b4 0f 01 00                                  	call   0x5166c0
  50570c:	83 c4 10                                        	add    esp,0x10
  50570f:	89 64 24 64                                     	mov    DWORD PTR [esp+0x64],esp
  505713:	68 96 00 00 00                                  	push   0x96
  505718:	8b 4c 24 68                                     	mov    ecx,DWORD PTR [esp+0x68]
  50571c:	e8 af ce f4 ff                                  	call   0x4525d0
  505721:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  505725:	53                                              	push   ebx
  505726:	8b 54 24 78                                     	mov    edx,DWORD PTR [esp+0x78]
  50572a:	51                                              	push   ecx
  50572b:	53                                              	push   ebx
  50572c:	52                                              	push   edx
  50572d:	e8 8e 0f 01 00                                  	call   0x5166c0
  505732:	8b 9c 24 9c 00 00 00                            	mov    ebx,DWORD PTR [esp+0x9c]
  505739:	83 c4 18                                        	add    esp,0x18
  50573c:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  5058e7:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  5058ee:	8b 5c 24 6c                                     	mov    ebx,DWORD PTR [esp+0x6c]
  5058f2:	43                                              	inc    ebx
  5058f3:	89 5c 24 4c                                     	mov    DWORD PTR [esp+0x4c],ebx
  5058f7:	8b 4c 24 6c                                     	mov    ecx,DWORD PTR [esp+0x6c]
  5058fb:	83 c1 05                                        	add    ecx,0x5
  5058fe:	89 4c 24 34                                     	mov    DWORD PTR [esp+0x34],ecx
  505902:	89 4c 24 54                                     	mov    DWORD PTR [esp+0x54],ecx
  505906:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  50590a:	40                                              	inc    eax
  50590b:	83 ec 08                                        	sub    esp,0x8
  50590e:	89 44 24 38                                     	mov    DWORD PTR [esp+0x38],eax
  505912:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  505916:	89 44 24 58                                     	mov    DWORD PTR [esp+0x58],eax
  50591a:	68 9a 00 00 00                                  	push   0x9a
  50591f:	8b b4 24 80 00 00 00                            	mov    esi,DWORD PTR [esp+0x80]
  505926:	03 74 24 28                                     	add    esi,DWORD PTR [esp+0x28]
  50592a:	8d 7e ff                                        	lea    edi,[esi-0x1]
  50592d:	89 7c 24 64                                     	mov    DWORD PTR [esp+0x64],edi
  505931:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  505935:	e8 36 06 f1 ff                                  	call   0x415f70
  50593a:	8d 44 24 54                                     	lea    eax,[esp+0x54]
  50593e:	50                                              	push   eax
  50593f:	e8 4c 0f 01 00                                  	call   0x516890
  505944:	83 c4 04                                        	add    esp,0x4
  505947:	89 64 24 4c                                     	mov    DWORD PTR [esp+0x4c],esp
  50594b:	68 9d 00 00 00                                  	push   0x9d
  505950:	8b 4c 24 50                                     	mov    ecx,DWORD PTR [esp+0x50]
  505954:	e8 77 cc f4 ff                                  	call   0x4525d0
  505959:	8b 4c 24 74                                     	mov    ecx,DWORD PTR [esp+0x74]
  50595d:	56                                              	push   esi
  50595e:	8b 44 24 28                                     	mov    eax,DWORD PTR [esp+0x28]
  505962:	51                                              	push   ecx
  505963:	50                                              	push   eax
  505964:	51                                              	push   ecx
  505965:	e8 56 0d 01 00                                  	call   0x5166c0
  50596a:	8b b4 24 84 00 00 00                            	mov    esi,DWORD PTR [esp+0x84]
  505971:	83 c4 18                                        	add    esp,0x18
  505974:	83 c6 06                                        	add    esi,0x6
  505977:	83 ec 08                                        	sub    esp,0x8
  50597a:	89 64 24 34                                     	mov    DWORD PTR [esp+0x34],esp
  50597e:	68 9d 00 00 00                                  	push   0x9d
  505983:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  505987:	e8 44 cc f4 ff                                  	call   0x4525d0
  50598c:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  505990:	8b 44 24 74                                     	mov    eax,DWORD PTR [esp+0x74]
  505994:	51                                              	push   ecx
  505995:	56                                              	push   esi
  505996:	51                                              	push   ecx
  505997:	50                                              	push   eax
  505998:	e8 23 0d 01 00                                  	call   0x5166c0
  50599d:	83 c4 10                                        	add    esp,0x10
  5059a0:	89 64 24 50                                     	mov    DWORD PTR [esp+0x50],esp
  5059a4:	68 96 00 00 00                                  	push   0x96
  5059a9:	8b 4c 24 54                                     	mov    ecx,DWORD PTR [esp+0x54]
  5059ad:	e8 1e cc f4 ff                                  	call   0x4525d0
  5059b2:	8b 4c 24 3c                                     	mov    ecx,DWORD PTR [esp+0x3c]
  5059b6:	57                                              	push   edi
  5059b7:	8b 54 24 28                                     	mov    edx,DWORD PTR [esp+0x28]
  5059bb:	51                                              	push   ecx
  5059bc:	52                                              	push   edx
  5059bd:	51                                              	push   ecx
  5059be:	e8 fd 0c 01 00                                  	call   0x5166c0
  5059c3:	83 c4 10                                        	add    esp,0x10
  5059c6:	89 64 24 64                                     	mov    DWORD PTR [esp+0x64],esp
  5059ca:	68 96 00 00 00                                  	push   0x96
  5059cf:	8b 4c 24 68                                     	mov    ecx,DWORD PTR [esp+0x68]
  5059d3:	e8 f8 cb f4 ff                                  	call   0x4525d0
  5059d8:	8b 4c 24 74                                     	mov    ecx,DWORD PTR [esp+0x74]
  5059dc:	57                                              	push   edi
  5059dd:	56                                              	push   esi
  5059de:	57                                              	push   edi
  5059df:	51                                              	push   ecx
  5059e0:	e8 db 0c 01 00                                  	call   0x5166c0
  5059e5:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  505a98:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  505a9f:	89 5c 24 4c                                     	mov    DWORD PTR [esp+0x4c],ebx
  505aa3:	89 44 24 54                                     	mov    DWORD PTR [esp+0x54],eax
  505aa7:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  505aab:	40                                              	inc    eax
  505aac:	89 44 24 30                                     	mov    DWORD PTR [esp+0x30],eax
  505ab0:	89 44 24 50                                     	mov    DWORD PTR [esp+0x50],eax
  505ab4:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  505ab8:	03 44 24 74                                     	add    eax,DWORD PTR [esp+0x74]
  505abc:	83 ec 08                                        	sub    esp,0x8
  505abf:	8d 78 ff                                        	lea    edi,[eax-0x1]
  505ac2:	89 44 24 3c                                     	mov    DWORD PTR [esp+0x3c],eax
  505ac6:	89 7c 24 60                                     	mov    DWORD PTR [esp+0x60],edi
  505aca:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  505ace:	68 9a 00 00 00                                  	push   0x9a
  505ad3:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  505ad7:	e8 94 04 f1 ff                                  	call   0x415f70
  505adc:	8d 4c 24 54                                     	lea    ecx,[esp+0x54]
  505ae0:	51                                              	push   ecx
  505ae1:	e8 aa 0d 01 00                                  	call   0x516890
  505ae6:	83 c4 04                                        	add    esp,0x4
  505ae9:	89 64 24 4c                                     	mov    DWORD PTR [esp+0x4c],esp
  505aed:	68 9d 00 00 00                                  	push   0x9d
  505af2:	8b 4c 24 50                                     	mov    ecx,DWORD PTR [esp+0x50]
  505af6:	e8 d5 ca f4 ff                                  	call   0x4525d0
  505afb:	8b 44 24 3c                                     	mov    eax,DWORD PTR [esp+0x3c]
  505aff:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  505b03:	50                                              	push   eax
  505b04:	56                                              	push   esi
  505b05:	51                                              	push   ecx
  505b06:	56                                              	push   esi
  505b07:	e8 b4 0b 01 00                                  	call   0x5166c0
  505b0c:	83 c4 10                                        	add    esp,0x10
  505b0f:	89 64 24 34                                     	mov    DWORD PTR [esp+0x34],esp
  505b13:	68 9d 00 00 00                                  	push   0x9d
  505b18:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  505b1c:	e8 af ca f4 ff                                  	call   0x4525d0
  505b21:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  505b25:	8d 56 06                                        	lea    edx,[esi+0x6]
  505b28:	51                                              	push   ecx
  505b29:	52                                              	push   edx
  505b2a:	51                                              	push   ecx
  505b2b:	56                                              	push   esi
  505b2c:	e8 8f 0b 01 00                                  	call   0x5166c0
  505b31:	83 c4 10                                        	add    esp,0x10
  505b34:	89 64 24 50                                     	mov    DWORD PTR [esp+0x50],esp
  505b38:	68 96 00 00 00                                  	push   0x96
  505b3d:	8b 4c 24 54                                     	mov    ecx,DWORD PTR [esp+0x54]
  505b41:	e8 8a ca f4 ff                                  	call   0x4525d0
  505b46:	57                                              	push   edi
  505b47:	8d 4e 05                                        	lea    ecx,[esi+0x5]
  505b4a:	8b 54 24 28                                     	mov    edx,DWORD PTR [esp+0x28]
  505b4e:	51                                              	push   ecx
  505b4f:	52                                              	push   edx
  505b50:	51                                              	push   ecx
  505b51:	e8 6a 0b 01 00                                  	call   0x5166c0
  505b56:	83 c4 10                                        	add    esp,0x10
  505b59:	89 64 24 64                                     	mov    DWORD PTR [esp+0x64],esp
  505b5d:	68 96 00 00 00                                  	push   0x96
  505b62:	8b 4c 24 68                                     	mov    ecx,DWORD PTR [esp+0x68]
  505b66:	e8 65 ca f4 ff                                  	call   0x4525d0
  505b6b:	57                                              	push   edi
  505b6c:	8d 4e 06                                        	lea    ecx,[esi+0x6]
  505b6f:	51                                              	push   ecx
  505b70:	57                                              	push   edi
  505b71:	56                                              	push   esi
  505b72:	e8 49 0b 01 00                                  	call   0x5166c0
  505b77:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  505c41:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  505c48:	89 5c 24 4c                                     	mov    DWORD PTR [esp+0x4c],ebx
  505c4c:	89 44 24 54                                     	mov    DWORD PTR [esp+0x54],eax
  505c50:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  505c54:	40                                              	inc    eax
  505c55:	89 44 24 30                                     	mov    DWORD PTR [esp+0x30],eax
  505c59:	83 ec 08                                        	sub    esp,0x8
  505c5c:	89 44 24 58                                     	mov    DWORD PTR [esp+0x58],eax
  505c60:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  505c64:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  505c68:	68 9a 00 00 00                                  	push   0x9a
  505c6d:	03 84 24 80 00 00 00                            	add    eax,DWORD PTR [esp+0x80]
  505c74:	89 44 24 40                                     	mov    DWORD PTR [esp+0x40],eax
  505c78:	8d 78 ff                                        	lea    edi,[eax-0x1]
  505c7b:	89 7c 24 64                                     	mov    DWORD PTR [esp+0x64],edi
  505c7f:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  505c83:	e8 e8 02 f1 ff                                  	call   0x415f70
  505c88:	8d 4c 24 54                                     	lea    ecx,[esp+0x54]
  505c8c:	51                                              	push   ecx
  505c8d:	e8 fe 0b 01 00                                  	call   0x516890
  505c92:	83 c4 04                                        	add    esp,0x4
  505c95:	89 64 24 4c                                     	mov    DWORD PTR [esp+0x4c],esp
  505c99:	68 9d 00 00 00                                  	push   0x9d
  505c9e:	8b 4c 24 50                                     	mov    ecx,DWORD PTR [esp+0x50]
  505ca2:	e8 29 c9 f4 ff                                  	call   0x4525d0
  505ca7:	8b 44 24 3c                                     	mov    eax,DWORD PTR [esp+0x3c]
  505cab:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  505caf:	50                                              	push   eax
  505cb0:	56                                              	push   esi
  505cb1:	51                                              	push   ecx
  505cb2:	56                                              	push   esi
  505cb3:	e8 08 0a 01 00                                  	call   0x5166c0
  505cb8:	83 c4 10                                        	add    esp,0x10
  505cbb:	89 64 24 34                                     	mov    DWORD PTR [esp+0x34],esp
  505cbf:	68 9d 00 00 00                                  	push   0x9d
  505cc4:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  505cc8:	e8 03 c9 f4 ff                                  	call   0x4525d0
  505ccd:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  505cd1:	8d 56 06                                        	lea    edx,[esi+0x6]
  505cd4:	51                                              	push   ecx
  505cd5:	52                                              	push   edx
  505cd6:	51                                              	push   ecx
  505cd7:	56                                              	push   esi
  505cd8:	e8 e3 09 01 00                                  	call   0x5166c0
  505cdd:	83 c4 10                                        	add    esp,0x10
  505ce0:	89 64 24 50                                     	mov    DWORD PTR [esp+0x50],esp
  505ce4:	68 96 00 00 00                                  	push   0x96
  505ce9:	8b 4c 24 54                                     	mov    ecx,DWORD PTR [esp+0x54]
  505ced:	e8 de c8 f4 ff                                  	call   0x4525d0
  505cf2:	57                                              	push   edi
  505cf3:	8d 4e 05                                        	lea    ecx,[esi+0x5]
  505cf6:	8b 54 24 28                                     	mov    edx,DWORD PTR [esp+0x28]
  505cfa:	51                                              	push   ecx
  505cfb:	52                                              	push   edx
  505cfc:	51                                              	push   ecx
  505cfd:	e8 be 09 01 00                                  	call   0x5166c0
  505d02:	83 c4 10                                        	add    esp,0x10
  505d05:	89 64 24 64                                     	mov    DWORD PTR [esp+0x64],esp
  505d09:	68 96 00 00 00                                  	push   0x96
  505d0e:	8b 4c 24 68                                     	mov    ecx,DWORD PTR [esp+0x68]
  505d12:	e8 b9 c8 f4 ff                                  	call   0x4525d0
  505d17:	57                                              	push   edi
  505d18:	8d 4e 06                                        	lea    ecx,[esi+0x6]
  505d1b:	51                                              	push   ecx
  505d1c:	57                                              	push   edi
  505d1d:	56                                              	push   esi
  505d1e:	e8 9d 09 01 00                                  	call   0x5166c0
  505d23:	8b 84 24 bc 00 00 00                            	mov    eax,DWORD PTR [esp+0xbc]
  505d2a:	83 c4 18                                        	add    esp,0x18
  505d2d:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  505dd6:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  505ddd:	89 5c 24 4c                                     	mov    DWORD PTR [esp+0x4c],ebx
  505de1:	89 44 24 54                                     	mov    DWORD PTR [esp+0x54],eax
  505de5:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  505de9:	40                                              	inc    eax
  505dea:	89 44 24 30                                     	mov    DWORD PTR [esp+0x30],eax
  505dee:	83 ec 08                                        	sub    esp,0x8
  505df1:	89 44 24 58                                     	mov    DWORD PTR [esp+0x58],eax
  505df5:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  505df9:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  505dfd:	68 9a 00 00 00                                  	push   0x9a
  505e02:	03 84 24 80 00 00 00                            	add    eax,DWORD PTR [esp+0x80]
  505e09:	89 44 24 40                                     	mov    DWORD PTR [esp+0x40],eax
  505e0d:	8d 78 ff                                        	lea    edi,[eax-0x1]
  505e10:	89 7c 24 64                                     	mov    DWORD PTR [esp+0x64],edi
  505e14:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  505e18:	e8 53 01 f1 ff                                  	call   0x415f70
  505e1d:	8d 4c 24 54                                     	lea    ecx,[esp+0x54]
  505e21:	51                                              	push   ecx
  505e22:	e8 69 0a 01 00                                  	call   0x516890
  505e27:	83 c4 04                                        	add    esp,0x4
  505e2a:	89 64 24 4c                                     	mov    DWORD PTR [esp+0x4c],esp
  505e2e:	68 9d 00 00 00                                  	push   0x9d
  505e33:	8b 4c 24 50                                     	mov    ecx,DWORD PTR [esp+0x50]
  505e37:	e8 94 c7 f4 ff                                  	call   0x4525d0
  505e3c:	8b 44 24 3c                                     	mov    eax,DWORD PTR [esp+0x3c]
  505e40:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  505e44:	50                                              	push   eax
  505e45:	56                                              	push   esi
  505e46:	51                                              	push   ecx
  505e47:	56                                              	push   esi
  505e48:	e8 73 08 01 00                                  	call   0x5166c0
  505e4d:	83 c4 10                                        	add    esp,0x10
  505e50:	89 64 24 34                                     	mov    DWORD PTR [esp+0x34],esp
  505e54:	68 9d 00 00 00                                  	push   0x9d
  505e59:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  505e5d:	e8 6e c7 f4 ff                                  	call   0x4525d0
  505e62:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  505e66:	8d 56 06                                        	lea    edx,[esi+0x6]
  505e69:	51                                              	push   ecx
  505e6a:	52                                              	push   edx
  505e6b:	51                                              	push   ecx
  505e6c:	56                                              	push   esi
  505e6d:	e8 4e 08 01 00                                  	call   0x5166c0
  505e72:	83 c4 10                                        	add    esp,0x10
  505e75:	89 64 24 50                                     	mov    DWORD PTR [esp+0x50],esp
  505e79:	68 96 00 00 00                                  	push   0x96
  505e7e:	8b 4c 24 54                                     	mov    ecx,DWORD PTR [esp+0x54]
  505e82:	e8 49 c7 f4 ff                                  	call   0x4525d0
  505e87:	57                                              	push   edi
  505e88:	8d 4e 05                                        	lea    ecx,[esi+0x5]
  505e8b:	8b 54 24 28                                     	mov    edx,DWORD PTR [esp+0x28]
  505e8f:	51                                              	push   ecx
  505e90:	52                                              	push   edx
  505e91:	51                                              	push   ecx
  505e92:	e8 29 08 01 00                                  	call   0x5166c0
  505e97:	83 c4 10                                        	add    esp,0x10
  505e9a:	89 64 24 64                                     	mov    DWORD PTR [esp+0x64],esp
  505e9e:	68 96 00 00 00                                  	push   0x96
  505ea3:	8b 4c 24 68                                     	mov    ecx,DWORD PTR [esp+0x68]
  505ea7:	e8 24 c7 f4 ff                                  	call   0x4525d0
  505eac:	57                                              	push   edi
  505ead:	8d 4e 06                                        	lea    ecx,[esi+0x6]
  505eb0:	51                                              	push   ecx
  505eb1:	57                                              	push   edi
  505eb2:	56                                              	push   esi
  505eb3:	e8 08 08 01 00                                  	call   0x5166c0
  505eb8:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  505f82:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  505f89:	89 4c 24 4c                                     	mov    DWORD PTR [esp+0x4c],ecx
  505f8d:	8b 84 24 cc 00 00 00                            	mov    eax,DWORD PTR [esp+0xcc]
  505f94:	03 c6                                           	add    eax,esi
  505f96:	89 44 24 30                                     	mov    DWORD PTR [esp+0x30],eax
  505f9a:	8d 58 ff                                        	lea    ebx,[eax-0x1]
  505f9d:	89 5c 24 54                                     	mov    DWORD PTR [esp+0x54],ebx
  505fa1:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  505fa5:	40                                              	inc    eax
  505fa6:	83 ec 08                                        	sub    esp,0x8
  505fa9:	89 44 24 58                                     	mov    DWORD PTR [esp+0x58],eax
  505fad:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  505fb1:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  505fb5:	68 9a 00 00 00                                  	push   0x9a
  505fba:	03 84 24 ac 00 00 00                            	add    eax,DWORD PTR [esp+0xac]
  505fc1:	89 44 24 40                                     	mov    DWORD PTR [esp+0x40],eax
  505fc5:	8d 78 ff                                        	lea    edi,[eax-0x1]
  505fc8:	89 7c 24 64                                     	mov    DWORD PTR [esp+0x64],edi
  505fcc:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  505fd0:	e8 9b ff f0 ff                                  	call   0x415f70
  505fd5:	8d 4c 24 54                                     	lea    ecx,[esp+0x54]
  505fd9:	51                                              	push   ecx
  505fda:	e8 b1 08 01 00                                  	call   0x516890
  505fdf:	83 c4 04                                        	add    esp,0x4
  505fe2:	89 64 24 4c                                     	mov    DWORD PTR [esp+0x4c],esp
  505fe6:	68 9d 00 00 00                                  	push   0x9d
  505feb:	8b 4c 24 50                                     	mov    ecx,DWORD PTR [esp+0x50]
  505fef:	e8 dc c5 f4 ff                                  	call   0x4525d0
  505ff4:	8b 44 24 3c                                     	mov    eax,DWORD PTR [esp+0x3c]
  505ff8:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  505ffc:	50                                              	push   eax
  505ffd:	56                                              	push   esi
  505ffe:	51                                              	push   ecx
  505fff:	56                                              	push   esi
  506000:	e8 bb 06 01 00                                  	call   0x5166c0
  506005:	83 c4 10                                        	add    esp,0x10
  506008:	89 64 24 34                                     	mov    DWORD PTR [esp+0x34],esp
  50600c:	68 9d 00 00 00                                  	push   0x9d
  506011:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  506015:	e8 b6 c5 f4 ff                                  	call   0x4525d0
  50601a:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  50601e:	8b 54 24 38                                     	mov    edx,DWORD PTR [esp+0x38]
  506022:	51                                              	push   ecx
  506023:	52                                              	push   edx
  506024:	51                                              	push   ecx
  506025:	56                                              	push   esi
  506026:	e8 95 06 01 00                                  	call   0x5166c0
  50602b:	83 c4 10                                        	add    esp,0x10
  50602e:	89 64 24 50                                     	mov    DWORD PTR [esp+0x50],esp
  506032:	68 96 00 00 00                                  	push   0x96
  506037:	8b 4c 24 54                                     	mov    ecx,DWORD PTR [esp+0x54]
  50603b:	e8 90 c5 f4 ff                                  	call   0x4525d0
  506040:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  506044:	57                                              	push   edi
  506045:	53                                              	push   ebx
  506046:	51                                              	push   ecx
  506047:	53                                              	push   ebx
  506048:	e8 73 06 01 00                                  	call   0x5166c0
  50604d:	83 c4 10                                        	add    esp,0x10
  506050:	89 64 24 64                                     	mov    DWORD PTR [esp+0x64],esp
  506054:	68 96 00 00 00                                  	push   0x96
  506059:	8b 4c 24 68                                     	mov    ecx,DWORD PTR [esp+0x68]
  50605d:	e8 6e c5 f4 ff                                  	call   0x4525d0
  506062:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  506066:	57                                              	push   edi
  506067:	51                                              	push   ecx
  506068:	57                                              	push   edi
  506069:	56                                              	push   esi
  50606a:	e8 51 06 01 00                                  	call   0x5166c0
  50606f:	83 c4 18                                        	add    esp,0x18
  506072:	83 c6 02                                        	add    esi,0x2
  506075:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  506335:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  50633c:	8b 94 24 a8 00 00 00                            	mov    edx,DWORD PTR [esp+0xa8]
  506343:	8b 44 24 38                                     	mov    eax,DWORD PTR [esp+0x38]
  506347:	40                                              	inc    eax
  506348:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  50634c:	03 ce                                           	add    ecx,esi
  50634e:	8b 5c 24 1c                                     	mov    ebx,DWORD PTR [esp+0x1c]
  506352:	43                                              	inc    ebx
  506353:	89 44 24 4c                                     	mov    DWORD PTR [esp+0x4c],eax
  506357:	8d 79 ff                                        	lea    edi,[ecx-0x1]
  50635a:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  50635e:	89 8c 24 a4 00 00 00                            	mov    DWORD PTR [esp+0xa4],ecx
  506365:	89 7c 24 54                                     	mov    DWORD PTR [esp+0x54],edi
  506369:	8d 74 10 04                                     	lea    esi,[eax+edx*1+0x4]
  50636d:	89 5c 24 50                                     	mov    DWORD PTR [esp+0x50],ebx
  506371:	8d 44 10 05                                     	lea    eax,[eax+edx*1+0x5]
  506375:	83 ec 08                                        	sub    esp,0x8
  506378:	89 84 24 b8 00 00 00                            	mov    DWORD PTR [esp+0xb8],eax
  50637f:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  506383:	89 74 24 60                                     	mov    DWORD PTR [esp+0x60],esi
  506387:	68 9a 00 00 00                                  	push   0x9a
  50638c:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  506390:	e8 db fb f0 ff                                  	call   0x415f70
  506395:	8d 4c 24 54                                     	lea    ecx,[esp+0x54]
  506399:	51                                              	push   ecx
  50639a:	e8 f1 04 01 00                                  	call   0x516890
  50639f:	83 c4 04                                        	add    esp,0x4
  5063a2:	89 64 24 4c                                     	mov    DWORD PTR [esp+0x4c],esp
  5063a6:	68 9d 00 00 00                                  	push   0x9d
  5063ab:	8b 4c 24 50                                     	mov    ecx,DWORD PTR [esp+0x50]
  5063af:	e8 1c c2 f4 ff                                  	call   0x4525d0
  5063b4:	8b 84 24 b8 00 00 00                            	mov    eax,DWORD PTR [esp+0xb8]
  5063bb:	8b 4c 24 40                                     	mov    ecx,DWORD PTR [esp+0x40]
  5063bf:	8b 54 24 24                                     	mov    edx,DWORD PTR [esp+0x24]
  5063c3:	50                                              	push   eax
  5063c4:	51                                              	push   ecx
  5063c5:	52                                              	push   edx
  5063c6:	51                                              	push   ecx
  5063c7:	e8 f4 02 01 00                                  	call   0x5166c0
  5063cc:	83 c4 10                                        	add    esp,0x10
  5063cf:	89 64 24 34                                     	mov    DWORD PTR [esp+0x34],esp
  5063d3:	68 9d 00 00 00                                  	push   0x9d
  5063d8:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  5063dc:	e8 ef c1 f4 ff                                  	call   0x4525d0
  5063e1:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  5063e5:	8b 94 24 ac 00 00 00                            	mov    edx,DWORD PTR [esp+0xac]
  5063ec:	8b 44 24 40                                     	mov    eax,DWORD PTR [esp+0x40]
  5063f0:	51                                              	push   ecx
  5063f1:	52                                              	push   edx
  5063f2:	51                                              	push   ecx
  5063f3:	50                                              	push   eax
  5063f4:	e8 c7 02 01 00                                  	call   0x5166c0
  5063f9:	83 c4 10                                        	add    esp,0x10
  5063fc:	89 64 24 50                                     	mov    DWORD PTR [esp+0x50],esp
  506400:	68 96 00 00 00                                  	push   0x96
  506405:	8b 4c 24 54                                     	mov    ecx,DWORD PTR [esp+0x54]
  506409:	e8 c2 c1 f4 ff                                  	call   0x4525d0
  50640e:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  506412:	56                                              	push   esi
  506413:	57                                              	push   edi
  506414:	51                                              	push   ecx
  506415:	57                                              	push   edi
  506416:	e8 a5 02 01 00                                  	call   0x5166c0
  50641b:	83 c4 10                                        	add    esp,0x10
  50641e:	89 64 24 64                                     	mov    DWORD PTR [esp+0x64],esp
  506422:	68 96 00 00 00                                  	push   0x96
  506427:	8b 4c 24 68                                     	mov    ecx,DWORD PTR [esp+0x68]
  50642b:	e8 a0 c1 f4 ff                                  	call   0x4525d0
  506430:	8b 8c 24 ac 00 00 00                            	mov    ecx,DWORD PTR [esp+0xac]
  506437:	56                                              	push   esi
  506438:	8b 54 24 44                                     	mov    edx,DWORD PTR [esp+0x44]
  50643c:	51                                              	push   ecx
  50643d:	56                                              	push   esi
  50643e:	52                                              	push   edx
  50643f:	e8 7c 02 01 00                                  	call   0x5166c0
  506444:	8b 84 24 d0 00 00 00                            	mov    eax,DWORD PTR [esp+0xd0]
  50644b:	83 c4 18                                        	add    esp,0x18
  50644e:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  506a8b:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  506a92:	89 5c 24 4c                                     	mov    DWORD PTR [esp+0x4c],ebx
  506a96:	89 44 24 54                                     	mov    DWORD PTR [esp+0x54],eax
  506a9a:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  506a9e:	40                                              	inc    eax
  506a9f:	83 ec 08                                        	sub    esp,0x8
  506aa2:	89 44 24 58                                     	mov    DWORD PTR [esp+0x58],eax
  506aa6:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  506aaa:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  506aae:	68 9a 00 00 00                                  	push   0x9a
  506ab3:	8d 5c 08 05                                     	lea    ebx,[eax+ecx*1+0x5]
  506ab7:	8d 4c 08 04                                     	lea    ecx,[eax+ecx*1+0x4]
  506abb:	89 4c 24 64                                     	mov    DWORD PTR [esp+0x64],ecx
  506abf:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  506ac3:	e8 a8 f4 f0 ff                                  	call   0x415f70
  506ac8:	8d 44 24 54                                     	lea    eax,[esp+0x54]
  506acc:	50                                              	push   eax
  506acd:	e8 be fd 00 00                                  	call   0x516890
  506ad2:	83 c4 04                                        	add    esp,0x4
  506ad5:	89 64 24 4c                                     	mov    DWORD PTR [esp+0x4c],esp
  506ad9:	68 9d 00 00 00                                  	push   0x9d
  506ade:	8b 4c 24 50                                     	mov    ecx,DWORD PTR [esp+0x50]
  506ae2:	e8 e9 ba f4 ff                                  	call   0x4525d0
  506ae7:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  506aeb:	53                                              	push   ebx
  506aec:	56                                              	push   esi
  506aed:	50                                              	push   eax
  506aee:	56                                              	push   esi
  506aef:	e8 cc fb 00 00                                  	call   0x5166c0
  506af4:	83 c4 10                                        	add    esp,0x10
  506af7:	89 64 24 34                                     	mov    DWORD PTR [esp+0x34],esp
  506afb:	68 9d 00 00 00                                  	push   0x9d
  506b00:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  506b04:	e8 c7 ba f4 ff                                  	call   0x4525d0
  506b09:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  506b0d:	50                                              	push   eax
  506b0e:	57                                              	push   edi
  506b0f:	50                                              	push   eax
  506b10:	56                                              	push   esi
  506b11:	e8 aa fb 00 00                                  	call   0x5166c0
  506b16:	83 c4 10                                        	add    esp,0x10
  506b19:	89 64 24 50                                     	mov    DWORD PTR [esp+0x50],esp
  506b1d:	68 96 00 00 00                                  	push   0x96
  506b22:	8b 4c 24 54                                     	mov    ecx,DWORD PTR [esp+0x54]
  506b26:	e8 a5 ba f4 ff                                  	call   0x4525d0
  506b2b:	8d 4b ff                                        	lea    ecx,[ebx-0x1]
  506b2e:	8d 57 ff                                        	lea    edx,[edi-0x1]
  506b31:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  506b35:	51                                              	push   ecx
  506b36:	52                                              	push   edx
  506b37:	50                                              	push   eax
  506b38:	52                                              	push   edx
  506b39:	e8 82 fb 00 00                                  	call   0x5166c0
  506b3e:	83 c4 10                                        	add    esp,0x10
  506b41:	89 64 24 64                                     	mov    DWORD PTR [esp+0x64],esp
  506b45:	68 96 00 00 00                                  	push   0x96
  506b4a:	8b 4c 24 68                                     	mov    ecx,DWORD PTR [esp+0x68]
  506b4e:	e8 7d ba f4 ff                                  	call   0x4525d0
  506b53:	8d 4b ff                                        	lea    ecx,[ebx-0x1]
  506b56:	51                                              	push   ecx
  506b57:	57                                              	push   edi
  506b58:	51                                              	push   ecx
  506b59:	56                                              	push   esi
  506b5a:	83 c6 03                                        	add    esi,0x3
  506b5d:	e8 5e fb 00 00                                  	call   0x5166c0
  506b62:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  506c94:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  506c9b:	89 5c 24 4c                                     	mov    DWORD PTR [esp+0x4c],ebx
  506c9f:	8d 44 16 03                                     	lea    eax,[esi+edx*1+0x3]
  506ca3:	8d 5c 16 04                                     	lea    ebx,[esi+edx*1+0x4]
  506ca7:	89 44 24 54                                     	mov    DWORD PTR [esp+0x54],eax
  506cab:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  506caf:	83 ec 08                                        	sub    esp,0x8
  506cb2:	40                                              	inc    eax
  506cb3:	89 44 24 58                                     	mov    DWORD PTR [esp+0x58],eax
  506cb7:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  506cbb:	8d 7c 08 05                                     	lea    edi,[eax+ecx*1+0x5]
  506cbf:	8d 4c 08 04                                     	lea    ecx,[eax+ecx*1+0x4]
  506cc3:	89 4c 24 60                                     	mov    DWORD PTR [esp+0x60],ecx
  506cc7:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  506ccb:	68 9a 00 00 00                                  	push   0x9a
  506cd0:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  506cd4:	e8 97 f2 f0 ff                                  	call   0x415f70
  506cd9:	8d 44 24 54                                     	lea    eax,[esp+0x54]
  506cdd:	50                                              	push   eax
  506cde:	e8 ad fb 00 00                                  	call   0x516890
  506ce3:	83 c4 04                                        	add    esp,0x4
  506ce6:	89 64 24 4c                                     	mov    DWORD PTR [esp+0x4c],esp
  506cea:	68 9d 00 00 00                                  	push   0x9d
  506cef:	8b 4c 24 50                                     	mov    ecx,DWORD PTR [esp+0x50]
  506cf3:	e8 d8 b8 f4 ff                                  	call   0x4525d0
  506cf8:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  506cfc:	57                                              	push   edi
  506cfd:	56                                              	push   esi
  506cfe:	50                                              	push   eax
  506cff:	56                                              	push   esi
  506d00:	e8 bb f9 00 00                                  	call   0x5166c0
  506d05:	83 c4 10                                        	add    esp,0x10
  506d08:	89 64 24 34                                     	mov    DWORD PTR [esp+0x34],esp
  506d0c:	68 9d 00 00 00                                  	push   0x9d
  506d11:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  506d15:	e8 b6 b8 f4 ff                                  	call   0x4525d0
  506d1a:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  506d1e:	50                                              	push   eax
  506d1f:	53                                              	push   ebx
  506d20:	50                                              	push   eax
  506d21:	56                                              	push   esi
  506d22:	e8 99 f9 00 00                                  	call   0x5166c0
  506d27:	83 c4 10                                        	add    esp,0x10
  506d2a:	89 64 24 50                                     	mov    DWORD PTR [esp+0x50],esp
  506d2e:	68 96 00 00 00                                  	push   0x96
  506d33:	8b 4c 24 54                                     	mov    ecx,DWORD PTR [esp+0x54]
  506d37:	e8 94 b8 f4 ff                                  	call   0x4525d0
  506d3c:	8d 4f ff                                        	lea    ecx,[edi-0x1]
  506d3f:	8d 53 ff                                        	lea    edx,[ebx-0x1]
  506d42:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  506d46:	51                                              	push   ecx
  506d47:	52                                              	push   edx
  506d48:	50                                              	push   eax
  506d49:	52                                              	push   edx
  506d4a:	e8 71 f9 00 00                                  	call   0x5166c0
  506d4f:	83 c4 10                                        	add    esp,0x10
  506d52:	89 64 24 64                                     	mov    DWORD PTR [esp+0x64],esp
  506d56:	68 96 00 00 00                                  	push   0x96
  506d5b:	8b 4c 24 68                                     	mov    ecx,DWORD PTR [esp+0x68]
  506d5f:	e8 6c b8 f4 ff                                  	call   0x4525d0
  506d64:	8d 4f ff                                        	lea    ecx,[edi-0x1]
  506d67:	51                                              	push   ecx
  506d68:	53                                              	push   ebx
  506d69:	51                                              	push   ecx
  506d6a:	56                                              	push   esi
  506d6b:	83 c6 03                                        	add    esi,0x3
  506d6e:	e8 4d f9 00 00                                  	call   0x5166c0
  506d73:	83 c4 18                                        	add    esp,0x18
  506d76:	32 c9                                           	xor    cl,cl
  506d78:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  506e55:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  506e5c:	8b 44 24 38                                     	mov    eax,DWORD PTR [esp+0x38]
  506e60:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  506e64:	40                                              	inc    eax
  506e65:	03 8c 24 b8 00 00 00                            	add    ecx,DWORD PTR [esp+0xb8]
  506e6c:	89 44 24 4c                                     	mov    DWORD PTR [esp+0x4c],eax
  506e70:	8b 5c 24 1c                                     	mov    ebx,DWORD PTR [esp+0x1c]
  506e74:	8d 79 ff                                        	lea    edi,[ecx-0x1]
  506e77:	43                                              	inc    ebx
  506e78:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  506e7c:	89 8c 24 9c 00 00 00                            	mov    DWORD PTR [esp+0x9c],ecx
  506e83:	89 7c 24 54                                     	mov    DWORD PTR [esp+0x54],edi
  506e87:	83 ec 08                                        	sub    esp,0x8
  506e8a:	8d 74 10 04                                     	lea    esi,[eax+edx*1+0x4]
  506e8e:	8d 44 10 05                                     	lea    eax,[eax+edx*1+0x5]
  506e92:	89 5c 24 58                                     	mov    DWORD PTR [esp+0x58],ebx
  506e96:	89 84 24 c4 00 00 00                            	mov    DWORD PTR [esp+0xc4],eax
  506e9d:	89 74 24 60                                     	mov    DWORD PTR [esp+0x60],esi
  506ea1:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  506ea5:	68 9a 00 00 00                                  	push   0x9a
  506eaa:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  506eae:	e8 bd f0 f0 ff                                  	call   0x415f70
  506eb3:	8d 4c 24 54                                     	lea    ecx,[esp+0x54]
  506eb7:	51                                              	push   ecx
  506eb8:	e8 d3 f9 00 00                                  	call   0x516890
  506ebd:	83 c4 04                                        	add    esp,0x4
  506ec0:	89 64 24 4c                                     	mov    DWORD PTR [esp+0x4c],esp
  506ec4:	68 9d 00 00 00                                  	push   0x9d
  506ec9:	8b 4c 24 50                                     	mov    ecx,DWORD PTR [esp+0x50]
  506ecd:	e8 fe b6 f4 ff                                  	call   0x4525d0
  506ed2:	8b 84 24 c4 00 00 00                            	mov    eax,DWORD PTR [esp+0xc4]
  506ed9:	8b 4c 24 40                                     	mov    ecx,DWORD PTR [esp+0x40]
  506edd:	8b 54 24 24                                     	mov    edx,DWORD PTR [esp+0x24]
  506ee1:	50                                              	push   eax
  506ee2:	51                                              	push   ecx
  506ee3:	52                                              	push   edx
  506ee4:	51                                              	push   ecx
  506ee5:	e8 d6 f7 00 00                                  	call   0x5166c0
  506eea:	83 c4 10                                        	add    esp,0x10
  506eed:	89 64 24 34                                     	mov    DWORD PTR [esp+0x34],esp
  506ef1:	68 9d 00 00 00                                  	push   0x9d
  506ef6:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  506efa:	e8 d1 b6 f4 ff                                  	call   0x4525d0
  506eff:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  506f03:	8b 94 24 a4 00 00 00                            	mov    edx,DWORD PTR [esp+0xa4]
  506f0a:	8b 44 24 40                                     	mov    eax,DWORD PTR [esp+0x40]
  506f0e:	51                                              	push   ecx
  506f0f:	52                                              	push   edx
  506f10:	51                                              	push   ecx
  506f11:	50                                              	push   eax
  506f12:	e8 a9 f7 00 00                                  	call   0x5166c0
  506f17:	83 c4 10                                        	add    esp,0x10
  506f1a:	89 64 24 50                                     	mov    DWORD PTR [esp+0x50],esp
  506f1e:	68 96 00 00 00                                  	push   0x96
  506f23:	8b 4c 24 54                                     	mov    ecx,DWORD PTR [esp+0x54]
  506f27:	e8 a4 b6 f4 ff                                  	call   0x4525d0
  506f2c:	56                                              	push   esi
  506f2d:	8b 4c 24 28                                     	mov    ecx,DWORD PTR [esp+0x28]
  506f31:	57                                              	push   edi
  506f32:	51                                              	push   ecx
  506f33:	57                                              	push   edi
  506f34:	e8 87 f7 00 00                                  	call   0x5166c0
  506f39:	83 c4 10                                        	add    esp,0x10
  506f3c:	89 64 24 64                                     	mov    DWORD PTR [esp+0x64],esp
  506f40:	68 96 00 00 00                                  	push   0x96
  506f45:	8b 4c 24 68                                     	mov    ecx,DWORD PTR [esp+0x68]
  506f49:	e8 82 b6 f4 ff                                  	call   0x4525d0
  506f4e:	8b 8c 24 a4 00 00 00                            	mov    ecx,DWORD PTR [esp+0xa4]
  506f55:	56                                              	push   esi
  506f56:	8b 54 24 44                                     	mov    edx,DWORD PTR [esp+0x44]
  506f5a:	51                                              	push   ecx
  506f5b:	56                                              	push   esi
  506f5c:	52                                              	push   edx
  506f5d:	e8 5e f7 00 00                                  	call   0x5166c0
  506f62:	8b 8c 24 a0 00 00 00                            	mov    ecx,DWORD PTR [esp+0xa0]
  506f69:	8b 84 24 d0 00 00 00                            	mov    eax,DWORD PTR [esp+0xd0]
  506f70:	2b 84 24 dc 00 00 00                            	sub    eax,DWORD PTR [esp+0xdc]
  506f77:	89 4c 24 7c                                     	mov    DWORD PTR [esp+0x7c],ecx
  506f7b:	99                                              	cdq
  506f7c:	83 c4 18                                        	add    esp,0x18
  506f7f:	2b c2                                           	sub    eax,edx
  506f81:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  5074c0:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  5074c7:	8b 44 24 38                                     	mov    eax,DWORD PTR [esp+0x38]
  5074cb:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  5074cf:	40                                              	inc    eax
  5074d0:	03 ce                                           	add    ecx,esi
  5074d2:	89 44 24 4c                                     	mov    DWORD PTR [esp+0x4c],eax
  5074d6:	8d 71 ff                                        	lea    esi,[ecx-0x1]
  5074d9:	89 4c 24 34                                     	mov    DWORD PTR [esp+0x34],ecx
  5074dd:	89 74 24 54                                     	mov    DWORD PTR [esp+0x54],esi
  5074e1:	8b 44 24 1c                                     	mov    eax,DWORD PTR [esp+0x1c]
  5074e5:	40                                              	inc    eax
  5074e6:	83 ec 08                                        	sub    esp,0x8
  5074e9:	89 44 24 58                                     	mov    DWORD PTR [esp+0x58],eax
  5074ed:	89 64 24 28                                     	mov    DWORD PTR [esp+0x28],esp
  5074f1:	8b 44 24 24                                     	mov    eax,DWORD PTR [esp+0x24]
  5074f5:	68 9a 00 00 00                                  	push   0x9a
  5074fa:	8d 7c 10 04                                     	lea    edi,[eax+edx*1+0x4]
  5074fe:	8d 5c 10 05                                     	lea    ebx,[eax+edx*1+0x5]
  507502:	89 7c 24 64                                     	mov    DWORD PTR [esp+0x64],edi
  507506:	8b 4c 24 2c                                     	mov    ecx,DWORD PTR [esp+0x2c]
  50750a:	e8 61 ea f0 ff                                  	call   0x415f70
  50750f:	8d 44 24 54                                     	lea    eax,[esp+0x54]
  507513:	50                                              	push   eax
  507514:	e8 77 f3 00 00                                  	call   0x516890
  507519:	83 c4 04                                        	add    esp,0x4
  50751c:	89 64 24 4c                                     	mov    DWORD PTR [esp+0x4c],esp
  507520:	68 9d 00 00 00                                  	push   0x9d
  507525:	8b 4c 24 50                                     	mov    ecx,DWORD PTR [esp+0x50]
  507529:	e8 a2 b0 f4 ff                                  	call   0x4525d0
  50752e:	8b 4c 24 40                                     	mov    ecx,DWORD PTR [esp+0x40]
  507532:	53                                              	push   ebx
  507533:	8b 44 24 28                                     	mov    eax,DWORD PTR [esp+0x28]
  507537:	51                                              	push   ecx
  507538:	50                                              	push   eax
  507539:	51                                              	push   ecx
  50753a:	e8 81 f1 00 00                                  	call   0x5166c0
  50753f:	83 c4 10                                        	add    esp,0x10
  507542:	89 64 24 34                                     	mov    DWORD PTR [esp+0x34],esp
  507546:	68 9d 00 00 00                                  	push   0x9d
  50754b:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  50754f:	e8 7c b0 f4 ff                                  	call   0x4525d0
  507554:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  507558:	8b 54 24 3c                                     	mov    edx,DWORD PTR [esp+0x3c]
  50755c:	8b 44 24 40                                     	mov    eax,DWORD PTR [esp+0x40]
  507560:	51                                              	push   ecx
  507561:	52                                              	push   edx
  507562:	51                                              	push   ecx
  507563:	50                                              	push   eax
  507564:	e8 57 f1 00 00                                  	call   0x5166c0
  507569:	83 c4 10                                        	add    esp,0x10
  50756c:	89 64 24 50                                     	mov    DWORD PTR [esp+0x50],esp
  507570:	68 96 00 00 00                                  	push   0x96
  507575:	8b 4c 24 54                                     	mov    ecx,DWORD PTR [esp+0x54]
  507579:	e8 52 b0 f4 ff                                  	call   0x4525d0
  50757e:	8b 4c 24 24                                     	mov    ecx,DWORD PTR [esp+0x24]
  507582:	57                                              	push   edi
  507583:	56                                              	push   esi
  507584:	51                                              	push   ecx
  507585:	56                                              	push   esi
  507586:	e8 35 f1 00 00                                  	call   0x5166c0
  50758b:	83 c4 10                                        	add    esp,0x10
  50758e:	89 64 24 64                                     	mov    DWORD PTR [esp+0x64],esp
  507592:	68 96 00 00 00                                  	push   0x96
  507597:	8b 4c 24 68                                     	mov    ecx,DWORD PTR [esp+0x68]
  50759b:	e8 30 b0 f4 ff                                  	call   0x4525d0
  5075a0:	8b 4c 24 3c                                     	mov    ecx,DWORD PTR [esp+0x3c]
  5075a4:	57                                              	push   edi
  5075a5:	8b 54 24 44                                     	mov    edx,DWORD PTR [esp+0x44]
  5075a9:	51                                              	push   ecx
  5075aa:	57                                              	push   edi
  5075ab:	33 f6                                           	xor    esi,esi
  5075ad:	52                                              	push   edx
  5075ae:	e8 0d f1 00 00                                  	call   0x5166c0
  5075b3:	8b 84 24 d0 00 00 00                            	mov    eax,DWORD PTR [esp+0xd0]
  5075ba:	83 c4 18                                        	add    esp,0x18
  5075bd:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  50772e:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  507735:	2b 84 24 ec 00 00 00                            	sub    eax,DWORD PTR [esp+0xec]
  50773c:	99                                              	cdq
  50773d:	2b c2                                           	sub    eax,edx
  50773f:	8b 54 24 1c                                     	mov    edx,DWORD PTR [esp+0x1c]
  507743:	c1 f8 01                                        	sar    eax,0x1
  507746:	03 c8                                           	add    ecx,eax
  507748:	a1 14 df 59 00                                  	mov    eax,ds:0x59df14
  50774d:	05 a0 01 00 00                                  	add    eax,0x1a0
  507752:	50                                              	push   eax
  507753:	52                                              	push   edx
  507754:	51                                              	push   ecx
  507755:	e8 86 eb 00 00                                  	call   0x5162e0
  50775a:	83 c4 0c                                        	add    esp,0xc
  50775d:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
  52548c:	83 0d 74 a0 5d 00 10                            	or     DWORD PTR ds:0x5da074,0x10
  525493:	89 44 24 28                                     	mov    DWORD PTR [esp+0x28],eax
  525497:	89 64 24 18                                     	mov    DWORD PTR [esp+0x18],esp
  52549b:	8b 4c 24 18                                     	mov    ecx,DWORD PTR [esp+0x18]
  52549f:	68 9a 00 00 00                                  	push   0x9a
  5254a4:	e8 c7 0a ef ff                                  	call   0x415f70
  5254a9:	8d 4c 24 1c                                     	lea    ecx,[esp+0x1c]
  5254ad:	51                                              	push   ecx
  5254ae:	e8 dd 13 ff ff                                  	call   0x516890
  5254b3:	83 c4 04                                        	add    esp,0x4
  5254b6:	89 64 24 2c                                     	mov    DWORD PTR [esp+0x2c],esp
  5254ba:	68 9d 00 00 00                                  	push   0x9d
  5254bf:	8b 4c 24 30                                     	mov    ecx,DWORD PTR [esp+0x30]
  5254c3:	e8 08 d1 f2 ff                                  	call   0x4525d0
  5254c8:	8d 4f 1a                                        	lea    ecx,[edi+0x1a]
  5254cb:	51                                              	push   ecx
  5254cc:	56                                              	push   esi
  5254cd:	57                                              	push   edi
  5254ce:	56                                              	push   esi
  5254cf:	e8 ec 11 ff ff                                  	call   0x5166c0
  5254d4:	83 c4 10                                        	add    esp,0x10
  5254d7:	89 64 24 30                                     	mov    DWORD PTR [esp+0x30],esp
  5254db:	68 9d 00 00 00                                  	push   0x9d
  5254e0:	8b 4c 24 34                                     	mov    ecx,DWORD PTR [esp+0x34]
  5254e4:	e8 e7 d0 f2 ff                                  	call   0x4525d0
  5254e9:	57                                              	push   edi
  5254ea:	8d 4e 06                                        	lea    ecx,[esi+0x6]
  5254ed:	51                                              	push   ecx
  5254ee:	57                                              	push   edi
  5254ef:	56                                              	push   esi
  5254f0:	e8 cb 11 ff ff                                  	call   0x5166c0
  5254f5:	83 c4 10                                        	add    esp,0x10
  5254f8:	89 64 24 34                                     	mov    DWORD PTR [esp+0x34],esp
  5254fc:	68 96 00 00 00                                  	push   0x96
  525501:	8b 4c 24 38                                     	mov    ecx,DWORD PTR [esp+0x38]
  525505:	e8 c6 d0 f2 ff                                  	call   0x4525d0
  52550a:	8d 4f 19                                        	lea    ecx,[edi+0x19]
  52550d:	8d 56 05                                        	lea    edx,[esi+0x5]
  525510:	51                                              	push   ecx
  525511:	52                                              	push   edx
  525512:	57                                              	push   edi
  525513:	52                                              	push   edx
  525514:	e8 a7 11 ff ff                                  	call   0x5166c0
  525519:	83 c4 10                                        	add    esp,0x10
  52551c:	89 64 24 38                                     	mov    DWORD PTR [esp+0x38],esp
  525520:	68 96 00 00 00                                  	push   0x96
  525525:	8b 4c 24 3c                                     	mov    ecx,DWORD PTR [esp+0x3c]
  525529:	e8 a2 d0 f2 ff                                  	call   0x4525d0
  52552e:	8d 4f 19                                        	lea    ecx,[edi+0x19]
  525531:	8d 56 06                                        	lea    edx,[esi+0x6]
  525534:	51                                              	push   ecx
  525535:	52                                              	push   edx
  525536:	51                                              	push   ecx
  525537:	56                                              	push   esi
  525538:	e8 83 11 ff ff                                  	call   0x5166c0
  52553d:	83 25 74 a0 5d 00 ef                            	and    DWORD PTR ds:0x5da074,0xffffffef
