
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0057a9a0 <.text+0x1799a0>:
  57a9a0:	83 ec 0c             	sub    esp,0xc
  57a9a3:	53                   	push   ebx
  57a9a4:	55                   	push   ebp
  57a9a5:	56                   	push   esi
  57a9a6:	8b 31                	mov    esi,DWORD PTR [ecx]
  57a9a8:	57                   	push   edi
  57a9a9:	8b 06                	mov    eax,DWORD PTR [esi]
  57a9ab:	8b 48 04             	mov    ecx,DWORD PTR [eax+0x4]
  57a9ae:	81 e1 00 00 03 00    	and    ecx,0x30000
  57a9b4:	81 f9 00 00 03 00    	cmp    ecx,0x30000
  57a9ba:	75 14                	jne    0x57a9d0
  57a9bc:	8b 90 a8 00 00 00    	mov    edx,DWORD PTR [eax+0xa8]
  57a9c2:	52                   	push   edx
  57a9c3:	ff 15 70 c6 d0 00    	call   DWORD PTR ds:0xd0c670
  57a9c9:	50                   	push   eax
  57a9ca:	ff 15 78 c6 d0 00    	call   DWORD PTR ds:0xd0c678
  57a9d0:	8b ce                	mov    ecx,esi
  57a9d2:	e8 09 04 00 00       	call   0x57ade0
  57a9d7:	8b ce                	mov    ecx,esi
  57a9d9:	e8 c2 35 00 00       	call   0x57dfa0
  57a9de:	85 c0                	test   eax,eax
  57a9e0:	0f 85 76 02 00 00    	jne    0x57ac5c
  57a9e6:	8b 06                	mov    eax,DWORD PTR [esi]
  57a9e8:	6a 01                	push   0x1
  57a9ea:	c7 80 98 00 00 00 00 	mov    DWORD PTR [eax+0x98],0x0
  57a9f1:	00 00 00 
  57a9f4:	8b 0e                	mov    ecx,DWORD PTR [esi]
  57a9f6:	81 c1 9c 00 00 00    	add    ecx,0x9c
  57a9fc:	51                   	push   ecx
  57a9fd:	ff 15 24 c7 d0 00    	call   DWORD PTR ds:0xd0c724
  57aa03:	ff 15 84 c7 d0 00    	call   DWORD PTR ds:0xd0c784
  57aa09:	8b 2d e0 c6 d0 00    	mov    ebp,DWORD PTR ds:0xd0c6e0
  57aa0f:	89 86 10 06 00 00    	mov    DWORD PTR [esi+0x610],eax
  57aa15:	8b 16                	mov    edx,DWORD PTR [esi]
  57aa17:	6a 02                	push   0x2
  57aa19:	81 c2 9c 00 00 00    	add    edx,0x9c
  57aa1f:	52                   	push   edx
  57aa20:	ff 15 24 c7 d0 00    	call   DWORD PTR ds:0xd0c724
  57aa26:	8b f8                	mov    edi,eax
  57aa28:	8b 86 7c 03 00 00    	mov    eax,DWORD PTR [esi+0x37c]
  57aa2e:	99                   	cdq
  57aa2f:	b9 18 00 00 00       	mov    ecx,0x18
  57aa34:	f7 f9                	idiv   ecx
  57aa36:	c1 e2 04             	shl    edx,0x4
  57aa39:	83 ff 03             	cmp    edi,0x3
  57aa3c:	8d 9c 32 e8 01 00 00 	lea    ebx,[edx+esi*1+0x1e8]
  57aa43:	75 3b                	jne    0x57aa80
  57aa45:	8b 16                	mov    edx,DWORD PTR [esi]
  57aa47:	57                   	push   edi
  57aa48:	81 c2 9c 00 00 00    	add    edx,0x9c
  57aa4e:	52                   	push   edx
  57aa4f:	ff 15 24 c7 d0 00    	call   DWORD PTR ds:0xd0c724
  57aa55:	6a 14                	push   0x14
  57aa57:	ff d5                	call   ebp
  57aa59:	8b 06                	mov    eax,DWORD PTR [esi]
  57aa5b:	05 9c 00 00 00       	add    eax,0x9c
  57aa60:	6a 03                	push   0x3
  57aa62:	50                   	push   eax
  57aa63:	ff 15 24 c7 d0 00    	call   DWORD PTR ds:0xd0c724
  57aa69:	8b f8                	mov    edi,eax
  57aa6b:	83 ff 03             	cmp    edi,0x3
  57aa6e:	74 e5                	je     0x57aa55
  57aa70:	8b 0e                	mov    ecx,DWORD PTR [esi]
  57aa72:	57                   	push   edi
  57aa73:	81 c1 9c 00 00 00    	add    ecx,0x9c
  57aa79:	51                   	push   ecx
  57aa7a:	ff 15 24 c7 d0 00    	call   DWORD PTR ds:0xd0c724
  57aa80:	83 ff 04             	cmp    edi,0x4
  57aa83:	0f 84 c0 01 00 00    	je     0x57ac49
  57aa89:	83 ff 02             	cmp    edi,0x2
  57aa8c:	75 87                	jne    0x57aa15
  57aa8e:	33 ff                	xor    edi,edi
  57aa90:	57                   	push   edi
  57aa91:	ff d5                	call   ebp
  57aa93:	8b ce                	mov    ecx,esi
  57aa95:	e8 f6 01 00 00       	call   0x57ac90
  57aa9a:	39 be 68 03 00 00    	cmp    DWORD PTR [esi+0x368],edi
  57aaa0:	75 17                	jne    0x57aab9
  57aaa2:	8b 16                	mov    edx,DWORD PTR [esi]
  57aaa4:	39 ba 84 00 00 00    	cmp    DWORD PTR [edx+0x84],edi
  57aaaa:	74 0d                	je     0x57aab9
  57aaac:	8b ce                	mov    ecx,esi
  57aaae:	e8 2d 37 00 00       	call   0x57e1e0
  57aab3:	89 be 94 03 00 00    	mov    DWORD PTR [esi+0x394],edi
  57aab9:	39 3b                	cmp    DWORD PTR [ebx],edi
  57aabb:	0f 84 82 00 00 00    	je     0x57ab43
  57aac1:	8b 06                	mov    eax,DWORD PTR [esi]
  57aac3:	83 b8 98 00 00 00 02 	cmp    DWORD PTR [eax+0x98],0x2
  57aaca:	7f 12                	jg     0x57aade
  57aacc:	8b d3                	mov    edx,ebx
  57aace:	8b ce                	mov    ecx,esi
  57aad0:	e8 0b 17 00 00       	call   0x57c1e0
  57aad5:	8b ce                	mov    ecx,esi
  57aad7:	e8 64 03 00 00       	call   0x57ae40
  57aadc:	eb 20                	jmp    0x57aafe
  57aade:	8b 43 0c             	mov    eax,DWORD PTR [ebx+0xc]
  57aae1:	83 f8 02             	cmp    eax,0x2
  57aae4:	74 0f                	je     0x57aaf5
  57aae6:	83 f8 01             	cmp    eax,0x1
  57aae9:	74 0a                	je     0x57aaf5
  57aaeb:	83 f8 06             	cmp    eax,0x6
  57aaee:	74 05                	je     0x57aaf5
  57aaf0:	83 f8 05             	cmp    eax,0x5
  57aaf3:	75 09                	jne    0x57aafe
  57aaf5:	8b d3                	mov    edx,ebx
  57aaf7:	8b ce                	mov    ecx,esi
  57aaf9:	e8 e2 16 00 00       	call   0x57c1e0
  57aafe:	8b 06                	mov    eax,DWORD PTR [esi]
  57ab00:	f7 40 04 00 00 04 00 	test   DWORD PTR [eax+0x4],0x40000
  57ab07:	74 14                	je     0x57ab1d
  57ab09:	8b 80 b0 00 00 00    	mov    eax,DWORD PTR [eax+0xb0]
  57ab0f:	3b c7                	cmp    eax,edi
  57ab11:	74 0a                	je     0x57ab1d
  57ab13:	ff d0                	call   eax
  57ab15:	85 c0                	test   eax,eax
  57ab17:	0f 85 2c 01 00 00    	jne    0x57ac49
  57ab1d:	8d 86 7c 03 00 00    	lea    eax,[esi+0x37c]
  57ab23:	89 3b                	mov    DWORD PTR [ebx],edi
  57ab25:	50                   	push   eax
  57ab26:	89 7b 04             	mov    DWORD PTR [ebx+0x4],edi
  57ab29:	ff 15 b8 c6 d0 00    	call   DWORD PTR ds:0xd0c6b8
  57ab2f:	8d 8e 84 03 00 00    	lea    ecx,[esi+0x384]
  57ab35:	51                   	push   ecx
  57ab36:	ff 15 b4 c6 d0 00    	call   DWORD PTR ds:0xd0c6b4
  57ab3c:	8b ce                	mov    ecx,esi
  57ab3e:	e8 7d 08 00 00       	call   0x57b3c0
  57ab43:	8b 16                	mov    edx,DWORD PTR [esi]
  57ab45:	81 c2 94 00 00 00    	add    edx,0x94
  57ab4b:	52                   	push   edx
  57ab4c:	ff 15 b8 c6 d0 00    	call   DWORD PTR ds:0xd0c6b8
  57ab52:	39 be 84 03 00 00    	cmp    DWORD PTR [esi+0x384],edi
  57ab58:	75 59                	jne    0x57abb3
  57ab5a:	8b 06                	mov    eax,DWORD PTR [esi]
  57ab5c:	39 b8 84 00 00 00    	cmp    DWORD PTR [eax+0x84],edi
  57ab62:	0f 84 e1 00 00 00    	je     0x57ac49
  57ab68:	f7 40 04 00 00 80 00 	test   DWORD PTR [eax+0x4],0x800000
  57ab6f:	0f 84 d4 00 00 00    	je     0x57ac49
  57ab75:	39 be 88 03 00 00    	cmp    DWORD PTR [esi+0x388],edi
  57ab7b:	75 36                	jne    0x57abb3
  57ab7d:	8b 40 5c             	mov    eax,DWORD PTR [eax+0x5c]
  57ab80:	3b c7                	cmp    eax,edi
  57ab82:	0f 84 c1 00 00 00    	je     0x57ac49
  57ab88:	8b 08                	mov    ecx,DWORD PTR [eax]
  57ab8a:	8d 54 24 18          	lea    edx,[esp+0x18]
  57ab8e:	52                   	push   edx
  57ab8f:	50                   	push   eax
  57ab90:	ff 51 24             	call   DWORD PTR [ecx+0x24]
  57ab93:	f6 44 24 18 04       	test   BYTE PTR [esp+0x18],0x4
  57ab98:	74 0e                	je     0x57aba8
  57ab9a:	8b 06                	mov    eax,DWORD PTR [esi]
  57ab9c:	57                   	push   edi
  57ab9d:	57                   	push   edi
  57ab9e:	57                   	push   edi
  57ab9f:	8b 40 5c             	mov    eax,DWORD PTR [eax+0x5c]
  57aba2:	50                   	push   eax
  57aba3:	8b 08                	mov    ecx,DWORD PTR [eax]
  57aba5:	ff 51 30             	call   DWORD PTR [ecx+0x30]
  57aba8:	f6 44 24 18 01       	test   BYTE PTR [esp+0x18],0x1
  57abad:	0f 84 96 00 00 00    	je     0x57ac49
  57abb3:	8b 06                	mov    eax,DWORD PTR [esi]
  57abb5:	39 b8 84 00 00 00    	cmp    DWORD PTR [eax+0x84],edi
  57abbb:	0f 84 54 fe ff ff    	je     0x57aa15
  57abc1:	8b 96 94 03 00 00    	mov    edx,DWORD PTR [esi+0x394]
  57abc7:	33 ff                	xor    edi,edi
  57abc9:	83 ea 09             	sub    edx,0x9
  57abcc:	89 54 24 10          	mov    DWORD PTR [esp+0x10],edx
  57abd0:	8b 80 94 00 00 00    	mov    eax,DWORD PTR [eax+0x94]
  57abd6:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  57abda:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  57abde:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  57abe2:	2b d1                	sub    edx,ecx
  57abe4:	83 fa 01             	cmp    edx,0x1
  57abe7:	7c 2f                	jl     0x57ac18
  57abe9:	6a 00                	push   0x0
  57abeb:	ff d5                	call   ebp
  57abed:	6a 02                	push   0x2
  57abef:	ff d5                	call   ebp
  57abf1:	8b 86 94 03 00 00    	mov    eax,DWORD PTR [esi+0x394]
  57abf7:	8b cf                	mov    ecx,edi
  57abf9:	83 e8 09             	sub    eax,0x9
  57abfc:	47                   	inc    edi
  57abfd:	81 f9 96 00 00 00    	cmp    ecx,0x96
  57ac03:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  57ac07:	7f 0f                	jg     0x57ac18
  57ac09:	8b 54 24 10          	mov    edx,DWORD PTR [esp+0x10]
  57ac0d:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  57ac11:	2b c2                	sub    eax,edx
  57ac13:	83 f8 01             	cmp    eax,0x1
  57ac16:	7d d1                	jge    0x57abe9
  57ac18:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  57ac1c:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  57ac20:	8b 06                	mov    eax,DWORD PTR [esi]
  57ac22:	2b ca                	sub    ecx,edx
  57ac24:	89 88 98 00 00 00    	mov    DWORD PTR [eax+0x98],ecx
  57ac2a:	8b 06                	mov    eax,DWORD PTR [esi]
  57ac2c:	8b 88 98 00 00 00    	mov    ecx,DWORD PTR [eax+0x98]
  57ac32:	85 c9                	test   ecx,ecx
  57ac34:	0f 8d db fd ff ff    	jge    0x57aa15
  57ac3a:	c7 80 98 00 00 00 00 	mov    DWORD PTR [eax+0x98],0x0
  57ac41:	00 00 00 
  57ac44:	e9 cc fd ff ff       	jmp    0x57aa15
  57ac49:	ff 15 84 c7 d0 00    	call   DWORD PTR ds:0xd0c784
  57ac4f:	8b ce                	mov    ecx,esi
  57ac51:	89 86 14 06 00 00    	mov    DWORD PTR [esi+0x614],eax
  57ac57:	e8 84 33 00 00       	call   0x57dfe0
  57ac5c:	8b ce                	mov    ecx,esi
  57ac5e:	e8 ed 36 00 00       	call   0x57e350
  57ac63:	8b ce                	mov    ecx,esi
  57ac65:	e8 86 01 00 00       	call   0x57adf0
  57ac6a:	8b 0e                	mov    ecx,DWORD PTR [esi]
  57ac6c:	81 c1 9c 00 00 00    	add    ecx,0x9c
  57ac72:	6a 05                	push   0x5
  57ac74:	51                   	push   ecx
  57ac75:	ff 15 24 c7 d0 00    	call   DWORD PTR ds:0xd0c724
  57ac7b:	5f                   	pop    edi
  57ac7c:	5e                   	pop    esi
  57ac7d:	5d                   	pop    ebp
  57ac7e:	5b                   	pop    ebx
  57ac7f:	83 c4 0c             	add    esp,0xc
  57ac82:	c3                   	ret
