
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044c3d6 <.text+0x4b3d6>:
  44c3d6:	83 7e 26 00          	cmp    DWORD PTR [esi+0x26],0x0
  44c3da:	74 15                	je     0x44c3f1
  44c3dc:	83 7e 22 07          	cmp    DWORD PTR [esi+0x22],0x7
  44c3e0:	74 0f                	je     0x44c3f1
  44c3e2:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  44c3e6:	c7 40 2e 03 00 00 00 	mov    DWORD PTR [eax+0x2e],0x3
  44c3ed:	eb 02                	jmp    0x44c3f1
  44c3ef:	32 db                	xor    bl,bl
  44c3f1:	84 db                	test   bl,bl
  44c3f3:	74 59                	je     0x44c44e
  44c3f5:	8b 06                	mov    eax,DWORD PTR [esi]
  44c3f7:	83 e8 02             	sub    eax,0x2
  44c3fa:	83 f8 1f             	cmp    eax,0x1f
  44c3fd:	77 0f                	ja     0x44c40e
  44c3ff:	33 c9                	xor    ecx,ecx
  44c401:	8a 88 80 c4 44 00    	mov    cl,BYTE PTR [eax+0x44c480]
  44c407:	ff 24 8d 74 c4 44 00 	jmp    DWORD PTR [ecx*4+0x44c474]
  44c40e:	83 7e 14 01          	cmp    DWORD PTR [esi+0x14],0x1
  44c412:	75 3a                	jne    0x44c44e
  44c414:	6a 01                	push   0x1
  44c416:	6a 6a                	push   0x6a
  44c418:	6a 00                	push   0x0
  44c41a:	e8 31 dc 03 00       	call   0x48a050
  44c41f:	83 c4 0c             	add    esp,0xc
  44c422:	5d                   	pop    ebp
  44c423:	5f                   	pop    edi
  44c424:	5e                   	pop    esi
  44c425:	5b                   	pop    ebx
  44c426:	83 c4 08             	add    esp,0x8
  44c429:	c3                   	ret
  44c42a:	6a 01                	push   0x1
  44c42c:	6a 60                	push   0x60
  44c42e:	6a 00                	push   0x0
  44c430:	e8 1b dc 03 00       	call   0x48a050
  44c435:	83 c4 0c             	add    esp,0xc
  44c438:	5d                   	pop    ebp
  44c439:	5f                   	pop    edi
  44c43a:	5e                   	pop    esi
  44c43b:	5b                   	pop    ebx
  44c43c:	83 c4 08             	add    esp,0x8
  44c43f:	c3                   	ret
  44c440:	6a 01                	push   0x1
  44c442:	6a 73                	push   0x73
  44c444:	6a 00                	push   0x0
  44c446:	e8 05 dc 03 00       	call   0x48a050
  44c44b:	83 c4 0c             	add    esp,0xc
  44c44e:	5d                   	pop    ebp
  44c44f:	5f                   	pop    edi
  44c450:	5e                   	pop    esi
  44c451:	5b                   	pop    ebx
  44c452:	83 c4 08             	add    esp,0x8
  44c455:	c3                   	ret
  44c456:	8b ff                	mov    edi,edi
  44c458:	bd bf 44 00 8f       	mov    ebp,0x8f0044bf
  44c45d:	c0 44 00 d8 bf       	rol    BYTE PTR [eax+eax*1-0x28],0xbf
  44c462:	44                   	inc    esp
  44c463:	00 8f c0 44 00 95    	add    BYTE PTR [edi-0x6affbb40],cl
  44c469:	c0 44 00 00 01       	rol    BYTE PTR [eax+eax*1+0x0],0x1
  44c46e:	01 01                	add    DWORD PTR [ecx],eax
  44c470:	02 04 03             	add    al,BYTE PTR [ebx+eax*1]
  44c473:	03 2a                	add    ebp,DWORD PTR [edx]
  44c475:	c4 44 00 40          	les    eax,FWORD PTR [eax+eax*1+0x40]
  44c479:	c4 44 00 0e          	les    eax,FWORD PTR [eax+eax*1+0xe]
  44c47d:	c4                   	.byte 0xc4
  44c47e:	44                   	inc    esp
	...
