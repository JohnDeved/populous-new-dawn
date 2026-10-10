
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0043e330 <.text+0x3d330>:
  43e330:	8d 04 80             	lea    eax,[eax+eax*4]
  43e333:	2b c1                	sub    eax,ecx
  43e335:	8d 14 c1             	lea    edx,[ecx+eax*8]
  43e338:	8d 0c 55 d3 79 89 00 	lea    ecx,[edx*2+0x8979d3]
  43e33f:	66 83 79 04 00       	cmp    WORD PTR [ecx+0x4],0x0
  43e344:	75 6f                	jne    0x43e3b5
  43e346:	66 c7 41 04 01 00    	mov    WORD PTR [ecx+0x4],0x1
  43e34c:	0f be 15 f0 c6 89 00 	movsx  edx,BYTE PTR ds:0x89c6f0
  43e353:	a1 84 d1 89 00       	mov    eax,ds:0x89d184
  43e358:	8d 34 52             	lea    esi,[edx+edx*2]
  43e35b:	89 84 b6 97 79 89 00 	mov    DWORD PTR [esi+esi*4+0x897997],eax
  43e362:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  43e369:	8d 14 40             	lea    edx,[eax+eax*2]
  43e36c:	8d 34 92             	lea    esi,[edx+edx*4]
  43e36f:	0f bf 11             	movsx  edx,WORD PTR [ecx]
  43e372:	81 c6 97 79 89 00    	add    esi,0x897997
  43e378:	8d 04 52             	lea    eax,[edx+edx*2]
  43e37b:	8d 14 80             	lea    edx,[eax+eax*4]
  43e37e:	8b 06                	mov    eax,DWORD PTR [esi]
  43e380:	03 d1                	add    edx,ecx
  43e382:	89 42 06             	mov    DWORD PTR [edx+0x6],eax
  43e385:	83 c2 06             	add    edx,0x6
  43e388:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  43e38b:	89 42 04             	mov    DWORD PTR [edx+0x4],eax
  43e38e:	8b 46 08             	mov    eax,DWORD PTR [esi+0x8]
  43e391:	89 42 08             	mov    DWORD PTR [edx+0x8],eax
  43e394:	66 8b 46 0c          	mov    ax,WORD PTR [esi+0xc]
  43e398:	66 89 42 0c          	mov    WORD PTR [edx+0xc],ax
  43e39c:	8a 46 0e             	mov    al,BYTE PTR [esi+0xe]
  43e39f:	88 42 0e             	mov    BYTE PTR [edx+0xe],al
  43e3a2:	66 8b 01             	mov    ax,WORD PTR [ecx]
  43e3a5:	66 40                	inc    ax
  43e3a7:	66 89 01             	mov    WORD PTR [ecx],ax
  43e3aa:	66 3d 64 00          	cmp    ax,0x64
  43e3ae:	7c 05                	jl     0x43e3b5
  43e3b0:	66 c7 01 00 00       	mov    WORD PTR [ecx],0x0
  43e3b5:	5e                   	pop    esi
  43e3b6:	c3                   	ret
  43e3b7:	cc                   	int3
  43e3b8:	cc                   	int3
  43e3b9:	cc                   	int3
  43e3ba:	cc                   	int3
  43e3bb:	cc                   	int3
  43e3bc:	cc                   	int3
  43e3bd:	cc                   	int3
  43e3be:	cc                   	int3
  43e3bf:	cc                   	int3
  43e3c0:	53                   	push   ebx
  43e3c1:	56                   	push   esi
  43e3c2:	57                   	push   edi
  43e3c3:	33 db                	xor    ebx,ebx
  43e3c5:	55                   	push   ebp
  43e3c6:	38 1d c0 ea 96 00    	cmp    BYTE PTR ds:0x96eac0,bl
  43e3cc:	0f 86 a6 00 00 00    	jbe    0x43e478
  43e3d2:	bf 97 79 89 00       	mov    edi,0x897997
  43e3d7:	be d3 79 89 00       	mov    esi,0x8979d3
  43e3dc:	b9 e7 dd 89 00       	mov    ecx,0x89dde7
  43e3e1:	80 39 01             	cmp    BYTE PTR [ecx],0x1
  43e3e4:	75 73                	jne    0x43e459
  43e3e6:	66 83 7e 04 00       	cmp    WORD PTR [esi+0x4],0x0
  43e3eb:	75 6c                	jne    0x43e459
  43e3ed:	66 83 3d fd 28 89 00 	cmp    WORD PTR ds:0x8928fd,0x0
  43e3f4:	00 
  43e3f5:	74 15                	je     0x43e40c
  43e3f7:	a1 81 79 89 00       	mov    eax,ds:0x897981
  43e3fc:	2b d2                	sub    edx,edx
  43e3fe:	0f bf 2d fd 28 89 00 	movsx  ebp,WORD PTR ds:0x8928fd
  43e405:	45                   	inc    ebp
  43e406:	f7 f5                	div    ebp
  43e408:	85 d2                	test   edx,edx
  43e40a:	75 6c                	jne    0x43e478
  43e40c:	66 c7 46 04 01 00    	mov    WORD PTR [esi+0x4],0x1
  43e412:	a1 84 d1 89 00       	mov    eax,ds:0x89d184
  43e417:	89 07                	mov    DWORD PTR [edi],eax
  43e419:	0f bf 16             	movsx  edx,WORD PTR [esi]
  43e41c:	8d 04 52             	lea    eax,[edx+edx*2]
  43e41f:	8d                   	.byte 0x8d
