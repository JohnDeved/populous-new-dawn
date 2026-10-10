
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0042b286 <.text+0x2a286>:
  42b286:	f6 44 24 1c 01       	test   BYTE PTR [esp+0x1c],0x1
  42b28b:	74 09                	je     0x42b296
  42b28d:	83 0d a8 5d 89 00 02 	or     DWORD PTR ds:0x895da8,0x2
  42b294:	eb 07                	jmp    0x42b29d
  42b296:	83 25 a8 5d 89 00 fd 	and    DWORD PTR ds:0x895da8,0xfffffffd
  42b29d:	6a 00                	push   0x0
  42b29f:	e8 6c 86 01 00       	call   0x443910
  42b2a4:	83 c4 04             	add    esp,0x4
  42b2a7:	e8 44 16 00 00       	call   0x42c8f0
  42b2ac:	c7 05 7e aa 96 00 00 	mov    DWORD PTR ds:0x96aa7e,0x0
  42b2b3:	00 00 00 
  42b2b6:	e8 85 87 06 00       	call   0x493a40
  42b2bb:	83 25 7c d1 89 00 fb 	and    DWORD PTR ds:0x89d17c,0xfffffffb
  42b2c2:	83 25 7c d1 89 00 f7 	and    DWORD PTR ds:0x89d17c,0xfffffff7
  42b2c9:	83 25 7c d1 89 00 ef 	and    DWORD PTR ds:0x89d17c,0xffffffef
  42b2d0:	bf 9d 9e 96 00       	mov    edi,0x969e9d
  42b2d5:	33 c0                	xor    eax,eax
  42b2d7:	83 25 7c d1 89 00 fd 	and    DWORD PTR ds:0x89d17c,0xfffffffd
  42b2de:	83 25 7c d1 89 00 df 	and    DWORD PTR ds:0x89d17c,0xffffffdf
  42b2e5:	83 25 7c d1 89 00 bf 	and    DWORD PTR ds:0x89d17c,0xffffffbf
  42b2ec:	81 25 7c d1 89 00 7f 	and    DWORD PTR ds:0x89d17c,0xffffff7f
  42b2f3:	ff ff ff 
  42b2f6:	81 25 7c d1 89 00 ff 	and    DWORD PTR ds:0x89d17c,0xfffffeff
  42b2fd:	fe ff ff 
  42b300:	b9 c8 00 00 00       	mov    ecx,0xc8
  42b305:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  42b307:	66 ab                	stos   WORD PTR es:[edi],ax
  42b309:	e8 a2 58 00 00       	call   0x430bb0
  42b30e:	e8 8d db 01 00       	call   0x448ea0
  42b313:	6a ff                	push   0xffffffff
  42b315:	6a 00                	push   0x0
  42b317:	6a 08                	push   0x8
  42b319:	e8 e2 eb 04 00       	call   0x479f00
  42b31e:	83 c4 0c             	add    esp,0xc
  42b321:	66 0f be 05 f0 c6 89 	movsx  ax,BYTE PTR ds:0x89c6f0
  42b328:	00 
  42b329:	6a 00                	push   0x0
  42b32b:	50                   	push   eax
  42b32c:	6a 0a                	push   0xa
  42b32e:	e8 cd eb 04 00       	call   0x479f00
  42b333:	83 c4 0c             	add    esp,0xc
  42b336:	6a 01                	push   0x1
  42b338:	e8 83 3e 08 00       	call   0x4af1c0
  42b33d:	83 c4 04             	add    esp,0x4
  42b340:	66 83 3d dd c6 89 00 	cmp    WORD PTR ds:0x89c6dd,0x0
  42b347:	00 
  42b348:	0f 84 8d 00 00 00    	je     0x42b3db
