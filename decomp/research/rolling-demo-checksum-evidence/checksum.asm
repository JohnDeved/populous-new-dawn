
/workspace/shared/populous-prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004439d0 <.text+0x429d0>:
  4439d0:	83 ec 20             	sub    esp,0x20
  4439d3:	33 c0                	xor    eax,eax
  4439d5:	b9 08 00 00 00       	mov    ecx,0x8
  4439da:	53                   	push   ebx
  4439db:	56                   	push   esi
  4439dc:	57                   	push   edi
  4439dd:	8d 7c 24 0c          	lea    edi,[esp+0xc]
  4439e1:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4439e3:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  4439e8:	b9 c8 d1 89 00       	mov    ecx,0x89d1c8
  4439ed:	33 db                	xor    ebx,ebx
  4439ef:	01 44 24 0c          	add    DWORD PTR [esp+0xc],eax
  4439f3:	b8 04 00 00 00       	mov    eax,0x4
  4439f8:	38 99 20 0c 00 00    	cmp    BYTE PTR [ecx+0xc20],bl
  4439fe:	74 10                	je     0x443a10
  443a00:	8b 91 1d 09 00 00    	mov    edx,DWORD PTR [ecx+0x91d]
  443a06:	03 91 25 09 00 00    	add    edx,DWORD PTR [ecx+0x925]
  443a0c:	01 54 24 10          	add    DWORD PTR [esp+0x10],edx
  443a10:	81 c1 65 0c 00 00    	add    ecx,0xc65
  443a16:	48                   	dec    eax
  443a17:	75 df                	jne    0x4439f8
  443a19:	8b 15 20 03 89 00    	mov    edx,DWORD PTR ds:0x890320
  443a1f:	33 f6                	xor    esi,esi
  443a21:	3b d6                	cmp    edx,esi
  443a23:	74 59                	je     0x443a7e
  443a25:	33 c0                	xor    eax,eax
  443a27:	33 c9                	xor    ecx,ecx
  443a29:	66 8b 42 24          	mov    ax,WORD PTR [edx+0x24]
  443a2d:	0f af c6             	imul   eax,esi
  443a30:	46                   	inc    esi
  443a31:	01 44 24 14          	add    DWORD PTR [esp+0x14],eax
  443a35:	0f be 5a 2f          	movsx  ebx,BYTE PTR [edx+0x2f]
  443a39:	8a 4a 2a             	mov    cl,BYTE PTR [edx+0x2a]
  443a3c:	33 c0                	xor    eax,eax
  443a3e:	8a 42 2b             	mov    al,BYTE PTR [edx+0x2b]
  443a41:	03 c8                	add    ecx,eax
  443a43:	33 c0                	xor    eax,eax
  443a45:	8a 42 2c             	mov    al,BYTE PTR [edx+0x2c]
  443a48:	03 c8                	add    ecx,eax
  443a4a:	33 c0                	xor    eax,eax
  443a4c:	8a 42 2e             	mov    al,BYTE PTR [edx+0x2e]
  443a4f:	03 c8                	add    ecx,eax
  443a51:	03 cb                	add    ecx,ebx
  443a53:	0f bf 42 5d          	movsx  eax,WORD PTR [edx+0x5d]
  443a57:	03 c8                	add    ecx,eax
  443a59:	0f bf 5a 3d          	movsx  ebx,WORD PTR [edx+0x3d]
  443a5d:	03 cb                	add    ecx,ebx
  443a5f:	0f bf 42 3f          	movsx  eax,WORD PTR [edx+0x3f]
  443a63:	03 c8                	add    ecx,eax
  443a65:	33 c0                	xor    eax,eax
  443a67:	0f bf 5a 41          	movsx  ebx,WORD PTR [edx+0x41]
  443a6b:	66 8b 42 24          	mov    ax,WORD PTR [edx+0x24]
  443a6f:	03 cb                	add    ecx,ebx
  443a71:	03 c8                	add    ecx,eax
  443a73:	01 4c 24 18          	add    DWORD PTR [esp+0x18],ecx
  443a77:	8b 52 04             	mov    edx,DWORD PTR [edx+0x4]
  443a7a:	85 d2                	test   edx,edx
  443a7c:	75 a7                	jne    0x443a25
  443a7e:	8b 15 1c 03 89 00    	mov    edx,DWORD PTR ds:0x89031c
  443a84:	33 f6                	xor    esi,esi
  443a86:	3b d6                	cmp    edx,esi
  443a88:	74 65                	je     0x443aef
  443a8a:	33 c0                	xor    eax,eax
  443a8c:	33 c9                	xor    ecx,ecx
  443a8e:	66 8b 42 24          	mov    ax,WORD PTR [edx+0x24]
  443a92:	0f af c6             	imul   eax,esi
  443a95:	46                   	inc    esi
  443a96:	01 44 24 1c          	add    DWORD PTR [esp+0x1c],eax
  443a9a:	0f be 5a 2f          	movsx  ebx,BYTE PTR [edx+0x2f]
  443a9e:	8a 4a 2a             	mov    cl,BYTE PTR [edx+0x2a]
  443aa1:	33 c0                	xor    eax,eax
  443aa3:	8a 42 2b             	mov    al,BYTE PTR [edx+0x2b]
  443aa6:	03 c8                	add    ecx,eax
  443aa8:	33 c0                	xor    eax,eax
  443aaa:	8a 42 2c             	mov    al,BYTE PTR [edx+0x2c]
  443aad:	03 c8                	add    ecx,eax
  443aaf:	33 c0                	xor    eax,eax
  443ab1:	8a 42 2e             	mov    al,BYTE PTR [edx+0x2e]
  443ab4:	03 c8                	add    ecx,eax
  443ab6:	03 cb                	add    ecx,ebx
  443ab8:	0f bf 42 5d          	movsx  eax,WORD PTR [edx+0x5d]
  443abc:	03 c8                	add    ecx,eax
  443abe:	0f bf 5a 3d          	movsx  ebx,WORD PTR [edx+0x3d]
  443ac2:	03 cb                	add    ecx,ebx
  443ac4:	0f bf 42 5f          	movsx  eax,WORD PTR [edx+0x5f]
  443ac8:	03 c8                	add    ecx,eax
  443aca:	0f bf 5a 61          	movsx  ebx,WORD PTR [edx+0x61]
  443ace:	03 cb                	add    ecx,ebx
  443ad0:	0f bf 42 3f          	movsx  eax,WORD PTR [edx+0x3f]
  443ad4:	03 c8                	add    ecx,eax
  443ad6:	33 c0                	xor    eax,eax
  443ad8:	0f bf 5a 41          	movsx  ebx,WORD PTR [edx+0x41]
  443adc:	66 8b 42 24          	mov    ax,WORD PTR [edx+0x24]
  443ae0:	03 cb                	add    ecx,ebx
  443ae2:	03 c8                	add    ecx,eax
  443ae4:	01 4c 24 20          	add    DWORD PTR [esp+0x20],ecx
  443ae8:	8b 52 04             	mov    edx,DWORD PTR [edx+0x4]
  443aeb:	85 d2                	test   edx,edx
  443aed:	75 9b                	jne    0x443a8a
  443aef:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  443af3:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  443af7:	83 e0 0f             	and    eax,0xf
  443afa:	83 e1 0f             	and    ecx,0xf
  443afd:	c1 e0 04             	shl    eax,0x4
  443b00:	0b c1                	or     eax,ecx
  443b02:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  443b06:	c1 e0 04             	shl    eax,0x4
  443b09:	83 e1 0f             	and    ecx,0xf
  443b0c:	c1 e1 10             	shl    ecx,0x10
  443b0f:	0b c1                	or     eax,ecx
  443b11:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  443b15:	83 e1 0f             	and    ecx,0xf
  443b18:	0b c1                	or     eax,ecx
  443b1a:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  443b1e:	c1 e0 04             	shl    eax,0x4
  443b21:	83 e1 0f             	and    ecx,0xf
  443b24:	c1 e1 10             	shl    ecx,0x10
  443b27:	0b c1                	or     eax,ecx
  443b29:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  443b2d:	83 e1 0f             	and    ecx,0xf
  443b30:	5f                   	pop    edi
  443b31:	0b c1                	or     eax,ecx
  443b33:	5e                   	pop    esi
  443b34:	5b                   	pop    ebx
  443b35:	83 c4 20             	add    esp,0x20
  443b38:	c3                   	ret
