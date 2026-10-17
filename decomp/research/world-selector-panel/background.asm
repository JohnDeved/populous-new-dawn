
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0041fb20 <.text+0x1eb20>:
  41fb20:	83 ec 04             	sub    esp,0x4
  41fb23:	83 3d 3c bc 59 00 00 	cmp    DWORD PTR ds:0x59bc3c,0x0
  41fb2a:	74 42                	je     0x41fb6e
  41fb2c:	c7 05 3c bc 59 00 00 	mov    DWORD PTR ds:0x59bc3c,0x0
  41fb33:	00 00 00 
  41fb36:	e8 c5 36 08 00       	call   0x4a3200
  41fb3b:	e8 e0 41 08 00       	call   0x4a3d20
  41fb40:	68 6c bd 59 00       	push   0x59bd6c
  41fb45:	68 23 cd 89 00       	push   0x89cd23
  41fb4a:	e8 61 06 0e 00       	call   0x5001b0
  41fb4f:	8d 44 24 08          	lea    eax,[esp+0x8]
  41fb53:	83 c4 08             	add    esp,0x8
  41fb56:	50                   	push   eax
  41fb57:	68 00 b0 04 00       	push   0x4b000
  41fb5c:	68 70 44 60 00       	push   0x604470
  41fb61:	68 23 cd 89 00       	push   0x89cd23
  41fb66:	e8 15 64 10 00       	call   0x525f80
  41fb6b:	83 c4 10             	add    esp,0x10
  41fb6e:	c7 05 e8 c9 5f 00 20 	mov    DWORD PTR ds:0x5fc9e8,0x20
  41fb75:	00 00 00 
  41fb78:	83 c4 04             	add    esp,0x4
  41fb7b:	c3                   	ret
  41fb7c:	cc                   	int3
  41fb7d:	cc                   	int3
  41fb7e:	cc                   	int3
  41fb7f:	cc                   	int3
  41fb80:	e8 eb 94 00 00       	call   0x429070
  41fb85:	f6 05 f5 c9 5f 00 01 	test   BYTE PTR ds:0x5fc9f5,0x1
  41fb8c:	75 0e                	jne    0x41fb9c
  41fb8e:	e8 cd ea 05 00       	call   0x47e660
  41fb93:	f6 05 f5 c9 5f 00 01 	test   BYTE PTR ds:0x5fc9f5,0x1
  41fb9a:	74 05                	je     0x41fba1
  41fb9c:	e8 2f d3 00 00       	call   0x42ced0
  41fba1:	e8 ba 95 00 00       	call   0x429160
  41fba6:	e9 c5 95 00 00       	jmp    0x429170
  41fbab:	cc                   	int3
  41fbac:	cc                   	int3
  41fbad:	cc                   	int3
  41fbae:	cc                   	int3
  41fbaf:	cc                   	int3
  41fbb0:	c7 01 f8 f0 58 00    	mov    DWORD PTR [ecx],0x58f0f8
  41fbb6:	c3                   	ret
  41fbb7:	cc                   	int3
  41fbb8:	cc                   	int3
  41fbb9:	cc                   	int3
  41fbba:	cc                   	int3
  41fbbb:	cc                   	int3
  41fbbc:	cc                   	int3
  41fbbd:	cc                   	int3
  41fbbe:	cc                   	int3
  41fbbf:	cc                   	int3
  41fbc0:	f6 44 24 04 01       	test   BYTE PTR [esp+0x4],0x1
  41fbc5:	56                   	push   esi
  41fbc6:	c7 01 f8 f0 58 00    	mov    DWORD PTR [ecx],0x58f0f8
  41fbcc:	8b f1                	mov    esi,ecx
  41fbce:	74 09                	je     0x41fbd9
  41fbd0:	56                   	push   esi
  41fbd1:	e8 7a b1 13 00       	call   0x55ad50
  41fbd6:	83 c4 04             	add    esp,0x4
  41fbd9:	8b c6                	mov    eax,esi
  41fbdb:	5e                   	pop    esi
  41fbdc:	c2 04 00             	ret    0x4
  41fbdf:	cc                   	int3
  41fbe0:	e9 eb 86 10 00       	jmp    0x5282d0
  41fbe5:	cc                   	int3
  41fbe6:	cc                   	int3
  41fbe7:	cc                   	int3
  41fbe8:	cc                   	int3
  41fbe9:	cc                   	int3
  41fbea:	cc                   	int3
  41fbeb:	cc                   	int3
  41fbec:	cc                   	int3
  41fbed:	cc                   	int3
  41fbee:	cc                   	int3
  41fbef:	cc                   	int3
  41fbf0:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  41fbf6:	55                   	push   ebp
  41fbf7:	8b ec                	mov    ebp,esp
  41fbf9:	6a ff                	push   0xffffffff
  41fbfb:	68 5a fc 41 00       	push   0x41fc5a
  41fc00:	50                   	push   eax
  41fc01:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  41fc08:	33 c0                	xor    eax,eax
  41fc0a:	83 ec 04             	sub    esp,0x4
  41fc0d:	89 4d f0             	mov    DWORD PTR [ebp-0x10],ecx
  41fc10:	89 45 fc             	mov    DWORD PTR [ebp-0x4],eax
  41fc13:	88 45 fc             	mov    BYTE PTR [ebp-0x4],al
  41fc16:	e8 31 00 00 00       	call   0x41fc4c
  41fc1b:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  41fc22:	e8 3d 00 00 00       	call   0x41fc64
  41fc27:	f6 45 08 01          	test   BYTE PTR [ebp+0x8],0x1
  41fc2b:	74 0c                	je     0x41fc39
  41fc2d:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  41fc30:	50                   	push   eax
  41fc31:	e8 1a b1 13 00       	call   0x55ad50
  41fc36:	83 c4 04             	add    esp,0x4
  41fc39:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  41fc3c:	8b 4d f4             	mov    ecx,DWORD PTR [ebp-0xc]
  41fc3f:	64                   	fs
