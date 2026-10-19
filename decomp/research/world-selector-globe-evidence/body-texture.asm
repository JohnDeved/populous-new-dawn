
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

00428aa0 <.text+0x27aa0>:
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
  428ac0:	83 3d f4 c1 59 00 00 	cmp    DWORD PTR ds:0x59c1f4,0x0
  428ac7:	56                   	push   esi
  428ac8:	57                   	push   edi
  428ac9:	0f 84 b3 00 00 00    	je     0x428b82
  428acf:	e8 3c a7 06 00       	call   0x493210
  428ad4:	85 c0                	test   eax,eax
  428ad6:	74 05                	je     0x428add
  428ad8:	e8 63 c4 02 00       	call   0x454f40
  428add:	be 68 a4 67 00       	mov    esi,0x67a468
  428ae2:	e8 f9 62 05 00       	call   0x47ede0
  428ae7:	8b ce                	mov    ecx,esi
  428ae9:	83 ee 60             	sub    esi,0x60
  428aec:	e8 0f da 04 00       	call   0x476500
  428af1:	81 fe 48 a3 67 00    	cmp    esi,0x67a348
  428af7:	73 ee                	jae    0x428ae7
  428af9:	b9 38 ca 65 00       	mov    ecx,0x65ca38
  428afe:	e8 cd 7a 03 00       	call   0x4605d0
  428b03:	8b 35 00 c2 59 00    	mov    esi,DWORD PTR ds:0x59c200
  428b09:	85 f6                	test   esi,esi
  428b0b:	74 10                	je     0x428b1d
  428b0d:	8b ce                	mov    ecx,esi
  428b0f:	e8 dc de 04 00       	call   0x4769f0
  428b14:	56                   	push   esi
  428b15:	e8 36 22 13 00       	call   0x55ad50
  428b1a:	83 c4 04             	add    esp,0x4
  428b1d:	33 f6                	xor    esi,esi
  428b1f:	33 ff                	xor    edi,edi
  428b21:	89 35 00 c2 59 00    	mov    DWORD PTR ds:0x59c200,esi
  428b27:	39 35 b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,esi
  428b2d:	7e 19                	jle    0x428b48
  428b2f:	8b 0d fc c1 59 00    	mov    ecx,DWORD PTR ds:0x59c1fc
  428b35:	47                   	inc    edi
  428b36:	03 ce                	add    ecx,esi
  428b38:	83 c6 70             	add    esi,0x70
  428b3b:	8b 01                	mov    eax,DWORD PTR [ecx]
  428b3d:	ff 50 04             	call   DWORD PTR [eax+0x4]
  428b40:	39 3d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,edi
  428b46:	7f e7                	jg     0x428b2f
  428b48:	a1 fc c1 59 00       	mov    eax,ds:0x59c1fc
  428b4d:	33 f6                	xor    esi,esi
  428b4f:	50                   	push   eax
  428b50:	e8 fb 21 13 00       	call   0x55ad50
  428b55:	83 c4 04             	add    esp,0x4
  428b58:	b9 c8 c9 65 00       	mov    ecx,0x65c9c8
  428b5d:	89 35 fc c1 59 00    	mov    DWORD PTR ds:0x59c1fc,esi
  428b63:	e8 d8 0e 0e 00       	call   0x509a40
  428b68:	b9 d8 92 67 00       	mov    ecx,0x6792d8
  428b6d:	e8 ce 0e 0e 00       	call   0x509a40
  428b72:	b9 50 ad 65 00       	mov    ecx,0x65ad50
  428b77:	e8 c4 0e 0e 00       	call   0x509a40
  428b7c:	89 35 f4 c1 59 00    	mov    DWORD PTR ds:0x59c1f4,esi
  428b82:	5f                   	pop    edi
  428b83:	5e                   	pop    esi
  428b84:	c3                   	ret
  428b85:	cc                   	int3
  428b86:	cc                   	int3
  428b87:	cc                   	int3
  428b88:	cc                   	int3
  428b89:	cc                   	int3
  428b8a:	cc                   	int3
  428b8b:	cc                   	int3
  428b8c:	cc                   	int3
  428b8d:	cc                   	int3
  428b8e:	cc                   	int3
  428b8f:	cc                   	int3
  428b90:	81 ec 10 06 00 00    	sub    esp,0x610
  428b96:	53                   	push   ebx
  428b97:	56                   	push   esi
  428b98:	57                   	push   edi
  428b99:	55                   	push   ebp
  428b9a:	68 00 00 04 00       	push   0x40000
  428b9f:	e8 fc 20 13 00       	call   0x55aca0
  428ba4:	8d 4c 24 68          	lea    ecx,[esp+0x68]
  428ba8:	8d 54 24 64          	lea    edx,[esp+0x64]
  428bac:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  428bb0:	83 c4 04             	add    esp,0x4
  428bb3:	8d 44 24 14          	lea    eax,[esp+0x14]
  428bb7:	8b b4 24 24 06 00 00 	mov    esi,DWORD PTR [esp+0x624]
  428bbe:	50                   	push   eax
  428bbf:	51                   	push   ecx
  428bc0:	8d 84 24 28 01 00 00 	lea    eax,[esp+0x128]
  428bc7:	52                   	push   edx
  428bc8:	50                   	push   eax
  428bc9:	56                   	push   esi
  428bca:	e8 21 c7 05 00       	call   0x4852f0
  428bcf:	83 c4 14             	add    esp,0x14
  428bd2:	85 c0                	test   eax,eax
  428bd4:	75 08                	jne    0x428bde
  428bd6:	c7 44 24 14 01 00 00 	mov    DWORD PTR [esp+0x14],0x1
  428bdd:	00 
  428bde:	83 7c 24 14 0a       	cmp    DWORD PTR [esp+0x14],0xa
  428be3:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  428be7:	7d 04                	jge    0x428bed
  428be9:	04 30                	add    al,0x30
  428beb:	eb 02                	jmp    0x428bef
  428bed:	04 57                	add    al,0x57
  428bef:	0f be c0             	movsx  eax,al
  428bf2:	8d 8c 24 e0 00 00 00 	lea    ecx,[esp+0xe0]
  428bf9:	50                   	push   eax
  428bfa:	68 8c 9b 59 00       	push   0x599b8c
  428bff:	51                   	push   ecx
  428c00:	e8 4b 28 13 00       	call   0x55b450
  428c05:	8d 8c 24 0c 01 00 00 	lea    ecx,[esp+0x10c]
  428c0c:	83 c4 0c             	add    esp,0xc
  428c0f:	56                   	push   esi
  428c10:	68 50 9b 59 00       	push   0x599b50
  428c15:	51                   	push   ecx
  428c16:	e8 35 28 13 00       	call   0x55b450
  428c1b:	83 c4 0c             	add    esp,0xc
  428c1e:	e8 dd a5 07 00       	call   0x4a3200
  428c23:	e8 f8 b0 07 00       	call   0x4a3d20
  428c28:	8d 8c 24 e0 00 00 00 	lea    ecx,[esp+0xe0]
  428c2f:	51                   	push   ecx
  428c30:	68 23 cd 89 00       	push   0x89cd23
  428c35:	e8 76 75 0d 00       	call   0x5001b0
  428c3a:	8d 4c 24 2c          	lea    ecx,[esp+0x2c]
  428c3e:	8d 94 24 28 02 00 00 	lea    edx,[esp+0x228]
  428c45:	83 c4 08             	add    esp,0x8
  428c48:	51                   	push   ecx
  428c49:	68 00 04 00 00       	push   0x400
  428c4e:	52                   	push   edx
  428c4f:	68 23 cd 89 00       	push   0x89cd23
  428c54:	e8 27 d3 0f 00       	call   0x525f80
  428c59:	83 c4 10             	add    esp,0x10
  428c5c:	e8 9f a5 07 00       	call   0x4a3200
  428c61:	e8 ba b0 07 00       	call   0x4a3d20
  428c66:	8d 8c 24 00 01 00 00 	lea    ecx,[esp+0x100]
  428c6d:	51                   	push   ecx
  428c6e:	68 23 cd 89 00       	push   0x89cd23
  428c73:	e8 38 75 0d 00       	call   0x5001b0
  428c78:	8d 4c 24 2c          	lea    ecx,[esp+0x2c]
  428c7c:	8b 54 24 20          	mov    edx,DWORD PTR [esp+0x20]
