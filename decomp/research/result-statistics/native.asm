; GNU objdump 2.44; static disassembly only; original SHA256 3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f

; reset
  41b520:	57                   	push   edi
  41b521:	b9 0c 00 00 00       	mov    ecx,0xc
  41b526:	0f be 44 24 08       	movsx  eax,BYTE PTR [esp+0x8]
  41b52b:	c1 e0 04             	shl    eax,0x4
  41b52e:	8d bc 40 c6 9d 96 00 	lea    edi,[eax+eax*2+0x969dc6]
  41b535:	33 c0                	xor    eax,eax
  41b537:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  41b539:	e8 32 c6 10 00       	call   0x527b70
  41b53e:	5f                   	pop    edi
  41b53f:	a3 c2 9d 96 00       	mov    ds:0x969dc2,eax
  41b544:	c3                   	ret

; add
  41b550:	8a 44 24 04          	mov    al,BYTE PTR [esp+0x4]
  41b554:	3c ff                	cmp    al,0xff
  41b556:	74 18                	je     0x41b570
  41b558:	0f be c8             	movsx  ecx,al
  41b55b:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  41b55f:	8d 14 49             	lea    edx,[ecx+ecx*2]
  41b562:	8d 0c 90             	lea    ecx,[eax+edx*4]
  41b565:	8b 54 24 0c          	mov    edx,DWORD PTR [esp+0xc]
  41b569:	01 14 8d c6 9d 96 00 	add    DWORD PTR [ecx*4+0x969dc6],edx
  41b570:	c3                   	ret

; knowledge
  41b580:	8a 44 24 04          	mov    al,BYTE PTR [esp+0x4]
  41b584:	56                   	push   esi
  41b585:	57                   	push   edi
  41b586:	3c ff                	cmp    al,0xff
  41b588:	74 33                	je     0x41b5bd
  41b58a:	0f be f8             	movsx  edi,al
  41b58d:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  41b591:	8d 0c 7f             	lea    ecx,[edi+edi*2]
  41b594:	8d 14 88             	lea    edx,[eax+ecx*4]
  41b597:	b8 01 00 00 00       	mov    eax,0x1
  41b59c:	8a 4c 24 14          	mov    cl,BYTE PTR [esp+0x14]
  41b5a0:	8d 34 95 c6 9d 96 00 	lea    esi,[edx*4+0x969dc6]
  41b5a7:	d3 e0                	shl    eax,cl
  41b5a9:	8b 16                	mov    edx,DWORD PTR [esi]
  41b5ab:	85 d0                	test   eax,edx
  41b5ad:	75 0e                	jne    0x41b5bd
  41b5af:	c1 e7 04             	shl    edi,0x4
  41b5b2:	0b d0                	or     edx,eax
  41b5b4:	89 16                	mov    DWORD PTR [esi],edx
  41b5b6:	ff 84 7f ea 9d 96 00 	inc    DWORD PTR [edi+edi*2+0x969dea]
  41b5bd:	5f                   	pop    edi
  41b5be:	5e                   	pop    esi
  41b5bf:	c3                   	ret

; clock
  41b5c0:	e8 ab c5 10 00       	call   0x527b70
  41b5c5:	2b 05 c2 9d 96 00    	sub    eax,DWORD PTR ds:0x969dc2
  41b5cb:	a3 c2 9d 96 00       	mov    ds:0x969dc2,eax
  41b5d0:	c3                   	ret

; resetCaller
  42cb7d:	57                   	push   edi
  42cb7e:	e8 9d e9 fe ff       	call   0x41b520
  42cb83:	83 c4 04             	add    esp,0x4
  42cb86:	47                   	inc    edi
  42cb87:	33 c0                	xor    eax,eax
  42cb89:	a0 c0 ea 96 00       	mov    al,ds:0x96eac0
  42cb8e:	3b c7                	cmp    eax,edi
  42cb90:	0f 8f 17 ff ff ff    	jg     0x42caad

; rendererIndex
  5245e3:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  5245e7:	8d 04 40             	lea    eax,[eax+eax*2]
  5245ea:	c1 e0 02             	shl    eax,0x2
  5245ed:	89 44 24 38          	mov    DWORD PTR [esp+0x38],eax

; rendererRead
  524653:	0f be 47 02          	movsx  eax,BYTE PTR [edi+0x2]
  524657:	03 44 24 38          	add    eax,DWORD PTR [esp+0x38]
  52465b:	8d 94 24 58 01 00 00 	lea    edx,[esp+0x158]
  524662:	8b 0c 85 c6 9d 96 00 	mov    ecx,DWORD PTR [eax*4+0x969dc6]
  524669:	51                   	push   ecx
  52466a:	68 00 cd 59 00       	push   0x59cd00
  52466f:	52                   	push   edx
  524670:	e8 2b f3 f2 ff       	call   0x4539a0

; rendererClock
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

; buildingRemoval
  403820:	56                   	push   esi
  403821:	8b 74 24 08          	mov    esi,DWORD PTR [esp+0x8]
  403825:	f6 46 14 40          	test   BYTE PTR [esi+0x14],0x40
  403829:	75 20                	jne    0x40384b
  40382b:	56                   	push   esi
  40382c:	e8 2f 00 00 00       	call   0x403860
  403831:	83 c4 04             	add    esp,0x4
  403834:	8a 86 af 00 00 00    	mov    al,BYTE PTR [esi+0xaf]
  40383a:	3c ff                	cmp    al,0xff
  40383c:	74 0d                	je     0x40384b
  40383e:	6a 01                	push   0x1
  403840:	6a 04                	push   0x4
  403842:	50                   	push   eax
  403843:	e8 08 7d 01 00       	call   0x41b550
  403848:	83 c4 0c             	add    esp,0xc
  40384b:	56                   	push   esi
  40384c:	e8 9f a4 0e 00       	call   0x4edcf0
  403851:	83 c4 04             	add    esp,0x4
  403854:	5e                   	pop    esi
  403855:	c3                   	ret

; buildingPairRemoval
  40b130:	56                   	push   esi
  40b131:	8b 74 24 08          	mov    esi,DWORD PTR [esp+0x8]
  40b135:	85 f6                	test   esi,esi
  40b137:	74 12                	je     0x40b14b
  40b139:	56                   	push   esi
  40b13a:	e8 f1 00 00 00       	call   0x40b230
  40b13f:	83 c4 04             	add    esp,0x4
  40b142:	56                   	push   esi
  40b143:	e8 38 40 0e 00       	call   0x4ef180
  40b148:	83 c4 04             	add    esp,0x4
  40b14b:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  40b14f:	85 f6                	test   esi,esi
  40b151:	74 19                	je     0x40b16c
  40b153:	6a 01                	push   0x1
  40b155:	8a 46 2f             	mov    al,BYTE PTR [esi+0x2f]
  40b158:	6a 07                	push   0x7
  40b15a:	50                   	push   eax
  40b15b:	e8 f0 03 01 00       	call   0x41b550
  40b160:	83 c4 0c             	add    esp,0xc
  40b163:	56                   	push   esi
  40b164:	e8 17 40 0e 00       	call   0x4ef180
  40b169:	83 c4 04             	add    esp,0x4
  40b16c:	5e                   	pop    esi
  40b16d:	c3                   	ret

; fightRelease
  519c90:	53                   	push   ebx
  519c91:	56                   	push   esi
  519c92:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  519c96:	57                   	push   edi
  519c97:	0f be 7e 68          	movsx  edi,BYTE PTR [esi+0x68]
  519c9b:	55                   	push   ebp
  519c9c:	85 ff                	test   edi,edi
  519c9e:	7e 3b                	jle    0x519cdb
  519ca0:	8d 5e 70             	lea    ebx,[esi+0x70]
  519ca3:	bd 01 00 00 00       	mov    ebp,0x1
  519ca8:	33 d2                	xor    edx,edx
  519caa:	66 8b 0b             	mov    cx,WORD PTR [ebx]
  519cad:	33 c0                	xor    eax,eax
  519caf:	66 3b c8             	cmp    cx,ax
  519cb2:	74 16                	je     0x519cca
  519cb4:	0f b7 c9             	movzx  ecx,cx
  519cb7:	8b 0c 8d 90 03 89 00 	mov    ecx,DWORD PTR [ecx*4+0x890390]
  519cbe:	85 69 0c             	test   DWORD PTR [ecx+0xc],ebp
  519cc1:	75 07                	jne    0x519cca
  519cc3:	38 51 2a             	cmp    BYTE PTR [ecx+0x2a],dl
  519cc6:	74 02                	je     0x519cca
  519cc8:	8b c1                	mov    eax,ecx
  519cca:	85 c0                	test   eax,eax
  519ccc:	74 07                	je     0x519cd5
  519cce:	66 89 90 9d 00 00 00 	mov    WORD PTR [eax+0x9d],dx
  519cd5:	83 c3 02             	add    ebx,0x2
  519cd8:	4f                   	dec    edi
  519cd9:	75 cf                	jne    0x519caa
  519cdb:	8a 46 6b             	mov    al,BYTE PTR [esi+0x6b]
  519cde:	33 c9                	xor    ecx,ecx
  519ce0:	8a c8                	mov    cl,al
  519ce2:	83 f9 ff             	cmp    ecx,0xffffffff
  519ce5:	74 0d                	je     0x519cf4
  519ce7:	6a 01                	push   0x1
  519ce9:	6a 00                	push   0x0
  519ceb:	50                   	push   eax
  519cec:	e8 5f 18 f0 ff       	call   0x41b550
  519cf1:	83 c4 0c             	add    esp,0xc
  519cf4:	56                   	push   esi
  519cf5:	e8 f6 3f fd ff       	call   0x4edcf0
  519cfa:	83 c4 04             	add    esp,0x4
  519cfd:	5d                   	pop    ebp
  519cfe:	5f                   	pop    edi
  519cff:	5e                   	pop    esi
  519d00:	5b                   	pop    ebx
  519d01:	c3                   	ret

; rewardDelivery
  4fb028:	66 8b 46 7a          	mov    ax,WORD PTR [esi+0x7a]
  4fb02c:	66 48                	dec    ax
  4fb02e:	66 89 46 7a          	mov    WORD PTR [esi+0x7a],ax
  4fb032:	66 85 c0             	test   ax,ax
  4fb035:	7f 4b                	jg     0x4fb082
  4fb037:	c6 44 24 10 01       	mov    BYTE PTR [esp+0x10],0x1
  4fb03c:	33 c0                	xor    eax,eax
  4fb03e:	8a 46 7c             	mov    al,BYTE PTR [esi+0x7c]
  4fb041:	83 f8 02             	cmp    eax,0x2
  4fb044:	74 44                	je     0x4fb08a
  4fb046:	83 f8 06             	cmp    eax,0x6
  4fb049:	74 77                	je     0x4fb0c2
  4fb04b:	83 f8 0b             	cmp    eax,0xb
  4fb04e:	0f 84 a4 00 00 00    	je     0x4fb0f8
  4fb054:	8b 7c 24 14          	mov    edi,DWORD PTR [esp+0x14]
  4fb058:	80 7c 24 10 00       	cmp    BYTE PTR [esp+0x10],0x0
  4fb05d:	74 1a                	je     0x4fb079
  4fb05f:	80 be 80 00 00 00 01 	cmp    BYTE PTR [esi+0x80],0x1
  4fb066:	75 11                	jne    0x4fb079
  4fb068:	8b 46 74             	mov    eax,DWORD PTR [esi+0x74]
  4fb06b:	8a 4e 7e             	mov    cl,BYTE PTR [esi+0x7e]
  4fb06e:	50                   	push   eax
  4fb06f:	57                   	push   edi
  4fb070:	51                   	push   ecx
  4fb071:	e8 0a 05 f2 ff       	call   0x41b580
  4fb076:	83 c4 0c             	add    esp,0xc
  4fb079:	56                   	push   esi
  4fb07a:	e8 01 41 ff ff       	call   0x4ef180
  4fb07f:	83 c4 04             	add    esp,0x4
  4fb082:	5d                   	pop    ebp
  4fb083:	5f                   	pop    edi
  4fb084:	5e                   	pop    esi
  4fb085:	5b                   	pop    ebx
  4fb086:	83 c4 14             	add    esp,0x14
  4fb089:	c3                   	ret
  4fb08a:	80 be 80 00 00 00 03 	cmp    BYTE PTR [esi+0x80],0x3
  4fb091:	bf 0b 00 00 00       	mov    edi,0xb
  4fb096:	75 16                	jne    0x4fb0ae
  4fb098:	6a 01                	push   0x1
  4fb09a:	33 c0                	xor    eax,eax
  4fb09c:	8a 46 7e             	mov    al,BYTE PTR [esi+0x7e]
  4fb09f:	8b 4e 74             	mov    ecx,DWORD PTR [esi+0x74]
  4fb0a2:	50                   	push   eax
  4fb0a3:	51                   	push   ecx
  4fb0a4:	e8 e7 dd f0 ff       	call   0x408e90
  4fb0a9:	83 c4 0c             	add    esp,0xc
  4fb0ac:	eb aa                	jmp    0x4fb058
  4fb0ae:	33 c0                	xor    eax,eax
  4fb0b0:	8b 4e 74             	mov    ecx,DWORD PTR [esi+0x74]
  4fb0b3:	8a 46 7e             	mov    al,BYTE PTR [esi+0x7e]
  4fb0b6:	50                   	push   eax
  4fb0b7:	51                   	push   ecx
  4fb0b8:	e8 73 dd f0 ff       	call   0x408e30
  4fb0bd:	83 c4 08             	add    esp,0x8
  4fb0c0:	eb 96                	jmp    0x4fb058
  4fb0c2:	8a 46 7e             	mov    al,BYTE PTR [esi+0x7e]
  4fb0c5:	33 db                	xor    ebx,ebx
  4fb0c7:	8a d8                	mov    bl,al
  4fb0c9:	8b fb                	mov    edi,ebx
  4fb0cb:	8d 0c 9b             	lea    ecx,[ebx+ebx*4]
  4fb0ce:	c6 44 24 10 00       	mov    BYTE PTR [esp+0x10],0x0
  4fb0d3:	8d 1c 4f             	lea    ebx,[edi+ecx*2]
  4fb0d6:	8b 4e 70             	mov    ecx,DWORD PTR [esi+0x70]
  4fb0d9:	8d 14 db             	lea    edx,[ebx+ebx*8]
  4fb0dc:	51                   	push   ecx
  4fb0dd:	50                   	push   eax
  4fb0de:	8d 2c d7             	lea    ebp,[edi+edx*8]
  4fb0e1:	e8 1a f4 f1 ff       	call   0x41a500
  4fb0e6:	66 c7 84 af cd db 89 	mov    WORD PTR [edi+ebp*4+0x89dbcd],0x0
  4fb0ed:	00 00 00 
  4fb0f0:	83 c4 08             	add    esp,0x8
  4fb0f3:	e9 5c ff ff ff       	jmp    0x4fb054
  4fb0f8:	bf 0a 00 00 00       	mov    edi,0xa
  4fb0fd:	8b 46 74             	mov    eax,DWORD PTR [esi+0x74]
  4fb100:	8b c8                	mov    ecx,eax
  4fb102:	c1 e1 06             	shl    ecx,0x6
  4fb105:	2b c8                	sub    ecx,eax
  4fb107:	2b c8                	sub    ecx,eax
  4fb109:	66 83 b9 d0 80 5a 00 	cmp    WORD PTR [ecx+0x5a80d0],0x2
  4fb110:	02 
  4fb111:	75 09                	jne    0x4fb11c
  4fb113:	50                   	push   eax
  4fb114:	e8 a7 7e fc ff       	call   0x4c2fc0
  4fb119:	83 c4 04             	add    esp,0x4
  4fb11c:	80 be 80 00 00 00 03 	cmp    BYTE PTR [esi+0x80],0x3
  4fb123:	75 2b                	jne    0x4fb150
  4fb125:	6a 01                	push   0x1
  4fb127:	33 c0                	xor    eax,eax
  4fb129:	8a 46 7e             	mov    al,BYTE PTR [esi+0x7e]
  4fb12c:	8b 4e 74             	mov    ecx,DWORD PTR [esi+0x74]
  4fb12f:	50                   	push   eax
  4fb130:	51                   	push   ecx
  4fb131:	e8 9a 7b fc ff       	call   0x4c2cd0
  4fb136:	83 c4 0c             	add    esp,0xc
  4fb139:	8b 4e 74             	mov    ecx,DWORD PTR [esi+0x74]
  4fb13c:	33 c0                	xor    eax,eax
  4fb13e:	51                   	push   ecx
  4fb13f:	8a 46 7e             	mov    al,BYTE PTR [esi+0x7e]
  4fb142:	50                   	push   eax
  4fb143:	e8 58 79 fc ff       	call   0x4c2aa0
  4fb148:	83 c4 08             	add    esp,0x8
  4fb14b:	e9 08 ff ff ff       	jmp    0x4fb058
  4fb150:	33 c0                	xor    eax,eax
  4fb152:	8b 4e 74             	mov    ecx,DWORD PTR [esi+0x74]
  4fb155:	8a 46 7e             	mov    al,BYTE PTR [esi+0x7e]
  4fb158:	50                   	push   eax
  4fb159:	51                   	push   ecx
  4fb15a:	e8 e1 7a fc ff       	call   0x4c2c40

; tribeElimination
  418f15:	8b 8f 49 09 00 00    	mov    ecx,DWORD PTR [edi+0x949]
  418f1b:	85 c9                	test   ecx,ecx
  418f1d:	75 43                	jne    0x418f62
  418f1f:	32 c0                	xor    al,al
  418f21:	83 3e 00             	cmp    DWORD PTR [esi],0x0
  418f24:	75 02                	jne    0x418f28
  418f26:	b0 01                	mov    al,0x1
  418f28:	84 c0                	test   al,al
  418f2a:	74 34                	je     0x418f60
  418f2c:	41                   	inc    ecx
  418f2d:	53                   	push   ebx
  418f2e:	c7 44 24 14 01 00 00 	mov    DWORD PTR [esp+0x14],0x1
  418f35:	00 
  418f36:	89 8f 49 09 00 00    	mov    DWORD PTR [edi+0x949],ecx
  418f3c:	e8 6f 29 00 00       	call   0x41b8b0
  418f41:	83 c4 04             	add    esp,0x4
  418f44:	80 3d f0 c6 89 00 ff 	cmp    BYTE PTR ds:0x89c6f0,0xff
  418f4b:	74 15                	je     0x418f62
  418f4d:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  418f54:	c1 e0 04             	shl    eax,0x4
  418f57:	ff 84 40 ce 9d 96 00 	inc    DWORD PTR [eax+eax*2+0x969dce]
  418f5e:	eb 02                	jmp    0x418f62
  418f60:	33 ed                	xor    ebp,ebp
  418f62:	81 c6 65 0c 00 00    	add    esi,0xc65
  418f68:	43                   	inc    ebx
  418f69:	81 c7 65 0c 00 00    	add    edi,0xc65
  418f6f:	33 c0                	xor    eax,eax
  418f71:	a0 c0 ea 96 00       	mov    al,ds:0x96eac0
  418f76:	3b c3                	cmp    eax,ebx
  418f78:	7f 9b                	jg     0x418f15
