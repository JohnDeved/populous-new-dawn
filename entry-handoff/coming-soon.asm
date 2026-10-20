
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
