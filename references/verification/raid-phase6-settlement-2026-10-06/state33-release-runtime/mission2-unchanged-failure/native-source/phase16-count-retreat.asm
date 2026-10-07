
/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004cc112 <.text+0xcb112>:
  4cc112:	8d bc 24 80 00 00 00 	lea    edi,[esp+0x80]
  4cc119:	33 c0                	xor    eax,eax
  4cc11b:	b9 0a 00 00 00       	mov    ecx,0xa
  4cc120:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4cc122:	8d bc 24 a8 00 00 00 	lea    edi,[esp+0xa8]
  4cc129:	b9 0a 00 00 00       	mov    ecx,0xa
  4cc12e:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4cc130:	66 8b 53 10          	mov    dx,WORD PTR [ebx+0x10]
  4cc134:	6a 07                	push   0x7
  4cc136:	8d 84 24 ac 00 00 00 	lea    eax,[esp+0xac]
  4cc13d:	6a 0a                	push   0xa
  4cc13f:	8d 8c 24 88 00 00 00 	lea    ecx,[esp+0x88]
  4cc146:	50                   	push   eax
  4cc147:	51                   	push   ecx
  4cc148:	52                   	push   edx
  4cc149:	55                   	push   ebp
  4cc14a:	e8 01 98 02 00       	call   0x4f5950
  4cc14f:	8b b4 24 f0 00 00 00 	mov    esi,DWORD PTR [esp+0xf0]
  4cc156:	8b 44 24 4c          	mov    eax,DWORD PTR [esp+0x4c]
  4cc15a:	8d 8c 24 c0 00 00 00 	lea    ecx,[esp+0xc0]
  4cc161:	8d 94 24 98 00 00 00 	lea    edx,[esp+0x98]
  4cc168:	83 c4 18             	add    esp,0x18
  4cc16b:	46                   	inc    esi
  4cc16c:	50                   	push   eax
  4cc16d:	51                   	push   ecx
  4cc16e:	52                   	push   edx
  4cc16f:	56                   	push   esi
  4cc170:	53                   	push   ebx
  4cc171:	55                   	push   ebp
  4cc172:	e8 49 21 00 00       	call   0x4ce2c0
  4cc177:	83 c4 18             	add    esp,0x18
  4cc17a:	8b c8                	mov    ecx,eax
  4cc17c:	85 c9                	test   ecx,ecx
  4cc17e:	75 23                	jne    0x4cc1a3
  4cc180:	6a 33                	push   0x33
  4cc182:	33 c0                	xor    eax,eax
  4cc184:	66 8b 43 18          	mov    ax,WORD PTR [ebx+0x18]
  4cc188:	50                   	push   eax
  4cc189:	55                   	push   ebp
  4cc18a:	e8 c1 04 fc ff       	call   0x48c650
  4cc18f:	83 c4 0c             	add    esp,0xc
  4cc192:	66 c7 43 42 17 00    	mov    WORD PTR [ebx+0x42],0x17
  4cc198:	5d                   	pop    ebp
  4cc199:	5f                   	pop    edi
  4cc19a:	5e                   	pop    esi
  4cc19b:	5b                   	pop    ebx
  4cc19c:	81 c4 c0 00 00 00    	add    esp,0xc0
  4cc1a2:	c3                   	ret
  4cc1a3:	83 bc 24 80 00 00 00 	cmp    DWORD PTR [esp+0x80],0x0
  4cc1aa:	00 
  4cc1ab:	0f 85 88 00 00 00    	jne    0x4cc239
  4cc1b1:	83 bc 24 a8 00 00 00 	cmp    DWORD PTR [esp+0xa8],0x0
  4cc1b8:	00 
  4cc1b9:	75 7e                	jne    0x4cc239
  4cc1bb:	66 8b 43 1a          	mov    ax,WORD PTR [ebx+0x1a]
  4cc1bf:	66 89 44 24 14       	mov    WORD PTR [esp+0x14],ax
  4cc1c4:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  4cc1c9:	8b d0                	mov    edx,eax
  4cc1cb:	8d 3c c0             	lea    edi,[eax+eax*8]
  4cc1ce:	8d 04 fa             	lea    eax,[edx+edi*8]
  4cc1d1:	8d 04 82             	lea    eax,[edx+eax*4]
  4cc1d4:	c1 e0 02             	shl    eax,0x2
  4cc1d7:	8d 04 c2             	lea    eax,[edx+eax*8]
  4cc1da:	05 df 24 00 00       	add    eax,0x24df
  4cc1df:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4cc1e4:	89 44 24 60          	mov    DWORD PTR [esp+0x60],eax
  4cc1e8:	c1 4c 24 60 0d       	ror    DWORD PTR [esp+0x60],0xd
  4cc1ed:	8b 44 24 60          	mov    eax,DWORD PTR [esp+0x60]
  4cc1f1:	24 3f                	and    al,0x3f
  4cc1f3:	2c 20                	sub    al,0x20
  4cc1f5:	00 44 24 14          	add    BYTE PTR [esp+0x14],al
  4cc1f9:	8b 44 24 60          	mov    eax,DWORD PTR [esp+0x60]
  4cc1fd:	8b d0                	mov    edx,eax
  4cc1ff:	8d 3c c0             	lea    edi,[eax+eax*8]
  4cc202:	8d 04 fa             	lea    eax,[edx+edi*8]
  4cc205:	8d 04 82             	lea    eax,[edx+eax*4]
  4cc208:	c1 e0 02             	shl    eax,0x2
  4cc20b:	8d 04 c2             	lea    eax,[edx+eax*8]
  4cc20e:	05 df 24 00 00       	add    eax,0x24df
  4cc213:	89 44 24 5c          	mov    DWORD PTR [esp+0x5c],eax
  4cc217:	c1 4c 24 5c 0d       	ror    DWORD PTR [esp+0x5c],0xd
  4cc21c:	8b 44 24 5c          	mov    eax,DWORD PTR [esp+0x5c]
  4cc220:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  4cc225:	24 3f                	and    al,0x3f
  4cc227:	2c 20                	sub    al,0x20
  4cc229:	00 44 24 15          	add    BYTE PTR [esp+0x15],al
  4cc22d:	66 8b 54 24 14       	mov    dx,WORD PTR [esp+0x14]
  4cc232:	66 89 53 10          	mov    WORD PTR [ebx+0x10],dx
  4cc236:	fe 43 2e             	inc    BYTE PTR [ebx+0x2e]
  4cc239:	8b 03                	mov    eax,DWORD PTR [ebx]
  4cc23b:	39 43 3a             	cmp    DWORD PTR [ebx+0x3a],eax
  4cc23e:	7e 32                	jle    0x4cc272
  4cc240:	80 7b 2e 20          	cmp    BYTE PTR [ebx+0x2e],0x20
  4cc244:	77 2c                	ja     0x4cc272
  4cc246:	33 c0                	xor    eax,eax
  4cc248:	bf 64 00 00 00       	mov    edi,0x64
  4cc24d:	8a 43 2b             	mov    al,BYTE PTR [ebx+0x2b]
  4cc250:	0f af 43 36          	imul   eax,DWORD PTR [ebx+0x36]
  4cc254:	99                   	cdq
  4cc255:	f7 ff                	idiv   edi
  4cc257:	3b c1                	cmp    eax,ecx
  4cc259:	7f 17                	jg     0x4cc272
  4cc25b:	80 7b 2c 00          	cmp    BYTE PTR [ebx+0x2c],0x0
  4cc25f:	0f 86 22 f3 ff ff    	jbe    0x4cb587
  4cc265:	f6 85 96 05 00 00 04 	test   BYTE PTR [ebp+0x596],0x4
  4cc26c:	0f 84 15 f3 ff ff    	je     0x4cb587
