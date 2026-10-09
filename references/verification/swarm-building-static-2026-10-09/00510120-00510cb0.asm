
/workspace/scratch/69fd8163d94e/populous-recovery-20261009/work/orchestration/original-data-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00510120 <.text+0x10f120>:
  510120:	83 ec 44             	sub    esp,0x44
  510123:	53                   	push   ebx
  510124:	56                   	push   esi
  510125:	57                   	push   edi
  510126:	55                   	push   ebp
  510127:	8b 7c 24 58          	mov    edi,DWORD PTR [esp+0x58]
  51012b:	f6 47 10 10          	test   BYTE PTR [edi+0x10],0x10
  51012f:	75 10                	jne    0x510141
  510131:	6a 40                	push   0x40
  510133:	68 a4 00 00 00       	push   0xa4
  510138:	57                   	push   edi
  510139:	e8 12 9f f7 ff       	call   0x48a050
  51013e:	83 c4 0c             	add    esp,0xc
  510141:	33 c0                	xor    eax,eax
  510143:	8a 47 2d             	mov    al,BYTE PTR [edi+0x2d]
  510146:	83 f8 03             	cmp    eax,0x3
  510149:	0f 87 67 07 00 00    	ja     0x5108b6
  51014f:	ff 24 85 10 0c 51 00 	jmp    DWORD PTR [eax*4+0x510c10]
  510156:	57                   	push   edi
  510157:	e8 e4 0b 00 00       	call   0x510d40
  51015c:	83 c4 04             	add    esp,0x4
  51015f:	e9 52 07 00 00       	jmp    0x5108b6
  510164:	81 4f 0c 80 00 00 00 	or     DWORD PTR [edi+0xc],0x80
  51016b:	66 c7 47 5f 50 00    	mov    WORD PTR [edi+0x5f],0x50
  510171:	8d 6f 3d             	lea    ebp,[edi+0x3d]
  510174:	8d 77 75             	lea    esi,[edi+0x75]
  510177:	55                   	push   ebp
  510178:	56                   	push   esi
  510179:	e8 d2 02 f4 ff       	call   0x450450
  51017e:	83 c4 08             	add    esp,0x8
  510181:	3d 00 00 90 00       	cmp    eax,0x900000
  510186:	0f 8e cc 00 00 00    	jle    0x510258
  51018c:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  510191:	8b c8                	mov    ecx,eax
  510193:	8d 14 c0             	lea    edx,[eax+eax*8]
  510196:	8d 04 d1             	lea    eax,[ecx+edx*8]
  510199:	8d 04 81             	lea    eax,[ecx+eax*4]
  51019c:	c1 e0 02             	shl    eax,0x2
  51019f:	8d 04 c1             	lea    eax,[ecx+eax*8]
  5101a2:	05 df 24 00 00       	add    eax,0x24df
  5101a7:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  5101ac:	89 44 24 40          	mov    DWORD PTR [esp+0x40],eax
  5101b0:	c1 4c 24 40 0d       	ror    DWORD PTR [esp+0x40],0xd
  5101b5:	8b 44 24 40          	mov    eax,DWORD PTR [esp+0x40]
  5101b9:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  5101be:	66 25 1f 00          	and    ax,0x1f
  5101c2:	66 89 47 70          	mov    WORD PTR [edi+0x70],ax
  5101c6:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  5101cb:	8b c8                	mov    ecx,eax
  5101cd:	8d 14 c0             	lea    edx,[eax+eax*8]
  5101d0:	8d 04 d1             	lea    eax,[ecx+edx*8]
  5101d3:	8d 04 81             	lea    eax,[ecx+eax*4]
  5101d6:	c1 e0 02             	shl    eax,0x2
  5101d9:	8d 04 c1             	lea    eax,[ecx+eax*8]
  5101dc:	05 df 24 00 00       	add    eax,0x24df
  5101e1:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  5101e6:	89 44 24 3c          	mov    DWORD PTR [esp+0x3c],eax
  5101ea:	c1 4c 24 3c 0d       	ror    DWORD PTR [esp+0x3c],0xd
  5101ef:	8b 44 24 3c          	mov    eax,DWORD PTR [esp+0x3c]
  5101f3:	8b d8                	mov    ebx,eax
  5101f5:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  5101fa:	66 8b 06             	mov    ax,WORD PTR [esi]
  5101fd:	66 2b 45 00          	sub    ax,WORD PTR [ebp+0x0]
  510201:	0f b7 d0             	movzx  edx,ax
  510204:	66 8b 47 77          	mov    ax,WORD PTR [edi+0x77]
  510208:	8b ca                	mov    ecx,edx
  51020a:	66 2b 47 3f          	sub    ax,WORD PTR [edi+0x3f]
  51020e:	85 d2                	test   edx,edx
  510210:	0f b7 c0             	movzx  eax,ax
  510213:	7d 04                	jge    0x510219
  510215:	8b ca                	mov    ecx,edx
  510217:	f7 d9                	neg    ecx
  510219:	8b e8                	mov    ebp,eax
  51021b:	85 c0                	test   eax,eax
  51021d:	7d 04                	jge    0x510223
  51021f:	8b e8                	mov    ebp,eax
  510221:	f7 dd                	neg    ebp
  510223:	81 f9 00 80 00 00    	cmp    ecx,0x8000
  510229:	7c 06                	jl     0x510231
  51022b:	8d 91 00 00 ff ff    	lea    edx,[ecx-0x10000]
  510231:	81 fd 00 80 00 00    	cmp    ebp,0x8000
  510237:	7c 06                	jl     0x51023f
  510239:	8d 85 00 00 ff ff    	lea    eax,[ebp-0x10000]
  51023f:	f7 d8                	neg    eax
  510241:	66 83 e3 7f          	and    bx,0x7f
  510245:	50                   	push   eax
  510246:	52                   	push   edx
  510247:	e8 28 5e 07 00       	call   0x586074
  51024c:	66 03 c3             	add    ax,bx
  51024f:	83 c4 08             	add    esp,0x8
  510252:	66 2d 40 00          	sub    ax,0x40
  510256:	eb 7c                	jmp    0x5102d4
  510258:	66 8b 47 70          	mov    ax,WORD PTR [edi+0x70]
  51025c:	66 85 c0             	test   ax,ax
  51025f:	8d 48 ff             	lea    ecx,[eax-0x1]
  510262:	66 89 4f 70          	mov    WORD PTR [edi+0x70],cx
  510266:	75 7b                	jne    0x5102e3
  510268:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  51026d:	8b c8                	mov    ecx,eax
  51026f:	8d 14 c0             	lea    edx,[eax+eax*8]
  510272:	8d 04 d1             	lea    eax,[ecx+edx*8]
  510275:	8d 04 81             	lea    eax,[ecx+eax*4]
  510278:	c1 e0 02             	shl    eax,0x2
  51027b:	8d 04 c1             	lea    eax,[ecx+eax*8]
  51027e:	05 df 24 00 00       	add    eax,0x24df
  510283:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  510288:	89 44 24 38          	mov    DWORD PTR [esp+0x38],eax
  51028c:	c1 4c 24 38 0d       	ror    DWORD PTR [esp+0x38],0xd
  510291:	8b 44 24 38          	mov    eax,DWORD PTR [esp+0x38]
  510295:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  51029a:	66 25 1f 00          	and    ax,0x1f
  51029e:	66 89 47 70          	mov    WORD PTR [edi+0x70],ax
  5102a2:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  5102a7:	8b c8                	mov    ecx,eax
  5102a9:	8d 14 c0             	lea    edx,[eax+eax*8]
  5102ac:	8d 04 d1             	lea    eax,[ecx+edx*8]
  5102af:	8d 04 81             	lea    eax,[ecx+eax*4]
  5102b2:	c1 e0 02             	shl    eax,0x2
  5102b5:	8d 04 c1             	lea    eax,[ecx+eax*8]
  5102b8:	05 df 24 00 00       	add    eax,0x24df
  5102bd:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  5102c2:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  5102c6:	c1 4c 24 34 0d       	ror    DWORD PTR [esp+0x34],0xd
  5102cb:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  5102cf:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  5102d4:	66 25 ff 07          	and    ax,0x7ff
  5102d8:	81 4f 0c 00 10 00 00 	or     DWORD PTR [edi+0xc],0x1000
  5102df:	66 89 47 57          	mov    WORD PTR [edi+0x57],ax
  5102e3:	f6 47 6c 3f          	test   BYTE PTR [edi+0x6c],0x3f
  5102e7:	0f 85 c9 05 00 00    	jne    0x5108b6
  5102ed:	66 8b 06             	mov    ax,WORD PTR [esi]
  5102f0:	66 c1 e8 08          	shr    ax,0x8
  5102f4:	c7 44 24 44 01 00 00 	mov    DWORD PTR [esp+0x44],0x1
  5102fb:	00 
  5102fc:	24 fe                	and    al,0xfe
  5102fe:	33 f6                	xor    esi,esi
  510300:	88 44 24 16          	mov    BYTE PTR [esp+0x16],al
  510304:	66 8b 47 77          	mov    ax,WORD PTR [edi+0x77]
  510308:	66 c1 e8 08          	shr    ax,0x8
  51030c:	24 fe                	and    al,0xfe
  51030e:	88 44 24 17          	mov    BYTE PTR [esp+0x17],al
  510312:	83 7c 24 44 00       	cmp    DWORD PTR [esp+0x44],0x0
  510317:	0f 84 99 05 00 00    	je     0x5108b6
  51031d:	8b 44 24 16          	mov    eax,DWORD PTR [esp+0x16]
  510321:	6a 00                	push   0x0
  510323:	56                   	push   esi
  510324:	50                   	push   eax
  510325:	e8 66 c5 f8 ff       	call   0x49c890
  51032a:	66 89 44 24 1e       	mov    WORD PTR [esp+0x1e],ax
  51032f:	83 c4 0c             	add    esp,0xc
  510332:	33 c0                	xor    eax,eax
  510334:	33 c9                	xor    ecx,ecx
  510336:	66 8b 44 24 12       	mov    ax,WORD PTR [esp+0x12]
  51033b:	66 8b 4c 24 12       	mov    cx,WORD PTR [esp+0x12]
  510340:	25 fe 00 00 00       	and    eax,0xfe
  510345:	03 c0                	add    eax,eax
  510347:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  51034d:	0b c1                	or     eax,ecx
  51034f:	0f bf 1c 85 ea 03 8a 	movsx  ebx,WORD PTR [eax*4+0x8a03ea]
  510356:	00 
  510357:	8b 14 9d 90 03 89 00 	mov    edx,DWORD PTR [ebx*4+0x890390]
  51035e:	85 d2                	test   edx,edx
  510360:	0f 84 a9 00 00 00    	je     0x51040f
  510366:	80 7a 2a 02          	cmp    BYTE PTR [edx+0x2a],0x2
  51036a:	0f 85 b1 00 00 00    	jne    0x510421
  510370:	8a 47 2f             	mov    al,BYTE PTR [edi+0x2f]
  510373:	38 42 2f             	cmp    BYTE PTR [edx+0x2f],al
  510376:	0f 84 a5 00 00 00    	je     0x510421
  51037c:	33 c9                	xor    ecx,ecx
  51037e:	33 c0                	xor    eax,eax
  510380:	66 8b 4a 24          	mov    cx,WORD PTR [edx+0x24]
  510384:	8d 5f 79             	lea    ebx,[edi+0x79]
  510387:	0f bf 2b             	movsx  ebp,WORD PTR [ebx]
  51038a:	3b e9                	cmp    ebp,ecx
  51038c:	0f 84 8f 00 00 00    	je     0x510421
  510392:	83 c3 02             	add    ebx,0x2
  510395:	40                   	inc    eax
  510396:	83 f8 0a             	cmp    eax,0xa
  510399:	7c ec                	jl     0x510387
  51039b:	33 c9                	xor    ecx,ecx
  51039d:	8d 47 79             	lea    eax,[edi+0x79]
  5103a0:	66 8b 4a 24          	mov    cx,WORD PTR [edx+0x24]
  5103a4:	33 d2                	xor    edx,edx
  5103a6:	66 89 4f 73          	mov    WORD PTR [edi+0x73],cx
  5103aa:	66 83 38 00          	cmp    WORD PTR [eax],0x0
  5103ae:	74 47                	je     0x5103f7
  5103b0:	83 c0 02             	add    eax,0x2
  5103b3:	42                   	inc    edx
  5103b4:	83 fa 0a             	cmp    edx,0xa
  5103b7:	7c f1                	jl     0x5103aa
  5103b9:	8b 15 78 d1 89 00    	mov    edx,DWORD PTR ds:0x89d178
  5103bf:	8b c2                	mov    eax,edx
  5103c1:	8d 1c d2             	lea    ebx,[edx+edx*8]
  5103c4:	8d 14 d8             	lea    edx,[eax+ebx*8]
  5103c7:	8d 14 90             	lea    edx,[eax+edx*4]
  5103ca:	c1 e2 02             	shl    edx,0x2
  5103cd:	8d 14 d0             	lea    edx,[eax+edx*8]
  5103d0:	81 c2 df 24 00 00    	add    edx,0x24df
  5103d6:	89 15 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,edx
  5103dc:	89 54 24 30          	mov    DWORD PTR [esp+0x30],edx
  5103e0:	c1 4c 24 30 0d       	ror    DWORD PTR [esp+0x30],0xd
  5103e5:	8b 44 24 30          	mov    eax,DWORD PTR [esp+0x30]
  5103e9:	bb 0a 00 00 00       	mov    ebx,0xa
  5103ee:	2b d2                	sub    edx,edx
  5103f0:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  5103f5:	f7 f3                	div    ebx
  5103f7:	c7 44 24 44 00 00 00 	mov    DWORD PTR [esp+0x44],0x0
  5103fe:	00 
  5103ff:	66 89 4c 57 79       	mov    WORD PTR [edi+edx*2+0x79],cx
  510404:	c6 47 2d 02          	mov    BYTE PTR [edi+0x2d],0x2
  510408:	c6 87 8d 00 00 00 00 	mov    BYTE PTR [edi+0x8d],0x0
  51040f:	46                   	inc    esi
  510410:	81 fe a7 00 00 00    	cmp    esi,0xa7
  510416:	0f 8c f6 fe ff ff    	jl     0x510312
  51041c:	e9 95 04 00 00       	jmp    0x5108b6
  510421:	33 c0                	xor    eax,eax
  510423:	66 8b 42 20          	mov    ax,WORD PTR [edx+0x20]
  510427:	8b 14 85 90 03 89 00 	mov    edx,DWORD PTR [eax*4+0x890390]
  51042e:	85 d2                	test   edx,edx
  510430:	0f 85 30 ff ff ff    	jne    0x510366
  510436:	eb d7                	jmp    0x51040f
  510438:	66 8b 47 73          	mov    ax,WORD PTR [edi+0x73]
  51043c:	33 ed                	xor    ebp,ebp
  51043e:	66 3b c5             	cmp    ax,bp
  510441:	74 18                	je     0x51045b
  510443:	0f b7 c0             	movzx  eax,ax
  510446:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  51044d:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  510451:	75 08                	jne    0x51045b
  510453:	80 78 2a 00          	cmp    BYTE PTR [eax+0x2a],0x0
  510457:	74 02                	je     0x51045b
  510459:	8b e8                	mov    ebp,eax
  51045b:	85 ed                	test   ebp,ebp
  51045d:	0f 84 4f 04 00 00    	je     0x5108b2
  510463:	33 c0                	xor    eax,eax
  510465:	8a 87 8d 00 00 00    	mov    al,BYTE PTR [edi+0x8d]
  51046b:	83 f8 09             	cmp    eax,0x9
  51046e:	0f 87 42 04 00 00    	ja     0x5108b6
  510474:	ff 24 85 20 0c 51 00 	jmp    DWORD PTR [eax*4+0x510c20]
  51047b:	c6 87 8d 00 00 00 01 	mov    BYTE PTR [edi+0x8d],0x1
  510482:	e9 2f 04 00 00       	jmp    0x5108b6
  510487:	8d 44 24 2c          	lea    eax,[esp+0x2c]
  51048b:	50                   	push   eax
  51048c:	55                   	push   ebp
  51048d:	e8 1e 40 ef ff       	call   0x4044b0
  510492:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  510496:	83 c4 08             	add    esp,0x8
  510499:	c6 87 8d 00 00 00 02 	mov    BYTE PTR [edi+0x8d],0x2
  5104a0:	89 47 4f             	mov    DWORD PTR [edi+0x4f],eax
  5104a3:	8b 47 0c             	mov    eax,DWORD PTR [edi+0xc]
  5104a6:	0d 00 10 00 00       	or     eax,0x1000
  5104ab:	89 47 0c             	mov    DWORD PTR [edi+0xc],eax
  5104ae:	25 7f ff ff ff       	and    eax,0xffffff7f
  5104b3:	89 47 0c             	mov    DWORD PTR [edi+0xc],eax
  5104b6:	e9 fb 03 00 00       	jmp    0x5108b6
  5104bb:	0f bf 47 4f          	movsx  eax,WORD PTR [edi+0x4f]
  5104bf:	0f bf 4f 3d          	movsx  ecx,WORD PTR [edi+0x3d]
  5104c3:	2b c1                	sub    eax,ecx
  5104c5:	99                   	cdq
  5104c6:	33 c2                	xor    eax,edx
  5104c8:	2b c2                	sub    eax,edx
  5104ca:	83 f8 70             	cmp    eax,0x70
  5104cd:	0f 8d e3 03 00 00    	jge    0x5108b6
  5104d3:	0f bf 47 51          	movsx  eax,WORD PTR [edi+0x51]
  5104d7:	0f bf 4f 3f          	movsx  ecx,WORD PTR [edi+0x3f]
  5104db:	2b c1                	sub    eax,ecx
  5104dd:	99                   	cdq
  5104de:	33 c2                	xor    eax,edx
  5104e0:	2b c2                	sub    eax,edx
  5104e2:	83 f8 70             	cmp    eax,0x70
  5104e5:	0f 8d cb 03 00 00    	jge    0x5108b6
  5104eb:	c6 87 8d 00 00 00 03 	mov    BYTE PTR [edi+0x8d],0x3
  5104f2:	e9 bf 03 00 00       	jmp    0x5108b6
  5104f7:	8d 44 24 2c          	lea    eax,[esp+0x2c]
  5104fb:	50                   	push   eax
  5104fc:	55                   	push   ebp
  5104fd:	e8 1e 3f ef ff       	call   0x404420
  510502:	83 c4 08             	add    esp,0x8
  510505:	33 c0                	xor    eax,eax
  510507:	66 8b 47 6e          	mov    ax,WORD PTR [edi+0x6e]
  51050b:	8b 14 85 90 03 89 00 	mov    edx,DWORD PTR [eax*4+0x890390]
  510512:	39 15 90 03 89 00    	cmp    DWORD PTR ds:0x890390,edx
  510518:	73 2a                	jae    0x510544
  51051a:	b9 01 00 00 00       	mov    ecx,0x1
  51051f:	88 4a 2d             	mov    BYTE PTR [edx+0x2d],cl
  510522:	8b 47 4f             	mov    eax,DWORD PTR [edi+0x4f]
  510525:	89 42 53             	mov    DWORD PTR [edx+0x53],eax
  510528:	33 c0                	xor    eax,eax
  51052a:	8b 5c 24 2c          	mov    ebx,DWORD PTR [esp+0x2c]
  51052e:	89 5a 4f             	mov    DWORD PTR [edx+0x4f],ebx
  510531:	66 8b 42 6e          	mov    ax,WORD PTR [edx+0x6e]
  510535:	8b 14 85 90 03 89 00 	mov    edx,DWORD PTR [eax*4+0x890390]
  51053c:	39 15 90 03 89 00    	cmp    DWORD PTR ds:0x890390,edx
  510542:	72 db                	jb     0x51051f
  510544:	81 4f 0c 00 40 00 00 	or     DWORD PTR [edi+0xc],0x4000
  51054b:	c6 87 8d 00 00 00 04 	mov    BYTE PTR [edi+0x8d],0x4
  510552:	e9 5f 03 00 00       	jmp    0x5108b6
  510557:	be 01 00 00 00       	mov    esi,0x1
  51055c:	33 c0                	xor    eax,eax
  51055e:	66 8b 47 6e          	mov    ax,WORD PTR [edi+0x6e]
  510562:	8b 0c 85 90 03 89 00 	mov    ecx,DWORD PTR [eax*4+0x890390]
  510569:	39 0d 90 03 89 00    	cmp    DWORD PTR ds:0x890390,ecx
  51056f:	73 24                	jae    0x510595
  510571:	b8 10 00 00 00       	mov    eax,0x10
  510576:	66 85 41 35          	test   WORD PTR [ecx+0x35],ax
  51057a:	74 17                	je     0x510593
  51057c:	33 d2                	xor    edx,edx
  51057e:	66 8b 51 6e          	mov    dx,WORD PTR [ecx+0x6e]
  510582:	8b 0c 95 90 03 89 00 	mov    ecx,DWORD PTR [edx*4+0x890390]
  510589:	39 0d 90 03 89 00    	cmp    DWORD PTR ds:0x890390,ecx
  51058f:	72 e5                	jb     0x510576
  510591:	eb 02                	jmp    0x510595
  510593:	33 f6                	xor    esi,esi
  510595:	85 f6                	test   esi,esi
  510597:	0f 84 19 03 00 00    	je     0x5108b6
  51059d:	c6 87 8d 00 00 00 05 	mov    BYTE PTR [edi+0x8d],0x5
  5105a4:	e9 0d 03 00 00       	jmp    0x5108b6
  5105a9:	80 bd a6 00 00 00 00 	cmp    BYTE PTR [ebp+0xa6],0x0
  5105b0:	0f 84 aa 00 00 00    	je     0x510660
  5105b6:	c7 44 24 48 06 00 00 	mov    DWORD PTR [esp+0x48],0x6
  5105bd:	00 
  5105be:	8d 9d 86 00 00 00    	lea    ebx,[ebp+0x86]
  5105c4:	66 8b 03             	mov    ax,WORD PTR [ebx]
  5105c7:	33 f6                	xor    esi,esi
  5105c9:	66 3b c6             	cmp    ax,si
  5105cc:	74 18                	je     0x5105e6
  5105ce:	0f b7 c0             	movzx  eax,ax
  5105d1:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  5105d8:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  5105dc:	75 08                	jne    0x5105e6
  5105de:	80 78 2a 00          	cmp    BYTE PTR [eax+0x2a],0x0
  5105e2:	74 02                	je     0x5105e6
  5105e4:	8b f0                	mov    esi,eax
  5105e6:	85 f6                	test   esi,esi
  5105e8:	74 69                	je     0x510653
  5105ea:	56                   	push   esi
  5105eb:	55                   	push   ebp
  5105ec:	e8 9f 6e ef ff       	call   0x407490
  5105f1:	83 c4 08             	add    esp,0x8
  5105f4:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  5105f7:	83 e0 ef             	and    eax,0xffffffef
  5105fa:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  5105fd:	a9 00 00 10 00       	test   eax,0x100000
  510602:	75 1c                	jne    0x510620
  510604:	8a 46 2c             	mov    al,BYTE PTR [esi+0x2c]
  510607:	56                   	push   esi
  510608:	88 46 7d             	mov    BYTE PTR [esi+0x7d],al
  51060b:	e8 e0 d0 fd ff       	call   0x4ed6f0
  510610:	83 c4 04             	add    esp,0x4
  510613:	c6 46 2c 1a          	mov    BYTE PTR [esi+0x2c],0x1a
  510617:	56                   	push   esi
  510618:	e8 23 d0 fd ff       	call   0x4ed640
  51061d:	83 c4 04             	add    esp,0x4
  510620:	f6 46 11 08          	test   BYTE PTR [esi+0x11],0x8
  510624:	74 09                	je     0x51062f
  510626:	56                   	push   esi
  510627:	e8 54 eb fd ff       	call   0x4ef180
  51062c:	83 c4 04             	add    esp,0x4
  51062f:	6a 00                	push   0x0
  510631:	a1 14 a5 5a 00       	mov    eax,ds:0x5aa514
  510636:	50                   	push   eax
  510637:	8a 4f 2f             	mov    cl,BYTE PTR [edi+0x2f]
  51063a:	51                   	push   ecx
  51063b:	56                   	push   esi
  51063c:	e8 3f 9a fc ff       	call   0x4da080
  510641:	83 c4 10             	add    esp,0x10
  510644:	80 7e 2b 05          	cmp    BYTE PTR [esi+0x2b],0x5
  510648:	75 09                	jne    0x510653
  51064a:	56                   	push   esi
  51064b:	e8 a0 e1 fc ff       	call   0x4de7f0
  510650:	83 c4 04             	add    esp,0x4
  510653:	83 c3 02             	add    ebx,0x2
  510656:	ff 4c 24 48          	dec    DWORD PTR [esp+0x48]
  51065a:	0f 85 64 ff ff ff    	jne    0x5105c4
  510660:	c6 87 8d 00 00 00 06 	mov    BYTE PTR [edi+0x8d],0x6
  510667:	66 c7 47 70 04 00    	mov    WORD PTR [edi+0x70],0x4
  51066d:	e9 44 02 00 00       	jmp    0x5108b6
  510672:	66 8b 47 70          	mov    ax,WORD PTR [edi+0x70]
  510676:	66 48                	dec    ax
  510678:	66 89 47 70          	mov    WORD PTR [edi+0x70],ax
  51067c:	66 85 c0             	test   ax,ax
  51067f:	0f 8f 31 02 00 00    	jg     0x5108b6
  510685:	c6 87 8d 00 00 00 07 	mov    BYTE PTR [edi+0x8d],0x7
  51068c:	e9 25 02 00 00       	jmp    0x5108b6
  510691:	33 c0                	xor    eax,eax
  510693:	66 8b 47 6e          	mov    ax,WORD PTR [edi+0x6e]
  510697:	8b 14 85 90 03 89 00 	mov    edx,DWORD PTR [eax*4+0x890390]
  51069e:	39 15 90 03 89 00    	cmp    DWORD PTR ds:0x890390,edx
  5106a4:	0f 83 ad 00 00 00    	jae    0x510757
  5106aa:	8d 72 76             	lea    esi,[edx+0x76]
  5106ad:	b9 05 00 00 00       	mov    ecx,0x5
  5106b2:	c6 42 2d 03          	mov    BYTE PTR [edx+0x2d],0x3
  5106b6:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  5106bb:	8b d8                	mov    ebx,eax
  5106bd:	8d 2c c0             	lea    ebp,[eax+eax*8]
  5106c0:	8d 04 eb             	lea    eax,[ebx+ebp*8]
  5106c3:	8d 04 83             	lea    eax,[ebx+eax*4]
  5106c6:	c1 e0 02             	shl    eax,0x2
  5106c9:	8d 04 c3             	lea    eax,[ebx+eax*8]
  5106cc:	05 df 24 00 00       	add    eax,0x24df
  5106d1:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  5106d6:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  5106da:	c1 4c 24 28 0d       	ror    DWORD PTR [esp+0x28],0xd
  5106df:	8b 44 24 28          	mov    eax,DWORD PTR [esp+0x28]
  5106e3:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  5106e8:	66 25 ff 01          	and    ax,0x1ff
  5106ec:	66 2d 00 01          	sub    ax,0x100
  5106f0:	66 89 06             	mov    WORD PTR [esi],ax
  5106f3:	8b 1d 78 d1 89 00    	mov    ebx,DWORD PTR ds:0x89d178
  5106f9:	8b c3                	mov    eax,ebx
  5106fb:	8d 2c db             	lea    ebp,[ebx+ebx*8]
  5106fe:	8d 1c e8             	lea    ebx,[eax+ebp*8]
  510701:	8d 1c 98             	lea    ebx,[eax+ebx*4]
  510704:	c1 e3 02             	shl    ebx,0x2
  510707:	8d 1c d8             	lea    ebx,[eax+ebx*8]
  51070a:	81 c3 df 24 00 00    	add    ebx,0x24df
  510710:	89 1d 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,ebx
  510716:	89 5c 24 24          	mov    DWORD PTR [esp+0x24],ebx
  51071a:	c1 4c 24 24 0d       	ror    DWORD PTR [esp+0x24],0xd
  51071f:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  510723:	83 c6 04             	add    esi,0x4
  510726:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  51072b:	66 25 ff 01          	and    ax,0x1ff
  51072f:	66 2d 00 01          	sub    ax,0x100
  510733:	49                   	dec    ecx
  510734:	66 89 46 fe          	mov    WORD PTR [esi-0x2],ax
  510738:	0f 85 78 ff ff ff    	jne    0x5106b6
  51073e:	33 c0                	xor    eax,eax
  510740:	66 8b 42 6e          	mov    ax,WORD PTR [edx+0x6e]
  510744:	8b 14 85 90 03 89 00 	mov    edx,DWORD PTR [eax*4+0x890390]
  51074b:	39 15 90 03 89 00    	cmp    DWORD PTR ds:0x890390,edx
  510751:	0f 82 53 ff ff ff    	jb     0x5106aa
  510757:	c6 87 8d 00 00 00 08 	mov    BYTE PTR [edi+0x8d],0x8
  51075e:	e9 53 01 00 00       	jmp    0x5108b6
  510763:	be 01 00 00 00       	mov    esi,0x1
  510768:	33 c0                	xor    eax,eax
  51076a:	66 8b 47 6e          	mov    ax,WORD PTR [edi+0x6e]
  51076e:	8b 0c 85 90 03 89 00 	mov    ecx,DWORD PTR [eax*4+0x890390]
  510775:	39 0d 90 03 89 00    	cmp    DWORD PTR ds:0x890390,ecx
  51077b:	73 24                	jae    0x5107a1
  51077d:	b8 10 00 00 00       	mov    eax,0x10
  510782:	66 85 41 35          	test   WORD PTR [ecx+0x35],ax
  510786:	75 17                	jne    0x51079f
  510788:	33 d2                	xor    edx,edx
  51078a:	66 8b 51 6e          	mov    dx,WORD PTR [ecx+0x6e]
  51078e:	8b 0c 95 90 03 89 00 	mov    ecx,DWORD PTR [edx*4+0x890390]
  510795:	39 0d 90 03 89 00    	cmp    DWORD PTR ds:0x890390,ecx
  51079b:	72 e5                	jb     0x510782
  51079d:	eb 02                	jmp    0x5107a1
  51079f:	33 f6                	xor    esi,esi
  5107a1:	85 f6                	test   esi,esi
  5107a3:	0f 84 0d 01 00 00    	je     0x5108b6
  5107a9:	c6 87 8d 00 00 00 09 	mov    BYTE PTR [edi+0x8d],0x9
  5107b0:	e9 01 01 00 00       	jmp    0x5108b6
  5107b5:	33 c0                	xor    eax,eax
  5107b7:	66 8b 47 6e          	mov    ax,WORD PTR [edi+0x6e]
  5107bb:	8b 0c 85 90 03 89 00 	mov    ecx,DWORD PTR [eax*4+0x890390]
  5107c2:	39 0d 90 03 89 00    	cmp    DWORD PTR ds:0x890390,ecx
  5107c8:	0f 83 ca 00 00 00    	jae    0x510898
  5107ce:	8b 15 78 d1 89 00    	mov    edx,DWORD PTR ds:0x89d178
  5107d4:	8b c2                	mov    eax,edx
  5107d6:	8d 1c d2             	lea    ebx,[edx+edx*8]
  5107d9:	8d 14 d8             	lea    edx,[eax+ebx*8]
  5107dc:	8d 14 90             	lea    edx,[eax+edx*4]
  5107df:	c1 e2 02             	shl    edx,0x2
  5107e2:	8d 14 d0             	lea    edx,[eax+edx*8]
  5107e5:	81 c2 df 24 00 00    	add    edx,0x24df
  5107eb:	89 15 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,edx
  5107f1:	89 54 24 20          	mov    DWORD PTR [esp+0x20],edx
  5107f5:	c1 4c 24 20 0d       	ror    DWORD PTR [esp+0x20],0xd
  5107fa:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  5107fe:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  510803:	66 25 7f 00          	and    ax,0x7f
  510807:	66 89 41 49          	mov    WORD PTR [ecx+0x49],ax
  51080b:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  510810:	8b d0                	mov    edx,eax
  510812:	8d 1c c0             	lea    ebx,[eax+eax*8]
  510815:	8d 04 da             	lea    eax,[edx+ebx*8]
  510818:	8d 04 82             	lea    eax,[edx+eax*4]
  51081b:	c1 e0 02             	shl    eax,0x2
  51081e:	8d 04 c2             	lea    eax,[edx+eax*8]
  510821:	05 df 24 00 00       	add    eax,0x24df
  510826:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  51082b:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  51082f:	c1 4c 24 1c 0d       	ror    DWORD PTR [esp+0x1c],0xd
  510834:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  510838:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  51083d:	66 25 7f 00          	and    ax,0x7f
  510841:	66 89 41 4b          	mov    WORD PTR [ecx+0x4b],ax
  510845:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  51084a:	8b d0                	mov    edx,eax
  51084c:	8d 1c c0             	lea    ebx,[eax+eax*8]
  51084f:	8d 04 da             	lea    eax,[edx+ebx*8]
  510852:	8d 04 82             	lea    eax,[edx+eax*4]
  510855:	c1 e0 02             	shl    eax,0x2
  510858:	8d 04 c2             	lea    eax,[edx+eax*8]
  51085b:	05 df 24 00 00       	add    eax,0x24df
  510860:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  510865:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  510869:	c1 4c 24 18 0d       	ror    DWORD PTR [esp+0x18],0xd
  51086e:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  510872:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  510877:	66 25 7f 00          	and    ax,0x7f
  51087b:	66 89 41 4d          	mov    WORD PTR [ecx+0x4d],ax
  51087f:	33 c0                	xor    eax,eax
  510881:	66 8b 41 6e          	mov    ax,WORD PTR [ecx+0x6e]
  510885:	8b 0c 85 90 03 89 00 	mov    ecx,DWORD PTR [eax*4+0x890390]
  51088c:	39 0d 90 03 89 00    	cmp    DWORD PTR ds:0x890390,ecx
  510892:	0f 82 36 ff ff ff    	jb     0x5107ce
  510898:	c6 47 2d 01          	mov    BYTE PTR [edi+0x2d],0x1
  51089c:	81 67 0c ff bf ff ff 	and    DWORD PTR [edi+0xc],0xffffbfff
  5108a3:	eb 11                	jmp    0x5108b6
  5108a5:	33 c0                	xor    eax,eax
  5108a7:	8a 87 8d 00 00 00    	mov    al,BYTE PTR [edi+0x8d]
  5108ad:	83 f8 64             	cmp    eax,0x64
  5108b0:	75 04                	jne    0x5108b6
  5108b2:	c6 47 2d 01          	mov    BYTE PTR [edi+0x2d],0x1
  5108b6:	f6 47 6c 07          	test   BYTE PTR [edi+0x6c],0x7
  5108ba:	0f 85 51 01 00 00    	jne    0x510a11
  5108c0:	66 8b 47 3d          	mov    ax,WORD PTR [edi+0x3d]
  5108c4:	66 c1 e8 08          	shr    ax,0x8
  5108c8:	33 db                	xor    ebx,ebx
  5108ca:	24 fe                	and    al,0xfe
  5108cc:	88 44 24 14          	mov    BYTE PTR [esp+0x14],al
  5108d0:	66 8b 47 3f          	mov    ax,WORD PTR [edi+0x3f]
  5108d4:	66 c1 e8 08          	shr    ax,0x8
  5108d8:	24 fe                	and    al,0xfe
  5108da:	88 44 24 15          	mov    BYTE PTR [esp+0x15],al
  5108de:	85 db                	test   ebx,ebx
  5108e0:	74 2f                	je     0x510911
  5108e2:	6a 00                	push   0x0
  5108e4:	8d 43 ff             	lea    eax,[ebx-0x1]
  5108e7:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  5108eb:	50                   	push   eax
  5108ec:	51                   	push   ecx
  5108ed:	e8 9e bf f8 ff       	call   0x49c890
  5108f2:	66 89 44 24 1e       	mov    WORD PTR [esp+0x1e],ax
  5108f7:	83 c4 0c             	add    esp,0xc
  5108fa:	33 c0                	xor    eax,eax
  5108fc:	33 c9                	xor    ecx,ecx
  5108fe:	66 8b 44 24 12       	mov    ax,WORD PTR [esp+0x12]
  510903:	66 8b 4c 24 12       	mov    cx,WORD PTR [esp+0x12]
  510908:	25 fe 00 00 00       	and    eax,0xfe
  51090d:	03 c0                	add    eax,eax
  51090f:	eb 15                	jmp    0x510926
  510911:	33 c0                	xor    eax,eax
  510913:	33 c9                	xor    ecx,ecx
  510915:	66 8b 44 24 14       	mov    ax,WORD PTR [esp+0x14]
  51091a:	66 8b 4c 24 14       	mov    cx,WORD PTR [esp+0x14]
  51091f:	25 fe 00 00 00       	and    eax,0xfe
  510924:	03 c0                	add    eax,eax
  510926:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  51092c:	0b c1                	or     eax,ecx
  51092e:	8d 04 85 e4 03 8a 00 	lea    eax,[eax*4+0x8a03e4]
  510935:	66 8b 40 06          	mov    ax,WORD PTR [eax+0x6]
  510939:	66 85 c0             	test   ax,ax
  51093c:	0f 84 c5 00 00 00    	je     0x510a07
  510942:	0f bf c0             	movsx  eax,ax
  510945:	8b 34 85 90 03 89 00 	mov    esi,DWORD PTR [eax*4+0x890390]
  51094c:	85 f6                	test   esi,esi
  51094e:	0f 84 b3 00 00 00    	je     0x510a07
  510954:	bd 00 01 00 00       	mov    ebp,0x100
  510959:	80 7e 2a 01          	cmp    BYTE PTR [esi+0x2a],0x1
  51095d:	0f 85 8f 00 00 00    	jne    0x5109f2
  510963:	f6 46 0e 80          	test   BYTE PTR [esi+0xe],0x80
  510967:	0f 85 85 00 00 00    	jne    0x5109f2
  51096d:	80 7e 2c 17          	cmp    BYTE PTR [esi+0x2c],0x17
  510971:	74 7f                	je     0x5109f2
  510973:	8a 47 2f             	mov    al,BYTE PTR [edi+0x2f]
  510976:	38 46 2f             	cmp    BYTE PTR [esi+0x2f],al
  510979:	74 77                	je     0x5109f2
  51097b:	33 c0                	xor    eax,eax
  51097d:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  510980:	8d 0c 80             	lea    ecx,[eax+eax*4]
  510983:	8d 14 89             	lea    edx,[ecx+ecx*4]
  510986:	66 85 2c 55 90 70 5a 	test   WORD PTR [edx*2+0x5a7090],bp
  51098d:	00 
  51098e:	75 62                	jne    0x5109f2
  510990:	6a 01                	push   0x1
  510992:	56                   	push   esi
  510993:	e8 e8 62 f5 ff       	call   0x466c80
  510998:	83 c4 08             	add    esp,0x8
  51099b:	f6 46 11 08          	test   BYTE PTR [esi+0x11],0x8
  51099f:	74 0b                	je     0x5109ac
  5109a1:	56                   	push   esi
  5109a2:	e8 d9 e7 fd ff       	call   0x4ef180
  5109a7:	83 c4 04             	add    esp,0x4
  5109aa:	eb 46                	jmp    0x5109f2
  5109ac:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  5109b0:	75 1c                	jne    0x5109ce
  5109b2:	8a 46 2c             	mov    al,BYTE PTR [esi+0x2c]
  5109b5:	56                   	push   esi
  5109b6:	88 46 7d             	mov    BYTE PTR [esi+0x7d],al
  5109b9:	e8 32 cd fd ff       	call   0x4ed6f0
  5109be:	83 c4 04             	add    esp,0x4
  5109c1:	c6 46 2c 1a          	mov    BYTE PTR [esi+0x2c],0x1a
  5109c5:	56                   	push   esi
  5109c6:	e8 75 cc fd ff       	call   0x4ed640
  5109cb:	83 c4 04             	add    esp,0x4
  5109ce:	80 7e 2b 05          	cmp    BYTE PTR [esi+0x2b],0x5
  5109d2:	75 09                	jne    0x5109dd
  5109d4:	56                   	push   esi
  5109d5:	e8 16 de fc ff       	call   0x4de7f0
  5109da:	83 c4 04             	add    esp,0x4
  5109dd:	6a 00                	push   0x0
  5109df:	a1 14 a5 5a 00       	mov    eax,ds:0x5aa514
  5109e4:	50                   	push   eax
  5109e5:	8a 4f 2f             	mov    cl,BYTE PTR [edi+0x2f]
  5109e8:	51                   	push   ecx
  5109e9:	56                   	push   esi
  5109ea:	e8 91 96 fc ff       	call   0x4da080
  5109ef:	83 c4 10             	add    esp,0x10
  5109f2:	33 c0                	xor    eax,eax
  5109f4:	66 8b 46 20          	mov    ax,WORD PTR [esi+0x20]
  5109f8:	8b 34 85 90 03 89 00 	mov    esi,DWORD PTR [eax*4+0x890390]
  5109ff:	85 f6                	test   esi,esi
  510a01:	0f 85 52 ff ff ff    	jne    0x510959
  510a07:	43                   	inc    ebx
  510a08:	83 fb 07             	cmp    ebx,0x7
  510a0b:	0f 8e cd fe ff ff    	jle    0x5108de
  510a11:	8b 47 0c             	mov    eax,DWORD PTR [edi+0xc]
  510a14:	f6 c4 40             	test   ah,0x40
  510a17:	0f 85 bc 00 00 00    	jne    0x510ad9
  510a1d:	a8 80                	test   al,0x80
  510a1f:	75 5e                	jne    0x510a7f
  510a21:	66 8b 47 4f          	mov    ax,WORD PTR [edi+0x4f]
  510a25:	66 2b 47 3d          	sub    ax,WORD PTR [edi+0x3d]
  510a29:	0f b7 f0             	movzx  esi,ax
  510a2c:	66 8b 47 51          	mov    ax,WORD PTR [edi+0x51]
  510a30:	66 2b 47 3f          	sub    ax,WORD PTR [edi+0x3f]
  510a34:	85 f6                	test   esi,esi
  510a36:	0f b7 d0             	movzx  edx,ax
  510a39:	8b c6                	mov    eax,esi
  510a3b:	7d 04                	jge    0x510a41
  510a3d:	8b c6                	mov    eax,esi
  510a3f:	f7 d8                	neg    eax
  510a41:	8b ca                	mov    ecx,edx
  510a43:	85 d2                	test   edx,edx
  510a45:	7d 04                	jge    0x510a4b
  510a47:	8b ca                	mov    ecx,edx
  510a49:	f7 d9                	neg    ecx
  510a4b:	3d 00 80 00 00       	cmp    eax,0x8000
  510a50:	7c 06                	jl     0x510a58
  510a52:	8d b0 00 00 ff ff    	lea    esi,[eax-0x10000]
  510a58:	81 f9 00 80 00 00    	cmp    ecx,0x8000
  510a5e:	7c 06                	jl     0x510a66
  510a60:	8d 91 00 00 ff ff    	lea    edx,[ecx-0x10000]
  510a66:	f7 da                	neg    edx
  510a68:	52                   	push   edx
  510a69:	56                   	push   esi
  510a6a:	e8 05 56 07 00       	call   0x586074
  510a6f:	83 c4 08             	add    esp,0x8
  510a72:	33 c9                	xor    ecx,ecx
  510a74:	66 8b c8             	mov    cx,ax
  510a77:	81 e1 ff 07 00 00    	and    ecx,0x7ff
  510a7d:	eb 04                	jmp    0x510a83
  510a7f:	0f bf 4f 57          	movsx  ecx,WORD PTR [edi+0x57]
  510a83:	66 8b 5f 41          	mov    bx,WORD PTR [edi+0x41]
  510a87:	8d 77 3d             	lea    esi,[edi+0x3d]
  510a8a:	8d 54 24 4c          	lea    edx,[esp+0x4c]
  510a8e:	8b 06                	mov    eax,DWORD PTR [esi]
  510a90:	89 02                	mov    DWORD PTR [edx],eax
  510a92:	8d 44 24 4c          	lea    eax,[esp+0x4c]
  510a96:	66 89 5a 04          	mov    WORD PTR [edx+0x4],bx
  510a9a:	66 8b 57 5f          	mov    dx,WORD PTR [edi+0x5f]
  510a9e:	52                   	push   edx
  510a9f:	51                   	push   ecx
  510aa0:	50                   	push   eax
  510aa1:	e8 ca 5f fd ff       	call   0x4e6a70
  510aa6:	8d 4c 24 58          	lea    ecx,[esp+0x58]
  510aaa:	83 c4 0c             	add    esp,0xc
  510aad:	51                   	push   ecx
  510aae:	57                   	push   edi
  510aaf:	e8 cc da fd ff       	call   0x4ee580
  510ab4:	66 8b 4f 3f          	mov    cx,WORD PTR [edi+0x3f]
  510ab8:	83 c4 08             	add    esp,0x8
  510abb:	66 8b 16             	mov    dx,WORD PTR [esi]
  510abe:	51                   	push   ecx
  510abf:	52                   	push   edx
  510ac0:	e8 7b de f3 ff       	call   0x44e940
  510ac5:	66 89 47 41          	mov    WORD PTR [edi+0x41],ax
  510ac9:	83 c4 08             	add    esp,0x8
  510acc:	81 67 10 ff fb ff ff 	and    DWORD PTR [edi+0x10],0xfffffbff
  510ad3:	66 81 47 41 c8 00    	add    WORD PTR [edi+0x41],0xc8
  510ad9:	8b f7                	mov    esi,edi
  510adb:	33 c0                	xor    eax,eax
  510add:	66 8b 47 6e          	mov    ax,WORD PTR [edi+0x6e]
  510ae1:	8b 1c 85 90 03 89 00 	mov    ebx,DWORD PTR [eax*4+0x890390]
  510ae8:	85 db                	test   ebx,ebx
  510aea:	0f 84 c5 00 00 00    	je     0x510bb5
  510af0:	33 c0                	xor    eax,eax
  510af2:	8a 43 2d             	mov    al,BYTE PTR [ebx+0x2d]
  510af5:	83 f8 03             	cmp    eax,0x3
  510af8:	77 7a                	ja     0x510b74
  510afa:	ff 24 85 48 0c 51 00 	jmp    DWORD PTR [eax*4+0x510c48]
  510b01:	57                   	push   edi
  510b02:	53                   	push   ebx
  510b03:	e8 18 05 00 00       	call   0x511020
  510b08:	83 c4 08             	add    esp,0x8
  510b0b:	eb 67                	jmp    0x510b74
  510b0d:	53                   	push   ebx
  510b0e:	e8 bd 07 00 00       	call   0x5112d0
  510b13:	83 c4 04             	add    esp,0x4
  510b16:	8d 43 53             	lea    eax,[ebx+0x53]
  510b19:	68 c8 00 00 00       	push   0xc8
  510b1e:	6a 01                	push   0x1
  510b20:	50                   	push   eax
  510b21:	53                   	push   ebx
  510b22:	e8 59 06 00 00       	call   0x511180
  510b27:	83 c4 10             	add    esp,0x10
  510b2a:	85 c0                	test   eax,eax
  510b2c:	74 46                	je     0x510b74
  510b2e:	c6 43 2d 02          	mov    BYTE PTR [ebx+0x2d],0x2
  510b32:	eb 40                	jmp    0x510b74
  510b34:	68 c8 00 00 00       	push   0xc8
  510b39:	8d 43 4f             	lea    eax,[ebx+0x4f]
  510b3c:	6a 00                	push   0x0
  510b3e:	50                   	push   eax
  510b3f:	53                   	push   ebx
  510b40:	e8 3b 06 00 00       	call   0x511180
  510b45:	83 c4 10             	add    esp,0x10
  510b48:	85 c0                	test   eax,eax
  510b4a:	74 28                	je     0x510b74
  510b4c:	80 4b 35 10          	or     BYTE PTR [ebx+0x35],0x10
  510b50:	eb 22                	jmp    0x510b74
  510b52:	68 c8 00 00 00       	push   0xc8
  510b57:	8d 43 53             	lea    eax,[ebx+0x53]
  510b5a:	6a 00                	push   0x0
  510b5c:	50                   	push   eax
  510b5d:	53                   	push   ebx
  510b5e:	e8 1d 06 00 00       	call   0x511180
  510b63:	83 c4 10             	add    esp,0x10
  510b66:	85 c0                	test   eax,eax
  510b68:	74 0a                	je     0x510b74
  510b6a:	66 81 63 35 ef ff    	and    WORD PTR [ebx+0x35],0xffef
  510b70:	c6 43 2d 00          	mov    BYTE PTR [ebx+0x2d],0x0
  510b74:	33 c0                	xor    eax,eax
  510b76:	0f bf 4f 6c          	movsx  ecx,WORD PTR [edi+0x6c]
  510b7a:	66 8b 43 24          	mov    ax,WORD PTR [ebx+0x24]
  510b7e:	83 e0 0f             	and    eax,0xf
  510b81:	3b c1                	cmp    eax,ecx
  510b83:	75 19                	jne    0x510b9e
  510b85:	66 8b 43 6e          	mov    ax,WORD PTR [ebx+0x6e]
  510b89:	53                   	push   ebx
  510b8a:	66 89 46 6e          	mov    WORD PTR [esi+0x6e],ax
  510b8e:	e8 ed e5 fd ff       	call   0x4ef180
  510b93:	83 c4 04             	add    esp,0x4
  510b96:	33 c0                	xor    eax,eax
  510b98:	66 8b 46 6e          	mov    ax,WORD PTR [esi+0x6e]
  510b9c:	eb 08                	jmp    0x510ba6
  510b9e:	8b f3                	mov    esi,ebx
  510ba0:	33 c0                	xor    eax,eax
  510ba2:	66 8b 43 6e          	mov    ax,WORD PTR [ebx+0x6e]
  510ba6:	8b 1c 85 90 03 89 00 	mov    ebx,DWORD PTR [eax*4+0x890390]
  510bad:	85 db                	test   ebx,ebx
  510baf:	0f 85 3b ff ff ff    	jne    0x510af0
  510bb5:	66 8b 47 6c          	mov    ax,WORD PTR [edi+0x6c]
  510bb9:	66 85 c0             	test   ax,ax
  510bbc:	7c 47                	jl     0x510c05
  510bbe:	66 48                	dec    ax
  510bc0:	66 89 47 6c          	mov    WORD PTR [edi+0x6c],ax
  510bc4:	66 85 c0             	test   ax,ax
  510bc7:	7f 3c                	jg     0x510c05
  510bc9:	33 c0                	xor    eax,eax
  510bcb:	66 8b 47 6e          	mov    ax,WORD PTR [edi+0x6e]
  510bcf:	8b 34 85 90 03 89 00 	mov    esi,DWORD PTR [eax*4+0x890390]
  510bd6:	39 35 90 03 89 00    	cmp    DWORD PTR ds:0x890390,esi
  510bdc:	73 1e                	jae    0x510bfc
  510bde:	56                   	push   esi
  510bdf:	e8 9c e5 fd ff       	call   0x4ef180
  510be4:	83 c4 04             	add    esp,0x4
  510be7:	33 c0                	xor    eax,eax
  510be9:	66 8b 46 6e          	mov    ax,WORD PTR [esi+0x6e]
  510bed:	8b 34 85 90 03 89 00 	mov    esi,DWORD PTR [eax*4+0x890390]
  510bf4:	39 35 90 03 89 00    	cmp    DWORD PTR ds:0x890390,esi
  510bfa:	72 e2                	jb     0x510bde
  510bfc:	57                   	push   edi
  510bfd:	e8 ee d0 fd ff       	call   0x4edcf0
  510c02:	83 c4 04             	add    esp,0x4
  510c05:	5d                   	pop    ebp
  510c06:	5f                   	pop    edi
  510c07:	5e                   	pop    esi
  510c08:	5b                   	pop    ebx
  510c09:	83 c4 44             	add    esp,0x44
  510c0c:	c3                   	ret
  510c0d:	8d 49 00             	lea    ecx,[ecx+0x0]
  510c10:	56                   	push   esi
  510c11:	01 51 00             	add    DWORD PTR [ecx+0x0],edx
  510c14:	64 01 51 00          	add    DWORD PTR fs:[ecx+0x0],edx
  510c18:	38 04 51             	cmp    BYTE PTR [ecx+edx*2],al
  510c1b:	00 a5 08 51 00 7b    	add    BYTE PTR [ebp+0x7b005108],ah
  510c21:	04 51                	add    al,0x51
  510c23:	00 87 04 51 00 bb    	add    BYTE PTR [edi-0x44ffaefc],al
  510c29:	04 51                	add    al,0x51
  510c2b:	00 f7                	add    bh,dh
  510c2d:	04 51                	add    al,0x51
  510c2f:	00 57 05             	add    BYTE PTR [edi+0x5],dl
  510c32:	51                   	push   ecx
  510c33:	00 a9 05 51 00 72    	add    BYTE PTR [ecx+0x72005105],ch
  510c39:	06                   	push   es
  510c3a:	51                   	push   ecx
  510c3b:	00 91 06 51 00 63    	add    BYTE PTR [ecx+0x63005106],dl
  510c41:	07                   	pop    es
  510c42:	51                   	push   ecx
  510c43:	00 b5 07 51 00 01    	add    BYTE PTR [ebp+0x1005107],dh
  510c49:	0b 51 00             	or     edx,DWORD PTR [ecx+0x0]
  510c4c:	0d 0b 51 00 34       	or     eax,0x3400510b
  510c51:	0b 51 00             	or     edx,DWORD PTR [ecx+0x0]
  510c54:	52                   	push   edx
  510c55:	0b 51 00             	or     edx,DWORD PTR [ecx+0x0]
  510c58:	cc                   	int3
  510c59:	cc                   	int3
  510c5a:	cc                   	int3
  510c5b:	cc                   	int3
  510c5c:	cc                   	int3
  510c5d:	cc                   	int3
  510c5e:	cc                   	int3
  510c5f:	cc                   	int3
  510c60:	56                   	push   esi
  510c61:	33 c0                	xor    eax,eax
  510c63:	57                   	push   edi
  510c64:	8b 7c 24 0c          	mov    edi,DWORD PTR [esp+0xc]
  510c68:	66 8b 47 6e          	mov    ax,WORD PTR [edi+0x6e]
  510c6c:	8b 34 85 90 03 89 00 	mov    esi,DWORD PTR [eax*4+0x890390]
  510c73:	39 35 90 03 89 00    	cmp    DWORD PTR ds:0x890390,esi
  510c79:	73 1e                	jae    0x510c99
  510c7b:	56                   	push   esi
  510c7c:	e8 ff e4 fd ff       	call   0x4ef180
  510c81:	83 c4 04             	add    esp,0x4
  510c84:	33 c0                	xor    eax,eax
  510c86:	66 8b 46 6e          	mov    ax,WORD PTR [esi+0x6e]
  510c8a:	8b 34 85 90 03 89 00 	mov    esi,DWORD PTR [eax*4+0x890390]
  510c91:	39 35 90 03 89 00    	cmp    DWORD PTR ds:0x890390,esi
  510c97:	72 e2                	jb     0x510c7b
  510c99:	57                   	push   edi
  510c9a:	e8 51 d0 fd ff       	call   0x4edcf0
  510c9f:	83 c4 04             	add    esp,0x4
  510ca2:	5f                   	pop    edi
  510ca3:	5e                   	pop    esi
  510ca4:	c3                   	ret
  510ca5:	cc                   	int3
  510ca6:	cc                   	int3
  510ca7:	cc                   	int3
  510ca8:	cc                   	int3
  510ca9:	cc                   	int3
  510caa:	cc                   	int3
  510cab:	cc                   	int3
  510cac:	cc                   	int3
  510cad:	cc                   	int3
  510cae:	cc                   	int3
  510caf:	cc                   	int3
