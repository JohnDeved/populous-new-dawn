
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00492ff0 <.text+0x91ff0>:
  492ff0:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  492ff6:	55                   	push   ebp
  492ff7:	8b ec                	mov    ebp,esp
  492ff9:	6a ff                	push   0xffffffff
  492ffb:	68 a6 31 49 00       	push   0x4931a6
  493000:	50                   	push   eax
  493001:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  493008:	83 ec 1c             	sub    esp,0x1c
  49300b:	c6 45 f3 00          	mov    BYTE PTR [ebp-0xd],0x0
  49300f:	56                   	push   esi
  493010:	8d 4d ec             	lea    ecx,[ebp-0x14]
  493013:	e8 68 74 09 00       	call   0x52a480
  493018:	6a 00                	push   0x0
  49301a:	8d 4d ec             	lea    ecx,[ebp-0x14]
  49301d:	c7 45 fc 00 00 00 00 	mov    DWORD PTR [ebp-0x4],0x0
  493024:	a1 54 d9 5c 00       	mov    eax,ds:0x5cd954
  493029:	50                   	push   eax
  49302a:	e8 51 6e 09 00       	call   0x529e80
  49302f:	85 c0                	test   eax,eax
  493031:	0f 85 ad 00 00 00    	jne    0x4930e4
  493037:	8d 45 e8             	lea    eax,[ebp-0x18]
  49303a:	8d 4d ec             	lea    ecx,[ebp-0x14]
  49303d:	50                   	push   eax
  49303e:	68 d0 a2 5c 00       	push   0x5ca2d0
  493043:	e8 48 73 09 00       	call   0x52a390
  493048:	85 c0                	test   eax,eax
  49304a:	0f 85 81 00 00 00    	jne    0x4930d1
  493050:	66 8b 4d e8          	mov    cx,WORD PTR [ebp-0x18]
  493054:	33 c0                	xor    eax,eax
  493056:	66 8b d1             	mov    dx,cx
  493059:	66 c1 ea 0a          	shr    dx,0xa
  49305d:	66 8b c1             	mov    ax,cx
  493060:	25 ff 03 00 00       	and    eax,0x3ff
  493065:	83 e8 04             	sub    eax,0x4
  493068:	83 f8 19             	cmp    eax,0x19
  49306b:	77 64                	ja     0x4930d1
  49306d:	33 c9                	xor    ecx,ecx
  49306f:	8a 88 e8 31 49 00    	mov    cl,BYTE PTR [eax+0x4931e8]
  493075:	ff 24 8d b8 31 49 00 	jmp    DWORD PTR [ecx*4+0x4931b8]
  49307c:	66 83 fa 02          	cmp    dx,0x2
  493080:	be 09 00 00 00       	mov    esi,0x9
  493085:	75 4d                	jne    0x4930d4
  493087:	be 0a 00 00 00       	mov    esi,0xa
  49308c:	eb 46                	jmp    0x4930d4
  49308e:	be 02 00 00 00       	mov    esi,0x2
  493093:	eb 3f                	jmp    0x4930d4
  493095:	33 f6                	xor    esi,esi
  493097:	eb 3b                	jmp    0x4930d4
  493099:	be 04 00 00 00       	mov    esi,0x4
  49309e:	eb 34                	jmp    0x4930d4
  4930a0:	be 01 00 00 00       	mov    esi,0x1
  4930a5:	eb 2d                	jmp    0x4930d4
  4930a7:	be 03 00 00 00       	mov    esi,0x3
  4930ac:	eb 26                	jmp    0x4930d4
  4930ae:	be 0b 00 00 00       	mov    esi,0xb
  4930b3:	eb 1f                	jmp    0x4930d4
  4930b5:	be 06 00 00 00       	mov    esi,0x6
  4930ba:	eb 18                	jmp    0x4930d4
  4930bc:	be 07 00 00 00       	mov    esi,0x7
  4930c1:	eb 11                	jmp    0x4930d4
  4930c3:	be 08 00 00 00       	mov    esi,0x8
  4930c8:	eb 0a                	jmp    0x4930d4
  4930ca:	be 05 00 00 00       	mov    esi,0x5
  4930cf:	eb 03                	jmp    0x4930d4
  4930d1:	8b 75 08             	mov    esi,DWORD PTR [ebp+0x8]
  4930d4:	8d 4d ec             	lea    ecx,[ebp-0x14]
  4930d7:	89 35 6a bc 89 00    	mov    DWORD PTR ds:0x89bc6a,esi
  4930dd:	e8 de 6e 09 00       	call   0x529fc0
  4930e2:	eb 03                	jmp    0x4930e7
  4930e4:	8b 75 08             	mov    esi,DWORD PTR [ebp+0x8]
  4930e7:	83 3d 62 bc 89 00 00 	cmp    DWORD PTR ds:0x89bc62,0x0
  4930ee:	74 0e                	je     0x4930fe
  4930f0:	a1 62 bc 89 00       	mov    eax,ds:0x89bc62
  4930f5:	50                   	push   eax
  4930f6:	e8 55 35 09 00       	call   0x526650
  4930fb:	83 c4 04             	add    esp,0x4
  4930fe:	56                   	push   esi
  4930ff:	8d 45 d8             	lea    eax,[ebp-0x28]
  493102:	68 c0 a2 5c 00       	push   0x5ca2c0
  493107:	50                   	push   eax
  493108:	e8 43 83 0c 00       	call   0x55b450
  49310d:	83 c4 0c             	add    esp,0xc
  493110:	8d 45 d8             	lea    eax,[ebp-0x28]
  493113:	50                   	push   eax
  493114:	e8 47 fd ff ff       	call   0x492e60
  493119:	83 c4 04             	add    esp,0x4
  49311c:	85 c0                	test   eax,eax
  49311e:	74 4d                	je     0x49316d
  493120:	39 35 94 e8 5a 00    	cmp    DWORD PTR ds:0x5ae894,esi
  493126:	74 30                	je     0x493158
  493128:	e8 83 0b fc ff       	call   0x453cb0
  49312d:	e8 fe 09 fc ff       	call   0x453b30
  493132:	e8 89 a9 06 00       	call   0x4fdac0
  493137:	e8 84 a6 06 00       	call   0x4fd7c0
  49313c:	e8 2f 7b f9 ff       	call   0x42ac70
  493141:	83 3d 94 e8 5a 00 ff 	cmp    DWORD PTR ds:0x5ae894,0xffffffff
  493148:	74 0e                	je     0x493158
  49314a:	e8 91 6b fc ff       	call   0x459ce0
  49314f:	56                   	push   esi
  493150:	e8 1b 6a fc ff       	call   0x459b70
  493155:	83 c4 04             	add    esp,0x4
  493158:	e8 a3 7f fb ff       	call   0x44b100
  49315d:	83 3d 94 e8 5a 00 ff 	cmp    DWORD PTR ds:0x5ae894,0xffffffff
  493164:	74 0b                	je     0x493171
  493166:	e8 d5 87 f9 ff       	call   0x42b940
  49316b:	eb 04                	jmp    0x493171
  49316d:	c6 45 f3 01          	mov    BYTE PTR [ebp-0xd],0x1
  493171:	c7 05 34 d9 5c 00 01 	mov    DWORD PTR ds:0x5cd934,0x1
  493178:	00 00 00 
  49317b:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  493182:	89 35 94 e8 5a 00    	mov    DWORD PTR ds:0x5ae894,esi
  493188:	e8 23 00 00 00       	call   0x4931b0
  49318d:	80 7d f3 01          	cmp    BYTE PTR [ebp-0xd],0x1
  493191:	1a c9                	sbb    cl,cl
  493193:	5e                   	pop    esi
  493194:	f6 d9                	neg    cl
  493196:	8a c1                	mov    al,cl
  493198:	8b 4d f4             	mov    ecx,DWORD PTR [ebp-0xc]
  49319b:	64 89 0d 00 00 00 00 	mov    DWORD PTR fs:0x0,ecx
  4931a2:	8b e5                	mov    esp,ebp
  4931a4:	5d                   	pop    ebp
  4931a5:	c3                   	ret
  4931a6:	b8 80 54 59 00       	mov    eax,0x595480
  4931ab:	e9 40 86 0c 00       	jmp    0x55b7f0
  4931b0:	8d 4d ec             	lea    ecx,[ebp-0x14]
  4931b3:	e9 f8 6d 09 00       	jmp    0x529fb0
