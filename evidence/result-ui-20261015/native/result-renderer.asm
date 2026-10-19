
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


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
  52402f:	2b c1                	sub    eax,ecx
  524031:	99                   	cdq
  524032:	2b c2                	sub    eax,edx
  524034:	0f bf 0d 26 f0 88 00 	movsx  ecx,WORD PTR ds:0x88f026
  52403b:	c1 f8 01             	sar    eax,0x1
  52403e:	03 c8                	add    ecx,eax
  524040:	0f bf 15 f5 26 89 00 	movsx  edx,WORD PTR ds:0x8926f5
  524047:	0f bf 05 2c f0 88 00 	movsx  eax,WORD PTR ds:0x88f02c
  52404e:	2b c2                	sub    eax,edx
  524050:	89 4c 24 20          	mov    DWORD PTR [esp+0x20],ecx
  524054:	99                   	cdq
  524055:	2b c2                	sub    eax,edx
  524057:	0f bf 0d 28 f0 88 00 	movsx  ecx,WORD PTR ds:0x88f028
  52405e:	c1 f8 01             	sar    eax,0x1
  524061:	03 c8                	add    ecx,eax
  524063:	66 0f be 15 0d 27 89 	movsx  dx,BYTE PTR ds:0x89270d
  52406a:	00 
  52406b:	66 0f be 05 0e 27 89 	movsx  ax,BYTE PTR ds:0x89270e
  524072:	00 
  524073:	89 4c 24 24          	mov    DWORD PTR [esp+0x24],ecx
  524077:	50                   	push   eax
  524078:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  52407c:	52                   	push   edx
  52407d:	51                   	push   ecx
  52407e:	50                   	push   eax
  52407f:	e8 bc fc ff ff       	call   0x523d40
  524084:	8b 7c 24 30          	mov    edi,DWORD PTR [esp+0x30]
  524088:	83 c4 10             	add    esp,0x10
  52408b:	0f bf 15 fb 26 89 00 	movsx  edx,WORD PTR ds:0x8926fb
  524092:	0f bf 05 05 27 89 00 	movsx  eax,WORD PTR ds:0x892705
  524099:	0f bf 0d fd 26 89 00 	movsx  ecx,WORD PTR ds:0x8926fd
  5240a0:	03 fa                	add    edi,edx
  5240a2:	03 c1                	add    eax,ecx
  5240a4:	8b 5c 24 24          	mov    ebx,DWORD PTR [esp+0x24]
  5240a8:	6a 01                	push   0x1
  5240aa:	03 d8                	add    ebx,eax
  5240ac:	8d 8c 24 5c 03 00 00 	lea    ecx,[esp+0x35c]
  5240b3:	0f bf 05 dd c6 89 00 	movsx  eax,WORD PTR ds:0x89c6dd
  5240ba:	50                   	push   eax
  5240bb:	51                   	push   ecx
  5240bc:	e8 7f fb f9 ff       	call   0x4c3c40
  5240c1:	8d 8c 24 64 03 00 00 	lea    ecx,[esp+0x364]
  5240c8:	8d 94 24 64 01 00 00 	lea    edx,[esp+0x164]
  5240cf:	83 c4 0c             	add    esp,0xc
  5240d2:	51                   	push   ecx
  5240d3:	68 70 99 59 00       	push   0x599970
  5240d8:	52                   	push   edx
  5240d9:	e8 e2 74 03 00       	call   0x55b5c0
  5240de:	8d 8c 24 64 01 00 00 	lea    ecx,[esp+0x164]
  5240e5:	83 c4 0c             	add    esp,0xc
  5240e8:	0f bf 35 f7 26 89 00 	movsx  esi,WORD PTR ds:0x8926f7
  5240ef:	51                   	push   ecx
  5240f0:	e8 3b 65 f7 ff       	call   0x49a630
  5240f5:	83 c4 04             	add    esp,0x4
  5240f8:	2b f0                	sub    esi,eax
  5240fa:	8b c6                	mov    eax,esi
  5240fc:	99                   	cdq
  5240fd:	2b c2                	sub    eax,edx
  5240ff:	c1 f8 01             	sar    eax,0x1
  524102:	8d 34 07             	lea    esi,[edi+eax*1]
  524105:	e8 06 f1 f6 ff       	call   0x493210
  52410a:	85 c0                	test   eax,eax
  52410c:	74 1a                	je     0x524128
  52410e:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  524113:	8d 8c 24 58 01 00 00 	lea    ecx,[esp+0x158]
  52411a:	50                   	push   eax
  52411b:	51                   	push   ecx
  52411c:	53                   	push   ebx
  52411d:	56                   	push   esi
  52411e:	e8 7d da f2 ff       	call   0x451ba0
  524123:	83 c4 10             	add    esp,0x10
  524126:	eb 28                	jmp    0x524150
  524128:	83 ec 08             	sub    esp,0x8
  52412b:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  524130:	89 64 24 60          	mov    DWORD PTR [esp+0x60],esp
  524134:	50                   	push   eax
  524135:	8b 4c 24 64          	mov    ecx,DWORD PTR [esp+0x64]
  524139:	e8 32 1e ef ff       	call   0x415f70
  52413e:	8d 84 24 60 01 00 00 	lea    eax,[esp+0x160]
  524145:	50                   	push   eax
  524146:	53                   	push   ebx
  524147:	56                   	push   esi
  524148:	e8 13 38 00 00       	call   0x527960
  52414d:	83 c4 14             	add    esp,0x14
  524150:	0f bf 05 07 27 89 00 	movsx  eax,WORD PTR ds:0x892707
  524157:	03 d8                	add    ebx,eax
  524159:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  52415d:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  524164:	74 35                	je     0x52419b
  524166:	c1 e0 05             	shl    eax,0x5
  524169:	03 44 24 14          	add    eax,DWORD PTR [esp+0x14]
  52416d:	8b 0d 24 30 97 00    	mov    ecx,DWORD PTR ds:0x973024
  524173:	03 44 24 14          	add    eax,DWORD PTR [esp+0x14]
  524177:	05 5c 03 8a 00       	add    eax,0x8a035c
  52417c:	8d 94 24 58 01 00 00 	lea    edx,[esp+0x158]
  524183:	50                   	push   eax
  524184:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  524188:	40                   	inc    eax
  524189:	50                   	push   eax
  52418a:	51                   	push   ecx
  52418b:	68 cc dd 5d 00       	push   0x5dddcc
  524190:	52                   	push   edx
  524191:	e8 2a 74 03 00       	call   0x55b5c0
  524196:	83 c4 14             	add    esp,0x14
  524199:	eb 1e                	jmp    0x5241b9
  52419b:	40                   	inc    eax
  52419c:	8b 0d 24 30 97 00    	mov    ecx,DWORD PTR ds:0x973024
  5241a2:	8d 94 24 58 01 00 00 	lea    edx,[esp+0x158]
  5241a9:	50                   	push   eax
  5241aa:	51                   	push   ecx
  5241ab:	68 bc dd 5d 00       	push   0x5dddbc
  5241b0:	52                   	push   edx
  5241b1:	e8 0a 74 03 00       	call   0x55b5c0
  5241b6:	83 c4 10             	add    esp,0x10
  5241b9:	0f bf 35 f7 26 89 00 	movsx  esi,WORD PTR ds:0x8926f7
  5241c0:	8d 84 24 58 01 00 00 	lea    eax,[esp+0x158]
  5241c7:	50                   	push   eax
  5241c8:	e8 63 64 f7 ff       	call   0x49a630
  5241cd:	83 c4 04             	add    esp,0x4
  5241d0:	2b f0                	sub    esi,eax
  5241d2:	8b c6                	mov    eax,esi
  5241d4:	99                   	cdq
  5241d5:	2b c2                	sub    eax,edx
  5241d7:	c1 f8 01             	sar    eax,0x1
  5241da:	8d 34 07             	lea    esi,[edi+eax*1]
  5241dd:	e8 2e f0 f6 ff       	call   0x493210
  5241e2:	85 c0                	test   eax,eax
  5241e4:	74 1a                	je     0x524200
  5241e6:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  5241eb:	8d 8c 24 58 01 00 00 	lea    ecx,[esp+0x158]
  5241f2:	50                   	push   eax
  5241f3:	51                   	push   ecx
  5241f4:	53                   	push   ebx
  5241f5:	56                   	push   esi
  5241f6:	e8 a5 d9 f2 ff       	call   0x451ba0
  5241fb:	83 c4 10             	add    esp,0x10
  5241fe:	eb 28                	jmp    0x524228
  524200:	83 ec 08             	sub    esp,0x8
  524203:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  524208:	89 64 24 60          	mov    DWORD PTR [esp+0x60],esp
  52420c:	50                   	push   eax
  52420d:	8b 4c 24 64          	mov    ecx,DWORD PTR [esp+0x64]
  524211:	e8 5a 1d ef ff       	call   0x415f70
  524216:	8d 84 24 60 01 00 00 	lea    eax,[esp+0x160]
  52421d:	50                   	push   eax
  52421e:	53                   	push   ebx
  52421f:	56                   	push   esi
  524220:	e8 3b 37 00 00       	call   0x527960
  524225:	83 c4 14             	add    esp,0x14
  524228:	0f bf 05 07 27 89 00 	movsx  eax,WORD PTR ds:0x892707
  52422f:	03 d8                	add    ebx,eax
  524231:	f6 05 64 c6 89 00 02 	test   BYTE PTR ds:0x89c664,0x2
  524238:	74 07                	je     0x524241
  52423a:	a1 28 37 97 00       	mov    eax,ds:0x973728
  52423f:	eb 15                	jmp    0x524256
  524241:	f6 05 64 c6 89 00 04 	test   BYTE PTR ds:0x89c664,0x4
  524248:	74 07                	je     0x524251
  52424a:	a1 2c 37 97 00       	mov    eax,ds:0x97372c
  52424f:	eb 05                	jmp    0x524256
  524251:	a1 30 37 97 00       	mov    eax,ds:0x973730
  524256:	8d 8c 24 58 03 00 00 	lea    ecx,[esp+0x358]
  52425d:	50                   	push   eax
  52425e:	68 70 99 59 00       	push   0x599970
  524263:	51                   	push   ecx
  524264:	e8 57 73 03 00       	call   0x55b5c0
  524269:	8d 84 24 64 03 00 00 	lea    eax,[esp+0x364]
  524270:	8d 94 24 64 01 00 00 	lea    edx,[esp+0x164]
  524277:	83 c4 0c             	add    esp,0xc
  52427a:	8b 0d 24 37 97 00    	mov    ecx,DWORD PTR ds:0x973724
  524280:	50                   	push   eax
  524281:	51                   	push   ecx
  524282:	68 ac dd 5d 00       	push   0x5dddac
  524287:	52                   	push   edx
  524288:	e8 13 f7 f2 ff       	call   0x4539a0
  52428d:	8d 8c 24 68 01 00 00 	lea    ecx,[esp+0x168]
  524294:	83 c4 10             	add    esp,0x10
  524297:	0f bf 35 f7 26 89 00 	movsx  esi,WORD PTR ds:0x8926f7
  52429e:	51                   	push   ecx
  52429f:	e8 8c 63 f7 ff       	call   0x49a630
  5242a4:	83 c4 04             	add    esp,0x4
  5242a7:	2b f0                	sub    esi,eax
  5242a9:	8b c6                	mov    eax,esi
  5242ab:	99                   	cdq
  5242ac:	2b c2                	sub    eax,edx
  5242ae:	c1 f8 01             	sar    eax,0x1
  5242b1:	83 7c 24 34 00       	cmp    DWORD PTR [esp+0x34],0x0
  5242b6:	8d 34 07             	lea    esi,[edi+eax*1]
  5242b9:	74 24                	je     0x5242df
  5242bb:	80 3d 8b 79 89 00 00 	cmp    BYTE PTR ds:0x89798b,0x0
  5242c2:	74 1b                	je     0x5242df
  5242c4:	a1 24 37 97 00       	mov    eax,ds:0x973724
  5242c9:	8d 8c 24 58 01 00 00 	lea    ecx,[esp+0x158]
  5242d0:	50                   	push   eax
  5242d1:	68 a4 dd 5d 00       	push   0x5ddda4
  5242d6:	51                   	push   ecx
  5242d7:	e8 c4 f6 f2 ff       	call   0x4539a0
  5242dc:	83 c4 0c             	add    esp,0xc
  5242df:	e8 2c ef f6 ff       	call   0x493210
  5242e4:	85 c0                	test   eax,eax
  5242e6:	74 1a                	je     0x524302
  5242e8:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  5242ed:	8d 8c 24 58 01 00 00 	lea    ecx,[esp+0x158]
  5242f4:	50                   	push   eax
  5242f5:	51                   	push   ecx
  5242f6:	53                   	push   ebx
  5242f7:	56                   	push   esi
  5242f8:	e8 a3 d8 f2 ff       	call   0x451ba0
  5242fd:	83 c4 10             	add    esp,0x10
  524300:	eb 28                	jmp    0x52432a
  524302:	83 ec 08             	sub    esp,0x8
  524305:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  52430a:	89 64 24 60          	mov    DWORD PTR [esp+0x60],esp
  52430e:	50                   	push   eax
  52430f:	8b 4c 24 64          	mov    ecx,DWORD PTR [esp+0x64]
  524313:	e8 58 1c ef ff       	call   0x415f70
  524318:	8d 84 24 60 01 00 00 	lea    eax,[esp+0x160]
  52431f:	50                   	push   eax
  524320:	53                   	push   ebx
  524321:	56                   	push   esi
  524322:	e8 39 36 00 00       	call   0x527960
  524327:	83 c4 14             	add    esp,0x14
  52432a:	0f bf 2d 07 27 89 00 	movsx  ebp,WORD PTR ds:0x892707
  524331:	0f bf 05 ff 26 89 00 	movsx  eax,WORD PTR ds:0x8926ff
  524338:	0f bf 15 01 27 89 00 	movsx  edx,WORD PTR ds:0x892701
  52433f:	8d 34 38             	lea    esi,[eax+edi*1]
  524342:	03 d7                	add    edx,edi
  524344:	03 eb                	add    ebp,ebx
  524346:	89 54 24 18          	mov    DWORD PTR [esp+0x18],edx
  52434a:	0f bf 05 07 27 89 00 	movsx  eax,WORD PTR ds:0x892707
  524351:	99                   	cdq
  524352:	2b c2                	sub    eax,edx
  524354:	c1 f8 01             	sar    eax,0x1
  524357:	0f bf c8             	movsx  ecx,ax
  52435a:	a1 38 37 97 00       	mov    eax,ds:0x973738
  52435f:	8d 1c 29             	lea    ebx,[ecx+ebp*1]
  524362:	8d 8c 24 58 01 00 00 	lea    ecx,[esp+0x158]
  524369:	50                   	push   eax
  52436a:	68 70 99 59 00       	push   0x599970
  52436f:	51                   	push   ecx
  524370:	e8 4b 72 03 00       	call   0x55b5c0
  524375:	83 c4 0c             	add    esp,0xc
  524378:	e8 93 ee f6 ff       	call   0x493210
  52437d:	85 c0                	test   eax,eax
  52437f:	74 1a                	je     0x52439b
  524381:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  524386:	8d 8c 24 58 01 00 00 	lea    ecx,[esp+0x158]
  52438d:	50                   	push   eax
  52438e:	51                   	push   ecx
  52438f:	53                   	push   ebx
  524390:	56                   	push   esi
  524391:	e8 0a d8 f2 ff       	call   0x451ba0
  524396:	83 c4 10             	add    esp,0x10
  524399:	eb 28                	jmp    0x5243c3
  52439b:	83 ec 08             	sub    esp,0x8
  52439e:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  5243a3:	89 64 24 60          	mov    DWORD PTR [esp+0x60],esp
  5243a7:	50                   	push   eax
  5243a8:	8b 4c 24 64          	mov    ecx,DWORD PTR [esp+0x64]
  5243ac:	e8 bf 1b ef ff       	call   0x415f70
  5243b1:	8d 84 24 60 01 00 00 	lea    eax,[esp+0x160]
  5243b8:	50                   	push   eax
  5243b9:	53                   	push   ebx
  5243ba:	56                   	push   esi
  5243bb:	e8 a0 35 00 00       	call   0x527960
  5243c0:	83 c4 14             	add    esp,0x14
  5243c3:	f6 05 64 c6 89 00 06 	test   BYTE PTR ds:0x89c664,0x6
  5243ca:	74 09                	je     0x5243d5
  5243cc:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  5243d3:	74 17                	je     0x5243ec
  5243d5:	f6 05 66 c6 89 00 02 	test   BYTE PTR ds:0x89c666,0x2
  5243dc:	75 0e                	jne    0x5243ec
  5243de:	f6 05 61 c6 89 00 02 	test   BYTE PTR ds:0x89c661,0x2
  5243e5:	b8 01 00 00 00       	mov    eax,0x1
  5243ea:	74 02                	je     0x5243ee
  5243ec:	33 c0                	xor    eax,eax
  5243ee:	85 c0                	test   eax,eax
  5243f0:	74 1c                	je     0x52440e
  5243f2:	6a 00                	push   0x0
  5243f4:	e8 c7 71 ef ff       	call   0x41b5c0
  5243f9:	83 c4 04             	add    esp,0x4
  5243fc:	8b 3d c2 9d 96 00    	mov    edi,DWORD PTR ds:0x969dc2
  524402:	6a 00                	push   0x0
  524404:	e8 b7 71 ef ff       	call   0x41b5c0
  524409:	83 c4 04             	add    esp,0x4
  52440c:	eb 06                	jmp    0x524414
  52440e:	8b 3d c2 9d 96 00    	mov    edi,DWORD PTR ds:0x969dc2
  524414:	b9 e8 03 00 00       	mov    ecx,0x3e8
  524419:	8b c7                	mov    eax,edi
  52441b:	99                   	cdq
  52441c:	f7 f9                	idiv   ecx
  52441e:	8b c8                	mov    ecx,eax
  524420:	bf 10 0e 00 00       	mov    edi,0xe10
  524425:	99                   	cdq
  524426:	f7 ff                	idiv   edi
  524428:	8b f8                	mov    edi,eax
  52442a:	bd 3c 00 00 00       	mov    ebp,0x3c
  52442f:	8d 04 bf             	lea    eax,[edi+edi*4]
  524432:	8d 14 80             	lea    edx,[eax+eax*4]
  524435:	8d 04 d2             	lea    eax,[edx+edx*8]
  524438:	c1 e0 04             	shl    eax,0x4
  52443b:	f7 d8                	neg    eax
  52443d:	03 c8                	add    ecx,eax
  52443f:	8b c1                	mov    eax,ecx
  524441:	99                   	cdq
  524442:	f7 fd                	idiv   ebp
  524444:	8d 14 85 00 00 00 00 	lea    edx,[eax*4+0x0]
  52444b:	8d 2c 52             	lea    ebp,[edx+edx*2]
  52444e:	8d 54 ad 00          	lea    edx,[ebp+ebp*4+0x0]
  524452:	f7 da                	neg    edx
  524454:	03 ca                	add    ecx,edx
  524456:	51                   	push   ecx
  524457:	50                   	push   eax
  524458:	8d 84 24 60 01 00 00 	lea    eax,[esp+0x160]
  52445f:	57                   	push   edi
  524460:	68 74 dd 5d 00       	push   0x5ddd74
  524465:	50                   	push   eax
  524466:	e8 35 f5 f2 ff       	call   0x4539a0
  52446b:	83 c4 14             	add    esp,0x14
  52446e:	e8 9d ed f6 ff       	call   0x493210
  524473:	85 c0                	test   eax,eax
  524475:	74 1e                	je     0x524495
  524477:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  52447c:	8d 8c 24 58 01 00 00 	lea    ecx,[esp+0x158]
  524483:	8b 54 24 18          	mov    edx,DWORD PTR [esp+0x18]
  524487:	50                   	push   eax
  524488:	51                   	push   ecx
  524489:	53                   	push   ebx
  52448a:	52                   	push   edx
  52448b:	e8 10 d7 f2 ff       	call   0x451ba0
  524490:	83 c4 10             	add    esp,0x10
  524493:	eb 2c                	jmp    0x5244c1
  524495:	83 ec 08             	sub    esp,0x8
  524498:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  52449d:	89 64 24 60          	mov    DWORD PTR [esp+0x60],esp
  5244a1:	50                   	push   eax
  5244a2:	8b 4c 24 64          	mov    ecx,DWORD PTR [esp+0x64]
  5244a6:	e8 c5 1a ef ff       	call   0x415f70
  5244ab:	8d 84 24 60 01 00 00 	lea    eax,[esp+0x160]
  5244b2:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  5244b6:	50                   	push   eax
  5244b7:	53                   	push   ebx
  5244b8:	51                   	push   ecx
  5244b9:	e8 a2 34 00 00       	call   0x527960
  5244be:	83 c4 14             	add    esp,0x14
  5244c1:	0f bf 05 07 27 89 00 	movsx  eax,WORD PTR ds:0x892707
  5244c8:	66 83 3d 30 dd 5a 00 	cmp    WORD PTR ds:0x5add30,0x0
  5244cf:	00 
  5244d0:	bf 30 dd 5a 00       	mov    edi,0x5add30
  5244d5:	8d 2c 18             	lea    ebp,[eax+ebx*1]
  5244d8:	0f 84 90 00 00 00    	je     0x52456e
  5244de:	80 7f 03 00          	cmp    BYTE PTR [edi+0x3],0x0
  5244e2:	74 09                	je     0x5244ed
  5244e4:	0f bf 05 09 27 89 00 	movsx  eax,WORD PTR ds:0x892709
  5244eb:	03 e8                	add    ebp,eax
  5244ed:	0f bf 07             	movsx  eax,WORD PTR [edi]
  5244f0:	8d 94 24 58 01 00 00 	lea    edx,[esp+0x158]
  5244f7:	8b 0c 85 a8 2b 97 00 	mov    ecx,DWORD PTR [eax*4+0x972ba8]
  5244fe:	51                   	push   ecx
  5244ff:	68 70 99 59 00       	push   0x599970
  524504:	52                   	push   edx
  524505:	e8 b6 70 03 00       	call   0x55b5c0
  52450a:	83 c4 0c             	add    esp,0xc
  52450d:	e8 fe ec f6 ff       	call   0x493210
  524512:	85 c0                	test   eax,eax
  524514:	74 1a                	je     0x524530
  524516:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  52451b:	8d 8c 24 58 01 00 00 	lea    ecx,[esp+0x158]
  524522:	50                   	push   eax
  524523:	51                   	push   ecx
  524524:	55                   	push   ebp
  524525:	56                   	push   esi
  524526:	e8 75 d6 f2 ff       	call   0x451ba0
  52452b:	83 c4 10             	add    esp,0x10
  52452e:	eb 28                	jmp    0x524558
  524530:	83 ec 08             	sub    esp,0x8
  524533:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  524538:	89 64 24 60          	mov    DWORD PTR [esp+0x60],esp
  52453c:	50                   	push   eax
  52453d:	8b 4c 24 64          	mov    ecx,DWORD PTR [esp+0x64]
  524541:	e8 2a 1a ef ff       	call   0x415f70
  524546:	8d 84 24 60 01 00 00 	lea    eax,[esp+0x160]
  52454d:	50                   	push   eax
  52454e:	55                   	push   ebp
  52454f:	56                   	push   esi
  524550:	e8 0b 34 00 00       	call   0x527960
  524555:	83 c4 14             	add    esp,0x14
  524558:	0f bf 05 07 27 89 00 	movsx  eax,WORD PTR ds:0x892707
  52455f:	03 e8                	add    ebp,eax
  524561:	83 c7 04             	add    edi,0x4
  524564:	66 83 3f 00          	cmp    WORD PTR [edi],0x0
  524568:	0f 85 70 ff ff ff    	jne    0x5244de
  52456e:	8d 84 24 58 03 00 00 	lea    eax,[esp+0x358]
  524575:	68 5c dd 5d 00       	push   0x5ddd5c
  52457a:	50                   	push   eax
  52457b:	e8 20 f4 f2 ff       	call   0x4539a0
  524580:	8d 84 24 60 03 00 00 	lea    eax,[esp+0x360]
  524587:	83 c4 08             	add    esp,0x8
  52458a:	50                   	push   eax
  52458b:	e8 a0 60 f7 ff       	call   0x49a630
  524590:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  524594:	83 c4 04             	add    esp,0x4
  524597:	bf 30 dd 5a 00       	mov    edi,0x5add30
  52459c:	68 54 dd 5d 00       	push   0x5ddd54
  5245a1:	8d 84 24 5c 03 00 00 	lea    eax,[esp+0x35c]
  5245a8:	50                   	push   eax
  5245a9:	e8 f2 f3 f2 ff       	call   0x4539a0
  5245ae:	8d 8c 24 60 03 00 00 	lea    ecx,[esp+0x360]
  5245b5:	83 c4 08             	add    esp,0x8
  5245b8:	0f bf 05 07 27 89 00 	movsx  eax,WORD PTR ds:0x892707
  5245bf:	51                   	push   ecx
  5245c0:	8d 2c 18             	lea    ebp,[eax+ebx*1]
  5245c3:	e8 68 60 f7 ff       	call   0x49a630
  5245c8:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  5245cc:	83 c4 04             	add    esp,0x4
  5245cf:	03 c8                	add    ecx,eax
  5245d1:	89 4c 24 48          	mov    DWORD PTR [esp+0x48],ecx
  5245d5:	66 83 3d 30 dd 5a 00 	cmp    WORD PTR ds:0x5add30,0x0
  5245dc:	00 
  5245dd:	0f 84 1a 01 00 00    	je     0x5246fd
  5245e3:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  5245e7:	8d 04 40             	lea    eax,[eax+eax*2]
  5245ea:	c1 e0 02             	shl    eax,0x2
  5245ed:	89 44 24 38          	mov    DWORD PTR [esp+0x38],eax
  5245f1:	80 7f 03 00          	cmp    BYTE PTR [edi+0x3],0x0
  5245f5:	74 09                	je     0x524600
  5245f7:	0f bf 05 09 27 89 00 	movsx  eax,WORD PTR ds:0x892709
  5245fe:	03 e8                	add    ebp,eax
  524600:	e8 0b ec f6 ff       	call   0x493210
  524605:	85 c0                	test   eax,eax
  524607:	74 1e                	je     0x524627
  524609:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  52460e:	8d 8c 24 58 03 00 00 	lea    ecx,[esp+0x358]
  524615:	8b 54 24 18          	mov    edx,DWORD PTR [esp+0x18]
  524619:	50                   	push   eax
  52461a:	51                   	push   ecx
  52461b:	55                   	push   ebp
  52461c:	52                   	push   edx
  52461d:	e8 7e d5 f2 ff       	call   0x451ba0
  524622:	83 c4 10             	add    esp,0x10
  524625:	eb 2c                	jmp    0x524653
  524627:	83 ec 08             	sub    esp,0x8
  52462a:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  52462f:	89 64 24 60          	mov    DWORD PTR [esp+0x60],esp
  524633:	50                   	push   eax
  524634:	8b 4c 24 64          	mov    ecx,DWORD PTR [esp+0x64]
  524638:	e8 33 19 ef ff       	call   0x415f70
  52463d:	8d 84 24 60 03 00 00 	lea    eax,[esp+0x360]
  524644:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  524648:	50                   	push   eax
  524649:	55                   	push   ebp
  52464a:	51                   	push   ecx
  52464b:	e8 10 33 00 00       	call   0x527960
  524650:	83 c4 14             	add    esp,0x14
  524653:	0f be 47 02          	movsx  eax,BYTE PTR [edi+0x2]
  524657:	03 44 24 38          	add    eax,DWORD PTR [esp+0x38]
  52465b:	8d 94 24 58 01 00 00 	lea    edx,[esp+0x158]
  524662:	8b 0c 85 c6 9d 96 00 	mov    ecx,DWORD PTR [eax*4+0x969dc6]
  524669:	51                   	push   ecx
  52466a:	68 00 cd 59 00       	push   0x59cd00
  52466f:	52                   	push   edx
  524670:	e8 2b f3 f2 ff       	call   0x4539a0
  524675:	8b 5c 24 28          	mov    ebx,DWORD PTR [esp+0x28]
  524679:	8d 8c 24 64 01 00 00 	lea    ecx,[esp+0x164]
  524680:	83 c4 0c             	add    esp,0xc
  524683:	51                   	push   ecx
  524684:	e8 a7 5f f7 ff       	call   0x49a630
  524689:	83 c4 04             	add    esp,0x4
  52468c:	2b d8                	sub    ebx,eax
  52468e:	8b c3                	mov    eax,ebx
  524690:	8b 5c 24 48          	mov    ebx,DWORD PTR [esp+0x48]
  524694:	99                   	cdq
  524695:	2b c2                	sub    eax,edx
  524697:	c1 f8 01             	sar    eax,0x1
  52469a:	03 d8                	add    ebx,eax
  52469c:	e8 6f eb f6 ff       	call   0x493210
  5246a1:	85 c0                	test   eax,eax
  5246a3:	74 1a                	je     0x5246bf
  5246a5:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  5246aa:	8d 8c 24 58 01 00 00 	lea    ecx,[esp+0x158]
  5246b1:	50                   	push   eax
  5246b2:	51                   	push   ecx
  5246b3:	55                   	push   ebp
  5246b4:	53                   	push   ebx
  5246b5:	e8 e6 d4 f2 ff       	call   0x451ba0
  5246ba:	83 c4 10             	add    esp,0x10
  5246bd:	eb 28                	jmp    0x5246e7
  5246bf:	83 ec 08             	sub    esp,0x8
  5246c2:	a0 9c 48 98 00       	mov    al,ds:0x98489c
  5246c7:	89 64 24 18          	mov    DWORD PTR [esp+0x18],esp
  5246cb:	50                   	push   eax
  5246cc:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  5246d0:	e8 9b 18 ef ff       	call   0x415f70
  5246d5:	8d 84 24 60 01 00 00 	lea    eax,[esp+0x160]
  5246dc:	50                   	push   eax
  5246dd:	55                   	push   ebp
  5246de:	53                   	push   ebx
  5246df:	e8 7c 32 00 00       	call   0x527960
  5246e4:	83 c4 14             	add    esp,0x14
  5246e7:	0f bf 05 07 27 89 00 	movsx  eax,WORD PTR ds:0x892707
  5246ee:	03 e8                	add    ebp,eax
  5246f0:	83 c7 04             	add    edi,0x4
  5246f3:	66 83 3f 00          	cmp    WORD PTR [edi],0x0
  5246f7:	0f 85 f4 fe ff ff    	jne    0x5245f1
  5246fd:	80 3d d3 ea 96 00 00 	cmp    BYTE PTR ds:0x96ead3,0x0
  524704:	0f 84 53 02 00 00    	je     0x52495d
  52470a:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  52470f:	33 c9                	xor    ecx,ecx
  524711:	66 8b 88 24 20 00 00 	mov    cx,WORD PTR [eax+0x2024]
  524718:	89 4c 24 1c          	mov    DWORD PTR [esp+0x1c],ecx
  52471c:	33 c9                	xor    ecx,ecx
  52471e:	80 3d 0f 27 89 00 00 	cmp    BYTE PTR ds:0x89270f,0x0
  524725:	66 8b 88 26 20 00 00 	mov    cx,WORD PTR [eax+0x2026]
  52472c:	89 4c 24 30          	mov    DWORD PTR [esp+0x30],ecx
  524730:	75 44                	jne    0x524776
  524732:	0f be 05 10 27 89 00 	movsx  eax,BYTE PTR ds:0x892710
  524739:	0f be 3d cf ea 96 00 	movsx  edi,BYTE PTR ds:0x96eacf
  524740:	0f bf 15 f7 26 89 00 	movsx  edx,WORD PTR ds:0x8926f7
  524747:	0f bf 0d 03 27 89 00 	movsx  ecx,WORD PTR ds:0x892703
  52474e:	03 44 24 1c          	add    eax,DWORD PTR [esp+0x1c]
  524752:	03 c9                	add    ecx,ecx
  524754:	2b d1                	sub    edx,ecx
  524756:	8d 4f ff             	lea    ecx,[edi-0x1]
  524759:	0f af c8             	imul   ecx,eax
  52475c:	03 4c 24 1c          	add    ecx,DWORD PTR [esp+0x1c]
  524760:	3b ca                	cmp    ecx,edx
  524762:	7e 05                	jle    0x524769
  524764:	8b c2                	mov    eax,edx
  524766:	99                   	cdq
  524767:	f7 ff                	idiv   edi
  524769:	c6 05 0f 27 89 00 01 	mov    BYTE PTR ds:0x89270f,0x1
  524770:	66 a3 0b 27 89 00    	mov    ds:0x89270b,ax
  524776:	33 ff                	xor    edi,edi
  524778:	ba de 80 5a 00       	mov    edx,0x5a80de
  52477d:	8d 5c 24 58          	lea    ebx,[esp+0x58]
  524781:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  524785:	c1 e0 04             	shl    eax,0x4
  524788:	89 7c 24 10          	mov    DWORD PTR [esp+0x10],edi
  52478c:	8d 0c 40             	lea    ecx,[eax+eax*2]
  52478f:	89 4c 24 48          	mov    DWORD PTR [esp+0x48],ecx
  524793:	8b 81 ee 9d 96 00    	mov    eax,DWORD PTR [ecx+0x969dee]
  524799:	89 44 24 38          	mov    DWORD PTR [esp+0x38],eax
  52479d:	8a 4c 24 10          	mov    cl,BYTE PTR [esp+0x10]
  5247a1:	b8 01 00 00 00       	mov    eax,0x1
  5247a6:	d3 e0                	shl    eax,cl
  5247a8:	85 44 24 38          	test   DWORD PTR [esp+0x38],eax
  5247ac:	74 1b                	je     0x5247c9
  5247ae:	b8 01 00 00 00       	mov    eax,0x1
  5247b3:	d3 e0                	shl    eax,cl
  5247b5:	85 05 8a aa 96 00    	test   DWORD PTR ds:0x96aa8a,eax
  5247bb:	74 0c                	je     0x5247c9
  5247bd:	33 c0                	xor    eax,eax
  5247bf:	83 c3 04             	add    ebx,0x4
  5247c2:	66 8b 02             	mov    ax,WORD PTR [edx]
  5247c5:	47                   	inc    edi
  5247c6:	89 43 fc             	mov    DWORD PTR [ebx-0x4],eax
  5247c9:	83 c2 3e             	add    edx,0x3e
  5247cc:	ff 44 24 10          	inc    DWORD PTR [esp+0x10]
  5247d0:	81 fa f4 85 5a 00    	cmp    edx,0x5a85f4
  5247d6:	76 c5                	jbe    0x52479d
  5247d8:	c7 44 24 10 01 00 00 	mov    DWORD PTR [esp+0x10],0x1
  5247df:	00 
  5247e0:	8b 4c 24 48          	mov    ecx,DWORD PTR [esp+0x48]
  5247e4:	ba 7e 72 5a 00       	mov    edx,0x5a727e
  5247e9:	8d 44 bc 58          	lea    eax,[esp+edi*4+0x58]
  5247ed:	8b 99 f2 9d 96 00    	mov    ebx,DWORD PTR [ecx+0x969df2]
  5247f3:	89 5c 24 38          	mov    DWORD PTR [esp+0x38],ebx
  5247f7:	8a 4c 24 10          	mov    cl,BYTE PTR [esp+0x10]
  5247fb:	bb 01 00 00 00       	mov    ebx,0x1
  524800:	d3 e3                	shl    ebx,cl
  524802:	85 5c 24 38          	test   DWORD PTR [esp+0x38],ebx
  524806:	74 1b                	je     0x524823
  524808:	bb 01 00 00 00       	mov    ebx,0x1
  52480d:	d3 e3                	shl    ebx,cl
  52480f:	85 1d 8e aa 96 00    	test   DWORD PTR ds:0x96aa8e,ebx
  524815:	74 0c                	je     0x524823
  524817:	33 c9                	xor    ecx,ecx
  524819:	83 c0 04             	add    eax,0x4
  52481c:	66 8b 0a             	mov    cx,WORD PTR [edx]
  52481f:	47                   	inc    edi
  524820:	89 48 fc             	mov    DWORD PTR [eax-0x4],ecx
  524823:	83 c2 4c             	add    edx,0x4c
  524826:	ff 44 24 10          	inc    DWORD PTR [esp+0x10]
  52482a:	81 fa d6 77 5a 00    	cmp    edx,0x5a77d6
  524830:	76 c5                	jbe    0x5247f7
  524832:	0f bf 05 0b 27 89 00 	movsx  eax,WORD PTR ds:0x89270b
  524839:	0f be 0d 11 27 89 00 	movsx  ecx,BYTE PTR ds:0x892711
  524840:	03 e9                	add    ebp,ecx
  524842:	33 db                	xor    ebx,ebx
  524844:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  524848:	38 1d d3 ea 96 00    	cmp    BYTE PTR ds:0x96ead3,bl
  52484e:	0f 8e 09 01 00 00    	jle    0x52495d
  524854:	8b 44 24 30          	mov    eax,DWORD PTR [esp+0x30]
  524858:	03 c5                	add    eax,ebp
  52485a:	89 44 24 2c          	mov    DWORD PTR [esp+0x2c],eax
  52485e:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  524862:	8b 44 24 2c          	mov    eax,DWORD PTR [esp+0x2c]
  524866:	03 ce                	add    ecx,esi
  524868:	83 ec 08             	sub    esp,0x8
  52486b:	83 0d 74 a0 5d 00 08 	or     DWORD PTR ds:0x5da074,0x8
  524872:	89 74 24 40          	mov    DWORD PTR [esp+0x40],esi
  524876:	8a 15 f4 c6 89 00    	mov    dl,BYTE PTR ds:0x89c6f4
  52487c:	89 4c 24 30          	mov    DWORD PTR [esp+0x30],ecx
  524880:	89 4c 24 48          	mov    DWORD PTR [esp+0x48],ecx
  524884:	89 6c 24 44          	mov    DWORD PTR [esp+0x44],ebp
  524888:	89 64 24 18          	mov    DWORD PTR [esp+0x18],esp
  52488c:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  524890:	52                   	push   edx
  524891:	89 44 24 50          	mov    DWORD PTR [esp+0x50],eax
  524895:	e8 d6 16 ef ff       	call   0x415f70
  52489a:	8d 4c 24 40          	lea    ecx,[esp+0x40]
  52489e:	51                   	push   ecx
  52489f:	e8 ec 1f ff ff       	call   0x516890
  5248a4:	8b 4c 24 34          	mov    ecx,DWORD PTR [esp+0x34]
  5248a8:	8b 54 24 38          	mov    edx,DWORD PTR [esp+0x38]
  5248ac:	83 c4 0c             	add    esp,0xc
  5248af:	a0 f5 c6 89 00       	mov    al,ds:0x89c6f5
  5248b4:	83 25 74 a0 5d 00 f7 	and    DWORD PTR ds:0x5da074,0xfffffff7
  5248bb:	89 74 24 48          	mov    DWORD PTR [esp+0x48],esi
  5248bf:	83 ec 08             	sub    esp,0x8
  5248c2:	83 0d 74 a0 5d 00 04 	or     DWORD PTR ds:0x5da074,0x4
  5248c9:	89 4c 24 58          	mov    DWORD PTR [esp+0x58],ecx
  5248cd:	89 64 24 20          	mov    DWORD PTR [esp+0x20],esp
  5248d1:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  5248d5:	50                   	push   eax
  5248d6:	89 6c 24 58          	mov    DWORD PTR [esp+0x58],ebp
  5248da:	89 54 24 60          	mov    DWORD PTR [esp+0x60],edx
  5248de:	e8 8d 16 ef ff       	call   0x415f70
  5248e3:	8d 4c 24 50          	lea    ecx,[esp+0x50]
  5248e7:	51                   	push   ecx
  5248e8:	e8 a3 1f ff ff       	call   0x516890
  5248ed:	83 25 74 a0 5d 00 fb 	and    DWORD PTR ds:0x5da074,0xfffffffb
  5248f4:	83 c4 0c             	add    esp,0xc
  5248f7:	3b fb                	cmp    edi,ebx
  5248f9:	7f 0e                	jg     0x524909
  5248fb:	8b 0d 14 df 59 00    	mov    ecx,DWORD PTR ds:0x59df14
  524901:	81 c1 18 20 00 00    	add    ecx,0x2018
  524907:	eb 0d                	jmp    0x524916
  524909:	8b 4c 9c 58          	mov    ecx,DWORD PTR [esp+ebx*4+0x58]
  52490d:	c1 e1 03             	shl    ecx,0x3
  524910:	03 0d 14 df 59 00    	add    ecx,DWORD PTR ds:0x59df14
  524916:	8b 44 24 30          	mov    eax,DWORD PTR [esp+0x30]
  52491a:	51                   	push   ecx
  52491b:	33 d2                	xor    edx,edx
  52491d:	43                   	inc    ebx
  52491e:	66 8b 51 06          	mov    dx,WORD PTR [ecx+0x6]
  524922:	2b c2                	sub    eax,edx
  524924:	99                   	cdq
  524925:	2b c2                	sub    eax,edx
  524927:	33 d2                	xor    edx,edx
  524929:	c1 f8 01             	sar    eax,0x1
  52492c:	66 8b 51 04          	mov    dx,WORD PTR [ecx+0x4]
  524930:	03 c5                	add    eax,ebp
  524932:	50                   	push   eax
  524933:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  524937:	2b c2                	sub    eax,edx
  524939:	99                   	cdq
  52493a:	2b c2                	sub    eax,edx
  52493c:	c1 f8 01             	sar    eax,0x1
  52493f:	03 c6                	add    eax,esi
  524941:	50                   	push   eax
  524942:	e8 99 19 ff ff       	call   0x5162e0
  524947:	03 74 24 20          	add    esi,DWORD PTR [esp+0x20]
  52494b:	83 c4 0c             	add    esp,0xc
  52494e:	0f be 05 d3 ea 96 00 	movsx  eax,BYTE PTR ds:0x96ead3
  524955:	3b c3                	cmp    eax,ebx
  524957:	0f 8f 01 ff ff ff    	jg     0x52485e
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
  524a28:	81 c4 48 04 00 00    	add    esp,0x448
  524a2e:	c3                   	ret
  524a2f:	cc                   	int3
