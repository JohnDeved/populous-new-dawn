
populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004ee580 <.text+0xed580>:
  4ee580:	8b 54 24 04          	mov    0x4(%esp),%edx
  4ee584:	83 ec 10             	sub    $0x10,%esp
  4ee587:	33 c0                	xor    %eax,%eax
  4ee589:	53                   	push   %ebx
  4ee58a:	f6 42 15 02          	testb  $0x2,0x15(%edx)
  4ee58e:	56                   	push   %esi
  4ee58f:	57                   	push   %edi
  4ee590:	55                   	push   %ebp
  4ee591:	75 13                	jne    0x4ee5a6
  4ee593:	8d 4a 3d             	lea    0x3d(%edx),%ecx
  4ee596:	8d 7c 24 18          	lea    0x18(%esp),%edi
  4ee59a:	8b 31                	mov    (%ecx),%esi
  4ee59c:	66 8b 49 04          	mov    0x4(%ecx),%cx
  4ee5a0:	89 37                	mov    %esi,(%edi)
  4ee5a2:	66 89 4f 04          	mov    %cx,0x4(%edi)
  4ee5a6:	8d 72 3d             	lea    0x3d(%edx),%esi
  4ee5a9:	8b 4c 24 28          	mov    0x28(%esp),%ecx
  4ee5ad:	66 8b 1e             	mov    (%esi),%bx
  4ee5b0:	66 8b 39             	mov    (%ecx),%di
  4ee5b3:	66 33 fb             	xor    %bx,%di
  4ee5b6:	66 f7 c7 00 fe       	test   $0xfe00,%di
  4ee5bb:	75 13                	jne    0x4ee5d0
  4ee5bd:	66 8b 79 02          	mov    0x2(%ecx),%di
  4ee5c1:	66 33 7a 3f          	xor    0x3f(%edx),%di
  4ee5c5:	66 f7 c7 00 fe       	test   $0xfe00,%di
  4ee5ca:	0f 84 e3 00 00 00    	je     0x4ee6b3
  4ee5d0:	b8 01 00 00 00       	mov    $0x1,%eax
  4ee5d5:	33 ff                	xor    %edi,%edi
  4ee5d7:	88 7c 24 12          	mov    %bh,0x12(%esp)
  4ee5db:	66 8b 5a 3f          	mov    0x3f(%edx),%bx
  4ee5df:	88 7c 24 13          	mov    %bh,0x13(%esp)
  4ee5e3:	33 db                	xor    %ebx,%ebx
  4ee5e5:	66 8b 7c 24 12       	mov    0x12(%esp),%di
  4ee5ea:	66 8b 5c 24 12       	mov    0x12(%esp),%bx
  4ee5ef:	81 e7 fe 00 00 00    	and    $0xfe,%edi
  4ee5f5:	03 ff                	add    %edi,%edi
  4ee5f7:	81 e3 00 fe 00 00    	and    $0xfe00,%ebx
  4ee5fd:	0b fb                	or     %ebx,%edi
  4ee5ff:	8d 1c bd e4 03 8a 00 	lea    0x8a03e4(,%edi,4),%ebx
  4ee606:	66 8b 7a 22          	mov    0x22(%edx),%di
  4ee60a:	66 85 ff             	test   %di,%di
  4ee60d:	74 14                	je     0x4ee623
  4ee60f:	0f b7 ff             	movzwl %di,%edi
  4ee612:	66 8b 5a 20          	mov    0x20(%edx),%bx
  4ee616:	8b 2c bd 90 03 89 00 	mov    0x890390(,%edi,4),%ebp
  4ee61d:	66 89 5d 20          	mov    %bx,0x20(%ebp)
  4ee621:	eb 08                	jmp    0x4ee62b
  4ee623:	66 8b 6a 20          	mov    0x20(%edx),%bp
  4ee627:	66 89 6b 06          	mov    %bp,0x6(%ebx)
  4ee62b:	66 8b 7a 20          	mov    0x20(%edx),%di
  4ee62f:	66 85 ff             	test   %di,%di
  4ee632:	74 12                	je     0x4ee646
  4ee634:	0f b7 ff             	movzwl %di,%edi
  4ee637:	66 8b 5a 22          	mov    0x22(%edx),%bx
  4ee63b:	8b 2c bd 90 03 89 00 	mov    0x890390(,%edi,4),%ebp
  4ee642:	66 89 5d 22          	mov    %bx,0x22(%ebp)
  4ee646:	81 62 0c ff ff fd ff 	andl   $0xfffdffff,0xc(%edx)
  4ee64d:	66 8b 19             	mov    (%ecx),%bx
  4ee650:	33 ff                	xor    %edi,%edi
  4ee652:	66 8b 7a 24          	mov    0x24(%edx),%di
  4ee656:	88 7c 24 14          	mov    %bh,0x14(%esp)
  4ee65a:	66 8b 59 02          	mov    0x2(%ecx),%bx
  4ee65e:	33 ed                	xor    %ebp,%ebp
  4ee660:	88 7c 24 15          	mov    %bh,0x15(%esp)
  4ee664:	33 db                	xor    %ebx,%ebx
  4ee666:	66 8b 5c 24 14       	mov    0x14(%esp),%bx
  4ee66b:	66 8b 6c 24 14       	mov    0x14(%esp),%bp
  4ee670:	81 e3 fe 00 00 00    	and    $0xfe,%ebx
  4ee676:	03 db                	add    %ebx,%ebx
  4ee678:	81 e5 00 fe 00 00    	and    $0xfe00,%ebp
  4ee67e:	0b dd                	or     %ebp,%ebx
  4ee680:	66 c7 42 22 00 00    	movw   $0x0,0x22(%edx)
  4ee686:	8d 2c 9d e4 03 8a 00 	lea    0x8a03e4(,%ebx,4),%ebp
  4ee68d:	66 8b 5d 06          	mov    0x6(%ebp),%bx
  4ee691:	66 89 5a 20          	mov    %bx,0x20(%edx)
  4ee695:	66 85 db             	test   %bx,%bx
  4ee698:	74 0e                	je     0x4ee6a8
  4ee69a:	0f b7 db             	movzwl %bx,%ebx
  4ee69d:	8b 1c 9d 90 03 89 00 	mov    0x890390(,%ebx,4),%ebx
  4ee6a4:	66 89 7b 22          	mov    %di,0x22(%ebx)
  4ee6a8:	66 89 7d 06          	mov    %di,0x6(%ebp)
  4ee6ac:	81 4a 0c 00 00 02 00 	orl    $0x20000,0xc(%edx)
  4ee6b3:	8b 39                	mov    (%ecx),%edi
  4ee6b5:	89 3e                	mov    %edi,(%esi)
  4ee6b7:	66 8b 49 04          	mov    0x4(%ecx),%cx
  4ee6bb:	66 89 4e 04          	mov    %cx,0x4(%esi)
  4ee6bf:	8b 4a 14             	mov    0x14(%edx),%ecx
  4ee6c2:	f6 c5 01             	test   $0x1,%ch
  4ee6c5:	74 2b                	je     0x4ee6f2
  4ee6c7:	f6 c5 02             	test   $0x2,%ch
  4ee6ca:	75 26                	jne    0x4ee6f2
  4ee6cc:	66 8b 0e             	mov    (%esi),%cx
  4ee6cf:	66 2b 4c 24 18       	sub    0x18(%esp),%cx
  4ee6d4:	66 89 4a 43          	mov    %cx,0x43(%edx)
  4ee6d8:	66 8b 4a 3f          	mov    0x3f(%edx),%cx
  4ee6dc:	66 2b 4c 24 1a       	sub    0x1a(%esp),%cx
  4ee6e1:	66 89 4a 45          	mov    %cx,0x45(%edx)
  4ee6e5:	66 8b 4a 41          	mov    0x41(%edx),%cx
  4ee6e9:	66 2b 4c 24 1c       	sub    0x1c(%esp),%cx
  4ee6ee:	66 89 4a 47          	mov    %cx,0x47(%edx)
  4ee6f2:	5d                   	pop    %ebp
  4ee6f3:	5f                   	pop    %edi
  4ee6f4:	5e                   	pop    %esi
  4ee6f5:	5b                   	pop    %ebx
  4ee6f6:	83 c4 10             	add    $0x10,%esp
  4ee6f9:	c3                   	ret
  4ee6fa:	cc                   	int3
  4ee6fb:	cc                   	int3
  4ee6fc:	cc                   	int3
  4ee6fd:	cc                   	int3
  4ee6fe:	cc                   	int3
  4ee6ff:	cc                   	int3
