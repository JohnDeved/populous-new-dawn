
../prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0050bcd0 <.text+0x10acd0>:
  50bcd0:	56                   	push   %esi
  50bcd1:	57                   	push   %edi
  50bcd2:	8b 74 24 0c          	mov    0xc(%esp),%esi
  50bcd6:	8d 7e 3d             	lea    0x3d(%esi),%edi
  50bcd9:	57                   	push   %edi
  50bcda:	56                   	push   %esi
  50bcdb:	e8 90 27 fe ff       	call   0x4ee470
  50bce0:	66 8b 46 3f          	mov    0x3f(%esi),%ax
  50bce4:	83 c4 08             	add    $0x8,%esp
  50bce7:	66 8b 0f             	mov    (%edi),%cx
  50bcea:	50                   	push   %eax
  50bceb:	51                   	push   %ecx
  50bcec:	e8 4f 2c f4 ff       	call   0x44e940
  50bcf1:	0f bf c0             	movswl %ax,%eax
  50bcf4:	0f bf 4e 41          	movswl 0x41(%esi),%ecx
  50bcf8:	83 c4 08             	add    $0x8,%esp
  50bcfb:	3b c8                	cmp    %eax,%ecx
  50bcfd:	7d 04                	jge    0x50bd03
  50bcff:	66 89 46 41          	mov    %ax,0x41(%esi)
  50bd03:	f6 46 0e 10          	testb  $0x10,0xe(%esi)
  50bd07:	75 16                	jne    0x50bd1f
  50bd09:	56                   	push   %esi
  50bd0a:	e8 e1 19 fe ff       	call   0x4ed6f0
  50bd0f:	83 c4 04             	add    $0x4,%esp
  50bd12:	c6 46 2c 00          	movb   $0x0,0x2c(%esi)
  50bd16:	56                   	push   %esi
  50bd17:	e8 24 19 fe ff       	call   0x4ed640
  50bd1c:	83 c4 04             	add    $0x4,%esp
  50bd1f:	6a 00                	push   $0x0
  50bd21:	8d 46 33             	lea    0x33(%esi),%eax
  50bd24:	6a 00                	push   $0x0
  50bd26:	50                   	push   %eax
  50bd27:	e8 d4 29 fe ff       	call   0x4ee700
  50bd2c:	66 8b 46 35          	mov    0x35(%esi),%ax
  50bd30:	83 c4 0c             	add    $0xc,%esp
  50bd33:	c6 46 30 0a          	movb   $0xa,0x30(%esi)
  50bd37:	81 4e 0c 00 00 00 10 	orl    $0x10000000,0xc(%esi)
  50bd3e:	66 c7 46 6c ff ff    	movw   $0xffff,0x6c(%esi)
  50bd44:	80 cc 80             	or     $0x80,%ah
  50bd47:	5f                   	pop    %edi
  50bd48:	66 89 46 35          	mov    %ax,0x35(%esi)
  50bd4c:	0c 10                	or     $0x10,%al
  50bd4e:	66 89 46 35          	mov    %ax,0x35(%esi)
  50bd52:	b8 00 01 00 00       	mov    $0x100,%eax
  50bd57:	66 89 46 68          	mov    %ax,0x68(%esi)
  50bd5b:	66 89 46 6a          	mov    %ax,0x6a(%esi)
  50bd5f:	5e                   	pop    %esi
  50bd60:	c3                   	ret
  50bd61:	cc                   	int3
  50bd62:	cc                   	int3
  50bd63:	cc                   	int3
  50bd64:	cc                   	int3
  50bd65:	cc                   	int3
  50bd66:	cc                   	int3
  50bd67:	cc                   	int3
  50bd68:	cc                   	int3
  50bd69:	cc                   	int3
  50bd6a:	cc                   	int3
  50bd6b:	cc                   	int3
  50bd6c:	cc                   	int3
  50bd6d:	cc                   	int3
  50bd6e:	cc                   	int3
  50bd6f:	cc                   	int3
  50bd70:	56                   	push   %esi
  50bd71:	8b 74 24 08          	mov    0x8(%esp),%esi
  50bd75:	56                   	push   %esi
  50bd76:	e8 05 bd fd ff       	call   0x4e7a80
  50bd7b:	66 8b 46 6c          	mov    0x6c(%esi),%ax
  50bd7f:	83 c4 04             	add    $0x4,%esp
  50bd82:	66 85 c0             	test   %ax,%ax
  50bd85:	7c 3b                	jl     0x50bdc2
  50bd87:	66 48                	dec    %ax
  50bd89:	66 89 46 6c          	mov    %ax,0x6c(%esi)
  50bd8d:	66 85 c0             	test   %ax,%ax
  50bd90:	7f 30                	jg     0x50bdc2
  50bd92:	80 7e 3c f1          	cmpb   $0xf1,0x3c(%esi)
  50bd96:	66 8b 46 33          	mov    0x33(%esi),%ax
  50bd9a:	7c 14                	jl     0x50bdb0
  50bd9c:	66 05 04 00          	add    $0x4,%ax
  50bda0:	50                   	push   %eax
  50bda1:	6a 1d                	push   $0x1d
  50bda3:	6a 04                	push   $0x4
  50bda5:	56                   	push   %esi
  50bda6:	e8 05 01 00 00       	call   0x50beb0
  50bdab:	83 c4 10             	add    $0x10,%esp
  50bdae:	5e                   	pop    %esi
  50bdaf:	c3                   	ret
  50bdb0:	66 05 04 00          	add    $0x4,%ax
  50bdb4:	50                   	push   %eax
  50bdb5:	6a 01                	push   $0x1
  50bdb7:	6a 04                	push   $0x4
  50bdb9:	56                   	push   %esi
  50bdba:	e8 f1 00 00 00       	call   0x50beb0
  50bdbf:	83 c4 10             	add    $0x10,%esp
  50bdc2:	5e                   	pop    %esi
  50bdc3:	c3                   	ret
  50bdc4:	cc                   	int3
  50bdc5:	cc                   	int3
  50bdc6:	cc                   	int3
  50bdc7:	cc                   	int3
  50bdc8:	cc                   	int3
  50bdc9:	cc                   	int3
  50bdca:	cc                   	int3
  50bdcb:	cc                   	int3
  50bdcc:	cc                   	int3
  50bdcd:	cc                   	int3
  50bdce:	cc                   	int3
  50bdcf:	cc                   	int3
  50bdd0:	8b 4c 24 04          	mov    0x4(%esp),%ecx
  50bdd4:	66 8b 41 6c          	mov    0x6c(%ecx),%ax
  50bdd8:	81 61 10 ff ff bf ff 	andl   $0xffbfffff,0x10(%ecx)
  50bddf:	66 85 c0             	test   %ax,%ax
  50bde2:	7c 14                	jl     0x50bdf8
  50bde4:	66 48                	dec    %ax
  50bde6:	66 89 41 6c          	mov    %ax,0x6c(%ecx)
  50bdea:	66 85 c0             	test   %ax,%ax
  50bded:	7f 09                	jg     0x50bdf8
  50bdef:	51                   	push   %ecx
  50bdf0:	e8 8b 33 fe ff       	call   0x4ef180
  50bdf5:	83 c4 04             	add    $0x4,%esp
  50bdf8:	c3                   	ret
  50bdf9:	cc                   	int3
  50bdfa:	cc                   	int3
  50bdfb:	cc                   	int3
  50bdfc:	cc                   	int3
  50bdfd:	cc                   	int3
  50bdfe:	cc                   	int3
  50bdff:	cc                   	int3
