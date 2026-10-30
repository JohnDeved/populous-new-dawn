
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00417310 <.text+0x16310>:
  417310:	0f be 0d ee c6 89 00 	movsx  ecx,BYTE PTR ds:0x89c6ee
  417317:	0f be 05 ec c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6ec
  41731e:	53                   	push   ebx
  41731f:	8d 0c 89             	lea    ecx,[ecx+ecx*4]
  417322:	56                   	push   esi
  417323:	03 c8                	add    ecx,eax
  417325:	57                   	push   edi
  417326:	8b c1                	mov    eax,ecx
  417328:	8d 14 c9             	lea    edx,[ecx+ecx*8]
  41732b:	bf 04 f0 88 00       	mov    edi,0x88f004
  417330:	8d 0c 50             	lea    ecx,[eax+edx*2]
  417333:	8d 0c 89             	lea    ecx,[ecx+ecx*4]
  417336:	2b c8                	sub    ecx,eax
  417338:	8d b1 c0 f0 88 00    	lea    esi,[ecx+0x88f0c0]
  41733e:	b9 17 00 00 00       	mov    ecx,0x17
  417343:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  417345:	66 a5                	movs   WORD PTR es:[edi],WORD PTR ds:[esi]
  417347:	a1 0c f0 88 00       	mov    eax,ds:0x88f00c
  41734c:	50                   	push   eax
  41734d:	e8 2e 06 00 00       	call   0x417980
  417352:	66 0f b6 3d c3 c6 89 	movzx  di,BYTE PTR ds:0x89c6c3
  417359:	00 
  41735a:	0f b7 cf             	movzx  ecx,di
  41735d:	83 c4 04             	add    esp,0x4
  417360:	8d 34 cd 00 00 00 00 	lea    esi,[ecx*8+0x0]
  417367:	f6 05 61 c6 89 00 04 	test   BYTE PTR ds:0x89c661,0x4
  41736e:	75 10                	jne    0x417380
  417370:	f6 05 66 c6 89 00 02 	test   BYTE PTR ds:0x89c666,0x2
  417377:	75 07                	jne    0x417380
  417379:	e8 02 48 03 00       	call   0x44bb80
  41737e:	eb 02                	jmp    0x417382
  417380:	33 c0                	xor    eax,eax
  417382:	0f bf 15 cf c6 89 00 	movsx  edx,WORD PTR ds:0x89c6cf
  417389:	2b d0                	sub    edx,eax
  41738b:	8d 0c 75 00 00 00 00 	lea    ecx,[esi*2+0x0]
  417392:	3b d1                	cmp    edx,ecx
  417394:	7e 44                	jle    0x4173da
  417396:	0f bf 1d d1 c6 89 00 	movsx  ebx,WORD PTR ds:0x89c6d1
  41739d:	3b d9                	cmp    ebx,ecx
  41739f:	7e 39                	jle    0x4173da
  4173a1:	66 03 c6             	add    ax,si
  4173a4:	66 8b 0d d1 c6 89 00 	mov    cx,WORD PTR ds:0x89c6d1
  4173ab:	66 89 3d c3 c6 89 00 	mov    WORD PTR ds:0x89c6c3,di
  4173b2:	66 a3 26 f0 88 00    	mov    ds:0x88f026,ax
  4173b8:	8d 04 75 00 00 00 00 	lea    eax,[esi*2+0x0]
  4173bf:	66 2b d0             	sub    dx,ax
  4173c2:	66 2b c8             	sub    cx,ax
  4173c5:	66 89 35 28 f0 88 00 	mov    WORD PTR ds:0x88f028,si
  4173cc:	66 89 15 2a f0 88 00 	mov    WORD PTR ds:0x88f02a,dx
  4173d3:	66 89 0d 2c f0 88 00 	mov    WORD PTR ds:0x88f02c,cx
  4173da:	0f                   	.byte 0xf
  4173db:	be 05 58 f0 88       	mov    esi,0x88f05805
