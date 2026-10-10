
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00426d70 <.text+0x25d70>:
  426d70:	80 0d b2 08 96 00 02 	or     BYTE PTR ds:0x9608b2,0x2
  426d77:	81 ec 20 02 00 00    	sub    esp,0x220
  426d7d:	80 0d b2 08 96 00 04 	or     BYTE PTR ds:0x9608b2,0x4
  426d84:	56                   	push   esi
  426d85:	8b b4 24 28 02 00 00 	mov    esi,DWORD PTR [esp+0x228]
  426d8c:	8d 04 b6             	lea    eax,[esi+esi*4]
  426d8f:	8d 0c c6             	lea    ecx,[esi+eax*8]
  426d92:	f6 04 8d 09 a4 89 00 	test   BYTE PTR [ecx*4+0x89a409],0x1
  426d99:	01 
  426d9a:	74 07                	je     0x426da3
  426d9c:	80 0d b2 08 96 00 01 	or     BYTE PTR ds:0x9608b2,0x1
  426da3:	8d 44 24 04          	lea    eax,[esp+0x4]
  426da7:	6a 00                	push   0x0
  426da9:	68 ec 99 59 00       	push   0x5999ec
  426dae:	50                   	push   eax
  426daf:	e8 2c 92 0d 00       	call   0x4fffe0
  426db4:	8d 44 24 10          	lea    eax,[esp+0x10]
  426db8:	83 c4 0c             	add    esp,0xc
  426dbb:	8d 8c 24 14 01 00 00 	lea    ecx,[esp+0x114]
  426dc2:	56                   	push   esi
  426dc3:	68 b0 c1 59 00       	push   0x59c1b0
  426dc8:	6a 00                	push   0x0
  426dca:	68 d0 c1 59 00       	push   0x59c1d0
  426dcf:	50                   	push   eax
  426dd0:	68 9c c1 59 00       	push   0x59c19c
  426dd5:	51                   	push   ecx
  426dd6:	e8 75 46 13 00       	call   0x55b450
  426ddb:	83 c4 1c             	add    esp,0x1c
  426dde:	6a 01                	push   0x1
  426de0:	e8 6b 46 06 00       	call   0x48b450
  426de5:	83 c4 04             	add    esp,0x4
  426de8:	33 f6                	xor    esi,esi
  426dea:	6a 01                	push   0x1
  426dec:	e8 ef c6 01 00       	call   0x4434e0
  426df1:	83 c4 04             	add    esp,0x4
  426df4:	e8 77 ab 00 00       	call   0x431970
  426df9:	8d 8c 24 14 01 00 00 	lea    ecx,[esp+0x114]
  426e00:	68 64 19 0d 00       	push   0xd1964
  426e05:	c7 05 9e aa 96 00 6b 	mov    DWORD PTR ds:0x96aa9e,0x6b
  426e0c:	00 00 00 
  426e0f:	68 78 d1 89 00       	push   0x89d178
  426e14:	51                   	push   ecx
  426e15:	e8 16 f3 0f 00       	call   0x526130
  426e1a:	83 c4 0c             	add    esp,0xc
  426e1d:	85 c0                	test   eax,eax
  426e1f:	75 05                	jne    0x426e26
  426e21:	be 64 19 0d 00       	mov    esi,0xd1964
  426e26:	6a 00                	push   0x0
  426e28:	e8 b3 c6 01 00       	call   0x4434e0
  426e2d:	83 c4 04             	add    esp,0x4
  426e30:	80 3d b0 5d 89 00 01 	cmp    BYTE PTR ds:0x895db0,0x1
  426e37:	75 0c                	jne    0x426e45
  426e39:	c6 05 b0 5d 89 00 00 	mov    BYTE PTR ds:0x895db0,0x0
  426e40:	e8 9b 45 06 00       	call   0x48b3e0
  426e45:	81 ee 64 19 0d 00    	sub    esi,0xd1964
  426e4b:	83 fe 01             	cmp    esi,0x1
  426e4e:	5e                   	pop    esi
  426e4f:	1b c0                	sbb    eax,eax
  426e51:	81 c4 20 02 00 00    	add    esp,0x220
  426e57:	f7 d8                	neg    eax
  426e59:	c3                   	ret
  426e5a:	cc                   	int3
  426e5b:	cc                   	int3
  426e5c:	cc                   	int3
  426e5d:	cc                   	int3
  426e5e:	cc                   	int3
  426e5f:	cc                   	int3
  426e60:	81 ec 24 02 00 00    	sub    esp,0x224
  426e66:	8d 44 24 04          	lea    eax,[esp+0x4]
  426e6a:	53                   	push   ebx
  426e6b:	56                   	push   esi
  426e6c:	6a 00                	push   0x0
  426e6e:	68 ec 99 59 00       	push   0x5999ec
  426e73:	50                   	push   eax
  426e74:	e8 67 91 0d 00       	call   0x4fffe0
  426e79:	8b b4 24 3c 02 00 00 	mov    esi,DWORD PTR [esp+0x23c]
  426e80:	8d 44 24 18          	lea    eax,[esp+0x18]
  426e84:	8d 8c 24 28 01 00 00 	lea    ecx,[esp+0x128]
  426e8b:	83 c4 0c             	add    esp,0xc
  426e8e:	56                   	push   esi
  426e8f:	68 b0 c1 59 00       	push   0x59c1b0
  426e94:	68 d0 c1 59 00       	push   0x59c1d0
  426e99:	50                   	push   eax
  426e9a:	68 dc c1 59 00       	push   0x59c1dc
  426e9f:	51                   	push   ecx
  426ea0:	e8 ab 45 13 00       	call   0x55b450
  426ea5:	c7 44 24 20 00 00 00 	mov    DWORD PTR [esp+0x20],0x0
  426eac:	00 
  426ead:	83 c4 18             	add    esp,0x18
  426eb0:	e8 4b c3 07 00       	call   0x4a3200
  426eb5:	e8 66 ce 07 00       	call   0x4a3d20
  426eba:	8d 8c 24 1c 01 00 00 	lea    ecx,[esp+0x11c]
  426ec1:	51                   	push   ecx
  426ec2:	68 23 cd 89 00       	push   0x89cd23
  426ec7:	e8 e4 92 0d 00       	call   0x5001b0
  426ecc:	8d 4c 24 10          	lea    ecx,[esp+0x10]
  426ed0:	83 c4 08             	add    esp,0x8
  426ed3:	51                   	push   ecx
  426ed4:	68 ff ff ff 0f       	push   0xfffffff
  426ed9:	68 78 d1 89 00       	push   0x89d178
  426ede:	68 23 cd 89 00       	push   0x89cd23
  426ee3:	e8 98 f0 0f 00       	call   0x525f80
  426ee8:	83 c4 10             	add    esp,0x10
  426eeb:	83 7c 24 08 00       	cmp    DWORD PTR [esp+0x8],0x0
  426ef0:	0f 84 ab 01 00 00    	je     0x4270a1
  426ef6:	6a 6b                	push   0x6b
  426ef8:	a1 9e aa 96 00       	mov    eax,ds:0x96aa9e
  426efd:	50                   	push   eax
  426efe:	e8 1d 12 00 00       	call   0x428120
  426f03:	83 c4 08             	add    esp,0x8
  426f06:	83 fe 63             	cmp    esi,0x63
  426f09:	75 2c                	jne    0x426f37
  426f0b:	81 0d 65 c6 89 00 00 	or     DWORD PTR ds:0x89c665,0x200
  426f12:	02 00 00 
  426f15:	6a 00                	push   0x0
  426f17:	e8 e4 35 00 00       	call   0x42a500
  426f1c:	83 c4 04             	add    esp,0x4
  426f1f:	6a 01                	push   0x1
  426f21:	e8 4a 57 fe ff       	call   0x40c670
  426f26:	83 c4 04             	add    esp,0x4
  426f29:	6a 00                	push   0x0
  426f2b:	e8 30 5e 00 00       	call   0x42cd60
  426f30:	83 c4 04             	add    esp,0x4
  426f33:	6a 00                	push   0x0
  426f35:	eb 44                	jmp    0x426f7b
  426f37:	81 25 65 c6 89 00 ff 	and    DWORD PTR ds:0x89c665,0xfffffdff
  426f3e:	fd ff ff 
  426f41:	33 c0                	xor    eax,eax
  426f43:	a0 a1 b7 89 00       	mov    al,ds:0x89b7a1
  426f48:	50                   	push   eax
  426f49:	e8 b2 35 00 00       	call   0x42a500
  426f4e:	83 c4 04             	add    esp,0x4
  426f51:	8a 0d a2 b7 89 00    	mov    cl,BYTE PTR ds:0x89b7a2
  426f57:	51                   	push   ecx
  426f58:	e8 13 57 fe ff       	call   0x40c670
  426f5d:	83 c4 04             	add    esp,0x4
  426f60:	a0 a3 b7 89 00       	mov    al,ds:0x89b7a3
  426f65:	24 01                	and    al,0x1
  426f67:	50                   	push   eax
  426f68:	e8 f3 5d 00 00       	call   0x42cd60
  426f6d:	83 c4 04             	add    esp,0x4
  426f70:	a0 a3 b7 89 00       	mov    al,ds:0x89b7a3
  426f75:	24 02                	and    al,0x2
  426f77:	c0 e8 01             	shr    al,0x1
  426f7a:	50                   	push   eax
  426f7b:	e8 10 5e 00 00       	call   0x42cd90
  426f80:	83 c4 04             	add    esp,0x4
  426f83:	6a 00                	push   0x0
  426f85:	e8 56 c5 01 00       	call   0x4434e0
  426f8a:	83 c4 04             	add    esp,0x4
  426f8d:	e8 4e aa 00 00       	call   0x4319e0
  426f92:	a1 7c d1 89 00       	mov    eax,ds:0x89d17c
  426f97:	83 e0 20             	and    eax,0x20
  426f9a:	c1 e8 05             	shr    eax,0x5
  426f9d:	50                   	push   eax
  426f9e:	e8 7d b6 07 00       	call   0x4a2620
  426fa3:	83 c4 04             	add    esp,0x4
  426fa6:	e8 55 73 0c 00       	call   0x4ee300
  426fab:	e8 10 5b 0c 00       	call   0x4ecac0
  426fb0:	e8 7b c2 0d 00       	call   0x503230
  426fb5:	e8 a6 cf 0d 00       	call   0x503f60
  426fba:	e8 51 49 00 00       	call   0x42b910
  426fbf:	81 0d 1c ca 87 00 80 	or     DWORD PTR ds:0x87ca1c,0x80
  426fc6:	00 00 00 
  426fc9:	83 fe 63             	cmp    esi,0x63
  426fcc:	0f 85 c1 00 00 00    	jne    0x427093
  426fd2:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  426fd9:	8b c8                	mov    ecx,eax
  426fdb:	8d 14 80             	lea    edx,[eax+eax*4]
  426fde:	8d 04 51             	lea    eax,[ecx+edx*2]
  426fe1:	8d 1c c0             	lea    ebx,[eax+eax*8]
  426fe4:	8d 14 d9             	lea    edx,[ecx+ebx*8]
  426fe7:	8b b4 91 65 da 89 00 	mov    esi,DWORD PTR [ecx+edx*4+0x89da65]
  426fee:	85 f6                	test   esi,esi
  426ff0:	0f 84 9d 00 00 00    	je     0x427093
  426ff6:	56                   	push   esi
  426ff7:	e8 a4 fc 00 00       	call   0x436ca0
  426ffc:	83 c4 04             	add    esp,0x4
  426fff:	56                   	push   esi
  427000:	e8 3b 2b 0c 00       	call   0x4e9b40
  427005:	83 c4 04             	add    esp,0x4
  427008:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  42700c:	75 4d                	jne    0x42705b
  42700e:	8a 46 2c             	mov    al,BYTE PTR [esi+0x2c]
  427011:	88 46 7d             	mov    BYTE PTR [esi+0x7d],al
  427014:	f6 05 7c d1 89 00 02 	test   BYTE PTR ds:0x89d17c,0x2
  42701b:	74 17                	je     0x427034
  42701d:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  427020:	3c 07                	cmp    al,0x7
  427022:	75 04                	jne    0x427028
  427024:	b3 27                	mov    bl,0x27
  427026:	eb 1e                	jmp    0x427046
  427028:	33 c9                	xor    ecx,ecx
  42702a:	8a c8                	mov    cl,al
  42702c:	8d 04 89             	lea    eax,[ecx+ecx*4]
  42702f:	8d 14 80             	lea    edx,[eax+eax*4]
  427032:	eb 0b                	jmp    0x42703f
  427034:	33 c0                	xor    eax,eax
  427036:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  427039:	8d 0c 80             	lea    ecx,[eax+eax*4]
  42703c:	8d 14 89             	lea    edx,[ecx+ecx*4]
  42703f:	8a 1c 55 64 70 5a 00 	mov    bl,BYTE PTR [edx*2+0x5a7064]
  427046:	56                   	push   esi
  427047:	e8 a4 66 0c 00       	call   0x4ed6f0
  42704c:	83 c4 04             	add    esp,0x4
  42704f:	88 5e 2c             	mov    BYTE PTR [esi+0x2c],bl
  427052:	56                   	push   esi
  427053:	e8 e8 65 0c 00       	call   0x4ed640
  427058:	83 c4 04             	add    esp,0x4
  42705b:	8b 46 3d             	mov    eax,DWORD PTR [esi+0x3d]
  42705e:	89 46 68             	mov    DWORD PTR [esi+0x68],eax
  427061:	66 25 00 fe          	and    ax,0xfe00
  427065:	66 05 00 01          	add    ax,0x100
  427069:	66 89 46 68          	mov    WORD PTR [esi+0x68],ax
  42706d:	66 8b 46 6a          	mov    ax,WORD PTR [esi+0x6a]
  427071:	66 25 00 fe          	and    ax,0xfe00
  427075:	66 05 00 01          	add    ax,0x100
  427079:	66 89 46 6a          	mov    WORD PTR [esi+0x6a],ax
  42707d:	8a 86 82 00 00 00    	mov    al,BYTE PTR [esi+0x82]
  427083:	24 f0                	and    al,0xf0
  427085:	88 86 82 00 00 00    	mov    BYTE PTR [esi+0x82],al
  42708b:	24 0f                	and    al,0xf
  42708d:	88 86 82 00 00 00    	mov    BYTE PTR [esi+0x82],al
  427093:	b8 01 00 00 00       	mov    eax,0x1
  427098:	5e                   	pop    esi
  427099:	5b                   	pop    ebx
  42709a:	81 c4 24 02 00 00    	add    esp,0x224
  4270a0:	c3                   	ret
  4270a1:	33 c0                	xor    eax,eax
  4270a3:	5e                   	pop    esi
  4270a4:	5b                   	pop    ebx
  4270a5:	81 c4 24 02 00 00    	add    esp,0x224
  4270ab:	c3                   	ret
  4270ac:	cc                   	int3
  4270ad:	cc                   	int3
  4270ae:	cc                   	int3
  4270af:	cc                   	int3
  4270b0:	81 ec 28 02 00 00    	sub    esp,0x228
  4270b6:	8d 44 24 08          	lea    eax,[esp+0x8]
  4270ba:	6a 00                	push   0x0
  4270bc:	68 ec 99 59 00       	push   0x5999ec
  4270c1:	50                   	push   eax
  4270c2:	e8 19 8f 0d 00       	call   0x4fffe0
  4270c7:	8b 84 24 3c 02 00 00 	mov    eax,DWORD PTR [esp+0x23c]
  4270ce:	8d 4c 24 14          	lea    ecx,[esp+0x14]
  4270d2:	8d 94 24 24 01 00 00 	lea    edx,[esp+0x124]
  4270d9:	83 c4 0c             	add    esp,0xc
  4270dc:	68 30 98 59 00       	push   0x599830
  4270e1:	50                   	push   eax
  4270e2:	68 d0 c1 59 00       	push   0x59c1d0
  4270e7:	51                   	push   ecx
  4270e8:	68 b4 c1 59 00       	push   0x59c1b4
  4270ed:	52                   	push   edx
  4270ee:	e8 5d 43 13 00       	call   0x55b450
  4270f3:	83 c4 18             	add    esp,0x18
  4270f6:	e8 05 c1 07 00       	call   0x4a3200
  4270fb:	e8 20 cc 07 00       	call   0x4a3d20
  427100:	8d 8c 24 18 01 00 00 	lea    ecx,[esp+0x118]
  427107:	51                   	push   ecx
  427108:	68 23 cd 89 00       	push   0x89cd23
  42710d:	e8 9e 90 0d 00       	call   0x5001b0
  427112:	8d 4c 24 08          	lea    ecx,[esp+0x8]
  427116:	83 c4 08             	add    esp,0x8
  427119:	68 10 00 00 c0       	push   0xc0000010
  42711e:	68 23 cd 89 00       	push   0x89cd23
  427123:	51                   	push   ecx
  427124:	e8 57 f1 0f 00       	call   0x526280
  427129:	83 c4 0c             	add    esp,0xc
  42712c:	85 c0                	test   eax,eax
  42712e:	75 53                	jne    0x427183
  427130:	8d 44 24 04          	lea    eax,[esp+0x4]
  427134:	8b 8c 24 2c 02 00 00 	mov    ecx,DWORD PTR [esp+0x22c]
  42713b:	8b 54 24 00          	mov    edx,DWORD PTR [esp+0x0]
  42713f:	50                   	push   eax
  427140:	68 98 13 00 00       	push   0x1398
  427145:	51                   	push   ecx
  427146:	52                   	push   edx
  427147:	e8 94 f4 0f 00       	call   0x5265e0
  42714c:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  427150:	83 c4 10             	add    esp,0x10
  427153:	81 7c 24 04 98 13 00 	cmp    DWORD PTR [esp+0x4],0x1398
  42715a:	00 
  42715b:	50                   	push   eax
  42715c:	74 11                	je     0x42716f
  42715e:	e8 0d f2 0f 00       	call   0x526370
  427163:	83 c4 04             	add    esp,0x4
  427166:	33 c0                	xor    eax,eax
  427168:	81 c4 28 02 00 00    	add    esp,0x228
  42716e:	c3                   	ret
  42716f:	e8 fc f1 0f 00       	call   0x526370
  427174:	83 c4 04             	add    esp,0x4
  427177:	b8 01 00 00 00       	mov    eax,0x1
  42717c:	81 c4 28 02 00 00    	add    esp,0x228
  427182:	c3                   	ret
  427183:	33 c0                	xor    eax,eax
  427185:	81 c4 28 02 00 00    	add    esp,0x228
  42718b:	c3                   	ret
  42718c:	cc                   	int3
  42718d:	cc                   	int3
  42718e:	cc                   	int3
  42718f:	cc                   	int3
  427190:	81 ec 20 02 00 00    	sub    esp,0x220
  427196:	8d 84 24 10 01 00 00 	lea    eax,[esp+0x110]
  42719d:	56                   	push   esi
  42719e:	57                   	push   edi
  42719f:	6a 00                	push   0x0
  4271a1:	68 ec 99 59 00       	push   0x5999ec
  4271a6:	33 ff                	xor    edi,edi
  4271a8:	50                   	push   eax
  4271a9:	e8 32 8e 0d 00       	call   0x4fffe0
  4271ae:	8b b4 24 38 02 00 00 	mov    esi,DWORD PTR [esp+0x238]
  4271b5:	83 c4 0c             	add    esp,0xc
  4271b8:	83 ff 1e             	cmp    edi,0x1e
  4271bb:	75 05                	jne    0x4271c2
  4271bd:	bf 63 00 00 00       	mov    edi,0x63
  4271c2:	8d 84 24 18 01 00 00 	lea    eax,[esp+0x118]
  4271c9:	57                   	push   edi
  4271ca:	8d 4c 24 0c          	lea    ecx,[esp+0xc]
  4271ce:	68 b0 c1 59 00       	push   0x59c1b0
  4271d3:	56                   	push   esi
  4271d4:	68 d0 c1 59 00       	push   0x59c1d0
  4271d9:	50                   	push   eax
  4271da:	68 9c c1 59 00       	push   0x59c19c
  4271df:	51                   	push   ecx
  4271e0:	e8 6b 42 13 00       	call   0x55b450
  4271e5:	8d 4c 24 24          	lea    ecx,[esp+0x24]
  4271e9:	83 c4 1c             	add    esp,0x1c
  4271ec:	51                   	push   ecx
  4271ed:	e8 8e f2 0f 00       	call   0x526480
  4271f2:	83 c4 04             	add    esp,0x4
  4271f5:	85 c0                	test   eax,eax
  4271f7:	74 0d                	je     0x427206
  4271f9:	8d 44 24 08          	lea    eax,[esp+0x8]
  4271fd:	50                   	push   eax
  4271fe:	e8 fd f2 0f 00       	call   0x526500
  427203:	83 c4 04             	add    esp,0x4
  427206:	47                   	inc    edi
  427207:	83 ff 1f             	cmp    edi,0x1f
  42720a:	7c ac                	jl     0x4271b8
  42720c:	5f                   	pop    edi
  42720d:	5e                   	pop    esi
  42720e:	81 c4 20 02 00 00    	add    esp,0x220
  427214:	c3                   	ret
  427215:	cc                   	int3
  427216:	cc                   	int3
  427217:	cc                   	int3
  427218:	cc                   	int3
  427219:	cc                   	int3
  42721a:	cc                   	int3
  42721b:	cc                   	int3
  42721c:	cc                   	int3
  42721d:	cc                   	int3
  42721e:	cc                   	int3
  42721f:	cc                   	int3
