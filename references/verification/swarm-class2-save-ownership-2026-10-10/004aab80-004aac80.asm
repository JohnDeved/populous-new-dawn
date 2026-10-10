
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004aab80 <.text+0xa9b80>:
  4aab80:	81 ec 3c 03 00 00    	sub    esp,0x33c
  4aab86:	53                   	push   ebx
  4aab87:	56                   	push   esi
  4aab88:	57                   	push   edi
  4aab89:	55                   	push   ebp
  4aab8a:	0f be 2d f0 c6 89 00 	movsx  ebp,BYTE PTR ds:0x89c6f0
  4aab91:	bf 01 00 00 00       	mov    edi,0x1
  4aab96:	8d 44 ad 00          	lea    eax,[ebp+ebp*4+0x0]
  4aab9a:	8b 9c 24 50 03 00 00 	mov    ebx,DWORD PTR [esp+0x350]
  4aaba1:	8d 4c 45 00          	lea    ecx,[ebp+eax*2+0x0]
  4aaba5:	8d 14 c9             	lea    edx,[ecx+ecx*8]
  4aaba8:	8d 44 d5 00          	lea    eax,[ebp+edx*8+0x0]
  4aabac:	8d 53 f3             	lea    edx,[ebx-0xd]
  4aabaf:	81 fa c1 00 00 00    	cmp    edx,0xc1
  4aabb5:	8d b4 85 c8 d1 89 00 	lea    esi,[ebp+eax*4+0x89d1c8]
  4aabbc:	8d 44 85 00          	lea    eax,[ebp+eax*4+0x0]
  4aabc0:	77 0f                	ja     0x4aabd1
  4aabc2:	33 c9                	xor    ecx,ecx
  4aabc4:	8a 8a 40 d7 4a 00    	mov    cl,BYTE PTR [edx+0x4ad740]
  4aabca:	ff 24 8d c4 d5 4a 00 	jmp    DWORD PTR [ecx*4+0x4ad5c4]
  4aabd1:	33 ff                	xor    edi,edi
  4aabd3:	e9 0a 10 00 00       	jmp    0x4abbe2
  4aabd8:	6a 00                	push   0x0
  4aabda:	6a 00                	push   0x0
  4aabdc:	6a 01                	push   0x1
  4aabde:	e8 1d f3 fc ff       	call   0x479f00
  4aabe3:	83 c4 0c             	add    esp,0xc
  4aabe6:	e9 f7 0f 00 00       	jmp    0x4abbe2
  4aabeb:	6a 00                	push   0x0
  4aabed:	6a 01                	push   0x1
  4aabef:	6a 01                	push   0x1
  4aabf1:	e8 0a f3 fc ff       	call   0x479f00
  4aabf6:	83 c4 0c             	add    esp,0xc
  4aabf9:	e9 e4 0f 00 00       	jmp    0x4abbe2
  4aabfe:	80 3d e7 c6 89 00 04 	cmp    BYTE PTR ds:0x89c6e7,0x4
  4aac05:	0f 84 d7 0f 00 00    	je     0x4abbe2
  4aac0b:	6a 02                	push   0x2
  4aac0d:	e8 5e 67 fa ff       	call   0x451370
  4aac12:	83 c4 04             	add    esp,0x4
  4aac15:	85 c0                	test   eax,eax
  4aac17:	0f 85 c5 0f 00 00    	jne    0x4abbe2
  4aac1d:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  4aac24:	6a 00                	push   0x0
  4aac26:	74 17                	je     0x4aac3f
  4aac28:	6a 00                	push   0x0
  4aac2a:	a0 f0 c6 89 00       	mov    al,ds:0x89c6f0
  4aac2f:	6a 1d                	push   0x1d
  4aac31:	50                   	push   eax
  4aac32:	e8 b9 f0 fc ff       	call   0x479cf0
  4aac37:	83 c4 10             	add    esp,0x10
  4aac3a:	e9 a3 0f 00 00       	jmp    0x4abbe2
  4aac3f:	55                   	push   ebp
  4aac40:	6a 05                	push   0x5
  4aac42:	e8 b9 f2 fc ff       	call   0x479f00
  4aac47:	83 c4 0c             	add    esp,0xc
  4aac4a:	e9 93 0f 00 00       	jmp    0x4abbe2
  4aac4f:	80 3d e7 c6 89 00 04 	cmp    BYTE PTR ds:0x89c6e7,0x4
  4aac56:	0f 84 86 0f 00 00    	je     0x4abbe2
  4aac5c:	6a 02                	push   0x2
  4aac5e:	e8 0d 67 fa ff       	call   0x451370
  4aac63:	83 c4 04             	add    esp,0x4
  4aac66:	85 c0                	test   eax,eax
  4aac68:	0f 85 74 0f 00 00    	jne    0x4abbe2
  4aac6e:	6a 00                	push   0x0
  4aac70:	a0 f0 c6 89 00       	mov    al,ds:0x89c6f0
  4aac75:	6a 00                	push   0x0
  4aac77:	6a 1f                	push   0x1f
  4aac79:	50                   	push   eax
  4aac7a:	e8 71 f0 fc ff       	call   0x479cf0
  4aac7f:	83                   	.byte 0x83
