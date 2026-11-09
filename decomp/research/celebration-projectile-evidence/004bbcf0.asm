
populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004bbcf0 <.text+0xbacf0>:
  4bbcf0:	83 ec 18             	sub    $0x18,%esp
  4bbcf3:	33 c0                	xor    %eax,%eax
  4bbcf5:	89 44 24 04          	mov    %eax,0x4(%esp)
  4bbcf9:	53                   	push   %ebx
  4bbcfa:	89 44 24 04          	mov    %eax,0x4(%esp)
  4bbcfe:	56                   	push   %esi
  4bbcff:	8b 74 24 24          	mov    0x24(%esp),%esi
  4bbd03:	57                   	push   %edi
  4bbd04:	55                   	push   %ebp
  4bbd05:	bf 00 00 00 00       	mov    $0x0,%edi
  4bbd0a:	8b 46 0c             	mov    0xc(%esi),%eax
  4bbd0d:	f6 c4 04             	test   $0x4,%ah
  4bbd10:	74 15                	je     0x4bbd27
  4bbd12:	25 ff fb ff ff       	and    $0xfffffbff,%eax
  4bbd17:	89 46 0c             	mov    %eax,0xc(%esi)
  4bbd1a:	83 2d 43 24 89 00 14 	subl   $0x14,0x892443
  4bbd21:	8b 3d 43 24 89 00    	mov    0x892443,%edi
  4bbd27:	85 ff                	test   %edi,%edi
  4bbd29:	0f 84 d6 01 00 00    	je     0x4bbf05
  4bbd2f:	68 60 04 00 00       	push   $0x460
  4bbd34:	8d 46 33             	lea    0x33(%esi),%eax
  4bbd37:	6a 1d                	push   $0x1d
  4bbd39:	50                   	push   %eax
  4bbd3a:	e8 c1 29 03 00       	call   0x4ee700
  4bbd3f:	66 c7 46 5f 00 02    	movw   $0x200,0x5f(%esi)
  4bbd45:	66 81 66 35 ff bf    	andw   $0xbfff,0x35(%esi)
  4bbd4b:	83 c4 0c             	add    $0xc,%esp
  4bbd4e:	8b 07                	mov    (%edi),%eax
  4bbd50:	8b 5f 04             	mov    0x4(%edi),%ebx
  4bbd53:	8b 6f 08             	mov    0x8(%edi),%ebp
  4bbd56:	89 44 24 1c          	mov    %eax,0x1c(%esp)
  4bbd5a:	8b 47 0c             	mov    0xc(%edi),%eax
  4bbd5d:	85 c0                	test   %eax,%eax
  4bbd5f:	74 18                	je     0x4bbd79
  4bbd61:	8d 54 24 20          	lea    0x20(%esp),%edx
  4bbd65:	8b 08                	mov    (%eax),%ecx
  4bbd67:	66 8b 40 04          	mov    0x4(%eax),%ax
  4bbd6b:	89 0a                	mov    %ecx,(%edx)
  4bbd6d:	c7 44 24 10 01 00 00 	movl   $0x1,0x10(%esp)
  4bbd74:	00 
  4bbd75:	66 89 42 04          	mov    %ax,0x4(%edx)
  4bbd79:	85 db                	test   %ebx,%ebx
  4bbd7b:	0f 84 84 01 00 00    	je     0x4bbf05
  4bbd81:	85 ed                	test   %ebp,%ebp
  4bbd83:	75 0b                	jne    0x4bbd90
  4bbd85:	83 7c 24 10 00       	cmpl   $0x0,0x10(%esp)
  4bbd8a:	0f 84 75 01 00 00    	je     0x4bbf05
  4bbd90:	66 8b 43 5d          	mov    0x5d(%ebx),%ax
  4bbd94:	85 ed                	test   %ebp,%ebp
  4bbd96:	66 89 46 26          	mov    %ax,0x26(%esi)
  4bbd9a:	66 8b 4b 24          	mov    0x24(%ebx),%cx
  4bbd9e:	66 89 8e 88 00 00 00 	mov    %cx,0x88(%esi)
  4bbda5:	74 65                	je     0x4bbe0c
  4bbda7:	66 8b 45 24          	mov    0x24(%ebp),%ax
  4bbdab:	66 89 86 8a 00 00 00 	mov    %ax,0x8a(%esi)
  4bbdb2:	80 7d 2a 02          	cmpb   $0x2,0x2a(%ebp)
  4bbdb6:	75 36                	jne    0x4bbdee
  4bbdb8:	8d 44 24 18          	lea    0x18(%esp),%eax
  4bbdbc:	50                   	push   %eax
  4bbdbd:	55                   	push   %ebp
  4bbdbe:	e8 5d 86 f4 ff       	call   0x404420
  4bbdc3:	66 8b 4c 24 20       	mov    0x20(%esp),%cx
  4bbdc8:	83 c4 08             	add    $0x8,%esp
  4bbdcb:	66 c7 46 7a 00 00    	movw   $0x0,0x7a(%esi)
  4bbdd1:	66 8b 44 24 1a       	mov    0x1a(%esp),%ax
  4bbdd6:	66 89 4e 76          	mov    %cx,0x76(%esi)
  4bbdda:	50                   	push   %eax
  4bbddb:	66 89 46 78          	mov    %ax,0x78(%esi)
  4bbddf:	51                   	push   %ecx
  4bbde0:	e8 5b 2b f9 ff       	call   0x44e940
  4bbde5:	66 89 46 7a          	mov    %ax,0x7a(%esi)
  4bbde9:	83 c4 08             	add    $0x8,%esp
  4bbdec:	eb 12                	jmp    0x4bbe00
  4bbdee:	8d 4d 3d             	lea    0x3d(%ebp),%ecx
  4bbdf1:	8d 56 76             	lea    0x76(%esi),%edx
  4bbdf4:	8b 01                	mov    (%ecx),%eax
  4bbdf6:	89 02                	mov    %eax,(%edx)
  4bbdf8:	66 8b 49 04          	mov    0x4(%ecx),%cx
  4bbdfc:	66 89 4a 04          	mov    %cx,0x4(%edx)
  4bbe00:	66 8b 45 1c          	mov    0x1c(%ebp),%ax
  4bbe04:	66 05 10 00          	add    $0x10,%ax
  4bbe08:	66 01 46 7a          	add    %ax,0x7a(%esi)
  4bbe0c:	83 7c 24 10 00       	cmpl   $0x0,0x10(%esp)
  4bbe11:	74 13                	je     0x4bbe26
  4bbe13:	8d 44 24 20          	lea    0x20(%esp),%eax
  4bbe17:	8d 56 76             	lea    0x76(%esi),%edx
  4bbe1a:	8b 08                	mov    (%eax),%ecx
  4bbe1c:	66 8b 40 04          	mov    0x4(%eax),%ax
  4bbe20:	89 0a                	mov    %ecx,(%edx)
  4bbe22:	66 89 42 04          	mov    %ax,0x4(%edx)
  4bbe26:	83 7c 24 1c 00       	cmpl   $0x0,0x1c(%esp)
  4bbe2b:	0f bf 46 26          	movswl 0x26(%esi),%eax
  4bbe2f:	74 07                	je     0x4bbe38
  4bbe31:	05 00 02 00 00       	add    $0x200,%eax
  4bbe36:	eb 05                	jmp    0x4bbe3d
  4bbe38:	2d 00 02 00 00       	sub    $0x200,%eax
  4bbe3d:	25 ff 07 00 00       	and    $0x7ff,%eax
  4bbe42:	8d 7e 3d             	lea    0x3d(%esi),%edi
  4bbe45:	6a 60                	push   $0x60
  4bbe47:	50                   	push   %eax
  4bbe48:	57                   	push   %edi
  4bbe49:	e8 22 ac 02 00       	call   0x4e6a70
  4bbe4e:	66 8b 46 3f          	mov    0x3f(%esi),%ax
  4bbe52:	83 c4 0c             	add    $0xc,%esp
  4bbe55:	66 8b 0f             	mov    (%edi),%cx
  4bbe58:	50                   	push   %eax
  4bbe59:	51                   	push   %ecx
  4bbe5a:	e8 e1 2a f9 ff       	call   0x44e940
  4bbe5f:	0f bf c0             	movswl %ax,%eax
  4bbe62:	0f bf 4e 41          	movswl 0x41(%esi),%ecx
  4bbe66:	83 c4 08             	add    $0x8,%esp
  4bbe69:	3b c8                	cmp    %eax,%ecx
  4bbe6b:	7d 04                	jge    0x4bbe71
  4bbe6d:	66 89 46 41          	mov    %ax,0x41(%esi)
  4bbe71:	66 8b 43 1c          	mov    0x1c(%ebx),%ax
  4bbe75:	57                   	push   %edi
  4bbe76:	66 05 10 00          	add    $0x10,%ax
  4bbe7a:	56                   	push   %esi
  4bbe7b:	66 01 46 41          	add    %ax,0x41(%esi)
  4bbe7f:	e8 ec 25 03 00       	call   0x4ee470
  4bbe84:	66 8b 57 04          	mov    0x4(%edi),%dx
  4bbe88:	83 c4 08             	add    $0x8,%esp
  4bbe8b:	8d 4e 70             	lea    0x70(%esi),%ecx
  4bbe8e:	8b 07                	mov    (%edi),%eax
  4bbe90:	89 01                	mov    %eax,(%ecx)
  4bbe92:	83 7c 24 1c 00       	cmpl   $0x0,0x1c(%esp)
  4bbe97:	66 89 51 04          	mov    %dx,0x4(%ecx)
  4bbe9b:	74 22                	je     0x4bbebf
  4bbe9d:	6a 00                	push   $0x0
  4bbe9f:	6a 04                	push   $0x4
  4bbea1:	6a 02                	push   $0x2
  4bbea3:	56                   	push   %esi
  4bbea4:	e8 07 52 f4 ff       	call   0x4010b0
  4bbea9:	83 c4 10             	add    $0x10,%esp
  4bbeac:	85 ed                	test   %ebp,%ebp
  4bbeae:	74 04                	je     0x4bbeb4
  4bbeb0:	c6 46 7c 01          	movb   $0x1,0x7c(%esi)
  4bbeb4:	83 7c 24 10 00       	cmpl   $0x0,0x10(%esp)
  4bbeb9:	74 04                	je     0x4bbebf
  4bbebb:	c6 46 7c 02          	movb   $0x2,0x7c(%esi)
  4bbebf:	f6 43 11 08          	testb  $0x8,0x11(%ebx)
  4bbec3:	74 07                	je     0x4bbecc
  4bbec5:	81 4e 10 00 08 00 00 	orl    $0x800,0x10(%esi)
  4bbecc:	f6 46 0e 10          	testb  $0x10,0xe(%esi)
  4bbed0:	75 16                	jne    0x4bbee8
  4bbed2:	56                   	push   %esi
  4bbed3:	e8 18 18 03 00       	call   0x4ed6f0
  4bbed8:	83 c4 04             	add    $0x4,%esp
  4bbedb:	c6 46 2c 06          	movb   $0x6,0x2c(%esi)
  4bbedf:	56                   	push   %esi
  4bbee0:	e8 5b 17 03 00       	call   0x4ed640
  4bbee5:	83 c4 04             	add    $0x4,%esp
  4bbee8:	6a 00                	push   $0x0
  4bbeea:	68 a1 00 00 00       	push   $0xa1
  4bbeef:	56                   	push   %esi
  4bbef0:	e8 5b e1 fc ff       	call   0x48a050
  4bbef5:	80 4e 36 80          	orb    $0x80,0x36(%esi)
  4bbef9:	81 4e 14 00 01 00 00 	orl    $0x100,0x14(%esi)
  4bbf00:	83 c4 0c             	add    $0xc,%esp
  4bbf03:	eb 08                	jmp    0x4bbf0d
  4bbf05:	c7 44 24 14 01 00 00 	movl   $0x1,0x14(%esp)
  4bbf0c:	00 
  4bbf0d:	83 7c 24 14 00       	cmpl   $0x0,0x14(%esp)
  4bbf12:	74 09                	je     0x4bbf1d
  4bbf14:	56                   	push   %esi
  4bbf15:	e8 d6 1d 03 00       	call   0x4edcf0
  4bbf1a:	83 c4 04             	add    $0x4,%esp
  4bbf1d:	5d                   	pop    %ebp
  4bbf1e:	5f                   	pop    %edi
  4bbf1f:	5e                   	pop    %esi
  4bbf20:	5b                   	pop    %ebx
  4bbf21:	83 c4 18             	add    $0x18,%esp
  4bbf24:	c3                   	ret
  4bbf25:	cc                   	int3
  4bbf26:	cc                   	int3
  4bbf27:	cc                   	int3
  4bbf28:	cc                   	int3
  4bbf29:	cc                   	int3
  4bbf2a:	cc                   	int3
  4bbf2b:	cc                   	int3
  4bbf2c:	cc                   	int3
  4bbf2d:	cc                   	int3
  4bbf2e:	cc                   	int3
  4bbf2f:	cc                   	int3
