
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004c3c40 <.text+0xc2c40>:
  4c3c40:	53                   	push   ebx
  4c3c41:	ba ff ff ff ff       	mov    edx,0xffffffff
  4c3c46:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  4c3c4a:	56                   	push   esi
  4c3c4b:	83 7c 24 14 00       	cmp    DWORD PTR [esp+0x14],0x0
  4c3c50:	8b f2                	mov    esi,edx
  4c3c52:	74 04                	je     0x4c3c58
  4c3c54:	8b c1                	mov    eax,ecx
  4c3c56:	eb 08                	jmp    0x4c3c60
  4c3c58:	0f bf 04 4d 08 ce a0 	movsx  eax,WORD PTR [ecx*2+0xa0ce08]
  4c3c5f:	00
  4c3c60:	48                   	dec    eax
  4c3c61:	3d 85 00 00 00       	cmp    eax,0x85
  4c3c66:	0f 87 09 02 00 00    	ja     0x4c3e75
  4c3c6c:	33 db                	xor    ebx,ebx
  4c3c6e:	8a 98 b4 3f 4c 00    	mov    bl,BYTE PTR [eax+0x4c3fb4]
  4c3c74:	ff 24 9d 00 3f 4c 00 	jmp    DWORD PTR [ebx*4+0x4c3f00]
  4c3c7b:	be 01 00 00 00       	mov    esi,0x1
  4c3c80:	ba 62 02 00 00       	mov    edx,0x262
  4c3c85:	e9 eb 01 00 00       	jmp    0x4c3e75
  4c3c8a:	be 02 00 00 00       	mov    esi,0x2
  4c3c8f:	ba 80 02 00 00       	mov    edx,0x280
  4c3c94:	e9 dc 01 00 00       	jmp    0x4c3e75
  4c3c99:	be 03 00 00 00       	mov    esi,0x3
  4c3c9e:	ba 87 02 00 00       	mov    edx,0x287
  4c3ca3:	e9 cd 01 00 00       	jmp    0x4c3e75
  4c3ca8:	be 04 00 00 00       	mov    esi,0x4
  4c3cad:	ba 8d 02 00 00       	mov    edx,0x28d
  4c3cb2:	e9 be 01 00 00       	jmp    0x4c3e75
  4c3cb7:	be 05 00 00 00       	mov    esi,0x5
  4c3cbc:	ba 94 02 00 00       	mov    edx,0x294
  4c3cc1:	e9 af 01 00 00       	jmp    0x4c3e75
  4c3cc6:	be 06 00 00 00       	mov    esi,0x6
  4c3ccb:	ba 97 02 00 00       	mov    edx,0x297
  4c3cd0:	e9 a0 01 00 00       	jmp    0x4c3e75
  4c3cd5:	be 07 00 00 00       	mov    esi,0x7
  4c3cda:	ba 9b 02 00 00       	mov    edx,0x29b
  4c3cdf:	e9 91 01 00 00       	jmp    0x4c3e75
  4c3ce4:	be 08 00 00 00       	mov    esi,0x8
  4c3ce9:	ba 9f 02 00 00       	mov    edx,0x29f
  4c3cee:	e9 82 01 00 00       	jmp    0x4c3e75
  4c3cf3:	be 09 00 00 00       	mov    esi,0x9
  4c3cf8:	ba a2 02 00 00       	mov    edx,0x2a2
  4c3cfd:	e9 73 01 00 00       	jmp    0x4c3e75
  4c3d02:	be 0a 00 00 00       	mov    esi,0xa
  4c3d07:	ba a6 02 00 00       	mov    edx,0x2a6
  4c3d0c:	e9 64 01 00 00       	jmp    0x4c3e75
  4c3d11:	be 0b 00 00 00       	mov    esi,0xb
  4c3d16:	ba ab 02 00 00       	mov    edx,0x2ab
  4c3d1b:	e9 55 01 00 00       	jmp    0x4c3e75
  4c3d20:	be 0c 00 00 00       	mov    esi,0xc
  4c3d25:	ba ad 02 00 00       	mov    edx,0x2ad
  4c3d2a:	e9 46 01 00 00       	jmp    0x4c3e75
  4c3d2f:	be 0d 00 00 00       	mov    esi,0xd
  4c3d34:	ba af 02 00 00       	mov    edx,0x2af
  4c3d39:	e9 37 01 00 00       	jmp    0x4c3e75
  4c3d3e:	be 0e 00 00 00       	mov    esi,0xe
  4c3d43:	ba b1 02 00 00       	mov    edx,0x2b1
  4c3d48:	e9 28 01 00 00       	jmp    0x4c3e75
  4c3d4d:	be 0f 00 00 00       	mov    esi,0xf
  4c3d52:	ba b3 02 00 00       	mov    edx,0x2b3
  4c3d57:	e9 19 01 00 00       	jmp    0x4c3e75
  4c3d5c:	be 10 00 00 00       	mov    esi,0x10
  4c3d61:	ba b5 02 00 00       	mov    edx,0x2b5
  4c3d66:	e9 0a 01 00 00       	jmp    0x4c3e75
  4c3d6b:	be 11 00 00 00       	mov    esi,0x11
  4c3d70:	ba b8 02 00 00       	mov    edx,0x2b8
  4c3d75:	e9 fb 00 00 00       	jmp    0x4c3e75
  4c3d7a:	be 12 00 00 00       	mov    esi,0x12
  4c3d7f:	ba ba 02 00 00       	mov    edx,0x2ba
  4c3d84:	e9 ec 00 00 00       	jmp    0x4c3e75
  4c3d89:	be 13 00 00 00       	mov    esi,0x13
  4c3d8e:	ba bc 02 00 00       	mov    edx,0x2bc
  4c3d93:	e9 dd 00 00 00       	jmp    0x4c3e75
  4c3d98:	be 14 00 00 00       	mov    esi,0x14
  4c3d9d:	ba c2 02 00 00       	mov    edx,0x2c2
  4c3da2:	e9 ce 00 00 00       	jmp    0x4c3e75
  4c3da7:	be 15 00 00 00       	mov    esi,0x15
  4c3dac:	ba c4 02 00 00       	mov    edx,0x2c4
  4c3db1:	e9 bf 00 00 00       	jmp    0x4c3e75
  4c3db6:	be 16 00 00 00       	mov    esi,0x16
  4c3dbb:	ba c8 02 00 00       	mov    edx,0x2c8
  4c3dc0:	e9 b0 00 00 00       	jmp    0x4c3e75
  4c3dc5:	be 17 00 00 00       	mov    esi,0x17
  4c3dca:	ba ca 02 00 00       	mov    edx,0x2ca
  4c3dcf:	e9 a1 00 00 00       	jmp    0x4c3e75
  4c3dd4:	be 18 00 00 00       	mov    esi,0x18
  4c3dd9:	ba cc 02 00 00       	mov    edx,0x2cc
  4c3dde:	e9 92 00 00 00       	jmp    0x4c3e75
  4c3de3:	be 19 00 00 00       	mov    esi,0x19
  4c3de8:	ba ce 02 00 00       	mov    edx,0x2ce
  4c3ded:	e9 83 00 00 00       	jmp    0x4c3e75

d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004c3e75 <.text+0xc2e75>:
  4c3e75:	83 fa ff             	cmp    edx,0xffffffff
  4c3e78:	74 4a                	je     0x4c3ec4
  4c3e7a:	8b 04 95 a8 2b 97 00 	mov    eax,DWORD PTR [edx*4+0x972ba8]
  4c3e81:	83 fe ff             	cmp    esi,0xffffffff
  4c3e84:	50                   	push   eax
  4c3e85:	74 28                	je     0x4c3eaf
  4c3e87:	56                   	push   esi
  4c3e88:	68 84 47 5d 00       	push   0x5d4784
  4c3e8d:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  4c3e91:	56                   	push   esi
  4c3e92:	e8 29 77 09 00       	call   0x55b5c0
  4c3e97:	83 c4 10             	add    esp,0x10
