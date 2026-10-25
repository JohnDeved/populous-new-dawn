
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00465ea0 <.text+0x64ea0>:
  465ea0:	83 ec 20             	sub    esp,0x20
  465ea3:	33 c9                	xor    ecx,ecx
  465ea5:	8b 54 24 24          	mov    edx,DWORD PTR [esp+0x24]
  465ea9:	53                   	push   ebx
  465eaa:	c7 44 24 10 00 00 00 	mov    DWORD PTR [esp+0x10],0x0
  465eb1:	00 
  465eb2:	56                   	push   esi
  465eb3:	8a 4a 2b             	mov    cl,BYTE PTR [edx+0x2b]
  465eb6:	57                   	push   edi
  465eb7:	8b c1                	mov    eax,ecx
  465eb9:	55                   	push   ebp
  465eba:	8d 0c 49             	lea    ecx,[ecx+ecx*2]
  465ebd:	0f bf 6a 26          	movsx  ebp,WORD PTR [edx+0x26]
  465ec1:	c1 e1 03             	shl    ecx,0x3
  465ec4:	83 c2 7a             	add    edx,0x7a
  465ec7:	2b c8                	sub    ecx,eax
  465ec9:	89 54 24 24          	mov    DWORD PTR [esp+0x24],edx
  465ecd:	0f be 81 40 79 5a 00 	movsx  eax,BYTE PTR [ecx+0x5a7940]
  465ed4:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  465ed8:	8d 85 00 02 00 00    	lea    eax,[ebp+0x200]
  465ede:	25 ff 07 00 00       	and    eax,0x7ff
  465ee3:	83 7c 24 28 00       	cmp    DWORD PTR [esp+0x28],0x0
  465ee8:	89 44 24 2c          	mov    DWORD PTR [esp+0x2c],eax
  465eec:	0f 8e 79 02 00 00    	jle    0x46616b
  465ef2:	33 f6                	xor    esi,esi
  465ef4:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  465ef8:	66 8b 00             	mov    ax,WORD PTR [eax]
  465efb:	66 3b c6             	cmp    ax,si
  465efe:	74 18                	je     0x465f18
  465f00:	0f b7 c0             	movzx  eax,ax
  465f03:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  465f0a:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  465f0e:	75 08                	jne    0x465f18
  465f10:	80 78 2a 00          	cmp    BYTE PTR [eax+0x2a],0x0
  465f14:	74 02                	je     0x465f18
  465f16:	8b f0                	mov    esi,eax
  465f18:	85 f6                	test   esi,esi
  465f1a:	0f 84 34 02 00 00    	je     0x466154
  465f20:	33 c9                	xor    ecx,ecx
  465f22:	8b 54 24 34          	mov    edx,DWORD PTR [esp+0x34]
  465f26:	8b 5c 24 1c          	mov    ebx,DWORD PTR [esp+0x1c]
  465f2a:	8a 4a 2b             	mov    cl,BYTE PTR [edx+0x2b]
  465f2d:	8b c1                	mov    eax,ecx
  465f2f:	8d 0c 49             	lea    ecx,[ecx+ecx*2]
  465f32:	c1 e1 03             	shl    ecx,0x3
  465f35:	2b c8                	sub    ecx,eax
  465f37:	0f be 81 41 79 5a 00 	movsx  eax,BYTE PTR [ecx+0x5a7941]
  465f3e:	8d 14 40             	lea    edx,[eax+eax*2]
  465f41:	8d 0c 93             	lea    ecx,[ebx+edx*4]
  465f44:	8d 54 24 10          	lea    edx,[esp+0x10]
  465f48:	8d 04 49             	lea    eax,[ecx+ecx*2]
  465f4b:	8d 3c 45 e0 89 5a 00 	lea    edi,[eax*2+0x5a89e0]
  465f52:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  465f56:	8b 48 3d             	mov    ecx,DWORD PTR [eax+0x3d]
  465f59:	83 c0 3d             	add    eax,0x3d
  465f5c:	89 0a                	mov    DWORD PTR [edx],ecx
  465f5e:	66 8b 40 04          	mov    ax,WORD PTR [eax+0x4]
  465f62:	66 89 42 04          	mov    WORD PTR [edx+0x4],ax
  465f66:	8d 54 24 10          	lea    edx,[esp+0x10]
  465f6a:	66 8b 4f 02          	mov    cx,WORD PTR [edi+0x2]
  465f6e:	51                   	push   ecx
  465f6f:	55                   	push   ebp
  465f70:	52                   	push   edx
  465f71:	e8 fa 0a 08 00       	call   0x4e6a70
  465f76:	66 8b 0f             	mov    cx,WORD PTR [edi]
  465f79:	8b 54 24 38          	mov    edx,DWORD PTR [esp+0x38]
  465f7d:	8d 44 24 1c          	lea    eax,[esp+0x1c]
  465f81:	83 c4 0c             	add    esp,0xc
  465f84:	51                   	push   ecx
  465f85:	52                   	push   edx
  465f86:	50                   	push   eax
  465f87:	e8 e4 0a 08 00       	call   0x4e6a70
  465f8c:	8b 54 24 40          	mov    edx,DWORD PTR [esp+0x40]
  465f90:	83 c4 0c             	add    esp,0xc
  465f93:	80 7e 7e 00          	cmp    BYTE PTR [esi+0x7e],0x0
  465f97:	0f bf 4a 41          	movsx  ecx,WORD PTR [edx+0x41]
  465f9b:	0f bf 5f 04          	movsx  ebx,WORD PTR [edi+0x4]
  465f9f:	8d 3c 0b             	lea    edi,[ebx+ecx*1]
  465fa2:	0f 84 64 01 00 00    	je     0x46610c
  465fa8:	66 8b 44 24 10       	mov    ax,WORD PTR [esp+0x10]
  465fad:	83 8a 92 00 00 00 02 	or     DWORD PTR [edx+0x92],0x2
  465fb4:	66 2b 46 3d          	sub    ax,WORD PTR [esi+0x3d]
  465fb8:	0f b7 d0             	movzx  edx,ax
  465fbb:	66 8b 44 24 12       	mov    ax,WORD PTR [esp+0x12]
  465fc0:	8b da                	mov    ebx,edx
  465fc2:	66 2b 46 3f          	sub    ax,WORD PTR [esi+0x3f]
  465fc6:	85 d2                	test   edx,edx
  465fc8:	0f b7 c8             	movzx  ecx,ax
  465fcb:	7d 04                	jge    0x465fd1
  465fcd:	8b da                	mov    ebx,edx
  465fcf:	f7 db                	neg    ebx
  465fd1:	8b c1                	mov    eax,ecx
  465fd3:	85 c9                	test   ecx,ecx
  465fd5:	7d 04                	jge    0x465fdb
  465fd7:	8b c1                	mov    eax,ecx
  465fd9:	f7 d8                	neg    eax
  465fdb:	81 fb 00 80 00 00    	cmp    ebx,0x8000
  465fe1:	7c 06                	jl     0x465fe9
  465fe3:	8d 93 00 00 ff ff    	lea    edx,[ebx-0x10000]
  465fe9:	3d 00 80 00 00       	cmp    eax,0x8000
  465fee:	7c 06                	jl     0x465ff6
  465ff0:	8d 88 00 00 ff ff    	lea    ecx,[eax-0x10000]
  465ff6:	f7 d9                	neg    ecx
  465ff8:	51                   	push   ecx
  465ff9:	33 db                	xor    ebx,ebx
  465ffb:	52                   	push   edx
  465ffc:	e8 73 00 12 00       	call   0x586074
  466001:	66 8b d8             	mov    bx,ax
  466004:	83 c4 08             	add    esp,0x8
  466007:	81 e3 ff 07 00 00    	and    ebx,0x7ff
  46600d:	8d 4e 3d             	lea    ecx,[esi+0x3d]
  466010:	8d 44 24 10          	lea    eax,[esp+0x10]
  466014:	50                   	push   eax
  466015:	51                   	push   ecx
  466016:	e8 d5 a3 fe ff       	call   0x4503f0
  46601b:	83 c4 08             	add    esp,0x8
  46601e:	33 c9                	xor    ecx,ecx
  466020:	99                   	cdq
  466021:	8a 4e 7e             	mov    cl,BYTE PTR [esi+0x7e]
  466024:	f7 f9                	idiv   ecx
  466026:	8d 56 3d             	lea    edx,[esi+0x3d]
  466029:	50                   	push   eax
  46602a:	89 54 24 24          	mov    DWORD PTR [esp+0x24],edx
  46602e:	53                   	push   ebx
  46602f:	8d 54 24 18          	lea    edx,[esp+0x18]
  466033:	8b 4c 24 28          	mov    ecx,DWORD PTR [esp+0x28]
  466037:	8b 09                	mov    ecx,DWORD PTR [ecx]
  466039:	89 0a                	mov    DWORD PTR [edx],ecx
  46603b:	8b 4c 24 28          	mov    ecx,DWORD PTR [esp+0x28]
  46603f:	66 8b 49 04          	mov    cx,WORD PTR [ecx+0x4]
  466043:	66 89 4a 04          	mov    WORD PTR [edx+0x4],cx
  466047:	8d 54 24 18          	lea    edx,[esp+0x18]
  46604b:	52                   	push   edx
  46604c:	e8 1f 0a 08 00       	call   0x4e6a70
  466051:	83 c4 0c             	add    esp,0xc
  466054:	33 c9                	xor    ecx,ecx
  466056:	8a 4e 7e             	mov    cl,BYTE PTR [esi+0x7e]
  466059:	8b c7                	mov    eax,edi
  46605b:	0f bf 54 24 14       	movsx  edx,WORD PTR [esp+0x14]
  466060:	2b c2                	sub    eax,edx
  466062:	99                   	cdq
  466063:	f7 f9                	idiv   ecx
  466065:	03 f8                	add    edi,eax
  466067:	49                   	dec    ecx
  466068:	83 f9 03             	cmp    ecx,0x3
  46606b:	77 19                	ja     0x466086
  46606d:	ff 24 8d 74 61 46 00 	jmp    DWORD PTR [ecx*4+0x466174]
  466074:	83 c7 28             	add    edi,0x28
  466077:	eb 0d                	jmp    0x466086
  466079:	83 c7 64             	add    edi,0x64
  46607c:	eb 08                	jmp    0x466086
  46607e:	83 c7 64             	add    edi,0x64
  466081:	eb 03                	jmp    0x466086
  466083:	83 c7 14             	add    edi,0x14
  466086:	66 8b 46 5d          	mov    ax,WORD PTR [esi+0x5d]
  46608a:	50                   	push   eax
  46608b:	55                   	push   ebp
  46608c:	e8 df 3a 08 00       	call   0x4e9b70
  466091:	0f bf d8             	movsx  ebx,ax
  466094:	66 8b 46 5d          	mov    ax,WORD PTR [esi+0x5d]
  466098:	83 c4 08             	add    esp,0x8
  46609b:	50                   	push   eax
  46609c:	55                   	push   ebp
  46609d:	e8 fe 3a 08 00       	call   0x4e9ba0
  4660a2:	c7 44 24 20 00 00 00 	mov    DWORD PTR [esp+0x20],0x0
  4660a9:	00 
  4660aa:	0f bf c8             	movsx  ecx,ax
  4660ad:	83 c4 08             	add    esp,0x8
  4660b0:	8a 46 7e             	mov    al,BYTE PTR [esi+0x7e]
  4660b3:	88 44 24 18          	mov    BYTE PTR [esp+0x18],al
  4660b7:	8b c3                	mov    eax,ebx
  4660b9:	99                   	cdq
  4660ba:	f7 7c 24 18          	idiv   DWORD PTR [esp+0x18]
  4660be:	0f af c1             	imul   eax,ecx
  4660c1:	0f bf 4e 5d          	movsx  ecx,WORD PTR [esi+0x5d]
  4660c5:	03 c1                	add    eax,ecx
  4660c7:	25 ff 07 00 00       	and    eax,0x7ff
  4660cc:	f6 46 0c 80          	test   BYTE PTR [esi+0xc],0x80
  4660d0:	74 04                	je     0x4660d6
  4660d2:	66 89 46 57          	mov    WORD PTR [esi+0x57],ax
  4660d6:	66 89 46 5d          	mov    WORD PTR [esi+0x5d],ax
  4660da:	f6 46 0d 80          	test   BYTE PTR [esi+0xd],0x80
  4660de:	74 08                	je     0x4660e8
  4660e0:	66 05 00 04          	add    ax,0x400
  4660e4:	66 25 ff 07          	and    ax,0x7ff
  4660e8:	66 89 46 26          	mov    WORD PTR [esi+0x26],ax
  4660ec:	80 7e 7e 03          	cmp    BYTE PTR [esi+0x7e],0x3
  4660f0:	75 07                	jne    0x4660f9
  4660f2:	81 66 10 ff fb ff ff 	and    DWORD PTR [esi+0x10],0xfffffbff
  4660f9:	80 7e 7e 01          	cmp    BYTE PTR [esi+0x7e],0x1
  4660fd:	77 3b                	ja     0x46613a
  4660ff:	8b 54 24 34          	mov    edx,DWORD PTR [esp+0x34]
  466103:	c6 82 a0 00 00 00 01 	mov    BYTE PTR [edx+0xa0],0x1
  46610a:	eb 2e                	jmp    0x46613a
  46610c:	f6 46 77 02          	test   BYTE PTR [esi+0x77],0x2
  466110:	75 28                	jne    0x46613a
  466112:	f6 46 0c 80          	test   BYTE PTR [esi+0xc],0x80
  466116:	74 04                	je     0x46611c
  466118:	66 89 6e 57          	mov    WORD PTR [esi+0x57],bp
  46611c:	66 89 6e 5d          	mov    WORD PTR [esi+0x5d],bp
  466120:	f6 46 0d 80          	test   BYTE PTR [esi+0xd],0x80
  466124:	74 10                	je     0x466136
  466126:	8d 85 00 04 00 00    	lea    eax,[ebp+0x400]
  46612c:	66 25 ff 07          	and    ax,0x7ff
  466130:	66 89 46 26          	mov    WORD PTR [esi+0x26],ax
  466134:	eb 04                	jmp    0x46613a
  466136:	66 89 6e 26          	mov    WORD PTR [esi+0x26],bp
  46613a:	66 89 7c 24 14       	mov    WORD PTR [esp+0x14],di
  46613f:	8d 44 24 10          	lea    eax,[esp+0x10]
  466143:	50                   	push   eax
  466144:	56                   	push   esi
  466145:	e8 36 84 08 00       	call   0x4ee580
  46614a:	81 4e 0c 00 40 00 00 	or     DWORD PTR [esi+0xc],0x4000
  466151:	83 c4 08             	add    esp,0x8
  466154:	83 44 24 24 02       	add    DWORD PTR [esp+0x24],0x2
  466159:	ff 44 24 1c          	inc    DWORD PTR [esp+0x1c]
  46615d:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  466161:	39 44 24 28          	cmp    DWORD PTR [esp+0x28],eax
  466165:	0f 8f 87 fd ff ff    	jg     0x465ef2
  46616b:	5d                   	pop    ebp
  46616c:	5f                   	pop    edi
  46616d:	5e                   	pop    esi
  46616e:	5b                   	pop    ebx
  46616f:	83 c4 20             	add    esp,0x20
  466172:	c3                   	ret
  466173:	90                   	nop
  466174:	74 60                	je     0x4661d6
  466176:	46                   	inc    esi
  466177:	00 79 60             	add    BYTE PTR [ecx+0x60],bh
  46617a:	46                   	inc    esi
  46617b:	00 7e 60             	add    BYTE PTR [esi+0x60],bh
  46617e:	46                   	inc    esi
  46617f:	00 83 60 46 00 cc    	add    BYTE PTR [ebx-0x33ffb9a0],al
  466185:	cc                   	int3
  466186:	cc                   	int3
  466187:	cc                   	int3
  466188:	cc                   	int3
  466189:	cc                   	int3
  46618a:	cc                   	int3
  46618b:	cc                   	int3
  46618c:	cc                   	int3
  46618d:	cc                   	int3
  46618e:	cc                   	int3
  46618f:	cc                   	int3
  466190:	8b 4c 24 04          	mov    ecx,DWORD PTR [esp+0x4]
  466194:	83 ec 0c             	sub    esp,0xc
  466197:	c6 44 24 01 01       	mov    BYTE PTR [esp+0x1],0x1
  46619c:	8d 54 24 04          	lea    edx,[esp+0x4]
  4661a0:	53                   	push   ebx
  4661a1:	56                   	push   esi
  4661a2:	57                   	push   edi
  4661a3:	66 8b 59 41          	mov    bx,WORD PTR [ecx+0x41]
  4661a7:	55                   	push   ebp
  4661a8:	8d 79 3d             	lea    edi,[ecx+0x3d]
  4661ab:	0f bf 71 26          	movsx  esi,WORD PTR [ecx+0x26]
  4661af:	8b 07                	mov    eax,DWORD PTR [edi]
  4661b1:	89 02                	mov    DWORD PTR [edx],eax
  4661b3:	88 64 24 12          	mov    BYTE PTR [esp+0x12],ah
  4661b7:	66 89 5a 04          	mov    WORD PTR [edx+0x4],bx
  4661bb:	33 c0                	xor    eax,eax
  4661bd:	66 8b 51 3f          	mov    dx,WORD PTR [ecx+0x3f]
  4661c1:	88 74 24 13          	mov    BYTE PTR [esp+0x13],dh
  4661c5:	33 d2                	xor    edx,edx
  4661c7:	66 8b 44 24 12       	mov    ax,WORD PTR [esp+0x12]
  4661cc:	66 8b 54 24 12       	mov    dx,WORD PTR [esp+0x12]
  4661d1:	25 fe 00 00 00       	and    eax,0xfe
  4661d6:	03 c0                	add    eax,eax
  4661d8:	81 e2 00 fe 00 00    	and    edx,0xfe00
  4661de:	0b c2                	or     eax,edx
  4661e0:	8d 14 85 e4 03 8a 00 	lea    edx,[eax*4+0x8a03e4]
  4661e7:	33 c0                	xor    eax,eax
  4661e9:	8a 41 2b             	mov    al,BYTE PTR [ecx+0x2b]
  4661ec:	33 db                	xor    ebx,ebx
  4661ee:	8b c8                	mov    ecx,eax
  4661f0:	8d 04 40             	lea    eax,[eax+eax*2]
  4661f3:	c1 e0 03             	shl    eax,0x3
  4661f6:	2b c1                	sub    eax,ecx
  4661f8:	33 c9                	xor    ecx,ecx
  4661fa:	66 8b 98 4d 79 5a 00 	mov    bx,WORD PTR [eax+0x5a794d]
  466201:	8a 42 0c             	mov    al,BYTE PTR [edx+0xc]
  466204:	83 e3 01             	and    ebx,0x1
  466207:	24 0f                	and    al,0xf
  466209:	8a c8                	mov    cl,al
  46620b:	8b c1                	mov    eax,ecx
  46620d:	c1 e1 03             	shl    ecx,0x3
  466210:	2b c8                	sub    ecx,eax
  466212:	f6 04 4d 28 a3 5a 00 	test   BYTE PTR [ecx*2+0x5aa328],0x3c
  466219:	3c 
  46621a:	0f 84 ae 00 00 00    	je     0x4662ce
