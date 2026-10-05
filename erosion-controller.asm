
../prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0050ff30 <.text+0x10ef30>:
  50ff30:	83 ec 0c             	sub    $0xc,%esp
  50ff33:	56                   	push   %esi
  50ff34:	8b 74 24 14          	mov    0x14(%esp),%esi
  50ff38:	66 8b 46 6c          	mov    0x6c(%esi),%ax
  50ff3c:	66 48                	dec    %ax
  50ff3e:	66 89 46 6c          	mov    %ax,0x6c(%esi)
  50ff42:	0f 84 c5 00 00 00    	je     0x51000d
  50ff48:	f6 46 10 10          	testb  $0x10,0x10(%esi)
  50ff4c:	75 10                	jne    0x50ff5e
  50ff4e:	6a 02                	push   $0x2
  50ff50:	68 a9 00 00 00       	push   $0xa9
  50ff55:	56                   	push   %esi
  50ff56:	e8 f5 a0 f7 ff       	call   0x48a050
  50ff5b:	83 c4 0c             	add    $0xc,%esp
  50ff5e:	66 8b 46 3d          	mov    0x3d(%esi),%ax
  50ff62:	66 c1 e8 08          	shr    $0x8,%ax
  50ff66:	24 fe                	and    $0xfe,%al
  50ff68:	88 44 24 06          	mov    %al,0x6(%esp)
  50ff6c:	66 8b 46 3f          	mov    0x3f(%esi),%ax
  50ff70:	66 c1 e8 08          	shr    $0x8,%ax
  50ff74:	24 fe                	and    $0xfe,%al
  50ff76:	88 44 24 07          	mov    %al,0x7(%esp)
  50ff7a:	66 8b 4c 24 06       	mov    0x6(%esp),%cx
  50ff7f:	66 89 0d 30 91 a6 00 	mov    %cx,0xa69130
  50ff86:	8b 0d 78 d1 89 00    	mov    0x89d178,%ecx
  50ff8c:	8b c1                	mov    %ecx,%eax
  50ff8e:	8d 14 c9             	lea    (%ecx,%ecx,8),%edx
  50ff91:	8d 0c d0             	lea    (%eax,%edx,8),%ecx
  50ff94:	8d 0c 88             	lea    (%eax,%ecx,4),%ecx
  50ff97:	c1 e1 02             	shl    $0x2,%ecx
  50ff9a:	8d 0c c8             	lea    (%eax,%ecx,8),%ecx
  50ff9d:	81 c1 df 24 00 00    	add    $0x24df,%ecx
  50ffa3:	89 0d 78 d1 89 00    	mov    %ecx,0x89d178
  50ffa9:	89 4c 24 0c          	mov    %ecx,0xc(%esp)
  50ffad:	c1 4c 24 0c 0d       	rorl   $0xd,0xc(%esp)
  50ffb2:	8b 44 24 0c          	mov    0xc(%esp),%eax
  50ffb6:	24 07                	and    $0x7,%al
  50ffb8:	2c 04                	sub    $0x4,%al
  50ffba:	00 05 30 91 a6 00    	add    %al,0xa69130
  50ffc0:	8b 44 24 0c          	mov    0xc(%esp),%eax
  50ffc4:	8b c8                	mov    %eax,%ecx
  50ffc6:	8d 14 c0             	lea    (%eax,%eax,8),%edx
  50ffc9:	8d 04 d1             	lea    (%ecx,%edx,8),%eax
  50ffcc:	8d 04 81             	lea    (%ecx,%eax,4),%eax
  50ffcf:	c1 e0 02             	shl    $0x2,%eax
  50ffd2:	8d 04 c1             	lea    (%ecx,%eax,8),%eax
  50ffd5:	05 df 24 00 00       	add    $0x24df,%eax
  50ffda:	89 44 24 08          	mov    %eax,0x8(%esp)
  50ffde:	c1 4c 24 08 0d       	rorl   $0xd,0x8(%esp)
  50ffe3:	8b 44 24 08          	mov    0x8(%esp),%eax
  50ffe7:	6a 04                	push   $0x4
  50ffe9:	a3 78 d1 89 00       	mov    %eax,0x89d178
  50ffee:	24 07                	and    $0x7,%al
  50fff0:	2c 04                	sub    $0x4,%al
  50fff2:	00 05 31 91 a6 00    	add    %al,0xa69131
  50fff8:	66 8b 0d 30 91 a6 00 	mov    0xa69130,%cx
  50ffff:	51                   	push   %ecx
  510000:	e8 9b 83 f8 ff       	call   0x4983a0
  510005:	83 c4 08             	add    $0x8,%esp
  510008:	5e                   	pop    %esi
  510009:	83 c4 0c             	add    $0xc,%esp
  51000c:	c3                   	ret
  51000d:	56                   	push   %esi
  51000e:	e8 dd dc fd ff       	call   0x4edcf0
  510013:	83 c4 04             	add    $0x4,%esp
  510016:	5e                   	pop    %esi
  510017:	83 c4 0c             	add    $0xc,%esp
  51001a:	c3                   	ret
