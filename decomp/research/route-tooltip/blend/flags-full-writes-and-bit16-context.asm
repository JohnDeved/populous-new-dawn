  41ea6d:	66 c1 e8 01          	shr    ax,0x1
  41ea71:	0f b7 c0             	movzx  eax,ax
  41ea74:	2b f0                	sub    esi,eax
  41ea76:	33 c0                	xor    eax,eax
  41ea78:	66 8b 42 06          	mov    ax,WORD PTR [edx+0x6]
  41ea7c:	2b d8                	sub    ebx,eax
  41ea7e:	f6 41 36 40          	test   BYTE PTR [ecx+0x36],0x40
  41ea82:	74 06                	je     0x41ea8a
  41ea84:	09 2d 74 a0 5d 00    	or     DWORD PTR ds:0x5da074,ebp
  41ea8a:	8a 41 3c             	mov    al,BYTE PTR [ecx+0x3c]
  41ea8d:	3c f1                	cmp    al,0xf1
  41ea8f:	7c 50                	jl     0x41eae1
  41ea91:	3c 0f                	cmp    al,0xf
  41ea93:	7f 57                	jg     0x41eaec
  41ea95:	74 0e                	je     0x41eaa5
  41ea97:	0f be c0             	movsx  eax,al
  41ea9a:	c1 e0 0c             	shl    eax,0xc


  41ea9a:	c1 e0 0c             	shl    eax,0xc
  41ea9d:	05 00 f0 87 00       	add    eax,0x87f000
  41eaa2:	50                   	push   eax
  41eaa3:	eb 05                	jmp    0x41eaaa
  41eaa5:	68 00 f0 87 00       	push   0x87f000
  41eaaa:	e8 c1 77 0f 00       	call   0x516270
  41eaaf:	83 c4 04             	add    esp,0x4
  41eab2:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  41eab7:	09 2d 74 a0 5d 00    	or     DWORD PTR ds:0x5da074,ebp
  41eabd:	8d 0c f8             	lea    ecx,[eax+edi*8]
  41eac0:	51                   	push   ecx
  41eac1:	53                   	push   ebx
  41eac2:	56                   	push   esi
  41eac3:	e8 18 78 0f 00       	call   0x5162e0
  41eac8:	83 c4 0c             	add    esp,0xc
  41eacb:	68 60 45 97 00       	push   0x974560
  41ead0:	e8 9b 77 0f 00       	call   0x516270


  45981a:	53                   	push   ebx
  45981b:	56                   	push   esi
  45981c:	57                   	push   edi
  45981d:	74 28                	je     0x459847
  45981f:	a1 e8 9d 74 00       	mov    eax,ds:0x749de8
  459824:	8b 74 24 24          	mov    esi,DWORD PTR [esp+0x24]
  459828:	8b 7c 24 20          	mov    edi,DWORD PTR [esp+0x20]
  45982c:	50                   	push   eax
  45982d:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  459834:	56                   	push   esi
  459835:	57                   	push   edi
  459836:	e8 a5 ca 0b 00       	call   0x5162e0
  45983b:	83 25 74 a0 5d 00 ef 	and    DWORD PTR ds:0x5da074,0xffffffef
  459842:	83 c4 0c             	add    esp,0xc
  459845:	eb 18                	jmp    0x45985f
  459847:	a1 d0 9d 74 00       	mov    eax,ds:0x749dd0
  45984c:	8b 74 24 24          	mov    esi,DWORD PTR [esp+0x24]


  45f053:	3b 3d 18 df 59 00    	cmp    edi,DWORD PTR ds:0x59df18
  45f059:	0f 86 bd 01 00 00    	jbe    0x45f21c
  45f05f:	66 8b 46 06          	mov    ax,WORD PTR [esi+0x6]
  45f063:	66 0f b6 4c 24 13    	movzx  cx,BYTE PTR [esp+0x13]
  45f069:	66 25 0f 00          	and    ax,0xf
  45f06d:	66 0b c1             	or     ax,cx
  45f070:	0f b7 d0             	movzx  edx,ax
  45f073:	33 c0                	xor    eax,eax
  45f075:	89 15 74 a0 5d 00    	mov    DWORD PTR ds:0x5da074,edx
  45f07b:	66 8b 5e 04          	mov    bx,WORD PTR [esi+0x4]
  45f07f:	a0 64 d1 89 00       	mov    al,ds:0x89d164
  45f084:	66 8b 4e 02          	mov    cx,WORD PTR [esi+0x2]
  45f088:	83 f8 01             	cmp    eax,0x1
  45f08b:	74 0e                	je     0x45f09b
  45f08d:	83 f8 02             	cmp    eax,0x2
  45f090:	0f 84 85 00 00 00    	je     0x45f11b
  45f096:	e9 62 01 00 00       	jmp    0x45f1fd


  45f29f:	66 8b 46 06          	mov    ax,WORD PTR [esi+0x6]
  45f2a3:	33 c9                	xor    ecx,ecx
  45f2a5:	24 0f                	and    al,0xf
  45f2a7:	0a 44 24 13          	or     al,BYTE PTR [esp+0x13]
  45f2ab:	34 01                	xor    al,0x1
  45f2ad:	8a c8                	mov    cl,al
  45f2af:	33 c0                	xor    eax,eax
  45f2b1:	a0 64 d1 89 00       	mov    al,ds:0x89d164
  45f2b6:	89 0d 74 a0 5d 00    	mov    DWORD PTR ds:0x5da074,ecx
  45f2bc:	66 8b 5e 04          	mov    bx,WORD PTR [esi+0x4]
  45f2c0:	66 8b 4e 02          	mov    cx,WORD PTR [esi+0x2]
  45f2c4:	66 03 4f 04          	add    cx,WORD PTR [edi+0x4]
  45f2c8:	66 f7 d9             	neg    cx
  45f2cb:	83 f8 01             	cmp    eax,0x1
  45f2ce:	74 0e                	je     0x45f2de
  45f2d0:	83 f8 02             	cmp    eax,0x2
  45f2d3:	0f 84 85 00 00 00    	je     0x45f35e


  45f468:	03 c0                	add    eax,eax
  45f46a:	03 05 4c df 59 00    	add    eax,DWORD PTR ds:0x59df4c
  45f470:	8b f0                	mov    esi,eax
  45f472:	3b 35 4c df 59 00    	cmp    esi,DWORD PTR ds:0x59df4c
  45f478:	0f 87 ed fd ff ff    	ja     0x45f26b
  45f47e:	33 c0                	xor    eax,eax
  45f480:	5d                   	pop    ebp
  45f481:	5f                   	pop    edi
  45f482:	a3 74 a0 5d 00       	mov    ds:0x5da074,eax
  45f487:	5e                   	pop    esi
  45f488:	a2 64 d1 89 00       	mov    ds:0x89d164,al
  45f48d:	5b                   	pop    ebx
  45f48e:	83 c4 18             	add    esp,0x18
  45f491:	c3                   	ret
  45f492:	cc                   	int3
  45f493:	cc                   	int3
  45f494:	cc                   	int3


  45f556:	3b 3d 18 df 59 00    	cmp    edi,DWORD PTR ds:0x59df18
  45f55c:	0f 86 b9 01 00 00    	jbe    0x45f71b
  45f562:	66 83 e2 0f          	and    dx,0xf
  45f566:	66 0f b6 44 24 13    	movzx  ax,BYTE PTR [esp+0x13]
  45f56c:	66 0b d0             	or     dx,ax
  45f56f:	33 c0                	xor    eax,eax
  45f571:	0f b7 ca             	movzx  ecx,dx
  45f574:	a0 64 d1 89 00       	mov    al,ds:0x89d164
  45f579:	89 0d 74 a0 5d 00    	mov    DWORD PTR ds:0x5da074,ecx
  45f57f:	66 8b 5e 04          	mov    bx,WORD PTR [esi+0x4]
  45f583:	83 f8 01             	cmp    eax,0x1
  45f586:	66 8b 4e 02          	mov    cx,WORD PTR [esi+0x2]
  45f58a:	74 0e                	je     0x45f59a
  45f58c:	83 f8 02             	cmp    eax,0x2
  45f58f:	0f 84 85 00 00 00    	je     0x45f61a
  45f595:	e9 62 01 00 00       	jmp    0x45f6fc
  45f59a:	0f bf c1             	movsx  eax,cx


  45f7bf:	03 3d 18 df 59 00    	add    edi,DWORD PTR ds:0x59df18
  45f7c5:	3b 3d 18 df 59 00    	cmp    edi,DWORD PTR ds:0x59df18
  45f7cb:	0f 86 bd 01 00 00    	jbe    0x45f98e
  45f7d1:	80 e1 0f             	and    cl,0xf
  45f7d4:	33 c0                	xor    eax,eax
  45f7d6:	0a 4c 24 13          	or     cl,BYTE PTR [esp+0x13]
  45f7da:	80 f1 01             	xor    cl,0x1
  45f7dd:	8a c1                	mov    al,cl
  45f7df:	a3 74 a0 5d 00       	mov    ds:0x5da074,eax
  45f7e4:	33 c0                	xor    eax,eax
  45f7e6:	66 8b 5e 04          	mov    bx,WORD PTR [esi+0x4]
  45f7ea:	a0 64 d1 89 00       	mov    al,ds:0x89d164
  45f7ef:	66 8b 4e 02          	mov    cx,WORD PTR [esi+0x2]
  45f7f3:	66 03 4f 04          	add    cx,WORD PTR [edi+0x4]
  45f7f7:	66 f7 d9             	neg    cx
  45f7fa:	83 f8 01             	cmp    eax,0x1
  45f7fd:	74 0e                	je     0x45f80d


  45f997:	03 c0                	add    eax,eax
  45f999:	03 05 4c df 59 00    	add    eax,DWORD PTR ds:0x59df4c
  45f99f:	8b f0                	mov    esi,eax
  45f9a1:	3b 35 4c df 59 00    	cmp    esi,DWORD PTR ds:0x59df4c
  45f9a7:	0f 87 bd fd ff ff    	ja     0x45f76a
  45f9ad:	33 c0                	xor    eax,eax
  45f9af:	5d                   	pop    ebp
  45f9b0:	5f                   	pop    edi
  45f9b1:	a3 74 a0 5d 00       	mov    ds:0x5da074,eax
  45f9b6:	5e                   	pop    esi
  45f9b7:	a2 64 d1 89 00       	mov    ds:0x89d164,al
  45f9bc:	5b                   	pop    ebx
  45f9bd:	83 c4 18             	add    esp,0x18
  45f9c0:	c3                   	ret
  45f9c1:	cc                   	int3
  45f9c2:	cc                   	int3
  45f9c3:	cc                   	int3


  45faa2:	39 3d 18 df 59 00    	cmp    DWORD PTR ds:0x59df18,edi
  45faa8:	0f 83 b9 01 00 00    	jae    0x45fc67
  45faae:	66 83 e2 0f          	and    dx,0xf
  45fab2:	66 0f b6 44 24 13    	movzx  ax,BYTE PTR [esp+0x13]
  45fab8:	66 0b d0             	or     dx,ax
  45fabb:	33 c0                	xor    eax,eax
  45fabd:	0f b7 ca             	movzx  ecx,dx
  45fac0:	a0 64 d1 89 00       	mov    al,ds:0x89d164
  45fac5:	89 0d 74 a0 5d 00    	mov    DWORD PTR ds:0x5da074,ecx
  45facb:	66 8b 5e 04          	mov    bx,WORD PTR [esi+0x4]
  45facf:	83 f8 01             	cmp    eax,0x1
  45fad2:	66 8b 4e 02          	mov    cx,WORD PTR [esi+0x2]
  45fad6:	74 0e                	je     0x45fae6
  45fad8:	83 f8 02             	cmp    eax,0x2
  45fadb:	0f 84 85 00 00 00    	je     0x45fb66
  45fae1:	e9 62 01 00 00       	jmp    0x45fc48
  45fae6:	0f bf c1             	movsx  eax,cx


  45fd2b:	03 3d 18 df 59 00    	add    edi,DWORD PTR ds:0x59df18
  45fd31:	39 3d 18 df 59 00    	cmp    DWORD PTR ds:0x59df18,edi
  45fd37:	0f 83 bd 01 00 00    	jae    0x45fefa
  45fd3d:	80 e1 0f             	and    cl,0xf
  45fd40:	33 c0                	xor    eax,eax
  45fd42:	0a 4c 24 13          	or     cl,BYTE PTR [esp+0x13]
  45fd46:	80 f1 01             	xor    cl,0x1
  45fd49:	8a c1                	mov    al,cl
  45fd4b:	a3 74 a0 5d 00       	mov    ds:0x5da074,eax
  45fd50:	33 c0                	xor    eax,eax
  45fd52:	66 8b 5e 04          	mov    bx,WORD PTR [esi+0x4]
  45fd56:	a0 64 d1 89 00       	mov    al,ds:0x89d164
  45fd5b:	66 8b 4e 02          	mov    cx,WORD PTR [esi+0x2]
  45fd5f:	66 03 4f 04          	add    cx,WORD PTR [edi+0x4]
  45fd63:	66 f7 d9             	neg    cx
  45fd66:	83 f8 01             	cmp    eax,0x1
  45fd69:	74 0e                	je     0x45fd79


  45ff03:	03 c0                	add    eax,eax
  45ff05:	03 05 4c df 59 00    	add    eax,DWORD PTR ds:0x59df4c
  45ff0b:	8b f0                	mov    esi,eax
  45ff0d:	39 35 4c df 59 00    	cmp    DWORD PTR ds:0x59df4c,esi
  45ff13:	0f 82 a1 fd ff ff    	jb     0x45fcba
  45ff19:	33 c0                	xor    eax,eax
  45ff1b:	5d                   	pop    ebp
  45ff1c:	5f                   	pop    edi
  45ff1d:	a3 74 a0 5d 00       	mov    ds:0x5da074,eax
  45ff22:	5e                   	pop    esi
  45ff23:	a2 64 d1 89 00       	mov    ds:0x89d164,al
  45ff28:	5b                   	pop    ebx
  45ff29:	83 c4 18             	add    esp,0x18
  45ff2c:	c3                   	ret
  45ff2d:	cc                   	int3
  45ff2e:	cc                   	int3
  45ff2f:	cc                   	int3


  46b15b:	83 c4 20             	add    esp,0x20
  46b15e:	66 8b 13             	mov    dx,WORD PTR [ebx]
  46b161:	6a 64                	push   0x64
  46b163:	68 80 00 00 00       	push   0x80
  46b168:	51                   	push   ecx
  46b169:	52                   	push   edx
  46b16a:	e8 e1 a1 00 00       	call   0x475350
  46b16f:	83 c4 10             	add    esp,0x10
  46b172:	89 35 74 a0 5d 00    	mov    DWORD PTR ds:0x5da074,esi
  46b178:	89 3d 7c a0 5d 00    	mov    DWORD PTR ds:0x5da07c,edi
  46b17e:	e9 09 10 00 00       	jmp    0x46c18c
  46b183:	0f bf 0d a0 ca 87 00 	movsx  ecx,WORD PTR ds:0x87caa0
  46b18a:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  46b18e:	0f bf 1d a2 ca 87 00 	movsx  ebx,WORD PTR ds:0x87caa2
  46b195:	0f bf 42 0a          	movsx  eax,WORD PTR [edx+0xa]
  46b199:	83 c2 0a             	add    edx,0xa
  46b19c:	3b c1                	cmp    eax,ecx


  49fba6:	c7 44 24 18 05 00 00 	mov    DWORD PTR [esp+0x18],0x5
  49fbad:	00 
  49fbae:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  49fbb2:	2b c1                	sub    eax,ecx
  49fbb4:	99                   	cdq
  49fbb5:	2b c2                	sub    eax,edx
  49fbb7:	c1 f8 01             	sar    eax,0x1
  49fbba:	03 c5                	add    eax,ebp
  49fbbc:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  49fbc3:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  49fbc7:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  49fbcb:	2b 44 24 24          	sub    eax,DWORD PTR [esp+0x24]
  49fbcf:	8b 54 24 34          	mov    edx,DWORD PTR [esp+0x34]
  49fbd3:	2b 44 24 18          	sub    eax,DWORD PTR [esp+0x18]
  49fbd7:	89 54 24 24          	mov    DWORD PTR [esp+0x24],edx
  49fbdb:	03 c3                	add    eax,ebx
  49fbdd:	03 d1                	add    edx,ecx


  5055f2:	00 
  5055f3:	8b f0                	mov    esi,eax
  5055f5:	89 44 24 6c          	mov    DWORD PTR [esp+0x6c],eax
  5055f9:	89 8c 24 98 00 00 00 	mov    DWORD PTR [esp+0x98],ecx
  505600:	89 4c 24 1c          	mov    DWORD PTR [esp+0x1c],ecx
  505604:	83 bc 24 b4 00 00 00 	cmp    DWORD PTR [esp+0xb4],0x0
  50560b:	00 
  50560c:	0f 84 c7 02 00 00    	je     0x5058d9
  505612:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  505619:	8b 4c 24 6c          	mov    ecx,DWORD PTR [esp+0x6c]
  50561d:	41                   	inc    ecx
  50561e:	89 4c 24 1c          	mov    DWORD PTR [esp+0x1c],ecx
  505622:	8b 84 24 98 00 00 00 	mov    eax,DWORD PTR [esp+0x98]
  505629:	40                   	inc    eax
  50562a:	89 4c 24 4c          	mov    DWORD PTR [esp+0x4c],ecx
  50562e:	8b 5c 24 6c          	mov    ebx,DWORD PTR [esp+0x6c]
  505632:	89 84 24 c0 00 00 00 	mov    DWORD PTR [esp+0xc0],eax


  5058c6:	7c 09                	jl     0x5058d1
  5058c8:	66 c7 05 2c db 98 00 	mov    WORD PTR ds:0x98db2c,0x35f
  5058cf:	5f 03 
  5058d1:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  5058d5:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  5058d9:	83 bc 24 88 00 00 00 	cmp    DWORD PTR [esp+0x88],0x0
  5058e0:	00 
  5058e1:	0f 84 a0 01 00 00    	je     0x505a87
  5058e7:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  5058ee:	8b 5c 24 6c          	mov    ebx,DWORD PTR [esp+0x6c]
  5058f2:	43                   	inc    ebx
  5058f3:	89 5c 24 4c          	mov    DWORD PTR [esp+0x4c],ebx
  5058f7:	8b 4c 24 6c          	mov    ecx,DWORD PTR [esp+0x6c]
  5058fb:	83 c1 05             	add    ecx,0x5
  5058fe:	89 4c 24 34          	mov    DWORD PTR [esp+0x34],ecx
  505902:	89 4c 24 54          	mov    DWORD PTR [esp+0x54],ecx
  505906:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]


  505a7a:	3b f8                	cmp    edi,eax
  505a7c:	7c 09                	jl     0x505a87
  505a7e:	66 c7 05 2c db 98 00 	mov    WORD PTR ds:0x98db2c,0x35e
  505a85:	5e 03 
  505a87:	83 7c 24 70 00       	cmp    DWORD PTR [esp+0x70],0x0
  505a8c:	0f 84 9e 01 00 00    	je     0x505c30
  505a92:	8d 5e 01             	lea    ebx,[esi+0x1]
  505a95:	8d 46 05             	lea    eax,[esi+0x5]
  505a98:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  505a9f:	89 5c 24 4c          	mov    DWORD PTR [esp+0x4c],ebx
  505aa3:	89 44 24 54          	mov    DWORD PTR [esp+0x54],eax
  505aa7:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  505aab:	40                   	inc    eax
  505aac:	89 44 24 30          	mov    DWORD PTR [esp+0x30],eax
  505ab0:	89 44 24 50          	mov    DWORD PTR [esp+0x50],eax
  505ab4:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  505ab8:	03 44 24 74          	add    eax,DWORD PTR [esp+0x74]


  505c22:	7c 09                	jl     0x505c2d
  505c24:	66 c7 05 2c db 98 00 	mov    WORD PTR ds:0x98db2c,0x361
  505c2b:	61 03 
  505c2d:	83 c6 06             	add    esi,0x6
  505c30:	83 7c 24 64 00       	cmp    DWORD PTR [esp+0x64],0x0
  505c35:	0f 84 8a 01 00 00    	je     0x505dc5
  505c3b:	8d 5e 01             	lea    ebx,[esi+0x1]
  505c3e:	8d 46 05             	lea    eax,[esi+0x5]
  505c41:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  505c48:	89 5c 24 4c          	mov    DWORD PTR [esp+0x4c],ebx
  505c4c:	89 44 24 54          	mov    DWORD PTR [esp+0x54],eax
  505c50:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  505c54:	40                   	inc    eax
  505c55:	89 44 24 30          	mov    DWORD PTR [esp+0x30],eax
  505c59:	83 ec 08             	sub    esp,0x8
  505c5c:	89 44 24 58          	mov    DWORD PTR [esp+0x58],eax
  505c60:	89 64 24 28          	mov    DWORD PTR [esp+0x28],esp


  505db7:	7c 09                	jl     0x505dc2
  505db9:	66 c7 05 2c db 98 00 	mov    WORD PTR ds:0x98db2c,0x355
  505dc0:	55 03 
  505dc2:	83 c6 06             	add    esi,0x6
  505dc5:	83 7c 24 60 00       	cmp    DWORD PTR [esp+0x60],0x0
  505dca:	0f 84 8c 01 00 00    	je     0x505f5c
  505dd0:	8d 5e 01             	lea    ebx,[esi+0x1]
  505dd3:	8d 46 05             	lea    eax,[esi+0x5]
  505dd6:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  505ddd:	89 5c 24 4c          	mov    DWORD PTR [esp+0x4c],ebx
  505de1:	89 44 24 54          	mov    DWORD PTR [esp+0x54],eax
  505de5:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  505de9:	40                   	inc    eax
  505dea:	89 44 24 30          	mov    DWORD PTR [esp+0x30],eax
  505dee:	83 ec 08             	sub    esp,0x8
  505df1:	89 44 24 58          	mov    DWORD PTR [esp+0x58],eax
  505df5:	89 64 24 28          	mov    DWORD PTR [esp+0x28],esp


  505f5c:	83 bc 24 ac 00 00 00 	cmp    DWORD PTR [esp+0xac],0x0
  505f63:	00 
  505f64:	89 74 24 38          	mov    DWORD PTR [esp+0x38],esi
  505f68:	0f 84 5a 03 00 00    	je     0x5062c8
  505f6e:	8b 84 24 d0 00 00 00 	mov    eax,DWORD PTR [esp+0xd0]
  505f75:	8d 4e 01             	lea    ecx,[esi+0x1]
  505f78:	83 c0 05             	add    eax,0x5
  505f7b:	89 84 24 a0 00 00 00 	mov    DWORD PTR [esp+0xa0],eax
  505f82:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  505f89:	89 4c 24 4c          	mov    DWORD PTR [esp+0x4c],ecx
  505f8d:	8b 84 24 cc 00 00 00 	mov    eax,DWORD PTR [esp+0xcc]
  505f94:	03 c6                	add    eax,esi
  505f96:	89 44 24 30          	mov    DWORD PTR [esp+0x30],eax
  505f9a:	8d 58 ff             	lea    ebx,[eax-0x1]
  505f9d:	89 5c 24 54          	mov    DWORD PTR [esp+0x54],ebx
  505fa1:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  505fa5:	40                   	inc    eax


  506316:	89 44 24 70          	mov    DWORD PTR [esp+0x70],eax
  50631a:	83 bc 24 80 00 00 00 	cmp    DWORD PTR [esp+0x80],0x0
  506321:	00 
  506322:	74 11                	je     0x506335
  506324:	83 7c 24 24 08       	cmp    DWORD PTR [esp+0x24],0x8
  506329:	7c 0a                	jl     0x506335
  50632b:	2b b4 24 d4 00 00 00 	sub    esi,DWORD PTR [esp+0xd4]
  506332:	83 ee 04             	sub    esi,0x4
  506335:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  50633c:	8b 94 24 a8 00 00 00 	mov    edx,DWORD PTR [esp+0xa8]
  506343:	8b 44 24 38          	mov    eax,DWORD PTR [esp+0x38]
  506347:	40                   	inc    eax
  506348:	8b 4c 24 38          	mov    ecx,DWORD PTR [esp+0x38]
  50634c:	03 ce                	add    ecx,esi
  50634e:	8b 5c 24 1c          	mov    ebx,DWORD PTR [esp+0x1c]
  506352:	43                   	inc    ebx
  506353:	89 44 24 4c          	mov    DWORD PTR [esp+0x4c],eax


  506a67:	8b 94 24 d4 00 00 00 	mov    edx,DWORD PTR [esp+0xd4]
  506a6e:	8b 8c 24 a8 00 00 00 	mov    ecx,DWORD PTR [esp+0xa8]
  506a75:	8d 5e 01             	lea    ebx,[esi+0x1]
  506a78:	89 74 24 34          	mov    DWORD PTR [esp+0x34],esi
  506a7c:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  506a80:	8d 7c 16 04          	lea    edi,[esi+edx*1+0x4]
  506a84:	89 44 24 70          	mov    DWORD PTR [esp+0x70],eax
  506a88:	8d 47 ff             	lea    eax,[edi-0x1]
  506a8b:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  506a92:	89 5c 24 4c          	mov    DWORD PTR [esp+0x4c],ebx
  506a96:	89 44 24 54          	mov    DWORD PTR [esp+0x54],eax
  506a9a:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  506a9e:	40                   	inc    eax
  506a9f:	83 ec 08             	sub    esp,0x8
  506aa2:	89 44 24 58          	mov    DWORD PTR [esp+0x58],eax
  506aa6:	89 64 24 28          	mov    DWORD PTR [esp+0x28],esp
  506aaa:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]


  506c6c:	80 7c 24 17 00       	cmp    BYTE PTR [esp+0x17],0x0
  506c71:	0f 84 a1 01 00 00    	je     0x506e18
  506c77:	8b 8c 24 a8 00 00 00 	mov    ecx,DWORD PTR [esp+0xa8]
  506c7e:	8d 5e 01             	lea    ebx,[esi+0x1]
  506c81:	89 74 24 34          	mov    DWORD PTR [esp+0x34],esi
  506c85:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  506c89:	89 44 24 70          	mov    DWORD PTR [esp+0x70],eax
  506c8d:	8b 94 24 bc 00 00 00 	mov    edx,DWORD PTR [esp+0xbc]
  506c94:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  506c9b:	89 5c 24 4c          	mov    DWORD PTR [esp+0x4c],ebx
  506c9f:	8d 44 16 03          	lea    eax,[esi+edx*1+0x3]
  506ca3:	8d 5c 16 04          	lea    ebx,[esi+edx*1+0x4]
  506ca7:	89 44 24 54          	mov    DWORD PTR [esp+0x54],eax
  506cab:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  506caf:	83 ec 08             	sub    esp,0x8
  506cb2:	40                   	inc    eax
  506cb3:	89 44 24 58          	mov    DWORD PTR [esp+0x58],eax


  506e37:	48                   	dec    eax
  506e38:	eb 05                	jmp    0x506e3f
  506e3a:	2b c2                	sub    eax,edx
  506e3c:	c1 f8 01             	sar    eax,0x1
  506e3f:	8b 94 24 a8 00 00 00 	mov    edx,DWORD PTR [esp+0xa8]
  506e46:	89 84 24 88 00 00 00 	mov    DWORD PTR [esp+0x88],eax
  506e4d:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  506e51:	89 44 24 70          	mov    DWORD PTR [esp+0x70],eax
  506e55:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  506e5c:	8b 44 24 38          	mov    eax,DWORD PTR [esp+0x38]
  506e60:	8b 4c 24 38          	mov    ecx,DWORD PTR [esp+0x38]
  506e64:	40                   	inc    eax
  506e65:	03 8c 24 b8 00 00 00 	add    ecx,DWORD PTR [esp+0xb8]
  506e6c:	89 44 24 4c          	mov    DWORD PTR [esp+0x4c],eax
  506e70:	8b 5c 24 1c          	mov    ebx,DWORD PTR [esp+0x1c]
  506e74:	8d 79 ff             	lea    edi,[ecx-0x1]
  506e77:	43                   	inc    ebx


  5074a3:	00 
  5074a4:	74 13                	je     0x5074b9
  5074a6:	83 7c 24 24 08       	cmp    DWORD PTR [esp+0x24],0x8
  5074ab:	7c 0c                	jl     0x5074b9
  5074ad:	8b 84 24 d4 00 00 00 	mov    eax,DWORD PTR [esp+0xd4]
  5074b4:	83 c0 04             	add    eax,0x4
  5074b7:	2b f0                	sub    esi,eax
  5074b9:	8b 94 24 e4 00 00 00 	mov    edx,DWORD PTR [esp+0xe4]
  5074c0:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  5074c7:	8b 44 24 38          	mov    eax,DWORD PTR [esp+0x38]
  5074cb:	8b 4c 24 38          	mov    ecx,DWORD PTR [esp+0x38]
  5074cf:	40                   	inc    eax
  5074d0:	03 ce                	add    ecx,esi
  5074d2:	89 44 24 4c          	mov    DWORD PTR [esp+0x4c],eax
  5074d6:	8d 71 ff             	lea    esi,[ecx-0x1]
  5074d9:	89 4c 24 34          	mov    DWORD PTR [esp+0x34],ecx
  5074dd:	89 74 24 54          	mov    DWORD PTR [esp+0x54],esi


  50770c:	75 15                	jne    0x507723
  50770e:	83 7c 24 24 00       	cmp    DWORD PTR [esp+0x24],0x0
  507713:	75 0e                	jne    0x507723
  507715:	83 bc 24 94 00 00 00 	cmp    DWORD PTR [esp+0x94],0x0
  50771c:	00 
  50771d:	0f 84 bd 00 00 00    	je     0x5077e0
  507723:	8b 84 24 84 00 00 00 	mov    eax,DWORD PTR [esp+0x84]
  50772a:	8b 4c 24 6c          	mov    ecx,DWORD PTR [esp+0x6c]
  50772e:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  507735:	2b 84 24 ec 00 00 00 	sub    eax,DWORD PTR [esp+0xec]
  50773c:	99                   	cdq
  50773d:	2b c2                	sub    eax,edx
  50773f:	8b 54 24 1c          	mov    edx,DWORD PTR [esp+0x1c]
  507743:	c1 f8 01             	sar    eax,0x1
  507746:	03 c8                	add    ecx,eax
  507748:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  50774d:	05 a0 01 00 00       	add    eax,0x1a0


  525471:	83 ef 1a             	sub    edi,0x1a
  525474:	8d 4e 05             	lea    ecx,[esi+0x5]
  525477:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  52547b:	8d 57 01             	lea    edx,[edi+0x1]
  52547e:	89 4c 24 1c          	mov    DWORD PTR [esp+0x1c],ecx
  525482:	8d 47 19             	lea    eax,[edi+0x19]
  525485:	89 54 24 18          	mov    DWORD PTR [esp+0x18],edx
  525489:	83 ec 08             	sub    esp,0x8
  52548c:	83 0d 74 a0 5d 00 10 	or     DWORD PTR ds:0x5da074,0x10
  525493:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  525497:	89 64 24 18          	mov    DWORD PTR [esp+0x18],esp
  52549b:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  52549f:	68 9a 00 00 00       	push   0x9a
  5254a4:	e8 c7 0a ef ff       	call   0x415f70
  5254a9:	8d 4c 24 1c          	lea    ecx,[esp+0x1c]
  5254ad:	51                   	push   ecx
  5254ae:	e8 dd 13 ff ff       	call   0x516890

