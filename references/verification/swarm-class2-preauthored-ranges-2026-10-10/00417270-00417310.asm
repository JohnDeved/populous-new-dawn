
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00417270 <.text+0x16270>:
  417270:	53                   	push   ebx
  417271:	56                   	push   esi
  417272:	f6 05 61 c6 89 00 04 	test   BYTE PTR ds:0x89c661,0x4
  417279:	66 0f b6 74 24 0c    	movzx  si,BYTE PTR [esp+0xc]
  41727f:	0f b7 c6             	movzx  eax,si
  417282:	57                   	push   edi
  417283:	8d 3c c5 00 00 00 00 	lea    edi,[eax*8+0x0]
  41728a:	75 17                	jne    0x4172a3
  41728c:	f6 05 66 c6 89 00 02 	test   BYTE PTR ds:0x89c666,0x2
  417293:	75 0e                	jne    0x4172a3
  417295:	80 7c 24 14 00       	cmp    BYTE PTR [esp+0x14],0x0
  41729a:	74 07                	je     0x4172a3
  41729c:	e8 df 48 03 00       	call   0x44bb80
  4172a1:	eb 02                	jmp    0x4172a5
  4172a3:	33 c0                	xor    eax,eax
  4172a5:	0f bf 15 cf c6 89 00 	movsx  edx,WORD PTR ds:0x89c6cf
  4172ac:	2b d0                	sub    edx,eax
  4172ae:	8d 0c 7d 00 00 00 00 	lea    ecx,[edi*2+0x0]
  4172b5:	3b ca                	cmp    ecx,edx
  4172b7:	7d 44                	jge    0x4172fd
  4172b9:	0f bf 1d d1 c6 89 00 	movsx  ebx,WORD PTR ds:0x89c6d1
  4172c0:	3b d9                	cmp    ebx,ecx
  4172c2:	7e 39                	jle    0x4172fd
  4172c4:	66 03 c7             	add    ax,di
  4172c7:	66 8b 0d d1 c6 89 00 	mov    cx,WORD PTR ds:0x89c6d1
  4172ce:	66 89 35 c3 c6 89 00 	mov    WORD PTR ds:0x89c6c3,si
  4172d5:	66 a3 26 f0 88 00    	mov    ds:0x88f026,ax
  4172db:	8d 04 7d 00 00 00 00 	lea    eax,[edi*2+0x0]
  4172e2:	66 2b d0             	sub    dx,ax
  4172e5:	66 2b c8             	sub    cx,ax
  4172e8:	66 89 3d 28 f0 88 00 	mov    WORD PTR ds:0x88f028,di
  4172ef:	66 89 15 2a f0 88 00 	mov    WORD PTR ds:0x88f02a,dx
  4172f6:	66 89 0d 2c f0 88 00 	mov    WORD PTR ds:0x88f02c,cx
  4172fd:	5f                   	pop    edi
  4172fe:	5e                   	pop    esi
  4172ff:	5b                   	pop    ebx
  417300:	c3                   	ret
  417301:	cc                   	int3
  417302:	cc                   	int3
  417303:	cc                   	int3
  417304:	cc                   	int3
  417305:	cc                   	int3
  417306:	cc                   	int3
  417307:	cc                   	int3
  417308:	cc                   	int3
  417309:	cc                   	int3
  41730a:	cc                   	int3
  41730b:	cc                   	int3
  41730c:	cc                   	int3
  41730d:	cc                   	int3
  41730e:	cc                   	int3
  41730f:	cc                   	int3
