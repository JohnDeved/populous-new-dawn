
/workspace/scratch/69fd8163d94e/populous-recovery-20261009/work/orchestration/original-data-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00511180 <.text+0x110180>:
  511180:	8b 54 24 08          	mov    edx,DWORD PTR [esp+0x8]
  511184:	83 ec 08             	sub    esp,0x8
  511187:	53                   	push   ebx
  511188:	56                   	push   esi
  511189:	8b 74 24 14          	mov    esi,DWORD PTR [esp+0x14]
  51118d:	57                   	push   edi
  51118e:	66 8b 4e 3f          	mov    cx,WORD PTR [esi+0x3f]
  511192:	55                   	push   ebp
  511193:	0f bf 1a             	movsx  ebx,WORD PTR [edx]
  511196:	0f bf 46 3d          	movsx  eax,WORD PTR [esi+0x3d]
  51119a:	2b d8                	sub    ebx,eax
  51119c:	0f bf 7a 02          	movsx  edi,WORD PTR [edx+0x2]
  5111a0:	0f bf c1             	movsx  eax,cx
  5111a3:	2b f8                	sub    edi,eax
  5111a5:	83 7c 24 24 00       	cmp    DWORD PTR [esp+0x24],0x0
  5111aa:	74 18                	je     0x5111c4
  5111ac:	8b c3                	mov    eax,ebx
  5111ae:	99                   	cdq
  5111af:	2b c2                	sub    eax,edx
  5111b1:	c1 f8 01             	sar    eax,0x1
  5111b4:	66 89 46 49          	mov    WORD PTR [esi+0x49],ax
  5111b8:	8b c7                	mov    eax,edi
  5111ba:	99                   	cdq
  5111bb:	2b c2                	sub    eax,edx
  5111bd:	c1 f8 01             	sar    eax,0x1
  5111c0:	66 89 46 4d          	mov    WORD PTR [esi+0x4d],ax
  5111c4:	8b c3                	mov    eax,ebx
  5111c6:	85 db                	test   ebx,ebx
  5111c8:	7d 04                	jge    0x5111ce
  5111ca:	8b c3                	mov    eax,ebx
  5111cc:	f7 d8                	neg    eax
  5111ce:	8b d7                	mov    edx,edi
  5111d0:	85 ff                	test   edi,edi
  5111d2:	7d 04                	jge    0x5111d8
  5111d4:	8b d7                	mov    edx,edi
  5111d6:	f7 da                	neg    edx
  5111d8:	8d 2c 10             	lea    ebp,[eax+edx*1]
  5111db:	39 6c 24 28          	cmp    DWORD PTR [esp+0x28],ebp
  5111df:	7e 0d                	jle    0x5111ee
  5111e1:	b8 01 00 00 00       	mov    eax,0x1
  5111e6:	5d                   	pop    ebp
  5111e7:	5f                   	pop    edi
  5111e8:	5e                   	pop    esi
  5111e9:	5b                   	pop    ebx
  5111ea:	83 c4 08             	add    esp,0x8
  5111ed:	c3                   	ret
  5111ee:	8b c3                	mov    eax,ebx
  5111f0:	c1 e0 05             	shl    eax,0x5
  5111f3:	99                   	cdq
  5111f4:	66 8b 5e 49          	mov    bx,WORD PTR [esi+0x49]
  5111f8:	f7 fd                	idiv   ebp
  5111fa:	66 03 d8             	add    bx,ax
  5111fd:	8b c7                	mov    eax,edi
  5111ff:	c1 e0 05             	shl    eax,0x5
  511202:	99                   	cdq
  511203:	66 89 5e 49          	mov    WORD PTR [esi+0x49],bx
  511207:	f7 fd                	idiv   ebp
  511209:	66 03 46 4d          	add    ax,WORD PTR [esi+0x4d]
  51120d:	66 89 46 4d          	mov    WORD PTR [esi+0x4d],ax
  511211:	66 83 fb c0          	cmp    bx,0xffc0
  511215:	7d 06                	jge    0x51121d
  511217:	66 c7 46 49 c0 ff    	mov    WORD PTR [esi+0x49],0xffc0
  51121d:	66 83 7e 49 40       	cmp    WORD PTR [esi+0x49],0x40
  511222:	7e 06                	jle    0x51122a
  511224:	66 c7 46 49 40 00    	mov    WORD PTR [esi+0x49],0x40
  51122a:	66 3d c0 ff          	cmp    ax,0xffc0
  51122e:	7d 06                	jge    0x511236
  511230:	66 c7 46 4d c0 ff    	mov    WORD PTR [esi+0x4d],0xffc0
  511236:	66 83 7e 4d 40       	cmp    WORD PTR [esi+0x4d],0x40
  51123b:	7e 06                	jle    0x511243
  51123d:	66 c7 46 4d 40 00    	mov    WORD PTR [esi+0x4d],0x40
  511243:	66 8b 46 49          	mov    ax,WORD PTR [esi+0x49]
  511247:	66 8b 56 41          	mov    dx,WORD PTR [esi+0x41]
  51124b:	66 03 46 3d          	add    ax,WORD PTR [esi+0x3d]
  51124f:	66 89 44 24 10       	mov    WORD PTR [esp+0x10],ax
  511254:	66 8b 46 4d          	mov    ax,WORD PTR [esi+0x4d]
  511258:	66 03 c1             	add    ax,cx
  51125b:	8d 4c 24 10          	lea    ecx,[esp+0x10]
  51125f:	66 89 54 24 14       	mov    WORD PTR [esp+0x14],dx
  511264:	51                   	push   ecx
  511265:	66 89 44 24 16       	mov    WORD PTR [esp+0x16],ax
  51126a:	56                   	push   esi
  51126b:	e8 10 d3 fd ff       	call   0x4ee580
  511270:	66 8b 4e 3f          	mov    cx,WORD PTR [esi+0x3f]
  511274:	83 c4 08             	add    esp,0x8
  511277:	66 8b 56 3d          	mov    dx,WORD PTR [esi+0x3d]
  51127b:	51                   	push   ecx
  51127c:	52                   	push   edx
  51127d:	e8 be d6 f3 ff       	call   0x44e940
  511282:	66 8b 7e 72          	mov    di,WORD PTR [esi+0x72]
  511286:	83 c4 08             	add    esp,0x8
  511289:	0f bf c8             	movsx  ecx,ax
  51128c:	0f bf c7             	movsx  eax,di
  51128f:	8d 1c 08             	lea    ebx,[eax+ecx*1]
  511292:	66 8b 46 41          	mov    ax,WORD PTR [esi+0x41]
  511296:	0f bf d0             	movsx  edx,ax
  511299:	3b d3                	cmp    edx,ebx
  51129b:	7e 16                	jle    0x5112b3
  51129d:	66 2d 23 00          	sub    ax,0x23
  5112a1:	0f bf d0             	movsx  edx,ax
  5112a4:	66 89 46 41          	mov    WORD PTR [esi+0x41],ax
  5112a8:	3b d3                	cmp    edx,ebx
  5112aa:	7d 07                	jge    0x5112b3
  5112ac:	66 03 f9             	add    di,cx
  5112af:	66 89 7e 41          	mov    WORD PTR [esi+0x41],di
  5112b3:	0f bf 46 41          	movsx  eax,WORD PTR [esi+0x41]
  5112b7:	3b c1                	cmp    eax,ecx
  5112b9:	7d 08                	jge    0x5112c3
  5112bb:	66 83 c1 02          	add    cx,0x2
  5112bf:	66 89 4e 41          	mov    WORD PTR [esi+0x41],cx
  5112c3:	33 c0                	xor    eax,eax
  5112c5:	5d                   	pop    ebp
  5112c6:	5f                   	pop    edi
  5112c7:	5e                   	pop    esi
  5112c8:	5b                   	pop    ebx
  5112c9:	83 c4 08             	add    esp,0x8
  5112cc:	c3                   	ret
  5112cd:	cc                   	int3
  5112ce:	cc                   	int3
  5112cf:	cc                   	int3
