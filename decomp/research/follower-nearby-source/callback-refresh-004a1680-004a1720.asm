
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004a1680 <.text+0xa0680>:
  4a1680:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4a1687:	8d 14 80             	lea    edx,[eax+eax*4]
  4a168a:	8b c8                	mov    ecx,eax
  4a168c:	6a 01                	push   0x1
  4a168e:	8d 04 51             	lea    eax,[ecx+edx*2]
  4a1691:	8d 14 c0             	lea    edx,[eax+eax*8]
  4a1694:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4a1697:	f6 84 81 05 db 89 00 	test   BYTE PTR [ecx+eax*4+0x89db05],0x80
  4a169e:	80 
  4a169f:	74 21                	je     0x4a16c2
  4a16a1:	6a 6f                	push   0x6f
  4a16a3:	6a 00                	push   0x0
  4a16a5:	e8 a6 89 fe ff       	call   0x48a050
  4a16aa:	83 c4 0c             	add    esp,0xc
  4a16ad:	a0 f0 c6 89 00       	mov    al,ds:0x89c6f0
  4a16b2:	6a 00                	push   0x0
  4a16b4:	6a 00                	push   0x0
  4a16b6:	6a 5f                	push   0x5f
  4a16b8:	50                   	push   eax
  4a16b9:	e8 32 86 fd ff       	call   0x479cf0
  4a16be:	83 c4 10             	add    esp,0x10
  4a16c1:	c3                   	ret
  4a16c2:	6a 6e                	push   0x6e
  4a16c4:	6a 00                	push   0x0
  4a16c6:	e8 85 89 fe ff       	call   0x48a050
  4a16cb:	83 c4 0c             	add    esp,0xc
  4a16ce:	a0 f0 c6 89 00       	mov    al,ds:0x89c6f0
  4a16d3:	6a 00                	push   0x0
  4a16d5:	6a 01                	push   0x1
  4a16d7:	6a 5f                	push   0x5f
  4a16d9:	50                   	push   eax
  4a16da:	e8 11 86 fd ff       	call   0x479cf0
  4a16df:	83 c4 10             	add    esp,0x10
  4a16e2:	c3                   	ret
  4a16e3:	cc                   	int3
  4a16e4:	cc                   	int3
  4a16e5:	cc                   	int3
  4a16e6:	cc                   	int3
  4a16e7:	cc                   	int3
  4a16e8:	cc                   	int3
  4a16e9:	cc                   	int3
  4a16ea:	cc                   	int3
  4a16eb:	cc                   	int3
  4a16ec:	cc                   	int3
  4a16ed:	cc                   	int3
  4a16ee:	cc                   	int3
  4a16ef:	cc                   	int3
  4a16f0:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4a16f7:	8b c8                	mov    ecx,eax
  4a16f9:	8d 14 80             	lea    edx,[eax+eax*4]
  4a16fc:	8d 04 51             	lea    eax,[ecx+edx*2]
  4a16ff:	8d 14 c0             	lea    edx,[eax+eax*8]
  4a1702:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4a1705:	8b 8c 81 05 db 89 00 	mov    ecx,DWORD PTR [ecx+eax*4+0x89db05]
  4a170c:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4a1710:	80 e1 80             	and    cl,0x80
  4a1713:	88 48 2a             	mov    BYTE PTR [eax+0x2a],cl
  4a1716:	c3                   	ret
  4a1717:	cc                   	int3
  4a1718:	cc                   	int3
  4a1719:	cc                   	int3
  4a171a:	cc                   	int3
  4a171b:	cc                   	int3
  4a171c:	cc                   	int3
  4a171d:	cc                   	int3
  4a171e:	cc                   	int3
  4a171f:	cc                   	int3
