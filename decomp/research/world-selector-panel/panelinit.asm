
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0047ed50 <.text+0x7dd50>:
  47ed50:	53                   	push   ebx
  47ed51:	b9 78 59 98 00       	mov    ecx,0x985978
  47ed56:	56                   	push   esi
  47ed57:	57                   	push   edi
  47ed58:	6a 00                	push   0x0
  47ed5a:	68 80 5a 98 00       	push   0x985a80
  47ed5f:	e8 2c a7 fa ff       	call   0x429490
  47ed64:	e8 a7 44 01 00       	call   0x493210
  47ed69:	85 c0                	test   eax,eax
  47ed6b:	75 53                	jne    0x47edc0
  47ed6d:	33 db                	xor    ebx,ebx
  47ed6f:	39 1d 48 90 a6 00    	cmp    DWORD PTR ds:0xa69048,ebx
  47ed75:	7e 25                	jle    0x47ed9c
  47ed77:	bf 80 59 98 00       	mov    edi,0x985980
  47ed7c:	be 28 5b 5d 00       	mov    esi,0x5d5b28
  47ed81:	8b 06                	mov    eax,DWORD PTR [esi]
  47ed83:	6a 00                	push   0x0
  47ed85:	50                   	push   eax
  47ed86:	8b cf                	mov    ecx,edi
  47ed88:	83 c7 08             	add    edi,0x8
  47ed8b:	e8 00 a7 fa ff       	call   0x429490
  47ed90:	83 c6 30             	add    esi,0x30
  47ed93:	43                   	inc    ebx
  47ed94:	3b 1d 48 90 a6 00    	cmp    ebx,DWORD PTR ds:0xa69048
  47ed9a:	7c e5                	jl     0x47ed81
  47ed9c:	bf 08 59 98 00       	mov    edi,0x985908
  47eda1:	be a0 48 98 00       	mov    esi,0x9848a0
  47eda6:	8b 06                	mov    eax,DWORD PTR [esi]
  47eda8:	6a 00                	push   0x0
  47edaa:	50                   	push   eax
  47edab:	8b cf                	mov    ecx,edi
  47edad:	83 c7 08             	add    edi,0x8
  47edb0:	e8 db a6 fa ff       	call   0x429490
  47edb5:	83 c6 04             	add    esi,0x4
  47edb8:	81 fe d0 48 98 00    	cmp    esi,0x9848d0
  47edbe:	72 e6                	jb     0x47eda6
  47edc0:	e8 cb 03 00 00       	call   0x47f190
  47edc5:	b9 00 00 00 00       	mov    ecx,0x0
  47edca:	5f                   	pop    edi
  47edcb:	5e                   	pop    esi
  47edcc:	83 f8 01             	cmp    eax,0x1
  47edcf:	83 d1 ff             	adc    ecx,0xffffffff
  47edd2:	5b                   	pop    ebx
  47edd3:	23 c8                	and    ecx,eax
  47edd5:	8b c1                	mov    eax,ecx
  47edd7:	c3                   	ret
  47edd8:	cc                   	int3
  47edd9:	cc                   	int3
  47edda:	cc                   	int3
  47eddb:	cc                   	int3
  47eddc:	cc                   	int3
  47eddd:	cc                   	int3
  47edde:	cc                   	int3
  47eddf:	cc                   	int3
  47ede0:	56                   	push   esi
  47ede1:	a1 fc e2 59 00       	mov    eax,ds:0x59e2fc
  47ede6:	57                   	push   edi
  47ede7:	48                   	dec    eax
  47ede8:	78 1e                	js     0x47ee08
  47edea:	8d 34 c5 00 00 00 00 	lea    esi,[eax*8+0x0]
  47edf1:	2b f0                	sub    esi,eax
  47edf3:	c1 e6 04             	shl    esi,0x4
  47edf6:	8b 0d f8 e2 59 00    	mov    ecx,DWORD PTR ds:0x59e2f8
  47edfc:	03 ce                	add    ecx,esi
  47edfe:	8b 39                	mov    edi,DWORD PTR [ecx]
  47ee00:	ff 57 04             	call   DWORD PTR [edi+0x4]
  47ee03:	83 ee 70             	sub    esi,0x70
  47ee06:	79 ee                	jns    0x47edf6
  47ee08:	83 3d f8 e2 59 00 00 	cmp    DWORD PTR ds:0x59e2f8,0x0
  47ee0f:	74 0e                	je     0x47ee1f
  47ee11:	a1 f8 e2 59 00       	mov    eax,ds:0x59e2f8
  47ee16:	50                   	push   eax
  47ee17:	e8 34 bf 0d 00       	call   0x55ad50
  47ee1c:	83 c4 04             	add    esp,0x4
  47ee1f:	33 f6                	xor    esi,esi
  47ee21:	a1 f4 e2 59 00       	mov    eax,ds:0x59e2f4
  47ee26:	50                   	push   eax
  47ee27:	89 35 f8 e2 59 00    	mov    DWORD PTR ds:0x59e2f8,esi
  47ee2d:	e8 1e bf 0d 00       	call   0x55ad50
  47ee32:	83 c4 04             	add    esp,0x4
  47ee35:	89 35 f4 e2 59 00    	mov    DWORD PTR ds:0x59e2f4,esi
  47ee3b:	e8 d0 43 01 00       	call   0x493210
  47ee40:	85 c0                	test   eax,eax
  47ee42:	75 39                	jne    0x47ee7d
  47ee44:	be 08 59 98 00       	mov    esi,0x985908
  47ee49:	8b ce                	mov    ecx,esi
  47ee4b:	83 c6 08             	add    esi,0x8
  47ee4e:	e8 2d a8 fa ff       	call   0x429680
  47ee53:	81 fe 68 59 98 00    	cmp    esi,0x985968
  47ee59:	72 ee                	jb     0x47ee49
  47ee5b:	33 f6                	xor    esi,esi
  47ee5d:	39 35 48 90 a6 00    	cmp    DWORD PTR ds:0xa69048,esi
  47ee63:	7e 18                	jle    0x47ee7d
  47ee65:	bf 80 59 98 00       	mov    edi,0x985980
  47ee6a:	8b cf                	mov    ecx,edi
  47ee6c:	46                   	inc    esi
  47ee6d:	83 c7 08             	add    edi,0x8
  47ee70:	e8 0b a8 fa ff       	call   0x429680
  47ee75:	39 35 48 90 a6 00    	cmp    DWORD PTR ds:0xa69048,esi
  47ee7b:	7f ed                	jg     0x47ee6a
  47ee7d:	b9 78 59 98 00       	mov    ecx,0x985978
  47ee82:	e8 f9 a7 fa ff       	call   0x429680
  47ee87:	5f                   	pop    edi
  47ee88:	5e                   	pop    esi
  47ee89:	c3                   	ret
  47ee8a:	cc                   	int3
  47ee8b:	cc                   	int3
  47ee8c:	cc                   	int3
  47ee8d:	cc                   	int3
  47ee8e:	cc                   	int3
  47ee8f:	cc                   	int3
  47ee90:	81 ec 10 01 00 00    	sub    esp,0x110
  47ee96:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  47ee9b:	53                   	push   ebx
  47ee9c:	8b 90 a0 1d 00 00    	mov    edx,DWORD PTR [eax+0x1da0]
  47eea2:	56                   	push   esi
  47eea3:	b9 00 01 00 00       	mov    ecx,0x100
  47eea8:	8b b4 24 20 01 00 00 	mov    esi,DWORD PTR [esp+0x120]
  47eeaf:	57                   	push   edi
  47eeb0:	55                   	push   ebp
  47eeb1:	bf 28 55 d0 00       	mov    edi,0xd05528
  47eeb6:	89 54 24 14          	mov    DWORD PTR [esp+0x14],edx
  47eeba:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  47eebc:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  47eec0:	8b 7a 0c             	mov    edi,DWORD PTR [edx+0xc]
  47eec3:	8b 42 1c             	mov    eax,DWORD PTR [edx+0x1c]
  47eec6:	8b 4a 18             	mov    ecx,DWORD PTR [edx+0x18]
  47eec9:	8b 72 14             	mov    esi,DWORD PTR [edx+0x14]
  47eecc:	8b 5a 10             	mov    ebx,DWORD PTR [edx+0x10]
  47eecf:	89 5c 24 40          	mov    DWORD PTR [esp+0x40],ebx
  47eed3:	89 74 24 44          	mov    DWORD PTR [esp+0x44],esi
  47eed7:	8b b4 24 24 01 00 00 	mov    esi,DWORD PTR [esp+0x124]
  47eede:	89 4c 24 48          	mov    DWORD PTR [esp+0x48],ecx
  47eee2:	89 44 24 4c          	mov    DWORD PTR [esp+0x4c],eax
  47eee6:	89 7c 24 50          	mov    DWORD PTR [esp+0x50],edi
  47eeea:	33 c0                	xor    eax,eax
  47eeec:	6a 00                	push   0x0
  47eeee:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  47eef2:	6a 00                	push   0x0
  47eef4:	c7 44 24 5c 00 00 00 	mov    DWORD PTR [esp+0x5c],0x0
  47eefb:	00 
  47eefc:	8d 5c 24 48          	lea    ebx,[esp+0x48]
  47ef00:	89 84 24 88 00 00 00 	mov    DWORD PTR [esp+0x88],eax
  47ef07:	33 c0                	xor    eax,eax
  47ef09:	53                   	push   ebx
  47ef0a:	66 8b 46 06          	mov    ax,WORD PTR [esi+0x6]
  47ef0e:	8b 94 24 8c 00 00 00 	mov    edx,DWORD PTR [esp+0x8c]
  47ef15:	8d 4c 24 64          	lea    ecx,[esp+0x64]
  47ef19:	50                   	push   eax
  47ef1a:	52                   	push   edx
  47ef1b:	e8 00 a5 0a 00       	call   0x529420
  47ef20:	8d 4c 24 58          	lea    ecx,[esp+0x58]
  47ef24:	e8 57 a5 0a 00       	call   0x529480
  47ef29:	8b 54 24 60          	mov    edx,DWORD PTR [esp+0x60]
  47ef2d:	8b 7c 24 58          	mov    edi,DWORD PTR [esp+0x58]
  47ef31:	0f af 54 24 64       	imul   edx,DWORD PTR [esp+0x64]
  47ef36:	33 c0                	xor    eax,eax
  47ef38:	8b ca                	mov    ecx,edx
  47ef3a:	c1 e9 02             	shr    ecx,0x2
  47ef3d:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  47ef3f:	8b ca                	mov    ecx,edx
  47ef41:	83 e1 03             	and    ecx,0x3
  47ef44:	f3 aa                	rep stos BYTE PTR es:[edi],al
  47ef46:	8d 44 24 58          	lea    eax,[esp+0x58]
  47ef4a:	50                   	push   eax
  47ef4b:	e8 a0 91 0a 00       	call   0x5280f0
  47ef50:	83 c4 04             	add    esp,0x4
  47ef53:	56                   	push   esi
  47ef54:	6a 00                	push   0x0
  47ef56:	6a 00                	push   0x0
  47ef58:	e8 83 b8 0a 00       	call   0x52a7e0
  47ef5d:	33 c0                	xor    eax,eax
  47ef5f:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  47ef63:	8b 8c 24 38 01 00 00 	mov    ecx,DWORD PTR [esp+0x138]
  47ef6a:	83 c4 0c             	add    esp,0xc
  47ef6d:	8d 44 08 ff          	lea    eax,[eax+ecx*1-0x1]
  47ef71:	99                   	cdq
  47ef72:	f7 f9                	idiv   ecx
  47ef74:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  47ef78:	33 c0                	xor    eax,eax
  47ef7a:	66 8b 46 06          	mov    ax,WORD PTR [esi+0x6]
  47ef7e:	8d 44 08 ff          	lea    eax,[eax+ecx*1-0x1]
  47ef82:	99                   	cdq
  47ef83:	f7 f9                	idiv   ecx
  47ef85:	8b d8                	mov    ebx,eax
  47ef87:	0f af 44 24 18       	imul   eax,DWORD PTR [esp+0x18]
  47ef8c:	c1 e0 02             	shl    eax,0x2
  47ef8f:	50                   	push   eax
  47ef90:	e8 0b bd 0d 00       	call   0x55aca0
  47ef95:	8b 8c 24 34 01 00 00 	mov    ecx,DWORD PTR [esp+0x134]
  47ef9c:	83 c4 04             	add    esp,0x4
  47ef9f:	85 db                	test   ebx,ebx
  47efa1:	89 01                	mov    DWORD PTR [ecx],eax
  47efa3:	c7 44 24 1c 00 00 00 	mov    DWORD PTR [esp+0x1c],0x0
  47efaa:	00 
  47efab:	0f 8e bc 01 00 00    	jle    0x47f16d
  47efb1:	8b bc 24 2c 01 00 00 	mov    edi,DWORD PTR [esp+0x12c]
  47efb8:	89 5c 24 2c          	mov    DWORD PTR [esp+0x2c],ebx
  47efbc:	c7 44 24 28 00 00 00 	mov    DWORD PTR [esp+0x28],0x0
  47efc3:	00 
  47efc4:	83 7c 24 18 00       	cmp    DWORD PTR [esp+0x18],0x0
  47efc9:	0f 8e 82 01 00 00    	jle    0x47f151
  47efcf:	8b 9c 24 2c 01 00 00 	mov    ebx,DWORD PTR [esp+0x12c]
  47efd6:	8b 6c 24 1c          	mov    ebp,DWORD PTR [esp+0x1c]
  47efda:	c1 e5 02             	shl    ebp,0x2
  47efdd:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  47efe1:	89 44 24 24          	mov    DWORD PTR [esp+0x24],eax
  47efe5:	01 44 24 1c          	add    DWORD PTR [esp+0x1c],eax
  47efe9:	c7 44 24 20 00 00 00 	mov    DWORD PTR [esp+0x20],0x0
  47eff0:	00 
  47eff1:	8b 8c 24 30 01 00 00 	mov    ecx,DWORD PTR [esp+0x130]
  47eff8:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  47effc:	8b 01                	mov    eax,DWORD PTR [ecx]
  47effe:	8b 8c 24 2c 01 00 00 	mov    ecx,DWORD PTR [esp+0x12c]
  47f005:	03 c5                	add    eax,ebp
  47f007:	50                   	push   eax
  47f008:	68 00 18 00 00       	push   0x1800
  47f00d:	52                   	push   edx
  47f00e:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  47f013:	6a 00                	push   0x0
  47f015:	51                   	push   ecx
  47f016:	51                   	push   ecx
  47f017:	8b 50 04             	mov    edx,DWORD PTR [eax+0x4]
  47f01a:	52                   	push   edx
  47f01b:	e8 d0 04 fb ff       	call   0x42f4f0
  47f020:	c6 84 24 af 00 00 00 	mov    BYTE PTR [esp+0xaf],0x0
  47f027:	00 
  47f028:	c6 84 24 ac 00 00 00 	mov    BYTE PTR [esp+0xac],0x0
  47f02f:	00 
  47f030:	c6 84 24 ad 00 00 00 	mov    BYTE PTR [esp+0xad],0x0
  47f037:	00 
  47f038:	c6 84 24 ae 00 00 00 	mov    BYTE PTR [esp+0xae],0x0
  47f03f:	00 
  47f040:	c6 84 24 b0 00 00 00 	mov    BYTE PTR [esp+0xb0],0x0
  47f047:	00 
  47f048:	8d 8c 24 b4 00 00 00 	lea    ecx,[esp+0xb4]
  47f04f:	83 c4 1c             	add    esp,0x1c
  47f052:	e8 a9 a3 0a 00       	call   0x529400
  47f057:	8d 8c 24 80 00 00 00 	lea    ecx,[esp+0x80]
  47f05e:	8b 94 24 30 01 00 00 	mov    edx,DWORD PTR [esp+0x130]
  47f065:	c7 84 24 cc 00 00 00 	mov    DWORD PTR [esp+0xcc],0x0
  47f06c:	00 00 00 00 
  47f070:	51                   	push   ecx
  47f071:	8b 02                	mov    eax,DWORD PTR [edx]
  47f073:	8b 0c 28             	mov    ecx,DWORD PTR [eax+ebp*1]
  47f076:	51                   	push   ecx
  47f077:	e8 c4 a6 0a 00       	call   0x529740
  47f07c:	8d 8c 24 88 00 00 00 	lea    ecx,[esp+0x88]
  47f083:	83 c4 08             	add    esp,0x8
  47f086:	6a 00                	push   0x0
  47f088:	51                   	push   ecx
  47f089:	e8 42 ad 0a 00       	call   0x529dd0
  47f08e:	8d 8c 24 00 01 00 00 	lea    ecx,[esp+0x100]
  47f095:	83 c4 08             	add    esp,0x8
  47f098:	e8 63 a3 0a 00       	call   0x529400
  47f09d:	8d 8c 24 80 00 00 00 	lea    ecx,[esp+0x80]
  47f0a4:	8d 94 24 f8 00 00 00 	lea    edx,[esp+0xf8]
  47f0ab:	51                   	push   ecx
  47f0ac:	52                   	push   edx
  47f0ad:	e8 4e b7 0a 00       	call   0x52a800
  47f0b2:	8d 8c 24 d8 00 00 00 	lea    ecx,[esp+0xd8]
  47f0b9:	83 c4 08             	add    esp,0x8
  47f0bc:	e8 3f a3 0a 00       	call   0x529400
  47f0c1:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  47f0c5:	33 c0                	xor    eax,eax
  47f0c7:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  47f0cb:	89 4c 24 30          	mov    DWORD PTR [esp+0x30],ecx
  47f0cf:	3b c3                	cmp    eax,ebx
  47f0d1:	7c 02                	jl     0x47f0d5
  47f0d3:	8b c3                	mov    eax,ebx
  47f0d5:	89 44 24 38          	mov    DWORD PTR [esp+0x38],eax
  47f0d9:	8b 44 24 28          	mov    eax,DWORD PTR [esp+0x28]
  47f0dd:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  47f0e1:	33 c0                	xor    eax,eax
  47f0e3:	66 8b 46 06          	mov    ax,WORD PTR [esi+0x6]
  47f0e7:	3b c7                	cmp    eax,edi
  47f0e9:	7c 02                	jl     0x47f0ed
  47f0eb:	8b c7                	mov    eax,edi
  47f0ed:	8d 4c 24 30          	lea    ecx,[esp+0x30]
  47f0f1:	83 c5 04             	add    ebp,0x4
  47f0f4:	89 44 24 3c          	mov    DWORD PTR [esp+0x3c],eax
  47f0f8:	51                   	push   ecx
  47f0f9:	8d 84 24 d4 00 00 00 	lea    eax,[esp+0xd4]
  47f100:	8d 4c 24 5c          	lea    ecx,[esp+0x5c]
  47f104:	50                   	push   eax
  47f105:	e8 36 a4 0a 00       	call   0x529540
  47f10a:	8d 8c 24 d0 00 00 00 	lea    ecx,[esp+0xd0]
  47f111:	6a 00                	push   0x0
  47f113:	8d 94 24 fc 00 00 00 	lea    edx,[esp+0xfc]
  47f11a:	51                   	push   ecx
  47f11b:	8d 4c 24 1b          	lea    ecx,[esp+0x1b]
  47f11f:	52                   	push   edx
  47f120:	e8 eb b3 0a 00       	call   0x52a510
  47f125:	8d 8c 24 80 00 00 00 	lea    ecx,[esp+0x80]
  47f12c:	51                   	push   ecx
  47f12d:	e8 2e ad 0a 00       	call   0x529e60
  47f132:	03 9c 24 30 01 00 00 	add    ebx,DWORD PTR [esp+0x130]
  47f139:	8b 84 24 30 01 00 00 	mov    eax,DWORD PTR [esp+0x130]
  47f140:	01 44 24 24          	add    DWORD PTR [esp+0x24],eax
  47f144:	83 c4 04             	add    esp,0x4
  47f147:	ff 4c 24 24          	dec    DWORD PTR [esp+0x24]
  47f14b:	0f 85 a0 fe ff ff    	jne    0x47eff1
  47f151:	03 bc 24 2c 01 00 00 	add    edi,DWORD PTR [esp+0x12c]
  47f158:	8b 8c 24 2c 01 00 00 	mov    ecx,DWORD PTR [esp+0x12c]
  47f15f:	01 4c 24 28          	add    DWORD PTR [esp+0x28],ecx
  47f163:	ff 4c 24 2c          	dec    DWORD PTR [esp+0x2c]
  47f167:	0f 85 57 fe ff ff    	jne    0x47efc4
  47f16d:	8d 4c 24 58          	lea    ecx,[esp+0x58]
  47f171:	e8 4a a3 0a 00       	call   0x5294c0
  47f176:	8b 84 24 34 01 00 00 	mov    eax,DWORD PTR [esp+0x134]
  47f17d:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  47f181:	5d                   	pop    ebp
  47f182:	5f                   	pop    edi
  47f183:	5e                   	pop    esi
  47f184:	89 08                	mov    DWORD PTR [eax],ecx
  47f186:	33 c0                	xor    eax,eax
  47f188:	5b                   	pop    ebx
  47f189:	81 c4 10 01 00 00    	add    esp,0x110
  47f18f:	c3                   	ret
  47f190:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  47f196:	55                   	push   ebp
  47f197:	8b ec                	mov    ebp,esp
  47f199:	6a ff                	push   0xffffffff
  47f19b:	68 9d f2 47 00       	push   0x47f29d
  47f1a0:	50                   	push   eax
  47f1a1:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  47f1a8:	83 ec 04             	sub    esp,0x4
  47f1ab:	a1 f8 ef 87 00       	mov    eax,ds:0x87eff8
  47f1b0:	53                   	push   ebx
  47f1b1:	56                   	push   esi
  47f1b2:	8b 0d 8c 5a 98 00    	mov    ecx,DWORD PTR ds:0x985a8c
  47f1b8:	57                   	push   edi
  47f1b9:	68 fc e2 59 00       	push   0x59e2fc
  47f1be:	68 f4 e2 59 00       	push   0x59e2f4
  47f1c3:	6a 40                	push   0x40
  47f1c5:	50                   	push   eax
  47f1c6:	51                   	push   ecx
  47f1c7:	e8 c4 fc ff ff       	call   0x47ee90
  47f1cc:	83 c4 14             	add    esp,0x14
  47f1cf:	85 c0                	test   eax,eax
  47f1d1:	0f 85 b0 00 00 00    	jne    0x47f287
  47f1d7:	8b 3d fc e2 59 00    	mov    edi,DWORD PTR ds:0x59e2fc
  47f1dd:	8d 04 fd 00 00 00 00 	lea    eax,[edi*8+0x0]
  47f1e4:	2b c7                	sub    eax,edi
  47f1e6:	c1 e0 04             	shl    eax,0x4
  47f1e9:	50                   	push   eax
  47f1ea:	e8 b1 ba 0d 00       	call   0x55aca0
  47f1ef:	89 45 f0             	mov    DWORD PTR [ebp-0x10],eax
  47f1f2:	83 c4 04             	add    esp,0x4
  47f1f5:	c7 45 fc 00 00 00 00 	mov    DWORD PTR [ebp-0x4],0x0
  47f1fc:	8b f0                	mov    esi,eax
  47f1fe:	85 f6                	test   esi,esi
  47f200:	74 16                	je     0x47f218
  47f202:	8b de                	mov    ebx,esi
  47f204:	4f                   	dec    edi
  47f205:	78 0d                	js     0x47f214
  47f207:	8b cb                	mov    ecx,ebx
  47f209:	83 c3 70             	add    ebx,0x70
  47f20c:	e8 8f 98 fa ff       	call   0x428aa0
  47f211:	4f                   	dec    edi
  47f212:	79 f3                	jns    0x47f207
  47f214:	8b c6                	mov    eax,esi
  47f216:	eb 02                	jmp    0x47f21a
  47f218:	33 c0                	xor    eax,eax
  47f21a:	33 db                	xor    ebx,ebx
  47f21c:	33 ff                	xor    edi,edi
  47f21e:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  47f225:	a3 f8 e2 59 00       	mov    ds:0x59e2f8,eax
  47f22a:	39 1d fc e2 59 00    	cmp    DWORD PTR ds:0x59e2fc,ebx
  47f230:	7e 53                	jle    0x47f285
  47f232:	33 f6                	xor    esi,esi
  47f234:	6a 00                	push   0x0
  47f236:	a1 f4 e2 59 00       	mov    eax,ds:0x59e2f4
  47f23b:	6a 00                	push   0x0
  47f23d:	8b 0c 18             	mov    ecx,DWORD PTR [eax+ebx*1]
  47f240:	51                   	push   ecx
  47f241:	8b 0d f8 e2 59 00    	mov    ecx,DWORD PTR ds:0x59e2f8
  47f247:	03 ce                	add    ecx,esi
  47f249:	e8 12 a6 08 00       	call   0x509860
  47f24e:	8b 0d f4 e2 59 00    	mov    ecx,DWORD PTR ds:0x59e2f4
  47f254:	89 45 f0             	mov    DWORD PTR [ebp-0x10],eax
  47f257:	8b 04 19             	mov    eax,DWORD PTR [ecx+ebx*1]
  47f25a:	85 c0                	test   eax,eax
  47f25c:	74 12                	je     0x47f270
  47f25e:	50                   	push   eax
  47f25f:	8b 00                	mov    eax,DWORD PTR [eax]
  47f261:	ff 50 08             	call   DWORD PTR [eax+0x8]
  47f264:	a1 f4 e2 59 00       	mov    eax,ds:0x59e2f4
  47f269:	c7 04 18 00 00 00 00 	mov    DWORD PTR [eax+ebx*1],0x0
  47f270:	83 7d f0 00          	cmp    DWORD PTR [ebp-0x10],0x0
  47f274:	7c 22                	jl     0x47f298
  47f276:	83 c6 70             	add    esi,0x70
  47f279:	83 c3 04             	add    ebx,0x4
  47f27c:	47                   	inc    edi
  47f27d:	39 3d fc e2 59 00    	cmp    DWORD PTR ds:0x59e2fc,edi
  47f283:	7f af                	jg     0x47f234
  47f285:	33 c0                	xor    eax,eax
  47f287:	8b 4d f4             	mov    ecx,DWORD PTR [ebp-0xc]
  47f28a:	5f                   	pop    edi
  47f28b:	64 89 0d 00 00 00 00 	mov    DWORD PTR fs:0x0,ecx
  47f292:	5e                   	pop    esi
  47f293:	5b                   	pop    ebx
  47f294:	8b e5                	mov    esp,ebp
  47f296:	5d                   	pop    ebp
  47f297:	c3                   	ret
  47f298:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  47f29b:	eb ea                	jmp    0x47f287
  47f29d:	b8 40 53 59 00       	mov    eax,0x595340
  47f2a2:	e9 49 c5 0d 00       	jmp    0x55b7f0
  47f2a7:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  47f2aa:	50                   	push   eax
  47f2ab:	e8 a0 ba 0d 00       	call   0x55ad50
  47f2b0:	83 c4 04             	add    esp,0x4
  47f2b3:	c3                   	ret
  47f2b4:	cc                   	int3
  47f2b5:	cc                   	int3
  47f2b6:	cc                   	int3
  47f2b7:	cc                   	int3
  47f2b8:	cc                   	int3
  47f2b9:	cc                   	int3
  47f2ba:	cc                   	int3
  47f2bb:	cc                   	int3
  47f2bc:	cc                   	int3
  47f2bd:	cc                   	int3
  47f2be:	cc                   	int3
  47f2bf:	cc                   	int3
  47f2c0:	83 ec 18             	sub    esp,0x18
  47f2c3:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  47f2c8:	53                   	push   ebx
  47f2c9:	8b 80 48 06 00 00    	mov    eax,DWORD PTR [eax+0x648]
  47f2cf:	56                   	push   esi
  47f2d0:	57                   	push   edi
  47f2d1:	55                   	push   ebp
  47f2d2:	8b 35 8c 5a 98 00    	mov    esi,DWORD PTR ds:0x985a8c
  47f2d8:	6a 01                	push   0x1
  47f2da:	8b 18                	mov    ebx,DWORD PTR [eax]
  47f2dc:	6a 11                	push   0x11
  47f2de:	50                   	push   eax
  47f2df:	ff 53 5c             	call   DWORD PTR [ebx+0x5c]
  47f2e2:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  47f2e8:	6a 01                	push   0x1
  47f2ea:	6a 12                	push   0x12
  47f2ec:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  47f2f2:	50                   	push   eax
  47f2f3:	8b 18                	mov    ebx,DWORD PTR [eax]
  47f2f5:	ff 53 5c             	call   DWORD PTR [ebx+0x5c]
  47f2f8:	c7 44 24 24 00 00 00 	mov    DWORD PTR [esp+0x24],0x0
  47f2ff:	00 
  47f300:	83 3d fc e2 59 00 00 	cmp    DWORD PTR ds:0x59e2fc,0x0
  47f307:	0f 8e 65 01 00 00    	jle    0x47f472
  47f30d:	33 ed                	xor    ebp,ebp
  47f30f:	bb 40 00 00 00       	mov    ebx,0x40
  47f314:	33 ff                	xor    edi,edi
  47f316:	a1 98 5a 98 00       	mov    eax,ds:0x985a98
  47f31b:	03 c7                	add    eax,edi
  47f31d:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  47f321:	33 c0                	xor    eax,eax
  47f323:	db 44 24 10          	fild   DWORD PTR [esp+0x10]
  47f327:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  47f32b:	3b c7                	cmp    eax,edi
  47f32d:	d9 5c 24 18          	fstp   DWORD PTR [esp+0x18]
  47f331:	db 05 9c 5a 98 00    	fild   DWORD PTR ds:0x985a9c
  47f337:	7d 1a                	jge    0x47f353
  47f339:	d9 5c 24 1c          	fstp   DWORD PTR [esp+0x1c]
  47f33d:	03 c3                	add    eax,ebx
  47f33f:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  47f343:	db 44 24 10          	fild   DWORD PTR [esp+0x10]
  47f347:	d8 0d 58 f5 58 00    	fmul   DWORD PTR ds:0x58f558
  47f34d:	d9 5c 24 20          	fstp   DWORD PTR [esp+0x20]
  47f351:	eb 0c                	jmp    0x47f35f
  47f353:	d9 5c 24 1c          	fstp   DWORD PTR [esp+0x1c]
  47f357:	c7 44 24 20 00 00 80 	mov    DWORD PTR [esp+0x20],0x3f800000
  47f35e:	3f 
  47f35f:	33 c0                	xor    eax,eax
  47f361:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  47f365:	66 8b 46 06          	mov    ax,WORD PTR [esi+0x6]
  47f369:	8b 15 f8 e2 59 00    	mov    edx,DWORD PTR ds:0x59e2f8
  47f36f:	83 c5 70             	add    ebp,0x70
  47f372:	83 eb 40             	sub    ebx,0x40
  47f375:	83 c7 40             	add    edi,0x40
  47f378:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  47f37c:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  47f380:	89 0d 60 e3 59 00    	mov    DWORD PTR ds:0x59e360,ecx
  47f386:	89 0d 00 e3 59 00    	mov    DWORD PTR ds:0x59e300,ecx
  47f38c:	a3 24 e3 59 00       	mov    ds:0x59e324,eax
  47f391:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  47f395:	a3 04 e3 59 00       	mov    ds:0x59e304,eax
  47f39a:	c7 44 24 14 00 00 00 	mov    DWORD PTR [esp+0x14],0x0
  47f3a1:	00 
  47f3a2:	df 6c 24 10          	fild   QWORD PTR [esp+0x10]
  47f3a6:	33 c0                	xor    eax,eax
  47f3a8:	d8 0d 58 f5 58 00    	fmul   DWORD PTR ds:0x58f558
  47f3ae:	d9 44 24 18          	fld    DWORD PTR [esp+0x18]
  47f3b2:	d8 05 60 f5 58 00    	fadd   DWORD PTR ds:0x58f560
  47f3b8:	d9 15 40 e3 59 00    	fst    DWORD PTR ds:0x59e340
  47f3be:	d9 1d 20 e3 59 00    	fstp   DWORD PTR ds:0x59e320
  47f3c4:	66 8b 46 06          	mov    ax,WORD PTR [esi+0x6]
  47f3c8:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  47f3cc:	89 0d 58 e3 59 00    	mov    DWORD PTR ds:0x59e358,ecx
  47f3d2:	db 44 24 10          	fild   DWORD PTR [esp+0x10]
  47f3d6:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  47f3db:	89 0d 38 e3 59 00    	mov    DWORD PTR ds:0x59e338,ecx
  47f3e1:	c7 05 78 e3 59 00 00 	mov    DWORD PTR ds:0x59e378,0x0
  47f3e8:	00 00 00 
  47f3eb:	d8 44 24 1c          	fadd   DWORD PTR [esp+0x1c]
  47f3ef:	c7 05 18 e3 59 00 00 	mov    DWORD PTR ds:0x59e318,0x0
  47f3f6:	00 00 00 
  47f3f9:	c7 05 3c e3 59 00 00 	mov    DWORD PTR ds:0x59e33c,0x0
  47f400:	00 00 00 
  47f403:	c7 05 1c e3 59 00 00 	mov    DWORD PTR ds:0x59e31c,0x0
  47f40a:	00 00 00 
  47f40d:	d9 15 64 e3 59 00    	fst    DWORD PTR ds:0x59e364
  47f413:	d9 1d 44 e3 59 00    	fstp   DWORD PTR ds:0x59e344
  47f419:	d9 15 7c e3 59 00    	fst    DWORD PTR ds:0x59e37c
  47f41f:	d9 1d 5c e3 59 00    	fstp   DWORD PTR ds:0x59e35c
  47f425:	8b 88 48 06 00 00    	mov    ecx,DWORD PTR [eax+0x648]
  47f42b:	8b 44 2a d0          	mov    eax,DWORD PTR [edx+ebp*1-0x30]
  47f42f:	50                   	push   eax
  47f430:	6a 01                	push   0x1
  47f432:	51                   	push   ecx
  47f433:	8b 01                	mov    eax,DWORD PTR [ecx]
  47f435:	ff 50 5c             	call   DWORD PTR [eax+0x5c]
  47f438:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  47f43e:	6a 08                	push   0x8
  47f440:	6a 06                	push   0x6
  47f442:	68 80 e3 59 00       	push   0x59e380
  47f447:	8b 81 48 06 00 00    	mov    eax,DWORD PTR [ecx+0x648]
  47f44d:	6a 04                	push   0x4
  47f44f:	68 00 e3 59 00       	push   0x59e300
  47f454:	6a 03                	push   0x3
  47f456:	6a 04                	push   0x4
  47f458:	50                   	push   eax
  47f459:	8b 00                	mov    eax,DWORD PTR [eax]
  47f45b:	ff 50 78             	call   DWORD PTR [eax+0x78]
  47f45e:	ff 44 24 24          	inc    DWORD PTR [esp+0x24]
  47f462:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  47f466:	39 05 fc e2 59 00    	cmp    DWORD PTR ds:0x59e2fc,eax
  47f46c:	0f 8f a4 fe ff ff    	jg     0x47f316
  47f472:	5d                   	pop    ebp
  47f473:	5f                   	pop    edi
  47f474:	5e                   	pop    esi
  47f475:	5b                   	pop    ebx
  47f476:	83 c4 18             	add    esp,0x18
  47f479:	c3                   	ret
  47f47a:	cc                   	int3
  47f47b:	cc                   	int3
  47f47c:	cc                   	int3
  47f47d:	cc                   	int3
  47f47e:	cc                   	int3
  47f47f:	cc                   	int3
