
../prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004edf50 <.text+0xecf50>:
  4edf50:	83 ec 0c             	sub    $0xc,%esp
  4edf53:	a1 78 03 89 00       	mov    0x890378,%eax
  4edf58:	39 05 84 03 89 00    	cmp    %eax,0x890384
  4edf5e:	53                   	push   %ebx
  4edf5f:	89 44 24 08          	mov    %eax,0x8(%esp)
  4edf63:	56                   	push   %esi
  4edf64:	57                   	push   %edi
  4edf65:	55                   	push   %ebp
  4edf66:	0f 86 e2 01 00 00    	jbe    0x4ee14e
  4edf6c:	8b 44 24 14          	mov    0x14(%esp),%eax
  4edf70:	80 78 2a 06          	cmpb   $0x6,0x2a(%eax)
  4edf74:	0f 85 bc 01 00 00    	jne    0x4ee136
  4edf7a:	80 78 2b 06          	cmpb   $0x6,0x2b(%eax)
  4edf7e:	0f 85 b2 01 00 00    	jne    0x4ee136
  4edf84:	c7 44 24 18 0a 00 00 	movl   $0xa,0x18(%esp)
  4edf8b:	00 
  4edf8c:	8d 70 72             	lea    0x72(%eax),%esi
  4edf8f:	66 8b 06             	mov    (%esi),%ax
  4edf92:	66 85 c0             	test   %ax,%ax
  4edf95:	0f 84 8e 01 00 00    	je     0x4ee129
  4edf9b:	0f b7 c0             	movzwl %ax,%eax
  4edf9e:	8b 3c 85 90 03 89 00 	mov    0x890390(,%eax,4),%edi
  4edfa5:	8b 47 10             	mov    0x10(%edi),%eax
  4edfa8:	a9 00 00 00 20       	test   $0x20000000,%eax
  4edfad:	0f 84 76 01 00 00    	je     0x4ee129
  4edfb3:	25 ff ff ff df       	and    $0xdfffffff,%eax
  4edfb8:	89 47 10             	mov    %eax,0x10(%edi)
  4edfbb:	f6 47 0e 02          	testb  $0x2,0xe(%edi)
  4edfbf:	74 7b                	je     0x4ee03c
  4edfc1:	66 8b 47 3d          	mov    0x3d(%edi),%ax
  4edfc5:	66 8b 4f 3f          	mov    0x3f(%edi),%cx
  4edfc9:	88 64 24 12          	mov    %ah,0x12(%esp)
  4edfcd:	33 c0                	xor    %eax,%eax
  4edfcf:	88 6c 24 13          	mov    %ch,0x13(%esp)
  4edfd3:	66 8b 44 24 12       	mov    0x12(%esp),%ax
  4edfd8:	33 c9                	xor    %ecx,%ecx
  4edfda:	66 8b 4c 24 12       	mov    0x12(%esp),%cx
  4edfdf:	25 fe 00 00 00       	and    $0xfe,%eax
  4edfe4:	03 c0                	add    %eax,%eax
  4edfe6:	81 e1 00 fe 00 00    	and    $0xfe00,%ecx
  4edfec:	0b c1                	or     %ecx,%eax
  4edfee:	8d 4f 20             	lea    0x20(%edi),%ecx
  4edff1:	8d 14 85 e4 03 8a 00 	lea    0x8a03e4(,%eax,4),%edx
  4edff8:	66 8b 47 22          	mov    0x22(%edi),%ax
  4edffc:	66 85 c0             	test   %ax,%ax
  4edfff:	74 13                	je     0x4ee014
  4ee001:	0f b7 c0             	movzwl %ax,%eax
  4ee004:	66 8b 11             	mov    (%ecx),%dx
  4ee007:	8b 1c 85 90 03 89 00 	mov    0x890390(,%eax,4),%ebx
  4ee00e:	66 89 53 20          	mov    %dx,0x20(%ebx)
  4ee012:	eb 07                	jmp    0x4ee01b
  4ee014:	66 8b 01             	mov    (%ecx),%ax
  4ee017:	66 89 42 06          	mov    %ax,0x6(%edx)
  4ee01b:	66 8b 01             	mov    (%ecx),%ax
  4ee01e:	66 85 c0             	test   %ax,%ax
  4ee021:	74 12                	je     0x4ee035
  4ee023:	0f b7 c0             	movzwl %ax,%eax
  4ee026:	66 8b 4f 22          	mov    0x22(%edi),%cx
  4ee02a:	8b 14 85 90 03 89 00 	mov    0x890390(,%eax,4),%edx
  4ee031:	66 89 4a 22          	mov    %cx,0x22(%edx)
  4ee035:	81 67 0c ff ff fd ff 	andl   $0xfffdffff,0xc(%edi)
  4ee03c:	f6 47 0f 04          	testb  $0x4,0xf(%edi)
  4ee040:	74 36                	je     0x4ee078
  4ee042:	66 8b 5f 24          	mov    0x24(%edi),%bx
  4ee046:	33 c0                	xor    %eax,%eax
  4ee048:	ba 46 7c 93 00       	mov    $0x937c46,%edx
  4ee04d:	66 8b 4a 0a          	mov    0xa(%edx),%cx
  4ee051:	66 2b cb             	sub    %bx,%cx
  4ee054:	66 83 f9 01          	cmp    $0x1,%cx
  4ee058:	1b ed                	sbb    %ebp,%ebp
  4ee05a:	33 c9                	xor    %ecx,%ecx
  4ee05c:	f7 dd                	neg    %ebp
  4ee05e:	8a 0a                	mov    (%edx),%cl
  4ee060:	85 e9                	test   %ebp,%ecx
  4ee062:	75 0b                	jne    0x4ee06f
  4ee064:	40                   	inc    %eax
  4ee065:	83 c2 3d             	add    $0x3d,%edx
  4ee068:	83 f8 32             	cmp    $0x32,%eax
  4ee06b:	7c e0                	jl     0x4ee04d
  4ee06d:	eb 09                	jmp    0x4ee078
  4ee06f:	52                   	push   %edx
  4ee070:	e8 cb 30 f1 ff       	call   0x401140
  4ee075:	83 c4 04             	add    $0x4,%esp
  4ee078:	f6 47 0e 10          	testb  $0x10,0xe(%edi)
  4ee07c:	75 6f                	jne    0x4ee0ed
  4ee07e:	c6 47 2c 00          	movb   $0x0,0x2c(%edi)
  4ee082:	33 c0                	xor    %eax,%eax
  4ee084:	8a 47 2a             	mov    0x2a(%edi),%al
  4ee087:	48                   	dec    %eax
  4ee088:	83 f8 0a             	cmp    $0xa,%eax
  4ee08b:	77 60                	ja     0x4ee0ed
  4ee08d:	ff 24 85 58 e1 4e 00 	jmp    *0x4ee158(,%eax,4)
  4ee094:	57                   	push   %edi
  4ee095:	e8 a6 46 fe ff       	call   0x4d2740
  4ee09a:	eb 4e                	jmp    0x4ee0ea
  4ee09c:	57                   	push   %edi
  4ee09d:	e8 1e 50 f1 ff       	call   0x4030c0
  4ee0a2:	eb 46                	jmp    0x4ee0ea
  4ee0a4:	57                   	push   %edi
  4ee0a5:	e8 a6 7b f5 ff       	call   0x445c50
  4ee0aa:	eb 3e                	jmp    0x4ee0ea
  4ee0ac:	57                   	push   %edi
  4ee0ad:	e8 be 52 f7 ff       	call   0x463370
  4ee0b2:	eb 36                	jmp    0x4ee0ea
  4ee0b4:	57                   	push   %edi
  4ee0b5:	e8 56 81 fb ff       	call   0x4a6210
  4ee0ba:	eb 2e                	jmp    0x4ee0ea
  4ee0bc:	57                   	push   %edi
  4ee0bd:	e8 2e c7 00 00       	call   0x4fa7f0
  4ee0c2:	eb 26                	jmp    0x4ee0ea
  4ee0c4:	57                   	push   %edi
  4ee0c5:	e8 76 c6 01 00       	call   0x50a740
  4ee0ca:	eb 1e                	jmp    0x4ee0ea
  4ee0cc:	57                   	push   %edi
  4ee0cd:	e8 4e cd fc ff       	call   0x4bae20
  4ee0d2:	eb 16                	jmp    0x4ee0ea
  4ee0d4:	57                   	push   %edi
  4ee0d5:	e8 76 a0 fc ff       	call   0x4b8150
  4ee0da:	eb 0e                	jmp    0x4ee0ea
  4ee0dc:	57                   	push   %edi
  4ee0dd:	e8 3e 2d 01 00       	call   0x500e20
  4ee0e2:	eb 06                	jmp    0x4ee0ea
  4ee0e4:	57                   	push   %edi
  4ee0e5:	e8 46 38 fd ff       	call   0x4c1930
  4ee0ea:	83 c4 04             	add    $0x4,%esp
  4ee0ed:	33 c0                	xor    %eax,%eax
  4ee0ef:	8a 47 2a             	mov    0x2a(%edi),%al
  4ee0f2:	83 f8 02             	cmp    $0x2,%eax
  4ee0f5:	75 09                	jne    0x4ee100
  4ee0f7:	57                   	push   %edi
  4ee0f8:	e8 63 57 f1 ff       	call   0x403860
  4ee0fd:	83 c4 04             	add    $0x4,%esp
  4ee100:	66 8b 47 3d          	mov    0x3d(%edi),%ax
  4ee104:	66 c1 e8 08          	shr    $0x8,%ax
  4ee108:	24 fe                	and    $0xfe,%al
  4ee10a:	88 44 24 10          	mov    %al,0x10(%esp)
  4ee10e:	66 8b 47 3f          	mov    0x3f(%edi),%ax
  4ee112:	66 c1 e8 08          	shr    $0x8,%ax
  4ee116:	24 fe                	and    $0xfe,%al
  4ee118:	88 44 24 11          	mov    %al,0x11(%esp)
  4ee11c:	8b 4c 24 10          	mov    0x10(%esp),%ecx
  4ee120:	51                   	push   %ecx
  4ee121:	e8 aa 19 f6 ff       	call   0x44fad0
  4ee126:	83 c4 04             	add    $0x4,%esp
  4ee129:	83 c6 02             	add    $0x2,%esi
  4ee12c:	ff 4c 24 18          	decl   0x18(%esp)
  4ee130:	0f 85 59 fe ff ff    	jne    0x4edf8f
  4ee136:	81 44 24 14 b3 00 00 	addl   $0xb3,0x14(%esp)
  4ee13d:	00 
  4ee13e:	8b 44 24 14          	mov    0x14(%esp),%eax
  4ee142:	39 05 84 03 89 00    	cmp    %eax,0x890384
  4ee148:	0f 87 1e fe ff ff    	ja     0x4edf6c
  4ee14e:	5d                   	pop    %ebp
  4ee14f:	5f                   	pop    %edi
  4ee150:	5e                   	pop    %esi
  4ee151:	5b                   	pop    %ebx
  4ee152:	83 c4 0c             	add    $0xc,%esp
  4ee155:	c3                   	ret
  4ee156:	8b ff                	mov    %edi,%edi
  4ee158:	94                   	xchg   %eax,%esp
  4ee159:	e0 4e                	loopne 0x4ee1a9
  4ee15b:	00 9c e0 4e 00 a4 e0 	add    %bl,-0x1f5bffb2(%eax,%eiz,8)
  4ee162:	4e                   	dec    %esi
  4ee163:	00 ac e0 4e 00 b4 e0 	add    %ch,-0x1f4bffb2(%eax,%eiz,8)
  4ee16a:	4e                   	dec    %esi
  4ee16b:	00 bc e0 4e 00 c4 e0 	add    %bh,-0x1f3bffb2(%eax,%eiz,8)
  4ee172:	4e                   	dec    %esi
  4ee173:	00 cc                	add    %cl,%ah
  4ee175:	e0 4e                	loopne 0x4ee1c5
  4ee177:	00 d4                	add    %dl,%ah
  4ee179:	e0 4e                	loopne 0x4ee1c9
  4ee17b:	00 dc                	add    %bl,%ah
  4ee17d:	e0 4e                	loopne 0x4ee1cd
  4ee17f:	00 e4                	add    %ah,%ah
  4ee181:	e0 4e                	loopne 0x4ee1d1
  4ee183:	00 cc                	add    %cl,%ah
  4ee185:	cc                   	int3
  4ee186:	cc                   	int3
  4ee187:	cc                   	int3
  4ee188:	cc                   	int3
  4ee189:	cc                   	int3
  4ee18a:	cc                   	int3
  4ee18b:	cc                   	int3
  4ee18c:	cc                   	int3
  4ee18d:	cc                   	int3
  4ee18e:	cc                   	int3
  4ee18f:	cc                   	int3
