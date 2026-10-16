
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0052a0e0 <.text+0x1290e0>:
  52a0e0:	8b 54 24 04          	mov    edx,DWORD PTR [esp+0x4]
  52a0e4:	83 ec 04             	sub    esp,0x4
  52a0e7:	85 d2                	test   edx,edx
  52a0e9:	74 38                	je     0x52a123
  52a0eb:	8b 09                	mov    ecx,DWORD PTR [ecx]
  52a0ed:	85 c9                	test   ecx,ecx
  52a0ef:	74 32                	je     0x52a123
  52a0f1:	c7 44 24 00 00 00 00 	mov    DWORD PTR [esp+0x0],0x0
  52a0f8:	00 
  52a0f9:	8d 44 24 10          	lea    eax,[esp+0x10]
  52a0fd:	50                   	push   eax
  52a0fe:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  52a102:	50                   	push   eax
  52a103:	8d 44 24 08          	lea    eax,[esp+0x8]
  52a107:	50                   	push   eax
  52a108:	6a 00                	push   0x0
  52a10a:	52                   	push   edx
  52a10b:	51                   	push   ecx
  52a10c:	ff 15 8c c5 d0 00    	call   DWORD PTR ds:0xd0c58c
  52a112:	83 f8 01             	cmp    eax,0x1
  52a115:	b8 00 00 00 00       	mov    eax,0x0
  52a11a:	83 d0 ff             	adc    eax,0xffffffff
  52a11d:	83 c4 04             	add    esp,0x4
  52a120:	c2 0c 00             	ret    0xc
  52a123:	b8 ff ff ff ff       	mov    eax,0xffffffff
  52a128:	83 c4 04             	add    esp,0x4
  52a12b:	c2 0c 00             	ret    0xc

INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0052a390 <.text+0x129390>:
  52a390:	83 ec 08             	sub    esp,0x8
  52a393:	8d 44 24 04          	lea    eax,[esp+0x4]
  52a397:	56                   	push   esi
  52a398:	8b 74 24 10          	mov    esi,DWORD PTR [esp+0x10]
  52a39c:	57                   	push   edi
  52a39d:	8b f9                	mov    edi,ecx
  52a39f:	6a 04                	push   0x4
  52a3a1:	50                   	push   eax
  52a3a2:	56                   	push   esi
  52a3a3:	e8 38 fd ff ff       	call   0x52a0e0
  52a3a8:	85 c0                	test   eax,eax
  52a3aa:	75 17                	jne    0x52a3c3
  52a3ac:	56                   	push   esi
  52a3ad:	8b cf                	mov    ecx,edi
  52a3af:	e8 5c 00 00 00       	call   0x52a410
  52a3b4:	83 f8 04             	cmp    eax,0x4
  52a3b7:	7c 0a                	jl     0x52a3c3
  52a3b9:	83 f8 05             	cmp    eax,0x5
  52a3bc:	7e 12                	jle    0x52a3d0
  52a3be:	83 f8 06             	cmp    eax,0x6
  52a3c1:	74 21                	je     0x52a3e4
  52a3c3:	b8 ff ff ff ff       	mov    eax,0xffffffff
  52a3c8:	5f                   	pop    edi
  52a3c9:	5e                   	pop    esi
  52a3ca:	83 c4 08             	add    esp,0x8
  52a3cd:	c2 08 00             	ret    0x8
  52a3d0:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  52a3d4:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  52a3d8:	5f                   	pop    edi
  52a3d9:	5e                   	pop    esi
  52a3da:	89 01                	mov    DWORD PTR [ecx],eax
  52a3dc:	33 c0                	xor    eax,eax
  52a3de:	83 c4 08             	add    esp,0x8
  52a3e1:	c2 08 00             	ret    0x8
  52a3e4:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  52a3e8:	89 44 24 08          	mov    DWORD PTR [esp+0x8],eax
  52a3ec:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  52a3f0:	0f c8                	bswap  eax
  52a3f2:	89 44 24 08          	mov    DWORD PTR [esp+0x8],eax
  52a3f6:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  52a3fa:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  52a3fe:	5f                   	pop    edi
  52a3ff:	5e                   	pop    esi
  52a400:	89 01                	mov    DWORD PTR [ecx],eax
  52a402:	33 c0                	xor    eax,eax
  52a404:	83 c4 08             	add    esp,0x8
  52a407:	c2 08 00             	ret    0x8
  52a40a:	cc                   	int3
  52a40b:	cc                   	int3
  52a40c:	cc                   	int3
  52a40d:	cc                   	int3
  52a40e:	cc                   	int3
  52a40f:	cc                   	int3
  52a410:	83 ec 08             	sub    esp,0x8
  52a413:	8d 44 24 00          	lea    eax,[esp+0x0]
  52a417:	56                   	push   esi
  52a418:	57                   	push   edi
  52a419:	8b f1                	mov    esi,ecx
  52a41b:	8b 7c 24 14          	mov    edi,DWORD PTR [esp+0x14]
  52a41f:	6a 00                	push   0x0
  52a421:	6a 00                	push   0x0
  52a423:	8b 0e                	mov    ecx,DWORD PTR [esi]
  52a425:	50                   	push   eax
  52a426:	6a 00                	push   0x0
  52a428:	57                   	push   edi
  52a429:	51                   	push   ecx
  52a42a:	ff 15 8c c5 d0 00    	call   DWORD PTR ds:0xd0c58c
  52a430:	85 c0                	test   eax,eax
  52a432:	75 0c                	jne    0x52a440
  52a434:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  52a438:	5f                   	pop    edi
  52a439:	5e                   	pop    esi
  52a43a:	83 c4 08             	add    esp,0x8
  52a43d:	c2 04 00             	ret    0x4
  52a440:	8d 44 24 0c          	lea    eax,[esp+0xc]
  52a444:	8b 0e                	mov    ecx,DWORD PTR [esi]
  52a446:	50                   	push   eax
  52a447:	57                   	push   edi
  52a448:	51                   	push   ecx
  52a449:	ff 15 80 c5 d0 00    	call   DWORD PTR ds:0xd0c580
  52a44f:	85 c0                	test   eax,eax
  52a451:	75 18                	jne    0x52a46b
  52a453:	8b 44 24 0c          	mov    eax,DWORD PTR [esp+0xc]
  52a457:	50                   	push   eax
  52a458:	ff 15 88 c5 d0 00    	call   DWORD PTR ds:0xd0c588
  52a45e:	b8 fe ff ff ff       	mov    eax,0xfffffffe
  52a463:	5f                   	pop    edi
  52a464:	5e                   	pop    esi
  52a465:	83 c4 08             	add    esp,0x8
  52a468:	c2 04 00             	ret    0x4
  52a46b:	b8 ff ff ff ff       	mov    eax,0xffffffff
  52a470:	5f                   	pop    edi
  52a471:	5e                   	pop    esi
  52a472:	83 c4 08             	add    esp,0x8
  52a475:	c2 04 00             	ret    0x4
  52a478:	cc                   	int3
  52a479:	cc                   	int3
  52a47a:	cc                   	int3
  52a47b:	cc                   	int3
  52a47c:	cc                   	int3
  52a47d:	cc                   	int3
  52a47e:	cc                   	int3
  52a47f:	cc                   	int3
