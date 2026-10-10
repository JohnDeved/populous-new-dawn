
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044bf50 <.text+0x4af50>:
  44bf50:	83 ec 08             	sub    esp,0x8
  44bf53:	53                   	push   ebx
  44bf54:	56                   	push   esi
  44bf55:	8b 74 24 14          	mov    esi,DWORD PTR [esp+0x14]
  44bf59:	57                   	push   edi
  44bf5a:	0f bf 46 6b          	movsx  eax,WORD PTR [esi+0x6b]
  44bf5e:	55                   	push   ebp
  44bf5f:	8b c8                	mov    ecx,eax
  44bf61:	c1 e0 06             	shl    eax,0x6
  44bf64:	32 db                	xor    bl,bl
  44bf66:	c7 44 24 10 01 00 00 	mov    DWORD PTR [esp+0x10],0x1
  44bf6d:	00 
  44bf6e:	2b c1                	sub    eax,ecx
  44bf70:	2b c1                	sub    eax,ecx
  44bf72:	8b 4e 22             	mov    ecx,DWORD PTR [esi+0x22]
  44bf75:	05 5e 42 68 00       	add    eax,0x68425e
  44bf7a:	83 f9 05             	cmp    ecx,0x5
  44bf7d:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  44bf81:	75 13                	jne    0x44bf96
  44bf83:	8b c6                	mov    eax,esi
  44bf85:	8b 7c 24 20          	mov    edi,DWORD PTR [esp+0x20]
  44bf89:	2b c7                	sub    eax,edi
  44bf8b:	83 f8 e4             	cmp    eax,0xffffffe4
  44bf8e:	0f 84 ba 04 00 00    	je     0x44c44e
  44bf94:	eb 04                	jmp    0x44bf9a
  44bf96:	8b 7c 24 20          	mov    edi,DWORD PTR [esp+0x20]
  44bf9a:	83 7e 08 00          	cmp    DWORD PTR [esi+0x8],0x0
  44bf9e:	0f 84 aa 04 00 00    	je     0x44c44e
  44bfa4:	49                   	dec    ecx
  44bfa5:	83 f9 07             	cmp    ecx,0x7
  44bfa8:	0f 87 e7 00 00 00    	ja     0x44c095
  44bfae:	33 c0                	xor    eax,eax
  44bfb0:	8a 81 6c c4 44 00    	mov    al,BYTE PTR [ecx+0x44c46c]
  44bfb6:	ff 24 85 58 c4 44 00 	jmp    DWORD PTR [eax*4+0x44c458]
  44bfbd:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  44bfc1:	85 c0                	test   eax,eax
  44bfc3:	74 06                	je     0x44bfcb
  44bfc5:	56                   	push   esi
  44bfc6:	ff d0                	call   eax
  44bfc8:	83 c4 04             	add    esp,0x4
  44bfcb:	b3 01                	mov    bl,0x1
  44bfcd:	c7 07 01 00 00 00    	mov    DWORD PTR [edi],0x1
  44bfd3:	e9 bd 00 00 00       	jmp    0x44c095
  44bfd8:	83 7e 5b 03          	cmp    DWORD PTR [esi+0x5b],0x3
  44bfdc:	75 31                	jne    0x44c00f
  44bfde:	e8 ad e1 04 00       	call   0x49a190
  44bfe3:	85 c0                	test   eax,eax
  44bfe5:	74 28                	je     0x44c00f
  44bfe7:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  44bfee:	8b c8                	mov    ecx,eax
  44bff0:	8d 14 80             	lea    edx,[eax+eax*4]
  44bff3:	8d 04 51             	lea    eax,[ecx+edx*2]
  44bff6:	8d 2c c0             	lea    ebp,[eax+eax*8]
  44bff9:	8d 14 e9             	lea    edx,[ecx+ebp*8]
  44bffc:	66 83 bc 91 f3 db 89 	cmp    WORD PTR [ecx+edx*4+0x89dbf3],0x0
  44c003:	00 00 
  44c005:	75 08                	jne    0x44c00f
  44c007:	c7 44 24 10 00 00 00 	mov    DWORD PTR [esp+0x10],0x0
  44c00e:	00 
  44c00f:	83 7c 24 10 00       	cmp    DWORD PTR [esp+0x10],0x0
  44c014:	0f 84 d5 03 00 00    	je     0x44c3ef
  44c01a:	80 7e 2a 01          	cmp    BYTE PTR [esi+0x2a],0x1
  44c01e:	74 6f                	je     0x44c08f
  44c020:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  44c024:	85 c0                	test   eax,eax
  44c026:	74 06                	je     0x44c02e
  44c028:	56                   	push   esi
  44c029:	ff d0                	call   eax
  44c02b:	83 c4 04             	add    esp,0x4
  44c02e:	0f bf 46 6b          	movsx  eax,WORD PTR [esi+0x6b]
  44c032:	8b c8                	mov    ecx,eax
  44c034:	c1 e0 06             	shl    eax,0x6
  44c037:	2b c1                	sub    eax,ecx
  44c039:	2b c1                	sub    eax,ecx
  44c03b:	0f bf 80 9a 42 68 00 	movsx  eax,WORD PTR [eax+0x68429a]
  44c042:	8b c8                	mov    ecx,eax
  44c044:	c1 e0 03             	shl    eax,0x3
  44c047:	2b c1                	sub    eax,ecx
  44c049:	03 c0                	add    eax,eax
  44c04b:	8d 84 c1 2c 45 68 00 	lea    eax,[ecx+eax*8+0x68452c]
  44c052:	3d 2c 45 68 00       	cmp    eax,0x68452c
  44c057:	74 30                	je     0x44c089
  44c059:	33 c9                	xor    ecx,ecx
  44c05b:	bb 05 00 00 00       	mov    ebx,0x5
  44c060:	38 48 2a             	cmp    BYTE PTR [eax+0x2a],cl
  44c063:	74 09                	je     0x44c06e
  44c065:	39 58 22             	cmp    DWORD PTR [eax+0x22],ebx
  44c068:	0f 84 2d 01 00 00    	je     0x44c19b
  44c06e:	0f bf 40 6d          	movsx  eax,WORD PTR [eax+0x6d]
  44c072:	8b d0                	mov    edx,eax
  44c074:	c1 e0 03             	shl    eax,0x3
  44c077:	2b c2                	sub    eax,edx
  44c079:	03 c0                	add    eax,eax
  44c07b:	8d 84 c2 2c 45 68 00 	lea    eax,[edx+eax*8+0x68452c]
  44c082:	3d 2c 45 68 00       	cmp    eax,0x68452c
  44c087:	75 d7                	jne    0x44c060
  44c089:	c6 46 2a 01          	mov    BYTE PTR [esi+0x2a],0x1
  44c08d:	b3 01                	mov    bl,0x1
  44c08f:	c7 07 01 00 00 00    	mov    DWORD PTR [edi],0x1
  44c095:	83 7c 24 10 00       	cmp    DWORD PTR [esp+0x10],0x0
  44c09a:	0f 84 4f 03 00 00    	je     0x44c3ef
  44c0a0:	8b c6                	mov    eax,esi
  44c0a2:	2b c7                	sub    eax,edi
  44c0a4:	83 f8 e8             	cmp    eax,0xffffffe8
  44c0a7:	0f 85 44 03 00 00    	jne    0x44c3f1
  44c0ad:	8b 4e 5b             	mov    ecx,DWORD PTR [esi+0x5b]
  44c0b0:	85 c9                	test   ecx,ecx
  44c0b2:	0f 84 1e 03 00 00    	je     0x44c3d6
  44c0b8:	83 7e 22 03          	cmp    DWORD PTR [esi+0x22],0x3
  44c0bc:	0f 85 41 02 00 00    	jne    0x44c303
  44c0c2:	80 7e 2a 00          	cmp    BYTE PTR [esi+0x2a],0x0
  44c0c6:	0f 85 37 02 00 00    	jne    0x44c303
  44c0cc:	b8 01 00 00 00       	mov    eax,0x1
  44c0d1:	39 05 08 45 68 00    	cmp    DWORD PTR ds:0x684508,eax
  44c0d7:	7c 15                	jl     0x44c0ee
  44c0d9:	ba 22 42 68 00       	mov    edx,0x684222
  44c0de:	39 0a                	cmp    DWORD PTR [edx],ecx
  44c0e0:	74 0f                	je     0x44c0f1
  44c0e2:	83 c2 06             	add    edx,0x6
  44c0e5:	40                   	inc    eax
  44c0e6:	39 05 08 45 68 00    	cmp    DWORD PTR ds:0x684508,eax
  44c0ec:	7d f0                	jge    0x44c0de
  44c0ee:	66 33 c0             	xor    ax,ax
  44c0f1:	66 85 c0             	test   ax,ax
  44c0f4:	0f 84 dc 02 00 00    	je     0x44c3d6
  44c0fa:	0f bf c0             	movsx  eax,ax
  44c0fd:	8d 0c 40             	lea    ecx,[eax+eax*2]
  44c100:	0f bf 04 4d 20 42 68 	movsx  eax,WORD PTR [ecx*2+0x684220]
  44c107:	00 
  44c108:	8b c8                	mov    ecx,eax
  44c10a:	c1 e0 06             	shl    eax,0x6
  44c10d:	2b c1                	sub    eax,ecx
  44c10f:	2b c1                	sub    eax,ecx
  44c111:	8d b8 5e 42 68 00    	lea    edi,[eax+0x68425e]
  44c117:	c7 47 2e 03 00 00 00 	mov    DWORD PTR [edi+0x2e],0x3
  44c11e:	ba 01 00 00 00       	mov    edx,0x1
  44c123:	39 15 08 45 68 00    	cmp    DWORD PTR ds:0x684508,edx
  44c129:	7c 3d                	jl     0x44c168
  44c12b:	b9 26 42 68 00       	mov    ecx,0x684226
  44c130:	0f bf 01             	movsx  eax,WORD PTR [ecx]
  44c133:	8b e8                	mov    ebp,eax
  44c135:	c1 e0 06             	shl    eax,0x6
  44c138:	2b c5                	sub    eax,ebp
  44c13a:	2b c5                	sub    eax,ebp
  44c13c:	8d a8 5e 42 68 00    	lea    ebp,[eax+0x68425e]
  44c142:	8b 80 8c 42 68 00    	mov    eax,DWORD PTR [eax+0x68428c]
  44c148:	83 f8 02             	cmp    eax,0x2
  44c14b:	74 05                	je     0x44c152
  44c14d:	83 f8 01             	cmp    eax,0x1
  44c150:	75 0a                	jne    0x44c15c
  44c152:	66 8b 47 38          	mov    ax,WORD PTR [edi+0x38]
  44c156:	66 39 45 36          	cmp    WORD PTR [ebp+0x36],ax
  44c15a:	74 0f                	je     0x44c16b
  44c15c:	83 c1 06             	add    ecx,0x6
  44c15f:	42                   	inc    edx
  44c160:	3b 15 08 45 68 00    	cmp    edx,DWORD PTR ds:0x684508
  44c166:	7e c8                	jle    0x44c130
  44c168:	66 33 d2             	xor    dx,dx
  44c16b:	66 85 d2             	test   dx,dx
  44c16e:	0f 84 62 02 00 00    	je     0x44c3d6
  44c174:	0f bf c2             	movsx  eax,dx
  44c177:	8d 0c 40             	lea    ecx,[eax+eax*2]
  44c17a:	0f                   	.byte 0xf
  44c17b:	bf 04 4d 20 42       	mov    edi,0x42204d04
