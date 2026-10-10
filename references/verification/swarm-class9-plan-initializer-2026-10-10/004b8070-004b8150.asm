
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004b8070 <.text+0xb7070>:
  4b8070:	83 ec 08             	sub    esp,0x8
  4b8073:	33 c0                	xor    eax,eax
  4b8075:	56                   	push   esi
  4b8076:	8b 74 24 10          	mov    esi,DWORD PTR [esp+0x10]
  4b807a:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  4b807d:	83 f8 01             	cmp    eax,0x1
  4b8080:	0f 85 c1 00 00 00    	jne    0x4b8147
  4b8086:	8d 46 3d             	lea    eax,[esi+0x3d]
  4b8089:	50                   	push   eax
  4b808a:	56                   	push   esi
  4b808b:	e8 e0 63 03 00       	call   0x4ee470
  4b8090:	83 c4 08             	add    esp,0x8
  4b8093:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4b8096:	80 4e 35 10          	or     BYTE PTR [esi+0x35],0x10
  4b809a:	f6 c4 04             	test   ah,0x4
  4b809d:	74 16                	je     0x4b80b5
  4b809f:	25 ff fb ff ff       	and    eax,0xfffffbff
  4b80a4:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  4b80a7:	83 2d 43 24 89 00 14 	sub    DWORD PTR ds:0x892443,0x14
  4b80ae:	a1 43 24 89 00       	mov    eax,ds:0x892443
  4b80b3:	eb 02                	jmp    0x4b80b7
  4b80b5:	33 c0                	xor    eax,eax
  4b80b7:	85 c0                	test   eax,eax
  4b80b9:	74 21                	je     0x4b80dc
  4b80bb:	8a 08                	mov    cl,BYTE PTR [eax]
  4b80bd:	88 8e 9b 00 00 00    	mov    BYTE PTR [esi+0x9b],cl
  4b80c3:	8b 50 04             	mov    edx,DWORD PTR [eax+0x4]
  4b80c6:	66 89 56 68          	mov    WORD PTR [esi+0x68],dx
  4b80ca:	8a 48 08             	mov    cl,BYTE PTR [eax+0x8]
  4b80cd:	88 8e 9e 00 00 00    	mov    BYTE PTR [esi+0x9e],cl
  4b80d3:	8a 40 0c             	mov    al,BYTE PTR [eax+0xc]
  4b80d6:	88 86 9f 00 00 00    	mov    BYTE PTR [esi+0x9f],al
  4b80dc:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  4b80e0:	75 16                	jne    0x4b80f8
  4b80e2:	56                   	push   esi
  4b80e3:	e8 08 56 03 00       	call   0x4ed6f0
  4b80e8:	83 c4 04             	add    esp,0x4
  4b80eb:	c6 46 2c 01          	mov    BYTE PTR [esi+0x2c],0x1
  4b80ef:	56                   	push   esi
  4b80f0:	e8 4b 55 03 00       	call   0x4ed640
  4b80f5:	83 c4 04             	add    esp,0x4
  4b80f8:	8d 44 24 08          	lea    eax,[esp+0x8]
  4b80fc:	50                   	push   eax
  4b80fd:	56                   	push   esi
  4b80fe:	e8 bd 1e 00 00       	call   0x4b9fc0
  4b8103:	66 8b 44 24 10       	mov    ax,WORD PTR [esp+0x10]
  4b8108:	83 c4 08             	add    esp,0x8
  4b810b:	66 8b 4c 24 0a       	mov    cx,WORD PTR [esp+0xa]
  4b8110:	88 64 24 06          	mov    BYTE PTR [esp+0x6],ah
  4b8114:	33 c0                	xor    eax,eax
  4b8116:	88 6c 24 07          	mov    BYTE PTR [esp+0x7],ch
  4b811a:	66 8b 44 24 06       	mov    ax,WORD PTR [esp+0x6]
  4b811f:	33 c9                	xor    ecx,ecx
  4b8121:	66 8b 4c 24 06       	mov    cx,WORD PTR [esp+0x6]
  4b8126:	25 fe 00 00 00       	and    eax,0xfe
  4b812b:	03 c0                	add    eax,eax
  4b812d:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  4b8133:	0b c1                	or     eax,ecx
  4b8135:	81 0c 85 e4 03 8a 00 	or     DWORD PTR [eax*4+0x8a03e4],0x4000
  4b813c:	00 40 00 00 
  4b8140:	c6 86 a0 00 00 00 ff 	mov    BYTE PTR [esi+0xa0],0xff
  4b8147:	5e                   	pop    esi
  4b8148:	83 c4 08             	add    esp,0x8
  4b814b:	c3                   	ret
  4b814c:	cc                   	int3
  4b814d:	cc                   	int3
  4b814e:	cc                   	int3
  4b814f:	cc                   	int3
