
populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0051fbf0 <.text+0x11ebf0>:
  51fbf0:	53                   	push   %ebx
  51fbf1:	56                   	push   %esi
  51fbf2:	8b 5c 24 0c          	mov    0xc(%esp),%ebx
  51fbf6:	57                   	push   %edi
  51fbf7:	66 33 ff             	xor    %di,%di
  51fbfa:	55                   	push   %ebp
  51fbfb:	33 ed                	xor    %ebp,%ebp
  51fbfd:	53                   	push   %ebx
  51fbfe:	33 f6                	xor    %esi,%esi
  51fc00:	e8 6b a5 fb ff       	call   0x4da170
  51fc05:	83 c4 04             	add    $0x4,%esp
  51fc08:	a1 43 24 89 00       	mov    0x892443,%eax
  51fc0d:	8b 54 24 18          	mov    0x18(%esp),%edx
  51fc11:	89 30                	mov    %esi,(%eax)
  51fc13:	a1 43 24 89 00       	mov    0x892443,%eax
  51fc18:	89 58 04             	mov    %ebx,0x4(%eax)
  51fc1b:	8b 44 24 1c          	mov    0x1c(%esp),%eax
  51fc1f:	8b 0d 43 24 89 00    	mov    0x892443,%ecx
  51fc25:	89 51 08             	mov    %edx,0x8(%ecx)
  51fc28:	8b 0d 43 24 89 00    	mov    0x892443,%ecx
  51fc2e:	8d 53 3d             	lea    0x3d(%ebx),%edx
  51fc31:	89 41 0c             	mov    %eax,0xc(%ecx)
  51fc34:	8b 0d 43 24 89 00    	mov    0x892443,%ecx
  51fc3a:	52                   	push   %edx
  51fc3b:	89 69 10             	mov    %ebp,0x10(%ecx)
  51fc3e:	83 05 43 24 89 00 14 	addl   $0x14,0x892443
  51fc45:	c6 05 3a 24 89 00 01 	movb   $0x1,0x89243a
  51fc4c:	8a 43 2f             	mov    0x2f(%ebx),%al
  51fc4f:	50                   	push   %eax
  51fc50:	6a 06                	push   $0x6
  51fc52:	6a 08                	push   $0x8
  51fc54:	e8 47 dc fc ff       	call   0x4ed8a0
  51fc59:	83 c4 10             	add    $0x10,%esp
  51fc5c:	85 c0                	test   %eax,%eax
  51fc5e:	74 33                	je     0x51fc93
  51fc60:	66 8b 78 24          	mov    0x24(%eax),%di
  51fc64:	6a 04                	push   $0x4
  51fc66:	53                   	push   %ebx
  51fc67:	e8 84 a7 ee ff       	call   0x40a3f0
  51fc6c:	83 c4 08             	add    $0x8,%esp
  51fc6f:	85 c0                	test   %eax,%eax
  51fc71:	74 07                	je     0x51fc7a
  51fc73:	a1 74 a4 5a 00       	mov    0x5aa474,%eax
  51fc78:	eb 05                	jmp    0x51fc7f
  51fc7a:	a1 6c a4 5a 00       	mov    0x5aa46c,%eax
  51fc7f:	f6 43 16 08          	testb  $0x8,0x16(%ebx)
  51fc83:	74 08                	je     0x51fc8d
  51fc85:	8a 0d b4 a5 5a 00    	mov    0x5aa5b4,%cl
  51fc8b:	d3 f8                	sar    %cl,%eax
  51fc8d:	88 83 b2 00 00 00    	mov    %al,0xb2(%ebx)
  51fc93:	46                   	inc    %esi
  51fc94:	83 fe 02             	cmp    $0x2,%esi
  51fc97:	0f 8c 6b ff ff ff    	jl     0x51fc08
  51fc9d:	66 85 ff             	test   %di,%di
  51fca0:	74 1d                	je     0x51fcbf
  51fca2:	66 8b 83 9f 00 00 00 	mov    0x9f(%ebx),%ax
  51fca9:	66 85 c0             	test   %ax,%ax
  51fcac:	74 11                	je     0x51fcbf
  51fcae:	0f b7 c0             	movzwl %ax,%eax
  51fcb1:	8b 0c 85 90 03 89 00 	mov    0x890390(,%eax,4),%ecx
  51fcb8:	c6 81 a0 00 00 00 01 	movb   $0x1,0xa0(%ecx)
  51fcbf:	66 8b c7             	mov    %di,%ax
  51fcc2:	5d                   	pop    %ebp
  51fcc3:	5f                   	pop    %edi
  51fcc4:	5e                   	pop    %esi
  51fcc5:	5b                   	pop    %ebx
  51fcc6:	c3                   	ret
  51fcc7:	cc                   	int3
  51fcc8:	cc                   	int3
  51fcc9:	cc                   	int3
  51fcca:	cc                   	int3
  51fccb:	cc                   	int3
  51fccc:	cc                   	int3
  51fccd:	cc                   	int3
  51fcce:	cc                   	int3
  51fccf:	cc                   	int3
