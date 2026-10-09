
/workspace/scratch/69fd8163d94e/populous-recovery-20261009/work/orchestration/original-data-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00510d40 <.text+0x10fd40>:
  510d40:	83 ec 30             	sub    esp,0x30
  510d43:	53                   	push   ebx
  510d44:	56                   	push   esi
  510d45:	57                   	push   edi
  510d46:	33 db                	xor    ebx,ebx
  510d48:	8b 7c 24 40          	mov    edi,DWORD PTR [esp+0x40]
  510d4c:	55                   	push   ebp
  510d4d:	89 7c 24 10          	mov    DWORD PTR [esp+0x10],edi
  510d51:	38 5f 72             	cmp    BYTE PTR [edi+0x72],bl
  510d54:	0f 86 ac 02 00 00    	jbe    0x511006
  510d5a:	8d 77 3d             	lea    esi,[edi+0x3d]
  510d5d:	66 8b 56 04          	mov    dx,WORD PTR [esi+0x4]
  510d61:	8d 4c 24 38          	lea    ecx,[esp+0x38]
  510d65:	8b 06                	mov    eax,DWORD PTR [esi]
  510d67:	89 01                	mov    DWORD PTR [ecx],eax
  510d69:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  510d6e:	66 89 51 04          	mov    WORD PTR [ecx+0x4],dx
  510d72:	8b c8                	mov    ecx,eax
  510d74:	8d 14 c0             	lea    edx,[eax+eax*8]
  510d77:	8d 04 d1             	lea    eax,[ecx+edx*8]
  510d7a:	8d 04 81             	lea    eax,[ecx+eax*4]
  510d7d:	c1 e0 02             	shl    eax,0x2
  510d80:	8d 04 c1             	lea    eax,[ecx+eax*8]
  510d83:	05 df 24 00 00       	add    eax,0x24df
  510d88:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  510d8d:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  510d91:	c1 4c 24 34 0d       	ror    DWORD PTR [esp+0x34],0xd
  510d96:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  510d9a:	66 25 ff 01          	and    ax,0x1ff
  510d9e:	66 2d 00 01          	sub    ax,0x100
  510da2:	66 01 44 24 38       	add    WORD PTR [esp+0x38],ax
  510da7:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  510dab:	8b c8                	mov    ecx,eax
  510dad:	8d 14 c0             	lea    edx,[eax+eax*8]
  510db0:	8d 04 d1             	lea    eax,[ecx+edx*8]
  510db3:	8d 04 81             	lea    eax,[ecx+eax*4]
  510db6:	c1 e0 02             	shl    eax,0x2
  510db9:	8d 04 c1             	lea    eax,[ecx+eax*8]
  510dbc:	05 df 24 00 00       	add    eax,0x24df
  510dc1:	89 44 24 30          	mov    DWORD PTR [esp+0x30],eax
  510dc5:	c1 4c 24 30 0d       	ror    DWORD PTR [esp+0x30],0xd
  510dca:	8b 44 24 30          	mov    eax,DWORD PTR [esp+0x30]
  510dce:	8b 4c 24 30          	mov    ecx,DWORD PTR [esp+0x30]
  510dd2:	66 25 ff 01          	and    ax,0x1ff
  510dd6:	8d 14 c9             	lea    edx,[ecx+ecx*8]
  510dd9:	66 2d 00 01          	sub    ax,0x100
  510ddd:	66 01 44 24 3a       	add    WORD PTR [esp+0x3a],ax
  510de2:	8b c1                	mov    eax,ecx
  510de4:	8d 0c d1             	lea    ecx,[ecx+edx*8]
  510de7:	8d 0c 88             	lea    ecx,[eax+ecx*4]
  510dea:	c1 e1 02             	shl    ecx,0x2
  510ded:	8d 0c c8             	lea    ecx,[eax+ecx*8]
  510df0:	81 c1 df 24 00 00    	add    ecx,0x24df
  510df6:	89 4c 24 2c          	mov    DWORD PTR [esp+0x2c],ecx
  510dfa:	c1 4c 24 2c 0d       	ror    DWORD PTR [esp+0x2c],0xd
  510dff:	8b 44 24 2c          	mov    eax,DWORD PTR [esp+0x2c]
  510e03:	8b e8                	mov    ebp,eax
  510e05:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  510e0a:	83 e5 7f             	and    ebp,0x7f
  510e0d:	8d 44 24 38          	lea    eax,[esp+0x38]
  510e11:	83 ed 40             	sub    ebp,0x40
  510e14:	50                   	push   eax
  510e15:	66 01 6c 24 40       	add    WORD PTR [esp+0x40],bp
  510e1a:	8a 4f 2f             	mov    cl,BYTE PTR [edi+0x2f]
  510e1d:	51                   	push   ecx
  510e1e:	6a 1b                	push   0x1b
  510e20:	6a 07                	push   0x7
  510e22:	e8 79 ca fd ff       	call   0x4ed8a0
  510e27:	83 c4 10             	add    esp,0x10
  510e2a:	85 c0                	test   eax,eax
  510e2c:	0f 84 c6 01 00 00    	je     0x510ff8
  510e32:	8b 0d 78 d1 89 00    	mov    ecx,DWORD PTR ds:0x89d178
  510e38:	8b d1                	mov    edx,ecx
  510e3a:	8d 0c c9             	lea    ecx,[ecx+ecx*8]
  510e3d:	8d 0c ca             	lea    ecx,[edx+ecx*8]
  510e40:	8d 0c 8a             	lea    ecx,[edx+ecx*4]
  510e43:	c1 e1 02             	shl    ecx,0x2
  510e46:	8d 0c ca             	lea    ecx,[edx+ecx*8]
  510e49:	81 c1 df 24 00 00    	add    ecx,0x24df
  510e4f:	89 0d 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,ecx
  510e55:	89 4c 24 28          	mov    DWORD PTR [esp+0x28],ecx
  510e59:	c1 4c 24 28 0d       	ror    DWORD PTR [esp+0x28],0xd
  510e5e:	8b 4c 24 28          	mov    ecx,DWORD PTR [esp+0x28]
  510e62:	89 0d 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,ecx
  510e68:	66 83 e1 7f          	and    cx,0x7f
  510e6c:	66 89 48 49          	mov    WORD PTR [eax+0x49],cx
  510e70:	8b 0d 78 d1 89 00    	mov    ecx,DWORD PTR ds:0x89d178
  510e76:	8b d1                	mov    edx,ecx
  510e78:	8d 0c c9             	lea    ecx,[ecx+ecx*8]
  510e7b:	8d 0c ca             	lea    ecx,[edx+ecx*8]
  510e7e:	8d 0c 8a             	lea    ecx,[edx+ecx*4]
  510e81:	c1 e1 02             	shl    ecx,0x2
  510e84:	8d 0c ca             	lea    ecx,[edx+ecx*8]
  510e87:	81 c1 df 24 00 00    	add    ecx,0x24df
  510e8d:	89 0d 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,ecx
  510e93:	89 4c 24 24          	mov    DWORD PTR [esp+0x24],ecx
  510e97:	c1 4c 24 24 0d       	ror    DWORD PTR [esp+0x24],0xd
  510e9c:	8b 4c 24 24          	mov    ecx,DWORD PTR [esp+0x24]
  510ea0:	89 0d 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,ecx
  510ea6:	66 83 e1 7f          	and    cx,0x7f
  510eaa:	66 89 48 4b          	mov    WORD PTR [eax+0x4b],cx
  510eae:	8b 0d 78 d1 89 00    	mov    ecx,DWORD PTR ds:0x89d178
  510eb4:	8b d1                	mov    edx,ecx
  510eb6:	8d 0c c9             	lea    ecx,[ecx+ecx*8]
  510eb9:	8d 0c ca             	lea    ecx,[edx+ecx*8]
  510ebc:	8d 0c 8a             	lea    ecx,[edx+ecx*4]
  510ebf:	c1 e1 02             	shl    ecx,0x2
  510ec2:	8d 0c ca             	lea    ecx,[edx+ecx*8]
  510ec5:	81 c1 df 24 00 00    	add    ecx,0x24df
  510ecb:	89 0d 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,ecx
  510ed1:	89 4c 24 20          	mov    DWORD PTR [esp+0x20],ecx
  510ed5:	c1 4c 24 20 0d       	ror    DWORD PTR [esp+0x20],0xd
  510eda:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  510ede:	89 0d 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,ecx
  510ee4:	66 83 e1 7f          	and    cx,0x7f
  510ee8:	66 89 48 4d          	mov    WORD PTR [eax+0x4d],cx
  510eec:	66 89 68 72          	mov    WORD PTR [eax+0x72],bp
  510ef0:	8b 6c 24 10          	mov    ebp,DWORD PTR [esp+0x10]
  510ef4:	c6 40 2d 00          	mov    BYTE PTR [eax+0x2d],0x0
  510ef8:	66 8b 50 24          	mov    dx,WORD PTR [eax+0x24]
  510efc:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  510f00:	66 89 55 6e          	mov    WORD PTR [ebp+0x6e],dx
  510f04:	8b 0d 72 bc 89 00    	mov    ecx,DWORD PTR ds:0x89bc72
  510f0a:	8b d1                	mov    edx,ecx
  510f0c:	8d 2c c9             	lea    ebp,[ecx+ecx*8]
  510f0f:	8d 0c ea             	lea    ecx,[edx+ebp*8]
  510f12:	8d 0c 8a             	lea    ecx,[edx+ecx*4]
  510f15:	c1 e1 02             	shl    ecx,0x2
  510f18:	8d 0c ca             	lea    ecx,[edx+ecx*8]
  510f1b:	81 c1 df 24 00 00    	add    ecx,0x24df
  510f21:	89 0d 72 bc 89 00    	mov    DWORD PTR ds:0x89bc72,ecx
  510f27:	89 4c 24 1c          	mov    DWORD PTR [esp+0x1c],ecx
  510f2b:	c1 4c 24 1c 0d       	ror    DWORD PTR [esp+0x1c],0xd
  510f30:	8b 4c 24 1c          	mov    ecx,DWORD PTR [esp+0x1c]
  510f34:	89 0d 72 bc 89 00    	mov    DWORD PTR ds:0x89bc72,ecx
  510f3a:	80 e1 0f             	and    cl,0xf
  510f3d:	80 f9 01             	cmp    cl,0x1
  510f40:	73 0d                	jae    0x510f4f
  510f42:	0f be 48 2f          	movsx  ecx,BYTE PTR [eax+0x2f]
  510f46:	8a 8c 89 ca 89 5a 00 	mov    cl,BYTE PTR [ecx+ecx*4+0x5a89ca]
  510f4d:	eb 06                	jmp    0x510f55
  510f4f:	8a 0d f5 c6 89 00    	mov    cl,BYTE PTR ds:0x89c6f5
  510f55:	88 88 8a 00 00 00    	mov    BYTE PTR [eax+0x8a],cl
  510f5b:	83 c0 76             	add    eax,0x76
  510f5e:	ba 05 00 00 00       	mov    edx,0x5
  510f63:	8b 0d 78 d1 89 00    	mov    ecx,DWORD PTR ds:0x89d178
  510f69:	8b e9                	mov    ebp,ecx
  510f6b:	8d 0c c9             	lea    ecx,[ecx+ecx*8]
  510f6e:	8d 4c cd 00          	lea    ecx,[ebp+ecx*8+0x0]
  510f72:	8d 4c 8d 00          	lea    ecx,[ebp+ecx*4+0x0]
  510f76:	c1 e1 02             	shl    ecx,0x2
  510f79:	8d 4c cd 00          	lea    ecx,[ebp+ecx*8+0x0]
  510f7d:	81 c1 df 24 00 00    	add    ecx,0x24df
  510f83:	89 0d 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,ecx
  510f89:	89 4c 24 18          	mov    DWORD PTR [esp+0x18],ecx
  510f8d:	c1 4c 24 18 0d       	ror    DWORD PTR [esp+0x18],0xd
  510f92:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  510f96:	89 0d 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,ecx
  510f9c:	66 81 e1 ff 01       	and    cx,0x1ff
  510fa1:	66 81 e9 00 01       	sub    cx,0x100
  510fa6:	66 89 08             	mov    WORD PTR [eax],cx
  510fa9:	8b 2d 78 d1 89 00    	mov    ebp,DWORD PTR ds:0x89d178
  510faf:	8b cd                	mov    ecx,ebp
  510fb1:	8d 6c ed 00          	lea    ebp,[ebp+ebp*8+0x0]
  510fb5:	8d 2c e9             	lea    ebp,[ecx+ebp*8]
  510fb8:	8d 2c a9             	lea    ebp,[ecx+ebp*4]
  510fbb:	c1 e5 02             	shl    ebp,0x2
  510fbe:	8d 2c e9             	lea    ebp,[ecx+ebp*8]
  510fc1:	81 c5 df 24 00 00    	add    ebp,0x24df
  510fc7:	89 2d 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,ebp
  510fcd:	89 6c 24 14          	mov    DWORD PTR [esp+0x14],ebp
  510fd1:	c1 4c 24 14 0d       	ror    DWORD PTR [esp+0x14],0xd
  510fd6:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  510fda:	83 c0 04             	add    eax,0x4
  510fdd:	89 0d 78 d1 89 00    	mov    DWORD PTR ds:0x89d178,ecx
  510fe3:	66 81 e1 ff 01       	and    cx,0x1ff
  510fe8:	66 81 e9 00 01       	sub    cx,0x100
  510fed:	4a                   	dec    edx
  510fee:	66 89 48 fe          	mov    WORD PTR [eax-0x2],cx
  510ff2:	0f 85 6b ff ff ff    	jne    0x510f63
  510ff8:	43                   	inc    ebx
  510ff9:	33 c0                	xor    eax,eax
  510ffb:	8a 47 72             	mov    al,BYTE PTR [edi+0x72]
  510ffe:	3b c3                	cmp    eax,ebx
  511000:	0f 8f 57 fd ff ff    	jg     0x510d5d
  511006:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  51100a:	5d                   	pop    ebp
  51100b:	66 c7 41 6e 00 00    	mov    WORD PTR [ecx+0x6e],0x0
  511011:	c6 47 2d 01          	mov    BYTE PTR [edi+0x2d],0x1
  511015:	5f                   	pop    edi
  511016:	5e                   	pop    esi
  511017:	5b                   	pop    ebx
  511018:	83 c4 30             	add    esp,0x30
  51101b:	c3                   	ret
  51101c:	cc                   	int3
  51101d:	cc                   	int3
  51101e:	cc                   	int3
  51101f:	cc                   	int3
