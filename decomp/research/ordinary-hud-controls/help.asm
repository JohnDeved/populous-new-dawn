
../populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0049d150 <.text+0x9c150>:
  49d150:	80 3d e7 c6 89 00 11 	cmp    BYTE PTR ds:0x89c6e7,0x11
  49d157:	74 33                	je     0x49d18c
  49d159:	a0 e7 c6 89 00       	mov    al,ds:0x89c6e7
  49d15e:	a2 ea c6 89 00       	mov    ds:0x89c6ea,al
  49d163:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  49d16a:	8b c8                	mov    ecx,eax
  49d16c:	8d 14 80             	lea    edx,[eax+eax*4]
  49d16f:	8d 04 51             	lea    eax,[ecx+edx*2]
  49d172:	8d 14 c0             	lea    edx,[eax+eax*8]
  49d175:	8d 04 d1             	lea    eax,[ecx+edx*8]
  49d178:	8d 04 81             	lea    eax,[ecx+eax*4]
  49d17b:	05 c8 d1 89 00       	add    eax,0x89d1c8
  49d180:	50                   	push   eax
  49d181:	6a 11                	push   0x11
  49d183:	e8 c8 d3 fd ff       	call   0x47a550
  49d188:	83 c4 08             	add    esp,0x8
  49d18b:	c3                   	ret
  49d18c:	6a ff                	push   0xffffffff
  49d18e:	e8 cd 09 fc ff       	call   0x45db60
  49d193:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  49d19a:	8d 14 80             	lea    edx,[eax+eax*4]
  49d19d:	83 c4 04             	add    esp,0x4
  49d1a0:	8b c8                	mov    ecx,eax
  49d1a2:	8d 04 51             	lea    eax,[ecx+edx*2]
  49d1a5:	8d 14 c0             	lea    edx,[eax+eax*8]
  49d1a8:	8d 04 d1             	lea    eax,[ecx+edx*8]
  49d1ab:	8d 04 81             	lea    eax,[ecx+eax*4]
  49d1ae:	66 0f be 0d ea c6 89 	movsx  cx,BYTE PTR ds:0x89c6ea
  49d1b5:	00 
  49d1b6:	05 c8 d1 89 00       	add    eax,0x89d1c8
  49d1bb:	50                   	push   eax
  49d1bc:	51                   	push   ecx
  49d1bd:	e8 8e d3 fd ff       	call   0x47a550
  49d1c2:	83 c4 08             	add    esp,0x8
  49d1c5:	c3                   	ret
  49d1c6:	cc                   	int3
  49d1c7:	cc                   	int3
  49d1c8:	cc                   	int3
  49d1c9:	cc                   	int3
  49d1ca:	cc                   	int3
  49d1cb:	cc                   	int3
  49d1cc:	cc                   	int3
  49d1cd:	cc                   	int3
  49d1ce:	cc                   	int3
  49d1cf:	cc                   	int3
  49d1d0:	83 ec 10             	sub    esp,0x10
  49d1d3:	53                   	push   ebx
  49d1d4:	56                   	push   esi
  49d1d5:	8b 74 24 1c          	mov    esi,DWORD PTR [esp+0x1c]
  49d1d9:	57                   	push   edi
  49d1da:	55                   	push   ebp
  49d1db:	8b 46 37             	mov    eax,DWORD PTR [esi+0x37]
  49d1de:	50                   	push   eax
  49d1df:	e8 0c d0 fa ff       	call   0x44a1f0
  49d1e4:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  49d1e8:	83 c4 04             	add    esp,0x4
  49d1eb:	8b 46 3b             	mov    eax,DWORD PTR [esi+0x3b]
  49d1ee:	50                   	push   eax
  49d1ef:	e8 1c d0 fa ff       	call   0x44a210
  49d1f4:	83 c4 04             	add    esp,0x4
  49d1f7:	8b d8                	mov    ebx,eax
  49d1f9:	8b 46 47             	mov    eax,DWORD PTR [esi+0x47]
  49d1fc:	03 46 37             	add    eax,DWORD PTR [esi+0x37]
  49d1ff:	50                   	push   eax
  49d200:	e8 eb cf fa ff       	call   0x44a1f0
  49d205:	83 c4 04             	add    esp,0x4
  49d208:	8b e8                	mov    ebp,eax
  49d20a:	8b 46 4b             	mov    eax,DWORD PTR [esi+0x4b]
  49d20d:	03 46 3b             	add    eax,DWORD PTR [esi+0x3b]
  49d210:	50                   	push   eax
  49d211:	e8 fa cf fa ff       	call   0x44a210
  49d216:	83 c4 04             	add    esp,0x4
  49d219:	8b f8                	mov    edi,eax
  49d21b:	68 d8 ab 5c 00       	push   0x5cabd8
  49d220:	68 c0 ab 5c 00       	push   0x5cabc0
  49d225:	68 a8 ab 5c 00       	push   0x5caba8
  49d22a:	56                   	push   esi
  49d22b:	e8 a0 4b 00 00       	call   0x4a1dd0
  49d230:	83 c4 10             	add    esp,0x10
  49d233:	b9 01 00 00 00       	mov    ecx,0x1
  49d238:	66 81 3d cf c6 89 00 	cmp    WORD PTR ds:0x89c6cf,0x320
  49d23f:	20 03 
  49d241:	7f 02                	jg     0x49d245
  49d243:	33 c9                	xor    ecx,ecx
  49d245:	03 4e 4f             	add    ecx,DWORD PTR [esi+0x4f]
  49d248:	8d 04 1f             	lea    eax,[edi+ebx*1]
  49d24b:	99                   	cdq
  49d24c:	c1 e1 03             	shl    ecx,0x3
  49d24f:	2b c2                	sub    eax,edx
  49d251:	c1 f8 01             	sar    eax,0x1
  49d254:	03 0d 14 df 59 00    	add    ecx,DWORD PTR ds:0x59df14
  49d25a:	66 8b 51 06          	mov    dx,WORD PTR [ecx+0x6]
  49d25e:	51                   	push   ecx
  49d25f:	66 c1 ea 01          	shr    dx,0x1
  49d263:	0f b7 da             	movzx  ebx,dx
  49d266:	2b c3                	sub    eax,ebx
  49d268:	66 8b 49 04          	mov    cx,WORD PTR [ecx+0x4]
  49d26c:	50                   	push   eax
  49d26d:	66 c1 e9 01          	shr    cx,0x1
  49d271:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  49d275:	03 c5                	add    eax,ebp
  49d277:	99                   	cdq
  49d278:	2b c2                	sub    eax,edx
  49d27a:	0f b7 d1             	movzx  edx,cx
  49d27d:	c1 f8 01             	sar    eax,0x1
  49d280:	2b c2                	sub    eax,edx
  49d282:	50                   	push   eax
  49d283:	e8 58 90 07 00       	call   0x5162e0
  49d288:	83 c4 0c             	add    esp,0xc
  49d28b:	5d                   	pop    ebp
  49d28c:	5f                   	pop    edi
  49d28d:	5e                   	pop    esi
  49d28e:	5b                   	pop    ebx
  49d28f:	83 c4 10             	add    esp,0x10
  49d292:	c3                   	ret
  49d293:	cc                   	int3
  49d294:	cc                   	int3
  49d295:	cc                   	int3
  49d296:	cc                   	int3
  49d297:	cc                   	int3
  49d298:	cc                   	int3
  49d299:	cc                   	int3
  49d29a:	cc                   	int3
  49d29b:	cc                   	int3
  49d29c:	cc                   	int3
  49d29d:	cc                   	int3
  49d29e:	cc                   	int3
  49d29f:	cc                   	int3
