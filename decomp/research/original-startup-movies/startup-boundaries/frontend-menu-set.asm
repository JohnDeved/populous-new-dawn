
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0045a3c0 <.text+0x593c0>:
  45a3c0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  45a3c4:	83 ec 04             	sub    esp,0x4
  45a3c7:	a3 d8 9c 74 00       	mov    ds:0x749cd8,eax
  45a3cc:	53                   	push   ebx
  45a3cd:	56                   	push   esi
  45a3ce:	57                   	push   edi
  45a3cf:	55                   	push   ebp
  45a3d0:	e8 cb 45 0a 00       	call   0x4fe9a0
  45a3d5:	83 25 fc 9d 74 00 fa 	and    DWORD PTR ds:0x749dfc,0xfffffffa
  45a3dc:	a1 d8 9c 74 00       	mov    eax,ds:0x749cd8
  45a3e1:	33 ff                	xor    edi,edi
  45a3e3:	c7 05 78 7d 5d 00 00 	mov    DWORD PTR ds:0x5d7d78,0x0
  45a3ea:	00 00 00 
  45a3ed:	c1 e0 05             	shl    eax,0x5
  45a3f0:	05 98 9c 5d 00       	add    eax,0x5d9c98
  45a3f5:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  45a3f9:	8b 70 08             	mov    esi,DWORD PTR [eax+0x8]
  45a3fc:	39 78 04             	cmp    DWORD PTR [eax+0x4],edi
  45a3ff:	0f 8e be 00 00 00    	jle    0x45a4c3
  45a405:	8b 06                	mov    eax,DWORD PTR [esi]
  45a407:	48                   	dec    eax
  45a408:	83 f8 0c             	cmp    eax,0xc
  45a40b:	0f 87 a1 00 00 00    	ja     0x45a4b2
  45a411:	ff 24 85 cc a4 45 00 	jmp    DWORD PTR [eax*4+0x45a4cc]
  45a418:	8b 4e 04             	mov    ecx,DWORD PTR [esi+0x4]
  45a41b:	8b 41 04             	mov    eax,DWORD PTR [ecx+0x4]
  45a41e:	85 c0                	test   eax,eax
  45a420:	0f 84 8c 00 00 00    	je     0x45a4b2
  45a426:	e9 81 00 00 00       	jmp    0x45a4ac
  45a42b:	8b 4e 04             	mov    ecx,DWORD PTR [esi+0x4]
  45a42e:	8b 41 1c             	mov    eax,DWORD PTR [ecx+0x1c]
  45a431:	85 c0                	test   eax,eax
  45a433:	74 7d                	je     0x45a4b2
  45a435:	eb 75                	jmp    0x45a4ac
  45a437:	8b 4e 04             	mov    ecx,DWORD PTR [esi+0x4]
  45a43a:	8b 41 28             	mov    eax,DWORD PTR [ecx+0x28]
  45a43d:	85 c0                	test   eax,eax
  45a43f:	74 71                	je     0x45a4b2
  45a441:	eb 69                	jmp    0x45a4ac
  45a443:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  45a446:	8b 48 34             	mov    ecx,DWORD PTR [eax+0x34]
  45a449:	85 c9                	test   ecx,ecx
  45a44b:	74 06                	je     0x45a453
  45a44d:	50                   	push   eax
  45a44e:	ff d1                	call   ecx
  45a450:	83 c4 04             	add    esp,0x4
  45a453:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  45a456:	33 ed                	xor    ebp,ebp
  45a458:	8b 58 28             	mov    ebx,DWORD PTR [eax+0x28]
  45a45b:	39 68 24             	cmp    DWORD PTR [eax+0x24],ebp
  45a45e:	7e 52                	jle    0x45a4b2
  45a460:	8b 43 18             	mov    eax,DWORD PTR [ebx+0x18]
  45a463:	85 c0                	test   eax,eax
  45a465:	74 06                	je     0x45a46d
  45a467:	53                   	push   ebx
  45a468:	ff d0                	call   eax
  45a46a:	83 c4 04             	add    esp,0x4
  45a46d:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  45a470:	45                   	inc    ebp
  45a471:	83 c3 28             	add    ebx,0x28
  45a474:	39 68 24             	cmp    DWORD PTR [eax+0x24],ebp
  45a477:	7f e7                	jg     0x45a460
  45a479:	eb 37                	jmp    0x45a4b2
  45a47b:	8b 4e 04             	mov    ecx,DWORD PTR [esi+0x4]
  45a47e:	8b 41 2c             	mov    eax,DWORD PTR [ecx+0x2c]
  45a481:	85 c0                	test   eax,eax
  45a483:	74 2d                	je     0x45a4b2
  45a485:	eb 25                	jmp    0x45a4ac
  45a487:	8b 4e 04             	mov    ecx,DWORD PTR [esi+0x4]
  45a48a:	8b 41 34             	mov    eax,DWORD PTR [ecx+0x34]
  45a48d:	85 c0                	test   eax,eax
  45a48f:	74 21                	je     0x45a4b2
  45a491:	eb 19                	jmp    0x45a4ac
  45a493:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  45a496:	8b 48 30             	mov    ecx,DWORD PTR [eax+0x30]
  45a499:	85 c9                	test   ecx,ecx
  45a49b:	74 15                	je     0x45a4b2
  45a49d:	50                   	push   eax
  45a49e:	ff d1                	call   ecx
  45a4a0:	eb 0d                	jmp    0x45a4af
  45a4a2:	8b 4e 04             	mov    ecx,DWORD PTR [esi+0x4]
  45a4a5:	8b 41 2c             	mov    eax,DWORD PTR [ecx+0x2c]
  45a4a8:	85 c0                	test   eax,eax
  45a4aa:	74 06                	je     0x45a4b2
  45a4ac:	51                   	push   ecx
  45a4ad:	ff d0                	call   eax
  45a4af:	83 c4 04             	add    esp,0x4
  45a4b2:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  45a4b6:	47                   	inc    edi
  45a4b7:	83 c6 08             	add    esi,0x8
  45a4ba:	39 78 04             	cmp    DWORD PTR [eax+0x4],edi
  45a4bd:	0f 8f 42 ff ff ff    	jg     0x45a405
  45a4c3:	5d                   	pop    ebp
  45a4c4:	5f                   	pop    edi
  45a4c5:	5e                   	pop    esi
  45a4c6:	5b                   	pop    ebx
  45a4c7:	83 c4 04             	add    esp,0x4
  45a4ca:	c3                   	ret
