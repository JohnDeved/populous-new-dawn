
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004ee300 <.text+0xed300>:
  4ee300:	56                   	push   esi
  4ee301:	33 c9                	xor    ecx,ecx
  4ee303:	57                   	push   edi
  4ee304:	89 0d 1c 03 89 00    	mov    DWORD PTR ds:0x89031c,ecx
  4ee30a:	89 0d 20 03 89 00    	mov    DWORD PTR ds:0x890320,ecx
  4ee310:	89 0d 24 03 89 00    	mov    DWORD PTR ds:0x890324,ecx
  4ee316:	8b 35 7c 03 89 00    	mov    esi,DWORD PTR ds:0x89037c
  4ee31c:	89 0d 28 03 89 00    	mov    DWORD PTR ds:0x890328,ecx
  4ee322:	89 0d 51 c6 89 00    	mov    DWORD PTR ds:0x89c651,ecx
  4ee328:	89 0d 59 c6 89 00    	mov    DWORD PTR ds:0x89c659,ecx
  4ee32e:	39 35 88 03 89 00    	cmp    DWORD PTR ds:0x890388,esi
  4ee334:	0f 86 b4 00 00 00    	jbe    0x4ee3ee
  4ee33a:	ba 01 00 00 00       	mov    edx,0x1
  4ee33f:	bf 80 02 00 00       	mov    edi,0x280
  4ee344:	38 4e 2a             	cmp    BYTE PTR [esi+0x2a],cl
  4ee347:	75 68                	jne    0x4ee3b1
  4ee349:	85 56 0c             	test   DWORD PTR [esi+0xc],edx
  4ee34c:	74 27                	je     0x4ee375
  4ee34e:	a1 28 03 89 00       	mov    eax,ds:0x890328
  4ee353:	89 46 04             	mov    DWORD PTR [esi+0x4],eax
  4ee356:	89 0e                	mov    DWORD PTR [esi],ecx
  4ee358:	89 35 28 03 89 00    	mov    DWORD PTR ds:0x890328,esi
  4ee35e:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  4ee361:	85 c0                	test   eax,eax
  4ee363:	74 02                	je     0x4ee367
  4ee365:	89 30                	mov    DWORD PTR [eax],esi
  4ee367:	ff 05 51 c6 89 00    	inc    DWORD PTR ds:0x89c651
  4ee36d:	66 39 7e 24          	cmp    WORD PTR [esi+0x24],di
  4ee371:	73 69                	jae    0x4ee3dc
  4ee373:	eb 61                	jmp    0x4ee3d6
  4ee375:	66 39 7e 24          	cmp    WORD PTR [esi+0x24],di
  4ee379:	72 1b                	jb     0x4ee396
  4ee37b:	a1 1c 03 89 00       	mov    eax,ds:0x89031c
  4ee380:	89 46 04             	mov    DWORD PTR [esi+0x4],eax
  4ee383:	89 0e                	mov    DWORD PTR [esi],ecx
  4ee385:	89 35 1c 03 89 00    	mov    DWORD PTR ds:0x89031c,esi
  4ee38b:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  4ee38e:	85 c0                	test   eax,eax
  4ee390:	74 4a                	je     0x4ee3dc
  4ee392:	89 30                	mov    DWORD PTR [eax],esi
  4ee394:	eb 46                	jmp    0x4ee3dc
  4ee396:	a1 20 03 89 00       	mov    eax,ds:0x890320
  4ee39b:	89 46 04             	mov    DWORD PTR [esi+0x4],eax
  4ee39e:	89 0e                	mov    DWORD PTR [esi],ecx
  4ee3a0:	89 35 20 03 89 00    	mov    DWORD PTR ds:0x890320,esi
  4ee3a6:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  4ee3a9:	85 c0                	test   eax,eax
  4ee3ab:	74 2f                	je     0x4ee3dc
  4ee3ad:	89 30                	mov    DWORD PTR [eax],esi
  4ee3af:	eb 2b                	jmp    0x4ee3dc
  4ee3b1:	a1 24 03 89 00       	mov    eax,ds:0x890324
  4ee3b6:	89 46 04             	mov    DWORD PTR [esi+0x4],eax
  4ee3b9:	89 0e                	mov    DWORD PTR [esi],ecx
  4ee3bb:	89 35 24 03 89 00    	mov    DWORD PTR ds:0x890324,esi
  4ee3c1:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  4ee3c4:	85 c0                	test   eax,eax
  4ee3c6:	74 02                	je     0x4ee3ca
  4ee3c8:	89 30                	mov    DWORD PTR [eax],esi
  4ee3ca:	ff 05 51 c6 89 00    	inc    DWORD PTR ds:0x89c651
  4ee3d0:	66 39 7e 24          	cmp    WORD PTR [esi+0x24],di
  4ee3d4:	73 06                	jae    0x4ee3dc
  4ee3d6:	ff 05 59 c6 89 00    	inc    DWORD PTR ds:0x89c659
  4ee3dc:	81 c6 b3 00 00 00    	add    esi,0xb3
  4ee3e2:	39 35 88 03 89 00    	cmp    DWORD PTR ds:0x890388,esi
  4ee3e8:	0f 87 56 ff ff ff    	ja     0x4ee344
  4ee3ee:	33 c9                	xor    ecx,ecx
  4ee3f0:	8b 15 80 03 89 00    	mov    edx,DWORD PTR ds:0x890380
  4ee3f6:	89 0d 2c 03 89 00    	mov    DWORD PTR ds:0x89032c,ecx
  4ee3fc:	89 0d 30 03 89 00    	mov    DWORD PTR ds:0x890330,ecx
  4ee402:	89 0d 55 c6 89 00    	mov    DWORD PTR ds:0x89c655,ecx
  4ee408:	89 0d 5d c6 89 00    	mov    DWORD PTR ds:0x89c65d,ecx
  4ee40e:	39 15 8c 03 89 00    	cmp    DWORD PTR ds:0x89038c,edx
  4ee414:	76 4d                	jbe    0x4ee463
  4ee416:	38 4a 2a             	cmp    BYTE PTR [edx+0x2a],cl
  4ee419:	75 1b                	jne    0x4ee436
  4ee41b:	a1 2c 03 89 00       	mov    eax,ds:0x89032c
  4ee420:	89 42 04             	mov    DWORD PTR [edx+0x4],eax
  4ee423:	89 0a                	mov    DWORD PTR [edx],ecx
  4ee425:	89 15 2c 03 89 00    	mov    DWORD PTR ds:0x89032c,edx
  4ee42b:	8b 42 04             	mov    eax,DWORD PTR [edx+0x4]
  4ee42e:	85 c0                	test   eax,eax
  4ee430:	74 23                	je     0x4ee455
  4ee432:	89 10                	mov    DWORD PTR [eax],edx
  4ee434:	eb 1f                	jmp    0x4ee455
  4ee436:	a1 30 03 89 00       	mov    eax,ds:0x890330
  4ee43b:	89 42 04             	mov    DWORD PTR [edx+0x4],eax
  4ee43e:	89 0a                	mov    DWORD PTR [edx],ecx
  4ee440:	89 15 30 03 89 00    	mov    DWORD PTR ds:0x890330,edx
  4ee446:	8b 42 04             	mov    eax,DWORD PTR [edx+0x4]
  4ee449:	85 c0                	test   eax,eax
  4ee44b:	74 02                	je     0x4ee44f
  4ee44d:	89 10                	mov    DWORD PTR [eax],edx
  4ee44f:	ff 05 55 c6 89 00    	inc    DWORD PTR ds:0x89c655
  4ee455:	81 c2 b3 00 00 00    	add    edx,0xb3
  4ee45b:	39 15 8c 03 89 00    	cmp    DWORD PTR ds:0x89038c,edx
  4ee461:	77 b3                	ja     0x4ee416
  4ee463:	5f                   	pop    edi
  4ee464:	5e                   	pop    esi
  4ee465:	c3                   	ret
  4ee466:	cc                   	int3
  4ee467:	cc                   	int3
  4ee468:	cc                   	int3
  4ee469:	cc                   	int3
  4ee46a:	cc                   	int3
  4ee46b:	cc                   	int3
  4ee46c:	cc                   	int3
  4ee46d:	cc                   	int3
  4ee46e:	cc                   	int3
  4ee46f:	cc                   	int3
