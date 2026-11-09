
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0055d550 <.text+0x15c550>:
  55d550:	a1 70 23 5e 00       	mov    eax,ds:0x5e2370
  55d555:	85 c0                	test   eax,eax
  55d557:	74 02                	je     0x55d55b
  55d559:	ff d0                	call   eax
  55d55b:	68 d0 81 59 00       	push   0x5981d0
  55d560:	68 c0 81 59 00       	push   0x5981c0
  55d565:	e8 36 01 00 00       	call   0x55d6a0
  55d56a:	83 c4 08             	add    esp,0x8
  55d56d:	68 bc 81 59 00       	push   0x5981bc
  55d572:	68 00 80 59 00       	push   0x598000
  55d577:	e8 24 01 00 00       	call   0x55d6a0
  55d57c:	83 c4 08             	add    esp,0x8
  55d57f:	c3                   	ret

/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0055d6a0 <.text+0x15c6a0>:
  55d6a0:	56                   	push   esi
  55d6a1:	57                   	push   edi
  55d6a2:	8b 7c 24 10          	mov    edi,DWORD PTR [esp+0x10]
  55d6a6:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  55d6aa:	3b fe                	cmp    edi,esi
  55d6ac:	76 0f                	jbe    0x55d6bd
  55d6ae:	8b 06                	mov    eax,DWORD PTR [esi]
  55d6b0:	85 c0                	test   eax,eax
  55d6b2:	74 02                	je     0x55d6b6
  55d6b4:	ff d0                	call   eax
  55d6b6:	83 c6 04             	add    esi,0x4
  55d6b9:	3b fe                	cmp    edi,esi
  55d6bb:	77 f1                	ja     0x55d6ae
  55d6bd:	5f                   	pop    edi
  55d6be:	5e                   	pop    esi
  55d6bf:	c3                   	ret

/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0055d780 <.text+0x15c780>:
  55d780:	ff 83 c4 04 e8 c7    	inc    DWORD PTR [ebx-0x3817fb3c]
  55d786:	79 00                	jns    0x55d788
  55d788:	00 e8                	add    al,ch
  55d78a:	d2 78 00             	sar    BYTE PTR [eax+0x0],cl
  55d78d:	00 e8                	add    al,ch
  55d78f:	bd fd ff ff 8b       	mov    ebp,0x8bfffffd
  55d794:	35 a4 b9 d0 00       	xor    eax,0xd0b9a4
  55d799:	8a                   	.byte 0x8a
