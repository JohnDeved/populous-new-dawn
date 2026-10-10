
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044fad0 <.text+0x4ead0>:
  44fad0:	83 ec 04             	sub    esp,0x4
  44fad3:	33 d2                	xor    edx,edx
  44fad5:	33 c0                	xor    eax,eax
  44fad7:	53                   	push   ebx
  44fad8:	66 8b 44 24 0c       	mov    ax,WORD PTR [esp+0xc]
  44fadd:	56                   	push   esi
  44fade:	57                   	push   edi
  44fadf:	25 fe 00 00 00       	and    eax,0xfe
  44fae4:	55                   	push   ebp
  44fae5:	03 c0                	add    eax,eax
  44fae7:	33 c9                	xor    ecx,ecx
  44fae9:	88 54 24 13          	mov    BYTE PTR [esp+0x13],dl
  44faed:	66 8b 4c 24 18       	mov    cx,WORD PTR [esp+0x18]
  44faf2:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  44faf8:	0b c1                	or     eax,ecx
  44fafa:	8d 34 85 e4 03 8a 00 	lea    esi,[eax*4+0x8a03e4]
  44fb01:	8b 06                	mov    eax,DWORD PTR [esi]
  44fb03:	0f bf 5e 06          	movsx  ebx,WORD PTR [esi+0x6]
  44fb07:	8b c8                	mov    ecx,eax
  44fb09:	8b 3c 9d 90 03 89 00 	mov    edi,DWORD PTR [ebx*4+0x890390]
  44fb10:	81 e1 00 00 08 00    	and    ecx,0x80000
  44fb16:	83 f9 01             	cmp    ecx,0x1
  44fb19:	1a c9                	sbb    cl,cl
  44fb1b:	fe c1                	inc    cl
  44fb1d:	85 ff                	test   edi,edi
  44fb1f:	88 4c 24 12          	mov    BYTE PTR [esp+0x12],cl
  44fb23:	74 63                	je     0x44fb88
  44fb25:	bd 00 00 08 00       	mov    ebp,0x80000
  44fb2a:	84 d2                	test   dl,dl
  44fb2c:	75 5e                	jne    0x44fb8c
  44fb2e:	33 c9                	xor    ecx,ecx
  44fb30:	8a 4f 2a             	mov    cl,BYTE PTR [edi+0x2a]
  44fb33:	83 f9 05             	cmp    ecx,0x5
  44fb36:	75 3f                	jne    0x44fb77
  44fb38:	33 db                	xor    ebx,ebx
  44fb3a:	8a 5f 2b             	mov    bl,BYTE PTR [edi+0x2b]
  44fb3d:	8d 1c 5b             	lea    ebx,[ebx+ebx*2]
  44fb40:	85 2c dd c4 79 5a 00 	test   DWORD PTR [ebx*8+0x5a79c4],ebp
  44fb47:	74 02                	je     0x44fb4b
  44fb49:	b2 01                	mov    dl,0x1
  44fb4b:	83 f9 05             	cmp    ecx,0x5
  44fb4e:	75 27                	jne    0x44fb77
  44fb50:	8a 5f 2b             	mov    bl,BYTE PTR [edi+0x2b]
  44fb53:	33 c9                	xor    ecx,ecx
  44fb55:	8a cb                	mov    cl,bl
  44fb57:	8d 0c 49             	lea    ecx,[ecx+ecx*2]
  44fb5a:	f6 04 cd c6 79 5a 00 	test   BYTE PTR [ecx*8+0x5a79c6],0x10
  44fb61:	10 
  44fb62:	74 13                	je     0x44fb77
  44fb64:	80 fb 0e             	cmp    bl,0xe
  44fb67:	75 09                	jne    0x44fb72
  44fb69:	80 bf 88 00 00 00 01 	cmp    BYTE PTR [edi+0x88],0x1
  44fb70:	74 05                	je     0x44fb77
  44fb72:	c6 44 24 13 01       	mov    BYTE PTR [esp+0x13],0x1
  44fb77:	33 c9                	xor    ecx,ecx
  44fb79:	66 8b 4f 20          	mov    cx,WORD PTR [edi+0x20]
  44fb7d:	8b 3c 8d 90 03 89 00 	mov    edi,DWORD PTR [ecx*4+0x890390]
  44fb84:	85 ff                	test   edi,edi
  44fb86:	75 a2                	jne    0x44fb2a
  44fb88:	84 d2                	test   dl,dl
  44fb8a:	74 05                	je     0x44fb91
  44fb8c:	83 c8 02             	or     eax,0x2
  44fb8f:	eb 03                	jmp    0x44fb94
  44fb91:	83 e0 fd             	and    eax,0xfffffffd
  44fb94:	80 7c 24 13 00       	cmp    BYTE PTR [esp+0x13],0x0
  44fb99:	89 06                	mov    DWORD PTR [esi],eax
  44fb9b:	74 08                	je     0x44fba5
  44fb9d:	81 0e 00 00 08 00    	or     DWORD PTR [esi],0x80000
  44fba3:	eb 06                	jmp    0x44fbab
  44fba5:	81 26 ff ff f7 ff    	and    DWORD PTR [esi],0xfff7ffff
  44fbab:	8a 44 24 13          	mov    al,BYTE PTR [esp+0x13]
  44fbaf:	3a 44 24 12          	cmp    al,BYTE PTR [esp+0x12]
  44fbb3:	74 0f                	je     0x44fbc4
  44fbb5:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  44fbb9:	6a 01                	push   0x1
  44fbbb:	50                   	push   eax
  44fbbc:	e8 9f 2e fd ff       	call   0x422a60
  44fbc1:	83 c4 08             	add    esp,0x8
  44fbc4:	5d                   	pop    ebp
  44fbc5:	5f                   	pop    edi
  44fbc6:	5e                   	pop    esi
  44fbc7:	5b                   	pop    ebx
  44fbc8:	83 c4 04             	add    esp,0x4
  44fbcb:	c3                   	ret
  44fbcc:	cc                   	int3
  44fbcd:	cc                   	int3
  44fbce:	cc                   	int3
  44fbcf:	cc                   	int3
