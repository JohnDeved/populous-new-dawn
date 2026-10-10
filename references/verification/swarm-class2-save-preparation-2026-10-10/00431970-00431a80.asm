
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00431970 <.text+0x30970>:
  431970:	56                   	push   esi
  431971:	ba 92 3b 68 00       	mov    edx,0x683b92
  431976:	b9 bf a1 96 00       	mov    ecx,0x96a1bf
  43197b:	be 20 00 00 00       	mov    esi,0x20
  431980:	80 7a 20 00          	cmp    BYTE PTR [edx+0x20],0x0
  431984:	74 4c                	je     0x4319d2
  431986:	8b 42 21             	mov    eax,DWORD PTR [edx+0x21]
  431989:	89 01                	mov    DWORD PTR [ecx],eax
  43198b:	8b 02                	mov    eax,DWORD PTR [edx]
  43198d:	89 41 04             	mov    DWORD PTR [ecx+0x4],eax
  431990:	66 8b 42 10          	mov    ax,WORD PTR [edx+0x10]
  431994:	66 89 41 08          	mov    WORD PTR [ecx+0x8],ax
  431998:	66 8b 42 12          	mov    ax,WORD PTR [edx+0x12]
  43199c:	66 89 41 0a          	mov    WORD PTR [ecx+0xa],ax
  4319a0:	66 8b 42 14          	mov    ax,WORD PTR [edx+0x14]
  4319a4:	66 89 41 0c          	mov    WORD PTR [ecx+0xc],ax
  4319a8:	66 8b 42 16          	mov    ax,WORD PTR [edx+0x16]
  4319ac:	66 89 41 0e          	mov    WORD PTR [ecx+0xe],ax
  4319b0:	66 8b 42 18          	mov    ax,WORD PTR [edx+0x18]
  4319b4:	66 89 41 10          	mov    WORD PTR [ecx+0x10],ax
  4319b8:	66 8b 42 1a          	mov    ax,WORD PTR [edx+0x1a]
  4319bc:	66 89 41 12          	mov    WORD PTR [ecx+0x12],ax
  4319c0:	8a 42 1e             	mov    al,BYTE PTR [edx+0x1e]
  4319c3:	88 41 14             	mov    BYTE PTR [ecx+0x14],al
  4319c6:	8a 42 1f             	mov    al,BYTE PTR [edx+0x1f]
  4319c9:	88 41 15             	mov    BYTE PTR [ecx+0x15],al
  4319cc:	8a 42 20             	mov    al,BYTE PTR [edx+0x20]
  4319cf:	88 41 16             	mov    BYTE PTR [ecx+0x16],al
  4319d2:	83 c2 2d             	add    edx,0x2d
  4319d5:	83 c1 18             	add    ecx,0x18
  4319d8:	4e                   	dec    esi
  4319d9:	75 a5                	jne    0x431980
  4319db:	5e                   	pop    esi
  4319dc:	c3                   	ret
  4319dd:	cc                   	int3
  4319de:	cc                   	int3
  4319df:	cc                   	int3
  4319e0:	56                   	push   esi
  4319e1:	33 c0                	xor    eax,eax
  4319e3:	57                   	push   edi
  4319e4:	b9 9e 01 00 00       	mov    ecx,0x19e
  4319e9:	bf 70 3b 68 00       	mov    edi,0x683b70
  4319ee:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4319f0:	66 ab                	stos   WORD PTR es:[edi],ax
  4319f2:	bf bf a1 96 00       	mov    edi,0x96a1bf
  4319f7:	b9 c0 00 00 00       	mov    ecx,0xc0
  4319fc:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4319fe:	bf bf a1 96 00       	mov    edi,0x96a1bf
  431a03:	be 20 00 00 00       	mov    esi,0x20
  431a08:	8a 47 16             	mov    al,BYTE PTR [edi+0x16]
  431a0b:	84 c0                	test   al,al
  431a0d:	74 66                	je     0x431a75
  431a0f:	50                   	push   eax
  431a10:	e8 bb f1 ff ff       	call   0x430bd0
  431a15:	0f be c0             	movsx  eax,al
  431a18:	83 c4 04             	add    esp,0x4
  431a1b:	8d 14 80             	lea    edx,[eax+eax*4]
  431a1e:	8b 07                	mov    eax,DWORD PTR [edi]
  431a20:	8d 8c d2 92 3b 68 00 	lea    ecx,[edx+edx*8+0x683b92]
  431a27:	89 84 d2 b3 3b 68 00 	mov    DWORD PTR [edx+edx*8+0x683bb3],eax
  431a2e:	8b 57 04             	mov    edx,DWORD PTR [edi+0x4]
  431a31:	89 11                	mov    DWORD PTR [ecx],edx
  431a33:	66 8b 47 08          	mov    ax,WORD PTR [edi+0x8]
  431a37:	66 89 41 10          	mov    WORD PTR [ecx+0x10],ax
  431a3b:	66 8b 57 0a          	mov    dx,WORD PTR [edi+0xa]
  431a3f:	66 89 51 12          	mov    WORD PTR [ecx+0x12],dx
  431a43:	66 8b 47 0c          	mov    ax,WORD PTR [edi+0xc]
  431a47:	66 89 41 14          	mov    WORD PTR [ecx+0x14],ax
  431a4b:	66 8b 57 0e          	mov    dx,WORD PTR [edi+0xe]
  431a4f:	66 89 51 16          	mov    WORD PTR [ecx+0x16],dx
  431a53:	66 8b 47 10          	mov    ax,WORD PTR [edi+0x10]
  431a57:	66 89 41 18          	mov    WORD PTR [ecx+0x18],ax
  431a5b:	66 8b 57 12          	mov    dx,WORD PTR [edi+0x12]
  431a5f:	66 89 51 1a          	mov    WORD PTR [ecx+0x1a],dx
  431a63:	8a 47 14             	mov    al,BYTE PTR [edi+0x14]
  431a66:	88 41 1e             	mov    BYTE PTR [ecx+0x1e],al
  431a69:	8a 57 15             	mov    dl,BYTE PTR [edi+0x15]
  431a6c:	88 51 1f             	mov    BYTE PTR [ecx+0x1f],dl
  431a6f:	8a 47 16             	mov    al,BYTE PTR [edi+0x16]
  431a72:	88 41 20             	mov    BYTE PTR [ecx+0x20],al
  431a75:	83 c7 18             	add    edi,0x18
  431a78:	4e                   	dec    esi
  431a79:	75 8d                	jne    0x431a08
  431a7b:	5f                   	pop    edi
  431a7c:	5e                   	pop    esi
  431a7d:	c3                   	ret
  431a7e:	cc                   	int3
  431a7f:	cc                   	int3
