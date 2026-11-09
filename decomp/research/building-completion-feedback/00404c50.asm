
native-prerequisites-20261017/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00404c50 <.text+0x3c50>:
  404c50:	8b 44 24 04          	mov    0x4(%esp),%eax
  404c54:	83 ec 04             	sub    $0x4,%esp
  404c57:	66 8b 08             	mov    (%eax),%cx
  404c5a:	66 c1 e9 08          	shr    $0x8,%cx
  404c5e:	66 8b 40 02          	mov    0x2(%eax),%ax
  404c62:	80 e1 fe             	and    $0xfe,%cl
  404c65:	66 c1 e8 08          	shr    $0x8,%ax
  404c69:	88 4c 24 02          	mov    %cl,0x2(%esp)
  404c6d:	24 fe                	and    $0xfe,%al
  404c6f:	88 44 24 03          	mov    %al,0x3(%esp)
  404c73:	66 8b 44 24 02       	mov    0x2(%esp),%ax
  404c78:	83 c4 04             	add    $0x4,%esp
  404c7b:	c3                   	ret
  404c7c:	cc                   	int3
  404c7d:	cc                   	int3
  404c7e:	cc                   	int3
  404c7f:	cc                   	int3
