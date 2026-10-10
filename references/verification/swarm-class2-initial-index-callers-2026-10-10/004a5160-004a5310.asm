
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004a5160 <.text+0xa4160>:
  4a5160:	e8 8b 54 ff ff       	call   0x49a5f0
  4a5165:	e8 36 de f7 ff       	call   0x422fa0
  4a516a:	e8 11 77 f6 ff       	call   0x40c880
  4a516f:	e8 2c 70 ff ff       	call   0x49c1a0
  4a5174:	e8 87 4a f8 ff       	call   0x429c00
  4a5179:	e8 22 6d f8 ff       	call   0x42bea0
  4a517e:	e8 8d 67 f8 ff       	call   0x42b910
  4a5183:	e8 68 66 f8 ff       	call   0x42b7f0
  4a5188:	e8 13 70 f8 ff       	call   0x42c1a0
  4a518d:	e8 2e 70 f8 ff       	call   0x42c1c0
  4a5192:	e8 79 70 f8 ff       	call   0x42c210
  4a5197:	e8 64 48 f8 ff       	call   0x429a00
  4a519c:	e8 2f 49 f8 ff       	call   0x429ad0
  4a51a1:	e8 3a d3 01 00       	call   0x4c24e0
  4a51a6:	e8 e5 75 f8 ff       	call   0x42c790
  4a51ab:	e8 e0 35 fb ff       	call   0x458790
  4a51b0:	e8 1b be f6 ff       	call   0x410fd0
  4a51b5:	85 f6                	test   esi,esi
  4a51b7:	74 07                	je     0x4a51c0
  4a51b9:	56                   	push   esi
  4a51ba:	ff 15 e4 c8 d0 00    	call   DWORD PTR ds:0xd0c8e4
  4a51c0:	e8 1b b1 05 00       	call   0x5002e0
  4a51c5:	e8 86 67 fe ff       	call   0x48b950
  4a51ca:	80 3d aa 56 89 00 00 	cmp    BYTE PTR ds:0x8956aa,0x0
  4a51d1:	75 05                	jne    0x4a51d8
  4a51d3:	e8 98 df 07 00       	call   0x523170
  4a51d8:	e8 23 39 fb ff       	call   0x458b00
  4a51dd:	0f bf 05 d1 c6 89 00 	movsx  eax,WORD PTR ds:0x89c6d1
  4a51e4:	0f bf 0d cf c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6cf
  4a51eb:	50                   	push   eax
  4a51ec:	51                   	push   ecx
  4a51ed:	e8 fe 1f f7 ff       	call   0x4171f0
  4a51f2:	83 c4 08             	add    esp,0x8
  4a51f5:	a2 ee c6 89 00       	mov    ds:0x89c6ee,al
  4a51fa:	e8 11 21 f7 ff       	call   0x417310
  4a51ff:	e8 bc 6c f8 ff       	call   0x42bec0
  4a5204:	e8 87 4d f8 ff       	call   0x429f90
  4a5209:	8a 0d f0 c6 89 00    	mov    cl,BYTE PTR ds:0x89c6f0
  4a520f:	51                   	push   ecx
  4a5210:	e8 4b 44 ff ff       	call   0x499660
  4a5215:	83 c4 04             	add    esp,0x4
  4a5218:	e8 83 49 f8 ff       	call   0x429ba0
  4a521d:	e8 ee 20 f7 ff       	call   0x417310
  4a5222:	e8 09 67 f8 ff       	call   0x42b930
  4a5227:	e8 14 67 f8 ff       	call   0x42b940
  4a522c:	e8 cf 7b f7 ff       	call   0x41ce00
  4a5231:	e8 7a b7 05 00       	call   0x5009b0
  4a5236:	e8 45 50 fa ff       	call   0x44a280
  4a523b:	e8 80 74 f8 ff       	call   0x42c6c0
  4a5240:	0f be 0d f0 c6 89 00 	movsx  ecx,BYTE PTR ds:0x89c6f0
  4a5247:	8b c1                	mov    eax,ecx
  4a5249:	8d 14 89             	lea    edx,[ecx+ecx*4]
  4a524c:	8d 0c 50             	lea    ecx,[eax+edx*2]
  4a524f:	8d 34 c9             	lea    esi,[ecx+ecx*8]
  4a5252:	8d 14 f0             	lea    edx,[eax+esi*8]
  4a5255:	8d 0c 90             	lea    ecx,[eax+edx*4]
  4a5258:	66 a1 c1 c6 89 00    	mov    ax,ds:0x89c6c1
  4a525e:	81 c1 c8 d1 89 00    	add    ecx,0x89d1c8
  4a5264:	51                   	push   ecx
  4a5265:	50                   	push   eax
  4a5266:	e8 c5 56 fd ff       	call   0x47a930
  4a526b:	83 c4 08             	add    esp,0x8
  4a526e:	80 3d aa 56 89 00 00 	cmp    BYTE PTR ds:0x8956aa,0x0
  4a5275:	6a 00                	push   0x0
  4a5277:	6a 01                	push   0x1
  4a5279:	6a 07                	push   0x7
  4a527b:	6a 07                	push   0x7
  4a527d:	75 0a                	jne    0x4a5289
  4a527f:	e8 7c d8 f9 ff       	call   0x442b00
  4a5284:	83 c4 10             	add    esp,0x10
  4a5287:	eb 4b                	jmp    0x4a52d4
  4a5289:	bf fe 4c 89 00       	mov    edi,0x894cfe
  4a528e:	e8 6d d8 f9 ff       	call   0x442b00
  4a5293:	83 c4 10             	add    esp,0x10
  4a5296:	33 c0                	xor    eax,eax
  4a5298:	b9 2a 00 00 00       	mov    ecx,0x2a
  4a529d:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4a529f:	be bf 56 89 00       	mov    esi,0x8956bf
  4a52a4:	a3 26 4e 89 00       	mov    ds:0x894e26,eax
  4a52a9:	c7 05 b7 56 89 00 01 	mov    DWORD PTR ds:0x8956b7,0x1010101
  4a52b0:	01 01 01 
  4a52b3:	e8 f8 0c f7 ff       	call   0x415fb0
  4a52b8:	8b 3d 8c c9 d0 00    	mov    edi,DWORD PTR ds:0xd0c98c
  4a52be:	8b 0d 38 9c 59 00    	mov    ecx,DWORD PTR ds:0x599c38
  4a52c4:	83 c6 04             	add    esi,0x4
  4a52c7:	ff d7                	call   edi
  4a52c9:	89 46 fc             	mov    DWORD PTR [esi-0x4],eax
  4a52cc:	81 fe cf 56 89 00    	cmp    esi,0x8956cf
  4a52d2:	72 ea                	jb     0x4a52be
  4a52d4:	83 0d 7c d1 89 00 01 	or     DWORD PTR ds:0x89d17c,0x1
  4a52db:	81 0d 39 b7 89 00 00 	or     DWORD PTR ds:0x89b739,0x100
  4a52e2:	01 00 00 
  4a52e5:	81 0d 65 c6 89 00 00 	or     DWORD PTR ds:0x89c665,0x80000
  4a52ec:	00 08 00 
  4a52ef:	e8 dc ac f7 ff       	call   0x41ffd0
  4a52f4:	e8 47 f3 f5 ff       	call   0x404640
  4a52f9:	b0 01                	mov    al,0x1
  4a52fb:	5f                   	pop    edi
  4a52fc:	5e                   	pop    esi
  4a52fd:	83 c4 5c             	add    esp,0x5c
  4a5300:	c3                   	ret
  4a5301:	cc                   	int3
  4a5302:	cc                   	int3
  4a5303:	cc                   	int3
  4a5304:	cc                   	int3
  4a5305:	cc                   	int3
  4a5306:	cc                   	int3
  4a5307:	cc                   	int3
  4a5308:	cc                   	int3
  4a5309:	cc                   	int3
  4a530a:	cc                   	int3
  4a530b:	cc                   	int3
  4a530c:	cc                   	int3
  4a530d:	cc                   	int3
  4a530e:	cc                   	int3
  4a530f:	cc                   	int3
