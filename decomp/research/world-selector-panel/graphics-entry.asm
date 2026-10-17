
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004288b0 <.text+0x278b0>:
  4288b0:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  4288b6:	55                   	push   ebp
  4288b7:	8b ec                	mov    ebp,esp
  4288b9:	6a ff                	push   0xffffffff
  4288bb:	68 88 8a 42 00       	push   0x428a88
  4288c0:	50                   	push   eax
  4288c1:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  4288c8:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4288ce:	83 ec 08             	sub    esp,0x8
  4288d1:	53                   	push   ebx
  4288d2:	56                   	push   esi
  4288d3:	57                   	push   edi
  4288d4:	e8 07 99 0f 00       	call   0x5221e0
  4288d9:	6a 00                	push   0x0
  4288db:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  4288e1:	e8 1a 98 0f 00       	call   0x522100
  4288e6:	83 3d f4 c1 59 00 00 	cmp    DWORD PTR ds:0x59c1f4,0x0
  4288ed:	0f 85 7f 01 00 00    	jne    0x428a72
  4288f3:	68 50 ad 65 00       	push   0x65ad50
  4288f8:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  4288fd:	c7 05 f4 c1 59 00 01 	mov    DWORD PTR ds:0x59c1f4,0x1
  428904:	00 00 00 
  428907:	8b 88 a8 1d 00 00    	mov    ecx,DWORD PTR [eax+0x1da8]
  42890d:	51                   	push   ecx
  42890e:	6a 00                	push   0x0
  428910:	6a 00                	push   0x0
  428912:	68 b4 c3 59 00       	push   0x59c3b4
  428917:	e8 24 d6 08 00       	call   0x4b5f40
  42891c:	83 c4 14             	add    esp,0x14
  42891f:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  428925:	68 d8 92 67 00       	push   0x6792d8
  42892a:	8b 91 a0 1d 00 00    	mov    edx,DWORD PTR [ecx+0x1da0]
  428930:	52                   	push   edx
  428931:	6a 00                	push   0x0
  428933:	6a 00                	push   0x0
  428935:	68 a0 c3 59 00       	push   0x59c3a0
  42893a:	e8 01 d6 08 00       	call   0x4b5f40
  42893f:	83 c4 14             	add    esp,0x14
  428942:	8b 0d f4 c2 af 00    	mov    ecx,DWORD PTR ds:0xafc2f4
  428948:	68 c8 c9 65 00       	push   0x65c9c8
  42894d:	8b 91 a8 1d 00 00    	mov    edx,DWORD PTR [ecx+0x1da8]
  428953:	52                   	push   edx
  428954:	6a 00                	push   0x0
  428956:	6a 00                	push   0x0
  428958:	68 8c c3 59 00       	push   0x59c38c
  42895d:	e8 de d5 08 00       	call   0x4b5f40
  428962:	83 c4 14             	add    esp,0x14
  428965:	8b 3d b8 13 5f 00    	mov    edi,DWORD PTR ds:0x5f13b8
  42896b:	8d 04 fd 00 00 00 00 	lea    eax,[edi*8+0x0]
  428972:	2b c7                	sub    eax,edi
  428974:	c1 e0 04             	shl    eax,0x4
  428977:	50                   	push   eax
  428978:	e8 23 23 13 00       	call   0x55aca0
  42897d:	89 45 ec             	mov    DWORD PTR [ebp-0x14],eax
  428980:	83 c4 04             	add    esp,0x4
  428983:	c7 45 fc 00 00 00 00 	mov    DWORD PTR [ebp-0x4],0x0
  42898a:	8b f0                	mov    esi,eax
  42898c:	85 f6                	test   esi,esi
  42898e:	74 16                	je     0x4289a6
  428990:	8b de                	mov    ebx,esi
  428992:	4f                   	dec    edi
  428993:	78 0d                	js     0x4289a2
  428995:	8b cb                	mov    ecx,ebx
  428997:	83 c3 70             	add    ebx,0x70
  42899a:	e8 01 01 00 00       	call   0x428aa0
  42899f:	4f                   	dec    edi
  4289a0:	79 f3                	jns    0x428995
  4289a2:	8b c6                	mov    eax,esi
  4289a4:	eb 02                	jmp    0x4289a8
  4289a6:	33 c0                	xor    eax,eax
  4289a8:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  4289af:	33 ff                	xor    edi,edi
  4289b1:	a3 fc c1 59 00       	mov    ds:0x59c1fc,eax
  4289b6:	89 7d f0             	mov    DWORD PTR [ebp-0x10],edi
  4289b9:	39 3d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,edi
  4289bf:	7e 4b                	jle    0x428a0c
  4289c1:	bb 64 cd 72 00       	mov    ebx,0x72cd64
  4289c6:	33 f6                	xor    esi,esi
  4289c8:	a1 fc c1 59 00       	mov    eax,ds:0x59c1fc
  4289cd:	8b 0d bc 13 5f 00    	mov    ecx,DWORD PTR ds:0x5f13bc
  4289d3:	03 c6                	add    eax,esi
  4289d5:	83 c3 64             	add    ebx,0x64
  4289d8:	8b 54 39 28          	mov    edx,DWORD PTR [ecx+edi*1+0x28]
  4289dc:	50                   	push   eax
  4289dd:	68 00 01 00 00       	push   0x100
  4289e2:	83 c7 34             	add    edi,0x34
  4289e5:	52                   	push   edx
  4289e6:	83 c6 70             	add    esi,0x70
  4289e9:	e8 a2 01 00 00       	call   0x428b90
  4289ee:	83 c4 0c             	add    esp,0xc
  4289f1:	8b 0d fc c1 59 00    	mov    ecx,DWORD PTR ds:0x59c1fc
  4289f7:	ff 45 f0             	inc    DWORD PTR [ebp-0x10]
  4289fa:	8b 54 31 d0          	mov    edx,DWORD PTR [ecx+esi*1-0x30]
  4289fe:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  428a01:	89 53 9c             	mov    DWORD PTR [ebx-0x64],edx
  428a04:	39 05 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,eax
  428a0a:	7f bc                	jg     0x4289c8
  428a0c:	68 74 c3 59 00       	push   0x59c374
  428a11:	e8 ba ea 02 00       	call   0x4574d0
  428a16:	83 c4 04             	add    esp,0x4
  428a19:	e8 52 04 00 00       	call   0x428e70
  428a1e:	8b f0                	mov    esi,eax
  428a20:	85 f6                	test   esi,esi
  428a22:	7d 40                	jge    0x428a64
  428a24:	68 5c c3 59 00       	push   0x59c35c
  428a29:	e8 a2 ea 02 00       	call   0x4574d0
  428a2e:	83 c4 04             	add    esp,0x4
  428a31:	85 f6                	test   esi,esi
  428a33:	7d 0e                	jge    0x428a43
  428a35:	56                   	push   esi
  428a36:	68 44 c3 59 00       	push   0x59c344
  428a3b:	e8 90 ea 02 00       	call   0x4574d0
  428a40:	83 c4 08             	add    esp,0x8
  428a43:	68 38 c3 59 00       	push   0x59c338
  428a48:	e8 83 ea 02 00       	call   0x4574d0
  428a4d:	83 c4 04             	add    esp,0x4
  428a50:	56                   	push   esi
  428a51:	e8 4a be 08 00       	call   0x4b48a0
  428a56:	83 c4 04             	add    esp,0x4
  428a59:	33 c0                	xor    eax,eax
  428a5b:	c6 05 f2 c6 89 00 01 	mov    BYTE PTR ds:0x89c6f2,0x1
  428a62:	eb 13                	jmp    0x428a77
  428a64:	e8 a7 a7 06 00       	call   0x493210
  428a69:	85 c0                	test   eax,eax
  428a6b:	74 05                	je     0x428a72
  428a6d:	e8 7e c4 02 00       	call   0x454ef0
  428a72:	b8 01 00 00 00       	mov    eax,0x1
  428a77:	8b 4d f4             	mov    ecx,DWORD PTR [ebp-0xc]
  428a7a:	5f                   	pop    edi
  428a7b:	64 89 0d 00 00 00 00 	mov    DWORD PTR fs:0x0,ecx
  428a82:	5e                   	pop    esi
  428a83:	5b                   	pop    ebx
  428a84:	8b e5                	mov    esp,ebp
  428a86:	5d                   	pop    ebp
  428a87:	c3                   	ret
  428a88:	b8 a0 4f 59 00       	mov    eax,0x594fa0
  428a8d:	e9 5e 2d 13 00       	jmp    0x55b7f0
  428a92:	8b 45 ec             	mov    eax,DWORD PTR [ebp-0x14]
  428a95:	50                   	push   eax
  428a96:	e8 b5 22 13 00       	call   0x55ad50
  428a9b:	83 c4 04             	add    esp,0x4
  428a9e:	c3                   	ret
  428a9f:	cc                   	int3
  428aa0:	56                   	push   esi
  428aa1:	c7 01 90 f1 58 00    	mov    DWORD PTR [ecx],0x58f190
  428aa7:	8b f1                	mov    esi,ecx
  428aa9:	e8 92 09 0e 00       	call   0x509440
  428aae:	8b ce                	mov    ecx,esi
  428ab0:	c7 06 88 f1 58 00    	mov    DWORD PTR [esi],0x58f188
  428ab6:	e8 45 10 0e 00       	call   0x509b00
  428abb:	8b c6                	mov    eax,esi
  428abd:	5e                   	pop    esi
  428abe:	c3                   	ret
  428abf:	cc                   	int3
