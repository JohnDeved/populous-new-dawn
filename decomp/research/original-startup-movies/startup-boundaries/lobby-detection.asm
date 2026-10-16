
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00413db0 <.text+0x12db0>:
  413db0:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  413db6:	55                   	push   ebp
  413db7:	8b ec                	mov    ebp,esp
  413db9:	6a ff                	push   0xffffffff
  413dbb:	68 6b 3f 41 00       	push   0x413f6b
  413dc0:	50                   	push   eax
  413dc1:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  413dc8:	81 ec d4 00 00 00    	sub    esp,0xd4
  413dce:	53                   	push   ebx
  413dcf:	56                   	push   esi
  413dd0:	57                   	push   edi
  413dd1:	33 db                	xor    ebx,ebx
  413dd3:	68 c6 01 00 00       	push   0x1c6
  413dd8:	88 1d 9d 56 89 00    	mov    BYTE PTR ds:0x89569d,bl
  413dde:	e8 bd 6e 14 00       	call   0x55aca0
  413de3:	89 45 f0             	mov    DWORD PTR [ebp-0x10],eax
  413de6:	83 c4 04             	add    esp,0x4
  413de9:	8b f8                	mov    edi,eax
  413deb:	b9 00 00 00 00       	mov    ecx,0x0
  413df0:	89 5d fc             	mov    DWORD PTR [ebp-0x4],ebx
  413df3:	85 ff                	test   edi,edi
  413df5:	74 17                	je     0x413e0e
  413df7:	8b cf                	mov    ecx,edi
  413df9:	89 5f 04             	mov    DWORD PTR [edi+0x4],ebx
  413dfc:	89 1f                	mov    DWORD PTR [edi],ebx
  413dfe:	89 5f 0c             	mov    DWORD PTR [edi+0xc],ebx
  413e01:	89 5f 10             	mov    DWORD PTR [edi+0x10],ebx
  413e04:	89 5f 14             	mov    DWORD PTR [edi+0x14],ebx
  413e07:	c7 47 1c ff ff ff ff 	mov    DWORD PTR [edi+0x1c],0xffffffff
  413e0e:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  413e15:	33 f6                	xor    esi,esi
  413e17:	89 0d 38 9c 59 00    	mov    DWORD PTR ds:0x599c38,ecx
  413e1d:	85 c9                	test   ecx,ecx
  413e1f:	0f 84 19 01 00 00    	je     0x413f3e
  413e25:	56                   	push   esi
  413e26:	8b 45 10             	mov    eax,DWORD PTR [ebp+0x10]
  413e29:	6a 04                	push   0x4
  413e2b:	8b 55 0c             	mov    edx,DWORD PTR [ebp+0xc]
  413e2e:	50                   	push   eax
  413e2f:	8b 7d 08             	mov    edi,DWORD PTR [ebp+0x8]
  413e32:	52                   	push   edx
  413e33:	8d 85 20 ff ff ff    	lea    eax,[ebp-0xe0]
  413e39:	57                   	push   edi
  413e3a:	50                   	push   eax
  413e3b:	68 10 9c 59 00       	push   0x599c10
  413e40:	68 80 32 41 00       	push   0x413280
  413e45:	ff 15 78 c9 d0 00    	call   DWORD PTR ds:0xd0c978
  413e4b:	89 45 f0             	mov    DWORD PTR [ebp-0x10],eax
  413e4e:	83 f8 20             	cmp    eax,0x20
  413e51:	0f 84 fa 00 00 00    	je     0x413f51
  413e57:	68 e8 ca 5f 00       	push   0x5fcae8
  413e5c:	8b 3d f4 c6 d0 00    	mov    edi,DWORD PTR ds:0xd0c6f4
  413e62:	ff d7                	call   edi
  413e64:	68 c8 ca 5f 00       	push   0x5fcac8
  413e69:	ff d7                	call   edi
  413e6b:	68 38 e2 5f 00       	push   0x5fe238
  413e70:	ff d7                	call   edi
  413e72:	bf 00 cc 5f 00       	mov    edi,0x5fcc00
  413e77:	33 c0                	xor    eax,eax
  413e79:	b9 2f 00 00 00       	mov    ecx,0x2f
  413e7e:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  413e80:	aa                   	stos   BYTE PTR es:[edi],al
  413e81:	89 35 28 e2 5f 00    	mov    DWORD PTR ds:0x5fe228,esi
  413e87:	b8 28 e2 5f 00       	mov    eax,0x5fe228
  413e8c:	89 70 04             	mov    DWORD PTR [eax+0x4],esi
  413e8f:	89 35 d8 cb 5f 00    	mov    DWORD PTR ds:0x5fcbd8,esi
  413e95:	89 70 08             	mov    DWORD PTR [eax+0x8],esi
  413e98:	89 35 dc cb 5f 00    	mov    DWORD PTR ds:0x5fcbdc,esi
  413e9e:	89 70 0c             	mov    DWORD PTR [eax+0xc],esi
  413ea1:	89 35 e0 cb 5f 00    	mov    DWORD PTR ds:0x5fcbe0,esi
  413ea7:	89 35 e4 cb 5f 00    	mov    DWORD PTR ds:0x5fcbe4,esi
  413ead:	b8 d8 cb 5f 00       	mov    eax,0x5fcbd8
  413eb2:	b8 e8 cb 5f 00       	mov    eax,0x5fcbe8
  413eb7:	89 30                	mov    DWORD PTR [eax],esi
  413eb9:	89 35 00 cb 5f 00    	mov    DWORD PTR ds:0x5fcb00,esi
  413ebf:	89 70 04             	mov    DWORD PTR [eax+0x4],esi
  413ec2:	89 35 04 cb 5f 00    	mov    DWORD PTR ds:0x5fcb04,esi
  413ec8:	bf 18 ce 5f 00       	mov    edi,0x5fce18
  413ecd:	89 70 08             	mov    DWORD PTR [eax+0x8],esi
  413ed0:	b9 90 01 00 00       	mov    ecx,0x190
  413ed5:	89 70 0c             	mov    DWORD PTR [eax+0xc],esi
  413ed8:	89 35 08 cb 5f 00    	mov    DWORD PTR ds:0x5fcb08,esi
  413ede:	b8 00 cb 5f 00       	mov    eax,0x5fcb00
  413ee3:	89 35 0c cb 5f 00    	mov    DWORD PTR ds:0x5fcb0c,esi
  413ee9:	33 c0                	xor    eax,eax
  413eeb:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  413eed:	b8 af 56 89 00       	mov    eax,0x8956af
  413ef2:	56                   	push   esi
  413ef3:	68 d0 31 41 00       	push   0x4131d0
  413ef8:	89 35 24 9c 59 00    	mov    DWORD PTR ds:0x599c24,esi
  413efe:	8b 0d 38 9c 59 00    	mov    ecx,DWORD PTR ds:0x599c38
  413f04:	c7 00 ff ff ff ff    	mov    DWORD PTR [eax],0xffffffff
  413f0a:	89 35 28 9c 59 00    	mov    DWORD PTR ds:0x599c28,esi
  413f10:	89 35 34 9c 59 00    	mov    DWORD PTR ds:0x599c34,esi
  413f16:	c7 40 04 ff ff ff ff 	mov    DWORD PTR [eax+0x4],0xffffffff
  413f1d:	ff 15 74 c9 d0 00    	call   DWORD PTR ds:0xd0c974
  413f23:	81 7d f0 00 10 00 00 	cmp    DWORD PTR [ebp-0x10],0x1000
  413f2a:	75 07                	jne    0x413f33
  413f2c:	c6 05 9d 56 89 00 01 	mov    BYTE PTR ds:0x89569d,0x1
  413f33:	bb 01 00 00 00       	mov    ebx,0x1
  413f38:	89 1d 2c 9c 59 00    	mov    DWORD PTR ds:0x599c2c,ebx
  413f3e:	8b c3                	mov    eax,ebx
  413f40:	8b 4d f4             	mov    ecx,DWORD PTR [ebp-0xc]
  413f43:	64 89 0d 00 00 00 00 	mov    DWORD PTR fs:0x0,ecx
  413f4a:	5f                   	pop    edi
  413f4b:	5e                   	pop    esi
  413f4c:	5b                   	pop    ebx
  413f4d:	8b e5                	mov    esp,ebp
  413f4f:	5d                   	pop    ebp
  413f50:	c3                   	ret
  413f51:	a1 38 9c 59 00       	mov    eax,ds:0x599c38
  413f56:	50                   	push   eax
  413f57:	e8 f4 6d 14 00       	call   0x55ad50
  413f5c:	c7 05 38 9c 59 00 00 	mov    DWORD PTR ds:0x599c38,0x0
  413f63:	00 00 00 
  413f66:	83 c4 04             	add    esp,0x4
  413f69:	eb d3                	jmp    0x413f3e
  413f6b:	b8 70 4e 59 00       	mov    eax,0x594e70
  413f70:	e9 7b 78 14 00       	jmp    0x55b7f0
  413f75:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  413f78:	50                   	push   eax
  413f79:	e8 d2 6d 14 00       	call   0x55ad50
  413f7e:	83 c4 04             	add    esp,0x4
  413f81:	c3                   	ret
