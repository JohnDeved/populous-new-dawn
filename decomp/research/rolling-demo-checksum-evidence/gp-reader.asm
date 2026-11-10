
/workspace/shared/populous-prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004b3a35 <.text+0xb2a35>:
  4b3a35:	f6 05 46 f7 98 00 10 	test   BYTE PTR ds:0x98f746,0x10
  4b3a3c:	0f 84 e6 02 00 00    	je     0x4b3d28
  4b3a42:	e8 a9 09 00 00       	call   0x4b43f0
  4b3a47:	83 3d 58 f6 98 00 ff 	cmp    DWORD PTR ds:0x98f658,0xffffffff
  4b3a4e:	0f 84 ef 00 00 00    	je     0x4b3b43
  4b3a54:	bf ff ff ff ff       	mov    edi,0xffffffff
  4b3a59:	39 35 58 f6 98 00    	cmp    DWORD PTR ds:0x98f658,esi
  4b3a5f:	0f 8f d1 00 00 00    	jg     0x4b3b36
  4b3a65:	32 db                	xor    bl,bl
  4b3a67:	66 83 3d 5c f6 98 00 	cmp    WORD PTR ds:0x98f65c,0x0
  4b3a6e:	00 
  4b3a6f:	74 2c                	je     0x4b3a9d
  4b3a71:	e8 aa 02 ff ff       	call   0x4a3d20
  4b3a76:	8d 44 24 2c          	lea    eax,[esp+0x2c]
  4b3a7a:	8d 54 24 18          	lea    edx,[esp+0x18]
  4b3a7e:	0f bf 0d 5c f6 98 00 	movsx  ecx,WORD PTR ds:0x98f65c
  4b3a85:	50                   	push   eax
  4b3a86:	51                   	push   ecx
  4b3a87:	52                   	push   edx
  4b3a88:	a1 50 f6 98 00       	mov    eax,ds:0x98f650
  4b3a8d:	50                   	push   eax
  4b3a8e:	e8 ed 2a 07 00       	call   0x526580
  4b3a93:	83 c4 10             	add    esp,0x10
  4b3a96:	83 f8 01             	cmp    eax,0x1
  4b3a99:	1a db                	sbb    bl,bl
  4b3a9b:	fe c3                	inc    bl
  4b3a9d:	84 db                	test   bl,bl
  4b3a9f:	75 46                	jne    0x4b3ae7
  4b3aa1:	33 c0                	xor    eax,eax
  4b3aa3:	a0 5e f6 98 00       	mov    al,ds:0x98f65e
  4b3aa8:	83 f8 01             	cmp    eax,0x1
  4b3aab:	75 40                	jne    0x4b3aed
  4b3aad:	e8 1e ff f8 ff       	call   0x4439d0
  4b3ab2:	3b 44 24 18          	cmp    eax,DWORD PTR [esp+0x18]
  4b3ab6:	74 02                	je     0x4b3aba
  4b3ab8:	b3 01                	mov    bl,0x1
  4b3aba:	8d 44 24 1c          	lea    eax,[esp+0x1c]
  4b3abe:	50                   	push   eax
  4b3abf:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4b3ac6:	8b c8                	mov    ecx,eax
  4b3ac8:	8d 14 80             	lea    edx,[eax+eax*4]
  4b3acb:	8d 04 51             	lea    eax,[ecx+edx*2]
  4b3ace:	8d 14 c0             	lea    edx,[eax+eax*8]
  4b3ad1:	8d 04 d1             	lea    eax,[ecx+edx*8]
  4b3ad4:	8d 04 81             	lea    eax,[ecx+eax*4]
  4b3ad7:	05 c8 d1 89 00       	add    eax,0x89d1c8
  4b3adc:	50                   	push   eax
  4b3add:	e8 fe ad f8 ff       	call   0x43e8e0
  4b3ae2:	83 c4 08             	add    esp,0x8
  4b3ae5:	eb 06                	jmp    0x4b3aed
  4b3ae7:	89 3d 58 f6 98 00    	mov    DWORD PTR ds:0x98f658,edi
  4b3aed:	84 db                	test   bl,bl
  4b3aef:	74 07                	je     0x4b3af8
  4b3af1:	c6 05 4f f7 98 00 08 	mov    BYTE PTR ds:0x98f74f,0x8
  4b3af8:	39 3d 58 f6 98 00    	cmp    DWORD PTR ds:0x98f658,edi
  4b3afe:	74 36                	je     0x4b3b36
  4b3b00:	e8 1b 02 ff ff       	call   0x4a3d20
  4b3b05:	8d 44 24 10          	lea    eax,[esp+0x10]
  4b3b09:	8b 0d 50 f6 98 00    	mov    ecx,DWORD PTR ds:0x98f650
  4b3b0f:	50                   	push   eax
  4b3b10:	6a 08                	push   0x8
  4b3b12:	68 58 f6 98 00       	push   0x98f658
  4b3b17:	51                   	push   ecx
  4b3b18:	e8 63 2a 07 00       	call   0x526580
  4b3b1d:	83 c4 10             	add    esp,0x10
  4b3b20:	85 c0                	test   eax,eax
  4b3b22:	74 06                	je     0x4b3b2a
  4b3b24:	89 3d 58 f6 98 00    	mov    DWORD PTR ds:0x98f658,edi
  4b3b2a:	39 3d 58 f6 98 00    	cmp    DWORD PTR ds:0x98f658,edi
  4b3b30:	0f 85 23 ff ff ff    	jne    0x4b3a59
  4b3b36:	83 3d 58 f6 98 00 ff 	cmp    DWORD PTR ds:0x98f658,0xffffffff
  4b3b3d:	0f 85 e5 01 00 00    	jne    0x4b3d28
