; Original d3dpoptb.exe instruction bytes. Display-only header is normalized.
; Complete unlock window 004af1c0..004af33b (end exclusive).
  4af1c0:	83 ec 0c             	sub    esp,0xc
  4af1c3:	33 d2                	xor    edx,edx
  4af1c5:	38 15 78 db 5c 00    	cmp    BYTE PTR ds:0x5cdb78,dl
  4af1cb:	53                   	push   ebx
  4af1cc:	57                   	push   edi
  4af1cd:	0f 85 4e 01 00 00    	jne    0x4af321
  4af1d3:	b3 01                	mov    bl,0x1
  4af1d5:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4af1d9:	8b c8                	mov    ecx,eax
  4af1db:	89 15 b5 c6 89 00    	mov    DWORD PTR ds:0x89c6b5,edx
  4af1e1:	f7 d1                	not    ecx
  4af1e3:	81 25 69 c6 89 00 ff 	and    DWORD PTR ds:0x89c669,0xfbffffff
  4af1ea:	ff ff fb 
  4af1ed:	21 0d b1 c6 89 00    	and    DWORD PTR ds:0x89c6b1,ecx
  4af1f3:	a8 01                	test   al,0x1
  4af1f5:	75 0a                	jne    0x4af201
  4af1f7:	39 15 b1 c6 89 00    	cmp    DWORD PTR ds:0x89c6b1,edx
  4af1fd:	74 02                	je     0x4af201
  4af1ff:	32 db                	xor    bl,bl
  4af201:	84 db                	test   bl,bl
  4af203:	0f 84 2c 01 00 00    	je     0x4af335
  4af209:	c7 05 b1 c6 89 00 00 	mov    DWORD PTR ds:0x89c6b1,0x0
  4af210:	00 00 00 
  4af213:	f6 05 6c c6 89 00 10 	test   BYTE PTR ds:0x89c66c,0x10
  4af21a:	0f 84 c1 00 00 00    	je     0x4af2e1
  4af220:	81 25 69 c6 89 00 ff 	and    DWORD PTR ds:0x89c669,0xefffffff
  4af227:	ff ff ef 
  4af22a:	81 25 69 c6 89 00 ff 	and    DWORD PTR ds:0x89c669,0xdfffffff
  4af231:	ff ff df 
  4af234:	8d 44 24 08          	lea    eax,[esp+0x8]
  4af238:	50                   	push   eax
  4af239:	e8 d2 79 07 00       	call   0x526c10
  4af23e:	83 c4 04             	add    esp,0x4
  4af241:	85 c0                	test   eax,eax
  4af243:	75 ef                	jne    0x4af234
  4af245:	bf 28 e9 98 00       	mov    edi,0x98e928
  4af24a:	33 c0                	xor    eax,eax
  4af24c:	b9 40 00 00 00       	mov    ecx,0x40
  4af251:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4af253:	bf 91 45 98 00       	mov    edi,0x984591
  4af258:	b9 40 00 00 00       	mov    ecx,0x40
  4af25d:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4af25f:	bf 91 46 98 00       	mov    edi,0x984691
  4af264:	b9 40 00 00 00       	mov    ecx,0x40
  4af269:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4af26b:	a3 60 45 98 00       	mov    ds:0x984560,eax
  4af270:	a3 68 45 98 00       	mov    ds:0x984568,eax
  4af275:	a3 64 45 98 00       	mov    ds:0x984564,eax
  4af27a:	a3 6c 45 98 00       	mov    ds:0x98456c,eax
  4af27f:	a3 74 45 98 00       	mov    ds:0x984574,eax
  4af284:	a3 70 45 98 00       	mov    ds:0x984570,eax
  4af289:	80 3d e7 c6 89 00 07 	cmp    BYTE PTR ds:0x89c6e7,0x7
  4af290:	75 0a                	jne    0x4af29c
  4af292:	e8 b9 9e 00 00       	call   0x4b9150
  4af297:	e8 34 b3 00 00       	call   0x4ba5d0
  4af29c:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4af2a3:	8b c8                	mov    ecx,eax
  4af2a5:	8d 14 80             	lea    edx,[eax+eax*4]
  4af2a8:	8d 04 51             	lea    eax,[ecx+edx*2]
  4af2ab:	8d 1c c0             	lea    ebx,[eax+eax*8]
  4af2ae:	8d 14 d9             	lea    edx,[ecx+ebx*8]
  4af2b1:	33 db                	xor    ebx,ebx
  4af2b3:	8d 04 91             	lea    eax,[ecx+edx*4]
  4af2b6:	05 c8 d1 89 00       	add    eax,0x89d1c8
  4af2bb:	50                   	push   eax
  4af2bc:	53                   	push   ebx
  4af2bd:	e8 8e b2 fc ff       	call   0x47a550
  4af2c2:	66 a1 08 e9 98 00    	mov    ax,ds:0x98e908
  4af2c8:	83 c4 08             	add    esp,0x8
  4af2cb:	66 25 ff f3          	and    ax,0xf3ff
  4af2cf:	88 1d 10 e9 98 00    	mov    BYTE PTR ds:0x98e910,bl
  4af2d5:	66 a3 08 e9 98 00    	mov    ds:0x98e908,ax
  4af2db:	88 1d 6c ce 89 00    	mov    BYTE PTR ds:0x89ce6c,bl
  4af2e1:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4af2e8:	8b c8                	mov    ecx,eax
  4af2ea:	8d 14 80             	lea    edx,[eax+eax*4]
  4af2ed:	8d 04 51             	lea    eax,[ecx+edx*2]
  4af2f0:	8d 1c c0             	lea    ebx,[eax+eax*8]
  4af2f3:	8d 14 d9             	lea    edx,[ecx+ebx*8]
  4af2f6:	8d 04 91             	lea    eax,[ecx+edx*4]
  4af2f9:	83 b8 f5 da 89 00 00 	cmp    DWORD PTR [eax+0x89daf5],0x0
  4af300:	7f 09                	jg     0x4af30b
  4af302:	83 b8 f9 da 89 00 00 	cmp    DWORD PTR [eax+0x89daf9],0x0
  4af309:	7e 2a                	jle    0x4af335
  4af30b:	05 c8 d1 89 00       	add    eax,0x89d1c8
  4af310:	50                   	push   eax
  4af311:	6a 0c                	push   0xc
  4af313:	e8 38 b2 fc ff       	call   0x47a550
  4af318:	83 c4 08             	add    esp,0x8
  4af31b:	5f                   	pop    edi
  4af31c:	5b                   	pop    ebx
  4af31d:	83 c4 0c             	add    esp,0xc
  4af320:	c3                   	ret
  4af321:	81 0d 69 c6 89 00 00 	or     DWORD PTR ds:0x89c669,0x4000000
  4af328:	00 00 04 
  4af32b:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4af32f:	09 05 b5 c6 89 00    	or     DWORD PTR ds:0x89c6b5,eax
  4af335:	5f                   	pop    edi
  4af336:	5b                   	pop    ebx
  4af337:	83 c4 0c             	add    esp,0xc
  4af33a:	c3                   	ret
