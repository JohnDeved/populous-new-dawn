
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0047a1e6 <.text+0x791e6>:
  47a1e6:	a1 61 c6 89 00       	mov    eax,ds:0x89c661
  47a1eb:	83 e0 02             	and    eax,0x2
  47a1ee:	c1 e8 01             	shr    eax,0x1
  47a1f1:	80 bc 24 14 01 00 00 	cmp    BYTE PTR [esp+0x114],0xa
  47a1f8:	0a 
  47a1f9:	88 44 24 0e          	mov    BYTE PTR [esp+0xe],al
  47a1fd:	75 16                	jne    0x47a215
  47a1ff:	85 f6                	test   esi,esi
  47a201:	74 09                	je     0x47a20c
  47a203:	83 0d 61 c6 89 00 02 	or     DWORD PTR ds:0x89c661,0x2
  47a20a:	eb 10                	jmp    0x47a21c
  47a20c:	83 25 61 c6 89 00 fd 	and    DWORD PTR ds:0x89c661,0xfffffffd
  47a213:	eb 07                	jmp    0x47a21c
  47a215:	83 35 61 c6 89 00 02 	xor    DWORD PTR ds:0x89c661,0x2
  47a21c:	a1 61 c6 89 00       	mov    eax,ds:0x89c661
  47a221:	83 e0 02             	and    eax,0x2
  47a224:	83 f8 01             	cmp    eax,0x1
  47a227:	1a c9                	sbb    cl,cl
  47a229:	fe c1                	inc    cl
  47a22b:	85 c0                	test   eax,eax
  47a22d:	88 4c 24 0d          	mov    BYTE PTR [esp+0xd],cl
  47a231:	0f 84 bb 00 00 00    	je     0x47a2f2
  47a237:	e8 74 12 01 00       	call   0x48b4b0
  47a23c:	6a 50                	push   0x50
  47a23e:	a1 44 2f 97 00       	mov    eax,ds:0x972f44
  47a243:	88 5c 24 13          	mov    BYTE PTR [esp+0x13],bl
  47a247:	50                   	push   eax
  47a248:	80 0d ee 22 89 00 02 	or     BYTE PTR ds:0x8922ee,0x2
  47a24f:	68 97 23 89 00       	push   0x892397
  47a254:	e8 37 23 0e 00       	call   0x55c590
  47a259:	8a 44 24 1b          	mov    al,BYTE PTR [esp+0x1b]
  47a25d:	83 c4 0c             	add    esp,0xc
  47a260:	66 c7 05 35 24 89 00 	mov    WORD PTR ds:0x892435,0x0
  47a267:	00 00 
  47a269:	38 05 f0 c6 89 00    	cmp    BYTE PTR ds:0x89c6f0,al
  47a26f:	75 07                	jne    0x47a278
  47a271:	c6 44 24 0f ff       	mov    BYTE PTR [esp+0xf],0xff
  47a276:	eb 16                	jmp    0x47a28e
  47a278:	80 7c 24 0f ff       	cmp    BYTE PTR [esp+0xf],0xff
  47a27d:	74 0f                	je     0x47a28e
  47a27f:	0f be 44 24 0f       	movsx  eax,BYTE PTR [esp+0xf]
  47a284:	8a 80 ab 56 89 00    	mov    al,BYTE PTR [eax+0x8956ab]
  47a28a:	88 44 24 0f          	mov    BYTE PTR [esp+0xf],al
  47a28e:	8a 44 24 0f          	mov    al,BYTE PTR [esp+0xf]
  47a292:	8a 4c 24 0d          	mov    cl,BYTE PTR [esp+0xd]
  47a296:	a2 39 24 89 00       	mov    ds:0x892439,al
  47a29b:	3a 4c 24 0e          	cmp    cl,BYTE PTR [esp+0xe]
  47a29f:	66 c7 05 95 23 89 00 	mov    WORD PTR ds:0x892395,0x0
  47a2a6:	00 00 
  47a2a8:	0f 84 57 02 00 00    	je     0x47a505
  47a2ae:	6a 01                	push   0x1
  47a2b0:	e8 0b 13 fa ff       	call   0x41b5c0
  47a2b5:	83 c4 04             	add    esp,0x4
  47a2b8:	80 bc 24 14 01 00 00 	cmp    BYTE PTR [esp+0x114],0xa
  47a2bf:	0a 
  47a2c0:	0f 85 3f 02 00 00    	jne    0x47a505
  47a2c6:	0f b7 c3             	movzx  eax,bx
  47a2c9:	8b c8                	mov    ecx,eax
  47a2cb:	8d 14 80             	lea    edx,[eax+eax*4]
  47a2ce:	8d 04 51             	lea    eax,[ecx+edx*2]
  47a2d1:	8d 1c c0             	lea    ebx,[eax+eax*8]
  47a2d4:	8d 14 d9             	lea    edx,[ecx+ebx*8]
  47a2d7:	8d 04 91             	lea    eax,[ecx+edx*4]
  47a2da:	05 c8 d1 89 00       	add    eax,0x89d1c8
  47a2df:	50                   	push   eax
  47a2e0:	e8 cb 5d 03 00       	call   0x4b00b0
  47a2e5:	83 c4 04             	add    esp,0x4
  47a2e8:	5f                   	pop    edi
  47a2e9:	5e                   	pop    esi
  47a2ea:	5b                   	pop    ebx
  47a2eb:	81 c4 04 01 00 00    	add    esp,0x104
  47a2f1:	c3                   	ret
  47a2f2:	e8 e9 11 01 00       	call   0x48b4e0
  47a2f7:	33 c0                	xor    eax,eax
  47a2f9:	8a 4c 24 0d          	mov    cl,BYTE PTR [esp+0xd]
  47a2fd:	66 81 25 ee 22 89 00 	and    WORD PTR ds:0x8922ee,0xfffd
  47a304:	fd ff 
  47a306:	66 a3 97 23 89 00    	mov    ds:0x892397,ax
  47a30c:	3a 4c 24 0e          	cmp    cl,BYTE PTR [esp+0xe]
  47a310:	66 a3 95 23 89 00    	mov    ds:0x892395,ax
  47a316:	0f 84 e9 01 00 00    	je     0x47a505
  47a31c:	50                   	push   eax
  47a31d:	e8 9e 12 fa ff       	call   0x41b5c0
  47a322:	83 c4 04             	add    esp,0x4
  47a325:	5f                   	pop    edi
  47a326:	5e                   	pop    esi
  47a327:	5b                   	pop    ebx
  47a328:	81 c4 04 01 00 00    	add    esp,0x104
  47a32e:	c3                   	ret
