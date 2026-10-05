
../prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004fb9d0 <.text+0xfa9d0>:
  4fb9d0:	88 44 24 11          	mov    %al,0x11(%esp)
  4fb9d4:	eb 05                	jmp    0x4fb9db
  4fb9d6:	c6 44 24 11 01       	movb   $0x1,0x11(%esp)
  4fb9db:	80 7c 24 11 00       	cmpb   $0x0,0x11(%esp)
  4fb9e0:	0f 84 9b 00 00 00    	je     0x4fba81
  4fb9e6:	66 83 be 9e 00 00 00 	cmpw   $0x0,0x9e(%esi)
  4fb9ed:	00 
  4fb9ee:	0f 85 8d 00 00 00    	jne    0x4fba81
  4fb9f4:	33 c0                	xor    %eax,%eax
  4fb9f6:	8a 46 68             	mov    0x68(%esi),%al
  4fb9f9:	83 f8 03             	cmp    $0x3,%eax
  4fb9fc:	74 0b                	je     0x4fba09
  4fb9fe:	66 c7 86 9e 00 00 00 	movw   $0x0,0x9e(%esi)
  4fba05:	00 00 
  4fba07:	eb 78                	jmp    0x4fba81
  4fba09:	33 db                	xor    %ebx,%ebx
  4fba0b:	8b 46 3d             	mov    0x3d(%esi),%eax
  4fba0e:	66 8b d0             	mov    %ax,%dx
  4fba11:	89 44 24 38          	mov    %eax,0x38(%esp)
  4fba15:	66 c7 86 9e 00 00 00 	movw   $0x33,0x9e(%esi)
  4fba1c:	33 00 
  4fba1e:	66 8b 4c 24 3a       	mov    0x3a(%esp),%cx
  4fba23:	8b 3d 70 03 89 00    	mov    0x890370,%edi
  4fba29:	3b fb                	cmp    %ebx,%edi
  4fba2b:	74 42                	je     0x4fba6f
  4fba2d:	8b 47 08             	mov    0x8(%edi),%eax
  4fba30:	8b 6f 0c             	mov    0xc(%edi),%ebp
  4fba33:	f7 c5 01 00 00 00    	test   $0x1,%ebp
  4fba39:	75 2a                	jne    0x4fba65
  4fba3b:	80 7f 2c 0c          	cmpb   $0xc,0x2c(%edi)
  4fba3f:	74 24                	je     0x4fba65
  4fba41:	f7 c5 00 00 02 00    	test   $0x20000,%ebp
  4fba47:	74 1c                	je     0x4fba65
  4fba49:	66 8b 6f 3d          	mov    0x3d(%edi),%bp
  4fba4d:	66 33 ea             	xor    %dx,%bp
  4fba50:	66 f7 c5 00 fe       	test   $0xfe00,%bp
  4fba55:	75 0e                	jne    0x4fba65
  4fba57:	66 8b 6f 3f          	mov    0x3f(%edi),%bp
  4fba5b:	66 33 e9             	xor    %cx,%bp
  4fba5e:	66 f7 c5 00 fe       	test   $0xfe00,%bp
  4fba63:	74 08                	je     0x4fba6d
  4fba65:	8b f8                	mov    %eax,%edi
  4fba67:	85 c0                	test   %eax,%eax
  4fba69:	75 c2                	jne    0x4fba2d
  4fba6b:	eb 02                	jmp    0x4fba6f
  4fba6d:	8b df                	mov    %edi,%ebx
  4fba6f:	85 db                	test   %ebx,%ebx
  4fba71:	74 0e                	je     0x4fba81
  4fba73:	6a 00                	push   $0x0
  4fba75:	6a 01                	push   $0x1
  4fba77:	53                   	push   %ebx
  4fba78:	56                   	push   %esi
  4fba79:	e8 a2 02 00 00       	call   0x4fbd20
  4fba7e:	83 c4 10             	add    $0x10,%esp
  4fba81:	66 8b 86 9e 00 00 00 	mov    0x9e(%esi),%ax
  4fba88:	66 85 c0             	test   %ax,%ax
  4fba8b:	74 13                	je     0x4fbaa0
  4fba8d:	66 48                	dec    %ax
  4fba8f:	66 89 86 9e 00 00 00 	mov    %ax,0x9e(%esi)
  4fba96:	66 85 c0             	test   %ax,%ax
  4fba99:	0f 9e c1             	setle  %cl
  4fba9c:	88 4c 24 11          	mov    %cl,0x11(%esp)
  4fbaa0:	80 7c 24 11 00       	cmpb   $0x0,0x11(%esp)
  4fbaa5:	0f 84 42 02 00 00    	je     0x4fbced
  4fbaab:	c7 44 24 44 0a 00 00 	movl   $0xa,0x44(%esp)
  4fbab2:	00 
  4fbab3:	8d 46 72             	lea    0x72(%esi),%eax
  4fbab6:	89 44 24 34          	mov    %eax,0x34(%esp)
  4fbaba:	8b 44 24 34          	mov    0x34(%esp),%eax
  4fbabe:	66 8b 00             	mov    (%eax),%ax
  4fbac1:	66 85 c0             	test   %ax,%ax
  4fbac4:	0f 84 f7 00 00 00    	je     0x4fbbc1
  4fbaca:	0f b7 c0             	movzwl %ax,%eax
  4fbacd:	b3 01                	mov    $0x1,%bl
  4fbacf:	8b 3c 85 90 03 89 00 	mov    0x890390(,%eax,4),%edi
  4fbad6:	66 0f b6 47 2a       	movzbw 0x2a(%edi),%ax
  4fbadb:	66 0f b6 4f 2b       	movzbw 0x2b(%edi),%cx
  4fbae0:	50                   	push   %eax
  4fbae1:	51                   	push   %ecx
  4fbae2:	e8 39 52 ff ff       	call   0x4f0d20
  4fbae7:	83 c4 08             	add    $0x8,%esp
  4fbaea:	84 c0                	test   %al,%al
  4fbaec:	75 3b                	jne    0x4fbb29
  4fbaee:	57                   	push   %edi
  4fbaef:	e8 5c 52 ff ff       	call   0x4f0d50
  4fbaf4:	83 c4 04             	add    $0x4,%esp
  4fbaf7:	85 c0                	test   %eax,%eax
  4fbaf9:	74 2e                	je     0x4fbb29
  4fbafb:	80 78 2a 06          	cmpb   $0x6,0x2a(%eax)
  4fbaff:	75 26                	jne    0x4fbb27
  4fbb01:	80 78 2b 06          	cmpb   $0x6,0x2b(%eax)
  4fbb05:	75 20                	jne    0x4fbb27
  4fbb07:	8a 46 6d             	mov    0x6d(%esi),%al
  4fbb0a:	0a c3                	or     %bl,%al
  4fbb0c:	88 46 6d             	mov    %al,0x6d(%esi)
  4fbb0f:	84 c3                	test   %al,%bl
  4fbb11:	74 03                	je     0x4fbb16
  4fbb13:	88 5e 6e             	mov    %bl,0x6e(%esi)
  4fbb16:	6a 01                	push   $0x1
  4fbb18:	6a 00                	push   $0x0
  4fbb1a:	6a 00                	push   $0x0
  4fbb1c:	56                   	push   %esi
  4fbb1d:	e8 fe 01 00 00       	call   0x4fbd20
  4fbb22:	83 c4 10             	add    $0x10,%esp
  4fbb25:	eb 02                	jmp    0x4fbb29
  4fbb27:	32 db                	xor    %bl,%bl
  4fbb29:	84 db                	test   %bl,%bl
  4fbb2b:	0f 84 90 00 00 00    	je     0x4fbbc1
  4fbb31:	80 7e 71 00          	cmpb   $0x0,0x71(%esi)
  4fbb35:	74 0f                	je     0x4fbb46
  4fbb37:	8a 86 a0 00 00 00    	mov    0xa0(%esi),%al
  4fbb3d:	3c ff                	cmp    $0xff,%al
  4fbb3f:	74 05                	je     0x4fbb46
  4fbb41:	0f be d8             	movsbl %al,%ebx
  4fbb44:	eb 04                	jmp    0x4fbb4a
  4fbb46:	0f be 5f 2f          	movsbl 0x2f(%edi),%ebx
  4fbb4a:	8d 47 3d             	lea    0x3d(%edi),%eax
  4fbb4d:	8a 4f 2b             	mov    0x2b(%edi),%cl
  4fbb50:	50                   	push   %eax
  4fbb51:	8a 57 2a             	mov    0x2a(%edi),%dl
  4fbb54:	53                   	push   %ebx
  4fbb55:	51                   	push   %ecx
  4fbb56:	52                   	push   %edx
  4fbb57:	e8 44 1d ff ff       	call   0x4ed8a0
  4fbb5c:	83 c4 10             	add    $0x10,%esp
  4fbb5f:	8b e8                	mov    %eax,%ebp
  4fbb61:	85 ed                	test   %ebp,%ebp
  4fbb63:	74 5c                	je     0x4fbbc1
  4fbb65:	57                   	push   %edi
  4fbb66:	55                   	push   %ebp
  4fbb67:	e8 a4 22 ff ff       	call   0x4ede10
  4fbb6c:	83 c4 08             	add    $0x8,%esp
  4fbb6f:	80 7e 71 00          	cmpb   $0x0,0x71(%esi)
  4fbb73:	74 0c                	je     0x4fbb81
  4fbb75:	80 be a0 00 00 00 ff 	cmpb   $0xff,0xa0(%esi)
  4fbb7c:	74 03                	je     0x4fbb81
  4fbb7e:	88 5d 2f             	mov    %bl,0x2f(%ebp)
  4fbb81:	55                   	push   %ebp
  4fbb82:	e8 79 1b ff ff       	call   0x4ed700
  4fbb87:	83 c4 04             	add    $0x4,%esp
  4fbb8a:	8a 86 a0 00 00 00    	mov    0xa0(%esi),%al
  4fbb90:	3c ff                	cmp    $0xff,%al
  4fbb92:	74 2d                	je     0x4fbbc1
  4fbb94:	80 7d 2a 06          	cmpb   $0x6,0x2a(%ebp)
  4fbb98:	75 27                	jne    0x4fbbc1
  4fbb9a:	80 7d 2b 02          	cmpb   $0x2,0x2b(%ebp)
  4fbb9e:	75 21                	jne    0x4fbbc1
  4fbba0:	80 7d 7d 01          	cmpb   $0x1,0x7d(%ebp)
  4fbba4:	75 1b                	jne    0x4fbbc1
  4fbba6:	66 c7 45 7a 52 00    	movw   $0x52,0x7a(%ebp)
  4fbbac:	6a 01                	push   $0x1
  4fbbae:	88 45 7e             	mov    %al,0x7e(%ebp)
  4fbbb1:	c6 45 7f 06          	movb   $0x6,0x7f(%ebp)
  4fbbb5:	6a 70                	push   $0x70
  4fbbb7:	6a 00                	push   $0x0
  4fbbb9:	e8 92 e4 f8 ff       	call   0x48a050
  4fbbbe:	83 c4 0c             	add    $0xc,%esp
  4fbbc1:	83 44 24 34 02       	addl   $0x2,0x34(%esp)
  4fbbc6:	ff 4c 24 44          	decl   0x44(%esp)
  4fbbca:	0f 85 ea fe ff ff    	jne    0x4fbaba
  4fbbd0:	c7 86 96 00 00 00 00 	movl   $0x0,0x96(%esi)
  4fbbd7:	00 00 00 
  4fbbda:	8a 46 6b             	mov    0x6b(%esi),%al
  4fbbdd:	84 c0                	test   %al,%al
  4fbbdf:	74 1a                	je     0x4fbbfb
  4fbbe1:	7e 0e                	jle    0x4fbbf1
  4fbbe3:	fe c8                	dec    %al
  4fbbe5:	88 46 6b             	mov    %al,0x6b(%esi)
  4fbbe8:	75 11                	jne    0x4fbbfb
  4fbbea:	c6 44 24 13 01       	movb   $0x1,0x13(%esp)
  4fbbef:	eb 16                	jmp    0x4fbc07
  4fbbf1:	c7 44 24 24 01 00 00 	movl   $0x1,0x24(%esp)
  4fbbf8:	00 
  4fbbf9:	eb 0c                	jmp    0x4fbc07
  4fbbfb:	0f bf 86 94 00 00 00 	movswl 0x94(%esi),%eax
  4fbc02:	40                   	inc    %eax
  4fbc03:	89 44 24 24          	mov    %eax,0x24(%esp)
  4fbc07:	83 7c 24 24 00       	cmpl   $0x0,0x24(%esp)
  4fbc0c:	74 51                	je     0x4fbc5f
  4fbc0e:	8a 46 6d             	mov    0x6d(%esi),%al
  4fbc11:	a8 04                	test   $0x4,%al
  4fbc13:	75 1e                	jne    0x4fbc33
  4fbc15:	0c 04                	or     $0x4,%al
  4fbc17:	88 46 6d             	mov    %al,0x6d(%esi)
  4fbc1a:	0f bf 86 a2 00 00 00 	movswl 0xa2(%esi),%eax
  4fbc21:	99                   	cltd
  4fbc22:	83 e2 03             	and    $0x3,%edx
  4fbc25:	03 c2                	add    %edx,%eax
  4fbc27:	c1 f8 02             	sar    $0x2,%eax
  4fbc2a:	0f bf c8             	movswl %ax,%ecx
  4fbc2d:	01 8e 9a 00 00 00    	add    %ecx,0x9a(%esi)
  4fbc33:	8a 46 6d             	mov    0x6d(%esi),%al
  4fbc36:	24 fe                	and    $0xfe,%al
  4fbc38:	88 46 6d             	mov    %al,0x6d(%esi)
  4fbc3b:	a8 01                	test   $0x1,%al
  4fbc3d:	74 04                	je     0x4fbc43
  4fbc3f:	c6 46 6e 01          	movb   $0x1,0x6e(%esi)
  4fbc43:	6a 00                	push   $0x0
  4fbc45:	6a 00                	push   $0x0
  4fbc47:	6a 00                	push   $0x0
  4fbc49:	56                   	push   %esi
  4fbc4a:	e8 d1 00 00 00       	call   0x4fbd20
  4fbc4f:	8b 44 24 34          	mov    0x34(%esp),%eax
  4fbc53:	83 c4 10             	add    $0x10,%esp
  4fbc56:	66 48                	dec    %ax
  4fbc58:	66 89 86 90 00 00 00 	mov    %ax,0x90(%esi)
  4fbc5f:	80 7c 24 13 00       	cmpb   $0x0,0x13(%esp)
  4fbc64:	0f 84 83 00 00 00    	je     0x4fbced
  4fbc6a:	8d 7e 72             	lea    0x72(%esi),%edi
  4fbc6d:	bb 0a 00 00 00       	mov    $0xa,%ebx
  4fbc72:	66 8b 07             	mov    (%edi),%ax
  4fbc75:	66 85 c0             	test   %ax,%ax
  4fbc78:	74 27                	je     0x4fbca1
  4fbc7a:	50                   	push   %eax
  4fbc7b:	56                   	push   %esi
  4fbc7c:	e8 0f 06 00 00       	call   0x4fc290
  4fbc81:	83 c4 08             	add    $0x8,%esp
  4fbc84:	84 c0                	test   %al,%al
  4fbc86:	75 19                	jne    0x4fbca1
  4fbc88:	33 c0                	xor    %eax,%eax
  4fbc8a:	66 8b 07             	mov    (%edi),%ax
  4fbc8d:	8b 04 85 90 03 89 00 	mov    0x890390(,%eax,4),%eax
  4fbc94:	50                   	push   %eax
  4fbc95:	83 48 14 40          	orl    $0x40,0x14(%eax)
  4fbc99:	e8 e2 34 ff ff       	call   0x4ef180
  4fbc9e:	83 c4 04             	add    $0x4,%esp
  4fbca1:	83 c7 02             	add    $0x2,%edi
  4fbca4:	4b                   	dec    %ebx
  4fbca5:	75 cb                	jne    0x4fbc72
  4fbca7:	56                   	push   %esi
  4fbca8:	e8 d3 34 ff ff       	call   0x4ef180
  4fbcad:	83 c4 04             	add    $0x4,%esp
  4fbcb0:	5d                   	pop    %ebp
  4fbcb1:	5f                   	pop    %edi
  4fbcb2:	5e                   	pop    %esi
  4fbcb3:	5b                   	pop    %ebx
  4fbcb4:	83 c4 38             	add    $0x38,%esp
  4fbcb7:	c3                   	ret
  4fbcb8:	66 8b 86 90 00 00 00 	mov    0x90(%esi),%ax
  4fbcbf:	66 85 c0             	test   %ax,%ax
  4fbcc2:	74 29                	je     0x4fbced
  4fbcc4:	66 48                	dec    %ax
  4fbcc6:	66 89 86 90 00 00 00 	mov    %ax,0x90(%esi)
  4fbccd:	75 1e                	jne    0x4fbced
  4fbccf:	80 c9 01             	or     $0x1,%cl
  4fbcd2:	f6 c1 01             	test   $0x1,%cl
  4fbcd5:	88 4e 6d             	mov    %cl,0x6d(%esi)
  4fbcd8:	74 04                	je     0x4fbcde
  4fbcda:	c6 46 6e 01          	movb   $0x1,0x6e(%esi)
  4fbcde:	6a 01                	push   $0x1
  4fbce0:	6a 00                	push   $0x0
  4fbce2:	6a 00                	push   $0x0
  4fbce4:	56                   	push   %esi
  4fbce5:	e8 36 00 00 00       	call   0x4fbd20
  4fbcea:	83 c4 10             	add    $0x10,%esp
  4fbced:	5d                   	pop    %ebp
  4fbcee:	5f                   	pop    %edi
  4fbcef:	5e                   	pop    %esi
