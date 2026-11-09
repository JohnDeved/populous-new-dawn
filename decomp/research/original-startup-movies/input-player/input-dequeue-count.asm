
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00526c10 <.text+0x125c10>:
  526c10:	83 ec 0c             	sub    esp,0xc
  526c13:	56                   	push   esi
  526c14:	8b 74 24 14          	mov    esi,DWORD PTR [esp+0x14]
  526c18:	85 f6                	test   esi,esi
  526c1a:	75 07                	jne    0x526c23
  526c1c:	33 c0                	xor    eax,eax
  526c1e:	5e                   	pop    esi
  526c1f:	83 c4 0c             	add    esp,0xc
  526c22:	c3                   	ret
  526c23:	8d 44 24 04          	lea    eax,[esp+0x4]
  526c27:	b9 40 59 d0 00       	mov    ecx,0xd05940
  526c2c:	50                   	push   eax
  526c2d:	6a 01                	push   0x1
  526c2f:	e8 4c 5a 00 00       	call   0x52c680
  526c34:	85 c0                	test   eax,eax
  526c36:	0f 84 ae 00 00 00    	je     0x526cea
  526c3c:	33 c0                	xor    eax,eax
  526c3e:	8a 44 24 05          	mov    al,BYTE PTR [esp+0x5]
  526c42:	89 46 08             	mov    DWORD PTR [esi+0x8],eax
  526c45:	33 c0                	xor    eax,eax
  526c47:	8a 44 24 04          	mov    al,BYTE PTR [esp+0x4]
  526c4b:	48                   	dec    eax
  526c4c:	83 f8 04             	cmp    eax,0x4
  526c4f:	0f 87 8c 00 00 00    	ja     0x526ce1
  526c55:	ff 24 85 f4 6c 52 00 	jmp    DWORD PTR [eax*4+0x526cf4]
  526c5c:	8a 44 24 06          	mov    al,BYTE PTR [esp+0x6]
  526c60:	c6 06 01             	mov    BYTE PTR [esi],0x1
  526c63:	c7 46 04 00 00 00 00 	mov    DWORD PTR [esi+0x4],0x0
  526c6a:	66 0f b6 4c 24 07    	movzx  cx,BYTE PTR [esp+0x7]
  526c70:	66 89 4e 02          	mov    WORD PTR [esi+0x2],cx
  526c74:	88 46 01             	mov    BYTE PTR [esi+0x1],al
  526c77:	33 c0                	xor    eax,eax
  526c79:	8a 06                	mov    al,BYTE PTR [esi]
  526c7b:	5e                   	pop    esi
  526c7c:	83 c4 0c             	add    esp,0xc
  526c7f:	c3                   	ret
  526c80:	66 0f b6 4c 24 07    	movzx  cx,BYTE PTR [esp+0x7]
  526c86:	66 89 4e 02          	mov    WORD PTR [esi+0x2],cx
  526c8a:	8a 44 24 06          	mov    al,BYTE PTR [esp+0x6]
  526c8e:	8b 4c 24 08          	mov    ecx,DWORD PTR [esp+0x8]
  526c92:	88 46 01             	mov    BYTE PTR [esi+0x1],al
  526c95:	33 c0                	xor    eax,eax
  526c97:	81 e1 ff ff 00 00    	and    ecx,0xffff
  526c9d:	66 8b 44 24 0a       	mov    ax,WORD PTR [esp+0xa]
  526ca2:	c6 06 01             	mov    BYTE PTR [esi],0x1
  526ca5:	c1 e0 10             	shl    eax,0x10
  526ca8:	0b c1                	or     eax,ecx
  526caa:	89 46 04             	mov    DWORD PTR [esi+0x4],eax
  526cad:	33 c0                	xor    eax,eax
  526caf:	8a 06                	mov    al,BYTE PTR [esi]
  526cb1:	5e                   	pop    esi
  526cb2:	83 c4 0c             	add    esp,0xc
  526cb5:	c3                   	ret
  526cb6:	33 c0                	xor    eax,eax
  526cb8:	c6 06 00             	mov    BYTE PTR [esi],0x0
  526cbb:	8a 06                	mov    al,BYTE PTR [esi]
  526cbd:	5e                   	pop    esi
  526cbe:	83 c4 0c             	add    esp,0xc
  526cc1:	c3                   	ret
  526cc2:	33 c0                	xor    eax,eax
  526cc4:	c6 06 00             	mov    BYTE PTR [esi],0x0
  526cc7:	8a 06                	mov    al,BYTE PTR [esi]
  526cc9:	5e                   	pop    esi
  526cca:	83 c4 0c             	add    esp,0xc
  526ccd:	c3                   	ret
  526cce:	66 8b 44 24 06       	mov    ax,WORD PTR [esp+0x6]
  526cd3:	8b 4c 24 0a          	mov    ecx,DWORD PTR [esp+0xa]
  526cd7:	66 89 46 02          	mov    WORD PTR [esi+0x2],ax
  526cdb:	89 4e 04             	mov    DWORD PTR [esi+0x4],ecx
  526cde:	c6 06 03             	mov    BYTE PTR [esi],0x3
  526ce1:	33 c0                	xor    eax,eax
  526ce3:	8a 06                	mov    al,BYTE PTR [esi]
  526ce5:	5e                   	pop    esi
  526ce6:	83 c4 0c             	add    esp,0xc
  526ce9:	c3                   	ret
  526cea:	33 c0                	xor    eax,eax
  526cec:	5e                   	pop    esi
  526ced:	83 c4 0c             	add    esp,0xc
  526cf0:	c3                   	ret

INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00526d10 <.text+0x125d10>:
  526d10:	a1 54 59 d0 00       	mov    eax,ds:0xd05954
  526d15:	c3                   	ret
