
../prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00484f80 <.text+0x83f80>:
  484f80:	ff 01                	incl   (%ecx)
  484f82:	00 00                	add    %al,(%eax)
  484f84:	03 c2                	add    %edx,%eax
  484f86:	c1 f8 09             	sar    $0x9,%eax
  484f89:	89 01                	mov    %eax,(%ecx)
  484f8b:	8b 0d 43 24 89 00    	mov    0x892443,%ecx
  484f91:	8d 44 24 1c          	lea    0x1c(%esp),%eax
  484f95:	89 59 04             	mov    %ebx,0x4(%ecx)
  484f98:	8b 0d 43 24 89 00    	mov    0x892443,%ecx
  484f9e:	50                   	push   %eax
  484f9f:	c7 41 08 02 00 00 00 	movl   $0x2,0x8(%ecx)
  484fa6:	8b 0d 43 24 89 00    	mov    0x892443,%ecx
  484fac:	c7 41 0c ff ff ff ff 	movl   $0xffffffff,0xc(%ecx)
  484fb3:	8b 0d 43 24 89 00    	mov    0x892443,%ecx
  484fb9:	89 59 10             	mov    %ebx,0x10(%ecx)
  484fbc:	83 05 43 24 89 00 14 	addl   $0x14,0x892443
  484fc3:	c6 05 3a 24 89 00 01 	movb   $0x1,0x89243a
  484fca:	8a 56 01             	mov    0x1(%esi),%dl
  484fcd:	8a 4e ff             	mov    -0x1(%esi),%cl
  484fd0:	52                   	push   %edx
  484fd1:	8a 06                	mov    (%esi),%al
  484fd3:	51                   	push   %ecx
  484fd4:	50                   	push   %eax
  484fd5:	eb 3a                	jmp    0x485011
  484fd7:	3c 01                	cmp    $0x1,%al
  484fd9:	75 23                	jne    0x484ffe
  484fdb:	80 7e ff 07          	cmpb   $0x7,-0x1(%esi)
  484fdf:	75 0c                	jne    0x484fed
  484fe1:	0f be c1             	movsbl %cl,%eax
  484fe4:	8a 44 84 40          	mov    0x40(%esp,%eax,4),%al
  484fe8:	88 46 01             	mov    %al,0x1(%esi)
  484feb:	eb 11                	jmp    0x484ffe
  484fed:	f6 05 61 c6 89 00 08 	testb  $0x8,0x89c661
  484ff4:	74 08                	je     0x484ffe
  484ff6:	c6 46 01 ff          	movb   $0xff,0x1(%esi)
  484ffa:	c6 46 ff 01          	movb   $0x1,-0x1(%esi)
  484ffe:	8d 46 ff             	lea    -0x1(%esi),%eax
  485001:	8d 4c 24 1c          	lea    0x1c(%esp),%ecx
  485005:	51                   	push   %ecx
  485006:	8a 56 01             	mov    0x1(%esi),%dl
  485009:	52                   	push   %edx
  48500a:	8a 46 ff             	mov    -0x1(%esi),%al
  48500d:	50                   	push   %eax
  48500e:	8a 0e                	mov    (%esi),%cl
  485010:	51                   	push   %ecx
  485011:	e8 8a 88 06 00       	call   0x4ed8a0
  485016:	83 c4 10             	add    $0x10,%esp
  485019:	8b e8                	mov    %eax,%ebp
  48501b:	85 ed                	test   %ebp,%ebp
  48501d:	74 19                	je     0x485038
  48501f:	38 5d 2a             	cmp    %bl,0x2a(%ebp)
  485022:	75 04                	jne    0x485028
  485024:	c6 46 ff 03          	movb   $0x3,-0x1(%esi)
  485028:	8d 46 ff             	lea    -0x1(%esi),%eax
  48502b:	50                   	push   %eax
  48502c:	55                   	push   %ebp
  48502d:	e8 ce 0a 00 00       	call   0x485b00
  485032:	83 c4 08             	add    $0x8,%esp
  485035:	89 7d 08             	mov    %edi,0x8(%ebp)
  485038:	47                   	inc    %edi
  485039:	83 c6 37             	add    $0x37,%esi
  48503c:	ff 4c 24 24          	decl   0x24(%esp)
  485040:	0f 85 96 fe ff ff    	jne    0x484edc
  485046:	ff 4c 24 28          	decl   0x28(%esp)
  48504a:	0f 85 4a fe ff ff    	jne    0x484e9a
  485050:	e8 8b 01 00 00       	call   0x4851e0
  485055:	a1 24 03 89 00       	mov    0x890324,%eax
  48505a:	85 c0                	test   %eax,%eax
  48505c:	74 0c                	je     0x48506a
  48505e:	33 c9                	xor    %ecx,%ecx
  485060:	89 48 08             	mov    %ecx,0x8(%eax)
  485063:	8b 40 04             	mov    0x4(%eax),%eax
  485066:	85 c0                	test   %eax,%eax
  485068:	75 f6                	jne    0x485060
  48506a:	e8 31 16 00 00       	call   0x4866a0
  48506f:	e8 dc 8e 06 00       	call   0x4edf50
  485074:	a1 24 03 89 00       	mov    0x890324,%eax
  485079:	85 c0                	test   %eax,%eax
  48507b:	74 0e                	je     0x48508b
  48507d:	81 60 10 ff ff ff bf 	andl   $0xbfffffff,0x10(%eax)
  485084:	8b 40 04             	mov    0x4(%eax),%eax
  485087:	85 c0                	test   %eax,%eax
  485089:	75 f2                	jne    0x48507d
  48508b:	8b 35 24 03 89 00    	mov    0x890324,%esi
  485091:	85 f6                	test   %esi,%esi
  485093:	74 3d                	je     0x4850d2
  485095:	b9 06 00 00 00       	mov    $0x6,%ecx
  48509a:	38 4e 2a             	cmp    %cl,0x2a(%esi)
  48509d:	75 2c                	jne    0x4850cb
  48509f:	38 4e 2b             	cmp    %cl,0x2b(%esi)
  4850a2:	75 27                	jne    0x4850cb
  4850a4:	8d 56 72             	lea    0x72(%esi),%edx
  4850a7:	bf 0a 00 00 00       	mov    $0xa,%edi
  4850ac:	66 8b 02             	mov    (%edx),%ax
  4850af:	66 85 c0             	test   %ax,%ax
  4850b2:	74 11                	je     0x4850c5
  4850b4:	0f b7 c0             	movzwl %ax,%eax
  4850b7:	8b 1c 85 90 03 89 00 	mov    0x890390(,%eax,4),%ebx
  4850be:	81 4b 10 00 00 00 40 	orl    $0x40000000,0x10(%ebx)
  4850c5:	83 c2 02             	add    $0x2,%edx
  4850c8:	4f                   	dec    %edi
  4850c9:	75 e1                	jne    0x4850ac
  4850cb:	8b 76 04             	mov    0x4(%esi),%esi
  4850ce:	85 f6                	test   %esi,%esi
  4850d0:	75 c8                	jne    0x48509a
  4850d2:	8b 3d 78 03 89 00    	mov    0x890378,%edi
  4850d8:	39 3d 84 03 89 00    	cmp    %edi,0x890384
  4850de:	76 42                	jbe    0x485122
  4850e0:	bb 03 00 00 00       	mov    $0x3,%ebx
  4850e5:	be 00 00 00 40       	mov    $0x40000000,%esi
  4850ea:	33 c0                	xor    %eax,%eax
  4850ec:	8a 47 2a             	mov    0x2a(%edi),%al
  4850ef:	83 f8 07             	cmp    $0x7,%eax
  4850f2:	75 20                	jne    0x485114
  4850f4:	33 c0                	xor    %eax,%eax
  4850f6:	8a 47 2b             	mov    0x2b(%edi),%al
  4850f9:	83 f8 59             	cmp    $0x59,%eax
  4850fc:	75 16                	jne    0x485114
  4850fe:	38 1d 00 f0 88 00    	cmp    %bl,0x88f000
  485104:	74 0e                	je     0x485114
  485106:	85 77 10             	test   %esi,0x10(%edi)
  485109:	75 09                	jne    0x485114
  48510b:	57                   	push   %edi
  48510c:	e8 4f 3b ff ff       	call   0x478c60
  485111:	83 c4 04             	add    $0x4,%esp
  485114:	81 c7 b3 00 00 00    	add    $0xb3,%edi
  48511a:	39 3d 84 03 89 00    	cmp    %edi,0x890384
  485120:	77 c8                	ja     0x4850ea
  485122:	6a 40                	push   $0x40
  485124:	6a 00                	push   $0x0
  485126:	e8 15 8c 03 00       	call   0x4bdd40
  48512b:	8d 44 24 34          	lea    0x34(%esp),%eax
  48512f:	83 c4 08             	add    $0x8,%esp
  485132:	b9 11 db 89 00       	mov    $0x89db11,%ecx
  485137:	83 38 00             	cmpl   $0x0,(%eax)
  48513a:	75 06                	jne    0x485142
  48513c:	c7 01 61 00 00 00    	movl   $0x61,(%ecx)
  485142:	81 c1 65 0c 00 00    	add    $0xc65,%ecx
  485148:	83 c0 04             	add    $0x4,%eax
  48514b:	8d 54 24 3c          	lea    0x3c(%esp),%edx
  48514f:	3b c2                	cmp    %edx,%eax
  485151:	72 e4                	jb     0x485137
  485153:	80 7c 24 13 0b       	cmpb   $0xb,0x13(%esp)
  485158:	72 61                	jb     0x4851bb
  48515a:	e8 c1 eb 01 00       	call   0x4a3d20
  48515f:	8d 44 24 18          	lea    0x18(%esp),%eax
  485163:	8b 0d 0c df 59 00    	mov    0x59df0c,%ecx
  485169:	8b 54 24 14          	mov    0x14(%esp),%edx
  48516d:	50                   	push   %eax
  48516e:	68 96 00 00 00       	push   $0x96
  485173:	51                   	push   %ecx
  485174:	52                   	push   %edx
  485175:	e8 06 14 0a 00       	call   0x526580
  48517a:	83 c4 10             	add    $0x10,%esp
  48517d:	81 7c 24 18 96 00 00 	cmpl   $0x96,0x18(%esp)
  485184:	00 
  485185:	74 34                	je     0x4851bb
  485187:	8b 44 24 14          	mov    0x14(%esp),%eax
  48518b:	50                   	push   %eax
  48518c:	e8 df 11 0a 00       	call   0x526370
  485191:	83 c4 04             	add    $0x4,%esp
  485194:	33 c0                	xor    %eax,%eax
  485196:	5d                   	pop    %ebp
  485197:	5f                   	pop    %edi
  485198:	5e                   	pop    %esi
  485199:	5b                   	pop    %ebx
  48519a:	81 c4 60 02 00 00    	add    $0x260,%esp
  4851a0:	c3                   	ret
  4851a1:	8b 44 24 14          	mov    0x14(%esp),%eax
  4851a5:	50                   	push   %eax
  4851a6:	e8 c5 11 0a 00       	call   0x526370
  4851ab:	83 c4 04             	add    $0x4,%esp
  4851ae:	33 c0                	xor    %eax,%eax
  4851b0:	5d                   	pop    %ebp
  4851b1:	5f                   	pop    %edi
  4851b2:	5e                   	pop    %esi
  4851b3:	5b                   	pop    %ebx
  4851b4:	81 c4 60 02 00 00    	add    $0x260,%esp
  4851ba:	c3                   	ret
  4851bb:	8b 44 24 14          	mov    0x14(%esp),%eax
  4851bf:	50                   	push   %eax
  4851c0:	e8 ab 11 0a 00       	call   0x526370
  4851c5:	83 c4 04             	add    $0x4,%esp
  4851c8:	b8 01 00 00 00       	mov    $0x1,%eax
  4851cd:	5d                   	pop    %ebp
  4851ce:	5f                   	pop    %edi
  4851cf:	5e                   	pop    %esi
  4851d0:	5b                   	pop    %ebx
  4851d1:	81 c4 60 02 00 00    	add    $0x260,%esp
  4851d7:	c3                   	ret
  4851d8:	cc                   	int3
  4851d9:	cc                   	int3
  4851da:	cc                   	int3
  4851db:	cc                   	int3
  4851dc:	cc                   	int3
  4851dd:	cc                   	int3
  4851de:	cc                   	int3
  4851df:	cc                   	int3
