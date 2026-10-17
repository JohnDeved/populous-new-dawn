
../native-prerequisites-20261017/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004bf1b0 <.text+0xbe1b0>:
  4bf1b0:	66 8b 44 24 04       	mov    0x4(%esp),%ax
  4bf1b5:	81 ec 80 00 00 00    	sub    $0x80,%esp
  4bf1bb:	66 89 44 24 00       	mov    %ax,0x0(%esp)
  4bf1c0:	53                   	push   %ebx
  4bf1c1:	56                   	push   %esi
  4bf1c2:	33 c0                	xor    %eax,%eax
  4bf1c4:	66 8b 84 24 8c 00 00 	mov    0x8c(%esp),%ax
  4bf1cb:	00 
  4bf1cc:	57                   	push   %edi
  4bf1cd:	55                   	push   %ebp
  4bf1ce:	25 fe 00 00 00       	and    $0xfe,%eax
  4bf1d3:	03 c0                	add    %eax,%eax
  4bf1d5:	33 c9                	xor    %ecx,%ecx
  4bf1d7:	66 8b 8c 24 94 00 00 	mov    0x94(%esp),%cx
  4bf1de:	00 
  4bf1df:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4bf1e5:	0b c1                	or     %ecx,%eax
  4bf1e7:	8d 0c 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%ecx
  4bf1ee:	33 c0                	xor    %eax,%eax
  4bf1f0:	8a 41 0d             	mov    0xd(%ecx),%al
  4bf1f3:	8a 51 0a             	mov    0xa(%ecx),%dl
  4bf1f6:	89 44 24 44          	mov    %eax,0x44(%esp)
  4bf1fa:	0f bf 41 04          	movswl 0x4(%ecx),%eax
  4bf1fe:	83 c0 4b             	add    $0x4b,%eax
  4bf201:	84 d2                	test   %dl,%dl
  4bf203:	89 44 24 14          	mov    %eax,0x14(%esp)
  4bf207:	74 14                	je     0x4bf21d
  4bf209:	83 44 24 14 4b       	addl   $0x4b,0x14(%esp)
  4bf20e:	b8 fe 03 00 00       	mov    $0x3fe,%eax
  4bf213:	39 44 24 14          	cmp    %eax,0x14(%esp)
  4bf217:	7e 04                	jle    0x4bf21d
  4bf219:	89 44 24 14          	mov    %eax,0x14(%esp)
  4bf21d:	c7 44 24 24 20 00 00 	movl   $0x20,0x24(%esp)
  4bf224:	00 
  4bf225:	33 c0                	xor    %eax,%eax
  4bf227:	f6 01 08             	testb  $0x8,(%ecx)
  4bf22a:	8a c2                	mov    %dl,%al
  4bf22c:	89 44 24 54          	mov    %eax,0x54(%esp)
  4bf230:	75 08                	jne    0x4bf23a
  4bf232:	c7 44 24 24 00 00 00 	movl   $0x0,0x24(%esp)
  4bf239:	00 
  4bf23a:	8a 84 24 94 00 00 00 	mov    0x94(%esp),%al
  4bf241:	33 c9                	xor    %ecx,%ecx
  4bf243:	04 02                	add    $0x2,%al
  4bf245:	88 44 24 10          	mov    %al,0x10(%esp)
  4bf249:	33 c0                	xor    %eax,%eax
  4bf24b:	66 8b 44 24 10       	mov    0x10(%esp),%ax
  4bf250:	66 8b 4c 24 10       	mov    0x10(%esp),%cx
  4bf255:	25 fe 00 00 00       	and    $0xfe,%eax
  4bf25a:	03 c0                	add    %eax,%eax
  4bf25c:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4bf262:	0b c1                	or     %ecx,%eax
  4bf264:	8d 0c 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%ecx
  4bf26b:	33 c0                	xor    %eax,%eax
  4bf26d:	8a 41 0d             	mov    0xd(%ecx),%al
  4bf270:	8a 51 0a             	mov    0xa(%ecx),%dl
  4bf273:	89 44 24 4c          	mov    %eax,0x4c(%esp)
  4bf277:	0f bf 41 04          	movswl 0x4(%ecx),%eax
  4bf27b:	83 c0 4b             	add    $0x4b,%eax
  4bf27e:	84 d2                	test   %dl,%dl
  4bf280:	89 44 24 1c          	mov    %eax,0x1c(%esp)
  4bf284:	74 14                	je     0x4bf29a
  4bf286:	83 44 24 1c 4b       	addl   $0x4b,0x1c(%esp)
  4bf28b:	b8 fe 03 00 00       	mov    $0x3fe,%eax
  4bf290:	39 44 24 1c          	cmp    %eax,0x1c(%esp)
  4bf294:	7e 04                	jle    0x4bf29a
  4bf296:	89 44 24 1c          	mov    %eax,0x1c(%esp)
  4bf29a:	c7 44 24 2c 20 00 00 	movl   $0x20,0x2c(%esp)
  4bf2a1:	00 
  4bf2a2:	33 c0                	xor    %eax,%eax
  4bf2a4:	f6 01 08             	testb  $0x8,(%ecx)
  4bf2a7:	8a c2                	mov    %dl,%al
  4bf2a9:	89 44 24 5c          	mov    %eax,0x5c(%esp)
  4bf2ad:	75 08                	jne    0x4bf2b7
  4bf2af:	c7 44 24 2c 00 00 00 	movl   $0x0,0x2c(%esp)
  4bf2b6:	00 
  4bf2b7:	33 c0                	xor    %eax,%eax
  4bf2b9:	33 c9                	xor    %ecx,%ecx
  4bf2bb:	80 44 24 11 02       	addb   $0x2,0x11(%esp)
  4bf2c0:	66 8b 44 24 10       	mov    0x10(%esp),%ax
  4bf2c5:	66 8b 4c 24 10       	mov    0x10(%esp),%cx
  4bf2ca:	25 fe 00 00 00       	and    $0xfe,%eax
  4bf2cf:	03 c0                	add    %eax,%eax
  4bf2d1:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4bf2d7:	0b c1                	or     %ecx,%eax
  4bf2d9:	8d 0c 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%ecx
  4bf2e0:	33 c0                	xor    %eax,%eax
  4bf2e2:	8a 41 0d             	mov    0xd(%ecx),%al
  4bf2e5:	89 44 24 50          	mov    %eax,0x50(%esp)
  4bf2e9:	0f bf 41 04          	movswl 0x4(%ecx),%eax
  4bf2ed:	83 c0 4b             	add    $0x4b,%eax
  4bf2f0:	80 79 0a 00          	cmpb   $0x0,0xa(%ecx)
  4bf2f4:	89 44 24 20          	mov    %eax,0x20(%esp)
  4bf2f8:	74 14                	je     0x4bf30e
  4bf2fa:	83 44 24 20 4b       	addl   $0x4b,0x20(%esp)
  4bf2ff:	b8 fe 03 00 00       	mov    $0x3fe,%eax
  4bf304:	39 44 24 20          	cmp    %eax,0x20(%esp)
  4bf308:	7e 04                	jle    0x4bf30e
  4bf30a:	89 44 24 20          	mov    %eax,0x20(%esp)
  4bf30e:	c7 44 24 30 20 00 00 	movl   $0x20,0x30(%esp)
  4bf315:	00 
  4bf316:	33 c0                	xor    %eax,%eax
  4bf318:	f6 01 08             	testb  $0x8,(%ecx)
  4bf31b:	8a 41 0a             	mov    0xa(%ecx),%al
  4bf31e:	89 44 24 60          	mov    %eax,0x60(%esp)
  4bf322:	75 08                	jne    0x4bf32c
  4bf324:	c7 44 24 30 00 00 00 	movl   $0x0,0x30(%esp)
  4bf32b:	00 
  4bf32c:	33 c0                	xor    %eax,%eax
  4bf32e:	33 c9                	xor    %ecx,%ecx
  4bf330:	80 6c 24 10 02       	subb   $0x2,0x10(%esp)
  4bf335:	66 8b 44 24 10       	mov    0x10(%esp),%ax
  4bf33a:	66 8b 4c 24 10       	mov    0x10(%esp),%cx
  4bf33f:	25 fe 00 00 00       	and    $0xfe,%eax
  4bf344:	03 c0                	add    %eax,%eax
  4bf346:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4bf34c:	0b c1                	or     %ecx,%eax
  4bf34e:	8d 0c 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%ecx
  4bf355:	33 c0                	xor    %eax,%eax
  4bf357:	8a 41 0d             	mov    0xd(%ecx),%al
  4bf35a:	89 44 24 48          	mov    %eax,0x48(%esp)
  4bf35e:	0f bf 41 04          	movswl 0x4(%ecx),%eax
  4bf362:	83 c0 4b             	add    $0x4b,%eax
  4bf365:	80 79 0a 00          	cmpb   $0x0,0xa(%ecx)
  4bf369:	89 44 24 18          	mov    %eax,0x18(%esp)
  4bf36d:	74 14                	je     0x4bf383
  4bf36f:	83 44 24 18 4b       	addl   $0x4b,0x18(%esp)
  4bf374:	b8 fe 03 00 00       	mov    $0x3fe,%eax
  4bf379:	39 44 24 18          	cmp    %eax,0x18(%esp)
  4bf37d:	7e 04                	jle    0x4bf383
  4bf37f:	89 44 24 18          	mov    %eax,0x18(%esp)
  4bf383:	c7 44 24 28 20 00 00 	movl   $0x20,0x28(%esp)
  4bf38a:	00 
  4bf38b:	33 c0                	xor    %eax,%eax
  4bf38d:	f6 01 08             	testb  $0x8,(%ecx)
  4bf390:	8a 41 0a             	mov    0xa(%ecx),%al
  4bf393:	89 44 24 58          	mov    %eax,0x58(%esp)
  4bf397:	75 08                	jne    0x4bf3a1
  4bf399:	c7 44 24 28 00 00 00 	movl   $0x0,0x28(%esp)
  4bf3a0:	00 
  4bf3a1:	8b 44 24 48          	mov    0x48(%esp),%eax
  4bf3a5:	2b 44 24 44          	sub    0x44(%esp),%eax
  4bf3a9:	c1 e0 0d             	shl    $0xd,%eax
  4bf3ac:	89 44 24 10          	mov    %eax,0x10(%esp)
  4bf3b0:	8b 44 24 4c          	mov    0x4c(%esp),%eax
  4bf3b4:	2b 44 24 44          	sub    0x44(%esp),%eax
  4bf3b8:	c1 e0 0d             	shl    $0xd,%eax
  4bf3bb:	89 44 24 34          	mov    %eax,0x34(%esp)
  4bf3bf:	8b 44 24 50          	mov    0x50(%esp),%eax
  4bf3c3:	2b 44 24 48          	sub    0x48(%esp),%eax
  4bf3c7:	c1 e0 0d             	shl    $0xd,%eax
  4bf3ca:	2b 44 24 34          	sub    0x34(%esp),%eax
  4bf3ce:	c1 f8 03             	sar    $0x3,%eax
  4bf3d1:	89 84 24 80 00 00 00 	mov    %eax,0x80(%esp)
  4bf3d8:	8b 44 24 44          	mov    0x44(%esp),%eax
  4bf3dc:	c1 e0 10             	shl    $0x10,%eax
  4bf3df:	89 44 24 6c          	mov    %eax,0x6c(%esp)
  4bf3e3:	8b 44 24 18          	mov    0x18(%esp),%eax
  4bf3e7:	2b 44 24 14          	sub    0x14(%esp),%eax
  4bf3eb:	c1 e0 0d             	shl    $0xd,%eax
  4bf3ee:	89 44 24 7c          	mov    %eax,0x7c(%esp)
  4bf3f2:	8b 44 24 1c          	mov    0x1c(%esp),%eax
  4bf3f6:	2b 44 24 14          	sub    0x14(%esp),%eax
  4bf3fa:	c1 e0 0d             	shl    $0xd,%eax
  4bf3fd:	89 44 24 38          	mov    %eax,0x38(%esp)
  4bf401:	8b 44 24 20          	mov    0x20(%esp),%eax
  4bf405:	2b 44 24 18          	sub    0x18(%esp),%eax
  4bf409:	c1 e0 0d             	shl    $0xd,%eax
  4bf40c:	2b 44 24 38          	sub    0x38(%esp),%eax
  4bf410:	c1 f8 03             	sar    $0x3,%eax
  4bf413:	89 84 24 84 00 00 00 	mov    %eax,0x84(%esp)
  4bf41a:	8b 44 24 14          	mov    0x14(%esp),%eax
  4bf41e:	c1 e0 10             	shl    $0x10,%eax
  4bf421:	89 44 24 70          	mov    %eax,0x70(%esp)
  4bf425:	8b 44 24 58          	mov    0x58(%esp),%eax
  4bf429:	2b 44 24 54          	sub    0x54(%esp),%eax
  4bf42d:	c1 e0 0d             	shl    $0xd,%eax
  4bf430:	89 44 24 14          	mov    %eax,0x14(%esp)
  4bf434:	8b 44 24 5c          	mov    0x5c(%esp),%eax
  4bf438:	2b 44 24 54          	sub    0x54(%esp),%eax
  4bf43c:	c1 e0 0d             	shl    $0xd,%eax
  4bf43f:	89 44 24 3c          	mov    %eax,0x3c(%esp)
  4bf443:	8b 44 24 60          	mov    0x60(%esp),%eax
  4bf447:	2b 44 24 58          	sub    0x58(%esp),%eax
  4bf44b:	c1 e0 0d             	shl    $0xd,%eax
  4bf44e:	2b 44 24 3c          	sub    0x3c(%esp),%eax
  4bf452:	c1 f8 03             	sar    $0x3,%eax
  4bf455:	89 84 24 88 00 00 00 	mov    %eax,0x88(%esp)
  4bf45c:	8b 44 24 54          	mov    0x54(%esp),%eax
  4bf460:	c1 e0 10             	shl    $0x10,%eax
  4bf463:	89 44 24 74          	mov    %eax,0x74(%esp)
  4bf467:	8b 44 24 28          	mov    0x28(%esp),%eax
  4bf46b:	2b 44 24 24          	sub    0x24(%esp),%eax
  4bf46f:	c1 e0 0d             	shl    $0xd,%eax
  4bf472:	89 44 24 54          	mov    %eax,0x54(%esp)
  4bf476:	8b 44 24 2c          	mov    0x2c(%esp),%eax
  4bf47a:	2b 44 24 24          	sub    0x24(%esp),%eax
  4bf47e:	c1 e0 0d             	shl    $0xd,%eax
  4bf481:	89 44 24 40          	mov    %eax,0x40(%esp)
  4bf485:	8b 44 24 30          	mov    0x30(%esp),%eax
  4bf489:	2b 44 24 28          	sub    0x28(%esp),%eax
  4bf48d:	c1 e0 0d             	shl    $0xd,%eax
  4bf490:	2b 44 24 40          	sub    0x40(%esp),%eax
  4bf494:	c1 f8 03             	sar    $0x3,%eax
  4bf497:	89 84 24 8c 00 00 00 	mov    %eax,0x8c(%esp)
  4bf49e:	8b 44 24 24          	mov    0x24(%esp),%eax
  4bf4a2:	c1 e0 10             	shl    $0x10,%eax
  4bf4a5:	33 c9                	xor    %ecx,%ecx
  4bf4a7:	89 44 24 78          	mov    %eax,0x78(%esp)
  4bf4ab:	8a 84 24 95 00 00 00 	mov    0x95(%esp),%al
  4bf4b2:	24 0e                	and    $0xe,%al
  4bf4b4:	33 d2                	xor    %edx,%edx
  4bf4b6:	c0 e8 01             	shr    $0x1,%al
  4bf4b9:	8a c8                	mov    %al,%cl
  4bf4bb:	8a 84 24 94 00 00 00 	mov    0x94(%esp),%al
  4bf4c2:	c1 e1 08             	shl    $0x8,%ecx
  4bf4c5:	24 0e                	and    $0xe,%al
  4bf4c7:	c0 e8 01             	shr    $0x1,%al
  4bf4ca:	8b bc 24 98 00 00 00 	mov    0x98(%esp),%edi
  4bf4d1:	c7 44 24 24 08 00 00 	movl   $0x8,0x24(%esp)
  4bf4d8:	00 
  4bf4d9:	8a d0                	mov    %al,%dl
  4bf4db:	03 ca                	add    %edx,%ecx
  4bf4dd:	c1 e1 05             	shl    $0x5,%ecx
  4bf4e0:	03 0d d0 45 5d 00    	add    0x5d45d0,%ecx
  4bf4e6:	8b 44 24 6c          	mov    0x6c(%esp),%eax
  4bf4ea:	8b 74 24 70          	mov    0x70(%esp),%esi
  4bf4ee:	8b 54 24 74          	mov    0x74(%esp),%edx
  4bf4f2:	8b 5c 24 78          	mov    0x78(%esp),%ebx
  4bf4f6:	89 54 24 64          	mov    %edx,0x64(%esp)
  4bf4fa:	89 5c 24 68          	mov    %ebx,0x68(%esp)
  4bf4fe:	c7 44 24 44 08 00 00 	movl   $0x8,0x44(%esp)
  4bf505:	00 
  4bf506:	8b d6                	mov    %esi,%edx
  4bf508:	8b 1d b8 45 5d 00    	mov    0x5d45b8,%ebx
  4bf50e:	c1 fa 10             	sar    $0x10,%edx
  4bf511:	0f be 29             	movsbl (%ecx),%ebp
  4bf514:	0f bf 14 53          	movswl (%ebx,%edx,2),%edx
  4bf518:	0f af d5             	imul   %ebp,%edx
  4bf51b:	c1 fd 02             	sar    $0x2,%ebp
  4bf51e:	81 e2 03 fc ff ff    	and    $0xfffffc03,%edx
  4bf524:	c1 fa 02             	sar    $0x2,%edx
  4bf527:	8b de                	mov    %esi,%ebx
  4bf529:	81 e3 ff 00 ff ff    	and    $0xffff00ff,%ebx
  4bf52f:	03 74 24 38          	add    0x38(%esp),%esi
  4bf533:	c1 fb 08             	sar    $0x8,%ebx
  4bf536:	03 da                	add    %edx,%ebx
  4bf538:	8b d0                	mov    %eax,%edx
  4bf53a:	c1 fa 10             	sar    $0x10,%edx
  4bf53d:	03 d5                	add    %ebp,%edx
  4bf53f:	84 f6                	test   %dh,%dh
  4bf541:	74 15                	je     0x4bf558
  4bf543:	85 d2                	test   %edx,%edx
  4bf545:	7d 04                	jge    0x4bf54b
  4bf547:	33 d2                	xor    %edx,%edx
  4bf549:	eb 0d                	jmp    0x4bf558
  4bf54b:	81 fa ff 00 00 00    	cmp    $0xff,%edx
  4bf551:	7e 05                	jle    0x4bf558
  4bf553:	ba ff 00 00 00       	mov    $0xff,%edx
  4bf558:	03 da                	add    %edx,%ebx
  4bf55a:	03 44 24 34          	add    0x34(%esp),%eax
  4bf55e:	8b 2d c8 45 5d 00    	mov    0x5d45c8,%ebp
  4bf564:	33 d2                	xor    %edx,%edx
  4bf566:	8a 14 2b             	mov    (%ebx,%ebp,1),%dl
  4bf569:	8b 5c 24 64          	mov    0x64(%esp),%ebx
  4bf56d:	c1 fb 12             	sar    $0x12,%ebx
  4bf570:	8b 2d cc 45 5d 00    	mov    0x5d45cc,%ebp
  4bf576:	c1 e3 07             	shl    $0x7,%ebx
  4bf579:	03 d3                	add    %ebx,%edx
  4bf57b:	33 db                	xor    %ebx,%ebx
  4bf57d:	47                   	inc    %edi
  4bf57e:	83 c1 04             	add    $0x4,%ecx
  4bf581:	8a 1c 2a             	mov    (%edx,%ebp,1),%bl
  4bf584:	8b 54 24 68          	mov    0x68(%esp),%edx
  4bf588:	81 e2 ff 00 ff ff    	and    $0xffff00ff,%edx
  4bf58e:	c1 fa 08             	sar    $0x8,%edx
  4bf591:	8a 94 13 e0 ea 96 00 	mov    0x96eae0(%ebx,%edx,1),%dl
  4bf598:	8b 5c 24 3c          	mov    0x3c(%esp),%ebx
  4bf59c:	88 57 ff             	mov    %dl,-0x1(%edi)
  4bf59f:	01 5c 24 64          	add    %ebx,0x64(%esp)
  4bf5a3:	8b 54 24 40          	mov    0x40(%esp),%edx
  4bf5a7:	01 54 24 68          	add    %edx,0x68(%esp)
  4bf5ab:	ff 4c 24 44          	decl   0x44(%esp)
  4bf5af:	0f 85 51 ff ff ff    	jne    0x4bf506
  4bf5b5:	8b 44 24 10          	mov    0x10(%esp),%eax
  4bf5b9:	8b 54 24 7c          	mov    0x7c(%esp),%edx
  4bf5bd:	8b 5c 24 14          	mov    0x14(%esp),%ebx
  4bf5c1:	01 44 24 6c          	add    %eax,0x6c(%esp)
  4bf5c5:	8b 44 24 54          	mov    0x54(%esp),%eax
  4bf5c9:	01 54 24 70          	add    %edx,0x70(%esp)
  4bf5cd:	8b 94 24 80 00 00 00 	mov    0x80(%esp),%edx
  4bf5d4:	01 5c 24 74          	add    %ebx,0x74(%esp)
  4bf5d8:	8b 9c 24 84 00 00 00 	mov    0x84(%esp),%ebx
  4bf5df:	01 44 24 78          	add    %eax,0x78(%esp)
  4bf5e3:	8b 84 24 88 00 00 00 	mov    0x88(%esp),%eax
  4bf5ea:	81 c7 f8 00 00 00    	add    $0xf8,%edi
  4bf5f0:	81 c1 e0 03 00 00    	add    $0x3e0,%ecx
  4bf5f6:	01 54 24 34          	add    %edx,0x34(%esp)
  4bf5fa:	8b 94 24 8c 00 00 00 	mov    0x8c(%esp),%edx
  4bf601:	01 5c 24 38          	add    %ebx,0x38(%esp)
  4bf605:	01 44 24 3c          	add    %eax,0x3c(%esp)
  4bf609:	01 54 24 40          	add    %edx,0x40(%esp)
  4bf60d:	ff 4c 24 24          	decl   0x24(%esp)
  4bf611:	0f 85 cf fe ff ff    	jne    0x4bf4e6
  4bf617:	5d                   	pop    %ebp
  4bf618:	5f                   	pop    %edi
  4bf619:	5e                   	pop    %esi
  4bf61a:	5b                   	pop    %ebx
  4bf61b:	81 c4 80 00 00 00    	add    $0x80,%esp
  4bf621:	c3                   	ret
  4bf622:	cc                   	int3
  4bf623:	cc                   	int3
  4bf624:	cc                   	int3
  4bf625:	cc                   	int3
  4bf626:	cc                   	int3
  4bf627:	cc                   	int3
  4bf628:	cc                   	int3
  4bf629:	cc                   	int3
  4bf62a:	cc                   	int3
  4bf62b:	cc                   	int3
  4bf62c:	cc                   	int3
  4bf62d:	cc                   	int3
  4bf62e:	cc                   	int3
  4bf62f:	cc                   	int3
