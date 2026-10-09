
/workspace/scratch/69fd8163d94e/populous-recovery-20261009/work/orchestration/original-data-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

005112d0 <.text+0x1102d0>:
  5112d0:	8b 54 24 04          	mov    edx,DWORD PTR [esp+0x4]
  5112d4:	b9 05 00 00 00       	mov    ecx,0x5
  5112d9:	83 c2 76             	add    edx,0x76
  5112dc:	66 8b 02             	mov    ax,WORD PTR [edx]
  5112df:	66 85 c0             	test   ax,ax
  5112e2:	74 1e                	je     0x511302
  5112e4:	66 2d 02 00          	sub    ax,0x2
  5112e8:	66 89 02             	mov    WORD PTR [edx],ax
  5112eb:	79 15                	jns    0x511302
  5112ed:	eb 0e                	jmp    0x5112fd
  5112ef:	7d 11                	jge    0x511302
  5112f1:	66 05 02 00          	add    ax,0x2
  5112f5:	66 89 02             	mov    WORD PTR [edx],ax
  5112f8:	66 85 c0             	test   ax,ax
  5112fb:	7e 05                	jle    0x511302
  5112fd:	66 c7 02 00 00       	mov    WORD PTR [edx],0x0
  511302:	66 8b 42 02          	mov    ax,WORD PTR [edx+0x2]
  511306:	66 85 c0             	test   ax,ax
  511309:	74 2c                	je     0x511337
  51130b:	66 2d 02 00          	sub    ax,0x2
  51130f:	66 89 42 02          	mov    WORD PTR [edx+0x2],ax
  511313:	79 22                	jns    0x511337
  511315:	66 c7 42 02 00 00    	mov    WORD PTR [edx+0x2],0x0
  51131b:	83 c2 04             	add    edx,0x4
  51131e:	49                   	dec    ecx
  51131f:	75 bb                	jne    0x5112dc
  511321:	c3                   	ret
  511322:	7d 13                	jge    0x511337
  511324:	66 05 02 00          	add    ax,0x2
  511328:	66 89 42 02          	mov    WORD PTR [edx+0x2],ax
  51132c:	66 85 c0             	test   ax,ax
  51132f:	7e 06                	jle    0x511337
  511331:	66 c7 42 02 00 00    	mov    WORD PTR [edx+0x2],0x0
  511337:	83 c2 04             	add    edx,0x4
  51133a:	49                   	dec    ecx
  51133b:	75 9f                	jne    0x5112dc
  51133d:	c3                   	ret
  51133e:	cc                   	int3
  51133f:	cc                   	int3
  511340:	83 ec 04             	sub    esp,0x4
  511343:	53                   	push   ebx
  511344:	56                   	push   esi
  511345:	8b 74 24 10          	mov    esi,DWORD PTR [esp+0x10]
  511349:	57                   	push   edi
  51134a:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  51134e:	75 16                	jne    0x511366
  511350:	56                   	push   esi
  511351:	e8 9a c3 fd ff       	call   0x4ed6f0
  511356:	83 c4 04             	add    esp,0x4
  511359:	c6 46 2c 13          	mov    BYTE PTR [esi+0x2c],0x13
  51135d:	56                   	push   esi
  51135e:	e8 dd c2 fd ff       	call   0x4ed640
  511363:	83 c4 04             	add    esp,0x4
  511366:	c6 46 3a 34          	mov    BYTE PTR [esi+0x3a],0x34
  51136a:	66 81 66 35 ef ff    	and    WORD PTR [esi+0x35],0xffef
  511370:	66 c7 46 6c 00 7d    	mov    WORD PTR [esi+0x6c],0x7d00
  511376:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  51137b:	8b c8                	mov    ecx,eax
  51137d:	8d 14 c0             	lea    edx,[eax+eax*8]
