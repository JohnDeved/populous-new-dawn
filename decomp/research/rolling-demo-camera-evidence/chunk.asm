
/workspace/shared/populous-prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004b4020 <.text+0xb3020>:
  4b4020:	83 ec 10             	sub    esp,0x10
  4b4023:	53                   	push   ebx
  4b4024:	32 db                	xor    bl,bl
  4b4026:	66 83 3d 64 f6 98 00 	cmp    WORD PTR ds:0x98f664,0x0
  4b402d:	00 
  4b402e:	74 2c                	je     0x4b405c
  4b4030:	e8 eb fc fe ff       	call   0x4a3d20
  4b4035:	8d 44 24 10          	lea    eax,[esp+0x10]
  4b4039:	8d 54 24 04          	lea    edx,[esp+0x4]
  4b403d:	0f bf 0d 64 f6 98 00 	movsx  ecx,WORD PTR ds:0x98f664
  4b4044:	50                   	push   eax
  4b4045:	51                   	push   ecx
  4b4046:	52                   	push   edx
  4b4047:	a1 54 f6 98 00       	mov    eax,ds:0x98f654
  4b404c:	50                   	push   eax
  4b404d:	e8 2e 25 07 00       	call   0x526580
  4b4052:	83 c4 10             	add    esp,0x10
  4b4055:	83 f8 01             	cmp    eax,0x1
  4b4058:	1a db                	sbb    bl,bl
  4b405a:	fe c3                	inc    bl
  4b405c:	84 db                	test   bl,bl
  4b405e:	0f 85 a7 01 00 00    	jne    0x4b420b
  4b4064:	33 c0                	xor    eax,eax
  4b4066:	a0 66 f6 98 00       	mov    al,ds:0x98f666
  4b406b:	48                   	dec    eax
  4b406c:	83 f8 0a             	cmp    eax,0xa
  4b406f:	0f 87 a0 01 00 00    	ja     0x4b4215
  4b4075:	ff 24 85 28 42 4b 00 	jmp    DWORD PTR [eax*4+0x4b4228]
  4b407c:	8d 44 24 04          	lea    eax,[esp+0x4]
  4b4080:	50                   	push   eax
  4b4081:	e8 0a 9e f8 ff       	call   0x43de90
  4b4086:	83 c4 04             	add    esp,0x4
  4b4089:	e9 87 01 00 00       	jmp    0x4b4215
  4b408e:	a0 67 f6 98 00       	mov    al,ds:0x98f667
  4b4093:	8b 4c 24 08          	mov    ecx,DWORD PTR [esp+0x8]
  4b4097:	8d 54 24 04          	lea    edx,[esp+0x4]
  4b409b:	50                   	push   eax
  4b409c:	51                   	push   ecx
  4b409d:	52                   	push   edx
  4b409e:	e8 fd 3b f6 ff       	call   0x417ca0
  4b40a3:	83 c4 0c             	add    esp,0xc
  4b40a6:	e9 6a 01 00 00       	jmp    0x4b4215
  4b40ab:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  4b40af:	8b 4c 24 04          	mov    ecx,DWORD PTR [esp+0x4]
  4b40b3:	50                   	push   eax
  4b40b4:	8a 15 67 f6 98 00    	mov    dl,BYTE PTR ds:0x98f667
  4b40ba:	51                   	push   ecx
  4b40bb:	52                   	push   edx
  4b40bc:	e8 3f 5e fc ff       	call   0x479f00
  4b40c1:	83 c4 0c             	add    esp,0xc
  4b40c4:	e9 4c 01 00 00       	jmp    0x4b4215
  4b40c9:	0f bf 44 24 04       	movsx  eax,WORD PTR [esp+0x4]
  4b40ce:	33 c9                	xor    ecx,ecx
  4b40d0:	8b 14 85 90 03 89 00 	mov    edx,DWORD PTR [eax*4+0x890390]
  4b40d7:	66 8b 4a 24          	mov    cx,WORD PTR [edx+0x24]
  4b40db:	33 c0                	xor    eax,eax
  4b40dd:	66 a1 8a 9e 96 00    	mov    ax,ds:0x969e8a
  4b40e3:	3b c1                	cmp    eax,ecx
  4b40e5:	74 15                	je     0x4b40fc
  4b40e7:	80 25 97 9e 96 00 fd 	and    BYTE PTR ds:0x969e97,0xfd
  4b40ee:	66 89 0d 8a 9e 96 00 	mov    WORD PTR ds:0x969e8a,cx
  4b40f5:	c6 05 94 9e 96 00 00 	mov    BYTE PTR ds:0x969e94,0x0
  4b40fc:	0f be 44 24 07       	movsx  eax,BYTE PTR [esp+0x7]
  4b4101:	8b 4c 24 06          	mov    ecx,DWORD PTR [esp+0x6]
  4b4105:	50                   	push   eax
  4b4106:	6a 00                	push   0x0
  4b4108:	51                   	push   ecx
  4b4109:	e8 52 59 f6 ff       	call   0x419a60
  4b410e:	83 c4 0c             	add    esp,0xc
  4b4111:	6a 00                	push   0x0
  4b4113:	e8 08 59 f6 ff       	call   0x419a20
  4b4118:	83 c4 04             	add    esp,0x4
  4b411b:	e9 f5 00 00 00       	jmp    0x4b4215
  4b4120:	e8 6b 47 f6 ff       	call   0x418890
  4b4125:	e9 eb 00 00 00       	jmp    0x4b4215
  4b412a:	0f bf 44 24 08       	movsx  eax,WORD PTR [esp+0x8]
  4b412f:	0f bf 4c 24 06       	movsx  ecx,WORD PTR [esp+0x6]
  4b4134:	50                   	push   eax
  4b4135:	51                   	push   ecx
  4b4136:	e8 e5 e7 f8 ff       	call   0x442920
  4b413b:	0f bf 4c 24 10       	movsx  ecx,WORD PTR [esp+0x10]
  4b4140:	0f bf 54 24 0c       	movsx  edx,WORD PTR [esp+0xc]
  4b4145:	83 c4 08             	add    esp,0x8
  4b4148:	51                   	push   ecx
  4b4149:	52                   	push   edx
  4b414a:	e8 31 e7 f8 ff       	call   0x442880
  4b414f:	83 c4 08             	add    esp,0x8
  4b4152:	e9 be 00 00 00       	jmp    0x4b4215
  4b4157:	0f bf 44 24 08       	movsx  eax,WORD PTR [esp+0x8]
  4b415c:	0f bf 4c 24 04       	movsx  ecx,WORD PTR [esp+0x4]
  4b4161:	50                   	push   eax
  4b4162:	51                   	push   ecx
  4b4163:	e8 58 e8 f8 ff       	call   0x4429c0
  4b4168:	83 c4 08             	add    esp,0x8
  4b416b:	e9 a5 00 00 00       	jmp    0x4b4215
  4b4170:	66 0f be 05 67 f6 98 	movsx  ax,BYTE PTR ds:0x98f667
  4b4177:	00 
  4b4178:	50                   	push   eax
  4b4179:	e8 82 3a f6 ff       	call   0x417c00
  4b417e:	83 c4 04             	add    esp,0x4
  4b4181:	e9 8f 00 00 00       	jmp    0x4b4215
  4b4186:	80 3d 67 f6 98 00 00 	cmp    BYTE PTR ds:0x98f667,0x0
  4b418d:	74 22                	je     0x4b41b1
  4b418f:	66 0f be 05 67 f6 98 	movsx  ax,BYTE PTR ds:0x98f667
  4b4196:	00 
  4b4197:	66 3d 00 01          	cmp    ax,0x100
  4b419b:	74 14                	je     0x4b41b1
  4b419d:	81 0d 69 c6 89 00 00 	or     DWORD PTR ds:0x89c669,0x100000
  4b41a4:	00 10 00 
  4b41a7:	0f bf c0             	movsx  eax,ax
  4b41aa:	a3 a9 c6 89 00       	mov    ds:0x89c6a9,eax
  4b41af:	eb 64                	jmp    0x4b4215
  4b41b1:	81 25 69 c6 89 00 ff 	and    DWORD PTR ds:0x89c669,0xffefffff
  4b41b8:	ff ef ff 
  4b41bb:	eb 58                	jmp    0x4b4215
  4b41bd:	66 8b 4c 24 04       	mov    cx,WORD PTR [esp+0x4]
  4b41c2:	a0 67 f6 98 00       	mov    al,ds:0x98f667
  4b41c7:	66 8b 54 24 06       	mov    dx,WORD PTR [esp+0x6]
  4b41cc:	a2 08 f7 98 00       	mov    ds:0x98f708,al
  4b41d1:	66 8b 44 24 0a       	mov    ax,WORD PTR [esp+0xa]
  4b41d6:	66 89 0d 00 f7 98 00 	mov    WORD PTR ds:0x98f700,cx
  4b41dd:	0f bf 4c 24 08       	movsx  ecx,WORD PTR [esp+0x8]
  4b41e2:	66 89 15 02 f7 98 00 	mov    WORD PTR ds:0x98f702,dx
  4b41e9:	89 0d fc f6 98 00    	mov    DWORD PTR ds:0x98f6fc,ecx
  4b41ef:	66 a3 04 f7 98 00    	mov    ds:0x98f704,ax
  4b41f5:	eb 1e                	jmp    0x4b4215
  4b41f7:	66 8b 44 24 04       	mov    ax,WORD PTR [esp+0x4]
  4b41fc:	0f be 4c 24 07       	movsx  ecx,BYTE PTR [esp+0x7]
  4b4201:	66 89 04 4d 3e f7 98 	mov    WORD PTR [ecx*2+0x98f73e],ax
  4b4208:	00 
  4b4209:	eb 0a                	jmp    0x4b4215
  4b420b:	c7 05 60 f6 98 00 ff 	mov    DWORD PTR ds:0x98f660,0xffffffff
  4b4212:	ff ff ff 
  4b4215:	84 db                	test   bl,bl
  4b4217:	74 07                	je     0x4b4220
  4b4219:	c6 05 4f f7 98 00 08 	mov    BYTE PTR ds:0x98f74f,0x8
  4b4220:	5b                   	pop    ebx
  4b4221:	83 c4 10             	add    esp,0x10
  4b4224:	c3                   	ret
