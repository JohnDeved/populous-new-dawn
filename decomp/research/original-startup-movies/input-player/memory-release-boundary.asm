
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0055bdd0 <.text+0x15add0>:
  55bdd0:	83 ec 08             	sub    esp,0x8
  55bdd3:	56                   	push   esi
  55bdd4:	8b 74 24 10          	mov    esi,DWORD PTR [esp+0x10]
  55bdd8:	85 f6                	test   esi,esi
  55bdda:	74 5c                	je     0x55be38
  55bddc:	6a 09                	push   0x9
  55bdde:	e8 2d 22 00 00       	call   0x55e010
  55bde3:	8d 44 24 08          	lea    eax,[esp+0x8]
  55bde7:	8d 4c 24 0c          	lea    ecx,[esp+0xc]
  55bdeb:	83 c4 04             	add    esp,0x4
  55bdee:	50                   	push   eax
  55bdef:	51                   	push   ecx
  55bdf0:	56                   	push   esi
  55bdf1:	e8 1a 71 00 00       	call   0x562f10
  55bdf6:	83 c4 0c             	add    esp,0xc
  55bdf9:	85 c0                	test   eax,eax
  55bdfb:	74 22                	je     0x55be1f
  55bdfd:	8b 4c 24 08          	mov    ecx,DWORD PTR [esp+0x8]
  55be01:	50                   	push   eax
  55be02:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  55be06:	50                   	push   eax
  55be07:	51                   	push   ecx
  55be08:	e8 63 71 00 00       	call   0x562f70
  55be0d:	83 c4 0c             	add    esp,0xc
  55be10:	6a 09                	push   0x9
  55be12:	e8 69 22 00 00       	call   0x55e080
  55be17:	83 c4 04             	add    esp,0x4
  55be1a:	5e                   	pop    esi
  55be1b:	83 c4 08             	add    esp,0x8
  55be1e:	c3                   	ret
  55be1f:	6a 09                	push   0x9
  55be21:	e8 5a 22 00 00       	call   0x55e080
  55be26:	83 c4 04             	add    esp,0x4
  55be29:	a1 80 a8 d0 00       	mov    eax,ds:0xd0a880
  55be2e:	56                   	push   esi
  55be2f:	6a 00                	push   0x0
  55be31:	50                   	push   eax
  55be32:	ff 15 a8 c6 d0 00    	call   DWORD PTR ds:0xd0c6a8
  55be38:	5e                   	pop    esi
  55be39:	83 c4 08             	add    esp,0x8
  55be3c:	c3                   	ret
