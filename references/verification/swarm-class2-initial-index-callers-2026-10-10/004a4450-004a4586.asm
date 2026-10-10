
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004a4450 <.text+0xa3450>:
  4a4450:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  4a4456:	55                   	push   ebp
  4a4457:	8b ec                	mov    ebp,esp
  4a4459:	6a ff                	push   0xffffffff
  4a445b:	68 24 49 4a 00       	push   0x4a4924
  4a4460:	50                   	push   eax
  4a4461:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  4a4468:	81 ec 14 01 00 00    	sub    esp,0x114
  4a446e:	53                   	push   ebx
  4a446f:	56                   	push   esi
  4a4470:	57                   	push   edi
  4a4471:	e8 2a fe ff ff       	call   0x4a42a0
  4a4476:	85 c0                	test   eax,eax
  4a4478:	0f 84 90 04 00 00    	je     0x4a490e
  4a447e:	bf 9c da 5c 00       	mov    edi,0x5cda9c
  4a4483:	e8 98 b7 05 00       	call   0x4ffc20
  4a4488:	c6 05 50 c6 89 00 02 	mov    BYTE PTR ds:0x89c650,0x2
  4a448f:	81 0d 65 c6 89 00 00 	or     DWORD PTR ds:0x89c665,0x100
  4a4496:	01 00 00 
  4a4499:	b9 ff ff ff ff       	mov    ecx,0xffffffff
  4a449e:	2b c0                	sub    eax,eax
  4a44a0:	f2 ae                	repnz scas al,BYTE PTR es:[edi]
  4a44a2:	f7 d1                	not    ecx
  4a44a4:	2b f9                	sub    edi,ecx
  4a44a6:	8b c1                	mov    eax,ecx
  4a44a8:	c1 e9 02             	shr    ecx,0x2
  4a44ab:	8b f7                	mov    esi,edi
  4a44ad:	bf 8e c4 89 00       	mov    edi,0x89c48e
  4a44b2:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  4a44b4:	8b c8                	mov    ecx,eax
  4a44b6:	6a 01                	push   0x1
  4a44b8:	83 e1 03             	and    ecx,0x3
  4a44bb:	f3 a4                	rep movs BYTE PTR es:[edi],BYTE PTR ds:[esi]
  4a44bd:	e8 4e 0e 00 00       	call   0x4a5310
  4a44c2:	83 c4 04             	add    esp,0x4
  4a44c5:	e8 16 15 00 00       	call   0x4a59e0
  4a44ca:	e8 11 b8 05 00       	call   0x4ffce0
  4a44cf:	80 3d f1 c6 89 00 00 	cmp    BYTE PTR ds:0x89c6f1,0x0
  4a44d6:	74 11                	je     0x4a44e9
  4a44d8:	66 0f b6 05 f1 c6 89 	movzx  ax,BYTE PTR ds:0x89c6f1
  4a44df:	00 
  4a44e0:	50                   	push   eax
  4a44e1:	e8 fa c4 05 00       	call   0x5009e0
  4a44e6:	83 c4 04             	add    esp,0x4
  4a44e9:	e8 52 64 ff ff       	call   0x49a940
  4a44ee:	e8 dd 64 ff ff       	call   0x49a9d0
  4a44f3:	a1 6a bc 89 00       	mov    eax,ds:0x89bc6a
  4a44f8:	50                   	push   eax
  4a44f9:	e8 f2 ea fe ff       	call   0x492ff0
  4a44fe:	83 c4 04             	add    esp,0x4
  4a4501:	84 c0                	test   al,al
  4a4503:	75 0a                	jne    0x4a450f
  4a4505:	6a 1c                	push   0x1c
  4a4507:	e8 d4 c4 05 00       	call   0x5009e0
  4a450c:	83 c4 04             	add    esp,0x4
  4a450f:	a1 d8 2f 97 00       	mov    eax,ds:0x972fd8
  4a4514:	8d 8d e0 fe ff ff    	lea    ecx,[ebp-0x120]
  4a451a:	50                   	push   eax
  4a451b:	51                   	push   ecx
  4a451c:	e8 6f 61 ff ff       	call   0x49a690
  4a4521:	83 c4 08             	add    esp,0x8
  4a4524:	8d 8d e0 fe ff ff    	lea    ecx,[ebp-0x120]
  4a452a:	51                   	push   ecx
  4a452b:	e8 80 62 08 00       	call   0x52a7b0
  4a4530:	83 c4 04             	add    esp,0x4
  4a4533:	8b 0d 24 30 97 00    	mov    ecx,DWORD PTR ds:0x973024
  4a4539:	51                   	push   ecx
  4a453a:	68 8e c4 89 00       	push   0x89c48e
  4a453f:	e8 4c 61 ff ff       	call   0x49a690
  4a4544:	83 c4 08             	add    esp,0x8
  4a4547:	e8 14 aa f8 ff       	call   0x42ef60
  4a454c:	e8 3f ac f8 ff       	call   0x42f190
  4a4551:	e8 6a f5 ff ff       	call   0x4a3ac0
  4a4556:	83 f8 01             	cmp    eax,0x1
  4a4559:	75 0f                	jne    0x4a456a
  4a455b:	e8 70 ea fe ff       	call   0x492fd0
  4a4560:	e8 5b 95 05 00       	call   0x4fdac0
  4a4565:	e9 a4 03 00 00       	jmp    0x4a490e
  4a456a:	83 3d 6a bc 89 00 0b 	cmp    DWORD PTR ds:0x89bc6a,0xb
  4a4571:	75 07                	jne    0x4a457a
  4a4573:	c6 05 3c 3b 5a 00 33 	mov    BYTE PTR ds:0x5a3b3c,0x33
  4a457a:	e8 f1 09 00 00       	call   0x4a4f70
  4a457f:	80 3d f2 c6 89 00 00 	cmp    BYTE PTR ds:0x89c6f2,0x0
