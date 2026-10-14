
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044b150 <.text+0x4a150>:
  44b150:	00 00                	add    BYTE PTR [eax],al
  44b152:	0f bf 0d cf c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6cf
  44b159:	a1 08 42 68 00       	mov    eax,ds:0x684208
  44b15e:	c1 e0 10             	shl    eax,0x10
  44b161:	99                   	cdq
  44b162:	f7 f9                	idiv   ecx
  44b164:	0f bf 0d d1 c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6d1
  44b16b:	a3 0c 45 68 00       	mov    ds:0x68450c,eax
  44b170:	89 35 1c 45 68 00    	mov    DWORD PTR ds:0x68451c,esi
  44b176:	a1 0c 42 68 00       	mov    eax,ds:0x68420c
  44b17b:	89 35 28 45 68 00    	mov    DWORD PTR ds:0x684528,esi
  44b181:	c1 e0 10             	shl    eax,0x10
  44b184:	99                   	cdq
  44b185:	f7 f9                	idiv   ecx
  44b187:	a3 10 45 68 00       	mov    ds:0x684510,eax
  44b18c:	39 35 80 cd 59 00    	cmp    DWORD PTR ds:0x59cd80,esi
  44b192:	74 2a                	je     0x44b1be
  44b194:	81 3d 18 45 68 00 00 	cmp    DWORD PTR ds:0x684518,0x100
  44b19b:	01 00 00 
  44b19e:	89 35 14 45 68 00    	mov    DWORD PTR ds:0x684514,esi
  44b1a4:	7d 37                	jge    0x44b1dd
  44b1a6:	83 3d 18 45 68 00 01 	cmp    DWORD PTR ds:0x684518,0x1
  44b1ad:	1b c0                	sbb    eax,eax
  44b1af:	ff 05 18 45 68 00    	inc    DWORD PTR ds:0x684518
  44b1b5:	f7 d8                	neg    eax
  44b1b7:	a3 14 45 68 00       	mov    ds:0x684514,eax
  44b1bc:	eb 1f                	jmp    0x44b1dd
  44b1be:	83 3d 18 45 68 00 00 	cmp    DWORD PTR ds:0x684518,0x0
  44b1c5:	74 0a                	je     0x44b1d1
  44b1c7:	c7 05 1c 45 68 00 01 	mov    DWORD PTR ds:0x68451c,0x1
  44b1ce:	00 00 00 
  44b1d1:	33 c0                	xor    eax,eax
  44b1d3:	a3 14 45 68 00       	mov    ds:0x684514,eax
  44b1d8:	a3 18 45 68 00       	mov    ds:0x684518,eax
  44b1dd:	83 3d 84 cd 59 00 00 	cmp    DWORD PTR ds:0x59cd84,0x0
  44b1e4:	74 2e                	je     0x44b214
  44b1e6:	c7 05 20 45 68 00 00 	mov    DWORD PTR ds:0x684520,0x0
  44b1ed:	00 00 00 
  44b1f0:	81 3d 24 45 68 00 00 	cmp    DWORD PTR ds:0x684524,0x100
  44b1f7:	01 00 00 
  44b1fa:	7d 37                	jge    0x44b233
  44b1fc:	83 3d 24 45 68 00 01 	cmp    DWORD PTR ds:0x684524,0x1
  44b203:	1b c0                	sbb    eax,eax
  44b205:	ff 05 24 45 68 00    	inc    DWORD PTR ds:0x684524
  44b20b:	f7 d8                	neg    eax
  44b20d:	a3 20 45 68 00       	mov    ds:0x684520,eax
  44b212:	eb 1f                	jmp    0x44b233
  44b214:	83 3d 24 45 68 00 00 	cmp    DWORD PTR ds:0x684524,0x0
  44b21b:	74 0a                	je     0x44b227
  44b21d:	c7 05 28 45 68 00 01 	mov    DWORD PTR ds:0x684528,0x1
  44b224:	00 00 00 
  44b227:	33 c0                	xor    eax,eax
  44b229:	a3 24 45 68 00       	mov    ds:0x684524,eax
  44b22e:	a3 20 45 68 00       	mov    ds:0x684520,eax
  44b233:	33 f6                	xor    esi,esi
  44b235:	f6 05 61 c6 89 00 04 	test   BYTE PTR ds:0x89c661,0x4
  44b23c:	0f 85 84 00 00 00    	jne    0x44b2c6
  44b242:	83 3d 08 45 68 00 01 	cmp    DWORD PTR ds:0x684508,0x1
  44b249:	66 bf 01 00          	mov    di,0x1
  44b24d:	7e 77                	jle    0x44b2c6
  44b24f:	b9 02 00 00 00       	mov    ecx,0x2
  44b254:	33 d2                	xor    edx,edx
  44b256:	0f bf c7             	movsx  eax,di
  44b259:	8d 1c 40             	lea    ebx,[eax+eax*2]
  44b25c:	0f bf 04 5d 20 42 68 	movsx  eax,WORD PTR [ebx*2+0x684220]
  44b263:	00 
  44b264:	8b d8                	mov    ebx,eax
  44b266:	c1 e0 06             	shl    eax,0x6
  44b269:	2b c3                	sub    eax,ebx
  44b26b:	2b c3                	sub    eax,ebx
  44b26d:	39 88 8c 42 68 00    	cmp    DWORD PTR [eax+0x68428c],ecx
  44b273:	8d 98 5e 42 68 00    	lea    ebx,[eax+0x68425e]
  44b279:	75 3e                	jne    0x44b2b9
  44b27b:	39 53 32             	cmp    DWORD PTR [ebx+0x32],edx
  44b27e:	74 39                	je     0x44b2b9
  44b280:	39 53 1e             	cmp    DWORD PTR [ebx+0x1e],edx
  44b283:	74 34                	je     0x44b2b9
  44b285:	8b 43 0e             	mov    eax,DWORD PTR [ebx+0xe]
  44b288:	39 05 0c 45 68 00    	cmp    DWORD PTR ds:0x68450c,eax
  44b28e:	7c 29                	jl     0x44b2b9
  44b290:	8b 6b 16             	mov    ebp,DWORD PTR [ebx+0x16]
  44b293:	03 e8                	add    ebp,eax
  44b295:	3b 2d 0c 45 68 00    	cmp    ebp,DWORD PTR ds:0x68450c
  44b29b:	7e 1c                	jle    0x44b2b9
  44b29d:	8b 43 12             	mov    eax,DWORD PTR [ebx+0x12]
  44b2a0:	39 05 10 45 68 00    	cmp    DWORD PTR ds:0x684510,eax
  44b2a6:	7c 11                	jl     0x44b2b9
  44b2a8:	8b 6b 1a             	mov    ebp,DWORD PTR [ebx+0x1a]
  44b2ab:	03 e8                	add    ebp,eax
  44b2ad:	3b 2d 10 45 68 00    	cmp    ebp,DWORD PTR ds:0x684510
  44b2b3:	7e 04                	jle    0x44b2b9
  44b2b5:	66 8b 73 38          	mov    si,WORD PTR [ebx+0x38]
  44b2b9:	66 47                	inc    di
  44b2bb:	0f bf c7             	movsx  eax,di
  44b2be:	3b 05 08 45 68 00    	cmp    eax,DWORD PTR ds:0x684508
  44b2c4:	7c 90                	jl     0x44b256
  44b2c6:	66 c7 44 24 12 01 00 	mov    WORD PTR [esp+0x12],0x1
  44b2cd:	66 83 fe 01          	cmp    si,0x1
  44b2d1:	1b c0                	sbb    eax,eax
  44b2d3:	40                   	inc    eax
  44b2d4:	83 3d 08 45 68 00 01 	cmp    DWORD PTR ds:0x684508,0x1
  44b2db:	a3 14 42 68 00       	mov    ds:0x684214,eax
  44b2e0:	0f 8e 21 02 00 00    	jle    0x44b507
  44b2e6:	0f bf 44 24 12       	movsx  eax,WORD PTR [esp+0x12]
  44b2eb:	8d 0c 40             	lea    ecx,[eax+eax*2]
  44b2ee:	0f bf 04 4d 20 42 68 	movsx  eax,WORD PTR [ecx*2+0x684220]
  44b2f5:	00 
  44b2f6:	8b c8                	mov    ecx,eax
  44b2f8:	c1 e0 06             	shl    eax,0x6
  44b2fb:	2b c1                	sub    eax,ecx
  44b2fd:	2b c1                	sub    eax,ecx
  44b2ff:	8d b8 5e 42 68 00    	lea    edi,[eax+0x68425e]
  44b305:	8b 80 84 42 68 00    	mov    eax,DWORD PTR [eax+0x684284]
  44b30b:	85 c0                	test   eax,eax
  44b30d:	74 06                	je     0x44b315
  44b30f:	57                   	push   edi
  44b310:	ff d0                	call   eax
  44b312:	83 c4 04             	add    esp,0x4
  44b315:	0f bf 4f 3c          	movsx  ecx,WORD PTR [edi+0x3c]
  44b319:	8b c1                	mov    eax,ecx
  44b31b:	c1 e1 03             	shl    ecx,0x3
  44b31e:	2b c8                	sub    ecx,eax
  44b320:	03 c9                	add    ecx,ecx
  44b322:	8d ac c8 2c 45 68 00 	lea    ebp,[eax+ecx*8+0x68452c]
  44b329:	81 fd 2c 45 68 00    	cmp    ebp,0x68452c
  44b32f:	0f 84 f5 00 00 00    	je     0x44b42a
  44b335:	33 ff                	xor    edi,edi
  44b337:	bb 04 00 00 00       	mov    ebx,0x4
  44b33c:	89 7d 0c             	mov    DWORD PTR [ebp+0xc],edi
  44b33f:	0f bf 45 6b          	movsx  eax,WORD PTR [ebp+0x6b]
  44b343:	8b c8                	mov    ecx,eax
  44b345:	c1 e0 06             	shl    eax,0x6
  44b348:	2b c1                	sub    eax,ecx
  44b34a:	2b c1                	sub    eax,ecx
  44b34c:	39 b8 90 42 68 00    	cmp    DWORD PTR [eax+0x684290],edi
  44b352:	74 4b                	je     0x44b39f
  44b354:	8b 45 67             	mov    eax,DWORD PTR [ebp+0x67]
  44b357:	85 c0                	test   eax,eax
  44b359:	74 06                	je     0x44b361
  44b35b:	55                   	push   ebp
  44b35c:	ff d0                	call   eax
  44b35e:	83 c4 04             	add    esp,0x4
  44b361:	85 1d 61 c6 89 00    	test   DWORD PTR ds:0x89c661,ebx
  44b367:	75 30                	jne    0x44b399
  44b369:	8b 45 3f             	mov    eax,DWORD PTR [ebp+0x3f]
  44b36c:	39 05 0c 45 68 00    	cmp    DWORD PTR ds:0x68450c,eax
  44b372:	7c 25                	jl     0x44b399
  44b374:	8b 4d 47             	mov    ecx,DWORD PTR [ebp+0x47]
  44b377:	03 c8                	add    ecx,eax
  44b379:	3b 0d 0c 45 68 00    	cmp    ecx,DWORD PTR ds:0x68450c
  44b37f:	7e 18                	jle    0x44b399
  44b381:	8b 45 43             	mov    eax,DWORD PTR [ebp+0x43]
  44b384:	39 05 10 45 68 00    	cmp    DWORD PTR ds:0x684510,eax
  44b38a:	7c 0d                	jl     0x44b399
  44b38c:	8b 4d 4b             	mov    ecx,DWORD PTR [ebp+0x4b]
  44b38f:	03 c8                	add    ecx,eax
  44b391:	3b 0d 10 45 68 00    	cmp    ecx,DWORD PTR ds:0x684510
  44b397:	7f 06                	jg     0x44b39f
  44b399:	89 7d 18             	mov    DWORD PTR [ebp+0x18],edi
  44b39c:	89 7d 1c             	mov    DWORD PTR [ebp+0x1c],edi
  44b39f:	85 1d 61 c6 89 00    	test   DWORD PTR ds:0x89c661,ebx
  44b3a5:	75 3c                	jne    0x44b3e3
  44b3a7:	8b 45 3f             	mov    eax,DWORD PTR [ebp+0x3f]
  44b3aa:	39 05 0c 45 68 00    	cmp    DWORD PTR ds:0x68450c,eax
  44b3b0:	7c 31                	jl     0x44b3e3
  44b3b2:	8b 4d 47             	mov    ecx,DWORD PTR [ebp+0x47]
  44b3b5:	03 c8                	add    ecx,eax
  44b3b7:	3b 0d 0c 45 68 00    	cmp    ecx,DWORD PTR ds:0x68450c
  44b3bd:	7e 24                	jle    0x44b3e3
  44b3bf:	8b 45 43             	mov    eax,DWORD PTR [ebp+0x43]
  44b3c2:	39 05 10 45 68 00    	cmp    DWORD PTR ds:0x684510,eax
  44b3c8:	7c 19                	jl     0x44b3e3
  44b3ca:	8b 4d 4b             	mov    ecx,DWORD PTR [ebp+0x4b]
  44b3cd:	03 c8                	add    ecx,eax
  44b3cf:	3b 0d 10 45 68 00    	cmp    ecx,DWORD PTR ds:0x684510
  44b3d5:	7e 0c                	jle    0x44b3e3
  44b3d7:	66 8b 45 20          	mov    ax,WORD PTR [ebp+0x20]
  44b3db:	66 a3 0c db 98 00    	mov    ds:0x98db0c,ax
  44b3e1:	eb 27                	jmp    0x44b40a
  44b3e3:	66 39 75 6b          	cmp    WORD PTR [ebp+0x6b],si
  44b3e7:	75 21                	jne    0x44b40a
  44b3e9:	0f bf 05 0c db 98 00 	movsx  eax,WORD PTR ds:0x98db0c
  44b3f0:	8b c8                	mov    ecx,eax
  44b3f2:	c1 e0 03             	shl    eax,0x3
  44b3f5:	2b c1                	sub    eax,ecx
  44b3f7:	03 c0                	add    eax,eax
  44b3f9:	66 39 b4 c1 97 45 68 	cmp    WORD PTR [ecx+eax*8+0x684597],si
  44b400:	00 
  44b401:	74 07                	je     0x44b40a
  44b403:	66 89 3d 0c db 98 00 	mov    WORD PTR ds:0x98db0c,di
  44b40a:	0f bf 4d 6d          	movsx  ecx,WORD PTR [ebp+0x6d]
  44b40e:	8b c1                	mov    eax,ecx
  44b410:	c1 e1 03             	shl    ecx,0x3
  44b413:	2b c8                	sub    ecx,eax
  44b415:	03 c9                	add    ecx,ecx
  44b417:	8d ac c8 2c 45 68 00 	lea    ebp,[eax+ecx*8+0x68452c]
  44b41e:	81 fd 2c 45 68 00    	cmp    ebp,0x68452c
  44b424:	0f 85 12 ff ff ff    	jne    0x44b33c
  44b42a:	66 ff 44 24 12       	inc    WORD PTR [esp+0x12]
  44b42f:	0f bf 44 24 12       	movsx  eax,WORD PTR [esp+0x12]
  44b434:	3b 05 08 45 68 00    	cmp    eax,DWORD PTR ds:0x684508
  44b43a:	0f 8c a6 fe ff ff    	jl     0x44b2e6
  44b440:	e9 c2 00 00 00       	jmp    0x44b507
  44b445:	83 3d 08 45 68 00 01 	cmp    DWORD PTR ds:0x684508,0x1
  44b44c:	66 be 01 00          	mov    si,0x1
  44b450:	0f 8e 84 00 00 00    	jle    0x44b4da
  44b456:	b9 02 00 00 00       	mov    ecx,0x2
  44b45b:	33 d2                	xor    edx,edx
  44b45d:	0f bf c6             	movsx  eax,si
  44b460:	8d 1c 40             	lea    ebx,[eax+eax*2]
  44b463:	0f bf 04 5d 20 42 68 	movsx  eax,WORD PTR [ebx*2+0x684220]
  44b46a:	00 
  44b46b:	8b f8                	mov    edi,eax
  44b46d:	c1 e0 06             	shl    eax,0x6
  44b470:	2b c7                	sub    eax,edi
  44b472:	2b c7                	sub    eax,edi
  44b474:	05 5e 42 68 00       	add    eax,0x68425e
  44b479:	39 48 2e             	cmp    DWORD PTR [eax+0x2e],ecx
  44b47c:	75 4f                	jne    0x44b4cd
  44b47e:	39 50 32             	cmp    DWORD PTR [eax+0x32],edx
  44b481:	74 4a                	je     0x44b4cd
  44b483:	0f bf 78 3c          	movsx  edi,WORD PTR [eax+0x3c]
  44b487:	8b c7                	mov    eax,edi
  44b489:	c1 e7 03             	shl    edi,0x3
  44b48c:	2b f8                	sub    edi,eax
  44b48e:	03 ff                	add    edi,edi
  44b490:	8d 84 f8 2c 45 68 00 	lea    eax,[eax+edi*8+0x68452c]
  44b497:	3d 2c 45 68 00       	cmp    eax,0x68452c
  44b49c:	74 2f                	je     0x44b4cd
  44b49e:	39 50 53             	cmp    DWORD PTR [eax+0x53],edx
  44b4a1:	74 0f                	je     0x44b4b2
  44b4a3:	39 50 04             	cmp    DWORD PTR [eax+0x4],edx
  44b4a6:	74 0a                	je     0x44b4b2
  44b4a8:	8b 3d 8c ae 5c 00    	mov    edi,DWORD PTR ds:0x5cae8c
  44b4ae:	39 38                	cmp    DWORD PTR [eax],edi
  44b4b0:	74 2a                	je     0x44b4dc
  44b4b2:	0f bf 40 6d          	movsx  eax,WORD PTR [eax+0x6d]
  44b4b6:	8b f8                	mov    edi,eax
  44b4b8:	c1 e0 03             	shl    eax,0x3
  44b4bb:	2b c7                	sub    eax,edi
  44b4bd:	03 c0                	add    eax,eax
  44b4bf:	8d 84 c7 2c 45 68 00 	lea    eax,[edi+eax*8+0x68452c]
  44b4c6:	3d 2c 45 68 00       	cmp    eax,0x68452c
  44b4cb:	75 d1                	jne    0x44b49e
  44b4cd:	66 46                	inc    si
  44b4cf:	0f bf c6             	movsx  eax,si
  44b4d2:	3b 05 08 45 68 00    	cmp    eax,DWORD PTR ds:0x684508
  44b4d8:	7c 83                	jl     0x44b45d
  44b4da:	33 c0                	xor    eax,eax
  44b4dc:	85 c0                	test   eax,eax
  44b4de:	74 1d                	je     0x44b4fd
  44b4e0:	2d 2c 45 68 00       	sub    eax,0x68452c
  44b4e5:	b9 71 00 00 00       	mov    ecx,0x71
  44b4ea:	99                   	cdq
  44b4eb:	f7 f9                	idiv   ecx
  44b4ed:	66 a3 0c db 98 00    	mov    ds:0x98db0c,ax
  44b4f3:	c7 05 cc c6 68 00 01 	mov    DWORD PTR ds:0x68c6cc,0x1
  44b4fa:	00 00 00 
  44b4fd:	c7 05 8c ae 5c 00 00 	mov    DWORD PTR ds:0x5cae8c,0x0
  44b504:	00 00 00 
  44b507:	0f bf 05 0c db 98 00 	movsx  eax,WORD PTR ds:0x98db0c
  44b50e:	8b c8                	mov    ecx,eax
  44b510:	c1 e0 03             	shl    eax,0x3
  44b513:	2b c1                	sub    eax,ecx
  44b515:	03 c0                	add    eax,eax
  44b517:	66 83 3d 0c db 98 00 	cmp    WORD PTR ds:0x98db0c,0x0
  44b51e:	00 
  44b51f:	8d b4 c1 2c 45 68 00 	lea    esi,[ecx+eax*8+0x68452c]
  44b526:	0f 84 fc 01 00 00    	je     0x44b728
  44b52c:	8b 46 33             	mov    eax,DWORD PTR [esi+0x33]
  44b52f:	85 c0                	test   eax,eax
  44b531:	74 06                	je     0x44b539
  44b533:	56                   	push   esi
  44b534:	ff d0                	call   eax
  44b536:	83 c4 04             	add    esp,0x4
  44b539:	b8 01 00 00 00       	mov    eax,0x1
  44b53e:	56                   	push   esi
  44b53f:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  44b542:	a3 14 42 68 00       	mov    ds:0x684214,eax
  44b547:	e8 24 1f 00 00       	call   0x44d470
  44b54c:	83 c4 04             	add    esp,0x4
  44b54f:	80 3d e7 c6 89 00 11 	cmp    BYTE PTR ds:0x89c6e7,0x11
  44b556:	0f 84 b9 01 00 00    	je     0x44b715
  44b55c:	83 3d 18 45 68 00 00 	cmp    DWORD PTR ds:0x684518,0x0
  44b563:	74 59                	je     0x44b5be
  44b565:	8b 4e 2b             	mov    ecx,DWORD PTR [esi+0x2b]
  44b568:	85 c9                	test   ecx,ecx
  44b56a:	75 16                	jne    0x44b582
  44b56c:	83 7e 26 00          	cmp    DWORD PTR [esi+0x26],0x0
  44b570:	75 10                	jne    0x44b582
  44b572:	83 7e 5b 00          	cmp    DWORD PTR [esi+0x5b],0x0
  44b576:	75 0a                	jne    0x44b582
  44b578:	83 7e 22 05          	cmp    DWORD PTR [esi+0x22],0x5
  44b57c:	0f 85 9b 00 00 00    	jne    0x44b61d
  44b582:	83 7e 08 00          	cmp    DWORD PTR [esi+0x8],0x0
  44b586:	0f 84 91 00 00 00    	je     0x44b61d
  44b58c:	8b 46 22             	mov    eax,DWORD PTR [esi+0x22]
  44b58f:	83 e8 02             	sub    eax,0x2
  44b592:	83 f8 06             	cmp    eax,0x6
  44b595:	0f 87 82 00 00 00    	ja     0x44b61d
  44b59b:	ff 24 85 30 b7 44 00 	jmp    DWORD PTR [eax*4+0x44b730]
  44b5a2:	8b 46 18             	mov    eax,DWORD PTR [esi+0x18]
  44b5a5:	85 c0                	test   eax,eax
  44b5a7:	7e 74                	jle    0x44b61d
  44b5a9:	83 f8 05             	cmp    eax,0x5
  44b5ac:	7e 04                	jle    0x44b5b2
  44b5ae:	85 c9                	test   ecx,ecx
  44b5b0:	75 65                	jne    0x44b617
  44b5b2:	40                   	inc    eax
  44b5b3:	89 46 18             	mov    DWORD PTR [esi+0x18],eax
  44b5b6:	eb 65                	jmp    0x44b61d
  44b5b8:	85 c9                	test   ecx,ecx
  44b5ba:	74 61                	je     0x44b61d
  44b5bc:	eb 59                	jmp    0x44b617
  44b5be:	83 3d 24 45 68 00 00 	cmp    DWORD PTR ds:0x684524,0x0
  44b5c5:	74 56                	je     0x44b61d
  44b5c7:	8b 4e 2f             	mov    ecx,DWORD PTR [esi+0x2f]
  44b5ca:	85 c9                	test   ecx,ecx
  44b5cc:	75 12                	jne    0x44b5e0
  44b5ce:	83 7e 26 00          	cmp    DWORD PTR [esi+0x26],0x0
  44b5d2:	75 0c                	jne    0x44b5e0
  44b5d4:	83 7e 5b 00          	cmp    DWORD PTR [esi+0x5b],0x0
  44b5d8:	75 06                	jne    0x44b5e0
  44b5da:	83 7e 22 05          	cmp    DWORD PTR [esi+0x22],0x5
  44b5de:	75 3d                	jne    0x44b61d
  44b5e0:	8b 46 22             	mov    eax,DWORD PTR [esi+0x22]
  44b5e3:	83 f8 05             	cmp    eax,0x5
  44b5e6:	74 35                	je     0x44b61d
  44b5e8:	83 7e 08 00          	cmp    DWORD PTR [esi+0x8],0x0
  44b5ec:	74 2f                	je     0x44b61d
  44b5ee:	83 e8 02             	sub    eax,0x2
  44b5f1:	83 f8 06             	cmp    eax,0x6
  44b5f4:	77 27                	ja     0x44b61d
  44b5f6:	ff 24 85 4c b7 44 00 	jmp    DWORD PTR [eax*4+0x44b74c]
  44b5fd:	8b 46 1c             	mov    eax,DWORD PTR [esi+0x1c]
  44b600:	85 c0                	test   eax,eax
  44b602:	7e 19                	jle    0x44b61d
  44b604:	83 f8 05             	cmp    eax,0x5
  44b607:	7e 04                	jle    0x44b60d
  44b609:	85 c9                	test   ecx,ecx
  44b60b:	75 0a                	jne    0x44b617
  44b60d:	40                   	inc    eax
  44b60e:	89 46 1c             	mov    DWORD PTR [esi+0x1c],eax
  44b611:	eb 0a                	jmp    0x44b61d
  44b613:	85 c9                	test   ecx,ecx
  44b615:	74 06                	je     0x44b61d
  44b617:	56                   	push   esi
  44b618:	ff d1                	call   ecx
  44b61a:	83 c4 04             	add    esp,0x4
  44b61d:	83 3d 14 45 68 00 00 	cmp    DWORD PTR ds:0x684514,0x0
  44b624:	75 3a                	jne    0x44b660
  44b626:	83 3d cc c6 68 00 00 	cmp    DWORD PTR ds:0x68c6cc,0x0
  44b62d:	75 31                	jne    0x44b660
  44b62f:	83 3d 20 45 68 00 00 	cmp    DWORD PTR ds:0x684520,0x0
  44b636:	75 09                	jne    0x44b641
  44b638:	83 3d cc c6 68 00 00 	cmp    DWORD PTR ds:0x68c6cc,0x0
  44b63f:	74 46                	je     0x44b687
  44b641:	8b 46 2f             	mov    eax,DWORD PTR [esi+0x2f]
  44b644:	85 c0                	test   eax,eax
  44b646:	75 12                	jne    0x44b65a
  44b648:	83 7e 26 00          	cmp    DWORD PTR [esi+0x26],0x0
  44b64c:	75 0c                	jne    0x44b65a
  44b64e:	83 7e 5b 00          	cmp    DWORD PTR [esi+0x5b],0x0
  44b652:	75 06                	jne    0x44b65a
  44b654:	83 7e 22 05          	cmp    DWORD PTR [esi+0x22],0x5
  44b658:	75 2d                	jne    0x44b687
  44b65a:	50                   	push   eax
  44b65b:	8d 46 1c             	lea    eax,[esi+0x1c]
  44b65e:	eb 1d                	jmp    0x44b67d
  44b660:	8b 46 2b             	mov    eax,DWORD PTR [esi+0x2b]
  44b663:	85 c0                	test   eax,eax
  44b665:	75 12                	jne    0x44b679
  44b667:	83 7e 26 00          	cmp    DWORD PTR [esi+0x26],0x0
  44b66b:	75 0c                	jne    0x44b679
  44b66d:	83 7e 5b 00          	cmp    DWORD PTR [esi+0x5b],0x0
  44b671:	75 06                	jne    0x44b679
  44b673:	83 7e 22 05          	cmp    DWORD PTR [esi+0x22],0x5
  44b677:	75 0e                	jne    0x44b687
  44b679:	50                   	push   eax
  44b67a:	8d 46 18             	lea    eax,[esi+0x18]
  44b67d:	50                   	push   eax
  44b67e:	56                   	push   esi
  44b67f:	e8 cc 08 00 00       	call   0x44bf50
  44b684:	83 c4 0c             	add    esp,0xc
  44b687:	83 3d 1c 45 68 00 00 	cmp    DWORD PTR ds:0x68451c,0x0
  44b68e:	74 06                	je     0x44b696
  44b690:	83 7e 18 00          	cmp    DWORD PTR [esi+0x18],0x0
  44b694:	75 50                	jne    0x44b6e6
  44b696:	83 3d cc c6 68 00 00 	cmp    DWORD PTR ds:0x68c6cc,0x0
  44b69d:	75 47                	jne    0x44b6e6
  44b69f:	83 3d 28 45 68 00 00 	cmp    DWORD PTR ds:0x684528,0x0
  44b6a6:	74 06                	je     0x44b6ae
  44b6a8:	83 7e 1c 00          	cmp    DWORD PTR [esi+0x1c],0x0
  44b6ac:	75 09                	jne    0x44b6b7
  44b6ae:	83 3d cc c6 68 00 00 	cmp    DWORD PTR ds:0x68c6cc,0x0
  44b6b5:	74 71                	je     0x44b728
  44b6b7:	8b 46 2f             	mov    eax,DWORD PTR [esi+0x2f]
  44b6ba:	85 c0                	test   eax,eax
  44b6bc:	75 12                	jne    0x44b6d0
  44b6be:	83 7e 26 00          	cmp    DWORD PTR [esi+0x26],0x0
  44b6c2:	75 0c                	jne    0x44b6d0
  44b6c4:	83 7e 5b 00          	cmp    DWORD PTR [esi+0x5b],0x0
  44b6c8:	75 06                	jne    0x44b6d0
  44b6ca:	83 7e 22 05          	cmp    DWORD PTR [esi+0x22],0x5
  44b6ce:	75 58                	jne    0x44b728
  44b6d0:	50                   	push   eax
  44b6d1:	8d 46 1c             	lea    eax,[esi+0x1c]
  44b6d4:	50                   	push   eax
  44b6d5:	56                   	push   esi
  44b6d6:	e8 c5 0d 00 00       	call   0x44c4a0
  44b6db:	83 c4 0c             	add    esp,0xc
  44b6de:	5d                   	pop    ebp
  44b6df:	5f                   	pop    edi
  44b6e0:	5e                   	pop    esi
  44b6e1:	5b                   	pop    ebx
  44b6e2:	83 c4 04             	add    esp,0x4
  44b6e5:	c3                   	ret
  44b6e6:	8b 46 2b             	mov    eax,DWORD PTR [esi+0x2b]
  44b6e9:	85 c0                	test   eax,eax
  44b6eb:	75 12                	jne    0x44b6ff
  44b6ed:	83 7e 26 00          	cmp    DWORD PTR [esi+0x26],0x0
  44b6f1:	75 0c                	jne    0x44b6ff
  44b6f3:	83 7e 5b 00          	cmp    DWORD PTR [esi+0x5b],0x0
  44b6f7:	75 06                	jne    0x44b6ff
  44b6f9:	83 7e 22 05          	cmp    DWORD PTR [esi+0x22],0x5
  44b6fd:	75 29                	jne    0x44b728
  44b6ff:	50                   	push   eax
  44b700:	8d 46 18             	lea    eax,[esi+0x18]
  44b703:	50                   	push   eax
  44b704:	56                   	push   esi
  44b705:	e8 96 0d 00 00       	call   0x44c4a0
  44b70a:	83 c4 0c             	add    esp,0xc
  44b70d:	5d                   	pop    ebp
  44b70e:	5f                   	pop    edi
  44b70f:	5e                   	pop    esi
  44b710:	5b                   	pop    ebx
  44b711:	83 c4 04             	add    esp,0x4
  44b714:	c3                   	ret
  44b715:	83 3d 14 45 68 00 00 	cmp    DWORD PTR ds:0x684514,0x0
  44b71c:	74 0a                	je     0x44b728
  44b71e:	6a 01                	push   0x1
  44b720:	e8 3b 24 01 00       	call   0x45db60
  44b725:	83 c4 04             	add    esp,0x4
  44b728:	5d                   	pop    ebp
  44b729:	5f                   	pop    edi
  44b72a:	5e                   	pop    esi
  44b72b:	5b                   	pop    ebx
  44b72c:	83 c4 04             	add    esp,0x4
  44b72f:	c3                   	ret
  44b730:	a2 b5 44 00 1d       	mov    ds:0x1d0044b5,al
  44b735:	b6 44                	mov    dh,0x44
  44b737:	00 1d b6 44 00 1d    	add    BYTE PTR ds:0x1d0044b6,bl
  44b73d:	b6 44                	mov    dh,0x44
  44b73f:	00 1d b6 44 00 1d    	add    BYTE PTR ds:0x1d0044b6,bl
  44b745:	b6 44                	mov    dh,0x44
  44b747:	00 b8 b5 44 00 fd    	add    BYTE PTR [eax-0x2ffbb4b],bh
  44b74d:	b5 44                	mov    ch,0x44
  44b74f:	00 1d b6 44 00 1d    	add    BYTE PTR ds:0x1d0044b6,bl
  44b755:	b6 44                	mov    dh,0x44
  44b757:	00 1d b6 44 00 1d    	add    BYTE PTR ds:0x1d0044b6,bl
  44b75d:	b6 44                	mov    dh,0x44
  44b75f:	00 1d b6 44 00 13    	add    BYTE PTR ds:0x130044b6,bl
  44b765:	b6 44                	mov    dh,0x44
  44b767:	00 cc                	add    ah,cl
  44b769:	cc                   	int3
  44b76a:	cc                   	int3
  44b76b:	cc                   	int3
  44b76c:	cc                   	int3
  44b76d:	cc                   	int3
  44b76e:	cc                   	int3
  44b76f:	cc                   	int3
