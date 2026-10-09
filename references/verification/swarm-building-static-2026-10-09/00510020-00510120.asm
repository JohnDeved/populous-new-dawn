
/workspace/scratch/69fd8163d94e/populous-recovery-20261009/work/orchestration/original-data-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00510020 <.text+0x10f020>:
  510020:	83 ec 08             	sub    esp,0x8
  510023:	56                   	push   esi
  510024:	8b 74 24 10          	mov    esi,DWORD PTR [esp+0x10]
  510028:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  51002c:	75 16                	jne    0x510044
  51002e:	56                   	push   esi
  51002f:	e8 bc d6 fd ff       	call   0x4ed6f0
  510034:	83 c4 04             	add    esp,0x4
  510037:	c6 46 2c 16          	mov    BYTE PTR [esi+0x2c],0x16
  51003b:	56                   	push   esi
  51003c:	e8 ff d5 fd ff       	call   0x4ed640
  510041:	83 c4 04             	add    esp,0x4
  510044:	c6 46 72 3c          	mov    BYTE PTR [esi+0x72],0x3c
  510048:	66 c7 46 6c c8 00    	mov    WORD PTR [esi+0x6c],0xc8
  51004e:	66 c7 46 73 00 00    	mov    WORD PTR [esi+0x73],0x0
  510054:	66 8b 46 3f          	mov    ax,WORD PTR [esi+0x3f]
  510058:	66 8b 4e 3d          	mov    cx,WORD PTR [esi+0x3d]
  51005c:	50                   	push   eax
  51005d:	51                   	push   ecx
  51005e:	e8 dd e8 f3 ff       	call   0x44e940
  510063:	66 c7 46 5f 50 00    	mov    WORD PTR [esi+0x5f],0x50
  510069:	81 66 10 ff fb ff ff 	and    DWORD PTR [esi+0x10],0xfffffbff
  510070:	66 89 46 41          	mov    WORD PTR [esi+0x41],ax
  510074:	83 c4 08             	add    esp,0x8
  510077:	66 81 46 41 c8 00    	add    WORD PTR [esi+0x41],0xc8
  51007d:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  510082:	8b c8                	mov    ecx,eax
  510084:	8d 14 c0             	lea    edx,[eax+eax*8]
  510087:	8d 04 d1             	lea    eax,[ecx+edx*8]
  51008a:	8d 04 81             	lea    eax,[ecx+eax*4]
  51008d:	c1 e0 02             	shl    eax,0x2
  510090:	8d 04 c1             	lea    eax,[ecx+eax*8]
  510093:	05 df 24 00 00       	add    eax,0x24df
  510098:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  51009d:	89 44 24 08          	mov    DWORD PTR [esp+0x8],eax
  5100a1:	c1 4c 24 08 0d       	ror    DWORD PTR [esp+0x8],0xd
  5100a6:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  5100aa:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  5100af:	66 25 ff 07          	and    ax,0x7ff
  5100b3:	66 89 46 57          	mov    WORD PTR [esi+0x57],ax
  5100b7:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  5100bc:	8b c8                	mov    ecx,eax
  5100be:	8d 14 c0             	lea    edx,[eax+eax*8]
  5100c1:	8d 04 d1             	lea    eax,[ecx+edx*8]
  5100c4:	8d 04 81             	lea    eax,[ecx+eax*4]
  5100c7:	c1 e0 02             	shl    eax,0x2
  5100ca:	8d 04 c1             	lea    eax,[ecx+eax*8]
  5100cd:	05 df 24 00 00       	add    eax,0x24df
  5100d2:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  5100d7:	89 44 24 04          	mov    DWORD PTR [esp+0x4],eax
  5100db:	c1 4c 24 04 0d       	ror    DWORD PTR [esp+0x4],0xd
  5100e0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  5100e4:	33 c9                	xor    ecx,ecx
  5100e6:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  5100eb:	66 25 1f 00          	and    ax,0x1f
  5100ef:	8b 56 3d             	mov    edx,DWORD PTR [esi+0x3d]
  5100f2:	66 89 46 70          	mov    WORD PTR [esi+0x70],ax
  5100f6:	88 4e 2d             	mov    BYTE PTR [esi+0x2d],cl
  5100f9:	8d 46 79             	lea    eax,[esi+0x79]
  5100fc:	89 56 75             	mov    DWORD PTR [esi+0x75],edx
  5100ff:	89 08                	mov    DWORD PTR [eax],ecx
  510101:	89 48 04             	mov    DWORD PTR [eax+0x4],ecx
  510104:	89 48 08             	mov    DWORD PTR [eax+0x8],ecx
  510107:	89 48 0c             	mov    DWORD PTR [eax+0xc],ecx
  51010a:	89 48 10             	mov    DWORD PTR [eax+0x10],ecx
  51010d:	81 4e 0c 80 00 00 00 	or     DWORD PTR [esi+0xc],0x80
  510114:	5e                   	pop    esi
  510115:	83 c4 08             	add    esp,0x8
  510118:	c3                   	ret
  510119:	cc                   	int3
  51011a:	cc                   	int3
  51011b:	cc                   	int3
  51011c:	cc                   	int3
  51011d:	cc                   	int3
  51011e:	cc                   	int3
  51011f:	cc                   	int3
