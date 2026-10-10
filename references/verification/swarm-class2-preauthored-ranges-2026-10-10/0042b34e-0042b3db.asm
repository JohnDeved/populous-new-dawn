
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0042b34e <.text+0x2a34e>:
  42b34e:	0f be 05 3d ce 89 00 	movsx  eax,BYTE PTR ds:0x89ce3d
  42b355:	8b 5c 24 14          	mov    ebx,DWORD PTR [esp+0x14]
  42b359:	3b c3                	cmp    eax,ebx
  42b35b:	74 56                	je     0x42b3b3
  42b35d:	53                   	push   ebx
  42b35e:	88 1d 3d ce 89 00    	mov    BYTE PTR ds:0x89ce3d,bl
  42b364:	88 1d d0 ea 96 00    	mov    BYTE PTR ds:0x96ead0,bl
  42b36a:	e8 d1 ed ff ff       	call   0x42a140
  42b36f:	83 c4 04             	add    esp,0x4
  42b372:	80 3d a8 45 5d 00 02 	cmp    BYTE PTR ds:0x5d45a8,0x2
  42b379:	74 09                	je     0x42b384
  42b37b:	80 3d a8 45 5d 00 03 	cmp    BYTE PTR ds:0x5d45a8,0x3
  42b382:	75 2f                	jne    0x42b3b3
  42b384:	e8 e7 e8 ff ff       	call   0x429c70
  42b389:	80 3d 3d ce 89 00 36 	cmp    BYTE PTR ds:0x89ce3d,0x36
  42b390:	75 07                	jne    0x42b399
  42b392:	e8 d9 1d 09 00       	call   0x4bd170
  42b397:	eb 05                	jmp    0x42b39e
  42b399:	e8 92 1e 09 00       	call   0x4bd230
  42b39e:	80 3d f3 c6 89 00 00 	cmp    BYTE PTR ds:0x89c6f3,0x0
  42b3a5:	74 07                	je     0x42b3ae
  42b3a7:	83 0d 69 c6 89 00 01 	or     DWORD PTR ds:0x89c669,0x1
  42b3ae:	e8 6d af 08 00       	call   0x4b6320
  42b3b3:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  42b3b7:	50                   	push   eax
  42b3b8:	e8 b3 12 fe ff       	call   0x40c670
  42b3bd:	83 c4 04             	add    esp,0x4
  42b3c0:	0f bf 05 dd c6 89 00 	movsx  eax,WORD PTR ds:0x89c6dd
  42b3c7:	50                   	push   eax
  42b3c8:	e8 43 96 05 00       	call   0x484a10
  42b3cd:	83 c4 04             	add    esp,0x4
  42b3d0:	85 c0                	test   eax,eax
  42b3d2:	74 0b                	je     0x42b3df
  42b3d4:	c6 44 24 0f 01       	mov    BYTE PTR [esp+0xf],0x1
  42b3d9:	eb 04                	jmp    0x42b3df
