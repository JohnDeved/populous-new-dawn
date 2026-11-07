
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004c3540 <.text+0xc2540>:
  4c3540:	56                   	push   esi
  4c3541:	33 c0                	xor    eax,eax
  4c3543:	a0 b5 5d 89 00       	mov    al,ds:0x895db5
  4c3548:	50                   	push   eax
  4c3549:	6a 00                	push   0x0
  4c354b:	6a 01                	push   0x1
  4c354d:	6a 01                	push   0x1
  4c354f:	68 20 47 5d 00       	push   0x5d4720
  4c3554:	e8 27 97 fd ff       	call   0x49cc80
  4c3559:	83 c4 14             	add    esp,0x14
  4c355c:	e8 0f f1 fe ff       	call   0x4b2670
  4c3561:	8b f0                	mov    esi,eax
  4c3563:	a0 70 a8 d0 00       	mov    al,ds:0xd0a870
  4c3568:	a8 01                	test   al,0x1
  4c356a:	75 0d                	jne    0x4c3579
  4c356c:	0c 01                	or     al,0x1
  4c356e:	89 35 74 a8 d0 00    	mov    DWORD PTR ds:0xd0a874,esi
  4c3574:	a2 70 a8 d0 00       	mov    ds:0xd0a870,al
  4c3579:	39 35 74 a8 d0 00    	cmp    DWORD PTR ds:0xd0a874,esi
  4c357f:	75 09                	jne    0x4c358a
  4c3581:	f6 05 fc 9d 74 00 40 	test   BYTE PTR ds:0x749dfc,0x40
  4c3588:	74 15                	je     0x4c359f
  4c358a:	6a 00                	push   0x0
  4c358c:	6a 00                	push   0x0
  4c358e:	6a 00                	push   0x0
  4c3590:	e8 6b 94 03 00       	call   0x4fca00
  4c3595:	83 25 fc 9d 74 00 bf 	and    DWORD PTR ds:0x749dfc,0xffffffbf
  4c359c:	83 c4 0c             	add    esp,0xc
  4c359f:	89 35 74 a8 d0 00    	mov    DWORD PTR ds:0xd0a874,esi
  4c35a5:	e8 c6 f0 fe ff       	call   0x4b2670
  4c35aa:	8b f0                	mov    esi,eax
  4c35ac:	a0 70 a8 d0 00       	mov    al,ds:0xd0a870
  4c35b1:	a8 01                	test   al,0x1
  4c35b3:	75 0d                	jne    0x4c35c2
  4c35b5:	0c 01                	or     al,0x1
  4c35b7:	89 35 74 a8 d0 00    	mov    DWORD PTR ds:0xd0a874,esi
  4c35bd:	a2 70 a8 d0 00       	mov    ds:0xd0a870,al
  4c35c2:	39 35 74 a8 d0 00    	cmp    DWORD PTR ds:0xd0a874,esi
  4c35c8:	75 09                	jne    0x4c35d3
  4c35ca:	f6 05 fc 9d 74 00 40 	test   BYTE PTR ds:0x749dfc,0x40
  4c35d1:	75 19                	jne    0x4c35ec
  4c35d3:	6a 00                	push   0x0
  4c35d5:	a1 94 9d 74 00       	mov    eax,ds:0x749d94
  4c35da:	6a 00                	push   0x0
  4c35dc:	50                   	push   eax
  4c35dd:	e8 1e 94 03 00       	call   0x4fca00
  4c35e2:	83 0d fc 9d 74 00 40 	or     DWORD PTR ds:0x749dfc,0x40
  4c35e9:	83 c4 0c             	add    esp,0xc
  4c35ec:	89 35 74 a8 d0 00    	mov    DWORD PTR ds:0xd0a874,esi
  4c35f2:	5e                   	pop    esi
  4c35f3:	c3                   	ret
