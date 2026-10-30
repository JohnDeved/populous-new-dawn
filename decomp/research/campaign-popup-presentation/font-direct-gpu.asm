
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00516b80 <.text+0x115b80>:
  516b80:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  516b84:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  516b88:	8b 54 24 08          	mov    edx,DWORD PTR [esp+0x8]
  516b8c:	8d 0c c8             	lea    ecx,[eax+ecx*8]
  516b8f:	33 c0                	xor    eax,eax
  516b91:	66 8b 81 04 ff ff ff 	mov    ax,WORD PTR [ecx-0xfc]
  516b98:	89 02                	mov    DWORD PTR [edx],eax
  516b9a:	33 c0                	xor    eax,eax
  516b9c:	66 8b 81 06 ff ff ff 	mov    ax,WORD PTR [ecx-0xfa]
  516ba3:	89 42 04             	mov    DWORD PTR [edx+0x4],eax
  516ba6:	c3                   	ret
  516ba7:	cc                   	int3
  516ba8:	cc                   	int3
  516ba9:	cc                   	int3
  516baa:	cc                   	int3
  516bab:	cc                   	int3
  516bac:	cc                   	int3
  516bad:	cc                   	int3
  516bae:	cc                   	int3
  516baf:	cc                   	int3
  516bb0:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  516bb4:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  516bb8:	83 ec 0c             	sub    esp,0xc
  516bbb:	83 3d 78 a0 5d 00 00 	cmp    DWORD PTR ds:0x5da078,0x0
  516bc2:	56                   	push   esi
  516bc3:	8d b4 c8 00 ff ff ff 	lea    esi,[eax+ecx*8-0x100]
  516bca:	74 28                	je     0x516bf4
  516bcc:	8b 44 24 28          	mov    eax,DWORD PTR [esp+0x28]
  516bd0:	8b 4c 24 24          	mov    ecx,DWORD PTR [esp+0x24]
  516bd4:	8b 54 24 1c          	mov    edx,DWORD PTR [esp+0x1c]
  516bd8:	50                   	push   eax
  516bd9:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  516bdd:	51                   	push   ecx
  516bde:	56                   	push   esi
  516bdf:	52                   	push   edx
  516be0:	50                   	push   eax
  516be1:	e8 1a 57 01 00       	call   0x52c300
  516be6:	83 c4 14             	add    esp,0x14
  516be9:	33 c0                	xor    eax,eax
  516beb:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  516bef:	5e                   	pop    esi
  516bf0:	83 c4 0c             	add    esp,0xc
  516bf3:	c3                   	ret
  516bf4:	8d 44 24 0c          	lea    eax,[esp+0xc]
  516bf8:	8d 4c 24 08          	lea    ecx,[esp+0x8]
  516bfc:	50                   	push   eax
  516bfd:	51                   	push   ecx
  516bfe:	56                   	push   esi
  516bff:	e8 6c f5 ff ff       	call   0x516170
  516c04:	83 c4 0c             	add    esp,0xc
  516c07:	83 7c 24 08 00       	cmp    DWORD PTR [esp+0x8],0x0
  516c0c:	74 64                	je     0x516c72
  516c0e:	33 c9                	xor    ecx,ecx
  516c10:	33 c0                	xor    eax,eax
  516c12:	8a 4c 24 27          	mov    cl,BYTE PTR [esp+0x27]
  516c16:	8a 44 24 25          	mov    al,BYTE PTR [esp+0x25]
  516c1a:	c1 e1 10             	shl    ecx,0x10
  516c1d:	0b c8                	or     ecx,eax
  516c1f:	33 c0                	xor    eax,eax
  516c21:	c1 e1 08             	shl    ecx,0x8
  516c24:	8a 44 24 26          	mov    al,BYTE PTR [esp+0x26]
  516c28:	c1 e0 10             	shl    eax,0x10
  516c2b:	0b c8                	or     ecx,eax
  516c2d:	33 c0                	xor    eax,eax
  516c2f:	8a 44 24 24          	mov    al,BYTE PTR [esp+0x24]
  516c33:	0b c8                	or     ecx,eax
  516c35:	a1 e4 a0 5d 00       	mov    eax,ds:0x5da0e4
  516c3a:	23 05 74 a0 5d 00    	and    eax,DWORD PTR ds:0x5da074
  516c40:	81 e1 ff ff ff 00    	and    ecx,0xffffff
  516c46:	db 44 24 1c          	fild   DWORD PTR [esp+0x1c]
  516c4a:	8b 54 24 08          	mov    edx,DWORD PTR [esp+0x8]
  516c4e:	50                   	push   eax
  516c4f:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  516c53:	51                   	push   ecx
  516c54:	50                   	push   eax
  516c55:	52                   	push   edx
  516c56:	83 ec 04             	sub    esp,0x4
  516c59:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  516c5f:	83 ec 04             	sub    esp,0x4
  516c62:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  516c66:	db 44 24 30          	fild   DWORD PTR [esp+0x30]
  516c6a:	d9 1c 24             	fstp   DWORD PTR [esp]
  516c6d:	e8 2e 71 f6 ff       	call   0x47dda0
  516c72:	33 c0                	xor    eax,eax
  516c74:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  516c78:	5e                   	pop    esi
  516c79:	83 c4 0c             	add    esp,0xc
  516c7c:	c3                   	ret
  516c7d:	cc                   	int3
  516c7e:	cc                   	int3
  516c7f:	cc                   	int3
  516c80:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  516c84:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  516c88:	83 ec 0c             	sub    esp,0xc
  516c8b:	83 3d 78 a0 5d 00 00 	cmp    DWORD PTR ds:0x5da078,0x0
  516c92:	56                   	push   esi
  516c93:	8d b4 c8 00 ff ff ff 	lea    esi,[eax+ecx*8-0x100]
  516c9a:	74 1e                	je     0x516cba
  516c9c:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  516ca0:	56                   	push   esi
  516ca1:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  516ca5:	50                   	push   eax
  516ca6:	51                   	push   ecx
  516ca7:	e8 34 3b 01 00       	call   0x52a7e0
  516cac:	83 c4 0c             	add    esp,0xc
  516caf:	33 c0                	xor    eax,eax
  516cb1:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  516cb5:	5e                   	pop    esi
  516cb6:	83 c4 0c             	add    esp,0xc
  516cb9:	c3                   	ret
  516cba:	8d 44 24 0c          	lea    eax,[esp+0xc]
  516cbe:	8d 4c 24 08          	lea    ecx,[esp+0x8]
  516cc2:	50                   	push   eax
  516cc3:	51                   	push   ecx
  516cc4:	56                   	push   esi
  516cc5:	e8 a6 f4 ff ff       	call   0x516170
  516cca:	83 c4 0c             	add    esp,0xc
  516ccd:	83 7c 24 08 00       	cmp    DWORD PTR [esp+0x8],0x0
  516cd2:	74 45                	je     0x516d19
  516cd4:	f6 05 74 a0 5d 00 08 	test   BYTE PTR ds:0x5da074,0x8
  516cdb:	b8 ff ff ff 00       	mov    eax,0xffffff
  516ce0:	74 05                	je     0x516ce7
  516ce2:	a1 e0 a0 5d 00       	mov    eax,ds:0x5da0e0
  516ce7:	8b 0d 74 a0 5d 00    	mov    ecx,DWORD PTR ds:0x5da074
  516ced:	8b 54 24 08          	mov    edx,DWORD PTR [esp+0x8]
  516cf1:	db 44 24 1c          	fild   DWORD PTR [esp+0x1c]
  516cf5:	51                   	push   ecx
  516cf6:	50                   	push   eax
  516cf7:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  516cfb:	50                   	push   eax
  516cfc:	52                   	push   edx
  516cfd:	83 ec 04             	sub    esp,0x4
  516d00:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  516d06:	83 ec 04             	sub    esp,0x4
  516d09:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  516d0d:	db 44 24 30          	fild   DWORD PTR [esp+0x30]
  516d11:	d9 1c 24             	fstp   DWORD PTR [esp]
  516d14:	e8 37 6f f6 ff       	call   0x47dc50
  516d19:	33 c0                	xor    eax,eax
  516d1b:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  516d1f:	5e                   	pop    esi
  516d20:	83 c4 0c             	add    esp,0xc
  516d23:	c3                   	ret
  516d24:	cc                   	int3
  516d25:	cc                   	int3
  516d26:	cc                   	int3
  516d27:	cc                   	int3
  516d28:	cc                   	int3
  516d29:	cc                   	int3
  516d2a:	cc                   	int3
  516d2b:	cc                   	int3
  516d2c:	cc                   	int3
  516d2d:	cc                   	int3
  516d2e:	cc                   	int3
  516d2f:	cc                   	int3
