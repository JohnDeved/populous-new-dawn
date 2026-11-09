
populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004bbf30 <.text+0xbaf30>:
  4bbf30:	83 ec 68             	sub    $0x68,%esp
  4bbf33:	8d 54 24 04          	lea    0x4(%esp),%edx
  4bbf37:	53                   	push   %ebx
  4bbf38:	56                   	push   %esi
  4bbf39:	57                   	push   %edi
  4bbf3a:	8b 74 24 78          	mov    0x78(%esp),%esi
  4bbf3e:	55                   	push   %ebp
  4bbf3f:	8d 46 3d             	lea    0x3d(%esi),%eax
  4bbf42:	8b 08                	mov    (%eax),%ecx
  4bbf44:	89 0a                	mov    %ecx,(%edx)
  4bbf46:	33 c9                	xor    %ecx,%ecx
  4bbf48:	66 8b 40 04          	mov    0x4(%eax),%ax
  4bbf4c:	89 4c 24 2c          	mov    %ecx,0x2c(%esp)
  4bbf50:	66 89 42 04          	mov    %ax,0x4(%edx)
  4bbf54:	66 8b 86 88 00 00 00 	mov    0x88(%esi),%ax
  4bbf5b:	8a 5e 2f             	mov    0x2f(%esi),%bl
  4bbf5e:	0f bf 56 5f          	movswl 0x5f(%esi),%edx
  4bbf62:	66 3b c1             	cmp    %cx,%ax
  4bbf65:	89 54 24 24          	mov    %edx,0x24(%esp)
  4bbf69:	74 17                	je     0x4bbf82
  4bbf6b:	0f b7 c0             	movzwl %ax,%eax
  4bbf6e:	8b 04 85 90 03 89 00 	mov    0x890390(,%eax,4),%eax
  4bbf75:	f6 40 0c 01          	testb  $0x1,0xc(%eax)
  4bbf79:	75 07                	jne    0x4bbf82
  4bbf7b:	38 48 2a             	cmp    %cl,0x2a(%eax)
  4bbf7e:	74 02                	je     0x4bbf82
  4bbf80:	8b c8                	mov    %eax,%ecx
  4bbf82:	85 c9                	test   %ecx,%ecx
  4bbf84:	75 09                	jne    0x4bbf8f
  4bbf86:	66 c7 86 88 00 00 00 	movw   $0x0,0x88(%esi)
  4bbf8d:	00 00 
  4bbf8f:	66 8b 86 8a 00 00 00 	mov    0x8a(%esi),%ax
  4bbf96:	33 ff                	xor    %edi,%edi
  4bbf98:	66 3b c7             	cmp    %di,%ax
  4bbf9b:	74 18                	je     0x4bbfb5
  4bbf9d:	0f b7 c0             	movzwl %ax,%eax
  4bbfa0:	8b 04 85 90 03 89 00 	mov    0x890390(,%eax,4),%eax
  4bbfa7:	f6 40 0c 01          	testb  $0x1,0xc(%eax)
  4bbfab:	75 08                	jne    0x4bbfb5
  4bbfad:	80 78 2a 00          	cmpb   $0x0,0x2a(%eax)
  4bbfb1:	74 02                	je     0x4bbfb5
  4bbfb3:	8b f8                	mov    %eax,%edi
  4bbfb5:	85 ff                	test   %edi,%edi
  4bbfb7:	75 2e                	jne    0x4bbfe7
  4bbfb9:	66 c7 86 8a 00 00 00 	movw   $0x0,0x8a(%esi)
  4bbfc0:	00 00 
  4bbfc2:	66 8b 46 78          	mov    0x78(%esi),%ax
  4bbfc6:	66 8b 4e 76          	mov    0x76(%esi),%cx
  4bbfca:	50                   	push   %eax
  4bbfcb:	51                   	push   %ecx
  4bbfcc:	e8 6f 29 f9 ff       	call   0x44e940
  4bbfd1:	0f bf c0             	movswl %ax,%eax
  4bbfd4:	0f bf 4e 7a          	movswl 0x7a(%esi),%ecx
  4bbfd8:	83 c4 08             	add    $0x8,%esp
  4bbfdb:	3b c8                	cmp    %eax,%ecx
  4bbfdd:	7d 04                	jge    0x4bbfe3
  4bbfdf:	66 89 46 7a          	mov    %ax,0x7a(%esi)
  4bbfe3:	85 ff                	test   %edi,%edi
  4bbfe5:	74 5a                	je     0x4bc041
  4bbfe7:	80 7f 2a 02          	cmpb   $0x2,0x2a(%edi)
  4bbfeb:	75 36                	jne    0x4bc023
  4bbfed:	8d 44 24 28          	lea    0x28(%esp),%eax
  4bbff1:	50                   	push   %eax
  4bbff2:	57                   	push   %edi
  4bbff3:	e8 28 84 f4 ff       	call   0x404420
  4bbff8:	66 8b 4c 24 30       	mov    0x30(%esp),%cx
  4bbffd:	83 c4 08             	add    $0x8,%esp
  4bc000:	66 8b 44 24 2a       	mov    0x2a(%esp),%ax
  4bc005:	66 89 4e 76          	mov    %cx,0x76(%esi)
  4bc009:	50                   	push   %eax
  4bc00a:	66 89 46 78          	mov    %ax,0x78(%esi)
  4bc00e:	51                   	push   %ecx
  4bc00f:	66 c7 46 7a 00 00    	movw   $0x0,0x7a(%esi)
  4bc015:	e8 26 29 f9 ff       	call   0x44e940
  4bc01a:	66 89 46 7a          	mov    %ax,0x7a(%esi)
  4bc01e:	83 c4 08             	add    $0x8,%esp
  4bc021:	eb 12                	jmp    0x4bc035
  4bc023:	8d 47 3d             	lea    0x3d(%edi),%eax
  4bc026:	8d 56 76             	lea    0x76(%esi),%edx
  4bc029:	8b 08                	mov    (%eax),%ecx
  4bc02b:	89 0a                	mov    %ecx,(%edx)
  4bc02d:	66 8b 40 04          	mov    0x4(%eax),%ax
  4bc031:	66 89 42 04          	mov    %ax,0x4(%edx)
  4bc035:	66 8b 47 1c          	mov    0x1c(%edi),%ax
  4bc039:	66 05 10 00          	add    $0x10,%ax
  4bc03d:	66 01 46 7a          	add    %ax,0x7a(%esi)
  4bc041:	8d 46 76             	lea    0x76(%esi),%eax
  4bc044:	8d 54 24 1c          	lea    0x1c(%esp),%edx
  4bc048:	8b 08                	mov    (%eax),%ecx
  4bc04a:	89 0a                	mov    %ecx,(%edx)
  4bc04c:	66 8b 40 04          	mov    0x4(%eax),%ax
  4bc050:	0f bf 4c 24 14       	movswl 0x14(%esp),%ecx
  4bc055:	66 89 42 04          	mov    %ax,0x4(%edx)
  4bc059:	0f bf 44 24 1c       	movswl 0x1c(%esp),%eax
  4bc05e:	2b c1                	sub    %ecx,%eax
  4bc060:	99                   	cltd
  4bc061:	33 c2                	xor    %edx,%eax
  4bc063:	2b c2                	sub    %edx,%eax
  4bc065:	3d 08 04 00 00       	cmp    $0x408,%eax
  4bc06a:	7d 63                	jge    0x4bc0cf
  4bc06c:	0f bf 44 24 20       	movswl 0x20(%esp),%eax
  4bc071:	0f bf 4c 24 18       	movswl 0x18(%esp),%ecx
  4bc076:	2b c1                	sub    %ecx,%eax
  4bc078:	99                   	cltd
  4bc079:	33 c2                	xor    %edx,%eax
  4bc07b:	2b c2                	sub    %edx,%eax
  4bc07d:	3d 08 04 00 00       	cmp    $0x408,%eax
  4bc082:	7d 4b                	jge    0x4bc0cf
  4bc084:	0f bf 44 24 1e       	movswl 0x1e(%esp),%eax
  4bc089:	0f bf 4c 24 16       	movswl 0x16(%esp),%ecx
  4bc08e:	2b c1                	sub    %ecx,%eax
  4bc090:	99                   	cltd
  4bc091:	33 c2                	xor    %edx,%eax
  4bc093:	2b c2                	sub    %edx,%eax
  4bc095:	3d 08 04 00 00       	cmp    $0x408,%eax
  4bc09a:	7d 33                	jge    0x4bc0cf
  4bc09c:	8d 44 24 14          	lea    0x14(%esp),%eax
  4bc0a0:	8d 4c 24 1c          	lea    0x1c(%esp),%ecx
  4bc0a4:	50                   	push   %eax
  4bc0a5:	51                   	push   %ecx
  4bc0a6:	e8 75 44 f9 ff       	call   0x450520
  4bc0ab:	83 c4 08             	add    $0x8,%esp
  4bc0ae:	3b 44 24 24          	cmp    0x24(%esp),%eax
  4bc0b2:	7d 1b                	jge    0x4bc0cf
  4bc0b4:	8d 04 40             	lea    (%eax,%eax,2),%eax
  4bc0b7:	c7 44 24 2c 01 00 00 	movl   $0x1,0x2c(%esp)
  4bc0be:	00 
  4bc0bf:	8d 04 80             	lea    (%eax,%eax,4),%eax
  4bc0c2:	99                   	cltd
  4bc0c3:	83 e2 0f             	and    $0xf,%edx
  4bc0c6:	03 c2                	add    %edx,%eax
  4bc0c8:	c1 f8 04             	sar    $0x4,%eax
  4bc0cb:	89 44 24 24          	mov    %eax,0x24(%esp)
  4bc0cf:	8d 46 3d             	lea    0x3d(%esi),%eax
  4bc0d2:	8a 4e 2f             	mov    0x2f(%esi),%cl
  4bc0d5:	50                   	push   %eax
  4bc0d6:	51                   	push   %ecx
  4bc0d7:	6a 03                	push   $0x3
  4bc0d9:	6a 07                	push   $0x7
  4bc0db:	e8 c0 17 03 00       	call   0x4ed8a0
  4bc0e0:	66 8b 44 24 2c       	mov    0x2c(%esp),%ax
  4bc0e5:	83 c4 10             	add    $0x10,%esp
  4bc0e8:	0f bf 54 24 18       	movswl 0x18(%esp),%edx
  4bc0ed:	66 2b 44 24 14       	sub    0x14(%esp),%ax
  4bc0f2:	0f b7 c8             	movzwl %ax,%ecx
  4bc0f5:	0f bf 44 24 20       	movswl 0x20(%esp),%eax
  4bc0fa:	2b c2                	sub    %edx,%eax
  4bc0fc:	03 c0                	add    %eax,%eax
  4bc0fe:	89 44 24 30          	mov    %eax,0x30(%esp)
  4bc102:	66 8b 44 24 1e       	mov    0x1e(%esp),%ax
  4bc107:	66 2b 44 24 16       	sub    0x16(%esp),%ax
  4bc10c:	85 c9                	test   %ecx,%ecx
  4bc10e:	0f b7 d0             	movzwl %ax,%edx
  4bc111:	8b c1                	mov    %ecx,%eax
  4bc113:	7d 04                	jge    0x4bc119
  4bc115:	8b c1                	mov    %ecx,%eax
  4bc117:	f7 d8                	neg    %eax
  4bc119:	8b ea                	mov    %edx,%ebp
  4bc11b:	85 d2                	test   %edx,%edx
  4bc11d:	7d 04                	jge    0x4bc123
  4bc11f:	8b ea                	mov    %edx,%ebp
  4bc121:	f7 dd                	neg    %ebp
  4bc123:	3d 00 80 00 00       	cmp    $0x8000,%eax
  4bc128:	7c 06                	jl     0x4bc130
  4bc12a:	8d 88 00 00 ff ff    	lea    -0x10000(%eax),%ecx
  4bc130:	81 fd 00 80 00 00    	cmp    $0x8000,%ebp
  4bc136:	7c 06                	jl     0x4bc13e
  4bc138:	8d 95 00 00 ff ff    	lea    -0x10000(%ebp),%edx
  4bc13e:	8b e9                	mov    %ecx,%ebp
  4bc140:	85 c9                	test   %ecx,%ecx
  4bc142:	7d 04                	jge    0x4bc148
  4bc144:	8b e9                	mov    %ecx,%ebp
  4bc146:	f7 dd                	neg    %ebp
  4bc148:	8b c2                	mov    %edx,%eax
  4bc14a:	85 d2                	test   %edx,%edx
  4bc14c:	7d 04                	jge    0x4bc152
  4bc14e:	8b c2                	mov    %edx,%eax
  4bc150:	f7 d8                	neg    %eax
  4bc152:	3b e8                	cmp    %eax,%ebp
  4bc154:	7f 02                	jg     0x4bc158
  4bc156:	8b e8                	mov    %eax,%ebp
  4bc158:	f7 da                	neg    %edx
  4bc15a:	52                   	push   %edx
  4bc15b:	51                   	push   %ecx
  4bc15c:	e8 13 9f 0c 00       	call   0x586074
  4bc161:	66 89 44 24 18       	mov    %ax,0x18(%esp)
  4bc166:	83 c4 08             	add    $0x8,%esp
  4bc169:	66 81 64 24 10 ff 07 	andw   $0x7ff,0x10(%esp)
  4bc170:	8b 44 24 30          	mov    0x30(%esp),%eax
  4bc174:	f7 d8                	neg    %eax
  4bc176:	50                   	push   %eax
  4bc177:	55                   	push   %ebp
  4bc178:	e8 f7 9e 0c 00       	call   0x586074
  4bc17d:	66 25 ff 07          	and    $0x7ff,%ax
  4bc181:	8b 54 24 2c          	mov    0x2c(%esp),%edx
  4bc185:	8b 4c 24 18          	mov    0x18(%esp),%ecx
  4bc189:	83 c4 08             	add    $0x8,%esp
  4bc18c:	52                   	push   %edx
  4bc18d:	50                   	push   %eax
  4bc18e:	8d 44 24 1c          	lea    0x1c(%esp),%eax
  4bc192:	51                   	push   %ecx
  4bc193:	50                   	push   %eax
  4bc194:	e8 27 a9 02 00       	call   0x4e6ac0
  4bc199:	8b 4c 24 26          	mov    0x26(%esp),%ecx
  4bc19d:	8b 54 24 24          	mov    0x24(%esp),%edx
  4bc1a1:	83 c4 10             	add    $0x10,%esp
  4bc1a4:	51                   	push   %ecx
  4bc1a5:	52                   	push   %edx
  4bc1a6:	e8 95 27 f9 ff       	call   0x44e940
  4bc1ab:	0f bf 4c 24 20       	movswl 0x20(%esp),%ecx
  4bc1b0:	0f bf c0             	movswl %ax,%eax
  4bc1b3:	83 c4 08             	add    $0x8,%esp
  4bc1b6:	3b c8                	cmp    %eax,%ecx
  4bc1b8:	7d 05                	jge    0x4bc1bf
  4bc1ba:	66 89 44 24 18       	mov    %ax,0x18(%esp)
  4bc1bf:	8d 44 24 14          	lea    0x14(%esp),%eax
  4bc1c3:	50                   	push   %eax
  4bc1c4:	56                   	push   %esi
  4bc1c5:	e8 b6 23 03 00       	call   0x4ee580
  4bc1ca:	66 8b 46 3d          	mov    0x3d(%esi),%ax
  4bc1ce:	83 c4 08             	add    $0x8,%esp
  4bc1d1:	66 c1 e8 08          	shr    $0x8,%ax
  4bc1d5:	24 fe                	and    $0xfe,%al
  4bc1d7:	88 44 24 30          	mov    %al,0x30(%esp)
  4bc1db:	66 8b 46 3f          	mov    0x3f(%esi),%ax
  4bc1df:	66 c1 e8 08          	shr    $0x8,%ax
  4bc1e3:	24 fe                	and    $0xfe,%al
  4bc1e5:	88 44 24 31          	mov    %al,0x31(%esp)
  4bc1e9:	66 8b 4c 24 30       	mov    0x30(%esp),%cx
  4bc1ee:	66 89 4c 24 10       	mov    %cx,0x10(%esp)
  4bc1f3:	80 6c 24 10 02       	subb   $0x2,0x10(%esp)
  4bc1f8:	80 44 24 11 02       	addb   $0x2,0x11(%esp)
  4bc1fd:	66 8b 4c 24 10       	mov    0x10(%esp),%cx
  4bc202:	66 89 4c 24 34       	mov    %cx,0x34(%esp)
  4bc207:	80 44 24 10 02       	addb   $0x2,0x10(%esp)
  4bc20c:	66 8b 4c 24 10       	mov    0x10(%esp),%cx
  4bc211:	66 89 4c 24 3c       	mov    %cx,0x3c(%esp)
  4bc216:	80 44 24 10 02       	addb   $0x2,0x10(%esp)
  4bc21b:	66 8b 4c 24 10       	mov    0x10(%esp),%cx
  4bc220:	66 89 4c 24 44       	mov    %cx,0x44(%esp)
  4bc225:	80 6c 24 11 02       	subb   $0x2,0x11(%esp)
  4bc22a:	66 8b 4c 24 10       	mov    0x10(%esp),%cx
  4bc22f:	66 89 4c 24 4c       	mov    %cx,0x4c(%esp)
  4bc234:	80 6c 24 11 02       	subb   $0x2,0x11(%esp)
  4bc239:	66 8b 4c 24 10       	mov    0x10(%esp),%cx
  4bc23e:	66 89 4c 24 54       	mov    %cx,0x54(%esp)
  4bc243:	80 6c 24 10 02       	subb   $0x2,0x10(%esp)
  4bc248:	66 8b 4c 24 10       	mov    0x10(%esp),%cx
  4bc24d:	66 89 4c 24 5c       	mov    %cx,0x5c(%esp)
  4bc252:	80 6c 24 10 02       	subb   $0x2,0x10(%esp)
  4bc257:	66 8b 4c 24 10       	mov    0x10(%esp),%cx
  4bc25c:	66 89 4c 24 64       	mov    %cx,0x64(%esp)
  4bc261:	33 c0                	xor    %eax,%eax
  4bc263:	80 44 24 11 02       	addb   $0x2,0x11(%esp)
  4bc268:	66 8b 4c 24 10       	mov    0x10(%esp),%cx
  4bc26d:	66 89 4c 24 6c       	mov    %cx,0x6c(%esp)
  4bc272:	80 44 24 10 02       	addb   $0x2,0x10(%esp)
  4bc277:	66 8b 4c 24 10       	mov    0x10(%esp),%cx
  4bc27c:	66 89 4c 24 74       	mov    %cx,0x74(%esp)
  4bc281:	33 c9                	xor    %ecx,%ecx
  4bc283:	66 8b 44 24 34       	mov    0x34(%esp),%ax
  4bc288:	66 8b 4c 24 34       	mov    0x34(%esp),%cx
  4bc28d:	25 fe 00 00 00       	and    $0xfe,%eax
  4bc292:	03 c0                	add    %eax,%eax
  4bc294:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4bc29a:	0b c1                	or     %ecx,%eax
  4bc29c:	33 c9                	xor    %ecx,%ecx
  4bc29e:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4bc2a5:	33 c0                	xor    %eax,%eax
  4bc2a7:	89 54 24 30          	mov    %edx,0x30(%esp)
  4bc2ab:	66 8b 44 24 3c       	mov    0x3c(%esp),%ax
  4bc2b0:	66 8b 4c 24 3c       	mov    0x3c(%esp),%cx
  4bc2b5:	25 fe 00 00 00       	and    $0xfe,%eax
  4bc2ba:	03 c0                	add    %eax,%eax
  4bc2bc:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4bc2c2:	0b c1                	or     %ecx,%eax
  4bc2c4:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4bc2cb:	33 c9                	xor    %ecx,%ecx
  4bc2cd:	33 c0                	xor    %eax,%eax
  4bc2cf:	89 54 24 38          	mov    %edx,0x38(%esp)
  4bc2d3:	66 8b 44 24 44       	mov    0x44(%esp),%ax
  4bc2d8:	66 8b 4c 24 44       	mov    0x44(%esp),%cx
  4bc2dd:	25 fe 00 00 00       	and    $0xfe,%eax
  4bc2e2:	03 c0                	add    %eax,%eax
  4bc2e4:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4bc2ea:	0b c1                	or     %ecx,%eax
  4bc2ec:	33 c9                	xor    %ecx,%ecx
  4bc2ee:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4bc2f5:	33 c0                	xor    %eax,%eax
  4bc2f7:	89 54 24 40          	mov    %edx,0x40(%esp)
  4bc2fb:	66 8b 44 24 4c       	mov    0x4c(%esp),%ax
  4bc300:	66 8b 4c 24 4c       	mov    0x4c(%esp),%cx
  4bc305:	25 fe 00 00 00       	and    $0xfe,%eax
  4bc30a:	03 c0                	add    %eax,%eax
  4bc30c:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4bc312:	0b c1                	or     %ecx,%eax
  4bc314:	33 c9                	xor    %ecx,%ecx
  4bc316:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4bc31d:	33 c0                	xor    %eax,%eax
  4bc31f:	89 54 24 48          	mov    %edx,0x48(%esp)
  4bc323:	66 8b 44 24 54       	mov    0x54(%esp),%ax
  4bc328:	66 8b 4c 24 54       	mov    0x54(%esp),%cx
  4bc32d:	25 fe 00 00 00       	and    $0xfe,%eax
  4bc332:	03 c0                	add    %eax,%eax
  4bc334:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4bc33a:	0b c1                	or     %ecx,%eax
  4bc33c:	33 c9                	xor    %ecx,%ecx
  4bc33e:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4bc345:	33 c0                	xor    %eax,%eax
  4bc347:	89 54 24 50          	mov    %edx,0x50(%esp)
  4bc34b:	66 8b 44 24 5c       	mov    0x5c(%esp),%ax
  4bc350:	66 8b 4c 24 5c       	mov    0x5c(%esp),%cx
  4bc355:	25 fe 00 00 00       	and    $0xfe,%eax
  4bc35a:	03 c0                	add    %eax,%eax
  4bc35c:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4bc362:	0b c1                	or     %ecx,%eax
  4bc364:	33 c9                	xor    %ecx,%ecx
  4bc366:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4bc36d:	33 c0                	xor    %eax,%eax
  4bc36f:	89 54 24 58          	mov    %edx,0x58(%esp)
  4bc373:	66 8b 44 24 64       	mov    0x64(%esp),%ax
  4bc378:	66 8b 4c 24 64       	mov    0x64(%esp),%cx
  4bc37d:	25 fe 00 00 00       	and    $0xfe,%eax
  4bc382:	03 c0                	add    %eax,%eax
  4bc384:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4bc38a:	0b c1                	or     %ecx,%eax
  4bc38c:	33 c9                	xor    %ecx,%ecx
  4bc38e:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4bc395:	33 c0                	xor    %eax,%eax
  4bc397:	89 54 24 60          	mov    %edx,0x60(%esp)
  4bc39b:	66 8b 44 24 6c       	mov    0x6c(%esp),%ax
  4bc3a0:	66 8b 4c 24 6c       	mov    0x6c(%esp),%cx
  4bc3a5:	25 fe 00 00 00       	and    $0xfe,%eax
  4bc3aa:	03 c0                	add    %eax,%eax
  4bc3ac:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4bc3b2:	0b c1                	or     %ecx,%eax
  4bc3b4:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4bc3bb:	33 c0                	xor    %eax,%eax
  4bc3bd:	33 c9                	xor    %ecx,%ecx
  4bc3bf:	66 8b 44 24 10       	mov    0x10(%esp),%ax
  4bc3c4:	89 54 24 68          	mov    %edx,0x68(%esp)
  4bc3c8:	66 8b 4c 24 10       	mov    0x10(%esp),%cx
  4bc3cd:	25 fe 00 00 00       	and    $0xfe,%eax
  4bc3d2:	03 c0                	add    %eax,%eax
  4bc3d4:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4bc3da:	0b c1                	or     %ecx,%eax
  4bc3dc:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4bc3e3:	89 54 24 70          	mov    %edx,0x70(%esp)
  4bc3e7:	8d 54 24 30          	lea    0x30(%esp),%edx
  4bc3eb:	8b 02                	mov    (%edx),%eax
  4bc3ed:	0f bf 48 06          	movswl 0x6(%eax),%ecx
  4bc3f1:	8b 2c 8d 90 03 89 00 	mov    0x890390(,%ecx,4),%ebp
  4bc3f8:	85 ed                	test   %ebp,%ebp
  4bc3fa:	74 59                	je     0x4bc455
  4bc3fc:	b8 01 00 00 00       	mov    $0x1,%eax
  4bc401:	38 45 2a             	cmp    %al,0x2a(%ebp)
  4bc404:	75 3e                	jne    0x4bc444
  4bc406:	38 5d 2f             	cmp    %bl,0x2f(%ebp)
  4bc409:	75 39                	jne    0x4bc444
  4bc40b:	80 7d 2c 29          	cmpb   $0x29,0x2c(%ebp)
  4bc40f:	74 33                	je     0x4bc444
  4bc411:	33 c9                	xor    %ecx,%ecx
  4bc413:	8a 4d 2b             	mov    0x2b(%ebp),%cl
  4bc416:	8d 0c 89             	lea    (%ecx,%ecx,4),%ecx
  4bc419:	8d 0c 89             	lea    (%ecx,%ecx,4),%ecx
  4bc41c:	f6 04 4d 90 70 5a 00 	testb  $0x80,0x5a7090(,%ecx,2)
  4bc423:	80 
  4bc424:	74 1e                	je     0x4bc444
  4bc426:	8b 4d 10             	mov    0x10(%ebp),%ecx
  4bc429:	f6 c5 04             	test   $0x4,%ch
  4bc42c:	75 16                	jne    0x4bc444
  4bc42e:	f6 45 0e 08          	testb  $0x8,0xe(%ebp)
  4bc432:	75 10                	jne    0x4bc444
  4bc434:	66 83 7d 5f 00       	cmpw   $0x0,0x5f(%ebp)
  4bc439:	75 09                	jne    0x4bc444
  4bc43b:	81 c9 00 00 40 00    	or     $0x400000,%ecx
  4bc441:	89 4d 10             	mov    %ecx,0x10(%ebp)
  4bc444:	33 c9                	xor    %ecx,%ecx
  4bc446:	66 8b 4d 20          	mov    0x20(%ebp),%cx
  4bc44a:	8b 2c 8d 90 03 89 00 	mov    0x890390(,%ecx,4),%ebp
  4bc451:	85 ed                	test   %ebp,%ebp
  4bc453:	75 ac                	jne    0x4bc401
  4bc455:	83 c2 08             	add    $0x8,%edx
  4bc458:	8d 44 24 78          	lea    0x78(%esp),%eax
  4bc45c:	3b d0                	cmp    %eax,%edx
  4bc45e:	72 8b                	jb     0x4bc3eb
  4bc460:	83 7c 24 2c 00       	cmpl   $0x0,0x2c(%esp)
  4bc465:	0f 84 83 00 00 00    	je     0x4bc4ee
  4bc46b:	33 db                	xor    %ebx,%ebx
  4bc46d:	33 c0                	xor    %eax,%eax
  4bc46f:	8a 46 7c             	mov    0x7c(%esi),%al
  4bc472:	83 f8 01             	cmp    $0x1,%eax
  4bc475:	74 07                	je     0x4bc47e
  4bc477:	83 f8 02             	cmp    $0x2,%eax
  4bc47a:	74 4d                	je     0x4bc4c9
  4bc47c:	eb 5d                	jmp    0x4bc4db
  4bc47e:	85 ff                	test   %edi,%edi
  4bc480:	74 2a                	je     0x4bc4ac
  4bc482:	8d 47 3d             	lea    0x3d(%edi),%eax
  4bc485:	8d 54 24 14          	lea    0x14(%esp),%edx
  4bc489:	8b 08                	mov    (%eax),%ecx
  4bc48b:	52                   	push   %edx
  4bc48c:	56                   	push   %esi
  4bc48d:	89 0a                	mov    %ecx,(%edx)
  4bc48f:	66 8b 40 04          	mov    0x4(%eax),%ax
  4bc493:	66 89 42 04          	mov    %ax,0x4(%edx)
  4bc497:	66 8b 47 1c          	mov    0x1c(%edi),%ax
  4bc49b:	66 05 10 00          	add    $0x10,%ax
  4bc49f:	66 01 44 24 20       	add    %ax,0x20(%esp)
  4bc4a4:	e8 d7 20 03 00       	call   0x4ee580
  4bc4a9:	83 c4 08             	add    $0x8,%esp
  4bc4ac:	6a 00                	push   $0x0
  4bc4ae:	68 b2 00 00 00       	push   $0xb2
  4bc4b3:	56                   	push   %esi
  4bc4b4:	e8 97 db fc ff       	call   0x48a050
  4bc4b9:	83 c4 0c             	add    $0xc,%esp
  4bc4bc:	8b d8                	mov    %eax,%ebx
  4bc4be:	56                   	push   %esi
  4bc4bf:	e8 4c 7f 05 00       	call   0x514410
  4bc4c4:	83 c4 04             	add    $0x4,%esp
  4bc4c7:	eb 12                	jmp    0x4bc4db
  4bc4c9:	6a 00                	push   $0x0
  4bc4cb:	68 b2 00 00 00       	push   $0xb2
  4bc4d0:	56                   	push   %esi
  4bc4d1:	e8 7a db fc ff       	call   0x48a050
  4bc4d6:	83 c4 0c             	add    $0xc,%esp
  4bc4d9:	8b d8                	mov    %eax,%ebx
  4bc4db:	85 db                	test   %ebx,%ebx
  4bc4dd:	74 06                	je     0x4bc4e5
  4bc4df:	66 c7 43 0c 00 00    	movw   $0x0,0xc(%ebx)
  4bc4e5:	56                   	push   %esi
  4bc4e6:	e8 05 18 03 00       	call   0x4edcf0
  4bc4eb:	83 c4 04             	add    $0x4,%esp
  4bc4ee:	5d                   	pop    %ebp
  4bc4ef:	5f                   	pop    %edi
  4bc4f0:	5e                   	pop    %esi
  4bc4f1:	5b                   	pop    %ebx
  4bc4f2:	83 c4 68             	add    $0x68,%esp
  4bc4f5:	c3                   	ret
  4bc4f6:	cc                   	int3
  4bc4f7:	cc                   	int3
  4bc4f8:	cc                   	int3
  4bc4f9:	cc                   	int3
  4bc4fa:	cc                   	int3
  4bc4fb:	cc                   	int3
  4bc4fc:	cc                   	int3
  4bc4fd:	cc                   	int3
  4bc4fe:	cc                   	int3
  4bc4ff:	cc                   	int3
