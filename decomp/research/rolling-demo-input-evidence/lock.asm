; Original d3dpoptb.exe instruction bytes. Display-only header is normalized.
; Complete lock window 004af0a0..004af1b2 (end exclusive).
  4af0a0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4af0a4:	83 ec 0c             	sub    esp,0xc
  4af0a7:	80 3d 78 db 5c 00 00 	cmp    BYTE PTR ds:0x5cdb78,0x0
  4af0ae:	53                   	push   ebx
  4af0af:	57                   	push   edi
  4af0b0:	0f 85 e6 00 00 00    	jne    0x4af19c
  4af0b6:	c7 05 b5 c6 89 00 00 	mov    DWORD PTR ds:0x89c6b5,0x0
  4af0bd:	00 00 00 
  4af0c0:	81 25 69 c6 89 00 ff 	and    DWORD PTR ds:0x89c669,0xf7ffffff
  4af0c7:	ff ff f7 
  4af0ca:	09 05 b1 c6 89 00    	or     DWORD PTR ds:0x89c6b1,eax
  4af0d0:	b8 00 00 00 10       	mov    eax,0x10000000
  4af0d5:	85 05 69 c6 89 00    	test   DWORD PTR ds:0x89c669,eax
  4af0db:	0f 85 cb 00 00 00    	jne    0x4af1ac
  4af0e1:	09 05 69 c6 89 00    	or     DWORD PTR ds:0x89c669,eax
  4af0e7:	8d 44 24 08          	lea    eax,[esp+0x8]
  4af0eb:	50                   	push   eax
  4af0ec:	e8 1f 7b 07 00       	call   0x526c10
  4af0f1:	83 c4 04             	add    esp,0x4
  4af0f4:	85 c0                	test   eax,eax
  4af0f6:	75 ef                	jne    0x4af0e7
  4af0f8:	bf 28 e9 98 00       	mov    edi,0x98e928
  4af0fd:	33 c0                	xor    eax,eax
  4af0ff:	b9 40 00 00 00       	mov    ecx,0x40
  4af104:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4af106:	bf 91 45 98 00       	mov    edi,0x984591
  4af10b:	b9 40 00 00 00       	mov    ecx,0x40
  4af110:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4af112:	bf 91 46 98 00       	mov    edi,0x984691
  4af117:	b9 40 00 00 00       	mov    ecx,0x40
  4af11c:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4af11e:	a3 60 45 98 00       	mov    ds:0x984560,eax
  4af123:	a3 68 45 98 00       	mov    ds:0x984568,eax
  4af128:	a3 64 45 98 00       	mov    ds:0x984564,eax
  4af12d:	a3 6c 45 98 00       	mov    ds:0x98456c,eax
  4af132:	a3 74 45 98 00       	mov    ds:0x984574,eax
  4af137:	a3 70 45 98 00       	mov    ds:0x984570,eax
  4af13c:	80 3d e7 c6 89 00 07 	cmp    BYTE PTR ds:0x89c6e7,0x7
  4af143:	75 0a                	jne    0x4af14f
  4af145:	e8 06 a0 00 00       	call   0x4b9150
  4af14a:	e8 81 b4 00 00       	call   0x4ba5d0
  4af14f:	0f be 0d f0 c6 89 00 	movsx  ecx,BYTE PTR ds:0x89c6f0
  4af156:	8b c1                	mov    eax,ecx
  4af158:	8d 14 89             	lea    edx,[ecx+ecx*4]
  4af15b:	8d 0c 50             	lea    ecx,[eax+edx*2]
  4af15e:	8d 1c c9             	lea    ebx,[ecx+ecx*8]
  4af161:	8d 14 d8             	lea    edx,[eax+ebx*8]
  4af164:	8d 0c 90             	lea    ecx,[eax+edx*4]
  4af167:	81 c1 c8 d1 89 00    	add    ecx,0x89d1c8
  4af16d:	51                   	push   ecx
  4af16e:	6a 00                	push   0x0
  4af170:	e8 db b3 fc ff       	call   0x47a550
  4af175:	66 a1 08 e9 98 00    	mov    ax,ds:0x98e908
  4af17b:	83 c4 08             	add    esp,0x8
  4af17e:	66 25 ff f3          	and    ax,0xf3ff
  4af182:	5f                   	pop    edi
  4af183:	66 a3 08 e9 98 00    	mov    ds:0x98e908,ax
  4af189:	5b                   	pop    ebx
  4af18a:	c6 05 10 e9 98 00 00 	mov    BYTE PTR ds:0x98e910,0x0
  4af191:	c6 05 6c ce 89 00 00 	mov    BYTE PTR ds:0x89ce6c,0x0
  4af198:	83 c4 0c             	add    esp,0xc
  4af19b:	c3                   	ret
  4af19c:	81 0d 69 c6 89 00 00 	or     DWORD PTR ds:0x89c669,0x8000000
  4af1a3:	00 00 08 
  4af1a6:	09 05 b5 c6 89 00    	or     DWORD PTR ds:0x89c6b5,eax
  4af1ac:	5f                   	pop    edi
  4af1ad:	5b                   	pop    ebx
  4af1ae:	83 c4 0c             	add    esp,0xc
  4af1b1:	c3                   	ret
