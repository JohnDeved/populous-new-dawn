
../prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004ede10 <.text+0xece10>:
  4ede10:	8b 54 24 04          	mov    0x4(%esp),%edx
  4ede14:	83 ec 28             	sub    $0x28,%esp
  4ede17:	53                   	push   %ebx
  4ede18:	8b 4a 04             	mov    0x4(%edx),%ecx
  4ede1b:	56                   	push   %esi
  4ede1c:	8b 02                	mov    (%edx),%eax
  4ede1e:	8d 74 24 28          	lea    0x28(%esp),%esi
  4ede22:	57                   	push   %edi
  4ede23:	89 4c 24 1c          	mov    %ecx,0x1c(%esp)
  4ede27:	55                   	push   %ebp
  4ede28:	c7 44 24 10 00 00 00 	movl   $0x0,0x10(%esp)
  4ede2f:	00 
  4ede30:	66 8b 6a 24          	mov    0x24(%edx),%bp
  4ede34:	89 44 24 24          	mov    %eax,0x24(%esp)
  4ede38:	66 8b 5a 41          	mov    0x41(%edx),%bx
  4ede3c:	8d 42 3d             	lea    0x3d(%edx),%eax
  4ede3f:	66 89 6c 24 10       	mov    %bp,0x10(%esp)
  4ede44:	8b 08                	mov    (%eax),%ecx
  4ede46:	8b 6a 0c             	mov    0xc(%edx),%ebp
  4ede49:	89 0e                	mov    %ecx,(%esi)
  4ede4b:	66 89 5e 04          	mov    %bx,0x4(%esi)
  4ede4f:	8a 4a 2e             	mov    0x2e(%edx),%cl
  4ede52:	c7 44 24 14 00 00 00 	movl   $0x0,0x14(%esp)
  4ede59:	00 
  4ede5a:	8b 5a 10             	mov    0x10(%edx),%ebx
  4ede5d:	88 4c 24 14          	mov    %cl,0x14(%esp)
  4ede61:	8b 4a 14             	mov    0x14(%edx),%ecx
  4ede64:	89 5c 24 28          	mov    %ebx,0x28(%esp)
  4ede68:	33 db                	xor    %ebx,%ebx
  4ede6a:	89 4c 24 2c          	mov    %ecx,0x2c(%esp)
  4ede6e:	c7 44 24 18 00 00 00 	movl   $0x0,0x18(%esp)
  4ede75:	00 
  4ede76:	66 8b 5a 20          	mov    0x20(%edx),%bx
  4ede7a:	8b fa                	mov    %edx,%edi
  4ede7c:	66 8b 4a 22          	mov    0x22(%edx),%cx
  4ede80:	8b 74 24 40          	mov    0x40(%esp),%esi
  4ede84:	c7 44 24 1c 00 00 00 	movl   $0x0,0x1c(%esp)
  4ede8b:	00 
  4ede8c:	66 89 4c 24 18       	mov    %cx,0x18(%esp)
  4ede91:	8a 4a 2c             	mov    0x2c(%edx),%cl
  4ede94:	88 4c 24 1c          	mov    %cl,0x1c(%esp)
  4ede98:	b9 2c 00 00 00       	mov    $0x2c,%ecx
  4ede9d:	f3 a5                	rep movsl %ds:(%esi),%es:(%edi)
  4ede9f:	66 a5                	movsw  %ds:(%esi),%es:(%edi)
  4edea1:	a4                   	movsb  %ds:(%esi),%es:(%edi)
  4edea2:	8b 74 24 20          	mov    0x20(%esp),%esi
  4edea6:	8b 4c 24 24          	mov    0x24(%esp),%ecx
  4edeaa:	89 72 04             	mov    %esi,0x4(%edx)
  4edead:	89 0a                	mov    %ecx,(%edx)
  4edeaf:	66 8b 74 24 10       	mov    0x10(%esp),%si
  4edeb4:	8a 4c 24 14          	mov    0x14(%esp),%cl
  4edeb8:	66 89 72 24          	mov    %si,0x24(%edx)
  4edebc:	88 4a 2e             	mov    %cl,0x2e(%edx)
  4edebf:	66 89 5a 20          	mov    %bx,0x20(%edx)
  4edec3:	8a 4c 24 1c          	mov    0x1c(%esp),%cl
  4edec7:	66 8b 5c 24 18       	mov    0x18(%esp),%bx
  4edecc:	88 4a 2c             	mov    %cl,0x2c(%edx)
  4edecf:	66 89 5a 22          	mov    %bx,0x22(%edx)
  4eded3:	8d 4c 24 30          	lea    0x30(%esp),%ecx
  4eded7:	c7 42 08 00 00 00 00 	movl   $0x0,0x8(%edx)
  4edede:	8b 31                	mov    (%ecx),%esi
  4edee0:	66 8b 49 04          	mov    0x4(%ecx),%cx
  4edee4:	89 30                	mov    %esi,(%eax)
  4edee6:	66 89 48 04          	mov    %cx,0x4(%eax)
  4edeea:	f7 c5 01 00 00 00    	test   $0x1,%ebp
  4edef0:	74 06                	je     0x4edef8
  4edef2:	83 4a 0c 01          	orl    $0x1,0xc(%edx)
  4edef6:	eb 04                	jmp    0x4edefc
  4edef8:	83 62 0c fe          	andl   $0xfffffffe,0xc(%edx)
  4edefc:	f7 c5 00 00 02 00    	test   $0x20000,%ebp
  4edf02:	74 09                	je     0x4edf0d
  4edf04:	81 4a 0c 00 00 02 00 	orl    $0x20000,0xc(%edx)
  4edf0b:	eb 07                	jmp    0x4edf14
  4edf0d:	81 62 0c ff ff fd ff 	andl   $0xfffdffff,0xc(%edx)
  4edf14:	f6 44 24 2b 20       	testb  $0x20,0x2b(%esp)
  4edf19:	74 09                	je     0x4edf24
  4edf1b:	81 4a 10 00 00 00 20 	orl    $0x20000000,0x10(%edx)
  4edf22:	eb 07                	jmp    0x4edf2b
  4edf24:	81 62 10 ff ff ff df 	andl   $0xdfffffff,0x10(%edx)
  4edf2b:	f6 44 24 2c 04       	testb  $0x4,0x2c(%esp)
  4edf30:	74 0c                	je     0x4edf3e
  4edf32:	83 4a 14 04          	orl    $0x4,0x14(%edx)
  4edf36:	5d                   	pop    %ebp
  4edf37:	5f                   	pop    %edi
  4edf38:	5e                   	pop    %esi
  4edf39:	5b                   	pop    %ebx
  4edf3a:	83 c4 28             	add    $0x28,%esp
  4edf3d:	c3                   	ret
  4edf3e:	83 62 14 fb          	andl   $0xfffffffb,0x14(%edx)
  4edf42:	5d                   	pop    %ebp
  4edf43:	5f                   	pop    %edi
  4edf44:	5e                   	pop    %esi
  4edf45:	5b                   	pop    %ebx
  4edf46:	83 c4 28             	add    $0x28,%esp
  4edf49:	c3                   	ret
  4edf4a:	cc                   	int3
  4edf4b:	cc                   	int3
  4edf4c:	cc                   	int3
  4edf4d:	cc                   	int3
  4edf4e:	cc                   	int3
  4edf4f:	cc                   	int3
