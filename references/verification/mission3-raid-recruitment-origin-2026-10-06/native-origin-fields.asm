
/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004f6020 <.text+0xf5020>:
  4f6020:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4f6024:	80 b8 b4 05 00 00 00 	cmp    BYTE PTR [eax+0x5b4],0x0
  4f602b:	75 08                	jne    0x4f6035
  4f602d:	66 8b 80 a2 05 00 00 	mov    ax,WORD PTR [eax+0x5a2]
  4f6034:	c3                   	ret
  4f6035:	66 8b 80 6a 03 00 00 	mov    ax,WORD PTR [eax+0x36a]
  4f603c:	c3                   	ret
  4f603d:	cc                   	int3
  4f603e:	cc                   	int3
  4f603f:	cc                   	int3

/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004f55d0 <.text+0xf45d0>:
  4f55d0:	83 ec 04             	sub    esp,0x4
  4f55d3:	56                   	push   esi
  4f55d4:	57                   	push   edi
  4f55d5:	8b 74 24 10          	mov    esi,DWORD PTR [esp+0x10]
  4f55d9:	56                   	push   esi
  4f55da:	e8 01 9b fe ff       	call   0x4df0e0
  4f55df:	83 c4 04             	add    esp,0x4
  4f55e2:	84 c0                	test   al,al
  4f55e4:	0f 84 8e 00 00 00    	je     0x4f5678
  4f55ea:	80 be af 00 00 00 00 	cmp    BYTE PTR [esi+0xaf],0x0
  4f55f1:	0f 85 81 00 00 00    	jne    0x4f5678
  4f55f7:	0f be 46 2f          	movsx  eax,BYTE PTR [esi+0x2f]
  4f55fb:	8b c8                	mov    ecx,eax
  4f55fd:	8d 14 80             	lea    edx,[eax+eax*4]
  4f5600:	8d 04 51             	lea    eax,[ecx+edx*2]
  4f5603:	8d 3c c0             	lea    edi,[eax+eax*8]
  4f5606:	8d 14 f9             	lea    edx,[ecx+edi*8]
  4f5609:	8d bc 91 c8 d1 89 00 	lea    edi,[ecx+edx*4+0x89d1c8]
  4f5610:	80 bf b4 05 00 00 00 	cmp    BYTE PTR [edi+0x5b4],0x0
  4f5617:	75 09                	jne    0x4f5622
  4f5619:	66 8b 87 a2 05 00 00 	mov    ax,WORD PTR [edi+0x5a2]
  4f5620:	eb 07                	jmp    0x4f5629
  4f5622:	66 8b 87 6a 03 00 00 	mov    ax,WORD PTR [edi+0x36a]
  4f5629:	66 89 44 24 0a       	mov    WORD PTR [esp+0xa],ax
  4f562e:	66 8b 46 3d          	mov    ax,WORD PTR [esi+0x3d]
  4f5632:	66 c1 e8 08          	shr    ax,0x8
  4f5636:	24 fe                	and    al,0xfe
  4f5638:	88 44 24 08          	mov    BYTE PTR [esp+0x8],al
  4f563c:	8b 54 24 0a          	mov    edx,DWORD PTR [esp+0xa]
  4f5640:	66 8b 46 3f          	mov    ax,WORD PTR [esi+0x3f]
  4f5644:	66 c1 e8 08          	shr    ax,0x8
  4f5648:	24 fe                	and    al,0xfe
  4f564a:	88 44 24 09          	mov    BYTE PTR [esp+0x9],al
  4f564e:	8b 4c 24 08          	mov    ecx,DWORD PTR [esp+0x8]
  4f5652:	51                   	push   ecx
  4f5653:	52                   	push   edx
  4f5654:	e8 c7 70 fa ff       	call   0x49c720
  4f5659:	83 c4 08             	add    esp,0x8
  4f565c:	33 c9                	xor    ecx,ecx
  4f565e:	8a 8f 6c 03 00 00    	mov    cl,BYTE PTR [edi+0x36c]
  4f5664:	0f af c9             	imul   ecx,ecx
  4f5667:	3b c8                	cmp    ecx,eax
  4f5669:	b8 01 00 00 00       	mov    eax,0x1
  4f566e:	7d 0a                	jge    0x4f567a
  4f5670:	5f                   	pop    edi
  4f5671:	33 c0                	xor    eax,eax
  4f5673:	5e                   	pop    esi
  4f5674:	83 c4 04             	add    esp,0x4
  4f5677:	c3                   	ret
  4f5678:	33 c0                	xor    eax,eax
  4f567a:	5f                   	pop    edi
  4f567b:	5e                   	pop    esi
  4f567c:	83 c4 04             	add    esp,0x4
  4f567f:	c3                   	ret

/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00492c30 <.text+0x91c30>:
  492c30:	83 ec 04             	sub    esp,0x4
  492c33:	53                   	push   ebx
  492c34:	56                   	push   esi
  492c35:	8b 74 24 14          	mov    esi,DWORD PTR [esp+0x14]
  492c39:	57                   	push   edi
  492c3a:	33 c9                	xor    ecx,ecx
  492c3c:	8b 86 04 31 00 00    	mov    eax,DWORD PTR [esi+0x3104]
  492c42:	83 c0 02             	add    eax,0x2
  492c45:	8b 7c 24 14          	mov    edi,DWORD PTR [esp+0x14]
  492c49:	89 86 04 31 00 00    	mov    DWORD PTR [esi+0x3104],eax
  492c4f:	66 8b 08             	mov    cx,WORD PTR [eax]
  492c52:	c1 e1 03             	shl    ecx,0x3
  492c55:	03 8e 00 31 00 00    	add    ecx,DWORD PTR [esi+0x3100]
  492c5b:	51                   	push   ecx
  492c5c:	56                   	push   esi
  492c5d:	57                   	push   edi
  492c5e:	e8 ed c6 ff ff       	call   0x48f350
  492c63:	83 c4 0c             	add    esp,0xc
  492c66:	8b d8                	mov    ebx,eax
  492c68:	8b 86 04 31 00 00    	mov    eax,DWORD PTR [esi+0x3104]
  492c6e:	33 c9                	xor    ecx,ecx
  492c70:	83 c0 02             	add    eax,0x2
  492c73:	89 86 04 31 00 00    	mov    DWORD PTR [esi+0x3104],eax
  492c79:	66 8b 08             	mov    cx,WORD PTR [eax]
  492c7c:	c1 e1 03             	shl    ecx,0x3
  492c7f:	03 8e 00 31 00 00    	add    ecx,DWORD PTR [esi+0x3100]
  492c85:	51                   	push   ecx
  492c86:	56                   	push   esi
  492c87:	57                   	push   edi
  492c88:	e8 c3 c6 ff ff       	call   0x48f350
  492c8d:	83 c4 0c             	add    esp,0xc
  492c90:	8b 96 04 31 00 00    	mov    edx,DWORD PTR [esi+0x3104]
  492c96:	83 c2 02             	add    edx,0x2
  492c99:	33 c9                	xor    ecx,ecx
  492c9b:	89 96 04 31 00 00    	mov    DWORD PTR [esi+0x3104],edx
  492ca1:	66 8b 0a             	mov    cx,WORD PTR [edx]
  492ca4:	81 f9 fe 03 00 00    	cmp    ecx,0x3fe
  492caa:	74 0a                	je     0x492cb6
  492cac:	81 f9 ff 03 00 00    	cmp    ecx,0x3ff
  492cb2:	74 0e                	je     0x492cc2
  492cb4:	eb 16                	jmp    0x492ccc
  492cb6:	81 8f 9a 05 00 00 00 	or     DWORD PTR [edi+0x59a],0x400
  492cbd:	04 00 00
  492cc0:	eb 0a                	jmp    0x492ccc
  492cc2:	81 a7 9a 05 00 00 ff 	and    DWORD PTR [edi+0x59a],0xfffffbff
  492cc9:	fb ff ff
  492ccc:	83 86 04 31 00 00 02 	add    DWORD PTR [esi+0x3104],0x2
  492cd3:	f6 87 9b 05 00 00 04 	test   BYTE PTR [edi+0x59b],0x4
  492cda:	74 25                	je     0x492d01
  492cdc:	88 5c 24 0e          	mov    BYTE PTR [esp+0xe],bl
  492ce0:	88 44 24 0f          	mov    BYTE PTR [esp+0xf],al
  492ce4:	66 8b 5c 24 0e       	mov    bx,WORD PTR [esp+0xe]
  492ce9:	81 8f 96 05 00 00 00 	or     DWORD PTR [edi+0x596],0x100
  492cf0:	01 00 00
  492cf3:	66 89 9f 6e 04 00 00 	mov    WORD PTR [edi+0x46e],bx
  492cfa:	5f                   	pop    edi
  492cfb:	5e                   	pop    esi
  492cfc:	5b                   	pop    ebx
  492cfd:	83 c4 04             	add    esp,0x4
  492d00:	c3                   	ret
  492d01:	81 a7 96 05 00 00 ff 	and    DWORD PTR [edi+0x596],0xfffffeff
  492d08:	fe ff ff
  492d0b:	5f                   	pop    edi
  492d0c:	5e                   	pop    esi
  492d0d:	5b                   	pop    ebx
  492d0e:	83 c4 04             	add    esp,0x4
  492d11:	c3                   	ret
