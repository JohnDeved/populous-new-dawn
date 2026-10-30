
00419480-004194f0.bin:     file format binary


Disassembly of section .data:

00419480 <.data>:
  419480:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  419484:	8d 0c 80             	lea    ecx,[eax+eax*4]
  419487:	8d 14 48             	lea    edx,[eax+ecx*2]
  41948a:	8d 0c d2             	lea    ecx,[edx+edx*8]
  41948d:	8d 14 c8             	lea    edx,[eax+ecx*8]
  419490:	8d 84 90 c8 d1 89 00 	lea    eax,[eax+edx*4+0x89d1c8]
  419497:	80 b8 20 0c 00 00 00 	cmp    BYTE PTR [eax+0xc20],0x0
  41949e:	74 0c                	je     0x4194ac
  4194a0:	83 b8 49 09 00 00 60 	cmp    DWORD PTR [eax+0x949],0x60
  4194a7:	7f 03                	jg     0x4194ac
  4194a9:	32 c0                	xor    al,al
  4194ab:	c3                   	ret
  4194ac:	b0 01                	mov    al,0x1
  4194ae:	c3                   	ret
  4194af:	cc                   	int3
  4194b0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4194b4:	8d 0c 80             	lea    ecx,[eax+eax*4]
  4194b7:	8d 14 48             	lea    edx,[eax+ecx*2]
  4194ba:	8d 0c d2             	lea    ecx,[edx+edx*8]
  4194bd:	8d 14 c8             	lea    edx,[eax+ecx*8]
  4194c0:	8d 84 90 c8 d1 89 00 	lea    eax,[eax+edx*4+0x89d1c8]
  4194c7:	80 b8 20 0c 00 00 00 	cmp    BYTE PTR [eax+0xc20],0x0
  4194ce:	74 12                	je     0x4194e2
  4194d0:	8b 80 49 09 00 00    	mov    eax,DWORD PTR [eax+0x949]
  4194d6:	85 c0                	test   eax,eax
  4194d8:	74 08                	je     0x4194e2
  4194da:	83 f8 60             	cmp    eax,0x60
  4194dd:	7d 03                	jge    0x4194e2
  4194df:	b0 01                	mov    al,0x1
  4194e1:	c3                   	ret
  4194e2:	32 c0                	xor    al,al
  4194e4:	c3                   	ret
  4194e5:	cc                   	int3
  4194e6:	cc                   	int3
  4194e7:	cc                   	int3
  4194e8:	cc                   	int3
  4194e9:	cc                   	int3
  4194ea:	cc                   	int3
  4194eb:	cc                   	int3
  4194ec:	cc                   	int3
  4194ed:	cc                   	int3
  4194ee:	cc                   	int3
  4194ef:	cc                   	int3
