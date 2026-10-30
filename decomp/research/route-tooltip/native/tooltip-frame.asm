
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004a24c0 <.text+0xa14c0>:
  4a24c0:	8b 4c 24 08          	mov    ecx,DWORD PTR [esp+0x8]
  4a24c4:	83 ec 14             	sub    esp,0x14
  4a24c7:	8d 41 fc             	lea    eax,[ecx-0x4]
  4a24ca:	89 44 24 08          	mov    DWORD PTR [esp+0x8],eax
  4a24ce:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  4a24d2:	03 c1                	add    eax,ecx
  4a24d4:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  4a24d8:	83 c0 03             	add    eax,0x3
  4a24db:	8d 51 fc             	lea    edx,[ecx-0x4]
  4a24de:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  4a24e2:	89 54 24 04          	mov    DWORD PTR [esp+0x4],edx
  4a24e6:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  4a24ea:	83 ec 08             	sub    esp,0x8
  4a24ed:	03 c1                	add    eax,ecx
  4a24ef:	8a 4c 24 30          	mov    cl,BYTE PTR [esp+0x30]
  4a24f3:	83 c0 03             	add    eax,0x3
  4a24f6:	89 64 24 08          	mov    DWORD PTR [esp+0x8],esp
  4a24fa:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  4a24fe:	51                   	push   ecx
  4a24ff:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  4a2503:	e8 68 3a f7 ff       	call   0x415f70
  4a2508:	8d 4c 24 0c          	lea    ecx,[esp+0xc]
  4a250c:	51                   	push   ecx
  4a250d:	e8 ee 44 07 00       	call   0x516a00
  4a2512:	8d 4c 24 10          	lea    ecx,[esp+0x10]
  4a2516:	83 c4 0c             	add    esp,0xc
  4a2519:	68 e8 aa 5c 00       	push   0x5caae8
  4a251e:	51                   	push   ecx
  4a251f:	e8 2c fa ff ff       	call   0x4a1f50
  4a2524:	83 c4 1c             	add    esp,0x1c
  4a2527:	c3                   	ret
  4a2528:	cc                   	int3
  4a2529:	cc                   	int3
  4a252a:	cc                   	int3
  4a252b:	cc                   	int3
  4a252c:	cc                   	int3
  4a252d:	cc                   	int3
  4a252e:	cc                   	int3
  4a252f:	cc                   	int3
  4a2530:	a1 90 ae 5c 00       	mov    eax,ds:0x5cae90
  4a2535:	85 c0                	test   eax,eax
  4a2537:	75 14                	jne    0x4a254d
  4a2539:	a1 50 a8 5c 00       	mov    eax,ds:0x5ca850
  4a253e:	a3 90 ae 5c 00       	mov    ds:0x5cae90,eax
  4a2543:	83 f8 0c             	cmp    eax,0xc
  4a2546:	7d 05                	jge    0x4a254d
  4a2548:	b8 0c 00 00 00       	mov    eax,0xc
  4a254d:	a3 90 ae 5c 00       	mov    ds:0x5cae90,eax
  4a2552:	40                   	inc    eax
  4a2553:	a3 af c6 68 00       	mov    ds:0x68c6af,eax
  4a2558:	c3                   	ret
  4a2559:	cc                   	int3
  4a255a:	cc                   	int3
  4a255b:	cc                   	int3
  4a255c:	cc                   	int3
  4a255d:	cc                   	int3
  4a255e:	cc                   	int3
  4a255f:	cc                   	int3
