
populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004e0af0 <.text+0xdfaf0>:
  4e0af0:	81 ec f0 00 00 00    	sub    $0xf0,%esp
  4e0af6:	33 c0                	xor    %eax,%eax
  4e0af8:	53                   	push   %ebx
  4e0af9:	56                   	push   %esi
  4e0afa:	57                   	push   %edi
  4e0afb:	55                   	push   %ebp
  4e0afc:	8b bc 24 04 01 00 00 	mov    0x104(%esp),%edi
  4e0b03:	8a 47 2d             	mov    0x2d(%edi),%al
  4e0b06:	83 f8 08             	cmp    $0x8,%eax
  4e0b09:	0f 87 ce 1a 00 00    	ja     0x4e25dd
  4e0b0f:	ff 24 85 ec 25 4e 00 	jmp    *0x4e25ec(,%eax,4)
  4e0b16:	8b 47 0c             	mov    0xc(%edi),%eax
  4e0b19:	a9 00 00 00 40       	test   $0x40000000,%eax
  4e0b1e:	0f 84 b9 1a 00 00    	je     0x4e25dd
  4e0b24:	66 c7 87 87 00 00 00 	movw   $0x0,0x87(%edi)
  4e0b2b:	00 00 
  4e0b2d:	0f bf 5f 78          	movswl 0x78(%edi),%ebx
  4e0b31:	66 c7 47 74 00 00    	movw   $0x0,0x74(%edi)
  4e0b37:	66 c7 47 72 00 00    	movw   $0x0,0x72(%edi)
  4e0b3d:	25 ff ff ff bf       	and    $0xbfffffff,%eax
  4e0b42:	85 db                	test   %ebx,%ebx
  4e0b44:	89 47 0c             	mov    %eax,0xc(%edi)
  4e0b47:	74 39                	je     0x4e0b82
  4e0b49:	7e 2d                	jle    0x4e0b78
  4e0b4b:	8d 77 3d             	lea    0x3d(%edi),%esi
  4e0b4e:	56                   	push   %esi
  4e0b4f:	68 ff 00 00 00       	push   $0xff
  4e0b54:	6a 0b                	push   $0xb
  4e0b56:	6a 05                	push   $0x5
  4e0b58:	e8 43 cd 00 00       	call   0x4ed8a0
  4e0b5d:	83 c4 10             	add    $0x10,%esp
  4e0b60:	85 c0                	test   %eax,%eax
  4e0b62:	74 14                	je     0x4e0b78
  4e0b64:	83 eb 64             	sub    $0x64,%ebx
  4e0b67:	6a 00                	push   $0x0
  4e0b69:	6a 0b                	push   $0xb
  4e0b6b:	57                   	push   %edi
  4e0b6c:	e8 df 94 fa ff       	call   0x48a050
  4e0b71:	83 c4 0c             	add    $0xc,%esp
  4e0b74:	85 db                	test   %ebx,%ebx
  4e0b76:	7f d6                	jg     0x4e0b4e
  4e0b78:	85 db                	test   %ebx,%ebx
  4e0b7a:	7d 02                	jge    0x4e0b7e
  4e0b7c:	33 db                	xor    %ebx,%ebx
  4e0b7e:	66 89 5f 78          	mov    %bx,0x78(%edi)
  4e0b82:	b9 00 00 00 00       	mov    $0x0,%ecx
  4e0b87:	8b 47 0c             	mov    0xc(%edi),%eax
  4e0b8a:	66 c7 47 5f 00 00    	movw   $0x0,0x5f(%edi)
  4e0b90:	66 83 7f 78 01       	cmpw   $0x1,0x78(%edi)
  4e0b95:	83 d1 ff             	adc    $0xffffffff,%ecx
  4e0b98:	66 83 e1 04          	and    $0x4,%cx
  4e0b9c:	a9 00 00 08 00       	test   $0x80000,%eax
  4e0ba1:	74 16                	je     0x4e0bb9
  4e0ba3:	f6 47 11 04          	testb  $0x4,0x11(%edi)
  4e0ba7:	66 b9 0c 00          	mov    $0xc,%cx
  4e0bab:	75 0c                	jne    0x4e0bb9
  4e0bad:	66 b9 02 00          	mov    $0x2,%cx
  4e0bb1:	25 ff 7f ff ff       	and    $0xffff7fff,%eax
  4e0bb6:	89 47 0c             	mov    %eax,0xc(%edi)
  4e0bb9:	0f bf c1             	movswl %cx,%eax
  4e0bbc:	33 d2                	xor    %edx,%edx
  4e0bbe:	8d 0c c0             	lea    (%eax,%eax,8),%ecx
  4e0bc1:	8a 57 2b             	mov    0x2b(%edi),%dl
  4e0bc4:	03 d1                	add    %ecx,%edx
  4e0bc6:	66 8b 04 55 50 6d 5a 	mov    0x5a6d50(,%edx,2),%ax
  4e0bcd:	00 
  4e0bce:	50                   	push   %eax
  4e0bcf:	57                   	push   %edi
  4e0bd0:	e8 6b 34 ff ff       	call   0x4d4040
  4e0bd5:	83 c4 08             	add    $0x8,%esp
  4e0bd8:	f6 47 0e 80          	testb  $0x80,0xe(%edi)
  4e0bdc:	74 55                	je     0x4e0c33
  4e0bde:	66 8b 47 3d          	mov    0x3d(%edi),%ax
  4e0be2:	66 8b 4f 3f          	mov    0x3f(%edi),%cx
  4e0be6:	88 64 24 1c          	mov    %ah,0x1c(%esp)
  4e0bea:	33 c0                	xor    %eax,%eax
  4e0bec:	88 6c 24 1d          	mov    %ch,0x1d(%esp)
  4e0bf0:	66 8b 44 24 1c       	mov    0x1c(%esp),%ax
  4e0bf5:	57                   	push   %edi
  4e0bf6:	25 fe 00 00 00       	and    $0xfe,%eax
  4e0bfb:	8d 0c 45 00 00 00 00 	lea    0x0(,%eax,2),%ecx
  4e0c02:	33 c0                	xor    %eax,%eax
  4e0c04:	66 8b 44 24 20       	mov    0x20(%esp),%ax
  4e0c09:	25 00 fe 00 00       	and    $0xfe00,%eax
  4e0c0e:	0b c8                	or     %eax,%ecx
  4e0c10:	33 c0                	xor    %eax,%eax
  4e0c12:	66 8b 04 8d ec 03 8a 	mov    0x8a03ec(,%ecx,4),%ax
  4e0c19:	00 
  4e0c1a:	25 ff 03 00 00       	and    $0x3ff,%eax
  4e0c1f:	8b 0c 85 90 03 89 00 	mov    0x890390(,%eax,4),%ecx
  4e0c26:	51                   	push   %ecx
  4e0c27:	e8 64 68 f2 ff       	call   0x407490
  4e0c2c:	83 67 0c ef          	andl   $0xffffffef,0xc(%edi)
  4e0c30:	83 c4 08             	add    $0x8,%esp
  4e0c33:	80 7f 2b 07          	cmpb   $0x7,0x2b(%edi)
  4e0c37:	75 07                	jne    0x4e0c40
  4e0c39:	b8 08 00 00 00       	mov    $0x8,%eax
  4e0c3e:	eb 10                	jmp    0x4e0c50
  4e0c40:	66 83 bf 9f 00 00 00 	cmpw   $0x1,0x9f(%edi)
  4e0c47:	01 
  4e0c48:	1b c0                	sbb    %eax,%eax
  4e0c4a:	83 e0 fa             	and    $0xfffffffa,%eax
  4e0c4d:	83 c0 07             	add    $0x7,%eax
  4e0c50:	81 4f 0c 00 00 00 40 	orl    $0x40000000,0xc(%edi)
  4e0c57:	c6 87 a8 00 00 00 00 	movb   $0x0,0xa8(%edi)
  4e0c5e:	80 4f 76 10          	orb    $0x10,0x76(%edi)
  4e0c62:	88 47 2d             	mov    %al,0x2d(%edi)
  4e0c65:	e9 73 19 00 00       	jmp    0x4e25dd
  4e0c6a:	33 db                	xor    %ebx,%ebx
  4e0c6c:	33 f6                	xor    %esi,%esi
  4e0c6e:	8b 47 0c             	mov    0xc(%edi),%eax
  4e0c71:	89 5c 24 28          	mov    %ebx,0x28(%esp)
  4e0c75:	a9 00 00 00 40       	test   $0x40000000,%eax
  4e0c7a:	74 1c                	je     0x4e0c98
  4e0c7c:	80 4f 76 10          	orb    $0x10,0x76(%edi)
  4e0c80:	66 89 5f 70          	mov    %bx,0x70(%edi)
  4e0c84:	25 ff ff ff bf       	and    $0xbfffffff,%eax
  4e0c89:	89 47 0c             	mov    %eax,0xc(%edi)
  4e0c8c:	88 9f a8 00 00 00    	mov    %bl,0xa8(%edi)
  4e0c92:	88 9f a9 00 00 00    	mov    %bl,0xa9(%edi)
  4e0c98:	33 c0                	xor    %eax,%eax
  4e0c9a:	8a 87 a8 00 00 00    	mov    0xa8(%edi),%al
  4e0ca0:	85 c0                	test   %eax,%eax
  4e0ca2:	74 17                	je     0x4e0cbb
  4e0ca4:	83 f8 01             	cmp    $0x1,%eax
  4e0ca7:	0f 84 1c 01 00 00    	je     0x4e0dc9
  4e0cad:	83 f8 02             	cmp    $0x2,%eax
  4e0cb0:	0f 84 5d 02 00 00    	je     0x4e0f13
  4e0cb6:	e9 7b 03 00 00       	jmp    0x4e1036
  4e0cbb:	66 8b 47 76          	mov    0x76(%edi),%ax
  4e0cbf:	a8 10                	test   $0x10,%al
  4e0cc1:	0f 84 de 00 00 00    	je     0x4e0da5
  4e0cc7:	66 25 ef ff          	and    $0xffef,%ax
  4e0ccb:	66 89 47 76          	mov    %ax,0x76(%edi)
  4e0ccf:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e0cd4:	8b c8                	mov    %eax,%ecx
  4e0cd6:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e0cd9:	8d 04 d1             	lea    (%ecx,%edx,8),%eax
  4e0cdc:	8d 04 81             	lea    (%ecx,%eax,4),%eax
  4e0cdf:	c1 e0 02             	shl    $0x2,%eax
  4e0ce2:	8d 04 c1             	lea    (%ecx,%eax,8),%eax
  4e0ce5:	05 df 24 00 00       	add    $0x24df,%eax
  4e0cea:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e0cef:	89 84 24 80 00 00 00 	mov    %eax,0x80(%esp)
  4e0cf6:	c1 8c 24 80 00 00 00 	rorl   $0xd,0x80(%esp)
  4e0cfd:	0d 
  4e0cfe:	8b 84 24 80 00 00 00 	mov    0x80(%esp),%eax
  4e0d05:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e0d0a:	24 07                	and    $0x7,%al
  4e0d0c:	04 08                	add    $0x8,%al
  4e0d0e:	88 87 aa 00 00 00    	mov    %al,0xaa(%edi)
  4e0d14:	66 0f be c0          	movsbw %al,%ax
  4e0d18:	66 89 47 70          	mov    %ax,0x70(%edi)
  4e0d1c:	33 c0                	xor    %eax,%eax
  4e0d1e:	8a 47 2b             	mov    0x2b(%edi),%al
  4e0d21:	66 8b 04 45 12 6f 5a 	mov    0x5a6f12(,%eax,2),%ax
  4e0d28:	00 
  4e0d29:	50                   	push   %eax
  4e0d2a:	57                   	push   %edi
  4e0d2b:	e8 10 33 ff ff       	call   0x4d4040
  4e0d30:	83 c4 08             	add    $0x8,%esp
  4e0d33:	33 c9                	xor    %ecx,%ecx
  4e0d35:	8a 4f 30             	mov    0x30(%edi),%cl
  4e0d38:	8b c1                	mov    %ecx,%eax
  4e0d3a:	8d 14 89             	lea    (%ecx,%ecx,4),%edx
  4e0d3d:	8d 0c 92             	lea    (%edx,%edx,4),%ecx
  4e0d40:	0f bf 8c 01 94 7b 5a 	movswl 0x5a7b94(%ecx,%eax,1),%ecx
  4e0d47:	00 
  4e0d48:	8b f1                	mov    %ecx,%esi
  4e0d4a:	c1 fe 02             	sar    $0x2,%esi
  4e0d4d:	85 f6                	test   %esi,%esi
  4e0d4f:	75 05                	jne    0x4e0d56
  4e0d51:	be 01 00 00 00       	mov    $0x1,%esi
  4e0d56:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e0d5b:	8b d0                	mov    %eax,%edx
  4e0d5d:	8d 1c c0             	lea    (%eax,%eax,8),%ebx
  4e0d60:	8d 04 da             	lea    (%edx,%ebx,8),%eax
  4e0d63:	8d 04 82             	lea    (%edx,%eax,4),%eax
  4e0d66:	c1 e0 02             	shl    $0x2,%eax
  4e0d69:	8d 04 c2             	lea    (%edx,%eax,8),%eax
  4e0d6c:	05 df 24 00 00       	add    $0x24df,%eax
  4e0d71:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e0d76:	89 44 24 7c          	mov    %eax,0x7c(%esp)
  4e0d7a:	c1 4c 24 7c 0d       	rorl   $0xd,0x7c(%esp)
  4e0d7f:	8b 44 24 7c          	mov    0x7c(%esp),%eax
  4e0d83:	2b d2                	sub    %edx,%edx
  4e0d85:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e0d8a:	f7 f6                	div    %esi
  4e0d8c:	8d 04 11             	lea    (%ecx,%edx,1),%eax
  4e0d8f:	f6 47 16 08          	testb  $0x8,0x16(%edi)
  4e0d93:	66 89 47 5f          	mov    %ax,0x5f(%edi)
  4e0d97:	74 07                	je     0x4e0da0
  4e0d99:	66 03 c0             	add    %ax,%ax
  4e0d9c:	66 89 47 5f          	mov    %ax,0x5f(%edi)
  4e0da0:	be 01 00 00 00       	mov    $0x1,%esi
  4e0da5:	bb 01 00 00 00       	mov    $0x1,%ebx
  4e0daa:	8a 87 aa 00 00 00    	mov    0xaa(%edi),%al
  4e0db0:	fe c8                	dec    %al
  4e0db2:	88 87 aa 00 00 00    	mov    %al,0xaa(%edi)
  4e0db8:	84 c0                	test   %al,%al
  4e0dba:	0f 8f 76 02 00 00    	jg     0x4e1036
  4e0dc0:	89 5c 24 28          	mov    %ebx,0x28(%esp)
  4e0dc4:	e9 6d 02 00 00       	jmp    0x4e1036
  4e0dc9:	66 8b 47 76          	mov    0x76(%edi),%ax
  4e0dcd:	a8 10                	test   $0x10,%al
  4e0dcf:	0f 84 1a 01 00 00    	je     0x4e0eef
  4e0dd5:	66 25 ef ff          	and    $0xffef,%ax
  4e0dd9:	66 89 47 76          	mov    %ax,0x76(%edi)
  4e0ddd:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e0de2:	8b c8                	mov    %eax,%ecx
  4e0de4:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e0de7:	8d 04 d1             	lea    (%ecx,%edx,8),%eax
  4e0dea:	8d 04 81             	lea    (%ecx,%eax,4),%eax
  4e0ded:	c1 e0 02             	shl    $0x2,%eax
  4e0df0:	8d 04 c1             	lea    (%ecx,%eax,8),%eax
  4e0df3:	05 df 24 00 00       	add    $0x24df,%eax
  4e0df8:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e0dfd:	89 44 24 78          	mov    %eax,0x78(%esp)
  4e0e01:	c1 4c 24 78 0d       	rorl   $0xd,0x78(%esp)
  4e0e06:	8b 44 24 78          	mov    0x78(%esp),%eax
  4e0e0a:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e0e0f:	24 0f                	and    $0xf,%al
  4e0e11:	04 10                	add    $0x10,%al
  4e0e13:	66 83 7f 78 00       	cmpw   $0x0,0x78(%edi)
  4e0e18:	88 87 aa 00 00 00    	mov    %al,0xaa(%edi)
  4e0e1e:	75 35                	jne    0x4e0e55
  4e0e20:	33 c0                	xor    %eax,%eax
  4e0e22:	8a 47 2b             	mov    0x2b(%edi),%al
  4e0e25:	66 0f b6 04 45 ce 6d 	movzbw 0x5a6dce(,%eax,2),%ax
  4e0e2c:	5a 00 
  4e0e2e:	50                   	push   %eax
  4e0e2f:	57                   	push   %edi
  4e0e30:	e8 0b 32 ff ff       	call   0x4d4040
  4e0e35:	83 c4 08             	add    $0x8,%esp
  4e0e38:	33 c9                	xor    %ecx,%ecx
  4e0e3a:	c6 47 39 00          	movb   $0x0,0x39(%edi)
  4e0e3e:	8a 4f 3a             	mov    0x3a(%edi),%cl
  4e0e41:	8b c1                	mov    %ecx,%eax
  4e0e43:	8d 14 89             	lea    (%ecx,%ecx,4),%edx
  4e0e46:	66 0f be 84 50 f9 6a 	movsbw 0x5a6af9(%eax,%edx,2),%ax
  4e0e4d:	5a 00 
  4e0e4f:	66 89 47 37          	mov    %ax,0x37(%edi)
  4e0e53:	eb 18                	jmp    0x4e0e6d
  4e0e55:	33 c0                	xor    %eax,%eax
  4e0e57:	8a 47 2b             	mov    0x2b(%edi),%al
  4e0e5a:	66 0f b6 04 45 98 6d 	movzbw 0x5a6d98(,%eax,2),%ax
  4e0e61:	5a 00 
  4e0e63:	50                   	push   %eax
  4e0e64:	57                   	push   %edi
  4e0e65:	e8 d6 31 ff ff       	call   0x4d4040
  4e0e6a:	83 c4 08             	add    $0x8,%esp
  4e0e6d:	33 c9                	xor    %ecx,%ecx
  4e0e6f:	8a 4f 30             	mov    0x30(%edi),%cl
  4e0e72:	8b c1                	mov    %ecx,%eax
  4e0e74:	8d 14 89             	lea    (%ecx,%ecx,4),%edx
  4e0e77:	80 4f 76 80          	orb    $0x80,0x76(%edi)
  4e0e7b:	8d 0c 92             	lea    (%edx,%edx,4),%ecx
  4e0e7e:	0f bf 8c 01 94 7b 5a 	movswl 0x5a7b94(%ecx,%eax,1),%ecx
  4e0e85:	00 
  4e0e86:	8b d9                	mov    %ecx,%ebx
  4e0e88:	c1 fb 02             	sar    $0x2,%ebx
  4e0e8b:	85 db                	test   %ebx,%ebx
  4e0e8d:	75 05                	jne    0x4e0e94
  4e0e8f:	bb 01 00 00 00       	mov    $0x1,%ebx
  4e0e94:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e0e99:	8b d0                	mov    %eax,%edx
  4e0e9b:	8d 2c c0             	lea    (%eax,%eax,8),%ebp
  4e0e9e:	8d 04 ea             	lea    (%edx,%ebp,8),%eax
  4e0ea1:	8d 04 82             	lea    (%edx,%eax,4),%eax
  4e0ea4:	c1 e0 02             	shl    $0x2,%eax
  4e0ea7:	8d 04 c2             	lea    (%edx,%eax,8),%eax
  4e0eaa:	05 df 24 00 00       	add    $0x24df,%eax
  4e0eaf:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e0eb4:	89 44 24 74          	mov    %eax,0x74(%esp)
  4e0eb8:	c1 4c 24 74 0d       	rorl   $0xd,0x74(%esp)
  4e0ebd:	8b 44 24 74          	mov    0x74(%esp),%eax
  4e0ec1:	2b d2                	sub    %edx,%edx
  4e0ec3:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e0ec8:	f7 f3                	div    %ebx
  4e0eca:	8d 04 11             	lea    (%ecx,%edx,1),%eax
  4e0ecd:	f6 47 16 08          	testb  $0x8,0x16(%edi)
  4e0ed1:	66 89 47 5f          	mov    %ax,0x5f(%edi)
  4e0ed5:	74 07                	je     0x4e0ede
  4e0ed7:	66 03 c0             	add    %ax,%ax
  4e0eda:	66 89 47 5f          	mov    %ax,0x5f(%edi)
  4e0ede:	66 b9 03 00          	mov    $0x3,%cx
  4e0ee2:	66 8b 47 5f          	mov    0x5f(%edi),%ax
  4e0ee6:	66 99                	cwtd
  4e0ee8:	66 f7 f9             	idiv   %cx
  4e0eeb:	66 89 47 5f          	mov    %ax,0x5f(%edi)
  4e0eef:	bb 01 00 00 00       	mov    $0x1,%ebx
  4e0ef4:	8a 87 aa 00 00 00    	mov    0xaa(%edi),%al
  4e0efa:	fe c8                	dec    %al
  4e0efc:	88 87 aa 00 00 00    	mov    %al,0xaa(%edi)
  4e0f02:	84 c0                	test   %al,%al
  4e0f04:	0f 8f 2c 01 00 00    	jg     0x4e1036
  4e0f0a:	89 5c 24 28          	mov    %ebx,0x28(%esp)
  4e0f0e:	e9 23 01 00 00       	jmp    0x4e1036
  4e0f13:	66 8b 47 76          	mov    0x76(%edi),%ax
  4e0f17:	a8 10                	test   $0x10,%al
  4e0f19:	74 61                	je     0x4e0f7c
  4e0f1b:	66 c7 47 5f 00 00    	movw   $0x0,0x5f(%edi)
  4e0f21:	66 25 ef ff          	and    $0xffef,%ax
  4e0f25:	66 89 47 76          	mov    %ax,0x76(%edi)
  4e0f29:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e0f2e:	8b c8                	mov    %eax,%ecx
  4e0f30:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e0f33:	8d 04 d1             	lea    (%ecx,%edx,8),%eax
  4e0f36:	8d 04 81             	lea    (%ecx,%eax,4),%eax
  4e0f39:	c1 e0 02             	shl    $0x2,%eax
  4e0f3c:	8d 04 c1             	lea    (%ecx,%eax,8),%eax
  4e0f3f:	05 df 24 00 00       	add    $0x24df,%eax
  4e0f44:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e0f49:	89 44 24 70          	mov    %eax,0x70(%esp)
  4e0f4d:	c1 4c 24 70 0d       	rorl   $0xd,0x70(%esp)
  4e0f52:	8b 44 24 70          	mov    0x70(%esp),%eax
  4e0f56:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e0f5b:	24 0f                	and    $0xf,%al
  4e0f5d:	04 10                	add    $0x10,%al
  4e0f5f:	88 87 aa 00 00 00    	mov    %al,0xaa(%edi)
  4e0f65:	33 c0                	xor    %eax,%eax
  4e0f67:	8a 47 2b             	mov    0x2b(%edi),%al
  4e0f6a:	66 8b 04 45 86 6d 5a 	mov    0x5a6d86(,%eax,2),%ax
  4e0f71:	00 
  4e0f72:	50                   	push   %eax
  4e0f73:	57                   	push   %edi
  4e0f74:	e8 c7 30 ff ff       	call   0x4d4040
  4e0f79:	83 c4 08             	add    $0x8,%esp
  4e0f7c:	f6 47 2e 03          	testb  $0x3,0x2e(%edi)
  4e0f80:	0f 85 96 00 00 00    	jne    0x4e101c
  4e0f86:	0f be 47 2f          	movsbl 0x2f(%edi),%eax
  4e0f8a:	8b c8                	mov    %eax,%ecx
  4e0f8c:	8d 14 80             	lea    (%eax,%eax,4),%edx
  4e0f8f:	8d 04 51             	lea    (%ecx,%edx,2),%eax
  4e0f92:	8d 2c c0             	lea    (%eax,%eax,8),%ebp
  4e0f95:	8d 14 e9             	lea    (%ecx,%ebp,8),%edx
  4e0f98:	8b 84 91 65 da 89 00 	mov    0x89da65(%ecx,%edx,4),%eax
  4e0f9f:	85 c0                	test   %eax,%eax
  4e0fa1:	74 79                	je     0x4e101c
  4e0fa3:	66 8b 48 3d          	mov    0x3d(%eax),%cx
  4e0fa7:	66 2b 4f 3d          	sub    0x3d(%edi),%cx
  4e0fab:	0f b7 c9             	movzwl %cx,%ecx
  4e0fae:	66 8b 40 3f          	mov    0x3f(%eax),%ax
  4e0fb2:	8b e9                	mov    %ecx,%ebp
  4e0fb4:	66 2b 47 3f          	sub    0x3f(%edi),%ax
  4e0fb8:	85 c9                	test   %ecx,%ecx
  4e0fba:	0f b7 d0             	movzwl %ax,%edx
  4e0fbd:	7d 04                	jge    0x4e0fc3
  4e0fbf:	8b e9                	mov    %ecx,%ebp
  4e0fc1:	f7 dd                	neg    %ebp
  4e0fc3:	8b c2                	mov    %edx,%eax
  4e0fc5:	85 d2                	test   %edx,%edx
  4e0fc7:	7d 04                	jge    0x4e0fcd
  4e0fc9:	8b c2                	mov    %edx,%eax
  4e0fcb:	f7 d8                	neg    %eax
  4e0fcd:	81 fd 00 80 00 00    	cmp    $0x8000,%ebp
  4e0fd3:	7c 06                	jl     0x4e0fdb
  4e0fd5:	8d 8d 00 00 ff ff    	lea    -0x10000(%ebp),%ecx
  4e0fdb:	3d 00 80 00 00       	cmp    $0x8000,%eax
  4e0fe0:	7c 06                	jl     0x4e0fe8
  4e0fe2:	8d 90 00 00 ff ff    	lea    -0x10000(%eax),%edx
  4e0fe8:	f7 da                	neg    %edx
  4e0fea:	52                   	push   %edx
  4e0feb:	51                   	push   %ecx
  4e0fec:	e8 83 50 0a 00       	call   0x586074
  4e0ff1:	66 8b e8             	mov    %ax,%bp
  4e0ff4:	83 c4 08             	add    $0x8,%esp
  4e0ff7:	66 81 e5 ff 07       	and    $0x7ff,%bp
  4e0ffc:	57                   	push   %edi
  4e0ffd:	e8 5e 94 00 00       	call   0x4ea460
  4e1002:	66 89 6f 57          	mov    %bp,0x57(%edi)
  4e1006:	83 c4 04             	add    $0x4,%esp
  4e1009:	8b 47 0c             	mov    0xc(%edi),%eax
  4e100c:	0d 80 00 00 00       	or     $0x80,%eax
  4e1011:	89 47 0c             	mov    %eax,0xc(%edi)
  4e1014:	0d 00 10 00 00       	or     $0x1000,%eax
  4e1019:	89 47 0c             	mov    %eax,0xc(%edi)
  4e101c:	8a 87 aa 00 00 00    	mov    0xaa(%edi),%al
  4e1022:	fe c8                	dec    %al
  4e1024:	88 87 aa 00 00 00    	mov    %al,0xaa(%edi)
  4e102a:	84 c0                	test   %al,%al
  4e102c:	7f 08                	jg     0x4e1036
  4e102e:	c7 44 24 28 01 00 00 	movl   $0x1,0x28(%esp)
  4e1035:	00 
  4e1036:	85 db                	test   %ebx,%ebx
  4e1038:	75 08                	jne    0x4e1042
  4e103a:	85 f6                	test   %esi,%esi
  4e103c:	0f 84 19 01 00 00    	je     0x4e115b
  4e1042:	66 8b 47 70          	mov    0x70(%edi),%ax
  4e1046:	66 48                	dec    %ax
  4e1048:	66 89 47 70          	mov    %ax,0x70(%edi)
  4e104c:	66 85 c0             	test   %ax,%ax
  4e104f:	7e 08                	jle    0x4e1059
  4e1051:	85 f6                	test   %esi,%esi
  4e1053:	0f 84 02 01 00 00    	je     0x4e115b
  4e1059:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e105e:	8b c8                	mov    %eax,%ecx
  4e1060:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e1063:	8d 04 d1             	lea    (%ecx,%edx,8),%eax
  4e1066:	8d 04 81             	lea    (%ecx,%eax,4),%eax
  4e1069:	c1 e0 02             	shl    $0x2,%eax
  4e106c:	8d 04 c1             	lea    (%ecx,%eax,8),%eax
  4e106f:	05 df 24 00 00       	add    $0x24df,%eax
  4e1074:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e1079:	89 44 24 6c          	mov    %eax,0x6c(%esp)
  4e107d:	c1 4c 24 6c 0d       	rorl   $0xd,0x6c(%esp)
  4e1082:	8b 44 24 6c          	mov    0x6c(%esp),%eax
  4e1086:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e108b:	66 25 0f 00          	and    $0xf,%ax
  4e108f:	66 05 06 00          	add    $0x6,%ax
  4e1093:	66 89 47 70          	mov    %ax,0x70(%edi)
  4e1097:	66 8b 47 68          	mov    0x68(%edi),%ax
  4e109b:	66 2b 47 3d          	sub    0x3d(%edi),%ax
  4e109f:	0f b7 f0             	movzwl %ax,%esi
  4e10a2:	66 8b 47 6a          	mov    0x6a(%edi),%ax
  4e10a6:	66 2b 47 3f          	sub    0x3f(%edi),%ax
  4e10aa:	85 f6                	test   %esi,%esi
  4e10ac:	0f b7 d0             	movzwl %ax,%edx
  4e10af:	8b c6                	mov    %esi,%eax
  4e10b1:	7d 04                	jge    0x4e10b7
  4e10b3:	8b c6                	mov    %esi,%eax
  4e10b5:	f7 d8                	neg    %eax
  4e10b7:	8b ca                	mov    %edx,%ecx
  4e10b9:	85 d2                	test   %edx,%edx
  4e10bb:	7d 04                	jge    0x4e10c1
  4e10bd:	8b ca                	mov    %edx,%ecx
  4e10bf:	f7 d9                	neg    %ecx
  4e10c1:	3d 00 80 00 00       	cmp    $0x8000,%eax
  4e10c6:	7c 06                	jl     0x4e10ce
  4e10c8:	8d b0 00 00 ff ff    	lea    -0x10000(%eax),%esi
  4e10ce:	81 f9 00 80 00 00    	cmp    $0x8000,%ecx
  4e10d4:	7c 06                	jl     0x4e10dc
  4e10d6:	8d 91 00 00 ff ff    	lea    -0x10000(%ecx),%edx
  4e10dc:	f7 da                	neg    %edx
  4e10de:	52                   	push   %edx
  4e10df:	56                   	push   %esi
  4e10e0:	33 f6                	xor    %esi,%esi
  4e10e2:	e8 8d 4f 0a 00       	call   0x586074
  4e10e7:	66 8b f0             	mov    %ax,%si
  4e10ea:	83 c4 08             	add    $0x8,%esp
  4e10ed:	81 e6 ff 07 00 00    	and    $0x7ff,%esi
  4e10f3:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e10f8:	8b c8                	mov    %eax,%ecx
  4e10fa:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e10fd:	8d 04 d1             	lea    (%ecx,%edx,8),%eax
  4e1100:	8d 04 81             	lea    (%ecx,%eax,4),%eax
  4e1103:	c1 e0 02             	shl    $0x2,%eax
  4e1106:	8d 04 c1             	lea    (%ecx,%eax,8),%eax
  4e1109:	05 df 24 00 00       	add    $0x24df,%eax
  4e110e:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e1113:	89 44 24 68          	mov    %eax,0x68(%esp)
  4e1117:	c1 4c 24 68 0d       	rorl   $0xd,0x68(%esp)
  4e111c:	8b 44 24 68          	mov    0x68(%esp),%eax
  4e1120:	b9 8e 05 00 00       	mov    $0x58e,%ecx
  4e1125:	2b d2                	sub    %edx,%edx
  4e1127:	57                   	push   %edi
  4e1128:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e112d:	f7 f1                	div    %ecx
  4e112f:	8d b4 32 39 fd ff ff 	lea    -0x2c7(%edx,%esi,1),%esi
  4e1136:	e8 25 93 00 00       	call   0x4ea460
  4e113b:	81 e6 ff 07 00 00    	and    $0x7ff,%esi
  4e1141:	83 c4 04             	add    $0x4,%esp
  4e1144:	66 89 77 57          	mov    %si,0x57(%edi)
  4e1148:	8b 47 0c             	mov    0xc(%edi),%eax
  4e114b:	0d 80 00 00 00       	or     $0x80,%eax
  4e1150:	89 47 0c             	mov    %eax,0xc(%edi)
  4e1153:	0d 00 10 00 00       	or     $0x1000,%eax
  4e1158:	89 47 0c             	mov    %eax,0xc(%edi)
  4e115b:	33 c0                	xor    %eax,%eax
  4e115d:	33 f6                	xor    %esi,%esi
  4e115f:	8a 87 a8 00 00 00    	mov    0xa8(%edi),%al
  4e1165:	39 74 24 28          	cmp    %esi,0x28(%esp)
  4e1169:	89 44 24 24          	mov    %eax,0x24(%esp)
  4e116d:	0f 85 cc 00 00 00    	jne    0x4e123f
  4e1173:	83 f8 01             	cmp    $0x1,%eax
  4e1176:	0f 85 c3 00 00 00    	jne    0x4e123f
  4e117c:	66 8b 47 3d          	mov    0x3d(%edi),%ax
  4e1180:	66 8b 4f 3f          	mov    0x3f(%edi),%cx
  4e1184:	88 64 24 1a          	mov    %ah,0x1a(%esp)
  4e1188:	33 c0                	xor    %eax,%eax
  4e118a:	88 6c 24 1b          	mov    %ch,0x1b(%esp)
  4e118e:	66 8b 44 24 1a       	mov    0x1a(%esp),%ax
  4e1193:	33 c9                	xor    %ecx,%ecx
  4e1195:	66 8b 4c 24 1a       	mov    0x1a(%esp),%cx
  4e119a:	25 fe 00 00 00       	and    $0xfe,%eax
  4e119f:	03 c0                	add    %eax,%eax
  4e11a1:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4e11a7:	0b c1                	or     %ecx,%eax
  4e11a9:	33 db                	xor    %ebx,%ebx
  4e11ab:	0f bf 14 85 ea 03 8a 	movswl 0x8a03ea(,%eax,4),%edx
  4e11b2:	00 
  4e11b3:	33 c9                	xor    %ecx,%ecx
  4e11b5:	8b 04 95 90 03 89 00 	mov    0x890390(,%edx,4),%eax
  4e11bc:	85 c0                	test   %eax,%eax
  4e11be:	74 56                	je     0x4e1216
  4e11c0:	3b f8                	cmp    %eax,%edi
  4e11c2:	74 41                	je     0x4e1205
  4e11c4:	80 78 2a 01          	cmpb   $0x1,0x2a(%eax)
  4e11c8:	75 3b                	jne    0x4e1205
  4e11ca:	8a 50 2f             	mov    0x2f(%eax),%dl
  4e11cd:	38 57 2f             	cmp    %dl,0x2f(%edi)
  4e11d0:	75 33                	jne    0x4e1205
  4e11d2:	80 78 2c 29          	cmpb   $0x29,0x2c(%eax)
  4e11d6:	75 2d                	jne    0x4e1205
  4e11d8:	33 d2                	xor    %edx,%edx
  4e11da:	8a 50 2d             	mov    0x2d(%eax),%dl
  4e11dd:	83 fa 01             	cmp    $0x1,%edx
  4e11e0:	74 0c                	je     0x4e11ee
  4e11e2:	83 fa 03             	cmp    $0x3,%edx
  4e11e5:	74 19                	je     0x4e1200
  4e11e7:	83 fa 04             	cmp    $0x4,%edx
  4e11ea:	74 18                	je     0x4e1204
  4e11ec:	eb 17                	jmp    0x4e1205
  4e11ee:	8a 90 a8 00 00 00    	mov    0xa8(%eax),%dl
  4e11f4:	80 fa 01             	cmp    $0x1,%dl
  4e11f7:	74 04                	je     0x4e11fd
  4e11f9:	84 d2                	test   %dl,%dl
  4e11fb:	75 08                	jne    0x4e1205
  4e11fd:	46                   	inc    %esi
  4e11fe:	eb 05                	jmp    0x4e1205
  4e1200:	8b c8                	mov    %eax,%ecx
  4e1202:	eb 01                	jmp    0x4e1205
  4e1204:	43                   	inc    %ebx
  4e1205:	33 d2                	xor    %edx,%edx
  4e1207:	66 8b 50 20          	mov    0x20(%eax),%dx
  4e120b:	8b 04 95 90 03 89 00 	mov    0x890390(,%edx,4),%eax
  4e1212:	85 c0                	test   %eax,%eax
  4e1214:	75 aa                	jne    0x4e11c0
  4e1216:	83 fb 06             	cmp    $0x6,%ebx
  4e1219:	7f 24                	jg     0x4e123f
  4e121b:	85 c9                	test   %ecx,%ecx
  4e121d:	75 05                	jne    0x4e1224
  4e121f:	83 fe 03             	cmp    $0x3,%esi
  4e1222:	7c 1b                	jl     0x4e123f
  4e1224:	66 c7 47 5f 00 00    	movw   $0x0,0x5f(%edi)
  4e122a:	85 c9                	test   %ecx,%ecx
  4e122c:	75 06                	jne    0x4e1234
  4e122e:	c6 47 2d 03          	movb   $0x3,0x2d(%edi)
  4e1232:	eb 04                	jmp    0x4e1238
  4e1234:	c6 47 2d 04          	movb   $0x4,0x2d(%edi)
  4e1238:	81 4f 0c 00 00 00 40 	orl    $0x40000000,0xc(%edi)
  4e123f:	33 db                	xor    %ebx,%ebx
  4e1241:	39 5c 24 28          	cmp    %ebx,0x28(%esp)
  4e1245:	0f 84 92 13 00 00    	je     0x4e25dd
  4e124b:	8a 87 a9 00 00 00    	mov    0xa9(%edi),%al
  4e1251:	89 5c 24 64          	mov    %ebx,0x64(%esp)
  4e1255:	89 5c 24 5c          	mov    %ebx,0x5c(%esp)
  4e1259:	3c 04                	cmp    $0x4,%al
  4e125b:	8d 48 01             	lea    0x1(%eax),%ecx
  4e125e:	88 8f a9 00 00 00    	mov    %cl,0xa9(%edi)
  4e1264:	0f 83 6f 03 00 00    	jae    0x4e15d9
  4e126a:	66 8b 47 3d          	mov    0x3d(%edi),%ax
  4e126e:	66 c1 e8 08          	shr    $0x8,%ax
  4e1272:	24 fe                	and    $0xfe,%al
  4e1274:	88 44 24 1e          	mov    %al,0x1e(%esp)
  4e1278:	66 8b 47 3f          	mov    0x3f(%edi),%ax
  4e127c:	66 c1 e8 08          	shr    $0x8,%ax
  4e1280:	24 fe                	and    $0xfe,%al
  4e1282:	88 44 24 1f          	mov    %al,0x1f(%esp)
  4e1286:	66 8b 4c 24 1e       	mov    0x1e(%esp),%cx
  4e128b:	66 89 4c 24 12       	mov    %cx,0x12(%esp)
  4e1290:	80 6c 24 12 02       	subb   $0x2,0x12(%esp)
  4e1295:	80 44 24 13 02       	addb   $0x2,0x13(%esp)
  4e129a:	66 8b 4c 24 12       	mov    0x12(%esp),%cx
  4e129f:	66 89 8c 24 bc 00 00 	mov    %cx,0xbc(%esp)
  4e12a6:	00 
  4e12a7:	80 44 24 12 02       	addb   $0x2,0x12(%esp)
  4e12ac:	66 8b 4c 24 12       	mov    0x12(%esp),%cx
  4e12b1:	66 89 8c 24 c4 00 00 	mov    %cx,0xc4(%esp)
  4e12b8:	00 
  4e12b9:	80 44 24 12 02       	addb   $0x2,0x12(%esp)
  4e12be:	66 8b 4c 24 12       	mov    0x12(%esp),%cx
  4e12c3:	66 89 8c 24 cc 00 00 	mov    %cx,0xcc(%esp)
  4e12ca:	00 
  4e12cb:	80 6c 24 13 02       	subb   $0x2,0x13(%esp)
  4e12d0:	66 8b 4c 24 12       	mov    0x12(%esp),%cx
  4e12d5:	66 89 8c 24 d4 00 00 	mov    %cx,0xd4(%esp)
  4e12dc:	00 
  4e12dd:	80 6c 24 13 02       	subb   $0x2,0x13(%esp)
  4e12e2:	66 8b 4c 24 12       	mov    0x12(%esp),%cx
  4e12e7:	66 89 8c 24 dc 00 00 	mov    %cx,0xdc(%esp)
  4e12ee:	00 
  4e12ef:	80 6c 24 12 02       	subb   $0x2,0x12(%esp)
  4e12f4:	66 8b 4c 24 12       	mov    0x12(%esp),%cx
  4e12f9:	66 89 8c 24 e4 00 00 	mov    %cx,0xe4(%esp)
  4e1300:	00 
  4e1301:	80 6c 24 12 02       	subb   $0x2,0x12(%esp)
  4e1306:	66 8b 4c 24 12       	mov    0x12(%esp),%cx
  4e130b:	66 89 8c 24 ec 00 00 	mov    %cx,0xec(%esp)
  4e1312:	00 
  4e1313:	33 c0                	xor    %eax,%eax
  4e1315:	80 44 24 13 02       	addb   $0x2,0x13(%esp)
  4e131a:	66 8b 4c 24 12       	mov    0x12(%esp),%cx
  4e131f:	66 8b 84 24 bc 00 00 	mov    0xbc(%esp),%ax
  4e1326:	00 
  4e1327:	80 44 24 12 02       	addb   $0x2,0x12(%esp)
  4e132c:	66 89 8c 24 f4 00 00 	mov    %cx,0xf4(%esp)
  4e1333:	00 
  4e1334:	25 fe 00 00 00       	and    $0xfe,%eax
  4e1339:	66 8b 4c 24 12       	mov    0x12(%esp),%cx
  4e133e:	03 c0                	add    %eax,%eax
  4e1340:	66 89 8c 24 fc 00 00 	mov    %cx,0xfc(%esp)
  4e1347:	00 
  4e1348:	33 c9                	xor    %ecx,%ecx
  4e134a:	66 8b 8c 24 bc 00 00 	mov    0xbc(%esp),%cx
  4e1351:	00 
  4e1352:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4e1358:	0b c1                	or     %ecx,%eax
  4e135a:	33 c9                	xor    %ecx,%ecx
  4e135c:	66 8b 8c 24 c4 00 00 	mov    0xc4(%esp),%cx
  4e1363:	00 
  4e1364:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4e136b:	33 c0                	xor    %eax,%eax
  4e136d:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4e1373:	66 8b 84 24 c4 00 00 	mov    0xc4(%esp),%ax
  4e137a:	00 
  4e137b:	89 94 24 b8 00 00 00 	mov    %edx,0xb8(%esp)
  4e1382:	25 fe 00 00 00       	and    $0xfe,%eax
  4e1387:	03 c0                	add    %eax,%eax
  4e1389:	0b c1                	or     %ecx,%eax
  4e138b:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4e1392:	33 c0                	xor    %eax,%eax
  4e1394:	66 8b 84 24 cc 00 00 	mov    0xcc(%esp),%ax
  4e139b:	00 
  4e139c:	89 94 24 c0 00 00 00 	mov    %edx,0xc0(%esp)
  4e13a3:	25 fe 00 00 00       	and    $0xfe,%eax
  4e13a8:	03 c0                	add    %eax,%eax
  4e13aa:	33 c9                	xor    %ecx,%ecx
  4e13ac:	66 8b 8c 24 cc 00 00 	mov    0xcc(%esp),%cx
  4e13b3:	00 
  4e13b4:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4e13ba:	0b c1                	or     %ecx,%eax
  4e13bc:	33 c9                	xor    %ecx,%ecx
  4e13be:	66 8b 8c 24 d4 00 00 	mov    0xd4(%esp),%cx
  4e13c5:	00 
  4e13c6:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4e13cd:	33 c0                	xor    %eax,%eax
  4e13cf:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4e13d5:	66 8b 84 24 d4 00 00 	mov    0xd4(%esp),%ax
  4e13dc:	00 
  4e13dd:	89 94 24 c8 00 00 00 	mov    %edx,0xc8(%esp)
  4e13e4:	25 fe 00 00 00       	and    $0xfe,%eax
  4e13e9:	03 c0                	add    %eax,%eax
  4e13eb:	0b c1                	or     %ecx,%eax
  4e13ed:	33 c9                	xor    %ecx,%ecx
  4e13ef:	66 8b 8c 24 dc 00 00 	mov    0xdc(%esp),%cx
  4e13f6:	00 
  4e13f7:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4e13fe:	33 c0                	xor    %eax,%eax
  4e1400:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4e1406:	66 8b 84 24 dc 00 00 	mov    0xdc(%esp),%ax
  4e140d:	00 
  4e140e:	89 94 24 d0 00 00 00 	mov    %edx,0xd0(%esp)
  4e1415:	25 fe 00 00 00       	and    $0xfe,%eax
  4e141a:	03 c0                	add    %eax,%eax
  4e141c:	0b c1                	or     %ecx,%eax
  4e141e:	33 c9                	xor    %ecx,%ecx
  4e1420:	66 8b 8c 24 e4 00 00 	mov    0xe4(%esp),%cx
  4e1427:	00 
  4e1428:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4e142f:	33 c0                	xor    %eax,%eax
  4e1431:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4e1437:	66 8b 84 24 e4 00 00 	mov    0xe4(%esp),%ax
  4e143e:	00 
  4e143f:	89 94 24 d8 00 00 00 	mov    %edx,0xd8(%esp)
  4e1446:	25 fe 00 00 00       	and    $0xfe,%eax
  4e144b:	03 c0                	add    %eax,%eax
  4e144d:	0b c1                	or     %ecx,%eax
  4e144f:	33 c9                	xor    %ecx,%ecx
  4e1451:	66 8b 8c 24 ec 00 00 	mov    0xec(%esp),%cx
  4e1458:	00 
  4e1459:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4e1460:	33 c0                	xor    %eax,%eax
  4e1462:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4e1468:	66 8b 84 24 ec 00 00 	mov    0xec(%esp),%ax
  4e146f:	00 
  4e1470:	89 94 24 e0 00 00 00 	mov    %edx,0xe0(%esp)
  4e1477:	25 fe 00 00 00       	and    $0xfe,%eax
  4e147c:	03 c0                	add    %eax,%eax
  4e147e:	0b c1                	or     %ecx,%eax
  4e1480:	33 c9                	xor    %ecx,%ecx
  4e1482:	66 8b 8c 24 f4 00 00 	mov    0xf4(%esp),%cx
  4e1489:	00 
  4e148a:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4e1491:	33 c0                	xor    %eax,%eax
  4e1493:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4e1499:	66 8b 84 24 f4 00 00 	mov    0xf4(%esp),%ax
  4e14a0:	00 
  4e14a1:	89 94 24 e8 00 00 00 	mov    %edx,0xe8(%esp)
  4e14a8:	25 fe 00 00 00       	and    $0xfe,%eax
  4e14ad:	03 c0                	add    %eax,%eax
  4e14af:	0b c1                	or     %ecx,%eax
  4e14b1:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4e14b8:	33 c0                	xor    %eax,%eax
  4e14ba:	66 8b 44 24 12       	mov    0x12(%esp),%ax
  4e14bf:	89 94 24 f0 00 00 00 	mov    %edx,0xf0(%esp)
  4e14c6:	25 fe 00 00 00       	and    $0xfe,%eax
  4e14cb:	03 c0                	add    %eax,%eax
  4e14cd:	33 c9                	xor    %ecx,%ecx
  4e14cf:	66 8b 4c 24 12       	mov    0x12(%esp),%cx
  4e14d4:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4e14da:	0b c1                	or     %ecx,%eax
  4e14dc:	8b 2d 5c 48 5d 00    	mov    0x5d485c,%ebp
  4e14e2:	b9 58 48 5d 00       	mov    $0x5d4858,%ecx
  4e14e7:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4e14ee:	89 94 24 f8 00 00 00 	mov    %edx,0xf8(%esp)
  4e14f5:	8d 94 24 ac 00 00 00 	lea    0xac(%esp),%edx
  4e14fc:	8b 01                	mov    (%ecx),%eax
  4e14fe:	8b 49 08             	mov    0x8(%ecx),%ecx
  4e1501:	89 02                	mov    %eax,(%edx)
  4e1503:	89 6a 04             	mov    %ebp,0x4(%edx)
  4e1506:	8d ac 24 b8 00 00 00 	lea    0xb8(%esp),%ebp
  4e150d:	89 4a 08             	mov    %ecx,0x8(%edx)
  4e1510:	8b 45 00             	mov    0x0(%ebp),%eax
  4e1513:	0f bf 48 06          	movswl 0x6(%eax),%ecx
  4e1517:	8b 34 8d 90 03 89 00 	mov    0x890390(,%ecx,4),%esi
  4e151e:	85 f6                	test   %esi,%esi
  4e1520:	74 63                	je     0x4e1585
  4e1522:	3b fe                	cmp    %esi,%edi
  4e1524:	74 4e                	je     0x4e1574
  4e1526:	80 7e 2a 01          	cmpb   $0x1,0x2a(%esi)
  4e152a:	75 48                	jne    0x4e1574
  4e152c:	8a 46 2f             	mov    0x2f(%esi),%al
  4e152f:	38 47 2f             	cmp    %al,0x2f(%edi)
  4e1532:	75 40                	jne    0x4e1574
  4e1534:	80 7e 2c 29          	cmpb   $0x29,0x2c(%esi)
  4e1538:	75 3a                	jne    0x4e1574
  4e153a:	80 7e 2d 01          	cmpb   $0x1,0x2d(%esi)
  4e153e:	75 34                	jne    0x4e1574
  4e1540:	8d 46 3d             	lea    0x3d(%esi),%eax
  4e1543:	8d 4f 3d             	lea    0x3d(%edi),%ecx
  4e1546:	50                   	push   %eax
  4e1547:	51                   	push   %ecx
  4e1548:	e8 03 ef f6 ff       	call   0x450450
  4e154d:	83 c4 08             	add    $0x8,%esp
  4e1550:	3d 00 71 02 00       	cmp    $0x27100,%eax
  4e1555:	7f 1d                	jg     0x4e1574
  4e1557:	43                   	inc    %ebx
  4e1558:	33 c0                	xor    %eax,%eax
  4e155a:	8a 86 a8 00 00 00    	mov    0xa8(%esi),%al
  4e1560:	c1 e0 02             	shl    $0x2,%eax
  4e1563:	66 0f be 8c 04 af 00 	movsbw 0xaf(%esp,%eax,1),%cx
  4e156a:	00 00 
  4e156c:	66 01 8c 04 ac 00 00 	add    %cx,0xac(%esp,%eax,1)
  4e1573:	00 
  4e1574:	33 c0                	xor    %eax,%eax
  4e1576:	66 8b 46 20          	mov    0x20(%esi),%ax
  4e157a:	8b 34 85 90 03 89 00 	mov    0x890390(,%eax,4),%esi
  4e1581:	85 f6                	test   %esi,%esi
  4e1583:	75 9d                	jne    0x4e1522
  4e1585:	83 c5 08             	add    $0x8,%ebp
  4e1588:	8d 84 24 00 01 00 00 	lea    0x100(%esp),%eax
  4e158f:	3b e8                	cmp    %eax,%ebp
  4e1591:	0f 82 79 ff ff ff    	jb     0x4e1510
  4e1597:	85 db                	test   %ebx,%ebx
  4e1599:	74 3e                	je     0x4e15d9
  4e159b:	b8 01 00 00 00       	mov    $0x1,%eax
  4e15a0:	8d b4 24 ac 00 00 00 	lea    0xac(%esp),%esi
  4e15a7:	b9 02 00 00 00       	mov    $0x2,%ecx
  4e15ac:	8d 56 04             	lea    0x4(%esi),%edx
  4e15af:	66 8b 1a             	mov    (%edx),%bx
  4e15b2:	66 39 1e             	cmp    %bx,(%esi)
  4e15b5:	7e 0a                	jle    0x4e15c1
  4e15b7:	8b 02                	mov    (%edx),%eax
  4e15b9:	8b 1e                	mov    (%esi),%ebx
  4e15bb:	89 1a                	mov    %ebx,(%edx)
  4e15bd:	89 06                	mov    %eax,(%esi)
  4e15bf:	33 c0                	xor    %eax,%eax
  4e15c1:	8b f2                	mov    %edx,%esi
  4e15c3:	49                   	dec    %ecx
  4e15c4:	75 e6                	jne    0x4e15ac
  4e15c6:	85 c0                	test   %eax,%eax
  4e15c8:	74 d1                	je     0x4e159b
  4e15ca:	33 c0                	xor    %eax,%eax
  4e15cc:	8a 84 24 ae 00 00 00 	mov    0xae(%esp),%al
  4e15d3:	89 44 24 5c          	mov    %eax,0x5c(%esp)
  4e15d7:	eb 08                	jmp    0x4e15e1
  4e15d9:	c7 44 24 64 01 00 00 	movl   $0x1,0x64(%esp)
  4e15e0:	00 
  4e15e1:	83 7c 24 64 00       	cmpl   $0x0,0x64(%esp)
  4e15e6:	74 54                	je     0x4e163c
  4e15e8:	c6 87 a9 00 00 00 00 	movb   $0x0,0xa9(%edi)
  4e15ef:	83 7c 24 24 00       	cmpl   $0x0,0x24(%esp)
  4e15f4:	75 46                	jne    0x4e163c
  4e15f6:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e15fb:	8b c8                	mov    %eax,%ecx
  4e15fd:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e1600:	8d 04 d1             	lea    (%ecx,%edx,8),%eax
  4e1603:	8d 04 81             	lea    (%ecx,%eax,4),%eax
  4e1606:	c1 e0 02             	shl    $0x2,%eax
  4e1609:	8d 04 c1             	lea    (%ecx,%eax,8),%eax
  4e160c:	05 df 24 00 00       	add    $0x24df,%eax
  4e1611:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e1616:	89 44 24 60          	mov    %eax,0x60(%esp)
  4e161a:	c1 4c 24 60 0d       	rorl   $0xd,0x60(%esp)
  4e161f:	8b 44 24 60          	mov    0x60(%esp),%eax
  4e1623:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e1628:	24 07                	and    $0x7,%al
  4e162a:	3c 04                	cmp    $0x4,%al
  4e162c:	b8 02 00 00 00       	mov    $0x2,%eax
  4e1631:	73 05                	jae    0x4e1638
  4e1633:	b8 01 00 00 00       	mov    $0x1,%eax
  4e1638:	89 44 24 5c          	mov    %eax,0x5c(%esp)
  4e163c:	80 4f 76 10          	orb    $0x10,0x76(%edi)
  4e1640:	80 7f 2b 06          	cmpb   $0x6,0x2b(%edi)
  4e1644:	8a 44 24 5c          	mov    0x5c(%esp),%al
  4e1648:	88 87 a8 00 00 00    	mov    %al,0xa8(%edi)
  4e164e:	0f 85 89 0f 00 00    	jne    0x4e25dd
  4e1654:	8b 0d 78 d1 89 00    	mov    0x89d178,%ecx
  4e165a:	8b c1                	mov    %ecx,%eax
  4e165c:	8d 14 c9             	lea    (%ecx,%ecx,8),%edx
  4e165f:	8d 0c d0             	lea    (%eax,%edx,8),%ecx
  4e1662:	8d 0c 88             	lea    (%eax,%ecx,4),%ecx
  4e1665:	c1 e1 02             	shl    $0x2,%ecx
  4e1668:	8d 0c c8             	lea    (%eax,%ecx,8),%ecx
  4e166b:	81 c1 df 24 00 00    	add    $0x24df,%ecx
  4e1671:	89 0d 78 d1 89 00    	mov    %ecx,0x89d178
  4e1677:	89 4c 24 58          	mov    %ecx,0x58(%esp)
  4e167b:	c1 4c 24 58 0d       	rorl   $0xd,0x58(%esp)
  4e1680:	8b 44 24 58          	mov    0x58(%esp),%eax
  4e1684:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e1689:	a8 03                	test   $0x3,%al
  4e168b:	0f 85 4c 0f 00 00    	jne    0x4e25dd
  4e1691:	c6 47 2d 02          	movb   $0x2,0x2d(%edi)
  4e1695:	81 4f 0c 00 00 00 40 	orl    $0x40000000,0xc(%edi)
  4e169c:	e9 3c 0f 00 00       	jmp    0x4e25dd
  4e16a1:	8b 47 0c             	mov    0xc(%edi),%eax
  4e16a4:	a9 00 00 00 40       	test   $0x40000000,%eax
  4e16a9:	74 13                	je     0x4e16be
  4e16ab:	c6 87 a8 00 00 00 01 	movb   $0x1,0xa8(%edi)
  4e16b2:	80 4f 76 10          	orb    $0x10,0x76(%edi)
  4e16b6:	25 ff ff ff bf       	and    $0xbfffffff,%eax
  4e16bb:	89 47 0c             	mov    %eax,0xc(%edi)
  4e16be:	33 c0                	xor    %eax,%eax
  4e16c0:	8a 87 a8 00 00 00    	mov    0xa8(%edi),%al
  4e16c6:	83 f8 01             	cmp    $0x1,%eax
  4e16c9:	74 0e                	je     0x4e16d9
  4e16cb:	83 f8 02             	cmp    $0x2,%eax
  4e16ce:	0f 84 05 01 00 00    	je     0x4e17d9
  4e16d4:	e9 04 0f 00 00       	jmp    0x4e25dd
  4e16d9:	66 8b 47 76          	mov    0x76(%edi),%ax
  4e16dd:	a8 10                	test   $0x10,%al
  4e16df:	0f 84 da 00 00 00    	je     0x4e17bf
  4e16e5:	66 25 ef ff          	and    $0xffef,%ax
  4e16e9:	8b 4f 0c             	mov    0xc(%edi),%ecx
  4e16ec:	f7 c1 00 00 08 00    	test   $0x80000,%ecx
  4e16f2:	66 c7 47 5f 00 00    	movw   $0x0,0x5f(%edi)
  4e16f8:	66 89 47 76          	mov    %ax,0x76(%edi)
  4e16fc:	66 b8 0f 00          	mov    $0xf,%ax
  4e1700:	74 17                	je     0x4e1719
  4e1702:	f6 47 11 04          	testb  $0x4,0x11(%edi)
  4e1706:	66 b8 0c 00          	mov    $0xc,%ax
  4e170a:	75 0d                	jne    0x4e1719
  4e170c:	66 b8 02 00          	mov    $0x2,%ax
  4e1710:	81 e1 ff 7f ff ff    	and    $0xffff7fff,%ecx
  4e1716:	89 4f 0c             	mov    %ecx,0xc(%edi)
  4e1719:	0f bf c0             	movswl %ax,%eax
  4e171c:	33 c9                	xor    %ecx,%ecx
  4e171e:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e1721:	8a 4f 2b             	mov    0x2b(%edi),%cl
  4e1724:	03 ca                	add    %edx,%ecx
  4e1726:	66 8b 04 4d 50 6d 5a 	mov    0x5a6d50(,%ecx,2),%ax
  4e172d:	00 
  4e172e:	50                   	push   %eax
  4e172f:	57                   	push   %edi
  4e1730:	e8 0b 29 ff ff       	call   0x4d4040
  4e1735:	83 c4 08             	add    $0x8,%esp
  4e1738:	33 c9                	xor    %ecx,%ecx
  4e173a:	c6 47 39 00          	movb   $0x0,0x39(%edi)
  4e173e:	66 c7 47 37 01 00    	movw   $0x1,0x37(%edi)
  4e1744:	8a 4f 3a             	mov    0x3a(%edi),%cl
  4e1747:	8b 2d 44 df 59 00    	mov    0x59df44,%ebp
  4e174d:	8b c1                	mov    %ecx,%eax
  4e174f:	8d 1c 89             	lea    (%ecx,%ecx,4),%ebx
  4e1752:	66 0f be 94 58 fb 6a 	movsbw 0x5a6afb(%eax,%ebx,2),%dx
  4e1759:	5a 00 
  4e175b:	0f bf 4f 33          	movswl 0x33(%edi),%ecx
  4e175f:	66 42                	inc    %dx
  4e1761:	8d 1c 49             	lea    (%ecx,%ecx,2),%ebx
  4e1764:	66 0f b6 44 5d 01    	movzbw 0x1(%ebp,%ebx,2),%ax
  4e176a:	66 0f af d0          	imul   %ax,%dx
  4e176e:	66 89 57 70          	mov    %dx,0x70(%edi)
  4e1772:	8d 47 3d             	lea    0x3d(%edi),%eax
  4e1775:	8d 94 24 9c 00 00 00 	lea    0x9c(%esp),%edx
  4e177c:	68 00 05 00 00       	push   $0x500
  4e1781:	8b 08                	mov    (%eax),%ecx
  4e1783:	66 8b 40 04          	mov    0x4(%eax),%ax
  4e1787:	89 0a                	mov    %ecx,(%edx)
  4e1789:	66 89 42 04          	mov    %ax,0x4(%edx)
  4e178d:	8d 8c 24 a0 00 00 00 	lea    0xa0(%esp),%ecx
  4e1794:	66 8b 57 5d          	mov    0x5d(%edi),%dx
  4e1798:	52                   	push   %edx
  4e1799:	51                   	push   %ecx
  4e179a:	e8 d1 52 00 00       	call   0x4e6a70
  4e179f:	8d 8c 24 a8 00 00 00 	lea    0xa8(%esp),%ecx
  4e17a6:	83 c4 0c             	add    $0xc,%esp
  4e17a9:	66 81 84 24 a0 00 00 	addw   $0xc00,0xa0(%esp)
  4e17b0:	00 00 0c 
  4e17b3:	51                   	push   %ecx
  4e17b4:	6a 00                	push   $0x0
  4e17b6:	57                   	push   %edi
  4e17b7:	e8 34 e4 03 00       	call   0x51fbf0
  4e17bc:	83 c4 0c             	add    $0xc,%esp
  4e17bf:	66 ff 4f 70          	decw   0x70(%edi)
  4e17c3:	0f 85 14 0e 00 00    	jne    0x4e25dd
  4e17c9:	c6 87 a8 00 00 00 02 	movb   $0x2,0xa8(%edi)
  4e17d0:	80 4f 76 10          	orb    $0x10,0x76(%edi)
  4e17d4:	e9 04 0e 00 00       	jmp    0x4e25dd
  4e17d9:	66 8b 47 76          	mov    0x76(%edi),%ax
  4e17dd:	a8 10                	test   $0x10,%al
  4e17df:	74 6b                	je     0x4e184c
  4e17e1:	66 25 ef ff          	and    $0xffef,%ax
  4e17e5:	8b 4f 0c             	mov    0xc(%edi),%ecx
  4e17e8:	f7 c1 00 00 08 00    	test   $0x80000,%ecx
  4e17ee:	66 89 47 76          	mov    %ax,0x76(%edi)
  4e17f2:	66 b8 0f 00          	mov    $0xf,%ax
  4e17f6:	74 17                	je     0x4e180f
  4e17f8:	f6 47 11 04          	testb  $0x4,0x11(%edi)
  4e17fc:	66 b8 0c 00          	mov    $0xc,%ax
  4e1800:	75 0d                	jne    0x4e180f
  4e1802:	66 b8 02 00          	mov    $0x2,%ax
  4e1806:	81 e1 ff 7f ff ff    	and    $0xffff7fff,%ecx
  4e180c:	89 4f 0c             	mov    %ecx,0xc(%edi)
  4e180f:	0f bf c0             	movswl %ax,%eax
  4e1812:	33 c9                	xor    %ecx,%ecx
  4e1814:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e1817:	8a 4f 2b             	mov    0x2b(%edi),%cl
  4e181a:	03 ca                	add    %edx,%ecx
  4e181c:	66 8b 04 4d 50 6d 5a 	mov    0x5a6d50(,%ecx,2),%ax
  4e1823:	00 
  4e1824:	50                   	push   %eax
  4e1825:	57                   	push   %edi
  4e1826:	e8 15 28 ff ff       	call   0x4d4040
  4e182b:	66 c7 47 37 01 00    	movw   $0x1,0x37(%edi)
  4e1831:	c6 47 39 00          	movb   $0x0,0x39(%edi)
  4e1835:	c6 47 39 00          	movb   $0x0,0x39(%edi)
  4e1839:	80 4f 35 02          	orb    $0x2,0x35(%edi)
  4e183d:	66 c7 47 37 01 00    	movw   $0x1,0x37(%edi)
  4e1843:	66 c7 47 70 10 00    	movw   $0x10,0x70(%edi)
  4e1849:	83 c4 08             	add    $0x8,%esp
  4e184c:	66 ff 4f 70          	decw   0x70(%edi)
  4e1850:	0f 85 87 0d 00 00    	jne    0x4e25dd
  4e1856:	c6 47 2d 01          	movb   $0x1,0x2d(%edi)
  4e185a:	81 4f 0c 00 00 00 40 	orl    $0x40000000,0xc(%edi)
  4e1861:	e9 77 0d 00 00       	jmp    0x4e25dd
  4e1866:	8b 47 0c             	mov    0xc(%edi),%eax
  4e1869:	a9 00 00 00 40       	test   $0x40000000,%eax
  4e186e:	0f 84 46 01 00 00    	je     0x4e19ba
  4e1874:	25 ff ff ff bf       	and    $0xbfffffff,%eax
  4e1879:	89 47 0c             	mov    %eax,0xc(%edi)
  4e187c:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e1881:	8b c8                	mov    %eax,%ecx
  4e1883:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e1886:	8d 04 d1             	lea    (%ecx,%edx,8),%eax
  4e1889:	8d 04 81             	lea    (%ecx,%eax,4),%eax
  4e188c:	c1 e0 02             	shl    $0x2,%eax
  4e188f:	8d 04 c1             	lea    (%ecx,%eax,8),%eax
  4e1892:	05 df 24 00 00       	add    $0x24df,%eax
  4e1897:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e189c:	89 44 24 54          	mov    %eax,0x54(%esp)
  4e18a0:	c1 4c 24 54 0d       	rorl   $0xd,0x54(%esp)
  4e18a5:	8b 44 24 54          	mov    0x54(%esp),%eax
  4e18a9:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e18ae:	24 1f                	and    $0x1f,%al
  4e18b0:	04 28                	add    $0x28,%al
  4e18b2:	88 87 aa 00 00 00    	mov    %al,0xaa(%edi)
  4e18b8:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e18bd:	8b c8                	mov    %eax,%ecx
  4e18bf:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e18c2:	8d 04 d1             	lea    (%ecx,%edx,8),%eax
  4e18c5:	8d 04 81             	lea    (%ecx,%eax,4),%eax
  4e18c8:	c1 e0 02             	shl    $0x2,%eax
  4e18cb:	8d 04 c1             	lea    (%ecx,%eax,8),%eax
  4e18ce:	05 df 24 00 00       	add    $0x24df,%eax
  4e18d3:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e18d8:	89 44 24 50          	mov    %eax,0x50(%esp)
  4e18dc:	c1 4c 24 50 0d       	rorl   $0xd,0x50(%esp)
  4e18e1:	8b 44 24 50          	mov    0x50(%esp),%eax
  4e18e5:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e18ea:	66 25 ff 07          	and    $0x7ff,%ax
  4e18ee:	66 83 7f 78 00       	cmpw   $0x0,0x78(%edi)
  4e18f3:	66 89 47 70          	mov    %ax,0x70(%edi)
  4e18f7:	75 35                	jne    0x4e192e
  4e18f9:	33 c0                	xor    %eax,%eax
  4e18fb:	8a 47 2b             	mov    0x2b(%edi),%al
  4e18fe:	66 0f b6 04 45 ce 6d 	movzbw 0x5a6dce(,%eax,2),%ax
  4e1905:	5a 00 
  4e1907:	50                   	push   %eax
  4e1908:	57                   	push   %edi
  4e1909:	e8 32 27 ff ff       	call   0x4d4040
  4e190e:	83 c4 08             	add    $0x8,%esp
  4e1911:	33 c9                	xor    %ecx,%ecx
  4e1913:	c6 47 39 00          	movb   $0x0,0x39(%edi)
  4e1917:	8a 4f 3a             	mov    0x3a(%edi),%cl
  4e191a:	8b c1                	mov    %ecx,%eax
  4e191c:	8d 14 89             	lea    (%ecx,%ecx,4),%edx
  4e191f:	66 0f be 84 50 f9 6a 	movsbw 0x5a6af9(%eax,%edx,2),%ax
  4e1926:	5a 00 
  4e1928:	66 89 47 37          	mov    %ax,0x37(%edi)
  4e192c:	eb 18                	jmp    0x4e1946
  4e192e:	33 c0                	xor    %eax,%eax
  4e1930:	8a 47 2b             	mov    0x2b(%edi),%al
  4e1933:	66 0f b6 04 45 98 6d 	movzbw 0x5a6d98(,%eax,2),%ax
  4e193a:	5a 00 
  4e193c:	50                   	push   %eax
  4e193d:	57                   	push   %edi
  4e193e:	e8 fd 26 ff ff       	call   0x4d4040
  4e1943:	83 c4 08             	add    $0x8,%esp
  4e1946:	33 c9                	xor    %ecx,%ecx
  4e1948:	8a 4f 30             	mov    0x30(%edi),%cl
  4e194b:	8b c1                	mov    %ecx,%eax
  4e194d:	8d 14 89             	lea    (%ecx,%ecx,4),%edx
  4e1950:	80 4f 76 80          	orb    $0x80,0x76(%edi)
  4e1954:	8d 0c 92             	lea    (%edx,%edx,4),%ecx
  4e1957:	0f bf 8c 01 94 7b 5a 	movswl 0x5a7b94(%ecx,%eax,1),%ecx
  4e195e:	00 
  4e195f:	8b f1                	mov    %ecx,%esi
  4e1961:	c1 fe 02             	sar    $0x2,%esi
  4e1964:	85 f6                	test   %esi,%esi
  4e1966:	75 05                	jne    0x4e196d
  4e1968:	be 01 00 00 00       	mov    $0x1,%esi
  4e196d:	8b 15 78 d1 89 00    	mov    0x89d178,%edx
  4e1973:	8b c2                	mov    %edx,%eax
  4e1975:	8d 1c d2             	lea    (%edx,%edx,8),%ebx
  4e1978:	8d 14 d8             	lea    (%eax,%ebx,8),%edx
  4e197b:	8d 14 90             	lea    (%eax,%edx,4),%edx
  4e197e:	c1 e2 02             	shl    $0x2,%edx
  4e1981:	8d 14 d0             	lea    (%eax,%edx,8),%edx
  4e1984:	81 c2 df 24 00 00    	add    $0x24df,%edx
  4e198a:	89 15 78 d1 89 00    	mov    %edx,0x89d178
  4e1990:	89 54 24 4c          	mov    %edx,0x4c(%esp)
  4e1994:	c1 4c 24 4c 0d       	rorl   $0xd,0x4c(%esp)
  4e1999:	8b 44 24 4c          	mov    0x4c(%esp),%eax
  4e199d:	2b d2                	sub    %edx,%edx
  4e199f:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e19a4:	f7 f6                	div    %esi
  4e19a6:	8d 04 11             	lea    (%ecx,%edx,1),%eax
  4e19a9:	f6 47 16 08          	testb  $0x8,0x16(%edi)
  4e19ad:	66 89 47 5f          	mov    %ax,0x5f(%edi)
  4e19b1:	74 07                	je     0x4e19ba
  4e19b3:	66 03 c0             	add    %ax,%ax
  4e19b6:	66 89 47 5f          	mov    %ax,0x5f(%edi)
  4e19ba:	66 8b 57 3f          	mov    0x3f(%edi),%dx
  4e19be:	8d 4f 3d             	lea    0x3d(%edi),%ecx
  4e19c1:	66 8b 01             	mov    (%ecx),%ax
  4e19c4:	88 74 24 19          	mov    %dh,0x19(%esp)
  4e19c8:	33 d2                	xor    %edx,%edx
  4e19ca:	88 64 24 18          	mov    %ah,0x18(%esp)
  4e19ce:	66 8b 54 24 18       	mov    0x18(%esp),%dx
  4e19d3:	33 c0                	xor    %eax,%eax
  4e19d5:	66 8b 44 24 18       	mov    0x18(%esp),%ax
  4e19da:	81 e2 00 fe 00 00    	and    $0xfe00,%edx
  4e19e0:	c7 44 24 2c 00 00 00 	movl   $0x0,0x2c(%esp)
  4e19e7:	00 
  4e19e8:	25 fe 00 00 00       	and    $0xfe,%eax
  4e19ed:	03 c0                	add    %eax,%eax
  4e19ef:	0b c2                	or     %edx,%eax
  4e19f1:	0f bf 2c 85 ea 03 8a 	movswl 0x8a03ea(,%eax,4),%ebp
  4e19f8:	00 
  4e19f9:	8d 1c 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%ebx
  4e1a00:	8b 14 ad 90 03 89 00 	mov    0x890390(,%ebp,4),%edx
  4e1a07:	85 d2                	test   %edx,%edx
  4e1a09:	74 38                	je     0x4e1a43
  4e1a0b:	80 7a 2a 01          	cmpb   $0x1,0x2a(%edx)
  4e1a0f:	75 21                	jne    0x4e1a32
  4e1a11:	8a 42 2f             	mov    0x2f(%edx),%al
  4e1a14:	38 47 2f             	cmp    %al,0x2f(%edi)
  4e1a17:	75 19                	jne    0x4e1a32
  4e1a19:	80 7a 2c 29          	cmpb   $0x29,0x2c(%edx)
  4e1a1d:	75 13                	jne    0x4e1a32
  4e1a1f:	8a 42 2d             	mov    0x2d(%edx),%al
  4e1a22:	3c 03                	cmp    $0x3,%al
  4e1a24:	74 04                	je     0x4e1a2a
  4e1a26:	3c 04                	cmp    $0x4,%al
  4e1a28:	75 08                	jne    0x4e1a32
  4e1a2a:	83 4a 14 10          	orl    $0x10,0x14(%edx)
  4e1a2e:	ff 44 24 2c          	incl   0x2c(%esp)
  4e1a32:	33 c0                	xor    %eax,%eax
  4e1a34:	66 8b 42 20          	mov    0x20(%edx),%ax
  4e1a38:	8b 14 85 90 03 89 00 	mov    0x890390(,%eax,4),%edx
  4e1a3f:	85 d2                	test   %edx,%edx
  4e1a41:	75 c8                	jne    0x4e1a0b
  4e1a43:	83 7c 24 2c 00       	cmpl   $0x0,0x2c(%esp)
  4e1a48:	0f 84 77 02 00 00    	je     0x4e1cc5
  4e1a4e:	b8 00 08 00 00       	mov    $0x800,%eax
  4e1a53:	99                   	cltd
  4e1a54:	f7 7c 24 2c          	idivl  0x2c(%esp)
  4e1a58:	8d 94 24 a4 00 00 00 	lea    0xa4(%esp),%edx
  4e1a5f:	89 84 24 94 00 00 00 	mov    %eax,0x94(%esp)
  4e1a66:	8b 01                	mov    (%ecx),%eax
  4e1a68:	0f bf 77 70          	movswl 0x70(%edi),%esi
  4e1a6c:	66 8b 49 04          	mov    0x4(%ecx),%cx
  4e1a70:	89 02                	mov    %eax,(%edx)
  4e1a72:	66 89 4a 04          	mov    %cx,0x4(%edx)
  4e1a76:	66 8b 84 24 a4 00 00 	mov    0xa4(%esp),%ax
  4e1a7d:	00 
  4e1a7e:	66 25 00 fe          	and    $0xfe00,%ax
  4e1a82:	0f bf 4b 06          	movswl 0x6(%ebx),%ecx
  4e1a86:	66 05 00 01          	add    $0x100,%ax
  4e1a8a:	8b 1c 8d 90 03 89 00 	mov    0x890390(,%ecx,4),%ebx
  4e1a91:	66 89 84 24 a4 00 00 	mov    %ax,0xa4(%esp)
  4e1a98:	00 
  4e1a99:	66 8b 84 24 a6 00 00 	mov    0xa6(%esp),%ax
  4e1aa0:	00 
  4e1aa1:	66 25 00 fe          	and    $0xfe00,%ax
  4e1aa5:	66 05 00 01          	add    $0x100,%ax
  4e1aa9:	85 db                	test   %ebx,%ebx
  4e1aab:	66 89 84 24 a6 00 00 	mov    %ax,0xa6(%esp)
  4e1ab2:	00 
  4e1ab3:	0f 84 f8 01 00 00    	je     0x4e1cb1
  4e1ab9:	8b 43 14             	mov    0x14(%ebx),%eax
  4e1abc:	a8 10                	test   $0x10,%al
  4e1abe:	0f 84 d8 01 00 00    	je     0x4e1c9c
  4e1ac4:	83 e0 ef             	and    $0xffffffef,%eax
  4e1ac7:	8d 94 24 9c 00 00 00 	lea    0x9c(%esp),%edx
  4e1ace:	68 80 00 00 00       	push   $0x80
  4e1ad3:	89 43 14             	mov    %eax,0x14(%ebx)
  4e1ad6:	8b 43 0c             	mov    0xc(%ebx),%eax
  4e1ad9:	56                   	push   %esi
  4e1ada:	0d 00 02 00 00       	or     $0x200,%eax
  4e1adf:	89 43 0c             	mov    %eax,0xc(%ebx)
  4e1ae2:	0d 00 00 20 00       	or     $0x200000,%eax
  4e1ae7:	89 43 0c             	mov    %eax,0xc(%ebx)
  4e1aea:	8d 84 24 ac 00 00 00 	lea    0xac(%esp),%eax
  4e1af1:	8b 08                	mov    (%eax),%ecx
  4e1af3:	66 8b 40 04          	mov    0x4(%eax),%ax
  4e1af7:	89 0a                	mov    %ecx,(%edx)
  4e1af9:	66 89 42 04          	mov    %ax,0x4(%edx)
  4e1afd:	8d 94 24 a4 00 00 00 	lea    0xa4(%esp),%edx
  4e1b04:	52                   	push   %edx
  4e1b05:	e8 66 4f 00 00       	call   0x4e6a70
  4e1b0a:	66 8b 8c 24 a8 00 00 	mov    0xa8(%esp),%cx
  4e1b11:	00 
  4e1b12:	83 c4 0c             	add    $0xc,%esp
  4e1b15:	66 8b 94 24 9e 00 00 	mov    0x9e(%esp),%dx
  4e1b1c:	00 
  4e1b1d:	0f bf c1             	movswl %cx,%eax
  4e1b20:	66 89 4c 24 20       	mov    %cx,0x20(%esp)
  4e1b25:	66 89 54 24 22       	mov    %dx,0x22(%esp)
  4e1b2a:	0f bf 4b 3d          	movswl 0x3d(%ebx),%ecx
  4e1b2e:	2b c1                	sub    %ecx,%eax
  4e1b30:	99                   	cltd
  4e1b31:	33 c2                	xor    %edx,%eax
  4e1b33:	2b c2                	sub    %edx,%eax
  4e1b35:	83 f8 0c             	cmp    $0xc,%eax
  4e1b38:	0f 8d cc 00 00 00    	jge    0x4e1c0a
  4e1b3e:	0f bf 84 24 9e 00 00 	movswl 0x9e(%esp),%eax
  4e1b45:	00 
  4e1b46:	0f bf 4b 3f          	movswl 0x3f(%ebx),%ecx
  4e1b4a:	2b c1                	sub    %ecx,%eax
  4e1b4c:	99                   	cltd
  4e1b4d:	33 c2                	xor    %edx,%eax
  4e1b4f:	2b c2                	sub    %edx,%eax
  4e1b51:	83 f8 0c             	cmp    $0xc,%eax
  4e1b54:	0f 8d b0 00 00 00    	jge    0x4e1c0a
  4e1b5a:	66 c7 43 5f 00 00    	movw   $0x0,0x5f(%ebx)
  4e1b60:	66 8b 84 24 a4 00 00 	mov    0xa4(%esp),%ax
  4e1b67:	00 
  4e1b68:	66 2b 43 3d          	sub    0x3d(%ebx),%ax
  4e1b6c:	0f b7 d0             	movzwl %ax,%edx
  4e1b6f:	66 8b 84 24 a6 00 00 	mov    0xa6(%esp),%ax
  4e1b76:	00 
  4e1b77:	8b ea                	mov    %edx,%ebp
  4e1b79:	66 2b 43 3f          	sub    0x3f(%ebx),%ax
  4e1b7d:	85 d2                	test   %edx,%edx
  4e1b7f:	0f b7 c8             	movzwl %ax,%ecx
  4e1b82:	7d 04                	jge    0x4e1b88
  4e1b84:	8b ea                	mov    %edx,%ebp
  4e1b86:	f7 dd                	neg    %ebp
  4e1b88:	8b c1                	mov    %ecx,%eax
  4e1b8a:	85 c9                	test   %ecx,%ecx
  4e1b8c:	7d 04                	jge    0x4e1b92
  4e1b8e:	8b c1                	mov    %ecx,%eax
  4e1b90:	f7 d8                	neg    %eax
  4e1b92:	81 fd 00 80 00 00    	cmp    $0x8000,%ebp
  4e1b98:	7c 06                	jl     0x4e1ba0
  4e1b9a:	8d 95 00 00 ff ff    	lea    -0x10000(%ebp),%edx
  4e1ba0:	3d 00 80 00 00       	cmp    $0x8000,%eax
  4e1ba5:	7c 06                	jl     0x4e1bad
  4e1ba7:	8d 88 00 00 ff ff    	lea    -0x10000(%eax),%ecx
  4e1bad:	f7 d9                	neg    %ecx
  4e1baf:	51                   	push   %ecx
  4e1bb0:	33 ed                	xor    %ebp,%ebp
  4e1bb2:	52                   	push   %edx
  4e1bb3:	e8 bc 44 0a 00       	call   0x586074
  4e1bb8:	66 8b e8             	mov    %ax,%bp
  4e1bbb:	83 c4 08             	add    $0x8,%esp
  4e1bbe:	81 e5 ff 07 00 00    	and    $0x7ff,%ebp
  4e1bc4:	53                   	push   %ebx
  4e1bc5:	e8 96 88 00 00       	call   0x4ea460
  4e1bca:	83 c4 04             	add    $0x4,%esp
  4e1bcd:	8b 43 0c             	mov    0xc(%ebx),%eax
  4e1bd0:	0d 80 00 00 00       	or     $0x80,%eax
  4e1bd5:	89 43 0c             	mov    %eax,0xc(%ebx)
  4e1bd8:	0d 00 10 00 00       	or     $0x1000,%eax
  4e1bdd:	89 43 0c             	mov    %eax,0xc(%ebx)
  4e1be0:	66 89 6b 57          	mov    %bp,0x57(%ebx)
  4e1be4:	66 89 6b 5d          	mov    %bp,0x5d(%ebx)
  4e1be8:	f6 43 0d 80          	testb  $0x80,0xd(%ebx)
  4e1bec:	74 13                	je     0x4e1c01
  4e1bee:	66 81 c5 00 04       	add    $0x400,%bp
  4e1bf3:	66 81 e5 ff 07       	and    $0x7ff,%bp
  4e1bf8:	66 89 6b 26          	mov    %bp,0x26(%ebx)
  4e1bfc:	e9 8e 00 00 00       	jmp    0x4e1c8f
  4e1c01:	66 89 6b 26          	mov    %bp,0x26(%ebx)
  4e1c05:	e9 85 00 00 00       	jmp    0x4e1c8f
  4e1c0a:	8d 44 24 20          	lea    0x20(%esp),%eax
  4e1c0e:	50                   	push   %eax
  4e1c0f:	53                   	push   %ebx
  4e1c10:	e8 bb 81 00 00       	call   0x4e9dd0
  4e1c15:	83 c4 08             	add    $0x8,%esp
  4e1c18:	66 83 7b 5f 00       	cmpw   $0x0,0x5f(%ebx)
  4e1c1d:	75 70                	jne    0x4e1c8f
  4e1c1f:	33 c0                	xor    %eax,%eax
  4e1c21:	8a 43 30             	mov    0x30(%ebx),%al
  4e1c24:	8b c8                	mov    %eax,%ecx
  4e1c26:	8d 14 80             	lea    (%eax,%eax,4),%edx
  4e1c29:	8d 04 92             	lea    (%edx,%edx,4),%eax
  4e1c2c:	0f bf 8c 08 94 7b 5a 	movswl 0x5a7b94(%eax,%ecx,1),%ecx
  4e1c33:	00 
  4e1c34:	8b e9                	mov    %ecx,%ebp
  4e1c36:	c1 fd 02             	sar    $0x2,%ebp
  4e1c39:	85 ed                	test   %ebp,%ebp
  4e1c3b:	75 05                	jne    0x4e1c42
  4e1c3d:	bd 01 00 00 00       	mov    $0x1,%ebp
  4e1c42:	8b 15 78 d1 89 00    	mov    0x89d178,%edx
  4e1c48:	8b c2                	mov    %edx,%eax
  4e1c4a:	8d 14 d2             	lea    (%edx,%edx,8),%edx
  4e1c4d:	8d 14 d0             	lea    (%eax,%edx,8),%edx
  4e1c50:	8d 14 90             	lea    (%eax,%edx,4),%edx
  4e1c53:	c1 e2 02             	shl    $0x2,%edx
  4e1c56:	8d 14 d0             	lea    (%eax,%edx,8),%edx
  4e1c59:	81 c2 df 24 00 00    	add    $0x24df,%edx
  4e1c5f:	89 15 78 d1 89 00    	mov    %edx,0x89d178
  4e1c65:	89 54 24 48          	mov    %edx,0x48(%esp)
  4e1c69:	c1 4c 24 48 0d       	rorl   $0xd,0x48(%esp)
  4e1c6e:	8b 44 24 48          	mov    0x48(%esp),%eax
  4e1c72:	2b d2                	sub    %edx,%edx
  4e1c74:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e1c79:	f7 f5                	div    %ebp
  4e1c7b:	8d 04 11             	lea    (%ecx,%edx,1),%eax
  4e1c7e:	66 89 43 5f          	mov    %ax,0x5f(%ebx)
  4e1c82:	f6 43 16 08          	testb  $0x8,0x16(%ebx)
  4e1c86:	74 07                	je     0x4e1c8f
  4e1c88:	66 03 c0             	add    %ax,%ax
  4e1c8b:	66 89 43 5f          	mov    %ax,0x5f(%ebx)
  4e1c8f:	03 b4 24 94 00 00 00 	add    0x94(%esp),%esi
  4e1c96:	81 e6 ff 07 00 00    	and    $0x7ff,%esi
  4e1c9c:	33 c0                	xor    %eax,%eax
  4e1c9e:	66 8b 43 20          	mov    0x20(%ebx),%ax
  4e1ca2:	8b 1c 85 90 03 89 00 	mov    0x890390(,%eax,4),%ebx
  4e1ca9:	85 db                	test   %ebx,%ebx
  4e1cab:	0f 85 08 fe ff ff    	jne    0x4e1ab9
  4e1cb1:	83 7c 24 2c 06       	cmpl   $0x6,0x2c(%esp)
  4e1cb6:	7c 14                	jl     0x4e1ccc
  4e1cb8:	c6 47 2d 05          	movb   $0x5,0x2d(%edi)
  4e1cbc:	81 4f 0c 00 00 00 40 	orl    $0x40000000,0xc(%edi)
  4e1cc3:	eb 07                	jmp    0x4e1ccc
  4e1cc5:	c6 87 aa 00 00 00 00 	movb   $0x0,0xaa(%edi)
  4e1ccc:	f6 47 2e 07          	testb  $0x7,0x2e(%edi)
  4e1cd0:	75 10                	jne    0x4e1ce2
  4e1cd2:	66 8b 47 70          	mov    0x70(%edi),%ax
  4e1cd6:	66 05 5b 00          	add    $0x5b,%ax
  4e1cda:	66 25 ff 07          	and    $0x7ff,%ax
  4e1cde:	66 89 47 70          	mov    %ax,0x70(%edi)
  4e1ce2:	8a 87 aa 00 00 00    	mov    0xaa(%edi),%al
  4e1ce8:	fe c8                	dec    %al
  4e1cea:	88 87 aa 00 00 00    	mov    %al,0xaa(%edi)
  4e1cf0:	84 c0                	test   %al,%al
  4e1cf2:	0f 8f e5 08 00 00    	jg     0x4e25dd
  4e1cf8:	c6 47 2d 01          	movb   $0x1,0x2d(%edi)
  4e1cfc:	81 4f 0c 00 00 00 40 	orl    $0x40000000,0xc(%edi)
  4e1d03:	e9 d5 08 00 00       	jmp    0x4e25dd
  4e1d08:	66 8b 47 3d          	mov    0x3d(%edi),%ax
  4e1d0c:	66 8b 4f 3f          	mov    0x3f(%edi),%cx
  4e1d10:	88 64 24 16          	mov    %ah,0x16(%esp)
  4e1d14:	33 c0                	xor    %eax,%eax
  4e1d16:	88 6c 24 17          	mov    %ch,0x17(%esp)
  4e1d1a:	66 8b 44 24 16       	mov    0x16(%esp),%ax
  4e1d1f:	33 c9                	xor    %ecx,%ecx
  4e1d21:	66 8b 4c 24 16       	mov    0x16(%esp),%cx
  4e1d26:	25 fe 00 00 00       	and    $0xfe,%eax
  4e1d2b:	03 c0                	add    %eax,%eax
  4e1d2d:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4e1d33:	0b c1                	or     %ecx,%eax
  4e1d35:	33 f6                	xor    %esi,%esi
  4e1d37:	0f bf 14 85 ea 03 8a 	movswl 0x8a03ea(,%eax,4),%edx
  4e1d3e:	00 
  4e1d3f:	8b 1c 95 90 03 89 00 	mov    0x890390(,%edx,4),%ebx
  4e1d46:	33 d2                	xor    %edx,%edx
  4e1d48:	85 db                	test   %ebx,%ebx
  4e1d4a:	74 40                	je     0x4e1d8c
  4e1d4c:	b8 01 00 00 00       	mov    $0x1,%eax
  4e1d51:	38 43 2a             	cmp    %al,0x2a(%ebx)
  4e1d54:	75 25                	jne    0x4e1d7b
  4e1d56:	8a 4b 2f             	mov    0x2f(%ebx),%cl
  4e1d59:	38 4f 2f             	cmp    %cl,0x2f(%edi)
  4e1d5c:	75 1d                	jne    0x4e1d7b
  4e1d5e:	80 7b 2c 29          	cmpb   $0x29,0x2c(%ebx)
  4e1d62:	75 17                	jne    0x4e1d7b
  4e1d64:	8a 4b 2d             	mov    0x2d(%ebx),%cl
  4e1d67:	80 f9 03             	cmp    $0x3,%cl
  4e1d6a:	74 0a                	je     0x4e1d76
  4e1d6c:	80 f9 04             	cmp    $0x4,%cl
  4e1d6f:	75 0a                	jne    0x4e1d7b
  4e1d71:	80 f9 03             	cmp    $0x3,%cl
  4e1d74:	75 04                	jne    0x4e1d7a
  4e1d76:	8b f3                	mov    %ebx,%esi
  4e1d78:	eb 01                	jmp    0x4e1d7b
  4e1d7a:	42                   	inc    %edx
  4e1d7b:	33 c9                	xor    %ecx,%ecx
  4e1d7d:	66 8b 4b 20          	mov    0x20(%ebx),%cx
  4e1d81:	8b 1c 8d 90 03 89 00 	mov    0x890390(,%ecx,4),%ebx
  4e1d88:	85 db                	test   %ebx,%ebx
  4e1d8a:	75 c5                	jne    0x4e1d51
  4e1d8c:	33 c0                	xor    %eax,%eax
  4e1d8e:	85 f6                	test   %esi,%esi
  4e1d90:	74 05                	je     0x4e1d97
  4e1d92:	83 fa 06             	cmp    $0x6,%edx
  4e1d95:	7e 05                	jle    0x4e1d9c
  4e1d97:	b8 01 00 00 00       	mov    $0x1,%eax
  4e1d9c:	85 c0                	test   %eax,%eax
  4e1d9e:	0f 85 f6 00 00 00    	jne    0x4e1e9a
  4e1da4:	8b 47 0c             	mov    0xc(%edi),%eax
  4e1da7:	a9 00 00 00 40       	test   $0x40000000,%eax
  4e1dac:	0f 84 2b 08 00 00    	je     0x4e25dd
  4e1db2:	25 ff ff ff bf       	and    $0xbfffffff,%eax
  4e1db7:	66 83 7f 78 00       	cmpw   $0x0,0x78(%edi)
  4e1dbc:	89 47 0c             	mov    %eax,0xc(%edi)
  4e1dbf:	75 35                	jne    0x4e1df6
  4e1dc1:	33 c0                	xor    %eax,%eax
  4e1dc3:	8a 47 2b             	mov    0x2b(%edi),%al
  4e1dc6:	66 0f b6 04 45 ce 6d 	movzbw 0x5a6dce(,%eax,2),%ax
  4e1dcd:	5a 00 
  4e1dcf:	50                   	push   %eax
  4e1dd0:	57                   	push   %edi
  4e1dd1:	e8 6a 22 ff ff       	call   0x4d4040
  4e1dd6:	83 c4 08             	add    $0x8,%esp
  4e1dd9:	33 c9                	xor    %ecx,%ecx
  4e1ddb:	c6 47 39 00          	movb   $0x0,0x39(%edi)
  4e1ddf:	8a 4f 3a             	mov    0x3a(%edi),%cl
  4e1de2:	8b c1                	mov    %ecx,%eax
  4e1de4:	8d 14 89             	lea    (%ecx,%ecx,4),%edx
  4e1de7:	66 0f be 84 50 f9 6a 	movsbw 0x5a6af9(%eax,%edx,2),%ax
  4e1dee:	5a 00 
  4e1df0:	66 89 47 37          	mov    %ax,0x37(%edi)
  4e1df4:	eb 18                	jmp    0x4e1e0e
  4e1df6:	33 c0                	xor    %eax,%eax
  4e1df8:	8a 47 2b             	mov    0x2b(%edi),%al
  4e1dfb:	66 0f b6 04 45 98 6d 	movzbw 0x5a6d98(,%eax,2),%ax
  4e1e02:	5a 00 
  4e1e04:	50                   	push   %eax
  4e1e05:	57                   	push   %edi
  4e1e06:	e8 35 22 ff ff       	call   0x4d4040
  4e1e0b:	83 c4 08             	add    $0x8,%esp
  4e1e0e:	33 c9                	xor    %ecx,%ecx
  4e1e10:	8a 4f 30             	mov    0x30(%edi),%cl
  4e1e13:	8b c1                	mov    %ecx,%eax
  4e1e15:	8d 14 89             	lea    (%ecx,%ecx,4),%edx
  4e1e18:	80 4f 76 80          	orb    $0x80,0x76(%edi)
  4e1e1c:	8d 0c 92             	lea    (%edx,%edx,4),%ecx
  4e1e1f:	0f bf 8c 01 94 7b 5a 	movswl 0x5a7b94(%ecx,%eax,1),%ecx
  4e1e26:	00 
  4e1e27:	8b d9                	mov    %ecx,%ebx
  4e1e29:	c1 fb 02             	sar    $0x2,%ebx
  4e1e2c:	85 db                	test   %ebx,%ebx
  4e1e2e:	75 05                	jne    0x4e1e35
  4e1e30:	bb 01 00 00 00       	mov    $0x1,%ebx
  4e1e35:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e1e3a:	8b d0                	mov    %eax,%edx
  4e1e3c:	8d 2c c0             	lea    (%eax,%eax,8),%ebp
  4e1e3f:	8d 04 ea             	lea    (%edx,%ebp,8),%eax
  4e1e42:	8d 04 82             	lea    (%edx,%eax,4),%eax
  4e1e45:	c1 e0 02             	shl    $0x2,%eax
  4e1e48:	8d 04 c2             	lea    (%edx,%eax,8),%eax
  4e1e4b:	05 df 24 00 00       	add    $0x24df,%eax
  4e1e50:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e1e55:	89 44 24 44          	mov    %eax,0x44(%esp)
  4e1e59:	c1 4c 24 44 0d       	rorl   $0xd,0x44(%esp)
  4e1e5e:	8b 44 24 44          	mov    0x44(%esp),%eax
  4e1e62:	2b d2                	sub    %edx,%edx
  4e1e64:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e1e69:	f7 f3                	div    %ebx
  4e1e6b:	8d 04 11             	lea    (%ecx,%edx,1),%eax
  4e1e6e:	f6 47 16 08          	testb  $0x8,0x16(%edi)
  4e1e72:	66 89 47 5f          	mov    %ax,0x5f(%edi)
  4e1e76:	74 07                	je     0x4e1e7f
  4e1e78:	66 03 c0             	add    %ax,%ax
  4e1e7b:	66 89 47 5f          	mov    %ax,0x5f(%edi)
  4e1e7f:	85 f6                	test   %esi,%esi
  4e1e81:	0f 84 56 07 00 00    	je     0x4e25dd
  4e1e87:	8a 46 39             	mov    0x39(%esi),%al
  4e1e8a:	88 47 39             	mov    %al,0x39(%edi)
  4e1e8d:	66 8b 4e 37          	mov    0x37(%esi),%cx
  4e1e91:	66 89 4f 37          	mov    %cx,0x37(%edi)
  4e1e95:	e9 43 07 00 00       	jmp    0x4e25dd
  4e1e9a:	c6 47 2d 01          	movb   $0x1,0x2d(%edi)
  4e1e9e:	81 4f 0c 00 00 00 40 	orl    $0x40000000,0xc(%edi)
  4e1ea5:	e9 33 07 00 00       	jmp    0x4e25dd
  4e1eaa:	33 f6                	xor    %esi,%esi
  4e1eac:	8b 47 0c             	mov    0xc(%edi),%eax
  4e1eaf:	89 b4 24 8c 00 00 00 	mov    %esi,0x8c(%esp)
  4e1eb6:	89 74 24 38          	mov    %esi,0x38(%esp)
  4e1eba:	a9 00 00 00 40       	test   $0x40000000,%eax
  4e1ebf:	74 5d                	je     0x4e1f1e
  4e1ec1:	25 ff ff ff bf       	and    $0xbfffffff,%eax
  4e1ec6:	89 47 0c             	mov    %eax,0xc(%edi)
  4e1ec9:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e1ece:	8b c8                	mov    %eax,%ecx
  4e1ed0:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e1ed3:	c7 44 24 38 01 00 00 	movl   $0x1,0x38(%esp)
  4e1eda:	00 
  4e1edb:	8d 04 d1             	lea    (%ecx,%edx,8),%eax
  4e1ede:	8d 04 81             	lea    (%ecx,%eax,4),%eax
  4e1ee1:	c1 e0 02             	shl    $0x2,%eax
  4e1ee4:	8d 04 c1             	lea    (%ecx,%eax,8),%eax
  4e1ee7:	05 df 24 00 00       	add    $0x24df,%eax
  4e1eec:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e1ef1:	89 44 24 40          	mov    %eax,0x40(%esp)
  4e1ef5:	c1 4c 24 40 0d       	rorl   $0xd,0x40(%esp)
  4e1efa:	8b 44 24 40          	mov    0x40(%esp),%eax
  4e1efe:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e1f03:	66 25 ff 00          	and    $0xff,%ax
  4e1f07:	c6 87 a8 00 00 00 00 	movb   $0x0,0xa8(%edi)
  4e1f0e:	80 4f 76 10          	orb    $0x10,0x76(%edi)
  4e1f12:	66 05 00 01          	add    $0x100,%ax
  4e1f16:	66 89 47 70          	mov    %ax,0x70(%edi)
  4e1f1a:	66 89 77 74          	mov    %si,0x74(%edi)
  4e1f1e:	33 c0                	xor    %eax,%eax
  4e1f20:	33 c9                	xor    %ecx,%ecx
  4e1f22:	66 8b 57 76          	mov    0x76(%edi),%dx
  4e1f26:	8a 87 a8 00 00 00    	mov    0xa8(%edi),%al
  4e1f2c:	89 44 24 24          	mov    %eax,0x24(%esp)
  4e1f30:	8d 04 40             	lea    (%eax,%eax,2),%eax
  4e1f33:	03 c0                	add    %eax,%eax
  4e1f35:	f6 c2 10             	test   $0x10,%dl
  4e1f38:	8a 88 6b 48 5d 00    	mov    0x5d486b(%eax),%cl
  4e1f3e:	89 8c 24 90 00 00 00 	mov    %ecx,0x90(%esp)
  4e1f45:	74 29                	je     0x4e1f70
  4e1f47:	66 81 e2 ef ff       	and    $0xffef,%dx
  4e1f4c:	be 01 00 00 00       	mov    $0x1,%esi
  4e1f51:	33 c9                	xor    %ecx,%ecx
  4e1f53:	8a 88 6c 48 5d 00    	mov    0x5d486c(%eax),%cl
  4e1f59:	66 89 57 76          	mov    %dx,0x76(%edi)
  4e1f5d:	89 8c 24 8c 00 00 00 	mov    %ecx,0x8c(%esp)
  4e1f64:	8a 88 68 48 5d 00    	mov    0x5d4868(%eax),%cl
  4e1f6a:	88 8f aa 00 00 00    	mov    %cl,0xaa(%edi)
  4e1f70:	8a 8f aa 00 00 00    	mov    0xaa(%edi),%cl
  4e1f76:	fe c9                	dec    %cl
  4e1f78:	88 8f aa 00 00 00    	mov    %cl,0xaa(%edi)
  4e1f7e:	84 c9                	test   %cl,%cl
  4e1f80:	7f 10                	jg     0x4e1f92
  4e1f82:	8a 80 6a 48 5d 00    	mov    0x5d486a(%eax),%al
  4e1f88:	80 4f 76 10          	orb    $0x10,0x76(%edi)
  4e1f8c:	88 87 a8 00 00 00    	mov    %al,0xa8(%edi)
  4e1f92:	85 f6                	test   %esi,%esi
  4e1f94:	74 10                	je     0x4e1fa6
  4e1f96:	8a 87 a8 00 00 00    	mov    0xa8(%edi),%al
  4e1f9c:	50                   	push   %eax
  4e1f9d:	57                   	push   %edi
  4e1f9e:	e8 6d 06 00 00       	call   0x4e2610
  4e1fa3:	83 c4 08             	add    $0x8,%esp
  4e1fa6:	83 bc 24 8c 00 00 00 	cmpl   $0x0,0x8c(%esp)
  4e1fad:	00 
  4e1fae:	74 6d                	je     0x4e201d
  4e1fb0:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e1fb5:	8b c8                	mov    %eax,%ecx
  4e1fb7:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e1fba:	8d 04 d1             	lea    (%ecx,%edx,8),%eax
  4e1fbd:	8d 04 81             	lea    (%ecx,%eax,4),%eax
  4e1fc0:	c1 e0 02             	shl    $0x2,%eax
  4e1fc3:	8d 04 c1             	lea    (%ecx,%eax,8),%eax
  4e1fc6:	05 df 24 00 00       	add    $0x24df,%eax
  4e1fcb:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e1fd0:	89 44 24 3c          	mov    %eax,0x3c(%esp)
  4e1fd4:	c1 4c 24 3c 0d       	rorl   $0xd,0x3c(%esp)
  4e1fd9:	8b 44 24 3c          	mov    0x3c(%esp),%eax
  4e1fdd:	b9 71 04 00 00       	mov    $0x471,%ecx
  4e1fe2:	2b d2                	sub    %edx,%edx
  4e1fe4:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e1fe9:	f7 f1                	div    %ecx
  4e1feb:	0f bf 5f 5d          	movswl 0x5d(%edi),%ebx
  4e1fef:	03 da                	add    %edx,%ebx
  4e1ff1:	57                   	push   %edi
  4e1ff2:	81 eb 38 02 00 00    	sub    $0x238,%ebx
  4e1ff8:	e8 63 84 00 00       	call   0x4ea460
  4e1ffd:	81 e3 ff 07 00 00    	and    $0x7ff,%ebx
  4e2003:	83 c4 04             	add    $0x4,%esp
  4e2006:	66 89 5f 57          	mov    %bx,0x57(%edi)
  4e200a:	8b 47 0c             	mov    0xc(%edi),%eax
  4e200d:	0d 80 00 00 00       	or     $0x80,%eax
  4e2012:	89 47 0c             	mov    %eax,0xc(%edi)
  4e2015:	0d 00 10 00 00       	or     $0x1000,%eax
  4e201a:	89 47 0c             	mov    %eax,0xc(%edi)
  4e201d:	c7 84 24 88 00 00 00 	movl   $0x1,0x88(%esp)
  4e2024:	01 00 00 00 
  4e2028:	0f bf 47 74          	movswl 0x74(%edi),%eax
  4e202c:	8b ef                	mov    %edi,%ebp
  4e202e:	8b 1c 85 90 03 89 00 	mov    0x890390(,%eax,4),%ebx
  4e2035:	85 db                	test   %ebx,%ebx
  4e2037:	0f 84 b0 01 00 00    	je     0x4e21ed
  4e203d:	80 7b 2c 29          	cmpb   $0x29,0x2c(%ebx)
  4e2041:	0f 85 9b 01 00 00    	jne    0x4e21e2
  4e2047:	80 7b 2d 06          	cmpb   $0x6,0x2d(%ebx)
  4e204b:	0f 85 91 01 00 00    	jne    0x4e21e2
  4e2051:	85 f6                	test   %esi,%esi
  4e2053:	74 0e                	je     0x4e2063
  4e2055:	8b 44 24 24          	mov    0x24(%esp),%eax
  4e2059:	50                   	push   %eax
  4e205a:	53                   	push   %ebx
  4e205b:	e8 b0 05 00 00       	call   0x4e2610
  4e2060:	83 c4 08             	add    $0x8,%esp
  4e2063:	83 bc 24 90 00 00 00 	cmpl   $0x0,0x90(%esp)
  4e206a:	00 
  4e206b:	0f 84 c5 00 00 00    	je     0x4e2136
  4e2071:	8b 43 0c             	mov    0xc(%ebx),%eax
  4e2074:	8d 4d 3d             	lea    0x3d(%ebp),%ecx
  4e2077:	0d 00 02 00 00       	or     $0x200,%eax
  4e207c:	89 43 0c             	mov    %eax,0xc(%ebx)
  4e207f:	0d 00 00 20 00       	or     $0x200000,%eax
  4e2084:	89 43 0c             	mov    %eax,0xc(%ebx)
  4e2087:	8d 84 24 9c 00 00 00 	lea    0x9c(%esp),%eax
  4e208e:	8b 11                	mov    (%ecx),%edx
  4e2090:	89 10                	mov    %edx,(%eax)
  4e2092:	66 8b 51 04          	mov    0x4(%ecx),%dx
  4e2096:	66 89 50 04          	mov    %dx,0x4(%eax)
  4e209a:	66 8b 43 3d          	mov    0x3d(%ebx),%ax
  4e209e:	66 2b 01             	sub    (%ecx),%ax
  4e20a1:	0f b7 d0             	movzwl %ax,%edx
  4e20a4:	66 8b 43 3f          	mov    0x3f(%ebx),%ax
  4e20a8:	8b ca                	mov    %edx,%ecx
  4e20aa:	66 2b 45 3f          	sub    0x3f(%ebp),%ax
  4e20ae:	85 d2                	test   %edx,%edx
  4e20b0:	0f b7 c0             	movzwl %ax,%eax
  4e20b3:	7d 04                	jge    0x4e20b9
  4e20b5:	8b ca                	mov    %edx,%ecx
  4e20b7:	f7 d9                	neg    %ecx
  4e20b9:	8b e8                	mov    %eax,%ebp
  4e20bb:	85 c0                	test   %eax,%eax
  4e20bd:	7d 04                	jge    0x4e20c3
  4e20bf:	8b e8                	mov    %eax,%ebp
  4e20c1:	f7 dd                	neg    %ebp
  4e20c3:	81 f9 00 80 00 00    	cmp    $0x8000,%ecx
  4e20c9:	7c 06                	jl     0x4e20d1
  4e20cb:	8d 91 00 00 ff ff    	lea    -0x10000(%ecx),%edx
  4e20d1:	81 fd 00 80 00 00    	cmp    $0x8000,%ebp
  4e20d7:	7c 06                	jl     0x4e20df
  4e20d9:	8d 85 00 00 ff ff    	lea    -0x10000(%ebp),%eax
  4e20df:	f7 d8                	neg    %eax
  4e20e1:	50                   	push   %eax
  4e20e2:	52                   	push   %edx
  4e20e3:	e8 8c 3f 0a 00       	call   0x586074
  4e20e8:	83 c4 08             	add    $0x8,%esp
  4e20eb:	33 c9                	xor    %ecx,%ecx
  4e20ed:	66 8b c8             	mov    %ax,%cx
  4e20f0:	6a 60                	push   $0x60
  4e20f2:	81 e1 ff 07 00 00    	and    $0x7ff,%ecx
  4e20f8:	8d 84 24 a0 00 00 00 	lea    0xa0(%esp),%eax
  4e20ff:	51                   	push   %ecx
  4e2100:	50                   	push   %eax
  4e2101:	e8 6a 49 00 00       	call   0x4e6a70
  4e2106:	66 8b 8c 24 a8 00 00 	mov    0xa8(%esp),%cx
  4e210d:	00 
  4e210e:	83 c4 0c             	add    $0xc,%esp
  4e2111:	66 8b 94 24 9e 00 00 	mov    0x9e(%esp),%dx
  4e2118:	00 
  4e2119:	66 89 4c 24 20       	mov    %cx,0x20(%esp)
  4e211e:	8d 4c 24 20          	lea    0x20(%esp),%ecx
  4e2122:	66 89 54 24 22       	mov    %dx,0x22(%esp)
  4e2127:	51                   	push   %ecx
  4e2128:	53                   	push   %ebx
  4e2129:	e8 a2 7c 00 00       	call   0x4e9dd0
  4e212e:	83 c4 08             	add    $0x8,%esp
  4e2131:	e9 95 00 00 00       	jmp    0x4e21cb
  4e2136:	66 8b 45 3d          	mov    0x3d(%ebp),%ax
  4e213a:	66 2b 43 3d          	sub    0x3d(%ebx),%ax
  4e213e:	0f b7 c8             	movzwl %ax,%ecx
  4e2141:	66 8b 45 3f          	mov    0x3f(%ebp),%ax
  4e2145:	8b d1                	mov    %ecx,%edx
  4e2147:	66 2b 43 3f          	sub    0x3f(%ebx),%ax
  4e214b:	85 c9                	test   %ecx,%ecx
  4e214d:	0f b7 c0             	movzwl %ax,%eax
  4e2150:	7d 04                	jge    0x4e2156
  4e2152:	8b d1                	mov    %ecx,%edx
  4e2154:	f7 da                	neg    %edx
  4e2156:	8b e8                	mov    %eax,%ebp
  4e2158:	85 c0                	test   %eax,%eax
  4e215a:	7d 04                	jge    0x4e2160
  4e215c:	8b e8                	mov    %eax,%ebp
  4e215e:	f7 dd                	neg    %ebp
  4e2160:	81 fa 00 80 00 00    	cmp    $0x8000,%edx
  4e2166:	7c 06                	jl     0x4e216e
  4e2168:	8d 8a 00 00 ff ff    	lea    -0x10000(%edx),%ecx
  4e216e:	81 fd 00 80 00 00    	cmp    $0x8000,%ebp
  4e2174:	7c 06                	jl     0x4e217c
  4e2176:	8d 85 00 00 ff ff    	lea    -0x10000(%ebp),%eax
  4e217c:	f7 d8                	neg    %eax
  4e217e:	50                   	push   %eax
  4e217f:	33 ed                	xor    %ebp,%ebp
  4e2181:	51                   	push   %ecx
  4e2182:	e8 ed 3e 0a 00       	call   0x586074
  4e2187:	66 8b e8             	mov    %ax,%bp
  4e218a:	83 c4 08             	add    $0x8,%esp
  4e218d:	81 e5 ff 07 00 00    	and    $0x7ff,%ebp
  4e2193:	53                   	push   %ebx
  4e2194:	e8 c7 82 00 00       	call   0x4ea460
  4e2199:	83 c4 04             	add    $0x4,%esp
  4e219c:	8b 43 0c             	mov    0xc(%ebx),%eax
  4e219f:	0d 80 00 00 00       	or     $0x80,%eax
  4e21a4:	89 43 0c             	mov    %eax,0xc(%ebx)
  4e21a7:	0d 00 10 00 00       	or     $0x1000,%eax
  4e21ac:	89 43 0c             	mov    %eax,0xc(%ebx)
  4e21af:	66 89 6b 57          	mov    %bp,0x57(%ebx)
  4e21b3:	66 89 6b 5d          	mov    %bp,0x5d(%ebx)
  4e21b7:	f6 43 0d 80          	testb  $0x80,0xd(%ebx)
  4e21bb:	74 0a                	je     0x4e21c7
  4e21bd:	66 81 c5 00 04       	add    $0x400,%bp
  4e21c2:	66 81 e5 ff 07       	and    $0x7ff,%bp
  4e21c7:	66 89 6b 26          	mov    %bp,0x26(%ebx)
  4e21cb:	0f bf 43 74          	movswl 0x74(%ebx),%eax
  4e21cf:	8b eb                	mov    %ebx,%ebp
  4e21d1:	8b 1c 85 90 03 89 00 	mov    0x890390(,%eax,4),%ebx
  4e21d8:	85 db                	test   %ebx,%ebx
  4e21da:	0f 85 5d fe ff ff    	jne    0x4e203d
  4e21e0:	eb 0b                	jmp    0x4e21ed
  4e21e2:	c7 84 24 88 00 00 00 	movl   $0x0,0x88(%esp)
  4e21e9:	00 00 00 00 
  4e21ed:	83 bc 24 88 00 00 00 	cmpl   $0x0,0x88(%esp)
  4e21f4:	00 
  4e21f5:	0f 84 f2 00 00 00    	je     0x4e22ed
  4e21fb:	f6 47 2e 07          	testb  $0x7,0x2e(%edi)
  4e21ff:	75 08                	jne    0x4e2209
  4e2201:	c7 44 24 38 01 00 00 	movl   $0x1,0x38(%esp)
  4e2208:	00 
  4e2209:	83 7c 24 38 00       	cmpl   $0x0,0x38(%esp)
  4e220e:	0f 84 df 00 00 00    	je     0x4e22f3
  4e2214:	8b df                	mov    %edi,%ebx
  4e2216:	85 ff                	test   %edi,%edi
  4e2218:	c7 84 24 84 00 00 00 	movl   $0x0,0x84(%esp)
  4e221f:	00 00 00 00 
  4e2223:	0f 84 ca 00 00 00    	je     0x4e22f3
  4e2229:	66 8b 43 3d          	mov    0x3d(%ebx),%ax
  4e222d:	66 8b 4b 3f          	mov    0x3f(%ebx),%cx
  4e2231:	88 64 24 14          	mov    %ah,0x14(%esp)
  4e2235:	33 c0                	xor    %eax,%eax
  4e2237:	88 6c 24 15          	mov    %ch,0x15(%esp)
  4e223b:	66 8b 44 24 14       	mov    0x14(%esp),%ax
  4e2240:	33 c9                	xor    %ecx,%ecx
  4e2242:	66 8b 4c 24 14       	mov    0x14(%esp),%cx
  4e2247:	25 fe 00 00 00       	and    $0xfe,%eax
  4e224c:	03 c0                	add    %eax,%eax
  4e224e:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4e2254:	0b c1                	or     %ecx,%eax
  4e2256:	8d 04 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%eax
  4e225d:	39 84 24 84 00 00 00 	cmp    %eax,0x84(%esp)
  4e2264:	74 72                	je     0x4e22d8
  4e2266:	89 84 24 84 00 00 00 	mov    %eax,0x84(%esp)
  4e226d:	0f bf 40 06          	movswl 0x6(%eax),%eax
  4e2271:	8b 34 85 90 03 89 00 	mov    0x890390(,%eax,4),%esi
  4e2278:	85 f6                	test   %esi,%esi
  4e227a:	74 5c                	je     0x4e22d8
  4e227c:	b8 01 00 00 00       	mov    $0x1,%eax
  4e2281:	b9 29 00 00 00       	mov    $0x29,%ecx
  4e2286:	33 ed                	xor    %ebp,%ebp
  4e2288:	38 46 2a             	cmp    %al,0x2a(%esi)
  4e228b:	75 3a                	jne    0x4e22c7
  4e228d:	8a 56 2f             	mov    0x2f(%esi),%dl
  4e2290:	38 57 2f             	cmp    %dl,0x2f(%edi)
  4e2293:	75 32                	jne    0x4e22c7
  4e2295:	38 4e 2c             	cmp    %cl,0x2c(%esi)
  4e2298:	75 2d                	jne    0x4e22c7
  4e229a:	8a 56 2d             	mov    0x2d(%esi),%dl
  4e229d:	3a d0                	cmp    %al,%dl
  4e229f:	74 0f                	je     0x4e22b0
  4e22a1:	80 fa 03             	cmp    $0x3,%dl
  4e22a4:	74 0a                	je     0x4e22b0
  4e22a6:	80 fa 04             	cmp    $0x4,%dl
  4e22a9:	74 05                	je     0x4e22b0
  4e22ab:	80 fa 02             	cmp    $0x2,%dl
  4e22ae:	75 17                	jne    0x4e22c7
  4e22b0:	c6 46 2d 06          	movb   $0x6,0x2d(%esi)
  4e22b4:	81 4e 0c 00 00 00 40 	orl    $0x40000000,0xc(%esi)
  4e22bb:	66 8b 57 24          	mov    0x24(%edi),%dx
  4e22bf:	66 89 56 72          	mov    %dx,0x72(%esi)
  4e22c3:	66 89 6e 74          	mov    %bp,0x74(%esi)
  4e22c7:	33 d2                	xor    %edx,%edx
  4e22c9:	66 8b 56 20          	mov    0x20(%esi),%dx
  4e22cd:	8b 34 95 90 03 89 00 	mov    0x890390(,%edx,4),%esi
  4e22d4:	85 f6                	test   %esi,%esi
  4e22d6:	75 b0                	jne    0x4e2288
  4e22d8:	0f bf 43 74          	movswl 0x74(%ebx),%eax
  4e22dc:	8b 1c 85 90 03 89 00 	mov    0x890390(,%eax,4),%ebx
  4e22e3:	85 db                	test   %ebx,%ebx
  4e22e5:	0f 85 3e ff ff ff    	jne    0x4e2229
  4e22eb:	eb 06                	jmp    0x4e22f3
  4e22ed:	66 c7 47 70 00 00    	movw   $0x0,0x70(%edi)
  4e22f3:	66 8b 47 70          	mov    0x70(%edi),%ax
  4e22f7:	66 48                	dec    %ax
  4e22f9:	66 89 47 70          	mov    %ax,0x70(%edi)
  4e22fd:	66 85 c0             	test   %ax,%ax
  4e2300:	0f 8f d7 02 00 00    	jg     0x4e25dd
  4e2306:	81 4f 0c 00 00 00 40 	orl    $0x40000000,0xc(%edi)
  4e230d:	66 c7 47 74 00 00    	movw   $0x0,0x74(%edi)
  4e2313:	c6 47 2d 01          	movb   $0x1,0x2d(%edi)
  4e2317:	e9 c1 02 00 00       	jmp    0x4e25dd
  4e231c:	66 8b 47 72          	mov    0x72(%edi),%ax
  4e2320:	33 c9                	xor    %ecx,%ecx
  4e2322:	66 3b c1             	cmp    %cx,%ax
  4e2325:	74 17                	je     0x4e233e
  4e2327:	0f b7 c0             	movzwl %ax,%eax
  4e232a:	8b 04 85 90 03 89 00 	mov    0x890390(,%eax,4),%eax
  4e2331:	f6 40 0c 01          	testb  $0x1,0xc(%eax)
  4e2335:	75 07                	jne    0x4e233e
  4e2337:	38 48 2a             	cmp    %cl,0x2a(%eax)
  4e233a:	74 02                	je     0x4e233e
  4e233c:	8b c8                	mov    %eax,%ecx
  4e233e:	85 c9                	test   %ecx,%ecx
  4e2340:	74 08                	je     0x4e234a
  4e2342:	80 79 2d 05          	cmpb   $0x5,0x2d(%ecx)
  4e2346:	74 02                	je     0x4e234a
  4e2348:	33 c9                	xor    %ecx,%ecx
  4e234a:	8b 47 0c             	mov    0xc(%edi),%eax
  4e234d:	a9 00 00 00 40       	test   $0x40000000,%eax
  4e2352:	74 58                	je     0x4e23ac
  4e2354:	66 c7 47 74 00 00    	movw   $0x0,0x74(%edi)
  4e235a:	25 ff ff ff bf       	and    $0xbfffffff,%eax
  4e235f:	85 c9                	test   %ecx,%ecx
  4e2361:	89 47 0c             	mov    %eax,0xc(%edi)
  4e2364:	74 4e                	je     0x4e23b4
  4e2366:	66 8b 41 74          	mov    0x74(%ecx),%ax
  4e236a:	66 85 c0             	test   %ax,%ax
  4e236d:	74 35                	je     0x4e23a4
  4e236f:	0f bf c0             	movswl %ax,%eax
  4e2372:	8b 14 85 90 03 89 00 	mov    0x890390(,%eax,4),%edx
  4e2379:	85 d2                	test   %edx,%edx
  4e237b:	74 2f                	je     0x4e23ac
  4e237d:	3b fa                	cmp    %edx,%edi
  4e237f:	74 2b                	je     0x4e23ac
  4e2381:	66 8b 42 74          	mov    0x74(%edx),%ax
  4e2385:	66 85 c0             	test   %ax,%ax
  4e2388:	74 10                	je     0x4e239a
  4e238a:	0f bf c0             	movswl %ax,%eax
  4e238d:	8b 14 85 90 03 89 00 	mov    0x890390(,%eax,4),%edx
  4e2394:	85 d2                	test   %edx,%edx
  4e2396:	75 e5                	jne    0x4e237d
  4e2398:	eb 12                	jmp    0x4e23ac
  4e239a:	66 8b 47 24          	mov    0x24(%edi),%ax
  4e239e:	66 89 42 74          	mov    %ax,0x74(%edx)
  4e23a2:	eb 08                	jmp    0x4e23ac
  4e23a4:	66 8b 47 24          	mov    0x24(%edi),%ax
  4e23a8:	66 89 41 74          	mov    %ax,0x74(%ecx)
  4e23ac:	85 c9                	test   %ecx,%ecx
  4e23ae:	0f 85 29 02 00 00    	jne    0x4e25dd
  4e23b4:	66 c7 47 74 00 00    	movw   $0x0,0x74(%edi)
  4e23ba:	c6 47 2d 01          	movb   $0x1,0x2d(%edi)
  4e23be:	81 4f 0c 00 00 00 40 	orl    $0x40000000,0xc(%edi)
  4e23c5:	66 c7 47 72 00 00    	movw   $0x0,0x72(%edi)
  4e23cb:	e9 0d 02 00 00       	jmp    0x4e25dd
  4e23d0:	8b 47 0c             	mov    0xc(%edi),%eax
  4e23d3:	a9 00 00 00 40       	test   $0x40000000,%eax
  4e23d8:	74 1f                	je     0x4e23f9
  4e23da:	25 ff ff ff bf       	and    $0xbfffffff,%eax
  4e23df:	89 47 0c             	mov    %eax,0xc(%edi)
  4e23e2:	33 c0                	xor    %eax,%eax
  4e23e4:	8a 47 2b             	mov    0x2b(%edi),%al
  4e23e7:	66 8b 04 45 86 6d 5a 	mov    0x5a6d86(,%eax,2),%ax
  4e23ee:	00 
  4e23ef:	50                   	push   %eax
  4e23f0:	57                   	push   %edi
  4e23f1:	e8 4a 1c ff ff       	call   0x4d4040
  4e23f6:	83 c4 08             	add    $0x8,%esp
  4e23f9:	f6 47 2e 03          	testb  $0x3,0x2e(%edi)
  4e23fd:	0f 85 96 00 00 00    	jne    0x4e2499
  4e2403:	0f be 47 2f          	movsbl 0x2f(%edi),%eax
  4e2407:	8b c8                	mov    %eax,%ecx
  4e2409:	8d 14 80             	lea    (%eax,%eax,4),%edx
  4e240c:	8d 04 51             	lea    (%ecx,%edx,2),%eax
  4e240f:	8d 1c c0             	lea    (%eax,%eax,8),%ebx
  4e2412:	8d 14 d9             	lea    (%ecx,%ebx,8),%edx
  4e2415:	8b 84 91 65 da 89 00 	mov    0x89da65(%ecx,%edx,4),%eax
  4e241c:	85 c0                	test   %eax,%eax
  4e241e:	74 79                	je     0x4e2499
  4e2420:	66 8b 48 3d          	mov    0x3d(%eax),%cx
  4e2424:	66 2b 4f 3d          	sub    0x3d(%edi),%cx
  4e2428:	66 8b 40 3f          	mov    0x3f(%eax),%ax
  4e242c:	0f b7 f1             	movzwl %cx,%esi
  4e242f:	66 2b 47 3f          	sub    0x3f(%edi),%ax
  4e2433:	85 f6                	test   %esi,%esi
  4e2435:	0f b7 d0             	movzwl %ax,%edx
  4e2438:	8b c6                	mov    %esi,%eax
  4e243a:	7d 04                	jge    0x4e2440
  4e243c:	8b c6                	mov    %esi,%eax
  4e243e:	f7 d8                	neg    %eax
  4e2440:	8b ca                	mov    %edx,%ecx
  4e2442:	85 d2                	test   %edx,%edx
  4e2444:	7d 04                	jge    0x4e244a
  4e2446:	8b ca                	mov    %edx,%ecx
  4e2448:	f7 d9                	neg    %ecx
  4e244a:	3d 00 80 00 00       	cmp    $0x8000,%eax
  4e244f:	7c 06                	jl     0x4e2457
  4e2451:	8d b0 00 00 ff ff    	lea    -0x10000(%eax),%esi
  4e2457:	81 f9 00 80 00 00    	cmp    $0x8000,%ecx
  4e245d:	7c 06                	jl     0x4e2465
  4e245f:	8d 91 00 00 ff ff    	lea    -0x10000(%ecx),%edx
  4e2465:	f7 da                	neg    %edx
  4e2467:	52                   	push   %edx
  4e2468:	56                   	push   %esi
  4e2469:	e8 06 3c 0a 00       	call   0x586074
  4e246e:	66 8b f0             	mov    %ax,%si
  4e2471:	83 c4 08             	add    $0x8,%esp
  4e2474:	66 81 e6 ff 07       	and    $0x7ff,%si
  4e2479:	57                   	push   %edi
  4e247a:	e8 e1 7f 00 00       	call   0x4ea460
  4e247f:	66 89 77 57          	mov    %si,0x57(%edi)
  4e2483:	83 c4 04             	add    $0x4,%esp
  4e2486:	8b 47 0c             	mov    0xc(%edi),%eax
  4e2489:	0d 80 00 00 00       	or     $0x80,%eax
  4e248e:	89 47 0c             	mov    %eax,0xc(%edi)
  4e2491:	0d 00 10 00 00       	or     $0x1000,%eax
  4e2496:	89 47 0c             	mov    %eax,0xc(%edi)
  4e2499:	66 83 bf 9f 00 00 00 	cmpw   $0x0,0x9f(%edi)
  4e24a0:	00 
  4e24a1:	0f 85 36 01 00 00    	jne    0x4e25dd
  4e24a7:	c6 47 2d 01          	movb   $0x1,0x2d(%edi)
  4e24ab:	81 4f 0c 00 00 00 40 	orl    $0x40000000,0xc(%edi)
  4e24b2:	c6 87 a8 00 00 00 00 	movb   $0x0,0xa8(%edi)
  4e24b9:	80 4f 76 10          	orb    $0x10,0x76(%edi)
  4e24bd:	e9 1b 01 00 00       	jmp    0x4e25dd
  4e24c2:	8b 47 0c             	mov    0xc(%edi),%eax
  4e24c5:	a9 00 00 00 40       	test   $0x40000000,%eax
  4e24ca:	74 66                	je     0x4e2532
  4e24cc:	66 c7 47 5f 00 00    	movw   $0x0,0x5f(%edi)
  4e24d2:	25 ff ff ff bf       	and    $0xbfffffff,%eax
  4e24d7:	66 83 7f 78 01       	cmpw   $0x1,0x78(%edi)
  4e24dc:	89 47 0c             	mov    %eax,0xc(%edi)
  4e24df:	b8 00 00 00 00       	mov    $0x0,%eax
  4e24e4:	83 d0 ff             	adc    $0xffffffff,%eax
  4e24e7:	8b 4f 0c             	mov    0xc(%edi),%ecx
  4e24ea:	66 25 04 00          	and    $0x4,%ax
  4e24ee:	f7 c1 00 00 08 00    	test   $0x80000,%ecx
  4e24f4:	74 17                	je     0x4e250d
  4e24f6:	f6 47 11 04          	testb  $0x4,0x11(%edi)
  4e24fa:	66 b8 0c 00          	mov    $0xc,%ax
  4e24fe:	75 0d                	jne    0x4e250d
  4e2500:	66 b8 02 00          	mov    $0x2,%ax
  4e2504:	81 e1 ff 7f ff ff    	and    $0xffff7fff,%ecx
  4e250a:	89 4f 0c             	mov    %ecx,0xc(%edi)
  4e250d:	0f bf c0             	movswl %ax,%eax
  4e2510:	33 c9                	xor    %ecx,%ecx
  4e2512:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e2515:	8a 4f 2b             	mov    0x2b(%edi),%cl
  4e2518:	03 ca                	add    %edx,%ecx
  4e251a:	66 8b 04 4d 50 6d 5a 	mov    0x5a6d50(,%ecx,2),%ax
  4e2521:	00 
  4e2522:	50                   	push   %eax
  4e2523:	57                   	push   %edi
  4e2524:	e8 17 1b ff ff       	call   0x4d4040
  4e2529:	66 c7 47 70 00 00    	movw   $0x0,0x70(%edi)
  4e252f:	83 c4 08             	add    $0x8,%esp
  4e2532:	66 8b 47 70          	mov    0x70(%edi),%ax
  4e2536:	66 48                	dec    %ax
  4e2538:	66 89 47 70          	mov    %ax,0x70(%edi)
  4e253c:	66 85 c0             	test   %ax,%ax
  4e253f:	0f 8f 98 00 00 00    	jg     0x4e25dd
  4e2545:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e254a:	8b c8                	mov    %eax,%ecx
  4e254c:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e254f:	8d 04 d1             	lea    (%ecx,%edx,8),%eax
  4e2552:	8d 04 81             	lea    (%ecx,%eax,4),%eax
  4e2555:	c1 e0 02             	shl    $0x2,%eax
  4e2558:	8d 04 c1             	lea    (%ecx,%eax,8),%eax
  4e255b:	05 df 24 00 00       	add    $0x24df,%eax
  4e2560:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e2565:	89 44 24 34          	mov    %eax,0x34(%esp)
  4e2569:	c1 4c 24 34 0d       	rorl   $0xd,0x34(%esp)
  4e256e:	8b 44 24 34          	mov    0x34(%esp),%eax
  4e2572:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e2577:	66 25 1f 00          	and    $0x1f,%ax
  4e257b:	66 05 20 00          	add    $0x20,%ax
  4e257f:	66 89 47 70          	mov    %ax,0x70(%edi)
  4e2583:	a1 78 d1 89 00       	mov    0x89d178,%eax
  4e2588:	8b c8                	mov    %eax,%ecx
  4e258a:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  4e258d:	8d 04 d1             	lea    (%ecx,%edx,8),%eax
  4e2590:	8d 04 81             	lea    (%ecx,%eax,4),%eax
  4e2593:	c1 e0 02             	shl    $0x2,%eax
  4e2596:	8d 04 c1             	lea    (%ecx,%eax,8),%eax
  4e2599:	05 df 24 00 00       	add    $0x24df,%eax
  4e259e:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e25a3:	89 44 24 30          	mov    %eax,0x30(%esp)
  4e25a7:	c1 4c 24 30 0d       	rorl   $0xd,0x30(%esp)
  4e25ac:	8b 44 24 30          	mov    0x30(%esp),%eax
  4e25b0:	57                   	push   %edi
  4e25b1:	a3 78 d1 89 00       	mov    %eax,0x89d178
  4e25b6:	e8 a5 7e 00 00       	call   0x4ea460
  4e25bb:	83 c4 04             	add    $0x4,%esp
  4e25be:	8b 47 0c             	mov    0xc(%edi),%eax
  4e25c1:	0d 80 00 00 00       	or     $0x80,%eax
  4e25c6:	89 47 0c             	mov    %eax,0xc(%edi)
  4e25c9:	0d 00 10 00 00       	or     $0x1000,%eax
  4e25ce:	89 47 0c             	mov    %eax,0xc(%edi)
  4e25d1:	8b 44 24 30          	mov    0x30(%esp),%eax
  4e25d5:	66 25 ff 07          	and    $0x7ff,%ax
  4e25d9:	66 89 47 57          	mov    %ax,0x57(%edi)
  4e25dd:	32 c0                	xor    %al,%al
  4e25df:	5d                   	pop    %ebp
  4e25e0:	5f                   	pop    %edi
  4e25e1:	5e                   	pop    %esi
  4e25e2:	5b                   	pop    %ebx
  4e25e3:	81 c4 f0 00 00 00    	add    $0xf0,%esp
  4e25e9:	c3                   	ret
  4e25ea:	8b ff                	mov    %edi,%edi
  4e25ec:	16                   	push   %ss
  4e25ed:	0b 4e 00             	or     0x0(%esi),%ecx
  4e25f0:	6a 0c                	push   $0xc
  4e25f2:	4e                   	dec    %esi
  4e25f3:	00 a1 16 4e 00 66    	add    %ah,0x66004e16(%ecx)
  4e25f9:	18 4e 00             	sbb    %cl,0x0(%esi)
  4e25fc:	08 1d 4e 00 aa 1e    	or     %bl,0x1eaa004e
  4e2602:	4e                   	dec    %esi
  4e2603:	00 1c 23             	add    %bl,(%ebx,%eiz,1)
  4e2606:	4e                   	dec    %esi
  4e2607:	00 d0                	add    %dl,%al
  4e2609:	23 4e 00             	and    0x0(%esi),%ecx
  4e260c:	c2 24 4e             	ret    $0x4e24
	...
