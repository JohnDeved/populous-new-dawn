  448ec3:	bf d2 9b 96 00       	mov    edi,0x969bd2
  448ec8:	b9 6f 00 00 00       	mov    ecx,0x6f
  448ecd:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  448ecf:	80 0d d7 9b 96 00 10 	or     BYTE PTR ds:0x969bd7,0x10
  448ed6:	5f                   	pop    edi
  448ed7:	c3                   	ret
  448ed8:	cc                   	int3
  448ed9:	cc                   	int3
--
  448ef0:	e8 9b 40 05 00       	call   0x49cf90
  448ef5:	c6 05 d2 9b 96 00 00 	mov    BYTE PTR ds:0x969bd2,0x0
  448efc:	c6 05 d4 9b 96 00 06 	mov    BYTE PTR ds:0x969bd4,0x6
  448f03:	80 0d d7 9b 96 00 01 	or     BYTE PTR ds:0x969bd7,0x1
  448f0a:	80 25 d7 9b 96 00 bf 	and    BYTE PTR ds:0x969bd7,0xbf
  448f11:	83 c4 04             	add    esp,0x4
  448f14:	80 25 d7 9b 96 00 7f 	and    BYTE PTR ds:0x969bd7,0x7f
  448f1b:	6a 40                	push   0x40
  448f1d:	e8 7e 61 06 00       	call   0x4af0a0
  448f22:	83 c4 04             	add    esp,0x4
  448f25:	83 25 69 c6 89 00 df 	and    DWORD PTR ds:0x89c669,0xffffffdf
--
  448f9d:	cc                   	int3
  448f9e:	cc                   	int3
  448f9f:	cc                   	int3
  448fa0:	f6 05 d7 9b 96 00 01 	test   BYTE PTR ds:0x969bd7,0x1
  448fa7:	74 50                	je     0x448ff9
  448fa9:	80 25 d7 9b 96 00 fe 	and    BYTE PTR ds:0x969bd7,0xfe
  448fb0:	6a 01                	push   0x1
  448fb2:	e8 e9 3f 05 00       	call   0x49cfa0
  448fb7:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  448fbe:	8d 14 80             	lea    edx,[eax+eax*4]
--
  448ffd:	cc                   	int3
  448ffe:	cc                   	int3
  448fff:	cc                   	int3
  449000:	80 25 d7 9b 96 00 fe 	and    BYTE PTR ds:0x969bd7,0xfe
  449007:	6a 01                	push   0x1
  449009:	e8 92 3f 05 00       	call   0x49cfa0
  44900e:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  449015:	8d 14 80             	lea    edx,[eax+eax*4]
--
  44905f:	cc                   	int3
  449060:	80 7c 24 04 00       	cmp    BYTE PTR [esp+0x4],0x0
  449065:	74 08                	je     0x44906f
  449067:	80 0d d7 9b 96 00 10 	or     BYTE PTR ds:0x969bd7,0x10
  44906e:	c3                   	ret
  44906f:	80 25 d7 9b 96 00 ef 	and    BYTE PTR ds:0x969bd7,0xef
  449076:	c3                   	ret
  449077:	cc                   	int3
  449078:	cc                   	int3
  449079:	cc                   	int3
--
  44907e:	cc                   	int3
  44907f:	cc                   	int3
  449080:	83 ec 08             	sub    esp,0x8
  449083:	f6 05 d7 9b 96 00 10 	test   BYTE PTR ds:0x969bd7,0x10
  44908a:	0f 84 a3 01 00 00    	je     0x449233
  449090:	f6 05 d7 9b 96 00 01 	test   BYTE PTR ds:0x969bd7,0x1
  449097:	0f 84 96 01 00 00    	je     0x449233
  44909d:	33 c9                	xor    ecx,ecx
  44909f:	38 0d d4 9b 96 00    	cmp    BYTE PTR ds:0x969bd4,cl
  4490a5:	0f 85 38 01 00 00    	jne    0x4491e3
  4490ab:	f6 05 d7 9b 96 00 40 	test   BYTE PTR ds:0x969bd7,0x40
  4490b2:	0f 85 7b 01 00 00    	jne    0x449233
  4490b8:	8d 44 24 00          	lea    eax,[esp+0x0]
  4490bc:	89 0d 0a 9d 96 00    	mov    DWORD PTR ds:0x969d0a,ecx
  4490c2:	89 0d 1e 9d 96 00    	mov    DWORD PTR ds:0x969d1e,ecx
--
  4491bd:	83 c4 04             	add    esp,0x4
  4491c0:	6a 00                	push   0x0
  4491c2:	a1 1c 3e 97 00       	mov    eax,ds:0x973e1c
  4491c7:	80 0d d7 9b 96 00 08 	or     BYTE PTR ds:0x969bd7,0x8
  4491ce:	80 0d d7 9b 96 00 40 	or     BYTE PTR ds:0x969bd7,0x40
  4491d5:	6a 00                	push   0x0
  4491d7:	6a 20                	push   0x20
  4491d9:	50                   	push   eax
  4491da:	e8 41 18 03 00       	call   0x47aa20
  4491df:	83 c4 18             	add    esp,0x18
  4491e2:	c3                   	ret
  4491e3:	80 25 d7 9b 96 00 fe 	and    BYTE PTR ds:0x969bd7,0xfe
  4491ea:	6a 01                	push   0x1
  4491ec:	e8 af 3d 05 00       	call   0x49cfa0
  4491f1:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4491f8:	8d 14 80             	lea    edx,[eax+eax*4]
--
  44923d:	cc                   	int3
  44923e:	cc                   	int3
  44923f:	cc                   	int3
  449240:	f6 05 d7 9b 96 00 01 	test   BYTE PTR ds:0x969bd7,0x1
  449247:	53                   	push   ebx
  449248:	56                   	push   esi
  449249:	57                   	push   edi
  44924a:	55                   	push   ebp
--
  4492ee:	cc                   	int3
  4492ef:	cc                   	int3
  4492f0:	66 8b 44 24 04       	mov    ax,WORD PTR [esp+0x4]
  4492f5:	80 0d d7 9b 96 00 04 	or     BYTE PTR ds:0x969bd7,0x4
  4492fc:	66 8b 4c 24 08       	mov    cx,WORD PTR [esp+0x8]
  449301:	66 8b 54 24 0c       	mov    dx,WORD PTR [esp+0xc]
  449306:	66 a3 da 9b 96 00    	mov    ds:0x969bda,ax
  44930c:	66 89 0d dc 9b 96 00 	mov    WORD PTR ds:0x969bdc,cx
--
  44931e:	cc                   	int3
  44931f:	cc                   	int3
  449320:	83 ec 04             	sub    esp,0x4
  449323:	f6 05 d7 9b 96 00 01 	test   BYTE PTR ds:0x969bd7,0x1
  44932a:	53                   	push   ebx
  44932b:	56                   	push   esi
  44932c:	0f 84 2f 03 00 00    	je     0x449661
  449332:	f6 05 61 c6 89 00 02 	test   BYTE PTR ds:0x89c661,0x2
--
  449346:	0f 85 f8 01 00 00    	jne    0x449544
  44934c:	33 c0                	xor    eax,eax
  44934e:	a0 d2 9b 96 00       	mov    al,ds:0x969bd2
  449353:	f6 05 d7 9b 96 00 08 	test   BYTE PTR ds:0x969bd7,0x8
  44935a:	8d 34 c5 e2 9b 96 00 	lea    esi,[eax*8+0x969be2]
  449361:	75 74                	jne    0x4493d7
  449363:	33 db                	xor    ebx,ebx
  449365:	0f be 05 d3 9b 96 00 	movsx  eax,BYTE PTR ds:0x969bd3
--
  4493c2:	83 c4 04             	add    esp,0x4
  4493c5:	83 c6 08             	add    esi,0x8
  4493c8:	fe 05 d2 9b 96 00    	inc    BYTE PTR ds:0x969bd2
  4493ce:	f6 05 d7 9b 96 00 08 	test   BYTE PTR ds:0x969bd7,0x8
  4493d5:	74 8e                	je     0x449365
  4493d7:	33 c0                	xor    eax,eax
  4493d9:	a0 d2 9b 96 00       	mov    al,ds:0x969bd2
  4493de:	80 3c c5 e2 9b 96 00 	cmp    BYTE PTR [eax*8+0x969be2],0x0
  4493e5:	00 
  4493e6:	75 0e                	jne    0x4493f6
  4493e8:	80 0d d7 9b 96 00 08 	or     BYTE PTR ds:0x969bd7,0x8
  4493ef:	80 0d d7 9b 96 00 40 	or     BYTE PTR ds:0x969bd7,0x40
  4493f6:	bb 01 00 00 00       	mov    ebx,0x1
  4493fb:	33 d2                	xor    edx,edx
  4493fd:	b8 01 00 00 00       	mov    eax,0x1
  449402:	8a 15 d6 9b 96 00    	mov    dl,BYTE PTR ds:0x969bd6
--
  449448:	83 fb 07             	cmp    ebx,0x7
  44944b:	7c ae                	jl     0x4493fb
  44944d:	66 ff 05 e0 9b 96 00 	inc    WORD PTR ds:0x969be0
  449454:	f6 05 d7 9b 96 00 08 	test   BYTE PTR ds:0x969bd7,0x8
  44945b:	74 59                	je     0x4494b6
  44945d:	80 3d d6 9b 96 00 00 	cmp    BYTE PTR ds:0x969bd6,0x0
  449464:	75 50                	jne    0x4494b6
  449466:	80 25 d7 9b 96 00 fe 	and    BYTE PTR ds:0x969bd7,0xfe
  44946d:	6a 01                	push   0x1
  44946f:	e8 2c 3b 05 00       	call   0x49cfa0
  449474:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  44947b:	8d 14 80             	lea    edx,[eax+eax*4]
--
  4494ac:	6a 40                	push   0x40
  4494ae:	e8 0d 5d 06 00       	call   0x4af1c0
  4494b3:	83 c4 04             	add    esp,0x4
  4494b6:	f6 05 d7 9b 96 00 40 	test   BYTE PTR ds:0x969bd7,0x40
  4494bd:	0f 84 9e 01 00 00    	je     0x449661
  4494c3:	bb 80 00 00 00       	mov    ebx,0x80
  4494c8:	84 1d d7 9b 96 00    	test   BYTE PTR ds:0x969bd7,bl
  4494ce:	0f 85 8d 01 00 00    	jne    0x449661
  4494d4:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4494db:	8b c8                	mov    ecx,eax
  4494dd:	8d 14 80             	lea    edx,[eax+eax*4]
--
  44952e:	6a 40                	push   0x40
  449530:	e8 8b 5c 06 00       	call   0x4af1c0
  449535:	83 c4 04             	add    esp,0x4
  449538:	08 1d d7 9b 96 00    	or     BYTE PTR ds:0x969bd7,bl
  44953e:	5e                   	pop    esi
  44953f:	5b                   	pop    ebx
  449540:	83 c4 04             	add    esp,0x4
  449543:	c3                   	ret
--
  4a9f8d:	0f 85 5a 01 00 00    	jne    0x4aa0ed
  4a9f93:	f6 05 68 c6 89 00 04 	test   BYTE PTR ds:0x89c668,0x4
  4a9f9a:	75 0e                	jne    0x4a9faa
  4a9f9c:	f6 05 d7 9b 96 00 01 	test   BYTE PTR ds:0x969bd7,0x1
  4a9fa3:	74 05                	je     0x4a9faa
  4a9fa5:	e8 d6 f0 f9 ff       	call   0x449080
  4a9faa:	f6 05 64 c6 89 00 06 	test   BYTE PTR ds:0x89c664,0x6
  4a9fb1:	0f 84 36 01 00 00    	je     0x4aa0ed
--
  4aace7:	c7 05 08 ce 59 00 00 	mov    DWORD PTR ds:0x59ce08,0x0
  4aacee:	00 00 00 
  4aacf1:	e9 ec 0e 00 00       	jmp    0x4abbe2
  4aacf6:	f6 05 d7 9b 96 00 01 	test   BYTE PTR ds:0x969bd7,0x1
  4aacfd:	0f 85 df 0e 00 00    	jne    0x4abbe2
  4aad03:	e8 c8 4d f7 ff       	call   0x41fad0
  4aad08:	e8 83 db f6 ff       	call   0x418890
  4aad0d:	e9 d0 0e 00 00       	jmp    0x4abbe2
--
  4ab417:	e8 24 29 01 00       	call   0x4bdd40
  4ab41c:	83 c4 08             	add    esp,0x8
  4ab41f:	e9 be 07 00 00       	jmp    0x4abbe2
  4ab424:	f6 05 d7 9b 96 00 01 	test   BYTE PTR ds:0x969bd7,0x1
  4ab42b:	0f 85 b1 07 00 00    	jne    0x4abbe2
  4ab431:	66 0f be 05 ec c6 89 	movsx  ax,BYTE PTR ds:0x89c6ec
  4ab438:	00 
  4ab439:	6a 00                	push   0x0
--
  4abb8c:	c7 05 08 ce 59 00 00 	mov    DWORD PTR ds:0x59ce08,0x0
  4abb93:	00 00 00 
  4abb96:	eb 4a                	jmp    0x4abbe2
  4abb98:	f6 05 d7 9b 96 00 01 	test   BYTE PTR ds:0x969bd7,0x1
  4abb9f:	75 41                	jne    0x4abbe2
  4abba1:	e8 2a 3f f7 ff       	call   0x41fad0
  4abba6:	66 a1 c1 c6 89 00    	mov    ax,ds:0x89c6c1
  4abbac:	66 2d 02 00          	sub    ax,0x2
--
  4abcd4:	5b                   	pop    ebx
  4abcd5:	81 c4 3c 03 00 00    	add    esp,0x33c
  4abcdb:	c3                   	ret
  4abcdc:	f6 05 d7 9b 96 00 01 	test   BYTE PTR ds:0x969bd7,0x1
  4abce3:	0f 85 d0 18 00 00    	jne    0x4ad5b9
  4abce9:	83 eb 2a             	sub    ebx,0x2a
  4abcec:	83 fb 01             	cmp    ebx,0x1
  4abcef:	1b c0                	sbb    eax,eax
