
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044ca80 <.text+0x4ba80>:
  44ca80:	66 b9 01 00          	mov    cx,0x1
  44ca84:	53                   	push   ebx
  44ca85:	56                   	push   esi
  44ca86:	33 c0                	xor    eax,eax
  44ca88:	57                   	push   edi
  44ca89:	55                   	push   ebp
  44ca8a:	0f bf d1             	movsx  edx,cx
  44ca8d:	8b f2                	mov    esi,edx
  44ca8f:	c1 e2 03             	shl    edx,0x3
  44ca92:	2b d6                	sub    edx,esi
  44ca94:	03 d2                	add    edx,edx
  44ca96:	39 84 d6 30 45 68 00 	cmp    DWORD PTR [esi+edx*8+0x684530],eax
  44ca9d:	74 0c                	je     0x44caab
  44ca9f:	66 41                	inc    cx
  44caa1:	66 81 f9 00 01       	cmp    cx,0x100
  44caa6:	7e e2                	jle    0x44ca8a
  44caa8:	66 33 c9             	xor    cx,cx
  44caab:	66 85 c9             	test   cx,cx
  44caae:	0f 84 82 01 00 00    	je     0x44cc36
  44cab4:	0f bf c1             	movsx  eax,cx
  44cab7:	8b d0                	mov    edx,eax
  44cab9:	8b 5c 24 18          	mov    ebx,DWORD PTR [esp+0x18]
  44cabd:	c1 e0 03             	shl    eax,0x3
  44cac0:	2b c2                	sub    eax,edx
  44cac2:	03 c0                	add    eax,eax
  44cac4:	66 89 8c c2 4c 45 68 	mov    WORD PTR [edx+eax*8+0x68454c],cx
  44cacb:	00 
  44cacc:	8d b4 c2 2c 45 68 00 	lea    esi,[edx+eax*8+0x68452c]
  44cad3:	8b 03                	mov    eax,DWORD PTR [ebx]
  44cad5:	89 06                	mov    DWORD PTR [esi],eax
  44cad7:	8b 53 04             	mov    edx,DWORD PTR [ebx+0x4]
  44cada:	89 56 22             	mov    DWORD PTR [esi+0x22],edx
  44cadd:	8b 6b 08             	mov    ebp,DWORD PTR [ebx+0x8]
  44cae0:	89 6e 26             	mov    DWORD PTR [esi+0x26],ebp
  44cae3:	8a 43 0c             	mov    al,BYTE PTR [ebx+0xc]
  44cae6:	88 46 2a             	mov    BYTE PTR [esi+0x2a],al
  44cae9:	8b 7c 24 14          	mov    edi,DWORD PTR [esp+0x14]
  44caed:	8b 53 0d             	mov    edx,DWORD PTR [ebx+0xd]
  44caf0:	89 56 2b             	mov    DWORD PTR [esi+0x2b],edx
  44caf3:	8b 6b 11             	mov    ebp,DWORD PTR [ebx+0x11]
  44caf6:	89 6e 2f             	mov    DWORD PTR [esi+0x2f],ebp
  44caf9:	bd 80 02 00 00       	mov    ebp,0x280
  44cafe:	8b 43 15             	mov    eax,DWORD PTR [ebx+0x15]
  44cb01:	89 46 33             	mov    DWORD PTR [esi+0x33],eax
  44cb04:	0f bf 43 19          	movsx  eax,WORD PTR [ebx+0x19]
  44cb08:	c1 e0 10             	shl    eax,0x10
  44cb0b:	99                   	cdq
  44cb0c:	f7 fd                	idiv   ebp
  44cb0e:	8b 57 0e             	mov    edx,DWORD PTR [edi+0xe]
  44cb11:	bd e0 01 00 00       	mov    ebp,0x1e0
  44cb16:	03 d0                	add    edx,eax
  44cb18:	89 56 37             	mov    DWORD PTR [esi+0x37],edx
  44cb1b:	0f bf 43 1b          	movsx  eax,WORD PTR [ebx+0x1b]
  44cb1f:	c1 e0 10             	shl    eax,0x10
  44cb22:	99                   	cdq
  44cb23:	f7 fd                	idiv   ebp
  44cb25:	8b 57 12             	mov    edx,DWORD PTR [edi+0x12]
  44cb28:	bd 80 02 00 00       	mov    ebp,0x280
  44cb2d:	03 d0                	add    edx,eax
  44cb2f:	89 56 3b             	mov    DWORD PTR [esi+0x3b],edx
  44cb32:	0f bf 43 1d          	movsx  eax,WORD PTR [ebx+0x1d]
  44cb36:	c1 e0 10             	shl    eax,0x10
  44cb39:	99                   	cdq
  44cb3a:	f7 fd                	idiv   ebp
  44cb3c:	8b 57 0e             	mov    edx,DWORD PTR [edi+0xe]
  44cb3f:	bd e0 01 00 00       	mov    ebp,0x1e0
  44cb44:	03 d0                	add    edx,eax
  44cb46:	89 56 3f             	mov    DWORD PTR [esi+0x3f],edx
  44cb49:	0f bf 43 1f          	movsx  eax,WORD PTR [ebx+0x1f]
  44cb4d:	c1 e0 10             	shl    eax,0x10
  44cb50:	99                   	cdq
  44cb51:	f7 fd                	idiv   ebp
  44cb53:	8b 57 12             	mov    edx,DWORD PTR [edi+0x12]
  44cb56:	bd 80 02 00 00       	mov    ebp,0x280
  44cb5b:	03 d0                	add    edx,eax
  44cb5d:	89 56 43             	mov    DWORD PTR [esi+0x43],edx
  44cb60:	0f bf 43 21          	movsx  eax,WORD PTR [ebx+0x21]
  44cb64:	c1 e0 10             	shl    eax,0x10
  44cb67:	99                   	cdq
  44cb68:	f7 fd                	idiv   ebp
  44cb6a:	89 46 47             	mov    DWORD PTR [esi+0x47],eax
  44cb6d:	0f bf 43 23          	movsx  eax,WORD PTR [ebx+0x23]
  44cb71:	c1 e0 10             	shl    eax,0x10
  44cb74:	bd e0 01 00 00       	mov    ebp,0x1e0
  44cb79:	99                   	cdq
  44cb7a:	f7 fd                	idiv   ebp
  44cb7c:	89 46 4b             	mov    DWORD PTR [esi+0x4b],eax
  44cb7f:	8b 53 25             	mov    edx,DWORD PTR [ebx+0x25]
  44cb82:	89 56 4f             	mov    DWORD PTR [esi+0x4f],edx
  44cb85:	8b 43 29             	mov    eax,DWORD PTR [ebx+0x29]
  44cb88:	89 46 53             	mov    DWORD PTR [esi+0x53],eax
  44cb8b:	8b 6b 2f             	mov    ebp,DWORD PTR [ebx+0x2f]
  44cb8e:	89 6e 5b             	mov    DWORD PTR [esi+0x5b],ebp
  44cb91:	8b 53 33             	mov    edx,DWORD PTR [ebx+0x33]
  44cb94:	89 56 5f             	mov    DWORD PTR [esi+0x5f],edx
  44cb97:	8b 43 37             	mov    eax,DWORD PTR [ebx+0x37]
  44cb9a:	89 46 63             	mov    DWORD PTR [esi+0x63],eax
  44cb9d:	8b 6b 3b             	mov    ebp,DWORD PTR [ebx+0x3b]
  44cba0:	89 6e 67             	mov    DWORD PTR [esi+0x67],ebp
  44cba3:	66 8b 57 38          	mov    dx,WORD PTR [edi+0x38]
  44cba7:	66 89 56 6b          	mov    WORD PTR [esi+0x6b],dx
  44cbab:	8a 43 41             	mov    al,BYTE PTR [ebx+0x41]
  44cbae:	24 04                	and    al,0x4
  44cbb0:	3c 01                	cmp    al,0x1
  44cbb2:	1b c0                	sbb    eax,eax
  44cbb4:	f7 d8                	neg    eax
  44cbb6:	89 46 14             	mov    DWORD PTR [esi+0x14],eax
  44cbb9:	66 8b 53 3f          	mov    dx,WORD PTR [ebx+0x3f]
  44cbbd:	66 89 56 6f          	mov    WORD PTR [esi+0x6f],dx
  44cbc1:	66 8b 6b 2d          	mov    bp,WORD PTR [ebx+0x2d]
  44cbc5:	66 89 6e 57          	mov    WORD PTR [esi+0x57],bp
  44cbc9:	c6 46 59 00          	mov    BYTE PTR [esi+0x59],0x0
  44cbcd:	8a 43 41             	mov    al,BYTE PTR [ebx+0x41]
  44cbd0:	a8 10                	test   al,0x10
  44cbd2:	74 06                	je     0x44cbda
  44cbd4:	c6 46 59 01          	mov    BYTE PTR [esi+0x59],0x1
  44cbd8:	eb 12                	jmp    0x44cbec
  44cbda:	a8 20                	test   al,0x20
  44cbdc:	74 06                	je     0x44cbe4
  44cbde:	c6 46 59 02          	mov    BYTE PTR [esi+0x59],0x2
  44cbe2:	eb 08                	jmp    0x44cbec
  44cbe4:	a8 40                	test   al,0x40
  44cbe6:	74 04                	je     0x44cbec
  44cbe8:	c6 46 59 03          	mov    BYTE PTR [esi+0x59],0x3
  44cbec:	83 7e 22 05          	cmp    DWORD PTR [esi+0x22],0x5
  44cbf0:	75 0f                	jne    0x44cc01
  44cbf2:	80 7e 2a 00          	cmp    BYTE PTR [esi+0x2a],0x0
  44cbf6:	74 09                	je     0x44cc01
  44cbf8:	c7 46 18 01 00 00 00 	mov    DWORD PTR [esi+0x18],0x1
  44cbff:	eb 07                	jmp    0x44cc08
  44cc01:	c7 46 18 00 00 00 00 	mov    DWORD PTR [esi+0x18],0x0
  44cc08:	33 c0                	xor    eax,eax
  44cc0a:	ba 01 00 00 00       	mov    edx,0x1
  44cc0f:	89 46 1c             	mov    DWORD PTR [esi+0x1c],eax
  44cc12:	89 56 04             	mov    DWORD PTR [esi+0x4],edx
  44cc15:	89 56 08             	mov    DWORD PTR [esi+0x8],edx
  44cc18:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  44cc1b:	5d                   	pop    ebp
  44cc1c:	89 56 10             	mov    DWORD PTR [esi+0x10],edx
  44cc1f:	66 8b 5f 3c          	mov    bx,WORD PTR [edi+0x3c]
  44cc23:	66 89 5e 6d          	mov    WORD PTR [esi+0x6d],bx
  44cc27:	66 8b 46 20          	mov    ax,WORD PTR [esi+0x20]
  44cc2b:	66 89 47 3c          	mov    WORD PTR [edi+0x3c],ax
  44cc2f:	5f                   	pop    edi
  44cc30:	66 8b c1             	mov    ax,cx
  44cc33:	5e                   	pop    esi
  44cc34:	5b                   	pop    ebx
  44cc35:	c3                   	ret
  44cc36:	66 33 c0             	xor    ax,ax
  44cc39:	5d                   	pop    ebp
  44cc3a:	5f                   	pop    edi
  44cc3b:	5e                   	pop    esi
  44cc3c:	5b                   	pop    ebx
  44cc3d:	c3                   	ret
  44cc3e:	cc                   	int3
  44cc3f:	cc                   	int3
  44cc40:	53                   	push   ebx
  44cc41:	b8 01 00 00 00       	mov    eax,0x1
  44cc46:	56                   	push   esi
  44cc47:	39 05 08 45 68 00    	cmp    DWORD PTR ds:0x684508,eax
  44cc4d:	57                   	push   edi
  44cc4e:	55                   	push   ebp
  44cc4f:	7c 19                	jl     0x44cc6a
  44cc51:	ba 22 42 68 00       	mov    edx,0x684222
  44cc56:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  44cc5a:	39 0a                	cmp    DWORD PTR [edx],ecx
  44cc5c:	74 0f                	je     0x44cc6d
  44cc5e:	83 c2 06             	add    edx,0x6
  44cc61:	40                   	inc    eax
  44cc62:	3b 05 08 45 68 00    	cmp    eax,DWORD PTR ds:0x684508
  44cc68:	7e f0                	jle    0x44cc5a
  44cc6a:	66 33 c0             	xor    ax,ax
  44cc6d:	66 85 c0             	test   ax,ax
  44cc70:	0f 84 fa 01 00 00    	je     0x44ce70
  44cc76:	0f bf c0             	movsx  eax,ax
  44cc79:	8d 0c 40             	lea    ecx,[eax+eax*2]
  44cc7c:	0f bf 04 4d 20 42 68 	movsx  eax,WORD PTR [ecx*2+0x684220]
  44cc83:	00 
  44cc84:	8b c8                	mov    ecx,eax
  44cc86:	c1 e0 06             	shl    eax,0x6
  44cc89:	2b c1                	sub    eax,ecx
  44cc8b:	2b c1                	sub    eax,ecx
  44cc8d:	8d b0 5e 42 68 00    	lea    esi,[eax+0x68425e]
  44cc93:	83 7e 2e 00          	cmp    DWORD PTR [esi+0x2e],0x0
  44cc97:	0f 84 d3 01 00 00    	je     0x44ce70
  44cc9d:	c7 46 2e 00 00 00 00 	mov    DWORD PTR [esi+0x2e],0x0
  44cca4:	0f bf 46 3c          	movsx  eax,WORD PTR [esi+0x3c]
  44cca8:	8b c8                	mov    ecx,eax
  44ccaa:	c1 e0 03             	shl    eax,0x3
  44ccad:	2b c1                	sub    eax,ecx
  44ccaf:	03 c0                	add    eax,eax
  44ccb1:	8d 84 c1 2c 45 68 00 	lea    eax,[ecx+eax*8+0x68452c]
  44ccb8:	3d 2c 45 68 00       	cmp    eax,0x68452c
  44ccbd:	74 28                	je     0x44cce7
  44ccbf:	83 78 04 00          	cmp    DWORD PTR [eax+0x4],0x0
  44ccc3:	74 07                	je     0x44cccc
  44ccc5:	c7 40 04 00 00 00 00 	mov    DWORD PTR [eax+0x4],0x0
  44cccc:	0f bf 40 6d          	movsx  eax,WORD PTR [eax+0x6d]
  44ccd0:	8b c8                	mov    ecx,eax
  44ccd2:	c1 e0 03             	shl    eax,0x3
  44ccd5:	2b c1                	sub    eax,ecx
  44ccd7:	03 c0                	add    eax,eax
  44ccd9:	8d 84 c1 2c 45 68 00 	lea    eax,[ecx+eax*8+0x68452c]
  44cce0:	3d 2c 45 68 00       	cmp    eax,0x68452c
  44cce5:	75 d8                	jne    0x44ccbf
  44cce7:	8b 16                	mov    edx,DWORD PTR [esi]
  44cce9:	b9 01 00 00 00       	mov    ecx,0x1
  44ccee:	39 0d 08 45 68 00    	cmp    DWORD PTR ds:0x684508,ecx
  44ccf4:	7c 15                	jl     0x44cd0b
  44ccf6:	b8 22 42 68 00       	mov    eax,0x684222
  44ccfb:	39 10                	cmp    DWORD PTR [eax],edx
  44ccfd:	74 0f                	je     0x44cd0e
  44ccff:	83 c0 06             	add    eax,0x6
  44cd02:	41                   	inc    ecx
  44cd03:	39 0d 08 45 68 00    	cmp    DWORD PTR ds:0x684508,ecx
  44cd09:	7d f0                	jge    0x44ccfb
  44cd0b:	66 33 c9             	xor    cx,cx
  44cd0e:	66 85 c9             	test   cx,cx
  44cd11:	74 65                	je     0x44cd78
  44cd13:	0f bf c1             	movsx  eax,cx
  44cd16:	8b 15 08 45 68 00    	mov    edx,DWORD PTR ds:0x684508
  44cd1c:	4a                   	dec    edx
  44cd1d:	3b c2                	cmp    eax,edx
  44cd1f:	7d 30                	jge    0x44cd51
  44cd21:	0f bf c1             	movsx  eax,cx
  44cd24:	66 41                	inc    cx
  44cd26:	8d 04 40             	lea    eax,[eax+eax*2]
  44cd29:	03 c0                	add    eax,eax
  44cd2b:	8d 90 22 42 68 00    	lea    edx,[eax+0x684222]
  44cd31:	8d b8 1c 42 68 00    	lea    edi,[eax+0x68421c]
  44cd37:	8b 02                	mov    eax,DWORD PTR [edx]
  44cd39:	89 07                	mov    DWORD PTR [edi],eax
  44cd3b:	66 8b 52 04          	mov    dx,WORD PTR [edx+0x4]
  44cd3f:	0f bf c1             	movsx  eax,cx
  44cd42:	66 89 57 04          	mov    WORD PTR [edi+0x4],dx
  44cd46:	8b 15 08 45 68 00    	mov    edx,DWORD PTR ds:0x684508
  44cd4c:	4a                   	dec    edx
  44cd4d:	3b c2                	cmp    eax,edx
  44cd4f:	7c d0                	jl     0x44cd21
  44cd51:	33 c9                	xor    ecx,ecx
  44cd53:	ff 0d 08 45 68 00    	dec    DWORD PTR ds:0x684508
  44cd59:	a1 08 45 68 00       	mov    eax,ds:0x684508
  44cd5e:	8d                   	.byte 0x8d
  44cd5f:	14                   	.byte 0x14
