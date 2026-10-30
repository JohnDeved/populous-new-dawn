
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00522570 <.text+0x121570>:
  522570:	66 a1 c1 c6 89 00    	mov    ax,ds:0x89c6c1
  522576:	81 ec 04 01 00 00    	sub    esp,0x104
  52257c:	53                   	push   ebx
  52257d:	56                   	push   esi
  52257e:	57                   	push   edi
  52257f:	50                   	push   eax
  522580:	e8 ab 23 f9 ff       	call   0x4b4930
  522585:	83 c4 04             	add    esp,0x4
  522588:	85 c0                	test   eax,eax
  52258a:	7d 0c                	jge    0x522598
  52258c:	33 c0                	xor    eax,eax
  52258e:	5f                   	pop    edi
  52258f:	5e                   	pop    esi
  522590:	5b                   	pop    ebx
  522591:	81 c4 04 01 00 00    	add    esp,0x104
  522597:	c3                   	ret
  522598:	83 3d 20 d9 5c 00 00 	cmp    DWORD PTR ds:0x5cd920,0x0
  52259f:	74 6c                	je     0x52260d
  5225a1:	6a 03                	push   0x3
  5225a3:	e8 28 e6 f0 ff       	call   0x430bd0
  5225a8:	83 c4 04             	add    esp,0x4
  5225ab:	80 3d e7 41 68 00 ff 	cmp    BYTE PTR ds:0x6841e7,0xff
  5225b2:	74 31                	je     0x5225e5
  5225b4:	68 08 02 00 00       	push   0x208
  5225b9:	a0 e7 41 68 00       	mov    al,ds:0x6841e7
  5225be:	50                   	push   eax
  5225bf:	e8 7c e8 f0 ff       	call   0x430e40
  5225c4:	83 c4 08             	add    esp,0x8
  5225c7:	80 3d e7 41 68 00 ff 	cmp    BYTE PTR ds:0x6841e7,0xff
  5225ce:	74 33                	je     0x522603
  5225d0:	0f be 05 e7 41 68 00 	movsx  eax,BYTE PTR ds:0x6841e7
  5225d7:	8d 0c 80             	lea    ecx,[eax+eax*4]
  5225da:	81 8c c9 b3 3b 68 00 	or     DWORD PTR [ecx+ecx*8+0x683bb3],0x200
  5225e1:	00 02 00 00 
  5225e5:	80 3d e7 41 68 00 ff 	cmp    BYTE PTR ds:0x6841e7,0xff
  5225ec:	74 15                	je     0x522603
  5225ee:	0f be 05 e7 41 68 00 	movsx  eax,BYTE PTR ds:0x6841e7
  5225f5:	8d 0c 80             	lea    ecx,[eax+eax*4]
  5225f8:	81 8c c9 b3 3b 68 00 	or     DWORD PTR [ecx+ecx*8+0x683bb3],0x20000
  5225ff:	00 00 02 00 
  522603:	c7 05 20 d9 5c 00 00 	mov    DWORD PTR ds:0x5cd920,0x0
  52260a:	00 00 00 
  52260d:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  522612:	8b 88 48 06 00 00    	mov    ecx,DWORD PTR [eax+0x648]
  522618:	51                   	push   ecx
  522619:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  52261f:	e8 6c a1 f5 ff       	call   0x47c790
  522624:	c7 05 78 a0 5d 00 00 	mov    DWORD PTR ds:0x5da078,0x0
  52262b:	00 00 00 
  52262e:	e8 cd 4a ff ff       	call   0x517100
  522633:	0f bf 05 c1 c6 89 00 	movsx  eax,WORD PTR ds:0x89c6c1
  52263a:	85 c0                	test   eax,eax
  52263c:	74 0e                	je     0x52264c
  52263e:	83 f8 02             	cmp    eax,0x2
  522641:	0f 84 93 00 00 00    	je     0x5226da
  522647:	e9 ec 00 00 00       	jmp    0x522738
  52264c:	6a 00                	push   0x0
  52264e:	e8 dd 23 00 00       	call   0x524a30
  522653:	0f bf 05 2c f0 88 00 	movsx  eax,WORD PTR ds:0x88f02c
  52265a:	0f bf 0d 2a f0 88 00 	movsx  ecx,WORD PTR ds:0x88f02a
  522661:	83 c4 04             	add    esp,0x4
  522664:	0f bf 15 28 f0 88 00 	movsx  edx,WORD PTR ds:0x88f028
  52266b:	50                   	push   eax
  52266c:	51                   	push   ecx
  52266d:	0f bf 05 26 f0 88 00 	movsx  eax,WORD PTR ds:0x88f026
  522674:	52                   	push   edx
  522675:	50                   	push   eax
  522676:	e8 a5 4b ff ff       	call   0x517220
  52267b:	c6 05 b0 5f 89 00 00 	mov    BYTE PTR ds:0x895fb0,0x0
  522682:	83 c4 10             	add    esp,0x10
  522685:	80 3d b1 5f 89 00 00 	cmp    BYTE PTR ds:0x895fb1,0x0
  52268c:	74 06                	je     0x522694
  52268e:	fe 0d b1 5f 89 00    	dec    BYTE PTR ds:0x895fb1
  522694:	0f be 0d f0 c6 89 00 	movsx  ecx,BYTE PTR ds:0x89c6f0
  52269b:	8b c1                	mov    eax,ecx
  52269d:	8d 14 89             	lea    edx,[ecx+ecx*4]
  5226a0:	68 04 f0 88 00       	push   0x88f004
  5226a5:	8d 0c 50             	lea    ecx,[eax+edx*2]
  5226a8:	66 c7 05 2c db 98 00 	mov    WORD PTR ds:0x98db2c,0x0
  5226af:	00 00 
  5226b1:	8d 1c c9             	lea    ebx,[ecx+ecx*8]
  5226b4:	8d 14 d8             	lea    edx,[eax+ebx*8]
  5226b7:	8d 0c 90             	lea    ecx,[eax+edx*4]
  5226ba:	81 c1 c8 d1 89 00    	add    ecx,0x89d1c8
  5226c0:	89 0d 50 a3 74 00    	mov    DWORD PTR ds:0x74a350,ecx
  5226c6:	e8 35 c0 f4 ff       	call   0x46e700
  5226cb:	83 c4 04             	add    esp,0x4
  5226ce:	e8 5d 4a f4 ff       	call   0x467130
  5226d3:	e8 38 c2 f4 ff       	call   0x46e910
  5226d8:	eb 5e                	jmp    0x522738
  5226da:	6a 02                	push   0x2
  5226dc:	e8 4f 23 00 00       	call   0x524a30
  5226e1:	0f bf 05 2c f0 88 00 	movsx  eax,WORD PTR ds:0x88f02c
  5226e8:	0f bf 0d 2a f0 88 00 	movsx  ecx,WORD PTR ds:0x88f02a
  5226ef:	83 c4 04             	add    esp,0x4
  5226f2:	0f bf 15 28 f0 88 00 	movsx  edx,WORD PTR ds:0x88f028
  5226f9:	50                   	push   eax
  5226fa:	51                   	push   ecx
  5226fb:	0f bf 05 26 f0 88 00 	movsx  eax,WORD PTR ds:0x88f026
  522702:	52                   	push   edx
  522703:	50                   	push   eax
  522704:	e8 17 4b ff ff       	call   0x517220
  522709:	83 c4 10             	add    esp,0x10
  52270c:	e8 6f 56 f9 ff       	call   0x4b7d80
  522711:	0f be 0d f0 c6 89 00 	movsx  ecx,BYTE PTR ds:0x89c6f0
  522718:	8b c1                	mov    eax,ecx
  52271a:	8d 14 89             	lea    edx,[ecx+ecx*4]
  52271d:	8d 0c 50             	lea    ecx,[eax+edx*2]
  522720:	8d 1c c9             	lea    ebx,[ecx+ecx*8]
  522723:	8d 14 d8             	lea    edx,[eax+ebx*8]
  522726:	8d 0c 90             	lea    ecx,[eax+edx*4]
  522729:	81 c1 c8 d1 89 00    	add    ecx,0x89d1c8
  52272f:	51                   	push   ecx
  522730:	e8 ab a7 ef ff       	call   0x41cee0
  522735:	83 c4 04             	add    esp,0x4
  522738:	e8 23 a2 f7 ff       	call   0x49c960
  52273d:	6a 01                	push   0x1
  52273f:	e8 5c e7 f5 ff       	call   0x480ea0
  522744:	83 c4 04             	add    esp,0x4
  522747:	f6 05 61 c6 89 00 04 	test   BYTE PTR ds:0x89c661,0x4
  52274e:	75 0a                	jne    0x52275a
  522750:	e8 bb e9 f0 ff       	call   0x431110
  522755:	e8 a6 84 f2 ff       	call   0x44ac00
  52275a:	e8 91 84 f2 ff       	call   0x44abf0
  52275f:	e8 8c 7b f2 ff       	call   0x44a2f0
  522764:	6a 00                	push   0x0
  522766:	e8 35 e7 f5 ff       	call   0x480ea0
  52276b:	83 c4 04             	add    esp,0x4
  52276e:	e8 7d 12 00 00       	call   0x5239f0
  522773:	e8 18 33 ef ff       	call   0x415a90
  522778:	e8 e3 1a f9 ff       	call   0x4b4260
  52277d:	6a 02                	push   0x2
  52277f:	e8 ec eb f2 ff       	call   0x451370
  522784:	83 c4 04             	add    esp,0x4
  522787:	85 c0                	test   eax,eax
  522789:	75 28                	jne    0x5227b3
  52278b:	6a 04                	push   0x4
  52278d:	e8 de eb f2 ff       	call   0x451370
  522792:	83 c4 04             	add    esp,0x4
  522795:	85 c0                	test   eax,eax
  522797:	75 1a                	jne    0x5227b3
  522799:	f6 05 6c c6 89 00 80 	test   BYTE PTR ds:0x89c66c,0x80
  5227a0:	75 11                	jne    0x5227b3
  5227a2:	66 83 3d c1 c6 89 00 	cmp    WORD PTR ds:0x89c6c1,0x2
  5227a9:	02 
  5227aa:	74 07                	je     0x5227b3
  5227ac:	e8 3f 25 00 00       	call   0x524cf0
  5227b1:	eb 28                	jmp    0x5227db
  5227b3:	6a 02                	push   0x2
  5227b5:	e8 b6 eb f2 ff       	call   0x451370
  5227ba:	83 c4 04             	add    esp,0x4
  5227bd:	85 c0                	test   eax,eax
  5227bf:	74 07                	je     0x5227c8
  5227c1:	e8 6a bf f3 ff       	call   0x45e730
  5227c6:	eb 13                	jmp    0x5227db
  5227c8:	6a 04                	push   0x4
  5227ca:	e8 a1 eb f2 ff       	call   0x451370
  5227cf:	83 c4 04             	add    esp,0x4
  5227d2:	85 c0                	test   eax,eax
  5227d4:	74 05                	je     0x5227db
  5227d6:	e8 85 42 f6 ff       	call   0x486a60
  5227db:	33 c0                	xor    eax,eax
  5227dd:	a0 6c ce 89 00       	mov    al,ds:0x89ce6c
  5227e2:	83 f8 01             	cmp    eax,0x1
  5227e5:	74 07                	je     0x5227ee
  5227e7:	83 f8 02             	cmp    eax,0x2
  5227ea:	74 0e                	je     0x5227fa
  5227ec:	eb 31                	jmp    0x52281f
  5227ee:	a1 10 df 59 00       	mov    eax,ds:0x59df10
  5227f3:	05 e0 00 00 00       	add    eax,0xe0
  5227f8:	eb 0a                	jmp    0x522804
  5227fa:	a1 10 df 59 00       	mov    eax,ds:0x59df10
  5227ff:	05 e8 00 00 00       	add    eax,0xe8
  522804:	50                   	push   eax
  522805:	33 c0                	xor    eax,eax
  522807:	66 a1 6a ce 89 00    	mov    ax,ds:0x89ce6a
  52280d:	50                   	push   eax
  52280e:	33 c0                	xor    eax,eax
  522810:	66 a1 68 ce 89 00    	mov    ax,ds:0x89ce68
  522816:	50                   	push   eax
  522817:	e8 c4 3a ff ff       	call   0x5162e0
  52281c:	83 c4 0c             	add    esp,0xc
  52281f:	e8 7c 17 00 00       	call   0x523fa0
  522824:	f6 05 7c d1 89 00 02 	test   BYTE PTR ds:0x89d17c,0x2
  52282b:	0f 84 d7 00 00 00    	je     0x522908
  522831:	e8 6a 82 f5 ff       	call   0x47aaa0
  522836:	e8 45 82 f5 ff       	call   0x47aa80
  52283b:	80 3d 88 79 89 00 00 	cmp    BYTE PTR ds:0x897988,0x0
  522842:	0f 84 c0 00 00 00    	je     0x522908
  522848:	e8 c3 09 f7 ff       	call   0x493210
  52284d:	85 c0                	test   eax,eax
  52284f:	74 19                	je     0x52286a
  522851:	33 c0                	xor    eax,eax
  522853:	a0 dd 28 89 00       	mov    al,ds:0x8928dd
  522858:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  52285f:	51                   	push   ecx
  522860:	e8 db f2 f2 ff       	call   0x451b40
  522865:	83 c4 04             	add    esp,0x4
  522868:	eb 1c                	jmp    0x522886
  52286a:	33 c0                	xor    eax,eax
  52286c:	a0 dd 28 89 00       	mov    al,ds:0x8928dd
  522871:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  522878:	51                   	push   ecx
  522879:	68 88 16 59 00       	push   0x591688
  52287e:	e8 ad 44 ff ff       	call   0x516d30
  522883:	83 c4 08             	add    esp,0x8
  522886:	a1 e8 2f 97 00       	mov    eax,ds:0x972fe8
  52288b:	8d 4c 24 10          	lea    ecx,[esp+0x10]
  52288f:	50                   	push   eax
  522890:	68 70 99 59 00       	push   0x599970
  522895:	51                   	push   ecx
  522896:	e8 25 8d 03 00       	call   0x55b5c0
  52289b:	83 c4 0c             	add    esp,0xc
  52289e:	e8 6d 09 f7 ff       	call   0x493210
  5228a3:	6a 41                	push   0x41
  5228a5:	85 c0                	test   eax,eax
  5228a7:	0f bf 35 d1 c6 89 00 	movsx  esi,WORD PTR ds:0x89c6d1
  5228ae:	74 07                	je     0x5228b7
  5228b0:	e8 3b ff f2 ff       	call   0x4527f0
  5228b5:	eb 05                	jmp    0x5228bc
  5228b7:	e8 84 52 00 00       	call   0x527b40
  5228bc:	83 c4 04             	add    esp,0x4
  5228bf:	2b f0                	sub    esi,eax
  5228c1:	e8 4a 09 f7 ff       	call   0x493210
  5228c6:	85 c0                	test   eax,eax
  5228c8:	74 18                	je     0x5228e2
  5228ca:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  5228cf:	8d 4c 24 10          	lea    ecx,[esp+0x10]
  5228d3:	50                   	push   eax
  5228d4:	51                   	push   ecx
  5228d5:	56                   	push   esi
  5228d6:	6a 00                	push   0x0
  5228d8:	e8 c3 f2 f2 ff       	call   0x451ba0
  5228dd:	83 c4 10             	add    esp,0x10
  5228e0:	eb 26                	jmp    0x522908
  5228e2:	83 ec 08             	sub    esp,0x8
  5228e5:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  5228ea:	89 64 24 14          	mov    DWORD PTR [esp+0x14],esp
  5228ee:	50                   	push   eax
  5228ef:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  5228f3:	e8 78 36 ef ff       	call   0x415f70
  5228f8:	8d 44 24 18          	lea    eax,[esp+0x18]
  5228fc:	50                   	push   eax
  5228fd:	56                   	push   esi
  5228fe:	6a 00                	push   0x0
  522900:	e8 5b 50 00 00       	call   0x527960
  522905:	83 c4 14             	add    esp,0x14
  522908:	f6 05 7c d1 89 00 20 	test   BYTE PTR ds:0x89d17c,0x20
  52290f:	0f 84 b5 00 00 00    	je     0x5229ca
  522915:	8b 35 92 aa 96 00    	mov    esi,DWORD PTR ds:0x96aa92
  52291b:	2b 35 88 d1 89 00    	sub    esi,DWORD PTR ds:0x89d188
  522921:	80 3d 86 79 89 00 00 	cmp    BYTE PTR ds:0x897986,0x0
  522928:	75 09                	jne    0x522933
  52292a:	83 fe 78             	cmp    esi,0x78
  52292d:	0f 8c 97 00 00 00    	jl     0x5229ca
  522933:	e8 d8 08 f7 ff       	call   0x493210
  522938:	85 c0                	test   eax,eax
  52293a:	a1 dc cb 87 00       	mov    eax,ds:0x87cbdc
  52293f:	50                   	push   eax
  522940:	74 0a                	je     0x52294c
  522942:	e8 f9 f1 f2 ff       	call   0x451b40
  522947:	83 c4 04             	add    esp,0x4
  52294a:	eb 0d                	jmp    0x522959
  52294c:	68 88 16 59 00       	push   0x591688
  522951:	e8 da 43 ff ff       	call   0x516d30
  522956:	83 c4 08             	add    esp,0x8
  522959:	b9 0c 00 00 00       	mov    ecx,0xc
  52295e:	8b c6                	mov    eax,esi
  522960:	99                   	cdq
  522961:	f7 f9                	idiv   ecx
  522963:	8d 54 24 10          	lea    edx,[esp+0x10]
  522967:	50                   	push   eax
  522968:	a1 28 30 97 00       	mov    eax,ds:0x973028
  52296d:	50                   	push   eax
  52296e:	68 d4 dc 5d 00       	push   0x5ddcd4
  522973:	52                   	push   edx
  522974:	e8 47 8c 03 00       	call   0x55b5c0
  522979:	0f bf 35 26 f0 88 00 	movsx  esi,WORD PTR ds:0x88f026
  522980:	83 c4 10             	add    esp,0x10
  522983:	e8 88 08 f7 ff       	call   0x493210
  522988:	85 c0                	test   eax,eax
  52298a:	74 18                	je     0x5229a4
  52298c:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  522991:	8d 4c 24 10          	lea    ecx,[esp+0x10]
  522995:	50                   	push   eax
  522996:	51                   	push   ecx
  522997:	6a 00                	push   0x0
  522999:	56                   	push   esi
  52299a:	e8 01 f2 f2 ff       	call   0x451ba0
  52299f:	83 c4 10             	add    esp,0x10
  5229a2:	eb 26                	jmp    0x5229ca
  5229a4:	83 ec 08             	sub    esp,0x8
  5229a7:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  5229ac:	89 64 24 14          	mov    DWORD PTR [esp+0x14],esp
  5229b0:	50                   	push   eax
  5229b1:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  5229b5:	e8 b6 35 ef ff       	call   0x415f70
  5229ba:	8d 44 24 18          	lea    eax,[esp+0x18]
  5229be:	50                   	push   eax
  5229bf:	6a 00                	push   0x0
  5229c1:	56                   	push   esi
  5229c2:	e8 99 4f 00 00       	call   0x527960
  5229c7:	83 c4 14             	add    esp,0x14
  5229ca:	e8 31 08 00 00       	call   0x523200
  5229cf:	e8 1c 12 00 00       	call   0x523bf0
  5229d4:	e8 77 2c 00 00       	call   0x525650
  5229d9:	f6 05 46 f7 98 00 04 	test   BYTE PTR ds:0x98f746,0x4
  5229e0:	75 48                	jne    0x522a2a
  5229e2:	33 db                	xor    ebx,ebx
  5229e4:	33 ff                	xor    edi,edi
  5229e6:	ba c8 d1 89 00       	mov    edx,0x89d1c8
  5229eb:	b8 04 00 00 00       	mov    eax,0x4
  5229f0:	38 9a 20 0c 00 00    	cmp    BYTE PTR [edx+0xc20],bl
  5229f6:	74 20                	je     0x522a18
  5229f8:	33 f6                	xor    esi,esi
  5229fa:	8d 8a 7b 06 00 00    	lea    ecx,[edx+0x67b]
  522a00:	66 39 19             	cmp    WORD PTR [ecx],bx
  522a03:	7f 0e                	jg     0x522a13
  522a05:	81 c1 ae 00 00 00    	add    ecx,0xae
  522a0b:	46                   	inc    esi
  522a0c:	83 fe 03             	cmp    esi,0x3
  522a0f:	7c ef                	jl     0x522a00
  522a11:	eb 05                	jmp    0x522a18
  522a13:	bf 01 00 00 00       	mov    edi,0x1
  522a18:	81 c2 65 0c 00 00    	add    edx,0xc65
  522a1e:	48                   	dec    eax
  522a1f:	75 cf                	jne    0x5229f0
  522a21:	85 ff                	test   edi,edi
  522a23:	74 05                	je     0x522a2a
  522a25:	e8 86 c6 f7 ff       	call   0x49f0b0
  522a2a:	f6 05 68 c6 89 00 01 	test   BYTE PTR ds:0x89c668,0x1
  522a31:	0f 84 b2 00 00 00    	je     0x522ae9
  522a37:	e8 d4 07 f7 ff       	call   0x493210
  522a3c:	85 c0                	test   eax,eax
  522a3e:	74 19                	je     0x522a59
  522a40:	33 c0                	xor    eax,eax
  522a42:	a0 dd 28 89 00       	mov    al,ds:0x8928dd
  522a47:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  522a4e:	51                   	push   ecx
  522a4f:	e8 ec f0 f2 ff       	call   0x451b40
  522a54:	83 c4 04             	add    esp,0x4
  522a57:	eb 1c                	jmp    0x522a75
  522a59:	33 c0                	xor    eax,eax
  522a5b:	a0 dd 28 89 00       	mov    al,ds:0x8928dd
  522a60:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  522a67:	51                   	push   ecx
  522a68:	68 88 16 59 00       	push   0x591688
  522a6d:	e8 be 42 ff ff       	call   0x516d30
  522a72:	83 c4 08             	add    esp,0x8
  522a75:	a1 30 55 5d 00       	mov    eax,ds:0x5d5530
  522a7a:	8d 4c 24 10          	lea    ecx,[esp+0x10]
  522a7e:	2d 4a 3d 65 0f       	sub    eax,0xf653d4a
  522a83:	f7 d0                	not    eax
  522a85:	50                   	push   eax
  522a86:	68 cc dc 5d 00       	push   0x5ddccc
  522a8b:	51                   	push   ecx
  522a8c:	e8 2f 8b 03 00       	call   0x55b5c0
  522a91:	83 c4 0c             	add    esp,0xc
  522a94:	8a 0d f6 c6 89 00    	mov    cl,BYTE PTR ds:0x89c6f6
  522a9a:	88 0d 9c 48 98 00    	mov    BYTE PTR ds:0x98489c,cl
  522aa0:	e8 6b 07 f7 ff       	call   0x493210
  522aa5:	85 c0                	test   eax,eax
  522aa7:	74 19                	je     0x522ac2
  522aa9:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  522aae:	8d 4c 24 10          	lea    ecx,[esp+0x10]
  522ab2:	50                   	push   eax
  522ab3:	51                   	push   ecx
  522ab4:	6a 02                	push   0x2
  522ab6:	6a 02                	push   0x2
  522ab8:	e8 e3 f0 f2 ff       	call   0x451ba0
  522abd:	83 c4 10             	add    esp,0x10
  522ac0:	eb 27                	jmp    0x522ae9
  522ac2:	83 ec 08             	sub    esp,0x8
  522ac5:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  522aca:	89 64 24 14          	mov    DWORD PTR [esp+0x14],esp
  522ace:	50                   	push   eax
  522acf:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  522ad3:	e8 98 34 ef ff       	call   0x415f70
  522ad8:	8d 44 24 18          	lea    eax,[esp+0x18]
  522adc:	50                   	push   eax
  522add:	6a 02                	push   0x2
  522adf:	6a 02                	push   0x2
  522ae1:	e8 7a 4e 00 00       	call   0x527960
  522ae6:	83 c4 14             	add    esp,0x14
  522ae9:	0f bf 05 cf c6 89 00 	movsx  eax,WORD PTR ds:0x89c6cf
  522af0:	6a 00                	push   0x0
  522af2:	50                   	push   eax
  522af3:	e8 78 32 f8 ff       	call   0x4a5d70
  522af8:	83 c4 08             	add    esp,0x8
  522afb:	f6 05 6c c6 89 00 80 	test   BYTE PTR ds:0x89c66c,0x80
  522b02:	74 1c                	je     0x522b20
  522b04:	e8 b7 56 f3 ff       	call   0x4581c0
  522b09:	f6 05 6c c6 89 00 80 	test   BYTE PTR ds:0x89c66c,0x80
  522b10:	74 0e                	je     0x522b20
  522b12:	a1 f8 9d 74 00       	mov    eax,ds:0x749df8
  522b17:	8b 0d f4 9d 74 00    	mov    ecx,DWORD PTR ds:0x749df4
  522b1d:	50                   	push   eax
  522b1e:	eb 0c                	jmp    0x522b2c
