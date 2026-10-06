
/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0048fc50 <.text+0x8ec50>:
  48fc50:	83 ec 28             	sub    esp,0x28
  48fc53:	53                   	push   ebx
  48fc54:	56                   	push   esi
  48fc55:	8b 74 24 38          	mov    esi,DWORD PTR [esp+0x38]
  48fc59:	57                   	push   edi
  48fc5a:	55                   	push   ebp
  48fc5b:	33 c9                	xor    ecx,ecx
  48fc5d:	8b 86 04 31 00 00    	mov    eax,DWORD PTR [esi+0x3104]
  48fc63:	83 c0 02             	add    eax,0x2
  48fc66:	89 86 04 31 00 00    	mov    DWORD PTR [esi+0x3104],eax
  48fc6c:	66 8b 08             	mov    cx,WORD PTR [eax]
  48fc6f:	81 f9 5e 04 00 00    	cmp    ecx,0x45e
  48fc75:	7c 08                	jl     0x48fc7f
  48fc77:	81 f9 61 04 00 00    	cmp    ecx,0x461
  48fc7d:	7e 31                	jle    0x48fcb0
  48fc7f:	8d 04 cd 00 00 00 00 	lea    eax,[ecx*8+0x0]
  48fc86:	8b 7c 24 3c          	mov    edi,DWORD PTR [esp+0x3c]
  48fc8a:	03 86 00 31 00 00    	add    eax,DWORD PTR [esi+0x3100]
  48fc90:	50                   	push   eax
  48fc91:	56                   	push   esi
  48fc92:	57                   	push   edi
  48fc93:	e8 b8 f6 ff ff       	call   0x48f350
  48fc98:	83 c4 0c             	add    esp,0xc
  48fc9b:	8d 0c 80             	lea    ecx,[eax+eax*4]
  48fc9e:	8d 14 48             	lea    edx,[eax+ecx*2]
  48fca1:	8d 1c d2             	lea    ebx,[edx+edx*8]
  48fca4:	8d 0c d8             	lea    ecx,[eax+ebx*8]
  48fca7:	8d 9c 88 c8 d1 89 00 	lea    ebx,[eax+ecx*4+0x89d1c8]
  48fcae:	eb 17                	jmp    0x48fcc7
  48fcb0:	8d 04 89             	lea    eax,[ecx+ecx*4]
  48fcb3:	8b 7c 24 3c          	mov    edi,DWORD PTR [esp+0x3c]
  48fcb7:	8d 14 41             	lea    edx,[ecx+eax*2]
  48fcba:	8d 1c d2             	lea    ebx,[edx+edx*8]
  48fcbd:	8d 04 d9             	lea    eax,[ecx+ebx*8]
  48fcc0:	8d 9c 81 b2 b0 53 00 	lea    ebx,[ecx+eax*4+0x53b0b2]
  48fcc7:	8b 86 04 31 00 00    	mov    eax,DWORD PTR [esi+0x3104]
  48fccd:	33 c9                	xor    ecx,ecx
  48fccf:	83 c0 02             	add    eax,0x2
  48fcd2:	89 86 04 31 00 00    	mov    DWORD PTR [esi+0x3104],eax
  48fcd8:	66 8b 08             	mov    cx,WORD PTR [eax]
  48fcdb:	c1 e1 03             	shl    ecx,0x3
  48fcde:	03 8e 00 31 00 00    	add    ecx,DWORD PTR [esi+0x3100]
  48fce4:	51                   	push   ecx
  48fce5:	56                   	push   esi
  48fce6:	57                   	push   edi
  48fce7:	e8 64 f6 ff ff       	call   0x48f350
  48fcec:	89 44 24 40          	mov    DWORD PTR [esp+0x40],eax
  48fcf0:	83 c4 0c             	add    esp,0xc
  48fcf3:	8b 8e 04 31 00 00    	mov    ecx,DWORD PTR [esi+0x3104]
  48fcf9:	33 c0                	xor    eax,eax
  48fcfb:	83 c1 02             	add    ecx,0x2
  48fcfe:	89 8e 04 31 00 00    	mov    DWORD PTR [esi+0x3104],ecx
  48fd04:	66 8b 01             	mov    ax,WORD PTR [ecx]
  48fd07:	3d 2e 04 00 00       	cmp    eax,0x42e
  48fd0c:	74 10                	je     0x48fd1e
  48fd0e:	3d 2f 04 00 00       	cmp    eax,0x42f
  48fd13:	74 13                	je     0x48fd28
  48fd15:	3d 30 04 00 00       	cmp    eax,0x430
  48fd1a:	74 16                	je     0x48fd32
  48fd1c:	eb 1c                	jmp    0x48fd3a
  48fd1e:	c7 44 24 14 00 00 00 	mov    DWORD PTR [esp+0x14],0x0
  48fd25:	00 
  48fd26:	eb 12                	jmp    0x48fd3a
  48fd28:	c7 44 24 14 01 00 00 	mov    DWORD PTR [esp+0x14],0x1
  48fd2f:	00 
  48fd30:	eb 08                	jmp    0x48fd3a
  48fd32:	c7 44 24 14 02 00 00 	mov    DWORD PTR [esp+0x14],0x2
  48fd39:	00 
  48fd3a:	83 c1 02             	add    ecx,0x2
  48fd3d:	33 c0                	xor    eax,eax
  48fd3f:	89 8e 04 31 00 00    	mov    DWORD PTR [esi+0x3104],ecx
  48fd45:	66 8b 01             	mov    ax,WORD PTR [ecx]
  48fd48:	c1 e0 03             	shl    eax,0x3
  48fd4b:	03 86 00 31 00 00    	add    eax,DWORD PTR [esi+0x3100]
  48fd51:	50                   	push   eax
  48fd52:	56                   	push   esi
  48fd53:	57                   	push   edi
  48fd54:	e8 f7 f5 ff ff       	call   0x48f350
  48fd59:	89 44 24 3c          	mov    DWORD PTR [esp+0x3c],eax
  48fd5d:	83 c4 0c             	add    esp,0xc
  48fd60:	8b 86 04 31 00 00    	mov    eax,DWORD PTR [esi+0x3104]
  48fd66:	33 c9                	xor    ecx,ecx
  48fd68:	83 c0 02             	add    eax,0x2
  48fd6b:	89 86 04 31 00 00    	mov    DWORD PTR [esi+0x3104],eax
  48fd71:	66 8b 08             	mov    cx,WORD PTR [eax]
  48fd74:	c1 e1 03             	shl    ecx,0x3
  48fd77:	03 8e 00 31 00 00    	add    ecx,DWORD PTR [esi+0x3100]
  48fd7d:	51                   	push   ecx
  48fd7e:	56                   	push   esi
  48fd7f:	57                   	push   edi
  48fd80:	e8 cb f5 ff ff       	call   0x48f350
  48fd85:	89 44 24 38          	mov    DWORD PTR [esp+0x38],eax
  48fd89:	83 c4 0c             	add    esp,0xc
  48fd8c:	8b 86 04 31 00 00    	mov    eax,DWORD PTR [esi+0x3104]
  48fd92:	33 c9                	xor    ecx,ecx
  48fd94:	83 c0 02             	add    eax,0x2
  48fd97:	89 86 04 31 00 00    	mov    DWORD PTR [esi+0x3104],eax
  48fd9d:	66 8b 08             	mov    cx,WORD PTR [eax]
  48fda0:	c1 e1 03             	shl    ecx,0x3
  48fda3:	03 8e 00 31 00 00    	add    ecx,DWORD PTR [esi+0x3100]
  48fda9:	51                   	push   ecx
  48fdaa:	56                   	push   esi
  48fdab:	57                   	push   edi
  48fdac:	e8 9f f5 ff ff       	call   0x48f350
  48fdb1:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  48fdb5:	83 c4 0c             	add    esp,0xc
  48fdb8:	8b 86 04 31 00 00    	mov    eax,DWORD PTR [esi+0x3104]
  48fdbe:	33 c9                	xor    ecx,ecx
  48fdc0:	83 c0 02             	add    eax,0x2
  48fdc3:	89 86 04 31 00 00    	mov    DWORD PTR [esi+0x3104],eax
  48fdc9:	66 8b 08             	mov    cx,WORD PTR [eax]
  48fdcc:	c1 e1 03             	shl    ecx,0x3
  48fdcf:	03 8e 00 31 00 00    	add    ecx,DWORD PTR [esi+0x3100]
  48fdd5:	51                   	push   ecx
  48fdd6:	56                   	push   esi
  48fdd7:	57                   	push   edi
  48fdd8:	e8 73 f5 ff ff       	call   0x48f350
  48fddd:	89 44 24 30          	mov    DWORD PTR [esp+0x30],eax
  48fde1:	83 c4 0c             	add    esp,0xc
  48fde4:	8b 86 04 31 00 00    	mov    eax,DWORD PTR [esi+0x3104]
  48fdea:	33 c9                	xor    ecx,ecx
  48fdec:	83 c0 02             	add    eax,0x2
  48fdef:	89 86 04 31 00 00    	mov    DWORD PTR [esi+0x3104],eax
  48fdf5:	66 8b 08             	mov    cx,WORD PTR [eax]
  48fdf8:	c1 e1 03             	shl    ecx,0x3
  48fdfb:	03 8e 00 31 00 00    	add    ecx,DWORD PTR [esi+0x3100]
  48fe01:	51                   	push   ecx
  48fe02:	56                   	push   esi
  48fe03:	57                   	push   edi
  48fe04:	e8 47 f5 ff ff       	call   0x48f350
  48fe09:	89 44 24 2c          	mov    DWORD PTR [esp+0x2c],eax
  48fe0d:	83 c4 0c             	add    esp,0xc
  48fe10:	8b 8e 04 31 00 00    	mov    ecx,DWORD PTR [esi+0x3104]
  48fe16:	33 c0                	xor    eax,eax
  48fe18:	83 c1 02             	add    ecx,0x2
  48fe1b:	89 8e 04 31 00 00    	mov    DWORD PTR [esi+0x3104],ecx
  48fe21:	66 8b 01             	mov    ax,WORD PTR [ecx]
  48fe24:	3d 36 04 00 00       	cmp    eax,0x436
  48fe29:	0f 84 0d 01 00 00    	je     0x48ff3c
  48fe2f:	3d 37 04 00 00       	cmp    eax,0x437
  48fe34:	0f 84 09 01 00 00    	je     0x48ff43
  48fe3a:	3d 38 04 00 00       	cmp    eax,0x438
  48fe3f:	0f 84 08 01 00 00    	je     0x48ff4d
  48fe45:	8b 6c 24 18          	mov    ebp,DWORD PTR [esp+0x18]
  48fe49:	83 c1 02             	add    ecx,0x2
  48fe4c:	33 c0                	xor    eax,eax
  48fe4e:	89 8e 04 31 00 00    	mov    DWORD PTR [esi+0x3104],ecx
  48fe54:	66 8b 01             	mov    ax,WORD PTR [ecx]
  48fe57:	c1 e0 03             	shl    eax,0x3
  48fe5a:	03 86 00 31 00 00    	add    eax,DWORD PTR [esi+0x3100]
  48fe60:	50                   	push   eax
  48fe61:	56                   	push   esi
  48fe62:	57                   	push   edi
  48fe63:	e8 e8 f4 ff ff       	call   0x48f350
  48fe68:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  48fe6c:	83 c4 0c             	add    esp,0xc
  48fe6f:	8b 86 04 31 00 00    	mov    eax,DWORD PTR [esi+0x3104]
  48fe75:	33 c9                	xor    ecx,ecx
  48fe77:	83 c0 02             	add    eax,0x2
  48fe7a:	89 86 04 31 00 00    	mov    DWORD PTR [esi+0x3104],eax
  48fe80:	66 8b 08             	mov    cx,WORD PTR [eax]
  48fe83:	c1 e1 03             	shl    ecx,0x3
  48fe86:	03 8e 00 31 00 00    	add    ecx,DWORD PTR [esi+0x3100]
  48fe8c:	51                   	push   ecx
  48fe8d:	56                   	push   esi
  48fe8e:	57                   	push   edi
  48fe8f:	e8 bc f4 ff ff       	call   0x48f350
  48fe94:	89 44 24 24          	mov    DWORD PTR [esp+0x24],eax
  48fe98:	83 c4 0c             	add    esp,0xc
  48fe9b:	8b 86 04 31 00 00    	mov    eax,DWORD PTR [esi+0x3104]
  48fea1:	33 c9                	xor    ecx,ecx
  48fea3:	83 c0 02             	add    eax,0x2
  48fea6:	89 86 04 31 00 00    	mov    DWORD PTR [esi+0x3104],eax
  48feac:	66 8b 08             	mov    cx,WORD PTR [eax]
  48feaf:	c1 e1 03             	shl    ecx,0x3
  48feb2:	03 8e 00 31 00 00    	add    ecx,DWORD PTR [esi+0x3100]
  48feb8:	51                   	push   ecx
  48feb9:	56                   	push   esi
  48feba:	57                   	push   edi
  48febb:	e8 90 f4 ff ff       	call   0x48f350
  48fec0:	88 44 24 1f          	mov    BYTE PTR [esp+0x1f],al
  48fec4:	83 c4 0c             	add    esp,0xc
  48fec7:	8b 86 04 31 00 00    	mov    eax,DWORD PTR [esi+0x3104]
  48fecd:	33 c9                	xor    ecx,ecx
  48fecf:	83 c0 02             	add    eax,0x2
  48fed2:	89 86 04 31 00 00    	mov    DWORD PTR [esi+0x3104],eax
  48fed8:	66 8b 08             	mov    cx,WORD PTR [eax]
  48fedb:	c1 e1 03             	shl    ecx,0x3
  48fede:	03 8e 00 31 00 00    	add    ecx,DWORD PTR [esi+0x3100]
  48fee4:	51                   	push   ecx
  48fee5:	56                   	push   esi
  48fee6:	57                   	push   edi
  48fee7:	e8 64 f4 ff ff       	call   0x48f350
  48feec:	8b 4c 24 1f          	mov    ecx,DWORD PTR [esp+0x1f]
  48fef0:	8b 54 24 24          	mov    edx,DWORD PTR [esp+0x24]
  48fef4:	83 c4 0c             	add    esp,0xc
  48fef7:	83 86 04 31 00 00 02 	add    DWORD PTR [esi+0x3104],0x2
  48fefe:	50                   	push   eax
  48feff:	51                   	push   ecx
  48ff00:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  48ff04:	52                   	push   edx
  48ff05:	8b 4c 24 2c          	mov    ecx,DWORD PTR [esp+0x2c]
  48ff09:	50                   	push   eax
  48ff0a:	55                   	push   ebp
  48ff0b:	51                   	push   ecx
  48ff0c:	8b 54 24 3c          	mov    edx,DWORD PTR [esp+0x3c]
  48ff10:	8b 44 24 40          	mov    eax,DWORD PTR [esp+0x40]
  48ff14:	8b 4c 24 44          	mov    ecx,DWORD PTR [esp+0x44]
  48ff18:	52                   	push   edx
  48ff19:	8b 54 24 4c          	mov    edx,DWORD PTR [esp+0x4c]
  48ff1d:	50                   	push   eax
  48ff1e:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  48ff22:	51                   	push   ecx
  48ff23:	8b 4c 24 58          	mov    ecx,DWORD PTR [esp+0x58]
  48ff27:	52                   	push   edx
  48ff28:	50                   	push   eax
  48ff29:	51                   	push   ecx
  48ff2a:	53                   	push   ebx
  48ff2b:	57                   	push   edi
  48ff2c:	e8 9f 60 05 00       	call   0x4e5fd0
  48ff31:	83 c4 38             	add    esp,0x38
  48ff34:	5d                   	pop    ebp
  48ff35:	5f                   	pop    edi
  48ff36:	5e                   	pop    esi
  48ff37:	5b                   	pop    ebx
  48ff38:	83 c4 28             	add    esp,0x28
  48ff3b:	c3                   	ret
  48ff3c:	33 ed                	xor    ebp,ebp
  48ff3e:	e9 06 ff ff ff       	jmp    0x48fe49
  48ff43:	bd 01 00 00 00       	mov    ebp,0x1
  48ff48:	e9 fc fe ff ff       	jmp    0x48fe49
  48ff4d:	bd 02 00 00 00       	mov    ebp,0x2
  48ff52:	e9 f2 fe ff ff       	jmp    0x48fe49
