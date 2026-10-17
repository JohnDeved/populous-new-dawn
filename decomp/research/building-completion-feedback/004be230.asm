
../native-prerequisites-20261017/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004be230 <.text+0xbd230>:
  4be230:	66 8b 54 24 04       	mov    0x4(%esp),%dx
  4be235:	83 ec 04             	sub    $0x4,%esp
  4be238:	33 c0                	xor    %eax,%eax
  4be23a:	53                   	push   %ebx
  4be23b:	66 8b c2             	mov    %dx,%ax
  4be23e:	56                   	push   %esi
  4be23f:	57                   	push   %edi
  4be240:	25 fe 00 00 00       	and    $0xfe,%eax
  4be245:	66 89 54 24 0e       	mov    %dx,0xe(%esp)
  4be24a:	03 c0                	add    %eax,%eax
  4be24c:	33 c9                	xor    %ecx,%ecx
  4be24e:	66 8b ca             	mov    %dx,%cx
  4be251:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4be257:	0b c1                	or     %ecx,%eax
  4be259:	0f bf 34 85 e8 03 8a 	movswl 0x8a03e8(,%eax,4),%esi
  4be260:	00
  4be261:	8d 0c 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%ecx
  4be268:	8a c2                	mov    %dl,%al
  4be26a:	04 02                	add    $0x2,%al
  4be26c:	8b d6                	mov    %esi,%edx
  4be26e:	33 ff                	xor    %edi,%edi
  4be270:	88 44 24 0e          	mov    %al,0xe(%esp)
  4be274:	66 8b 7c 24 0e       	mov    0xe(%esp),%di
  4be279:	33 c0                	xor    %eax,%eax
  4be27b:	66 8b 44 24 0e       	mov    0xe(%esp),%ax
  4be280:	81 e7 00 fe 00 00    	and    $0xfe00,%edi
  4be286:	80 6c 24 0e 02       	subb   $0x2,0xe(%esp)
  4be28b:	25 fe 00 00 00       	and    $0xfe,%eax
  4be290:	03 c0                	add    %eax,%eax
  4be292:	0b c7                	or     %edi,%eax
  4be294:	33 ff                	xor    %edi,%edi
  4be296:	80 44 24 0f 02       	addb   $0x2,0xf(%esp)
  4be29b:	0f bf 1c 85 e8 03 8a 	movswl 0x8a03e8(,%eax,4),%ebx
  4be2a2:	00
  4be2a3:	66 8b 7c 24 0e       	mov    0xe(%esp),%di
  4be2a8:	2b d3                	sub    %ebx,%edx
  4be2aa:	33 c0                	xor    %eax,%eax
  4be2ac:	81 e7 00 fe 00 00    	and    $0xfe00,%edi
  4be2b2:	66 8b 44 24 0e       	mov    0xe(%esp),%ax
  4be2b7:	25 fe 00 00 00       	and    $0xfe,%eax
  4be2bc:	03 c0                	add    %eax,%eax
  4be2be:	0b c7                	or     %edi,%eax
  4be2c0:	0f bf 3c 85 e8 03 8a 	movswl 0x8a03e8(,%eax,4),%edi
  4be2c7:	00
  4be2c8:	2b fe                	sub    %esi,%edi
  4be2ca:	be 5e 01 00 00       	mov    $0x15e,%esi
  4be2cf:	0f bf 05 aa 7a 93 00 	movswl 0x937aaa,%eax
  4be2d6:	0f af f8             	imul   %eax,%edi
  4be2d9:	0f bf 05 a8 7a 93 00 	movswl 0x937aa8,%eax
  4be2e0:	0f af c2             	imul   %edx,%eax
  4be2e3:	2b f8                	sub    %eax,%edi
  4be2e5:	33 db                	xor    %ebx,%ebx
  4be2e7:	0f bf 05 ac 7a 93 00 	movswl 0x937aac,%eax
  4be2ee:	03 c7                	add    %edi,%eax
  4be2f0:	99                   	cltd
  4be2f1:	f7 fe                	idiv   %esi
  4be2f3:	8a 51 0e             	mov    0xe(%ecx),%dl
  4be2f6:	80 e2 0f             	and    $0xf,%dl
  4be2f9:	8a da                	mov    %dl,%bl
  4be2fb:	83 c3 08             	add    $0x8,%ebx
  4be2fe:	c1 e3 04             	shl    $0x4,%ebx
  4be301:	03 c3                	add    %ebx,%eax
  4be303:	79 0c                	jns    0x4be311
  4be305:	33 c0                	xor    %eax,%eax
  4be307:	5f                   	pop    %edi
  4be308:	5e                   	pop    %esi
  4be309:	88 41 0d             	mov    %al,0xd(%ecx)
  4be30c:	5b                   	pop    %ebx
  4be30d:	83 c4 04             	add    $0x4,%esp
  4be310:	c3                   	ret
  4be311:	3d 00 01 00 00       	cmp    $0x100,%eax
  4be316:	7c 05                	jl     0x4be31d
  4be318:	b8 ff 00 00 00       	mov    $0xff,%eax
  4be31d:	5f                   	pop    %edi
  4be31e:	88 41 0d             	mov    %al,0xd(%ecx)
  4be321:	5e                   	pop    %esi
  4be322:	5b                   	pop    %ebx
  4be323:	83 c4 04             	add    $0x4,%esp
  4be326:	c3                   	ret
  4be327:	cc                   	int3
  4be328:	cc                   	int3
  4be329:	cc                   	int3
  4be32a:	cc                   	int3
  4be32b:	cc                   	int3
  4be32c:	cc                   	int3
  4be32d:	cc                   	int3
  4be32e:	cc                   	int3
  4be32f:	cc                   	int3
