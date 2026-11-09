
populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0051e150 <.text+0x11d150>:
  51e150:	83 ec 08             	sub    $0x8,%esp
  51e153:	c6 44 24 03 00       	movb   $0x0,0x3(%esp)
  51e158:	53                   	push   %ebx
  51e159:	56                   	push   %esi
  51e15a:	57                   	push   %edi
  51e15b:	55                   	push   %ebp
  51e15c:	8b 6c 24 20          	mov    0x20(%esp),%ebp
  51e160:	66 83 bd 9d 00 00 00 	cmpw   $0x0,0x9d(%ebp)
  51e167:	00 
  51e168:	0f 85 77 01 00 00    	jne    0x51e2e5
  51e16e:	8d 45 3d             	lea    0x3d(%ebp),%eax
  51e171:	50                   	push   %eax
  51e172:	68 ff 00 00 00       	push   $0xff
  51e177:	6a 09                	push   $0x9
  51e179:	6a 0a                	push   $0xa
  51e17b:	e8 20 f7 fc ff       	call   0x4ed8a0
  51e180:	83 c4 10             	add    $0x10,%esp
  51e183:	8b f0                	mov    %eax,%esi
  51e185:	85 f6                	test   %esi,%esi
  51e187:	0f 84 58 01 00 00    	je     0x51e2e5
  51e18d:	c6 44 24 13 01       	movb   $0x1,0x13(%esp)
  51e192:	8b 7c 24 1c          	mov    0x1c(%esp),%edi
  51e196:	66 8b 47 24          	mov    0x24(%edi),%ax
  51e19a:	66 89 46 6a          	mov    %ax,0x6a(%esi)
  51e19e:	66 8b 4d 24          	mov    0x24(%ebp),%cx
  51e1a2:	66 89 4e 6c          	mov    %cx,0x6c(%esi)
  51e1a6:	8a 57 2f             	mov    0x2f(%edi),%dl
  51e1a9:	88 56 6e             	mov    %dl,0x6e(%esi)
  51e1ac:	8a 45 2f             	mov    0x2f(%ebp),%al
  51e1af:	88 46 6f             	mov    %al,0x6f(%esi)
  51e1b2:	8b 45 10             	mov    0x10(%ebp),%eax
  51e1b5:	8b 5f 10             	mov    0x10(%edi),%ebx
  51e1b8:	25 07 00 01 00       	and    $0x10007,%eax
  51e1bd:	81 e3 07 00 01 00    	and    $0x10007,%ebx
  51e1c3:	89 44 24 14          	mov    %eax,0x14(%esp)
  51e1c7:	f6 47 0e 10          	testb  $0x10,0xe(%edi)
  51e1cb:	75 1c                	jne    0x51e1e9
  51e1cd:	8a 47 2c             	mov    0x2c(%edi),%al
  51e1d0:	57                   	push   %edi
  51e1d1:	88 47 7d             	mov    %al,0x7d(%edi)
  51e1d4:	e8 17 f5 fc ff       	call   0x4ed6f0
  51e1d9:	83 c4 04             	add    $0x4,%esp
  51e1dc:	c6 47 2c 1d          	movb   $0x1d,0x2c(%edi)
  51e1e0:	57                   	push   %edi
  51e1e1:	e8 5a f4 fc ff       	call   0x4ed640
  51e1e6:	83 c4 04             	add    $0x4,%esp
  51e1e9:	f6 45 0e 10          	testb  $0x10,0xe(%ebp)
  51e1ed:	75 1c                	jne    0x51e20b
  51e1ef:	8a 45 2c             	mov    0x2c(%ebp),%al
  51e1f2:	55                   	push   %ebp
  51e1f3:	88 45 7d             	mov    %al,0x7d(%ebp)
  51e1f6:	e8 f5 f4 fc ff       	call   0x4ed6f0
  51e1fb:	83 c4 04             	add    $0x4,%esp
  51e1fe:	c6 45 2c 1d          	movb   $0x1d,0x2c(%ebp)
  51e202:	55                   	push   %ebp
  51e203:	e8 38 f4 fc ff       	call   0x4ed640
  51e208:	83 c4 04             	add    $0x4,%esp
  51e20b:	8b 44 24 14          	mov    0x14(%esp),%eax
  51e20f:	09 5f 10             	or     %ebx,0x10(%edi)
  51e212:	33 db                	xor    %ebx,%ebx
  51e214:	09 45 10             	or     %eax,0x10(%ebp)
  51e217:	66 8b 4e 24          	mov    0x24(%esi),%cx
  51e21b:	8a 5c 24 24          	mov    0x24(%esp),%bl
  51e21f:	66 89 8f 9d 00 00 00 	mov    %cx,0x9d(%edi)
  51e226:	85 db                	test   %ebx,%ebx
  51e228:	66 8b 4e 24          	mov    0x24(%esi),%cx
  51e22c:	66 89 8d 9d 00 00 00 	mov    %cx,0x9d(%ebp)
  51e233:	74 0c                	je     0x51e241
  51e235:	83 fb 01             	cmp    $0x1,%ebx
  51e238:	74 28                	je     0x51e262
  51e23a:	83 fb 02             	cmp    $0x2,%ebx
  51e23d:	74 2a                	je     0x51e269
  51e23f:	eb 41                	jmp    0x51e282
  51e241:	c6 47 2d 05          	movb   $0x5,0x2d(%edi)
  51e245:	81 4f 0c 00 00 00 40 	orl    $0x40000000,0xc(%edi)
  51e24c:	c6 45 2d 04          	movb   $0x4,0x2d(%ebp)
  51e250:	81 4d 0c 00 00 00 40 	orl    $0x40000000,0xc(%ebp)
  51e257:	55                   	push   %ebp
  51e258:	e8 83 6c fb ff       	call   0x4d4ee0
  51e25d:	83 c4 04             	add    $0x4,%esp
  51e260:	eb 20                	jmp    0x51e282
  51e262:	b8 03 00 00 00       	mov    $0x3,%eax
  51e267:	eb 05                	jmp    0x51e26e
  51e269:	b8 01 00 00 00       	mov    $0x1,%eax
  51e26e:	81 4f 0c 00 00 00 40 	orl    $0x40000000,0xc(%edi)
  51e275:	88 47 2d             	mov    %al,0x2d(%edi)
  51e278:	81 4d 0c 00 00 00 40 	orl    $0x40000000,0xc(%ebp)
  51e27f:	88 45 2d             	mov    %al,0x2d(%ebp)
  51e282:	83 fb 01             	cmp    $0x1,%ebx
  51e285:	7c 42                	jl     0x51e2c9
  51e287:	83 fb 02             	cmp    $0x2,%ebx
  51e28a:	7f 3d                	jg     0x51e2c9
  51e28c:	66 8b 45 3d          	mov    0x3d(%ebp),%ax
  51e290:	66 8b 4d 3f          	mov    0x3f(%ebp),%cx
  51e294:	88 64 24 14          	mov    %ah,0x14(%esp)
  51e298:	33 c0                	xor    %eax,%eax
  51e29a:	88 6c 24 15          	mov    %ch,0x15(%esp)
  51e29e:	66 8b 44 24 14       	mov    0x14(%esp),%ax
  51e2a3:	33 c9                	xor    %ecx,%ecx
  51e2a5:	66 8b 4c 24 14       	mov    0x14(%esp),%cx
  51e2aa:	25 fe 00 00 00       	and    $0xfe,%eax
  51e2af:	03 c0                	add    %eax,%eax
  51e2b1:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  51e2b7:	0b c1                	or     %ecx,%eax
  51e2b9:	66 8b 04 85 ec 03 8a 	mov    0x8a03ec(,%eax,4),%ax
  51e2c0:	00 
  51e2c1:	66 25 ff 03          	and    $0x3ff,%ax
  51e2c5:	66 89 46 68          	mov    %ax,0x68(%esi)
  51e2c9:	56                   	push   %esi
  51e2ca:	e8 61 a3 ff ff       	call   0x518630
  51e2cf:	83                   	.byte 0x83
