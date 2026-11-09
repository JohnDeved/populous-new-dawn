
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0052c5b0 <.text+0x12b5b0>:
  52c5b0:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  52c5b6:	55                   	push   ebp
  52c5b7:	8b ec                	mov    ebp,esp
  52c5b9:	6a ff                	push   0xffffffff
  52c5bb:	68 62 c6 52 00       	push   0x52c662
  52c5c0:	50                   	push   eax
  52c5c1:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  52c5c8:	83 ec 0c             	sub    esp,0xc
  52c5cb:	56                   	push   esi
  52c5cc:	8b f1                	mov    esi,ecx
  52c5ce:	83 79 04 00          	cmp    DWORD PTR [ecx+0x4],0x0
  52c5d2:	75 13                	jne    0x52c5e7
  52c5d4:	33 c0                	xor    eax,eax
  52c5d6:	8b 4d f4             	mov    ecx,DWORD PTR [ebp-0xc]
  52c5d9:	5e                   	pop    esi
  52c5da:	64 89 0d 00 00 00 00 	mov    DWORD PTR fs:0x0,ecx
  52c5e1:	8b e5                	mov    esp,ebp
  52c5e3:	5d                   	pop    ebp
  52c5e4:	c2 04 00             	ret    0x4
  52c5e7:	6a 00                	push   0x0
  52c5e9:	8d 4d e8             	lea    ecx,[ebp-0x18]
  52c5ec:	56                   	push   esi
  52c5ed:	e8 ae f7 ff ff       	call   0x52bda0
  52c5f2:	6a 01                	push   0x1
  52c5f4:	8d 4d e8             	lea    ecx,[ebp-0x18]
  52c5f7:	c7 45 fc 00 00 00 00 	mov    DWORD PTR [ebp-0x4],0x0
  52c5fe:	e8 cd f7 ff ff       	call   0x52bdd0
  52c603:	85 c0                	test   eax,eax
  52c605:	74 45                	je     0x52c64c
  52c607:	8b 46 08             	mov    eax,DWORD PTR [esi+0x8]
  52c60a:	39 46 14             	cmp    DWORD PTR [esi+0x14],eax
  52c60d:	72 0e                	jb     0x52c61d
  52c60f:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  52c616:	e8 51 00 00 00       	call   0x52c66c
  52c61b:	eb b7                	jmp    0x52c5d4
  52c61d:	8b 4d 08             	mov    ecx,DWORD PTR [ebp+0x8]
  52c620:	8b 56 10             	mov    edx,DWORD PTR [esi+0x10]
  52c623:	8d 14 92             	lea    edx,[edx+edx*4]
  52c626:	8b 01                	mov    eax,DWORD PTR [ecx]
  52c628:	03 d2                	add    edx,edx
  52c62a:	03 56 04             	add    edx,DWORD PTR [esi+0x4]
  52c62d:	89 02                	mov    DWORD PTR [edx],eax
  52c62f:	8b 41 04             	mov    eax,DWORD PTR [ecx+0x4]
  52c632:	89 42 04             	mov    DWORD PTR [edx+0x4],eax
  52c635:	66 8b 49 08          	mov    cx,WORD PTR [ecx+0x8]
  52c639:	66 89 4a 08          	mov    WORD PTR [edx+0x8],cx
  52c63d:	2b d2                	sub    edx,edx
  52c63f:	ff 46 14             	inc    DWORD PTR [esi+0x14]
  52c642:	8b 46 10             	mov    eax,DWORD PTR [esi+0x10]
  52c645:	40                   	inc    eax
  52c646:	f7 76 08             	div    DWORD PTR [esi+0x8]
  52c649:	89 56 10             	mov    DWORD PTR [esi+0x10],edx
  52c64c:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  52c653:	e8 14 00 00 00       	call   0x52c66c
  52c658:	b8 01 00 00 00       	mov    eax,0x1
  52c65d:	e9 74 ff ff ff       	jmp    0x52c5d6
  52c662:	b8 e0 5f 59 00       	mov    eax,0x595fe0
  52c667:	e9 84 f1 02 00       	jmp    0x55b7f0
  52c66c:	8d 4d e8             	lea    ecx,[ebp-0x18]
  52c66f:	e9 4c f7 ff ff       	jmp    0x52bdc0
  52c674:	cc                   	int3
  52c675:	cc                   	int3
  52c676:	cc                   	int3
  52c677:	cc                   	int3
  52c678:	cc                   	int3
  52c679:	cc                   	int3
  52c67a:	cc                   	int3
  52c67b:	cc                   	int3
  52c67c:	cc                   	int3
  52c67d:	cc                   	int3
  52c67e:	cc                   	int3
  52c67f:	cc                   	int3
  52c680:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  52c686:	55                   	push   ebp
  52c687:	8b ec                	mov    ebp,esp
  52c689:	6a ff                	push   0xffffffff
  52c68b:	68 3a c7 52 00       	push   0x52c73a
  52c690:	50                   	push   eax
  52c691:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  52c698:	83 ec 10             	sub    esp,0x10
  52c69b:	c7 45 f0 00 00 00 00 	mov    DWORD PTR [ebp-0x10],0x0
  52c6a2:	56                   	push   esi
  52c6a3:	57                   	push   edi
  52c6a4:	8b f1                	mov    esi,ecx
  52c6a6:	6a 00                	push   0x0
  52c6a8:	56                   	push   esi
  52c6a9:	8d 4d e4             	lea    ecx,[ebp-0x1c]
  52c6ac:	e8 ef f6 ff ff       	call   0x52bda0
  52c6b1:	6a 01                	push   0x1
  52c6b3:	8d 4d e4             	lea    ecx,[ebp-0x1c]
  52c6b6:	c7 45 fc 00 00 00 00 	mov    DWORD PTR [ebp-0x4],0x0
  52c6bd:	e8 0e f7 ff ff       	call   0x52bdd0
  52c6c2:	85 c0                	test   eax,eax
  52c6c4:	74 63                	je     0x52c729
  52c6c6:	83 7e 14 00          	cmp    DWORD PTR [esi+0x14],0x0
  52c6ca:	75 20                	jne    0x52c6ec
  52c6cc:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  52c6d3:	e8 6c 00 00 00       	call   0x52c744
  52c6d8:	33 c0                	xor    eax,eax
  52c6da:	8b 4d f4             	mov    ecx,DWORD PTR [ebp-0xc]
  52c6dd:	5f                   	pop    edi
  52c6de:	64 89 0d 00 00 00 00 	mov    DWORD PTR fs:0x0,ecx
  52c6e5:	5e                   	pop    esi
  52c6e6:	8b e5                	mov    esp,ebp
  52c6e8:	5d                   	pop    ebp
  52c6e9:	c2 08 00             	ret    0x8
  52c6ec:	83 7d 08 01          	cmp    DWORD PTR [ebp+0x8],0x1
  52c6f0:	75 37                	jne    0x52c729
  52c6f2:	8b 4e 04             	mov    ecx,DWORD PTR [esi+0x4]
  52c6f5:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  52c6f8:	8d 14 80             	lea    edx,[eax+eax*4]
  52c6fb:	8d 0c 51             	lea    ecx,[ecx+edx*2]
  52c6fe:	8b 55 0c             	mov    edx,DWORD PTR [ebp+0xc]
  52c701:	8b 01                	mov    eax,DWORD PTR [ecx]
  52c703:	89 02                	mov    DWORD PTR [edx],eax
  52c705:	8b 79 04             	mov    edi,DWORD PTR [ecx+0x4]
  52c708:	89 7a 04             	mov    DWORD PTR [edx+0x4],edi
  52c70b:	66 8b 49 08          	mov    cx,WORD PTR [ecx+0x8]
  52c70f:	66 89 4a 08          	mov    WORD PTR [edx+0x8],cx
  52c713:	2b d2                	sub    edx,edx
  52c715:	c7 45 f0 01 00 00 00 	mov    DWORD PTR [ebp-0x10],0x1
  52c71c:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  52c71f:	40                   	inc    eax
  52c720:	f7 76 08             	div    DWORD PTR [esi+0x8]
  52c723:	89 56 0c             	mov    DWORD PTR [esi+0xc],edx
  52c726:	ff 4e 14             	dec    DWORD PTR [esi+0x14]
  52c729:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  52c730:	e8 0f 00 00 00       	call   0x52c744
  52c735:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  52c738:	eb a0                	jmp    0x52c6da
  52c73a:	b8 08 60 59 00       	mov    eax,0x596008
  52c73f:	e9 ac f0 02 00       	jmp    0x55b7f0
  52c744:	8d 4d e4             	lea    ecx,[ebp-0x1c]
  52c747:	e9 74 f6 ff ff       	jmp    0x52bdc0
