
/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004ce0a0 <.text+0xcd0a0>:
  4ce0a0:	53                   	push   ebx
  4ce0a1:	56                   	push   esi
  4ce0a2:	8b 5c 24 10          	mov    ebx,DWORD PTR [esp+0x10]
  4ce0a6:	57                   	push   edi
  4ce0a7:	8b 7c 24 10          	mov    edi,DWORD PTR [esp+0x10]
  4ce0ab:	55                   	push   ebp
  4ce0ac:	8d 04 db             	lea    eax,[ebx+ebx*8]
  4ce0af:	8b b7 81 08 00 00    	mov    esi,DWORD PTR [edi+0x881]
  4ce0b5:	8d 04 c0             	lea    eax,[eax+eax*8]
  4ce0b8:	03 c3                	add    eax,ebx
  4ce0ba:	83 7c 24 24 00       	cmp    DWORD PTR [esp+0x24],0x0
  4ce0bf:	8d 6c 38 e4          	lea    ebp,[eax+edi*1-0x1c]
  4ce0c3:	74 4e                	je     0x4ce113
  4ce0c5:	85 f6                	test   esi,esi
  4ce0c7:	0f 84 81 00 00 00    	je     0x4ce14e
  4ce0cd:	53                   	push   ebx
  4ce0ce:	56                   	push   esi
  4ce0cf:	e8 8c 43 02 00       	call   0x4f2460
  4ce0d4:	83 c4 08             	add    esp,0x8
  4ce0d7:	85 c0                	test   eax,eax
  4ce0d9:	74 2f                	je     0x4ce10a
  4ce0db:	56                   	push   esi
  4ce0dc:	e8 1f 5a 02 00       	call   0x4f3b00
  4ce0e1:	83 c4 04             	add    esp,0x4
  4ce0e4:	85 c0                	test   eax,eax
  4ce0e6:	75 22                	jne    0x4ce10a
  4ce0e8:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  4ce0ec:	75 1c                	jne    0x4ce10a
  4ce0ee:	8a 46 2c             	mov    al,BYTE PTR [esi+0x2c]
  4ce0f1:	56                   	push   esi
  4ce0f2:	88 46 7d             	mov    BYTE PTR [esi+0x7d],al
  4ce0f5:	e8 f6 f5 01 00       	call   0x4ed6f0
  4ce0fa:	83 c4 04             	add    esp,0x4
  4ce0fd:	c6 46 2c 0e          	mov    BYTE PTR [esi+0x2c],0xe
  4ce101:	56                   	push   esi
  4ce102:	e8 39 f5 01 00       	call   0x4ed640
  4ce107:	83 c4 04             	add    esp,0x4
  4ce10a:	8b 76 08             	mov    esi,DWORD PTR [esi+0x8]
  4ce10d:	85 f6                	test   esi,esi
  4ce10f:	75 bc                	jne    0x4ce0cd
  4ce111:	eb 3b                	jmp    0x4ce14e
  4ce113:	85 f6                	test   esi,esi
  4ce115:	74 37                	je     0x4ce14e
  4ce117:	53                   	push   ebx
  4ce118:	56                   	push   esi
  4ce119:	e8 42 43 02 00       	call   0x4f2460
  4ce11e:	83 c4 08             	add    esp,0x8
  4ce121:	85 c0                	test   eax,eax
  4ce123:	74 22                	je     0x4ce147
  4ce125:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  4ce129:	75 1c                	jne    0x4ce147
  4ce12b:	8a 46 2c             	mov    al,BYTE PTR [esi+0x2c]
  4ce12e:	56                   	push   esi
  4ce12f:	88 46 7d             	mov    BYTE PTR [esi+0x7d],al
  4ce132:	e8 b9 f5 01 00       	call   0x4ed6f0
  4ce137:	83 c4 04             	add    esp,0x4
  4ce13a:	c6 46 2c 0e          	mov    BYTE PTR [esi+0x2c],0xe
  4ce13e:	56                   	push   esi
  4ce13f:	e8 fc f4 01 00       	call   0x4ed640
  4ce144:	83 c4 04             	add    esp,0x4
  4ce147:	8b 76 08             	mov    esi,DWORD PTR [esi+0x8]
  4ce14a:	85 f6                	test   esi,esi
  4ce14c:	75 c9                	jne    0x4ce117
  4ce14e:	66 8b 45 0e          	mov    ax,WORD PTR [ebp+0xe]
  4ce152:	66 3d ff ff          	cmp    ax,0xffff
  4ce156:	74 1b                	je     0x4ce173
  4ce158:	8a 4d 2d             	mov    cl,BYTE PTR [ebp+0x2d]
  4ce15b:	80 f9 03             	cmp    cl,0x3
  4ce15e:	74 05                	je     0x4ce165
  4ce160:	80 f9 01             	cmp    cl,0x1
  4ce163:	75 0e                	jne    0x4ce173
  4ce165:	50                   	push   eax
  4ce166:	6a 00                	push   0x0
  4ce168:	6a 03                	push   0x3
  4ce16a:	57                   	push   edi
  4ce16b:	e8 c0 75 f6 ff       	call   0x435730
  4ce170:	83 c4 10             	add    esp,0x10
  4ce173:	66 8b 74 24 1c       	mov    si,WORD PTR [esp+0x1c]
  4ce178:	56                   	push   esi
  4ce179:	68 08 08 00 00       	push   0x808
  4ce17e:	6a 13                	push   0x13
  4ce180:	57                   	push   edi
  4ce181:	e8 aa 75 f6 ff       	call   0x435730
  4ce186:	83 c4 10             	add    esp,0x10
  4ce189:	6a 06                	push   0x6
  4ce18b:	6a 03                	push   0x3
  4ce18d:	6a 02                	push   0x2
  4ce18f:	57                   	push   edi
  4ce190:	e8 1b 78 f6 ff       	call   0x4359b0
  4ce195:	83 c4 10             	add    esp,0x10
  4ce198:	6a 06                	push   0x6
  4ce19a:	6a 03                	push   0x3
  4ce19c:	6a 02                	push   0x2
  4ce19e:	6a 0e                	push   0xe
  4ce1a0:	57                   	push   edi
  4ce1a1:	e8 da cf f4 ff       	call   0x41b180
  4ce1a6:	66 8b 4d 0e          	mov    cx,WORD PTR [ebp+0xe]
  4ce1aa:	83 c4 14             	add    esp,0x14
  4ce1ad:	66 83 f9 ff          	cmp    cx,0xffff
  4ce1b1:	74 19                	je     0x4ce1cc
  4ce1b3:	8a 45 2d             	mov    al,BYTE PTR [ebp+0x2d]
  4ce1b6:	3c 03                	cmp    al,0x3
  4ce1b8:	74 04                	je     0x4ce1be
  4ce1ba:	3c 01                	cmp    al,0x1
  4ce1bc:	75 0e                	jne    0x4ce1cc
  4ce1be:	51                   	push   ecx
  4ce1bf:	6a 00                	push   0x0
  4ce1c1:	6a 03                	push   0x3
  4ce1c3:	57                   	push   edi
  4ce1c4:	e8 67 75 f6 ff       	call   0x435730
  4ce1c9:	83 c4 10             	add    esp,0x10
  4ce1cc:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  4ce1d0:	6a 00                	push   0x0
  4ce1d2:	50                   	push   eax
  4ce1d3:	6a 10                	push   0x10
  4ce1d5:	57                   	push   edi
  4ce1d6:	e8 55 75 f6 ff       	call   0x435730
  4ce1db:	83 c4 10             	add    esp,0x10
  4ce1de:	56                   	push   esi
  4ce1df:	68 08 08 00 00       	push   0x808
  4ce1e4:	6a 13                	push   0x13
  4ce1e6:	57                   	push   edi
  4ce1e7:	e8 44 75 f6 ff       	call   0x435730
  4ce1ec:	83 c4 10             	add    esp,0x10
  4ce1ef:	6a ff                	push   0xffffffff
  4ce1f1:	6a ff                	push   0xffffffff
  4ce1f3:	6a 05                	push   0x5
  4ce1f5:	57                   	push   edi
  4ce1f6:	e8 b5 77 f6 ff       	call   0x4359b0
  4ce1fb:	83 c4 10             	add    esp,0x10
  4ce1fe:	6a ff                	push   0xffffffff
  4ce200:	6a ff                	push   0xffffffff
  4ce202:	6a 05                	push   0x5
  4ce204:	6a 0e                	push   0xe
  4ce206:	57                   	push   edi
  4ce207:	e8 74 cf f4 ff       	call   0x41b180
  4ce20c:	66 8b 4d 0e          	mov    cx,WORD PTR [ebp+0xe]
  4ce210:	83 c4 14             	add    esp,0x14
  4ce213:	66 83 f9 ff          	cmp    cx,0xffff
  4ce217:	74 19                	je     0x4ce232
  4ce219:	8a 45 2d             	mov    al,BYTE PTR [ebp+0x2d]
  4ce21c:	3c 03                	cmp    al,0x3
  4ce21e:	74 04                	je     0x4ce224
  4ce220:	3c 01                	cmp    al,0x1
  4ce222:	75 0e                	jne    0x4ce232
  4ce224:	51                   	push   ecx
  4ce225:	6a 00                	push   0x0
  4ce227:	6a 03                	push   0x3
  4ce229:	57                   	push   edi
  4ce22a:	e8 01 75 f6 ff       	call   0x435730
  4ce22f:	83 c4 10             	add    esp,0x10
  4ce232:	56                   	push   esi
  4ce233:	6a 00                	push   0x0
  4ce235:	6a 11                	push   0x11
  4ce237:	57                   	push   edi
  4ce238:	e8 f3 74 f6 ff       	call   0x435730
  4ce23d:	83 c4 10             	add    esp,0x10
  4ce240:	6a ff                	push   0xffffffff
  4ce242:	6a ff                	push   0xffffffff
  4ce244:	6a 04                	push   0x4
  4ce246:	57                   	push   edi
  4ce247:	e8 64 77 f6 ff       	call   0x4359b0
  4ce24c:	83 c4 10             	add    esp,0x10
  4ce24f:	6a ff                	push   0xffffffff
  4ce251:	6a ff                	push   0xffffffff
  4ce253:	6a 04                	push   0x4
  4ce255:	6a 0e                	push   0xe
  4ce257:	57                   	push   edi
  4ce258:	e8 23 cf f4 ff       	call   0x41b180
  4ce25d:	66 8b 45 0e          	mov    ax,WORD PTR [ebp+0xe]
  4ce261:	83 c4 14             	add    esp,0x14
  4ce264:	66 3d ff ff          	cmp    ax,0xffff
  4ce268:	74 1b                	je     0x4ce285
  4ce26a:	8a 4d 2d             	mov    cl,BYTE PTR [ebp+0x2d]
  4ce26d:	80 f9 03             	cmp    cl,0x3
  4ce270:	74 05                	je     0x4ce277
  4ce272:	80 f9 01             	cmp    cl,0x1
  4ce275:	75 0e                	jne    0x4ce285
  4ce277:	50                   	push   eax
  4ce278:	6a 00                	push   0x0
  4ce27a:	6a 03                	push   0x3
  4ce27c:	57                   	push   edi
  4ce27d:	e8 ae 74 f6 ff       	call   0x435730
  4ce282:	83 c4 10             	add    esp,0x10
  4ce285:	56                   	push   esi
  4ce286:	6a 00                	push   0x0
  4ce288:	6a 03                	push   0x3
  4ce28a:	57                   	push   edi
  4ce28b:	e8 a0 74 f6 ff       	call   0x435730
  4ce290:	83 c4 10             	add    esp,0x10
  4ce293:	6a ff                	push   0xffffffff
  4ce295:	6a ff                	push   0xffffffff
  4ce297:	6a 07                	push   0x7
  4ce299:	57                   	push   edi
  4ce29a:	e8 11 77 f6 ff       	call   0x4359b0
  4ce29f:	83 c4 10             	add    esp,0x10
  4ce2a2:	6a ff                	push   0xffffffff
  4ce2a4:	6a ff                	push   0xffffffff
  4ce2a6:	6a 07                	push   0x7
  4ce2a8:	6a 0e                	push   0xe
  4ce2aa:	57                   	push   edi
  4ce2ab:	e8 d0 ce f4 ff       	call   0x41b180
  4ce2b0:	83 c4 14             	add    esp,0x14
  4ce2b3:	5d                   	pop    ebp
  4ce2b4:	5f                   	pop    edi
  4ce2b5:	5e                   	pop    esi
  4ce2b6:	5b                   	pop    ebx
  4ce2b7:	c3                   	ret
