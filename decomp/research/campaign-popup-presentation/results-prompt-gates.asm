
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00523fa0 <.text+0x122fa0>:
  523fa0:	81 ec 48 04 00 00    	sub    esp,0x448
  523fa6:	f6 05 69 c6 89 00 20 	test   BYTE PTR ds:0x89c669,0x20
  523fad:	53                   	push   ebx
  523fae:	56                   	push   esi
  523faf:	57                   	push   edi
  523fb0:	55                   	push   ebp
  523fb1:	0f 84 6d 0a 00 00    	je     0x524a24
  523fb7:	f6 05 66 c6 89 00 02 	test   BYTE PTR ds:0x89c666,0x2
  523fbe:	0f 85 60 0a 00 00    	jne    0x524a24
  523fc4:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  523fcb:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  523fcf:	a1 61 c6 89 00       	mov    eax,ds:0x89c661
  523fd4:	25 00 00 00 06       	and    eax,0x6000000
  523fd9:	83 f8 01             	cmp    eax,0x1
  523fdc:	1b c0                	sbb    eax,eax
  523fde:	40                   	inc    eax
  523fdf:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  523fe3:	e8 28 f2 f6 ff       	call   0x493210
  523fe8:	85 c0                	test   eax,eax
  523fea:	74 19                	je     0x524005
  523fec:	33 c0                	xor    eax,eax
  523fee:	a0 de 28 89 00       	mov    al,ds:0x8928de
  523ff3:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  523ffa:	51                   	push   ecx
  523ffb:	e8 40 db f2 ff       	call   0x451b40
  524000:	83 c4 04             	add    esp,0x4
  524003:	eb 1c                	jmp    0x524021
  524005:	33 c0                	xor    eax,eax
  524007:	a0 de 28 89 00       	mov    al,ds:0x8928de
  52400c:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  524013:	51                   	push   ecx
  524014:	68 88 16 59 00       	push   0x591688
  524019:	e8 12 2d ff ff       	call   0x516d30
  52401e:	83 c4 08             	add    esp,0x8
  524021:	0f bf 05 2a f0 88 00 	movsx  eax,WORD PTR ds:0x88f02a
  524028:	0f bf 0d f3 26 89 00 	movsx  ecx,WORD PTR ds:0x8926f3
  52402f:	2b                   	.byte 0x2b

populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0052495d <.text+0x12395d>:
  52495d:	83 7c 24 34 00       	cmp    DWORD PTR [esp+0x34],0x0
  524962:	0f 84 bc 00 00 00    	je     0x524a24
  524968:	80 3d 89 79 89 00 00 	cmp    BYTE PTR ds:0x897989,0x0
  52496f:	0f 84 af 00 00 00    	je     0x524a24
  524975:	0f bf 35 f3 26 89 00 	movsx  esi,WORD PTR ds:0x8926f3
  52497c:	a1 90 2f 97 00       	mov    eax,ds:0x972f90
  524981:	50                   	push   eax
  524982:	e8 a9 5c f7 ff       	call   0x49a630
  524987:	83 c4 04             	add    esp,0x4
  52498a:	2b f0                	sub    esi,eax
  52498c:	8b c6                	mov    eax,esi
  52498e:	8b 74 24 20          	mov    esi,DWORD PTR [esp+0x20]
  524992:	99                   	cdq
  524993:	2b c2                	sub    eax,edx
  524995:	c1 f8 01             	sar    eax,0x1
  524998:	03 f0                	add    esi,eax
  52499a:	0f bf 05 07 27 89 00 	movsx  eax,WORD PTR ds:0x892707
  5249a1:	99                   	cdq
  5249a2:	83 e2 03             	and    edx,0x3
  5249a5:	8b 7c 24 24          	mov    edi,DWORD PTR [esp+0x24]
  5249a9:	03 c2                	add    eax,edx
  5249ab:	c1 f8 02             	sar    eax,0x2
  5249ae:	0f bf 0d f5 26 89 00 	movsx  ecx,WORD PTR ds:0x8926f5
  5249b5:	0f bf c0             	movsx  eax,ax
  5249b8:	03 c1                	add    eax,ecx
  5249ba:	0f bf 0d d1 c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6d1
  5249c1:	03 f8                	add    edi,eax
  5249c3:	3b f9                	cmp    edi,ecx
  5249c5:	7e 0c                	jle    0x5249d3
  5249c7:	0f bf 05 07 27 89 00 	movsx  eax,WORD PTR ds:0x892707
  5249ce:	2b c8                	sub    ecx,eax
  5249d0:	8d 79 fe             	lea    edi,[ecx-0x2]
  5249d3:	e8 38 e8 f6 ff       	call   0x493210
  5249d8:	85 c0                	test   eax,eax
  5249da:	74 22                	je     0x5249fe
  5249dc:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  5249e1:	8b 0d 90 2f 97 00    	mov    ecx,DWORD PTR ds:0x972f90
  5249e7:	50                   	push   eax
  5249e8:	51                   	push   ecx
  5249e9:	57                   	push   edi
  5249ea:	56                   	push   esi
  5249eb:	e8 b0 d1 f2 ff       	call   0x451ba0
  5249f0:	83 c4 10             	add    esp,0x10
  5249f3:	5d                   	pop    ebp
  5249f4:	5f                   	pop    edi
  5249f5:	5e                   	pop    esi
  5249f6:	5b                   	pop    ebx
  5249f7:	81 c4 48 04 00 00    	add    esp,0x448
  5249fd:	c3                   	ret
  5249fe:	83 ec 08             	sub    esp,0x8
  524a01:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  524a06:	89 64 24 60          	mov    DWORD PTR [esp+0x60],esp
  524a0a:	50                   	push   eax
  524a0b:	8b 4c 24 64          	mov    ecx,DWORD PTR [esp+0x64]
  524a0f:	e8 5c 15 ef ff       	call   0x415f70
  524a14:	a1 90 2f 97 00       	mov    eax,ds:0x972f90
  524a19:	50                   	push   eax
  524a1a:	57                   	push   edi
  524a1b:	56                   	push   esi
  524a1c:	e8 3f 2f 00 00       	call   0x527960
  524a21:	83 c4 14             	add    esp,0x14
  524a24:	5d                   	pop    ebp
  524a25:	5f                   	pop    edi
  524a26:	5e                   	pop    esi
  524a27:	5b                   	pop    ebx
  524a28:	81                   	.byte 0x81
  524a29:	c4                   	.byte 0xc4
